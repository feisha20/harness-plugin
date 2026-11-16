import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { expect, it } from 'vitest'
import { createUserMessage, markAgentLoopRequest } from '@deepseek-ai/dsh-llm'
import type { StreamChunk } from '@deepseek-ai/dsh-llm'
import type * as acp from '@agentclientprotocol/sdk'
import { AcpProfileAdapter, type AcpProfileRuntime } from '../../../src/host/composition/profile-adapter.ts'
import { createAcpSidecar } from '../../../src/persistence/sidecar.ts'
import { withSessionFacts } from '../../support/session-facts.ts'

it.each([
  { scenario: '读取已有命令结果', expected: 2 },
  { scenario: '连续缺失终态时停止跟进', expected: 3, incomplete: true },
  { scenario: '已完成的命令', expected: 1 },
  { scenario: '命令失败', expected: 1 },
  { scenario: '未执行的权限等待', expected: 1 },
  { scenario: '用户停止', expected: 1 },
  { scenario: '其他运行时', expected: 1 },
  { scenario: '只说稍等', expected: 1 },
  { scenario: '子会话命令', expected: 1 },
  { scenario: '上游 EOF', expected: 1 },
  { scenario: '上游取消', expected: 1 },
  { scenario: '跟进时失败', expected: 2 },
])('$scenario（远程调用次数 $expected）', async ({ scenario, expected, incomplete }) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'acp-command-followup-'))
  const sidecar = createAcpSidecar({ root })
  const sessionId = 'command-followup'
  const message = createUserMessage({ content: [{ type: 'text', text: '测一下网速' }], source: { kind: 'user' } })
  const live = withSessionFacts({
    id: sessionId,
    header: { cwd: root },
    inheritedEventCount: 0,
    snapshotEvents: () => [
      { type: 'step/start', seq: 1, data: { turn: 1, step: 0 } },
      { type: 'user/message', seq: 2, data: message },
    ],
  })
  const controller = new AbortController()
  const sent: acp.ContentBlock[][] = []
  const runtimeFactory = (): AcpProfileRuntime => ({
    acpSessionId: 'remote-command',
    start: async () => undefined,
    close: async () => undefined,
    prompt: async (content, onUpdate) => {
      sent.push(content)
      const update = (value: unknown) =>
        onUpdate({
          sessionId: scenario === '子会话命令' ? 'child' : 'remote-command',
          update: value,
        } as never)
      if (scenario === '跟进时失败' && sent.length === 2) throw new Error('连接中断')
      if (sent.length === 1 && scenario !== '只说稍等') {
        update({
          sessionUpdate: 'tool_call',
          toolCallId: 'command-1',
          name: 'run_command',
          title: 'networkQuality',
          kind: 'execute',
          status:
            scenario === '已完成的命令'
              ? 'completed'
              : scenario === '命令失败'
                ? 'failed'
                : scenario === '未执行的权限等待'
                  ? 'pending'
                  : 'in_progress',
          rawInput: { CommandLine: 'networkQuality', WaitMsBeforeAsync: 10000 },
        })
      }
      if (sent.length === 2 && scenario === '读取已有命令结果') {
        // 终态补丁省略名称和入参，仍须合并为原工具的真实终态。
        update({ sessionUpdate: 'tool_call_update', toolCallId: 'command-1', status: 'completed' })
      }
      update({
        sessionUpdate: 'agent_message_chunk',
        content: {
          type: 'text',
          text:
            scenario === '上游 EOF'
              ? '⚠ API error (attempt 3): request failed: Post "https://daily-cloudcode-pa.googleapis.com/v1internal:streamGenerateContent": EOF'
              : sent.length === 1
                ? '请稍候结果返回。'
                : '已有任务结果：下载 100 Mbps。',
        },
      })
      if (scenario === '用户停止') controller.abort()
      return { stopReason: scenario === '上游取消' ? 'cancelled' : 'end_turn' }
    },
  })
  const adapter = new AcpProfileAdapter(
    'test',
    () => ({
      name: '测试',
      command: 'fixture',
      args: [],
      env: {},
      runtime: scenario === '其他运行时' ? 'codex' : 'antigravity',
    }),
    { ok: true, seam: undefined as never },
    () => live,
    {
      begin: (record) => sidecar.beginDispatch(record),
      settle: (id, key) => sidecar.settleDispatch(id as never, key),
      read: (id, key) => sidecar.readDispatch(id as never, key),
    },
    undefined,
    runtimeFactory,
    sidecar,
  )
  const chunks: StreamChunk[] = []
  let error: unknown
  try {
    try {
      for await (const chunk of adapter.stream(
        markAgentLoopRequest({
          provider: 'acp-test',
          model: 'model-a',
          sessionId: sessionId as never,
          messages: [message],
          signal: controller.signal,
        }),
      ))
        chunks.push(chunk)
    } catch (caught) {
      error = caught
    }
    expect(sent).toHaveLength(expected)
    for (const followup of sent.slice(1)) {
      expect(JSON.stringify(followup)).toContain('不要重新执行原命令')
      expect(JSON.stringify(followup)).not.toContain('测一下网速')
    }
    if (incomplete) {
      expect(chunks).toContainEqual(
        expect.objectContaining({
          type: 'finish',
          reason: expect.objectContaining({
            kind: 'error',
            failure: expect.objectContaining({ code: 'ACP_COMMAND_RESULT_PENDING' }),
          }),
        }),
      )
      expect((await sidecar.activitySnapshot(sessionId as never))[0]).toMatchObject({ status: 'unfinished' })
    }
    if (scenario === '读取已有命令结果') {
      expect(error).toBeUndefined()
      expect(chunks).toContainEqual(expect.objectContaining({ type: 'finish', reason: { kind: 'stop' } }))
      expect((await sidecar.activitySnapshot(sessionId as never))[0]).toMatchObject({ status: 'completed' })
    }
    if (scenario === '跟进时失败')
      expect(
        error !== undefined || chunks.some((chunk) => chunk.type === 'finish' && chunk.reason.kind === 'error'),
      ).toBe(true)
  } finally {
    await adapter.close()
    await sidecar.dispose()
    fs.rmSync(root, { recursive: true, force: true })
  }
})
