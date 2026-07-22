import { strict as assert } from "node:assert";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build } from "esbuild";

const bundleDir = join(process.cwd(), "reports", ".smoke-bundles");
await mkdir(bundleDir, { recursive: true });
const bundledModule = join(bundleDir, `phase4-ai-explainability-${Date.now()}.mjs`);
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
  AIExplanationCard,
  RepairResultPanel,
  ReviewSummaryPanel
} = await import(pathToFileURL(bundledModule).href);

const directCardHtml = renderToStaticMarkup(React.createElement(AIExplanationCard, {
  explanation: {
    title: "AI updated",
    changedItems: ["Summary", "Current Position", "Bullet 2", "Contact Email"],
    unchangedItems: ["Career Position"],
    reason: "Requires your confirmation because this changes your positioning.",
    nextRecommendation: "Review Changes",
    advancedDetails: ["Reviewer: weak claims controlled: diagnostic detail"]
  }
}));
assert.match(directCardHtml, /What changed/, "AIExplanationCard must label changed items");
assert.match(directCardHtml, /Summary/, "AIExplanationCard must list changed items");
assert.match(directCardHtml, /What did not change/, "AIExplanationCard must label unchanged items");
assert.match(directCardHtml, /Career Position/, "AIExplanationCard must list unchanged items");
assert.match(directCardHtml, /Why/, "AIExplanationCard must explain reason");
assert.match(directCardHtml, /Next step/, "AIExplanationCard must show one next recommendation");
assert.equal((directCardHtml.match(/Review Changes/g) || []).length, 1, "completed operation must produce exactly one recommendation");
assert.match(directCardHtml, /Advanced Details/, "diagnostics must remain available in advanced details");

const repairHtml = renderToStaticMarkup(React.createElement(RepairResultPanel, {
  result: {
    summary: "Repair completed",
    actionId: "apply-safe-repair",
    status: "success",
    timestamp: "2026-07-13T12:00:00.000Z",
    changedSections: ["Summary", "Bullet 2"],
    unchangedSections: ["Career Position", "Evidence Selection"],
    contentHash: "hash",
    remainingBlockers: []
  }
}));
assert.match(repairHtml, /AI updated/, "repair result must replace generic completion with an AI explanation");
assert.match(repairHtml, /Summary/, "repair result must list changed items");
assert.match(repairHtml, /Career Position/, "repair result must list unchanged items");
assert.match(repairHtml, /Ready to Export/, "repair result must show final next recommendation when blockers are clear");
assert.match(repairHtml, /Action: apply-safe-repair/, "advanced details must keep raw action diagnostics");

const blockedRepairHtml = renderToStaticMarkup(React.createElement(RepairResultPanel, {
  result: {
    summary: "This action already completed for the current CV content.",
    actionId: "apply-safe-repair",
    status: "blocked",
    changedSections: [],
    unchangedSections: [],
    remainingBlockers: ["Reviewer: weak claims controlled: 1 weak mapping(s)"]
  }
}));
assert.match(blockedRepairHtml, /AI did not update the CV/, "blocked result must explain that AI did not change content");
assert.match(blockedRepairHtml, /Existing CV content/, "blocked result must list unchanged content");
assert.match(blockedRepairHtml, /Continue Editing/, "blocked result must provide one next recommendation");

const reviewHtml = renderToStaticMarkup(React.createElement(ReviewSummaryPanel, {
  groups: [{
    title: "BLOCKING",
    tone: "blocking",
    checks: [
      { label: "Reviewer: weak claims controlled", value: "2 weak mapping(s)" },
      { label: "Reviewer: hiring manager relevance", value: "Would interview: Maybe" },
      { label: "Reviewer: external wording", value: "1 work-log bullet(s)" }
    ]
  }]
}));
const primaryReviewHtml = reviewHtml.replace(/<details[\s\S]*?<\/details>/g, "");
assert.match(primaryReviewHtml, /Some achievements need stronger evidence before they should appear on your CV/, "weak claims must be user-facing in primary UI");
assert.match(primaryReviewHtml, /Your summary does not yet explain why you are a strong fit for this role/, "hiring manager relevance must be user-facing in primary UI");
assert.match(primaryReviewHtml, /Some sentences still use internal company terminology/, "external wording must be user-facing in primary UI");
assert.doesNotMatch(primaryReviewHtml, /Weak Claims|weak claims|Hiring Manager Relevance|hiring manager relevance|External Wording|external wording/, "reviewer terminology must not appear in primary review UI");
assert.match(reviewHtml, /Advanced Details/, "raw validation must remain available in advanced details");
assert.match(reviewHtml, /Reviewer: weak claims controlled/, "advanced details must retain raw reviewer diagnostics");

const panelSource = await readFile("src/components/tabs/screeningReviewRepairPanels.tsx", "utf8");
assert.doesNotMatch(panelSource, /from\s+["']\.\.\/\.\.\/domain\//, "AI explainability presentation must not import domain logic");
assert.doesNotMatch(panelSource, /resolveScreeningExportDecision|reviewerPass|exportVerification|createRepairPlan|buildLocalReviewerContentFix/, "AI explainability must not invoke reviewer repair or export logic");

console.log(JSON.stringify({
  ok: true,
  coverage: [
    "AI explanation lists changed items",
    "AI explanation lists unchanged items",
    "AI explanation explains why",
    "AI explanation provides exactly one next recommendation",
    "reviewer terminology is hidden from primary review UI",
    "advanced details retain raw diagnostics",
    "presentation layer does not import domain logic"
  ]
}, null, 2));
