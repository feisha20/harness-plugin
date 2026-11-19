import { createElement as h, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { QuotaView, QuotaBucket } from '../../contract/quota.ts'
import type { ExitRegionView } from '../../contract/exit-region.ts'
import css from './QuotaSidebar.module.css'

export interface QuotaSidebarWire {
  agents(): { id: string; runtime: string; name: string }[]
  subscribeConfig(changed: () => void): () => void
  read(id: string, force?: boolean): Promise<QuotaView>
  readRegion(id: string, force: boolean): Promise<ExitRegionView>
}

/** 缺报与停用保留未知状态，不把它们当作零额度。 */
export function quotaPercent(bucket: QuotaBucket | undefined): number | null {
  const value = bucket?.remainingPercent
  return bucket?.disabled || typeof value !== 'number' || !Number.isFinite(value)
    ? null
    : Math.max(0, Math.min(100, value))
}

/** 保留两位小数，极小余额和接近满额时也区分真实端点。 */
export function formatQuotaPercent(percent: number): string {
  if (percent > 0 && percent < 0.01) return '<0.01%'
  if (percent < 100 && percent > 99.99) return '>99.99%'
  return `${Number(percent.toFixed(2))}%`
}

export function QuotaSidebar({ wire }: { wire: QuotaSidebarWire }): ReactNode {
  const [, update] = useState(0)
  useEffect(() => wire.subscribeConfig(() => update((n) => n + 1)), [wire])
  const agents = wire.agents()
  if (!agents.length) return null
  return h(
    'section',
    { className: css.panel, 'aria-label': 'ACP 剩余额度' },
    h('div', { className: css.heading }, h('span', null, '模型额度'), h('span', null, '剩余')),
    ...agents.map((agent) => h(ProviderRow, { key: `${agent.id}:${agent.runtime}`, agent, wire })),
  )
}

const countries = new Intl.DisplayNames(['zh-CN'], { type: 'region' })

function ProviderRow({
  agent,
  wire,
}: {
  agent: { id: string; runtime: string; name: string }
  wire: QuotaSidebarWire
}): ReactNode {
  const [value, setValue] = useState<QuotaView | null>(null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [region, setRegion] = useState<ExitRegionView | null>(null)
  const refreshRegion = useRef<(force: boolean) => void>(() => {})
  useEffect(() => {
    let alive = true
    let pending = false
    const read = async (force = false) => {
      if (pending) return
      pending = true
      try {
        const current = await wire.readRegion(agent.id, force)
        if (alive) setRegion(current)
      } catch {
        if (alive)
          setRegion((previous) => ({
            status: 'unavailable',
            sample: previous?.sample ?? null,
            change: previous?.change ?? null,
          }))
      } finally {
        pending = false
      }
    }
    refreshRegion.current = (force) => {
      void read(force)
    }
    const visible = () => {
      if (document.visibilityState === 'visible') void read()
    }
    visible()
    const timer = setInterval(visible, 180_000)
    document.addEventListener('visibilitychange', visible)
    return () => {
      alive = false
      clearInterval(timer)
      document.removeEventListener('visibilitychange', visible)
    }
  }, [agent.id, wire])
  const refresh = useRef<(force?: boolean) => void>(() => {})
  useEffect(() => {
    let alive = true
    let pending = false
    const read = async (force = false) => {
      if (pending) return
      pending = true
      setBusy(true)
      try {
        const result = await wire.read(agent.id, force)
        if (alive) {
          setValue(result)
          setFailed(false)
        }
      } catch {
        if (alive) setFailed(true)
      } finally {
        pending = false
        if (alive) setBusy(false)
      }
    }
    refresh.current = (force) => {
      void read(force)
    }
    void read()
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void read()
    }, 120_000)
    const visible = () => {
      if (document.visibilityState === 'visible') void read()
    }
    document.addEventListener('visibilitychange', visible)
    return () => {
      alive = false
      clearInterval(timer)
      document.removeEventListener('visibilitychange', visible)
    }
  }, [agent.id, wire])
  const codex = agent.runtime === 'codex'
  const buckets = [codex ? 'codex-primary' : 'gemini-5h', codex ? 'codex-secondary' : 'gemini-weekly'].map((id) =>
    value?.buckets.find((b) => b.id === id),
  )
  const percents = buckets.map(quotaPercent)
  const name = codex ? 'Codex' : 'Antigravity'
  const rawPlan = value?.plan?.trim()
  const plan = rawPlan
    ?.replace(/^Google AI\s+/i, '')
    .replace(/\b(ultra|plus|pro|free)\b/gi, (word) => word[0]!.toUpperCase() + word.slice(1).toLowerCase())
  const sample = region?.sample
  const country = sample ? (countries.of(sample.country) ?? sample.country) : '—'
  const current = region?.status === 'confirmed'
  const changed = region?.change
  const badge = sample ? `${country}${!current ? '·旧' : changed ? ' ↔' : ''}` : '—'
  const regionDetail = [
    sample ? `${current ? '同线路探测' : '上次同线路探测'}：${country} ${sample.ip}` : '出口地区未确认',
    sample?.location ? `IP 归属：${sample.location}` : null,
    sample ? `探测来源：${{ cloudflare: 'Cloudflare', ping0: 'Ping0', ipwhois: 'IPWhois' }[sample.source]}` : null,
    sample ? `探测时间：${new Date(sample.checkedAt).toLocaleString('zh-CN')}` : null,
    changed && sample
      ? `${new Date(changed.at).toLocaleString('zh-CN')} 检测到${changed.country === sample.country ? '出口 IP 变化' : `地区从 ${countries.of(changed.country) ?? changed.country} 变更`}`
      : null,
    region?.status === 'unmatched' ? '服务域名与探测站点的线路未能核对' : null,
    region?.status === 'unavailable' ? 'Clash Verge 或地区探测暂不可用' : null,
  ]
    .filter(Boolean)
    .join('\n')
  const detail = [
    agent.name,
    value?.account,
    value?.plan,
    ...buckets.map((bucket, i) => {
      const percent = percents[i] ?? null
      const amount = bucket?.disabled ? '不可用' : percent === null ? '未知' : `剩余 ${formatQuotaPercent(percent)}`
      const reset = bucket?.resetTime ? new Date(bucket.resetTime).toLocaleString('zh-CN') : '未知'
      return `${i ? '周额度' : '五小时'}：${amount}；重置：${reset}`
    }),
    value ? `更新于 ${new Date(value.fetchedAt).toLocaleString('zh-CN')}` : '尚未读取额度',
    regionDetail,
    failed ? '额度刷新失败，显示上次结果；点击重试' : '点击刷新额度和出口地区',
  ]
    .filter(Boolean)
    .join('\n')
  return h(
    'button',
    {
      type: 'button',
      className: css.row,
      title: detail,
      'aria-label': `刷新 ${name} 额度和出口地区`,
      'aria-description': detail,
      'aria-busy': busy,
      onClick: () => {
        refresh.current(true)
        refreshRegion.current(true)
      },
      'data-provider': codex ? 'codex' : 'google',
    },
    h(
      'span',
      { className: css.provider },
      h('span', { className: css.icon, 'aria-hidden': true }, codex ? 'C' : 'G'),
      h('span', { className: css.name }, name),
      plan ? h('span', { className: css.plan, title: rawPlan }, plan) : null,
      h('span', { className: css.status }, busy ? '刷新中' : failed ? '上次' : '↻'),
    ),
    h(
      'span',
      { className: css.metrics },
      ...percents.map((percent, i) => {
        return h(
          'span',
          { key: i, className: css.metric, 'data-low': percent !== null && percent <= 20 },
          h(
            'span',
            { className: css.label },
            h('span', { className: css.shortLabel }, i ? '周' : '5h'),
            h('span', { className: css.fullLabel }, i ? '周额度' : '5 小时'),
            h('strong', null, percent === null ? '—' : formatQuotaPercent(percent)),
          ),
          h(
            'span',
            { className: css.track, 'aria-hidden': true },
            h('span', { className: css.fill, style: { width: `${percent ?? 0}%` } }),
          ),
        )
      }),
      h(
        'span',
        {
          className: css.region,
          'data-state': !current ? 'stale' : changed ? 'changed' : 'current',
          title: regionDetail,
        },
        badge,
      ),
    ),
  )
}

/** 桌面宿主公开的底部列表插槽；当前开发依赖未包含左侧栏类型包。 */
declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    'sidebar.footer.action': { kind: 'list'; scope: 'root' }
  }
}
