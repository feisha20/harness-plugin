import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createWorkbenchHttpHandler } from '../lib/host/webRoutes.js'

const task = {
  id: 'a',
  title: '梳理评测集回归流程',
  source: 'manual',
  createdAt: '2026-11-11T02:00:00Z',
  recordDate: '2026-11-11',
}

const response = () => ({ status: 0, body: null, writeHead(code) { this.status = code }, end(body) { this.body = JSON.parse(body) } })
const post = (url, body) => {
  const handlers = {}
  const req = {
    method: 'POST',
    url,
    headers: {},
    on(event, callback) {
      handlers[event] = callback
      return req
    },
  }
  queueMicrotask(() => {
    handlers.data?.(JSON.stringify(body))
    handlers.end?.()
  })
  return req
}

function setup(tasks = [task], generateInsight) {
  const snapshot = { tasks, sources: [], dailyReports: {}, weeklyReports: {}, monthlyReports: {}, lastSyncTime: null }
  const store = {
    getSnapshot: () => snapshot,
    save() {},
    saveDailyReport(report) { snapshot.dailyReports[report.day] = report },
  }
  return { snapshot, handler: createWorkbenchHttpHandler(store, {}, undefined, undefined, generateInsight) }
}

test('日报归纳接口保存商业价值与明日计划', async () => {
  const { snapshot, handler } = setup([task], generateInsight)
  const res = response()
  await handler(post('/api/workbench/reports/daily/insight', { day: '2026-11-11' }), res)
  assert.equal(res.status, 200)
  assert.deepEqual(res.body.value, ['减少重复验证时间'])
  assert.deepEqual(snapshot.dailyReports['2026-11-11'].aiInsight.plan, ['补齐回归用例：降低漏测风险'])
})

test('日报归纳接口校验日期、空记录与模型服务', async () => {
  const { handler } = setup()
  const badDay = response()
  await handler(post('/api/workbench/reports/daily/insight', { day: '2026-13-40' }), badDay)
  assert.equal(badDay.status, 400)

  const empty = response()
  await handler(post('/api/workbench/reports/daily/insight', { day: '2026-11-12' }), empty)
  assert.equal(empty.status, 400)
  assert.match(empty.body.error, /没有工作记录/)

  const unplugged = response()
  await createWorkbenchHttpHandler({ getSnapshot: () => ({ tasks: [task], sources: [] }), save() {} }, {})(
    post('/api/workbench/reports/daily/insight', { day: '2026-11-11' }), unplugged)
  assert.equal(unplugged.status, 503)
})

const generateInsight = async () => ({
  text: '{"value":["减少重复验证时间"],"plan":["补齐回归用例：降低漏测风险"]}',
  attribution: { provider: 'p', model: 'm', usedFallback: false },
})
