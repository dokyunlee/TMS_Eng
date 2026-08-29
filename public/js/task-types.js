/**
 * Shared Task Type registry. The requester chooses one type directly and each
 * type uses the fixed strategy order from the supplied analysis figure.
 */
(function attachTaskTypeConfig(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TaskTypeConfig = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createTaskTypeConfig() {
  const STRATEGY_LABELS = {
    autonomy: "Autonomy",
    competence: "Competence",
    appreciation: "Relatedness"
  };

  // Keep the terminology reported by the survey separate from the labels used
  // by the message-design system. The evidence table preserves the source data.
  const SURVEY_STRATEGY_LABELS = {
    autonomy: "Autonomy",
    competence: "Competence",
    appreciation: "Relatedness"
  };

  const SURVEY_SAMPLE_SIZE = 120;
  const MESSAGE_LENGTH_EVIDENCE = {
    operationalizedLength: "4–5 sentences",
    preferredCategory: "Medium",
    sampleSize: SURVEY_SAMPLE_SIZE,
    responses: {
      short: { count: 17, percentage: 14.2 },
      medium: { count: 80, percentage: 66.7 },
      long: { count: 23, percentage: 19.2 }
    }
  };

  const FRAME_PHASE_KEYWORDS = {
    Autonomy: {
      before: "comfortable pace and choice",
      after: "self-directed effort"
    },
    Competence: {
      before: "careful judgment and accuracy",
      after: "accuracy and careful judgment"
    },
    Relatedness: {
      before: "connection and contribution",
      after: "contribution and shared purpose"
    }
  };

  const TASK_TYPES = {
    annotation_classification: {
      key: "annotation_classification",
      label: "Annotation & Classification",
      shortLabel: "Annotation & Classification",
      description: "이미지·텍스트·오디오·비디오의 항목을 표시하거나 정해진 범주로 분류하는 작업",
      descriptionEn: "Tasks that label items in images, text, audio, or video, or sort them into fixed categories",
      exampleSummary: "Labeling · Object detection · Categorization",
      examples: ["Image or text labeling", "Object detection", "Information categorization"],
      characteristics: [
        { key: "consistent_criteria", label: "Consistent criteria" },
        { key: "repeated_judgment", label: "Repeated judgment" },
        { key: "worker_discretion", label: "Worker discretion" }
      ],
      strategyOrder: ["autonomy", "competence", "appreciation"],
      strategyEvidence: { autonomy: 58.3, competence: 54.2, appreciation: 41.7 },
      psychologicalType: "주석·분류 작업",
      psychologicalTypeEn: "Annotation & classification task",
      burden: "반복 판단과 모호한 경계에서 생길 수 있는 집중 부담",
      burdenEn: "Focus strain from repeated judgment calls and ambiguous edge cases",
      purpose: "판단 방식과 속도를 존중하고 정확하게 분류할 수 있다는 신뢰를 보완적으로 전달",
      purposeEn: "Respect the worker's own judgment and pace, and reinforce trust in their ability to classify accurately",
      mappingReason: "Annotation & Classification에는 Autonomy를 핵심으로, Competence를 보조로 적용합니다.",
      mappingReasonEn: "Annotation & Classification applies Autonomy as the core strategy and Competence as the supporting strategy.",
      reviewReasons: {
        autonomy: "안내 기준 안에서 Worker가 자신의 판단 방식과 속도를 조절할 수 있음을 분명히 합니다.",
        competence: "일관된 기준을 적용해 분류할 수 있는 Worker의 판단 능력을 신뢰합니다.",
        relatedness: "시간과 기여를 구체적으로 인정하되 과도한 의미를 부여하지 않습니다."
      },
      reviewReasonsEn: {
        autonomy: "Makes clear that, within the guidelines, the worker can adjust their own judgment and pace.",
        competence: "Trusts the worker's ability to classify consistently by applying the given criteria.",
        relatedness: "Acknowledges the time and contribution concretely without overstating its significance."
      }
    },
    data_collection_creation: {
      key: "data_collection_creation",
      label: "Data Collection / Creation",
      shortLabel: "Data Collection / Creation",
      description: "데이터를 기록·입력·전사·번역하거나 콘텐츠를 작성하고 편집하는 작업",
      descriptionEn: "Tasks that record, enter, transcribe, or translate data, or write and edit content",
      exampleSummary: "Recording · Data entry · Writing & editing",
      examples: ["Audio or video recording", "Transcription or translation", "Writing or AI-assisted editing"],
      characteristics: [
        { key: "production_choices", label: "Production choices" },
        { key: "creative_judgment", label: "Creative judgment" },
        { key: "time_and_effort", label: "Time and effort" }
      ],
      strategyOrder: ["autonomy", "appreciation", "competence"],
      strategyEvidence: { autonomy: 57.9, appreciation: 45.6, competence: 38.6 },
      psychologicalType: "데이터 수집·생성 작업",
      psychologicalTypeEn: "Data collection & creation task",
      burden: "작성 방식 선택과 결과물을 완성하는 과정에서 생길 수 있는 부담",
      burdenEn: "Strain from choosing an approach and seeing the piece through to completion",
      purpose: "자신의 방식으로 수행할 수 있음을 중심에 두고 시간과 노력을 인정",
      purposeEn: "Center the worker's freedom to work their own way, and acknowledge their time and effort",
      mappingReason: "Data Collection / Creation에는 Autonomy를 핵심으로, Relatedness를 보조로 적용합니다.",
      mappingReasonEn: "Data Collection / Creation applies Autonomy as the core strategy and Relatedness as the supporting strategy.",
      reviewReasons: {
        autonomy: "요구 범위 안에서 Worker가 편한 방식과 순서로 결과물을 만들 수 있음을 안내합니다.",
        competence: "필요한 자료를 만들고 다듬을 수 있는 수행 능력을 차분하게 신뢰합니다.",
        relatedness: "결과물을 만드는 데 들인 시간과 노력을 구체적으로 인정합니다."
      },
      reviewReasonsEn: {
        autonomy: "Notes that, within the requested scope, the worker can produce the output in whatever way and order suits them.",
        competence: "Calmly trusts the worker's ability to produce and refine the needed material.",
        relatedness: "Concretely acknowledges the time and effort put into producing the output."
      }
    },
    search_verification: {
      key: "search_verification",
      label: "Search / Verification",
      shortLabel: "Search / Verification",
      description: "정보를 찾고 사실·세부 내용을 확인하거나 중복과 형식을 정리하는 작업",
      descriptionEn: "Tasks that search for information, verify facts and details, or clean up duplicates and formatting",
      exampleSummary: "Search · Fact-checking · Data clean-up",
      examples: ["Information search", "Fact-checking", "Duplicate removal or formatting"],
      characteristics: [
        { key: "source_checking", label: "Source checking" },
        { key: "accuracy", label: "Accuracy" },
        { key: "detail_review", label: "Detail review" }
      ],
      strategyOrder: ["competence", "appreciation", "autonomy"],
      strategyEvidence: { competence: 70.3, appreciation: 48.6, autonomy: 37.8 },
      psychologicalType: "검색·검증 작업",
      psychologicalTypeEn: "Search & verification task",
      burden: "여러 출처와 세부 정보를 대조하는 과정에서 생길 수 있는 정확도 부담",
      burdenEn: "Accuracy pressure from cross-checking multiple sources and details",
      purpose: "근거를 확인하는 판단 능력을 중심에 두고 세심한 노력과 기여를 인정",
      purposeEn: "Center the worker's judgment in verifying evidence, and acknowledge their careful effort and contribution",
      mappingReason: "Search / Verification에는 Competence를 핵심으로, Relatedness를 보조로 적용합니다.",
      mappingReasonEn: "Search / Verification applies Competence as the core strategy and Relatedness as the supporting strategy.",
      reviewReasons: {
        autonomy: "확인 가능한 근거 안에서 Worker가 판단 순서와 방식을 조절할 수 있게 합니다.",
        competence: "출처를 대조하고 세부 정보를 확인하는 Worker의 수행 능력을 신뢰합니다.",
        relatedness: "정확성을 높이기 위해 들인 시간과 세심한 노력을 인정합니다."
      },
      reviewReasonsEn: {
        autonomy: "Lets the worker adjust their own order and approach to checking, within the available evidence.",
        competence: "Trusts the worker's ability to cross-check sources and verify details.",
        relatedness: "Acknowledges the time and careful effort spent improving accuracy."
      }
    },
    evaluation_comparison: {
      key: "evaluation_comparison",
      label: "Evaluation / Comparison",
      shortLabel: "Evaluation / Comparison",
      description: "AI 응답, 검색 결과, 제품 또는 서비스를 같은 기준으로 평가하고 비교하는 작업",
      descriptionEn: "Tasks that evaluate and compare AI responses, search results, products, or services against the same criteria",
      exampleSummary: "AI response rating · Result comparison",
      examples: ["AI response evaluation", "Search result rating", "Product or service comparison"],
      characteristics: [
        { key: "comparative_judgment", label: "Comparative judgment" },
        { key: "criteria_application", label: "Criteria application" },
        { key: "reasoned_choice", label: "Reasoned choice" }
      ],
      strategyOrder: ["competence", "autonomy", "appreciation"],
      strategyEvidence: { competence: 54.0, autonomy: 46.0, appreciation: 41.4 },
      psychologicalType: "평가·비교 작업",
      psychologicalTypeEn: "Evaluation & comparison task",
      burden: "비슷한 대안을 같은 기준으로 비교하고 판단해야 하는 부담",
      burdenEn: "Strain from comparing similar alternatives against the same criteria and forming a judgment",
      purpose: "비교 판단 능력을 중심에 두고 Worker의 독립적인 선택을 존중",
      purposeEn: "Center the worker's comparative judgment and respect their independent choice",
      mappingReason: "Evaluation / Comparison에는 Competence를 핵심으로, Autonomy를 보조로 적용합니다.",
      mappingReasonEn: "Evaluation / Comparison applies Competence as the core strategy and Autonomy as the supporting strategy.",
      reviewReasons: {
        autonomy: "정답을 강요하기보다 제시된 기준 안에서 Worker의 독립적인 판단을 존중합니다.",
        competence: "차이를 살피고 기준에 따라 평가할 수 있는 Worker의 판단 능력을 신뢰합니다.",
        relatedness: "평가에 들인 시간과 기여를 구체적으로 인정합니다."
      },
      reviewReasonsEn: {
        autonomy: "Respects the worker's independent judgment within the given criteria, rather than pushing toward one answer.",
        competence: "Trusts the worker's ability to spot differences and evaluate against the criteria.",
        relatedness: "Concretely acknowledges the time and contribution put into the evaluation."
      }
    },
    content_moderation: {
      key: "content_moderation",
      label: "Content Moderation",
      shortLabel: "Content Moderation",
      description: "유해하거나 공격적이거나 부적절할 수 있는 콘텐츠를 검토하고 분류하는 작업",
      descriptionEn: "Tasks that review and classify content that may be harmful, offensive, or inappropriate",
      exampleSummary: "Harmful content · Safety review",
      examples: ["Harmful content review", "Offensive content classification", "Safety policy review"],
      characteristics: [
        { key: "sensitive_content", label: "Sensitive content" },
        { key: "emotional_effort", label: "Emotional effort" },
        { key: "policy_judgment", label: "Policy judgment" }
      ],
      strategyOrder: ["appreciation", "autonomy", "competence"],
      strategyEvidence: { appreciation: 59.1, autonomy: 45.5, competence: 36.4 },
      psychologicalType: "콘텐츠 모더레이션 작업",
      psychologicalTypeEn: "Content moderation task",
      burden: "불편할 수 있는 콘텐츠 노출과 정책 기준 적용에서 생기는 정서적 부담",
      burdenEn: "Emotional strain from exposure to uncomfortable content and applying policy criteria",
      purpose: "부담이 있는 작업에 들인 시간과 노력을 인정하고 속도와 판단에 대한 통제감을 보완",
      purposeEn: "Acknowledge the time and effort spent on demanding work, and reinforce a sense of control over pace and judgment",
      mappingReason: "Content Moderation에는 Relatedness를 핵심으로, Autonomy를 보조로 적용합니다.",
      mappingReasonEn: "Content Moderation applies Relatedness as the core strategy and Autonomy as the supporting strategy.",
      reviewReasons: {
        autonomy: "불편할 때 잠시 멈추거나 안내 기준 안에서 자신의 속도로 판단할 수 있음을 알립니다.",
        competence: "정책 기준을 적용하는 Worker의 판단 능력을 과장 없이 신뢰합니다.",
        relatedness: "부담이 있는 콘텐츠를 검토하는 데 들인 시간과 노력을 분명하게 인정합니다."
      },
      reviewReasonsEn: {
        autonomy: "Lets the worker know they can pause when uncomfortable, or judge at their own pace within the guidelines.",
        competence: "Trusts the worker's ability to apply policy criteria, without overstating it.",
        relatedness: "Clearly acknowledges the time and effort spent reviewing demanding content."
      }
    },
    surveys_experiments: {
      key: "surveys_experiments",
      label: "Surveys / Experiments",
      shortLabel: "Surveys / Experiments",
      description: "학술·시장·행동·사용성 연구를 위한 설문이나 온라인 실험에 참여하는 작업",
      descriptionEn: "Tasks that take part in surveys or online experiments for academic, market, behavioral, or usability research",
      exampleSummary: "Surveys · Behavioral studies · Usability",
      examples: ["Academic survey", "Market research", "Behavioral or usability study"],
      characteristics: [
        { key: "participant_input", label: "Participant input" },
        { key: "subjective_response", label: "Subjective response" },
        { key: "research_contribution", label: "Research contribution" }
      ],
      strategyOrder: ["appreciation", "autonomy", "competence"],
      strategyEvidence: { appreciation: 53.8, autonomy: 48.1, competence: 29.2 },
      psychologicalType: "설문·온라인 실험",
      psychologicalTypeEn: "Survey or online experiment",
      burden: "개인 의견과 시간을 제공하지만 결과 활용 맥락이 바로 보이지 않을 수 있음",
      burdenEn: "Contributing personal opinions and time without always seeing how the results will be used",
      purpose: "참여자의 시간과 응답 가치를 인정하고 자신의 판단에 따라 응답할 수 있음을 보완",
      purposeEn: "Acknowledge the participant's time and the value of their response, and reinforce their freedom to answer based on their own judgment",
      mappingReason: "Surveys / Experiments에는 Relatedness를 핵심으로, Autonomy를 보조로 적용합니다.",
      mappingReasonEn: "Surveys / Experiments applies Relatedness as the core strategy and Autonomy as the supporting strategy.",
      reviewReasons: {
        autonomy: "정답을 유도하지 않고 Worker가 자신의 판단과 경험에 따라 응답할 수 있게 합니다.",
        competence: "질문을 읽고 자신의 경험을 바탕으로 응답할 수 있음을 명확하게 안내합니다.",
        relatedness: "연구에 제공한 시간과 응답의 가치를 구체적으로 인정합니다."
      },
      reviewReasonsEn: {
        autonomy: "Lets the worker answer based on their own judgment and experience, without steering toward a 'right' answer.",
        competence: "Clearly guides the worker to answer based on reading the question and drawing on their own experience.",
        relatedness: "Concretely acknowledges the time given to the research and the value of their response."
      }
    }
  };

  const DEFAULT_TASK_TYPE = "annotation_classification";

  const normalizeTaskTypeKey = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (TASK_TYPES[raw]) return raw;
    return Object.keys(TASK_TYPES).find(key => TASK_TYPES[key].label === raw || TASK_TYPES[key].shortLabel === raw) || "";
  };

  const localizeTaskType = (type, lang) => {
    if (!type || lang !== "en") return type;
    return {
      ...type,
      description: type.descriptionEn || type.description,
      psychologicalType: type.psychologicalTypeEn || type.psychologicalType,
      burden: type.burdenEn || type.burden,
      purpose: type.purposeEn || type.purpose,
      mappingReason: type.mappingReasonEn || type.mappingReason,
      reviewReasons: type.reviewReasonsEn || type.reviewReasons
    };
  };

  const getTaskType = (value, lang) => localizeTaskType(TASK_TYPES[normalizeTaskTypeKey(value)] || null, lang);
  const getStrategyLabel = (value) => STRATEGY_LABELS[String(value || "").toLowerCase()] || "";
  const getFramePhaseKeyword = (frame, phase = "before") => {
    const normalizedFrame = getStrategyLabel(frame) || String(frame || "");
    const normalizedPhase = phase === "after" ? "after" : "before";
    return FRAME_PHASE_KEYWORDS[normalizedFrame]?.[normalizedPhase] || "";
  };

  const getStrategySelection = (taskTypeValue) => {
    const type = getTaskType(taskTypeValue) || TASK_TYPES[DEFAULT_TASK_TYPE];
    const [core, supporting, third] = type.strategyOrder;
    return {
      taskType: type.key,
      taskTypeLabel: type.label,
      coreStrategy: getStrategyLabel(core),
      supportingStrategy: getStrategyLabel(supporting),
      thirdStrategy: getStrategyLabel(third),
      corePercentage: type.strategyEvidence[core],
      supportingPercentage: type.strategyEvidence[supporting],
      thirdPercentage: type.strategyEvidence[third],
      selectedFrames: [getStrategyLabel(core), getStrategyLabel(supporting)]
    };
  };

  const analyzeSDTNeeds = (input = {}) => {
    const type = getTaskType(input.taskType) || TASK_TYPES[DEFAULT_TASK_TYPE];
    const selection = getStrategySelection(type.key);
    return {
      needs: type.strategyOrder.slice(0, 2).map(strategy => strategy === "appreciation" ? "relatedness" : strategy),
      frames: selection.selectedFrames,
      strategyOrder: type.strategyOrder.map(getStrategyLabel),
      coreStrategy: selection.coreStrategy,
      supportingStrategy: selection.supportingStrategy,
      thirdStrategy: selection.thirdStrategy,
      taskType: type.key,
      taskTypeLabel: type.label
    };
  };

  return {
    TASK_TYPES,
    DEFAULT_TASK_TYPE,
    STRATEGY_LABELS,
    SURVEY_STRATEGY_LABELS,
    FRAME_PHASE_KEYWORDS,
    SURVEY_SAMPLE_SIZE,
    MESSAGE_LENGTH_EVIDENCE,
    normalizeTaskTypeKey,
    getTaskType,
    localizeTaskType,
    getStrategyLabel,
    getFramePhaseKeyword,
    getStrategySelection,
    analyzeSDTNeeds
  };
});
