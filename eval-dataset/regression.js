import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { getConfig, getCredentials } from './api.js';

const DEFAULT_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36';
const CACHE_DIR = path.join(os.homedir(), '.cache', 'kuaibuddy-eval-regression');
const TOKEN_CACHE_FILE = path.join(CACHE_DIR, 'tokens.json');
const TASKS_STORAGE_FILE = path.join('/tmp', 'kuaibuddy_regression_tasks.json');

function md5(s) {
  return crypto.createHash('md5').update(s, 'utf8').digest('hex');
}

function insertAt(buf, extra, index) {
  const out = Buffer.alloc(buf.length + extra.length);
  buf.copy(out, 0, 0, index);
  extra.copy(out, index);
  buf.copy(out, index + extra.length, index);
  return out;
}

function encryptPassword({ password, companyId, username, ua, lt, timestamp }) {
  const key = md5(`${ua}${lt}${companyId}${md5(username)}`);
  const nonce = crypto.randomBytes(12);
  const plain = Buffer.from(md5(password) + '§' + username, 'utf8');
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'utf8'), nonce);
  const ct = Buffer.concat([cipher.update(plain), cipher.final(), cipher.getAuthTag()]);

  const ts = Buffer.alloc(8);
  ts.writeBigUInt64BE(BigInt(timestamp));
  const mod = 255 % ct.length;
  const i = lt.charCodeAt(lt.length - 1) & mod;
  const a = lt.charCodeAt(lt.length - 2) & mod;
  return insertAt(insertAt(ct, nonce, Math.max(i, a)), ts, Math.min(i, a)).toString('base64');
}

// Token cache helpers
function readCachedToken(baseUrl, username) {
  try {
    if (fs.existsSync(TOKEN_CACHE_FILE)) {
      const all = JSON.parse(fs.readFileSync(TOKEN_CACHE_FILE, 'utf8'));
      const key = `${baseUrl}_${username}`;
      const item = all[key];
      if (item && item.accessToken && item.expiresAt > Date.now() + 60000) {
        return item;
      }
    }
  } catch {}
  return null;
}

function saveCachedToken(baseUrl, username, tokenData) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    let all = {};
    if (fs.existsSync(TOKEN_CACHE_FILE)) {
      try { all = JSON.parse(fs.readFileSync(TOKEN_CACHE_FILE, 'utf8')); } catch {}
    }
    all[`${baseUrl}_${username}`] = tokenData;
    fs.writeFileSync(TOKEN_CACHE_FILE, JSON.stringify(all, null, 2), { mode: 0o600 });
  } catch {}
}

