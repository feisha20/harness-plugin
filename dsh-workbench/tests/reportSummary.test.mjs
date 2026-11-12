import {test} from 'node:test'
import assert from 'node:assert/strict'
import {reorganizeReport} from '../lib/host/reportSummary.js'
import {ReportEngine, normalizeWeeklyReport} from '../lib/shared/reportEngine.js'
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
 work: ['#### 1. 接口稳定性', '排查接口超时及调用链配置问题'],
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
