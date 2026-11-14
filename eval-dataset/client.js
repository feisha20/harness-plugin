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
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--ed-bg-base);
  color: var(--ed-text1);
  font: 13px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  box-sizing: border-box;
  position: relative;
}

.ed-app * { box-sizing: border-box; }
.ed-app :focus-visible { outline: 2px solid var(--ed-accent); outline-offset: 2px; }

/* Header */
.ed-header {
  padding: 14px 24px 12px;
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
  gap: 8px;
  flex-wrap: wrap;
}

/* Custom Environment Dropdown */
.ed-env-dropdown-wrapper {
  position: relative;
  display: inline-block;
}
.ed-env-trigger {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 28px;
  padding: 0 10px;
  background: var(--ed-bg-base);
  border: 1px solid var(--ed-border1);
  border-radius: 6px;
  color: var(--ed-text1);
  font: inherit;
  font-size: 12px;
  font-weight: 550;
  cursor: pointer;
  outline: none;
  transition: all 0.15s ease;
  user-select: none;
}
.ed-env-trigger:hover {
  background: var(--ed-bg-layer2);
  border-color: var(--ed-border2);
}
.ed-env-trigger.open {
  border-color: var(--ed-accent);
  box-shadow: 0 0 0 2px rgba(30, 128, 255, 0.15);
}
.ed-env-label {
  letter-spacing: 0.1px;
}
.ed-env-chevron {
  color: var(--ed-text2);
  transition: transform 0.2s ease;
  display: inline-flex;
  align-items: center;
}
.ed-env-chevron.open {
  transform: rotate(180deg);
}
.ed-env-menu {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  min-width: 156px;
  background: var(--ed-bg-base);
  border: 1px solid var(--ed-border1);
  border-radius: 8px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.05);
  padding: 4px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 2px;
  animation: edFadeIn 0.15s cubic-bezier(0, 0, 0.2, 1);
}
@keyframes edFadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
.ed-env-menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-radius: 5px;
  font-size: 12px;
  color: var(--ed-text1);
  cursor: pointer;
  transition: background 0.12s ease;
  user-select: none;
}
.ed-env-menu-item:hover {
  background: var(--ed-bg-layer2);
}
.ed-env-menu-item.selected {
  background: rgba(30, 128, 255, 0.08);
  color: var(--ed-accent);
  font-weight: 600;
}
.ed-env-item-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ed-env-item-check {
  color: var(--ed-accent);
  display: inline-flex;
  align-items: center;
  margin-left: 8px;
}
.ed-env-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
.ed-env-dot-prod { background: var(--ed-success); box-shadow: 0 0 0 2px rgba(0, 180, 42, 0.2); }
.ed-env-dot-preprod { background: #8b5cf6; box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.25); }
.ed-env-dot-test { background: var(--ed-warn); box-shadow: 0 0 0 2px rgba(255, 125, 0, 0.2); }
.ed-env-dot-dev { background: var(--ed-accent); }

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
  white-space: nowrap;
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
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-top: 14px;
}
.ed-metric-card {
  min-width: 0;
  text-align: left;
  font: inherit;
  color: inherit;
  background: var(--ed-bg-base);
  border: 1px solid var(--ed-border1);
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
}
button.ed-metric-card { cursor: pointer; }
button.ed-metric-card:hover { background: var(--ed-bg-layer2); }
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
  width: 240px;
  max-width: 100%;
}
.ed-search-box:focus-within { border-color: var(--ed-accent); }
.ed-search-box > svg { flex: none; }
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
  flex: 0 0 clamp(225px, 36%, 440px);
  min-width: 0;
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
  flex-wrap: wrap;
  gap: 4px 10px;
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
  flex-wrap: wrap;
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
  overflow-wrap: anywhere;
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
  min-width: 0;
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
  gap: 8px 16px;
  flex-wrap: wrap;
}
.ed-detail-title {
  flex: 1 1 250px;
  min-width: 0;
  overflow-wrap: anywhere;
}
.ed-detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-width: 100%;
}
.ed-detail-header > .ed-btn { flex: none; }
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
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}
.ed-tabs-row {
  display: flex;
  overflow-x: auto;
  flex-shrink: 0;
  border-bottom: 1px solid var(--ed-border1);
  padding: 0 20px;
  background: var(--ed-bg-layer1);
  gap: 16px;
}
.ed-tab-btn {
  flex: none;
  white-space: nowrap;
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
  overflow-wrap: anywhere;
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
.ed-error-jump-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  background: var(--ed-bg-layer1);
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  flex-wrap: wrap;
}
.ed-error-jump-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #dc2626;
}
.ed-error-jump-chips {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
}
.ed-error-jump-chip {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid rgba(239, 68, 68, 0.25);
  background: rgba(239, 68, 68, 0.06);
  color: #dc2626;
  cursor: pointer;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: all 0.15s ease;
}
.ed-error-jump-chip:hover {
  background: rgba(239, 68, 68, 0.14);
}
.ed-error-jump-chip.active {
  background: #dc2626;
  color: #fff;
  border-color: #dc2626;
}
.ed-error-jump-nav {
  display: flex;
  align-items: center;
  gap: 6px;
}
.ed-error-jump-btn {
  padding: 3px 9px;
  border-radius: 5px;
  font-size: 11.5px;
  font-weight: 500;
  border: 1px solid var(--ed-border1);
  background: var(--ed-bg-layer2);
  color: var(--ed-text1);
  cursor: pointer;
}
.ed-error-jump-btn:hover {
  border-color: #dc2626;
  color: #dc2626;
}
.ed-bubble-jump-highlight {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.35);
  transition: box-shadow 0.3s ease;
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
.ed-bubble-reasoning > summary { cursor: pointer; }
.ed-bubble-reasoning > summary::-webkit-details-marker { display: none; }
.ed-bubble-reasoning:not([open]) > summary { border-bottom: 0; }
.ed-bubble-reasoning > summary:focus-visible { outline-offset: -2px; }
.ed-bubble-reasoning-title { display: flex; align-items: center; gap: 6px; }
.ed-bubble-reasoning[open] .ed-bubble-reasoning-title > svg { transform: rotate(180deg); }
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

/* Modal Overlay */
.ed-modal-backdrop {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}
.ed-modal {
  width: 660px;
  max-width: 92vw;
  background: var(--ed-bg-base);
  border-radius: 10px;
  border: 1px solid var(--ed-border1);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.ed-modal-header {
  padding: 14px 20px;
  border-bottom: 1px solid var(--ed-border1);
  background: var(--ed-bg-layer1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ed-modal-header h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
}
.ed-modal-body {
  padding: 18px 20px;
  overflow-y: auto;
  max-height: 76vh;
}
.ed-form-item {
  margin-bottom: 14px;
}
.ed-form-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 5px;
  color: var(--ed-text1);
}
.ed-form-label-sub {
  display: block;
  font-size: 11px;
  font-weight: 550;
  color: var(--ed-text2);
  margin-bottom: 4px;
}
.ed-form-input {
  width: 100%;
  padding: 6px 10px;
  font: inherit;
  font-size: 12px;
  border: 1px solid var(--ed-border1);
  border-radius: 6px;
  background: var(--ed-bg-base);
  color: inherit;
  outline: none;
}
.ed-form-input:focus {
  border-color: var(--ed-accent);
}
.ed-form-tip {
  font-size: 11px;
  color: var(--ed-text2);
  margin-top: 4px;
  line-height: 1.4;
}
.ed-input-with-eye-wrap {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}
.ed-input-with-eye-wrap .ed-form-input {
  padding-right: 32px;
  width: 100%;
}
.ed-eye-btn {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--ed-text2);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.15s ease, background-color 0.15s ease;
}
.ed-eye-btn:hover {
  color: var(--ed-text1);
  background: var(--ed-bg-layer2);
}
.ed-credentials-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1.2fr;
  gap: 10px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--ed-border1);
}
.ed-credentials-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--ed-text2);
  grid-column: 1 / -1;
  margin-bottom: -4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Environment Accordion List */
.ed-env-accordion-item {
  border: 1px solid var(--ed-border1);
  border-radius: 8px;
  margin-bottom: 8px;
  background: var(--ed-bg-base);
  overflow: hidden;
  transition: all 0.15s ease;
}
.ed-env-accordion-item:last-child {
  margin-bottom: 0;
}
.ed-env-accordion-item.expanded {
  border-color: var(--ed-border2);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}
.ed-env-accordion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  cursor: pointer;
  user-select: none;
  background: var(--ed-bg-base);
  transition: background-color 0.15s ease;
}
.ed-env-accordion-header:hover {
  background: var(--ed-bg-layer2);
}
.ed-env-accordion-header.expanded {
  background: var(--ed-bg-layer1);
  border-bottom: 1px solid var(--ed-border1);
}
.ed-env-accordion-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ed-env-accordion-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ed-env-accordion-chevron {
  color: var(--ed-text2);
  display: inline-flex;
  align-items: center;
  transition: transform 0.2s cubic-bezier(0, 0, 0.2, 1);
}
.ed-env-accordion-chevron.expanded {
  transform: rotate(180deg);
}
.ed-env-accordion-body {
  padding: 14px 14px 14px;
  background: var(--ed-bg-base);
  animation: edAccordionSlide 0.2s cubic-bezier(0, 0, 0.2, 1);
}
@keyframes edAccordionSlide {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
.ed-modal-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--ed-border1);
  background: var(--ed-bg-layer1);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

/* Mode Switcher */
.ed-mode-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 24px;
  background: var(--ed-bg-base);
  border-bottom: 1px solid var(--ed-border1);
  gap: 12px;
  flex-shrink: 0;
}
.ed-mode-group {
  display: inline-flex;
  background: var(--ed-bg-layer2);
  padding: 3px;
  border-radius: 8px;
  border: 1px solid var(--ed-border1);
  gap: 3px;
}
.ed-mode-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  border-radius: 6px;
  border: none;
  background: none;
  color: var(--ed-text2);
  font-size: 12px;
  font-weight: 550;
  cursor: pointer;
  transition: all 0.15s ease;
}
.ed-mode-btn:hover {
  color: var(--ed-text1);
}
.ed-mode-btn.active {
  background: var(--ed-bg-base);
  color: var(--ed-text1);
  font-weight: 650;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.ed-mode-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  padding: 0 6px;
  height: 18px;
  border-radius: 9px;
  background: rgba(0,0,0,0.06);
  font-weight: 600;
}
.ed-mode-btn.active .ed-mode-badge-cases {
  background: #e8f3ff;
  color: #165dff;
}
.ed-mode-btn.active .ed-mode-badge-badcase {
  background: #fff0f0;
  color: #cf1322;
}
.ed-mode-btn.active .ed-mode-badge-official {
  background: rgba(5, 150, 105, 0.12);
  color: #059669;
}

