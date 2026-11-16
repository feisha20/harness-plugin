import { describe, it, expect } from 'vitest'
import { ProgressWatch, progressText, progressNoticeLabel } from '../../../src/client/ui/progress-watch.ts'
import { antigravityOutputFailure } from '../../../src/domain/session/antigravity-output-failure.ts'

describe('无进展提示', () => {
  it('计时器不构成进展，工具更新、会话和轮次变化重置计时', () => {
    const watch = new ProgressWatch()
    expect(watch.update('a:1', 'text', 1000)).toBe(0)
    expect(watch.update('a:1', 'text', 121000)).toBe(120000)
    expect(watch.update('a:1', 'tool:complete', 122000)).toBe(0)
    expect(watch.update('b:1', 'tool:complete', 123000)).toBe(0)
    expect(watch.update('b:2', 'tool:complete', 124000)).toBe(0)
  })
  it('等待授权不冒充服务超时；工具和回复等待分别提示', () => {
    expect(progressText(180000, true, true)).toContain('授权')
    expect(progressText(180000, true, true)).not.toContain('没有可观察进展')
    expect(progressText(180000, false, true)).toContain('工具执行中')
    expect(progressText(180000, false, false)).toContain('等待 Agent 回复')
  })
})
describe('错误诊断边界', () => {
  const auth =
    '⚠ UNAUTHENTICATED (code 401): Request had invalid authentication credentials. Expected OAuth 2 access token.'
  it('识别精确 401 尾部诊断', () => expect(antigravityOutputFailure(auth)?.code).toBe('ACP_UPSTREAM_AUTH_FAILED'))
  it.each(['EOF', '这里是 UNAUTHENTICATED (code 401)', '> ' + auth, '```\n' + auth + '\n```', auth + '\n认证已恢复'])(
    '普通解释或引用不判失败',
    (text) => {
      expect(antigravityOutputFailure(text)).toBeUndefined()
    },
  )
})

it('紧凑提示随进展恢复而消失，授权不提示超时，失败显示恢复入口', () => {
  expect(progressNoticeLabel(true, 45000, false, false, false)).toBeNull()
  expect(progressNoticeLabel(true, 120000, false, false, true)).toBe('⚠ 暂无新进展')
  expect(progressNoticeLabel(true, 0, false, false, true)).toBeNull()
  expect(progressNoticeLabel(true, 180000, true, false, false)).toBeNull()
  expect(progressNoticeLabel(false, 0, false, true, false)).toBe('本轮异常 · 查看恢复选项')
  expect(progressNoticeLabel(false, 0, false, false, false)).toBeNull()
})
