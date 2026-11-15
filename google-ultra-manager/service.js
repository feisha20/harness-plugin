import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { ULTRA_CATALOG } from './benefits.js';
import { GPU_RATE_PRESETS, UltraStore } from './store.js';

const execFileAsync = promisify(execFile);

export function parseColabResourcesText(text) {
  const raw = String(text || '');
  const tierMatch =
    raw.match(/您已订阅[“"]([^”"]+)[”"]/) ||
    raw.match(/You are subscribed to ([^.\n]+)/i);
  const balanceMatch =
    raw.match(/可用[：:]\s*([\d.]+)\s*个计算单元/) ||
    raw.match(/Available:\s*([\d.]+)\s*compute units/i);
  const rateMatch =
    raw.match(/使用率[：:]\s*大约每小时\s*([\d.]+)\s*个/) ||
    raw.match(/Usage rate:\s*approximately\s*([\d.]+)\s*per hour/i);
  const sessionsMatch =
    raw.match(/您有\s*(\d+)\s*个有效会话/) ||
    raw.match(/You have\s*(\d+)\s*active session/i);
  const noUnits = /您目前没有可用的计算单元|You currently have no compute units/i.test(raw);
  const unsubscribed = /您未订阅|You are not subscribed/i.test(raw);

  return {
    subscribed: !unsubscribed && Boolean(tierMatch || balanceMatch),
    colabTier: tierMatch ? tierMatch[1].trim() : unsubscribed ? 'Free (未订阅)' : null,
    balance: balanceMatch ? Number(balanceMatch[1]) : unsubscribed && noUnits ? 0 : null,
    burnRatePerHour: rateMatch ? Number(rateMatch[1]) : null,
    activeSessions: sessionsMatch ? Number(sessionsMatch[1]) : null,
  };
}

export function parseGoogleOneStorage(text) {
  const number = '([\\d,.]+)';
  const units = '(KB|MB|GB|TB)';
  const match = text.match(new RegExp('已使用\\s*' + number + '\\s*' + units + '\\s*[，,]\\s*共\\s*' + number + '\\s*' + units, 'i'))
    || text.match(new RegExp(number + '\\s*' + units + '\\s+of\\s+' + number + '\\s*' + units + '\\s+used', 'i'));
  if (!match) return null;
  const [, usedText, usedUnit, limitText, limitUnit] = match;
  const used = Number(usedText.replaceAll(',', ''));
  const limit = Number(limitText.replaceAll(',', ''));
  const scale = { KB: 1e-9, MB: 1e-6, GB: 1e-3, TB: 1 };
  if (!Number.isFinite(used) || !Number.isFinite(limit) || limit <= 0) return null;
  return {
    used: used * scale[usedUnit.toUpperCase()],
    limit: limit * scale[limitUnit.toUpperCase()],
    reportedUsage: used + ' ' + usedUnit.toUpperCase() + ' / ' + limit + ' ' + limitUnit.toUpperCase(),
  };
}

async function readGooglePage(account, label, url, readPanel) {
  const email = account.email?.trim().toLowerCase();
  if (!email) throw new Error('请先在账号设置中填写 Google 邮箱和 Colab 登录账号索引');
  const script = `
const task = await taskSpace(${JSON.stringify(label + '-' + Date.now())});
try {
  const page = task.page("p1");
  await page.goto(${JSON.stringify(url)}, { waitUntil: "domcontentloaded", timeout: 21000 });
  await page.waitForSelector('a[aria-label*="Google 账号"], a[aria-label*="Google Account"]', { state: "visible", timeout: 8000 });
  const identity = await page.evaluate(() => Array.from(document.querySelectorAll('a[aria-label]'))
    .map((link) => link.getAttribute('aria-label'))
    .find((name) => /^Google (账号|Account)/i.test(name)));
  if (!identity?.toLowerCase().includes("(" + ${JSON.stringify(email)} + ")")) {
    console.log("ULTRA_ACCOUNT_MISMATCH");
  } else {
    ${readPanel}
  }
} finally {
  await task.finish({ keep: [] });
}
`;
  const localCli = join(homedir(), '.local', 'bin', 'ego-browser');
  try {
    // ego-browser 的 CLI 会把 Node 的 console 输出写入 stderr。
    const { stdout, stderr } = await execFileAsync(existsSync(localCli) ? localCli : 'ego-browser', ['nodejs', '-e', script], {
      timeout: 55000, maxBuffer: 1024 * 1024,
    });
    const output = [stdout, stderr].join('\n');
    if (output.includes('ULTRA_ACCOUNT_MISMATCH')) {
      throw new Error('页面登录的 Google 账号和插件邮箱不一致，请检查账号索引');
    }
    return output;
  } catch (error) {
    if (error.code === 'ENOENT') throw new Error('找不到 ego-browser，请确认 ego lite 已安装');
    if (error.killed || error.code) throw new Error(label + '读取失败，请确认 ego-browser 已登录该账号并能打开对应页面');
    throw error;
  }
}

export class UltraService {
  constructor(ctx, store = new UltraStore()) {
    this.ctx = ctx;
    this.store = store;
  }

  getDashboardState() {
    const state = this.store.getState();
    const active = state.accounts.find((a) => a.id === state.activeAccountId) || state.accounts[0];
    const cu = active?.computeUnits || { balance: 0, monthlyAllowance: 1000, burnRatePerHour: 0, lowThreshold: 100 };
    const allowance = Math.max(1, Number(cu.monthlyAllowance) || 1000);
    const balance = Number(cu.balance) || 0;
    const burnRate = Number(cu.burnRatePerHour) || 0;
    const remainingPct = Math.min(100, Math.max(0, Number(((balance / allowance) * 100).toFixed(1))));
    const estimatedHoursCurrentRate = burnRate > 0 ? Number((balance / burnRate).toFixed(1)) : null;

    const gpuRunway = GPU_RATE_PRESETS.map((gpu) => ({
      ...gpu,
      maxHours: gpu.ratePerHour > 0 ? Number((balance / gpu.ratePerHour).toFixed(1)) : 0,
    }));

    return {
      ...state,
      gpuPresets: GPU_RATE_PRESETS,
      catalog: ULTRA_CATALOG,
      summary: {
        activeAccountId: active?.id,
        balance,
        monthlyAllowance: allowance,
        remainingPct,
        burnRatePerHour: burnRate,
        estimatedHoursCurrentRate,
        isLowBalance: balance <= (Number(cu.lowThreshold) || 100),
        gpuRunway,
      },
    };
  }

  selectAccount(accountId) {
    this.store.setActiveAccount(accountId);
    return this.getDashboardState();
  }

  saveAccount(patch) {
    this.store.upsertAccount(patch);
    return this.getDashboardState();
  }

  saveBenefit(accountId, benefit, observation) {
    this.store.upsertBenefit(accountId, benefit, observation);
    return this.getDashboardState();
  }

  removeBenefit(accountId, benefitId) {
    this.store.deleteBenefit(accountId, benefitId);
    return this.getDashboardState();
  }

  logUsage(accountId, entry) {
    this.store.addUsageLog(accountId, entry);
    return this.getDashboardState();
  }

  removeUsageLog(accountId, logId) {
    this.store.deleteUsageLog(accountId, logId);
    return this.getDashboardState();
  }

  estimateGpuCost({ gpuId, hours, accountId }) {
    const state = this.store.getState();
    const acct =
      state.accounts.find((a) => a.id === (accountId || state.activeAccountId)) || state.accounts[0];
    const preset = GPU_RATE_PRESETS.find((g) => g.id === gpuId) || GPU_RATE_PRESETS[2];
    const duration = Math.max(0, Number(hours) || 0);
    const estimatedCost = Number((preset.ratePerHour * duration).toFixed(2));
    const currentBalance = Number(acct?.computeUnits?.balance || 0);
    const balanceAfter = Number(Math.max(0, currentBalance - estimatedCost).toFixed(2));
    return {
      gpu: preset,
      hours: duration,
      estimatedCost,
      currentBalance,
      balanceAfter,
      sufficient: currentBalance >= estimatedCost,
    };
  }

  async syncFromColab({ accountId } = {}) {
    const acct = this.getSyncAccount(accountId);
    const url = `https://colab.research.google.com/notebooks/intro.ipynb?hl=zh-cn&authuser=${acct.authuser}`;
    const stdout = await readGooglePage(acct, 'Colab', url, `
    await page.waitForSelector("#runtime-menu-button", { state: "visible", timeout: 10000 });
    await page.click("#runtime-menu-button", { label: "打开 Colab 运行时菜单" });
    await page.waitForSelector('text="查看资源"', { state: "visible", timeout: 6000 });
    await page.click('text="查看资源"', { label: "查看 Colab 计算单元" });
    await page.waitForSelector('text=个计算单元', { state: "visible", timeout: 8500 });
    const snapshot = await page.snapshot({ scope: "full_page" });
    console.log(snapshot.split("\\n").filter((line) => /订阅|计算单元|使用率|有效会话/.test(line)).join("\\n"));
`);
    const parsed = parseColabResourcesText(stdout);
    if (parsed.balance === null) {
      throw new Error('Colab 资源面板未返回可读的计算单元');
    }

    const now = new Date().toISOString();
    const prevBalance = this.getSyncAccount(acct.id).computeUnits.balance;
    const nextBalance = parsed.balance;
    const delta = Number((nextBalance - prevBalance).toFixed(2));

    this.store.upsertAccount({
      id: acct.id,
      ...(parsed.colabTier ? { colabTier: parsed.colabTier } : {}),
      computeUnits: {
        balance: nextBalance,
        burnRatePerHour: parsed.burnRatePerHour,
        activeSessions: parsed.activeSessions,
        lastSyncedAt: now,
        source: 'ego-browser',
      },
    });

    this.store.addUsageLog(acct.id, {
      timestamp: now,
      type: 'sync',
      title: '从 Colab 实时同步计算单元',
      gpu: '',
      hours: 0,
      unitsDelta: delta,
      applyToBalance: false,
      note: `订阅：${parsed.colabTier || acct.colabTier}；余额：${nextBalance}；速率：${parsed.burnRatePerHour ?? '未显示'}/h；有效会话：${parsed.activeSessions ?? '未显示'}`,
    });

    return {
      synced: parsed,
      state: this.getDashboardState(),
    };
  }
  getSyncAccount(accountId) {
    const state = this.store.getState();
    const acct = state.accounts.find((a) => a.id === (accountId || state.activeAccountId));
    if (!acct) throw new Error('未找到可同步的账号');
    const index = Number(acct.authuser);
    if (!Number.isInteger(index) || index < 0) throw new Error('Google 登录账号索引需要是非负整数');
    return { ...acct, authuser: index };
  }

  async syncFromGoogleOne({ accountId } = {}) {
    const account = this.getSyncAccount(accountId);
    const url = `https://one.google.com/u/${account.authuser}/storage?hl=zh-CN`;
    const stdout = await readGooglePage(account, 'Google One 存储', url, `
    await page.waitForSelector('text=已使用', { state: "visible", timeout: 9500 });
    const snapshot = await page.snapshot({ scope: "full_page" });
    console.log(snapshot.split("\\n").filter((line) => /已使用| used/.test(line)).join("\\n"));
`);
    const synced = parseGoogleOneStorage(stdout);
    if (!synced) throw new Error('Google One 页面未返回可读的存储用量');
    const state = this.saveBenefit(account.id, {
      id: 'google-one-storage',
      name: 'Google One 云存储',
      category: '存储',
      used: synced.used,
      limit: synced.limit,
      unit: 'TB',
      resetCycle: '持续',
    }, { source: 'google-one-storage', reportedUsage: synced.reportedUsage });
    return { synced, state };
  }

}
