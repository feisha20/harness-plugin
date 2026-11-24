import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';
import {
  buildDeployH3Script,
  buildDeployScript,
  buildStartComfyScript,
  buildStartVllmScript,
  ColabConsoleService,
  isTransientColabNetworkError,
  MINIMAX_H3_PRESETS,
  parseNvidiaSmiCsv,
  parseSessionsOutput,
  parseStatusOutput,
  parseUsageOutput,
  parseWhoamiOutput,
  resolveGpuVllmDefaults,
  resolveH3Preset,
  summarizeCliError,
} from './service.js';
import { ResilientTunnelProxy } from './tunnel-proxy.js';

test('parseWhoamiOutput parses authenticated user info', () => {
  const sample = `
Auth provider: oauth2
Email:         user@example.com
Expires in:    59m
`;
  assert.deepEqual(parseWhoamiOutput(sample), {
    email: 'user@example.com',
    authProvider: 'oauth2',
    expiresIn: '59m',
    authenticated: true,
  });
});

test('parseUsageOutput parses balance, rate, active count and remaining hours', () => {
  const sample = `
Current balance: 985.65 compute units
Usage rate: 10.05/hr
Active assignments: 1
`;
  assert.deepEqual(parseUsageOutput(sample), {
    balance: 985.65,
    usageRatePerHour: 10.05,
    activeAssignments: 1,
    estimatedHoursLeft: 98.1,
  });
});

test('parseSessionsOutput and parseStatusOutput parse active Colab sessions', () => {
  const sessionsRaw = `[g4] gpu-g4-s-use5c1-7vnqr0eyqzb5 | Hardware: G4 | Shape: Standard | Variant: GPU`;
  assert.deepEqual(parseSessionsOutput(sessionsRaw), [
    {
      name: 'g4',
      endpoint: 'gpu-g4-s-use5c1-7vnqr0eyqzb5',
      hardware: 'G4',
      shape: 'Standard',
      variant: 'GPU',
    },
  ]);

  const statusRaw = `[g4] gpu-g4-s-use5c1-7vnqr0eyqzb5 | Hardware: G4 | Shape: Standard | Variant: GPU | Status: IDLE\n  Last Execution: stdin at 2026-11-24 10:06:08`;
  assert.deepEqual(parseStatusOutput(statusRaw), {
    status: 'IDLE',
    lastExec: 'stdin at 2026-11-24 10:06:08',
  });
});

test('parseNvidiaSmiCsv parses GPU telemetry', () => {
  const raw = 'NVIDIA RTX PRO 6000 Blackwell Workstation Edition, 86387, 97887, 12, 41';
  assert.deepEqual(parseNvidiaSmiCsv(raw), {
    name: 'NVIDIA RTX PRO 6000 Blackwell Workstation Edition',
    memoryUsedMiB: 86387,
    memoryTotalMiB: 97887,
    gpuUtilPct: 12,
    temperatureC: 41,
  });
});

test('buildStartVllmScript and buildDeployScript produce safe idempotent scripts', () => {
  const startScript = buildStartVllmScript();
  assert.ok(startScript.includes('HF_XET_HIGH_PERFORMANCE=1'));
  assert.ok(startScript.includes('HF_HUB_ENABLE_HF_TRANSFER=1'));
  assert.ok(startScript.includes('--served-model-name qwen3.8-27b-abliterated qwen38-27b-nb'));
  assert.ok(startScript.includes(`--speculative-config '{"method":"qwen3_5_mtp","num_speculative_tokens":3}'`));

  const deployScript = buildDeployScript({ forceReinstall: false });
  assert.ok(deployScript.includes('command -v vllm'));
  assert.ok(deployScript.includes('installing_vllm'));
  assert.ok(deployScript.includes('exec /content/start_vllm.sh > /content/vllm_nvfp4.log 2>&1'));

  assert.throws(() => buildStartVllmScript({ model: 'bad;rm -rf /' }));
});

