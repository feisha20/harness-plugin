window.__ModuleLoader__.load({
  id: '@local/langfuse-dashboard',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const API_BASE = '/api/langfuse-dashboard';

    const css = `
.lfd-root {
  --lfd-bg: var(--dsw-alias-bg-base, #f6f7f9);
  --lfd-surface: var(--dsw-alias-bg-layer-1, #ffffff);
  --lfd-surface-2: var(--dsw-alias-bg-layer-2, #f1f3f7);
  --lfd-overlay: var(--dsw-alias-bg-overlay, #ffffff);
  --lfd-border: var(--dsw-alias-border-l1, rgba(15, 23, 42, 0.1));
  --lfd-border-strong: var(--dsw-alias-border-l2, rgba(15, 23, 42, 0.18));
  --lfd-brand: var(--dsw-alias-brand-primary, #4f46e5);
  --lfd-text: var(--dsw-alias-label-primary, #0f172a);
  --lfd-muted: var(--dsw-alias-label-secondary, #64748b);
  --lfd-error: var(--dsw-alias-state-error-primary, #dc2626);
  --lfd-success: var(--dsw-alias-state-success-primary, #059669);
  --lfd-warn: var(--dsw-alias-state-warn-primary, #d97706);
  --lfd-agent: #6366f1;
  --lfd-llm: #2563eb;
  --lfd-tool: #059669;
  --lfd-span: #64748b;
  --lfd-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: var(--lfd-bg);
  color: var(--lfd-text);
  font: 13px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif;
  font-variant-numeric: tabular-nums;
}
.lfd-root *, .lfd-root *::before, .lfd-root *::after { box-sizing: border-box; }
.lfd-root h1, .lfd-root h2, .lfd-root h3, .lfd-root h4, .lfd-root p, .lfd-root pre { margin: 0; }
.lfd-root :focus-visible { outline: 2px solid var(--lfd-brand); outline-offset: 2px; }

.lfd-header {
  flex: none;
  background: var(--lfd-surface);
  border-bottom: 1px solid var(--lfd-border);
  padding: 12px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.lfd-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.lfd-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.lfd-logo {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: linear-gradient(135deg, #1e293b, #312e81);
  color: #7dd3fc;
  display: grid;
  place-items: center;
  flex: none;
}
.lfd-title-wrap { min-width: 0; }
.lfd-title-wrap h1 {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.25;
}
.lfd-subtitle {
  font-size: 11.5px;
  color: var(--lfd-muted);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.lfd-env-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.lfd-env-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid var(--lfd-border-strong);
  background: var(--lfd-surface-2);
  color: var(--lfd-text);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.lfd-env-pill:hover { border-color: var(--lfd-brand); }
.lfd-env-pill[aria-pressed="true"] {
  background: color-mix(in srgb, var(--lfd-brand) 14%, var(--lfd-surface));
  border-color: var(--lfd-brand);
  color: var(--lfd-brand);
}
.lfd-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--lfd-muted);
  flex: none;
}
.lfd-dot.ok { background: var(--lfd-success); }
.lfd-dot.err { background: var(--lfd-error); }

.lfd-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 12px;
  min-height: 32px;
  border-radius: 8px;
  border: 1px solid var(--lfd-border-strong);
  background: var(--lfd-surface);
  color: var(--lfd-text);
  font: inherit;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  text-decoration: none;
}
.lfd-btn:hover:not(:disabled) {
  border-color: var(--lfd-brand);
  background: color-mix(in srgb, var(--lfd-brand) 7%, var(--lfd-surface));
}
.lfd-btn:disabled { opacity: 0.55; cursor: default; }
.lfd-btn.primary {
  background: var(--lfd-brand);
  border-color: var(--lfd-brand);
  color: #ffffff;
}
.lfd-btn.primary:hover:not(:disabled) {
  filter: brightness(1.08);
  background: var(--lfd-brand);
}
.lfd-btn.danger {
  color: var(--lfd-error);
  border-color: color-mix(in srgb, var(--lfd-error) 40%, var(--lfd-border));
}
.lfd-btn.sm {
  min-height: 26px;
  padding: 3px 8px;
  font-size: 11.5px;
  border-radius: 6px;
}
.lfd-btn.ghost {
  border-color: transparent;
  background: transparent;
}
.lfd-btn.ghost:hover:not(:disabled) {
  background: var(--lfd-surface-2);
  border-color: transparent;
}

.lfd-search-bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.lfd-search-row {
  display: flex;
  align-items: stretch;
  gap: 8px;
  flex-wrap: wrap;
}
.lfd-segmented {
  display: inline-flex;
  background: var(--lfd-surface-2);
  border: 1px solid var(--lfd-border);
  border-radius: 8px;
  padding: 2px;
  gap: 2px;
  flex: none;
}
.lfd-segmented button {
  border: 0;
  background: transparent;
  color: var(--lfd-muted);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
}
.lfd-segmented button[aria-pressed="true"] {
  background: var(--lfd-surface);
  color: var(--lfd-text);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}
.lfd-input-wrap {
  position: relative;
  flex: 1 1 280px;
  display: flex;
  align-items: center;
}
.lfd-input {
  width: 100%;
  min-height: 34px;
  padding: 6px 32px 6px 11px;
  border-radius: 8px;
  border: 1px solid var(--lfd-border-strong);
  background: var(--lfd-bg);
  color: var(--lfd-text);
  font: inherit;
  font-size: 12.5px;
}
.lfd-input.mono { font-family: var(--lfd-mono); }
.lfd-input-clear {
  position: absolute;
  right: 6px;
  border: 0;
  background: transparent;
  color: var(--lfd-muted);
  width: 22px;
  height: 22px;
  border-radius: 5px;
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: 14px;
}
.lfd-input-clear:hover { background: var(--lfd-surface-2); color: var(--lfd-text); }

.lfd-subbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
.lfd-chip-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.lfd-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid var(--lfd-border);
  background: var(--lfd-surface-2);
  color: var(--lfd-muted);
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  max-width: 260px;
}
.lfd-chip:hover { border-color: var(--lfd-brand); color: var(--lfd-text); }
.lfd-chip[aria-pressed="true"] {
  background: color-mix(in srgb, var(--lfd-brand) 14%, var(--lfd-surface));
  border-color: var(--lfd-brand);
  color: var(--lfd-brand);
  font-weight: 600;
}
.lfd-chip-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--lfd-mono);
  font-size: 11px;
}

.lfd-banner {
  margin: 10px 18px 0;
  padding: 9px 12px;
  border-radius: 9px;
  border: 1px solid var(--lfd-border);
  background: var(--lfd-surface);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 12.5px;
}
.lfd-banner.error {
  border-color: color-mix(in srgb, var(--lfd-error) 45%, var(--lfd-border));
  background: color-mix(in srgb, var(--lfd-error) 8%, var(--lfd-surface));
  color: var(--lfd-error);
}
.lfd-banner.success {
  border-color: color-mix(in srgb, var(--lfd-success) 45%, var(--lfd-border));
  background: color-mix(in srgb, var(--lfd-success) 8%, var(--lfd-surface));
  color: var(--lfd-success);
}

.lfd-workspace {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
}
.lfd-workspace.single {
  grid-template-columns: minmax(0, 1fr);
}
@media (max-width: 960px) {
  .lfd-workspace {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(200px, 38%) minmax(0, 1fr);
  }
}

.lfd-list-col {
  border-right: 1px solid var(--lfd-border);
  background: var(--lfd-surface);
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.lfd-list-head {
  padding: 10px 12px;
  border-bottom: 1px solid var(--lfd-border);
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.lfd-list-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  font-weight: 650;
}
.lfd-list-filters {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 11.5px;
  color: var(--lfd-muted);
}
.lfd-check {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  user-select: none;
}
.lfd-list-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.lfd-trace-card {
  text-align: left;
  width: 100%;
  border: 1px solid var(--lfd-border);
  background: var(--lfd-bg);
  color: var(--lfd-text);
  border-radius: 10px;
  padding: 10px 11px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.lfd-trace-card:hover { border-color: var(--lfd-border-strong); }
.lfd-trace-card[aria-selected="true"] {
  border-color: var(--lfd-brand);
  background: color-mix(in srgb, var(--lfd-brand) 8%, var(--lfd-surface));
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--lfd-brand) 30%, transparent);
}
.lfd-trace-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.lfd-trace-name {
  font-weight: 650;
  font-size: 12.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lfd-trace-prompt {
  font-size: 12px;
  color: var(--lfd-text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}
.lfd-trace-reply {
  font-size: 11.5px;
  color: var(--lfd-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lfd-trace-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 11px;
  color: var(--lfd-muted);
}

.lfd-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 6px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 600;
  background: var(--lfd-surface-2);
  color: var(--lfd-muted);
  border: 1px solid var(--lfd-border);
  white-space: nowrap;
}
.lfd-badge.agent { color: var(--lfd-agent); background: color-mix(in srgb, var(--lfd-agent) 12%, transparent); border-color: color-mix(in srgb, var(--lfd-agent) 30%, transparent); }
.lfd-badge.llm { color: var(--lfd-llm); background: color-mix(in srgb, var(--lfd-llm) 12%, transparent); border-color: color-mix(in srgb, var(--lfd-llm) 30%, transparent); }
.lfd-badge.tool { color: var(--lfd-tool); background: color-mix(in srgb, var(--lfd-tool) 12%, transparent); border-color: color-mix(in srgb, var(--lfd-tool) 30%, transparent); }
.lfd-badge.warn { color: var(--lfd-warn); background: color-mix(in srgb, var(--lfd-warn) 12%, transparent); border-color: color-mix(in srgb, var(--lfd-warn) 32%, transparent); }
.lfd-badge.err { color: var(--lfd-error); background: color-mix(in srgb, var(--lfd-error) 12%, transparent); border-color: color-mix(in srgb, var(--lfd-error) 32%, transparent); }
.lfd-badge.ok { color: var(--lfd-success); background: color-mix(in srgb, var(--lfd-success) 12%, transparent); border-color: color-mix(in srgb, var(--lfd-success) 32%, transparent); }
.lfd-badge.mono { font-family: var(--lfd-mono); }

.lfd-detail-col {
  min-width: 0;
  min-height: 0;
  overflow: auto;
  padding: 16px 20px 32px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.lfd-card {
  background: var(--lfd-surface);
  border: 1px solid var(--lfd-border);
  border-radius: 12px;
  padding: 14px 16px;
}
.lfd-detail-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.lfd-detail-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.lfd-detail-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.lfd-detail-title h2 {
  font-size: 16px;
  font-weight: 700;
}
.lfd-id-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.lfd-id-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: 7px;
  border: 1px solid var(--lfd-border);
  background: var(--lfd-surface-2);
  font-size: 11.5px;
}
.lfd-id-pill code {
  font-family: var(--lfd-mono);
  font-size: 11px;
  color: var(--lfd-text);
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lfd-kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(125px, 1fr));
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--lfd-border);
}
.lfd-kpi {
  background: var(--lfd-bg);
  border: 1px solid var(--lfd-border);
  border-radius: 8px;
  padding: 7px 10px;
}
.lfd-kpi-label { font-size: 11px; color: var(--lfd-muted); }
.lfd-kpi-val { font-size: 14.5px; font-weight: 700; margin-top: 2px; }
.lfd-kpi-sub { font-size: 11px; color: var(--lfd-muted); }

.lfd-tabs {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--lfd-border);
  flex-wrap: wrap;
}
.lfd-tab-list {
  display: flex;
  gap: 18px;
}
.lfd-tab-btn {
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--lfd-muted);
  font: inherit;
  font-size: 13px;
  font-weight: 650;
  padding: 8px 2px;
  cursor: pointer;
}
.lfd-tab-btn[aria-selected="true"] {
  color: var(--lfd-brand);
  border-bottom-color: var(--lfd-brand);
}

.lfd-flow {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.lfd-step {
  border: 1px solid var(--lfd-border);
  border-radius: 11px;
  background: var(--lfd-surface);
  overflow: hidden;
}
.lfd-step.user {
  border-left: 3px solid var(--lfd-brand);
}
.lfd-step.llm {
  border-left: 3px solid var(--lfd-llm);
}
.lfd-step.tool {
  border-left: 3px solid var(--lfd-tool);
}
.lfd-step.agent_output {
  border-left: 3px solid var(--lfd-agent);
  background: color-mix(in srgb, var(--lfd-agent) 4%, var(--lfd-surface));
}
.lfd-step.error {
  border-left: 3px solid var(--lfd-error);
  border-color: color-mix(in srgb, var(--lfd-error) 40%, var(--lfd-border));
}
.lfd-step-head {
  padding: 9px 13px;
  background: var(--lfd-surface-2);
  border-bottom: 1px solid var(--lfd-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  cursor: pointer;
  user-select: none;
}
.lfd-step-head:hover {
  background: color-mix(in srgb, var(--lfd-brand) 6%, var(--lfd-surface-2));
}
.lfd-step.collapsed .lfd-step-head {
  border-bottom: 0;
}
.lfd-step-caret {
  display: inline-block;
  width: 14px;
  text-align: center;
  font-size: 11px;
  color: var(--lfd-muted);
  transition: transform 0.14s ease;
  flex: none;
}
.lfd-step-preview {
  font-size: 12px;
  font-weight: 400;
  color: var(--lfd-muted);
  min-width: 0;
  flex: 1 1 160px;
  max-width: 480px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lfd-step-title {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
  font-weight: 650;
  font-size: 12.5px;
  min-width: 0;
  flex: 1 1 240px;
}
.lfd-md {
  font-size: 13px;
  line-height: 1.62;
  color: var(--lfd-text);
  word-break: break-word;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.lfd-md h1, .lfd-md h2, .lfd-md h3, .lfd-md h4, .lfd-md h5, .lfd-md h6 {
  margin: 4px 0 2px;
  font-weight: 700;
  line-height: 1.35;
}
.lfd-md h1 { font-size: 17px; }
.lfd-md h2 { font-size: 15.5px; }
.lfd-md h3 { font-size: 14px; }
.lfd-md h4, .lfd-md h5, .lfd-md h6 { font-size: 13px; }
.lfd-md p { margin: 0; }
.lfd-md ul, .lfd-md ol {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.lfd-md blockquote {
  margin: 0;
  padding: 6px 12px;
  border-left: 3px solid var(--lfd-brand);
  background: var(--lfd-bg);
  color: var(--lfd-muted);
  border-radius: 0 6px 6px 0;
}
.lfd-md hr {
  border: 0;
  border-top: 1px solid var(--lfd-border);
  margin: 4px 0;
}
.lfd-md code.inline {
  font-family: var(--lfd-mono);
  font-size: 12px;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--lfd-surface-2);
  border: 1px solid var(--lfd-border);
}
.lfd-md a {
  color: var(--lfd-brand);
  text-decoration: underline;
}
.lfd-md-table-wrap {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--lfd-border);
  border-radius: 8px;
  background: var(--lfd-bg);
}
.lfd-md-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
  line-height: 1.5;
}
.lfd-md-table th, .lfd-md-table td {
  padding: 7px 11px;
  border-bottom: 1px solid var(--lfd-border);
  border-right: 1px solid var(--lfd-border);
  vertical-align: top;
}
.lfd-md-table th:last-child, .lfd-md-table td:last-child { border-right: 0; }
.lfd-md-table tr:last-child td { border-bottom: 0; }
.lfd-md-table th {
  background: var(--lfd-surface-2);
  font-weight: 650;
  white-space: nowrap;
}
.lfd-md-table tbody tr:nth-child(even) {
  background: color-mix(in srgb, var(--lfd-surface-2) 45%, transparent);
}
.lfd-step-body {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.lfd-text-block {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 13px;
  line-height: 1.58;
}
.lfd-thinking {
  padding: 8px 11px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--lfd-warn) 8%, var(--lfd-bg));
  border: 1px dashed color-mix(in srgb, var(--lfd-warn) 35%, var(--lfd-border));
  font-size: 12px;
  color: var(--lfd-muted);
  white-space: pre-wrap;
  word-break: break-word;
}
.lfd-disclosure {
  border: 1px solid var(--lfd-border);
  border-radius: 8px;
  background: var(--lfd-bg);
}
.lfd-disclosure summary {
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--lfd-muted);
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.lfd-disclosure[open] summary {
  border-bottom: 1px solid var(--lfd-border);
  color: var(--lfd-text);
}
.lfd-code {
  margin: 0;
  padding: 10px 12px;
  font-family: var(--lfd-mono);
  font-size: 11.5px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-x: auto;
  max-height: 420px;
  overflow-y: auto;
  background: var(--lfd-bg);
  border-radius: 7px;
}
.lfd-io-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
@media (max-width: 860px) {
  .lfd-io-grid { grid-template-columns: minmax(0, 1fr); }
}
.lfd-io-box {
  border: 1px solid var(--lfd-border);
  border-radius: 8px;
  background: var(--lfd-bg);
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.lfd-io-box-head {
  padding: 5px 10px;
  border-bottom: 1px solid var(--lfd-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11.5px;
  font-weight: 650;
  color: var(--lfd-muted);
}

.lfd-tree-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.lfd-tree-table th {
  text-align: left;
  font-size: 11px;
  font-weight: 650;
  color: var(--lfd-muted);
  padding: 7px 10px;
  border-bottom: 1px solid var(--lfd-border);
}
.lfd-tree-row {
  cursor: pointer;
  border-bottom: 1px solid var(--lfd-border);
}
.lfd-tree-row:hover { background: var(--lfd-surface-2); }
.lfd-tree-row[aria-selected="true"] {
  background: color-mix(in srgb, var(--lfd-brand) 10%, var(--lfd-surface));
}
.lfd-tree-row td {
  padding: 7px 10px;
  vertical-align: middle;
}
.lfd-wf-track {
  position: relative;
  height: 14px;
  border-radius: 999px;
  background: var(--lfd-surface-2);
  min-width: 140px;
  overflow: hidden;
}
.lfd-wf-bar {
  position: absolute;
  top: 2px;
  bottom: 2px;
  border-radius: 999px;
  background: var(--lfd-brand);
}
.lfd-wf-bar.AGENT { background: var(--lfd-agent); }
.lfd-wf-bar.GENERATION { background: var(--lfd-llm); }
.lfd-wf-bar.TOOL { background: var(--lfd-tool); }
.lfd-wf-bar.SPAN { background: var(--lfd-span); }
.lfd-wf-bar.ERROR { background: var(--lfd-error); }

.lfd-empty {
  flex: 1;
  display: grid;
  place-items: center;
  padding: 36px 20px;
}
.lfd-empty-card {
  max-width: 560px;
  width: 100%;
  background: var(--lfd-surface);
  border: 1px solid var(--lfd-border);
  border-radius: 14px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.lfd-dialog {
  width: min(760px, calc(100vw - 32px));
  max-height: min(86vh, 760px);
  padding: 0;
  border: 1px solid var(--lfd-border-strong);
  border-radius: 14px;
  background: var(--lfd-overlay);
  color: var(--lfd-text);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.28);
}
.lfd-dialog::backdrop {
  background: rgba(15, 23, 42, 0.48);
  backdrop-filter: blur(2px);
}
.lfd-dialog-head {
  padding: 14px 18px;
  border-bottom: 1px solid var(--lfd-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.lfd-dialog-body {
  padding: 16px 18px;
  overflow: auto;
  max-height: calc(86vh - 60px);
  display: grid;
  grid-template-columns: 230px minmax(0, 1fr);
  gap: 16px;
}
@media (max-width: 680px) {
  .lfd-dialog-body { grid-template-columns: minmax(0, 1fr); }
}
.lfd-env-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.lfd-env-item {
  text-align: left;
  padding: 9px 10px;
  border-radius: 9px;
  border: 1px solid var(--lfd-border);
  background: var(--lfd-bg);
  color: var(--lfd-text);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.lfd-env-item[aria-selected="true"] {
  border-color: var(--lfd-brand);
  background: color-mix(in srgb, var(--lfd-brand) 9%, var(--lfd-surface));
}
.lfd-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.lfd-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.lfd-field label {
  font-size: 12px;
  font-weight: 600;
  color: var(--lfd-muted);
}
.lfd-form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 6px;
  border-top: 1px solid var(--lfd-border);
}
`;

    function Icon({ size = 18, active = false }) {
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: active ? 2.1 : 1.85,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
        },
        h('circle', { cx: 6, cy: 5, r: 2.5 }),
        h('circle', { cx: 15, cy: 12, r: 2.2 }),
        h('circle', { cx: 15, cy: 19, r: 2.2 }),
        h('path', { d: 'M6 7.5V19h6.8M6 12h6.8M17.2 12H21M17.2 19H20' }),
      );
    }

    function fmtTime(iso) {
      if (!iso) return '—';
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return String(iso);
      return d.toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    }

    function fmtFullTime(iso) {
      if (!iso) return '—';
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return String(iso);
      return d.toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        hour12: false,
      });
    }

    function fmtDuration(ms) {
      const n = Number(ms);
      if (!Number.isFinite(n) || n <= 0) return '0ms';
      if (n < 1000) return `${Math.round(n)}ms`;
      if (n < 60000) return `${(n / 1000).toFixed(2)}s`;
      const m = Math.floor(n / 60000);
      const s = ((n % 60000) / 1000).toFixed(1);
      return `${m}m ${s}s`;
    }

    function fmtNum(n) {
      const v = Number(n || 0);
      if (v >= 1000000) return `${(v / 1000000).toFixed(2)}M`;
      if (v >= 10000) return `${(v / 1000).toFixed(1)}K`;
      return v.toLocaleString('en-US');
    }

    function prettyJson(val) {
      if (val === null || val === undefined) return 'null';
      if (typeof val === 'string') return val;
      try {
        return JSON.stringify(val, null, 2);
      } catch {
        return String(val);
      }
    }

    function formatToolPayload(val) {
      if (val === null || val === undefined) return '';
      if (Array.isArray(val) && val.length === 1 && val[0]?.parsedText !== undefined) {
        return JSON.stringify(val[0].parsedText, null, 2);
      }
      if (Array.isArray(val) && val.length === 1 && typeof val[0]?.text === 'string') {
        return val[0].text;
      }
      return prettyJson(val);
    }

    function renderInlineMarkdown(text, keyPrefix = 'in') {
      const str = String(text || '');
      const nodes = [];
      const tokenRe = /(`[^`\n]+`|\*\*[^*\n]+?\*\*|__[^_\n]+?__|~~[^~\n]+?~~|\*[^*\n]+?\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|<br\s*\/?>)/gi;
      let lastIndex = 0;
      let match;
      let idx = 0;
      while ((match = tokenRe.exec(str)) !== null) {
        if (match.index > lastIndex) {
          nodes.push(str.slice(lastIndex, match.index));
        }
        const raw = match[0];
        const k = `${keyPrefix}-${idx++}`;
        if (/^<br\s*\/?>$/i.test(raw)) {
          nodes.push(h('br', { key: k }));
        } else if (raw.startsWith('`')) {
          nodes.push(h('code', { key: k, className: 'inline' }, raw.slice(1, -1)));
        } else if (raw.startsWith('**') || raw.startsWith('__')) {
          nodes.push(h('strong', { key: k }, renderInlineMarkdown(raw.slice(2, -2), k)));
        } else if (raw.startsWith('~~')) {
          nodes.push(h('del', { key: k }, renderInlineMarkdown(raw.slice(2, -2), k)));
        } else if (raw.startsWith('*')) {
          nodes.push(h('em', { key: k }, renderInlineMarkdown(raw.slice(1, -1), k)));
        } else if (match[2] && match[3]) {
          nodes.push(
            h(
              'a',
              { key: k, href: match[3], target: '_blank', rel: 'noopener noreferrer' },
              match[2],
            ),
          );
        } else {
          nodes.push(raw);
        }
        lastIndex = tokenRe.lastIndex;
      }
      if (lastIndex < str.length) {
        nodes.push(str.slice(lastIndex));
      }
      return nodes.length ? nodes : str;
    }

    function splitTableRow(line) {
      let s = line.trim();
      if (s.startsWith('|')) s = s.slice(1);
      if (s.endsWith('|')) s = s.slice(0, -1);
      const cells = [];
      let cur = '';
      for (let i = 0; i < s.length; i += 1) {
        if (s[i] === '\\' && s[i + 1] === '|') {
          cur += '|';
          i += 1;
        } else if (s[i] === '|') {
          cells.push(cur.trim());
          cur = '';
        } else {
          cur += s[i];
        }
      }
      cells.push(cur.trim());
      return cells;
    }

    function isTableSeparator(line) {
      const trimmed = line.trim();
      if (!trimmed.includes('|')) return false;
      const cells = splitTableRow(trimmed);
      return cells.length > 0 && cells.every((c) => /^:?-{1,}:?$/.test(c));
    }

    function parseAligns(line) {
      return splitTableRow(line).map((c) => {
        if (c.startsWith(':') && c.endsWith(':')) return 'center';
        if (c.endsWith(':')) return 'right';
        return 'left';
      });
    }

    function MarkdownView({ text, onCopy }) {
      const source = String(text || '').replace(/\r\n/g, '\n');
      const lines = source.split('\n');
      const blocks = [];
      let i = 0;
      let keySeq = 0;

      while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!trimmed) {
          i += 1;
          continue;
        }

        // Fenced code block
        if (trimmed.startsWith('```')) {
          const lang = trimmed.slice(3).trim();
          const codeLines = [];
          i += 1;
          while (i < lines.length && !lines[i].trim().startsWith('```')) {
            codeLines.push(lines[i]);
            i += 1;
          }
          if (i < lines.length) i += 1;
          const codeText = codeLines.join('\n');
          const bk = `code-${keySeq++}`;
          blocks.push(
            h(
              'div',
              { key: bk, className: 'lfd-io-box' },
              h(
                'div',
                { className: 'lfd-io-box-head' },
                h('span', null, lang || 'code'),
                onCopy &&
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'lfd-btn ghost sm',
                      style: { minHeight: 20, padding: '1px 6px', fontSize: 11 },
                      onClick: () => onCopy(bk, codeText),
                    },
                    '复制',
                  ),
              ),
              h('pre', { className: 'lfd-code' }, codeText),
            ),
          );
          continue;
        }

        // Horizontal rule
        if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
          blocks.push(h('hr', { key: `hr-${keySeq++}` }));
          i += 1;
          continue;
        }

        // Heading
        const hMatch = /^(#{1,6})\s+(.+)$/.exec(trimmed);
        if (hMatch) {
          const level = hMatch[1].length;
          blocks.push(h(`h${level}`, { key: `h-${keySeq++}` }, renderInlineMarkdown(hMatch[2], `h-${keySeq}`)));
          i += 1;
          continue;
        }

        // GFM Table
        if (line.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
          const headers = splitTableRow(line);
          const aligns = parseAligns(lines[i + 1]);
          i += 2;
          const bodyRows = [];
          while (i < lines.length && lines[i].trim() && lines[i].includes('|')) {
            bodyRows.push(splitTableRow(lines[i]));
            i += 1;
          }
          const tk = `tbl-${keySeq++}`;
          blocks.push(
            h(
              'div',
              { key: tk, className: 'lfd-md-table-wrap' },
              h(
                'table',
                { className: 'lfd-md-table' },
                h(
                  'thead',
                  null,
                  h(
                    'tr',
                    null,
                    headers.map((cell, ci) =>
                      h('th', { key: ci, style: { textAlign: aligns[ci] || 'left' } }, renderInlineMarkdown(cell, `${tk}-h-${ci}`)),
                    ),
                  ),
                ),
                h(
                  'tbody',
                  null,
                  bodyRows.map((row, ri) =>
                    h(
                      'tr',
                      { key: ri },
                      headers.map((_, ci) =>
                        h(
                          'td',
                          { key: ci, style: { textAlign: aligns[ci] || 'left' } },
                          renderInlineMarkdown(row[ci] ?? '', `${tk}-r-${ri}-${ci}`),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          );
          continue;
        }

        // Blockquote
        if (trimmed.startsWith('>')) {
          const quoteLines = [];
          while (i < lines.length && lines[i].trim().startsWith('>')) {
            quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
            i += 1;
          }
          blocks.push(
            h(
              'blockquote',
              { key: `bq-${keySeq++}` },
              quoteLines.map((ql, qi) => h('div', { key: qi }, renderInlineMarkdown(ql, `bq-${keySeq}-${qi}`))),
            ),
          );
          continue;
        }

        // Unordered list
        if (/^[-*+]\s+/.test(trimmed)) {
          const items = [];
          while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
            items.push(lines[i].replace(/^\s*[-*+]\s+/, ''));
            i += 1;
          }
          blocks.push(
            h(
              'ul',
              { key: `ul-${keySeq++}` },
              items.map((it, li) => h('li', { key: li }, renderInlineMarkdown(it, `ul-${keySeq}-${li}`))),
            ),
          );
          continue;
        }

        // Ordered list
        if (/^\d+\.\s+/.test(trimmed)) {
          const items = [];
          while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
            items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
            i += 1;
          }
          blocks.push(
            h(
              'ol',
              { key: `ol-${keySeq++}` },
              items.map((it, li) => h('li', { key: li }, renderInlineMarkdown(it, `ol-${keySeq}-${li}`))),
            ),
          );
          continue;
        }

        // Paragraph (stop before special block starters)
        const paraLines = [];
        while (i < lines.length) {
          const cur = lines[i];
          const curTrim = cur.trim();
          if (!curTrim) break;
          if (
            curTrim.startsWith('```') ||
            /^#{1,6}\s+/.test(curTrim) ||
            curTrim.startsWith('>') ||
            /^[-*+]\s+/.test(curTrim) ||
            /^\d+\.\s+/.test(curTrim) ||
            /^(\*{3,}|-{3,}|_{3,})$/.test(curTrim) ||
            (cur.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1]))
          ) {
            break;
          }
          paraLines.push(cur);
          i += 1;
        }
        blocks.push(
          h(
            'p',
            { key: `p-${keySeq++}` },
            paraLines.map((pl, pi) =>
              h(React.Fragment, { key: pi }, pi > 0 ? h('br') : null, renderInlineMarkdown(pl, `p-${keySeq}-${pi}`)),
            ),
          ),
        );
      }

      return h('div', { className: 'lfd-md' }, blocks);
    }

    function buildTraceMarkdown(trace) {
      const lines = [
        `## Trace: ${trace.title}`,
        `- traceId: \`${trace.traceId}\``,
        trace.runId ? `- run_id: \`${trace.runId}\`` : null,
        trace.sessionId ? `- sessionId: \`${trace.sessionId}\`` : null,
        trace.agentCode ? `- agent_code: \`${trace.agentCode}\`` : null,
        `- 时间: ${fmtFullTime(trace.startTime)} (${fmtDuration(trace.durationMs)})`,
        `- Token: total=${trace.usage.total} (input=${trace.usage.input}, cached=${trace.usage.cached}, output=${trace.usage.output}, reasoning=${trace.usage.reasoning})`,
        trace.langfuseUrl ? `- Langfuse: ${trace.langfuseUrl}` : null,
        '',
        trace.userPrompt ? `### 用户输入\n${trace.userPrompt}\n` : null,
        '### 执行链路',
      ].filter((x) => x !== null);

      for (const step of trace.flow) {
        if (step.kind === 'llm_step') {
          const calls = step.outputs.flatMap((o) => o.toolCalls || []).map((tc) => tc.name);
          lines.push(
            `- [LLM] ${step.title} (${fmtDuration(step.latencyMs)}, in=${step.usage.input}, out=${step.usage.output})` +
              (calls.length ? ` -> 调用工具: ${calls.join(', ')}` : ''),
          );
        } else if (step.kind === 'tool_step') {
          lines.push(
            `- [TOOL] ${step.title} (${fmtDuration(step.latencyMs)}, level=${step.level})` +
              (step.statusMessage ? ` msg=${step.statusMessage}` : ''),
          );
        }
      }
      if (trace.finalOutput) {
        lines.push('', '### 最终输出', trace.finalOutput);
      }
      return lines.join('\n');
    }

    function buildObservationTree(observations, hideNoise) {
      const filtered = hideNoise ? observations.filter((o) => !o.isNoise) : observations;
      const byId = new Map(filtered.map((o) => [o.id, { ...o, children: [] }]));
      const roots = [];
      for (const node of byId.values()) {
        if (node.parentObservationId && byId.has(node.parentObservationId)) {
          byId.get(node.parentObservationId).children.push(node);
        } else {
          roots.push(node);
        }
      }
      const flat = [];
      function walk(node, depth) {
        flat.push({ node, depth });
        for (const child of node.children) {
          walk(child, depth + 1);
        }
      }
      for (const r of roots) walk(r, 0);
      return flat;
    }

    async function apiFetch(path, options = {}) {
      const res = await fetch(`${API_BASE}${path}`, {
        method: options.method || 'GET',
        headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `请求失败 (HTTP ${res.status})`);
      }
      return data;
    }

    function timePresetBounds(preset, customFrom, customTo) {
      const now = new Date();
      if (preset === '24h') {
        return {
          fromStartTime: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
          toStartTime: now.toISOString(),
        };
      }
      if (preset === '7d') {
        return {
          fromStartTime: new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString(),
          toStartTime: now.toISOString(),
        };
      }
      if (preset === '30d') {
        return {
          fromStartTime: new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString(),
          toStartTime: now.toISOString(),
        };
      }
      if (preset === 'custom') {
        return {
          fromStartTime: customFrom ? new Date(customFrom).toISOString() : '',
          toStartTime: customTo ? new Date(customTo).toISOString() : '',
        };
      }
      return { fromStartTime: '', toStartTime: '' };
    }

    function EnvConfigDialog({ open, onClose, state, onStateChange, onNotify }) {
      const ref = React.useRef(null);
      const envs = state?.environments || [];
      const [selectedId, setSelectedId] = React.useState('');
      const [draft, setDraft] = React.useState({
        id: '',
        name: '',
        baseUrl: '',
        publicKey: '',
        secretKey: '',
        setDefault: true,
      });
      const [showSecret, setShowSecret] = React.useState(false);
      const [busy, setBusy] = React.useState('');
      const [probeMsg, setProbeMsg] = React.useState(null);

      React.useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        if (open) {
          if (!dialog.open) dialog.showModal();
          const initial = envs.find((e) => e.id === state?.activeEnvId) || envs[0];
          if (initial) {
            setSelectedId(initial.id);
            setDraft({
              id: initial.id,
              name: initial.name,
              baseUrl: initial.baseUrl,
              publicKey: initial.publicKey || '',
              secretKey: '',
              setDefault: initial.id === state?.activeEnvId,
            });
          } else {
            setSelectedId('__new__');
            setDraft({ id: '', name: '', baseUrl: '', publicKey: '', secretKey: '', setDefault: true });
          }
          setProbeMsg(null);
          setShowSecret(false);
        } else if (dialog.open) {
          dialog.close();
        }
      }, [open]);

      const startNew = () => {
        setSelectedId('__new__');
        setDraft({ id: '', name: '', baseUrl: '', publicKey: '', secretKey: '', setDefault: envs.length === 0 });
        setProbeMsg(null);
        setShowSecret(false);
      };

      const selectEnv = (env) => {
        setSelectedId(env.id);
        setDraft({
          id: env.id,
          name: env.name,
          baseUrl: env.baseUrl,
          publicKey: env.publicKey || '',
          secretKey: '',
          setDefault: env.id === state?.activeEnvId,
        });
        setProbeMsg(null);
        setShowSecret(false);
      };

      const handleTest = async () => {
        setBusy('test');
        setProbeMsg(null);
        try {
          const res = await apiFetch('/env/test', {
            method: 'POST',
            body: {
              id: draft.id || undefined,
              baseUrl: draft.baseUrl,
              publicKey: draft.publicKey,
              secretKey: draft.secretKey,
            },
          });
          setProbeMsg({
            ok: true,
            text: `连接成功 (${res.latencyMs}ms) · 项目：${res.projectName || '未知'} (${res.projectId || '无ID'})`,
          });
          const refreshed = await apiFetch('/state');
          onStateChange(refreshed);
        } catch (err) {
          setProbeMsg({ ok: false, text: err.message });
        } finally {
          setBusy('');
        }
      };

      const handleSave = async (e) => {
        e.preventDefault();
        setBusy('save');
        setProbeMsg(null);
        try {
          const res = await apiFetch('/env/save', {
            method: 'POST',
            body: {
              id: draft.id || undefined,
              name: draft.name,
              baseUrl: draft.baseUrl,
              publicKey: draft.publicKey,
              secretKey: draft.secretKey,
              setDefault: draft.setDefault,
              autoTest: true,
            },
          });
          onStateChange(res.state);
          if (res.testResult?.ok) {
            onNotify(`已保存环境「${draft.name}」并连通项目 ${res.testResult.projectName || ''}`, false);
            onClose();
          } else {
            setProbeMsg({
              ok: false,
              text: `配置已保存，但连接测试未通过：${res.testResult?.error || '未知错误'}`,
            });
          }
        } catch (err) {
          setProbeMsg({ ok: false, text: err.message });
        } finally {
          setBusy('');
        }
      };

      const handleDelete = async () => {
        if (!draft.id) return;
        setBusy('delete');
        try {
          const next = await apiFetch('/env/delete', {
            method: 'POST',
            body: { envId: draft.id },
          });
          onStateChange(next);
          onNotify(`已删除环境「${draft.name}」`, false);
          if (next.environments.length > 0) {
            selectEnv(next.environments[0]);
          } else {
            startNew();
          }
        } catch (err) {
          setProbeMsg({ ok: false, text: err.message });
        } finally {
          setBusy('');
        }
      };

      const editingEnv = envs.find((e) => e.id === draft.id);

      return h(
        'dialog',
        {
          ref,
          className: 'lfd-dialog',
          'aria-label': 'Langfuse 密钥与环境配置',
          onCancel: (e) => {
            e.preventDefault();
            onClose();
          },
        },
        h(
          'div',
          { className: 'lfd-dialog-head' },
          h('strong', { style: { fontSize: 15 } }, 'Langfuse 密钥与环境配置'),
          h('button', { type: 'button', className: 'lfd-btn sm', onClick: onClose }, '关闭'),
        ),
        h(
          'div',
          { className: 'lfd-dialog-body' },
          h(
            'div',
            { className: 'lfd-env-list' },
            h(
              'button',
              { type: 'button', className: 'lfd-btn primary sm', onClick: startNew, style: { marginBottom: 4 } },
              '+ 新增环境',
            ),
            envs.length === 0 && h('p', { style: { fontSize: 12, color: 'var(--lfd-muted)' } }, '暂无已配置环境'),
            envs.map((env) =>
              h(
                'button',
                {
                  key: env.id,
                  type: 'button',
                  className: 'lfd-env-item',
                  'aria-selected': selectedId === env.id ? 'true' : 'false',
                  onClick: () => selectEnv(env),
                },
                h(
                  'div',
                  { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 } },
                  h(
                    'span',
                    { style: { display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 650, fontSize: 12.5 } },
                    h('span', { className: `lfd-dot ${env.lastTestOk === true ? 'ok' : env.lastTestOk === false ? 'err' : ''}` }),
                    env.name,
                  ),
                  env.id === state?.activeEnvId && h('span', { className: 'lfd-badge ok' }, '当前'),
                ),
                h(
                  'span',
                  { style: { fontSize: 11, color: 'var(--lfd-muted)', fontFamily: 'var(--lfd-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
                  env.projectName ? `${env.projectName} · ${env.baseUrl}` : env.baseUrl,
                ),
              ),
            ),
          ),
          h(
            'form',
            { className: 'lfd-form', onSubmit: handleSave },
            h(
              'div',
              { className: 'lfd-field' },
              h('label', { htmlFor: 'lfd-env-name' }, '环境名称'),
              h('input', {
                id: 'lfd-env-name',
                className: 'lfd-input',
                required: true,
                placeholder: '例如：测试环境 / 生产环境',
                value: draft.name,
                onChange: (e) => setDraft({ ...draft, name: e.target.value }),
              }),
            ),
            h(
              'div',
              { className: 'lfd-field' },
              h('label', { htmlFor: 'lfd-env-url' }, 'LANGFUSE_BASE_URL'),
              h('input', {
                id: 'lfd-env-url',
                className: 'lfd-input mono',
                required: true,
                placeholder: 'http://192.168.26.29:3000',
                value: draft.baseUrl,
                onChange: (e) => setDraft({ ...draft, baseUrl: e.target.value }),
              }),
            ),
            h(
              'div',
              { className: 'lfd-field' },
              h('label', { htmlFor: 'lfd-env-pk' }, 'LANGFUSE_PUBLIC_KEY'),
              h('input', {
                id: 'lfd-env-pk',
                className: 'lfd-input mono',
                required: true,
                placeholder: 'pk-lf-...',
                value: draft.publicKey,
                onChange: (e) => setDraft({ ...draft, publicKey: e.target.value }),
              }),
            ),
            h(
              'div',
              { className: 'lfd-field' },
              h(
                'div',
                { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
                h('label', { htmlFor: 'lfd-env-sk' }, 'LANGFUSE_SECRET_KEY'),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'lfd-btn ghost sm',
                    onClick: () => setShowSecret((v) => !v),
                  },
                  showSecret ? '隐藏' : '显示明文',
                ),
              ),
              h('input', {
                id: 'lfd-env-sk',
                className: 'lfd-input mono',
                type: showSecret ? 'text' : 'password',
                required: !editingEnv?.hasSecretKey,
                placeholder: editingEnv?.hasSecretKey
                  ? `已保存 (${editingEnv.secretKeyMask})，留空则保持不变`
                  : 'sk-lf-...',
                value: draft.secretKey,
                onChange: (e) => setDraft({ ...draft, secretKey: e.target.value }),
              }),
            ),
            h(
              'label',
              { className: 'lfd-check', style: { fontSize: 12.5 } },
              h('input', {
                type: 'checkbox',
                checked: Boolean(draft.setDefault),
                onChange: (e) => setDraft({ ...draft, setDefault: e.target.checked }),
              }),
              '保存后切换为当前查询环境',
            ),
            editingEnv?.projectId &&
              h(
                'div',
                { style: { fontSize: 12, color: 'var(--lfd-muted)' } },
                `已识别项目：${editingEnv.projectName || '-'} (${editingEnv.projectId})`,
              ),
            probeMsg &&
              h(
                'div',
                {
                  className: `lfd-banner ${probeMsg.ok ? 'success' : 'error'}`,
                  style: { margin: 0 },
                  role: 'status',
                },
                probeMsg.text,
              ),
            h(
              'div',
              { className: 'lfd-form-actions' },
              h(
                'div',
                { style: { display: 'flex', gap: 8 } },
                h(
                  'button',
                  { type: 'button', className: 'lfd-btn', disabled: Boolean(busy), onClick: handleTest },
                  busy === 'test' ? '测试中...' : '测试连接',
                ),
                draft.id &&
                  h(
                    'button',
                    { type: 'button', className: 'lfd-btn danger', disabled: Boolean(busy), onClick: handleDelete },
                    '删除',
                  ),
              ),
              h(
                'button',
                { type: 'submit', className: 'lfd-btn primary', disabled: Boolean(busy) },
                busy === 'save' ? '保存并验证中...' : '保存配置',
              ),
            ),
          ),
        ),
      );
    }

    function App() {
      const [state, setState] = React.useState(null);
      const [loadingState, setLoadingState] = React.useState(true);
      const [configOpen, setConfigOpen] = React.useState(false);

      const [mode, setMode] = React.useState('auto');
      const [queryText, setQueryText] = React.useState('');
      const [timePreset, setTimePreset] = React.useState('none');
      const [customFrom, setCustomFrom] = React.useState('');
      const [customTo, setCustomTo] = React.useState('');

      const [querying, setQuerying] = React.useState(false);
      const [banner, setBanner] = React.useState(null);
      const [result, setResult] = React.useState(null);
      const [selectedTraceId, setSelectedTraceId] = React.useState('');
      const [loadingTraceId, setLoadingTraceId] = React.useState('');
      const [detailTab, setDetailTab] = React.useState('flow');

      // View filters
      const [hideSideTraces, setHideSideTraces] = React.useState(false);
      const [onlyErrorTraces, setOnlyErrorTraces] = React.useState(false);
      const [hideNoiseSpans, setHideNoiseSpans] = React.useState(true);
      const [onlyToolAndFinal, setOnlyToolAndFinal] = React.useState(false);
      const [expandedSteps, setExpandedSteps] = React.useState({});
      const [rawTextSteps, setRawTextSteps] = React.useState({});
      const [visibleCount, setVisibleCount] = React.useState(20);
      const [selectedObsId, setSelectedObsId] = React.useState('');
      const [copiedKey, setCopiedKey] = React.useState('');

      const toggleStep = (stepId) => {
        setExpandedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
      };
      const toggleRawText = (stepId) => {
        setRawTextSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
      };

      const notify = (text, error = false) => setBanner({ text, error });

      const copyText = async (label, value) => {
        if (!value) return;
        try {
          await navigator.clipboard.writeText(String(value));
          setCopiedKey(label);
          setTimeout(() => setCopiedKey((prev) => (prev === label ? '' : prev)), 1600);
        } catch {
          notify('复制失败，请手动选中复制', true);
        }
      };

      const loadState = async () => {
        setLoadingState(true);
        try {
          const data = await apiFetch('/state');
          setState(data);
        } catch (err) {
          notify(err.message, true);
        } finally {
          setLoadingState(false);
        }
      };

      React.useEffect(() => {
        loadState();
      }, []);

      React.useEffect(() => {
        setVisibleCount(20);
      }, [selectedTraceId]);

      const activeEnv = (state?.environments || []).find((e) => e.id === state?.activeEnvId)
        || state?.environments?.[0]
        || null;

      const runQuery = async ({ overrideQuery, overrideMode, overrideEnvId } = {}) => {
        const targetQuery = overrideQuery !== undefined ? overrideQuery : queryText.trim();
        const targetMode = overrideMode !== undefined ? overrideMode : mode;
        const targetEnvId = overrideEnvId !== undefined ? overrideEnvId : activeEnv?.id;

        if (!targetEnvId) {
          setConfigOpen(true);
          return notify('请先配置至少一个 Langfuse 环境', true);
        }
        if (!targetQuery && targetMode !== 'recent') {
          return notify('请输入 Session ID、Run ID 或 Trace ID', true);
        }

        setQuerying(true);
        setBanner(null);
        try {
          const bounds = timePresetBounds(timePreset, customFrom, customTo);
          const endpoint = targetMode === 'recent' ? '/recent' : '/query';
          const payload = await apiFetch(endpoint, {
            method: 'POST',
            body: {
              envId: targetEnvId,
              query: targetQuery,
              mode: targetMode,
              ...bounds,
            },
          });
          setResult(payload);
          if (payload.history) {
            setState((prev) => (prev ? { ...prev, history: payload.history } : prev));
          }
          const firstMain = payload.traces.find((t) => !t.isSideTrace) || payload.traces[0];
          setSelectedTraceId(firstMain?.traceId || '');
          setSelectedObsId(firstMain?.observations?.[0]?.id || '');
          if (payload.traces.length === 0) {
            notify(`在「${payload.envName}」中未查到匹配的 Trace，可尝试切换环境或放宽时间范围`, true);
          }
        } catch (err) {
          notify(err.message, true);
        } finally {
          setQuerying(false);
        }
      };

      const switchEnv = async (envId) => {
        try {
          const next = await apiFetch('/env/select', { method: 'POST', body: { envId } });
          setState(next);
          if (queryText.trim()) {
            runQuery({ overrideEnvId: envId });
          }
        } catch (err) {
          notify(err.message, true);
        }
      };

      const allTraces = result?.traces || [];
      const visibleTraces = allTraces.filter((t) => {
        if (hideSideTraces && t.isSideTrace) return false;
        if (onlyErrorTraces && !t.hasError) return false;
        return true;
      });

      const activeTrace = visibleTraces.find((t) => t.traceId === selectedTraceId)
        || allTraces.find((t) => t.traceId === selectedTraceId)
        || visibleTraces[0]
        || null;

      React.useEffect(() => {
        if (!activeTrace) return;
        if (!activeTrace.observations.some((o) => o.id === selectedObsId)) {
          setSelectedObsId(activeTrace.observations[0]?.id || '');
        }
        if (activeTrace.isSummaryOnly && loadingTraceId !== activeTrace.traceId) {
          const targetId = activeTrace.traceId;
          const envId = result?.envId || activeEnv?.id;
          setLoadingTraceId(targetId);
          apiFetch('/trace', { method: 'POST', body: { envId, traceId: targetId } })
            .then((res) => {
              if (!res?.trace) return;
              setResult((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  traces: prev.traces.map((t) => (t.traceId === targetId ? { ...res.trace, isSummaryOnly: false } : t)),
                };
              });
            })
            .catch((err) => notify(err.message, true))
            .finally(() => setLoadingTraceId((cur) => (cur === targetId ? '' : cur)));
        }
      }, [activeTrace?.traceId, activeTrace?.isSummaryOnly]);

      const modeLabelMap = {
        auto: '自动识别',
        session_id: 'Session ID',
        run_id: 'Run ID',
        trace_id: 'Trace ID',
        recent: '最近 Trace',
      };

      const envHistory = (state?.history || []).filter((item) => !activeEnv || item.envId === activeEnv.id).slice(0, 8);

      const renderCopyBtn = (key, value, label = '复制') =>
        value
          ? h(
              'button',
              {
                type: 'button',
                className: 'lfd-btn ghost sm',
                style: { minHeight: 20, padding: '1px 6px', fontSize: 11 },
                onClick: (e) => {
                  e.stopPropagation();
                  copyText(key, value);
                },
              },
              copiedKey === key ? '已复制 ✓' : label,
            )
          : null;

      const renderFlowStep = (step, idx) => {
        if (hideNoiseSpans && step.isNoise) {
          return null;
        }
        if (onlyToolAndFinal && step.kind !== 'tool_step' && step.kind !== 'agent_output' && step.kind !== 'user_input') {
          return null;
        }
        const isErr = step.level === 'ERROR';
        const isCollapsed = !expandedSteps[step.id];
        const isRaw = Boolean(rawTextSteps[step.id]);
        const stepClass = `lfd-step ${step.kind === 'user_input' ? 'user' : step.kind === 'llm_step' ? 'llm' : step.kind === 'tool_step' ? 'tool' : step.kind} ${isErr ? 'error' : ''} ${isCollapsed ? 'collapsed' : ''}`;
        const caret = h('span', { className: 'lfd-step-caret', 'aria-hidden': true }, isCollapsed ? '▸' : '▾');

        if (step.kind === 'user_input') {
          return h(
            'div',
            { key: step.id, className: stepClass },
            h(
              'div',
              {
                className: 'lfd-step-head',
                onClick: () => toggleStep(step.id),
                title: isCollapsed ? '点击展开' : '点击折叠',
              },
              h(
                'div',
                { className: 'lfd-step-title' },
                caret,
                h('span', { className: 'lfd-badge agent' }, '用户输入'),
                step.title,
                isCollapsed && step.text && h('span', { className: 'lfd-step-preview' }, step.text),
              ),
              h('span', { style: { fontSize: 11, color: 'var(--lfd-muted)' } }, fmtTime(step.startTime)),
            ),
            !isCollapsed &&
              h('div', { className: 'lfd-step-body' }, h('div', { className: 'lfd-text-block' }, step.text || '（空输入）')),
          );
        }

        if (step.kind === 'llm_step') {
          const outputs = step.outputs || [];
          const hasDelta = Array.isArray(step.deltaMessages) && step.deltaMessages.length > 0;
          const deltaCharSize = hasDelta
            ? step.deltaMessages.reduce((acc, m) => acc + (m.text?.length || 0) + (m.toolResponses?.length || 0) * 400, 0)
            : 0;
          const autoOpenDelta = hasDelta && step.deltaMessages.length <= 4 && deltaCharSize <= 1500;
          const callNames = outputs.flatMap((o) => o.toolCalls || []).map((tc) => tc.name);
          const collapsedSummary = callNames.length
            ? `→ ${callNames.join(', ')}`
            : (outputs.map((o) => o.text).filter(Boolean).join(' ') || '');

          return h(
            'div',
            { key: step.id, className: stepClass },
            h(
              'div',
              {
                className: 'lfd-step-head',
                onClick: () => toggleStep(step.id),
                title: isCollapsed ? '点击展开' : '点击折叠',
              },
              h(
                'div',
                { className: 'lfd-step-title' },
                caret,
                h('span', { className: 'lfd-badge llm' }, `LLM #${idx}`),
                step.title,
                step.finishReasons?.length > 0 && h('span', { className: 'lfd-badge mono' }, step.finishReasons.join(', ')),
                isErr && h('span', { className: 'lfd-badge err' }, 'ERROR'),
                isCollapsed && collapsedSummary && h('span', { className: 'lfd-step-preview' }, collapsedSummary),
              ),
              h(
                'div',
                { className: 'lfd-trace-meta' },
                h('span', null, fmtDuration(step.latencyMs)),
                step.ttftMs !== null && h('span', null, `TTFT ${fmtDuration(step.ttftMs)}`),
                h(
                  'span',
                  null,
                  `Token: in ${fmtNum(step.usage.input)}` +
                    (step.usage.cached ? ` (命中缓存 ${fmtNum(step.usage.cached)})` : '') +
                    ` / out ${fmtNum(step.usage.output)}` +
                    (step.usage.reasoning ? ` (思考 ${fmtNum(step.usage.reasoning)})` : ''),
                ),
              ),
            ),
            !isCollapsed &&
              h(
                'div',
                { className: 'lfd-step-body' },
                step.statusMessage && h('div', { className: 'lfd-banner error', style: { margin: 0 } }, step.statusMessage),
                (step.systemPrompt || step.toolDefinitions?.length > 0 || hasDelta) &&
                  h(
                    'div',
                    { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
                    step.systemPrompt &&
                      h(
                        'details',
                        { className: 'lfd-disclosure' },
                        h('summary', null, `System Prompt（${step.systemPrompt.length.toLocaleString()} 字符，点击展开）`),
                        h('pre', { className: 'lfd-code' }, step.systemPrompt),
                      ),
                    step.toolDefinitions?.length > 0 &&
                      h(
                        'details',
                        { className: 'lfd-disclosure' },
                        h(
                          'summary',
                          null,
                          `已挂载工具清单（${step.toolDefinitions.length} 个）：${step.toolDefinitions.slice(0, 4).map((t) => t.name).join(', ')}${step.toolDefinitions.length > 4 ? ' ...' : ''}`,
                        ),
                        h(
                          'div',
                          { style: { padding: '8px 10px', display: 'flex', flexWrap: 'wrap', gap: 6 } },
                          step.toolDefinitions.map((tool) =>
                            h('span', { key: tool.name, className: 'lfd-badge mono', title: tool.description }, tool.name),
                          ),
                        ),
                      ),
                    hasDelta &&
                      h(
                        'details',
                        { className: 'lfd-disclosure', open: autoOpenDelta },
                        h('summary', null, `本轮新增输入消息（${step.deltaMessages.length} 条 / 总上下文 ${step.historyCount} 条${autoOpenDelta ? '' : '，点击展开'}）`),
                        h(
                          'div',
                          { style: { padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 460, overflow: 'auto' } },
                          step.deltaMessages.map((msg, mi) =>
                            h(
                              'div',
                              { key: mi, style: { borderLeft: '2px solid var(--lfd-border-strong)', paddingLeft: 8 } },
                              h('div', { style: { fontSize: 11, fontWeight: 650, color: 'var(--lfd-muted)' } }, msg.role.toUpperCase()),
                              msg.text && h('div', { className: 'lfd-text-block', style: { fontSize: 12 } }, msg.text),
                              msg.toolResponses?.map((tr, ti) =>
                                h(
                                  'pre',
                                  { key: ti, className: 'lfd-code', style: { marginTop: 4 } },
                                  `[${tr.name || 'tool_result'}] ${formatToolPayload(tr.response)}`,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                  ),
                outputs.map((out, oi) =>
                  h(
                    'div',
                    { key: oi, style: { display: 'flex', flexDirection: 'column', gap: 8 } },
                    out.reasoning &&
                      h(
                        'details',
                        { className: 'lfd-disclosure', open: !out.text && out.toolCalls.length === 0 },
                        h('summary', null, `模型思考 (Reasoning · ${out.reasoning.length} 字符)`),
                        h('div', { className: 'lfd-thinking', style: { margin: 8 } }, out.reasoning),
                      ),
                    out.text &&
                      (isRaw
                        ? h('div', { className: 'lfd-text-block' }, out.text)
                        : h(MarkdownView, { text: out.text, onCopy: copyText })),
                    out.toolCalls?.length > 0 &&
                      h(
                        'div',
                        { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
                        out.toolCalls.map((tc, ti) =>
                          h(
                            'div',
                            { key: tc.id || ti, className: 'lfd-io-box' },
                            h(
                              'div',
                              { className: 'lfd-io-box-head' },
                              h('span', null, `请求调用工具：`, h('strong', { style: { color: 'var(--lfd-tool)', fontFamily: 'var(--lfd-mono)' } }, tc.name)),
                              renderCopyBtn(`tc-${step.id}-${ti}`, prettyJson(tc.arguments)),
                            ),
                            h('pre', { className: 'lfd-code' }, prettyJson(tc.arguments)),
                          ),
                        ),
                      ),
                  ),
                ),
              ),
          );
        }

        if (step.kind === 'tool_step') {
          const argStr = prettyJson(step.input);
          const outStr = formatToolPayload(step.output);
          return h(
            'div',
            { key: step.id, className: stepClass },
            h(
              'div',
              {
                className: 'lfd-step-head',
                onClick: () => toggleStep(step.id),
                title: isCollapsed ? '点击展开' : '点击折叠',
              },
              h(
                'div',
                { className: 'lfd-step-title' },
                caret,
                h('span', { className: 'lfd-badge tool' }, 'TOOL'),
                h('span', { style: { fontFamily: 'var(--lfd-mono)' } }, step.title),
                isErr && h('span', { className: 'lfd-badge err' }, 'ERROR'),
                isCollapsed && outStr && h('span', { className: 'lfd-step-preview' }, outStr.slice(0, 120)),
              ),
              h(
                'div',
                { className: 'lfd-trace-meta' },
                h('span', null, fmtDuration(step.latencyMs)),
                step.toolCallId && h('span', { style: { fontFamily: 'var(--lfd-mono)' } }, step.toolCallId),
              ),
            ),
            !isCollapsed &&
              h(
                'div',
                { className: 'lfd-step-body' },
                step.statusMessage && h('div', { className: 'lfd-banner error', style: { margin: 0 } }, step.statusMessage),
                h(
                  'div',
                  { className: 'lfd-io-grid' },
                  h(
                    'div',
                    { className: 'lfd-io-box' },
                    h('div', { className: 'lfd-io-box-head' }, h('span', null, '入参 (Arguments)'), renderCopyBtn(`tin-${step.id}`, argStr)),
                    h('pre', { className: 'lfd-code' }, argStr),
                  ),
                  h(
                    'div',
                    { className: 'lfd-io-box' },
                    h('div', { className: 'lfd-io-box-head' }, h('span', null, '出参 (Result)'), renderCopyBtn(`tout-${step.id}`, outStr)),
                    h('pre', { className: 'lfd-code' }, outStr || '（无输出）'),
                  ),
                ),
              ),
          );
        }

        if (step.kind === 'agent_output') {
          const allText = (step.outputs || []).map((o) => o.text).filter(Boolean).join('\n\n');
          return h(
            'div',
            { key: step.id, className: stepClass },
            h(
              'div',
              {
                className: 'lfd-step-head',
                onClick: () => toggleStep(step.id),
                title: isCollapsed ? '点击展开' : '点击折叠',
              },
              h(
                'div',
                { className: 'lfd-step-title' },
                caret,
                h('span', { className: 'lfd-badge agent' }, '最终回复'),
                step.title,
                isCollapsed && allText && h('span', { className: 'lfd-step-preview' }, allText),
              ),
              h(
                'div',
                { className: 'lfd-trace-meta', onClick: (e) => e.stopPropagation() },
                allText &&
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'lfd-btn ghost sm',
                      style: { minHeight: 20, padding: '1px 6px', fontSize: 11 },
                      onClick: () => toggleRawText(step.id),
                    },
                    isRaw ? 'Markdown 视图' : '查看原文',
                  ),
                allText && renderCopyBtn(`final-${step.id}`, allText, '复制回复'),
                h('span', null, `总耗时 ${fmtDuration(step.latencyMs)}`),
              ),
            ),
            !isCollapsed &&
              h(
                'div',
                { className: 'lfd-step-body' },
                (step.outputs || []).map((out, oi) =>
                  h(
                    'div',
                    { key: oi, style: { display: 'flex', flexDirection: 'column', gap: 8 } },
                    out.reasoning &&
                      h(
                        'details',
                        { className: 'lfd-disclosure' },
                        h('summary', null, `最终轮思考 (Reasoning · ${out.reasoning.length} 字符)`),
                        h('div', { className: 'lfd-thinking', style: { margin: 8 } }, out.reasoning),
                      ),
                    out.text &&
                      (isRaw
                        ? h('div', { className: 'lfd-text-block' }, out.text)
                        : h(MarkdownView, { text: out.text, onCopy: copyText })),
                  ),
                ),
              ),
          );
        }

        return h(
          'div',
          { key: step.id, className: stepClass },
          h(
            'div',
            {
              className: 'lfd-step-head',
              onClick: () => toggleStep(step.id),
              title: isCollapsed ? '点击展开' : '点击折叠',
            },
            h('div', { className: 'lfd-step-title' }, caret, h('span', { className: 'lfd-badge' }, step.obsType || 'SPAN'), step.title),
            h('span', { style: { fontSize: 11, color: 'var(--lfd-muted)' } }, fmtDuration(step.latencyMs)),
          ),
          !isCollapsed &&
            (step.statusMessage || step.input || step.output) &&
            h(
              'div',
              { className: 'lfd-step-body' },
              step.statusMessage && h('div', { className: 'lfd-text-block' }, step.statusMessage),
              (step.input !== null || step.output !== null) &&
                h('pre', { className: 'lfd-code' }, prettyJson({ input: step.input, output: step.output })),
            ),
        );
      };

      const renderTreeAndWaterfall = (trace) => {
        const flat = buildObservationTree(trace.observations, hideNoiseSpans);
        const selectedObs = trace.observations.find((o) => o.id === selectedObsId) || flat[0]?.node || null;
        return h(
          'div',
          { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
          h(
            'div',
            { className: 'lfd-card', style: { padding: 0, overflow: 'hidden' } },
            h(
              'table',
              { className: 'lfd-tree-table' },
              h(
                'thead',
                null,
                h(
                  'tr',
                  null,
                  h('th', null, '调用节点'),
                  h('th', { style: { width: 85 } }, '类型'),
                  h('th', { style: { width: 80 } }, '耗时'),
                  h('th', { style: { width: 170 } }, '时间瀑布图'),
                  h('th', { style: { width: 110 } }, 'Token'),
                ),
              ),
              h(
                'tbody',
                null,
                flat.map(({ node, depth }) =>
                  h(
                    'tr',
                    {
                      key: node.id,
                      className: 'lfd-tree-row',
                      'aria-selected': selectedObs?.id === node.id ? 'true' : 'false',
                      onClick: () => setSelectedObsId(node.id),
                    },
                    h(
                      'td',
                      null,
                      h(
                        'div',
                        { style: { paddingLeft: depth * 16, display: 'flex', alignItems: 'center', gap: 6 } },
                        depth > 0 && h('span', { style: { color: 'var(--lfd-muted)' } }, '└'),
                        h('span', { style: { fontWeight: 600 } }, node.name),
                        node.level === 'ERROR' && h('span', { className: 'lfd-badge err' }, 'ERR'),
                      ),
                    ),
                    h(
                      'td',
                      null,
                      h(
                        'span',
                        {
                          className: `lfd-badge ${
                            node.type === 'AGENT' ? 'agent' : node.type === 'GENERATION' ? 'llm' : node.type === 'TOOL' ? 'tool' : ''
                          }`,
                        },
                        node.type,
                      ),
                    ),
                    h('td', null, fmtDuration(node.latencyMs)),
                    h(
                      'td',
                      null,
                      h(
                        'div',
                        { className: 'lfd-wf-track', title: `+${fmtDuration(node.offsetMs)} · 耗时 ${fmtDuration(node.latencyMs)}` },
                        h('div', {
                          className: `lfd-wf-bar ${node.level === 'ERROR' ? 'ERROR' : node.type}`,
                          style: { left: `${node.pctOffset}%`, width: `${node.pctWidth}%` },
                        }),
                      ),
                    ),
                    h('td', null, node.usage.total ? fmtNum(node.usage.total) : '—'),
                  ),
                ),
              ),
            ),
          ),
          selectedObs &&
            h(
              'div',
              { className: 'lfd-card', style: { display: 'flex', flexDirection: 'column', gap: 10 } },
              h(
                'div',
                { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 } },
                h(
                  'div',
                  { style: { display: 'flex', alignItems: 'center', gap: 8 } },
                  h('strong', null, `节点详情：${selectedObs.name}`),
                  h('span', { className: 'lfd-badge mono' }, selectedObs.id),
                  selectedObs.model && h('span', { className: 'lfd-badge llm' }, selectedObs.model),
                ),
                h('span', { style: { fontSize: 12, color: 'var(--lfd-muted)' } }, `${fmtFullTime(selectedObs.startTime)} · ${fmtDuration(selectedObs.latencyMs)}`),
              ),
              selectedObs.statusMessage && h('div', { className: 'lfd-banner error', style: { margin: 0 } }, selectedObs.statusMessage),
              h(
                'div',
                { className: 'lfd-io-grid' },
                h(
                  'div',
                  { className: 'lfd-io-box' },
                  h('div', { className: 'lfd-io-box-head' }, h('span', null, 'Input'), renderCopyBtn(`obs-in-${selectedObs.id}`, prettyJson(selectedObs.input))),
                  h('pre', { className: 'lfd-code' }, prettyJson(selectedObs.input)),
                ),
                h(
                  'div',
                  { className: 'lfd-io-box' },
                  h('div', { className: 'lfd-io-box-head' }, h('span', null, 'Output'), renderCopyBtn(`obs-out-${selectedObs.id}`, formatToolPayload(selectedObs.output))),
                  h('pre', { className: 'lfd-code' }, formatToolPayload(selectedObs.output) || prettyJson(selectedObs.rawOutput)),
                ),
              ),
              h(
                'details',
                { className: 'lfd-disclosure' },
                h('summary', null, 'Observation Metadata'),
                h('pre', { className: 'lfd-code' }, prettyJson(selectedObs.metadata)),
              ),
            ),
        );
      };

      const renderMetadataTab = (trace) => {
        const rows = [
          ['Trace ID', trace.traceId],
          ['Run ID', trace.runId || '—'],
          ['Session ID', trace.sessionId || '—'],
          ['User ID', trace.userId !== '' ? String(trace.userId) : '—'],
          ['Agent Code', trace.agentCode || '—'],
          ['Company ID', trace.compId ?? '—'],
          ['Agent ID', trace.agentId ?? '—'],
          ['Scope Version', trace.scopeVersion || '—'],
          ['开始时间', fmtFullTime(trace.startTime)],
          ['结束时间', fmtFullTime(trace.endTime)],
          ['总耗时', fmtDuration(trace.durationMs)],
          ['观测总数', `${trace.counts.total} (噪声 SPAN: ${trace.counts.noiseSpan})`],
        ];
        return h(
          'div',
          { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
          h(
            'div',
            { className: 'lfd-card' },
            h('h3', { style: { fontSize: 13.5, marginBottom: 10 } }, 'Trace 关键字段'),
            h(
              'div',
              { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px 16px' } },
              rows.map(([k, v]) =>
                h(
                  'div',
                  { key: k, style: { display: 'flex', flexDirection: 'column', gap: 2, paddingBottom: 6, borderBottom: '1px solid var(--lfd-border)' } },
                  h('span', { style: { fontSize: 11, color: 'var(--lfd-muted)' } }, k),
                  h('code', { style: { fontFamily: 'var(--lfd-mono)', fontSize: 12, wordBreak: 'break-all' } }, String(v)),
                ),
              ),
            ),
          ),
          h(
            'div',
            { className: 'lfd-card' },
            h(
              'div',
              { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 } },
              h('h3', { style: { fontSize: 13.5 } }, '完整 Observations JSON'),
              renderCopyBtn('raw-trace-json', prettyJson(trace.observations), '复制全部 JSON'),
            ),
            h('pre', { className: 'lfd-code', style: { maxHeight: 520 } }, prettyJson(trace.observations)),
          ),
        );
      };

      const totalSessionTokens = visibleTraces.reduce((acc, t) => acc + t.usage.total, 0);

      return h(
        'div',
        { className: 'lfd-root' },
        h('style', null, css),
        h(
          'header',
          { className: 'lfd-header' },
          h(
            'div',
            { className: 'lfd-header-top' },
            h(
              'div',
              { className: 'lfd-brand' },
              h('div', { className: 'lfd-logo' }, h(Icon, { size: 19, active: true })),
              h(
                'div',
                { className: 'lfd-title-wrap' },
                h('h1', null, 'Langfuse Trace 看板'),
                h(
                  'div',
                  { className: 'lfd-subtitle' },
                  activeEnv
                    ? h(
                        React.Fragment,
                        null,
                        h('span', null, `${activeEnv.name}`),
                        activeEnv.projectName && h('span', null, `· 项目 ${activeEnv.projectName}`),
                        h('span', { style: { fontFamily: 'var(--lfd-mono)' } }, `· ${activeEnv.baseUrl}`),
                      )
                    : '尚未配置 Langfuse 环境，请先点击右侧「密钥与环境配置」',
                ),
              ),
            ),
            h(
              'div',
              { className: 'lfd-env-bar' },
              (state?.environments || []).map((env) =>
                h(
                  'button',
                  {
                    key: env.id,
                    type: 'button',
                    className: 'lfd-env-pill',
                    'aria-pressed': activeEnv?.id === env.id ? 'true' : 'false',
                    onClick: () => switchEnv(env.id),
                  },
                  h('span', { className: `lfd-dot ${env.lastTestOk === true ? 'ok' : env.lastTestOk === false ? 'err' : ''}` }),
                  env.name,
                ),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'lfd-btn sm',
                  disabled: querying || !activeEnv,
                  onClick: () => runQuery({ overrideMode: 'recent', overrideQuery: '' }),
                },
                '拉取最近 Trace',
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: `lfd-btn sm ${!activeEnv ? 'primary' : ''}`,
                  onClick: () => setConfigOpen(true),
                },
                '密钥与环境配置',
              ),
            ),
          ),
          h(
            'form',
            {
              className: 'lfd-search-bar',
              onSubmit: (e) => {
                e.preventDefault();
                runQuery();
              },
            },
            h(
              'div',
              { className: 'lfd-search-row' },
              h(
                'div',
                { className: 'lfd-segmented', role: 'group', 'aria-label': '查询模式' },
                [
                  ['auto', '自动识别'],
                  ['session_id', 'Session ID'],
                  ['run_id', 'Run ID'],
                  ['trace_id', 'Trace ID'],
                ].map(([val, text]) =>
                  h(
                    'button',
                    {
                      key: val,
                      type: 'button',
                      'aria-pressed': mode === val ? 'true' : 'false',
                      onClick: () => setMode(val),
                    },
                    text,
                  ),
                ),
              ),
              h(
                'div',
                { className: 'lfd-input-wrap' },
                h('input', {
                  className: 'lfd-input mono',
                  placeholder: '输入 Session ID / Run ID / Trace ID（支持回车直接查询）...',
                  value: queryText,
                  onChange: (e) => setQueryText(e.target.value),
                }),
                queryText &&
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'lfd-input-clear',
                      title: '清空',
                      onClick: () => setQueryText(''),
                    },
                    '×',
                  ),
              ),
              h(
                'button',
                { type: 'submit', className: 'lfd-btn primary', disabled: querying || loadingState },
                querying ? '查询中...' : '查询 Trace',
              ),
            ),
            h(
              'div',
              { className: 'lfd-subbar' },
              h(
                'div',
                { className: 'lfd-chip-group' },
                h('span', { style: { fontSize: 11.5, color: 'var(--lfd-muted)' } }, '时间范围：'),
                [
                  ['none', '不限'],
                  ['24h', '近 24h'],
                  ['7d', '近 7 天'],
                  ['30d', '近 30 天'],
                  ['custom', '自定义'],
                ].map(([k, label]) =>
                  h(
                    'button',
                    {
                      key: k,
                      type: 'button',
                      className: 'lfd-chip',
                      'aria-pressed': timePreset === k ? 'true' : 'false',
                      onClick: () => setTimePreset(k),
                    },
                    label,
                  ),
                ),
                timePreset === 'custom' &&
                  h(
                    'div',
                    { style: { display: 'flex', alignItems: 'center', gap: 6 } },
                    h('input', {
                      type: 'datetime-local',
                      className: 'lfd-input',
                      style: { width: 175, minHeight: 26, padding: '2px 6px', fontSize: 11.5 },
                      value: customFrom,
                      onChange: (e) => setCustomFrom(e.target.value),
                    }),
                    h('span', null, '→'),
                    h('input', {
                      type: 'datetime-local',
                      className: 'lfd-input',
                      style: { width: 175, minHeight: 26, padding: '2px 6px', fontSize: 11.5 },
                      value: customTo,
                      onChange: (e) => setCustomTo(e.target.value),
                    }),
                  ),
              ),
              envHistory.length > 0 &&
                h(
                  'div',
                  { className: 'lfd-chip-group' },
                  h('span', { style: { fontSize: 11.5, color: 'var(--lfd-muted)' } }, '最近查询：'),
                  envHistory.map((item) =>
                    h(
                      'button',
                      {
                        key: item.id,
                        type: 'button',
                        className: 'lfd-chip',
                        title: `${modeLabelMap[item.resolvedMode] || item.mode}: ${item.query}\n${item.label || ''}`,
                        onClick: () => {
                          setQueryText(item.query);
                          setMode(item.resolvedMode || item.mode || 'auto');
                          runQuery({ overrideQuery: item.query, overrideMode: item.resolvedMode || item.mode || 'auto' });
                        },
                      },
                      h('span', { style: { fontWeight: 700 } }, item.resolvedMode === 'run_id' ? 'R' : item.resolvedMode === 'session_id' ? 'S' : 'T'),
                      h('span', { className: 'lfd-chip-text' }, item.query),
                    ),
                  ),
                ),
            ),
          ),
        ),
        banner &&
          h(
            'div',
            { className: `lfd-banner ${banner.error ? 'error' : 'success'}`, role: banner.error ? 'alert' : 'status' },
            h('span', null, banner.text),
            h('button', { type: 'button', className: 'lfd-btn ghost sm', onClick: () => setBanner(null) }, '关闭'),
          ),
        !result
          ? h(
              'div',
              { className: 'lfd-empty' },
              h(
                'div',
                { className: 'lfd-empty-card' },
                h('h2', { style: { fontSize: 17 } }, activeEnv ? '输入 ID 开始排查 Trace' : '欢迎使用 Langfuse Trace 看板'),
                h(
                  'p',
                  { style: { color: 'var(--lfd-muted)' } },
                  activeEnv
                    ? '相比原生 Langfuse 界面，本看板自动过滤 format 噪声、折叠超长 System Prompt 与工具 Schema，并将多轮 Session、LLM 思考与工具出参整理为直观的排障流。'
                    : '请先配置至少一个 Langfuse 环境（Base URL、Public Key 与 Secret Key）。密钥仅保存在本机凭证存储中，不会写入代码仓库。',
                ),
                h(
                  'div',
                  { style: { display: 'flex', gap: 10, flexWrap: 'wrap' } },
                  !activeEnv
                    ? h('button', { type: 'button', className: 'lfd-btn primary', onClick: () => setConfigOpen(true) }, '立即配置 Langfuse 环境')
                    : h(
                        React.Fragment,
                        null,
                        h(
                          'button',
                          {
                            type: 'button',
                            className: 'lfd-btn primary',
                            disabled: querying,
                            onClick: () => runQuery({ overrideMode: 'recent', overrideQuery: '' }),
                          },
                          querying ? '加载中...' : `查看「${activeEnv.name}」最近 Trace`,
                        ),
                        h('button', { type: 'button', className: 'lfd-btn', onClick: () => setConfigOpen(true) }, '管理密钥与环境'),
                      ),
                ),
              ),
            )
          : h(
              'div',
              { className: `lfd-workspace ${allTraces.length === 0 ? 'single' : ''}` },
              allTraces.length > 0 &&
                h(
                  'aside',
                  { className: 'lfd-list-col' },
                  h(
                    'div',
                    { className: 'lfd-list-head' },
                    h(
                      'div',
                      { className: 'lfd-list-summary' },
                      h('span', null, `命中 ${visibleTraces.length}/${allTraces.length} 条 Trace`),
                      h(
                        'span',
                        { className: 'lfd-badge' },
                        `${modeLabelMap[result.resolvedMode] || result.resolvedMode} · ${result.durationMs}ms`,
                      ),
                    ),
                    h(
                      'div',
                      { style: { fontSize: 11.5, color: 'var(--lfd-muted)' } },
                      `共 ${result.totalObservations} 个观测节点 · Token ${fmtNum(totalSessionTokens)}` +
                        (result.truncated ? '（已达分页上限，可缩小时间范围）' : ''),
                    ),
                    h(
                      'div',
                      { className: 'lfd-list-filters' },
                      h(
                        'label',
                        { className: 'lfd-check' },
                        h('input', {
                          type: 'checkbox',
                          checked: hideSideTraces,
                          onChange: (e) => setHideSideTraces(e.target.checked),
                        }),
                        '隐藏 Followup / 旁路',
                      ),
                      h(
                        'label',
                        { className: 'lfd-check' },
                        h('input', {
                          type: 'checkbox',
                          checked: onlyErrorTraces,
                          onChange: (e) => setOnlyErrorTraces(e.target.checked),
                        }),
                        '仅看异常',
                      ),
                    ),
                  ),
                  h(
                    'div',
                    { className: 'lfd-list-scroll' },
                    visibleTraces.length === 0
                      ? h('p', { style: { padding: 14, fontSize: 12, color: 'var(--lfd-muted)' } }, '当前筛选条件下无匹配 Trace')
                      : visibleTraces.map((tr) =>
                          h(
                            'button',
                            {
                              key: tr.traceId,
                              type: 'button',
                              className: 'lfd-trace-card',
                              'aria-selected': activeTrace?.traceId === tr.traceId ? 'true' : 'false',
                              onClick: () => setSelectedTraceId(tr.traceId),
                            },
                            h(
                              'div',
                              { className: 'lfd-trace-card-top' },
                              h('span', { className: 'lfd-trace-name' }, tr.title),
                              h(
                                'div',
                                { style: { display: 'flex', gap: 4, flex: 'none' } },
                                tr.hasError && h('span', { className: 'lfd-badge err' }, '异常'),
                                tr.isSideTrace
                                  ? h('span', { className: 'lfd-badge' }, '旁路')
                                  : h('span', { className: 'lfd-badge agent' }, '主轮次'),
                              ),
                            ),
                            tr.userPrompt && h('div', { className: 'lfd-trace-prompt' }, tr.userPrompt),
                            tr.finalOutput && h('div', { className: 'lfd-trace-reply' }, `回复：${tr.finalOutput}`),
                            h(
                              'div',
                              { className: 'lfd-trace-meta' },
                              h('span', null, fmtTime(tr.startTime)),
                              h('span', null, '·'),
                              h('span', null, fmtDuration(tr.durationMs)),
                              !tr.isSummaryOnly && h('span', null, '·'),
                              !tr.isSummaryOnly && h('span', null, `${tr.counts.generation} LLM / ${tr.counts.tool} Tool`),
                              tr.usage.total > 0 && h('span', null, `· ${fmtNum(tr.usage.total)} tok`),
                            ),
                            tr.runId &&
                              h(
                                'div',
                                { style: { fontSize: 10.5, fontFamily: 'var(--lfd-mono)', color: 'var(--lfd-muted)' } },
                                `run: ${tr.runId}`,
                              ),
                          ),
                        ),
                  ),
                ),
              h(
                'main',
                { className: 'lfd-detail-col' },
                !activeTrace
                  ? h(
                      'div',
                      { className: 'lfd-empty' },
                      h(
                        'div',
                        { className: 'lfd-empty-card' },
                        h('h3', null, '未命中匹配的 Trace'),
                        h('p', { style: { color: 'var(--lfd-muted)' } }, '请检查 ID 是否正确、所属环境（测试 / 生产）是否选对，或将时间范围调为「不限」。'),
                      ),
                    )
                  : h(
                      React.Fragment,
                      null,
                      h(
                        'section',
                        { className: 'lfd-card lfd-detail-header' },
                        h(
                          'div',
                          { className: 'lfd-detail-title-row' },
                          h(
                            'div',
                            { className: 'lfd-detail-title' },
                            h('h2', null, activeTrace.title),
                            activeTrace.hasError
                              ? h('span', { className: 'lfd-badge err' }, `异常 ${activeTrace.counts.error}`)
                              : h('span', { className: 'lfd-badge ok' }, '执行正常'),
                            activeTrace.agentCode && h('span', { className: 'lfd-badge mono' }, activeTrace.agentCode),
                            activeTrace.models.map((m) => h('span', { key: m, className: 'lfd-badge llm' }, m)),
                          ),
                          h(
                            'div',
                            { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
                            h(
                              'button',
                              {
                                type: 'button',
                                className: 'lfd-btn sm',
                                onClick: () => copyText('md-summary', buildTraceMarkdown(activeTrace)),
                              },
                              copiedKey === 'md-summary' ? '已复制排障摘要 ✓' : '复制 Markdown 摘要',
                            ),
                            activeTrace.langfuseUrl &&
                              h(
                                'a',
                                {
                                  className: 'lfd-btn sm',
                                  href: activeTrace.langfuseUrl,
                                  target: '_blank',
                                  rel: 'noopener noreferrer',
                                },
                                '在 Langfuse 打开 ↗',
                              ),
                          ),
                        ),
                        h(
                          'div',
                          { className: 'lfd-id-strip' },
                          h(
                            'div',
                            { className: 'lfd-id-pill' },
                            h('span', { style: { color: 'var(--lfd-muted)' } }, 'Trace'),
                            h('code', { title: activeTrace.traceId }, activeTrace.traceId),
                            renderCopyBtn('tid', activeTrace.traceId),
                          ),
                          activeTrace.runId &&
                            h(
                              'div',
                              { className: 'lfd-id-pill' },
                              h('span', { style: { color: 'var(--lfd-muted)' } }, 'Run ID'),
                              h('code', { title: activeTrace.runId }, activeTrace.runId),
                              renderCopyBtn('rid', activeTrace.runId),
                              h(
                                'button',
                                {
                                  type: 'button',
                                  className: 'lfd-btn ghost sm',
                                  style: { minHeight: 20, padding: '1px 6px', fontSize: 11, color: 'var(--lfd-brand)' },
                                  onClick: () => {
                                    setQueryText(activeTrace.runId);
                                    setMode('run_id');
                                    runQuery({ overrideQuery: activeTrace.runId, overrideMode: 'run_id' });
                                  },
                                },
                                '单查此 Run',
                              ),
                            ),
                          activeTrace.sessionId &&
                            h(
                              'div',
                              { className: 'lfd-id-pill' },
                              h('span', { style: { color: 'var(--lfd-muted)' } }, 'Session'),
                              h('code', { title: activeTrace.sessionId }, activeTrace.sessionId),
                              renderCopyBtn('sid', activeTrace.sessionId),
                              result.resolvedMode !== 'session_id' &&
                                h(
                                  'button',
                                  {
                                    type: 'button',
                                    className: 'lfd-btn ghost sm',
                                    style: { minHeight: 20, padding: '1px 6px', fontSize: 11, color: 'var(--lfd-brand)' },
                                    onClick: () => {
                                      setQueryText(activeTrace.sessionId);
                                      setMode('session_id');
                                      runQuery({ overrideQuery: activeTrace.sessionId, overrideMode: 'session_id' });
                                    },
                                  },
                                  '查看整个 Session',
                                ),
                            ),
                        ),
                        h(
                          'div',
                          { className: 'lfd-kpi-grid' },
                          h(
                            'div',
                            { className: 'lfd-kpi' },
                            h('div', { className: 'lfd-kpi-label' }, '总耗时'),
                            h('div', { className: 'lfd-kpi-val' }, fmtDuration(activeTrace.durationMs)),
                            h('div', { className: 'lfd-kpi-sub' }, fmtFullTime(activeTrace.startTime)),
                          ),
                          h(
                            'div',
                            { className: 'lfd-kpi' },
                            h('div', { className: 'lfd-kpi-label' }, '调用次数'),
                            h('div', { className: 'lfd-kpi-val' }, `${activeTrace.counts.generation} LLM · ${activeTrace.counts.tool} Tool`),
                            h('div', { className: 'lfd-kpi-sub' }, `共 ${activeTrace.counts.total} 节点`),
                          ),
                          h(
                            'div',
                            { className: 'lfd-kpi' },
                            h('div', { className: 'lfd-kpi-label' }, '输入 Token'),
                            h('div', { className: 'lfd-kpi-val' }, fmtNum(activeTrace.usage.input + activeTrace.usage.cached)),
                            h(
                              'div',
                              { className: 'lfd-kpi-sub' },
                              activeTrace.usage.cached > 0
                                ? `缓存命中 ${fmtNum(activeTrace.usage.cached)} (${Math.round((activeTrace.usage.cached / Math.max(activeTrace.usage.input + activeTrace.usage.cached, 1)) * 100)}%)`
                                : '未命中缓存',
                            ),
                          ),
                          h(
                            'div',
                            { className: 'lfd-kpi' },
                            h('div', { className: 'lfd-kpi-label' }, '输出 Token'),
                            h('div', { className: 'lfd-kpi-val' }, fmtNum(activeTrace.usage.output + activeTrace.usage.reasoning)),
                            h(
                              'div',
                              { className: 'lfd-kpi-sub' },
                              activeTrace.usage.reasoning > 0 ? `含推理思考 ${fmtNum(activeTrace.usage.reasoning)}` : `总计 ${fmtNum(activeTrace.usage.total)}`,
                            ),
                          ),
                        ),
                      ),
                      h(
                        'div',
                        { className: 'lfd-tabs' },
                        h(
                          'div',
                          { className: 'lfd-tab-list', role: 'tablist' },
                          [
                            ['flow', '对话与执行流'],
                            ['tree', `调用树 & 瀑布图 (${hideNoiseSpans ? activeTrace.counts.total - activeTrace.counts.noiseSpan : activeTrace.counts.total})`],
                            ['meta', '元数据 & 原始 JSON'],
                          ].map(([id, label]) =>
                            h(
                              'button',
                              {
                                key: id,
                                type: 'button',
                                role: 'tab',
                                className: 'lfd-tab-btn',
                                'aria-selected': detailTab === id ? 'true' : 'false',
                                onClick: () => setDetailTab(id),
                              },
                              label,
                            ),
                          ),
                        ),
                        h(
                          'div',
                          { className: 'lfd-list-filters', style: { paddingBottom: 6 } },
                          detailTab === 'flow' &&
                            h(
                              React.Fragment,
                              null,
                              h(
                                'button',
                                {
                                  type: 'button',
                                  className: 'lfd-btn sm',
                                  onClick: () => setExpandedSteps({}),
                                },
                                '全部折叠',
                              ),
                              h(
                                'button',
                                {
                                  type: 'button',
                                  className: 'lfd-btn sm',
                                  onClick: () => {
                                    const next = {};
                                    for (const st of activeTrace.flow) next[st.id] = true;
                                    setExpandedSteps(next);
                                  },
                                },
                                '全部展开',
                              ),
                              h(
                                'label',
                                { className: 'lfd-check' },
                                h('input', {
                                  type: 'checkbox',
                                  checked: onlyToolAndFinal,
                                  onChange: (e) => setOnlyToolAndFinal(e.target.checked),
                                }),
                                '聚焦工具与最终回复',
                              ),
                            ),
                          h(
                            'label',
                            { className: 'lfd-check' },
                            h('input', {
                              type: 'checkbox',
                              checked: hideNoiseSpans,
                              onChange: (e) => setHideNoiseSpans(e.target.checked),
                            }),
                            `隐藏 format 噪声 (${activeTrace.counts.noiseSpan})`,
                          ),
                        ),
                      ),
                      detailTab === 'flow' &&
                        h(
                          'div',
                          { className: 'lfd-flow' },
                          loadingTraceId === activeTrace.traceId &&
                            h('div', { className: 'lfd-banner', style: { margin: 0 } }, '正在拉取该 Trace 的完整 LLM 与工具调用链路...'),
                          activeTrace.flow.slice(0, visibleCount).map((step, i) => renderFlowStep(step, i)),
                          visibleCount < activeTrace.flow.length && h('button', { className: 'lfd-btn', style: { margin: 10 }, onClick: () => setVisibleCount(c => c + 20) }, `加载更多 (${activeTrace.flow.length - visibleCount} 个)`),
                        ),
                      detailTab === 'tree' && renderTreeAndWaterfall(activeTrace),
                      detailTab === 'meta' && renderMetadataTab(activeTrace),
                    ),
              ),
            ),
        h(EnvConfigDialog, {
          open: configOpen,
          onClose: () => setConfigOpen(false),
          state,
          onStateChange: setState,
          onNotify: notify,
        }),
      );
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register('langfuseDashboard', 'zh', { navLabel: 'Langfuse 看板' }));
        ctx.effect(() => ctx.locale.register('langfuseDashboard', 'en', { navLabel: 'Langfuse Traces' }));
        const t = ctx.locale.bind('langfuseDashboard');
        ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: 'langfuse-dashboard' }, App));
        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            { name: 'sidebar.panellist', id: 'langfuse-dashboard', order: 20, label: () => t('navLabel') },
            Icon,
          ),
        );
      },
    };
  },
});
