import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { expect, it, vi } from 'vitest'
import { createUserMessage, markAgentLoopRequest } from '@deepseek-ai/dsh-llm'
import { AcpProfileAdapter, type AcpProfileRuntime } from '../../../src/host/composition/profile-adapter.ts'
import { createAcpSidecar, type AcpSidecar } from '../../../src/persistence/sidecar.ts'
import { outputSpeedLabel } from '../../../src/client/ui/AcpUsageFooter.ts'
import { withSessionFacts } from '../../support/session-facts.ts'

it('界面未打开时采样，末批随终态保存，关闭适配器后仍可回读，下一轮重新统计', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'acp-output-speed-'))
  let sidecar = createAcpSidecar({ root })
  const sessionId = 'speed-session'
  const messages = ['第一轮', '第二轮'].map((text) =>
    createUserMessage({ content: [{ type: 'text', text }], source: { kind: 'user' } }),
  )
  let turn = 1
  const live = withSessionFacts({
    id: sessionId,
    header: { cwd: os.tmpdir() },
    inheritedEventCount: 0,
    snapshotEvents: () => [
      { type: 'step/start', seq: turn * 2 - 1, data: { turn, step: 0 } },
      { type: 'user/message', seq: turn * 2, data: messages[turn - 1] },
    ],
  })
  let now = 1000
  const clock = vi.spyOn(Date, 'now').mockImplementation(() => now)
  const runtimeFactory = (): AcpProfileRuntime => ({
    acpSessionId: 'agent-speed-session',
    agentInfo: { name: 'fixture', version: '1' },
    protocolVersion: 1,
    agentCapabilities: { sessionCapabilities: { resume: {} } },
    start: async () => undefined,
    restore: async () => 'resumed',
    close: async () => undefined,
    prompt: async (_content, onUpdate) => {
      const text = (length: number, sessionId = 'agent-speed-session') =>
        onUpdate({
          sessionId,
          update: { sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: '中'.repeat(length) } },
        })
      if (turn === 1) {
        text(10)
        now = 2000
        text(90)
        onUpdate({
          sessionId: 'agent-speed-session',
          update: { sessionUpdate: 'tool_call', toolCallId: 'tool-1', title: '等待', status: 'completed' },
        })
        now = 62000
        text(10)
        now = 63000
        text(1000, 'child-session')
        now = 64000
        text(290)
      } else text(20)
      return { stopReason: 'end_turn' }
    },
  })
  const makeAdapter = () =>
    new AcpProfileAdapter(
      'test',
      () => ({ name: '速度测试', command: 'fixture', args: [], env: {} }),
      { ok: true, seam: undefined as never },
      () => live,
      {
        begin: (record: Parameters<AcpSidecar['beginDispatch']>[0]) => sidecar.beginDispatch(record),
        settle: (id: string, key: string) => sidecar.settleDispatch(id as never, key),
        read: (id: string, key: string) => sidecar.readDispatch(id as never, key),
      },
      undefined,
      runtimeFactory,
      sidecar,
    )
  const first = makeAdapter()
  let second: AcpProfileAdapter | undefined
  const drain = async (adapter: AcpProfileAdapter) => {
    for await (const _chunk of adapter.stream(
      markAgentLoopRequest({
        provider: 'acp-test',
        model: 'model-a',
        sessionId: sessionId as never,
        messages: [messages[turn - 1]!],
      }),
    )) {
      /* 消费真实适配器流直至终态持久化完成。 */
    }
  }
  try {
    await drain(first)
    const expected = { turn: 1, totalTokens: 400, sampledTokens: 400, durationMs: 3000 }
    expect((await first.agentSessionSnapshot(sessionId)).outputSpeed).toEqual(expected)
    expect((await sidecar.readOptionSnapshot(sessionId as never))?.outputSpeed).toEqual(expected)
    await first.close()
    await sidecar.dispose()
    sidecar = createAcpSidecar({ root })
    second = makeAdapter()
    const cold = await second.agentSessionSnapshot(sessionId)
    expect(cold.outputSpeed).toEqual(expected)
    expect(outputSpeedLabel(cold, 1)).toBe('本次平均 ≈ 133.3 tok/s')
    turn = 2
    now = 100000
    await drain(second)
    const next = await second.agentSessionSnapshot(sessionId)
    expect(next.outputSpeed).toEqual({ turn: 2, totalTokens: 20, sampledTokens: 0, durationMs: 0 })
    expect(outputSpeedLabel(next, 2)).toBe('本次平均：无可测输出时长')
  } finally {
    clock.mockRestore()
    await first.close()
    await second?.close()
    await sidecar.dispose()
    fs.rmSync(root, { recursive: true, force: true })
  }
})
