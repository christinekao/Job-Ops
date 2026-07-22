import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { strict as assert } from "node:assert";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

async function bundle(entry, name) {
  const outfile = join(process.cwd(), "reports", ".smoke-bundles", `${name}-${Date.now()}.mjs`);
  await build({ entryPoints: [entry], bundle: true, format: "esm", platform: "node", outfile, logLevel: "silent", external: ["react", "react-dom", "react-dom/server"] });
  return import(pathToFileURL(outfile).href);
}

const { ExportDecisionPanel } = await bundle("src/components/tabs/screeningReviewRepairPanels.tsx", "summary-repair-convergence-panel");

const previousSummaryReview = {
  reviewRunId: "review-before",
  reviewedCvHash: "hash-before",
  positioningMode: "adjacent-fit",
  overallStatus: "needs-improvement",
  criteria: [
    { criterionId: "summary-relevant-capability", status: "fail", reason: "Supported capability is missing.", evidenceIds: ["ev-1"], fixability: "summary-rewrite" },
    { criterionId: "summary-career-positioning", status: "partial", reason: "Direct Azure sales ownership is not supported.", evidenceIds: ["ev-1"], fixability: "fit-risk-only" }
  ],
  unsupportedCoreRequirements: ["quota-carrying Azure sales"],
  summaryRewriteNeeded: true,
  fitRiskOnly: false
};

const updatedSummaryReview = {
  ...previousSummaryReview,
  reviewRunId: "review-after",
  reviewedCvHash: "hash-after",
  overallStatus: "pass",
  criteria: [
    { criterionId: "summary-relevant-capability", status: "pass", reason: "Supported capability is now visible.", evidenceIds: ["ev-1"], fixability: "summary-rewrite" },
    { criterionId: "summary-career-positioning", status: "partial", reason: "Direct Azure sales ownership remains a fit risk, not a Summary-writing blocker.", evidenceIds: ["ev-1"], fixability: "fit-risk-only" }
  ],
  summaryRewriteNeeded: false,
  fitRiskOnly: true
};

const html = renderToStaticMarkup(React.createElement(ExportDecisionPanel, {
  decision: { ready: false, blockers: ["Contact email: Missing email"], warnings: ["Reviewer: application fit risk: 1 unsupported mapping tracked as fit risk"], contentHash: "hash-after" },
  onExport: () => {},
  repairReview: {
    targetZone: "summary",
    outcome: "passed",
    previousValue: "Customer operator seeking work.",
    updatedValue: "Microsoft ecosystem solution-enablement professional translating operations, analytics, and workflow needs into supported adoption and governance improvements.",
    reviewRunId: "review-after",
    reviewedAt: "2026-07-16T00:00:00.000Z",
    reviewedCvVersionId: "cv-after",
    reviewedCvContentHash: "hash-after",
    reviewedSummaryHash: "summary-after",
    reviewerReason: "Summary quality passed; remaining concern is application-fit risk.",
    failedCriteria: [],
    previousSummaryReview,
    updatedSummaryReview
  }
}));

assert.match(html, /Summary quality passed; remaining concern is role-fit risk/, "fit-risk-only result must not look like another Summary rewrite blocker");
assert.match(html, /summary-relevant-capability: fail -&gt; pass/, "criterion-level before/after result must render");
assert.match(html, /Positioning mode/, "advanced details must retain positioning mode");
assert.doesNotMatch(html, /Summary still needs clearer role fit/, "post-repair UI must not repeat the vague Summary blocker");
assert.doesNotMatch(html, /Regenerate Summary with AI/, "fit-risk-only result must not recommend another Summary regeneration");

console.log(JSON.stringify({
  ok: true,
  checked: [
    "criterion-level before/after results render",
    "fit-risk-only does not trigger another Summary rewrite",
    "vague Summary blocker is not repeated"
  ]
}, null, 2));
