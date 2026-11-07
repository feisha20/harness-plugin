/** 为办公系统生成独立的富文本和纯文本，不复制页面容器或 Markdown 标记。 */
export function formatReportClipboard(markdown: string): { html: string; text: string } {
  const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const plainInline = (text: string) => text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1（$2）')
    .replace(/\*\*([^*]+)\*\*/g, '$1').replace(/__([^_]+)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1').replace(/\*([^*]+)\*/g, '$1')
  const inline = (text: string) => escape(text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1（$2）'))
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
  const html: string[] = []
  const text: string[] = []
  let list: 'ul' | 'ol' | null = null
  let inCode = false
  let underWorkHeading = false
  const closeList = () => { if (list) { html.push(`</${list}>`); list = null } }
  for (const raw of markdown.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim()
    if (/^```/.test(line)) { closeList(); inCode = !inCode; continue }
    if (inCode) { html.push(`<p style="margin:0;white-space:pre-wrap;font-family:monospace">${escape(raw)}</p>`); text.push(raw); continue }
    if (!line) { closeList(); if (text.length && text.at(-1) !== '') text.push(''); continue }
    if (/^(?:---+|\*\*\*+)$/.test(line)) { closeList(); continue }
    const heading = line.match(/^(#{1,6})\s+(.+)$/)
    const legacyHeading = line.match(/^【(.+)】$/)
    const isTitle = /^(?:工作日报|工作周报|工作月报)\s*[（(]/.test(line)
    if (heading || legacyHeading || isTitle) {
      closeList()
      const value = heading?.[2] || legacyHeading?.[1] || line
      underWorkHeading = !!heading && heading[1].length >= 4
      const size = isTitle ? 16 : heading && heading[1].length >= 4 ? 13 : 14
      html.push(`<p style="margin:12px 0 6px;font-size:${size}px;font-weight:700;line-height:1.5">${inline(value)}</p>`)
      text.push(plainInline(value))
      continue
    }
    const bullet = line.match(/^[-*•]\s+(.+)$/)
    const ordered = line.match(/^(\d+)\.\s+(.+)$/)
    if (bullet || ordered) {
      const kind = bullet ? 'ul' : 'ol'
      if (list !== kind) { closeList(); html.push(`<${kind}${ordered ? ` start="${ordered[1]}"` : ''} style="margin:4px 0 8px ${underWorkHeading ? 24 : 0}px;padding-left:22px">`); list = kind }
      const value = bullet?.[1] || ordered![2]
      html.push(`<li${ordered ? ` value="${ordered[1]}"` : ''} style="margin:3px 0;line-height:1.6">${inline(value)}</li>`)
      text.push(`${underWorkHeading ? '　　' : '　'}${bullet ? '•' : ordered![1] + '.'} ${plainInline(value)}`)
      continue
    }
    closeList()
    html.push(`<p style="margin:4px 0;line-height:1.6">${inline(line)}</p>`)
    text.push(plainInline(line))
  }
  closeList()
  return { html:`<div style="font-family:Arial,'Microsoft YaHei',sans-serif;font-size:13px;color:#222;line-height:1.6">${html.join('')}</div>`, text:text.join('\n').trim() }
}

export async function copyReport(markdown: string): Promise<void> {
  const content = formatReportClipboard(markdown)
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([content.html], { type:'text/html' }),
        'text/plain': new Blob([content.text], { type:'text/plain' }),
      })])
      return
    } catch { /* 富文本写入不被允许时，尝试复制干净的纯文本。 */ }
  }
  await navigator.clipboard.writeText(content.text)
}
