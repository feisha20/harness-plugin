import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { parseColabResourcesText, parseGoogleOneStorage, UltraService } from './service.js';
import { UltraStore } from './store.js';

test('parseColabResourcesText parses Chinese Colab Pro+ resource panel output', () => {
  const sample = `
    text "您已订阅“Colab Pro+”。"
    text "可用：996.08个计算单元"
    text "使用率：大约每小时 6.73 个"
    text "您有 1 个有效会话。"
  `;
  const parsed = parseColabResourcesText(sample);
  assert.equal(parsed.subscribed, true);
  assert.equal(parsed.colabTier, 'Colab Pro+');
  assert.equal(parsed.balance, 996.08);
  assert.equal(parsed.burnRatePerHour, 6.73);
  assert.equal(parsed.activeSessions, 1);
});

test('parseColabResourcesText handles unsubscribed account', () => {
  const sample = `
    text "您未订阅。"
    text "您目前没有可用的计算单元。"
  `;
  const parsed = parseColabResourcesText(sample);
  assert.equal(parsed.subscribed, false);
  assert.equal(parsed.balance, 0);
});

test('UltraStore & UltraService support calibration, benefits, estimation, and usage logs', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'gum-test-'));
  try {
    const store = new UltraStore(dir);
    const service = new UltraService({}, store);

    const init = service.getDashboardState();
    assert.equal(init.accounts[0].email, '');
    assert.equal(init.accounts[0].computeUnits.source, 'unrecorded');
    service.saveAccount({
      id: 'test-ultra',
      email: 'test@example.com',
      monthlyPrice: '$100',
    });
    service.saveAccount({ id: 'test-ultra', computeUnits: { balance: 996.08, source: 'manual' } });

    const est = service.estimateGpuCost({ gpuId: 'A100', hours: 2 });
    assert.equal(est.estimatedCost, 13.46);
    assert.equal(est.sufficient, true);

    const afterLog = service.logUsage('test-ultra', {
      type: 'gpu-run',
      title: '测试 A100',
      gpu: 'A100',
      hours: 2,
      unitsDelta: -13.46,
    });
    assert.equal(afterLog.summary.balance, 982.62);

    const afterBenefit = service.saveBenefit('test-ultra', {
      id: 'ai-credits',
      name: 'AI Credits (Flow / Whisk / Veo)',
      category: '生成额度',
      used: 500,
      limit: 25000,
      unit: 'Credits',
      resetCycle: '每月',
    });
    const aiCredits = afterBenefit.accounts.find((account) => account.id === 'test-ultra').benefits.find((b) => b.id === 'ai-credits');
    assert.equal(aiCredits.used, 500);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});


test('解析 Google One 存储时保留页面显示的单位和精度', () => {
  const storage = parseGoogleOneStorage('text "已使用 35.87 GB，共 20 TB"');
  assert.equal(storage.reportedUsage, '35.87 GB / 20 TB');
  assert.equal(storage.limit, 20);
  assert.ok(Math.abs(storage.used - 0.03587) < 1e-10);
  assert.equal(parseGoogleOneStorage('没有存储总量'), null);
});

test('迁移至 Ultra 5x 时保留余额和手动记录，移除旧版默认占位数据', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'gum-v1-test-'));
  try {
    const initial = new UltraStore(dir).getState();
    const account = initial.accounts[0];
    account.planName = 'Google AI Ultra';
    account.computeUnits.balance = 321;
    account.benefits = [
      { id: 'google-one-storage', name: 'Google One 云端存储', used: 0, limit: 30, notes: 'Google Drive / Gmail / Photos 共享空间' },
      { id: 'ai-credits', name: 'AI Credits (Flow / Whisk / Veo)', used: 500, limit: 25000 },
    ];
    writeFileSync(path.join(dir, 'state.json'), JSON.stringify({ ...initial, version: 1 }));
    const data = new UltraService({}, new UltraStore(dir)).getDashboardState();
    assert.equal(data.version, 2);
    assert.equal(data.summary.balance, 321);
    assert.equal(data.accounts[0].planName, 'Google AI Ultra 5x');
    assert.deepEqual(data.accounts[0].benefits.map(({ id, used }) => [id, used]), [['ai-credits', 500]]);
    assert.deepEqual(data.catalog.groups[0].items.slice(0, 5).map(({ limit }) => limit), [1000, 20, 10000, 30000, 40]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
