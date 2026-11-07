import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {DatabaseSync} from 'node:sqlite'
import {scanZcode, zcodeTranscript} from '../lib/host/zcode.js'
import {WorkbenchStore} from '../lib/host/store.js'

test('只读采集 WAL，按会话日期合并，跳过隐藏与子代理消息，标识稳定',()=>{
 const dir=mkdtempSync(join(tmpdir(),'zcode-collector-'));const file=join(dir,'db.sqlite');const db=new DatabaseSync(file)
 try {
  db.exec(`PRAGMA journal_mode=WAL;CREATE TABLE session(id TEXT,parent_id TEXT,directory TEXT,title TEXT,time_deleted INTEGER);
    CREATE TABLE message(id TEXT,session_id TEXT,time_created INTEGER,data TEXT);
    CREATE TABLE part(id TEXT,message_id TEXT,time_created INTEGER,data TEXT);`)
  db.prepare('INSERT INTO session VALUES(?,?,?,?,?)').run('s',null,'/project','接口测试',null)
  db.prepare('INSERT INTO session VALUES(?,?,?,?,?)').run('child','s','/project','内部任务',null)
  const add=(id,at,role='user',data={},session='s')=>{
   db.prepare('INSERT INTO message VALUES(?,?,?,?)').run(id,session,Date.parse(at),JSON.stringify({role,...data}))
   db.prepare('INSERT INTO part VALUES(?,?,?,?)').run('p'+id,id,Date.parse(at),JSON.stringify({type:'text',text:'工作原话'+id}))
  }
  add('a','2026-11-06T16:30:00Z');add('b','2026-11-07T10:00:00Z');add('c','2026-11-07T16:30:00Z')
  add('d','2026-11-07T10:00:00Z','assistant',{time:{completed:1}});add('e','2026-11-07T10:00:00Z','user',{synthetic:true})
  add('f','2026-11-07T10:00:00Z','user',{},'child')
  const result=scanZcode(file)
  assert.equal(result.error,undefined);assert.equal(result.sessionCount,1);assert.equal(result.extractedTasks.length,2)
  assert.deepEqual(result.extractedTasks.map(t=>t.recordDate),['2026-11-07','2026-11-08'])
  assert.equal(result.extractedTasks[0].evidence.length,2)
  assert.match(zcodeTranscript(result.extractedTasks[0]),/assistant: 工作原话d/)
  assert.doesNotMatch(zcodeTranscript(result.extractedTasks[0]),/工作原话e|工作原话f/)
  assert.equal(result.extractedTasks[0].status,undefined)
  assert.equal(result.extractedTasks[0].projectPath,'/project')
  assert.deepEqual(scanZcode(file).extractedTasks.map(t=>t.id),result.extractedTasks.map(t=>t.id))
  assert.equal(db.prepare('select count(*) n from message').get().n,6)
 } finally {db.close();rmSync(dir,{recursive:true,force:true})}
})
test('缺失或无效数据库返回明确错误，不生成模拟记录',()=>{
 assert.match(scanZcode('/missing-zcode/db.sqlite').error,/未找到/)
 const dir=mkdtempSync(join(tmpdir(),'zcode-invalid-'));try{const file=join(dir,'db.sqlite');writeFileSync(file,'invalid');const result=scanZcode(file);assert.match(result.error,/读取失败/);assert.equal(result.extractedTasks.length,0)}finally{rmSync(dir,{recursive:true,force:true})}
})
test('旧工作台补入 Zcode，保留已有来源开关和记录，重复加载不重复添加',()=>{
 const dir=mkdtempSync(join(tmpdir(),'zcode-migration-'));try{
 const file=join(dir,'store.json');writeFileSync(file,JSON.stringify({version:1,tasks:[{id:'original',title:'已有工作'}],sources:[{id:'codex',enabled:false}],dailyReports:{},weeklyReports:{},monthlyReports:{},lastSyncTime:null}))
 const store=new WorkbenchStore(file);store.save();const snapshot=new WorkbenchStore(file).getSnapshot()
 assert.equal(snapshot.sources.filter(s=>s.id==='zcode').length,1)
 assert.equal(snapshot.sources.find(s=>s.id==='codex').enabled,false)
 assert.equal(snapshot.tasks[0].id,'original')
 }finally{rmSync(dir,{recursive:true,force:true})}
})
