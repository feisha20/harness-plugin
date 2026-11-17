import { describe, expect, it, vi } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { legacyTeamMembership, legacyTeamRoster } from '../../../src/host/teams/legacy-service.ts'
import { createTeamToolContext } from '../../../src/host/teams/tool-context.ts'
import { createTeamManagement } from '../../../src/host/teams/management.ts'

const agent = { id: '普通会话' } as Agent
const ctxFor = (teams: unknown) => ({ get: (name: string) => (name === 'agentTeams' ? teams : undefined) }) as Context

describe('旧 Team 扩展能力检测', () => {
  it.each([undefined, {}, { isEnabled: () => false }, { tryMembership: true }, { tryMembership: () => undefined }])(
    '服务缺失或新版接口不会当作旧 Team 成员服务：%j',
    async (teams) => {
      const ctx = ctxFor(teams)
      expect(legacyTeamMembership(ctx, agent)).toBeUndefined()
      expect(legacyTeamRoster(ctx)).toBeUndefined()
      expect(createTeamToolContext(ctx, agent)).toBeUndefined()
      await expect(createTeamManagement(ctx, () => true).members(agent.id)).rejects.toThrow('ACP_TEAM_API_UNAVAILABLE')
    },
  )
  it('旧接口保留接收对象与原始成员归属', () => {
    const membership = { root: agent, id: agent.id, role: 'lead' }
    const teams = {
      tryMembership: vi.fn(function (this: unknown, caller: Agent) {
        expect(this).toBe(teams)
        expect(caller).toBe(agent)
        return membership
      }),
      listMembers: () => [],
    }
    expect(legacyTeamMembership(ctxFor(teams), agent)).toBe(membership)
    expect(legacyTeamRoster(ctxFor(teams))).toBe(teams)
  })
})
