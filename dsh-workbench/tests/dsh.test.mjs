import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync, mkdirSync, writeFileSync, rmSync} from 'node:fs'
import {tmpdir, homedir} from 'node:os'
import {join} from 'node:path'
import {zstdCompressSync} from 'node:zlib'
import {scanDsh, dshTranscript} from '../lib/host/dsh.js'
import {SessionCollector} from '../lib/host/collector.js'
import {WorkbenchStore} from '../lib/host/store.js'

const meta = (id, extra={}) => ({type:'session',version:4,id,cwd:'/真实项目',delegationDepth:0,...extra})
const user = (text, time='2026-11-07T10:00:00Z', kind='user') => ({type:'user/message',time:Date.parse(time),data:{source:{kind},content:[{type:'text',text}]}})
const assistant = text => ({type:'assistant/message',time:Date.parse('2026-11-07T10:01:00Z'),data:{message:{content:[{type:'reasoning',text:'内部推理'},{type:'text',text}]}}})
function fixture() {
  const root=mkdtempSync(join(tmpdir(),'harness-collector-'))
  const put=(id,rows,name='session.v4.jsonl.zstd')=>{
    const dir=join(root,'工作区',id);mkdirSync(dir,{recursive:true})
    writeFileSync(join(dir,name),zstdCompressSync(rows.map(row=>JSON.stringify(row)).join('\n')+'\n'))
    return dir
  }
  return {root,put}
}

test('读取原生新旧压缩会话，按北京时间分日，过滤注入、空会话和子代理',async()=>{
  const {root,put}=fixture()
  try {
    const dir=put('a',[meta('a'),user('环境注入',undefined,'runtime-context'),user('技能目录',undefined,'skill-catalog'),
      user('修复长需求：'+'需求'.repeat(100)),...Array.from({length:25},()=>({type:'step/start'})),assistant('已分析接口'),
      user('继续回归','2026-11-07T16:30:00Z')])
    // 新旧文件共存时仅使用新格式，不重复计数。
    put('a',[meta('a'),user('旧格式副本')],'session.jsonl.zstd')
    put('b',[meta('b',{version:0}),user('整理历史需求')],'session.jsonl.zstd')
    put('empty',[meta('empty'),user('时间注入',undefined,'time-context')])
    put('child',[meta('child',{delegationDepth:1}),user('子代理任务')])
    put('seed',[meta('seed',{isSeeded:true}),user('种子消息')])
    put('duplicate',[meta('a'),user('重复会话')])
    const result=await scanDsh(root)
    assert.equal(result.error,undefined);assert.equal(result.sessionCount,2);assert.equal(result.extractedTasks.length,3)
    const task=result.extractedTasks.find(t=>t.recordDate==='2026-11-07'&&t.evidence[0].sessionId==='a')
    assert.equal(task.projectPath,'/真实项目');assert.equal(task.status,undefined)
    assert.equal(task.createdAt,'2026-11-07T10:00:00.000Z')
    assert.match(task.evidence[0].quote,/修复长需求/)
    assert.match(dshTranscript(task),/已分析接口/)
    assert.doesNotMatch(dshTranscript(task),/内部推理|环境注入|技能目录|旧格式副本|重复会话/)
    assert.deepEqual((await scanDsh(root)).extractedTasks.map(t=>t.id),result.extractedTasks.map(t=>t.id))
    assert.equal((await scanDsh(dir)).sessionCount,1)
    // Harness 追加多帧压缩日志时也应读取后续内容。
    const {appendFileSync}=await import('node:fs')
    appendFileSync(join(dir,'session.v4.jsonl.zstd'),zstdCompressSync(JSON.stringify(user('追加的真实消息'))+'\n'))
    const appended=await scanDsh(dir)
    assert.match(dshTranscript(appended.extractedTasks[0]),/追加的真实消息/)
  } finally {rmSync(root,{recursive:true,force:true})}
})

test('损坏文件明确报错但仍采集健康会话，概要缓存复用且变化后刷新',async()=>{
  const {root,put}=fixture()
  try {
    put('a',[meta('a'),user('分析接口超时')])
    const broken=put('broken',[]);writeFileSync(join(broken,'session.v4.jsonl.zstd'),'损坏文件')
    const source={id:'dsh',path:root}
    let calls=0
    const collector=new SessionCollector(async()=>{calls++;return '{"0":"分析并排查接口超时原因"}'})
    const progress=[]
    const first=await collector.scanSource(source,[],(count,p)=>progress.push({count,...p}))
    assert.equal(first.sessionCount,1);assert.equal(first.extractedTasks.length,1);assert.match(first.error,/1 个.*读取失败/)
    assert.equal(progress.at(-1).count,1);assert.equal(progress.at(-1).processed,1)
    await collector.scanSource(source,first.extractedTasks);assert.equal(calls,1)
    put('a',[meta('a'),user('分析接口超时'),assistant('补充新的排查结论')])
    const refreshed=await collector.scanSource(source,first.extractedTasks)
    assert.equal(calls,2);assert.equal(refreshed.extractedTasks[0].id,first.extractedTasks[0].id)
    assert.notEqual(refreshed.extractedTasks[0].summaryHash,first.extractedTasks[0].summaryHash)
    const failed=await new SessionCollector(async()=>{throw Error('模型不可用')}).scanSource(source,first.extractedTasks)
    assert.equal(failed.extractedTasks.length,0);assert.match(failed.error,/读取失败.*概要生成失败/)
    assert.match((await new SessionCollector().scanSource(source)).error,/未连接会话概要模型/)
    assert.match((await scanDsh(join(root,'missing'))).error,/未找到 Harness/)
  } finally {rmSync(root,{recursive:true,force:true})}
})

test('迁移错误默认路径与虚假计数，移除 DSH 预置记录，保留自定义路径和真实记录',()=>{
  const root=mkdtempSync(join(tmpdir(),'harness-store-'));const file=join(root,'store.json')
  try {
    const original={version:1,tasks:[{id:'task-dsh-workbench-init',source:'dsh'},{id:'task-dsh-sidebar-slot',source:'dsh'},
      {id:'真实记录',source:'dsh'},{id:'手工记录',source:'manual'}],sources:[
      {id:'dsh',path:join(homedir(),'.gemini/antigravity-cli/brain'),sessionCount:95,enabled:false,lastSyncAt:'旧时间'}]}
    writeFileSync(file,JSON.stringify(original))
    const snapshot=new WorkbenchStore(file).getSnapshot()
    const source=snapshot.sources.find(s=>s.id==='dsh')
    assert.equal(source.path,join(homedir(),'.dsh/sessions'));assert.equal(source.sessionCount,0)
    assert.equal(source.lastSyncAt,null);assert.equal(source.enabled,false)
    assert.deepEqual(snapshot.tasks.map(t=>t.id),['真实记录','手工记录'])
    original.sources[0].path='/自定义会话目录';writeFileSync(file,JSON.stringify(original))
    assert.equal(new WorkbenchStore(file).getSnapshot().sources[0].path,'/自定义会话目录')
    rmSync(file)
    assert.equal(new WorkbenchStore(file).getSnapshot().tasks.some(t=>t.source==='dsh'),false)
  } finally {rmSync(root,{recursive:true,force:true})}
})
