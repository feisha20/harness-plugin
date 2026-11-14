import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PLUGIN_DIR = path.dirname(fileURLToPath(import.meta.url));
const LEGACY_CONFIG_PATH = path.join(PLUGIN_DIR, 'config.json');
const LEGACY_OFFICIAL_DATASET_PATH = path.join(PLUGIN_DIR, 'official-dataset.json');

export function getStorageDir() {
  const dshHome = process.env.DSH_HOME || path.join(os.homedir(), '.dsh');
  return path.join(dshHome, 'storages', 'eval-dataset');
}

export function writeJsonAtomic(targetPath, payload) {
  const dir = path.dirname(targetPath);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const tmpPath = `${targetPath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(payload, null, 2), { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(tmpPath, targetPath);
}

function getConfigPath() {
  return path.join(getStorageDir(), 'config.json');
}

function getOfficialDatasetPath() {
  return path.join(getStorageDir(), 'official-dataset.json');
}

const DEFAULT_CONFIG = {
  activeEnv: 'prod',
  environments: {
    prod: {
      name: '生产环境',
      tag: 'prd',
      url: 'https://kuaibuddy.kuaishang.cn',
      key: '',
      companyId: '',
      username: '',
      password: ''
    },
    preprod: {
      name: '预生产环境',
      tag: 'pre',
      url: 'https://test-kuaibuddy.dingningtalk.com',
      key: '',
      companyId: '232679',
      username: 'testpro',
      password: ''
    },
    test: {
      name: '测试环境',
      tag: 'tkf',
      url: 'https://tkf-kuaibuddy.kuaishang.cn',
      key: '198270-Test',
      companyId: '198270',
      username: '',
      password: ''
    },
    dev: {
      name: '开发环境',
      tag: 'dkf',
      url: 'https://dkf-kuaibuddy.kuaishang.cn',
      key: '',
      companyId: '',
      username: '',
      password: ''
    }
  }
};

export function normalizeApiUrl(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    return u.origin;
  } catch {
    return url.replace(/\/work\/.*$/, '').replace(/\/+$/, '');
  }
}

function mergeEnvironments(baseEnvs, overrideEnvs) {
  const merged = {};
  const allKeys = new Set([
    ...Object.keys(baseEnvs || {}),
    ...Object.keys(overrideEnvs || {})
  ]);
  for (const key of allKeys) {
    merged[key] = {
      ...(baseEnvs?.[key] || {}),
      ...(overrideEnvs?.[key] || {})
    };
  }
  return merged;
}

function hasCustomCredentials(data) {
  const envs = data?.environments;
  if (!envs || typeof envs !== 'object') return false;
  return Boolean(
    envs.prod?.key ||
    envs.prod?.password ||
    envs.preprod?.key ||
    envs.preprod?.password ||
    envs.dev?.key ||
    envs.dev?.password ||
    (envs.test?.key && envs.test.key !== DEFAULT_CONFIG.environments.test.key) ||
    envs.test?.password
  );
}

export function getConfig() {
  const configPath = getConfigPath();
  try {
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return {
        ...DEFAULT_CONFIG,
        ...data,
        environments: mergeEnvironments(DEFAULT_CONFIG.environments, data.environments)
      };
    }
    if (fs.existsSync(LEGACY_CONFIG_PATH)) {
      const legacyData = JSON.parse(fs.readFileSync(LEGACY_CONFIG_PATH, 'utf8'));
      const merged = {
        ...DEFAULT_CONFIG,
        ...legacyData,
        environments: mergeEnvironments(DEFAULT_CONFIG.environments, legacyData.environments)
      };
      if (hasCustomCredentials(legacyData)) {
        try {
          writeJsonAtomic(configPath, merged);
        } catch {}
      }
      return merged;
    }
  } catch {}
  return {
    ...DEFAULT_CONFIG,
    environments: mergeEnvironments(DEFAULT_CONFIG.environments, {})
  };
}

export function saveConfig(updates) {
  const current = getConfig();
  const next = {
    ...current,
    ...updates,
    environments: mergeEnvironments(current.environments, updates?.environments)
  };
  writeJsonAtomic(getConfigPath(), next);
  return next;
}

export function normalizeOfficialCaseItem(item, sourceDate, sourceEnv) {
  const rawSourceType = typeof item.sourceType === 'string' ? item.sourceType.trim() : '';
  const isBadcase = Boolean(
    rawSourceType === 'badcase' ||
    (!rawSourceType && (item.badcaseType || (typeof item.id === 'string' && item.id.startsWith('bad_'))))
  );
  let sourceType = 'case';
  if (rawSourceType === 'manual') {
    sourceType = 'manual';
  } else if (isBadcase) {
    sourceType = 'badcase';
  } else if (rawSourceType === 'case' || rawSourceType === 'positive') {
    sourceType = 'case';
  } else if (item.isManual) {
    sourceType = 'manual';
  }
  const now = new Date().toISOString();

  let defaultPriority = 'P1';
  if (item.priority) {
    defaultPriority = item.priority;
  } else if (item.severity === '严重' || (typeof item.valueScore === 'number' && item.valueScore >= 90)) {
    defaultPriority = 'P0';
  } else if (item.severity === '中' || (typeof item.valueScore === 'number' && item.valueScore < 75)) {
    defaultPriority = 'P2';
  }

  const legacyCategoryName = typeof item.categoryName === 'string' ? item.categoryName.trim() : '';
  const resolvedCategory =
    (legacyCategoryName && legacyCategoryName !== '通用业务咨询' ? legacyCategoryName : '') ||
    (typeof item.category === 'string' ? item.category.trim() : '') ||
    legacyCategoryName ||
    item.badcaseTypeName ||
    '综合问答';

  const resolvedPrompt = (item.userPrompt || item.prompt || '').trim();
  const resolvedTitle = (typeof item.title === 'string' && item.title.trim())
    ? item.title.trim()
    : resolvedPrompt.replace(/\s+/g, ' ').slice(0, 45);

  let defaultCriteria = item.evalCriteria || '';
  if (!defaultCriteria) {
    if (sourceType === 'badcase') {
      defaultCriteria = `【缺陷回归防复现】防止再次出现「${item.badcaseTypeName || '历史异常'}」\n` +
        (item.phenomenon ? `【历史故障现象】${item.phenomenon}\n` : '') +
        `【修复验证要求】${item.recommendation || '正确完成工具调用与推理，输出符合业务规则的完整回复'}`;
    } else {
      const reasons = Array.isArray(item.valueReasons) && item.valueReasons.length > 0
        ? item.valueReasons.map(r => `- ${r}`).join('\n')
        : '- 准确理解访客/客服提问意图并给出结构化准确回复';
      defaultCriteria = `【核心能力基准】验证「${resolvedCategory}」场景下的意图识别、工具链执行与回答质量：\n${reasons}`;
    }
  }

  const toolNames = Array.isArray(item.toolNames) && item.toolNames.length > 0
    ? item.toolNames
    : (Array.isArray(item.toolsUsed) ? item.toolsUsed : []);

  const rest = { ...item };
  delete rest.categoryName;
  delete rest.toolsUsed;

  return {
    ...rest,
    id: item.id || `official_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: resolvedTitle,
    sessionId: item.sessionId || '',
    compId: item.compId ?? '',
    userId: item.userId ?? '',
    runId: item.runId || '',
    runIds: item.runIds || (item.runId ? [item.runId] : []),
    sourceType,
    isManual: sourceType === 'manual' || Boolean(item.isManual && rawSourceType !== 'case' && rawSourceType !== 'positive' && rawSourceType !== 'badcase'),
    sourceDate: item.sourceDate || sourceDate || (item.createdAt ? item.createdAt.slice(0, 10) : ''),
    sourceEnv: item.sourceEnv || sourceEnv || 'prod',
    priority: defaultPriority,
    category: resolvedCategory,
    toolNames,
    userPrompt: resolvedPrompt,
    referenceAnswer: item.referenceAnswer || '',
    evalCriteria: defaultCriteria,
    addedAt: item.addedAt || now,
    updatedAt: item.updatedAt || now
  };
}

