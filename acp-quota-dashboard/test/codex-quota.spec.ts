import { describe, expect, it } from 'vitest'
import { decodeCodexQuota, resolveCodexCli } from '../src/runtime/codex-quota.ts'

describe('Codex 官方额度解析', () => {
  const account = { account: { type: 'chatgpt', email: 'test@example.com', planType: 'plus' } }
  it('转换已用比例，保留耗尽额度及真实窗口', () => {
    const result = decodeCodexQuota(account, {
      rateLimits: {
        primary: { usedPercent: 100, windowDurationMins: 300, resetsAt: 1730947200 },
        secondary: { usedPercent: 25, windowDurationMins: 10080 },
      },
    })
    expect(result.buckets.map((x) => x.remainingPercent)).toEqual([0, 75])
    expect(result.buckets.map((x) => x.label)).toEqual(['五小时额度', '周额度'])
    expect(result.buckets[0]?.resetTime).toBe('2024-11-07T02:40:00.000Z')
  })
  it('优先 Codex 专属桶，缺失值不当作零', () => {
    const result = decodeCodexQuota(account, {
      rateLimitsByLimitId: { codex: { primary: { windowDurationMins: 15 } } },
    })
    expect(result.buckets[0]?.remainingPercent).toBeNull()
    expect(result.buckets[0]?.label).toBe('15 分钟额度')
  })
  it('未登录、API key 与空额度明确失败', () => {
    expect(() => decodeCodexQuota({ account: { type: 'apiKey' } }, {})).toThrow()
    expect(() => decodeCodexQuota(account, {})).toThrow()
  })
  it('解析官方 CLI 路径，优先显式配置', async () => {
    const seam = {
      resolveExecutable: async (cmd: string) => cmd,
      spawn: () => ({} as any),
    }
    const argv = await resolveCodexCli(seam as any, { CODEX_PATH: '/custom/bin/codex' })
    expect(argv).toEqual(['/custom/bin/codex', 'app-server'])
  })
})
