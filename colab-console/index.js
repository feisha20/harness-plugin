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
      if (method === 'POST' && subPath === '/service/tunnel/start') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, await service.startTunnel(body));
      }
      if (method === 'POST' && subPath === '/service/tunnel/stop') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, await service.stopTunnel(body));
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
            enum: ['overview', 'inspect_service', 'start_vllm', 'stop_vllm', 'start_tunnel', 'stop_tunnel', 'test_inference'],
            description: '操作类型',
          },
          sessionName: { type: 'string', description: 'Colab 会话名（如 g4）' },
          localPort: { type: 'number', description: '本机转发端口，默认 8000' },
          model: { type: 'string', description: '测试推理或启动服务的模型名' },
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
          case 'start_vllm':
            return service.startVllm({ sessionName: args.sessionName });
          case 'stop_vllm':
            return service.stopVllm({ sessionName: args.sessionName });
          case 'start_tunnel':
            return service.startTunnel({ sessionName: args.sessionName, localPort: args.localPort || 8000 });
          case 'stop_tunnel':
            return service.stopTunnel({ localPort: args.localPort || 8000 });
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