export function getOfficialDataset() {
  const officialPath = getOfficialDatasetPath();
  try {
    if (fs.existsSync(officialPath)) {
      const parsed = JSON.parse(fs.readFileSync(officialPath, 'utf8'));
      const rawItems = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.items) ? parsed.items : []);
      return {
        updatedAt: parsed.updatedAt || new Date().toISOString(),
        items: rawItems.filter(Boolean).map(it => normalizeOfficialCaseItem(it, it.sourceDate, it.sourceEnv))
      };
    }
    if (fs.existsSync(LEGACY_OFFICIAL_DATASET_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(LEGACY_OFFICIAL_DATASET_PATH, 'utf8'));
      const rawItems = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.items) ? parsed.items : []);
      const normalizedItems = rawItems.filter(Boolean).map(it => normalizeOfficialCaseItem(it, it.sourceDate, it.sourceEnv));
      if (normalizedItems.length > 0) {
        try {
          writeJsonAtomic(officialPath, { updatedAt: parsed.updatedAt || new Date().toISOString(), items: normalizedItems });
        } catch {}
      }
      return {
        updatedAt: parsed.updatedAt || new Date().toISOString(),
        items: normalizedItems
      };
    }
    // Also check if config.json has a fallback officialDataset array
    const cfg = getConfig();
    if (Array.isArray(cfg.officialDataset)) {
      return {
        updatedAt: new Date().toISOString(),
        items: cfg.officialDataset.filter(Boolean).map(it => normalizeOfficialCaseItem(it, it.sourceDate, it.sourceEnv))
      };
    }
  } catch {}
  return { updatedAt: new Date().toISOString(), items: [] };
}

