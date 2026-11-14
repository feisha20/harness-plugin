import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  fetchSessionsForDate,
  fetchMessagesBatch,
  fetchMessagesForSession,
  getConfig,
  saveConfig,
  getCredentials,
  getOfficialDataset,
  saveOfficialDataset,
  addOfficialCases,
  removeOfficialCases,
  updateOfficialCase,
  getStorageDir,
  writeJsonAtomic
} from './api.js';
import { extractEvaluationDataset, exportFormat, isNoiseSession, isFollowupMessage, isStepMessage } from './evaluator.js';
import { regressionManager } from './regression.js';

export const inject = ['webServer', 'tools'];

// Bump when step / model-interaction metrics semantics change so cached /tmp files recompute offline
const METRICS_VERSION = 3;

// In-memory cache for extracted evaluation datasets
const datasetCache = new Map();

function getYesterdayStr() {
  const d = new Date(Date.now() - 86400000);
  return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });
}

function formatDurationLabel(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return '0s';
  if (ms < 1000) return '<1s';
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
}

function computeSingleTurnStats(msgs) {
  if (!Array.isArray(msgs) || msgs.length === 0) {
    return { turnCount: 0, execSteps: 0, durationMs: 0, durationLabel: '' };
  }
  const turns = [];
  let currentTurn = null;
  for (const m of msgs) {
    if (!m || isFollowupMessage(m)) continue;
    if (m.role === 'user' || !currentTurn) {
      currentTurn = { steps: 0, minTs: Infinity, maxTs: -Infinity };
      turns.push(currentTurn);
    }
    if (isStepMessage(m)) {
      currentTurn.steps += 1;
    }
    const ts = m.createdAt ? Date.parse(m.createdAt) : NaN;
    if (Number.isFinite(ts)) {
      if (ts < currentTurn.minTs) currentTurn.minTs = ts;
      if (ts > currentTurn.maxTs) currentTurn.maxTs = ts;
    }
  }
  if (turns.length === 0) {
    return { turnCount: 0, execSteps: 0, durationMs: 0, durationLabel: '' };
  }
  let bestTurn = turns[0];
  for (const t of turns) {
    const tDur = Number.isFinite(t.minTs) && Number.isFinite(t.maxTs) ? Math.max(0, t.maxTs - t.minTs) : 0;
    const bDur = Number.isFinite(bestTurn.minTs) && Number.isFinite(bestTurn.maxTs) ? Math.max(0, bestTurn.maxTs - bestTurn.minTs) : 0;
    if (t.steps > bestTurn.steps || (t.steps === bestTurn.steps && tDur > bDur)) {
      bestTurn = t;
    }
  }
  const durationMs = Number.isFinite(bestTurn.minTs) && Number.isFinite(bestTurn.maxTs)
    ? Math.max(0, bestTurn.maxTs - bestTurn.minTs)
    : 0;
  return {
    turnCount: turns.length,
    execSteps: bestTurn.steps,
    durationMs,
    durationLabel: Number.isFinite(bestTurn.minTs) ? formatDurationLabel(durationMs) : ''
  };
}

function buildDatasetResult(sessions, messagesMap, date, currentEnv, envName, minScore, failedSessionIds = []) {
  const dataset = extractEvaluationDataset(sessions, messagesMap, minScore);
  const caseBySession = new Map((dataset.cases || []).map(c => [c.sessionId, c]));
  const badcaseBySession = new Map((dataset.badcases || []).map(b => [b.sessionId, b]));

  const rawSessions = sessions.map(s => {
    const msgs = messagesMap.get(s.sessionId) || [];
    const visibleMsgs = msgs.filter(m => !isFollowupMessage(m));
    const firstUser = visibleMsgs.find(m => m.role === 'user');
    const prompt = firstUser?.content || s.title || '';
    const runIds = [...new Set(visibleMsgs.map(m => m.runId).filter(Boolean))];
    const matchedCase = caseBySession.get(s.sessionId);
    const matchedBadcase = badcaseBySession.get(s.sessionId);
    const turnStats = computeSingleTurnStats(msgs);
    return {
      id: s.sessionId,
      sessionId: s.sessionId,
      threadId: s.threadId || '',
      runId: runIds[0] || s.runId || '',
      userId: s.userId,
      compId: s.compId ?? s.companyId ?? '',
      companyId: s.compId ?? s.companyId ?? '',
      createdAt: s.createdAt || '',
      model: s.modelId || s.model || '',
      rawTitle: s.title ?? '',
      title: s.title || prompt.slice(0, 60) || s.sessionId,
      userPrompt: prompt,
      isNoise: isNoiseSession(s),
      caseCategory: matchedCase ? matchedCase.category : '',
      badcaseTypeName: matchedBadcase ? matchedBadcase.badcaseTypeName : '',
      messageCount: visibleMsgs.length,
      turnCount: turnStats.turnCount,
      execSteps: turnStats.execSteps,
      durationMs: turnStats.durationMs,
      durationLabel: turnStats.durationLabel,
      messages: msgs
    };
  });

  return {
    metricsVersion: METRICS_VERSION,
    minScore,
    failedSessionIds,
    date,
    env: currentEnv,
    envName,
    readAt: new Date().toISOString(),
    summary: dataset.summary,
    cases: dataset.cases,
    badcases: dataset.badcases || [],
    rawSessions
  };
}

