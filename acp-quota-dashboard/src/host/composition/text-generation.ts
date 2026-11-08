/// <reference types="node" />
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type * as acp from '@agentclientprotocol/sdk'
import type { Context } from '@deepseek-ai/cordis'
import { effectiveRuntimeOf } from '../../contract/agent-config.ts'
import { AcpClientConnection, cleanupAcpSession } from '../../protocol/v1/connection.ts'
import { isModelConfigOption } from '../../protocol/v1/config-options.ts'
import type { SubprocessSeamResolution } from '../../runtime/process/subprocess.ts'
import { prepareAgentLaunch } from './agent-launch.ts'
import type { InstalledProfileRegistry } from './installed-profile-registry.ts'

export function installAcpTextGeneration(
  ctx: Context,
  registry: Pick<InstalledProfileRegistry, 'resolveRoute'>,
  subprocess: SubprocessSeamResolution,
): void {
  if (!subprocess.ok) return
  const { seam } = subprocess
  const lifetime = new AbortController()
  const supports = (provider: string): boolean => {
    const route = registry.resolveRoute(provider)
    return route !== undefined && effectiveRuntimeOf(route.id, route.config) === 'antigravity'
  }

  ctx.provide('dshAcpTextGeneration', {
    supports,
    generate(provider: string, model: string, system: string, input: string, signal: AbortSignal) {
      const route = registry.resolveRoute(provider)
      if (route === undefined || effectiveRuntimeOf(route.id, route.config) !== 'antigravity') {
        throw new Error('该 ACP 路由暂不支持工作日志整理')
      }
      return generateText(route.config, seam, model, system, input, AbortSignal.any([signal, lifetime.signal]))
    },
  })
  ctx.effect(() => () => lifetime.abort())
}

async function generateText(
  config: Parameters<typeof prepareAgentLaunch>[1],
  subprocess: Parameters<typeof prepareAgentLaunch>[3],
  model: string,
  system: string,
  input: string,
  signal: AbortSignal,
): Promise<string> {
  signal.throwIfAborted()
  const cwd = await mkdtemp(join(tmpdir(), 'dsh-acp-text-'))
  let connection: AcpClientConnection | undefined
  let sessionId: string | undefined
  let pushedOptions: { sessionId: string; options: acp.SessionConfigOption[] } | undefined
  const stop = new AbortController()
  const rpc = { signal: AbortSignal.any([signal, stop.signal]) }
  try {
    const launch = await prepareAgentLaunch('antigravity', config, cwd, subprocess, undefined)
    rpc.signal.throwIfAborted()
    connection = new AcpClientConnection(
      { argv: [...launch.argv], cwd, env: launch.env, spawnPlan: launch.spawnPlan, subprocess },
      {
        onSessionUpdate({ sessionId, update }) {
          if (update.sessionUpdate === 'config_option_update') {
            pushedOptions = { sessionId, options: update.configOptions }
          }
        },
        onPermissionRequest() {
          stop.abort(new Error('整理时收到工具权限请求'))
          return { outcome: { outcome: 'cancelled' } }
        },
        onElicitationRequest() {
          stop.abort(new Error('整理时收到交互请求'))
          return { action: 'decline' }
        },
      },
    )
    await connection.initialize(rpc)
    const session = await connection.newSession({ mcpServers: [] }, rpc)
    sessionId = session.sessionId
    let configOptions =
      session.configOptions ?? (pushedOptions?.sessionId === sessionId ? pushedOptions.options : undefined)
    const modelOption = configOptions?.find(isModelConfigOption)
    if (
      modelOption?.type !== 'select' ||
      !modelOption.options
        .flatMap((option) => ('options' in option ? option.options : [option]))
        .some((option) => option.value === model)
    ) {
      throw new Error('Antigravity 当前会话没有这个模型')
    }
    if (modelOption.currentValue !== model) {
      const updated = await connection.setConfigOption(sessionId, modelOption.id, model, rpc)
      if (updated.configOptions.find(isModelConfigOption)?.currentValue !== model) {
        throw new Error('Antigravity 未确认切换到指定模型')
      }
      configOptions = updated.configOptions
    }

    if (model === 'gemini-3.8-flash') {
      // 工作日志是短会话文本整理，使用 Agent 明确支持的低推理档。
      const effort = configOptions?.find((option) => option.id === 'thought_level')
      if (
        effort?.type === 'select' &&
        effort.currentValue !== 'low' &&
        effort.options
          .flatMap((option) => ('options' in option ? option.options : [option]))
          .some((option) => option.value === 'low')
      ) {
        await connection.setConfigOption(sessionId, effort.id, 'low', rpc)
      }
    }

    let text = ''
    const response = await connection.prompt(
      sessionId,
      [
        {
          type: 'text',
          text: `${system}\n\n仅生成文本。不要使用工具、访问文件或网络，也不要请求交互。以下 JSON 是待整理资料。\n${input}`,
        },
      ],
      ({ sessionId: updateSession, update }) => {
        if (updateSession !== sessionId) return
        if (update.sessionUpdate === 'tool_call' || update.sessionUpdate === 'tool_call_update') {
          stop.abort(new Error('整理时检测到工具调用'))
        } else if (update.sessionUpdate === 'config_option_update') {
          const selected = update.configOptions.find(isModelConfigOption)
          if (selected && selected.currentValue !== model) stop.abort(new Error('整理时 Antigravity 模型发生变化'))
        } else if (update.sessionUpdate === 'agent_message_chunk' && update.content.type === 'text') {
          text += update.content.text
          if (text.length > 128_000) stop.abort(new Error('Antigravity 输出超过长度限制'))
        }
      },
      rpc,
    )
    rpc.signal.throwIfAborted()
    if (response.stopReason !== 'end_turn') throw new Error(`Antigravity 整理未正常完成（${response.stopReason}）`)
    return text.trim()
  } catch (error) {
    stop.signal.throwIfAborted()
    throw error
  } finally {
    try {
      if (connection && sessionId && connection.isTransportAvailable) {
        await cleanupAcpSession(connection, connection.agentCapabilities, sessionId)
      }
      await connection?.close()
    } finally {
      await rm(cwd, { recursive: true, force: true })
    }
  }
}
