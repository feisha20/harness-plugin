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

// 工作记录按北京时间归属日期；历史数据按创建日期回读，不再依赖完成状态。
export function todayString(): string { return dateInShanghai(new Date().toISOString()) }
function dateInShanghai(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0,10)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year:'numeric', month:'2-digit', day:'2-digit' }).format(date)
}
export function recordDay(task: Task): string { return task.recordDate || dateInShanghai(task.createdAt) }
export function cleanTaskTitle(title: string): string { return title.trim() }

interface WorkTopic { title: string; matches: RegExp }
// 按记录内容识别工作方向，项目路径只作为补充，不用目录名称充当汇报标题。
const topics: WorkTopic[] = [
  { title:'工作记录与报告整理', matches:/日报|周报|月报|工作记录|工作事项/ },
  { title:'多工具工作信息归集', matches:/采集|游标|快照|会话历史|日志格式|多渠道|多通道/ },
  { title:'工作台集成与使用体验', matches:/harness|sidebar|panellist|插槽|插件|工作台|界面|导航|布局/i },
  { title:'测试与业务系统协作', matches:/禅道|zentao|测试|用例|凭据|接口|API/i },
  { title:'问题排查与系统维护', matches:/修复|排查|报错|异常|缺陷|bug|故障/i },
  { title:'性能与结构优化', matches:/性能|重构|缓存|索引|优化/ },
]
export function readableWork(text: string): string {
  return text.trim()
    .replace(/实现工作台日报、周报与月报自动汇总算法/g, '开发将日常工作记录整理为日报、周报和月报的自动汇总功能')
    .replace(/预备禅道 API 凭据配置与待办双向过滤能力/g, '准备禅道系统的接口访问配置与工作事项筛选方案')
    .replace(/^(?:Claude Code|Gemini CLI|Codex|DSH)[:：]\s*/i, '')
    .replace(/sidebar\.panellist\s*与\s*main\s*插槽注册机制/gi, '侧边栏与主页面的插件接入机制')
    .replace(/游标推进|游标断点同步/g, '同步进度保存与续传')
    .replace(/历史快照还原/g, '历史记录恢复')
    .replace(/增量提取/g, '新增内容提取')
    .replace(/日志格式化/g, '工作记录格式统一')
    .replace(/API\s*凭据/g, '接口访问凭据')
}
export function summarizeWork(tasks: Task[]): PeriodicSection[] {
  const groups = new Map<string, Set<string>>()
  for (const task of tasks) {
    const topic = topics.find(topic => topic.matches.test(task.title))
    const title = topic?.title || '其他工作事项'
    if (!groups.has(title)) groups.set(title, new Set())
    groups.get(title)!.add(readableWork(task.title))
  }
  return [...groups].map(([title,group]) => ({title, items:[...group]}))
}

type ReportCadence = 'daily' | 'weekly' | 'monthly'

// 仅把明确标注的安排和待协调事项分出，避免把“修复异常”等工作误判为未解决风险。
export function reportSections(tasks: Task[], cadence: ReportCadence): PeriodicSection[] {
  const nextLabel = cadence === 'daily' ? '明日' : cadence === 'weekly' ? '下周' : '下月'
  const currentLabel = cadence === 'daily' ? '今日' : cadence === 'weekly' ? '本周' : '本月'
  const planPattern = new RegExp(`^(?:${nextLabel}(?:计划|安排)?|下一步(?:计划|安排)?|计划)[:：]`)
  const issuePattern = /^(?:风险|阻塞|待协调|需协调|需支持|问题)[:：]/
  const plans = tasks.filter(t => planPattern.test(t.title.trim()))
  const issues = tasks.filter(t => issuePattern.test(t.title.trim()))
  const work = tasks.filter(t => !plans.includes(t) && !issues.includes(t))
  const groups = summarizeWork(work)
  const workLines = groups.flatMap((group, index) => [
    `#### ${index + 1}. ${group.title}`,
    ...group.items.map(item => `• ${item}`), '',
  ])
  const lines = (records:Task[], pattern:RegExp) => [...new Set(records.map(t => `• ${readableWork(t.title.trim().replace(pattern, ''))}`))]
  return [
    {title:`一、${currentLabel}${cadence === 'monthly' ? '重点工作与阶段进展' : '重点工作'}`,items:workLines.length ? workLines : ['暂无工作记录']},
    {title:'二、问题与需协调事项',items:issues.length ? lines(issues,issuePattern) : ['待确认：当前记录未提供问题或需协调事项，请在提交前确认。']},
    {title:`三、${nextLabel}工作安排`,items:plans.length ? lines(plans,planPattern) : [`待补充：请补充${nextLabel}的工作重点和预期产出。`]},
  ]
}

export class ReportEngine {
  private static grouped(tasks: Task[], cadence:ReportCadence): string[] {
    const sections = reportSections(tasks,cadence)
    return sections.flatMap(section => [`### ${section.title}`, ...section.items, ''])
  }
  public static formatDailyGrouped(tasks: Task[]): string[] { return this.grouped(tasks,'daily') }
  public static formatWeeklyGrouped(tasks: Task[]): string[] { return this.grouped(tasks,'weekly') }
  public static formatMonthlyGrouped(tasks: Task[]): string[] { return this.grouped(tasks,'monthly') }
  public static generateDailyReport(day: string, tasks: Task[]): DailyReport {
    const records = tasks.filter(t => recordDay(t) === day)
    return { day, generatedAt:new Date().toISOString(), isEdited:false,
      items:records.map(t => ({ id:`item-${t.id}`, text:t.title, taskIds:[t.id], project:t.projectPath?.split('/').pop(), status:'completed' })),
      summaryMarkdown:[`工作日报（${day}）`, '', ...(records.length ? this.grouped(records,'daily') : ['暂无工作记录'])].join('\n') }
  }
  private static period(type:'weekly'|'monthly', key:string, tasks:Task[], dailyReports:Record<string,DailyReport>): PeriodicReport {
    const {startDate,endDate} = type === 'weekly' ? getWeekRange(key) : getMonthRange(key)
    const records = tasks.filter(t => recordDay(t) >= startDate && recordDay(t) <= endDate)
    const title = `工作${type === 'weekly' ? '周报' : '月报'}（${startDate} ~ ${endDate}）`
    const days = new Set(records.map(recordDay))
    for (const [day,report] of Object.entries(dailyReports)) if (day >= startDate && day <= endDate && (report.items.length || report.isEdited)) days.add(day)
    return { id:`${type}-${key}`,type,periodKey:key,title,startDate,endDate,generatedAt:new Date().toISOString(),isEdited:false,
      stats:{ totalTasks:records.length,completedTasks:0,pendingTasks:0,activeProjects:new Set(records.map(t=>t.projectPath).filter(Boolean)).size,loggedDays:days.size },
      sections:reportSections(records,type === 'weekly' ? 'weekly' : 'monthly'),
      markdown:[title,'',...(records.length ? this.grouped(records,type) : ['暂无工作记录'])].join('\n') }
  }
  public static generateWeeklyReport(key:string,tasks:Task[],dailyReports:Record<string,DailyReport>): PeriodicReport { return this.period('weekly',key,tasks,dailyReports) }
  public static generateMonthlyReport(key:string,tasks:Task[],dailyReports:Record<string,DailyReport>): PeriodicReport { return this.period('monthly',key,tasks,dailyReports) }
}
