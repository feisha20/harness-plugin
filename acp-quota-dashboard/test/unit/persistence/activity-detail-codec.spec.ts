import { describe, expect, it } from 'vitest'
import { deflateSync } from 'node:zlib'
import { decodeActivityDetail, encodeActivityDetail } from '../../../src/persistence/activity-detail-codec.ts'

describe('活动详情无损压缩', () => {
  it('兼容旧文本和空值，小详情保持原文', () => {
    expect(encodeActivityDetail(undefined)).toBeNull()
    expect(encodeActivityDetail('中文')).toBe('中文')
    expect(decodeActivityDetail('{"legacy":true}')).toBe('{"legacy":true}')
    expect(decodeActivityDetail(null)).toBeNull()
  })
  it('长中文详情完整往返且节省空间', () => {
    const value = JSON.stringify({ text: '中文内容\n'.repeat(10000) })
    const packed = encodeActivityDetail(value)
    expect(packed).toBeInstanceOf(Uint8Array)
    expect((packed as Uint8Array).length).toBeLessThan(Buffer.byteLength(value) / 10)
    expect(decodeActivityDetail(packed)).toBe(value)
  })
  it('拒绝损坏编码与超出解压上限的内容', () => {
    expect(() => decodeActivityDetail(Buffer.from('bad'))).toThrow()
    expect(() => decodeActivityDetail(Buffer.from('ACPD1bad'))).toThrow()
    const oversized = Buffer.concat([Buffer.from('ACPD1'), deflateSync(Buffer.alloc(4 * 1024 * 1024 + 1))])
    expect(() => decodeActivityDetail(oversized)).toThrow()
  })
})
