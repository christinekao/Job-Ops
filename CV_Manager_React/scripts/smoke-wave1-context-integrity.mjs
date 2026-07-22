import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function bundledImport(entry, name) {
  const outfile = join(tmpdir(), `${name}-${Date.now()}-${Math.random().toString(36).slice(2)}.mjs`);
  await build({ entryPoints: [entry], bundle: true, format: "esm", platform: "node", outfile, logLevel: "silent" });
  return import(pathToFileURL(outfile).href);
}

const selection = await bundledImport("src/data/selection.ts", "wave1-selection");
const prompts = await bundledImport("src/promptBuilders.ts", "wave1-prompts");
const repair = await bundledImport("src/domain/localReviewerFix.ts", "wave1-repair");
const review = await bundledImport("src/domain/screeningReview.ts", "wave1-review");
const hashes = await bundledImport("src/utils/hash.ts", "wave1-hash");

const evidence1 = {
  id: "ev-priority-1", title: "PRIORITY_ONE_MARKER", category: "Workflow", confidence: "Grounded",
  evidenceTier: "Core", visibilityUse: "CV Visible", claimLevel: "Direct Claim", tools: ["Power Automate"],
  proof: "Grounded workflow delivery", metrics: "Reduced manual work", sourceIds: ["source-1"],
  cvSafeBullet: "Built the priority-one workflow to improve stakeholder visibility", experienceId: "exp-current"
};
const evidence2 = {
  ...evidence1, id: "ev-priority-2", title: "PRIORITY_TWO_MARKER", metrics: "", quantifiedEvidence: "",
  cvSafeBullet: "Supported the priority-two workflow", experienceId: "exp-prior"
};
const job = {
  id: "job-wave1", company: "Example", role: "Workflow Specialist", location: "Taipei",
  rawJD: "Workflow delivery and stakeholder visibility", status: "Ready to Tailor", fit: "High",
  nextAction: "Generate CV", selectedSkillIds: [], selectedDomainKnowledgeIds: [],
  selectedEvidenceIds: ["ev-priority-1", "ev-priority-2"], selectedStoryIds: [],
  updatedAt: "2026-07-12T00:00:00.000Z", cvBriefGeneratedAt: "2026-07-12T00:00:00.000Z",
  screeningAnalysis: {
    primaryTargetTitle: "Workflow Specialist", summaryAngle: "Evidence-backed workflow delivery",
    mustHaveKeywords: ["workflow"], missingKeywords: [], riskyClaims: [],
    recommendedEvidenceIds: ["ev-priority-1", "ev-priority-2"],
    jdEvidenceMapping: [{
      requirement: "Workflow delivery", marketExpectation: "Reliable delivery",
      matchingEvidenceIds: ["ev-priority-1"], matchingSkillIds: [], matchingStoryIds: [],
      supportLevel: "Strong", safeCvAngle: "EFFECTIVE_BRIEF_MARKER", gapOrRisk: ""
    }]
  },
  cvBrief: {
    targetPositioning: "STALE_BRIEF_MARKER", managerHiringProblem: "", top3SellingPoints: [],
    mustShowEvidenceIds: ["ev-priority-2"], supportingEvidenceIds: [], skillsToForeground: [],
    skillsToSuppress: [], claimsToAvoid: [], cvHeadline: "", summaryAngle: "", firstSectionTheme: "",
    bulletPlan: [], generatedAt: "2026-07-01T00:00:00.000Z"
  }
};
const data = {
  jobs: [job], rawSources: [], sourceOfTruth: {},
  careerProfile: {
    identity: "Test Candidate", contact: { name: "Test Candidate", email: "test@example.com", location: "Taipei" },
    targetRoles: [], positioning: "Workflow operations", education: [], certifications: [], skillGroups: [],
    workExperiences: [{ id: "exp-current", company: "Example", role: "Workflow Specialist", period: "2022 - Present", location: "Taipei", scope: "Workflow delivery", projects: [] }],
    claimBoundaries: "Use grounded evidence only"
  },
  skillInferences: [], domainKnowledge: [], evidenceCards: [evidence2, evidence1], starStories: []
};

const effectiveBrief = selection.resolveEffectiveCvBrief(data, job);
assert.ok(effectiveBrief, "effective Brief must resolve");
assert.equal(effectiveBrief.top3SellingPoints[0].managerValue, "EFFECTIVE_BRIEF_MARKER");
assert.notEqual(effectiveBrief.targetPositioning, "STALE_BRIEF_MARKER");
assert.equal(selection.isCvBriefUsable(effectiveBrief), true);

const generationContext = selection.buildGenerationContext(data, job, effectiveBrief);
assert.equal(generationContext.cvBriefHash, selection.cvBriefIdentityHash(effectiveBrief));
assert.deepEqual(generationContext.evidencePriorityIds, ["ev-priority-1", "ev-priority-2"]);

const legacyJob = { ...job, cvBrief: effectiveBrief };
const legacyDiagnostics = selection.selectionDiagnostics(data, legacyJob);
const legacyContext = {
  ...selection.buildGenerationContext(data, legacyJob, effectiveBrief),
  cvBriefHash: hashes.contentHash(effectiveBrief),
  sourceDataHash: hashes.contentHash({
    sourceOfTruth: data.sourceOfTruth,
    careerProfile: data.careerProfile,
    selectedSkills: legacyDiagnostics.selectedSkills,
    selectedDomainKnowledge: legacyDiagnostics.selectedDomainKnowledge,
    selectedEvidence: legacyDiagnostics.selectedEvidence,
    selectedStarStories: legacyDiagnostics.selectedStarStories,
    cvBrief: effectiveBrief
  })
};
const legacyCv = { id: "cv-legacy", jdId: legacyJob.id, generationContext: legacyContext };
assert.equal(selection.cvStaleReasonForJob(legacyCv, legacyJob, data), null, "legacy Brief/source hashes must remain compatible");

