import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');

function setup(account) {
  let state;
  let query;
  let plugin;
  const effects = [];
  const React = {
    createElement: (type, props) => ({ type, props }),
    useRef: value => ({ current: value }),
    useState: initial => {
      state = initial;
      return [state, change => { state = typeof change === 'function' ? change(state) : change; }];
    },
    useCallback: callback => { query = callback; return callback; },
    useEffect: callback => effects.push(callback),
  };
  const ctx = {
    remote: { account },
    slots: {
      inject: (name, callback) => callback(),
      register: (options, render) => {
        const element = render({ wide: true });
        element.type(element.props);
      },
    },
  };
  vm.runInNewContext(source, {
    console: { error() {}, warn() {} },
    window: { __ModuleLoader__: { load: module => { plugin = module.factory(() => React); } } },
  });
  plugin.apply(ctx);
  return { query, ctx, effects, state: () => state, plugin };
}

const stored = { ok: true, value: { status: 'credential-stored' } };

test('显式等待账户命名空间，已登录时展示真实余额', async () => {
  const env = setup({
    getState: async () => stored,
    getBalance: async () => ({ ok: true, value: {
      status: 'ready', value: [{ currency: 'CNY', balance: '12.34' }], bonusWallets: [],
    } }),
  });
  assert.ok(env.plugin.inject.includes('remote.account'));
  await env.query();
  assert.equal(env.state().signedIn, true);
  assert.equal(env.state().wallets[0].balance, '12.34');
  assert.equal(env.state().error, null);
});

for (const outcome of ['failed', 'throws']) {
  test(`余额接口${outcome}时保留已登录状态并显示错误`, async () => {
    const env = setup({
      getState: async () => stored,
      getBalance: async () => {
        if (outcome === 'throws') throw new Error('网络故障');
        return { ok: true, value: { status: 'failed' } };
      },
    });
    await env.query();
    assert.equal(env.state().signedIn, true);
    assert.ok(env.state().error);
    assert.equal(env.state().loading, false);
  });
}

test('只有明确退出登录才显示未登录，且不查询余额', async () => {
  const env = setup({
    getState: async () => ({ ok: true, value: { status: 'signed-out' } }),
    getBalance: () => assert.fail('退出登录后不应查询余额'),
  });
  await env.query();
  assert.equal(env.state().signedIn, false);
  assert.equal(env.state().error, null);
});

test('账户接口不可用时状态未知，不能误报为未登录', async () => {
  const env = setup({ getState: async () => ({ ok: false }) });
  await env.query();
  assert.equal(env.state().signedIn, null);
  assert.equal(env.state().error, 'account_state_failed');
});

test('退出登录后的新查询不会被旧余额请求覆盖', async () => {
  let resolveBalance;
  let view = stored;
  const env = setup({
    getState: async () => view,
    getBalance: () => new Promise(resolve => { resolveBalance = resolve; }),
  });
  const previous = env.query();
  await new Promise(resolve => setImmediate(resolve));
  view = { ok: true, value: { status: 'signed-out' } };
  await env.query();
  resolveBalance({ ok: true, value: { status: 'ready', value: [] } });
  await previous;
  assert.equal(env.state().signedIn, false);
});

test('账户状态流触发刷新并在卸载后释放', async () => {
  let reads = 0;
  let accepted = false;
  let disposed = false;
  const env = setup({ getState: async () => { reads++; return { ok: true, value: { status: 'signed-out' } }; } });
  env.ctx.remote.$stream = () => ({
    async *[Symbol.asyncIterator]() { yield { accept() { accepted = true; } }; },
    dispose() { disposed = true; },
  });
  const cleanup = env.effects[1]();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(reads, 1);
  assert.equal(accepted, true);
  cleanup();
  assert.equal(disposed, true);
});
