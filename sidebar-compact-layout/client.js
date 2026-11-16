window.__ModuleLoader__.load({
  id: '@local/sidebar-compact-layout',
  factory() {
    const NAV = 'data-dsh-compact-menu';
    const CELL = 'data-dsh-compact-cell';
    const SYSTEM_IDS = new Set(['plugins', 'schedules']);
    const SIDEBAR_CSS = '@deepseek-ai/dsh-client-ui-sidebar/SidebarRoot.module.css';
    const css = `
nav[${NAV}] {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2px 4px;
}
nav[${NAV}] > * { grid-column: 1 / -1; min-width: 0; }
nav[${NAV}] > [${CELL}="custom"] { grid-column: auto; min-width: 0; }
nav[${NAV}] > [${CELL}="custom"] button,
nav[${NAV}] > button[${CELL}="custom"] {
  width: 100%; min-width: 0; min-height: 32px;
  padding: 5px 6px; gap: 6px;
}
nav[${NAV}] > [${CELL}="custom"] button > span:last-child,
nav[${NAV}] > button[${CELL}="custom"] > span:last-child {
  min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
`;

    // 从宿主自己的样式表读取类名，避免写死本次构建的哈希前缀。
    function sidebarClasses(doc) {
      const text = doc.querySelector(`style[data-plugin-css="${SIDEBAR_CSS}"]`)?.textContent ?? '';
      const read = (suffix) => text.match(new RegExp(`\\.([\\w-]+_${suffix})(?=[\\s.{:#\\[])`))?.[1];
      const root = read('root');
      const collapsed = read('collapsed');
      const panelList = read('panelList');
      return root && collapsed && panelList ? { root, collapsed, panelList } : null;
    }

    function menuLabels(ctx) {
      const labels = new Map();
      for (const { options } of ctx.slots.entriesOfSlot('sidebar.panellist')) {
        const label = typeof options.label === 'function' ? options.label() : options.label;
        const name = typeof label === 'string' ? label : options.id;
        // 同名入口无法从 DOM 唯一区分，保守地保留整行。
        labels.set(name, labels.has(name) ? false : !SYSTEM_IDS.has(options.id));
      }
      return labels;
    }

    function install(ctx, doc = document, win = window) {
      const style = doc.createElement('style');
      style.dataset.plugin = '@local/sidebar-compact-layout';
      style.textContent = css;
      const changes = new Map();
      let stopped = false;
      let frame = null;

      function setOwned(element, attribute, value) {
        let attributes = changes.get(element);
        if (!attributes) changes.set(element, attributes = new Map());
        if (!attributes.has(attribute)) attributes.set(attribute, { before: element.getAttribute(attribute), value });
        attributes.get(attribute).value = value;
        if (element.getAttribute(attribute) !== value) element.setAttribute(attribute, value);
      }

      function restore(element) {
        for (const [name, { before, value }] of changes.get(element) ?? []) {
          // 宿主后来更新的属性归宿主管理，不用旧值覆盖它。
          if (element.getAttribute(name) !== value) continue;
          if (before === null) element.removeAttribute(name);
          else element.setAttribute(name, before);
        }
        changes.delete(element);
      }

      function sync() {
        if (stopped) return;
        const touched = new Set();
        const classes = sidebarClasses(doc);
        if (classes) {
          const labels = menuLabels(ctx);
          for (const nav of doc.getElementsByClassName(classes.panelList)) {
            const root = nav.closest(`.${classes.root}`);
            if (nav.tagName !== 'NAV' || !root || root.classList.contains(classes.collapsed)) continue;
            setOwned(nav, NAV, '');
            touched.add(nav);
            for (const child of nav.children) {
              const button = child.matches('button[aria-label]') ? child : child.querySelector('button[aria-label]');
              if (!button || button.hasAttribute('aria-haspopup')) continue;
              const label = button.getAttribute('aria-label');
              if (labels.get(label) !== true) continue;
              setOwned(child, CELL, 'custom');
              touched.add(child);
              const ownedTitle = changes.get(button)?.get('title');
              if (!button.hasAttribute('title') || (ownedTitle && button.getAttribute('title') === ownedTitle.value)) {
                setOwned(button, 'title', label);
                touched.add(button);
              }
            }
          }
        }
        for (const element of changes.keys()) if (!touched.has(element)) restore(element);
      }

      // 合并同一帧的菜单加载、语言切换和侧栏折叠通知。
      function schedule() {
        if (stopped || frame !== null) return;
        frame = win.requestAnimationFrame(() => { frame = null; sync(); });
      }

      const observer = new win.MutationObserver(schedule);
      const disposers = [];
      const cleanup = () => {
        stopped = true;
        observer.disconnect();
        if (frame !== null) win.cancelAnimationFrame(frame);
        for (const dispose of disposers) dispose();
        for (const element of changes.keys()) restore(element);
        style.remove();
      };
      try {
        doc.head.appendChild(style);
        observer.observe(doc.documentElement, {
          childList: true, subtree: true, attributes: true,
          attributeFilter: ['class', 'aria-label', 'aria-haspopup'],
        });
        disposers.push(ctx.slots.subscribe('sidebar.panellist', schedule));
        disposers.push(ctx.locale.subscribe(schedule));
        sync();
      } catch (error) {
        cleanup();
        throw error;
      }
      return cleanup;
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => install(ctx));
      },
    };
  },
});
