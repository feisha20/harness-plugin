import type {
  DailyReport,
  DailyReportItem,
  PeriodicReport,
  PeriodicSection,
  PeriodStats,
  Task,
} from './types.ts'

export function shiftDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function getWeekRange(weekKey: string): { startDate: string; endDate: string } {
  // weekKey format: YYYY-Www
  const [yearStr, weekStr] = weekKey.split('-W')
  const year = parseInt(yearStr, 10)
  const week = parseInt(weekStr, 10)

  // 4th of Jan is always in week 1
  const jan4 = new Date(Date.UTC(year, 0, 4, 12, 0, 0))
  const day = jan4.getUTCDay() || 7
  const firstMonday = new Date(jan4.getTime() - (day - 1) * 86400000)

  const targetMonday = new Date(firstMonday.getTime() + (week - 1) * 7 * 86400000)
  const targetSunday = new Date(targetMonday.getTime() + 6 * 86400000)

  return {
    startDate: targetMonday.toISOString().slice(0, 10),
    endDate: targetSunday.toISOString().slice(0, 10),
  }
}

export function getMonthRange(monthKey: string): { startDate: string; endDate: string } {
  // monthKey format: YYYY-MM
  const [yearStr, monthStr] = monthKey.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)

  const start = `${yearStr}-${monthStr}-01`
  // Get last day of month
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const end = `${yearStr}-${monthStr}-${String(lastDay).padStart(2, '0')}`

  return { startDate: start, endDate: end }
}

/**
 * Normalizes raw task titles by removing tool prefixes, status badges, issue identifiers, and bullet points.
 */
