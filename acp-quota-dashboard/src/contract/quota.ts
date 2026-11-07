/** 官方 CLI 状态行提供的会员额度；与上下文 token 用量独立。 */
export interface QuotaBucket {
  id: string
  remainingPercent: number | null
  remainingAmount: number | null
  resetTime: string | null
  disabled: boolean
}
export interface QuotaView {
  account: string | null
  plan: string | null
  buckets: QuotaBucket[]
  fetchedAt: string
  source: 'official-cli-statusline'
}
