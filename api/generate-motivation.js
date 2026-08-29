const DEFAULT_UPSTAGE_API_URL = "https://api.upstage.ai/v1/chat/completions";
const DEFAULT_OPENAI_API_URL = "https://api.openai.com/v1/responses";
const DEFAULT_OPENAI_MODEL = "gpt-5.6-luna";
const TaskTypeConfig = require("../public/js/task-types.js");

const normalizeUpstageApiUrl = (value) => {
  const trimmed = String(value || DEFAULT_UPSTAGE_API_URL).trim().replace(/\/+$/, "");
  if (/\/chat\/completions$/i.test(trimmed)) return trimmed;
  if (/\/v\d+(?:\/solar)?$/i.test(trimmed)) return trimmed + "/chat/completions";
  return trimmed;
};

const normalizeOpenAIApiUrl = (value) => {
  const trimmed = String(value || DEFAULT_OPENAI_API_URL).trim().replace(/\/+$/, "");
  if (/\/responses$/i.test(trimmed)) return trimmed;
  if (/\/v\d+$/i.test(trimmed)) return trimmed + "/responses";
  return trimmed;
};

const resolveAIProvider = () => {
  const configured = String(process.env.AI_PROVIDER || "").trim().toLowerCase();
  if (["openai", "upstage"].includes(configured)) return configured;
  return process.env.OPENAI_API_KEY ? "openai" : "upstage";
};

const clean = (value) => String(value || "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim();

const json = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
};

const summarizeUpstageError = (status, rawText) => {
  const fallback = rawText ? rawText.slice(0, 500) : "No response body.";
  try {
    const parsed = JSON.parse(rawText);
    return `Upstage API error ${status}: ${parsed.error?.message || parsed.message || parsed.detail || fallback}`;
  } catch {
    return `Upstage API error ${status}: ${fallback}`;
  }
};

const summarizeOpenAIError = (status, rawText) => {
  const fallback = rawText ? rawText.slice(0, 500) : "No response body.";
  try {
    const parsed = JSON.parse(rawText);
    return `OpenAI API error ${status}: ${parsed.error?.message || parsed.message || fallback}`;
  } catch {
    return `OpenAI API error ${status}: ${fallback}`;
  }
};

