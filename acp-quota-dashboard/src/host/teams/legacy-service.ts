import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-experimental-agent-team'

/** 新宿主保留了 agentTeams 服务名，但已移除旧成员接口，不能只判断服务是否存在。 */
export function legacyTeamMembership(ctx: Context, agent: Agent) {
  const teams = ctx.get('agentTeams', false)
  return typeof teams?.tryMembership === 'function' ? teams.tryMembership(agent) : undefined
}

/** 旧版成员管理扩展仅在两个接口均可用时启用；不模拟新版的成员归属或权限。 */
export function legacyTeamRoster(ctx: Context) {
  const teams = ctx.get('agentTeams', false)
  return typeof teams?.tryMembership === 'function' && typeof teams.listMembers === 'function' ? teams : undefined
}
