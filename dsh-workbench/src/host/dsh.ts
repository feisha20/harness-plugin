import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { promisify } from 'node:util'
import { execFile } from 'node:child_process'
import { constants } from 'node:fs'
import type { CollectorScanResult } from './collector.ts'
import type { Task } from '../shared/types.ts'
import { recordDay } from '../shared/reportEngine.ts'

const run = promisify(execFile)
const transcripts = new WeakMap<Task, string>()
export function dshTranscript(task: Task): string { return transcripts.get(task) || '' }
const hash = (text: string) => createHash('sha256').update(text).digest('hex').slice(0, 24)

/** 只读扫描 Harness 原生日志，优先 v4，兼容旧版及连续追加的 Zstandard 帧。 */
export async function scanDsh(root: string): Promise<CollectorScanResult> {
  // Node 原生解压目前只返回首个 Zstandard 帧，而 Harness 每次追加都会写入新帧。
  // 使用完整支持多帧的 zstd，兼顾 macOS 桌面进程不继承 Homebrew PATH 的情况。
  let zstd = ''
  const candidates = [...(process.env.PATH || '').split(path.delimiter).filter(Boolean).map(dir => path.join(dir, 'zstd')),
    '/opt/homebrew/bin/zstd', '/usr/local/bin/zstd', '/usr/bin/zstd']
  for (const candidate of new Set(candidates)) {
    try { await fs.access(candidate, constants.X_OK); zstd = candidate; break } catch { /* 尝试下一个位置 */ }
  }
  if (!zstd) return {source: 'dsh', extractedTasks: [], sessionCount: 0, error: '未找到 zstd 解压工具，macOS 请运行 brew install zstd 后重新同步'}
  const records = new Map<string, Task>()
  const conversations = new Map<string, string[]>()
  const sessions = new Set<string>()
  const seen = new Set<string>()
  let failures = 0
  let foundRoot = false
  async function walk(dir: string): Promise<void> {
    let entries
    try { entries = await fs.readdir(dir, { withFileTypes: true }); foundRoot = true }
    catch { failures++; return }
    const file = ['session.v4.jsonl.zstd', 'session.jsonl.zstd'].find(name => entries.some(entry => entry.isFile() && entry.name === name))
    if (file) {
      try {
        const { stdout: data } = await run(zstd, ['-d', '-c', '--', path.join(dir, file)], {encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, timeout: 30000})
        let sessionId = ''
        let projectPath = ''
        const messages = new Map<string, {role: string; text: string; timestamp: string}>()
        let lineNumber = 0
        for (const line of data.split('\n')) {
          lineNumber++
          if (!line.trim()) continue
          const item = JSON.parse(line)
          if (item.type === 'session') {
            // 子代理和种子会话不能充当用户工作记录。
            if (item.delegationDepth > 0 || item.isSeeded || !item.id || seen.has(item.id)) return
            sessionId = String(item.id)
            projectPath = typeof item.cwd === 'string' ? item.cwd : ''
            continue
          }
          if (!sessionId || !['user/message', 'assistant/message'].includes(item.type)) continue
          const role = item.type === 'user/message' ? 'user' : 'assistant'
          const message = role === 'user' ? item.data : item.data?.message
          // time-context、skill-catalog、plugin 等注入内容均不是用户原话。
          if (!message || (role === 'user' && message.source?.kind !== 'user')) continue
          const timestamp = typeof item.time === 'number' || typeof item.time === 'string' ? new Date(item.time) : new Date(NaN)
          if (!Number.isFinite(timestamp.getTime())) continue
          const text = (Array.isArray(message.content) ? message.content : [])
            .filter((part: {type?: string; text?: string}) => part?.type === 'text' && typeof part.text === 'string')
            .map((part: {text: string}) => part.text).join('\n').trim()
          if (text) messages.set(message.id || String(lineNumber), { role, text, timestamp: timestamp.toISOString() })
        }
        if (!sessionId) throw new Error('缺少会话元数据')
        seen.add(sessionId)
        for (const message of messages.values()) {
          const day = recordDay({createdAt: message.timestamp} as Task)
          const key = sessionId + ':' + day
          const content = conversations.get(key) || []
          content.push(message.role + ': ' + message.text.slice(0, 8000))
          conversations.set(key, content)
          if (message.role !== 'user') continue
          sessions.add(sessionId)
          const evidence = {id: 'dsh-message-' + hash(key + message.timestamp + message.text), sessionId,
            source: 'dsh' as const, projectPath, timestamp: message.timestamp, quote: message.text.slice(0, 2000)}
          const existing = records.get(key)
          if (existing) {
            if (existing.evidence!.length < 3) existing.evidence!.push(evidence)
          } else {
            records.set(key, {id: 'dsh-' + hash(key), title: message.text.split('\n')[0].slice(0, 180),
              source: 'dsh', projectPath, createdAt: message.timestamp, recordDate: day, evidence: [evidence]})
          }
        }
      } catch { failures++ }
      return
    }
    for (const entry of entries) if (entry.isDirectory()) await walk(path.join(dir, entry.name))
  }
  await walk(root)
  for (const [key, task] of records) transcripts.set(task, (conversations.get(key) || []).join('\n'))
  return {source: 'dsh', extractedTasks: [...records.values()], sessionCount: sessions.size,
    ...(failures ? {error: foundRoot ? `Harness 有 ${failures} 个会话文件或目录读取失败，请检查文件完整性和读取权限，稍后重试` : '未找到 Harness 会话目录，请配置 ~/.dsh/sessions 或自定义会话目录'} : {})}
}
