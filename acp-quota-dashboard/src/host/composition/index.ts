/**
 * Additive ACP composition root. DSH owns the AgentLoop, native ModelPicker,
 * and conversation surface, including model search and selection.
 * This plugin also contributes ACP LLM routes and its existing settings/
 * sidecar services through public seams.
 */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-settings'
import { installLegacySettingsImport } from './legacy-settings.ts'
import { Config } from './config.ts'
export { Config }
import { installInstalledProfileRegistry } from './installed-profile-registry.ts'
import { installAcpTextGeneration } from './text-generation.ts'
import { resolveSubprocessSeam } from './subprocess.ts'

export const name = 'dsh-acp-adapter'
// Wait for the host-owned seams before creating routes. This avoids freezing a
// missing sessions/subprocess service during an early composition pass.
// Attachment storage is required because ACP image capability is only true
// when DSH can read its durable image references.  Waiting for this seam at
// composition time prevents a health probe from freezing a false
// `promptImage: unsupported` result before the host finishes booting.
// Permission facts are read from the host preset projection before ACP dispatch.
export const inject = [
  'llm',
  'sessions',
  'subprocess',
  'dshHomePath',
  'attachments',
  'sessionProjections',
  'permissionPresets',
]

export function apply(ctx: Context, config: Config): void {
  ctx.inject(['settings'], (child) => {
    child.effect(() => child.settings.configure({ auto: false }, ctx.fiber))
  })
  const subprocess = resolveSubprocessSeam(ctx)
  const registry = installInstalledProfileRegistry(ctx, config, { installRemote: true, subprocess })
  installAcpTextGeneration(ctx, registry, subprocess)
  installLegacySettingsImport(ctx)
}

export { installInstalledProfileRegistry } from './installed-profile-registry.ts'
