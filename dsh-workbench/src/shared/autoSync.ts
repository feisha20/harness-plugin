/** 距上次同步超过 30 分钟，打开工作日志页时自动补一次采集。 */
export const AUTO_SYNC_STALE_MS = 30 * 60 * 1000

/** 自动同步尝试后的冷却时间，避免快照未刷新时在同一页面反复触发。 */
export const AUTO_SYNC_RETRY_MS = 5 * 60 * 1000

/**
 * 打开工作日志页时是否需要自动补一次同步。
 * 没有同步记录、记录时间无法解析，或距上次同步已达到阈值时返回 true。
 * @param lastSyncTime 快照中的最后一次同步时间（ISO 字符串）。
 * @param now 当前时间戳，测试时可注入。
 */
export function shouldAutoSync(lastSyncTime: string | null | undefined, now: number = Date.now()): boolean {
  if (!lastSyncTime) return true
  const last = Date.parse(lastSyncTime)
  if (!Number.isFinite(last)) return true
  return now - last >= AUTO_SYNC_STALE_MS
}
