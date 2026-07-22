import assert from "node:assert/strict";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";

const bundledSelection = join(tmpdir(), `p17-selection-${Date.now()}.mjs`);
const bundledPrompts = join(tmpdir(), `p17-prompts-${Date.now()}.mjs`);

for (const [entryPoint, outfile] of [
  ["src/data/selection.ts", bundledSelection],
  ["src/promptBuilders.ts", bundledPrompts]
]) {
  await build({ entryPoints: [entryPoint], bundle: true, format: "esm", platform: "node", outfile, logLevel: "silent" });
}

const selection = await import(pathToFileURL(bundledSelection).href);
const prompts = await import(pathToFileURL(bundledPrompts).href);

const evidence = {
  id: "ev-automation",
  title: "Workflow automation",
  confidence: "Grounded",
  evidenceTier: "Core",
  visibilityUse: "CV Visible",
  claimLevel: "Direct Claim",
  canBeUsedInCv: "Yes",
  sourceIds: ["source-1"],
  experienceId: "exp-1",
  projectId: "project-1",
  cvAngle: "Automated enterprise workflows",
  allowedVisibleClaims: ["Automated enterprise workflows"],
  forbiddenVisibleClaims: ["Owned distributed systems"],
  blockedVisibleTerms: ["distributed systems"],
  tools: ["Power Platform"],
  metrics: ""
};

const data = {
  rawSources: [{ id: "source-1", title: "Verified source", content: "Evidence source" }],
  careerProfile: { workExperiences: [{ id: "exp-1", projects: [{ id: "project-1", sourceIds: ["source-1"] }] }] },
  skillInferences: [],
  domainKnowledge: [],
  evidenceCards: [evidence],
  starStories: [],
  sourceOfTruth: []
};

const coreGap = {
  requirementId: "req-distributed",
  requirement: "large-scale distributed systems ownership",
  normalizedRequirement: "large-scale distributed systems ownership",
  sourceSection: "requirements",
  atomicDimension: "CAPABILITY",
  expectedAspects: [],
  marketExpectation: "Own distributed systems",
  matchingEvidenceIds: ["ev-automation"],
  matchingSkillIds: [],
  matchingStoryIds: [],
  matchingEducationIds: [],
  matchingDomainKnowledgeIds: [],
  importance: "CORE_RESPONSIBILITY",
  matchStatus: "CORE_CAPABILITY_GAP",
  supportedAspects: [],
  unsupportedAspects: ["distributed systems ownership"],
  transferContext: "",
  explanation: "Workflow automation is not distributed-systems ownership.",
  confidence: "High",
  cvUsage: "FORBIDDEN",
  interviewUsage: "DISCLOSE_GAP",
  hardBlock: false,
  hardBlockReason: ""
};

const job = {
  id: "job-p17",
  company: "Example",
  role: "Principal Software Engineer",
  location: "Taipei",
  rawJD: "Own large-scale distributed systems.",
  status: "Evidence Ready",
  fit: "Low",
  nextAction: "Apply recommendations",
  selectedSkillIds: [],
  selectedDomainKnowledgeIds: [],
  selectedEvidenceIds: ["ev-automation"],
  selectedStoryIds: [],
  updatedAt: "2026-07-22T00:00:00.000Z",
  screeningAnalysis: {
    primaryTargetTitle: "Enterprise Automation and AI Quality Operations",
    summaryAngle: "Adjacent automation positioning only",
    mustHaveKeywords: [],
    missingKeywords: ["distributed systems"],
    riskyClaims: ["Owned distributed systems"],
    requirementMatrix: [coreGap],
    opportunityAnalysis: { credibleOverlaps: ["workflow automation"], whyCoreFitIsLow: ["No distributed-systems ownership"], coreUnbridgeableShortTermGaps: ["distributed systems ownership"], futureTransitionPath: [], betterAdjacentRoles: ["AI Operations"], recommendedPreparation: [], whyCandidateCouldWin: [], differentiatedStrengths: [], credibleTransferableStrengths: [], learnableGaps: [], coreRisks: ["distributed systems ownership"], cvPositioning: "Adjacent automation only", interviewPositioning: [] },
    candidatePositioning: { safestPositioning: "Enterprise automation, not platform engineering.", headlineRecommendation: "Enterprise Automation and AI Quality Operations", whyThisFits: ["workflow automation"], hiddenSkillsToSurface: [], evidenceToSuppress: [], claimsToAvoid: ["Owned distributed systems"], interviewRiskQuestions: [] },
    // Historical compatibility data deliberately conflicts with the canonical matrix.
    recommendedEvidenceIds: ["ev-automation"],
    jdEvidenceMapping: [{ ...coreGap, supportLevel: "Strong", safeCvAngle: "Claim distributed systems", gapOrRisk: "" }]
  }
};

data.jobs = [job];

