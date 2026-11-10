/** ACP 原始上报值；不假定本轮或累计口径，不参与宿主用量累加。 */
export interface AcpReportedUsage {
  readonly totalTokens: number
  readonly inputTokens: number
  readonly outputTokens: number
  readonly thoughtTokens?: number
  readonly cachedReadTokens?: number
  readonly cachedWriteTokens?: number
}

export function reportedUsageOf(value: unknown): AcpReportedUsage | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const raw = value as Record<string, unknown>
  const result: Record<string, number> = {}
  for (const key of [
    'totalTokens',
    'inputTokens',
    'outputTokens',
    'thoughtTokens',
    'cachedReadTokens',
    'cachedWriteTokens',
  ]) {
    const n = raw[key]
    if (n == null && !['totalTokens', 'inputTokens', 'outputTokens'].includes(key)) continue
    if (typeof n !== 'number' || !Number.isSafeInteger(n) || n < 0) return undefined
    result[key] = n
  }
  return result as unknown as AcpReportedUsage
}
