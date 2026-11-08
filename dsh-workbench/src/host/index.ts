import { REPORT_INSTRUCTION } from './reportSummary.ts'
import { SUMMARY_INSTRUCTION } from './sessionSummary.ts'
import type { Context } from '@deepseek-ai/cordis'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { WorkbenchStore } from './store.ts'
import { SessionCollector } from './collector.ts'
import { createWorkbenchHttpHandler } from './webRoutes.ts'
import { createModelRouter, type AcpTextGeneration } from './modelRouter.ts'
import { defaultModelSettings, type ModelRoute } from '../shared/types.ts'

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
  const defaults = ctx.get('agentDefaultModel') as { currentSelection(): ModelRoute }
  const models = createModelRouter(ctx.llm, () => defaults.currentSelection(),
    () => ctx.get('dshAcpTextGeneration') as AcpTextGeneration | undefined)
  const settings = () => store.getSnapshot().modelSettings ?? defaultModelSettings
  const handler = createWorkbenchHttpHandler(
    store,
    () => {
      const generate = models.generator(settings(), SUMMARY_INSTRUCTION, 2000)
      return new SessionCollector(async (input, validate) => (await generate(input, validate)).text)
    },
    (input, validate) => models.generator(settings(), REPORT_INSTRUCTION)(input, validate),
    models,
  )

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
