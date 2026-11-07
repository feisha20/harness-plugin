import { describe, expect, it } from 'vitest'
import { decodeQuota } from '../src/runtime/quota.ts'

describe('官方会员额度解码', () => {
  it('仅返回白名单字段并保留零额度，不把缺失值当作零', () => {
    const view = decodeQuota({
      plan_tier: 'Google AI Pro',
      email: 'test@example.com',
      quota: {
        'gemini-5h': { remaining_fraction: 0, reset_time: '2026-11-07T05:00:00Z', secret: 'hidden' },
        'gemini-weekly': { remaining_fraction: 0.99621975 },
        '3p-5h': { remaining_fraction: 2 },
      },
    })
    expect(view.account).toBe('test@example.com')
    expect(view.buckets[0]?.remainingPercent).toBe(0)
    expect(view.buckets[1]?.remainingPercent).toBeCloseTo(99.621975)
    expect(view.buckets[2]?.remainingPercent).toBeNull()
    expect(JSON.stringify(view)).not.toMatch(/hidden|secret/)
  })
  it('拒绝将非法账号值显示为邮箱', () => {
    const view = decodeQuota({ email: 'invalid', quota: { 'gemini-5h': { remaining_fraction: 1 } } })
    expect(view.account).toBeNull()
  })
  it('未登录、空额度和畸形载荷均明确失败', () => {
    for (const value of [null, {}, { quota: {} }, { quota: [] }]) expect(() => decodeQuota(value)).toThrow()
  })
  it('金额与禁用状态独立显示，非法时间不泄露到 UI', () => {
    const view = decodeQuota({ quota: { credits: { remaining_amount: 42, disabled: true, reset_time: 'bad' } } })
    expect(view.buckets[0]).toMatchObject({
      remainingAmount: 42,
      remainingPercent: null,
      disabled: true,
      resetTime: null,
    })
  })
})
