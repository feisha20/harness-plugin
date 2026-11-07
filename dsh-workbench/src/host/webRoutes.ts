import type { IncomingMessage, ServerResponse } from 'node:http'
import { URL } from 'node:url'
import { WorkbenchStore } from './store.ts'
import { ReportEngine } from './reportEngine.ts'
import { SessionCollector } from './collector.ts'
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

export function createWorkbenchHttpHandler(store: WorkbenchStore, collector: SessionCollector) {
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

        if (!snapshot.dailyReports[today] || !snapshot.dailyReports[today].isEdited) {
          snapshot.dailyReports[today] = ReportEngine.generateDailyReport(today, snapshot.tasks)
        }
        if (!snapshot.weeklyReports[weekKey] || !snapshot.weeklyReports[weekKey].isEdited) {
          snapshot.weeklyReports[weekKey] = ReportEngine.generateWeeklyReport(weekKey, snapshot.tasks, snapshot.dailyReports)
        }
        if (!snapshot.monthlyReports[monthKey] || !snapshot.monthlyReports[monthKey].isEdited) {
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
          const newTask: Task = {
            id: body.id || `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            title: body.title || '新待办事项',
            status: body.status || 'pending',
            priority: body.priority || 'medium',
            source: body.source || 'manual',
            projectPath: body.projectPath,
            isPinned: !!body.isPinned,
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

      // 3. Sync Trigger
      if (pathname === '/api/workbench/sync' && req.method === 'POST') {
        const snapshot = store.getSnapshot()
        let newCount = 0
        let updatedCount = 0

        for (const src of snapshot.sources) {
          if (!src.enabled) continue
          src.status = 'scanning'
          store.save()

          const result = await collector.scanSource(src)
          src.status = result.error ? 'error' : 'available'
          src.sessionCount = result.sessionCount
          src.lastSyncAt = new Date().toISOString()
          src.error = result.error || null

          for (const item of result.extractedTasks) {
            const exists = snapshot.tasks.find((t) => t.id === item.id || t.title === item.title)
            if (!exists) {
              store.saveTask(item)
              newCount++
            } else {
              updatedCount++
            }
          }
        }

        snapshot.lastSyncTime = new Date().toISOString()
        store.save()
        sendJson(res, 200, {
          success: true,
          scannedSources: snapshot.sources.filter((s) => s.enabled).length,
          newTasks: newCount,
          updatedTasks: updatedCount,
          message: `同步完成：扫描了 ${snapshot.sources.length} 个采集源，新增 ${newCount} 项，更新 ${updatedCount} 项。`,
        })
        return
      }

      // 4. Daily Report
      if (pathname === '/api/workbench/reports/daily') {
        if (req.method === 'GET') {
          const day = query.get('day') || new Date().toISOString().slice(0, 10)
          const snapshot = store.getSnapshot()
          let report = snapshot.dailyReports[day]
          if (!report || !report.isEdited || query.get('regenerate') === 'true') {
            report = ReportEngine.generateDailyReport(day, snapshot.tasks)
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
          if (!report || !report.isEdited || query.get('regenerate') === 'true') {
            report = ReportEngine.generateWeeklyReport(weekKey, snapshot.tasks, snapshot.dailyReports)
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
          if (!report || !report.isEdited || query.get('regenerate') === 'true') {
            report = ReportEngine.generateMonthlyReport(monthKey, snapshot.tasks, snapshot.dailyReports)
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
