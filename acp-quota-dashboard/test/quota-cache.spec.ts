import { describe, expect, it } from 'vitest'
import { QuotaCache, quotaAgentId } from '../src/client/data/quota-cache.ts'
import type { QuotaView } from '../src/contract/quota.ts'
const value: QuotaView = {
  account: 'test@example.com',
  plan: 'Google AI Pro',
  buckets: [],
  fetchedAt: '2026-11-07T00:00:00Z',
  source: 'official-cli-statusline',
}
describe('额度仪表缓存与路由', () => {
  it('为 Antigravity 和 Codex 显示额度', () => {
    const agents = { google: { runtime: 'antigravity' }, codex: { runtime: 'codex' } }
    expect(quotaAgentId('acp-google', agents)).toBe('google')
    expect(quotaAgentId('acp-codex', agents)).toBe('codex')
    for (const id of ['deepseek', 'acp-missing', undefined]) expect(quotaAgentId(id, agents)).toBeUndefined()
  })
  it('合并并发请求，悬停复用缓存，手动刷新有冷却时间', async () => {
    let now = 0
    let count = 0
    const cache = new QuotaCache(
      async () => {
        count++
        return value
      },
      () => now,
    )
    const a = cache.read('google')
    const b = cache.read('google', true)
    expect(a).toBe(b)
    await a
    now = 1000
    await cache.read('google', true)
    expect(count).toBe(1)
    now = 16000
    await cache.read('google', true)
    expect(count).toBe(2)
    now = 20000
    await cache.read('google')
    expect(count).toBe(2)
    now = 140000
    await cache.read('google')
    expect(count).toBe(3)
  })
  it('查询失败不保存虚假数据，并允许下一次重试', async () => {
    let count = 0
    const cache = new QuotaCache(async () => {
      if (++count === 1) throw new Error('offline')
      return value
    })
    await expect(cache.read('google')).rejects.toThrow('offline')
    expect(await cache.read('google')).toBe(value)
  })
})
