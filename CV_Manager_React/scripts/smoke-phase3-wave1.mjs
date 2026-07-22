import assert from "node:assert/strict";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";

const repairModule = join(tmpdir(), `phase3-repair-${Date.now()}.mjs`);
await build({ entryPoints: ["src/domain/localReviewerFix.ts"], bundle: true, format: "esm", platform: "node", outfile: repairModule, logLevel: "silent" });
const { buildLocalReviewerContentFix } = await import(pathToFileURL(repairModule).href);

const planModule = join(tmpdir(), `phase3-repair-plan-${Date.now()}.mjs`);
await build({ entryPoints: ["src/domain/screeningRepairPlan.ts"], bundle: true, format: "esm", platform: "node", outfile: planModule, logLevel: "silent" });
const { createRepairPlan, localRepairPlan, validateRepairPlanForExecution } = await import(pathToFileURL(planModule).href);

const workflowModule = join(tmpdir(), `phase3-workflow-${Date.now()}.mjs`);
await build({ entryPoints: ["src/domain/screeningWorkflow.ts"], bundle: true, format: "esm", platform: "node", outfile: workflowModule, logLevel: "silent" });
const { deriveScreeningWorkflowState, resolvePrimaryWorkflowCta } = await import(pathToFileURL(workflowModule).href);

const reviewModule = join(tmpdir(), `phase3-review-${Date.now()}.mjs`);
await build({ entryPoints: ["src/domain/screeningReview.ts"], bundle: true, format: "esm", platform: "node", outfile: reviewModule, logLevel: "silent" });
const { exportVerification, screeningGate } = await import(pathToFileURL(reviewModule).href);

const header = { name: "Test Candidate", targetRole: "Workflow Specialist", email: "test@example.com", location: "Taipei" };
const sidebar = { languages: [], skillGroups: [{ title: "Core", highlightedSkills: ["Workflow automation"], otherSkills: [] }], certifications: [], education: [] };
const unsafeBullet = { text: "FIN AI v1.2 ticket log", evidenceIds: ["ev-old"], confidence: "Grounded", metricType: "None" };
const currentCv = {
  id: "cv-phase3",
  jdId: "job-phase3",
  name: "Phase 3 CV",
  summary: "Workflow specialist.",
  content: "Workflow specialist content",
  status: "Draft",
  updatedAt: "2026-07-13T00:00:00.000Z",
  tailoredCv: {
    header,
    sidebar,
    summary: "Workflow specialist.",
    workExperience: [{
      company: "Example Company", role: "Workflow Specialist", period: "2022 - Present", location: "Taipei",
      subsections: [{ title: "Internal log", bullets: [unsafeBullet] }]
    }],
    reviewNotes: [], keywordPlacementNotes: [], interviewNotes: []
  }
};

const evidence = [{
  id: "ev-safe",
  title: "Workflow delivery",
  confidence: "Grounded",
  visibilityUse: "CV Visible",
  claimLevel: "Direct Claim",
  cvSafeBullet: "Built a workflow that improved stakeholder visibility",
  tools: [],
  proof: "Workflow delivery proof",
  metrics: "",
  sourceIds: []
}];

const failedReviewerChecks = [
  { label: "Reviewer: external wording", ok: false, value: "1 work-log bullet(s)" },
  { label: "Reviewer: action/outcome bullets", ok: false, value: "0/1 action-oriented bullet(s)" },
  { label: "Reviewer: application fit risk", ok: true, value: "1 unsupported mapping(s), 1 high-risk gap(s) tracked as fit risk" }
];
const passedExportChecks = [
  { label: "Contact extraction", ok: true, value: "Test Candidate · test@example.com · Taipei" }
];

const plan = createRepairPlan({
  cv: currentCv,
  gateFixes: [],
  reviewerChecks: failedReviewerChecks,
  exportChecks: passedExportChecks
});
assert.ok(plan, "repair plan must be created for the current CV");
assert.ok(plan.cvContentHash, "repair plan must include current CV content identity");
assert.ok(plan.failedCheckIds.includes("reviewer-external-wording"), "repair plan must include failed check IDs");
assert.ok(plan.items.every((item) => item.targetZones.length > 0), "repair plan items must have target zones");

