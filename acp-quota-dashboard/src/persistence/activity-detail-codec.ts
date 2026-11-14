import { deflateSync, inflateSync } from 'node:zlib'

// BLOB 标记与普通 JSON/TEXT 分离，旧数据库无需启动时扫描或重写。
const magic = Buffer.from('ACPD1')
const maxBytes = 4 * 1024 * 1024

/** 小详情保持原文；大详情仅在确实节省空间时压缩，使用低压缩级别限制写入开销。 */
export function encodeActivityDetail(value: string | undefined): string | Uint8Array | null {
  if (value === undefined) return null
  const bytes = Buffer.from(value)
  if (bytes.length < 1024 || bytes.length > maxBytes) return value
  const compressed = deflateSync(bytes, { level: 1 })
  return compressed.length + magic.length < bytes.length * 0.9 ? Buffer.concat([magic, compressed]) : value
}

/** 解压上限防止损坏数据无限分配；损坏的压缩详情明确报错，不能静默丢历史。 */
export function decodeActivityDetail(value: unknown): unknown {
  if (!(value instanceof Uint8Array)) return value
  const bytes = Buffer.from(value)
  if (!bytes.subarray(0, magic.length).equals(magic)) throw new Error('ACP 活动详情编码无效')
  return inflateSync(bytes.subarray(magic.length), { maxOutputLength: maxBytes }).toString('utf8')
}
