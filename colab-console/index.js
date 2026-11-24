import { ColabConsoleService } from './service.js';

export const inject = ['webServer', 'tools'];

const API_PREFIX = '/api/colab-console';

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
    if (size > maxBytes) throw new Error('请求体超出大小限制');
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

function createHttpHandler(service) {
  return async (req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    let subPath = url.pathname;
    if (subPath.startsWith(API_PREFIX)) {
      subPath = subPath.slice(API_PREFIX.length) || '/';
    }
    const method = (req.method || 'GET').toUpperCase();

    try {
      if (method === 'GET' && subPath === '/overview') {
        const localPort = url.searchParams.get('localPort') || 8000;
        return sendJson(res, 200, await service.getOverview({ localPort }));
      }
      if (method === 'POST' && subPath === '/sessions/new') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, await service.createSession(body));
      }
      if (method === 'POST' && subPath === '/sessions/stop') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, await service.stopSession(body));
      }
      if (method === 'POST' && subPath === '/sessions/url') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, await service.getSessionUrl(body));
      }
      if (method === 'POST' && subPath === '/service/inspect') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, await service.inspectService(body));
      }
      if (method === 'POST' && subPath === '/service/vllm/start') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, await service.startVllm(body));
      }
      if (method === 'POST' && subPath === '/service/vllm/stop') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, await service.stopVllm(body));
      }
      if (method === 'POST' && subPath === '/service/deploy') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, await service.startDeploy(body));
      }
      if (method === 'GET' && subPath === '/service/deploy/status') {
        return sendJson(res, 200, service.getDeployStatus());
      }
      if (method === 'POST' && subPath === '/service/deploy/cancel') {
        return sendJson(res, 200, service.cancelDeploy());
      }
      if (method === 'POST' && subPath === '/service/deploy/retry') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, await service.retryDeploy(body));
      }
      if (method === 'POST' && subPath === '/service/tunnel/start') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, await service.startTunnel(body));
      }
      if (method === 'POST' && subPath === '/service/tunnel/stop') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, await service.stopTunnel(body));
      }
      if (method === 'POST' && subPath === '/service/tunnel/restart') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, await service.restartTunnel(body));
      }
      if (method === 'POST' && subPath === '/service/test') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, await service.testInference(body));
      }
      return sendJson(res, 404, { error: '接口路径不存在' });
    } catch (err) {
      return sendJson(res, 400, { error: err?.message || '操作失败' });
    }
  };
}

export function apply(ctx) {
  const service = new ColabConsoleService();

  ctx.effect(() =>
    ctx.tools.register({
      name: 'colab_console',
      description: '查询与管理 Google Colab 计算单元额度、活跃会话及远端 vLLM / SSH 隧道服务。',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['overview', 'inspect_service', 'deploy_qwen', 'deploy_status', 'deploy_cancel', 'deploy_retry', 'start_vllm', 'stop_vllm', 'start_tunnel', 'stop_tunnel', 'restart_tunnel', 'test_inference'],
            description: '操作类型',
          },
          sessionName: { type: 'string', description: 'Colab 会话名（如 g4 / a100 / h100）' },
          localPort: { type: 'number', description: '本机转发端口，默认 8000' },
          model: { type: 'string', description: '测试推理或启动服务的模型名' },
          gpu: { type: 'string', description: '新建实例的 GPU 规格，如 G4 / A100 / H100' },
          fallbackGpus: { type: 'string', description: '主选 GPU 不可用时的备选顺序（逗号分隔，如 A100,H100）' },
          kvCacheDtype: { type: 'string', description: 'KV Cache 类型（smart / fp8 / auto）' },
          fromStep: { type: 'string', description: '重试时的起始步骤（session / bootstrap / waiting_api / tunnel）' },
        },
        required: ['action'],
        additionalProperties: false,
      },
      output: {
        schema: { type: 'object' },
        render: (_, value) => [{ type: 'text', text: JSON.stringify(value) }],
      },
      async execute(args) {
        switch (args.action) {
          case 'overview':
            return service.getOverview({ localPort: args.localPort || 8000 });
          case 'inspect_service':
            return service.inspectService({ sessionName: args.sessionName, localPort: args.localPort || 8000 });
          case 'deploy_qwen':
            return service.startDeploy({
              sessionName: args.sessionName || 'g4',
              gpu: args.gpu || 'G4',
              fallbackGpus: args.fallbackGpus !== undefined ? args.fallbackGpus : ['A100'],
              kvCacheDtype: args.kvCacheDtype || 'smart',
              localPort: args.localPort || 8000,
              model: args.model,
            });
          case 'deploy_status':
            return service.getDeployStatus();
          case 'deploy_cancel':
            return service.cancelDeploy();
          case 'deploy_retry':
            return service.retryDeploy({ fromStep: args.fromStep });
          case 'start_vllm':
            return service.startVllm({ sessionName: args.sessionName, kvCacheDtype: args.kvCacheDtype || 'smart' });
          case 'stop_vllm':
            return service.stopVllm({ sessionName: args.sessionName });
          case 'start_tunnel':
            return service.startTunnel({ sessionName: args.sessionName, localPort: args.localPort || 8000 });
          case 'stop_tunnel':
            return service.stopTunnel({ localPort: args.localPort || 8000 });
          case 'restart_tunnel':
            return service.restartTunnel({ sessionName: args.sessionName, localPort: args.localPort || 8000 });
          case 'test_inference':
            return service.testInference({ localPort: args.localPort || 8000, model: args.model || 'qwen38-27b-nb' });
          default:
            throw new Error(`未知操作: ${args.action}`);
        }
      },
    }),
  );

  const handler = createHttpHandler(service);
  ctx.effect(() =>
    ctx.webServer.register({
      kind: 'prefix',
      path: API_PREFIX,
      handler,
    }),
  );
}
