import type { AcpToolCallSnapshot } from './tool-call-reducer.ts'

/** 仅依据结构化工具状态跟进命令，不依据“稍等”等回复文案。 */
export class AntigravityCommandFollowup {
  private readonly commands = new Map<string, AcpToolCallSnapshot>()

  observe(tool: AcpToolCallSnapshot): void {
    const input = tool.rawInput
    if (
      tool.name === 'run_command' &&
      input !== null &&
      typeof input === 'object' &&
      'CommandLine' in input &&
      typeof input.CommandLine === 'string'
    )
      this.commands.set(tool.callId, tool)
  }

  get pending(): boolean {
    return [...this.commands.values()].some((tool) => tool.status === 'running')
  }
}

export const ANTIGRAVITY_COMMAND_FOLLOWUP_LIMIT = 2

export const ANTIGRAVITY_COMMAND_FOLLOWUP_TEXT =
  '上一轮已启动的命令尚未返回终态。请继续读取同一任务的状态和输出，必要时使用 command_status 等待已有命令完成，然后向用户报告结果。不要重新执行原命令、启动替代命令或重复用户任务；若无法读取已有任务，请明确说明原因。'
