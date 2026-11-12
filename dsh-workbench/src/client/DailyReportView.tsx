import React, { useState, useEffect, useCallback, useRef } from 'react'
import type { DailyInsight, DailyReport, Task } from '../shared/types.ts'
import { copyReport } from '../shared/reportClipboard.ts'
import { ReportEngine, normalizeDailyReport, applyDailyInsight, needsDailyInsight, recordDay } from '../shared/reportEngine.ts'
import { MarkdownRenderer } from './MarkdownRenderer.tsx'
import { ReportOrganizingReveal, useReportOrganizingMotion } from './ReportOrganizingMotion.tsx'
import { ReportIntake } from './ReportIntake.tsx'
import {
  IconRefresh,
  IconEdit,
  IconPreview,
  IconSave,
  IconCopy,
  IconCheck,
  IconAlertCircle,
  IconSync,
} from './Icons.tsx'

interface DailyReportViewProps {
  tasks: Task[]
  currentDay: string
  dailyReports: Record<string, DailyReport>
  onFetchDailyReport: (day: string, regenerate?: boolean) => Promise<DailyReport>
  onSaveDailyReport: (report: DailyReport) => Promise<void>
  onGenerateInsight: (day: string) => Promise<DailyInsight>
}

export function DailyReportView({
  tasks,
  currentDay,
  dailyReports,
  onFetchDailyReport,
  onSaveDailyReport,
  onGenerateInsight,
}: DailyReportViewProps) {
  const [selectedDay, setSelectedDay] = useState(currentDay)
  const [report, setReport] = useState<DailyReport | null>(dailyReports[selectedDay] || null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedMarkdown, setEditedMarkdown] = useState(
    dailyReports[selectedDay]?.summaryMarkdown || '',
  )
  const [copySuccess, setCopySuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { phase, organize, snapshot, viewportRef } = useReportOrganizingMotion()
  const [loadError, setLoadError] = useState<string | null>(null)
  const [generatedInsight, setGeneratedInsight] = useState<DailyInsight | null>(null)
  const [insightError, setInsightError] = useState<string | null>(null)
  const [insightLoading, setInsightLoading] = useState(false)
  const busy = loading || phase !== null || insightLoading
  const insightRequested = useRef<string | null>(null)
  const insightSeq = useRef(0)

  // 1. Sync report if dailyReports changes externally (e.g. initial snapshot arrives or background sync)
  useEffect(() => {
    const cached = dailyReports[selectedDay]
    if (cached && !isEditing) {
      setReport(cached)
      setEditedMarkdown(cached.summaryMarkdown)
    }
  }, [dailyReports, selectedDay, isEditing])

  // 2. Load report when selected day changes and not in cache
  useEffect(() => {
    const cached = dailyReports[selectedDay]
    if (cached) {
      setReport(cached)
      setEditedMarkdown(cached.summaryMarkdown)
      setLoading(false)
      setLoadError(null)
      return
    }

    let active = true
    setLoading(true)
    setLoadError(null)

    onFetchDailyReport(selectedDay)
      .then((res) => {
        if (active) {
          setReport(res)
          setEditedMarkdown(res.summaryMarkdown)
        }
      })
      .catch((err: unknown) => {
        if (active) {
          console.error('Failed to load daily report:', err)
          setLoadError(err instanceof Error ? err.message : String(err))
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [selectedDay, onFetchDailyReport])

  // Computed synthesized markdown if not manually edited
  const synthesizedReport = ReportEngine.generateDailyReport(selectedDay, tasks)
  const currentReport = report?.day === selectedDay ? report : dailyReports[selectedDay]
  const insight = currentReport?.aiInsight ?? generatedInsight
  const baseMarkdown = currentReport?.isEdited
    ? (currentReport.summaryMarkdown || '')
    : currentReport?.aiOrganized
      ? normalizeDailyReport(currentReport.summaryMarkdown || '')
      : synthesizedReport.summaryMarkdown
  const currentMarkdown = insight && !currentReport?.isEdited
    ? applyDailyInsight(baseMarkdown, insight)
    : baseMarkdown

  useEffect(() => {
    insightSeq.current += 1
    setGeneratedInsight(null)
    setInsightError(null)
    setInsightLoading(false)
    insightRequested.current = null
  }, [selectedDay])

  const requestInsight = useCallback(async () => {
    const seq = ++insightSeq.current
    insightRequested.current = selectedDay
    setInsightLoading(true)
    setInsightError(null)
    try {
      const result = await onGenerateInsight(selectedDay)
      if (seq === insightSeq.current) setGeneratedInsight(result)
    } catch (err: unknown) {
      if (seq === insightSeq.current) setInsightError(err instanceof Error ? err.message : String(err))
    } finally {
      if (seq === insightSeq.current) setInsightLoading(false)
    }
  }, [onGenerateInsight, selectedDay])

  // 打开任意日期的日报时，若商业价值或明日计划仍是占位内容，自动让 AI 根据当天记录归纳一次。
  useEffect(() => {
    if (loading || isEditing || !currentReport || currentReport.isEdited) return
    if (currentReport.aiInsight || generatedInsight) return
    if (!needsDailyInsight(currentMarkdown)) return
    if (!tasks.some(task => recordDay(task) === selectedDay)) return
    if (insightRequested.current === selectedDay) return
    void requestInsight()
  }, [loading, isEditing, currentReport, selectedDay, generatedInsight, currentMarkdown, tasks, requestInsight])

  const handleRegenerate = async () => {
    if (isEditing && !window.confirm('AI 重新整理会替换当前报告，未保存的修改将丢失，是否继续？')) return
    setLoadError(null)
    try {
      await organize(async () => {
        const res = await onFetchDailyReport(selectedDay, true)
        setReport(res)
        setEditedMarkdown(res.summaryMarkdown)
        setIsEditing(false)
        insightSeq.current += 1
        setGeneratedInsight(null)
        setInsightError(null)
        insightRequested.current = null
      })
    } catch (err: unknown) {
      console.error('Failed to regenerate daily report:', err)
      setLoadError(err instanceof Error ? err.message : String(err))
    }
  }

  const handleRetryInsight = () => {
    insightRequested.current = null
    void requestInsight()
  }

  const handleStartEdit = () => {
    setEditedMarkdown(currentMarkdown)
    setIsEditing(true)
  }

  const handleSave = async () => {
    const base = currentReport || synthesizedReport
    const updated: DailyReport = {
      ...base,
      summaryMarkdown: editedMarkdown,
      isEdited: true,
    }
    await onSaveDailyReport(updated)
    setReport(updated)
    setIsEditing(false)
  }

  const handleCopy = async () => {
    setCopySuccess(false)
    try {
      await copyReport(currentMarkdown)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch {
      setLoadError('复制失败，请检查剪贴板权限后重试。')
    }
  }

  // Quick workday dates
  const quickDays = [0, -1, -2, -3].map((offset) => {
    const d = new Date()
    d.setDate(d.getDate() + offset)
    const key = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d)
    const label = offset === 0 ? '今日' : offset === -1 ? '昨日' : offset === -2 ? '前天' : key
    return { key, label }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      {/* Top Action & Date Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 16px',
          backgroundColor: 'var(--dsh-color-bg-subtle, #f8fafc)',
          borderRadius: '8px',
          border: '1px solid var(--dsh-color-border-subtle, #e2e8f0)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dsh-color-text-secondary, #475569)' }}>
            选择日期：
          </span>
          {quickDays.map((q) => (
            <button
              key={q.key}
              disabled={busy}
              onClick={() => setSelectedDay(q.key)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: selectedDay === q.key ? 'var(--dsh-color-text-primary, #242424)' : 'var(--dsh-color-border, #cbd5e1)',
                backgroundColor: selectedDay === q.key ? 'var(--dsh-color-bg-subtle, #f4f4f4)' : 'var(--dsh-color-bg-canvas, #ffffff)',
                color: selectedDay === q.key ? 'var(--dsh-color-text-primary, #242424)' : 'var(--dsh-color-text-primary, #0f172a)',
                fontSize: '12px',
                fontWeight: selectedDay === q.key ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {q.label} ({q.key.slice(5)})
            </button>
          ))}
          <input
            type="date"
            disabled={busy}
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid var(--dsh-color-border, #cbd5e1)',
              backgroundColor: 'var(--dsh-color-bg-canvas, #ffffff)',
              color: 'var(--dsh-color-text-primary, #0f172a)',
              fontSize: '12px',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {report?.isEdited && (
            <span
              style={{
                fontSize: '11px',
                color: '#d97706',
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                padding: '3px 8px',
                borderRadius: '4px',
                fontWeight: 500,
              }}
            >
              已手工微调保存
            </span>
          )}
          <button
            onClick={handleRegenerate}
            disabled={busy}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--dsh-color-border, #cbd5e1)',
              backgroundColor: 'var(--dsh-color-bg-canvas, #ffffff)',
              color: 'var(--dsh-color-text-primary, #0f172a)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: busy ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            <IconRefresh size={14} color="#64748b" />
            <span>{phase === 'intake' ? '正在整理…' : 'AI 重新整理'}</span>
          </button>

          <button
            disabled={busy}
            onClick={() => (isEditing ? setIsEditing(false) : handleStartEdit())}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid',
              borderColor: isEditing ? '#f59e0b' : 'var(--dsh-color-border, #cbd5e1)',
              backgroundColor: isEditing ? '#fef3c7' : 'var(--dsh-color-bg-canvas, #ffffff)',
              color: isEditing ? '#92400e' : 'var(--dsh-color-text-primary, #0f172a)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            {isEditing ? <IconPreview size={14} color="#92400e" /> : <IconEdit size={14} color="#64748b" />}
            <span>{isEditing ? '文档预览' : '手动微调'}</span>
          </button>

          {isEditing && (
            <button
              disabled={busy}
              onClick={handleSave}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                backgroundColor: 'var(--workbench-action-bg, #242424)',
                color: 'var(--workbench-action-fg, #ffffff)',
                border: 'none',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
              }}
            >
              <IconSave size={14} color="currentColor" />
              <span>保存修改</span>
            </button>
          )}

          <button
            disabled={busy}
            onClick={handleCopy}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              backgroundColor: 'var(--workbench-action-bg, #242424)',
              color: 'var(--workbench-action-fg, #ffffff)',
              border: 'none',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
              transition: 'background-color 0.2s',
            }}
          >
            {copySuccess ? <IconCheck size={14} color="currentColor" /> : <IconCopy size={14} color="currentColor" />}
            <span>{copySuccess ? '已复制到剪贴板！' : '复制标准日报'}</span>
          </button>
        </div>
      </div>

      {insightLoading && !isEditing && (
        <div style={{padding:'8px 14px',fontSize:12,color:'var(--dsh-color-text-secondary,#64748b)',display:'flex',alignItems:'center',gap:'8px'}}>
          <IconSync size={13} color="currentColor" spinning />
          <span>AI 正在根据今日工作归纳商业价值与明日计划…</span>
        </div>
      )}
      {insightError && !isEditing && (
        <div role="alert" style={{padding:'8px 14px',fontSize:12,color:'#b45309',display:'flex',gap:'10px',alignItems:'center'}}>
          <span style={{flex:1}}>AI 归纳商业价值与明日计划失败：{insightError}</span>
          <button onClick={handleRetryInsight} style={{border:0,background:'transparent',color:'inherit',textDecoration:'underline',cursor:'pointer',fontSize:12}}>重试</button>
        </div>
      )}
      {insight && !currentReport?.isEdited && !isEditing && (
        <div style={{padding:'8px 14px',fontSize:12,color:'var(--dsh-color-text-secondary,#64748b)'}}>
          商业价值与明日计划由 AI 根据今日工作归纳，请核对后提交。
        </div>
      )}
      {loadError && currentMarkdown && <div role="alert" style={{padding:'10px 14px',fontSize:12,color:'var(--dsh-color-text-primary,#242424)',border:'1px solid var(--dsh-color-border-subtle,#ddd)',borderRadius:6,overflowWrap:'anywhere'}}>AI 整理失败，已保留原报告：{loadError}</div>}
      {/* Main Content Area */}
      <div
        ref={viewportRef}
        data-wr-report-viewport=""
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--dsh-color-bg-canvas, #ffffff)',
          borderRadius: '8px',
          border: '1px solid var(--dsh-color-border-subtle, #e2e8f0)',
          padding: '20px',
        }}
      >
        {phase === 'intake' ? (
          <ReportIntake snapshot={snapshot} />
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '15px', marginBottom: '8px' }}>
              <IconSync size={18} color="var(--dsh-color-text-primary, #242424)" spinning />
              <span>正在加载日报…</span>
            </div>
          </div>
        ) : loadError && !currentMarkdown ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#ef4444' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginBottom: '12px' }}>
              <IconAlertCircle size={18} color="#ef4444" />
              <span>加载日报失败: {loadError}</span>
            </div>
            <div>
              <button
                disabled={busy}
                onClick={handleRegenerate}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--workbench-action-bg, #242424)',
                  color: 'var(--workbench-action-fg, #ffffff)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <IconRefresh size={14} color="currentColor" />
                <span>重新加载</span>
              </button>
            </div>
          </div>
        ) : isEditing ? (
          <textarea
            value={editedMarkdown}
            onChange={(e) => setEditedMarkdown(e.target.value)}
            style={{
              flex: 1,
              width: '100%',
              minHeight: '400px',
              padding: '16px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '13px',
              lineHeight: 1.6,
              borderRadius: '6px',
              border: '1px solid var(--dsh-color-border, #cbd5e1)',
              backgroundColor: 'var(--dsh-color-bg-subtle, #f8fafc)',
              color: 'var(--dsh-color-text-primary, #0f172a)',
              resize: 'none',
              boxSizing: 'border-box',
            }}
          />
        ) : (
          <div
            style={{
              padding: '20px 24px',
              borderRadius: '8px',
              backgroundColor: 'var(--dsh-color-bg-subtle, #f8fafc)',
              border: '1px solid var(--dsh-color-border-subtle, #e2e8f0)',
            }}
          >
            {currentMarkdown ? (
              <ReportOrganizingReveal active={phase === 'reveal'}>
                <MarkdownRenderer content={currentMarkdown} reportTitle={`工作日报（${selectedDay}）`} report={currentReport} />
              </ReportOrganizingReveal>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
                暂无日报内容，点击右上角“AI 重新整理”
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
