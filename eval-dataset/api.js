import fs from 'node:fs';
import path from 'node:path';

const CONFIG_PATH = path.join(path.dirname(new URL(import.meta.url).pathname), 'config.json');

const DEFAULT_CONFIG = {
  activeEnv: 'test',
  environments: {
    test: {
      name: '测试环境',
      url: 'https://tkf-kuaibuddy.kuaishang.cn',
      key: '198270-Test'
    },
    prod: {
      name: '生产环境',
      url: 'https://kuaibuddy.kuaishang.cn',
      key: ''
    },
    dev: {
      name: '开发环境',
      url: 'https://dkf-kuaibuddy.kuaishang.cn',
      key: ''
    },
    custom: {
      name: '自定义环境',
      url: '',
      key: ''
    }
  }
};

export function getConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      return {
        ...DEFAULT_CONFIG,
        ...data,
        environments: {
          ...DEFAULT_CONFIG.environments,
          ...(data.environments || {})
        }
      };
    }
  } catch {}
  return DEFAULT_CONFIG;
}

export function saveConfig(updates) {
  const current = getConfig();
  const next = {
    ...current,
    ...updates,
    environments: {
      ...current.environments,
      ...(updates.environments || {})
    }
  };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2), 'utf8');
  return next;
}

// Get credentials from config or env fallback
export function getCredentials(targetEnv, overrideCreds) {
  const cfg = getConfig();
  const envKey = targetEnv || cfg.activeEnv || 'test';
  const envData = cfg.environments[envKey] || cfg.environments.test;

  let url = overrideCreds?.url || envData.url;
  let key = overrideCreds?.key || envData.key;

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

  return {
    env: envKey,
    envName: envData.name || envKey,
    url: url || (envKey === 'prod' ? 'https://kuaibuddy.kuaishang.cn' : 'https://tkf-kuaibuddy.kuaishang.cn'),
    key: key || ''
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

  while (curPage <= totalPage && curPage <= 5) {
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

export async function fetchMessagesForSession(sessionId, pageSize = 50, targetEnv, overrideCreds) {
  const { url, key, envName } = getCredentials(targetEnv, overrideCreds);
  if (!key) {
    throw new Error(`【${envName}】尚未配置 X-Staff-Key，请点击右上角「⚙️ 环境配置」填入对应的 Staff Key`);
  }

  const endpoint = `${url}/web/agent/api/v1/staff/messages`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'X-Staff-Key': key,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sessionId,
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

  const rawList = data.data?.resultlist || [];
  rawList.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));

  return rawList.map(m => ({
    messageId: m.messageId,
    sessionId: m.sessionId,
    role: m.role,
    content: parseMessageContent(m.content),
    toolName: m.toolName,
    toolArgs: m.toolArgs,
    toolResult: m.toolResult,
    createdAt: m.createdAt
  }));
}

// Concurrent message fetcher with concurrency pool
export async function fetchMessagesBatch(sessionIds, concurrency = 6, targetEnv, overrideCreds) {
  const results = new Map();
  const queue = [...sessionIds];

  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length > 0) {
      const id = queue.shift();
      if (!id) break;
      try {
        const msgs = await fetchMessagesForSession(id, 60, targetEnv, overrideCreds);
        results.set(id, msgs);
      } catch (err) {
        console.warn(`[eval-dataset] 获取会话 ${id} 消息失败:`, err.message);
        results.set(id, []);
      }
    }
  });

  await Promise.all(workers);
  return results;
}
