import React, { useState } from 'react'
import type { SourceConfig, TaskSource } from '../shared/types.ts'
import {
  IconSources,
  IconSync,
  IconFolder,
  IconEdit,
  getSourceIcon,
} from './Icons.tsx'

interface SourcesViewProps {
  sources: SourceConfig[]
  onUpdateSource: (id: TaskSource, updates: Partial<SourceConfig>) => Promise<void>
  onTriggerSync: () => Promise<void>
  syncing: boolean
}

export function SourcesView({ sources, onUpdateSource, onTriggerSync, syncing }: SourcesViewProps) {
  const [editingZentao, setEditingZentao] = useState(false)
  const zentaoSource = sources.find((s) => s.id === 'zentao')
  const [zentaoUrl, setZentaoUrl] = useState(zentaoSource?.zentaoConfig?.url || '')
  const [zentaoAccount, setZentaoAccount] = useState(zentaoSource?.zentaoConfig?.account || '')
  const [zentaoToken, setZentaoToken] = useState(zentaoSource?.zentaoConfig?.token || '')

  const handleSaveZentao = async (e: React.FormEvent) => {
    e.preventDefault()
    await onUpdateSource('zentao', {
      zentaoConfig: {
        url: zentaoUrl.trim(),
        account: zentaoAccount.trim(),
        token: zentaoToken.trim(),
      },
      status: zentaoUrl.trim() ? 'available' : 'unavailable',
    })
    setEditingZentao(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      {/* Top Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '14px 18px',
          backgroundColor: 'var(--dsh-color-bg-subtle, #f8fafc)',
          borderRadius: '8px',
          border: '1px solid var(--dsh-color-border-subtle, #e2e8f0)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 600, color: 'var(--dsh-color-text-primary, #0f172a)' }}>
            <IconSources size={18} color="#2563eb" />
            <span>多通道 AI 与工作流会话采集源</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--dsh-color-text-secondary, #64748b)' }}>
            自动监听并增量采样本地 AI 编码助手（DSH、Claude、Codex、Gemini）与项目管理系统（禅道），提取工作事项并关联会话依据。
          </div>
        </div>

        <button
          onClick={onTriggerSync}
          disabled={syncing}
          style={{
            padding: '8px 18px',
            borderRadius: '6px',
            backgroundColor: syncing ? '#94a3b8' : '#2563eb',
            color: '#ffffff',
            border: 'none',
            fontSize: '13px',
            fontWeight: 500,
            cursor: syncing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 1px 2px rgba(37,99,235,0.2)',
          }}
        >
          <IconSync size={15} color="#ffffff" spinning={syncing} />
          <span>{syncing ? '正在全量采样与抽取中...' : '立即执行全量采集与增量抽取'}</span>
        </button>
      </div>

      {/* Sources Grid */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '14px',
          alignContent: 'start',
        }}
      >
        {sources.map((src) => {
          const isZentao = src.id === 'zentao'
          const isAvailable = src.status === 'available'
          const isScanning = src.status === 'scanning'

          return (
            <div
              key={src.id}
              style={{
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: 'var(--dsh-color-bg-canvas, #ffffff)',
                border: '1px solid var(--dsh-color-border-subtle, #e2e8f0)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getSourceIcon(src.id, 24)}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dsh-color-text-primary, #0f172a)' }}>
                      {src.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', marginTop: '2px' }}>
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: isAvailable ? '#10b981' : isScanning ? '#2563eb' : '#cbd5e1',
                        }}
                      />
                      <span style={{ color: isAvailable ? '#059669' : isScanning ? '#2563eb' : '#64748b' }}>
                        {isAvailable ? '环境就绪 / 已连接' : isScanning ? '正在同步采集...' : '未就绪 / 本地未检出'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Enable Switch */}
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: src.enabled ? '#2563eb' : '#94a3b8', fontWeight: 500 }}>
                    {src.enabled ? '已启用' : '已暂停'}
                  </span>
                  <input
                    type="checkbox"
                    checked={src.enabled}
                    onChange={(e) => onUpdateSource(src.id, { enabled: e.target.checked })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                </label>
              </div>

              {/* Path / URL */}
              <div
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--dsh-color-bg-subtle, #f8fafc)',
                  border: '1px solid var(--dsh-color-border-subtle, #f1f5f9)',
                  fontSize: '11px',
                  color: 'var(--dsh-color-text-secondary, #475569)',
                  wordBreak: 'break-all',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <IconFolder size={13} color="#64748b" />
                <span>探测路径：{src.path}</span>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                <span>已识别会话：<strong style={{ color: '#0f172a' }}>{src.sessionCount}</strong> 个</span>
                <span>上次同步：{src.lastSyncAt ? src.lastSyncAt.slice(11, 19) : '尚未同步'}</span>
              </div>

              {/* Special Config for Zentao */}
              {isZentao && (
                <div style={{ borderTop: '1px solid var(--dsh-color-border-subtle, #f1f5f9)', paddingTop: '10px' }}>
                  {!editingZentao ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {zentaoUrl ? `已绑定实例：${zentaoUrl}` : '未配置禅道服务地址'}
                      </span>
                      <button
                        onClick={() => setEditingZentao(true)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#2563eb',
                          fontSize: '12px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <IconEdit size={13} color="#2563eb" />
                        <span>配置 API 凭据</span>
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveZentao} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                      <input
                        type="url"
                        placeholder="禅道系统 URL (如 https://zentao.yourcompany.com)"
                        value={zentaoUrl}
                        onChange={(e) => setZentaoUrl(e.target.value)}
                        style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      />
                      <input
                        type="text"
                        placeholder="登录账号"
                        value={zentaoAccount}
                        onChange={(e) => setZentaoAccount(e.target.value)}
                        style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      />
                      <input
                        type="password"
                        placeholder="API Token 或密码"
                        value={zentaoToken}
                        onChange={(e) => setZentaoToken(e.target.value)}
                        style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setEditingZentao(false)}
                          style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', background: 'transparent', fontSize: '11px', cursor: 'pointer' }}
                        >
                          取消
                        </button>
                        <button
                          type="submit"
                          style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', fontSize: '11px', cursor: 'pointer' }}
                        >
                          保存配置
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
