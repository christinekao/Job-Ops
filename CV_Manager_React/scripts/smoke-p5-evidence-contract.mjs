import assert from "node:assert/strict";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";

const stamp = Date.now();
const evidenceModule = join(tmpdir(), `p5-evidence-${stamp}.mjs`);
const promptModule = join(tmpdir(), `p5-prompt-${stamp}.mjs`);
const taskModule = join(tmpdir(), `p5-task-${stamp}.mjs`);
const projectTaskModule = join(tmpdir(), `p5-project-task-${stamp}.mjs`);
await Promise.all([
  build({ entryPoints: ["src/data/evidence.ts"], bundle: true, format: "esm", platform: "node", outfile: evidenceModule, logLevel: "silent" }),
  build({ entryPoints: ["src/promptBuilders.ts"], bundle: true, format: "esm", platform: "node", outfile: promptModule, logLevel: "silent" }),
  build({ entryPoints: ["src/data/evidenceTasks.ts"], bundle: true, format: "esm", platform: "node", outfile: taskModule, logLevel: "silent" }),
  build({ entryPoints: ["src/data/projectTaskInput.ts"], bundle: true, format: "esm", platform: "node", outfile: projectTaskModule, logLevel: "silent" })
]);
const evidence = await import(pathToFileURL(evidenceModule).href);
const prompts = await import(pathToFileURL(promptModule).href);
const tasks = await import(pathToFileURL(taskModule).href);
const projectTasks = await import(pathToFileURL(projectTaskModule).href);

const project = { id: "project-1", name: "Evidence safety", sourceIds: ["source-1"], tools: [] };
const baseData = {
  rawSources: [{ id: "source-1", title: "Source", kind: "Project Notes", content: "Validated source" }],
  careerProfile: { workExperiences: [{ id: "exp-1", company: "Example", role: "Lead", period: "2026", location: "Taipei", scope: "", projects: [project] }], contact: {} },
  sourceOfTruth: {}, skillInferences: [], domainKnowledge: [], starStories: [], cvVersions: [], backboneTasks: [], backboneMetadata: {}, backboneUpdateSummary: {}, recruiterAnswers: [], promptTemplates: [], highCompensationSignals: [],
  jobs: [{ id: "job-1", company: "Example", role: "Lead", location: "Taipei", rawJD: "Evidence safety role", status: "Evidence Needed", fit: "High", nextAction: "", selectedEvidenceIds: [], selectedStoryIds: [], updatedAt: "2026-07-18", screeningAnalysis: { primaryTargetTitle: "Lead", jdEvidenceMapping: [] } }],
  evidenceCards: []
};
const card = (id, patch = {}) => ({ id, title: id, category: "Delivery", sectionTitle: "Delivery", tools: [], proof: "Validated", metrics: "", sourceIds: ["source-1"], experienceId: "exp-1", projectId: "project-1", confidence: "Grounded", evidenceTier: "Core", canBeUsedInCv: "Yes", visibilityUse: "CV Visible", claimLevel: "Conservative Claim", ...patch });
const blocked = card("blocked", { canBeUsedInCv: "No" });
const missingSafety = card("legacy", { canBeUsedInCv: undefined, visibilityUse: undefined, claimLevel: undefined });
const promptOnly = card("prompt-only", { visibilityUse: "Prompt Context Only" });
const doNotClaim = card("do-not-claim", { claimLevel: "Do Not Claim" });
const valid = card("valid");
const data = { ...baseData, evidenceCards: [blocked, missingSafety, promptOnly, doNotClaim, valid], jobs: [{ ...baseData.jobs[0], selectedEvidenceIds: ["blocked", "legacy", "prompt-only", "do-not-claim", "valid"] }] };

const partition = evidence.partitionEvidenceForWriter(data, data.evidenceCards);
assert.deepEqual(partition.visible.map((item) => item.id), ["valid"], "only explicit, valid CV-usable Evidence may be Writer-visible");
assert.deepEqual(partition.referenceOnly.map((item) => item.id).sort(), ["legacy", "prompt-only"], "legacy and Prompt Context Only Evidence must remain reference-only");
assert.ok(partition.excluded.some((item) => item.id === "blocked"), "canBeUsedInCv: No must be excluded from Writer-visible context");
assert.ok(partition.excluded.some((item) => item.id === "do-not-claim"), "Do Not Claim must be excluded from Writer-visible context");
const context = prompts.buildScreeningCvWriterContext(data, "job-1");
assert.deepEqual(context.cvVisibleEvidence.map((item) => item.id), ["valid"], "Writer context must use canonical Evidence partitioning");
assert.deepEqual(
  [...new Set(context.summaryQualityContract.requiredCriteria.flatMap((criterion) => criterion.supportingEvidenceIds))],
  ["valid"],
  "Writer summary guidance must not receive unsafe selected Evidence"
);

const coverage = evidence.evidenceCoverageForProject(data, "exp-1", "project-1");
assert.equal(coverage.traceabilityCovered, true);
assert.equal(coverage.cvUsableCovered, true);
assert.equal(coverage.needsReviewEvidenceCount, 4);

const task = tasks.createEvidenceTask(data, ["project-1"]);
const validEnvelope = { task: task.task, evidenceCards: [valid] };
assert.equal(tasks.validateEvidenceTaskEnvelope(data, task, validEnvelope).valid, true);
for (const [name, value] of Object.entries({
  wrongTask: { ...validEnvelope, task: { ...task.task, taskId: "wrong" } },
  wrongHash: { ...validEnvelope, task: { ...task.task, inputHash: "wrong" } },
  wrongVersion: { ...validEnvelope, task: { ...task.task, promptVersion: "wrong" } },
  unexpectedProject: { ...validEnvelope, evidenceCards: [card("other", { projectId: "other-project" })] },
  duplicateId: { ...validEnvelope, evidenceCards: [valid, valid] },
  invalidGrounded: { ...validEnvelope, evidenceCards: [card("invalid", { sourceIds: [] })] }
})) {
  assert.equal(tasks.validateEvidenceTaskEnvelope(data, task, value).valid, false, `${name} must reject the whole batch`);
}

const projectInput = projectTasks.buildProjectTaskInput(data, "exp-1", "project-1");
assert.equal(projectInput.matchingRulesVersion, "project-source-match-v1", "matching rules must be versioned in the canonical Project input");
const changedSourceData = { ...data, rawSources: [...data.rawSources, { id: "source-2", title: "Potential indirect match", kind: "Notes", content: "New material" }] };
assert.notEqual(
  projectTasks.hashProjectBackboneTaskInput(projectInput),
  projectTasks.hashProjectBackboneTaskInput(projectTasks.buildProjectTaskInput(changedSourceData, "exp-1", "project-1")),
  "Source Manifest changes must invalidate the Project task"
);
const projectPrompt = prompts.buildProjectBackboneDeltaPrompt(projectInput, projectTasks.hashProjectBackboneTaskInput(projectInput));
assert.ok(projectPrompt.includes(JSON.stringify(projectInput)), "Project prompt must render the same canonical input object that was hashed");

console.log(JSON.stringify({ ok: true, checked: ["writer evidence partition", "coverage distinction", "evidence envelope identity and atomic rejection", "canonical Project input/hash/prompt identity"] }, null, 2));
