import React, { useState, useMemo } from 'react'
import type { Task, TaskPriority, TaskSource, TaskStatus } from '../shared/types.ts'
import {
  IconPlus,
  IconPin,
  IconTrash,
  IconSearch,
  IconClock,
  IconFolder,
  IconCheck,
  IconEmptyInbox,
  IconChevronDown,
  getSourceIcon,
} from './Icons.tsx'

interface TasksViewProps {
  tasks: Task[]
  onUpdateTask: (task: Partial<Task> & { id: string }) => Promise<void>
  onDeleteTask: (id: string) => Promise<void>
  onCreateTask: (task: Partial<Task>) => Promise<void>
}

const SOURCE_LABELS: Record<TaskSource, { name: string; color: string; bg: string; border: string }> = {
  dsh: { name: 'DeepSeek Harness', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  claude: { name: 'Claude Code', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  codex: { name: 'Codex', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' },
  gemini: { name: 'Gemini CLI', color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe' },
  zentao: { name: '禅道', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
  manual: { name: '手动录入', color: '#475569', bg: '#f8fafc', border: '#e2e8f0' },
}

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string; dot: string }> = {
  high: { label: '高优先级', color: '#dc2626', bg: '#fef2f2', dot: '#ef4444' },
  medium: { label: '中优先级', color: '#b45309', bg: '#fffbeb', dot: '#f59e0b' },
  low: { label: '普通', color: '#047857', bg: '#ecfdf5', dot: '#10b981' },
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string; border: string; accent: string }> = {
  pending: { label: '待处理', color: '#475569', bg: '#f8fafc', border: '#e2e8f0', accent: '#94a3b8' },
  in_progress: { label: '推进中', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', accent: '#3b82f6' },
  completed: { label: '已完成', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0', accent: '#10b981' },
}

export function TasksView({ tasks, onUpdateTask, onDeleteTask, onCreateTask }: TasksViewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSource, setSelectedSource] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({})

  // Form state for creating a task
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium')
  const [newSource, setNewSource] = useState<TaskSource>('manual')
  const [newProject, setNewProject] = useState('')
  const [newDeadline, setNewDeadline] = useState('')

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = tasks.length
    const pending = tasks.filter((t) => t.status === 'pending').length
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length
    const completed = tasks.filter((t) => t.status === 'completed').length
    const pinned = tasks.filter((t) => t.isPinned).length
    return { total, pending, inProgress, completed, pinned }
  }, [tasks])

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedSource !== 'all' && t.source !== selectedSource) return false
      if (selectedStatus !== 'all' && t.status !== selectedStatus) return false
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        const titleMatch = t.title.toLowerCase().includes(q)
        const projectMatch = t.projectPath?.toLowerCase().includes(q)
        const sourceMatch = SOURCE_LABELS[t.source]?.name.toLowerCase().includes(q)
        if (!titleMatch && !projectMatch && !sourceMatch) return false
      }
      return true
    })
  }, [tasks, selectedSource, selectedStatus, searchTerm])

  // Sort tasks: pinned first, then status (in_progress > pending > completed), then priority, then creation time
  const sortedTasks = useMemo(() => {
    const statusOrder: Record<TaskStatus, number> = { in_progress: 0, pending: 1, completed: 2 }
    const prioOrder: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 }

    return [...filteredTasks].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status]
      }
      if (prioOrder[a.priority] !== prioOrder[b.priority]) {
        return prioOrder[a.priority] - prioOrder[b.priority]
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [filteredTasks])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    await onCreateTask({
      title: newTitle.trim(),
      priority: newPriority,
      source: newSource,
      projectPath: newProject.trim() || undefined,
      deadline: newDeadline || undefined,
      status: 'pending',
    })
    setNewTitle('')
    setNewProject('')
    setNewDeadline('')
    setShowAddModal(false)
  }

  const toggleEvidence = (id: string) => {
    setExpandedEvidence((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleStatusCycle = (task: Task) => {
    const nextStatus: Record<TaskStatus, TaskStatus> = {
      pending: 'in_progress',
      in_progress: 'completed',
      completed: 'pending',
    }
    onUpdateTask({ id: task.id, status: nextStatus[task.status] })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      {/* Top Overview Metrics Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
        }}
      >
        {/* Metric 1: All */}
        <div
          onClick={() => setSelectedStatus('all')}
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            backgroundColor: selectedStatus === 'all' ? '#eff6ff' : 'var(--dsh-color-bg-canvas, #ffffff)',
            border: selectedStatus === 'all' ? '1.5px solid #3b82f6' : '1px solid var(--dsh-color-border-subtle, #e2e8f0)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--dsh-color-text-secondary, #64748b)', fontWeight: 500 }}>
            全部事项
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--dsh-color-text-primary, #0f172a)' }}>
            {metrics.total}
          </div>
        </div>

        {/* Metric 2: Pending */}
        <div
          onClick={() => setSelectedStatus(selectedStatus === 'pending' ? 'all' : 'pending')}
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            backgroundColor: selectedStatus === 'pending' ? '#fffbeb' : 'var(--dsh-color-bg-canvas, #ffffff)',
            border: selectedStatus === 'pending' ? '1.5px solid #f59e0b' : '1px solid var(--dsh-color-border-subtle, #e2e8f0)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ fontSize: '12px', color: '#b45309', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
            <span>待处理</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--dsh-color-text-primary, #0f172a)' }}>
            {metrics.pending}
          </div>
        </div>

        {/* Metric 3: In Progress */}
        <div
          onClick={() => setSelectedStatus(selectedStatus === 'in_progress' ? 'all' : 'in_progress')}
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            backgroundColor: selectedStatus === 'in_progress' ? '#eff6ff' : 'var(--dsh-color-bg-canvas, #ffffff)',
            border: selectedStatus === 'in_progress' ? '1.5px solid #3b82f6' : '1px solid var(--dsh-color-border-subtle, #e2e8f0)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ fontSize: '12px', color: '#1d4ed8', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
            <span>推进中</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--dsh-color-text-primary, #0f172a)' }}>
            {metrics.inProgress}
          </div>
        </div>

        {/* Metric 4: Completed */}
        <div
          onClick={() => setSelectedStatus(selectedStatus === 'completed' ? 'all' : 'completed')}
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            backgroundColor: selectedStatus === 'completed' ? '#ecfdf5' : 'var(--dsh-color-bg-canvas, #ffffff)',
            border: selectedStatus === 'completed' ? '1.5px solid #10b981' : '1px solid var(--dsh-color-border-subtle, #e2e8f0)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ fontSize: '12px', color: '#047857', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            <span>已完成</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--dsh-color-text-primary, #0f172a)' }}>
            {metrics.completed}
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filters & Action Button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '10px 14px',
          backgroundColor: 'var(--dsh-color-bg-subtle, #f8fafc)',
          borderRadius: '10px',
          border: '1px solid var(--dsh-color-border-subtle, #e2e8f0)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '320px', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px', maxWidth: '380px' }}>
            <div
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <IconSearch size={14} color="#94a3b8" />
            </div>
            <input
              type="text"
              placeholder="搜索待办标题、工程路径或采信来源..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 12px 7px 32px',
                borderRadius: '7px',
                border: '1px solid var(--dsh-color-border, #cbd5e1)',
                backgroundColor: 'var(--dsh-color-bg-canvas, #ffffff)',
                color: 'var(--dsh-color-text-primary, #0f172a)',
                fontSize: '13px',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 0.15s ease',
              }}
            />
          </div>

          {/* Source Filter */}
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            style={{
              padding: '7px 10px',
              borderRadius: '7px',
              border: '1px solid var(--dsh-color-border, #cbd5e1)',
              backgroundColor: 'var(--dsh-color-bg-canvas, #ffffff)',
              color: 'var(--dsh-color-text-primary, #0f172a)',
              fontSize: '13px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="all">全渠道来源 ({tasks.length})</option>
            <option value="dsh">DeepSeek Harness</option>
            <option value="claude">Claude Code</option>
            <option value="codex">Codex</option>
            <option value="gemini">Gemini CLI</option>
            <option value="zentao">禅道</option>
            <option value="manual">手动录入</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              padding: '7px 10px',
              borderRadius: '7px',
              border: '1px solid var(--dsh-color-border, #cbd5e1)',
              backgroundColor: 'var(--dsh-color-bg-canvas, #ffffff)',
              color: 'var(--dsh-color-text-primary, #0f172a)',
              fontSize: '13px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="all">全状态 ({metrics.total})</option>
            <option value="pending">待处理 ({metrics.pending})</option>
            <option value="in_progress">推进中 ({metrics.inProgress})</option>
            <option value="completed">已完成 ({metrics.completed})</option>
          </select>
        </div>

        {/* New Task Button */}
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '7px 16px',
            borderRadius: '7px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 1px 3px rgba(37,99,235,0.3)',
            transition: 'background-color 0.15s ease',
          }}
        >
          <IconPlus size={14} color="#ffffff" />
          <span>新建事项</span>
        </button>
      </div>

      {/* Task List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          paddingRight: '4px',
        }}
      >
        {sortedTasks.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '64px 24px',
              backgroundColor: 'var(--dsh-color-bg-subtle, #f8fafc)',
              borderRadius: '12px',
              border: '1px dashed var(--dsh-color-border, #cbd5e1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <IconEmptyInbox size={52} color="#94a3b8" />
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--dsh-color-text-primary, #1e293b)' }}>
              未找到匹配的工作待办事项
            </div>
            <div style={{ fontSize: '13px', color: 'var(--dsh-color-text-muted, #64748b)', maxWidth: '420px', lineHeight: 1.5 }}>
              可通过右上角“新建事项”手动录入，或点击顶部“一键同步会话”从各开发工具与系统自动萃取。
            </div>
          </div>
        ) : (
          sortedTasks.map((task) => {
            const srcInfo = SOURCE_LABELS[task.source] || SOURCE_LABELS.manual
            const prioInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
            const statusInfo = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending
            const isCompleted = task.status === 'completed'

            return (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--dsh-color-bg-canvas, #ffffff)',
                  border: '1px solid var(--dsh-color-border-subtle, #e2e8f0)',
                  borderLeft: task.isPinned
                    ? '3.5px solid #2563eb'
                    : `3.5px solid ${statusInfo.accent}`,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  gap: '10px',
                  opacity: isCompleted ? 0.72 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px' }}>
                  {/* Left: Custom Checkbox & Content */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: 0 }}>
                    {/* Modern SVG Checkbox Button */}
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateTask({
                          id: task.id,
                          status: isCompleted ? 'pending' : 'completed',
                        })
                      }
                      title={isCompleted ? '标记为未完成' : '标记为已完成'}
                      style={{
                        marginTop: '2px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: isCompleted ? '1.5px solid #10b981' : '1.5px solid #cbd5e1',
                        backgroundColor: isCompleted ? '#10b981' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                        flexShrink: 0,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isCompleted && <IconCheck size={11} color="#ffffff" />}
                    </button>

                    {/* Main Content */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 0 }}>
                      {/* Title & Pin Tag */}
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          lineHeight: '1.4',
                          color: isCompleted
                            ? 'var(--dsh-color-text-muted, #94a3b8)'
                            : 'var(--dsh-color-text-primary, #0f172a)',
                          textDecoration: isCompleted ? 'line-through' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          wordBreak: 'break-word',
                        }}
                      >
                        {task.isPinned && (
                          <span
                            style={{
                              fontSize: '11px',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: '#eff6ff',
                              color: '#2563eb',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              flexShrink: 0,
                            }}
                          >
                            <IconPin size={11} filled color="#2563eb" />
                            <span>置顶</span>
                          </span>
                        )}
                        <span>{task.title}</span>
                      </div>

                      {/* Meta Tags Bar */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                        {/* Channel Badge */}
                        <span
                          style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '5px',
                            backgroundColor: srcInfo.bg,
                            border: `1px solid ${srcInfo.border}`,
                            color: srcInfo.color,
                            fontWeight: 500,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          {getSourceIcon(task.source, 12)}
                          <span>{srcInfo.name}</span>
                        </span>

                        {/* Priority Badge */}
                        <span
                          style={{
                            fontSize: '11px',
                            padding: '2px 7px',
                            borderRadius: '5px',
                            backgroundColor: prioInfo.bg,
                            color: prioInfo.color,
                            fontWeight: 500,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: prioInfo.dot }} />
                          <span>{prioInfo.label}</span>
                        </span>

                        {/* Status Switcher Capsule Button */}
                        <button
                          type="button"
                          onClick={() => handleStatusCycle(task)}
                          title="点击切换状态 (待处理 -> 推进中 -> 已完成)"
                          style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '5px',
                            backgroundColor: statusInfo.bg,
                            border: `1px solid ${statusInfo.border}`,
                            color: statusInfo.color,
                            fontWeight: 500,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span>{statusInfo.label}</span>
                          <IconChevronDown size={11} color={statusInfo.color} />
                        </button>

                        {/* Project Path */}
                        {task.projectPath && (
                          <span
                            title={task.projectPath}
                            style={{
                              fontSize: '11px',
                              fontFamily: 'SFMono-Regular, Consolas, Menlo, monospace',
                              color: 'var(--dsh-color-text-secondary, #64748b)',
                              backgroundColor: 'rgba(0,0,0,0.03)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <IconFolder size={11} color="#64748b" />
                            <span>{task.projectPath.split('/').pop() || task.projectPath}</span>
                          </span>
                        )}

                        {/* Deadline */}
                        {task.deadline && (
                          <span
                            style={{
                              fontSize: '11px',
                              color: '#b45309',
                              backgroundColor: '#fffbeb',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <IconClock size={11} color="#b45309" />
                            <span>截止：{task.deadline}</span>
                          </span>
                        )}

                        {/* Evidence Accordion Button */}
                        {task.evidence && task.evidence.length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleEvidence(task.id)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              fontSize: '11px',
                              color: '#2563eb',
                              padding: '2px 4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              borderRadius: '4px',
                            }}
                          >
                            <IconSearch size={11} color="#2563eb" />
                            <span>{task.evidence.length} 条采信依据</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => onUpdateTask({ id: task.id, isPinned: !task.isPinned })}
                      title={task.isPinned ? '取消置顶' : '置顶此事项'}
                      style={{
                        background: task.isPinned ? '#eff6ff' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: task.isPinned ? '#2563eb' : '#94a3b8',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <IconPin size={15} filled={task.isPinned} color={task.isPinned ? '#2563eb' : '#94a3b8'} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteTask(task.id)}
                      title="删除事项"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94a3b8',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#ef4444'
                        e.currentTarget.style.backgroundColor = '#fef2f2'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#94a3b8'
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <IconTrash size={15} />
                    </button>
                  </div>
                </div>

                {/* Evidence Accordion Panel */}
                {expandedEvidence[task.id] && task.evidence && task.evidence.length > 0 && (
                  <div
                    style={{
                      marginTop: '4px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--dsh-color-bg-subtle, #f8fafc)',
                      border: '1px solid var(--dsh-color-border-subtle, #e2e8f0)',
                      borderLeft: '3px solid #2563eb',
                      fontSize: '12px',
                      color: 'var(--dsh-color-text-secondary, #475569)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', color: '#1e293b' }}>
                      <IconSearch size={13} color="#2563eb" />
                      <span>跨渠道会话萃取采信依据：</span>
                    </div>
                    {task.evidence.map((ev, i) => (
                      <div
                        key={ev.id || i}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: '#ffffff',
                          borderRadius: '6px',
                          border: '1px solid #f1f5f9',
                          lineHeight: 1.4,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            color: '#2563eb',
                            marginRight: '6px',
                            fontSize: '11px',
                          }}
                        >
                          [{SOURCE_LABELS[ev.source as TaskSource]?.name || ev.source}]
                        </span>
                        <span>“{ev.quote}”</span>
                        <span style={{ color: '#94a3b8', marginLeft: '8px', fontSize: '11px' }}>
                          ({ev.timestamp.slice(0, 16)})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: '480px',
              backgroundColor: 'var(--dsh-color-bg-canvas, #ffffff)',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              border: '1px solid var(--dsh-color-border-subtle, #e2e8f0)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--dsh-color-text-primary, #0f172a)' }}>
                新建待办事项
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '18px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px 6px',
                }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dsh-color-text-secondary, #475569)' }}>
                  事项描述 / 目标 *
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如：重构会话同步游标推进模块"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '7px',
                    border: '1px solid var(--dsh-color-border, #cbd5e1)',
                    marginTop: '5px',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dsh-color-text-secondary, #475569)' }}>
                    优先级
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '7px',
                      border: '1px solid var(--dsh-color-border, #cbd5e1)',
                      marginTop: '5px',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  >
                    <option value="high">高优先级 (紧急重要)</option>
                    <option value="medium">中优先级 (标准)</option>
                    <option value="low">普通 (低优先级)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dsh-color-text-secondary, #475569)' }}>
                    归属渠道
                  </label>
                  <select
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value as TaskSource)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '7px',
                      border: '1px solid var(--dsh-color-border, #cbd5e1)',
                      marginTop: '5px',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  >
                    <option value="manual">手动录入</option>
                    <option value="dsh">DeepSeek Harness</option>
                    <option value="claude">Claude Code</option>
                    <option value="codex">Codex</option>
                    <option value="gemini">Gemini CLI</option>
                    <option value="zentao">禅道</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dsh-color-text-secondary, #475569)' }}>
                    工程项目路径 (可选)
                  </label>
                  <input
                    type="text"
                    placeholder="例如：/projects/harness-plugin"
                    value={newProject}
                    onChange={(e) => setNewProject(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '7px',
                      border: '1px solid var(--dsh-color-border, #cbd5e1)',
                      marginTop: '5px',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dsh-color-text-secondary, #475569)' }}>
                    截止日期 (可选)
                  </label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '7px',
                      border: '1px solid var(--dsh-color-border, #cbd5e1)',
                      marginTop: '5px',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '7px',
                    border: '1px solid var(--dsh-color-border, #cbd5e1)',
                    backgroundColor: 'transparent',
                    color: 'var(--dsh-color-text-secondary, #475569)',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px',
                    borderRadius: '7px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(37,99,235,0.2)',
                  }}
                >
                  确认创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}