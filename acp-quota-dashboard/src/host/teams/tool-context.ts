import { legacyTeamMembership, legacyTeamRoster } from './legacy-service.ts'
import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-experimental-agent-team'
import type { ToolDefinition } from '@deepseek-ai/dsh-tools'

/** Optional Team ownership and ACP context limits for the shared DSH tool bridge. */
export function createTeamToolContext(ctx: Context, agent: Agent) {
  const initial = legacyTeamMembership(ctx, agent)
  if (initial === undefined) return undefined
  return {
    membership: () => legacyTeamMembership(ctx, agent),
    listMembers: () => legacyTeamRoster(ctx)?.listMembers(agent) ?? [],
    isLive(): boolean {
      const teams = legacyTeamRoster(ctx)
      const current = teams?.tryMembership(agent)
      if (
        current === undefined ||
        current.id !== initial.id ||
        current.root !== initial.root ||
        current.role !== initial.role
      )
        return false
      const root = initial.root
      const lead = teams?.tryMembership(root)
      return (
        ctx.get('agents', false)?.get(root.id) === root &&
        lead?.role === 'lead' &&
        lead.root === root &&
        lead.id === initial.id
      )
    },
    spawnSchema(definition: ToolDefinition) {
      if (definition.name !== 'spawn_teammate') return undefined
      return {
        additionalProperties: false,
        properties: {
          ...(definition.parameters.properties as Record<string, unknown>),
          context: {
            type: 'string',
            enum: ['fresh'],
            description: 'Fresh ACP session; history fork is unsupported.',
          },
        },
      }
    },
    validateArguments(definition: ToolDefinition, args: Record<string, unknown>): void {
      if (definition.name !== 'spawn_teammate') return
      if (Object.keys(args).some((key) => !['name', 'description', 'prompt', 'context'].includes(key)))
        throw new Error('ACP_TEAM_ROUTE_OVERRIDE_UNSUPPORTED: teammates inherit the lead Agent and model')
      if (args.context !== undefined && args.context !== 'fresh')
        throw new Error('ACP_TEAM_FORK_UNSUPPORTED: use fresh context')
    },
  }
}
