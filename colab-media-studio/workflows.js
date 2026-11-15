const DEFAULT_WAN_NEGATIVE =
  'Bright tones, overexposed, static, blurred details, subtitles, style, works, paintings, images, static, overall gray, worst quality, low quality, JPEG compression residue, ugly, incomplete, extra fingers, poorly drawn hands, poorly drawn faces, deformed, disfigured, misshapen limbs, fused fingers, still picture, messy background, three legs, many people in the background, walking backwards';

export function clamp(val, min, max, fallback) {
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function normalizeDim(val, fallback = 1024, min = 256, max = 2048) {
  const clamped = clamp(val, min, max, fallback);
  return Math.max(min, Math.min(max, Math.round(clamped / 16) * 16));
}

export function normalizeVideoFrames(val, fallback = 49) {
  const clamped = Math.round(clamp(val, 9, 161, fallback));
  const snapped = 4 * Math.round((clamped - 1) / 4) + 1;
  return Math.max(9, Math.min(161, snapped));
}

export function resolveSeed(seed) {
  if (seed !== undefined && seed !== null && seed !== '') {
    const n = Number(seed);
    if (Number.isFinite(n) && n >= 0) {
      return Math.floor(n);
    }
  }
  return Math.floor(Math.random() * 281474976710655) + 1;
}

function chooseUnetWeightDtype(unetName, capabilities) {
  const allowed = Array.isArray(capabilities?.unetWeightDtypes) ? capabilities.unetWeightDtypes : [];
  if (/fp8/i.test(String(unetName || ''))) {
    if (allowed.length === 0 || allowed.includes('fp8_e4m3fn')) {
      return 'fp8_e4m3fn';
    }
  }
  return allowed.includes('default') || allowed.length === 0 ? 'default' : allowed[0];
}

function pickFirst(list, regex, fallback = '') {
  if (!Array.isArray(list) || list.length === 0) return fallback;
  if (regex) {
    const hit = list.find((item) => regex.test(String(item)));
    if (hit) return hit;
  }
  return list[0];
}

function createGraphBuilder() {
  let seq = 1;
  const graph = {};
  function add(classType, inputs, title) {
    const id = String(seq++);
    graph[id] = {
      class_type: classType,
      inputs,
      ...(title ? { _meta: { title } } : {}),
    };
    return id;
  }
  return { graph, add };
}

function attachVideoSaver(add, imagesRef, prefix, fps, capabilities) {
  const nodes = capabilities?.nodes || {};
  const numericFps = Math.round(clamp(fps, 1, 60, 16));
  if (nodes.VHS_VideoCombine) {
    return add(
      'VHS_VideoCombine',
      {
        images: imagesRef,
        frame_rate: numericFps,
        loop_count: 0,
        filename_prefix: prefix,
        format: 'video/h264-mp4',
        pix_fmt: 'yuv420p',
        crf: 19,
        save_metadata: true,
        trim_to_audio: false,
        pingpong: false,
        save_output: true,
      },
      'Save MP4 Video (VHS)',
    );
  }
  if (nodes.SaveWEBM !== false) {
    return add(
      'SaveWEBM',
      {
        images: imagesRef,
        filename_prefix: prefix,
        codec: 'vp9',
        fps: numericFps,
        crf: 24.0,
      },
      'Save WebM Video',
    );
  }
  return add(
    'SaveAnimatedWEBP',
    {
      images: imagesRef,
      filename_prefix: prefix,
      fps: numericFps,
      lossless: false,
      quality: 88,
      method: 'default',
    },
    'Save Animated WebP',
  );
}

export function applyCustomWorkflow(rawWorkflow, params = {}) {
  let parsed = rawWorkflow;
  if (typeof rawWorkflow === 'string') {
    const trimmed = rawWorkflow.trim();
    if (!trimmed) {
      throw new Error('自定义 API 工作流 JSON 不能为空');
    }
    try {
      parsed = JSON.parse(trimmed);
    } catch (err) {
      throw new Error(`自定义工作流 JSON 解析失败: ${err.message}`);
    }
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('自定义工作流必须是有效的 JSON 对象');
  }
  if (Array.isArray(parsed.nodes) && Array.isArray(parsed.links)) {
    throw new Error('检测到 ComfyUI 编辑器格式 JSON；请在 ComfyUI 中选择 "Save (API Format)" 导出 API 工作流');
  }

  const entries = Object.entries(parsed);
  if (entries.length === 0) {
    throw new Error('自定义工作流不包含任何节点');
  }

  const graph = structuredClone(parsed);
  const seed = resolveSeed(params.seed);
  const promptText = typeof params.prompt === 'string' ? params.prompt : '';
  const negativeText = typeof params.negativePrompt === 'string' ? params.negativePrompt : '';
  const width = params.width ? normalizeDim(params.width, 1024) : undefined;
  const height = params.height ? normalizeDim(params.height, 1024) : undefined;
  const frames = params.frames ? normalizeVideoFrames(params.frames, 49) : undefined;
  const fps = params.fps ? Math.round(clamp(params.fps, 1, 60, 16)) : undefined;

  const tokens = {
    '{{PROMPT}}': promptText,
    '{{NEGATIVE_PROMPT}}': negativeText,
    '{{SEED}}': seed,
    '{{IMAGE}}': params.remoteInputImage || '',
    '{{WIDTH}}': width,
    '{{HEIGHT}}': height,
    '{{FRAMES}}': frames,
    '{{FPS}}': fps,
  };

  let replacedPromptToken = false;
  let replacedSeedToken = false;
  let replacedImageToken = false;

  const replaceValue = (val) => {
    if (typeof val !== 'string') return val;
    if (Object.hasOwn(tokens, val)) {
      const target = tokens[val];
      if (val === '{{PROMPT}}') replacedPromptToken = true;
      if (val === '{{SEED}}') replacedSeedToken = true;
      if (val === '{{IMAGE}}') replacedImageToken = true;
      return target !== undefined ? target : val;
    }
    let next = val;
    for (const [token, rep] of Object.entries(tokens)) {
      if (rep === undefined) continue;
      if (next.includes(token)) {
        if (token === '{{PROMPT}}') replacedPromptToken = true;
        if (token === '{{SEED}}') replacedSeedToken = true;
        if (token === '{{IMAGE}}') replacedImageToken = true;
        next = next.replaceAll(token, String(rep));
      }
    }
    return next;
  };

  for (const node of Object.values(graph)) {
    if (!node || typeof node !== 'object' || !node.class_type || !node.inputs || typeof node.inputs !== 'object') {
      throw new Error('自定义工作流包含无效节点（缺少 class_type 或 inputs），请使用 Save (API Format)');
    }
    for (const [k, v] of Object.entries(node.inputs)) {
      if (typeof v === 'string') {
        node.inputs[k] = replaceValue(v);
      } else if (Array.isArray(v)) {
        node.inputs[k] = v.map((item) => (typeof item === 'string' ? replaceValue(item) : item));
      }
    }
  }

  // Heuristic overrides when explicit {{...}} placeholders were not used
  if (!replacedPromptToken && promptText) {
    const posNodeIds = new Set();
    const negNodeIds = new Set();
    for (const node of Object.values(graph)) {
      if (Array.isArray(node.inputs?.positive) && typeof node.inputs.positive[0] === 'string') {
        posNodeIds.add(node.inputs.positive[0]);
      }
      if (Array.isArray(node.inputs?.negative) && typeof node.inputs.negative[0] === 'string') {
        negNodeIds.add(node.inputs.negative[0]);
      }
    }
    for (const id of posNodeIds) {
      const n = graph[id];
      if (n?.inputs && typeof n.inputs.text === 'string') {
        n.inputs.text = promptText;
      }
    }
    if (negativeText) {
      for (const id of negNodeIds) {
        const n = graph[id];
        if (n?.inputs && typeof n.inputs.text === 'string') {
          n.inputs.text = negativeText;
        }
      }
    }
  }

  if (!replacedSeedToken) {
    for (const node of Object.values(graph)) {
      if ((node.class_type === 'KSampler' || node.class_type === 'KSamplerAdvanced') && 'seed' in node.inputs) {
        node.inputs.seed = seed;
      }
      if (node.class_type === 'RandomNoise' && 'noise_seed' in node.inputs) {
        node.inputs.noise_seed = seed;
      }
    }
  }

  if (!replacedImageToken && params.remoteInputImage) {
    for (const node of Object.values(graph)) {
      if (node.class_type === 'LoadImage' && 'image' in node.inputs) {
        node.inputs.image = params.remoteInputImage;
        break;
      }
    }
  }

  return { prompt: graph, resolvedSeed: seed };
}

export function buildImageWorkflow(params = {}, capabilities = null) {
  const preset = params.preset || 'sd_checkpoint';
  if (preset === 'custom') {
    const custom = applyCustomWorkflow(params.customWorkflow, params);
    return {
      ...custom,
      preset: 'custom',
      width: normalizeDim(params.width, 1024),
      height: normalizeDim(params.height, 1024),
      modelUsed: 'custom',
    };
  }

  const promptText = String(params.prompt || '').trim();
  if (!promptText) {
    throw new Error('请输入生图提示词 (Prompt)');
  }

  const models = capabilities?.models || {};
  const nodes = capabilities?.nodes || {};
  const width = normalizeDim(params.width, 1024);
  const height = normalizeDim(params.height, 1024);
  const batchSize = Math.round(clamp(params.batchSize, 1, 4, 1));
  const seed = resolveSeed(params.seed);
  const negativePrompt = String(params.negativePrompt || '').trim();
  const { graph, add } = createGraphBuilder();

  let modelRef;
  let clipRef;
  let vaeRef;
  let isFlux = preset === 'flux_unet';
  let modelUsed = '';

  if (preset === 'flux_unet') {
    const unetName =
      String(params.unetName || '').trim() || pickFirst(models.unets, /flux/i, 'flux1-dev-fp8.safetensors');
    const clipName1 =
      String(params.clipName1 || '').trim() || pickFirst(models.clips, /clip_l/i, 'clip_l.safetensors');
    const clipName2 =
      String(params.clipName2 || '').trim() || pickFirst(models.clips, /t5xxl/i, 't5xxl_fp8_e4m3fn.safetensors');
    const vaeName = String(params.vaeName || '').trim() || pickFirst(models.vaes, /ae\.safetensors/i, 'ae.safetensors');

    const unetId = add('UNETLoader', {
      unet_name: unetName,
      weight_dtype: chooseUnetWeightDtype(unetName, capabilities),
    });
    const dualClipId = add('DualCLIPLoader', {
      clip_name1: clipName1,
      clip_name2: clipName2,
      type: 'flux',
    });
    const vaeId = add('VAELoader', { vae_name: vaeName });

    modelRef = [unetId, 0];
    clipRef = [dualClipId, 0];
    vaeRef = [vaeId, 0];
    modelUsed = unetName;
  } else {
    const ckptName =
      String(params.ckptName || '').trim() ||
      pickFirst(models.checkpoints, /flux1-schnell|flux|sd_xl|sdxl/i, 'flux1-schnell-fp8.safetensors');
    if (/flux/i.test(ckptName)) {
      isFlux = true;
    }
    const ckptId = add('CheckpointLoaderSimple', { ckpt_name: ckptName });
    modelRef = [ckptId, 0];
    clipRef = [ckptId, 1];
    vaeRef = [ckptId, 2];
    modelUsed = ckptName;
  }

  const loraName = String(params.loraName || '').trim();
  if (loraName) {
    const loraStrength = clamp(params.loraStrength, -2, 2, 0.85);
    const loraId = add('LoraLoader', {
      model: modelRef,
      clip: clipRef,
      lora_name: loraName,
      strength_model: loraStrength,
      strength_clip: loraStrength,
    });
    modelRef = [loraId, 0];
    clipRef = [loraId, 1];
  }

  const posId = add('CLIPTextEncode', { text: promptText, clip: clipRef }, 'Positive Prompt');
  const negId = add('CLIPTextEncode', { text: negativePrompt, clip: clipRef }, 'Negative Prompt');

  let positiveRef = [posId, 0];
  const fluxGuidance = Number(params.fluxGuidance);
  if (
    nodes.FluxGuidance &&
    Number.isFinite(fluxGuidance) &&
    fluxGuidance > 0 &&
    (isFlux || Number(params.cfg) === 1)
  ) {
    const fgId = add('FluxGuidance', {
      conditioning: positiveRef,
      guidance: clamp(fluxGuidance, 0.5, 20, 3.5),
    });
    positiveRef = [fgId, 0];
  }

  let latentRef;
  let denoise = 1.0;
  if (params.remoteInputImage) {
    const loadId = add('LoadImage', { image: params.remoteInputImage });
    const encodeId = add('VAEEncode', { pixels: [loadId, 0], vae: vaeRef });
    latentRef = [encodeId, 0];
    denoise = clamp(params.denoise, 0.05, 1.0, 0.65);
  } else {
    const emptyId = add('EmptyLatentImage', { width, height, batch_size: batchSize });
    latentRef = [emptyId, 0];
  }

  const defaultSteps = isFlux ? (/schnell/i.test(modelUsed) ? 4 : 20) : 24;
  const defaultCfg = isFlux ? 1.0 : 6.5;
  const steps = Math.round(clamp(params.steps, 1, 100, defaultSteps));
  const cfg = clamp(params.cfg, 0.5, 30, defaultCfg);
  const samplerName = String(params.sampler || (isFlux ? 'euler' : 'dpmpp_2m')).trim();
  const scheduler = String(params.scheduler || (isFlux ? 'simple' : 'karras')).trim();

  const samplerId = add('KSampler', {
    model: modelRef,
    positive: positiveRef,
    negative: [negId, 0],
    latent_image: latentRef,
    seed,
    steps,
    cfg,
    sampler_name: samplerName,
    scheduler,
    denoise,
  });

  const decodeId = add('VAEDecode', { samples: [samplerId, 0], vae: vaeRef });
  add('SaveImage', { images: [decodeId, 0], filename_prefix: 'dsh_img' });

  return {
    prompt: graph,
    preset,
    resolvedSeed: seed,
    width,
    height,
    steps,
    cfg,
    modelUsed,
  };
}

export function buildVideoWorkflow(params = {}, capabilities = null) {
  const preset = params.preset || 'wan_video';
  if (preset === 'custom') {
    const custom = applyCustomWorkflow(params.customWorkflow, params);
    return {
      ...custom,
      preset: 'custom',
      width: normalizeDim(params.width, 832, 256, 1536),
      height: normalizeDim(params.height, 480, 256, 1536),
      frames: normalizeVideoFrames(params.frames, 49),
      fps: Math.round(clamp(params.fps, 1, 60, 16)),
      modelUsed: 'custom',
    };
  }

  const promptText = String(params.prompt || '').trim();
  if (!promptText) {
    throw new Error('请输入视频生成提示词 (Prompt)');
  }

  const models = capabilities?.models || {};
  const nodes = capabilities?.nodes || {};
  const width = normalizeDim(params.width, 832, 256, 1536);
  const height = normalizeDim(params.height, 480, 256, 1536);
  const frames = normalizeVideoFrames(params.frames, 49);
  const fps = Math.round(clamp(params.fps, 1, 60, preset === 'ltx_video' ? 24 : 16));
  const seed = resolveSeed(params.seed);
  const { graph, add } = createGraphBuilder();

  if (preset === 'ltx_video') {
    const ckptName =
      String(params.ckptName || '').trim() ||
      pickFirst(models.checkpoints, /ltx-video/i, 'ltx-video-2b-v0.9.5.safetensors');
    const clipName =
      String(params.clipName || '').trim() ||
      pickFirst(models.clips, /t5xxl/i, 't5xxl_fp8_e4m3fn.safetensors');
    const steps = Math.round(clamp(params.steps, 4, 80, 25));
    const cfg = clamp(params.cfg, 0.5, 20, 3.0);
    const samplerName = String(params.sampler || 'euler').trim();
    const negativePrompt = String(params.negativePrompt || '').trim() || 'low quality, worst quality, deformed, jittery, noisy, artifacts';

    const ckptId = add('CheckpointLoaderSimple', { ckpt_name: ckptName });
    const clipId = add('CLIPLoader', { clip_name: clipName, type: 'ltxv' });
    const posId = add('CLIPTextEncode', { text: promptText, clip: [clipId, 0] }, 'Positive Prompt');
    const negId = add('CLIPTextEncode', { text: negativePrompt, clip: [clipId, 0] }, 'Negative Prompt');
    const condId = add('LTXVConditioning', {
      positive: [posId, 0],
      negative: [negId, 0],
      frame_rate: fps,
    });

    let latentRef;
    let positiveRef = [condId, 0];
    let negativeRef = [condId, 1];
    if (params.remoteInputImage) {
      const loadId = add('LoadImage', { image: params.remoteInputImage });
      const i2vId = add('LTXVImgToVideo', {
        positive: positiveRef,
        negative: negativeRef,
        vae: [ckptId, 2],
        image: [loadId, 0],
        width,
        height,
        length: frames,
        batch_size: 1,
        strength: clamp(params.strength, 0.05, 1.0, 0.9),
      });
      positiveRef = [i2vId, 0];
      negativeRef = [i2vId, 1];
      latentRef = [i2vId, 2];
    } else {
      const emptyId = add('EmptyLTXVLatentVideo', { width, height, length: frames, batch_size: 1 });
      latentRef = [emptyId, 0];
    }

    const schedId = add('LTXVScheduler', {
      steps,
      max_shift: 2.05,
      base_shift: 0.95,
      stretch: true,
      terminal: 0.1,
      latent: latentRef,
    });
    const kselId = add('KSamplerSelect', { sampler_name: samplerName });
    const noiseId = add('RandomNoise', { noise_seed: seed });
    const guiderId = add('CFGGuider', {
      model: [ckptId, 0],
      positive: positiveRef,
      negative: negativeRef,
      cfg,
    });
    const advId = add('SamplerCustomAdvanced', {
      noise: [noiseId, 0],
      guider: [guiderId, 0],
      sampler: [kselId, 0],
      sigmas: [schedId, 0],
      latent_image: latentRef,
    });
    const decodeId = add('VAEDecode', { samples: [advId, 0], vae: [ckptId, 2] });
    attachVideoSaver(add, [decodeId, 0], 'dsh_ltx_vid', fps, capabilities);

    return {
      prompt: graph,
      preset,
      resolvedSeed: seed,
      width,
      height,
      frames,
      fps,
      steps,
      cfg,
      modelUsed: ckptName,
    };
  }

  // Default: Wan 2.1 / 2.2 T2V or I2V
  const isI2V = Boolean(params.remoteInputImage);
  const unetName =
    String(params.unetName || '').trim() ||
    (isI2V
      ? pickFirst(models.unets, /wan.*i2v/i, 'wan2.1_i2v_480p_14B_fp8_e4m3fn.safetensors')
      : pickFirst(models.unets, /wan.*t2v/i, 'wan2.1_t2v_1.3B_fp16.safetensors'));
  const clipName =
    String(params.clipName || '').trim() ||
    pickFirst(models.clips, /umt5/i, 'umt5_xxl_fp8_e4m3fn_scaled.safetensors');
  const vaeName =
    String(params.vaeName || '').trim() ||
    pickFirst(models.vaes, /wan/i, 'wan_2.1_vae.safetensors');

  const unetId = add('UNETLoader', {
    unet_name: unetName,
    weight_dtype: chooseUnetWeightDtype(unetName, capabilities),
  });
  const clipId = add('CLIPLoader', { clip_name: clipName, type: 'wan' });
  const vaeId = add('VAELoader', { vae_name: vaeName });

  let modelRef = [unetId, 0];
  if (nodes.ModelSamplingSD3 !== false) {
    const samplingId = add('ModelSamplingSD3', {
      model: modelRef,
      shift: clamp(params.shift, 1.0, 16.0, 8.0),
    });
    modelRef = [samplingId, 0];
  }

  const negativePrompt = String(params.negativePrompt || '').trim() || DEFAULT_WAN_NEGATIVE;
  const posId = add('CLIPTextEncode', { text: promptText, clip: [clipId, 0] }, 'Positive Prompt');
  const negId = add('CLIPTextEncode', { text: negativePrompt, clip: [clipId, 0] }, 'Negative Prompt');

  let positiveRef = [posId, 0];
  let negativeRef = [negId, 0];
  let latentRef;

  if (isI2V) {
    const loadId = add('LoadImage', { image: params.remoteInputImage });
    const i2vInputs = {
      positive: positiveRef,
      negative: negativeRef,
      vae: [vaeId, 0],
      width,
      height,
      length: frames,
      batch_size: 1,
      start_image: [loadId, 0],
    };

    const requestedClipVision = String(params.clipVisionName || '').trim();
    const detectedClipVision =
      requestedClipVision || pickFirst(models.clipVisions, /clip_vision_h/i, '');
    if (detectedClipVision && nodes.CLIPVisionLoader !== false) {
      const cvLoaderId = add('CLIPVisionLoader', { clip_name: detectedClipVision });
      const encodeInputs = {
        clip_vision: [cvLoaderId, 0],
        image: [loadId, 0],
      };
      if (capabilities?.clipVisionHasCrop !== false) {
        encodeInputs.crop = 'none';
      }
      const cvEncodeId = add('CLIPVisionEncode', encodeInputs);
      i2vInputs.clip_vision_output = [cvEncodeId, 0];
    }

    const wanI2vId = add('WanImageToVideo', i2vInputs);
    positiveRef = [wanI2vId, 0];
    negativeRef = [wanI2vId, 1];
    latentRef = [wanI2vId, 2];
  } else {
    const emptyId = add('EmptyHunyuanLatentVideo', {
      width,
      height,
      length: frames,
      batch_size: 1,
    });
    latentRef = [emptyId, 0];
  }

  const steps = Math.round(clamp(params.steps, 4, 80, 25));
  const cfg = clamp(params.cfg, 0.5, 20, 6.0);
  const samplerName = String(params.sampler || 'uni_pc').trim();
  const scheduler = String(params.scheduler || 'simple').trim();

  const ksamplerId = add('KSampler', {
    model: modelRef,
    positive: positiveRef,
    negative: negativeRef,
    latent_image: latentRef,
    seed,
    steps,
    cfg,
    sampler_name: samplerName,
    scheduler,
    denoise: 1.0,
  });

  const decodeId = add('VAEDecode', { samples: [ksamplerId, 0], vae: [vaeId, 0] });
  attachVideoSaver(add, [decodeId, 0], 'dsh_wan_vid', fps, capabilities);

  return {
    prompt: graph,
    preset,
    resolvedSeed: seed,
    width,
    height,
    frames,
    fps,
    steps,
    cfg,
    modelUsed: unetName,
  };
}
