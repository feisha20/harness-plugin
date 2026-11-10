import fs from 'node:fs';
import path from 'node:path';

// Get credentials from env or ~/.zshrc fallback
function getCredentials() {
  let url = process.env.KUAIBUDDY_URL;
  let key = process.env.KUAIBUDDY_STAFF_KEY;

  if (!url || !key) {
    try {
      const zshrcPath = path.join(process.env.HOME || '/Users/linjt', '.zshrc');
      if (fs.existsSync(zshrcPath)) {
        const text = fs.readFileSync(zshrcPath, 'utf8');
        if (!key) {
          const matchKey = text.match(/export\s+KUAIBUDDY_STAFF_KEY=["']?([^"'\n\r]+)["']?/);
          if (matchKey) key = matchKey[1];
        }
        if (!url) {
          const matchUrl = text.match(/export\s+KUAIBUDDY_URL=["']?([^"'\n\r]+)["']?/);
          if (matchUrl) url = matchUrl[1];
        }
      }
    } catch {}
  }

  return {
    url: url || 'https://tkf-kuaibuddy.kuaishang.cn',
    key: key || '198270-Test'
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

export async function fetchSessionsForDate(dateStr) {
  const { url, key } = getCredentials();
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
      throw new Error(`KuaiBuddy sessions API 失败 (${res.status}): ${text.slice(0, 200)}`);
    }

    const data = await res.json();
    if (data.code !== 8) {
      throw new Error(`KuaiBuddy 响应错误 [${data.code}]: ${data.msg || '未知错误'}`);
    }

    const list = data.data?.resultlist || [];
    allSessions.push(...list);

    totalPage = data.data?.totalPage || 1;
    curPage++;
  }

  return allSessions;
}

export async function fetchMessagesForSession(sessionId, pageSize = 50) {
  const { url, key } = getCredentials();
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
    throw new Error(`KuaiBuddy messages API 失败 (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  if (data.code !== 8) {
    throw new Error(`KuaiBuddy 消息响应错误 [${data.code}]: ${data.msg || '未知错误'}`);
  }

  const rawList = data.data?.resultlist || [];
  // Sort from earliest to latest
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
export async function fetchMessagesBatch(sessionIds, concurrency = 6) {
  const results = new Map();
  const queue = [...sessionIds];

  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length > 0) {
      const id = queue.shift();
      if (!id) break;
      try {
        const msgs = await fetchMessagesForSession(id, 60);
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
