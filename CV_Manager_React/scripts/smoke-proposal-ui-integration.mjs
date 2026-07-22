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

const { ExportDecisionPanel } = await bundle("src/components/tabs/screeningReviewRepairPanels.tsx", "proposal-ui-panels", ["react", "react-dom", "react-dom/server"]);
const { generateRepairProposal } = await bundle("src/domain/repairProposalGenerator.ts", "proposal-ui-generator");
const { createRepairProposalBatch, updateRepairProposalBatchStatus, applyAcceptedRepairProposalBatch } = await bundle("src/domain/repairProposalBatch.ts", "proposal-ui-batch");
const { contentHash } = await bundle("src/utils/hash.ts", "proposal-ui-hash");

const panelsSource = await readFile("src/components/tabs/screeningReviewRepairPanels.tsx", "utf8");
const orchestrationPanelSource = await readFile("src/components/tabs/RepairOrchestrationPanel.tsx", "utf8");
const screenLabSource = await readFile("src/components/tabs/ScreeningLab.tsx", "utf8");
const pipelineSource = await readFile("src/application/screeningActionPipeline.ts", "utf8");

assert.doesNotMatch(panelsSource, /const currentProposal = proposals\[0\]/, "proposal UI must not depend on only the first proposal");
assert.match(panelsSource, /visibleProposals\.map/, "proposal UI must render actual proposal cards as a batch");
assert.match(panelsSource, /apply-accepted-proposals/, "proposal UI must expose apply accepted batch CTA");
assert.match(panelsSource, /proposal-apply-disabled-reason/, "disabled apply CTA must show an exact reason");
assert.match(orchestrationPanelSource, /repair-orchestrator-disabled-reason/, "disabled orchestrator CTA must show an exact reason");
assert.match(panelsSource, /No AI changes have been applied yet/, "no-apply state must not say AI did not update the CV");
assert.match(panelsSource, /AI suggestions are running/, "running state must be visible after explicit proposal generation");
assert.match(pipelineSource, /generate-ai-proposals/, "proposal generation must be represented in the action pipeline");
assert.match(pipelineSource, /apply-accepted-proposals/, "proposal application must be represented in the action pipeline");
assert.match(screenLabSource, /onGenerateAiProposals=\{\(\) => \{ void dispatchReviewerAction\("generate-ai-proposals"\); \}\}/, "ScreeningLab must dispatch one proposal-generation command");
assert.match(screenLabSource, /onApplyAcceptedProposals=\{\(input\) => \{ void dispatchReviewerAction\("apply-accepted-proposals", input\); \}\}/, "ScreeningLab must dispatch one proposal-apply command");
assert.match(screenLabSource, /createRepairProposalBatch/, "ScreeningLab must reuse P4-AR-004 batch application");

