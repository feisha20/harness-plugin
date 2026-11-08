import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

// 用最小 DOM 模型模拟 MutationObserver 的批量通知，不启动浏览器。
function setup(source, { wide = true, delayed = false, state = {} } = {}) {
  const observers = new Set();
  const pending = new Set();
  let writes = 0;
  function changed(node) {
    writes++;
    for (const observer of observers) {
      if (observer.target?.contains(node)) pending.add(observer);
    }
  }
  class Element {
    constructor() { this.children = []; this.style = {}; }
    get parentElement() { return this.parent; }
    get lastElementChild() { return this.children.at(-1); }
    get previousElementSibling() {
      return this.parent?.children[this.parent.children.indexOf(this) - 1];
    }
    set innerHTML(value) {
      for (const child of this.children) child.parent = null;
      this.children = [];
      changed(this);
    }
    setAttribute() {}
    contains(node) { return node === this || this.children.some(child => child.contains(node)); }
    appendChild(child) {
      child.parent?.removeChild(child);
      this.children.push(child);
      child.parent = this;
      changed(this);
    }
    removeChild(child) {
      this.children.splice(this.children.indexOf(child), 1);
      child.parent = null;
      changed(this);
    }
    after(child) {
      const parent = this.parent;
      child.parent?.removeChild(child);
      parent.children.splice(parent.children.indexOf(this) + 1, 0, child);
      child.parent = parent;
      changed(parent);
    }
    querySelector() { return this.label; }
  }
  const body = new Element();
  const effects = [];
  const document = {
    body, head: new Element(),
    createElement: () => new Element(),
    getElementById: () => null,
    querySelector: selector => selector === '[class*="settingsArea"]' ? container : trigger,
  };
  let container;
  let trigger;
  function mountTrigger() {
    if (container) body.removeChild(container);
    container = new Element();
    trigger = new Element();
    trigger.label = new Element();
    trigger.appendChild(trigger.label);
    container.appendChild(trigger);
    body.appendChild(container);
  }
  if (!delayed) mountTrigger();
  const React = {
    createElement: (type, props) => ({ type, props }),
    useState: () => [{ loading: false, signedIn: true, wallets: [], bonusWallets: [], ...state }, () => {}],
    useRef: value => ({ current: value }),
    useCallback: callback => callback,
    useEffect: callback => effects.push(callback),
  };
  let widget;
  const ctx = {
    slots: {
      inject: (name, callback) => callback(),
      register: (options, render) => { widget = render({ wide }); },
    },
  };
  vm.runInNewContext(source, {
    window: { __ModuleLoader__: { load: module => module.factory(() => React).apply(ctx) } },
    document,
    MutationObserver: class {
      constructor(callback) { this.callback = callback; }
      observe(target) { this.target = target; observers.add(this); }
      disconnect() { observers.delete(this); pending.delete(this); }
    },
  });
  widget.type(widget.props);
  // 这里只执行最后的 DOM effect，跳过账户查询及订阅。
  const cleanup = effects.at(-1)();
  function flush() {
    let deliveries = 0;
    while (pending.size) {
      assert.ok(++deliveries < 10, 'DOM 监听器未收敛，存在自触发循环');
      const batch = [...pending];
      pending.clear();
      for (const observer of batch) observer.callback([]);
    }
  }
  return { body, flush, cleanup, mountTrigger, trigger: () => trigger, writes: () => writes };
}

const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');

test('外部 DOM 变更不会反复重绘，昵称区域重建后恢复徽章', () => {
  const env = setup(source);
  const badge = env.trigger().lastElementChild;
  env.trigger().appendChild({ parent: null, contains: () => false });
  const writes = env.writes();
  env.flush();
  assert.equal(env.writes(), writes, '无关 DOM 更新不应重绘徽章');
  env.mountTrigger();
  env.flush();
  assert.equal(env.trigger().lastElementChild, badge);
  env.cleanup();
  assert.equal(badge.parentElement, null);
});

test('昵称区域延迟出现时挂载徽章', () => {
  const env = setup(source, { delayed: true });
  env.mountTrigger();
  env.flush();
  assert.equal(env.trigger().lastElementChild.id, 'dsh-account-balance-badge');
  env.cleanup();
});

test('折叠侧栏时不插入昵称徽章', () => {
  const env = setup(source, { wide: false });
  env.mountTrigger();
  env.flush();
  assert.equal(env.trigger().children.length, 1);
  env.cleanup();
});

test('账户或余额查询失败时显示不可用，不显示未登录或零余额', () => {
  const env = setup(source, { state: { signedIn: null, error: 'account_state_failed' } });
  const badge = env.trigger().lastElementChild;
  assert.equal(badge.children[0].textContent, '余额暂不可用');
  assert.ok(badge.title.includes('余额暂不可用'));
  env.cleanup();
});
