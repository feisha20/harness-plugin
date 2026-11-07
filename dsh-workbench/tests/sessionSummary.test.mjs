import {test} from 'node:test'
import assert from 'node:assert/strict'
import {summarizeSessions} from '../lib/host/sessionSummary.js'
const task={id:'zcode-a',title:'https://example.test/bug/12',source:'zcode',createdAt:'2026-11-07T02:00:00Z'}
test('使用会话正文生成一句概要并缓存，后续对话变化重新生成',async()=>{
 let calls=0
 const model=async input=>{calls++;assert.match(input,/助手分析登录接口/);return JSON.stringify({'0':'排查登录接口异常及请求参数配置'})}
 const transcripts=new Map([[task.id,'user: https://example.test/bug/12\nassistant: 助手分析登录接口，核对请求参数']])
 const first=await summarizeSessions([task],transcripts,[],model)
 assert.equal(first.tasks[0].title,'排查登录接口异常及请求参数配置')
 assert.equal(first.failures,0)
 await summarizeSessions([task],transcripts,first.tasks,model)
 assert.equal(calls,1)
 transcripts.set(task.id,transcripts.get(task.id)+'\nuser: 补充异常日志')
 await summarizeSessions([task],transcripts,first.tasks,model)
 assert.equal(calls,2)
})
test('概要失败或模型返回 URL 时拒绝伪装为有效概要',async()=>{
 const transcripts=new Map([[task.id,'正文']])
 for(const generate of [async()=>{throw Error('超时')},async()=>'{"0":"https://example.test"}',async()=>'{"0":"第一行\\n第二行"}']){
  const result=await summarizeSessions([task],transcripts,[],generate)
  assert.equal(result.failures,1);assert.equal(result.tasks.length,0)
 }
})
test('长会话限制输入，但中间消息变化也使缓存失效',async()=>{
 let calls=0
 const model=async input=>{calls++;assert.ok(input.length<13000);return '{"0":"梳理接口测试用例及异常处理逻辑"}'}
 const transcripts=new Map([[task.id,'开头'+'a'.repeat(16000)+'结尾']])
 const first=await summarizeSessions([task],transcripts,[],model)
 transcripts.set(task.id,'开头'+'a'.repeat(8000)+'中间补充'+'a'.repeat(8000)+'结尾')
 await summarizeSessions([task],transcripts,first.tasks,model)
 assert.equal(calls,2)
})
