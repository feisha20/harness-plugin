window.__ModuleLoader__.load({
  id: '@local/dsh-account-balance',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    function WalletIcon({ size = 16, color = 'currentColor' }) {
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: color,
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        style: { display: 'block', flexShrink: 0 }
      },
        h('rect', { x: 2, y: 5, width: 20, height: 14, rx: 3 }),
        h('line', { x1: 2, y1: 10, x2: 22, y2: 10 }),
        h('circle', { cx: 16, cy: 15, r: 1.5, fill: color })
      );
    }

    function RefreshIcon({ size = 13, spinning = false }) {
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2.2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        style: {
          display: 'block',
          flexShrink: 0,
          transition: 'transform 0.4s ease',
          animation: spinning ? 'dsh-balance-spin 0.8s linear infinite' : 'none'
        }
      },
        h('path', { d: 'M21.5 2v6h-6' }),
        h('path', { d: 'M2.5 22v-6h6' }),
        h('path', { d: 'M2 11.5a10 10 0 0 1 18.8-4.3L21.5 8' }),
        h('path', { d: 'M22 12.5a10 10 0 0 1-18.8 4.2L2.5 16' })
      );
    }

    function formatAmount(amount, currency) {
      const sym = currency === 'USD' ? '$' : '¥';
      const n = parseFloat(amount);
      if (isNaN(n)) return sym + '0.00';
      return sym + n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function renderBadgeContent(badge, state, fetchBalance, isZh) {
      badge.innerHTML = '';
      badge.style.display = 'inline-flex';
      badge.style.alignItems = 'center';
      badge.style.gap = '5px';
      badge.style.padding = '0';
      badge.style.height = '24px';
      badge.style.boxSizing = 'border-box';
      badge.style.background = 'transparent';
      badge.style.border = 'none';
      badge.style.fontSize = '12px';
      badge.style.lineHeight = '1';
      badge.style.color = 'var(--dsw-alias-label-secondary, #737780)';
      badge.style.cursor = 'pointer';
      badge.style.flexShrink = '0';
      badge.style.userSelect = 'none';
      badge.style.marginLeft = '8px';
      badge.style.verticalAlign = 'middle';
      badge.style.whiteSpace = 'nowrap';
      badge.style.fontVariantNumeric = 'tabular-nums';

      let mainText = '¥0.00';
      if (state.wallets && state.wallets.length > 0) {
        mainText = state.wallets.map(w => formatAmount(w.balance, w.currency)).join(' / ');
      }
      let bonusText = '';
      if (state.bonusWallets && state.bonusWallets.length > 0) {
        const pos = state.bonusWallets.filter(w => parseFloat(w.balance) > 0);
        if (pos.length > 0) {
          bonusText = pos.map(w => formatAmount(w.balance, w.currency)).join(' / ');
        }
      }

      const tooltipTitle = state.loading
        ? (isZh ? '余额加载中...' : 'Loading balance...')
        : state.error
        ? (isZh ? '余额暂不可用 · 点击刷新' : 'Balance unavailable · Click to refresh')
        : state.signedIn !== true
        ? (isZh ? '账户未登录 · 点击刷新' : 'Account not signed in · Click to refresh')
        : (isZh ? '账户余额: ' : 'Balance: ') + mainText + (bonusText ? (isZh ? ' (赠金: ' : ' (Bonus: ') + bonusText + ')' : '') + (isZh ? ' · 点击充值 · 点击刷新' : ' · Click to top up · Click to refresh');

      badge.title = tooltipTitle;

      badge.onclick = (e) => {
        e.stopPropagation();
        if (state.error || !state.signedIn) {
          fetchBalance(true);
        } else {
          window.open('https://platform.deepseek.com/top_up', '_blank', 'noopener,noreferrer');
        }
      };

      if (state.loading) {
        const loadingSpan = document.createElement('span');
        loadingSpan.textContent = isZh ? '加载中...' : 'Loading...';
        loadingSpan.style.color = 'var(--dsw-alias-label-secondary, #94a3b8)';
        loadingSpan.style.fontSize = '11px';
        badge.appendChild(loadingSpan);
      } else if (state.error) {
        const errorSpan = document.createElement('span');
        errorSpan.textContent = isZh ? '余额暂不可用' : 'Balance unavailable';
        badge.appendChild(errorSpan);
      } else if (state.signedIn !== true) {
        const unauthSpan = document.createElement('span');
        unauthSpan.textContent = isZh ? '未登录' : 'Signed out';
        unauthSpan.style.color = 'var(--dsw-alias-label-secondary, #94a3b8)';
        unauthSpan.style.fontSize = '11px';
        badge.appendChild(unauthSpan);
      } else {
        const textSpan = document.createElement('span');
        textSpan.textContent = mainText;
        textSpan.style.fontWeight = '500';
        textSpan.style.fontSize = '12px';
        textSpan.style.letterSpacing = '0';
        badge.appendChild(textSpan);
      }

      const refreshBtn = document.createElement('span');
      refreshBtn.className = 'dsh-balance-refresh';
      refreshBtn.setAttribute('role', 'button');
      refreshBtn.tabIndex = 0;
      refreshBtn.setAttribute('aria-label', isZh ? '刷新余额' : 'Refresh balance');
      refreshBtn.title = isZh ? '刷新余额' : 'Refresh balance';
      refreshBtn.setAttribute('aria-disabled', String(state.refreshing || state.loading));
      refreshBtn.setAttribute('data-refreshing', String(state.refreshing));
      refreshBtn.style.display = 'inline-flex';
      refreshBtn.style.alignItems = 'center';
      refreshBtn.style.justifyContent = 'center';
      refreshBtn.style.width = '20px';
      refreshBtn.style.height = '20px';
      refreshBtn.style.borderRadius = '5px';
      refreshBtn.style.color = 'var(--dsw-alias-label-secondary, #94a3b8)';

      refreshBtn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="display:block;${state.refreshing ? 'animation:dsh-balance-spin 0.8s linear infinite;' : ''}"><path d="M21.5 2v6h-6"/><path d="M2.5 22v-6h6"/><path d="M2 11.5a10 10 0 0 1 18.8-4.3L21.5 8"/><path d="M22 12.5a10 10 0 0 1-18.8 4.2L2.5 16"/></svg>`;

      refreshBtn.onclick = (e) => {
        e.stopPropagation();
        if (!state.refreshing && !state.loading) fetchBalance(true);
      };
      refreshBtn.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          refreshBtn.onclick(e);
        }
      };
      badge.appendChild(refreshBtn);
    }

    function AccountBalanceWidget(props) {
      const ctx = props.ctx;
      const wide = props.wide !== false;
      const requestRevision = React.useRef(0);

      const [state, setState] = React.useState({
        loading: true,
        signedIn: null,
        wallets: [],
        bonusWallets: [],
        error: null,
        topUpUrl: 'https://platform.deepseek.com/top_up',
        refreshing: false,
      });

      const fetchBalance = React.useCallback(async (isManual = false) => {
        const revision = ++requestRevision.current;
        if (isManual) {
          setState(prev => ({ ...prev, refreshing: true, error: null }));
        }
        try {
          const remote = ctx && ctx.remote;
          if (!remote || !remote.account) {
            console.warn('[dsh-account-balance] 账户接口尚未就绪');
            setState(prev => ({ ...prev, loading: false, refreshing: false, error: 'no_service' }));
            return;
          }

          // 登录状态独立于余额接口；网络故障不能解释为退出登录。
          const stateRes = await remote.account.getState();
          if (revision !== requestRevision.current) return;
          const wrapped = stateRes && typeof stateRes === 'object' && 'ok' in stateRes;
          if (wrapped && !stateRes.ok) throw new Error('account_state_failed');
          const accountView = wrapped ? stateRes.value : stateRes;
          if (!['credential-stored', 'signed-out'].includes(accountView?.status)) {
            throw new Error('account_state_invalid');
          }
          const signedIn = accountView.status === 'credential-stored';
          setState(prev => ({
            ...prev, signedIn, wallets: [], bonusWallets: [],
            loading: signedIn, refreshing: signedIn && isManual, error: null,
          }));
          if (!signedIn) return;

          const currentLocale = ctx.locale ? ctx.locale.getSnapshot().active : 'zh';
          const clientMeta = {
            version: '0.2.2-rc.1',
            locale: currentLocale || 'zh_CN',
            timezoneOffsetSeconds: -new Date().getTimezoneOffset() * 60,
          };

          const balRes = await remote.account.getBalance(clientMeta);
          if (revision !== requestRevision.current) return;
          const balOutcome = balRes && typeof balRes === 'object' && 'ok' in balRes
            ? (balRes.ok ? balRes.value : null)
            : balRes;

          if (balOutcome && balOutcome.status === 'ready') {
            setState({
              loading: false,
              signedIn: true,
              wallets: balOutcome.value || [],
              bonusWallets: balOutcome.bonusWallets || [],
              error: null,
              topUpUrl: 'https://platform.deepseek.com/top_up',
              refreshing: false,
            });
            return;
          }

          setState(prev => ({
            ...prev, loading: false, refreshing: false, error: 'balance_failed',
          }));
        } catch (err) {
          if (revision !== requestRevision.current) return;
          console.error('[dsh-account-balance] 查询账户余额失败:', err);
          setState(prev => ({
            ...prev,
            loading: false,
            refreshing: false,
            error: err instanceof Error ? err.message : String(err),
          }));
        }
      }, [ctx]);

      React.useEffect(() => {
        fetchBalance();
        const intervalId = setInterval(() => {
          fetchBalance();
        }, 60000);

        const onFocus = () => fetchBalance();
        window.addEventListener('focus', onFocus);

        const unsubExpired = ctx?.remote?.$on?.('deepseek-account/session-expired', () => {
          fetchBalance();
        });

        return () => {
          requestRevision.current++;
          clearInterval(intervalId);
          window.removeEventListener('focus', onFocus);
          if (typeof unsubExpired === 'function') unsubExpired();
        };
      }, [fetchBalance, ctx]);

      // 与官方账户界面一样订阅 Host 状态流，登录或退出后立即重新查询。
      React.useEffect(() => {
        if (!ctx?.remote?.$stream) return;
        let disposed = false;
        const stream = ctx.remote.$stream({
          name: 'account',
          open: signal => ctx.remote.account.watch(signal),
          ended: () => new Error('账户状态订阅已断开'),
        });
        (async () => {
          for await (const frame of stream) {
            if (disposed) return;
            frame.accept();
            fetchBalance();
          }
        })().catch(err => {
          if (!disposed) console.warn('[dsh-account-balance] 账户状态订阅失败:', err);
        });
        return () => {
          disposed = true;
          stream.dispose();
        };
      }, [ctx, fetchBalance]);

      const isZh = !ctx?.locale || ctx.locale.getSnapshot().active?.startsWith('zh');

      // 将余额徽章放到昵称旁；数据更新时只渲染一次。
      React.useEffect(() => {
        let badge = document.getElementById('dsh-account-balance-badge');
        if (!badge) {
          badge = document.createElement('span');
          badge.id = 'dsh-account-balance-badge';
        }

        renderBadgeContent(badge, state, fetchBalance, isZh);
        if (!wide) badge.style.display = 'none';

        const attachBadge = () => {
          const trigger = document.querySelector('[class*="settingsArea"] button[class*="trigger"]')
            || document.querySelector('button[class*="trigger"][data-signed-out]');

          if (!trigger) return;

          if (!wide) return;

          const label = trigger.querySelector('[class*="label"]') || trigger.lastElementChild;
          if (label && label !== badge && badge.previousElementSibling !== label) {
            label.after(badge);
          } else if (!trigger.contains(badge)) {
            trigger.appendChild(badge);
          }
        };

        attachBadge();

        // 监听器只恢复挂载位置，不重绘徽章，避免自身 DOM 更新触发无限微任务循环。
        // 观察整个侧栏所在文档，保证 settingsArea 被替换后也能重新挂载。
        const targetContainer = document.body;
        const observer = new MutationObserver(() => {
          // 暂停监听自身的移动操作，避免把重新挂载再次作为外部变更处理。
          observer.disconnect();
          try {
            attachBadge();
          } finally {
            observer.observe(targetContainer, { childList: true, subtree: true });
          }
        });

        observer.observe(targetContainer, { childList: true, subtree: true });

        return () => {
          observer.disconnect();
          if (badge && badge.parentElement) {
            badge.parentElement.removeChild(badge);
          }
        };
      }, [wide, state, fetchBalance, isZh]);

      // Collapsed rail mode
      if (!wide) {
        let mainBalanceText = '';
        if (state.wallets && state.wallets.length > 0) {
          mainBalanceText = state.wallets.map(w => formatAmount(w.balance, w.currency)).join(' / ');
        } else if (state.signedIn && !state.loading) {
          mainBalanceText = '¥0.00';
        }

        const tooltipTitle = state.loading
          ? (isZh ? '余额加载中...' : 'Loading balance...')
          : state.error
          ? (isZh ? '余额暂不可用 · 点击刷新' : 'Balance unavailable · Click to refresh')
          : state.signedIn !== true
          ? (isZh ? '账户未登录' : 'Account not signed in')
          : (isZh ? '账户余额: ' : 'Balance: ') + mainBalanceText;

        return h('button', {
          type: 'button',
          title: tooltipTitle,
          'aria-label': tooltipTitle,
          onClick: () => fetchBalance(true),
          style: {
            width: '36px',
            height: '36px',
            margin: '2px auto',
            padding: 0,
            borderRadius: 'var(--dsw-radius-md, 8px)',
            background: 'transparent',
            border: 'none',
            color: state.signedIn ? 'var(--dsw-alias-brand-primary, #10a37f)' : 'var(--dsw-alias-label-secondary, #64748b)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s ease'
          },
          onMouseEnter: (e) => {
            e.currentTarget.style.background = 'var(--dsw-alias-interactive-bg-hover, rgba(128, 128, 128, 0.1))';
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.background = 'transparent';
          }
        },
          h(WalletIcon, { size: 16 })
        );
      }

      // In wide mode, we render nothing into sidebar.footer.action so that
      // footerActions takes 0 height and no vertical space above the nickname.
      return h('div', { style: { display: 'none' } });
    }

    // 刷新入口默认隐藏但保留占位，悬停时昵称与余额不会跳动。
    if (typeof document !== 'undefined' && !document.getElementById('dsh-account-balance-style')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'dsh-account-balance-style';
      styleEl.textContent = `
        @keyframes dsh-balance-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        #dsh-account-balance-badge .dsh-balance-refresh {
          opacity: 0;
          pointer-events: none;
          flex-shrink: 0;
          transition: opacity 140ms ease, background 140ms ease;
        }
        #dsh-account-balance-badge:hover .dsh-balance-refresh,
        #dsh-account-balance-badge:focus-within .dsh-balance-refresh,
        #dsh-account-balance-badge .dsh-balance-refresh[data-refreshing="true"] {
          opacity: 1;
          pointer-events: auto;
        }
        #dsh-account-balance-badge .dsh-balance-refresh:hover {
          background: var(--dsw-alias-interactive-bg-hover, rgba(128, 128, 128, 0.12));
        }
        #dsh-account-balance-badge .dsh-balance-refresh:focus-visible {
          outline: 2px solid var(--dsw-alias-brand-primary, #4d6bfe);
          outline-offset: 2px;
        }
        @media (hover: none) {
          #dsh-account-balance-badge .dsh-balance-refresh {
            opacity: 1;
            pointer-events: auto;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          #dsh-account-balance-badge .dsh-balance-refresh { transition: none; }
          #dsh-account-balance-badge .dsh-balance-refresh svg { animation: none !important; }
        }
      `;
      document.head.appendChild(styleEl);
    }

    return {
      inject: ['slots', 'remote', 'remote.account', 'locale', 'theme'],
      apply(ctx) {
        ctx.slots.inject('sidebar.footer.action', () => {
          return ctx.slots.register({
            name: 'sidebar.footer.action',
            id: 'dsh-account-balance',
            order: -100,
            label: () => (ctx.locale ? (ctx.locale.getSnapshot().active?.startsWith('zh') ? '账户余额' : 'Account Balance') : 'Account Balance'),
          }, (props) => h(AccountBalanceWidget, { ...props, ctx }));
        });
      }
    };
  }
});
