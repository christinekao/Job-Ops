import { strict as assert } from "node:assert";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { readFile } from "node:fs/promises";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build } from "esbuild";

async function bundle(entry, name) {
  const outfile = join(process.cwd(), "reports", ".smoke-bundles", `${name}-${Date.now()}.mjs`);
  await build({
    entryPoints: [entry],
    bundle: true,
    format: "esm",
    platform: "node",
    external: ["react", "react-dom", "react-dom/server"],
    outfile,
    logLevel: "silent"
  });
  return import(pathToFileURL(outfile).href);
}

const { ExportDecisionPanel } = await bundle("src/components/tabs/screeningReviewRepairPanels.tsx", "targeted-regeneration-ui-panel");
const { orchestrateRepair } = await bundle("src/domain/repairOrchestrator.ts", "targeted-regeneration-ui-orchestrator");
const { contentHash } = await bundle("src/utils/hash.ts", "targeted-regeneration-ui-hash");

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
    subsections: [{
      title: "Impact",
      bullets: [
        { text: "Helped customers.", evidenceIds: ["ev-workflow-automation"], confidence: "Weak" },
        { text: "Work-log: joined internal sync and tracked tickets.", evidenceIds: ["ev-enablement"], confidence: "Grounded" }
      ]
    }]
  }],
  keywordPlacementNotes: [],
  interviewNotes: [],
  reviewNotes: []
};

function orchestration(blockers, overrides = {}) {
  return orchestrateRepair({
    cvVersionId: "cv-ui-1",
    cvContentHash: contentHash({ blockers, cv }),
    blockers,
    cv,
    selectedEvidenceIds: ["ev-workflow-automation", "ev-enablement"],
    effectiveCvBriefHash: "brief-ui-1",
    ...overrides
  });
}

function render(blockers, summary, options = {}) {
  return renderToStaticMarkup(React.createElement(ExportDecisionPanel, {
    decision: { ready: false, blockers, warnings: [], contentHash: summary.cvContentHash },
    cv: options.cv === undefined ? cv : options.cv,
    repairOrchestration: summary,
    onExport: () => {},
    onRunTargetedRegeneration: () => {},
    onRunSafeRepairs: () => {},
    onCollectHumanInput: () => {},
    onJumpToFix: () => {}
  }));
}

const summaryBlockers = ["Summary needs clearer role fit"];
const summaryHtml = render(summaryBlockers, orchestration(summaryBlockers));
assert.match(summaryHtml, /Regenerate Summary with AI/, "summary role-fit route must show Regenerate Summary with AI");
assert.match(summaryHtml, /Edit Summary Manually/, "summary card must preserve manual secondary action");
assert.doesNotMatch(summaryHtml.replace(/<details[\s\S]*?<\/details>/g, ""), /Manual or AI-assisted review required/, "targeted summary route must not fall back to manual review");

const workBlockers = ["Achievements need stronger support"];
const workHtml = render(workBlockers, orchestration(workBlockers));
assert.match(workHtml, /Regenerate Work Bullets with AI/, "broad weak-achievement route must show Regenerate Work Bullets with AI");
assert.match(workHtml, /Edit Work Experience Manually/, "work card must preserve manual secondary action");

const wordingBlockers = ["Wording needs to be clearer for recruiters"];
const wordingSummary = orchestration(wordingBlockers);
const wordingHtmlWithoutCv = render(wordingBlockers, wordingSummary, { cv: undefined });
assert.match(wordingHtmlWithoutCv, /Generate Cleaner CV Wording/, "broad wording route must show Generate Cleaner CV Wording");
assert.doesNotMatch(wordingHtmlWithoutCv.replace(/<details[\s\S]*?<\/details>/g, ""), /Manual or AI-assisted review required/, "targeted route must not require a direct DOM edit target");
assert.doesNotMatch(wordingHtmlWithoutCv, /No valid AI suggestions were produced/, "proposal empty-state message must not appear for targeted regeneration");

const contactBlockers = ["Contact extraction: Missing email", "Contact email: Missing email"];
const contactSummary = orchestration(contactBlockers, { trustedProfileEmail: undefined });
const contactHtml = render(contactBlockers, contactSummary);
assert.equal((contactHtml.match(/class="blocker-card /g) || []).length, 1, "duplicate contact/email checks must render as one user-facing card");
assert.match(contactHtml, /Enter Email/, "missing email without trusted value must show Enter Email");

const source = await readFile("src/components/tabs/screeningReviewRepairPanels.tsx", "utf8");
assert.match(source, /type UserRepairAction/, "user-facing repair action model must be formalized");
assert.match(source, /safe-repair[\s\S]*ai-proposal[\s\S]*targeted-regeneration[\s\S]*human-input[\s\S]*human-decision[\s\S]*unsupported/, "repair action model must preserve route priority");

console.log(JSON.stringify({
  ok: true,
  coverage: [
    "summary role-fit card shows Regenerate Summary with AI",
    "broad weak-achievement card shows Regenerate Work Bullets with AI",
    "broad wording card shows Generate Cleaner CV Wording",
    "targeted-regeneration does not require a direct DOM field target",
    "missing direct target no longer forces manual fallback",
    "missing email without trusted data shows Enter Email",
    "duplicate contact/email checks produce one user-facing card",
    "proposal empty-state message is not reused for targeted regeneration"
  ]
}, null, 2));
