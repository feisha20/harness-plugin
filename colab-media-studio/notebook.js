export const MODEL_PACKS = {
  flux_schnell: {
    id: 'flux_schnell',
    label: 'FLUX.1-schnell FP8（单文件极速生图，4步出图，~17GB）',
    files: [
      {
        dir: 'checkpoints',
        name: 'flux1-schnell-fp8.safetensors',
        url: 'https://huggingface.co/Comfy-Org/flux1-schnell/resolve/main/flux1-schnell-fp8.safetensors',
      },
    ],
  },
  wan_t2v_1_3b: {
    id: 'wan_t2v_1_3b',
    label: 'Wan 2.1 T2V 1.3B 轻量视频套装（含 UMT5 + VAE，~8GB，L4/A100 秒级出片）',
    files: [
      {
        dir: 'diffusion_models',
        name: 'wan2.1_t2v_1.3B_fp16.safetensors',
        url: 'https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/diffusion_models/wan2.1_t2v_1.3B_fp16.safetensors',
      },
      {
        dir: 'text_encoders',
        name: 'umt5_xxl_fp8_e4m3fn_scaled.safetensors',
        url: 'https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors',
      },
      {
        dir: 'vae',
        name: 'wan_2.1_vae.safetensors',
        url: 'https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/vae/wan_2.1_vae.safetensors',
      },
    ],
  },
  wan_t2v_14b: {
    id: 'wan_t2v_14b',
    label: 'Wan 2.1 T2V 14B FP8 旗舰文生视频（推荐 Colab Ultra A100，~20GB）',
    files: [
      {
        dir: 'diffusion_models',
        name: 'wan2.1_t2v_14B_fp8_e4m3fn.safetensors',
        url: 'https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/diffusion_models/wan2.1_t2v_14B_fp8_e4m3fn.safetensors',
      },
      {
        dir: 'text_encoders',
        name: 'umt5_xxl_fp8_e4m3fn_scaled.safetensors',
        url: 'https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors',
      },
      {
        dir: 'vae',
        name: 'wan_2.1_vae.safetensors',
        url: 'https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/vae/wan_2.1_vae.safetensors',
      },
    ],
  },
  wan_i2v_14b: {
    id: 'wan_i2v_14b',
    label: 'Wan 2.1 I2V 480p 14B FP8 图生视频套装（含 CLIP Vision，~22GB）',
    files: [
      {
        dir: 'diffusion_models',
        name: 'wan2.1_i2v_480p_14B_fp8_e4m3fn.safetensors',
        url: 'https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/diffusion_models/wan2.1_i2v_480p_14B_fp8_e4m3fn.safetensors',
      },
      {
        dir: 'clip_vision',
        name: 'clip_vision_h.safetensors',
        url: 'https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/clip_vision/clip_vision_h.safetensors',
      },
      {
        dir: 'text_encoders',
        name: 'umt5_xxl_fp8_e4m3fn_scaled.safetensors',
        url: 'https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors',
      },
      {
        dir: 'vae',
        name: 'wan_2.1_vae.safetensors',
        url: 'https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/vae/wan_2.1_vae.safetensors',
      },
    ],
  },
  ltx_video: {
    id: 'ltx_video',
    label: 'LTX-Video 2B v0.9.5 极速视频（单文件 + T5 编码器，~10GB）',
    files: [
      {
        dir: 'checkpoints',
        name: 'ltx-video-2b-v0.9.5.safetensors',
        url: 'https://huggingface.co/Lightricks/LTX-Video/resolve/main/ltx-video-2b-v0.9.5.safetensors',
      },
    ],
  },
};

