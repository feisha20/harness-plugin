window.__ModuleLoader__.load({
 id:'@local/zentao-dashboard',
 factory(require){
  const React=require('react'),h=React.createElement;
  const status={doing:'进行中',wait:'未开始',suspended:'已挂起',pause:'已暂停',done:'已完成',cancel:'已取消',active:'待解决',resolved:'待验证',closed:'已关闭'};
  const who=v=>typeof v==='object'&&v?(v.realname||v.account||'未指派'):(v||'未指派');
  const age=b=>{const n=Date.parse(String(b.openedDate).replace(' ','T')+'+08:00');return Number.isFinite(n)?Math.max(0,Math.floor((Date.now()-n)/86400000)):null;};
  function tasks(a){if(!a)return null;const parents=new Set(a.filter(x=>Number(x.parent)>0).map(x=>String(x.parent)));return a.filter(x=>x.status!=='cancel'&&!['1','true'].includes(String(x.isParent))&&!parents.has(String(x.id)));}
  const css=`
.zq{--zq-accent:var(--dsw-alias-brand-primary);height:100%;overflow:auto;padding:16px 20px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:13px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-sizing:border-box;font-variant-numeric:tabular-nums}
.zq *{box-sizing:border-box}.zq header,.zq .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.zq header{justify-content:space-between;margin-bottom:16px}.zq .identity{display:flex;align-items:center;gap:10px}.zq .identity-mark{width:36px;height:36px;display:grid;place-items:center;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);color:var(--zq-accent)}
.zq h1{font-size:19px;letter-spacing:-.5px;font-weight:650;margin:0}.zq h2{font-size:14px;font-weight:650;letter-spacing:.1px;margin:0}.zq p{margin:4px 0}.zq .muted{font-size:11px;color:var(--dsw-alias-label-secondary)}
.zq button,.zq input,.zq select{font:inherit;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;padding:5px 9px;background:var(--dsw-alias-bg-layer-1);color:inherit;min-height:29px}.zq button{cursor:pointer;transition:background .15s,border-color .15s}.zq button:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-border-l2)}.zq button:disabled{opacity:.45;cursor:default}.zq :focus-visible{outline:2px solid var(--zq-accent);outline-offset:2px}.zq input{min-width:220px}.zq select{max-width:230px}
.zq .refresh{display:flex;align-items:center;gap:6px;font-weight:550}.zq .metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:12px 0 8px}.zq .metric{position:relative;display:grid;grid-template-columns:1fr auto;gap:5px 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;padding:13px 15px;background:var(--dsw-alias-bg-layer-1)}.zq .metric-label{font-size:12px;color:var(--dsw-alias-label-secondary);font-weight:500}.zq .metric-icon{width:28px;height:28px;display:grid;place-items:center;grid-column:2;grid-row:1 / span 2;background:var(--dsw-alias-bg-layer-2);border-radius:8px;color:var(--zq-accent)}.zq .number{font-size:29px;line-height:1.1;letter-spacing:-1px;font-weight:650}.zq .metric small{font-size:10px;grid-column:1/-1;color:var(--dsw-alias-label-secondary)}
.zq .warn{color:var(--dsw-alias-state-warn-primary)}.zq .error{color:var(--dsw-alias-state-error-primary)}.zq .signal-strip{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin:8px 2px 15px;font-size:11px;color:var(--dsw-alias-label-secondary)}.zq .signal-strip span{display:flex;gap:6px;align-items:center}.zq .signal-strip strong{font-size:12px;color:var(--dsw-alias-label-primary)}
.zq section{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);margin:12px 0;overflow:hidden;padding:0 12px 9px}.zq .section-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:12px 1px 10px}.zq .section-title{display:flex;align-items:center;gap:8px}.zq .section-title svg{color:var(--dsw-alias-label-secondary)}.zq .count{font-size:10px;padding:1px 6px;min-width:22px;text-align:center;border-radius:5px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary)}
.zq .notice{padding:10px 12px;background:var(--dsw-alias-bg-layer-2);border-radius:6px;margin:10px 0}.zq .scroll{overflow:auto}.zq table{width:100%;border-collapse:separate;border-spacing:0;text-align:left}.zq td,.zq th{padding:8px 9px;border-bottom:1px solid var(--dsw-alias-border-l1);vertical-align:middle}.zq th{background:var(--dsw-alias-bg-layer-2);font-size:11px;font-weight:550;white-space:nowrap;color:var(--dsw-alias-label-secondary);padding-top:7px;padding-bottom:7px}.zq th:first-child{border-radius:5px 0 0 5px}.zq th:last-child{border-radius:0 5px 5px 0}.zq tbody tr:last-child td{border-bottom:0}.zq tbody tr:hover{background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 65%,var(--dsw-alias-bg-layer-1))}.zq td:first-child{min-width:250px}.zq td>.muted{margin-top:3px;line-height:1.3}.zq a{color:var(--dsw-alias-label-primary);text-decoration:none;font-weight:500}.zq a:hover{color:var(--zq-accent);text-decoration:underline;text-underline-offset:3px}
.zq .progress{width:120px;max-width:100%;font-size:11px}.zq .progress-label{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}.zq .progress-label small{font-size:10px;color:var(--dsw-alias-label-secondary)}.zq .bar{height:4px;background:var(--dsw-alias-bg-layer-2);border-radius:3px;overflow:hidden}.zq .bar i{display:block;height:100%;background:var(--zq-accent);border-radius:3px}.zq .progress.complete .bar i{background:var(--dsw-alias-state-success-primary)}
.zq .badge{display:inline-flex;align-items:center;gap:5px;font-size:11px;padding:3px 7px;line-height:1.2;border-radius:5px;white-space:nowrap;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary)}.zq .badge::before{content:"";height:4px;width:4px;border-radius:50%;background:currentColor}.zq .badge.doing,.zq .badge.resolved{color:var(--zq-accent);background:color-mix(in srgb,var(--zq-accent) 7%,var(--dsw-alias-bg-layer-1))}.zq .badge.active,.zq .badge.delayed{color:var(--dsw-alias-state-warn-primary);background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 9%,var(--dsw-alias-bg-layer-1))}.zq .badge.closed,.zq .badge.ontrack{color:var(--dsw-alias-state-success-primary);background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 8%,var(--dsw-alias-bg-layer-1))}
.zq .priority{display:inline-block;font-size:11px;font-weight:600;padding:2px 6px;border-radius:4px;background:var(--dsw-alias-bg-layer-2)}.zq .priority.high{color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 8%,var(--dsw-alias-bg-layer-1))}.zq .subtle{border-color:transparent;background:transparent;color:var(--dsw-alias-label-secondary);font-size:11px}.zq .toolbar{display:flex;align-items:center;gap:7px;flex-wrap:wrap;padding:0 1px 8px}.zq .result-line{display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:1px 1px 9px;font-size:11px;color:var(--dsw-alias-label-secondary)}.zq .result-line .total{margin-left:auto}
.zq .pagination{display:flex;justify-content:flex-end;align-items:center;gap:10px;border-top:1px solid var(--dsw-alias-border-l1);padding-top:8px;font-size:11px;color:var(--dsw-alias-label-secondary)}.zq .pagination button{font-size:11px;min-height:25px;padding:3px 7px}.zq .empty{padding:25px;text-align:center;color:var(--dsw-alias-label-secondary)}.zq .footer{justify-content:space-between;padding:2px 2px 6px}.zq details{position:relative}.zq summary{cursor:pointer}.zq details[open]{max-width:100%}
@media(max-width:1000px){.zq{padding:12px}.zq .metric{padding:11px}.zq .progress{width:95px}.zq td,.zq th{padding:7px}.zq .number{font-size:26px}}
@media(max-width:700px){.zq .metrics{grid-template-columns:repeat(2,1fr)}.zq header{align-items:flex-start}.zq .section-head{gap:7px}.zq .toolbar input{flex:1;min-width:180px}.zq .scroll table{min-width:780px}}
@media(prefers-reduced-motion:reduce){.zq button{transition:none}}
`;
  function Glyph({kind='overview',size=16}) {
   const paths={overview:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',risk:'M12 3 2 21h20L12 3z M12 9v5 M12 17v1',bug:'M8 8h8v9a4 4 0 0 1-8 0V8z M9 8V6a3 3 0 0 1 6 0v2 M3 10h5 M16 10h5 M3 16h5 M16 16h5',online:'M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3z M8 12l3 3 5-6',refresh:'M20 7v5h-5 M4 17v-5h5 M6 7a7 7 0 0 1 12-2l2 3 M4 16l2 3a7 7 0 0 0 12-2'};
   return h('svg',{width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.5,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},h('path',{d:paths[kind]||paths.overview}));
  }
  function Icon({size=20}){return h('svg',{width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.7,'aria-hidden':true},h('rect',{x:3,y:3,width:18,height:18,rx:4}),h('path',{d:'M7 8h10M7 12h4M7 16h4m3-2 2 2 3-4'}));}
  return {inject:['slots','locale'],apply(ctx){
   const text=['禅道质量看板','全局总览 · 仅关注未关闭冲刺','刷新全局','正在汇总全部冲刺…','汇总失败，保留上次成功数据','未关闭冲刺','延期冲刺','未关闭缺陷','线上待处理','待验证','高优先级未关闭','超过7天未解决','数据覆盖不完整，以下数字仅来自已成功读取的范围','跨项目冲刺总览','全部冲刺同时展示，延期优先；无需切换冲刺。','冲刺 / 项目','状态','计划截止','需求关闭','任务完成','待解决 / 待验证','风险','未评估','无数据','延期','分项读取失败','暂无未关闭冲刺','最近30天线上问题','仅展示未关闭冲刺内、最近30天创建且线上标记为1的问题，包含已关闭记录。','全部待处理','线上标记','标题候选','全部状态','全部创建人','搜索编号、标题或冲刺','问题 / 所属冲刺','优先级','创建日期','问题龄期','未指派','条','前一页','后一页','当前无匹配问题','首次汇总需要读取全部项目和未关闭冲刺，请稍候。','数据更新时间','缓存10分钟；需求关闭率不等同于交付验收，任务排除取消与父任务。','全部项目','未知','正常','部分数据','重试','待解决','已关闭','当前筛选','创建人','操作','忽略','已忽略','取消忽略','保存中…'];
   const dict=Object.fromEntries(text.map(x=>[x,x]));
    for(const label of ['关注范围','仅显示关注冲刺','需跟进计划','待解决与待验证','当前关注范围内','线上问题（近30天）','含已忽略冲刺','筛选','统计口径','更新'])dict[label]=label;
    dict['全部未关闭冲刺内最近30天创建的线上问题，包含已忽略冲刺及已关闭问题。']='全部未关闭冲刺内最近30天创建的线上问题，包含已忽略冲刺及已关闭问题。';
   ctx.effect(()=>ctx.locale.register('zentaoDashboard','zh',dict));ctx.effect(()=>ctx.locale.register('zentaoDashboard','en',dict));
   const t=ctx.locale.bind('zentaoDashboard');
   function App(){
    React.useSyncExternalStore(ctx.locale.subscribe.bind(ctx.locale),ctx.locale.getSnapshot.bind(ctx.locale));
    const [data,D]=React.useState(null),[error,F]=React.useState(''),[busy,L]=React.useState(true),[version,V]=React.useState(0);
    const [saving,Z]=React.useState(false),[showIgnored,H]=React.useState(false);
    async function changeIgnore(s,ignored) { Z(true);F('');try {const r=await fetch('/api/zentao-dashboard?action=ignore',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:String(s.id),name:s.name||'',projectName:s.projectName||'',ignored})});const result=await r.json();if(!r.ok)throw Error(result.error);V(v=>v+1);}catch(e){F(e.message);}finally{Z(false);} }
    const [state,S]=React.useState(''),[owner,O]=React.useState(''),[query,Q]=React.useState(''),[page,P]=React.useState(0);
    React.useEffect(()=>{const c=new AbortController();L(true);F('');fetch('/api/zentao-dashboard?action=global',{signal:c.signal}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||'读取失败');return d;}).then(D).catch(e=>{if(e.name!=='AbortError')F(e.message)}).finally(()=>{if(!c.signal.aborted)L(false)});return()=>c.abort();},[version]);
    React.useEffect(()=>P(0),[state,owner,query]);
    const sprints=data?.sprints||[],summary=data?.summary||{};
    const base=data?.recentOnline?.items||[];
    const owners=[...new Set(base.map(b=>(b.creatorName||'姓名未获取')))].sort();
    const bugs=base.filter(b=>(!state||b.status===state)&&(!owner||(b.creatorName||'姓名未获取')===owner)&&(!query||(b.id+' '+b.title+' '+b.sprintName+' '+b.projectName).toLowerCase().includes(query.toLowerCase()))).sort((a,b)=>(Number(a.pri)||9)-(Number(b.pri)||9)||String(a.openedDate).localeCompare(String(b.openedDate)));
    const today=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'});
    const delayed=s=>/^\d{4}-\d{2}-\d{2}$/.test(s.end)&&s.end!=='0000-00-00'&&s.end<today;
    function progress(a,pred){if(!a)return t('未评估');const n=a.filter(pred).length,pct=a.length?Math.round(100*n/a.length):0;return h('div',{className:'progress'+(pct===100?' complete':'')},h('div',{className:'progress-label'},h('span',null,n+' / '+a.length),h('small',null,a.length?pct+'%':'—')),h('div',{className:'bar',role:'progressbar','aria-valuemin':0,'aria-valuemax':100,'aria-valuenow':pct,'aria-label':n+' / '+a.length},h('i',{style:{width:pct+'%'}})));}
    const metric=(label,key,cls='')=>h('div',{className:'metric',key},h('div',{className:'metric-label'},t(label)),h('span',{className:'metric-icon '+cls},h(Glyph,{kind:({sprints:'overview',delayed:'risk',openBugs:'bug',onlineOpen:'online'})[key]})),h('div',{className:'number '+cls},data?summary[key]:'—'),h('small',null,t(({sprints:'仅显示关注冲刺',delayed:'需跟进计划',openBugs:'待解决与待验证',onlineOpen:'当前关注范围内'})[key])));
    return h('div',{className:'zq'},h('style',null,css),
     h('header',null,h('div',{className:'identity'},h('span',{className:'identity-mark'},h(Glyph,{kind:'online',size:22})),h('div',null,h('h1',null,t('禅道质量看板')),h('p',{className:'muted'},t('全局总览 · 仅关注未关闭冲刺')))),h('button',{className:'refresh',disabled:busy||saving,onClick:()=>V(v=>v+1)},h(Glyph,{kind:'refresh',size:14}),t(busy?'正在汇总全部冲刺…':'刷新全局'))),
     error&&h('div',{className:'notice error',role:'alert'},t('汇总失败，保留上次成功数据')+'：'+error,h('button',{onClick:()=>V(v=>v+1)},t('重试'))),
     busy&&!data&&h('div',{className:'notice',role:'status'},t('首次汇总需要读取全部项目和未关闭冲刺，请稍候。')),
     data&&!data.complete&&h('div',{className:'notice warn',role:'alert'},t('数据覆盖不完整，以下数字仅来自已成功读取的范围'),...(data.warnings||[]).map((x,i)=>h('div',{key:i},x))),
     h('div',{className:'metrics'},metric('未关闭冲刺','sprints'),metric('延期冲刺','delayed','warn'),metric('未关闭缺陷','openBugs'),metric('线上待处理','onlineOpen','error')),
     h('div',{className:'signal-strip'},...[['待验证','pendingVerification'],['高优先级未关闭','highPriority'],['超过7天未解决','aging']].map(([label,key])=>h('span',{key},t(label),h('strong',null,data?summary[key]:'—')))),
     h('section',null,h('div',{className:'section-head'},h('div',{className:'section-title'},h(Glyph,{kind:'overview'}),h('h2',null,t('跨项目冲刺总览')),h('span',{className:'count'},sprints.length)),h('button',{className:'subtle',onClick:()=>H(v=>!v),'aria-expanded':showIgnored},t('已忽略')+' ('+(data?.ignoredSprints?.length||0)+')')),
      showIgnored&&h('div',{className:'notice'},...(data?.ignoredSprints||[]).map(s=>h('div',{className:'row',key:s.id},h('span',null,(s.projectName?s.projectName+' / ':'')+(s.name||'#'+s.id)),h('button',{disabled:saving||busy,onClick:()=>changeIgnore(s,false)},t('取消忽略'))))),
      h('div',{className:'scroll'},h('table',null,h('thead',null,h('tr',null,...['冲刺 / 项目','状态','计划截止','需求关闭','任务完成','待解决 / 待验证','风险','操作'].map(x=>h('th',{key:x},t(x))))),
       h('tbody',null,...sprints.map(s=>h('tr',{key:s.id},
        h('td',null,h('a',{href:'http://pm.kuaishang.cn/zentao/execution-view-'+s.id+'.html',target:'_blank',rel:'noopener noreferrer'},s.name),h('div',{className:'muted'},s.projectName)),
        h('td',null,h('span',{className:'badge '+s.status},status[s.status]||s.status)),h('td',{className:delayed(s)?'warn':''},s.end==='0000-00-00'?'—':s.end||'—'),
        h('td',null,progress(s.stories,b=>b.status==='closed')),h('td',null,progress(tasks(s.tasks),b=>['done','closed'].includes(b.status))),
        h('td',null,s.bugs?s.bugs.filter(b=>b.status==='active').length+' / '+s.bugs.filter(b=>b.status==='resolved').length:t('未评估')),
        h('td',null,delayed(s)&&h('div',{className:'badge delayed'},t('延期')),s.warnings.length?h('div',{className:'error'},s.warnings.join('；')):!delayed(s)&&h('span',{className:'badge ontrack'},t('正常'))),
        h('td',null,h('button',{className:'subtle',disabled:saving||busy,onClick:()=>changeIgnore(s,true),'aria-label':t('忽略')+' '+s.name},t(saving?'保存中…':'忽略')))
       ))))),
      !busy&&!sprints.length&&h('div',{className:'empty'},t('暂无未关闭冲刺'))),
       h('section',null,h('div',{className:'section-head'},h('div',{className:'section-title'},h(Glyph,{kind:'online'}),h('h2',null,t('线上问题（近30天）')),h('span',{className:'count'},base.length)),h('span',{className:'muted'},t('含已忽略冲刺'),data?.recentOnline&&' · '+data.recentOnline.from+' — '+data.recentOnline.to)),
      h('div',{className:'toolbar'},
       h('input',{value:query,onChange:e=>Q(e.target.value),placeholder:t('搜索编号、标题或冲刺'),'aria-label':t('搜索编号、标题或冲刺')}),
       h('select',{value:state,onChange:e=>S(e.target.value),'aria-label':t('状态')},h('option',{value:''},t('全部状态')),...['active','resolved','closed'].map(v=>h('option',{key:v,value:v},status[v]))),
       h('select',{value:owner,onChange:e=>O(e.target.value),'aria-label':t('创建人')},h('option',{value:''},t('全部创建人')),...owners.map(v=>h('option',{key:v,value:v},v)))),
       h('div',{className:'result-line'},...['active','resolved','closed'].map(v=>h('span',{key:v,className:'badge '+v},status[v]+' '+base.filter(b=>b.status===v).length)),h('span',{className:'total'},t('筛选')+' '+bugs.length+' / '+base.length)),
      h('div',{className:'scroll'},h('table',null,h('thead',null,h('tr',null,...['问题 / 所属冲刺','状态','创建人','优先级','创建日期','问题龄期'].map(v=>h('th',{key:v},t(v))))),
       h('tbody',null,...bugs.slice(page*30,page*30+30).map(b=>h('tr',{key:b.id},
         h('td',null,h('a',{href:'http://pm.kuaishang.cn/zentao/bug-view-'+b.id+'.html',target:'_blank',rel:'noopener noreferrer'},'#'+b.id+' '+b.title),h('div',{className:'muted'},b.projectName+' / '+b.sprintName)),
        h('td',null,h('span',{className:'badge '+b.status},status[b.status]||b.status)),h('td',null,(b.creatorName||'姓名未获取')),h('td',null,h('span',{className:'priority'+(Number(b.pri)>0&&Number(b.pri)<=2?' high':'')},'P'+b.pri)),
        h('td',null,String(b.openedDate).slice(0,10)),h('td',{className:b.status==='active'&&age(b)>7?'warn':''},age(b)===null?'—':age(b)+'天')
       ))))),
      !busy&&!bugs.length&&h('div',{className:'empty'},t('当前无匹配问题')),
      h('div',{className:'pagination'},h('button',{disabled:!page,onClick:()=>P(p=>p-1)},t('前一页')),h('span',null,(page+1)+' / '+Math.max(1,Math.ceil(bugs.length/30))),h('button',{disabled:(page+1)*30>=bugs.length,onClick:()=>P(p=>p+1)},t('后一页')))),
      h('div',{className:'row muted footer'},data&&h('span',null,t('更新')+' '+new Date(data.readAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})),h('details',null,h('summary',null,t('统计口径')),data&&h('p',null,data.scope),h('p',null,t('缓存10分钟；需求关闭率不等同于交付验收，任务排除取消与父任务。'))))
    );
   }
   ctx.slots.inject('main',()=>ctx.slots.register({name:'main',key:'zentao-quality'},App));
   ctx.slots.inject('sidebar.panellist',()=>ctx.slots.register({name:'sidebar.panellist',id:'zentao-quality',order:16,label:()=>t('禅道质量看板')},Icon));
  }};
 }
});
