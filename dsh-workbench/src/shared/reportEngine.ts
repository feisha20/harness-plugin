import type {
  DailyInsight,
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

const valuePattern = /^(?:今日|本周)?(?:商业价值|业务价值|价值|业绩|收益|降本增效|降本|提效|成果)[:：]/
const sectionNumbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

// 日报包含商业价值与明日计划必填章节；周报包含完成工作、商业价值、下周计划、针对不足措施、重做思考、团队问题6个维度。
export function reportSections(tasks: Task[], cadence: ReportCadence): PeriodicSection[] {
  const nextLabel = cadence === 'daily' ? '明日' : cadence === 'weekly' ? '下周' : '下月'
  const currentLabel = cadence === 'daily' ? '今日' : cadence === 'weekly' ? '本周' : '本月'
  const planPattern = new RegExp(`^(?:${nextLabel}(?:工作)?(?:计划|安排)?|下一步(?:计划|安排)?|计划)[:：]`)
  const issuePattern = /^(?:风险|阻塞|待协调|需协调|需支持|问题)[:：]/

  const lines = (records:Task[], pattern:RegExp) => [...new Set(records.map(t => `• ${readableWork(t.title.trim().replace(pattern, ''))}`))]

  if (cadence === 'weekly') {
    const weeklyValuePattern = /^(?:本周)?(?:商业价值|业务价值|价值|业绩|收益|降本增效|降本|提效|成果)[:：]/
    const weeklyPlanPattern = /^(?:下周(?:工作)?(?:计划|安排)?|下一步(?:计划|安排)?|计划)[:：]/
    const weeklyMeasurePattern = /^(?:针对不足(?:采取的措施)?|不足措施|不足与改进|改进措施|不足反思|反思|不足)[:：]/
    const weeklyRedoPattern = /^(?:重做(?:一遍)?(?:思考|方案|复盘)?|重做思考|复盘重做|重新来过)[:：]/
    const weeklyTeamIssuePattern = /^(?:本周下来团队存在最大的问题是什么？?|团队(?:存在)?(?:最大的)?问题|团队问题|团队阻碍|团队协作问题|风险|阻塞|待协调|需协调|需支持|问题)[:：]/

    const values = tasks.filter(t => weeklyValuePattern.test(t.title.trim()))
    const plans = tasks.filter(t => weeklyPlanPattern.test(t.title.trim()))
    const measures = tasks.filter(t => weeklyMeasurePattern.test(t.title.trim()))
    const redos = tasks.filter(t => weeklyRedoPattern.test(t.title.trim()))
    const teamIssues = tasks.filter(t => weeklyTeamIssuePattern.test(t.title.trim()))
    const work = tasks.filter(t => !values.includes(t) && !plans.includes(t) && !measures.includes(t) && !redos.includes(t) && !teamIssues.includes(t))

    const groups = summarizeWork(work)
    const workLines = groups.flatMap((group, index) => [
      `#### ${index + 1}. ${group.title}`,
      ...group.items.map(item => `• ${item}`), '',
    ])

    return [
      {
        title: '一、本周完成的工作',
        items: workLines.length ? workLines : ['暂无工作记录'],
      },
      {
        title: '二、本周产出了哪些商业价值（带来的业绩、提效、合理降本等）',
        items: values.length ? lines(values, weeklyValuePattern) : ['待补充：请补充本周产出的商业价值（如带来的业绩、提效、合理降本等）。'],
      },
      {
        title: '三、下周工作计划',
        items: plans.length ? lines(plans, weeklyPlanPattern) : ['待补充：请补充下周工作计划及预期产出。'],
      },
      {
        title: '四、针对不足，你将采取的措施是什么？',
        items: measures.length ? lines(measures, weeklyMeasurePattern) : ['待补充：请针对本周工作的不足，填写你将采取的改进措施。'],
      },
      {
        title: '五、重做一遍应该怎么做？会带来哪些变化？产生哪些商业价值？',
        items: redos.length ? lines(redos, weeklyRedoPattern) : ['待补充：请填写如果重做一遍应该怎么做、会带来哪些变化以及产生哪些商业价值。'],
      },
      {
        title: '六、本周下来团队存在最大的问题是什么？（至少写一项）',
        items: teamIssues.length ? lines(teamIssues, weeklyTeamIssuePattern) : ['待补充：请至少填写一项本周下来团队存在的最大问题。'],
      },
    ]
  }

  const plans = tasks.filter(t => planPattern.test(t.title.trim()))
  const issues = tasks.filter(t => issuePattern.test(t.title.trim()))
  const values = cadence === 'daily' ? tasks.filter(t => valuePattern.test(t.title.trim())) : []
  const work = tasks.filter(t => !plans.includes(t) && !issues.includes(t) && !values.includes(t))
  const groups = summarizeWork(work)
  const workLines = groups.flatMap((group, index) => [
    `#### ${index + 1}. ${group.title}`,
    ...group.items.map(item => `• ${item}`), '',
  ])
  const sections: PeriodicSection[] = [
    {title:`一、${currentLabel}${cadence === 'monthly' ? '重点工作与阶段进展' : '重点工作'}`,items:workLines.length ? workLines : ['暂无工作记录']},
  ]
  if (cadence === 'daily') {
    sections.push({
      title:`${sectionNumbers[sections.length]}、今日产生的商业价值（业绩、提效、合理降本等）`,
      items:values.length ? lines(values,valuePattern) : ['待补充：请补充今日产生的商业价值或业绩（如提效、合理降本）。'],
    })
  }
  sections.push(
    {title:`${sectionNumbers[sections.length]}、问题与需协调事项`,items:issues.length ? lines(issues,issuePattern) : ['待确认：当前记录未提供问题或需协调事项，请在提交前确认。']},
  )
  sections.push(
    {title:`${sectionNumbers[sections.length]}、${cadence === 'daily' ? '明日计划（事项、商业价值）' : `${nextLabel}工作安排`}`,
      items:plans.length ? lines(plans,planPattern) : [cadence === 'daily' ? '待补充：请补充明日计划事项及预期商业价值。' : `待补充：请补充${nextLabel}的工作重点和预期产出。`]},
  )
  return sections
}

const numberedHeading = /^###\s+[一二三四五六七八九十]+、\s*/

/**
 * 为旧版日报补齐「今日产生的商业价值」和「明日计划」两个必填章节，
 * 并把已有三级章节重新编号，避免插入后序号重复。
 */
export function normalizeDailyReport(markdown: string): string {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n')
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop()
  const findHeading = (test: (title: string) => boolean) => lines.findIndex(line => {
    const match = line.match(/^###\s+(.+)$/)
    return match !== null && test(match[1])
  })
  const planIndex = findHeading(title => /明日计划|明日工作安排/.test(title))
  if (planIndex >= 0) lines[planIndex] = lines[planIndex].replace('明日工作安排', '明日计划（事项、商业价值）')

  if (findHeading(title => title.includes('商业价值') && !/明日计划|明日工作安排/.test(title)) < 0) {
    const issueIndex = findHeading(title => title.includes('问题与需协调事项'))
    const nextPlanIndex = findHeading(title => /明日计划|明日工作安排/.test(title))
    const insertAt = issueIndex >= 0 ? issueIndex : nextPlanIndex >= 0 ? nextPlanIndex : lines.length
    const block = ['### 二、今日产生的商业价值（业绩、提效、合理降本等）',
      '待补充：请补充今日产生的商业价值或业绩（如提效、合理降本）。', '']
    if (insertAt > 0 && lines[insertAt - 1].trim() !== '') block.unshift('')
    lines.splice(insertAt, 0, ...block)
  }

  if (findHeading(title => /明日计划/.test(title)) < 0) {
    lines.push('', '### 四、明日计划（事项、商业价值）', '待补充：请补充明日计划事项及预期商业价值。')
  }

  let number = 0
  return lines.map(line => line.replace(numberedHeading, () => {
    const label = sectionNumbers[number] ?? String(number + 1)
    number += 1
    return `### ${label}、`
  })).join('\n')
}

/**
 * 为旧版或 AI 整理后的周报规范 6 个标准三级章节，
 * 按标准顺序提取或补齐各章节内容，并严格按一至六编号。
 */
export function normalizeWeeklyReport(markdown: string): string {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n')
  const titleLine = lines.find(l => /^(?:#{1,2}\s+)?(?:[📅📊📈🎯⏳📁\s]*)?工作周报/.test(l.trim()))

  const sections: { key: string; title: string; lines: string[] }[] = []
  let currentKey: string | null = null
  let currentLines: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    const match = line.match(/^(?:#{2,3})\s+(.+)$/)
    if (match && !/^(?:#{1,2}\s+)?(?:[📅📊📈🎯⏳📁\s]*)?工作周报/.test(trimmed)) {
      if (currentKey) {
        sections.push({ key: currentKey, title: match[1], lines: currentLines })
      }
      const rawTitle = match[1]
        .replace(/[\*_`]/g, '')
        .trim()
        .replace(/^[一二三四五六七八九十\d]+[、.．]\s*/, '')
        .trim()
      if (/本周完成的工作|本周重点工作|核心工作产出与交付|重点攻坚与推进中事项|工作总结|本周工作|完成的工作/.test(rawTitle)) {
        currentKey = 'work'
      } else if (/(?:商业价值|业务价值|价值|产出.*价值|业绩|提效|合理降本|降本增效)/.test(rawTitle) && !/重做一遍/.test(rawTitle)) {
        currentKey = 'value'
      } else if (/下周工作计划|下周工作安排|下周计划|下周规划|规划与风险预警/.test(rawTitle)) {
        currentKey = 'plan'
      } else if (/针对不足|采取的措施|不足与改进|改进措施|不足反思|应对措施/.test(rawTitle)) {
        currentKey = 'measure'
      } else if (/重做一遍|重新来过|复盘重做/.test(rawTitle)) {
        currentKey = 'redo'
      } else if (/团队.*问题|团队存在最大的问题|团队最大问题|问题与需协调事项|风险与预警|需协调事项|存在的问题/.test(rawTitle)) {
        currentKey = 'teamIssue'
      } else {
        currentKey = 'other'
      }
      currentLines = []
    } else if (currentKey) {
      currentLines.push(line)
    }
  }
  if (currentKey) {
    sections.push({ key: currentKey, title: '', lines: currentLines })
  }

  const getBody = (key: string, defaultPlaceholder: string): string[] => {
    const found = sections.filter(s => s.key === key)
    if (!found.length) return [defaultPlaceholder]
    const content = found.flatMap(s => s.lines)
    while (content.length && content[0].trim() === '') content.shift()
    while (content.length && content[content.length - 1].trim() === '') content.pop()
    return content.length ? content : [defaultPlaceholder]
  }

  const otherLines = sections.filter(s => s.key === 'other').flatMap(s => s.lines)
  while (otherLines.length && otherLines[0].trim() === '') otherLines.shift()
  while (otherLines.length && otherLines[otherLines.length - 1].trim() === '') otherLines.pop()

  let workBody = getBody('work', '暂无工作记录')
  if (otherLines.length) {
    if (workBody.length === 1 && workBody[0] === '暂无工作记录') {
      workBody = otherLines
    } else {
      workBody = [...workBody, '', ...otherLines]
    }
  }
  const valueBody = getBody('value', '待补充：请补充本周产出的商业价值（如带来的业绩、提效、合理降本等）。')
  const planBody = getBody('plan', '待补充：请补充下周工作计划及预期产出。')
  const measureBody = getBody('measure', '待补充：请针对本周工作的不足，填写你将采取的改进措施。')
  const redoBody = getBody('redo', '待补充：请填写如果重做一遍应该怎么做、会带来哪些变化以及产生哪些商业价值。')
  const teamIssueBody = getBody('teamIssue', '待补充：请至少填写一项本周下来团队存在的最大问题。')

  const result: string[] = []
  if (titleLine) {
    result.push(titleLine.trim(), '')
  }

  const standardSections = [
    { title: '### 一、本周完成的工作', body: workBody },
    { title: '### 二、本周产出了哪些商业价值（带来的业绩、提效、合理降本等）', body: valueBody },
    { title: '### 三、下周工作计划', body: planBody },
    { title: '### 四、针对不足，你将采取的措施是什么？', body: measureBody },
    { title: '### 五、重做一遍应该怎么做？会带来哪些变化？产生哪些商业价值？', body: redoBody },
    { title: '### 六、本周下来团队存在最大的问题是什么？（至少写一项）', body: teamIssueBody },
  ]

  for (const s of standardSections) {
    result.push(s.title)
    result.push(...s.body)
    result.push('')
  }

  return result.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

function reportSectionRange(lines: string[], test: (title: string) => boolean): { start: number; end: number } | null {
  const start = lines.findIndex(line => {
    const match = line.match(/^###\s+(.+)$/)
    return match !== null && test(match[1])
  })
  if (start < 0) return null
  let end = lines.length
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^###\s+/.test(lines[index])) { end = index; break }
  }
  return { start, end }
}

function sectionIsPlaceholder(lines: string[], range: { start: number; end: number }): boolean {
  const body = lines.slice(range.start + 1, range.end).map(line => line.trim()).filter(Boolean)
  return body.length === 0 || body.every(line => line.startsWith('待补充') || line.startsWith('待确认') || /当前记录未提供|未提供可量化/.test(line))
}

/** 日报的商业价值或明日计划仍是占位内容时，需要 AI 根据工作记录归纳。 */
export function needsDailyInsight(markdown: string): boolean {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n')
  const value = reportSectionRange(lines, title => title.includes('商业价值') && !/明日计划/.test(title))
  const plan = reportSectionRange(lines, title => title.includes('明日计划'))
  return value === null || plan === null || sectionIsPlaceholder(lines, value) || sectionIsPlaceholder(lines, plan)
}

/** 把 AI 归纳的商业价值与明日计划写回日报对应章节，其他章节保持不变。 */
export function applyDailyInsight(markdown: string, insight: DailyInsight): string {
  const lines = normalizeDailyReport(markdown).split('\n')
  const replaceBody = (test: (title: string) => boolean, items: string[], placeholder: string) => {
    const range = reportSectionRange(lines, test)
    if (range === null || !sectionIsPlaceholder(lines, range)) return
    const body = items.length ? items.map(item => `• ${item}`) : [placeholder]
    lines.splice(range.start + 1, range.end - range.start - 1, '', ...body, '')
  }
  replaceBody(title => title.includes('商业价值') && !/明日计划/.test(title), insight.value,
    '待补充：请补充今日产生的商业价值或业绩（如提效、合理降本）。')
  replaceBody(title => title.includes('明日计划'), insight.plan,
    '待补充：请补充明日计划事项及预期商业价值。')
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()
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
      summaryMarkdown:[`工作日报（${day}）`, '', ...this.grouped(records,'daily')].join('\n') }
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
      markdown:[title,'',...((records.length || type === 'weekly') ? this.grouped(records,type) : ['暂无工作记录'])].join('\n') }
  }
  public static generateWeeklyReport(key:string,tasks:Task[],dailyReports:Record<string,DailyReport>): PeriodicReport { return this.period('weekly',key,tasks,dailyReports) }
  public static generateMonthlyReport(key:string,tasks:Task[],dailyReports:Record<string,DailyReport>): PeriodicReport { return this.period('monthly',key,tasks,dailyReports) }
}
