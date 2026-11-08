import React, { useLayoutEffect, useRef } from 'react'
import { VortexDisc } from './ReportVortex.tsx'

export const intakeMs = 2100
export const staggerMs = 440
const leadMs = 300
interface RowSnapshot { element: HTMLElement; index: number; x: number; y: number; width: number; sourceWidth: number; height: number }
export interface IntakeSnapshot { element: HTMLElement; rows: RowSnapshot[]; width: number; height: number; scroll: number; outerWidth: number; outerHeight: number; borderLeft: number; borderTop: number }

/** 在 React 切换等待状态之前冻结当前视口，包括滚动位置和换行。 */
export function captureReport(viewport: HTMLElement): IntakeSnapshot {
  const bounds = viewport.getBoundingClientRect()
  const element = viewport.cloneNode(true) as HTMLElement
  const originals = [viewport, ...viewport.querySelectorAll<HTMLElement>('*')]
  const copies = [element, ...element.querySelectorAll<HTMLElement>('*')]
  originals.forEach((source, index) => {
    const computed = getComputedStyle(source)
    for (const key of computed) copies[index].style.setProperty(key, computed.getPropertyValue(key))
    copies[index].removeAttribute('id')
  })
  const rows = [...viewport.querySelectorAll<HTMLElement>('[data-wr-report-row]')]
    .map((row, index) => {
      const range = document.createRange()
      range.selectNodeContents(row)
      return { row, index, box: row.getBoundingClientRect(), textBox: range.getBoundingClientRect() }
    })
    .filter(({ row, box }) => !row.querySelector('[data-wr-report-row]') && box.bottom > bounds.top && box.top < bounds.bottom)
    .slice(0, 12)
    .map(({ index, box, textBox }) => ({ index, element: element.querySelectorAll<HTMLElement>('[data-wr-report-row]')[index],
      x: box.left - bounds.left - viewport.clientLeft, y: box.top - bounds.top - viewport.clientTop, width: Math.min(box.width, Math.max(1, textBox.right - box.left)), sourceWidth: box.width, height: box.height }))
  return { element, rows, width: viewport.clientWidth, height: viewport.clientHeight, scroll: viewport.scrollTop, outerWidth: bounds.width, outerHeight: bounds.height, borderLeft: viewport.clientLeft, borderTop: viewport.clientTop }
}

export const intakeDuration = (snapshot: IntakeSnapshot | null) => snapshot?.rows.length
  ? leadMs + intakeMs + (snapshot.rows.length - 1) * staggerMs : 0

/** 每条切片从原文坐标出发；同一流场同时控制位移、旋转和卷曲。 */
export function intakePoint(x: number, y: number, along: number, progress: number) {
  const smooth = (value: number) => {
    const t = Math.max(0, Math.min(1, value))
    return t * t * t * (10 + t * (-15 + 6 * t))
  }
  const scale = (1 - smooth(progress)) ** 2.3
  // 对文字的每个位置使用同一个极坐标流场；内侧转得更快，外侧自然拖成弧线。
  // 屏幕坐标中正角度为顺时针，与光环的 SVG 旋转方向一致。
  const flow = (offset: number) => {
    const px = x + offset
    const originalRadius = Math.hypot(px, y)
    // 近端先被牵动，远端略微滞后，避免整句话同时缩放得像一根硬条。
    const lag = .16 * originalRadius / (180 + originalRadius)
    const pull = smooth((progress - lag) / (1 - lag))
    const radius = originalRadius * (1 - pull) ** 2.3
    const twist = Math.PI * 3 * pull ** 2.2 * (.25 + .75 * 100 / (100 + radius))
    const angle = Math.atan2(y, px) + twist
    return { x: radius * Math.cos(angle), y: radius * Math.sin(angle), twist, thickness: (1 - pull) ** 2.3 }
  }
  const point = flow(along)
  // 切片角度取实际曲线的切线，避免文字转角与移动方向脱节。
  const before = flow(along - .25)
  const after = flow(along + .25)
  const dx = (after.x - before.x) * 2
  const dy = (after.y - before.y) * 2
  const tangent = Math.atan2(dy, dx)
  const angle = tangent + Math.round((point.twist - tangent) / (2 * Math.PI)) * 2 * Math.PI
  const scaleX = Math.hypot(dx, dy)
  return { x: point.x, y: point.y, angle: progress === 0 ? 0 : angle * 180 / Math.PI,
    scale, scaleX, scaleY: point.thickness / Math.max(1, scaleX / Math.max(.001, point.thickness)) }

}

