/** 只按可见进展计时；慢请求不等于失败，不自动中断或重放。 */
export class ProgressWatch {
  private key = ''
  private signal = ''
  private changedAt = 0
  update(key: string, signal: string, now: number): number {
    if (key !== this.key || signal !== this.signal) {
      this.key = key
      this.signal = signal
      this.changedAt = now
    }
    return Math.max(0, now - this.changedAt)
  }
}
export function progressText(idleMs: number, waiting: boolean, tools: boolean, hasOutput = false): string {
  if (waiting) return '等待你处理授权或问题，请查看输入区的待处理操作。'
  const state = tools ? '工具执行中' : hasOutput && idleMs < 3000 ? '正在接收回复' : '等待 Agent 回复'
  return idleMs >= 120000
    ? `${state}，已 ${Math.floor(idleMs / 60000)} 分钟没有可观察进展。这不代表任务失败；可继续等待，或取消后选择恢复方式。`
    : state
}

/** 普通运行及等待用户操作不额外占用底栏；异常入口按当前状态显隐。 */
export function progressNoticeLabel(
  running: boolean,
  idleMs: number,
  waiting: boolean,
  failed: boolean,
  needsRecovery: boolean,
): string | null {
  if (running) return !waiting && idleMs >= 120000 ? '⚠ 暂无新进展' : null
  if (failed) return '本轮异常 · 查看恢复选项'
  return needsRecovery ? '查看恢复选项' : null
}
