import { test } from 'node:test'
import assert from 'node:assert/strict'
import { inferDailyInsight } from '../lib/host/reportSummary.js'

const task = (id, title, extra = {}) => ({
  id,
  title,
  source: 'manual',
  createdAt: '2026-11-11T02:00:00Z',
  recordDate: '2026-11-11',
  ...extra,
})

test('根据当天工作记录解析商业价值与明日计划', async () => {
  const insight = await inferDailyInsight('2026-11-11', [
    task('a', '梳理评测集回归流程', { projectPath: '/repo/test', evidence: [{ quote: '把回归步骤整理成可复用清单' }] }),
    task('b', '排查对话中断原因'),
  ], async input => {
    const payload = JSON.parse(input)
    assert.equal(payload.day, '2026-11-11')
    assert.equal(payload.records.length, 2)
    assert.equal(payload.records[0].project, '/repo/test')
    assert.deepEqual(payload.records[0].evidence, ['把回归步骤整理成可复用清单'])
    return {
      text: '```json\n{"value":["完成评测集回归梳理，减少重复验证时间"],"plan":["补齐回归用例：降低漏测风险"]}\n```',
      attribution: { provider: 'p', model: 'm', usedFallback: false },
    }
  })
  assert.deepEqual(insight.value, ['完成评测集回归梳理，减少重复验证时间'])
  assert.deepEqual(insight.plan, ['补齐回归用例：降低漏测风险'])
  assert.equal(insight.attribution.provider, 'p')
  assert.match(insight.generatedAt, /^\d{4}-\d{2}-\d{2}T/)
})

test('允许 JSON 前后带有说明文字并清理列表符号', async () => {
  const insight = await inferDailyInsight('2026-11-11', [task('a', '工作')], async () => ({
    text: '结果如下：\n{"value":["- 减少重复验证时间"],"plan":["• 补齐回归用例"]}\n请核对',
    attribution: { provider: 'p', model: 'm', usedFallback: false },
  }))
  assert.deepEqual(insight.value, ['减少重复验证时间'])
  assert.deepEqual(insight.plan, ['补齐回归用例'])
})

test('拒绝非 JSON、缺少数组或空数组的归纳结果', async () => {
  const fail = text => inferDailyInsight('2026-11-11', [task('a', '工作')], async () => ({ text, attribution: { provider: 'p', model: 'm', usedFallback: false } }))
  await assert.rejects(fail('不是 JSON'), /格式不正确/)
  await assert.rejects(fail('{"value":["收益"]}'), /缺少明日计划/)
  await assert.rejects(fail('{"value":[],"plan":["计划"]}'), /商业价值为空/)
  await assert.rejects(fail('{"value":["收益"],"plan":[]}'), /明日计划为空/)
})

test('当天没有记录时不调用模型', async () => {
  let called = false
  await assert.rejects(inferDailyInsight('2026-11-12', [task('a', '工作')], async () => {
    called = true
    return { text: '{}', attribution: { provider: 'p', model: 'm', usedFallback: false } }
  }), /没有工作记录/)
  assert.equal(called, false)
})
