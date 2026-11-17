import crypto from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CREDENTIAL_KEY = 'langfuse-dashboard/environments';
const MAX_HISTORY = 30;

function writeJsonAtomic(filePath, data, mode) {
  const dir = path.dirname(filePath);
  mkdirSync(dir, { recursive: true });
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, JSON.stringify(data, null, 2), mode ? { encoding: 'utf8', mode } : 'utf8');
  renameSync(tmp, filePath);
}

export function maskSecret(value) {
  const str = String(value || '').trim();
  if (!str) return '';
  if (str.length <= 10) return '••••';
  const head = str.slice(0, 6);
  const tail = str.slice(-4);
  return `${head}••••${tail}`;
}

export function normalizeBaseUrl(raw) {
  const value = String(raw || '').trim().replace(/\/+$/, '');
  if (!value) throw new Error('Langfuse Base URL 不能为空');
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('Base URL 格式无效，请填写以 http:// 或 https:// 开头的完整地址');
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Base URL 仅支持 http:// 或 https:// 协议');
  }
  return parsed.origin + parsed.pathname.replace(/\/+$/, '');
}

function createEmptyState() {
  return {
    version: 1,
    activeEnvId: '',
    environments: [],
    history: [],
  };
}

export class LangfuseStore {
  constructor(ctx, baseDir = fileURLToPath(new URL('./.local', import.meta.url))) {
    this.ctx = ctx;
    this.baseDir = path.resolve(baseDir);
    this.statePath = path.join(this.baseDir, 'state.json');
    this.fallbackSecretsPath = path.join(this.baseDir, 'secrets.json');
    mkdirSync(this.baseDir, { recursive: true });
    this.state = this._loadState();
  }

  _credentialsService() {
    return this.ctx?.get?.('credentials');
  }

  _loadState() {
    if (!existsSync(this.statePath)) {
      const empty = createEmptyState();
      writeJsonAtomic(this.statePath, empty);
      return empty;
    }
    try {
      const parsed = JSON.parse(readFileSync(this.statePath, 'utf8'));
      const environments = Array.isArray(parsed?.environments) ? parsed.environments : [];
      const history = Array.isArray(parsed?.history) ? parsed.history.slice(0, MAX_HISTORY) : [];
      const activeEnvId = environments.some((e) => e.id === parsed?.activeEnvId)
        ? parsed.activeEnvId
        : (environments[0]?.id || '');
      return {
        version: 1,
        activeEnvId,
        environments,
        history,
      };
    } catch {
      const empty = createEmptyState();
      writeJsonAtomic(this.statePath, empty);
      return empty;
    }
  }

  _saveState() {
    writeJsonAtomic(this.statePath, this.state);
  }

  async _readSecretsMap() {
    const creds = this._credentialsService();
    if (creds?.readRecord) {
      try {
        const record = await creds.readRecord(CREDENTIAL_KEY);
        const map = record?.kind === 'grant' && record.payload && typeof record.payload === 'object'
          ? record.payload.secrets
          : null;
        if (map && typeof map === 'object') return map;
      } catch {
        // Fallback below if credential store read fails
      }
    }
    if (existsSync(this.fallbackSecretsPath)) {
      try {
        const raw = JSON.parse(readFileSync(this.fallbackSecretsPath, 'utf8'));
        return raw && typeof raw === 'object' ? raw : {};
      } catch {
        return {};
      }
    }
    return {};
  }

  async _mutateSecretsMap(mutator) {
    const creds = this._credentialsService();
    if (creds?.modifyRecord) {
      await creds.modifyRecord(CREDENTIAL_KEY, async (current) => {
        const prevMap = current?.kind === 'grant' && current.payload?.secrets && typeof current.payload.secrets === 'object'
          ? { ...current.payload.secrets }
          : {};
        const nextMap = await mutator(prevMap);
        return {
          kind: 'grant',
          payload: { secrets: nextMap },
        };
      });
      return;
    }
    const prevMap = await this._readSecretsMap();
    const nextMap = await mutator({ ...prevMap });
    writeJsonAtomic(this.fallbackSecretsPath, nextMap, 0o600);
  }

  async getPublicState() {
    const secrets = await this._readSecretsMap();
    const environments = this.state.environments.map((env) => {
      const sec = secrets[env.id] || {};
      const publicKey = String(sec.publicKey || '');
      const secretKey = String(sec.secretKey || '');
      return {
        ...env,
        publicKey,
        publicKeyMask: maskSecret(publicKey),
        secretKeyMask: maskSecret(secretKey),
        hasSecretKey: Boolean(secretKey),
        configured: Boolean(env.baseUrl && publicKey && secretKey),
      };
    });
    const activeEnvId = environments.some((e) => e.id === this.state.activeEnvId)
      ? this.state.activeEnvId
      : (environments[0]?.id || '');
    return {
      activeEnvId,
      environments,
      history: this.state.history,
    };
  }