export function saveOfficialDataset(items) {
  const normalizedItems = (Array.isArray(items) ? items : [])
    .filter(Boolean)
    .map(it => normalizeOfficialCaseItem(it, it.sourceDate, it.sourceEnv));
  const payload = {
    updatedAt: new Date().toISOString(),
    items: normalizedItems
  };
  writeJsonAtomic(getOfficialDatasetPath(), payload);
  return payload;
}

export function addOfficialCases(newItems, sourceDate, sourceEnv) {
  const current = getOfficialDataset();
  const list = [...current.items];
  let addedCount = 0;

  for (const raw of (Array.isArray(newItems) ? newItems : [newItems])) {
    if (!raw) continue;
    const normalized = normalizeOfficialCaseItem(raw, sourceDate, sourceEnv);
    const existingIdx = list.findIndex(x =>
      x.id === normalized.id ||
      (x.sessionId && normalized.sessionId && x.sessionId === normalized.sessionId && x.sourceType === normalized.sourceType)
    );
    if (existingIdx >= 0) {
      // Preserve existing user edits on evalCriteria/title/priority/addedAt while refreshing metadata if needed
      list[existingIdx] = {
        ...normalized,
        ...list[existingIdx],
        id: list[existingIdx].id,
        addedAt: list[existingIdx].addedAt || normalized.addedAt,
        updatedAt: new Date().toISOString()
      };
    } else {
      list.unshift(normalized);
      addedCount++;
    }
  }

  const saved = saveOfficialDataset(list);
  return { ...saved, addedCount, totalCount: saved.items.length };
}

export function removeOfficialCases(ids) {
  const idSet = new Set(Array.isArray(ids) ? ids : [ids]);
  const current = getOfficialDataset();
  const nextItems = current.items.filter(item => !idSet.has(item.id) && !idSet.has(item.sessionId));
  const removedCount = current.items.length - nextItems.length;
  const saved = saveOfficialDataset(nextItems);
  return { ...saved, removedCount, totalCount: saved.items.length };
}

