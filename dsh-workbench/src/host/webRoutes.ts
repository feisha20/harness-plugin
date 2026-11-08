import type { IncomingMessage, ServerResponse } from 'node:http'
import { URL } from 'node:url'
import { WorkbenchStore } from './store.ts'
import { ReportEngine } from './reportEngine.ts'
import { reorganizeReport } from './reportSummary.ts'
import type { SummaryGenerator } from './sessionSummary.ts'
import { SessionCollector } from './collector.ts'
import { safeAiError } from './aiFailure.ts'
import type { DailyReport, PeriodicReport, SourceConfig, Task, TaskSource } from '../shared/types.ts'

function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  const body = JSON.stringify(data)
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  })
  res.end(body)
}

function parseBody<T = unknown>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk: Buffer | string) => {
      raw += chunk
    })
    req.on('end', () => {
      try {
        if (!raw) return resolve({} as T)
        resolve(JSON.parse(raw) as T)
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

export function createWorkbenchHttpHandler(store: WorkbenchStore, collector: SessionCollector, generateReport?:SummaryGenerator) {
  let syncRunning = false
  // 重启后没有仍在运行的同步，不能沿用磁盘上的“采集中”。
  for (const source of store.getSnapshot().sources) {
    if (source.status !== 'scanning') continue
    source.status = 'error'
    source.error = '上次同步已中断，请重新同步'
    source.progress = undefined
    store.save()
  }
  return async function workbenchHttpHandler(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      })
      res.end()
      return
    }

    const host = req.headers.host || '127.0.0.1'
    const fullUrl = new URL(req.url || '/', `http://${host}`)
    const pathname = fullUrl.pathname
    const query = fullUrl.searchParams

    try {
      // 1. Snapshot
      if (pathname === '/api/workbench/snapshot' && req.method === 'GET') {
        const snapshot = store.getSnapshot()
        const today = snapshot.activePeriod?.today || new Date().toISOString().slice(0, 10)
        const weekKey = snapshot.activePeriod?.currentWeekKey || '2026-W45'
        const monthKey = snapshot.activePeriod?.currentMonthKey || '2026-11'

        if (!snapshot.dailyReports[today] || (!snapshot.dailyReports[today].isEdited && !snapshot.dailyReports[today].aiOrganized)) {
          snapshot.dailyReports[today] = ReportEngine.generateDailyReport(today, snapshot.tasks)
        }
        if (!snapshot.weeklyReports[weekKey] || (!snapshot.weeklyReports[weekKey].isEdited && !snapshot.weeklyReports[weekKey].aiOrganized)) {
          snapshot.weeklyReports[weekKey] = ReportEngine.generateWeeklyReport(weekKey, snapshot.tasks, snapshot.dailyReports)
        }
        if (!snapshot.monthlyReports[monthKey] || (!snapshot.monthlyReports[monthKey].isEdited && !snapshot.monthlyReports[monthKey].aiOrganized)) {
          snapshot.monthlyReports[monthKey] = ReportEngine.generateMonthlyReport(monthKey, snapshot.tasks, snapshot.dailyReports)
        }
        store.save()
        sendJson(res, 200, snapshot)
        return
      }

      // 2. Tasks CRUD
      if (pathname === '/api/workbench/tasks') {
        if (req.method === 'GET') {
          const snapshot = store.getSnapshot()
          sendJson(res, 200, snapshot.tasks)
          return
        }

        if (req.method === 'POST') {
          const body = await parseBody<Partial<Task>>(req)
          if (!body.title?.trim() || (body.recordDate && (!/^\d{4}-\d{2}-\d{2}$/.test(body.recordDate) || new Date(body.recordDate).toISOString().slice(0, 10) !== body.recordDate))) {
            sendJson(res, 400, { error: '请输入工作内容和有效日期' })
            return
          }
          const newTask: Task = {
            id: body.id || `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            title: body.title || '工作记录',
            recordDate: body.recordDate || store.getSnapshot().activePeriod?.today,
            status: body.status,
            priority: body.priority,
            source: body.source || 'manual',
            projectPath: body.projectPath,
            isPinned: body.isPinned,
            createdAt: body.createdAt || new Date().toISOString(),
            deadline: body.deadline,
          }
          store.saveTask(newTask)
          sendJson(res, 201, newTask)
          return
        }

        if (req.method === 'PATCH') {
          const body = await parseBody<{
            id: string
            status?: Task['status']
            isPinned?: boolean
            title?: string
            priority?: Task['priority']
            deadline?: string
          }>(req)
          if (!body.id) {
            sendJson(res, 400, { error: 'Missing task id' })
            return
          }
          const snapshot = store.getSnapshot()
          const task = snapshot.tasks.find((t) => t.id === body.id)
          if (!task) {
            sendJson(res, 404, { error: 'Task not found' })
            return
          }
          if (body.status !== undefined) {
            store.updateTaskStatus(body.id, body.status)
          }
          if (body.isPinned !== undefined) {
            task.isPinned = body.isPinned
          }
          if (body.title !== undefined) {
            task.title = body.title
          }
          if (body.priority !== undefined) {
            task.priority = body.priority
          }
          if (body.deadline !== undefined) {
            task.deadline = body.deadline
          }
          store.saveTask(task)
          sendJson(res, 200, task)
          return
        }

        if (req.method === 'DELETE') {
          const id = query.get('id')
          if (!id) {
            sendJson(res, 400, { error: 'Missing task id' })
            return
          }
          const success = store.deleteTask(id)
          sendJson(res, success ? 200 : 404, { success })
          return
        }
      }

      // 只返回状态，不触发报告计算或写盘，供页面持续刷新进度。
      if (pathname === '/api/workbench/sync/status' && req.method === 'GET') {
        sendJson(res, 200, {running: syncRunning, sources: store.getSnapshot().sources.map(({zentaoConfig, ...source}) => source)})
        return
      }

      // 3. Sync Trigger
      if (pathname === '/api/workbench/sync' && req.method === 'POST') {
        if (syncRunning) {
          sendJson(res, 409, {success:false, message:'已有同步正在进行，请查看采集进度'})
          return
        }
        syncRunning = true
        try {
        const snapshot = store.getSnapshot()
        let newCount = 0
        let updatedCount = 0
        const errors:string[]=[]

        for (const src of snapshot.sources) {
          if (!src.enabled) continue
          src.status = 'scanning'
          src.progress = '正在读取会话文件…'
          src.error = null
          store.save()

          const result = await collector.scanSource(src, snapshot.tasks, (sessionCount, progress) => {
            src.sessionCount = sessionCount
            src.progress = `概要处理 ${progress.processed}/${progress.total} 条，缓存复用 ${progress.cached} 条${progress.failed ? `，失败 ${progress.failed} 条` : ''}`
            store.save()
          }).catch(cause => ({source:src.id, extractedTasks:[], sessionCount:src.sessionCount,
            error:`采集失败：${safeAiError(cause instanceof Error ? cause.message : String(cause))}`}))
          src.status = result.error ? 'error' : 'available'
          src.sessionCount = result.sessionCount
          src.lastSyncAt = new Date().toISOString()
          src.error = result.error || null
          src.progress = result.error ? '同步失败，请查看错误信息' : `同步完成，整理 ${result.extractedTasks.length} 条工作记录`
          if (result.error) errors.push(`${src.name}：${result.error}`)

          for (const item of result.extractedTasks) {
            const isSessionRecord = item.source === 'zcode' || item.source === 'codex' || item.source === 'dsh'
            const exists = snapshot.tasks.find((t) => t.id === item.id || (!isSessionRecord && t.title === item.title))
            if (!exists) {
              store.saveTask(item)
              newCount++
            } else {
              if (isSessionRecord) store.saveTask({...exists,...item})
              updatedCount++
            }
          }
        }

        snapshot.lastSyncTime = new Date().toISOString()
        store.save()
        sendJson(res, 200, {
          success: errors.length === 0,
          scannedSources: snapshot.sources.filter((s) => s.enabled).length,
          newTasks: newCount,
          updatedTasks: updatedCount,
          message: `${errors.length ? '同步存在失败' : '同步完成'}：新增 ${newCount} 项，更新 ${updatedCount} 项。${errors.join('；')}`,
        })
        } finally {
          syncRunning = false
        }
        return
      }

      // 4. Daily Report
      if (pathname === '/api/workbench/reports/daily') {
        if (req.method === 'GET') {
          const day = query.get('day') || new Date().toISOString().slice(0, 10)
          const snapshot = store.getSnapshot()
          let report = snapshot.dailyReports[day]
          if (!report || (!report.isEdited && !report.aiOrganized) || query.get('regenerate') === 'true') {
            report = ReportEngine.generateDailyReport(day, snapshot.tasks)
            if (query.get('regenerate') === 'true') report = await reorganizeReport(report, snapshot.tasks, generateReport)
            store.saveDailyReport(report)
          }
          sendJson(res, 200, report)
          return
        }

        if (req.method === 'POST') {
          const report = await parseBody<DailyReport>(req)
          if (!report || !report.day) {
            sendJson(res, 400, { error: 'Invalid daily report payload' })
            return
          }
          report.isEdited = true
          store.saveDailyReport(report)
          sendJson(res, 200, report)
          return
        }
      }

      // 5. Weekly Report
      if (pathname === '/api/workbench/reports/weekly') {
        if (req.method === 'GET') {
          const weekKey = query.get('weekKey') || store.getSnapshot().activePeriod?.currentWeekKey || '2026-W45'
          const snapshot = store.getSnapshot()
          let report = snapshot.weeklyReports[weekKey]
          if (!report || (!report.isEdited && !report.aiOrganized) || query.get('regenerate') === 'true') {
            report = ReportEngine.generateWeeklyReport(weekKey, snapshot.tasks, snapshot.dailyReports)
            if (query.get('regenerate') === 'true') report = await reorganizeReport(report, snapshot.tasks, generateReport)
            store.savePeriodicReport(report)
          }
          sendJson(res, 200, report)
          return
        }

        if (req.method === 'POST') {
          const report = await parseBody<PeriodicReport>(req)
          if (!report || !report.periodKey) {
            sendJson(res, 400, { error: 'Invalid weekly report payload' })
            return
          }
          report.isEdited = true
          store.savePeriodicReport(report)
          sendJson(res, 200, report)
          return
        }
      }

      // 6. Monthly Report
      if (pathname === '/api/workbench/reports/monthly') {
        if (req.method === 'GET') {
          const monthKey = query.get('monthKey') || store.getSnapshot().activePeriod?.currentMonthKey || '2026-11'
          const snapshot = store.getSnapshot()
          let report = snapshot.monthlyReports[monthKey]
          if (!report || (!report.isEdited && !report.aiOrganized) || query.get('regenerate') === 'true') {
            report = ReportEngine.generateMonthlyReport(monthKey, snapshot.tasks, snapshot.dailyReports)
            if (query.get('regenerate') === 'true') report = await reorganizeReport(report, snapshot.tasks, generateReport)
            store.savePeriodicReport(report)
          }
          sendJson(res, 200, report)
          return
        }

        if (req.method === 'POST') {
          const report = await parseBody<PeriodicReport>(req)
          if (!report || !report.periodKey) {
            sendJson(res, 400, { error: 'Invalid monthly report payload' })
            return
          }
          report.isEdited = true
          store.savePeriodicReport(report)
          sendJson(res, 200, report)
          return
        }
      }

      // 7. Sources
      if (pathname === '/api/workbench/sources') {
        if (req.method === 'GET') {
          sendJson(res, 200, store.getSnapshot().sources)
          return
        }

        if (req.method === 'POST') {
          const body = await parseBody<{ id: TaskSource; enabled?: boolean; zentaoConfig?: SourceConfig['zentaoConfig'] }>(req)
          if (!body.id) {
            sendJson(res, 400, { error: 'Missing source id' })
            return
          }
          const updated = store.updateSourceConfig(body.id, {
            enabled: body.enabled,
            zentaoConfig: body.zentaoConfig,
          })
          sendJson(res, 200, updated)
          return
        }
      }

      // Default 404
      sendJson(res, 404, { error: 'Not Found', pathname })
    } catch (err: unknown) {
      console.error('Workbench API Error:', err)
      sendJson(res, 500, { error: String(err) })
    }
  }
}
