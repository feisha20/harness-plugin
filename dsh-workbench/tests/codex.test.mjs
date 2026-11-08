import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync, mkdirSync, writeFileSync, rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {scanCodex, codexTranscript} from '../lib/host/codex.js'
import {SessionCollector} from '../lib/host/collector.js'
import {createWorkbenchHttpHandler} from '../lib/host/webRoutes.js'

for (const source of ['codex','dsh']) test(`同步按 ${source} 记录 ID 写入，跨日同概要不丢失，变化后持久化更新`,async()=>{
  const snapshot={tasks:[],sources:[{id:source,enabled:true}]}
  const store={getSnapshot:()=>snapshot,save:()=>{},saveTask:item=>{
    const index=snapshot.tasks.findIndex(task=>task.id===item.id)
    if(index<0) snapshot.tasks.push(item); else snapshot.tasks[index]=item
  }}
  let revision=0
  const collector={scanSource:async()=>({sessionCount:1,extractedTasks:[
    {id:'day1',source,title:'排查接口',summaryHash:String(revision)},
    {id:'day2',source,title:'排查接口',summaryHash:'second'}
  ]})}
  const handler=createWorkbenchHttpHandler(store,collector)
  const req={method:'POST',url:'/api/workbench/sync',headers:{}}
  let response
  const res={writeHead:()=>{},end:body=>{response=JSON.parse(body)}}
  await handler(req,res);assert.equal(response.newTasks,2);assert.equal(snapshot.tasks.length,2)
  revision++;await handler(req,res)
  assert.equal(response.updatedTasks,2);assert.equal(snapshot.tasks[0].summaryHash,'1')
})
const meta = (id, extra = {}) => ({type:'session_meta', payload:{id,cwd:'/project',originator:'Codex Desktop',source:'vscode',...extra}})
const message = (role, text, timestamp='2026-11-07T10:00:00Z', extra={}) => ({type:'response_item',timestamp,payload:{type:'message',role,content:[{type:role==='user'?'input_text':'output_text',text}],...extra}})
function fixture() {
  const root=mkdtempSync(join(tmpdir(),'codex-collector-'))
  mkdirSync(join(root,'sessions','2026'),{recursive:true});mkdirSync(join(root,'archived_sessions'))
  const put=(file,rows)=>writeFileSync(join(root,file),rows.map(row=>typeof row==='string'?row:JSON.stringify(row)).join('\n'))
  return {root,put}
}
test('桌面端与归档会话按日期归并，过滤注入、子代理和重复消息，ID稳定',async()=>{
  const {root,put}=fixture()
  try {
    put('sessions/2026/a.jsonl',[meta('s'),message('user','# AGENTS.md instructions\n<INSTRUCTIONS>规则</INSTRUCTIONS>\n<environment_context>环境</environment_context>'),
      message('user','修复登录接口'),message('assistant','内部推理',undefined,{channel:'analysis'}),
      message('assistant','处理中',undefined,{phase:'commentary'}),message('assistant','已修复接口'),
      {type:'event_msg',timestamp:'2026-11-07T10:00:00Z',payload:{type:'user_message',message:'修复登录接口'}},
      message('user','增加回归验证','2026-11-07T16:30:00Z'),'{"不完整":'])
    put('archived_sessions/copy.jsonl',[meta('s'),message('user','重复归档')])
    put('archived_sessions/b.jsonl',[meta('old'),message('user','整理历史需求')])
    put('sessions/child.jsonl',[meta('child',{parent_thread_id:'s'}),message('user','内部任务')])
    put('sessions/guardian.jsonl',[meta('guardian',{source:{subagent:{other:'guardian'}}}),message('user','守护代理')])
    const result=await scanCodex(root)
    assert.equal(result.error,undefined);assert.equal(result.sessionCount,2);assert.equal(result.extractedTasks.length,3)
    const task=result.extractedTasks.find(t=>t.recordDate==='2026-11-07'&&t.evidence[0].sessionId==='s')
    assert.equal(task.evidence.length,1);assert.equal(task.projectPath,'/project');assert.equal(task.status,undefined)
    assert.match(codexTranscript(task),/已修复接口/)
    assert.doesNotMatch(codexTranscript(task),/INSTRUCTIONS|内部推理|处理中|环境|重复归档/)
    assert.deepEqual((await scanCodex(root)).extractedTasks.map(t=>t.id),result.extractedTasks.map(t=>t.id))
    assert.equal((await scanCodex(join(root,'sessions'))).sessionCount,1)
  } finally {rmSync(root,{recursive:true,force:true})}
})
test('兼容旧事件日志，缺路径明确报错，概要缓存复用且模型失败不写假记录',async()=>{
  const {root,put}=fixture()
  try {
    put('sessions/old.jsonl',[meta('legacy'),{type:'event_msg',timestamp:'2026-11-07T10:00:00Z',payload:{type:'user_message',message:'排查接口超时'}}])
    const source={id:'codex',path:root}
    let calls=0
    const collector=new SessionCollector(async()=>{calls++;return '{"0":"排查并分析接口超时原因"}'})
    const result=await collector.scanSource(source)
    assert.equal(result.extractedTasks[0].title,'排查并分析接口超时原因')
    await collector.scanSource(source,result.extractedTasks);assert.equal(calls,1)
    assert.match((await new SessionCollector().scanSource(source)).error,/未连接/)
    const failed=await new SessionCollector(async()=>{throw new Error('模型不可用')}).scanSource(source)
    assert.equal(failed.extractedTasks.length,0);assert.match(failed.error,/概要生成失败/)
    assert.match((await scanCodex(join(root,'missing'))).error,/未找到/)
  } finally {rmSync(root,{recursive:true,force:true})}
})
