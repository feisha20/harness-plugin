import { describe, expect, it } from 'vitest'
import { OutputSpeedMeter } from '../../src/domain/session/output-speed.ts'
import { outputSpeedOf } from '../../src/contract/output-speed.ts'
import { acpOptionsSnapshotOf, toOptionsSnapshotRecord } from '../../src/persistence/options-snapshot.ts'
import { outputSpeedLabel } from '../../src/client/ui/AcpUsageFooter.ts'
import type { AcpAgentSessionSnapshotView } from '../../src/contract/remote.ts'

describe('后台输出速度', () => {
  it('累计正文和推理，排除工具等待，末批文本计入且完成后不再增加时长', () => {
    const meter = new OutputSpeedMeter()
    meter.begin(1)
    meter.add('reasoning', '中'.repeat(10), 1000)
    meter.add('reasoning', '中'.repeat(90), 2000)
    meter.breakSegment()
    meter.add('text', '中'.repeat(10), 62000)
    meter.add('text', '中'.repeat(290), 64000)
    const expected = { turn: 1, totalTokens: 400, sampledTokens: 400, durationMs: 3000 }
    expect(meter.snapshot()).toEqual(expected)
    meter.breakSegment()
    meter.breakSegment()
    expect(meter.snapshot()).toEqual(expected)
  })

  it('同一任务跨 prompt 和恢复保留总量，新任务清零', () => {
    const meter = new OutputSpeedMeter({ turn: 1, totalTokens: 100, sampledTokens: 100, durationMs: 1000 })
    meter.begin(1)
    meter.add('text', '中文', 60000)
    meter.add('text', '中文', 61000)
    meter.begin(1)
    expect(meter.snapshot()).toEqual({ turn: 1, totalTokens: 104, sampledTokens: 104, durationMs: 2000 })
    meter.begin(2)
    expect(meter.snapshot()).toEqual({ turn: 2, totalTokens: 0, sampledTokens: 0, durationMs: 0 })
  })

  it('消息 ID 切换和单次推送不虚构输出时长，空增量不延长时间', () => {
    const meter = new OutputSpeedMeter()
    meter.begin(1)
    meter.add('text', '中文', 1000, 'a')
    meter.add('text', '中文', 60000, 'b')
    meter.add('text', '', 61000, 'b')
    expect(meter.snapshot()).toEqual({ turn: 1, totalTokens: 4, sampledTokens: 0, durationMs: 0 })
    meter.add('text', '中文', 61000, 'b')
    expect(meter.snapshot()).toEqual({ turn: 1, totalTokens: 6, sampledTokens: 4, durationMs: 1000 })
  })

  it('快照往返后可直接展示，不需要前端重新采样；不会串到下一任务', () => {
    const outputSpeed = { turn: 1, totalTokens: 400, sampledTokens: 400, durationMs: 3000 }
    const record = acpOptionsSnapshotOf([], undefined, 'test', 1, { outputSpeed })
    const restored = toOptionsSnapshotRecord(JSON.parse(JSON.stringify(record)))!
    expect(restored.outputSpeed).toEqual(outputSpeed)
    const view = { outputSpeed: restored.outputSpeed } as AcpAgentSessionSnapshotView
    expect(outputSpeedLabel(view, 1)).toBe('本次平均 ≈ 133.3 tok/s')
    expect(outputSpeedLabel(view, 2)).toBe('本次平均：缺少采样')
    expect(outputSpeedLabel(null, 1)).toBe('本次平均：缺少采样')
    expect(
      outputSpeedLabel(
        { outputSpeed: { ...outputSpeed, sampledTokens: 0, durationMs: 0 } } as AcpAgentSessionSnapshotView,
        1,
      ),
    ).toBe('本次平均：无可测输出时长')
    const { outputSpeed: _, ...legacy } = record
    expect(toOptionsSnapshotRecord(legacy)?.outputSpeed).toBeNull()
  })

  it.each([
    { turn: -1 },
    { totalTokens: NaN },
    { sampledTokens: Infinity },
    { durationMs: -1 },
    { sampledTokens: 101 },
    { durationMs: 0 },
    { turn: 1.5 },
  ])('拒绝损坏采样，不影响其他快照字段：%j', (invalid) => {
    const outputSpeed = { turn: 1, totalTokens: 100, sampledTokens: 100, durationMs: 1000, ...invalid }
    expect(outputSpeedOf(outputSpeed)).toBeUndefined()
    const record = acpOptionsSnapshotOf([], undefined, 'test', 1)
    expect(toOptionsSnapshotRecord({ ...record, outputSpeed })?.outputSpeed).toBeNull()
  })
})
