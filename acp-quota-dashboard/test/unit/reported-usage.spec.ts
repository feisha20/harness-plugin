import { describe, it, expect } from 'vitest'
import { reportedUsageOf } from '../../src/contract/reported-usage.ts'
import { acpOptionsSnapshotOf, toOptionsSnapshotRecord } from '../../src/persistence/options-snapshot.ts'
import { usageLabels } from '../../src/client/ui/AcpUsageFooter.ts'
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
  it('显示缓存计数，不把总量冒充上下文或生成速率', () => {
    const snapshot = { contextUsage: null, reportedUsage: usage } as AcpAgentSessionSnapshotView
    expect(usageLabels(snapshot).join(' ')).toContain('缓存读取')
    expect(usageLabels(snapshot).join(' ')).not.toMatch(/上下文|命中率|tok\/s/)
    expect(usageLabels({ ...snapshot, reportedUsage: null })).toEqual([])
  })
})
