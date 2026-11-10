import fs from 'node:fs';
import path from 'node:path';
import { fetchSessionsForDate, fetchMessagesBatch, fetchMessagesForSession } from './api.js';
import { extractEvaluationDataset, exportFormat, isNoiseSession } from './evaluator.js';

export const inject = ['webServer', 'tools'];

// In-memory cache for extracted evaluation datasets
const datasetCache = new Map();

function getYesterdayStr() {
  const d = new Date(Date.now() - 86400000);
  return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });
}

export async function getOrExtractDataset(dateStr, force = false, minScore = 60) {
  const date = dateStr || getYesterdayStr();
  const cacheKey = `${date}_${minScore}`;

  if (!force && datasetCache.has(cacheKey)) {
    return datasetCache.get(cacheKey);
  }

  // Also check disk cache in /tmp
  const diskCacheFile = path.join('/tmp', `kuaibuddy_eval_dataset_${date}.json`);
  if (!force && fs.existsSync(diskCacheFile)) {
    try {
      const content = fs.readFileSync(diskCacheFile, 'utf8');
      const parsed = JSON.parse(content);
      datasetCache.set(cacheKey, parsed);
      return parsed;
    } catch {}
  }

  // Fetch raw sessions
  const sessions = await fetchSessionsForDate(date);
  const candidates = sessions.filter(s => !isNoiseSession(s));

  // Extract messages for candidate sessions (fetch up to 100 candidate sessions)
  const targetSessions = candidates.slice(0, 100);
  const sessionIds = targetSessions.map(s => s.sessionId);
  const messagesMap = await fetchMessagesBatch(sessionIds, 8);

  const dataset = extractEvaluationDataset(sessions, messagesMap, minScore);
  const result = {
    date,
    readAt: new Date().toISOString(),
    summary: dataset.summary,
    cases: dataset.cases
  };

  datasetCache.set(cacheKey, result);

  try {
    fs.writeFileSync(diskCacheFile, JSON.stringify(result), 'utf8');
  } catch {}

  return result;
}

export function apply(ctx) {
  // 1. Register DSH Tool for Agent invocation
  ctx.effect(() => ctx.tools.register({
    name: 'kuaibuddy_eval_dataset',
    description: '获取 KuaiBuddy 客服系统前一天（或指定日期）的对话记录，并自动评估提取有价值的对话作为评测集（支持按分类、评分筛选与导出）。',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'detail', 'export'],
          description: '操作类型: list 查看提取的评测集概览; detail 查看单条会话详情; export 导出评测集'
        },
        date: {
          type: 'string',
          description: '指定查询日期 YYYY-MM-DD，留空则默认前一天（昨天）'
        },
        minScore: {
          type: 'number',
          description: '最低价值分数阈值 (0-100)，默认 60'
        },
        category: {
          type: 'string',
          description: '按分类筛选 (如: 异常排障与诊断、配置与操作指导、业务概念与规则、工具调用评测)'
        },
        sessionId: {
          type: 'string',
          description: 'detail 操作时指定的会话 ID'
        },
        format: {
          type: 'string',
          enum: ['json', 'jsonl', 'alpaca'],
          description: 'export 操作时指定的格式'
        },
        limit: {
          type: 'number',
          description: '返回数量上限，默认 20'
        }
      },
      required: ['action'],
      additionalProperties: false
    },
    output: {
      schema: { type: 'object' },
      render: (_, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }]
    },
    async execute(args) {
      const date = args.date || getYesterdayStr();
      const minScore = args.minScore || 60;

      if (args.action === 'list') {
        const data = await getOrExtractDataset(date, false, minScore);
        let cases = data.cases;
        if (args.category) {
          cases = cases.filter(c => c.category === args.category);
        }
        const limit = args.limit || 20;
        return {
          date: data.date,
          summary: data.summary,
          returnedCount: Math.min(limit, cases.length),
          cases: cases.slice(0, limit).map(c => ({
            id: c.id,
            sessionId: c.sessionId,
            title: c.title,
            category: c.category,
            valueScore: c.valueScore,
            valueReasons: c.valueReasons,
            toolNames: c.toolNames,
            prompt: c.userPrompt,
            referenceAnswerPreview: c.referenceAnswer.slice(0, 120),
            turnsCount: c.turnsCount,
            toolCallsCount: c.toolCallsCount
          }))
        };
      }

      if (args.action === 'detail') {
        if (!args.sessionId) throw new Error('detail 操作需要提供 sessionId');
        const msgs = await fetchMessagesForSession(args.sessionId, 100);
        return {
          sessionId: args.sessionId,
          messagesCount: msgs.length,
          messages: msgs
        };
      }

      if (args.action === 'export') {
        const data = await getOrExtractDataset(date, false, minScore);
        let cases = data.cases;
        if (args.category) {
          cases = cases.filter(c => c.category === args.category);
        }
        const limit = args.limit || cases.length;
        const exported = exportFormat(cases.slice(0, limit), args.format || 'json');
        return {
          format: args.format || 'json',
          count: Math.min(limit, cases.length),
          content: exported
        };
      }

      throw new Error(`不支持的操作: ${args.action}`);
    }
  }));

  // 2. Register Web Server Endpoint for Web UI
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/api/eval-dataset',
    async handler(req, res) {
      const send = (status, body) => {
        res.writeHead(status, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff'
        });
        res.end(JSON.stringify(body));
      };

      if (!['GET', 'POST'].includes(req.method)) {
        return send(405, { error: '请求方法无效' });
      }

      if (req.headers['sec-fetch-site'] === 'cross-site' || (req.headers.origin && req.headers.origin !== ctx.webServer.getOrigin())) {
        return send(403, { error: '请从 DSH 看板访问' });
      }

      const q = new URL(req.url, 'http://localhost').searchParams;
      const action = q.get('action') || 'get_data';
      const date = q.get('date') || getYesterdayStr();

      try {
        if (action === 'get_data') {
          const force = q.get('force') === 'true';
          const minScore = Number(q.get('minScore')) || 60;
          const data = await getOrExtractDataset(date, force, minScore);
          return send(200, data);
        }

        if (action === 'extract') {
          const minScore = Number(q.get('minScore')) || 60;
          const data = await getOrExtractDataset(date, true, minScore);
          return send(200, data);
        }

        if (action === 'detail') {
          const sessionId = q.get('sessionId');
          if (!sessionId) return send(400, { error: '缺少 sessionId' });
          const messages = await fetchMessagesForSession(sessionId, 100);
          return send(200, { sessionId, messages });
        }

        if (action === 'export' && req.method === 'POST') {
          let raw = '';
          for await (const chunk of req) {
            raw += chunk;
            if (raw.length > 1024 * 1024) throw new Error('请求体过大');
          }
          const body = JSON.parse(raw || '{}');
          const format = body.format || 'json';
          const cases = body.cases || [];
          const text = exportFormat(cases, format);
          return send(200, { format, count: cases.length, content: text });
        }

        return send(400, { error: `未知操作: ${action}` });
      } catch (err) {
        console.error('[eval-dataset] Handler error:', err);
        return send(500, { error: err.message || '内部服务错误' });
      }
    }
  }));
}
