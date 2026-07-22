import { strict as assert } from "node:assert";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build } from "esbuild";

async function bundle(entry, name, external = []) {
  const outfile = join(process.cwd(), "reports", ".smoke-bundles", `${name}-${Date.now()}.mjs`);
  await build({ entryPoints: [entry], bundle: true, format: "esm", platform: "node", external, outfile, logLevel: "silent" });
  return import(pathToFileURL(outfile).href);
}

const { ExportDecisionPanel } = await bundle("src/components/tabs/screeningReviewRepairPanels.tsx", "repair-workflow-panel", ["react", "react-dom", "react-dom/server"]);
const { recordSummaryRepairReview, resolveReviewFreshness } = await bundle("src/domain/reviewFreshness.ts", "repair-review-record");
const { orchestrateRepair } = await bundle("src/domain/repairOrchestrator.ts", "repair-workflow-orchestrator");
const { reviewSnapshotContentHash } = await bundle("src/domain/screeningReview.ts", "repair-workflow-hash");

const cvShape = (summary) => ({ header: { name: "Alex Chen", targetRole: "Automation Specialist", email: "", location: "Taipei" }, sidebar: { languages: [], skillGroups: [], certifications: [], education: [] }, summary, workExperience: [], keywordPlacementNotes: [], interviewNotes: [], reviewNotes: [] });
function version(id, summary, reviewRunId) {
  const tailoredCv = cvShape(summary);
  const base = { id, jdId: "job-1", name: "CV", summary, content: JSON.stringify(tailoredCv), tailoredCv, status: "Ready for Review", updatedAt: `2026-07-16T00:0${id === "cv-a" ? "0" : "2"}:00.000Z` };
  const hash = reviewSnapshotContentHash(base);
  const freshnessSeed = resolveReviewFreshness({ ...base, reviewSnapshot: { snapshotId: reviewRunId, contentHash: hash, cvUpdatedAt: base.updatedAt, completedAt: base.updatedAt, gateIssueCount: 0, reviewerIssueCount: 1, ready: false } });
  return { ...base, reviewSnapshot: { snapshotId: reviewRunId, reviewRunId, updatedAt: base.updatedAt, contentHash: hash, reviewedCvVersionId: id, reviewedCvContentHash: hash, reviewedSummaryHash: freshnessSeed.currentSummaryHash, freshnessStatus: "fresh", cvUpdatedAt: base.updatedAt, completedAt: base.updatedAt, gateIssueCount: 0, reviewerIssueCount: 1, ready: false } };
}

function display(snapshot) {
  return {
    targetZone: snapshot.repairTargetZone,
    outcome: snapshot.repairOutcome,
    previousValue: snapshot.repairPreviousValue,
    updatedValue: snapshot.repairUpdatedValue,
    reviewerReason: snapshot.repairReviewerReason,
    failedCriteria: snapshot.repairFailedCriteria,
    reviewRunId: snapshot.reviewRunId,
    reviewedAt: snapshot.updatedAt,
    reviewedCvVersionId: snapshot.reviewedCvVersionId,
    reviewedCvContentHash: snapshot.reviewedCvContentHash,
    reviewedSummaryHash: snapshot.reviewedSummaryHash,
    blockerId: snapshot.repairBlockerId
  };
}

const before = version("cv-a", "General automation professional.", "review-a");
const after = version("cv-b", "Automation specialist translating evidence into enterprise adoption outcomes.", "review-b");
const blocker = "Reviewer: hiring manager relevance: Would interview: No · 2 rewrite item(s)";
after.reviewSnapshot = recordSummaryRepairReview({ previousCv: before, nextCv: after, summaryBlocker: blocker, reviewerReason: "The Summary still lacks a role-specific customer outcome.", failedCriteria: ["Role fit: customer outcome is not explicit"] });
const restored = JSON.parse(JSON.stringify(after));
assert.equal(restored.reviewSnapshot.repairOutcome, "still-failed", "repair review must survive persistence round-trip");
assert.equal(restored.reviewSnapshot.repairUpdatedValue, after.tailoredCv.summary);

const orchestration = orchestrateRepair({ cvVersionId: after.id, cvContentHash: after.reviewSnapshot.contentHash, blockers: [blocker, "Contact email: Missing email"], cv: after.tailoredCv, selectedEvidenceIds: ["evi-1"], effectiveCvBriefHash: "brief" });
const freshHtml = renderToStaticMarkup(React.createElement(ExportDecisionPanel, {
  decision: { ready: false, blockers: [blocker, "Contact email: Missing email"], warnings: [], contentHash: after.reviewSnapshot.contentHash },
  cv: after.tailoredCv,
  repairOrchestration: orchestration,
  repairReview: display(restored.reviewSnapshot),
  reviewFreshness: resolveReviewFreshness(restored),
  onExport: () => {}, onJumpToFix: () => {}, onRunTargetedRegeneration: () => {}
}));
assert.match(freshHtml, /Repair Workflow/);
assert.match(freshHtml, /Summary still needs clearer role fit/);
assert.match(freshHtml, /Summary updated/);
assert.match(freshHtml, /Needs attention: The Summary still lacks a role-specific customer outcome/);
assert.match(freshHtml, /General automation professional/);
assert.match(freshHtml, /Automation specialist translating evidence/);
assert.match(freshHtml, /repair-orchestrator-cta[^>]*>Edit Summary Manually</, "manual edit must be the single next action after genuine re-failure");
assert.doesNotMatch(freshHtml, />Generate Another Summary</);

const passed = version("cv-c", "Automation specialist with role-specific customer outcomes.", "review-c");
passed.reviewSnapshot = recordSummaryRepairReview({ previousCv: before, nextCv: passed });
const progressedHtml = renderToStaticMarkup(React.createElement(ExportDecisionPanel, {
  decision: { ready: false, blockers: ["Contact email: Missing email"], warnings: [], contentHash: passed.reviewSnapshot.contentHash },
  cv: passed.tailoredCv,
  repairOrchestration: orchestrateRepair({ cvVersionId: passed.id, cvContentHash: passed.reviewSnapshot.contentHash, blockers: ["Contact email: Missing email"], cv: passed.tailoredCv }),
  repairReview: display(JSON.parse(JSON.stringify(passed)).reviewSnapshot),
  reviewFreshness: resolveReviewFreshness(passed),
  onExport: () => {}, onJumpToFix: () => {}
}));
assert.match(progressedHtml, /Summary role fit resolved/);
assert.match(progressedHtml, /Review<\/dt><dd>Passed/);
assert.match(progressedHtml, /Missing Email|Missing email/);
assert.doesNotMatch(progressedHtml, /Summary needs clearer role fit/);

console.log(JSON.stringify({ ok: true, checked: ["persisted repair review", "refresh round-trip", "single workflow", "genuine re-failure", "pass progression"] }, null, 2));
