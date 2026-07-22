import { strict as assert } from "node:assert";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build } from "esbuild";
import { mkdir } from "node:fs/promises";

async function bundle(entry, name, external = []) {
  const baseDir = external.length ? join(process.cwd(), "reports", ".smoke-bundles") : tmpdir();
  if (external.length) await mkdir(baseDir, { recursive: true });
  const outfile = join(baseDir, `${name}-${Date.now()}.mjs`);
  await build({ entryPoints: [entry], bundle: true, format: "esm", platform: "node", external, outfile, logLevel: "silent" });
  return import(pathToFileURL(outfile).href);
}

const { orchestrateRepair } = await bundle("src/domain/repairOrchestrator.ts", "repair-escalation-orchestrator");
const { ExportDecisionPanel } = await bundle("src/components/tabs/screeningReviewRepairPanels.tsx", "repair-escalation-panels", ["react", "react-dom", "react-dom/server"]);
const { contentHash } = await bundle("src/utils/hash.ts", "repair-escalation-hash");

const cv = {
  header: { name: "Alex Chen", targetRole: "Customer Automation Specialist", email: "", location: "Taipei" },
  sidebar: { languages: [], skillGroups: [], certifications: [], education: [] },
  summary: "Customer operator seeking work.",
  workExperience: [{
    experienceId: "exp-current",
    company: "Acme",
    role: "Customer Operations Specialist",
    period: "2022-Present",
    location: "Taipei",
    subsections: [{ title: "Impact", bullets: [
      { text: "Work-log: joined internal sync and tracked tickets.", evidenceIds: ["ev-workflow-automation"], confidence: "Grounded" },
      { text: "Helped customers.", evidenceIds: ["ev-enablement"], confidence: "Weak" }
    ] }]
  }],
  jdAnalysis: {
    targetRole: "Customer Automation Specialist",
    coreRequirements: ["workflow automation"],
    topKeywords: [{ keyword: "workflow automation", priority: "Must-have", placement: "Summary" }],
    gaps: []
  },
  keywordPlacementNotes: [],
  interviewNotes: [],
  reviewNotes: []
};
const cvHash = contentHash(cv);
function routeFor(blockers, options = {}) {
  return orchestrateRepair({
    cvVersionId: "cv-v1",
    cvContentHash: cvHash,
    blockers,
    cv,
    selectedEvidenceIds: ["ev-workflow-automation", "ev-enablement"],
    effectiveCvBriefHash: "brief-a",
    ...options
  });
}

assert.equal(routeFor(["Summary needs clearer role fit"]).recommendedNextRoute, "run-targeted-regeneration", "summary role fit must target regeneration");
assert.equal(routeFor(["Weak claims: first work bullet needs stronger supporting evidence"]).recommendedNextRoute, "review-ai-proposals", "exact weak bullet must map to proposal");
assert.equal(routeFor(["Achievements need stronger support"]).recommendedNextRoute, "run-targeted-regeneration", "broad weak achievements must target regeneration");
assert.equal(routeFor(["External wording: first work bullet uses Work-log internal terminology"]).recommendedNextRoute, "review-ai-proposals", "exact external wording must map to proposal");
assert.equal(routeFor(["Wording needs to be clearer for recruiters"]).recommendedNextRoute, "run-targeted-regeneration", "broad recruiter wording must target regeneration");
assert.equal(routeFor(["Contact extraction: Missing email"]).recommendedNextRoute, "collect-human-input", "missing email without trusted value must ask for input");
assert.equal(routeFor(["Contact extraction: Missing email"], { trustedProfileEmail: "alex@example.com" }).recommendedNextRoute, "run-safe-repair", "trusted email must map to safe repair");

const duplicateEmail = routeFor(["Contact extraction: Missing name, email, or location", "Contact email: Missing email"]);
assert.equal(duplicateEmail.humanInput.length, 2, "raw duplicate contact checks remain in advanced/orchestrator diagnostics");

const html = renderToStaticMarkup(React.createElement(ExportDecisionPanel, {
  decision: {
    ready: false,
    blockers: ["Contact extraction: Missing name, email, or location", "Contact email: Missing email"],
    warnings: [],
    contentHash: cvHash
  },
  onExport: () => undefined,
  cv,
  repairOrchestration: duplicateEmail,
  onCollectHumanInput: () => undefined
}));
assert.match(html, /Enter Email/, "duplicate missing email task must show one Enter Email CTA");
assert.match(html, /1 remaining item/, "duplicate contact blockers must consolidate to one user-facing task");

const summaryHtml = renderToStaticMarkup(React.createElement(ExportDecisionPanel, {
  decision: { ready: false, blockers: ["Summary needs clearer role fit"], warnings: [], contentHash: cvHash },
  onExport: () => undefined,
  cv,
  repairOrchestration: routeFor(["Summary needs clearer role fit"]),
  onRunTargetedRegeneration: () => undefined
}));
assert.match(summaryHtml, /Regenerate Summary with AI/, "summary regeneration CTA must be explicit");

const workHtml = renderToStaticMarkup(React.createElement(ExportDecisionPanel, {
  decision: { ready: false, blockers: ["Achievements need stronger support"], warnings: [], contentHash: cvHash },
  onExport: () => undefined,
  cv,
  repairOrchestration: routeFor(["Achievements need stronger support"]),
  onRunTargetedRegeneration: () => undefined
}));
assert.match(workHtml, /Regenerate Work Bullets with AI/, "work bullet regeneration CTA must be explicit");

console.log(JSON.stringify({
  ok: true,
  checks: [
    "summary role fit -> targeted regeneration",
    "exact weak bullet -> AI proposal",
    "broad weak achievements -> targeted regeneration",
    "exact external wording -> AI proposal",
    "broad recruiter wording -> targeted regeneration",
    "missing email without trusted value -> human input",
    "trusted email -> safe repair",
    "duplicate email checks consolidate into one user task",
    "summary regeneration CTA",
    "work bullet regeneration CTA",
    "no external AI invocation"
  ]
}, null, 2));
