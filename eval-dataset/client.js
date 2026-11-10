window.__ModuleLoader__.load({
  id: '@local/eval-dataset',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const css = `
.ed-app {
  --ed-accent: var(--dsw-alias-brand-primary, #1e80ff);
  --ed-bg-base: var(--dsw-alias-bg-base, #ffffff);
  --ed-bg-layer1: var(--dsw-alias-bg-layer-1, #f8f9fa);
  --ed-bg-layer2: var(--dsw-alias-bg-layer-2, #f0f2f5);
  --ed-border1: var(--dsw-alias-border-l1, #e3e6eb);
  --ed-border2: var(--dsw-alias-border-l2, #cfd4dc);
  --ed-text1: var(--dsw-alias-label-primary, #1d2129);
  --ed-text2: var(--dsw-alias-label-secondary, #4e5969);
  --ed-success: var(--dsw-alias-state-success-primary, #00b42a);
  --ed-warn: var(--dsw-alias-state-warn-primary, #ff7d00);
  --ed-error: var(--dsw-alias-state-error-primary, #f53f3f);

  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--ed-bg-base);
  color: var(--ed-text1);
  font: 13px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  box-sizing: border-box;
}

.ed-app * { box-sizing: border-box; }

/* Header */
.ed-header {
  padding: 16px 24px 12px;
  border-bottom: 1px solid var(--ed-border1);
  background: var(--ed-bg-layer1);
  flex-shrink: 0;
}
.ed-header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.ed-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}
.ed-logo-badge {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--ed-bg-layer2);
  border: 1px solid var(--ed-border1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ed-accent);
}
.ed-title-group h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 650;
  letter-spacing: -0.2px;
}
.ed-subtitle {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--ed-text2);
}

.ed-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ed-date-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--ed-bg-base);
  border: 1px solid var(--ed-border1);
  border-radius: 6px;
  padding: 3px 8px;
}
.ed-date-selector input[type="date"] {
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 12px;
  outline: none;
  cursor: pointer;
}

.ed-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 6px;
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--ed-border1);
  background: var(--ed-bg-layer2);
  color: var(--ed-text1);
  transition: all 0.15s ease;
}
.ed-btn:hover:not(:disabled) {
  background: var(--ed-border1);
  border-color: var(--ed-border2);
}
.ed-btn-primary {
  background: var(--ed-accent);
  color: #ffffff;
  border-color: var(--ed-accent);
}
.ed-btn-primary:hover:not(:disabled) {
  opacity: 0.9;
  background: var(--ed-accent);
}
.ed-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Metrics Row */
.ed-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-top: 14px;
}
.ed-metric-card {
  background: var(--ed-bg-base);
  border: 1px solid var(--ed-border1);
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
}
.ed-metric-label {
  font-size: 11px;
  color: var(--ed-text2);
  margin-bottom: 4px;
}
.ed-metric-val {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--ed-text1);
}
.ed-metric-sub {
  font-size: 11px;
  color: var(--ed-text2);
  margin-top: 2px;
}

/* Toolbar & Filters */
.ed-toolbar {
  padding: 10px 24px;
  border-bottom: 1px solid var(--ed-border1);
  background: var(--ed-bg-layer1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  flex-shrink: 0;
}
.ed-tags-group {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.ed-tag-pill {
  border: 1px solid var(--ed-border1);
  background: var(--ed-bg-base);
  color: var(--ed-text2);
  padding: 3px 10px;
  border-radius: 14px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
}
.ed-tag-pill.active {
  background: var(--ed-accent);
  color: #fff;
  border-color: var(--ed-accent);
  font-weight: 550;
}
.ed-search-box {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--ed-bg-base);
  border: 1px solid var(--ed-border1);
  border-radius: 6px;
  padding: 4px 10px;
  min-width: 240px;
}
.ed-search-box input {
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 12px;
  outline: none;
  width: 100%;
}

/* Main Split View */
.ed-main-split {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* Left Case List */
.ed-list-pane {
  width: 440px;
  min-width: 360px;
  border-right: 1px solid var(--ed-border1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--ed-bg-base);
}
.ed-list-header {
  padding: 8px 16px;
  border-bottom: 1px solid var(--ed-border1);
  background: var(--ed-bg-layer1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: var(--ed-text2);
}
.ed-case-cards {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ed-case-card {
  padding: 10px 12px;
  border: 1px solid var(--ed-border1);
  border-radius: 8px;
  background: var(--ed-bg-base);
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ed-case-card:hover {
  background: var(--ed-bg-layer1);
  border-color: var(--ed-border2);
}
.ed-case-card.active {
  background: color-mix(in srgb, var(--ed-accent) 6%, var(--ed-bg-base));
  border-color: var(--ed-accent);
}
.ed-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.ed-score-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--ed-bg-layer2);
}
.ed-score-100 { background: #e8ffea; color: #008020; border: 1px solid #b7f4be; }
.ed-score-high { background: #e8f3ff; color: #0e5fd8; border: 1px solid #badaff; }
.ed-score-mid { background: #fff7e6; color: #d46b08; border: 1px solid #ffd591; }

.ed-category-tag {
  font-size: 10px;
  color: var(--ed-text2);
  background: var(--ed-bg-layer2);
  padding: 2px 6px;
  border-radius: 4px;
}
.ed-card-title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--ed-text1);
}
.ed-reasons-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.ed-reason-pill {
  font-size: 10px;
  color: var(--ed-text2);
  background: var(--ed-bg-layer1);
  padding: 1px 5px;
  border-radius: 3px;
  border: 1px solid var(--ed-border1);
}
.ed-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 10px;
  color: var(--ed-text2);
  margin-top: 2px;
}

/* Right Detail Pane */
.ed-detail-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--ed-bg-base);
}
.ed-detail-header {
  padding: 14px 20px;
  border-bottom: 1px solid var(--ed-border1);
  background: var(--ed-bg-layer1);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.ed-detail-title h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
  color: var(--ed-text1);
}
.ed-detail-sub {
  margin: 4px 0 0;
  font-size: 11px;
  color: var(--ed-text2);
  display: flex;
  gap: 12px;
  align-items: center;
}
.ed-tabs-row {
  display: flex;
  border-bottom: 1px solid var(--ed-border1);
  padding: 0 20px;
  background: var(--ed-bg-layer1);
  gap: 16px;
}
.ed-tab-btn {
  padding: 8px 0;
  font-size: 12px;
  font-weight: 500;
  color: var(--ed-text2);
  background: none;
  border: none;
  cursor: pointer;
  position: relative;
}
.ed-tab-btn.active {
  color: var(--ed-accent);
  font-weight: 600;
}
.ed-tab-btn.active::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--ed-accent);
  border-radius: 2px 2px 0 0;
}

.ed-detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 18px 24px;
}

/* Sections */
.ed-section {
  margin-bottom: 18px;
}
.ed-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.ed-section-head h3 {
  margin: 0;
  font-size: 12px;
  font-weight: 650;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--ed-text2);
}
.ed-copy-btn {
  font-size: 11px;
  background: none;
  border: none;
  color: var(--ed-accent);
  cursor: pointer;
  padding: 0;
}
.ed-copy-btn:hover { text-decoration: underline; }

.ed-code-box {
  background: var(--ed-bg-layer1);
  border: 1px solid var(--ed-border1);
  border-radius: 6px;
  padding: 12px 14px;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 320px;
  overflow-y: auto;
}
.ed-answer-box {
  background: var(--ed-bg-layer1);
  border: 1px solid var(--ed-border1);
  border-radius: 6px;
  padding: 14px 16px;
  font-size: 13px;
  line-height: 1.6;
  max-height: 480px;
  overflow-y: auto;
}

/* Markdown Rendering Styles */
.ed-md-view {
  font-size: 13px;
  line-height: 1.65;
  color: var(--ed-text1);
}
.ed-md-view h1, .ed-md-view h2, .ed-md-view h3, .ed-md-view h4 {
  margin: 14px 0 8px;
  font-weight: 650;
  line-height: 1.35;
  color: var(--ed-text1);
}
.ed-md-view h1 { font-size: 17px; border-bottom: 1px solid var(--ed-border1); padding-bottom: 6px; }
.ed-md-view h2 { font-size: 15px; border-bottom: 1px solid var(--ed-border1); padding-bottom: 4px; }
.ed-md-view h3 { font-size: 13.5px; }
.ed-md-view h4 { font-size: 13px; }
.ed-md-view p {
  margin: 6px 0;
}
.ed-inline-code {
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 0.9em;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--ed-bg-layer2);
  color: var(--ed-accent);
  border: 1px solid var(--ed-border1);
}
.ed-table-wrap {
  overflow-x: auto;
  margin: 10px 0;
  border-radius: 6px;
  border: 1px solid var(--ed-border1);
  background: var(--ed-bg-base);
}
.ed-md-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  text-align: left;
}
.ed-md-table th, .ed-md-table td {
  padding: 7px 11px;
  border-bottom: 1px solid var(--ed-border1);
  border-right: 1px solid var(--ed-border1);
  vertical-align: top;
}
.ed-md-table th:last-child, .ed-md-table td:last-child {
  border-right: none;
}
.ed-md-table tr:last-child td {
  border-bottom: none;
}
.ed-md-table th {
  background: var(--ed-bg-layer2);
  font-weight: 600;
  color: var(--ed-text2);
  white-space: nowrap;
}
.ed-md-table tr:hover {
  background: var(--ed-bg-layer1);
}
.ed-md-quote {
  margin: 8px 0;
  padding: 6px 12px;
  border-left: 3px solid var(--ed-accent);
  background: var(--ed-bg-layer2);
  border-radius: 0 4px 4px 0;
  color: var(--ed-text2);
}
.ed-md-view ul, .ed-md-view ol {
  margin: 6px 0 8px;
  padding-left: 20px;
}
.ed-md-view li {
  margin: 3px 0;
}
.ed-code-block {
  margin: 8px 0;
  padding: 10px 12px;
  border-radius: 6px;
  background: var(--ed-bg-layer2);
  border: 1px solid var(--ed-border1);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 12px;
  line-height: 1.45;
  overflow-x: auto;
  white-space: pre;
}

.ed-toggle-btn {
  font-size: 11px;
  border: 1px solid var(--ed-border1);
  background: var(--ed-bg-base);
  color: var(--ed-text2);
  border-radius: 4px;
  padding: 2px 8px;
  cursor: pointer;
  transition: all 0.15s;
}
.ed-toggle-btn.active {
  background: var(--ed-accent);
  color: #fff;
  border-color: var(--ed-accent);
}

/* Timeline Transcript */
.ed-msg-timeline {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ed-bubble {
  border: 1px solid var(--ed-border1);
  border-radius: 8px;
  overflow: hidden;
}
.ed-bubble-head {
  padding: 6px 12px;
  background: var(--ed-bg-layer2);
  border-bottom: 1px solid var(--ed-border1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 600;
}
.ed-bubble-user .ed-bubble-head { color: var(--ed-accent); }
.ed-bubble-assistant .ed-bubble-head { color: var(--ed-success); }
.ed-bubble-tool .ed-bubble-head { color: #8e44ad; }
.ed-bubble-body {
  padding: 10px 14px;
  font-size: 12px;
  line-height: 1.5;
  background: var(--ed-bg-base);
}

.ed-empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--ed-text2);
  gap: 10px;
}
`;

    // Markdown Parser & Component
    function renderInline(text) {
      if (!text) return [];
      const parts = text.split(/(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\)|\[.*?\])/g);
      const nodes = [];
      let k = 0;
      for (const part of parts) {
        if (!part) continue;
        if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
          nodes.push(h('strong', { key: k++, style: { fontWeight: 650, color: 'var(--ed-text1)' } }, part.slice(2, -2)));
        } else if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
          nodes.push(h('code', { key: k++, className: 'ed-inline-code' }, part.slice(1, -1)));
        } else if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
          const m = part.match(/^\[(.*?)\]\((.*?)\)$/);
          if (m) {
            nodes.push(h('a', { key: k++, href: m[2], target: '_blank', rel: 'noopener noreferrer', style: { color: 'var(--ed-accent)', textDecoration: 'none' } }, m[1]));
          } else {
            nodes.push(part);
          }
        } else if (part.startsWith('[') && part.endsWith(']')) {
          nodes.push(h('span', { key: k++, style: { background: 'var(--ed-bg-layer2)', padding: '1px 4px', borderRadius: '3px', fontSize: '11px', color: 'var(--ed-text2)' } }, part.slice(1, -1)));
        } else {
          nodes.push(part);
        }
      }
      return nodes;
    }

    function parseMarkdownBlocks(md) {
      if (!md) return [];
      const lines = md.replace(/\r\n/g, '\n').split('\n');
      const blocks = [];
      let inCode = false;
      let codeLang = '';
      let codeLines = [];
      let inTable = false;
      let tableLines = [];
      let inList = false;
      let listType = 'ul';
      let listItems = [];

      function flushList() {
        if (inList) {
          blocks.push({ type: listType, items: listItems });
          inList = false;
          listItems = [];
        }
      }

      function flushTable() {
        if (inTable) {
          if (tableLines.length >= 2) {
            const header = tableLines[0].split('|').slice(1, -1).map(c => c.trim());
            const rows = tableLines.slice(2).map(line => line.split('|').slice(1, -1).map(c => c.trim()));
            blocks.push({ type: 'table', header, rows });
          }
          inTable = false;
          tableLines = [];
        }
      }

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Code block toggle
        if (trimmed.startsWith('```')) {
          flushList();
          flushTable();
          if (inCode) {
            blocks.push({ type: 'code', lang: codeLang, content: codeLines.join('\n') });
            inCode = false;
            codeLines = [];
          } else {
            inCode = true;
            codeLang = trimmed.slice(3).trim();
            codeLines = [];
          }
          continue;
        }

        if (inCode) {
          codeLines.push(line);
          continue;
        }

        // Table line: starts and ends with |
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
          flushList();
          inTable = true;
          tableLines.push(trimmed);
          continue;
        } else if (inTable) {
          flushTable();
        }

        // Headers
        const hMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
        if (hMatch) {
          flushList();
          blocks.push({ type: 'header', level: hMatch[1].length, text: hMatch[2] });
          continue;
        }

        // Blockquote
        if (trimmed.startsWith('> ')) {
          flushList();
          blocks.push({ type: 'quote', text: trimmed.slice(2) });
          continue;
        }

        // List item
        const ulMatch = trimmed.match(/^[-*•]\s+(.*)$/);
        if (ulMatch) {
          if (!inList || listType !== 'ul') {
            flushList();
            inList = true;
            listType = 'ul';
          }
          listItems.push(ulMatch[1]);
          continue;
        }

        const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (olMatch) {
          if (!inList || listType !== 'ol') {
            flushList();
            inList = true;
            listType = 'ol';
          }
          listItems.push(olMatch[2]);
          continue;
        }

        // Empty line
        if (!trimmed) {
          flushList();
          continue;
        }

        // Paragraph
        flushList();
        blocks.push({ type: 'p', text: trimmed });
      }

      flushList();
      flushTable();

      return blocks;
    }

    function MarkdownView({ content }) {
      if (!content) return h('span', { style: { color: 'var(--ed-text2)' } }, '无内容');
      const blocks = parseMarkdownBlocks(content);

      return h('div', { className: 'ed-md-view' },
        blocks.map((b, i) => {
          if (b.type === 'header') {
            const Tag = `h${Math.min(4, b.level)}`;
            return h(Tag, { key: i }, renderInline(b.text));
          }
          if (b.type === 'quote') {
            return h('blockquote', { key: i, className: 'ed-md-quote' }, renderInline(b.text));
          }
          if (b.type === 'code') {
            return h('pre', { key: i, className: 'ed-code-block' },
              h('code', null, b.content)
            );
          }
          if (b.type === 'table') {
            return h('div', { key: i, className: 'ed-table-wrap' },
              h('table', { className: 'ed-md-table' },
                h('thead', null,
                  h('tr', null, b.header.map((col, cIdx) => h('th', { key: cIdx }, renderInline(col))))
                ),
                h('tbody', null,
                  b.rows.map((row, rIdx) => h('tr', { key: rIdx },
                    row.map((cell, cIdx) => h('td', { key: cIdx }, renderInline(cell)))
                  ))
                )
              )
            );
          }
          if (b.type === 'ul') {
            return h('ul', { key: i },
              b.items.map((it, itIdx) => h('li', { key: itIdx }, renderInline(it)))
            );
          }
          if (b.type === 'ol') {
            return h('ol', { key: i },
              b.items.map((it, itIdx) => h('li', { key: itIdx }, renderInline(it)))
            );
          }
          return h('p', { key: i }, renderInline(b.text));
        })
      );
    }

    function Glyph({ kind = 'dataset', size = 16 }) {
      const paths = {
        dataset: 'M4 6h16M4 10h16M4 14h16M4 18h16',
        filter: 'M3 4h18l-7 8v6l-4 2v-8L3 4z',
        refresh: 'M20 7v5h-5 M4 17v-5h5 M6 7a7 7 0 0 1 12-2l2 3 M4 16l2 3a7 7 0 0 0 12-2',
        download: 'M12 3v13m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2',
        check: 'M5 13l4 4L19 7',
        copy: 'M8 4v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.242a2 2 0 0 0-.602-1.43L16.08 2.57A2 2 0 0 0 14.65 2H10a2 2 0 0 0-2 2z'
      };
      return h('svg', {
        width: size, height: size, viewBox: '0 0 24 24',
        fill: 'none', stroke: 'currentColor', strokeWidth: 1.6,
        strokeLinecap: 'round', strokeLinejoin: 'round',
        'aria-hidden': true
      }, h('path', { d: paths[kind] || paths.dataset }));
    }

    function SidebarIcon({ size = 20 }) {
      return h('svg', {
        width: size, height: size, viewBox: '0 0 24 24',
        fill: 'none', stroke: 'currentColor', strokeWidth: 1.7,
        strokeLinecap: 'round', strokeLinejoin: 'round',
        'aria-hidden': true
      },
        // Clipboard outline
        h('path', { d: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2' }),
        h('rect', { x: 9, y: 3, width: 6, height: 4, rx: 1 }),
        // Checkmarks inside representing evaluation test cases
        h('path', { d: 'M9 12l2 2 4-4' }),
        h('path', { d: 'M9 17h6' })
      );
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register('evalDataset', 'zh', {
          '评测集': '评测集',
          'KuaiBuddy 评测集提取': 'KuaiBuddy 评测集提取',
          '从前一日客服对话中自动挖掘高价值对话构建评测集': '从前一日客服对话中自动挖掘高价值对话构建评测集'
        }));
        ctx.effect(() => ctx.locale.register('evalDataset', 'en', {
          '评测集': 'Eval Dataset',
          'KuaiBuddy 评测集提取': 'KuaiBuddy Eval Dataset',
          '从前一日客服对话中自动挖掘高价值对话构建评测集': 'Extract high-value evaluation test cases from KuaiBuddy conversations'
        }));

        function App() {
          // Default to yesterday
          const yesterdayStr = React.useMemo(() => {
            const d = new Date(Date.now() - 86400000);
            return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });
          }, []);

          const [date, setDate] = React.useState(yesterdayStr);
          const [data, setData] = React.useState(null);
          const [loading, setLoading] = React.useState(true);
          const [error, setError] = React.useState('');
          const [selectedCategory, setSelectedCategory] = React.useState('全部');
          const [minScore, setMinScore] = React.useState(60);
          const [searchQuery, setSearchQuery] = React.useState('');
          const [selectedCaseId, setSelectedCaseId] = React.useState(null);
          const [selectedIds, setSelectedIds] = React.useState(new Set());
          const [activeTab, setActiveTab] = React.useState('case'); // 'case' | 'timeline'
          const [answerViewMode, setAnswerViewMode] = React.useState('preview'); // 'preview' | 'raw'
          const [copied, setCopied] = React.useState('');

          // Load data
          const loadData = React.useCallback(async (force = false) => {
            setLoading(true);
            setError('');
            try {
              const res = await fetch(`/api/eval-dataset?action=${force ? 'extract' : 'get_data'}&date=${date}&minScore=${minScore}`);
              if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || `HTTP ${res.status}`);
              }
              const json = await res.json();
              setData(json);
              if (json.cases && json.cases.length > 0) {
                setSelectedCaseId(json.cases[0].id);
                // select all by default
                setSelectedIds(new Set(json.cases.map(c => c.id)));
              } else {
                setSelectedCaseId(null);
                setSelectedIds(new Set());
              }
            } catch (err) {
              setError(err.message);
            } finally {
              setLoading(false);
            }
          }, [date, minScore]);

          React.useEffect(() => {
            loadData(false);
          }, [loadData]);

          const summary = data?.summary || {
            totalRawSessions: 0,
            noiseFilteredOut: 0,
            evaluatedCandidates: 0,
            extractedCount: 0,
            withToolCallsCount: 0,
            avgScore: 0,
            categoryBreakdown: {}
          };

          const allCases = data?.cases || [];

          // Filtering
          const filteredCases = React.useMemo(() => {
            return allCases.filter(c => {
              if (selectedCategory !== '全部' && c.category !== selectedCategory) return false;
              if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTitle = (c.title || '').toLowerCase().includes(q);
                const matchPrompt = (c.userPrompt || '').toLowerCase().includes(q);
                const matchTools = (c.toolNames || []).some(t => t.toLowerCase().includes(q));
                if (!matchTitle && !matchPrompt && !matchTools) return false;
              }
              return true;
            });
          }, [allCases, selectedCategory, searchQuery]);

          const activeCase = React.useMemo(() => {
            return allCases.find(c => c.id === selectedCaseId) || filteredCases[0] || null;
          }, [allCases, selectedCaseId, filteredCases]);

          // Handle Copy
          const copyToClipboard = (text, label) => {
            navigator.clipboard.writeText(text);
            setCopied(label);
            setTimeout(() => setCopied(''), 2000);
          };

          // Handle Export
          const handleExport = async (format) => {
            const casesToExport = allCases.filter(c => selectedIds.has(c.id));
            if (casesToExport.length === 0) {
              alert('请至少勾选一条评测用例');
              return;
            }
            try {
              const res = await fetch('/api/eval-dataset?action=export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ format, cases: casesToExport })
              });
              const json = await res.json();
              const blob = new Blob([json.content], { type: 'text/plain;charset=utf-8' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `kuaibuddy_eval_dataset_${date}_${casesToExport.length}cases.${format === 'alpaca' ? 'json' : format}`;
              a.click();
            } catch (err) {
              alert('导出失败: ' + err.message);
            }
          };

          // Toggle Select All
          const toggleSelectAll = () => {
            if (selectedIds.size === filteredCases.length) {
              setSelectedIds(new Set());
            } else {
              setSelectedIds(new Set(filteredCases.map(c => c.id)));
            }
          };

          const toggleSelectOne = (id, e) => {
            e.stopPropagation();
            setSelectedIds(prev => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
            });
          };

          const categories = ['全部', ...Object.keys(summary.categoryBreakdown || {})];

          return h('div', { className: 'ed-app' },
            h('style', null, css),

            // 1. Header
            h('div', { className: 'ed-header' },
              h('div', { className: 'ed-header-top' },
                h('div', { className: 'ed-title-group' },
                  h('div', { className: 'ed-logo-badge' }, h(Glyph, { kind: 'dataset', size: 22 })),
                  h('div', null,
                    h('h1', null, 'KuaiBuddy 评测集提取'),
                    h('p', { className: 'ed-subtitle' }, `调用 /kuaibuddy-staff 接口，自动挖掘前一日客服对话并构建高价值评测用例`)
                  )
                ),
                h('div', { className: 'ed-header-actions' },
                  h('div', { className: 'ed-date-selector' },
                    h('span', { style: { fontSize: '11px', color: 'var(--ed-text2)' } }, '日期:'),
                    h('input', {
                      type: 'date',
                      value: date,
                      onChange: e => setDate(e.target.value)
                    }),
                    h('button', {
                      className: 'ed-btn',
                      style: { padding: '2px 6px', fontSize: '11px' },
                      onClick: () => setDate(yesterdayStr)
                    }, '设为昨天')
                  ),
                  h('button', {
                    className: 'ed-btn',
                    disabled: loading,
                    onClick: () => loadData(true)
                  }, h(Glyph, { kind: 'refresh', size: 13 }), loading ? '正在提取...' : '重新提取'),
                  h('button', {
                    className: 'ed-btn ed-btn-primary',
                    disabled: selectedIds.size === 0,
                    onClick: () => handleExport('json')
                  }, h(Glyph, { kind: 'download', size: 13 }), `导出评测集 (${selectedIds.size})`),
                  h('button', {
                    className: 'ed-btn',
                    disabled: selectedIds.size === 0,
                    onClick: () => handleExport('jsonl')
                  }, 'JSONL'),
                  h('button', {
                    className: 'ed-btn',
                    disabled: selectedIds.size === 0,
                    onClick: () => handleExport('alpaca')
                  }, 'Alpaca')
                )
              ),

              // 2. Metrics Bar
              h('div', { className: 'ed-metrics' },
                h('div', { className: 'ed-metric-card' },
                  h('span', { className: 'ed-metric-label' }, '昨日会话总量'),
                  h('span', { className: 'ed-metric-val' }, summary.totalRawSessions),
                  h('span', { className: 'ed-metric-sub' }, `清洗排除脚本探测 ${summary.noiseFilteredOut} 条`)
                ),
                h('div', { className: 'ed-metric-card' },
                  h('span', { className: 'ed-metric-label' }, '提取评测用例'),
                  h('span', { className: 'ed-metric-val', style: { color: 'var(--ed-accent)' } }, summary.extractedCount),
                  h('span', { className: 'ed-metric-sub' }, `已结构化去重并归并同类`)
                ),
                h('div', { className: 'ed-metric-card' },
                  h('span', { className: 'ed-metric-label' }, '工具调用评测'),
                  h('span', { className: 'ed-metric-val', style: { color: 'var(--ed-success)' } }, summary.withToolCallsCount),
                  h('span', { className: 'ed-metric-sub' }, `包含多步工具排障推理场景`)
                ),
                h('div', { className: 'ed-metric-card' },
                  h('span', { className: 'ed-metric-label' }, '平均价值评分'),
                  h('span', { className: 'ed-metric-val', style: { color: 'var(--ed-warn)' } }, `${summary.avgScore} 分`),
                  h('span', { className: 'ed-metric-sub' }, `最低准入门槛 ≥ ${minScore} 分`)
                )
              )
            ),

            // 3. Toolbar & Filters
            h('div', { className: 'ed-toolbar' },
              h('div', { className: 'ed-tags-group' },
                categories.map(cat => h('button', {
                  key: cat,
                  className: `ed-tag-pill ${selectedCategory === cat ? 'active' : ''}`,
                  onClick: () => setSelectedCategory(cat)
                }, cat === '全部' ? `全部 (${allCases.length})` : `${cat} (${summary.categoryBreakdown[cat] || 0})`))
              ),
              h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } },
                h('div', { className: 'ed-search-box' },
                  h(Glyph, { kind: 'filter', size: 12 }),
                  h('input', {
                    placeholder: '搜索评测标题、用户提问或工具...',
                    value: searchQuery,
                    onChange: e => setSearchQuery(e.target.value)
                  })
                )
              )
            ),

            // Error display
            error && h('div', {
              style: { padding: '10px 24px', background: 'var(--ed-error)', color: '#fff', fontSize: '12px' }
            }, `加载失败: ${error}`),

            // 4. Main Split View
            h('div', { className: 'ed-main-split' },
              // Left Column: Case List
              h('div', { className: 'ed-list-pane' },
                h('div', { className: 'ed-list-header' },
                  h('span', null, `用例列表 (${filteredCases.length})`),
                  h('button', {
                    className: 'ed-copy-btn',
                    onClick: toggleSelectAll
                  }, selectedIds.size === filteredCases.length ? '取消全选' : '全选')
                ),
                h('div', { className: 'ed-case-cards' },
                  filteredCases.length === 0 && !loading && h('div', { className: 'ed-empty-state' }, '无匹配评测用例'),
                  filteredCases.map(c => {
                    const isSelected = selectedCaseId === c.id;
                    const isChecked = selectedIds.has(c.id);
                    const scoreClass = c.valueScore >= 95 ? 'ed-score-100' : (c.valueScore >= 80 ? 'ed-score-high' : 'ed-score-mid');
                    return h('div', {
                      key: c.id,
                      className: `ed-case-card ${isSelected ? 'active' : ''}`,
                      onClick: () => setSelectedCaseId(c.id)
                    },
                      h('div', { className: 'ed-card-head' },
                        h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px' } },
                          h('input', {
                            type: 'checkbox',
                            checked: isChecked,
                            onChange: e => toggleSelectOne(c.id, e)
                          }),
                          h('span', { className: `ed-score-badge ${scoreClass}` }, `${c.valueScore}分`),
                          h('span', { className: 'ed-category-tag' }, c.category)
                        ),
                        c.toolCallsCount > 0 && h('span', {
                          style: { fontSize: '10px', color: 'var(--ed-accent)', fontWeight: '600' }
                        }, `🔧 ${c.toolCallsCount}次工具`)
                      ),
                      h('div', { className: 'ed-card-title' }, c.title),
                      h('div', { className: 'ed-reasons-strip' },
                        c.valueReasons.slice(0, 3).map((r, i) => h('span', { key: i, className: 'ed-reason-pill' }, r))
                      ),
                      h('div', { className: 'ed-card-meta' },
                        h('span', null, `${c.turnsCount} 轮对话 · ${c.modelId || 'M3.1'}`),
                        h('span', null, (c.createdAt || '').slice(11, 16))
                      )
                    );
                  })
                )
              ),

              // Right Column: Detail Inspector
              h('div', { className: 'ed-detail-pane' },
                !activeCase ? h('div', { className: 'ed-empty-state' }, '请在左侧选择一个评测用例') : [
                  // Detail Header
                  h('div', { key: 'head', className: 'ed-detail-header' },
                    h('div', { className: 'ed-detail-title' },
                      h('h2', null, activeCase.title),
                      h('div', { className: 'ed-detail-sub' },
                        h('span', null, `评测 ID: ${activeCase.id}`),
                        h('span', null, `分类: ${activeCase.category}`),
                        h('span', null, `价值评分: ${activeCase.valueScore}分`),
                        h('span', null, `创建时间: ${activeCase.createdAt}`)
                      )
                    ),
                    h('div', { style: { display: 'flex', gap: '8px' } },
                      h('button', {
                        className: 'ed-btn',
                        onClick: () => copyToClipboard(JSON.stringify(activeCase, null, 2), 'case')
                      }, h(Glyph, { kind: 'copy', size: 12 }), copied === 'case' ? '已复制 JSON' : '复制用例 JSON')
                    )
                  ),

                  // Detail Tabs
                  h('div', { key: 'tabs', className: 'ed-tabs-row' },
                    h('button', {
                      className: `ed-tab-btn ${activeTab === 'case' ? 'active' : ''}`,
                      onClick: () => setActiveTab('case')
                    }, '评测输入与标准答案'),
                    h('button', {
                      className: `ed-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`,
                      onClick: () => setActiveTab('timeline')
                    }, `完整对话回放 (${activeCase.messages.length})`)
                  ),

                  // Detail Body
                  h('div', { key: 'body', className: 'ed-detail-body' },
                    activeTab === 'case' ? [
                      // Section 1: User Prompt
                      h('div', { key: 's1', className: 'ed-section' },
                        h('div', { className: 'ed-section-head' },
                          h('h3', null, '评测输入 (Instruction / Prompt)'),
                          h('button', {
                            className: 'ed-copy-btn',
                            onClick: () => copyToClipboard(activeCase.userPrompt, 'prompt')
                          }, copied === 'prompt' ? '已复制' : '复制')
                        ),
                        h('div', { className: 'ed-code-box' }, activeCase.userPrompt)
                      ),

                      // Section 2: Reference Answer with Markdown parsing
                      h('div', { key: 's2', className: 'ed-section' },
                        h('div', { className: 'ed-section-head' },
                          h('h3', null, '参考标准答案 (Reference Answer)'),
                          h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
                            h('div', { style: { display: 'flex', gap: '4px' } },
                              h('button', {
                                className: `ed-toggle-btn ${answerViewMode === 'preview' ? 'active' : ''}`,
                                onClick: () => setAnswerViewMode('preview')
                              }, 'Markdown 渲染'),
                              h('button', {
                                className: `ed-toggle-btn ${answerViewMode === 'raw' ? 'active' : ''}`,
                                onClick: () => setAnswerViewMode('raw')
                              }, '原始文本')
                            ),
                            h('button', {
                              className: 'ed-copy-btn',
                              onClick: () => copyToClipboard(activeCase.referenceAnswer, 'answer')
                            }, copied === 'answer' ? '已复制' : '复制答案')
                          )
                        ),
                        h('div', { className: 'ed-answer-box' },
                          answerViewMode === 'preview'
                            ? h(MarkdownView, { content: activeCase.referenceAnswer })
                            : h('pre', { style: { margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' } }, activeCase.referenceAnswer || '无助理回复')
                        )
                      ),

                      // Section 3: Evaluation Rationale
                      h('div', { key: 's3', className: 'ed-section' },
                        h('div', { className: 'ed-section-head' },
                          h('h3', null, '入选评测集价值依据')
                        ),
                        h('div', { className: 'ed-reasons-strip', style: { gap: '8px' } },
                          activeCase.valueReasons.map((r, i) => h('span', {
                            key: i,
                            className: 'ed-reason-pill',
                            style: { padding: '4px 8px', fontSize: '12px' }
                          }, `✓ ${r}`))
                        ),
                        activeCase.toolNames.length > 0 && h('div', { style: { marginTop: '10px', fontSize: '12px' } },
                          h('span', { style: { color: 'var(--ed-text2)' } }, '涉及工具列表: '),
                          activeCase.toolNames.map((tn, i) => h('code', {
                            key: i,
                            style: { margin: '0 4px', background: 'var(--ed-bg-layer2)', padding: '2px 6px', borderRadius: '4px' }
                          }, tn))
                        )
                      )
                    ] : [
                      // Timeline Transcript with Markdown support for assistant
                      h('div', { key: 'timeline', className: 'ed-msg-timeline' },
                        activeCase.messages.map((m, idx) => {
                          const roleClass = m.role === 'user' ? 'ed-bubble-user' : (m.role === 'assistant' ? 'ed-bubble-assistant' : 'ed-bubble-tool');
                          return h('div', { key: idx, className: `ed-bubble ${roleClass}` },
                            h('div', { className: 'ed-bubble-head' },
                              h('span', null, m.role === 'user' ? '👤 客户 / 访客提问' : (m.role === 'assistant' ? '🤖 客服助理回复' : (m.role === 'tool' ? `🔧 工具执行: ${m.toolName || '未命名'}` : `🧠 模型思考推理 (${m.role})`))),
                              h('span', { style: { fontWeight: 'normal', color: 'var(--ed-text2)' } }, (m.createdAt || '').slice(11, 19))
                            ),
                            h('div', { className: 'ed-bubble-body' },
                              m.role === 'tool' ? [
                                m.toolArgs && h('div', { key: 'args', style: { marginBottom: '6px' } },
                                  h('strong', null, '入参: '),
                                  h('code', { style: { background: 'var(--ed-bg-layer2)', padding: '2px 4px', borderRadius: '3px' } }, m.toolArgs)
                                ),
                                m.toolResult && h('div', { key: 'res' },
                                  h('strong', null, '结果: '),
                                  h('pre', { style: { margin: '4px 0 0', maxHeight: '150px', overflowY: 'auto' } }, m.toolResult)
                                )
                              ] : (m.role === 'assistant' ? h(MarkdownView, { content: m.content }) : m.content)
                            )
                          );
                        })
                      )
                    ]
                  )
                ]
              )
            )
          );
        }

        // Register slots
        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: 'eval-dataset'
        }, App));

        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: 'eval-dataset',
          order: 17,
          label: () => ctx.locale.bind('evalDataset')('评测集')
        }, SidebarIcon));
      }
    };
  }
});
