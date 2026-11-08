import { createElement as h, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Button, IconRefreshOutlineMedium, Tag } from '@deepseek-ai/dsh-client-ui-primitives'
import type { QuotaView } from '../../contract/quota.ts'
import type { AcpLocaleKey } from './locales.ts'
import type { AcpTranslate } from './AcpSection.ts'
import css from './QuotaCard.module.css'

const BUCKET_KEY_MAP: Record<string, AcpLocaleKey> = {
  'gemini-5h': 'quotaBucketGemini5h',
  'gemini-weekly': 'quotaBucketGeminiWeekly',
  '3p-5h': 'quotaBucket3p5h',
  '3p-weekly': 'quotaBucket3pWeekly',
  'codex-primary': 'quotaBucketCodexPrimary',
  'codex-secondary': 'quotaBucketCodexSecondary',
}

/** 手动与自动查询官方会员额度；旧数据保留时间戳，失败不会把未知额度显示为零。 */
export function QuotaCard({ read, t }: { read(): Promise<QuotaView>; t: AcpTranslate }): ReactNode {
  const [value, setValue] = useState<QuotaView | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const generation = useRef(0)

  const refresh = async (): Promise<void> => {
    const current = ++generation.current
    setBusy(true)
    setError(null)
    try {
      const result = await read()
      if (generation.current === current) setValue(result)
    } catch {
      if (generation.current === current) setError(t('quotaError'))
    } finally {
      if (generation.current === current) setBusy(false)
    }
  }

  useEffect(() => {
    void refresh()
    return () => {
      generation.current += 1
    }
  }, [])

  return h(
    'section',
    { className: css.card, 'aria-label': t('quotaTitle') },
    h(
      'div',
      { className: css.header },
      h(
        'div',
        { className: css.headerIdentity },
        h('span', { className: css.title }, t('quotaTitle')),
        value?.plan ? h(Tag, { tone: 'info' }, value.plan) : null,
        value?.account
          ? h(
              'span',
              { className: css.account, title: value.account },
              t('quotaAccountLabel', { account: value.account }),
            )
          : null,
      ),
      h(
        'div',
        { className: css.actions },
        h(
          Button,
          {
            variant: 'outline',
            size: 'sm',
            disabled: busy,
            onClick: () => {
              void refresh()
            },
            className: css.refreshButton,
          },
          h(IconRefreshOutlineMedium, {
            className: busy ? css.refreshIconSpin : css.refreshIcon,
          }),
          t(busy ? 'quotaRefreshing' : 'quotaRefresh'),
        ),
      ),
    ),
    h('p', { className: css.hint }, t('quotaHint')),
    error === null ? null : h('p', { role: 'alert', className: css.error }, error),
    value === null
      ? !busy
        ? h('p', { className: css.hint }, t('quotaNotQueried'))
        : null
      : h(
          'div',
          { className: css.grid, 'aria-live': 'polite' },
          ...value.buckets.map((bucket) => {
            const mappedKey = BUCKET_KEY_MAP[bucket.id]
            const label = bucket.label ?? (mappedKey !== undefined ? t(mappedKey) : bucket.id)
            const percent = bucket.remainingPercent
            const isLow = percent !== null && percent <= 25 && percent > 10
            const isCritical = percent !== null && percent <= 10
            const valueClass = bucket.disabled
              ? css.valueDisabled
              : isCritical
                ? css.valueError
                : isLow
                  ? css.valueWarn
                  : css.valueNormal
            const progressClass = isCritical
              ? css.progressError
              : isLow
                ? css.progressWarn
                : css.progressNormal

            const valueText = bucket.disabled
              ? t('quotaDisabled')
              : percent !== null
                ? t('quotaRemainingPercent', { percent: percent.toFixed(2) })
                : bucket.remainingAmount !== null
                  ? t('quotaRemainingAmount', { amount: String(bucket.remainingAmount) })
                  : t('quotaRemainingUnknown')

            const resetText =
              bucket.resetTime === null
                ? t('quotaResetUnknown')
                : t('quotaResetTime', { time: new Date(bucket.resetTime).toLocaleString('zh-CN') })

            return h(
              'div',
              { key: bucket.id, className: css.bucketCard },
              h(
                'div',
                { className: css.bucketHeader },
                h('span', { className: css.bucketLabel, title: label }, label),
                h('span', { className: `${css.bucketValue} ${valueClass}` }, valueText),
              ),
              percent === null || bucket.disabled
                ? null
                : h(
                    'div',
                    { className: css.progressTrack },
                    h('div', {
                      className: `${css.progressBar} ${progressClass}`,
                      style: { width: `${Math.max(0, Math.min(100, percent))}%` },
                    }),
                  ),
              h('div', { className: css.bucketFooter }, h('span', { className: css.resetTime }, resetText)),
            )
          }),
        ),
    value === null
      ? null
      : h(
          'div',
          { className: css.metaFooter },
          h(
            'p',
            { className: css.metaText },
            t('quotaReadTime', { time: new Date(value.fetchedAt).toLocaleString('zh-CN') }),
          ),
          h('p', { className: css.metaText }, t('quotaDisclaimer')),
        ),
  )
}
