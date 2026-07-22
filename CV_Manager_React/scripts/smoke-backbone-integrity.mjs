import assert from "node:assert/strict";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";

const stamp = Date.now();
const backboneModule = join(tmpdir(), `backbone-integrity-${stamp}-backbone.mjs`);
const selectionModule = join(tmpdir(), `backbone-integrity-${stamp}-selection.mjs`);

await build({
  entryPoints: ["src/data/backbone.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: backboneModule,
  logLevel: "silent"
});
await build({ entryPoints: ["src/data/selection.ts"], bundle: true, format: "esm", platform: "node", outfile: selectionModule, logLevel: "silent" });
const backbone = await import(pathToFileURL(backboneModule).href);
const selection = await import(pathToFileURL(selectionModule).href);

const source = { id: "source-1", title: "Validated source", kind: "resume", content: "Verified delivery evidence" };
const project = { id: "project-1", name: "Evidence platform", sourceIds: ["source-1"], tools: [], metrics: [], stakeholders: [], systemsOrData: [], risksOrCompliance: [], evidenceSeeds: [], starSeeds: [] };
const data = {
  careerProfile: { workExperiences: [{ id: "exp-1", company: "Example", role: "Lead", period: "2024", location: "Taipei", scope: "", projects: [project] }] },
  rawSources: [source],
  skillInferences: [], domainKnowledge: [], starStories: [], jobs: [], cvVersions: [],
  evidenceCards: [{ id: "unsafe", title: "Unsafe legacy card", confidence: "Grounded", evidenceTier: "Primary", visibilityUse: "CV Visible", claimLevel: "Supported", canBeUsedInCv: "No", sourceIds: ["source-1"], experienceId: "exp-1", projectId: "project-1" }],
  backboneTasks: [{ id: "task-project-1", experienceId: "exp-1", projectId: "project-1", label: "Example", inputHash: "old", promptVersion: "project-backbone-delta-v1", status: "Needs Review", estimatedInputTokens: 12, reviewItems: ["Owner review required"] }],
  backboneMetadata: {}, sourceOfTruth: {}, promptTemplates: [], recruiterAnswers: [], highCompensationSignals: [], backboneUpdateSummary: {}
};

data.backboneTasks[0].inputHash = backbone.projectTaskInputHash(data, "exp-1", "project-1");
const originalInputHash = data.backboneTasks[0].inputHash;
data.rawSources[0].content = "Updated verified delivery evidence";
assert.notEqual(backbone.projectTaskInputHash(data, "exp-1", "project-1"), originalInputHash, "a linked raw-source change must invalidate the canonical project task input");
data.rawSources[0].content = "Verified delivery evidence";
const tasks = backbone.buildBackboneProjectTasks(data, false);
assert.equal(tasks[0].status, "Needs Review", "unchanged owner-review tasks must never be silently demoted to Pending or Applied");

const job = {
  id: "job-1", company: "Example", role: "Lead", location: "Taipei", rawJD: "Need an evidence platform lead", status: "Evidence Ready", fit: "High", nextAction: "", updatedAt: "2026-07-18T00:00:00.000Z",
  selectedSkillIds: [], selectedDomainKnowledgeIds: [], selectedEvidenceIds: ["unsafe"], selectedStoryIds: [],
  screeningAnalysis: { primaryTargetTitle: "Lead", summaryAngle: "", mustHaveKeywords: [], missingKeywords: [], riskyClaims: [], recommendedEvidenceIds: ["unsafe"], jdEvidenceMapping: [] }
};
const brief = selection.buildCvBrief(data, job);
assert.ok(brief, "a reviewed analysis produces an inspectable brief");
assert.deepEqual(brief.mustShowEvidenceIds, [], "evidence explicitly marked canBeUsedInCv: No must not enter CV generation");

console.log(JSON.stringify({ ok: true, checked: ["canonical task input invalidation", "Needs Review preservation", "CV evidence safety gate"] }, null, 2));
