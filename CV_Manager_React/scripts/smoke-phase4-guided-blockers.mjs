import { strict as assert } from "node:assert";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build } from "esbuild";
import { mkdir, readFile } from "node:fs/promises";

const bundleDir = join(process.cwd(), "reports", ".smoke-bundles");
await mkdir(bundleDir, { recursive: true });
const bundledModule = join(bundleDir, `phase4-guided-blockers-${Date.now()}.mjs`);
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
  BlockerCard,
  BlockerChecklist,
  ExportDecisionPanel,
  RepairProgress,
  ReviewSummaryPanel
} = await import(pathToFileURL(bundledModule).href);

const progressHtml = renderToStaticMarkup(React.createElement(RepairProgress, {
  completedCount: 2,
  remainingCount: 3,
  estimatedSeconds: 240
}));
assert.match(progressHtml, /Repair Progress/, "repair progress must show the current progress state");
assert.match(progressHtml, /3 remaining items/, "repair progress must show remaining count");
assert.match(progressHtml, /Progress: 2 \/ 5/, "repair progress must update completed and total counts");
assert.match(progressHtml, /Estimated: 4 minutes/, "repair progress must show estimated effort");

let jumpedTo = "";
const blockerHtml = renderToStaticMarkup(React.createElement(BlockerCard, {
  blocker: {
    id: "contact",
    title: "Missing Email",
    explanation: "The CV header needs an email before export.",
    location: "Header",
    targetSection: "Header",
    difficulty: "Easy",
    estimatedSeconds: 30,
    advancedDetail: "Contact extraction: Missing email",
    expectedOutcome: "Required contact details are present before export.",
    affectedField: "Header email",
    actionLabel: "Preview AI Repair",
    target: {
      blockerId: "contact",
      section: "contact",
      fieldId: "email",
      focusKey: "guided-contact-email",
      highlightKey: "guided-contact-email"
    }
  },
  onJumpToFix: (blocker) => {
    jumpedTo = blocker.id;
  }
}));
assert.match(blockerHtml, /Missing Email/, "blocker card must render a human-readable title");
assert.match(blockerHtml, /Location/, "blocker card must render location");
assert.match(blockerHtml, /Target section/, "blocker card must render target section");
assert.match(blockerHtml, /Easy/, "blocker card must render difficulty");
assert.match(blockerHtml, /30 seconds/, "blocker card must render estimated effort");
assert.match(blockerHtml, /Preview AI Repair/, "blocker card must render the proposal preview action");
assert.equal(jumpedTo, "", "server render must not execute the preview callback");

const checklistHtml = renderToStaticMarkup(React.createElement(BlockerChecklist, {
  blockers: [
    "Hiring manager relevance: Summary does not answer the manager job-to-be-done",
    "Weak claims: Two achievements need stronger supporting evidence",
    "Contact extraction: Missing name, email, or location"
  ],
  completedCount: 1,
  onJumpToFix: () => {}
}));
assert.match(checklistHtml, /3 remaining items/, "checklist must render the current remaining blocker count");
assert.match(checklistHtml, /Progress: 1 \/ 4/, "checklist progress must combine completed and remaining blockers");
assert.match(checklistHtml, /Summary needs clearer role fit/, "manager blocker must become user-facing task language");
assert.match(checklistHtml, /Achievements need stronger support/, "weak-claims blocker must become user-facing task language");
assert.match(checklistHtml, /Missing email/, "contact blocker must become user-facing task language");
assert.match(checklistHtml, /Next/, "first unresolved blocker must be marked as the next item");
assert.match(checklistHtml, /Pending/, "later unresolved blockers must be marked pending");
assert.match(checklistHtml, /Advanced Details/, "raw reviewer terminology must be available only behind advanced details");

const primaryChecklistText = checklistHtml.replace(/<details[\s\S]*?<\/details>/g, "");
assert.doesNotMatch(primaryChecklistText, /Hiring manager relevance|Weak claims|Contact extraction/, "reviewer terminology must be hidden from primary blocker UI");

const reviewHtml = renderToStaticMarkup(React.createElement(ReviewSummaryPanel, {
  groups: [{
    title: "BLOCKING",
    tone: "blocking",
    checks: [
      { label: "Hiring manager relevance", value: "Summary needs clearer fit" },
      { label: "Contact extraction", value: "Missing email" }
    ]
  }]
}));
assert.match(reviewHtml, /Role fit/, "review summary must present reviewer labels in user-facing language");
assert.match(reviewHtml, /Contact info/, "review summary must hide raw contact extraction terminology");
assert.doesNotMatch(reviewHtml.replace(/<details[\s\S]*?<\/details>/g, ""), /Hiring manager relevance|Contact extraction/, "review summary primary text must not leak reviewer terminology");
assert.match(reviewHtml, /Advanced Details/, "review summary must keep diagnostics available in advanced details");

const exportBlockedHtml = renderToStaticMarkup(React.createElement(ExportDecisionPanel, {
  decision: {
    ready: false,
    blockers: ["External wording: Internal terminology remains visible"],
    warnings: [],
    contentHash: "hash-guided"
  },
  onExport: () => {},
  onJumpToFix: () => {}
}));
assert.match(exportBlockedHtml, /Needs Attention/, "blocked export panel must show one clear overall status");
assert.match(exportBlockedHtml, /Repair Workflow/, "blocked export panel must present a single repair workflow");
for (const stage of ["Issue", "Fix", "Review", "Next"]) assert.match(exportBlockedHtml, new RegExp(`<dt>${stage}<`), `workflow must show ${stage}`);
assert.match(exportBlockedHtml, /Readiness and Export/, "export status must be shown once");
assert.match(exportBlockedHtml, /Wording needs to be clearer for recruiters/, "export blockers must render as guided cards");
assert.doesNotMatch(exportBlockedHtml.replace(/<details[\s\S]*?<\/details>/g, ""), /External wording/, "raw reviewer term must not be primary export UI");
assert.doesNotMatch(exportBlockedHtml, /Export CV/, "blocked export panel must not render export action");

const panelSource = await readFile("src/components/tabs/screeningReviewRepairPanels.tsx", "utf8");
for (const pattern of [
  /from\s+["']\.\.\/\.\.\/domain\//,
  /resolveScreeningExportDecision/,
  /reviewerPass/,
  /exportVerification/,
  /createRepairPlan/,
  /buildLocalReviewerContentFix/
]) {
  assert.doesNotMatch(panelSource, pattern, "guided blocker presentation must not import or invoke domain logic");
}

console.log(JSON.stringify({
  ok: true,
  coverage: [
    "blocker checklist renders",
    "human-readable blocker titles appear",
    "remaining blocker count updates",
    "progress updates correctly",
    "reviewer terminology is hidden from primary UI",
    "proposal preview CTA renders without changing workflow",
    "first unresolved blocker renders as Your Next Step",
    "presentation layer does not import domain logic"
  ]
}, null, 2));
