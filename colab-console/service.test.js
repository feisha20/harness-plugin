import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';
import {
  parseNvidiaSmiCsv,
  parseSessionsOutput,
  parseStatusOutput,
  parseUsageOutput,
  parseWhoamiOutput,
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
    await new Promise((resolve) => mockUpstream.close(resolve));
  }
});
