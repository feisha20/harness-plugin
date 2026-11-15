import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  buildComfyWsUrl,
  downloadComfyView,
  fetchHistory,
  fetchQueue,
  interruptComfy,
  normalizeComfyUrl,
  probeComfyServer,
  submitPromptToComfy,
  uploadImageToComfy,
} from './comfy.js';
import { generateColabNotebook, generateQuickLaunchScript, MODEL_PACKS } from './notebook.js';
import { StudioStore } from './store.js';
import { buildImageWorkflow, buildVideoWorkflow } from './workflows.js';

const CREDENTIAL_SCOPE = 'colab-media-studio';
const CREDENTIAL_ID = 'comfy-auth';
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

function extFromMimeOrName(mimeType, filename) {
  const cleanName = String(filename || '').toLowerCase();
  const m = cleanName.match(/\.(png|jpe?g|webp|gif|mp4|webm|mov)$/i);
  if (m) return `.${m[1] === 'jpeg' ? 'jpg' : m[1]}`;
  if (mimeType === 'image/jpeg') return '.jpg';
  if (mimeType === 'image/webp') return '.webp';
  if (mimeType === 'image/gif') return '.gif';
  if (mimeType === 'video/mp4') return '.mp4';
  if (mimeType === 'video/webm') return '.webm';
  return '.png';
}

function classifyOutputFile(filename) {
  const ext = path.extname(String(filename || '')).toLowerCase();
  switch (ext) {
    case '.mp4':
      return { mimeType: 'video/mp4', mediaType: 'video', ext: '.mp4' };
    case '.webm':
      return { mimeType: 'video/webm', mediaType: 'video', ext: '.webm' };
    case '.mov':
      return { mimeType: 'video/quicktime', mediaType: 'video', ext: '.mov' };
    case '.gif':
      return { mimeType: 'image/gif', mediaType: 'image', ext: '.gif' };
    case '.webp':
      return { mimeType: 'image/webp', mediaType: 'image', ext: '.webp' };
    case '.jpg':
    case '.jpeg':
      return { mimeType: 'image/jpeg', mediaType: 'image', ext: '.jpg' };
    default:
      return { mimeType: 'image/png', mediaType: 'image', ext: '.png' };
  }
}

function extractHistoryError(historyEntry) {
  const status = historyEntry?.status;
  if (!status || status.status_str !== 'error') return null;
  const messages = Array.isArray(status.messages) ? status.messages : [];
  for (const entry of messages) {
    if (Array.isArray(entry) && entry[0] === 'execution_error' && entry[1]) {
      const info = entry[1];
      const node = info.node_type ? `${info.node_type}: ` : '';
      return `${node}${info.exception_message || 'ComfyUI 执行出错'}`.trim();
    }
  }
  return 'ComfyUI 工作流执行失败';
}

function collectOutputsFromHistory(historyEntry) {
  const outputs = historyEntry?.outputs;
  if (!outputs || typeof outputs !== 'object') return [];
  const collected = [];
  const seen = new Set();
  for (const nodeOut of Object.values(outputs)) {
    if (!nodeOut || typeof nodeOut !== 'object') continue;
    for (const bucket of ['videos', 'gifs', 'images']) {
      const list = nodeOut[bucket];
      if (!Array.isArray(list)) continue;
      for (const item of list) {
        if (!item?.filename) continue;
        if (item.type === 'temp') continue;
        const key = `${item.type || 'output'}:${item.subfolder || ''}:${item.filename}`;
        if (seen.has(key)) continue;
        seen.add(key);
        collected.push({
          filename: item.filename,
          subfolder: item.subfolder || '',
          type: item.type || 'output',
          format: item.format || '',
        });
      }
    }
  }
  return collected;
}

export class StudioService {
  constructor(ctx, options = {}) {
    this.ctx = ctx;
    this.store = options.store || new StudioStore(options.baseDir);
    this.watchers = new Map();
    this.disposed = false;
  }

  _credentialKey() {
    return `${CREDENTIAL_SCOPE}/${CREDENTIAL_ID}`;
  }

  async _getAuthHeaders(authHeaderName) {
    const creds = this.ctx?.get?.('credentials');
    if (!creds) return {};
    try {
      const record = await creds.readRecord(this._credentialKey());
      const token = record?.kind === 'grant' ? record?.payload?.token : null;
      if (typeof token === 'string' && token.trim()) {
        const headerName = String(authHeaderName || 'Authorization').trim() || 'Authorization';
        return { [headerName]: token.trim() };
      }
    } catch {
      // credentials optional
    }
    return {};
  }

