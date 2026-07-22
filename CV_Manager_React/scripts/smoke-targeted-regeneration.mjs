import { strict as assert } from "node:assert";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

async function bundle(entry, name) {
  const outfile = join(tmpdir(), `${name}-${Date.now()}.mjs`);
  await build({ entryPoints: [entry], bundle: true, format: "esm", platform: "node", outfile, logLevel: "silent" });
  return import(pathToFileURL(outfile).href);
}

const { orchestrateRepair } = await bundle("src/domain/repairOrchestrator.ts", "targeted-regeneration-orchestrator");
const { createTargetedRegenerationRequest, executeTargetedRegeneration } = await bundle("src/domain/targetedRegeneration.ts", "targeted-regeneration-domain");
const { contentHash } = await bundle("src/utils/hash.ts", "targeted-regeneration-hash");

const cv = {
  header: { name: "Alex Chen", targetRole: "Customer Automation Specialist", email: "alex@example.com", location: "Taipei" },
  sidebar: { languages: [], skillGroups: [{ title: "Automation", highlightedSkills: ["workflow automation"], otherSkills: [] }], certifications: [], education: [] },
  summary: "Customer operator seeking work.",
  workExperience: [{
    experienceId: "exp-current",
    company: "Acme",
    role: "Customer Operations Specialist",
    period: "2022-Present",
    location: "Taipei",
    subsections: [{ title: "Impact", bullets: [
      { text: "Helped customers.", evidenceIds: ["ev-workflow-automation"], confidence: "Weak" },
      { text: "Translated process notes into customer-ready adoption guidance used across 12 customer sessions.", evidenceIds: ["ev-enablement"], confidence: "Grounded" }
    ] }]
  }, {
    experienceId: "exp-prior",
    company: "Prior Co",
    role: "Analyst",
    period: "2020-2022",
    location: "Taipei",
    subsections: [{ title: "Prior", bullets: [{ text: "Maintained reporting cadence.", evidenceIds: ["ev-reporting"], confidence: "Grounded" }] }]
  }],
  jdAnalysis: {
    targetRole: "Customer Automation Specialist",
    coreRequirements: ["workflow automation"],
    topKeywords: [{ keyword: "workflow automation", priority: "Must-have", placement: "Summary" }],
    gaps: []
  },
  keywordPlacementNotes: [],
  interviewNotes: [],
  reviewNotes: []
};

const currentHash = contentHash(cv);
const orchestration = orchestrateRepair({
  cvVersionId: "cv-v1",
  cvContentHash: currentHash,
  blockers: ["Summary needs clearer role fit"],
  cv,
  selectedEvidenceIds: ["ev-workflow-automation", "ev-enablement"],
  effectiveCvBriefHash: "brief-a"
});
assert.equal(orchestration.recommendedNextRoute, "run-targeted-regeneration", "summary role-fit blocker must prefer targeted regeneration");
assert.equal(orchestration.targetedRegeneration.length, 1, "summary blocker must produce one targeted regeneration classification");
assert.deepEqual(orchestration.targetedRegeneration[0].allowedMutationZones, ["summary"], "summary regeneration must target summary only");

const request = createTargetedRegenerationRequest({
  classifications: orchestration.targetedRegeneration,
  selectedEvidenceIds: ["ev-workflow-automation", "ev-enablement"],
  effectiveCvBriefHash: "brief-a"
});
assert.deepEqual(request.targetZones, ["summary"], "request must target summary");
assert.ok(request.prohibitedZones.includes("header.contact"), "contact must be preserved");
assert.ok(request.prohibitedZones.includes("workExperience"), "work experience must be preserved for summary-only regeneration");

