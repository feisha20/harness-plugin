const INSPECT_NODE_CLASSES = [
  'CheckpointLoaderSimple',
  'UNETLoader',
  'VAELoader',
  'CLIPLoader',
  'DualCLIPLoader',
  'CLIPVisionLoader',
  'CLIPVisionEncode',
  'LoraLoader',
  'KSampler',
  'FluxGuidance',
  'ModelSamplingSD3',
  'EmptyHunyuanLatentVideo',
  'WanImageToVideo',
  'EmptyLTXVLatentVideo',
  'SaveWEBM',
  'SaveAnimatedWEBP',
  'VHS_VideoCombine',
];

const BLOCKED_HOSTS = new Set([
  '169.254.169.254',
  'metadata.google.internal',
  'metadata.goog',
]);

export function normalizeComfyUrl(input) {
  const raw = String(input || '').trim();
  if (!raw) {
    throw new Error('请先输入 ComfyUI 连接地址（例如 Colab 的 https://xxxx.trycloudflare.com）');
  }
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('ComfyUI 地址格式无效，需以 http:// 或 https:// 开头');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('ComfyUI 地址仅支持 http:// 或 https:// 协议');
  }
  if (BLOCKED_HOSTS.has(parsed.hostname.toLowerCase())) {
    throw new Error('禁止连接云元数据内网地址');
  }
  parsed.hash = '';
  parsed.search = '';
  let pathname = parsed.pathname.replace(/\/index\.html?$/i, '').replace(/\/+$/, '');
  parsed.pathname = pathname || '/';
  return parsed.toString().replace(/\/+$/, '');
}

export function extractComboOptions(nodeInfo, inputName) {
  if (!nodeInfo || typeof nodeInfo !== 'object') return [];
  const req = nodeInfo.input?.required || {};
  const opt = nodeInfo.input?.optional || {};
  const spec = req[inputName] ?? opt[inputName];
  if (!Array.isArray(spec) || spec.length === 0) return [];

  const first = spec[0];
  if (Array.isArray(first)) {
    return first.map((v) => String(v));
  }
  if (first === 'COMBO' && spec[1] && Array.isArray(spec[1].options)) {
    return spec[1].options.map((v) => String(v));
  }
  return [];
}

