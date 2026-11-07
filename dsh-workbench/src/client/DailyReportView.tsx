import React, { useState, useEffect } from 'react'
import type { DailyReport, Task } from '../shared/types.ts'
import { ReportEngine } from '../shared/reportEngine.ts'
import { MarkdownRenderer } from './MarkdownRenderer.tsx'
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
}

export function DailyReportView({
  tasks,
  currentDay,
  dailyReports,
  onFetchDailyReport,
  onSaveDailyReport,
}: DailyReportViewProps) {
  const [selectedDay, setSelectedDay] = useState(currentDay)
  const [report, setReport] = useState<DailyReport | null>(dailyReports[selectedDay] || null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedMarkdown, setEditedMarkdown] = useState(
    dailyReports[selectedDay]?.summaryMarkdown || '',
  )
  const [copySuccess, setCopySuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

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
  const currentMarkdown = report?.isEdited ? (report.summaryMarkdown || '') : synthesizedReport.summaryMarkdown

  const handleRegenerate = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await onFetchDailyReport(selectedDay, true)
      setReport(res)
      setEditedMarkdown(res.summaryMarkdown)
    } catch (err: unknown) {
      console.error('Failed to regenerate daily report:', err)
      setLoadError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleStartEdit = () => {
    setEditedMarkdown(currentMarkdown)
    setIsEditing(true)
  }

  const handleSave = async () => {
    const base = report || synthesizedReport
    const updated: DailyReport = {
      ...base,
      summaryMarkdown: editedMarkdown,
      isEdited: true,
    }
    await onSaveDailyReport(updated)
    setReport(updated)
    setIsEditing(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(currentMarkdown)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
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
              onClick={() => setSelectedDay(q.key)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: selectedDay === q.key ? '#2563eb' : 'var(--dsh-color-border, #cbd5e1)',
                backgroundColor: selectedDay === q.key ? '#eff6ff' : 'var(--dsh-color-bg-canvas, #ffffff)',
                color: selectedDay === q.key ? '#2563eb' : 'var(--dsh-color-text-primary, #0f172a)',
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
            disabled={loading}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--dsh-color-border, #cbd5e1)',
              backgroundColor: 'var(--dsh-color-bg-canvas, #ffffff)',
              color: 'var(--dsh-color-text-primary, #0f172a)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            <IconRefresh size={14} color="#64748b" />
            <span>重新提取汇总</span>
          </button>

          <button
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
              onClick={handleSave}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 1px 2px rgba(16,185,129,0.2)',
              }}
            >
              <IconSave size={14} color="#ffffff" />
              <span>保存修改</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              backgroundColor: copySuccess ? '#059669' : '#2563eb',
              color: '#ffffff',
              border: 'none',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(37,99,235,0.2)',
              transition: 'background-color 0.2s',
            }}
          >
            {copySuccess ? <IconCheck size={14} color="#ffffff" /> : <IconCopy size={14} color="#ffffff" />}
            <span>{copySuccess ? '已复制到剪贴板！' : '复制标准日报'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div
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
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '15px', marginBottom: '8px' }}>
              <IconSync size={18} color="#2563eb" spinning />
              <span>正在生成汇总...</span>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>正在聚合各渠道会话并生成标准工作日报</div>
          </div>
        ) : loadError ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#ef4444' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginBottom: '12px' }}>
              <IconAlertCircle size={18} color="#ef4444" />
              <span>加载日报失败: {loadError}</span>
            </div>
            <div>
              <button
                onClick={handleRegenerate}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <IconRefresh size={14} color="#ffffff" />
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
              <MarkdownRenderer content={currentMarkdown} />
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
                暂无日报内容，点击右上角“重新提取汇总”
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
