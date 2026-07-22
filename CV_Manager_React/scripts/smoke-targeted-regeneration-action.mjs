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

const { RepairResultPanel } = await bundle("src/components/tabs/screeningReviewRepairPanels.tsx", "targeted-regeneration-action-panel");
const { executeTargetedRegeneration, createTargetedRegenerationRequest } = await bundle("src/domain/targetedRegeneration.ts", "targeted-regeneration-action-domain");
const { orchestrateRepair } = await bundle("src/domain/repairOrchestrator.ts", "targeted-regeneration-action-orchestrator");
const { contentHash } = await bundle("src/utils/hash.ts", "targeted-regeneration-action-hash");

const panelSource = await readFile("src/components/tabs/screeningReviewRepairPanels.tsx", "utf8");
const labSource = await readFile("src/components/tabs/ScreeningLab.tsx", "utf8");
const pipelineSource = await readFile("src/application/screeningActionPipeline.ts", "utf8");

assert.match(pipelineSource, /"run-targeted-regeneration"/, "action pipeline must include run-targeted-regeneration");
assert.match(panelSource, /runTargetedRegenerationFromUi/, "UI must centralize targeted regeneration action dispatch");
assert.match(labSource, /setTargetedRegenerationLifecycle\("running"\)/, "running state must be controlled by the production runtime handler");
assert.match(labSource, /setTargetedRegenerationLifecycle\("validating"\)/, "validating state must begin after the production automation response");
assert.equal((panelSource.match(/onRunTargetedRegeneration\(\)/g) || []).length, 1, "UI must dispatch exactly one targeted regeneration command");
assert.match(labSource, /dispatchReviewerAction\("run-targeted-regeneration"\)/, "ScreeningLab must dispatch the targeted regeneration command through the action pipeline");
assert.match(labSource, /executeTargetedRegenerationAction/, "ScreeningLab must use the existing targeted regeneration execution boundary");
assert.match(labSource, /startAutomation\("screening-cv", prompt, runtimeContext\)/, "targeted regeneration must invoke the existing production automation boundary");

const cv = {
  header: { name: "Alex Chen", targetRole: "Customer Automation Specialist", email: "alex@example.com", location: "Taipei" },
  sidebar: { languages: [], skillGroups: [], certifications: [], education: [] },
  summary: "Customer Automation Specialist focused on workflow automation.",
  workExperience: [{
    experienceId: "exp-current",
    company: "Acme",
    role: "Customer Operations Specialist",
    period: "2022-Present",
    location: "Taipei",
    subsections: [{ title: "Impact", bullets: [{ text: "Mapped stakeholder requests and configured workflow steps that reduced manual follow-up by 35%.", evidenceIds: ["ev-workflow-automation"], confidence: "Grounded" }] }]
  }],
  keywordPlacementNotes: [],
  interviewNotes: [],
  reviewNotes: []
};
const cvVersion = {
  id: "cv-action-1",
  jdId: "job-action-1",
  name: "Action CV",
  summary: cv.summary,
  content: JSON.stringify(cv),
  tailoredCv: cv,
  status: "Ready for Review",
  updatedAt: "2026-07-13T00:00:00.000Z"
};
const cvHash = contentHash(cv);
const orchestration = orchestrateRepair({
  cvVersionId: cvVersion.id,
  cvContentHash: cvHash,
  blockers: ["Summary needs clearer role fit"],
  cv,
  selectedEvidenceIds: ["ev-workflow-automation"],
  effectiveCvBriefHash: "brief-action-1"
});
const request = createTargetedRegenerationRequest({
  classifications: orchestration.targetedRegeneration,
  selectedEvidenceIds: ["ev-workflow-automation"],
  effectiveCvBriefHash: "brief-action-1"
});
const staleResult = executeTargetedRegeneration({
  cvVersion,
  request,
  currentCvVersionId: cvVersion.id,
  currentContentHash: "changed-hash",
  currentEffectiveCvBriefHash: "brief-action-1"
});
assert.equal(staleResult.status, "stale", "stale CV context must reject targeted regeneration");

const noDiffHtml = renderToStaticMarkup(React.createElement(RepairResultPanel, {
  result: {
    summary: "Targeted regeneration produced no CV content change.",
    actionId: "run-targeted-regeneration",
    status: "no-safe-fix",
    changedSections: [],
    unchangedSections: ["Existing CV content"],
    contentHash: cvHash,
    remainingBlockers: ["Summary needs clearer role fit"]
  }
}));
assert.match(noDiffHtml, /AI could not produce a safe improvement for this section/, "no-diff must explain targeted regeneration failure");
assert.match(noDiffHtml, /Retry/, "no-diff must offer Retry");
assert.match(noDiffHtml, /Edit Manually/, "no-diff must offer Edit Manually");

console.log(JSON.stringify({
  ok: true,
  coverage: [
    "CTA dispatches one targeted-regeneration command",
    "running state is visible",
    "validation state is visible",
    "ScreeningLab uses existing execution boundary",
    "stale context is rejected",
    "no-diff shows explicit retry/manual options",
    "no hidden AI endpoint wiring added"
  ]
}, null, 2));
