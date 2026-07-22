import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const exportDecisionModule = join(tmpdir(), `phase3-export-decision-${Date.now()}.mjs`);
await build({ entryPoints: ["src/domain/screeningExportDecision.ts"], bundle: true, format: "esm", platform: "node", outfile: exportDecisionModule, logLevel: "silent" });
const { resolveScreeningExportDecision } = await import(pathToFileURL(exportDecisionModule).href);

const workflowModule = join(tmpdir(), `phase3-export-workflow-${Date.now()}.mjs`);
await build({ entryPoints: ["src/domain/screeningWorkflow.ts"], bundle: true, format: "esm", platform: "node", outfile: workflowModule, logLevel: "silent" });
const { deriveScreeningWorkflowState, resolvePrimaryWorkflowCta } = await import(pathToFileURL(workflowModule).href);

const job = {
  id: "job-export-decision",
  company: "Example Company",
  role: "Workflow Specialist",
  location: "Taipei",
  rawJD: "Workflow specialist",
  status: "CV Drafted",
  fit: "Unknown",
  nextAction: "Review",
  selectedEvidenceIds: [],
  selectedStoryIds: [],
  updatedAt: "2026-07-13T00:00:00.000Z",
  screeningAnalysis: { primaryTargetTitle: "Workflow Specialist", missingKeywords: [], riskyClaims: [], summaryAngle: "Workflow delivery" }
};

const cv = {
  id: "cv-export-decision",
  jdId: job.id,
  name: "Export Decision CV",
  summary: "Workflow specialist delivering grounded automation and stakeholder enablement.",
  content: "Long composed export content ".repeat(60),
  status: "Draft",
  updatedAt: "2026-07-13T00:00:00.000Z",
  tailoredCv: {
    header: { name: "Test Candidate", targetRole: "Workflow Specialist", email: "test@example.com", location: "Taipei" },
    sidebar: { languages: [], skillGroups: [], certifications: [], education: [] },
    summary: "Workflow specialist delivering grounded automation and stakeholder enablement.",
    workExperience: [],
    reviewNotes: [],
    keywordPlacementNotes: [],
    interviewNotes: []
  }
};

const readyEvaluation = {
  gate: { fixNext: [], supportedMissingKeywords: [], coveredKeywords: [] },
  managerReview: { wouldInterview: "Yes", rewriteRequired: [] },
  reviewerReview: { ready: true, blockers: [], checks: [{ label: "Reviewer: application fit risk", ok: true, value: "Tracked as non-blocking" }] },
  exportCheck: { ready: true, blockers: [], checks: [] }
};

const readyDecision = resolveScreeningExportDecision({ job, cv, evaluation: readyEvaluation });
assert.equal(readyDecision.ready, true, "Screening Analysis must be a valid export decision context without legacy fitReview");
assert.equal(readyDecision.status, "ready", "all clear review/export checks must make export ready");
assert.equal(readyDecision.warnings.length, 1, "non-blocking application-fit risk must remain a warning");

const blockedDecision = resolveScreeningExportDecision({
  job,
  cv,
  evaluation: { ...readyEvaluation, exportCheck: { ready: false, blockers: ["Contact extraction: Missing email"], checks: [] } }
});
assert.equal(blockedDecision.ready, false, "contract export blocker must disable export");
assert.match(blockedDecision.blockers.join(" "), /Contact extraction/, "exact export blocker must remain visible");

const legacyFitDecision = resolveScreeningExportDecision({
  job: { ...job, screeningAnalysis: undefined, fit: "High", fitReview: { employerSignals: [], strongMatches: [], gaps: [], positioningAdvice: "Grounded fit" } },
  cv,
  evaluation: readyEvaluation
});
assert.equal(legacyFitDecision.ready, true, "legacy valid Fit Review must remain supported as decision context");

const noContextDecision = resolveScreeningExportDecision({
  job: { ...job, screeningAnalysis: undefined },
  cv,
  evaluation: readyEvaluation
});
assert.equal(noContextDecision.status, "decision-context-required", "missing decision context must be an explicit domain blocker");

const timestampOnlyDecision = resolveScreeningExportDecision({ job, cv: { ...cv, updatedAt: "2026-07-14T00:00:00.000Z" }, evaluation: readyEvaluation });
assert.equal(timestampOnlyDecision.contentHash, readyDecision.contentHash, "timestamp-only changes must not alter export content identity");
const changedContentDecision = resolveScreeningExportDecision({ job, cv: { ...cv, summary: `${cv.summary} Changed` }, evaluation: readyEvaluation });
assert.notEqual(changedContentDecision.contentHash, readyDecision.contentHash, "genuine CV content changes must alter export content identity");

const workflowInput = {
  careerEvidenceReady: true,
  analysisReady: true,
  terminologyReady: true,
  briefReady: true,
  hasCv: true,
  cvRunActive: false,
  gateIssueCount: 0,
  reviewerIssueCount: readyDecision.blockers.length,
  reviewerReady: readyDecision.ready,
  reviewSnapshotValid: true,
  cvVersionCount: 1,
  run: { status: "completed", mode: "generate", applied: true }
};
assert.equal(deriveScreeningWorkflowState(workflowInput).recommendedView, "reviewer", "completed upstream steps must remain completed");
assert.equal(resolvePrimaryWorkflowCta({ ...workflowInput, hasSafeLocalRepair: false, hasAiRepair: false, exportReady: readyDecision.ready }).label, "Export Final CV", "domain export decision must make final export CTA reachable");
assert.equal(resolvePrimaryWorkflowCta({ ...workflowInput, reviewerIssueCount: blockedDecision.blockers.length, reviewerReady: false, hasSafeLocalRepair: false, hasAiRepair: false, exportReady: blockedDecision.ready }).label, "Resolve blocker", "blocked export decision must not produce a competing CTA");

const screeningLabSource = await readFile("src/components/tabs/ScreeningLab.tsx", "utf8");
const exportPageSource = await readFile("src/components/tabs/Export.tsx", "utf8");
assert.match(screeningLabSource, /resolveScreeningExportDecision/, "ScreeningLab must consume the domain export decision");
assert.match(exportPageSource, /resolveScreeningExportDecision/, "ExportPage must consume the domain export decision");
assert.doesNotMatch(exportPageSource, /const canExport = Boolean\([^\n]*qualityReady/, "ExportPage must not use UI quality diagnostics as the export action authority");

console.log(JSON.stringify({ ok: true, checked: [
  "one authoritative workflow/export decision input",
  "one authoritative primary CTA result",
  "UI consumers use domain export decision",
  "completed state remains completed",
  "genuine content changes alter identity while timestamp-only changes do not",
  "legacy fit and current Screening Analysis decision contexts remain valid",
  "warnings remain non-blocking",
  "final export CTA remains reachable",
  "no duplicate primary CTA is selected"
] }, null, 2));
