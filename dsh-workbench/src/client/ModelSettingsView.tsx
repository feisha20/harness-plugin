import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { defaultModelSettings, sameModel, type ModelCatalogProvider, type ModelRoute, type ModelSettings } from '../shared/types.ts'
import { IconCheck } from './Icons.tsx'

const endpoint = '/api/workbench/model-settings'
const optionValue = (route: ModelRoute | null) => route ? JSON.stringify([route.provider, route.model]) : ''

interface FlatOption {
  value: string
  label: string
  sublabel?: string
  group?: string
  unavailable?: boolean
}

interface ModelDropdownProps {
  id: string
  labelId: string
  value: string
  options: FlatOption[]
  disabled: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onChange: (value: string) => void
}

function ModelDropdown({
  id,
  labelId,
  value,
  options,
  disabled,
  open,
  onOpenChange,
  onChange,
}: ModelDropdownProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({})

  const selectedIndex = useMemo(
    () => Math.max(0, options.findIndex(opt => opt.value === value)),
    [options, value],
  )
  const selectedOption = options[selectedIndex] || options[0]

  useEffect(() => {
    if (disabled && open) {
      onOpenChange(false)
    }
  }, [disabled, open, onOpenChange])

  useEffect(() => {
    if (!open) return
    setHighlightedIndex(selectedIndex)
  }, [open, selectedIndex])

  useLayoutEffect(() => {
    if (!open) return
    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      const margin = 12
      const spaceBelow = viewportHeight - rect.bottom - margin
      const spaceAbove = rect.top - margin
      const openUpward = spaceBelow < 220 && spaceAbove > spaceBelow
      const maxHeight = Math.min(320, Math.max(140, (openUpward ? spaceAbove : spaceBelow) - 6))
      const width = Math.min(Math.max(rect.width, 260), viewportWidth - margin * 2)
      const left = Math.min(Math.max(margin, rect.left), viewportWidth - width - margin)

      setMenuStyle(
        openUpward
          ? {
              position: 'fixed',
              left: `${left}px`,
              bottom: `${viewportHeight - rect.top + 6}px`,
              width: `${width}px`,
              maxHeight: `${maxHeight}px`,
            }
          : {
              position: 'fixed',
              left: `${left}px`,
              top: `${rect.bottom + 6}px`,
              width: `${width}px`,
              maxHeight: `${maxHeight}px`,
            },
      )
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, options.length])

  useLayoutEffect(() => {
    if (!open || highlightedIndex < 0) return
    optionRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' })
  }, [open, highlightedIndex])

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return
      onOpenChange(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open, onOpenChange])

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onOpenChange(true)
      }
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      onOpenChange(false)
      triggerRef.current?.focus()
      return
    }

    if (event.key === 'Tab') {
      onOpenChange(false)
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedIndex(prev => (prev + 1) % options.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedIndex(prev => (prev - 1 + options.length) % options.length)
      return
    }

    if (event.key === 'Home') {
      event.preventDefault()
      setHighlightedIndex(0)
      return
    }

    if (event.key === 'End') {
      event.preventDefault()
      setHighlightedIndex(options.length - 1)
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      const chosen = options[highlightedIndex]
      if (chosen) {
        onChange(chosen.value)
        onOpenChange(false)
        triggerRef.current?.focus()
      }
    }
  }

  return (
    <div ref={rootRef} className="wr-select-root" onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={`wr-select-trigger${open ? ' is-open' : ''}`}
        aria-labelledby={`${labelId} ${id}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => !disabled && onOpenChange(!open)}
      >
        <span className="wr-select-trigger-content">
          <span className="wr-select-trigger-label">{selectedOption?.label}</span>
          {selectedOption?.sublabel && (
            <span className="wr-select-trigger-sublabel">({selectedOption.sublabel})</span>
          )}
          {selectedOption?.unavailable && (
            <span className="wr-select-badge-unavailable">当前不可用</span>
          )}
        </span>
        <svg
          className={`wr-select-chevron${open ? ' is-open' : ''}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          className="wr-select-popover"
          role="listbox"
          aria-labelledby={labelId}
          style={menuStyle}
        >
          {options.map((opt, index) => {
            const prevGroup = index > 0 ? options[index - 1]?.group : undefined
            const showGroupHeader = Boolean(opt.group && opt.group !== prevGroup)
            const showDivider = index > 0 && opt.group !== prevGroup
            const isSelected = opt.value === value
            const isHighlighted = index === highlightedIndex

            return (
              <React.Fragment key={opt.value || '__default__'}>
                {showDivider && <div className="wr-select-divider" role="separator" />}
                {showGroupHeader && (
                  <div className="wr-select-group-header" role="presentation">
                    {opt.group}
                  </div>
                )}
                <button
                  ref={el => {
                    optionRefs.current[index] = el
                  }}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`wr-select-option${isSelected ? ' is-selected' : ''}${isHighlighted ? ' is-highlighted' : ''}`}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => {
                    onChange(opt.value)
                    onOpenChange(false)
                    triggerRef.current?.focus()
                  }}
                >
                  <span className="wr-select-option-content">
                    <span className="wr-select-option-label">{opt.label}</span>
                    {opt.sublabel && (
                      <span className="wr-select-option-sublabel">({opt.sublabel})</span>
                    )}
                    {opt.unavailable && (
                      <span className="wr-select-badge-unavailable">当前不可用</span>
                    )}
                  </span>
                  <span className="wr-select-option-check" aria-hidden="true">
                    {isSelected && <IconCheck size={14} color="currentColor" />}
                  </span>
                </button>
              </React.Fragment>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function ModelSettingsView() {
  const baseId = useId()
  const [catalog, setCatalog] = useState<ModelCatalogProvider[] | null>(null)
  const [saved, setSaved] = useState(defaultModelSettings)
  const [draft, setDraft] = useState(defaultModelSettings)
  const [revision, setRevision] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [openSlot, setOpenSlot] = useState<keyof ModelSettings | null>(null)
  const duplicate = draft.primary !== null && sameModel(draft.primary, draft.fallback)
  const changed = !sameModel(draft.primary, saved.primary) || !sameModel(draft.fallback, saved.fallback)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    setNotice('')
    void (async () => {
      try {
        const res = await fetch(endpoint, { signal: controller.signal })
        if (!res.ok) throw new Error('读取模型设置失败')
        const data = await res.json() as { settings: ModelSettings; catalog: ModelCatalogProvider[] }
        if (controller.signal.aborted) return
        setCatalog(data.catalog)
        setSaved(data.settings)
        setDraft(data.settings)
      } catch {
        if (!controller.signal.aborted) setError('读取模型设置失败，请重试')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    })()
    return () => controller.abort()
  }, [revision])

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!changed || duplicate || loading || saving) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '保存模型设置失败')
      setSaved(data)
      setDraft(data)
      setNotice('模型设置已保存')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '保存模型设置失败')
    } finally {
      setSaving(false)
    }
  }

  function select(slot: keyof ModelSettings, value: string) {
    const route = value ? JSON.parse(value) as [string, string] : null
    setDraft(previous => ({ ...previous, [slot]: route ? { provider: route[0], model: route[1] } : null }))
    setNotice('')
    setError('')
  }

  return (
    <section className="wr-model-settings" aria-labelledby="wr-model-settings-title">
      <style>{`
        .wr-model-settings { overflow-y:auto; padding:1px; font-size:13px; color:var(--dsh-color-text-primary,#0f172a); }
        .wr-model-settings form { max-width:760px; box-sizing:border-box; background:var(--dsh-color-bg-canvas,#ffffff); border:1px solid var(--dsh-color-border-subtle,#e2e8f0); border-radius:8px; padding:18px 20px; box-shadow:0 1px 3px rgba(0,0,0,0.02); }
        .wr-model-settings h2 { font-size:16px; font-weight:600; margin:0 0 6px; color:var(--dsh-color-text-primary,#0f172a); }
        .wr-model-settings p { margin:6px 0 12px; color:var(--dsh-color-text-secondary,#64748b); line-height:1.5; }
        .wr-model-settings .wr-model-fields { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr)); gap:16px; margin:18px 0; }
        .wr-model-settings .wr-model-field { display:grid; gap:6px; min-width:0; align-content:start; }
        .wr-model-settings .wr-model-label { font-size:13px; font-weight:600; color:var(--dsh-color-text-primary,#0f172a); cursor:pointer; user-select:none; }
        .wr-model-settings .wr-select-root { position:relative; min-width:0; }
        .wr-model-settings .wr-select-trigger {
          width:100%;
          min-height:36px;
          box-sizing:border-box;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:8px;
          padding:7px 10px 7px 12px;
          font:inherit;
          font-size:13px;
          font-weight:500;
          color:var(--dsh-color-text-primary,#0f172a);
          background:var(--dsh-color-bg-canvas,#ffffff);
          border:1px solid var(--dsh-color-border,#cbd5e1);
          border-radius:6px;
          cursor:pointer;
          text-align:left;
          transition:border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
        }
        .wr-model-settings .wr-select-trigger:hover:not(:disabled) {
          border-color:var(--dsh-color-text-muted,#94a3b8);
          background:var(--dsh-color-bg-subtle,#f8fafc);
        }
        .wr-model-settings .wr-select-trigger.is-open,
        .wr-model-settings .wr-select-trigger:focus-visible {
          outline:none;
          border-color:var(--dsh-color-text-primary,#242424);
          box-shadow:0 0 0 3px rgba(15,23,42,0.06);
          background:var(--dsh-color-bg-canvas,#ffffff);
        }
        .wr-model-settings .wr-select-trigger:disabled {
          opacity:0.55;
          cursor:not-allowed;
        }
        .wr-model-settings .wr-select-trigger-content {
          display:flex;
          align-items:baseline;
          gap:6px;
          min-width:0;
          flex:1;
          overflow:hidden;
          white-space:nowrap;
          text-overflow:ellipsis;
        }
        .wr-model-settings .wr-select-trigger-label {
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
        }
        .wr-model-settings .wr-select-trigger-sublabel {
          font-size:12px;
          font-weight:400;
          color:var(--dsh-color-text-secondary,#64748b);
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
          flex-shrink:1;
        }
        .wr-model-settings .wr-select-chevron {
          flex-shrink:0;
          color:var(--dsh-color-text-secondary,#64748b);
          transition:transform 0.15s ease;
        }
        .wr-model-settings .wr-select-chevron.is-open {
          transform:rotate(180deg);
          color:var(--dsh-color-text-primary,#0f172a);
        }
        .wr-model-settings .wr-select-popover {
          box-sizing:border-box;
          z-index:1200;
          padding:5px;
          background:var(--dsh-color-bg-canvas,#ffffff);
          border:1px solid var(--dsh-color-border-subtle,#e2e8f0);
          border-radius:8px;
          box-shadow:0 10px 25px -5px rgba(15,23,42,0.12), 0 4px 10px -2px rgba(15,23,42,0.06);
          overflow-y:auto;
          overscroll-behavior:contain;
          scrollbar-width:thin;
          scrollbar-color:#cbd5e1 transparent;
        }
        .wr-model-settings .wr-select-divider {
          height:1px;
          margin:4px 4px;
          background:var(--dsh-color-border-subtle,#f1f5f9);
        }
        .wr-model-settings .wr-select-group-header {
          padding:6px 10px 4px;
          font-size:11px;
          font-weight:600;
          color:var(--dsh-color-text-muted,#94a3b8);
          letter-spacing:0.01em;
          line-height:1.4;
          user-select:none;
        }
        .wr-model-settings .wr-select-option {
          width:100%;
          box-sizing:border-box;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:8px;
          padding:7px 10px;
          border:0;
          border-radius:6px;
          background:transparent;
          color:var(--dsh-color-text-primary,#0f172a);
          font:inherit;
          font-size:13px;
          font-weight:400;
          line-height:1.4;
          text-align:left;
          cursor:pointer;
          transition:background-color 0.1s ease, color 0.1s ease;
        }
        .wr-model-settings .wr-select-option.is-highlighted,
        .wr-model-settings .wr-select-option:hover {
          background:var(--dsh-color-bg-subtle,#f1f5f9);
        }
        .wr-model-settings .wr-select-option.is-selected {
          font-weight:600;
          color:var(--dsh-color-text-primary,#0f172a);
          background:var(--dsh-color-bg-subtle,#f8fafc);
        }
        .wr-model-settings .wr-select-option.is-selected.is-highlighted,
        .wr-model-settings .wr-select-option.is-selected:hover {
          background:var(--dsh-color-bg-subtle,#f1f5f9);
        }
        .wr-model-settings .wr-select-option-content {
          display:flex;
          align-items:baseline;
          gap:6px;
          min-width:0;
          flex:1;
          overflow:hidden;
        }
        .wr-model-settings .wr-select-option-label {
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
        }
        .wr-model-settings .wr-select-option-sublabel {
          font-size:12px;
          font-weight:400;
          color:var(--dsh-color-text-secondary,#64748b);
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
          flex-shrink:1;
        }
        .wr-model-settings .wr-select-badge-unavailable {
          font-size:11px;
          font-weight:500;
          color:#d97706;
          background:#fffbeb;
          border:1px solid #fde68a;
          padding:1px 6px;
          border-radius:4px;
          flex-shrink:0;
        }
        .wr-model-settings .wr-select-option-check {
          display:inline-flex;
          align-items:center;
          justify-content:center;
          width:16px;
          height:16px;
          flex-shrink:0;
          color:var(--dsh-color-text-primary,#242424);
        }
        .wr-model-settings small { font-weight:400; font-size:12px; color:var(--dsh-color-text-secondary,#64748b); line-height:1.5; }
        .wr-model-settings .wr-model-actions { display:flex; flex-wrap:wrap; align-items:center; gap:10px; margin-top:4px; }
        .wr-model-settings .wr-model-btn {
          font:inherit;
          font-size:12px;
          font-weight:500;
          padding:7px 14px;
          min-width:0;
          color:var(--dsh-color-text-primary,#0f172a);
          background:var(--dsh-color-bg-canvas,#ffffff);
          border:1px solid var(--dsh-color-border,#cbd5e1);
          border-radius:6px;
          cursor:pointer;
          transition:background-color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
        }
        .wr-model-settings .wr-model-btn:hover:not(:disabled) {
          background:var(--dsh-color-bg-subtle,#f8fafc);
          border-color:var(--dsh-color-text-muted,#94a3b8);
        }
        .wr-model-settings .wr-model-btn:disabled {
          opacity:0.5;
          cursor:not-allowed;
        }
        .wr-model-settings .wr-model-btn-primary {
          background:var(--workbench-action-bg,#242424);
          color:var(--workbench-action-fg,#ffffff);
          border-color:transparent;
          box-shadow:0 1px 2px rgba(0,0,0,0.08);
        }
        .wr-model-settings .wr-model-btn-primary:hover:not(:disabled) {
          background:var(--workbench-action-bg,#242424);
          border-color:transparent;
          opacity:0.9;
        }
        .wr-model-settings .wr-model-notice {
          font-size:12px;
          color:var(--dsh-color-text-secondary,#64748b);
        }
      `}</style>
      <form onSubmit={save} aria-busy={loading || saving}>
        <h2 id="wr-model-settings-title">模型设置</h2>
        <p>用于同步时生成会话概要，以及重新整理日报、周报和月报。</p>
        <div className="wr-model-fields">
          {(['primary', 'fallback'] as const).map(slot => {
            const route = draft[slot]
            const missing = Boolean(
              route &&
                !catalog?.some(
                  provider =>
                    provider.id === route.provider &&
                    provider.models.some(model => model.id === route.model),
                ),
            )
            const primary = slot === 'primary'
            const triggerId = `${baseId}-${slot}-trigger`
            const labelId = `${baseId}-${slot}-label`

            const options: FlatOption[] = [
              {
                value: '',
                label: primary ? '使用 DSH 默认路由' : '不使用备用模型',
              },
            ]

            if (missing && route) {
              options.push({
                value: optionValue(route),
                label: route.model,
                unavailable: true,
              })
            }

            catalog
              ?.filter(provider => provider.models.length > 0)
              .forEach(provider => {
                provider.models.forEach(model => {
                  options.push({
                    value: optionValue({ provider: provider.id, model: model.id }),
                    label: model.name,
                    sublabel: model.name === model.id ? undefined : model.id,
                    group: provider.name,
                  })
                })
              })

            return (
              <div className="wr-model-field" key={slot}>
                <label
                  id={labelId}
                  htmlFor={triggerId}
                  className="wr-model-label"
                >
                  {primary ? '主模型' : '备用模型'}
                </label>
                <ModelDropdown
                  id={triggerId}
                  labelId={labelId}
                  value={optionValue(route)}
                  options={options}
                  disabled={loading || saving || !catalog}
                  open={openSlot === slot}
                  onOpenChange={nextOpen => setOpenSlot(nextOpen ? slot : null)}
                  onChange={val => select(slot, val)}
                />
                <small>{primary ? '每次整理时优先使用。' : '主模型调用失败或返回无效内容时尝试。'}</small>
              </div>
            )
          })}
        </div>
        {loading && <p role="status">正在读取 DSH 模型目录…</p>}
        {!loading && catalog?.every(provider => !provider.models.length) && <p>暂无可选模型，请检查 DSH 模型提供方配置。</p>}
        {catalog?.filter(provider => provider.error).map(provider => <p key={provider.id}>{provider.name} · {provider.error}</p>)}
        {duplicate && <p role="alert">主模型和备用模型需要使用不同的模型。</p>}
        {error && <p role="alert">{error}</p>}
        <div className="wr-model-actions">
          <button className="wr-model-btn wr-model-btn-primary" type="submit" disabled={!changed || duplicate || loading || saving}>{saving ? '保存中…' : '保存设置'}</button>
          <button className="wr-model-btn" type="button" disabled={loading || saving} onClick={() => setRevision(value => value + 1)}>重新加载</button>
          {notice && <span className="wr-model-notice" role="status">{notice}</span>}
        </div>
      </form>
    </section>
  )
}
