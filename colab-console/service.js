import { execFile, spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { resolveColabBin, resolveDefaultSshKey } from './tunnel-proxy.js';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TUNNEL_PROXY_SCRIPT = path.join(__dirname, 'tunnel-proxy.js');

function resolveNodeBin() {
  for (const p of ['/opt/homebrew/bin/node', '/usr/local/bin/node']) {
    if (fs.existsSync(p)) return p;
  }
  return process.execPath;
}

function localHttpJson(port, urlPath, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: urlPath,
        method: 'GET',
        agent: false,
        headers: { Connection: 'close' },
        timeout: timeoutMs,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve({ ok: true, status: res.statusCode, data: JSON.parse(text) });
            } catch {
              resolve({ ok: false, status: res.statusCode, error: 'Invalid JSON' });
            }
          } else {
            resolve({ ok: false, status: res.statusCode, error: `HTTP ${res.statusCode}` });
          }
        });
      },
    );
    req.on('timeout', () => req.destroy(new Error('连接超时')));
    req.on('error', (err) => reject(err));
    req.end();
  });
}

const DEFAULT_MODEL_REPO = 'sakamakismile/Huihui-Qwen3.8-27B-abliterated-NVFP4';
const DEFAULT_SERVED_NAME = 'qwen3.8-27b-abliterated qwen38-27b-nb';
const STEP_ORDER = ['session', 'bootstrap', 'waiting_api', 'tunnel'];
const READ_ONLY_COLAB_SUBCOMMANDS = new Set(['whoami', 'usage', 'sessions', 'status', 'url']);

export const DEFAULT_H3_LOCAL_PORT = 8188;
export const DEFAULT_H3_REMOTE_PORT = 8188;

const H3_TEXT_ENCODER = {
  repo: 'pottokao/MiniMax-H3-TextEncoder-16GB-abliterated-GGUF',
  file: 'MiniMax-H3-TextEncoder-Qwen3VL-32B-abliterated-13.6G_vis.gguf',
  destName: 'MiniMax-H3-TextEncoder-Qwen3VL-32B-abliterated-13.6G_vis.gguf',
  loader: 'CLIPLoaderGGUF',
};

const H3_VAES = [
  {
    repo: 'Comfy-Org/MiniMax-H3',
    file: 'vae/minimax_h3_video_vae_fp16.safetensors',
    destName: 'minimax_h3_video_vae_fp16.safetensors',
  },
  {
    repo: 'Comfy-Org/MiniMax-H3',
    file: 'vae/minimax_h3_audio_vae_fp32.safetensors',
    destName: 'minimax_h3_audio_vae_fp32.safetensors',
  },
];

const H3_FL2V_TURBO_LORAS = [
  {
    repo: 'Comfy-Org/MiniMax-H3',
    file: 'loras/minimax_h3_fl2v_turbo_8step_v1.0_comfyui_bf16.safetensors',
    destName: 'minimax_h3_fl2v_turbo_8step_v1.0_comfyui_bf16.safetensors',
  },
  {
    repo: 'Comfy-Org/MiniMax-H3',
    file: 'loras/minimax_h3_fl2v_turbo_4step_v1.0_768p_comfyui_bf16.safetensors',
    destName: 'minimax_h3_fl2v_turbo_4step_v1.0_768p_comfyui_bf16.safetensors',
  },
];

export const MINIMAX_H3_PRESETS = {
  'uncensored-fp8-turbo': {
    key: 'uncensored-fp8-turbo',
    label: '无审核版 FP8 + 4/8步 Turbo LoRA（推荐 L4 / G4）',
    mode: 'fl2va',
    dit: {
      repo: 'Comfy-Org/MiniMax-H3',
      file: 'diffusion_models/minimax_h3_fl2va_pruned_fp8_scaled.safetensors',
      destName: 'minimax_h3_fl2va_pruned_fp8_scaled.safetensors',
      loader: 'UNETLoader',
    },
    textEncoder: H3_TEXT_ENCODER,
    loras: H3_FL2V_TURBO_LORAS,
    vaes: H3_VAES,
  },
  'uncensored-prism-8step': {
    key: 'uncensored-prism-8step',
    label: '无审核版 PRISM 融合 + 内置 8步 Turbo（Ref2VA INT8）',
    mode: 'ref2va',
    dit: {
      repo: 'OliviaRossi/Minimax-h3_Singularity-x-10Eros-Max_PRISM',
      file: 'PRISM_DMAD_PDMD_int8.safetensors',
      destName: 'PRISM_DMAD_PDMD_int8.safetensors',
      loader: 'UNETLoader',
    },
    textEncoder: H3_TEXT_ENCODER,
    loras: [],
    vaes: H3_VAES,
  },
  'uncensored-gguf-q5-turbo': {
    key: 'uncensored-gguf-q5-turbo',
    label: '无审核版 GGUF Q5_K_M + 4/8步 Turbo LoRA（最省显存）',
    mode: 'fl2va',
    dit: {
      repo: 'Abiray/MiniMax-H3-Pruned-GGUF',
      file: 'MiniMax-H3-FL2VA-Pruned-Q5_K_M.gguf',
      destName: 'MiniMax-H3-FL2VA-Pruned-Q5_K_M.gguf',
      loader: 'UnetLoaderGGUF',
    },
    textEncoder: H3_TEXT_ENCODER,
    loras: H3_FL2V_TURBO_LORAS,
    vaes: H3_VAES,
  },
};

export function resolveH3Preset(presetKey = 'uncensored-fp8-turbo') {
  const key = String(presetKey ?? '').trim() || 'uncensored-fp8-turbo';
  const preset = MINIMAX_H3_PRESETS[key];
  if (!preset) {
    throw new Error(`不支持的 MiniMax-H3 预设: ${key}`);
  }
  return preset;
}

class DeployCancelledError extends Error {
  constructor(message = '已手动终止拉起任务') {
    super(message);
    this.name = 'DeployCancelledError';
    this.cancelled = true;
  }
}

function sleepAbortable(ms, signal) {
  if (signal?.aborted) return Promise.reject(new DeployCancelledError());
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DeployCancelledError());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener?.('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener?.('abort', onAbort, { once: true });
  });
}

function validateSessionName(name) {
  const value = String(name || '').trim();
  if (!value || !/^[a-zA-Z0-9._-]+$/.test(value)) {
    throw new Error('会话名称只能包含字母、数字、点、下划线或连字符');
  }
  return value;
}

function validatePort(port, fallback = 8000) {
  const num = Number(port ?? fallback);
  if (!Number.isInteger(num) || num < 1024 || num > 65535) {
    throw new Error('端口号必须在 1024 到 65535 之间');
  }
  return num;
}

function validateSafeArg(value, label, fallback = '') {
  const str = String(value ?? fallback).trim();
  if (!str || !/^[a-zA-Z0-9._:/ -]+$/.test(str)) {
    throw new Error(`${label} 包含不支持的字符`);
  }
  return str;
}

