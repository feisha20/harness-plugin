window.__ModuleLoader__.load({
  id: '@local/colab-media-studio',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const API_BASE = '/api/colab-media-studio';

    const CSS = `
.cms-root {
  --cms-bg: var(--dsw-alias-bg-base);
  --cms-layer-1: var(--dsw-alias-bg-layer-1);
  --cms-layer-2: var(--dsw-alias-bg-layer-2);
  --cms-overlay: var(--dsw-alias-bg-overlay);
  --cms-border-1: var(--dsw-alias-border-l1);
  --cms-border-2: var(--dsw-alias-border-l2);
  --cms-brand: var(--dsw-alias-brand-primary);
  --cms-brand-soft: color-mix(in srgb, var(--cms-brand) 12%, transparent);
  --cms-brand-border: color-mix(in srgb, var(--cms-brand) 36%, transparent);
  --cms-text-1: var(--dsw-alias-label-primary);
  --cms-text-2: var(--dsw-alias-label-secondary);
  --cms-text-muted: color-mix(in srgb, var(--cms-text-2) 72%, transparent);
  --cms-success: var(--dsw-alias-state-success-primary);
  --cms-warn: var(--dsw-alias-state-warn-primary);
  --cms-error: var(--dsw-alias-state-error-primary);
  --cms-idle: var(--dsw-alias-state-idle-primary);
  --cms-shadow-sm: 0 1px 2px color-mix(in srgb, var(--cms-text-1) 6%, transparent);
  --cms-shadow-md: 0 6px 20px color-mix(in srgb, var(--cms-text-1) 10%, transparent);
  --cms-shadow-lg: 0 18px 48px color-mix(in srgb, var(--cms-text-1) 18%, transparent);
  --cms-radius-sm: var(--dsw-radius-sm, 6px);
  --cms-radius-md: var(--dsw-radius-md, 8px);
  --cms-radius-lg: var(--dsw-radius-lg, 12px);

  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--cms-bg);
  color: var(--cms-text-1);
  font: 13px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  box-sizing: border-box;
  font-variant-numeric: tabular-nums;
}

.cms-root * { box-sizing: border-box; }
.cms-root :focus-visible {
  outline: 2px solid var(--cms-brand);
  outline-offset: 2px;
}

/* Header */
.cms-header {
  padding: 14px 22px 12px;
  border-bottom: 1px solid var(--cms-border-1);
  background: var(--cms-layer-1);
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
}

.cms-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.cms-brand-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cms-brand-mark {
  width: 34px;
  height: 34px;
  border-radius: var(--cms-radius-md);
  display: grid;
  place-items: center;
  background: var(--cms-brand-soft);
  border: 1px solid var(--cms-brand-border);
  color: var(--cms-brand);
  flex-shrink: 0;
}

.cms-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.2px;
  color: var(--cms-text-1);
  line-height: 1.25;
}

.cms-subtitle {
  margin: 1px 0 0;
  font-size: 12px;
  color: var(--cms-text-2);
}

.cms-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.cms-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid var(--cms-border-1);
  background: var(--cms-bg);
  color: var(--cms-text-2);
}

.cms-status-pill.online {
  border-color: color-mix(in srgb, var(--cms-success) 38%, transparent);
  background: color-mix(in srgb, var(--cms-success) 10%, transparent);
  color: var(--cms-success);
}

.cms-status-pill.offline {
  border-color: color-mix(in srgb, var(--cms-warn) 35%, transparent);
  background: color-mix(in srgb, var(--cms-warn) 10%, transparent);
  color: var(--cms-warn);
}

.cms-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

/* Connection bar */
.cms-conn-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 8px 10px;
  border-radius: var(--cms-radius-md);
  border: 1px solid var(--cms-border-1);
  background: var(--cms-bg);
}

.cms-conn-url {
  flex: 1 1 260px;
  min-width: 200px;
}

.cms-conn-token {
  flex: 0 1 180px;
  min-width: 140px;
}

/* Tabs */
.cms-tabs-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.cms-tabs {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  border-radius: var(--cms-radius-md);
  background: var(--cms-layer-2);
  border: 1px solid var(--cms-border-1);
}

.cms-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: var(--cms-radius-sm);
  background: transparent;
  color: var(--cms-text-2);
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.cms-tab:hover {
  color: var(--cms-text-1);
}

.cms-tab[aria-selected="true"] {
  background: var(--cms-bg);
  color: var(--cms-text-1);
  font-weight: 600;
  box-shadow: var(--cms-shadow-sm);
}

.cms-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  background: var(--cms-brand-soft);
  color: var(--cms-brand);
}

/* Controls */
.cms-input, .cms-select, .cms-textarea {
  width: 100%;
  font-family: inherit;
  font-size: 12.5px;
  color: var(--cms-text-1);
  background: var(--cms-layer-1);
  border: 1px solid var(--cms-border-2);
  border-radius: var(--cms-radius-sm);
  padding: 6px 10px;
  transition: border-color 0.15s;
}

.cms-input, .cms-select {
  height: 32px;
}

.cms-textarea {
  min-height: 78px;
  resize: vertical;
  line-height: 1.5;
}

.cms-input:focus, .cms-select:focus, .cms-textarea:focus {
  outline: none;
  border-color: var(--cms-brand);
}

.cms-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border-radius: var(--cms-radius-sm);
  border: 1px solid var(--cms-border-2);
  background: var(--cms-layer-1);
  color: var(--cms-text-1);
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  text-decoration: none;
  transition: background 0.15s, border-color 0.15s, opacity 0.15s;
}

.cms-btn:hover:not(:disabled) {
  background: var(--cms-layer-2);
}

.cms-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.cms-btn-sm {
  height: 27px;
  padding: 0 9px;
  font-size: 12px;
}

.cms-btn-primary {
  background: var(--dsw-alias-button-primary-fill, var(--cms-brand));
  border-color: var(--dsw-alias-button-primary-fill, var(--cms-brand));
  color: var(--dsw-alias-label-primary-foreground, var(--cms-bg));
}

.cms-btn-primary:hover:not(:disabled) {
  background: var(--dsw-alias-button-primary-hover, color-mix(in srgb, var(--cms-brand) 86%, var(--cms-text-1)));
  border-color: var(--dsw-alias-button-primary-hover, color-mix(in srgb, var(--cms-brand) 86%, var(--cms-text-1)));
}

.cms-btn-ghost {
  background: transparent;
  border-color: transparent;
  color: var(--cms-text-2);
}

.cms-btn-ghost:hover:not(:disabled) {
  background: var(--cms-layer-2);
  color: var(--cms-text-1);
}

.cms-btn-danger {
  color: var(--cms-error);
  border-color: color-mix(in srgb, var(--cms-error) 35%, transparent);
}

/* Body & Workspace Split */
.cms-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 22px 24px;
}

.cms-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 12px;
  margin-bottom: 14px;
  border-radius: var(--cms-radius-md);
  border: 1px solid var(--cms-border-1);
  font-size: 12.5px;
}

.cms-banner.error {
  border-color: color-mix(in srgb, var(--cms-error) 40%, transparent);
  background: color-mix(in srgb, var(--cms-error) 10%, transparent);
  color: var(--cms-error);
}

.cms-banner.info {
  border-color: var(--cms-brand-border);
  background: var(--cms-brand-soft);
  color: var(--cms-text-1);
}

.cms-banner.success {
  border-color: color-mix(in srgb, var(--cms-success) 38%, transparent);
  background: color-mix(in srgb, var(--cms-success) 10%, transparent);
  color: var(--cms-success);
}

.cms-split {
  display: grid;
  grid-template-columns: minmax(320px, 460px) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

@media (max-width: 960px) {
  .cms-split {
    grid-template-columns: 1fr;
  }
}

.cms-card {
  background: var(--cms-layer-1);
  border: 1px solid var(--cms-border-1);
  border-radius: var(--cms-radius-lg);
  padding: 14px 16px;
  box-shadow: var(--cms-shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cms-card-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--cms-text-1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.cms-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.cms-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.cms-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--cms-text-2);
}

.cms-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.cms-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.cms-seg {
  display: inline-flex;
  padding: 2px;
  border-radius: var(--cms-radius-sm);
  background: var(--cms-layer-2);
  border: 1px solid var(--cms-border-1);
  gap: 2px;
}

.cms-seg-btn {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--cms-text-2);
  padding: 5px 10px;
  border-radius: calc(var(--cms-radius-sm) - 2px);
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.cms-seg-btn.active {
  background: var(--cms-bg);
  color: var(--cms-text-1);
  font-weight: 600;
  box-shadow: var(--cms-shadow-sm);
}

.cms-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cms-chip {
  padding: 4px 9px;
  border-radius: 999px;
  border: 1px solid var(--cms-border-1);
  background: var(--cms-bg);
  color: var(--cms-text-2);
  font-family: inherit;
  font-size: 11.5px;
  cursor: pointer;
}

.cms-chip:hover {
  border-color: var(--cms-brand-border);
  color: var(--cms-text-1);
}

.cms-chip.active {
  border-color: var(--cms-brand);
  background: var(--cms-brand-soft);
  color: var(--cms-brand);
  font-weight: 600;
}

/* Upload zone */
.cms-upload-box {
  border: 1px dashed var(--cms-border-2);
  border-radius: var(--cms-radius-md);
  background: var(--cms-bg);
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.cms-upload-thumb {
  width: 56px;
  height: 56px;
  border-radius: var(--cms-radius-sm);
  object-fit: cover;
  border: 1px solid var(--cms-border-1);
  flex-shrink: 0;
}

/* Stage / Output Preview */
.cms-stage {
  min-height: 440px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cms-stage-frame {
  border: 1px solid var(--cms-border-1);
  border-radius: var(--cms-radius-md);
  background: var(--cms-bg);
  min-height: 340px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  padding: 10px;
}

.cms-stage-media {
  max-width: 100%;
  max-height: 520px;
  border-radius: var(--cms-radius-sm);
  display: block;
}

.cms-empty-stage {
  text-align: center;
  padding: 28px 20px;
  color: var(--cms-text-2);
  max-width: 420px;
}

.cms-progress-wrap {
  padding: 10px 12px;
  border-radius: var(--cms-radius-md);
  border: 1px solid var(--cms-border-1);
  background: var(--cms-bg);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cms-progress-track {
  width: 100%;
  height: 7px;
  border-radius: 999px;
  background: var(--cms-layer-2);
  overflow: hidden;
}

.cms-progress-fill {
  height: 100%;
  background: var(--cms-brand);
  border-radius: 999px;
  transition: width 0.25s ease;
}

/* Gallery */
.cms-gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

.cms-gallery-card {
  background: var(--cms-layer-1);
  border: 1px solid var(--cms-border-1);
  border-radius: var(--cms-radius-md);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s;
}

.cms-gallery-card:hover {
  border-color: var(--cms-brand-border);
  transform: translateY(-1px);
}

.cms-gallery-thumb-wrap {
  aspect-ratio: 16 / 10;
  background: var(--cms-layer-2);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cms-gallery-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cms-kind-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  background: var(--cms-overlay);
  color: var(--cms-text-1);
  border: 1px solid var(--cms-border-1);
}

.cms-gallery-meta {
  padding: 9px 11px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cms-prompt-line {
  font-size: 12px;
  color: var(--cms-text-1);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 36px;
}

.cms-meta-sub {
  font-size: 11px;
  color: var(--cms-text-2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

/* Modal */
.cms-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: color-mix(in srgb, var(--cms-text-1) 45%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.cms-modal {
  width: min(860px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  background: var(--cms-overlay);
  border: 1px solid var(--cms-border-2);
  border-radius: var(--cms-radius-lg);
  box-shadow: var(--cms-shadow-lg);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Colab Guide */
.cms-steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.cms-step-card {
  padding: 12px 14px;
  border-radius: var(--cms-radius-md);
  border: 1px solid var(--cms-border-1);
  background: var(--cms-bg);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cms-step-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--cms-brand-soft);
  color: var(--cms-brand);
  font-size: 12px;
  font-weight: 700;
}

.cms-code-block {
  margin: 0;
  padding: 12px;
  border-radius: var(--cms-radius-md);
  border: 1px solid var(--cms-border-1);
  background: var(--cms-bg);
  color: var(--cms-text-1);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11.5px;
  line-height: 1.5;
  overflow-x: auto;
  max-height: 280px;
}

.cms-check-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 7px 10px;
  border-radius: var(--cms-radius-sm);
  border: 1px solid var(--cms-border-1);
  background: var(--cms-bg);
  cursor: pointer;
}
`;

    const ZH_DICT = {
      navLabel: 'Colab 影像工坊',
      title: 'Colab 影像工坊',
      subtitle: '连接 Google Colab Ultra 云端 ComfyUI · 支持文生图 / 图生图 / 文生视频 / 图生视频',
      tabImage: '生成图片',
      tabVideo: '生成视频',
      tabGallery: '作品库与队列',
      tabColab: 'Colab Ultra 部署向导',
      online: 'ComfyUI 已连接',
      offline: '未连接 ComfyUI',
      connectBtn: '连接并同步模型',
      connecting: '连接中…',
      saveConfig: '保存地址',
      howToGetUrl: '如何获取 Colab 地址？',
      urlPlaceholder: '粘贴 Colab 输出的地址，如 https://xxxx.trycloudflare.com 或 http://127.0.0.1:8188',
      tokenPlaceholder: '可选 Auth Token（无鉴权可留空）',
      tokenSaved: '已存密钥',
      t2i: '文生图',
      i2i: '图生图',
      t2v: '文生视频',
      i2v: '图生视频（首帧驱动）',
      presetLabel: '工作流引擎',
      presetSdCkpt: '标准 / FLUX 单文件 Checkpoint',
      presetFluxUnet: 'FLUX 分离加载（UNET + CLIP + VAE）',
      presetCustom: '自定义 API 工作流（JSON）',
      presetWan: 'Wan 2.1 / 2.2（推荐 · A100 高清）',
      presetLtx: 'LTX-Video（极速预览）',
      promptLabel: '正向提示词 (Prompt)',
      negativeLabel: '反向提示词 (Negative Prompt)',
      generateImage: '开始生成图片',
      generateVideo: '开始生成视频',
      submitting: '提交任务中…',
      uploadRef: '上传参考图',
      clearRef: '清除参考图',
      useAsVideoFrame: '以此图生成视频',
      reuseParams: '复用参数',
      download: '下载作品',
      deleteItem: '删除',
      cancelJob: '取消任务',
      close: '关闭',
      all: '全部',
      images: '图片',
      videos: '视频',
      searchPlaceholder: '搜索提示词或模型名称…',
      emptyGallery: '暂无已生成的本地作品，生成后的图片和视频会自动保存到这里。',
      downloadNotebook: '下载 Colab 笔记本 (.ipynb)',
      openColab: '打开 Google Colab',
      copyScript: '复制一键启动单元格代码',
      copied: '已复制到剪贴板',
      manualMode: '手动输入文件名',
      selectMode: '从已同步模型选择',
    };

    const EN_DICT = {
      navLabel: 'Colab media studio',
      title: 'Colab media studio',
      subtitle: 'Connect ComfyUI on Google Colab Ultra for image & video generation',
      tabImage: 'Image generation',
      tabVideo: 'Video generation',
      tabGallery: 'Gallery & queue',
      tabColab: 'Colab Ultra setup',
      online: 'ComfyUI connected',
      offline: 'ComfyUI disconnected',
      connectBtn: 'Connect & sync models',
      connecting: 'Connecting…',
      saveConfig: 'Save URL',
      howToGetUrl: 'How to get Colab URL?',
      urlPlaceholder: 'Paste Colab tunnel URL, e.g. https://xxxx.trycloudflare.com',
      tokenPlaceholder: 'Optional auth token',
      tokenSaved: 'Token saved',
      t2i: 'Text to image',
      i2i: 'Image to image',
      t2v: 'Text to video',
      i2v: 'Image to video',
      presetLabel: 'Workflow engine',
      presetSdCkpt: 'Standard / FLUX single checkpoint',
      presetFluxUnet: 'FLUX split (UNET + CLIP + VAE)',
      presetCustom: 'Custom API workflow (JSON)',
      presetWan: 'Wan 2.1 / 2.2 (Recommended · A100)',
      presetLtx: 'LTX-Video (Fast preview)',
      promptLabel: 'Prompt',
      negativeLabel: 'Negative prompt',
      generateImage: 'Generate image',
      generateVideo: 'Generate video',
      submitting: 'Submitting…',
      uploadRef: 'Upload reference image',
      clearRef: 'Clear image',
      useAsVideoFrame: 'Use as video first frame',
      reuseParams: 'Reuse parameters',
      download: 'Download',
      deleteItem: 'Delete',
      cancelJob: 'Cancel job',
      close: 'Close',
      all: 'All',
      images: 'Images',
      videos: 'Videos',
      searchPlaceholder: 'Search prompts or models…',
      emptyGallery: 'No archived media yet. Generated images and videos are saved here automatically.',
      downloadNotebook: 'Download Colab notebook (.ipynb)',
      openColab: 'Open Google Colab',
      copyScript: 'Copy launch script cell',
      copied: 'Copied to clipboard',
      manualMode: 'Enter filename manually',
      selectMode: 'Choose from synced models',
    };

    const IMAGE_RATIOS = [
      { label: '1:1 (1024×1024)', w: 1024, h: 1024 },
      { label: '16:9 (1344×768)', w: 1344, h: 768 },
      { label: '9:16 (768×1344)', w: 768, h: 1344 },
      { label: '4:3 (1152×896)', w: 1152, h: 896 },
      { label: '3:4 (896×1152)', w: 896, h: 1152 },
    ];

    const VIDEO_RATIOS = [
      { label: '横屏 480p (832×480)', w: 832, h: 480 },
      { label: '竖屏 480p (480×832)', w: 480, h: 832 },
      { label: '720p 高清 (1280×720)', w: 1280, h: 720 },
      { label: 'LTX 宽屏 (768×512)', w: 768, h: 512 },
    ];

    const VIDEO_DURATIONS = [
      { label: '2 秒 (33 帧)', frames: 33 },
      { label: '3 秒 (49 帧)', frames: 49 },
      { label: '5 秒 (81 帧)', frames: 81 },
    ];

    const QUICK_IMAGE_PROMPTS = [
      'A cinematic wide-angle portrait of a cyberpunk botanist inside a glowing glasshouse at dusk, volumetric mist, 8k photorealistic',
      'Minimalist isometric 3D studio render of a mechanical keyboard on warm oak wood, soft diffused lighting, crisp shadows',
      'Traditional Chinese ink wash mountain landscape blended with golden sunrise clouds, fine brushwork, gallery print',
    ];

    const QUICK_VIDEO_PROMPTS = [
      'Camera slowly pushes forward through a sunlit bamboo forest as morning mist drifts between trees, gentle breeze moving leaves, cinematic film grain',
      'A sleek silver sports car gliding along a coastal highway at sunset, ocean waves crashing against cliffs, dynamic aerial tracking shot',
      'Close-up slow motion of glowing bioluminescent jellyfish pulsing gracefully in deep sapphire ocean water, soft light rays',
    ];

    function SidebarIcon({ size = 20 }) {
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.7,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
        },
        h('rect', { x: 3, y: 4, width: 18, height: 16, rx: 3.5 }),
        h('path', { d: 'M10 9.5l5 2.5-5 2.5v-5z' }),
        h('path', { d: 'M17.5 2.5l.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6z' }),
      );
    }

    function mediaUrl(bucket, file, download = false) {
      const q = new URLSearchParams({ bucket, file });
      if (download) q.set('download', '1');
      return `${API_BASE}/media?${q.toString()}`;
    }

    async function apiJson(path, options = {}) {
      const res = await fetch(`${API_BASE}${path}`, options);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `请求失败 (${res.status})`);
      }
      return data;
    }

    function formatTime(iso) {
      if (!iso) return '';
      try {
        return new Date(iso).toLocaleString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch {
        return '';
      }
    }

    function statusLabel(status) {
      switch (status) {
        case 'queued':
          return '排队中';
        case 'running':
          return '生成中';
        case 'completed':
          return '已完成';
        case 'failed':
          return '失败';
        case 'cancelled':
          return '已取消';
        case 'interrupted':
          return '连接中断';
        default:
          return status || '';
      }
    }

    function ModelField({ label, value, onChange, options, placeholder, t }) {
      const list = Array.isArray(options) ? options : [];
      const [manual, setManual] = React.useState(list.length === 0);

      React.useEffect(() => {
        if (list.length > 0 && value && !list.includes(value)) {
          setManual(true);
        }
      }, [list.length, value]);

      return h(
        'div',
        { className: 'cms-field' },
        h(
          'div',
          { className: 'cms-label-row' },
          h('label', { className: 'cms-label' }, label),
          list.length > 0 &&
            h(
              'button',
              {
                type: 'button',
                className: 'cms-btn cms-btn-ghost cms-btn-sm',
                style: { height: 20, padding: '0 6px', fontSize: 11 },
                onClick: () => setManual((m) => !m),
              },
              manual ? t('selectMode') : t('manualMode'),
            ),
        ),
        !manual && list.length > 0
          ? h(
              'select',
              {
                className: 'cms-select',
                value: list.includes(value) ? value : '',
                onChange: (e) => onChange(e.target.value),
              },
              h('option', { value: '' }, `自动选择（当前共 ${list.length} 个）`),
              ...list.map((name) => h('option', { key: name, value: name }, name)),
            )
          : h('input', {
              className: 'cms-input',
              value,
              onChange: (e) => onChange(e.target.value),
              placeholder,
            }),
      );
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register('colabMediaStudio', 'zh', ZH_DICT));
        ctx.effect(() => ctx.locale.register('colabMediaStudio', 'en', EN_DICT));
        const t = ctx.locale.bind('colabMediaStudio');

        function App() {
          React.useSyncExternalStore(
            ctx.locale.subscribe.bind(ctx.locale),
            ctx.locale.getSnapshot.bind(ctx.locale),
          );

          const [tab, setTab] = React.useState('image');
          const [state, setState] = React.useState(null);
          const [loading, setLoading] = React.useState(true);
          const [banner, setBanner] = React.useState(null);

          // Connection config
          const [urlInput, setUrlInput] = React.useState('');
          const [tokenInput, setTokenInput] = React.useState('');
          const [connecting, setConnecting] = React.useState(false);

          // Image form
          const [imgMode, setImgMode] = React.useState('t2i');
          const [imgPreset, setImgPreset] = React.useState('sd_checkpoint');
          const [imgPrompt, setImgPrompt] = React.useState('');
          const [imgNegPrompt, setImgNegPrompt] = React.useState('');
          const [imgCkpt, setImgCkpt] = React.useState('flux1-schnell-fp8.safetensors');
          const [imgUnet, setImgUnet] = React.useState('');
          const [imgClip1, setImgClip1] = React.useState('clip_l.safetensors');
          const [imgClip2, setImgClip2] = React.useState('t5xxl_fp8_e4m3fn.safetensors');
          const [imgVae, setImgVae] = React.useState('ae.safetensors');
          const [imgLora, setImgLora] = React.useState('');
          const [imgLoraStrength, setImgLoraStrength] = React.useState(0.85);
          const [imgWidth, setImgWidth] = React.useState(1024);
          const [imgHeight, setImgHeight] = React.useState(1024);
          const [imgSteps, setImgSteps] = React.useState(4);
          const [imgCfg, setImgCfg] = React.useState(1.0);
          const [imgFluxGuidance, setImgFluxGuidance] = React.useState(3.5);
          const [imgSampler, setImgSampler] = React.useState('euler');
          const [imgScheduler, setImgScheduler] = React.useState('simple');
          const [imgSeed, setImgSeed] = React.useState(-1);
          const [imgBatch, setImgBatch] = React.useState(1);
          const [imgDenoise, setImgDenoise] = React.useState(0.65);
          const [imgRef, setImgRef] = React.useState(null); // { id, file, bucket, filename }
          const [imgCustomWorkflow, setImgCustomWorkflow] = React.useState('');
          const [imgSubmitting, setImgSubmitting] = React.useState(false);
          const [lastImgJobId, setLastImgJobId] = React.useState(null);

          // Video form
          const [vidMode, setVidMode] = React.useState('t2v');
          const [vidPreset, setVidPreset] = React.useState('wan_video');
          const [vidPrompt, setVidPrompt] = React.useState('');
          const [vidNegPrompt, setVidNegPrompt] = React.useState('');
          const [vidUnet, setVidUnet] = React.useState('wan2.1_t2v_1.3B_fp16.safetensors');
          const [vidCkpt, setVidCkpt] = React.useState('ltx-video-2b-v0.9.5.safetensors');
          const [vidClip, setVidClip] = React.useState('umt5_xxl_fp8_e4m3fn_scaled.safetensors');
          const [vidVae, setVidVae] = React.useState('wan_2.1_vae.safetensors');
          const [vidClipVision, setVidClipVision] = React.useState('clip_vision_h.safetensors');
          const [vidWidth, setVidWidth] = React.useState(832);
          const [vidHeight, setVidHeight] = React.useState(480);
          const [vidFrames, setVidFrames] = React.useState(49);
          const [vidFps, setVidFps] = React.useState(16);
          const [vidSteps, setVidSteps] = React.useState(25);
          const [vidCfg, setVidCfg] = React.useState(6.0);
          const [vidShift, setVidShift] = React.useState(8.0);
          const [vidSampler, setVidSampler] = React.useState('uni_pc');
          const [vidSeed, setVidSeed] = React.useState(-1);
          const [vidRef, setVidRef] = React.useState(null);
          const [vidCustomWorkflow, setVidCustomWorkflow] = React.useState('');
          const [vidSubmitting, setVidSubmitting] = React.useState(false);
          const [lastVidJobId, setLastVidJobId] = React.useState(null);

          // Gallery & Modal
          const [galleryFilter, setGalleryFilter] = React.useState('all');
          const [galleryQuery, setGalleryQuery] = React.useState('');
          const [selectedItem, setSelectedItem] = React.useState(null);

          // Colab Guide
          const [selectedPacks, setSelectedPacks] = React.useState(['flux_schnell', 'wan_t2v_1_3b']);
          const [mountDrive, setMountDrive] = React.useState(true);
          const [scriptPreview, setScriptPreview] = React.useState('');
          const [copied, setCopied] = React.useState(false);

          const refreshState = React.useCallback(async (syncUrl = false) => {
            try {
              const data = await apiJson('/state');
              setState(data);
              if (syncUrl && data?.config?.comfyUrl) {
                setUrlInput(data.config.comfyUrl);
              }
            } catch (err) {
              setBanner({ type: 'error', text: err.message });
            } finally {
              setLoading(false);
            }
          }, []);

          React.useEffect(() => {
            void refreshState(true);
          }, [refreshState]);

          // Auto-poll ONLY while jobs are active
          const jobs = state?.jobs || [];
          const hasActiveJobs = jobs.some((j) => j.status === 'queued' || j.status === 'running');
          React.useEffect(() => {
            if (!hasActiveJobs) return undefined;
            const timer = setInterval(() => {
              void refreshState(false);
            }, 2000);
            return () => clearInterval(timer);
          }, [hasActiveJobs, refreshState]);

          // Close modal on Escape
          React.useEffect(() => {
            if (!selectedItem) return undefined;
            const onKey = (e) => {
              if (e.key === 'Escape') setSelectedItem(null);
            };
            window.addEventListener('keydown', onKey);
            return () => window.removeEventListener('keydown', onKey);
          }, [selectedItem]);

          // Sync notebook preview script when Colab tab is active
          React.useEffect(() => {
            if (tab !== 'colab') return undefined;
            const q = new URLSearchParams({
              packs: selectedPacks.join(','),
              mountDrive: mountDrive ? '1' : '0',
              preview: '1',
            });
            apiJson(`/notebook?${q.toString()}`)
              .then((res) => setScriptPreview(res.script || ''))
              .catch(() => {});
            return undefined;
          }, [tab, selectedPacks, mountDrive]);

          const capabilities = state?.lastCapabilities || null;
          const models = capabilities?.models || {};
          const gallery = state?.gallery || [];

          async function handleSaveConfig(silent = false) {
            const payload = { comfyUrl: urlInput };
            if (tokenInput.trim()) {
              payload.authToken = tokenInput.trim();
            }
            const res = await apiJson('/config', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            if (tokenInput.trim()) setTokenInput('');
            await refreshState(false);
            if (!silent) {
              setBanner({ type: 'success', text: '连接配置已保存' });
            }
            return res;
          }

          async function handleConnect() {
            setConnecting(true);
            setBanner(null);
            try {
              await handleSaveConfig(true);
              const res = await apiJson('/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comfyUrl: urlInput }),
              });
              await refreshState(false);
              const dev = res.capabilities?.system?.deviceName || 'ComfyUI';
              const vram = res.capabilities?.system?.vramTotalGb
                ? ` · ${res.capabilities.system.vramTotalGb}GB VRAM`
                : '';
              setBanner({
                type: 'success',
                text: `连接成功：${dev}${vram}，已同步 ${res.capabilities?.models?.checkpoints?.length || 0} 个 Checkpoint、${res.capabilities?.models?.unets?.length || 0} 个 UNET 模型`,
              });
            } catch (err) {
              setBanner({ type: 'error', text: err.message });
            } finally {
              setConnecting(false);
            }
          }

          async function handleClearToken() {
            try {
              await apiJson('/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ authToken: '' }),
              });
              await refreshState(false);
              setBanner({ type: 'info', text: '已清除保存的 Auth Token' });
            } catch (err) {
              setBanner({ type: 'error', text: err.message });
            }
          }

          async function handleUploadFile(file, setter) {
            if (!file) return;
            setBanner(null);
            const reader = new FileReader();
            reader.onload = async () => {
              try {
                const res = await apiJson('/upload', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    filename: file.name,
                    mimeType: file.type || 'image/png',
                    dataBase64: reader.result,
                  }),
                });
                setter({
                  id: res.upload.id,
                  bucket: 'uploads',
                  file: res.upload.localFile,
                  filename: res.upload.filename,
                });
              } catch (err) {
                setBanner({ type: 'error', text: err.message });
              }
            };
            reader.readAsDataURL(file);
          }

          async function handleGenerateImage(e) {
            e.preventDefault();
            setBanner(null);
            setImgSubmitting(true);
            try {
              const payload = {
                kind: 'image',
                preset: imgPreset,
                prompt: imgPrompt,
                negativePrompt: imgNegPrompt,
                ckptName: imgCkpt,
                unetName: imgUnet,
                clipName1: imgClip1,
                clipName2: imgClip2,
                vaeName: imgVae,
                loraName: imgLora,
                loraStrength: Number(imgLoraStrength),
                width: Number(imgWidth),
                height: Number(imgHeight),
                steps: Number(imgSteps),
                cfg: Number(imgCfg),
                fluxGuidance: Number(imgFluxGuidance),
                sampler: imgSampler,
                scheduler: imgScheduler,
                batchSize: Number(imgBatch),
                seed: Number(imgSeed),
                denoise: Number(imgDenoise),
                inputImageId: imgMode === 'i2i' && imgRef ? imgRef.id : undefined,
                customWorkflow: imgPreset === 'custom' ? imgCustomWorkflow : undefined,
              };
              const res = await apiJson('/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });
              setLastImgJobId(res.job.id);
              await refreshState(false);
            } catch (err) {
              setBanner({ type: 'error', text: err.message });
            } finally {
              setImgSubmitting(false);
            }
          }

          async function handleGenerateVideo(e) {
            e.preventDefault();
            setBanner(null);
            setVidSubmitting(true);
            try {
              const payload = {
                kind: 'video',
                preset: vidPreset,
                prompt: vidPrompt,
                negativePrompt: vidNegPrompt,
                unetName: vidUnet,
                ckptName: vidCkpt,
                clipName: vidClip,
                vaeName: vidVae,
                clipVisionName: vidClipVision,
                width: Number(vidWidth),
                height: Number(vidHeight),
                frames: Number(vidFrames),
                fps: Number(vidFps),
                steps: Number(vidSteps),
                cfg: Number(vidCfg),
                shift: Number(vidShift),
                sampler: vidSampler,
                seed: Number(vidSeed),
                inputImageId: vidMode === 'i2v' && vidRef ? vidRef.id : undefined,
                customWorkflow: vidPreset === 'custom' ? vidCustomWorkflow : undefined,
              };
              const res = await apiJson('/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });
              setLastVidJobId(res.job.id);
              await refreshState(false);
            } catch (err) {
              setBanner({ type: 'error', text: err.message });
            } finally {
              setVidSubmitting(false);
            }
          }

          async function handleCancelJob(jobId) {
            try {
              await apiJson('/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId }),
              });
              await refreshState(false);
            } catch (err) {
              setBanner({ type: 'error', text: err.message });
            }
          }

          async function handleDeleteItem(itemId) {
            try {
              await apiJson('/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: itemId }),
              });
              if (selectedItem?.id === itemId) setSelectedItem(null);
              await refreshState(false);
            } catch (err) {
              setBanner({ type: 'error', text: err.message });
            }
          }

          function sendItemToVideo(item) {
            setVidMode('i2v');
            if (vidPreset === 'wan_video' && /t2v/i.test(vidUnet)) {
              setVidUnet('wan2.1_i2v_480p_14B_fp8_e4m3fn.safetensors');
            }
            setVidRef({
              id: item.id,
              bucket: 'outputs',
              file: item.file,
              filename: item.originalFilename || item.file,
            });
            setSelectedItem(null);
            setTab('video');
          }

          function reuseItemParams(item) {
            if (item.kind === 'video') {
              setVidPrompt(item.prompt || '');
              setVidNegPrompt(item.negativePrompt || '');
              if (item.width) setVidWidth(item.width);
              if (item.height) setVidHeight(item.height);
              if (item.frames) setVidFrames(item.frames);
              if (item.fps) setVidFps(item.fps);
              if (item.steps) setVidSteps(item.steps);
              if (item.cfg) setVidCfg(item.cfg);
              if (item.seed) setVidSeed(item.seed);
              setTab('video');
            } else {
              setImgPrompt(item.prompt || '');
              setImgNegPrompt(item.negativePrompt || '');
              if (item.width) setImgWidth(item.width);
              if (item.height) setImgHeight(item.height);
              if (item.steps) setImgSteps(item.steps);
              if (item.cfg) setImgCfg(item.cfg);
              if (item.seed) setImgSeed(item.seed);
              setTab('image');
            }
            setSelectedItem(null);
          }

          const currentImgJob =
            jobs.find((j) => j.id === lastImgJobId) || jobs.find((j) => j.kind === 'image') || null;
          const currentImgOutputs = currentImgJob
            ? gallery.filter((g) => g.jobId === currentImgJob.id)
            : gallery.filter((g) => g.kind === 'image').slice(0, 1);

          const currentVidJob =
            jobs.find((j) => j.id === lastVidJobId) || jobs.find((j) => j.kind === 'video') || null;
          const currentVidOutputs = currentVidJob
            ? gallery.filter((g) => g.jobId === currentVidJob.id)
            : gallery.filter((g) => g.kind === 'video').slice(0, 1);

          const filteredGallery = gallery.filter((item) => {
            if (galleryFilter !== 'all' && item.mediaType !== galleryFilter) return false;
            const q = galleryQuery.trim().toLowerCase();
            if (q) {
              const hay = `${item.prompt || ''} ${item.model || ''} ${item.preset || ''}`.toLowerCase();
              if (!hay.includes(q)) return false;
            }
            return true;
          });

          const isConnected = Boolean(capabilities?.baseUrl && state?.config?.comfyUrl);
          const activeJobsCount = jobs.filter((j) => j.status === 'queued' || j.status === 'running').length;

          function renderJobStatusCard(job) {
            if (!job) return null;
            const pct = Math.round((Number(job.progress) || 0) * 100);
            const active = job.status === 'queued' || job.status === 'running';
            return h(
              'div',
              { className: 'cms-progress-wrap' },
              h(
                'div',
                { className: 'cms-label-row' },
                h(
                  'span',
                  { style: { fontWeight: 600, fontSize: 12.5 } },
                  `${statusLabel(job.status)}${job.currentNode ? ` · 节点 #${job.currentNode}` : ''}${active ? ` (${pct}%)` : ''}`,
                ),
                h(
                  'div',
                  { style: { display: 'flex', alignItems: 'center', gap: 8 } },
                  job.seed && h('span', { className: 'cms-label' }, `Seed: ${job.seed}`),
                  active &&
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'cms-btn cms-btn-danger cms-btn-sm',
                        onClick: () => handleCancelJob(job.id),
                      },
                      t('cancelJob'),
                    ),
                ),
              ),
              active &&
                h(
                  'div',
                  { className: 'cms-progress-track' },
                  h('div', {
                    className: 'cms-progress-fill',
                    style: { width: `${Math.max(4, pct)}%` },
                  }),
                ),
              job.error &&
                h('div', { style: { fontSize: 12, color: 'var(--cms-error)' } }, job.error),
            );
          }

          function renderImageTab() {
            return h(
              'div',
              { className: 'cms-split' },
              // Left controls
              h(
                'form',
                { className: 'cms-card', onSubmit: handleGenerateImage },
                h(
                  'div',
                  { className: 'cms-card-title' },
                  h('span', null, t('tabImage')),
                  h(
                    'div',
                    { className: 'cms-seg', style: { width: 176 } },
                    h(
                      'button',
                      {
                        type: 'button',
                        className: `cms-seg-btn${imgMode === 't2i' ? ' active' : ''}`,
                        onClick: () => setImgMode('t2i'),
                      },
                      t('t2i'),
                    ),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: `cms-seg-btn${imgMode === 'i2i' ? ' active' : ''}`,
                        onClick: () => setImgMode('i2i'),
                      },
                      t('i2i'),
                    ),
                  ),
                ),
                h(
                  'div',
                  { className: 'cms-field' },
                  h('label', { className: 'cms-label' }, t('presetLabel')),
                  h(
                    'select',
                    {
                      className: 'cms-select',
                      value: imgPreset,
                      onChange: (e) => setImgPreset(e.target.value),
                    },
                    h('option', { value: 'sd_checkpoint' }, t('presetSdCkpt')),
                    h('option', { value: 'flux_unet' }, t('presetFluxUnet')),
                    h('option', { value: 'custom' }, t('presetCustom')),
                  ),
                ),
                imgMode === 'i2i' &&
                  h(
                    'div',
                    { className: 'cms-field' },
                    h('label', { className: 'cms-label' }, '参考图片（用于图生图重绘）'),
                    h(
                      'div',
                      { className: 'cms-upload-box' },
                      imgRef &&
                        h('img', {
                          className: 'cms-upload-thumb',
                          src: mediaUrl(imgRef.bucket, imgRef.file),
                          alt: imgRef.filename,
                        }),
                      h(
                        'div',
                        { style: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 } },
                        h('input', {
                          type: 'file',
                          accept: 'image/*',
                          onChange: (e) => handleUploadFile(e.target.files?.[0], setImgRef),
                        }),
                        imgRef &&
                          h(
                            'div',
                            { className: 'cms-label-row' },
                            h('span', { className: 'cms-label' }, `重绘幅度 Denoise: ${imgDenoise}`),
                            h(
                              'button',
                              {
                                type: 'button',
                                className: 'cms-btn cms-btn-ghost cms-btn-sm',
                                onClick: () => setImgRef(null),
                              },
                              t('clearRef'),
                            ),
                          ),
                        imgRef &&
                          h('input', {
                            type: 'range',
                            min: 0.1,
                            max: 1.0,
                            step: 0.05,
                            value: imgDenoise,
                            onChange: (e) => setImgDenoise(Number(e.target.value)),
                          }),
                      ),
                    ),
                  ),
                imgPreset === 'sd_checkpoint' &&
                  h(
                    React.Fragment,
                    null,
                    h(ModelField, {
                      label: 'Checkpoint 模型',
                      value: imgCkpt,
                      onChange: setImgCkpt,
                      options: models.checkpoints,
                      placeholder: 'flux1-schnell-fp8.safetensors',
                      t,
                    }),
                    h(
                      'div',
                      { className: 'cms-grid-2' },
                      h(ModelField, {
                        label: 'LoRA（可选）',
                        value: imgLora,
                        onChange: setImgLora,
                        options: models.loras,
                        placeholder: '留空则不使用 LoRA',
                        t,
                      }),
                      h(
                        'div',
                        { className: 'cms-field' },
                        h('label', { className: 'cms-label' }, 'LoRA 权重'),
                        h('input', {
                          className: 'cms-input',
                          type: 'number',
                          step: '0.05',
                          min: '-2',
                          max: '2',
                          value: imgLoraStrength,
                          onChange: (e) => setImgLoraStrength(e.target.value),
                        }),
                      ),
                    ),
                  ),
                imgPreset === 'flux_unet' &&
                  h(
                    React.Fragment,
                    null,
                    h(ModelField, {
                      label: 'UNET 扩散模型',
                      value: imgUnet,
                      onChange: setImgUnet,
                      options: models.unets,
                      placeholder: 'flux1-dev-fp8.safetensors',
                      t,
                    }),
                    h(
                      'div',
                      { className: 'cms-grid-2' },
                      h(ModelField, {
                        label: 'CLIP 1',
                        value: imgClip1,
                        onChange: setImgClip1,
                        options: models.clips,
                        placeholder: 'clip_l.safetensors',
                        t,
                      }),
                      h(ModelField, {
                        label: 'CLIP 2 (T5)',
                        value: imgClip2,
                        onChange: setImgClip2,
                        options: models.clips,
                        placeholder: 't5xxl_fp8_e4m3fn.safetensors',
                        t,
                      }),
                    ),
                    h(
                      'div',
                      { className: 'cms-grid-2' },
                      h(ModelField, {
                        label: 'VAE',
                        value: imgVae,
                        onChange: setImgVae,
                        options: models.vaes,
                        placeholder: 'ae.safetensors',
                        t,
                      }),
                      h(
                        'div',
                        { className: 'cms-field' },
                        h('label', { className: 'cms-label' }, 'FluxGuidance'),
                        h('input', {
                          className: 'cms-input',
                          type: 'number',
                          step: '0.5',
                          value: imgFluxGuidance,
                          onChange: (e) => setImgFluxGuidance(e.target.value),
                        }),
                      ),
                    ),
                  ),
                imgPreset === 'custom' &&
                  h(
                    'div',
                    { className: 'cms-field' },
                    h('label', { className: 'cms-label' }, 'ComfyUI Save (API Format) JSON（支持 {{PROMPT}} / {{SEED}} / {{IMAGE}}）'),
                    h('textarea', {
                      className: 'cms-textarea',
                      style: { minHeight: 120, fontFamily: 'monospace', fontSize: 11.5 },
                      value: imgCustomWorkflow,
                      onChange: (e) => setImgCustomWorkflow(e.target.value),
                      placeholder: '{ "3": { "class_type": "KSampler", "inputs": { ... } } }',
                    }),
                  ),
                h(
                  'div',
                  { className: 'cms-field' },
                  h(
                    'div',
                    { className: 'cms-label-row' },
                    h('label', { className: 'cms-label' }, t('promptLabel')),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'cms-btn cms-btn-ghost cms-btn-sm',
                        style: { height: 20, fontSize: 11, padding: '0 6px' },
                        onClick: () =>
                          setImgPrompt(
                            QUICK_IMAGE_PROMPTS[Math.floor(Math.random() * QUICK_IMAGE_PROMPTS.length)],
                          ),
                      },
                      '填入灵感词',
                    ),
                  ),
                  h('textarea', {
                    className: 'cms-textarea',
                    value: imgPrompt,
                    onChange: (e) => setImgPrompt(e.target.value),
                    placeholder: '建议英文描述画面主体、光线、构图与风格…',
                  }),
                ),
                h(
                  'div',
                  { className: 'cms-field' },
                  h('label', { className: 'cms-label' }, t('negativeLabel')),
                  h('input', {
                    className: 'cms-input',
                    value: imgNegPrompt,
                    onChange: (e) => setImgNegPrompt(e.target.value),
                    placeholder: '可选，如 blurry, watermark, low quality',
                  }),
                ),
                h(
                  'div',
                  { className: 'cms-field' },
                  h('label', { className: 'cms-label' }, '画幅比例'),
                  h(
                    'div',
                    { className: 'cms-chips' },
                    ...IMAGE_RATIOS.map((r) =>
                      h(
                        'button',
                        {
                          key: r.label,
                          type: 'button',
                          className: `cms-chip${imgWidth === r.w && imgHeight === r.h ? ' active' : ''}`,
                          onClick: () => {
                            setImgWidth(r.w);
                            setImgHeight(r.h);
                          },
                        },
                        r.label,
                      ),
                    ),
                  ),
                ),
                h(
                  'div',
                  { className: 'cms-grid-3' },
                  h(
                    'div',
                    { className: 'cms-field' },
                    h('label', { className: 'cms-label' }, '宽度'),
                    h('input', {
                      className: 'cms-input',
                      type: 'number',
                      step: 16,
                      value: imgWidth,
                      onChange: (e) => setImgWidth(Number(e.target.value)),
                    }),
                  ),
                  h(
                    'div',
                    { className: 'cms-field' },
                    h('label', { className: 'cms-label' }, '高度'),
                    h('input', {
                      className: 'cms-input',
                      type: 'number',
                      step: 16,
                      value: imgHeight,
                      onChange: (e) => setImgHeight(Number(e.target.value)),
                    }),
                  ),
                  h(
                    'div',
                    { className: 'cms-field' },
                    h('label', { className: 'cms-label' }, '张数'),
                    h('input', {
                      className: 'cms-input',
                      type: 'number',
                      min: 1,
                      max: 4,
                      value: imgBatch,
                      onChange: (e) => setImgBatch(Number(e.target.value)),
                    }),
                  ),
                ),
                h(
                  'div',
                  { className: 'cms-grid-3' },
                  h(
                    'div',
                    { className: 'cms-field' },
                    h('label', { className: 'cms-label' }, '步数 Steps'),
                    h('input', {
                      className: 'cms-input',
                      type: 'number',
                      min: 1,
                      max: 100,
                      value: imgSteps,
                      onChange: (e) => setImgSteps(Number(e.target.value)),
                    }),
                  ),
                  h(
                    'div',
                    { className: 'cms-field' },
                    h('label', { className: 'cms-label' }, 'CFG'),
                    h('input', {
                      className: 'cms-input',
                      type: 'number',
                      step: '0.5',
                      min: 0.5,
                      max: 30,
                      value: imgCfg,
                      onChange: (e) => setImgCfg(Number(e.target.value)),
                    }),
                  ),
                  h(
                    'div',
                    { className: 'cms-field' },
                    h('label', { className: 'cms-label' }, 'Seed (-1 随机)'),
                    h('input', {
                      className: 'cms-input',
                      type: 'number',
                      value: imgSeed,
                      onChange: (e) => setImgSeed(Number(e.target.value)),
                    }),
                  ),
                ),
                h(
                  'div',
                  { className: 'cms-grid-2' },
                  h(ModelField, {
                    label: '采样器 Sampler',
                    value: imgSampler,
                    onChange: setImgSampler,
                    options: models.samplers,
                    placeholder: 'euler',
                    t,
                  }),
                  h(ModelField, {
                    label: '调度器 Scheduler',
                    value: imgScheduler,
                    onChange: setImgScheduler,
                    options: models.schedulers,
                    placeholder: 'simple',
                    t,
                  }),
                ),
                h(
                  'button',
                  {
                    type: 'submit',
                    className: 'cms-btn cms-btn-primary',
                    style: { width: '100%', height: 36, fontWeight: 600 },
                    disabled: imgSubmitting,
                  },
                  imgSubmitting ? t('submitting') : t('generateImage'),
                ),
              ),
              // Right stage
              h(
                'div',
                { className: 'cms-card cms-stage' },
                h(
                  'div',
                  { className: 'cms-card-title' },
                  h('span', null, '图片生成预览区'),
                  currentImgOutputs[0] &&
                    h(
                      'div',
                      { style: { display: 'flex', gap: 6, flexWrap: 'wrap' } },
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'cms-btn cms-btn-sm',
                          onClick: () => sendItemToVideo(currentImgOutputs[0]),
                        },
                        t('useAsVideoFrame'),
                      ),
                      h(
                        'a',
                        {
                          className: 'cms-btn cms-btn-sm',
                          href: mediaUrl('outputs', currentImgOutputs[0].file, true),
                          download: currentImgOutputs[0].file,
                        },
                        t('download'),
                      ),
                    ),
                ),
                renderJobStatusCard(currentImgJob),
                h(
                  'div',
                  { className: 'cms-stage-frame' },
                  currentImgOutputs.length > 0
                    ? h(
                        'div',
                        {
                          style: {
                            display: 'grid',
                            gap: 10,
                            gridTemplateColumns: currentImgOutputs.length > 1 ? 'repeat(2, minmax(0, 1fr))' : '1fr',
                            justifyItems: 'center',
                          },
                        },
                        ...currentImgOutputs.map((out) =>
                          h('img', {
                            key: out.id,
                            className: 'cms-stage-media',
                            src: mediaUrl('outputs', out.file),
                            alt: out.prompt || 'Generated image',
                            onClick: () => setSelectedItem(out),
                            style: { cursor: 'pointer' },
                          }),
                        ),
                      )
                    : h(
                        'div',
                        { className: 'cms-empty-stage' },
                        h('div', { style: { fontWeight: 600, marginBottom: 6, color: 'var(--cms-text-1)' } }, '等待生成图片'),
                        h(
                          'div',
                          null,
                          isConnected
                            ? '填写提示词并点击“开始生成图片”，生成结果将自动保存到本地，关闭 Colab 也不会丢失。'
                            : '请先在顶部输入 Colab ComfyUI 穿透地址并连接，或前往“Colab Ultra 部署向导”一键启动云端 GPU。',
                        ),
                      ),
                ),
              ),
            );
          }

          function renderVideoTab() {
            return h(
              'div',
              { className: 'cms-split' },
              h(
                'form',
                { className: 'cms-card', onSubmit: handleGenerateVideo },
                h(
                  'div',
                  { className: 'cms-card-title' },
                  h('span', null, t('tabVideo')),
                  h(
                    'div',
                    { className: 'cms-seg', style: { width: 210 } },
                    h(
                      'button',
                      {
                        type: 'button',
                        className: `cms-seg-btn${vidMode === 't2v' ? ' active' : ''}`,
                        onClick: () => setVidMode('t2v'),
                      },
                      t('t2v'),
                    ),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: `cms-seg-btn${vidMode === 'i2v' ? ' active' : ''}`,
                        onClick: () => {
                          setVidMode('i2v');
                          if (vidPreset === 'wan_video' && /t2v/i.test(vidUnet)) {
                            setVidUnet('wan2.1_i2v_480p_14B_fp8_e4m3fn.safetensors');
                          }
                        },
                      },
                      t('i2v'),
                    ),
                  ),
                ),
                h(
                  'div',
                  { className: 'cms-field' },
                  h('label', { className: 'cms-label' }, t('presetLabel')),
                  h(
                    'select',
                    {
                      className: 'cms-select',
                      value: vidPreset,
                      onChange: (e) => {
                        const next = e.target.value;
                        setVidPreset(next);
                        if (next === 'ltx_video') {
                          setVidFps(24);
                          setVidCfg(3.0);
                          setVidSampler('euler');
                          setVidWidth(768);
                          setVidHeight(512);
                        } else if (next === 'wan_video') {
                          setVidFps(16);
                          setVidCfg(6.0);
                          setVidSampler('uni_pc');
                          setVidWidth(832);
                          setVidHeight(480);
                        }
                      },
                    },
                    h('option', { value: 'wan_video' }, t('presetWan')),
                    h('option', { value: 'ltx_video' }, t('presetLtx')),
                    h('option', { value: 'custom' }, t('presetCustom')),
                  ),
                ),
                vidMode === 'i2v' &&
                  h(
                    'div',
                    { className: 'cms-field' },
                    h('label', { className: 'cms-label' }, '首帧参考图（支持上传或直接从生图页发送）'),
                    h(
                      'div',
                      { className: 'cms-upload-box' },
                      vidRef &&
                        h('img', {
                          className: 'cms-upload-thumb',
                          src: mediaUrl(vidRef.bucket, vidRef.file),
                          alt: vidRef.filename,
                        }),
                      h(
                        'div',
                        { style: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 } },
                        h('input', {
                          type: 'file',
                          accept: 'image/*',
                          onChange: (e) => handleUploadFile(e.target.files?.[0], setVidRef),
                        }),
                        vidRef &&
                          h(
                            'div',
                            { className: 'cms-label-row' },
                            h('span', { className: 'cms-label' }, vidRef.filename),
                            h(
                              'button',
                              {
                                type: 'button',
                                className: 'cms-btn cms-btn-ghost cms-btn-sm',
                                onClick: () => setVidRef(null),
                              },
                              t('clearRef'),
                            ),
                          ),
                      ),
                    ),
                  ),
                vidPreset === 'wan_video' &&
                  h(
                    React.Fragment,
                    null,
                    h(ModelField, {
                      label: 'Wan 扩散模型 (UNET)',
                      value: vidUnet,
                      onChange: setVidUnet,
                      options: models.unets,
                      placeholder: 'wan2.1_t2v_1.3B_fp16.safetensors',
                      t,
                    }),
                    h(
                      'div',
                      { className: 'cms-grid-2' },
                      h(ModelField, {
                        label: 'Text Encoder (UMT5)',
                        value: vidClip,
                        onChange: setVidClip,
                        options: models.clips,
                        placeholder: 'umt5_xxl_fp8_e4m3fn_scaled.safetensors',
                        t,
                      }),
                      h(ModelField, {
                        label: 'Wan VAE',
                        value: vidVae,
                        onChange: setVidVae,
                        options: models.vaes,
                        placeholder: 'wan_2.1_vae.safetensors',
                        t,
                      }),
                    ),
                    vidMode === 'i2v' &&
                      h(ModelField, {
                        label: 'CLIP Vision（图生视频必须）',
                        value: vidClipVision,
                        onChange: setVidClipVision,
                        options: models.clipVisions,
                        placeholder: 'clip_vision_h.safetensors',
                        t,
                      }),
                  ),
                vidPreset === 'ltx_video' &&
                  h(
                    'div',
                    { className: 'cms-grid-2' },
                    h(ModelField, {
                      label: 'LTX Checkpoint',
                      value: vidCkpt,
                      onChange: setVidCkpt,
                      options: models.checkpoints,
                      placeholder: 'ltx-video-2b-v0.9.5.safetensors',
                      t,
                    }),
                    h(ModelField, {
                      label: 'T5 Text Encoder',
                      value: vidClip,
                      onChange: setVidClip,
                      options: models.clips,
                      placeholder: 't5xxl_fp8_e4m3fn.safetensors',
                      t,
                    }),
                  ),
                vidPreset === 'custom' &&
                  h(
                    'div',
                    { className: 'cms-field' },
                    h('label', { className: 'cms-label' }, 'ComfyUI 视频 API 工作流 JSON'),
                    h('textarea', {
                      className: 'cms-textarea',
                      style: { minHeight: 120, fontFamily: 'monospace', fontSize: 11.5 },
                      value: vidCustomWorkflow,
                      onChange: (e) => setVidCustomWorkflow(e.target.value),
                      placeholder: '{ "3": { "class_type": "KSampler", "inputs": { ... } } }',
                    }),
                  ),
                h(
                  'div',
                  { className: 'cms-field' },
                  h(
                    'div',
                    { className: 'cms-label-row' },
                    h('label', { className: 'cms-label' }, t('promptLabel')),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'cms-btn cms-btn-ghost cms-btn-sm',
                        style: { height: 20, fontSize: 11, padding: '0 6px' },
                        onClick: () =>
                          setVidPrompt(
                            QUICK_VIDEO_PROMPTS[Math.floor(Math.random() * QUICK_VIDEO_PROMPTS.length)],
                          ),
                      },
                      '填入动态词',
                    ),
                  ),
                  h('textarea', {
                    className: 'cms-textarea',
                    value: vidPrompt,
                    onChange: (e) => setVidPrompt(e.target.value),
                    placeholder: '描述镜头运动、主体动作与光影氛围…',
                  }),
                ),
                h(
                  'div',
                  { className: 'cms-field' },
                  h('label', { className: 'cms-label' }, '视频分辨率'),
                  h(
                    'div',
                    { className: 'cms-chips' },
                    ...VIDEO_RATIOS.map((r) =>
                      h(
                        'button',
                        {
                          key: r.label,
                          type: 'button',
                          className: `cms-chip${vidWidth === r.w && vidHeight === r.h ? ' active' : ''}`,
                          onClick: () => {
                            setVidWidth(r.w);
                            setVidHeight(r.h);
                          },
                        },
                        r.label,
                      ),
                    ),
                  ),
                ),
                h(
                  'div',
                  { className: 'cms-field' },
                  h('label', { className: 'cms-label' }, '视频时长（帧数自动对齐 4k+1）'),
                  h(
                    'div',
                    { className: 'cms-chips' },
                    ...VIDEO_DURATIONS.map((d) =>
                      h(
                        'button',
                        {
                          key: d.frames,
                          type: 'button',
                          className: `cms-chip${vidFrames === d.frames ? ' active' : ''}`,
                          onClick: () => setVidFrames(d.frames),
                        },
                        d.label,
                      ),
                    ),
                  ),
                ),
                h(
                  'div',
                  { className: 'cms-grid-3' },
                  h(
                    'div',
                    { className: 'cms-field' },
                    h('label', { className: 'cms-label' }, '帧数 Frames'),
                    h('input', {
                      className: 'cms-input',
                      type: 'number',
                      min: 9,
                      max: 161,
                      step: 4,
                      value: vidFrames,
                      onChange: (e) => setVidFrames(Number(e.target.value)),
                    }),
                  ),
                  h(
                    'div',
                    { className: 'cms-field' },
                    h('label', { className: 'cms-label' }, '帧率 FPS'),
                    h('input', {
                      className: 'cms-input',
                      type: 'number',
                      min: 8,
                      max: 60,
                      value: vidFps,
                      onChange: (e) => setVidFps(Number(e.target.value)),
                    }),
                  ),
                  h(
                    'div',
                    { className: 'cms-field' },
                    h('label', { className: 'cms-label' }, '步数 Steps'),
                    h('input', {
                      className: 'cms-input',
                      type: 'number',
                      min: 4,
                      max: 80,
                      value: vidSteps,
                      onChange: (e) => setVidSteps(Number(e.target.value)),
                    }),
                  ),
                ),
                h(
                  'div',
                  { className: 'cms-grid-3' },
                  h(
                    'div',
                    { className: 'cms-field' },
                    h('label', { className: 'cms-label' }, 'CFG'),
                    h('input', {
                      className: 'cms-input',
                      type: 'number',
                      step: '0.5',
                      value: vidCfg,
                      onChange: (e) => setVidCfg(Number(e.target.value)),
                    }),
                  ),
                  h(
                    'div',
                    { className: 'cms-field' },
                    h('label', { className: 'cms-label' }, 'Shift (Wan)'),
                    h('input', {
                      className: 'cms-input',
                      type: 'number',
                      step: '0.5',
                      value: vidShift,
                      onChange: (e) => setVidShift(Number(e.target.value)),
                    }),
                  ),
                  h(
                    'div',
                    { className: 'cms-field' },
                    h('label', { className: 'cms-label' }, 'Seed (-1 随机)'),
                    h('input', {
                      className: 'cms-input',
                      type: 'number',
                      value: vidSeed,
                      onChange: (e) => setVidSeed(Number(e.target.value)),
                    }),
                  ),
                ),
                h(
                  'button',
                  {
                    type: 'submit',
                    className: 'cms-btn cms-btn-primary',
                    style: { width: '100%', height: 36, fontWeight: 600 },
                    disabled: vidSubmitting,
                  },
                  vidSubmitting ? t('submitting') : t('generateVideo'),
                ),
              ),
              h(
                'div',
                { className: 'cms-card cms-stage' },
                h(
                  'div',
                  { className: 'cms-card-title' },
                  h('span', null, '视频生成预览区'),
                  currentVidOutputs[0] &&
                    h(
                      'a',
                      {
                        className: 'cms-btn cms-btn-sm',
                        href: mediaUrl('outputs', currentVidOutputs[0].file, true),
                        download: currentVidOutputs[0].file,
                      },
                      t('download'),
                    ),
                ),
                renderJobStatusCard(currentVidJob),
                h(
                  'div',
                  { className: 'cms-stage-frame' },
                  currentVidOutputs[0]
                    ? currentVidOutputs[0].mediaType === 'video'
                      ? h('video', {
                          className: 'cms-stage-media',
                          controls: true,
                          loop: true,
                          playsInline: true,
                          src: mediaUrl('outputs', currentVidOutputs[0].file),
                        })
                      : h('img', {
                          className: 'cms-stage-media',
                          src: mediaUrl('outputs', currentVidOutputs[0].file),
                          alt: currentVidOutputs[0].prompt || 'Generated animation',
                        })
                    : h(
                        'div',
                        { className: 'cms-empty-stage' },
                        h('div', { style: { fontWeight: 600, marginBottom: 6, color: 'var(--cms-text-1)' } }, '等待生成视频'),
                        h(
                          'div',
                          null,
                          '支持 Wan 2.1 / 2.2 与 LTX-Video，生成结果优先保存为 MP4 / WebM 视频并缓存到本地作品库。',
                        ),
                      ),
                ),
              ),
            );
          }

          function renderGalleryTab() {
            return h(
              'div',
              { style: { display: 'flex', flexDirection: 'column', gap: 16 } },
              jobs.length > 0 &&
                h(
                  'div',
                  { className: 'cms-card' },
                  h('div', { className: 'cms-card-title' }, h('span', null, `近期任务队列 (${jobs.length})`)),
                  h(
                    'div',
                    { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
                    ...jobs.slice(0, 8).map((job) =>
                      h(
                        'div',
                        {
                          key: job.id,
                          style: {
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                            padding: '8px 10px',
                            borderRadius: 'var(--cms-radius-sm)',
                            border: '1px solid var(--cms-border-1)',
                            background: 'var(--cms-bg)',
                          },
                        },
                        h(
                          'div',
                          { style: { minWidth: 0, flex: 1 } },
                          h(
                            'div',
                            { style: { fontWeight: 500, fontSize: 12.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } },
                            `[${job.kind === 'video' ? '视频' : '图片'}] ${job.prompt || '自定义工作流'}`,
                          ),
                          h(
                            'div',
                            { style: { fontSize: 11.5, color: job.error ? 'var(--cms-error)' : 'var(--cms-text-2)' } },
                            `${statusLabel(job.status)} · ${job.model || job.preset} · ${formatTime(job.createdAt)}${job.error ? ` · ${job.error}` : ''}`,
                          ),
                        ),
                        (job.status === 'queued' || job.status === 'running') &&
                          h(
                            'button',
                            {
                              type: 'button',
                              className: 'cms-btn cms-btn-danger cms-btn-sm',
                              onClick: () => handleCancelJob(job.id),
                            },
                            t('cancelJob'),
                          ),
                      ),
                    ),
                  ),
                ),
              h(
                'div',
                { className: 'cms-card' },
                h(
                  'div',
                  { className: 'cms-header-top' },
                  h(
                    'div',
                    { className: 'cms-chips' },
                    ...[
                      { id: 'all', label: `${t('all')} (${gallery.length})` },
                      { id: 'image', label: `${t('images')} (${gallery.filter((x) => x.mediaType === 'image').length})` },
                      { id: 'video', label: `${t('videos')} (${gallery.filter((x) => x.mediaType === 'video').length})` },
                    ].map((f) =>
                      h(
                        'button',
                        {
                          key: f.id,
                          type: 'button',
                          className: `cms-chip${galleryFilter === f.id ? ' active' : ''}`,
                          onClick: () => setGalleryFilter(f.id),
                        },
                        f.label,
                      ),
                    ),
                  ),
                  h('input', {
                    className: 'cms-input',
                    style: { width: 240 },
                    value: galleryQuery,
                    onChange: (e) => setGalleryQuery(e.target.value),
                    placeholder: t('searchPlaceholder'),
                  }),
                ),
                filteredGallery.length === 0
                  ? h('div', { className: 'cms-empty-stage', style: { margin: '0 auto' } }, t('emptyGallery'))
                  : h(
                      'div',
                      { className: 'cms-gallery-grid' },
                      ...filteredGallery.map((item) =>
                        h(
                          'div',
                          {
                            key: item.id,
                            className: 'cms-gallery-card',
                            onClick: () => setSelectedItem(item),
                          },
                          h(
                            'div',
                            { className: 'cms-gallery-thumb-wrap' },
                            item.mediaType === 'video'
                              ? h('video', {
                                  className: 'cms-gallery-thumb',
                                  src: mediaUrl('outputs', item.file),
                                  muted: true,
                                  playsInline: true,
                                })
                              : h('img', {
                                  className: 'cms-gallery-thumb',
                                  src: mediaUrl('outputs', item.file),
                                  alt: item.prompt || item.file,
                                  loading: 'lazy',
                                }),
                            h('span', { className: 'cms-kind-tag' }, item.mediaType === 'video' ? '视频' : '图片'),
                          ),
                          h(
                            'div',
                            { className: 'cms-gallery-meta' },
                            h('div', { className: 'cms-prompt-line' }, item.prompt || item.originalFilename || '自定义工作流'),
                            h(
                              'div',
                              { className: 'cms-meta-sub' },
                              h('span', null, `${item.width || '?'}×${item.height || '?'}`),
                              h('span', null, formatTime(item.createdAt)),
                            ),
                          ),
                        ),
                      ),
                    ),
              ),
            );
          }

          function renderColabTab() {
            const packs = state?.modelPacks || [];
            const downloadHref = `${API_BASE}/notebook?${new URLSearchParams({
              packs: selectedPacks.join(','),
              mountDrive: mountDrive ? '1' : '0',
              download: '1',
            }).toString()}`;

            return h(
              'div',
              { style: { display: 'flex', flexDirection: 'column', gap: 16 } },
              h(
                'div',
                { className: 'cms-card' },
                h(
                  'div',
                  { className: 'cms-card-title' },
                  h('span', null, 'Google Colab Ultra + ComfyUI 云端部署指南'),
                  h(
                    'a',
                    {
                      className: 'cms-btn cms-btn-sm',
                      href: 'https://colab.research.google.com/?hl=zh-cn',
                      target: '_blank',
                      rel: 'noopener noreferrer',
                    },
                    t('openColab'),
                  ),
                ),
                h(
                  'div',
                  { className: 'cms-steps-grid' },
                  h(
                    'div',
                    { className: 'cms-step-card' },
                    h('span', { className: 'cms-step-num' }, '1'),
                    h('strong', null, '下载预配置笔记本并上传至 Colab'),
                    h('span', { className: 'cms-label' }, '勾选下方需要的图片/视频模型包后下载 .ipynb，在 Colab 中打开并在“更改运行时类型”选择 A100 或 L4 GPU。'),
                  ),
                  h(
                    'div',
                    { className: 'cms-step-card' },
                    h('span', { className: 'cms-step-num' }, '2'),
                    h('strong', null, '挂载 Google Drive 自动缓存模型'),
                    h('span', { className: 'cms-label' }, 'Colab Ultra 支持最长 24 小时后台执行。首次下载权重到 Google Drive 后，下次开机秒连无需重复下载。'),
                  ),
                  h(
                    'div',
                    { className: 'cms-step-card' },
                    h('span', { className: 'cms-step-num' }, '3'),
                    h('strong', null, '复制穿透地址回到本插件生成'),
                    h('span', { className: 'cms-label' }, '最后一个单元格会输出 https://xxxx.trycloudflare.com，粘贴到本页面顶部地址栏即可生成图片与视频。'),
                  ),
                ),
              ),
              h(
                'div',
                { className: 'cms-split' },
                h(
                  'div',
                  { className: 'cms-card' },
                  h('div', { className: 'cms-card-title' }, h('span', null, '选择预装模型包')),
                  h(
                    'label',
                    { className: 'cms-check-row' },
                    h('input', {
                      type: 'checkbox',
                      checked: mountDrive,
                      onChange: (e) => setMountDrive(e.target.checked),
                    }),
                    h(
                      'div',
                      null,
                      h('div', { style: { fontWeight: 500 } }, '挂载 Google Drive 持久化模型（强烈推荐）'),
                      h('div', { className: 'cms-label' }, '模型保存在 MyDrive/ComfyUI_Models，重开 Colab 实例直接复用'),
                    ),
                  ),
                  ...packs.map((pack) => {
                    const checked = selectedPacks.includes(pack.id);
                    return h(
                      'label',
                      { key: pack.id, className: 'cms-check-row' },
                      h('input', {
                        type: 'checkbox',
                        checked,
                        onChange: (e) => {
                          if (e.target.checked) {
                            setSelectedPacks((prev) => [...new Set([...prev, pack.id])]);
                          } else {
                            setSelectedPacks((prev) => prev.filter((id) => id !== pack.id));
                          }
                        },
                      }),
                      h('span', { style: { fontSize: 12.5 } }, pack.label),
                    );
                  }),
                  h(
                    'div',
                    { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
                    h(
                      'a',
                      {
                        className: 'cms-btn cms-btn-primary',
                        href: downloadHref,
                        download: 'colab-comfyui-ultra.ipynb',
                      },
                      t('downloadNotebook'),
                    ),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'cms-btn',
                        onClick: async () => {
                          if (!scriptPreview) return;
                          await navigator.clipboard.writeText(scriptPreview);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        },
                      },
                      copied ? t('copied') : t('copyScript'),
                    ),
                  ),
                ),
                h(
                  'div',
                  { className: 'cms-card' },
                  h('div', { className: 'cms-card-title' }, h('span', null, 'Colab 单格一键启动代码预览')),
                  h('pre', { className: 'cms-code-block' }, scriptPreview || '正在生成启动脚本…'),
                ),
              ),
            );
          }

          return h(
            'div',
            { className: 'cms-root' },
            h('style', null, CSS),
            h(
              'header',
              { className: 'cms-header' },
              h(
                'div',
                { className: 'cms-header-top' },
                h(
                  'div',
                  { className: 'cms-brand-row' },
                  h('div', { className: 'cms-brand-mark' }, h(SidebarIcon, { size: 19 })),
                  h(
                    'div',
                    null,
                    h('h1', { className: 'cms-title' }, t('title')),
                    h('p', { className: 'cms-subtitle' }, t('subtitle')),
                  ),
                ),
                h(
                  'div',
                  { className: 'cms-header-right' },
                  h(
                    'span',
                    { className: `cms-status-pill ${isConnected ? 'online' : 'offline'}` },
                    h('i', { className: 'cms-dot' }),
                    isConnected
                      ? `${capabilities.system?.deviceName || t('online')}${capabilities.system?.vramFreeGb != null ? ` · 可用 ${capabilities.system.vramFreeGb}GB` : ''}`
                      : t('offline'),
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'cms-btn cms-btn-ghost cms-btn-sm',
                      onClick: () => setTab('colab'),
                    },
                    t('howToGetUrl'),
                  ),
                ),
              ),
              h(
                'div',
                { className: 'cms-conn-bar' },
                h('input', {
                  className: 'cms-input cms-conn-url',
                  value: urlInput,
                  onChange: (e) => setUrlInput(e.target.value),
                  placeholder: t('urlPlaceholder'),
                  'aria-label': 'ComfyUI URL',
                }),
                h('input', {
                  className: 'cms-input cms-conn-token',
                  type: 'password',
                  value: tokenInput,
                  onChange: (e) => setTokenInput(e.target.value),
                  placeholder: state?.hasAuthToken ? `${t('tokenSaved')}（输入可覆盖）` : t('tokenPlaceholder'),
                  'aria-label': 'Auth Token',
                }),
                state?.hasAuthToken &&
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'cms-btn cms-btn-ghost cms-btn-sm',
                      onClick: handleClearToken,
                    },
                    '清除密钥',
                  ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'cms-btn cms-btn-primary',
                    disabled: connecting,
                    onClick: handleConnect,
                  },
                  connecting ? t('connecting') : t('connectBtn'),
                ),
              ),
              h(
                'div',
                { className: 'cms-tabs-row' },
                h(
                  'div',
                  { className: 'cms-tabs', role: 'tablist', 'aria-label': t('title') },
                  ...[
                    { id: 'image', label: t('tabImage') },
                    { id: 'video', label: t('tabVideo') },
                    {
                      id: 'gallery',
                      label: t('tabGallery'),
                      badge: activeJobsCount > 0 ? activeJobsCount : gallery.length || null,
                    },
                    { id: 'colab', label: t('tabColab') },
                  ].map((item) =>
                    h(
                      'button',
                      {
                        key: item.id,
                        type: 'button',
                        role: 'tab',
                        className: 'cms-tab',
                        'aria-selected': tab === item.id,
                        onClick: () => setTab(item.id),
                      },
                      h('span', null, item.label),
                      item.badge ? h('span', { className: 'cms-badge' }, item.badge) : null,
                    ),
                  ),
                ),
              ),
            ),
            h(
              'main',
              { className: 'cms-body' },
              banner &&
                h(
                  'div',
                  { className: `cms-banner ${banner.type}` },
                  h('span', null, banner.text),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'cms-btn cms-btn-ghost cms-btn-sm',
                      onClick: () => setBanner(null),
                    },
                    t('close'),
                  ),
                ),
              loading
                ? h('div', { className: 'cms-empty-stage', style: { margin: '40px auto' } }, '正在加载工作台…')
                : tab === 'image'
                  ? renderImageTab()
                  : tab === 'video'
                    ? renderVideoTab()
                    : tab === 'gallery'
                      ? renderGalleryTab()
                      : renderColabTab(),
            ),
            selectedItem &&
              h(
                'div',
                {
                  className: 'cms-modal-backdrop',
                  onClick: (e) => {
                    if (e.target === e.currentTarget) setSelectedItem(null);
                  },
                },
                h(
                  'div',
                  {
                    className: 'cms-modal',
                    role: 'dialog',
                    'aria-modal': 'true',
                    'aria-label': '作品详情',
                  },
                  h(
                    'div',
                    { className: 'cms-card-title' },
                    h('span', null, `${selectedItem.mediaType === 'video' ? '视频作品' : '图片作品'} · ${selectedItem.model || selectedItem.preset}`),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'cms-btn cms-btn-ghost cms-btn-sm',
                        onClick: () => setSelectedItem(null),
                      },
                      t('close'),
                    ),
                  ),
                  h(
                    'div',
                    { className: 'cms-stage-frame' },
                    selectedItem.mediaType === 'video'
                      ? h('video', {
                          className: 'cms-stage-media',
                          controls: true,
                          autoPlay: true,
                          loop: true,
                          playsInline: true,
                          src: mediaUrl('outputs', selectedItem.file),
                        })
                      : h('img', {
                          className: 'cms-stage-media',
                          src: mediaUrl('outputs', selectedItem.file),
                          alt: selectedItem.prompt || selectedItem.file,
                        }),
                  ),
                  selectedItem.prompt &&
                    h('div', { style: { fontSize: 12.5, color: 'var(--cms-text-1)' } }, selectedItem.prompt),
                  h(
                    'div',
                    { className: 'cms-label-row', style: { flexWrap: 'wrap' } },
                    h(
                      'span',
                      { className: 'cms-label' },
                      `${selectedItem.width || '?'}×${selectedItem.height || '?'}${selectedItem.frames ? ` · ${selectedItem.frames} 帧 @ ${selectedItem.fps}fps` : ''} · Steps ${selectedItem.steps || '-'} · Seed ${selectedItem.seed || '-'}`,
                    ),
                    h(
                      'div',
                      { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
                      selectedItem.mediaType === 'image' &&
                        h(
                          'button',
                          {
                            type: 'button',
                            className: 'cms-btn cms-btn-sm',
                            onClick: () => sendItemToVideo(selectedItem),
                          },
                          t('useAsVideoFrame'),
                        ),
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'cms-btn cms-btn-sm',
                          onClick: () => reuseItemParams(selectedItem),
                        },
                        t('reuseParams'),
                      ),
                      h(
                        'a',
                        {
                          className: 'cms-btn cms-btn-primary cms-btn-sm',
                          href: mediaUrl('outputs', selectedItem.file, true),
                          download: selectedItem.file,
                        },
                        t('download'),
                      ),
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'cms-btn cms-btn-danger cms-btn-sm',
                          onClick: () => handleDeleteItem(selectedItem.id),
                        },
                        t('deleteItem'),
                      ),
                    ),
                  ),
                ),
              ),
          );
        }

        ctx.slots.inject('main', () =>
          ctx.slots.register({ name: 'main', key: 'colab-media-studio' }, App),
        );
        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            { name: 'sidebar.panellist', id: 'colab-media-studio', order: 18, label: () => t('navLabel') },
            SidebarIcon,
          ),
        );
      },
    };
  },
});
