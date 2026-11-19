import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const client = readFileSync(new URL('../client.js', import.meta.url), 'utf8');

// 模拟宿主插槽、页面可见性和时钟，直接驱动发布包的客户端入口。
function harness(t, running = false, reduced = false) {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'] });
  const listeners = new Map();
  const element = () => ({
    children: [], attrs: new Set(), style: { setProperty() {} },
    append(child) { this.children.push(child); child.parent = this; },
    remove() { this.parent.children = this.parent.children.filter(child => child !== this); },
    setAttribute(name) { this.attrs.add(name); }, hasAttribute(name) { return this.attrs.has(name); },
    showModal() { this.open = true; }, close() { this.open = false; },
  });
  const pane = Object.assign(element(), { dataset: { conversationSession: 'a' } });
  const card = element();
  const dock = { parentElement: { querySelector: selector => selector === '[data-composer-card]' ? card : null } };
  const document = { head: element(), body: element(), createElement: element,
    addEventListener() {}, removeEventListener() {} };
  let component, cleanup, visibility;
  const react = { createElement() {}, useRef: () => ({ current: { closest: selector => selector === '[data-composer-dock]' ? dock : pane } }),
    useLayoutEffect(fn) { cleanup = fn(); } };
  const window = { addEventListener: (type, fn) => listeners.set(type, fn),
    removeEventListener: type => listeners.delete(type),
    __ModuleLoader__: { load(entry) {
      entry.factory(() => react).apply({ effect: fn => fn(), slots: {
        inject: (_, fn) => fn(), register: (_, render) => { component = render; },
      } });
    } } };
  vm.runInNewContext(client, { window, document, Date, setTimeout, clearTimeout,
    innerWidth: 900, innerHeight: 600, matchMedia: () => ({ matches: reduced }),
    ResizeObserver: class { observe() {} disconnect() {} },
    IntersectionObserver: class {
      constructor(callback) { visibility = flag => callback([{ isIntersecting: flag }]); }
      observe() {} disconnect() {}
    } });
  function render(id, active) {
    cleanup?.();
    component({ sessionId: id, useSession: fn => fn({ running: active }),
      useSessionRetainInfo: fn => fn({ retainedBy: { mainView: 1 } }) });
    visibility?.(true);
  }
  render('a', running);
  t.after(() => cleanup?.());
  return { document, pane, card, listeners, render, visibility, tick: ms => t.mock.timers.tick(ms) };
}

test('运行中四边显示火焰，结束后重新计时', t => {
  const h = harness(t, true);
  assert.equal(h.pane.children.length, 0);
  assert.equal(h.card.children[0].children.length, 4);
  h.tick(120000);
  assert.equal(h.document.body.children.length, 0);
  h.render('a', false);
  assert.equal(h.card.children.length, 0);
  assert.equal(h.pane.children.length, 0);
  h.tick(59999);
  assert.equal(h.document.body.children.length, 0);
  h.tick(1);
  assert.equal(h.document.body.children[0].open, true);
});

test('页面活动重置时限，单击在落点破冰并重新计时', t => {
  const h = harness(t);
  h.tick(45000);
  h.listeners.get('wheel')();
  h.tick(59999);
  assert.equal(h.document.body.children.length, 0);
  h.tick(1);
  const ice = h.document.body.children[0];
  let consumed = false;
  ice.onclick({ detail: 1, clientX: 120, clientY: 90, preventDefault() {}, stopPropagation() { consumed = true; } });
  assert.ok(consumed);
  assert.equal(ice.children.length, 9);
  assert.match(ice.children[1].style.clipPath, /120px 90px/);
  h.tick(390);
  assert.equal(h.document.body.children.length, 0);
  h.tick(60000);
  assert.ok(h.document.body.children[0].open);
});

test('离开对话移除冰层，其他会话无法占用当前页面', t => {
  const h = harness(t);
  h.tick(60000);
  h.visibility(false);
  assert.equal(h.document.body.children.length, 0);
  assert.equal(h.listeners.size, 0);
  h.render('b', true);
  h.tick(60000);
  assert.equal(h.pane.children.length, 0);
  assert.equal(h.document.body.children.length, 0);
});

test('减少动态效果时可用键盘即时解冻', t => {
  const h = harness(t, false, true);
  h.tick(60000);
  h.document.body.children[0].onkeydown({ key: 'Enter', preventDefault() {}, stopPropagation() {} });
  assert.equal(h.document.body.children.length, 0);
});
