export type TaskStatus = 'pending' | 'in_progress' | 'completed'
export type TaskPriority = 'high' | 'medium' | 'low'
export type TaskSource = 'dsh' | 'claude' | 'codex' | 'gemini' | 'zentao' | 'manual'

export interface Evidence {
  id: string
  sessionId: string
  source: TaskSource
  projectPath: string
  timestamp: string
  quote: string
}

export interface Task {
  id: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  source: TaskSource
  projectPath?: string
  isPinned: boolean
  createdAt: string
  completedAt?: string | null
  deadline?: string | null
  evidence?: Evidence[]
  zentao?: {
    id: string
    type: 'bug' | 'task'
    status: string
    url?: string
    priority?: number
  } | null
}

export interface SourceConfig {
  id: TaskSource
  name: string
  enabled: boolean
  status: 'available' | 'unavailable' | 'scanning' | 'error'
  path: string
  sessionCount: number
  lastSyncAt: string | null
  error?: string | null
  zentaoConfig?: {
    url: string
    account: string
    token: string
  }
}

export interface DailyReportItem {
  id: string
  text: string
  taskIds: string[]
  project?: string
  status: 'completed' | 'in_progress'
}

export interface DailyReport {
  day: string // YYYY-MM-DD
  generatedAt: string
  items: DailyReportItem[]
  summaryMarkdown: string
  isEdited: boolean
}

export interface PeriodicSection {
  title: string
  items: string[]
}

export interface PeriodStats {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  activeProjects: number
  loggedDays: number
}

export interface PeriodicReport {
  id: string
  type: 'weekly' | 'monthly'
  periodKey: string // e.g. 2026-W45 or 2026-11
  title: string
  startDate: string
  endDate: string
  generatedAt: string
  stats: PeriodStats
  sections: PeriodicSection[]
  markdown: string
  isEdited: boolean
}

export interface WorkbenchSnapshot {
  version: 1
  tasks: Task[]
  sources: SourceConfig[]
  dailyReports: Record<string, DailyReport>
  weeklyReports: Record<string, PeriodicReport>
  monthlyReports: Record<string, PeriodicReport>
  lastSyncTime: string | null
  activePeriod?: {
    today: string
    currentWeekKey: string
    currentMonthKey: string
  }
}

export interface SyncResult {
  success: boolean
  scannedSources: number
  newTasks: number
  updatedTasks: number
  message: string
}