test('ColabConsoleService.startDeploy provisions session, waits for API, and restarts tunnel', async () => {
  const calls = [];
  class MockDeployService extends ColabConsoleService {
    constructor() {
      super();
      this.deployPollIntervalMs = 10;
      this.deployTimeoutMs = 2000;
      this.sessionCreated = false;
      this.pollHits = 0;
    }

    async runColab(args) {
      calls.push(['colab', ...args]);
      if (args[0] === 'sessions') {
        return {
          stdout: this.sessionCreated
            ? '[g4] gpu-g4-test | Hardware: G4 | Shape: Standard | Variant: GPU'
            : '[colab] No active sessions found on server.',
          stderr: '',
        };
      }
      if (args[0] === 'new') {
        this.sessionCreated = true;
        return { stdout: '[colab] Session READY.', stderr: '' };
      }
      if (args[0] === 'whoami') return { stdout: 'Auth provider: oauth2\nEmail: u@example.com\nExpires in: 59m', stderr: '' };
      if (args[0] === 'usage') return { stdout: 'Current balance: 950 compute units\nUsage rate: 10.05/hr\nActive assignments: 1', stderr: '' };
      if (args[0] === 'status') return { stdout: 'Status: IDLE', stderr: '' };
      return { stdout: '', stderr: '' };
    }

    async runRemoteBash(sessionName, script) {
      calls.push(['remote', sessionName, script.includes('DEPLOY_EOF') ? 'launch' : script.includes('===STAGE===') ? 'poll' : 'probe']);
      if (script.includes('===STAGE===')) {
        this.pollHits += 1;
        const ready = this.pollHits >= 2;
        return {
          via: 'ssh',
          stdout: `===STAGE===\nstarting_vllm\n===ALIVE===\n123 vllm serve\n===MODELS===\n${ready ? '{"data":[{"id":"qwen38-27b-nb"}]}' : 'NOT_READY'}\n===LOG===\n${ready ? 'Application startup complete.' : 'Downloading weights...'}`,
        };
      }
      if (script.includes('curl -sf')) {
        return { via: 'ssh', stdout: 'NOT_READY' };
      }
      return { via: 'ssh', stdout: 'DEPLOY_PID=123' };
    }

    async checkLocalTunnel(port) {
      return {
        port,
        listening: this.pollHits >= 2,
        pid: 9999,
        mode: 'resilient-proxy',
        state: 'connected',
        apiReady: this.pollHits >= 2,
        models: this.pollHits >= 2 ? [{ id: 'qwen38-27b-nb' }] : [],
      };
    }

    async stopTunnel({ localPort }) {
      calls.push(['stopTunnel', localPort]);
      return { ok: true };
    }

    async restartTunnel({ sessionName, localPort }) {
      calls.push(['restartTunnel', sessionName, localPort]);
      return { ok: true, tunnel: await this.checkLocalTunnel(localPort) };
    }
  }

  const svc = new MockDeployService();
  const started = await svc.startDeploy({ sessionName: 'g4', gpu: 'G4' });
  assert.equal(started.ok, true);
  assert.equal(started.job.status, 'running');

  for (let i = 0; i < 40; i += 1) {
    await new Promise((r) => setTimeout(r, 25));
    if (!svc.getDeployStatus().active) break;
  }

  const final = svc.getDeployStatus();
  assert.equal(final.active, false);
  assert.equal(final.job.status, 'ready');
  assert.equal(final.job.createdNewSession, true);
  assert.ok(calls.some((c) => c[0] === 'colab' && c[1] === 'new'));
  assert.ok(calls.some((c) => c[0] === 'restartTunnel' && c[1] === 'g4'));
});

test('runColab preserves timeout reason and _provisionSession reconciles active sessions', async () => {
  const realTimeoutSvc = new ColabConsoleService();
  realTimeoutSvc.colabBin = process.execPath;
  await assert.rejects(
    () => realTimeoutSvc.runColab(['-e', "process.stdout.write('[colab] Creating session...'); setTimeout(() => {}, 5000);"], { timeoutMs: 120 }),
    /执行超时.*Creating session/,
  );

  class ReconcileSvc extends ColabConsoleService {
    async runColab(args) {
      if (args[0] === 'new') throw new Error('Colab CLI 执行超时');
      if (args[0] === 'sessions') {
        return { stdout: '[g4] gpu-g4-reconciled | Hardware: G4 | Shape: Standard | Variant: GPU', stderr: '' };
      }
      return { stdout: '', stderr: '' };
    }
  }
  const reconciled = await new ReconcileSvc()._provisionSession({ name: 'g4', gpu: 'G4' });
  assert.ok(reconciled.stdout.includes('reconciled'));
});