  async _hasAuthToken() {
    const creds = this.ctx?.get?.('credentials');
    if (!creds) return false;
    try {
      const info = await creds.describeRecord(this._credentialKey());
      return Boolean(info?.configured);
    } catch {
      return false;
    }
  }

  async getState() {
    const snap = this.store.getSnapshot();
    const hasAuthToken = await this._hasAuthToken();
    return {
      ...snap,
      hasAuthToken,
      modelPacks: Object.values(MODEL_PACKS).map(({ id, label }) => ({ id, label })),
    };
  }

  async configure({ comfyUrl, authHeaderName, defaults } = {}) {
    const patch = {};
    if (comfyUrl !== undefined) {
      const trimmed = String(comfyUrl || '').trim();
      patch.comfyUrl = trimmed ? normalizeComfyUrl(trimmed) : '';
    }
    if (authHeaderName !== undefined) {
      patch.authHeaderName = String(authHeaderName || 'Authorization').trim() || 'Authorization';
    }
    if (defaults && typeof defaults === 'object') {
      patch.defaults = defaults;
    }
    const config = this.store.updateConfig(patch);
    return { config };
  }

  async setAuthToken({ token } = {}) {
    const creds = this.ctx?.get?.('credentials');
    if (!creds) {
      throw new Error('当前环境未启用凭据存储服务 (credentials)');
    }
    const clean = typeof token === 'string' ? token.trim() : '';
    const key = this._credentialKey();
    if (!clean) {
      await creds.deleteRecord(key);
      return { hasAuthToken: false };
    }
    await creds.modifyRecord(key, async () => ({
      kind: 'grant',
      payload: { token: clean },
    }));
    return { hasAuthToken: true };
  }

  async connect(override = {}) {
    const snap = this.store.getSnapshot();
    const targetUrl = override?.comfyUrl !== undefined ? override.comfyUrl : snap.config.comfyUrl;
    const cleanUrl = normalizeComfyUrl(targetUrl);
    if (override?.comfyUrl !== undefined && cleanUrl !== snap.config.comfyUrl) {
      this.store.updateConfig({ comfyUrl: cleanUrl });
    }
    const authHeaderName = override?.authHeaderName || snap.config.authHeaderName;
    const headers = await this._getAuthHeaders(authHeaderName);
    const capabilities = await probeComfyServer(cleanUrl, headers);
    this.store.setCapabilities(capabilities);
    return { capabilities };
  }

