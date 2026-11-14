/** 仅估算收到的文本：ASCII 每四字符约一 token，其余字符约一 token。 */
export function estimateTokens(text: string): number {
  let count = 0
  for (const char of text) count += char.codePointAt(0)! <= 127 ? 0.25 : 1
  return count
}

/** 最近三秒的接收速度；首帧只建基线，避免把重连历史当成实时输出。 */
export class LiveOutputSpeed {
  private previous = 0
  private started = 0
  private samples: { time: number; tokens: number }[] = []
  private key: string | null = null

  /** 仅新任务建立零基线，后续刷新不重置累计量。 */
  start(key: string, now: number): void {
    if (key !== this.key) this.observe(key, 0, now)
  }

  observe(key: string | null, tokens: number, now: number): number | null {
    if (key !== this.key || tokens < this.previous || key === null) {
      this.key = key
      this.previous = tokens
      this.started = now
      this.samples = []
      return null
    }
    if (tokens > this.previous) {
      this.samples.push({ time: now, tokens: tokens - this.previous })
      this.previous = tokens
    }
    this.samples = this.samples.filter((sample) => now - sample.time < 3000)
    const elapsed = Math.min(3000, now - this.started)
    if (elapsed < 100) return null
    if (this.samples.length === 0) return this.previous > 0 ? 0 : null
    return (this.samples.reduce((sum, sample) => sum + sample.tokens, 0) * 1000) / elapsed
  }
}

/** 按文本块记录首末增量时间；块间工具执行和等待不参与分母。 */
export class SegmentedOutputSpeed {
  private task = ''
  private segments = new Map<string, { tokens: number; first: number; last: number }>()
  observe(task: string, blocks: readonly { key: string; tokens: number }[], now: number): void {
    if (task !== this.task) {
      this.task = task
      this.segments.clear()
    }
    for (const block of blocks) {
      if (block.tokens <= 0) continue
      const previous = this.segments.get(block.key)
      if (!previous || block.tokens < previous.tokens) {
        this.segments.set(block.key, { tokens: block.tokens, first: now, last: now })
      } else if (block.tokens > previous.tokens) {
        this.segments.set(block.key, { ...previous, tokens: block.tokens, last: now })
      }
    }
  }
  average(task: string): number | null {
    if (task !== this.task) return null
    let tokens = 0
    let duration = 0
    for (const segment of this.segments.values()) {
      if (segment.last <= segment.first) continue
      tokens += segment.tokens
      duration += segment.last - segment.first
    }
    return duration > 0 ? (tokens * 1000) / duration : null
  }
}
