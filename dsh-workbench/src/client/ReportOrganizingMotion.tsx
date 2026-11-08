import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { VortexDisc } from './ReportVortex.tsx'
import { captureReport, intakeDuration, type IntakeSnapshot } from './ReportIntake.tsx'

const revealMs = 760
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function useReportOrganizingMotion() {
  const [phase, setPhase] = useState<'intake' | 'reveal' | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const [snapshot, setSnapshot] = useState<IntakeSnapshot | null>(null)
  const running = useRef(false)

  useEffect(() => {
    if (phase !== 'reveal') return
    const timer = window.setTimeout(() => setPhase(null), revealMs)
    return () => window.clearTimeout(timer)
  }, [phase])

  async function organize(request: () => Promise<void>) {
    if (running.current) return
    running.current = true
    const animated = !reducedMotion()
    const captured = animated && viewportRef.current ? captureReport(viewportRef.current) : null
    const start = performance.now()
    setSnapshot(captured)
    setPhase('intake')
    try {
      await request()
      const duration = intakeDuration(captured)
      const remaining = duration - (performance.now() - start)
      if (animated && remaining > 0) await new Promise(resolve => window.setTimeout(resolve, remaining))
      setPhase(animated ? 'reveal' : null)
    } catch (error) {
      setPhase(null)
      throw error
    } finally {
      setSnapshot(null)
      running.current = false
    }
  }

  return { organize, phase, snapshot, viewportRef }
}

const styles = `
  .wr-motion-stage {
    position: relative;
    flex: 1 0 auto;
    min-height: 320px;
    overflow: hidden;
    display: grid;
    justify-items: center;
    align-content: start;
    padding: calc(min(22vh, 158px) + 208px) 16px 16px;
    box-sizing: border-box;
    text-align: center;
    color: var(--dsh-color-text-primary, #0f172a);
  }
  .wr-motion-stage p { margin: 5px 0 8px; font-size: 12px; color: var(--dsh-color-text-secondary, #64748b); }
  .wr-motion-reveal { position: relative; min-width: 0; }
  .wr-vortex-scene, .wr-motion-core {
    position: absolute;
    top: min(22vh, 158px);
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    display: block;
  }
  .wr-vortex-scene { width: min(568px, 100%); height: auto; overflow: visible; }
  .wr-motion-core { width: min(208px, 62%); height: auto; }
  .wr-vortex-card { fill: var(--dsh-color-bg-canvas, #fff); stroke: #b68449; stroke-width: .7px; }
  .wr-vortex-label { fill: var(--dsh-color-text-secondary, #475569); }
  .wr-motion-reveal .wr-motion-core { top: calc(min(22vh, 158px) - 20px); animation: wr-motion-open 430ms ease-out both; z-index: 1; }
  @keyframes wr-motion-open {
    0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    100% { opacity: 0; transform: translate(-50%, -50%) scale(.2); }
  }
  @media (prefers-reduced-motion: reduce) {
    .wr-vortex-scene, .wr-motion-reveal .wr-motion-core { display: none; }
  }
`

export function ReportOrganizingReveal({ active, children }: { active: boolean; children: React.ReactNode }) {
  const content = useRef<HTMLDivElement>(null)
  const core = useRef<SVGSVGElement>(null)

  useLayoutEffect(() => {
    if (!active || reducedMotion() || !content.current || !core.current) return
    const center = core.current.getBoundingClientRect()
    const bounds = content.current.getBoundingClientRect()
    const viewportBottom = content.current.closest('[data-wr-report-viewport]')?.getBoundingClientRect().bottom ?? window.innerHeight
    const rows = [...content.current.querySelectorAll<HTMLElement>('[data-wr-report-row]')]
      .map(element => ({ element, box: element.getBoundingClientRect() }))
      .filter(({ box }) => box.bottom >= bounds.top && box.top < viewportBottom)
      .slice(0, 12)
    const animations = rows.map(({ element, box }, index) => {
      const x = center.left + center.width / 2 - box.left
      const y = center.top + center.height / 2 - box.top - box.height / 2
      return element.animate([
        { opacity: 0, transform: `translate(${x}px, ${y}px) scale(.06)`, transformOrigin: 'left center' },
        { opacity: .9, offset: .62 },
        { opacity: 1, transform: 'none', transformOrigin: 'left center' },
      ], { duration: 490, delay: index * 22, easing: 'cubic-bezier(.18,.8,.26,1)', fill: 'backwards' })
    })
    return () => animations.forEach(animation => animation.cancel())
  }, [active])

  return (
    <div ref={content} className={active ? 'wr-motion-reveal' : undefined}>
      {active && <><style>{styles}</style><svg ref={core} className="wr-motion-core" viewBox="-104 -104 208 208" aria-hidden="true"><VortexDisc /></svg></>}
      {children}
    </div>
  )
}
