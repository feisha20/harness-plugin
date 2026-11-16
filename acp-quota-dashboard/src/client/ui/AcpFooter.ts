import { createElement as h } from 'react'
import { AcpUsageFooter, type AcpUsageFooterProps } from './AcpUsageFooter.ts'
import { AcpProgressNotice, type AcpProgressNoticeProps } from './AcpProgressNotice.ts'
import css from './AcpRecoveryDock.module.css'

/** 异常入口和已有统计共享一行，窄屏允许自然换行。 */
export function AcpFooter(props: AcpUsageFooterProps & AcpProgressNoticeProps) {
  return h('div', { className: css.footerStats }, h(AcpUsageFooter, props), h(AcpProgressNotice, props))
}