function dedupeFiles(packs) {
  const seen = new Set();
  const out = [];
  for (const id of packs) {
    const pack = MODEL_PACKS[id];
    if (!pack) continue;
    for (const file of pack.files) {
      const key = `${file.dir}/${file.name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(file);
    }
  }
  return out;
}

function toLines(code) {
  return code
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line, i, arr) => (i < arr.length - 1 ? `${line}\n` : line));
}

function buildDownloadPythonLines(files) {
  if (files.length === 0) {
    return ['print("未勾选预设模型，可直接运行后续单元格并通过 ComfyUI-Manager 或自定义路径使用已有模型。")'];
  }
  const lines = [
    'import os, subprocess',
    'downloads = [',
  ];
  for (const f of files) {
    lines.push(`    (${JSON.stringify(f.dir)}, ${JSON.stringify(f.name)}, ${JSON.stringify(f.url)}),`);
  }
  lines.push(']');
  lines.push('for subdir, fname, url in downloads:');
  lines.push('    target_dir = os.path.join(MODELS_ROOT, subdir)');
  lines.push('    os.makedirs(target_dir, exist_ok=True)');
  lines.push('    dest = os.path.join(target_dir, fname)');
  lines.push('    if os.path.exists(dest) and os.path.getsize(dest) > 10_000_000:');
  lines.push('        print(f"已缓存跳过: {subdir}/{fname}")');
  lines.push('        continue');
  lines.push('    print(f"正在下载: {subdir}/{fname} ...")');
  lines.push('    subprocess.run(["aria2c", "-c", "-x", "16", "-s", "16", "-k", "1M", "-d", target_dir, "-o", fname, url], check=True)');
  lines.push('print("所有已选模型准备就绪!")');
  return lines;
}

export function generateQuickLaunchScript(options = {}) {
  const mountDrive = options.mountDrive !== false;
  const requestedPacks = Array.isArray(options.packs) && options.packs.length > 0
    ? options.packs
    : ['flux_schnell', 'wan_t2v_1_3b'];
  const files = dedupeFiles(requestedPacks);

  const lines = [
    '# === DeepSeek Harness · Colab Ultra ComfyUI 一键启动脚本 ===',
    'import os, re, subprocess, time',
    '',
  ];
  if (mountDrive) {
    lines.push(
      'from google.colab import drive',
      'drive.mount("/content/drive")',
      'COMFY_DIR = "/content/ComfyUI"',
      'DRIVE_MODELS = "/content/drive/MyDrive/ComfyUI_Models"',
      'os.makedirs(DRIVE_MODELS, exist_ok=True)',
      'MODELS_ROOT = DRIVE_MODELS',
    );
  } else {
    lines.push(
      'COMFY_DIR = "/content/ComfyUI"',
      'MODELS_ROOT = "/content/ComfyUI/models"',
    );
  }

  lines.push(
    '',
    '!apt-get -qq update && apt-get -qq install -y aria2 ffmpeg',
    'if not os.path.exists(COMFY_DIR):',
    '    !git clone https://github.com/comfyanonymous/ComfyUI.git {COMFY_DIR}',
    '    !pip install -q -r {COMFY_DIR}/requirements.txt',
    'os.makedirs(f"{COMFY_DIR}/custom_nodes", exist_ok=True)',
    'if not os.path.exists(f"{COMFY_DIR}/custom_nodes/ComfyUI-Manager"):',
    '    !git clone https://github.com/ltdrdata/ComfyUI-Manager.git {COMFY_DIR}/custom_nodes/ComfyUI-Manager',
    'if not os.path.exists(f"{COMFY_DIR}/custom_nodes/ComfyUI-VideoHelperSuite"):',
    '    !git clone https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite.git {COMFY_DIR}/custom_nodes/ComfyUI-VideoHelperSuite',
    '    !pip install -q -r {COMFY_DIR}/custom_nodes/ComfyUI-VideoHelperSuite/requirements.txt',
    '',
  );

  if (mountDrive) {
    lines.push(
      'for sub in ["checkpoints", "diffusion_models", "text_encoders", "vae", "clip_vision", "loras"]:',
      '    os.makedirs(f"{DRIVE_MODELS}/{sub}", exist_ok=True)',
      '    dst = f"{COMFY_DIR}/models/{sub}"',
      '    if os.path.islink(dst):',
      '        os.unlink(dst)',
      '    elif os.path.exists(dst):',
      '        import shutil; shutil.rmtree(dst)',
      '    os.symlink(f"{DRIVE_MODELS}/{sub}", dst)',
      '',
    );
  }

  lines.push(...buildDownloadPythonLines(files), '');

  lines.push(
    'import threading',
    'if not os.path.exists("/usr/local/bin/cloudflared"):',
    '    print("正在下载 cloudflared...", flush=True)',
    '    !wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O /usr/local/bin/cloudflared',
    '    !chmod +x /usr/local/bin/cloudflared',
    '',
    'subprocess.run(["pkill", "-f", "main.py --listen 127.0.0.1 --port 8188"], check=False)',
    'comfy_log = open("/tmp/comfyui.log", "w")',
    'comfy_proc = subprocess.Popen(["python", "main.py", "--listen", "127.0.0.1", "--port", "8188"], cwd=COMFY_DIR, stdout=comfy_log, stderr=subprocess.STDOUT)',
    'print("正在等待 ComfyUI 8188 端口启动...", flush=True)',
    'for i in range(90):',
    '    if comfy_proc.poll() is not None:',
    '        comfy_log.flush()',
    '        with open("/tmp/comfyui.log") as f:',
    '            print(f.read()[-3000:], flush=True)',
    '        raise RuntimeError(f"ComfyUI 启动失败，退出码: {comfy_proc.returncode}")',
    '    try:',
    '        with urllib.request.urlopen("http://127.0.0.1:8188/system_stats", timeout=2) as resp:',
    '            if resp.status == 200:',
    '                print("ComfyUI 8188 端口已就绪！正在建立公网穿透...", flush=True)',
    '                break',
    '    except Exception:',
    '        if i > 0 and i % 5 == 0:',
    '            print(f"仍在等待 ComfyUI 启动 ({i * 2}s)...", flush=True)',
    '        time.sleep(2)',
    'else:',
    '    comfy_log.flush()',
    '    with open("/tmp/comfyui.log") as f:',
    '        print(f.read()[-3000:], flush=True)',
    '    raise TimeoutError("等待 ComfyUI 8188 端口超时（180s）")',
    '',
    'tunnel_proc = subprocess.Popen(["/usr/local/bin/cloudflared", "tunnel", "--url", "http://127.0.0.1:8188"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)',
    'tunnel_url = None',
    'tunnel_lines = []',
    'for line in tunnel_proc.stdout:',
    '    tunnel_lines.append(line)',
    '    m = re.search(r"https://[a-z0-9-]+\\.trycloudflare\\.com", line)',
    '    if m:',
    '        tunnel_url = m.group(0)',
    '        print("\\n" + "=" * 60, flush=True)',
    '        print("ComfyUI 穿透地址已就绪，请复制到 DSH 左侧【Colab 影像工坊】连接框:", flush=True)',
    '        print(tunnel_url, flush=True)',
    '        print("=" * 60, flush=True)',
    '        print("⚠️ 本单元格需保持运行以维持服务在线（一直转圈属正常），请勿停止！\\n", flush=True)',
    '        break',
    'if not tunnel_url:',
    '    print("".join(tunnel_lines[-30:]), flush=True)',
    '    raise RuntimeError("cloudflared 未返回公网穿透地址")',
    '',
    'threading.Thread(target=lambda: [None for _ in tunnel_proc.stdout], daemon=True).start()',
    'comfy_proc.wait()',
  );

  return lines.join('\n');
}

export function generateColabNotebook(options = {}) {
  const mountDrive = options.mountDrive !== false;
  const requestedPacks = Array.isArray(options.packs) && options.packs.length > 0
    ? options.packs
    : ['flux_schnell', 'wan_t2v_1_3b'];
  const files = dedupeFiles(requestedPacks);

  const cell1Intro = [
    '# DeepSeek Harness · Colab Ultra ComfyUI 影像工作站\n',
    '\n',
    '适用会员：**Google Colab Ultra**（推荐选择 `A100` 或 `L4` GPU 运行时，支持最长 24 小时后台持续运行）。\n',
    '\n',
    '使用步骤：\n',
    '1. 菜单栏点击 **代码执行程序 → 更改运行时类型**，选择 `A100 GPU`（或 `L4`）。\n',
    '2. 依次运行以下单元格。\n',
    '3. 复制最后一个单元格输出的 `https://xxxx.trycloudflare.com` 地址，粘贴到 DSH 左侧 **Colab 影像工坊** 顶部的连接地址栏即可开始文生图、图生图与视频生成。',
  ];

  const cell2Setup = mountDrive
    ? [
        'from google.colab import drive\n',
        'import os, shutil\n',
        '\n',
        'drive.mount("/content/drive")\n',
        'COMFY_DIR = "/content/ComfyUI"\n',
        'MODELS_ROOT = "/content/drive/MyDrive/ComfyUI_Models"\n',
        'os.makedirs(MODELS_ROOT, exist_ok=True)\n',
        '\n',
        '!apt-get -qq update && apt-get -qq install -y aria2 ffmpeg\n',
        'if not os.path.exists(COMFY_DIR):\n',
        '    !git clone https://github.com/comfyanonymous/ComfyUI.git {COMFY_DIR}\n',
        '    !pip install -q -r {COMFY_DIR}/requirements.txt\n',
        '\n',
        'os.makedirs(f"{COMFY_DIR}/custom_nodes", exist_ok=True)\n',
        'if not os.path.exists(f"{COMFY_DIR}/custom_nodes/ComfyUI-Manager"):\n',
        '    !git clone https://github.com/ltdrdata/ComfyUI-Manager.git {COMFY_DIR}/custom_nodes/ComfyUI-Manager\n',
        'if not os.path.exists(f"{COMFY_DIR}/custom_nodes/ComfyUI-VideoHelperSuite"):\n',
        '    !git clone https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite.git {COMFY_DIR}/custom_nodes/ComfyUI-VideoHelperSuite\n',
        '    !pip install -q -r {COMFY_DIR}/custom_nodes/ComfyUI-VideoHelperSuite/requirements.txt\n',
        '\n',
        'for sub in ["checkpoints", "diffusion_models", "text_encoders", "vae", "clip_vision", "loras"]:\n',
        '    os.makedirs(f"{MODELS_ROOT}/{sub}", exist_ok=True)\n',
        '    dst = f"{COMFY_DIR}/models/{sub}"\n',
        '    if os.path.islink(dst):\n',
        '        os.unlink(dst)\n',
        '    elif os.path.exists(dst):\n',
        '        shutil.rmtree(dst)\n',
        '    os.symlink(f"{MODELS_ROOT}/{sub}", dst)\n',
        '\n',
        'print("ComfyUI 与 Google Drive 模型目录链接完成:", MODELS_ROOT)',
      ]
    : [
        'import os\n',
        '\n',
        'COMFY_DIR = "/content/ComfyUI"\n',
        'MODELS_ROOT = "/content/ComfyUI/models"\n',
        '!apt-get -qq update && apt-get -qq install -y aria2 ffmpeg\n',
        'if not os.path.exists(COMFY_DIR):\n',
        '    !git clone https://github.com/comfyanonymous/ComfyUI.git {COMFY_DIR}\n',
        '    !pip install -q -r {COMFY_DIR}/requirements.txt\n',
        '\n',
        'os.makedirs(f"{COMFY_DIR}/custom_nodes", exist_ok=True)\n',
        'if not os.path.exists(f"{COMFY_DIR}/custom_nodes/ComfyUI-Manager"):\n',
        '    !git clone https://github.com/ltdrdata/ComfyUI-Manager.git {COMFY_DIR}/custom_nodes/ComfyUI-Manager\n',
        'if not os.path.exists(f"{COMFY_DIR}/custom_nodes/ComfyUI-VideoHelperSuite"):\n',
        '    !git clone https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite.git {COMFY_DIR}/custom_nodes/ComfyUI-VideoHelperSuite\n',
        '    !pip install -q -r {COMFY_DIR}/custom_nodes/ComfyUI-VideoHelperSuite/requirements.txt\n',
        '\n',
        'print("ComfyUI 安装完成（本地临时盘模式）")',
      ];

  const cell3Download = toLines(buildDownloadPythonLines(files).join('\n'));

  const cell4Tunnel = toLines([
    'import os, re, subprocess, threading, time, urllib.request',
    '',
    'COMFY_DIR = globals().get("COMFY_DIR", "/content/ComfyUI")',
    'if not os.path.exists("/usr/local/bin/cloudflared"):',
    '    print("正在下载 cloudflared...", flush=True)',
    '    !wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O /usr/local/bin/cloudflared',
    '    !chmod +x /usr/local/bin/cloudflared',
    '',
    'subprocess.run(["pkill", "-f", "main.py --listen 127.0.0.1 --port 8188"], check=False)',
    'comfy_log = open("/tmp/comfyui.log", "w")',
    'comfy_proc = subprocess.Popen(["python", "main.py", "--listen", "127.0.0.1", "--port", "8188"], cwd=COMFY_DIR, stdout=comfy_log, stderr=subprocess.STDOUT)',
    'print("正在等待 ComfyUI 8188 端口启动...", flush=True)',
    'for i in range(90):',
    '    if comfy_proc.poll() is not None:',
    '        comfy_log.flush()',
    '        with open("/tmp/comfyui.log") as f:',
    '            print(f.read()[-3000:], flush=True)',
    '        raise RuntimeError(f"ComfyUI 启动失败，退出码: {comfy_proc.returncode}")',
    '    try:',
    '        with urllib.request.urlopen("http://127.0.0.1:8188/system_stats", timeout=2) as resp:',
    '            if resp.status == 200:',
    '                print("ComfyUI 8188 端口已就绪！正在建立公网穿透...", flush=True)',
    '                break',
    '    except Exception:',
    '        if i > 0 and i % 5 == 0:',
    '            print(f"仍在等待 ComfyUI 启动 ({i * 2}s)...", flush=True)',
    '        time.sleep(2)',
    'else:',
    '    comfy_log.flush()',
    '    with open("/tmp/comfyui.log") as f:',
    '        print(f.read()[-3000:], flush=True)',
    '    raise TimeoutError("等待 ComfyUI 8188 端口超时（180s）")',
    '',
    'tunnel_proc = subprocess.Popen(',
    '    ["/usr/local/bin/cloudflared", "tunnel", "--url", "http://127.0.0.1:8188"],',
    '    stdout=subprocess.PIPE,',
    '    stderr=subprocess.STDOUT,',
    '    text=True,',
    ')',
    '',
    'tunnel_url = None',
    'tunnel_lines = []',
    'for line in tunnel_proc.stdout:',
    '    tunnel_lines.append(line)',
    '    m = re.search(r"https://[a-z0-9-]+\\.trycloudflare\\.com", line)',
    '    if m:',
    '        tunnel_url = m.group(0)',
    '        print("\\n" + "=" * 64, flush=True)',
    '        print("ComfyUI 公网连接地址已就绪（复制到 DSH 插件顶部连接栏）：", flush=True)',
    '        print(tunnel_url, flush=True)',
    '        print("=" * 64, flush=True)',
    '        print("⚠️ 提示：本单元格会持续保持运行以维持服务在线（一直转圈属正常），请勿点击停止！\\n", flush=True)',
    '        break',
    'if not tunnel_url:',
    '    print("".join(tunnel_lines[-30:]), flush=True)',
    '    raise RuntimeError("cloudflared 未返回公网穿透地址")',
    '',
    'threading.Thread(target=lambda: [None for _ in tunnel_proc.stdout], daemon=True).start()',
    'comfy_proc.wait()',
  ].join('\n'));

  return {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      colab: {
        provenance: [],
        gpuType: 'A100',
      },
      kernelspec: {
        name: 'python3',
        display_name: 'Python 3',
      },
      language_info: {
        name: 'python',
      },
      accelerator: 'GPU',
      gpuClass: 'premium',
    },
    cells: [
      {
        cell_type: 'markdown',
        metadata: {},
        source: cell1Intro,
      },
      {
        cell_type: 'code',
        execution_count: null,
        metadata: {},
        outputs: [],
        source: cell2Setup,
      },
      {
        cell_type: 'code',
        execution_count: null,
        metadata: {},
        outputs: [],
        source: cell3Download,
      },
      {
        cell_type: 'code',
        execution_count: null,
        metadata: {},
        outputs: [],
        source: cell4Tunnel,
      },
    ],
  };
}