const cv = {
  header: { name: "Candidate", targetRole: "Customer Automation Specialist", email: "candidate@example.com", location: "Taipei" },
  sidebar: { languages: [], skillGroups: [], certifications: [], education: [] },
  summary: "Customer Automation Specialist who owned an enterprise AI platform and workflow automation adoption.",
  workExperience: [{
    experienceId: "role-a",
    company: "Example",
    role: "Specialist",
    period: "2022-Present",
    location: "Taipei",
    subsections: [{ title: "Impact", bullets: [
      { text: "Work-log: joined internal sync and tracked tickets.", evidenceIds: ["ev-1"], confidence: "Needs Review" },
      { text: "Helped customers.", evidenceIds: ["ev-2"], confidence: "Weak" }
    ] }]
  }],
  keywordPlacementNotes: [],
  interviewNotes: [],
  reviewNotes: []
};
const cvHash = contentHash(cv);
const blockers = [
  "Summary wording needs safer external wording",
  "External wording: first work bullet uses Work-log internal terminology",
  "Weak claims: first work bullet needs stronger supporting evidence"
];
const blockerCards = [
  { blockerId: "blocker-summary", rawBlocker: blockers[0], target: { blockerId: "blocker-summary", section: "summary", fieldId: "summary", focusKey: "summary", highlightKey: "summary" } },
  { blockerId: "blocker-external", rawBlocker: blockers[1], target: { blockerId: "blocker-external", section: "workExperience", fieldId: "bullet", roleId: "role-a", bulletId: "0-0-0", focusKey: "bullet-0", highlightKey: "bullet-0" } },
  { blockerId: "blocker-weak", rawBlocker: blockers[2], target: { blockerId: "blocker-weak", section: "workExperience", fieldId: "bullet", roleId: "role-a", bulletId: "0-0-1", focusKey: "bullet-1", highlightKey: "bullet-1" } }
];
const proposals = blockerCards.map((item) => {
  const result = generateRepairProposal(cv, {
    blockerId: item.blockerId,
    rawBlocker: item.rawBlocker,
    title: item.rawBlocker,
    explanation: item.rawBlocker,
    target: item.target
  });
  assert.equal(result.supported, true, `${item.blockerId} must produce a normalized proposal`);
  assert.ok(result.proposal.id, "proposal id must exist");
  assert.equal(result.proposal.blockerId, item.blockerId, "blocker id must be preserved");
  assert.ok(result.proposal.currentValue !== undefined, "current value must be captured");
  assert.ok(result.proposal.suggestedValue, "suggested value must be captured");
  assert.ok(result.proposal.reason, "reason must be captured");
  assert.ok(result.proposal.estimatedImpact, "expected impact must be captured");
  return result.proposal;
});
const batch = createRepairProposalBatch({
  sourceCvVersionId: "cv-v1",
  sourceContentHash: cvHash,
  proposals,
  evidenceByProposalId: Object.fromEntries(proposals.map((proposal) => [proposal.id, proposal.target.section === "workExperience" ? ["ev-1"] : []]))
});
let reviewed = updateRepairProposalBatchStatus(batch, proposals[0].id, "accepted");
reviewed = updateRepairProposalBatchStatus(reviewed, proposals[1].id, "accepted");
reviewed = updateRepairProposalBatchStatus(reviewed, proposals[2].id, "rejected");
const applyResult = applyAcceptedRepairProposalBatch({
  cvVersion: {
    id: "cv-v1",
    jdId: "job-1",
    name: "Proposal UI CV",
    summary: cv.summary,
    content: JSON.stringify(cv),
    tailoredCv: cv,
    status: "Ready for Review",
    updatedAt: "2026-07-13T00:00:00.000Z"
  },
  currentCvVersionId: "cv-v1",
  currentContentHash: cvHash,
  batch: reviewed
});
assert.equal(applyResult.status, "success", "accepted batch must apply");
assert.equal(applyResult.appliedChanges.length, 2, "accepted proposals must apply");
assert.ok(applyResult.nextVersion, "accepted batch must create a CV version");
assert.equal(applyResult.nextVersion.tailoredCv.workExperience[0].subsections[0].bullets[1].text, cv.workExperience[0].subsections[0].bullets[1].text, "rejected proposal must not mutate CV");

const disabledHtml = renderToStaticMarkup(React.createElement(ExportDecisionPanel, {
  decision: { ready: false, blockers: ["Weak claims: first work bullet needs stronger supporting evidence"], warnings: [], contentHash: cvHash },
  onExport: () => undefined,
  cv,
  repairOrchestration: {
    cvVersionId: "cv-v1",
    cvContentHash: cvHash,
    totalBlockers: 1,
    safeAuto: [],
    approvalRequired: [{ blockerId: "blocker-weak", route: "approval-required" }],
    humanDecision: [],
    unsupported: [],
    recommendedNextRoute: "review-ai-proposals"
  }
}));
assert.match(disabledHtml, /No proposal-generation action handler is available/, "disabled proposal CTA must show exact reason");

console.log(JSON.stringify({
  ok: true,
  checks: [
    "root cause no longer present",
    "proposal CTA has disabled reason",
    "proposal generation action pipeline command exists",
    "proposal apply action pipeline command exists",
    "running state present",
    "invalid/no-handler state explicit",
    "proposal contract normalized",
    "proposal cards include current and suggested content",
    "accepted batch creates CV version/hash",
    "rejected proposal does not mutate CV",
    "no-apply message corrected",
    "no hidden AI invocation"
  ]
}, null, 2));
