export function isNoiseSession(session) {
  const title = (session.title || '').trim();
  if (!title) return true;
  // Automated shell commands / probes
  if (/^(cat >|python|ls |cd |rm |echo |curl |export |\/tmp|head |wc |grep |find )/i.test(title)) {
    return true;
  }
  // Trivial echoes
  if (/^(ping|test|pong|1|ok)$/i.test(title)) {
    return true;
  }
  return false;
}

export function scoreAndCategorizeSession(session, messages) {
  const userMsgs = messages.filter(m => m.role === 'user');
  const assistantMsgs = messages.filter(m => m.role === 'assistant');
  const toolMsgs = messages.filter(m => m.role === 'tool' || m.toolName);
  const reasoningMsgs = messages.filter(m => m.role === 'reasoning');

  if (userMsgs.length === 0) {
    return null;
  }

  const primaryPrompt = userMsgs[0].content.trim();
  if (!primaryPrompt || primaryPrompt.length < 3) {
    return null;
  }

  // Filter greeting-only
  if (/^(你好|在吗|您好|hi|hello|在不在)$/i.test(primaryPrompt)) {
    return null;
  }

  let score = 20; // baseline for valid prompt
  const reasons = [];

  // 1. User Prompt Quality (0 - 30)
  if (primaryPrompt.length >= 12) score += 10;
  if (primaryPrompt.length >= 25) score += 5;

  const domainEntities = [
    '渠道', '分配', '坐席', '客服', '规则', '小红书', '抖音', '快手', '微信', '美团', '百度',
    '唤醒', '排班', '获联', '报联', '线索', '工号', '在线', '优先级', '进线', '手动接待'
  ];
  const matchedEntities = domainEntities.filter(e => primaryPrompt.includes(e));
  if (matchedEntities.length > 0) {
    score += Math.min(15, matchedEntities.length * 5);
    reasons.push(`包含关键业务实体: ${matchedEntities.slice(0, 3).join('、')}`);
  }

  // 2. Interaction & Tool Complexity (0 - 35)
  if (toolMsgs.length > 0) {
    score += 20;
    const uniqueTools = [...new Set(toolMsgs.map(t => t.toolName).filter(Boolean))];
    if (uniqueTools.length > 1) {
      score += 10;
      reasons.push(`调用多工具链 (${uniqueTools.join(', ')})`);
    } else {
      reasons.push(`包含工具调用 (${uniqueTools[0] || toolMsgs.length + '次'})`);
    }
  }

  if (userMsgs.length >= 2) {
    score += 10;
    reasons.push(`多轮交互对话 (${userMsgs.length} 轮提问)`);
  }

  if (reasoningMsgs.length > 0) {
    score += 5;
    reasons.push('包含模型深度思考推理链 (CoT)');
  }

  // 3. Assistant Answer Quality (0 - 25)
  const lastAssistant = assistantMsgs[assistantMsgs.length - 1];
  const answerContent = lastAssistant?.content || '';

  if (answerContent.length >= 100) {
    score += 10;
  }
  if (answerContent.length >= 300) {
    score += 5;
  }

  if (/[#*-]|\d\)/.test(answerContent)) {
    score += 5;
    reasons.push('提供结构化诊断/操作指导结论');
  }

  score = Math.min(100, Math.max(0, score));

  // Determine Category
  let category = '综合问答';
  if (/未分配|异常|失败|为什么|未按规则|没分给|只能手动|分错|排查|查不出/.test(primaryPrompt)) {
    category = '异常排障与诊断';
  } else if (/怎么设置|如何配置|唤醒规则|自动分配|操作步骤|排班|怎么配|如何配/.test(primaryPrompt)) {
    category = '配置与操作指导';
  } else if (/区别|什么是|定义|标准|规范|含义|解释/.test(primaryPrompt)) {
    category = '业务概念与规则';
  } else if (toolMsgs.length > 0) {
    category = '工具调用评测';
  } else if (userMsgs.length >= 2) {
    category = '多轮对话评测';
  }

  const toolNames = [...new Set(toolMsgs.map(t => t.toolName).filter(Boolean))];

  return {
    id: `eval_${session.sessionId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(-24)}`,
    sessionId: session.sessionId,
    title: session.title || primaryPrompt.slice(0, 30),
    category,
    valueScore: score,
    valueReasons: reasons,
    userPrompt: primaryPrompt,
    referenceAnswer: answerContent,
    turnsCount: userMsgs.length,
    toolCallsCount: toolMsgs.length,
    toolNames,
    hasReasoning: reasoningMsgs.length > 0,
    modelId: session.modelId || 'MiniMax-M3.1-Flash',
    createdAt: session.createdAt,
    messages
  };
}

export function extractEvaluationDataset(sessions, messagesMap, minScore = 60) {
  const validSessions = sessions.filter(s => !isNoiseSession(s));
  const rawCases = [];

  for (const session of validSessions) {
    const msgs = messagesMap.get(session.sessionId) || [];
    if (msgs.length === 0) continue;
    const evaluated = scoreAndCategorizeSession(session, msgs);
    if (evaluated && evaluated.valueScore >= minScore) {
      rawCases.push(evaluated);
    }
  }

  // Deduplicate near-identical cases (e.g. repeated test runs of same scenario)
  const grouped = new Map();
  for (const item of rawCases) {
    // Key by simplified prompt
    const key = item.userPrompt.slice(0, 40).trim();
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(item);
  }

  const finalCases = [];
  for (const [, group] of grouped) {
    // Pick the one with highest value score and longest answer
    group.sort((a, b) => b.valueScore - a.valueScore || b.referenceAnswer.length - a.referenceAnswer.length);
    const best = { ...group[0] };
    if (group.length > 1) {
      best.sampleRepetitions = group.length;
      best.valueReasons.push(`同场景高频样本 (昨日出现 ${group.length} 次)`);
    }
    finalCases.push(best);
  }

  // Sort by score descending
  finalCases.sort((a, b) => b.valueScore - a.valueScore);

  const categoryBreakdown = {};
  let totalScore = 0;
  for (const c of finalCases) {
    categoryBreakdown[c.category] = (categoryBreakdown[c.category] || 0) + 1;
    totalScore += c.valueScore;
  }

  return {
    summary: {
      totalRawSessions: sessions.length,
      noiseFilteredOut: sessions.length - validSessions.length,
      evaluatedCandidates: validSessions.length,
      extractedCount: finalCases.length,
      withToolCallsCount: finalCases.filter(c => c.toolCallsCount > 0).length,
      avgScore: finalCases.length ? Math.round(totalScore / finalCases.length) : 0,
      categoryBreakdown
    },
    cases: finalCases
  };
}

export function exportFormat(cases, format = 'json') {
  if (format === 'jsonl') {
    return cases.map(c => JSON.stringify({
      id: c.id,
      prompt: c.userPrompt,
      reference_answer: c.referenceAnswer,
      category: c.category,
      score: c.valueScore,
      tools: c.toolNames,
      turns: c.turnsCount,
      messages: c.messages
    })).join('\n');
  }

  if (format === 'alpaca') {
    const alpacaData = cases.map(c => ({
      instruction: c.userPrompt,
      input: c.turnsCount > 1 ? c.messages.slice(0, -1).map(m => `${m.role}: ${m.content}`).join('\n') : '',
      output: c.referenceAnswer,
      system: '你是一个智能客服与业务排障专家。',
      category: c.category,
      score: c.valueScore
    }));
    return JSON.stringify(alpacaData, null, 2);
  }

  // default standard json
  return JSON.stringify(cases, null, 2);
}
