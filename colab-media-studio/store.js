import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DEFAULT_CONFIG = {
  comfyUrl: '',
  authHeaderName: 'Authorization',
  defaults: {
    imagePreset: 'sd_checkpoint',
    videoPreset: 'wan_video',
    width: 1024,
    height: 1024,
    videoWidth: 832,
    videoHeight: 480,
    frames: 49,
    fps: 16,
  },
};

function createEmptyState() {
  return {
    version: 1,
    config: structuredClone(DEFAULT_CONFIG),
    lastCapabilities: null,
    uploads: [],
    jobs: [],
    gallery: [],
  };
}

function mergeConfig(base, patch) {
  return {
    comfyUrl: typeof patch?.comfyUrl === 'string' ? patch.comfyUrl : base.comfyUrl,
    authHeaderName:
      typeof patch?.authHeaderName === 'string' && patch.authHeaderName.trim()
        ? patch.authHeaderName.trim()
        : base.authHeaderName,
    defaults: {
      ...base.defaults,
      ...(patch?.defaults && typeof patch.defaults === 'object' ? patch.defaults : {}),
    },
  };
}

export class StudioStore {
  constructor(baseDir = fileURLToPath(new URL('./.local', import.meta.url))) {
    this.baseDir = path.resolve(baseDir);
    this.outputsDir = path.join(this.baseDir, 'outputs');
    this.uploadsDir = path.join(this.baseDir, 'uploads');
    this.statePath = path.join(this.baseDir, 'state.json');

    mkdirSync(this.outputsDir, { recursive: true });
    mkdirSync(this.uploadsDir, { recursive: true });

    this.state = this._load();
  }

  _load() {
    if (!existsSync(this.statePath)) {
      return createEmptyState();
    }
    try {
      const raw = JSON.parse(readFileSync(this.statePath, 'utf8'));
      const base = createEmptyState();
      const loaded = {
        version: 1,
        config: mergeConfig(base.config, raw?.config),
        lastCapabilities: raw?.lastCapabilities || null,
        uploads: Array.isArray(raw?.uploads) ? raw.uploads.slice(0, 100) : [],
        jobs: Array.isArray(raw?.jobs) ? raw.jobs.slice(0, 50) : [],
        gallery: Array.isArray(raw?.gallery) ? raw.gallery.slice(0, 200) : [],
      };
      let changed = false;
      for (const job of loaded.jobs) {
        if (job && (job.status === 'queued' || job.status === 'running')) {
          job.status = 'interrupted';
          job.error = '宿主重启导致监听中断，请重新检查或提交';
          job.updatedAt = new Date().toISOString();
          changed = true;
        }
      }
      if (changed) {
        this._persist(loaded);
      }
      return loaded;
    } catch {
      return createEmptyState();
    }
  }

  _persist(target = this.state) {
    mkdirSync(this.baseDir, { recursive: true });
    const tmp = `${this.statePath}.${process.pid}.tmp`;
    writeFileSync(tmp, JSON.stringify(target, null, 2), { mode: 0o600 });
    renameSync(tmp, this.statePath);
  }

  getSnapshot() {
    return structuredClone(this.state);
  }

  updateConfig(patch) {
    this.state.config = mergeConfig(this.state.config, patch);
    this._persist();
    return structuredClone(this.state.config);
  }

  setCapabilities(capabilities) {
    this.state.lastCapabilities = capabilities;
    this._persist();
  }

  addUpload(item) {
    this.state.uploads = [item, ...this.state.uploads].slice(0, 100);
    this._persist();
    return item;
  }

  getUpload(id) {
    return this.state.uploads.find((u) => u.id === id) || null;
  }

  upsertJob(job) {
    const idx = this.state.jobs.findIndex((j) => j.id === job.id);
    if (idx >= 0) {
      this.state.jobs[idx] = { ...this.state.jobs[idx], ...job };
    } else {
      this.state.jobs = [job, ...this.state.jobs].slice(0, 50);
    }
    this._persist();
    return this.getJob(job.id);
  }

  getJob(id) {
    const job = this.state.jobs.find((j) => j.id === id);
    return job ? structuredClone(job) : null;
  }

  addGalleryItems(items) {
    if (!Array.isArray(items) || items.length === 0) return [];
    this.state.gallery = [...items, ...this.state.gallery].slice(0, 200);
    this._persist();
    return items;
  }

  deleteGalleryItem(id) {
    const idx = this.state.gallery.findIndex((item) => item.id === id);
    if (idx < 0) return null;
    const [removed] = this.state.gallery.splice(idx, 1);
    this._persist();
    if (removed?.file) {
      try {
        const filePath = this.resolveMediaPath('outputs', removed.file);
        if (existsSync(filePath)) unlinkSync(filePath);
      } catch {
        // ignore missing or unsafe file path
      }
    }
    return removed;
  }

  resolveMediaPath(bucket, filename) {
    if (bucket !== 'outputs' && bucket !== 'uploads') {
      throw new Error('无效的媒体目录');
    }
    if (
      typeof filename !== 'string' ||
      filename.length === 0 ||
      filename.includes('..') ||
      filename.includes('/') ||
      filename.includes('\\') ||
      path.basename(filename) !== filename
    ) {
      throw new Error('无效的文件名');
    }
    const rootDir = bucket === 'outputs' ? this.outputsDir : this.uploadsDir;
    const resolved = path.resolve(rootDir, filename);
    const prefix = rootDir.endsWith(path.sep) ? rootDir : rootDir + path.sep;
    if (!resolved.startsWith(prefix)) {
      throw new Error('非法的媒体路径');
    }
    return resolved;
  }

  writeMediaBuffer(bucket, filename, buffer) {
    const filePath = this.resolveMediaPath(bucket, filename);
    writeFileSync(filePath, buffer);
    return filePath;
  }
}
