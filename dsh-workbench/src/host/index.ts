import { BlockAssembler, createUserMessage } from '@deepseek-ai/dsh-llm'
import { assertAiFinish } from './aiFailure.ts'
import { REPORT_INSTRUCTION } from './reportSummary.ts'
import { SUMMARY_INSTRUCTION } from './sessionSummary.ts'
import type { Context } from '@deepseek-ai/cordis'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { WorkbenchStore } from './store.ts'
import { SessionCollector } from './collector.ts'
import { createWorkbenchHttpHandler } from './webRoutes.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    webServer?: {
      register: (route: {
        kind: 'exact' | 'prefix'
        path: string
        handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
      }) => () => void
    }
  }
}

export const name = 'dsh-workbench'
export const inject = ['webServer', 'llm', 'agentDefaultModel']

export function apply(ctx: Context): void {
  const store = new WorkbenchStore()
  const generate = async (system:string,input:string,maxTokens=2000) => {
    const defaults=ctx.get('agentDefaultModel') as unknown as { currentSelection():{provider:string;model:string} }
    let route=defaults.currentSelection()
    // ACP 是交互式 Agent 通道，不能承担后台摘要；使用宿主已注册的普通模型。
    if (route.provider.startsWith('acp-')) {
      const providers=ctx.llm.listProviders().filter(p=>!p.id.startsWith('acp-'))
      const provider=providers.find(p=>/deepseek/i.test(p.id)) || providers[0]
      if (!provider) throw new Error('当前只有 ACP 模型，无法后台整理。请在 DSH 设置中配置普通模型提供方。')
      const models=await ctx.llm.listModels(provider.id)
      if (!models.length) throw new Error('普通模型提供方没有可用模型，请检查 DSH 模型配置')
      route={provider:provider.id,model:models[0].id}
    }
    const signal=AbortSignal.timeout(90000)
    const call=await ctx.llm.prepareCall({...route,maxTokens},signal)
    const assembled=new BlockAssembler()
    for await(const chunk of call.stream({...call.config,system,messages:[createUserMessage({content:[{type:'text',text:input}],source:{kind:'user'}})],purpose:'session-title',signal})) assembled.push(chunk)
    assertAiFinish(assembled.finish,route,maxTokens,assembled.usage)
    const text=assembled.blocks().filter(block=>block.type==='text').map(block=>block.text).join('').trim()
    if (!text) throw new Error('AI 返回空内容')
    return text
  }
  const collector = new SessionCollector(input=>generate(SUMMARY_INSTRUCTION,input))
  const handler = createWorkbenchHttpHandler(store, collector, (input)=>generate(REPORT_INSTRUCTION,input,6000))

  if (ctx.webServer) {
    const webServer = ctx.webServer
    // 插件停用或热更新时释放路由，避免下一版本注册失败。
    ctx.effect(() => webServer.register({
      kind: 'prefix',
      path: '/api/workbench',
      handler,
    }))
  }
}