export function updateOfficialCase(itemUpdate) {
  if (!itemUpdate) throw new Error('缺少更新内容');
  const current = getOfficialDataset();
  const list = [...current.items];
  const idx = list.findIndex(x => x.id === itemUpdate.id);
  const now = new Date().toISOString();

  let updatedItem;
  if (idx >= 0) {
    updatedItem = normalizeOfficialCaseItem(
      {
        ...list[idx],
        ...itemUpdate,
        updatedAt: now
      },
      itemUpdate.sourceDate || list[idx].sourceDate,
      itemUpdate.sourceEnv || list[idx].sourceEnv
    );
    list[idx] = updatedItem;
  } else {
    updatedItem = normalizeOfficialCaseItem(itemUpdate, itemUpdate.sourceDate, itemUpdate.sourceEnv);
    list.unshift(updatedItem);
  }

  const saved = saveOfficialDataset(list);
  return { ...saved, item: updatedItem, totalCount: saved.items.length };
}

// Get credentials from config or env fallback
export function getCredentials(targetEnv, overrideCreds) {
  const cfg = getConfig();
  const envKey = targetEnv || cfg.activeEnv || 'prod';
  const envData = cfg.environments[envKey] || cfg.environments.prod || cfg.environments.test;

  let url = overrideCreds?.url || envData?.url;
  let key = overrideCreds?.key || envData?.key;

  // Preprod shares the same database and staff key as prod
  if (!key && envKey === 'preprod') {
    key = cfg.environments.prod?.key;
  }

  // Fallback to process.env or ~/.zshrc if test env and key is empty
  if (!key && envKey === 'test') {
    key = process.env.KUAIBUDDY_STAFF_KEY;
    if (!key) {
      try {
        const zshrcPath = path.join(process.env.HOME || '/Users/linjt', '.zshrc');
        if (fs.existsSync(zshrcPath)) {
          const text = fs.readFileSync(zshrcPath, 'utf8');
          const matchKey = text.match(/export\s+KUAIBUDDY_STAFF_KEY=["']?([^"'\n\r]+)["']?/);
          if (matchKey) key = matchKey[1];
        }
      } catch {}
    }
    if (!key) key = '198270-Test';
  }

  const defaultUrls = {
    prod: 'https://kuaibuddy.kuaishang.cn',
    preprod: 'https://test-kuaibuddy.dingningtalk.com',
    test: 'https://tkf-kuaibuddy.kuaishang.cn',
    dev: 'https://dkf-kuaibuddy.kuaishang.cn'
  };

  const finalUrl = normalizeApiUrl(url || defaultUrls[envKey] || defaultUrls.prod);

  return {
    env: envKey,
    envName: envData?.name || envKey,
    tag: envData?.tag || envKey,
    url: finalUrl,
    key: key || '',
    companyId: envData?.companyId || '',
    username: envData?.username || '',
    password: envData?.password || ''
  };
}

export function parseMessageContent(content) {
  if (!content) return '';
  if (typeof content !== 'string') return String(content);
  if (content.startsWith('[') || content.startsWith('{')) {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed.map(p => p.text || p.content || '').filter(Boolean).join('\n');
      }
      if (parsed && typeof parsed === 'object') {
        return parsed.text || parsed.content || JSON.stringify(parsed);
      }
    } catch {}
  }
  return content;
}