/* Official Dataset Buttons & Badges */
.ed-btn-official {
  background: color-mix(in srgb, #059669 10%, var(--ed-bg-base));
  border: 1px solid color-mix(in srgb, #059669 35%, transparent);
  color: #059669;
  font-weight: 550;
}
.ed-btn-official:hover:not(:disabled) {
  background: #059669;
  color: #ffffff;
  border-color: #059669;
}
.ed-prio-badge {
  font-size: 10.5px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
  letter-spacing: 0.2px;
  display: inline-flex;
  align-items: center;
}
.ed-prio-P0 { background: rgba(220, 38, 38, 0.1); color: #dc2626; border: 1px solid rgba(220, 38, 38, 0.25); }
.ed-prio-P1 { background: rgba(30, 128, 255, 0.1); color: #1e80ff; border: 1px solid rgba(30, 128, 255, 0.25); }
.ed-prio-P2 { background: var(--ed-bg-layer2); color: var(--ed-text2); border: 1px solid var(--ed-border1); }

.ed-source-badge {
  font-size: 10.5px;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.ed-source-case {
  background: rgba(30, 128, 255, 0.08);
  color: #165dff;
  border: 1px solid rgba(30, 128, 255, 0.22);
}
.ed-source-badcase {
  background: rgba(217, 119, 6, 0.08);
  color: #d97706;
  border: 1px solid rgba(217, 119, 6, 0.25);
}
.ed-source-manual {
  background: rgba(139, 92, 246, 0.08);
  color: #7c3aed;
  border: 1px solid rgba(139, 92, 246, 0.25);
}
.ed-eval-criteria-box {
  background: color-mix(in srgb, #059669 5%, var(--ed-bg-base));
  border: 1px solid color-mix(in srgb, #059669 25%, transparent);
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--ed-text1);
  white-space: pre-wrap;
}
.ed-eval-criteria-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}
.ed-eval-criteria-title {
  font-size: 12px;
  font-weight: 650;
  color: #059669;
}
.ed-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.ed-tool-tag {
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 4px;
  background: var(--ed-bg-layer2);
  border: 1px solid var(--ed-border1);
  color: var(--ed-text1);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.ed-tag-badge {
  font-size: 10.5px;
  font-weight: 600;
  padding: 1.5px 6px;
  border-radius: 4px;
}
.ed-toast {
  position: fixed;
  bottom: 24px;
  right: 28px;
  background: #1d2129;
  color: #ffffff;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 550;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  z-index: 2000;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: edFadeIn 0.2s ease;
}
.ed-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  z-index: 1250;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ed-modal-content {
  width: 640px;
  max-width: 92vw;
  background: var(--ed-bg-base);
  border-radius: 10px;
  border: 1px solid var(--ed-border1);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.ed-icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--ed-text2);
  padding: 4px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.ed-icon-btn:hover {
  background: var(--ed-bg-layer2);
  color: var(--ed-text1);
}

/* Badcase Badges & Severity - Refined & Restrained */
.ed-severity-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 1.5px 6px;
  border-radius: 4px;
  line-height: 1.35;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  letter-spacing: 0.2px;
}
.ed-severity-critical {
  background: rgba(220, 38, 38, 0.08);
  border: 1px solid rgba(220, 38, 38, 0.25);
  color: #dc2626;
}
.ed-severity-high {
  background: rgba(217, 119, 6, 0.08);
  border: 1px solid rgba(217, 119, 6, 0.25);
  color: #d97706;
}
.ed-severity-medium {
  background: rgba(37, 99, 235, 0.08);
  border: 1px solid rgba(37, 99, 235, 0.25);
  color: #2563eb;
}
.ed-badcase-type-tag {
  font-size: 11px;
  padding: 1.5px 6px;
  background: var(--ed-bg-layer2);
  border: 1px solid var(--ed-border1);
  border-radius: 4px;
  color: var(--ed-text2);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.ed-badcase-type-tag-danger {
  background: rgba(220, 38, 38, 0.08);
  border-color: rgba(220, 38, 38, 0.28);
  color: #dc2626;
  font-weight: 600;
}
.ed-badcase-count-tag {
  font-size: 10.5px;
  padding: 1.5px 5px;
  border-radius: 4px;
  background: rgba(220, 38, 38, 0.06);
  border: 1px solid rgba(220, 38, 38, 0.2);
  color: #dc2626;
  font-weight: 550;
  font-variant-numeric: tabular-nums;
  display: inline-flex;
  align-items: center;
}
.ed-badcase-card-desc {
  font-size: 11.5px;
  color: var(--ed-text2);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 1px;
}

/* Badcase Diagnostics - Clean Unified Dossier */
.ed-diag-panel {
  background: var(--ed-bg-base);
  border: 1px solid var(--ed-border1);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}
.ed-diag-section {
  padding: 14px 16px;
  border-bottom: 1px solid var(--ed-border1);
}
.ed-diag-section:last-child {
  border-bottom: none;
}
.ed-diag-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.ed-diag-section-title {
  font-size: 12px;
  font-weight: 650;
  color: var(--ed-text1);
  display: flex;
  align-items: center;
  gap: 7px;
  letter-spacing: 0.2px;
}
.ed-diag-section-tag {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 1px 6px;
  border-radius: 3px;
}
.ed-diag-text {
  font-size: 12.5px;
  color: var(--ed-text1);
  line-height: 1.6;
}
.ed-diag-action-box {
  background: color-mix(in srgb, var(--ed-accent) 4%, var(--ed-bg-base));
  border: 1px solid color-mix(in srgb, var(--ed-accent) 18%, transparent);
  border-radius: 6px;
  padding: 10px 14px;
  margin-top: 4px;
}
.ed-diag-action-text {
  font-size: 12.5px;
  color: var(--ed-text1);
  line-height: 1.6;
}
.ed-diag-evidence-terminal {
  background: var(--ed-bg-layer1);
  border: 1px solid var(--ed-border1);
  border-radius: 6px;
  overflow: hidden;
  margin-top: 4px;
}
.ed-diag-evidence-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background: var(--ed-bg-layer2);
  border-bottom: 1px solid var(--ed-border1);
  font-size: 11px;
  color: var(--ed-text2);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
.ed-diag-evidence-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  padding: 10px 12px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 170px;
  overflow-y: auto;
  color: #b91c1c;
  line-height: 1.5;
  background: var(--ed-bg-base);
}

/* Meta Chips in Header */
.ed-meta-chips-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}
.ed-meta-chip {
  min-width: 0;
  max-width: 100%;
  overflow-wrap: anywhere;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1.5px 7px;
  background: var(--ed-bg-layer1);
  border: 1px solid var(--ed-border1);
  border-radius: 4px;
  font-size: 11px;
  color: var(--ed-text2);
  line-height: 1.4;
}

/* Regression Testing Console & Drawer */
.ed-btn-regression {
  background: color-mix(in srgb, #165dff 10%, var(--ed-bg-base));
  border: 1px solid color-mix(in srgb, #165dff 35%, transparent);
  color: #165dff;
  font-weight: 550;
}
.ed-btn-regression:hover {
  background: #165dff;
  color: #ffffff;
  border-color: #165dff;
}

.ed-reg-drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ed-reg-drawer-content {
  width: 980px;
  max-width: 94vw;
  height: 84vh;
  background: var(--ed-bg-base);
  border: 1px solid var(--ed-border1);
  border-radius: 12px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.16);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.ed-reg-drawer-header {
  padding: 14px 20px;
  border-bottom: 1px solid var(--ed-border1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  background: var(--ed-bg-layer1);
}
.ed-reg-drawer-title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
.ed-reg-drawer-title h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
  color: var(--ed-text1);
}
.ed-reg-body-split {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.ed-reg-sidebar {
  width: clamp(150px, 33%, 320px);
  min-width: 0;
  border-right: 1px solid var(--ed-border1);
  background: var(--ed-bg-layer1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.ed-reg-sidebar-header {
  padding: 10px 14px;
  border-bottom: 1px solid var(--ed-border1);
  font-size: 11.5px;
  color: var(--ed-text2);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ed-reg-task-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ed-reg-task-card {
  padding: 10px 12px;
  background: var(--ed-bg-base);
  border: 1px solid var(--ed-border1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.ed-reg-task-card:hover {
  background: var(--ed-bg-layer2);
  border-color: var(--ed-border2);
}
.ed-reg-task-card.active {
  background: color-mix(in srgb, #165dff 8%, var(--ed-bg-base));
  border-color: #165dff;
}
.ed-reg-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.ed-reg-status-pill {
  font-size: 10.5px;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  letter-spacing: 0.2px;
}
.ed-reg-status-running {
  background: rgba(22, 93, 255, 0.1);
  border: 1px solid rgba(22, 93, 255, 0.25);
  color: #165dff;
}
.ed-reg-status-completed {
  background: rgba(0, 180, 42, 0.1);
  border: 1px solid rgba(0, 180, 42, 0.25);
  color: #00b42a;
}
.ed-reg-status-failed {
  background: rgba(245, 63, 63, 0.1);
  border: 1px solid rgba(245, 63, 63, 0.25);
  color: #f53f3f;
}
.ed-reg-status-cancelled {
  background: var(--ed-bg-layer2);
  border: 1px solid var(--ed-border1);
  color: var(--ed-text2);
}
.ed-reg-status-pending {
  background: rgba(255, 125, 0, 0.1);
  border: 1px solid rgba(255, 125, 0, 0.25);
  color: #ff7d00;
}

.ed-reg-detail-pane {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 18px 22px;
  background: var(--ed-bg-base);
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.ed-reg-detail-meta {
  background: var(--ed-bg-layer1);
  border: 1px solid var(--ed-border1);
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.ed-reg-spin {
  display: inline-block;
  animation: edSpin 1.2s infinite linear;
}
@keyframes edSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.ed-reg-compare-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
@media (max-width: 800px) {
  .ed-reg-compare-grid { grid-template-columns: 1fr; }
}
.ed-reg-compare-col {
  min-width: 0;
  overflow-wrap: anywhere;
  background: var(--ed-bg-base);
  border: 1px solid var(--ed-border1);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.ed-reg-compare-head {
  padding: 8px 12px;
  background: var(--ed-bg-layer2);
  border-bottom: 1px solid var(--ed-border1);
  font-size: 11px;
  font-weight: 600;
  color: var(--ed-text2);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ed-reg-compare-body {
  padding: 12px;
  font-size: 12px;
  line-height: 1.6;
  max-height: 280px;
  overflow-y: auto;
  color: var(--ed-text1);
}

@container (max-width: 690px) {
  .ed-header, .ed-toolbar { padding-inline: 12px; }
  .ed-detail-header, .ed-detail-body, .ed-tabs-row { padding-inline: 12px; }
  .ed-list-pane { flex-basis: 40%; }
}

/* Segmented Control (ToolCallStatsPanel & sub-switchers) */
.ed-seg-control {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  background: var(--ed-bg-layer2);
  border: 1px solid var(--ed-border1);
  border-radius: 8px;
}
.ed-seg-btn {
  appearance: none;
  border: none;
  background: transparent;
  color: var(--ed-text2);
  font-size: 12px;
  font-weight: 500;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  line-height: 1.3;
  transition: background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
  white-space: nowrap;
}
.ed-seg-btn:hover {
  color: var(--ed-text1);
}
.ed-seg-btn.active {
  background: var(--ed-bg-base);
  color: var(--ed-text1);
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04);
}
.ed-seg-count {
  font-size: 11px;
  font-weight: 500;
  color: var(--ed-text2);
  background: rgba(0, 0, 0, 0.05);
  padding: 1px 6px;
  border-radius: 10px;
}
.ed-seg-btn.active .ed-seg-count {
  color: var(--ed-accent);
  background: rgba(30, 128, 255, 0.1);
}

/* Inline SVG Icon Alignment */
.ed-ico-text,
.ed-metric-label,
.ed-tab-btn,
.ed-tag-pill,
.ed-tag-badge,
.ed-reason-pill,
.ed-source-badge,
.ed-eval-criteria-title,
.ed-tool-tag,
.ed-reg-status-pill,
.ed-error-jump-info,
.ed-meta-chip,
.ed-copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.ed-tag-badge,
.ed-reason-pill,
.ed-source-badge,
.ed-tool-tag,
.ed-reg-status-pill,
.ed-meta-chip,
.ed-copy-btn {
  gap: 4px;
}
.ed-form-label.ed-ico-text,
.ed-form-label-sub.ed-ico-text {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
@container (max-width: 900px) {
  .ed-header { padding-block: 10px; }
  .ed-metrics {
    grid-template-columns: repeat(5, minmax(105px, 1fr));
    overflow-x: auto;
    gap: 6px;
    margin-top: 8px;
  }
  .ed-metric-card { padding: 6px 8px; }
  .ed-metric-sub { display: none; }
  .ed-detail-pane { overflow-y: auto; }
  .ed-detail-body { flex: none; overflow: visible; }
  .ed-detail-header { flex-shrink: 0; }
  .ed-list-header { flex-shrink: 0; }
  .ed-toolbar .ed-tags-group {
    flex-wrap: nowrap;
    overflow-x: auto;
    min-width: 0;
    padding-block: 3px;
  }
  .ed-tag-pill { flex: none; }
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

    function Glyph({ kind = 'dataset', size = 16, className = '', style = null, strokeWidth = 1.75 }) {
      const specs = {
        dataset: ['M4 6h16M4 10h16M4 14h16M4 18h16'],
        filter: ['M3 4h18l-7 8v6l-4 2v-8L3 4z'],
        refresh: ['M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8', 'M3 3v5h5', 'M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16', 'M16 16h5v5'],
        spinner: ['M21 12a9 9 0 1 1-6.219-8.56'],
        download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'],
        check: ['M5 12.5l4.2 4.2L19 7'],
        copy: [{ rect: { x: 9, y: 9, width: 11, height: 11, rx: 2 } }, 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'],
        gear: [{ circle: { cx: 12, cy: 12, r: 3 } }, 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'],
        close: ['M18 6L6 18', 'M6 6l12 12'],
        chevronDown: ['M6 9l6 6 6-6'],
        eye: ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z', { circle: { cx: 12, cy: 12, r: 3 } }],
        eyeOff: ['M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94', 'M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19', 'M14.12 14.12a3 3 0 1 1-4.24-4.24', 'M1 1l22 22'],
        alertCircle: [{ circle: { cx: 12, cy: 12, r: 10 } }, 'M12 8v4', 'M12 16h.01'],
        alertTriangle: ['M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z', 'M12 9v4', 'M12 17h.01'],
        target: [{ circle: { cx: 12, cy: 12, r: 9.5 } }, { circle: { cx: 12, cy: 12, r: 5.5 } }, { circle: { cx: 12, cy: 12, r: 1.8 } }],
        tool: ['M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z'],
        bookmark: ['M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z'],
        pin: ['M12 17v5', 'M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z'],
        plus: ['M12 5v14', 'M5 12h14'],
        trash: ['M3 6h18', 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6', 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'],
        edit: ['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7', 'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'],
        brain: ['M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z', 'M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z', 'M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4', 'M12 18v-5'],
        user: ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', { circle: { cx: 12, cy: 7, r: 4 } }],
        bot: ['M12 8V4H8', { rect: { x: 4, y: 8, width: 16, height: 12, rx: 3 } }, 'M2 14h2', 'M20 14h2', 'M9 13v2', 'M15 13v2'],
        rocket: ['M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z', 'M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z', 'M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0', 'M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5'],
        zap: ['M13 2L4 14h7l-1 8 9-12h-7l1-8z'],
        chat: ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
        search: [{ circle: { cx: 11, cy: 11, r: 7.5 } }, 'M20 20l-3.8-3.8'],
        clipboard: [{ rect: { x: 8, y: 2, width: 8, height: 4, rx: 1 } }, 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2', 'M9 12h6', 'M9 16h4'],
        save: ['M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z', 'M17 21v-8H7v8', 'M7 3v5h8'],
        stop: [{ rect: { x: 6, y: 6, width: 12, height: 12, rx: 2 } }],
        layers: ['M12 2L2 7l10 5 10-5-10-5z', 'M2 17l10 5 10-5', 'M2 12l10 5 10-5'],
        barChart: ['M3 3v18h18', 'M18 17V9', 'M13 17V5', 'M8 17v-3']
      };
      const items = specs[kind] || specs.dataset;
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        className: className || undefined,
        style: Object.assign({ flexShrink: 0, verticalAlign: 'middle' }, style || {}),
        'aria-hidden': true
      }, items.map((item, idx) => {
        if (typeof item === 'string') return h('path', { key: idx, d: item });
        if (item.circle) return h('circle', { key: idx, ...item.circle });
        if (item.rect) return h('rect', { key: idx, ...item.rect });
        return null;
      }));
    }

    function SidebarIcon({ size = 20 }) {
      return h('svg', {
        width: size, height: size, viewBox: '0 0 24 24',
        fill: 'none', stroke: 'currentColor', strokeWidth: 1.7,
        strokeLinecap: 'round', strokeLinejoin: 'round',
        'aria-hidden': true
      },
        h('path', { d: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2' }),
        h('rect', { x: 9, y: 3, width: 6, height: 4, rx: 1 }),
        h('path', { d: 'M9 12l2 2 4-4' }),
        h('path', { d: 'M9 17h6' })
      );
    }

    const CLIENT_METRICS_VERSION = 3;
    const BADCASE_LABEL_MODEL_LIMIT = '模型交互达上限';
    const BADCASE_LABEL_HIGH_STEPS = '单轮高步数(>100步)';
    const conversationRoles = new Set(['user', 'assistant', 'tool']);

    function isFollowupMessage(m) {
      return Boolean(m) && m.role === 'followup';
    }

    function isToolCallMessage(m) {
      return Boolean(m) && (m.role === 'tool' || Boolean(m.toolName));
    }

    function isStepMessage(m) {
      return Boolean(m) && m.role !== 'user' && m.role !== 'assistant' && !isFollowupMessage(m);
    }

    function isModelInteractionMessage(m) {
      return Boolean(m) && m.role !== 'user' && !isFollowupMessage(m) && !isToolCallMessage(m);
    }

    function getModelInteractionKey(m, idx) {
      const id = m && m.messageId ? String(m.messageId) : '';
      return id ? id.replace(/-(text|thinking)$/, '') : `__msg_${idx}`;
    }

    function computeConversationMetrics(messages) {
      const msgs = Array.isArray(messages) ? messages : [];
      let turnsCount = 0;
      let totalSteps = 0;
      let maxTurnSteps = 0;
      let maxTurnToolCalls = 0;
      let maxTurnIndex = 1;
      let maxTurnModelInteractions = 0;
      let maxModelTurnIndex = 1;
      let toolCallsCount = 0;
      let curTurnSteps = 0;
      let curTurnTools = 0;
      let curTurnModelKeys = new Set();
      const allModelKeys = new Set();
      let curTurnIdx = 0;

      const commitTurn = () => {
        if (curTurnIdx <= 0) return;
        if (curTurnSteps > maxTurnSteps || curTurnTools > maxTurnToolCalls) {
          maxTurnSteps = Math.max(maxTurnSteps, curTurnSteps);
          maxTurnToolCalls = Math.max(maxTurnToolCalls, curTurnTools);
          maxTurnIndex = curTurnIdx;
        }
        if (curTurnModelKeys.size > maxTurnModelInteractions) {
          maxTurnModelInteractions = curTurnModelKeys.size;
          maxModelTurnIndex = curTurnIdx;
        }
      };

      for (let i = 0; i < msgs.length; i++) {
        const m = msgs[i];
        if (!m || isFollowupMessage(m)) continue;
        if (isModelInteractionMessage(m)) {
          allModelKeys.add(getModelInteractionKey(m, i));
        }
        if (m.role === 'user') {
          commitTurn();
          curTurnIdx += 1;
          turnsCount += 1;
          curTurnSteps = 0;
          curTurnTools = 0;
          curTurnModelKeys = new Set();
        } else {
          if (curTurnIdx === 0) {
            curTurnIdx = 1;
            turnsCount = 1;
          }
          if (isStepMessage(m)) {
            curTurnSteps += 1;
            totalSteps += 1;
          }
          if (isToolCallMessage(m)) {
            curTurnTools += 1;
            toolCallsCount += 1;
          } else if (isModelInteractionMessage(m)) {
            curTurnModelKeys.add(getModelInteractionKey(m, i));
          }
        }
      }
      commitTurn();

      return {
        turnsCount: Math.max(1, turnsCount),
        totalSteps,
        maxTurnSteps,
        maxTurnToolCalls,
        maxTurnIndex,
        maxTurnModelInteractions,
        maxModelTurnIndex,
        modelInteractions: allModelKeys.size,
        toolCallsCount
      };
    }

    function renderReasoningMessage(message, key) {
      return h('details', { key, className: 'ed-bubble ed-bubble-tool ed-bubble-reasoning' },
        h('summary', { className: 'ed-bubble-head' },
          h('span', { className: 'ed-bubble-reasoning-title ed-ico-text' },
            h(Glyph, { kind: 'chevronDown', size: 12 }),
            h(Glyph, { kind: 'brain', size: 13 }),
            `模型思考推理 (${message.role})`
          ),
          h('span', { style: { fontWeight: 'normal', color: 'var(--ed-text2)' } }, (message.createdAt || '').slice(11, 19))
        ),
        h('div', { className: 'ed-bubble-body' }, message.content)
      );
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register('evalDataset', 'zh', {
          '评测集': '评测集',
          'KuaiBuddy 评测集提取': 'KuaiBuddy 评测集提取'
        }));

        function getToolExecutionDetails(tm) {
          const baseName = tm.toolName || 'Tool';
          let specificName = baseName;
          let isFailed = false;
          let errorDetail = '';

          // 1. 运行命令 (bash / shell)
          if (baseName === '运行命令') {
            let cmd = '';
            try {
              const parsedArgs = typeof tm.toolArgs === 'string' ? JSON.parse(tm.toolArgs) : tm.toolArgs;
              cmd = parsedArgs?.command || '';
            } catch (e) {
              cmd = tm.toolArgs || '';
            }
            const firstLine = (cmd || '').trim().split('\n')[0] || '';
            let sub = '';
            if (cmd.includes('python')) sub = 'python';
            else if (cmd.includes('grep')) sub = 'grep';
            else if (cmd.includes('curl') || cmd.includes('fetch')) sub = 'curl';
            else if (cmd.includes('node')) sub = 'node';
            else if (firstLine) sub = firstLine.slice(0, 24);
            if (sub) specificName = `运行命令 (${sub})`;

            const text = tm.content || tm.toolResult || '';
            const exitMatch = text.match(/Exit code:\s*(\d+)/i);
            if (exitMatch && exitMatch[1] !== '0') {
              isFailed = true;
              errorDetail = `命令退出异常 (Exit code: ${exitMatch[1]})`;
            } else if (/(command not found|syntax error|fatal:|Traceback \(most recent call last\):)/i.test(text)) {
              isFailed = true;
              errorDetail = '命令执行异常或命令不存在';
            }
            return { baseName, specificName, isFailed, errorDetail };
          }

          // 2. 执行工具 / 对话记录 (KuaiBuddy 核心业务工具或 MCP)
          if (baseName === '执行工具' || baseName === '对话记录') {
            let sourceTool = '';
            const text = tm.content || tm.toolResult || '';
            try {
              const res = typeof text === 'string' ? JSON.parse(text) : text;
              sourceTool = res?.source?.tool || '';
              if (res?.error) {
                isFailed = true;
                errorDetail = typeof res.error === 'string' ? res.error : JSON.stringify(res.error);
              } else if (res?.status === 'ERROR' || res?.status === 'FAILED') {
                isFailed = true;
                errorDetail = res?.statusDescription || '接口调用返回失败状态';
              } else if (res?.code && res?.code !== 0 && res?.code !== 200 && res?.code !== 8) {
                isFailed = true;
                errorDetail = res?.msg || `接口异常响应码 [${res.code}]`;
              }
            } catch (e) {}

            if (!sourceTool) {
              try {
                const args = typeof tm.toolArgs === 'string' ? JSON.parse(tm.toolArgs) : tm.toolArgs;
                sourceTool = args?.tool || args?.action || args?.mode || '';
              } catch (e) {}
            }

            if (sourceTool) {
              specificName = sourceTool;
            }
            return { baseName, specificName, isFailed, errorDetail };
          }

          // 3. 抓取网页 (Web fetch)
          if (baseName === '抓取网页') {
            let url = '';
            try {
              const args = typeof tm.toolArgs === 'string' ? JSON.parse(tm.toolArgs) : tm.toolArgs;
              url = args?.url || '';
            } catch (e) {}
            try {
              const domain = new URL(url).hostname;
              if (domain) specificName = `抓取网页 (${domain})`;
            } catch (e) {}

            const text = tm.content || tm.toolResult || '';
            const statusMatch = text.match(/^status=(\d+)/i);
            if (statusMatch) {
              const code = parseInt(statusMatch[1], 10);
              if (code >= 400) {
                isFailed = true;
                errorDetail = `HTTP ${code}`;
              }
            } else if (/(ECONNREFUSED|ETIMEDOUT|FetchError|timeout)/i.test(text)) {
              isFailed = true;
              errorDetail = '网络请求超时或连接被拒绝';
            }
            return { baseName, specificName, isFailed, errorDetail };
          }

          // 4. 通用工具失败检测
          const text = tm.content || tm.toolResult || '';
          if (/(ToolCallError|Exception|failed with|ECONNREFUSED|ETIMEDOUT|请求失败|调用失败)/i.test(text)) {
            isFailed = true;
            errorDetail = text.slice(0, 120);
          }

          return { baseName, specificName, isFailed, errorDetail };
        }

        function ConversationTimeline({ messages, scopeId }) {
          const [activeErrorIdx, setActiveErrorIdx] = React.useState(0);
          const [highlightMsgIdx, setHighlightMsgIdx] = React.useState(null);
          const itemRefs = React.useRef({});

          React.useEffect(() => {
            setActiveErrorIdx(0);
            setHighlightMsgIdx(null);
          }, [scopeId]);

          const safeMessages = (Array.isArray(messages) ? messages : []).filter(m => !isFollowupMessage(m));
          const errorItems = [];
          safeMessages.forEach((m, idx) => {
            if (conversationRoles.has(m.role) && m.role === 'tool') {
              const td = getToolExecutionDetails(m);
              if (td && td.isFailed) {
                errorItems.push({ msgIdx: idx, label: td.specificName || m.toolName || 'Tool' });
              }
            }
          });

          const jumpToError = (errPos) => {
            if (errorItems.length === 0) return;
            const normalized = ((errPos % errorItems.length) + errorItems.length) % errorItems.length;
            setActiveErrorIdx(normalized);
            const targetMsgIdx = errorItems[normalized].msgIdx;
            setHighlightMsgIdx(targetMsgIdx);
            const el = itemRefs.current[targetMsgIdx];
            if (el && typeof el.scrollIntoView === 'function') {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          };

          return h('div', { className: 'ed-msg-timeline' },
            errorItems.length > 0 && h('div', { className: 'ed-error-jump-bar' },
              h('div', { className: 'ed-error-jump-info' },
                h(Glyph, { kind: 'alertTriangle', size: 13 }),
                h('span', null, `发现 ${errorItems.length} 处错误 (${activeErrorIdx + 1}/${errorItems.length})`)
              ),
              h('div', { className: 'ed-error-jump-chips' },
                errorItems.map((item, eIdx) => h('button', {
                  key: item.msgIdx,
                  type: 'button',
                  className: `ed-error-jump-chip ${eIdx === activeErrorIdx ? 'active' : ''}`,
                  title: `跳转到第 ${item.msgIdx + 1} 条: ${item.label}`,
                  onClick: () => jumpToError(eIdx)
                }, `#${eIdx + 1} ${item.label}`))
              ),
              h('div', { className: 'ed-error-jump-nav' },
                h('button', {
                  type: 'button',
                  className: 'ed-error-jump-btn',
                  onClick: () => jumpToError(activeErrorIdx - 1)
                }, '↑ 上一个'),
                h('button', {
                  type: 'button',
                  className: 'ed-error-jump-btn',
                  onClick: () => jumpToError(activeErrorIdx + 1)
                }, '↓ 下一个')
              )
            ),
            safeMessages.map((m, idx) => {
              if (!conversationRoles.has(m.role)) return renderReasoningMessage(m, `${scopeId}:${idx}`);
              const toolDetails = m.role === 'tool' ? getToolExecutionDetails(m) : null;
              const isToolFail = toolDetails ? toolDetails.isFailed : false;
              const roleClass = m.role === 'user' ? 'ed-bubble-user' : (m.role === 'assistant' ? 'ed-bubble-assistant' : 'ed-bubble-tool');
              const isHighlighted = highlightMsgIdx === idx;
              return h('div', {
                key: idx,
                ref: (el) => {
                  if (el) itemRefs.current[idx] = el;
                  else delete itemRefs.current[idx];
                },
                className: `ed-bubble ${roleClass}${isHighlighted ? ' ed-bubble-jump-highlight' : ''}`,
                style: isToolFail ? {
                  border: '1.5px solid #ef4444',
                  background: 'rgba(239, 68, 68, 0.03)'
                } : {}
              },
                h('div', { className: 'ed-bubble-head' },
                  h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px' } },
                    h('span', { className: 'ed-ico-text' }, m.role === 'user'
                      ? [h(Glyph, { key: 'i', kind: 'user', size: 13 }), '客户 / 访客提问']
                      : (m.role === 'assistant'
                        ? [h(Glyph, { key: 'i', kind: 'bot', size: 13 }), '客服助理回复']
                        : [h(Glyph, { key: 'i', kind: 'tool', size: 13 }), `工具: ${toolDetails.specificName}`])),
                    isToolFail && h('span', {
                      className: 'ed-ico-text',
                      style: {
                        fontSize: '10.5px',
                        fontWeight: '600',
                        color: '#dc2626',
                        background: 'rgba(239, 68, 68, 0.12)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        gap: '3px'
                      }
                    }, h(Glyph, { kind: 'close', size: 11 }), '执行失败')
                  ),
                  h('span', { style: { fontWeight: 'normal', color: 'var(--ed-text2)' } }, (m.createdAt || '').slice(11, 19))
                ),
                h('div', { className: 'ed-bubble-body' },
                  m.role === 'tool' ? [
                    isToolFail && toolDetails.errorDetail && h('div', {
                      key: 'err_banner',
                      style: {
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '4px',
                        padding: '5px 8px',
                        marginBottom: '6px',
                        fontSize: '11.5px',
                        color: '#b91c1c'
                      }
                    }, h('strong', { className: 'ed-ico-text', style: { marginRight: '4px' } }, h(Glyph, { kind: 'alertTriangle', size: 12 }), '报错原因:'), toolDetails.errorDetail),
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
          );
        }

        function extractRawToolNames(tm, details) {
          const rawSet = new Set();
          const baseName = details?.baseName || tm.toolName || '';
          const display = details?.specificName || tm.toolName || 'Tool';
          const candidates = [
            tm.rawToolName,
            tm.originalToolName,
            tm.toolCode,
            tm.functionName
          ];
          if (baseName && !display.startsWith(`${baseName} (`)) {
            candidates.push(baseName);
          }
          try {
            const text = tm.content || tm.toolResult || '';
            const res = typeof text === 'string' && text.trim().startsWith('{') ? JSON.parse(text) : (typeof text === 'object' ? text : null);
            if (res) {
              candidates.push(res?.source?.tool, res?.source?.toolName, res?.tool, res?.toolName);
            }
          } catch (e) {}
          try {
            const args = typeof tm.toolArgs === 'string' && tm.toolArgs.trim().startsWith('{') ? JSON.parse(tm.toolArgs) : (typeof tm.toolArgs === 'object' ? tm.toolArgs : null);
            if (args) {
              candidates.push(args?.tool, args?.toolName, args?.method);
            }
          } catch (e) {}
          for (const c of candidates) {
            if (typeof c === 'string' && c.trim() && c.trim() !== display) {
              rawSet.add(c.trim());
            }
          }
          return Array.from(rawSet);
        }

        function getToolDisplayLabel(tm, details) {
          const baseName = details?.baseName || tm.toolName || 'Tool';
          const specificName = details?.specificName || baseName;
          if (specificName.startsWith(`${baseName} (`)) {
            return specificName;
          }
          if (specificName !== baseName) {
            return `${baseName} (${specificName})`;
          }
          const rawNames = extractRawToolNames(tm, details);
          if (rawNames.length > 0) {
            return `${specificName} (${rawNames.join(', ')})`;
          }
          return specificName;
        }

        function getMaxTurnModelInteractions(messages) {
          return computeConversationMetrics(messages).maxTurnModelInteractions;
        }

        function getBadcaseCardMetrics(b) {
          const msgs = Array.isArray(b?.messages) ? b.messages : [];
          if (msgs.length > 0) {
            const metrics = computeConversationMetrics(msgs);
            return {
              turnsCount: metrics.turnsCount,
              totalSteps: metrics.totalSteps,
              maxTurnSteps: metrics.maxTurnSteps,
              maxTurnModel: metrics.maxTurnModelInteractions,
              totalModel: metrics.modelInteractions,
              toolCallsCount: metrics.toolCallsCount
            };
          }
          return {
            turnsCount: b?.turnsCount || 1,
            totalSteps: b?.totalStepCount ?? b?.stepCount ?? 0,
            maxTurnSteps: b?.maxTurnSteps ?? b?.stepCount ?? 0,
            maxTurnModel: b?.modelInteractionsCount ?? 0,
            totalModel: b?.totalModelInteractionsCount ?? b?.modelInteractionsCount ?? 0,
            toolCallsCount: b?.toolCallsCount || 0
          };
        }

        function summarizeToolMessages(msgs) {
          const map = new Map();
          const modelKeys = new Set();
          let totalCalls = 0;
          let totalFailed = 0;
          let execSteps = 0;
          for (let i = 0; i < msgs.length; i++) {
            const m = msgs[i];
            if (!m || isFollowupMessage(m)) continue;
            if (isStepMessage(m)) execSteps += 1;
            if (!isToolCallMessage(m)) {
              if (isModelInteractionMessage(m)) modelKeys.add(getModelInteractionKey(m, i));
              continue;
            }
            const details = getToolExecutionDetails(m);
            const name = getToolDisplayLabel(m, details);
            totalCalls += 1;
            if (details.isFailed) totalFailed += 1;
            const entry = map.get(name) || { name, count: 0, failCount: 0, successCount: 0 };
            entry.count += 1;
            if (details.isFailed) entry.failCount += 1;
            else entry.successCount += 1;
            map.set(name, entry);
          }
          const items = Array.from(map.values())
            .sort((a, b) => b.count - a.count || b.failCount - a.failCount || a.name.localeCompare(b.name));
          return { items, totalCalls, totalFailed, totalSuccess: totalCalls - totalFailed, modelInteractions: modelKeys.size, execSteps };
        }

        function ToolCallStatsPanel({ messages }) {
          const { turns, allStats } = React.useMemo(() => {
            const msgs = (Array.isArray(messages) ? messages : []).filter(m => !isFollowupMessage(m));
            const rawTurns = [];
            let current = null;
            for (const m of msgs) {
              if (m.role === 'user' || !current) {
                current = {
                  turnIndex: rawTurns.length + 1,
                  userPrompt: m.role === 'user' ? (m.content || '').replace(/<[^>]+>/g, '').trim() : '',
                  createdAt: m.createdAt || '',
                  msgs: []
                };
                rawTurns.push(current);
              }
              current.msgs.push(m);
            }
            const computedTurns = rawTurns.map(t => ({
              ...t,
              ...summarizeToolMessages(t.msgs)
            }));
            return {
              turns: computedTurns,
              allStats: summarizeToolMessages(msgs)
            };
          }, [messages]);

          const [viewScope, setViewScope] = React.useState('by_turn');
          const [expandedTurns, setExpandedTurns] = React.useState(() => (
            turns.length === 1 ? new Set([turns[0].turnIndex]) : new Set()
          ));
          React.useEffect(() => {
            setViewScope('by_turn');
            setExpandedTurns(turns.length === 1 ? new Set([turns[0].turnIndex]) : new Set());
          }, [turns]);

          const toggleTurn = (turnIdx) => {
            setExpandedTurns(prev => {
              const next = new Set(prev);
              if (next.has(turnIdx)) next.delete(turnIdx);
              else next.add(turnIdx);
              return next;
            });
          };

          if (turns.length === 0 || (allStats.totalCalls === 0 && allStats.modelInteractions === 0)) {
            return h('div', { className: 'ed-empty-state' }, '该对话过程中未检测到工具或模型交互记录');
          }

          const renderStatsBlock = (stat) => h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
            h('div', {
              style: {
                display: 'grid',
                gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                gap: '8px'
              }
            },
              [
                {
                  label: '与模型交互',
                  value: `${stat.modelInteractions} 次`,
                  color: stat.modelInteractions >= 100 ? '#dc2626' : '#7c3aed',
                  bg: stat.modelInteractions >= 100 ? 'rgba(239, 68, 68, 0.05)' : 'rgba(124, 58, 237, 0.04)',
                  border: stat.modelInteractions >= 100 ? 'rgba(239, 68, 68, 0.22)' : 'rgba(124, 58, 237, 0.16)'
                },
                { label: '总调用次数', value: `${stat.totalCalls} 次`, color: 'var(--ed-text1)', bg: 'var(--ed-bg-layer1)', border: 'var(--ed-border1)' },
                { label: '涉及工具数', value: `${stat.items.length} 个`, color: '#2563eb', bg: 'rgba(37, 99, 235, 0.03)', border: 'rgba(37, 99, 235, 0.14)' },
                { label: '执行成功', value: `${stat.totalSuccess} 次`, color: '#059669', bg: 'rgba(16, 185, 129, 0.04)', border: 'rgba(16, 185, 129, 0.16)' },
                {
                  label: '异常/失败',
                  value: `${stat.totalFailed} 次`,
                  color: stat.totalFailed > 0 ? '#dc2626' : 'var(--ed-text2)',
                  bg: stat.totalFailed > 0 ? 'rgba(239, 68, 68, 0.04)' : 'var(--ed-bg-layer1)',
                  border: stat.totalFailed > 0 ? 'rgba(239, 68, 68, 0.18)' : 'var(--ed-border1)'
                }
              ].map((card, idx) => h('div', {
                key: idx,
                style: {
                  background: card.bg,
                  border: `1px solid ${card.border}`,
                  borderRadius: '8px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: '6px'
                }
              },
                h('span', { style: { fontSize: '11.5px', color: 'var(--ed-text2)' } }, card.label),
                h('span', { style: { fontSize: '15px', fontWeight: 600, color: card.color, fontVariantNumeric: 'tabular-nums' } }, card.value)
              ))
            ),
            stat.items.length === 0 ? h('div', {
              style: {
                padding: '12px',
                fontSize: '12px',
                color: 'var(--ed-text2)',
                background: 'var(--ed-bg-layer1)',
                border: '1px solid var(--ed-border1)',
                borderRadius: '8px',
                textAlign: 'center'
              }
            }, '本轮未调用工具') : h('div', {
              style: {
                background: 'var(--ed-bg-layer1)',
                border: '1px solid var(--ed-border1)',
                borderRadius: '8px',
                overflow: 'hidden'
              }
            },
              h('div', {
                style: {
                  display: 'grid',
                  gridTemplateColumns: '36px minmax(160px, 1fr) 72px 130px 92px',
                  gap: '8px',
                  alignItems: 'center',
                  padding: '7px 12px',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: 'var(--ed-text2)',
                  background: 'var(--ed-bg-layer2)',
                  borderBottom: '1px solid var(--ed-border1)'
                }
              },
                h('span', { style: { textAlign: 'center' } }, '#'),
                h('span', null, '工具名称'),
                h('span', { style: { textAlign: 'right' } }, '调用次数'),
                h('span', { style: { paddingLeft: '4px' } }, '调用占比'),
                h('span', { style: { textAlign: 'right' } }, '成功 / 失败')
              ),
              stat.items.map((item, idx) => {
                const pct = Math.round((item.count / stat.totalCalls) * 100);
                const isTop3 = idx < 3;
                return h('div', {
                  key: item.name,
                  style: {
                    display: 'grid',
                    gridTemplateColumns: '36px minmax(160px, 1fr) 72px 130px 92px',
                    gap: '8px',
                    alignItems: 'center',
                    padding: '7px 12px',
                    fontSize: '12px',
                    background: item.failCount > 0 ? 'rgba(239, 68, 68, 0.02)' : (idx % 2 === 1 ? 'rgba(0, 0, 0, 0.012)' : 'transparent'),
                    borderBottom: idx < stat.items.length - 1 ? '1px solid var(--ed-border1)' : 'none'
                  }
                },
                  h('div', { style: { display: 'flex', justifyContent: 'center' } },
                    h('span', {
                      style: {
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '20px',
                        height: '18px',
                        padding: '0 5px',
                        borderRadius: '4px',
                        fontFamily: 'ui-monospace, monospace',
                        fontSize: '11px',
                        fontWeight: isTop3 ? 600 : 400,
                        background: isTop3 ? 'rgba(59, 130, 246, 0.08)' : 'var(--ed-bg-layer2)',
                        color: isTop3 ? '#2563eb' : 'var(--ed-text2)'
                      }
                    }, `${idx + 1}`)
                  ),
                  h('span', {
                    title: item.name,
                    style: {
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: item.failCount > 0 ? '#dc2626' : 'var(--ed-text1)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }
                  }, item.name),
                  h('div', { style: { textAlign: 'right' } },
                    h('span', {
                      style: {
                        fontWeight: 500,
                        fontVariantNumeric: 'tabular-nums',
                        color: 'var(--ed-text1)'
                      }
                    }, `${item.count} 次`)
                  ),
                  h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '4px' } },
                    h('div', {
                      style: {
                        flex: 1,
                        height: '5px',
                        borderRadius: '999px',
                        background: 'var(--ed-bg-layer2)',
                        overflow: 'hidden'
                      }
                    },
                      h('div', {
                        style: {
                          width: `${Math.max(pct, 4)}%`,
                          height: '100%',
                          borderRadius: '999px',
                          background: item.failCount > 0 ? '#ef4444' : '#3b82f6'
                        }
                      })
                    ),
                    h('span', {
                      style: {
                        fontSize: '11px',
                        fontVariantNumeric: 'tabular-nums',
                        color: 'var(--ed-text2)',
                        width: '32px',
                        textAlign: 'right'
                      }
                    }, `${pct}%`)
                  ),
                  h('div', { style: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px', fontSize: '11px', fontVariantNumeric: 'tabular-nums' } },
                    h('span', {
                      style: {
                        padding: '1px 6px',
                        borderRadius: '999px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#059669',
                        fontWeight: 500
                      }
                    }, `${item.successCount}`),
                    h('span', {
                      style: {
                        padding: '1px 6px',
                        borderRadius: '999px',
                        background: item.failCount > 0 ? 'rgba(239, 68, 68, 0.12)' : 'var(--ed-bg-layer2)',
                        color: item.failCount > 0 ? '#dc2626' : 'var(--ed-text2)',
                        fontWeight: item.failCount > 0 ? 600 : 400
                      }
                    }, `${item.failCount}`)
                  )
                );
              })
            )
          );

          const allExpanded = turns.length > 0 && expandedTurns.size === turns.length;

          return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
            h('div', {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                flexWrap: 'wrap'
              }
            },
              h('div', { className: 'ed-seg-control', role: 'tablist', 'aria-label': '工具调用统计视图切换' },
                h('button', {
                  type: 'button',
                  role: 'tab',
                  'aria-selected': viewScope === 'by_turn',
                  className: `ed-seg-btn ${viewScope === 'by_turn' ? 'active' : ''}`,
                  onClick: () => setViewScope('by_turn')
                },
                  h(Glyph, { kind: 'layers', size: 13 }),
                  h('span', null, '按轮次统计'),
                  h('span', { className: 'ed-seg-count' }, `${turns.length} 轮`)
                ),
                h('button', {
                  type: 'button',
                  role: 'tab',
                  'aria-selected': viewScope === 'all',
                  className: `ed-seg-btn ${viewScope === 'all' ? 'active' : ''}`,
                  onClick: () => setViewScope('all')
                },
                  h(Glyph, { kind: 'barChart', size: 13 }),
                  h('span', null, '全会话汇总'),
                  h('span', { className: 'ed-seg-count' }, `${allStats.totalCalls} 工具 · ${allStats.modelInteractions} 交互`)
                )
              ),
              viewScope === 'by_turn' && h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
                h('span', { style: { fontSize: '11px', color: 'var(--ed-text2)' } }, '点击轮次展开工具调用明细'),
                h('button', {
                  type: 'button',
                  className: 'ed-copy-btn',
                  onClick: () => setExpandedTurns(allExpanded ? new Set() : new Set(turns.map(t => t.turnIndex)))
                }, allExpanded ? '全部折叠' : '全部展开')
              )
            ),
            viewScope === 'all'
              ? renderStatsBlock(allStats)
              : h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
                turns.map(t => {
                  const isOpen = expandedTurns.has(t.turnIndex);
                  const hasAlert = t.modelInteractions >= 100 || t.totalFailed > 0;
                  return h('div', {
                    key: t.turnIndex,
                    style: {
                      borderRadius: '8px',
                      border: `1px solid ${hasAlert ? 'rgba(239, 68, 68, 0.25)' : 'var(--ed-border1)'}`,
                      background: 'var(--ed-bg-layer1)',
                      overflow: 'hidden'
                    }
                  },
                    h('div', {
                      role: 'button',
                      tabIndex: 0,
                      onClick: () => toggleTurn(t.turnIndex),
                      onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTurn(t.turnIndex); } },
                      style: {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        padding: '9px 12px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        background: isOpen ? 'var(--ed-bg-layer2)' : (hasAlert ? 'rgba(239, 68, 68, 0.02)' : 'var(--ed-bg-layer1)')
                      }
                    },
                      h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 } },
                        h('span', {
                          style: {
                            fontSize: '11px',
                            color: 'var(--ed-text2)',
                            width: '12px',
                            textAlign: 'center',
                            flexShrink: 0,
                            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.12s ease'
                          }
                        }, '▸'),
                        h('span', {
                          style: {
                            fontSize: '11.5px',
                            fontWeight: 500,
                            color: 'var(--ed-text1)',
                            background: 'var(--ed-bg-layer2)',
                            border: '1px solid var(--ed-border1)',
                            borderRadius: '5px',
                            padding: '1px 7px',
                            flexShrink: 0
                          }
                        }, `第 ${t.turnIndex} 轮`),
                        t.userPrompt && h('span', {
                          title: t.userPrompt,
                          style: {
                            fontSize: '12px',
                            color: 'var(--ed-text1)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }
                        }, t.userPrompt)
                      ),
                      h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 } },
                        t.modelInteractions >= 100 && h('span', {
                          style: {
                            fontSize: '10.5px',
                            fontWeight: 500,
                            color: '#dc2626',
                            background: 'rgba(220, 38, 38, 0.08)',
                            border: '1px solid rgba(220, 38, 38, 0.25)',
                            borderRadius: '4px',
                            padding: '1px 6px'
                          }
                        }, BADCASE_LABEL_MODEL_LIMIT),
                        t.execSteps > 100 && h('span', {
                          style: {
                            fontSize: '10.5px',
                            fontWeight: 500,
                            color: '#d97706',
                            background: 'rgba(217, 119, 6, 0.08)',
                            border: '1px solid rgba(217, 119, 6, 0.25)',
                            borderRadius: '4px',
                            padding: '1px 6px'
                          }
                        }, `单轮${t.execSteps}步·需关注`),
                        h('span', {
                          style: {
                            fontSize: '11px',
                            padding: '1px 7px',
                            borderRadius: '999px',
                            background: t.modelInteractions >= 100 ? 'rgba(220, 38, 38, 0.08)' : 'rgba(124, 58, 237, 0.08)',
                            color: t.modelInteractions >= 100 ? '#dc2626' : '#7c3aed',
                            fontVariantNumeric: 'tabular-nums'
                          }
                        }, `模型 ${t.modelInteractions} 次`),
                        h('span', {
                          style: {
                            fontSize: '11px',
                            padding: '1px 7px',
                            borderRadius: '999px',
                            background: t.totalCalls > 0 ? 'rgba(37, 99, 235, 0.08)' : 'var(--ed-bg-layer2)',
                            color: t.totalCalls > 0 ? '#2563eb' : 'var(--ed-text2)',
                            fontVariantNumeric: 'tabular-nums'
                          }
                        }, `工具 ${t.totalCalls} 次`),
                        t.totalFailed > 0 && h('span', {
                          style: {
                            fontSize: '11px',
                            padding: '1px 7px',
                            borderRadius: '999px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#dc2626',
                            fontWeight: 500,
                            fontVariantNumeric: 'tabular-nums'
                          }
                        }, `失败 ${t.totalFailed} 次`),
                        t.createdAt && h('span', {
                          style: { fontSize: '11px', color: 'var(--ed-text2)', fontVariantNumeric: 'tabular-nums', marginLeft: '2px' }
                        }, t.createdAt.slice(11, 19))
                      )
                    ),
                    isOpen && h('div', {
                      style: {
                        padding: '10px 12px',
                        borderTop: '1px solid var(--ed-border1)',
                        background: 'var(--ed-bg-layer2)'
                      }
                    }, renderStatsBlock(t))
                  );
                })
              )
          );
        }

        function detectBadcaseItem(c) {
          const messages = c.messages || [];
          const visibleMsgCount = messages.filter(m => !isFollowupMessage(m)).length;
          const userMsgs = messages.filter(m => m.role === 'user');
          const assistantMsgs = messages.filter(m => m.role === 'assistant');
          const toolMsgs = messages.filter(m => isToolCallMessage(m));

          if (userMsgs.length === 0 && !c.title) return null;
          const title = (c.title || '').replace(/<[^>]+>/g, '').trim();

          const failedToolMsgs = [];
          for (const tm of toolMsgs) {
            const details = getToolExecutionDetails(tm);
            if (details.isFailed) {
              failedToolMsgs.push({
                ...tm,
                specificToolName: details.specificName,
                baseToolName: details.baseName,
                toolErrorDetail: details.errorDetail
              });
            }
          }

          // 按单轮对话计算最大步数与单轮最大模型交互次数（已排除 followup，并按 base messageId 去重）
          const {
            totalSteps,
            maxTurnSteps,
            maxTurnToolCalls,
            maxTurnIndex,
            maxTurnModelInteractions,
            maxModelTurnIndex,
            modelInteractions
          } = computeConversationMetrics(messages);

          // 模型交互达到 100 次上限基本意味着被迫中断；单轮步骤数超过 100 标记为需优化关注
          const isStepExceeded = maxTurnModelInteractions >= 100;
          const isHighTurnSteps = maxTurnSteps > 100;
          const isFrequentToolFail = failedToolMsgs.length >= 2;

          let isTaskInterrupted = false;
          let interruptEvidence = '';
          for (const um of userMsgs) {
            const text = (um.content || '').replace(/<[^>]+>/g, '').trim();
            if (/(写一半退出|任务中断|中途退出|异常退出|写一半不写了|中断后继续|为什么退出了|中断退出|生成中断)/.test(text)) {
              isTaskInterrupted = true;
              interruptEvidence = text;
              break;
            }
          }
          if (!isTaskInterrupted && /(写一半退出|任务中断|中途退出)/.test(title)) {
            isTaskInterrupted = true;
            interruptEvidence = title;
          }

          let isRequirementUnmet = false;
          let unmetEvidence = '';
          for (const um of userMsgs) {
            const text = (um.content || '').replace(/<[^>]+>/g, '').trim();
            if (/(不满足需求|不是我要的|不是这个意思|答非所问|牛头不对马嘴|没达到要求|不对劲|根本没解决|还是不行|没有按要求|未按指令|漏掉了|完全错误|这写的什么|这算的什么|根本不对)/.test(text)) {
              const match = text.match(/(不满足需求|不是我要的|不是这个意思|答非所问|牛头不对马嘴|没达到要求|不对劲|根本没解决|还是不行|没有按要求|未按指令|漏掉了|完全错误|这写的什么|这算的什么|根本不对)/)[0];
              isRequirementUnmet = true;
              unmetEvidence = `命中负向反馈: "${match}" - 原文: ${text}`;
              break;
            }
          }

          let isUserComplaint = false;
          let complaintEvidence = '';
          for (const um of userMsgs) {
            const text = (um.content || '').replace(/<[^>]+>/g, '').trim();
            if (/(不要重复问诊|上文问过|上文已经问过|已问过|别再问|不要再问|前面说过了|胡说|转人工|叫人工|人工客服|别瞎说|听不懂)/.test(text)) {
              const match = text.match(/(不要重复问诊|上文问过|上文已经问过|已问过|别再问|不要再问|前面说过了|胡说|转人工|叫人工|人工客服|别瞎说|听不懂)/)[0];
              isUserComplaint = true;
              complaintEvidence = `命中负向抗议: "${match}" - 原文: ${text}`;
              break;
            }
          }

          let isConfigMismatch = false;
          let mismatchEvidence = '';
          for (const um of userMsgs) {
            const text = (um.content || '').replace(/<[^>]+>/g, '').trim();
            if (/(为什么.*不生效|为什么.*没生效|加进去不生效|为什么没有分配|分错|没分给|未按规则|为什么还会报联|明明设置了|为什么会有两个人值班|排班.*有错|为什么仍收到|哪里设置不对|怎么没生效|不按规则)/.test(text)) {
              isConfigMismatch = true;
              mismatchEvidence = text;
              break;
            }
          }

          let isResponseAnomaly = false;
          let anomalyEvidence = '';
          for (const am of assistantMsgs) {
            const text = am.content || '';
            if (/(服务开小差|遇到问题|网络开小差|稍后重试|发生未知错误|抱歉.*请重试|无法完成你的请求)/.test(text)) {
              isResponseAnomaly = true;
              anomalyEvidence = text;
              break;
            }
          }

          const isSingleToolError = failedToolMsgs.length === 1;

          const defectTags = [];
          if (isStepExceeded) defectTags.push(BADCASE_LABEL_MODEL_LIMIT);
          if (isHighTurnSteps) defectTags.push(BADCASE_LABEL_HIGH_STEPS);
          if (isFrequentToolFail) defectTags.push(`工具高频失败(${failedToolMsgs.length}次)`);
          else if (isSingleToolError) defectTags.push('工具调用异常');
          if (isTaskInterrupted) defectTags.push('任务中断');
          if (isRequirementUnmet) defectTags.push('输出不满足需求');
          if (isUserComplaint) defectTags.push('机械重复/负反馈');
          if (isConfigMismatch) defectTags.push('规则/配置未生效');
          if (isResponseAnomaly) defectTags.push('服务/回复异常');

          if (defectTags.length === 0) {
            if (/(为什么.*不生效|不要重复问诊|上文问过|未分配|分错|哪里设置不对|任务中断|写一半退出)/.test(title)) {
              let t = 'config_mismatch';
              let tn = '规则/配置未生效';
              if (/(不要重复|上文问过)/.test(title)) { t = 'user_complaint'; tn = '机械重复/负反馈'; }
              else if (/(任务中断|写一半退出)/.test(title)) { t = 'task_interrupted'; tn = '任务中断/异常截断'; }
              const clientRunIds = [...new Set(messages.map(m => m.runId).filter(Boolean))];
              return {
                id: `bad_${c.sessionId?.slice(-24) || c.id}`,
                sessionId: c.sessionId,
                runId: clientRunIds[0] || c.runId || '',
                runIds: clientRunIds.length > 0 ? clientRunIds : (c.runIds || []),
                title: c.title,
                badcaseType: t,
                badcaseTypeName: tn,
                severity: t === 'task_interrupted' ? '严重' : '高',
                defectTags: [tn],
                phenomenon: `会话明确指向异常诉求: "${title}"`,
                suspectedCause: '业务规则未触发、流程中断或配置覆盖冲突',
                recommendation: '检查工作流逻辑与提示词负向约束，纳入重点回归集',
                evidence: title,
                stepCount: totalSteps,
                totalStepCount: totalSteps,
                maxTurnSteps,
                modelInteractionsCount: maxTurnModelInteractions,
                totalModelInteractionsCount: modelInteractions,
                userPrompt: c.userPrompt,
                referenceAnswer: c.referenceAnswer,
                turnsCount: c.turnsCount || 1,
                toolCallsCount: c.toolCallsCount || 0,
                toolFailuresCount: 0,
                toolNames: c.toolNames || [],
                modelId: c.modelId,
                createdAt: c.createdAt,
                messages: messages
              };
            }
            return null;
          }

          let badcaseType = 'tool_error';
          let badcaseTypeName = '工具调用异常';
          let severity = '严重';
          let phenomenon = '';
          let suspectedCause = '';
          let recommendation = '';
          let evidence = '';

          if (isStepExceeded) {
            badcaseType = 'step_limit_exceeded';
            badcaseTypeName = BADCASE_LABEL_MODEL_LIMIT;
            severity = '严重';
            phenomenon = `第 ${maxModelTurnIndex} 轮与模型交互达到 ${maxTurnModelInteractions} 次（该轮 ${maxTurnSteps} 步，全会话模型交互 ${modelInteractions} 次），已触及 100 次上限，存在被迫中断风险`;
            suspectedCause = '单轮任务在框架 100 次模型交互上限内未能收敛完成（常见于工具反复重试死循环、Skill 编排过细或循环检索未收敛），最终被迫中断或强制收尾';
            recommendation = '排查对应 Skill 编排与循环终止条件，合并冗余步骤并增加工具失败快速回退/熔断策略';
            evidence = `单轮最高模型交互: ${maxTurnModelInteractions} 次 (第 ${maxModelTurnIndex} 轮) | 单轮最大步数: ${maxTurnSteps} 步 (第 ${maxTurnIndex} 轮，工具调用 ${maxTurnToolCalls} 次) | 会话总消息: ${visibleMsgCount} 条`;
          } else if (isFrequentToolFail) {
            const failedTools = [...new Set(failedToolMsgs.map(t => t.specificToolName || t.toolName || 'Tool'))];
            const failureSummary = failedToolMsgs.map(t => `${t.specificToolName || t.toolName}: ${t.toolErrorDetail || '执行异常'}`).slice(0, 3).join('；');
            const firstFailText = failedToolMsgs[0].content || failedToolMsgs[0].toolResult || '';
            badcaseType = 'frequent_tool_failures';
            badcaseTypeName = '工具调用高频失败';
            severity = '严重';
            phenomenon = `单会话内工具调用累计失败 ${failedToolMsgs.length} 次（具体失败工具: ${failedTools.join('、')}），工具链受阻`;
            suspectedCause = `依赖服务异常或入参不匹配。报错概括：${failureSummary}`;
            recommendation = '引入工具调用断路器 (Circuit Breaker) 与连续失败回退机制；补齐工具入参的静态 Schema 校验与 Few-shot 样例';
            evidence = (failedToolMsgs[0].toolErrorDetail ? `【失败工具: ${failedToolMsgs[0].specificToolName}】\n报错详情: ${failedToolMsgs[0].toolErrorDetail}\n\n原始返回:\n` : '') + firstFailText.slice(0, 300);
          } else if (isTaskInterrupted) {
            badcaseType = 'task_interrupted';
            badcaseTypeName = '任务中断/异常截断';
            severity = '严重';
            phenomenon = '任务执行中途退出或长文本生成被异常截断，未能完整交付预期结果';
            suspectedCause = '网关 SSE 长连接中断、执行进程被沙箱超时杀死、Token 预算耗尽 (Length Finish) 或上游服务主动终止';
            recommendation = '为长时生成与多步骤任务增加 Checkpoint 进度持久化与断点续跑机制；增大 max_tokens 预算与网络保活心跳';
            evidence = interruptEvidence.slice(0, 300);
          } else if (isRequirementUnmet) {
            badcaseType = 'requirement_unmet';
            badcaseTypeName = '输出不满足需求';
            severity = '高';
            phenomenon = `用户明确反馈模型生成结果或方案不满足业务需求（${unmetEvidence.slice(0, 80)}）`;
            suspectedCause = '大模型意图理解与指令对齐偏差 (Instruction Following Deficit)，未精准识别核心约束条件，或缺乏前置意图澄清确认';
            recommendation = '在系统提示词增加强约束要求（如输出前进行条件复核清单）；在模糊需求场景下触发主动反问（Ask User Clarification）';
            evidence = unmetEvidence.slice(0, 300);
          } else if (isUserComplaint) {
            badcaseType = 'user_complaint';
            badcaseTypeName = '机械重复/负反馈';
            severity = '高';
            phenomenon = `用户产生负向抱怨或抗议机械重复问诊（${complaintEvidence.slice(0, 80)}）`;
            suspectedCause = '多轮状态记忆缺失或提示词未配置负向约束，导致重复追问已提过的问题';
            recommendation = '在系统提示词增加负向约束「严禁重复追问访客上文已提及或已问过的信息」，并优化槽位记忆';
            evidence = complaintEvidence.slice(0, 300);
          } else if (isConfigMismatch) {
            badcaseType = 'config_mismatch';
            badcaseTypeName = '规则/配置未生效';
            severity = '高';
            phenomenon = '用户反馈配置的规则、分配机制或排班未按预期生效';
            suspectedCause = 'START 触发条件不匹配、优先级覆盖冲突或缺少兜底机制';
            recommendation = '检查规则触发词泛化边界与路由优先级，排查客服接待在线状态与排班判定';
            evidence = mismatchEvidence.slice(0, 300);
          } else if (isResponseAnomaly) {
            badcaseType = 'response_anomaly';
            badcaseTypeName = '服务/回复异常';
            severity = '严重';
            phenomenon = '大模型或客服引擎返回系统故障与异常中断提示';
            suspectedCause = '网关超时、上游模型服务抖动或上下文超出最大 Token 限制';
            recommendation = '缩减上下文轮数，增加模型输出流式断线重连与优雅兜底提示';
            evidence = anomalyEvidence.slice(0, 300);
          } else if (failedToolMsgs.length > 0) {
            const tm = failedToolMsgs[0];
            const text = tm.content || tm.toolResult || '';
            const specificName = tm.specificToolName || tm.toolName || 'Tool';
            badcaseType = 'tool_error';
            badcaseTypeName = '工具调用异常';
            severity = '严重';
            phenomenon = `具体工具 [${specificName}] 调用执行失败${tm.toolErrorDetail ? `（${tm.toolErrorDetail}）` : ''}`;
            suspectedCause = `工具接口入参格式不合规、接口超时或目标后台服务报错。报错信息: ${tm.toolErrorDetail || '执行异常'}`;
            recommendation = '在系统提示词增加参数格式示例校验，增加工具超时重试机制与降级策略';
            evidence = (tm.toolErrorDetail ? `【失败工具: ${specificName}】\n报错详情: ${tm.toolErrorDetail}\n\n原始返回:\n` : '') + text.slice(0, 300);
          } else {
            badcaseType = 'high_turn_steps';
            badcaseTypeName = BADCASE_LABEL_HIGH_STEPS;
            severity = '关注';
            phenomenon = `第 ${maxTurnIndex} 轮单轮步骤数达到 ${maxTurnSteps} 步（模型交互 ${maxTurnModelInteractions} 次，工具调用 ${maxTurnToolCalls} 次），超过 100 步阈值，建议排查 Skill 编排或工具失败重试`;
            suspectedCause = 'Skill 提示词/流程拆解过细或工具调用失败引发反复试错，导致单轮推理与工具步骤数剧增';
            recommendation = '优化 Skill 任务编排（合并批量操作、减少串行试探），并修复高频失败工具以降低无效重试步数';
            evidence = `单轮最大步数: ${maxTurnSteps} 步 (第 ${maxTurnIndex} 轮，工具调用 ${maxTurnToolCalls} 次) | 与模型交互: ${modelInteractions} 次 | 会话总消息: ${visibleMsgCount} 条`;
          }

          const failedToolsList = [...new Set(failedToolMsgs.map(t => t.specificToolName || t.toolName || 'Tool'))];
          const clientRunIds = [...new Set(messages.map(m => m.runId).filter(Boolean))];

          return {
            id: `bad_${c.sessionId?.slice(-24) || c.id}`,
            sessionId: c.sessionId,
            runId: clientRunIds[0] || c.runId || '',
            runIds: clientRunIds.length > 0 ? clientRunIds : (c.runIds || []),
            title: c.title,
            badcaseType,
            badcaseTypeName,
            severity,
            defectTags,
            phenomenon,
            suspectedCause,
            recommendation,
            evidence,
            stepCount: totalSteps,
            totalStepCount: totalSteps,
            maxTurnSteps,
            modelInteractionsCount: maxTurnModelInteractions,
            totalModelInteractionsCount: modelInteractions,
            userPrompt: c.userPrompt,
            referenceAnswer: c.referenceAnswer,
            turnsCount: c.turnsCount || 1,
            toolCallsCount: c.toolCallsCount || 0,
            toolFailuresCount: failedToolMsgs.length,
            failedToolNames: failedToolsList,
            failedToolDetails: failedToolMsgs.map(t => ({
              toolName: t.specificToolName || t.toolName,
              errorDetail: t.toolErrorDetail,
              args: t.toolArgs
            })),
            toolNames: [...new Set(toolMsgs.map(t => getToolExecutionDetails(t).specificName).filter(Boolean))],
            modelId: c.modelId,
            createdAt: c.createdAt,
            messages: messages
          };
        }

        function shouldPromoteBadcaseRep(candidate, current) {
          const cHighSteps = (candidate.maxTurnSteps || 0) > 100 ? 1 : 0;
          const rHighSteps = (current.maxTurnSteps || 0) > 100 ? 1 : 0;
          if (cHighSteps !== rHighSteps) return cHighSteps > rHighSteps;
          if ((candidate.modelInteractionsCount || 0) !== (current.modelInteractionsCount || 0)) {
            return (candidate.modelInteractionsCount || 0) > (current.modelInteractionsCount || 0);
          }
          if ((candidate.toolFailuresCount || 0) !== (current.toolFailuresCount || 0)) {
            return (candidate.toolFailuresCount || 0) > (current.toolFailuresCount || 0);
          }
          return (candidate.maxTurnSteps || 0) > (current.maxTurnSteps || 0);
        }

        function extractBadcasesFromCases(cases) {
          const rawBads = [];
          for (const c of cases) {
            const bad = detectBadcaseItem(c);
            if (bad) rawBads.push(bad);
          }
          // Deduplicate similar prompts while preserving highest-signal representative
          const clusters = [];
          for (const item of rawBads) {
            let added = false;
            for (const cluster of clusters) {
              if (
                cluster.representative.badcaseType === item.badcaseType &&
                (cluster.representative.title === item.title ||
                 (cluster.representative.userPrompt && item.userPrompt && cluster.representative.userPrompt.slice(0, 30) === item.userPrompt.slice(0, 30)))
              ) {
                cluster.items.push(item);
                if (shouldPromoteBadcaseRep(item, cluster.representative)) {
                  cluster.representative = item;
                }
                added = true;
                break;
              }
            }
            if (!added) clusters.push({ representative: item, items: [item] });
          }
          const finalBads = clusters.map(cl => {
            const rep = { ...cl.representative };
            if (cl.items.length > 1) {
              rep.sampleRepetitions = cl.items.length;
            }
            return rep;
          });
          const sevRank = { '严重': 3, '高': 2, '关注': 1, '中': 1 };
          finalBads.sort((a, b) => (sevRank[b.severity] || 0) - (sevRank[a.severity] || 0));
          return finalBads;
        }

        function isModelLimitBadcase(b) {
          if (!b) return false;
          if (b.badcaseType === 'step_limit_exceeded' || b.badcaseTypeName === BADCASE_LABEL_MODEL_LIMIT) return true;
          if ((b.defectTags || []).includes(BADCASE_LABEL_MODEL_LIMIT)) return true;
          return getBadcaseCardMetrics(b).maxTurnModel >= 100;
        }

        function isHighTurnStepsBadcase(b) {
          if (!b) return false;
          if (b.badcaseType === 'high_turn_steps' || b.badcaseTypeName === BADCASE_LABEL_HIGH_STEPS) return true;
          if ((b.defectTags || []).some(t => t.includes('单轮高步数'))) return true;
          return getBadcaseCardMetrics(b).maxTurnSteps > 100;
        }

        function normalizeDatasetMetricsClientSide(json) {
          if (!json || json.metricsVersion === CLIENT_METRICS_VERSION) return json;
          if (Array.isArray(json.cases)) {
            json.cases = json.cases.map(c => {
              if (!Array.isArray(c.messages) || c.messages.length === 0) return c;
              const m = computeConversationMetrics(c.messages);
              return {
                ...c,
                maxTurnSteps: m.maxTurnSteps,
                modelInteractionsCount: m.maxTurnModelInteractions,
                totalModelInteractionsCount: m.modelInteractions,
                needsAttention: m.maxTurnSteps > 100,
                attentionTag: m.maxTurnSteps > 100 ? BADCASE_LABEL_HIGH_STEPS : ''
              };
            });
          }

          const rawList = Array.isArray(json.rawSessions) ? json.rawSessions : [];
          const hasRawMsgs = rawList.some(s => !s.isNoise && Array.isArray(s.messages) && s.messages.length > 0);
          if (hasRawMsgs) {
            const pseudoCases = rawList
              .filter(s => !s.isNoise && Array.isArray(s.messages) && s.messages.length > 0)
              .map(s => {
                const m = computeConversationMetrics(s.messages);
                const toolNames = [...new Set(s.messages.filter(isToolCallMessage).map(t => getToolExecutionDetails(t).specificName).filter(Boolean))];
                const assistantMsgs = s.messages.filter(x => x.role === 'assistant');
                return {
                  sessionId: s.sessionId,
                  runId: s.runId || '',
                  title: s.title,
                  userPrompt: s.userPrompt || s.title || '',
                  referenceAnswer: assistantMsgs[assistantMsgs.length - 1]?.content || '',
                  turnsCount: m.turnsCount,
                  toolCallsCount: m.toolCallsCount,
                  toolNames,
                  modelId: s.model || '',
                  createdAt: s.createdAt || '',
                  compId: s.compId ?? s.companyId ?? '',
                  userId: s.userId ?? '',
                  messages: s.messages
                };
              });
            const recomputedBads = extractBadcasesFromCases(pseudoCases);
            const badTypeBySid = new Map();
            for (const c of pseudoCases) {
              const b = detectBadcaseItem(c);
              if (b) badTypeBySid.set(c.sessionId, b.badcaseTypeName);
            }
            json.rawSessions = rawList.map(s => {
              if (!Array.isArray(s.messages) || s.messages.length === 0) return s;
              const m = computeConversationMetrics(s.messages);
              const visibleCount = s.messages.filter(x => !isFollowupMessage(x)).length;
              return {
                ...s,
                messageCount: visibleCount,
                turnCount: m.turnsCount,
                execSteps: m.maxTurnSteps,
                badcaseTypeName: badTypeBySid.get(s.sessionId) || ''
              };
            });
            json.badcases = recomputedBads;
            const bBreakdown = {};
            for (const b of recomputedBads) {
              bBreakdown[b.badcaseTypeName] = (bBreakdown[b.badcaseTypeName] || 0) + 1;
            }
            json.summary = {
              ...(json.summary || {}),
              badcasesCount: recomputedBads.length,
              badcaseBreakdown: bBreakdown
            };
          } else if (Array.isArray(json.badcases) && json.badcases.length > 0) {
            const recomputed = json.badcases.map(b => (Array.isArray(b.messages) && b.messages.length > 0 ? (detectBadcaseItem(b) || b) : b));
            json.badcases = recomputed;
          }
          return json;
        }

        function App() {
          const yesterdayStr = React.useMemo(() => {
            const d = new Date(Date.now() - 86400000);
            return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });
          }, []);

          const [date, setDate] = React.useState(yesterdayStr);
          const [selectedEnv, setSelectedEnv] = React.useState(null);
          const [config, setConfig] = React.useState(undefined);
          const currentEnv = selectedEnv || config?.activeEnv || 'prod';
          const [showConfigModal, setShowConfigModal] = React.useState(false);
          const [configEditing, setConfigEditing] = React.useState(null);
          const [data, setData] = React.useState(null);
          const [loading, setLoading] = React.useState(true);
          const [savingConfig, setSavingConfig] = React.useState(false);
          const [error, setError] = React.useState('');
          const [selectedCategory, setSelectedCategory] = React.useState('全部');
          const [minScore, setMinScore] = React.useState(60);
          const [searchQuery, setSearchQuery] = React.useState('');
          const [viewMode, setViewMode] = React.useState('sessions');
          const openView = mode => {
            if (mode !== viewMode) setSearchQuery('');
            setViewMode(mode);
          };
          const [selectedCaseId, setSelectedCaseId] = React.useState(null);
          const [selectedBadcaseId, setSelectedBadcaseId] = React.useState(null);
          const [selectedSessionId, setSelectedSessionId] = React.useState(null);
          const [selectedSessionFilter, setSelectedSessionFilter] = React.useState('全部');
          const [selectedBadcaseType, setSelectedBadcaseType] = React.useState('全部');
          const [selectedIds, setSelectedIds] = React.useState(new Set());
          const [selectedBadcaseIds, setSelectedBadcaseIds] = React.useState(new Set());
          const [activeTab, setActiveTab] = React.useState('case');
          const [badcaseTab, setBadcaseTab] = React.useState('diag');
          const [answerViewMode, setAnswerViewMode] = React.useState('preview');
          const [copied, setCopied] = React.useState('');
          const [envMenuOpen, setEnvMenuOpen] = React.useState(false);
          const [visibleFields, setVisibleFields] = React.useState({});
          const [expandedEnv, setExpandedEnv] = React.useState('prod');
          const envDropdownRef = React.useRef(null);
          const datasetRequestId = React.useRef(0);
          const extractAfterSave = React.useRef(false);

          // Regression Testing states
          const [regressionTasks, setRegressionTasks] = React.useState([]);
          const [regressionDrawerOpen, setRegressionDrawerOpen] = React.useState(false);
          const [regressionModalOpen, setRegressionModalOpen] = React.useState(false);
          const [regressionTargetCases, setRegressionTargetCases] = React.useState([]);
          const [regressionTargetEnv, setRegressionTargetEnv] = React.useState('preprod');
          const [selectedRegressionTaskId, setSelectedRegressionTaskId] = React.useState(null);
          const [submittingRegression, setSubmittingRegression] = React.useState(false);
          const [reasoningExpanded, setReasoningExpanded] = React.useState(false);

          // Official Evaluation Dataset Management states
          const [officialCases, setOfficialCases] = React.useState([]);
          const [selectedOfficialCaseId, setSelectedOfficialCaseId] = React.useState(null);
          const [selectedOfficialIds, setSelectedOfficialIds] = React.useState(new Set());
          const [selectedOfficialFilter, setSelectedOfficialFilter] = React.useState('全部');
          const [officialTab, setOfficialTab] = React.useState('spec'); // 'spec' | 'reg_history' | 'timeline'
          const [editingOfficialCase, setEditingOfficialCase] = React.useState(null);
          const [newOfficialModalOpen, setNewOfficialModalOpen] = React.useState(false);
          const [newOfficialDraft, setNewOfficialDraft] = React.useState({
            title: '',
            category: '综合问答',
            priority: 'P1',
            sourceType: 'manual',
            userPrompt: '',
            evalCriteria: '',
            referenceAnswer: ''
          });
          const [toastMsg, setToastMsg] = React.useState('');
          const toastTimerRef = React.useRef(null);

          const showToast = React.useCallback((msg) => {
            setToastMsg(msg);
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
            toastTimerRef.current = setTimeout(() => setToastMsg(''), 3200);
          }, []);

          const normalizeOfficialItemClient = React.useCallback((item, srcDate, srcEnv) => {
            const isBadcase = Boolean(
              item.sourceType === 'badcase' ||
              item.badcaseType ||
              (typeof item.id === 'string' && item.id.startsWith('bad_'))
            );
            let sourceType = item.sourceType;
            if (sourceType === 'positive') sourceType = 'case';
            if (sourceType !== 'manual' && sourceType !== 'badcase' && sourceType !== 'case') {
              sourceType = item.isManual ? 'manual' : (isBadcase ? 'badcase' : 'case');
            }
            const now = new Date().toISOString();

            const resolvedCategory =
              (item.categoryName && item.categoryName !== '通用业务咨询' ? item.categoryName : '') ||
              item.category ||
              item.categoryName ||
              item.badcaseTypeName ||
              '综合问答';

            const resolvedToolNames = Array.isArray(item.toolNames) && item.toolNames.length > 0
              ? item.toolNames
              : (Array.isArray(item.toolsUsed) ? item.toolsUsed : []);

            const resolvedPrompt = item.userPrompt || item.prompt || '';
            const resolvedTitle = (item.title || '').trim() || resolvedPrompt.trim().replace(/\s+/g, ' ').slice(0, 45) || '未命名评测用例';

            let defaultPriority = 'P1';
            if (item.priority) {
              defaultPriority = item.priority;
            } else if (item.severity === '严重' || (typeof item.valueScore === 'number' && item.valueScore >= 90)) {
              defaultPriority = 'P0';
            } else if (item.severity === '中' || (typeof item.valueScore === 'number' && item.valueScore < 75)) {
              defaultPriority = 'P2';
            }

            let defaultCriteria = item.evalCriteria || '';
            if (!defaultCriteria) {
              if (sourceType === 'badcase') {
                defaultCriteria = `【缺陷回归防复现】防止再次出现「${item.badcaseTypeName || '历史异常'}」\n` +
                  (item.phenomenon ? `【历史故障现象】${item.phenomenon}\n` : '') +
                  `【修复验证要求】${item.recommendation || '正确完成工具调用与推理，输出符合业务规则的完整回复'}`;
              } else {
                const reasons = Array.isArray(item.valueReasons) && item.valueReasons.length > 0
                  ? item.valueReasons.map(r => `- ${r}`).join('\n')
                  : '- 准确理解访客/客服提问意图并给出结构化准确回复';
                defaultCriteria = `【核心能力基准】验证「${resolvedCategory}」场景下的意图识别、工具链执行与回答质量：\n${reasons}`;
              }
            }

            const cleaned = {
              ...item,
              id: item.id || `official_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              title: resolvedTitle,
              sessionId: item.sessionId || '',
              runId: item.runId || '',
              runIds: item.runIds || (item.runId ? [item.runId] : []),
              sourceType,
              isManual: sourceType === 'manual' ? true : Boolean(item.isManual && sourceType !== 'case' && sourceType !== 'badcase'),
              sourceDate: item.sourceDate || srcDate || (item.createdAt ? item.createdAt.slice(0, 10) : ''),
              sourceEnv: item.sourceEnv || srcEnv || 'prod',
              priority: defaultPriority,
              category: resolvedCategory,
              toolNames: resolvedToolNames,
              toolCallsCount: typeof item.toolCallsCount === 'number' ? item.toolCallsCount : resolvedToolNames.length,
              userPrompt: resolvedPrompt,
              referenceAnswer: item.referenceAnswer || '',
              evalCriteria: defaultCriteria,
              addedAt: item.addedAt || now,
              updatedAt: item.updatedAt || now
            };
            delete cleaned.categoryName;
            delete cleaned.toolsUsed;
            return cleaned;
          }, []);

          const persistOfficialDataset = React.useCallback(async (nextItems) => {
            setOfficialCases(nextItems);
            try {
              localStorage.setItem('kuaibuddy_official_dataset_v1', JSON.stringify(nextItems));
            } catch (e) {}

            try {
              const res = await fetch('/api/eval-dataset?action=save_official_dataset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: nextItems })
              });
              if (!res.ok) {
                const liteItems = nextItems.map(({ messages, ...rest }) => ({
                  ...rest,
                  messages: Array.isArray(messages) ? messages.slice(0, 30) : []
                }));
                await fetch('/api/eval-dataset?action=save_config', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ officialDataset: liteItems })
                });
              }
            } catch (e) {
              console.warn('保存正式评测集失败:', e);
            }
          }, []);

          const loadOfficialDataset = React.useCallback(async () => {
            let localItems = null;
            try {
              const raw = localStorage.getItem('kuaibuddy_official_dataset_v1');
              if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                  localItems = parsed.filter(Boolean).map(x => normalizeOfficialItemClient(x));
                  setOfficialCases(localItems);
                  if (localItems.length > 0) {
                    setSelectedOfficialCaseId(prev => prev || localItems[0].id);
                    setSelectedOfficialIds(new Set(localItems.map(x => x.id)));
                  }
                }
              }
            } catch (e) {}

            try {
              const res = await fetch('/api/eval-dataset?action=get_official_dataset');
              if (res.ok) {
                const json = await res.json();
                const serverItems = Array.isArray(json.items)
                  ? json.items.filter(Boolean).map(x => normalizeOfficialItemClient(x))
                  : [];
                if (serverItems.length > 0) {
                  setOfficialCases(serverItems);
                  setSelectedOfficialCaseId(prev => (prev && serverItems.some(x => x.id === prev)) ? prev : serverItems[0].id);
                  setSelectedOfficialIds(new Set(serverItems.map(x => x.id)));
                  try {
                    localStorage.setItem('kuaibuddy_official_dataset_v1', JSON.stringify(serverItems));
                  } catch (e) {}
                } else if (localItems && localItems.length > 0) {
                  persistOfficialDataset(localItems);
                }
              } else {
                const cfgRes = await fetch('/api/eval-dataset?action=get_config');
                if (cfgRes.ok) {
                  const cfg = await cfgRes.json();
                  if (Array.isArray(cfg.officialDataset) && cfg.officialDataset.length > 0 && (!localItems || localItems.length === 0)) {
                    const normalizedCfgItems = cfg.officialDataset.filter(Boolean).map(x => normalizeOfficialItemClient(x));
                    setOfficialCases(normalizedCfgItems);
                    setSelectedOfficialCaseId(normalizedCfgItems[0].id);
                    setSelectedOfficialIds(new Set(normalizedCfgItems.map(x => x.id)));
                  }
                }
              }
            } catch (e) {}
          }, [persistOfficialDataset, normalizeOfficialItemClient]);

          React.useEffect(() => {
            loadOfficialDataset();
          }, [loadOfficialDataset]);

          const isCaseInOfficial = React.useCallback((item) => {
            if (!item) return false;
            const itemSourceType = (item.sourceType === 'badcase' || item.badcaseType || (typeof item.id === 'string' && item.id.startsWith('bad_'))) ? 'badcase' : 'case';
            return officialCases.some(oc =>
              oc.id === item.id ||
              (oc.sessionId && item.sessionId && oc.sessionId === item.sessionId && (oc.sourceType || 'case') === itemSourceType)
            );
          }, [officialCases]);

          const handleAddOfficialCases = React.useCallback(async (itemsToAdd) => {
            const list = Array.isArray(itemsToAdd) ? itemsToAdd : [itemsToAdd];
            if (list.length === 0) return;

            let addedCount = 0;
            const nextList = [...officialCases];

            for (const raw of list) {
              if (!raw) continue;
              const normalized = normalizeOfficialItemClient(raw, date, currentEnv);
              const existingIdx = nextList.findIndex(oc =>
                oc.id === normalized.id ||
                (oc.sessionId && normalized.sessionId && oc.sessionId === normalized.sessionId && (oc.sourceType || 'case') === normalized.sourceType)
              );
              if (existingIdx >= 0) {
                nextList[existingIdx] = {
                  ...normalized,
                  ...nextList[existingIdx],
                  id: nextList[existingIdx].id,
                  addedAt: nextList[existingIdx].addedAt || normalized.addedAt,
                  updatedAt: new Date().toISOString()
                };
              } else {
                nextList.unshift(normalized);
                addedCount++;
              }
            }

            await persistOfficialDataset(nextList);
            setSelectedOfficialIds(prev => {
              const next = new Set(prev);
              for (const item of nextList) next.add(item.id);
              return next;
            });
            if (!selectedOfficialCaseId && nextList.length > 0) {
              setSelectedOfficialCaseId(nextList[0].id);
            }

            if (addedCount > 0) {
              showToast(`已选入 ${addedCount} 条用例至「正式评测集」（当前共 ${nextList.length} 条）`);
            } else {
              showToast(`所选用例已在「正式评测集」中（共 ${nextList.length} 条）`);
            }
          }, [officialCases, normalizeOfficialItemClient, date, currentEnv, persistOfficialDataset, selectedOfficialCaseId, showToast]);

          const handleRemoveOfficialCases = React.useCallback(async (idsOrItems) => {
            const rawArr = Array.isArray(idsOrItems) ? idsOrItems : [idsOrItems];
            const idSet = new Set();
            for (const x of rawArr) {
              if (!x) continue;
              if (typeof x === 'string') idSet.add(x);
              else if (x.id) idSet.add(x.id);
            }
            if (idSet.size === 0) return;

            const nextList = officialCases.filter(oc => !idSet.has(oc.id));
            const removedCount = officialCases.length - nextList.length;
            await persistOfficialDataset(nextList);

            setSelectedOfficialIds(prev => {
              const next = new Set(prev);
              for (const id of idSet) next.delete(id);
              return next;
            });
            if (selectedOfficialCaseId && idSet.has(selectedOfficialCaseId)) {
              setSelectedOfficialCaseId(nextList[0]?.id || null);
            }
            setEditingOfficialCase(null);
            showToast(`已从「正式评测集」移出 ${removedCount} 条用例`);
          }, [officialCases, persistOfficialDataset, selectedOfficialCaseId, showToast]);

          const handleSaveOfficialEdit = React.useCallback(async () => {
            if (!editingOfficialCase) return;
            const now = new Date().toISOString();
            const nextList = officialCases.map(oc => {
              if (oc.id !== editingOfficialCase.id) return oc;
              return normalizeOfficialItemClient({
                ...oc,
                ...editingOfficialCase,
                updatedAt: now
              }, oc.sourceDate, oc.sourceEnv);
            });
            await persistOfficialDataset(nextList);
            setEditingOfficialCase(null);
            showToast('已保存正式评测集用例配置');
          }, [editingOfficialCase, officialCases, normalizeOfficialItemClient, persistOfficialDataset, showToast]);

          const handleCreateManualOfficialCase = React.useCallback(async () => {
            if (!newOfficialDraft.userPrompt.trim()) {
              alert('请填写回归测试提问 (Prompt)');
              return;
            }
            const now = new Date().toISOString();
            const cleanPrompt = newOfficialDraft.userPrompt.trim();
            const finalTitle = newOfficialDraft.title.trim() || cleanPrompt.replace(/\s+/g, ' ').slice(0, 45);
            const created = normalizeOfficialItemClient({
              id: `official_manual_${Date.now().toString(36)}`,
              title: finalTitle,
              category: newOfficialDraft.category.trim() || '综合问答',
              priority: newOfficialDraft.priority || 'P1',
              sourceType: newOfficialDraft.sourceType || 'manual',
              isManual: true,
              sourceDate: date,
              sourceEnv: currentEnv,
              userPrompt: cleanPrompt,
              evalCriteria: newOfficialDraft.evalCriteria.trim(),
              referenceAnswer: newOfficialDraft.referenceAnswer.trim(),
              turnsCount: 1,
              toolCallsCount: 0,
              toolNames: [],
              messages: [
                { role: 'user', content: cleanPrompt, createdAt: now },
                ...(newOfficialDraft.referenceAnswer.trim()
                  ? [{ role: 'assistant', content: newOfficialDraft.referenceAnswer.trim(), createdAt: now }]
                  : [])
              ]
            }, date, currentEnv);

            const nextList = [created, ...officialCases];
            await persistOfficialDataset(nextList);
            setSelectedOfficialCaseId(created.id);
            setSelectedOfficialIds(prev => new Set([...prev, created.id]));
            setNewOfficialModalOpen(false);
            setNewOfficialDraft({
              title: '',
              category: '综合问答',
              priority: 'P1',
              sourceType: 'manual',
              userPrompt: '',
              evalCriteria: '',
              referenceAnswer: ''
            });
            showToast('已创建并收录至「正式评测集」');
          }, [newOfficialDraft, normalizeOfficialItemClient, date, currentEnv, officialCases, persistOfficialDataset, showToast]);

          const toggleFieldVisible = (fieldId) => {
            setVisibleFields(prev => ({ ...prev, [fieldId]: !prev[fieldId] }));
          };

          // Load regression tasks
          const loadRegressionTasks = React.useCallback(async () => {
            try {
              const res = await fetch('/api/eval-dataset?action=get_regression_tasks');
              if (res.ok) {
                const json = await res.json();
                const tasks = json.tasks || [];
                setRegressionTasks(tasks);
                setSelectedRegressionTaskId(prev => {
                  if (prev && tasks.some(t => t.id === prev)) return prev;
                  return tasks.length > 0 ? tasks[0].id : null;
                });
              }
            } catch (e) {
              console.warn('获取回归任务失败:', e);
            }
          }, []);

          React.useEffect(() => {
            loadRegressionTasks();
          }, [loadRegressionTasks]);

          // Auto-polling when tasks are running
          React.useEffect(() => {
            const hasActive = regressionTasks.some(t => t.status === 'running' || t.status === 'pending');
            if (!hasActive) return;

            const timer = setInterval(() => {
              loadRegressionTasks();
            }, 2000);

            return () => clearInterval(timer);
          }, [regressionTasks, loadRegressionTasks]);

          // Open Run Regression Modal
          const openRunRegressionModal = (casesList) => {
            if (!casesList || casesList.length === 0) return;
            setRegressionTargetCases(casesList);
            setRegressionTargetEnv(currentEnv === 'prod' ? 'preprod' : currentEnv);
            setRegressionModalOpen(true);
          };

          // Submit Regression Tasks
          const handleStartRegression = async () => {
            if (!regressionTargetCases || regressionTargetCases.length === 0) return;
            setSubmittingRegression(true);
            try {
              const envData = config?.environments?.[regressionTargetEnv];
              const payload = {
                cases: regressionTargetCases,
                env: regressionTargetEnv,
                overrideCreds: envData ? {
                  url: envData.url,
                  key: envData.key,
                  companyId: envData.companyId,
                  username: envData.username,
                  password: envData.password
                } : undefined
              };
              const res = await fetch('/api/eval-dataset?action=start_regression', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              const json = await res.json();
              if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);

              setRegressionModalOpen(false);
              setRegressionDrawerOpen(true);
              if (json.tasks && json.tasks.length > 0) {
                setSelectedRegressionTaskId(json.tasks[0].id);
              }
              await loadRegressionTasks();
            } catch (err) {
              alert(`发起回归测试失败: ${err.message}`);
            } finally {
              setSubmittingRegression(false);
            }
          };

          const handleCancelRegressionTask = async (taskId) => {
            try {
              await fetch('/api/eval-dataset?action=cancel_regression_task', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId })
              });
              await loadRegressionTasks();
            } catch (e) {}
          };

          const handleClearRegressionTasks = async () => {
            try {
              await fetch('/api/eval-dataset?action=clear_regression_tasks', { method: 'POST' });
              await loadRegressionTasks();
            } catch (e) {}
          };

          // Close dropdown on outside click
          React.useEffect(() => {
            if (!envMenuOpen) return;
            function handleOutside(e) {
              if (envDropdownRef.current && !envDropdownRef.current.contains(e.target)) {
                setEnvMenuOpen(false);
              }
            }
            document.addEventListener('mousedown', handleOutside);
            return () => document.removeEventListener('mousedown', handleOutside);
          }, [envMenuOpen]);

          React.useEffect(() => {
            if (!envMenuOpen && !showConfigModal && !regressionModalOpen && !regressionDrawerOpen && !newOfficialModalOpen) return;
            const closeOnEscape = event => {
              if (event.key !== 'Escape' || event.defaultPrevented) return;
              event.preventDefault();
              if (newOfficialModalOpen) setNewOfficialModalOpen(false);
              else if (regressionModalOpen && !submittingRegression) setRegressionModalOpen(false);
              else if (regressionDrawerOpen && !regressionModalOpen) setRegressionDrawerOpen(false);
              else if (showConfigModal && !savingConfig) setShowConfigModal(false);
              else setEnvMenuOpen(false);
            };
            document.addEventListener('keydown', closeOnEscape);
            return () => document.removeEventListener('keydown', closeOnEscape);
          }, [envMenuOpen, showConfigModal, regressionModalOpen, regressionDrawerOpen, newOfficialModalOpen, savingConfig, submittingRegression]);

          // 启动时合并配置，再发起数据请求。
          React.useEffect(() => {
            let cancelled = false;
            const loadConfig = async () => {
              let localConfig = null;
              try {
                localConfig = JSON.parse(localStorage.getItem('kuaibuddy_eval_config'));
              } catch (e) {}

              let merged = localConfig || { activeEnv: 'prod', environments: {} };
              try {
                const res = await fetch('/api/eval-dataset?action=get_config');
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const serverConfig = await res.json();
                const mergedEnvs = {};
                const envKeys = new Set([
                  ...Object.keys(serverConfig.environments || {}),
                  ...Object.keys(localConfig?.environments || {})
                ]);
                let needsServerSync = false;
                for (const k of envKeys) {
                  const sEnv = serverConfig.environments?.[k] || {};
                  const lEnv = localConfig?.environments?.[k] || {};
                  const nextEnv = { ...lEnv, ...sEnv };
                  for (const field of ['key', 'password', 'companyId', 'username', 'url']) {
                    if ((!sEnv[field] || String(sEnv[field]).trim() === '') && lEnv[field] && String(lEnv[field]).trim() !== '') {
                      nextEnv[field] = lEnv[field];
                      if (field === 'key' || field === 'password') needsServerSync = true;
                    }
                  }
                  mergedEnvs[k] = nextEnv;
                }
                merged = {
                  ...serverConfig,
                  activeEnv: localConfig?.activeEnv || serverConfig.activeEnv || 'prod',
                  environments: mergedEnvs
                };
                if (needsServerSync) {
                  await fetch('/api/eval-dataset?action=save_config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ activeEnv: merged.activeEnv, environments: merged.environments })
                  }).catch(() => {});
                }
              } catch (e) {
                console.warn('获取配置失败:', e);
              }
              if (!cancelled) setConfig(merged);
            };
            loadConfig();
            return () => { cancelled = true; };
          }, []);

          const loadData = React.useCallback(async (force = false) => {
            const requestId = ++datasetRequestId.current;
            setLoading(true);
            setError('');
            try {
              const res = await fetch(`/api/eval-dataset?action=${force ? 'extract' : 'get_data'}&date=${encodeURIComponent(date)}&minScore=${encodeURIComponent(minScore)}&env=${encodeURIComponent(currentEnv)}`);
              if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || `HTTP ${res.status}`);
              }
              const json = await res.json();
              if (requestId !== datasetRequestId.current) return;
              if (Array.isArray(json.cases)) {
                for (const c of json.cases) {
                  if (!c.runId && Array.isArray(c.messages)) {
                    const rids = [...new Set(c.messages.map(m => m.runId).filter(Boolean))];
                    if (rids.length > 0) {
                      c.runId = rids[0];
                      c.runIds = rids;
                    }
                  }
                }
              }
              if (Array.isArray(json.badcases)) {
                for (const b of json.badcases) {
                  if (!b.runId && Array.isArray(b.messages)) {
                    const rids = [...new Set(b.messages.map(m => m.runId).filter(Boolean))];
                    if (rids.length > 0) {
                      b.runId = rids[0];
                      b.runIds = rids;
                    }
                  }
                }
              }
              normalizeDatasetMetricsClientSide(json);
              if ((!json.badcases || json.badcases.length === 0) && json.cases && json.cases.length > 0) {
                const clientBads = extractBadcasesFromCases(json.cases);
                json.badcases = clientBads;
                if (!json.summary.badcasesCount) {
                  json.summary.badcasesCount = clientBads.length;
                  const bBreakdown = {};
                  for (const b of clientBads) {
                    bBreakdown[b.badcaseTypeName] = (bBreakdown[b.badcaseTypeName] || 0) + 1;
                  }
                  json.summary.badcaseBreakdown = bBreakdown;
                }
              }
              setData({ ...json, date, env: currentEnv });
              if (json.cases && json.cases.length > 0) {
                setSelectedCaseId(json.cases[0].id);
                setSelectedIds(new Set(json.cases.map(c => c.id)));
              } else {
                setSelectedCaseId(null);
                setSelectedIds(new Set());
              }
              if (json.badcases && json.badcases.length > 0) {
                setSelectedBadcaseId(json.badcases[0].id);
                setSelectedBadcaseIds(new Set(json.badcases.map(b => b.id)));
              } else {
                setSelectedBadcaseId(null);
                setSelectedBadcaseIds(new Set());
              }
            } catch (err) {
              if (requestId === datasetRequestId.current) setError(err.message);
            } finally {
              if (requestId === datasetRequestId.current) setLoading(false);
            }
          }, [date, minScore, currentEnv, config]);

          React.useEffect(() => {
            if (config === undefined) return;
            const force = extractAfterSave.current;
            extractAfterSave.current = false;
            loadData(force);
            return () => { datasetRequestId.current += 1; };
          }, [config, loadData]);

          // Handle environment switch
          const handleEnvChange = (newEnv) => {
            setSelectedEnv(newEnv);
            const envData = config?.environments?.[newEnv];
            if (newEnv === 'prod' && (!envData?.key || envData.key.trim() === '')) {
              openConfigModal(newEnv);
            }
          };

          const updateEnvField = (envKey, field, val) => {
            setConfigEditing(prev => {
              if (!prev) return prev;
              const nextEnvs = { ...prev.environments };
              nextEnvs[envKey] = {
                ...(nextEnvs[envKey] || {}),
                [field]: val
              };
              return { ...prev, environments: nextEnvs };
            });
          };

          const openConfigModal = (env = currentEnv) => {
            const defaultEnvs = {
              prod: { name: '生产环境', tag: 'prd', url: 'https://kuaibuddy.kuaishang.cn', key: '', companyId: '', username: '', password: '' },
              preprod: { name: '预生产环境', tag: 'pre', url: 'https://test-kuaibuddy.dingningtalk.com', key: '', companyId: '232679', username: 'testpro', password: '' },
              test: { name: '测试环境', tag: 'tkf', url: 'https://tkf-kuaibuddy.kuaishang.cn', key: '198270-Test', companyId: '198270', username: '', password: '' },
              dev: { name: '开发环境', tag: 'dkf', url: 'https://dkf-kuaibuddy.kuaishang.cn', key: '', companyId: '', username: '', password: '' }
            };
            const currentEnvs = config?.environments || {};
            const mergedEnvs = {
              prod: { ...defaultEnvs.prod, ...(currentEnvs.prod || {}) },
              preprod: { ...defaultEnvs.preprod, ...(currentEnvs.preprod || {}) },
              test: { ...defaultEnvs.test, ...(currentEnvs.test || {}) },
              dev: { ...defaultEnvs.dev, ...(currentEnvs.dev || {}) }
            };
            setConfigEditing({
              activeEnv: env,
              environments: JSON.parse(JSON.stringify(mergedEnvs))
            });
            setExpandedEnv(env);
            setShowConfigModal(true);
          };

          const saveAndApplyConfig = async (triggerFetch = true) => {
            setSavingConfig(true);
            try {
              const payload = {
                ...configEditing,
                activeEnv: currentEnv
              };
              try {
                localStorage.setItem('kuaibuddy_eval_config', JSON.stringify(payload));
              } catch (e) {}

              const res = await fetch('/api/eval-dataset?action=save_config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              let saved = payload;
              if (res.ok) {
                saved = await res.json();
              }
              extractAfterSave.current = triggerFetch;
              setConfig(saved);
              setShowConfigModal(false);
            } catch (e) {
              alert(e.message);
            } finally {
              setSavingConfig(false);
            }
          };

          const visibleData = data?.date === date && data?.env === currentEnv ? data : null;
          const summary = visibleData?.summary || {
            totalRawSessions: 0,
            noiseFilteredOut: 0,
            evaluatedCandidates: 0,
            extractedCount: 0,
            badcasesCount: 0,
            withToolCallsCount: 0,
            avgScore: 0,
            categoryBreakdown: {},
            badcaseBreakdown: {}
          };

          const allCases = visibleData?.cases || [];
          const allBadcases = visibleData?.badcases || [];
          const allRawSessions = visibleData?.rawSessions || [];

          const filteredRawSessions = React.useMemo(() => {
            return allRawSessions.filter(s => {
              if (selectedSessionFilter === '高价值用例' && !s.caseCategory) return false;
              if (selectedSessionFilter === 'Badcase 异常' && !s.badcaseTypeName) return false;
              if (selectedSessionFilter === '普通会话' && (s.isNoise || s.caseCategory || s.badcaseTypeName)) return false;
              if (selectedSessionFilter === '噪音/脚本探测' && !s.isNoise) return false;
              const q = searchQuery.trim().toLowerCase();
              if (q) {
                const matchTitle = (s.title || '').toLowerCase().includes(q);
                const matchPrompt = (s.userPrompt || '').toLowerCase().includes(q);
                const matchRunId = (s.runId || '').toLowerCase().includes(q);
                const matchSessionId = (s.sessionId || '').toLowerCase().includes(q);
                const matchThreadId = (s.threadId || '').toLowerCase().includes(q);
                if (!matchTitle && !matchPrompt && !matchRunId && !matchSessionId && !matchThreadId) return false;
              }
              return true;
            });
          }, [allRawSessions, selectedSessionFilter, searchQuery]);

          const activeRawSession = React.useMemo(() => {
            return filteredRawSessions.find(s => s.id === selectedSessionId) || filteredRawSessions[0] || null;
          }, [selectedSessionId, filteredRawSessions]);

          // Filtering Cases
          const filteredCases = React.useMemo(() => {
            return allCases.filter(c => {
              if (selectedCategory !== '全部' && c.category !== selectedCategory) return false;
              const q = searchQuery.trim().toLowerCase();
              if (q) {
                const matchTitle = (c.title || '').toLowerCase().includes(q);
                const matchPrompt = (c.userPrompt || '').toLowerCase().includes(q);
                const matchTools = (c.toolNames || []).some(t => t.toLowerCase().includes(q));
                const matchRunId = (c.runId || '').toLowerCase().includes(q);
                if (!matchTitle && !matchPrompt && !matchTools && !matchRunId) return false;
              }
              return true;
            });
          }, [allCases, selectedCategory, searchQuery]);

          // Filtering Badcases
          const filteredBadcases = React.useMemo(() => {
            return allBadcases.filter(b => {
              if (selectedBadcaseType !== '全部') {
                if (selectedBadcaseType === BADCASE_LABEL_MODEL_LIMIT) {
                  if (!isModelLimitBadcase(b)) return false;
                } else if (selectedBadcaseType === BADCASE_LABEL_HIGH_STEPS) {
                  if (!isHighTurnStepsBadcase(b)) return false;
                } else if (b.badcaseTypeName !== selectedBadcaseType && b.badcaseType !== selectedBadcaseType) {
                  return false;
                }
              }
              const q = searchQuery.trim().toLowerCase();
              if (q) {
                const matchTitle = (b.title || '').toLowerCase().includes(q);
                const matchPrompt = (b.userPrompt || '').toLowerCase().includes(q);
                const matchPhen = (b.phenomenon || '').toLowerCase().includes(q);
                const matchCause = (b.suspectedCause || '').toLowerCase().includes(q);
                const matchEvid = (b.evidence || '').toLowerCase().includes(q);
                const matchRunId = (b.runId || '').toLowerCase().includes(q);
                if (!matchTitle && !matchPrompt && !matchPhen && !matchCause && !matchEvid && !matchRunId) return false;
              }
              return true;
            });
          }, [allBadcases, selectedBadcaseType, searchQuery]);

          const activeCase = React.useMemo(() => {
            return filteredCases.find(c => c.id === selectedCaseId) || filteredCases[0] || null;
          }, [selectedCaseId, filteredCases]);

          const activeBadcase = React.useMemo(() => {
            return filteredBadcases.find(b => b.id === selectedBadcaseId) || filteredBadcases[0] || null;
          }, [selectedBadcaseId, filteredBadcases]);

          const officialManualCount = React.useMemo(
            () => officialCases.filter(c => c.sourceType === 'manual').length,
            [officialCases]
          );
          const officialPosCount = React.useMemo(
            () => officialCases.filter(c => c.sourceType !== 'badcase' && c.sourceType !== 'manual').length,
            [officialCases]
          );
          const officialBadCount = React.useMemo(
            () => officialCases.filter(c => c.sourceType === 'badcase').length,
            [officialCases]
          );
          const officialCategoryBreakdown = React.useMemo(() => {
            const map = {};
            for (const c of officialCases) {
              const cat = c.category || c.categoryName || c.badcaseTypeName || '综合问答';
              map[cat] = (map[cat] || 0) + 1;
            }
            return map;
          }, [officialCases]);

          const filteredOfficialCases = React.useMemo(() => {
            return officialCases.filter(c => {
              if (selectedOfficialFilter === '正向基准' && (c.sourceType === 'badcase' || c.sourceType === 'manual')) return false;
              if (selectedOfficialFilter === '缺陷回归' && c.sourceType !== 'badcase') return false;
              if (selectedOfficialFilter === '手动构建' && c.sourceType !== 'manual') return false;
              if (
                selectedOfficialFilter !== '全部' &&
                selectedOfficialFilter !== '正向基准' &&
                selectedOfficialFilter !== '缺陷回归' &&
                selectedOfficialFilter !== '手动构建' &&
                (c.category || c.categoryName || c.badcaseTypeName || '综合问答') !== selectedOfficialFilter
              ) {
                return false;
              }
              const q = searchQuery.trim().toLowerCase();
              if (q) {
                const matchTitle = (c.title || '').toLowerCase().includes(q);
                const matchPrompt = (c.userPrompt || '').toLowerCase().includes(q);
                const matchCriteria = (c.evalCriteria || '').toLowerCase().includes(q);
                const matchAnswer = (c.referenceAnswer || '').toLowerCase().includes(q);
                const matchDate = (c.sourceDate || '').toLowerCase().includes(q);
                const matchRunId = (c.runId || '').toLowerCase().includes(q);
                if (!matchTitle && !matchPrompt && !matchCriteria && !matchAnswer && !matchDate && !matchRunId) return false;
              }
              return true;
            });
          }, [officialCases, selectedOfficialFilter, searchQuery]);

          const activeOfficialCase = React.useMemo(() => {
            return filteredOfficialCases.find(c => c.id === selectedOfficialCaseId) || filteredOfficialCases[0] || null;
          }, [selectedOfficialCaseId, filteredOfficialCases]);

          const copyToClipboard = async (text, label) => {
            try {
              await navigator.clipboard.writeText(text);
              setCopied(label);
              setTimeout(() => setCopied(current => current === label ? '' : current), 2000);
            } catch {
              showToast('复制失败，请手动选择并复制文本');
            }
          };

          const renderIdentityChips = (item) => {
            if (!item) return null;
            const hasCompId = item.compId !== undefined && item.compId !== null && item.compId !== '';
            const hasUserId = item.userId !== undefined && item.userId !== null && item.userId !== '';
            const chipStyle = {
              fontFamily: 'ui-monospace, monospace',
              fontSize: '11px',
              cursor: 'pointer'
            };
            return [
              hasCompId && h('span', {
                key: 'comp_id',
                className: 'ed-meta-chip',
                style: chipStyle,
                title: `点击复制公司ID: ${item.compId}`,
                onClick: () => copyToClipboard(String(item.compId), 'comp_id')
              }, `公司ID: ${item.compId}`, copied === 'comp_id' ? ' (已复制)' : ''),
              hasUserId && h('span', {
                key: 'user_id',
                className: 'ed-meta-chip',
                style: chipStyle,
                title: `点击复制 userId: ${item.userId}`,
                onClick: () => copyToClipboard(String(item.userId), 'user_id')
              }, `userId: ${item.userId}`, copied === 'user_id' ? ' (已复制)' : '')
            ];
          };

          const visibleItems = viewMode === 'official' ? filteredOfficialCases
            : viewMode === 'badcases' ? filteredBadcases
              : viewMode === 'cases' ? filteredCases : [];
          const checkedIds = viewMode === 'official' ? selectedOfficialIds
            : viewMode === 'badcases' ? selectedBadcaseIds : selectedIds;
          const selectedItems = visibleItems.filter(item => checkedIds.has(item.id));
          const currentSelectedCount = selectedItems.length;
          const allVisibleSelected = visibleItems.length > 0 && currentSelectedCount === visibleItems.length;

          const handleExport = async () => {
            const isBadcaseMode = viewMode === 'badcases';
            const isOfficialMode = viewMode === 'official';
            if (selectedItems.length === 0) {
              alert(`请至少勾选一条${isOfficialMode ? '正式评测集用例' : (isBadcaseMode ? 'Badcase 回归用例' : '评测用例')}`);
              return;
            }
            try {
              const exportType = isOfficialMode ? 'official' : (isBadcaseMode ? 'badcases' : 'cases');
              const res = await fetch('/api/eval-dataset?action=export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  format: 'json',
                  type: exportType,
                  items: selectedItems
                })
              });
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              const json = await res.json();
              const blob = new Blob([json.content], { type: 'text/plain;charset=utf-8' });
              const a = document.createElement('a');
              const url = URL.createObjectURL(blob);
              a.href = url;
              const prefix = isOfficialMode
                ? 'kuaibuddy_official_dataset'
                : (isBadcaseMode ? 'kuaibuddy_badcase_regression' : 'kuaibuddy_eval');
              a.download = `${prefix}_${currentEnv}_${date}_${selectedItems.length}cases.json`;
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 0);
            } catch (err) {
              alert('导出失败: ' + err.message);
            }
          };

          const toggleSelectAll = () => {
            const updateSelection = viewMode === 'official' ? setSelectedOfficialIds
              : viewMode === 'badcases' ? setSelectedBadcaseIds : setSelectedIds;
            updateSelection(previous => {
              const next = new Set(previous);
              for (const { id } of visibleItems) {
                if (allVisibleSelected) next.delete(id);
                else next.add(id);
              }
              return next;
            });
          };

          const toggleSelectOne = (id, e) => {
            e.stopPropagation();
            if (viewMode === 'cases') {
              setSelectedIds(prev => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              });
            } else if (viewMode === 'badcases') {
              setSelectedBadcaseIds(prev => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              });
            } else {
              setSelectedOfficialIds(prev => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              });
            }
          };

          const categories = ['全部', ...Object.keys(summary.categoryBreakdown || {})];
          const badcaseFilterCounts = React.useMemo(() => {
            const counts = { ...(summary.badcaseBreakdown || {}) };
            const modelLimitCnt = allBadcases.filter(isModelLimitBadcase).length;
            const highStepsCnt = allBadcases.filter(isHighTurnStepsBadcase).length;
            if (modelLimitCnt > 0) counts[BADCASE_LABEL_MODEL_LIMIT] = modelLimitCnt;
            if (highStepsCnt > 0) counts[BADCASE_LABEL_HIGH_STEPS] = highStepsCnt;
            return counts;
          }, [summary.badcaseBreakdown, allBadcases]);
          const badcaseCategories = ['全部', ...Object.keys(badcaseFilterCounts)];
          const officialCategories = [
            '全部',
            '正向基准',
            '缺陷回归',
            ...((officialManualCount > 0 || selectedOfficialFilter === '手动构建') ? ['手动构建'] : []),
            ...Object.keys(officialCategoryBreakdown)
          ];

          return h('div', { className: 'ed-app' },
            h('style', null, css),
            toastMsg && h('div', { className: 'ed-toast' }, toastMsg),

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
                  // Environment selector (Custom Dropdown)
                  h('div', { className: 'ed-env-dropdown-wrapper', ref: envDropdownRef },
                    h('button', {
                      type: 'button',
                      className: `ed-env-trigger ${envMenuOpen ? 'open' : ''}`,
                      disabled: config === undefined,
                      onClick: () => setEnvMenuOpen(!envMenuOpen),
                      title: '切换运行环境'
                    },
                      h('span', { className: `ed-env-dot ${currentEnv === 'prod' ? 'ed-env-dot-prod' : (currentEnv === 'preprod' ? 'ed-env-dot-preprod' : (currentEnv === 'test' ? 'ed-env-dot-test' : 'ed-env-dot-dev'))}` }),
                      h('span', { className: 'ed-env-label' },
                        currentEnv === 'prod' ? '生产环境 (prd)' : (currentEnv === 'preprod' ? '预生产环境 (pre)' : (currentEnv === 'test' ? '测试环境 (tkf)' : '开发环境 (dkf)'))
                      ),
                      h('span', { className: `ed-env-chevron ${envMenuOpen ? 'open' : ''}` },
                        h(Glyph, { kind: 'chevronDown', size: 12 })
                      )
                    ),
                    envMenuOpen && h('div', { className: 'ed-env-menu' },
                      [
                        { id: 'prod', label: '生产环境 (prd)', dotClass: 'ed-env-dot-prod' },
                        { id: 'preprod', label: '预生产环境 (pre)', dotClass: 'ed-env-dot-preprod' },
                        { id: 'test', label: '测试环境 (tkf)', dotClass: 'ed-env-dot-test' },
                        { id: 'dev', label: '开发环境 (dkf)', dotClass: 'ed-env-dot-dev' }
                      ].map(opt => {
                        const isSelected = currentEnv === opt.id;
                        return h('div', {
                          key: opt.id,
                          className: `ed-env-menu-item ${isSelected ? 'selected' : ''}`,
                          onClick: () => {
                            setEnvMenuOpen(false);
                            handleEnvChange(opt.id);
                          }
                        },
                          h('div', { className: 'ed-env-item-left' },
                            h('span', { className: `ed-env-dot ${opt.dotClass}` }),
                            h('span', null, opt.label)
                          ),
                          isSelected && h('span', { className: 'ed-env-item-check' },
                            h(Glyph, { kind: 'check', size: 13 })
                          )
                        );
                      })
                    )
                  ),
                  // Environment Settings Button
                  h('button', {
                    className: 'ed-btn',
                    disabled: config === undefined,
                    onClick: () => openConfigModal(currentEnv),
                    title: '配置环境地址与 Staff Key'
                  }, h(Glyph, { kind: 'gear', size: 13 }), '环境配置'),

                  // Date selector
                  h('div', { className: 'ed-date-selector' },
                    h('span', { style: { fontSize: '11px', color: 'var(--ed-text2)' } }, '日期:'),
                    h('input', {
                      type: 'date',
                      'aria-label': '提取日期',
                      value: date,
                      onChange: e => { if (e.target.value) setDate(e.target.value); }
                    }),
                    h('button', {
                      className: 'ed-btn',
                      style: { padding: '2px 6px', fontSize: '11px' },
                      onClick: () => setDate(yesterdayStr)
                    }, '设为昨天')
                  ),
                  // Refresh button
                  h('button', {
                    className: 'ed-btn',
                    disabled: loading,
                    onClick: () => loadData(true)
                  }, h(Glyph, { kind: 'refresh', size: 13 }), loading ? '正在提取...' : '重新提取'),
                  // Regression Console Drawer entry button
                  h('button', {
                    className: `ed-btn ${regressionTasks.some(t => t.status === 'running') ? 'ed-btn-regression' : ''}`,
                    onClick: () => setRegressionDrawerOpen(true)
                  },
                    regressionTasks.some(t => t.status === 'running')
                      ? h(Glyph, { kind: 'spinner', size: 13, className: 'ed-reg-spin' })
                      : h(Glyph, { kind: 'zap', size: 13 }),
                    regressionTasks.some(t => t.status === 'running')
                      ? `回归测试 (${regressionTasks.filter(t => t.status === 'running').length} 运行中)`
                      : `回归测试进展 (${regressionTasks.length})`
                  ),
                  // Manual Add Official Case button (when in official view)
                  viewMode === 'official' && h('button', {
                    className: 'ed-btn ed-btn-official',
                    onClick: () => setNewOfficialModalOpen(true)
                  }, h(Glyph, { kind: 'plus', size: 13 }), '手动新增正式用例'),

                  // 导出选中的用例
                  viewMode !== 'sessions' && h('button', {
                    className: 'ed-btn ed-btn-primary',
                    disabled: currentSelectedCount === 0,
                    onClick: handleExport
                  },
                    h(Glyph, { kind: 'download', size: 13 }),
                    viewMode === 'official'
                      ? `导出正式评测集 (${currentSelectedCount})`
                      : (viewMode === 'cases' ? `导出评测集 (${currentSelectedCount})` : `导出 Badcase 回归集 (${currentSelectedCount})`)
                  )
                )
              ),

              // 2. Metrics Bar
              h('div', { className: 'ed-metrics' },
                h('button', {
                  type: 'button',
                  className: 'ed-metric-card',
                  'aria-pressed': viewMode === 'sessions',
                  style: { borderColor: viewMode === 'sessions' ? 'var(--ed-accent)' : undefined },
                  onClick: () => openView('sessions')
                },
                  h('span', { className: 'ed-metric-label' }, h(Glyph, { kind: 'dataset', size: 13 }), `会话总量 (${visibleData?.envName || config?.environments?.[currentEnv]?.name || currentEnv})`),
                  h('span', { className: 'ed-metric-val' }, summary.totalRawSessions),
                  h('span', { className: 'ed-metric-sub' }, `清洗排除脚本探测 ${summary.noiseFilteredOut} 条 · 点击查看全部`)
                ),
                h('button', {
                  type: 'button',
                  className: 'ed-metric-card',
                  'aria-pressed': viewMode === 'cases',
                  style: { borderColor: viewMode === 'cases' ? 'var(--ed-accent)' : undefined },
                  onClick: () => openView('cases')
                },
                  h('span', { className: 'ed-metric-label' }, h(Glyph, { kind: 'target', size: 13 }), '提取评测用例'),
                  h('span', { className: 'ed-metric-val', style: { color: 'var(--ed-accent)' } }, summary.extractedCount),
                  h('span', { className: 'ed-metric-sub' }, '结构化去重 · 点击查看用例')
                ),
                h('button', {
                  type: 'button',
                  className: 'ed-metric-card',
                  'aria-pressed': viewMode === 'badcases',
                  style: { borderColor: viewMode === 'badcases' ? '#cf1322' : undefined },
                  onClick: () => openView('badcases')
                },
                  h('span', { className: 'ed-metric-label' }, h(Glyph, { kind: 'alertTriangle', size: 13 }), 'Badcase 回归集'),
                  h('span', { className: 'ed-metric-val', style: { color: '#cf1322' } }, summary.badcasesCount || allBadcases.length),
                  h('span', { className: 'ed-metric-sub' }, `已归因 ${Object.keys(summary.badcaseBreakdown || {}).length} 类缺陷 · 点击查看`)
                ),
                h('button', {
                  type: 'button',
                  className: 'ed-metric-card',
                  'aria-pressed': viewMode === 'official',
                  style: { borderColor: viewMode === 'official' ? '#059669' : undefined },
                  onClick: () => openView('official')
                },
                  h('span', { className: 'ed-metric-label' }, h(Glyph, { kind: 'pin', size: 13 }), '正式评测集管理'),
                  h('span', { className: 'ed-metric-val', style: { color: '#059669' } }, officialCases.length),
                  h('span', { className: 'ed-metric-sub' }, `正向 ${officialPosCount} · 缺陷 ${officialBadCount}${officialManualCount > 0 ? ` · 手动 ${officialManualCount}` : ''} · 点击管理`)
                ),
                h('div', { className: 'ed-metric-card' },
                  h('span', { className: 'ed-metric-label' }, h(Glyph, { kind: 'tool', size: 13 }), '工具调用场景'),
                  h('span', { className: 'ed-metric-val', style: { color: 'var(--ed-success)' } }, summary.withToolCallsCount),
                  h('span', { className: 'ed-metric-sub' }, '包含多步工具排障推理场景')
                )
              )
            ),

            // 3. Toolbar & Filters
            h('div', { className: 'ed-toolbar' },
              h('div', { className: 'ed-tags-group' },
                (viewMode === 'sessions' ? ['全部', '高价值用例', 'Badcase 异常', '普通会话', '噪音/脚本探测'] : (viewMode === 'official' ? officialCategories : (viewMode === 'cases' ? categories : badcaseCategories))).map(cat => {
                  const isActive = viewMode === 'sessions'
                    ? selectedSessionFilter === cat
                    : (viewMode === 'official'
                      ? selectedOfficialFilter === cat
                      : ((viewMode === 'cases' ? selectedCategory : selectedBadcaseType) === cat));
                  let countLabel = '';
                  if (viewMode === 'sessions') {
                    if (cat === '全部') countLabel = ` (${allRawSessions.length})`;
                    else if (cat === '高价值用例') countLabel = ` (${allRawSessions.filter(s => s.caseCategory).length})`;
                    else if (cat === 'Badcase 异常') countLabel = ` (${allRawSessions.filter(s => s.badcaseTypeName).length})`;
                    else if (cat === '普通会话') countLabel = ` (${allRawSessions.filter(s => !s.isNoise && !s.caseCategory && !s.badcaseTypeName).length})`;
                    else countLabel = ` (${allRawSessions.filter(s => s.isNoise).length})`;
                  } else if (viewMode === 'official') {
                    if (cat === '全部') countLabel = ` (${officialCases.length})`;
                    else if (cat === '正向基准') countLabel = ` (${officialPosCount})`;
                    else if (cat === '缺陷回归') countLabel = ` (${officialBadCount})`;
                    else if (cat === '手动构建') countLabel = ` (${officialManualCount})`;
                    else countLabel = ` (${officialCategoryBreakdown[cat] || 0})`;
                  } else {
                    if (cat === '全部') countLabel = ` (${viewMode === 'cases' ? allCases.length : allBadcases.length})`;
                    else countLabel = ` (${(viewMode === 'cases' ? summary.categoryBreakdown : badcaseFilterCounts)[cat] || 0})`;
                  }
                  return h('button', {
                    key: cat,
                    className: `ed-tag-pill ${isActive ? 'active' : ''}`,
                    'aria-pressed': isActive,
                    onClick: () => {
                      if (viewMode === 'sessions') setSelectedSessionFilter(cat);
                      else if (viewMode === 'official') setSelectedOfficialFilter(cat);
                      else if (viewMode === 'cases') setSelectedCategory(cat);
                      else setSelectedBadcaseType(cat);
                    }
                  },
                    viewMode === 'official' && cat === '正向基准' ? h(Glyph, { kind: 'target', size: 12 }) : null,
                    viewMode === 'official' && cat === '缺陷回归' ? h(Glyph, { kind: 'alertTriangle', size: 12 }) : null,
                    viewMode === 'official' && cat === '手动构建' ? h(Glyph, { kind: 'edit', size: 12 }) : null,
                    `${cat}${countLabel}`
                  );
                })
              ),
              h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } },
                viewMode === 'official' && currentSelectedCount > 0 && h('button', {
                  className: 'ed-btn',
                  style: { color: '#dc2626', borderColor: 'rgba(220,38,38,0.28)', padding: '4px 10px' },
                  onClick: () => handleRemoveOfficialCases(selectedItems.map(item => item.id))
                }, h(Glyph, { kind: 'trash', size: 12 }), `批量移出 (${currentSelectedCount})`),
                h('div', { className: 'ed-search-box' },
                  h(Glyph, { kind: 'filter', size: 12 }),
                  h('input', {
                    'aria-label': '搜索当前列表',
                    placeholder: '搜索标题、内容或运行 ID',
                    value: searchQuery,
                    onChange: e => setSearchQuery(e.target.value)
                  }),
                  searchQuery && h('button', {
                    type: 'button',
                    className: 'ed-icon-btn',
                    'aria-label': '清除搜索',
                    title: '清除搜索',
                    onClick: () => setSearchQuery('')
                  }, h(Glyph, { kind: 'close', size: 12 }))
                )
              )
            ),

            // Error display
            error && h('div', {
              style: {
                padding: '10px 24px',
                background: '#fff2f0',
                borderBottom: '1px solid #ffccc7',
                color: 'var(--ed-error)',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }
            },
              h('span', { className: 'ed-ico-text' }, h(Glyph, { kind: 'alertTriangle', size: 14 }), error),
              h('button', {
                className: 'ed-btn',
                style: { padding: '2px 8px', fontSize: '11px' },
                onClick: () => openConfigModal(currentEnv)
              }, '立即配置 Key')
            ),

            // 4. Main Split View
            h('div', { className: 'ed-main-split' },
              // Left Column: List Pane
              h('div', { className: 'ed-list-pane' },
                h('div', { className: 'ed-list-header' },
                  h('span', null,
                    viewMode === 'sessions'
                      ? `全部会话 (${filteredRawSessions.length})`
                      : (viewMode === 'official'
                        ? `正式评测集 (${filteredOfficialCases.length})`
                        : (viewMode === 'cases' ? `用例列表 (${filteredCases.length})` : `Badcase 列表 (${filteredBadcases.length})`))
                  ),
                  viewMode !== 'sessions' && h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
                    viewMode !== 'official' && currentSelectedCount > 0 && h('button', {
                      className: 'ed-copy-btn',
                      style: { color: '#059669', fontWeight: 600 },
                      onClick: () => handleAddOfficialCases(selectedItems)
                    }, `选入正式评测集 (${currentSelectedCount})`),
                    visibleItems.length > 0 && h('button', {
                      className: 'ed-copy-btn',
                      onClick: toggleSelectAll
                    }, allVisibleSelected ? '取消全选' : '全选')
                  )
                ),
                h('div', { className: 'ed-case-cards' },
                  viewMode === 'sessions' ? [
                    filteredRawSessions.length === 0 && !loading && h('div', { key: 'empty', className: 'ed-empty-state' }, '无匹配会话记录'),
                    ...filteredRawSessions.map(s => {
                      const isSelected = (activeRawSession && activeRawSession.id === s.id);
                      return h('div', {
                        key: s.id,
                        className: `ed-case-card ${isSelected ? 'active' : ''}`,
                        onClick: () => setSelectedSessionId(s.id)
                      },
                        h('div', { className: 'ed-card-head' },
                          h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' } },
                            s.isNoise
                              ? h('span', { className: 'ed-tag-badge', style: { background: 'rgba(107, 114, 128, 0.12)', color: '#6b7280' } }, '噪音/脚本探测')
                              : (s.badcaseTypeName
                                ? h('span', { className: 'ed-tag-badge', style: { background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626' } }, h(Glyph, { kind: 'alertTriangle', size: 11 }), s.badcaseTypeName)
                                : (s.caseCategory
                                  ? h('span', { className: 'ed-tag-badge', style: { background: 'rgba(16, 185, 129, 0.1)', color: '#059669' } }, h(Glyph, { kind: 'target', size: 11 }), s.caseCategory)
                                  : h('span', { className: 'ed-tag-badge', style: { background: 'var(--ed-bg-layer2)', color: 'var(--ed-text2)' } }, '普通会话'))),
                            (s.execSteps !== undefined || s.messageCount > 0) && h('span', { style: { fontSize: '11px', color: 'var(--ed-text2)' } },
                              `${s.execSteps !== undefined ? s.execSteps : 0} 步${s.durationLabel ? ` · 耗时 ${s.durationLabel}` : ''}`
                            ),
                            (s.execSteps || 0) > 100 && h('span', {
                              style: {
                                fontSize: '10px',
                                color: '#d97706',
                                background: 'rgba(217, 119, 6, 0.08)',
                                border: '1px solid rgba(217, 119, 6, 0.25)',
                                borderRadius: '4px',
                                padding: '1px 5px',
                                fontWeight: '600'
                              },
                              title: `单轮步骤数达 ${s.execSteps} 步 (>100)，需关注`
                            }, '单轮高步数·需关注')
                          ),
                          h('span', { style: { fontSize: '11px', color: 'var(--ed-text2)' } }, (s.createdAt || '').slice(11, 16))
                        ),
                        h('div', { className: 'ed-card-title' }, s.title || s.sessionId),
                        s.model && h('div', { className: 'ed-card-meta' },
                          h('span', null, s.model)
                        )
                      );
                    })
                  ] : viewMode === 'cases' ? [
                    filteredCases.length === 0 && !loading && h('div', { key: 'empty', className: 'ed-empty-state' }, '无匹配评测用例'),
                    ...filteredCases.map(c => {
                      const isSelected = selectedCaseId === c.id;
                      const isChecked = selectedIds.has(c.id);
                      const inOfficial = isCaseInOfficial(c);
                      const caseModelCnt = (Array.isArray(c.messages) && c.messages.length > 0)
                        ? getMaxTurnModelInteractions(c.messages)
                        : (c.modelInteractionsCount ?? 0);
                      const scoreClass = c.valueScore >= 95 ? 'ed-score-100' : (c.valueScore >= 80 ? 'ed-score-high' : 'ed-score-mid');
                      return h('div', {
                        key: c.id,
                        className: `ed-case-card ${isSelected ? 'active' : ''}`,
                        onClick: () => setSelectedCaseId(c.id)
                      },
                        h('div', { className: 'ed-card-head' },
                          h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' } },
                            h('input', {
                              type: 'checkbox',
                              checked: isChecked,
                              onChange: e => toggleSelectOne(c.id, e)
                            }),
                            h('span', { className: `ed-score-badge ${scoreClass}` }, `${c.valueScore}分`),
                            h('span', { className: 'ed-category-tag' }, c.category),
                            (c.needsAttention || (c.maxTurnSteps || 0) > 100) && h('span', {
                              style: {
                                fontSize: '10px',
                                color: '#d97706',
                                background: 'rgba(217, 119, 6, 0.08)',
                                border: '1px solid rgba(217, 119, 6, 0.25)',
                                borderRadius: '4px',
                                padding: '1px 5px',
                                fontWeight: '600'
                              },
                              title: `单轮步骤数达 ${c.maxTurnSteps || 0} 步 (>100)，需关注`
                            }, c.attentionTag || '单轮高步数(需关注)'),
                            caseModelCnt >= 100 && h('span', {
                              className: 'ed-badcase-type-tag ed-badcase-type-tag-danger',
                              title: `单轮与模型交互峰值 ${caseModelCnt} 次 (达到 100 次上限)`
                            }, h(Glyph, { kind: 'alertTriangle', size: 11 }), BADCASE_LABEL_MODEL_LIMIT),
                            c.sampleRepetitions > 1 && h('span', {
                              style: {
                                fontSize: '10px',
                                color: 'var(--ed-text2)',
                                background: 'var(--ed-bg-layer2)',
                                border: '1px solid var(--ed-border1)',
                                borderRadius: '4px',
                                padding: '1px 5px',
                                fontWeight: '600'
                              },
                              title: `已去重合并 ${c.sampleRepetitions} 条相近或相同对话`
                            }, `去重 x${c.sampleRepetitions}`)
                          ),
                          h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px' } },
                            c.toolCallsCount > 0 && h('span', {
                              className: 'ed-ico-text',
                              style: { fontSize: '10px', color: 'var(--ed-accent)', fontWeight: '600', gap: '3px' }
                            }, h(Glyph, { kind: 'tool', size: 11 }), `${c.toolCallsCount}次工具`),
                            inOfficial && h('span', { className: 'ed-meta-chip' }, '已在正式集')
                          )
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
                  ] : (viewMode === 'badcases' ? [
                    filteredBadcases.length === 0 && !loading && h('div', { key: 'empty_bad', className: 'ed-empty-state' }, allBadcases.length ? '无匹配的 Badcase 用例' : '未发现 Badcase 缺陷记录'),
                    ...filteredBadcases.map(b => {
                      const isSelected = selectedBadcaseId === b.id;
                      const isChecked = selectedBadcaseIds.has(b.id);
                      const inOfficial = isCaseInOfficial(b);
                      const sevClass = b.severity === '严重' ? 'critical' : (b.severity === '高' ? 'high' : 'medium');
                      const cleanPhenomenon = (b.phenomenon || '').replace(/^[🚨🛑⚠️\s]+/, '');
                      const bm = getBadcaseCardMetrics(b);
                      const showStepExceededChip = bm.maxTurnModel >= 100 && b.badcaseTypeName !== BADCASE_LABEL_MODEL_LIMIT;
                      const hasSecondarySignals = (b.failedToolNames && b.failedToolNames.length > 0) || bm.maxTurnSteps > 100 || b.sampleRepetitions > 1;
                      return h('div', {
                        key: b.id,
                        className: `ed-case-card ${isSelected ? 'active' : ''}`,
                        onClick: () => setSelectedBadcaseId(b.id)
                      },
                        h('div', { className: 'ed-card-head', style: { alignItems: 'flex-start' } },
                          h('div', { style: { display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', flex: 1, minWidth: 0 } },
                            h('input', {
                              type: 'checkbox',
                              checked: isChecked,
                              onChange: e => toggleSelectOne(b.id, e)
                            }),
                            h('span', { className: `ed-severity-badge ed-severity-${sevClass}` }, b.severity),
                            h('span', {
                              className: `ed-badcase-type-tag ${b.badcaseTypeName === BADCASE_LABEL_MODEL_LIMIT ? 'ed-badcase-type-tag-danger' : ''}`
                            },
                              b.badcaseTypeName === BADCASE_LABEL_MODEL_LIMIT ? h(Glyph, { kind: 'alertTriangle', size: 11 }) : null,
                              b.badcaseTypeName
                            ),
                            b.toolFailuresCount > 0 && h('span', { className: 'ed-badcase-count-tag' }, `${b.toolFailuresCount}次报错`),
                            showStepExceededChip && h('span', {
                              className: 'ed-badcase-type-tag ed-badcase-type-tag-danger',
                              title: `单轮与模型交互峰值 ${bm.maxTurnModel} 次 (达到 100 次上限)`
                            }, h(Glyph, { kind: 'alertTriangle', size: 11 }), BADCASE_LABEL_MODEL_LIMIT)
                          ),
                          inOfficial && h('span', { className: 'ed-meta-chip' }, '已在正式集')
                        ),
                        h('div', { className: 'ed-card-title' }, b.title),
                        hasSecondarySignals && h('div', {
                          style: { display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }
                        },
                          ...(b.failedToolNames || []).map((ft, fidx) => h('span', {
                            key: `ft_${fidx}`,
                            style: {
                              fontSize: '10.5px',
                              padding: '1px 5px',
                              borderRadius: '3px',
                              background: 'rgba(239, 68, 68, 0.08)',
                              color: '#dc2626',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontWeight: '500'
                            }
                          }, h(Glyph, { kind: 'close', size: 10 }), ft)),
                          bm.maxTurnSteps > 100 && h('span', {
                            key: 'high_turn_tag',
                            style: {
                              fontSize: '10.5px',
                              color: '#d97706',
                              background: 'rgba(217, 119, 6, 0.08)',
                              border: '1px solid rgba(217, 119, 6, 0.25)',
                              borderRadius: '4px',
                              padding: '1px 5px',
                              fontWeight: '600',
                              whiteSpace: 'nowrap'
                            },
                            title: `单轮最高步骤数达 ${bm.maxTurnSteps} 步 (>100)，需关注`
                          }, `单轮最高 ${bm.maxTurnSteps} 步·需关注`),
                          b.sampleRepetitions > 1 && h('span', {
                            key: 'rep_tag',
                            style: {
                              fontSize: '10.5px',
                              color: 'var(--ed-text2)',
                              background: 'var(--ed-bg-layer2)',
                              border: '1px solid var(--ed-border1)',
                              borderRadius: '4px',
                              padding: '1px 5px',
                              whiteSpace: 'nowrap'
                            },
                            title: `已将 ${b.sampleRepetitions} 条相似或同类异常会话聚合去重`
                          }, `同类合并 ×${b.sampleRepetitions}`)
                        ),
                        h('div', { className: 'ed-badcase-card-desc' }, cleanPhenomenon),
                        h('div', {
                          className: 'ed-card-meta',
                          style: {
                            marginTop: '2px',
                            paddingTop: '6px',
                            borderTop: '1px dashed var(--ed-border1)',
                            gap: '8px'
                          }
                        },
                          h('span', {
                            style: { fontVariantNumeric: 'tabular-nums', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
                            title: `全会话共 ${bm.turnsCount} 轮 · 总计 ${bm.totalSteps} 步 · ${bm.toolCallsCount} 次工具调用`
                          }, `${bm.turnsCount} 轮 · 总 ${bm.totalSteps} 步${bm.toolCallsCount > 0 ? ` · ${bm.toolCallsCount} 工具` : ''}${b.modelId ? ` · ${b.modelId}` : ''}`),
                          h('span', { style: { flexShrink: 0, fontVariantNumeric: 'tabular-nums' } }, (b.createdAt || '').slice(11, 16))
                        )
                      );
                    })
                  ] : [
                    filteredOfficialCases.length === 0 && h('div', { key: 'empty_official', className: 'ed-empty-state', style: { padding: '24px 16px', textAlign: 'center' } },
                      h('div', { style: { fontSize: '13px', fontWeight: 600, color: 'var(--ed-text1)' } },
                        officialCases.length === 0 ? '正式评测集暂未收录用例' : '无匹配的正式评测集用例'
                      ),
                      h('div', { style: { fontSize: '11.5px', lineHeight: 1.5, maxWidth: '300px' } },
                        '在「提取评测用例」或「Badcase 回归集」勾选用例，然后点击列表上方的「选入正式评测集」。'
                      ),
                      officialCases.length === 0 && h('div', { style: { display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap', justifyContent: 'center' } },
                        h('button', {
                          className: 'ed-btn',
                          onClick: () => openView('cases')
                        }, '去挑选高价值用例'),
                        h('button', {
                          className: 'ed-btn',
                          onClick: () => openView('badcases')
                        }, '去挑选 Badcase'),
                        h('button', {
                          className: 'ed-btn ed-btn-official',
                          onClick: () => setNewOfficialModalOpen(true)
                        }, '+ 手动新增用例')
                      )
                    ),
                    ...filteredOfficialCases.map(oc => {
                      const isSelected = (activeOfficialCase && activeOfficialCase.id === oc.id);
                      const isChecked = selectedOfficialIds.has(oc.id);
                      const isBad = oc.sourceType === 'badcase';
                      const isManual = oc.sourceType === 'manual' || Boolean(oc.isManual && oc.sourceType !== 'badcase' && oc.sourceType !== 'case');
                      const prio = oc.priority || 'P1';
                      const matchedTasks = regressionTasks.filter(t => t.caseId === oc.id || (t.title === oc.title && t.prompt === oc.userPrompt));
                      const latestTask = matchedTasks[0] || null;
                      return h('div', {
                        key: oc.id,
                        className: `ed-case-card ${isSelected ? 'active' : ''}`,
                        onClick: () => {
                          setSelectedOfficialCaseId(oc.id);
                          setEditingOfficialCase(null);
                        }
                      },
                        h('div', { className: 'ed-card-head' },
                          h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' } },
                            h('input', {
                              type: 'checkbox',
                              checked: isChecked,
                              onChange: e => toggleSelectOne(oc.id, e)
                            }),
                            h('span', { className: `ed-prio-badge ed-prio-${prio}` }, prio),
                            h('span', {
                              className: `ed-source-badge ${isManual ? 'ed-source-manual' : (isBad ? 'ed-source-badcase' : 'ed-source-case')}`
                            },
                              h(Glyph, { kind: isManual ? 'edit' : (isBad ? 'alertTriangle' : 'target'), size: 11 }),
                              isManual ? '手动构建' : (isBad ? '缺陷回归' : '正向基准')
                            ),
                            h('span', { className: 'ed-category-tag' }, oc.category || oc.categoryName || oc.badcaseTypeName || '综合问答')
                          ),
                          h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px' } },
                            latestTask && h('span', {
                              className: `ed-reg-status-pill ed-reg-status-${latestTask.status}`,
                              style: { fontSize: '10px', padding: '1px 5px' }
                            },
                              latestTask.status === 'completed'
                                ? [h(Glyph, { key: 'i', kind: 'check', size: 10 }), '已回归']
                                : (latestTask.status === 'running'
                                  ? [h(Glyph, { key: 'i', kind: 'spinner', size: 10, className: 'ed-reg-spin' }), '回归中']
                                  : [h(Glyph, { key: 'i', kind: 'close', size: 10 }), '回归异常'])
                            ),
                            h('button', {
                              type: 'button',
                              className: 'ed-icon-btn',
                              style: { padding: '2px', color: 'var(--ed-text2)' },
                              title: '从正式评测集中移出',
                              onClick: e => {
                                e.stopPropagation();
                                handleRemoveOfficialCases([oc.id]);
                              }
                            }, h(Glyph, { kind: 'trash', size: 12 }))
                          )
                        ),
                        h('div', { className: 'ed-card-title' }, oc.title),
                        h('div', { className: 'ed-badcase-card-desc' }, oc.evalCriteria || oc.userPrompt),
                        h('div', { className: 'ed-card-meta', style: { marginTop: '2px' } },
                          h('span', null, `来源: ${oc.sourceDate || '手动'} (${oc.sourceEnv || 'prod'}) · ${oc.turnsCount || 1} 轮`),
                          h('span', null, `入库 ${(oc.addedAt || '').slice(5, 16).replace('T', ' ')}`)
                        )
                      );
                    })
                  ])
                )
              ),

              // Right Column: Detail Inspector
              h('div', { className: 'ed-detail-pane', 'aria-busy': viewMode !== 'official' && loading },
                viewMode !== 'official' && !visibleData ? (
                  h('div', { className: 'ed-empty-state' }, loading ? '正在加载评测数据…' : '暂无可查看的评测数据')
                ) : viewMode === 'sessions' ? (
                  !activeRawSession ? h('div', { className: 'ed-empty-state' }, '没有可查看的会话详情') : [
                    h('div', { key: 's_head', className: 'ed-detail-header' },
                      h('div', { className: 'ed-detail-title' },
                        h('h2', null, activeRawSession.title || activeRawSession.sessionId),
                        h('div', { className: 'ed-detail-sub' },
                          activeRawSession.runId && h('span', { className: 'ed-meta-chip' }, `run_id: ${activeRawSession.runId}`),
                          activeRawSession.threadId && h('span', { className: 'ed-meta-chip' }, `会话: ${activeRawSession.threadId}`),
                          ...((renderIdentityChips({
                            compId: activeRawSession.compId ?? activeRawSession.companyId,
                            userId: activeRawSession.userId
                          })) || []),
                          activeRawSession.execSteps !== undefined && h('span', { className: 'ed-meta-chip' }, `执行步骤: ${activeRawSession.execSteps} 步`),
                          activeRawSession.durationLabel && h('span', { className: 'ed-meta-chip' }, `执行耗时: ${activeRawSession.durationLabel}`),
                          activeRawSession.turnCount > 1 && h('span', { className: 'ed-meta-chip' }, `共 ${activeRawSession.turnCount} 轮`),
                          activeRawSession.createdAt && h('span', { className: 'ed-meta-chip' }, `创建时间: ${activeRawSession.createdAt}`)
                        )
                      )
                    ),
                    h('div', { key: 's_body', className: 'ed-detail-body' },
                      activeRawSession.messages && activeRawSession.messages.length > 0
                        ? h(ConversationTimeline, { key: 's_timeline', messages: activeRawSession.messages, scopeId: activeRawSession.id })
                        : h('div', { className: 'ed-empty-state' }, '该会话暂无消息记录')
                    )
                  ]
                ) : viewMode === 'cases' ? (
                  !activeCase ? h('div', { className: 'ed-empty-state' }, '没有可查看的评测用例详情') : [
                    // Detail Header
                    h('div', { key: 'head', className: 'ed-detail-header' },
                      h('div', { className: 'ed-detail-title' },
                        h('h2', null, activeCase.title),
                        h('div', { className: 'ed-detail-sub' },
                          activeCase.runId && h('span', {
                            className: 'ed-meta-chip',
                            style: {
                              fontFamily: 'ui-monospace, monospace',
                              fontSize: '11px',
                              cursor: 'pointer',
                              background: 'var(--ed-bg-layer2)',
                              color: 'var(--ed-text1)',
                              borderColor: 'var(--ed-border1)'
                            },
                            title: `点击复制完整 run_id: ${activeCase.runId}`,
                            onClick: () => copyToClipboard(activeCase.runId, 'run_id')
                          }, `run_id: ${activeCase.runId}`, copied === 'run_id' ? ' (已复制)' : ''),
                          activeCase.sessionId && h('span', {
                            className: 'ed-meta-chip',
                            style: {
                              fontFamily: 'ui-monospace, monospace',
                              fontSize: '11px',
                              cursor: 'pointer'
                            },
                            title: `点击复制完整 session_id: ${activeCase.sessionId}`,
                            onClick: () => copyToClipboard(activeCase.sessionId, 'session_id')
                          }, `会话: ${activeCase.sessionId}`, copied === 'session_id' ? ' (已复制)' : ''),
                          ...(renderIdentityChips(activeCase) || []),
                          h('span', { className: 'ed-meta-chip' }, `分类: ${activeCase.category}`),
                          h('span', { className: 'ed-meta-chip' }, `价值评分: ${activeCase.valueScore}分`),
                          h('span', { className: 'ed-meta-chip' }, `创建时间: ${activeCase.createdAt}`)
                        )
                      ),
                      h('button', {
                        className: 'ed-btn ed-btn-regression',
                        onClick: () => openRunRegressionModal([activeCase])
                      }, h(Glyph, { kind: 'rocket', size: 12 }), '发起回归测试')
                    ),

                    // Detail Tabs
                    h('div', { key: 'tabs', className: 'ed-tabs-row' },
                      h('button', {
                        className: `ed-tab-btn ${activeTab === 'case' ? 'active' : ''}`,
                        onClick: () => setActiveTab('case')
                      }, h(Glyph, { kind: 'clipboard', size: 13 }), '评测输入与标准答案'),
                      h('button', {
                        className: `ed-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`,
                        onClick: () => setActiveTab('timeline')
                      }, h(Glyph, { kind: 'chat', size: 13 }), `完整对话回放 (${(activeCase.messages || []).filter(m => !isFollowupMessage(m)).length})`)
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
                            }, h(Glyph, { kind: 'check', size: 11 }), r))
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
                        h(ConversationTimeline, { key: 'timeline', messages: activeCase.messages, scopeId: activeCase.id })
                      ]
                    )
                  ]
                ) : viewMode === 'badcases' ? (
                  !activeBadcase ? h('div', { className: 'ed-empty-state' }, '没有可查看的 Badcase 详情') : [
                    // Badcase Header
                    h('div', { key: 'b_head', className: 'ed-detail-header' },
                      h('div', { className: 'ed-detail-title' },
                        h('h2', null, activeBadcase.title),
                        h('div', { className: 'ed-meta-chips-row' },
                          h('span', { className: `ed-severity-badge ed-severity-${activeBadcase.severity === '严重' ? 'critical' : (activeBadcase.severity === '高' ? 'high' : 'medium')}` }, activeBadcase.severity),
                          h('span', {
                            className: `ed-badcase-type-tag ${activeBadcase.badcaseTypeName === BADCASE_LABEL_MODEL_LIMIT ? 'ed-badcase-type-tag-danger' : ''}`
                          },
                            activeBadcase.badcaseTypeName === BADCASE_LABEL_MODEL_LIMIT ? h(Glyph, { kind: 'alertTriangle', size: 11 }) : null,
                            activeBadcase.badcaseTypeName
                          ),
                          activeBadcase.toolFailuresCount > 0 && h('span', {
                            className: 'ed-meta-chip',
                            style: { color: '#dc2626', borderColor: 'rgba(220,38,38,0.25)', background: 'rgba(220,38,38,0.06)' }
                          }, h(Glyph, { kind: 'alertCircle', size: 12 }), `报错 ${activeBadcase.toolFailuresCount} 次`),
                          (() => {
                            const bm = getBadcaseCardMetrics(activeBadcase);
                            return [
                              h('span', {
                                key: 'total_steps',
                                className: 'ed-meta-chip',
                                title: '对话总步骤数 / 对话总轮次'
                              }, `总 ${bm.totalSteps} 步 / ${bm.turnsCount} 轮`),
                              h('span', {
                                key: 'max_model',
                                className: 'ed-meta-chip',
                                style: bm.maxTurnModel >= 100 ? { color: '#dc2626', borderColor: 'rgba(220,38,38,0.25)', background: 'rgba(220,38,38,0.06)' } : undefined
                              }, `单轮模型交互 ${bm.maxTurnModel} 次`),
                              bm.maxTurnSteps > 100 && h('span', {
                                key: 'max_steps',
                                className: 'ed-meta-chip',
                                style: { color: '#d97706', borderColor: 'rgba(217,119,6,0.25)', background: 'rgba(217,119,6,0.06)' }
                              }, `单轮最高 ${bm.maxTurnSteps} 步`)
                            ];
                          })(),
                          h('span', { className: 'ed-meta-chip' }, `模型: ${activeBadcase.modelId || 'M3.1'}`),
                          activeBadcase.runId && h('span', {
                            className: 'ed-meta-chip',
                            style: {
                              fontFamily: 'ui-monospace, monospace',
                              fontSize: '11px',
                              cursor: 'pointer',
                              background: 'var(--ed-bg-layer2)',
                              color: 'var(--ed-text1)',
                              borderColor: 'var(--ed-border1)'
                            },
                            title: `点击复制完整 run_id: ${activeBadcase.runId}`,
                            onClick: () => copyToClipboard(activeBadcase.runId, 'run_id')
                          }, `run_id: ${activeBadcase.runId}`, copied === 'run_id' ? ' (已复制)' : ''),
                          activeBadcase.sessionId && h('span', {
                            className: 'ed-meta-chip',
                            style: {
                              fontFamily: 'ui-monospace, monospace',
                              fontSize: '11px',
                              cursor: 'pointer'
                            },
                            title: `点击复制完整 session_id: ${activeBadcase.sessionId}`,
                            onClick: () => copyToClipboard(activeBadcase.sessionId, 'session_id')
                          }, `会话: ${activeBadcase.sessionId}`, copied === 'session_id' ? ' (已复制)' : ''),
                          ...(renderIdentityChips(activeBadcase) || []),
                          h('span', { className: 'ed-meta-chip' }, activeBadcase.createdAt || '')
                        )
                      ),
                      h('button', {
                        className: 'ed-btn ed-btn-regression',
                        onClick: () => openRunRegressionModal([activeBadcase])
                      }, h(Glyph, { kind: 'rocket', size: 12 }), '发起回归测试')
                    ),

                    // Badcase Tabs
                    h('div', { key: 'b_tabs', className: 'ed-tabs-row' },
                      h('button', {
                        className: `ed-tab-btn ${badcaseTab === 'diag' ? 'active' : ''}`,
                        onClick: () => setBadcaseTab('diag')
                      }, h(Glyph, { kind: 'search', size: 13 }), '诊断与归因分析报告'),
                      h('button', {
                        className: `ed-tab-btn ${badcaseTab === 'timeline' ? 'active' : ''}`,
                        onClick: () => setBadcaseTab('timeline')
                      }, h(Glyph, { kind: 'chat', size: 13 }), `完整对话回放 (${(activeBadcase.messages || []).filter(m => !isFollowupMessage(m)).length})`),
                      h('button', {
                        className: `ed-tab-btn ${badcaseTab === 'tools' ? 'active' : ''}`,
                        onClick: () => setBadcaseTab('tools')
                      }, h(Glyph, { kind: 'tool', size: 13 }), `工具调用统计 (${(activeBadcase.messages || []).filter(m => m.role === 'tool' || m.toolName).length})`)
                    ),

                    // Badcase Body
                    h('div', { key: 'b_body', className: 'ed-detail-body' },
                      badcaseTab === 'diag' ? [
                        // Unified Diagnostic Dossier Panel
                        h('div', { key: 'diag_panel', className: 'ed-diag-panel' },
                          // 1. Phenomenon
                          h('div', { className: 'ed-diag-section' },
                            h('div', { className: 'ed-diag-section-head' },
                              h('div', { className: 'ed-diag-section-title' },
                                h(Glyph, { kind: 'alertCircle', size: 14 }),
                                '1. 故障现象与触发点 (Phenomenon)'
                              ),
                              h('span', {
                                className: 'ed-diag-section-tag',
                                style: { background: 'rgba(220,38,38,0.08)', color: '#dc2626' }
                              }, activeBadcase.badcaseTypeName)
                            ),
                            h('div', { className: 'ed-diag-text' }, (activeBadcase.phenomenon || '').replace(/^[🚨🛑⚠️\s]+/, ''))
                          ),

                          // 2. Suspected Cause
                          h('div', { className: 'ed-diag-section' },
                            h('div', { className: 'ed-diag-section-head' },
                              h('div', { className: 'ed-diag-section-title' },
                                h(Glyph, { kind: 'filter', size: 14 }),
                                '2. 疑似根因归因 (Suspected Root Cause)'
                              ),
                              h('span', {
                                className: 'ed-diag-section-tag',
                                style: { background: 'var(--ed-bg-layer2)', color: 'var(--ed-text2)' }
                              }, '技术归因')
                            ),
                            h('div', { className: 'ed-diag-text' }, activeBadcase.suspectedCause)
                          ),

                          // Specific Failed Tools Table/Card (when available)
                          activeBadcase.failedToolDetails && activeBadcase.failedToolDetails.length > 0 && h('div', {
                            className: 'ed-diag-section',
                            style: { borderColor: 'rgba(239, 68, 68, 0.25)', background: 'rgba(239, 68, 68, 0.02)' }
                          },
                            h('div', { className: 'ed-diag-section-head' },
                              h('div', { className: 'ed-diag-section-title', style: { color: '#dc2626' } },
                                h(Glyph, { kind: 'alertCircle', size: 14 }),
                                `异常失败的具体工具清单 (${activeBadcase.failedToolDetails.length} 个)`
                              ),
                              h('span', {
                                className: 'ed-diag-section-tag',
                                style: { background: 'rgba(239,68,68,0.1)', color: '#dc2626' }
                              }, '明确工具名')
                            ),
                            h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' } },
                              activeBadcase.failedToolDetails.map((ftd, fidx) => h('div', {
                                key: fidx,
                                style: {
                                  background: 'var(--ed-bg-layer1)',
                                  border: '1px solid var(--ed-border1)',
                                  borderRadius: '6px',
                                  padding: '8px 12px'
                                }
                              },
                                h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' } },
                                  h('span', {
                                    className: 'ed-ico-text',
                                    style: {
                                      fontWeight: '650',
                                      fontSize: '12.5px',
                                      color: '#dc2626',
                                      fontFamily: 'ui-monospace, monospace'
                                    }
                                  }, h(Glyph, { kind: 'tool', size: 13 }), ftd.toolName),
                                  ftd.errorDetail && h('span', {
                                    style: {
                                      fontSize: '11px',
                                      color: '#b91c1c',
                                      background: 'rgba(239, 68, 68, 0.08)',
                                      padding: '1px 6px',
                                      borderRadius: '4px'
                                    }
                                  }, ftd.errorDetail)
                                ),
                                ftd.args && h('div', {
                                  style: {
                                    fontSize: '11.5px',
                                    color: 'var(--ed-text2)',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-all',
                                    maxHeight: '80px',
                                    overflowY: 'auto',
                                    background: 'var(--ed-bg-layer2)',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    marginTop: '4px',
                                    fontFamily: 'ui-monospace, monospace'
                                  }
                                }, `入参: ${typeof ftd.args === 'string' ? ftd.args : JSON.stringify(ftd.args)}`)
                              ))
                            )
                          ),

                          // 3. Remediation
                          h('div', { className: 'ed-diag-section' },
                            h('div', { className: 'ed-diag-section-head' },
                              h('div', { className: 'ed-diag-section-title' },
                                h(Glyph, { kind: 'tool', size: 14 }),
                                '3. 修复与优化建议 (Actionable Remediation)'
                              ),
                              h('span', {
                                className: 'ed-diag-section-tag',
                                style: { background: 'rgba(16,185,129,0.08)', color: '#059669' }
                              }, '推荐方案')
                            ),
                            h('div', { className: 'ed-diag-action-box' },
                              h('div', { className: 'ed-diag-action-text' }, activeBadcase.recommendation)
                            )
                          ),

                          // 4. Evidence
                          h('div', { className: 'ed-diag-section' },
                            h('div', { className: 'ed-diag-section-head' },
                              h('div', { className: 'ed-diag-section-title' },
                                h(Glyph, { kind: 'dataset', size: 14 }),
                                '4. 关键证据与报错触发信息 (Trigger Evidence)'
                              ),
                              h('button', {
                                className: 'ed-copy-btn',
                                onClick: () => copyToClipboard(activeBadcase.evidence, 'b_evidence')
                              }, copied === 'b_evidence' ? '已复制' : '复制证据')
                            ),
                            h('div', { className: 'ed-diag-evidence-terminal' },
                              h('div', { className: 'ed-diag-evidence-head' },
                                h('span', null, 'EXCEPTION_STACK / CONTEXT_PAYLOAD'),
                                h('span', null, `${(activeBadcase.evidence || '').length} 字符`)
                              ),
                              h('div', { className: 'ed-diag-evidence-code' }, activeBadcase.evidence || '（未记录具体证据信息）')
                            )
                          )
                        ),

                        // Section: User Prompt
                        h('div', { key: 'b_prompt', className: 'ed-section' },
                          h('div', { className: 'ed-section-head' },
                            h('h3', null, '用户原始提问 / 回归输入 (Instruction)'),
                            h('button', {
                              className: 'ed-copy-btn',
                              onClick: () => copyToClipboard(activeBadcase.userPrompt, 'b_prompt')
                            }, copied === 'b_prompt' ? '已复制' : '复制')
                          ),
                          h('div', { className: 'ed-code-box' }, activeBadcase.userPrompt)
                        ),

                        // Section: Assistant Response
                        h('div', { key: 'b_answer', className: 'ed-section' },
                          h('div', { className: 'ed-section-head' },
                            h('h3', null, '当前客服回复 / 异常记录'),
                            h('button', {
                              className: 'ed-copy-btn',
                              onClick: () => copyToClipboard(activeBadcase.referenceAnswer, 'b_ans')
                            }, copied === 'b_ans' ? '已复制' : '复制回复')
                          ),
                          h('div', { className: 'ed-answer-box' },
                            activeBadcase.referenceAnswer
                              ? h(MarkdownView, { content: activeBadcase.referenceAnswer })
                              : h('span', { style: { color: 'var(--ed-text2)', fontStyle: 'italic' } }, '（无回复或会话异常中断）')
                          )
                        )
                      ] : badcaseTab === 'timeline' ? [
                        // Badcase Timeline Replay
                        h(ConversationTimeline, { key: 'b_timeline', messages: activeBadcase.messages, scopeId: activeBadcase.id })
                      ] : [
                        // Badcase Tool Call Stats
                        h(ToolCallStatsPanel, { key: 'b_tools', messages: activeBadcase.messages })
                      ]
                    )
                  ]
                ) : (
                  // Official Evaluation Dataset Detail Inspector
                  !activeOfficialCase && officialCases.length > 0 ? (
                    h('div', { className: 'ed-empty-state' }, '没有可查看的正式用例，请调整筛选条件。')
                  ) : !activeOfficialCase ? (
                    h('div', { className: 'ed-empty-state', style: { gap: '12px' } },
                      h('div', {
                        style: {
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          background: 'rgba(5, 150, 105, 0.08)',
                          color: '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }
                      }, h(Glyph, { kind: 'pin', size: 24 })),
                      h('div', { style: { fontSize: '14px', fontWeight: 650, color: 'var(--ed-text1)' } }, '正式评测集详情与回归基准台'),
                      h('div', { style: { maxWidth: '420px', lineHeight: 1.6 } },
                        '请在左侧列表选择一条正式评测用例；或前往「高价值评测集」与「Badcase 诊断与回归集」挑选每日典型会话沉淀入库。'
                      ),
                      h('div', { style: { display: 'flex', gap: '8px', marginTop: '4px' } },
                        h('button', {
                          className: 'ed-btn ed-btn-official',
                          onClick: () => setNewOfficialModalOpen(true)
                        }, h(Glyph, { kind: 'plus', size: 12 }), '手动新增正式用例'),
                        h('button', {
                          className: 'ed-btn',
                          onClick: () => openView('cases')
                        }, '去高价值评测集挑选 →')
                      )
                    )
                  ) : (() => {
                    const isBadSource = activeOfficialCase.sourceType === 'badcase';
                    const isManualSource = activeOfficialCase.sourceType === 'manual' || Boolean(activeOfficialCase.isManual && activeOfficialCase.sourceType !== 'badcase' && activeOfficialCase.sourceType !== 'case');
                    const prio = activeOfficialCase.priority || 'P1';
                    const resolvedDetailCategory = activeOfficialCase.category || activeOfficialCase.categoryName || activeOfficialCase.badcaseTypeName || '综合问答';
                    const resolvedDetailSourceType = activeOfficialCase.sourceType === 'positive'
                      ? 'case'
                      : (activeOfficialCase.sourceType || (activeOfficialCase.isManual ? 'manual' : 'case'));
                    const officialToolList = Array.isArray(activeOfficialCase.toolNames) && activeOfficialCase.toolNames.length > 0
                      ? activeOfficialCase.toolNames
                      : (Array.isArray(activeOfficialCase.toolsUsed) ? activeOfficialCase.toolsUsed : []);
                    const matchedRegTasks = regressionTasks.filter(t =>
                      t.caseId === activeOfficialCase.id ||
                      t.title === activeOfficialCase.title ||
                      (t.prompt && activeOfficialCase.userPrompt && t.prompt.trim() === activeOfficialCase.userPrompt.trim())
                    );
                    const isEditing = editingOfficialCase && editingOfficialCase.id === activeOfficialCase.id;

                    return [
                      // Official Case Detail Header
                      h('div', { key: 'o_head', className: 'ed-detail-header' },
                        h('div', { className: 'ed-detail-title' },
                          h('h2', null, activeOfficialCase.title),
                          h('div', { className: 'ed-meta-chips-row' },
                            h('span', { className: `ed-prio-badge ed-prio-${prio}` }, `${prio} 级基准`),
                            h('span', {
                              className: `ed-source-badge ${isBadSource ? 'ed-source-badcase' : (isManualSource ? 'ed-source-manual' : 'ed-source-case')}`
                            },
                              h(Glyph, { kind: isBadSource ? 'alertTriangle' : (isManualSource ? 'edit' : 'target'), size: 11 }),
                              isBadSource ? '缺陷回归基准' : (isManualSource ? '手动构建基准' : '正向能力基准')
                            ),
                            h('span', { className: 'ed-category-tag' }, resolvedDetailCategory),
                            activeOfficialCase.sourceDate && h('span', { className: 'ed-meta-chip' }, `提取日期: ${activeOfficialCase.sourceDate}`),
                            activeOfficialCase.runId && h('span', {
                              className: 'ed-meta-chip',
                              style: {
                                fontFamily: 'ui-monospace, monospace',
                                fontSize: '11px',
                                cursor: 'pointer',
                                background: 'var(--ed-bg-layer2)',
                                color: 'var(--ed-text1)',
                                borderColor: 'var(--ed-border1)'
                              },
                              title: `点击复制完整 run_id: ${activeOfficialCase.runId}`,
                              onClick: () => copyToClipboard(activeOfficialCase.runId, 'run_id')
                            }, `run_id: ${activeOfficialCase.runId}`, copied === 'run_id' ? ' (已复制)' : ''),
                            activeOfficialCase.sessionId && h('span', {
                              className: 'ed-meta-chip',
                              style: {
                                fontFamily: 'ui-monospace, monospace',
                                fontSize: '11px',
                                cursor: 'pointer'
                              },
                              title: `点击复制完整 session_id: ${activeOfficialCase.sessionId}`,
                              onClick: () => copyToClipboard(activeOfficialCase.sessionId, 'session_id')
                            }, `会话: ${activeOfficialCase.sessionId}`, copied === 'session_id' ? ' (已复制)' : ''),
                            ...(renderIdentityChips(activeOfficialCase) || []),
                            activeOfficialCase.addedAt && h('span', { className: 'ed-meta-chip' }, `入库: ${(activeOfficialCase.addedAt || '').slice(0, 10)}`),
                            matchedRegTasks.length > 0 && h('span', {
                              className: 'ed-meta-chip',
                              style: { color: '#7c3aed', borderColor: 'rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.06)' }
                            }, h(Glyph, { kind: 'zap', size: 11 }), `已回归 ${matchedRegTasks.length} 次`)
                          )
                        ),
                        h('div', { className: 'ed-detail-actions' },
                          h('button', {
                            className: 'ed-btn ed-btn-regression',
                            onClick: () => openRunRegressionModal([activeOfficialCase])
                          }, h(Glyph, { kind: 'rocket', size: 12 }), '发起回归测试'),
                          h('button', {
                            className: 'ed-btn',
                            onClick: () => {
                              setOfficialTab('spec');
                              if (isEditing) {
                                setEditingOfficialCase(null);
                              } else {
                                setEditingOfficialCase({
                                  id: activeOfficialCase.id,
                                  title: activeOfficialCase.title || '',
                                  priority: activeOfficialCase.priority || 'P1',
                                  category: resolvedDetailCategory,
                                  sourceType: resolvedDetailSourceType,
                                  userPrompt: activeOfficialCase.userPrompt || '',
                                  evalCriteria: activeOfficialCase.evalCriteria || '',
                                  referenceAnswer: activeOfficialCase.referenceAnswer || '',
                                  notes: activeOfficialCase.notes || ''
                                });
                              }
                            }
                          }, h(Glyph, { kind: 'edit', size: 12 }), isEditing ? '取消编辑' : '编辑用例 / 判据'),
                          h('button', {
                            className: 'ed-btn',
                            style: { color: '#dc2626', borderColor: 'rgba(220,38,38,0.28)' },
                            onClick: () => handleRemoveOfficialCases([activeOfficialCase.id])
                          }, h(Glyph, { kind: 'trash', size: 12 }), '移出正式集')
                        )
                      ),

                      // Official Case Sub-Tabs
                      h('div', { key: 'o_tabs', className: 'ed-tabs-row' },
                        h('button', {
                          className: `ed-tab-btn ${officialTab === 'spec' ? 'active' : ''}`,
                          onClick: () => setOfficialTab('spec')
                        }, h(Glyph, { kind: 'clipboard', size: 13 }), '评测基准与通关判据'),
                        h('button', {
                          className: `ed-tab-btn ${officialTab === 'reg_history' ? 'active' : ''}`,
                          onClick: () => setOfficialTab('reg_history')
                        }, h(Glyph, { kind: 'zap', size: 13 }), `历史回归记录 (${matchedRegTasks.length})`),
                        Array.isArray(activeOfficialCase.messages) && activeOfficialCase.messages.length > 0 && h('button', {
                          className: `ed-tab-btn ${officialTab === 'timeline' ? 'active' : ''}`,
                          onClick: () => setOfficialTab('timeline')
                        }, h(Glyph, { kind: 'chat', size: 13 }), `原始完整对话回放 (${(activeOfficialCase.messages || []).filter(m => !isFollowupMessage(m)).length})`)
                      ),

                      // Official Case Detail Body
                      h('div', { key: 'o_body', className: 'ed-detail-body' },
                        officialTab === 'spec' ? (
                          isEditing ? [
                            // Inline Edit Form for Official Case
                            h('div', {
                              key: 'edit_form',
                              style: {
                                background: 'var(--ed-bg-layer1)',
                                border: '1px solid rgba(124, 58, 237, 0.35)',
                                borderRadius: '10px',
                                padding: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                              }
                            },
                              h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
                                h('span', { className: 'ed-ico-text', style: { fontSize: '13.5px', fontWeight: 700, color: '#7c3aed' } }, h(Glyph, { kind: 'edit', size: 14 }), '编辑正式评测用例与 Agent 能力通关判据'),
                                h('div', { style: { display: 'flex', gap: '8px' } },
                                  h('button', { className: 'ed-btn', onClick: () => setEditingOfficialCase(null) }, '取消'),
                                  h('button', { className: 'ed-btn ed-btn-official', onClick: handleSaveOfficialEdit }, h(Glyph, { kind: 'save', size: 12 }), '保存修改')
                                )
                              ),
                              h('div', { style: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '10px' } },
                                h('div', { className: 'ed-form-item', style: { marginBottom: 0 } },
                                  h('label', { className: 'ed-form-label-sub' }, '用例标题'),
                                  h('input', {
                                    className: 'ed-form-input',
                                    value: editingOfficialCase.title,
                                    onChange: e => setEditingOfficialCase(p => ({ ...p, title: e.target.value }))
                                  })
                                ),
                                h('div', { className: 'ed-form-item', style: { marginBottom: 0 } },
                                  h('label', { className: 'ed-form-label-sub' }, '回归优先级'),
                                  h('select', {
                                    className: 'ed-form-input',
                                    value: editingOfficialCase.priority,
                                    onChange: e => setEditingOfficialCase(p => ({ ...p, priority: e.target.value }))
                                  },
                                    h('option', { value: 'P0' }, 'P0 核心必测'),
                                    h('option', { value: 'P1' }, 'P1 重点回归'),
                                    h('option', { value: 'P2' }, 'P2 常规覆盖')
                                  )
                                ),
                                h('div', { className: 'ed-form-item', style: { marginBottom: 0 } },
                                  h('label', { className: 'ed-form-label-sub' }, '用例类型'),
                                  h('select', {
                                    className: 'ed-form-input',
                                    value: editingOfficialCase.sourceType,
                                    onChange: e => setEditingOfficialCase(p => ({ ...p, sourceType: e.target.value }))
                                  },
                                    h('option', { value: 'case' }, '正向能力基准'),
                                    h('option', { value: 'badcase' }, '缺陷回归基准'),
                                    h('option', { value: 'manual' }, '手动构建基准')
                                  )
                                ),
                                h('div', { className: 'ed-form-item', style: { marginBottom: 0 } },
                                  h('label', { className: 'ed-form-label-sub' }, '业务分类'),
                                  h('input', {
                                    className: 'ed-form-input',
                                    value: editingOfficialCase.category,
                                    onChange: e => setEditingOfficialCase(p => ({ ...p, category: e.target.value }))
                                  })
                                )
                              ),
                              h('div', { className: 'ed-form-item', style: { marginBottom: 0 } },
                                h('label', { className: 'ed-form-label-sub' }, '回归测试输入提问 (Prompt / Instruction)'),
                                h('textarea', {
                                  className: 'ed-form-input',
                                  rows: 3,
                                  style: { fontFamily: 'ui-monospace, monospace', resize: 'vertical' },
                                  value: editingOfficialCase.userPrompt,
                                  onChange: e => setEditingOfficialCase(p => ({ ...p, userPrompt: e.target.value }))
                                })
                              ),
                              h('div', { className: 'ed-form-item', style: { marginBottom: 0 } },
                                h('label', { className: 'ed-form-label-sub ed-ico-text' }, h(Glyph, { kind: 'target', size: 12 }), 'Agent 能力评价标准与通关判据 (Eval Criteria)'),
                                h('textarea', {
                                  className: 'ed-form-input',
                                  rows: 3,
                                  style: { resize: 'vertical' },
                                  placeholder: '定义该用例在日常回归测试中判定通过的核心要求（如：必须调用的工具、禁止出现的报错、关键回复要素）',
                                  value: editingOfficialCase.evalCriteria,
                                  onChange: e => setEditingOfficialCase(p => ({ ...p, evalCriteria: e.target.value }))
                                })
                              ),
                              h('div', { className: 'ed-form-item', style: { marginBottom: 0 } },
                                h('label', { className: 'ed-form-label-sub' }, '参考标准答案 / 期望输出 (Reference Answer)'),
                                h('textarea', {
                                  className: 'ed-form-input',
                                  rows: 6,
                                  style: { resize: 'vertical' },
                                  value: editingOfficialCase.referenceAnswer,
                                  onChange: e => setEditingOfficialCase(p => ({ ...p, referenceAnswer: e.target.value }))
                                })
                              )
                            )
                          ] : [
                            // 1. Agent Capability Evaluation Criteria Box
                            h('div', { key: 'o_criteria', className: 'ed-eval-criteria-box' },
                              h('div', { className: 'ed-eval-criteria-head' },
                                h('div', { className: 'ed-eval-criteria-title' },
                                  h(Glyph, { kind: 'target', size: 14 }),
                                  'Agent 能力评价标准与通关判据 (Evaluation Criteria)'
                                ),
                                h('button', {
                                  className: 'ed-copy-btn',
                                  onClick: () => setEditingOfficialCase({
                                    id: activeOfficialCase.id,
                                    title: activeOfficialCase.title || '',
                                    priority: activeOfficialCase.priority || 'P1',
                                    category: resolvedDetailCategory,
                                    sourceType: resolvedDetailSourceType,
                                    userPrompt: activeOfficialCase.userPrompt || '',
                                    evalCriteria: activeOfficialCase.evalCriteria || '',
                                    referenceAnswer: activeOfficialCase.referenceAnswer || '',
                                    notes: activeOfficialCase.notes || ''
                                  })
                                }, h(Glyph, { kind: 'edit', size: 11 }), '修改判据')
                              ),
                              h('div', { style: { fontSize: '13px', color: 'var(--ed-text1)', lineHeight: 1.65, whiteSpace: 'pre-wrap' } },
                                activeOfficialCase.evalCriteria || '验证 Agent 对该核心业务场景的意图理解、工具调用准确性与回复完整性。'
                              )
                            ),

                            // 2. User Prompt (Instruction)
                            h('div', { key: 'o_prompt', className: 'ed-section' },
                              h('div', { className: 'ed-section-head' },
                                h('h3', null, '回归测试输入提问 (Prompt / Instruction)'),
                                h('button', {
                                  className: 'ed-copy-btn',
                                  onClick: () => copyToClipboard(activeOfficialCase.userPrompt, 'o_prompt')
                                }, copied === 'o_prompt' ? '已复制' : '复制提问')
                              ),
                              h('div', { className: 'ed-code-box' }, activeOfficialCase.userPrompt)
                            ),

                            // 3. Tools Chain if present
                            officialToolList.length > 0 && h('div', { key: 'o_tools', className: 'ed-section' },
                              h('div', { className: 'ed-section-head' },
                                h('h3', null, `期望 / 关联工具调用链 (${officialToolList.length})`)
                              ),
                              h('div', { className: 'ed-card-tags' },
                                officialToolList.map(t => h('span', { key: t, className: 'ed-tool-tag' }, h(Glyph, { kind: 'tool', size: 11 }), t))
                              )
                            ),

                            // 4. Badcase Diagnostic Summary if from Badcase
                            (isBadSource || activeOfficialCase.phenomenon || activeOfficialCase.recommendation) && h('div', { key: 'o_diag', className: 'ed-diag-panel' },
                              activeOfficialCase.phenomenon && h('div', { className: 'ed-diag-section' },
                                h('div', { className: 'ed-diag-section-head' },
                                  h('div', { className: 'ed-diag-section-title' },
                                    h(Glyph, { kind: 'alertCircle', size: 14 }),
                                    '关联历史故障现象 (Historical Badcase Phenomenon)'
                                  ),
                                  activeOfficialCase.badcaseTypeName && h('span', {
                                    className: 'ed-diag-section-tag',
                                    style: { background: 'rgba(220,38,38,0.08)', color: '#dc2626' }
                                  }, activeOfficialCase.badcaseTypeName)
                                ),
                                h('div', { className: 'ed-diag-text' }, (activeOfficialCase.phenomenon || '').replace(/^[🚨🛑⚠️\s]+/, ''))
                              ),
                              activeOfficialCase.recommendation && h('div', { className: 'ed-diag-section' },
                                h('div', { className: 'ed-diag-section-head' },
                                  h('div', { className: 'ed-diag-section-title' },
                                    h(Glyph, { kind: 'tool', size: 14 }),
                                    '修复建议与回归验证要点 (Remediation Focus)'
                                  )
                                ),
                                h('div', { className: 'ed-diag-action-box' },
                                  h('div', { className: 'ed-diag-action-text' }, activeOfficialCase.recommendation)
                                )
                              )
                            ),

                            // 5. Reference Answer / Baseline Output
                            h('div', { key: 'o_answer', className: 'ed-section' },
                              h('div', { className: 'ed-section-head' },
                                h('h3', null, isBadSource ? '历史异常回复 / 改进前基线对照' : '标准参考回答 (Reference Answer Baseline)'),
                                h('button', {
                                  className: 'ed-copy-btn',
                                  onClick: () => copyToClipboard(activeOfficialCase.referenceAnswer, 'o_ans')
                                }, copied === 'o_ans' ? '已复制' : '复制参考答案')
                              ),
                              h('div', { className: 'ed-answer-box' },
                                activeOfficialCase.referenceAnswer
                                  ? h(MarkdownView, { content: activeOfficialCase.referenceAnswer })
                                  : h('span', { style: { color: 'var(--ed-text2)', fontStyle: 'italic' } }, '（暂未填写标准参考答案，可点击右上角「编辑用例 / 判据」补充）')
                              )
                            )
                          ]
                        ) : officialTab === 'reg_history' ? [
                          matchedRegTasks.length === 0 ? (
                            h('div', { key: 'no_reg', className: 'ed-empty-state', style: { padding: '48px 20px', gap: '10px' } },
                              h('div', { style: { fontSize: '13.5px', fontWeight: 600, color: 'var(--ed-text1)' } }, '该正式评测用例暂无回归执行记录'),
                              h('div', null, '点击下方按钮可立即针对预生产/测试环境发起真实对话回归验证，并与基准判据进行对照。'),
                              h('button', {
                                className: 'ed-btn ed-btn-regression',
                                style: { marginTop: '6px' },
                                onClick: () => openRunRegressionModal([activeOfficialCase])
                              }, h(Glyph, { kind: 'rocket', size: 12 }), '立即对该用例发起回归测试')
                            )
                          ) : (
                            h('div', { key: 'reg_list', style: { display: 'flex', flexDirection: 'column', gap: '14px' } },
                              matchedRegTasks.map((t) => {
                                const isRunning = t.status === 'running' || t.status === 'pending';
                                return h('div', {
                                  key: t.id,
                                  style: {
                                    border: '1px solid var(--ed-border1)',
                                    borderRadius: '10px',
                                    background: 'var(--ed-bg-layer1)',
                                    padding: '14px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px'
                                  }
                                },
                                  h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' } },
                                    h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
                                      h('span', { className: `ed-reg-status-pill ed-reg-status-${t.status}` },
                                        isRunning
                                          ? h(Glyph, { kind: 'spinner', size: 11, className: 'ed-reg-spin' })
                                          : (t.status === 'completed'
                                            ? h(Glyph, { kind: 'check', size: 11 })
                                            : (t.status === 'failed' ? h(Glyph, { kind: 'close', size: 11 }) : null)),
                                        t.status === 'completed' ? '回归完成' : (t.status === 'running' ? '正在执行' : (t.status === 'failed' ? '执行失败' : t.status))
                                      ),
                                      h('span', { className: 'ed-meta-chip' }, `环境: ${t.envName || t.env}`),
                                      t.durationMs > 0 && h('span', { className: 'ed-meta-chip' }, `耗时: ${(t.durationMs / 1000).toFixed(1)}s`),
                                      h('span', { className: 'ed-meta-chip' }, `时间: ${t.createdAt}`)
                                    ),
                                    h('button', {
                                      className: 'ed-btn',
                                      onClick: () => {
                                        setSelectedRegressionTaskId(t.id);
                                        setRegressionDrawerOpen(true);
                                      }
                                    }, '打开回归详情看板 →')
                                  ),
                                  t.error && h('div', { className: 'ed-ico-text', style: { color: '#dc2626', fontSize: '12px' } }, h(Glyph, { kind: 'alertTriangle', size: 13 }), `异常: ${t.error}`),
                                  h('div', { className: 'ed-reg-compare-grid' },
                                    h('div', { className: 'ed-reg-compare-col' },
                                      h('div', { className: 'ed-reg-compare-head' },
                                        h('span', { className: 'ed-ico-text', style: { color: '#059669' } }, h(Glyph, { kind: 'zap', size: 12 }), '回归实测输出 (Actual Output)')
                                      ),
                                      h('div', { className: 'ed-reg-compare-body', style: { maxHeight: '240px' } },
                                        t.answer ? h(MarkdownView, { content: t.answer }) : '（执行中或无输出）'
                                      )
                                    ),
                                    h('div', { className: 'ed-reg-compare-col' },
                                      h('div', { className: 'ed-reg-compare-head' },
                                        h('span', { className: 'ed-ico-text', style: { color: '#7c3aed' } }, h(Glyph, { kind: 'pin', size: 12 }), '正式评测集参考基准与通关判据')
                                      ),
                                      h('div', { className: 'ed-reg-compare-body', style: { maxHeight: '240px' } },
                                        activeOfficialCase.evalCriteria && h('div', {
                                          className: 'ed-ico-text',
                                          style: {
                                            padding: '6px 10px',
                                            marginBottom: '8px',
                                            borderRadius: '6px',
                                            background: 'rgba(124, 58, 237, 0.08)',
                                            fontSize: '12px',
                                            color: '#6d28d9',
                                            display: 'flex'
                                          }
                                        }, h(Glyph, { kind: 'target', size: 12 }), `判据: ${activeOfficialCase.evalCriteria}`),
                                        activeOfficialCase.referenceAnswer
                                          ? h(MarkdownView, { content: activeOfficialCase.referenceAnswer })
                                          : '（无参考标准答案）'
                                      )
                                    )
                                  )
                                );
                              })
                            )
                          )
                        ] : [
                          // Timeline Replay for Official Case
                          h(ConversationTimeline, { key: 'o_timeline', messages: activeOfficialCase.messages, scopeId: activeOfficialCase.id })
                        ]
                      )
                    ];
                  })()
                )
              )
            ),

            // 5. Environment & Key Configuration Modal
            showConfigModal && configEditing && h('div', {
              className: 'ed-modal-backdrop',
              onClick: () => setShowConfigModal(false)
            },
              h('div', {
                className: 'ed-modal',
                onClick: e => e.stopPropagation()
              },
                h('div', { className: 'ed-modal-header' },
                  h('h2', { className: 'ed-ico-text' }, h(Glyph, { kind: 'gear', size: 16 }), 'KuaiBuddy 环境与 Staff-Key 配置'),
                  h('button', {
                    style: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ed-text2)' },
                    'aria-label': '关闭环境配置',
                    onClick: () => setShowConfigModal(false)
                  }, h(Glyph, { kind: 'close', size: 16 }))
                ),
                h('div', { className: 'ed-modal-body' },
                  // Environment Accordion List
                  [
                    {
                      key: 'prod',
                      name: '生产环境 (Production)',
                      labelPrefix: '生产',
                      domain: 'kuaibuddy.kuaishang.cn',
                      dotClass: 'ed-env-dot-prod',
                      accentColor: 'var(--ed-success)',
                      tip: '调用生产客服会话与消息数据必填。'
                    },
                    {
                      key: 'preprod',
                      name: '预生产环境 (Pre-production)',
                      labelPrefix: '预生产',
                      domain: 'test-kuaibuddy.dingningtalk.com',
                      dotClass: 'ed-env-dot-preprod',
                      accentColor: '#8b5cf6',
                      tip: '预生产环境与生产环境共用同一数据库与 Staff Key，通常用于回归测试。留空时自动复用生产 Key。'
                    },
                    {
                      key: 'test',
                      name: '测试环境 (Test)',
                      labelPrefix: '测试',
                      domain: 'tkf-kuaibuddy.kuaishang.cn',
                      dotClass: 'ed-env-dot-test',
                      accentColor: 'var(--ed-warn)',
                      tip: '内部测试环境，默认 Key 为 198270-Test。'
                    },
                    {
                      key: 'dev',
                      name: '开发环境 (Dev)',
                      labelPrefix: '开发',
                      domain: 'dkf-kuaibuddy.kuaishang.cn',
                      dotClass: 'ed-env-dot-dev',
                      accentColor: 'var(--ed-accent)',
                      tip: '本地或开发测试集群环境。'
                    }
                  ].map(def => {
                    const envObj = configEditing.environments?.[def.key] || {};
                    const isActive = currentEnv === def.key;
                    const isExpanded = expandedEnv === def.key;
                    const keyFieldId = `${def.key}_key`;
                    const pwdFieldId = `${def.key}_pwd`;
                    const isKeyPlain = !!visibleFields[keyFieldId];
                    const isPwdPlain = !!visibleFields[pwdFieldId];

                    const hasKey = Boolean(envObj.key && envObj.key.trim());
                    let keyBadgeText = '未配置 Key';
                    let keyBadgeColor = 'var(--ed-text2)';
                    let keyBadgeBg = 'var(--ed-bg-layer2)';
                    if (def.key === 'preprod') {
                      keyBadgeText = hasKey ? '专属 Key' : '共用生产 Key';
                      keyBadgeColor = '#8b5cf6';
                      keyBadgeBg = 'rgba(139, 92, 246, 0.1)';
                    } else if (hasKey) {
                      keyBadgeText = 'Key 已配置';
                      keyBadgeColor = 'var(--ed-success)';
                      keyBadgeBg = 'rgba(0, 180, 42, 0.1)';
                    }

                    return h('div', {
                      key: def.key,
                      className: `ed-env-accordion-item ${isExpanded ? 'expanded' : ''}`
                    },
                      // Clickable Header Row
                      h('div', {
                        className: `ed-env-accordion-header ${isExpanded ? 'expanded' : ''}`,
                        onClick: () => setExpandedEnv(isExpanded ? null : def.key),
                        title: isExpanded ? '点击折叠' : '点击展开配置'
                      },
                        h('div', { className: 'ed-env-accordion-left' },
                          h('span', { className: `ed-env-dot ${def.dotClass}` }),
                          h('span', { style: { fontWeight: 650, fontSize: '13px' } }, def.name),
                          isActive && h('span', {
                            style: {
                              fontSize: '11px',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: 'var(--ed-bg-layer2)',
                              color: def.accentColor,
                              border: '1px solid var(--ed-border1)',
                              fontWeight: 600,
                              marginLeft: '2px'
                            }
                          }, '当前激活')
                        ),
                        h('div', { className: 'ed-env-accordion-right' },
                          h('span', {
                            style: {
                              fontSize: '11px',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              color: keyBadgeColor,
                              background: keyBadgeBg,
                              fontWeight: 550
                            }
                          }, keyBadgeText),
                          h('span', { style: { fontSize: '11px', color: 'var(--ed-text2)', fontFamily: 'ui-monospace, monospace' } }, def.domain),
                          h('span', { className: `ed-env-accordion-chevron ${isExpanded ? 'expanded' : ''}` },
                            h(Glyph, { kind: 'chevronDown', size: 14 })
                          )
                        )
                      ),

                      // Collapsible Body (Detailed Config Form)
                      isExpanded && h('div', { className: 'ed-env-accordion-body' },
                        // 1. URL
                        h('div', { className: 'ed-form-item', style: { marginBottom: '8px' } },
                          h('label', { className: 'ed-form-label-sub' }, '访问地址 (Web / API URL)'),
                          h('input', {
                            className: 'ed-form-input',
                            placeholder: `https://${def.domain}`,
                            value: envObj.url || '',
                            onChange: e => updateEnvField(def.key, 'url', e.target.value)
                          })
                        ),

                        // 2. Staff Key with Eye Toggle
                        h('div', { className: 'ed-form-item', style: { marginBottom: '8px' } },
                          h('label', { className: 'ed-form-label-sub' }, `${def.labelPrefix} X-Staff-Key`),
                          h('div', { className: 'ed-input-with-eye-wrap' },
                            h('input', {
                              type: isKeyPlain ? 'text' : 'password',
                              className: 'ed-form-input',
                              placeholder: def.key === 'preprod' ? '同生产环境 (留空时自动复用生产 Key)' : (def.key === 'test' ? '默认 198270-Test' : '请输入 X-Staff-Key'),
                              value: envObj.key || '',
                              onChange: e => updateEnvField(def.key, 'key', e.target.value)
                            }),
                            h('button', {
                              type: 'button',
                              className: 'ed-eye-btn',
                              onClick: () => toggleFieldVisible(keyFieldId),
                              title: isKeyPlain ? '点击隐藏明文' : '点击查看明文'
                            }, h(Glyph, { kind: isKeyPlain ? 'eye' : 'eyeOff', size: 14 }))
                          ),
                          def.tip && h('div', { className: 'ed-form-tip' }, def.tip)
                        ),

                        // 3. Login Credentials (CompanyId, Username, Password)
                        h('div', { className: 'ed-credentials-grid' },
                          h('div', { className: 'ed-credentials-title ed-ico-text' },
                            h(Glyph, { kind: 'user', size: 13 }),
                            '账号登录信息 (用于 E2E 回归测试 / 会话登录验证)'
                          ),
                          h('div', { className: 'ed-form-item', style: { marginBottom: 0 } },
                            h('label', { className: 'ed-form-label-sub' }, '公司 ID'),
                            h('input', {
                              className: 'ed-form-input',
                              placeholder: def.key === 'preprod' ? '232679' : (def.key === 'test' ? '198270' : '公司 ID'),
                              value: envObj.companyId || '',
                              onChange: e => updateEnvField(def.key, 'companyId', e.target.value)
                            })
                          ),
                          h('div', { className: 'ed-form-item', style: { marginBottom: 0 } },
                            h('label', { className: 'ed-form-label-sub' }, '登录账号'),
                            h('input', {
                              className: 'ed-form-input',
                              placeholder: def.key === 'preprod' ? 'testpro' : '用户名',
                              value: envObj.username || '',
                              onChange: e => updateEnvField(def.key, 'username', e.target.value)
                            })
                          ),
                          h('div', { className: 'ed-form-item', style: { marginBottom: 0 } },
                            h('label', { className: 'ed-form-label-sub' }, '登录密码'),
                            h('div', { className: 'ed-input-with-eye-wrap' },
                              h('input', {
                                type: isPwdPlain ? 'text' : 'password',
                                className: 'ed-form-input',
                                placeholder: '登录密码',
                                value: envObj.password || '',
                                onChange: e => updateEnvField(def.key, 'password', e.target.value)
                              }),
                              h('button', {
                                type: 'button',
                                className: 'ed-eye-btn',
                                onClick: () => toggleFieldVisible(pwdFieldId),
                                title: isPwdPlain ? '点击隐藏明文' : '点击查看明文'
                              }, h(Glyph, { kind: isPwdPlain ? 'eye' : 'eyeOff', size: 14 }))
                            )
                          )
                        )
                      )
                    );
                  })
                ),
                h('div', { className: 'ed-modal-footer' },
                  h('button', {
                    className: 'ed-btn',
                    disabled: savingConfig,
                    onClick: () => setShowConfigModal(false)
                  }, '取消'),
                  h('button', {
                    className: 'ed-btn',
                    disabled: savingConfig,
                    onClick: () => saveAndApplyConfig(false)
                  }, '仅保存配置'),
                  h('button', {
                    className: 'ed-btn ed-btn-primary',
                    disabled: savingConfig,
                    onClick: () => saveAndApplyConfig(true)
                  }, savingConfig ? '正在保存...' : '保存并立即拉取')
                )
              )
            ),

            // Modal: Run Regression Modal
            regressionModalOpen && h('div', { className: 'ed-modal-overlay', onClick: () => setRegressionModalOpen(false) },
              h('div', { className: 'ed-modal-content', style: { maxWidth: '560px' }, onClick: e => e.stopPropagation() },
                h('div', { className: 'ed-modal-header' },
                  h('h3', { className: 'ed-ico-text' }, h(Glyph, { kind: 'rocket', size: 15 }), `发起回归测试 (${regressionTargetCases.length} 条用例)`),
                  h('button', { className: 'ed-icon-btn', 'aria-label': '关闭回归测试弹窗', onClick: () => setRegressionModalOpen(false) }, h(Glyph, { kind: 'close', size: 14 }))
                ),
                h('div', { className: 'ed-modal-body', style: { maxHeight: '65vh' } },
                  // Case Summary
                  h('div', { className: 'ed-form-item' },
                    h('label', { className: 'ed-form-label' }, '待执行评测用例'),
                    regressionTargetCases.length === 1 ? (
                      h('div', { style: { background: 'var(--ed-bg-layer1)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--ed-border1)' } },
                        h('div', { style: { fontWeight: 650, fontSize: '13px', color: 'var(--ed-text1)', marginBottom: '4px' } }, regressionTargetCases[0].title),
                        h('div', { style: { fontSize: '11.5px', color: 'var(--ed-text2)', maxHeight: '70px', overflowY: 'auto', whiteSpace: 'pre-wrap' } }, regressionTargetCases[0].userPrompt || regressionTargetCases[0].prompt)
                      )
                    ) : (
                      h('div', { style: { background: 'var(--ed-bg-layer1)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--ed-border1)', fontSize: '12px', color: 'var(--ed-text2)' } },
                        h('div', { style: { marginBottom: '6px', color: 'var(--ed-text1)', fontWeight: '600' } }, `已选择 ${regressionTargetCases.length} 条用例将依次自动执行：`),
                        h('ul', { style: { margin: 0, paddingLeft: '18px', maxHeight: '120px', overflowY: 'auto' } },
                          regressionTargetCases.slice(0, 5).map((c, i) => h('li', { key: i, style: { marginBottom: '3px' } }, c.title)),
                          regressionTargetCases.length > 5 && h('li', { style: { color: 'var(--ed-text2)' } }, `... 等共 ${regressionTargetCases.length} 条`)
                        )
                      )
                    )
                  ),
                  // Environment selector
                  h('div', { className: 'ed-form-item' },
                    h('label', { className: 'ed-form-label' }, '选择目标执行环境'),
                    h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
                      [
                        { key: 'preprod', name: '预生产环境 (Pre-production)', tip: '推荐！与生产同库，使用独立客服账号，安全无污染' },
                        { key: 'test', name: '测试环境 (Test)', tip: '用于联调与测试验证' },
                        { key: 'dev', name: '开发环境 (Dev)', tip: '本地或开发测试集群环境' },
                        { key: 'prod', name: '生产环境 (Production)', tip: '注意：将在生产客服产生真实会话交互记录' }
                      ].map(envItem => {
                        const isSelected = regressionTargetEnv === envItem.key;
                        const envData = config?.environments?.[envItem.key];
                        return h('div', {
                          key: envItem.key,
                          onClick: () => setRegressionTargetEnv(envItem.key),
                          style: {
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: `1px solid ${isSelected ? 'var(--ed-accent)' : 'var(--ed-border1)'}`,
                            background: isSelected ? 'color-mix(in srgb, var(--ed-accent) 6%, var(--ed-bg-base))' : 'var(--ed-bg-layer1)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '3px'
                          }
                        },
                          h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
                            h('span', { style: { fontWeight: isSelected ? 650 : 500, fontSize: '13px', color: isSelected ? 'var(--ed-accent)' : 'var(--ed-text1)' } }, envItem.name),
                            h('span', { style: { fontSize: '11px', color: 'var(--ed-text2)' } }, envData?.url || '')
                          ),
                          h('div', { style: { fontSize: '11px', color: 'var(--ed-text2)' } },
                            envData?.username ? `使用账号: ${envData.username} (公司 ID: ${envData.companyId || '-'})` : '尚未在环境配置中填写登录账号密码',
                            ` · ${envItem.tip}`
                          )
                        );
                      })
                    )
                  )
                ),
                h('div', { className: 'ed-modal-footer' },
                  h('button', {
                    className: 'ed-btn',
                    disabled: submittingRegression,
                    onClick: () => setRegressionModalOpen(false)
                  }, '取消'),
                  h('button', {
                    className: 'ed-btn ed-btn-primary',
                    disabled: submittingRegression,
                    onClick: handleStartRegression
                  }, submittingRegression ? '正在发起...' : `▶ 立即发起回归 (${regressionTargetCases.length}条)`)
                )
              )
            ),

            // Modal/Drawer: Regression Execution Console
            regressionDrawerOpen && h('div', { className: 'ed-reg-drawer-overlay', onClick: () => setRegressionDrawerOpen(false) },
              h('div', { className: 'ed-reg-drawer-content', onClick: e => e.stopPropagation() },
                // Header
                h('div', { className: 'ed-reg-drawer-header' },
                  h('div', { className: 'ed-reg-drawer-title' },
                    h('h3', { className: 'ed-ico-text' }, h(Glyph, { kind: 'zap', size: 15 }), '对话回归测试进展看板'),
                    h('span', { className: 'ed-meta-chip' }, `总计 ${regressionTasks.length} 项`),
                    regressionTasks.some(t => t.status === 'running') && h('span', {
                      className: 'ed-reg-status-pill ed-reg-status-running'
                    }, h(Glyph, { kind: 'spinner', size: 11, className: 'ed-reg-spin' }), `${regressionTasks.filter(t => t.status === 'running').length} 运行中`),
                    h('span', { className: 'ed-reg-status-pill ed-reg-status-completed' }, h(Glyph, { kind: 'check', size: 11 }), `成功 ${regressionTasks.filter(t => t.status === 'completed').length}`),
                    regressionTasks.some(t => t.status === 'failed') && h('span', {
                      className: 'ed-reg-status-pill ed-reg-status-failed'
                    }, h(Glyph, { kind: 'close', size: 11 }), `失败 ${regressionTasks.filter(t => t.status === 'failed').length}`)
                  ),
                  h('div', { style: { display: 'flex', gap: '8px' } },
                    h('button', { className: 'ed-btn', onClick: loadRegressionTasks }, h(Glyph, { kind: 'refresh', size: 12 }), '刷新'),
                    h('button', { className: 'ed-btn', disabled: !regressionTasks.some(t => ['completed', 'failed', 'cancelled'].includes(t.status)), onClick: handleClearRegressionTasks }, '清空已结束'),
                    h('button', { className: 'ed-icon-btn', 'aria-label': '关闭回归测试进展', onClick: () => setRegressionDrawerOpen(false) }, h(Glyph, { kind: 'close', size: 14 }))
                  )
                ),
                // Body Split
                h('div', { className: 'ed-reg-body-split' },
                  // Left Task Sidebar
                  h('div', { className: 'ed-reg-sidebar' },
                    h('div', { className: 'ed-reg-sidebar-header' },
                      h('span', null, `执行队列 (${regressionTasks.length})`),
                      h('span', null, '按时间倒序')
                    ),
                    h('div', { className: 'ed-reg-task-list' },
                      regressionTasks.length === 0 ? (
                        h('div', { className: 'ed-empty-state', style: { padding: '40px 10px' } }, '暂无回归测试任务\n可在用例详情或列表中点击「发起回归测试」')
                      ) : (
                        regressionTasks.map(t => {
                          const isSelected = selectedRegressionTaskId === t.id;
                          let statusLabel = '排队中';
                          let statusClass = 'pending';
                          if (t.status === 'running') { statusLabel = '执行中'; statusClass = 'running'; }
                          else if (t.status === 'completed') { statusLabel = '已完成'; statusClass = 'completed'; }
                          else if (t.status === 'failed') { statusLabel = '失败'; statusClass = 'failed'; }
                          else if (t.status === 'cancelled') { statusLabel = '已取消'; statusClass = 'cancelled'; }

                          return h('div', {
                            key: t.id,
                            className: `ed-reg-task-card ${isSelected ? 'active' : ''}`,
                            onClick: () => setSelectedRegressionTaskId(t.id)
                          },
                            h('div', { className: 'ed-reg-card-head' },
                              h('span', { className: `ed-reg-status-pill ed-reg-status-${statusClass}` },
                                t.status === 'running' && h(Glyph, { kind: 'spinner', size: 11, className: 'ed-reg-spin' }),
                                statusLabel
                              ),
                              h('span', { style: { fontSize: '10.5px', color: 'var(--ed-text2)' } }, t.durationMs ? `${(t.durationMs / 1000).toFixed(1)}s` : (t.createdAt || '').slice(11, 16))
                            ),
                            h('div', { style: { fontSize: '12.5px', fontWeight: 600, color: 'var(--ed-text1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, t.title),
                            h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ed-text2)' } },
                              h('span', null, t.envName || t.env),
                              h('span', null, (t.createdAt || '').slice(11, 19))
                            )
                          );
                        })
                      )
                    )
                  ),
                  // Right Detail Inspector
                  (() => {
                    const activeTask = regressionTasks.find(t => t.id === selectedRegressionTaskId) || regressionTasks[0] || null;
                    if (!activeTask) {
                      return h('div', { className: 'ed-detail-pane', style: { display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ed-text2)' } },
                        '选择用例后发起回归测试，结果会显示在这里。'
                      );
                    }

                    const isRunning = activeTask.status === 'running' || activeTask.status === 'pending';

                    return h('div', { className: 'ed-reg-detail-pane' },
                      // Meta Box
                      h('div', { className: 'ed-reg-detail-meta' },
                        h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' } },
                          h('span', { className: `ed-reg-status-pill ed-reg-status-${activeTask.status}` },
                            isRunning && h(Glyph, { kind: 'spinner', size: 11, className: 'ed-reg-spin' }),
                            activeTask.status === 'running' ? '正在执行' : (activeTask.status === 'completed' ? '执行完成' : (activeTask.status === 'failed' ? '执行失败' : activeTask.status))
                          ),
                          h('span', { className: 'ed-meta-chip' }, `环境: ${activeTask.envName || activeTask.env}`),
                          activeTask.durationMs > 0 && h('span', { className: 'ed-meta-chip' }, `耗时: ${(activeTask.durationMs / 1000).toFixed(1)}s`),
                          activeTask.threadId && h('span', { className: 'ed-meta-chip' }, `会话: ${activeTask.threadId}`),
                          h('span', { className: 'ed-meta-chip' }, `时间: ${activeTask.createdAt}`)
                        ),
                        isRunning && h('button', {
                          className: 'ed-btn',
                          style: { color: '#f53f3f', borderColor: 'rgba(245,63,63,0.3)' },
                          onClick: () => handleCancelRegressionTask(activeTask.id)
                        }, h(Glyph, { kind: 'stop', size: 12 }), '中止执行')
                      ),

                      // Error Alert if failed
                      activeTask.error && h('div', {
                        style: {
                          background: 'rgba(245, 63, 63, 0.08)',
                          border: '1px solid rgba(245, 63, 63, 0.3)',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          color: '#f53f3f',
                          fontSize: '12.5px',
                          lineHeight: '1.5'
                        }
                      },
                        h('div', { className: 'ed-ico-text', style: { fontWeight: 600, marginBottom: '2px' } }, h(Glyph, { kind: 'alertTriangle', size: 13 }), '报错原因:'),
                        h('div', null, activeTask.error)
                      ),

                      // Section: User Prompt
                      h('div', { className: 'ed-section' },
                        h('div', { className: 'ed-section-head' },
                          h('h3', null, '回归输入提问 (Prompt / Instruction)'),
                          h('button', {
                            className: 'ed-copy-btn',
                            onClick: () => copyToClipboard(activeTask.prompt, 'reg_prompt')
                          }, copied === 'reg_prompt' ? '已复制' : '复制')
                        ),
                        h('div', { className: 'ed-code-box' }, activeTask.prompt)
                      ),

                      // Section: Reasoning Thinking Process (if present)
                      activeTask.reasoning && h('div', { className: 'ed-section' },
                        h('div', { className: 'ed-section-head', style: { cursor: 'pointer' }, onClick: () => setReasoningExpanded(p => !p) },
                          h('h3', { className: 'ed-ico-text' }, h(Glyph, { kind: 'brain', size: 13 }), `深度思考推理 (Thinking / CoT) · ${reasoningExpanded ? '收起 ▴' : '展开 ▾'}`),
                          h('button', {
                            className: 'ed-copy-btn',
                            onClick: (e) => { e.stopPropagation(); copyToClipboard(activeTask.reasoning, 'reg_reasoning'); }
                          }, copied === 'reg_reasoning' ? '已复制' : '复制思考')
                        ),
                        reasoningExpanded && h('div', {
                          className: 'ed-code-box',
                          style: { background: 'var(--ed-bg-layer2)', color: 'var(--ed-text2)', maxHeight: '200px' }
                        }, activeTask.reasoning)
                      ),

                      // Section: Output Answer vs Baseline Comparison
                      h('div', { className: 'ed-reg-compare-grid' },
                        // Column 1: New Regression Result
                        h('div', { className: 'ed-reg-compare-col' },
                          h('div', { className: 'ed-reg-compare-head' },
                            h('span', { className: 'ed-ico-text', style: { color: isRunning ? '#165dff' : '#00b42a' } },
                              isRunning ? [h(Glyph, { key: 'i', kind: 'zap', size: 12 }), '本次回归实时输出 (Streaming...)'] : [h(Glyph, { key: 'i', kind: 'check', size: 12 }), '本次回归交付结果']
                            ),
                            h('button', {
                              className: 'ed-copy-btn',
                              onClick: () => copyToClipboard(activeTask.answer, 'reg_ans')
                            }, copied === 'reg_ans' ? '已复制' : '复制')
                          ),
                          h('div', { className: 'ed-reg-compare-body' },
                            activeTask.answer
                              ? h(MarkdownView, { content: activeTask.answer })
                              : (isRunning
                                ? h('div', { style: { color: 'var(--ed-accent)', display: 'flex', alignItems: 'center', gap: '6px' } },
                                    h(Glyph, { kind: 'spinner', size: 13, className: 'ed-reg-spin' }),
                                    '模型正在思考推理并执行工具...'
                                  )
                                : h('div', { style: { color: 'var(--ed-text2)', fontStyle: 'italic' } }, '未生成文本输出')
                              )
                          )
                        ),
                        // Column 2: Historical Baseline / Reference
                        h('div', { className: 'ed-reg-compare-col' },
                          h('div', { className: 'ed-reg-compare-head' },
                            h('span', { className: 'ed-ico-text' }, h(Glyph, { kind: 'pin', size: 12 }), '历史参考基准 / 原始状态'),
                            activeTask.referenceAnswer && h('button', {
                              className: 'ed-copy-btn',
                              onClick: () => copyToClipboard(activeTask.referenceAnswer, 'base_ans')
                            }, copied === 'base_ans' ? '已复制' : '复制')
                          ),
                          h('div', { className: 'ed-reg-compare-body' },
                            activeTask.referenceAnswer
                              ? h(MarkdownView, { content: activeTask.referenceAnswer })
                              : h('div', { style: { color: 'var(--ed-text2)', fontStyle: 'italic' } }, '（无历史参考答案记录）')
                          )
                        )
                      )
                    );
                  })()
                )
              )
            ),

            // Modal: Manual Add Official Case Modal
            newOfficialModalOpen && h('div', { className: 'ed-modal-overlay', onClick: () => setNewOfficialModalOpen(false) },
              h('div', { className: 'ed-modal-content', style: { maxWidth: '640px' }, onClick: e => e.stopPropagation() },
                h('div', { className: 'ed-modal-header' },
                  h('h3', { className: 'ed-ico-text' }, h(Glyph, { kind: 'plus', size: 15 }), '手动新增正式评测集用例'),
                  h('button', { className: 'ed-icon-btn', 'aria-label': '关闭新增用例弹窗', onClick: () => setNewOfficialModalOpen(false) }, h(Glyph, { kind: 'close', size: 14 }))
                ),
                h('div', { className: 'ed-modal-body', style: { maxHeight: '70vh' } },
                  h('div', { style: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginBottom: '12px' } },
                    h('div', { className: 'ed-form-item', style: { marginBottom: 0 } },
                      h('label', { className: 'ed-form-label' }, '用例标题 (留空自动取提问前 45 字)'),
                      h('input', {
                        className: 'ed-form-input',
                        placeholder: '例如：查询当前开启状态的获联提醒规则',
                        value: newOfficialDraft.title,
                        onChange: e => setNewOfficialDraft(p => ({ ...p, title: e.target.value }))
                      })
                    ),
                    h('div', { className: 'ed-form-item', style: { marginBottom: 0 } },
                      h('label', { className: 'ed-form-label' }, '回归优先级'),
                      h('select', {
                        className: 'ed-form-input',
                        value: newOfficialDraft.priority,
                        onChange: e => setNewOfficialDraft(p => ({ ...p, priority: e.target.value }))
                      },
                        h('option', { value: 'P0' }, 'P0 核心必测'),
                        h('option', { value: 'P1' }, 'P1 重点回归'),
                        h('option', { value: 'P2' }, 'P2 常规覆盖')
                      )
                    ),
                    h('div', { className: 'ed-form-item', style: { marginBottom: 0 } },
                      h('label', { className: 'ed-form-label' }, '基准类型'),
                      h('select', {
                        className: 'ed-form-input',
                        value: newOfficialDraft.sourceType,
                        onChange: e => setNewOfficialDraft(p => ({ ...p, sourceType: e.target.value }))
                      },
                        h('option', { value: 'case' }, '正向能力基准'),
                        h('option', { value: 'badcase' }, '缺陷回归基准'),
                        h('option', { value: 'manual' }, '手动构建基准')
                      )
                    )
                  ),
                  h('div', { className: 'ed-form-item' },
                    h('label', { className: 'ed-form-label' }, '业务场景分类'),
                    h('input', {
                      className: 'ed-form-input',
                      placeholder: '例如：获联规则配置 / 线索与对话排查 / 通用业务咨询',
                      value: newOfficialDraft.category,
                      onChange: e => setNewOfficialDraft(p => ({ ...p, category: e.target.value }))
                    })
                  ),
                  h('div', { className: 'ed-form-item' },
                    h('label', { className: 'ed-form-label' }, '回归测试输入提问 (Prompt / Instruction) *'),
                    h('textarea', {
                      className: 'ed-form-input',
                      rows: 3,
                      placeholder: '输入日常回归测试时发送给 KuaiBuddy Agent 的测试指令...',
                      value: newOfficialDraft.userPrompt,
                      onChange: e => setNewOfficialDraft(p => ({ ...p, userPrompt: e.target.value }))
                    })
                  ),
                  h('div', { className: 'ed-form-item' },
                    h('label', { className: 'ed-form-label ed-ico-text' }, h(Glyph, { kind: 'target', size: 13 }), 'Agent 能力评价标准与通关判据 (Eval Criteria)'),
                    h('textarea', {
                      className: 'ed-form-input',
                      rows: 3,
                      placeholder: '例如：必须正确调用获联规则查询工具，不得出现连续报错，且准确列出已开启规则名称与 ID',
                      value: newOfficialDraft.evalCriteria,
                      onChange: e => setNewOfficialDraft(p => ({ ...p, evalCriteria: e.target.value }))
                    })
                  ),
                  h('div', { className: 'ed-form-item', style: { marginBottom: 0 } },
                    h('label', { className: 'ed-form-label' }, '参考标准答案 / 期望输出 (Reference Answer)'),
                    h('textarea', {
                      className: 'ed-form-input',
                      rows: 4,
                      placeholder: '可选：填写期望的标准回答，用于回归测试后双栏对比...',
                      value: newOfficialDraft.referenceAnswer,
                      onChange: e => setNewOfficialDraft(p => ({ ...p, referenceAnswer: e.target.value }))
                    })
                  )
                ),
                h('div', { className: 'ed-modal-footer' },
                  h('button', {
                    className: 'ed-btn',
                    onClick: () => setNewOfficialModalOpen(false)
                  }, '取消'),
                  h('button', {
                    className: 'ed-btn ed-btn-official',
                    onClick: handleCreateManualOfficialCase
                  }, h(Glyph, { kind: 'pin', size: 12 }), '确认加入正式评测集')
                )
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
