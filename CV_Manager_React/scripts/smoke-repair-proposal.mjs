import { strict as assert } from "node:assert";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build } from "esbuild";
import { mkdir, readFile } from "node:fs/promises";

const generatorModule = join(tmpdir(), `repair-proposal-generator-${Date.now()}.mjs`);
await build({
  entryPoints: ["src/domain/repairProposalGenerator.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: generatorModule,
  logLevel: "silent"
});

const bundleDir = join(process.cwd(), "reports", ".smoke-bundles");
await mkdir(bundleDir, { recursive: true });
const panelModule = join(bundleDir, `repair-proposal-panel-${Date.now()}.mjs`);
await build({
  entryPoints: ["src/components/tabs/RepairProposalPanel.tsx"],
  bundle: true,
  format: "esm",
  platform: "node",
  external: ["react", "react-dom", "react-dom/server"],
  outfile: panelModule,
  logLevel: "silent"
});

const panelsModule = join(bundleDir, `repair-proposal-export-panel-${Date.now()}.mjs`);
await build({
  entryPoints: ["src/components/tabs/screeningReviewRepairPanels.tsx"],
  bundle: true,
  format: "esm",
  platform: "node",
  external: ["react", "react-dom", "react-dom/server"],
  outfile: panelsModule,
  logLevel: "silent"
});

const { generateRepairProposal } = await import(pathToFileURL(generatorModule).href);
const { RepairProposalPanel } = await import(pathToFileURL(panelModule).href);
const { ExportDecisionPanel } = await import(pathToFileURL(panelsModule).href);

const cv = {
  header: { name: "Candidate", targetRole: "Automation Specialist", email: "", location: "Taipei" },
  sidebar: { languages: [], skillGroups: [], certifications: [], education: [] },
  summary: "Customer specialist who owned an enterprise AI platform. Customer specialist who owned an enterprise AI platform.",
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

const summaryProposal = generateRepairProposal(cv, {
  blockerId: "summary",
  rawBlocker: "Reviewer: summary unsupported claims: owned enterprise AI platform",
  title: "Unsupported wording needs review",
  explanation: "Some wording may claim experience that the selected evidence does not support.",
  target: {
    blockerId: "summary",
    section: "summary",
    fieldId: "summary",
    focusKey: "guided-summary-summary",
    highlightKey: "guided-summary-summary"
  }
});
assert.equal(summaryProposal.supported, true, "summary proposal must be created");
assert.equal(summaryProposal.proposal.target.section, "summary", "summary proposal must target summary");
assert.match(summaryProposal.proposal.currentValue, /owned an enterprise AI platform/, "summary proposal must capture current value");
assert.doesNotMatch(summaryProposal.proposal.suggestedValue, /owned an enterprise AI platform/, "summary proposal must capture suggested value");
assert.match(summaryProposal.proposal.reason, /summary wording|positioning boundary/i, "summary proposal must generate reason");

const weakProposal = generateRepairProposal(cv, {
  blockerId: "weak",
  rawBlocker: "Reviewer: weak claims controlled: first work bullet lacks concrete action and result",
  title: "Achievements need stronger support",
  explanation: "Some work achievements need clearer evidence or weaker wording.",
  target: {
    blockerId: "weak",
    section: "workExperience",
    fieldId: "bullet",
    roleId: "role-a",
    bulletId: "0-0-0",
    focusKey: "guided-workExperience-bullet-role-a-0-0-0",
    highlightKey: "guided-workExperience-bullet-role-a-0-0-0"
  }
});
assert.equal(weakProposal.supported, true, "weak bullet proposal must be created");
assert.equal(weakProposal.proposal.affectedSection, "Work Experience", "weak proposal must target work experience");
assert.match(weakProposal.proposal.currentValue, /Helped automation/, "weak proposal must capture current bullet");
assert.match(weakProposal.proposal.suggestedValue, /clearer action, scope, and outcome/, "weak proposal must suggest stronger wording");

const externalProposal = generateRepairProposal(cv, {
  blockerId: "external",
  rawBlocker: "Reviewer: external wording: 1 work-log bullet(s)",
  title: "Wording needs to be clearer for recruiters",
  explanation: "Some phrases still read like internal notes.",
  target: {
    blockerId: "external",
    section: "workExperience",
    fieldId: "bullet",
    roleId: "role-a",
    bulletId: "0-0-1",
    focusKey: "guided-workExperience-bullet-role-a-0-0-1",
    highlightKey: "guided-workExperience-bullet-role-a-0-0-1"
  }
});
assert.equal(externalProposal.supported, true, "external wording proposal must be created");
assert.doesNotMatch(externalProposal.proposal.suggestedValue, /Work-log|internal sync|tickets/i, "external wording proposal must translate internal wording");

const unsupported = generateRepairProposal(cv, {
  blockerId: "career",
  rawBlocker: "Career positioning: requires repositioning candidate story",
  title: "Review positioning",
  explanation: "Human judgement needed.",
  target: {
    blockerId: "career",
    section: "summary",
    fieldId: "summary",
    focusKey: "guided-summary-summary",
    highlightKey: "guided-summary-summary"
  }
});
assert.equal(unsupported.supported, false, "career positioning must not produce proposal");

let accepted = false;
let rejected = false;
let manual = false;
const proposalHtml = renderToStaticMarkup(React.createElement(RepairProposalPanel, {
  proposal: weakProposal.proposal,
  status: "draft",
  onAccept: () => { accepted = true; },
  onReject: () => { rejected = true; },
  onEditManually: () => { manual = true; }
}));
assert.match(proposalHtml, /AI Repair Proposal/, "proposal panel must open");
assert.match(proposalHtml, /Current/, "proposal panel must show current content");
assert.match(proposalHtml, /AI Suggestion/, "proposal panel must show suggested content");
assert.match(proposalHtml, /Why/, "proposal panel must show reason");
assert.match(proposalHtml, /Expected impact/, "proposal panel must show expected impact");
assert.match(proposalHtml, /Accept/, "proposal panel must show Accept");
assert.match(proposalHtml, /Reject/, "proposal panel must show Reject");
assert.match(proposalHtml, /Edit manually/, "proposal panel must show Edit manually");
assert.equal(accepted, false, "server render must not accept proposal");
assert.equal(rejected, false, "server render must not reject proposal");
assert.equal(manual, false, "server render must not navigate manually");

const exportHtml = renderToStaticMarkup(React.createElement(ExportDecisionPanel, {
  decision: { ready: false, blockers: ["Reviewer: weak claims controlled: first work bullet lacks concrete action and result"], warnings: [], contentHash: "hash" },
  cv,
  proposalResolver: (input) => {
    const result = generateRepairProposal(cv, input);
    return result.supported ? result.proposal : null;
  },
  onExport: () => {},
  onJumpToFix: () => {}
}));
assert.match(exportHtml, /Preview AI Repair/, "supported blocker must expose proposal preview CTA");
assert.doesNotMatch(exportHtml, /Jump to Summary|Jump to Bullet|Jump to Email/, "active repair UI must not expose direct jump CTA as primary action");

const panelSource = await readFile("src/components/tabs/screeningReviewRepairPanels.tsx", "utf8");
assert.doesNotMatch(panelSource, /applyScreeningCvResult|saveCvVersion|updateData|startAutomation|buildScreeningCvPrompt/, "proposal layer must not mutate CV or invoke AI");

console.log(JSON.stringify({
  ok: true,
  coverage: [
    "proposal created",
    "correct target",
    "current value captured",
    "suggested value captured",
    "reason generated",
    "proposal opens",
    "accept and reject are presentation state only",
    "no CV mutation symbols in proposal UI",
    "unsupported judgement blocker rejected"
  ]
}, null, 2));
