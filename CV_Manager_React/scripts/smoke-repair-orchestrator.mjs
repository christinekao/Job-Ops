import { strict as assert } from "node:assert";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build } from "esbuild";
import { mkdir, readFile } from "node:fs/promises";

const orchestratorModule = join(tmpdir(), `repair-orchestrator-${Date.now()}.mjs`);
await build({
  entryPoints: ["src/domain/repairOrchestrator.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: orchestratorModule,
  logLevel: "silent"
});

const bundleDir = join(process.cwd(), "reports", ".smoke-bundles");
await mkdir(bundleDir, { recursive: true });
const panelModule = join(bundleDir, `repair-orchestration-panel-${Date.now()}.mjs`);
await build({
  entryPoints: ["src/components/tabs/RepairOrchestrationPanel.tsx"],
  bundle: true,
  format: "esm",
  platform: "node",
  external: ["react", "react-dom", "react-dom/server"],
  outfile: panelModule,
  logLevel: "silent"
});

const panelsModule = join(bundleDir, `repair-orchestration-export-panel-${Date.now()}.mjs`);
await build({
  entryPoints: ["src/components/tabs/screeningReviewRepairPanels.tsx"],
  bundle: true,
  format: "esm",
  platform: "node",
  external: ["react", "react-dom", "react-dom/server"],
  outfile: panelsModule,
  logLevel: "silent"
});

const {
  classifyRepairBlocker,
  orchestrateRepair,
  isRepairClassificationStale,
  isRepairOrchestrationSummaryStale
} = await import(pathToFileURL(orchestratorModule).href);
const { RepairOrchestrationPanel } = await import(pathToFileURL(panelModule).href);
const { ExportDecisionPanel } = await import(pathToFileURL(panelsModule).href);

const cv = {
  header: { name: "Candidate", targetRole: "Automation Specialist", email: "", location: "Taipei" },
  sidebar: { languages: [], skillGroups: [], certifications: [], education: [] },
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
        { text: "Helped automation.", confidence: "Weak", evidenceIds: ["ev-1"] },
        { text: "Work-log: joined internal sync and tracked tickets.", confidence: "Needs Review", evidenceIds: [] }
      ]
    }]
  }],
  keywordPlacementNotes: [],
  interviewNotes: [],
  reviewNotes: []
};

const baseInput = {
  cvVersionId: "cv-v1",
  cvContentHash: "hash-v1",
  blockers: [],
  cv,
  trustedProfileEmail: "candidate@example.com",
  selectedEvidenceIds: ["ev-1"]
};

function routeFor(blocker, extra = {}) {
  return classifyRepairBlocker({ ...baseInput, ...extra }, blocker, 0).route;
}

assert.equal(routeFor("Summary duplicate wording: repeated summary sentence"), "safe-auto", "duplicate wording must be safe-auto");
assert.equal(routeFor("Contact extraction: Missing email"), "safe-auto", "trusted missing email must be safe-auto");
assert.equal(routeFor("Reviewer: hiring manager relevance: Summary does not answer the manager job-to-be-done"), "targeted-regeneration", "summary rewrite must use targeted regeneration");
assert.equal(routeFor("Weak claims: first work bullet lacks concrete action and result"), "approval-required", "work-bullet rewrite must require approval");
assert.equal(routeFor("Career positioning: choose between product manager and solution specialist identity"), "human-decision", "career positioning must be human-decision");
assert.notEqual(routeFor("Reviewer: evidence traceability: missing evidence ID"), "safe-auto", "missing evidence must never be safe-auto");
assert.equal(routeFor("PDF export readiness: Composed CV content is missing or too short"), "unsupported", "missing target must be unsupported");
assert.equal(routeFor("Unsupported experience: claims MLOps ownership without evidence"), "human-decision", "unsupported experience must require human decision");

const summary = orchestrateRepair({
  ...baseInput,
  blockers: [
    "Summary duplicate wording: repeated summary sentence",
    "Contact extraction: Missing email",
    "Reviewer: hiring manager relevance: Summary does not answer the manager job-to-be-done",
    "Weak claims: first work bullet lacks concrete action and result",
    "Career positioning: choose between product manager and solution specialist identity",
    "PDF export readiness: Composed CV content is missing or too short"
  ]
});
assert.equal(summary.totalBlockers, 6, "all blockers must be classified");
assert.equal(summary.safeAuto.length, 2, "safe-auto count must include duplicate and trusted missing email");
assert.equal(summary.approvalRequired.length, 1, "approval-required count must include exact bullet rewrites");
assert.equal(summary.targetedRegeneration.length, 1, "targeted-regeneration count must include summary rewrites");
assert.equal(summary.humanDecision.length, 1, "human-decision count must include positioning");
assert.equal(summary.unsupported.length, 1, "unsupported count must include missing target");
assert.equal(summary.recommendedNextRoute, "run-safe-repair", "safe-auto should be the single recommended next route");
for (const item of [...summary.safeAuto, ...summary.approvalRequired, ...summary.targetedRegeneration, ...summary.humanDecision, ...summary.unsupported]) {
  assert.equal(item.cvVersionId, "cv-v1", "classification must include CV version");
  assert.equal(item.cvContentHash, "hash-v1", "classification must include CV content hash");
  assert.ok(["safe-auto", "approval-required", "targeted-regeneration", "human-decision", "unsupported"].includes(item.route), "classification route must be one of the contract routes");
}

