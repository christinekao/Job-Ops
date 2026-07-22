import { strict as assert } from "node:assert";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build } from "esbuild";

const bundleDir = join(process.cwd(), "reports", ".smoke-bundles");
await mkdir(bundleDir, { recursive: true });
const bundledModule = join(bundleDir, `phase4-decision-confidence-${Date.now()}.mjs`);
await build({
  entryPoints: ["src/components/tabs/screeningReviewRepairPanels.tsx"],
  bundle: true,
  format: "esm",
  platform: "node",
  external: ["react", "react-dom", "react-dom/server"],
  outfile: bundledModule,
  logLevel: "silent"
});

const {
  ConfidenceBadge,
  CVReadinessCard,
  DecisionSummaryCard,
  ExportDecisionPanel,
  RecommendationCard,
  WarningSummary
} = await import(pathToFileURL(bundledModule).href);

function stripAdvancedDetails(html) {
  return html.replace(/<details[\s\S]*?<\/details>/g, "");
}

const readinessHtml = renderToStaticMarkup(React.createElement(CVReadinessCard, {
  summary: {
    readinessLabel: "Ready to Export",
    confidence: "Medium",
    recommendation: "Review Optional Improvements",
    explanation: "Export is available because no blocking issues remain.",
    blockingIssues: [],
    warnings: ["Optional wording polish"],
    manualReviewItems: []
  }
}));
assert.match(readinessHtml, /CV Readiness/, "CV readiness summary must render");
assert.match(readinessHtml, /Ready to Export/, "readiness summary must show ready state");
assert.match(readinessHtml, /Blocking Issues/, "readiness summary must count blocking issues");
assert.match(readinessHtml, /Warnings/, "readiness summary must count warnings");
assert.match(readinessHtml, /Manual Review/, "readiness summary must count manual review items");
assert.match(readinessHtml, /Confidence: Medium/, "confidence badge must render supplied confidence");
assert.equal((readinessHtml.match(/Review Optional Improvements/g) || []).length, 1, "exactly one recommendation must display");
assert.match(readinessHtml, /Export is available because no blocking issues remain/, "ready export explanation must be explicit");

const decisionSummaryHtml = renderToStaticMarkup(React.createElement(DecisionSummaryCard, {
  summary: {
    readinessLabel: "Not Ready Yet",
    confidence: "Low",
    recommendation: "Resolve Blocking Issues",
    explanation: "Export is blocked because 2 blocking issues remain.",
    blockingIssues: ["Missing email", "Visible work depth"],
    warnings: ["Optional style warning"],
    manualReviewItems: ["Application fit risk"]
  }
}));
assert.match(decisionSummaryHtml, />2<\/dd>/, "blocking count must render");
assert.match(decisionSummaryHtml, />1<\/dd>/, "warning/manual counts must render");
assert.match(decisionSummaryHtml, /Confidence: Low/, "low confidence must render for blockers");

const badgeUnavailableHtml = renderToStaticMarkup(React.createElement(ConfidenceBadge, { level: "Not Available" }));
assert.match(badgeUnavailableHtml, /Confidence: Not Available/, "Not Available confidence must be supported");

const warningHtml = renderToStaticMarkup(React.createElement(WarningSummary, {
  warnings: ["Optional formatting improvement"],
  manualReviewItems: ["Reviewer: application fit risk: 1 unsupported mapping"]
}));
const primaryWarningHtml = stripAdvancedDetails(warningHtml);
assert.match(primaryWarningHtml, /Warnings/, "warnings must have a separate section");
assert.match(primaryWarningHtml, /Manual Review/, "manual review must have a separate section");
assert.match(primaryWarningHtml, /A fit-risk item should be reviewed before sending/, "manual review copy must be user-facing");
assert.doesNotMatch(primaryWarningHtml, /Reviewer: application fit risk|unsupported mapping/, "reviewer terminology must not be primary warning UI");
assert.match(warningHtml, /Advanced Details/, "raw warning diagnostics must remain available in advanced details");

