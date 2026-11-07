import React from 'react'

interface MarkdownRendererProps {
  content: string
  className?: string
  style?: React.CSSProperties
}

function renderInlineText(text: string): React.ReactNode[] {
  // Replace status badges like [已完成], 【已完成】, [推进中], 【进行中】, [下周计划]
  // and markdown inline styles: `code`, **bold**, *italic*
  const nodes: React.ReactNode[] = []
  let keyIdx = 0

  // Regex to split by bold (**text**), inline code (`code`), or badges ([...], 【...】)
  const regex = /(\*\*.*?\*\*|`.*?`|\[已完成\]|【已完成】|\[推进中\]|【进行中】|\[下周计划\]|\[待办\])/g
  const parts = text.split(regex)

  for (const part of parts) {
    if (!part) continue
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      nodes.push(
        <strong key={keyIdx++} style={{ fontWeight: 600, color: 'var(--dsh-color-text-primary, #0f172a)' }}>
          {part.slice(2, -2)}
        </strong>,
      )
    } else if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      nodes.push(
        <code
          key={keyIdx++}
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: '0.88em',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: 'rgba(100, 116, 139, 0.1)',
            color: '#2563eb',
            border: '1px solid rgba(100, 116, 139, 0.15)',
          }}
        >
          {part.slice(1, -1)}
        </code>,
      )
    } else if (part === '[已完成]' || part === '【已完成】') {
      nodes.push(
        <span
          key={keyIdx++}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: '11px',
            fontWeight: 600,
            color: '#059669',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '4px',
            padding: '1px 6px',
            marginRight: '6px',
            lineHeight: 1.4,
          }}
        >
          已完成
        </span>,
      )
    } else if (part === '[推进中]' || part === '【进行中】') {
      nodes.push(
        <span
          key={keyIdx++}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: '11px',
            fontWeight: 600,
            color: '#2563eb',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '4px',
            padding: '1px 6px',
            marginRight: '6px',
            lineHeight: 1.4,
          }}
        >
          推进中
        </span>,
      )
    } else if (part === '[下周计划]' || part === '[待办]') {
      nodes.push(
        <span
          key={keyIdx++}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: '11px',
            fontWeight: 600,
            color: '#7c3aed',
            backgroundColor: '#f5f3ff',
            border: '1px solid #ddd6fe',
            borderRadius: '4px',
            padding: '1px 6px',
            marginRight: '6px',
            lineHeight: 1.4,
          }}
        >
          {part.replace(/[\[\]]/g, '')}
        </span>,
      )
    } else {
      // Check for trailing project tag like "(projectName)"
      const projectMatch = part.match(/^(.*?)(\s+\(([^)]+)\))$/)
      if (projectMatch) {
        nodes.push(projectMatch[1])
        nodes.push(
          <span
            key={keyIdx++}
            style={{
              fontSize: '11px',
              color: '#64748b',
              backgroundColor: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              padding: '1px 6px',
              marginLeft: '6px',
              fontFamily: 'ui-monospace, monospace',
            }}
          >
            {projectMatch[3]}
          </span>,
        )
      } else {
        nodes.push(part)
      }
    }
  }

  return nodes
}

