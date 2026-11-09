import { read, pick, fields, CACHE_TTL_MS } from './data.js';
import { globalSnapshot, invalidateGlobal } from './global.js';
import { preferences } from './preferences.js';
export const inject = ['webServer','tools'];
export function setIgnored(args) { const result=preferences.set(args); invalidateGlobal(); return result; }
export function apply(ctx) {
  ctx.effect(()=>ctx.tools.register({
    name:'zentao_sprint_preferences',
    description:'查看禅道看板忽略清单，或忽略/恢复一个冲刺；仅修改本机看板关注范围，不修改禅道。',
    parameters:{type:'object',properties:{action:{type:'string',enum:['list','set']},id:{type:'string',description:'set 时填写冲刺编号'},ignored:{type:'boolean',description:'set 时必填：true 忽略，false 恢复'},name:{type:'string',description:'忽略时保存的冲刺名称'},projectName:{type:'string',description:'忽略时保存的项目名称'}},required:['action'],additionalProperties:false},
    output:{schema:{type:'object'},render:(_,value)=>[{type:'text',text:JSON.stringify(value)}]},
    async execute(args) { if(args.action==='list')return {ignoredSprints:preferences.list()};if(args.action==='set')return setIgnored(args);throw Error('操作无效'); }
  }));
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact', path: '/api/zentao-dashboard',
    async handler(req, res) {
      const send = (status, body) => { res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}); res.end(JSON.stringify(body)); };
      if (!['GET','POST'].includes(req.method)) return send(405, {error:'请求方法无效'});
      if (req.headers['sec-fetch-site'] === 'cross-site' || (req.headers.origin && req.headers.origin !== ctx.webServer.getOrigin())) return send(403, {error:'请从 DSH 看板访问'});
      const q = new URL(req.url, 'http://localhost').searchParams;
      const action = q.get('action') || 'catalog';
      const id = q.get('id');
      if(req.method==='POST') {
        if(action!=='ignore')return send(405,{error:'请求方法无效'});
        if(!req.headers['content-type']?.startsWith('application/json'))return send(415,{error:'请提交JSON设置'});
        try {
          let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>4096)throw Error('设置内容过大');}
          return send(200,setIgnored(JSON.parse(raw)));
        } catch(e){return send(400,{error:e.message});}
      }
      if (!['catalog','global'].includes(action) && !/^[1-9]\d*$/.test(id || '')) return send(400, {error:'对象编号无效'});
      try {
        let data;
        if (action === 'global') return send(200, await globalSnapshot());
        if (action === 'catalog') {
          const [projects,products] = await Promise.all([read('projects'),read('products')]);
          data = {projects:pick(projects, fields.catalog),products:pick(products, fields.catalog)};
        } else if (action === 'executions') data = {executions:pick(await read('executions','project',id),fields.executions)};
        else if (action === 'bugs') data = {bugs:pick(await read('bugs','product',id),fields.bugs)};
        else if (action === 'sprint') {
          const names = ['stories','tasks','bugs'];
          const results = await Promise.allSettled(names.map(n=>read(n,'execution',id)));
          data = {warnings:[]};
          results.forEach((r,i)=>{const n=names[i]; if(r.status==='fulfilled')data[n]=pick(r.value,fields[n]);else {data[n]=null;data.warnings.push(n+'：读取失败，未计入统计');}});
        } else return send(400,{error:'查询类型无效'});
        send(200,{...data,readAt:new Date().toISOString(),cacheSeconds:CACHE_TTL_MS/1000});
      } catch(e) {send(502,{error:e.message});}
    }
  }));
}
