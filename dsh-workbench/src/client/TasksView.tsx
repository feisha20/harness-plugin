import React, { useMemo, useState } from 'react'
import type { Task } from '../shared/types.ts'
import { recordDay, todayString, shiftDate } from '../shared/reportEngine.ts'
import { IconPlus, IconTrash, IconFolder } from './Icons.tsx'

interface TasksViewProps {
  tasks: Task[]
  onUpdateTask: (task: Partial<Task> & { id: string }) => Promise<void>
  onDeleteTask: (id: string) => Promise<void>
  onCreateTask: (task: Partial<Task>) => Promise<void>
}
const sources: Record<string, string> = { dsh: 'DeepSeek Harness', claude: 'Claude Code', codex: 'Codex', gemini: 'Gemini CLI', zentao: '禅道', manual: '手动记录' }

export function TasksView({ tasks, onDeleteTask, onCreateTask }: TasksViewProps) {
  const today = todayString()
  const [day, setDay] = useState(today)
  const [text, setText] = useState('')
  const [project, setProject] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [evidenceId, setEvidenceId] = useState<string | null>(null)
  const records = useMemo(() => tasks.filter(t => recordDay(t) === day).sort((a,b) => b.createdAt.localeCompare(a.createdAt)), [tasks, day])
  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || saving) return
    setSaving(true); setError('')
    try {
      await onCreateTask({ title: text.trim(), projectPath: project.trim() || undefined, source: 'manual', recordDate: day })
      setText(''); setProject('')
    } catch { setError('保存失败，请重试，记录内容已保留。') }
    finally { setSaving(false) }
  }
  return <section className="work-records">
    <style>{`
      .work-records { --wr-text:var(--dsh-color-text-primary,#262930); --wr-muted:var(--dsh-color-text-secondary,#82858c); --wr-line:var(--dsh-color-border-subtle,#e7e8eb); --wr-bg:var(--dsh-color-bg-canvas,#fff); display:flex; flex-direction:column; height:100%; min-height:0; color:var(--wr-text); font-size:13px; }
      .work-records * { box-sizing:border-box; }
      .work-records button,.work-records input,.work-records textarea { font:inherit; }
      .work-records button { cursor:pointer; }
      .work-records button:focus-visible,.work-records input:focus-visible,.work-records textarea:focus-visible { outline:2px solid #7292c0; outline-offset:3px; }
      .wr-header { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:0 0 14px; }
      .wr-header h2 { font-size:17px; font-weight:600; margin:0; } .wr-header p { font-size:12px; margin:0; color:var(--wr-muted); }
      .wr-date { display:flex; align-items:center; gap:9px; } .wr-date button { border:1px solid var(--wr-line); border-radius:6px; padding:6px 9px; color:var(--wr-muted); background:var(--wr-bg); }
      .wr-date input { border:0; padding:6px; color:var(--wr-text); background:transparent; font-size:12px; }
      .wr-composer { border:1px solid var(--wr-line); border-radius:8px; background:var(--wr-bg); overflow:hidden; flex-shrink:0; display:flex; align-items:center; gap:10px; padding:7px 10px; }
      .wr-composer:focus-within { border-color:#9aaecb; }
      .wr-composer textarea { display:block; flex:1; min-width:0; width:100%; height:34px; min-height:34px; max-height:160px; resize:vertical; border:0; background:transparent; color:var(--wr-text); padding:6px 4px; line-height:1.6; outline:none; }
      .wr-composer textarea::placeholder { color:var(--wr-muted); } .wr-composer-footer { display:flex; align-items:center; gap:10px; flex-shrink:0; }
      .wr-project { display:flex; align-items:center; gap:6px; min-width:0; color:var(--wr-muted); } .wr-project input { width:150px; max-width:100%; border:0; padding:4px; background:transparent; color:var(--wr-text); font-size:12px; }
      .wr-save { display:flex; align-items:center; gap:5px; border:0; border-radius:6px; background:#3670d8; color:white; padding:7px 12px; font-size:12px!important; white-space:nowrap; } .wr-save:disabled { opacity:.45; cursor:default; }
      .wr-list { flex:1; min-height:0; overflow-y:auto; margin-top:16px; } .wr-count { display:flex; justify-content:space-between; color:var(--wr-muted); font-size:11px; padding:0 0 10px; border-bottom:1px solid var(--wr-line); }
      .wr-entry { padding:11px 2px; border-bottom:1px solid var(--wr-line); display:grid; grid-template-columns:24px minmax(0,1fr) minmax(160px,28%) 28px; column-gap:12px; align-items:center; }
      .wr-number { font-size:11px; font-variant-numeric:tabular-nums; color:var(--wr-muted); width:22px; flex-shrink:0; padding-top:4px; } .wr-body { display:contents; }
      .wr-content { margin:0; white-space:pre-wrap; overflow-wrap:anywhere; font-size:13px; line-height:1.6; }
      .wr-meta { display:flex; gap:12px; flex-wrap:wrap; align-items:center; color:var(--wr-muted); font-size:11px; margin-top:0; justify-content:flex-end; }
      .wr-meta span { max-width:180px; display:inline-flex; align-items:center; gap:4px; overflow-wrap:anywhere; } .wr-meta button { padding:0; border:0; background:transparent; color:inherit; font-size:11px; text-decoration:underline; text-underline-offset:3px; }
      .wr-delete { display:grid; place-items:center; width:28px; height:28px; border:0; border-radius:5px; background:transparent; color:var(--wr-muted); } .wr-delete:hover { background:var(--dsh-color-bg-subtle,#f6f7f9); color:#bf5757; }
      .wr-evidence { grid-column:2 / -1; grid-row:2; margin-top:12px; border-left:2px solid var(--wr-line); padding-left:12px; color:var(--wr-muted); font-size:12px; } .wr-evidence p { white-space:pre-wrap; overflow-wrap:anywhere; line-height:1.7; }
      .wr-empty { padding:50px 16px; text-align:center; color:var(--wr-muted); line-height:2; font-size:12px; } .wr-error { color:#bc4c4c; font-size:12px; }
      @media(max-width:850px) { .wr-entry { grid-template-columns:20px minmax(0,1fr) 28px; } .wr-meta { grid-column:2; grid-row:2; justify-content:flex-start; padding-top:5px; } .wr-delete { grid-column:3; grid-row:1; } .wr-evidence { grid-row:3; } .wr-composer { flex-wrap:wrap; } .wr-composer textarea { flex-basis:100%; } .wr-composer-footer { width:100%; justify-content:space-between; } }
      @media(max-width:650px) { .wr-header { flex-wrap:wrap; } .wr-project input { width:130px; } .wr-date { flex-wrap:wrap; } }
    `}</style>
    <header className="wr-header">
      <div><h2>{day === today ? '今日工作事项' : '工作事项'}</h2></div>
      <div className="wr-date"><button aria-label="前一天" onClick={() => setDay(shiftDate(day,-1))}>‹</button><input aria-label="工作日期" type="date" value={day} onChange={e => e.target.value && setDay(e.target.value)} /><button aria-label="后一天" onClick={() => setDay(shiftDate(day,1))}>›</button>{day !== today && <button onClick={() => setDay(today)}>今天</button>}</div>
    </header>
    <form className="wr-composer" onSubmit={save}>
      <textarea rows={1} aria-label="工作内容" placeholder="记录一项工作…" value={text} onChange={e => setText(e.target.value)} />
      <div className="wr-composer-footer"><label className="wr-project"><IconFolder size={13} /><input aria-label="所属项目（选填）" placeholder="所属项目（选填）" value={project} onChange={e => setProject(e.target.value)} /></label><button className="wr-save" disabled={saving || !text.trim()}><IconPlus size={13} />{saving ? '保存中…' : '添加记录'}</button></div>
    </form>
    {error && <p role="alert" className="wr-error">{error}</p>}
    <div className="wr-list"><div className="wr-count"><span>{day === today ? '今日记录' : day}</span><span>{records.length} 条工作事项</span></div>
      {records.length === 0 && <div className="wr-empty">这一天还没有工作记录<br />写下做过的工作，之后整理报告时就有据可循。</div>}
      {records.map((task,i) => <article className="wr-entry" key={task.id}><span className="wr-number">{String(i+1).padStart(2,'0')}</span><div className="wr-body"><p className="wr-content">{task.title}</p><div className="wr-meta">{task.projectPath && <span title={task.projectPath}><IconFolder size={11} />{task.projectPath.split('/').filter(Boolean).pop()}</span>}<span>{sources[task.source]}</span>{!!task.evidence?.length && <button aria-expanded={evidenceId === task.id} onClick={() => setEvidenceId(evidenceId === task.id ? null : task.id)}>查看来源</button>}</div>{evidenceId === task.id && <div className="wr-evidence">{task.evidence?.map((e,i) => <p key={e.id || i}>{e.quote}</p>)}</div>}</div><button className="wr-delete" aria-label={`删除记录：${task.title}`} onClick={() => onDeleteTask(task.id)}><IconTrash size={14} /></button></article>)}
    </div>
  </section>
}
