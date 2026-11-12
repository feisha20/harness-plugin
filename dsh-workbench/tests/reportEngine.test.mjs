import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ReportEngine, readableWork, summarizeWork, normalizeDailyReport, normalizeWeeklyReport, applyDailyInsight, needsDailyInsight } from '../lib/shared/reportEngine.js'
const task = (id,title,extra={}) => ({id,title,source:'manual',createdAt:'2026-11-07T02:00:00Z',...extra})
test('汇报按工作内容归类，不将项目路径当作标题', () => {
  const report=ReportEngine.generateWeeklyReport('2026-W45',[
    task('a','分析 DSH sidebar.panellist 与 main 插槽注册机制',{projectPath:'/a/raw-project'}),
    task('b','实现工作台日报、周报与月报自动汇总算法',{projectPath:'/a/raw-project'}),
  ],{})
  assert.equal(report.sections.length,6)
  assert.match(report.markdown,/本周完成的工作/)
  assert.match(report.markdown,/侧边栏与主页面的插件接入机制/)
  assert.match(report.markdown,/自动汇总功能/)
  assert.match(report.markdown,/本周产出了哪些商业价值（带来的业绩、提效、合理降本等）/)
  assert.match(report.markdown,/下周工作计划/)
  assert.match(report.markdown,/针对不足，你将采取的措施是什么？/)
  assert.match(report.markdown,/重做一遍应该怎么做？会带来哪些变化？产生哪些商业价值？/)
  assert.match(report.markdown,/本周下来团队存在最大的问题是什么？（至少写一项）/)
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
  for(const text of reports) { assert.doesNotMatch(text,/[【】]/); assert.doesNotMatch(text,/围绕.*开展/) }
  assert.match(reports[0],/今日产生的商业价值（业绩、提效、合理降本等）/)
  assert.match(reports[0],/明日计划（事项、商业价值）/)
  assert.match(reports[0],/问题与需协调事项/)
  assert.match(reports[1],/本周完成的工作/)
  assert.match(reports[1],/本周产出了哪些商业价值（带来的业绩、提效、合理降本等）/)
  assert.match(reports[1],/下周工作计划/)
  assert.match(reports[1],/针对不足，你将采取的措施是什么？/)
  assert.match(reports[1],/重做一遍应该怎么做？会带来哪些变化？产生哪些商业价值？/)
  assert.match(reports[1],/本周下来团队存在最大的问题是什么？（至少写一项）/)
  assert.match(reports[2],/本月重点工作与阶段进展/)
  assert.match(reports[2],/问题与需协调事项/)
  assert.match(reports[2],/下月工作安排/)
})
test('日报固定包含商业价值与明日计划两个必填章节', () => {
  const text=ReportEngine.generateDailyReport('2026-11-07',[task('a','梳理会话采集方案')]).summaryMarkdown
  assert.match(text,/### 二、今日产生的商业价值（业绩、提效、合理降本等）/)
  assert.match(text,/待补充：请补充今日产生的商业价值或业绩/)
  assert.match(text,/### 四、明日计划（事项、商业价值）/)
  assert.match(text,/待补充：请补充明日计划事项及预期商业价值/)
})
test('旧版日报补齐必填章节并重排章节序号', () => {
  const old='### 一、今日重点工作\n• 完成方案\n\n### 二、问题与需协调事项\n待补充\n\n### 三、明日工作安排\n待补充'
  const fixed=normalizeDailyReport(old)
  assert.match(fixed,/### 二、今日产生的商业价值（业绩、提效、合理降本等）/)
  assert.match(fixed,/### 三、问题与需协调事项/)
  assert.match(fixed,/### 四、明日计划（事项、商业价值）/)
  assert.doesNotMatch(fixed,/明日工作安排/)
  assert.match(fixed,/待补充：请补充今日产生的商业价值或业绩/)
})
test('已包含必填章节的日报重排后保持结构', () => {
  const report=ReportEngine.generateDailyReport('2026-11-07',[task('a','梳理会话采集方案')]).summaryMarkdown
  const normalized=normalizeDailyReport(report)
  assert.match(normalized,/### 二、今日产生的商业价值/)
  assert.match(normalized,/### 四、明日计划（事项、商业价值）/)
})
test('无工作记录的日期也保留日报必填章节', () => {
  const text=ReportEngine.generateDailyReport('2026-11-07',[]).summaryMarkdown
  assert.match(text,/暂无工作记录/)
  assert.match(text,/今日产生的商业价值（业绩、提效、合理降本等）/)
  assert.match(text,/明日计划（事项、商业价值）/)
})
test('日报中的价值与计划记录进入对应必填章节，不重复归入工作分组', () => {
  const text=ReportEngine.generateDailyReport('2026-11-07',[
    task('a','梳理会话采集方案'),
    task('b','商业价值：同步耗时从 10 分钟降到 2 分钟'),
    task('c','明日计划：补充失败重试与告警；预期减少人工排查'),
  ]).summaryMarkdown
  const work=text.split('### 二、')[0]
  const value=text.split('### 二、')[1].split('### 三、')[0]
  const plan=text.split('### 四、')[1]
  assert.match(work,/梳理会话采集方案/)
  assert.doesNotMatch(work,/同步耗时|补充失败重试/)
  assert.match(value,/同步耗时从 10 分钟降到 2 分钟/)
  assert.doesNotMatch(value,/待补充/)
  assert.match(plan,/补充失败重试与告警/)
})
test('日报占位章节需要 AI 归纳，填充后不再需要', () => {
  const report=ReportEngine.generateDailyReport('2026-11-07',[task('a','梳理会话采集方案')]).summaryMarkdown
  assert.equal(needsDailyInsight(report),true)
  const filled=applyDailyInsight(report,{value:['减少人工整理与重复验证时间'],plan:['补充回归用例：降低漏测风险'],generatedAt:'2026-11-07T10:00:00.000Z'})
  assert.match(filled,/• 减少人工整理与重复验证时间/)
  assert.match(filled,/• 补充回归用例：降低漏测风险/)
  assert.equal(needsDailyInsight(filled),false)
})
test('AI 归纳只替换商业价值与明日计划，其他章节保持不变', () => {
  const report=ReportEngine.generateDailyReport('2026-11-07',[task('a','梳理会话采集方案'),task('b','风险：模型额度不足')]).summaryMarkdown
  const filled=applyDailyInsight(report,{value:['缩短排查时间'],plan:['跟进模型额度：避免整理中断'],generatedAt:'2026-11-07T10:00:00.000Z'})
  assert.match(filled,/### 一、今日重点工作/)
  assert.match(filled,/梳理会话采集方案/)
  assert.match(filled,/### 三、问题与需协调事项/)
  assert.match(filled,/风险：模型额度不足|模型额度不足/)
  assert.match(filled,/### 四、明日计划（事项、商业价值）/)
})
test('明确计划与问题单列，不把修复工作推断为未解决风险', () => {
  const records=[task('a','下周计划：补充接口用例'),task('b','需协调：申请测试账号'),task('c','修复登录异常')]
  const report=ReportEngine.generateWeeklyReport('2026-W45',records,{})
  assert.match(report.sections[0].items.join(' '),/修复登录异常/)
  assert.deepEqual(report.sections[2].items,['• 补充接口用例'])
  assert.deepEqual(report.sections[5].items,['• 申请测试账号'])
  assert.match(report.markdown,/修复登录异常/)
  assert.match(report.markdown,/补充接口用例/)
  assert.match(report.markdown,/申请测试账号/)
})

test('周报固定包含6个维度，各维度记录正确归入对应章节', () => {
  const records=[
    task('1','重构工作台侧边栏布局'),
    task('2','商业价值：页面加载提效 35%，减少内存占用 20MB'),
    task('3','下周计划：完成数据导入与导出组件联调'),
    task('4','针对不足采取的措施：增加自动化边界用例，杜绝回归漏测'),
    task('5','重做一遍思考：提前梳理状态机，可缩短 2 天工期并带来更高扩展性'),
    task('6','团队问题：后端接口联调环境频发超时，阻塞测试进度'),
  ]
  const report=ReportEngine.generateWeeklyReport('2026-W45',records,{})
  assert.equal(report.sections.length,6)
  assert.match(report.sections[0].title,/一、本周完成的工作/)
  assert.match(report.sections[0].items.join(' '),/重构工作台侧边栏布局/)
  assert.match(report.sections[1].title,/二、本周产出了哪些商业价值（带来的业绩、提效、合理降本等）/)
  assert.match(report.sections[1].items.join(' '),/页面加载提效 35%/)
  assert.match(report.sections[2].title,/三、下周工作计划/)
  assert.match(report.sections[2].items.join(' '),/完成数据导入与导出组件联调/)
  assert.match(report.sections[3].title,/四、针对不足，你将采取的措施是什么？/)
  assert.match(report.sections[3].items.join(' '),/增加自动化边界用例/)
  assert.match(report.sections[4].title,/五、重做一遍应该怎么做？会带来哪些变化？产生哪些商业价值？/)
  assert.match(report.sections[4].items.join(' '),/提前梳理状态机/)
  assert.match(report.sections[5].title,/六、本周下来团队存在最大的问题是什么？（至少写一项）/)
  assert.match(report.sections[5].items.join(' '),/后端接口联调环境频发超时/)
  assert.doesNotMatch(report.markdown,/待补充/)
})

test('旧版周报补齐6个维度必填章节并重排章节序号', () => {
  const old=`工作周报（2026-11-03 ~ 2026-11-09）

### 一、本周重点工作
#### 1. 工作记录与报告整理
• 开发工作台周报新格式

### 二、问题与需协调事项
• 测试环境账号权限不足

### 三、下周工作安排
• 联调周报导出能力`
  const normalized=normalizeWeeklyReport(old)
  assert.match(normalized,/### 一、本周完成的工作/)
  assert.match(normalized,/开发工作台周报新格式/)
  assert.match(normalized,/### 二、本周产出了哪些商业价值（带来的业绩、提效、合理降本等）/)
  assert.match(normalized,/待补充：请补充本周产出的商业价值/)
  assert.match(normalized,/### 三、下周工作计划/)
  assert.match(normalized,/联调周报导出能力/)
  assert.match(normalized,/### 四、针对不足，你将采取的措施是什么？/)
  assert.match(normalized,/待补充：请针对本周工作的不足/)
  assert.match(normalized,/### 五、重做一遍应该怎么做？会带来哪些变化？产生哪些商业价值？/)
  assert.match(normalized,/待补充：请填写如果重做一遍应该怎么做/)
  assert.match(normalized,/### 六、本周下来团队存在最大的问题是什么？（至少写一项）/)
  assert.match(normalized,/测试环境账号权限不足/)
})

test('旧版三段式周报（核心产出+重点攻坚+下周规划）兼容归并为6个维度', () => {
  const old=`## 📊 工作周报 (2026-W43)
> 周期：2026-10-19 至 2026-10-25

### 一、本周核心工作产出与交付
1. 完成了核心功能模块的开发与自测验证

### 二、重点攻坚与推进中事项
1. [推进中] 开发 DeepSeek Harness 工作台插件

### 三、下周规划与风险预警
1. [下周计划] 实现工作台自动汇总算法
• 协调跨组网络策略权限`
  const normalized=normalizeWeeklyReport(old)
  assert.match(normalized,/### 一、本周完成的工作/)
  assert.match(normalized,/核心功能模块的开发/)
  assert.match(normalized,/DeepSeek Harness 工作台插件/)
  assert.match(normalized,/### 二、本周产出了哪些商业价值/)
  assert.match(normalized,/### 三、下周工作计划/)
  assert.match(normalized,/实现工作台自动汇总算法/)
  assert.match(normalized,/### 四、针对不足，你将采取的措施是什么？/)
  assert.match(normalized,/### 五、重做一遍应该怎么做？/)
  assert.match(normalized,/### 六、本周下来团队存在最大的问题是什么？/)
  assert.match(normalized,/协调跨组网络策略权限/)
})

test('支持 ## 二级标题或带编号格式的周报规整', () => {
  const md=`工作周报（2026-11-09 ~ 2026-11-15）
## 1. 本周完成的工作
• 事项A
## 2. 商业价值
• 提效 50%
## 3. 下周计划
• 事项B`
  const normalized=normalizeWeeklyReport(md)
  assert.match(normalized,/### 一、本周完成的工作/)
  assert.match(normalized,/事项A/)
  assert.match(normalized,/### 二、本周产出了哪些商业价值/)
  assert.match(normalized,/提效 50%/)
  assert.match(normalized,/### 三、下周工作计划/)
  assert.match(normalized,/事项B/)
  assert.match(normalized,/### 四、针对不足，你将采取的措施是什么？/)
  assert.match(normalized,/### 五、重做一遍应该怎么做？/)
  assert.match(normalized,/### 六、本周下来团队存在最大的问题是什么？/)
})
