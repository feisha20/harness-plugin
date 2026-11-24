window.__ModuleLoader__.load({
  id: '@local/colab-console',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const apiBase = '/api/colab-console';

    const css = `
.cc-root {
  --cc-bg: var(--dsw-alias-bg-base, #fff);
  --cc-surface: var(--dsw-alias-bg-layer-1, #fff);
  --cc-ink: var(--dsw-alias-label-primary, #181827);
  --cc-muted: var(--dsw-alias-label-secondary, #565b70);
  --cc-line: var(--dsw-alias-border-l2, #e1e2ea);
  --cc-accent: light-dark(#1a62d6, #8cb4ff);
  --cc-soft: color-mix(in srgb, var(--cc-accent) 9%, var(--cc-surface));
  --cc-ok: light-dark(#157f4b, #6de3a1);
  --cc-warn: light-dark(#b25e09, #ffc280);
  --cc-danger: var(--dsw-alias-state-error-primary, #b42336);
  display: flex; flex-direction: column; height: 100%; overflow: hidden; container-type: inline-size;
  background: color-mix(in srgb, var(--cc-bg) 96%, var(--cc-accent)); color: var(--cc-ink);
  font: 13px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-variant-numeric: tabular-nums;
}
.cc-root *, .cc-root *::before, .cc-root *::after { box-sizing: border-box; }
.cc-root h1, .cc-root h2, .cc-root h3, .cc-root p, .cc-root dl, .cc-root dd, .cc-root pre { margin: 0; }
.cc-root h1 { font-size: 19px; line-height: 1.25; font-weight: 740; letter-spacing: -.3px; }
.cc-root h2 { font-size: 15.5px; line-height: 1.35; font-weight: 710; }
.cc-root h3 { font-size: 13.5px; font-weight: 700; }
.cc-header { flex: none; background: var(--cc-surface); border-bottom: 1px solid var(--cc-line); }
.cc-wrap { width: min(100%, 1240px); margin-inline: auto; padding-inline: clamp(14px, 3cqi, 36px); }
.cc-top { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 15px 0 11px; flex-wrap: wrap; }
.cc-brand { display: flex; align-items: center; gap: 11px; }
.cc-mark { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 11px; background: #14366b; color: #e8f1ff; flex: none; }
.cc-toolbar, .cc-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.cc-nav { display: flex; gap: 18px; overflow: auto; }
.cc-nav button { flex: none; border: 0; border-bottom: 2px solid transparent; background: none; color: var(--cc-muted); font: inherit; font-weight: 610; padding: 9px 2px; cursor: pointer; }
.cc-nav button[aria-current] { color: var(--cc-accent); border-bottom-color: currentColor; }
.cc-nav button:hover { color: var(--cc-accent); }
.cc-scroll { min-height: 0; flex: 1; overflow: auto; }
.cc-content { display: grid; gap: 18px; align-content: start; padding: 20px 0 34px; }
.cc-hero { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 14px; }
.cc-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; align-items: start; }
.cc-card { min-width: 0; padding: 17px 19px; border: 1px solid var(--cc-line); border-radius: 14px; background: var(--cc-surface); display: grid; gap: 12px; }
.cc-balance {
  position: relative; isolation: isolate; overflow: hidden; padding: 19px 22px; border-radius: 14px; color: #fff;
  background: radial-gradient(ellipse at 100% 0%, #245cc2, transparent 70%), #122342;
}
.cc-balance-value { display: flex; align-items: baseline; gap: 10px; margin: 10px 0 8px; flex-wrap: wrap; }
.cc-balance-value strong { font-size: clamp(30px, 4cqi, 46px); font-weight: 760; line-height: 1; letter-spacing: -.04em; }
.cc-balance-sub { color: #d5e4ff; font-size: 12px; }
.cc-balance-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 12px; padding-top: 10px; border-top: 1px solid #ffffff26; }
.cc-balance-grid dt { font-size: 11.5px; color: #c7dcff; }
.cc-balance-grid dd { font-size: 15px; font-weight: 680; }
.cc-meter { height: 6px; border-radius: 99px; background: var(--cc-soft); overflow: hidden; }
.cc-meter > span { display: block; height: 100%; border-radius: inherit; background: var(--cc-accent); }
.cc-pill { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; font-weight: 650; padding: 2px 8px; border-radius: 99px; border: 1px solid var(--cc-line); background: var(--cc-soft); }
.cc-pill.ok { color: var(--cc-ok); border-color: color-mix(in srgb, var(--cc-ok) 35%, transparent); background: color-mix(in srgb, var(--cc-ok) 11%, var(--cc-surface)); }
.cc-pill.warn { color: var(--cc-warn); border-color: color-mix(in srgb, var(--cc-warn) 35%, transparent); background: color-mix(in srgb, var(--cc-warn) 11%, var(--cc-surface)); }
.cc-pill.danger { color: var(--cc-danger); border-color: color-mix(in srgb, var(--cc-danger) 35%, transparent); background: color-mix(in srgb, var(--cc-danger) 10%, var(--cc-surface)); }
.cc-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid var(--cc-line); background: var(--cc-surface); color: var(--cc-ink); border-radius: 8px; min-height: 31px; padding: 4px 11px; font: inherit; font-weight: 630; cursor: pointer; white-space: nowrap; }
.cc-btn:hover:not(:disabled) { border-color: var(--cc-accent); color: var(--cc-accent); background: var(--cc-soft); }
.cc-btn.primary, .cc-btn.primary:hover:not(:disabled) { background: #1a62d6; color: #fff; border-color: #1a62d6; }
.cc-btn.primary:hover:not(:disabled) { background: #144eb0; }
.cc-btn.danger { color: var(--cc-danger); }
.cc-btn.small { min-height: 26px; padding: 2px 8px; font-size: 12px; }
.cc-btn:disabled { opacity: .55; cursor: default; }
.cc-input { width: 100%; min-width: 0; border: 1px solid var(--cc-line); background: var(--cc-bg); color: var(--cc-ink); border-radius: 7px; padding: 6px 9px; min-height: 32px; font: inherit; }
.cc-field { display: grid; gap: 4px; font-size: 12px; color: var(--cc-muted); }
.cc-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.cc-fields .wide { grid-column: 1 / -1; }
.cc-table-wrap { overflow-x: auto; }
.cc-table { width: 100%; border-collapse: collapse; }
.cc-table th, .cc-table td { text-align: left; padding: 9px 10px; border-bottom: 1px solid var(--cc-line); vertical-align: middle; }
.cc-table th { font-size: 12px; color: var(--cc-muted); font-weight: 640; }
.cc-kv { display: grid; gap: 7px; }
.cc-kv > div { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; }
.cc-kv dt { color: var(--cc-muted); }
.cc-kv dd { font-weight: 640; text-align: right; overflow-wrap: anywhere; }
.cc-log { background: color-mix(in srgb, var(--cc-bg) 92%, #000); border: 1px solid var(--cc-line); border-radius: 10px; padding: 11px 12px; font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace; max-height: 260px; overflow: auto; white-space: pre-wrap; word-break: break-all; }
.cc-banner { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 12px; border: 1px solid var(--cc-line); border-radius: 9px; background: var(--cc-surface); }
.cc-banner.error { color: var(--cc-danger); border-color: color-mix(in srgb, var(--cc-danger) 40%, var(--cc-line)); }
.cc-backdrop { position: fixed; inset: 0; z-index: 60; background: #00000066; display: grid; place-items: center; padding: 16px; }
.cc-dialog { width: min(460px, 100%); background: var(--cc-surface); border: 1px solid var(--cc-line); border-radius: 14px; padding: 18px 20px; display: grid; gap: 14px; box-shadow: 0 20px 50px #00000033; }
@container (max-width: 780px) {
  .cc-hero, .cc-grid, .cc-fields { grid-template-columns: 1fr; }
}
`;

    function Icon({ size = 18 }) {
      return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' },
        h('rect', { x: 3, y: 4, width: 18, height: 12, rx: 2.5 }),
        h('path', { d: 'M7 10l2.5 2L7 14' }),
        h('path', { d: 'M12 14h4' }),
        h('path', { d: 'M8 20h8' }),
        h('path', { d: 'M12 16v4' }),
      );
    }

    async function api(path, body) {
      const res = await fetch(`${apiBase}${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `请求失败 (${res.status})`);
      return data;
    }

    function fmt(n, digits = 2) {
      if (n === null || n === undefined || Number.isNaN(Number(n))) return '—';
      return Number(n).toLocaleString('zh-CN', { maximumFractionDigits: digits });
    }

    function App() {
      const [tab, setTab] = React.useState('overview');
      const [overview, setOverview] = React.useState(null);
      const [selectedSession, setSelectedSession] = React.useState('g4');
      const [localPort, setLocalPort] = React.useState(8000);
      const [serviceInfo, setServiceInfo] = React.useState(null);
      const [testResult, setTestResult] = React.useState(null);
      const [testPrompt, setTestPrompt] = React.useState('你好，请用一句话介绍你自己。');
      const [testModel, setTestModel] = React.useState('qwen38-27b-nb');
      const [busy, setBusy] = React.useState('');
      const [banner, setBanner] = React.useState(null);
      const [showNewModal, setShowNewModal] = React.useState(false);
      const [showStartVllmModal, setShowStartVllmModal] = React.useState(false);

      React.useEffect(() => {
        if (document.getElementById('cc-console-style')) return;
        const style = document.createElement('style');
        style.id = 'cc-console-style';
        style.textContent = css;
        document.head.appendChild(style);
      }, []);

      const refreshOverview = React.useCallback(async (quiet = false) => {
        if (!quiet) setBusy('overview');
        try {
          const data = await api(`/overview?localPort=${localPort}`);
          setOverview(data);
          if (data.sessions?.length) {
            setSelectedSession((prev) => (data.sessions.some((s) => s.name === prev) ? prev : data.sessions[0].name));
          }
          if (!quiet) setBanner(null);
        } catch (err) {
          setBanner({ error: true, text: err.message });
        } finally {
          if (!quiet) setBusy('');
        }
      }, [localPort]);

      const inspectService = React.useCallback(async (targetSession) => {
        const sName = targetSession || selectedSession;
        if (!sName) return;
        setBusy('inspect');
        try {
          const data = await api('/service/inspect', { sessionName: sName, localPort, remotePort: 8000 });
          setServiceInfo(data);
          if (data?.tunnel?.models?.[0]?.id) {
            setTestModel(data.tunnel.models[0].id);
          } else if (data?.vllm?.remoteModels?.[0]?.id) {
            setTestModel(data.vllm.remoteModels[0].id);
          }
          setBanner(null);
        } catch (err) {
          setBanner({ error: true, text: err.message });
        } finally {
          setBusy('');
        }
      }, [selectedSession, localPort]);

      React.useEffect(() => {
        refreshOverview();
      }, [refreshOverview]);

      async function runAction(tag, fn, okMsg, { afterOverview = true, afterInspect = false } = {}) {
        setBusy(tag);
        setBanner(null);
        try {
          const res = await fn();
          if (okMsg) setBanner({ error: false, text: okMsg });
          if (res?.overview) {
            setOverview(res.overview);
          } else if (afterOverview) {
            await refreshOverview(true);
          }
          if (afterInspect) {
            await inspectService();
          }
          return res;
        } catch (err) {
          setBanner({ error: true, text: err.message });
          return null;
        } finally {
          setBusy('');
        }
      }

      const auth = overview?.auth || {};
      const quota = overview?.quota || {};
      const sessions = overview?.sessions || [];
      const tunnel = serviceInfo?.tunnel || overview?.tunnel || {};
      const gpu = serviceInfo?.gpu || null;
      const vllm = serviceInfo?.vllm || null;
      const disabled = Boolean(busy);

      const vramPct = gpu && gpu.memoryTotalMiB > 0 ? Math.min(100, Math.round((gpu.memoryUsedMiB / gpu.memoryTotalMiB) * 100)) : 0;

      return h('div', { className: 'cc-root' },
        h('header', { className: 'cc-header' },
          h('div', { className: 'cc-wrap' },
            h('div', { className: 'cc-top' },
              h('div', { className: 'cc-brand' },
                h('div', { className: 'cc-mark' }, h(Icon, { size: 20 })),
                h('div', null,
                  h('h1', null, 'Colab 算力与模型控制台'),
                  h('p', { style: { fontSize: '12px', color: 'var(--cc-muted)' } },
                    auth.email ? `${auth.email} · ${auth.authProvider || 'oauth2'}（剩余 ${auth.expiresIn || '—'}）` : '未检测到登录凭证，请在终端运行 colab sessions 完成授权'))),
              h('div', { className: 'cc-toolbar' },
                sessions.length > 0 && h('select', {
                  className: 'cc-input',
                  style: { width: 'auto', minWidth: '140px' },
                  value: selectedSession,
                  disabled,
                  onChange: (e) => setSelectedSession(e.target.value),
                }, sessions.map((s) => h('option', { key: s.name, value: s.name }, `${s.name} (${s.hardware})`))),
                h('button', { className: 'cc-btn', type: 'button', disabled, onClick: () => refreshOverview() }, busy === 'overview' ? '刷新中…' : '刷新概览'),
                h('button', { className: 'cc-btn primary', type: 'button', disabled, onClick: () => setShowNewModal(true) }, '新建会话'))),
            h('nav', { className: 'cc-nav' },
              [
                ['overview', '额度与会话'],
                ['service', '机器与服务检测 (Qwen3.8 / vLLM)'],
              ].map(([id, label]) =>
                h('button', { key: id, type: 'button', 'aria-current': tab === id ? 'page' : undefined, onClick: () => setTab(id) }, label))))),

        h('main', { className: 'cc-scroll' },
          h('div', { className: 'cc-wrap cc-content' },
            banner && h('div', { className: `cc-banner ${banner.error ? 'error' : ''}`, role: banner.error ? 'alert' : 'status' },
              h('span', null, banner.text),
              h('button', { className: 'cc-btn small', type: 'button', onClick: () => setBanner(null) }, '关闭')),

            tab === 'overview' && h(React.Fragment, null,
              h('div', { className: 'cc-hero' },
                h('div', { className: 'cc-balance' },
                  h('div', { className: 'cc-balance-sub' }, 'Colab 计算单元实时余额 (colab usage)'),
                  h('div', { className: 'cc-balance-value' },
                    h('strong', null, fmt(quota.balance)),
                    h('span', null, 'Compute Units')),
                  h('dl', { className: 'cc-balance-grid' },
                    h('div', null, h('dt', null, '当前消耗速率'), h('dd', null, quota.usageRatePerHour !== null ? `${fmt(quota.usageRatePerHour)} CU/h` : '—')),
                    h('div', null, h('dt', null, '预计可用时长'), h('dd', null, quota.estimatedHoursLeft !== null ? `约 ${fmt(quota.estimatedHoursLeft, 1)} h` : '未计费')),
                    h('div', null, h('dt', null, '活跃实例数'), h('dd', null, quota.activeAssignments ?? sessions.length)))),

                h('div', { className: 'cc-card' },
                  h('h2', null, '本机接入状态 (OpenAI 兼容)'),
                  h('dl', { className: 'cc-kv' },
                    h('div', null, h('dt', null, '本地隧道'), h('dd', null,
                      tunnel.listening
                        ? h('span', { className: 'cc-pill ok' }, `监听中 :${tunnel.port} (PID ${tunnel.pid})`)
                        : h('span', { className: 'cc-pill warn' }, `未监听 :${tunnel.port}`))),
                    h('div', null, h('dt', null, 'API 服务'), h('dd', null,
                      tunnel.apiReady
                        ? h('span', { className: 'cc-pill ok' }, '已就绪')
                        : h('span', { className: 'cc-pill danger' }, tunnel.apiError || '未连接'))),
                    h('div', null, h('dt', null, 'Base URL'), h('dd', null, tunnel.endpoint || `http://127.0.0.1:${localPort}/v1`)),
                    h('div', null, h('dt', null, '可用模型'), h('dd', null,
                      tunnel.models?.length ? tunnel.models.map((m) => m.id).join(', ') : '—'))),
                  h('div', { className: 'cc-actions' },
                    !tunnel.listening
                      ? h('button', {
                          className: 'cc-btn primary',
                          type: 'button',
                          disabled: disabled || !selectedSession,
                          onClick: () => runAction('tunnel-on', () => api('/service/tunnel/start', { sessionName: selectedSession, localPort }), `已开启到 ${selectedSession} 的本地隧道`),
                        }, busy === 'tunnel-on' ? '开启中…' : `开启 ${selectedSession || ''} 隧道`)
                      : h('button', {
                          className: 'cc-btn danger',
                          type: 'button',
                          disabled,
                          onClick: () => runAction('tunnel-off', () => api('/service/tunnel/stop', { localPort }), '已关闭本地 SSH 隧道'),
                        }, busy === 'tunnel-off' ? '关闭中…' : '关闭隧道'),
                    h('button', {
                      className: 'cc-btn',
                      type: 'button',
                      disabled,
                      onClick: () => { setTab('service'); inspectService(); },
                    }, '进入机器检测')))),

              h('div', { className: 'cc-card' },
                h('div', { className: 'cc-top', style: { padding: 0 } },
                  h('h2', null, `活跃会话列表 (${sessions.length})`),
                  h('button', { className: 'cc-btn small', type: 'button', disabled, onClick: () => refreshOverview() }, '同步会话')),
                sessions.length === 0
                  ? h('p', { style: { color: 'var(--cc-muted)' } }, '当前没有运行中的 Colab 实例，点击右上角「新建会话」可创建。')
                  : h('div', { className: 'cc-table-wrap' },
                      h('table', { className: 'cc-table' },
                        h('thead', null, h('tr', null,
                          h('th', null, '会话名'),
                          h('th', null, '硬件 / 规格'),
                          h('th', null, '状态'),
                          h('th', null, '实例 ID'),
                          h('th', null, '操作'))),
                        h('tbody', null, sessions.map((s) => h('tr', { key: s.name },
                          h('td', null, h('strong', null, s.name)),
                          h('td', null, `${s.hardware} · ${s.shape}`),
                          h('td', null, h('span', { className: `cc-pill ${s.status === 'IDLE' ? 'ok' : 'warn'}` }, s.status || 'UNKNOWN')),
                          h('td', { style: { fontSize: '12px', color: 'var(--cc-muted)' } }, s.endpoint),
                          h('td', null, h('div', { className: 'cc-actions' },
                            h('button', { className: 'cc-btn small', type: 'button', disabled, onClick: () => { setSelectedSession(s.name); setTab('service'); inspectService(s.name); } }, '检测机器'),
                            h('button', { className: 'cc-btn small', type: 'button', disabled, onClick: () => runAction('url', async () => {
                              const r = await api('/sessions/url', { name: s.name });
                              if (r.url) window.open(r.url, '_blank', 'noopener,noreferrer');
                              return r;
                            }, '已在新窗口打开 Colab Web UI', { afterOverview: false }) }, '打开网页'),
                            h('button', { className: 'cc-btn small danger', type: 'button', disabled, onClick: () => {
                              if (window.confirm(`确定要停止并释放实例「${s.name}」吗？释放后当前运行的服务和内存数据将丢失。`)) {
                                runAction('stop', () => api('/sessions/stop', { name: s.name }), `已停止并释放会话 ${s.name}`);
                              }
                            } }, '释放实例')))))))))),

            tab === 'service' && h(React.Fragment, null,
              h('div', { className: 'cc-card' },
                h('div', { className: 'cc-top', style: { padding: 0 } },
                  h('div', null,
                    h('h2', null, `远端机器与服务检测：${selectedSession || '未选择会话'}`),
                    h('p', { style: { fontSize: '12px', color: 'var(--cc-muted)' } },
                      serviceInfo ? `上次检测：${new Date(serviceInfo.fetchedAt).toLocaleTimeString()} · 通道：${serviceInfo.inspectedVia}` : '点击右侧「检测机器状态」实时读取 GPU、显存、vLLM 与隧道状态')),
                  h('div', { className: 'cc-actions' },
                    h('button', { className: 'cc-btn primary', type: 'button', disabled: disabled || !selectedSession, onClick: () => inspectService() },
                      busy === 'inspect' ? '正在检测…' : '检测机器状态')))),

              h('div', { className: 'cc-grid' },
                h('div', { className: 'cc-card' },
                  h('h3', null, 'GPU 与显存使用情况'),
                  gpu
                    ? h(React.Fragment, null,
                        h('dl', { className: 'cc-kv' },
                          h('div', null, h('dt', null, 'GPU 型号'), h('dd', null, gpu.name)),
                          h('div', null, h('dt', null, '显存占用'), h('dd', null, `${fmt(gpu.memoryUsedMiB, 0)} / ${fmt(gpu.memoryTotalMiB, 0)} MiB (${vramPct}%)`)),
                          h('div', null, h('dt', null, 'GPU 利用率'), h('dd', null, `${gpu.gpuUtilPct}%`)),
                          h('div', null, h('dt', null, '温度'), h('dd', null, `${gpu.temperatureC} °C`))),
                        h('div', { className: 'cc-meter' }, h('span', { style: { width: `${vramPct}%` } })))
                    : h('p', { style: { color: 'var(--cc-muted)' } }, '尚未读取 GPU 信息，请点击「检测机器状态」。')),

                h('div', { className: 'cc-card' },
                  h('h3', null, 'vLLM 推理服务与本机隧道控制'),
                  h('dl', { className: 'cc-kv' },
                    h('div', null, h('dt', null, '远端 vLLM 进程'), h('dd', null,
                      vllm ? (vllm.running ? h('span', { className: 'cc-pill ok' }, '运行中') : h('span', { className: 'cc-pill danger' }, '未运行')) : '—')),
                    h('div', null, h('dt', null, '远端 8000 接口'), h('dd', null,
                      vllm ? (vllm.remoteApiReady ? h('span', { className: 'cc-pill ok' }, '就绪') : h('span', { className: 'cc-pill warn' }, '未就绪')) : '—')),
                    h('div', null, h('dt', null, '本机 SSH 隧道'), h('dd', null,
                      tunnel.listening ? h('span', { className: 'cc-pill ok' }, `:${tunnel.port} 连通`) : h('span', { className: 'cc-pill warn' }, '未连接')))),
                  h('div', { className: 'cc-actions' },
                    h('button', {
                      className: 'cc-btn primary',
                      type: 'button',
                      disabled: disabled || !selectedSession,
                      onClick: () => setShowStartVllmModal(true),
                    }, '启动 / 重启 vLLM'),
                    h('button', {
                      className: 'cc-btn danger',
                      type: 'button',
                      disabled: disabled || !selectedSession,
                      onClick: () => runAction('vllm-stop', () => api('/service/vllm/stop', { sessionName: selectedSession }), '已停止远端 vLLM 服务', { afterOverview: false, afterInspect: true }),
                    }, busy === 'vllm-stop' ? '停止中…' : '关闭 vLLM'),
                    !tunnel.listening
                      ? h('button', {
                          className: 'cc-btn',
                          type: 'button',
                          disabled: disabled || !selectedSession,
                          onClick: () => runAction('tunnel-on', () => api('/service/tunnel/start', { sessionName: selectedSession, localPort }), '本机隧道已开启', { afterOverview: true, afterInspect: true }),
                        }, '开启本机隧道')
                      : h('button', {
                          className: 'cc-btn danger',
                          type: 'button',
                          disabled,
                          onClick: () => runAction('tunnel-off', () => api('/service/tunnel/stop', { localPort }), '本机隧道已关闭', { afterOverview: true, afterInspect: true }),
                        }, '关闭本机隧道')))),

              h('div', { className: 'cc-card' },
                h('h3', null, '推理速度与可用性实测（经本机隧道）'),
                h('div', { className: 'cc-fields' },
                  h('label', { className: 'cc-field' }, '模型 ID',
                    h('input', { className: 'cc-input', value: testModel, onChange: (e) => setTestModel(e.target.value) })),
                  h('label', { className: 'cc-field' }, '本机端口',
                    h('input', { className: 'cc-input', type: 'number', value: localPort, onChange: (e) => setLocalPort(Number(e.target.value) || 8000) })),
                  h('label', { className: 'cc-field wide' }, '测试提示词',
                    h('input', { className: 'cc-input', value: testPrompt, onChange: (e) => setTestPrompt(e.target.value) }))),
                h('div', { className: 'cc-actions' },
                  h('button', {
                    className: 'cc-btn primary',
                    type: 'button',
                    disabled: disabled || !tunnel.apiReady,
                    onClick: () => runAction('test', async () => {
                      const r = await api('/service/test', { localPort, model: testModel, prompt: testPrompt, maxTokens: 160 });
                      setTestResult(r);
                      return r;
                    }, null, { afterOverview: false }),
                  }, busy === 'test' ? '推理测试中…' : '发送测试请求')),
                testResult && h('div', { className: 'cc-card', style: { background: 'var(--cc-bg)' } },
                  h('div', { className: 'cc-actions' },
                    h('span', { className: 'cc-pill ok' }, `首字延迟 ${testResult.ttftMs} ms`),
                    h('span', { className: 'cc-pill ok' }, `生成速度 ${testResult.decodeTokPerSec ?? '—'} tok/s`),
                    h('span', { className: 'cc-pill' }, `输出 ${testResult.completionTokens} tokens · 总耗时 ${testResult.totalMs} ms`)),
                  testResult.reasoning && h('p', { style: { fontSize: '12px', color: 'var(--cc-muted)' } }, `思考摘要：${testResult.reasoning}`),
                  h('p', null, testResult.content || '(空)'))),

              vllm?.logTail && h('div', { className: 'cc-card' },
                h('h3', null, '远端服务日志（最近 35 行）'),
                h('pre', { className: 'cc-log' }, vllm.logTail))))),

        showNewModal && h('div', { className: 'cc-backdrop', onClick: (e) => e.target === e.currentTarget && !disabled && setShowNewModal(false) },
          h('form', {
            className: 'cc-dialog',
            onSubmit: async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const res = await runAction('new-sess', () => api('/sessions/new', {
                name: fd.get('name'),
                gpu: fd.get('gpu'),
                highMem: fd.get('highMem') === 'on',
              }), '新会话创建成功');
              if (res) setShowNewModal(false);
            },
          },
          h('h2', null, '新建 Colab 会话'),
          h('div', { className: 'cc-fields' },
            h('label', { className: 'cc-field' }, '会话名称',
              h('input', { className: 'cc-input', name: 'name', defaultValue: 'g4', required: true })),
            h('label', { className: 'cc-field' }, 'GPU 规格',
              h('select', { className: 'cc-input', name: 'gpu', defaultValue: 'G4' },
                h('option', { value: 'G4' }, 'G4 (RTX PRO 6000 96GB)'),
                h('option', { value: 'A100' }, 'A100'),
                h('option', { value: 'H100' }, 'H100'),
                h('option', { value: 'L4' }, 'L4'),
                h('option', { value: 'T4' }, 'T4'),
                h('option', { value: '' }, 'CPU (无 GPU)'))),
            h('label', { className: 'cc-field wide', style: { display: 'flex', alignItems: 'center', gap: '8px' } },
              h('input', { type: 'checkbox', name: 'highMem' }), '请求高内存规格 (--high-mem)')),
          h('div', { className: 'cc-actions', style: { justifyContent: 'flex-end' } },
            h('button', { className: 'cc-btn', type: 'button', disabled, onClick: () => setShowNewModal(false) }, '取消'),
            h('button', { className: 'cc-btn primary', type: 'submit', disabled }, busy === 'new-sess' ? '创建中…' : '创建')))),

        showStartVllmModal && h('div', { className: 'cc-backdrop', onClick: (e) => e.target === e.currentTarget && !disabled && setShowStartVllmModal(false) },
          h('form', {
            className: 'cc-dialog',
            onSubmit: async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const res = await runAction('vllm-start', () => api('/service/vllm/start', {
                sessionName: selectedSession,
                model: fd.get('model'),
                servedName: fd.get('servedName'),
                maxModelLen: Number(fd.get('maxModelLen')) || 262144,
                enableMtp: fd.get('enableMtp') === 'on',
                enableTools: fd.get('enableTools') === 'on',
              }), '已在远端拉起 vLLM，请等待约 30-60 秒后点击「检测机器状态」', { afterOverview: false, afterInspect: true });
              if (res) setShowStartVllmModal(false);
            },
          },
          h('h2', null, `启动 / 重启 vLLM (${selectedSession})`),
          h('div', { className: 'cc-fields' },
            h('label', { className: 'cc-field wide' }, 'HuggingFace 模型',
              h('input', { className: 'cc-input', name: 'model', defaultValue: 'sakamakismile/Huihui-Qwen3.8-27B-abliterated-NVFP4', required: true })),
            h('label', { className: 'cc-field wide' }, '对外模型名 (--served-model-name)',
              h('input', { className: 'cc-input', name: 'servedName', defaultValue: 'qwen3.8-27b-abliterated qwen38-27b-nb', required: true })),
            h('label', { className: 'cc-field' }, '最大上下文长度',
              h('input', { className: 'cc-input', name: 'maxModelLen', type: 'number', defaultValue: 262144 })),
            h('label', { className: 'cc-field', style: { display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px' } },
              h('input', { type: 'checkbox', name: 'enableMtp', defaultChecked: true }), '开启 MTP 投机解码'),
            h('label', { className: 'cc-field wide', style: { display: 'flex', alignItems: 'center', gap: '8px' } },
              h('input', { type: 'checkbox', name: 'enableTools', defaultChecked: true }), '开启工具调用解析 (--enable-auto-tool-choice)')),
          h('div', { className: 'cc-actions', style: { justifyContent: 'flex-end' } },
            h('button', { className: 'cc-btn', type: 'button', disabled, onClick: () => setShowStartVllmModal(false) }, '取消'),
            h('button', { className: 'cc-btn primary', type: 'submit', disabled }, busy === 'vllm-start' ? '启动中…' : '立即启动')))));
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register('colabConsole', 'zh', { navLabel: 'Colab 控制台' }));
        ctx.effect(() => ctx.locale.register('colabConsole', 'en', { navLabel: 'Colab Console' }));
        const t = ctx.locale.bind('colabConsole');
        const Panel = () => h(App);
        ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: 'colab-console' }, Panel));
        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register({ name: 'sidebar.panellist', id: 'colab-console', order: 20, label: () => t('navLabel') }, Icon));
      },
    };
  },
});