const brief = selection.buildCvBrief(data, job);
assert.ok(brief, "current canonical analysis should produce an inspectable Brief");
assert.deepEqual(brief.mustShowEvidenceIds, [], "CORE_CAPABILITY_GAP / FORBIDDEN evidence must not enter the visible Brief through legacy recommendations");
assert.ok(!brief.bulletPlan.some((item) => /distributed/i.test(item.requirement)), "core capability gap must not become a CV proof plan");

const writerContext = prompts.buildScreeningCvWriterContext(data, job.id);
assert.ok(writerContext, "Writer context should be constructible from current canonical analysis");
assert.ok(!Object.hasOwn(writerContext.analysis, "jdEvidenceMapping"), "Writer context must not receive legacy mapping fields");

const rowFor = (overrides = {}) => ({
  ...coreGap,
  requirementId: "req-supported",
  requirement: "workflow automation",
  normalizedRequirement: "workflow automation",
  marketExpectation: "Deliver workflow automation",
  matchingEvidenceIds: ["ev-automation"],
  matchStatus: "DIRECT_MATCH",
  supportedAspects: ["workflow automation"],
  unsupportedAspects: [],
  transferContext: "",
  cvUsage: "PRIORITIZE",
  interviewUsage: "LEAD_STORY",
  ...overrides
});
const briefFor = (row, evidenceCards = [evidence]) => selection.buildCvBrief(
  { ...data, evidenceCards },
  { ...job, screeningAnalysis: { ...job.screeningAnalysis, requirementMatrix: [row], recommendedEvidenceIds: ["ev-automation"] } }
);

const directBrief = briefFor(rowFor());
assert.deepEqual(directBrief.mustShowEvidenceIds, ["ev-automation"], "DIRECT_MATCH / PRIORITIZE evidence may enter the Brief");

const transferableBrief = briefFor(rowFor({ requirementId: "req-transfer", matchStatus: "TRANSFERABLE_MATCH", cvUsage: "CONSERVATIVE_POSITIONING", transferContext: "enterprise workflow automation to target workflow operations", unsupportedAspects: ["target-platform ownership"] }));
assert.equal(transferableBrief.bulletPlan[0].transferContext, "enterprise workflow automation to target workflow operations", "TRANSFERABLE_MATCH must retain source-to-target context");
assert.deepEqual(transferableBrief.bulletPlan[0].unsupportedAspects, ["target-platform ownership"], "TRANSFERABLE_MATCH must retain its limitation");

const partialBrief = briefFor(rowFor({ requirementId: "req-partial", matchStatus: "PARTIAL_MATCH", cvUsage: "SUPPORTING", supportedAspects: ["workflow automation"], unsupportedAspects: ["service architecture ownership"] }));
assert.deepEqual(partialBrief.bulletPlan[0].unsupportedAspects, ["service architecture ownership"], "PARTIAL_MATCH must retain unsupported aspects");

const doNotClaimBrief = briefFor(rowFor({ requirementId: "req-no-claim", cvUsage: "DO_NOT_CLAIM" }));
assert.deepEqual(doNotClaimBrief.mustShowEvidenceIds, [], "DO_NOT_CLAIM evidence must not enter visible Brief evidence");

const interviewOnlyEvidence = { ...evidence, visibilityUse: "Interview Only", claimLevel: "Interview Only", canBeUsedInCv: "No" };
const interviewOnlyBrief = briefFor(rowFor({ requirementId: "req-interview" }), [interviewOnlyEvidence]);
assert.deepEqual(interviewOnlyBrief.mustShowEvidenceIds, [], "Interview Only evidence must not become CV-visible");

const formalBrief = briefFor(rowFor({ requirementId: "req-formal", importance: "FORMAL_REQUIREMENT", matchStatus: "FORMAL_SCREENING_RISK", cvUsage: "DO_NOT_CLAIM", interviewUsage: "DISCLOSE_GAP" }));
assert.deepEqual(formalBrief.mustShowEvidenceIds, [], "FORMAL_SCREENING_RISK must not become a CV capability claim");

const legacyJob = { ...job, screeningAnalysis: { ...job.screeningAnalysis, requirementMatrix: undefined } };
assert.equal(selection.buildCvBrief(data, legacyJob), null, "legacy mapping-only analysis cannot authorize a current Brief");
assert.equal(prompts.buildScreeningCvWriterContext({ ...data, jobs: [legacyJob] }, legacyJob.id), null, "legacy analysis cannot authorize Writer context");

const currentBrief = briefFor(rowFor());
const safetyChangedBrief = briefFor(rowFor(), [interviewOnlyEvidence]);
assert.notEqual(selection.cvBriefIdentityHash(currentBrief), selection.cvBriefIdentityHash(safetyChangedBrief), "evidence safety mutation must stale the Brief identity");

console.log(JSON.stringify({ ok: true, ai_invoked: false, cases: 12 }, null, 2));
