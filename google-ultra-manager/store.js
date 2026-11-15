import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const GPU_RATE_PRESETS = [
  { id: 'T4', label: 'NVIDIA T4 (16 GB)', ratePerHour: 1.1 },
  { id: 'L4', label: 'NVIDIA L4 (24 GB)', ratePerHour: 1.9 },
  { id: 'A100', label: 'NVIDIA A100 (40/80 GB)', ratePerHour: 6.73 },
  { id: 'G4', label: 'NVIDIA G4', ratePerHour: 3.5 },
  { id: 'H100', label: 'NVIDIA H100 (80 GB)', ratePerHour: 14.5 },
  { id: 'TPU_V6E', label: 'v6e-1 TPU', ratePerHour: 4.0 },
];

export function createDefaultAccount() {
  return {
    id: 'default',
    email: '',
    displayName: '待配置账号',
    authuser: 0,
    planName: 'Google AI Ultra 5x',
    colabTier: '',
    subscriptionStatus: 'unknown',
    monthlyPrice: '',
    billingCycleDay: 0,
    nextRenewalDate: '',
    notes: '',
    computeUnits: {
      balance: 0,
      monthlyAllowance: 1000,
      burnRatePerHour: null,
      activeSessions: null,
      lowThreshold: 100,
      lastSyncedAt: '',
      source: 'unrecorded',
    },
    benefits: [],
    usageLogs: [],
  };
}

function migrateBenefits(benefits) {
  return benefits.flatMap((benefit) => {
    const { id, used, limit, notes } = benefit;
    if (id === 'google-one-storage' && used === 0 && limit === 30 &&
        benefit.name === 'Google One 云端存储' && notes === 'Google Drive / Gmail / Photos 共享空间') {
      return [];
    }
    if (id === 'ai-credits' && used === 0 && limit === 25000 &&
        benefit.name === 'AI Credits (Flow / Whisk / Veo)' && notes === 'Google AI Ultra 月度视频与图像生成积分') {
      return [];
    }
    if (id === 'gemini-ultra' && used === 0 && limit === 100 &&
        benefit.name === 'Gemini Ultra / Deep Think' && notes === '最高配额与 Deep Research / Deep Think 优先通道') {
      return [];
    }
    return [benefit];
  });
}

function createEmptyState() {
  const defaultAccount = createDefaultAccount();
  return {
    version: 2,
    activeAccountId: defaultAccount.id,
    accounts: [defaultAccount],
  };
}

function normalizeNumber(val, fallback = 0) {
  const num = Number(val);
  return Number.isFinite(num) ? num : fallback;
}

export class UltraStore {
  constructor(baseDir = fileURLToPath(new URL('./.local', import.meta.url))) {
    this.baseDir = path.resolve(baseDir);
    this.statePath = path.join(this.baseDir, 'state.json');
    mkdirSync(this.baseDir, { recursive: true });
    this.state = this._load();
  }

  _load() {
    if (!existsSync(this.statePath)) {
      const empty = createEmptyState();
      this._save(empty);
      return empty;
    }
    try {
      const raw = JSON.parse(readFileSync(this.statePath, 'utf8'));
      const accounts = Array.isArray(raw?.accounts) && raw.accounts.length > 0
        ? raw.accounts
        : [createDefaultAccount()];
      const activeId = accounts.some((a) => a.id === raw?.activeAccountId)
        ? raw.activeAccountId
        : accounts[0].id;
      return {
        version: 2,
        activeAccountId: activeId,
        accounts: accounts.map((account) => ({
          ...account,
          planName: account.planName === 'Google AI Ultra' ? 'Google AI Ultra 5x' : account.planName,
          benefits: raw.version === 1 ? migrateBenefits(account.benefits || []) : account.benefits || [],
        })),
      };
    } catch {
      return createEmptyState();
    }
  }

  _save(nextState = this.state) {
    const tmp = `${this.statePath}.tmp`;
    writeFileSync(tmp, JSON.stringify(nextState, null, 2), 'utf8');
    renameSync(tmp, this.statePath);
  }

  getState() {
    return structuredClone(this.state);
  }

  getActiveAccount() {
    const found = this.state.accounts.find((a) => a.id === this.state.activeAccountId);
    return found || this.state.accounts[0];
  }

