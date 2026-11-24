import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_COLAB_BIN = path.join(os.homedir(), '.local', 'bin', 'colab');
const DEFAULT_SSH_KEYS = [
  path.join(os.homedir(), '.ssh', 'id_ed25519'),
  path.join(os.homedir(), '.ssh', 'id_ed25519_github'),
  path.join(os.homedir(), '.ssh', 'id_ecdsa'),
  path.join(os.homedir(), '.ssh', 'id_rsa'),
];

export function resolveColabBin() {
  return fs.existsSync(DEFAULT_COLAB_BIN) ? DEFAULT_COLAB_BIN : 'colab';
}

export function resolveDefaultSshKey() {
  for (const keyPath of DEFAULT_SSH_KEYS) {
    if (fs.existsSync(keyPath)) return keyPath;
  }
  return '';
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function readRequestBody(req, maxBytes = 128 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let total = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function probeUpstream(upstreamPort, probePath = '/v1/models', timeoutMs = 3500) {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: upstreamPort,
        path: probePath || '/v1/models',
        method: 'GET',
        agent: false,
        headers: { Connection: 'close' },
        timeout: timeoutMs,
      },
      (res) => {
        res.resume();
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 500,
            statusCode: res.statusCode,
            latencyMs: Math.round(performance.now() - t0),
          });
        });
      },
    );
    req.on('timeout', () => {
      req.destroy(new Error('probe timeout'));
    });
    req.on('error', (err) => {
      resolve({ ok: false, error: err.message, latencyMs: Math.round(performance.now() - t0) });
    });
    req.end();
  });
}

export class ResilientTunnelProxy {
  constructor({
    sessionName,
    localPort = 8000,
    remotePort = 8000,
    upstreamPort,
    probePath = '/v1/models',
    sshKey,
    colabBin,
    probeIntervalMs = 15000,
  }) {
    this.sessionName = sessionName;
    this.localPort = Number(localPort);
    this.remotePort = Number(remotePort);
    this.upstreamPort = Number(upstreamPort || this.localPort + 10000);
    this.probePath = probePath || '/v1/models';
    this.sshKey = sshKey || resolveDefaultSshKey();
    this.colabBin = colabBin || resolveColabBin();
    this.probeIntervalMs = probeIntervalMs;

    this.server = null;
    this.sshChild = null;
    this.stopped = false;
    this.state = 'stopped';
    this.reconnectCount = 0;
    this.consecutiveProbeFailures = 0;
    this.consecutiveSpawnFailures = 0;
    this.inFlightRequests = 0;
    this.lastProbeAt = null;
    this.lastProbeMs = null;
    this.lastError = '';
    this.lastStderr = '';
    this.startedAt = new Date().toISOString();
    this.probeTimer = null;
    this.reconnectTimer = null;
    this.readyWaiters = [];
    this.activeUpgradeSockets = new Set();
  }

  getStatus() {
    return {
      ok: this.state === 'connected',
      mode: 'resilient-proxy',
      pid: process.pid,
      sshPid: this.sshChild?.pid || null,
      sessionName: this.sessionName,
      localPort: this.localPort,
      upstreamPort: this.upstreamPort,
      remotePort: this.remotePort,
      probePath: this.probePath,
      state: this.state,
      reconnectCount: this.reconnectCount,
      inFlightRequests: this.inFlightRequests,
      lastProbeAt: this.lastProbeAt,
      lastProbeMs: this.lastProbeMs,
      lastError: this.lastError,
      startedAt: this.startedAt,
    };
  }

  _notifyReady() {
    const waiters = this.readyWaiters.splice(0);
    for (const fn of waiters) fn(true);
  }

