import assert from "node:assert/strict";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";

const stamp = Date.now();
const selectionPath = join(tmpdir(), `p7-selection-${stamp}.mjs`);
const exportDecisionPath = join(tmpdir(), `p7-export-${stamp}.mjs`);
const reviewPath = join(tmpdir(), `p7-review-${stamp}.mjs`);
await Promise.all([
  build({ entryPoints: ["src/data/selection.ts"], bundle: true, format: "esm", platform: "node", outfile: selectionPath, logLevel: "silent" }),
  build({ entryPoints: ["src/domain/screeningExportDecision.ts"], bundle: true, format: "esm", platform: "node", outfile: exportDecisionPath, logLevel: "silent" }),
  build({ entryPoints: ["src/domain/screeningReview.ts"], bundle: true, format: "esm", platform: "node", outfile: reviewPath, logLevel: "silent" })
]);

const selection = await import(pathToFileURL(selectionPath).href);
const exportDecision = await import(pathToFileURL(exportDecisionPath).href);
const review = await import(pathToFileURL(reviewPath).href);

const source = { id: "source-1", title: "Verified source", kind: "Project Notes", content: "Verified automation delivery." };
const project = { id: "project-1", name: "Automation delivery", sourceIds: ["source-1"], tools: ["Power Automate"] };
const evidence = {
  id: "evidence-1",
  title: "Automation delivery",
  category: "Delivery",
  sectionTitle: "Delivery",
  tools: ["Power Automate"],
  proof: "Delivered a verified automation.",
  metrics: "35%",
  sourceIds: ["source-1"],
  experienceId: "experience-1",
  projectId: "project-1",
  confidence: "Grounded",
  evidenceTier: "Core",
  canBeUsedInCv: "Yes",
  visibilityUse: "CV Visible",
  claimLevel: "Conservative Claim"
};
const job = {
  id: "job-1",
  company: "Example",
  role: "Automation Lead",
  location: "Taipei",
  rawJD: "Lead workflow automation delivery with Power Automate and stakeholder coordination.",
  status: "Reviewed",
  fit: "High",
  nextAction: "",
  selectedSkillIds: [],
  selectedDomainKnowledgeIds: [],
  selectedEvidenceIds: ["evidence-1"],
  selectedStoryIds: [],
  updatedAt: "2026-07-19T00:00:00.000Z",
  screeningAnalysis: {
    primaryTargetTitle: "Automation Lead",
    summaryAngle: "Evidence-backed workflow delivery",
    mustHaveKeywords: [],
    missingKeywords: [],
    riskyClaims: [],
    requirementMatrix: [{
      requirementId: "req-workflow",
      requirement: "workflow automation delivery",
      normalizedRequirement: "workflow automation delivery",
      sourceSection: "requirements",
      atomicDimension: "CAPABILITY",
      expectedAspects: [],
      marketExpectation: "Lead workflow automation delivery",
      matchingEvidenceIds: ["evidence-1"],
      matchingSkillIds: [],
      matchingStoryIds: [],
      matchingEducationIds: [],
      matchingDomainKnowledgeIds: [],
      importance: "REQUIRED_CAPABILITY",
      matchStatus: "DIRECT_MATCH",
      supportedAspects: ["workflow automation delivery"],
      unsupportedAspects: [],
      transferContext: "",
      explanation: "Current evidence supports delivery.",
      confidence: "High",
      cvUsage: "PRIORITIZE",
      interviewUsage: "LEAD_STORY",
      hardBlock: false,
      hardBlockReason: ""
    }],
    remainingGaps: []
  }
};
const baseData = {
  rawSources: [source],
  sourceOfTruth: {},
  careerProfile: {
    contact: {},
    workExperiences: [{
      id: "experience-1",
      company: "Example",
      role: "Automation Lead",
      period: "2024-present",
      location: "Taipei",
      scope: "",
      projects: [project]
    }]
  },
  skillInferences: [],
  domainKnowledge: [],
  evidenceCards: [evidence],
  starStories: [],
  jobs: [job],
  cvVersions: [],
  backboneTasks: [],
  backboneMetadata: {},
  backboneUpdateSummary: {},
  recruiterAnswers: [],
  promptTemplates: [],
  highCompensationSignals: []
};

const generatedContext = {
  ...selection.buildGenerationContext(baseData, job),
  writerContextHash: "writer-input-1",
  promptVersion: "screening-cv-v7-one-pass-reviewer-ready"
};
const completedJob = {
  ...job,
  screeningCvRun: {
    status: "completed",
    mode: "generate",
    inputHash: "writer-input-1",
    applied: true
  }
};
const cv = {
  id: "cv-1",
  jdId: job.id,
  name: "Automation Lead CV",
  summary: "Evidence-backed automation lead.",
  content: "Evidence-backed automation lead.",
  sections: {},
  tailoredCv: {
    header: { name: "Candidate", email: "candidate@example.com", location: "Taipei", targetRole: "Automation Lead" },
    summary: "Evidence-backed automation lead.",
    sidebar: { skillGroups: [] },
    workExperience: []
  },
  generationContext: generatedContext,
  status: "Ready to Export",
  updatedAt: "2026-07-19T00:00:00.000Z"
};
const cvHash = review.reviewSnapshotContentHash(cv);
cv.reviewSnapshot = {
  snapshotId: "review-1",
  updatedAt: "2026-07-19T00:00:00.000Z",
  contentHash: cvHash,
  reviewedCvVersionId: cv.id,
  reviewedCvContentHash: cvHash,
  freshnessStatus: "fresh"
};

assert.equal(selection.cvStaleReasonForJob(cv, completedJob, baseData), null, "unchanged completed Writer input must remain current");

const unsafeData = {
  ...baseData,
  jobs: [completedJob],
  evidenceCards: [{
    ...evidence,
    canBeUsedInCv: "No",
    visibilityUse: "Interview Only",
    claimLevel: "Do Not Claim"
  }]
};
const evaluation = {
  gate: null,
  managerReview: null,
  reviewerReview: { ready: true, blockers: [], checks: [] },
  exportCheck: { ready: true, blockers: [], checks: [] }
};

assert.equal(
  selection.cvStaleReasonForJob(cv, completedJob, unsafeData),
  "cv-brief-changed",
  "same-ID Evidence content or CV-use policy mutation must invalidate the generated CV"
);
const decision = exportDecision.resolveScreeningExportDecision({
  data: unsafeData,
  job: completedJob,
  cv,
  evaluation,
  requireFreshReview: true
});
assert.equal(decision.ready, false, "stale Evidence input must block Export even when the old CV Review remains content-fresh");
assert.match(decision.blockers.join("\n"), /stale|cv brief/i);

console.log(JSON.stringify({
  ok: true,
  checked: [
    "unchanged completed Writer input remains current",
    "same-ID Evidence policy mutation invalidates generated CV",
    "stale Evidence input blocks Export despite content-fresh old Review"
  ]
}, null, 2));
