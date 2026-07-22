import { strict as assert } from "node:assert";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build } from "esbuild";

async function bundle(entry, name, external = []) {
  const outfile = join(process.cwd(), "reports", ".smoke-bundles", `${name}-${Date.now()}.mjs`);
  await build({ entryPoints: [entry], bundle: true, format: "esm", platform: "node", external, outfile, logLevel: "silent" });
  return import(pathToFileURL(outfile).href);
}

const { ExportDecisionPanel } = await bundle("src/components/tabs/screeningReviewRepairPanels.tsx", "targeted-feedback-panel", ["react", "react-dom", "react-dom/server"]);
const { orchestrateRepair } = await bundle("src/domain/repairOrchestrator.ts", "targeted-feedback-orchestrator");
const { createTargetedRegenerationRequest } = await bundle("src/domain/targetedRegeneration.ts", "targeted-feedback-request");
const { createRegenerationAttemptIdentity } = await bundle("src/domain/targetedRegenerationFeedback.ts", "targeted-feedback-attempt");
const { contentHash } = await bundle("src/utils/hash.ts", "targeted-feedback-hash");

const cv = {
  header: { name: "Alex Chen", targetRole: "Customer Automation Specialist", email: "alex@example.com", location: "Taipei" },
  sidebar: { languages: [], skillGroups: [], certifications: [], education: [] },
  summary: "Customer operator seeking work.",
  workExperience: [{ experienceId: "exp-current", company: "Acme", role: "Specialist", period: "2022-Present", location: "Taipei", subsections: [{ title: "Impact", bullets: [{ text: "Mapped stakeholder requests into workflow delivery.", evidenceIds: ["ev-workflow"], confidence: "Grounded" }] }] }],
  keywordPlacementNotes: [], interviewNotes: [], reviewNotes: []
};
const cvHash = contentHash(cv);
const blockers = ["Summary needs clearer role fit"];
const orchestration = orchestrateRepair({ cvVersionId: "cv-feedback-1", cvContentHash: cvHash, blockers, cv, selectedEvidenceIds: ["ev-workflow"], effectiveCvBriefHash: "brief-feedback-1" });
const request = createTargetedRegenerationRequest({ classifications: orchestration.targetedRegeneration, selectedEvidenceIds: ["ev-workflow"], effectiveCvBriefHash: "brief-feedback-1" });
const identity = createRegenerationAttemptIdentity(request);
const attempt = { ...identity, outcome: "no-diff-terminal", attemptCount: 1, lastAttemptedAt: "2026-07-16T00:00:00.000Z", finalStopReason: "no-safe-content-difference", message: "AI regeneration completed, but no safe content change was available." };

function panel(extra = {}) {
  return renderToStaticMarkup(React.createElement(ExportDecisionPanel, {
    decision: { ready: false, blockers, warnings: [], contentHash: cvHash },
    cv,
    repairOrchestration: orchestration,
    onExport: () => {},
    onJumpToFix: () => {},
    onRunTargetedRegeneration: () => {},
    onRetryTargetedRegeneration: () => {},
    ...extra
  }));
}

const running = panel({ targetedRegenerationLifecycle: "running", targetedRegenerationElapsedSeconds: 3 });
assert.match(running, /Regenerating Summary…/, "clicked action label must change immediately");
assert.match(running, /repair-workflow-fix/, "running feedback must render in the single workflow");
assert.match(running, /Generating content/, "running stage must be explicit");
assert.match(running, /Protected: Contact, Skills, and unrelated work history/, "protected zones must be visible");
assert.match(running, /disabled=""/, "busy targeted action must be disabled");

const validating = panel({ targetedRegenerationLifecycle: "validating", targetedRegenerationElapsedSeconds: 6 });
assert.match(validating, /Validating regenerated content…/, "validation state must be visible");
assert.match(validating, /evidence traceability, unsupported claims, allowed mutation zones, duplicate wording, and required fields/, "validation checks must be explained");

const terminal = panel({ targetedRegenerationAttempt: attempt });
assert.match(terminal, /targeted-regeneration-terminal/, "no-diff result must remain visible");
assert.match(terminal, /AI could not produce a safe improvement for this Summary/, "no-diff must not be presented as success");
assert.match(terminal, /repair-orchestrator-cta[^>]*>Edit Summary Manually</, "a different primary next action must replace regeneration");
assert.match(terminal, /Retry AI Regeneration/, "retry must remain available as a secondary action");
assert.match(terminal, /Retry uses AI tokens again with the same CV and evidence context/, "retry must warn about token use");
assert.match(terminal, /No safe change found/, "workflow must show the attempted result");
assert.match(terminal, /Summary needs clearer role fit/, "unresolved blocker must remain visible");
assert.doesNotMatch(terminal, /repair-orchestrator-cta[^>]*>Regenerate Summary with AI</, "same regeneration must not remain primary");
assert.doesNotMatch(terminal, /Review Changes/, "no-diff must not show Review Changes");

console.log(JSON.stringify({ ok: true, coverage: ["immediate label", "single workflow running state", "duplicate disabled", "validating", "persistent no-diff", "alternative primary", "advanced warned retry", "blocker remains"] }, null, 2));