export function MarkdownRenderer({ content, style }: MarkdownRendererProps) {
  if (!content) return null

  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let inCodeBlock = false
  let codeBuffer: string[] = []
  let currentList: { type: 'ol' | 'ul'; items: string[] } | null = null

  const flushList = () => {
    if (!currentList) return
    const isOrdered = currentList.type === 'ol'
    elements.push(
      <div
        key={`list-${elements.length}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          margin: '6px 0 14px 4px',
        }}
      >
        {currentList.items.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              fontSize: '13.5px',
              lineHeight: 1.6,
              color: 'var(--dsh-color-text-primary, #1e293b)',
            }}
          >
            {isOrdered ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '20px',
                  height: '20px',
                  borderRadius: '10px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  fontSize: '11px',
                  fontWeight: 600,
                  marginTop: '2px',
                  flexShrink: 0,
                }}
              >
                {idx + 1}
              </span>
            ) : (
              <span
                style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#94a3b8',
                  marginTop: '9px',
                  flexShrink: 0,
                }}
              />
            )}
            <div style={{ flex: 1 }}>{renderInlineText(item)}</div>
          </div>
        ))}
      </div>,
    )
    currentList = null
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const trimmed = rawLine.trim()

    // Code blocks
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        elements.push(
          <pre
            key={`code-${elements.length}`}
            style={{
              backgroundColor: '#0f172a',
              color: '#f8fafc',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              overflowX: 'auto',
              margin: '10px 0',
              lineHeight: 1.5,
            }}
          >
            <code>{codeBuffer.join('\n')}</code>
          </pre>,
        )
        codeBuffer = []
        inCodeBlock = false
      } else {
        flushList()
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine)
      continue
    }

    // Horizontal Rule
    if (trimmed === '---' || trimmed === '***') {
      flushList()
      elements.push(
        <hr
          key={`hr-${elements.length}`}
          style={{
            border: 'none',
            borderTop: '1px solid var(--dsh-color-border-subtle, #e2e8f0)',
            margin: '18px 0',
          }}
        />,
      )
      continue
    }

    // Headings
    if (trimmed.startsWith('#### ')) {
      flushList()
      const title = trimmed.slice(5).replace(/^[📅📊📈🎯⏳📁\s]+/, '')
      elements.push(
        <div
          key={`h4-${elements.length}`}
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--dsh-color-text-primary, #0f172a)',
            margin: '16px 0 8px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {title}
        </div>,
      )
      continue
    }

    if (trimmed.startsWith('### ')) {
      flushList()
      const title = trimmed.slice(4).replace(/^[📅📊📈🎯⏳📁\s]+/, '')
      elements.push(
        <div
          key={`h3-${elements.length}`}
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--dsh-color-text-primary, #0f172a)',
            margin: '18px 0 10px 0',
            paddingBottom: '6px',
            borderBottom: '1px solid var(--dsh-color-border-subtle, #f1f5f9)',
          }}
        >
          {title}
        </div>,
      )
      continue
    }

    if (trimmed.startsWith('## ')) {
      flushList()
      const title = trimmed.slice(3).replace(/^[📅📊📈🎯⏳📁\s]+/, '')
      elements.push(
        <div
          key={`h2-${elements.length}`}
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--dsh-color-text-primary, #0f172a)',
            margin: '20px 0 12px 0',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--dsh-color-border-subtle, #e2e8f0)',
          }}
        >
          {title}
        </div>,
      )
      continue
    }

    if (trimmed.startsWith('# ')) {
      flushList()
      const title = trimmed.slice(2).replace(/^[📅📊📈🎯⏳📁\s]+/, '')
      elements.push(
        <div
          key={`h1-${elements.length}`}
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--dsh-color-text-primary, #0f172a)',
            margin: '22px 0 14px 0',
          }}
        >
          {title}
        </div>,
      )
      continue
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      flushList()
      const quoteText = trimmed.slice(2)
      elements.push(
        <div
          key={`quote-${elements.length}`}
          style={{
            padding: '10px 14px',
            backgroundColor: '#f8fafc',
            borderLeft: '4px solid #2563eb',
            borderRadius: '0 6px 6px 0',
            fontSize: '13px',
            color: '#475569',
            margin: '8px 0 14px 0',
            lineHeight: 1.6,
          }}
        >
          {renderInlineText(quoteText)}
        </div>,
      )
      continue
    }

    // Report Title line (e.g. "工作日报（2026-11-07）")
    if (
      trimmed.startsWith('工作日报') ||
      trimmed.startsWith('工作周报') ||
      trimmed.startsWith('工作月报')
    ) {
      flushList()
      elements.push(
        <div
          key={`title-${elements.length}`}
          style={{
            fontSize: '17px',
            fontWeight: 700,
            color: 'var(--dsh-color-text-primary, #0f172a)',
            marginBottom: '14px',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--dsh-color-border-subtle, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>{trimmed}</span>
        </div>,
      )
      continue
    }

    // Section Category items like "【今日完成事项】" or "【项目名称】"
    if (trimmed.startsWith('【') && trimmed.endsWith('】')) {
      flushList()
      elements.push(
        <div
          key={`section-${elements.length}`}
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#1e293b',
            margin: '16px 0 8px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span
            style={{
              width: '3px',
              height: '14px',
              borderRadius: '2px',
              backgroundColor: '#2563eb',
              display: 'inline-block',
            }}
          />
          <span>{trimmed.slice(1, -1)}</span>
        </div>,
      )
      continue
    }

    // Ordered list (e.g. "1. xxx")
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/)
    if (olMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList()
        currentList = { type: 'ol', items: [] }
      }
      currentList.items.push(olMatch[2])
      continue
    }

    // Unordered list (e.g. "• xxx", "- xxx" or "* xxx")
    const ulMatch = trimmed.match(/^[-*•]\s+(.*)$/)
    if (ulMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList()
        currentList = { type: 'ul', items: [] }
      }
      currentList.items.push(ulMatch[1])
      continue
    }

    // Empty line
    if (!trimmed) {
      flushList()
      continue
    }

    // Normal paragraph
    flushList()
    elements.push(
      <p
        key={`p-${elements.length}`}
        style={{
          margin: '6px 0',
          fontSize: '13.5px',
          lineHeight: 1.7,
          color: 'var(--dsh-color-text-primary, #1e293b)',
        }}
      >
        {renderInlineText(trimmed)}
      </p>,
    )
  }

  flushList()

  return (
    <div
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        ...style,
      }}
    >
      {elements}
    </div>
  )
}