const extractOpenAIText = (transport) => {
  if (typeof transport?.output_text === "string" && transport.output_text.trim()) {
    return transport.output_text;
  }
  for (const output of transport?.output || []) {
    for (const content of output?.content || []) {
      if (content?.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }
  return "";
};

const resolveGenerationSelection = (payload) => {
  const lang = payload.lang === "en" ? "en" : "ko";
  const taskType = TaskTypeConfig.getTaskType(payload.taskType, lang)
    || TaskTypeConfig.localizeTaskType(TaskTypeConfig.TASK_TYPES[TaskTypeConfig.DEFAULT_TASK_TYPE], lang);
  const sdtAnalysis = TaskTypeConfig.analyzeSDTNeeds({ ...payload, taskType: taskType.key });
  const surveySelection = TaskTypeConfig.getStrategySelection(taskType.key);
  const selectedFrames = sdtAnalysis.frames.slice(0, 2);
  return {
    taskType,
    sdtAnalysis,
    surveySelection,
    selectedFrames,
    coreStrategy: selectedFrames[0] || "",
    supportingStrategy: selectedFrames[1] || ""
  };
};

const buildMessages = (payload) => {
  const {
    taskType,
    selectedFrames,
    coreStrategy,
    supportingStrategy,
    surveySelection
  } = resolveGenerationSelection(payload);
  return [
  {
    role: "system",
    content: [
      "당신은 크라우드소싱 작업자에게 전달할 자연스러운 한국어 안내 메시지를 작성하는 UX 라이터입니다.",

      // --------------------------------------------------
      // General writing rules
      // --------------------------------------------------
      "작업자에게 내부 전략명(Autonomy, Competence, Relatedness, Meaningfulness, Appreciation)을 직접 노출하지 마세요.",
      "작업 시작 전 후보 3개, 작업 완료 후 후보 3개, 최종 작업 전/후 문구를 JSON으로만 반환하세요.",
      "beforeOptions와 afterOptions의 각 후보 및 finalBeforeText와 finalAfterText는 자연스럽게 이어지는 완결된 한국어 4~5문장으로 작성하세요.",
      "3문장 이하 또는 6문장 이상은 허용하지 않으며, 같은 의미를 반복하거나 짧은 구절을 마침표로 나누어 문장 수만 맞추지 마세요.",
      "문구는 과장, 압박, 죄책감, 홍보성 표현 없이 차분하고 구체적으로 작성하세요.",
      "한국어 화자가 실제 requester에게서 받을 법한 자연스러운 안내문처럼 작성하고, 번역투나 지나치게 형식적인 표현을 피하세요.",
      'beforeOptions, afterOptions, finalBeforeText, finalAfterText의 메시지 내용에는 큰따옴표(")를 사용하지 마세요. JSON 구문에 필요한 큰따옴표는 예외입니다.',
      "작업 제목에도 따옴표, 괄호, 굵은 표시 등 불필요한 강조 기호를 추가하지 마세요.",
      "절대 큰 따옴표를 사용하지 마세요.",

      // --------------------------------------------------
      // Pre-task strategy
      // --------------------------------------------------
      "작업 시작 전 메시지는 Task Type에 따라 결정된 Core strategy와 Supporting strategy를 중심으로 작성하세요.",
      "Core는 작업 시작 전 메시지의 중심 전략이며 Supporting은 이를 보완하는 역할을 합니다.",
      "두 전략을 같은 비중으로 나열하지 말고 Core의 의미가 메시지 전체에서 더 분명하게 드러나도록 작성하세요.",
      "전략별 고정 문구나 키워드를 억지로 삽입하지 말고, 작업자의 선택감, 자신감, 존중감 등이 문장의 전체적인 의미를 통해 자연스럽게 전달되게 하세요.",

      `Core strategy (Pre-task 중심 전략): ${coreStrategy}`,
      `Supporting strategy (Pre-task 보완 전략): ${supportingStrategy}`,
      `Survey evidence (N=${TaskTypeConfig.SURVEY_SAMPLE_SIZE}): Core ${coreStrategy} ${surveySelection.corePercentage.toFixed(1)}%, Supporting ${supportingStrategy} ${surveySelection.supportingPercentage.toFixed(1)}%.`,
      `확정된 Task Type은 ${taskType.label}입니다. 이는 Worker의 작업 경험 분류이며 인터페이스 종류를 뜻하지 않습니다.`,
      `Figure 기반 Pre-task 전략 우선순위는 ${selectedFrames.join(" + ")}입니다.`,

      "beforeOptions의 후보군에는 Relatedness, Competence, Autonomy 관점을 다양하게 반영하되, finalBeforeText는 반드시 위에서 지정된 Core + Supporting 우선순위를 따르세요.",

      // --------------------------------------------------
      // Post-task strategy
      // --------------------------------------------------
      "작업 완료 후 메시지는 Pre-task의 Core/Supporting 전략을 그대로 반복하지 마세요.",
      "Post-task 메시지의 중심 목적은 작업자가 자신의 작업이 어디에 기여했는지 이해하도록 하는 것과, 작업자의 시간·노력·판단을 인정하고 감사하는 것입니다.",
      "따라서 Post-task에서는 Meaningfulness를 중심 전략으로, Appreciation/Relatedness를 보완 전략으로 사용하세요.",
      "작업 완료 후 메시지에서는 보상 유무, 보상 금액, 지급 또는 정산에 관한 내용을 언급하지 마세요.",

      `작업 결과물의 기여 정보: ${clean(payload.socialImpact)}`,

      "작업 완료 후 메시지는 반드시 위의 작업 결과물의 기여 정보를 활용하여 작성하세요.",
      "작업 결과물의 기여 정보에 명시된 내용만 사실적 근거로 사용하여, 작업자의 결과가 어떤 데이터, 시스템, 연구 또는 결과물에 활용되는지 구체적으로 설명하세요.",
      "입력된 기여 정보를 넘어서는 사실, 의도, 영향, 효과 또는 결과를 임의로 추측하거나 판단하여 작성하지 말고 과장하지도 마세요.",
      "단순히 '도움이 됩니다', '중요합니다'라고 말하기보다, 작업 결과가 무엇에 사용되거나 어떤 품질을 높이는지 가능한 범위에서 구체적으로 설명하세요.",

      "Post-task에는 다음 세 요소를 반드시 포함하세요:",
      "1. 작업을 완료했다는 자연스러운 acknowledgment",
      "2. 작업에 들인 시간, 노력 또는 세심한 판단에 대한 구체적인 감사와 인정",
      "3. 입력된 작업 결과물의 기여 정보를 기반으로 한 구체적이고 과장 없는 Meaningfulness 설명",

      "감사는 형식적인 '감사합니다' 한 문장으로 끝내지 말고, 작업자가 제공한 시간, 세심함, 판단 또는 기여 중 해당 작업에 적절한 요소를 구체적으로 인정하세요.",
      "Post-task 메시지는 평가하거나 성과를 칭찬하는 방식보다, 작업자의 기여를 존중하고 인정하는 방식으로 작성하세요.",
      "정확도나 품질이 실제로 확인되지 않은 경우 '정확하게 수행해 주셨습니다', '훌륭한 결과를 제공했습니다'처럼 검증되지 않은 성과를 단정하지 마세요.",

      // --------------------------------------------------
      // Message length
      // --------------------------------------------------
      "Message length evidence: Medium was preferred by 66.7% (80/120), so both final messages use 4–5 sentences.",

      // --------------------------------------------------
      // Output consistency
      // --------------------------------------------------
      "selectedFrames는 Pre-task에 사용된 두 전략 값을 같은 순서로 정확히 반환하고 다른 프레임으로 변경하지 마세요.",

      // --------------------------------------------------
      // Self-check
      // --------------------------------------------------
      "JSON을 반환하기 전에 Pre-task를 자체 점검하세요: 완전한 4~5문장인지, Task Type에 맞는지, Core가 중심이고 Supporting이 보완적으로 표현되었는지, 반복이 없는지, 내부 전략명이 노출되지 않았는지 확인하세요.",

      "Post-task도 별도로 자체 점검하세요: 완전한 4~5문장인지, 작업 완료 acknowledgment가 있는지, 시간·노력·판단에 대한 appreciation이 있는지, 작업 결과물의 기여 정보를 기반으로 meaningfulness가 설명되었는지, 보상 관련 언급이 없는지, 마지막 문장이 정확히 '좋은 하루 되시길 바랍니다!'로 끝나는지, 임의 추측·판단·과장 또는 검증되지 않은 주장이 없는지 확인하세요.",

      "어느 조건이라도 맞지 않으면 내부적으로 문장을 수정한 뒤 수정이 끝난 JSON만 반환하세요.",

      // --------------------------------------------------
      // Fixed opening / closing
      // --------------------------------------------------
      `finalBeforeText는 반드시 다음 문장으로 시작하세요: 안녕하세요. ${clean(payload.title)}에 참여해 주셔서 감사합니다.`,
      "finalAfterText는 반드시 다음 문장으로 끝나야 합니다 (이 문장을 마지막 문장으로 포함해 전체 4~5문장을 구성하세요): 좋은 하루 되시길 바랍니다!"
    ].join("\n")
  },
  {
    role: "user",
    content: [
      "[작업 정보]",
      `작업 제목: ${clean(payload.title)}`,
      `Task Type: ${taskType.label} (${taskType.key})`,
      `Task Type 설명: ${taskType.description}`,
      `Task Type 특성: ${taskType.characteristics.map(item => item.label).join(" · ")}`,
      `Task Type 선택 기준: ${taskType.mappingReason}`,
      `완료 보상: ${clean(payload.reward)}`,
      `작업 지침: ${clean(payload.description)}`,
      `정서적 부담: ${clean(payload.riskLevel)}`,
      `반복/집중 부담: ${clean(payload.fatigueLevel)}`,
      `작업자가 할 일: ${clean(payload.objective)}`,
      `작업의 사회적 기여: ${clean(payload.socialImpact)}`,
      `작업자가 겪을 수 있는 상황: ${clean(payload.workerContext)}`,
      `단일 작업 제한 시간: ${clean(payload.timeLimitMinutes)}분`,
      "",
      "[Pre-task 최종 메시지 설계 기준]",
      `Core strategy: ${coreStrategy}`,
      `Supporting strategy: ${supportingStrategy}`,
      "finalBeforeText는 Core를 중심으로 전개하고 Supporting을 보완적으로 반영하세요.",
      "",
      "[Post-task 최종 메시지 설계 기준]",
      "Core strategy: Meaningfulness",
      "Supporting strategy: Appreciation/Relatedness",
      "finalAfterText는 작업 결과물의 구체적인 기여 의미를 중심으로 전개하고, 작업자의 시간·노력·판단에 대한 인정과 감사를 보완적으로 반영하세요.",
      "Task Type에 맞는 기여 의미를 구체적으로 설명하세요: Annotation/Classification=정확성·품질·신뢰성, Data Collection/Creation=향후 분석·콘텐츠 구축 자료, Search/Verification=정보 정확성·신뢰성, Evaluation/Comparison=평가·의사결정, Content Moderation=안전하고 신뢰할 수 있는 환경, Surveys/Experiments=연구 결과·사용자 이해.",
      "",
      "[반환 JSON 스키마]",
      JSON.stringify({
        psychologicalFactors: {
          taskType: taskType.key,
          taskTypeLabel: taskType.label,
          taskTypeReason: taskType.mappingReason,
          taskTypeCharacteristics: taskType.characteristics,
          inferredTaskTypes: [{ type: taskType.label, evidence: "metadata evidence", confidence: 0.7 }],
          primaryTaskType: taskType.label,
          primaryPsychologicalType: taskType.psychologicalType,
          psychologicalBurdens: ["작업자가 느낄 수 있는 부담"],
          motivationalFactors: ["동기 부여에 활용할 수 있는 요인"],
          sdtNeeds: selectedFrames.map(frame => frame === "Relatedness" ? "relatedness" : frame.toLowerCase()),
          selectedFrames,
          frameSelectionReason: taskType.mappingReason,
          surveyEvidence: {
            sampleSize: TaskTypeConfig.SURVEY_SAMPLE_SIZE,
            corePercentage: surveySelection.corePercentage,
            supportingPercentage: surveySelection.supportingPercentage,
            messageLength: TaskTypeConfig.MESSAGE_LENGTH_EVIDENCE
          },
          constraintsApplied: ["비압박", "비과장", "구체적 기준 유지"]
        },
        beforeOptions: [
          { label: "관계성/기여 연결", frame: "Relatedness", message: "자연스럽게 이어지는 완결된 4~5문장의 작업 시작 전 후보 문구" },
          { label: "유능감/판단 신뢰", frame: "Competence", message: "자연스럽게 이어지는 완결된 4~5문장의 작업 시작 전 후보 문구" },
          { label: "자율성/선택 존중", frame: "Autonomy", message: "자연스럽게 이어지는 완결된 4~5문장의 작업 시작 전 후보 문구" }
        ],
        afterOptions: [
          { label: "기여 의미", frame: "Meaningfulness", message: "작업 결과물의 구체적인 활용과 기여 의미를 중심으로 자연스럽게 이어지는 완결된 4~5문장의 작업 완료 후 후보 문구" },
          { label: "시간·노력 인정", frame: "Appreciation", message: "작업자의 시간과 노력을 구체적으로 인정하며 자연스럽게 이어지는 완결된 4~5문장의 작업 완료 후 후보 문구" },
          { label: "판단·기여 인정", frame: "Relatedness", message: "작업자의 판단과 기여를 구체적으로 인정하며 자연스럽게 이어지는 완결된 4~5문장의 작업 완료 후 후보 문구" }
        ],
        finalBeforeText: "Core > Supporting 비중을 지키는 완결된 4~5문장의 최종 작업 시작 전 문구",
        finalAfterText: "Meaningfulness > Appreciation/Relatedness 비중으로 Task Type별 기여 의미와 시간·노력·판단에 대한 인정을 포함하고, 반드시 '좋은 하루 되시길 바랍니다!'로 끝나는 완결된 4~5문장 작업 완료 후 문구",
        structuredPromptSummary: "프롬프트 구조 요약"
      }, null, 2)
    ].join("\n")
  }
  ];
};

const buildMessagesEn = (payload) => {
  const {
    taskType,
    selectedFrames,
    coreStrategy,
    supportingStrategy,
    surveySelection
  } = resolveGenerationSelection({ ...payload, lang: "en" });
  return [
  {
    role: "system",
    content: [
      "You are a UX writer crafting natural English guidance messages for a crowdsourcing worker.",

      // --------------------------------------------------
      // General writing rules
      // --------------------------------------------------
      "Never expose the internal strategy names (Autonomy, Competence, Relatedness, Meaningfulness, Appreciation) to the worker.",
      "Return only JSON containing 3 pre-task candidates, 3 post-task candidates, and the final pre/post-task messages.",
      "Each candidate in beforeOptions and afterOptions, and both finalBeforeText and finalAfterText, must be a complete, naturally flowing English passage of 4-5 sentences.",
      "Never allow 3 sentences or fewer, or 6 sentences or more, and never pad the sentence count by repeating the same idea or splitting a short phrase across periods.",
      "Write calmly and concretely, with no exaggeration, pressure, guilt, or promotional language.",
      "Write the way a real requester would naturally address a worker in English; avoid stiff, translated-sounding, or overly formal phrasing.",
      "Never use double quotes (\") inside the message text of beforeOptions, afterOptions, finalBeforeText, or finalAfterText. Double quotes required by JSON syntax are the only exception.",
      "Do not add unnecessary emphasis marks such as quotes, parentheses, or bold markers around the task title either.",
      "Never use double quotes inside the written message content.",

      // --------------------------------------------------
      // Pre-task strategy
      // --------------------------------------------------
      "The pre-task message should center on the Core strategy and Supporting strategy determined by the Task Type.",
      "Core is the central strategy of the pre-task message; Supporting reinforces it.",
      "Do not present the two strategies with equal weight — make the Core strategy's meaning clearly more prominent across the message.",
      "Do not force in fixed phrases or keywords for each strategy; instead let the worker's sense of choice, confidence, or respect emerge naturally from the overall meaning of the sentences.",

      `Core strategy (pre-task lead strategy): ${coreStrategy}`,
      `Supporting strategy (pre-task supporting strategy): ${supportingStrategy}`,
      `Survey evidence (N=${TaskTypeConfig.SURVEY_SAMPLE_SIZE}): Core ${coreStrategy} ${surveySelection.corePercentage.toFixed(1)}%, Supporting ${supportingStrategy} ${surveySelection.supportingPercentage.toFixed(1)}%.`,
      `The confirmed Task Type is ${taskType.label}. This classifies the worker's task experience — it is not an interface type.`,
      `The figure-based pre-task strategy priority is ${selectedFrames.join(" + ")}.`,

      "The beforeOptions candidates should reflect a variety of Relatedness, Competence, and Autonomy angles, but finalBeforeText must strictly follow the Core + Supporting priority specified above.",
      "beforeOptions must contain exactly three candidates in this order: Relatedness, Competence, Autonomy.",
      "For each pre-task candidate, label and frame must both equal its assigned strategy name.",
      "The Relatedness candidate must center the connection between the worker's participation or contribution and the shared task purpose or use of the result, while conveying respect for that contribution.",
      "The Competence candidate must center confidence that the worker understands the criteria, can notice careful distinctions, judge context, and produce accurate, consistent work.",
      "The Autonomy candidate must center the worker's ability, within the guidelines, to choose an approach, order, and pace and to use their own judgment.",
      "Keep one clear strategy at the center of each candidate; do not mix all three strategies into every candidate.",
      "Use Relatedness, Competence, and Autonomy only in label and frame metadata, never in worker-facing message text.",
      "Do not make the Competence candidate about a comfortable pace, preferred order, free choice, taking breaks, or self-regulation.",

      // --------------------------------------------------
      // Post-task strategy
      // --------------------------------------------------
      "The post-task message must not simply repeat the pre-task's Core/Supporting strategy.",
      "The central purpose of the post-task message is to help the worker understand where their work contributed, and to acknowledge and thank them for their time, effort, and judgment.",
      "So for the post-task message, use Meaningfulness as the core strategy and Appreciation/Relatedness as the supporting strategy.",
      "Never mention whether a reward exists, its amount, or payment/settlement in the post-task message.",

      `Contribution information for the task output: ${clean(payload.socialImpact)}`,

      "The post-task message must be written using the contribution information above.",
      "Use only the facts stated in the contribution information as evidence, and concretely explain what data, system, research, or output the worker's result feeds into.",
      "Never speculate about or assert facts, intent, impact, or outcomes beyond what was provided, and never exaggerate.",
      "Rather than vaguely saying it 'helps' or is 'important,' explain as concretely as possible what the result is used for or what quality it improves.",

      "The post-task message must include all three of the following elements:",
      "1. A natural acknowledgment that the task is complete",
      "2. Concrete appreciation and recognition of the time, effort, or careful judgment the worker put in",
      "3. A concrete, non-exaggerated explanation of Meaningfulness based on the provided contribution information",

      "Do not end the appreciation with a single formal 'thank you' sentence — concretely acknowledge whichever of the worker's time, care, judgment, or contribution best fits this task.",
      "Write the post-task message in a way that respects and recognizes the worker's contribution, rather than evaluating or praising their performance.",
      "If accuracy or quality was not actually verified, do not assert unverified outcomes such as 'you performed this accurately' or 'you delivered excellent results.'",

      // --------------------------------------------------
      // Message length
      // --------------------------------------------------
      "Message length evidence: Medium was preferred by 66.7% (80/120), so both final messages use 4-5 sentences.",

      // --------------------------------------------------
      // Output consistency
      // --------------------------------------------------
      "Return selectedFrames as exactly the two strategy values used for the pre-task message, in the same order — do not substitute different frames.",

      // --------------------------------------------------
      // Self-check
      // --------------------------------------------------
      "Before returning the JSON, self-check the pre-task message: is it a complete 4-5 sentences, does it fit the Task Type, is Core clearly the lead with Supporting reinforcing it, is it free of repetition, and are no internal strategy names exposed?",

      "Separately self-check the post-task message: is it a complete 4-5 sentences, does it acknowledge task completion, does it appreciate the time/effort/judgment involved, does it explain meaningfulness grounded in the contribution information, is there no mention of reward, does the final sentence end exactly with 'Have a great day!', and is it free of speculation, exaggeration, or unverified claims?",

      "If any condition is not met, silently revise the sentences internally and return only the corrected JSON.",

      // --------------------------------------------------
      // Fixed opening / closing
      // --------------------------------------------------
      `finalBeforeText must begin with exactly this sentence: Hello! Thank you for taking part in the ${clean(payload.title)} task.`,
      "finalAfterText must end with exactly this sentence (include it as the final sentence within the overall 4-5 sentences): Have a great day!"
    ].join("\n")
  },
  {
    role: "user",
    content: [
      "[Task information]",
      `Task title: ${clean(payload.title)}`,
      `Task Type: ${taskType.label} (${taskType.key})`,
      `Task Type description: ${taskType.description}`,
      `Task Type characteristics: ${taskType.characteristics.map(item => item.label).join(" · ")}`,
      `Task Type mapping rationale: ${taskType.mappingReason}`,
      `Completion reward: ${clean(payload.reward)}`,
      `Task instructions: ${clean(payload.description)}`,
      `Emotional burden: ${clean(payload.riskLevel)}`,
      `Repetition/focus burden: ${clean(payload.fatigueLevel)}`,
      `What the worker will do: ${clean(payload.objective)}`,
      `Social contribution of the task: ${clean(payload.socialImpact)}`,
      `Situations the worker may encounter: ${clean(payload.workerContext)}`,
      `Time limit per single task: ${clean(payload.timeLimitMinutes)} minutes`,
      "",
      "[Pre-task final message design criteria]",
      `Core strategy: ${coreStrategy}`,
      `Supporting strategy: ${supportingStrategy}`,
      "finalBeforeText should be built around Core, with Supporting reinforcing it.",
      "",
      "[Post-task final message design criteria]",
      "Core strategy: Meaningfulness",
      "Supporting strategy: Appreciation/Relatedness",
      "finalAfterText should be built around the concrete meaning of the task's contribution, reinforced by acknowledgment and appreciation of the worker's time, effort, and judgment.",
      "Explain the contribution meaning concretely per Task Type: Annotation/Classification=accuracy, quality, reliability; Data Collection/Creation=future analysis or content-building material; Search/Verification=information accuracy and reliability; Evaluation/Comparison=evaluation and decision-making; Content Moderation=a safe and trustworthy environment; Surveys/Experiments=research findings and understanding users.",
      "",
      "[Response JSON schema]",
      JSON.stringify({
        psychologicalFactors: {
          taskType: taskType.key,
          taskTypeLabel: taskType.label,
          taskTypeReason: taskType.mappingReason,
          taskTypeCharacteristics: taskType.characteristics,
          inferredTaskTypes: [{ type: taskType.label, evidence: "metadata evidence", confidence: 0.7 }],
          primaryTaskType: taskType.label,
          primaryPsychologicalType: taskType.psychologicalType,
          psychologicalBurdens: ["Burden the worker may feel"],
          motivationalFactors: ["Factors that can be used to support motivation"],
          sdtNeeds: selectedFrames.map(frame => frame === "Relatedness" ? "relatedness" : frame.toLowerCase()),
          selectedFrames,
          frameSelectionReason: taskType.mappingReason,
          surveyEvidence: {
            sampleSize: TaskTypeConfig.SURVEY_SAMPLE_SIZE,
            corePercentage: surveySelection.corePercentage,
            supportingPercentage: surveySelection.supportingPercentage,
            messageLength: TaskTypeConfig.MESSAGE_LENGTH_EVIDENCE
          },
          constraintsApplied: ["no pressure", "no exaggeration", "keep concrete criteria"]
        },
        beforeOptions: [
          { label: "Relatedness", frame: "Relatedness", message: "A complete, naturally flowing 4-5 sentence pre-task candidate message" },
          { label: "Competence", frame: "Competence", message: "A complete, naturally flowing 4-5 sentence pre-task candidate message" },
          { label: "Autonomy", frame: "Autonomy", message: "A complete, naturally flowing 4-5 sentence pre-task candidate message" }
        ],
        afterOptions: [
          { label: "Meaning of Contribution", frame: "Meaningfulness", message: "A complete, naturally flowing 4-5 sentence post-task candidate message centered on the concrete use and meaning of the contribution" },
          { label: "Time & Effort Recognition", frame: "Appreciation", message: "A complete, naturally flowing 4-5 sentence post-task candidate message concretely acknowledging the worker's time and effort" },
          { label: "Judgment & Contribution Recognition", frame: "Relatedness", message: "A complete, naturally flowing 4-5 sentence post-task candidate message concretely acknowledging the worker's judgment and contribution" }
        ],
        finalBeforeText: "The final complete 4-5 sentence pre-task message that preserves the Core > Supporting weighting",
        finalAfterText: "The final complete 4-5 sentence post-task message that weighs Meaningfulness > Appreciation/Relatedness, includes the Task-Type-specific contribution meaning and acknowledgment of time/effort/judgment, and ends with exactly 'Have a great day!'",
        structuredPromptSummary: "Prompt structure summary"
      }, null, 2)
    ].join("\n")
  }
  ];
};

const parseModelJson = (content) => {
  const trimmed = String(content || "").trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(candidate.slice(start, end + 1));
    throw new Error("Could not parse model response as JSON.");
  }
};

const normalizeMessageText = (message) => String(message || "")
  .replace(/["“”]/g, "")
  .replace(/\s+/g, " ")
  .trim();

const BEFORE_STRATEGIES = ["Relatedness", "Competence", "Autonomy"];
const STRATEGY_LEAK_RE = /\b(?:Relatedness|Competence|Autonomy)\b/i;
const sentenceCount = (message) => (normalizeMessageText(message).match(/[^.!?]+[.!?]+(?=\s|$)/g) || []).length;
const inferBeforeStrategy = (option = {}) => {
  const metadata = `${option.frame || ""} ${option.label || ""}`;
  return BEFORE_STRATEGIES.find(strategy => new RegExp(`\\b${strategy}\\b`, "i").test(metadata)) || "";
};
const matchesBeforeStrategy = (message, strategy) => {
  const text = normalizeMessageText(message).toLowerCase();
  if (strategy === "Relatedness") return /(participat|contribut|shared|together|project|result|purpose|respect|value)/.test(text);
  if (strategy === "Competence") {
    const competenceSignal = /(criteri|distinction|context|accur|consisten|careful|evidence|guideline|judg|detail)/.test(text);
    const autonomyHeavy = /(comfortable pace|own pace|preferred order|whatever order|free to choose|take a break|self-regulat)/.test(text);
    return competenceSignal && !autonomyHeavy;
  }
  return /(choose|choice|own judgment|approach|order|pace|decide|control|flexib|within the guidelines)/.test(text);
};
const safeBeforeFallback = (strategy, payload = {}) => {
  const goal = clean(payload.objective) || "review the provided items according to the task instructions";
  if (strategy === "Relatedness") return `Your participation connects the goal of this task—to ${goal}—with the material the project needs. The time and attention you contribute are respected as part of that shared effort. Each completed item becomes part of the overall result that the requester will use for the stated purpose. Thank you for adding your perspective and care to the work.`;
  if (strategy === "Competence") return `The instructions provide clear criteria for the work of ${goal}. Your ability to notice fine distinctions and interpret each item in context is well suited to this task. Applying the same criteria carefully across items will support accurate and consistent results. We trust you can handle difficult cases by comparing the available evidence with the guidelines.`;
  return `The goal of this task is to ${goal}. Within the provided guidelines, you can choose how to approach each item and which details to examine first. You may set your own working order and pace while staying within the task requirements. If an item is ambiguous, use the available options and your own judgment rather than forcing a conclusion.`;
};
const normalizeBeforeOptions = (options, payload = {}) => {
  const source = Array.isArray(options) ? options : [];
  const used = new Set();
  const validation = [];
  const normalized = BEFORE_STRATEGIES.map(strategy => {
    const index = source.findIndex((option, candidateIndex) => !used.has(candidateIndex) && inferBeforeStrategy(option) === strategy);
    if (index >= 0) used.add(index);
    const original = index >= 0 ? source[index] : null;
    const originalMessage = normalizeMessageText(original?.message);
    const valid = sentenceCount(originalMessage) >= 4
      && sentenceCount(originalMessage) <= 5
      && !STRATEGY_LEAK_RE.test(originalMessage)
      && matchesBeforeStrategy(originalMessage, strategy);
    validation.push({ strategy, sourceIndex: index, reordered: index !== BEFORE_STRATEGIES.indexOf(strategy), corrected: !valid });
    return { label: strategy, frame: strategy, message: valid ? originalMessage : safeBeforeFallback(strategy, payload) };
  });
  return { options: normalized, validation };
};

const ensureBeforeOpening = (message, title, lang) => {
  if (lang === "en") {
    const opening = `Hello! Thank you for taking part in the ${clean(title)} task.`;
    const body = normalizeMessageText(message).replace(/^hello[,!.]\s*thank you for (?:taking part in|participating in)\s*.+?\s*task[.!]?\s*/i, "");
    return normalizeMessageText(`${opening} ${body}`);
  }
  const opening = `안녕하세요. ${clean(title)}에 참여해 주셔서 감사합니다.`;
  const body = normalizeMessageText(message).replace(/^안녕하세요[,.]\s*.+?에\s*참여해\s*주셔서\s*감사합니다[.!]?\s*/i, "");
  return normalizeMessageText(`${opening} ${body}`);
};

const CLOSING_LINE_KO = "좋은 하루 되시길 바랍니다!";
const CLOSING_LINE_EN = "Have a great day!";

const ensureAfterClosing = (message, lang) => {
  if (lang === "en") {
    const body = normalizeMessageText(message).replace(/\s*have\s*(?:a|an)?\s*(?:great|good|nice|wonderful)\s*day[^.!?]*[.!?]?\s*$/i, "");
    return normalizeMessageText(`${body} ${CLOSING_LINE_EN}`);
  }
  const body = normalizeMessageText(message).replace(/\s*좋은\s*하루[^.!?]*[.!?]?\s*$/i, "");
  return normalizeMessageText(`${body} ${CLOSING_LINE_KO}`);
};

const normalizeGeneratedMessageContent = (parsed, payload) => {
  const lang = payload.lang === "en" ? "en" : "ko";
  const beforeResult = normalizeBeforeOptions(parsed.beforeOptions, payload);
  parsed.beforeOptions = beforeResult.options;
  parsed.beforeStrategyValidation = beforeResult.validation;
  for (const optionKey of ["afterOptions"]) {
    if (!Array.isArray(parsed[optionKey])) continue;
    parsed[optionKey] = parsed[optionKey].map(option => ({
      ...option,
      message: normalizeMessageText(option?.message)
    }));
  }
  if (parsed.finalBeforeText) parsed.finalBeforeText = ensureBeforeOpening(parsed.finalBeforeText, payload.title, lang);
  if (parsed.finalAfterText) parsed.finalAfterText = ensureAfterClosing(parsed.finalAfterText, lang);
  return parsed;
};

const applyGenerationMetadata = (parsed, payload) => {
  const { taskType, selectedFrames, coreStrategy, supportingStrategy, surveySelection } = resolveGenerationSelection(payload);
  parsed.selectedFrames = selectedFrames;
  parsed.psychologicalFactors = {
    ...(parsed.psychologicalFactors || {}),
    taskType: taskType.key,
    taskTypeLabel: taskType.label,
    taskTypeReason: taskType.mappingReason,
    coreStrategy,
    supportingStrategy,
    selectedFrames,
    surveyEvidence: {
      sampleSize: TaskTypeConfig.SURVEY_SAMPLE_SIZE,
      corePercentage: surveySelection.corePercentage,
      supportingPercentage: surveySelection.supportingPercentage,
      messageLength: TaskTypeConfig.MESSAGE_LENGTH_EVIDENCE
    }
  };
  return parsed;
};

module.exports = async (req, res) => {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed." });

  const provider = resolveAIProvider();
  const apiKey = provider === "openai"
    ? process.env.OPENAI_API_KEY || ""
    : process.env.UPSTAGE_API_KEY || "";
  if (!apiKey) {
    const variable = provider === "openai" ? "OPENAI_API_KEY" : "UPSTAGE_API_KEY";
    return json(res, 500, { error: `${variable} environment variable is not set.` });
  }

  try {
    const payload = req.body || {};
    const buildPromptMessages = payload.lang === "en" ? buildMessagesEn : buildMessages;
    if (provider === "openai") {
      const apiUrl = normalizeOpenAIApiUrl(process.env.OPENAI_API_URL);
      const model = process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;
      const reasoningEffort = String(process.env.OPENAI_REASONING_EFFORT || "low").trim();
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          input: buildPromptMessages(payload),
          max_output_tokens: 5000,
          reasoning: { effort: reasoningEffort }
        })
      });

      const rawText = await response.text();
      if (!response.ok) throw new Error(summarizeOpenAIError(response.status, rawText));

      const transport = JSON.parse(rawText);
      const content = extractOpenAIText(transport);
      if (!content) throw new Error("OpenAI API response did not include output text.");

      const parsed = normalizeGeneratedMessageContent(
        applyGenerationMetadata(parseModelJson(content), payload),
        payload
      );

      return json(res, 200, {
        provider: "openai",
        model: transport.model || model,
        usage: transport.usage || null,
        ...parsed
      });
    }

    const apiUrl = normalizeUpstageApiUrl(process.env.UPSTAGE_API_URL);
    const model = process.env.UPSTAGE_MODEL || "solar-pro2";
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: buildPromptMessages(payload),
        temperature: 0.35,
        max_tokens: 3200,
        stream: false
      })
    });

    const rawText = await response.text();
    if (!response.ok) throw new Error(summarizeUpstageError(response.status, rawText));

    const transport = JSON.parse(rawText);
    const content = transport.choices?.[0]?.message?.content;
    if (!content) throw new Error("Upstage API response did not include message content.");

    const parsed = normalizeGeneratedMessageContent(
      applyGenerationMetadata(parseModelJson(content), payload),
      payload
    );

    json(res, 200, {
      provider: "upstage",
      model: transport.model || model,
      usage: transport.usage || null,
      ...parsed
    });
  } catch (error) {
    json(res, 502, { error: error.message });
  }
};

module.exports._test = { normalizeBeforeOptions, sentenceCount, matchesBeforeStrategy, safeBeforeFallback };
