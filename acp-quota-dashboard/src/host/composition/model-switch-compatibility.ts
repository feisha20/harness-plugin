import type { Context } from '@deepseek-ai/cordis'
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
  const wrapCompaction = () => ctx.on(
    'agent/request',
    async (payload, next) => {
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
          resolved.provider !== 'acp-antigravity-acp' ||
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
    },
    { prepend: true },
  )
  let release = wrapCompaction()
  ctx.on('agent/pre-step', (payload, next) => {
    const previous = payload.agent.session.requestHeader()?.config
    const target = payload.modelSelection
    if (target.provider === 'acp-antigravity-acp' && previous?.provider === target.provider &&
        previous.model !== target.model && ownsProvider(target.provider)) {
      // 各会话在插件启动后才装配压缩服务。此时重排外层监听，已开始的请求仍使用各自的监听快照。
      release()
      release = wrapCompaction()
    }
    return next()
  })
}