  setActiveAccount(accountId) {
    const found = this.state.accounts.find((a) => a.id === accountId);
    if (!found) {
      throw new Error(`未找到账号: ${accountId}`);
    }
    this.state.activeAccountId = found.id;
    this._save();
    return structuredClone(this.state);
  }

  upsertAccount(patch) {
    const id = String(patch?.id || '').trim() || `acct-${Date.now()}`;
    const idx = this.state.accounts.findIndex((a) => a.id === id);
    if (idx === -1) {
      const created = {
        ...createDefaultAccount(),
        id,
        email: String(patch?.email || '').trim(),
        displayName: String(patch?.displayName || '').trim() || '新账号',
        authuser: normalizeNumber(patch?.authuser, 0),
        planName: String(patch?.planName || 'Google AI Ultra 5x'),
        colabTier: String(patch?.colabTier || ''),
        subscriptionStatus: String(patch?.subscriptionStatus || 'unknown'),
        monthlyPrice: String(patch?.monthlyPrice || ''),
        billingCycleDay: normalizeNumber(patch?.billingCycleDay, 0),
        nextRenewalDate: String(patch?.nextRenewalDate || ''),
        notes: String(patch?.notes || ''),
      };
      this.state.accounts.push(created);
      this.state.activeAccountId = created.id;
    } else {
      const cur = this.state.accounts[idx];
      const nextCu = patch?.computeUnits
        ? {
            ...cur.computeUnits,
            balance: patch.computeUnits.balance !== undefined
              ? Math.max(0, normalizeNumber(patch.computeUnits.balance, cur.computeUnits.balance))
              : cur.computeUnits.balance,
            monthlyAllowance: patch.computeUnits.monthlyAllowance !== undefined
              ? Math.max(1, normalizeNumber(patch.computeUnits.monthlyAllowance, cur.computeUnits.monthlyAllowance))
              : cur.computeUnits.monthlyAllowance,
            burnRatePerHour: patch.computeUnits.burnRatePerHour !== undefined
              ? patch.computeUnits.burnRatePerHour === null ? null
                : Math.max(0, normalizeNumber(patch.computeUnits.burnRatePerHour, cur.computeUnits.burnRatePerHour))
              : cur.computeUnits.burnRatePerHour,
            activeSessions: patch.computeUnits.activeSessions !== undefined
              ? patch.computeUnits.activeSessions === null ? null
                : Math.max(0, Math.round(normalizeNumber(patch.computeUnits.activeSessions, cur.computeUnits.activeSessions)))
              : cur.computeUnits.activeSessions,
            lowThreshold: patch.computeUnits.lowThreshold !== undefined
              ? Math.max(0, normalizeNumber(patch.computeUnits.lowThreshold, cur.computeUnits.lowThreshold))
              : cur.computeUnits.lowThreshold,
            lastSyncedAt: patch.computeUnits.lastSyncedAt || cur.computeUnits.lastSyncedAt,
            updatedAt: patch.computeUnits.lastSyncedAt || cur.computeUnits.updatedAt,
            source: patch.computeUnits.source || cur.computeUnits.source,
          }
        : cur.computeUnits;

      // Keep colab-cu benefit synchronized with computeUnits if present
      const nextBenefits = cur.benefits.map((b) =>
        b.id === 'colab-cu'
          ? {
              ...b,
              limit: nextCu.monthlyAllowance,
              used: Number(Math.max(0, nextCu.monthlyAllowance - nextCu.balance).toFixed(2)),
            }
          : b,
      );

      this.state.accounts[idx] = {
        ...cur,
        ...(patch?.email !== undefined ? { email: String(patch.email).trim() } : {}),
        ...(patch?.displayName !== undefined ? { displayName: String(patch.displayName).trim() } : {}),
        ...(patch?.authuser !== undefined ? { authuser: normalizeNumber(patch.authuser, cur.authuser) } : {}),
        ...(patch?.planName !== undefined ? { planName: String(patch.planName) } : {}),
        ...(patch?.colabTier !== undefined ? { colabTier: String(patch.colabTier) } : {}),
        ...(patch?.subscriptionStatus !== undefined ? { subscriptionStatus: String(patch.subscriptionStatus) } : {}),
        ...(patch?.monthlyPrice !== undefined ? { monthlyPrice: String(patch.monthlyPrice) } : {}),
        ...(patch?.billingCycleDay !== undefined ? { billingCycleDay: normalizeNumber(patch.billingCycleDay, cur.billingCycleDay) } : {}),
        ...(patch?.nextRenewalDate !== undefined ? { nextRenewalDate: String(patch.nextRenewalDate) } : {}),
        ...(patch?.notes !== undefined ? { notes: String(patch.notes) } : {}),
        computeUnits: nextCu,
        benefits: nextBenefits,
      };
    }
    this._save();
    return structuredClone(this.state);
  }

