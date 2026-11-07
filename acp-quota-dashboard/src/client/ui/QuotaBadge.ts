import { createElement as h, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { QuotaView } from '../../contract/quota.ts'
import css from './QuotaBadge.module.css'

interface QuotaBadgeWire {
  resolveAgent(provider: string | undefined): string | undefined
  subscribeConfig(changed: () => void): () => void
  defaultProvider(): Promise<string | undefined>
  read(agentId: string, force?: boolean): Promise<QuotaView>
}

/** 只使用公开的输入栏插槽；不替换宿主模型选择器。 */
export function QuotaBadge({
  useProjection,
  wire,
}: PropsRuntime<'conversation.input.right'> & { wire: QuotaBadgeWire }): ReactNode {
  const selection = useProjection('modelSelection')
  const [defaultProvider, setDefault] = useState<string | undefined>()
  const [, setRevision] = useState(0)
  useEffect(() => wire.subscribeConfig(() => setRevision((value) => value + 1)), [wire])
  useEffect(() => {
    let live = true
    void wire
      .defaultProvider()
      .then((value) => {
        if (live) setDefault(value)
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [wire])
  const current = selection?.next ?? selection?.lastUsed
  const agentId = wire.resolveAgent(current?.provider ?? defaultProvider)
  return agentId === undefined ? null : h(LoadedBadge, { key: agentId, agentId, wire })
}

function LoadedBadge({ agentId, wire }: { agentId: string; wire: QuotaBadgeWire }): ReactNode {
  const [quota, setQuota] = useState<QuotaView | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ left: 12, top: 200, maxHeight: 320 })
  const anchor = useRef<HTMLSpanElement | null>(null)
  const panel = useRef<HTMLDivElement | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const suppressFocusOpen = useRef(false)
  const active = useRef(true)
  const pending = useRef(false)
  const id = useId()
  const refresh = async (force = false): Promise<void> => {
    if (pending.current) return
    pending.current = true
    setBusy(true)
    setError(false)
    try {
      const result = await wire.read(agentId, force)
      if (active.current) setQuota(result)
    } catch {
      if (active.current) setError(true)
    } finally {
      pending.current = false
      if (active.current) setBusy(false)
    }
  }
  useEffect(() => {
    active.current = true
    void refresh()
    return () => {
      active.current = false
      clearTimeout(closeTimer.current)
    }
  }, [])
  const keepOpen = (): void => {
    clearTimeout(closeTimer.current)
    setOpen(true)
  }
  const closeSoon = (): void => {
    closeTimer.current = setTimeout(() => setOpen(false), 160)
  }
  useLayoutEffect(() => {
    if (!open) return
    const place = (): void => {
      const r = anchor.current?.getBoundingClientRect()
      if (r !== undefined)
        setPosition({
          left: Math.max(12, Math.min(r.right - 248, window.innerWidth - 260)),
          top: Math.max(100, r.top - 10),
          maxHeight: Math.max(80, r.top - 22),
        })
    }
    const outside = (event: PointerEvent): void => {
      const node = event.target as Node
      if (!anchor.current?.contains(node) && !panel.current?.contains(node)) setOpen(false)
    }
    const escape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        suppressFocusOpen.current = true
        setOpen(false)
        anchor.current?.querySelector('button')?.focus()
        queueMicrotask(() => {
          suppressFocusOpen.current = false
        })
      }
    }
    place()
    if (quota === null || Date.now() - Date.parse(quota.fetchedAt) > 120_000) void refresh()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [open])
  const buckets = quota?.buckets.filter((bucket) => bucket.id.startsWith('gemini-')) ?? []
  const five = buckets.find((bucket) => bucket.id === 'gemini-5h')?.remainingPercent
  const week = buckets.find((bucket) => bucket.id === 'gemini-weekly')?.remainingPercent
  const circle = (radius: number, value: number | null | undefined, className?: string): ReactNode =>
    h('circle', {
      cx: 12,
      cy: 12,
      r: radius,
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.8,
      pathLength: 100,
      strokeDasharray: `${value ?? 0} 100`,
      strokeLinecap: 'round',
      transform: 'rotate(-90 12 12)',
      className,
    })
  const label =
    quota === null
      ? '查看会员额度'
      : `会员额度：五小时剩余 ${five?.toFixed(1) ?? '未知'}%，周额度剩余 ${week?.toFixed(1) ?? '未知'}%`
  return h(
    'span',
    { ref: anchor, className: css.anchor, onMouseEnter: keepOpen, onMouseLeave: closeSoon },
    h(
      'button',
      {
        type: 'button',
        className: css.trigger,
        'aria-label': label,
        'aria-expanded': open,
        'aria-controls': open ? id : undefined,
        onClick: () => {
          clearTimeout(closeTimer.current)
          setOpen((value) => !value)
        },
        onFocus: () => {
          if (!suppressFocusOpen.current) keepOpen()
        },
        onBlur: (event: { relatedTarget: EventTarget | null }) => {
          if (!panel.current?.contains(event.relatedTarget as Node)) closeSoon()
        },
      },
      h(
        'svg',
        { viewBox: '0 0 24 24', className: css.gauge, 'aria-hidden': true },
        h('circle', {
          cx: 12,
          cy: 12,
          r: 10,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.8,
          className: css.track,
        }),
        h('circle', {
          cx: 12,
          cy: 12,
          r: 6.5,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.8,
          className: css.track,
        }),
        circle(10, five),
        circle(6.5, week, css.week),
        h('path', { d: 'M12 9.5 14.5 12 12 14.5 9.5 12Z', fill: 'currentColor', opacity: 0.5 }),
      ),
    ),
    open
      ? createPortal(
          h(
            'div',
            {
              ref: panel,
              id,
              role: 'dialog',
              'aria-label': '会员额度详情',
              className: css.panel,
              style: { left: position.left, top: position.top, maxHeight: position.maxHeight },
              onMouseEnter: keepOpen,
              onMouseLeave: closeSoon,
              onFocus: keepOpen,
              onBlur: (event: { relatedTarget: EventTarget | null }) => {
                if (
                  !panel.current?.contains(event.relatedTarget as Node) &&
                  !anchor.current?.contains(event.relatedTarget as Node)
                )
                  closeSoon()
              },
            },
            h(
              'div',
              { className: css.header },
              h(
                'div',
                { className: css.heading },
                h('span', { className: css.title }, '会员额度'),
                h('span', { className: css.muted }, quota?.plan ?? 'Antigravity'),
              ),
              h(
                'div',
                { className: css.account, title: quota?.account ?? undefined },
                quota?.account ?? (busy ? '正在读取账号…' : '账号信息未提供'),
              ),
            ),
            error ? h('p', { role: 'alert', className: css.error }, '暂时无法刷新，以下为上次读取结果。') : null,
            quota === null
              ? h('p', { className: css.muted }, busy ? '正在读取官方额度…' : '暂无额度数据，请点击刷新')
              : buckets.map((bucket) =>
                  h(
                    'div',
                    { key: bucket.id, className: css.row },
                    h(
                      'div',
                      { className: css.summary },
                      h(
                        'span',
                        null,
                        bucket.id === 'gemini-5h' ? '五小时额度' : bucket.id === 'gemini-weekly' ? '周额度' : bucket.id,
                      ),
                      h(
                        'span',
                        { className: css.value },
                        bucket.disabled
                          ? '不可用'
                          : bucket.remainingPercent === null
                            ? '未知'
                            : `剩余 ${bucket.remainingPercent.toFixed(2)}%`,
                      ),
                    ),
                    h(
                      'div',
                      { className: css.bar },
                      h('div', {
                        className: css.fill,
                        style: { width: `${bucket.disabled ? 0 : (bucket.remainingPercent ?? 0)}%` },
                      }),
                    ),
                    h(
                      'div',
                      { className: css.reset },
                      '重置：',
                      bucket.resetTime === null
                        ? '未知'
                        : new Date(bucket.resetTime).toLocaleString('zh-CN', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          }),
                    ),
                  ),
                ),
            h(
              'div',
              { className: css.footer },
              h(
                'span',
                { className: css.muted },
                quota === null
                  ? '官方 CLI 状态行'
                  : `读取于 ${new Date(quota.fetchedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}`,
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: css.refresh,
                  disabled: busy,
                  onClick: () => {
                    void refresh(true)
                  },
                },
                busy ? '刷新中…' : '刷新额度',
              ),
            ),
          ),
          document.body,
        )
      : null,
  )
}
