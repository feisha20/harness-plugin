import {test} from 'node:test'
import assert from 'node:assert/strict'
import {reorganizeReport} from '../lib/host/reportSummary.js'
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