export function cleanTaskTitle(title: string): string {
  let t = title.trim()
  // Strip channel/tool prefix (e.g. "Gemini CLI：", "Claude Code: ", "DSH: ")
  t = t.replace(/^(?:(?:Gemini|Claude|Codex|Zcode|DSH|ZenTao|禅道)(?:\s*(?:CLI|Code))?|\w+\s*CLI)[:：]\s*/i, '')
  // Strip status tags (e.g. "【已完成】", "[进行中]")
  t = t.replace(/[【\[](?:已完成|进行中|待办|攻坚|完成)[】\]]\s*/g, '')
  // Strip issue/bug prefixes (e.g. "Bug #1024: ", "Task: ")
  t = t.replace(/^(?:Bug|Task|Issue|REQ)\s*#?\d+[:：]\s*/i, '')
  // Strip leading list symbols or numbers
  t = t.replace(/^[-*•\d.]+\s*/, '')
  return t.trim()
}

/**
 * Maps tasks to professional engineering/business domains rather than raw OS paths or generic labels.
 */
export function inferTaskDomain(task: Task, cleanTitle: string): string {
  const text = `${cleanTitle} ${task.projectPath || ''} ${task.source || ''} ${task.evidence?.map((e) => e.quote).join(' ') || ''}`.toLowerCase()

  // DeepSeek Harness & Plugin Architecture
  if (/harness|sidebar|插槽|slot|panellist|workbench|工作台|插件|plugin|左侧导航/.test(text)) {
    return 'DeepSeek Harness 工作台插件架构'
  }
  // Multi-source Data Collection & Session Sync
  if (/采集|collector|游标|cursor|会话|session|增量|快照|snapshot|mywork|claude|gemini|codex|zcode/.test(text)) {
    return '多渠道研发数据采集体系'
  }
  // Quality & Bug Fixing
  if (/bug|缺陷|异常|crash|报错|502|超时|死锁|排查|崩溃/.test(text)) {
    return '系统稳定性与缺陷攻坚'
  }
  // Performance Optimization & Architecture
  if (/重构|refactor|优化|perf|性能|索引|加速|吞吐|缓存/.test(text)) {
    return '性能优化与架构演进'
  }
  // Engineering Efficiency & QA Collaboration
  if (/zentao|禅道|测试|test|用例|ci|cd|流水线|pipeline|自动化/.test(text)) {
    return '工程效能与质量协同'
  }
  // Core Business Features
  if (/需求|功能|开发|实现|feature|业务/.test(text)) {
    return '核心业务功能研发'
  }

  // Path-based fallback
  if (task.projectPath) {
    const rawName = task.projectPath.split('/').pop() || ''
    const cleanName = rawName.replace(/\.app$/i, '')
    if (cleanName && cleanName !== '通用事项') {
      return `${cleanName} 研发专项`
    }
  }

  return '重点专项与日常研发'
}

/**
 * Intelligent Report Synthesis Engine
 * Transforms raw fragmented tasks into well-analyzed, professional reporting items.
 */
export class ReportEngine {
  /**
   * Group tasks by inferred business/project domain
   */
  private static groupTasksByDomain(tasks: Task[]): Map<string, { cleanTitle: string; task: Task }[]> {
    const map = new Map<string, { cleanTitle: string; task: Task }[]>()
    for (const task of tasks) {
      const cleanTitle = cleanTaskTitle(task.title)
      const domain = inferTaskDomain(task, cleanTitle)
      if (!map.has(domain)) {
        map.set(domain, [])
      }
      map.get(domain)!.push({ cleanTitle, task })
    }
    return map
  }

  /**
   * Synthesize daily report items with professional action-and-value orientation
   */
  private static synthesizeDailyDomain(
    domain: string,
    items: { cleanTitle: string; task: Task }[],
  ): string[] {
    const results: string[] = []

    // Check for specific cluster: Data collection & session sync pipeline
    if (domain === '多渠道研发数据采集体系') {
      const hasResearch = items.some((it) => /调研|规范|架构/.test(it.cleanTitle))
      const hasSnapshotOrCursor = items.some((it) => /快照|游标|增量|格式化/.test(it.cleanTitle))

      if (hasResearch) {
        results.push(
          '• 多端采集规范调研与标准制定：深入调研 mywork-home 架构规范，统一梳理 Claude / Codex / Zcode / 禅道 等多渠道日志标准化解析协议',
        )
      }
      if (hasSnapshotOrCursor) {
        results.push(
          '• 会话解析与增量游标同步：实现多渠道会话历史快照还原与增量提取能力，建立跨工具日志格式化与游标断点同步机制',
        )
      }

      // Add any other distinct task in this domain not covered above
      for (const it of items) {
        if (!/调研|规范|架构|快照|游标|增量|格式化/.test(it.cleanTitle)) {
          results.push(`• 采集链路推进：${it.cleanTitle}`)
        }
      }
      return results
    }

    // Check for specific cluster: DeepSeek Harness & Plugin slot integration
    if (domain === 'DeepSeek Harness 工作台插件架构') {
      const hasSlot = items.some((it) => /sidebar|panellist|main|插槽/.test(it.cleanTitle))
      if (hasSlot) {
        results.push(
          '• 宿主扩展机制分析与验证：深入分析 DSH sidebar.panellist 与 main 插槽注册机制，梳理插件扩展挂载与主视图生命周期流程',
        )
      }
      for (const it of items) {
        if (!/sidebar|panellist|main|插槽/.test(it.cleanTitle)) {
          results.push(`• 工作台能力建设：${it.cleanTitle}`)
        }
      }
      return results
    }

    // Generic domain tasks: format into clear action-oriented reporting items
    for (const it of items) {
      const t = it.cleanTitle
      if (/^分析|^调研|^排查|^梳理/.test(t)) {
        results.push(`• 技术调研与方案分析：${t}，明确实现路径与核心细节`)
      } else if (/^修复|^解决|^处理/.test(t)) {
        results.push(`• 缺陷排查与系统攻坚：${t}，完成回归验证与稳定性加固`)
      } else if (/^优化|^重构|^提升/.test(t)) {
        results.push(`• 架构演进与性能调优：${t}，提升系统响应与可维护性`)
      } else if (/^开发|^实现|^构建|^接入|^完成/.test(t)) {
        results.push(`• 核心功能开发与落地：${t}，完成自测联调与功能交付`)
      } else {
        results.push(`• 专项研发与任务推进：${t}`)
      }
    }

    return results
  }

  /**
   * Synthesize weekly report items: standing at the week level, aggregate multiple micro tasks into cohesive weekly milestones
   */
  private static synthesizeWeeklyDomain(
    domain: string,
    items: { cleanTitle: string; task: Task }[],
  ): string[] {
    if (domain === '多渠道研发数据采集体系') {
      return [
        '• 统一多渠道采集规范与适配：完成多端 AI 协同工具（Claude / Gemini / Codex / 禅道）采集规范梳理，实现历史快照解析与增量游标同步推进，打通异构 AI 工具的数据标准化归集链路',
      ]
    }

    if (domain === 'DeepSeek Harness 工作台插件架构') {
      return [
        '• 宿主扩展机制验证与设计：深入分析 DSH sidebar.panellist 与 main 插槽注册原理，完成个人工作台接入方案设计与左侧导航挂载验证',
      ]
    }

    if (domain === '系统稳定性与缺陷攻坚') {
      const titles = items.map((it) => it.cleanTitle).slice(0, 3).join('、')
      return [
        `• 系统健壮性提升与缺陷治理：攻坚并解决周期内重点缺陷（${titles}），完成全流程回归测试与稳定性加固`,
      ]
    }

    if (domain === '性能优化与架构演进') {
      return [
        '• 架构重构与性能深度调优：完成核心模块架构重构与执行效率优化，提升系统吞吐与响应速度',
      ]
    }

    if (domain === '工程效能与质量协同') {
      return [
        '• 研发流程协同与质量基线建设：推进禅道任务及缺陷流转规范落地，提升端到端工程协作与交付效能',
      ]
    }

    // Fallback for custom projects: synthesize into 1-2 high-level achievements
    const taskSummary = items.map((it) => it.cleanTitle).join('；')
    return [
      `• 重点能力交付与系统落地：完成 ${taskSummary}，达成周度迭代里程碑`,
    ]
  }

  /**
   * Synthesize monthly report items: standing at the month level, summarize key milestone capabilities and deliveries
   */
  private static synthesizeMonthlyDomain(
    domain: string,
    items: { cleanTitle: string; task: Task }[],
  ): string[] {
    if (domain === '多渠道研发数据采集体系') {
      return [
        '• 多源研发效能数据基础设施交付：打通 Claude、Gemini、Codex、Zcode 及禅道多渠道数据采集管道，建立标准化会话快照与游标增量同步体系，实现异构研发活动全量归集',
      ]
    }

    if (domain === 'DeepSeek Harness 工作台插件架构') {
      return [
        '• 核心工作台方案落地与生态集成：完成基于 DSH 宿主扩展体系的工作台架构设计，验证 sidebar 与 main 插槽挂载机制，实现从协议调研到插件集成的全流程闭环',
      ]
    }

    if (domain === '系统稳定性与缺陷攻坚') {
      return [
        '• 生产环境高可用与服务稳定性治理：推进系统全链路容灾与异常治理，保障核心服务高可用与零重大线上故障',
      ]
    }

    // Fallback for custom projects
    return [
      `• 重点项目阶段性交付与能力演进：达成月度预定里程碑，完成 ${domain} 关键技术攻关与业务价值落地`,
    ]
  }

  /**
   * Format grouped tasks for Daily Report
   */
  public static formatDailyGrouped(tasks: Task[]): string[] {
    if (tasks.length === 0) {
      return ['【今日完成事项】', '• 今日暂无已完成事项']
    }

    const domainMap = ReportEngine.groupTasksByDomain(tasks)
    const lines: string[] = []

    for (const [domain, items] of domainMap.entries()) {
      lines.push(`【${domain}】`)
      const synthesized = ReportEngine.synthesizeDailyDomain(domain, items)
      lines.push(...synthesized)
      lines.push('')
    }

    if (lines.length > 0 && lines[lines.length - 1] === '') {
      lines.pop()
    }
    return lines
  }

  /**
   * Format grouped tasks for Weekly Report
   */
  public static formatWeeklyGrouped(tasks: Task[]): string[] {
    if (tasks.length === 0) {
      return ['【本周完成事项】', '• 本周暂无已完成事项']
    }

    const domainMap = ReportEngine.groupTasksByDomain(tasks)
    const lines: string[] = []

    for (const [domain, items] of domainMap.entries()) {
      lines.push(`【${domain}】`)
      const synthesized = ReportEngine.synthesizeWeeklyDomain(domain, items)
      lines.push(...synthesized)
      lines.push('')
    }

    if (lines.length > 0 && lines[lines.length - 1] === '') {
      lines.pop()
    }
    return lines
  }

  /**
   * Format grouped tasks for Monthly Report
   */
  public static formatMonthlyGrouped(tasks: Task[]): string[] {
    if (tasks.length === 0) {
      return ['【本月完成事项】', '• 本月暂无已完成事项']
    }

    const domainMap = ReportEngine.groupTasksByDomain(tasks)
    const lines: string[] = []

    for (const [domain, items] of domainMap.entries()) {
      lines.push(`【${domain}】`)
      const synthesized = ReportEngine.synthesizeMonthlyDomain(domain, items)
      lines.push(...synthesized)
      lines.push('')
    }

    if (lines.length > 0 && lines[lines.length - 1] === '') {
      lines.pop()
    }
    return lines
  }

  public static generateDailyReport(day: string, tasks: Task[]): DailyReport {
    // Only focus on tasks completed on this day
    const completedTasks = tasks.filter((t) => {
      if (t.status === 'completed') {
        if (t.completedAt) {
          return t.completedAt.startsWith(day)
        }
        return t.deadline === day || t.createdAt.startsWith(day)
      }
      return false
    })

    const items: DailyReportItem[] = completedTasks.map((t) => ({
      id: `item-${t.id}`,
      text: cleanTaskTitle(t.title),
      taskIds: [t.id],
      project: t.projectPath ? t.projectPath.split('/').pop() : undefined,
      status: 'completed',
    }))

    // Markdown summary without #, ##, ### headings
    // Title is simply 工作日报（YYYY-MM-DD）
    const md = [
      `工作日报（${day}）`,
      '',
      ...ReportEngine.formatDailyGrouped(completedTasks),
    ].join('\n')

    return {
      day,
      generatedAt: new Date().toISOString(),
      items,
      summaryMarkdown: md,
      isEdited: false,
    }
  }

  public static generateWeeklyReport(
    weekKey: string,
    tasks: Task[],
    dailyReports: Record<string, DailyReport>,
  ): PeriodicReport {
    const { startDate, endDate } = getWeekRange(weekKey)

    // Filter tasks completed within date range
    const weekCompleted = tasks.filter((t) => {
      if (t.status === 'completed' && t.completedAt) {
        const d = t.completedAt.slice(0, 10)
        return d >= startDate && d <= endDate
      }
      return false
    })

    const projectsSet = new Set<string>()
    weekCompleted.forEach((t) => {
      if (t.projectPath) projectsSet.add(t.projectPath.split('/').pop() || t.projectPath)
    })

    let loggedDays = 0
    for (const [dayKey] of Object.entries(dailyReports)) {
      if (dayKey >= startDate && dayKey <= endDate) {
        loggedDays++
      }
    }

    const stats: PeriodStats = {
      totalTasks: weekCompleted.length,
      completedTasks: weekCompleted.length,
      pendingTasks: 0,
      activeProjects: projectsSet.size,
      loggedDays: loggedDays || (weekCompleted.length > 0 ? 5 : 0),
    }

    // Title format: 工作周报（YYYY-MM-DD ~ YYYY-MM-DD）
    const md = [
      `工作周报（${startDate} ~ ${endDate}）`,
      '',
      ...ReportEngine.formatWeeklyGrouped(weekCompleted),
    ].join('\n')

    return {
      id: `weekly-${weekKey}`,
      type: 'weekly',
      periodKey: weekKey,
      title: `工作周报 (${startDate} ~ ${endDate})`,
      startDate,
      endDate,
      generatedAt: new Date().toISOString(),
      stats,
      sections: [
        {
          title: '本周完成事项',
          items: weekCompleted.map((t) => cleanTaskTitle(t.title)),
        },
      ],
      markdown: md,
      isEdited: false,
    }
  }

  public static generateMonthlyReport(
    monthKey: string,
    tasks: Task[],
    dailyReports: Record<string, DailyReport>,
  ): PeriodicReport {
    const { startDate, endDate } = getMonthRange(monthKey)
    const [year, month] = monthKey.split('-')
    const displayMonth = `${year}年${parseInt(month, 10)}月`

    const monthCompleted = tasks.filter((t) => {
      if (t.status === 'completed' && t.completedAt) {
        const d = t.completedAt.slice(0, 10)
        return d >= startDate && d <= endDate
      }
      return false
    })

    const projectsSet = new Set<string>()
    monthCompleted.forEach((t) => {
      if (t.projectPath) projectsSet.add(t.projectPath.split('/').pop() || t.projectPath)
    })

    let loggedDays = 0
    for (const [dayKey] of Object.entries(dailyReports)) {
      if (dayKey >= startDate && dayKey <= endDate) {
        loggedDays++
      }
    }

    const stats: PeriodStats = {
      totalTasks: monthCompleted.length,
      completedTasks: monthCompleted.length,
      pendingTasks: 0,
      activeProjects: projectsSet.size,
      loggedDays: loggedDays || 21,
    }

    // Title format: 工作月报（YYYY年M月）
    const md = [
      `工作月报（${displayMonth}）`,
      '',
      ...ReportEngine.formatMonthlyGrouped(monthCompleted),
    ].join('\n')

    return {
      id: `monthly-${monthKey}`,
      type: 'monthly',
      periodKey: monthKey,
      title: `工作月报 (${displayMonth})`,
      startDate,
      endDate,
      generatedAt: new Date().toISOString(),
      stats,
      sections: [
        {
          title: '本月完成事项',
          items: monthCompleted.map((t) => cleanTaskTitle(t.title)),
        },
      ],
      markdown: md,
      isEdited: false,
    }
  }
}
