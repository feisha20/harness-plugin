import { BlockAssembler, createUserMessage } from '@deepseek-ai/dsh-llm'
import type { Context } from '@deepseek-ai/cordis'
import { sameModel, type ModelCatalogProvider, type ModelRoute, type ModelSettings, type ReportAiAttribution } from '../shared/types.ts'
import { assertAiFinish, safeAiError } from './aiFailure.ts'

export type ModelGenerator = (input: string, validate?: (text: string) => void) =>
  Promise<{ text: string; attribution: ReportAiAttribution }>

export interface AcpTextGeneration {
  supports(provider: string): boolean
  generate(provider: string, model: string, system: string, input: string, signal: AbortSignal): Promise<string>
}

function describeFailure(cause: unknown): string {
  return safeAiError(cause instanceof Error ? cause.message : String(cause))
}

export function createModelRouter(
  llm: Pick<Context['llm'], 'listProviders' | 'listModels' | 'prepareCall'>,
  defaultSelection: () => ModelRoute,
  acpService: () => AcpTextGeneration | undefined,
) {
  const isAcp = (provider: string) => provider.startsWith('acp-')
  const providers = () => llm.listProviders()
    .filter(provider => !isAcp(provider.id) || acpService()?.supports(provider.id))

  async function listModels(provider: string) {
    const signal = AbortSignal.timeout(20_000)
    return new Promise<Awaited<ReturnType<typeof llm.listModels>>>((resolve, reject) => {
      const timeout = () => reject(new Error('读取模型列表超时'))
      signal.addEventListener('abort', timeout, { once: true })
      Promise.resolve().then(() => llm.listModels(provider)).then(resolve, reject)
        .finally(() => signal.removeEventListener('abort', timeout))
    })
  }

  async function defaultRoute(): Promise<ModelRoute> {
    const route = defaultSelection()
    // 未单独设置时沿用旧版本的默认路由规则。ACP 由用户在工作日志中明确选用。
    if (!isAcp(route.provider)) return route
    const ordinary = llm.listProviders().filter(provider => !isAcp(provider.id))
    const provider = ordinary.find(entry => /deepseek/i.test(entry.id)) ?? ordinary[0]
    if (!provider) throw new Error('请在工作日志的模型设置中选择主模型')
    const [model] = await listModels(provider.id)
    if (!model) throw new Error('默认提供方没有可用的普通模型，请在模型设置中选择主模型')
    return { provider: provider.id, model: model.id }
  }

  async function request(route: ModelRoute, system: string, input: string, maxTokens?: number): Promise<string> {
    const { provider, model } = route
    const signal = AbortSignal.timeout(90_000)
    if (isAcp(provider)) {
      const service = acpService()
      if (!service?.supports(provider)) throw new Error('Antigravity 整理服务不可用，请检查 ACP 插件及其配置')
      return service.generate(provider, model, system, input, signal)
    }
    const budget = maxTokens === undefined ? {} : { maxTokens }
    const call = await llm.prepareCall({ provider, model, ...budget }, signal)
    const assembled = new BlockAssembler()
    const messages = [createUserMessage({ content: [{ type: 'text', text: input }], source: { kind: 'user' } })]
    for await (const chunk of call.stream({ ...call.config, system, messages, purpose: 'session-title', signal })) {
      assembled.push(chunk)
    }
    assertAiFinish(assembled.finish, route, call.config.maxTokens, assembled.usage)
    return assembled.blocks().filter(block => block.type === 'text').map(block => block.text).join('').trim()
  }

  return {
    async catalog(): Promise<ModelCatalogProvider[]> {
      return Promise.all(providers().map(async provider => {
        try {
          const models = (await listModels(provider.id))
            .filter(model => !model.inputModalities || model.inputModalities.includes('text'))
            .map(({ id, name }) => ({ id, name }))
          return { ...provider, models, ...(!models.length ? { error: '暂无可用文本模型' } : {}) }
        } catch {
          return { ...provider, models: [], error: '读取模型失败，请检查提供方配置或重试' }
        }
      }))
    },
    async hasModel(route: ModelRoute): Promise<boolean> {
      return providers().some(provider => provider.id === route.provider)
        && (await listModels(route.provider)).some(model => model.id === route.model
          && (!model.inputModalities || model.inputModalities.includes('text')))
    },
    generator(settings: ModelSettings, system: string, maxTokens?: number): ModelGenerator {
      const { primary, fallback } = settings
      let implicit: Promise<ModelRoute> | undefined
      return async (input, validate) => {
        let route = primary
        const attempt = async (selected: ModelRoute, usedFallback: boolean) => {
          const text = (await request(selected, system, input, maxTokens)).trim()
          if (!text) throw new Error('模型返回空内容')
          validate?.(text)
          return { text, attribution: { ...selected, usedFallback } }
        }
        try {
          route ??= await (implicit ??= defaultRoute())
          return await attempt(route, false)
        } catch (cause) {
          const primaryError = `主模型 ${route ? `[${route.provider}/${route.model}] ` : ''}失败：${describeFailure(cause).slice(0, 240)}`
          if (!fallback || sameModel(route, fallback)) {
            throw Object.assign(new Error(primaryError), { code: (cause as { code?: string } | null)?.code })
          }
          try {
            return await attempt(fallback, true)
          } catch (backupCause) {
            throw Object.assign(new Error(`${primaryError}；备用模型 [${fallback.provider}/${fallback.model}] 失败：${describeFailure(backupCause).slice(0, 240)}`), {
              code: (backupCause as { code?: string } | null)?.code,
            })
          }
        }
      }
    },
  }
}
