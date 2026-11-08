import React, { useState, useEffect, useCallback } from 'react'
import type {
  DailyReport,
  PeriodicReport,
  SourceConfig,
  Task,
  TaskSource,
  WorkbenchSnapshot,
} from '../shared/types.ts'
import { TasksView } from './TasksView.tsx'
import { DailyReportView } from './DailyReportView.tsx'
import { PeriodicReportView } from './PeriodicReportView.tsx'
import { SourcesView } from './SourcesView.tsx'
import { ModelSettingsView } from './ModelSettingsView.tsx'
import {
  IconTasks,
  IconDaily,
  IconPeriodic,
  IconSources,
  IconSync,
  IconCheck,
} from './Icons.tsx'
import { WorkbenchIcon } from './WorkbenchIcon.tsx'

export function WorkbenchApp() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'daily' | 'periodic' | 'sources' | 'models'>('tasks')
  const [snapshot, setSnapshot] = useState<WorkbenchSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [requestSyncing, setSyncing] = useState(false)
  const [backendSyncing, setBackendSyncing] = useState(false)
  const syncing = requestSyncing || backendSyncing
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }, [])

  // Fetch initial snapshot
  const fetchSnapshot = useCallback(async () => {
    try {
      const res = await fetch('/api/workbench/snapshot')
      if (res.ok) {
        const data = (await res.json()) as WorkbenchSnapshot
        setSnapshot(data)
      } else {
        console.error('Failed to fetch workbench snapshot:', res.statusText)
      }
    } catch (err) {
      console.error('Error fetching snapshot:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSnapshot()
  }, [fetchSnapshot])

  // 通过短请求跟踪后台任务，刷新页面或长请求断开后仍能看到真实状态。
  useEffect(() => {
    let disposed = false
    let timer: ReturnType<typeof setTimeout>
    let wasRunning = false
    const controller = new AbortController()
    const poll = async () => {
      try {
        const res = await fetch('/api/workbench/sync/status', {signal: controller.signal})
        if (!res.ok) throw new Error('读取同步状态失败')
        const data = await res.json() as {running: boolean; sources: SourceConfig[]}
        if (disposed) return
        setBackendSyncing(data.running)
        setSnapshot(previous => previous ? {...previous, sources: previous.sources.map(source => ({...source, ...data.sources.find(item => item.id === source.id)}))} : previous)
        if (wasRunning && !data.running) await fetchSnapshot()
        wasRunning = data.running
      } catch { /* 临时断网保留已有内容，下次继续查询。 */ }
      finally { if (!disposed) timer = setTimeout(poll, 2000) }
    }
    void poll()
    return () => { disposed = true; clearTimeout(timer); controller.abort() }
  }, [fetchSnapshot])

  // Task Handlers
  const handleUpdateTask = useCallback(async (task: Partial<Task> & { id: string }) => {
    try {
      const res = await fetch('/api/workbench/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      })
      if (res.ok) {
        const updated = (await res.json()) as Task
        setSnapshot((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            tasks: prev.tasks.map((t) => (t.id === updated.id ? updated : t)),
          }
        })
      }
    } catch (err) {
      console.error('Failed to update task:', err)
      showToast('更新任务失败')
    }
  }, [showToast])

  const handleDeleteTask = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/workbench/tasks?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setSnapshot((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            tasks: prev.tasks.filter((t) => t.id !== id),
          }
        })
        showToast('已删除事项')
      }
    } catch (err) {
      console.error('Failed to delete task:', err)
    }
  }, [showToast])

  const handleCreateTask = useCallback(async (task: Partial<Task>) => {
    try {
      const res = await fetch('/api/workbench/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      })
      if (!res.ok) throw new Error('保存工作记录失败')
      if (res.ok) {
        const created = (await res.json()) as Task
        setSnapshot((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            tasks: [created, ...prev.tasks],
          }
        })
        showToast('已添加工作记录')
      }
    } catch (err) {
      console.error('保存工作记录失败:', err)
      throw err
    }
  }, [showToast])

  // Daily Report Handlers
  const handleFetchDailyReport = useCallback(async (day: string, regenerate = false): Promise<DailyReport> => {
    const res = await fetch(`/api/workbench/reports/daily?day=${day}&regenerate=${regenerate}`)
    if (!res.ok) { const body=await res.json().catch(()=>({})); throw new Error(body.error || 'AI 整理失败，请检查模型配置') }
    const report = (await res.json()) as DailyReport
    setSnapshot((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        dailyReports: { ...prev.dailyReports, [day]: report },
      }
    })
    return report
  }, [])

  const handleSaveDailyReport = useCallback(async (report: DailyReport) => {
    const res = await fetch('/api/workbench/reports/daily', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    })
    if (res.ok) {
      showToast(`已保存 ${report.day} 日报`)
    }
  }, [showToast])

  // Weekly & Monthly Report Handlers
  const handleFetchWeeklyReport = useCallback(async (weekKey: string, regenerate = false): Promise<PeriodicReport> => {
    const res = await fetch(`/api/workbench/reports/weekly?weekKey=${weekKey}&regenerate=${regenerate}`)
    if (!res.ok) { const body=await res.json().catch(()=>({})); throw new Error(body.error || 'AI 整理失败，请检查模型配置') }
    const report = (await res.json()) as PeriodicReport
    setSnapshot((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        weeklyReports: { ...prev.weeklyReports, [weekKey]: report },
      }
    })
    return report
  }, [])

  const handleSaveWeeklyReport = useCallback(async (report: PeriodicReport) => {
    const res = await fetch('/api/workbench/reports/weekly', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    })
    if (res.ok) {
      showToast(`已归档周报 ${report.periodKey}`)
    }
  }, [showToast])

  const handleFetchMonthlyReport = useCallback(async (monthKey: string, regenerate = false): Promise<PeriodicReport> => {
    const res = await fetch(`/api/workbench/reports/monthly?monthKey=${monthKey}&regenerate=${regenerate}`)
    if (!res.ok) { const body=await res.json().catch(()=>({})); throw new Error(body.error || 'AI 整理失败，请检查模型配置') }
    const report = (await res.json()) as PeriodicReport
    setSnapshot((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        monthlyReports: { ...prev.monthlyReports, [monthKey]: report },
      }
    })
    return report
  }, [])

  const handleSaveMonthlyReport = useCallback(async (report: PeriodicReport) => {
    const res = await fetch('/api/workbench/reports/monthly', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    })
    if (res.ok) {
      showToast(`已归档月报 ${report.periodKey}`)
    }
  }, [showToast])

  // Source Handlers
  const handleUpdateSource = useCallback(async (id: TaskSource, updates: Partial<SourceConfig>) => {
    const res = await fetch('/api/workbench/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })
    if (res.ok) {
      await fetchSnapshot()
      showToast('采集源配置已更新')
    }
  }, [fetchSnapshot, showToast])

  const [syncError, setSyncError] = useState<string | null>(null)
  const handleTriggerSync = useCallback(async () => {
    setSyncing(true)
    setSyncError(null)
    try {
      const res = await fetch('/api/workbench/sync', { method: 'POST' })
      if (res.ok) {
        const result = (await res.json()) as { message: string; success?: boolean }
        await fetchSnapshot()
        if (result.success === false) setSyncError(result.message)
        showToast(result.message || '多通道采集与事项抽取已完成！')
      } else {
        const body = await res.json().catch(()=>({}))
        setSyncError(body.message || '同步请求失败，请检查服务状态')
      }
    } catch (err) {
      setSyncError('同步请求失败，请检查服务连接')
      console.error('Sync failed:', err)
      showToast('采集同步失败，请检查各渠道权限')
    } finally {
      setSyncing(false)
    }
  }, [fetchSnapshot, showToast])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ color: '#64748b', fontSize: '14px' }}>正在加载工作日志与事项数据...</div>
      </div>
    )
  }

  const today = snapshot?.activePeriod?.today || new Date().toISOString().slice(0, 10)
  const currentWeek = snapshot?.activePeriod?.currentWeekKey || '2026-W45'
  const currentMonth = snapshot?.activePeriod?.currentMonthKey || '2026-11'

  return (
    <div
      className="workbench-app"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        backgroundColor: 'var(--dsh-color-bg-base, #ffffff)',
        color: 'var(--dsh-color-text-primary, #0f172a)',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <style>{`
        .workbench-app { --workbench-action-bg:var(--dsh-color-text-primary,#242424); --workbench-action-fg:var(--dsh-color-bg-canvas,#ffffff); }
        .workbench-app button:focus-visible { outline:2px solid var(--dsh-color-text-secondary,#777); outline-offset:3px; }
        @keyframes dsh-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px 16px',
          padding: '12px 24px',
          borderBottom: '1px solid var(--dsh-color-border-subtle, #e2e8f0)',
          backgroundColor: 'var(--dsh-color-bg-canvas, #ffffff)',
          flexShrink: 0,
        }}
      >
        {/* Brand & Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px 24px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--dsh-color-bg-subtle, #f4f4f4)',
                border: '1px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <WorkbenchIcon size={18} active />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.2px' }}>
                工作日志
              </div>
              <div style={{ fontSize: '11px', color: 'var(--dsh-color-text-muted, #94a3b8)' }}>
                日常工作记录与报告整理
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              flexWrap: 'wrap',
              backgroundColor: 'var(--dsh-color-bg-subtle, #f1f5f9)',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid var(--dsh-color-border-subtle, #e2e8f0)',
            }}
          >
            <button
              onClick={() => setActiveTab('tasks')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'tasks' ? '#ffffff' : 'transparent',
                color: activeTab === 'tasks' ? 'var(--dsh-color-text-primary, #242424)' : 'var(--dsh-color-text-secondary, #64748b)',
                fontSize: '13px',
                fontWeight: activeTab === 'tasks' ? 600 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: activeTab === 'tasks' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <IconTasks size={15} color={activeTab === 'tasks' ? 'var(--dsh-color-text-primary, #242424)' : '#64748b'} />
              <span>工作事项</span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor: activeTab === 'tasks' ? 'var(--dsh-color-bg-subtle, #f4f4f4)' : 'rgba(0,0,0,0.06)',
                  color: activeTab === 'tasks' ? 'var(--dsh-color-text-primary, #242424)' : '#64748b',
                }}
              >
                {snapshot?.tasks.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('daily')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'daily' ? '#ffffff' : 'transparent',
                color: activeTab === 'daily' ? 'var(--dsh-color-text-primary, #242424)' : 'var(--dsh-color-text-secondary, #64748b)',
                fontSize: '13px',
                fontWeight: activeTab === 'daily' ? 600 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: activeTab === 'daily' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <IconDaily size={15} color={activeTab === 'daily' ? 'var(--dsh-color-text-primary, #242424)' : '#64748b'} />
              <span>工作日报</span>
            </button>

            <button
              onClick={() => setActiveTab('periodic')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'periodic' ? '#ffffff' : 'transparent',
                color: activeTab === 'periodic' ? 'var(--dsh-color-text-primary, #242424)' : 'var(--dsh-color-text-secondary, #64748b)',
                fontSize: '13px',
                fontWeight: activeTab === 'periodic' ? 600 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: activeTab === 'periodic' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <IconPeriodic size={15} color={activeTab === 'periodic' ? 'var(--dsh-color-text-primary, #242424)' : '#64748b'} />
              <span>周报与月报</span>
            </button>

            <button
              onClick={() => setActiveTab('sources')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'sources' ? '#ffffff' : 'transparent',
                color: activeTab === 'sources' ? 'var(--dsh-color-text-primary, #242424)' : 'var(--dsh-color-text-secondary, #64748b)',
                fontSize: '13px',
                fontWeight: activeTab === 'sources' ? 600 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: activeTab === 'sources' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <IconSources size={15} color={activeTab === 'sources' ? 'var(--dsh-color-text-primary, #242424)' : '#64748b'} />
              <span>采集源管理</span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor: activeTab === 'sources' ? 'var(--dsh-color-bg-subtle, #f4f4f4)' : 'rgba(0,0,0,0.06)',
                  color: activeTab === 'sources' ? 'var(--dsh-color-text-primary, #242424)' : '#64748b',
                }}
              >
                {snapshot?.sources.filter((s) => s.enabled).length || 0}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('models')}
              aria-current={activeTab === 'models' ? 'page' : undefined}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'models' ? 'var(--dsh-color-bg-canvas, #ffffff)' : 'transparent',
                color: activeTab === 'models' ? 'var(--dsh-color-text-primary, #242424)' : 'var(--dsh-color-text-secondary, #64748b)',
                fontSize: '13px',
                fontWeight: activeTab === 'models' ? 600 : 500,
                cursor: 'pointer',
                boxShadow: activeTab === 'models' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              模型设置
            </button>
          </div>
        </div>

        {/* Global Action Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleTriggerSync}
            disabled={syncing}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid var(--dsh-color-border, #cbd5e1)',
              backgroundColor: 'var(--dsh-color-bg-canvas, #ffffff)',
              color: 'var(--dsh-color-text-primary, #0f172a)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: syncing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.15s',
            }}
          >
            <IconSync size={14} color={syncing ? '#94a3b8' : 'var(--dsh-color-text-primary, #242424)'} spinning={syncing} />
            <span>{syncing ? '正在采集采样中...' : '同步并生成概要'}</span>
          </button>
        </div>
      </div>

      {syncError && <div role="alert" style={{padding:'10px 24px',fontSize:12,color:'var(--dsh-color-text-primary,#242424)',borderBottom:'1px solid var(--dsh-color-border-subtle,#ddd)',display:'flex',gap:12}}><span style={{flex:1,overflowWrap:'anywhere'}}>{syncError}</span><button onClick={()=>setSyncError(null)} aria-label="关闭同步错误" style={{border:0,background:'transparent',color:'inherit'}}>×</button></div>}
      {/* Viewport Content */}
      <div style={{ flex: 1, padding: '20px 24px', overflowY: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'tasks' && snapshot && (
          <TasksView
            tasks={snapshot.tasks}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onCreateTask={handleCreateTask}
          />
        )}

        {activeTab === 'daily' && snapshot && (
          <DailyReportView
            tasks={snapshot.tasks}
            currentDay={today}
            dailyReports={snapshot.dailyReports}
            onFetchDailyReport={handleFetchDailyReport}
            onSaveDailyReport={handleSaveDailyReport}
          />
        )}

        {activeTab === 'periodic' && snapshot && (
          <PeriodicReportView
            tasks={snapshot.tasks}
            currentWeekKey={currentWeek}
            currentMonthKey={currentMonth}
            dailyReports={snapshot.dailyReports}
            weeklyReports={snapshot.weeklyReports}
            monthlyReports={snapshot.monthlyReports}
            onFetchWeeklyReport={handleFetchWeeklyReport}
            onSaveWeeklyReport={handleSaveWeeklyReport}
            onFetchMonthlyReport={handleFetchMonthlyReport}
            onSaveMonthlyReport={handleSaveMonthlyReport}
          />
        )}

        {activeTab === 'sources' && snapshot && (
          <SourcesView
            sources={snapshot.sources}
            onUpdateSource={handleUpdateSource}
            onTriggerSync={handleTriggerSync}
            syncing={syncing}
          />
        )}
        {activeTab === 'models' && <ModelSettingsView />}
      </div>

      {/* Toast Popup */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            padding: '10px 18px',
            borderRadius: '8px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 500,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {!syncError && <IconCheck size={16} color="#10b981" />}
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}
