import { request, type ClientRequest, type IncomingMessage, type RequestOptions } from 'node:http'
import { isIP, type Socket } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { connect, type TLSSocket } from 'node:tls'
import type { ExitRegionProvider, ExitRegionSample, ExitRegionView } from '../contract/exit-region.ts'

const targets: Record<ExitRegionProvider, string> = {
  codex: 'chatgpt.com',
  antigravity: 'daily-cloudcode-pa.googleapis.com',
}
const reflectors = ['ipv4.ping0.cc', 'ping0.cc', 'www.cloudflare.com', 'ipwho.is'] as const
const maxControllerBody = 2 * 1024 * 1024

interface Tunnel {
  readonly host: string
  readonly port: number
  readonly socket: TLSSocket
}

interface Connection {
  readonly metadata?: {
    readonly host?: string
    readonly sourceIP?: string
    readonly sourcePort?: string | number
    readonly process?: string
    readonly processPath?: string
  }
  readonly chains?: readonly string[]
}

function readText(options: RequestOptions, limit: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = request(options, async (response: IncomingMessage) => {
      try {
        if (response.statusCode !== 200) throw new Error('探测响应不可用')
        const chunks: Buffer[] = []
        let size = 0
        for await (const chunk of response) {
          size += chunk.length
          if (size > limit) throw new Error('探测响应过大')
          chunks.push(chunk)
        }
        resolve(Buffer.concat(chunks).toString('utf8'))
      } catch (error) {
        response.destroy()
        reject(error)
      }
    })
    req.once('error', reject)
    req.end()
  })
}

async function controller(): Promise<{ socketPath: string; proxyPort: number }> {
  const uid = process.getuid?.()
  const paths = [
    ...(uid === undefined ? [] : [`/var/run/clash-verge-service/users/${uid}/verge-mihomo.sock`]),
    join(tmpdir(), 'verge-mihomo.sock'),
  ]
  const candidates = await Promise.allSettled(
    paths.map(async (socketPath) => {
      const data = JSON.parse(
        await readText({ socketPath, path: '/configs', signal: AbortSignal.timeout(1500) }, 65536),
      )
      const proxyPort = data['mixed-port'] || data.port
      if (!Number.isInteger(proxyPort) || proxyPort < 1 || proxyPort > 65535) throw new Error('代理端口不可用')
      return { socketPath, proxyPort }
    }),
  )
  const selected = candidates.find((entry) => entry.status === 'fulfilled')
  if (!selected) throw new Error('Clash Verge 控制入口不可用')
  return selected.value
}

function openTunnel(proxyPort: number, host: string, signal: AbortSignal): Promise<Tunnel> {
  return new Promise((resolve, reject) => {
    const authority = `${host}:443`
    const proxy: ClientRequest = request({
      hostname: '127.0.0.1',
      port: proxyPort,
      method: 'CONNECT',
      path: authority,
      headers: { Host: authority },
      agent: false,
      signal,
    })
    const deadline = setTimeout(() => proxy.destroy(new Error('连接探测超时')), 3500)
    proxy.once('error', (error) => {
      clearTimeout(deadline)
      reject(error)
    })
    proxy.once('close', () => clearTimeout(deadline))
    proxy.once('connect', (response, socket: Socket, head) => {
      clearTimeout(deadline)
      if (response.statusCode !== 200 || socket.localPort === undefined || signal.aborted) {
        socket.destroy()
        reject(new Error('无法打开代理隧道'))
        return
      }
      if (head.length) socket.unshift(head)
      const port = socket.localPort
      const tls = connect({ socket, host, ...(isIP(host) ? {} : { servername: host }), rejectUnauthorized: true })
      const handshake = setTimeout(() => tls.destroy(new Error('TLS 握手超时')), 3500)
      const abort = () => tls.destroy(new Error('探测超时'))
      signal.addEventListener('abort', abort, { once: true })
      tls.once('close', () => {
        clearTimeout(handshake)
        signal.removeEventListener('abort', abort)
        reject(new Error('代理隧道提前关闭'))
      })
      tls.on('error', reject)
      tls.once('secureConnect', () => {
        clearTimeout(handshake)
        resolve({ host, port, socket: tls })
      })
    })
    proxy.end()
  })
}

/** 只接受与本次探测连接的目标和本地源端口同时匹配的线路。 */
export function exitProbeChain(connections: readonly Connection[], host: string, port: number): string | undefined {
  const rows = connections.filter(
    ({ metadata }) =>
      metadata?.host === host &&
      Number(metadata.sourcePort) === port &&
      (metadata.sourceIP === '127.0.0.1' || metadata.sourceIP === '::ffff:127.0.0.1'),
  )
  const chain = rows[0]?.chains
  if (
    rows.length !== 1 ||
    !Array.isArray(chain) ||
    chain.length === 0 ||
    !chain.every((part) => typeof part === 'string' && part.length > 0)
  )
    return undefined
  return JSON.stringify(chain)
}

export function decodeExitTrace(text: string): ExitRegionSample {
  const ip = /^ip=([^\r\n]+)$/m.exec(text)?.[1]?.trim()
  const country = /^loc=([A-Z]{2})\r?$/m.exec(text)?.[1]
  if (!ip || !isIP(ip) || !country || country === 'XX') throw new Error('出口地区未上报')
  return sampleOf(ip, country, 'cloudflare')
}

const zhRegions = new Intl.DisplayNames('zh-CN', { type: 'region', fallback: 'none' })
const ping0Aliases = new Map([
  ['中国香港', 'HK'],
  ['中国台湾', 'TW'],
  ['中国澳门', 'MO'],
])