function rebuildFromRawSessions(rawSessions) {
  const rebuiltMessagesMap = new Map();
  const rebuiltSessions = rawSessions.map(rs => {
    rebuiltMessagesMap.set(rs.sessionId, Array.isArray(rs.messages) ? rs.messages : []);
    const preservedTitle = rs.rawTitle !== undefined
      ? rs.rawTitle
      : ((rs.isNoise && !isNoiseSession(rs)) ? '' : rs.title);
    return {
      sessionId: rs.sessionId,
      threadId: rs.threadId || '',
      runId: rs.runId || '',
      userId: rs.userId,
      compId: rs.compId ?? rs.companyId ?? '',
      companyId: rs.compId ?? rs.companyId ?? '',
      createdAt: rs.createdAt || '',
      modelId: rs.model || '',
      title: preservedTitle
    };
  });
  return { rebuiltSessions, rebuiltMessagesMap };
}

export async function getOrExtractDataset(dateStr, force = false, minScore = 60, targetEnv, overrideCreds) {
  const date = dateStr || getYesterdayStr();
  const effectiveMinScore = Number.isFinite(minScore) ? minScore : 60;
  const creds = getCredentials(targetEnv, overrideCreds);
  const currentEnv = creds.env;
  const credHash = crypto.createHash('sha256').update(`${creds.url}|${creds.key}`).digest('hex').slice(0, 10);
  const cacheKey = `${currentEnv}_${credHash}_${date}_${effectiveMinScore}`;

  const cacheDir = path.join(getStorageDir(), 'cache');
  const diskCacheFile = path.join(cacheDir, `kuaibuddy_eval_${currentEnv}_${credHash}_${date}.json`);
  const legacyDiskCacheFile = path.join('/tmp', `kuaibuddy_eval_${currentEnv}_${date}.json`);

  if (!force && datasetCache.has(cacheKey)) {
    const memCached = datasetCache.get(cacheKey);
    if (!Array.isArray(memCached.failedSessionIds) || memCached.failedSessionIds.length === 0) {
      return memCached;
    }
  }

  // Check disk cache (with legacy /tmp fallback)
  const candidateDiskFile = fs.existsSync(diskCacheFile)
    ? diskCacheFile
    : (fs.existsSync(legacyDiskCacheFile) ? legacyDiskCacheFile : null);

  if (!force && candidateDiskFile) {
    try {
      const content = fs.readFileSync(candidateDiskFile, 'utf8');
      const parsed = JSON.parse(content);
      const pendingFailed = Array.isArray(parsed.failedSessionIds) ? parsed.failedSessionIds : [];

      if (
        candidateDiskFile === diskCacheFile &&
        parsed.metricsVersion === METRICS_VERSION &&
        parsed.minScore === effectiveMinScore &&
        pendingFailed.length === 0
      ) {
        datasetCache.set(cacheKey, parsed);
        return parsed;
      }

      if (Array.isArray(parsed.rawSessions) && parsed.rawSessions.length > 0) {
        const { rebuiltSessions, rebuiltMessagesMap } = rebuildFromRawSessions(parsed.rawSessions);
        let remainingFailed = pendingFailed;
        if (pendingFailed.length > 0) {
          const retriedMap = await fetchMessagesBatch(pendingFailed, 6, currentEnv, overrideCreds);
          for (const [sid, msgs] of retriedMap.entries()) {
            if (Array.isArray(msgs) && msgs.length > 0) {
              rebuiltMessagesMap.set(sid, msgs);
            }
          }
          remainingFailed = retriedMap.failedSessionIds || [];
        }
        const upgraded = buildDatasetResult(
          rebuiltSessions,
          rebuiltMessagesMap,
          date,
          currentEnv,
          creds.envName,
          effectiveMinScore,
          remainingFailed
        );
        datasetCache.set(cacheKey, upgraded);
        try {
          writeJsonAtomic(diskCacheFile, upgraded);
        } catch {}
        return upgraded;
      }
    } catch {}
  }

  // Fetch raw sessions
  const sessions = await fetchSessionsForDate(date, currentEnv, overrideCreds);

  // Extract messages for all sessions
  const sessionIds = sessions.map(s => s.sessionId);
  const messagesMap = await fetchMessagesBatch(sessionIds, 8, currentEnv, overrideCreds);
  const failedSessionIds = messagesMap.failedSessionIds || [];

  if (sessions.length > 0 && failedSessionIds.length === sessions.length) {
    throw new Error(`KuaiBuddy [${creds.envName}] 会话消息拉取全部失败 (${failedSessionIds.length} 条)，请稍后重试`);
  }

  const result = buildDatasetResult(
    sessions,
    messagesMap,
    date,
    currentEnv,
    creds.envName,
    effectiveMinScore,
    failedSessionIds
  );

  datasetCache.set(cacheKey, result);

  try {
    writeJsonAtomic(diskCacheFile, result);
  } catch {}

  return result;
}