function cleanCliText(raw) {
  return String(raw || '')
    .replace(/\u001b\[[0-9;]*m/g, '')
    .replace(/\r\n?/g, '\n');
}

function capErrorLine(text, maxLen = 240) {
  const normalized = String(text || '')
    .replace(/[╭╮╰╯│─]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) return '';
  return normalized.length > maxLen ? `${normalized.slice(0, maxLen - 1)}…` : normalized;
}

export function isTransientColabNetworkError(text = '') {
  const msg = String(text || '');
  if (!msg) return false;
  if (/CERTIFICATE_VERIFY_FAILED|HOSTNAME_MISMATCH/i.test(msg)) return false;
  return /SSLEOFError|UNEXPECTED_EOF_WHILE_READING|EOF occurred in violation of protocol|ProxyError|RemoteDisconnected|ConnectionResetError|Connection aborted|ECONNRESET|ECONNABORTED|EPIPE|ConnectionRefusedError|Failed to establish a new connection/i.test(
    msg,
  );
}

export function summarizeCliError(stderr = '', stdout = '') {
  const extractStreamSummary = (raw) => {
    const cleaned = cleanCliText(raw);
    if (!cleaned.trim()) return '';
    const lines = cleaned.split('\n').map((l) => l.trimEnd());
    const hasTracebackFrame = /Traceback \(most recent call last\)|[╭╰│]/.test(cleaned);
    if (hasTracebackFrame) {
      let lastBottom = -1;
      for (let i = lines.length - 1; i >= 0; i -= 1) {
        if (/^\s*╰/.test(lines[i])) {
          lastBottom = i;
          break;
        }
      }
      if (lastBottom !== -1) {
        const afterBox = lines
          .slice(lastBottom + 1)
          .map((l) => l.trim())
          .filter((l) => l && !/^[╭╮╰╯│─\s]+$/.test(l));
        if (afterBox.length > 0) {
          const joined = afterBox.reduce((acc, part) => {
            if (!acc) return part;
            const lastToken = acc.slice(acc.lastIndexOf(' ') + 1);
            if (/^https?:\/\/\S+$/.test(lastToken) && !lastToken.endsWith(':') && !/^[A-Z][a-z]+Error:/.test(part)) {
              return `${acc}${part}`;
            }
            return `${acc} ${part}`;
          }, '');
          return capErrorLine(joined);
        }
      }
      const meaningful = lines
        .map((l) => l.trim())
        .filter(
          (l) =>
            l &&
            !/^[╭╮╰╯│─\s]+$/.test(l) &&
            !/^│/.test(l) &&
            !/Traceback \(most recent call last\)/.test(l),
        );
      if (meaningful.length > 0) {
        return capErrorLine(meaningful.slice(-2).join(' '));
      }
    }
    const nonEmpty = lines.map((l) => l.trim()).filter(Boolean);
    return nonEmpty.length > 0 ? capErrorLine(nonEmpty.slice(-2).join(' ')) : '';
  };

  return extractStreamSummary(stderr) || extractStreamSummary(stdout);
}

export function normalizeFallbackGpus(fallbackGpus, primaryGpu = 'G4') {
  const list = Array.isArray(fallbackGpus)
    ? fallbackGpus
    : typeof fallbackGpus === 'string'
      ? fallbackGpus.split(',')
      : [];
  const primary = String(primaryGpu || '').trim().toUpperCase();
  const seen = new Set();
  const result = [];
  for (const item of list) {
    const val = String(item || '').trim().toUpperCase();
    if (!val || val === primary || seen.has(val)) continue;
    validateSafeArg(val, '备选 GPU 规格');
    seen.add(val);
    result.push(val);
  }
  return result;
}

export function resolveGpuVllmDefaults({
  gpuHardware = '',
  gpuMemoryMiB = null,
  requestedMaxModelLen = 262144,
  requestedKvCacheDtype = 'smart',
} = {}) {
  const hw = String(gpuHardware || '').trim();
  const requestedLen = Math.max(1024, Number(requestedMaxModelLen) || 262144);
  const rawKv = String(requestedKvCacheDtype ?? 'smart').trim();
  const isSmart = !rawKv || rawKv.toLowerCase() === 'smart';

  let kvCacheDtype;
  if (isSmart) {
    kvCacheDtype = /\b(A100|T4|V100|P100|AMPERE|TURING)\b/i.test(hw) ? 'auto' : 'fp8';
  } else {
    kvCacheDtype = validateSafeArg(rawKv, 'KV Cache 类型', 'fp8').toLowerCase();
  }

  let maxModelLen = requestedLen;
  if (Number.isFinite(gpuMemoryMiB) && gpuMemoryMiB > 0) {
    if (gpuMemoryMiB < 30000) {
      maxModelLen = Math.min(maxModelLen, 32768);
    } else if (gpuMemoryMiB < 70000) {
      maxModelLen = Math.min(maxModelLen, 131072);
    }
  }

  const autoAdapted = isSmart && (kvCacheDtype !== 'fp8' || maxModelLen !== requestedLen);
  const gpuLabel = hw || 'GPU';
  const vramLabel = Number.isFinite(gpuMemoryMiB) && gpuMemoryMiB > 0 ? ` (${Math.round(gpuMemoryMiB / 1024)}GB)` : '';
  const adaptationSummary = `${autoAdapted ? '已自动适配' : '沿用参数'} ${gpuLabel}${vramLabel}：kv=${kvCacheDtype}, max_len=${maxModelLen}`;
  return { kvCacheDtype, maxModelLen, autoAdapted, adaptationSummary };
}

export function buildStartVllmScript({
  model = DEFAULT_MODEL_REPO,
  servedName = DEFAULT_SERVED_NAME,
  remotePort = 8000,
  maxModelLen = 262144,
  maxNumSeqs = 128,
  kvCacheDtype = 'fp8',
  enableMtp = true,
  enableTools = true,
} = {}) {
  const safeModel = validateSafeArg(model, '模型名称', DEFAULT_MODEL_REPO);
  const safeServedName = validateSafeArg(servedName, '对外模型名', DEFAULT_SERVED_NAME);
  const rPort = validatePort(remotePort, 8000);
  const safeMaxLen = Math.max(1024, Number(maxModelLen) || 262144);
  const safeMaxSeqs = Math.max(1, Number(maxNumSeqs) || 128);
  const normalizedKv = String(kvCacheDtype ?? 'fp8').trim().toLowerCase() === 'smart' ? 'fp8' : kvCacheDtype;
  const safeKv = normalizedKv ? validateSafeArg(normalizedKv, 'KV Cache 类型', 'fp8') : '';

  const lines = [
    '#!/bin/bash',
    'if [ -d /content/vllm-env/bin ]; then export PATH="/content/vllm-env/bin:$PATH"; fi',
    'export HF_XET_HIGH_PERFORMANCE=1',
    'export HF_HUB_ENABLE_HF_TRANSFER=1',
    `exec vllm serve ${safeModel} \\`,
    `  --served-model-name ${safeServedName} \\`,
    '  --host 0.0.0.0 \\',
    `  --port ${rPort} \\`,
    `  --max-model-len ${safeMaxLen} \\`,
    `  --max-num-seqs ${safeMaxSeqs} \\`,
  ];
  if (safeKv) lines.push(`  --kv-cache-dtype ${safeKv} \\`);
  lines.push('  --reasoning-parser qwen3 \\');
  if (enableTools) {
    lines.push('  --enable-auto-tool-choice \\');
    lines.push('  --tool-call-parser qwen3_coder \\');
  }
  if (enableMtp) {
    lines.push(`  --speculative-config '{"method":"qwen3_5_mtp","num_speculative_tokens":3}' \\`);
  }
  lines.push('  --gpu-memory-utilization 0.90');
  return lines.join('\n');
}

export function buildDeployScript({
  forceReinstall = false,
  ...vllmOpts
} = {}) {
  const startScript = buildStartVllmScript(vllmOpts);
  return `#!/bin/bash
set -euo pipefail
mkdir -p /content
echo "checking_env" > /content/.deploy_stage
trap 'echo "failed" > /content/.deploy_stage' ERR

{
  echo "[deploy] $(date -u +%FT%TZ) checking vLLM installation..."
  if [ -d /content/vllm-env/bin ]; then export PATH="/content/vllm-env/bin:$PATH"; fi
  if ! command -v vllm >/dev/null 2>&1 || [ "${forceReinstall ? '1' : '0'}" = "1" ]; then
    echo "installing_vllm" > /content/.deploy_stage
    echo "[deploy] installing vllm huggingface_hub hf-xet hf_transfer..."
    if command -v uv >/dev/null 2>&1; then
      uv pip install --system --break-system-packages -U vllm huggingface_hub hf-xet hf_transfer
    else
      python3 -m pip install -U vllm huggingface_hub hf-xet hf_transfer
    fi
  else
    echo "[deploy] vllm already installed: $(command -v vllm)"
    python3 -c "import hf_transfer" 2>/dev/null || {
      if command -v uv >/dev/null 2>&1; then
        uv pip install --system --break-system-packages hf-xet hf_transfer || true
      else
        python3 -m pip install -q hf-xet hf_transfer || true
      fi
    }
  fi

  echo "writing_script" > /content/.deploy_stage
  cat << 'START_EOF' > /content/start_vllm.sh
${startScript}
START_EOF
  chmod +x /content/start_vllm.sh

  pkill -f "vllm serve" || true
  sleep 2
  echo "starting_vllm" > /content/.deploy_stage
  echo "[deploy] launching vllm serve..."
} > /content/deploy_qwen38.log 2>&1

trap - ERR
exec /content/start_vllm.sh > /content/vllm_nvfp4.log 2>&1
`;
}

export function buildStartComfyScript({
  remotePort = DEFAULT_H3_REMOTE_PORT,
  useSageAttention = true,
  lowVram = false,
} = {}) {
  const rPort = validatePort(remotePort, DEFAULT_H3_REMOTE_PORT);
  return `#!/bin/bash
if [ -d /content/comfy-env/bin ]; then export PATH="/content/comfy-env/bin:$PATH"; fi
export HF_XET_HIGH_PERFORMANCE=1
export HF_HUB_ENABLE_HF_TRANSFER=1
export PYTORCH_CUDA_ALLOC_CONF="${'${PYTORCH_CUDA_ALLOC_CONF:-expandable_segments:True}'}"
EXTRA_ARGS=""
if [ "${useSageAttention ? '1' : '0'}" = "1" ] && python3 -c "import sageattention" 2>/dev/null; then
  EXTRA_ARGS="$EXTRA_ARGS --use-sage-attention"
fi
if [ "${lowVram ? '1' : '0'}" = "1" ]; then
  EXTRA_ARGS="$EXTRA_ARGS --lowvram"
fi
exec python3 /content/ComfyUI/main.py \\
  --listen 0.0.0.0 \\
  --port ${rPort} \\
  --preview-method auto \\
  $EXTRA_ARGS
`;
}

export function buildDeployH3Script({
  preset = 'uncensored-fp8-turbo',
  remotePort = DEFAULT_H3_REMOTE_PORT,
  useSageAttention = true,
  lowVram = false,
  forceReinstall = false,
} = {}) {
  const presetObj = resolveH3Preset(preset);
  const startComfyScript = buildStartComfyScript({ remotePort, useSageAttention, lowVram });
  const downloads = [
    { subdir: 'diffusion_models', repo: presetObj.dit.repo, file: presetObj.dit.file, destName: presetObj.dit.destName },
    { subdir: 'text_encoders', repo: presetObj.textEncoder.repo, file: presetObj.textEncoder.file, destName: presetObj.textEncoder.destName },
    ...presetObj.loras.map((l) => ({ subdir: 'loras', repo: l.repo, file: l.file, destName: l.destName })),
    ...presetObj.vaes.map((v) => ({ subdir: 'vae', repo: v.repo, file: v.file, destName: v.destName })),
  ];
  const downloadsJson = JSON.stringify(downloads);
  const templateFile = presetObj.mode === 'ref2va' ? 'video_minimax_h3_r2v.json' : 'video_minimax_h3_t2v.json';
  const primaryLora = presetObj.loras[0]?.destName || '';

  return `#!/bin/bash
set -euo pipefail
mkdir -p /content
echo "checking_env" > /content/.deploy_h3_stage
trap 'echo "failed" > /content/.deploy_h3_stage' ERR

{
  echo "[deploy-h3] $(date -u +%FT%TZ) preset=${presetObj.key} starting..."
  if [ -d /content/comfy-env/bin ]; then export PATH="/content/comfy-env/bin:$PATH"; fi
  export HF_XET_HIGH_PERFORMANCE=1
  export HF_HUB_ENABLE_HF_TRANSFER=1

  PIP_INSTALL="python3 -m pip install"
  if command -v uv >/dev/null 2>&1; then
    PIP_INSTALL="uv pip install --system --break-system-packages"
  fi

  if [ ! -f /content/ComfyUI/main.py ] || [ "${forceReinstall ? '1' : '0'}" = "1" ]; then
    echo "installing_comfyui" > /content/.deploy_h3_stage
    echo "[deploy-h3] cloning/updating ComfyUI + custom_nodes..."
    if [ ! -d /content/ComfyUI/.git ]; then
      rm -rf /content/ComfyUI
      git clone --depth 1 https://github.com/comfyanonymous/ComfyUI.git /content/ComfyUI
    else
      git -C /content/ComfyUI pull --ff-only || true
    fi

    mkdir -p /content/ComfyUI/custom_nodes
    if [ ! -d /content/ComfyUI/custom_nodes/ComfyUI-GGUF/.git ]; then
      git clone --depth 1 https://github.com/city96/ComfyUI-GGUF.git /content/ComfyUI/custom_nodes/ComfyUI-GGUF
    else
      git -C /content/ComfyUI/custom_nodes/ComfyUI-GGUF pull --ff-only || true
    fi
    if [ ! -d /content/ComfyUI/custom_nodes/ComfyUI-VideoHelperSuite/.git ]; then
      git clone --depth 1 https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite.git /content/ComfyUI/custom_nodes/ComfyUI-VideoHelperSuite
    else
      git -C /content/ComfyUI/custom_nodes/ComfyUI-VideoHelperSuite pull --ff-only || true
    fi

    echo "[deploy-h3] installing Python dependencies..."
    $PIP_INSTALL -r /content/ComfyUI/requirements.txt
    $PIP_INSTALL -r /content/ComfyUI/custom_nodes/ComfyUI-GGUF/requirements.txt || true
    $PIP_INSTALL -r /content/ComfyUI/custom_nodes/ComfyUI-VideoHelperSuite/requirements.txt || true
    $PIP_INSTALL -U huggingface_hub hf-xet hf_transfer gguf comfy-kitchen comfyui-workflow-templates || true
    if [ "${useSageAttention ? '1' : '0'}" = "1" ]; then
      python3 -c "import sageattention" 2>/dev/null || $PIP_INSTALL sageattention || true
    fi
  else
    echo "[deploy-h3] ComfyUI already present, verifying helper packages..."
    python3 -c "import huggingface_hub, hf_transfer, gguf" 2>/dev/null || \
      $PIP_INSTALL -U huggingface_hub hf-xet hf_transfer gguf comfy-kitchen || true
  fi

  echo "downloading_models" > /content/.deploy_h3_stage
  echo "[deploy-h3] downloading MiniMax-H3 (${presetObj.key}) weights..."
  python3 - << 'H3_DL_EOF'
import json
import os
import shutil
from huggingface_hub import hf_hub_download

downloads = json.loads(${JSON.stringify(downloadsJson)})
models_root = "/content/ComfyUI/models"
cache_root = "/content/.hf_h3_cache"
os.makedirs(cache_root, exist_ok=True)

for item in downloads:
    dest = os.path.join(models_root, item["subdir"], item["destName"])
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    if os.path.exists(dest) and os.path.getsize(dest) > 1048576:
        print(f"[h3-dl] skip existing: {dest} ({os.path.getsize(dest)} bytes)")
        continue
    print(f"[h3-dl] fetching {item['repo']} :: {item['file']} -> {dest}", flush=True)
    cached_path = hf_hub_download(repo_id=item["repo"], filename=item["file"], cache_dir=cache_root)
    real_path = os.path.realpath(cached_path)
    shutil.move(real_path, dest)
    shutil.rmtree(cache_root, ignore_errors=True)
    os.makedirs(cache_root, exist_ok=True)
H3_DL_EOF

  echo "writing_workflow" > /content/.deploy_h3_stage
  echo "[deploy-h3] generating preconfigured uncensored MiniMax-H3 workflow..."
  python3 - << 'H3_WF_EOF'
import glob
import json
import os
import urllib.request

wf_dir = "/content/ComfyUI/user/default/workflows"
os.makedirs(wf_dir, exist_ok=True)
wf_out = os.path.join(wf_dir, "minimax_h3_uncensored_l4.json")

wf_data = None
template_name = ${JSON.stringify(templateFile)}
try:
    import comfyui_workflow_templates
    pkg_dir = os.path.dirname(comfyui_workflow_templates.__file__)
    matches = glob.glob(os.path.join(pkg_dir, "**", template_name), recursive=True)
    if matches:
        with open(matches[0], "r", encoding="utf-8") as f:
            wf_data = json.load(f)
except Exception:
    pass

if wf_data is None:
    url = f"https://raw.githubusercontent.com/Comfy-Org/workflow_templates/main/templates/{template_name}"
    with urllib.request.urlopen(url, timeout=30) as resp:
        wf_data = json.loads(resp.read().decode("utf-8"))

dit_loader = ${JSON.stringify(presetObj.dit.loader)}
dit_name = ${JSON.stringify(presetObj.dit.destName)}
te_name = ${JSON.stringify(presetObj.textEncoder.destName)}
primary_lora = ${JSON.stringify(primaryLora)}

node_lists = [wf_data.get("nodes", [])]
for sg in wf_data.get("definitions", {}).get("subgraphs", []):
    node_lists.append(sg.get("nodes", []))

for nodes in node_lists:
    for node in nodes:
        ntype = node.get("type", "")
        if ntype in ("CLIPLoader", "CLIPLoaderGGUF"):
            node["type"] = "CLIPLoaderGGUF"
            node["widgets_values"] = [te_name, "minimax"]
            if isinstance(node.get("properties"), dict):
                node["properties"]["Node name for S&R"] = "CLIPLoaderGGUF"
        elif ntype in ("UNETLoader", "UnetLoaderGGUF"):
            node["type"] = dit_loader
            node["widgets_values"] = [dit_name] if dit_loader == "UnetLoaderGGUF" else [dit_name, "default"]
            if isinstance(node.get("properties"), dict):
                node["properties"]["Node name for S&R"] = dit_loader
        elif ntype == "VAELoader":
            vals = node.get("widgets_values") or []
            if vals and "audio" in str(vals[0]).lower():
                vals[0] = "minimax_h3_audio_vae_fp32.safetensors"
            elif vals and ("video" in str(vals[0]).lower() or "vae" in str(vals[0]).lower()):
                vals[0] = "minimax_h3_video_vae_fp16.safetensors"
            node["widgets_values"] = vals
        elif ntype == "LoraLoaderModelOnly":
            if primary_lora:
                vals = node.get("widgets_values") or [primary_lora, 1]
                vals[0] = primary_lora
                node["widgets_values"] = vals
                node["mode"] = 0
            else:
                node["mode"] = 4

with open(wf_out, "w", encoding="utf-8") as f:
    json.dump(wf_data, f, ensure_ascii=False, indent=2)
print(f"[h3-wf] wrote {wf_out}")
H3_WF_EOF

  cat << 'START_COMFY_EOF' > /content/start_comfyui.sh
${startComfyScript}
START_COMFY_EOF
  chmod +x /content/start_comfyui.sh

  pkill -f "ComfyUI/main.py" || true
  sleep 2
  echo "starting_comfyui" > /content/.deploy_h3_stage
  echo "[deploy-h3] launching ComfyUI..."
} > /content/deploy_minimax_h3.log 2>&1

trap - ERR
exec /content/start_comfyui.sh > /content/comfyui_h3.log 2>&1
`;
}

export function parseWhoamiOutput(text) {
  const raw = String(text || '');
  const email = raw.match(/^Email:\s*(.+)$/m)?.[1]?.trim() || '';
  const authProvider = raw.match(/^Auth provider:\s*(.+)$/m)?.[1]?.trim() || '';
  const expiresIn = raw.match(/^Expires in:\s*(.+)$/m)?.[1]?.trim() || '';
  return { email, authProvider, expiresIn, authenticated: Boolean(email) };
}

export function parseUsageOutput(text) {
  const raw = String(text || '');
  const balanceMatch = raw.match(/Current balance:\s*([0-9.]+)\s*compute units/i);
  const rateMatch = raw.match(/Usage rate:\s*([0-9.]+)\s*\/hr/i);
  const activeMatch = raw.match(/Active assignments:\s*(\d+)/i);
  const balance = balanceMatch ? Number(balanceMatch[1]) : null;
  const usageRatePerHour = rateMatch ? Number(rateMatch[1]) : null;
  const activeAssignments = activeMatch ? Number(activeMatch[1]) : null;
  const estimatedHoursLeft =
    balance !== null && usageRatePerHour !== null && usageRatePerHour > 0
      ? Number((balance / usageRatePerHour).toFixed(1))
      : null;
  return { balance, usageRatePerHour, activeAssignments, estimatedHoursLeft };
}

export function parseSessionsOutput(text) {
  const sessions = [];
  const lines = String(text || '').split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(
      /^\s*\[([^\]]+)\]\s+(\S+)\s*\|\s*Hardware:\s*([^|]+)\|\s*Shape:\s*([^|]+)\|\s*Variant:\s*(.+?)\s*$/,
    );
    if (m) {
      sessions.push({
        name: m[1].trim(),
        endpoint: m[2].trim(),
        hardware: m[3].trim(),
        shape: m[4].trim(),
        variant: m[5].trim(),
      });
    }
  }
  return sessions;
}

