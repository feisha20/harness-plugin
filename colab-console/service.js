import { execFile, spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
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
  }

  async runColab(args, { timeoutMs = 20000, input } = {}) {
    try {
      const { stdout, stderr } = await execFileAsync(this.colabBin, args, {
        timeout: timeoutMs,
        maxBuffer: 4 * 1024 * 1024,
        env: {
          ...process.env,
          PATH: `${path.dirname(this.colabBin)}:${process.env.PATH || ''}`,
        },
        ...(input !== undefined ? {} : {}),
      });
      return { stdout: stdout || '', stderr: stderr || '' };
    } catch (err) {
      const detail = (err?.stderr || err?.stdout || err?.message || 'Colab CLI 执行失败').trim();
      throw new Error(detail);
    }
  }

  async runRemoteBash(sessionName, script, { timeoutMs = 25000, sshKey } = {}) {
    const name = validateSessionName(sessionName);
    const key = sshKey || resolveDefaultSshKey();
    const tunnel = await this.checkLocalTunnel(8000);

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
            maxBuffer: 4 * 1024 * 1024,
            input: script,
            env: {
              ...process.env,
              PATH: `${path.dirname(this.colabBin)}:${process.env.PATH || ''}`,
            },
          },
        );
        return { via: 'ssh', stdout: stdout || '', stderr: stderr || '' };
      } catch {
        // Fall back to colab exec below if SSH key is rejected or unavailable.
      }
    }

    // Fallback via Jupyter kernel `%%bash`
    const payload = `%%bash\n${script}\n`;
    const child = await new Promise((resolve, reject) => {
      const proc = spawn(this.colabBin, ['exec', '-s', name, '--timeout', String(Math.ceil(timeoutMs / 1000))], {
        env: {
          ...process.env,
          PATH: `${path.dirname(this.colabBin)}:${process.env.PATH || ''}`,
        },
      });
      let stdout = '';
      let stderr = '';
      const timer = setTimeout(() => {
        proc.kill('SIGTERM');
        reject(new Error('远端命令执行超时'));
      }, timeoutMs);
      proc.stdout.on('data', (d) => { stdout += d.toString(); });
      proc.stderr.on('data', (d) => { stderr += d.toString(); });
      proc.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
      proc.on('close', (code) => {
        clearTimeout(timer);
        if (code !== 0) {
          reject(new Error((stderr || stdout || `colab exec exited with ${code}`).trim()));
        } else {
          resolve({ via: 'exec', stdout, stderr });
        }
      });
      proc.stdin.write(payload);
      proc.stdin.end();
    });
    return child;
  }

  async checkLocalTunnel(localPort = 8000) {
    const port = validatePort(localPort);
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
    let apiError = '';
    let proxyHealth = null;
    if (listeningPid) {
      const [modelsRes, healthRes] = await Promise.allSettled([
        localHttpJson(port, '/v1/models', 3500),
        localHttpJson(port, '/__tunnel_health', 1500),
      ]);

      if (healthRes.status === 'fulfilled' && healthRes.value.ok) {
        proxyHealth = healthRes.value.data;
      }

      if (modelsRes.status === 'fulfilled') {
        const resp = modelsRes.value;
        if (resp.ok) {
          apiReady = true;
          models = (resp.data?.data || []).map((m) => ({
            id: m.id,
            root: m.root || '',
            maxModelLen: m.max_model_len || null,
          }));
        } else {
          apiError = resp.error || `HTTP ${resp.status}`;
        }
      } else {
        apiError = modelsRes.reason?.message || '连接超时';
      }
    }

    return {
      port,
      listening: Boolean(listeningPid),
      pid: listeningPid,
      command: listeningCmd,
      mode: proxyHealth ? 'resilient-proxy' : listeningPid ? 'raw-ssh' : 'stopped',
      state: proxyHealth?.state || (listeningPid ? 'connected' : 'stopped'),
      reconnectCount: proxyHealth?.reconnectCount ?? 0,
      lastProbeAt: proxyHealth?.lastProbeAt || null,
      lastProbeMs: proxyHealth?.lastProbeMs ?? null,
      lastError: proxyHealth?.lastError || '',
      sshPid: proxyHealth?.sshPid ?? null,
      upstreamPort: proxyHealth?.upstreamPort ?? null,
      managedByPlugin: this.tunnelChildren.has(port) || Boolean(proxyHealth),
      apiReady,
      models,
      apiError,
      endpoint: `http://127.0.0.1:${port}/v1`,
      defaultSshKey: resolveDefaultSshKey(),
    };
  }

  async getOverview({ localPort = 8000 } = {}) {
    const [whoamiRes, usageRes, sessionsRes, tunnel] = await Promise.all([
      this.runColab(['whoami']).catch((e) => ({ stdout: '', error: e.message })),
      this.runColab(['usage']).catch((e) => ({ stdout: '', error: e.message })),
      this.runColab(['sessions']).catch((e) => ({ stdout: '', error: e.message })),
      this.checkLocalTunnel(localPort),
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
      errors: [whoamiRes.error, usageRes.error, sessionsRes.error].filter(Boolean),
    };
  }

  async createSession({ name, gpu, tpu, highMem } = {}) {
    const args = ['new'];
    if (name && String(name).trim()) {
      args.push('-s', validateSessionName(name));
    }
    if (gpu && String(gpu).trim()) {
      args.push('--gpu', String(gpu).trim().toUpperCase());
    } else if (tpu && String(tpu).trim()) {
      args.push('--tpu', String(tpu).trim().toUpperCase());
    }
    if (highMem) {
      args.push('--high-mem');
    }
    const { stdout, stderr } = await this.runColab(args, { timeoutMs: 90000 });
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

  async startVllm({
    sessionName,
    model = DEFAULT_MODEL_REPO,
    servedName = DEFAULT_SERVED_NAME,
    port = 8000,
    maxModelLen = 262144,
    maxNumSeqs = 128,
    kvCacheDtype = 'fp8',
    enableMtp = true,
    enableTools = true,
    useExistingScript = false,
  } = {}) {
    const name = validateSessionName(sessionName);
    const rPort = validatePort(port, 8000);
    const safeMaxLen = Number(maxModelLen) || 262144;
    const safeMaxSeqs = Number(maxNumSeqs) || 128;

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
      const mtpFlag = enableMtp
        ? `  --speculative-config '{"method":"qwen3_5_mtp","num_speculative_tokens":3}' \\\n`
        : '';
      const toolFlags = enableTools
        ? `  --enable-auto-tool-choice \\\n  --tool-call-parser qwen3_coder \\\n`
        : '';
      const kvFlag = kvCacheDtype ? `  --kv-cache-dtype ${kvCacheDtype} \\\n` : '';
      scriptBody = `
pkill -f "vllm serve" || true
sleep 2
cat << 'EOF' > /content/start_vllm.sh
#!/bin/bash
export HF_XET_HIGH_PERFORMANCE=1
exec vllm serve ${model} \\
  --served-model-name ${servedName} \\
  --host 0.0.0.0 \\
  --port ${rPort} \\
  --max-model-len ${safeMaxLen} \\
  --max-num-seqs ${safeMaxSeqs} \\
${kvFlag}  --reasoning-parser qwen3 \\
${toolFlags}${mtpFlag}  --gpu-memory-utilization 0.90
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
      output: stdout.trim(),
    };
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

  async startTunnel({ sessionName, localPort = 8000, remotePort = 8000, sshKey } = {}) {
    const name = validateSessionName(sessionName);
    const lPort = validatePort(localPort, 8000);
    const rPort = validatePort(remotePort, 8000);
    const key = sshKey || resolveDefaultSshKey();
    if (!key || !fs.existsSync(key)) {
      throw new Error('本机未找到可用的 SSH 私钥（~/.ssh/id_ed25519 或 id_ed25519_github 等）');
    }

    const existing = await this.checkLocalTunnel(lPort);
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
      const status = await this.checkLocalTunnel(lPort);
      if (status.apiReady || (status.mode === 'resilient-proxy' && status.listening && status.state === 'connected')) {
        return { ok: true, alreadyRunning: false, tunnel: status };
      }
    }

    return {
      ok: true,
      alreadyRunning: false,
      tunnel: await this.checkLocalTunnel(lPort),
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

  async restartTunnel({ sessionName, localPort = 8000, remotePort = 8000, sshKey } = {}) {
    await this.stopTunnel({ localPort });
    // Allow Colab time to release the single SSH session slot before reconnecting.
    await new Promise((r) => setTimeout(r, 1500));
    return this.startTunnel({ sessionName, localPort, remotePort, sshKey });
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
