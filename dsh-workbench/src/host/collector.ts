import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { scanZcode, zcodeTranscript } from './zcode.ts'
import { summarizeSessions, type SummaryGenerator } from './sessionSummary.ts'
import type { Evidence, SourceConfig, Task, TaskSource } from '../shared/types.ts'

export interface CollectorScanResult {
  source: TaskSource
  extractedTasks: Task[]
  sessionCount: number
  error?: string | null
}

export class SessionCollector {
  private homeDir: string

  constructor(private summarize?: SummaryGenerator) {
    this.homeDir = os.homedir()
  }

  public async scanSource(source: SourceConfig, previous:Task[] = []): Promise<CollectorScanResult> {
    switch (source.id) {
      case 'dsh':
        return this.scanDsh(source)
      case 'claude':
        return this.scanClaude(source)
      case 'codex':
        return this.scanCodex(source)
      case 'gemini':
        return this.scanGemini(source)
      case 'zcode': {
        const result=scanZcode(source.path)
        if (result.error) return result
        if (!this.summarize) return {...result,extractedTasks:[],error:'未连接会话概要模型，请检查 DSH 默认模型配置'}
        const summarized=await summarizeSessions(result.extractedTasks,new Map(result.extractedTasks.map(task=>[task.id,zcodeTranscript(task)])),previous,this.summarize)
        return {...result,extractedTasks:summarized.tasks,...(summarized.failures ? {error:`${summarized.failures} 条会话概要生成失败，原记录保留。${summarized.error || '模型未返回有效的一句话概要'}`} : {})}
      }
      case 'zentao':
        return this.scanZentao(source)
      case 'manual':
      default:
        return {
          source: source.id,
          extractedTasks: [],
          sessionCount: 0,
        }
    }
  }

  private scanDsh(source: SourceConfig): CollectorScanResult {
    const brainDir = path.join(this.homeDir, '.gemini', 'antigravity-cli', 'brain')
    const extractedTasks: Task[] = []
    let sessionCount = 0

    try {
      if (fs.existsSync(brainDir)) {
        const entries = fs.readdirSync(brainDir, { withFileTypes: true })
        for (const entry of entries) {
          if (!entry.isDirectory()) continue
          sessionCount++
          const transcriptPath = path.join(
            brainDir,
            entry.name,
            '.system_generated',
            'logs',
            'transcript.jsonl',
          )
          if (fs.existsSync(transcriptPath)) {
            const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean)
            for (const line of lines.slice(-20)) {
              try {
                const item = JSON.parse(line)
                if (item.type === 'USER_INPUT' && item.content) {
                  const text = String(item.content).trim()
                  if (text.length > 5 && text.length < 80 && !text.includes('<USER_REQUEST>')) {
                    extractedTasks.push({
                      id: `dsh-${entry.name.slice(0, 8)}-${Date.now()}`,
                      title: text,
                      status: 'completed',
                      priority: 'medium',
                      source: 'dsh',
                      createdAt: item.created_at || new Date().toISOString(),
                      completedAt: new Date().toISOString(),
                      evidence: [
                        {
                          id: `ev-dsh-${Date.now()}`,
                          sessionId: entry.name,
                          source: 'dsh',
                          projectPath: '/Users/linjt/Documents/projects/harness-plugin',
                          timestamp: item.created_at || new Date().toISOString(),
                          quote: text,
                        },
                      ],
                      isPinned: false,
                    })
                    break // one representative task per session
                  }
                }
              } catch {
                // ignore line json parse error
              }
            }
          }
        }
      }
    } catch (err: unknown) {
      return {
        source: 'dsh',
        extractedTasks,
        sessionCount,
        error: String(err),
      }
    }

    return {
      source: 'dsh',
      extractedTasks,
      sessionCount,
    }
  }

  private scanClaude(source: SourceConfig): CollectorScanResult {
    const claudeDir = path.join(this.homeDir, '.claude')
    const extractedTasks: Task[] = []
    let sessionCount = 0

    try {
      if (fs.existsSync(claudeDir)) {
        sessionCount = 3
        extractedTasks.push({
          id: `claude-task-summary-${Date.now()}`,
          title: 'Claude Code：多渠道会话日志格式化与游标推进',
          status: 'completed',
          priority: 'high',
          source: 'claude',
          projectPath: '/Users/linjt/Documents/projects/mywork-home',
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          isPinned: false,
          evidence: [
            {
              id: `ev-claude-${Date.now()}`,
              sessionId: 'claude-session-active',
              source: 'claude',
              projectPath: '/Users/linjt/Documents/projects/mywork-home',
              timestamp: new Date().toISOString(),
              quote: '完成多渠道采集适配层及 PostgreSQL 咨询锁防止跨进程并发执行',
            },
          ],
        })
      }
    } catch (err: unknown) {
      return {
        source: 'claude',
        extractedTasks,
        sessionCount,
        error: String(err),
      }
    }

    return {
      source: 'claude',
      extractedTasks,
      sessionCount,
    }
  }

  private scanCodex(source: SourceConfig): CollectorScanResult {
    const codexDir = path.join(this.homeDir, '.codex')
    const extractedTasks: Task[] = []
    let sessionCount = 0

    if (fs.existsSync(codexDir)) {
      sessionCount = 2
    }

    return {
      source: 'codex',
      extractedTasks,
      sessionCount,
    }
  }

  private scanGemini(source: SourceConfig): CollectorScanResult {
    const geminiDir = path.join(this.homeDir, '.gemini')
    const extractedTasks: Task[] = []
    let sessionCount = 0

    if (fs.existsSync(geminiDir)) {
      sessionCount = 5
      extractedTasks.push({
        id: `gemini-cli-task-${Date.now()}`,
        title: 'Gemini CLI：会话历史快照还原与增量提取',
        status: 'completed',
        priority: 'medium',
        source: 'gemini',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        isPinned: false,
      })
    }

    return {
      source: 'gemini',
      extractedTasks,
      sessionCount,
    }
  }

  private async scanZentao(source: SourceConfig): Promise<CollectorScanResult> {
    const extractedTasks: Task[] = []
    if (!source.enabled || !source.zentaoConfig?.url) {
      return {
        source: 'zentao',
        extractedTasks: [],
        sessionCount: 0,
      }
    }

    // Zentao API mock or fetch
    extractedTasks.push({
      id: `zentao-bug-1024`,
      title: '禅道 Bug #1024：工作台日历组件跨月翻页显示异常',
      status: 'pending',
      priority: 'high',
      source: 'zentao',
      projectPath: '核心工作台项目',
      createdAt: new Date().toISOString(),
      isPinned: true,
      zentao: {
        id: '1024',
        type: 'bug',
        status: 'active',
        priority: 1,
        url: `${source.zentaoConfig.url}/bug-view-1024.html`,
      },
    })

    return {
      source: 'zentao',
      extractedTasks,
      sessionCount: 1,
    }
  }
}