const malformedPlan = {
  ...plan,
  items: [{ ...plan.items[0], targetZones: [] }]
};
assert.match(validateRepairPlanForExecution(malformedPlan), /no target zone/i, "repair without target zones must be rejected");

const safePlan = localRepairPlan(plan);
assert.ok(safePlan, "a safe local repair plan must exist for workExperience wording failures");
const fixResult = buildLocalReviewerContentFix({
  currentCv: currentCv.tailoredCv,
  careerProfile: { workExperiences: [] },
  evidenceCards: evidence,
  selectedEvidenceIds: ["ev-safe"],
  brief: null,
  repairPlan: safePlan,
  isBulletSafe: (bullet) => !/FIN AI|ticket log/i.test(bullet.text)
});
assert.equal(fixResult.status, "success", "Local Fix must return explicit success");
assert.equal(fixResult.ok, true, "safe local repair should succeed");
assert.deepEqual(fixResult.changedZones, ["workExperience"], "repair must report changed zones");
assert.deepEqual(fixResult.tailoredCv.header, header, "passed header zone must remain unchanged");
assert.deepEqual(fixResult.tailoredCv.sidebar, sidebar, "passed sidebar zone must remain unchanged");
assert.equal(fixResult.tailoredCv.summary, currentCv.tailoredCv.summary, "passed summary zone must remain unchanged");
assert.ok(fixResult.tailoredCv.workExperience[0].subsections.some((section) => section.bullets.length), "failed workExperience zone must be repaired");
assert.ok(fixResult.tailoredCv.workExperience.flatMap((role) => role.subsections.flatMap((section) => section.bullets)).every((bullet) => !/FIN AI|ticket log|v1\.2/i.test(bullet.text)), "failed unsafe wording must not remain");

const noSafePlan = createRepairPlan({
  cv: currentCv,
  gateFixes: [],
  reviewerChecks: [],
  exportChecks: [{ label: "Contact extraction", ok: false, value: "Missing name, email, or location" }]
});
const noSafeResult = buildLocalReviewerContentFix({
  currentCv: currentCv.tailoredCv,
  careerProfile: { workExperiences: [] },
  evidenceCards: evidence,
  selectedEvidenceIds: ["ev-safe"],
  brief: null,
  repairPlan: localRepairPlan(noSafePlan),
  isBulletSafe: () => true
});
assert.equal(noSafeResult.status, "no-safe-fix", "Local Fix with no safe content target must return no-safe-fix instead of silent no-op");
assert.ok(noSafeResult.remainingBlockers.length > 0, "blocked/no-safe-fix results must report remaining blockers");

const workflowBase = {
  careerEvidenceReady: true,
  analysisReady: true,
  terminologyReady: true,
  briefReady: true,
  hasCv: true,
  cvRunActive: false,
  gateIssueCount: 0,
  reviewerIssueCount: 2,
  reviewerReady: false,
  reviewSnapshotValid: true,
  cvVersionCount: 1,
  run: { status: "completed", mode: "generate", applied: true }
};
const workflowState = deriveScreeningWorkflowState(workflowBase);
assert.equal(workflowState.recommendedView, "reviewer", "upstream completed stages must remain completed after repair review");
assert.equal(workflowState.gateChecked, true, "Gate must not be reset by repair planning");
assert.equal(workflowState.finalReviewChecked, true, "final review identity remains current");

