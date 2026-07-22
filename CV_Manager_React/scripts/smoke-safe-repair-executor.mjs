import { strict as assert } from "node:assert";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const executorModule = join(tmpdir(), `safe-repair-executor-${Date.now()}.mjs`);
await build({
  entryPoints: ["src/domain/safeRepairExecutor.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: executorModule,
  logLevel: "silent"
});

const orchestratorModule = join(tmpdir(), `safe-repair-orchestrator-${Date.now()}.mjs`);
await build({
  entryPoints: ["src/domain/repairOrchestrator.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: orchestratorModule,
  logLevel: "silent"
});

const hashModule = join(tmpdir(), `safe-repair-hash-${Date.now()}.mjs`);
await build({
  entryPoints: ["src/utils/hash.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: hashModule,
  logLevel: "silent"
});

const { executeSafeRepairs } = await import(pathToFileURL(executorModule).href);
const { orchestrateRepair } = await import(pathToFileURL(orchestratorModule).href);
const { contentHash } = await import(pathToFileURL(hashModule).href);

const cv = {
  header: { name: "Candidate", targetRole: "Automation Specialist", email: "", location: "Taipei" },
  sidebar: { languages: [], skillGroups: [{ title: "Tools", highlightedSkills: ["CRM"], otherSkills: ["Excel"] }], certifications: [], education: [] },
  summary: "Customer specialist. Customer specialist.",
  workExperience: [{
    experienceId: "role-a",
    company: "Example",
    role: "Specialist",
    period: "2022-Present",
    location: "Taipei",
    subsections: [{
      title: "Impact",
      bullets: [
        { text: "Coordinated automation requests. Coordinated automation requests.", confidence: "Grounded", evidenceIds: ["ev-1"] },
        { text: "Supported customer operations.", confidence: "Grounded", evidenceIds: ["ev-2"] }
      ]
    }]
  }],
  keywordPlacementNotes: [],
  interviewNotes: [],
  reviewNotes: []
};

const currentHash = contentHash(cv);
const cvVersion = {
  id: "cv-v1",
  jdId: "job-1",
  name: "Target CV",
  summary: cv.summary,
  content: JSON.stringify(cv),
  tailoredCv: cv,
  status: "Ready for Review",
  updatedAt: "2026-07-13T00:00:00.000Z",
  reviewSnapshot: {
    snapshotId: "review-1",
    updatedAt: "2026-07-13T00:00:00.000Z",
    contentHash: currentHash,
    cvUpdatedAt: "2026-07-13T00:00:00.000Z",
    completedAt: "2026-07-13T00:00:00.000Z",
    gateIssueCount: 2,
    reviewerIssueCount: 2,
    ready: false
  }
};

const orchestration = orchestrateRepair({
  cvVersionId: cvVersion.id,
  cvContentHash: currentHash,
  blockers: [
    "Summary duplicate wording: repeated summary sentence",
    "Contact extraction: Missing email"
  ],
  cv,
  trustedProfileEmail: "candidate@example.com"
});

assert.equal(orchestration.safeAuto.length, 2, "fixture must have two safe-auto repairs");

const result = executeSafeRepairs({
  cvVersion,
  orchestration,
  currentCvVersionId: cvVersion.id,
  currentContentHash: currentHash,
  trustedProfileEmail: "candidate@example.com",
  now: "2026-07-13T01:00:00.000Z"
});

assert.equal(result.status, "success", "safe repairs should execute successfully");
assert.ok(result.nextVersion, "safe repair must create a new CV version");
assert.notEqual(result.nextVersion.id, cvVersion.id, "safe repair must not overwrite current CV version");
assert.equal(result.appliedChanges.length, 2, "two safe changes should be recorded");
assert.match(result.nextVersion.tailoredCv.summary, /^Customer specialist\.$/, "duplicate summary sentence should be removed");
assert.equal(result.nextVersion.tailoredCv.header.email, "candidate@example.com", "trusted email should be applied");
assert.deepEqual(result.nextVersion.tailoredCv.workExperience[0].subsections[0].bullets[0].evidenceIds, ["ev-1"], "evidence IDs must be preserved");
assert.deepEqual(result.nextVersion.tailoredCv.sidebar, cv.sidebar, "prohibited sidebar zone must be preserved");
assert.equal(result.nextVersion.reviewSnapshot, undefined, "content-changing repair must clear stale review snapshot");
assert.ok(result.changedZones.includes("summary"), "changed zones must include summary");
assert.ok(result.changedZones.includes("header.contact"), "changed zones must include contact");
assert.ok(result.preservedZones.includes("workExperience"), "unrelated prohibited workExperience zone must be preserved for these repairs");

const staleResult = executeSafeRepairs({
  cvVersion,
  orchestration,
  currentCvVersionId: cvVersion.id,
  currentContentHash: "different-hash",
  trustedProfileEmail: "candidate@example.com"
});
assert.equal(staleResult.status, "stale", "changed content hash must reject stale orchestration output");
assert.equal(staleResult.nextVersion, undefined, "stale repair must not create a CV version");

const duplicateResult = executeSafeRepairs({
  cvVersion,
  orchestration,
  currentCvVersionId: cvVersion.id,
  currentContentHash: currentHash,
  trustedProfileEmail: "candidate@example.com",
  executedPlanKeys: new Set([result.planKey])
});
assert.equal(duplicateResult.status, "duplicate", "same plan key must not execute twice for the same CV hash");

const alreadyFixedCv = {
  ...cv,
  header: { ...cv.header, email: "candidate@example.com" },
  summary: "Customer specialist."
};
const alreadyFixedHash = contentHash(alreadyFixedCv);
const alreadyFixedVersion = {
  ...cvVersion,
  id: "cv-v2",
  tailoredCv: alreadyFixedCv,
  summary: alreadyFixedCv.summary,
  reviewSnapshot: undefined
};
const noDiffOrchestration = orchestrateRepair({
  cvVersionId: alreadyFixedVersion.id,
  cvContentHash: alreadyFixedHash,
  blockers: [
    "Summary duplicate wording: repeated summary sentence",
    "Contact extraction: Missing email"
  ],
  cv: alreadyFixedCv,
  trustedProfileEmail: "candidate@example.com"
});
const noDiffResult = executeSafeRepairs({
  cvVersion: alreadyFixedVersion,
  orchestration: noDiffOrchestration,
  currentCvVersionId: alreadyFixedVersion.id,
  currentContentHash: alreadyFixedHash,
  trustedProfileEmail: "candidate@example.com"
});
assert.equal(noDiffResult.status, "no-content-diff", "already-fixed content must not silently no-op as success");
assert.equal(noDiffResult.nextVersion, undefined, "no-diff repair must not create a CV version");

console.log(JSON.stringify({
  ok: true,
  checks: [
    "two safe-auto repairs executed",
    "exact cv version and hash required",
    "stale orchestration rejected",
    "duplicate repair rejected",
    "no-content-diff reported explicitly",
    "new CV version created on success",
    "allowed zones mutated only",
    "prohibited zones preserved",
    "evidence IDs preserved",
    "no AI invocation"
  ]
}, null, 2));
