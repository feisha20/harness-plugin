window.__ModuleLoader__.load({
 id:'@local/zentao-dashboard',
 factory(require){
  const React=require('react'),h=React.createElement;
  const status={
    doing:'进行中',wait:'未开始',suspended:'已挂起',pause:'已暂停',done:'已完成',cancel:'已取消',
    active:'待解决',resolved:'待验证',closed:'已关闭',draft:'草稿',changed:'已变更',reviewing:'评审中'
  };
  const storyStages={
    wait:'未开始',planned:'已计划',projected:'已立项',developing:'研发中',developed:'研发完毕',
    testing:'测试中',tested:'测试完毕',verified:'已验收',released:'已发布',closed:'已关闭'
  };
  const who=v=>typeof v==='object'&&v?(v.realname||v.account||'未指派'):(v||'未指派');
  const age=b=>{const n=Date.parse(String(b.openedDate||'').replace(' ','T')+'+08:00');return Number.isFinite(n)?Math.max(0,Math.floor((Date.now()-n)/86400000)):null;};
  const isOnlineFlag=b=>['1','true'].includes(String(b.onlineIssue));
  const collator=new Intl.Collator('zh-CN',{numeric:true,sensitivity:'base'});
  function tasks(a){
    if(!a)return null;
    const parents=new Set(a.filter(x=>Number(x.parent)>0).map(x=>String(x.parent)));
    return a.filter(x=>x.status!=='cancel'&&!['1','true'].includes(String(x.isParent))&&!parents.has(String(x.id)));
  }
  function diffDays(endStr,todayStr){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(endStr||'')||endStr==='0000-00-00')return null;
    const endMs=Date.parse(endStr+'T00:00:00+08:00');
    const todayMs=Date.parse(todayStr+'T00:00:00+08:00');
    if(!Number.isFinite(endMs)||!Number.isFinite(todayMs))return null;
    return Math.round((endMs-todayMs)/86400000);
  }
  function formatTime(iso){
    if(!iso)return '—';
    const d=new Date(iso);
    if(Number.isNaN(d.getTime()))return '—';
    return d.toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false});
  }

  const css=`
.zq {
  --zq-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif;

  /* 1. Light palette tokens (default) */
  --zq-canvas-light: color-mix(in oklab, var(--dsw-alias-bg-base, #f5f4f0) 96%, #64748b);
  --zq-card-light: #ffffff;
  --zq-surface-light: #f6f8fb;
  --zq-surface-hover-light: #eef2f7;
  --zq-border-light: rgb(15 23 42 / 0.09);
  --zq-border-strong-light: rgb(15 23 42 / 0.16);
  --zq-text-1-light: #0f172a;
  --zq-text-2-light: #475569;
  --zq-text-muted-light: #526075;

  --zq-accent-light: #2563eb;
  --zq-accent-text-light: #1d4ed8;
  --zq-accent-soft-light: #eff6ff;
  --zq-accent-border-light: #bfdbfe;

  --zq-info-light: #7c3aed;
  --zq-info-text-light: #6d28d9;
  --zq-info-soft-light: #f5f3ff;
  --zq-info-border-light: #ddd6fe;

  --zq-warn-light: #d97706;
  --zq-warn-text-light: #b45309;
  --zq-warn-soft-light: #fffbeb;
  --zq-warn-border-light: #fde68a;

  --zq-danger-light: #dc2626;
  --zq-danger-text-light: #b91c1c;
  --zq-danger-soft-light: #fef2f2;
  --zq-danger-border-light: #fecaca;

  --zq-success-light: #059669;
  --zq-success-text-light: #047857;
  --zq-success-soft-light: #ecfdf5;
  --zq-success-border-light: #a7f3d0;

  /* 2. Dark palette tokens */
  --zq-canvas-dark: #111318;
  --zq-card-dark: #1a1d26;
  --zq-surface-dark: #222632;
  --zq-surface-hover-dark: #2a2f3d;
  --zq-border-dark: rgb(255 255 255 / 0.10);
  --zq-border-strong-dark: rgb(255 255 255 / 0.18);
  --zq-text-1-dark: #f1f5f9;
  --zq-text-2-dark: #94a3b8;
  --zq-text-muted-dark: #94a3b8;

  --zq-accent-dark: #60a5fa;
  --zq-accent-text-dark: #93c5fd;
  --zq-accent-soft-dark: rgb(37 99 235 / 0.16);
  --zq-accent-border-dark: rgb(96 165 250 / 0.34);

  --zq-info-dark: #a78bfa;
  --zq-info-text-dark: #c4b5fd;
  --zq-info-soft-dark: rgb(124 58 237 / 0.16);
  --zq-info-border-dark: rgb(167 139 250 / 0.34);

  --zq-warn-dark: #f59e0b;
  --zq-warn-text-dark: #fcd34d;
  --zq-warn-soft-dark: rgb(217 119 6 / 0.16);
  --zq-warn-border-dark: rgb(245 158 11 / 0.34);

  --zq-danger-dark: #f87171;
  --zq-danger-text-dark: #fca5a5;
  --zq-danger-soft-dark: rgb(220 38 38 / 0.16);
  --zq-danger-border-dark: rgb(248 113 113 / 0.34);

  --zq-success-dark: #34d399;
  --zq-success-text-dark: #6ee7b7;
  --zq-success-soft-dark: rgb(5 150 105 / 0.16);
  --zq-success-border-dark: rgb(52 211 153 / 0.34);

  /* Active assignments (default light) */
  --zq-canvas: var(--zq-canvas-light);
  --zq-card: var(--zq-card-light);
  --zq-surface: var(--zq-surface-light);
  --zq-surface-hover: var(--zq-surface-hover-light);
  --zq-border: var(--zq-border-light);
  --zq-border-strong: var(--zq-border-strong-light);
  --zq-text-1: var(--zq-text-1-light);
  --zq-text-2: var(--zq-text-2-light);
  --zq-text-muted: var(--zq-text-muted-light);

  --zq-accent: var(--zq-accent-light);
  --zq-accent-text: var(--zq-accent-text-light);
  --zq-accent-soft: var(--zq-accent-soft-light);
  --zq-accent-border: var(--zq-accent-border-light);

  --zq-info: var(--zq-info-light);
  --zq-info-text: var(--zq-info-text-light);
  --zq-info-soft: var(--zq-info-soft-light);
  --zq-info-border: var(--zq-info-border-light);

  --zq-warn: var(--zq-warn-light);
  --zq-warn-text: var(--zq-warn-text-light);
  --zq-warn-soft: var(--zq-warn-soft-light);
  --zq-warn-border: var(--zq-warn-border-light);

  --zq-danger: var(--zq-danger-light);
  --zq-danger-text: var(--zq-danger-text-light);
  --zq-danger-soft: var(--zq-danger-soft-light);
  --zq-danger-border: var(--zq-danger-border-light);

  --zq-success: var(--zq-success-light);
  --zq-success-text: var(--zq-success-text-light);
  --zq-success-soft: var(--zq-success-soft-light);
  --zq-success-border: var(--zq-success-border-light);

  --zq-shadow-sm: 0 1px 2px rgb(15 23 42 / 0.04);
  --zq-shadow: 0 1px 3px rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.04);
  --zq-shadow-md: 0 6px 16px -4px rgb(15 23 42 / 0.10), 0 2px 6px -2px rgb(15 23 42 / 0.05);
  --zq-shadow-lg: 0 16px 36px -8px rgb(15 23 42 / 0.18), 0 4px 12px -4px rgb(15 23 42 / 0.08);
  --zq-radius-lg: 12px;
  --zq-radius-md: 10px;
  --zq-radius-sm: 7px;

  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  container: zq-root / inline-size;
  background: var(--zq-canvas);
  color: var(--zq-text-1);
  font: 13px/1.45 var(--zq-font);
  font-variant-numeric: tabular-nums;
  -webkit-font-smoothing: antialiased;
}

@media (prefers-color-scheme: dark) {
  .zq {
    --zq-canvas: var(--zq-canvas-dark);
    --zq-card: var(--zq-card-dark);
    --zq-surface: var(--zq-surface-dark);
    --zq-surface-hover: var(--zq-surface-hover-dark);
    --zq-border: var(--zq-border-dark);
    --zq-border-strong: var(--zq-border-strong-dark);
    --zq-text-1: var(--zq-text-1-dark);
    --zq-text-2: var(--zq-text-2-dark);
    --zq-text-muted: var(--zq-text-muted-dark);
    --zq-accent: var(--zq-accent-dark);
    --zq-accent-text: var(--zq-accent-text-dark);
    --zq-accent-soft: var(--zq-accent-soft-dark);
    --zq-accent-border: var(--zq-accent-border-dark);
    --zq-info: var(--zq-info-dark);
    --zq-info-text: var(--zq-info-text-dark);
    --zq-info-soft: var(--zq-info-soft-dark);
    --zq-info-border: var(--zq-info-border-dark);
    --zq-warn: var(--zq-warn-dark);
    --zq-warn-text: var(--zq-warn-text-dark);
    --zq-warn-soft: var(--zq-warn-soft-dark);
    --zq-warn-border: var(--zq-warn-border-dark);
    --zq-danger: var(--zq-danger-dark);
    --zq-danger-text: var(--zq-danger-text-dark);
    --zq-danger-soft: var(--zq-danger-soft-dark);
    --zq-danger-border: var(--zq-danger-border-dark);
    --zq-success: var(--zq-success-dark);
    --zq-success-text: var(--zq-success-text-dark);
    --zq-success-soft: var(--zq-success-soft-dark);
    --zq-success-border: var(--zq-success-border-dark);
    --zq-shadow-sm: 0 1px 2px rgb(0 0 0 / 0.25);
    --zq-shadow: 0 2px 6px rgb(0 0 0 / 0.30);
    --zq-shadow-md: 0 8px 20px rgb(0 0 0 / 0.40);
    --zq-shadow-lg: 0 20px 44px rgb(0 0 0 / 0.55);
  }
}

:is(.dark, [data-theme="dark"]) .zq {
  color-scheme: dark;
  --zq-canvas: var(--zq-canvas-dark);
  --zq-card: var(--zq-card-dark);
  --zq-surface: var(--zq-surface-dark);
  --zq-surface-hover: var(--zq-surface-hover-dark);
  --zq-border: var(--zq-border-dark);
  --zq-border-strong: var(--zq-border-strong-dark);
  --zq-text-1: var(--zq-text-1-dark);
  --zq-text-2: var(--zq-text-2-dark);
  --zq-text-muted: var(--zq-text-muted-dark);
  --zq-accent: var(--zq-accent-dark);
  --zq-accent-text: var(--zq-accent-text-dark);
  --zq-accent-soft: var(--zq-accent-soft-dark);
  --zq-accent-border: var(--zq-accent-border-dark);
  --zq-info: var(--zq-info-dark);
  --zq-info-text: var(--zq-info-text-dark);
  --zq-info-soft: var(--zq-info-soft-dark);
  --zq-info-border: var(--zq-info-border-dark);
  --zq-warn: var(--zq-warn-dark);
  --zq-warn-text: var(--zq-warn-text-dark);
  --zq-warn-soft: var(--zq-warn-soft-dark);
  --zq-warn-border: var(--zq-warn-border-dark);
  --zq-danger: var(--zq-danger-dark);
  --zq-danger-text: var(--zq-danger-text-dark);
  --zq-danger-soft: var(--zq-danger-soft-dark);
  --zq-danger-border: var(--zq-danger-border-dark);
  --zq-success: var(--zq-success-dark);
  --zq-success-text: var(--zq-success-text-dark);
  --zq-success-soft: var(--zq-success-soft-dark);
  --zq-success-border: var(--zq-success-border-dark);
}

@supports (color: light-dark(white, black)) {
  .zq {
    --zq-canvas: light-dark(var(--zq-canvas-light), var(--zq-canvas-dark));
    --zq-card: light-dark(var(--zq-card-light), var(--zq-card-dark));
    --zq-surface: light-dark(var(--zq-surface-light), var(--zq-surface-dark));
    --zq-surface-hover: light-dark(var(--zq-surface-hover-light), var(--zq-surface-hover-dark));
    --zq-border: light-dark(var(--zq-border-light), var(--zq-border-dark));
    --zq-border-strong: light-dark(var(--zq-border-strong-light), var(--zq-border-strong-dark));
    --zq-text-1: light-dark(var(--zq-text-1-light), var(--zq-text-1-dark));
    --zq-text-2: light-dark(var(--zq-text-2-light), var(--zq-text-2-dark));
    --zq-text-muted: light-dark(var(--zq-text-muted-light), var(--zq-text-muted-dark));
    --zq-accent: light-dark(var(--zq-accent-light), var(--zq-accent-dark));
    --zq-accent-text: light-dark(var(--zq-accent-text-light), var(--zq-accent-text-dark));
    --zq-accent-soft: light-dark(var(--zq-accent-soft-light), var(--zq-accent-soft-dark));
    --zq-accent-border: light-dark(var(--zq-accent-border-light), var(--zq-accent-border-dark));
    --zq-info: light-dark(var(--zq-info-light), var(--zq-info-dark));
    --zq-info-text: light-dark(var(--zq-info-text-light), var(--zq-info-text-dark));
    --zq-info-soft: light-dark(var(--zq-info-soft-light), var(--zq-info-soft-dark));
    --zq-info-border: light-dark(var(--zq-info-border-light), var(--zq-info-border-dark));
    --zq-warn: light-dark(var(--zq-warn-light), var(--zq-warn-dark));
    --zq-warn-text: light-dark(var(--zq-warn-text-light), var(--zq-warn-text-dark));
    --zq-warn-soft: light-dark(var(--zq-warn-soft-light), var(--zq-warn-soft-dark));
    --zq-warn-border: light-dark(var(--zq-warn-border-light), var(--zq-warn-border-dark));
    --zq-danger: light-dark(var(--zq-danger-light), var(--zq-danger-dark));
    --zq-danger-text: light-dark(var(--zq-danger-text-light), var(--zq-danger-text-dark));
    --zq-danger-soft: light-dark(var(--zq-danger-soft-light), var(--zq-danger-soft-dark));
    --zq-danger-border: light-dark(var(--zq-danger-border-light), var(--zq-danger-border-dark));
    --zq-success: light-dark(var(--zq-success-light), var(--zq-success-dark));
    --zq-success-text: light-dark(var(--zq-success-text-light), var(--zq-success-text-dark));
    --zq-success-soft: light-dark(var(--zq-success-soft-light), var(--zq-success-soft-dark));
    --zq-success-border: light-dark(var(--zq-success-border-light), var(--zq-success-border-dark));
  }
}

.zq *, .zq *::before, .zq *::after { box-sizing: border-box; }
.zq h1, .zq h2, .zq h3, .zq p { margin: 0; }
.zq :where(a, button, input, select, textarea, summary, [tabindex]):focus-visible {
  outline: 2px solid var(--zq-accent);
  outline-offset: 2px;
}

.zq .sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

/* Sticky Topbar */
.zq .zq-topbar {
  flex: none;
  background: var(--zq-card);
  border-bottom: 1px solid var(--zq-border);
  box-shadow: var(--zq-shadow-sm);
  z-index: 10;
}
.zq .zq-topbar-inner {
  width: 100%;
  padding: 12px clamp(16px, 2cqi, 28px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.zq .identity {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}
.zq .identity-mark {
  width: 36px;
  height: 36px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: var(--zq-accent-soft);
  border: 1px solid var(--zq-accent-border);
  color: var(--zq-accent);
}
.zq .identity h1 {
  font-size: 16.5px;
  font-weight: 700;
  letter-spacing: -0.25px;
  color: var(--zq-text-1);
  line-height: 1.25;
}
.zq .sub-title {
  font-size: 12px;
  color: var(--zq-text-2);
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.zq .sync-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 1px 7px;
  border-radius: 9999px;
  background: var(--zq-accent-soft);
  border: 1px solid var(--zq-accent-border);
  color: var(--zq-accent-text);
  font-size: 11px;
  font-weight: 550;
}
.zq .topbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* Main Scrollable Canvas */
.zq .zq-scroll {
  flex: 1;
  min-block-size: 0;
  overflow-y: auto;
  scrollbar-gutter: stable;
  overscroll-behavior: contain;
}
.zq .zq-shell {
  width: 100%;
  padding: 16px clamp(16px, 2cqi, 28px) 32px;
  display: grid;
  gap: 14px;
  align-content: start;
}

/* Buttons */
.zq .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 560;
  line-height: 1;
  padding: 7px 12px;
  min-height: 32px;
  border-radius: var(--zq-radius-sm);
  border: 1px solid var(--zq-border-strong);
  background: var(--zq-card);
  color: var(--zq-text-1);
  box-shadow: var(--zq-shadow-sm);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  transition: background 0.15s ease-out, border-color 0.15s ease-out, box-shadow 0.15s ease-out, scale 0.12s ease-out, color 0.15s ease-out;
}
.zq .btn:hover:not(:disabled) {
  background: var(--zq-surface);
  border-color: var(--zq-accent-border);
  color: var(--zq-accent-text);
  box-shadow: var(--zq-shadow);
}
.zq .btn:active:not(:disabled) {
  scale: 0.97;
}
.zq .btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.zq .btn-primary {
  background: var(--zq-accent);
  border-color: var(--zq-accent);
  color: #ffffff;
}
.zq .btn-primary:hover:not(:disabled) {
  background: color-mix(in oklab, var(--zq-accent) 88%, #000);
  border-color: color-mix(in oklab, var(--zq-accent) 88%, #000);
  color: #ffffff;
}
.zq .btn-soft {
  background: var(--zq-surface);
  border-color: var(--zq-border);
  box-shadow: none;
  color: var(--zq-text-1);
  padding: 5px 10px;
  min-height: 28px;
  font-size: 12px;
}
.zq .btn-soft:hover:not(:disabled) {
  background: var(--zq-accent-soft);
  border-color: var(--zq-accent-border);
  color: var(--zq-accent-text);
}
.zq .btn-ghost {
  background: transparent;
  border-color: transparent;
  box-shadow: none;
  color: var(--zq-text-2);
  padding: 5px 9px;
  min-height: 28px;
  font-size: 12px;
}
.zq .btn-ghost:hover:not(:disabled) {
  background: var(--zq-surface);
  border-color: var(--zq-border);
  color: var(--zq-text-1);
  box-shadow: none;
}
.zq .spin {
  animation: zqSpin 0.9s linear infinite;
}
@keyframes zqSpin {
  to { transform: rotate(360deg); }
}

/* Interactive KPI Command Grid */
.zq .metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.zq .metric-card {
  position: relative;
  text-align: left;
  font-family: inherit;
  border: 1px solid var(--zq-border);
  border-radius: var(--zq-radius-md);
  padding: 12px 14px;
  background: var(--zq-card);
  box-shadow: var(--zq-shadow-sm);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
  transition: border-color 0.16s ease-out, box-shadow 0.16s ease-out, transform 0.16s ease-out, scale 0.12s ease-out, background 0.16s ease-out;
}
.zq .metric-card:hover {
  border-color: var(--zq-border-strong);
  box-shadow: var(--zq-shadow-md);
  transform: translateY(-1px);
}
.zq .metric-card:active {
  scale: 0.985;
}
.zq .metric-card[aria-pressed="true"] {
  border-color: var(--zq-accent);
  background: color-mix(in oklab, var(--zq-card) 92%, var(--zq-accent));
  box-shadow: 0 0 0 1px var(--zq-accent), var(--zq-shadow);
}
.zq .metric-card.warn[aria-pressed="true"] {
  border-color: var(--zq-warn);
  background: color-mix(in oklab, var(--zq-card) 92%, var(--zq-warn));
  box-shadow: 0 0 0 1px var(--zq-warn), var(--zq-shadow);
}
.zq .metric-card.danger[aria-pressed="true"] {
  border-color: var(--zq-danger);
  background: color-mix(in oklab, var(--zq-card) 92%, var(--zq-danger));
  box-shadow: 0 0 0 1px var(--zq-danger), var(--zq-shadow);
}
.zq .metric-card.success[aria-pressed="true"] {
  border-color: var(--zq-success);
  background: color-mix(in oklab, var(--zq-card) 92%, var(--zq-success));
  box-shadow: 0 0 0 1px var(--zq-success), var(--zq-shadow);
}
.zq .metric-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.zq .metric-label {
  font-size: 12px;
  font-weight: 560;
  color: var(--zq-text-2);
  display: flex;
  align-items: center;
  gap: 5px;
}
.zq .metric-val {
  font-size: 26px;
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: var(--zq-text-1);
}
.zq .metric-card.accent .metric-val { color: var(--zq-accent-text); }
.zq .metric-card.warn .metric-val { color: var(--zq-warn-text); }
.zq .metric-card.danger .metric-val { color: var(--zq-danger-text); }
.zq .metric-card.success .metric-val { color: var(--zq-success-text); }
.zq .metric-sub {
  font-size: 11.5px;
  color: var(--zq-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.zq .metric-icon-wrap {
  width: 34px;
  height: 34px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 9px;
  background: var(--zq-surface);
  border: 1px solid var(--zq-border);
  color: var(--zq-text-2);
}
.zq .metric-card.accent .metric-icon-wrap {
  background: var(--zq-accent-soft);
  border-color: var(--zq-accent-border);
  color: var(--zq-accent);
}
.zq .metric-card.warn .metric-icon-wrap {
  background: var(--zq-warn-soft);
  border-color: var(--zq-warn-border);
  color: var(--zq-warn);
}
.zq .metric-card.danger .metric-icon-wrap {
  background: var(--zq-danger-soft);
  border-color: var(--zq-danger-border);
  color: var(--zq-danger);
}
.zq .metric-card.success .metric-icon-wrap {
  background: var(--zq-success-soft);
  border-color: var(--zq-success-border);
  color: var(--zq-success);
}

/* Interactive Signal Strip */
.zq .signal-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 7px 12px;
  background: var(--zq-card);
  border: 1px solid var(--zq-border);
  border-radius: var(--zq-radius-md);
  box-shadow: var(--zq-shadow-sm);
}
.zq .signal-caption {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--zq-text-2);
  margin-right: 2px;
}
.zq .signal-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 9999px;
  border: 1px solid var(--zq-border);
  background: var(--zq-surface);
  color: var(--zq-text-2);
  cursor: pointer;
  transition: all 0.15s ease-out;
}
.zq .signal-pill strong {
  font-weight: 680;
  color: var(--zq-text-1);
}
.zq .signal-pill:hover {
  background: var(--zq-surface-hover);
  border-color: var(--zq-border-strong);
  color: var(--zq-text-1);
}
.zq .signal-pill:active {
  scale: 0.97;
}
.zq .signal-pill[aria-pressed="true"] {
  background: var(--zq-accent-soft);
  border-color: var(--zq-accent-border);
  color: var(--zq-accent-text);
}
.zq .signal-pill[aria-pressed="true"] strong {
  color: var(--zq-accent-text);
}
.zq .signal-pill.info[aria-pressed="true"] {
  background: var(--zq-info-soft);
  border-color: var(--zq-info-border);
  color: var(--zq-info-text);
}
.zq .signal-pill.info[aria-pressed="true"] strong { color: var(--zq-info-text); }
.zq .signal-pill.danger[aria-pressed="true"] {
  background: var(--zq-danger-soft);
  border-color: var(--zq-danger-border);
  color: var(--zq-danger-text);
}
.zq .signal-pill.danger[aria-pressed="true"] strong { color: var(--zq-danger-text); }
.zq .signal-pill.warn[aria-pressed="true"] {
  background: var(--zq-warn-soft);
  border-color: var(--zq-warn-border);
  color: var(--zq-warn-text);
}
.zq .signal-pill.warn[aria-pressed="true"] strong { color: var(--zq-warn-text); }
.zq .signal-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--zq-text-muted);
}
.zq .signal-pill.info .signal-dot { background: var(--zq-info); }
.zq .signal-pill.danger .signal-dot { background: var(--zq-danger); }
.zq .signal-pill.warn .signal-dot { background: var(--zq-warn); }

/* Dashboard Card Sections */
.zq .dashboard-section {
  border: 1px solid var(--zq-border);
  border-radius: var(--zq-radius-lg);
  background: var(--zq-card);
  box-shadow: var(--zq-shadow);
  display: flex;
  flex-direction: column;
}
.zq .section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--zq-border);
  flex-wrap: wrap;
}
.zq .section-title-wrap {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
}
.zq .section-icon {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 7px;
  background: var(--zq-accent-soft);
  color: var(--zq-accent);
}
.zq .section-title {
  font-size: 14.5px;
  font-weight: 680;
  letter-spacing: -0.2px;
  color: var(--zq-text-1);
}
.zq .badge-count {
  font-size: 11.5px;
  font-weight: 600;
  padding: 1px 8px;
  border-radius: 9999px;
  background: var(--zq-surface);
  border: 1px solid var(--zq-border);
  color: var(--zq-text-2);
}
.zq .section-meta {
  font-size: 12px;
  color: var(--zq-text-muted);
}

/* Segmented Tabs (WAI-ARIA Tabs Pattern) */
.zq .zq-tablist {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px;
  border-radius: 9px;
  background: var(--zq-surface);
  border: 1px solid var(--zq-border);
}
.zq .zq-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  border-radius: 7px;
  padding: 6px 12px;
  min-height: 30px;
  background: transparent;
  color: var(--zq-text-2);
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 560;
  cursor: pointer;
  transition: background 0.15s ease-out, color 0.15s ease-out, box-shadow 0.15s ease-out;
}
.zq .zq-tab:hover {
  color: var(--zq-text-1);
}
.zq .zq-tab[aria-selected="true"] {
  background: var(--zq-card);
  color: var(--zq-accent-text);
  box-shadow: var(--zq-shadow-sm);
}
.zq .zq-tab-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 0 6px;
  border-radius: 9999px;
  background: var(--zq-surface);
  color: var(--zq-text-2);
  line-height: 1.5;
}
.zq .zq-tab[aria-selected="true"] .zq-tab-badge {
  background: var(--zq-accent-soft);
  color: var(--zq-accent-text);
}

/* Filter Toolbars */
.zq .filter-toolbar {
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--zq-border);
  background: color-mix(in oklab, var(--zq-surface) 45%, var(--zq-card));
}
.zq .filter-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
}
.zq .seg-filter {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border-radius: 8px;
  background: var(--zq-surface);
  border: 1px solid var(--zq-border);
  flex-wrap: wrap;
}
.zq .seg-btn {
  border: 0;
  background: transparent;
  color: var(--zq-text-2);
  font-family: inherit;
  font-size: 12px;
  font-weight: 550;
  padding: 4px 10px;
  min-height: 26px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.14s, color 0.14s, box-shadow 0.14s;
}
.zq .seg-btn:hover { color: var(--zq-text-1); }
.zq .seg-btn[aria-pressed="true"] {
  background: var(--zq-card);
  color: var(--zq-accent-text);
  box-shadow: var(--zq-shadow-sm);
}

.zq .search-box {
  position: relative;
  display: inline-flex;
  align-items: center;
  min-width: 210px;
  flex: 0 1 280px;
}
.zq .search-icon {
  position: absolute;
  left: 9px;
  color: var(--zq-text-muted);
  pointer-events: none;
  display: grid;
  place-items: center;
}
.zq .input {
  width: 100%;
  font-family: inherit;
  font-size: 12.5px;
  border: 1px solid var(--zq-border-strong);
  border-radius: var(--zq-radius-sm);
  padding: 5px 28px 5px 30px;
  background: var(--zq-card);
  color: var(--zq-text-1);
  min-height: 31px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.zq .input::placeholder { color: var(--zq-text-muted); }
.zq .input:focus {
  outline: none;
  border-color: var(--zq-accent);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--zq-accent) 18%, transparent);
}
.zq .search-clear {
  position: absolute;
  right: 5px;
  width: 20px;
  height: 20px;
  border: 0;
  border-radius: 9999px;
  background: transparent;
  color: var(--zq-text-muted);
  display: grid;
  place-items: center;
  cursor: pointer;
}
.zq .search-clear:hover {
  background: var(--zq-surface);
  color: var(--zq-text-1);
}

/* Custom Accessible Dropdown Select */
.zq .custom-select-wrap {
  position: relative;
  display: inline-block;
  user-select: none;
}
.zq .custom-select-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 550;
  border: 1px solid var(--zq-border-strong);
  border-radius: var(--zq-radius-sm);
  padding: 5px 10px;
  background: var(--zq-card);
  color: var(--zq-text-1);
  min-height: 31px;
  max-width: 210px;
  cursor: pointer;
  box-shadow: var(--zq-shadow-sm);
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  white-space: nowrap;
}
.zq .custom-select-trigger > span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
}
.zq .custom-select-trigger:hover {
  background: var(--zq-surface);
}
.zq .custom-select-trigger.open {
  border-color: var(--zq-accent);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--zq-accent) 18%, transparent);
}
.zq .custom-select-arrow {
  color: var(--zq-text-muted);
  transition: transform 0.18s ease-out;
  display: grid;
  place-items: center;
  flex: none;
}
.zq .custom-select-trigger.open .custom-select-arrow {
  transform: rotate(180deg);
  color: var(--zq-accent);
}
.zq .custom-select-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: max(100%, 170px);
  max-width: 300px;
  max-height: 260px;
  overflow-y: auto;
  background: var(--zq-card);
  border: 1px solid var(--zq-border-strong);
  border-radius: var(--zq-radius-sm);
  padding: 4px;
  box-shadow: var(--zq-shadow-lg);
  z-index: 60;
  display: flex;
  flex-direction: column;
  gap: 2px;
  animation: zqMenuIn 0.14s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes zqMenuIn {
  from { opacity: 0; transform: translateY(-3px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.zq .custom-select-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  border: 0;
  background: transparent;
  text-align: left;
  font-family: inherit;
  padding: 6px 8px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 480;
  color: var(--zq-text-1);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}
.zq .custom-select-option:hover,
.zq .custom-select-option:focus-visible {
  background: var(--zq-surface);
  color: var(--zq-accent-text);
  outline: none;
}
.zq .custom-select-option.selected {
  background: var(--zq-accent-soft);
  color: var(--zq-accent-text);
  font-weight: 600;
}
.zq .custom-select-option-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.zq .custom-select-check {
  color: var(--zq-accent);
  display: grid;
  place-items: center;
  flex: none;
}

.zq .filter-summary {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--zq-text-2);
}
.zq .filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 560;
  padding: 3px 9px;
  border-radius: 9999px;
  border: 1px solid var(--zq-border);
  background: var(--zq-card);
  color: var(--zq-text-2);
  cursor: pointer;
  transition: all 0.14s ease-out;
}
.zq .filter-chip:hover {
  border-color: var(--zq-border-strong);
  background: var(--zq-surface);
  color: var(--zq-text-1);
}
.zq .filter-chip.active[aria-pressed="true"] {
  background: var(--zq-warn-soft);
  border-color: var(--zq-warn-border);
  color: var(--zq-warn-text);
}
.zq .filter-chip.resolved[aria-pressed="true"] {
  background: var(--zq-info-soft);
  border-color: var(--zq-info-border);
  color: var(--zq-info-text);
}
.zq .filter-chip.closed[aria-pressed="true"] {
  background: var(--zq-success-soft);
  border-color: var(--zq-success-border);
  color: var(--zq-success-text);
}
.zq .filter-chip.high[aria-pressed="true"] {
  background: var(--zq-danger-soft);
  border-color: var(--zq-danger-border);
  color: var(--zq-danger-text);
}
.zq .filter-count-label {
  margin-left: 4px;
  font-weight: 600;
  color: var(--zq-text-1);
}

/* Tables (responsive-table + sortable-table) */
.zq .table-container {
  overflow: auto;
  max-inline-size: 100%;
  max-block-size: min(560px, 68vh);
  container-type: inline-size;
  outline-offset: -2px;
}
.zq table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  text-align: left;
  font-size: 12.5px;
}
.zq thead {
  position: sticky;
  inset-block-start: 0;
  z-index: 3;
}
.zq thead th {
  padding: 9px 14px;
  background: var(--zq-surface);
  color: var(--zq-text-2);
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.1px;
  border-bottom: 1px solid var(--zq-border);
  white-space: nowrap;
}
.zq thead th:has(> button.th-sort-btn) {
  padding: 0;
}
.zq .th-sort-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  width: 100%;
  min-height: 34px;
  padding: 7px 14px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
  text-align: left;
  transition: background 0.14s, color 0.14s;
}
.zq .th-sort-btn:hover {
  background: var(--zq-surface-hover);
  color: var(--zq-text-1);
}
.zq .th-sort-btn:focus-visible {
  outline: 2px solid var(--zq-accent);
  outline-offset: -2px;
}
.zq .sort-indicator {
  display: inline-flex;
  align-items: center;
  color: var(--zq-text-muted);
  opacity: 0.45;
  transition: transform 0.16s ease-out, opacity 0.16s, color 0.16s;
}
.zq th[aria-sort] .sort-indicator {
  opacity: 1;
  color: var(--zq-accent);
}
.zq th[aria-sort="descending"] .sort-indicator {
  transform: rotate(180deg);
}

.zq tbody th {
  position: sticky;
  inset-inline-start: 0;
  z-index: 2;
  background: var(--zq-card);
  padding: 10px 14px;
  font-weight: 500;
  color: var(--zq-text-1);
  border-bottom: 1px solid var(--zq-border);
  vertical-align: middle;
  min-width: 220px;
  max-width: 640px;
  transition: background 0.14s;
}
.zq tbody td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--zq-border);
  vertical-align: middle;
  background: var(--zq-card);
  transition: background 0.14s;
}
.zq tbody tr:last-child th,
.zq tbody tr:last-child td {
  border-bottom: none;
}
.zq tbody tr:hover th,
.zq tbody tr:hover td {
  background: color-mix(in oklab, var(--zq-surface) 72%, var(--zq-card));
}

/* Fixed item-title links in both <th> and <td> */
.zq a.item-title {
  font-weight: 580;
  color: var(--zq-text-1);
  text-decoration: none;
  display: inline-block;
  line-height: 1.4;
  overflow-wrap: anywhere;
  transition: color 0.14s;
}
.zq a.item-title:visited {
  color: var(--zq-text-1);
}
.zq a.item-title:hover {
  color: var(--zq-accent-text);
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 1.5px;
}
.zq .title-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
}
.zq .bug-id-tag {
  font-size: 11.5px;
  font-weight: 620;
  color: var(--zq-text-muted);
  white-space: nowrap;
}
.zq .cell-sub {
  font-size: 11.5px;
  color: var(--zq-text-2);
  margin-top: 2px;
  line-height: 1.3;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

/* Status Pills & Tags */
.zq .pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  font-weight: 580;
  padding: 2px 8px;
  border-radius: 9999px;
  border: 1px solid var(--zq-border);
  background: var(--zq-surface);
  color: var(--zq-text-2);
  white-space: nowrap;
  line-height: 1.35;
}
.zq .pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex: none;
}
.zq .pill.doing {
  color: var(--zq-accent-text);
  background: var(--zq-accent-soft);
  border-color: var(--zq-accent-border);
}
.zq .pill.resolved {
  color: var(--zq-info-text);
  background: var(--zq-info-soft);
  border-color: var(--zq-info-border);
}
.zq .pill.active, .zq .pill.delayed {
  color: var(--zq-warn-text);
  background: var(--zq-warn-soft);
  border-color: var(--zq-warn-border);
}
.zq .pill.overdue {
  color: var(--zq-danger-text);
  background: var(--zq-danger-soft);
  border-color: var(--zq-danger-border);
}
.zq .pill.closed, .zq .pill.ontrack, .zq .pill.done {
  color: var(--zq-success-text);
  background: var(--zq-success-soft);
  border-color: var(--zq-success-border);
}
.zq .pill.online-tag {
  font-size: 10.5px;
  padding: 0 6px;
  color: var(--zq-danger-text);
  background: var(--zq-danger-soft);
  border-color: var(--zq-danger-border);
}

/* Priority tags */
.zq .priority-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  font-size: 11px;
  font-weight: 650;
  padding: 2px 6px;
  border-radius: 5px;
  background: var(--zq-surface);
  border: 1px solid var(--zq-border);
  color: var(--zq-text-2);
}
.zq .priority-tag.high {
  background: var(--zq-danger-soft);
  border-color: var(--zq-danger-border);
  color: var(--zq-danger-text);
}

/* Due date cell */
.zq .due-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
  white-space: nowrap;
}
.zq .due-date.is-delayed {
  color: var(--zq-warn-text);
  font-weight: 620;
}
.zq .due-hint {
  font-size: 11px;
  color: var(--zq-text-muted);
}
.zq .due-hint.is-delayed { color: var(--zq-danger-text); font-weight: 560; }
.zq .due-hint.is-soon { color: var(--zq-warn-text); font-weight: 560; }

/* Progress Bar */
.zq .progress-box {
  width: 118px;
  max-width: 100%;
}
.zq .progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 11.5px;
  color: var(--zq-text-1);
}
.zq .progress-info small {
  color: var(--zq-text-2);
  font-size: 11px;
  font-weight: 580;
}
.zq .progress-track {
  height: 5px;
  background: var(--zq-surface);
  border: 1px solid var(--zq-border);
  border-radius: 9999px;
  overflow: hidden;
}
.zq .progress-fill {
  height: 100%;
  border-radius: 9999px;
  background: var(--zq-accent);
  transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}
.zq .progress-box.complete .progress-fill {
  background: var(--zq-success);
}
.zq .empty-metric-tag {
  display: inline-block;
  font-size: 11.5px;
  color: var(--zq-text-muted);
  padding: 2px 7px;
  border-radius: 5px;
  background: var(--zq-surface);
}

/* Sprint defect distribution button */
.zq .bug-split-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 7px;
  border-radius: 7px;
  border: 1px solid var(--zq-border);
  background: var(--zq-surface);
  font-family: inherit;
  font-size: 11.5px;
  cursor: pointer;
  transition: border-color 0.14s, background 0.14s, scale 0.12s;
  white-space: nowrap;
}
.zq .bug-split-btn:hover {
  border-color: var(--zq-accent-border);
  background: var(--zq-accent-soft);
}
.zq .bug-split-btn:active { scale: 0.97; }
.zq .split-num {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-weight: 620;
}
.zq .split-num.active { color: var(--zq-warn-text); }
.zq .split-num.resolved { color: var(--zq-info-text); }
.zq .split-num.zero { color: var(--zq-success-text); }
.zq .split-sep { color: var(--zq-text-muted); }

.zq .row-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

/* Responsive stacked layout for narrow table containers */
@container (width < 720px) {
  .zq .table-container {
    max-block-size: none;
    padding: 10px 12px;
  }
  .zq table, .zq thead, .zq tbody, .zq tr, .zq th, .zq td {
    display: block;
  }
  .zq thead {
    display: none;
  }
  .zq tbody tr {
    margin-block-end: 10px;
    border: 1px solid var(--zq-border);
    border-radius: var(--zq-radius-md);
    background: var(--zq-card);
    overflow: hidden;
    box-shadow: var(--zq-shadow-sm);
  }
  .zq tbody tr:last-child {
    margin-block-end: 0;
  }
  .zq tbody th {
    position: sticky;
    inset-block-start: 0;
    z-index: 2;
    max-width: none;
    background: var(--zq-surface);
    border-bottom: 1px solid var(--zq-border);
  }
  .zq tbody td {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 8px 12px;
  }
  .zq tbody td::before {
    font-size: 11.5px;
    color: var(--zq-text-2);
    font-weight: 560;
    flex-shrink: 0;
  }
  .zq table.sprints-table td:nth-child(2)::before { content: var(--label-2, "状态") ": "; }
  .zq table.sprints-table td:nth-child(3)::before { content: var(--label-3, "计划截止") ": "; }
  .zq table.sprints-table td:nth-child(4)::before { content: var(--label-4, "需求关闭") ": "; }
  .zq table.sprints-table td:nth-child(5)::before { content: var(--label-5, "任务完成") ": "; }
  .zq table.sprints-table td:nth-child(6)::before { content: var(--label-6, "待解决 / 待验证") ": "; }
  .zq table.sprints-table td:nth-child(7)::before { content: var(--label-7, "风险") ": "; }
  .zq table.sprints-table td:nth-child(8)::before { content: var(--label-8, "操作") ": "; }
  .zq table.bugs-table td:nth-child(2)::before { content: var(--label-2, "状态") ": "; }
  .zq table.bugs-table td:nth-child(3)::before { content: var(--label-3, "创建人") ": "; }
  .zq table.bugs-table td:nth-child(4)::before { content: var(--label-4, "优先级") ": "; }
  .zq table.bugs-table td:nth-child(5)::before { content: var(--label-5, "创建日期") ": "; }
  .zq table.bugs-table td:nth-child(6)::before { content: var(--label-6, "问题龄期") ": "; }
}

/* Pagination */
.zq .pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  padding: 10px 16px;
  background: var(--zq-card);
  border-top: 1px solid var(--zq-border);
  font-size: 12px;
  color: var(--zq-text-2);
  border-bottom-left-radius: var(--zq-radius-lg);
  border-bottom-right-radius: var(--zq-radius-lg);
}
.zq .pagination-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Alerts & Empty States */
.zq .alert-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  border-radius: var(--zq-radius-md);
  font-size: 12.5px;
  border: 1px solid var(--zq-border);
  background: var(--zq-card);
  box-shadow: var(--zq-shadow-sm);
}
.zq .alert-banner.error {
  background: var(--zq-danger-soft);
  border-color: var(--zq-danger-border);
  color: var(--zq-danger-text);
}
.zq .alert-banner.warn {
  background: var(--zq-warn-soft);
  border-color: var(--zq-warn-border);
  color: var(--zq-warn-text);
}
.zq .empty-box {
  padding: 34px 16px;
  text-align: center;
  color: var(--zq-text-muted);
  font-size: 12.5px;
  display: grid;
  gap: 8px;
  justify-items: center;
}

/* Footer meta */
.zq .footer-meta {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 4px 2px 12px;
  font-size: 11.5px;
  color: var(--zq-text-muted);
}
.zq .footer-meta details summary {
  cursor: pointer;
  color: var(--zq-text-2);
  font-weight: 550;
}
.zq .footer-meta details[open] p {
  margin: 5px 0 2px;
  line-height: 1.5;
}

/* Native Modal Dialogs (dialog + light-dismiss-a-dialog) */
.zq .zq-dialog {
  color: var(--zq-text-1);
  background: var(--zq-card);
  border: 1px solid var(--zq-border-strong);
  border-radius: var(--zq-radius-lg);
  box-shadow: var(--zq-shadow-lg);
  padding: 0;
  width: min(860px, calc(100vw - 28px));
  max-height: min(82vh, 760px);
  margin: auto;
  overflow: hidden;
}
.zq .zq-dialog.compact {
  width: min(560px, calc(100vw - 28px));
}
.zq .zq-dialog[open] {
  display: flex;
  flex-direction: column;
}
.zq .zq-dialog:modal {
  overscroll-behavior: contain;
}
.zq .zq-dialog::backdrop {
  overflow: hidden;
  overscroll-behavior: contain;
  background: rgb(15 23 42 / 0.45);
  backdrop-filter: blur(3px);
}
.zq .zq-dialog-head {
  flex: none;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 15px 18px;
  border-bottom: 1px solid var(--zq-border);
  background: var(--zq-card);
}
.zq .zq-dialog-title {
  font-size: 15.5px;
  font-weight: 700;
  color: var(--zq-text-1);
  line-height: 1.3;
}
.zq .zq-dialog-sub {
  font-size: 12px;
  color: var(--zq-text-2);
  margin-top: 3px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.zq .zq-dialog-body {
  flex: 1;
  min-block-size: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 16px 18px;
  display: grid;
  gap: 14px;
  align-content: start;
}
.zq .dialog-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.zq .dialog-mini-card {
  padding: 10px 12px;
  border-radius: var(--zq-radius-sm);
  border: 1px solid var(--zq-border);
  background: var(--zq-surface);
  display: grid;
  gap: 6px;
}
.zq .dialog-mini-label {
  font-size: 11.5px;
  color: var(--zq-text-2);
  font-weight: 560;
}
.zq .dialog-list {
  display: grid;
  gap: 8px;
}
.zq .dialog-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 12px;
  border-radius: var(--zq-radius-sm);
  border: 1px solid var(--zq-border);
  background: var(--zq-card);
}
.zq .dialog-row-main {
  min-width: 0;
  display: grid;
  gap: 3px;
}
.zq .dialog-row-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 11.5px;
  color: var(--zq-text-2);
}

@container zq-root (width < 940px) {
  .zq .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@container zq-root (width < 560px) {
  .zq .metrics { grid-template-columns: 1fr; }
  .zq .search-box { flex: 1 1 100%; min-width: 100%; }
  .zq .dialog-summary-grid { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .zq * { transition: none !important; animation: none !important; }
}
`;

  function Glyph({kind='overview', size=16, className=''}) {
   const paths={
     overview:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
     risk:'M12 3 2 21h20L12 3z M12 9v5 M12 17v1',
     bug:'M8 8h8v9a4 4 0 0 1-8 0V8z M9 8V6a3 3 0 0 1 6 0v2 M3 10h5 M16 10h5 M3 16h5 M16 16h5',
     online:'M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3z M8 12l3 3 5-6',
     refresh:'M20 7v5h-5 M4 17v-5h5 M6 7a7 7 0 0 1 12-2l2 3 M4 16l2 3a7 7 0 0 0 12-2',
     chevronDown:'M6 9l6 6 6-6',
     check:'M20 6L9 17l-5-5',
     search:'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M20 20l-4.2-4.2',
     close:'M18 6L6 18 M6 6l12 12',
     sort:'M8 15l4 4 4-4 M8 9l4-4 4 4',
     sortAsc:'M12 5v14 M7 10l5-5 5 5',
     external:'M14 4h6v6 M10 14L20 4 M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6',
     eyeOff:'M17.94 17.94A10.9 10.9 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94 M9.9 4.24A10.9 10.9 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19 M1 1l22 22',
     info:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 16v-4 M12 8h.01'
   };
   return h('svg',{
     className:className||undefined,
     width:size,
     height:size,
     viewBox:'0 0 24 24',
     fill:'none',
     stroke:'currentColor',
     strokeWidth:1.75,
     strokeLinecap:'round',
     strokeLinejoin:'round',
     'aria-hidden':'true'
   },h('path',{d:paths[kind]||paths.overview}));
  }

  function Icon({size=20}){
    return h('svg',{width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.7,'aria-hidden':'true'},
      h('rect',{x:3,y:3,width:18,height:18,rx:4}),
      h('path',{d:'M7 8h10M7 12h4M7 16h4m3-2 2 2 3-4'})
    );
  }

  // Accessible Custom Select Component (pointer outside, Esc, Arrow keys)
  function CustomSelect({ value, onChange, options, placeholder, ariaLabel }) {
    const [open, setOpen] = React.useState(false);
    const wrapRef = React.useRef(null);
    const triggerRef = React.useRef(null);
    const menuId = React.useId();

    React.useEffect(() => {
      if (!open) return;
      function handleClickOutside(e) {
        if (wrapRef.current && !wrapRef.current.contains(e.target)) {
          setOpen(false);
        }
      }
      function handleKeyDown(e) {
        if (e.key === 'Escape') {
          e.stopPropagation();
          setOpen(false);
          triggerRef.current?.focus();
        }
      }
      document.addEventListener('pointerdown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('pointerdown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [open]);

    const activeOption = options.find(o => o.value === value);
    const currentLabel = activeOption ? activeOption.label : (placeholder || '请选择');

    return h('div', { className: 'custom-select-wrap', ref: wrapRef },
      h('button', {
        ref: triggerRef,
        type: 'button',
        className: 'custom-select-trigger' + (open ? ' open' : ''),
        onClick: () => setOpen(o => !o),
        'aria-label': ariaLabel,
        'aria-expanded': open,
        'aria-haspopup': 'listbox',
        'aria-controls': open ? menuId : undefined
      },
        h('span', null, currentLabel),
        h('span', { className: 'custom-select-arrow' },
          h(Glyph, { kind: 'chevronDown', size: 13 })
        )
      ),
      open && h('div', { id: menuId, className: 'custom-select-menu', role: 'listbox', 'aria-label': ariaLabel },
        options.map(opt => {
          const isSelected = opt.value === value;
          return h('button', {
            type: 'button',
            key: opt.value,
            className: 'custom-select-option' + (isSelected ? ' selected' : ''),
            onClick: () => {
              onChange(opt.value);
              setOpen(false);
              triggerRef.current?.focus();
            },
            role: 'option',
            'aria-selected': isSelected
          },
            h('span', { className: 'custom-select-option-label', title: opt.label }, opt.label),
            isSelected && h('span', { className: 'custom-select-check' },
              h(Glyph, { kind: 'check', size: 13 })
            )
          );
        })
      )
    );
  }

  // Native <dialog closedby="any"> wrapper with light-dismiss fallback
  function ModalDialog({ open, onClose, titleId, className, children }) {
    const ref = React.useRef(null);

    React.useEffect(() => {
      const el = ref.current;
      if (!el) return;
      if (open && !el.open) {
        try {
          el.showModal();
        } catch {
          el.setAttribute('open', '');
        }
      } else if (!open && el.open) {
        el.close();
      }
    }, [open]);

    React.useEffect(() => {
      const el = ref.current;
      if (!el) return;
      function handleClose() {
        el.returnValue = '';
        onClose();
      }
      el.addEventListener('close', handleClose);

      let cleanupFallback = null;
      if (!('closedBy' in HTMLDialogElement.prototype)) {
        const outside = (e) => {
          const r = el.getBoundingClientRect();
          return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
        };
        let pressedOutside = false;
        const onPointerDown = (e) => { pressedOutside = e.target === el && outside(e); };
        const onPointerUp = (e) => { if (pressedOutside && e.target === el && outside(e)) el.close(); };
        el.addEventListener('pointerdown', onPointerDown);
        el.addEventListener('pointerup', onPointerUp);
        cleanupFallback = () => {
          el.removeEventListener('pointerdown', onPointerDown);
          el.removeEventListener('pointerup', onPointerUp);
        };
      }

      return () => {
        el.removeEventListener('close', handleClose);
        if (cleanupFallback) cleanupFallback();
      };
    }, [onClose]);

    return h('dialog', {
      ref,
      closedby: 'any',
      'aria-labelledby': titleId,
      className: 'zq-dialog' + (className ? ' ' + className : '')
    }, open ? children : null);
  }

  return {inject:['slots','locale'],apply(ctx){
   const text=[
     '禅道质量看板','全局总览 · 仅关注未关闭冲刺','刷新全局','正在汇总全部冲刺…','正在后台刷新最新数据…',
     '汇总失败，保留上次成功数据','未关闭冲刺','延期冲刺','未关闭缺陷','线上待处理','待验证','高优先级未关闭',
     '超过7天未解决','数据覆盖不完整，以下数字仅来自已成功读取的范围','跨项目冲刺总览','冲刺 / 项目','状态',
     '计划截止','需求关闭','任务完成','待解决 / 待验证','风险','未评估','暂无需求','暂无任务','延期',
     '暂无未关闭冲刺','线上问题（近30天）','关注冲刺缺陷','含已忽略冲刺','全部状态','未关闭（待解决+待验证）',
     '全部创建人','全部冲刺','搜索编号、标题或冲刺','搜索冲刺或项目名称','问题 / 所属冲刺','优先级','创建日期',
     '问题龄期','前一页','后一页','当前无匹配问题','当前筛选无匹配冲刺','首次汇总需要读取全部项目和未关闭冲刺，请稍候。',
     '数据更新时间','数据持续持久化缓存；若未获取到新数据，则始终展示上一次成功采集的信息。需求关闭率不等同于交付验收，任务排除取消与父任务。',
     '正常','重试','待解决','已关闭','创建人','操作','忽略','已忽略','取消忽略','恢复关注','保存中…','详情',
     '全部','延期风险','有待解决缺陷','进行中','清除快捷筛选','重置筛选','风险信号：','缺陷列表视图',
     '已忽略冲刺管理','搜索已忽略冲刺或项目','当前没有已忽略的冲刺','关闭弹窗','在禅道打开',
     '缺陷','需求','任务','仅看未关闭','所属项目','冲刺周期','暂无记录','负责人','工时消耗 / 剩余','阶段'
   ];
   const dict=Object.fromEntries(text.map(x=>[x,x]));
   for(const label of ['仅显示关注冲刺','需跟进计划','待解决与待验证','当前关注范围内','筛选','统计口径','更新','高优 P1-P2','超7天未解决','线上'])dict[label]=label;
   ctx.effect(()=>ctx.locale.register('zentaoDashboard','zh',dict));
   ctx.effect(()=>ctx.locale.register('zentaoDashboard','en',dict));
   const t=ctx.locale.bind('zentaoDashboard');

   function App(){
    React.useSyncExternalStore(ctx.locale.subscribe.bind(ctx.locale),ctx.locale.getSnapshot.bind(ctx.locale));
    const [data,D]=React.useState(null),[error,F]=React.useState(''),[busy,L]=React.useState(true);
    const [refreshTick,setRefreshTick]=React.useState({version:0,fresh:false});
    const [saving,Z]=React.useState(false);

    // Modals
    const [showIgnored,setShowIgnored]=React.useState(false);
    const [ignoredQuery,setIgnoredQuery]=React.useState('');
    const [detailSprintId,setDetailSprintId]=React.useState(null);
    const [detailTab,setDetailTab]=React.useState('bugs');
    const [detailOnlyOpenBugs,setDetailOnlyOpenBugs]=React.useState(true);

    // Sprint controls
    const [activeKpi,setActiveKpi]=React.useState(''); // '' | 'sprints' | 'delayed' | 'openBugs' | 'onlineOpen'
    const [sprintFilter,setSprintFilter]=React.useState('all'); // 'all' | 'delayed' | 'hasActive' | 'doing'
    const [sprintQuery,setSprintQuery]=React.useState('');
    const [sprintSort,setSprintSort]=React.useState({key:'',dir:'ascending'});
    const [sprintSortMsg,setSprintSortMsg]=React.useState('');

    // Defect Explorer controls
    const [bugTab,setBugTab]=React.useState('online'); // 'online' | 'sprint'
    const [bugSprintFilter,setBugSprintFilter]=React.useState('');
    const [state,S]=React.useState(''); // '' | 'open' | 'active' | 'resolved' | 'closed'
    const [owner,O]=React.useState('');
    const [query,Q]=React.useState('');
    const [quickBugFilter,setQuickBugFilter]=React.useState(''); // '' | 'highPriority' | 'aging'
    const [page,P]=React.useState(0);
    const [bugSort,setBugSort]=React.useState({key:'',dir:'ascending'});
    const [bugSortMsg,setBugSortMsg]=React.useState('');

    const sprintsSectionRef=React.useRef(null);
    const bugsSectionRef=React.useRef(null);
    const bugTabRefs=React.useRef({});
    const detailTabRefs=React.useRef({});

    React.useEffect(()=>{
      try {
        const local = localStorage.getItem('dsh_zentao_snapshot');
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed && typeof parsed === 'object' && parsed.sprints) {
            D(parsed);
          }
        }
      } catch {}
    }, []);

    React.useEffect(()=>{
      const c=new AbortController();
      L(true);F('');
      const url='/api/zentao-dashboard?action=global'+(refreshTick.fresh?'&fresh=1':'');
      fetch(url,{signal:c.signal})
        .then(async r=>{
          const d=await r.json();
          if(!r.ok)throw Error(d.error||'读取失败');
          return d;
        })
        .then(freshData=>{
          D(freshData);
          try { localStorage.setItem('dsh_zentao_snapshot', JSON.stringify(freshData)); } catch {}
        })
        .catch(e=>{
          if(e.name!=='AbortError')F(e.message);
        })
        .finally(()=>{
          if(!c.signal.aborted)L(false);
        });
      return()=>c.abort();
    },[refreshTick]);

    const triggerRefresh = (fresh = true) => setRefreshTick(r => ({ version: r.version + 1, fresh }));

    async function changeIgnore(s,ignored) {
      Z(true);F('');
      try {
        const r=await fetch('/api/zentao-dashboard?action=ignore',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({id:String(s.id),name:s.name||'',projectName:s.projectName||'',ignored})
        });
        const result=await r.json();
        if(!r.ok)throw Error(result.error);
        triggerRefresh(false);
      }catch(e){F(e.message);}finally{Z(false);}
    }

    React.useEffect(()=>P(0),[bugTab,bugSprintFilter,state,owner,query,quickBugFilter,bugSort]);

    const sprints=data?.sprints||[],summary=data?.summary||{};
    const onlineBase=data?.recentOnline?.items||[];
    const sprintBugsBase=data?.bugs||[];
    const activeBugBase=bugTab==='online'?onlineBase:sprintBugsBase;

    const today=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'});
    const delayed=s=>/^\d{4}-\d{2}-\d{2}$/.test(s.end)&&s.end!=='0000-00-00'&&s.end<today;

    // Sprint metrics helpers
    const sprintStats = React.useMemo(() => {
      let doingCount = 0, waitCount = 0;
      for (const s of sprints) {
        if (s.status === 'doing') doingCount++;
        else if (s.status === 'wait') waitCount++;
      }
      return { doingCount, waitCount };
    }, [sprints]);

    const bugBreakdown = React.useMemo(() => {
      let activeCount = 0, resolvedCount = 0;
      for (const b of sprintBugsBase) {
        if (b.status === 'active') activeCount++;
        else if (b.status === 'resolved') resolvedCount++;
      }
      return { activeCount, resolvedCount };
    }, [sprintBugsBase]);

    const creatorById = React.useMemo(() => {
      const m = new Map();
      for (const b of sprintBugsBase) m.set(String(b.id), b.creatorName);
      for (const b of onlineBase) if (b.creatorName) m.set(String(b.id), b.creatorName);
      return m;
    }, [sprintBugsBase, onlineBase]);

    // Filter and sort sprints
    const filteredSprints = React.useMemo(() => {
      const q = sprintQuery.trim().toLowerCase();
      let list = sprints.filter(s => {
        if (sprintFilter === 'delayed' && !delayed(s)) return false;
        if (sprintFilter === 'hasActive' && !(s.bugs && s.bugs.some(b => b.status === 'active'))) return false;
        if (sprintFilter === 'doing' && s.status !== 'doing') return false;
        if (q && !(s.name + ' ' + s.projectName + ' ' + s.id).toLowerCase().includes(q)) return false;
        return true;
      });
      if (sprintSort.key) {
        const factor = sprintSort.dir === 'ascending' ? 1 : -1;
        const pctOf = (arr, pred) => (!arr || !arr.length) ? -1 : arr.filter(pred).length / arr.length;
        const riskRank = s => (delayed(s) ? 2 : 0) + (s.warnings?.length ? 1 : 0);
        const openBugCount = s => s.bugs ? s.bugs.filter(b => b.status === 'active' || b.status === 'resolved').length : -1;
        list = [...list].sort((a, b) => {
          let cmp = 0;
          switch (sprintSort.key) {
            case 'name': cmp = collator.compare(a.name || '', b.name || ''); break;
            case 'status': cmp = collator.compare(status[a.status] || a.status || '', status[b.status] || b.status || ''); break;
            case 'end': cmp = collator.compare(a.end === '0000-00-00' ? '9999-99-99' : (a.end || '9999-99-99'), b.end === '0000-00-00' ? '9999-99-99' : (b.end || '9999-99-99')); break;
            case 'stories': cmp = pctOf(a.stories, x => x.status === 'closed') - pctOf(b.stories, x => x.status === 'closed'); break;
            case 'tasks': cmp = pctOf(tasks(a.tasks), x => ['done', 'closed'].includes(x.status)) - pctOf(tasks(b.tasks), x => ['done', 'closed'].includes(x.status)); break;
            case 'bugs': cmp = openBugCount(a) - openBugCount(b); break;
            case 'risk': cmp = riskRank(a) - riskRank(b); break;
            default: cmp = 0;
          }
          return factor * cmp;
        });
      }
      return list;
    }, [sprints, sprintFilter, sprintQuery, sprintSort, today]);

    function toggleSprintSort(key, label) {
      const nextDir = sprintSort.key === key && sprintSort.dir === 'ascending' ? 'descending' : 'ascending';
      setSprintSort({ key, dir: nextDir });
      setSprintSortMsg(`按${label}${nextDir === 'ascending' ? '升序' : '降序'}排列，共 ${filteredSprints.length} 条冲刺`);
    }

    // Defect explorer filtering & sorting
    const bugSprints = React.useMemo(
      () => [...new Set(activeBugBase.map(b => b.sprintName).filter(Boolean))].sort((a, b) => collator.compare(a, b)),
      [activeBugBase]
    );
    const owners = React.useMemo(
      () => [...new Set(activeBugBase.map(b => b.creatorName || '姓名未获取'))].sort((a, b) => collator.compare(a, b)),
      [activeBugBase]
    );

    const statusCounts = React.useMemo(() => {
      let active = 0, resolved = 0, closed = 0, high = 0, agingCount = 0;
      for (const b of activeBugBase) {
        if (b.status === 'active') active++;
        else if (b.status === 'resolved') resolved++;
        else if (b.status === 'closed') closed++;
        if (b.status !== 'closed' && Number(b.pri) > 0 && Number(b.pri) <= 2) high++;
        if (b.status === 'active' && (age(b) ?? 0) > 7) agingCount++;
      }
      return { active, resolved, closed, high, agingCount };
    }, [activeBugBase]);

    const bugs = React.useMemo(() => {
      const q = query.trim().toLowerCase();
      let list = activeBugBase.filter(b => {
        if (bugSprintFilter && b.sprintName !== bugSprintFilter) return false;
        if (state === 'open' && b.status === 'closed') return false;
        if (state && state !== 'open' && b.status !== state) return false;
        if (owner && (b.creatorName || '姓名未获取') !== owner) return false;
        if (quickBugFilter === 'highPriority' && !(b.status !== 'closed' && Number(b.pri) > 0 && Number(b.pri) <= 2)) return false;
        if (quickBugFilter === 'aging' && !(b.status === 'active' && (age(b) ?? 0) > 7)) return false;
        if (q && !(b.id + ' ' + b.title + ' ' + b.sprintName + ' ' + b.projectName + ' ' + (b.creatorName || '')).toLowerCase().includes(q)) return false;
        return true;
      });
      if (bugSort.key) {
        const factor = bugSort.dir === 'ascending' ? 1 : -1;
        list = [...list].sort((a, b) => {
          let cmp = 0;
          switch (bugSort.key) {
            case 'title': cmp = collator.compare(a.title || '', b.title || ''); break;
            case 'status': cmp = collator.compare(status[a.status] || a.status || '', status[b.status] || b.status || ''); break;
            case 'creator': cmp = collator.compare(a.creatorName || '', b.creatorName || ''); break;
            case 'pri': cmp = (Number(a.pri) || 9) - (Number(b.pri) || 9); break;
            case 'openedDate': cmp = String(a.openedDate || '').localeCompare(String(b.openedDate || '')); break;
            case 'age': cmp = (age(a) ?? -1) - (age(b) ?? -1); break;
            default: cmp = 0;
          }
          return factor * cmp;
        });
      } else {
        list = [...list].sort((a, b) => (Number(a.pri) || 9) - (Number(b.pri) || 9) || String(a.openedDate || '').localeCompare(String(b.openedDate || '')));
      }
      return list;
    }, [activeBugBase, bugSprintFilter, state, owner, quickBugFilter, query, bugSort]);

    function toggleBugSort(key, label) {
      const nextDir = bugSort.key === key && bugSort.dir === 'ascending' ? 'descending' : 'ascending';
      setBugSort({ key, dir: nextDir });
      setBugSortMsg(`按${label}${nextDir === 'ascending' ? '升序' : '降序'}排列，共 ${bugs.length} 条问题`);
    }

    const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    function clearAllBugFilters() {
      setBugSprintFilter('');
      S('');
      O('');
      Q('');
      setQuickBugFilter('');
    }

    function openSprintDetail(s, tab = 'bugs') {
      setDetailSprintId(String(s.id));
      setDetailTab(tab);
      setDetailOnlyOpenBugs(true);
    }

    // Keyboard tablist handler (ArrowLeft / ArrowRight / Home / End)
    function handleTablistKeyDown(e, keys, activeKey, onSelect, refMap) {
      const idx = keys.indexOf(activeKey);
      if (idx === -1) return;
      let nextIdx = -1;
      if (e.key === 'ArrowRight') nextIdx = (idx + 1) % keys.length;
      else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + keys.length) % keys.length;
      else if (e.key === 'Home') nextIdx = 0;
      else if (e.key === 'End') nextIdx = keys.length - 1;
      if (nextIdx >= 0) {
        e.preventDefault();
        const nextKey = keys[nextIdx];
        onSelect(nextKey);
        refMap.current[nextKey]?.focus();
      }
    }

    function progress(a, pred, emptyLabel) {
      if (!a) return h('span', { className: 'empty-metric-tag' }, t('未评估'));
      if (!a.length) return h('span', { className: 'empty-metric-tag' }, t(emptyLabel || '无数据'));
      const n = a.filter(pred).length, pct = Math.round(100 * n / a.length);
      return h('div', { className: 'progress-box' + (pct === 100 ? ' complete' : '') },
        h('div', { className: 'progress-info' },
          h('span', null, n + ' / ' + a.length),
          h('small', null, pct + '%')
        ),
        h('div', { className: 'progress-track', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': pct, 'aria-label': n + ' / ' + a.length },
          h('div', { className: 'progress-fill', style: { width: pct + '%' } })
        )
      );
    }

    function renderSortHeader(colKey, label, currentSort, onToggle) {
      const isSorted = currentSort.key === colKey;
      return h('th', {
        key: colKey,
        scope: 'col',
        'aria-sort': isSorted ? currentSort.dir : undefined
      },
        h('button', {
          type: 'button',
          className: 'th-sort-btn',
          onClick: () => onToggle(colKey, t(label))
        },
          h('span', null, t(label)),
          h('span', { className: 'sort-indicator' },
            h(Glyph, { kind: isSorted ? 'sortAsc' : 'sort', size: 13 })
          )
        )
      );
    }

    const activeQuickChip = quickBugFilter || (bugTab === 'sprint' && state === 'resolved' ? 'pendingVerification' : '') || (bugTab === 'sprint' && state === 'open' ? 'openBugs' : '') || (bugTab === 'online' && state === 'active' ? 'onlineOpen' : '') || (sprintFilter === 'delayed' ? 'delayed' : '');

    const selectedSprint = React.useMemo(
      () => sprints.find(s => String(s.id) === String(detailSprintId)) || null,
      [sprints, detailSprintId]
    );

    const filteredIgnored = React.useMemo(() => {
      const list = data?.ignoredSprints || [];
      const q = ignoredQuery.trim().toLowerCase();
      if (!q) return list;
      return list.filter(s => ((s.projectName || '') + ' ' + (s.name || '') + ' ' + s.id).toLowerCase().includes(q));
    }, [data, ignoredQuery]);

    const pageStart = bugs.length ? page * 30 + 1 : 0;
    const pageEnd = Math.min(bugs.length, (page + 1) * 30);
    const totalPages = Math.max(1, Math.ceil(bugs.length / 30));

    return h('div', { className: 'zq' },
      h('style', null, css),

      // Top Sticky Header Bar
      h('header', { className: 'zq-topbar' },
        h('div', { className: 'zq-topbar-inner' },
          h('div', { className: 'identity' },
            h('span', { className: 'identity-mark' }, h(Glyph, { kind: 'online', size: 20 })),
            h('div', null,
              h('h1', null, t('禅道质量看板')),
              h('div', { className: 'sub-title' },
                h('span', null, t('全局总览 · 仅关注未关闭冲刺')),
                data?.readAt && h('span', null, '· ' + t('更新') + ' ' + formatTime(data.readAt)),
                busy && data && h('span', { className: 'sync-chip', role: 'status' },
                  h(Glyph, { kind: 'refresh', size: 11, className: 'spin' }),
                  t('正在后台刷新最新数据…')
                )
              )
            )
          ),
          h('div', { className: 'topbar-actions' },
            h('button', {
              type: 'button',
              className: 'btn',
              onClick: () => { setIgnoredQuery(''); setShowIgnored(true); }
            },
              h(Glyph, { kind: 'eyeOff', size: 14 }),
              t('已忽略') + ' (' + (data?.ignoredSprints?.length || 0) + ')'
            ),
            h('button', {
              type: 'button',
              className: 'btn btn-primary',
              disabled: busy || saving,
              onClick: () => triggerRefresh(true)
            },
              h(Glyph, { kind: 'refresh', size: 14, className: busy ? 'spin' : '' }),
              t(busy ? '正在汇总全部冲刺…' : '刷新全局')
            )
          )
        )
      ),

      // Scrollable Dashboard Body
      h('div', { className: 'zq-scroll' },
        h('div', { className: 'zq-shell' },

          // Alerts
          error && h('div', { className: 'alert-banner error', role: 'alert' },
            h(Glyph, { kind: 'risk', size: 16 }),
            h('div', { style: { flex: 1 } }, t('汇总失败，保留上次成功数据') + '：' + error),
            h('button', { type: 'button', className: 'btn btn-soft', onClick: () => triggerRefresh(true) }, t('重试'))
          ),
          busy && !data && h('div', { className: 'alert-banner', role: 'status' },
            h(Glyph, { kind: 'refresh', size: 15, className: 'spin' }),
            h('span', null, t('首次汇总需要读取全部项目和未关闭冲刺，请稍候。'))
          ),
          data && !data.complete && h('div', { className: 'alert-banner warn', role: 'alert' },
            h(Glyph, { kind: 'risk', size: 16 }),
            h('div', null,
              h('div', { style: { fontWeight: 600, marginBottom: 4 } }, t('数据覆盖不完整，以下数字仅来自已成功读取的范围')),
              ...(data.warnings || []).map((x, i) => h('div', { key: i, style: { fontSize: 12 } }, x))
            )
          ),

          // Interactive KPI Command Grid
          h('div', { className: 'metrics', role: 'group', 'aria-label': '核心质量指标' },
            h('button', {
              type: 'button',
              className: 'metric-card accent',
              'aria-pressed': activeKpi === 'sprints',
              onClick: () => {
                setActiveKpi('sprints');
                setSprintFilter('all');
                setSprintQuery('');
                scrollTo(sprintsSectionRef);
              }
            },
              h('div', { className: 'metric-info' },
                h('span', { className: 'metric-label' }, t('未关闭冲刺')),
                h('div', { className: 'metric-val' }, data ? summary.sprints : '—'),
                h('span', { className: 'metric-sub' }, `进行中 ${sprintStats.doingCount} · 未开始 ${sprintStats.waitCount}`)
              ),
              h('span', { className: 'metric-icon-wrap' }, h(Glyph, { kind: 'overview', size: 17 }))
            ),
            h('button', {
              type: 'button',
              className: 'metric-card ' + (data && (summary.delayed || 0) === 0 ? 'success' : 'warn'),
              'aria-pressed': activeKpi === 'delayed',
              onClick: () => {
                setActiveKpi(k => k === 'delayed' ? '' : 'delayed');
                setSprintFilter(f => f === 'delayed' ? 'all' : 'delayed');
                scrollTo(sprintsSectionRef);
              }
            },
              h('div', { className: 'metric-info' },
                h('span', { className: 'metric-label' }, t('延期冲刺')),
                h('div', { className: 'metric-val' }, data ? summary.delayed : '—'),
                h('span', { className: 'metric-sub' }, t('需跟进计划') + ' · 点击筛选延期')
              ),
              h('span', { className: 'metric-icon-wrap' }, h(Glyph, { kind: 'risk', size: 17 }))
            ),
            h('button', {
              type: 'button',
              className: 'metric-card accent',
              'aria-pressed': activeKpi === 'openBugs',
              onClick: () => {
                setActiveKpi('openBugs');
                setBugTab('sprint');
                setBugSprintFilter('');
                O('');
                Q('');
                setQuickBugFilter('');
                S('open');
                scrollTo(bugsSectionRef);
              }
            },
              h('div', { className: 'metric-info' },
                h('span', { className: 'metric-label' }, t('未关闭缺陷')),
                h('div', { className: 'metric-val' }, data ? summary.openBugs : '—'),
                h('span', { className: 'metric-sub' }, `待解决 ${bugBreakdown.activeCount} · 待验证 ${bugBreakdown.resolvedCount} · 点击查看`)
              ),
              h('span', { className: 'metric-icon-wrap' }, h(Glyph, { kind: 'bug', size: 17 }))
            ),
            h('button', {
              type: 'button',
              className: 'metric-card ' + (data && (summary.onlineOpen || 0) === 0 ? 'success' : 'danger'),
              'aria-pressed': activeKpi === 'onlineOpen',
              onClick: () => {
                setActiveKpi('onlineOpen');
                setBugTab('online');
                setBugSprintFilter('');
                O('');
                Q('');
                setQuickBugFilter('');
                S((summary.onlineOpen || 0) > 0 ? 'active' : '');
                scrollTo(bugsSectionRef);
              }
            },
              h('div', { className: 'metric-info' },
                h('span', { className: 'metric-label' }, t('线上待处理')),
                h('div', { className: 'metric-val' }, data ? summary.onlineOpen : '—'),
                h('span', { className: 'metric-sub' }, `近 30 天线上共 ${onlineBase.length} 单 · 点击查看`)
              ),
              h('span', { className: 'metric-icon-wrap' }, h(Glyph, { kind: 'online', size: 17 }))
            )
          ),

          // Interactive Risk Signal Strip
          h('div', { className: 'signal-bar' },
            h('span', { className: 'signal-caption' }, t('风险信号：')),
            h('button', {
              type: 'button',
              className: 'signal-pill info',
              'aria-pressed': bugTab === 'sprint' && state === 'resolved' && !quickBugFilter,
              onClick: () => {
                setActiveKpi('');
                setBugTab('sprint');
                setBugSprintFilter('');
                O('');
                Q('');
                setQuickBugFilter('');
                S('resolved');
                scrollTo(bugsSectionRef);
              }
            },
              h('span', { className: 'signal-dot', 'aria-hidden': 'true' }),
              h('span', null, t('待验证')),
              h('strong', null, data ? summary.pendingVerification : '—')
            ),
            h('button', {
              type: 'button',
              className: 'signal-pill danger',
              'aria-pressed': bugTab === 'sprint' && quickBugFilter === 'highPriority',
              onClick: () => {
                setActiveKpi('');
                setBugTab('sprint');
                setBugSprintFilter('');
                O('');
                Q('');
                S('');
                setQuickBugFilter(f => f === 'highPriority' ? '' : 'highPriority');
                scrollTo(bugsSectionRef);
              }
            },
              h('span', { className: 'signal-dot', 'aria-hidden': 'true' }),
              h('span', null, t('高优先级未关闭')),
              h('strong', null, data ? summary.highPriority : '—')
            ),
            h('button', {
              type: 'button',
              className: 'signal-pill warn',
              'aria-pressed': bugTab === 'sprint' && quickBugFilter === 'aging',
              onClick: () => {
                setActiveKpi('');
                setBugTab('sprint');
                setBugSprintFilter('');
                O('');
                Q('');
                S('');
                setQuickBugFilter(f => f === 'aging' ? '' : 'aging');
                scrollTo(bugsSectionRef);
              }
            },
              h('span', { className: 'signal-dot', 'aria-hidden': 'true' }),
              h('span', null, t('超过7天未解决')),
              h('strong', null, data ? summary.aging : '—')
            ),
            (activeKpi || activeQuickChip) && h('button', {
              type: 'button',
              className: 'btn btn-ghost',
              style: { marginLeft: 'auto' },
              onClick: () => {
                setActiveKpi('');
                setSprintFilter('all');
                setSprintQuery('');
                clearAllBugFilters();
              }
            },
              h(Glyph, { kind: 'close', size: 12 }),
              t('清除快捷筛选')
            )
          ),

          // Section 1: Sprints Overview
          h('section', { className: 'dashboard-section', ref: sprintsSectionRef, id: 'zq-sprints-section' },
            h('div', { className: 'section-header' },
              h('div', { className: 'section-title-wrap' },
                h('span', { className: 'section-icon' }, h(Glyph, { kind: 'overview', size: 15 })),
                h('h2', { id: 'zq-sprints-title', className: 'section-title' }, t('跨项目冲刺总览')),
                h('span', { className: 'badge-count' }, filteredSprints.length + (filteredSprints.length !== sprints.length ? ' / ' + sprints.length : ''))
              ),
              h('div', { className: 'section-meta' }, '延期优先 · 点击行内缺陷胶囊或「详情」查看需求与任务')
            ),

            h('div', { className: 'filter-toolbar' },
              h('div', { className: 'filter-inputs' },
                h('div', { className: 'seg-filter', role: 'group', 'aria-label': '冲刺快速筛选' },
                  ...[
                    ['all', '全部'],
                    ['delayed', '延期风险'],
                    ['hasActive', '有待解决缺陷'],
                    ['doing', '进行中']
                  ].map(([k, lbl]) =>
                    h('button', {
                      key: k,
                      type: 'button',
                      className: 'seg-btn',
                      'aria-pressed': sprintFilter === k,
                      onClick: () => setSprintFilter(k)
                    }, t(lbl))
                  )
                ),
                h('div', { className: 'search-box' },
                  h('span', { className: 'search-icon' }, h(Glyph, { kind: 'search', size: 14 })),
                  h('input', {
                    className: 'input',
                    value: sprintQuery,
                    onChange: e => setSprintQuery(e.target.value),
                    placeholder: t('搜索冲刺或项目名称'),
                    'aria-label': t('搜索冲刺或项目名称')
                  }),
                  sprintQuery && h('button', {
                    type: 'button',
                    className: 'search-clear',
                    onClick: () => setSprintQuery(''),
                    'aria-label': '清空搜索'
                  }, h(Glyph, { kind: 'close', size: 12 }))
                )
              )
            ),

            h('div', { role: 'status', className: 'sr-only' }, sprintSortMsg),
            h('div', { className: 'table-container', tabIndex: 0, role: 'region', 'aria-labelledby': 'zq-sprints-title' },
              h('table', {
                className: 'sprints-table',
                style: {
                  '--label-2': JSON.stringify(t('状态')),
                  '--label-3': JSON.stringify(t('计划截止')),
                  '--label-4': JSON.stringify(t('需求关闭')),
                  '--label-5': JSON.stringify(t('任务完成')),
                  '--label-6': JSON.stringify(t('待解决 / 待验证')),
                  '--label-7': JSON.stringify(t('风险')),
                  '--label-8': JSON.stringify(t('操作'))
                }
              },
                h('caption', { className: 'sr-only' }, t('跨项目冲刺总览')),
                h('thead', null,
                  h('tr', null,
                    renderSortHeader('name', '冲刺 / 项目', sprintSort, toggleSprintSort),
                    renderSortHeader('status', '状态', sprintSort, toggleSprintSort),
                    renderSortHeader('end', '计划截止', sprintSort, toggleSprintSort),
                    renderSortHeader('stories', '需求关闭', sprintSort, toggleSprintSort),
                    renderSortHeader('tasks', '任务完成', sprintSort, toggleSprintSort),
                    renderSortHeader('bugs', '待解决 / 待验证', sprintSort, toggleSprintSort),
                    renderSortHeader('risk', '风险', sprintSort, toggleSprintSort),
                    h('th', { scope: 'col' }, t('操作'))
                  )
                ),
                h('tbody', null,
                  ...filteredSprints.map(s => {
                    const isDel = delayed(s);
                    const daysLeft = diffDays(s.end, today);
                    const activeBugs = s.bugs ? s.bugs.filter(b => b.status === 'active').length : null;
                    const resolvedBugs = s.bugs ? s.bugs.filter(b => b.status === 'resolved').length : null;
                    const leafTasks = tasks(s.tasks);

                    return h('tr', { key: s.id },
                      h('th', { scope: 'row' },
                        h('a', {
                          className: 'item-title',
                          href: 'http://pm.kuaishang.cn/zentao/execution-view-' + s.id + '.html',
                          target: '_blank',
                          rel: 'noopener noreferrer'
                        }, s.name),
                        h('div', { className: 'cell-sub' },
                          h('span', null, s.projectName),
                          s.PM && h('span', null, '· PM ' + s.PM)
                        )
                      ),
                      h('td', null,
                        h('span', { className: 'pill ' + s.status },
                          h('i', { className: 'pill-dot', 'aria-hidden': 'true' }),
                          status[s.status] || s.status
                        )
                      ),
                      h('td', null,
                        h('div', { className: 'due-wrap' },
                          h('span', { className: 'due-date' + (isDel ? ' is-delayed' : '') }, s.end === '0000-00-00' ? '—' : s.end || '—'),
                          daysLeft !== null && h('span', {
                            className: 'due-hint' + (daysLeft < 0 ? ' is-delayed' : daysLeft <= 5 ? ' is-soon' : '')
                          }, daysLeft < 0 ? `逾期 ${Math.abs(daysLeft)} 天` : daysLeft === 0 ? '今日截止' : `剩 ${daysLeft} 天`)
                        )
                      ),
                      h('td', null, progress(s.stories, b => b.status === 'closed', '暂无需求')),
                      h('td', null, progress(leafTasks, b => ['done', 'closed'].includes(b.status), '暂无任务')),
                      h('td', null,
                        activeBugs === null
                          ? h('span', { className: 'empty-metric-tag' }, t('未评估'))
                          : h('button', {
                              type: 'button',
                              className: 'bug-split-btn',
                              title: '查看该冲刺的缺陷明细',
                              onClick: () => openSprintDetail(s, 'bugs')
                            },
                              (activeBugs === 0 && resolvedBugs === 0)
                                ? h('span', { className: 'split-num zero' }, '0 缺陷')
                                : h(React.Fragment, null,
                                    h('span', { className: 'split-num active' }, '待解 ' + activeBugs),
                                    h('span', { className: 'split-sep' }, '/'),
                                    h('span', { className: 'split-num resolved' }, '待验 ' + resolvedBugs)
                                  )
                            )
                      ),
                      h('td', null,
                        h('div', { style: { display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' } },
                          isDel && h('span', { className: 'pill delayed' }, h('i', { className: 'pill-dot', 'aria-hidden': 'true' }), t('延期')),
                          s.warnings?.length
                            ? h('div', { style: { color: 'var(--zq-danger-text)', fontSize: 11.5 } }, s.warnings.join('；'))
                            : (!isDel && h('span', { className: 'pill ontrack' }, h('i', { className: 'pill-dot', 'aria-hidden': 'true' }), t('正常')))
                        )
                      ),
                      h('td', null,
                        h('div', { className: 'row-actions' },
                          h('button', {
                            type: 'button',
                            className: 'btn btn-soft',
                            onClick: () => openSprintDetail(s, 'bugs'),
                            'aria-label': t('详情') + ' ' + s.name
                          }, t('详情')),
                          h('button', {
                            type: 'button',
                            className: 'btn btn-ghost',
                            disabled: saving || busy,
                            onClick: () => changeIgnore(s, true),
                            'aria-label': t('忽略') + ' ' + s.name
                          }, t(saving ? '保存中…' : '忽略'))
                        )
                      )
                    );
                  })
                )
              )
            ),
            !busy && !sprints.length && h('div', { className: 'empty-box' }, t('暂无未关闭冲刺')),
            !busy && sprints.length > 0 && !filteredSprints.length && h('div', { className: 'empty-box' },
              h('span', null, t('当前筛选无匹配冲刺')),
              h('button', {
                type: 'button',
                className: 'btn btn-soft',
                onClick: () => { setSprintFilter('all'); setSprintQuery(''); }
              }, t('重置筛选'))
            )
          ),

          // Section 2: Defect Explorer (Dual Tabs: Online 30d vs Focused Sprint Bugs)
          h('section', { className: 'dashboard-section', ref: bugsSectionRef, id: 'zq-bugs-section' },
            h('div', { className: 'section-header' },
              h('div', { className: 'section-title-wrap' },
                h('span', { className: 'section-icon' }, h(Glyph, { kind: bugTab === 'online' ? 'online' : 'bug', size: 15 })),
                h('div', {
                  className: 'zq-tablist',
                  role: 'tablist',
                  'aria-label': t('缺陷列表视图'),
                  onKeyDown: e => handleTablistKeyDown(e, ['online', 'sprint'], bugTab, setBugTab, bugTabRefs)
                },
                  h('button', {
                    ref: el => { bugTabRefs.current.online = el; },
                    type: 'button',
                    id: 'zq-tab-online',
                    role: 'tab',
                    className: 'zq-tab',
                    'aria-selected': bugTab === 'online',
                    onClick: () => { setBugTab('online'); setBugSprintFilter(''); setQuickBugFilter(''); }
                  },
                    t('线上问题（近30天）'),
                    h('span', { className: 'zq-tab-badge' }, onlineBase.length)
                  ),
                  h('button', {
                    ref: el => { bugTabRefs.current.sprint = el; },
                    type: 'button',
                    id: 'zq-tab-sprint',
                    role: 'tab',
                    className: 'zq-tab',
                    'aria-selected': bugTab === 'sprint',
                    onClick: () => { setBugTab('sprint'); setBugSprintFilter(''); }
                  },
                    t('关注冲刺缺陷'),
                    h('span', { className: 'zq-tab-badge' }, sprintBugsBase.length)
                  )
                )
              ),
              h('span', { className: 'section-meta' },
                bugTab === 'online'
                  ? h(React.Fragment, null, t('含已忽略冲刺'), data?.recentOnline && ' · ' + data.recentOnline.from + ' — ' + data.recentOnline.to)
                  : `覆盖 ${sprints.length} 个关注冲刺 · 未关闭 ${summary.openBugs ?? 0} 条`
              )
            ),

            // Tabpanels (render both with hidden on inactive panel per WAI-ARIA tabs guidance)
            ...['online', 'sprint'].map(tabKey => {
              const isActive = bugTab === tabKey;
              return h('div', {
                key: tabKey,
                role: 'tabpanel',
                id: 'zq-bugs-panel-' + tabKey,
                'aria-labelledby': 'zq-tab-' + tabKey,
                hidden: !isActive,
                tabIndex: isActive ? 0 : undefined
              }, isActive && h(React.Fragment, null,
              h('div', { className: 'filter-toolbar' },
                h('div', { className: 'filter-inputs' },
                  h('div', { className: 'search-box' },
                    h('span', { className: 'search-icon' }, h(Glyph, { kind: 'search', size: 14 })),
                    h('input', {
                      className: 'input',
                      value: query,
                      onChange: e => Q(e.target.value),
                      placeholder: t('搜索编号、标题或冲刺'),
                      'aria-label': t('搜索编号、标题或冲刺')
                    }),
                    query && h('button', {
                      type: 'button',
                      className: 'search-clear',
                      onClick: () => Q(''),
                      'aria-label': '清空搜索'
                    }, h(Glyph, { kind: 'close', size: 12 }))
                  ),
                  h(CustomSelect, {
                    value: bugSprintFilter,
                    onChange: setBugSprintFilter,
                    options: [
                      { value: '', label: t('全部冲刺') },
                      ...bugSprints.map(v => ({ value: v, label: v }))
                    ],
                    ariaLabel: '按冲刺筛选'
                  }),
                  h(CustomSelect, {
                    value: state,
                    onChange: S,
                    options: [
                      { value: '', label: t('全部状态') },
                      { value: 'open', label: t('未关闭（待解决+待验证）') },
                      ...['active', 'resolved', 'closed'].map(v => ({ value: v, label: status[v] }))
                    ],
                    ariaLabel: t('状态')
                  }),
                  h(CustomSelect, {
                    value: owner,
                    onChange: O,
                    options: [
                      { value: '', label: t('全部创建人') },
                      ...owners.map(v => ({ value: v, label: v }))
                    ],
                    ariaLabel: t('创建人')
                  })
                ),
                h('div', { className: 'filter-summary' },
                  h('button', {
                    type: 'button',
                    className: 'filter-chip active',
                    'aria-pressed': state === 'active',
                    onClick: () => S(s => s === 'active' ? '' : 'active')
                  }, status.active + ' ' + statusCounts.active),
                  h('button', {
                    type: 'button',
                    className: 'filter-chip resolved',
                    'aria-pressed': state === 'resolved',
                    onClick: () => S(s => s === 'resolved' ? '' : 'resolved')
                  }, status.resolved + ' ' + statusCounts.resolved),
                  h('button', {
                    type: 'button',
                    className: 'filter-chip closed',
                    'aria-pressed': state === 'closed',
                    onClick: () => S(s => s === 'closed' ? '' : 'closed')
                  }, status.closed + ' ' + statusCounts.closed),
                  statusCounts.high > 0 && h('button', {
                    type: 'button',
                    className: 'filter-chip high',
                    'aria-pressed': quickBugFilter === 'highPriority',
                    onClick: () => setQuickBugFilter(f => f === 'highPriority' ? '' : 'highPriority')
                  }, t('高优 P1-P2') + ' ' + statusCounts.high),
                  h('span', { className: 'filter-count-label' }, t('筛选') + ' ' + bugs.length + ' / ' + activeBugBase.length)
                )
              ),

              h('div', { role: 'status', className: 'sr-only' }, bugSortMsg),
              h('div', {
                className: 'table-container',
                tabIndex: 0,
                role: 'region',
                'aria-labelledby': 'zq-tab-' + tabKey
              },
                h('table', {
                  className: 'bugs-table',
                  style: {
                    '--label-2': JSON.stringify(t('状态')),
                    '--label-3': JSON.stringify(t('创建人')),
                    '--label-4': JSON.stringify(t('优先级')),
                    '--label-5': JSON.stringify(t('创建日期')),
                    '--label-6': JSON.stringify(t('问题龄期'))
                  }
                },
                  h('caption', { className: 'sr-only' }, tabKey === 'online' ? t('线上问题（近30天）') : t('关注冲刺缺陷')),
                  h('thead', null,
                    h('tr', null,
                      renderSortHeader('title', '问题 / 所属冲刺', bugSort, toggleBugSort),
                      renderSortHeader('status', '状态', bugSort, toggleBugSort),
                      renderSortHeader('creator', '创建人', bugSort, toggleBugSort),
                      renderSortHeader('pri', '优先级', bugSort, toggleBugSort),
                      renderSortHeader('openedDate', '创建日期', bugSort, toggleBugSort),
                      renderSortHeader('age', '问题龄期', bugSort, toggleBugSort)
                    )
                  ),
                  h('tbody', null,
                    ...bugs.slice(page * 30, page * 30 + 30).map(b => {
                      const dAge = age(b);
                      const isAging = b.status === 'active' && dAge !== null && dAge > 7;
                      return h('tr', { key: b.id },
                        h('th', { scope: 'row' },
                          h('div', { className: 'title-row' },
                            h('span', { className: 'bug-id-tag' }, '#' + b.id),
                            tabKey === 'sprint' && isOnlineFlag(b) && h('span', { className: 'pill online-tag' }, t('线上')),
                            h('a', {
                              className: 'item-title',
                              href: 'http://pm.kuaishang.cn/zentao/bug-view-' + b.id + '.html',
                              target: '_blank',
                              rel: 'noopener noreferrer'
                            }, b.title)
                          ),
                          h('div', { className: 'cell-sub' }, b.projectName + ' / ' + b.sprintName)
                        ),
                        h('td', null,
                          h('span', { className: 'pill ' + b.status },
                            h('i', { className: 'pill-dot', 'aria-hidden': 'true' }),
                            status[b.status] || b.status
                          )
                        ),
                        h('td', null, b.creatorName || '姓名未获取'),
                        h('td', null,
                          h('span', { className: 'priority-tag' + (Number(b.pri) > 0 && Number(b.pri) <= 2 ? ' high' : '') }, 'P' + b.pri)
                        ),
                        h('td', { style: { whiteSpace: 'nowrap' } }, String(b.openedDate || '').slice(0, 10) || '—'),
                        h('td', {
                          style: {
                            whiteSpace: 'nowrap',
                            color: isAging ? 'var(--zq-danger-text)' : undefined,
                            fontWeight: isAging ? 620 : undefined
                          }
                        }, dAge === null ? '—' : dAge + '天')
                      );
                    })
                  )
                )
              ),

              !busy && !bugs.length && h('div', { className: 'empty-box' },
                h('span', null, t('当前无匹配问题')),
                (bugSprintFilter || state || owner || query || quickBugFilter) && h('button', {
                  type: 'button',
                  className: 'btn btn-soft',
                  onClick: clearAllBugFilters
                }, t('重置筛选'))
              ),

              h('div', { className: 'pagination-bar' },
                h('span', null, bugs.length ? `第 ${pageStart}–${pageEnd} 条，共 ${bugs.length} 条` : '共 0 条'),
                h('div', { className: 'pagination-controls' },
                  h('button', {
                    type: 'button',
                    className: 'btn btn-soft',
                    disabled: !page,
                    onClick: () => P(p => p - 1)
                  }, t('前一页')),
                  h('span', { style: { padding: '0 8px', fontWeight: 560, color: 'var(--zq-text-1)' } }, (page + 1) + ' / ' + totalPages),
                  h('button', {
                    type: 'button',
                    className: 'btn btn-soft',
                    disabled: (page + 1) * 30 >= bugs.length,
                    onClick: () => P(p => p + 1)
                  }, t('后一页'))
                )
              )
              ));
            })
          ),

          // Footer
          h('footer', { className: 'footer-meta' },
            data && h('span', null, t('数据更新时间') + '：' + formatTime(data.readAt)),
            h('details', null,
              h('summary', null, t('统计口径')),
              data && h('p', null, data.scope),
              h('p', null, t('数据持续持久化缓存；若未获取到新数据，则始终展示上一次成功采集的信息。需求关闭率不等同于交付验收，任务排除取消与父任务。'))
            )
          )
        )
      ),

      // Modal 1: Ignored Sprints Manager (<dialog closedby="any">)
      h(ModalDialog, {
        open: showIgnored,
        onClose: () => setShowIgnored(false),
        titleId: 'zq-ignored-dialog-title',
        className: 'compact'
      },
        h('div', { className: 'zq-dialog-head' },
          h('div', null,
            h('h2', { id: 'zq-ignored-dialog-title', className: 'zq-dialog-title' }, t('已忽略冲刺管理') + ' (' + (data?.ignoredSprints?.length || 0) + ')'),
            h('p', { className: 'zq-dialog-sub' }, '仅影响本机看板「跨项目冲刺总览」，线上问题仍会正常统计。')
          ),
          h('button', {
            type: 'button',
            className: 'btn btn-ghost',
            onClick: () => setShowIgnored(false),
            'aria-label': t('关闭弹窗')
          }, h(Glyph, { kind: 'close', size: 16 }))
        ),
        h('div', { className: 'zq-dialog-body' },
          (data?.ignoredSprints?.length || 0) > 4 && h('div', { className: 'search-box', style: { maxWidth: '100%', flex: 'none' } },
            h('span', { className: 'search-icon' }, h(Glyph, { kind: 'search', size: 14 })),
            h('input', {
              className: 'input',
              value: ignoredQuery,
              onChange: e => setIgnoredQuery(e.target.value),
              placeholder: t('搜索已忽略冲刺或项目'),
              'aria-label': t('搜索已忽略冲刺或项目')
            })
          ),
          filteredIgnored.length
            ? h('div', { className: 'dialog-list' },
                ...filteredIgnored.map(s =>
                  h('div', { key: s.id, className: 'dialog-row' },
                    h('div', { className: 'dialog-row-main' },
                      h('strong', { style: { fontSize: 13 } }, s.name || ('#' + s.id)),
                      h('span', { style: { fontSize: 11.5, color: 'var(--zq-text-2)' } }, (s.projectName || '未知项目') + ' · #' + s.id)
                    ),
                    h('button', {
                      type: 'button',
                      className: 'btn btn-soft',
                      disabled: saving || busy,
                      onClick: () => changeIgnore(s, false)
                    }, t('恢复关注'))
                  )
                )
              )
            : h('div', { className: 'empty-box' }, t('当前没有已忽略的冲刺'))
        )
      ),

      // Modal 2: Sprint Detail Inspector (<dialog closedby="any">)
      h(ModalDialog, {
        open: !!selectedSprint,
        onClose: () => setDetailSprintId(null),
        titleId: 'zq-detail-dialog-title'
      },
        selectedSprint && (() => {
          const s = selectedSprint;
          const leafTasks = tasks(s.tasks) || [];
          const sprintStories = s.stories || [];
          const rawSprintBugs = (s.bugs || []).map(b => ({
            ...b,
            creatorName: creatorById.get(String(b.id)) || who(b.openedBy)
          }));
          const visibleSprintBugs = (detailOnlyOpenBugs
            ? rawSprintBugs.filter(b => b.status !== 'closed')
            : rawSprintBugs
          ).slice().sort((a, b) => (Number(a.pri) || 9) - (Number(b.pri) || 9) || String(a.openedDate || '').localeCompare(String(b.openedDate || '')));

          return h(React.Fragment, null,
            h('div', { className: 'zq-dialog-head' },
              h('div', { style: { minWidth: 0 } },
                h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } },
                  h('h2', { id: 'zq-detail-dialog-title', className: 'zq-dialog-title' }, s.name),
                  h('span', { className: 'pill ' + s.status }, h('i', { className: 'pill-dot', 'aria-hidden': 'true' }), status[s.status] || s.status),
                  delayed(s) && h('span', { className: 'pill delayed' }, h('i', { className: 'pill-dot', 'aria-hidden': 'true' }), t('延期'))
                ),
                h('div', { className: 'zq-dialog-sub' },
                  h('span', null, s.projectName),
                  h('span', null, '· ' + (s.begin || '—') + ' ~ ' + (s.end === '0000-00-00' ? '—' : s.end || '—')),
                  s.PM && h('span', null, '· PM ' + s.PM),
                  s.QD && h('span', null, '· QA ' + s.QD)
                )
              ),
              h('div', { style: { display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 } },
                h('a', {
                  className: 'btn btn-soft',
                  href: 'http://pm.kuaishang.cn/zentao/execution-view-' + s.id + '.html',
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  style: { textDecoration: 'none' }
                },
                  t('在禅道打开'),
                  h(Glyph, { kind: 'external', size: 13 })
                ),
                h('button', {
                  type: 'button',
                  className: 'btn btn-ghost',
                  onClick: () => setDetailSprintId(null),
                  'aria-label': t('关闭弹窗')
                }, h(Glyph, { kind: 'close', size: 16 }))
              )
            ),

            h('div', { className: 'zq-dialog-body' },
              h('div', { className: 'dialog-summary-grid' },
                h('div', { className: 'dialog-mini-card' },
                  h('span', { className: 'dialog-mini-label' }, t('需求关闭')),
                  progress(s.stories, x => x.status === 'closed', '暂无需求')
                ),
                h('div', { className: 'dialog-mini-card' },
                  h('span', { className: 'dialog-mini-label' }, t('任务完成')),
                  progress(tasks(s.tasks), x => ['done', 'closed'].includes(x.status), '暂无任务')
                ),
                h('div', { className: 'dialog-mini-card' },
                  h('span', { className: 'dialog-mini-label' }, '缺陷统计'),
                  h('div', { style: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' } },
                    h('span', { className: 'pill active' }, `待解决 ${rawSprintBugs.filter(b => b.status === 'active').length}`),
                    h('span', { className: 'pill resolved' }, `待验证 ${rawSprintBugs.filter(b => b.status === 'resolved').length}`),
                    h('span', { className: 'pill closed' }, `已关闭 ${rawSprintBugs.filter(b => b.status === 'closed').length}`)
                  )
                )
              ),

              h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' } },
                h('div', {
                  className: 'zq-tablist',
                  role: 'tablist',
                  'aria-label': '冲刺明细分类',
                  onKeyDown: e => handleTablistKeyDown(e, ['bugs', 'stories', 'tasks'], detailTab, setDetailTab, detailTabRefs)
                },
                  h('button', {
                    ref: el => { detailTabRefs.current.bugs = el; },
                    type: 'button',
                    id: 'zq-detail-tab-bugs',
                    role: 'tab',
                    className: 'zq-tab',
                    'aria-selected': detailTab === 'bugs',
                    onClick: () => setDetailTab('bugs')
                  }, t('缺陷'), h('span', { className: 'zq-tab-badge' }, rawSprintBugs.length)),
                  h('button', {
                    ref: el => { detailTabRefs.current.stories = el; },
                    type: 'button',
                    id: 'zq-detail-tab-stories',
                    role: 'tab',
                    className: 'zq-tab',
                    'aria-selected': detailTab === 'stories',
                    onClick: () => setDetailTab('stories')
                  }, t('需求'), h('span', { className: 'zq-tab-badge' }, sprintStories.length)),
                  h('button', {
                    ref: el => { detailTabRefs.current.tasks = el; },
                    type: 'button',
                    id: 'zq-detail-tab-tasks',
                    role: 'tab',
                    className: 'zq-tab',
                    'aria-selected': detailTab === 'tasks',
                    onClick: () => setDetailTab('tasks')
                  }, t('任务'), h('span', { className: 'zq-tab-badge' }, leafTasks.length))
                ),
                detailTab === 'bugs' && h('button', {
                  type: 'button',
                  className: 'filter-chip active',
                  'aria-pressed': detailOnlyOpenBugs,
                  onClick: () => setDetailOnlyOpenBugs(v => !v)
                }, t('仅看未关闭') + ' (' + rawSprintBugs.filter(b => b.status !== 'closed').length + ')')
              ),

              // Detail Panel 1: Bugs
              h('div', {
                role: 'tabpanel',
                'aria-labelledby': 'zq-detail-tab-bugs',
                hidden: detailTab !== 'bugs'
              },
                visibleSprintBugs.length
                  ? h('div', { className: 'dialog-list' },
                      ...visibleSprintBugs.map(b =>
                        h('div', { key: b.id, className: 'dialog-row' },
                          h('div', { className: 'dialog-row-main' },
                            h('div', { className: 'title-row' },
                              h('span', { className: 'bug-id-tag' }, '#' + b.id),
                              isOnlineFlag(b) && h('span', { className: 'pill online-tag' }, t('线上')),
                              h('a', {
                                className: 'item-title',
                                href: 'http://pm.kuaishang.cn/zentao/bug-view-' + b.id + '.html',
                                target: '_blank',
                                rel: 'noopener noreferrer'
                              }, b.title)
                            ),
                            h('div', { className: 'dialog-row-meta' },
                              h('span', null, '创建: ' + b.creatorName),
                              b.assignedTo && b.assignedTo !== 'closed' && h('span', null, '指派: ' + who(b.assignedTo)),
                              b.openedDate && h('span', null, String(b.openedDate).slice(0, 10)),
                              age(b) !== null && h('span', null, age(b) + '天')
                            )
                          ),
                          h('div', { style: { display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 } },
                            h('span', { className: 'priority-tag' + (Number(b.pri) > 0 && Number(b.pri) <= 2 ? ' high' : '') }, 'P' + b.pri),
                            h('span', { className: 'pill ' + b.status }, h('i', { className: 'pill-dot', 'aria-hidden': 'true' }), status[b.status] || b.status)
                          )
                        )
                      )
                    )
                  : h('div', { className: 'empty-box' }, t('暂无记录'))
              ),

              // Detail Panel 2: Stories
              h('div', {
                role: 'tabpanel',
                'aria-labelledby': 'zq-detail-tab-stories',
                hidden: detailTab !== 'stories'
              },
                sprintStories.length
                  ? h('div', { className: 'dialog-list' },
                      ...sprintStories.map(st =>
                        h('div', { key: st.id, className: 'dialog-row' },
                          h('div', { className: 'dialog-row-main' },
                            h('div', { className: 'title-row' },
                              h('span', { className: 'bug-id-tag' }, '#' + st.id),
                              h('a', {
                                className: 'item-title',
                                href: 'http://pm.kuaishang.cn/zentao/story-view-' + st.id + '.html',
                                target: '_blank',
                                rel: 'noopener noreferrer'
                              }, st.title)
                            ),
                            h('div', { className: 'dialog-row-meta' },
                              st.stage && h('span', null, t('阶段') + ': ' + (storyStages[st.stage] || st.stage))
                            )
                          ),
                          h('div', { style: { display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 } },
                            st.pri && h('span', { className: 'priority-tag' + (Number(st.pri) > 0 && Number(st.pri) <= 2 ? ' high' : '') }, 'P' + st.pri),
                            h('span', { className: 'pill ' + (st.status === 'closed' ? 'closed' : st.status === 'active' ? 'doing' : '') },
                              h('i', { className: 'pill-dot', 'aria-hidden': 'true' }),
                              status[st.status] || st.status
                            )
                          )
                        )
                      )
                    )
                  : h('div', { className: 'empty-box' }, t('暂无记录'))
              ),

              // Detail Panel 3: Tasks
              h('div', {
                role: 'tabpanel',
                'aria-labelledby': 'zq-detail-tab-tasks',
                hidden: detailTab !== 'tasks'
              },
                leafTasks.length
                  ? h('div', { className: 'dialog-list' },
                      ...leafTasks.map(tk =>
                        h('div', { key: tk.id, className: 'dialog-row' },
                          h('div', { className: 'dialog-row-main' },
                            h('div', { className: 'title-row' },
                              h('span', { className: 'bug-id-tag' }, '#' + tk.id),
                              h('a', {
                                className: 'item-title',
                                href: 'http://pm.kuaishang.cn/zentao/task-view-' + tk.id + '.html',
                                target: '_blank',
                                rel: 'noopener noreferrer'
                              }, tk.name)
                            ),
                            h('div', { className: 'dialog-row-meta' },
                              h('span', null, t('负责人') + ': ' + who(tk.assignedTo)),
                              (tk.consumed || tk.left) && h('span', null, `消耗 ${tk.consumed || 0}h / 剩余 ${tk.left || 0}h`),
                              tk.deadline && tk.deadline !== '0000-00-00' && h('span', null, '截止 ' + tk.deadline)
                            )
                          ),
                          h('span', { className: 'pill ' + tk.status }, h('i', { className: 'pill-dot', 'aria-hidden': 'true' }), status[tk.status] || tk.status)
                        )
                      )
                    )
                  : h('div', { className: 'empty-box' }, t('暂无记录'))
              )
            )
          );
        })()
      )
    );
   }

   ctx.slots.inject('main',()=>ctx.slots.register({name:'main',key:'zentao-quality'},App));
   ctx.slots.inject('sidebar.panellist',()=>ctx.slots.register({name:'sidebar.panellist',id:'zentao-quality',order:16,label:()=>t('禅道质量看板')},Icon));
  }};
 }
});