  async saveUpload({ filename = 'reference.png', mimeType = 'image/png', dataBase64 } = {}) {
    if (typeof dataBase64 !== 'string' || !dataBase64.trim()) {
      throw new Error('上传图片数据不能为空');
    }
    let cleanBase64 = dataBase64.trim();
    let inferredMime = mimeType;
    const dataUrlMatch = cleanBase64.match(/^data:([^;]+);base64,(.+)$/);
    if (dataUrlMatch) {
      inferredMime = dataUrlMatch[1];
      cleanBase64 = dataUrlMatch[2];
    }
    const buffer = Buffer.from(cleanBase64, 'base64');
    if (buffer.length === 0) {
      throw new Error('上传图片解码为空');
    }
    if (buffer.length > MAX_UPLOAD_BYTES) {
      throw new Error('参考图文件不能超过 20 MB');
    }
    const id = `upl_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    const ext = extFromMimeOrName(inferredMime, filename);
    const localFile = `${id}${ext}`;
    this.store.writeMediaBuffer('uploads', localFile, buffer);

    const record = {
      id,
      filename: path.basename(String(filename || `reference${ext}`)).slice(0, 120),
      localFile,
      mimeType: inferredMime || 'image/png',
      sizeBytes: buffer.length,
      createdAt: new Date().toISOString(),
    };
    this.store.addUpload(record);
    return { upload: record };
  }

  _resolveReferenceBuffer(params) {
    if (params.inputImageId) {
      const upload = this.store.getUpload(params.inputImageId);
      if (upload) {
        const filePath = this.store.resolveMediaPath('uploads', upload.localFile);
        return {
          buffer: readFileSync(filePath),
          filename: upload.localFile,
          mimeType: upload.mimeType,
        };
      }
      const galleryItem = this.store.getSnapshot().gallery.find((g) => g.id === params.inputImageId);
      if (galleryItem && galleryItem.mediaType === 'image') {
        const filePath = this.store.resolveMediaPath('outputs', galleryItem.file);
        return {
          buffer: readFileSync(filePath),
          filename: galleryItem.file,
          mimeType: galleryItem.mimeType,
        };
      }
      throw new Error(`找不到参考图 (${params.inputImageId})`);
    }
    return null;
  }

  async generate(params = {}, options = {}) {
    const kind = params.kind === 'video' ? 'video' : 'image';
    const snap = this.store.getSnapshot();
    const cleanUrl = normalizeComfyUrl(params.comfyUrl || snap.config.comfyUrl);
    const headers = await this._getAuthHeaders(snap.config.authHeaderName);

    let capabilities = snap.lastCapabilities;
    if (!capabilities || capabilities.baseUrl !== cleanUrl) {
      try {
        capabilities = await probeComfyServer(cleanUrl, headers);
        this.store.setCapabilities(capabilities);
      } catch {
        capabilities = snap.lastCapabilities;
      }
    }

    let remoteInputImage = params.remoteInputImage ? String(params.remoteInputImage).trim() : '';
    if (!remoteInputImage && params.inputImageBase64) {
      const saved = await this.saveUpload({
        filename: params.inputImageName || 'reference.png',
        mimeType: params.inputImageMime || 'image/png',
        dataBase64: params.inputImageBase64,
      });
      params = { ...params, inputImageId: saved.upload.id };
    }
    if (!remoteInputImage && params.inputImageId) {
      const ref = this._resolveReferenceBuffer(params);
      if (ref) {
        const uploaded = await uploadImageToComfy(
          cleanUrl,
          ref.buffer,
          ref.filename,
          ref.mimeType,
          headers,
        );
        remoteInputImage = uploaded.remoteRef;
      }
    }

    const buildParams = { ...params, remoteInputImage };
    const built =
      kind === 'video'
        ? buildVideoWorkflow(buildParams, capabilities)
        : buildImageWorkflow(buildParams, capabilities);

    const clientId = crypto.randomUUID();
    const submitRes = await submitPromptToComfy(cleanUrl, built.prompt, clientId, headers);
    const now = new Date().toISOString();
    const job = {
      id: `job_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
      promptId: submitRes.prompt_id,
      clientId,
      baseUrl: cleanUrl,
      kind,
      preset: built.preset,
      prompt: String(params.prompt || '').trim(),
      negativePrompt: String(params.negativePrompt || '').trim(),
      model: built.modelUsed,
      width: built.width,
      height: built.height,
      frames: built.frames || null,
      fps: built.fps || null,
      steps: built.steps || null,
      cfg: built.cfg || null,
      seed: built.resolvedSeed,
      hasInputImage: Boolean(remoteInputImage),
      status: 'queued',
      progress: 0,
      currentNode: null,
      error: null,
      outputIds: [],
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };

    this.store.upsertJob(job);
    const watcherPromise = this._watchJob(job.id, headers);

    if (options.wait) {
      const timeoutMs = Number(options.waitTimeoutMs) > 0 ? Number(options.waitTimeoutMs) : 120000;
      const settled = await Promise.race([
        watcherPromise,
        new Promise((resolve) => {
          const t = setTimeout(() => resolve(this.store.getJob(job.id)), timeoutMs);
          options.signal?.addEventListener?.(
            'abort',
            () => {
              clearTimeout(t);
              resolve(this.store.getJob(job.id));
            },
            { once: true },
          );
        }),
      ]);
      const finalJob = settled || this.store.getJob(job.id);
      const outputs = this.store
        .getSnapshot()
        .gallery.filter((item) => item.jobId === finalJob.id);
      return { job: finalJob, outputs };
    }

