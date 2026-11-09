import { read, pick, fields, isOnline, daysOpen, CACHE_TTL_MS } from './data.js';
import { preferences } from './preferences.js';

// 限制并发，避免全局汇总同时压满禅道接口。
async function pool(items, fn, limit = 4) {
  const result = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{
    while(cursor<items.length){const i=cursor++;result[i]=await fn(items[i]);}
  }));
  return result;
}
export const unclosed = x => x.status !== 'closed' && !['1','true'].includes(String(x.deleted));
export function taskProgress(tasks) {
  if (!tasks) return null;
  const parents = new Set(tasks.filter(x=>Number(x.parent)>0).map(x=>String(x.parent)));
  const leaves = tasks.filter(x=>x.status!=='cancel'&&!['1','true'].includes(String(x.isParent))&&!parents.has(String(x.id)));
  return {total:leaves.length,done:leaves.filter(x=>['done','closed'].includes(x.status)).length};
}
// 上海日期的最近30个自然日，含今天，保留各处理状态。
export function recentOnline(bugs, now = Date.now()) {
  const to = new Date(now).toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'});
  const from = new Date(Date.parse(to+'T00:00:00+08:00')-29*86400000).toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'});
  const items = bugs.filter(b=>{
    const date = String(b.openedDate || '').slice(0,10);
    return isOnline(b) && /^\d{4}-\d{2}-\d{2}$/.test(date) && date>=from && date<=to;
  });
  return {from,to,items};
}
export async function collectGlobal(reader = read, now = Date.now(), ignoredSprints = []) {
  const warnings=[];
  let users=[];
  try { users=await reader('users'); }
  catch { warnings.push('禅道用户姓名读取失败，创建人姓名未评估'); }
  const names=new Map(users.map(u=>[String(u.account),u.realname]));
  // 必须遍历全部可见项目，关闭项目下也可能遗留未关闭冲刺。
  const projects=await reader('projects');
  const groups=await pool(projects,async p=>{
    try { return (await reader('executions','project',p.id)).filter(x=>unclosed(x)&&(!x.type||x.type==='sprint')).map(x=>({...x,projectName:p.name,projectId:p.id})); }
    catch { warnings.push('项目「'+p.name+'」冲刺清单读取失败');return []; }
  });
  const unique = [...new Map(groups.flat().map(x=>[String(x.id),x])).values()];
  const ignoredIds=new Set(ignoredSprints.map(s=>String(s.id)));
  const sprints=await pool(unique.filter(ex=>!ignoredIds.has(String(ex.id))),async ex=>{
    const data={...pick([ex],fields.executions)[0],projectName:ex.projectName,projectId:ex.projectId,warnings:[]};
    // 每个工作者逐项查询，全局最多4个在途请求。
    for(const name of ['stories','tasks','bugs']) {
      try { data[name]=pick(await reader(name,'execution',ex.id),fields[name]); }
      catch {data[name]=null;data.warnings.push(({stories:'需求',tasks:'任务',bugs:'缺陷'})[name]+'读取失败');}
    }
    return data;
  });
  const today=new Date(now).toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'});
  const bugs=[...new Map(sprints.flatMap(s=>(s.bugs||[]).map(b=>({...b,sprintName:s.name,projectName:s.projectName}))).map(b=>[String(b.id),b])).values()];
  // 线上问题独立于关注清单；忽略项只补查缺陷，不加载需求和任务。
  const ignoredBugs=await pool(unique.filter(ex=>ignoredIds.has(String(ex.id))),async ex=>{
    try { return pick(await reader('bugs','execution',ex.id),fields.bugs).map(b=>({...b,sprintName:ex.name,projectName:ex.projectName})); }
    catch {warnings.push('冲刺「'+ex.name+'」线上问题读取失败');return [];}
  });
  const onlineSource=[...new Map([...bugs,...ignoredBugs.flat()].map(b=>[String(b.id),b])).values()];
  for (const b of onlineSource) {
    const creator=b.openedBy;
    const account=typeof creator==='object'&&creator?creator.account:creator;
    b.creatorName=names.get(String(account)) || (typeof creator==='object'&&creator?creator.realname:'') || '姓名未获取';
  }
  const open=bugs.filter(b=>b.status!=='closed');
  const delayed=s=>/^\d{4}-\d{2}-\d{2}$/.test(s.end)&&s.end!=='0000-00-00'&&s.end<today;
  sprints.sort((a,b)=>Number(delayed(b))-Number(delayed(a))||String(a.end).localeCompare(String(b.end)));
  return {sprints,bugs,ignoredSprints,recentOnline:recentOnline(onlineSource,now),warnings,complete:warnings.length===0&&sprints.every(s=>!s.warnings.length),summary:{
    sprints:sprints.length,delayed:sprints.filter(delayed).length,openBugs:open.length,
    onlineOpen:open.filter(isOnline).length,pendingVerification:open.filter(b=>b.status==='resolved').length,
    highPriority:open.filter(b=>Number(b.pri)>0&&Number(b.pri)<=2).length,
    aging:open.filter(b=>b.status==='active'&&daysOpen(b,now)>7).length
  },scope:'上方统计为未忽略的关注冲刺；下方最近30天线上问题覆盖全部未关闭冲刺，含已忽略项。',readAt:new Date(now).toISOString()};
}
let snapshot, running, generation=0;
export function invalidateGlobal() { generation++; snapshot=undefined; running=undefined; }
export function globalSnapshot() {
  const ignored=preferences.list(), key=JSON.stringify(ignored), revision=generation;
  if (snapshot && snapshot.key===key && Date.now()-snapshot.at<CACHE_TTL_MS) return Promise.resolve(snapshot.value);
  if (!running || running.key!==key) {
    const job=collectGlobal(read,Date.now(),ignored).then(value=>{if(revision===generation)snapshot={key,at:Date.now(),value};return value;}).finally(()=>{if(running===job)running=null;});
    job.key=key;running=job;
  }
  return running;
}