  upsertBenefit(accountId, benefitPatch, observation) {
    const acct = this.state.accounts.find((a) => a.id === (accountId || this.state.activeAccountId));
    if (!acct) throw new Error('未找到目标账号');
    const id = String(benefitPatch?.id || '').trim() || `benefit-${Date.now()}`;
    const idx = acct.benefits.findIndex((b) => b.id === id);
    const current = acct.benefits[idx];
    const nextItem = {
      id,
      name: String(benefitPatch?.name ?? current?.name ?? '未命名权益').trim(),
      category: String(benefitPatch?.category ?? current?.category ?? '其他').trim(),
      used: Math.max(0, normalizeNumber(benefitPatch?.used ?? current?.used, 0)),
      limit: Math.max(0, normalizeNumber(benefitPatch?.limit ?? current?.limit, 100)),
      unit: String(benefitPatch?.unit ?? current?.unit ?? '').trim(),
      resetCycle: String(benefitPatch?.resetCycle ?? current?.resetCycle ?? '每月').trim(),
      notes: String(benefitPatch?.notes ?? current?.notes ?? '').trim(),
      updatedAt: new Date().toISOString(),
      source: observation?.source || 'manual',
      reportedUsage: observation?.reportedUsage || '',
    };
    if (idx === -1) {
      acct.benefits.push(nextItem);
    } else {
      acct.benefits[idx] = { ...acct.benefits[idx], ...nextItem };
    }
    this._save();
    return structuredClone(this.state);
  }

  deleteBenefit(accountId, benefitId) {
    const acct = this.state.accounts.find((a) => a.id === (accountId || this.state.activeAccountId));
    if (!acct) throw new Error('未找到目标账号');
    acct.benefits = acct.benefits.filter((b) => b.id !== benefitId);
    this._save();
    return structuredClone(this.state);
  }

  addUsageLog(accountId, entry) {
    const acct = this.state.accounts.find((a) => a.id === (accountId || this.state.activeAccountId));
    if (!acct) throw new Error('未找到目标账号');
    const now = new Date().toISOString();
    const delta = normalizeNumber(entry?.unitsDelta, 0);
    const applyToBalance = entry?.applyToBalance !== false;
    if (applyToBalance && delta !== 0) {
      acct.computeUnits.source = 'local-log';
      acct.computeUnits.updatedAt = now;
      acct.computeUnits.balance = Number(Math.max(0, acct.computeUnits.balance + delta).toFixed(2));
      const cuBenefit = acct.benefits.find((b) => b.id === 'colab-cu');
      if (cuBenefit) {
        cuBenefit.used = Number(
          Math.max(0, acct.computeUnits.monthlyAllowance - acct.computeUnits.balance).toFixed(2),
        );
      }
    }
    const logItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: entry?.timestamp || now,
      type: String(entry?.type || 'manual'),
      title: String(entry?.title || '算力使用记录').trim(),
      gpu: String(entry?.gpu || ''),
      hours: normalizeNumber(entry?.hours, 0),
      unitsDelta: Number(delta.toFixed(2)),
      balanceAfter: Number(acct.computeUnits.balance.toFixed(2)),
      note: String(entry?.note || '').trim(),
    };
    acct.usageLogs.unshift(logItem);
    if (acct.usageLogs.length > 200) {
      acct.usageLogs = acct.usageLogs.slice(0, 200);
    }
    this._save();
    return structuredClone(this.state);
  }

  deleteUsageLog(accountId, logId) {
    const acct = this.state.accounts.find((a) => a.id === (accountId || this.state.activeAccountId));
    if (!acct) throw new Error('未找到目标账号');
    acct.usageLogs = acct.usageLogs.filter((l) => l.id !== logId);
    this._save();
    return structuredClone(this.state);
  }
}