async function fetchJson(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  if (options.signal) {
    if (options.signal.aborted) {
      clearTimeout(timer);
      throw new Error('请求已取消');
    }
    options.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    if (!res.ok) {
      const detail = json?.error?.message || json?.error || text.slice(0, 200) || `HTTP ${res.status}`;
      throw new Error(`ComfyUI 请求失败 (${res.status}): ${detail}`);
    }
    return json;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('连接 ComfyUI 超时，请确认 Colab 单元格仍在运行且穿透链接未过期');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function probeComfyServer(baseUrl, headers = {}) {
  const cleanUrl = normalizeComfyUrl(baseUrl);
  const [systemStats, queueInfo, ...nodeInfos] = await Promise.all([
    fetchJson(`${cleanUrl}/system_stats`, { headers }, 8000),
    fetchJson(`${cleanUrl}/queue`, { headers }, 8000).catch(() => null),
    ...INSPECT_NODE_CLASSES.map((cls) =>
      fetchJson(`${cleanUrl}/object_info/${encodeURIComponent(cls)}`, { headers }, 8000)
        .then((payload) => [cls, payload?.[cls] || null])
        .catch(() => [cls, null]),
    ),
  ]);

  const infoMap = Object.fromEntries(nodeInfos);
  const nodes = {};
  for (const cls of INSPECT_NODE_CLASSES) {
    nodes[cls] = Boolean(infoMap[cls]);
  }

  const devices = Array.isArray(systemStats?.devices) ? systemStats.devices : [];
  const primaryDevice = devices[0] || null;
  const vramTotalGb = primaryDevice?.vram_total
    ? Number((primaryDevice.vram_total / 1024 / 1024 / 1024).toFixed(1))
    : null;
  const vramFreeGb = primaryDevice?.vram_free
    ? Number((primaryDevice.vram_free / 1024 / 1024 / 1024).toFixed(1))
    : null;

  const clipVisionInputs = infoMap.CLIPVisionEncode?.input?.required || {};
  const clipVisionHasCrop = Object.hasOwn(clipVisionInputs, 'crop');

  return {
    checkedAt: new Date().toISOString(),
    baseUrl: cleanUrl,
    system: {
      comfyVersion: systemStats?.system?.comfyui_version || null,
      pythonVersion: systemStats?.system?.python_version || null,
      deviceName: primaryDevice?.name || null,
      vramTotalGb,
      vramFreeGb,
      queueRunning: Array.isArray(queueInfo?.queue_running) ? queueInfo.queue_running.length : 0,
      queuePending: Array.isArray(queueInfo?.queue_pending) ? queueInfo.queue_pending.length : 0,
    },
    models: {
      checkpoints: extractComboOptions(infoMap.CheckpointLoaderSimple, 'ckpt_name'),
      unets: extractComboOptions(infoMap.UNETLoader, 'unet_name'),
      vaes: extractComboOptions(infoMap.VAELoader, 'vae_name'),
      clips: extractComboOptions(infoMap.CLIPLoader, 'clip_name').length
        ? extractComboOptions(infoMap.CLIPLoader, 'clip_name')
        : extractComboOptions(infoMap.DualCLIPLoader, 'clip_name1'),
      clipVisions: extractComboOptions(infoMap.CLIPVisionLoader, 'clip_name'),
      loras: extractComboOptions(infoMap.LoraLoader, 'lora_name'),
      samplers: extractComboOptions(infoMap.KSampler, 'sampler_name'),
      schedulers: extractComboOptions(infoMap.KSampler, 'scheduler'),
    },
    unetWeightDtypes: extractComboOptions(infoMap.UNETLoader, 'weight_dtype'),
    clipVisionHasCrop,
    nodes,
  };
}

export async function uploadImageToComfy(baseUrl, buffer, filename, mimeType = 'image/png', headers = {}) {
  const cleanUrl = normalizeComfyUrl(baseUrl);
  const form = new FormData();
  const blob = new Blob([buffer], { type: mimeType || 'image/png' });
  form.append('image', blob, filename || 'input.png');
  form.append('overwrite', 'true');
  form.append('type', 'input');

  const res = await fetch(`${cleanUrl}/upload/image`, {
    method: 'POST',
    headers,
    body: form,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`上传参考图到 ComfyUI 失败 (${res.status}): ${text.slice(0, 200)}`);
  }
  const data = JSON.parse(text);
  return {
    name: data.name,
    subfolder: data.subfolder || '',
    type: data.type || 'input',
    remoteRef: data.subfolder ? `${data.subfolder}/${data.name}` : data.name,
  };
}

export async function submitPromptToComfy(baseUrl, promptGraph, clientId, headers = {}) {
  const cleanUrl = normalizeComfyUrl(baseUrl);
  const data = await fetchJson(
    `${cleanUrl}/prompt`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({
        prompt: promptGraph,
        client_id: clientId,
      }),
    },
    15000,
  );
  if (!data?.prompt_id) {
    throw new Error('ComfyUI 未返回 prompt_id');
  }
  return data;
}

export async function fetchHistory(baseUrl, promptId, headers = {}) {
  const cleanUrl = normalizeComfyUrl(baseUrl);
  const data = await fetchJson(`${cleanUrl}/history/${encodeURIComponent(promptId)}`, { headers }, 10000);
  return data?.[promptId] || null;
}

export async function fetchQueue(baseUrl, headers = {}) {
  const cleanUrl = normalizeComfyUrl(baseUrl);
  return fetchJson(`${cleanUrl}/queue`, { headers }, 8000);
}

export async function interruptComfy(baseUrl, headers = {}) {
  const cleanUrl = normalizeComfyUrl(baseUrl);
  return fetchJson(
    `${cleanUrl}/interrupt`,
    {
      method: 'POST',
      headers,
    },
    8000,
  );
}

export async function downloadComfyView(baseUrl, fileRef, headers = {}) {
  const cleanUrl = normalizeComfyUrl(baseUrl);
  const params = new URLSearchParams({
    filename: String(fileRef.filename || ''),
    subfolder: String(fileRef.subfolder || ''),
    type: String(fileRef.type || 'output'),
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000);
  try {
    const res = await fetch(`${cleanUrl}/view?${params.toString()}`, {
      headers,
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`下载生成结果失败 (${res.status})`);
    }
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  } finally {
    clearTimeout(timer);
  }
}

export function buildComfyWsUrl(baseUrl, clientId) {
  const parsed = new URL(normalizeComfyUrl(baseUrl));
  parsed.protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
  parsed.pathname = `${parsed.pathname.replace(/\/+$/, '')}/ws`;
  parsed.search = `?clientId=${encodeURIComponent(clientId)}`;
  return parsed.toString();
}
