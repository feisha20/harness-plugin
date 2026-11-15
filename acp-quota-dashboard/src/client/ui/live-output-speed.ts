import { estimateTokens } from '../../contract/output-speed.ts'
export { estimateTokens }

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
