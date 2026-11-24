import {test} from 'node:test'
import assert from 'node:assert/strict'
import {reorganizeReport, REPORT_INSTRUCTION, DAILY_INSIGHT_INSTRUCTION} from '../lib/host/reportSummary.js'
import {ReportEngine, normalizeWeeklyReport, normalizeMonthlyReport} from '../lib/shared/reportEngine.js'
import {createWorkbenchHttpHandler} from '../lib/host/webRoutes.js'
const record={id:'x',title:'排查接口超时',createdAt:'2026-11-07T02:00:00Z',source:'zcode',evidence:[{quote:'用于验证排除的会话原文'}]}
test('AI 重新整理只发送周期内工作概要，返回持久化的 AI 标记',async()=>{
 const original={day:'2026-11-07',summaryMarkdown:'旧报告',isEdited:false}
 let calls=0
 const attribution={provider:'acp-antigravity-acp',model:'gemini-3.8-flash',usedFallback:false}
 const updated=await reorganizeReport(original,[record],async input=>{
   calls++
   assert.deepEqual(JSON.parse(input).records,[{work:'排查接口超时',day:'2026-11-07'}])
   assert.doesNotMatch(input,/用于验证排除的会话原文/)
   return {text:'工作日报\n### 一、今日重点工作\n• 排查接口超时及调用链配置问题',attribution}
 })
 assert.equal(calls,1);assert.equal(updated.aiOrganized,true);assert.match(updated.summaryMarkdown,/排查接口超时/)
 assert.match(updated.summaryMarkdown,/今日产生的商业价值/)
 assert.match(updated.summaryMarkdown,/明日计划（事项、商业价值）/)
 assert.deepEqual(updated.aiAttribution,attribution)
 assert.equal(original.summaryMarkdown,'旧报告')
})
test('空周期和模型错误不覆盖旧报告',async()=>{
 const original={day:'2026-11-06',summaryMarkdown:'保留原文',isEdited:true}
 await assert.rejects(reorganizeReport(original,[record],async()=>{throw Error('不应调用模型')}),/没有工作记录/)
 original.day='2026-11-07'
 await assert.rejects(reorganizeReport(original,[record],async()=>{throw Error('模型不可用')}),/模型不可用/)
 assert.equal(original.summaryMarkdown,'保留原文')
})
const weeklySections = {
 work: ['**排查接口超时问题。** 已定位到调用链配置，待复测。'],
 value: ['定位调用链配置问题，为后续缩小排查范围提供依据'],
 plan: ['建议下周在预生产复测接口超时场景，输出验证记录'],
 measure: ['为超时场景补充调用链日志采集步骤'],
 redo: ['先按调用节点收集耗时和配置快照，预期减少重复排查'],
 teamIssue: ['待核实接口超时问题是否缺少统一的调用链排查记录，可能影响交接'],
}
const attribution = {provider:'acp-antigravity-acp', model:'gemini-3.8-flash', usedFallback:false}

