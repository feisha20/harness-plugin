import { estimateTokens, type AcpOutputSpeed } from '../../contract/output-speed.ts'

/** 在 ACP 接收端采样；只保留计数与时间，不保存正文，也不依赖前端挂载。 */
export class OutputSpeedMeter {
  private saved: AcpOutputSpeed | undefined
  private segment: { kind: string; messageId?: string; tokens: number; first: number; last: number } | undefined

  constructor(saved?: AcpOutputSpeed) {
    this.saved = saved
  }

  begin(turn: number): void {
    this.breakSegment()
    if (this.saved?.turn !== turn) this.saved = { turn, totalTokens: 0, sampledTokens: 0, durationMs: 0 }
  }

  add(kind: 'text' | 'reasoning', text: string, now: number, messageId?: string | null): void {
    if (!this.saved || !text) return
    if (this.segment?.kind !== kind || (messageId != null && this.segment.messageId !== messageId)) this.breakSegment()
    const tokens = estimateTokens(text)
    this.saved = { ...this.saved, totalTokens: this.saved.totalTokens + tokens }
    if (!this.segment)
      this.segment = { kind, ...(messageId == null ? {} : { messageId }), tokens, first: now, last: now }
    else {
      this.segment.tokens += tokens
      this.segment.last = Math.max(this.segment.last, now)
    }
  }

  /** 工具、消息类型和 prompt 边界切断计时，间隔不进入分母。 */
  breakSegment(): void {
    this.saved = this.snapshot()
    this.segment = undefined
  }

  snapshot(): AcpOutputSpeed | undefined {
    if (!this.saved) return undefined
    const duration = this.segment ? this.segment.last - this.segment.first : 0
    return {
      ...this.saved,
      sampledTokens: this.saved.sampledTokens + (duration > 0 ? this.segment!.tokens : 0),
      durationMs: this.saved.durationMs + duration,
    }
  }
}
