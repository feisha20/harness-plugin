import React, { useState, useEffect } from 'react'
import type { DailyReport, PeriodicReport, Task } from '../shared/types.ts'
import { copyReport } from '../shared/reportClipboard.ts'
import { ReportEngine } from '../shared/reportEngine.ts'
import { MarkdownRenderer } from './MarkdownRenderer.tsx'
import {
  IconPeriodic,
  IconChart,
  IconRefresh,
  IconEdit,
  IconPreview,
  IconSave,
  IconCopy,
  IconCheck,
  IconAlertCircle,
  IconSync,
} from './Icons.tsx'

interface PeriodicReportViewProps {
  tasks: Task[]
  currentWeekKey: string
  currentMonthKey: string
  dailyReports?: Record<string, DailyReport>
  weeklyReports: Record<string, PeriodicReport>
  monthlyReports: Record<string, PeriodicReport>
  onFetchWeeklyReport: (weekKey: string, regenerate?: boolean) => Promise<PeriodicReport>
  onSaveWeeklyReport: (report: PeriodicReport) => Promise<void>
  onFetchMonthlyReport: (monthKey: string, regenerate?: boolean) => Promise<PeriodicReport>
  onSaveMonthlyReport: (report: PeriodicReport) => Promise<void>
}

export function PeriodicReportView({
  tasks,
  currentWeekKey,
  currentMonthKey,
  dailyReports = {},
  weeklyReports,
  monthlyReports,
  onFetchWeeklyReport,
  onSaveWeeklyReport,
  onFetchMonthlyReport,
  onSaveMonthlyReport,
}: PeriodicReportViewProps) {
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly')
  const [selectedWeek, setSelectedWeek] = useState(currentWeekKey)
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey)
  const initialCached =
    reportType === 'weekly' ? weeklyReports[selectedWeek] : monthlyReports[selectedMonth]
  const [report, setReport] = useState<PeriodicReport | null>(initialCached || null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedMarkdown, setEditedMarkdown] = useState(initialCached?.markdown || '')
  const [copySuccess, setCopySuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const activeKey = reportType === 'weekly' ? selectedWeek : selectedMonth

  // 1. Sync report if weeklyReports/monthlyReports changes externally
  useEffect(() => {
    const cached = reportType === 'weekly' ? weeklyReports[selectedWeek] : monthlyReports[selectedMonth]
    if (cached && !isEditing) {
      setReport(cached)
      setEditedMarkdown(cached.markdown)
    }
  }, [reportType, selectedWeek, selectedMonth, weeklyReports, monthlyReports, isEditing])

  // 2. Fetch report when period changes and not in cache
  useEffect(() => {
    const cached = reportType === 'weekly' ? weeklyReports[selectedWeek] : monthlyReports[selectedMonth]
    if (cached) {
      setReport(cached)
      setEditedMarkdown(cached.markdown)
      setLoading(false)
      setLoadError(null)
      return
    }

    let active = true
    setLoading(true)
    setLoadError(null)

    const fetcher =
      reportType === 'weekly'
        ? onFetchWeeklyReport(selectedWeek)
        : onFetchMonthlyReport(selectedMonth)

    fetcher
      .then((res) => {
        if (active) {
          setReport(res)
          setEditedMarkdown(res.markdown)
        }
      })
      .catch((err: unknown) => {
        if (active) {
          console.error('Failed to load periodic report:', err)
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
  }, [reportType, selectedWeek, selectedMonth, onFetchWeeklyReport, onFetchMonthlyReport])

  // Computed synthesized report if not manually edited
  const synthesizedReport =
    reportType === 'weekly'
      ? ReportEngine.generateWeeklyReport(selectedWeek, tasks, dailyReports)
      : ReportEngine.generateMonthlyReport(selectedMonth, tasks, dailyReports)

  const currentMarkdown = (report?.isEdited || report?.aiOrganized) ? (report.markdown || '') : synthesizedReport.markdown

  const handleRegenerate = async () => {
    if (isEditing && !window.confirm('AI 重新整理会替换当前报告，未保存的修改将丢失，是否继续？')) return
    setLoading(true)
    setLoadError(null)
    try {
      const res =
        reportType === 'weekly'
          ? await onFetchWeeklyReport(selectedWeek, true)
          : await onFetchMonthlyReport(selectedMonth, true)
      setReport(res)
      setEditedMarkdown(res.markdown)
    } catch (err: unknown) {
      console.error('Failed to regenerate periodic report:', err)
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
    const updated: PeriodicReport = {
      ...base,
      markdown: editedMarkdown,
      isEdited: true,
    }
    if (reportType === 'weekly') {
      await onSaveWeeklyReport(updated)
    } else {
      await onSaveMonthlyReport(updated)
    }
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

  // Quick period buttons
  const quickWeeks = [currentWeekKey, '2026-W44', '2026-W43']
  const quickMonths = [currentMonthKey, '2026-10', '2026-09']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      {/* Control Bar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Segmented Type Switcher */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--dsh-color-bg-canvas, #ffffff)',
              borderRadius: '6px',
              border: '1px solid var(--dsh-color-border, #cbd5e1)',
              padding: '2px',
            }}
          >
            <button
              onClick={() => {
                setReportType('weekly')
                setIsEditing(false)
              }}
              style={{
                padding: '5px 14px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: reportType === 'weekly' ? 'var(--workbench-action-bg, #242424)' : 'transparent',
                color: reportType === 'weekly' ? 'var(--workbench-action-fg, #ffffff)' : 'var(--dsh-color-text-secondary, #64748b)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <IconPeriodic size={14} color={reportType === 'weekly' ? 'var(--workbench-action-fg, #ffffff)' : '#64748b'} />
              <span>工作周报</span>
            </button>
            <button
              onClick={() => {
                setReportType('monthly')
                setIsEditing(false)
              }}
              style={{
                padding: '5px 14px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: reportType === 'monthly' ? 'var(--workbench-action-bg, #242424)' : 'transparent',
                color: reportType === 'monthly' ? 'var(--workbench-action-fg, #ffffff)' : 'var(--dsh-color-text-secondary, #64748b)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <IconChart size={14} color={reportType === 'monthly' ? 'var(--workbench-action-fg, #ffffff)' : '#64748b'} />
              <span>工作月报</span>
            </button>
          </div>

          {/* Quick Period Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {reportType === 'weekly'
              ? quickWeeks.map((w, idx) => (
                  <button
                    key={w}
                    onClick={() => setSelectedWeek(w)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      border: '1px solid',
                      borderColor: selectedWeek === w ? 'var(--dsh-color-text-primary, #242424)' : 'var(--dsh-color-border, #cbd5e1)',
                      backgroundColor: selectedWeek === w ? 'var(--dsh-color-bg-subtle, #f4f4f4)' : 'var(--dsh-color-bg-canvas, #ffffff)',
                      color: selectedWeek === w ? 'var(--dsh-color-text-primary, #242424)' : 'var(--dsh-color-text-primary, #0f172a)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: selectedWeek === w ? 600 : 400,
                    }}
                  >
                    {idx === 0 ? `本周 (${w})` : idx === 1 ? `上周 (${w})` : w}
                  </button>
                ))
              : quickMonths.map((m, idx) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMonth(m)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      border: '1px solid',
                      borderColor: selectedMonth === m ? 'var(--dsh-color-text-primary, #242424)' : 'var(--dsh-color-border, #cbd5e1)',
                      backgroundColor: selectedMonth === m ? 'var(--dsh-color-bg-subtle, #f4f4f4)' : 'var(--dsh-color-bg-canvas, #ffffff)',
                      color: selectedMonth === m ? 'var(--dsh-color-text-primary, #242424)' : 'var(--dsh-color-text-primary, #0f172a)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: selectedMonth === m ? 600 : 400,
                    }}
                  >
                    {idx === 0 ? `本月 (${m})` : idx === 1 ? `上月 (${m})` : m}
                  </button>
                ))}
          </div>
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
            <span>AI 重新整理</span>
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
            <span>{isEditing ? '文档预览' : '手工微调'}</span>
          </button>

          {isEditing && (
            <button
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
              <span>保存归档</span>
            </button>
          )}

          <button
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
            <span>{copySuccess ? '已复制！' : `复制${reportType === 'weekly' ? '周报' : '月报'}`}</span>
          </button>
        </div>
      </div>

      {loadError && currentMarkdown && <div role="alert" style={{padding:'10px 14px',fontSize:12,color:'var(--dsh-color-text-primary,#242424)',border:'1px solid var(--dsh-color-border-subtle,#ddd)',borderRadius:6,overflowWrap:'anywhere'}}>AI 整理失败，已保留原报告：{loadError}</div>}
      {/* Main Report View */}
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
              <IconSync size={18} color="var(--dsh-color-text-primary, #242424)" spinning />
              <span>正在汇总计算报告...</span>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>正在整理周期内工作记录</div>
          </div>
        ) : loadError && !currentMarkdown ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#ef4444' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginBottom: '12px' }}>
              <IconAlertCircle size={18} color="#ef4444" />
              <span>加载统计报告失败: {loadError}</span>
            </div>
            <div>
              <button
                disabled={loading}
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
              <MarkdownRenderer content={currentMarkdown} />
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
                暂无报告内容，点击右上角“AI 重新整理”
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
