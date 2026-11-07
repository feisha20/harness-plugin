import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ReportEngine, readableWork, summarizeWork } from '../lib/shared/reportEngine.js'
const task = (id,title,extra={}) => ({id,title,source:'manual',createdAt:'2026-11-07T02:00:00Z',...extra})
test('汇报按工作内容归类，不将项目路径当作标题', () => {
  const report=ReportEngine.generateWeeklyReport('2026-W45',[
    task('a','分析 DSH sidebar.panellist 与 main 插槽注册机制',{projectPath:'/a/raw-project'}),
    task('b','实现工作台日报、周报与月报自动汇总算法',{projectPath:'/a/raw-project'}),
  ],{})
  assert.equal(report.sections.length,3)
  assert.match(report.markdown,/本周重点工作/)
  assert.match(report.markdown,/侧边栏与主页面的插件接入机制/)
  assert.match(report.markdown,/自动汇总功能/)
  assert.doesNotMatch(report.markdown,/raw-project|完成交付|已上线|回归通过/)
})
test('准备事项保留准备语气，未知业务原文保留', () => {
  assert.match(readableWork('预备禅道 API 凭据配置与待办双向过滤能力'),/^准备/)
  const report=summarizeWork([task('a','核对供应商报价')])
  assert.deepEqual(report,[{title:'其他工作事项',items:['核对供应商报价']}])
})
test('重复记录在汇报正文去重，统计保留实际条数', () => {
  const records=[task('a','梳理会话采集方案'),task('b','梳理会话采集方案')]
  const report=ReportEngine.generateMonthlyReport('2026-11',records,{})
  assert.equal(report.markdown.split('• 梳理会话采集方案').length-1,1)
  assert.equal(report.stats.totalTasks,2)
})
test('无状态记录按工作日期入报，北京时间跨日及周期外记录正确过滤', () => {
  const records=[task('a','接口方案梳理',{createdAt:'2026-11-06T16:30:00Z'}),task('b','历史记录',{recordDate:'2026-10-01'})]
  assert.equal(ReportEngine.generateDailyReport('2026-11-07',records).items.length,1)
  assert.equal(ReportEngine.generateMonthlyReport('2026-11',records,{}).stats.loggedDays,1)
  assert.equal(ReportEngine.generateMonthlyReport('2026-09',records,{}).stats.loggedDays,0)
})

test('日周月采用对应汇报周期且标题不含装饰括号', () => {
  const records=[task('a','梳理会话采集方案')]
  const reports=[ReportEngine.generateDailyReport('2026-11-07',records).summaryMarkdown, ReportEngine.generateWeeklyReport('2026-W45',records,{}).markdown, ReportEngine.generateMonthlyReport('2026-11',records,{}).markdown]
  for(const text of reports) { assert.doesNotMatch(text,/[【】]/); assert.doesNotMatch(text,/围绕.*开展/); assert.match(text,/问题与需协调事项/) }
  assert.match(reports[0],/明日工作安排/)
  assert.match(reports[1],/下周工作安排/)
  assert.match(reports[2],/本月重点工作与阶段进展/)
  assert.match(reports[2],/下月工作安排/)
})
test('明确计划与问题单列，不把修复工作推断为未解决风险', () => {
  const records=[task('a','下周计划：补充接口用例'),task('b','需协调：申请测试账号'),task('c','修复登录异常')]
  const report=ReportEngine.generateWeeklyReport('2026-W45',records,{})
  assert.match(report.sections[0].items.join(' '),/修复登录异常/)
  assert.deepEqual(report.sections[1].items,['• 申请测试账号'])
  assert.deepEqual(report.sections[2].items,['• 补充接口用例'])
  assert.doesNotMatch(report.markdown,/待补充|待确认/)
})
