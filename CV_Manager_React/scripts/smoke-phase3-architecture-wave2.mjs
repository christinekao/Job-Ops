import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build } from "esbuild";

const bundledModule = join(tmpdir(), `phase3-architecture-wave2-${Date.now()}.mjs`);
await build({
  entryPoints: ["src/components/tabs/screeningReviewRepairPanels.tsx"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: bundledModule,
  logLevel: "silent"
});

const {
  ExportDecisionPanel,
  PrimaryCTA,
  RepairPlanPanel,
  RepairResultPanel,
  ReviewSummaryPanel
} = await import(pathToFileURL(bundledModule).href);

const reviewHtml = renderToStaticMarkup(React.createElement(ReviewSummaryPanel, {
  groups: [
    { title: "PASS", tone: "pass", checks: [{ label: "Reviewer proof", value: "Passed from props" }] },
    { title: "WARNING", tone: "warning", checks: [{ label: "Fit risk", value: "Warning from props" }] },
    { title: "BLOCKING", tone: "blocking", checks: [{ label: "Export blocker", value: "Blocked from props" }] }
  ]
}));
assert.match(reviewHtml, /Reviewer proof/, "ReviewSummaryPanel must render supplied pass checks");
assert.match(reviewHtml, /Fit risk/, "ReviewSummaryPanel must render supplied warning checks");
assert.match(reviewHtml, /Export blocker/, "ReviewSummaryPanel must render supplied blocking checks");

const repairPlanHtml = renderToStaticMarkup(React.createElement(RepairPlanPanel, {
  items: [{
    label: "Reviewer wording",
    targetZones: ["workExperience"],
    reason: "Reason from props",
    safety: "Safe local repair",
    impact: "Impact from props"
  }]
}));
assert.match(repairPlanHtml, /Reviewer wording/, "RepairPlanPanel must render supplied repair item");
assert.match(repairPlanHtml, /workExperience/, "RepairPlanPanel must render supplied target zones");
assert.match(repairPlanHtml, /Safe local repair/, "RepairPlanPanel must render supplied safety classification");

const repairResultHtml = renderToStaticMarkup(React.createElement(RepairResultPanel, {
  result: {
    summary: "Repair result from props",
    changedSections: ["workExperience"],
    unchangedSections: ["summary"],
    contentHash: "hash-from-props",
    remainingBlockers: ["Remaining blocker from props"]
  }
}));
assert.match(repairResultHtml, /Repair result from props/, "RepairResultPanel must render supplied result");
assert.match(repairResultHtml, /hash-from-props/, "RepairResultPanel must render supplied CV hash");
assert.match(repairResultHtml, /Remaining blocker from props/, "RepairResultPanel must render supplied blockers");

const primaryCtaHtml = renderToStaticMarkup(React.createElement(PrimaryCTA, {
  action: { label: "Apply Safe Fix", reason: "Next action from props" },
  onClick: () => {}
}));
assert.match(primaryCtaHtml, /Apply Safe Fix/, "PrimaryCTA must render the supplied label");
assert.match(primaryCtaHtml, /Next action from props/, "PrimaryCTA must render the supplied reason");
assert.equal((primaryCtaHtml.match(/class="primary"/g) || []).length, 1, "PrimaryCTA must render exactly one primary button");

const exportReadyHtml = renderToStaticMarkup(React.createElement(ExportDecisionPanel, {
  decision: { ready: true, blockers: [], warnings: ["Warning from props"], contentHash: "export-hash" },
  onExport: () => {}
}));
assert.match(exportReadyHtml, /Ready for export workflow/, "ExportDecisionPanel must render supplied ready decision");
assert.match(exportReadyHtml, /Warning from props/, "ExportDecisionPanel must render supplied warnings");
assert.equal((exportReadyHtml.match(/Open Export \/ Apply/g) || []).length, 1, "ready ExportDecisionPanel must render one export action");

const exportBlockedHtml = renderToStaticMarkup(React.createElement(ExportDecisionPanel, {
  decision: { ready: false, blockers: ["Blocker from props"], warnings: [], contentHash: "blocked-hash" },
  onExport: () => {}
}));
assert.match(exportBlockedHtml, /Still needs attention/, "ExportDecisionPanel must render supplied blocked decision");
assert.match(exportBlockedHtml, /Blocker from props/, "ExportDecisionPanel must render supplied blockers");
assert.doesNotMatch(exportBlockedHtml, /Open Export \/ Apply/, "blocked ExportDecisionPanel must not render export action");

const panelSource = await readFile("src/components/tabs/screeningReviewRepairPanels.tsx", "utf8");
for (const pattern of [
  /from\s+["']\.\.\/\.\.\/domain\//,
  /deriveScreeningWorkflowState/,
  /resolvePrimaryWorkflowCta/,
  /resolveScreeningExportDecision/,
  /screeningGate/,
  /reviewerPass/,
  /exportVerification/,
  /createRepairPlan/,
  /localRepairPlan/,
  /buildLocalReviewerContentFix/
]) {
  assert.doesNotMatch(panelSource, pattern, "presentation panels must not import or invoke domain logic");
}

const screeningLabSource = await readFile("src/components/tabs/ScreeningLab.tsx", "utf8");
assert.match(screeningLabSource, /<ReviewSummaryPanel/, "ScreeningLab must compose ReviewSummaryPanel");
assert.match(screeningLabSource, /<RepairPlanPanel/, "ScreeningLab must compose RepairPlanPanel");
assert.match(screeningLabSource, /<RepairResultPanel/, "ScreeningLab must compose RepairResultPanel");
assert.match(screeningLabSource, /<PrimaryCTA/, "ScreeningLab must compose PrimaryCTA");
assert.match(screeningLabSource, /<ExportDecisionPanel/, "ScreeningLab must compose ExportDecisionPanel");
assert.doesNotMatch(screeningLabSource, /ReviewerBlockerTriage/, "ScreeningLab must not render the mixed reviewer triage component");

console.log(JSON.stringify({
  ok: true,
  coverage: [
    "ReviewSummary renders from props only",
    "RepairPlan renders from props only",
    "RepairResult renders from props only",
    "PrimaryCTA renders supplied next action",
    "ExportDecisionPanel renders supplied decision",
    "presentation panels do not import domain logic",
    "ScreeningLab composes extracted presentation panels"
  ]
}, null, 2));
