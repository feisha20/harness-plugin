window.__ModuleLoader__.load({
 id:'@local/zentao-dashboard',
 factory(require){
  const React=require('react'),h=React.createElement;
  const status={doing:'进行中',wait:'未开始',suspended:'已挂起',pause:'已暂停',done:'已完成',cancel:'已取消',active:'待解决',resolved:'待验证',closed:'已关闭'};
  const who=v=>typeof v==='object'&&v?(v.realname||v.account||'未指派'):(v||'未指派');
  const age=b=>{const n=Date.parse(String(b.openedDate).replace(' ','T')+'+08:00');return Number.isFinite(n)?Math.max(0,Math.floor((Date.now()-n)/86400000)):null;};
  function tasks(a){if(!a)return null;const parents=new Set(a.filter(x=>Number(x.parent)>0).map(x=>String(x.parent)));return a.filter(x=>x.status!=='cancel'&&!['1','true'].includes(String(x.isParent))&&!parents.has(String(x.id)));}

  const css=`
.zq {
  --zq-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  --zq-primary: var(--dsw-alias-brand-primary, #2563eb);
  --zq-primary-bg: color-mix(in srgb, var(--zq-primary) 10%, transparent);
  --zq-primary-border: color-mix(in srgb, var(--zq-primary) 28%, transparent);
  --zq-bg: var(--dsw-alias-bg-base, #ffffff);
  --zq-card: var(--dsw-alias-bg-layer-1, #ffffff);
  --zq-surface: var(--dsw-alias-bg-layer-2, #f8fafc);
  --zq-border: var(--dsw-alias-border-l1, #e2e8f0);
  --zq-border-subtle: var(--dsw-alias-border-l2, #cbd5e1);
  --zq-text-1: var(--dsw-alias-label-primary, #0f172a);
  --zq-text-2: var(--dsw-alias-label-secondary, #64748b);
  --zq-text-muted: var(--dsw-alias-label-tertiary, #94a3b8);
  --zq-success: var(--dsw-alias-state-success-primary, #10b981);
  --zq-warn: var(--dsw-alias-state-warn-primary, #f59e0b);
  --zq-error: var(--dsw-alias-state-error-primary, #ef4444);
  --zq-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --zq-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.05);
  --zq-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05);
  --zq-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --zq-radius-lg: 10px;
  --zq-radius-md: 8px;
  --zq-radius-sm: 6px;

  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 14px 20px;
  background: var(--zq-bg);
  color: var(--zq-text-1);
  font: 13px/1.45 var(--zq-font);
  box-sizing: border-box;
  font-variant-numeric: tabular-nums;
  -webkit-font-smoothing: antialiased;
}

.zq * { box-sizing: border-box; }

/* Header & Identity */
.zq .header-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.zq .identity {
  display: flex;
  align-items: center;
  gap: 10px;
}
.zq .identity-mark {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: var(--zq-radius-sm);
  background: linear-gradient(135deg, color-mix(in srgb, var(--zq-primary) 14%, transparent), color-mix(in srgb, var(--zq-primary) 4%, transparent));
  border: 1px solid var(--zq-primary-border);
  color: var(--zq-primary);
  box-shadow: var(--zq-shadow-sm);
}
.zq h1 {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.3px;
  margin: 0;
  color: var(--zq-text-1);
  line-height: 1.2;
}
.zq .sub-title {
  font-size: 11.5px;
  color: var(--zq-text-2);
  margin: 2px 0 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Actions & Buttons */
.zq .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1;
  padding: 6px 12px;
  border-radius: var(--zq-radius-sm);
  border: 1px solid var(--zq-border);
  background: var(--zq-card);
  color: var(--zq-text-1);
  box-shadow: var(--zq-shadow-sm);
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 30px;
  user-select: none;
}
.zq .btn:hover:not(:disabled) {
  background: var(--zq-surface);
  border-color: var(--zq-border-subtle);
  transform: translateY(-1px);
  box-shadow: var(--zq-shadow);
}
.zq .btn:active:not(:disabled) {
  transform: translateY(0);
}
.zq .btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.zq .btn-primary {
  background: var(--zq-primary);
  border-color: var(--zq-primary);
  color: #ffffff;
}
.zq .btn-primary:hover:not(:disabled) {
  background: color-mix(in srgb, var(--zq-primary) 88%, #000);
  border-color: color-mix(in srgb, var(--zq-primary) 88%, #000);
  color: #ffffff;
}
.zq .btn-ghost {
  background: transparent;
  border-color: transparent;
  box-shadow: none;
  color: var(--zq-text-2);
  padding: 4px 8px;
  min-height: 26px;
  font-size: 12px;
}
.zq .btn-ghost:hover:not(:disabled) {
  background: var(--zq-surface);
  color: var(--zq-text-1);
  border-color: transparent;
  transform: none;
}

/* Ruixen Stats Grid (Compact) */
.zq .metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 8px;
}
.zq .metric-card {
  position: relative;
  border: 1px solid var(--zq-border);
  border-radius: var(--zq-radius-md);
  padding: 8px 12px;
  background: var(--zq-card);
  box-shadow: var(--zq-shadow-sm);
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.zq .metric-card:hover {
  border-color: var(--zq-border-subtle);
  box-shadow: var(--zq-shadow);
  transform: translateY(-1px);
}
.zq .metric-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.zq .metric-label {
  font-size: 11.5px;
  font-weight: 500;
  color: var(--zq-text-2);
  letter-spacing: -0.1px;
  white-space: nowrap;
}
.zq .metric-val {
  font-size: 20px;
  line-height: 1.15;
  font-weight: 600;
  letter-spacing: -0.3px;
  color: var(--zq-text-1);
}
.zq .metric-val.warn { color: var(--zq-warn); }
.zq .metric-val.error { color: var(--zq-error); }
.zq .metric-icon-wrap {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: var(--zq-radius-sm);
  background: var(--zq-surface);
  border: 1px solid var(--zq-border);
  color: var(--zq-text-2);
}
.zq .metric-card.warn .metric-icon-wrap {
  background: color-mix(in srgb, var(--zq-warn) 10%, transparent);
  border-color: color-mix(in srgb, var(--zq-warn) 25%, transparent);
  color: var(--zq-warn);
}
.zq .metric-card.error .metric-icon-wrap {
  background: color-mix(in srgb, var(--zq-error) 10%, transparent);
  border-color: color-mix(in srgb, var(--zq-error) 25%, transparent);
  color: var(--zq-error);
}
.zq .metric-card.primary .metric-icon-wrap {
  background: var(--zq-primary-bg);
  border-color: var(--zq-primary-border);
  color: var(--zq-primary);
}

/* Signal / Pill Bar (Compact) */
.zq .signal-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 4px 10px;
  background: var(--zq-surface);
  border: 1px solid var(--zq-border);
  border-radius: var(--zq-radius-sm);
  margin-bottom: 12px;
  font-size: 11.5px;
  color: var(--zq-text-2);
}
.zq .signal-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 1px 7px;
  background: var(--zq-card);
  border: 1px solid var(--zq-border);
  border-radius: 9999px;
  box-shadow: 0 1px 1px 0 rgb(0 0 0 / 0.03);
}
.zq .signal-item strong {
  font-size: 12px;
  font-weight: 550;
  color: var(--zq-text-1);
}

/* Sections & Dashboard Card */
.zq .dashboard-section {
  border: 1px solid var(--zq-border);
  border-radius: var(--zq-radius-md);
  background: var(--zq-card);
  margin-bottom: 14px;
  box-shadow: var(--zq-shadow-sm);
  overflow: visible;
}
.zq .section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--zq-border);
  background: var(--zq-card);
  border-top-left-radius: var(--zq-radius-md);
  border-top-right-radius: var(--zq-radius-md);
  flex-wrap: wrap;
}
.zq .section-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.zq .section-icon {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: var(--zq-radius-sm);
  background: var(--zq-surface);
  color: var(--zq-text-2);
}
.zq .section-title {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.2px;
  margin: 0;
  color: var(--zq-text-1);
}
.zq .badge-count {
  font-size: 11px;
  font-weight: 500;
  padding: 1px 6px;
  border-radius: 9999px;
  background: var(--zq-surface);
  border: 1px solid var(--zq-border);
  color: var(--zq-text-2);
}

/* Tables (Ruixen styled table) */
.zq .table-container {
  overflow-x: auto;
}
.zq table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 12.5px;
}
.zq th {
  padding: 7px 12px;
  background: var(--zq-surface);
  color: var(--zq-text-2);
  font-size: 11.5px;
  font-weight: 500;
  letter-spacing: 0.1px;
  border-bottom: 1px solid var(--zq-border);
  white-space: nowrap;
}
.zq td {
  padding: 7px 12px;
  border-bottom: 1px solid var(--zq-border);
  vertical-align: middle;
  transition: background 0.15s;
}
.zq tbody tr:last-child td {
  border-bottom: none;
}
.zq tbody tr:hover td {
  background: color-mix(in srgb, var(--zq-surface) 60%, var(--zq-card));
}
.zq td a.item-title {
  font-weight: 500;
  color: var(--zq-text-1);
  text-decoration: none;
  transition: color 0.15s;
  display: inline-block;
  line-height: 1.35;
}
.zq td a.item-title:hover {
  color: var(--zq-primary);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.zq .cell-sub {
  font-size: 11px;
  color: var(--zq-text-2);
  margin-top: 1px;
  line-height: 1.25;
}

/* Badges & Status Pills */
.zq .pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 7px;
  border-radius: 9999px;
  border: 1px solid var(--zq-border);
  background: var(--zq-surface);
  color: var(--zq-text-2);
  white-space: nowrap;
  line-height: 1.3;
}
.zq .pill-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}
.zq .pill.doing, .zq .pill.resolved {
  color: var(--zq-primary);
  background: color-mix(in srgb, var(--zq-primary) 8%, transparent);
  border-color: color-mix(in srgb, var(--zq-primary) 22%, transparent);
}
.zq .pill.active, .zq .pill.delayed {
  color: var(--zq-warn);
  background: color-mix(in srgb, var(--zq-warn) 10%, transparent);
  border-color: color-mix(in srgb, var(--zq-warn) 25%, transparent);
}
.zq .pill.closed, .zq .pill.ontrack {
  color: var(--zq-success);
  background: color-mix(in srgb, var(--zq-success) 8%, transparent);
  border-color: color-mix(in srgb, var(--zq-success) 22%, transparent);
}

/* Priority tags */
.zq .priority-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10.5px;
  font-weight: 550;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--zq-surface);
  border: 1px solid var(--zq-border);
  color: var(--zq-text-2);
}
.zq .priority-tag.high {
  background: color-mix(in srgb, var(--zq-error) 10%, transparent);
  border-color: color-mix(in srgb, var(--zq-error) 22%, transparent);
  color: var(--zq-error);
}

/* Progress bar (Ruixen style) */
.zq .progress-box {
  width: 110px;
  max-width: 100%;
}
.zq .progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3px;
  font-size: 11px;
}
.zq .progress-info small {
  color: var(--zq-text-2);
  font-size: 10.5px;
}
.zq .progress-track {
  height: 4px;
  background: var(--zq-surface);
  border: 1px solid var(--zq-border);
  border-radius: 9999px;
  overflow: hidden;
}
.zq .progress-fill {
  height: 100%;
  border-radius: 9999px;
  background: var(--zq-primary);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.zq .progress-box.complete .progress-fill {
  background: var(--zq-success);
}

/* Toolbar & Filters (Ruixen Flexi filter bar) */
.zq .filter-toolbar {
  padding: 8px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--zq-border);
  background: var(--zq-card);
  position: relative;
  z-index: 20;
}
.zq .filter-inputs {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  flex: 1;
}
.zq .input {
  font-family: inherit;
  font-size: 12.5px;
  border: 1px solid var(--zq-border);
  border-radius: var(--zq-radius-sm);
  padding: 4px 10px;
  background: var(--zq-surface);
  color: var(--zq-text-1);
  min-height: 29px;
  min-width: 200px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.zq .input:focus {
  outline: none;
  border-color: var(--zq-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--zq-primary) 15%, transparent);
}

/* Custom Ruixen Dropdown Select */
.zq .custom-select-wrap {
  position: relative;
  display: inline-block;
  user-select: none;
}
.zq .custom-select-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid var(--zq-border);
  border-radius: var(--zq-radius-sm);
  padding: 4px 9px;
  background: var(--zq-surface);
  color: var(--zq-text-1);
  min-height: 29px;
  cursor: pointer;
  box-shadow: var(--zq-shadow-sm);
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}
.zq .custom-select-trigger:hover {
  background: color-mix(in srgb, var(--zq-surface) 70%, var(--zq-card));
  border-color: var(--zq-border-subtle);
}
.zq .custom-select-trigger.open {
  border-color: var(--zq-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--zq-primary) 15%, transparent);
  background: var(--zq-card);
}
.zq .custom-select-arrow {
  color: var(--zq-text-muted);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: grid;
  place-items: center;
}
.zq .custom-select-trigger.open .custom-select-arrow {
  transform: rotate(180deg);
  color: var(--zq-primary);
}
.zq .custom-select-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 100%;
  max-height: 240px;
  overflow-y: auto;
  background: var(--zq-card);
  border: 1px solid var(--zq-border);
  border-radius: var(--zq-radius-sm);
  padding: 4px;
  box-shadow: var(--zq-shadow-lg);
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 2px;
  animation: zqMenuIn 0.15s cubic-bezier(0.16, 1, 0.3, 1);
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
  padding: 5px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 450;
  color: var(--zq-text-1);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
  white-space: nowrap;
}
.zq .custom-select-option:hover {
  background: var(--zq-surface);
  color: var(--zq-primary);
}
.zq .custom-select-option.selected {
  background: var(--zq-primary-bg);
  color: var(--zq-primary);
  font-weight: 500;
}
.zq .custom-select-check {
  color: var(--zq-primary);
  display: grid;
  place-items: center;
}

.zq .filter-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  color: var(--zq-text-2);
}

/* Pagination */
.zq .pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  background: var(--zq-card);
  border-top: 1px solid var(--zq-border);
  font-size: 12px;
  color: var(--zq-text-2);
  border-bottom-left-radius: var(--zq-radius-md);
  border-bottom-right-radius: var(--zq-radius-md);
}

/* Notice / Alerts */
.zq .alert-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 12px;
  border-radius: var(--zq-radius-sm);
  margin-bottom: 12px;
  font-size: 12.5px;
  border: 1px solid var(--zq-border);
  background: var(--zq-surface);
}
.zq .alert-banner.error {
  background: color-mix(in srgb, var(--zq-error) 8%, transparent);
  border-color: color-mix(in srgb, var(--zq-error) 22%, transparent);
  color: var(--zq-error);
}
.zq .alert-banner.warn {
  background: color-mix(in srgb, var(--zq-warn) 8%, transparent);
  border-color: color-mix(in srgb, var(--zq-warn) 22%, transparent);
  color: var(--zq-warn);
}
.zq .empty-box {
  padding: 30px 16px;
  text-align: center;
  color: var(--zq-text-muted);
  font-size: 12.5px;
}

/* Footer meta */
.zq .footer-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 8px 4px 16px;
  font-size: 11.5px;
  color: var(--zq-text-muted);
}
.zq .footer-meta details summary {
  cursor: pointer;
  color: var(--zq-text-2);
}
.zq .footer-meta details[open] p {
  margin: 4px 0 2px;
}

@media(max-width: 1080px) {
  .zq { padding: 12px 14px; }
  .zq .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media(max-width: 640px) {
  .zq .metrics { grid-template-columns: 1fr; }
  .zq .filter-inputs { width: 100%; }
  .zq .input { min-width: 100%; }
}
@media(prefers-reduced-motion: reduce) {
  .zq * { transition: none !important; animation: none !important; }
}
`;

  function Glyph({kind='overview', size=16}) {
   const paths={
     overview:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
     risk:'M12 3 2 21h20L12 3z M12 9v5 M12 17v1',
     bug:'M8 8h8v9a4 4 0 0 1-8 0V8z M9 8V6a3 3 0 0 1 6 0v2 M3 10h5 M16 10h5 M3 16h5 M16 16h5',
     online:'M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3z M8 12l3 3 5-6',
     refresh:'M20 7v5h-5 M4 17v-5h5 M6 7a7 7 0 0 1 12-2l2 3 M4 16l2 3a7 7 0 0 0 12-2',
     chevronDown:'M6 9l6 6 6-6',
     check:'M20 6L9 17l-5-5'
   };
   return h('svg',{width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.6,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},h('path',{d:paths[kind]||paths.overview}));
  }

  function Icon({size=20}){
    return h('svg',{width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.7,'aria-hidden':true},
      h('rect',{x:3,y:3,width:18,height:18,rx:4}),
      h('path',{d:'M7 8h10M7 12h4M7 16h4m3-2 2 2 3-4'})
    );
  }

  // Ruixen-styled Custom Select Component
  function CustomSelect({ value, onChange, options, placeholder, ariaLabel }) {
    const [open, setOpen] = React.useState(false);
    const wrapRef = React.useRef(null);

    React.useEffect(() => {
      function handleClickOutside(e) {
        if (wrapRef.current && !wrapRef.current.contains(e.target)) {
          setOpen(false);
        }
      }
      if (open) {
        document.addEventListener('pointerdown', handleClickOutside);
        return () => document.removeEventListener('pointerdown', handleClickOutside);
      }
    }, [open]);

    const activeOption = options.find(o => o.value === value);
    const currentLabel = activeOption ? activeOption.label : (placeholder || '请选择');

    return h('div', { className: 'custom-select-wrap', ref: wrapRef },
      h('button', {
        type: 'button',
        className: 'custom-select-trigger' + (open ? ' open' : ''),
        onClick: () => setOpen(o => !o),
        'aria-label': ariaLabel,
        'aria-expanded': open
      },
        h('span', null, currentLabel),
        h('span', { className: 'custom-select-arrow' },
          h(Glyph, { kind: 'chevronDown', size: 13 })
        )
      ),
      open && h('div', { className: 'custom-select-menu', role: 'listbox' },
        options.map(opt => {
          const isSelected = opt.value === value;
          return h('div', {
            key: opt.value,
            className: 'custom-select-option' + (isSelected ? ' selected' : ''),
            onClick: () => {
              onChange(opt.value);
              setOpen(false);
            },
            role: 'option',
            'aria-selected': isSelected
          },
            h('span', null, opt.label),
            isSelected && h('span', { className: 'custom-select-check' },
              h(Glyph, { kind: 'check', size: 13 })
            )
          );
        })
      )
    );
  }

  return {inject:['slots','locale'],apply(ctx){
   const text=['禅道质量看板','全局总览 · 仅关注未关闭冲刺','刷新全局','正在汇总全部冲刺…','正在后台刷新最新数据…','汇总失败，保留上次成功数据','未关闭冲刺','延期冲刺','未关闭缺陷','线上待处理','待验证','高优先级未关闭','超过7天未解决','数据覆盖不完整，以下数字仅来自已成功读取的范围','跨项目冲刺总览','全部冲刺同时展示，延期优先；无需切换冲刺。','冲刺 / 项目','状态','计划截止','需求关闭','任务完成','待解决 / 待验证','风险','未评估','无数据','延期','分项读取失败','暂无未关闭冲刺','最近30天线上问题','仅展示未关闭冲刺内、最近30天创建且线上标记为1的问题，包含已关闭记录。','全部待处理','线上标记','标题候选','全部状态','全部创建人','搜索编号、标题或冲刺','问题 / 所属冲刺','优先级','创建日期','问题龄期','未指派','条','前一页','后一页','当前无匹配问题','首次汇总需要读取全部项目和未关闭冲刺，请稍候。','数据更新时间','数据持续持久化缓存；若未获取到新数据，则始终展示上一次成功采集的信息。需求关闭率不等同于交付验收，任务排除取消与父任务。','全部项目','未知','正常','部分数据','重试','待解决','已关闭','当前筛选','创建人','操作','忽略','已忽略','取消忽略','保存中…'];
   const dict=Object.fromEntries(text.map(x=>[x,x]));
   for(const label of ['关注范围','仅显示关注冲刺','需跟进计划','待解决与待验证','当前关注范围内','线上问题（近30天）','含已忽略冲刺','筛选','统计口径','更新'])dict[label]=label;
   dict['全部未关闭冲刺内最近30天创建的线上问题，包含已忽略冲刺及已关闭问题。']='全部未关闭冲刺内最近30天创建的线上问题，包含已忽略冲刺及已关闭问题。';
   ctx.effect(()=>ctx.locale.register('zentaoDashboard','zh',dict));
   ctx.effect(()=>ctx.locale.register('zentaoDashboard','en',dict));
   const t=ctx.locale.bind('zentaoDashboard');

   function App(){
    React.useSyncExternalStore(ctx.locale.subscribe.bind(ctx.locale),ctx.locale.getSnapshot.bind(ctx.locale));
    const [data,D]=React.useState(null),[error,F]=React.useState(''),[busy,L]=React.useState(true),[version,V]=React.useState(0);
    const [saving,Z]=React.useState(false),[showIgnored,H]=React.useState(false);
    
    // 初始化时尝试立即从本地缓存读取上次成功的数据，避免出现全白闪烁
    React.useEffect(()=>{
      try {
        const local = localStorage.getItem('dsh_zentao_snapshot');
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed && typeof parsed === 'object' && parsed.sprints) {
            D(parsed);
          }
        }
      } catch(e) {}
    }, []);

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
        V(v=>v+1);
      }catch(e){F(e.message);}finally{Z(false);} 
    }

    const [state,S]=React.useState(''),[owner,O]=React.useState(''),[query,Q]=React.useState(''),[page,P]=React.useState(0);
    React.useEffect(()=>{
      const c=new AbortController();
      L(true);F('');
      fetch('/api/zentao-dashboard?action=global',{signal:c.signal})
        .then(async r=>{
          const d=await r.json();
          if(!r.ok)throw Error(d.error||'读取失败');
          return d;
        })
        .then(freshData=>{
          D(freshData);
          try { localStorage.setItem('dsh_zentao_snapshot', JSON.stringify(freshData)); } catch(e){}
        })
        .catch(e=>{
          if(e.name!=='AbortError')F(e.message);
        })
        .finally(()=>{
          if(!c.signal.aborted)L(false);
        });
      return()=>c.abort();
    },[version]);

    React.useEffect(()=>P(0),[state,owner,query]);

    const sprints=data?.sprints||[],summary=data?.summary||{};
    const base=data?.recentOnline?.items||[];
    const owners=[...new Set(base.map(b=>(b.creatorName||'姓名未获取')))].sort();
    const bugs=base.filter(b=>(!state||b.status===state)&&(!owner||(b.creatorName||'姓名未获取')===owner)&&(!query||(b.id+' '+b.title+' '+b.sprintName+' '+b.projectName).toLowerCase().includes(query.toLowerCase())))
      .sort((a,b)=>(Number(a.pri)||9)-(Number(b.pri)||9)||String(a.openedDate).localeCompare(String(b.openedDate)));
    const today=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'});
    const delayed=s=>/^\d{4}-\d{2}-\d{2}$/.test(s.end)&&s.end!=='0000-00-00'&&s.end<today;

    function progress(a,pred){
      if(!a)return h('span',{style:{color:'var(--zq-text-muted)'}},t('未评估'));
      const n=a.filter(pred).length,pct=a.length?Math.round(100*n/a.length):0;
      return h('div',{className:'progress-box'+(pct===100?' complete':'')},
        h('div',{className:'progress-info'},
          h('span',null,n+' / '+a.length),
          h('small',null,a.length?pct+'%':'—')
        ),
        h('div',{className:'progress-track',role:'progressbar','aria-valuemin':0,'aria-valuemax':100,'aria-valuenow':pct,'aria-label':n+' / '+a.length},
          h('div',{className:'progress-fill',style:{width:pct+'%'}})
        )
      );
    }

    const metric=(label,key,variant='primary')=>h('div',{
      className:'metric-card '+variant,
      key,
      title:t(({sprints:'仅显示关注冲刺',delayed:'需跟进计划',openBugs:'待解决与待验证',onlineOpen:'当前关注范围内'})[key])
    },
      h('div',{className:'metric-info'},
        h('span',{className:'metric-label'},t(label)),
        h('div',{className:'metric-val '+variant},data?summary[key]:'—')
      ),
      h('span',{className:'metric-icon-wrap'},h(Glyph,{kind:({sprints:'overview',delayed:'risk',openBugs:'bug',onlineOpen:'online'})[key],size:16}))
    );

    return h('div',{className:'zq'},
      h('style',null,css),

      // Header Bar
      h('div',{className:'header-wrap'},
        h('div',{className:'identity'},
          h('span',{className:'identity-mark'},h(Glyph,{kind:'online',size:22})),
          h('div',null,
            h('h1',null,t('禅道质量看板')),
            h('p',{className:'sub-title'},t('全局总览 · 仅关注未关闭冲刺'))
          )
        ),
        h('button',{
          className:'btn btn-primary',
          disabled:busy||saving,
          onClick:()=>V(v=>v+1)
        },
          h(Glyph,{kind:'refresh',size:14}),
          t(busy?'正在汇总全部冲刺…':'刷新全局')
        )
      ),

      // Feedback / Alert states
      error&&h('div',{className:'alert-banner error',role:'alert'},
        h('div',null,t('汇总失败，保留上次成功数据')+'：'+error),
        h('button',{className:'btn btn-ghost',onClick:()=>V(v=>v+1),style:{marginLeft:'auto'}},t('重试'))
      ),
      busy&&!data&&h('div',{className:'alert-banner',role:'status'},
        t('首次汇总需要读取全部项目和未关闭冲刺，请稍候。')
      ),
      busy&&data&&h('div',{className:'alert-banner',style:{background:'var(--zq-surface)',borderColor:'var(--zq-border)',color:'var(--zq-text-2)'},role:'status'},
        h('span',{style:{display:'inline-flex',alignItems:'center',gap:6}},
          h(Glyph,{kind:'refresh',size:13}),
          t('正在后台刷新最新数据…')
        )
      ),
      data&&!data.complete&&h('div',{className:'alert-banner warn',role:'alert'},
        h('div',null,
          h('div',{style:{fontWeight:500,marginBottom:4}},t('数据覆盖不完整，以下数字仅来自已成功读取的范围')),
          ...(data.warnings||[]).map((x,i)=>h('div',{key:i,style:{fontSize:12}},x))
        )
      ),

      // Ruixen Stats Grid
      h('div',{className:'metrics'},
        metric('未关闭冲刺','sprints','primary'),
        metric('延期冲刺','delayed','warn'),
        metric('未关闭缺陷','openBugs','primary'),
        metric('线上待处理','onlineOpen','error')
      ),

      // Signal Strip Pill Bar
      h('div',{className:'signal-bar'},
        ...[['待验证','pendingVerification'],['高优先级未关闭','highPriority'],['超过7天未解决','aging']].map(([label,key])=>
          h('span',{className:'signal-item',key},
            h('span',null,t(label)),
            h('strong',null,data?summary[key]:'—')
          )
        )
      ),

      // Section 1: Sprints Overview
      h('div',{className:'dashboard-section'},
        h('div',{className:'section-header'},
          h('div',{className:'section-title-wrap'},
            h('span',{className:'section-icon'},h(Glyph,{kind:'overview',size:15})),
            h('h2',{className:'section-title'},t('跨项目冲刺总览')),
            h('span',{className:'badge-count'},sprints.length)
          ),
          h('button',{
            className:'btn btn-ghost',
            onClick:()=>H(v=>!v),
            'aria-expanded':showIgnored
          },
            t('已忽略')+' ('+(data?.ignoredSprints?.length||0)+')'
          )
        ),
        showIgnored&&h('div',{className:'alert-banner',style:{margin:'12px 20px',display:'block'}},
          h('div',{style:{fontWeight:500,marginBottom:8}},'已忽略冲刺列表：'),
          ...(data?.ignoredSprints||[]).map(s=>
            h('div',{key:s.id,style:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'4px 0'}},
              h('span',null,(s.projectName?s.projectName+' / ':'')+(s.name||'#'+s.id)),
              h('button',{className:'btn btn-ghost',disabled:saving||busy,onClick:()=>changeIgnore(s,false)},t('取消忽略'))
            )
          )
        ),
        h('div',{className:'table-container'},
          h('table',null,
            h('thead',null,
              h('tr',null,...['冲刺 / 项目','状态','计划截止','需求关闭','任务完成','待解决 / 待验证','风险','操作'].map(x=>h('th',{key:x},t(x))))
            ),
            h('tbody',null,
              ...sprints.map(s=>h('tr',{key:s.id},
                h('td',null,
                  h('a',{className:'item-title',href:'http://pm.kuaishang.cn/zentao/execution-view-'+s.id+'.html',target:'_blank',rel:'noopener noreferrer'},s.name),
                  h('div',{className:'cell-sub'},s.projectName)
                ),
                h('td',null,h('span',{className:'pill '+s.status},h('i',{className:'pill-dot'}),status[s.status]||s.status)),
                h('td',{style:{color:delayed(s)?'var(--zq-warn)':undefined,fontWeight:delayed(s)?500:undefined}},s.end==='0000-00-00'?'—':s.end||'—'),
                h('td',null,progress(s.stories,b=>b.status==='closed')),
                h('td',null,progress(tasks(s.tasks),b=>['done','closed'].includes(b.status))),
                h('td',null,s.bugs?s.bugs.filter(b=>b.status==='active').length+' / '+s.bugs.filter(b=>b.status==='resolved').length:t('未评估')),
                h('td',null,
                  delayed(s)&&h('span',{className:'pill delayed',style:{marginRight:4}},h('i',{className:'pill-dot'}),t('延期')),
                  s.warnings.length?h('div',{style:{color:'var(--zq-error)',fontSize:11}},s.warnings.join('；')):(!delayed(s)&&h('span',{className:'pill ontrack'},h('i',{className:'pill-dot'}),t('正常')))
                ),
                h('td',null,
                  h('button',{
                    className:'btn btn-ghost',
                    disabled:saving||busy,
                    onClick:()=>changeIgnore(s,true),
                    'aria-label':t('忽略')+' '+s.name
                  },t(saving?'保存中…':'忽略'))
                )
              ))
            )
          )
        ),
        !busy&&!sprints.length&&h('div',{className:'empty-box'},t('暂无未关闭冲刺'))
      ),

      // Section 2: Online Issues (Recent 30 Days)
      h('div',{className:'dashboard-section'},
        h('div',{className:'section-header'},
          h('div',{className:'section-title-wrap'},
            h('span',{className:'section-icon'},h(Glyph,{kind:'online',size:15})),
            h('h2',{className:'section-title'},t('线上问题（近30天）')),
            h('span',{className:'badge-count'},base.length)
          ),
          h('span',{style:{fontSize:12,color:'var(--zq-text-muted)'}},
            t('含已忽略冲刺'),
            data?.recentOnline&&' · '+data.recentOnline.from+' — '+data.recentOnline.to
          )
        ),
        h('div',{className:'filter-toolbar'},
          h('div',{className:'filter-inputs'},
            h('input',{
              className:'input',
              value:query,
              onChange:e=>Q(e.target.value),
              placeholder:t('搜索编号、标题或冲刺'),
              'aria-label':t('搜索编号、标题或冲刺')
            }),
            h(CustomSelect,{
              value:state,
              onChange:S,
              options:[
                { value: '', label: t('全部状态') },
                ...['active','resolved','closed'].map(v => ({ value: v, label: status[v] }))
              ],
              ariaLabel: t('状态')
            }),
            h(CustomSelect,{
              value:owner,
              onChange:O,
              options:[
                { value: '', label: t('全部创建人') },
                ...owners.map(v => ({ value: v, label: v }))
              ],
              ariaLabel: t('创建人')
            })
          ),
          h('div',{className:'filter-summary'},
            ...['active','resolved','closed'].map(v=>
              h('span',{key:v,className:'pill '+v},h('i',{className:'pill-dot'}),status[v]+' '+base.filter(b=>b.status===v).length)
            ),
            h('span',{style:{marginLeft:6,fontWeight:500,color:'var(--zq-text-1)'}},t('筛选')+' '+bugs.length+' / '+base.length)
          )
        ),
        h('div',{className:'table-container'},
          h('table',null,
            h('thead',null,
              h('tr',null,...['问题 / 所属冲刺','状态','创建人','优先级','创建日期','问题龄期'].map(v=>h('th',{key:v},t(v))))
            ),
            h('tbody',null,
              ...bugs.slice(page*30,page*30+30).map(b=>h('tr',{key:b.id},
                h('td',null,
                  h('a',{className:'item-title',href:'http://pm.kuaishang.cn/zentao/bug-view-'+b.id+'.html',target:'_blank',rel:'noopener noreferrer'},'#'+b.id+' '+b.title),
                  h('div',{className:'cell-sub'},b.projectName+' / '+b.sprintName)
                ),
                h('td',null,h('span',{className:'pill '+b.status},h('i',{className:'pill-dot'}),status[b.status]||b.status)),
                h('td',null,(b.creatorName||'姓名未获取')),
                h('td',null,h('span',{className:'priority-tag'+(Number(b.pri)>0&&Number(b.pri)<=2?' high':'')},'P'+b.pri)),
                h('td',null,String(b.openedDate).slice(0,10)),
                h('td',{style:{color:b.status==='active'&&age(b)>7?'var(--zq-warn)':undefined,fontWeight:b.status==='active'&&age(b)>7?500:undefined}},age(b)===null?'—':age(b)+'天')
              ))
            )
          )
        ),
        !busy&&!bugs.length&&h('div',{className:'empty-box'},t('当前无匹配问题')),
        h('div',{className:'pagination-bar'},
          h('button',{
            className:'btn btn-ghost',
            disabled:!page,
            onClick:()=>P(p=>p-1)
          },t('前一页')),
          h('span',null,(page+1)+' / '+Math.max(1,Math.ceil(bugs.length/30))),
          h('button',{
            className:'btn btn-ghost',
            disabled:(page+1)*30>=bugs.length,
            onClick:()=>P(p=>p+1)
          },t('后一页'))
        )
      ),

      // Footer
      h('div',{className:'footer-meta'},
        data&&h('span',null,t('更新')+' '+new Date(data.readAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})),
        h('details',null,
          h('summary',null,t('统计口径')),
          data&&h('p',null,data.scope),
          h('p',null,t('数据持续持久化缓存；若未获取到新数据，则始终展示上一次成功采集的信息。需求关闭率不等同于交付验收，任务排除取消与父任务。'))
        )
      )
    );
   }

   ctx.slots.inject('main',()=>ctx.slots.register({name:'main',key:'zentao-quality'},App));
   ctx.slots.inject('sidebar.panellist',()=>ctx.slots.register({name:'sidebar.panellist',id:'zentao-quality',order:16,label:()=>t('禅道质量看板')},Icon));
  }};
 }
});