test('周报整理接口保存六个章节的正文，回读后仍归入对应章节', async () => {
 const weekKey = '2026-W45'
 const snapshot = {tasks: [record], sources: [], dailyReports: {}, weeklyReports: {}}
 const store = {
  getSnapshot: () => snapshot,
  savePeriodicReport(report) { snapshot.weeklyReports[report.periodKey] = report },
 }
 const handler = createWorkbenchHttpHandler(store, {}, async (input, validate) => {
  assert.deepEqual(JSON.parse(input), {
   type: 'weekly', start: '2026-11-02', end: '2026-11-08',
   records: [{work: record.title, day: '2026-11-07'}],
  })
  const text = JSON.stringify(weeklySections)
  validate(text)
  return {text, attribution}
 })
 const get = async (query = '') => {
  const req = {method: 'GET', url: `/api/workbench/reports/weekly?weekKey=${weekKey}${query}`, headers: {}}
  const res = {writeHead(status) { this.status = status }, end(body) { this.body = JSON.parse(body) }}
  await handler(req, res)
  assert.equal(res.status, 200, JSON.stringify(res.body))
  return res.body
 }
 const updated = await get('&regenerate=true')
 assert.equal(updated.aiOrganized, true)
 assert.deepEqual(updated.aiAttribution, attribution)
 assert.deepEqual(updated, snapshot.weeklyReports[weekKey])
 assert.deepEqual(await get(), updated)
 assert.equal(normalizeWeeklyReport(updated.markdown), updated.markdown)
 const bodies = updated.markdown.split(/^### .+\n/m).slice(1).map(body => body.trim())
 assert.deepEqual(bodies, Object.values(weeklySections).map(items => items.map(item =>
  item.startsWith('#### ') ? item : `• ${item}`).join('\n')))
})

test('AI 周报缺少有效正文时由模型路由校验拒绝', async () => {
 const original = ReportEngine.generateWeeklyReport('2026-W45', [record], {})
 for (const teamIssue of [undefined, [], ['待补充：请填写团队问题']]) {
  await assert.rejects(reorganizeReport(original, [record], async (_input, validate) => {
   const text = JSON.stringify({...weeklySections, teamIssue})
   validate(text)
   assert.fail('缺少有效章节的结果应在模型路由中被拒绝')
  }), /六、本周下来团队存在最大的问题.*原报告已保留/)
 }
 assert.equal(original.aiOrganized, undefined)
})

const monthlySections = {
 work: ['#### 1. 问题排查与系统维护', '定位慢对话源于工具返回超长且翻页过碎，梳理截断长度方案'],
 issue: ['开发提测前未做异常场景自测导致返工偏多，待核实提测准入检查项是否缺少执行'],
 plan: ['建议下月推动接口返回长度上限改造并核查自测清单执行情况'],
}

test('月报整理接口附带当月周报摘要并保存三个章节正文，拒绝占位文案', async () => {
 const monthKey = '2026-11'
 const snapshot = {
  tasks: [record],
  sources: [],
  dailyReports: {},
  weeklyReports: {
   '2026-W45': {
    id: 'weekly-2026-W45',
    type: 'weekly',
    periodKey: '2026-W45',
    title: '工作周报（2026-11-02 ~ 2026-11-08）',
    startDate: '2026-11-02',
    endDate: '2026-11-08',
    generatedAt: '2026-11-08T10:00:00.000Z',
    stats: {totalTasks: 1, completedTasks: 0, pendingTasks: 0, activeProjects: 0, loggedDays: 1},
    sections: [],
    markdown: '工作周报（2026-11-02 ~ 2026-11-08）\n### 一、本周完成的工作\n• 排查慢对话原因',
    aiOrganized: true,
    isEdited: false,
   },
  },
  monthlyReports: {},
 }
 const store = {
  getSnapshot: () => snapshot,
  savePeriodicReport(report) { snapshot.monthlyReports[report.periodKey] = report },
 }
 const handler = createWorkbenchHttpHandler(store, {}, async (input, validate) => {
  const payload = JSON.parse(input)
  assert.equal(payload.type, 'monthly')
  assert.equal(payload.start, '2026-11-01')
  assert.equal(payload.end, '2026-11-30')
  assert.equal(payload.weeklyNotes.length, 1)
  assert.match(payload.weeklyNotes[0].summary, /排查慢对话原因/)
  const text = JSON.stringify(monthlySections)
  validate(text)
  return {text, attribution}
 })
 const req = {method: 'GET', url: `/api/workbench/reports/monthly?monthKey=${monthKey}&regenerate=true`, headers: {}}
 const res = {writeHead(status) { this.status = status }, end(body) { this.body = JSON.parse(body) }}
 await handler(req, res)
 assert.equal(res.status, 200, JSON.stringify(res.body))
 assert.equal(res.body.aiOrganized, true)
 assert.equal(res.body.sections.length, 3)
 assert.equal(normalizeMonthlyReport(res.body.markdown), res.body.markdown)
 assert.match(res.body.markdown, /### 一、本月重点工作与阶段进展/)
 assert.match(res.body.markdown, /### 二、问题与需协调事项/)
 assert.match(res.body.markdown, /### 三、下月工作安排/)

 const original = ReportEngine.generateMonthlyReport(monthKey, [record], {})
 for (const [field, pattern] of [['issue', /二、问题与需协调事项/], ['plan', /三、下月工作安排/]]) {
  await assert.rejects(reorganizeReport(original, [record], async (_input, validate) => {
   validate(JSON.stringify({...monthlySections, [field]: ['待补充：请补充']}))
   assert.fail('月报占位文案应在模型路由中被拒绝')
  }), pattern)
 }
})

test('提示词明确禁止空洞套话并要求写出分析事项的具体原因', () => {
 for (const prompt of [REPORT_INSTRUCTION, DAILY_INSIGHT_INSTRUCTION]) {
  assert.match(prompt, /严禁使用.*闭环/)
  assert.match(prompt, /赋能/)
  assert.match(prompt, /抓手/)
  assert.match(prompt, /原因/)
 }
 assert.match(REPORT_INSTRUCTION, /具体原因/)
 assert.match(REPORT_INSTRUCTION, /type 为 monthly/)
})