test('resolveGpuVllmDefaults adapts KV cache and context window by GPU architecture and VRAM', () => {
  const g4 = resolveGpuVllmDefaults({ gpuHardware: 'NVIDIA RTX PRO 6000 Blackwell Workstation Edition', gpuMemoryMiB: 97887 });
  assert.equal(g4.kvCacheDtype, 'fp8');
  assert.equal(g4.maxModelLen, 262144);
  assert.equal(g4.autoAdapted, false);

  const h100 = resolveGpuVllmDefaults({ gpuHardware: 'NVIDIA H100 80GB HBM3', gpuMemoryMiB: 81559 });
  assert.equal(h100.kvCacheDtype, 'fp8');
  assert.equal(h100.maxModelLen, 262144);

  const a10080 = resolveGpuVllmDefaults({ gpuHardware: 'NVIDIA A100-SXM4-80GB', gpuMemoryMiB: 81920 });
  assert.equal(a10080.kvCacheDtype, 'auto');
  assert.equal(a10080.maxModelLen, 262144);
  assert.equal(a10080.autoAdapted, true);

  const a10040 = resolveGpuVllmDefaults({ gpuHardware: 'NVIDIA A100-SXM4-40GB', gpuMemoryMiB: 40960 });
  assert.equal(a10040.kvCacheDtype, 'auto');
  assert.equal(a10040.maxModelLen, 131072);
  assert.equal(a10040.autoAdapted, true);

  const manual = resolveGpuVllmDefaults({ gpuHardware: 'NVIDIA A100-SXM4-80GB', gpuMemoryMiB: 81920, requestedKvCacheDtype: 'fp8' });
  assert.equal(manual.kvCacheDtype, 'fp8');
  assert.equal(manual.autoAdapted, false);
});

test('startDeploy falls back from G4 to A100 on 503 and auto-adapts A100 40GB vLLM flags', async () => {
  let launchedScript = '';
  let restartedTunnelSession = '';
  let createdA100 = false;

  class FallbackDeployService extends ColabConsoleService {
    constructor() {
      super();
      this.deployPollIntervalMs = 10;
      this.deployTimeoutMs = 2000;
      this.pollHits = 0;
    }

    async runColab(args) {
      if (args[0] === 'sessions') {
        return {
          stdout: createdA100
            ? '[a100] gpu-a100-fallback | Hardware: A100 | Shape: Standard | Variant: GPU'
            : '[colab] No active sessions found on server.',
          stderr: '',
        };
      }
      if (args[0] === 'new') {
        const gpuIdx = args.indexOf('--gpu');
        const gpu = gpuIdx !== -1 ? args[gpuIdx + 1] : '';
        if (gpu === 'G4') throw new Error('503 Service Unavailable');
        createdA100 = true;
        return { stdout: '[colab] Session READY.', stderr: '' };
      }
      if (args[0] === 'whoami') return { stdout: 'Auth provider: oauth2\nEmail: u@example.com\nExpires in: 59m', stderr: '' };
      if (args[0] === 'usage') return { stdout: 'Current balance: 950 compute units\nUsage rate: 6.73/hr\nActive assignments: 1', stderr: '' };
      if (args[0] === 'status') return { stdout: 'Status: IDLE', stderr: '' };
      return { stdout: '', stderr: '' };
    }

    async runRemoteBash(sessionName, script) {
      if (script.includes('DEPLOY_EOF')) {
        launchedScript = script;
        return { via: 'ssh', stdout: 'DEPLOY_PID=456' };
      }
      if (script.includes('===STAGE===')) {
        this.pollHits += 1;
        const ready = this.pollHits >= 2;
        return {
          via: 'ssh',
          stdout: `===STAGE===\nstarting_vllm\n===ALIVE===\n456 vllm serve\n===MODELS===\n${ready ? '{"data":[{"id":"qwen38-27b-nb"}]}' : 'NOT_READY'}\n===LOG===\n${ready ? 'Application startup complete.' : 'Loading weights...'}`,
        };
      }
      return {
        via: 'ssh',
        stdout: '===GPU===\nNVIDIA A100-SXM4-40GB, 40960\n===MODELS===\nNOT_READY',
      };
    }

    async checkLocalTunnel(port) {
      return {
        port,
        listening: this.pollHits >= 2,
        pid: 8888,
        mode: 'resilient-proxy',
        state: 'connected',
        apiReady: this.pollHits >= 2,
        models: this.pollHits >= 2 ? [{ id: 'qwen38-27b-nb' }] : [],
      };
    }

    async stopTunnel() {
      return { ok: true };
    }

    async restartTunnel({ sessionName, localPort }) {
      restartedTunnelSession = sessionName;
      return { ok: true, tunnel: await this.checkLocalTunnel(localPort) };
    }
  }

  const svc = new FallbackDeployService();
  const started = await svc.startDeploy({ sessionName: 'g4', gpu: 'G4', fallbackGpus: ['A100'] });
  assert.equal(started.ok, true);

  for (let i = 0; i < 40; i += 1) {
    await new Promise((r) => setTimeout(r, 25));
    if (!svc.getDeployStatus().active) break;
  }

  const final = svc.getDeployStatus();
  assert.equal(final.job.status, 'ready');
  assert.equal(final.job.sessionName, 'a100');
  assert.equal(final.job.gpu, 'A100');
  assert.equal(final.job.effectiveConfig.kvCacheDtype, 'auto');
  assert.equal(final.job.effectiveConfig.maxModelLen, 131072);
  assert.ok(launchedScript.includes('--kv-cache-dtype auto'));
  assert.ok(launchedScript.includes('--max-model-len 131072'));
  assert.equal(restartedTunnelSession, 'a100');
});

