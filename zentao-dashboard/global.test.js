import {test} from 'node:test';
import assert from 'node:assert/strict';
import {recentOnline,collectGlobal,taskProgress,unclosed} from './global.js';
test('仅保留未关闭冲刺，包含已关闭项目下的遗留冲刺；跨冲刺缺陷去重',async()=>{
 const calls=[];
 const reader=async(r,scope,id)=>{
  calls.push([r,scope,id]);
  if(r==='projects')return [{id:1,name:'历史项目',status:'closed'},{id:2,name:'当前项目',status:'doing'}];
  if(r==='executions')return id===1?[{id:10,type:'sprint',name:'遗留',status:'doing',end:'2026-11-01'},{id:11,type:'sprint',status:'closed'},{id:12,type:'stage',status:'wait'}]:[{id:20,type:'sprint',name:'未开始',status:'wait',end:'2026-12-01'}];
  if(r==='bugs')return [{id:100,status:'active',onlineIssue:'1',pri:'1',openedDate:'2026-11-01 00:00:00'}];
  return [];
 };
 const d=await collectGlobal(reader,Date.parse('2026-11-09T12:00:00+08:00'));
 assert.deepEqual(d.sprints.map(s=>s.id),[10,20]);assert.equal(d.bugs.length,1);assert.equal(d.summary.onlineOpen,1);assert.equal(d.summary.delayed,1);assert.equal(d.complete,true);
 assert(!calls.some(([r,_,id])=>r==='bugs'&&id===11));
 assert.equal(unclosed({status:'closed'}),false);
});
test('读取失败明确标记部分数据，不把失败当零',async()=>{
 const reader=async(r,scope,id)=>{
  if(r==='projects')return [{id:1,name:'甲'},{id:2,name:'乙'}];
  if(r==='executions'){if(id===2)throw Error();return [{id:10,type:'sprint',status:'doing'}];}
  if(r==='tasks')throw Error();return [];
 };
 const d=await collectGlobal(reader);
 assert.equal(d.complete,false);assert.equal(d.warnings.length,1);assert.equal(d.sprints[0].tasks,null);assert.equal(d.sprints[0].warnings.length,1);
});
test('最近30天线上问题包含关闭记录，准确处理日期边界',()=>{
 const mk=(id,date,onlineIssue='1',status='active')=>({id,openedDate:date,onlineIssue,status});
 const result=recentOnline([mk(1,'2026-10-11 00:00:00'),mk(2,'2026-10-10 23:59:59'),mk(3,'2026-11-09 00:00:00','1','closed'),mk(4,'2026-11-10 00:00:00'),mk(5,'2026-11-01 00:00:00','0'),mk(6,'')],Date.parse('2026-11-08T16:00:00Z'));
 assert.equal(result.from,'2026-10-11');assert.equal(result.to,'2026-11-09');
 assert.deepEqual(result.items.map(b=>b.id),[1,3]);
});
test('任务完成率排除父任务和取消任务',()=>{
 assert.deepEqual(taskProgress([{id:1,isParent:'1',status:'doing'},{id:2,parent:1,status:'done'},{id:3,status:'cancel'},{id:4,status:'doing'}]),{total:2,done:1});
 assert.equal(taskProgress(null),null);
});
test('问题创建人取禅道姓名，与当前指派人无关',async()=>{
 const reader=async r=>{
  if(r==='users')return [{account:'qa',realname:'测试姓名'}];
  if(r==='projects')return [{id:1,name:'项目'}];
  if(r==='executions')return [{id:2,type:'sprint',status:'doing'}];
  if(r==='bugs')return [{id:3,openedBy:'qa',assignedTo:'closed'},{id:4,openedBy:'missing'}];
  return [];
 };
 const d=await collectGlobal(reader);
 assert.equal(d.bugs[0].creatorName,'测试姓名');
 assert.equal(d.bugs[1].creatorName,'姓名未获取');
});
test('忽略仅排除关注冲刺，线上问题仍保留；取消忽略恢复需求任务加载',async()=>{
 const calls=[];
 const reader=async(r,scope,id)=>{
  if(r==='projects')return [{id:1,name:'项目'}];
  if(r==='executions')return [{id:2,type:'sprint',status:'doing'},{id:3,type:'sprint',status:'doing'}];
  if(scope==='execution')calls.push([r,id]);
  if(r==='bugs')return [{id:id*10,status:'active',onlineIssue:'1',openedDate:'2026-11-09 00:00:00'}];
  return [];
 };
 const now=Date.parse('2026-11-09T12:00:00+08:00');
 const d=await collectGlobal(reader,now,[{id:'2',name:'忽略项'}]);
  assert.deepEqual(calls.filter(([,id])=>id===2),[['bugs',2]]);
  assert.deepEqual(d.sprints.map(s=>s.id),[3]);assert.equal(d.summary.openBugs,1);assert.equal(d.recentOnline.items.length,2);
 calls.length=0;
 const restored=await collectGlobal(reader,now,[]);
  assert.equal(calls.filter(([,id])=>id===2).length,3);assert.equal(restored.summary.openBugs,2);
  assert.deepEqual(d.recentOnline.items.map(b=>b.id).sort(),restored.recentOnline.items.map(b=>b.id).sort());
  const allIgnored=await collectGlobal(reader,now,[{id:'2'},{id:'3'}]);
  assert.equal(allIgnored.sprints.length,0);assert.equal(allIgnored.recentOnline.items.length,2);
});
