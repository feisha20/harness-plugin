import type { Context as ClientContext } from '@deepseek-ai/cordis'
import { WorkbenchIcon } from './WorkbenchIcon.tsx'
import { WorkbenchApp } from './WorkbenchApp.tsx'

declare module '@deepseek-ai/cordis' {
  interface Context {
    slots: {
      inject: (name: string, callback: () => void) => void
      register: (options: Record<string, unknown>, component: unknown) => void
    }
    layout: {
      selectPanel: (panelId: string | null) => void
    }
  }
}

export const PANEL_ID = 'workbench'

export const inject = ['slots', 'layout'] as const

export function apply(ctx: ClientContext): void {
  // 1. 注册中央主面板视图 (keyed slot)
  ctx.slots.inject('main', () =>
    ctx.slots.register(
      {
        name: 'main',
        key: PANEL_ID,
      },
      WorkbenchApp,
    ),
  )

  // 2. 注册左侧主菜单图标与入口 (list slot)
  ctx.slots.inject('sidebar.panellist', () =>
    ctx.slots.register(
      {
        name: 'sidebar.panellist',
        id: PANEL_ID,
        order: 15,
        label: () => '工作日志',
      },
      WorkbenchIcon,
    ),
  )
}