test('summarizeCliError strips Rich box-drawing tracebacks into a concise single line', () => {
  const richTraceback = `╭─────────────────────────────── Traceback (most recent call last) ───────────────────────────────╮
│ /Users/linjt/.local/share/uv/tools/google-colab-cli/lib/python3.12/site-packages/colab_cli/cli.py:167 in new │
│   165 │   res = state.client.assign(uuid4(), variant=variant, accelerator=accelerator)                                  │
╰────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
ColabRequestError: Failed to issue request POST https://colab.research.google.com/tun/m/assign?nbh=d29f&variant=GPU&accelerator=A100: Service Unavailable
`;
  const summary = summarizeCliError(richTraceback, "[colab] Creating session 'a100'...");
  assert.ok(summary.includes('ColabRequestError'));
  assert.ok(summary.includes('Service Unavailable'));
  assert.ok(!/[╭╮╰╯│─]/.test(summary));
  assert.ok(summary.length <= 240);
});

test('cancelDeploy aborts an in-flight deploy job and marks running step cancelled', async () => {
  class SlowDeployService extends ColabConsoleService {
    async runColab(args, { signal } = {}) {
      if (args[0] === 'sessions') return { stdout: '[colab] No active sessions found on server.', stderr: '' };
      if (args[0] === 'new') {
        return new Promise((_, reject) => {
          signal?.addEventListener('abort', () => {
            const err = new Error('aborted');
            err.name = 'AbortError';
            reject(err);
          }, { once: true });
        });
      }
      return { stdout: '', stderr: '' };
    }
    async stopTunnel() { return { ok: true }; }
  }

  const svc = new SlowDeployService();
  const started = await svc.startDeploy({ sessionName: 'g4', gpu: 'G4' });
  assert.equal(started.job.status, 'running');
  await new Promise((r) => setTimeout(r, 25));

  const cancelled = svc.cancelDeploy();
  assert.equal(cancelled.cancelled, true);
  assert.equal(cancelled.job.status, 'cancelled');
  assert.equal(cancelled.job.steps[0].status, 'cancelled');
});

test('retryDeploy resumes from Step 2 (bootstrap) on existing session without recreating VM', async () => {
  const newCalls = [];
  let failProbeOnce = true;

  class RetryStep2Service extends ColabConsoleService {
    constructor() {
      super();
      this.deployPollIntervalMs = 10;
      this.deployTimeoutMs = 2000;
      this.pollHits = 0;
    }

    async runColab(args) {
      if (args[0] === 'sessions') {
        return { stdout: '[a100] gpu-a100-live | Hardware: A100 | Shape: Standard | Variant: GPU', stderr: '' };
      }
      if (args[0] === 'new') {
        newCalls.push(args);
        return { stdout: '', stderr: '' };
      }
      if (args[0] === 'whoami') return { stdout: 'Auth provider: oauth2\nEmail: u@example.com\nExpires in: 59m', stderr: '' };
      if (args[0] === 'usage') return { stdout: 'Current balance: 950 compute units\nUsage rate: 6.73/hr\nActive assignments: 1', stderr: '' };
      if (args[0] === 'status') return { stdout: 'Status: IDLE', stderr: '' };
      return { stdout: '', stderr: '' };
    }

    async runRemoteBash(sessionName, script) {
      if (script.includes('DEPLOY_EOF')) return { via: 'ssh', stdout: 'DEPLOY_PID=101' };
      if (script.includes('===STAGE===')) {
        this.pollHits += 1;
        const ready = this.pollHits >= 2;
        return {
          via: 'ssh',
          stdout: `===STAGE===\nstarting_vllm\n===ALIVE===\n101 vllm serve\n===MODELS===\n${ready ? '{"data":[{"id":"qwen38-27b-nb"}]}' : 'NOT_READY'}\n===LOG===\nready`,
        };
      }
      if (failProbeOnce) {
        failProbeOnce = false;
        throw new Error('远端命令执行超时');
      }
      return {
        via: 'ssh',
        stdout: '===GPU===\nNVIDIA A100-SXM4-80GB, 81920\n===MODELS===\nNOT_READY',
      };
    }

    async checkLocalTunnel(port) {
      return {
        port,
        listening: this.pollHits >= 2,
        pid: 7777,
        mode: 'resilient-proxy',
        state: 'connected',
        apiReady: this.pollHits >= 2,
        models: this.pollHits >= 2 ? [{ id: 'qwen38-27b-nb' }] : [],
      };
    }

    async restartTunnel({ localPort }) {
      return { ok: true, tunnel: await this.checkLocalTunnel(localPort) };
    }
  }

  const svc = new RetryStep2Service();
  await svc.startDeploy({ sessionName: 'a100', gpu: 'A100' });
  for (let i = 0; i < 40; i += 1) {
    await new Promise((r) => setTimeout(r, 20));
    if (!svc.getDeployStatus().active) break;
  }
  assert.equal(svc.getDeployStatus().job.status, 'failed');
  assert.equal(svc.getDeployStatus().job.steps[1].status, 'error');

  const retried = await svc.retryDeploy();
  assert.equal(retried.job.steps[0].status, 'done');
  assert.equal(retried.job.steps[1].status, 'running');
  for (let i = 0; i < 40; i += 1) {
    await new Promise((r) => setTimeout(r, 20));
    if (!svc.getDeployStatus().active) break;
  }
  const done = svc.getDeployStatus();
  assert.equal(done.job.status, 'ready');
  assert.equal(newCalls.length, 0);
});

