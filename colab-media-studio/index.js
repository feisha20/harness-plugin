import { createReadStream, statSync } from 'node:fs';
import path from 'node:path';
import { StudioService } from './studio.js';

export const inject = ['webServer', 'tools'];

const API_PREFIX = '/api/colab-media-studio';

const MIME_MAP = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
};

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(body));
}

async function readJsonBody(req, maxBytes = 256 * 1024) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) {
      throw new Error('请求体超出大小限制');
    }
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('请求体不是有效的 JSON');
  }
}

function parseRangeHeader(rangeHeader, totalSize) {
  if (!rangeHeader || !rangeHeader.startsWith('bytes=')) return null;
  const spec = rangeHeader.slice(6).split(',')[0].trim();
  const [startStr, endStr] = spec.split('-');
  let start = startStr === '' ? NaN : Number(startStr);
  let end = endStr === '' ? totalSize - 1 : Number(endStr);

  if (Number.isNaN(start) && !Number.isNaN(end)) {
    start = Math.max(0, totalSize - end);
    end = totalSize - 1;
  }
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || start > end || end >= totalSize) {
    return { invalid: true };
  }
  return { start, end };
}

function serveMediaFile(req, res, studio, query) {
  const bucket = query.get('bucket') || 'outputs';
  const file = query.get('file') || '';
  const download = query.get('download') === '1';

  let filePath;
  try {
    filePath = studio.store.resolveMediaPath(bucket, file);
  } catch (err) {
    return sendJson(res, 400, { error: err.message });
  }

  let stat;
  try {
    stat = statSync(filePath);
    if (!stat.isFile()) {
      return sendJson(res, 404, { error: '文件不存在' });
    }
  } catch {
    return sendJson(res, 404, { error: '文件不存在' });
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_MAP[ext] || 'application/octet-stream';
  const commonHeaders = {
    'Content-Type': contentType,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=3600',
    'X-Content-Type-Options': 'nosniff',
    ...(download ? { 'Content-Disposition': `attachment; filename="${path.basename(filePath)}"` } : {}),
  };

  const range = parseRangeHeader(req.headers.range, stat.size);
  if (range?.invalid) {
    res.writeHead(416, {
      'Content-Range': `bytes */${stat.size}`,
      'X-Content-Type-Options': 'nosniff',
    });
    res.end();
    return;
  }

  if (range) {
    const chunkLen = range.end - range.start + 1;
    res.writeHead(206, {
      ...commonHeaders,
      'Content-Range': `bytes ${range.start}-${range.end}/${stat.size}`,
      'Content-Length': String(chunkLen),
    });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    createReadStream(filePath, { start: range.start, end: range.end }).pipe(res);
    return;
  }

  res.writeHead(200, {
    ...commonHeaders,
    'Content-Length': String(stat.size),
  });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  createReadStream(filePath).pipe(res);
}

export function createStudioHttpHandler(studio, getExpectedOrigin) {
  return async function handleStudioHttp(req, res) {
    if (req.headers['sec-fetch-site'] === 'cross-site') {
      return sendJson(res, 403, { error: '禁止跨站访问' });
    }
    if (req.headers.origin && getExpectedOrigin) {
      const expected = getExpectedOrigin();
      if (expected && req.headers.origin !== expected) {
        return sendJson(res, 403, { error: '请从 DSH 面板访问' });
      }
    }

    const url = new URL(req.url || '/', 'http://localhost');
    let subpath = url.pathname;
    if (subpath.startsWith(API_PREFIX)) {
      subpath = subpath.slice(API_PREFIX.length) || '/';
    }

    try {
      if (req.method === 'GET' && subpath === '/state') {
        return sendJson(res, 200, await studio.getState());
      }

      if (req.method === 'POST' && subpath === '/config') {
        const body = await readJsonBody(req);
        const result = await studio.configure(body);
        if (Object.hasOwn(body, 'authToken')) {
          const authRes = await studio.setAuthToken({ token: body.authToken });
          result.hasAuthToken = authRes.hasAuthToken;
        }
        return sendJson(res, 200, result);
      }

      if (req.method === 'POST' && subpath === '/connect') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, await studio.connect(body));
      }

      if (req.method === 'POST' && subpath === '/upload') {
        const body = await readJsonBody(req, 30 * 1024 * 1024);
        return sendJson(res, 200, await studio.saveUpload(body));
      }

      if (req.method === 'POST' && subpath === '/generate') {
        const body = await readJsonBody(req, 30 * 1024 * 1024);
        return sendJson(res, 200, await studio.generate(body, { wait: false }));
      }

      if (req.method === 'GET' && subpath === '/job') {
        const jobId = url.searchParams.get('id');
        return sendJson(res, 200, await studio.getJob({ jobId }));
      }

      if (req.method === 'POST' && subpath === '/cancel') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, await studio.cancelJob(body));
      }

      if (req.method === 'GET' && subpath === '/history') {
        const kind = url.searchParams.get('kind') || 'all';
        const query = url.searchParams.get('query') || '';
        const limit = Number(url.searchParams.get('limit') || 40);
        return sendJson(res, 200, await studio.listHistory({ kind, query, limit }));
      }

      if (req.method === 'POST' && subpath === '/delete') {
        const body = await readJsonBody(req);
        return sendJson(res, 200, await studio.deleteHistoryItem(body));
      }

      if (req.method === 'GET' && subpath === '/notebook') {
        const packsParam = url.searchParams.get('packs') || '';
        const packs = packsParam
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        const mountDrive = url.searchParams.get('mountDrive') !== '0';
        const exported = studio.exportNotebook({ packs, mountDrive });

        if (url.searchParams.get('download') === '1') {
          const payload = JSON.stringify(exported.notebook, null, 2);
          res.writeHead(200, {
            'Content-Type': 'application/x-ipynb+json; charset=utf-8',
            'Content-Disposition': `attachment; filename="${exported.filename}"`,
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff',
          });
          res.end(payload);
          return;
        }
        return sendJson(res, 200, exported);
      }

      if ((req.method === 'GET' || req.method === 'HEAD') && subpath === '/media') {
        return serveMediaFile(req, res, studio, url.searchParams);
      }

      return sendJson(res, 404, { error: '接口路径不存在' });
    } catch (err) {
      const msg = err?.message || '操作失败';
      const status = msg.includes('请求体超出') ? 413 : 400;
      return sendJson(res, status, { error: msg });
    }
  };
}