const diagnostics = selection.selectionDiagnostics(data, job);
assert.deepEqual(diagnostics.selectedEvidence.map((item) => item.id), ["ev-priority-1", "ev-priority-2"]);
const quality = selection.evidenceSelectionQualityDiagnostics(data, job);
assert.equal(quality.topRequirementCoverageCount, 1);
assert.deepEqual(quality.currentRoleEvidenceIds, ["ev-priority-1"]);
assert.deepEqual(quality.priorRoleEvidenceIds, ["ev-priority-2"]);
assert.deepEqual(quality.evidenceWithBusinessImpact, ["ev-priority-1"]);
assert.deepEqual(quality.evidenceWithTechnicalDepth, ["ev-priority-1", "ev-priority-2"]);

const writerContext = prompts.buildScreeningCvWriterContext(data, job.id);
assert.deepEqual(writerContext.evidencePriorityIds, ["ev-priority-1", "ev-priority-2"]);
assert.deepEqual(writerContext.cvVisibleEvidence.map((item) => item.id), ["ev-priority-1", "ev-priority-2"]);
assert.equal(writerContext.candidateContact.email, "test@example.com");
const prompt = prompts.buildScreeningCvPrompt(data, job.id);
assert.match(prompt, /EFFECTIVE_BRIEF_MARKER/);
assert.doesNotMatch(prompt, /STALE_BRIEF_MARKER/);
assert.ok(prompt.indexOf("PRIORITY_ONE_MARKER") < prompt.indexOf("PRIORITY_TWO_MARKER"));
assert.match(prompt, /test@example\.com/);

const repairResult = repair.buildLocalReviewerContentFix({
  currentCv: {
    header: { name: "Test Candidate", targetRole: "Workflow Specialist", email: "test@example.com", location: "Taipei" },
    sidebar: { languages: [], skillGroups: [], certifications: [], education: [] }, summary: "Workflow specialist",
    workExperience: [{ company: "Example", role: "Workflow Specialist", period: "2022 - Present", location: "Taipei", subsections: [] }],
    reviewNotes: []
  },
  careerProfile: data.careerProfile,
  evidenceCards: data.evidenceCards,
  selectedEvidenceIds: job.selectedEvidenceIds,
  brief: effectiveBrief,
  isBulletSafe: () => true
});
assert.equal(repairResult.ok, true);
const repairedIds = repairResult.tailoredCv.workExperience[0].subsections.flatMap((section) => section.bullets).map((bullet) => bullet.evidenceIds[0]);
assert.deepEqual(repairedIds.slice(0, 2), ["ev-priority-1", "ev-priority-2"]);

const reviewCv = {
  id: "cv-review-priority", jdId: job.id, name: "Review priority", summary: "Workflow delivery",
  content: "Workflow delivery ".repeat(100), status: "Draft", updatedAt: "2026-07-12T00:00:00.000Z",
  generationContext: { ...generationContext, evidencePriorityIds: ["ev-priority-1", "ev-priority-2"] },
  tailoredCv: {
    header: { name: "Test Candidate", targetRole: "Workflow Specialist", email: "test@example.com", location: "Taipei" },
    sidebar: { languages: [], skillGroups: [], certifications: [], education: [] }, summary: "Workflow delivery",
    workExperience: [{ company: "Example", role: "Workflow Specialist", period: "2022 - Present", location: "Taipei", subsections: [{ title: "Workflow", bullets: [{ text: "Built a workflow to improve visibility", evidenceIds: ["ev-priority-1"], confidence: "Grounded" }] }] }],
    reviewNotes: []
  }
};
const gate = review.screeningGate(job, reviewCv, data.evidenceCards);
assert.deepEqual(gate.evidencePriorityIds, ["ev-priority-1", "ev-priority-2"], "Reviewer must use generation-context evidence priority");

const snapshot = JSON.parse(await readFile("data/app_data.json", "utf8"));
const ratios = [];
for (const currentJob of snapshot.data.jobs) {
  const projected = prompts.buildScreeningCvWriterContext(snapshot.data, currentJob.id);
  const selectedSkills = snapshot.data.skillInferences.filter((item) => currentJob.selectedSkillIds.includes(item.id));
  const selectedDomains = snapshot.data.domainKnowledge.filter((item) => currentJob.selectedDomainKnowledgeIds.includes(item.id));
  const selectedEvidence = snapshot.data.evidenceCards.filter((item) => currentJob.selectedEvidenceIds.includes(item.id));
  const selectedStories = snapshot.data.starStories.filter((item) => currentJob.selectedStoryIds.includes(item.id));
  const legacyPayload = {
    analysis: currentJob.screeningAnalysis, brief: currentJob.cvBrief, jd: currentJob.parsed || currentJob.rawJD,
    careerProfile: snapshot.data.careerProfile, selectedSkills, selectedDomains, selectedEvidence, selectedStories
  };
  const ratio = JSON.stringify(projected).length / JSON.stringify(legacyPayload).length;
  ratios.push({ jobId: currentJob.id, ratio });
  assert.ok(ratio <= 0.5, `projected Writer context for ${currentJob.id} must be <= 50% of legacy JSON payload; got ${ratio.toFixed(3)}`);
}

console.log(JSON.stringify({ ok: true, checked: [
  "effective Brief resolution", "Brief identity binding", "selected evidence order", "selection quality diagnostics",
  "Writer and repair evidence priority", "structured contact ownership", "Writer context reduction"
], ratios }, null, 2));
