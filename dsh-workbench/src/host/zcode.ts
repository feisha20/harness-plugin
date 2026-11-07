import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import type { CollectorScanResult } from './collector.ts'
import type { Task } from '../shared/types.ts'
import { recordDay } from '../shared/reportEngine.ts'

const inputs = new WeakMap<Task,string>()
export function zcodeTranscript(task:Task):string { return inputs.get(task) || '' }

/** 只读打开正式数据库，让 SQLite 同时读取 WAL 中尚未合并的会话。 */
export function scanZcode(databasePath: string): CollectorScanResult {
  if (!fs.existsSync(databasePath)) return { source:'zcode', extractedTasks:[], sessionCount:0, error:'未找到 Zcode 会话数据库' }
  let db: DatabaseSync | undefined
  try {
    db = new DatabaseSync(databasePath, {readOnly:true})
    db.exec('PRAGMA busy_timeout=1000; BEGIN')
    const columns = db.prepare('PRAGMA table_info(session)').all().map(row=>row.name)
    const rows = db.prepare(`SELECT m.id,m.session_id,m.time_created,m.data,s.directory,s.title
      FROM message m JOIN session s ON s.id=m.session_id
      WHERE s.parent_id IS NULL ${columns.includes('time_deleted') ? 'AND s.time_deleted IS NULL' : ''}
      ORDER BY m.time_created,m.id`).all()
    const parts = db.prepare('SELECT data FROM part WHERE message_id=? ORDER BY time_created,id')
    const records = new Map<string,Task>()
    const sessions = new Set<string>()
    const messages = new Map<string,string[]>()
    for (const row of rows) {
      let message
      try { message = JSON.parse(String(row.data)) } catch { continue }
      if (!['user','assistant'].includes(message.role) || message.synthetic || message.summary || message.visibility === 'model-only'
        || message.metadata?.visibility === 'model-only' || message.semantics?.uiVisibility === 'hidden'
        || message.semantics?.transcriptVisibility === 'hidden') continue
      if (message.role === 'assistant' && !Number.isFinite(message.time?.completed)) continue
      const content = parts.all(row.id).flatMap(part=>{
        try {
          const data=JSON.parse(String(part.data))
          return data.type === 'text' && !data.synthetic && !data.ignored && typeof data.text === 'string' ? [data.text] : []
        } catch { return [] }
      }).join('\n').replace(/<system-reminder[\s\S]*?<\/system-reminder>/g,'').trim()
      if (!content || !Number.isFinite(Number(row.time_created))) continue
      const createdAt = new Date(Number(row.time_created)).toISOString()
      const day = recordDay({createdAt} as Task)
      const sessionId=String(row.session_id)
      const key=`${sessionId}:${day}`
      const lines=messages.get(key) || []
      lines.push(`${message.role}: ${content.slice(0,8000)}`)
      messages.set(key,lines)
      if (message.role !== 'user') continue
      sessions.add(sessionId)
      const evidence={id:`zcode-message-${row.id}`,sessionId,source:'zcode' as const,projectPath:String(row.directory || ''),timestamp:createdAt,quote:content.slice(0,2000)}
      const existing=records.get(key)
      if (existing) {
        if (existing.evidence!.length < 3) existing.evidence!.push(evidence)
        continue
      }
      const title=String(row.title || '').trim()
      records.set(key,{
        id:`zcode-${createHash('sha256').update(key).digest('hex').slice(0,24)}`,
        title:(title && !/^(new session|新会话|untitled)$/i.test(title) ? title : content.split('\n')[0]).slice(0,180),
        source:'zcode',projectPath:String(row.directory || ''),createdAt,recordDate:day,evidence:[evidence],
      })
    }
    for (const [key,task] of records) {
      const full=(messages.get(key)||[]).join('\n')
      // 同时保留会话开头和后续讨论，明确标记超长会话的省略部分。
      inputs.set(task,full)
    }
    return {source:'zcode',extractedTasks:[...records.values()],sessionCount:sessions.size}
  } catch (error) {
    return {source:'zcode',extractedTasks:[],sessionCount:0,error:`Zcode 读取失败：${error instanceof Error ? error.message : String(error)}`}
  } finally { db?.close() }
}