export function parseStatusOutput(text) {
  const raw = String(text || '');
  const status = raw.match(/Status:\s*([A-Z_]+)/)?.[1]?.trim() || 'UNKNOWN';
  const lastExec = raw.match(/Last Execution:\s*(.+)$/m)?.[1]?.trim() || '';
  return { status, lastExec };
}

export function parseNvidiaSmiCsv(text) {
  const line = String(text || '')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .find((s) => s && !s.startsWith('ERR'));
  if (!line) return null;
  const parts = line.split(',').map((s) => s.trim());
  if (parts.length < 5) return null;
  const memoryUsedMiB = Number(parts[1]);
  const memoryTotalMiB = Number(parts[2]);
  const gpuUtilPct = Number(parts[3]);
  const temperatureC = Number(parts[4]);
  return {
    name: parts[0],
    memoryUsedMiB: Number.isFinite(memoryUsedMiB) ? memoryUsedMiB : 0,
    memoryTotalMiB: Number.isFinite(memoryTotalMiB) ? memoryTotalMiB : 0,
    gpuUtilPct: Number.isFinite(gpuUtilPct) ? gpuUtilPct : 0,
    temperatureC: Number.isFinite(temperatureC) ? temperatureC : 0,
  };
}

export class ColabConsoleService {
  constructor() {
    this.colabBin = resolveColabBin();
    this.tunnelChildren = new Map();
    this.deployJob = null;
    this._deployAbortController = null;
    this._lastDeployOpts = null;
    this.h3DeployJob = null;
    this._h3AbortController = null;
    this._lastH3DeployOpts = null;
    this.transientRetryBaseMs = 1200;
  }

  _readRecentColabLogHint() {
    try {
      const logPath = path.join(os.homedir(), '.config', 'colab-cli', 'colab.log');
      if (!fs.existsSync(logPath)) return '';
      const stat = fs.statSync(logPath);
      const size = stat.size;
      const readBytes = Math.min(size, 8192);
      const fd = fs.openSync(logPath, 'r');
      const buf = Buffer.alloc(readBytes);
      fs.readSync(fd, buf, 0, readBytes, size - readBytes);
      fs.closeSync(fd);
      const tail = buf.toString('utf8');
      if (/Error 503|503 Service Unavailable/i.test(tail)) {
        return 'Google Colab 后端返回 503 Service Unavailable（GPU 资源暂时不可用或繁忙，请稍候重试或切换 GPU 规格）';
      }
      if (/Error 502|Error 504|502 Bad Gateway|504 Gateway/i.test(tail)) {
        return 'Google Colab 后端返回 502/504 网关异常，请稍候重试';
      }
      if (/TooManyAssignmentsError|412 Precondition/i.test(tail)) {
        return '活跃会话数或配额触发限制 (HTTP 412)，请先释放无用会话';
      }
    } catch {
      // Ignore diagnostic log read errors
    }
    return '';
  }

  async _execColabOnce(args, { timeoutMs = 20000, signal } = {}) {
    if (signal?.aborted) throw new DeployCancelledError();
    try {
      const { stdout, stderr } = await execFileAsync(this.colabBin, args, {
        timeout: timeoutMs,
        signal,
        maxBuffer: 4 * 1024 * 1024,
        env: {
          ...process.env,
          PATH: `${path.dirname(this.colabBin)}:${process.env.PATH || ''}`,
        },
      });
      return { stdout: stdout || '', stderr: stderr || '' };
    } catch (err) {
      if (signal?.aborted || err?.name === 'AbortError' || err?.code === 'ABORT_ERR') {
        throw new DeployCancelledError();
      }
      const parts = [];
      if (err?.killed || err?.signal === 'SIGTERM') {
        parts.push(`Colab CLI 执行超时（已等待 ${Math.round(timeoutMs / 1000)}s）`);
      }
      const stderr = (err?.stderr || '').trim();
      const stdout = (err?.stdout || '').trim();
      const summary = summarizeCliError(stderr, stdout);
      if (summary) parts.push(summary);
      if (parts.length === 0 && err?.message) parts.push(capErrorLine(err.message));
      const wrapped = new Error(parts.join(' · ') || 'Colab CLI 执行失败');
      const rawDetail = [stderr, stdout].filter(Boolean).join('\n').trim();
      if (rawDetail) wrapped.rawDetail = rawDetail;
      throw wrapped;
    }
  }