export function ReportIntake({ snapshot }: { snapshot: IntakeSnapshot | null }) {
  const host = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (!snapshot || !host.current) return
    const layer = host.current
    const page = snapshot.element
    Object.assign(page.style, { position: 'absolute', left: `${-snapshot.borderLeft}px`, top: `${-snapshot.borderTop}px`, margin: '0', width: `${snapshot.outerWidth}px`, height: `${snapshot.outerHeight}px`, overflow: 'hidden', pointerEvents: 'none' })
    page.setAttribute('aria-hidden', 'true')
    // 冻结子项尺寸，避免快照重新参与 flex 收缩导致底部滚动位置变化。
    for (const child of page.children) (child as HTMLElement).style.flexShrink = '0'
    const spacer = document.createElement('div')
    spacer.style.cssText = 'height:24px;flex-shrink:0'
    page.append(spacer)
    layer.prepend(page)
    page.scrollTop = snapshot.scroll
    const centerX = snapshot.width / 2
    const centerY = Math.min(snapshot.height / 2, 230)
    const rows = snapshot.rows.map(row => {
      const sliceCount = Math.max(24, Math.min(96, Math.ceil(row.width / 10)))
      const slices = Array.from({ length: sliceCount }, (_, index) => {
        const width = row.width / sliceCount
        const slice = document.createElement('div')
        slice.dataset.wrIntakeSlice = String(row.index)
        Object.assign(slice.style, { position: 'absolute', left: '0', top: '0', width: `${width + .5}px`, height: `${row.height}px`, overflow: 'hidden', transformOrigin: '50% 50%', opacity: '0', pointerEvents: 'none' })
        const copy = row.element.cloneNode(true) as HTMLElement
        Object.assign(copy.style, { position: 'absolute', margin: '0', left: `${-index * width}px`, top: '0', width: `${row.sourceWidth}px`, height: `${row.height}px` })
        slice.append(copy)
        layer.append(slice)
        return { slice, along: (index + .5) * width - row.width / 2, width }
      })
      return { ...row, slices, started: false, finished: false }
    })
    const start = performance.now()
    let frame = 0
    const animate = (now: number) => {
      const elapsed = now - start
      rows.forEach((row, index) => {
        const local = elapsed - leadMs - index * staggerMs
        if (local < 0 || row.finished) return // 未轮到的工作项保持原来的排版和文字。
        if (!row.started) {
          row.started = true
          row.element.style.opacity = '0'
          row.slices.forEach(({ slice }) => { slice.style.willChange = 'transform, opacity' })
        }
        if (local >= intakeMs) {
          row.finished = true
          row.slices.forEach(({ slice }) => slice.remove())
          return
        }
        const progress = Math.min(1, local / intakeMs)
        row.slices.forEach(({ slice, along, width }) => {
          const point = intakePoint(row.x + row.width / 2 - centerX, row.y + row.height / 2 - centerY, along, progress)
          slice.style.opacity = String(Math.min(1, (1 - progress) / .15))
          slice.style.transform = `translate(${centerX + point.x - width / 2}px, ${centerY + point.y - row.height / 2}px) rotate(${point.angle}deg) scale(${point.scaleX}, ${point.scaleY})`
        })
      })
      const fadeStart = leadMs + Math.max(0, rows.length - 1) * staggerMs
      page.style.opacity = String(Math.max(0, 1 - Math.max(0, elapsed - fadeStart) / 650))
      if (elapsed < intakeDuration(snapshot)) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => { cancelAnimationFrame(frame); page.remove(); spacer.remove(); rows.forEach(row => row.slices.forEach(({ slice }) => slice.remove())) }
  }, [snapshot])
  const centerY = Math.min((snapshot?.height ?? 460) / 2, 230)
  return <div ref={host} role="status" style={{ position: 'relative', margin: '-20px', width: snapshot?.width ?? 'calc(100% + 40px)', height: snapshot?.height ?? 460, flexShrink: 0, overflow: 'hidden' }}>
    <style>{`@keyframes wr-intake-status { from { opacity: 0 } to { opacity: 1 } } @media (prefers-reduced-motion: reduce) { .wr-intake-disc { display: none } }`}</style>
    <svg className="wr-intake-disc" viewBox="-104 -104 208 208" aria-hidden="true" style={{ position: 'absolute', zIndex: 1, width: 180, height: 180, left: '50%', top: centerY, transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}><VortexDisc /></svg>
    <div style={{ position: 'absolute', top: centerY + 125, left: 0, right: 0, textAlign: 'center', pointerEvents: 'none', animation: `wr-intake-status 500ms ${Math.max(0, intakeDuration(snapshot) - 500)}ms both` }}>
      <strong>AI 正在整理工作记录</strong><p style={{ fontSize: 12, color: 'var(--dsh-color-text-secondary, #64748b)' }}>模型完成后，报告会按新的顺序排好。</p>
    </div>
  </div>
}
