import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createWorkbenchHttpHandler} from '../lib/host/webRoutes.js'
import {summarizeSessions} from '../lib/host/sessionSummary.js'

const response=()=>({status:0,body:null,writeHead(code){this.status=code},end(body){this.body=JSON.parse(body)}})
const request=(method,url)=>({method,url,headers:{}})
function setup(collector,sources=[{id:'codex',enabled:true,status:'available'}]) {
  const snapshot={tasks:[],sources}
  const store={getSnapshot:()=>snapshot,save(){},saveTask(task){snapshot.tasks.push(task)}}
  return {snapshot,handler:createWorkbenchHttpHandler(store,collector)}
}
test('同步期间能查询真实进度、拒绝重复启动，结束后释放锁',async()=>{
  let finish
  const pending=new Promise(resolve=>{finish=resolve})
  const {handler,snapshot}=setup({async scanSource(source,previous,progress){
    progress(34,{total:39,processed:4,cached:0,failed:0})
    await pending
    return {sessionCount:34,extractedTasks:[]}
  }})
  const first=response();const running=handler(request('POST','/api/workbench/sync'),first)
  const status=response();await handler(request('GET','/api/workbench/sync/status'),status)
  assert.equal(status.body.running,true);assert.equal(status.body.sources[0].sessionCount,34)
  assert.match(status.body.sources[0].progress,/4\/39/)
  const duplicate=response();await handler(request('POST','/api/workbench/sync'),duplicate)
  assert.equal(duplicate.status,409)
  finish();await running
  assert.equal(snapshot.sources[0].status,'available')
  await handler(request('GET','/api/workbench/sync/status'),status);assert.equal(status.body.running,false)
})
test('采集抛错清除采集中状态，重启恢复中断状态，状态接口不泄漏凭据',async()=>{
  const sources=[{id:'codex',enabled:true,status:'scanning'},{id:'zentao',enabled:false,zentaoConfig:{token:'仅用于测试'}}]
  const {handler,snapshot}=setup({async scanSource(){throw Error('文件读取失败')}},sources)
  assert.equal(sources[0].status,'error');assert.match(sources[0].error,/已中断/)
  const res=response();await handler(request('POST','/api/workbench/sync'),res)
  assert.equal(res.body.success,false);assert.equal(snapshot.sources[0].status,'error')
  assert.match(snapshot.sources[0].error,/文件读取失败/)
  await handler(request('GET','/api/workbench/sync/status'),res)
  assert.equal(res.body.running,false);assert.equal(res.body.sources[1].zentaoConfig,undefined)
})
test('概要进度覆盖缓存复用和失败，数量最终达到总数',async()=>{
  const tasks=Array.from({length:6},(_,i)=>({id:String(i),title:'工作',source:'codex'}))
  const transcripts=new Map(tasks.map(task=>[task.id,'实际会话'+task.id]))
  const model=async input=>JSON.stringify(Object.fromEntries(Object.keys(JSON.parse(input)).map(key=>[key,'整理测试工作记录'])))
  const cached=(await summarizeSessions(tasks.slice(0,2),transcripts,[],model)).tasks
  const progress=[]
  const result=await summarizeSessions(tasks,transcripts,cached,async()=>{throw Error('超时')},p=>progress.push(p))
  assert.deepEqual(progress[0],{total:6,processed:2,cached:2,failed:0})
  assert.deepEqual(progress.at(-1),{total:6,processed:6,cached:2,failed:4})
  assert.equal(result.tasks.length,2)
})