export async function fetchSessionsForDate(dateStr, targetEnv, overrideCreds) {
  const { url, key, envName } = getCredentials(targetEnv, overrideCreds);
  if (!key) {
    throw new Error(`【${envName}】尚未配置 X-Staff-Key，请点击右上角「⚙️ 环境配置」填入对应的 Staff Key`);
  }

  const endpoint = `${url}/web/agent/api/v1/staff/sessions`;
  
  const createdAtStart = `${dateStr}T00:00:00`;
  const createdAtEnd = `${dateStr}T23:59:59`;

  const allSessions = [];
  let curPage = 1;
  const pageSize = 200;
  let totalPage = 1;

  while (curPage <= totalPage) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'X-Staff-Key': key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        createdAtStart,
        createdAtEnd,
        curPage,
        pageSize
      })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`KuaiBuddy [${envName}] sessions API 失败 (${res.status}): ${text.slice(0, 200)}`);
    }

    const data = await res.json();
    if (data.code !== 8) {
      if (data.code === 2008) {
        throw new Error(`KuaiBuddy [${envName}] Staff Key 无效或未授权 (code 2008)，请检查配置的 Key`);
      }
      throw new Error(`KuaiBuddy 响应错误 [${data.code}]: ${data.msg || '未知错误'}`);
    }

    const list = data.data?.resultlist || [];
    allSessions.push(...list);

    totalPage = data.data?.totalPage || 1;
    curPage++;
  }

  return allSessions;
}

export async function fetchMessagesForSession(sessionId, pageSize = 200, targetEnv, overrideCreds) {
  const { url, key, envName } = getCredentials(targetEnv, overrideCreds);
  if (!key) {
    throw new Error(`【${envName}】尚未配置 X-Staff-Key，请点击右上角「⚙️ 环境配置」填入对应的 Staff Key`);
  }

  const endpoint = `${url}/web/agent/api/v1/staff/messages`;

  let curPage = 1;
  const allRawList = [];

  while (true) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'X-Staff-Key': key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId,
        curPage,
        pageSize
      })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`KuaiBuddy [${envName}] messages API 失败 (${res.status}): ${text.slice(0, 200)}`);
    }

    const data = await res.json();
    if (data.code !== 8) {
      throw new Error(`KuaiBuddy 消息响应错误 [${data.code}]: ${data.msg || '未知错误'}`);
    }

    const pageList = data.data?.resultlist || [];
    allRawList.push(...pageList);

    const totalRecord = typeof data.data?.totalRecord === 'number' ? data.data.totalRecord : 0;
    const totalPage = typeof data.data?.totalPage === 'number' ? data.data.totalPage : 1;

    if (curPage >= totalPage || allRawList.length >= totalRecord || pageList.length === 0) {
      break;
    }
    curPage++;
  }

  allRawList.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));

  return allRawList.map(m => ({
    messageId: m.messageId,
    sessionId: m.sessionId,
    runId: m.runId,
    role: m.role,
    content: parseMessageContent(m.content),
    toolName: m.toolName,
    rawToolName: m.rawToolName || m.originalToolName || m.toolCode || m.functionName || (m.name && m.name !== m.toolName ? m.name : undefined),
    toolArgs: m.toolArgs,
    toolResult: m.toolResult,
    createdAt: m.createdAt
  }));
}

// Concurrent message fetcher with concurrency pool and transient retry
export async function fetchMessagesBatch(sessionIds, concurrency = 6, targetEnv, overrideCreds, maxRetries = 2) {
  const results = new Map();
  const failedSessionIds = [];
  const queue = [...sessionIds];

  const fetchWithRetry = async (id) => {
    let lastErr;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fetchMessagesForSession(id, 200, targetEnv, overrideCreds);
      } catch (err) {
        lastErr = err;
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)));
        }
      }
    }
    throw lastErr;
  };

  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length > 0) {
      const id = queue.shift();
      if (!id) break;
      try {
        const msgs = await fetchWithRetry(id);
        results.set(id, msgs);
      } catch (err) {
        console.warn(`[eval-dataset] 获取会话 ${id} 消息失败:`, err.message);
        failedSessionIds.push(id);
        results.set(id, []);
      }
    }
  });

  await Promise.all(workers);
  results.failedSessionIds = failedSessionIds;
  return results;
}
