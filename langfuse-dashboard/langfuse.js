const DEFAULT_FIELDS = 'core,basic,time,io,metadata,model,usage,prompt';
const REQUEST_TIMEOUT_MS = 25000;
const MAX_CURSOR_PAGES = 15;
const MAX_COMPLETE_TRACES = 15;

function makeAuthHeader(env) {
  const token = Buffer.from(`${env.publicKey}:${env.secretKey}`, 'utf8').toString('base64');
  return `Basic ${token}`;
}

function safeJsonParse(value) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  if (!(trimmed.startsWith('{') || trimmed.startsWith('[') || trimmed.startsWith('"'))) {
    return value;
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

async function langfuseGet(env, endpoint, params = {}) {
  const base = String(env.baseUrl || '').replace(/\/+$/, '');
  const url = new URL(`${base}${endpoint}`);
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== '') {
      url.searchParams.set(key, String(val));
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: makeAuthHeader(env),
        Accept: 'application/json',
      },
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
      const msg = json?.message || json?.error || text.slice(0, 240) || `HTTP ${res.status}`;
      if (res.status === 401 || res.status === 403) {
        throw new Error(`Langfuse 认证失败 (HTTP ${res.status})：请检查 Public Key 与 Secret Key 是否匹配`);
      }
      throw new Error(`Langfuse 接口返回错误 (HTTP ${res.status}): ${msg}`);
    }
    return json;
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error(`请求 Langfuse 超时 (${REQUEST_TIMEOUT_MS / 1000}s)：${base}`);
    }
    if (err?.cause?.code === 'ECONNREFUSED' || err?.cause?.code === 'ENOTFOUND' || err?.cause?.code === 'EHOSTUNREACH') {
      throw new Error(`无法连接到 Langfuse (${base})：${err.cause.code}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function testConnection(env) {
  const started = Date.now();
  const result = await langfuseGet(env, '/api/public/projects');
  const latencyMs = Date.now() - started;
  const projects = Array.isArray(result?.data) ? result.data : [];
  const primary = projects[0] || null;
  return {
    ok: true,
    latencyMs,
    projects: projects.map((p) => ({
      id: p.id || '',
      name: p.name || '',
      orgName: p.organization?.name || '',
      retentionDays: p.retentionDays ?? null,
    })),
    projectId: primary?.id || '',
    projectName: primary?.name || '',
    orgName: primary?.organization?.name || '',
  };
}

export async function fetchObservations(env, params = {}, options = {}) {
  const maxPages = Math.min(Number(options.maxPages || MAX_CURSOR_PAGES), 50);
  const limit = Math.min(Number(options.limit || 100), 100);
  const all = [];
  let cursor = options.cursor || '';
  const seenCursors = new Set();
  let truncated = false;

  for (let page = 0; page < maxPages; page += 1) {
    const queryParams = {
      fields: options.fields || DEFAULT_FIELDS,
      limit,
      ...params,
    };
    if (cursor) queryParams.cursor = cursor;

    const res = await langfuseGet(env, '/api/public/v2/observations', queryParams);
    const items = Array.isArray(res?.data) ? res.data : [];
    all.push(...items);

    const nextCursor = res?.meta?.cursor || '';
    if (!nextCursor || items.length === 0) {
      cursor = '';
      break;
    }
    if (seenCursors.has(nextCursor)) {
      cursor = '';
      break;
    }
    seenCursors.add(nextCursor);
    cursor = nextCursor;
    if (page === maxPages - 1) {
      truncated = true;
    }
  }

  return {
    observations: all,
    nextCursor: cursor || null,
    truncated,
  };
}

function buildRunIdFilter(runId) {
  return JSON.stringify([
    {
      type: 'stringObject',
      key: 'run_id',
      operator: '=',
      value: runId,
      column: 'metadata',
    },
  ]);
}

function normalizeTimeParam(val) {
  if (!val) return '';
  const s = String(val).trim();
  if (!s) return '';
  if (/[Zz]|[+-]\d{2}:?\d{2}$/.test(s)) return s;
  const parsed = Date.parse(s);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : s;
}

function extractTextFromParts(parts) {
  if (!Array.isArray(parts)) {
    return typeof parts === 'string' ? parts : '';
  }
  const chunks = [];
  for (const part of parts) {
    if (!part) continue;
    if (typeof part === 'string') {
      chunks.push(part);
    } else if (part.type === 'text' && typeof part.content === 'string') {
      chunks.push(part.content);
    } else if (typeof part.text === 'string') {
      chunks.push(part.text);
    }
  }
  return chunks.join('\n').trim();
}

function normalizeMessage(msg) {
  if (!msg || typeof msg !== 'object') {
    return { role: 'unknown', text: String(msg ?? ''), reasoning: '', toolCalls: [], rawParts: [] };
  }
  const role = msg.role || 'unknown';
  const parts = Array.isArray(msg.parts)
    ? msg.parts
    : (typeof msg.content === 'string'
        ? [{ type: 'text', content: msg.content }]
        : (Array.isArray(msg.content) ? msg.content : []));

  const texts = [];
  const reasonings = [];
  const toolCalls = [];
  const toolResponses = [];

  for (const part of parts) {
    if (!part) continue;
    if (typeof part === 'string') {
      texts.push(part);
      continue;
    }
    const pType = part.type || '';
    if (pType === 'reasoning' || pType === 'thinking') {
      if (part.content || part.thinking) reasonings.push(part.content || part.thinking);
    } else if (pType === 'tool_call' || pType === 'call') {
      toolCalls.push({
        id: part.id || part.call_id || '',
        name: part.name || part.function?.name || 'tool',
        arguments: safeJsonParse(part.arguments ?? part.input ?? part.function?.arguments ?? null),
      });
    } else if (pType === 'tool_call_response' || pType === 'tool_result') {
      toolResponses.push({
        id: part.id || part.call_id || '',
        name: part.name || '',
        response: safeJsonParse(part.response ?? part.result ?? part.output ?? part.content ?? null),
      });
    } else if (typeof part.content === 'string') {
      texts.push(part.content);
    } else if (typeof part.text === 'string') {
      texts.push(part.text);
    } else if (part.content !== undefined) {
      texts.push(JSON.stringify(part.content, null, 2));
    }
  }

  if (Array.isArray(msg.tool_calls)) {
    for (const tc of msg.tool_calls) {
      toolCalls.push({
        id: tc.id || '',
        name: tc.function?.name || tc.name || 'tool',
        arguments: safeJsonParse(tc.function?.arguments ?? tc.arguments ?? null),
      });
    }
  }

  return {
    role,
    name: msg.name || '',
    finishReason: msg.finish_reason || '',
    text: texts.join('\n').trim(),
    reasoning: reasonings.join('\n').trim(),
    toolCalls,
    toolResponses,
    rawParts: parts,
  };
}

function parseObservationIO(obs) {
  const input = safeJsonParse(obs.input);
  const output = safeJsonParse(obs.output);
  return { input, output };
}

function extractUserInputPreview(obsList) {
  const rootAgent = obsList.find((o) => o.type === 'AGENT' && !o.parentObservationId)
    || obsList.find((o) => o.type === 'AGENT');

  if (rootAgent) {
    const { input } = parseObservationIO(rootAgent);
    if (Array.isArray(input)) {
      const userMsgs = input.map(normalizeMessage).filter((m) => m.role === 'user' && m.text);
      const lastUser = userMsgs[userMsgs.length - 1];
      if (lastUser?.text) return lastUser.text;
    } else if (typeof input === 'string' && input.trim()) {
      return input.trim();
    } else if (input && typeof input === 'object') {
      if (typeof input.content === 'string') return input.content;
      if (typeof input.query === 'string') return input.query;
      if (Array.isArray(input.messages)) {
        const u = input.messages.map(normalizeMessage).filter((m) => m.role === 'user' && m.text);
        if (u.length) return u[u.length - 1].text;
      }
    }
  }

  const firstGen = obsList.find((o) => o.type === 'GENERATION');
  if (firstGen) {
    const { input } = parseObservationIO(firstGen);
    const msgs = Array.isArray(input?.messages) ? input.messages : (Array.isArray(input) ? input : []);
    const userMsgs = msgs.map(normalizeMessage).filter((m) => m.role === 'user' && m.text);
    if (userMsgs.length) return userMsgs[userMsgs.length - 1].text;
  }

  return '';
}

function extractFinalOutputPreview(obsList) {
  const rootAgent = obsList.find((o) => o.type === 'AGENT' && !o.parentObservationId)
    || obsList.find((o) => o.type === 'AGENT');

  if (rootAgent) {
    const { output } = parseObservationIO(rootAgent);
    if (Array.isArray(output)) {
      const texts = output.map(normalizeMessage).map((m) => m.text).filter(Boolean);
      if (texts.length) return texts.join('\n').trim();
    } else if (typeof output === 'string' && output.trim()) {
      return output.trim();
    } else if (output && typeof output === 'object') {
      const norm = normalizeMessage(output);
      if (norm.text) return norm.text;
    }
  }

  const gens = obsList.filter((o) => o.type === 'GENERATION');
  for (let i = gens.length - 1; i >= 0; i -= 1) {
    const { output } = parseObservationIO(gens[i]);
    const list = Array.isArray(output) ? output : (output ? [output] : []);
    const texts = list.map(normalizeMessage).map((m) => m.text).filter(Boolean);
    if (texts.length) return texts.join('\n').trim();
  }

  return '';
}

function unwrapToolOutput(rawOutput) {
  const parsed = safeJsonParse(rawOutput);
  if (Array.isArray(parsed)) {
    return parsed.map((item) => {
      if (item && typeof item === 'object' && typeof item.text === 'string') {
        const inner = safeJsonParse(item.text);
        return typeof inner === 'object' ? { ...item, parsedText: inner } : item;
      }
      return item;
    });
  }
  return parsed;
}

function isNoiseSpan(obs) {
  if (obs.type !== 'SPAN') return false;
  if (obs.level === 'ERROR' || obs.level === 'WARNING') return false;
  if (obs.statusMessage && String(obs.statusMessage).trim()) return false;
  const name = String(obs.name || '').toLowerCase();
  return name.startsWith('format ') || name === 'format';
}

function isSideTraceName(name) {
  const lower = String(name || '').toLowerCase();
  if (!lower) return false;
  if (lower.includes('followup')) return true;
  if (lower.includes('summary') || lower.includes('compress') || lower.includes('memory')) return true;
  return false;
}

function getObsLatencyMs(obs) {
  if (typeof obs.latency === 'number' && Number.isFinite(obs.latency)) {
    return Math.round(obs.latency * 1000);
  }
  const s = Date.parse(obs.startTime || '');
  const e = Date.parse(obs.endTime || '');
  if (Number.isFinite(s) && Number.isFinite(e)) return Math.max(0, e - s);
  return 0;
}

function sanitizeObservation(obs, traceStartMs, traceDurationMs) {
  const { input, output } = parseObservationIO(obs);
  const startMs = Date.parse(obs.startTime || '');
  const endMs = Date.parse(obs.endTime || '');
  const latencyMs = getObsLatencyMs(obs);
  const offsetMs = Number.isFinite(startMs) && Number.isFinite(traceStartMs)
    ? Math.max(0, startMs - traceStartMs)
    : 0;
  const denom = Math.max(traceDurationMs || 1, 1);
  const pctOffset = Math.min(100, Math.max(0, (offsetMs / denom) * 100));
  const pctWidth = Math.min(100 - pctOffset, Math.max(1.5, (latencyMs / denom) * 100));

  const metadata = obs.metadata && typeof obs.metadata === 'object' ? obs.metadata : {};
  const usage = obs.usageDetails && typeof obs.usageDetails === 'object' ? obs.usageDetails : {};

  return {
    id: obs.id,
    traceId: obs.traceId,
    parentObservationId: obs.parentObservationId || null,
    type: obs.type || 'SPAN',
    name: obs.name || 'unnamed',
    startTime: obs.startTime || '',
    endTime: obs.endTime || '',
    startMs: Number.isFinite(startMs) ? startMs : 0,
    endMs: Number.isFinite(endMs) ? endMs : 0,
    latencyMs,
    ttftMs: typeof obs.timeToFirstToken === 'number' ? Math.round(obs.timeToFirstToken * 1000) : null,
    offsetMs,
    pctOffset,
    pctWidth,
    level: obs.level || 'DEFAULT',
    statusMessage: obs.statusMessage || '',
    isRootObservation: Boolean(obs.isRootObservation),
    isNoise: isNoiseSpan(obs),
    model: obs.model || obs.providedModelName || metadata['attributes.gen_ai.request.model'] || '',
    sessionId: obs.sessionId || metadata['attributes.langfuse.session.id'] || '',
    userId: obs.userId ?? metadata['attributes.langfuse.user.id'] ?? '',
    runId: metadata.run_id || metadata['attributes.langfuse.metadata.run_id'] || '',
    agentCode: metadata.agent_code || metadata['attributes.langfuse.metadata.agent_code'] || '',
    compId: metadata.comp_id ?? metadata['attributes.langfuse.metadata.comp_id'] ?? null,
    agentId: metadata.agent_id ?? metadata['attributes.langfuse.metadata.agent_id'] ?? null,
    scopeVersion: metadata['scope.version'] || '',
    finishReasons: metadata['attributes.gen_ai.response.finish_reasons'] || null,
    toolCallId: metadata['attributes.gen_ai.tool.call.id'] || '',
    promptName: obs.promptName || '',
    promptVersion: obs.promptVersion ?? null,
    usage: {
      input: Number(usage.input || 0),
      cached: Number(usage.input_cached_tokens || 0),
      cacheCreation: Number(usage.input_cache_creation || 0),
      output: Number(usage.output || 0),
      reasoning: Number(usage.output_reasoning_tokens || 0),
      total: Number(usage.total || 0),
    },
    totalCost: typeof obs.totalCost === 'number' ? obs.totalCost : (typeof obs.totalPrice === 'number' ? obs.totalPrice : null),
    input,
    output: obs.type === 'TOOL' ? unwrapToolOutput(output) : output,
    rawOutput: output,
    metadata,
  };
}

function buildExecutionFlow(sortedObs) {
  const flow = [];
  let prevMsgCount = 0;

  for (const obs of sortedObs) {
    if (obs.type === 'AGENT') {
      const inpMsgs = Array.isArray(obs.input)
        ? obs.input.map(normalizeMessage)
        : (Array.isArray(obs.input?.messages) ? obs.input.messages.map(normalizeMessage) : []);
      const userText = inpMsgs.filter((m) => m.role === 'user').map((m) => m.text).filter(Boolean).join('\n');
      flow.push({
        id: `${obs.id}:start`,
        obsId: obs.id,
        kind: 'user_input',
        title: obs.name || '用户输入',
        startTime: obs.startTime,
        text: userText || (typeof obs.input === 'string' ? obs.input : JSON.stringify(obs.input, null, 2)),
      });
      continue;
    }

    if (obs.type === 'GENERATION') {
      const inp = obs.input && typeof obs.input === 'object' ? obs.input : {};
      const allMsgs = Array.isArray(inp.messages)
        ? inp.messages.map(normalizeMessage)
        : (Array.isArray(obs.input) ? obs.input.map(normalizeMessage) : []);
      const systemMsgs = allMsgs.filter((m) => m.role === 'system');
      const nonSystemMsgs = allMsgs.filter((m) => m.role !== 'system');
      const tools = Array.isArray(inp.tools) ? inp.tools : [];

      // Show only newly added messages since the previous GENERATION step so long histories aren't repeated
      const deltaMessages = prevMsgCount === 0
        ? nonSystemMsgs
        : nonSystemMsgs.slice(Math.min(prevMsgCount, nonSystemMsgs.length));
      if (nonSystemMsgs.length > prevMsgCount) {
        prevMsgCount = nonSystemMsgs.length;
      }

      const outList = Array.isArray(obs.output) ? obs.output : (obs.output ? [obs.output] : []);
      const outputs = outList.map(normalizeMessage);

      flow.push({
        id: obs.id,
        obsId: obs.id,
        kind: 'llm_step',
        title: obs.name || `chat ${obs.model || 'LLM'}`,
        model: obs.model,
        startTime: obs.startTime,
        endTime: obs.endTime,
        latencyMs: obs.latencyMs,
        ttftMs: obs.ttftMs,
        level: obs.level,
        statusMessage: obs.statusMessage,
        usage: obs.usage,
        finishReasons: obs.finishReasons || outputs.map((o) => o.finishReason).filter(Boolean),
        systemPrompt: systemMsgs.map((m) => m.text).filter(Boolean).join('\n\n'),
        toolDefinitions: tools.map((t) => ({
          name: t?.function?.name || t?.name || 'tool',
          description: t?.function?.description || t?.description || '',
        })),
        historyCount: nonSystemMsgs.length,
        deltaMessages,
        outputs,
      });
      continue;
    }

    if (obs.type === 'TOOL') {
      flow.push({
        id: obs.id,
        obsId: obs.id,
        kind: 'tool_step',
        title: obs.name || 'tool',
        toolCallId: obs.toolCallId,
        startTime: obs.startTime,
        endTime: obs.endTime,
        latencyMs: obs.latencyMs,
        level: obs.level,
        statusMessage: obs.statusMessage,
        input: obs.input,
        output: obs.output,
      });
      continue;
    }

    flow.push({
      id: obs.id,
      obsId: obs.id,
      kind: 'span_step',
      obsType: obs.type,
      isNoise: obs.isNoise,
      title: obs.name || obs.type,
      startTime: obs.startTime,
      endTime: obs.endTime,
      latencyMs: obs.latencyMs,
      level: obs.level,
      statusMessage: obs.statusMessage,
      input: obs.input,
      output: obs.output,
    });
  }

  const rootAgent = sortedObs.find((o) => o.type === 'AGENT' && !o.parentObservationId)
    || sortedObs.find((o) => o.type === 'AGENT');
  if (rootAgent && rootAgent.output) {
    const outList = Array.isArray(rootAgent.output) ? rootAgent.output : [rootAgent.output];
    const outputs = outList.map(normalizeMessage);
    const hasContent = outputs.some((o) => o.text || o.reasoning || o.toolCalls.length);
    if (hasContent) {
      flow.push({
        id: `${rootAgent.id}:end`,
        obsId: rootAgent.id,
        kind: 'agent_output',
        title: `${rootAgent.name || 'Agent'} 最终输出`,
        startTime: rootAgent.endTime || rootAgent.startTime,
        latencyMs: rootAgent.latencyMs,
        level: rootAgent.level,
        statusMessage: rootAgent.statusMessage,
        outputs,
      });
    }
  }

  return flow;
}

export function buildTraceModel(traceId, rawObservations, env) {
  const sortedRaw = [...rawObservations].sort((a, b) => {
    const ta = Date.parse(a.startTime || '') || 0;
    const tb = Date.parse(b.startTime || '') || 0;
    if (ta !== tb) return ta - tb;
    if (!a.parentObservationId && b.parentObservationId) return -1;
    if (a.parentObservationId && !b.parentObservationId) return 1;
    return String(a.id).localeCompare(String(b.id));
  });

  const startTimes = sortedRaw.map((o) => Date.parse(o.startTime || '')).filter(Number.isFinite);
  const endTimes = sortedRaw.map((o) => Date.parse(o.endTime || o.startTime || '')).filter(Number.isFinite);
  const traceStartMs = startTimes.length ? Math.min(...startTimes) : 0;
  const traceEndMs = endTimes.length ? Math.max(...endTimes) : traceStartMs;
  const traceDurationMs = Math.max(0, traceEndMs - traceStartMs);

  const observations = sortedRaw.map((o) => sanitizeObservation(o, traceStartMs, traceDurationMs));

  const rootAgent = observations.find((o) => o.type === 'AGENT' && !o.parentObservationId)
    || observations.find((o) => o.type === 'AGENT')
    || observations.find((o) => !o.parentObservationId)
    || observations[0];

  const firstWithMeta = (getter) => observations.map(getter).find((v) => v !== '' && v !== null && v !== undefined);

  const sessionId = firstWithMeta((o) => o.sessionId) || '';
  const runId = firstWithMeta((o) => o.runId) || '';
  const userId = firstWithMeta((o) => o.userId) ?? '';
  const agentCode = firstWithMeta((o) => o.agentCode) || '';
  const compId = firstWithMeta((o) => o.compId) ?? null;
  const agentId = firstWithMeta((o) => o.agentId) ?? null;
  const scopeVersion = firstWithMeta((o) => o.scopeVersion) || '';

  const counts = {
    total: observations.length,
    agent: 0,
    generation: 0,
    tool: 0,
    span: 0,
    noiseSpan: 0,
    error: 0,
    warning: 0,
  };
  const usage = {
    input: 0,
    cached: 0,
    cacheCreation: 0,
    output: 0,
    reasoning: 0,
    total: 0,
    totalCost: 0,
  };
  const models = new Set();

  for (const o of observations) {
    if (o.type === 'AGENT') counts.agent += 1;
    else if (o.type === 'GENERATION') counts.generation += 1;
    else if (o.type === 'TOOL') counts.tool += 1;
    else counts.span += 1;
    if (o.isNoise) counts.noiseSpan += 1;
    if (o.level === 'ERROR') counts.error += 1;
    if (o.level === 'WARNING') counts.warning += 1;
    if (o.model) models.add(o.model);
    usage.input += o.usage.input;
    usage.cached += o.usage.cached;
    usage.cacheCreation += o.usage.cacheCreation;
    usage.output += o.usage.output;
    usage.reasoning += o.usage.reasoning;
    usage.total += o.usage.total;
    if (typeof o.totalCost === 'number') usage.totalCost += o.totalCost;
  }

  const title = rootAgent?.name || `Trace ${traceId.slice(0, 8)}`;
  const isMainAgent = Boolean(rootAgent?.type === 'AGENT' && /^invoke_agent\b/i.test(title) && !isSideTraceName(title));
  const isSideTrace = !isMainAgent;

  const userPrompt = extractUserInputPreview(sortedRaw);
  const finalOutput = extractFinalOutputPreview(sortedRaw);
  const flow = buildExecutionFlow(observations);

  const base = String(env?.baseUrl || '').replace(/\/+$/, '');
  const langfuseUrl = base && env?.projectId
    ? `${base}/project/${encodeURIComponent(env.projectId)}/traces?traceId=${encodeURIComponent(traceId)}`
    : (base ? `${base}` : '');

  return {
    traceId,
    title,
    isSideTrace,
    startTime: traceStartMs ? new Date(traceStartMs).toISOString() : (rootAgent?.startTime || ''),
    endTime: traceEndMs ? new Date(traceEndMs).toISOString() : (rootAgent?.endTime || ''),
    durationMs: rootAgent?.latencyMs || traceDurationMs,
    sessionId,
    runId,
    userId,
    agentCode,
    compId,
    agentId,
    scopeVersion,
    models: [...models],
    hasError: counts.error > 0 || observations.some((o) => o.level === 'ERROR'),
    hasWarning: counts.warning > 0,
    counts,
    usage,
    userPrompt,
    finalOutput,
    langfuseUrl,
    observations,
    flow,
  };
}

export async function queryTraces(env, opts = {}) {
  const started = Date.now();
  const rawQuery = String(opts.query || '').trim();
  let mode = opts.mode || 'auto';
  const fromStartTime = normalizeTimeParam(opts.fromStartTime);
  const toStartTime = normalizeTimeParam(opts.toStartTime);

  if (!rawQuery && mode !== 'recent') {
    throw new Error('请输入 Session ID、Run ID 或 Trace ID');
  }

  const timeParams = {};
  if (fromStartTime) timeParams.fromStartTime = fromStartTime;
  if (toStartTime) timeParams.toStartTime = toStartTime;

  let observations = [];
  let resolvedMode = mode;
  let truncated = false;

  if (mode === 'recent') {
    const agentRes = await fetchObservations(
      env,
      { type: 'AGENT', ...timeParams },
      { maxPages: 1, limit: 20, fields: 'core,basic,time,io,metadata,model,usage' },
    );
    if (agentRes.observations.length > 0) {
      observations = agentRes.observations;
      truncated = agentRes.truncated;
    } else {
      const res = await fetchObservations(
        env,
        { ...timeParams },
        { maxPages: 1, limit: 50, fields: 'core,basic,time,metadata,model,usage' },
      );
      observations = res.observations;
      truncated = res.truncated;
    }
    resolvedMode = 'recent';
  } else if (mode === 'run_id') {
    const res = await fetchObservations(env, { filter: buildRunIdFilter(rawQuery), ...timeParams }, { maxPages: 5 });
    observations = res.observations;
    truncated = res.truncated;
    resolvedMode = 'run_id';
  } else if (mode === 'session_id') {
    const res = await fetchObservations(env, { sessionId: rawQuery, ...timeParams }, { maxPages: 10 });
    observations = res.observations;
    truncated = res.truncated;
    resolvedMode = 'session_id';
  } else if (mode === 'trace_id') {
    const res = await fetchObservations(env, { traceId: rawQuery, ...timeParams }, { maxPages: 5 });
    observations = res.observations;
    truncated = res.truncated;
    resolvedMode = 'trace_id';
  } else {
    // Auto-detection:
    // 32-char hex strings in KuaiBuddy/AgentScope can be either run_id or traceId
    const looksLikeHex32 = /^[0-9a-f]{32}$/i.test(rawQuery);
    if (looksLikeHex32) {
      const [byRun, byTrace] = await Promise.all([
        fetchObservations(env, { filter: buildRunIdFilter(rawQuery), ...timeParams }, { maxPages: 4 }),
        fetchObservations(env, { traceId: rawQuery, ...timeParams }, { maxPages: 4 }),
      ]);
      if (byRun.observations.length > 0) {
        observations = byRun.observations;
        truncated = byRun.truncated;
        resolvedMode = 'run_id';
      } else if (byTrace.observations.length > 0) {
        observations = byTrace.observations;
        truncated = byTrace.truncated;
        resolvedMode = 'trace_id';
      } else {
        const bySession = await fetchObservations(env, { sessionId: rawQuery, ...timeParams }, { maxPages: 5 });
        observations = bySession.observations;
        truncated = bySession.truncated;
        resolvedMode = 'session_id';
      }
    } else {
      const bySession = await fetchObservations(env, { sessionId: rawQuery, ...timeParams }, { maxPages: 10 });
      if (bySession.observations.length > 0) {
        observations = bySession.observations;
        truncated = bySession.truncated;
        resolvedMode = 'session_id';
      } else {
        const byRun = await fetchObservations(env, { filter: buildRunIdFilter(rawQuery), ...timeParams }, { maxPages: 4 });
        observations = byRun.observations;
        truncated = byRun.truncated;
        resolvedMode = byRun.observations.length > 0 ? 'run_id' : 'session_id';
      }
    }
  }

  // Group by traceId
  const groups = new Map();
  for (const obs of observations) {
    const tid = obs.traceId || 'unknown';
    if (!groups.has(tid)) groups.set(tid, []);
    groups.get(tid).push(obs);
  }

  // For run_id queries, backfill full observations per traceId so the tree & parent nodes are complete.
  // For recent queries, only backfill the newest trace upfront; others load on click in the UI.
  const partialTraceIds = new Set();
  if (resolvedMode === 'run_id' && groups.size > 0) {
    const traceIds = [...groups.keys()].slice(0, MAX_COMPLETE_TRACES);
    await Promise.all(
      traceIds.map(async (tid) => {
        try {
          const full = await fetchObservations(env, { traceId: tid }, { maxPages: 4 });
          if (full.observations.length >= groups.get(tid).length) {
            groups.set(tid, full.observations);
          }
        } catch {
          // Keep partial observations if backfill fails
        }
      }),
    );
  } else if (resolvedMode === 'recent' && groups.size > 0) {
    const orderedIds = [...groups.entries()]
      .sort((a, b) => {
        const ta = Math.max(...a[1].map((o) => Date.parse(o.startTime || '') || 0));
        const tb = Math.max(...b[1].map((o) => Date.parse(o.startTime || '') || 0));
        return tb - ta;
      })
      .map(([tid]) => tid);
    const firstId = orderedIds[0];
    for (const tid of orderedIds.slice(1)) {
      partialTraceIds.add(tid);
    }
    if (firstId) {
      try {
        const full = await fetchObservations(env, { traceId: firstId }, { maxPages: 3 });
        if (full.observations.length >= groups.get(firstId).length) {
          groups.set(firstId, full.observations);
        }
      } catch {
        partialTraceIds.add(firstId);
      }
    }
  }

  const traces = [];
  for (const [tid, list] of groups.entries()) {
    const model = buildTraceModel(tid, list, env);
    model.isSummaryOnly = partialTraceIds.has(tid);
    traces.push(model);
  }

  // Sort chronological for session queries (newest-first for recent)
  traces.sort((a, b) => {
    const ta = Date.parse(a.startTime || '') || 0;
    const tb = Date.parse(b.startTime || '') || 0;
    return resolvedMode === 'recent' ? tb - ta : ta - tb;
  });

  return {
    query: rawQuery,
    mode,
    resolvedMode,
    durationMs: Date.now() - started,
    totalObservations: traces.reduce((acc, t) => acc + t.observations.length, 0),
    truncated,
    traces,
  };
}

export async function fetchSingleTrace(env, traceId) {
  const started = Date.now();
  const cleanId = String(traceId || '').trim();
  if (!cleanId) throw new Error('traceId 不能为空');
  const res = await fetchObservations(env, { traceId: cleanId }, { maxPages: 6 });
  if (res.observations.length === 0) {
    throw new Error(`未找到 traceId=${cleanId} 的观测数据`);
  }
  return {
    durationMs: Date.now() - started,
    trace: buildTraceModel(cleanId, res.observations, env),
  };
}

export function formatTraceSummaryForAgent(trace) {
  return {
    traceId: trace.traceId,
    title: trace.title,
    isSideTrace: trace.isSideTrace,
    startTime: trace.startTime,
    endTime: trace.endTime,
    durationMs: trace.durationMs,
    sessionId: trace.sessionId,
    runId: trace.runId,
    agentCode: trace.agentCode,
    compId: trace.compId,
    agentId: trace.agentId,
    models: trace.models,
    hasError: trace.hasError,
    counts: trace.counts,
    usage: trace.usage,
    userPrompt: trace.userPrompt,
    finalOutput: trace.finalOutput,
    langfuseUrl: trace.langfuseUrl,
    steps: trace.flow.map((step) => {
      if (step.kind === 'llm_step') {
        return {
          kind: step.kind,
          title: step.title,
          model: step.model,
          latencyMs: step.latencyMs,
          level: step.level,
          statusMessage: step.statusMessage,
          finishReasons: step.finishReasons,
          usage: step.usage,
          outputs: step.outputs.map((o) => ({
            text: o.text,
            reasoning: o.reasoning,
            toolCalls: o.toolCalls,
          })),
        };
      }
      if (step.kind === 'tool_step') {
        return {
          kind: step.kind,
          title: step.title,
          latencyMs: step.latencyMs,
          level: step.level,
          statusMessage: step.statusMessage,
          input: step.input,
          output: step.output,
        };
      }
      return {
        kind: step.kind,
        title: step.title,
        text: step.text,
        level: step.level,
        statusMessage: step.statusMessage,
      };
    }),
  };
}