function sampleOf(
  ip: string,
  country: string,
  source: ExitRegionSample['source'],
  location: string | null = null,
): ExitRegionSample {
  if (!isIP(ip) || !/^[A-Z]{2}$/.test(country) || country === 'XX' || !zhRegions.of(country))
    throw new Error('出口地区未上报')
  return { ip, country, location, source, checkedAt: Date.now() }
}

export function decodePing0(text: string): ExitRegionSample {
  const [ip, location, asn] = text.trim().split(/\r?\n/)
  if (!ip || !location || location.length > 140 || !/^AS[0-9]+$/.test(asn ?? '')) throw new Error('Ping0 返回格式无效')
  const [name] = location.trim().split(/\s+/)
  const alias = name && ping0Aliases.get(name)
  if (alias) return sampleOf(ip.trim(), alias, 'ping0', location.trim())
  for (let first = 65; first <= 90; first++) {
    for (let second = 65; second <= 90; second++) {
      const code = String.fromCharCode(first, second)
      if (zhRegions.of(code) === name) return sampleOf(ip.trim(), code, 'ping0', location.trim())
    }
  }
  throw new Error('Ping0 地区未识别')
}

export function decodeIpWhois(text: string): ExitRegionSample {
  const data = JSON.parse(text)
  if (data?.success !== true || typeof data.ip !== 'string' || typeof data.country_code !== 'string')
    throw new Error('IP 地区查询失败')
  return sampleOf(data.ip, data.country_code, 'ipwhois')
}

/** 用同一 Mihomo 入口测服务域名，线路相同才读取第三方反射结果。 */
export async function probeExitRegion(provider: ExitRegionProvider): Promise<ExitRegionSample | null> {
  const { socketPath, proxyPort } = await controller()
  const signal = AbortSignal.timeout(10_000)
  const opened: Tunnel[] = []
  const open = async (host: string) => {
    const entry = await openTunnel(proxyPort, host, signal)
    opened.push(entry)
    return entry
  }
  try {
    const settled = await Promise.allSettled([targets[provider], ...reflectors].map(open))
    const target = settled[0]
    if (target?.status !== 'fulfilled') return null
    const data = JSON.parse(await readText({ socketPath, path: '/connections', signal }, maxControllerBody))
    if (!Array.isArray(data.connections)) return null
    const chain = (entry: Tunnel) => exitProbeChain(data.connections, entry.host, entry.port)
    const expected = chain(target.value)
    if (expected === undefined) return null
    const agentProcess =
      provider === 'codex' ? /(?:^|[\\/])codex(?:[.-][^\\/]*)?$/i : /(?:^|[\\/])(?:agy|antigravity)(?:[_.-][^\\/]*)?$/i
    const liveRoutes = (data.connections as Connection[]).filter(
      ({ metadata }) =>
        metadata?.host === target.value.host &&
        (agentProcess.test(metadata.process ?? '') || agentProcess.test(metadata.processPath ?? '')),
    )
    if (liveRoutes.some(({ chains }) => JSON.stringify(chains) !== expected)) return null
    // 先尝试 Codex 自身的 trace，再尝试同链路的公开地区探测。
    const candidates = settled.filter(
      (entry): entry is PromiseFulfilledResult<Tunnel> =>
        entry.status === 'fulfilled' &&
        chain(entry.value) === expected &&
        (provider === 'codex' || entry.value !== target.value),
    )
    for (const { value: entry } of candidates) {
      if (entry.socket.destroyed) continue
      try {
        const ping0 = entry.host === 'ping0.cc' || entry.host === 'ipv4.ping0.cc'
        const text = await readText(
          {
            hostname: entry.host,
            path: ping0 ? '/geo' : entry.host === 'ipwho.is' ? '/?fields=success,ip,country_code' : '/cdn-cgi/trace',
            headers: { Connection: 'close' },
            createConnection: () => entry.socket,
            signal,
          },
          8192,
        )
        if (ping0) return decodePing0(text)
        if (entry.host === 'ipwho.is') return decodeIpWhois(text)
        return decodeExitTrace(text)
      } catch {
        // 同链路的探测点不可用时尝试下一处。
      }
    }
    return null
  } finally {
    for (const { socket } of opened) socket.destroy()
  }
}

export class ExitRegionMonitor {
  private readonly results = new Map<ExitRegionProvider, { readonly at: number; readonly view: ExitRegionView }>()
  private readonly pending = new Map<ExitRegionProvider, Promise<ExitRegionView>>()

  constructor(
    private readonly probe = probeExitRegion,
    private readonly now = Date.now,
  ) {}

  read(provider: ExitRegionProvider, force: boolean): Promise<ExitRegionView> {
    const inflight = this.pending.get(provider)
    if (inflight) return inflight
    const previous = this.results.get(provider)
    if (previous && this.now() - previous.at < (force ? 5000 : 45_000)) return Promise.resolve(previous.view)
    const request = this.probe(provider)
      .then(
        (sample) => {
          if (!sample) return this.remember(provider, previous?.view, 'unmatched')
          const before = previous?.view.sample
          const change =
            before && (before.country !== sample.country || before.ip !== sample.ip)
              ? { country: before.country, at: sample.checkedAt }
              : (previous?.view.change ?? null)
          const view: ExitRegionView = { status: 'confirmed', sample, change }
          this.results.set(provider, { view, at: this.now() })
          return view
        },
        () => this.remember(provider, previous?.view, 'unavailable'),
      )
      .finally(() => this.pending.delete(provider))
    this.pending.set(provider, request)
    return request
  }

  private remember(
    provider: ExitRegionProvider,
    previous: ExitRegionView | undefined,
    status: 'unmatched' | 'unavailable',
  ): ExitRegionView {
    const view: ExitRegionView = { status, sample: previous?.sample ?? null, change: previous?.change ?? null }
    this.results.set(provider, { view, at: this.now() })
    return view
  }
}
