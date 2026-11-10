import { snapshotIsAcp } from './AcpAgentControl.ts'
import type { OwnsAcpRoute } from '../coordinator/cross-backend-coordinator.ts'
import { createElement as h, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { PropsRuntime, PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { AcpRemoteLike, AcpAgentSessionSnapshotView } from '../data/acp-remote.ts'
import type { RemoteStreamFactory } from '@deepseek-ai/dsh-api-gateway/client'
import { agentSessionStream } from '../data/agent-session-stream.ts'
import { formatContextTokenCount } from './agent-session-controls.ts'

type Props = PropsRuntime<'conversation.composer.dock'> &
  PropsLocale<'acpActivity'> & {
    readonly ownsRoute: OwnsAcpRoute
    readonly remote: AcpRemoteLike
    readonly streamFactory: RemoteStreamFactory
  }

export function usageLabels(snapshot: AcpAgentSessionSnapshotView): string[] {
  const labels: string[] = []
  const context = snapshot.contextUsage
  const count = formatContextTokenCount
  if (context !== null) {
    labels.push(`上下文 ${count(context.used)} / ${count(context.size)}（${context.percent}%）`)
    if (context.cost !== null) labels.push(`费用 ${context.cost.amount} ${context.cost.currency}`)
  }
  const usage = snapshot.reportedUsage
  if (usage != null) {
    labels.push(
      `上报用量 ${count(usage.totalTokens)} tok`,
      `输入 ${count(usage.inputTokens)}`,
      `输出 ${count(usage.outputTokens)}`,
    )
    if (usage.cachedReadTokens !== undefined) labels.push(`缓存读取 ${count(usage.cachedReadTokens)}`)
    if (usage.cachedWriteTokens !== undefined) labels.push(`缓存写入 ${count(usage.cachedWriteTokens)}`)
    if (usage.thoughtTokens !== undefined) labels.push(`推理 ${count(usage.thoughtTokens)}`)
  }
  return labels
}

/** 使用公开底部插槽展示 Agent 上报值，不改写宿主统计。 */
export function AcpUsageFooter({ sessionId, remote, streamFactory, t, useProjection, ownsRoute }: Props): ReactNode {
  const isAcp = snapshotIsAcp(useProjection('modelSelection'), ownsRoute)
  const [state, setState] = useState<{ id: string; snapshot: AcpAgentSessionSnapshotView | null } | null>(null)
  useEffect(() => {
    let active = true
    setState(null)
    if (!isAcp) return
    const stream = agentSessionStream(
      remote,
      streamFactory,
      sessionId,
      (snapshot) => {
        if (active) setState({ id: sessionId, snapshot })
      },
      () => {
        if (active)
          setState((old) =>
            old === null || old.snapshot === null
              ? old
              : {
                  ...old,
                  snapshot: { ...old.snapshot, freshness: 'stale' },
                },
          )
      },
    )
    void stream.start()
    return () => {
      active = false
      void stream.dispose()
    }
  }, [sessionId, remote, streamFactory, isAcp])
  const snapshot = state?.id === sessionId ? state.snapshot : null
  if (!isAcp || snapshot == null) return null
  const labels = usageLabels(snapshot)
  if (labels.length === 0) return null
  if (snapshot.freshness === 'stale') labels.push(t('agentStateStale'))
  return h(
    'div',
    {
      role: 'status',
      title: 'ACP Agent 原始上报；可能为本轮或会话累计值，不与宿主统计相加。未上报的指标不显示。',
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '4px 12px',
        fontSize: '12px',
        opacity: 0.7,
      },
    },
    ...labels.map((label, index) => h('span', { key: index }, label)),
  )
}
