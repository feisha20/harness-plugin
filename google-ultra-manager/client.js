window.__ModuleLoader__.load({
  id: '@local/google-ultra-manager',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const apiBase = '/api/google-ultra-manager';

    const css = `
.gum-root {
  --gum-bg: var(--dsw-alias-bg-base, #fff);
  --gum-surface: var(--dsw-alias-bg-layer-1, #fff);
  --gum-ink: var(--dsw-alias-label-primary, #181827);
  --gum-muted: var(--dsw-alias-label-secondary, #565b70);
  --gum-line: var(--dsw-alias-border-l2, #e1e2ea);
  --gum-accent: light-dark(#5339a6, #c8baff);
  --gum-soft: color-mix(in srgb, var(--gum-accent) 9%, var(--gum-surface));
  --gum-danger: var(--dsw-alias-state-error-primary, #b42336);
  display: flex; flex-direction: column; height: 100%; overflow: hidden; container-type: inline-size;
  background: color-mix(in srgb, var(--gum-bg) 96%, var(--gum-accent)); color: var(--gum-ink);
  font: 13px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-variant-numeric: tabular-nums;
}
.gum-root *, .gum-root *::before, .gum-root *::after { box-sizing: border-box; }
.gum-root h1, .gum-root h2, .gum-root h3, .gum-root p, .gum-root dl, .gum-root dd { margin: 0; }
.gum-root h1 { font-size: 20px; line-height: 1.25; letter-spacing: -.35px; font-weight: 750; }
.gum-root h2 { font-size: 17px; line-height: 1.35; letter-spacing: -.2px; font-weight: 720; }
.gum-root h3 { font-size: 13.5px; font-weight: 720; }
.gum-root p, .gum-root dd, .gum-root td { overflow-wrap: anywhere; }
.gum-root :focus-visible { outline: 2px solid var(--gum-accent); outline-offset: 2px; }
.gum-header { flex: none; background: var(--gum-surface); border-bottom: 1px solid var(--gum-line); }
.gum-wrap { width: min(100%, 1250px); margin-inline: auto; padding-inline: clamp(14px, 3cqi, 38px); }
.gum-top, .gum-brand, .gum-toolbar, .gum-actions, .gum-section-head { display: flex; align-items: center; gap: 10px; }
.gum-top { justify-content: space-between; gap: 16px; padding-top: 18px; padding-bottom: 10px; flex-wrap: wrap; }
.gum-brand { gap: 11px; }
.gum-mark { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 12px; background: #312260; color: #efe8ff; flex: none; }
.gum-toolbar, .gum-actions { flex-wrap: wrap; }
.gum-toolbar .gum-control { max-width: min(280px, 74cqi); width: auto; }
.gum-nav { display: flex; width: 100%; overflow: auto; gap: 20px; scrollbar-width: thin; }
.gum-nav button { flex: none; position: relative; border: 0; border-bottom: 2px solid transparent; background: none; color: var(--gum-muted); font: inherit; font-weight: 610; padding: 10px 2px; cursor: pointer; }
.gum-nav button[aria-current] { color: var(--gum-accent); border-bottom-color: currentColor; }
.gum-nav button:hover { color: var(--gum-accent); }
.gum-scroll { min-height: 0; flex: 1; overflow: auto; }
.gum-content { display: grid; gap: 20px; align-content: start; padding-top: 22px; padding-bottom: 34px; }
.gum-hero { display: grid; grid-template-columns: minmax(0, 1.65fr) minmax(0, 1fr); gap: 14px; align-items: stretch; }
.gum-card { min-width: 0; padding: 18px 20px; border: 1px solid var(--gum-line); background: var(--gum-surface); border-radius: 15px; }
.gum-balance {
  position: relative; isolation: isolate; overflow: hidden; min-width: 0; padding: 19px 22px; border-radius: 15px;
  color: #fff; background: radial-gradient(ellipse at 100% 5%, #5b4195, transparent 72%), #25203e;
  font-variant-numeric: tabular-nums;
}
.gum-balance::before {
  content: ""; position: absolute; top: -9rem; right: -6rem; width: 21rem; aspect-ratio: 1; border: 1px solid #c9b0ff2d;
  border-radius: 50%; box-shadow: 0 0 0 24px #c9b0ff15, 0 0 0 50px #c9b0ff10, 0 0 0 78px #c9b0ff0e; z-index: -1;
}
.gum-balance-meta, .gum-balance-caption { color: #e3d9f9; font-size: 12px; }
.gum-balance-label { display: flex; gap: 7px; align-items: center; font-weight: 650; }
.gum-balance-value { display: flex; align-items: baseline; gap: 9px; flex-wrap: wrap; margin: 11px 0 8px; }
.gum-balance-value strong { font-size: clamp(31px, 4.3cqi, 51px); font-weight: 760; letter-spacing: -.055em; line-height: 1; }
.gum-meter { height: 5px; overflow: hidden; border-radius: 99px; background: var(--gum-soft); }
.gum-meter > span { display: block; height: 100%; border-radius: inherit; background: var(--gum-accent); }
.gum-balance .gum-meter { background: #ffffff33; margin-bottom: 8px; }
.gum-balance .gum-meter > span { background: #d4b7ff; }
.gum-balance .gum-meter.low > span { background: #ffc280; }
.gum-balance-readings { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 12px !important; padding-top: 9px; border-top: 1px solid #ffffff29; }
.gum-balance-readings dt { font-size: 11.5px; color: #e3d9f9; }
.gum-balance-readings dd { font-size: 15px; font-weight: 680; }
.gum-plan { display: grid; gap: 12px; align-content: space-between; }
.gum-plan-title { font-size: clamp(20px, 2.5cqi, 28px); font-weight: 760; letter-spacing: -.045em; line-height: 1.1; }
.gum-plan-title span { color: var(--gum-accent); }
.gum-plan-data { display: grid; gap: 6px; }
.gum-plan-data div { display: flex; justify-content: space-between; gap: 8px; }
.gum-plan-data dt, .gum-muted { color: var(--gum-muted); }
.gum-plan-data dd { text-align: right; font-weight: 650; }
.gum-section-head { justify-content: space-between; flex-wrap: wrap; }
.gum-section-head p { color: var(--gum-muted); font-size: 12px; margin-top: 3px; }
.gum-section { display: grid; gap: 10px; min-width: 0; }
.gum-tiles { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border: 1px solid var(--gum-line); border-radius: 15px; background: var(--gum-surface); overflow: hidden; }
.gum-tile { min-width: 0; display: grid; align-content: start; gap: 6px; padding: 15px 18px; }
.gum-tile + .gum-tile { border-inline-start: 1px solid var(--gum-line); }
.gum-tile h3 { display: flex; gap: 7px; align-items: center; }
.gum-tile h3 .gum-symbol { color: var(--gum-accent); flex: none; }
.gum-tile-value { font-size: 20px; line-height: 1.22; font-weight: 730; letter-spacing: -.035em; }
.gum-tile p, .gum-secondary { color: var(--gum-muted); font-size: 12px; }
.gum-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; align-items: start; }
.gum-stack { display: grid; gap: 12px; min-width: 0; }
.gum-button, .gum-link { white-space: nowrap; font: inherit; font-weight: 650; cursor: pointer; }
.gum-button { display: inline-flex; gap: 6px; align-items: center; justify-content: center; border: 1px solid var(--gum-line); background: var(--gum-surface); color: var(--gum-ink); border-radius: 8px; min-height: 32px; padding: 5px 11px; }
.gum-button:hover:not(:disabled) { border-color: var(--gum-accent); color: var(--gum-accent); background: var(--gum-soft); }
.gum-button.primary, .gum-button.primary:hover:not(:disabled) { background: #5236a4; color: #fff; border-color: #5236a4; }
.gum-button.primary:hover:not(:disabled) { background: #412784; }
.gum-button:disabled { opacity: .55; cursor: default; }
.gum-button.danger { color: var(--gum-danger); }
.gum-button.small { font-size: 12px; min-height: 28px; padding: 3px 8px; }
.gum-link { display: inline-flex; align-items: center; gap: 4px; width: fit-content; border: 0; padding: 0; background: none; text-decoration: none; color: var(--gum-accent); }
.gum-link:hover:not(:disabled) { text-decoration: underline; }
.gum-link:disabled { opacity: .55; cursor: default; }
.gum-control { display: block; width: 100%; min-width: 0; border: 1px solid var(--gum-line); background: var(--gum-bg); color: var(--gum-ink); padding: 6px 9px; min-height: 33px; border-radius: 7px; font: inherit; }
.gum-field { display: grid; align-content: start; gap: 4px; min-width: 0; color: var(--gum-muted); font-size: 12px; }
.gum-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 11px; }
.gum-fields > .wide { grid-column: 1 / -1; }
.gum-end { justify-content: flex-end; }
.gum-filters { display: flex; gap: 7px; flex-wrap: wrap; }
.gum-filters button[aria-pressed="true"] { background: var(--gum-soft); border-color: var(--gum-accent); color: var(--gum-accent); }
.gum-group { padding-block: 0; }
.gum-group > h3 { padding: 11px 0; color: var(--gum-accent); }
.gum-benefit { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(0, .63fr) minmax(0, 1.2fr); align-items: start; column-gap: 16px; row-gap: 6px; border-top: 1px solid var(--gum-line); padding: 12px 0; }
.gum-benefit > * { min-width: 0; }
.gum-benefit p { margin-top: 3px; }
.gum-benefit strong { display: block; font-weight: 710; }
.gum-benefit .gum-actions { gap: 6px; align-items: start; }
.gum-availability { display: block; color: var(--gum-accent); font-size: 11.5px; margin-top: 3px; }
.gum-benefit .gum-meter { width: min(100%, 112px); margin-block: 4px; }
.gum-quota-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 12px; margin-bottom: 8px; }
.gum-quota-grid strong { font-size: 12px; }
.gum-quota-grid > p { margin: 0; }
.gum-quota-status { display: grid; gap: 6px; }
.gum-banner { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 12px; border: 1px solid var(--gum-line); border-radius: 9px; background: var(--gum-surface); }
.gum-banner.error { color: var(--gum-danger); }
.gum-table-scroll { overflow-x: auto; }
.gum-table { width: 100%; border-collapse: collapse; }
.gum-table th, .gum-table td { padding: 7px 8px; border-bottom: 1px solid var(--gum-line); text-align: left; }
.gum-table th:first-child, .gum-table td:first-child { padding-left: 0; }
.gum-table th:last-child, .gum-table td:last-child { padding-right: 0; }
.gum-table tr:last-child td { border-bottom: 0; }
.gum-table th { font-weight: 600; color: var(--gum-muted); white-space: nowrap; font-size: 12px; }
.gum-table .numeric { white-space: nowrap; text-align: right; }
.gum-logs { min-width: 650px; }
.gum-dialog { color: inherit; width: min(480px, calc(100% - 26px)); max-height: calc(100% - 30px); margin: auto; padding: 20px; }
.gum-dialog::backdrop { background: #17112772; }
.gum-dialog textarea { resize: vertical; }
@container (max-width: 690px) {
  .gum-hero, .gum-grid { grid-template-columns: minmax(0, 1fr); }
  .gum-content { padding-top: 15px; gap: 15px; }
  .gum-card { padding-inline: 14px; }
  .gum-tile { padding: 12px 10px; }
  .gum-tile-value { font-size: 17px; }
  .gum-benefit { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 9px; }
  .gum-benefit > :first-child { grid-column: 1 / -1; }
  .gum-quota-grid { grid-template-columns: minmax(0, 1fr); }
}
@container (max-width: 410px) {
  .gum-nav { gap: 13px; }
  .gum-tiles { grid-template-columns: minmax(0, 1fr); }
  .gum-tile + .gum-tile { border-inline-start: 0; border-top: 1px solid var(--gum-line); }
}
`;

    function ensureStyles() {
      const existing = document.head.querySelector('[data-plugin="google-ultra-manager"]');
      if (existing?.textContent === css) return;
      const style = existing || document.createElement('style');
      style.setAttribute('data-plugin', 'google-ultra-manager');
      style.textContent = css;
      if (!existing) document.head.appendChild(style);
    }

    function Icon({ name = 'bolt', size = 16 }) {
      const paths = {
        bolt: 'M13 2 5 14h6l-1 8 9-12h-6l1-8Z',
        storage: 'M4 4h16v7H4zM4 13h16v7H4zM7 7.5h.1m0 9h.1',
        film: 'M4 5h16v14H4zM8 5v14M16 5v14M4 10h4m8 0h4M4 14h4m8 0h4',
        music: 'M9 18V5l11-2v13M9 18c0 1-1 2-3 2s-3-1-3-2 1-2 3-2 3 1 3 2Zm11-2c0 1-1 2-3 2s-3-1-3-2 1-2 3-2 3 1 3 2Z',
        sync: 'M20 11a8 8 0 0 0-14-4L3 10m0-5v5h5m-4 3a8 8 0 0 0 14 4l3-3m0 5v-5h-5',
        arrow: 'M5 12h14m-6-6 6 6-6 6',
        external: 'M13 5h6v6m0-6-9 9m7-1v6H5V7h6',
      };
      return h('svg', { className: 'gum-symbol', width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
        h('path', { d: paths[name] }));
    }

    const num = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 });
    const format = (value) => value == null ? '—' : num.format(value);
    const time = (iso) => iso ? new Date(iso).toLocaleString('zh-CN', { hour12: false }) : '—';
    const shortTime = new Intl.DateTimeFormat('zh-CN', {
      month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
    });

    async function request(path, body) {
      const res = await fetch(apiBase + path, body === undefined ? undefined : {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `请求失败（${res.status}）`);
      return data;
    }

    function button(text, onClick, { variant = '', icon, disabled, type = 'button', label } = {}) {
      return h('button', { type, className: `gum-button ${variant}`, onClick, disabled, 'aria-label': label },
        icon && h(Icon, { name: icon, size: 14 }), text);
    }

    function external(text, url) {
      return h('a', { className: 'gum-link', href: url, target: '_blank', rel: 'noreferrer' },
        text, h(Icon, { name: 'external', size: 13 }));
    }

    function field(label, props, options, wide = false) {
      return h('label', { className: `gum-field ${wide ? 'wide' : ''}` }, label,
        options ? h('select', { className: 'gum-control', ...props }, options.map(([value, name]) =>
          h('option', { key: value, value }, name)))
          : h('input', { className: 'gum-control', ...props }));
    }

    function heading(title, description, action) {
      return h('div', { className: 'gum-section-head' },
        h('div', null, h('h2', null, title), description && h('p', null, description)), action);
    }

    function meter(percent, label, low = false) {
      const value = Math.min(100, Math.max(0, percent));
      return h('div', { className: `gum-meter ${low ? 'low' : ''}`, role: 'progressbar',
        'aria-label': label, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': value },
        h('span', { style: { width: `${value}%` } }));
    }

    function table(headers, rows, className = '') {
      return h('div', { className: 'gum-table-scroll' },
        h('table', { className: `gum-table ${className}` },
          h('thead', null, h('tr', null, headers.map(([name, numeric]) =>
            h('th', { key: name, className: numeric ? 'numeric' : undefined, scope: 'col' }, name)))),
          h('tbody', null, rows.map(({ key, cells }) =>
            h('tr', { key }, cells.map((cell, index) => h('td', {
              key: headers[index][0], className: headers[index][1] ? 'numeric' : undefined,
            }, cell)))))));
    }

    function Dialog({ title, dismiss, children }) {
      const ref = React.useRef(null);
      React.useEffect(() => {
        const dialog = ref.current;
        dialog.showModal();
        return () => dialog.close();
      }, []);
      return h('dialog', { ref, className: 'gum-card gum-dialog', 'aria-label': title,
        onCancel: (event) => { event.preventDefault(); dismiss(); } }, children);
    }

    const statuses = { active: '订阅中', trial: '试用中', cancelled: '已取消', unknown: '待确认' };
    const sources = { 'colab-panel': 'Colab 资源面板', 'ego-browser': 'Colab 实时同步', manual: '手动校准', 'agent-tool': '工具写入', 'local-log': '本地流水' };
    const tabs = [['overview', '总览'], ['benefits', '会员权益'], ['usage', '算力与流水'], ['account', '账号设置']];
    const types = { sync: '同步', 'gpu-run': '算力估算', 'manual-spend': '手动消耗', 'manual-topup': '手动补充', manual: '手动记录' };

    function quota(item) {
      if (item.limit == null) return item.value;
      return `${item.unit === 'USD' ? 'US$' + format(item.limit) : format(item.limit) + ' ' + item.unit}${item.cycle === '每月' ? ' / 月' : ''}`;
    }

    function BenefitRow({ item, record, account, status, onEdit, onDelete, onColab, onSyncStorage, antigravity, onReadAntigravity, disabled }) {
      const isColab = item.id === 'colab-cu';
      const amount = record?.reportedUsage || (record ? `${format(record.used)} / ${format(record.limit)} ${record.unit}` : '待记录');
      return h('article', { className: 'gum-benefit' },
        h('div', null, h('h3', null, item.name),
          (item.text || record?.notes) && h('p', { className: 'gum-secondary' }, item.text || record.notes),
          item.availability && h('span', { className: 'gum-availability' }, item.availability)),
        h('div', null, h('strong', null, quota(item) || '自定义额度'),
          item.url && external('官方说明', item.url),
          item.id === 'flow-credits' && h('p', null, external('打开 Flow', `https://flow.google.com/u/${account.authuser}/`))),
        h('div', null,
          isColab ? h(React.Fragment, null,
            h('strong', null, status.hasBalance ? `可用 ${format(status.balance)} CU` : '待同步'),
            h('p', { className: 'gum-secondary' }, status.hasBalance
              ? `${sources[account.computeUnits.source] || '本地记录'} · 追踪额度 ${format(status.monthlyAllowance)} CU`
              : '同步后显示 Colab 用量'),
            h('button', { className: 'gum-link', onClick: onColab }, '管理算力'))
            : item.limit !== undefined || record ? h(React.Fragment, null,
              h('strong', null, record ? `已用 ${amount}` : '待记录'),
              record?.limit > 0 && meter(record.used / record.limit * 100, item.name + '已用比例'),
              record && h('p', { className: 'gum-secondary' }, record.updatedAt ? `${record.source === 'google-one-storage' ? 'Google One 同步' : '手动记录'} · ${time(record.updatedAt)}` : '旧版手动记录'),
              item.url && record?.notes && h('p', { className: 'gum-secondary' }, record.notes),
              h('div', { className: 'gum-actions' },
                onSyncStorage && button('同步存储', onSyncStorage, { variant: 'small', disabled, icon: 'sync' }),
                button(record ? '更新用量' : '记录用量', onEdit, { variant: 'small', disabled, label: (record ? '更新' : '记录') + item.name + '用量' }),
                record && button('删除记录', onDelete, { variant: 'small danger', disabled, label: '删除' + item.name + '记录' })))
              : onReadAntigravity ? h('div', { className: 'gum-quota-status' },
                antigravity ? h('div', { className: 'gum-quota-grid' }, antigravity.buckets.map((bucket) =>
                  h('p', { key: bucket.id },
                    h('strong', null, `${bucket.name} · 剩余 ${format(bucket.percent)}%`),
                    bucket.resetTime && h('small', { className: 'gum-secondary', title: time(bucket.resetTime) },
                      `重置 ${shortTime.format(new Date(bucket.resetTime))}`))))
                  : h('p', { className: 'gum-secondary' }, '待同步'),
                h('div', { className: 'gum-actions' },
                  button('读取实时额度', onReadAntigravity, { variant: 'small', disabled }),
                  antigravity && h('span', { className: 'gum-secondary' }, `官方 CLI · ${time(antigravity.fetchedAt)}`)))
                : null));

    }

    function App({ getAcp }) {
      React.useEffect(ensureStyles, []);
      const [tab, setTab] = React.useState('overview');
      const [filter, setFilter] = React.useState('all');
      const [data, setData] = React.useState(null);
      const [pending, setPending] = React.useState('');
      const [message, setMessage] = React.useState(null);
      const [antigravity, setAntigravity] = React.useState(null);
      const [editor, setEditor] = React.useState(null);
      const [gpuId, setGpuId] = React.useState('A100');
      const [hours, setHours] = React.useState('2');
      const scroll = React.useRef(null);
      const inFlight = React.useRef(false);

      async function run(key, action, success) {
        if (inFlight.current) return;
        inFlight.current = true;
        setPending(key);
        setMessage(null);
        try {
          const result = await action();
          setData(result.state || result);
          if (success) {
            const message = typeof success === 'function' ? success(result) : success;
            setMessage({ text: message });
          }
          return result;
        } catch (error) {
          setMessage({ text: error.message, error: true });
        } finally {
          inFlight.current = false;
          setPending('');
        }
      }

      React.useEffect(() => { run('load', () => request('/state')); }, []);
      const account = data?.accounts.find((item) => item.id === data.activeAccountId);
      const summary = data?.summary;
      const catalog = data?.catalog;
      const cu = account?.computeUnits;
      const groups = catalog?.groups || [];
      const records = new Map((account?.benefits || []).map((item) => [item.id, item]));
      const officialIds = new Set(groups.flatMap((group) => group.items.map((item) => item.id)));
      const custom = (account?.benefits || []).filter((item) => !officialIds.has(item.id) && item.id !== 'colab-cu');
      const disabled = Boolean(pending);
      const hasBalance = Boolean(cu) && cu.source !== 'unrecorded';
      const hasRate = hasBalance && cu.burnRatePerHour != null;
      const status = { ...summary, hasBalance };

      function navigate(next) {
        setTab(next);
        scroll.current?.scrollTo(0, 0);
      }

      function openAccount() {
        setEditor({ kind: 'account', title: '新增账号' });
      }

      function openBenefit(item) {
        setEditor({ kind: 'benefit', item, record: item ? records.get(item.id) : undefined,
          title: item ? item.name + ' · 用量' : '添加自定义记录' });
      }

      function deleteRecord(item) {
        setEditor({ kind: 'delete-benefit', item, title: '删除用量记录' });
      }

      function syncColab() {
        run('sync', () => request('/sync-colab', { accountId: account.id }),
          (result) => `已从 Colab 同步 · 可用 ${format(result.synced.balance)} CU`);
      }

      function syncStorage() {
        run('storage', () => request('/sync-storage', { accountId: account.id }),
          (result) => `已从 Google One 同步 · 已用 ${result.synced.reportedUsage}`);
      }

      async function readAntigravity() {
        if (inFlight.current) return;
        inFlight.current = true;
        setPending('antigravity');
        setMessage(null);
        try {
          const remote = getAcp();
          if (!remote?.quota) throw new Error('当前 DSH 未连接 ACP 适配器，请在 Antigravity 中查看用量');
          const health = await remote.health({});
          const provider = health.ok && health.value.providers.find((item) =>
            /antigravity|(?:^|\/)agy(?:[-.]|$)/i.test([item.id, item.name, item.command].join(' ')));
          if (!provider) throw new Error('ACP 适配器未找到 Antigravity 配置');
          const result = await remote.quota(provider.id);
          if (!result.ok) throw new Error('未能读取 Antigravity 额度。请确认 CLI 已登录，或稍后再试');
          const value = result.value;
          if (!account.email || value.account?.trim().toLowerCase() !== account.email.trim().toLowerCase()) {
            throw new Error('Antigravity CLI 的登录账号与当前 Google 邮箱不一致');
          }
          const names = { 'gemini-5h': 'Gemini 5 小时', 'gemini-weekly': 'Gemini 本周',
            '3p-5h': '第三方模型 5 小时', '3p-weekly': '第三方模型本周' };
          const buckets = Object.entries(names).flatMap(([id, name]) => {
            const item = value.buckets.find((bucket) => bucket.id === id);
            return item && !item.disabled && Number.isFinite(item.remainingPercent)
              ? [{ id, name, percent: item.remainingPercent,
                  resetTime: Number.isFinite(Date.parse(item.resetTime)) ? item.resetTime : null }]
              : [];
          });
          if (!buckets.length) throw new Error('官方 CLI 暂未返回可用的 Antigravity 额度');
          setAntigravity({ accountId: account.id, email: account.email, fetchedAt: value.fetchedAt, buckets });
        } catch (error) {
          setMessage({ text: error.message, error: true });
        } finally {
          inFlight.current = false;
          setPending('');
        }
      }

      function renderOverview() {
        const tiles = groups[0]?.items.filter((item) => ['google-one-storage', 'flow-credits', 'flow-music-credits'].includes(item.id)) || [];
        const symbols = ['storage', 'film', 'music'];
        const plan = [
          ['订阅状态', statuses[account.subscriptionStatus] || account.subscriptionStatus || '待确认'],
          ['Colab 方案', account.colabTier || '待同步'],
          ['本地账单记录', [account.monthlyPrice, account.billingCycleDay ? `每月 ${account.billingCycleDay} 日` : ''].filter(Boolean).join(' · ') || '待记录'],
        ];

        return h(React.Fragment, null,
          h('div', { className: 'gum-hero' },
            h('section', { className: 'gum-balance', 'aria-label': 'Colab 算力' },
              h('div', { className: 'gum-balance-label' }, h(Icon, {}), 'Colab 可用算力'),
              h('div', { className: 'gum-balance-value' }, h('strong', null, hasBalance ? format(summary.balance) : '待同步'),
                hasBalance && h('span', { className: 'gum-balance-meta' }, `CU / ${format(summary.monthlyAllowance)} CU 追踪额度`)),
              hasBalance && meter(summary.remainingPct, 'Colab 剩余额度', summary.isLowBalance),
              h('p', { className: 'gum-balance-caption' }, hasBalance
                ? [`剩余 ${summary.remainingPct}%`, sources[cu.source] || '本地记录', (cu.updatedAt || cu.lastSyncedAt) && time(cu.updatedAt || cu.lastSyncedAt)].filter(Boolean).join(' · ')
                : '从 Colab 同步，或在算力页手动校准'),
              h('dl', { className: 'gum-balance-readings' },
                [['当前消耗', hasRate ? `${format(cu.burnRatePerHour)} CU/h` : '—'],
                  ['预计可运行', hasRate && summary.estimatedHoursCurrentRate != null ? `${format(summary.estimatedHoursCurrentRate)} 小时` : '—'],
                  ['活跃会话', hasBalance ? format(cu.activeSessions) : '—']].map(([label, value]) =>
                  h('div', { key: label }, h('dt', null, label), h('dd', null, value))))),
            h('section', { className: 'gum-card gum-plan', 'aria-label': '订阅信息' },
              h('div', { className: 'gum-stack' },
                h('p', { className: 'gum-secondary' }, '当前会员方案'),
                h('div', { className: 'gum-plan-title' }, 'Google AI Ultra ', h('span', null, '5x'))),
              h('dl', { className: 'gum-plan-data' }, plan.map(([label, value]) =>
                h('div', { key: label }, h('dt', null, label), h('dd', null, value)))),
              h('button', { className: 'gum-link', onClick: () => navigate('account') }, '管理账号', h(Icon, { name: 'arrow', size: 14 })))),
          tiles.length > 0 && h('section', { className: 'gum-section' },
            heading('常用权益', null, button('查看全部权益', () => { setFilter('all'); navigate('benefits'); }, { icon: 'arrow' })),
            h('div', { className: 'gum-tiles' }, tiles.map((item, index) => {
              const record = records.get(item.id);
              const isStorage = item.id === 'google-one-storage';
              const usage = record?.reportedUsage ? `Google One 同步 · 已用 ${record.reportedUsage}`
                : record ? `手动记录 · 已用 ${format(record.used)} ${record.unit}` : '用量待记录';
              return h('article', { key: item.id, className: 'gum-tile' },
                h('h3', null, h(Icon, { name: symbols[index] }), item.name),
                h('div', { className: 'gum-tile-value' }, quota(item)),
                h('p', null, usage),
                isStorage ? h('button', { className: 'gum-link', disabled, onClick: syncStorage }, pending === 'storage' ? '正在同步存储…' : '同步存储')
                  : h('button', { className: 'gum-link', disabled, onClick: () => openBenefit(item),
                    'aria-label': (record ? '更新' : '记录') + item.name + '用量' }, record ? '更新用量' : '记录用量'));
            }))),
          h('section', { className: 'gum-card gum-stack' },
            heading('硬件可运行时长', '按当前 Colab 余额与参考速率估算', button('算力估算与流水', () => navigate('usage'), { icon: 'arrow' })),
            table([['加速器'], ['参考速率', true], ['预计时长', true]], summary.gpuRunway.map((gpu) => ({
              key: gpu.id, cells: [gpu.label, `${format(gpu.ratePerHour)} CU/h`, hasBalance ? `${format(gpu.maxHours)} 小时` : '—'],
            })))));
      }

      function renderBenefits() {
        const list = [...groups, { id: 'custom', name: '自定义记录', items: custom }];
        return h('section', { className: 'gum-section' },
          heading('Ultra 5x 会员权益',
            `官方权益核对于 ${catalog.checkedOn}。领取及用量以 Google 账号所在地区和产品页面为准。`,
            button('添加自定义记录', () => openBenefit(), { disabled })),
          h('div', { className: 'gum-filters', role: 'group', 'aria-label': '权益分类' },
            [['all', '全部'], ...list.map(({ id, name }) => [id, name])].map(([id, label]) =>
              h('button', { key: id, className: 'gum-button small', type: 'button', 'aria-pressed': filter === id,
                onClick: () => setFilter(id) }, label))),
          list.filter((group) => filter === 'all' ? group.items.length : group.id === filter).map((group) =>
            h('section', { key: group.id, className: 'gum-card gum-group' },
              h('h3', null, group.name),
              group.items.length === 0 && h('p', { className: 'gum-secondary', style: { paddingBottom: 12 } }, '暂无自定义记录'),
              group.items.map((item) => h(BenefitRow, {
                key: item.id, item, account, status, disabled,
                record: records.get(item.id), onEdit: () => openBenefit(item),
                onDelete: () => deleteRecord(item), onColab: () => navigate('usage'),
                onSyncStorage: item.id === 'google-one-storage' ? syncStorage : undefined,
                onReadAntigravity: item.id === 'antigravity' ? readAntigravity : undefined,
                antigravity: antigravity?.accountId === account.id && antigravity.email === account.email ? antigravity : null,
              })))),
          h('div', { className: 'gum-actions' }, external('Google One 方案说明', catalog.plansUrl),
            external('Ultra 权益与适用地区', catalog.helpUrl)));
      }

      function renderUsage() {
        const gpu = data.gpuPresets.find((item) => item.id === gpuId);
        const duration = Number(hours);
        const cost = Math.max(0, Number((gpu.ratePerHour * duration).toFixed(2)));
        const after = hasBalance ? Math.max(0, summary.balance - cost) : null;
        const canLog = hasBalance && cost > 0 && cost <= summary.balance;
        return h(React.Fragment, null,
          heading('Colab 算力与流水', '估算采用硬件参考速率，实际消耗以 Colab 资源面板为准。',
            button('手动校准', () => setEditor({ kind: 'calibrate', title: '校准 Colab 算力' }), { disabled })),
          h('div', { className: 'gum-grid' },
            h('section', { className: 'gum-card gum-stack' },
              h('h3', null, 'GPU / TPU 算力估算'),
              h('div', { className: 'gum-fields' },
                field('加速器', { value: gpuId, onChange: (event) => setGpuId(event.target.value) },
                  data.gpuPresets.map((item) => [item.id, item.label])),
                field('运行时长（小时）', { value: hours, onChange: (event) => setHours(event.target.value),
                  type: 'number', min: 0, step: 'any' })),
              h('p', { className: 'gum-secondary' }, `参考速率 ${format(gpu.ratePerHour)} CU/h · 预计消耗 ${format(cost)} CU · 预计结余 ${format(after)} CU`),
              h('div', { className: 'gum-actions gum-end' },
                button('记入本地消耗', () => setEditor({ kind: 'estimate', title: '记入估算消耗', gpu, duration, cost }),
                  { disabled: disabled || !canLog })) ),
            h('form', { className: 'gum-card gum-stack', key: account.id, onSubmit: async (event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const values = Object.fromEntries(new FormData(form));
              const unitsDelta = Number(values.delta);
              if (!unitsDelta || unitsDelta < -summary.balance) {
                setMessage({ text: '请输入非零变动量。消耗需小于等于当前余额。', error: true });
                return;
              }
              const result = await run('log', () => request('/usage/log', { accountId: account.id, entry: {
                type: unitsDelta < 0 ? 'manual-spend' : 'manual-topup',
                title: values.title.trim() || (unitsDelta < 0 ? '手动消耗' : '手动补充'),
                unitsDelta, note: values.note.trim(),
              } }), '已记入本地流水');
              if (result) form.reset();
            } },
              h('h3', null, '手动记账'),
              h('div', { className: 'gum-fields' },
                field('事项名称', { name: 'title', placeholder: '例如：模型训练' }),
                field('变动量（消耗填负数，CU）', { name: 'delta', type: 'number', step: '.01', required: true }),
                field('备注', { name: 'note' }, null, true)),
              h('div', { className: 'gum-actions gum-end' },
                button('添加流水', null, { disabled: disabled || !hasBalance, type: 'submit' })))),
          h('section', { className: 'gum-card gum-stack' },
            h('h3', null, '同步与消耗流水'),
            account.usageLogs.length ? table([['时间'], ['类型'], ['事项'], ['变动', true], ['结余', true], ['备注'], ['操作']],
              account.usageLogs.map((item) => ({ key: item.id, cells: [
                time(item.timestamp), types[item.type] || item.type, item.title,
                (item.unitsDelta > 0 ? '+' : '') + format(item.unitsDelta), format(item.balanceAfter) + ' CU', item.note || '—',
                button('删除', () => setEditor({ kind: 'delete-log', title: '删除流水', item }), { variant: 'small danger', disabled,
                  label: '删除流水 ' + item.title }),
              ] })), 'gum-logs') : h('p', { className: 'gum-secondary' }, '暂无流水')));
      }

      function accountFields(current = {}) {
        return h('div', { className: 'gum-fields' },
          field('Google 邮箱', { name: 'email', type: 'email', defaultValue: current.email, required: true }, null, true),
          field('显示名称', { name: 'displayName', defaultValue: current.displayName }),
          field('Colab 登录账号索引（authuser）', { name: 'authuser', type: 'number', min: 0, step: 1, defaultValue: current.authuser ?? 0, required: true }),
          field('订阅状态', { name: 'subscriptionStatus', defaultValue: current.subscriptionStatus || 'unknown' },
            Object.entries(statuses)),
          field('Colab 订阅等级', { name: 'colabTier', defaultValue: current.colabTier }),
          field('月费', { name: 'monthlyPrice', defaultValue: current.monthlyPrice, placeholder: '按实际账单填写' }),
          field('每月结算日', { name: 'billingCycleDay', type: 'number', min: 1, max: 31, defaultValue: current.billingCycleDay || '' }),
          field('下次续订日期', { name: 'nextRenewalDate', type: 'date', defaultValue: current.nextRenewalDate }),
          field('备注', { name: 'notes', defaultValue: current.notes }, null, true));
      }

      function saveAccount(values, id) {
        return request('/account/save', { ...values, id, planName: 'Google AI Ultra 5x',
          displayName: values.displayName.trim() || values.email.split('@')[0],
          authuser: Number(values.authuser), billingCycleDay: Number(values.billingCycleDay) });
      }

      function renderAccount() {
        return h('section', { className: 'gum-section' }, heading('Ultra 5x 账号设置', '账号与账单信息保存在本机。',
          button('新增账号', openAccount, { disabled })),
          h('form', { className: 'gum-card gum-stack', key: account.id, onSubmit: (event) => {
            event.preventDefault();
            const values = Object.fromEntries(new FormData(event.currentTarget));
            run('account', () => saveAccount(values, account.id), '已保存本地账号设置');
          } }, accountFields(account),
          h('div', { className: 'gum-actions gum-end' }, button('保存账号设置', null, { variant: 'primary', type: 'submit', disabled }))));
      }

      function renderDialog() {
        const { kind, item, record, title } = editor;
        let fields;
        let submit;
        let success;
        let caution;
        if (kind === 'account') {
          fields = accountFields();
          submit = (values) => saveAccount(values);
          success = '已添加 Ultra 5x 账号';
        } else if (kind === 'benefit') {
          const editable = !item?.url;
          fields = h('div', { className: 'gum-fields' },
            editable && field('名称', { name: 'name', defaultValue: record?.name, required: true }, null, true),
            field('已用量', { name: 'used', type: 'number', min: 0, step: 'any', defaultValue: record?.used, required: true }),
            field('追踪额度', { name: 'limit', type: 'number', min: 0, step: 'any', defaultValue: record?.limit ?? item?.limit, required: true }),
            editable && field('单位', { name: 'unit', defaultValue: record?.unit || '' }),
            editable && field('刷新周期', { name: 'resetCycle', defaultValue: record?.resetCycle || '每月' }),
            field('备注', { name: 'notes', defaultValue: record?.notes }, null, true));
          submit = (values) => request('/benefit/save', { accountId: account.id, benefit: {
            id: item?.id, name: values.name?.trim() || item?.name, category: '手动记录',
            used: Number(values.used), limit: Number(values.limit), unit: values.unit ?? item?.unit,
            resetCycle: values.resetCycle ?? item?.cycle, notes: values.notes,
          } });
          success = '已保存手动用量';
        } else if (kind === 'calibrate') {
          fields = h('div', { className: 'gum-fields' },
            field('可用计算单元（CU）', { name: 'balance', defaultValue: cu.balance, type: 'number', min: 0, step: 'any', required: true }),
            field('追踪额度（CU）', { name: 'monthlyAllowance', defaultValue: cu.monthlyAllowance, type: 'number', min: 1, step: 'any', required: true }),
            field('当前消耗速率（CU/h）', { name: 'burnRatePerHour', defaultValue: cu.burnRatePerHour, type: 'number', min: 0, step: 'any' }),
            field('活跃会话', { name: 'activeSessions', defaultValue: cu.activeSessions, type: 'number', min: 0, step: 1 }));
          submit = (values) => request('/account/save', { id: account.id,
            computeUnits: { ...Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value === '' ? null : Number(value)])),
              lastSyncedAt: new Date().toISOString(), source: 'manual' } });
          success = '已校准 Colab 算力';
        } else if (kind === 'estimate') {
          fields = h('p', null, `${editor.gpu.label} 预计运行 ${format(editor.duration)} 小时。本地余额将扣除 ${format(editor.cost)} CU。`);
          submit = () => request('/usage/log', { accountId: account.id, entry: {
            type: 'gpu-run', title: `运行 ${editor.gpu.label}（${editor.duration} 小时）`,
            gpu: editor.gpu.id, hours: editor.duration, unitsDelta: -editor.cost, note: '由算力估算器记入',
          } });
          success = '已记入估算消耗';
        } else {
          caution = true;
          const isLog = kind === 'delete-log';
          fields = h('p', null, isLog ? `删除「${item.title}」的流水，余额调整需手动校准。` : `删除「${item.name}」的本地用量记录。`);
          submit = () => request(isLog ? '/usage/delete' : '/benefit/delete', {
            accountId: account.id, [isLog ? 'logId' : 'benefitId']: item.id,
          });
          success = '已删除本地记录';
        }
        const dismiss = () => { if (!disabled) { setEditor(null); setMessage(null); } };
        return h(Dialog, { title, dismiss },
          h('form', { className: 'gum-stack', onSubmit: async (event) => {
            event.preventDefault();
            const values = Object.fromEntries(new FormData(event.currentTarget));
            const result = await run('write', () => submit(values), success);
            if (result) setEditor(null);
          } },
          h('h2', null, title), fields,
          message?.error && h('p', { className: 'gum-banner error', role: 'alert' }, message.text),
          h('div', { className: 'gum-actions gum-end' },
            button('取消', dismiss, { disabled }),
            button(caution ? '删除' : '保存', null, { type: 'submit', variant: caution ? 'danger' : 'primary', disabled }))));
      }

      return h('div', { className: 'gum-root' },
        h('header', { className: 'gum-header' },
          h('div', { className: 'gum-wrap' },
            h('div', { className: 'gum-top' },
              h('div', { className: 'gum-brand' },
                h('div', { className: 'gum-mark' }, h(Icon, { size: 21 })),
                h('h1', null, 'Google AI Ultra 管理')),
              h('div', { className: 'gum-toolbar' },
                h('select', { className: 'gum-control', 'aria-label': '当前 Google 账号', value: account?.id || '', disabled,
                  onChange: (event) => {
                    const accountId = event.target.value;
                    run('account', () => request('/account/select', { accountId }));
                  } }, (data?.accounts || []).map((item) =>
                    h('option', { key: item.id, value: item.id }, item.email || item.displayName))),
                button('刷新', () => run('load', () => request('/state'), '已刷新本地数据'), { disabled }),
                button(pending === 'sync' ? '正在同步 Colab…' : '同步 Colab', syncColab, { disabled: disabled || !account, variant: 'primary', icon: 'sync' }))),
            h('nav', { className: 'gum-nav', 'aria-label': 'Ultra 管理' }, tabs.map(([id, name]) =>
              h('button', { key: id, type: 'button', 'aria-current': tab === id ? 'page' : undefined, onClick: () => navigate(id) }, name))))),
        h('main', { className: 'gum-scroll', ref: scroll },
          h('div', { className: 'gum-wrap gum-content' },
            message && !editor && h('div', { className: `gum-banner ${message.error ? 'error' : ''}`, role: message.error ? 'alert' : 'status' },
              message.text, button('关闭提示', () => setMessage(null), { variant: 'small' })),
            !account && h('p', { className: 'gum-secondary' }, disabled ? '正在读取账号…' : '暂时无法读取账号数据。'),
            account && tab === 'overview' && renderOverview(),
            account && tab === 'benefits' && (catalog ? renderBenefits() : h('p', null, '会员权益暂未加载，请重载插件。')),
            account && tab === 'usage' && renderUsage(),
            account && tab === 'account' && renderAccount())),
        editor && renderDialog());
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register('googleUltraManager', 'zh', { navLabel: 'Ultra 额度' }));
        ctx.effect(() => ctx.locale.register('googleUltraManager', 'en', { navLabel: 'Ultra Quota' }));
        const t = ctx.locale.bind('googleUltraManager');
        let acpRemote;
        ctx.inject(['remote', 'remote.dshAcp'], (remoteCtx) => {
          acpRemote = remoteCtx.remote.dshAcp;
          remoteCtx.effect(() => () => { acpRemote = undefined; });
        });
        const UltraPanel = () => h(App, { getAcp: () => acpRemote });
        ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: 'google-ultra-manager' }, UltraPanel));
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register(
          { name: 'sidebar.panellist', id: 'google-ultra-manager', order: 19, label: () => t('navLabel') }, Icon,
        ));
      },
    };
  },
});
