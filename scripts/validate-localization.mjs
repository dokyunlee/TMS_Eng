import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = path => readFile(resolve(root, path), "utf8");

const [koHtml, enHtml, koTaskTypesSource, enTaskTypesSource, enGeneratorSource, enAppSource, enApiSource] = await Promise.all([
  read("public/index.html"),
  read("public/en/index.html"),
  read("public/js/task-types.js"),
  read("public/js/en/task-types.js"),
  read("public/js/en/generator.js"),
  read("public/js/en/app.js"),
  read("api/generate-motivation-en.js")
]);

const tagSequence = html => [...html.matchAll(/<\/?([a-z][a-z0-9-]*)\b[^>]*>/gi)]
  .map(match => `${match[0][1] === "/" ? "/" : ""}${match[1].toLowerCase()}`);
const attributeSequence = (html, name) => [...html.matchAll(new RegExp(`\\b${name}="([^"]*)"`, "gi"))].map(match => match[1]);
const count = (html, selectorTag) => (html.match(new RegExp(`<${selectorTag}\\b`, "gi")) || []).length;
const plain = value => JSON.parse(JSON.stringify(value));

assert.deepEqual(tagSequence(enHtml), tagSequence(koHtml), "HTML element hierarchy changed");
assert.deepEqual(attributeSequence(enHtml, "id"), attributeSequence(koHtml, "id"), "Element IDs changed");
assert.deepEqual(attributeSequence(enHtml, "class"), attributeSequence(koHtml, "class"), "CSS classes changed");
for (const tag of ["section", "article", "button", "form", "input", "textarea", "select", "option", "nav"]) {
  assert.equal(count(enHtml, tag), count(koHtml, tag), `${tag} count changed`);
}
assert.equal(/<html lang="en">/.test(enHtml), true, "English document language is missing");
assert.equal(/[가-힣]/.test(enHtml), false, "Korean remains in English HTML");
assert.equal(/[가-힣]/.test(enTaskTypesSource), false, "Korean remains in English Task Type data");
assert.equal(/[가-힣]/.test(enAppSource), false, "Korean remains in English app UI strings");
assert.equal(/[가-힣]/.test(enApiSource), false, "Korean remains in English API prompts");

const loadTaskTypes = source => {
  const context = {};
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(source, context);
  return context.TaskTypeConfig;
};
const ko = loadTaskTypes(koTaskTypesSource);
const enContext = {};
enContext.globalThis = enContext;
vm.createContext(enContext);
vm.runInContext(enTaskTypesSource, enContext);
vm.runInContext(`${enGeneratorSource}\n;globalThis.AgenticMotivationGeneratorForValidation = AgenticMotivationGenerator;`, enContext);
const en = enContext.TaskTypeConfig;

assert.deepEqual(Object.keys(en.TASK_TYPES), Object.keys(ko.TASK_TYPES), "Task Type set changed");
assert.equal(en.SURVEY_SAMPLE_SIZE, ko.SURVEY_SAMPLE_SIZE, "Survey sample size changed");
assert.deepEqual(plain(en.MESSAGE_LENGTH_EVIDENCE), plain(ko.MESSAGE_LENGTH_EVIDENCE), "Message-length evidence changed");

for (const key of Object.keys(ko.TASK_TYPES)) {
  assert.deepEqual(plain(en.TASK_TYPES[key].strategyOrder), plain(ko.TASK_TYPES[key].strategyOrder), `${key} strategy order changed`);
  assert.deepEqual(plain(en.TASK_TYPES[key].strategyEvidence), plain(ko.TASK_TYPES[key].strategyEvidence), `${key} strategy evidence changed`);
  assert.deepEqual(plain(en.getStrategySelection(key).selectedFrames), plain(ko.getStrategySelection(key).selectedFrames), `${key} selected-frame mapping changed`);
}

const generator = new enContext.AgenticMotivationGeneratorForValidation();
const sentenceCount = text => String(text || "").trim().split(/(?<=[.!?])\s+/).filter(Boolean).length;
for (const key of Object.keys(en.TASK_TYPES)) {
  const result = generator.generateInterventions(
    "Validation Task",
    "general",
    "Review each item using the provided criteria.",
    "medium",
    "medium",
    "Classify each item",
    "Improve data quality",
    "Review repeated items",
    "1.50",
    15,
    key
  );
  assert.equal(result.beforeOptions.length, 3, `${key} before-candidate count changed`);
  assert.equal(result.afterOptions.length, 3, `${key} after-candidate count changed`);
  assert.equal(sentenceCount(result.finalBeforeText) >= 4 && sentenceCount(result.finalBeforeText) <= 5, true, `${key} final before-message length is invalid`);
  assert.equal(sentenceCount(result.finalAfterText) >= 4 && sentenceCount(result.finalAfterText) <= 5, true, `${key} final after-message length is invalid`);
  assert.equal(Object.values(result.generationValidation).every(Boolean), true, `${key} message validation failed`);
}

console.log("Localization parity validation passed.");
console.log(JSON.stringify({
  pages: { korean: 1, english: 1 },
  sections: count(enHtml, "section"),
  buttons: count(enHtml, "button"),
  formFields: count(enHtml, "input") + count(enHtml, "textarea") + count(enHtml, "select"),
  taskTypes: Object.keys(en.TASK_TYPES).length,
  beforeCandidates: 3,
  afterCandidates: 3,
  messageSentenceRange: "4–5",
  surveySampleSize: en.SURVEY_SAMPLE_SIZE
}, null, 2));
