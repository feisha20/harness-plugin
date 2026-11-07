import {test} from 'node:test'
import assert from 'node:assert/strict'
import {reorganizeReport} from '../lib/host/reportSummary.js'
const record={id:'x',title:'原始标题',createdAt:'2026-11-07T02:00:00Z',source:'zcode',evidence:[{quote:'实际在排查接口超时'}]}
test('AI 重新整理使用周期内正文，返回持久化的 AI 标记',async()=>{
 const original={day:'2026-11-07',summaryMarkdown:'旧报告',isEdited:false}
 let calls=0
 const updated=await reorganizeReport(original,[record],async input=>{calls++;assert.match(input,/实际在排查接口超时/);return '工作日报\n### 一、今日重点工作\n• 排查接口超时及调用链配置问题'})
 assert.equal(calls,1);assert.equal(updated.aiOrganized,true);assert.match(updated.summaryMarkdown,/排查接口超时/)
 assert.equal(original.summaryMarkdown,'旧报告')
})
test('空周期和模型错误不覆盖旧报告',async()=>{
 const original={day:'2026-11-06',summaryMarkdown:'保留原文',isEdited:true}
 await assert.rejects(reorganizeReport(original,[record],async()=>''),/没有工作记录/)
 original.day='2026-11-07'
 await assert.rejects(reorganizeReport(original,[record],async()=>{throw Error('模型不可用')}),/模型不可用/)
 assert.equal(original.summaryMarkdown,'保留原文')
})