const recommendationHtml = renderToStaticMarkup(React.createElement(RecommendationCard, {
  recommendation: "Ready to Export",
  explanation: "Export is available because no blocking issues remain."
}));
assert.equal((recommendationHtml.match(/Ready to Export/g) || []).length, 1, "RecommendationCard must render one recommendation label");

const readyPanelHtml = renderToStaticMarkup(React.createElement(ExportDecisionPanel, {
  decision: {
    ready: true,
    blockers: [],
    warnings: ["Reviewer: application fit risk: 1 unsupported mapping"],
    contentHash: "ready-hash"
  },
  onExport: () => {}
}));
const readyPrimaryHtml = stripAdvancedDetails(readyPanelHtml);
assert.match(readyPrimaryHtml, /Ready to Export/, "ready export panel must show ready state");
assert.match(readyPrimaryHtml, /Export is available because no blocking issues remain/, "ready panel must explain why export is available");
assert.match(readyPrimaryHtml, /Manual Review/, "manual review warning must remain visible");
assert.match(readyPrimaryHtml, /Export CV/, "ready panel must keep export action reachable");
assert.doesNotMatch(readyPrimaryHtml, /Reviewer: application fit risk|unsupported mapping/, "ready primary UI must hide reviewer terminology");

const blockedPanelHtml = renderToStaticMarkup(React.createElement(ExportDecisionPanel, {
  decision: {
    ready: false,
    blockers: [
      "Contact extraction: Missing email",
      "External wording: Internal terminology remains visible"
    ],
    warnings: ["Reviewer: application fit risk: 1 unsupported mapping"],
    contentHash: "blocked-hash"
  },
  onExport: () => {},
  onJumpToFix: () => {}
}));
const blockedPrimaryHtml = stripAdvancedDetails(blockedPanelHtml);
assert.match(blockedPrimaryHtml, /Needs Attention/, "blocked panel must show needs-attention state");
assert.match(blockedPrimaryHtml, /2 blocking items must be resolved before export/, "blocked panel must explain why export is blocked");
assert.match(blockedPrimaryHtml, /Repair Workflow/, "blocked panel must produce one repair workflow section");
assert.match(blockedPrimaryHtml, /Missing email/, "blocking issues must still render as guided blocker cards");
assert.match(blockedPrimaryHtml, /Warnings/, "warnings must remain separate from blockers");
assert.match(blockedPrimaryHtml, /Manual Review/, "manual review must remain separate from blockers");
assert.doesNotMatch(blockedPrimaryHtml, /Export CV/, "blocked panel must not show export action");
assert.doesNotMatch(blockedPrimaryHtml, /Contact extraction|External wording|Reviewer: application fit risk|unsupported mapping/, "blocked primary UI must hide reviewer terminology");

const unknownPanelHtml = renderToStaticMarkup(React.createElement(ExportDecisionPanel, {
  decision: {
    ready: false,
    blockers: [],
    warnings: []
  },
  onExport: () => {}
}));
assert.match(unknownPanelHtml, /Manual Review Needed/, "missing decision evidence must show manual-review-needed state");
assert.match(unknownPanelHtml, /Confidence: Not Available/, "missing decision evidence must retain Not Available confidence in advanced details");

const panelSource = await readFile("src/components/tabs/screeningReviewRepairPanels.tsx", "utf8");
for (const pattern of [
  /from\s+["']\.\.\/\.\.\/domain\//,
  /resolveScreeningExportDecision/,
  /reviewerPass/,
  /exportVerification/,
  /createRepairPlan/,
  /buildLocalReviewerContentFix/
]) {
  assert.doesNotMatch(panelSource, pattern, "decision confidence presentation must not import or invoke domain logic");
}

console.log(JSON.stringify({
  ok: true,
  coverage: [
    "CV Readiness summary renders",
    "Blocking Issues are separated from Warnings",
    "Manual Review items are shown separately",
    "only one recommendation is displayed",
    "export available explanation is correct",
    "export blocked explanation is correct",
    "one next step is displayed for blockers",
    "reviewer terminology is hidden from primary UI",
    "Not Available confidence is supported",
    "presentation layer does not import domain logic"
  ]
}, null, 2));
