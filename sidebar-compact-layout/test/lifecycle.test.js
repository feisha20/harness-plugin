import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

// 最小 DOM 替身，仅验证插件的标记及生命周期，不代表浏览器布局验收。
class Element {
  constructor(tag, attrs = {}) {
    this.tagName = tag.toUpperCase();
    this.attrs = new Map(Object.entries(attrs));
    this.children = [];
    this.dataset = {};
    this.textContent = '';
    this.classList = { contains: (name) => (this.getAttribute('class') ?? '').split(' ').includes(name) };
  }
  appendChild(node) { this.children.push(node); node.parentElement = this; return node; }
  getAttribute(name) { return this.attrs.get(name) ?? null; }
  hasAttribute(name) { return this.attrs.has(name); }
  setAttribute(name, value) { this.attrs.set(name, value); }
  removeAttribute(name) { this.attrs.delete(name); }
  remove() {
    if (this.parentElement) this.parentElement.children = this.parentElement.children.filter((child) => child !== this);
    this.parentElement = null;
  }
  matches(selector) {
    if (selector.startsWith('.')) return this.classList.contains(selector.slice(1));
    if (selector === 'button[aria-label]') return this.tagName === 'BUTTON' && this.hasAttribute('aria-label');
    const style = selector.match(/^style\[data-plugin-css="(.+)"\]$/);
    return !!style && this.tagName === 'STYLE' && this.getAttribute('data-plugin-css') === style[1];
  }
  querySelector(selector) {
    for (const child of this.children) {
      if (child.matches(selector)) return child;
      const match = child.querySelector(selector);
      if (match) return match;
    }
    return null;
  }
  closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector); }
  all() { return [this, ...this.children.flatMap((child) => child.all())]; }
}