  async runColab(args, { timeoutMs = 20000, signal, transientRetries } = {}) {
    const subcommand = Array.isArray(args) ? args[0] : '';
    const maxRetries = Number.isInteger(transientRetries)
      ? Math.max(0, transientRetries)
      : READ_ONLY_COLAB_SUBCOMMANDS.has(subcommand)
        ? 2
        : 0;

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        return await this._execColabOnce(args, { timeoutMs, signal });
      } catch (err) {
        if (err?.cancelled || signal?.aborted) throw new DeployCancelledError();
        const isTransient = Boolean(err?.isTransientNetwork) || isTransientColabNetworkError(err?.rawDetail || err?.message);
        if (!isTransient) throw err;

        if (attempt < maxRetries) {
          await sleepAbortable((this.transientRetryBaseMs ?? 1200) * (attempt + 1), signal);
          continue;
        }

        const alreadyPrefixed = String(err?.message || '').startsWith('本机代理或 TLS 连接意外中断');
        const msg = alreadyPrefixed
          ? err.message
          : `本机代理或 TLS 连接意外中断（代理节点抖动 / SSLEOFError），${maxRetries > 0 ? `已自动重试 ${maxRetries} 次仍失败，` : ''}请检查代理节点稳定性或稍后重试（${err.message}）`;
        const wrapped = new Error(msg);
        if (err?.rawDetail) wrapped.rawDetail = err.rawDetail;
        wrapped.isTransientNetwork = true;
        throw wrapped;
      }
    }
  }

  async _runColabExecOnce(name, script, timeoutMs, { signal } = {}) {
    if (signal?.aborted) throw new DeployCancelledError();
    const payload = `%%bash\n${script}\n`;
    return new Promise((resolve, reject) => {
      const proc = spawn(this.colabBin, ['exec', '-s', name, '--timeout', String(Math.ceil(timeoutMs / 1000))], {
        env: {
          ...process.env,
          PATH: `${path.dirname(this.colabBin)}:${process.env.PATH || ''}`,
        },
      });
      let stdout = '';
      let stderr = '';
      let settled = false;
      const cleanup = () => {
        clearTimeout(timer);
        signal?.removeEventListener?.('abort', onAbort);
      };
      const finishReject = (err) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(err);
      };
      const finishResolve = (val) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(val);
      };
      const onAbort = () => {
        try {
          proc.kill('SIGTERM');
        } catch {
          // Ignore kill failures
        }
        finishReject(new DeployCancelledError());
      };
      const timer = setTimeout(() => {
        try {
          proc.kill('SIGTERM');
        } catch {
          // Ignore kill failures
        }
        finishReject(new Error('远端命令执行超时'));
      }, timeoutMs);

      signal?.addEventListener?.('abort', onAbort, { once: true });
      proc.stdout.on('data', (d) => { stdout += d.toString(); });
      proc.stderr.on('data', (d) => { stderr += d.toString(); });
      proc.on('error', (err) => finishReject(err));
      proc.on('close', (code) => {
        if (signal?.aborted) {
          finishReject(new DeployCancelledError());
        } else if (code !== 0) {
          finishReject(new Error((summarizeCliError(stderr, stdout) || stderr || stdout || `colab exec exited with ${code}`).trim()));
        } else {
          finishResolve({ via: 'exec', stdout, stderr });
        }
      });
      proc.stdin.write(payload);
      proc.stdin.end();
    });
  }

  async runRemoteBash(
    sessionName,
    script,
    { timeoutMs = 25000, sshKey, localPort = 8000, signal, retryOnTimeout = false, maxRetries = 1 } = {},
  ) {
    if (signal?.aborted) throw new DeployCancelledError();
    const name = validateSessionName(sessionName);
    const key = sshKey || resolveDefaultSshKey();
    const tunnel = await this.checkLocalTunnel(localPort);

    // Colab restricts each runtime to a single concurrent SSH session (HTTP 429).
    // When a tunnel is active, skip SSH and run via colab exec directly.
    if (!tunnel.listening && key && fs.existsSync(key)) {
      try {
        const proxyCmd = `${this.colabBin} ssh --proxy-mode -s ${name} -i ${key}`;
        const { stdout, stderr } = await execFileAsync(
          'ssh',
          [
            '-o', 'StrictHostKeyChecking=no',
            '-o', 'UserKnownHostsFile=/dev/null',
            '-o', 'ConnectTimeout=10',
            '-o', 'BatchMode=yes',
            '-i', key,
            '-o', `ProxyCommand=${proxyCmd}`,
            'root@colab',
            'bash -s',
          ],
          {
            timeout: timeoutMs,
            signal,
            maxBuffer: 4 * 1024 * 1024,
            input: script,
            env: {
              ...process.env,
              PATH: `${path.dirname(this.colabBin)}:${process.env.PATH || ''}`,
            },
          },
        );
        return { via: 'ssh', stdout: stdout || '', stderr: stderr || '' };
      } catch (err) {
        if (signal?.aborted || err?.name === 'AbortError' || err?.code === 'ABORT_ERR') {
          throw new DeployCancelledError();
        }
        // Fall back to colab exec below if SSH key is rejected or unavailable.
      }
    }

    // Fallback via Jupyter kernel `%%bash` with retry for transient WS / cold kernel warmup
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        return await this._runColabExecOnce(name, script, timeoutMs, { signal });
      } catch (err) {
        if (err?.cancelled || signal?.aborted) throw new DeployCancelledError();
        const msg = err?.message || '';
        const isTransientWs = /WebSocketConnectionClosed|Connection is already closed|ECONNRESET/i.test(msg);
        const isTimeout = /远端命令执行超时|timed?\s*out|Kernel startup timeout/i.test(msg);
        if (attempt < maxRetries && (isTransientWs || (retryOnTimeout && isTimeout))) {
          await sleepAbortable(2000, signal);
          continue;
        }
        throw err;
      }
    }
    throw new Error('远端命令执行失败');
  }

  async checkLocalTunnel(localPort = 8000, { probePath } = {}) {
    const port = validatePort(localPort);
    const resolvedProbePath = probePath || (port === DEFAULT_H3_LOCAL_PORT ? '/system_stats' : '/v1/models');
    let listeningPid = null;
    let listeningCmd = '';
    try {
      const { stdout } = await execFileAsync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-Fp', '-Fc'], {
        timeout: 3000,
      });
      for (const line of stdout.split(/\r?\n/)) {
        if (line.startsWith('p') && !listeningPid) listeningPid = Number(line.slice(1));
        if (line.startsWith('c') && !listeningCmd) listeningCmd = line.slice(1);
      }
    } catch {
      // Not listening
    }

    let apiReady = false;
    let models = [];
    let comfySystem = null;
    let comfyDevices = [];
    let apiError = '';
    let proxyHealth = null;
    if (listeningPid) {
      const [probeRes, healthRes] = await Promise.allSettled([
        localHttpJson(port, resolvedProbePath, 3500),
        localHttpJson(port, '/__tunnel_health', 1500),
      ]);

      if (healthRes.status === 'fulfilled' && healthRes.value.ok) {
        proxyHealth = healthRes.value.data;
      }

      if (probeRes.status === 'fulfilled') {
        const resp = probeRes.value;
        if (resp.ok) {
          if (resolvedProbePath === '/system_stats') {
            if (resp.data?.system || resp.data?.devices) {
              apiReady = true;
              comfySystem = resp.data?.system || null;
              comfyDevices = resp.data?.devices || [];
            } else {
              apiError = '响应结构不是 ComfyUI /system_stats';
            }
          } else {
            apiReady = true;
            models = (resp.data?.data || []).map((m) => ({
              id: m.id,
              root: m.root || '',
              maxModelLen: m.max_model_len || null,
            }));
          }
        } else {
          apiError = resp.error || `HTTP ${resp.status}`;
        }
      } else {
        apiError = probeRes.reason?.message || '连接超时';
      }
    }

    return {
      port,
      listening: Boolean(listeningPid),
      pid: listeningPid,
      command: listeningCmd,
      mode: proxyHealth ? 'resilient-proxy' : listeningPid ? 'raw-ssh' : 'stopped',
      state: proxyHealth?.state || (listeningPid ? 'connected' : 'stopped'),
      probePath: resolvedProbePath,
      reconnectCount: proxyHealth?.reconnectCount ?? 0,
      lastProbeAt: proxyHealth?.lastProbeAt || null,
      lastProbeMs: proxyHealth?.lastProbeMs ?? null,
      lastError: proxyHealth?.lastError || '',
      sshPid: proxyHealth?.sshPid ?? null,
      upstreamPort: proxyHealth?.upstreamPort ?? null,
      managedByPlugin: this.tunnelChildren.has(port) || Boolean(proxyHealth),
      apiReady,
      models,
      comfySystem,
      comfyDevices,
      apiError,
      endpoint: resolvedProbePath === '/system_stats' ? `http://127.0.0.1:${port}` : `http://127.0.0.1:${port}/v1`,
      defaultSshKey: resolveDefaultSshKey(),
    };
  }

  async getOverview({ localPort = 8000, h3LocalPort = DEFAULT_H3_LOCAL_PORT } = {}) {
    const [whoamiRes, usageRes, sessionsRes, tunnel, h3Tunnel] = await Promise.all([
      this.runColab(['whoami']).catch((e) => ({ stdout: '', error: e.message })),
      this.runColab(['usage']).catch((e) => ({ stdout: '', error: e.message })),
      this.runColab(['sessions']).catch((e) => ({ stdout: '', error: e.message })),
      this.checkLocalTunnel(localPort, { probePath: '/v1/models' }),
      this.checkLocalTunnel(h3LocalPort, { probePath: '/system_stats' }),
    ]);

    const auth = parseWhoamiOutput(whoamiRes.stdout);
    const quota = parseUsageOutput(usageRes.stdout);
    const sessions = parseSessionsOutput(sessionsRes.stdout);

    // Fetch live status for each active session
    const enrichedSessions = await Promise.all(
      sessions.map(async (s) => {
        try {
          const st = await this.runColab(['status', '-s', s.name], { timeoutMs: 10000 });
          return { ...s, ...parseStatusOutput(st.stdout) };
        } catch {
          return { ...s, status: 'UNKNOWN', lastExec: '' };
        }
      }),
    );

    return {
      fetchedAt: new Date().toISOString(),
      auth,
      quota,
      sessions: enrichedSessions,
      tunnel,
      h3Tunnel,
      errors: [whoamiRes.error, usageRes.error, sessionsRes.error].filter(Boolean),
    };
  }

  async _provisionSession({ name, gpu, tpu, highMem, timeoutMs = 240000, signal } = {}) {
    const args = ['new'];
    const validatedName = name && String(name).trim() ? validateSessionName(name) : '';
    if (validatedName) args.push('-s', validatedName);
    if (gpu && String(gpu).trim()) {
      args.push('--gpu', String(gpu).trim().toUpperCase());
    } else if (tpu && String(tpu).trim()) {
      args.push('--tpu', String(tpu).trim().toUpperCase());
    }
    if (highMem) args.push('--high-mem');

    const maxNetworkRetries = 1;
    for (let attempt = 0; attempt <= maxNetworkRetries; attempt += 1) {
      try {
        return await this.runColab(args, { timeoutMs, signal, transientRetries: 0 });
      } catch (err) {
        if (err?.cancelled || signal?.aborted) throw new DeployCancelledError();
        // Reconcile if backend finished creating the session right around a client timeout or connection drop.
        if (validatedName) {
          const check = await this.runColab(['sessions'], { timeoutMs: 15000, signal }).catch(() => ({ stdout: '' }));
          if (parseSessionsOutput(check.stdout).some((s) => s.name === validatedName)) {
            return { stdout: `[colab] Session '${validatedName}' READY (reconciled).`, stderr: '' };
          }
        }
        const isTransient =
          Boolean(err?.isTransientNetwork) || isTransientColabNetworkError(err?.rawDetail || err?.message);
        if (isTransient && attempt < maxNetworkRetries) {
          await sleepAbortable(this.transientRetryBaseMs ?? 1200, signal);
          continue;
        }
        if (isTransient) {
          throw err;
        }
        const hint = this._readRecentColabLogHint();
        const wrapped = new Error(hint ? `${hint}（${err.message}）` : err.message);
        if (err?.rawDetail || err?.message) {
          wrapped.rawDetail = err.rawDetail || err.message;
        }
        throw wrapped;
      }
    }
  }

  async createSession({ name, gpu, tpu, highMem } = {}) {
    const { stdout, stderr } = await this._provisionSession({ name, gpu, tpu, highMem });
    return {
      ok: true,
      message: (stdout || stderr || '会话已创建').trim(),
      overview: await this.getOverview(),
    };
  }

  async stopSession({ name } = {}) {
    const sessionName = validateSessionName(name);
    const { stdout, stderr } = await this.runColab(['stop', '-s', sessionName], { timeoutMs: 30000 });
    return {
      ok: true,
      message: (stdout || stderr || `会话 ${sessionName} 已停止`).trim(),
      overview: await this.getOverview(),
    };
  }

  async getSessionUrl({ name } = {}) {
    const sessionName = validateSessionName(name);
    const { stdout } = await this.runColab(['url', '-s', sessionName], { timeoutMs: 10000 });
    const url = stdout.trim().split(/\r?\n/).find((l) => l.startsWith('http')) || stdout.trim();
    return { name: sessionName, url };
  }

  async inspectService({ sessionName, remotePort = 8000, localPort = 8000, logLines = 35 } = {}) {
    const name = validateSessionName(sessionName);
    const rPort = validatePort(remotePort, 8000);
    const lines = Math.min(Math.max(Number(logLines) || 35, 10), 200);

    const script = `
echo "===GPU==="
nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu,temperature.gpu --format=csv,noheader,nounits 2>&1 || echo "ERR_NVIDIA"
echo "===VLLM_PS==="
pgrep -af "vllm serve" 2>&1 || echo "NOT_RUNNING"
echo "===START_SCRIPT==="
if [ -f /content/start_vllm.sh ]; then cat /content/start_vllm.sh; else echo "NO_START_SCRIPT"; fi
echo "===REMOTE_MODELS==="
curl -sf http://127.0.0.1:${rPort}/v1/models 2>&1 || echo "NOT_READY"
echo "===LOG_TAIL==="
LOG_FILE="/content/vllm_nvfp4.log"
if [ ! -f "$LOG_FILE" ] && [ -f /content/vllm.log ]; then LOG_FILE="/content/vllm.log"; fi
if [ -f "$LOG_FILE" ]; then tail -n ${lines} "$LOG_FILE"; else echo "NO_LOG"; fi
`;

    const [{ via, stdout }, tunnel] = await Promise.all([
      this.runRemoteBash(name, script, { timeoutMs: 25000 }),
      this.checkLocalTunnel(localPort),
    ]);

    const extract = (tag, nextTag) => {
      const start = stdout.indexOf(`===${tag}===`);
      if (start === -1) return '';
      const bodyStart = start + tag.length + 6;
      const end = nextTag ? stdout.indexOf(`===${nextTag}===`, bodyStart) : stdout.length;
      return stdout.slice(bodyStart, end === -1 ? stdout.length : end).trim();
    };

    const gpuRaw = extract('GPU', 'VLLM_PS');
    const vllmPsRaw = extract('VLLM_PS', 'START_SCRIPT');
    const startScript = extract('START_SCRIPT', 'REMOTE_MODELS');
    const remoteModelsRaw = extract('REMOTE_MODELS', 'LOG_TAIL');
    const logTail = extract('LOG_TAIL', null);

    let remoteModels = [];
    let remoteApiReady = false;
    if (remoteModelsRaw && remoteModelsRaw.startsWith('{')) {
      try {
        const parsed = JSON.parse(remoteModelsRaw);
        remoteApiReady = true;
        remoteModels = (parsed.data || []).map((m) => ({
          id: m.id,
          root: m.root || '',
          maxModelLen: m.max_model_len || null,
        }));
      } catch {
        // Ignore parse error
      }
    }

    const vllmRunning = Boolean(vllmPsRaw && !vllmPsRaw.includes('NOT_RUNNING'));
    return {
      sessionName: name,
      inspectedVia: via,
      fetchedAt: new Date().toISOString(),
      gpu: parseNvidiaSmiCsv(gpuRaw),
      vllm: {
        running: vllmRunning,
        processLine: vllmRunning ? vllmPsRaw : '',
        remoteApiReady,
        remoteModels,
        hasStartScript: startScript !== 'NO_START_SCRIPT',
        startScript: startScript === 'NO_START_SCRIPT' ? '' : startScript,
        logTail: logTail === 'NO_LOG' ? '' : logTail,
      },
      tunnel,
    };
  }

  _parseGpuNameAndMem(rawLine) {
    const line = String(rawLine || '').split(/\r?\n/).map((s) => s.trim()).find((s) => s && !s.startsWith('NO_GPU'));
    if (!line || !line.includes(',')) return null;
    const [gpuNameRaw, memRaw] = line.split(',').map((s) => s.trim());
    const mem = Number(memRaw);
    return gpuNameRaw ? { name: gpuNameRaw, memoryTotalMiB: Number.isFinite(mem) ? mem : null } : null;
  }

  async _detectRemoteGpu(sessionName, { localPort = 8000 } = {}) {
    try {
      const { stdout } = await this.runRemoteBash(
        sessionName,
        'nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits 2>/dev/null || echo "NO_GPU"',
        { timeoutMs: 15000, localPort },
      );
      return this._parseGpuNameAndMem(stdout);
    } catch {
      return null;
    }
  }

  async startVllm({
    sessionName,
    model = DEFAULT_MODEL_REPO,
    servedName = DEFAULT_SERVED_NAME,
    port = 8000,
    maxModelLen = 262144,
    maxNumSeqs = 128,
    kvCacheDtype = 'smart',
    enableMtp = true,
    enableTools = true,
    useExistingScript = false,
  } = {}) {
    const name = validateSessionName(sessionName);
    const rPort = validatePort(port, 8000);

    let detectedGpu = null;
    if (!useExistingScript && (!kvCacheDtype || String(kvCacheDtype).trim().toLowerCase() === 'smart')) {
      detectedGpu = await this._detectRemoteGpu(name);
    }
    const effectiveConfig = resolveGpuVllmDefaults({
      gpuHardware: detectedGpu?.name || '',
      gpuMemoryMiB: detectedGpu?.memoryTotalMiB ?? null,
      requestedMaxModelLen: maxModelLen,
      requestedKvCacheDtype: kvCacheDtype,
    });

    const startScript = buildStartVllmScript({
      model,
      servedName,
      remotePort: rPort,
      maxModelLen: effectiveConfig.maxModelLen,
      maxNumSeqs,
      kvCacheDtype: effectiveConfig.kvCacheDtype,
      enableMtp,
      enableTools,
    });

    let scriptBody = '';
    if (useExistingScript) {
      scriptBody = `
pkill -f "vllm serve" || true
sleep 2
if [ ! -x /content/start_vllm.sh ]; then
  echo "NO_EXISTING_SCRIPT"
  exit 1
fi
nohup /content/start_vllm.sh > /content/vllm_nvfp4.log 2>&1 < /dev/null &
echo "STARTED_PID=$!"
`;
    } else {
      scriptBody = `
pkill -f "vllm serve" || true
sleep 2
cat << 'EOF' > /content/start_vllm.sh
${startScript}
EOF
chmod +x /content/start_vllm.sh
nohup /content/start_vllm.sh > /content/vllm_nvfp4.log 2>&1 < /dev/null &
echo "STARTED_PID=$!"
`;
    }

    const { stdout } = await this.runRemoteBash(name, scriptBody, { timeoutMs: 25000 });
    return {
      ok: true,
      sessionName: name,
      effectiveConfig: {
        gpuName: detectedGpu?.name || '',
        gpuMemoryMiB: detectedGpu?.memoryTotalMiB ?? null,
        ...effectiveConfig,
      },
      output: stdout.trim(),
    };
  }

  _extractTaggedSection(text, tag, nextTag) {
    const start = text.indexOf(`===${tag}===`);
    if (start === -1) return '';
    const bodyStart = start + tag.length + 6;
    const end = nextTag ? text.indexOf(`===${nextTag}===`, bodyStart) : text.length;
    return text.slice(bodyStart, end === -1 ? text.length : end).trim();
  }

  _serializeDeployJob(job = this.deployJob) {
    if (!job) return null;
    const endMs = job.finishedAt ? Date.parse(job.finishedAt) : Date.now();
    const startMs = Date.parse(job.startedAt);
    return {
      ...job,
      elapsedSec: Number.isFinite(startMs) ? Math.max(0, Math.round((endMs - startMs) / 1000)) : 0,
      steps: job.steps.map((s) => ({ ...s })),
    };
  }

  getDeployStatus() {
    return {
      active: this.deployJob?.status === 'running',
      job: this._serializeDeployJob(),
    };
  }

  _updateDeployStep(job, key, status, detail) {
    const step = job.steps.find((s) => s.key === key);
    if (step) {
      step.status = status;
      if (detail !== undefined) step.detail = detail;
    }
    job.updatedAt = new Date().toISOString();
  }

  _cancelDeployJob(jobProp, ctrlProp) {
    const job = this[jobProp];
    if (!job) {
      return { ok: true, cancelled: false, job: null };
    }
    if (job.status === 'running') {
      if (this[ctrlProp]) {
        this[ctrlProp].abort();
        this[ctrlProp] = null;
      }
      for (const st of job.steps) {
        if (st.status === 'running') {
          st.status = 'cancelled';
          st.detail = '已手动终止';
        }
      }
      job.status = 'cancelled';
      job.stage = 'cancelled';
      job.stageLabel = '已手动终止';
      job.error = '';
      job.updatedAt = new Date().toISOString();
      job.finishedAt = job.updatedAt;
    }
    return { ok: true, cancelled: true, job: this._serializeDeployJob(job) };
  }

  _resolveRetryOpts(job, lastOpts, fromStep) {
    if (job?.status === 'running') {
      throw new Error('当前已有正在运行的拉起任务，请先终止后再重试');
    }
    if (!job || !lastOpts) {
      throw new Error('没有可重试的历史拉起任务');
    }

    let targetStep = fromStep && STEP_ORDER.includes(fromStep) ? fromStep : '';
    if (!targetStep) {
      const stoppedStep = job.steps.find((s) => s.status === 'error' || s.status === 'cancelled');
      targetStep = stoppedStep?.key || 'session';
    }

    const baseOpts = { ...lastOpts };
    if (targetStep !== 'session') {
      baseOpts.sessionName = job.sessionName || baseOpts.sessionName;
      baseOpts.gpu = job.gpu || baseOpts.gpu;
    }
    return { ...baseOpts, startFromStep: targetStep };
  }

  async _ensureDeploySession(job, { name, gpuSpec, fallbackGpus, highMem, lPort, signal, lastOpts } = {}) {
    const sessionsRes = await this.runColab(['sessions'], { timeoutMs: 20000, signal });
    if (signal?.aborted) throw new DeployCancelledError();

    const active = parseSessionsOutput(sessionsRes.stdout);
    const existingPrimary = active.find((s) => s.name === name);
    let actualSessionName = name;
    let actualGpu = gpuSpec;

    if (existingPrimary) {
      actualGpu = existingPrimary.hardware || gpuSpec;
      job.gpu = actualGpu;
      this._updateDeployStep(job, 'session', 'done', `复用活跃会话 ${actualSessionName} (${actualGpu})`);
    } else {
      const candidates = [gpuSpec, ...fallbackGpus];
      const triedGpus = [];
      let provisioned = false;
      let lastProvisionErr = null;

      for (let i = 0; i < candidates.length; i += 1) {
        if (signal?.aborted) throw new DeployCancelledError();
        const candidateGpu = candidates[i];
        triedGpus.push(candidateGpu);
        const isFallback = i > 0;
        const candidateName =
          isFallback && name.toLowerCase() === gpuSpec.toLowerCase()
            ? candidateGpu.toLowerCase()
            : name;

        const existingCandidate = active.find((s) => s.name === candidateName);
        if (existingCandidate) {
          actualSessionName = existingCandidate.name;
          actualGpu = existingCandidate.hardware || candidateGpu;
          provisioned = true;
          job.sessionName = actualSessionName;
          job.gpu = actualGpu;
          this._updateDeployStep(job, 'session', 'done', `复用备选活跃会话 ${actualSessionName} (${actualGpu})`);
          break;
        }

        job.stage = 'session';
        job.stageLabel = `${isFallback ? '切换备选 ' : '检查/创建 '}${candidateGpu} 实例 (${candidateName})`;
        this._updateDeployStep(
          job,
          'session',
          'running',
          `正在向 Google 申请 ${candidateGpu} 实例 (${candidateName})，若遇节点繁忙将自动重试…`,
        );

        try {
          // Clear any stale tunnel bound to an old released VM before provisioning/SSH.
          await this.stopTunnel({ localPort: lPort }).catch(() => {});
          await this._provisionSession({ name: candidateName, gpu: candidateGpu, highMem, signal });
          actualSessionName = candidateName;
          actualGpu = candidateGpu;
          job.sessionName = actualSessionName;
          job.gpu = actualGpu;
          job.createdNewSession = true;
          provisioned = true;
          this._updateDeployStep(
            job,
            'session',
            'done',
            isFallback
              ? `主选 ${gpuSpec} 暂不可用，已自动切换并创建 ${candidateGpu} 会话 (${candidateName})`
              : `已新建 ${candidateGpu} 会话 (${candidateName})`,
          );
          break;
        } catch (err) {
          if (err?.cancelled || signal?.aborted) throw new DeployCancelledError();
          lastProvisionErr = err;
          const nextGpu = candidates[i + 1];
          if (nextGpu) {
            this._updateDeployStep(
              job,
              'session',
              'running',
              `${candidateGpu} 暂不可用，正在自动切换备选 ${nextGpu}…`,
            );
          }
        }
      }

      if (!provisioned) {
        if (lastProvisionErr?.rawDetail && !job.logTail) {
          job.logTail = lastProvisionErr.rawDetail.slice(-4000);
        }
        const finalMsg =
          triedGpus.length > 1
            ? `已尝试 ${triedGpus.join(' → ')} 均失败：${lastProvisionErr?.message || '无法创建实例'}`
            : lastProvisionErr?.message || `无法创建 ${gpuSpec} 会话`;
        const finalErr = new Error(finalMsg);
        if (lastProvisionErr?.rawDetail) finalErr.rawDetail = lastProvisionErr.rawDetail;
        throw finalErr;
      }
    }

    if (lastOpts) {
      lastOpts.sessionName = actualSessionName;
      lastOpts.gpu = actualGpu;
    }

    const sessionStep = job.steps.find((s) => s.key === 'session');
    if (sessionStep) sessionStep.label = `检查 / 新建 ${actualGpu} 实例`;
    return { actualSessionName, actualGpu };
  }

  cancelDeploy() {
    return this._cancelDeployJob('deployJob', '_deployAbortController');
  }

  retryDeploy({ fromStep } = {}) {
    return this.startDeploy(this._resolveRetryOpts(this.deployJob, this._lastDeployOpts, fromStep));
  }

  async startDeploy({
    sessionName = 'g4',
    gpu = 'G4',
    fallbackGpus = ['A100'],
    highMem = false,
    localPort = 8000,
    remotePort = 8000,
    model = DEFAULT_MODEL_REPO,
    servedName = DEFAULT_SERVED_NAME,
    maxModelLen = 262144,
    maxNumSeqs = 128,
    kvCacheDtype = 'smart',
    enableMtp = true,
    enableTools = true,
    forceReinstall = false,
    forceRestart = false,
    startFromStep = 'session',
  } = {}) {
    if (this.deployJob?.status === 'running') {
      return { ok: true, alreadyRunning: true, job: this._serializeDeployJob() };
    }

    const name = validateSessionName(sessionName);
    const lPort = validatePort(localPort, 8000);
    const rPort = validatePort(remotePort, 8000);
    const gpuSpec = gpu ? validateSafeArg(gpu, 'GPU 规格', 'G4').toUpperCase() : 'G4';
    const normalizedFallbacks = normalizeFallbackGpus(fallbackGpus, gpuSpec);
    const safeModel = validateSafeArg(model, '模型名称', DEFAULT_MODEL_REPO);
    const safeServedName = validateSafeArg(servedName, '对外模型名', DEFAULT_SERVED_NAME);
    const startStep = STEP_ORDER.includes(startFromStep) ? startFromStep : 'session';
    const startIdx = STEP_ORDER.indexOf(startStep);
    const validatedDefaults = resolveGpuVllmDefaults({
      gpuHardware: gpuSpec,
      requestedMaxModelLen: maxModelLen,
      requestedKvCacheDtype: kvCacheDtype,
    });

    // Validate script inputs synchronously so malformed arguments fail fast on the HTTP request.
    buildStartVllmScript({
      model: safeModel,
      servedName: safeServedName,
      remotePort: rPort,
      maxModelLen: validatedDefaults.maxModelLen,
      maxNumSeqs,
      kvCacheDtype: validatedDefaults.kvCacheDtype,
      enableMtp,
      enableTools,
    });

    this._lastDeployOpts = {
      sessionName: name,
      gpu: gpuSpec,
      fallbackGpus: normalizedFallbacks,
      highMem: Boolean(highMem),
      localPort: lPort,
      remotePort: rPort,
      model: safeModel,
      servedName: safeServedName,
      maxModelLen,
      maxNumSeqs,
      kvCacheDtype,
      enableMtp: Boolean(enableMtp),
      enableTools: Boolean(enableTools),
      forceReinstall: Boolean(forceReinstall),
      forceRestart: Boolean(forceRestart),
    };

    const prevEffectiveConfig = startStep !== 'session' ? this.deployJob?.effectiveConfig || null : null;
    const now = new Date().toISOString();
    const job = {
      id: `deploy-${Date.now()}`,
      status: 'running',
      stage: startStep,
      stageLabel:
        startStep === 'session'
          ? `检查/创建 ${gpuSpec} 实例 (${name})`
          : startStep === 'bootstrap'
            ? `检测远端 GPU 并拉起下载 (${name})`
            : startStep === 'waiting_api'
              ? `恢复轮询远端服务状态 (${name})`
              : `重建本机 :${lPort} 高可用隧道 (${name})`,
      sessionName: name,
      gpu: gpuSpec,
      requestedGpu: gpuSpec,
      fallbackGpus: normalizedFallbacks,
      localPort: lPort,
      remotePort: rPort,
      model: safeModel,
      servedName: safeServedName,
      effectiveConfig: prevEffectiveConfig,
      createdNewSession: false,
      startedAt: now,
      updatedAt: now,
      finishedAt: null,
      remoteStage: '',
      logTail: startStep !== 'session' ? this.deployJob?.logTail || '' : '',
      error: '',
      tunnel: null,
      overview: null,
      steps: [
        {
          key: 'session',
          label: `检查 / 新建 ${gpuSpec} 实例`,
          status: startIdx > 0 ? 'done' : 'running',
          detail: startIdx > 0 ? `复用已有会话 ${name} (${gpuSpec})` : '正在查询活跃会话',
        },
        {
          key: 'bootstrap',
          label: '检查环境并拉起 vLLM 下载',
          status: startIdx > 1 ? 'done' : startIdx === 1 ? 'running' : 'pending',
          detail: startIdx > 1 ? '跳过重装，直接恢复后续步骤' : '',
        },
        {
          key: 'waiting_api',
          label: '等待模型权重下载与显存加载',
          status: startIdx > 2 ? 'done' : startIdx === 2 ? 'running' : 'pending',
          detail: startIdx > 2 ? '跳过等待，直接重建隧道' : '',
        },
        {
          key: 'tunnel',
          label: `建立本机 :${lPort} 高可用隧道`,
          status: startIdx === 3 ? 'running' : 'pending',
          detail: '',
        },
      ],
    };
    this.deployJob = job;

    const abortController = new AbortController();
    this._deployAbortController = abortController;

    this._executeDeployJob(job, {
      name,
      gpuSpec,
      fallbackGpus: normalizedFallbacks,
      highMem: Boolean(highMem),
      lPort,
      rPort,
      model: safeModel,
      servedName: safeServedName,
      maxModelLen,
      maxNumSeqs,
      kvCacheDtype,
      enableMtp: Boolean(enableMtp),
      enableTools: Boolean(enableTools),
      forceReinstall: Boolean(forceReinstall),
      forceRestart: Boolean(forceRestart),
      startFromStep: startStep,
      abortController,
    }).catch((err) => {
      if (job.status === 'running') {
        if (err?.cancelled || abortController.signal.aborted) {
          job.status = 'cancelled';
          job.stage = 'cancelled';
          job.stageLabel = '已手动终止';
          job.error = '';
        } else {
          job.status = 'failed';
          job.stage = 'failed';
          job.stageLabel = '一键拉起失败';
          job.error = err?.message || '部署过程出现未知异常';
        }
        job.finishedAt = new Date().toISOString();
      }
    });

    return { ok: true, alreadyRunning: false, job: this._serializeDeployJob(job) };
  }

  async _executeDeployJob(job, opts) {
    const {
      name,
      gpuSpec,
      fallbackGpus,
      highMem,
      lPort,
      rPort,
      model,
      servedName,
      maxModelLen,
      maxNumSeqs,
      kvCacheDtype,
      enableMtp,
      enableTools,
      forceReinstall,
      forceRestart,
      startFromStep = 'session',
      abortController,
    } = opts;
    const signal = abortController?.signal;
    const startIdx = STEP_ORDER.indexOf(startFromStep);
    const pollIntervalMs = this.deployPollIntervalMs ?? 4000;
    const pollTimeoutMs = this.deployTimeoutMs ?? 15 * 60 * 1000;

    try {
      // 1. Ensure target Colab session exists (with optional fallback GPUs)
      const { actualSessionName, actualGpu } = await this._ensureDeploySession(job, {
        name,
        gpuSpec,
        fallbackGpus,
        highMem,
        lPort,
        signal,
        lastOpts: this._lastDeployOpts,
      });

      // 2. Probe remote GPU hardware + running vLLM status, then adapt vLLM flags
      let alreadyServing = false;
      if (startIdx <= STEP_ORDER.indexOf('bootstrap')) {
        if (signal?.aborted) throw new DeployCancelledError();
        job.stage = 'bootstrap';
        job.stageLabel = '检测远端 GPU 型号并适配启动参数';
        this._updateDeployStep(job, 'bootstrap', 'running', '正在连接远端并检测显卡架构与 vLLM 状态（新实例冷启动约 15-40 秒）…');

        const probeRes = await this.runRemoteBash(
          actualSessionName,
          `echo "===GPU==="
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits 2>/dev/null || echo "NO_GPU"
echo "===MODELS==="
curl -sf http://127.0.0.1:${rPort}/v1/models 2>/dev/null || echo "NOT_READY"`,
          { timeoutMs: 60000, localPort: lPort, signal, retryOnTimeout: true, maxRetries: 2 },
        );

        const gpuRaw = this._extractTaggedSection(probeRes.stdout, 'GPU', 'MODELS');
        const modelsRaw = this._extractTaggedSection(probeRes.stdout, 'MODELS', null);
        const detectedGpu = this._parseGpuNameAndMem(gpuRaw);
        const adapted = resolveGpuVllmDefaults({
          gpuHardware: detectedGpu?.name || actualGpu,
          gpuMemoryMiB: detectedGpu?.memoryTotalMiB ?? null,
          requestedMaxModelLen: maxModelLen,
          requestedKvCacheDtype: kvCacheDtype,
        });
        job.effectiveConfig = {
          gpuName: detectedGpu?.name || actualGpu,
          gpuMemoryMiB: detectedGpu?.memoryTotalMiB ?? null,
          ...adapted,
        };

        alreadyServing =
          !forceRestart &&
          !forceReinstall &&
          modelsRaw.startsWith('{') &&
          modelsRaw.includes('"data"');

        if (alreadyServing) {
          this._updateDeployStep(job, 'bootstrap', 'done', `远端 vLLM 已就绪（${adapted.adaptationSummary}）`);
          this._updateDeployStep(job, 'waiting_api', 'done', '模型已在显存中提供服务');
        } else {
          const deployScript = buildDeployScript({
            forceReinstall,
            model,
            servedName,
            remotePort: rPort,
            maxModelLen: adapted.maxModelLen,
            maxNumSeqs,
            kvCacheDtype: adapted.kvCacheDtype,
            enableMtp,
            enableTools,
          });

          // Upload & detach deploy script so it survives transient SSH/WS disconnects
          const launchScript = `
cat << 'DEPLOY_EOF' > /content/deploy_qwen38.sh
${deployScript}
DEPLOY_EOF
chmod +x /content/deploy_qwen38.sh
if command -v setsid >/dev/null 2>&1; then
  setsid bash /content/deploy_qwen38.sh > /content/deploy_qwen38.launcher.log 2>&1 < /dev/null &
else
  nohup bash /content/deploy_qwen38.sh > /content/deploy_qwen38.launcher.log 2>&1 < /dev/null &
fi
echo "DEPLOY_PID=$!"
`;
          await this.runRemoteBash(actualSessionName, launchScript, {
            timeoutMs: 45000,
            localPort: lPort,
            signal,
            retryOnTimeout: true,
            maxRetries: 1,
          });
          this._updateDeployStep(job, 'bootstrap', 'done', `已下发部署脚本（${adapted.adaptationSummary}）`);
        }
      }

      // 3. Poll remote progress until /v1/models responds
      if (startIdx <= STEP_ORDER.indexOf('waiting_api') && !alreadyServing) {
        if (signal?.aborted) throw new DeployCancelledError();
        job.stage = 'waiting_api';
        job.stageLabel = '正在安装环境 / 下载权重并加载模型…';
        this._updateDeployStep(job, 'waiting_api', 'running', '正在检查环境并启动下载…');

        await this._pollRemoteApiUntilReady(job, {
          sessionName: actualSessionName,
          remotePort: rPort,
          localPort: lPort,
          pollIntervalMs,
          pollTimeoutMs,
          signal,
        });
        this._updateDeployStep(job, 'waiting_api', 'done', '远端 /v1/models 已响应就绪');
      }

      // 4. Establish/refresh local resilient SSH tunnel and verify API readiness
      if (signal?.aborted) throw new DeployCancelledError();
      job.stage = 'tunnel';
      job.stageLabel = `正在建立本机 :${lPort} 高可用隧道`;
      this._updateDeployStep(job, 'tunnel', 'running', `正在连接 ${actualSessionName} SSH 隧道并校验 /v1/models…`);

      const currentTunnel = await this.checkLocalTunnel(lPort);
      let tunnelInfo;
      if (startFromStep === 'tunnel' || job.createdNewSession || !currentTunnel.listening || !currentTunnel.apiReady) {
        const tunRes = await this.restartTunnel({ sessionName: actualSessionName, localPort: lPort, remotePort: rPort });
        tunnelInfo = tunRes.tunnel;
      } else {
        tunnelInfo = currentTunnel;
      }

      if (signal?.aborted) throw new DeployCancelledError();
      if (!tunnelInfo?.apiReady) {
        throw new Error(tunnelInfo?.apiError || '隧道已建立，但本机 /v1/models 尚未就绪，请尝试点击「重建隧道」');
      }

      this._updateDeployStep(job, 'tunnel', 'done', `已连通 http://127.0.0.1:${lPort}/v1`);
      job.tunnel = tunnelInfo;
      job.overview = await this.getOverview({ localPort: lPort }).catch(() => null);
      job.status = 'ready';
      job.stage = 'ready';
      job.stageLabel = 'Qwen3.8 模型服务已就绪';
      job.finishedAt = new Date().toISOString();
    } catch (err) {
      if (err?.cancelled || signal?.aborted) {
        for (const st of job.steps) {
          if (st.status === 'running') {
            st.status = 'cancelled';
            st.detail = '已手动终止';
          }
        }
        job.status = 'cancelled';
        job.stage = 'cancelled';
        job.stageLabel = '已手动终止';
        job.error = '';
        job.finishedAt = new Date().toISOString();
        return;
      }
      const runningStep = job.steps.find((s) => s.status === 'running');
      const shortErr = err?.message || '执行失败';
      if (runningStep) {
        runningStep.status = 'error';
        runningStep.detail = shortErr.length > 120 ? `${shortErr.slice(0, 119)}…` : shortErr;
      }
      if (err?.rawDetail && !job.logTail) {
        job.logTail = err.rawDetail.slice(-4000);
      }
      job.status = 'failed';
      job.stage = 'failed';
      job.stageLabel = '一键拉起失败';
      job.error = shortErr;
      job.finishedAt = new Date().toISOString();
    } finally {
      if (this._deployAbortController === abortController) {
        this._deployAbortController = null;
      }
    }
  }

  async _pollRemoteApiUntilReady(job, { sessionName, remotePort, localPort, pollIntervalMs, pollTimeoutMs, signal }) {
    const deadline = Date.now() + pollTimeoutMs;
    let deadProcessStrikes = 0;
    let transientPollErrors = 0;

    while (Date.now() < deadline) {
      if (signal?.aborted) throw new DeployCancelledError();
      const checkScript = `
echo "===STAGE==="
cat /content/.deploy_stage 2>/dev/null || echo "unknown"
echo "===ALIVE==="
pgrep -af "deploy_qwen38.sh|vllm serve|start_vllm.sh" 2>/dev/null || echo "NONE"
echo "===MODELS==="
curl -sf http://127.0.0.1:${remotePort}/v1/models 2>/dev/null || echo "NOT_READY"
echo "===LOG==="
STAGE=$(cat /content/.deploy_stage 2>/dev/null || echo "")
if [ "$STAGE" = "installing_vllm" ] || [ "$STAGE" = "checking_env" ] || [ "$STAGE" = "failed" ]; then
  tail -n 25 /content/deploy_qwen38.log 2>/dev/null || tail -n 25 /content/deploy_qwen38.launcher.log 2>/dev/null || true
else
  tail -n 25 /content/vllm_nvfp4.log 2>/dev/null || tail -n 25 /content/deploy_qwen38.log 2>/dev/null || true
fi
`;
      let stdout = '';
      try {
        const res = await this.runRemoteBash(sessionName, checkScript, {
          timeoutMs: 35000,
          localPort,
          signal,
        });
        stdout = res.stdout;
        transientPollErrors = 0;
      } catch (err) {
        if (err?.cancelled || signal?.aborted) throw new DeployCancelledError();
        transientPollErrors += 1;
        if (transientPollErrors >= 3) {
          throw err;
        }
        this._updateDeployStep(
          job,
          'waiting_api',
          'running',
          `远端状态轮询暂时超时 (${transientPollErrors}/3)，正在自动重试…`,
        );
        await sleepAbortable(pollIntervalMs, signal);
        continue;
      }

      const remoteStage = this._extractTaggedSection(stdout, 'STAGE', 'ALIVE');
      const aliveRaw = this._extractTaggedSection(stdout, 'ALIVE', 'MODELS');
      const modelsRaw = this._extractTaggedSection(stdout, 'MODELS', 'LOG');
      const logTail = this._extractTaggedSection(stdout, 'LOG', null);

      job.remoteStage = remoteStage;
      if (logTail) job.logTail = logTail;

      if (modelsRaw.startsWith('{') && modelsRaw.includes('"data"')) {
        return true;
      }

      if (remoteStage === 'failed') {
        throw new Error('远端环境安装或脚本执行失败，请查看下方日志尾部');
      }

      if (remoteStage === 'installing_vllm' || remoteStage === 'checking_env') {
        job.stageLabel = '正在远端安装 vLLM 与依赖包…';
        this._updateDeployStep(job, 'waiting_api', 'running', '正在安装 vLLM（首次创建实例约需 1-2 分钟）');
      } else if (logTail.includes('Downloading')) {
        job.stageLabel = '正在从 Hugging Face 下载 Qwen3.8 权重…';
        this._updateDeployStep(job, 'waiting_api', 'running', '正在下载 Qwen3.8-NVFP4 权重（约 19.15 GiB，机房通常约 1 分钟）');
      } else if (logTail.includes('Loading') || logTail.includes('torch.compile') || logTail.includes('Capturing')) {
        job.stageLabel = '正在加载权重并编译 CUDA Graph…';
        this._updateDeployStep(job, 'waiting_api', 'running', '模型已加载/正在编译推理引擎，马上就绪…');
      } else {
        job.stageLabel = '正在等待远端 vLLM 启动…';
        this._updateDeployStep(job, 'waiting_api', 'running', `当前阶段：${remoteStage || '启动中'}`);
      }

      if (aliveRaw === 'NONE') {
        deadProcessStrikes += 1;
        if (deadProcessStrikes >= 2) {
          throw new Error('远端部署与 vLLM 进程已退出，请查看日志确认报错原因');
        }
      } else {
        deadProcessStrikes = 0;
      }

      await sleepAbortable(pollIntervalMs, signal);
    }

    throw new Error('等待远端 vLLM 就绪超时，可打开机器检测查看实时日志');
  }

  async stopVllm({ sessionName } = {}) {
    const name = validateSessionName(sessionName);
    const { stdout } = await this.runRemoteBash(
      name,
      `pkill -f "vllm serve" || true\nsleep 2\npgrep -af "vllm serve" || echo "STOPPED"`,
      { timeoutMs: 20000 },
    );
    return { ok: true, sessionName: name, output: stdout.trim() };
  }

  async startTunnel({ sessionName, localPort = 8000, remotePort, probePath, sshKey } = {}) {
    const name = validateSessionName(sessionName);
    const lPort = validatePort(localPort, 8000);
    const rPort = validatePort(remotePort ?? lPort, lPort);
    const resolvedProbePath = probePath || (lPort === DEFAULT_H3_LOCAL_PORT ? '/system_stats' : '/v1/models');
    const key = sshKey || resolveDefaultSshKey();
    if (!key || !fs.existsSync(key)) {
      throw new Error('本机未找到可用的 SSH 私钥（~/.ssh/id_ed25519 或 id_ed25519_github 等）');
    }

    const existing = await this.checkLocalTunnel(lPort, { probePath: resolvedProbePath });
    if (existing.listening) {
      return { ok: true, alreadyRunning: true, tunnel: existing };
    }

    const child = spawn(
      resolveNodeBin(),
      [
        TUNNEL_PROXY_SCRIPT,
        '--session', name,
        '--port', String(lPort),
        '--remote-port', String(rPort),
        '--probe-path', resolvedProbePath,
        '--ssh-key', key,
      ],
      {
        detached: true,
        stdio: 'ignore',
        env: {
          ...process.env,
          ELECTRON_RUN_AS_NODE: '1',
          PATH: `${path.dirname(this.colabBin)}:${process.env.PATH || ''}`,
        },
      },
    );
    child.unref();
    this.tunnelChildren.set(lPort, { pid: child.pid, sessionName: name, startedAt: new Date().toISOString() });
    child.on('exit', () => {
      const current = this.tunnelChildren.get(lPort);
      if (current && current.pid === child.pid) {
        this.tunnelChildren.delete(lPort);
      }
    });

    // Wait up to 12s for local reverse proxy and upstream SSH handshake
    for (let i = 0; i < 24; i += 1) {
      await new Promise((r) => setTimeout(r, 500));
      const status = await this.checkLocalTunnel(lPort, { probePath: resolvedProbePath });
      if (status.apiReady || (status.mode === 'resilient-proxy' && status.listening && status.state === 'connected')) {
        return { ok: true, alreadyRunning: false, tunnel: status };
      }
    }

    return {
      ok: true,
      alreadyRunning: false,
      tunnel: await this.checkLocalTunnel(lPort, { probePath: resolvedProbePath }),
    };
  }

  async stopTunnel({ localPort = 8000 } = {}) {
    const lPort = validatePort(localPort, 8000);
    const managed = this.tunnelChildren.get(lPort);
    if (managed?.pid) {
      try {
        process.kill(managed.pid, 'SIGTERM');
      } catch {
        // Ignore if already gone
      }
      this.tunnelChildren.delete(lPort);
    }

    const current = await this.checkLocalTunnel(lPort);
    const cmd = (current.command || '').toLowerCase();
    if (
      current.listening &&
      current.pid &&
      current.pid !== process.pid &&
      (current.mode === 'resilient-proxy' || cmd.includes('ssh') || cmd.includes('node') || cmd.includes('dsh'))
    ) {
      try {
        process.kill(current.pid, 'SIGTERM');
      } catch {
        // Ignore
      }
    }

    for (let i = 0; i < 10; i += 1) {
      await new Promise((r) => setTimeout(r, 250));
      const next = await this.checkLocalTunnel(lPort);
      if (!next.listening) {
        return { ok: true, tunnel: next };
      }
    }
    return { ok: true, tunnel: await this.checkLocalTunnel(lPort) };
  }

  async restartTunnel({ sessionName, localPort = 8000, remotePort, probePath, sshKey } = {}) {
    await this.stopTunnel({ localPort });
    // Allow Colab time to release the single SSH session slot before reconnecting.
    await new Promise((r) => setTimeout(r, 1500));
    return this.startTunnel({ sessionName, localPort, remotePort, probePath, sshKey });
  }

  async inspectH3Service({
    sessionName,
    remotePort = DEFAULT_H3_REMOTE_PORT,
    localPort = DEFAULT_H3_LOCAL_PORT,
    logLines = 35,
  } = {}) {
    const name = validateSessionName(sessionName);
    const rPort = validatePort(remotePort, DEFAULT_H3_REMOTE_PORT);
    const lPort = validatePort(localPort, DEFAULT_H3_LOCAL_PORT);
    const lines = Math.min(Math.max(Number(logLines) || 35, 10), 200);

    const script = `
echo "===GPU==="
nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu,temperature.gpu --format=csv,noheader,nounits 2>&1 || echo "ERR_NVIDIA"
echo "===DISK==="
df -h /content 2>/dev/null | tail -n 1 || echo "UNKNOWN"
echo "===RAM==="
free -m 2>/dev/null | awk '/^Mem:/ {print $3","$2}' || echo "UNKNOWN"
echo "===COMFY_PS==="
pgrep -af "ComfyUI/main.py" 2>&1 || echo "NOT_RUNNING"
echo "===REMOTE_STATS==="
curl -sf http://127.0.0.1:${rPort}/system_stats 2>&1 || echo "NOT_READY"
echo "===MODELS==="
if [ -d /content/ComfyUI/models ]; then
  find /content/ComfyUI/models -maxdepth 2 \\( -type f -o -type l \\) \\( -name "*.safetensors" -o -name "*.gguf" \\) -printf "%s %P\\n" 2>/dev/null | sort
else
  echo "NONE"
fi
echo "===WORKFLOWS==="
ls -1 /content/ComfyUI/user/default/workflows 2>/dev/null || echo "NONE"
echo "===LOG_TAIL==="
LOG_FILE="/content/comfyui_h3.log"
if [ ! -f "$LOG_FILE" ] && [ -f /content/deploy_minimax_h3.log ]; then LOG_FILE="/content/deploy_minimax_h3.log"; fi
if [ -f "$LOG_FILE" ]; then tail -n ${lines} "$LOG_FILE"; else echo "NO_LOG"; fi
`;

    const [{ via, stdout }, tunnel] = await Promise.all([
      this.runRemoteBash(name, script, { timeoutMs: 25000, localPort: lPort }),
      this.checkLocalTunnel(lPort, { probePath: '/system_stats' }),
    ]);

    const gpuRaw = this._extractTaggedSection(stdout, 'GPU', 'DISK');
    const diskRaw = this._extractTaggedSection(stdout, 'DISK', 'RAM');
    const ramRaw = this._extractTaggedSection(stdout, 'RAM', 'COMFY_PS');
    const comfyPsRaw = this._extractTaggedSection(stdout, 'COMFY_PS', 'REMOTE_STATS');
    const statsRaw = this._extractTaggedSection(stdout, 'REMOTE_STATS', 'MODELS');
    const modelsRaw = this._extractTaggedSection(stdout, 'MODELS', 'WORKFLOWS');
    const workflowsRaw = this._extractTaggedSection(stdout, 'WORKFLOWS', 'LOG_TAIL');
    const logTail = this._extractTaggedSection(stdout, 'LOG_TAIL', null);

    let systemStats = null;
    let remoteApiReady = false;
    if (statsRaw && statsRaw.startsWith('{')) {
      try {
        systemStats = JSON.parse(statsRaw);
        remoteApiReady = Boolean(systemStats?.system || systemStats?.devices);
      } catch {
        // Ignore parse error
      }
    }

    const installedModels = modelsRaw && modelsRaw !== 'NONE'
      ? modelsRaw
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean)
          .map((l) => {
            const sp = l.indexOf(' ');
            if (sp === -1) return { path: l, sizeGiB: null };
            const bytes = Number(l.slice(0, sp));
            return {
              path: l.slice(sp + 1).trim(),
              sizeGiB: Number.isFinite(bytes) ? Number((bytes / (1024 ** 3)).toFixed(2)) : null,
            };
          })
      : [];

    const workflows = workflowsRaw && workflowsRaw !== 'NONE'
      ? workflowsRaw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
      : [];

    const ramParts = ramRaw.split(',').map((n) => Number(n.trim()));
    const ram = ramParts.length === 2 && ramParts.every(Number.isFinite)
      ? { usedMiB: ramParts[0], totalMiB: ramParts[1] }
      : null;

    const comfyRunning = Boolean(comfyPsRaw && !comfyPsRaw.includes('NOT_RUNNING'));
    return {
      sessionName: name,
      inspectedVia: via,
      fetchedAt: new Date().toISOString(),
      gpu: parseNvidiaSmiCsv(gpuRaw),
      disk: diskRaw && diskRaw !== 'UNKNOWN' ? diskRaw : '',
      ram,
      comfyui: {
        running: comfyRunning,
        processLine: comfyRunning ? comfyPsRaw : '',
        remoteApiReady,
        systemStats,
        installedModels,
        workflows,
        logTail: logTail === 'NO_LOG' ? '' : logTail,
      },
      tunnel,
    };
  }

  async startComfyui({
    sessionName,
    remotePort = DEFAULT_H3_REMOTE_PORT,
    localPort = DEFAULT_H3_LOCAL_PORT,
    useSageAttention = true,
    lowVram = false,
    useExistingScript = false,
  } = {}) {
    const name = validateSessionName(sessionName);
    const rPort = validatePort(remotePort, DEFAULT_H3_REMOTE_PORT);
    const lPort = validatePort(localPort, DEFAULT_H3_LOCAL_PORT);
    const startScript = buildStartComfyScript({ remotePort: rPort, useSageAttention, lowVram });

    const scriptBody = useExistingScript
      ? `
pkill -f "ComfyUI/main.py" || true
sleep 2
if [ ! -x /content/start_comfyui.sh ]; then
  echo "NO_EXISTING_SCRIPT"
  exit 1
fi
nohup /content/start_comfyui.sh > /content/comfyui_h3.log 2>&1 < /dev/null &
echo "STARTED_PID=$!"
`
      : `
pkill -f "ComfyUI/main.py" || true
sleep 2
cat << 'EOF' > /content/start_comfyui.sh
${startScript}
EOF
chmod +x /content/start_comfyui.sh
nohup /content/start_comfyui.sh > /content/comfyui_h3.log 2>&1 < /dev/null &
echo "STARTED_PID=$!"
`;

    const { stdout } = await this.runRemoteBash(name, scriptBody, { timeoutMs: 25000, localPort: lPort });
    return { ok: true, sessionName: name, output: stdout.trim() };
  }

  async stopComfyui({ sessionName, localPort = DEFAULT_H3_LOCAL_PORT } = {}) {
    const name = validateSessionName(sessionName);
    const lPort = validatePort(localPort, DEFAULT_H3_LOCAL_PORT);
    const { stdout } = await this.runRemoteBash(
      name,
      `pkill -f "ComfyUI/main.py" || true\nsleep 2\npgrep -af "ComfyUI/main.py" || echo "STOPPED"`,
      { timeoutMs: 20000, localPort: lPort },
    );
    return { ok: true, sessionName: name, output: stdout.trim() };
  }

  getH3DeployStatus() {
    return {
      active: this.h3DeployJob?.status === 'running',
      job: this._serializeDeployJob(this.h3DeployJob),
    };
  }

  cancelH3Deploy() {
    return this._cancelDeployJob('h3DeployJob', '_h3AbortController');
  }

  retryH3Deploy({ fromStep } = {}) {
    return this.startH3Deploy(this._resolveRetryOpts(this.h3DeployJob, this._lastH3DeployOpts, fromStep));
  }

  async startH3Deploy({
    sessionName = 'l4',
    gpu = 'L4',
    fallbackGpus = ['G4', 'A100'],
    highMem = false,
    preset = 'uncensored-fp8-turbo',
    localPort = DEFAULT_H3_LOCAL_PORT,
    remotePort = DEFAULT_H3_REMOTE_PORT,
    useSageAttention = true,
    lowVram = false,
    forceReinstall = false,
    forceRestart = false,
    startFromStep = 'session',
  } = {}) {
    if (this.h3DeployJob?.status === 'running') {
      return { ok: true, alreadyRunning: true, job: this._serializeDeployJob(this.h3DeployJob) };
    }

    const name = validateSessionName(sessionName);
    const lPort = validatePort(localPort, DEFAULT_H3_LOCAL_PORT);
    const rPort = validatePort(remotePort, DEFAULT_H3_REMOTE_PORT);
    const gpuSpec = gpu ? validateSafeArg(gpu, 'GPU 规格', 'L4').toUpperCase() : 'L4';
    const normalizedFallbacks = normalizeFallbackGpus(fallbackGpus, gpuSpec);
    const presetObj = resolveH3Preset(preset);
    const startStep = STEP_ORDER.includes(startFromStep) ? startFromStep : 'session';
    const startIdx = STEP_ORDER.indexOf(startStep);

    buildDeployH3Script({
      preset: presetObj.key,
      remotePort: rPort,
      useSageAttention: Boolean(useSageAttention),
      lowVram: Boolean(lowVram),
      forceReinstall: Boolean(forceReinstall),
    });

    this._lastH3DeployOpts = {
      sessionName: name,
      gpu: gpuSpec,
      fallbackGpus: normalizedFallbacks,
      highMem: Boolean(highMem),
      preset: presetObj.key,
      localPort: lPort,
      remotePort: rPort,
      useSageAttention: Boolean(useSageAttention),
      lowVram: Boolean(lowVram),
      forceReinstall: Boolean(forceReinstall),
      forceRestart: Boolean(forceRestart),
    };

    const now = new Date().toISOString();
    const job = {
      id: `deploy-h3-${Date.now()}`,
      kind: 'minimax-h3',
      status: 'running',
      stage: startStep,
      stageLabel:
        startStep === 'session'
          ? `检查/创建 ${gpuSpec} 实例 (${name})`
          : startStep === 'bootstrap'
            ? `检测环境并拉起 ComfyUI + MiniMax-H3 (${name})`
            : startStep === 'waiting_api'
              ? `恢复轮询 ComfyUI 下载与加载状态 (${name})`
              : `重建本机 :${lPort} ComfyUI 高可用隧道 (${name})`,
      sessionName: name,
      gpu: gpuSpec,
      requestedGpu: gpuSpec,
      fallbackGpus: normalizedFallbacks,
      localPort: lPort,
      remotePort: rPort,
      preset: presetObj.key,
      presetLabel: presetObj.label,
      effectiveConfig: startStep !== 'session' ? this.h3DeployJob?.effectiveConfig || null : null,
      createdNewSession: false,
      startedAt: now,
      updatedAt: now,
      finishedAt: null,
      remoteStage: '',
      logTail: startStep !== 'session' ? this.h3DeployJob?.logTail || '' : '',
      error: '',
      tunnel: null,
      overview: null,
      steps: [
        {
          key: 'session',
          label: `检查 / 新建 ${gpuSpec} 实例`,
          status: startIdx > 0 ? 'done' : 'running',
          detail: startIdx > 0 ? `复用已有会话 ${name} (${gpuSpec})` : '正在查询活跃会话',
        },
        {
          key: 'bootstrap',
          label: '安装 ComfyUI 与定制节点并拉起下载',
          status: startIdx > 1 ? 'done' : startIdx === 1 ? 'running' : 'pending',
          detail: startIdx > 1 ? '跳过重装，直接恢复后续步骤' : '',
        },
        {
          key: 'waiting_api',
          label: '下载 MiniMax-H3 无审核权重并启动服务',
          status: startIdx > 2 ? 'done' : startIdx === 2 ? 'running' : 'pending',
          detail: startIdx > 2 ? '跳过等待，直接重建隧道' : '',
        },
        {
          key: 'tunnel',
          label: `建立本机 :${lPort} WebSocket 隧道`,
          status: startIdx === 3 ? 'running' : 'pending',
          detail: '',
        },
      ],
    };
    this.h3DeployJob = job;

    const abortController = new AbortController();
    this._h3AbortController = abortController;

    this._executeH3DeployJob(job, {
      name,
      gpuSpec,
      fallbackGpus: normalizedFallbacks,
      highMem: Boolean(highMem),
      presetObj,
      lPort,
      rPort,
      useSageAttention: Boolean(useSageAttention),
      lowVram: Boolean(lowVram),
      forceReinstall: Boolean(forceReinstall),
      forceRestart: Boolean(forceRestart),
      startFromStep: startStep,
      abortController,
    }).catch((err) => {
      if (job.status === 'running') {
        if (err?.cancelled || abortController.signal.aborted) {
          job.status = 'cancelled';
          job.stage = 'cancelled';
          job.stageLabel = '已手动终止';
          job.error = '';
        } else {
          job.status = 'failed';
          job.stage = 'failed';
          job.stageLabel = '一键拉起 MiniMax-H3 失败';
          job.error = err?.message || '部署过程出现未知异常';
        }
        job.finishedAt = new Date().toISOString();
      }
    });

    return { ok: true, alreadyRunning: false, job: this._serializeDeployJob(job) };
  }

  async _executeH3DeployJob(job, opts) {
    const {
      name,
      gpuSpec,
      fallbackGpus,
      highMem,
      presetObj,
      lPort,
      rPort,
      useSageAttention,
      lowVram,
      forceReinstall,
      forceRestart,
      startFromStep = 'session',
      abortController,
    } = opts;
    const signal = abortController?.signal;
    const startIdx = STEP_ORDER.indexOf(startFromStep);
    const pollIntervalMs = this.h3DeployPollIntervalMs ?? 5000;
    const pollTimeoutMs = this.h3DeployTimeoutMs ?? 25 * 60 * 1000;

    try {
      // 1. Ensure target Colab session exists
      const { actualSessionName, actualGpu } = await this._ensureDeploySession(job, {
        name,
        gpuSpec,
        fallbackGpus,
        highMem,
        lPort,
        signal,
        lastOpts: this._lastH3DeployOpts,
      });

      // 2. Probe remote GPU / disk / RAM / existing ComfyUI & weights, then launch deploy script
      let alreadyServing = false;
      if (startIdx <= STEP_ORDER.indexOf('bootstrap')) {
        if (signal?.aborted) throw new DeployCancelledError();
        job.stage = 'bootstrap';
        job.stageLabel = '检测远端环境并下发 MiniMax-H3 部署脚本';
        this._updateDeployStep(
          job,
          'bootstrap',
          'running',
          '正在探测远端显卡、磁盘空间与 ComfyUI 状态（新实例冷启动约 15-40 秒）…',
        );

        const ditPath = `/content/ComfyUI/models/diffusion_models/${presetObj.dit.destName}`;
        const tePath = `/content/ComfyUI/models/text_encoders/${presetObj.textEncoder.destName}`;
        const probeRes = await this.runRemoteBash(
          actualSessionName,
          `echo "===GPU==="
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits 2>/dev/null || echo "NO_GPU"
echo "===DISK==="
df -h /content 2>/dev/null | tail -n 1 || echo "UNKNOWN"
echo "===READY_CHECK==="
if [ -s "${ditPath}" ] && [ -s "${tePath}" ]; then echo "WEIGHTS_OK"; else echo "WEIGHTS_MISSING"; fi
echo "===STATS==="
curl -sf http://127.0.0.1:${rPort}/system_stats 2>/dev/null || echo "NOT_READY"`,
          { timeoutMs: 60000, localPort: lPort, signal, retryOnTimeout: true, maxRetries: 2 },
        );

        const gpuRaw = this._extractTaggedSection(probeRes.stdout, 'GPU', 'DISK');
        const diskRaw = this._extractTaggedSection(probeRes.stdout, 'DISK', 'READY_CHECK');
        const readyRaw = this._extractTaggedSection(probeRes.stdout, 'READY_CHECK', 'STATS');
        const statsRaw = this._extractTaggedSection(probeRes.stdout, 'STATS', null);
        const detectedGpu = this._parseGpuNameAndMem(gpuRaw);
        job.effectiveConfig = {
          gpuName: detectedGpu?.name || actualGpu,
          gpuMemoryMiB: detectedGpu?.memoryTotalMiB ?? null,
          diskSummary: diskRaw && diskRaw !== 'UNKNOWN' ? diskRaw : '',
          preset: presetObj.key,
          presetLabel: presetObj.label,
        };

        alreadyServing =
          !forceRestart &&
          !forceReinstall &&
          readyRaw.includes('WEIGHTS_OK') &&
          statsRaw.startsWith('{') &&
          statsRaw.includes('"system"');

        if (alreadyServing) {
          this._updateDeployStep(job, 'bootstrap', 'done', `ComfyUI 与 ${presetObj.key} 权重已就绪`);
          this._updateDeployStep(job, 'waiting_api', 'done', '远端 ComfyUI 端口已响应');
        } else {
          const deployScript = buildDeployH3Script({
            preset: presetObj.key,
            remotePort: rPort,
            useSageAttention,
            lowVram,
            forceReinstall,
          });
          const launchScript = `
cat << 'DEPLOY_H3_EOF' > /content/deploy_minimax_h3.sh
${deployScript}
DEPLOY_H3_EOF
chmod +x /content/deploy_minimax_h3.sh
if command -v setsid >/dev/null 2>&1; then
  setsid bash /content/deploy_minimax_h3.sh > /content/deploy_minimax_h3.launcher.log 2>&1 < /dev/null &
else
  nohup bash /content/deploy_minimax_h3.sh > /content/deploy_minimax_h3.launcher.log 2>&1 < /dev/null &
fi
echo "DEPLOY_H3_PID=$!"
`;
          await this.runRemoteBash(actualSessionName, launchScript, {
            timeoutMs: 45000,
            localPort: lPort,
            signal,
            retryOnTimeout: true,
            maxRetries: 1,
          });
          this._updateDeployStep(
            job,
            'bootstrap',
            'done',
            `已下发部署脚本（${detectedGpu?.name || actualGpu} · ${presetObj.key}）`,
          );
        }
      }

      // 3. Poll remote ComfyUI progress until /system_stats responds
      if (startIdx <= STEP_ORDER.indexOf('waiting_api') && !alreadyServing) {
        if (signal?.aborted) throw new DeployCancelledError();
        job.stage = 'waiting_api';
        job.stageLabel = '正在安装 ComfyUI 并下载 MiniMax-H3 权重…';
        this._updateDeployStep(job, 'waiting_api', 'running', '正在检查环境并启动安装与下载…');

        await this._pollRemoteComfyUntilReady(job, {
          sessionName: actualSessionName,
          remotePort: rPort,
          localPort: lPort,
          pollIntervalMs,
          pollTimeoutMs,
          signal,
        });
        this._updateDeployStep(job, 'waiting_api', 'done', '远端 ComfyUI /system_stats 已就绪');
      }

      // 4. Establish/refresh resilient WebSocket + HTTP tunnel on :8188
      if (signal?.aborted) throw new DeployCancelledError();
      job.stage = 'tunnel';
      job.stageLabel = `正在建立本机 :${lPort} ComfyUI 高可用隧道`;
      this._updateDeployStep(job, 'tunnel', 'running', `正在连接 ${actualSessionName} SSH 隧道并校验 /system_stats…`);

      const currentTunnel = await this.checkLocalTunnel(lPort, { probePath: '/system_stats' });
      let tunnelInfo;
      if (startFromStep === 'tunnel' || job.createdNewSession || !currentTunnel.listening || !currentTunnel.apiReady) {
        const tunRes = await this.restartTunnel({
          sessionName: actualSessionName,
          localPort: lPort,
          remotePort: rPort,
          probePath: '/system_stats',
        });
        tunnelInfo = tunRes.tunnel;
      } else {
        tunnelInfo = currentTunnel;
      }

      if (signal?.aborted) throw new DeployCancelledError();
      if (!tunnelInfo?.apiReady) {
        throw new Error(tunnelInfo?.apiError || '隧道已建立，但本机 ComfyUI /system_stats 尚未就绪，请尝试点击「重建隧道」');
      }

      this._updateDeployStep(job, 'tunnel', 'done', `已连通 http://127.0.0.1:${lPort}`);
      job.tunnel = tunnelInfo;
      job.overview = await this.getOverview({ localPort: 8000, h3LocalPort: lPort }).catch(() => null);
      job.status = 'ready';
      job.stage = 'ready';
      job.stageLabel = 'MiniMax-H3 视频服务 (ComfyUI) 已就绪';
      job.finishedAt = new Date().toISOString();
    } catch (err) {
      if (err?.cancelled || signal?.aborted) {
        for (const st of job.steps) {
          if (st.status === 'running') {
            st.status = 'cancelled';
            st.detail = '已手动终止';
          }
        }
        job.status = 'cancelled';
        job.stage = 'cancelled';
        job.stageLabel = '已手动终止';
        job.error = '';
        job.finishedAt = new Date().toISOString();
        return;
      }
      const runningStep = job.steps.find((s) => s.status === 'running');
      const shortErr = err?.message || '执行失败';
      if (runningStep) {
        runningStep.status = 'error';
        runningStep.detail = shortErr.length > 120 ? `${shortErr.slice(0, 119)}…` : shortErr;
      }
      if (err?.rawDetail && !job.logTail) {
        job.logTail = err.rawDetail.slice(-4000);
      }
      job.status = 'failed';
      job.stage = 'failed';
      job.stageLabel = '一键拉起 MiniMax-H3 失败';
      job.error = shortErr;
      job.finishedAt = new Date().toISOString();
    } finally {
      if (this._h3AbortController === abortController) {
        this._h3AbortController = null;
      }
    }
  }

  async _pollRemoteComfyUntilReady(job, { sessionName, remotePort, localPort, pollIntervalMs, pollTimeoutMs, signal }) {
    const deadline = Date.now() + pollTimeoutMs;
    let deadProcessStrikes = 0;
    let transientPollErrors = 0;

    while (Date.now() < deadline) {
      if (signal?.aborted) throw new DeployCancelledError();
      const checkScript = `
echo "===STAGE==="
cat /content/.deploy_h3_stage 2>/dev/null || echo "unknown"
echo "===ALIVE==="
pgrep -af "deploy_minimax_h3.sh|ComfyUI/main.py|start_comfyui.sh" 2>/dev/null || echo "NONE"
echo "===STATS==="
curl -sf http://127.0.0.1:${remotePort}/system_stats 2>/dev/null || echo "NOT_READY"
echo "===LOG==="
STAGE=$(cat /content/.deploy_h3_stage 2>/dev/null || echo "")
if [ "$STAGE" = "starting_comfyui" ]; then
  tail -n 25 /content/comfyui_h3.log 2>/dev/null || tail -n 25 /content/deploy_minimax_h3.log 2>/dev/null || true
else
  tail -n 25 /content/deploy_minimax_h3.log 2>/dev/null || tail -n 25 /content/deploy_minimax_h3.launcher.log 2>/dev/null || true
fi
`;
      let stdout = '';
      try {
        const res = await this.runRemoteBash(sessionName, checkScript, {
          timeoutMs: 35000,
          localPort,
          signal,
        });
        stdout = res.stdout;
        transientPollErrors = 0;
      } catch (err) {
        if (err?.cancelled || signal?.aborted) throw new DeployCancelledError();
        transientPollErrors += 1;
        if (transientPollErrors >= 3) {
          throw err;
        }
        this._updateDeployStep(
          job,
          'waiting_api',
          'running',
          `远端状态轮询暂时超时 (${transientPollErrors}/3)，正在自动重试…`,
        );
        await sleepAbortable(pollIntervalMs, signal);
        continue;
      }

      const remoteStage = this._extractTaggedSection(stdout, 'STAGE', 'ALIVE');
      const aliveRaw = this._extractTaggedSection(stdout, 'ALIVE', 'STATS');
      const statsRaw = this._extractTaggedSection(stdout, 'STATS', 'LOG');
      const logTail = this._extractTaggedSection(stdout, 'LOG', null);

      job.remoteStage = remoteStage;
      if (logTail) job.logTail = logTail;

      if (statsRaw.startsWith('{') && statsRaw.includes('"system"')) {
        return true;
      }

      if (remoteStage === 'failed') {
        throw new Error('远端 ComfyUI 安装或权重下载失败，请查看下方日志尾部');
      }

      if (remoteStage === 'installing_comfyui' || remoteStage === 'checking_env') {
        job.stageLabel = '正在安装 ComfyUI、ComfyUI-GGUF 与视频导出插件…';
        this._updateDeployStep(job, 'waiting_api', 'running', '正在克隆并安装 ComfyUI 及依赖包（约 1-3 分钟）');
      } else if (remoteStage === 'downloading_models') {
        const fetchingLine = logTail.split(/\r?\n/).reverse().find((l) => l.includes('[h3-dl] fetching'));
        job.stageLabel = '正在从 Hugging Face 下载 MiniMax-H3 无审核权重…';
        this._updateDeployStep(
          job,
          'waiting_api',
          'running',
          fetchingLine ? fetchingLine.slice(0, 110) : '正在高速下载约 38-42 GB 模型权重与 VAE…',
        );
      } else if (remoteStage === 'writing_workflow') {
        job.stageLabel = '正在写入 L4 无审核工作流配置…';
        this._updateDeployStep(job, 'waiting_api', 'running', '正在生成预配置 L4 工作流 JSON');
      } else {
        job.stageLabel = '正在启动 ComfyUI 与定制节点…';
        this._updateDeployStep(job, 'waiting_api', 'running', `当前阶段：${remoteStage || '启动中'}`);
      }

      if (aliveRaw === 'NONE') {
        deadProcessStrikes += 1;
        if (deadProcessStrikes >= 2) {
          throw new Error('远端 ComfyUI 部署进程已意外退出，请查看日志确认报错原因');
        }
      } else {
        deadProcessStrikes = 0;
      }

      await sleepAbortable(pollIntervalMs, signal);
    }

    throw new Error('等待远端 ComfyUI 就绪超时，可进入 H3 检测页面查看实时日志');
  }

  async testInference({
    localPort = 8000,
    model = 'qwen38-27b-nb',
    prompt = '你好，请用一句话介绍你自己。',
    maxTokens = 160,
  } = {}) {
    const lPort = validatePort(localPort, 8000);
    const t0 = performance.now();
    let tFirst = null;
    let completionTokens = 0;
    let reasoningText = '';
    let contentText = '';
    let finishReason = '';

    const payloadBytes = Buffer.from(
      JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: Number(maxTokens) || 160,
        temperature: 0.7,
        stream: true,
        stream_options: { include_usage: true },
      }),
      'utf8',
    );

    await new Promise((resolve, reject) => {
      let buffer = '';
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: lPort,
          path: '/v1/chat/completions',
          method: 'POST',
          agent: false,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': String(payloadBytes.length),
            Connection: 'close',
          },
          timeout: 45000,
        },
        (res) => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            const errChunks = [];
            res.on('data', (c) => errChunks.push(c));
            res.on('end', () => {
              const errText = Buffer.concat(errChunks).toString('utf8');
              reject(new Error(`推理请求失败 (${res.statusCode}): ${errText.slice(0, 300)}`));
            });
            return;
          }

          res.on('data', (chunk) => {
            buffer += chunk.toString('utf8');
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const rawLine of lines) {
              const line = rawLine.trim();
              if (!line.startsWith('data: ')) continue;
              const payload = line.slice(6);
              if (payload === '[DONE]') continue;
              try {
                const parsed = JSON.parse(payload);
                const delta = parsed?.choices?.[0]?.delta;
                if (delta) {
                  if ((delta.content || delta.reasoning || delta.reasoning_content) && tFirst === null) {
                    tFirst = performance.now();
                  }
                  if (delta.content) contentText += delta.content;
                  if (delta.reasoning || delta.reasoning_content) {
                    reasoningText += delta.reasoning || delta.reasoning_content;
                  }
                }
                if (parsed?.choices?.[0]?.finish_reason) {
                  finishReason = parsed.choices[0].finish_reason;
                }
                if (parsed?.usage?.completion_tokens) {
                  completionTokens = parsed.usage.completion_tokens;
                }
              } catch {
                // Ignore partial JSON
              }
            }
          });
          res.on('end', resolve);
          res.on('error', reject);
        },
      );
      req.on('timeout', () => req.destroy(new Error('推理请求超时')));
      req.on('error', reject);
      req.write(payloadBytes);
      req.end();
    });

    const tEnd = performance.now();
    const totalSec = (tEnd - t0) / 1000;
    const ttftSec = tFirst !== null ? (tFirst - t0) / 1000 : totalSec;
    const decodeSec = tFirst !== null ? Math.max((tEnd - tFirst) / 1000, 0.01) : totalSec;
    const decodeTokPerSec = completionTokens > 0 ? Number((completionTokens / decodeSec).toFixed(2)) : null;

    return {
      ok: true,
      model,
      ttftMs: Math.round(ttftSec * 1000),
      totalMs: Math.round(totalSec * 1000),
      completionTokens,
      decodeTokPerSec,
      finishReason,
      reasoning: reasoningText.trim(),
      content: contentText.trim(),
    };
  }
}