const cvVersion = {
  id: "cv-v1",
  jdId: "job-1",
  name: "Targeted CV",
  summary: cv.summary,
  content: JSON.stringify(cv),
  tailoredCv: cv,
  status: "Ready for Review",
  updatedAt: "2026-07-15T00:00:00.000Z"
};
const result = executeTargetedRegeneration({
  cvVersion,
  request,
  currentCvVersionId: "cv-v1",
  currentContentHash: currentHash,
  currentEffectiveCvBriefHash: "brief-a",
  now: "2026-07-15T00:01:00.000Z"
});
assert.equal(result.status, "success", "targeted regeneration must succeed with matching context");
assert.ok(result.nextVersion, "successful regeneration must create a CV version");
assert.notEqual(result.resultingCvHash, result.priorCvHash, "successful regeneration must update content hash");
assert.notEqual(result.nextVersion.tailoredCv.summary, cv.summary, "summary must change");
assert.deepEqual(result.nextVersion.tailoredCv.header, cv.header, "contact data must be preserved");
assert.deepEqual(result.nextVersion.tailoredCv.workExperience, cv.workExperience, "untargeted work experience must remain structurally equivalent");
assert.doesNotMatch(result.nextVersion.tailoredCv.summary, /owned an enterprise AI platform/i, "unsupported claims must not be introduced");
assert.deepEqual(result.affectedReviewFamilies, ["hiring-manager", "reviewer"], "affected review families must be scoped");

const stale = executeTargetedRegeneration({
  cvVersion,
  request,
  currentCvVersionId: "cv-v1",
  currentContentHash: "different-hash",
  currentEffectiveCvBriefHash: "brief-a"
});
assert.equal(stale.status, "stale", "changed CV hash must reject regeneration");

const briefStale = executeTargetedRegeneration({
  cvVersion,
  request,
  currentCvVersionId: "cv-v1",
  currentContentHash: currentHash,
  currentEffectiveCvBriefHash: "brief-b"
});
assert.equal(briefStale.status, "stale", "changed effective brief hash must reject regeneration");

const noEvidenceRequest = createTargetedRegenerationRequest({
  classifications: orchestration.targetedRegeneration,
  selectedEvidenceIds: [],
  effectiveCvBriefHash: "brief-a"
});
const noEvidence = executeTargetedRegeneration({
  cvVersion,
  request: noEvidenceRequest,
  currentCvVersionId: "cv-v1",
  currentContentHash: currentHash,
  currentEffectiveCvBriefHash: "brief-a"
});
assert.equal(noEvidence.status, "blocked", "missing selected evidence must block regeneration");
assert.equal(noEvidence.resultingCvHash, currentHash, "validation failure must preserve current CV");

const bulletOrchestration = orchestrateRepair({
  cvVersionId: "cv-v1",
  cvContentHash: currentHash,
  blockers: ["Achievements need stronger support"],
  cv,
  selectedEvidenceIds: ["ev-workflow-automation", "ev-enablement"],
  effectiveCvBriefHash: "brief-a"
});
assert.equal(bulletOrchestration.recommendedNextRoute, "run-targeted-regeneration", "broad weak-achievement blocker must target regeneration");
const bulletRequest = createTargetedRegenerationRequest({
  classifications: bulletOrchestration.targetedRegeneration,
  selectedEvidenceIds: ["ev-workflow-automation", "ev-enablement"],
  effectiveCvBriefHash: "brief-a"
});
const bulletResult = executeTargetedRegeneration({
  cvVersion,
  request: bulletRequest,
  currentCvVersionId: "cv-v1",
  currentContentHash: currentHash,
  currentEffectiveCvBriefHash: "brief-a"
});
assert.equal(bulletResult.status, "success", "broad bullet regeneration must succeed");
assert.notEqual(bulletResult.nextVersion.tailoredCv.workExperience[0].subsections[0].bullets[0].text, cv.workExperience[0].subsections[0].bullets[0].text, "targeted current-role bullet must change");
assert.deepEqual(bulletResult.nextVersion.tailoredCv.workExperience[1], cv.workExperience[1], "prior role must remain unchanged");
assert.ok(bulletResult.nextVersion.tailoredCv.workExperience[0].subsections[0].bullets[0].evidenceIds.includes("ev-workflow-automation"), "regenerated bullet must keep EvidenceCard traceability");

console.log(JSON.stringify({
  ok: true,
  checks: [
    "summary role-fit maps to targeted regeneration",
    "targeted request preserves unrelated zones",
    "successful regeneration creates new CV version and hash",
    "summary-only regeneration preserves contact and work history",
    "unsupported claims not introduced",
    "stale CV hash rejected",
    "stale effective brief rejected",
    "validation failure preserves current CV",
    "broad weak achievements regenerate current-role bullets",
    "prior role preserved",
    "evidence traceability preserved",
    "affected review families scoped"
  ]
}, null, 2));
