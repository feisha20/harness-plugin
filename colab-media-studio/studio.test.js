import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { createStudioHttpHandler } from './index.js';
import { StudioStore } from './store.js';
import { StudioService } from './studio.js';
import {
  applyCustomWorkflow,
  buildImageWorkflow,
  buildVideoWorkflow,
  normalizeDim,
  normalizeVideoFrames,
} from './workflows.js';

describe('colab-media-studio workflows & studio service', () => {
  let tmpDir;
  let server;
  let baseUrl;
  let uploadedCount = 0;
  let lastSubmittedPrompt = null;
  let mockHistory = {};
  let hasVhsNode = true;

  before(async () => {
    tmpDir = mkdtempSync(path.join(os.tmpdir(), 'cms-test-'));

    server = http.createServer(async (req, res) => {
      const url = new URL(req.url, 'http://127.0.0.1');
      if (req.method === 'GET' && url.pathname === '/system_stats') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            system: { comfyui_version: '0.3.26', python_version: '3.11.11' },
            devices: [
              {
                name: 'NVIDIA A100-SXM4-40GB',
                vram_total: 40 * 1024 * 1024 * 1024,
                vram_free: 36 * 1024 * 1024 * 1024,
              },
            ],
          }),
        );
        return;
      }

      if (req.method === 'GET' && url.pathname === '/queue') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ queue_running: [], queue_pending: [] }));
        return;
      }

      if (req.method === 'GET' && url.pathname.startsWith('/object_info/')) {
        const cls = decodeURIComponent(url.pathname.slice('/object_info/'.length));
        const catalog = {
          CheckpointLoaderSimple: {
            input: {
              required: {
                ckpt_name: [['flux1-schnell-fp8.safetensors', 'ltx-video-2b-v0.9.5.safetensors'], {}],
              },
            },
          },
          UNETLoader: {
            input: {
              required: {
                unet_name: [
                  'COMBO',
                  {
                    options: [
                      'wan2.1_t2v_1.3B_fp16.safetensors',
                      'wan2.1_i2v_480p_14B_fp8_e4m3fn.safetensors',
                      'flux1-dev-fp8.safetensors',
                    ],
                  },
                ],
                weight_dtype: [['default', 'fp8_e4m3fn'], {}],
              },
            },
          },
          VAELoader: {
            input: { required: { vae_name: [['wan_2.1_vae.safetensors', 'ae.safetensors'], {}] } },
          },
          CLIPLoader: {
            input: { required: { clip_name: [['umt5_xxl_fp8_e4m3fn_scaled.safetensors', 't5xxl_fp8_e4m3fn.safetensors'], {}] } },
          },
          DualCLIPLoader: {
            input: { required: { clip_name1: [['clip_l.safetensors'], {}], clip_name2: [['t5xxl_fp8_e4m3fn.safetensors'], {}] } },
          },
          CLIPVisionLoader: {
            input: { required: { clip_name: [['clip_vision_h.safetensors'], {}] } },
          },
          CLIPVisionEncode: {
            input: { required: { clip_vision: ['CLIP_VISION'], image: ['IMAGE'], crop: [['center', 'none'], {}] } },
          },
          LoraLoader: {
            input: { required: { lora_name: [['detail_slider.safetensors'], {}] } },
          },
          KSampler: {
            input: { required: { sampler_name: [['euler', 'uni_pc', 'dpmpp_2m'], {}], scheduler: [['simple', 'karras'], {}] } },
          },
          FluxGuidance: { input: { required: { guidance: ['FLOAT'] } } },
          ModelSamplingSD3: { input: { required: { shift: ['FLOAT'] } } },
          EmptyHunyuanLatentVideo: { input: { required: {} } },
          WanImageToVideo: { input: { required: {} } },
          EmptyLTXVLatentVideo: { input: { required: {} } },
          SaveWEBM: { input: { required: {} } },
          SaveAnimatedWEBP: { input: { required: {} } },
          ...(hasVhsNode ? { VHS_VideoCombine: { input: { required: {} } } } : {}),
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(catalog[cls] ? { [cls]: catalog[cls] } : {}));
        return;
      }

      if (req.method === 'POST' && url.pathname === '/upload/image') {
        for await (const _chunk of req) {
          // drain multipart body
        }
        uploadedCount += 1;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ name: `uploaded_${uploadedCount}.png`, subfolder: '', type: 'input' }));
        return;
      }

      if (req.method === 'POST' && url.pathname === '/prompt') {
        const chunks = [];
        for await (const c of req) chunks.push(c);
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        lastSubmittedPrompt = body.prompt;
        const promptId = `pid_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const isVideo = Object.values(body.prompt).some((n) =>
          ['VHS_VideoCombine', 'SaveWEBM', 'SaveAnimatedWEBP'].includes(n.class_type),
        );
        mockHistory[promptId] = {
          status: { status_str: 'success', completed: true, messages: [] },
          outputs: isVideo
            ? {
                '99': {
                  gifs: [{ filename: hasVhsNode ? 'out_video.mp4' : 'out_video.webm', subfolder: '', type: 'output' }],
                },
              }
            : {
                '99': {
                  images: [{ filename: 'out_image.png', subfolder: '', type: 'output' }],
                },
              },
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ prompt_id: promptId, number: 1 }));
        return;
      }

      if (req.method === 'GET' && url.pathname.startsWith('/history/')) {
        const pid = decodeURIComponent(url.pathname.slice('/history/'.length));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(mockHistory[pid] ? { [pid]: mockHistory[pid] } : {}));
        return;
      }

      if (req.method === 'GET' && url.pathname === '/view') {
        const filename = url.searchParams.get('filename') || '';
        res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
        res.end(Buffer.from(`MOCK_MEDIA_DATA:${filename}`));
        return;
      }

      res.writeHead(404);
      res.end();
    });

    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const addr = server.address();
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('connects to ComfyUI and parses both legacy and COMBO v3 node schemas', async () => {
    const studio = new StudioService(null, { baseDir: path.join(tmpDir, 's1') });
    const { capabilities } = await studio.connect({ comfyUrl: baseUrl });
    assert.equal(capabilities.system.deviceName, 'NVIDIA A100-SXM4-40GB');
    assert.equal(capabilities.system.vramTotalGb, 40);
    assert.deepEqual(capabilities.models.checkpoints, [
      'flux1-schnell-fp8.safetensors',
      'ltx-video-2b-v0.9.5.safetensors',
    ]);
    assert.ok(capabilities.models.unets.includes('wan2.1_t2v_1.3B_fp16.safetensors'));
    assert.equal(capabilities.nodes.VHS_VideoCombine, true);
    assert.equal(capabilities.clipVisionHasCrop, true);
    studio.dispose();
  });

  it('generates T2I & I2I images and archives outputs locally', async () => {
    const studio = new StudioService(null, { baseDir: path.join(tmpDir, 's2') });
    await studio.configure({ comfyUrl: baseUrl });

    const t2i = await studio.generate(
      { kind: 'image', preset: 'sd_checkpoint', prompt: 'cyberpunk glasshouse', width: 1020, height: 1024 },
      { wait: true, waitTimeoutMs: 10000 },
    );
    assert.equal(t2i.job.status, 'completed');
    assert.equal(t2i.job.width, 1024);
    assert.equal(t2i.outputs.length, 1);
    assert.equal(t2i.outputs[0].mediaType, 'image');
    assert.ok(existsSync(studio.store.resolveMediaPath('outputs', t2i.outputs[0].file)));

    // I2I using previously generated output id
    const i2i = await studio.generate(
      {
        kind: 'image',
        preset: 'sd_checkpoint',
        prompt: 'cyberpunk glasshouse sunset',
        inputImageId: t2i.outputs[0].id,
        denoise: 0.6,
      },
      { wait: true, waitTimeoutMs: 10000 },
    );
    assert.equal(i2i.job.status, 'completed');
    assert.equal(i2i.job.hasInputImage, true);
    assert.ok(uploadedCount >= 1);
    assert.ok(Object.values(lastSubmittedPrompt).some((n) => n.class_type === 'LoadImage'));
    studio.dispose();
  });

  it('normalizes 4k+1 video frames and generates Wan T2V/I2V & LTX-Video', async () => {
    assert.equal(normalizeDim(830, 832), 832);
    assert.equal(normalizeVideoFrames(48), 49);
    assert.equal(normalizeVideoFrames(33), 33);

    const studio = new StudioService(null, { baseDir: path.join(tmpDir, 's3') });
    await studio.connect({ comfyUrl: baseUrl });

    const wanT2v = await studio.generate(
      { kind: 'video', preset: 'wan_video', prompt: 'misty bamboo forest', frames: 50, fps: 16 },
      { wait: true, waitTimeoutMs: 10000 },
    );
    assert.equal(wanT2v.job.status, 'completed');
    assert.equal(wanT2v.job.frames, 49);
    assert.equal(wanT2v.outputs[0].mediaType, 'video');
    assert.equal(wanT2v.outputs[0].mimeType, 'video/mp4');
    assert.ok(Object.values(lastSubmittedPrompt).some((n) => n.class_type === 'VHS_VideoCombine'));

    // Build I2V & LTX graphs directly as well
    const wanI2vGraph = buildVideoWorkflow(
      {
        preset: 'wan_video',
        prompt: 'gentle wind',
        remoteInputImage: 'first_frame.png',
        clipVisionName: 'clip_vision_h.safetensors',
        frames: 33,
      },
      { nodes: { VHS_VideoCombine: false, SaveWEBM: true }, clipVisionHasCrop: true },
    );
    assert.ok(Object.values(wanI2vGraph.prompt).some((n) => n.class_type === 'WanImageToVideo'));
    assert.ok(Object.values(wanI2vGraph.prompt).some((n) => n.class_type === 'SaveWEBM'));

    const ltxGraph = buildVideoWorkflow({
      preset: 'ltx_video',
      prompt: 'ocean waves',
      remoteInputImage: 'start.png',
      frames: 49,
      fps: 24,
    });
    assert.ok(Object.values(ltxGraph.prompt).some((n) => n.class_type === 'LTXVImgToVideo'));
    assert.ok(Object.values(ltxGraph.prompt).some((n) => n.class_type === 'SamplerCustomAdvanced'));
    studio.dispose();
  });

  it('handles custom API workflow placeholders & heuristic mapping and rejects UI workflow format', () => {
    assert.throws(
      () => applyCustomWorkflow({ nodes: [], links: [] }, { prompt: 'hello' }),
      /Save \(API Format\)/,
    );

    const apiTemplate = {
      '1': { class_type: 'CLIPTextEncode', inputs: { text: '{{PROMPT}}' } },
      '2': { class_type: 'CLIPTextEncode', inputs: { text: 'old negative' } },
      '3': { class_type: 'KSampler', inputs: { positive: ['1', 0], negative: ['2', 0], seed: 100 } },
    };
    const res = applyCustomWorkflow(apiTemplate, {
      prompt: 'neon city',
      negativePrompt: 'blurry',
      seed: 4242,
    });
    assert.equal(res.prompt['1'].inputs.text, 'neon city');
    assert.equal(res.prompt['3'].inputs.seed, 4242);

    const imgGraph = buildImageWorkflow({
      preset: 'custom',
      customWorkflow: JSON.stringify(apiTemplate),
      prompt: 'forest',
      seed: 777,
    });
    assert.equal(imgGraph.prompt['1'].inputs.text, 'forest');
    assert.equal(imgGraph.prompt['3'].inputs.seed, 777);
  });

  it('exports valid Colab Ultra .ipynb notebook with verified weights', () => {
    const studio = new StudioService(null, { baseDir: path.join(tmpDir, 's4') });
    const exported = studio.exportNotebook({
      packs: ['flux_schnell', 'wan_t2v_14b'],
      mountDrive: true,
    });
    assert.equal(exported.notebook.nbformat, 4);
    assert.equal(exported.notebook.metadata.accelerator, 'GPU');
    assert.equal(exported.notebook.metadata.gpuClass, 'premium');
    const fullSource = exported.notebook.cells.map((c) => c.source.join('')).join('\n');
    assert.match(fullSource, /drive\.mount/);
    assert.match(fullSource, /flux1-schnell-fp8\.safetensors/);
    assert.match(fullSource, /wan2\.1_t2v_14B_fp8_e4m3fn\.safetensors/);
    assert.match(fullSource, /cloudflared/);
    studio.dispose();
  });

  it('rejects path traversal and enforces HTTP security checks', async () => {
    const store = new StudioStore(path.join(tmpDir, 's5'));
    assert.throws(() => store.resolveMediaPath('outputs', '../secret.json'), /无效的文件名/);
    assert.throws(() => store.resolveMediaPath('other', 'a.png'), /无效的媒体目录/);

    const studio = new StudioService(null, { store });
    const handler = createStudioHttpHandler(studio, () => 'http://127.0.0.1:62798');

    const mockServer = http.createServer(handler);
    await new Promise((resolve) => mockServer.listen(0, '127.0.0.1', resolve));
    const port = mockServer.address().port;

    const badOrigin = await fetch(`http://127.0.0.1:${port}/api/colab-media-studio/state`, {
      headers: { Origin: 'http://evil.example.com' },
    });
    assert.equal(badOrigin.status, 403);

    const okState = await fetch(`http://127.0.0.1:${port}/api/colab-media-studio/state`, {
      headers: { Origin: 'http://127.0.0.1:62798' },
    });
    assert.equal(okState.status, 200);
    const json = await okState.json();
    assert.ok(Array.isArray(json.modelPacks));

    await new Promise((resolve) => mockServer.close(resolve));
    studio.dispose();
  });
});