  waitForReady(timeoutMs = 10000) {
    if (this.state === 'connected') return Promise.resolve(true);
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        const idx = this.readyWaiters.indexOf(onReady);
        if (idx !== -1) this.readyWaiters.splice(idx, 1);
        resolve(this.state === 'connected');
      }, timeoutMs);
      const onReady = (val) => {
        clearTimeout(timer);
        resolve(val);
      };
      this.readyWaiters.push(onReady);
    });
  }

  async start() {
    this.stopped = false;
    this.startedAt = new Date().toISOString();

    await new Promise((resolve, reject) => {
      const srv = http.createServer((req, res) => this._handleHttp(req, res));
      srv.on('upgrade', (req, socket, head) => this._handleUpgrade(req, socket, head));
      srv.keepAliveTimeout = 65000;
      srv.headersTimeout = 70000;
      srv.on('error', reject);
      srv.listen(this.localPort, '127.0.0.1', () => {
        this.localPort = srv.address().port;
        this.server = srv;
        resolve();
      });
    });

    this._spawnSsh();
    this.probeTimer = setInterval(() => this._runHealthProbe(), this.probeIntervalMs);
    this.probeTimer.unref?.();
    await this.waitForReady(12000);
    return this.getStatus();
  }

  async stop() {
    this.stopped = true;
    this.state = 'stopped';
    if (this.probeTimer) {
      clearInterval(this.probeTimer);
      this.probeTimer = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this._killSsh();
    for (const sock of this.activeUpgradeSockets) {
      try {
        sock.destroy();
      } catch {
        // ignore
      }
    }
    this.activeUpgradeSockets.clear();
    if (this.server) {
      const srv = this.server;
      this.server = null;
      await new Promise((resolve) => {
        srv.close(() => resolve());
        srv.closeIdleConnections?.();
        srv.closeAllConnections?.();
      });
    }
  }

  _killSsh() {
    if (!this.sshChild) return;
    const child = this.sshChild;
    this.sshChild = null;
    try {
      child.kill('SIGTERM');
    } catch {
      // ignore
    }
  }

  kickReconnect(reason = '') {
    if (this.stopped) return;
    if (reason) this.lastError = reason;
    if (this.state === 'connecting' || this.state === 'reconnecting') return;
    this.state = 'reconnecting';
    this._killSsh();
    this._scheduleReconnect(300);
  }

  _scheduleReconnect(delayMs) {
    if (this.stopped) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.stopped && !this.sshChild) {
        this.reconnectCount += 1;
        this._spawnSsh();
      }
    }, delayMs);
    this.reconnectTimer.unref?.();
  }

  _spawnSsh() {
    if (this.stopped || this.sshChild) return;
    if (!this.sshKey || !fs.existsSync(this.sshKey)) {
      this.lastError = '未找到可用的 SSH 私钥，无法建立隧道';
      return;
    }
    this.state = this.reconnectCount > 0 ? 'reconnecting' : 'connecting';
    this.lastStderr = '';

    const proxyCmd = `${this.colabBin} ssh --proxy-mode -s ${this.sessionName} -i ${this.sshKey}`;
    const child = spawn(
      'ssh',
      [
        '-N',
        '-L', `127.0.0.1:${this.upstreamPort}:127.0.0.1:${this.remotePort}`,
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'UserKnownHostsFile=/dev/null',
        '-o', 'LogLevel=ERROR',
        '-o', 'ServerAliveInterval=5',
        '-o', 'ServerAliveCountMax=2',
        '-o', 'TCPKeepAlive=yes',
        '-o', 'ConnectTimeout=8',
        '-o', 'ExitOnForwardFailure=yes',
        '-i', this.sshKey,
        '-o', `ProxyCommand=${proxyCmd}`,
        'root@colab',
      ],
      {
        stdio: ['ignore', 'ignore', 'pipe'],
        env: {
          ...process.env,
          PATH: `${path.dirname(this.colabBin)}:${process.env.PATH || ''}`,
        },
      },
    );

    this.sshChild = child;

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString().trim();
      if (text) {
        this.lastStderr = text.slice(-400);
      }
    });

    child.on('exit', (code, signal) => {
      if (this.sshChild === child) {
        this.sshChild = null;
      }
      if (this.stopped) return;
      this.state = 'reconnecting';
      this.consecutiveSpawnFailures += 1;
      const hit429 = /429|already-active-session/i.test(this.lastStderr);
      this.lastError = hit429
        ? 'Colab SSH 槽位释放中 (HTTP 429)，正在自动重试'
        : this.lastStderr || `SSH 隧道退出 (code=${code}, signal=${signal || 'none'})`;
      const delay = hit429
        ? 2500
        : Math.min(400 * Math.pow(1.6, Math.min(this.consecutiveSpawnFailures - 1, 4)), 3000);
      this._scheduleReconnect(Math.round(delay));
    });

    this._waitForSpawnReady(child);
  }

  async _waitForSpawnReady(child) {
    for (let i = 0; i < 30; i += 1) {
      if (this.stopped || this.sshChild !== child) return;
      const res = await probeUpstream(this.upstreamPort, this.probePath, 2000);
      if (this.stopped || this.sshChild !== child) return;
      if (res.ok) {
        this.state = 'connected';
        this.consecutiveProbeFailures = 0;
        this.consecutiveSpawnFailures = 0;
        this.lastProbeAt = new Date().toISOString();
        this.lastProbeMs = res.latencyMs;
        this.lastError = '';
        this._notifyReady();
        return;
      }
      await sleep(350);
    }
  }

  async _runHealthProbe() {
    if (this.stopped || !this.sshChild) return;
    if (this.state !== 'connected') return;
    const res = await probeUpstream(this.upstreamPort, this.probePath, 3500);
    if (this.stopped) return;
    if (res.ok) {
      this.consecutiveProbeFailures = 0;
      this.lastProbeAt = new Date().toISOString();
      this.lastProbeMs = res.latencyMs;
      this.lastError = '';
    } else {
      this.consecutiveProbeFailures += 1;
      this.lastError = `保活探测失败 (${this.consecutiveProbeFailures}/2): ${res.error || res.statusCode}`;
      if (this.consecutiveProbeFailures >= 2 && this.inFlightRequests === 0) {
        this.consecutiveProbeFailures = 0;
        this.kickReconnect('连续保活失败，主动重连隧道');
      }
    }
  }

  async _handleUpgrade(clientReq, clientSocket, head) {
    clientSocket.on('error', () => {});
    if (this.stopped) {
      if (!clientSocket.destroyed) clientSocket.destroy();
      return;
    }

    if (this.state !== 'connected') {
      await this.waitForReady(5000);
    }
    if (this.stopped || clientSocket.destroyed) return;

    const headerLines = [`${clientReq.method || 'GET'} ${clientReq.url || '/'} HTTP/1.1`];
    let hasHost = false;
    const raw = clientReq.rawHeaders || [];
    for (let i = 0; i < raw.length; i += 2) {
      const k = raw[i];
      const v = raw[i + 1] ?? '';
      if (k.toLowerCase() === 'host') {
        headerLines.push(`${k}: ${v || `127.0.0.1:${this.localPort}`}`);
        hasHost = true;
      } else {
        headerLines.push(`${k}: ${v}`);
      }
    }
    if (!hasHost) {
      headerLines.push(`Host: 127.0.0.1:${this.localPort}`);
    }
    const wire = `${headerLines.join('\r\n')}\r\n\r\n`;

    const upstream = net.connect({ host: '127.0.0.1', port: this.upstreamPort });
    this.activeUpgradeSockets.add(clientSocket);
    this.activeUpgradeSockets.add(upstream);
    let connected = false;
    let closed = false;

    const cleanup = () => {
      if (closed) return;
      closed = true;
      this.activeUpgradeSockets.delete(clientSocket);
      this.activeUpgradeSockets.delete(upstream);
      if (!upstream.destroyed) upstream.destroy();
      if (!clientSocket.destroyed) clientSocket.destroy();
    };

    upstream.on('connect', () => {
      connected = true;
      upstream.write(wire);
      if (head && head.length > 0) upstream.write(head);
      clientSocket.pipe(upstream);
      upstream.pipe(clientSocket);
    });

    upstream.on('error', (err) => {
      if (!connected) {
        this.kickReconnect(`WebSocket 转发失败: ${err.message}`);
        if (!clientSocket.destroyed) {
          try {
            clientSocket.end('HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\n\r\n');
          } catch {
            // Ignore write errors on closing socket
          }
        }
      }
      cleanup();
    });

    upstream.on('close', cleanup);
    clientSocket.on('error', cleanup);
    clientSocket.on('close', cleanup);
  }

  async _handleHttp(req, res) {
    if (req.method === 'GET' && req.url === '/__tunnel_health') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(this.getStatus()));
      return;
    }

    let body;
    try {
      body = await readRequestBody(req);
    } catch (err) {
      res.writeHead(413, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
      return;
    }

    const maxAttempts = 6;
    const retryDelays = [400, 800, 1200, 1800, 2500];
    this.inFlightRequests += 1;

    try {
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        if (this.state !== 'connected') {
          await this.waitForReady(5000);
        }

        const outcome = await this._forwardOnce(req, res, body);
        if (outcome.completed) return;

        if (res.headersSent) {
          if (!res.writableEnded) res.end();
          return;
        }

        this.kickReconnect(`请求转发失败 (第 ${attempt} 次): ${outcome.error}`);
        if (attempt < maxAttempts) {
          await sleep(retryDelays[attempt - 1] || 2000);
          await this.waitForReady(5000);
        } else {
          res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(
            JSON.stringify({
              error: {
                message: `Colab SSH 隧道重连失败（已自动重试 ${maxAttempts} 次）: ${outcome.error}`,
                type: 'tunnel_unavailable',
              },
            }),
          );
          return;
        }
      }
    } finally {
      this.inFlightRequests = Math.max(0, this.inFlightRequests - 1);
    }
  }

  _forwardOnce(clientReq, clientRes, body) {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (val) => {
        if (!settled) {
          settled = true;
          resolve(val);
        }
      };

      const headers = { ...clientReq.headers };
      if (!headers.host) {
        headers.host = `127.0.0.1:${this.localPort}`;
      }
      headers.connection = 'close';
      if (body.length > 0) {
        headers['content-length'] = String(body.length);
      }

      const upstreamReq = http.request(
        {
          hostname: '127.0.0.1',
          port: this.upstreamPort,
          path: clientReq.url,
          method: clientReq.method,
          headers,
          agent: false,
        },
        (upstreamRes) => {
          clientRes.writeHead(upstreamRes.statusCode || 200, upstreamRes.headers);
          upstreamRes.pipe(clientRes);
          upstreamRes.on('end', () => finish({ completed: true }));
          upstreamRes.on('close', () => finish({ completed: true }));
          upstreamRes.on('error', (err) => finish({ completed: false, error: err.message }));
        },
      );

      const headerTimer = setTimeout(() => {
        if (!clientRes.headersSent) {
          upstreamReq.destroy(new Error('upstream header timeout'));
        }
      }, 20000);

      upstreamReq.on('response', () => clearTimeout(headerTimer));
      upstreamReq.on('error', (err) => {
        clearTimeout(headerTimer);
        finish({ completed: false, error: err.message });
      });

      clientRes.on('close', () => {
        clearTimeout(headerTimer);
        if (!clientRes.writableEnded) {
          upstreamReq.destroy();
          finish({ completed: true });
        }
      });

      if (body.length > 0) upstreamReq.write(body);
      upstreamReq.end();
    });
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const getArg = (flag, fallback) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
  };

  const sessionName = getArg('--session', 'g4');
  const localPort = Number(getArg('--port', '8000'));
  const remotePort = Number(getArg('--remote-port', '8000'));
  const probePath = getArg('--probe-path', '/v1/models');
  const sshKey = getArg('--ssh-key', '');

  const proxy = new ResilientTunnelProxy({ sessionName, localPort, remotePort, probePath, sshKey });
  const shutdown = async () => {
    await proxy.stop();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  proxy.start().then((status) => {
    console.log('[colab-tunnel-proxy] started:', JSON.stringify(status));
  }).catch((err) => {
    console.error('[colab-tunnel-proxy] failed:', err.message);
    process.exit(1);
  });
}
