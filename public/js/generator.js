/**
 * Agentic Motivation Generator Engine (English Version)
 * Grounded in Self-Determination Theory (SDT) and HCI Korea 2025 Research
 * Synthesizes intrinsic motivational interventions based on crowdsourcing task details in English.
 * Features an integrated Task Description Copilot for Requesters.
 */

const TaskTypeRegistry = globalThis.TaskTypeConfig
  || (typeof require === "function" ? require("./task-types.js") : null);

class AgenticMotivationGenerator {
  constructor() {
    // English theme mapping and theory-grounded reinforcement vocabulary
    this.categoryMappings = {
      medical: {
        themeName: "Medical Research & Diagnostics",
        socialImpact: "Help protect patients' precious lives and maximize the clinical reliability of early disease-diagnosis AI technology",
        competenceHighlight: "Your precise visual verification, like a highly trained expert, is the final diagnostic tool that catches the fine tissue shadows standard algorithms tend to miss.",
        keywords: ["cancer", "cell", "medical", "scan", "mri", "tumor", "health", "doctor", "hospital", "patient", "clinical", "disease"]
      },
      moderation: {
        themeName: "Content Moderation",
        socialImpact: "Help safely protect innocent children, teenagers, and thousands of community users from anonymous abusive language and malicious content",
        competenceHighlight: "Mechanical filtering bots cannot fully judge the subtle emotional and linguistic nuance of human language. Your careful values and empathy are the only real line of defense.",
        keywords: ["toxic", "moderation", "filter", "community", "safety", "protect", "report", "abuse", "harassment", "distressing"]
      },
      autonomous: {
        themeName: "Autonomous Road Safety",
        socialImpact: "Help secure the safety of autonomous vehicle models, prevent pedestrian collisions, and build safer streets for everyone",
        competenceHighlight: "The high level of vigilance and situational judgment you show is the most important safeguard against driving malfunctions or recognition errors that decide passenger safety.",
        keywords: ["car", "road", "vehicle", "pedestrian", "traffic", "driving", "sensor", "collision", "autonomous", "lane"]
      },
      translation: {
        themeName: "Translation & Localization",
        socialImpact: "Help weave different languages and sensibilities together, lowering communication barriers between global communities and expanding peaceful connection",
        competenceHighlight: "A translation algorithm that merely translates words literally cannot capture the essence of an expression. Only your precise cultural insight brings a sentence to life.",
        keywords: ["translation", "language", "culture", "english", "korean", "text", "speech", "translate", "localization"]
      },
      general: {
        themeName: "Advanced AI Development",
        socialImpact: "Help build the foundation for training a safe, reliable, human-friendly next-generation AI model aligned with human values and philosophy",
        competenceHighlight: "No matter how capable a large-scale AI is, it starts only with ground-truth data refined by humans. Your careful annotation defines the model's quality.",
        keywords: ["ai", "artificial intelligence", "machine learning", "data", "dataset", "label", "annotation", "train"]
      }
    };
  }

  /**
   * Requester template draft generation (English)
   */
  generateTaskDraft(rawKeywords, category) {
    const keywords = rawKeywords.trim() || "Data Classification";

    // Format the keyword name
    const titleTitle = keywords;
    const categoryInfo = this.categoryMappings[category] || this.categoryMappings.general;

    let draftTitle = titleTitle;
    let draftDescription = "";

    if (category === "medical") {
      draftDescription = `### Task Overview
We are building training data related to "${titleTitle}". The goal is to carefully review the provided images or material and accurately classify any abnormal features or lesions related to "${titleTitle}".

### Detailed Guidelines & Classification Rules
1. Review the provided visual material as carefully as possible. Watch closely for subtle texture differences, shading changes, or specific regions.
2. Identify the internal shape of the target and choose the most accurate classification option available.
3. If the material is heavily distorted or cannot be identified with confidence, do not force a judgment — submit "Unable to Judge" or skip it.

### Diligence Pledge
The judgment you contribute to this project is one of the most important factors determining the AI model's performance. We deeply appreciate the careful eye behind every label you provide.`;
    } else if (category === "autonomous") {
      draftDescription = `### Task Overview
We are refining a dataset for training a smart AI model to recognize "${titleTitle}". The goal is to judge and accurately identify hazards or driving situations involving "${titleTitle}" within the visual feed.

### Detailed Guidelines & Classification Rules
1. Carefully observe the target in the highlighted area or at the center of the canvas.
2. Determine the attributes within the target point (surrounding hazards, obstacles, vehicle orientation, etc.).
3. If the target point is empty or shows a normal road environment, click "No Obstacle".

### Diligence Pledge
We sincerely thank you for your diligent and careful annotation contribution. Please work at a comfortable pace without rushing, and judge each item carefully. Your focus is a cornerstone of a safer tomorrow.`;
    } else if (category === "moderation") {
      draftDescription = `### Task Overview
We are running a "${titleTitle}" moderation verification project to help protect a safe and healthy space. The goal is to accurately detect harmful levels or violations related to "${titleTitle}" in the provided text and posts.

### Detailed Guidelines & Classification Rules
1. Calmly analyze the emotional tone of the user text or feedback and whether it violates policy.
2. Judge whether the material meets the violation criteria for "${titleTitle}" (abusive language, demeaning speech, spam, etc.) or is normal content.
3. A simple difference in tone or a lighthearted joke is not a violation — focus on the defined level of harmful intent.

### Diligence Pledge
Only your careful attention and sense of ethics can catch the subtle human emotion and hurt that automated filtering models struggle to detect. We're deeply grateful for your valuable contribution to building a healthier community.`;
    } else {
      draftDescription = `### Task Overview
We are running an important project to improve the data quality that underlies training the "${titleTitle}" model. The goal is to closely observe the canvas element and classify its "${titleTitle}" attributes.

### Detailed Guidelines & Classification Rules
1. Carefully check the target shape and its placement at the center of the screen.
2. Comprehensively judge the target's geometric shape, symmetry, or rotation angle, then select the most accurate option.
3. Before finalizing your submission, take one more calm look to confirm your selected option is correct.

### Diligence Pledge
The intelligence of an AI model is directly proportional to the quality of the data workers like you refine. We are always deeply grateful for the wisdom and diligence you bring.`;
    }

    return {
      title: draftTitle,
      description: draftDescription,
      reward: category === "medical" ? "2.50" : (category === "autonomous" ? "1.80" : "1.20")
    };
  }