test('runRemoteBash retries cold-kernel timeout when retryOnTimeout is enabled', async () => {
  let execAttempts = 0;
  class ColdKernelSvc extends ColabConsoleService {
    async checkLocalTunnel(port) {
      return { port, listening: true, pid: 1 };
    }
    async _runColabExecOnce() {
      execAttempts += 1;
      if (execAttempts === 1) throw new Error('远端命令执行超时');
      return { via: 'exec', stdout: '===GPU===\nNVIDIA A100-SXM4-40GB, 40960', stderr: '' };
    }
  }

  const res = await new ColdKernelSvc().runRemoteBash('a100', 'echo hi', {
    timeoutMs: 1000,
    retryOnTimeout: true,
    maxRetries: 2,
  });
  assert.equal(execAttempts, 2);
  assert.ok(res.stdout.includes('A100'));
});

test('ResilientTunnelProxy transparently retries pre-header socket drop', async () => {
  let hits = 0;
  const mockUpstream = http.createServer((req, res) => {
    hits += 1;
    if (req.url === '/v1/chat/completions' && hits === 1) {
      req.socket.destroy();
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, hits }));
  });

  await new Promise((resolve) => mockUpstream.listen(0, '127.0.0.1', resolve));
  const upstreamPort = mockUpstream.address().port;

  class MockProxy extends ResilientTunnelProxy {
    _spawnSsh() {
      this.state = 'connected';
      this._notifyReady();
    }
  }

  const proxy = new MockProxy({
    sessionName: 'test',
    localPort: 0,
    upstreamPort,
    probeIntervalMs: 60000,
  });

  try {
    await proxy.start();
    hits = 0;
    const resp = await fetch(`http://127.0.0.1:${proxy.localPort}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'qwen38-27b-nb', messages: [{ role: 'user', content: 'hi' }] }),
    });
    assert.equal(resp.status, 200);
    const body = await resp.json();
    assert.equal(body.ok, true);
    assert.ok(hits >= 2);
  } finally {
    await proxy.stop();
    await new Promise((resolve) => {
      mockUpstream.close(resolve);
      mockUpstream.closeAllConnections?.();
    });
  }
});

test('isTransientColabNetworkError distinguishes transient proxy/TLS drops from cert or 503 errors', () => {
  assert.equal(
    isTransientColabNetworkError("SSLError(SSLEOFError(8, '[SSL: UNEXPECTED_EOF_WHILE_READING] EOF occurred in violation of protocol'))"),
    true,
  );
  assert.equal(isTransientColabNetworkError('ProxyError: Cannot connect to proxy'), true);
  assert.equal(isTransientColabNetworkError('RemoteDisconnected: Remote end closed connection'), true);
  assert.equal(isTransientColabNetworkError('SSLCertVerificationError: CERTIFICATE_VERIFY_FAILED'), false);
  assert.equal(isTransientColabNetworkError('ColabRequestError: 503 Service Unavailable'), false);
});

test('summarizeCliError stitches hard-wrapped URLs across lines without spaces', () => {
  const wrappedTraceback = `╭──────────────── Traceback (most recent call last) ────────────────╮
│ /app/client.py:238 in _issue_request                              │
╰───────────────────────────────────────────────────────────────────╯
ColabRequestError: Failed to issue request POST
https://colab.research.google.com/tun/m/assign?nbh=b15b030f_6407_4375_8d65_06814
ee504f8........&variant=GPU&accelerator=A100: Service Unavailable
`;
  const summary = summarizeCliError(wrappedTraceback);
  assert.ok(
    summary.includes(
      'https://colab.research.google.com/tun/m/assign?nbh=b15b030f_6407_4375_8d65_06814ee504f8........&variant=GPU&accelerator=A100: Service Unavailable',
    ),
  );
});

test('runColab retries read-only commands on transient SSLEOFError and formats exhausted errors', async () => {
  let attempts = 0;
  class RetrySessionsSvc extends ColabConsoleService {
    constructor() {
      super();
      this.transientRetryBaseMs = 5;
    }
    async _execColabOnce(args) {
      assert.equal(args[0], 'sessions');
      attempts += 1;
      if (attempts < 3) {
        const err = new Error("SSLError(SSLEOFError(8, '[SSL: UNEXPECTED_EOF_WHILE_READING]'))");
        err.rawDetail = err.message;
        throw err;
      }
      return { stdout: '[colab] No active sessions found on server.', stderr: '' };
    }
  }

  const res = await new RetrySessionsSvc().runColab(['sessions']);
  assert.equal(attempts, 3);
  assert.ok(res.stdout.includes('No active sessions'));

  let failAttempts = 0;
  class ExhaustedSvc extends ColabConsoleService {
    constructor() {
      super();
      this.transientRetryBaseMs = 5;
    }
    async _execColabOnce() {
      failAttempts += 1;
      const err = new Error("SSLError(SSLEOFError(8, '[SSL: UNEXPECTED_EOF_WHILE_READING] EOF occurred in violation of protocol'))");
      err.rawDetail = err.message;
      throw err;
    }
  }

  await assert.rejects(
    () => new ExhaustedSvc().runColab(['sessions']),
    (err) => {
      assert.equal(failAttempts, 3);
      assert.equal(err.isTransientNetwork, true);
      assert.match(err.message, /本机代理或 TLS 连接意外中断.*已自动重试 2 次仍失败.*SSLEOFError/);
      assert.ok(err.rawDetail.includes('UNEXPECTED_EOF_WHILE_READING'));
      return true;
    },
  );
});

test('_provisionSession reconciles then retries once on transient SSLEOFError without stale 503 mislabeling', async () => {
  let newAttempts = 0;
  class TransientProvisionSvc extends ColabConsoleService {
    constructor() {
      super();
      this.transientRetryBaseMs = 5;
    }
    async _execColabOnce(args) {
      if (args[0] === 'sessions') {
        return { stdout: '[colab] No active sessions found on server.', stderr: '' };
      }
      if (args[0] === 'new') {
        newAttempts += 1;
        if (newAttempts === 1) {
          const err = new Error("SSLError(SSLEOFError(8, '[SSL: UNEXPECTED_EOF_WHILE_READING]'))");
          err.rawDetail = err.message;
          throw err;
        }
        return { stdout: '[colab] Session READY.', stderr: '' };
      }
      return { stdout: '', stderr: '' };
    }
  }

  const okRes = await new TransientProvisionSvc()._provisionSession({ name: 'a100', gpu: 'A100' });
  assert.equal(newAttempts, 2);
  assert.ok(okRes.stdout.includes('READY'));

  class AlwaysSslDropProvisionSvc extends ColabConsoleService {
    constructor() {
      super();
      this.transientRetryBaseMs = 5;
    }
    _readRecentColabLogHint() {
      return 'Google Colab 后端返回 503 Service Unavailable（不应出现）';
    }
    async _execColabOnce(args) {
      if (args[0] === 'sessions') {
        return { stdout: '[colab] No active sessions found on server.', stderr: '' };
      }
      const err = new Error("SSLError(SSLEOFError(8, '[SSL: UNEXPECTED_EOF_WHILE_READING]'))");
      err.rawDetail = err.message;
      throw err;
    }
  }

  await assert.rejects(
    () => new AlwaysSslDropProvisionSvc()._provisionSession({ name: 'a100', gpu: 'A100' }),
    (err) => {
      assert.match(err.message, /本机代理或 TLS 连接意外中断/);
      assert.ok(!err.message.includes('503 Service Unavailable'));
      return true;
    },
  );
});

test('resolveH3Preset, buildStartComfyScript, and buildDeployH3Script cover all uncensored presets', () => {
  assert.throws(() => resolveH3Preset('invalid-preset'), /不支持的 MiniMax-H3 预设/);

  for (const key of Object.keys(MINIMAX_H3_PRESETS)) {
    const preset = resolveH3Preset(key);
    assert.equal(preset.textEncoder.destName, 'MiniMax-H3-TextEncoder-Qwen3VL-32B-abliterated-13.6G_vis.gguf');
    const script = buildDeployH3Script({ preset: key, remotePort: 8188, useSageAttention: true });
    assert.ok(script.includes('ComfyUI-GGUF'));
    assert.ok(script.includes('ComfyUI-VideoHelperSuite'));
    assert.ok(script.includes(preset.dit.destName));
    assert.ok(script.includes('minimax_h3_uncensored_l4.json'));
    assert.ok(script.includes('CLIPLoaderGGUF'));
  }

  const startComfy = buildStartComfyScript({ remotePort: 8188, useSageAttention: true, lowVram: true });
  assert.ok(startComfy.includes('--port 8188'));
  assert.ok(startComfy.includes('--use-sage-attention'));
  assert.ok(startComfy.includes('--lowvram'));
});

test('ResilientTunnelProxy supports /system_stats probe and WebSocket upgrade tunneling', async () => {
  const net = await import('node:net');
  const isOriginMismatched = (req) => {
    if (!req.headers.origin) return false;
    try {
      return new URL(req.headers.origin).host !== req.headers.host;
    } catch {
      return true;
    }
  };
  const mockUpstream = http.createServer((req, res) => {
    if (isOriginMismatched(req)) {
      res.writeHead(403);
      res.end();
      return;
    }
    if (req.url === '/system_stats') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ system: { comfyui_version: '0.45.0' }, devices: [{ name: 'NVIDIA L4' }] }));
      return;
    }
    res.writeHead(404);
    res.end();
  });
  const upgradeSockets = new Set();
  mockUpstream.on('upgrade', (req, socket) => {
    if (isOriginMismatched(req)) {
      socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
      socket.destroy();
      return;
    }
    upgradeSockets.add(socket);
    socket.on('close', () => upgradeSockets.delete(socket));
    socket.on('end', () => socket.end());
    socket.on('error', () => socket.destroy());
    socket.write(
      'HTTP/1.1 101 Switching Protocols\r\n' +
        'Upgrade: websocket\r\n' +
        'Connection: Upgrade\r\n\r\n',
    );
    socket.on('data', (chunk) => socket.write(chunk));
  });

  await new Promise((resolve) => mockUpstream.listen(0, '127.0.0.1', resolve));
  const upstreamPort = mockUpstream.address().port;

  class MockComfyProxy extends ResilientTunnelProxy {
    _spawnSsh() {
      this.state = 'connected';
      this._notifyReady();
    }
  }

  const proxy = new MockComfyProxy({
    sessionName: 'l4',
    localPort: 0,
    upstreamPort,
    probePath: '/system_stats',
    probeIntervalMs: 60000,
  });

  try {
    await proxy.start();
    assert.equal(proxy.getStatus().probePath, '/system_stats');
    const httpResp = await fetch(`http://127.0.0.1:${proxy.localPort}/system_stats`, {
      headers: { Origin: `http://127.0.0.1:${proxy.localPort}` },
    });
    assert.equal(httpResp.status, 200);
    const statsJson = await httpResp.json();
    assert.equal(statsJson.system.comfyui_version, '0.45.0');
    assert.equal(proxy.getStatus().inFlightRequests, 0);

    const wsResult = await new Promise((resolve, reject) => {
      const client = net.connect({ host: '127.0.0.1', port: proxy.localPort }, () => {
        client.write(
          'GET /ws?clientId=test HTTP/1.1\r\n' +
            `Host: 127.0.0.1:${proxy.localPort}\r\n` +
            `Origin: http://127.0.0.1:${proxy.localPort}\r\n` +
            'Upgrade: websocket\r\n' +
            'Connection: Upgrade\r\n' +
            'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n' +
            'Sec-WebSocket-Version: 13\r\n\r\n',
        );
      });
      let recv = '';
      client.on('data', (d) => {
        recv += d.toString('utf8');
        if (recv.includes('101 Switching Protocols') && !recv.includes('PING_H3')) {
          client.write('PING_H3');
        } else if (recv.includes('PING_H3')) {
          client.destroy();
          resolve(recv);
        }
      });
      client.on('error', reject);
    });
    assert.ok(wsResult.includes('101 Switching Protocols'));
    assert.ok(wsResult.includes('PING_H3'));
  } finally {
    await proxy.stop();
    for (const s of upgradeSockets) s.destroy();
    await new Promise((resolve) => {
      mockUpstream.close(resolve);
      mockUpstream.closeAllConnections?.();
    });
  }
});

