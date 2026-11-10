export function cleanPromptText(text) {
  if (!text) return '';
  return text
    .replace(/<div\s+style="display:none"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<div\b[\s\S]*/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/<[^>]*$/g, '')
    .trim();
}

export function isNoiseSession(session) {
  const title = (session.title || '').trim();
  if (!title) return true;
  // Automated shell commands / probes
  if (/^(cat >|python|ls |cd |rm |echo |curl |export |\/tmp|head |wc |grep |find |id; whoami|uname )/i.test(title)) {
    return true;
  }
  // Sandbox exploration scripts
  if (/(沙箱终端|在沙箱里执行|跑一段数据处理脚本.*先做环境确认|grep -E .Cap)/i.test(title)) {
    return true;
  }
  // Trivial echoes
  if (/^(ping|test|pong|1|ok|思考久一点)$/i.test(title)) {
    return true;
  }
  return false;
}

export function isNoisePrompt(prompt) {
  const c = cleanPromptText(prompt);
  if (c.length < 3) return true;
  if (/^(1|ok|test|ping|思考久一点)$/i.test(c)) return true;
  if (/(沙箱终端|在沙箱里执行|跑一段数据处理脚本.*先做环境确认|grep -E .Cap|id; whoami|cat \/proc)/i.test(c)) return true;
  return false;
}

export function normalizePrompt(p) {
  let s = cleanPromptText(p).toLowerCase();
  if (/^{\s*"diagnosismessageid"/i.test(s)) {
    return '<DIAGNOSIS_ACTION>';
  }
  s = s.replace(/输出\s*\d+\s*字.*?作文[^\n]*/g, '输出作文《*》');
  s = s.replace(/.*预生产\s*#\d+.*(合成|skill|资源|样本)[^\n]*/gi, '预生产合成测试');
  s = s.replace(/帮我诊断.*机器人对话[^\n]*/g, '帮我诊断机器人对话，并给出配置修改方案');
  s = s.replace(/.*优化内容.*整合到系统提示词[^\n]*/g, '优化内容整合到系统提示词');
  s = s.replace(/.*息肉(术后|切了|切除)[^\n]*/g, '息肉术后转微话术');
  s = s.replace(/.*(肛门瘙痒|屁眼痒痒).*转微话术[^\n]*/g, '肛门瘙痒转微话术');
  s = s.replace(/帮我创建一个口腔咨询接待流程.*流程名称叫[「“][^」”]+[」”][^\n]*/g, '帮我创建一个口腔咨询接待流程');
  s = s.replace(/《[^》]+》/g, '《*》');
  s = s.replace(/「[^」]+」/g, '「*」');
  s = s.replace(/“[^”]+”/g, '"*"');
  s = s.replace(/#\d+/g, '#ID');
  s = s.replace(/20\d\d-\d\d-\d\d( \d\d:\d\d:\d\d)?/g, '<DATE>');
  s = s.replace(/\d{4,}|\d+\.\d+/g, '<NUM>');
  s = s.replace(/recid[:：]\s*\w+/gi, 'recid:<ID>');
  return s.trim();
}

function getBigrams(str) {
  const s = str.replace(/\s+/g, '');
  const set = new Set();
  for (let i = 0; i < s.length - 1; i++) {
    set.add(s.slice(i, i + 2));
  }
  return set;
}

export function isSimilarPrompt(p1, p2) {
  const n1 = normalizePrompt(p1);
  const n2 = normalizePrompt(p2);
  if (n1 === n2) return true;
  if (n1.startsWith(n2) || n2.startsWith(n1)) {
    const minLen = Math.min(n1.length, n2.length);
    if (minLen >= 10) return true;
  }
  const b1 = getBigrams(n1);
  const b2 = getBigrams(n2);
  if (b1.size === 0 || b2.size === 0) return false;
  let intersection = 0;
  for (const bg of b1) {
    if (b2.has(bg)) intersection++;
  }
  const jaccard = intersection / (b1.size + b2.size - intersection);
  return jaccard >= 0.40;
}

export function scoreAndCategorizeSession(session, messages) {
  const userMsgs = messages.filter(m => m.role === 'user');
  const assistantMsgs = messages.filter(m => m.role === 'assistant');
  const toolMsgs = messages.filter(m => m.role === 'tool' || m.toolName);
  const reasoningMsgs = messages.filter(m => m.role === 'reasoning');

  if (userMsgs.length === 0) {
    return null;
  }

  const rawPrompt = userMsgs[0].content || '';
  const primaryPrompt = cleanPromptText(rawPrompt);
  if (!primaryPrompt || primaryPrompt.length < 3 || isNoisePrompt(primaryPrompt)) {
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
  const cleanTitle = cleanPromptText(session.title || '');
  const displayTitle = (cleanTitle && cleanTitle.length >= 3 && !isNoisePrompt(cleanTitle))
    ? cleanTitle
    : primaryPrompt.slice(0, 40);

  return {
    id: `eval_${session.sessionId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(-24)}`,
    sessionId: session.sessionId,
    title: displayTitle,
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

  // Cluster similar / near-identical cases
  const clusters = [];
  for (const item of rawCases) {
    let added = false;
    for (const cluster of clusters) {
      if (isSimilarPrompt(cluster.representative.userPrompt, item.userPrompt)) {
        cluster.items.push(item);
        // Retain the representative with higher score or longer reference answer
        if (
          item.valueScore > cluster.representative.valueScore ||
          (item.valueScore === cluster.representative.valueScore &&
            item.referenceAnswer.length > cluster.representative.referenceAnswer.length)
        ) {
          cluster.representative = item;
        }
        added = true;
        break;
      }
    }
    if (!added) {
      clusters.push({ representative: item, items: [item] });
    }
  }

  const finalCases = [];
  for (const cluster of clusters) {
    const best = { ...cluster.representative };
    if (cluster.items.length > 1) {
      best.sampleRepetitions = cluster.items.length;
      best.valueReasons = [
        ...best.valueReasons,
        `同场景高频样本 (去重合并 ${cluster.items.length} 条相近用例)`
      ];
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
