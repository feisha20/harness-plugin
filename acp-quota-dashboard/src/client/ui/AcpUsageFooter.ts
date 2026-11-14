import { LiveOutputSpeed, SegmentedOutputSpeed, estimateTokens } from './live-output-speed.ts'
import { snapshotIsAcp } from './AcpAgentControl.ts'
import type { OwnsAcpRoute } from '../coordinator/cross-backend-coordinator.ts'
import { createElement as h, useEffect, useState, useRef } from 'react'
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
  }
  if (labels.length === 0) labels.push('上下文：待上报')
  return labels
}

/** 同一 Agent 的短暂缺报保留最近值，并明确标记过期。 */
export function retainUsageSnapshot(
  previous: AcpAgentSessionSnapshotView | null,
  next: AcpAgentSessionSnapshotView | null,
): AcpAgentSessionSnapshotView | null {
  if (next === null) return previous ? { ...previous, freshness: 'stale' } : null
  if (next.contextUsage === null && previous?.contextUsage && previous.profileId === next.profileId)
    return { ...next, contextUsage: previous.contextUsage, freshness: 'stale' }
  return next
}

/** 使用公开底部插槽展示 Agent 上报值，不改写宿主统计。 */
export function AcpUsageFooter({
  sessionId,
  remote,
  streamFactory,
  useProjection,
  useChat,
  useSession,
  ownsRoute,
}: Props): ReactNode {
  const isAcp = snapshotIsAcp(useProjection('modelSelection'), ownsRoute)
  const chat = useChat((snapshot) => snapshot.legacy)
  const running = useSession((snapshot) => snapshot.running)
  const meter = useRef(new LiveOutputSpeed())
  const segments = useRef(new SegmentedOutputSpeed())
  const [average, setAverage] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const [liveSpeed, setLiveSpeed] = useState<number | null>(null)
  const turn = Math.max(0, ...chat.turnTimings.keys())
  const timing = chat.turnTimings.get(turn)
  const blocks = chat.nodes.flatMap((node) => (node.kind === 'assistant' && node.turn === turn ? node.blocks : []))
  if (chat.partial?.turn === turn) blocks.push(...chat.partial.blocks)
  const tokens = blocks.reduce(
    (sum, block) => sum + (block.kind === 'text' || block.kind === 'reasoning' ? estimateTokens(block.text) : 0),
    0,
  )
  useEffect(() => {
    meter.current = new LiveOutputSpeed()
    setLiveSpeed(null)
    segments.current = new SegmentedOutputSpeed()
    setAverage(null)
  }, [sessionId, isAcp])
  useEffect(() => {
    if (!isAcp || !running) return
    const tick = () => setNow(Date.now())
    tick()
    const timer = setInterval(tick, 100)
    return () => clearInterval(timer)
  }, [sessionId, isAcp, running])
  useEffect(() => {
    if (!isAcp || !running || !timing) return
    const time = Date.now()
    // 新任务从真实开始时间建立零基线，首批文本也计入；消息变化立即刷新。
    meter.current.start(`${sessionId}:${turn}`, timing.startTime)
    setLiveSpeed(meter.current.observe(`${sessionId}:${turn}`, tokens, time))
  }, [sessionId, isAcp, running, turn, timing, tokens, now])
  useEffect(() => {
    const task = `${sessionId}:${turn}`
    if (isAcp && running) {
      const observed: { key: string; tokens: number }[] = []
      const collect = (step: number, content: typeof blocks) =>
        content.forEach((block, index) => {
          if (block.kind === 'text' || block.kind === 'reasoning')
            observed.push({ key: `${step}:${index}`, tokens: estimateTokens(block.text) })
        })
      for (const node of chat.nodes)
        if (node.kind === 'assistant' && node.turn === turn) collect(node.step, [...node.blocks])
      if (chat.partial?.turn === turn) collect(chat.partial.step, [...chat.partial.blocks])
      segments.current.observe(task, observed, Date.now())
    }
    setAverage(segments.current.average(task))
  }, [sessionId, isAcp, running, turn, chat])
  const [state, setState] = useState<{ id: string; snapshot: AcpAgentSessionSnapshotView | null } | null>(null)
  useEffect(() => {
    let active = true
    setState((old) => (old?.id === sessionId ? old : null))
    if (!isAcp) return
    const stream = agentSessionStream(
      remote,
      streamFactory,
      sessionId,
      (snapshot) => {
        if (active)
          setState((old) => ({
            id: sessionId,
            snapshot: retainUsageSnapshot(old?.id === sessionId ? old.snapshot : null, snapshot),
          }))
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
  if (!isAcp) return null
  const labels = snapshot ? usageLabels(snapshot) : ['上下文：待上报']
  if (snapshot?.freshness === 'stale' && snapshot.contextUsage) labels[0] += '（上次）'
  if (running) labels.push(liveSpeed === null ? '实时输出：等待输出' : `实时输出 ≈ ${liveSpeed.toFixed(1)} tok/s`)
  if (!running && timing)
    labels.push(average === null ? '本次平均：暂无统计' : `本次平均 ≈ ${average.toFixed(1)} tok/s`)
  if (labels.length === 0) return null
  return h(
    'div',
    {
      role: 'status',
      title:
        '上下文为 Agent 上报值。实时速度按最近三秒收到的正文和推理文本估算；无文本三秒后显示零速率，暂无统计时显示等待输出。本次平均按实时观测的各文本段估算 Token 总数除以各段首末增量时间之和，排除段间工具调用及等待；单次推送和未观测的历史段不参与。' +
        (snapshot?.freshness === 'stale' ? '上下文数据暂未更新。' : ''),
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
