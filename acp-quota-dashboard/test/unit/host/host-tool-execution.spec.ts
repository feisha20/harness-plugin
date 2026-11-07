import { describe, expect, it, vi } from 'vitest'
import type { ToolExecutionInput, ToolExecutionResult, ToolRuntime } from '@deepseek-ai/dsh-tools'
import { executeHostTool, hostToolExecutionMode } from '../../../src/host/tools/host-tool-execution.ts'

const input: ToolExecutionInput = {
  callId: '调用-1' as ToolExecutionInput['callId'],
  name: 'skill',
  arguments: { name: '插件开发', text: '中文\n"引号"' },
  signal: new AbortController().signal,
}
const result: ToolExecutionResult = { isError: false, value: '成功', content: [{ type: 'text', text: '成功' }] }

describe('宿主工具执行接口兼容', () => {
  it('旧宿主继续使用单次执行与并发分类', async () => {
    const execute = vi.fn(async () => result)
    const tools = { execute, executionMode: () => ({ kind: 'parallel' }) } as unknown as ToolRuntime
    expect(hostToolExecutionMode(tools, input)).toBe('parallel')
    expect(await executeHostTool(tools, input)).toBe(result)
    expect(execute).toHaveBeenCalledExactlyOnceWith(input)
  })

  it('新宿主接收原始调用批次并且保留结果和附加上下文', async () => {
    const additionalContexts = [{ role: 'user', content: [], id: '上下文', source: { kind: '测试' } }]
    const execute = vi.fn(async () => ({ results: [{ callId: input.callId, result }], additionalContexts }))
    const tools = { selectExecutor() {}, execute } as unknown as ToolRuntime
    expect(hostToolExecutionMode(tools, input)).toBe('exclusive')
    expect(await executeHostTool(tools, input)).toEqual({ ...result, additionalContexts })
    expect(execute).toHaveBeenCalledExactlyOnceWith({
      calls: [{ type: 'tool_call', id: input.callId, name: input.name, arguments: JSON.stringify(input.arguments) }],
      signal: input.signal,
    })
  })

  it('保留拒绝、取消和结束轮次的宿主结果', async () => {
    for (const outcome of [
      { ...result, concludesTurn: true },
      { isError: true, content: [], error: { message: '拒绝', info: { code: 'DENIED' } } },
      { isError: true, content: [], error: { message: '取消', info: { code: 'ABORTED_BEFORE_DISPATCH' } } },
    ]) {
      const tools = {
        selectExecutor() {},
        execute: async () => ({ results: [{ callId: input.callId, result: outcome }] }),
      } as unknown as ToolRuntime
      expect(await executeHostTool(tools, input)).toBe(outcome)
    }
  })

  it('批次异常不会触发旧接口重试', async () => {
    const error = new Error('宿主批次失败')
    const execute = vi.fn(async () => {
      throw error
    })
    const tools = { selectExecutor() {}, execute } as unknown as ToolRuntime
    await expect(executeHostTool(tools, input)).rejects.toBe(error)
    expect(execute).toHaveBeenCalledTimes(1)
  })

  it.each([{ results: [] }, { results: [{ callId: '其他调用', result }] }])(
    '拒绝缺失或错配的批次结果 %j',
    async ({ results }) => {
      const tools = { selectExecutor() {}, execute: async () => ({ results }) } as unknown as ToolRuntime
      await expect(executeHostTool(tools, input)).rejects.toThrow('不匹配的调用结果')
    },
  )
})
