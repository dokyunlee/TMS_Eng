/**
 * Agentic Crowdsourcing App Controller (Korean Localized Version)
 * Manages view routing, local state, interactive SVGs, 3-Option psychological selectors,
 * Ground-Truth correction loop, Intrinsic motivation survey (NASA-TLX removed), and JSON results export.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Initialize AI Generator
  const aiGenerator = new AgenticMotivationGenerator();

  // App State
  let currentTask = null;
  let activeWorkerTask = null;

  // Real-time local draft persistence helper
  const saveDraftToStorage = () => {
    if (!currentTask) return;
    const tasks = JSON.parse(localStorage.getItem("agentic_tasks")) || {};
    const draftTask = {
      ...currentTask,
      id: currentTask.id || "task-draft",
      createdAt: currentTask.createdAt || new Date().toISOString()
    };
    tasks[draftTask.id] = draftTask;
    try {
      localStorage.setItem("agentic_tasks", JSON.stringify(tasks));
    } catch {
      showToast("Failed to save a temporary draft in the browser. Please use the deploy save instead.");
    }
  };
  let workerSession = {
    sessionId: null,
    taskId: null,
    status: "opened",
    progress: 0,
    totalItems: 10,
    timerSeconds: 900,
    timerInterval: null,
    timerSpeed: 1,
    selectedOption: null,
    category: "general",
    openedAt: null,
    taskStartedAt: null,
    startedAt: null,
    completedAt: null,
    lastSeenAt: null,
    itemStartedAt: null,
    attemptedItems: 0,
    scoredItems: 0,
    correctItems: 0,
    responses: []
  };

  // Seeding initial default task in localStorage for instant demonstration
  const seedDefaultTask = () => {
    const tasks = JSON.parse(localStorage.getItem("agentic_tasks")) || {};
    // Overwrite default seed task to keep it fresh and perfectly matched
    const defaultTask = {
      id: "task-seed-101",
      title: "Suspected Tumor Lesion Diagnosis from Chest X-Ray Review",
      category: "medical",
      reward: "2.50",
      timeLimitMinutes: "15",
      description: `### Task Overview
We are building training data for "chest X-ray review." The goal is to carefully review the provided chest radiographs and accurately classify suspected tumor tissue or abnormal lesions.

### Detailed Guidelines & Classification Rules
1. Review the provided X-ray scan images as carefully as possible. Watch for subtle abnormal shadows or irregular density differences distributed across the tissue.
2. Identify the internal shape of the target area and choose the most accurate classification option (Normal, Abnormality Found, Unable to Judge).
3. If the image is heavily distorted or cannot be identified with confidence, do not force a guess — choose the most conservative option available.

### Diligence Pledge
By taking part in this project, you agree to give the task your full attention. The careful judgment behind each label you assign helps improve the health accuracy of medical diagnostic algorithms and becomes part of the safety net protecting patients' precious lives. Thank you!`,
      beforeText: "Welcome! Thank you sincerely for joining this valuable annotation study with us today. The work you'll be doing here is not a simple clicking task. By carefully reviewing the fine shapes of suspected tumor lesions in chest X-ray scan images, you are directly contributing to protecting patients' precious lives and maximizing the clinical reliability of early disease-diagnosis AI technology. You may feel a sense of isolation amid the repetitive pace, but the ground-truth data woven from your careful eye will become an invisible safety net for our society and a precious link in protecting life. We sincerely honor your contribution as you take part with such a strong sense of responsibility.",
      afterText: "You've completed an extraordinary contribution! Thanks to your valuable participation, the entire annotation labeling process is now fully complete. The precise judgments you diligently provided have been carefully structured, ultimately becoming a key cornerstone that advances the field of medical research and lesion diagnosis. We offer our warmest thanks to you for working together toward the safety and progress of this technology. Your reward of $2.50, approved for your dedicated contribution, has been securely confirmed and immediately processed for payment to your account. Thank you for your hard work!",
      theme: "Medical Research & Diagnostics",
      createdAt: new Date().toISOString(),
      riskLevel: "medium",
      fatigueLevel: "medium",
      objective: "Identify the fine shape of suspected tumor lesions in chest X-ray scan images",
      socialImpact: "Help save patients' lives and improve the health accuracy of medical diagnostic algorithms",
      workerContext: "A remote work environment focused on reviewing fine tissue detail on a monitor over long, fatiguing sessions"
    };
    tasks[defaultTask.id] = defaultTask;
    localStorage.setItem("agentic_tasks", JSON.stringify(tasks));
  };

  // Do not seed a realistic-looking result. The requester starts from a true empty state.
  const storedTasksAtStart = JSON.parse(localStorage.getItem("agentic_tasks") || "{}");
  if (storedTasksAtStart["task-seed-101"]) {
    delete storedTasksAtStart["task-seed-101"];
    localStorage.setItem("agentic_tasks", JSON.stringify(storedTasksAtStart));
  }

  // DOM Elements - General Router
  const requesterView = document.getElementById("requester-view");
  const workerView = document.getElementById("worker-view");
  const navTabRequester = document.getElementById("nav-tab-requester");
  const navTabWorker = document.getElementById("nav-tab-worker");

  // DOM Elements - Requester Form
  const taskForm = document.getElementById("task-form");
  const btnGenerate = document.getElementById("btn-generate");
  const btnPublish = document.getElementById("btn-publish");
  const btnResetForm = document.getElementById("btn-reset-form");
  const formCompletionText = document.getElementById("form-completion-text");
  const formCompletionFill = document.getElementById("form-completion-fill");

  const taskTitleBox = document.getElementById("task-title");
  const taskRewardBox = document.getElementById("task-reward");
  const taskTimeLimitBox = document.getElementById("task-time-limit");
  const taskDescBox = document.getElementById("task-desc");
  const taskRiskLevelSelect = document.getElementById("task-risk-level");
  const taskFatigueLevelSelect = document.getElementById("task-fatigue-level");
  const taskObjectiveBox = document.getElementById("task-objective");
  const taskSocialImpactBox = document.getElementById("task-social-impact");
  const taskWorkerContextBox = document.getElementById("task-worker-context");
  const taskTypeOptions = document.getElementById("task-type-options");
  const surveyEvidenceTableBody = document.getElementById("survey-evidence-table-body");
  const workerBeforeFrameKeywords = document.getElementById("worker-before-frame-keywords");
  const workerAfterFrameKeywords = document.getElementById("worker-after-frame-keywords");
  const exampleHelpButtons = [...document.querySelectorAll(".example-help-btn")];
  const exampleTaskPresets = document.getElementById("example-task-presets");
  const platformOverview = document.getElementById("platform-overview");
  const whyMotivation = document.getElementById("why-motivation");
  const whySdt = document.getElementById("why-sdt");
  const howItWorks = document.getElementById("how-it-works");
  const btnStartDesigning = document.getElementById("btn-start-designing");
  const btnWorkspaceSdt = document.getElementById("btn-workspace-sdt");
  const navWhySdt = document.getElementById("nav-why-sdt");
  const navHowItWorks = document.getElementById("nav-how-it-works");
  const navWorkspace = document.getElementById("nav-workspace");
  const workspaceShell = document.getElementById("workspace-shell");
  const requesterWorkspace = document.getElementById("requester-workspace");
  const requesterProgress = document.getElementById("requester-progress");

  const aiLogBox = document.getElementById("ai-log-box");
  const generationMonitorBar = document.getElementById("generation-monitor-bar");
  const previewContainer = document.getElementById("preview-container");
  const reviewEmptyState = document.getElementById("review-empty-state");
  const generationEditNotice = document.getElementById("generation-edit-notice");
  const btnRestartGeneration = document.getElementById("btn-restart-generation");
  const beforeTextBox = document.getElementById("before-text");
  const afterTextBox = document.getElementById("after-text");
  const finalBeforeTextBox = document.getElementById("final-before-text");
  const finalAfterTextBox = document.getElementById("final-after-text");
  const psychologyFactorPanel = document.getElementById("psychology-factor-panel");
  const llmProviderBadge = document.getElementById("llm-provider-badge");
  const factorTaskTypes = document.getElementById("factor-task-types");
  const factorSelectedFrames = document.getElementById("factor-selected-frames");
  const factorBurdens = document.getElementById("factor-burdens");
  const factorMotivators = document.getElementById("factor-motivators");
  const reviewCriteriaList = document.getElementById("review-criteria-list");
  const factorTaskCharacteristics = document.getElementById("factor-task-characteristics");
  const factorContextRisk = document.getElementById("factor-context-risk");
  const factorContextFatigue = document.getElementById("factor-context-fatigue");
  const factorContextTime = document.getElementById("factor-context-time");

  const shareCard = document.getElementById("share-card");
  const shareLinkInput = document.getElementById("share-link-input");
  const btnCopyLink = document.getElementById("btn-copy-link");
  const btnOpenWorker = document.getElementById("btn-open-worker");
  const btnExportResults = document.getElementById("btn-export-results");
  const shareCreatedAt = document.getElementById("share-created-at");

  // DOM Elements - Worker Pre-Task
  const workerPreTask = document.getElementById("worker-pre-task");
  const workerWorkspace = document.getElementById("worker-workspace");
  const workerPostTask = document.getElementById("worker-post-task");
  const workerTaskError = document.getElementById("worker-task-error");

  const workerTaskTitle = document.getElementById("worker-task-title");
  const workerTaskReward = document.getElementById("worker-task-reward");
  const workerMotivationPrime = document.getElementById("worker-motivation-prime");
  const workspaceMotivationPrime = document.getElementById("workspace-motivation-prime");
  const workspaceTaskDesc = document.getElementById("workspace-task-desc");
  const workerSpecReward = document.getElementById("worker-spec-reward");
  const workerSpecTimeLimit = document.getElementById("worker-spec-time-limit");
  const btnStartTask = document.getElementById("btn-start-task");
  const workspaceTaskTitle = document.getElementById("workspace-task-title");

  // DOM Elements - Active Labeling Workspace
  const canvasImgContainer = document.getElementById("canvas-image-container");
  const canvasLoading = document.getElementById("canvas-loading");

  const labelProgressText = document.getElementById("label-progress-text");
  const progressBarInner = document.getElementById("progress-bar-inner");
  const labelTimer = document.getElementById("label-timer");

  const labelingQuestion = document.getElementById("labeling-question");
  const optionsWrapper = document.getElementById("options-wrapper");
  const btnSubmitAnnotation = document.getElementById("btn-submit-annotation");

  // DOM Elements - Worker Post-Task Completed
  const postTaskMessageText = document.getElementById("post-task-message-text");
  const postMetricReward = document.getElementById("post-metric-reward");
  const btnWorkerExport = document.getElementById("btn-worker-export");
  const btnBackToRequester = document.getElementById("btn-back-to-requester");

  // Toast Notification System
  const toastNotice = document.getElementById("toast-notice");
  const toastNoticeText = document.getElementById("toast-notice-text");

  const showToast = (message) => {
    toastNoticeText.textContent = message;
    toastNotice.classList.add("show");
    setTimeout(() => {
      toastNotice.classList.remove("show");
    }, 3000);
  };

  const setGenerationStep = (stepName, status = "active") => {
    if (!generationMonitorBar) return;
    const step = generationMonitorBar.querySelector(`[data-step="${stepName}"]`);
    if (!step) return;
    step.classList.remove("active", "done", "warn");
    if (status) step.classList.add(status);
  };

  const resetGenerationMonitor = () => {
    if (!generationMonitorBar) return;
    generationMonitorBar.querySelectorAll(".monitor-step").forEach(step => {
      step.classList.remove("active", "done", "warn");
    });
  };

  const startWaitingLog = (label, intervalMs = 15000) => {
    const startedAt = Date.now();
    addThoughtLog(`Sent the ${label} request. Showing elapsed time so you can track its progress.`, "wait");
    return setInterval(() => {
      const seconds = Math.round((Date.now() - startedAt) / 1000);
      addThoughtLog(`Still processing ${label}... ${seconds}s elapsed`, "wait");
    }, intervalMs);
  };

  // State variables
  let selectedCategory = "general";
  let selectedTaskType = TaskTypeConfig.DEFAULT_TASK_TYPE;
  let synthesizedBeforeOptions = [];
  let synthesizedAfterOptions = [];
  let synthesizedBeforeLabels = ["Relatedness", "Competence", "Autonomy"];
  let synthesizedAfterLabels = ["Connection & Contribution", "Confidence in Judgment", "Autonomy & Choice"];
  let synthesizedBeforeFrames = ["Relatedness", "Competence", "Autonomy"];
  let synthesizedAfterFrames = ["Relatedness", "Competence", "Autonomy"];
  let selectedBeforeOptionIndex = 0;
  let selectedAfterOptionIndex = 0;
  let latestPsychologicalFactors = null;
  let latestStructuredPrompt = "";
  let latestLLMProvider = "local";
  let latestLLMModel = "";
  let isGenerating = false;
  let pendingRegenerate = false;
  let activeGenerationController = null;

  const testCasePresets = {
    annotation_classification: {
      taskType: "annotation_classification",
      category: "general",
      groupLabel: "Annotation and Classification",
      groupExamples: "(e.g., image/text/audio/video labeling, object detection, or information categorization)",
      title: "Road Scene Object Labeling",
      reward: "1.30",
      timeLimitMinutes: "10",
      riskLevel: "low",
      fatigueLevel: "high",
      objective: "Find vehicles, pedestrians, and signs in road images and label them into the specified categories",
      socialImpact: "Used to check the consistency and quality of road scene recognition data",
      workerContext: "An environment where similar images are reviewed repeatedly while applying the same classification criteria",
      description: `### Task Overview
Review the road images and classify vehicles, pedestrians, and signs into the specified categories.

### Worker Task
- Vehicle
- Pedestrian
- Traffic sign`
    },
    data_collection_creation: {
      taskType: "data_collection_creation",
      category: "general",
      groupLabel: "Data Collection, Creation, and Processing",
      groupExamples: "(e.g., audio/video recording, data entry, transcription, translation, writing, or generating/editing content using AI)",
      title: "AI-Assisted Product Description Writing & Editing",
      reward: "1.40",
      timeLimitMinutes: "12",
      riskLevel: "low",
      fatigueLevel: "medium",
      objective: "Generate an AI draft from the provided product information and edit it to be factually accurate",
      socialImpact: "Used to evaluate the quality of product description writing and the AI editing process",
      workerContext: "An environment where short sentences are written within the provided information and errors in the AI draft are corrected",
      description: `### Task Overview
Write a short description based on the provided product information and accurately edit the AI-generated draft.

### Worker Task
- Generate draft
- Check facts
- Edit final copy`
    },
    search_verification: {
      taskType: "search_verification",
      category: "general",
      groupLabel: "Search, Verification, and Data Clean-up",
      groupExamples: "(e.g., information search, fact-checking, removing duplicates, verifying details, or formatting data)",
      title: "Company Information Search & Verification",
      reward: "1.70",
      timeLimitMinutes: "12",
      riskLevel: "medium",
      fatigueLevel: "medium",
      objective: "Find company information from official sources and verify it matches existing data",
      socialImpact: "Used to check the accuracy and duplication of the company information database",
      workerContext: "An environment where multiple sources are cross-checked and name/address formats are standardized to the same criteria",
      description: `### Task Overview
Check the company name and address on the official website and verify whether the provided information is accurate.

### Worker Task
- Search official source
- Verify details
- Remove duplicates or correct formatting`
    },
    evaluation_comparison: {
      taskType: "evaluation_comparison",
      category: "preference",
      groupLabel: "Evaluation and Comparison",
      groupExamples: "(e.g., evaluating AI-generated responses, rating search results, or evaluating products and services)",
      title: "AI Response Quality Comparison",
      reward: "1.20",
      timeLimitMinutes: "8",
      riskLevel: "medium",
      fatigueLevel: "medium",
      objective: "Compare two AI responses on accuracy, relevance, and clarity",
      socialImpact: "Used to check the consistency of AI response evaluation criteria and the quality of the results",
      workerContext: "An environment where two responses are calmly compared against the same criteria and a reasoned choice is made",
      description: `### Task Overview
Read the two AI responses to the same question and compare them on accuracy, relevance, and clarity.

### Worker Task
- Response A is better
- Response B is better
- Similar quality`
    },
    content_moderation: {
      taskType: "content_moderation",
      category: "moderation",
      groupLabel: "Content Moderation and Safety Review",
      groupExamples: "(e.g., reviewing or classifying harmful, offensive, or inappropriate content)",
      title: "Online Comment Harmfulness Classification",
      reward: "1.20",
      timeLimitMinutes: "10",
      riskLevel: "high",
      fatigueLevel: "high",
      objective: "Review each comment and classify it as either Safe or Harmful",
      socialImpact: "Used by community operators to check harmfulness classification criteria and data quality",
      workerContext: "An environment where toned-down example comments for research purposes are read repeatedly and policy criteria are applied",
      description: `### Task Overview
Read the online community comments and classify whether they contain abusive language, hate speech, or offensive content. The examples use only toned-down synthetic sentences for research purposes.

### Worker Task
- Safe
- Harmful`
    },
    surveys_experiments: {
      taskType: "surveys_experiments",
      category: "preference",
      groupLabel: "Surveys and Online Experiments",
      groupExamples: "(e.g., academic surveys, market research, behavioral studies, or usability studies)",
      title: "Product Image Preference Survey",
      reward: "0.80",
      timeLimitMinutes: "5",
      riskLevel: "low",
      fatigueLevel: "low",
      objective: "Choose the product image you prefer between two options",
      socialImpact: "Anonymous preference responses are used as reference material for product image presentation research",
      workerContext: "An environment where a personal preference is simply chosen, with no right answer or high responsibility",
      description: `### Task Overview
Look at the two product images and choose the one you prefer. This task has no right answer — it asks for your personal preference.

### Worker Task
- Image A
- Image B`
    }
  };

  const TASK_CONTEXT_LABELS = {
    moderation: "Content Moderation",
    medical_alert: "Synthetic Medical Alert Verification",
    ocr: "OCR Verification",
    accessibility: "Accessibility Data Review",
    preference: "Preference Survey",
    medical: "Medical Data Review",
    autonomous: "Road Scene Classification",
    general: "General Crowd Task"
  };

  const renderExampleTaskButtons = () => {
    if (!exampleTaskPresets) return;
    exampleTaskPresets.innerHTML = "";
    Object.entries(testCasePresets).forEach(([caseId, preset]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "test-case-btn";
      button.dataset.testCase = caseId;
      const typeLabel = document.createElement("span");
      typeLabel.textContent = preset.groupLabel;
      const title = document.createElement("strong");
      title.textContent = preset.groupExamples;
      button.append(typeLabel, title);
      button.addEventListener("click", () => applyTestCasePreset(caseId));
      exampleTaskPresets.appendChild(button);
    });
  };

  const renderWorkerFrameKeywords = (container, selectedFrames = [], phase = "before") => {
    if (!container) return;
    container.innerHTML = "";
    selectedFrames.slice(0, 2).forEach((frame, index) => {
      const item = document.createElement("span");
      item.dataset.priority = index === 0 ? "core" : "supporting";
      const label = document.createElement("b");
      label.textContent = frame;
      const keyword = TaskTypeConfig.getFramePhaseKeyword(frame, phase);
      item.append(label, document.createTextNode(` — ${keyword}`));
      container.appendChild(item);
    });
  };

  const renderWorkerPreviewFrameKeywords = (taskTypeValue = selectedTaskType) => {
    const selection = TaskTypeConfig.getStrategySelection(taskTypeValue);
    renderWorkerFrameKeywords(workerBeforeFrameKeywords, selection.selectedFrames, "before");
    if (workerAfterFrameKeywords) {
      workerAfterFrameKeywords.innerHTML = "";
      [
        ["Meaningfulness", "contribution to OCR improvement"],
        ["Relatedness", "time and judgment acknowledged"]
      ].forEach(([frame, keyword], index) => {
        const item = document.createElement("span");
        item.dataset.priority = index === 0 ? "core" : "supporting";
        const label = document.createElement("b");
        label.textContent = frame;
        item.append(label, document.createTextNode(` — ${keyword}`));
        workerAfterFrameKeywords.appendChild(item);
      });
    }
  };

  const renderSurveyEvidenceTable = () => {
    if (!surveyEvidenceTableBody) return;
    surveyEvidenceTableBody.innerHTML = "";
    Object.values(TaskTypeConfig.TASK_TYPES).forEach(type => {
      const selection = TaskTypeConfig.getStrategySelection(type.key);
      const [coreKey, supportingKey, thirdKey] = type.strategyOrder;
      const surveyLabels = TaskTypeConfig.SURVEY_STRATEGY_LABELS;
      const row = document.createElement("tr");
      [
        type.label,
        `${surveyLabels[coreKey]} (${selection.corePercentage.toFixed(1)}%)`,
        `${surveyLabels[supportingKey]} (${selection.supportingPercentage.toFixed(1)}%)`,
        `${surveyLabels[thirdKey]} (${selection.thirdPercentage.toFixed(1)}%)`
      ].forEach(value => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
      });
      surveyEvidenceTableBody.appendChild(row);
    });
  };

  const selectTaskType = (taskType, { sync = true } = {}) => {
    const normalized = TaskTypeConfig.normalizeTaskTypeKey(taskType) || TaskTypeConfig.DEFAULT_TASK_TYPE;
    selectedTaskType = normalized;
    taskTypeOptions?.querySelectorAll('input[name="task-type"]').forEach(input => {
      input.checked = input.value === normalized;
      input.closest("label")?.classList.toggle("selected", input.checked);
    });
    if (currentTask) {
      const type = TaskTypeConfig.getTaskType(normalized);
      currentTask.taskType = normalized;
      currentTask.taskTypeLabel = type?.label || "";
    }
    renderWorkerPreviewFrameKeywords(normalized);
    if (isGenerating) generationEditNotice?.classList.remove("hidden");
    if (sync && typeof syncFormToDraft === "function") syncFormToDraft();
  };

  const renderTaskTypeOptions = () => {
    if (!taskTypeOptions) return;
    taskTypeOptions.innerHTML = "";
    Object.values(TaskTypeConfig.TASK_TYPES).forEach(type => {
      const card = document.createElement("label");
      card.className = "task-type-card";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "task-type";
      input.value = type.key;
      input.checked = type.key === selectedTaskType;
      const copy = document.createElement("span");
      const title = document.createElement("strong");
      title.textContent = type.shortLabel;
      const example = document.createElement("small");
      example.textContent = type.exampleSummary;
      copy.append(title, example);
      card.append(input, copy);
      card.classList.toggle("selected", input.checked);
      input.addEventListener("change", () => {
        selectTaskType(type.key);
      });
      taskTypeOptions.appendChild(card);
    });
  };

  const postJSON = async (url, payload, timeoutMs = 130000, externalController = null) => {
    const controller = new AbortController();
    if (externalController) {
      if (externalController.signal.aborted) controller.abort();
      externalController.signal.addEventListener("abort", () => controller.abort(), { once: true });
    }
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error(`The message generation response took longer than ${Math.round(timeoutMs / 1000)}s.`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `Request failed (${response.status})`);
    }
    return data;
  };

  const createSessionId = () => {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `session-${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
  };

  const calculateTaskAccuracy = (correctItems, attemptedItems) => {
    const attempted = Math.max(0, Number(attemptedItems || 0));
    const correct = Math.max(0, Number(correctItems || 0));
    if (attempted === 0) return { taskAccuracy: null, taskAccuracyPercent: null };
    const taskAccuracy = correct / attempted;
    return { taskAccuracy, taskAccuracyPercent: taskAccuracy * 100 };
  };

  const calculateCompletionTime = (startedAt, completedAt) => {
    const startMs = Date.parse(startedAt || "");
    const endMs = Date.parse(completedAt || "");
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) {
      return { completionTimeMs: null, completionTimeSeconds: null };
    }
    const completionTimeMs = endMs - startMs;
    return { completionTimeMs, completionTimeSeconds: completionTimeMs / 1000 };
  };

  const getLocalSessions = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("agentic_sessions") || "{}");
      return stored && typeof stored === "object" ? stored : {};
    } catch {
      return {};
    }
  };

  const toSerializableSession = (record = {}) => {
    const { timerInterval, ...serializable } = record;
    return serializable;
  };

  const persistWorkerSessionLocally = (record = workerSession) => {
    if (!record?.sessionId) return;
    const serializable = toSerializableSession(record);
    const sessions = getLocalSessions();
    sessions[record.sessionId] = { ...(sessions[record.sessionId] || {}), ...serializable };
    try {
      localStorage.setItem("agentic_sessions", JSON.stringify(sessions));
    } catch {
      // A storage quota issue must never interrupt the worker task.
    }
  };

  const syncWorkerSession = async (method = "PATCH", record = workerSession, useBeacon = false) => {
    if (!record?.sessionId) return false;
    const serializable = toSerializableSession(record);
    persistWorkerSessionLocally(serializable);
    const url = method === "POST" ? "/api/sessions" : `/api/sessions/${encodeURIComponent(record.sessionId)}`;
    const body = JSON.stringify({ session: serializable });
    if (useBeacon && navigator.sendBeacon) {
      return navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
    }
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const createWorkerSession = (taskId, totalItems, category, taskType = "", taskTypeLabel = "") => {
    const openedAt = new Date().toISOString();
    workerSession = {
      sessionId: createSessionId(),
      taskId,
      status: "opened",
      progress: 0,
      totalItems: Math.max(1, Number(totalItems || 10)),
      timerSeconds: 900,
      timerInterval: null,
      timerSpeed: 1,
      selectedOption: null,
      category: category || "general",
      taskCategory: category || "general",
      taskType: TaskTypeConfig.normalizeTaskTypeKey(taskType),
      taskTypeLabel: taskTypeLabel || TaskTypeConfig.getTaskType(taskType)?.label || "",
      openedAt,
      taskStartedAt: null,
      startedAt: null,
      completedAt: null,
      lastSeenAt: openedAt,
      itemStartedAt: null,
      attemptedItems: 0,
      scoredItems: 0,
      correctItems: 0,
      taskAccuracy: null,
      taskAccuracyPercent: null,
      completionTimeMs: null,
      completionTimeSeconds: null,
      instructionReadingTimeMs: null,
      responses: []
    };
    syncWorkerSession("POST", workerSession);
    return workerSession;
  };

  const startWorkerSession = () => {
    if (!workerSession.sessionId || workerSession.status === "completed") return;
    const startedAt = new Date().toISOString();
    workerSession.status = "started";
    workerSession.taskStartedAt = startedAt;
    workerSession.startedAt = startedAt;
    workerSession.lastSeenAt = startedAt;
    workerSession.itemStartedAt = startedAt;
    const openedMs = Date.parse(workerSession.openedAt || "");
    workerSession.instructionReadingTimeMs = Number.isFinite(openedMs) ? Date.parse(startedAt) - openedMs : null;
    syncWorkerSession("PATCH", workerSession);
  };

  const markWorkerSessionAbandoned = (useBeacon = false) => {
    if (!workerSession.sessionId || workerSession.status !== "started") return;
    workerSession.status = "abandoned";
    workerSession.lastSeenAt = new Date().toISOString();
    syncWorkerSession("PATCH", workerSession, useBeacon);
  };

  const saveTaskToServer = async (task) => {
    try {
      await postJSON("/api/tasks", { task }, 130000);
      return true;
    } catch (error) {
      addThoughtLog?.(`[Server save] Failed to save the task: ${error.message}`, "warning");
      return false;
    }
  };

  const loadTaskFromServer = async (taskId) => {
    try {
      const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}`, { cache: "no-store" });
      if (!response.ok) return null;
      const data = await response.json();
      return data.task || null;
    } catch {
      return null;
    }
  };

  const saveResultToServer = async (record) => {
    try {
      await postJSON("/api/results", { record }, 30000);
    } catch {
      // Local result storage remains the fallback for prototype runs.
    }
  };

  const getTaskPayloadFromForm = () => {
    const taskType = TaskTypeConfig.getTaskType(selectedTaskType, "en") || TaskTypeConfig.localizeTaskType(TaskTypeConfig.TASK_TYPES[TaskTypeConfig.DEFAULT_TASK_TYPE], "en");
    const strategySelection = TaskTypeConfig.getStrategySelection(taskType.key);
    return {
    lang: "en",
    title: taskTitleBox.value.trim(),
    reward: taskRewardBox.value.trim() || "1.50",
    timeLimitMinutes: taskTimeLimitBox.value.trim() || "15",
    description: taskDescBox.value.trim(),
    category: selectedCategory,
    taskCategory: selectedCategory,
    taskType: taskType.key,
    taskTypeLabel: taskType.label,
    taskTypeReason: taskType.mappingReason,
    taskTypeCharacteristics: taskType.characteristics,
    coreStrategy: strategySelection.coreStrategy,
    supportingStrategy: strategySelection.supportingStrategy,
    riskLevel: taskRiskLevelSelect.value,
    fatigueLevel: taskFatigueLevelSelect.value,
    objective: taskObjectiveBox.value.trim(),
    socialImpact: taskSocialImpactBox.value.trim(),
    workerContext: taskWorkerContextBox.value.trim()
  };
  };

  const extractOptionMessages = (options = []) => options
    .map(option => typeof option === "string" ? option : (option?.message || option?.text || ""))
    .filter(Boolean);

  const extractOptionLabels = (options = [], fallbackLabels = []) => options
    .map((option, idx) => typeof option === "string" ? fallbackLabels[idx] : (option?.label || fallbackLabels[idx]))
    .filter(Boolean);

  const extractOptionFrames = (options = [], fallbackFrames = []) => options
    .map((option, idx) => typeof option === "string" ? fallbackFrames[idx] : (option?.frame || fallbackFrames[idx]))
    .filter(Boolean);

  const ensureThree = (values, fallbackValues) => {
    const merged = [...values];
    fallbackValues.forEach(value => {
      if (merged.length < 3) merged.push(value);
    });
    return merged.slice(0, 3);
  };

  const BEFORE_STRATEGIES = ["Relatedness", "Competence", "Autonomy"];
  const inferBeforeStrategy = option => {
    const metadata = typeof option === "string" ? "" : `${option?.frame || ""} ${option?.label || ""}`;
    return BEFORE_STRATEGIES.find(strategy => new RegExp(`\\b${strategy}\\b`, "i").test(metadata)) || "";
  };
  const matchesBeforeStrategy = (message, strategy) => {
    const text = String(message || "").toLowerCase();
    if (strategy === "Relatedness") return /(participat|contribut|shared|together|project|result|purpose|respect|value)/.test(text);
    if (strategy === "Competence") return /(criteri|distinction|context|accur|consisten|careful|evidence|guideline|judg|detail)/.test(text)
      && !/(comfortable pace|own pace|preferred order|whatever order|free to choose|take a break|self-regulat)/.test(text);
    return /(choose|choice|own judgment|approach|order|pace|decide|control|flexib|within the guidelines)/.test(text);
  };
  const normalizeBeforeCandidates = (rawOptions = [], fallback = {}) => {
    const source = Array.isArray(rawOptions) ? rawOptions : [];
    const fallbackMessages = extractOptionMessages(fallback.beforeOptions);
    const used = new Set();
    const validation = [];
    const messages = BEFORE_STRATEGIES.map((strategy, targetIndex) => {
      const sourceIndex = source.findIndex((option, index) => !used.has(index) && inferBeforeStrategy(option) === strategy);
      if (sourceIndex >= 0) used.add(sourceIndex);
      const candidate = sourceIndex >= 0 ? source[sourceIndex] : null;
      const message = typeof candidate === "string" ? candidate : (candidate?.message || candidate?.text || "");
      const valid = aiGenerator.hasValidSentenceCount(message)
        && !/\b(?:Relatedness|Competence|Autonomy)\b/i.test(message)
        && matchesBeforeStrategy(message, strategy);
      validation.push({ strategy, sourceIndex, reordered: sourceIndex !== targetIndex, corrected: !valid });
      return valid ? message : fallbackMessages[targetIndex];
    });
    return { messages, labels: [...BEFORE_STRATEGIES], frames: [...BEFORE_STRATEGIES], validation };
  };

  const normalizeGenerationResult = (raw, fallback, title = "") => {
    const fallbackBeforeMessages = extractOptionMessages(fallback.beforeOptions);
    const fallbackAfterMessages = extractOptionMessages(fallback.afterOptions);
    const normalizedBefore = normalizeBeforeCandidates(raw.beforeOptions, fallback);
    const beforeMessages = normalizedBefore.messages;
    const afterMessages = ensureThree(extractOptionMessages(raw.afterOptions), fallbackAfterMessages);
    const beforeLabels = normalizedBefore.labels;
    const afterLabels = ensureThree(extractOptionLabels(raw.afterOptions, fallback.afterLabels), fallback.afterLabels);
    const beforeFrames = normalizedBefore.frames;
    const afterFrames = ensureThree(
      extractOptionFrames(raw.afterOptions, fallback.afterCandidateFrames),
      fallback.afterCandidateFrames || ["Relatedness", "Competence", "Autonomy"]
    );
    const psychologicalFactors = raw.psychologicalFactors || {
      inferredTaskTypes: [],
      psychologicalBurdens: raw.psychologicalBurden || [],
      motivationalFactors: raw.motivationalOpportunity || [],
      sdtNeeds: [],
      selectedFrames: raw.selectedFrames || [],
      frameSelectionReason: "",
      constraintsApplied: []
    };

    const rawSelectedFrames = psychologicalFactors.selectedFrames || raw.selectedFrames || [];
    const fallbackSelectedFrames = fallback.psychologicalFactors?.selectedFrames || fallback.selectedFrames || [];
    const selectedFrames = (Array.isArray(fallbackSelectedFrames) && fallbackSelectedFrames.length
      ? fallbackSelectedFrames
      : rawSelectedFrames
    ).filter(Boolean);

    psychologicalFactors.primaryTaskType = psychologicalFactors.primaryTaskType || fallback.psychologicalFactors?.primaryTaskType || fallback.primaryTaskType || "";
    psychologicalFactors.primaryPsychologicalType = psychologicalFactors.primaryPsychologicalType || fallback.psychologicalFactors?.primaryPsychologicalType || "";
    psychologicalFactors.taskType = fallback.psychologicalFactors?.taskType || fallback.taskType || psychologicalFactors.taskType || raw.taskType || TaskTypeConfig.DEFAULT_TASK_TYPE;
    psychologicalFactors.taskTypeLabel = fallback.psychologicalFactors?.taskTypeLabel || fallback.taskTypeLabel || psychologicalFactors.taskTypeLabel || raw.taskTypeLabel || TaskTypeConfig.getTaskType(psychologicalFactors.taskType)?.label || TaskTypeConfig.TASK_TYPES[TaskTypeConfig.DEFAULT_TASK_TYPE].label;
    psychologicalFactors.taskTypeReason = fallback.psychologicalFactors?.taskTypeReason || fallback.taskTypeReason || psychologicalFactors.taskTypeReason || raw.taskTypeReason || "";
    psychologicalFactors.taskTypeCharacteristics = fallback.psychologicalFactors?.taskTypeCharacteristics || psychologicalFactors.taskTypeCharacteristics || raw.taskTypeCharacteristics || [];
    psychologicalFactors.taskContext = fallback.psychologicalFactors?.taskContext || psychologicalFactors.taskContext || raw.taskContext || "";
    psychologicalFactors.selectedFrames = selectedFrames;
    psychologicalFactors.reviewCriteria = psychologicalFactors.reviewCriteria || raw.reviewCriteria || fallback.psychologicalFactors?.reviewCriteria || fallback.reviewCriteria || [];
    psychologicalFactors.psychologicalBurdens = psychologicalFactors.psychologicalBurdens || raw.psychologicalBurden || [];
    psychologicalFactors.motivationalFactors = psychologicalFactors.motivationalFactors || raw.motivationalOpportunity || [];

    // Use the API's own naturally-written final text directly. Do not let the
    // local rule-based generator (aiGenerator) recompose or substitute it —
    // that produced mechanically spliced sentences instead of the model's
    // natural output.
    const finalBeforeText = raw.finalBeforeText || beforeMessages[0] || "";
    const finalAfterText = raw.finalAfterText || afterMessages[0] || "";

    return {
      beforeOptions: beforeMessages,
      afterOptions: afterMessages,
      beforeLabels,
      afterLabels,
      beforeFrames,
      afterFrames,
      psychologicalFactors,
      selectedFrames: psychologicalFactors.selectedFrames || [],
      psychologicalBurden: psychologicalFactors.psychologicalBurdens || [],
      motivationalOpportunity: psychologicalFactors.motivationalFactors || [],
      structuredPrompt: raw.structuredPrompt || fallback.structuredPrompt || raw.structuredPromptSummary || "",
      theme: raw.theme || fallback.theme || "",
      finalBeforeText,
      finalAfterText,
      generationValidation: aiGenerator.validateFinalMessages(
        { taskType: psychologicalFactors.taskType, selectedFrames, title },
        beforeMessages,
        afterMessages,
        finalBeforeText,
        finalAfterText
      ),
      beforeStrategyValidation: normalizedBefore.validation,
      provider: raw.provider || "local",
      model: raw.model || ""
    };
  };

  const toDisplayFactorLabel = value => {
    const label = String(value || "").trim();
    const labelMap = {
      "Autonomy": "Autonomy",
      "Competence": "Competence",
      "Relatedness": "Relatedness"
    };
    return labelMap[label] || label;
  };

  const renderPills = (container, items = []) => {
    if (!container) return;
    container.innerHTML = "";
    items.forEach(item => {
      const value = typeof item === "string" ? item : item.type;
      if (!value) return;
      const pill = document.createElement("span");
      pill.className = "factor-pill";
      pill.textContent = toDisplayFactorLabel(value);
      container.appendChild(pill);
    });
  };

  const renderList = (container, items = []) => {
    if (!container) return;
    container.innerHTML = "";
    items.slice(0, 4).forEach(item => {
      const li = document.createElement("li");
      li.textContent = typeof item === "string" ? item : JSON.stringify(item);
      container.appendChild(li);
    });
  };

  const renderPsychologicalFactors = (factors, provider, model) => {
    latestPsychologicalFactors = factors;
    if (!psychologyFactorPanel || !factors) return;

    renderPills(factorTaskTypes, factors.inferredTaskTypes || []);
    renderPills(factorSelectedFrames, factors.selectedFrames || []);
    renderList(factorBurdens, factors.psychologicalBurdens || []);
    renderList(factorMotivators, factors.motivationalFactors || []);
    const taskTypeDefinition = TaskTypeConfig.getTaskType(factors.taskType || factors.taskTypeLabel);
    const characteristicLabels = (factors.taskTypeCharacteristics?.length
      ? factors.taskTypeCharacteristics
      : taskTypeDefinition?.characteristics || [])
      .map(item => typeof item === "string" ? item : item.label)
      .filter(Boolean);
    const riskLabels = { low: "Low", medium: "Medium", high: "High" };
    const fatigueLabels = { low: "Low", medium: "Medium", high: "High" };

    if (factorTaskCharacteristics) factorTaskCharacteristics.textContent = characteristicLabels.join(" · ") || "—";
    if (factorContextRisk) factorContextRisk.textContent = riskLabels[taskRiskLevelSelect?.value] || "—";
    if (factorContextFatigue) factorContextFatigue.textContent = fatigueLabels[taskFatigueLevelSelect?.value] || "—";
    if (factorContextTime) factorContextTime.textContent = taskTimeLimitBox?.value ? `${taskTimeLimitBox.value} min` : "—";

    if (llmProviderBadge) {
      if (provider === "openai") {
        llmProviderBadge.textContent = `Written by GPT${model ? ` · ${model}` : ""}`;
      } else if (provider === "upstage") {
        llmProviderBadge.textContent = `Written externally${model ? ` · ${model}` : ""}`;
      } else {
        llmProviderBadge.textContent = "Written in browser";
      }
    }
    if (reviewCriteriaList) {
      reviewCriteriaList.innerHTML = "";
      (factors.reviewCriteria || []).forEach((criterion, index) => {
        const card = document.createElement("article");
        card.className = "review-criterion-card";

        const copy = document.createElement("div");
        const title = document.createElement("h5");
        title.textContent = `${index + 1}. ${criterion.label || toDisplayFactorLabel(criterion.frame)}`;
        const reason = document.createElement("p");
        reason.className = "criterion-reason";
        reason.textContent = criterion.whyNeeded || "A review criterion selected based on the task analysis results.";
        const check = document.createElement("p");
        check.className = "criterion-check";
        const checkLabel = document.createElement("strong");
        checkLabel.textContent = "What to check in the message";
        check.append(checkLabel, document.createTextNode(criterion.messageCheck || "Check whether the selected frame is naturally reflected in the wording."));
        copy.append(title, reason, check);

        const priority = document.createElement("span");
        priority.className = `criterion-priority ${criterion.priority || "support"}`;
        priority.textContent = criterion.priorityLabel || (criterion.selected ? "Selected" : "Reference");
        card.append(copy, priority);
        reviewCriteriaList.appendChild(card);
      });
    }
    psychologyFactorPanel.classList.remove("hidden");
  };

  const setWorkflowStep = (activeStep) => {
    if (!requesterProgress) return;
    const order = ["input", "generate", "review", "publish"];
    const activeIndex = Math.max(0, order.indexOf(activeStep));
    requesterProgress.querySelectorAll("[data-workflow-step]").forEach((item, index) => {
      item.classList.toggle("active", index === activeIndex);
      item.classList.toggle("done", index < activeIndex);
      if (index === activeIndex) item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
    });
  };

  const scrollToElement = (element, focusElement = null) => {
    if (!element) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const headerOffset = (document.querySelector("header")?.getBoundingClientRect().height || 60) + 16;
    const targetTop = Math.max(0, window.scrollY + element.getBoundingClientRect().top - headerOffset);
    window.scrollTo({ top: targetTop, behavior: reduceMotion ? "auto" : "smooth" });
    if (focusElement) setTimeout(() => focusElement.focus({ preventScroll: true }), reduceMotion ? 0 : 500);
  };

  const navSections = [
    { section: platformOverview, button: navTabRequester },
    { section: whyMotivation, button: navTabRequester },
    { section: whySdt, button: navWhySdt },
    { section: document.getElementById("why-task-messages"), button: navWhySdt },
    { section: document.getElementById("worker-experience"), button: navWhySdt },
    { section: howItWorks, button: navHowItWorks },
    { section: document.getElementById("onboarding-ready"), button: navHowItWorks },
    { section: requesterWorkspace, button: navWorkspace }
  ].filter(item => item.section && item.button);
  const navButtons = [navTabRequester, navWhySdt, navHowItWorks, navWorkspace].filter(Boolean);
  let navClickLockUntil = 0;
  let navScrollFrame = null;

  const setActiveNavigation = button => {
    if (!button || button.classList.contains("hidden")) return;
    navButtons.forEach(item => {
      const isActive = item === button;
      item.classList.toggle("active", isActive);
      if (isActive) item.setAttribute("aria-current", "page");
      else item.removeAttribute("aria-current");
    });
  };

  const updateNavigationFromScroll = () => {
    navScrollFrame = null;
    if (document.body.classList.contains("worker-mode") || performance.now() < navClickLockUntil) return;
    const headerOffset = (document.querySelector("header")?.getBoundingClientRect().height || 60) + 32;
    let activeButton = navTabRequester;
    navSections.forEach(({ section, button }) => {
      if (button.classList.contains("hidden")) return;
      if (section.getBoundingClientRect().top <= headerOffset) activeButton = button;
    });
    setActiveNavigation(activeButton);
  };

  const requestNavigationUpdate = () => {
    if (navScrollFrame !== null) return;
    navScrollFrame = window.requestAnimationFrame(updateNavigationFromScroll);
  };

  const navigateToSection = (button, section, focusElement = null) => {
    setActiveNavigation(button);
    navClickLockUntil = performance.now() + 1200;
    scrollToElement(section, focusElement);
    window.setTimeout(updateNavigationFromScroll, 1250);
  };

  window.addEventListener("scroll", requestNavigationUpdate, { passive: true });
  window.addEventListener("resize", requestNavigationUpdate);

  const ONBOARDING_STORAGE_KEY = "taskMessageStudioOnboardingCompleted";

  const setWorkspaceAvailability = (isAvailable) => {
    workspaceShell?.classList.toggle("hidden", !isAvailable);
    workspaceShell?.setAttribute("aria-hidden", String(!isAvailable));
    navWorkspace?.classList.toggle("hidden", !isAvailable);
    document.body.classList.toggle("onboarding-completed", isAvailable);
  };

  const completeOnboarding = () => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    } catch {
      // The Workspace still opens when browser storage is unavailable.
    }
    setWorkspaceAvailability(true);
    navigateToSection(navWorkspace, requesterWorkspace, taskTitleBox);
  };

  // Development and study reset helper: run this in the browser console when needed.
  window.resetTaskMessageStudioOnboarding = () => {
    try {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    } catch {
      // Ignore storage restrictions and reset the visible state.
    }
    setWorkspaceAvailability(false);
    navigateToSection(navTabRequester, platformOverview);
  };

  btnStartDesigning?.addEventListener("click", completeOnboarding);
  btnWorkspaceSdt?.addEventListener("click", () => navigateToSection(navWhySdt, whySdt));
  navTabRequester?.addEventListener("click", () => navigateToSection(navTabRequester, platformOverview));
  navWhySdt?.addEventListener("click", () => navigateToSection(navWhySdt, whySdt));
  navHowItWorks?.addEventListener("click", () => navigateToSection(navHowItWorks, howItWorks));
  navWorkspace?.addEventListener("click", () => navigateToSection(navWorkspace, requesterWorkspace, taskTitleBox));
  requestNavigationUpdate();

  const syncSelectedCandidateText = () => {
    if (synthesizedBeforeOptions.length > 0) {
      synthesizedBeforeOptions[selectedBeforeOptionIndex] = beforeTextBox.value;
    }
    if (synthesizedAfterOptions.length > 0) {
      synthesizedAfterOptions[selectedAfterOptionIndex] = afterTextBox.value;
    }
    if (currentTask) {
      currentTask.beforeCandidates = [...synthesizedBeforeOptions];
      currentTask.afterCandidates = [...synthesizedAfterOptions];
      currentTask.finalBeforeText = finalBeforeTextBox.value;
      currentTask.finalAfterText = finalAfterTextBox.value;
      currentTask.beforeText = finalBeforeTextBox.value || beforeTextBox.value;
      currentTask.afterText = finalAfterTextBox.value || afterTextBox.value;
      saveDraftToStorage();
    }
  };

  // Routing Handler using Hash Parsing
  const handleRouting = () => {
    const hash = window.location.hash;
    if (!hash.startsWith("#worker") && workerSession.status === "started") {
      markWorkerSessionAbandoned();
    }
    clearInterval(workerSession.timerInterval);

    if (hash.startsWith("#worker")) {
      document.body.classList.add("worker-mode");
      document.body.classList.remove("requester-mode");
      requesterView.classList.add("hidden");
      workerView.classList.remove("hidden");
      navTabRequester?.classList.remove("active");
      navTabWorker?.classList.add("active");

      const query = hash.split("?")[1];
      const params = new URLSearchParams(query);
      let taskId = params.get("taskId");

      if (!taskId) {
        const tasks = JSON.parse(localStorage.getItem("agentic_tasks")) || {};
        if (tasks["task-draft"]) {
          taskId = "task-draft";
        } else if (currentTask && currentTask.id) {
          taskId = currentTask.id;
        } else {
          const taskList = Object.values(tasks);
          if (taskList.length > 0) {
            taskList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            taskId = taskList[0].id;
          }
        }
      }
      if (taskId) {
        loadWorkerTask(taskId);
      } else {
        activeWorkerTask = null;
        workerTaskError.classList.remove("hidden");
        workerPreTask.classList.add("hidden");
        workerWorkspace.classList.add("hidden");
        workerPostTask.classList.add("hidden");
      }
    } else {
      document.body.classList.remove("worker-mode");
      document.body.classList.add("requester-mode");
      requesterView.classList.remove("hidden");
      workerView.classList.add("hidden");
      navTabRequester?.classList.add("active");
      navTabWorker?.classList.remove("active");
    }
  };

  window.addEventListener("hashchange", handleRouting);
  navTabWorker?.addEventListener("click", () => { window.location.hash = "#worker"; });

  // ==========================================================================
  // REQUESTER: TASK PRESETS AND GENERATION
  // ==========================================================================

  const applyTestCasePreset = (caseId) => {
    const preset = testCasePresets[caseId];
    if (!preset) return;

    selectedCategory = preset.category;
    selectTaskType(preset.taskType, { sync: false });
    taskTitleBox.value = preset.title;
    taskRewardBox.value = preset.reward;
    taskTimeLimitBox.value = preset.timeLimitMinutes || "15";
    taskDescBox.value = preset.description;
    taskRiskLevelSelect.value = preset.riskLevel;
    taskFatigueLevelSelect.value = preset.fatigueLevel;
    taskObjectiveBox.value = preset.objective;
    taskSocialImpactBox.value = preset.socialImpact;
    taskWorkerContextBox.value = preset.workerContext;
    const presetPayload = getTaskPayloadFromForm();

    currentTask = {
      id: "task-draft",
      title: preset.title,
      category: preset.category,
      taskCategory: preset.category,
      taskType: preset.taskType,
      taskTypeLabel: TaskTypeConfig.getTaskType(preset.taskType)?.label || "",
      taskTypeReason: presetPayload.taskTypeReason,
      taskTypeCharacteristics: presetPayload.taskTypeCharacteristics,
      reward: preset.reward,
      timeLimitMinutes: preset.timeLimitMinutes || "15",
      description: preset.description,
      riskLevel: preset.riskLevel,
      fatigueLevel: preset.fatigueLevel,
      objective: preset.objective,
      socialImpact: preset.socialImpact,
      workerContext: preset.workerContext,
      beforeText: "",
      afterText: "",
      beforeCandidates: [],
      afterCandidates: [],
      createdAt: new Date().toISOString()
    };

    saveDraftToStorage();
    updateFormCompletion();
    resetGenerationMonitor();
    previewContainer?.classList.add("hidden");
    reviewEmptyState?.classList.remove("hidden");
    shareCard?.classList.add("hidden");
    showToast(`The ${preset.groupLabel} example has been filled in.`);
  };

  // Requester convenience: completion meter, validation, reset
  const requiredFormFields = [
    { el: taskTitleBox, label: "Task title" },
    { el: taskRewardBox, label: "Reward" },
    { el: taskTimeLimitBox, label: "Time limit" },
    { el: taskDescBox, label: "Task instructions" },
    { el: taskObjectiveBox, label: "Task objective" }
  ];

  const updateFormCompletion = () => {
    const completed = requiredFormFields.filter(item => item.el && item.el.value.trim()).length;
    const total = requiredFormFields.length;
    if (formCompletionText) formCompletionText.textContent = `Required fields ${completed} / ${total}`;
    if (formCompletionFill) formCompletionFill.style.width = `${Math.round((completed / total) * 100)}%`;
  };

  const validateRequiredFields = () => {
    const missing = requiredFormFields.filter(item => !item.el || !item.el.value.trim());
    requiredFormFields.forEach(item => item.el?.classList.remove("is-invalid"));
    missing.forEach(item => item.el?.classList.add("is-invalid"));
    updateFormCompletion();
    return missing;
  };

  requiredFormFields.forEach(item => {
    item.el?.addEventListener("input", () => {
      item.el.classList.remove("is-invalid");
      updateFormCompletion();
    });
  });

  const editableTaskControls = [
    taskTitleBox, taskRewardBox, taskTimeLimitBox, taskDescBox, taskObjectiveBox,
    taskSocialImpactBox, taskWorkerContextBox, taskRiskLevelSelect, taskFatigueLevelSelect
  ].filter(Boolean);

  editableTaskControls.forEach(control => {
    control.addEventListener("input", () => {
      if (isGenerating) generationEditNotice?.classList.remove("hidden");
    });
    control.addEventListener("change", () => {
      if (isGenerating) generationEditNotice?.classList.remove("hidden");
    });
  });

  btnRestartGeneration?.addEventListener("click", () => {
    if (!isGenerating) {
      btnGenerate?.click();
      return;
    }
    pendingRegenerate = true;
    activeGenerationController?.abort();
    showToast("Cancelling the current analysis and restarting with the updated settings.");
  });

  const closeExamplePopovers = (except = null) => {
    exampleHelpButtons.forEach(button => {
      const wrapper = button.closest(".example-help");
      if (!wrapper || wrapper === except) return;
      wrapper.removeAttribute("data-open");
      button.setAttribute("aria-expanded", "false");
    });
  };

  exampleHelpButtons.forEach(button => {
    button.addEventListener("click", event => {
      event.stopPropagation();
      const wrapper = button.closest(".example-help");
      const willOpen = wrapper?.getAttribute("data-open") !== "true";
      closeExamplePopovers(wrapper);
      if (willOpen) wrapper?.setAttribute("data-open", "true");
      else wrapper?.removeAttribute("data-open");
      button.setAttribute("aria-expanded", String(willOpen));
    });
  });

  document.addEventListener("click", () => closeExamplePopovers());
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeExamplePopovers();
      document.activeElement?.blur?.();
    }
  });

  btnResetForm?.addEventListener("click", () => {
    taskForm?.reset();
    currentTask = null;
    selectedCategory = "general";
    selectTaskType(TaskTypeConfig.DEFAULT_TASK_TYPE, { sync: false });
    synthesizedBeforeOptions = [];
    synthesizedAfterOptions = [];
    latestPsychologicalFactors = null;
    previewContainer?.classList.add("hidden");
    reviewEmptyState?.classList.remove("hidden");
    shareCard?.classList.add("hidden");
    resetGenerationMonitor();
    if (aiLogBox) {
      aiLogBox.innerHTML = '<div class="ai-thought-line ai-thought-system">The input has been reset. Please enter new task information.</div>';
    }
    const tasks = JSON.parse(localStorage.getItem("agentic_tasks")) || {};
    delete tasks["task-draft"];
    localStorage.setItem("agentic_tasks", JSON.stringify(tasks));
    requiredFormFields.forEach(item => item.el?.classList.remove("is-invalid"));
    updateFormCompletion();
    setWorkflowStep("input");
    showToast("The input has been reset.");
  });

  // Trigger Motivation Synthesis
  btnGenerate.addEventListener("click", async (e) => {
    e.preventDefault();

	    const payload = getTaskPayloadFromForm();
    const generationPayload = payload;

    const missingFields = validateRequiredFields();
    if (missingFields.length > 0) {
      showToast(`Please fill in the required fields: ${missingFields.map(item => item.label).join(", ")}`);
      missingFields[0].el?.focus();
      return;
    }

    isGenerating = true;
    setWorkflowStep("generate");
    activeGenerationController = new AbortController();
    generationEditNotice?.classList.remove("hidden");
    btnGenerate.disabled = true;
    const originalGenerateButtonHTML = btnGenerate.innerHTML;
    btnGenerate.innerHTML = `<i class="lucide-loader"></i>Generating message`;
    if (aiLogBox) aiLogBox.innerHTML = "";
    resetGenerationMonitor();
    previewContainer?.classList.add("hidden");
    reviewEmptyState?.classList.add("hidden");
    shareCard?.classList.add("hidden");

    try {
      setGenerationStep("metadata", "active");
      addThoughtLog(`[Input Collected] Gathered Task Type (${payload.taskTypeLabel}), task title, reward, detailed instructions, emotional burden (${payload.riskLevel}), repetition/focus burden (${payload.fatigueLevel}), task objective, social value, and task-performance characteristics.`, "meta");
      addThoughtLog(`[Input Summary] Title: ${payload.title} / Objective: ${payload.objective || "auto-inferred from description"} / Social value: ${payload.socialImpact || "auto-inferred from category"}`, "meta");
      setGenerationStep("metadata", "done");

      setGenerationStep("factors", "active");
      // Play explainable agent log. This is not private chain-of-thought; it mirrors the PDF-described pipeline.
      await aiGenerator.generateThoughtsLog(
        generationPayload.title,
        generationPayload.category,
        generationPayload.description,
        generationPayload.riskLevel,
        generationPayload.fatigueLevel,
        generationPayload.objective,
        generationPayload.socialImpact,
        generationPayload.workerContext,
        Number(generationPayload.timeLimitMinutes || 15),
        addThoughtLog,
        generationPayload.taskType
      );
      setGenerationStep("factors", "done");
      setGenerationStep("frames", "active");

      const fallbackResults = aiGenerator.generateInterventions(
        generationPayload.title,
        generationPayload.category,
        generationPayload.description,
        generationPayload.riskLevel,
        generationPayload.fatigueLevel,
        generationPayload.objective,
        generationPayload.socialImpact,
        generationPayload.workerContext,
        generationPayload.reward,
        Number(generationPayload.timeLimitMinutes || 15),
        generationPayload.taskType
      );
      const fallbackFactors = fallbackResults.psychologicalFactors || {};
      addThoughtLog(`[Task Type] Confirmed: ${fallbackFactors.taskTypeLabel || payload.taskTypeLabel}`, "process");
      addThoughtLog(`[Strategy Mapping] Core/supporting strategy linked to this Task Type: ${(fallbackFactors.selectedFrames || fallbackResults.selectedFrames || []).join(" + ")}`, "process");
      const surveySelection = TaskTypeConfig.getStrategySelection(fallbackFactors.taskType || payload.taskType);
      addThoughtLog(`[Survey Evidence] N=120 preference results: Core ${surveySelection.coreStrategy} ${surveySelection.corePercentage.toFixed(1)}% / Supporting ${surveySelection.supportingStrategy} ${surveySelection.supportingPercentage.toFixed(1)}%`, "meta");
      addThoughtLog("[Message Length] Applying 4-5 sentences, based on the Medium-length preference of 66.7% (80/120).", "meta");
      setGenerationStep("frames", "done");
      setGenerationStep("constraints", "active");
      addThoughtLog("[Constraints] Composing the pre/post-task messages as 4-5 complete sentences each, centered on the core strategy with the supporting strategy given less weight.", "process");
      setGenerationStep("constraints", "done");

      let rawResults;
      let waitLogInterval = null;
      try {
        setGenerationStep("llm", "active");
        addThoughtLog("[Generation] Composing candidate messages and final messages to fit the task's characteristics.", "process");
        waitLogInterval = startWaitingLog("message generation");
        rawResults = await postJSON("/api/generate-motivation", generationPayload, 130000, activeGenerationController);
        clearInterval(waitLogInterval);
        addThoughtLog(`[Generation] Candidate messages are ready. Pre-task: ${rawResults.beforeOptions?.length || 0} / Post-task: ${rawResults.afterOptions?.length || 0}`, "success");
        setGenerationStep("llm", "done");
      } catch (error) {
        if (waitLogInterval) clearInterval(waitLogInterval);
        setGenerationStep("llm", "warn");
        addThoughtLog(`[Generation Failed] AI message generation failed: ${error.message}`, "warning");
        showToast(`Message generation failed: ${error.message}`);
        previewContainer?.classList.add("hidden");
        reviewEmptyState?.classList.remove("hidden");
        setWorkflowStep("input");
        return;
      }

      setGenerationStep("render", "active");
      const results = normalizeGenerationResult(rawResults, fallbackResults, payload.title);
      const validationPassed = Object.values(results.generationValidation || {}).every(Boolean);
      if (!validationPassed) {
        addThoughtLog("[Message Validation] Some details may differ from the fine-grained rules, but the API's own output is used as-is.", "warning");
      } else {
        addThoughtLog("[Message Validation] Confirmed 4-5 sentences, core/supporting priority, post-task completion acknowledgment, time/effort appreciation, Task-Type-specific contribution meaning, and no exaggeration.", "success");
      }
      latestLLMProvider = results.provider;
      latestLLMModel = results.model;
      latestStructuredPrompt = results.structuredPrompt || "";
      addThoughtLog(`[Result Assembly] The 6 candidate messages and the final pre/post-task messages are ready to render on screen.`, "process");

      // Save lists globally for option switching and manual edits.
      synthesizedBeforeOptions = results.beforeOptions;
      synthesizedAfterOptions = results.afterOptions;
      synthesizedBeforeLabels = results.beforeLabels || synthesizedBeforeLabels;
      synthesizedAfterLabels = results.afterLabels || synthesizedAfterLabels;
      synthesizedBeforeFrames = results.beforeFrames || synthesizedBeforeFrames;
      synthesizedAfterFrames = results.afterFrames || synthesizedAfterFrames;
      selectedBeforeOptionIndex = 0;
      selectedAfterOptionIndex = 0;

      currentTask = {
        id: "task-draft",
        title: payload.title,
        category: payload.category,
        taskCategory: payload.taskCategory,
        taskType: payload.taskType,
        taskTypeLabel: payload.taskTypeLabel,
        taskTypeReason: payload.taskTypeReason,
        taskTypeCharacteristics: payload.taskTypeCharacteristics,
        reward: payload.reward,
        timeLimitMinutes: payload.timeLimitMinutes,
        description: payload.description,
        beforeText: results.finalBeforeText,
        afterText: results.finalAfterText,
        beforeCandidates: [...synthesizedBeforeOptions],
        afterCandidates: [...synthesizedAfterOptions],
        beforeCandidateFrames: [...synthesizedBeforeFrames],
        afterCandidateFrames: [...synthesizedAfterFrames],
        finalBeforeText: results.finalBeforeText,
        finalAfterText: results.finalAfterText,
        theme: results.theme,
        psychologicalFactors: results.psychologicalFactors,
        selectedFrames: results.selectedFrames || [],
        psychologicalBurden: results.psychologicalBurden || [],
        motivationalOpportunity: results.motivationalOpportunity || [],
        structuredPrompt: latestStructuredPrompt,
        llmProvider: latestLLMProvider,
        llmModel: latestLLMModel,
        riskLevel: payload.riskLevel,
        fatigueLevel: payload.fatigueLevel,
        objective: payload.objective,
        socialImpact: payload.socialImpact,
        workerContext: payload.workerContext,
        createdAt: new Date().toISOString()
      };

      saveDraftToStorage();

      renderOptionSelectors();
      renderPsychologicalFactors(results.psychologicalFactors, latestLLMProvider, latestLLMModel);

      beforeTextBox.value = synthesizedBeforeOptions[0];
      afterTextBox.value = synthesizedAfterOptions[0];
      finalBeforeTextBox.value = results.finalBeforeText;
      finalAfterTextBox.value = results.finalAfterText;

      previewContainer?.classList.remove("hidden");
      reviewEmptyState?.classList.add("hidden");
      setGenerationStep("render", "done");
      setWorkflowStep("review");
      addThoughtLog("[Complete] You can review and edit the candidate and final messages yourself, then deploy the task with the current final messages.", "success");
      previewContainer?.scrollIntoView({ behavior: "smooth", block: "start" });
    } finally {
      isGenerating = false;
      activeGenerationController = null;
      generationEditNotice?.classList.add("hidden");
      btnGenerate.disabled = false;
      btnGenerate.innerHTML = originalGenerateButtonHTML;
      if (pendingRegenerate) {
        pendingRegenerate = false;
        setTimeout(() => btnGenerate.click(), 0);
      }
    }
  });

  const addThoughtLog = (text, type = "") => {
    if (!aiLogBox) return;
    const logLine = document.createElement("div");
    logLine.className = `ai-thought-line ai-thought-${type}`;
    const timeNode = document.createElement("span");
    timeNode.className = "ai-thought-time";
    timeNode.textContent = `[${new Date().toLocaleTimeString("ko-KR", { hour12: false })}]`;
    logLine.append(timeNode, document.createTextNode(` ${text}`));
    aiLogBox.appendChild(logLine);
    aiLogBox.scrollTop = aiLogBox.scrollHeight;
  };

  // Render 3-Option Tab selectors dynamically
  const renderOptionSelectors = () => {
    const beforeSelectGroup = document.getElementById("before-options-select-group");
    const afterSelectGroup = document.getElementById("after-options-select-group");

    beforeSelectGroup.innerHTML = "";
    afterSelectGroup.innerHTML = "";

    // 3 Options for Before-Task
    const beforeTitles = synthesizedBeforeLabels;
    beforeTitles.forEach((title, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `option-select-btn${idx === selectedBeforeOptionIndex ? " active" : ""}`;
      const icon = document.createElement("i");
      icon.className = "lucide-sparkles";
      const copy = document.createElement("span");
      copy.className = "candidate-btn-copy";
      const label = document.createElement("span");
      label.textContent = title;
      copy.append(label);
      btn.append(icon, copy);
      btn.addEventListener("click", () => {
        syncSelectedCandidateText();
        beforeSelectGroup.querySelectorAll(".option-select-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedBeforeOptionIndex = idx;
        beforeTextBox.value = synthesizedBeforeOptions[idx];
        if (currentTask) {
          currentTask.beforeCandidates = [...synthesizedBeforeOptions];
          saveDraftToStorage();
        }
        showToast(`Pre-task candidate: [${title}] selected`);
      });
      beforeSelectGroup.appendChild(btn);
    });

    // 3 Options for After-Task
    const afterTitles = synthesizedAfterLabels;
    afterTitles.forEach((title, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `option-select-btn${idx === selectedAfterOptionIndex ? " active" : ""}`;
      const icon = document.createElement("i");
      icon.className = "lucide-award";
      const copy = document.createElement("span");
      copy.className = "candidate-btn-copy";
      const label = document.createElement("span");
      label.textContent = title;
      copy.append(label);
      btn.append(icon, copy);
      btn.addEventListener("click", () => {
        syncSelectedCandidateText();
        afterSelectGroup.querySelectorAll(".option-select-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedAfterOptionIndex = idx;
        afterTextBox.value = synthesizedAfterOptions[idx];
        if (currentTask) {
          currentTask.afterCandidates = [...synthesizedAfterOptions];
          saveDraftToStorage();
        }
        showToast(`Post-task candidate: [${title}] selected`);
      });
      afterSelectGroup.appendChild(btn);
    });
  };

  // Publish Task Campaign
  btnPublish.addEventListener("click", async () => {
    if (!currentTask) return;
    syncSelectedCandidateText();
    const publishPayload = getTaskPayloadFromForm();

    const tasks = JSON.parse(localStorage.getItem("agentic_tasks")) || {};
    // Clean up temporary draft on formal publish
    delete tasks["task-draft"];

    currentTask.beforeText = finalBeforeTextBox.value || beforeTextBox.value;
    currentTask.afterText = finalAfterTextBox.value || afterTextBox.value;
    currentTask.finalBeforeText = currentTask.beforeText;
    currentTask.finalAfterText = currentTask.afterText;
    currentTask.timeLimitMinutes = taskTimeLimitBox.value.trim() || currentTask.timeLimitMinutes || "15";
    currentTask.taskCategory = publishPayload.taskCategory;
    currentTask.taskType = publishPayload.taskType;
    currentTask.taskTypeLabel = publishPayload.taskTypeLabel;
    currentTask.taskTypeReason = publishPayload.taskTypeReason;
    currentTask.taskTypeCharacteristics = publishPayload.taskTypeCharacteristics;
    currentTask.beforeCandidates = [...synthesizedBeforeOptions];
    currentTask.afterCandidates = [...synthesizedAfterOptions];
    currentTask.beforeCandidateFrames = [...synthesizedBeforeFrames];
    currentTask.afterCandidateFrames = [...synthesizedAfterFrames];
    currentTask.psychologicalFactors = latestPsychologicalFactors;
    currentTask.structuredPrompt = latestStructuredPrompt;
    currentTask.llmProvider = latestLLMProvider;
    currentTask.llmModel = latestLLMModel;
    currentTask.id = "task-" + Date.now();
    currentTask.createdAt = new Date().toISOString();

    tasks[currentTask.id] = currentTask;
    try {
      localStorage.setItem("agentic_tasks", JSON.stringify(tasks));
    } catch {
      showToast("Skipped the browser temporary save because the media size was too large.");
    }

    const serverSaved = await saveTaskToServer(currentTask);

    const workerUrl = `${window.location.origin}${window.location.pathname}#worker?taskId=${currentTask.id}`;
    shareLinkInput.value = workerUrl;
    if (shareCreatedAt) {
      shareCreatedAt.textContent = `Created ${new Date().toLocaleString("en-US", { hour12: false })}`;
    }
    const shareStatusText = document.getElementById("share-status-text");
    if (shareStatusText) {
      shareStatusText.textContent = serverSaved ? "Saved to server" : "Local link created";
    }

    shareCard.classList.remove("hidden");
    setWorkflowStep("publish");
    showToast(serverSaved ? "The worker-only link has been created." : "A link viewable on this device has been created. Saving to the server for cross-device sharing failed.");
    shareCard.scrollIntoView({ behavior: "smooth", block: "end" });
  });

  // Helper to ensure currentTask exists and sync draft
  const syncFormToDraft = () => {
    if (!currentTask) {
      currentTask = {
        id: "task-draft",
        title: "",
        category: selectedCategory,
        taskCategory: selectedCategory,
        taskType: selectedTaskType,
        taskTypeLabel: TaskTypeConfig.getTaskType(selectedTaskType)?.label || TaskTypeConfig.TASK_TYPES[TaskTypeConfig.DEFAULT_TASK_TYPE].label,
        reward: "1.50",
        timeLimitMinutes: "15",
        description: "",
        beforeText: "Your careful judgment is a key cornerstone of building high-quality data. Please take part with a strong sense of pride.",
        afterText: "You've completed an extraordinary contribution! We sincerely and deeply thank you for your valuable effort.",
        createdAt: new Date().toISOString()
      };
    }
    const draftPayload = getTaskPayloadFromForm();
    currentTask.title = taskTitleBox.value.trim();
    currentTask.reward = taskRewardBox.value.trim() || "1.50";
    currentTask.timeLimitMinutes = taskTimeLimitBox.value.trim() || "15";
    currentTask.description = taskDescBox.value.trim();
    currentTask.category = selectedCategory;
    currentTask.taskCategory = draftPayload.taskCategory;
    currentTask.taskType = draftPayload.taskType;
    currentTask.taskTypeLabel = draftPayload.taskTypeLabel;
    currentTask.taskTypeReason = draftPayload.taskTypeReason;
    currentTask.taskTypeCharacteristics = draftPayload.taskTypeCharacteristics;
    currentTask.riskLevel = taskRiskLevelSelect.value;
    currentTask.fatigueLevel = taskFatigueLevelSelect.value;
    currentTask.objective = taskObjectiveBox.value.trim();
    currentTask.socialImpact = taskSocialImpactBox.value.trim();
    currentTask.workerContext = taskWorkerContextBox.value.trim();
    saveDraftToStorage();
  };

  taskTitleBox.addEventListener("input", syncFormToDraft);
  taskRewardBox.addEventListener("input", syncFormToDraft);
  taskTimeLimitBox.addEventListener("input", syncFormToDraft);
  taskDescBox.addEventListener("input", syncFormToDraft);
  taskRiskLevelSelect.addEventListener("change", syncFormToDraft);
  taskFatigueLevelSelect.addEventListener("change", syncFormToDraft);
  taskObjectiveBox.addEventListener("input", syncFormToDraft);
  taskSocialImpactBox.addEventListener("input", syncFormToDraft);
  taskWorkerContextBox.addEventListener("input", syncFormToDraft);

  finalBeforeTextBox.addEventListener("input", () => {
    if (currentTask) {
      currentTask.beforeText = finalBeforeTextBox.value;
      currentTask.finalBeforeText = finalBeforeTextBox.value;
      saveDraftToStorage();
    }
  });

  finalAfterTextBox.addEventListener("input", () => {
    if (currentTask) {
      currentTask.afterText = finalAfterTextBox.value;
      currentTask.finalAfterText = finalAfterTextBox.value;
      saveDraftToStorage();
    }
  });

  btnCopyLink.addEventListener("click", () => {
    shareLinkInput.select();
    navigator.clipboard.writeText(shareLinkInput.value);
    showToast("The worker link has been copied to the clipboard.");
  });

  btnOpenWorker.addEventListener("click", () => {
    if (shareLinkInput.value) {
      window.open(shareLinkInput.value, "_blank");
    }
  });

  // Export Complete Research Logs JSON Button (NASA-TLX and survey parameters removed)
  const handleJSONExport = () => {
    const results = JSON.parse(localStorage.getItem("agentic_results")) || [];
    
    const finalReport = results;

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(finalReport, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "results.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("The results.json download is complete.");
  };

  btnExportResults?.addEventListener("click", handleJSONExport);
  btnWorkerExport?.addEventListener("click", handleJSONExport);

  // ========================================================================== 
  // CROWD WORKER: PRE-TASK WORKSPACE
  // ========================================================================== 

  const escapeGuidelineHTML = (value = "") => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  const formatGuidelineInline = (value = "") => escapeGuidelineHTML(value)
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong class="guideline-emphasis">$1</strong>');

  const isNaturalGuidelineHeading = (line = "") => {
    const text = line.trim();
    if (!text || text.length > 40) return false;

    const commonHeading = /^(?:\d+[.)]\s*)?(?:task\s*overview|detailed\s*guidelines?|guidelines?|judg(?:e|ment)\s*criteria|classification\s*criteria|task\s*procedure|how\s*to\s*proceed|notes?|cautions?|exceptions?|reference|task\s*objective|submission\s*criteria)(?:\s*[:：])?$/i;
    const bracketHeading = /^\[[^\]]{2,30}\]$/;
    const shortLabel = /^[^.!?。]{2,24}[:：]$/;
    return commonHeading.test(text) || bracketHeading.test(text) || shortLabel.test(text);
  };

  const renderGuidelineMarkdown = (description = "", compact = false) => String(description)
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((originalLine) => {
      const line = originalLine.trim();
      if (!line) return '<div class="guideline-spacer" aria-hidden="true"></div>';

      const markdownHeading = line.match(/^(#{1,6})\s*(.+?)\s*#*$/);
      if (markdownHeading) {
        const level = markdownHeading[1].length <= 2 ? "title" : "subtitle";
        return `<div class="guideline-heading guideline-heading-${level}${compact ? " is-compact" : ""}">${formatGuidelineInline(markdownHeading[2])}</div>`;
      }

      const standaloneBold = line.match(/^\*\*(.+?)\*\*$/);
      if (standaloneBold) {
        return `<div class="guideline-heading guideline-heading-subtitle${compact ? " is-compact" : ""}">${formatGuidelineInline(standaloneBold[1])}</div>`;
      }

      if (isNaturalGuidelineHeading(line)) {
        return `<div class="guideline-heading guideline-heading-subtitle${compact ? " is-compact" : ""}">${formatGuidelineInline(line)}</div>`;
      }

      const lineType = /^(?:[-*•]|\d+[.)])\s+/.test(line) ? " guideline-list-line" : "";
      return `<div class="guideline-line${lineType}">${formatGuidelineInline(originalLine)}</div>`;
    })
    .join("");

  const renderGuidelineDescription = (container, description, compact = false) => {
    if (!container) return;
    if (!description) {
      container.innerHTML = '<span class="guideline-empty">No detailed guidelines have been published.</span>';
      return;
    }
    container.innerHTML = renderGuidelineMarkdown(description, compact);
  };

  const loadWorkerTask = async (taskId) => {
    const tasks = JSON.parse(localStorage.getItem("agentic_tasks")) || {};
    let task = await loadTaskFromServer(taskId);
    if (!task) task = tasks[taskId];

    if (!task) {
      activeWorkerTask = null;
      workerTaskError.classList.remove("hidden");
      workerPreTask.classList.add("hidden");
      workerWorkspace.classList.add("hidden");
      workerPostTask.classList.add("hidden");
      return;
    }

    activeWorkerTask = task;
    workerTaskError.classList.add("hidden");
    workerPreTask.classList.remove("hidden");
    workerWorkspace.classList.add("hidden");
    workerPostTask.classList.add("hidden");

    // Opening the link creates an "opened" session. Task timing starts only after the explicit start action.
    createWorkerSession(taskId, 10, task.category, task.taskType, task.taskTypeLabel);
    const timeLimitMinutes = parseInt(task.timeLimitMinutes || "15", 10);
    const safeTimeLimitMinutes = Number.isFinite(timeLimitMinutes)
      ? Math.min(Math.max(timeLimitMinutes, 1), 180)
      : 15;
    workerSession.timerSeconds = safeTimeLimitMinutes * 60;
    workerSession.timerSpeed = 1;
    workerSession.selectedOption = null;

    // Bind values safely with null checks to prevent script crashes
    if (workerTaskTitle) {
      workerTaskTitle.textContent = task.title || "Crowdsourcing Annotation Task";
    }
    if (workspaceTaskTitle) {
      workspaceTaskTitle.textContent = task.title || "Crowdsourcing Annotation Task";
    }
    if (workerTaskReward) {
      workerTaskReward.textContent = `$${task.reward || "1.50"}`;
    }
    if (workerSpecReward) {
      workerSpecReward.textContent = `$${task.reward || "1.50"}`;
    }
    if (workerSpecTimeLimit) {
      workerSpecTimeLimit.textContent = `${safeTimeLimitMinutes} min`;
    }
    if (workerMotivationPrime) {
      workerMotivationPrime.textContent = task.beforeText || "Your careful judgment is a key cornerstone of building high-quality data.";
    }
    if (workspaceMotivationPrime) {
      workspaceMotivationPrime.textContent = task.beforeText || "Your careful judgment is a key cornerstone of building high-quality data.";
    }

    // Preserve the stored guideline text and format Markdown only in worker previews.
    const workerTaskDesc = document.getElementById("worker-task-desc");
    renderGuidelineDescription(workerTaskDesc, task.description);
    renderGuidelineDescription(workspaceTaskDesc, task.description, true);
  };

  // Start Campaign Task Workspace
  btnStartTask.addEventListener("click", () => {
    startWorkerSession();
    workerPreTask.classList.add("hidden");
    workerWorkspace.classList.remove("hidden");

    // Render SVGs
    renderImageCanvas();
    renderLabelingOptions();

    // Start countdown
    startCountdown();
  });

  // ==========================================================================
  // SIMULATED COUNTDOWN CLOCK
  // ==========================================================================
  const startCountdown = () => {
    clearInterval(workerSession.timerInterval);

    const updateDisplay = () => {
      const mins = Math.floor(workerSession.timerSeconds / 60);
      const secs = workerSession.timerSeconds % 60;
      labelTimer.textContent = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

      if (workerSession.timerSeconds < 180) {
        labelTimer.parentElement.classList.add("timer-critical");
      } else {
        labelTimer.parentElement.classList.remove("timer-critical");
      }
    };

    updateDisplay();

    workerSession.timerInterval = setInterval(() => {
      workerSession.timerSeconds -= 1;

      if (workerSession.timerSeconds <= 0) {
        workerSession.timerSeconds = 0;
        clearInterval(workerSession.timerInterval);
        markWorkerSessionAbandoned();
        btnSubmitAnnotation.disabled = true;
        showToast("Time is up. Your progress will be saved as an incomplete session.");
      }

      updateDisplay();
    }, 1000);
  };

  // ==========================================================================
  // SIMULATED ANNOTATOR CANVAS
  // ==========================================================================
  const generateDynamicSVGAsset = (category, index) => {
    const width = 500;
    const height = 300;

    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="width:100%; height:100%; font-family:'Inter', sans-serif;">`;
    svgContent += `<rect width="100%" height="100%" fill="#f8fafc"/>`;
    svgContent += `<g stroke="rgba(15,23,42,0.07)" stroke-width="1">`;
    for (let x = 0; x < width; x += 25) svgContent += `<line x1="${x}" y1="0" x2="${x}" y2="${height}"/>`;
    for (let y = 0; y < height; y += 25) svgContent += `<line x1="0" y1="${y}" x2="${width}" y2="${y}"/>`;
    svgContent += `</g>`;

    if (category === "medical") {
      svgContent += `
        <path d="M 120 40 Q 180 80 180 260 M 380 40 Q 320 80 320 260" stroke="#94a3b8" stroke-width="12" fill="none" opacity="0.65"/>
        <path d="M 130 80 C 190 120 190 200 175 250 M 370 80 C 310 120 310 200 325 250" stroke="#94a3b8" stroke-width="8" fill="none" opacity="0.65"/>
        
        <path d="M 180 60 Q 100 80 120 240 Q 180 270 200 240 Q 210 160 180 60" fill="rgba(148, 163, 184, 0.25)" stroke="#64748b" stroke-width="2"/>
        <path d="M 320 60 Q 400 80 380 240 Q 320 270 300 240 Q 290 160 320 60" fill="rgba(148, 163, 184, 0.25)" stroke="#64748b" stroke-width="2"/>
        
        <rect x="240" y="30" width="20" height="240" rx="3" fill="#cbd5e1" opacity="0.8"/>
      `;

      if (index === 2 || index === 5 || index === 8) {
        const cx = index === 2 ? 150 : 340;
        const cy = index === 2 ? 140 : 185;
        const radius = index === 2 ? 22 : 15;
        svgContent += `
          <circle cx="${cx}" cy="${cy}" r="${radius}" fill="rgba(244, 63, 94, 0.15)" stroke="#f43f5e" stroke-dasharray="3,3" stroke-width="2">
            <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2s" repeatCount="indefinite" />
          </circle>
          <line x1="${cx - radius - 15}" y1="${cy}" x2="${cx - radius - 2}" y2="${cy}" stroke="#f43f5e" stroke-width="1.5"/>
          <line x1="${cx + radius + 2}" y1="${cy}" x2="${cx + radius + 15}" y2="${cy}" stroke="#f43f5e" stroke-width="1.5"/>
          <line x1="${cx}" y1="${cy - radius - 15}" x2="${cx}" y2="${cy - radius - 2}" stroke="#f43f5e" stroke-width="1.5"/>
          <line x1="${cx}" y1="${cy + radius + 2}" x2="${cx}" y2="${cy + radius + 15}" stroke="#f43f5e" stroke-width="1.5"/>
        `;
      }
    } else if (category === "autonomous") {
      svgContent += `
        <polygon points="210,130 290,130 450,300 50,300" fill="#cbd5e1"/>
        <line x1="250" y1="130" x2="250" y2="300" stroke="#e11d48" stroke-width="2" stroke-dasharray="8,8"/>
        
        <rect x="0" y="0" width="500" height="130" fill="#0f172a" opacity="0.8"/>
        <path d="M 0 130 L 80 90 L 150 110 L 220 80 L 310 120 L 420 95 L 500 130 Z" fill="#020617"/>
        
        <g transform="translate(${index % 2 === 0 ? '160, 160' : '230, 140'}) scale(${index % 2 === 0 ? '1.1' : '0.7'})">
          <rect x="10" y="30" width="100" height="40" rx="8" fill="none" stroke="#38bdf8" stroke-width="2"/>
          <path d="M 25 30 L 35 10 L 85 10 L 95 30" fill="none" stroke="#38bdf8" stroke-width="2"/>
          <circle cx="30" cy="70" r="12" fill="none" stroke="#38bdf8" stroke-width="2"/>
          <circle cx="90" cy="70" r="12" fill="none" stroke="#38bdf8" stroke-width="2"/>
        </g>
      `;

      if (index === 1 || index === 4 || index === 7) {
        svgContent += `
          <g transform="translate(100, 140)">
            <rect x="0" y="0" width="40" height="90" fill="rgba(168, 85, 247, 0.15)" stroke="#a855f7" stroke-width="2" stroke-dasharray="4,4"/>
            <rect x="0" y="-18" width="30" height="18" fill="#a855f7"/>
            <text x="3" y="-5" fill="white" font-size="8" font-weight="700">PEDESTRIAN</text>
            
            <circle cx="20" cy="18" r="8" fill="#f472b6"/>
            <line x1="20" y1="26" x2="20" y2="60" stroke="#f472b6" stroke-width="4"/>
            <line x1="20" y1="35" x2="5" y2="50" stroke="#f472b6" stroke-width="3"/>
            <line x1="20" y1="35" x2="35" y2="50" stroke="#f472b6" stroke-width="3"/>
            <line x1="20" y1="60" x2="10" y2="85" stroke="#f472b6" stroke-width="3.5"/>
            <line x1="20" y1="60" x2="30" y2="85" stroke="#f472b6" stroke-width="3.5"/>
          </g>
        `;
      }
    } else if (category === "moderation") {
      const toxicComments = [
        "If you're not willing to respect other people's opinions, please leave this conversation. It's unpleasant that you keep using demeaning language.",
        "Your policy proposal seems a bit short on evidence. I'm attaching a link to a counter research report here — let's discuss it calmly.",
        "People like you don't belong in this community. If you post again, I'll keep reporting you.",
        "The new quadcopter camera rig I picked up works pretty well. The battery lasts over 45 minutes, so outdoor filming has been great.",
        "That opinion is really rude and low quality. Stop talking like that.",
        "Does anyone know if the community pool is open for adult freestyle swim tomorrow morning? Thanks!",
        "I haven't been able to reach this seller after the transaction. Please check the transaction history before any further deals.",
        "The blueberry scones at the downtown bakery on Thursday mornings are amazing. Get there before 9am or they sell out.",
        "I think anyone who keeps posting garbage like this should have their account suspended.",
        "Does anyone know if the community pool is open for adult freestyle swim tomorrow morning?"
      ];

      const commentText = toxicComments[index % toxicComments.length];
      const isToxic = index % 2 === 0; // Toxic comment at index 0, 2, 4, 6, 8

      svgContent += `
        <foreignObject x="25" y="40" width="450" height="220">
          <div xmlns="http://www.w3.org/1999/xhtml" style="color:#1f2937; font-size:12px; line-height:1.5; background:#ffffff; padding:16px; border-radius:10px; border:1px solid #e5e7eb; height: 100%; box-sizing: border-box; box-shadow:0 6px 18px rgba(17,24,39,0.08);">
            <div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid #e5e7eb; padding-bottom:6px;">
              <span style="font-weight:700; color:#2563eb; font-family:'Inter', sans-serif;">User_ID: anon_user_${1000 + index}</span>
              <span style="font-size:10px; color:#6b7280;">Post No. #15,${200 + index}</span>
            </div>
            <p style="font-style: italic; color:#111827; background:#f8fafc; padding:8px; border-radius:6px; border-left: 3px solid ${isToxic ? '#ef4444' : '#14b8a6'}">
              "${commentText}"
            </p>
            <div style="margin-top:10px; font-size:10px; color:#6b7280;">
              <span style="background:${isToxic ? '#fef2f2' : '#ecfdf5'}; color:${isToxic ? '#b91c1c' : '#047857'}; padding:2px 6px; border-radius:999px; font-weight:700;">
                ${isToxic ? 'Possible policy violation' : 'Policy-compliant text'}
              </span>
            </div>
          </div>
        </foreignObject>
      `;
    } else if (category === "medical_alert") {
      const alertMatches = index % 2 === 0;
      const recordAllergy = alertMatches ? "Penicillin" : "Latex";
      svgContent += `
        <rect x="55" y="40" width="390" height="220" rx="14" fill="#ffffff" stroke="#cbd5e1"/>
        <text x="80" y="75" fill="#475569" font-size="12" font-weight="700">SYNTHETIC RESEARCH RECORD</text>
        <text x="80" y="108" fill="#0f172a" font-size="15">Recorded allergy: ${recordAllergy}</text>
        <rect x="80" y="135" width="340" height="72" rx="10" fill="#fff7ed" stroke="#fdba74"/>
        <text x="100" y="163" fill="#9a3412" font-size="12" font-weight="700">SYSTEM ALERT</text>
        <text x="100" y="190" fill="#0f172a" font-size="15">Penicillin allergy warning</text>
        <text x="250" y="238" text-anchor="middle" fill="#64748b" font-size="11">No real patient data · No diagnosis</text>
      `;
    } else if (category === "ocr") {
      const match = index % 2 === 0;
      const receiptPrice = (12 + (index % 5) * 3).toFixed(2);
      const extractedPrice = match ? receiptPrice : (Number(receiptPrice) + 1).toFixed(2);
      svgContent += `
        <rect x="55" y="35" width="190" height="230" rx="8" fill="#ffffff" stroke="#cbd5e1"/>
        <text x="150" y="65" text-anchor="middle" fill="#0f172a" font-size="13" font-weight="700">RECEIPT</text>
        <line x1="80" y1="82" x2="220" y2="82" stroke="#cbd5e1"/>
        <text x="80" y="115" fill="#475569" font-size="12">Product ${index + 1}</text>
        <text x="205" y="115" text-anchor="end" fill="#0f172a" font-size="14">$${receiptPrice}</text>
        <text x="80" y="155" fill="#94a3b8" font-size="11">Thank you</text>
        <rect x="280" y="78" width="165" height="120" rx="10" fill="#eef2ff" stroke="#c7d2fe"/>
        <text x="300" y="108" fill="#4338ca" font-size="11" font-weight="700">OCR EXTRACT</text>
        <text x="300" y="150" fill="#0f172a" font-size="22" font-weight="700">$${extractedPrice}</text>
      `;
    } else if (category === "accessibility") {
      const correct = index % 2 === 0;
      svgContent += `
        <rect x="45" y="45" width="410" height="210" rx="14" fill="#ffffff" stroke="#cbd5e1"/>
        <rect x="75" y="85" width="150" height="120" fill="#e2e8f0" stroke="#94a3b8"/>
        <rect x="120" y="130" width="55" height="75" fill="#ffffff" stroke="#64748b"/>
        <path d="M230 205 L320 165 L380 205" fill="none" stroke="#14b8a6" stroke-width="8"/>
        <circle cx="335" cy="118" r="14" fill="none" stroke="#4f46e5" stroke-width="3"/>
        <path d="M335 132 L335 170 M318 145 L350 145 M335 170 L318 196 M335 170 L353 196" stroke="#4f46e5" stroke-width="3" fill="none"/>
        <text x="250" y="82" fill="#0f172a" font-size="13" font-weight="700">Provided information</text>
        <text x="250" y="105" fill="#475569" font-size="12">Wheelchair ramp: ${correct ? "Available" : "Not available"}</text>
        <text x="250" y="230" fill="#64748b" font-size="10">Research-purpose facility illustration</text>
      `;
    } else if (category === "preference") {
      const leftHue = 210 + (index % 3) * 25;
      const rightHue = 20 + (index % 4) * 25;
      svgContent += `
        <rect x="45" y="45" width="185" height="210" rx="16" fill="#ffffff" stroke="#cbd5e1"/>
        <rect x="270" y="45" width="185" height="210" rx="16" fill="#ffffff" stroke="#cbd5e1"/>
        <circle cx="138" cy="135" r="58" fill="hsl(${leftHue}, 70%, 82%)"/>
        <rect x="105" y="105" width="66" height="66" rx="14" fill="hsl(${leftHue}, 60%, 52%)"/>
        <circle cx="363" cy="135" r="58" fill="hsl(${rightHue}, 75%, 84%)"/>
        <path d="M330 170 L363 98 L396 170 Z" fill="hsl(${rightHue}, 68%, 52%)"/>
        <text x="138" y="230" text-anchor="middle" fill="#334155" font-size="13" font-weight="700">IMAGE A</text>
        <text x="363" y="230" text-anchor="middle" fill="#334155" font-size="13" font-weight="700">IMAGE B</text>
      `;
    } else {
      const isSymmetrical = index % 2 === 0;
      svgContent += `
        <circle cx="250" cy="150" r="70" fill="none" stroke="#14b8a6" stroke-width="3"/>
        <circle cx="250" cy="150" r="3" fill="#14b8a6"/>
        
        <g transform="translate(225, 125) ${isSymmetrical ? 'rotate(0)' : 'rotate(-45, 25, 25)'}">
          <polygon points="25,0 50,45 0,45" fill="rgba(245, 158, 11, 0.3)" stroke="#f59e0b" stroke-width="2"/>
        </g>
        <text x="250" y="245" fill="#94a3b8" font-size="12" text-anchor="middle">Target verification state: ${isSymmetrical ? 'Fully symmetric (0 deg)' : 'Asymmetric, tilted left (-45 deg)'}</text>
      `;
    }

    svgContent += `</svg>`;
    return svgContent;
  };

  const renderImageCanvas = () => {
    canvasLoading.classList.add("active");

    setTimeout(() => {
      const svg = generateDynamicSVGAsset(workerSession.category, workerSession.progress);
      canvasImgContainer.innerHTML = svg;
      canvasLoading.classList.remove("active");
    }, 350);
  };

  // Render classification options and questions
  const renderLabelingOptions = () => {
    optionsWrapper.innerHTML = "";
    workerSession.selectedOption = null;
    if (workerSession.status === "started") workerSession.itemStartedAt = new Date().toISOString();
    btnSubmitAnnotation.disabled = true;

    let questionText = "Refer to the guide on the canvas to finalize your reading:";
    let options = [];

    if (workerSession.category === "medical") {
      questionText = "Does the provided chest X-ray scan image show a suspected tumor density lesion fragment?";
      options = [
        "Normal finding: no unusual texture or lesion abnormality",
        "Abnormal finding: significant nodule/tumor trace detected",
        "Unable to judge: image noise or low-resolution focus blur"
      ];
    } else if (workerSession.category === "autonomous") {
      questionText = "Classify the traffic hazard obstacle inside the highlighted road bounding box:";
      options = [
        "No obstacle: clear driving lane",
        "Pedestrian silhouette detected",
        "Standard passenger vehicle body detected",
        "Road construction barrier obstacle detected"
      ];
    } else if (workerSession.category === "moderation") {
      questionText = "Does this user comment post show aggressive tendencies that violate rules against threats or demeaning language?";
      options = [
        "Clean text: complies with community guidelines",
        "Malicious post: violates rules against abusive language/harassment",
        "Spam/promotional: unwanted commercial promotion or flooding content"
      ];
    } else if (workerSession.category === "medical_alert") {
      questionText = "Does the allergy information in the synthetic record match the system alert? This is a research review, not an actual medical diagnosis.";
      options = ["Correct alert", "Incorrect alert"];
    } else if (workerSession.category === "ocr") {
      questionText = "Please compare the receipt's item price with the OCR-extracted price.";
      options = ["Match", "Mismatch"];
    } else if (workerSession.category === "accessibility") {
      questionText = "Please check whether the facility diagram matches the provided accessibility information.";
      options = ["Information correct", "Information needs correction"];
    } else if (workerSession.category === "preference") {
      questionText = "Please choose the product image you prefer between the two. There is no right answer shown to the worker.";
      options = ["Image A", "Image B"];
    } else {
      questionText = "Determine the rotational orientation of the target image element at the center of the canvas:";
      options = [
        "Fully symmetric orientation (0 degree rotation)",
        "Asymmetric, left-leaning (-45 degree tilt)",
        "Asymmetric, right-leaning (+45 degree tilt)"
      ];
    }

    labelingQuestion.textContent = questionText;

    options.forEach((opt, idx) => {
      const optBtn = document.createElement("button");
      optBtn.className = "option-btn";
      optBtn.textContent = opt;
      optBtn.setAttribute("data-index", idx);

      optBtn.addEventListener("click", () => {
        const optionButtons = optionsWrapper.querySelectorAll(".option-btn");
        optionButtons.forEach(btn => btn.classList.remove("selected"));
        optBtn.classList.add("selected");

        workerSession.selectedOption = idx;
        btnSubmitAnnotation.disabled = false;
      });

      optionsWrapper.appendChild(optBtn);
    });

    // Update progress numbers
    labelProgressText.textContent = `${workerSession.progress} / ${workerSession.totalItems}`;
    progressBarInner.style.width = `${(workerSession.progress / workerSession.totalItems) * 100}%`;

  };

  // Get Ground Truth target indexes and reasoning
  const getGroundTruthForAsset = (category, index) => {
    let correctIdx = 0;
    let explanation = "";

    if (category === "medical") {
      const isAnomalous = (index === 2 || index === 5 || index === 8);
      correctIdx = isAnomalous ? 1 : 0;
      explanation = isAnomalous
        ? "This radiograph shows a clear, dense nodular shadow inside the examination circle. Please recheck the marked red dashed area."
        : "The tissue beneath all the ribs in the lungs shows clear, even translucency. There is no trace of an abnormal tumor nodule.";
    } else if (category === "autonomous") {
      const isPedestrian = (index === 1 || index === 4 || index === 7);
      correctIdx = isPedestrian ? 1 : 2;
      explanation = isPedestrian
        ? "A pink pedestrian silhouette is blocking the center of the lane inside the bounding array box, requiring a safety stop."
        : "What's captured in the center frame is the rear body of the vehicle ahead. This aligns with the standard vehicle-obstacle pattern.";
    } else if (category === "moderation") {
      const isToxic = (index % 2 === 0);
      correctIdx = isToxic ? 1 : 0;
      explanation = isToxic
        ? "The user comment contains hateful slurs, doxxing threats, and directly demeaning language, meeting the threshold for a direct violation."
        : "This comment is a mild question or a counter-argument to a suggestion, and does not violate rules against abusive or insulting language.";
    } else if (category === "medical_alert") {
      correctIdx = index % 2 === 0 ? 0 : 1;
      explanation = "Judged based on whether the allergy entries in the synthetic record match the system alert string.";
    } else if (category === "ocr") {
      correctIdx = index % 2 === 0 ? 0 : 1;
      explanation = "Judged based on whether the price shown on the receipt numerically matches the OCR-extracted price.";
    } else if (category === "accessibility") {
      correctIdx = index % 2 === 0 ? 0 : 1;
      explanation = "Checks whether the ramp shown in the diagram matches the provided information.";
    } else if (category === "preference") {
      correctIdx = null;
      explanation = "Preference responses have no right answer, so only the raw choice is stored and it is excluded from the Task Accuracy calculation.";
    } else {
      const isSymmetrical = (index % 2 === 0);
      correctIdx = isSymmetrical ? 0 : 1;
      explanation = isSymmetrical
        ? "The polygon vector vertices point precisely along the vertical y-axis centerline with no distortion, forming a uniform symmetry."
        : "The target image element is tilted 45 degrees counterclockwise, meeting the criteria for a left-asymmetric classification.";
    }

    return { correctIdx, explanation };
  };

  // Submit Annotation directly
  btnSubmitAnnotation.addEventListener("click", () => {
    if (workerSession.selectedOption === null) return;

    const submittedAt = new Date().toISOString();
    const groundTruth = getGroundTruthForAsset(workerSession.category, workerSession.progress);
    const isScorable = Number.isInteger(groundTruth.correctIdx);
    const isCorrect = isScorable ? workerSession.selectedOption === groundTruth.correctIdx : null;
    const itemStartMs = Date.parse(workerSession.itemStartedAt || "");
    const submittedMs = Date.parse(submittedAt);
    const response = {
      itemIndex: workerSession.progress,
      selectedOption: workerSession.selectedOption,
      correctOption: groundTruth.correctIdx,
      isCorrect,
      isScorable,
      itemStartedAt: workerSession.itemStartedAt,
      itemSubmittedAt: submittedAt,
      responseTimeMs: Number.isFinite(itemStartMs) ? Math.max(0, submittedMs - itemStartMs) : null
    };
    workerSession.responses.push(response);
    workerSession.attemptedItems += 1;
    if (isScorable) workerSession.scoredItems += 1;
    if (isCorrect === true) workerSession.correctItems += 1;
    Object.assign(workerSession, calculateTaskAccuracy(workerSession.correctItems, workerSession.scoredItems));
    workerSession.lastSeenAt = submittedAt;

    showToast("Submitted. Moving to the next item.");
    workerSession.progress += 1;
    syncWorkerSession("PATCH", workerSession);

    if (workerSession.progress >= workerSession.totalItems) {
      completeLabelingItems();
    } else {
      renderImageCanvas();
      renderLabelingOptions();
    }
  });

  // Finished 10 labeling tasks -> Transition directly to final panel
  const completeWorkerSession = (task = {}) => {
    const completedAt = new Date().toISOString();
    workerSession.status = "completed";
    workerSession.completedAt = completedAt;
    workerSession.lastSeenAt = completedAt;
    Object.assign(workerSession, calculateTaskAccuracy(workerSession.correctItems, workerSession.scoredItems ?? workerSession.attemptedItems));
    Object.assign(workerSession, calculateCompletionTime(workerSession.taskStartedAt, completedAt));
    const record = {
      ...toSerializableSession(workerSession),
      taskTitle: task.title || "Crowd Annotation Task",
      taskCategory: task.taskCategory || task.category || "general",
      taskType: task.taskType || workerSession.taskType || "",
      taskTypeLabel: task.taskTypeLabel || workerSession.taskTypeLabel || "",
      taskTypeReason: task.taskTypeReason || "",
      taskTypeCharacteristics: task.taskTypeCharacteristics || [],
      reward: task.reward || "1.50",
      timeLimitMinutes: task.timeLimitMinutes || "15",
      riskLevel: task.riskLevel || "medium",
      fatigueLevel: task.fatigueLevel || "medium",
      objective: task.objective || "",
      socialImpact: task.socialImpact || "",
      workerContext: task.workerContext || "",
      psychologicalFactors: task.psychologicalFactors || null,
      selectedFrames: task.selectedFrames || task.psychologicalFactors?.selectedFrames || [],
      structuredPrompt: task.structuredPrompt || "",
      beforeCandidates: task.beforeCandidates || [],
      afterCandidates: task.afterCandidates || [],
      beforeCandidateFrames: task.beforeCandidateFrames || [],
      afterCandidateFrames: task.afterCandidateFrames || [],
      finalBeforeText: task.finalBeforeText || task.beforeText || "",
      finalAfterText: task.finalAfterText || task.afterText || "",
      llmProvider: task.llmProvider || "local",
      llmModel: task.llmModel || ""
    };
    persistWorkerSessionLocally(record);
    syncWorkerSession("PATCH", record);
    return record;
  };

  const completeLabelingItems = () => {
    clearInterval(workerSession.timerInterval);

    workerWorkspace.classList.add("hidden");
    workerPostTask.classList.remove("hidden");

    const tasks = JSON.parse(localStorage.getItem("agentic_tasks")) || {};
    const task = activeWorkerTask || tasks[workerSession.taskId] || {};

    const sessionRecord = completeWorkerSession(task);

    // Save session record to results database in cache
    const results = JSON.parse(localStorage.getItem("agentic_results")) || [];
    results.push(sessionRecord);
    localStorage.setItem("agentic_results", JSON.stringify(results));
    saveResultToServer(sessionRecord);

    postTaskMessageText.textContent = task.afterText || "The annotation task has been completed successfully. Thank you!";

    // Bind final UI stats (Only approved reward is shown since accuracy and warnings are removed)
    postMetricReward.textContent = `$${task.reward || "1.50"}`;

    // Celebrate with confetti!
    if (typeof confetti === "function") {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.65 } });
      setTimeout(() => {
        confetti({ particleCount: 100, spread: 120, origin: { y: 0.55 } });
      }, 350);
    }
  };

  btnBackToRequester?.remove();

  window.addEventListener("pagehide", () => markWorkerSessionAbandoned(true));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible" || workerSession.status !== "started") return;
    workerSession.lastSeenAt = new Date().toISOString();
    syncWorkerSession("PATCH", workerSession);
  });

  renderExampleTaskButtons();
  renderTaskTypeOptions();
  renderSurveyEvidenceTable();
  renderWorkerPreviewFrameKeywords();
  updateFormCompletion();
  // Workspace is revealed only after the CTA is clicked in the current visit.
  setWorkspaceAvailability(false);

  // Load router views on init
  handleRouting();
});
