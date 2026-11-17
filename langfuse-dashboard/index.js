import { LangfuseStore, normalizeBaseUrl } from './store.js';
import {
  fetchSingleTrace,
  formatTraceSummaryForAgent,
  queryTraces,
  testConnection,
} from './langfuse.js';

export const inject = ['webServer', 'tools'];

const API_PREFIX = '/api/langfuse-dashboard';

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(body));
}

async function readJsonBody(req, maxBytes = 256 * 1024) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) {
      throw new Error('请求体超出大小限制');
    }
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('请求体不是有效的 JSON');
  }
}

export function apply(ctx) {
  const store = new LangfuseStore(ctx);

  async function resolveEnvInputForTest(body) {
    const id = String(body?.id || '').trim();
    const stored = id
      ? await store.getEnvironmentWithSecrets(id).catch(() => null)
      : null;
    const baseUrl = normalizeBaseUrl(body?.baseUrl || stored?.baseUrl || '');
    const publicKey = String(body?.publicKey || stored?.publicKey || '').trim();
    const secretKey = String(body?.secretKey || stored?.secretKey || '').trim();
    if (!publicKey || !secretKey) {
      throw new Error('请填写 Public Key 与 Secret Key 后再测试连接');
    }
    return { id, baseUrl, publicKey, secretKey };
  }

  ctx.effect(() =>
    ctx.tools.register({
      name: 'langfuse_query_trace',
      description:
        '查询已配置 Langfuse 环境中的 Trace 详情，支持列出已配置环境、按 run_id / session_id / trace_id 检索或拉取最近 Trace。',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['list_environments', 'query_by_run_id', 'query_by_session_id', 'query_by_trace_id', 'recent_traces'],
            description: '查询操作类型',
          },
          envId: {
            type: 'string',
            description: '目标环境 ID 或名称，省略时使用当前默认环境',
          },
          query: {
            type: 'string',
            description: '查询值（run_id / sessionId / traceId）',
          },
          fromStartTime: {
            type: 'string',
            description: '可选起始时间（ISO-8601）',
          },
          toStartTime: {
            type: 'string',
            description: '可选结束时间（ISO-8601）',
          },
        },
        required: ['action'],
        additionalProperties: false,
      },
      output: {
        schema: { type: 'object' },
        render: (_, value) => [{ type: 'text', text: JSON.stringify(value) }],
      },
      async execute(args) {
        if (args.action === 'list_environments') {
          const state = await store.getPublicState();
          return {
            activeEnvId: state.activeEnvId,
            environments: state.environments.map(({ publicKey: _pk, ...rest }) => rest),
          };
        }

        const state = await store.getPublicState();
        let targetEnvId = args.envId;
        if (targetEnvId && !state.environments.some((e) => e.id === targetEnvId)) {
          const byName = state.environments.find((e) => e.name === targetEnvId);
          if (byName) targetEnvId = byName.id;
        }
        const env = await store.getEnvironmentWithSecrets(targetEnvId);

        if (args.action === 'recent_traces') {
          const res = await queryTraces(env, { mode: 'recent' });
          return {
            envName: env.name,
            projectName: env.projectName,
            durationMs: res.durationMs,
            traces: res.traces.map(formatTraceSummaryForAgent),
          };
        }

        const modeMap = {
          query_by_run_id: 'run_id',
          query_by_session_id: 'session_id',
          query_by_trace_id: 'trace_id',
        };
        const mode = modeMap[args.action];
        if (!mode) throw new Error(`未知操作: ${args.action}`);

        const res = await queryTraces(env, {
          query: args.query,
          mode,
          fromStartTime: args.fromStartTime,
          toStartTime: args.toStartTime,
        });
        return {
          envName: env.name,
          projectName: env.projectName,
          resolvedMode: res.resolvedMode,
          durationMs: res.durationMs,
          totalObservations: res.totalObservations,
          truncated: res.truncated,
          traces: res.traces.map(formatTraceSummaryForAgent),
        };
      },
    }),
  );

  ctx.effect(() =>
    ctx.webServer.register({
      kind: 'prefix',
      path: API_PREFIX,
      async handler(req, res) {
        if (
          req.headers['sec-fetch-site'] === 'cross-site' ||
          (req.headers.origin && req.headers.origin !== ctx.webServer.getOrigin())
        ) {
          return sendJson(res, 403, { error: '请从 DSH 看板访问' });
        }

        const url = new URL(req.url || '/', 'http://127.0.0.1');
        let subPath = url.pathname;
        if (subPath.startsWith(API_PREFIX)) {
          subPath = subPath.slice(API_PREFIX.length) || '/';
        }
        const method = (req.method || 'GET').toUpperCase();

        try {
          if (method === 'GET' && (subPath === '/' || subPath === '/state')) {
            return sendJson(res, 200, await store.getPublicState());
          }

          if (method !== 'POST') {
            return sendJson(res, 405, { error: '请求方法无效' });
          }
          const body = await readJsonBody(req);

          if (subPath === '/env/test') {
            const candidate = await resolveEnvInputForTest(body);
            const probe = await testConnection(candidate);
            if (candidate.id) {
              await store.updateEnvironmentMeta(candidate.id, {
                projectId: probe.projectId,
                projectName: probe.projectName,
                orgName: probe.orgName,
                lastTestedAt: new Date().toISOString(),
                lastTestOk: true,
                lastTestMessage: `连接成功 (${probe.latencyMs}ms)`,
              });
            }
            return sendJson(res, 200, probe);
          }

          if (subPath === '/env/save') {
            let probe = null;
            if (body?.autoTest !== false) {
              try {
                const candidate = await resolveEnvInputForTest(body);
                probe = await testConnection(candidate);
              } catch (err) {
                probe = { ok: false, error: err?.message || '连接测试失败' };
              }
            }
            const nextState = await store.saveEnvironment({
              ...body,
              ...(probe?.ok
                ? {
                    projectId: probe.projectId,
                    projectName: probe.projectName,
                    orgName: probe.orgName,
                    lastTestedAt: new Date().toISOString(),
                    lastTestOk: true,
                    lastTestMessage: `连接成功 (${probe.latencyMs}ms)`,
                  }
                : probe
                  ? {
                      lastTestedAt: new Date().toISOString(),
                      lastTestOk: false,
                      lastTestMessage: probe.error,
                    }
                  : {}),
            });
            return sendJson(res, 200, { state: nextState, testResult: probe });
          }

          if (subPath === '/env/select') {
            return sendJson(res, 200, await store.selectEnvironment(body?.envId));
          }

          if (subPath === '/env/delete') {
            return sendJson(res, 200, await store.deleteEnvironment(body?.envId));
          }

          if (subPath === '/history/clear') {
            store.clearHistory();
            return sendJson(res, 200, await store.getPublicState());
          }

          if (subPath === '/query') {
            const env = await store.getEnvironmentWithSecrets(body?.envId);
            const result = await queryTraces(env, {
              query: body?.query,
              mode: body?.mode || 'auto',
              fromStartTime: body?.fromStartTime,
              toStartTime: body?.toStartTime,
            });
            if (body?.saveHistory !== false && result.query && result.traces.length > 0) {
              const first = result.traces[0];
              store.addHistory({
                envId: env.id,
                query: result.query,
                mode: result.mode,
                resolvedMode: result.resolvedMode,
                traceCount: result.traces.length,
                label: first?.userPrompt || first?.title || '',
              });
            }
            return sendJson(res, 200, {
              ...result,
              envId: env.id,
              envName: env.name,
              projectName: env.projectName,
              history: store.state.history,
            });
          }

          if (subPath === '/recent') {
            const env = await store.getEnvironmentWithSecrets(body?.envId);
            const result = await queryTraces(env, {
              mode: 'recent',
              fromStartTime: body?.fromStartTime,
              toStartTime: body?.toStartTime,
            });
            return sendJson(res, 200, {
              ...result,
              envId: env.id,
              envName: env.name,
              projectName: env.projectName,
            });
          }

          if (subPath === '/trace') {
            const env = await store.getEnvironmentWithSecrets(body?.envId);
            const result = await fetchSingleTrace(env, body?.traceId);
            return sendJson(res, 200, {
              ...result,
              envId: env.id,
              envName: env.name,
            });
          }

          return sendJson(res, 404, { error: '接口路径不存在' });
        } catch (err) {
          return sendJson(res, 400, { error: err?.message || '操作失败' });
        }
      },
    }),
  );
}
