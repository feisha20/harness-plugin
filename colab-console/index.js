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
        const h3LocalPort = url.searchParams.get('h3LocalPort') || 8188;
        return sendJson(res, 200, await service.getOverview({ localPort, h3LocalPort }));
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
      if (method === 'POST' && subPath === '/h3/deploy') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, await service.startH3Deploy(body));
      }
      if (method === 'GET' && subPath === '/h3/deploy/status') {
        return sendJson(res, 200, service.getH3DeployStatus());
      }
      if (method === 'POST' && subPath === '/h3/deploy/cancel') {
        return sendJson(res, 200, service.cancelH3Deploy());
      }
      if (method === 'POST' && subPath === '/h3/deploy/retry') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, await service.retryH3Deploy(body));
      }
      if (method === 'POST' && subPath === '/h3/inspect') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, await service.inspectH3Service(body));
      }
      if (method === 'POST' && subPath === '/h3/start') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, await service.startComfyui(body));
      }
      if (method === 'POST' && subPath === '/h3/stop') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, await service.stopComfyui(body));
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
      description: '查询与管理 Google Colab 计算单元额度、活跃会话、远端 vLLM 与 MiniMax-H3 视频 ComfyUI / SSH 隧道服务。',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: [
              'overview',
              'inspect_service',
              'deploy_qwen',
              'deploy_status',
              'deploy_cancel',
              'deploy_retry',
              'start_vllm',
              'stop_vllm',
              'deploy_h3',
              'h3_deploy_status',
              'h3_deploy_cancel',
              'h3_deploy_retry',
              'inspect_h3',
              'start_comfyui',
              'stop_comfyui',
              'start_tunnel',
              'stop_tunnel',
              'restart_tunnel',
              'test_inference',
            ],
            description: '操作类型',
          },
          sessionName: { type: 'string', description: 'Colab 会话名（如 g4 / a100 / h100 / l4）' },
          localPort: { type: 'number', description: '本机转发端口（vLLM 默认 8000，ComfyUI 默认 8188）' },
          remotePort: { type: 'number', description: '远端服务端口（vLLM 默认 8000，ComfyUI 默认 8188）' },
          probePath: { type: 'string', description: '隧道保活探测路径（/v1/models 或 /system_stats）' },
          model: { type: 'string', description: '测试推理或启动服务的模型名' },
          preset: { type: 'string', description: 'MiniMax-H3 无审核预设（uncensored-fp8-turbo / uncensored-prism-8step / uncensored-gguf-q5-turbo）' },
          gpu: { type: 'string', description: '新建实例的 GPU 规格，如 L4 / G4 / A100 / H100' },
          fallbackGpus: { type: 'string', description: '主选 GPU 不可用时的备选顺序（逗号分隔，如 G4,A100）' },
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
            return service.getOverview({ localPort: args.localPort || 8000, h3LocalPort: 8188 });
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
          case 'deploy_h3':
            return service.startH3Deploy({
              sessionName: args.sessionName || 'l4',
              gpu: args.gpu || 'L4',
              fallbackGpus: args.fallbackGpus !== undefined ? args.fallbackGpus : ['G4', 'A100'],
              preset: args.preset || 'uncensored-fp8-turbo',
              localPort: args.localPort || 8188,
              remotePort: args.remotePort || 8188,
            });
          case 'h3_deploy_status':
            return service.getH3DeployStatus();
          case 'h3_deploy_cancel':
            return service.cancelH3Deploy();
          case 'h3_deploy_retry':
            return service.retryH3Deploy({ fromStep: args.fromStep });
          case 'inspect_h3':
            return service.inspectH3Service({
              sessionName: args.sessionName,
              localPort: args.localPort || 8188,
              remotePort: args.remotePort || 8188,
            });
          case 'start_comfyui':
            return service.startComfyui({ sessionName: args.sessionName, remotePort: args.remotePort || 8188 });
          case 'stop_comfyui':
            return service.stopComfyui({ sessionName: args.sessionName });
          case 'start_tunnel':
            return service.startTunnel({
              sessionName: args.sessionName,
              localPort: args.localPort || 8000,
              remotePort: args.remotePort || args.localPort || 8000,
              probePath: args.probePath,
            });
          case 'stop_tunnel':
            return service.stopTunnel({ localPort: args.localPort || 8000 });
          case 'restart_tunnel':
            return service.restartTunnel({
              sessionName: args.sessionName,
              localPort: args.localPort || 8000,
              remotePort: args.remotePort || args.localPort || 8000,
              probePath: args.probePath,
            });
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
