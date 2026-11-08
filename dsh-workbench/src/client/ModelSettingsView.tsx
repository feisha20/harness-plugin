import React, { useEffect, useState } from 'react'
import { defaultModelSettings, sameModel, type ModelCatalogProvider, type ModelRoute, type ModelSettings } from '../shared/types.ts'

const endpoint = '/api/workbench/model-settings'
const optionValue = (route: ModelRoute | null) => route ? JSON.stringify([route.provider, route.model]) : ''

export function ModelSettingsView() {
  const [catalog, setCatalog] = useState<ModelCatalogProvider[] | null>(null)
  const [saved, setSaved] = useState(defaultModelSettings)
  const [draft, setDraft] = useState(defaultModelSettings)
  const [revision, setRevision] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
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
        .wr-model-settings { overflow-y:auto; padding:1px; font-size:13px; }
        .wr-model-settings form { max-width:760px; box-sizing:border-box; border:1px solid var(--dsh-color-border-subtle,#e2e8f0); border-radius:8px; padding:18px; }
        .wr-model-settings h2 { font-size:16px; margin:0 0 6px; }
        .wr-model-settings p { margin:6px 0 12px; color:var(--dsh-color-text-secondary,#64748b); line-height:1.5; }
        .wr-model-settings .wr-model-fields { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr)); gap:16px; margin:18px 0; }
        .wr-model-settings label { display:grid; gap:6px; min-width:0; align-content:start; font-weight:600; }
        .wr-model-settings select,.wr-model-settings button { font:inherit; padding:7px 10px; min-width:0; color:inherit; background:var(--dsh-color-bg-canvas,#fff); border:1px solid var(--dsh-color-border,#cbd5e1); border-radius:6px; }
        .wr-model-settings select:focus-visible { outline:2px solid var(--dsh-color-text-secondary,#777); outline-offset:2px; }
        .wr-model-settings small { font-weight:400; color:var(--dsh-color-text-secondary,#64748b); line-height:1.5; }
        .wr-model-settings button:disabled,.wr-model-settings select:disabled { opacity:.55; }
        .wr-model-settings .wr-model-actions { display:flex; flex-wrap:wrap; align-items:center; gap:10px; }
        .wr-model-settings button[type=submit] { background:var(--workbench-action-bg); color:var(--workbench-action-fg); border-color:transparent; }
      `}</style>
      <form onSubmit={save} aria-busy={loading || saving}>
        <h2 id="wr-model-settings-title">模型设置</h2>
        <p>用于同步时生成会话概要，以及重新整理日报、周报和月报。</p>
        <div className="wr-model-fields">
          {(['primary', 'fallback'] as const).map(slot => {
            const route = draft[slot]
            const missing = route && !catalog?.some(provider => provider.id === route.provider && provider.models.some(model => model.id === route.model))
            const primary = slot === 'primary'
            return (
              <label key={slot}>
                {primary ? '主模型' : '备用模型'}
                <select value={optionValue(route)} onChange={event => select(slot, event.target.value)} disabled={loading || saving || !catalog}>
                  <option value="">{primary ? '使用 DSH 默认路由' : '不使用备用模型'}</option>
                  {missing && <option value={optionValue(route)}>{route.model} · 当前不可用</option>}
                  {catalog?.filter(provider => provider.models.length > 0).map(provider => (
                    <optgroup key={provider.id} label={provider.name}>
                      {provider.models.map(model => (
                        <option key={model.id} value={optionValue({ provider: provider.id, model: model.id })}>
                          {model.name === model.id ? model.name : `${model.name}（${model.id}）`}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <small>{primary ? '每次整理时优先使用。' : '主模型调用失败或返回无效内容时尝试。'}</small>
              </label>
            )
          })}
        </div>
        {loading && <p role="status">正在读取 DSH 模型目录…</p>}
        {!loading && catalog?.every(provider => !provider.models.length) && <p>暂无可选模型，请检查 DSH 模型提供方配置。</p>}
        {catalog?.filter(provider => provider.error).map(provider => <p key={provider.id}>{provider.name} · {provider.error}</p>)}
        {duplicate && <p role="alert">主模型和备用模型需要使用不同的模型。</p>}
        {error && <p role="alert">{error}</p>}
        <div className="wr-model-actions">
          <button type="submit" disabled={!changed || duplicate || loading || saving}>{saving ? '保存中…' : '保存设置'}</button>
          <button type="button" disabled={loading || saving} onClick={() => setRevision(value => value + 1)}>重新加载</button>
          {notice && <span role="status">{notice}</span>}
        </div>
      </form>
    </section>
  )
}
