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
      }) => void
    }
  }
}

export const name = 'dsh-workbench'
export const inject = ['webServer']

export function apply(ctx: Context): void {
  const store = new WorkbenchStore()
  const collector = new SessionCollector()
  const handler = createWorkbenchHttpHandler(store, collector)

  if (ctx.webServer) {
    ctx.webServer.register({
      kind: 'prefix',
      path: '/api/workbench',
      handler,
    })
  }
}
