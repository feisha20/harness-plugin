/// <reference types="node" />
import { realpath } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { createInterface } from 'node:readline'
import type { SubprocessSeam } from './process/subprocess.ts'
import type { QuotaView } from '../contract/quota.ts'

const record = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}

/** 使用官方 App Server 返回值；不读取凭据文件。 */
export function decodeCodexQuota(accountResult: unknown, result: unknown): QuotaView {
  const account = record(record(accountResult).account)
  if (account.type !== 'chatgpt') throw new Error('请先在 Codex CLI 登录 ChatGPT 账号')
  const data = record(result)
  const limits = record(record(data.rateLimitsByLimitId).codex ?? data.rateLimits)
  const buckets = ['primary', 'secondary'].flatMap((key) => {
    const window = record(limits[key])
    if (Object.keys(window).length === 0) return []
    const used = window.usedPercent
    const duration = window.windowDurationMins
    const reset = typeof window.resetsAt === 'number' ? new Date(window.resetsAt * 1000) : null
    return [
      {
        id: `codex-${key}`,
        label:
          duration === 300
            ? '五小时额度'
            : duration === 10080
              ? '周额度'
              : typeof duration === 'number' && duration > 0
                ? `${duration} 分钟额度`
                : key === 'primary'
                  ? '主要额度'
                  : '次要额度',
        remainingPercent:
          typeof used === 'number' && Number.isFinite(used) && used >= 0 && used <= 100 ? 100 - used : null,
        remainingAmount: null,
        resetTime: reset !== null && Number.isFinite(reset.getTime()) ? reset.toISOString() : null,
        disabled: false,
      },
    ]
  })
  if (buckets.length === 0) throw new Error('Codex 暂未提供会员额度')
  return {
    account: typeof account.email === 'string' ? account.email.slice(0, 254) : null,
    plan: typeof account.planType === 'string' ? account.planType.slice(0, 80) : 'Codex',
    buckets,
    fetchedAt: new Date().toISOString(),
    source: 'official-codex-app-server',
  }
}

/** 解析官方 Codex CLI 执行参数（支持全局 codex、codex-acp 自带依赖及 ChatGPT 官方内置 CLI）。 */
export async function resolveCodexCli(
  seam: SubprocessSeam,
  env: Record<string, string>,
  acpCommand = 'codex-acp',
  acpArgs: readonly string[] = [],
): Promise<string[]> {
  const explicit = env.CODEX_PATH ?? env.CODEX_CLI_PATH
  if (explicit) {
    const resolved = await seam.resolveExecutable(explicit, env)
    return resolved.endsWith('.js')
      ? [await seam.resolveExecutable('node', env), resolved, 'app-server']
      : [resolved, 'app-server']
  }

  // 1. 优先跟随 codex-acp：从参数或命令脚本中解析自带的官方 CLI
  const candidates: string[] = []
  for (const arg of acpArgs) {
    if (typeof arg === 'string' && (arg.endsWith('.js') || arg.includes('codex'))) {
      candidates.push(arg)
    }
  }
  if (acpCommand) {
    candidates.push(acpCommand)
  }

  for (const candidate of candidates) {
    try {
      const resolved = await seam.resolveExecutable(candidate, env).catch(() => candidate)
      const real = await realpath(resolved).catch(() => resolved)
      const req = createRequire(real)
      const bundled = req.resolve('@openai/codex/bin/codex.js')
      if (bundled) {
        return [await seam.resolveExecutable('node', env), bundled, 'app-server']
      }
    } catch {}
  }

  // 2. 检查常见官方/包管理器安装路径
  const wellKnownPaths = [
    '/opt/homebrew/lib/node_modules/@agentclientprotocol/codex-acp/node_modules/@openai/codex/bin/codex.js',
    '/opt/homebrew/lib/node_modules/@openai/codex/bin/codex.js',
    '/usr/local/lib/node_modules/@openai/codex/bin/codex.js',
    '/Applications/ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex',
  ]
  for (const candidatePath of wellKnownPaths) {
    try {
      const real = await realpath(candidatePath)
      if (real.endsWith('.js')) {
        return [await seam.resolveExecutable('node', env), real, 'app-server']
      }
      return [real, 'app-server']
    } catch {}
  }

  // 3. Fallback 到系统 PATH 中的 codex
  return [await seam.resolveExecutable('codex', env), 'app-server']
}

/** 仅请求账号与额度，不创建会话或发送模型请求。 */
export async function readCodexQuota(
  seam: SubprocessSeam,
  env: Record<string, string>,
  acpCommand = 'codex-acp',
  acpArgs: readonly string[] = [],
): Promise<QuotaView> {
  const argv = await resolveCodexCli(seam, env, acpCommand, acpArgs)
  const handle = seam.spawn({ argv, env, cwd: tmpdir(), graceMs: 2000 })
  const pending = new Map<number, { resolve(value: unknown): void; reject(reason: Error): void }>()
  let next = 0
  const fail = (): void => {
    for (const item of pending.values()) item.reject(new Error('无法读取 Codex 额度，请确认官方 CLI 已登录且网络可用'))
    pending.clear()
  }
  const send = (value: unknown): void => {
    handle.stdin?.write(JSON.stringify(value) + '\n')
  }
  const request = (method: string, params?: unknown): Promise<unknown> =>
    new Promise((resolve, reject) => {
      const id = ++next
      pending.set(id, { resolve, reject })
      send({ id, method, params })
    })
  if (!handle.stdout || !handle.stdin) {
    handle.terminate()
    await handle.waitForExit()
    throw new Error('Codex 通信管道不可用')
  }
  const lines = createInterface({ input: handle.stdout })
  lines.on('line', (line) => {
    try {
      const message = JSON.parse(line)
      const item = pending.get(message.id)
      if (!item) return
      pending.delete(message.id)
      if (message.error) item.reject(new Error('Codex 未能提供会员额度'))
      else item.resolve(message.result)
    } catch {
      fail()
      handle.terminate()
    }
  })
  handle.stderr?.resume()
  handle.stdin.on('error', fail)
  void handle.done.then(fail, fail)
  const timer = setTimeout(() => {
    fail()
    handle.terminate()
  }, 20000)
  try {
    await request('initialize', { clientInfo: { name: 'dsh_quota', version: '1.0.0' } })
    send({ method: 'initialized' })
    const account = await request('account/read', { refreshToken: false })
    const limits = await request('account/rateLimits/read')
    return decodeCodexQuota(account, limits)
  } finally {
    clearTimeout(timer)
    lines.close()
    handle.terminate()
    await handle.waitForExit()
  }
}
