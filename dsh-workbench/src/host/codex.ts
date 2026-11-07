import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { createInterface } from 'node:readline'
import type { CollectorScanResult } from './collector.ts'
import type { Task } from '../shared/types.ts'
import { recordDay } from '../shared/reportEngine.ts'

const transcripts = new WeakMap<Task, string>()
export function codexTranscript(task: Task): string { return transcripts.get(task) || '' }

function visibleText(text: string): string {
  return text
    .replace(/<(system-reminder|environment_context|permissions instructions|collaboration_mode)\b[^>]*>[\s\S]*?<\/\1>/g, '')
    .replace(/^# AGENTS\.md instructions[\s\S]*?<\/INSTRUCTIONS>/i, '')
    .trim()
}

/** 只读扫描桌面端和 CLI 共用的 rollout；流式逐行读取，兼容正在追加的日志。 */
export async function scanCodex(root: string): Promise<CollectorScanResult> {
  const records = new Map<string, Task>()
  const messages = new Map<string, string[]>()
  const sessions = new Set<string>()
  const seen = new Set<string>()
  let failures = 0
  const directories = ['sessions', 'archived_sessions'].map(name => path.join(root, name))
  // 同时接受用户直接配置 sessions 或 archived_sessions 目录。
  const roots = ['sessions', 'archived_sessions'].includes(path.basename(root)) ? [root] : directories
  if (!roots.some(dir => fs.existsSync(dir))) {
    return { source: 'codex', extractedTasks: [], sessionCount: 0, error: '未找到 Codex 会话目录，请配置 Codex 用户目录或 sessions 目录' }
  }
  async function* files(dir: string): AsyncGenerator<string> {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name)
      if (entry.isDirectory()) yield* files(file)
      else if (entry.isFile() && entry.name.endsWith('.jsonl')) yield file
    }
  }
  for (const dir of roots) {
    if (!fs.existsSync(dir)) continue
    try {
      for await (const file of files(dir)) {
        const input = fs.createReadStream(file, { encoding: 'utf8' })
        const lines = createInterface({ input, crlfDelay: Infinity })
        let sessionId = ''
        let projectPath = ''
        let skip = false
        // 两种消息表示同时出现时优先使用 response_item，避免同一轮重复采集。
        const responses: { role: string; text: string; timestamp: string }[] = []
        const events: typeof responses = []
        try {
          for await (const line of lines) {
            let item
            try { item = JSON.parse(line) } catch { continue }
            const payload = item.payload
            if (!payload || typeof payload !== 'object') continue
            if (item.type === 'session_meta') {
              sessionId = payload.id || payload.session_id || ''
              projectPath = typeof payload.cwd === 'string' ? payload.cwd : ''
              skip = Boolean(payload.parent_thread_id || payload.source?.subagent)
              if (skip || !sessionId || seen.has(sessionId)) break
              continue
            }
            if (!sessionId || skip || !Number.isFinite(Date.parse(item.timestamp))) continue
            if (item.type === 'response_item' && payload.type === 'message' && ['user', 'assistant'].includes(payload.role)) {
              if (payload.role === 'assistant' && (payload.channel === 'analysis' || payload.phase === 'commentary')) continue
              const text = visibleText((Array.isArray(payload.content) ? payload.content : [])
                .filter((part: {type?: string; text?: string}) => ['input_text', 'output_text', 'text'].includes(part?.type || '') && typeof part?.text === 'string')
                .map((part: {text: string}) => part.text).join('\n'))
              if (text) responses.push({ role: payload.role, text, timestamp: item.timestamp })
            } else if (item.type === 'event_msg' && ['user_message', 'agent_message'].includes(payload.type) && typeof payload.message === 'string') {
              const text = visibleText(payload.message)
              if (text) events.push({ role: payload.type === 'user_message' ? 'user' : 'assistant', text, timestamp: item.timestamp })
            }
          }
          if (skip || !sessionId || seen.has(sessionId)) continue
          seen.add(sessionId)
          const selected = responses.some(message => message.role === 'user') ? responses : events
          for (const message of selected) {
            const createdAt = new Date(message.timestamp).toISOString()
            const day = recordDay({ createdAt } as Task)
            const key = sessionId + ':' + day
            const content = messages.get(key) || []
            content.push(message.role + ': ' + message.text.slice(0, 8000))
            messages.set(key, content)
            if (message.role !== 'user') continue
            sessions.add(sessionId)
            const evidence = { id: 'codex-message-' + createHash('sha256').update(key + createdAt + message.text).digest('hex').slice(0, 24),
              sessionId, source: 'codex' as const, projectPath, timestamp: createdAt, quote: message.text.slice(0, 2000) }
            const existing = records.get(key)
            if (existing) {
              if (existing.evidence!.length < 3) existing.evidence!.push(evidence)
            } else {
              records.set(key, { id: 'codex-' + createHash('sha256').update(key).digest('hex').slice(0, 24),
                title: message.text.split('\n')[0].slice(0, 180), source: 'codex', projectPath, createdAt, recordDate: day, evidence: [evidence] })
            }
          }
        } catch { failures++ } finally { lines.close(); input.destroy() }
      }
    } catch { failures++ }
  }
  for (const [key, task] of records) transcripts.set(task, (messages.get(key) || []).join('\n'))
  return { source: 'codex', extractedTasks: [...records.values()], sessionCount: sessions.size,
    ...(failures ? { error: `Codex 有 ${failures} 个文件或目录读取失败，请检查路径和读取权限` } : {}) }
}