export function apply(ctx) {
  const studio = new StudioService(ctx);
  ctx.effect(() => () => studio.dispose());

  ctx.effect(() =>
    ctx.tools.register({
      name: 'colab_comfy_studio',
      description:
        '管理 Google Colab Ultra 远程 ComfyUI 影像工坊：配置连接地址、探测可用模型、生成图片(文生图/图生图)、生成视频(文生视频/图生视频)、查询任务进度、查看本地作品库以及导出 Colab 启动笔记本。',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: [
              'status',
              'configure',
              'connect',
              'generate_image',
              'generate_video',
              'job_status',
              'cancel_job',
              'history',
              'delete_item',
              'export_notebook',
            ],
            description: '要执行的操作类型',
          },
          comfyUrl: {
            type: 'string',
            description: 'ComfyUI 地址，如 https://xxxx.trycloudflare.com 或 http://127.0.0.1:8188',
          },
          prompt: {
            type: 'string',
            description: '正向生成提示词（generate_image / generate_video 时必填）',
          },
          negativePrompt: {
            type: 'string',
            description: '反向提示词',
          },
          preset: {
            type: 'string',
            description:
              '生图预设: sd_checkpoint | flux_unet | custom；生视频预设: wan_video | ltx_video | custom',
          },
          ckptName: { type: 'string', description: 'Checkpoint 模型文件名' },
          unetName: { type: 'string', description: 'UNET 模型文件名（FLUX / Wan 视频）' },
          clipName: { type: 'string', description: 'CLIP/Text Encoder 模型文件名' },
          vaeName: { type: 'string', description: 'VAE 模型文件名' },
          clipVisionName: { type: 'string', description: 'CLIP Vision 文件名（Wan 图生视频）' },
          loraName: { type: 'string', description: 'LoRA 文件名' },
          width: { type: 'number', description: '输出宽度（16 的倍数）' },
          height: { type: 'number', description: '输出高度（16 的倍数）' },
          frames: { type: 'number', description: '视频总帧数（建议 33 / 49 / 81，自动对齐 4k+1）' },
          fps: { type: 'number', description: '视频帧率，默认 Wan=16 / LTX=24' },
          steps: { type: 'number', description: '采样步数' },
          cfg: { type: 'number', description: 'CFG 引导强度' },
          seed: { type: 'number', description: '随机种子（-1 或省略表示随机）' },
          inputImageId: { type: 'string', description: '已上传参考图或作品库图片 ID（图生图/图生视频）' },
          denoise: { type: 'number', description: '图生图重绘幅度 (0.05-1.0)' },
          customWorkflow: { type: 'string', description: '自定义 ComfyUI Save (API Format) JSON 字符串' },
          wait: { type: 'boolean', description: '是否等待任务完成并下载结果，默认 true' },
          jobId: { type: 'string', description: '任务 ID（job_status / cancel_job 时必填）' },
          id: { type: 'string', description: '作品 ID（delete_item 时必填）' },
          kind: { type: 'string', enum: ['all', 'image', 'video'], description: '作品筛选类型' },
          query: { type: 'string', description: '作品关键词筛选' },
          limit: { type: 'number', description: '返回作品上限' },
          packs: {
            type: 'array',
            items: { type: 'string' },
            description: '导出 Colab Notebook 时预选的模型包 ID 列表',
          },
          mountDrive: { type: 'boolean', description: '导出 Colab Notebook 时是否挂载 Google Drive' },
        },
        required: ['action'],
        additionalProperties: false,
      },
      output: {
        schema: { type: 'object' },
        render: (_, value) => [{ type: 'text', text: JSON.stringify(value) }],
      },
      async execute(args, runCtx) {
        switch (args.action) {
          case 'status':
            return studio.getState();
          case 'configure':
            return studio.configure({ comfyUrl: args.comfyUrl });
          case 'connect':
            return studio.connect({ comfyUrl: args.comfyUrl });
          case 'generate_image':
            return studio.generate(
              { ...args, kind: 'image' },
              { wait: args.wait !== false, signal: runCtx?.signal },
            );
          case 'generate_video':
            return studio.generate(
              { ...args, kind: 'video' },
              { wait: args.wait !== false, signal: runCtx?.signal },
            );
          case 'job_status':
            return studio.getJob({ jobId: args.jobId });
          case 'cancel_job':
            return studio.cancelJob({ jobId: args.jobId });
          case 'history':
            return studio.listHistory({ kind: args.kind, query: args.query, limit: args.limit });
          case 'delete_item':
            return studio.deleteHistoryItem({ id: args.id });
          case 'export_notebook':
            return studio.exportNotebook({ packs: args.packs, mountDrive: args.mountDrive });
          default:
            throw new Error(`未知操作: ${args.action}`);
        }
      },
    }),
  );

  const handler = createStudioHttpHandler(studio, () => ctx.webServer.getOrigin());
  ctx.effect(() =>
    ctx.webServer.register({
      kind: 'prefix',
      path: API_PREFIX,
      handler,
    }),
  );
}
