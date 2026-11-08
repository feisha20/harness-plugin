import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import type {
  DailyReport,
  PeriodicReport,
  SourceConfig,
  Task,
  TaskSource,
  TaskStatus,
  WorkbenchSnapshot,
} from '../shared/types.ts'

function getTodayString(): string {
  const d = new Date()
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

function getWeekKey(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const year = d.getUTCFullYear()
  const weekNo = Math.ceil(((d.getTime() - Date.UTC(year, 0, 1)) / 86400000 + 1) / 7)
  return `${year}-W${String(weekNo).padStart(2, '0')}`
}

function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7)
}

export class WorkbenchStore {
  private storePath: string
  private snapshot: WorkbenchSnapshot

  constructor(customPath?: string) {
    const homeDir = os.homedir()
    const baseDir = path.join(homeDir, '.dsh-workbench')
    if (!fs.existsSync(baseDir)) {
      try {
        fs.mkdirSync(baseDir, { recursive: true })
      } catch {
        // ignore
      }
    }
    this.storePath = customPath || path.join(baseDir, 'workbench-store.json')
    this.snapshot = this.load()
  }

  private getDefaultSources(): SourceConfig[] {
    const home = os.homedir()
    return [
      {
        id: 'dsh',
        name: 'DeepSeek Harness 会话',
        enabled: true,
        status: fs.existsSync(path.join(home, '.dsh/sessions')) ? 'available' : 'unavailable',
        path: path.join(home, '.dsh/sessions'),
        sessionCount: 0,
        lastSyncAt: null,
      },
      {
        id: 'claude',
        name: 'Claude Code 会话',
        enabled: true,
        status: fs.existsSync(path.join(home, '.claude')) ? 'available' : 'unavailable',
        path: path.join(home, '.claude'),
        sessionCount: 8,
        lastSyncAt: null,
      },
      {
        id: 'codex',
        name: 'Codex 桌面端 / CLI 会话',
        enabled: true,
        status: fs.existsSync(process.env.CODEX_HOME || path.join(home, '.codex')) ? 'available' : 'unavailable',
        path: process.env.CODEX_HOME || path.join(home, '.codex'),
        sessionCount: 0,
        lastSyncAt: null,
      },
      {
        id: 'gemini',
        name: 'Gemini CLI 会话',
        enabled: true,
        status: fs.existsSync(path.join(home, '.gemini')) ? 'available' : 'unavailable',
        path: path.join(home, '.gemini'),
        sessionCount: 15,
        lastSyncAt: null,
      },
      {
        id: 'zcode',
        name: 'Zcode 会话',
        enabled: true,
        status: fs.existsSync(path.join(home, '.zcode/cli/db/db.sqlite')) ? 'available' : 'unavailable',
        path: path.join(home, '.zcode/cli/db/db.sqlite'),
        sessionCount: 0,
        lastSyncAt: null,
      },
      {
        id: 'zentao',
        name: '禅道 Zentao 待办与缺陷',
        enabled: false,
        status: 'unavailable',
        path: 'https://zentao.example.com',
        sessionCount: 0,
        lastSyncAt: null,
        zentaoConfig: {
          url: '',
          account: '',
          token: '',
        },
      },
      {
        id: 'manual',
        name: '手动录入事项',
        enabled: true,
        status: 'available',
        path: 'local-store',
        sessionCount: 0,
        lastSyncAt: null,
      },
    ]
  }

  private getDefaultSnapshot(): WorkbenchSnapshot {
    const today = getTodayString()
    const weekKey = getWeekKey(today)
    const monthKey = getMonthKey(today)

    const initialTasks: Task[] = [
      {
        id: 'task-mywork-home-audit',
        title: '调研 mywork-home 架构与采集源规范（Claude/Codex/Zcode/禅道）',
        status: 'completed',
        priority: 'high',
        source: 'claude',
        projectPath: '/Users/linjt/Documents/projects/mywork-home',
        isPinned: false,
        createdAt: `${today}T08:00:00+08:00`,
        completedAt: `${today}T11:20:00+08:00`,
        deadline: today,
      },
      {
        id: 'task-daily-report-engine',
        title: '实现工作台日报、周报与月报自动汇总算法',
        status: 'pending',
        priority: 'high',
        source: 'manual',
        projectPath: '/Users/linjt/Documents/projects/harness-plugin',
        isPinned: false,
        createdAt: `${today}T11:00:00+08:00`,
      },
      {
        id: 'task-zentao-sync-prep',
        title: '预备禅道 API 凭据配置与待办双向过滤能力',
        status: 'pending',
        priority: 'low',
        source: 'zentao',
        projectPath: '禅道工作流',
        isPinned: false,
        createdAt: `${today}T11:30:00+08:00`,
      },
    ]

    return {
      version: 1,
      tasks: initialTasks,
      sources: this.getDefaultSources(),
      dailyReports: {},
      weeklyReports: {},
      monthlyReports: {},
      lastSyncTime: null,
      activePeriod: {
        today,
        currentWeekKey: weekKey,
        currentMonthKey: monthKey,
      },
    }
  }

