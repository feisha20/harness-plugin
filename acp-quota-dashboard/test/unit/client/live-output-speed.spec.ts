import { describe, expect, it } from 'vitest'
import { estimateTokens, LiveOutputSpeed } from '../../../src/client/ui/live-output-speed.ts'

describe('实时输出速度估算', () => {
  it('首批输出计入速度，重复开始不重置统计', () => {
    const meter = new LiveOutputSpeed()
    meter.start('1', 0)
    expect(meter.observe('1', 10, 100)).toBe(100)
    meter.start('1', 0)
    expect(meter.observe('1', 20, 200)).toBe(100)
  })
  it('按字符类型估算且支持 Unicode', () => {
    expect(estimateTokens('abcd中文😀')).toBe(4)
  })
  it('忽略初始历史，统计增量，并在空闲后显示零速率', () => {
    const meter = new LiveOutputSpeed()
    expect(meter.observe('1:1', 100, 0)).toBeNull()
    expect(meter.observe('1:1', 120, 1000)).toBe(20)
    expect(meter.observe('1:1', 140, 2000)).toBe(20)
    expect(meter.observe('1:1', 140, 5000)).toBe(0)
  })
  it('结束、步骤切换和文本回退重置基线', () => {
    const meter = new LiveOutputSpeed()
    meter.observe('1:1', 100, 0)
    expect(meter.observe('1:2', 200, 1000)).toBeNull()
    expect(meter.observe('1:2', 220, 2000)).toBe(20)
    expect(meter.observe('1:2', 10, 2500)).toBeNull()
    expect(meter.observe(null, 0, 3000)).toBeNull()
    expect(meter.observe('2:1', 100, 4000)).toBeNull()
  })
})

import { SegmentedOutputSpeed } from '../../../src/client/ui/live-output-speed.ts'
it('分段平均排除工具等待，按 Token 和时长加权，完成后不增加时间', () => {
  const meter = new SegmentedOutputSpeed()
  meter.observe('a', [{ key: '1', tokens: 10 }], 1000)
  meter.observe('a', [{ key: '1', tokens: 100 }], 2000)
  meter.observe(
    'a',
    [
      { key: '1', tokens: 100 },
      { key: '2', tokens: 10 },
    ],
    62000,
  )
  meter.observe(
    'a',
    [
      { key: '1', tokens: 100 },
      { key: '2', tokens: 300 },
    ],
    64000,
  )
  expect(meter.average('a')).toBeCloseTo(400 / 3)
  meter.observe('a', [{ key: '2', tokens: 300 }], 100000)
  expect(meter.average('a')).toBeCloseTo(400 / 3)
  expect(meter.average('b')).toBeNull()
})
it('单次推送无可测时长，新任务不继承旧值', () => {
  const meter = new SegmentedOutputSpeed()
  meter.observe('a', [{ key: '1', tokens: 100 }], 0)
  expect(meter.average('a')).toBeNull()
  meter.observe('a', [{ key: '1', tokens: 200 }], 1000)
  meter.observe('b', [], 2000)
  expect(meter.average('b')).toBeNull()
})
