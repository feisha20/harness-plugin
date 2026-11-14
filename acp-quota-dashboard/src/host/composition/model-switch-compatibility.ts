import type { Context, Events } from '@deepseek-ai/cordis'
import { LlmError, type LlmCallConfig } from '@deepseek-ai/dsh-llm'

/**
 * rc.4 的压缩前置检查要求原生模型容量；ACP 的上下文由外部 Agent 管理。
 * 只接回已通过请求链校验的同一路由切换，不重放请求链，也不伪造容量。
 */
export function installAcpModelSwitchCompatibility(ctx: Context, ownsProvider: (provider: string) => boolean): void {
  const resolvedRequests = new WeakMap<object, LlmCallConfig>()
  ctx.on('agent/request', async (payload, next) => {
    const resolved = await next()
    resolvedRequests.set(payload, resolved)
    return resolved
  })
  const recover: Events['agent/request'] = async (payload, next) => {
    try {
      return await next()
    } catch (error) {
      payload.signal.throwIfAborted()
      const resolved = resolvedRequests.get(payload)
      const previous = payload.agent.session.requestHeader()?.config
      if (
        resolved === undefined ||
        previous?.provider !== resolved.provider ||
        previous.model === resolved.model ||
        !ownsProvider(resolved.provider) ||
        !(error instanceof LlmError) ||
        error.code !== 'MODEL_SWITCH_COMPACTION_FAILED' ||
        !(error.cause instanceof Error) ||
        error.cause.message !==
          `compaction-basic: no context capacity for ${resolved.provider}/${resolved.model}; configure contextWindow on that adapter model`
      )
        throw error
      return resolved
    } finally {
      resolvedRequests.delete(payload)
    }
  }
  let detach = ctx.on('agent/request', recover, { prepend: true })
  // NEXT 在 Agent 预设中加载压缩模块，其 prepend 监听器可能晚于 ACP 注册。
  // 每步开始时重新置于外层，覆盖预设首次加载和重载；不重放请求或修改会话。
  ctx.on('agent/pre-step', (_payload, next) => {
    detach()
    detach = ctx.on('agent/request', recover, { prepend: true })
    return next()
  })
}
