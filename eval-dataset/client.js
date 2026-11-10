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
  position: relative;
}

.ed-app * { box-sizing: border-box; }

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

/* Badcase Badges & Severity */
.ed-severity-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
  line-height: 1.3;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.ed-severity-critical {
  background: #fff0f0;
  border: 1px solid #ffccc7;
  color: #cf1322;
}
.ed-severity-high {
  background: #fff7e6;
  border: 1px solid #ffd591;
  color: #d46b08;
}
.ed-severity-medium {
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  color: #096dd9;
}
.ed-badcase-type-tag {
  font-size: 11px;
  padding: 2px 6px;
  background: var(--ed-bg-layer2);
  border: 1px solid var(--ed-border1);
  border-radius: 4px;
  color: var(--ed-text2);
}

/* Badcase Diagnostics */
.ed-diag-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}
.ed-diag-card {
  border-radius: 8px;
  padding: 12px 16px;
  background: var(--ed-bg-base);
  border: 1px solid var(--ed-border1);
  box-shadow: 0 1px 2px rgba(0,0,0,0.02);
}
.ed-diag-card-critical {
  border-left: 4px solid #f53f3f;
  background: #fffafa;
}
.ed-diag-card-high {
  border-left: 4px solid #ff7d00;
  background: #fffbf5;
}
.ed-diag-card-medium {
  border-left: 4px solid #1e80ff;
  background: #f7faff;
}
.ed-diag-card-success {
  border-left: 4px solid #00b42a;
  background: #f6fdf8;
}
.ed-diag-title {
  font-size: 12px;
  font-weight: 650;
  color: var(--ed-text1);
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}
.ed-diag-content {
  font-size: 12.5px;
  color: var(--ed-text1);
  line-height: 1.6;
}
.ed-diag-evidence {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11.5px;
  background: #fafafa;
  border: 1px solid var(--ed-border1);
  padding: 10px 12px;
  border-radius: 6px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 180px;
  overflow-y: auto;
  color: #cf1322;
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
        copy: 'M8 4v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.242a2 2 0 0 0-.602-1.43L16.08 2.57A2 2 0 0 0 14.65 2H10a2 2 0 0 0-2 2z',
        gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.4 1.4l1.6 1.2c.2.1.2.4.1.6l-1.5 2.6c-.1.2-.4.3-.6.2l-1.9-.8c-.4.3-.8.6-1.3.8l-.3 2c0 .2-.3.4-.5.4h-3c-.2 0-.5-.2-.5-.4l-.3-2c-.5-.2-.9-.5-1.3-.8l-1.9.8c-.2.1-.5 0-.6-.2l-1.5-2.6c-.1-.2 0-.5.1-.6l1.6-1.2c-.1-.5-.1-1 0-1.5l-1.6-1.2c-.2-.1-.2-.4-.1-.6l1.5-2.6c.1-.2.4-.3.6-.2l1.9.8c.4-.3.8-.6 1.3-.8l.3-2c0-.2.3-.4.5-.4h3c.2 0 .5.2.5.4l.3 2c.5.2.9.5 1.3.8l1.9-.8c.2-.1.5 0 .6.2l1.5 2.6c.1.2 0 .5-.1.6l-1.6 1.2c.1.5.1 1 0 1.5z',
        close: 'M18 6L6 18M6 6l12 12',
        chevronDown: 'M6 9l6 6 6-6',
        eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
        eyeOff: 'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24 M1 1l22 22',
        alertCircle: 'M12 8v4m0 4h.01M22 12A10 10 0 1 1 2 12a10 10 0 0 1 20 0z',
        target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm0-6a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
        tool: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z'
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
        h('path', { d: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2' }),
        h('rect', { x: 9, y: 3, width: 6, height: 4, rx: 1 }),
        h('path', { d: 'M9 12l2 2 4-4' }),
        h('path', { d: 'M9 17h6' })
      );
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register('evalDataset', 'zh', {
          '评测集': '评测集',
          'KuaiBuddy 评测集提取': 'KuaiBuddy 评测集提取'
        }));

        function detectBadcaseItem(c) {
          const messages = c.messages || [];
          const userMsgs = messages.filter(m => m.role === 'user');
          const assistantMsgs = messages.filter(m => m.role === 'assistant');
          const toolMsgs = messages.filter(m => m.role === 'tool' || m.toolName);

          if (userMsgs.length === 0 && !c.title) return null;
          const title = (c.title || '').replace(/<[^>]+>/g, '').trim();

          const failedToolMsgs = [];
          for (const tm of toolMsgs) {
            const text = tm.content || tm.toolResult || '';
            if (/(error|exception|failed|fail|timeout|timed out|超时|500|403|401|拒绝连接|连接失败|权限不足|ECONNREFUSED|ETIMEDOUT)/i.test(text)) {
              failedToolMsgs.push(tm);
            }
          }

          const isStepExceeded = messages.length >= 100 || toolMsgs.length >= 100;
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
          if (isStepExceeded) defectTags.push('步骤超过100步');
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
              return {
                id: `bad_${c.sessionId?.slice(-24) || c.id}`,
                sessionId: c.sessionId,
                title: c.title,
                badcaseType: t,
                badcaseTypeName: tn,
                severity: t === 'task_interrupted' ? '严重' : '高',
                defectTags: [tn],
                phenomenon: `会话明确指向异常诉求: "${title}"`,
                suspectedCause: '业务规则未触发、流程中断或配置覆盖冲突',
                recommendation: '检查工作流逻辑与提示词负向约束，纳入重点回归集',
                evidence: title,
                stepCount: messages.length,
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
            badcaseTypeName = '步骤超限/死循环';
            severity = '严重';
            phenomenon = `会话交互步数达到 ${messages.length} 步 (工具调用 ${toolMsgs.length} 次)，超过 100 步阈值，疑似死循环或推理未收敛`;
            suspectedCause = '智能体未设置步数熔断上限，或在连续重试动作中缺少退出/跳出收敛条件';
            recommendation = '增加任务单会话最大步数 Hard Limit 熔断截断机制（建议上限 50~80 步），防止死循环消耗资源并主动求助用户';
            evidence = `总交互步数: ${messages.length} 步 | 工具调用: ${toolMsgs.length} 次`;
          } else if (isFrequentToolFail) {
            const failedTools = [...new Set(failedToolMsgs.map(t => t.toolName || 'Tool'))];
            badcaseType = 'frequent_tool_failures';
            badcaseTypeName = '工具调用高频失败';
            severity = '严重';
            phenomenon = `单会话内工具调用累计失败 ${failedToolMsgs.length} 次（涉及工具: ${failedTools.join('、')}），工具链严重受阻`;
            suspectedCause = '外部依赖服务接口异常、权限凭证失效，或模型未能正确根据报错自我纠正入参 Schema 导致连续失败';
            recommendation = '引入工具调用断路器 (Circuit Breaker) 与连续失败回退机制；补齐工具入参的静态 Schema 校验与 Few-shot 样例';
            evidence = (failedToolMsgs[0].content || failedToolMsgs[0].toolResult || '').slice(0, 300);
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
          } else {
            const tm = failedToolMsgs[0];
            badcaseType = 'tool_error';
            badcaseTypeName = '工具调用异常';
            severity = '严重';
            phenomenon = `工具 [${tm.toolName || 'Tool'}] 调用执行失败或抛出异常`;
            suspectedCause = '工具接口入参格式不合规、接口超时或目标后台服务抛出 5xx/鉴权错误';
            recommendation = '在系统提示词增加参数格式示例校验，增加工具超时重试机制与降级策略';
            evidence = (tm.content || tm.toolResult || '').slice(0, 300);
          }

          return {
            id: `bad_${c.sessionId?.slice(-24) || c.id}`,
            sessionId: c.sessionId,
            title: c.title,
            badcaseType,
            badcaseTypeName,
            severity,
            defectTags,
            phenomenon,
            suspectedCause,
            recommendation,
            evidence,
            stepCount: messages.length,
            userPrompt: c.userPrompt,
            referenceAnswer: c.referenceAnswer,
            turnsCount: c.turnsCount || 1,
            toolCallsCount: c.toolCallsCount || 0,
            toolFailuresCount: failedToolMsgs.length,
            toolNames: c.toolNames || [],
            modelId: c.modelId,
            createdAt: c.createdAt,
            messages: messages
          };
        }

        function extractBadcasesFromCases(cases) {
          const rawBads = [];
          for (const c of cases) {
            const bad = detectBadcaseItem(c);
            if (bad) rawBads.push(bad);
          }
          // Deduplicate similar prompts
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
          const sevRank = { '严重': 3, '高': 2, '中': 1 };
          finalBads.sort((a, b) => (sevRank[b.severity] || 0) - (sevRank[a.severity] || 0));
          return finalBads;
        }

        function App() {
          const yesterdayStr = React.useMemo(() => {
            const d = new Date(Date.now() - 86400000);
            return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });
          }, []);

          const [date, setDate] = React.useState(yesterdayStr);
          const [currentEnv, setCurrentEnv] = React.useState('test');
          const [config, setConfig] = React.useState(null);
          const [showConfigModal, setShowConfigModal] = React.useState(false);
          const [configEditing, setConfigEditing] = React.useState(null);
          const [data, setData] = React.useState(null);
          const [loading, setLoading] = React.useState(true);
          const [savingConfig, setSavingConfig] = React.useState(false);
          const [error, setError] = React.useState('');
          const [selectedCategory, setSelectedCategory] = React.useState('全部');
          const [minScore, setMinScore] = React.useState(60);
          const [searchQuery, setSearchQuery] = React.useState('');
          const [viewMode, setViewMode] = React.useState('cases'); // 'cases' | 'badcases'
          const [selectedCaseId, setSelectedCaseId] = React.useState(null);
          const [selectedBadcaseId, setSelectedBadcaseId] = React.useState(null);
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

          const toggleFieldVisible = (fieldId) => {
            setVisibleFields(prev => ({ ...prev, [fieldId]: !prev[fieldId] }));
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

          // 1. Load configuration on startup
          const loadConfig = React.useCallback(async () => {
            // First read from localStorage if present
            let currentLocalCfg = null;
            try {
              const local = localStorage.getItem('kuaibuddy_eval_config');
              if (local) {
                currentLocalCfg = JSON.parse(local);
                setConfig(currentLocalCfg);
                if (currentLocalCfg.activeEnv) {
                  setCurrentEnv(currentLocalCfg.activeEnv);
                }
              }
            } catch (e) {}

            try {
              const res = await fetch('/api/eval-dataset?action=get_config');
              if (res.ok) {
                const cfg = await res.json();
                const merged = {
                  ...cfg,
                  activeEnv: currentLocalCfg?.activeEnv || cfg.activeEnv || 'prod',
                  environments: {
                    ...cfg.environments,
                    ...(currentLocalCfg?.environments || {})
                  }
                };
                if (cfg.environments.preprod) {
                  merged.environments.preprod = {
                    ...cfg.environments.preprod,
                    ...(currentLocalCfg?.environments?.preprod || {})
                  };
                }
                setConfig(merged);
                if (merged.activeEnv) {
                  setCurrentEnv(merged.activeEnv);
                }
              }
            } catch (e) {
              console.warn('获取配置失败:', e);
            }
          }, []);

          React.useEffect(() => {
            loadConfig();
          }, [loadConfig]);

          // 2. Load dataset
          const loadData = React.useCallback(async (force = false, envToUse = currentEnv) => {
            setLoading(true);
            setError('');
            try {
              const envData = config?.environments?.[envToUse];
              let effectiveKey = envData?.key;
              if (!effectiveKey && envToUse === 'preprod') {
                effectiveKey = config?.environments?.prod?.key;
              }
              const keyParam = effectiveKey ? `&staffKey=${encodeURIComponent(effectiveKey)}` : '';
              const urlParam = envData?.url ? `&apiUrl=${encodeURIComponent(envData.url)}` : '';
              const res = await fetch(`/api/eval-dataset?action=${force ? 'extract' : 'get_data'}&date=${date}&minScore=${minScore}&env=${envToUse}${keyParam}${urlParam}`);
              if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || `HTTP ${res.status}`);
              }
              const json = await res.json();
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
              setData(json);
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
              setError(err.message);
            } finally {
              setLoading(false);
            }
          }, [date, minScore, currentEnv, config]);

          React.useEffect(() => {
            loadData(false, currentEnv);
          }, [loadData, currentEnv]);

          // Handle environment switch
          const handleEnvChange = (newEnv) => {
            setCurrentEnv(newEnv);
            const envData = config?.environments?.[newEnv];
            if (newEnv === 'prod' && (!envData?.key || envData.key.trim() === '')) {
              openConfigModal(newEnv);
              return;
            }
            loadData(false, newEnv);
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

          const openConfigModal = () => {
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
              activeEnv: currentEnv,
              environments: JSON.parse(JSON.stringify(mergedEnvs))
            });
            setExpandedEnv(currentEnv);
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
              setConfig(saved);
              setShowConfigModal(false);
              if (triggerFetch) {
                loadData(true, currentEnv);
              }
            } catch (e) {
              alert(e.message);
            } finally {
              setSavingConfig(false);
            }
          };

          const summary = data?.summary || {
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

          const allCases = data?.cases || [];
          const allBadcases = data?.badcases || [];

          // Filtering Cases
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

          // Filtering Badcases
          const filteredBadcases = React.useMemo(() => {
            return allBadcases.filter(b => {
              if (selectedBadcaseType !== '全部' && b.badcaseTypeName !== selectedBadcaseType && b.badcaseType !== selectedBadcaseType) return false;
              if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTitle = (b.title || '').toLowerCase().includes(q);
                const matchPrompt = (b.userPrompt || '').toLowerCase().includes(q);
                const matchPhen = (b.phenomenon || '').toLowerCase().includes(q);
                const matchCause = (b.suspectedCause || '').toLowerCase().includes(q);
                const matchEvid = (b.evidence || '').toLowerCase().includes(q);
                if (!matchTitle && !matchPrompt && !matchPhen && !matchCause && !matchEvid) return false;
              }
              return true;
            });
          }, [allBadcases, selectedBadcaseType, searchQuery]);

          const activeCase = React.useMemo(() => {
            return allCases.find(c => c.id === selectedCaseId) || filteredCases[0] || null;
          }, [allCases, selectedCaseId, filteredCases]);

          const activeBadcase = React.useMemo(() => {
            return allBadcases.find(b => b.id === selectedBadcaseId) || filteredBadcases[0] || null;
          }, [allBadcases, selectedBadcaseId, filteredBadcases]);

          const copyToClipboard = (text, label) => {
            navigator.clipboard.writeText(text);
            setCopied(label);
            setTimeout(() => setCopied(''), 2000);
          };

          const copyBadcaseReport = (b) => {
            if (!b) return;
            const report = `# ⚠️ KuaiBuddy Badcase 诊断与归因分析报告

- **用例标题**: ${b.title}
- **用例编号**: ${b.id}
- **缺陷严重度**: ${b.severity}
- **主分类**: ${b.badcaseTypeName} (${b.badcaseType})
- **综合缺陷标签**: ${(b.defectTags || [b.badcaseTypeName]).join(' / ')}
- **交互步数**: ${b.stepCount || b.messages?.length || 0} 步
- **工具调用统计**: ${b.toolCallsCount || 0} 次 (报错 ${b.toolFailuresCount || 0} 次)
- **关联会话 ID**: ${b.sessionId}
- **模型版本**: ${b.modelId || 'MiniMax-M3.1-Flash'}
- **创建时间**: ${b.createdAt || 'N/A'}
${b.sampleRepetitions > 1 ? `- **同类聚合频次**: 出现 ${b.sampleRepetitions} 次\n` : ''}
---

### 🚨 1. 故障现象与触发点 (Phenomenon)
${b.phenomenon}

### 🔍 2. 疑似根因归因 (Suspected Root Cause)
${b.suspectedCause}

### 🛠 3. 修复与优化建议 (Actionable Remediation)
${b.recommendation}

### 📝 4. 关键证据与报错触发信息 (Trigger Evidence)
\`\`\`
${b.evidence}
\`\`\`

### 💬 5. 访客原始输入
> ${b.userPrompt}
`;
            copyToClipboard(report, 'badcase_report');
          };

          const handleExport = async (format) => {
            const isBadcaseMode = viewMode === 'badcases';
            const itemsToExport = isBadcaseMode
              ? allBadcases.filter(b => selectedBadcaseIds.has(b.id))
              : allCases.filter(c => selectedIds.has(c.id));

            if (itemsToExport.length === 0) {
              alert(`请至少勾选一条${isBadcaseMode ? 'Badcase 回归用例' : '评测用例'}`);
              return;
            }
            try {
              const res = await fetch('/api/eval-dataset?action=export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  format,
                  type: isBadcaseMode ? 'badcases' : 'cases',
                  items: itemsToExport
                })
              });
              const json = await res.json();
              const blob = new Blob([json.content], { type: 'text/plain;charset=utf-8' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              const prefix = isBadcaseMode ? 'kuaibuddy_badcase_regression' : 'kuaibuddy_eval';
              a.download = `${prefix}_${currentEnv}_${date}_${itemsToExport.length}cases.${format === 'alpaca' ? 'json' : format}`;
              a.click();
            } catch (err) {
              alert('导出失败: ' + err.message);
            }
          };

          const toggleSelectAll = () => {
            if (viewMode === 'cases') {
              if (selectedIds.size === filteredCases.length) {
                setSelectedIds(new Set());
              } else {
                setSelectedIds(new Set(filteredCases.map(c => c.id)));
              }
            } else {
              if (selectedBadcaseIds.size === filteredBadcases.length) {
                setSelectedBadcaseIds(new Set());
              } else {
                setSelectedBadcaseIds(new Set(filteredBadcases.map(b => b.id)));
              }
            }
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
            } else {
              setSelectedBadcaseIds(prev => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              });
            }
          };

          const categories = ['全部', ...Object.keys(summary.categoryBreakdown || {})];
          const badcaseCategories = ['全部', ...Object.keys(summary.badcaseBreakdown || {})];

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
                  // Environment selector (Custom Dropdown)
                  h('div', { className: 'ed-env-dropdown-wrapper', ref: envDropdownRef },
                    h('button', {
                      type: 'button',
                      className: `ed-env-trigger ${envMenuOpen ? 'open' : ''}`,
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
                    onClick: () => openConfigModal(currentEnv),
                    title: '配置环境地址与 Staff Key'
                  }, h(Glyph, { kind: 'gear', size: 13 }), '环境配置'),

                  // Date selector
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
                  // Refresh button
                  h('button', {
                    className: 'ed-btn',
                    disabled: loading,
                    onClick: () => loadData(true, currentEnv)
                  }, h(Glyph, { kind: 'refresh', size: 13 }), loading ? '正在提取...' : '重新提取'),
                  // Export buttons
                  h('button', {
                    className: 'ed-btn ed-btn-primary',
                    disabled: (viewMode === 'cases' ? selectedIds.size : selectedBadcaseIds.size) === 0,
                    onClick: () => handleExport('json')
                  }, h(Glyph, { kind: 'download', size: 13 }), viewMode === 'cases' ? `导出评测集 (${selectedIds.size})` : `导出 Badcase 回归集 (${selectedBadcaseIds.size})`),
                  h('button', {
                    className: 'ed-btn',
                    disabled: (viewMode === 'cases' ? selectedIds.size : selectedBadcaseIds.size) === 0,
                    onClick: () => handleExport('jsonl')
                  }, 'JSONL'),
                  h('button', {
                    className: 'ed-btn',
                    disabled: (viewMode === 'cases' ? selectedIds.size : selectedBadcaseIds.size) === 0,
                    onClick: () => handleExport('alpaca')
                  }, 'Alpaca')
                )
              ),

              // 2. Metrics Bar
              h('div', { className: 'ed-metrics' },
                h('div', { className: 'ed-metric-card' },
                  h('span', { className: 'ed-metric-label' }, `会话总量 (${data?.envName || (currentEnv === 'prod' ? '生产' : '测试')})`),
                  h('span', { className: 'ed-metric-val' }, summary.totalRawSessions),
                  h('span', { className: 'ed-metric-sub' }, `清洗排除脚本探测 ${summary.noiseFilteredOut} 条`)
                ),
                h('div', {
                  className: 'ed-metric-card',
                  style: { cursor: 'pointer' },
                  onClick: () => setViewMode('cases')
                },
                  h('span', { className: 'ed-metric-label' }, '🎯 提取评测用例'),
                  h('span', { className: 'ed-metric-val', style: { color: 'var(--ed-accent)' } }, summary.extractedCount),
                  h('span', { className: 'ed-metric-sub' }, '结构化去重 · 点击查看用例')
                ),
                h('div', {
                  className: 'ed-metric-card',
                  style: { cursor: 'pointer' },
                  onClick: () => setViewMode('badcases')
                },
                  h('span', { className: 'ed-metric-label' }, '⚠️ Badcase 回归集'),
                  h('span', { className: 'ed-metric-val', style: { color: '#cf1322' } }, summary.badcasesCount || allBadcases.length),
                  h('span', { className: 'ed-metric-sub' }, `已归因 ${Object.keys(summary.badcaseBreakdown || {}).length} 类缺陷 · 点击查看`)
                ),
                h('div', { className: 'ed-metric-card' },
                  h('span', { className: 'ed-metric-label' }, '🔧 工具调用场景'),
                  h('span', { className: 'ed-metric-val', style: { color: 'var(--ed-success)' } }, summary.withToolCallsCount),
                  h('span', { className: 'ed-metric-sub' }, '包含多步工具排障推理场景')
                )
              )
            ),

            // Mode Switcher Bar
            h('div', { className: 'ed-mode-bar' },
              h('div', { className: 'ed-mode-group' },
                h('button', {
                  className: `ed-mode-btn ${viewMode === 'cases' ? 'active' : ''}`,
                  onClick: () => setViewMode('cases')
                },
                  h(Glyph, { kind: 'target', size: 14 }),
                  '🎯 高价值评测集',
                  h('span', { className: 'ed-mode-badge ed-mode-badge-cases' }, allCases.length)
                ),
                h('button', {
                  className: `ed-mode-btn ${viewMode === 'badcases' ? 'active' : ''}`,
                  onClick: () => setViewMode('badcases')
                },
                  h(Glyph, { kind: 'alertCircle', size: 14 }),
                  '⚠️ Badcase 诊断与回归集',
                  h('span', { className: 'ed-mode-badge ed-mode-badge-badcase' }, allBadcases.length)
                )
              ),
              h('div', { style: { fontSize: '12px', color: 'var(--ed-text2)' } },
                viewMode === 'cases'
                  ? '💡 客服与 Agent 业务核心能力正向基准评测'
                  : '🚨 历史报错、规则失效与负反馈定向回归测试集'
              )
            ),

            // 3. Toolbar & Filters
            h('div', { className: 'ed-toolbar' },
              h('div', { className: 'ed-tags-group' },
                (viewMode === 'cases' ? categories : badcaseCategories).map(cat => h('button', {
                  key: cat,
                  className: `ed-tag-pill ${(viewMode === 'cases' ? selectedCategory : selectedBadcaseType) === cat ? 'active' : ''}`,
                  onClick: () => {
                    if (viewMode === 'cases') setSelectedCategory(cat);
                    else setSelectedBadcaseType(cat);
                  }
                }, cat === '全部'
                  ? `全部 (${viewMode === 'cases' ? allCases.length : allBadcases.length})`
                  : `${cat} (${(viewMode === 'cases' ? summary.categoryBreakdown : summary.badcaseBreakdown)[cat] || 0})`
                ))
              ),
              h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } },
                h('div', { className: 'ed-search-box' },
                  h(Glyph, { kind: 'filter', size: 12 }),
                  h('input', {
                    placeholder: viewMode === 'cases' ? '搜索评测标题、用户提问或工具...' : '搜索 Badcase 标题、现象、根因或关键证据...',
                    value: searchQuery,
                    onChange: e => setSearchQuery(e.target.value)
                  })
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
              h('span', null, `⚠️ ${error}`),
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
                  h('span', null, viewMode === 'cases' ? `用例列表 (${filteredCases.length})` : `Badcase 列表 (${filteredBadcases.length})`),
                  h('button', {
                    className: 'ed-copy-btn',
                    onClick: toggleSelectAll
                  }, (viewMode === 'cases' ? selectedIds.size === filteredCases.length : selectedBadcaseIds.size === filteredBadcases.length) ? '取消全选' : '全选')
                ),
                h('div', { className: 'ed-case-cards' },
                  viewMode === 'cases' ? [
                    filteredCases.length === 0 && !loading && h('div', { key: 'empty', className: 'ed-empty-state' }, '无匹配评测用例'),
                    ...filteredCases.map(c => {
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
                            h('span', { className: 'ed-category-tag' }, c.category),
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
                  ] : [
                    filteredBadcases.length === 0 && !loading && h('div', { key: 'empty_bad', className: 'ed-empty-state' }, '未发现 Badcase 缺陷记录'),
                    ...filteredBadcases.map(b => {
                      const isSelected = selectedBadcaseId === b.id;
                      const isChecked = selectedBadcaseIds.has(b.id);
                      const sevClass = b.severity === '严重' ? 'critical' : (b.severity === '高' ? 'high' : 'medium');
                      return h('div', {
                        key: b.id,
                        className: `ed-case-card ${isSelected ? 'active' : ''}`,
                        onClick: () => setSelectedBadcaseId(b.id)
                      },
                        h('div', { className: 'ed-card-head' },
                          h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' } },
                            h('input', {
                              type: 'checkbox',
                              checked: isChecked,
                              onChange: e => toggleSelectOne(b.id, e)
                            }),
                            h('span', { className: `ed-severity-badge ed-severity-${sevClass}` }, b.severity),
                            h('span', { className: 'ed-badcase-type-tag' }, b.badcaseTypeName),
                            b.stepCount >= 100 && h('span', {
                              style: {
                                fontSize: '10px',
                                color: '#cf1322',
                                background: '#fff1f0',
                                border: '1px solid #ffa39e',
                                borderRadius: '4px',
                                padding: '1px 5px',
                                fontWeight: '600'
                              }
                            }, `🚨 ${b.stepCount}步超限`),
                            b.toolFailuresCount >= 2 && h('span', {
                              style: {
                                fontSize: '10px',
                                color: '#d4380d',
                                background: '#fff2e8',
                                border: '1px solid #ffbb96',
                                borderRadius: '4px',
                                padding: '1px 5px',
                                fontWeight: '600'
                              }
                            }, `❌ 失败${b.toolFailuresCount}次`),
                            b.sampleRepetitions > 1 && h('span', {
                              style: {
                                fontSize: '10px',
                                color: '#c41d7f',
                                background: '#fff0f6',
                                border: '1px solid #ffd6e7',
                                borderRadius: '4px',
                                padding: '1px 5px',
                                fontWeight: '600'
                              },
                              title: `已聚合合并 ${b.sampleRepetitions} 条相近报错`
                            }, `合并 x${b.sampleRepetitions}`)
                          ),
                          b.toolCallsCount > 0 && h('span', {
                            style: { fontSize: '10px', color: 'var(--ed-warn)', fontWeight: '600' }
                          }, `🔧 ${b.toolCallsCount}次工具`)
                        ),
                        h('div', { className: 'ed-card-title' }, b.title),
                        h('div', { style: { fontSize: '11.5px', color: '#cf1322', marginTop: '2px', lineHeight: '1.4' } }, `🚨 ${b.phenomenon}`),
                        h('div', { className: 'ed-card-meta', style: { marginTop: '4px' } },
                          h('span', null, `${b.turnsCount} 轮提问 · ${b.stepCount || 0} 步交互 · ${b.modelId || 'M3.1'}`),
                          h('span', null, (b.createdAt || '').slice(11, 16))
                        )
                      );
                    })
                  ]
                )
              ),

              // Right Column: Detail Inspector
              h('div', { className: 'ed-detail-pane' },
                viewMode === 'cases' ? (
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
                ) : (
                  !activeBadcase ? h('div', { className: 'ed-empty-state' }, '请在左侧选择一个 Badcase 诊断用例') : [
                    // Badcase Header
                    h('div', { key: 'b_head', className: 'ed-detail-header' },
                      h('div', { className: 'ed-detail-title' },
                        h('h2', null, activeBadcase.title),
                        h('div', { className: 'ed-detail-sub', style: { flexWrap: 'wrap', gap: '8px' } },
                          h('span', { className: `ed-severity-badge ed-severity-${activeBadcase.severity === '严重' ? 'critical' : (activeBadcase.severity === '高' ? 'high' : 'medium')}` }, activeBadcase.severity),
                          h('span', { className: 'ed-badcase-type-tag' }, activeBadcase.badcaseTypeName),
                          ...(activeBadcase.defectTags || []).filter(t => t !== activeBadcase.badcaseTypeName).map((t, idx) => h('span', {
                            key: idx,
                            style: {
                              fontSize: '11px',
                              padding: '2px 6px',
                              background: '#fff1f0',
                              border: '1px solid #ffa39e',
                              borderRadius: '4px',
                              color: '#cf1322',
                              fontWeight: '550'
                            }
                          }, `⚠️ ${t}`)),
                          h('span', null, `ID: ${activeBadcase.id}`),
                          h('span', null, `会话: ${activeBadcase.sessionId}`),
                          h('span', null, `步数: ${activeBadcase.stepCount || activeBadcase.messages?.length || 0}步`),
                          activeBadcase.toolFailuresCount > 0 && h('span', { style: { color: '#cf1322', fontWeight: '600' } }, `报错: ${activeBadcase.toolFailuresCount}次`),
                          h('span', null, `时间: ${activeBadcase.createdAt}`)
                        )
                      ),
                      h('div', { style: { display: 'flex', gap: '8px' } },
                        h('button', {
                          className: 'ed-btn ed-btn-primary',
                          onClick: () => copyBadcaseReport(activeBadcase)
                        }, h(Glyph, { kind: 'copy', size: 12 }), copied === 'badcase_report' ? '已复制诊断报告' : '复制诊断归因报告'),
                        h('button', {
                          className: 'ed-btn',
                          onClick: () => copyToClipboard(JSON.stringify(activeBadcase, null, 2), 'badcase_json')
                        }, copied === 'badcase_json' ? '已复制 JSON' : '复制用例 JSON')
                      )
                    ),

                    // Badcase Tabs
                    h('div', { key: 'b_tabs', className: 'ed-tabs-row' },
                      h('button', {
                        className: `ed-tab-btn ${badcaseTab === 'diag' ? 'active' : ''}`,
                        onClick: () => setBadcaseTab('diag')
                      }, '🔍 诊断与归因分析报告'),
                      h('button', {
                        className: `ed-tab-btn ${badcaseTab === 'timeline' ? 'active' : ''}`,
                        onClick: () => setBadcaseTab('timeline')
                      }, `💬 完整对话回放 (${activeBadcase.messages.length})`)
                    ),

                    // Badcase Body
                    h('div', { key: 'b_body', className: 'ed-detail-body' },
                      badcaseTab === 'diag' ? [
                        // Diagnostic Cards
                        h('div', { key: 'diag_grid', className: 'ed-diag-grid' },
                          // 1. Phenomenon
                          h('div', { className: `ed-diag-card ed-diag-card-${activeBadcase.severity === '严重' ? 'critical' : 'high'}` },
                            h('div', { className: 'ed-diag-title' },
                              h(Glyph, { kind: 'alertCircle', size: 14 }),
                              '1. 故障现象与触发点 (Phenomenon)'
                            ),
                            h('div', { className: 'ed-diag-content' }, activeBadcase.phenomenon)
                          ),

                          // 2. Suspected Cause
                          h('div', { className: 'ed-diag-card ed-diag-card-high' },
                            h('div', { className: 'ed-diag-title' },
                              h(Glyph, { kind: 'filter', size: 14 }),
                              '2. 疑似根因归因 (Suspected Root Cause)'
                            ),
                            h('div', { className: 'ed-diag-content' }, activeBadcase.suspectedCause)
                          ),

                          // 3. Remediation
                          h('div', { className: 'ed-diag-card ed-diag-card-success' },
                            h('div', { className: 'ed-diag-title' },
                              h(Glyph, { kind: 'tool', size: 14 }),
                              '3. 修复与优化建议 (Actionable Remediation)'
                            ),
                            h('div', { className: 'ed-diag-content' }, activeBadcase.recommendation)
                          ),

                          // 4. Evidence
                          h('div', { className: 'ed-diag-card' },
                            h('div', { className: 'ed-diag-title' },
                              h(Glyph, { kind: 'dataset', size: 14 }),
                              '4. 关键证据与报错触发信息 (Trigger Evidence)'
                            ),
                            h('div', { className: 'ed-diag-evidence' }, activeBadcase.evidence)
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
                      ] : [
                        // Badcase Timeline Replay
                        h('div', { key: 'b_timeline', className: 'ed-msg-timeline' },
                          activeBadcase.messages.map((m, idx) => {
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
                  h('h2', null, '⚙️ KuaiBuddy 环境与 Staff-Key 配置'),
                  h('button', {
                    style: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ed-text2)' },
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
                          h('div', { className: 'ed-credentials-title' },
                            '👤 账号登录信息 (用于 E2E 回归测试 / 会话登录验证)'
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