    return { job };
  }

  _watchJob(jobId, headers) {
    if (this.watchers.has(jobId)) {
      return this.watchers.get(jobId).promise;
    }

    const job = this.store.getJob(jobId);
    if (!job) return Promise.resolve(null);

    let settled = false;
    let ws = null;
    let pollTimer = null;
    let resolvePromise;
    const promise = new Promise((res) => {
      resolvePromise = res;
    });

    const cleanup = () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
      if (ws) {
        try {
          ws.close();
        } catch {
          // ignore
        }
        ws = null;
      }
      this.watchers.delete(jobId);
    };

    const finish = (patch) => {
      if (settled) return;
      settled = true;
      cleanup();
      const updated = this.store.upsertJob({
        id: jobId,
        ...patch,
        updatedAt: new Date().toISOString(),
      });
      resolvePromise(updated);
    };

    const checkHistoryAndCollect = async () => {
      if (settled || this.disposed) return;
      const latest = this.store.getJob(jobId);
      if (!latest || ['completed', 'failed', 'cancelled', 'interrupted'].includes(latest.status)) {
        finish({});
        return;
      }

      try {
        const entry = await fetchHistory(latest.baseUrl, latest.promptId, headers);
        if (entry) {
          const histErr = extractHistoryError(entry);
          if (histErr) {
            finish({ status: 'failed', error: histErr, progress: 0 });
            return;
          }

          const refs = collectOutputsFromHistory(entry);
          if (refs.length > 0 || entry.status?.completed) {
            if (refs.length === 0) {
              finish({
                status: 'failed',
                error: 'ComfyUI 执行完成但未产生任何可下载的图像或视频输出',
              });
              return;
            }
            const galleryItems = [];
            for (const ref of refs) {
              const buf = await downloadComfyView(latest.baseUrl, ref, headers);
              const meta = classifyOutputFile(ref.filename);
              const itemId = `out_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
              const localFile = `${itemId}${meta.ext}`;
              this.store.writeMediaBuffer('outputs', localFile, buf);
              galleryItems.push({
                id: itemId,
                jobId: latest.id,
                kind: latest.kind,
                mediaType: meta.mediaType,
                file: localFile,
                originalFilename: ref.filename,
                mimeType: meta.mimeType,
                sizeBytes: buf.length,
                prompt: latest.prompt,
                negativePrompt: latest.negativePrompt,
                preset: latest.preset,
                model: latest.model,
                width: latest.width,
                height: latest.height,
                frames: latest.frames,
                fps: latest.fps,
                steps: latest.steps,
                cfg: latest.cfg,
                seed: latest.seed,
                createdAt: new Date().toISOString(),
              });
            }
            this.store.addGalleryItems(galleryItems);
            finish({
              status: 'completed',
              progress: 1,
              currentNode: null,
              outputIds: galleryItems.map((g) => g.id),
              completedAt: new Date().toISOString(),
            });
            return;
          }
        }

        // Not in history yet: check whether still queued/running
        const queue = await fetchQueue(latest.baseUrl, headers).catch(() => null);
        if (queue) {
          const runningIds = new Set((queue.queue_running || []).map((row) => row?.[1]));
          const pendingIds = new Set((queue.queue_pending || []).map((row) => row?.[1]));
          if (runningIds.has(latest.promptId) && latest.status === 'queued') {
            this.store.upsertJob({
              id: jobId,
              status: 'running',
              updatedAt: new Date().toISOString(),
            });
          } else if (!runningIds.has(latest.promptId) && !pendingIds.has(latest.promptId)) {
            // Re-check history once before concluding
            const recheck = await fetchHistory(latest.baseUrl, latest.promptId, headers).catch(() => null);
            if (!recheck) {
              const ageMs = Date.now() - Date.parse(latest.createdAt);
              if (ageMs > 30000) {
                finish({
                  status: 'cancelled',
                  error: '任务已不在 ComfyUI 队列或历史记录中',
                });
              }
            }
          }
        }
      } catch (err) {
        // Keep polling on transient network hiccup unless older than 24h
        const ageMs = Date.now() - Date.parse(latest.createdAt);
        if (ageMs > 24 * 60 * 60 * 1000) {
          finish({ status: 'failed', error: err.message });
        }
      }
    };

    if (typeof globalThis.WebSocket === 'function') {
      try {
        const wsUrl = buildComfyWsUrl(job.baseUrl, job.clientId);
        ws = new globalThis.WebSocket(wsUrl);
        ws.addEventListener('message', (event) => {
          if (settled || typeof event.data !== 'string') return;
          try {
            const msg = JSON.parse(event.data);
            const data = msg?.data || {};
            if (data.prompt_id && data.prompt_id !== job.promptId) return;

            if (msg.type === 'execution_start') {
              this.store.upsertJob({
                id: jobId,
                status: 'running',
                updatedAt: new Date().toISOString(),
              });
            } else if (msg.type === 'executing') {
              if (data.node === null) {
                void checkHistoryAndCollect();
              } else {
                this.store.upsertJob({
                  id: jobId,
                  status: 'running',
                  currentNode: String(data.node),
                  updatedAt: new Date().toISOString(),
                });
              }
            } else if (msg.type === 'progress' && data.max > 0) {
              const ratio = Math.min(0.99, Math.max(0, Number(data.value) / Number(data.max)));
              this.store.upsertJob({
                id: jobId,
                status: 'running',
                progress: ratio,
                updatedAt: new Date().toISOString(),
              });
            } else if (msg.type === 'execution_error') {
              finish({
                status: 'failed',
                error: data.exception_message || 'ComfyUI 执行异常',
              });
            } else if (msg.type === 'execution_interrupted') {
              finish({
                status: 'cancelled',
                error: '任务已被中断',
              });
            } else if (msg.type === 'execution_success') {
              void checkHistoryAndCollect();
            }
          } catch {
            // ignore malformed ws message
          }
        });
        ws.addEventListener('error', () => {
          // polling fallback handles completion
        });
      } catch {
        // polling fallback handles completion
      }
    }

    pollTimer = setInterval(() => {
      void checkHistoryAndCollect();
    }, 1800);
    // Run an immediate check in case ComfyUI completed synchronously/quickly
    setTimeout(() => {
      void checkHistoryAndCollect();
    }, 500);

    this.watchers.set(jobId, { promise, cleanup });
    return promise;
  }

  async getJob({ jobId } = {}) {
    if (!jobId) {
      throw new Error('缺少 jobId');
    }
    const job = this.store.getJob(jobId);
    if (!job) {
      throw new Error(`找不到任务: ${jobId}`);
    }
    if (job.status === 'queued' || job.status === 'running') {
      const headers = await this._getAuthHeaders(this.store.getSnapshot().config.authHeaderName);
      this._watchJob(job.id, headers);
    }
    const outputs = this.store.getSnapshot().gallery.filter((g) => g.jobId === job.id);
    return { job: this.store.getJob(jobId), outputs };
  }

  async cancelJob({ jobId } = {}) {
    if (!jobId) {
      throw new Error('缺少 jobId');
    }
    const job = this.store.getJob(jobId);
    if (!job) {
      throw new Error(`找不到任务: ${jobId}`);
    }
    const headers = await this._getAuthHeaders(this.store.getSnapshot().config.authHeaderName);
    if (job.status === 'running' || job.status === 'queued') {
      await interruptComfy(job.baseUrl, headers).catch(() => {});
    }
    const watcher = this.watchers.get(jobId);
    if (watcher) {
      watcher.cleanup();
    }
    const updated = this.store.upsertJob({
      id: jobId,
      status: 'cancelled',
      error: '已手动取消',
      updatedAt: new Date().toISOString(),
    });
    return { job: updated };
  }

  async listHistory({ kind, query, limit = 40 } = {}) {
    const snap = this.store.getSnapshot();
    const q = String(query || '').trim().toLowerCase();
    const max = Math.min(200, Math.max(1, Number(limit) || 40));
    const items = snap.gallery.filter((item) => {
      if (kind && kind !== 'all' && item.kind !== kind && item.mediaType !== kind) return false;
      if (q) {
        const hay = `${item.prompt || ''} ${item.model || ''} ${item.preset || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    return {
      total: items.length,
      items: items.slice(0, max),
    };
  }

  async deleteHistoryItem({ id } = {}) {
    if (!id) {
      throw new Error('缺少作品 id');
    }
    const removed = this.store.deleteGalleryItem(id);
    if (!removed) {
      throw new Error(`找不到作品: ${id}`);
    }
    return { deleted: removed.id };
  }

  exportNotebook(options = {}) {
    const notebook = generateColabNotebook(options);
    const script = generateQuickLaunchScript(options);
    return {
      filename: 'colab-comfyui-ultra.ipynb',
      notebook,
      script,
    };
  }

  dispose() {
    this.disposed = true;
    for (const watcher of this.watchers.values()) {
      watcher.cleanup();
    }
    this.watchers.clear();
  }
}