  private load(): WorkbenchSnapshot {
    try {
      if (fs.existsSync(this.storePath)) {
        const raw = fs.readFileSync(this.storePath, 'utf8')
        const data = JSON.parse(raw) as WorkbenchSnapshot
        if (data && data.version === 1 && Array.isArray(data.tasks)) {
          if (!data.sources.some(source => source.id === 'zcode')) {
            data.sources.push(this.getDefaultSources().find(source => source.id === 'zcode')!)
          }
          const dsh = data.sources.find(source => source.id === 'dsh')
          const oldDshPath = path.join(os.homedir(), '.gemini/antigravity-cli/brain')
          if (dsh && (!dsh.path || path.normalize(dsh.path) === oldDshPath)) {
            dsh.path = path.join(os.homedir(), '.dsh/sessions')
            dsh.sessionCount = 0
            dsh.lastSyncAt = null
            dsh.error = null
            dsh.progress = '采集路径已修正，等待同步真实会话'
            dsh.status = fs.existsSync(dsh.path) ? 'available' : 'unavailable'
          }
          // 仅清理旧版本内置的两条 DSH 演示记录，不影响真实采集及手工事项。
          data.tasks = data.tasks.filter(task => !(task.source === 'dsh' && ['task-dsh-workbench-init', 'task-dsh-sidebar-slot'].includes(task.id)))
          const codex = data.sources.find(source => source.id === 'codex')
          if (codex?.name === 'Codex CLI 历史') codex.name = 'Codex 桌面端 / CLI 会话'
          return data
        }
      }
    } catch (err) {
      console.warn('Failed to read workbench store, creating fresh one:', err)
    }
    const def = this.getDefaultSnapshot()
    this.save(def)
    return def
  }

  public save(snapshot?: WorkbenchSnapshot): void {
    if (snapshot) {
      this.snapshot = snapshot
    }
    try {
      const dir = path.dirname(this.storePath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      const tmpPath = `${this.storePath}.tmp.${Date.now()}`
      fs.writeFileSync(tmpPath, JSON.stringify(this.snapshot, null, 2), 'utf8')
      fs.renameSync(tmpPath, this.storePath)
    } catch (err) {
      console.error('Failed to save workbench store:', err)
    }
  }

  public getSnapshot(): WorkbenchSnapshot {
    const today = getTodayString()
    this.snapshot.activePeriod = {
      today,
      currentWeekKey: getWeekKey(today),
      currentMonthKey: getMonthKey(today),
    }
    return this.snapshot
  }

  public saveTask(task: Task): Task {
    const idx = this.snapshot.tasks.findIndex((t) => t.id === task.id)
    if (idx >= 0) {
      this.snapshot.tasks[idx] = { ...this.snapshot.tasks[idx], ...task }
    } else {
      this.snapshot.tasks.unshift(task)
    }
    this.save()
    return task
  }

  public deleteTask(id: string): boolean {
    const initialLen = this.snapshot.tasks.length
    this.snapshot.tasks = this.snapshot.tasks.filter((t) => t.id !== id)
    if (this.snapshot.tasks.length !== initialLen) {
      this.save()
      return true
    }
    return false
  }

  public updateTaskStatus(id: string, status: TaskStatus): Task | null {
    const task = this.snapshot.tasks.find((t) => t.id === id)
    if (!task) return null
    task.status = status
    if (status === 'completed' && !task.completedAt) {
      task.completedAt = new Date().toISOString()
    } else if (status !== 'completed') {
      task.completedAt = null
    }
    this.save()
    return task
  }

  public toggleTaskPinned(id: string): Task | null {
    const task = this.snapshot.tasks.find((t) => t.id === id)
    if (!task) return null
    task.isPinned = !task.isPinned
    this.save()
    return task
  }

  public saveDailyReport(report: DailyReport): void {
    this.snapshot.dailyReports[report.day] = report
    this.save()
  }

  public savePeriodicReport(report: PeriodicReport): void {
    if (report.type === 'weekly') {
      this.snapshot.weeklyReports[report.periodKey] = report
    } else {
      this.snapshot.monthlyReports[report.periodKey] = report
    }
    this.save()
  }

  public updateSourceConfig(id: TaskSource, updates: Partial<SourceConfig>): SourceConfig | null {
    const src = this.snapshot.sources.find((s) => s.id === id)
    if (!src) return null
    Object.assign(src, updates)
    this.save()
    return src
  }
}
