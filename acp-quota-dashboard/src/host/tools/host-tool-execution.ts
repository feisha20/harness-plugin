import type { ToolExecutionInput, ToolExecutionResult, ToolRuntime } from '@deepseek-ai/dsh-tools'

interface BatchResult {
  readonly results: readonly { readonly callId: string; readonly result: ToolExecutionResult }[]
  readonly additionalContexts?: ToolExecutionResult['additionalContexts']
}

interface BatchRuntime {
  selectExecutor(scope?: ToolExecutionInput['agent']): unknown
  execute(input: {
    calls: { type: 'tool_call'; id: string; name: string; arguments: string }[]
    agent?: ToolExecutionInput['agent']
    signal: AbortSignal
  }): Promise<BatchResult>
}

function usesBatchExecution(tools: ToolRuntime): boolean {
  return typeof (tools as unknown as Partial<BatchRuntime>).selectExecutor === 'function'
}

/** 新宿主自行调度批次；跨 MCP 请求保守串行，避免依赖已移除的分类接口。 */
export function hostToolExecutionMode(tools: ToolRuntime, input: ToolExecutionInput): string {
  return usesBatchExecution(tools) ? 'exclusive' : tools.executionMode(input).kind
}

/** 按宿主公开能力选择接口，不在失败后重试，避免重复执行有副作用的工具。 */
export async function executeHostTool(tools: ToolRuntime, input: ToolExecutionInput): Promise<ToolExecutionResult> {
  if (!usesBatchExecution(tools)) return tools.execute(input)
  const batch = await (tools as unknown as BatchRuntime).execute({
    calls: [{ type: 'tool_call', id: input.callId, name: input.name, arguments: JSON.stringify(input.arguments) }],
    ...(input.agent === undefined ? {} : { agent: input.agent }),
    signal: input.signal,
  })
  const entry = batch.results[0]
  if (batch.results.length !== 1 || entry?.callId !== input.callId)
    throw new Error('ACP 宿主工具批次返回了不匹配的调用结果')
  return batch.additionalContexts === undefined
    ? entry.result
    : { ...entry.result, additionalContexts: batch.additionalContexts }
}
