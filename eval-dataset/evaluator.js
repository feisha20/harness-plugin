export function getToolExecutionDetails(tm) {
  const baseName = tm.toolName || 'Tool';
  let specificName = baseName;
  let isFailed = false;
  let errorDetail = '';

  // 1. 运行命令 (bash / shell)
  if (baseName === '运行命令') {
    let cmd = '';
    try {
      const parsedArgs = typeof tm.toolArgs === 'string' ? JSON.parse(tm.toolArgs) : tm.toolArgs;
      cmd = parsedArgs?.command || '';
    } catch (e) {
      cmd = tm.toolArgs || '';
    }
    const firstLine = (cmd || '').trim().split('\n')[0] || '';
    let sub = '';
    if (cmd.includes('python')) sub = 'python';
    else if (cmd.includes('grep')) sub = 'grep';
    else if (cmd.includes('curl') || cmd.includes('fetch')) sub = 'curl';
    else if (cmd.includes('node')) sub = 'node';
    else if (firstLine) sub = firstLine.slice(0, 24);
    if (sub) specificName = `运行命令 (${sub})`;

    const text = tm.content || tm.toolResult || '';
    const exitMatch = text.match(/Exit code:\s*(\d+)/i);
    if (exitMatch && exitMatch[1] !== '0') {
      isFailed = true;
      errorDetail = `命令退出异常 (Exit code: ${exitMatch[1]})`;
    } else if (/(command not found|syntax error|fatal:|Traceback \(most recent call last\):)/i.test(text)) {
      isFailed = true;
      errorDetail = '命令执行异常或命令不存在';
    }
    return { baseName, specificName, isFailed, errorDetail };
  }

  // 2. 执行工具 / 对话记录 (KuaiBuddy 核心业务工具或 MCP)
  if (baseName === '执行工具' || baseName === '对话记录') {
    let sourceTool = '';
    const text = tm.content || tm.toolResult || '';
    try {
      const res = typeof text === 'string' ? JSON.parse(text) : text;
      sourceTool = res?.source?.tool || '';
      if (res?.error) {
        isFailed = true;
        errorDetail = typeof res.error === 'string' ? res.error : JSON.stringify(res.error);
      } else if (res?.status === 'ERROR' || res?.status === 'FAILED') {
        isFailed = true;
        errorDetail = res?.statusDescription || '接口调用返回失败状态';
      } else if (res?.code && res?.code !== 0 && res?.code !== 200 && res?.code !== 8) {
        isFailed = true;
        errorDetail = res?.msg || `接口异常响应码 [${res.code}]`;
      }
    } catch (e) {}

    if (!sourceTool) {
      try {
        const args = typeof tm.toolArgs === 'string' ? JSON.parse(tm.toolArgs) : tm.toolArgs;
        sourceTool = args?.tool || args?.action || args?.mode || '';
      } catch (e) {}
    }

    if (sourceTool) {
      specificName = sourceTool;
    }
    return { baseName, specificName, isFailed, errorDetail };
  }

  // 3. 抓取网页 (Web fetch)
  if (baseName === '抓取网页') {
    let url = '';
    try {
      const args = typeof tm.toolArgs === 'string' ? JSON.parse(tm.toolArgs) : tm.toolArgs;
      url = args?.url || '';
    } catch (e) {}
    try {
      const domain = new URL(url).hostname;
      if (domain) specificName = `抓取网页 (${domain})`;
    } catch (e) {}

    const text = tm.content || tm.toolResult || '';
    const statusMatch = text.match(/^status=(\d+)/i);
    if (statusMatch) {
      const code = parseInt(statusMatch[1], 10);
      if (code >= 400) {
        isFailed = true;
        errorDetail = `HTTP ${code}`;
      }
    } else if (/(ECONNREFUSED|ETIMEDOUT|FetchError|timeout)/i.test(text)) {
      isFailed = true;
      errorDetail = '网络请求超时或连接被拒绝';
    }
    return { baseName, specificName, isFailed, errorDetail };
  }

  // 4. 通用工具失败检测
  const text = tm.content || tm.toolResult || '';
  if (/(ToolCallError|Exception|failed with|ECONNREFUSED|ETIMEDOUT|请求失败|调用失败)/i.test(text)) {
    isFailed = true;
    errorDetail = text.slice(0, 120);
  }

  return { baseName, specificName, isFailed, errorDetail };
}

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