  async getEnvironmentWithSecrets(envId) {
    const targetId = envId || this.state.activeEnvId;
    const env = this.state.environments.find((e) => e.id === targetId) || this.state.environments[0];
    if (!env) {
      throw new Error('尚未配置 Langfuse 环境，请先在右上角「密钥与环境配置」中添加环境');
    }
    const secrets = await this._readSecretsMap();
    const sec = secrets[env.id] || {};
    const publicKey = String(sec.publicKey || '').trim();
    const secretKey = String(sec.secretKey || '').trim();
    if (!publicKey || !secretKey) {
      throw new Error(`环境「${env.name}」尚未配置完整的 Public Key / Secret Key`);
    }
    return {
      ...env,
      publicKey,
      secretKey,
    };
  }

  async saveEnvironment(input) {
    const name = String(input?.name || '').trim();
    if (!name) throw new Error('环境名称不能为空');
    const baseUrl = normalizeBaseUrl(input?.baseUrl);
    const publicKeyInput = String(input?.publicKey || '').trim();
    const secretKeyInput = String(input?.secretKey || '').trim();

    const existingIndex = input?.id
      ? this.state.environments.findIndex((e) => e.id === input.id)
      : -1;
    const isUpdate = existingIndex >= 0;
    const id = isUpdate
      ? this.state.environments[existingIndex].id
      : (input?.id && /^[a-zA-Z0-9_-]+$/.test(input.id) ? input.id : `env-${crypto.randomUUID().slice(0, 8)}`);

    const existingSecrets = await this._readSecretsMap();
    const prevSec = existingSecrets[id] || {};
    const publicKey = publicKeyInput || String(prevSec.publicKey || '').trim();
    const secretKey = secretKeyInput || String(prevSec.secretKey || '').trim();

    if (!publicKey) throw new Error('LANGFUSE_PUBLIC_KEY 不能为空');
    if (!secretKey) throw new Error('LANGFUSE_SECRET_KEY 不能为空');

    await this._mutateSecretsMap((map) => {
      map[id] = { publicKey, secretKey };
      return map;
    });

    const now = new Date().toISOString();
    const prevMeta = isUpdate ? this.state.environments[existingIndex] : {};
    const nextMeta = {
      id,
      name,
      baseUrl,
      projectId: input?.projectId !== undefined ? String(input.projectId || '').trim() : (prevMeta.projectId || ''),
      projectName: input?.projectName !== undefined ? String(input.projectName || '').trim() : (prevMeta.projectName || ''),
      orgName: input?.orgName !== undefined ? String(input.orgName || '').trim() : (prevMeta.orgName || ''),
      lastTestedAt: input?.lastTestedAt ?? prevMeta.lastTestedAt ?? '',
      lastTestOk: input?.lastTestOk ?? prevMeta.lastTestOk ?? null,
      lastTestMessage: input?.lastTestMessage ?? prevMeta.lastTestMessage ?? '',
      createdAt: prevMeta.createdAt || now,
      updatedAt: now,
    };

    if (isUpdate) {
      this.state.environments[existingIndex] = nextMeta;
    } else {
      this.state.environments.push(nextMeta);
    }

    if (input?.setDefault || !this.state.activeEnvId) {
      this.state.activeEnvId = id;
    }
    this._saveState();
    return this.getPublicState();
  }

  async updateEnvironmentMeta(id, patch) {
    const idx = this.state.environments.findIndex((e) => e.id === id);
    if (idx < 0) return this.getPublicState();
    this.state.environments[idx] = {
      ...this.state.environments[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    this._saveState();
    return this.getPublicState();
  }

  async selectEnvironment(id) {
    const exists = this.state.environments.some((e) => e.id === id);
    if (!exists) throw new Error('目标环境不存在');
    this.state.activeEnvId = id;
    this._saveState();
    return this.getPublicState();
  }

  async deleteEnvironment(id) {
    const before = this.state.environments.length;
    this.state.environments = this.state.environments.filter((e) => e.id !== id);
    if (this.state.environments.length === before) {
      throw new Error('目标环境不存在');
    }
    await this._mutateSecretsMap((map) => {
      delete map[id];
      return map;
    });
    if (this.state.activeEnvId === id) {
      this.state.activeEnvId = this.state.environments[0]?.id || '';
    }
    this.state.history = this.state.history.filter((h) => h.envId !== id);
    this._saveState();
    return this.getPublicState();
  }

  addHistory(entry) {
    const query = String(entry?.query || '').trim();
    if (!query) return;
    const item = {
      id: crypto.randomUUID().slice(0, 8),
      envId: entry.envId || this.state.activeEnvId,
      query,
      mode: entry.mode || 'auto',
      resolvedMode: entry.resolvedMode || entry.mode || 'auto',
      traceCount: Number(entry.traceCount || 0),
      label: String(entry.label || '').slice(0, 80),
      queriedAt: new Date().toISOString(),
    };
    this.state.history = [
      item,
      ...this.state.history.filter((h) => !(h.envId === item.envId && h.query === item.query)),
    ].slice(0, MAX_HISTORY);
    this._saveState();
  }

  clearHistory() {
    this.state.history = [];
    this._saveState();
  }
}
