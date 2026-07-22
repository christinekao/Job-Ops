import assert from "node:assert/strict";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";

const bundledModule = join(tmpdir(), `cv-brief-${Date.now()}.mjs`);

await build({
  entryPoints: ["src/data/selection.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: bundledModule,
  logLevel: "silent"
});

const { buildCvBrief } = await import(pathToFileURL(bundledModule).href);

const visibleEvidence = {
  id: "ev-visible",
  title: "Workflow delivery",
  sectionTitle: "Workflow automation",
  confidence: "Grounded",
  evidenceTier: "Primary",
  visibilityUse: "CV Visible",
  claimLevel: "Supported",
  canBeUsedInCv: "Yes",
  sourceIds: ["source-1"],
  experienceId: "exp-1",
  projectId: "project-1",
  cvAngle: "Delivered an evidence-backed workflow",
  forbiddenVisibleClaims: ["Owned production ML training"]
};

const archivedEvidence = {
  ...visibleEvidence,
  id: "ev-archive",
  evidenceTier: "Archive"
};

const data = {
  rawSources: [{ id: "source-1", title: "Verified source", content: "Evidence source" }],
  careerProfile: { workExperiences: [{ id: "exp-1", projects: [{ id: "project-1", sourceIds: ["source-1"] }] }] },
  skillInferences: [{ id: "skill-1", skill: "Workflow automation", cvWording: "Workflow automation", confidence: "Grounded", strength: "Applied" }],
  domainKnowledge: [],
  evidenceCards: [visibleEvidence, archivedEvidence],
  starStories: [{ id: "story-1" }]
};

const baseJob = {
  id: "job-cv-brief",
  company: "Example",
  role: "Workflow Specialist",
  location: "Taipei",
  rawJD: "Workflow automation and stakeholder delivery",
  status: "Evidence Ready",
  fit: "High",
  nextAction: "Build CV Brief",
  selectedSkillIds: ["skill-1"],
  selectedDomainKnowledgeIds: [],
  selectedEvidenceIds: ["ev-visible", "ev-archive"],
  selectedStoryIds: ["story-1"],
  updatedAt: "2026-07-12T00:00:00.000Z"
};

assert.equal(buildCvBrief(data, baseJob), null, "missing Screening Analysis must return null");

const jobWithAnalysis = {
  ...baseJob,
  screeningAnalysis: {
    primaryTargetTitle: "Workflow Specialist",
    summaryAngle: "Evidence-backed workflow delivery",
    mustHaveKeywords: ["workflow automation"],
    missingKeywords: [],
    riskyClaims: ["Production ML ownership"],
    requirementMatrix: [{
      requirementId: "req-workflow",
      requirement: "Workflow automation",
      normalizedRequirement: "Workflow automation",
      sourceSection: "requirements",
      atomicDimension: "CAPABILITY",
      expectedAspects: [],
      marketExpectation: "Deliver reliable workflows",
      matchingEvidenceIds: ["ev-visible", "ev-archive"],
      matchingSkillIds: ["skill-1"],
      matchingStoryIds: ["story-1"],
      matchingEducationIds: [],
      matchingDomainKnowledgeIds: [],
      importance: "REQUIRED_CAPABILITY",
      matchStatus: "DIRECT_MATCH",
      supportedAspects: ["workflow automation"],
      unsupportedAspects: [],
      transferContext: "",
      explanation: "Evidence supports workflow delivery.",
      confidence: "High",
      cvUsage: "PRIORITIZE",
      interviewUsage: "LEAD_STORY",
      hardBlock: false,
      hardBlockReason: ""
    }]
  }
};

const brief = buildCvBrief(data, jobWithAnalysis);
assert.ok(brief, "valid analysis must create a CV Brief");

for (const field of [
  "targetPositioning", "managerHiringProblem", "top3SellingPoints",
  "mustShowEvidenceIds", "supportingEvidenceIds", "skillsToForeground",
  "skillsToSuppress", "claimsToAvoid", "cvHeadline", "summaryAngle",
  "firstSectionTheme", "bulletPlan", "generatedAt"
]) {
  assert.ok(Object.hasOwn(brief, field), `CV Brief must include ${field}`);
}

assert.deepEqual(brief.mustShowEvidenceIds, ["ev-visible"], "only selected CV-visible grounded evidence may be must-show");
assert.equal(brief.bulletPlan.length, 1, "supported JD mapping must create a bullet plan");
assert.ok(brief.claimsToAvoid.includes("Production ML ownership"), "analysis risky claims must carry forward");
assert.ok(brief.claimsToAvoid.includes("Owned production ML training"), "evidence forbidden claims must carry forward");

const emptyEvidenceBrief = buildCvBrief(
  { ...data, evidenceCards: [] },
  { ...jobWithAnalysis, selectedEvidenceIds: [] }
);
assert.ok(emptyEvidenceBrief, "analysis with no selected evidence returns an inspectable brief");
assert.deepEqual(emptyEvidenceBrief.mustShowEvidenceIds, [], "empty must-show evidence remains explicit for downstream readiness checks");

console.log(JSON.stringify({
  ok: true,
  checked: [
    "missing analysis returns null",
    "required CV Brief fields",
    "CV-visible grounded evidence filter",
    "claims-to-avoid propagation",
    "empty must-show evidence policy"
  ]
}, null, 2));