async function apiPostForm(baseUrl, urlPath, fields, ua) {
  const res = await fetch(`${baseUrl}${urlPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': ua,
      Accept: 'application/json, text/plain, */*'
    },
    body: new URLSearchParams(fields)
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { code: -1, msg: text.slice(0, 300) }; }
  return { status: res.status, json };
}

export async function loginUser(envKey, overrideCreds) {
  const creds = getCredentials(envKey, overrideCreds);
  const baseUrl = creds.url;
  let companyId = creds.companyId;
  let username = creds.username;
  let password = creds.password;

  // Fallback to workspace .env if missing in config
  if (!companyId || !username || !password) {
    const envPaths = [
      path.join(os.homedir(), 'Documents', 'kst-projects', 'kuaibuddy-space', '.env'),
      path.join(process.cwd(), '.env')
    ];
    for (const f of envPaths) {
      if (fs.existsSync(f)) {
        try {
          const raw = fs.readFileSync(f, 'utf8');
          for (const line of raw.split('\n')) {
            const trimmed = line.trim();
            if (trimmed.startsWith('companyid=')) companyId = companyId || trimmed.split('=')[1].trim();
            if (trimmed.startsWith('usrname=') || trimmed.startsWith('username=')) username = username || trimmed.split('=')[1].trim();
            if (trimmed.startsWith('password=')) password = password || trimmed.split('=')[1].trim();
          }
        } catch {}
      }
    }
  }

  if (!baseUrl) throw new Error(`【${creds.envName}】缺少环境访问地址，请在环境配置中填写`);
  if (!companyId) throw new Error(`【${creds.envName}】缺少公司 ID (Company ID)，请在环境配置中填写`);
  if (!username) throw new Error(`【${creds.envName}】缺少登录账号 (Username)，请在环境配置中填写`);
  if (!password) throw new Error(`【${creds.envName}】缺少登录密码，请在环境配置中填写`);

  const cached = readCachedToken(baseUrl, username);
  if (cached) return cached;

  const ua = DEFAULT_UA;
  const ltRes = await apiPostForm(baseUrl, '/web/agent/auth/lt', {
    cid: companyId,
    ln: md5(username),
    tt: 'pc',
    isIOS: '1',
    isWebCs: 'true'
  }, ua);

  if (ltRes.json.code !== 8 || !ltRes.json.data || !ltRes.json.data.lt) {
    throw new Error(`获取登录票据失败: ${ltRes.json.msg || JSON.stringify(ltRes.json)}`);
  }
  const lt = ltRes.json.data.lt;
  const timestamp = ltRes.json.data.timestamp;

  const encPassword = encryptPassword({
    password,
    companyId,
    username,
    ua,
    lt,
    timestamp
  });

  const loginRes = await apiPostForm(baseUrl, '/web/agent/auth/login', {
    compId: companyId,
    loginName: md5(username),
    bindEmail: '',
    mobileVerifyCode: '',
    bindPhone: '',
    password: encPassword,
    customerMac: ua,
    dynamicNumber: '',
    verifyCode: '',
    curVersion: '9.64.10',
    csVersion: '9.64.10',
    os: 'Darwin',
    terminalType: 'pc',
    isIOS: '1',
    isWebCs: 'true'
  }, ua);

  if (loginRes.json.code !== 8 || !loginRes.json.data || !loginRes.json.data.accessToken) {
    const hint = loginRes.json.code === 1200 ? '（用户名或密码错误）' : '';
    throw new Error(`登录失败 [${loginRes.json.code}]: ${loginRes.json.msg || '未知错误'}${hint}`);
  }

  const tokenData = {
    accessToken: loginRes.json.data.accessToken,
    refreshToken: loginRes.json.data.refreshToken,
    expiresAt: Date.now() + (loginRes.json.data.expiresIn || 86400) * 1000,
    baseUrl,
    companyId,
    username
  };

  saveCachedToken(baseUrl, username, tokenData);
  return tokenData;
}

// Global in-memory regression task registry
class RegressionTaskManager {
  constructor() {
    this.tasks = new Map();
    this.abortControllers = new Map();
    this.loadPersistedTasks();
  }

  loadPersistedTasks() {
    try {
      if (fs.existsSync(TASKS_STORAGE_FILE)) {
        const list = JSON.parse(fs.readFileSync(TASKS_STORAGE_FILE, 'utf8'));
        if (Array.isArray(list)) {
          for (const t of list) {
            // Restore tasks (reset running to failed on restart)
            if (t.status === 'running' || t.status === 'pending') {
              t.status = 'failed';
              t.error = '服务重启导致任务中断';
            }
            this.tasks.set(t.id, t);
          }
        }
      }
    } catch {}
  }

  persistTasks() {
    try {
      const list = Array.from(this.tasks.values()).slice(0, 50);
      fs.writeFileSync(TASKS_STORAGE_FILE, JSON.stringify(list, null, 2), 'utf8');
    } catch {}
  }

  createTask({ caseId, title, prompt, referenceAnswer, env = 'preprod', overrideCreds }) {
    const creds = getCredentials(env, overrideCreds);
    const id = `reg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const task = {
      id,
      caseId: caseId || '',
      title: title || (prompt || '').slice(0, 40),
      prompt,
      referenceAnswer: referenceAnswer || '',
      env,
      envName: creds.envName,
      status: 'pending', // 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      durationMs: 0,
      threadId: '',
      runId: '',
      reasoning: '',
      answer: '',
      eventsCount: 0,
      error: null
    };

    this.tasks.set(id, task);
    this.persistTasks();

    // Trigger async execution in background
    setTimeout(() => {
      this.executeTask(id, overrideCreds).catch(err => {
        console.error(`[regression] Task ${id} failed:`, err);
      });
    }, 50);

    return task;
  }

  async executeTask(taskId, overrideCreds) {
    const task = this.tasks.get(taskId);
    if (!task || task.status === 'cancelled') return;

    task.status = 'running';
    task.startedAt = new Date().toISOString();
    this.persistTasks();

    const controller = new AbortController();
    this.abortControllers.set(taskId, controller);

    const startedTime = Date.now();

    try {
      const token = await loginUser(task.env, overrideCreds);
      const thread = `thread_${crypto.randomUUID()}`;
      const run = crypto.randomUUID();
      task.threadId = thread;
      task.runId = run;

      const payload = {
        threadId: thread,
        runId: run,
        message: { role: 'user', content: [{ type: 'text', text: task.prompt }] }
      };

      const res = await fetch(`${token.baseUrl}/service/agent/api/v1/agent/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          Authorization: `Bearer ${token.accessToken}`,
          'User-Agent': DEFAULT_UA
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (!res.ok || !res.body) {
        const bodyText = await res.text().catch(() => '');
        throw new Error(`对话接口 HTTP ${res.status}: ${bodyText.slice(0, 200)}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const raw = line.slice(5).trim();
          if (!raw) continue;
          let ev;
          try { ev = JSON.parse(raw); } catch { continue; }
          task.eventsCount++;
          if (ev.threadId) task.threadId = ev.threadId;
          if (ev.runId) task.runId = ev.runId;
          if (ev.type === 'TEXT_MESSAGE_CONTENT' && typeof ev.delta === 'string') {
            task.answer += ev.delta;
          }
          if (ev.type === 'REASONING_MESSAGE_CONTENT' && typeof ev.delta === 'string') {
            task.reasoning += ev.delta;
          }
          if (ev.type === 'RUN_FINISHED') {
            task.status = 'completed';
          }
          if (ev.type === 'RUN_FAILED' || ev.type === 'ERROR') {
            task.status = 'failed';
            task.error = ev.error || ev.message || ev.reason || '模型运行返回失败事件';
          }
        }
      }

      if (task.status === 'running') {
        task.status = task.answer ? 'completed' : 'failed';
        if (!task.answer && !task.error) {
          task.error = '对话流结束但未接收到有效回复';
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        task.status = 'cancelled';
        task.error = '用户已取消执行';
      } else {
        task.status = 'failed';
        task.error = err.message || '未知执行异常';
      }
    } finally {
      task.completedAt = new Date().toISOString();
      task.durationMs = Date.now() - startedTime;
      this.abortControllers.delete(taskId);
      this.persistTasks();
    }
  }

  cancelTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) return false;
    if (task.status === 'running' || task.status === 'pending') {
      const controller = this.abortControllers.get(taskId);
      if (controller) controller.abort();
      task.status = 'cancelled';
      task.completedAt = new Date().toISOString();
      this.persistTasks();
      return true;
    }
    return false;
  }

  clearFinishedTasks() {
    for (const [id, t] of this.tasks.entries()) {
      if (t.status === 'completed' || t.status === 'failed' || t.status === 'cancelled') {
        this.tasks.delete(id);
      }
    }
    this.persistTasks();
    return true;
  }

  getTasks() {
    return Array.from(this.tasks.values()).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  getTask(taskId) {
    return this.tasks.get(taskId) || null;
  }
}

export const regressionManager = new RegressionTaskManager();
