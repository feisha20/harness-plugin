/** 后台接收的正文与推理文本估算值；不等同于 Agent 上报的计费 Token。 */
export interface AcpOutputSpeed {
  readonly turn: number
  readonly totalTokens: number
  readonly sampledTokens: number
  readonly durationMs: number
}

/** 旧快照和损坏的统计独立降级，不影响其他会话字段。 */
export function outputSpeedOf(value: unknown): AcpOutputSpeed | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const raw = value as Record<string, unknown>
  if (typeof raw.turn !== 'number' || !Number.isSafeInteger(raw.turn) || raw.turn < 0) return undefined
  for (const key of ['totalTokens', 'sampledTokens', 'durationMs']) {
    const count = raw[key]
    if (typeof count !== 'number' || !Number.isFinite(count) || count < 0) return undefined
  }
  const totalTokens = raw.totalTokens as number
  const sampledTokens = raw.sampledTokens as number
  const durationMs = raw.durationMs as number
  if (sampledTokens > totalTokens || (durationMs === 0) !== (sampledTokens === 0)) return undefined
  return { turn: raw.turn, totalTokens, sampledTokens, durationMs }
}

/** ASCII 每四字符约一 Token，其余 Unicode 字符约一 Token。 */
export function estimateTokens(text: string): number {
  let count = 0
  for (const char of text) count += char.codePointAt(0)! <= 127 ? 0.25 : 1
  return count
}
