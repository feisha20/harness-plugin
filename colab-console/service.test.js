import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseNvidiaSmiCsv,
  parseSessionsOutput,
  parseStatusOutput,
  parseUsageOutput,
  parseWhoamiOutput,
} from './service.js';

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
