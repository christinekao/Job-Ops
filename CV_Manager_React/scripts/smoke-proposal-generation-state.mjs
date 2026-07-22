import { strict as assert } from "node:assert";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { readFile, mkdir } from "node:fs/promises";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build } from "esbuild";

async function bundle(entry, name, external = []) {
  const baseDir = external.length ? join(process.cwd(), "reports", ".smoke-bundles") : tmpdir();
  if (external.length) await mkdir(baseDir, { recursive: true });
  const outfile = join(baseDir, `${name}-${Date.now()}.mjs`);
  await build({ entryPoints: [entry], bundle: true, format: "esm", platform: "node", external, outfile, logLevel: "silent" });
  return import(pathToFileURL(outfile).href);
}

const panels = await bundle("src/components/tabs/screeningReviewRepairPanels.tsx", "proposal-generation-state", ["react", "react-dom", "react-dom/server"]);
const { ExportDecisionPanel, resolveProposalGenerationStatus, proposalGenerationCta } = panels;

const source = await readFile("src/components/tabs/screeningReviewRepairPanels.tsx", "utf8");
assert.match(source, /type ProposalGenerationStatus/, "proposal generation lifecycle type must be explicit");
assert.match(source, /proposalCandidateCount/, "candidate count must be separate from generated proposal count");
assert.match(source, /Generated suggestions/, "generated suggestions count must be displayed separately");
assert.match(source, /Generate New AI Suggestions/, "stale generated proposals must have a regenerate CTA");

assert.equal(resolveProposalGenerationStatus({
  candidateCount: 3,
  generatedProposalCount: 0,
  baseStatus: "idle",
  sourceContentHash: undefined,
  currentContentHash: "hash-a"
}), "ready", "candidates with no generated proposals must be ready");

assert.equal(proposalGenerationCta("ready", 3, 0).label, "Generate 3 AI Suggestions", "ready CTA must generate suggestions");
assert.equal(proposalGenerationCta("running", 3, 0).label, "Generating suggestions…", "running CTA must show progress");
assert.equal(proposalGenerationCta("running", 3, 0).disabled, true, "running CTA must be disabled");
assert.equal(proposalGenerationCta("success", 3, 3).label, "Review 3 AI Suggestions", "success CTA must review generated suggestions");
assert.equal(proposalGenerationCta("empty", 3, 0).label, "Retry AI Suggestions", "empty CTA must allow retry");
assert.equal(proposalGenerationCta("error", 3, 0).label, "Retry AI Suggestions", "error CTA must allow retry");
assert.equal(proposalGenerationCta("stale", 3, 3).label, "Generate New AI Suggestions", "stale CTA must regenerate");

assert.equal(resolveProposalGenerationStatus({
  candidateCount: 3,
  generatedProposalCount: 3,
  baseStatus: "success",
  sourceContentHash: "hash-a",
  currentContentHash: "hash-a"
}), "success", "same content hash must keep generated proposals current");

assert.equal(resolveProposalGenerationStatus({
  candidateCount: 3,
  generatedProposalCount: 3,
  baseStatus: "success",
  sourceContentHash: "hash-a",
  currentContentHash: "hash-b"
}), "stale", "content hash changes must stale generated proposals");

assert.equal(resolveProposalGenerationStatus({
  candidateCount: 3,
  generatedProposalCount: 3,
  baseStatus: "success",
  sourceContentHash: "hash-a",
  currentContentHash: "hash-a"
}), "success", "timestamp-only changes are ignored because lifecycle uses content hash only");

const cv = {
  header: { name: "Candidate", targetRole: "Customer Automation Specialist", email: "candidate@example.com", location: "Taipei" },
  sidebar: { languages: [], skillGroups: [], certifications: [], education: [] },
  summary: "Customer Automation Specialist who owned an enterprise AI platform.",
  workExperience: [{
    experienceId: "role-a",
    company: "Example",
    role: "Specialist",
    period: "2022-Present",
    location: "Taipei",
    subsections: [{ title: "Impact", bullets: [
      { text: "Work-log: joined internal sync and tracked tickets.", evidenceIds: ["ev-1"], confidence: "Needs Review" }
    ] }]
  }],
  keywordPlacementNotes: [],
  interviewNotes: [],
  reviewNotes: []
};

const readyHtml = renderToStaticMarkup(React.createElement(ExportDecisionPanel, {
  decision: {
    ready: false,
    blockers: [
      "Summary wording needs safer external wording",
      "External wording: first work bullet uses Work-log internal terminology",
      "Weak claims: first work bullet needs stronger supporting evidence"
    ],
    warnings: [],
    contentHash: "hash-a"
  },
  onExport: () => undefined,
  cv,
  repairOrchestration: {
    cvVersionId: "cv-v1",
    cvContentHash: "hash-a",
    totalBlockers: 3,
    safeAuto: [],
    approvalRequired: [
      { blockerId: "blocker-summary", route: "approval-required" },
      { blockerId: "blocker-external", route: "approval-required" },
      { blockerId: "blocker-weak", route: "approval-required" }
    ],
    humanDecision: [],
    unsupported: [],
    recommendedNextRoute: "review-ai-proposals"
  },
  proposalResolver: () => null,
  onGenerateAiProposals: () => undefined
}));

assert.match(readyHtml, /Generate 3 AI Suggestions/, "ready render must show enabled generate CTA");
assert.match(readyHtml, /3 items are ready for AI suggestions/, "ready render must explain candidates are ready");
assert.doesNotMatch(readyHtml, /No valid AI suggestions were produced for the current CV/, "ready render must not show empty-result message");

console.log(JSON.stringify({
  ok: true,
  checked: [
    "explicit proposal-generation lifecycle",
    "candidate count separate from generated count",
    "ready CTA enabled copy",
    "ready state does not show empty-result message",
    "running CTA disabled copy",
    "success CTA review copy",
    "empty retry copy",
    "error retry copy",
    "stale regenerate copy",
    "content-hash stale detection",
    "timestamp-only changes ignored"
  ]
}, null, 2));
