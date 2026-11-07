import { createElement as h, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import type { QuotaView } from '../../contract/quota.ts'
import css from './AcpSection.module.css'

const NAMES: Record<string, string> = {
  'gemini-5h': 'Gemini · 五小时额度',
  'gemini-weekly': 'Gemini · 周额度',
  '3p-5h': '第三方模型 · 五小时额度',
  '3p-weekly': '第三方模型 · 周额度',
}
/** 手动查询；旧数据保留时间戳，失败不会把未知额度显示为零。 */
export function QuotaCard({ read }: { read(): Promise<QuotaView> }): ReactNode {
  const [value, setValue] = useState<QuotaView | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const generation = useRef(0)
  useEffect(
    () => () => {
      generation.current += 1
    },
    [],
  )
  const refresh = async (): Promise<void> => {
    const current = ++generation.current
    setBusy(true)
    setError(null)
    try {
      const result = await read()
      if (generation.current === current) setValue(result)
    } catch {
      if (generation.current === current) setError('额度读取失败。请确认对应官方 CLI 已登录且网络可用，稍后重试。')
    } finally {
      if (generation.current === current) setBusy(false)
    }
  }
  return h(
    'section',
    { 'aria-label': '会员额度' },
    h('h3', null, '会员额度'),
    h('p', { className: css.hint }, '通过官方 CLI读取；不会发送模型请求。额度属于当前 CLI 登录账号。'),
    h(
      Button,
      {
        variant: 'outline',
        size: 'sm',
        disabled: busy,
        onClick: () => {
          void refresh()
        },
      },
      busy ? '正在读取额度…' : '刷新额度',
    ),
    error === null ? null : h('p', { role: 'alert', className: css.error }, error),
    value === null
      ? h('p', { className: css.hint }, '尚未查询额度')
      : h(
          'div',
          { 'aria-live': 'polite' },
          h('p', null, value.plan ?? '订阅类型未知'),
          h('p', { className: css.hint }, '额度账号：', value.account ?? '官方 CLI 未提供账号信息'),
          ...value.buckets.map((bucket) =>
            h(
              'div',
              { key: bucket.id },
              h(
                'p',
                null,
                bucket.label ?? NAMES[bucket.id] ?? bucket.id,
                '：',
                bucket.disabled
                  ? '不可用'
                  : bucket.remainingPercent !== null
                    ? `剩余 ${bucket.remainingPercent.toFixed(2)}%`
                    : bucket.remainingAmount !== null
                      ? `剩余 ${bucket.remainingAmount}`
                      : '剩余量未知',
              ),
              bucket.remainingPercent === null || bucket.disabled
                ? null
                : h('progress', {
                    max: 100,
                    value: bucket.remainingPercent,
                    'aria-label': bucket.label ?? NAMES[bucket.id] ?? bucket.id,
                  }),
              h(
                'p',
                { className: css.hint },
                '重置时间：',
                bucket.resetTime === null ? '未知' : new Date(bucket.resetTime).toLocaleString('zh-CN'),
              ),
            ),
          ),
          h('p', { className: css.hint }, `读取时间：${new Date(value.fetchedAt).toLocaleString('zh-CN')} · 官方 CLI`),
          h('p', { className: css.hint }, '第三方模型额度仅作账号信息展示，不代表此 ACP 客户端可调用这些模型。'),
        ),
  )
}