/**
 * Detect Badcase from session and conversation messages
 * 核心识别维度：
 * 1. 步骤超过100步 (step_limit_exceeded) - 死循环、步数失控未收敛
 * 2. 工具调用高频失败 (frequent_tool_failures) - 单会话工具失败 >= 2 次
 * 3. 任务中断 / 异常截断 (task_interrupted) - 生成中途退出、任务意外中断
 * 4. 输出结果不满足用户需求 (requirement_unmet) - 答非所问、不满足需求、未按指令执行
 * 5. 机械重复问诊/负反馈 (user_complaint) - 重复问诊、转人工、用户抗议
 * 6. 业务规则/配置未生效 (config_mismatch) - 流程规则未触发、分配错误、排班有错
 * 7. 服务/回复异常 (response_anomaly) - 服务开小差、网络异常
 * 8. 单次工具调用异常 (tool_error) - 偶发工具 5xx/超时报错
 */
export function detectBadcase(session, messages) {
  const userMsgs = messages.filter(m => m.role === 'user');
  const assistantMsgs = messages.filter(m => m.role === 'assistant');
  const toolMsgs = messages.filter(m => m.role === 'tool' || m.toolName);

  if (userMsgs.length === 0 && (!session.title || isNoiseSession(session))) {
    return null;
  }

  const rawTitle = session.title || '';
  const cleanTitle = cleanPromptText(rawTitle);

  // 收集所有异常/失败的工具调用与具体工具详情
  const failedToolMsgs = [];
  const allToolDetails = [];
  for (const tm of toolMsgs) {
    const details = getToolExecutionDetails(tm);
    allToolDetails.push(details);
    if (details.isFailed) {
      failedToolMsgs.push({
        ...tm,
        specificToolName: details.specificName,
        baseToolName: details.baseName,
        toolErrorDetail: details.errorDetail
      });
    }
  }

  // 1. 步骤超过 100 步 (步数超限 / 死循环)
  const isStepExceeded = messages.length >= 100 || toolMsgs.length >= 100;

  // 2. 工具调用高频失败 (>= 2 次)
  const isFrequentToolFail = failedToolMsgs.length >= 2;

  // 3. 任务中断 / 异常退出
  let isTaskInterrupted = false;
  let interruptEvidence = '';
  for (const um of userMsgs) {
    const text = cleanPromptText(um.content || '');
    if (/(写一半退出|任务中断|中途退出|异常退出|写一半不写了|中断后继续|为什么退出了|中断退出|生成中断)/.test(text)) {
      isTaskInterrupted = true;
      interruptEvidence = text;
      break;
    }
  }
  if (!isTaskInterrupted && /(写一半退出|任务中断|中途退出)/.test(cleanTitle)) {
    isTaskInterrupted = true;
    interruptEvidence = cleanTitle;
  }

  // 4. 输出结果不满足用户需求
  let isRequirementUnmet = false;
  let unmetEvidence = '';
  for (const um of userMsgs) {
    const text = cleanPromptText(um.content || '');
    if (/(不满足需求|不是我要的|不是这个意思|答非所问|牛头不对马嘴|没达到要求|不对劲|根本没解决|还是不行|没有按要求|未按指令|漏掉了|完全错误|这写的什么|这算的什么|根本不对)/.test(text)) {
      const match = text.match(/(不满足需求|不是我要的|不是这个意思|答非所问|牛头不对马嘴|没达到要求|不对劲|根本没解决|还是不行|没有按要求|未按指令|漏掉了|完全错误|这写的什么|这算的什么|根本不对)/)[0];
      isRequirementUnmet = true;
      unmetEvidence = `命中负向反馈: "${match}" - 原文: ${text}`;
      break;
    }
  }

  // 5. 机械重复问诊与用户负反馈
  let isUserComplaint = false;
  let complaintEvidence = '';
  for (const um of userMsgs) {
    const text = cleanPromptText(um.content || '');
    if (/(不要重复问诊|上文问过|上文已经问过|已问过|别再问|不要再问|前面说过了|胡说|转人工|叫人工|人工客服|别瞎说|听不懂)/.test(text)) {
      const match = text.match(/(不要重复问诊|上文问过|上文已经问过|已问过|别再问|不要再问|前面说过了|胡说|转人工|叫人工|人工客服|别瞎说|听不懂)/)[0];
      isUserComplaint = true;
      complaintEvidence = `命中负向抗议: "${match}" - 原文: ${text}`;
      break;
    }
  }

  // 6. 业务规则/配置未生效
  let isConfigMismatch = false;
  let mismatchEvidence = '';
  for (const um of userMsgs) {
    const text = cleanPromptText(um.content || '');
    if (/(为什么.*不生效|为什么.*没生效|加进去不生效|为什么没有分配|分错|没分给|未按规则|为什么还会报联|明明设置了|为什么会有两个人值班|排班.*有错|为什么仍收到|哪里设置不对|怎么没生效|不按规则)/.test(text)) {
      isConfigMismatch = true;
      mismatchEvidence = text;
      break;
    }
  }

  // 7. 服务/回复异常 (大模型或系统报错)
  let isResponseAnomaly = false;
  let anomalyEvidence = '';
  for (const am of assistantMsgs) {
    const text = am.content || '';
    if (/(服务开小差|遇到问题|网络开小差|稍后重试|发生未知错误|抱歉.*请重试|无法完成你的请求)/.test(text)) {
      isResponseAnomaly = true;
      anomalyEvidence = text;
      break;
    }
  }

  // 8. 单次工具报错
  const isSingleToolError = failedToolMsgs.length === 1;

  // 汇总所有命中的缺陷标签
  const defectTags = [];
  if (isStepExceeded) defectTags.push('步骤超过100步');
  if (isFrequentToolFail) defectTags.push(`工具高频失败(${failedToolMsgs.length}次)`);
  else if (isSingleToolError) defectTags.push('工具调用异常');
  if (isTaskInterrupted) defectTags.push('任务中断');
  if (isRequirementUnmet) defectTags.push('输出不满足需求');
  if (isUserComplaint) defectTags.push('机械重复/负反馈');
  if (isConfigMismatch) defectTags.push('规则/配置未生效');
  if (isResponseAnomaly) defectTags.push('服务/回复异常');

  // 若无任何缺陷命中，且标题无投诉特征，则非 Badcase
  if (defectTags.length === 0) {
    if (/(为什么.*不生效|不要重复问诊|上文问过|未分配|分错|哪里设置不对|任务中断|写一半退出)/.test(cleanTitle)) {
      let t = 'config_mismatch';
      let tn = '规则/配置未生效';
      if (/(不要重复|上文问过)/.test(cleanTitle)) { t = 'user_complaint'; tn = '机械重复/负反馈'; }
      else if (/(任务中断|写一半退出)/.test(cleanTitle)) { t = 'task_interrupted'; tn = '任务中断/异常截断'; }
      return {
        isBadcase: true,
        badcaseType: t,
        badcaseTypeName: tn,
        severity: t === 'task_interrupted' ? '严重' : '高',
        defectTags: [tn],
        phenomenon: `会话明确指向异常诉求: "${cleanTitle}"`,
        suspectedCause: '业务规则未触发、流程中断或配置覆盖冲突',
        recommendation: '检查工作流逻辑与提示词负向约束，纳入重点回归集',
        evidence: cleanTitle,
        evidenceRole: 'session',
        stepCount: messages.length,
        toolCallsCount: toolMsgs.length,
        toolFailuresCount: 0
      };
    }
    return null;
  }

  // 优先判定归类 (按严重度与核心事故定级)
  if (isStepExceeded) {
    return {
      isBadcase: true,
      badcaseType: 'step_limit_exceeded',
      badcaseTypeName: '步骤超限/死循环',
      severity: '严重',
      defectTags,
      phenomenon: `会话交互步数达到 ${messages.length} 步 (工具调用 ${toolMsgs.length} 次)，超过 100 步阈值，疑似死循环或推理未收敛`,
      suspectedCause: '智能体未设置步数熔断上限，或在连续重试动作中缺少退出/跳出收敛条件',
      recommendation: '增加任务单会话最大步数 Hard Limit 熔断截断机制（建议上限 50~80 步），防止死循环消耗资源并主动求助用户',
      evidence: `总交互步数: ${messages.length} 步 | 工具调用: ${toolMsgs.length} 次`,
      evidenceRole: 'system',
      stepCount: messages.length,
      toolCallsCount: toolMsgs.length,
      toolFailuresCount: failedToolMsgs.length
    };
  }

  if (isFrequentToolFail) {
    const failedTools = [...new Set(failedToolMsgs.map(t => t.specificToolName || t.toolName || 'Tool'))];
    const failureSummary = failedToolMsgs.map(t => `${t.specificToolName || t.toolName}: ${t.toolErrorDetail || '执行异常'}`).slice(0, 3).join('；');
    const firstFailText = failedToolMsgs[0].content || failedToolMsgs[0].toolResult || '';
    return {
      isBadcase: true,
      badcaseType: 'frequent_tool_failures',
      badcaseTypeName: '工具调用高频失败',
      severity: '严重',
      defectTags,
      failedToolNames: failedTools,
      failedToolDetails: failedToolMsgs.map(t => ({
        toolName: t.specificToolName || t.toolName,
        errorDetail: t.toolErrorDetail,
        args: t.toolArgs
      })),
      phenomenon: `单会话内工具调用累计失败 ${failedToolMsgs.length} 次（具体失败工具: ${failedTools.join('、')}），工具链受阻`,
      suspectedCause: `依赖服务异常或入参不匹配。报错概括：${failureSummary}`,
      recommendation: '引入工具调用断路器 (Circuit Breaker) 与连续失败回退机制；补齐工具入参的静态 Schema 校验与 Few-shot 样例',
      evidence: (failedToolMsgs[0].toolErrorDetail ? `【失败工具: ${failedToolMsgs[0].specificToolName}】\n报错详情: ${failedToolMsgs[0].toolErrorDetail}\n\n原始返回:\n` : '') + firstFailText.slice(0, 300),
      evidenceRole: 'tool',
      stepCount: messages.length,
      toolCallsCount: toolMsgs.length,
      toolFailuresCount: failedToolMsgs.length
    };
  }

  if (isTaskInterrupted) {
    return {
      isBadcase: true,
      badcaseType: 'task_interrupted',
      badcaseTypeName: '任务中断/异常截断',
      severity: '严重',
      defectTags,
      phenomenon: '任务执行中途退出或长文本生成被异常截断，未能完整交付预期结果',
      suspectedCause: '网关 SSE 长连接中断、执行进程被沙箱超时杀死、Token 预算耗尽 (Length Finish) 或上游服务主动终止',
      recommendation: '为长时生成与多步骤任务增加 Checkpoint 进度持久化与断点续跑机制；增大 max_tokens 预算与网络保活心跳',
      evidence: interruptEvidence.slice(0, 300),
      evidenceRole: 'user',
      stepCount: messages.length,
      toolCallsCount: toolMsgs.length,
      toolFailuresCount: failedToolMsgs.length
    };
  }

  if (isRequirementUnmet) {
    return {
      isBadcase: true,
      badcaseType: 'requirement_unmet',
      badcaseTypeName: '输出不满足需求',
      severity: '高',
      defectTags,
      phenomenon: `用户明确反馈模型生成结果或方案不满足业务需求（${unmetEvidence.slice(0, 80)}）`,
      suspectedCause: '大模型意图理解与指令对齐偏差 (Instruction Following Deficit)，未精准识别核心约束条件，或缺乏前置意图澄清确认',
      recommendation: '在系统提示词增加强约束要求（如输出前进行条件复核清单）；在模糊需求场景下触发主动反问（Ask User Clarification）',
      evidence: unmetEvidence.slice(0, 300),
      evidenceRole: 'user',
      stepCount: messages.length,
      toolCallsCount: toolMsgs.length,
      toolFailuresCount: failedToolMsgs.length
    };
  }

  if (isUserComplaint) {
    return {
      isBadcase: true,
      badcaseType: 'user_complaint',
      badcaseTypeName: '机械重复/负反馈',
      severity: '高',
      defectTags,
      phenomenon: `用户产生负向抱怨或抗议机械重复问诊（${complaintEvidence.slice(0, 80)}）`,
      suspectedCause: '多轮状态记忆缺失或提示词未配置负向约束，导致重复追问已提过的问题',
      recommendation: '在系统提示词增加负向约束「严禁重复追问访客上文已提及或已问过的信息」，并优化槽位记忆',
      evidence: complaintEvidence.slice(0, 300),
      evidenceRole: 'user',
      stepCount: messages.length,
      toolCallsCount: toolMsgs.length,
      toolFailuresCount: failedToolMsgs.length
    };
  }

  if (isConfigMismatch) {
    return {
      isBadcase: true,
      badcaseType: 'config_mismatch',
      badcaseTypeName: '规则/配置未生效',
      severity: '高',
      defectTags,
      phenomenon: '用户反馈配置的规则、分配机制或排班未按预期生效',
      suspectedCause: 'START 触发条件不匹配、优先级覆盖冲突或缺少兜底机制',
      recommendation: '检查规则触发词泛化边界与路由优先级，排查客服接待在线状态与排班判定',
      evidence: mismatchEvidence.slice(0, 300),
      evidenceRole: 'user',
      stepCount: messages.length,
      toolCallsCount: toolMsgs.length,
      toolFailuresCount: failedToolMsgs.length
    };
  }

  if (isResponseAnomaly) {
    return {
      isBadcase: true,
      badcaseType: 'response_anomaly',
      badcaseTypeName: '服务/回复异常',
      severity: '严重',
      defectTags,
      phenomenon: '大模型或客服引擎返回系统故障与异常中断提示',
      suspectedCause: '网关超时、上游模型服务抖动或上下文超出最大 Token 限制',
      recommendation: '缩减上下文轮数，增加模型输出流式断线重连与优雅兜底提示',
      evidence: anomalyEvidence.slice(0, 300),
      evidenceRole: 'assistant',
      stepCount: messages.length,
      toolCallsCount: toolMsgs.length,
      toolFailuresCount: failedToolMsgs.length
    };
  }

  if (isSingleToolError) {
    const tm = failedToolMsgs[0];
    const text = tm.content || tm.toolResult || '';
    const specificName = tm.specificToolName || tm.toolName || 'Tool';
    return {
      isBadcase: true,
      badcaseType: 'tool_error',
      badcaseTypeName: '工具调用异常',
      severity: '严重',
      defectTags,
      failedToolNames: [specificName],
      failedToolDetails: [{
        toolName: specificName,
        errorDetail: tm.toolErrorDetail,
        args: tm.toolArgs
      }],
      phenomenon: `具体工具 [${specificName}] 调用执行失败${tm.toolErrorDetail ? `（${tm.toolErrorDetail}）` : ''}`,
      suspectedCause: `工具接口入参格式不合规、接口超时或目标后台服务报错。报错信息: ${tm.toolErrorDetail || '执行异常'}`,
      recommendation: '在系统提示词增加参数格式示例校验，增加工具超时重试机制与降级策略',
      evidence: (tm.toolErrorDetail ? `【失败工具: ${specificName}】\n报错详情: ${tm.toolErrorDetail}\n\n原始返回:\n` : '') + text.slice(0, 300),
      evidenceRole: 'tool',
      stepCount: messages.length,
      toolCallsCount: toolMsgs.length,
      toolFailuresCount: 1
    };
  }

  return null;
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

  const toolNames = [...new Set(toolMsgs.map(t => getToolExecutionDetails(t).specificName).filter(Boolean))];
  const cleanTitle = cleanPromptText(session.title || '');
  const displayTitle = (cleanTitle && cleanTitle.length >= 3 && !isNoisePrompt(cleanTitle))
    ? cleanTitle
    : primaryPrompt.slice(0, 40);

  const runIds = [...new Set(messages.map(m => m.runId).filter(Boolean))];
  const runId = runIds[0] || '';

  return {
    id: `eval_${session.sessionId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(-24)}`,
    sessionId: session.sessionId,
    runId,
    runIds,
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
  const rawBadcases = [];

  for (const session of validSessions) {
    const msgs = messagesMap.get(session.sessionId) || [];
    if (msgs.length === 0) continue;

    // 1. Evaluate Badcase for regression suite
    const bad = detectBadcase(session, msgs);
    if (bad) {
      const userMsgs = msgs.filter(m => m.role === 'user');
      const assistantMsgs = msgs.filter(m => m.role === 'assistant');
      const toolMsgs = msgs.filter(m => m.role === 'tool' || m.toolName);
      const rawPrompt = userMsgs[0]?.content || session.title || '';
      const prompt = cleanPromptText(rawPrompt);
      const cleanTitle = cleanPromptText(session.title || '');
      const displayTitle = (cleanTitle && cleanTitle.length >= 3 && !isNoisePrompt(cleanTitle))
        ? cleanTitle
        : prompt.slice(0, 40);

      const badRunIds = [...new Set(msgs.map(m => m.runId).filter(Boolean))];
      const badRunId = badRunIds[0] || '';

      rawBadcases.push({
        id: `bad_${session.sessionId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(-24)}`,
        sessionId: session.sessionId,
        runId: badRunId,
        runIds: badRunIds,
        title: displayTitle,
        badcaseType: bad.badcaseType,
        badcaseTypeName: bad.badcaseTypeName,
        severity: bad.severity,
        defectTags: bad.defectTags || [bad.badcaseTypeName],
        phenomenon: bad.phenomenon,
        suspectedCause: bad.suspectedCause,
        recommendation: bad.recommendation,
        evidence: bad.evidence,
        evidenceRole: bad.evidenceRole,
        stepCount: bad.stepCount || msgs.length,
        userPrompt: prompt,
        referenceAnswer: assistantMsgs[assistantMsgs.length - 1]?.content || '',
        turnsCount: Math.max(1, userMsgs.length),
        toolCallsCount: toolMsgs.length,
        toolFailuresCount: bad.toolFailuresCount || 0,
        failedToolNames: bad.failedToolNames || [],
        failedToolDetails: bad.failedToolDetails || [],
        toolNames: [...new Set(toolMsgs.map(t => getToolExecutionDetails(t).specificName).filter(Boolean))],
        modelId: session.modelId || 'MiniMax-M3.1-Flash',
        createdAt: session.createdAt,
        messages: msgs
      });
    }

    // 2. Evaluate Gold Benchmark Cases
    const evaluated = scoreAndCategorizeSession(session, msgs);
    if (evaluated && evaluated.valueScore >= minScore) {
      rawCases.push(evaluated);
    }
  }

  // Cluster similar / near-identical cases (Gold Benchmark)
  const clusters = [];
  for (const item of rawCases) {
    let added = false;
    for (const cluster of clusters) {
      if (isSimilarPrompt(cluster.representative.userPrompt, item.userPrompt)) {
        cluster.items.push(item);
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

  // Sort Gold Cases by score descending
  finalCases.sort((a, b) => b.valueScore - a.valueScore);

  // Cluster similar Badcases
  const badcaseClusters = [];
  for (const item of rawBadcases) {
    let added = false;
    for (const cluster of badcaseClusters) {
      if (
        cluster.representative.badcaseType === item.badcaseType &&
        isSimilarPrompt(cluster.representative.userPrompt, item.userPrompt)
      ) {
        cluster.items.push(item);
        added = true;
        break;
      }
    }
    if (!added) {
      badcaseClusters.push({ representative: item, items: [item] });
    }
  }

  const finalBadcases = [];
  for (const cluster of badcaseClusters) {
    const rep = { ...cluster.representative };
    if (cluster.items.length > 1) {
      rep.sampleRepetitions = cluster.items.length;
    }
    finalBadcases.push(rep);
  }

  // Sort Badcases: 严重 > 高 > 中
  const severityRank = { '严重': 3, '高': 2, '中': 1 };
  finalBadcases.sort((a, b) => (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0));

  const categoryBreakdown = {};
  let totalScore = 0;
  for (const c of finalCases) {
    categoryBreakdown[c.category] = (categoryBreakdown[c.category] || 0) + 1;
    totalScore += c.valueScore;
  }

  const badcaseBreakdown = {};
  for (const b of finalBadcases) {
    badcaseBreakdown[b.badcaseTypeName] = (badcaseBreakdown[b.badcaseTypeName] || 0) + 1;
  }

  return {
    summary: {
      totalRawSessions: sessions.length,
      noiseFilteredOut: sessions.length - validSessions.length,
      evaluatedCandidates: validSessions.length,
      extractedCount: finalCases.length,
      badcasesCount: finalBadcases.length,
      withToolCallsCount: finalCases.filter(c => c.toolCallsCount > 0).length,
      avgScore: finalCases.length ? Math.round(totalScore / finalCases.length) : 0,
      categoryBreakdown,
      badcaseBreakdown
    },
    cases: finalCases,
    badcases: finalBadcases
  };
}

export function exportFormat(items, format = 'json', type = 'cases') {
  if (type === 'official') {
    if (format === 'jsonl') {
      return items.map(c => JSON.stringify({
        id: c.id,
        sessionId: c.sessionId,
        runId: c.runId || '',
        sourceType: c.sourceType || (c.badcaseType ? 'badcase' : 'case'),
        priority: c.priority || 'P1',
        category: c.category || c.badcaseTypeName || '综合问答',
        title: c.title,
        prompt: c.userPrompt || c.prompt,
        eval_criteria: c.evalCriteria || '',
        reference_answer: c.referenceAnswer || '',
        tools: c.toolNames || [],
        turns: c.turnsCount || 1,
        sourceDate: c.sourceDate,
        sourceEnv: c.sourceEnv,
        addedAt: c.addedAt,
        messages: c.messages || []
      })).join('\n');
    }

    if (format === 'alpaca') {
      const alpacaData = items.map(c => {
        const isBad = c.sourceType === 'badcase' || Boolean(c.badcaseType);
        return {
          instruction: c.userPrompt || c.prompt || '',
          input: c.evalCriteria
            ? `【评测标准与要求】\n${c.evalCriteria}`
            : (isBad
              ? `【缺陷类型】${c.badcaseTypeName || c.category}\n【故障现象】${c.phenomenon || ''}`
              : ''),
          output: c.referenceAnswer || c.recommendation || '',
          system: '你是一个智能客服与业务排障专家，请严格遵循评测标准完成工具调用与专业回复。',
          category: c.category || c.badcaseTypeName || '综合问答',
          priority: c.priority || 'P1',
          sourceType: isBad ? 'badcase' : 'case'
        };
      });
      return JSON.stringify(alpacaData, null, 2);
    }

    return JSON.stringify(items, null, 2);
  }

  if (type === 'badcases') {
    if (format === 'jsonl') {
      return items.map(b => JSON.stringify({
        id: b.id,
        sessionId: b.sessionId,
        runId: b.runId || '',
        type: b.badcaseType,
        typeName: b.badcaseTypeName,
        severity: b.severity,
        defectTags: b.defectTags,
        phenomenon: b.phenomenon,
        suspectedCause: b.suspectedCause,
        recommendation: b.recommendation,
        evidence: b.evidence,
        stepCount: b.stepCount,
        prompt: b.userPrompt,
        reference_answer: b.referenceAnswer,
        tools: b.toolNames,
        toolFailuresCount: b.toolFailuresCount,
        turns: b.turnsCount,
        messages: b.messages
      })).join('\n');
    }

    if (format === 'alpaca') {
      const alpacaData = items.map(b => ({
        instruction: b.userPrompt,
        input: `【缺陷类型】${b.badcaseTypeName} (${(b.defectTags || []).join(' / ')})\n【故障现象】${b.phenomenon}\n【疑似根因】${b.suspectedCause}\n【关键证据】${b.evidence}`,
        output: `【修复建议】\n${b.recommendation}\n\n【预期参考回复】\n${b.referenceAnswer || '针对此异常情况，应避免机械重复或配置未生效问题，准确匹配业务分支或正确调用工具。'}`,
        system: '你是一个智能客服系统质量回归专家，针对历史 Badcase 执行严格定向回归，防止相同缺陷复现。',
        category: b.badcaseTypeName,
        severity: b.severity
      }));
      return JSON.stringify(alpacaData, null, 2);
    }

    return JSON.stringify(items, null, 2);
  }

  // Gold Benchmark Cases
  if (format === 'jsonl') {
    return items.map(c => JSON.stringify({
      id: c.id,
      sessionId: c.sessionId,
      runId: c.runId || '',
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
    const alpacaData = items.map(c => ({
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
  return JSON.stringify(items, null, 2);
}
