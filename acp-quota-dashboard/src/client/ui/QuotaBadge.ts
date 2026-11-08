import { createElement as h, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { QuotaView } from '../../contract/quota.ts'
import type { AcpTranslate } from './AcpSection.ts'
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
  t,
}: PropsRuntime<'conversation.input.right'> &
  PropsLocale<'acpActivity'> & { wire: QuotaBadgeWire }): ReactNode {
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
  if (agentId === undefined || t === undefined) return null
  return h(LoadedBadge, { key: agentId, agentId, wire, t: t as AcpTranslate })
}

function LoadedBadge({
  agentId,
  wire,
  t,
}: {
  agentId: string
  wire: QuotaBadgeWire
  t: AcpTranslate
}): ReactNode {
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
  const buckets =
    quota?.buckets.filter((bucket) => bucket.id.startsWith('gemini-') || bucket.id.startsWith('codex-')) ?? []
  const five = buckets.find((bucket) => bucket.id === 'gemini-5h' || bucket.id === 'codex-primary')?.remainingPercent
  const week = buckets.find(
    (bucket) => bucket.id === 'gemini-weekly' || bucket.id === 'codex-secondary',
  )?.remainingPercent
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
  const isCodex = agentId.toLowerCase().includes('codex')
  const providerName = isCodex
    ? t('quotaProviderCodex')
    : agentId.toLowerCase().includes('antigravity')
      ? t('quotaProviderAntigravity')
      : t('quotaProviderOfficial')
  const label =
    quota === null
      ? t('quotaBadgeAriaView', { provider: providerName })
      : isCodex
        ? t('quotaBadgeAriaCodex', {
            primary: five !== null && five !== undefined ? five.toFixed(1) : t('quotaUnknown'),
            secondary: week !== null && week !== undefined ? week.toFixed(1) : t('quotaUnknown'),
          })
        : t('quotaBadgeAriaGemini', {
            five: five !== null && five !== undefined ? five.toFixed(1) : t('quotaUnknown'),
            week: week !== null && week !== undefined ? week.toFixed(1) : t('quotaUnknown'),
          })
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
              'aria-label': t('quotaBadgeDetailTitle'),
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
                h('span', { className: css.title }, t('quotaTitle')),
                h('span', { className: css.muted }, quota?.plan ?? providerName),
              ),
              h(
                'div',
                { className: css.account, title: quota?.account ?? undefined },
                quota?.account ?? (busy ? t('quotaBadgeReadingAccount') : t('quotaBadgeNoAccount')),
              ),
            ),
            error
              ? h(
                  'p',
                  { role: 'alert', className: css.error },
                  quota === null
                    ? t('quotaBadgeLoginRequired', { provider: providerName })
                    : t('quotaBadgeStaleResult'),
                )
              : null,
            quota === null
              ? h('p', { className: css.muted }, busy ? t('quotaBadgeReading') : t('quotaBadgeEmpty'))
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
                        bucket.label ??
                          (bucket.id === 'gemini-5h'
                            ? t('quotaBadge5h')
                            : bucket.id === 'gemini-weekly'
                              ? t('quotaBadgeWeekly')
                              : bucket.id),
                      ),
                      h(
                        'span',
                        { className: css.value },
                        bucket.disabled
                          ? t('quotaDisabled')
                          : bucket.remainingPercent === null
                            ? t('quotaUnknown')
                            : t('quotaRemainingPercent', { percent: bucket.remainingPercent.toFixed(2) }),
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
                      t('quotaBadgeResetPrefix', {
                        time:
                          bucket.resetTime === null
                            ? t('quotaUnknown')
                            : new Date(bucket.resetTime).toLocaleString('zh-CN', {
                                month: 'numeric',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                              }),
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
                  ? t('quotaBadgeOfficialCliQuery', { provider: providerName })
                  : t('quotaBadgeReadAt', {
                      time: new Date(quota.fetchedAt).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      }),
                    }),
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
                t(busy ? 'quotaRefreshing' : 'quotaRefresh'),
              ),
            ),
          ),
          document.body,
        )
      : null,
  )
}