function fixture({ unknown = false } = {}) {
  const html = new Element('html');
  const head = html.appendChild(new Element('head'));
  const body = html.appendChild(new Element('body'));
  const hostStyle = head.appendChild(new Element('style', {
    'data-plugin-css': '@deepseek-ai/dsh-client-ui-sidebar/SidebarRoot.module.css',
  }));
  hostStyle.textContent = unknown ? '.new-layout{}' : '.hash_root{display:flex}.hash_root.hash_collapsed{padding:0}.hash_panelList{display:flex}';
  const root = body.appendChild(new Element('div', { class: 'hash_root' }));
  const nav = root.appendChild(new Element('nav', { class: 'hash_panelList' }));
  const row = (label, wrapped = false, attrs = {}) => {
    const cell = nav.appendChild(new Element(wrapped ? 'span' : 'button', wrapped ? {} : { 'aria-label': label, ...attrs }));
    const button = wrapped ? cell.appendChild(new Element('button', { 'aria-label': label, ...attrs })) : cell;
    return { cell, button };
  };
  const plugins = row('插件');
  const schedules = row('自动化任务');
  const custom = row('禅道质量看板', true);
  const more = row('更多', true, { 'aria-haspopup': 'menu' });
  const state = {
    entries: [
      { options: { id: 'plugins', label: () => '插件' } },
      { options: { id: 'schedules', label: '自动化任务' } },
      { options: { id: 'zentao', label: () => custom.button.getAttribute('aria-label') } },
    ],
  };
  const listeners = new Set();
  const frames = new Map();
  let frameId = 0;
  let observer;
  let plugin;
  let cleanup;
  const doc = {
    head, documentElement: html,
    createElement: (tag) => new Element(tag),
    querySelector: (selector) => html.querySelector(selector),
    getElementsByClassName: (name) => html.all().filter((element) => element.classList.contains(name)),
  };
  const subscribe = (callback) => { listeners.add(callback); return () => listeners.delete(callback); };
  const win = {
    __ModuleLoader__: { load: ({ factory }) => { plugin = factory(); } },
    MutationObserver: class {
      constructor(callback) { this.callback = callback; this.connected = false; observer = this; }
      observe() { this.connected = true; }
      disconnect() { this.connected = false; }
    },
    requestAnimationFrame: (callback) => { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame: (id) => frames.delete(id),
  };
  vm.runInNewContext(readFileSync(new URL('../client.js', import.meta.url), 'utf8'), { window: win, document: doc });
  plugin.apply({
    effect: (effect) => { cleanup = effect(); },
    slots: { entriesOfSlot: () => state.entries, subscribe: (_name, callback) => subscribe(callback) },
    locale: { subscribe },
  });
  return {
    root, nav, plugins, schedules, custom, more, head, hostStyle, state, row, listeners, frames,
    cleanup: () => cleanup(), observer: () => observer,
    notify() { for (const callback of listeners) callback(); },
    flush() { const pending = [...frames.values()]; frames.clear(); for (const callback of pending) callback(); },
  };
}

test('系统菜单及更多保留整行，自定义菜单保留原按钮并标记为双列', () => {
  const f = fixture();
  assert.equal(f.nav.getAttribute('data-dsh-compact-menu'), '');
  for (const { cell } of [f.plugins, f.schedules, f.more]) assert.equal(cell.hasAttribute('data-dsh-compact-cell'), false);
  assert.equal(f.custom.cell.getAttribute('data-dsh-compact-cell'), 'custom');
  assert.equal(f.custom.button.getAttribute('title'), '禅道质量看板');
  assert.equal(f.custom.button.parentElement, f.custom.cell);
  assert.match(f.head.children.at(-1).textContent, /repeat\(2, minmax\(0, 1fr\)\)/);
  f.cleanup();
});

test('侧栏折叠时恢复，展开及动态菜单和语言切换后重新适配', () => {
  const f = fixture();
  f.root.setAttribute('class', 'hash_root hash_collapsed');
  f.observer().callback(); f.flush();
  assert.equal(f.nav.hasAttribute('data-dsh-compact-menu'), false);
  assert.equal(f.custom.button.hasAttribute('title'), false);
  f.root.setAttribute('class', 'hash_root');
  const added = f.row('额度');
  f.state.entries.push({ options: { id: 'ultra', label: '额度' } });
  f.custom.button.setAttribute('aria-label', 'Zentao');
  f.notify(); f.flush();
  assert.equal(added.cell.getAttribute('data-dsh-compact-cell'), 'custom');
  assert.equal(f.custom.button.getAttribute('title'), 'Zentao');
  f.cleanup();
});

test('无法识别的宿主结构、同名菜单和未注册入口保留原布局', () => {
  const unknown = fixture({ unknown: true });
  assert.equal(unknown.nav.hasAttribute('data-dsh-compact-menu'), false);
  unknown.cleanup();
  const f = fixture();
  f.state.entries.push({ options: { id: 'other', label: '禅道质量看板' } });
  const missing = f.row('未注册');
  f.notify(); f.flush();
  assert.equal(f.custom.cell.hasAttribute('data-dsh-compact-cell'), false);
  assert.equal(missing.cell.hasAttribute('data-dsh-compact-cell'), false);
  f.cleanup();
});

test('停用清理样式、属性、订阅和待处理回调，重复启用不会叠加', () => {
  const f = fixture();
  f.notify();
  assert.equal(f.frames.size, 1);
  f.cleanup();
  assert.equal(f.frames.size, 0);
  assert.equal(f.listeners.size, 0);
  assert.equal(f.observer().connected, false);
  assert.equal(f.head.children.length, 1);
  assert.equal(f.head.children[0], f.hostStyle);
  assert.equal(f.nav.hasAttribute('data-dsh-compact-menu'), false);
  assert.equal(f.custom.cell.hasAttribute('data-dsh-compact-cell'), false);
  assert.equal(f.custom.button.hasAttribute('title'), false);
  f.cleanup();
  const next = fixture();
  assert.equal(next.head.children.length, 2);
  next.cleanup();
});

test('保留宿主原有及后来更新的悬停文案', () => {
  const f = fixture();
  f.custom.button.setAttribute('title', '宿主更新的说明');
  const added = f.row('额度', false, { title: '原有说明' });
  f.state.entries.push({ options: { id: 'ultra', label: '额度' } });
  f.notify(); f.flush(); f.cleanup();
  assert.equal(f.custom.button.getAttribute('title'), '宿主更新的说明');
  assert.equal(added.button.getAttribute('title'), '原有说明');
});