  /**
   * Requester guideline structure enhancement (English)
   */
  optimizeDescription(description) {
    if (!description || description.trim().length < 5) {
      return "Please write a brief draft guideline in the text box first so the copilot can optimize it.";
    }

    let rawText = description;
    rawText = rawText.replace(/###\s+/g, "").split("?").join("");

    return `### Task Overview
${rawText.trim()}

### Detailed Guidelines & Notes
1. Before finalizing your answer, please calmly and carefully review the provided target image and its state once more.
2. If you feel fatigued during the task, there's no need to force yourself — feel free to take a breath and judge at a relaxed pace.
3. If you encounter an item that is genuinely difficult to judge because the criteria are ambiguous, choose the most conservative option rather than forcing a guess.

### Crowd Worker Code of Conduct
We deeply value the unique cognitive insight and focus you bring. The data you carefully refine, item by item, becomes more than simple annotation — it's the foundation of a safer, smarter AI technology for the future. We sincerely thank you for refining this valuable contribution at your own self-directed pace.`;
  }

  /**
   * Converts the task context into a "psychological frame" that can be explained in a patent document.
   * This step is the core logic that distinguishes this from a simple LLM call.
   */
  buildPsychologicalProfile(title, category, description, riskLevel, fatigueLevel, objective, socialImpact, workerContext, singleTaskLimitMinutes = 15, taskType = "") {
    const activeProfile = this.categoryMappings[category] || this.categoryMappings.general;

    const safeObjective = this.cleanInput(objective) || this.inferObjective(title, description, activeProfile);
    const safeImpact = this.cleanInput(socialImpact) || activeProfile.socialImpact;
    const safeContext = this.cleanInput(workerContext) || "An online microtask environment requiring continuous judgment of several items in a short time";
    const confirmedTaskTypeKey = TaskTypeRegistry.normalizeTaskTypeKey(taskType) || TaskTypeRegistry.DEFAULT_TASK_TYPE;
    const confirmedTaskType = TaskTypeRegistry.getTaskType(confirmedTaskTypeKey, "en");
    const strategySelection = TaskTypeRegistry.getStrategySelection(confirmedTaskTypeKey);
    const inferredTaskTypes = [{
      type: confirmedTaskType.label,
      evidence: "Task Type selected directly by the requester",
      confidence: 1
    }];
    const primaryTaskType = confirmedTaskType.label;
    const primaryFrameRule = this.getFrameRule(primaryTaskType);
    const burdens = [];
    burdens.push(primaryFrameRule.burden);
    if (riskLevel === "high") burdens.push("Emotional burden or high sense of responsibility");
    if (riskLevel === "medium") burdens.push("A moderate level of attentional burden");
    if (fatigueLevel === "high") burdens.push("High repetitive fatigue and visual focus burden");
    if (fatigueLevel === "medium") burdens.push("Moderate fatigue from repetitive work");
    if (safeContext) burdens.push(`Task characteristic: ${safeContext}`);

    const opportunities = [];
    opportunities.push(`Give meaning to the concrete task objective: ${safeObjective}`);
    opportunities.push(`Connect to social value: ${safeImpact}`);
    opportunities.push(`Purpose of applying the frame: ${primaryFrameRule.purpose}`);
    if (fatigueLevel !== "low") opportunities.push("Provide a sense that the task can be finished quickly");
    if (riskLevel !== "low") opportunities.push("Acknowledge the worker's judgment ability without exaggeration");
    opportunities.push("Use language that respects the worker's judgment and pace within the given guidelines");

    const selectedFrames = [...strategySelection.selectedFrames];
    const taskTypeReason = confirmedTaskType.mappingReason;

    return {
      title: this.cleanInput(title),
      category,
      theme: activeProfile.themeName,
      riskLevel,
      fatigueLevel,
      objective: safeObjective,
      socialImpact: safeImpact,
      workerContext: safeContext,
      singleTaskLimitMinutes: Number(singleTaskLimitMinutes || 15),
      inferredTaskTypes,
      primaryTaskType,
      taskType: confirmedTaskTypeKey,
      taskTypeLabel: confirmedTaskType.label,
      taskTypeReason,
      taskTypeCharacteristics: confirmedTaskType.characteristics,
      coreStrategy: strategySelection.coreStrategy,
      supportingStrategy: strategySelection.supportingStrategy,
      surveyEvidence: {
        sampleSize: TaskTypeRegistry.SURVEY_SAMPLE_SIZE,
        corePercentage: strategySelection.corePercentage,
        supportingPercentage: strategySelection.supportingPercentage,
        thirdStrategy: strategySelection.thirdStrategy,
        thirdPercentage: strategySelection.thirdPercentage,
        messageLength: TaskTypeRegistry.MESSAGE_LENGTH_EVIDENCE
      },
      psychologicalBurden: burdens,
      motivationalOpportunity: opportunities,
      selectedFrames,
      frameSelectionReason: this.explainFrameSelection(selectedFrames, primaryTaskType),
      constraintsApplied: [
        "4-5 English sentences for each of the pre-task and post-task final messages",
        "No guilt-inducing language",
        "No productivity pressure or forced performance claims",
        "Mention the task objective at least once",
        "Center the message on the Task Type's fixed core strategy",
        "Naturally reflect the Task Type's fixed supporting strategy with less weight",
        "Never mechanically add the unselected 3rd-priority strategy to the final message"
      ]
    };
  }

  selectPrimaryTaskType(inferredTaskTypes = []) {
    const types = inferredTaskTypes.map(item => item.type);
    const configuredLabels = Object.values(TaskTypeRegistry.TASK_TYPES).map(type => type.label);
    return configuredLabels.find(type => types.includes(type)) || TaskTypeRegistry.TASK_TYPES[TaskTypeRegistry.DEFAULT_TASK_TYPE].label;
  }

  getFrameRule(taskType) {
    const type = TaskTypeRegistry.getTaskType(taskType, "en") || TaskTypeRegistry.localizeTaskType(TaskTypeRegistry.TASK_TYPES[TaskTypeRegistry.DEFAULT_TASK_TYPE], "en");
    const selection = TaskTypeRegistry.getStrategySelection(type.key);
    return {
      psychologicalType: type.psychologicalType,
      burden: type.burden,
      frames: [...selection.selectedFrames],
      frameLabel: selection.selectedFrames.join(" + "),
      purpose: type.purpose,
      taskType: type.key,
      taskTypeLabel: type.label,
      reviewReasons: type.reviewReasons
    };
  }

  toFrameLabel(frame = "") {
    if (/Autonomy/.test(frame)) return "Autonomy";
    if (/Competence/.test(frame)) return "Competence";
    if (/Relatedness/.test(frame)) return "Relatedness";
    return frame;
  }

  explainFrameSelection(selectedFrames, primaryTaskType = "") {
    const rule = this.getFrameRule(primaryTaskType);
    const evidence = TaskTypeRegistry.getStrategySelection(rule.taskType);
    return `Based on the 120-crowdworker survey results, ${selectedFrames[0]} (${evidence.corePercentage.toFixed(1)}%) is applied as the core strategy and ${selectedFrames[1]} (${evidence.supportingPercentage.toFixed(1)}%) as the supporting strategy.`;
  }

  getFrameNeed(frame = "") {
    if (/Autonomy/.test(frame)) return "autonomy";
    if (/Competence/.test(frame)) return "competence";
    return "relatedness";
  }

  buildReviewCriteria(profile = {}) {
    const primaryTaskType = profile.primaryTaskType || TaskTypeRegistry.TASK_TYPES[TaskTypeRegistry.DEFAULT_TASK_TYPE].label;
    const selectedFrames = Array.isArray(profile.selectedFrames) ? profile.selectedFrames : [];
    const visibleFrames = selectedFrames.slice(0, 2);

    const checks = {
      autonomy: "Checks whether the message avoids rushing the worker's judgment and reassures them that ambiguous items don't need to be forced into a decision.",
      competence: "Checks whether the message trusts the worker's judgment and concrete contribution without exaggerating correctness or performance.",
      relatedness: "Checks whether the message concretely acknowledges the worker's time, effort, and contribution without exaggeration or inducing obligation."
    };
    const labels = {
      autonomy: "Autonomy",
      competence: "Competence",
      relatedness: "Relatedness"
    };
    const icons = { autonomy: "lucide-sliders-horizontal", competence: "lucide-badge-check", relatedness: "lucide-heart-handshake" };
    const reasons = this.getFrameRule(primaryTaskType).reviewReasons;

    return visibleFrames.map((frame, index) => {
      const need = this.getFrameNeed(frame);
      return {
        need,
        frame,
        label: labels[need],
        icon: icons[need],
        priority: index === 0 ? "core" : "support",
        priorityLabel: index === 0 ? "Core" : "Supporting",
        whyNeeded: reasons[need],
        messageCheck: checks[need],
        selected: selectedFrames.some(selected => this.getFrameNeed(selected) === need)
      };
    });
  }

  cleanInput(value) {
    return String(value || "")
      .replace(/[<>]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  inferObjective(title, description, activeProfile) {
    const source = `${title || ""} ${description || ""}`.trim();
    if (!source) return "Carefully review the provided item and choose the most appropriate label";
    return `Carefully classify items related to ${source.slice(0, 60)}${source.length > 60 ? "..." : ""}`;
  }

  /**
   * Builds the structured prompt to send to the LLM.
   * In production this string is sent to the server API; no API key is kept in the browser.
   */
  buildStructuredPrompt(profile, phase = "both") {
    return `You are a psychological message generation agent for microtask crowdsourcing.

Your goal is to generate a short motivational message that reduces worker dropout during a 10?15 minute task.
Do not generate generic encouragement. First, infer the task's psychological burden and motivational opportunity from the structured input.

Input:
- Task title: ${profile.title}
- Task goal: ${profile.objective}
- Confirmed Task Type: ${profile.taskTypeLabel} (${profile.taskType})
- Task Type selection reason: ${profile.taskTypeReason}
- Task Type characteristics: ${(profile.taskTypeCharacteristics || []).map(item => item.label).join(", ")}
- Task Type role: worker-experience classification, not an interface or HIT type
- Risk level: ${profile.riskLevel}
- Expected fatigue: ${profile.fatigueLevel}
- Social impact: ${profile.socialImpact}
- Worker context: ${profile.workerContext}
- Single task time limit: ${profile.singleTaskLimitMinutes || 15} minutes
- Additional task-experience signals: ${profile.inferredTaskTypes.map(item => item.type).join(", ")}
- Primary psychological task type: ${this.getFrameRule(profile.primaryTaskType).psychologicalType}
- Core strategy (message's central strategy): ${profile.selectedFrames[0] || "None"}
- Supporting strategy (meaningfully complements Core): ${profile.selectedFrames[1] || "None"}
- Strategy evidence: survey of ${profile.surveyEvidence?.sampleSize || 120} crowdworkers; Core ${profile.surveyEvidence?.corePercentage || "-"}%, Supporting ${profile.surveyEvidence?.supportingPercentage || "-"}%
- Message length evidence: Medium was preferred by 66.7% (80/120); operationalized as 4–5 sentences
- Generation phase: ${phase}

Step 1. Preserve the fixed Task Type strategy priority.
- Generate three candidates in this exact order: Relatedness, Competence, and Autonomy.
	- Each candidate and each final message must contain 4 or 5 complete, naturally connected sentences.
	- Never return 3 or fewer sentences or 6 or more sentences.
	- Both finalBeforeText and finalAfterText must naturally reflect Core and Supporting.
	- Core must remain the central message strategy; Supporting must complement it with less emphasis.
- Apply each strategy's meaning to the whole message, not by inserting stock keywords.
- finalBeforeText and finalAfterText must blend only the candidates matching the selected frames.
- Do not mechanically add an unselected SDT frame to finalBeforeText.

Step 2. Generate a before-task message under these constraints:
- English
	- Exactly 4 or 5 complete sentences for each candidate and finalBeforeText
- Warm and human, as if a real requester wrote it directly
- Avoid stiff institutional phrasing; do not overuse formal boilerplate
- Use natural, conversational phrasing a real requester would use
- Use natural connectors such as "and", "if", "that's okay" where helpful
- Avoid certificate-like phrases such as "critical data", "foundation of technological progress", "directly contribute", "sincerely grateful"
- Do not invent label-specific rules that are not in the task guidelines
	- The final before-task message must start with: Hello! Thank you for taking part in the "${profile.title}" task.
- No guilt-inducing language
- No productivity pressure
- Mention the concrete task goal once
- When Relatedness is selected, connect the worker's contribution to the shared task purpose without exaggerating impact
- Acknowledge fatigue or emotional burden only when it matches the selected frames
- Write as one coherent short paragraph, not as disconnected constraint-satisfying sentences
- Do not mention SDT, frame names, category rules, or internal system rules in worker-facing messages
- Make each sentence follow naturally from the previous sentence
- An exclamation mark or one light emoji is allowed, but use at most one per message

Step 3. Generate an after-task message candidate:
- English
	- Exactly 4 or 5 complete, naturally connected sentences for each candidate and finalAfterText
- Begin with a natural acknowledgment that the task is complete
- Thank the worker for the time or effort they spent on the task
- Explain what the worker's contribution means for the selected Task Type
- Use this structure: Core + Supporting + common post-task thanks and contribution
- Keep the common thanks restrained so it never replaces or outweighs Core and Supporting
- Avoid excessive praise
- Make the thanks, contribution, and reward feel connected in context
- Close the current task only; do not invite the worker to the next task
- Describe social impact modestly as data quality improvement, not as a direct life-saving result
- Sound like a sincere note from a requester, not a formal certificate

Return JSON only:
{
  "selected_frames": [],
  "before_message": "...",
  "after_message": "..."
}`;
  }

  /**
   * Local generator for the browser demo.
   * Designed to work without an API key, while following the same constraints as the structured prompt.
   * When a server-side LLM API is connected, this function can be replaced with callLLMStructuredPrompt().
   */
  synthesizeLocalMessage(profile, strategy, phase, reward = "1.50") {
    const objective = profile.objective;
    const taskTypeContribution = this.getTaskTypeContributionStatement(profile.taskType);
    const fatiguePhrase = profile.fatigueLevel === "high"
      ? "this may take quite a bit of focus, but"
      : profile.fatigueLevel === "medium"
        ? "the repeated judgment calls may bring a little fatigue, but"
        : "this task moves along a short, clear flow";

    const taskLengthPhrase = `the time limit for this task is ${profile.singleTaskLimitMinutes || 15} minutes`;
    const autonomyPhrase = "you can proceed at your own judgment and pace within the guidelines";

    if (phase === "before") {
      if (strategy === "relatedness") {
        return `Your participation connects this task's goal—${objective}—with the material the project needs. The time and attention you contribute are respected as part of that shared effort. Each completed item becomes part of the overall result that the requester will use for the stated purpose. Thank you for adding your perspective and care to the work.`;
      }
      if (strategy === "competence") {
        return `The guidelines provide the criteria you need to work toward this task's goal: ${objective}. Your ability to notice fine distinctions and interpret each item in context is well suited to this work. Applying the same criteria carefully across items will support accurate and consistent results. We trust you can handle ambiguous cases by comparing the available evidence with the instructions.`;
      }
      if (strategy === "autonomy") {
        return `The goal of this task is ${objective}. Within the provided guidelines, you can choose how to approach each item and which details to examine first. You may set your own working order and pace while staying within the task requirements. If an item is ambiguous, use the available options and your own judgment rather than forcing a conclusion.`;
      }
      return `Thank you for taking part! The goal of this task is described as "${objective}". ${fatiguePhrase} ${taskLengthPhrase}. There's no need to feel pressured — just look at the criteria and choose each item at a comfortable pace. If an item is hard to judge, you don't need to force a decision; just choose within the guided range.`;
    }

    if (strategy === "competence") {
      return `Thank you for the time and effort you put into seeing this task through to completion. Because you applied the guidelines so carefully, we can review your submitted results with confidence. ${taskTypeContribution} Your judgment will be carefully referenced for the purpose described by the requester. Your approved reward of $${reward} has been recorded.`;
    }
    if (strategy === "relatedness") {
      return `Thank you for finishing the task and for the time and effort you gave to it. We take seriously the process of reviewing every item all the way through. ${taskTypeContribution} What you submitted will be used carefully within the scope described by the requester. Your approved reward of $${reward} has been recorded.`;
    }
    if (strategy === "autonomy") {
      return `Thank you for the time and effort you put into completing this task. You applied your own judgment within the guidelines rather than forcing a guess on ambiguous items. ${taskTypeContribution} The judgment you left will be calmly referenced within the scope described by the requester. Your approved reward of $${reward} has been recorded.`;
    }
    return `Thank you for the time and effort you put into completing this task. You calmly worked through it according to the stated goal. ${taskTypeContribution} What you submitted will be used carefully within the scope described by the requester. Your approved reward of $${reward} has been recorded.`;
  }

  getTaskTypeContributionStatement(taskType = "") {
    const statements = {
      annotation_classification: "The classification results you submitted are used to check the accuracy and consistency of the data.",
      data_collection_creation: "What you wrote helps prepare material for future analysis or content-building.",
      search_verification: "What you verified is used to check the accuracy and reliability of the information.",
      evaluation_comparison: "The evaluation you left is used as a reference for comparing results and establishing better judgment criteria.",
      content_moderation: "The results of your review are used to help maintain a safer, more trustworthy environment.",
      surveys_experiments: "What you responded with is used as a reference for interpreting research findings and understanding user experience."
    };
    return statements[TaskTypeRegistry.normalizeTaskTypeKey(taskType)]
      || "The results you submitted are used as a reference in organizing and reviewing this task's material.";
  }

  /**
   * Builds the set of selectable messages. Each option is not a repeat of the same template —
   * it explicitly reflects a different psychological frame.
   */
  generateInterventions(title, category, description, riskLevel, fatigueLevel, objective, socialImpact, workerContext, reward = "1.50", singleTaskLimitMinutes = 15, taskType = "") {
    const profile = this.buildPsychologicalProfile(
      title,
      category,
      description,
      riskLevel,
      fatigueLevel,
      objective,
      socialImpact,
      workerContext,
      singleTaskLimitMinutes,
      taskType
    );

    const beforeStrategies = ["relatedness", "competence", "autonomy"];
    const afterStrategies = ["relatedness", "competence", "autonomy"];

    const beforeOptions = beforeStrategies.map(strategy =>
      this.synthesizeLocalMessage(profile, strategy, "before", reward)
    );
    const afterOptions = afterStrategies.map(strategy =>
      this.synthesizeLocalMessage(profile, strategy, "after", reward)
    );
    const finalMessages = this.synthesizeFinalMessages(profile, beforeOptions, afterOptions, reward);

    return {
      beforeOptions,
      afterOptions,
      beforeLabels: ["Relatedness", "Competence", "Autonomy"],
      afterLabels: ["Connection & Contribution", "Confidence in Judgment", "Autonomy & Choice"],
      psychologicalFactors: {
        inferredTaskTypes: profile.inferredTaskTypes,
        primaryTaskType: profile.primaryTaskType,
        primaryPsychologicalType: this.getFrameRule(profile.primaryTaskType).psychologicalType,
        taskType: profile.taskType,
        taskTypeLabel: profile.taskTypeLabel,
        taskTypeReason: profile.taskTypeReason,
        taskTypeCharacteristics: profile.taskTypeCharacteristics,
        taskContext: profile.theme,
        psychologicalBurdens: profile.psychologicalBurden,
        motivationalFactors: profile.motivationalOpportunity,
        sdtNeeds: this.framesToSdtNeeds(profile.selectedFrames),
        selectedFrames: profile.selectedFrames,
        surveyEvidence: profile.surveyEvidence,
        reviewCriteria: this.buildReviewCriteria(profile),
        frameSelectionReason: profile.frameSelectionReason,
        constraintsApplied: profile.constraintsApplied
      },
      selectedFrames: profile.selectedFrames,
      taskType: profile.taskType,
      taskTypeLabel: profile.taskTypeLabel,
      taskTypeReason: profile.taskTypeReason,
      reviewCriteria: this.buildReviewCriteria(profile),
      beforeCandidateFrames: ["Relatedness", "Competence", "Autonomy"],
      afterCandidateFrames: ["Relatedness", "Competence", "Autonomy"],
      primaryTaskType: profile.primaryTaskType,
      psychologicalBurden: profile.psychologicalBurden,
      motivationalOpportunity: profile.motivationalOpportunity,
      structuredPrompt: this.buildStructuredPrompt(profile, "both"),
      theme: profile.theme,
      finalBeforeText: finalMessages.finalBeforeText,
      finalAfterText: finalMessages.finalAfterText,
      generationValidation: finalMessages.generationValidation
      ,beforeStrategyValidation: beforeStrategies.map((strategy, index) => ({
        strategy: this.toFrameLabel(strategy.charAt(0).toUpperCase() + strategy.slice(1)),
        index,
        corrected: false,
        valid: this.hasValidSentenceCount(beforeOptions[index])
      }))
    };
  }

  framesToSdtNeeds(frames = []) {
    const needs = [];
    frames.forEach(frame => {
      if (/Relatedness/.test(frame)) needs.push("relatedness");
      if (/Competence/.test(frame)) needs.push("competence");
      if (/Autonomy/.test(frame)) needs.push("autonomy");
    });
    return [...new Set(needs)];
  }

  getCandidateIndexForFrame(frame = "") {
    if (/Competence/.test(frame)) return 1;
    if (/Autonomy/.test(frame)) return 2;
    return 0;
  }

  getSelectedBeforeCandidateIndexes(selectedFrames = []) {
    const indexes = selectedFrames.map(frame => this.getCandidateIndexForFrame(frame));
    return [...new Set(indexes)].slice(0, 3);
  }

  stripBeforeOpening(message = "", title = "") {
    const safeTitle = this.cleanInput(title);
    const opening = `Hello! Thank you for taking part in the "${safeTitle}" task.`;
    return String(message || "")
      .replace(opening, "")
      .replace(`First of all, thank you sincerely for taking part in our "${safeTitle}" task.`, "")
      .replace(/^thank you for taking part[.!]?\s*/i, "")
      .replace(/^thanks?[.!]?\s*/i, "")
      .replace(/^a quick note before you begin\.?\s*/i, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  splitSentences(text = "") {
    return String(text || "")
      .replace(/\s+/g, " ")
      .split(/(?<=[.!?。！？])\s+/)
      .map(sentence => sentence.trim())
      .filter(Boolean);
  }

  normalizeSentenceKey(sentence = "") {
    return String(sentence || "")
      .toLowerCase()
      .replace(/^(and|so|but|maybe|also|then)\s+/, "")
      .replace(/[^0-9a-z]+/g, "")
      .trim();
  }

  areSentencesSimilar(first = "", second = "") {
    const a = this.normalizeSentenceKey(first);
    const b = this.normalizeSentenceKey(second);
    if (!a || !b) return false;
    if (a === b) return true;
    if (Math.min(a.length, b.length) >= 14 && (a.includes(b) || b.includes(a))) return true;
    const firstTokens = new Set(String(first).toLowerCase().replace(/[^0-9a-z\s]/gi, " ").split(/\s+/).filter(token => token.length > 1));
    const secondTokens = new Set(String(second).toLowerCase().replace(/[^0-9a-z\s]/gi, " ").split(/\s+/).filter(token => token.length > 1));
    if (!firstTokens.size || !secondTokens.size) return false;
    const overlap = [...firstTokens].filter(token => secondTokens.has(token)).length;
    return overlap / Math.min(firstTokens.size, secondTokens.size) >= 0.8;
  }

  dedupeSentences(sentences = []) {
    return sentences.filter((sentence, index, list) => sentence
      && !list.slice(0, index).some(previous => this.areSentencesSimilar(previous, sentence)));
  }

  normalizeRequesterTone(sentence = "") {
    return String(sentence || "")
      .replace(/greatly helps improve the reliability of the autonomous driving system/gi, "helps make the autonomous driving recognition data more stable")
      .replace(/directly connects to improving real road safety/gi, "is used to refine road scene recognition data more carefully")
      .replace(/becomes data that can help protect more lives/gi, "helps organize safety-related data more carefully")
      .replace(/protecting lives/gi, "safety-related")
      .replace(/saving lives and/gi, "carefully refining medical data and")
      .replace(/directly connects to/gi, "is used to refine")
      .replace(/could be directly connected to/gi, "could help refine the data")
      .replace(/directly contributes/gi, "helps")
      .replace(/greatly helps/gi, "helps")
      .replace(/an important process/gi, "a necessary process")
      .replace(/^especially\s+/i, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  isBoilerplateFinalSentence(sentence = "") {
    return /^(please judge carefully according to the provided guidelines\.?|a quick note before you begin|thank you)/i.test(sentence.trim());
  }

  withConnector(sentence = "", connector = "") {
    const trimmed = sentence.trim();
    if (!trimmed) return "";
    if (/^(and|so|but|maybe|also|then)\s/i.test(trimmed)) return trimmed;
    return `${connector}${trimmed}`;
  }

  composeFinalBeforeFromCandidates(title, selectedFrames = [], beforeOptions = [], fallbackText = "") {
    const safeTitle = this.cleanInput(title);
    const opening = `Hello! Thank you for taking part in the "${safeTitle}" task.`;
    const selectedIndexes = this.getSelectedBeforeCandidateIndexes(selectedFrames).slice(0, 2);
    const groups = selectedIndexes.map(index => this.getStrategyCandidateSentences(beforeOptions[index], "before", safeTitle));
    const primary = this.dedupeSentences(groups[0] || []);
    const supporting = this.dedupeSentences(groups[1] || [])
      .filter(sentence => !primary.some(coreSentence => this.areSentencesSimilar(coreSentence, sentence)));
    if (primary.length < 2 || supporting.length < 1) return fallbackText || opening;

    const finalSentences = [opening, primary[0], primary[1], this.withConnector(supporting[0], "Also, ")];
    const extraCore = primary.slice(2).find(sentence => !finalSentences.some(existing => this.areSentencesSimilar(existing, sentence)));
    if (extraCore) finalSentences.push(this.withConnector(extraCore, "And "));
    return this.dedupeSentences(finalSentences).slice(0, 5).join(" ").replace(/\s+/g, " ").trim();
  }

  composeFinalAfterFromCandidates(selectedFrames = [], afterOptions = [], fallbackText = "") {
    const selectedIndexes = this.getSelectedBeforeCandidateIndexes(selectedFrames).slice(0, 2);
    const selectedGroups = selectedIndexes
      .map(index => this.splitSentences(afterOptions[index] || "")
        .map(sentence => this.normalizeRequesterTone(sentence))
        .filter(Boolean))
      .filter(group => group.length > 0);

    const primary = this.dedupeSentences(selectedGroups[0] || []);
    const supporting = this.dedupeSentences(selectedGroups[1] || [])
      .filter(sentence => !primary.some(coreSentence => this.areSentencesSimilar(coreSentence, sentence)));
    if (primary.length < 3 || supporting.length < 1) return this.polishAfterMessage(fallbackText);

    const coreSentences = [primary[0], primary[1], primary[2]];
    const coreIncludesThanks = coreSentences.some(sentence => /thank/i.test(sentence));
    const supportingSentence = supporting.find(sentence => !(coreIncludesThanks && /thank/i.test(sentence))) || supporting[0];
    const finalSentences = [...coreSentences, this.withConnector(supportingSentence, "Also, ")];
    const extraCore = primary.slice(3).find(sentence => /reward|payment|recorded/i.test(sentence)
      && !finalSentences.some(existing => this.areSentencesSimilar(existing, sentence)));
    if (extraCore) finalSentences.push(extraCore);
    return this.polishAfterMessage(this.dedupeSentences(finalSentences).slice(0, 5).join(" ") || fallbackText);
  }

  polishAfterMessage(message = "") {
    const polished = String(message || "")
      .replace(/taking the time to\s*/gi, "")
      .replace(/we sincerely thank you/gi, "thank you")
      .replace(/directly contributed/gi, "helped")
      .replace(/greatly helps/gi, "helps")
      .replace(/helped a great deal/gi, "helped")
      .replace(/this task is now fully wrapped up here\.?/gi, "")
      .replace(/[^.!?]*next task[^.!?]*[.!?]?/gi, "")
      .replace(/\s+([.!?])/g, "$1")
      .replace(/\s+/g, " ")
      .trim();

    return polished || "Thank you for seeing this task through to completion. Your submitted judgment will be carefully referenced as we organize the results.";
  }

  getStrategyCandidateSentences(candidate = "", phase = "after", title = "") {
    const source = phase === "before" ? this.stripBeforeOpening(candidate, title) : candidate;
    return this.splitSentences(source)
      .map(sentence => this.normalizeRequesterTone(sentence))
      .filter(sentence => sentence && !this.isBoilerplateFinalSentence(sentence));
  }

  includesStrategyContribution(message = "", candidate = "", phase = "after", title = "") {
    const normalizedMessage = this.normalizeRequesterTone(message);
    return this.getStrategyCandidateSentences(candidate, phase, title).some(sentence => {
      const fragment = sentence.replace(/^(and|so|but|maybe|also|then)\s+/i, "").slice(0, 18);
      return fragment.length >= 8 && normalizedMessage.includes(fragment);
    });
  }

  countStrategyContributions(message = "", candidate = "", phase = "after", title = "") {
    const normalizedMessage = this.normalizeRequesterTone(message);
    return this.getStrategyCandidateSentences(candidate, phase, title).filter(sentence => {
      const fragment = sentence.replace(/^(and|so|but|maybe|also|then)\s+/i, "").slice(0, 18);
      return fragment.length >= 8 && normalizedMessage.includes(fragment);
    }).length;
  }

  hasValidSentenceCount(message = "") {
    const sentences = this.splitSentences(message);
    return sentences.length >= 4
      && sentences.length <= 5
      && sentences.every(sentence => /[.!?。！？]$/.test(sentence));
  }

  hasRepeatedSentences(message = "") {
    const sentences = this.splitSentences(message);
    return sentences.some((sentence, index) => sentences
      .slice(0, index)
      .some(previous => this.areSentencesSimilar(previous, sentence)));
  }

  isPhaseAppropriate(message = "", phase = "after") {
    if (phase === "before") {
      return !/(?:completed the task|finished the task|you submitted|saw it through|you reviewed)/i.test(message);
    }
    const hasCompletionContext = /(?:complet(?:e|ed|ing)|finish(?:ed)?|through to (?:the )?(?:end|completion)|you submitted|you provided|you reviewed|you left)/i.test(message);
    const hasFutureInstruction = /(?:please (?:proceed|choose|select|review)|feel free to (?:rest|take a break)|before you begin)/i.test(message);
    return hasCompletionContext && !hasFutureInstruction;
  }

  hasPostCompletionAcknowledgment(message = "") {
    return /(?:complet(?:e|ed|ing) the task|finished the task|through to (?:the )?(?:end|completion)|you submitted|you responded|you reviewed)/i.test(message);
  }

  hasPostEffortThanks(message = "") {
    return /(?:(?:time|effort|hard work).{0,35}thank|thank.{0,35}(?:time|effort|hard work))/i.test(message);
  }

  hasTaskTypeContribution(message = "", taskType = "") {
    const checks = {
      annotation_classification: value => /(?:classif|annotat|label)/i.test(value) && /(?:accura|quality|consisten|reliab)/i.test(value),
      data_collection_creation: value => /(?:wrote|writing|generat|collect|result)/i.test(value) && /(?:analys|content|material|data)/i.test(value),
      search_verification: value => /(?:information|content|source)/i.test(value) && /(?:accura|reliab|confirm|verif)/i.test(value),
      evaluation_comparison: value => /(?:evaluat|compar)/i.test(value) && /(?:judg|decision|criteri|result)/i.test(value),
      content_moderation: value => /(?:safe|trust|reliab)/i.test(value) && /(?:environment|review|content)/i.test(value),
      surveys_experiments: value => /(?:research|user|respon)/i.test(value) && /(?:result|understand|interpret)/i.test(value)
    };
    const normalizedTaskType = TaskTypeRegistry.normalizeTaskTypeKey(taskType) || TaskTypeRegistry.DEFAULT_TASK_TYPE;
    return Boolean(checks[normalizedTaskType]?.(String(message || "")));
  }

  hasPostContributionMeaning(message = "") {
    return /(?:used|reference|help|reflect|check|prepar|interpret|understand)/i.test(message);
  }

  hasModestContributionClaim(message = "") {
    return !/(?:sav(?:e|ing|ed) lives|protect(?:ing|s)? lives|chang(?:e|ing|ed) the world|revolution|indispensable|decisive impact|entirely|will (?:definitely|certainly)\s*(?:improve|enhance)|directly\s*(?:improve|enhance|save))/i.test(message);
  }

  ensureStrategyCoverage(message = "", selectedFrames = [], options = [], phase = "after", title = "") {
    if (phase === "before") {
      return this.composeFinalBeforeFromCandidates(title, selectedFrames, options, message);
    }
    return this.composeFinalAfterFromCandidates(selectedFrames, options, message);
  }

  validateFinalMessages(profile, beforeOptions, afterOptions, finalBeforeText, finalAfterText) {
    const expected = TaskTypeRegistry.getStrategySelection(profile.taskType).selectedFrames;
    const selectedFrames = profile.selectedFrames || [];
    const selectedIndexes = this.getSelectedBeforeCandidateIndexes(selectedFrames).slice(0, 2);
    const beforeCoverage = selectedIndexes.map(index => this.includesStrategyContribution(finalBeforeText, beforeOptions[index], "before", profile.title));
    const afterCoverage = selectedIndexes.map(index => this.includesStrategyContribution(finalAfterText, afterOptions[index], "after", profile.title));
    const beforeContributionCounts = selectedIndexes.map(index => this.countStrategyContributions(finalBeforeText, beforeOptions[index], "before", profile.title));
    const afterContributionCounts = selectedIndexes.map(index => this.countStrategyContributions(finalAfterText, afterOptions[index], "after", profile.title));
    const leakedStrategyTerms = /\b(?:Autonomy|Competence|Relatedness|SDT|Core(?:\s+Strategy)?|Supporting(?:\s+Strategy)?)\b/i.test(`${finalBeforeText} ${finalAfterText}`);
    const beforeSentences = this.splitSentences(finalBeforeText);
    const afterSentences = this.splitSentences(finalAfterText);
    const crossPhaseOverlap = afterSentences.filter(afterSentence => beforeSentences
      .some(beforeSentence => this.areSentencesSimilar(beforeSentence, afterSentence))).length;
    const postThanksSentenceCount = afterSentences.filter(sentence => /thank/i.test(sentence)).length;
    return {
      taskTypeMatches: Boolean(TaskTypeRegistry.getTaskType(profile.taskType)),
      mappingMatches: expected.length === 2 && expected.every((frame, index) => frame === selectedFrames[index]),
      beforeSentenceCountValid: this.hasValidSentenceCount(finalBeforeText),
      afterSentenceCountValid: this.hasValidSentenceCount(finalAfterText),
      coreReflected: Boolean(beforeCoverage[0] && afterCoverage[0]),
      supportingReflected: Boolean(beforeCoverage[1] && afterCoverage[1]),
      coreMoreProminent: beforeContributionCounts[0] > beforeContributionCounts[1]
        && afterContributionCounts[0] > afterContributionCounts[1],
      distinctRoles: selectedFrames.length >= 2 && selectedFrames[0] !== selectedFrames[1],
      noRepeatedSentences: !this.hasRepeatedSentences(finalBeforeText) && !this.hasRepeatedSentences(finalAfterText),
      strategyNamesHidden: !leakedStrategyTerms,
      phaseAppropriate: this.isPhaseAppropriate(finalBeforeText, "before") && this.isPhaseAppropriate(finalAfterText, "after"),
      postCompletionAcknowledged: this.hasPostCompletionAcknowledgment(finalAfterText),
      postEffortThanksIncluded: this.hasPostEffortThanks(finalAfterText),
      postContributionExplained: this.hasPostContributionMeaning(finalAfterText),
      postContributionMatchesTaskType: this.hasTaskTypeContribution(finalAfterText, profile.taskType),
      postThanksBalanced: postThanksSentenceCount >= 1
        && postThanksSentenceCount <= 2
        && afterContributionCounts[0] > afterContributionCounts[1],
      postContributionClaimModest: this.hasModestContributionClaim(finalAfterText),
      phaseMessagesDistinct: crossPhaseOverlap < Math.ceil(Math.min(beforeSentences.length, afterSentences.length) / 2),
      conciseAndNatural: [...beforeSentences, ...afterSentences].every(sentence => sentence.length <= 180)
    };
  }

  synthesizeFinalMessages(profile, beforeOptions = [], afterOptions = [], reward = "1.50") {
    const objective = profile.objective;
    const impact = profile.socialImpact;
    const fallbackBeforeText = `This task involves ${objective}, carried out according to the given guidelines. We respect the worker's judgment and approach, and the results and time you provide will be carefully used toward the goal of ${impact}.`;
    const composedBefore = this.composeFinalBeforeFromCandidates(
      profile.title,
      profile.selectedFrames,
      beforeOptions,
      `Hello! Thank you for taking part in the "${profile.title}" task. ${fallbackBeforeText}`
    );
    const composedAfter = this.composeFinalAfterFromCandidates(
      profile.selectedFrames,
      afterOptions,
      `Thank you for seeing this task through to completion. Your submitted judgment will be calmly referenced when organizing data related to ${objective}. Your approved reward of $${reward} has been recorded.`
    );
    const finalBeforeText = this.ensureStrategyCoverage(composedBefore, profile.selectedFrames, beforeOptions, "before", profile.title);
    const finalAfterText = this.ensureStrategyCoverage(composedAfter, profile.selectedFrames, afterOptions, "after", profile.title);
    return {
      finalBeforeText,
      finalAfterText,
      generationValidation: this.validateFinalMessages(profile, beforeOptions, afterOptions, finalBeforeText, finalAfterText)
    };
  }

  /**
   * Agent psychological-frame analysis log.
   * Shows the user only the processing steps explainable in a patent document, not internal chain-of-thought.
   */
  async generateThoughtsLog(title, category, description, riskLevel, fatigueLevel, objective, socialImpact, workerContext, singleTaskLimitMinutes = 15, callback, taskType = "") {
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const profile = this.buildPsychologicalProfile(title, category, description, riskLevel, fatigueLevel, objective, socialImpact, workerContext, singleTaskLimitMinutes, taskType);

    callback(`[System] Starting the context-based message generation process to help prevent microtask dropout.`, "system");
    await sleep(250);

    callback(`[Step 1: Extract Task Context] Structured the task name, objective, emotional risk, fatigue level, social value, and task-performance characteristics.`, "process");
    callback(`  - Confirmed Task Type: ${profile.taskTypeLabel}`, "process");
    callback(`  - Reason for selection: ${profile.taskTypeReason}`, "process");
    callback(`  - Task objective: ${profile.objective}`, "process");
    callback(`  - Social value: ${profile.socialImpact}`, "process");
    callback(`  - Task-performance characteristics: ${profile.workerContext}`, "process");
    await sleep(300);

    callback(`[Step 2: Estimate Psychological Burden] Detected the following burden factors.`, "process");
    profile.psychologicalBurden.forEach(item => callback(`  - ${item}`, "process"));
    await sleep(300);

    callback(`[Step 3: Extract Motivational Opportunities] Compiled the motivational factors available to help prevent task dropout.`, "process");
    profile.motivationalOpportunity.forEach(item => callback(`  - ${item}`, "process"));
    await sleep(300);

    callback(`[Step 4: Strategy Mapping] Applying ${profile.selectedFrames[0]} as the core strategy and ${profile.selectedFrames[1]} as the supporting strategy.`, "process");
    await sleep(300);

    callback(`[Step 5: Apply Generation Constraints] Applying 4-5 sentences each for pre/post-task, Core > Supporting, no repetition, and no exposure of internal strategy names.`, "process");
    await sleep(300);

    callback(`[Complete] Generated the pre/post-task message candidates and the structured prompt for the LLM integration.`, "success");
  }
}

if (typeof module === "object" && module.exports) module.exports = AgenticMotivationGenerator;
