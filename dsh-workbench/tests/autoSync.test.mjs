import { test } from 'node:test'
import assert from 'node:assert/strict'
import { AUTO_SYNC_STALE_MS, shouldAutoSync } from '../lib/shared/autoSync.js'

const now = Date.parse('2026-11-09T12:00:00.000Z')

test('没有同步记录或记录无法解析时需要自动同步', () => {
  assert.equal(shouldAutoSync(null, now), true)
  assert.equal(shouldAutoSync(undefined, now), true)
  assert.equal(shouldAutoSync('', now), true)
  assert.equal(shouldAutoSync('not-a-date', now), true)
})

test('距上次同步不足 30 分钟时不重复同步', () => {
  assert.equal(shouldAutoSync(new Date(now - 1_000).toISOString(), now), false)
  assert.equal(shouldAutoSync(new Date(now - AUTO_SYNC_STALE_MS + 1).toISOString(), now), false)
})

test('达到或超过 30 分钟时自动同步', () => {
  assert.equal(shouldAutoSync(new Date(now - AUTO_SYNC_STALE_MS).toISOString(), now), true)
  assert.equal(shouldAutoSync(new Date(now - 2 * 60 * 60 * 1000).toISOString(), now), true)
})

test('上次同步时间在未来（时钟偏差）时不触发', () => {
  assert.equal(shouldAutoSync(new Date(now + 60_000).toISOString(), now), false)
})
