import { describe, expect, it, vi } from 'vitest'
import {
  decodeExitTrace,
  decodeIpWhois,
  decodePing0,
  exitProbeChain,
  ExitRegionMonitor,
} from '../src/runtime/exit-region.ts'

describe('代理出口地区', () => {
  it('按目标和源端口定位本次探测，拒绝重名或未跟踪连接', () => {
    const metadata = { host: 'ping0.cc', sourcePort: '12345', sourceIP: '127.0.0.1' }
    const row = { metadata, chains: ['node-a', 'group'] }
    expect(exitProbeChain([row], 'ping0.cc', 12345)).toBe('["node-a","group"]')
    expect(exitProbeChain([row], 'chatgpt.com', 12345)).toBeUndefined()
    expect(exitProbeChain([row], 'ping0.cc', 12346)).toBeUndefined()
    expect(exitProbeChain([row, { ...row, chains: ['node-b'] }], 'ping0.cc', 12345)).toBeUndefined()
  })

  it('只采用探测到的 IP 地区，Cloudflare 机房代码不参与定位', () => {
    const sample = decodeExitTrace('ip=203.0.113.1\ncolo=HKG\nloc=US\n')
    expect(sample).toMatchObject({ ip: '203.0.113.1', country: 'US', source: 'cloudflare' })
    expect(() => decodeExitTrace('ip=example.com\nloc=US\n')).toThrow()
    expect(() => decodeExitTrace('ip=203.0.113.1\ncolo=HKG\n')).toThrow()
  })

  it('解析 Ping0 免费接口与 IPWhois 返回，拒绝错误响应', () => {
    expect(decodePing0('203.0.113.1\n美国 华盛顿州 西雅图\nAS201106\n测试')).toMatchObject({
      country: 'US',
      location: '美国 华盛顿州 西雅图',
      source: 'ping0',
    })
    expect(decodePing0('2001:db8::1\n中国香港\nAS123\n测试')).toMatchObject({ country: 'HK', source: 'ping0' })
    expect(() => decodePing0('203.0.113.1\n未知\nAS123\n测试')).toThrow()
    expect(decodeIpWhois('{"success":true,"ip":"203.0.113.2","country_code":"SG"}')).toMatchObject({
      country: 'SG',
      source: 'ipwhois',
    })
    expect(() => decodeIpWhois('{"success":false,"message":"limit"}')).toThrow()
  })

  it('两个服务分别缓存，合并并发，并在失败时保留带状态的旧结果', async () => {
    let now = 10_000
    const first = { ...decodeExitTrace('ip=203.0.113.1\nloc=US\n'), checkedAt: now }
    const next = { ...decodeExitTrace('ip=203.0.113.2\nloc=JP\n'), checkedAt: now + 50_000 }
    const probe = vi
      .fn()
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(next)
      .mockRejectedValueOnce(new Error('离线'))
    const monitor = new ExitRegionMonitor(probe, () => now)
    const pending = monitor.read('codex', false)
    expect(monitor.read('codex', true)).toBe(pending)
    expect(await pending).toMatchObject({ status: 'confirmed', sample: first, change: null })
    expect(await monitor.read('antigravity', false)).toMatchObject({ status: 'unmatched', sample: null })
    expect(await monitor.read('codex', false)).toMatchObject({ sample: first })
    now += 50_000
    expect(await monitor.read('codex', false)).toMatchObject({
      status: 'confirmed',
      sample: next,
      change: { country: 'US', at: now },
    })
    now += 5001
    expect(await monitor.read('codex', true)).toMatchObject({ status: 'unavailable', sample: next })
    expect(probe).toHaveBeenCalledTimes(4)
  })
})
