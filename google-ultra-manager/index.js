import { UltraService } from './service.js';

export const inject = ['webServer', 'tools'];

const API_PREFIX = '/api/google-ultra-manager';

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

function createHttpHandler(service) {
  return async (req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    let subPath = url.pathname;
    if (subPath.startsWith(API_PREFIX)) {
      subPath = subPath.slice(API_PREFIX.length) || '/';
    }
    const method = (req.method || 'GET').toUpperCase();

    try {
      if (method === 'GET' && subPath === '/state') {
        return sendJson(res, 200, service.getDashboardState());
      }
      if (method === 'POST' && subPath === '/account/select') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, service.selectAccount(body.accountId));
      }
      if (method === 'POST' && subPath === '/account/save') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, service.saveAccount(body));
      }
      if (method === 'POST' && subPath === '/benefit/save') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, service.saveBenefit(body.accountId, body.benefit));
      }
      if (method === 'POST' && subPath === '/benefit/delete') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, service.removeBenefit(body.accountId, body.benefitId));
      }
      if (method === 'POST' && subPath === '/usage/log') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, service.logUsage(body.accountId, body.entry));
      }
      if (method === 'POST' && subPath === '/usage/delete') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, service.removeUsageLog(body.accountId, body.logId));
      }
      if (method === 'POST' && subPath === '/estimate') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, service.estimateGpuCost(body));
      }
      if (method === 'POST' && subPath === '/sync-storage') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, await service.syncFromGoogleOne({ accountId: body.accountId }));
      }
      if (method === 'POST' && subPath === '/sync-colab') {
        const body = await readJsonBody(req);
        const result = await service.syncFromColab({ accountId: body.accountId });
        return sendJson(res, 200, result);
      }
      return sendJson(res, 404, { error: '接口路径不存在' });
    } catch (err) {
      const msg = err?.message || '操作失败';
      return sendJson(res, 400, { error: msg });
    }
  };
}

export function apply(ctx) {
  const service = new UltraService(ctx);

  ctx.effect(() =>
    ctx.tools.register({
      name: 'google_ultra_quota',
      description:
        '查询与管理 Google AI Ultra 订阅信息、Colab Pro+ 计算单元余额、会员权益配额及 GPU 消耗记录，并支持通过 ego-browser 实时同步 Colab 计算单元余额。',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: [
              'status',
              'sync_colab',
              'update_account',
              'update_benefit',
              'log_usage',
              'estimate',
            ],
            description: '操作类型',
          },
          accountId: { type: 'string', description: '账号 ID，省略时使用当前激活账号' },
          balance: { type: 'number', description: '手动校准计算单元余额（update_account）' },
          burnRatePerHour: { type: 'number', description: '当前每小时消耗计算单元数（update_account）' },
          activeSessions: { type: 'number', description: '当前有效会话数（update_account）' },
          gpuId: { type: 'string', description: 'GPU 型号（T4 / L4 / A100 / G4 / H100 / TPU_V6E）' },
          hours: { type: 'number', description: '运行时长（小时）' },
          title: { type: 'string', description: '使用记录标题（log_usage）' },
          unitsDelta: { type: 'number', description: '计算单元变动量，消耗填负数如 -12.5（log_usage）' },
          note: { type: 'string', description: '备注' },
          benefitId: { type: 'string', description: '权益项 ID（update_benefit）' },
          benefitName: { type: 'string', description: '权益项名称（update_benefit）' },
          used: { type: 'number', description: '已用额度（update_benefit）' },
          limit: { type: 'number', description: '总额度（update_benefit）' },
          unit: { type: 'string', description: '额度单位（update_benefit）' },
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
          case 'status':
            return service.getDashboardState();
          case 'sync_colab':
            return service.syncFromColab({ accountId: args.accountId });
          case 'update_account':
            return service.saveAccount({
              id: args.accountId || service.store.getActiveAccount().id,
              ...(args.note !== undefined ? { notes: args.note } : {}),
              ...(args.balance !== undefined ||
              args.burnRatePerHour !== undefined ||
              args.activeSessions !== undefined
                ? {
                    computeUnits: {
                      ...(args.balance !== undefined ? { balance: args.balance } : {}),
                      ...(args.burnRatePerHour !== undefined ? { burnRatePerHour: args.burnRatePerHour } : {}),
                      ...(args.activeSessions !== undefined ? { activeSessions: args.activeSessions } : {}),
                      lastSyncedAt: new Date().toISOString(),
                      source: 'agent-tool',
                    },
                  }
                : {}),
            });
          case 'update_benefit':
            return service.saveBenefit(args.accountId, {
              id: args.benefitId,
              name: args.benefitName,
              used: args.used,
              limit: args.limit,
              unit: args.unit,
              notes: args.note,
            });
          case 'log_usage':
            return service.logUsage(args.accountId, {
              type: 'manual',
              title: args.title || '手动记录算力消耗',
              gpu: args.gpuId || '',
              hours: args.hours || 0,
              unitsDelta: args.unitsDelta ?? 0,
              note: args.note || '',
            });
          case 'estimate':
            return service.estimateGpuCost({
              gpuId: args.gpuId,
              hours: args.hours,
              accountId: args.accountId,
            });
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
