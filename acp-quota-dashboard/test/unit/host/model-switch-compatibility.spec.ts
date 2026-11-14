import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { LlmError, type LlmCallConfig } from '@deepseek-ai/dsh-llm'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { installAcpModelSwitchCompatibility } from '../../../src/host/composition/model-switch-compatibility.ts'

const contexts: Context[] = []
afterEach(async () => {
  for (const ctx of contexts.splice(0)) await ctx.fiber.dispose()
})

const sol = { provider: 'acp-codex-acp', model: 'gpt-6.1-sol' }
const terra = { provider: 'acp-codex-acp', model: 'gpt-6.1-terra' }

function setup(previous: LlmCallConfig = sol, lateCompaction = false) {
  const ctx = new Context()
  contexts.push(ctx)
  let failure: Error | undefined
  let guardFailure: Error | undefined
  // 复现宿主 rc.4：先取最终配置，再执行模型切换压缩检查。
  const mountCompaction = () =>
    ctx.on(
      'agent/request',
      async (_payload, next) => {
        const config = await next()
        if (failure !== undefined) throw failure
        throw new LlmError('目标模型缺少上下文容量', 'MODEL_SWITCH_COMPACTION_FAILED', {
          cause: new Error(
            `compaction-basic: no context capacity for ${config.provider}/${config.model}; configure contextWindow on that adapter model`,
          ),
        })
      },
      { prepend: true },
    )
  let detachCompaction = lateCompaction ? undefined : mountCompaction()
  const guard = vi.fn(async () => {
    if (guardFailure !== undefined) throw guardFailure
  })
  ctx.on('agent/request', async (_payload, next) => {
    const config = await next()
    await guard()
    return config
  })
  const fiber = ctx.plugin((scope) =>
    installAcpModelSwitchCompatibility(
      scope,
      (provider) => provider === sol.provider || provider === 'acp-antigravity-acp',
    ),
  )
  const request = async (config: LlmCallConfig = terra, signal = new AbortController().signal) => {
    await fiber
    detachCompaction ??= mountCompaction()
    const agent = { session: { requestHeader: () => ({ config: previous }) } } as Agent
    // 与宿主一致：预设就绪后先执行步前检查，再准备模型请求。
    await ctx.waterfall(
      'agent/pre-step',
      {
        agent,
        turn: 1,
        step: 1,
        signal,
        messages: [],
      },
      async () => ({ kind: 'enter' as const, messages: [] }),
    )
    return ctx.waterfall(
      'agent/request',
      {
        agent,
        turn: 1,
        step: 1,
        signal,
      },
      async () => config,
    )
  }
  return {
    request,
    guard,
    fiber,
    reloadCompaction: () => {
      detachCompaction?.()
      detachCompaction = mountCompaction()
    },
    fail: (error: Error) => {
      failure = error
    },
    rejectGuard: (error: Error) => {
      guardFailure = error
    },
  }
}

describe('同一 ACP 的模型切换兼容', () => {
  it.each([false, true])('Google ACP 在压缩模块延迟加载=%s 时允许 Carbon 切换 Pro', async (late) => {
    const h = setup({ provider: 'acp-antigravity-acp', model: 'gemini-4-carbon' }, late)
    const target = { provider: 'acp-antigravity-acp', model: 'gemini-pro-orchestrator' }
    await expect(h.request(target)).resolves.toBe(target)
    expect(h.guard).toHaveBeenCalledOnce()
  })

  it('预设反复重载后仍可切换，每次只执行一次请求校验', async () => {
    const h = setup(sol, true)
    for (let i = 0; i < 3; i++) {
      await expect(h.request()).resolves.toBe(terra)
      h.reloadCompaction()
    }
    expect(h.guard).toHaveBeenCalledTimes(3)
  })

  it('延迟加载的压缩模块仍保留真实摘要错误与绑定错误', async () => {
    const h = setup(sol, true)
    const error = new LlmError('摘要失败', 'MODEL_SWITCH_COMPACTION_FAILED', { cause: new Error('summary failed') })
    h.fail(error)
    await expect(h.request()).rejects.toBe(error)
    const guardError = new LlmError('绑定校验失败', 'ACP_BACKEND_RECOVERY_REQUIRED')
    h.rejectGuard(guardError)
    await expect(h.request()).rejects.toBe(guardError)
  })
  it('允许 Sol 切换 Terra，保留推理等级，且只执行一次请求校验', async () => {
    const h = setup()
    const target = { ...terra, reasoningEffort: 'medium' } as LlmCallConfig
    await expect(h.request(target)).resolves.toBe(target)
    expect(h.guard).toHaveBeenCalledOnce()
  })

  it.each([
    [
      { provider: 'native', model: 'sol' },
      { provider: 'native', model: 'terra' },
    ],
    [sol, { provider: 'acp-other', model: 'terra' }],
    [sol, { provider: 'native', model: 'terra' }],
    [{ provider: 'native', model: 'sol' }, terra],
    [sol, sol],
  ])('保留原生、跨后端和未切换模型的错误：%j → %j', async (previous, target) => {
    await expect(setup(previous).request(target)).rejects.toMatchObject({ code: 'MODEL_SWITCH_COMPACTION_FAILED' })
  })

  it('保留绑定校验失败', async () => {
    const h = setup()
    const error = new LlmError('会话绑定丢失', 'ACP_BACKEND_RECOVERY_REQUIRED')
    h.rejectGuard(error)
    await expect(h.request()).rejects.toBe(error)
  })

  it.each([
    new Error('其他请求错误'),
    new LlmError('摘要失败', 'MODEL_SWITCH_COMPACTION_FAILED', { cause: new Error('summary failed') }),
    new LlmError('容量缺失但不是压缩检查', 'OTHER_ERROR'),
    new LlmError('另一目标缺少容量', 'MODEL_SWITCH_COMPACTION_FAILED', {
      cause: new Error(
        'compaction-basic: no context capacity for native/other; configure contextWindow on that adapter model',
      ),
    }),
  ])('保留其他异常：%s', async (error) => {
    const h = setup()
    h.fail(error)
    await expect(h.request()).rejects.toBe(error)
  })

  it('保留取消信号', async () => {
    const h = setup()
    const controller = new AbortController()
    const error = new Error('请求已取消')
    controller.abort(error)
    await expect(h.request(terra, controller.signal)).rejects.toBe(error)
  })

  it('重排监听器后卸载插件，释放请求监听器和步前监听器', async () => {
    const h = setup()
    await expect(h.request()).resolves.toBe(terra)
    await h.fiber.dispose()
    await expect(h.request()).rejects.toMatchObject({ code: 'MODEL_SWITCH_COMPACTION_FAILED' })
  })
})