const approvalOnly = orchestrateRepair({
  ...baseInput,
  blockers: ["Weak claims: first work bullet lacks concrete action and result"]
});
assert.equal(approvalOnly.recommendedNextRoute, "review-ai-proposals", "approval-only summary must recommend reviewing proposals");
assert.equal(approvalOnly.approvalRequired[0].requiresUserApproval, true, "approval route must require user approval");
assert.equal(approvalOnly.approvalRequired[0].canRequestAiProposal, true, "approval route can request AI proposal");
assert.equal(approvalOnly.approvalRequired[0].canUseExistingLocalRepair, false, "approval route must not be treated as safe local repair");

assert.equal(isRepairClassificationStale(summary.safeAuto[0], { cvVersionId: "cv-v1", cvContentHash: "hash-v2" }), true, "changed content hash must make classification stale");
assert.equal(isRepairClassificationStale(summary.safeAuto[0], { cvVersionId: "cv-v1", cvContentHash: "hash-v1" }), false, "same hash and version must remain fresh even if timestamp-only metadata changes elsewhere");
assert.equal(isRepairOrchestrationSummaryStale(summary, { cvVersionId: "cv-v1", cvContentHash: "hash-v2" }), true, "changed content hash must stale the summary");

const panelHtml = renderToStaticMarkup(React.createElement(RepairOrchestrationPanel, {
  summary,
  nextActionDisabled: true
}));
const primaryPanelText = panelHtml.replace(/<details[\s\S]*?<\/details>/g, "");
assert.match(primaryPanelText, /AI can fix this safely/, "UI must show safe route in plain language");
assert.match(primaryPanelText, /AI can suggest a change/, "UI must show approval route in plain language");
assert.match(primaryPanelText, /AI can regenerate a section/, "UI must show targeted regeneration route in plain language");
assert.match(primaryPanelText, /Your decision is needed/, "UI must show human route in plain language");
assert.match(primaryPanelText, /No safe repair is available/, "UI must show unsupported route in plain language");
assert.match(primaryPanelText, /Fix 2 Items with AI/, "UI must show the one next action from orchestrator output");
assert.doesNotMatch(primaryPanelText, /safe-auto|approval-required|targeted-regeneration|human-decision|unsupported/, "raw route codes must not appear in primary UI");

const exportHtml = renderToStaticMarkup(React.createElement(ExportDecisionPanel, {
  decision: { ready: false, blockers: approvalOnly.approvalRequired.map((item) => item.reason), warnings: [], contentHash: "hash-v1" },
  cv,
  repairOrchestration: approvalOnly,
  proposalResolver: () => null,
  onExport: () => {},
  onJumpToFix: () => {}
}));
assert.match(exportHtml, /Repair Workflow/, "export panel must render the consolidated workflow");
assert.match(exportHtml, /Recommended route/, "orchestration result must remain available in Advanced Details");
assert.equal((exportHtml.match(/data-testid="repair-orchestrator-cta"/g) || []).length, 1, "UI must render one orchestrator CTA");

const orchestratorSource = await readFile("src/domain/repairOrchestrator.ts", "utf8");
const panelSource = await readFile("src/components/tabs/RepairOrchestrationPanel.tsx", "utf8");
const exportPanelSource = await readFile("src/components/tabs/screeningReviewRepairPanels.tsx", "utf8");
for (const source of [orchestratorSource, panelSource, exportPanelSource]) {
  assert.doesNotMatch(source, /startAutomation|buildScreeningCvPrompt|applyScreeningCvResult|saveCvVersion|resolveScreeningExportDecision\(/, "orchestrator wave must not execute repair, call AI, rerun review, or decide export readiness");
}

console.log(JSON.stringify({
  ok: true,
  coverage: [
    "every blocker receives exactly one route",
    "duplicate wording classified safe-auto",
    "trusted missing email classified safe-auto",
    "summary rewrite classified targeted-regeneration",
    "work-bullet rewrite classified approval-required",
    "career positioning classified human-decision",
    "missing evidence is never safe-auto",
    "missing target becomes unsupported",
    "classification includes CV version and content hash",
    "changed content hash makes classification stale",
    "timestamp-only changes do not make classification stale",
    "exactly one recommended next route is returned",
    "UI shows route counts in plain language",
    "UI shows one primary next action",
    "no repair execution, CV mutation, review rerun, export change, or hidden AI call"
  ]
}, null, 2));
