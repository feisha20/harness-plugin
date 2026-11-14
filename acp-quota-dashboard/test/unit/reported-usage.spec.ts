import { describe, it, expect } from 'vitest'
import { reportedUsageOf } from '../../src/contract/reported-usage.ts'
import { acpOptionsSnapshotOf, toOptionsSnapshotRecord } from '../../src/persistence/options-snapshot.ts'
import { usageLabels, retainUsageSnapshot } from '../../src/client/ui/AcpUsageFooter.ts'
import type { AcpAgentSessionSnapshotView } from '../../src/contract/remote.ts'

const usage = { totalTokens: 100, inputTokens: 30, outputTokens: 20, cachedReadTokens: 50 }
describe('ACP 上报用量', () => {
  it('丢弃元数据，保留真实零值和未知可选分类', () => {
    expect(reportedUsageOf({ ...usage, outputTokens: 0, cachedWriteTokens: null, _meta: { secret: 'no' } })).toEqual({
      ...usage,
      outputTokens: 0,
    })
  })
  it.each([-1, NaN, Infinity, 1.5, '100', Number.MAX_SAFE_INTEGER + 1])('拒绝无效计数 %s', (value) => {
    expect(reportedUsageOf({ ...usage, totalTokens: value })).toBeUndefined()
  })
  it('快照往返保留分类且兼容旧记录', () => {
    const saved = acpOptionsSnapshotOf([], undefined, 'fixture', 1, { reportedUsage: usage })
    expect(toOptionsSnapshotRecord(JSON.parse(JSON.stringify(saved)))?.reportedUsage).toEqual(usage)
    const { reportedUsage: _, ...legacy } = saved
    expect(toOptionsSnapshotRecord(legacy)?.reportedUsage).toBeNull()
  })
  it('底栏仅显示上下文，不展示费用和上报分类', () => {
    const snapshot = { contextUsage: null, reportedUsage: usage } as AcpAgentSessionSnapshotView
    expect(usageLabels(snapshot)).toEqual(['上下文：待上报'])
    expect(
      usageLabels({
        ...snapshot,
        contextUsage: { used: 100, size: 1000, percent: 10, cost: { amount: 1, currency: 'USD' } },
      }),
    ).toEqual(['上下文 0.1k / 1k（10%）'])
    expect(usageLabels({ ...snapshot, reportedUsage: null })).toEqual(['上下文：待上报'])
  })
})

it('短暂缺报保留同一 Agent 上下文，不串到其他 Agent', () => {
  const previous = {
    profileId: 'a',
    contextUsage: { used: 10, size: 100, percent: 10, cost: null },
    freshness: 'live',
  } as AcpAgentSessionSnapshotView
  expect(retainUsageSnapshot(previous, null)).toEqual({ ...previous, freshness: 'stale' })
  expect(retainUsageSnapshot(previous, { ...previous, contextUsage: null })?.contextUsage).toEqual(
    previous.contextUsage,
  )
  expect(retainUsageSnapshot(previous, { ...previous, profileId: 'b', contextUsage: null })?.contextUsage).toBeNull()
  expect(retainUsageSnapshot(previous, previous)?.freshness).toBe('live')
})
