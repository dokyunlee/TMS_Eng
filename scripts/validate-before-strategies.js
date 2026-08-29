const assert = require("node:assert/strict");
const TaskTypeConfig = require("../public/js/task-types.js");
const Generator = require("../public/js/generator.js");
const { normalizeBeforeOptions, sentenceCount } = require("../api/generate-motivation.js")._test;

const expected = ["Relatedness", "Competence", "Autonomy"];
const leaked = /\b(?:Relatedness|Competence|Autonomy)\b/i;
const generator = new Generator();

for (const taskType of Object.keys(TaskTypeConfig.TASK_TYPES)) {
  const result = generator.generateInterventions(
    "Example Review",
    "general",
    "Review each item against the criteria.",
    "medium",
    "medium",
    "review each item and select the best matching category",
    "support the stated project result",
    "an online task environment",
    "1.50",
    15,
    taskType
  );
  assert.deepEqual(result.beforeLabels, expected, `${taskType}: labels`);
  assert.deepEqual(result.beforeCandidateFrames, expected, `${taskType}: frames`);
  result.beforeOptions.forEach((message, index) => {
    assert.ok([4, 5].includes(sentenceCount(message)), `${taskType}: candidate ${index} sentence count`);
    assert.equal(leaked.test(message), false, `${taskType}: candidate ${index} leaked strategy name`);
  });
}

const intentionallyWrong = [
  { label: "Autonomy", frame: "Autonomy", message: "Autonomy should be visible only in metadata." },
  { label: "Wrong label", frame: "Competence", message: "Work at your own comfortable pace. Choose any order. Take a break. Regulate the task yourself." },
  { label: "Relatedness", frame: "Relatedness", message: "Your contribution supports this project. Your participation is respected. The result serves the shared purpose. Thank you for being part of the work." }
];
const corrected = normalizeBeforeOptions(intentionallyWrong, { objective: "review each item carefully" });
assert.deepEqual(corrected.options.map(option => option.label), expected);
assert.deepEqual(corrected.options.map(option => option.frame), expected);
assert.equal(corrected.validation[0].reordered, true);
assert.equal(corrected.validation[1].corrected, true);
assert.equal(corrected.validation[2].corrected, true);
corrected.options.forEach(option => {
  assert.ok([4, 5].includes(sentenceCount(option.message)));
  assert.equal(leaked.test(option.message), false);
});

console.log(`Validated ${Object.keys(TaskTypeConfig.TASK_TYPES).length} Task Types and malformed API candidate correction.`);
