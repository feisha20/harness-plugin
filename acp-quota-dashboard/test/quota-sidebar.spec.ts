import { expect, it } from 'vitest'
import { formatQuotaPercent, quotaPercent } from '../src/client/ui/QuotaSidebar.ts'
import type { QuotaBucket } from '../src/contract/quota.ts'
it('额度缺报、停用和非法值不伪造为零，真实零值保留', () => {
  const bucket = { id: 'x', remainingPercent: 0, disabled: false } as QuotaBucket
  expect(quotaPercent(bucket)).toBe(0)
  expect(quotaPercent(undefined)).toBeNull()
  expect(quotaPercent({ ...bucket, disabled: true })).toBeNull()
  expect(quotaPercent({ ...bucket, remainingPercent: NaN })).toBeNull()
  expect(quotaPercent({ ...bucket, remainingPercent: 120 })).toBe(100)
})

it.each([
  [97.88594, '97.89%'],
  [0.001, '<0.01%'],
  [99.999, '>99.99%'],
  [0, '0%'],
  [100, '100%'],
])('剩余额度 %s 显示为 %s', (percent, display) => {
  expect(formatQuotaPercent(percent)).toBe(display)
})