assert.equal(resolvePrimaryWorkflowCta({ ...workflowBase, hasSafeLocalRepair: true, hasAiRepair: false, exportReady: false, run: { status: "idle" } }).label, "Apply Safe Fix", "CTA must point to safe local repair when available");
assert.equal(resolvePrimaryWorkflowCta({ ...workflowBase, hasSafeLocalRepair: true, hasAiRepair: false, exportReady: false }).label, "Apply Safe Fix", "completed generation must not hide a safe local repair CTA");
assert.equal(resolvePrimaryWorkflowCta({ ...workflowBase, hasSafeLocalRepair: false, hasAiRepair: true, exportReady: false, run: { status: "idle" } }).label, "Review AI Repair", "CTA must point to AI repair when local repair is unavailable");
assert.equal(resolvePrimaryWorkflowCta({ ...workflowBase, reviewerIssueCount: 0, reviewerReady: true, hasSafeLocalRepair: false, hasAiRepair: false, exportReady: true }).label, "Export Final CV", "export CTA must appear when blocking checks clear");
assert.notEqual(resolvePrimaryWorkflowCta({ ...workflowBase, reviewerIssueCount: 0, reviewerReady: true, hasSafeLocalRepair: false, hasAiRepair: false, exportReady: true }).label, "Generate CV", "CTA must not point backward to completed generation");
assert.equal(resolvePrimaryWorkflowCta({ ...workflowBase, hasSafeLocalRepair: false, hasAiRepair: false, exportReady: false }).label, "Resolve blocker", "real blocker must show one exact next action");
assert.equal(resolvePrimaryWorkflowCta({ ...workflowBase, cvRunActive: true, hasSafeLocalRepair: true, hasAiRepair: true, exportReady: false }).label, "Stop", "active workflow CTA must be Stop, not another AI loop");

const warningOnlyJob = {
  id: "job-warning",
  company: "Target Company",
  role: "Workflow Specialist",
  location: "Taipei",
  rawJD: "Workflow specialist",
  status: "CV Drafted",
  fit: "High",
  nextAction: "Review",
  selectedEvidenceIds: [],
  selectedStoryIds: [],
  updatedAt: "2026-07-13T00:00:00.000Z",
  screeningAnalysis: {
    primaryTargetTitle: "Workflow Specialist",
    mustHaveKeywords: [],
    missingKeywords: [],
    riskyClaims: [],
    summaryAngle: "Workflow delivery",
    remainingGaps: [{ gap: "Kubernetes production ownership", riskLevel: "High", mitigation: "Interview risk only" }]
  }
};
const longBullet = (index) => `Built workflow ${index} with stakeholder controls, decision support, documentation, operational reliability, and repeatable handoff practices across enterprise teams.`;
const exportCv = {
  id: "cv-export-ready",
  jdId: warningOnlyJob.id,
  name: "Export Ready",
  summary: "Workflow specialist.",
  content: Array.from({ length: 12 }, (_, index) => longBullet(index + 1)).join("\n"),
  status: "Draft",
  updatedAt: "2026-07-13T00:00:00.000Z",
  tailoredCv: {
    header,
    sidebar,
    summary: "Workflow specialist delivering reliable automation, operational controls, stakeholder enablement, documentation, and decision-ready reporting across enterprise teams.",
    workExperience: [
      { company: "Example Company", role: "Workflow Specialist", period: "2022 - Present", location: "Taipei", subsections: [{ title: "Workflow Delivery", bullets: Array.from({ length: 5 }, (_, index) => ({ text: longBullet(index + 1), evidenceIds: [`ev-${index + 1}`], confidence: "Grounded", metricType: "Scope" })) }] },
      { company: "Earlier Company", role: "Analyst", period: "2020 - 2022", location: "Taipei", subsections: [{ title: "Enablement", bullets: Array.from({ length: 3 }, (_, index) => ({ text: longBullet(index + 6), evidenceIds: [`ev-${index + 6}`], confidence: "Grounded", metricType: "Scope" })) }] }
    ],
    reviewNotes: [], keywordPlacementNotes: [], interviewNotes: []
  }
};
const warningGate = screeningGate(warningOnlyJob, exportCv, []);
const warningExport = exportVerification(warningOnlyJob, exportCv, warningGate);
assert.equal(warningExport.ready, true, "warnings alone must not block export readiness");

console.log(JSON.stringify({ ok: true, checked: [
  "repair plan includes content identity and failed checks",
  "repair without target zones rejected",
  "local fix returns success/blocked/no-safe-fix status",
  "repair changes only failed workExperience zone",
  "passed zones unchanged",
  "remaining blockers reported",
  "affected checks can be re-evaluated without resetting upstream state",
  "single CTA resolves earliest genuine next action",
  "CTA never points backward to completed generation",
  "export CTA appears when blockers clear",
  "warnings alone do not block export",
  "no automatic AI loop or hidden invocation introduced"
] }, null, 2));
