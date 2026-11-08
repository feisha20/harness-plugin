import { Readable } from 'node:stream'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createModelRouter } from '../lib/host/modelRouter.js'
import { createWorkbenchHttpHandler } from '../lib/host/webRoutes.js'
import { WorkbenchStore } from '../lib/host/store.js'
import { reorganizeReport } from '../lib/host/reportSummary.js'

const primary = { provider: 'acp-anti', model: 'gemini-3.8-flash-low' }
const fallback = { provider: 'ordinary', model: 'backup' }

test('按精确模型 ID 调用 ACP，主模型输出不合规时尝试备用模型', async () => {
  const calls = []
  const llm = {
    listProviders: () => [],
    prepareCall(route) {
      calls.push(route)
      throw Object.assign(new Error('备用模型额度耗尽'), { code: 'RESOURCE_EXHAUSTED' })
    },
  }
  const acp = {
    supports: provider => provider === primary.provider,
    async generate(provider, model, system, input) {
      calls.push({ provider, model })
      assert.equal(system, '概要要求')
      assert.equal(input, '测试资料')
      return '无效输出'
    },
  }
  const router = createModelRouter(llm, () => { throw new Error('已配置主模型时不读取全局默认') }, () => acp)
  const generate = router.generator({ primary, fallback }, '概要要求', 2000)
  assert.deepEqual(await generate('测试资料'), {
    text: '无效输出',
    attribution: { ...primary, usedFallback: false },
  })
  assert.deepEqual(calls, [primary])
  calls.length = 0
  await assert.rejects(generate('测试资料', () => { throw new Error('概要格式错误') }), error => {
    assert.match(error.message, /主模型.*概要格式错误.*备用模型.*额度耗尽/)
    assert.equal(error.code, 'RESOURCE_EXHAUSTED')
    return true
  })
  assert.deepEqual(calls, [primary, { ...fallback, maxTokens: 2000 }])
})

test('默认路由解析失败时，日报保存实际完成整理的备用模型', async () => {
  const llm = { listProviders: () => [{ id: 'acp-anti', name: 'Antigravity' }] }
  const router = createModelRouter(llm, () => primary, () => ({
    supports: () => true,
    generate: async () => '### 一、今日重点工作\n- 核对测试清单与接口用例，汇总测试范围和预期结果。',
  }))
  const generate = router.generator({ primary: null, fallback: primary }, '报告要求', 6000)
  const report = await reorganizeReport(
    { day: '2026-11-08', summaryMarkdown: '', isEdited: false },
    [{ id: 'task', source: 'manual', title: '核对测试清单', createdAt: '2026-11-08T02:00:00Z' }],
    generate,
  )
  assert.deepEqual(report.aiAttribution, { ...primary, usedFallback: true })
  assert.match(report.summaryMarkdown, /核对测试清单/)
})

test('报告由适配器决定输出预算，主备切换也不附带固定上限', async () => {
  const llm = {
    async prepareCall(config) {
      assert.deepEqual(config, fallback)
      return {
        config: { ...config, maxTokens: 32_768 },
        async *stream(options) {
          assert.equal(options.maxTokens, 32_768)
          yield { type: 'finish', reason: { kind: 'max-tokens' } }
        },
      }
    },
  }
  const router = createModelRouter(llm, () => primary, () => undefined)
  const generate = router.generator({ primary, fallback }, '报告要求')
  await assert.rejects(generate('测试资料'), /备用模型.*MAX_TOKENS.*本次请求的输出预算 32768 tokens/)
})

test('设置接口拒绝重复或不存在的模型，保存后重新载入仍有效', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'workbench-model-settings-'))
  try {
    const file = join(directory, 'store.json')
    const store = new WorkbenchStore(file)
    const handler = createWorkbenchHttpHandler(store, {}, undefined, {
      catalog: async () => [],
      hasModel: async route => route.model === primary.model || route.model === fallback.model,
    })
    async function request(method, body, headers = {}) {
      const req = Readable.from(body ? [JSON.stringify(body)] : [])
      Object.assign(req, { method, url: '/api/workbench/model-settings', headers })
      let status, data
      await handler(req, { writeHead(code) { status = code }, end(text) { data = JSON.parse(text) } })
      return { status, data }
    }
    assert.deepEqual((await request('GET')).data.settings, { primary: null, fallback: null })
    assert.equal((await request('PATCH', { primary, fallback: primary })).status, 400)
    assert.equal((await request('PATCH', { primary, fallback: { ...fallback, model: 'unknown' } })).status, 400)
    assert.equal((await request('PATCH', { primary, fallback }, { origin: 'https://example.com' })).status, 403)
    assert.equal((await request('PATCH', { primary, fallback })).status, 200)
    assert.deepEqual(new WorkbenchStore(file).getSnapshot().modelSettings, { primary, fallback })
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