export function apply(ctx) {
  // 1. Register DSH Tool for Agent invocation
  ctx.effect(() => ctx.tools.register({
    name: 'kuaibuddy_eval_dataset',
    description: '获取 KuaiBuddy 客服系统前一天（或指定日期）的对话记录，并自动评估提取有价值的对话作为评测集（支持按分类、评分、环境切换与导出）。',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'detail', 'export', 'get_config', 'badcases', 'official'],
          description: '操作类型: list 查看提取的评测集概览; badcases 查看 Badcase 诊断与归因列表; official 查看正式评测集管理库; detail 查看单条会话详情; export 导出评测集/回归集/正式集; get_config 查看当前环境配置'
        },
        env: {
          type: 'string',
          enum: ['test', 'prod', 'preprod', 'dev', 'custom'],
          description: '指定运行环境 (test: 测试环境, prod: 生产环境, preprod: 预生产环境, dev: 开发环境)'
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
        badcaseType: {
          type: 'string',
          description: '按 Badcase 类型筛选 (tool_error, config_mismatch, user_complaint, response_anomaly)'
        },
        exportType: {
          type: 'string',
          enum: ['cases', 'badcases', 'official'],
          description: '导出类型: cases 评测用例集, badcases 回归测试集, official 正式评测集'
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
      if (args.action === 'get_config') {
        return getConfig();
      }

      const date = args.date || getYesterdayStr();
      const minScore = Number.isFinite(args.minScore) ? args.minScore : 60;
      const targetEnv = args.env;

      if (args.action === 'list') {
        const data = await getOrExtractDataset(date, false, minScore, targetEnv);
        let cases = data.cases;
        if (args.category) {
          cases = cases.filter(c => c.category === args.category);
        }
        const limit = args.limit || 20;
        return {
          date: data.date,
          env: data.env,
          envName: data.envName,
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

      if (args.action === 'badcases') {
        const data = await getOrExtractDataset(date, false, minScore, targetEnv);
        let badcases = data.badcases || [];
        if (args.badcaseType) {
          badcases = badcases.filter(b => b.badcaseType === args.badcaseType || b.badcaseTypeName === args.badcaseType);
        }
        const limit = args.limit || 20;
        return {
          date: data.date,
          env: data.env,
          envName: data.envName,
          totalBadcases: (data.badcases || []).length,
          returnedCount: Math.min(limit, badcases.length),
          badcases: badcases.slice(0, limit).map(b => ({
            id: b.id,
            sessionId: b.sessionId,
            title: b.title,
            badcaseType: b.badcaseType,
            badcaseTypeName: b.badcaseTypeName,
            severity: b.severity,
            phenomenon: b.phenomenon,
            suspectedCause: b.suspectedCause,
            recommendation: b.recommendation,
            evidencePreview: b.evidence.slice(0, 120),
            prompt: b.userPrompt,
            turnsCount: b.turnsCount,
            toolCallsCount: b.toolCallsCount,
            sampleRepetitions: b.sampleRepetitions || 1
          }))
        };
      }

      if (args.action === 'official') {
        const official = getOfficialDataset();
        let items = official.items || [];
        if (args.category) {
          items = items.filter(c => c.category === args.category || c.badcaseTypeName === args.category);
        }
        const limit = args.limit || 50;
        return {
          updatedAt: official.updatedAt,
          totalCount: (official.items || []).length,
          returnedCount: Math.min(limit, items.length),
          items: items.slice(0, limit).map(c => ({
            id: c.id,
            sessionId: c.sessionId,
            sourceType: c.sourceType || (c.badcaseType ? 'badcase' : 'case'),
            priority: c.priority || 'P1',
            title: c.title,
            category: c.category || c.badcaseTypeName,
            prompt: c.userPrompt || c.prompt,
            evalCriteria: c.evalCriteria,
            referenceAnswerPreview: (c.referenceAnswer || '').slice(0, 120),
            sourceDate: c.sourceDate,
            sourceEnv: c.sourceEnv,
            addedAt: c.addedAt
          }))
        };
      }

      if (args.action === 'detail') {
        if (!args.sessionId) throw new Error('detail 操作需要提供 sessionId');
        const msgs = await fetchMessagesForSession(args.sessionId, 100, targetEnv);
        return {
          sessionId: args.sessionId,
          messagesCount: msgs.length,
          messages: msgs
        };
      }

      if (args.action === 'export') {
        const exportType = args.exportType || 'cases';
        if (exportType === 'official') {
          const official = getOfficialDataset();
          let items = official.items || [];
          if (args.category) {
            items = items.filter(c => c.category === args.category || c.badcaseTypeName === args.category);
          }
          const limit = args.limit || items.length;
          const exported = exportFormat(items.slice(0, limit), args.format || 'json', 'official');
          return {
            exportType: 'official',
            format: args.format || 'json',
            count: Math.min(limit, items.length),
            content: exported
          };
        }

        const data = await getOrExtractDataset(date, false, minScore, targetEnv);
        const isBadcase = exportType === 'badcases';
        let items = isBadcase ? (data.badcases || []) : (data.cases || []);

        if (!isBadcase && args.category) {
          items = items.filter(c => c.category === args.category);
        } else if (isBadcase && args.badcaseType) {
          items = items.filter(b => b.badcaseType === args.badcaseType || b.badcaseTypeName === args.badcaseType);
        }

        const limit = args.limit || items.length;
        const exported = exportFormat(items.slice(0, limit), args.format || 'json', exportType);
        return {
          exportType,
          format: args.format || 'json',
          count: Math.min(limit, items.length),
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
      const targetEnv = q.get('env') || undefined;
      const staffKey = q.get('staffKey') || undefined;
      const apiUrl = q.get('apiUrl') || undefined;
      const overrideCreds = (staffKey || apiUrl) ? { key: staffKey, url: apiUrl } : undefined;

      try {
        if (action === 'get_config') {
          return send(200, getConfig());
        }

        if (action === 'save_config' && req.method === 'POST') {
          let raw = '';
          for await (const chunk of req) {
            raw += chunk;
            if (raw.length > 2 * 1024 * 1024) throw new Error('配置请求过大');
          }
          const updates = JSON.parse(raw || '{}');
          const saved = saveConfig(updates);
          return send(200, saved);
        }

        if (action === 'get_official_dataset') {
          return send(200, getOfficialDataset());
        }

        if (action === 'save_official_dataset' && req.method === 'POST') {
          let raw = '';
          for await (const chunk of req) {
            raw += chunk;
            if (raw.length > 4 * 1024 * 1024) throw new Error('请求体过大');
          }
          const body = JSON.parse(raw || '{}');
          const saved = saveOfficialDataset(body.items || []);
          return send(200, { success: true, ...saved });
        }

        if (action === 'add_official_cases' && req.method === 'POST') {
          let raw = '';
          for await (const chunk of req) {
            raw += chunk;
            if (raw.length > 4 * 1024 * 1024) throw new Error('请求体过大');
          }
          const body = JSON.parse(raw || '{}');
          const saved = addOfficialCases(body.items || body.cases || [], body.sourceDate || date, body.sourceEnv || targetEnv);
          return send(200, { success: true, ...saved });
        }

        if (action === 'remove_official_cases' && req.method === 'POST') {
          let raw = '';
          for await (const chunk of req) {
            raw += chunk;
            if (raw.length > 512 * 1024) throw new Error('请求体过大');
          }
          const body = JSON.parse(raw || '{}');
          const saved = removeOfficialCases(body.ids || []);
          return send(200, { success: true, ...saved });
        }

        if (action === 'update_official_case' && req.method === 'POST') {
          let raw = '';
          for await (const chunk of req) {
            raw += chunk;
            if (raw.length > 1024 * 1024) throw new Error('请求体过大');
          }
          const body = JSON.parse(raw || '{}');
          const saved = updateOfficialCase(body.item || body);
          return send(200, { success: true, ...saved });
        }

        const parseMinScoreParam = () => {
          const rawMin = q.get('minScore');
          if (rawMin === null || rawMin === '') return 60;
          const n = Number(rawMin);
          return Number.isFinite(n) ? n : 60;
        };

        if (action === 'get_data') {
          const force = q.get('force') === 'true';
          const minScore = parseMinScoreParam();
          const data = await getOrExtractDataset(date, force, minScore, targetEnv, overrideCreds);
          return send(200, data);
        }

        if (action === 'extract') {
          const minScore = parseMinScoreParam();
          const data = await getOrExtractDataset(date, true, minScore, targetEnv, overrideCreds);
          return send(200, data);
        }

        if (action === 'detail') {
          const sessionId = q.get('sessionId');
          if (!sessionId) return send(400, { error: '缺少 sessionId' });
          const messages = await fetchMessagesForSession(sessionId, 100, targetEnv, overrideCreds);
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
          const type = body.type || 'cases';
          const items = body.items || body.cases || [];
          const text = exportFormat(items, format, type);
          return send(200, { format, type, count: items.length, content: text });
        }

        if (action === 'get_regression_tasks') {
          return send(200, { tasks: regressionManager.getTasks() });
        }

        if (action === 'start_regression') {
          let raw = '';
          for await (const chunk of req) {
            raw += chunk;
            if (raw.length > 512 * 1024) throw new Error('请求体过大');
          }
          const body = JSON.parse(raw || '{}');
          const targetRegressionEnv = body.env || targetEnv || 'preprod';
          const credsOverride = body.overrideCreds || overrideCreds;
          const createdTasks = [];

          if (Array.isArray(body.cases) && body.cases.length > 0) {
            for (const item of body.cases) {
              const t = regressionManager.createTask({
                caseId: item.id || item.sessionId,
                title: item.title,
                prompt: item.userPrompt || item.prompt,
                referenceAnswer: item.referenceAnswer,
                env: targetRegressionEnv,
                overrideCreds: credsOverride
              });
              createdTasks.push(t);
            }
          } else if (body.prompt || body.userPrompt) {
            const t = regressionManager.createTask({
              caseId: body.caseId || body.id,
              title: body.title,
              prompt: body.prompt || body.userPrompt,
              referenceAnswer: body.referenceAnswer,
              env: targetRegressionEnv,
              overrideCreds: credsOverride
            });
            createdTasks.push(t);
          } else {
            return send(400, { error: '缺少回归用例参数 (prompt 或 cases)' });
          }

          return send(200, { success: true, count: createdTasks.length, tasks: createdTasks });
        }

        if (action === 'cancel_regression_task') {
          let raw = '';
          for await (const chunk of req) {
            raw += chunk;
            if (raw.length > 64 * 1024) throw new Error('请求体过大');
          }
          const body = JSON.parse(raw || '{}');
          const ok = regressionManager.cancelTask(body.taskId || q.get('taskId'));
          return send(200, { success: ok });
        }

        if (action === 'clear_regression_tasks') {
          regressionManager.clearFinishedTasks();
          return send(200, { success: true });
        }

        return send(400, { error: `未知操作: ${action}` });
      } catch (err) {
        console.error('[eval-dataset] Handler error:', err);
        return send(500, { error: err.message || '内部服务错误' });
      }
    }
  }));
}
