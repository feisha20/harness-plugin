import { snapshotIsAcp } from './AcpAgentControl.ts'
import type { OwnsAcpRoute } from '../coordinator/cross-backend-coordinator.ts'
import { resolveCrossBackendLocation } from '../data/cross-backend-controller.ts'
import type { WorkspaceId } from '@deepseek-ai/dsh-api-workspace-controller/client'
import { createElement as h, useEffect, useRef, useState, useMemo } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { Button, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import { ProgressWatch, progressText, progressNoticeLabel } from './progress-watch.ts'
import type { AcpRemoteLike } from '../data/acp-remote.ts'
import type { SessionAccessSource } from './session-action-access.ts'
import css from './AcpRecoveryDock.module.css'

export type AcpProgressNoticeProps = PropsRuntime<'conversation.composer.dock'> & {
  remote: AcpRemoteLike
  sessionAccessSource: SessionAccessSource
  cancelSession: (id: string) => Promise<void>
  createNewSession: (id: string) => Promise<void>
  ownsRoute: OwnsAcpRoute
}

/** 仅提供显式恢复操作；取消确认前不能重连或创建替代会话。 */
export function AcpProgressNotice({
  sessionId,
  useSession,
  useSessionStatus,
  useChat,
  useAccess,
  remote,
  sessionAccessSource,
  cancelSession,
  createNewSession,
  ownsRoute,
  useProjection,
  useSessions,
  useWorkspaces,
  useRemoteAccess,
  useWorkspaceAccess,
}: AcpProgressNoticeProps) {
  const isAcp = snapshotIsAcp(useProjection('modelSelection'), ownsRoute)
  const workspaces = useWorkspaces((s) => s.items)
  const cwd = useSessions((s) => s.byId[sessionId]?.cwd)
  const destination = resolveCrossBackendLocation(sessionId, workspaces, cwd)
  const globalCreate = useRemoteAccess('session/create')
  const workspaceCreate = useWorkspaceAccess((destination?.workspaceId ?? '') as WorkspaceId, 'session/create')
  const createAllowed = !!destination && (destination.workspaceId === undefined ? globalCreate : workspaceCreate)
  const running = useSession((s) => s.running)
  const lastError = useSession((s) => s.lastAgentError)
  const waiting = useSessionStatus((s) => s.get(sessionId)?.pendingInteraction !== undefined)
  const chat = useChat((s) => s.legacy)
  const cancelAllowed = useAccess('session/cancel')
  const reconnectAllowed = useAccess('dshAcp/retryOriginal')
  const watch = useRef(new ProgressWatch())
  const [now, setNow] = useState(Date.now())
  const [idle, setIdle] = useState(0)
  const [cancelRequested, setCancelRequested] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const generation = useRef(0)
  const inFlight = useRef(false)
  const turn = Math.max(0, ...chat.turnTimings.keys())
  const signal = useMemo(
    () =>
      JSON.stringify([
        waiting,
        chat.partial?.turn,
        chat.partial?.step,
        chat.partial?.blocks.map((b) =>
          b.kind === 'text' || b.kind === 'reasoning' ? [b.kind, b.text.length] : b.kind,
        ),
        chat.runningCalls,
        chat.nodes.length,
        chat.nodes.at(-1),
      ]),
    [waiting, chat],
  )
  const current = useRef({ sessionId, turn, running, createAllowed, isAcp })
  current.current = { sessionId, turn, running, createAllowed, isAcp }
  useEffect(() => {
    ++generation.current
    inFlight.current = false
    watch.current = new ProgressWatch()
    setIdle(0)
    setCancelRequested(false)
    setBusy(false)
    setError(null)
    setNotice(null)
    setOpen(false)
    return () => {
      ++generation.current
    }
  }, [sessionId, turn, isAcp])
  useEffect(() => {
    if (!running || !isAcp) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [running, isAcp])
  useEffect(() => {
    if (!running || !isAcp) return
    const value = watch.current.update(`${sessionId}:${turn}`, signal, Date.now())
    setIdle(value)
    if (value < 120000 || waiting) setOpen(false)
  }, [sessionId, turn, running, signal, now, waiting, isAcp])
  const run = async (action: () => Promise<void>) => {
    if (
      inFlight.current ||
      current.current.sessionId !== sessionId ||
      current.current.turn !== turn ||
      !current.current.isAcp
    )
      return
    inFlight.current = true
    const epoch = generation.current
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await action()
    } catch (e) {
      if (epoch === generation.current) setError(e instanceof Error ? e.message : String(e))
    } finally {
      if (epoch === generation.current) {
        inFlight.current = false
        setBusy(false)
      }
    }
  }
  const failed =
    (String(lastError ?? '').includes('Antigravity') && String(lastError ?? '').includes('本轮结果未确认')) ||
    String(lastError ?? '').includes('ACP_UPSTREAM_')
  const label = progressNoticeLabel(running, idle, waiting, failed, cancelRequested)
  if (!isAcp || label === null) return null
  return h(
    'span',
    { className: css.compactNotice },
    h(
      'button',
      {
        type: 'button',
        className: css.noticeTrigger,
        'aria-haspopup': 'dialog',
        'aria-expanded': open,
        onClick: () => setOpen(true),
      },
      label,
    ),
    open
      ? h(
          Modal,
          {
            open,
            title: running ? '暂无新进展' : '恢复选项',
            closeLabel: '关闭',
            onClose: () => {
              if (!busy) setOpen(false)
            },
            backdropBlur: false,
            ...(css.dialog === undefined ? {} : { className: css.dialog }),
            ...(css.content === undefined ? {} : { contentClassName: css.content }),
          },
          h(
            'div',
            { className: css.noticeDetails },
            h(
              'span',
              { className: css.summaryText },
              running
                ? progressText(
                    idle,
                    waiting,
                    chat.runningCalls.length > 0,
                    chat.partial?.blocks.some(
                      (b) => (b.kind === 'text' || b.kind === 'reasoning') && b.text.length > 0,
                    ) ?? false,
                  )
                : '本轮已结束，可重连原会话或新建会话后手动继续。原历史保留，未确认的工具结果需核实。',
            ),
            running
              ? h(
                  Button,
                  {
                    variant: 'outline',
                    disabled: busy || !cancelAllowed,
                    onClick: () => {
                      if (!current.current.running) return
                      if (sessionAccessSource(sessionId, 'session/cancel')?.getSnapshot() !== true) return
                      void run(async () => {
                        setCancelRequested(true)
                        await cancelSession(sessionId)
                      })
                    },
                  },
                  busy ? '正在请求取消…' : '取消本轮',
                )
              : h(
                  'div',
                  { style: { display: 'flex', gap: 8 } },
                  h(
                    Button,
                    {
                      variant: 'outline',
                      disabled: busy || !reconnectAllowed,
                      onClick: () => {
                        if (current.current.running) return
                        if (sessionAccessSource(sessionId, 'dshAcp/retryOriginal')?.getSnapshot() !== true) return
                        const epoch = generation.current
                        void run(async () => {
                          const result = await remote.retryOriginal(sessionId)
                          if (!result.ok) throw new Error(result.error.message)
                          if (epoch === generation.current)
                            setNotice('恢复检查已完成，请查看恢复提示并手动继续；未重发任务。')
                        })
                      },
                    },
                    '重连原会话',
                  ),
                  h(
                    Button,
                    {
                      variant: 'outline',
                      disabled: busy || !createAllowed,
                      onClick: () => {
                        if (!current.current.running && current.current.createAllowed)
                          void run(() => createNewSession(sessionId))
                      },
                    },
                    '新建空白会话',
                  ),
                ),
          ),
          notice ? h('p', null, notice) : null,
          error ? h('p', { role: 'alert', className: css.error }, error) : null,
        )
      : null,
  )
}
