import type { QuotaView } from '../../contract/quota.ts'

/** 每个插件实例独立缓存；同一账号的悬停不会重复启动官方 CLI。 */
export class QuotaCache {
  private readonly values = new Map<string, { value: QuotaView; at: number }>()
  private readonly pending = new Map<string, Promise<QuotaView>>()
  constructor(
    private readonly load: (id: string) => Promise<QuotaView>,
    private readonly now = Date.now,
  ) {}
  read(id: string, force = false): Promise<QuotaView> {
    const pending = this.pending.get(id)
    if (pending !== undefined) return pending
    const cached = this.values.get(id)
    if (cached !== undefined && (!force || this.now() - cached.at < 15_000) && this.now() - cached.at < 120_000)
      return Promise.resolve(cached.value)
    const request = this.load(id)
      .then((value) => {
        this.values.set(id, { value, at: this.now() })
        return value
      })
      .finally(() => {
        this.pending.delete(id)
      })
    this.pending.set(id, request)
    return request
  }
}

/** 使用下一轮真实选择；原生模型不显示 ACP 额度。 */
export function quotaAgentId(
  provider: string | undefined,
  agents: Record<string, { runtime?: string }>,
): string | undefined {
  if (provider === undefined || !provider.startsWith('acp-')) return undefined
  const id = provider.slice(4)
  return ['antigravity', 'codex'].includes(agents[id]?.runtime ?? '') ? id : undefined
}