test('startH3Deploy, cancelH3Deploy, and retryH3Deploy manage L4 ComfyUI deployment cleanly', async () => {
  let createdL4 = false;
  let pollHits = 0;
  let restartedPort = null;
  let launchedH3Script = '';

  class MockH3Service extends ColabConsoleService {
    constructor() {
      super();
      this.h3DeployPollIntervalMs = 10;
      this.h3DeployTimeoutMs = 2000;
    }

    async runColab(args) {
      if (args[0] === 'sessions') {
        return {
          stdout: createdL4
            ? '[l4] gpu-l4-test | Hardware: L4 | Shape: High-RAM | Variant: GPU'
            : '[colab] No active sessions found on server.',
          stderr: '',
        };
      }
      if (args[0] === 'new') {
        createdL4 = true;
        return { stdout: '[colab] Session READY.', stderr: '' };
      }
      if (args[0] === 'whoami') return { stdout: 'Auth provider: oauth2\nEmail: u@example.com\nExpires in: 59m', stderr: '' };
      if (args[0] === 'usage') return { stdout: 'Current balance: 970 compute units\nUsage rate: 1.54/hr\nActive assignments: 1', stderr: '' };
      if (args[0] === 'status') return { stdout: 'Status: IDLE', stderr: '' };
      return { stdout: '', stderr: '' };
    }

    async runRemoteBash(sessionName, script) {
      assert.equal(sessionName, 'l4');
      if (script.includes('DEPLOY_H3_EOF')) {
        launchedH3Script = script;
        return { via: 'ssh', stdout: 'DEPLOY_H3_PID=222' };
      }
      if (script.includes('===STATS===')) {
        pollHits += 1;
        const ready = pollHits >= 2;
        return {
          via: 'ssh',
          stdout: `===STAGE===\nstarting_comfyui\n===ALIVE===\n222 python3 /content/ComfyUI/main.py\n===STATS===\n${ready ? '{"system":{"comfyui_version":"0.45.0"},"devices":[{"name":"NVIDIA L4"}]}' : 'NOT_READY'}\n===LOG===\n${ready ? 'To see the GUI go to: http://0.0.0.0:8188' : '[h3-dl] fetching'}`,
        };
      }
      return {
        via: 'ssh',
        stdout: '===GPU===\nNVIDIA L4, 23034\n===DISK===\n/dev/sda1 112G 30G 82G 27% /content\n===READY_CHECK===\nWEIGHTS_MISSING\n===STATS===\nNOT_READY',
      };
    }

    async checkLocalTunnel(port) {
      return {
        port,
        listening: port === 8188 && pollHits >= 2,
        pid: 4444,
        mode: 'resilient-proxy',
        state: 'connected',
        probePath: port === 8188 ? '/system_stats' : '/v1/models',
        apiReady: port === 8188 && pollHits >= 2,
      };
    }

    async stopTunnel() {
      return { ok: true };
    }

    async restartTunnel({ localPort, remotePort, probePath }) {
      restartedPort = { localPort, remotePort, probePath };
      return { ok: true, tunnel: await this.checkLocalTunnel(localPort) };
    }
  }

  const svc = new MockH3Service();
  const started = await svc.startH3Deploy({ sessionName: 'l4', gpu: 'L4', preset: 'uncensored-fp8-turbo' });
  assert.equal(started.ok, true);

  for (let i = 0; i < 40; i += 1) {
    await new Promise((r) => setTimeout(r, 25));
    if (!svc.getH3DeployStatus().active) break;
  }

  const done = svc.getH3DeployStatus();
  assert.equal(done.job.status, 'ready');
  assert.equal(done.job.sessionName, 'l4');
  assert.equal(done.job.gpu, 'L4');
  assert.ok(launchedH3Script.includes('MiniMax-H3-TextEncoder-Qwen3VL-32B-abliterated-13.6G_vis.gguf'));
  assert.deepEqual(restartedPort, { localPort: 8188, remotePort: 8188, probePath: '/system_stats' });

  // Verify cancel + retry on H3 job
  class SlowH3Svc extends ColabConsoleService {
    async runColab(args, { signal } = {}) {
      if (args[0] === 'sessions') return { stdout: '[colab] No active sessions found on server.', stderr: '' };
      if (args[0] === 'new') {
        return new Promise((_, reject) => {
          signal?.addEventListener('abort', () => {
            const err = new Error('aborted');
            err.name = 'AbortError';
            reject(err);
          }, { once: true });
        });
      }
      return { stdout: '', stderr: '' };
    }
    async stopTunnel() { return { ok: true }; }
  }
  const slow = new SlowH3Svc();
  await slow.startH3Deploy({ sessionName: 'l4', gpu: 'L4' });
  await new Promise((r) => setTimeout(r, 20));
  const cancelled = slow.cancelH3Deploy();
  assert.equal(cancelled.cancelled, true);
  assert.equal(cancelled.job.status, 'cancelled');
});
