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

const { orchestrateRepair } = await bundle("src/domain/repairOrchestrator.ts", "copilot-orchestrator");
const { executeSafeRepairs } = await bundle("src/domain/safeRepairExecutor.ts", "copilot-safe");
const { generateRepairProposal } = await bundle("src/domain/repairProposalGenerator.ts", "copilot-proposal");
const { createRepairProposalBatch, updateRepairProposalBatchStatus, applyAcceptedRepairProposalBatch } = await bundle("src/domain/repairProposalBatch.ts", "copilot-batch");
const { createHumanDecisionPrompt, applyHumanDecision } = await bundle("src/domain/humanDecisionLayer.ts", "copilot-human");
const { runBoundedRepairSession } = await bundle("src/domain/repairSession.ts", "copilot-session");
const { contentHash } = await bundle("src/utils/hash.ts", "copilot-hash");
const { RepairOrchestrationPanel } = await bundle("src/components/tabs/RepairOrchestrationPanel.tsx", "copilot-panel", ["react", "react-dom", "react-dom/server"]);

const cv = {
  header: { name: "Candidate", targetRole: "Customer Success Specialist", email: "", location: "Taipei" },
  sidebar: { languages: [], skillGroups: [], certifications: [], education: [] },
  summary: "Qualified candidate who owned enterprise AI adoption. Qualified candidate who owned enterprise AI adoption.",
  workExperience: [{
    experienceId: "role-a",
    company: "Example",
    role: "Specialist",
    period: "2022-Present",
    location: "Taipei",
    subsections: [{
      title: "Impact",
      bullets: [
        { text: "Work-log: joined internal sync and tracked tickets.", confidence: "Needs Review", evidenceIds: ["ev-bullet-1"] },
        { text: "Helped customers.", confidence: "Weak", evidenceIds: ["ev-bullet-2"] }
      ]
    }]
  }],
  keywordPlacementNotes: [],
  interviewNotes: [],
  reviewNotes: []
};
const cvHash = contentHash(cv);
const cvVersion = {
  id: "cv-v1",
  jdId: "job-1",
  name: "Target CV",
  summary: cv.summary,
  content: JSON.stringify(cv),
  tailoredCv: cv,
  status: "Ready for Review",
  updatedAt: "2026-07-13T00:00:00.000Z"
};
const blockers = [
  "Summary duplicate wording: repeated summary sentence",
  "Contact extraction: Missing email",
  "External wording: first work bullet uses Work-log internal terminology",
  "Weak claims: first work bullet needs stronger supporting evidence",
  "Career positioning: choose between product manager and solution specialist identity",
  "Unsupported: no safe repair target is available"
];
const orchestration = orchestrateRepair({
  cvVersionId: cvVersion.id,
  cvContentHash: cvHash,
  blockers,
  cv,
  trustedProfileEmail: "candidate@example.com"
});
assert.equal(orchestration.safeAuto.length, 2, "copilot fixture must include two safe-auto repairs");
assert.equal(orchestration.approvalRequired.length, 2, "copilot fixture must include two approval-required proposals");
assert.equal(orchestration.humanDecision.length, 1, "copilot fixture must include one human decision");
assert.equal(orchestration.unsupported.length, 1, "copilot fixture must include one unsupported blocker");

const panelHtml = renderToStaticMarkup(React.createElement(RepairOrchestrationPanel, {
  summary: orchestration,
  onNextAction: () => undefined,
  nextActionDisabled: false
}));
assert.equal((panelHtml.match(/class="primary"/g) || []).length, 1, "copilot UI must show exactly one primary CTA");
assert.match(panelHtml, /Fix 2 Items with AI/, "primary CTA should be Fix with AI when safe-auto repairs exist");
assert.doesNotMatch(panelHtml.replace(/<details[\s\S]*<\/details>/, ""), /safe-auto|approval-required|human-decision|unsupported/, "route codes must not appear in primary UI");

const safeResult = executeSafeRepairs({
  cvVersion,
  orchestration,
  currentCvVersionId: cvVersion.id,
  currentContentHash: cvHash,
  trustedProfileEmail: "candidate@example.com",
  now: "2026-07-13T01:00:00.000Z"
});
assert.equal(safeResult.status, "success", "safe repairs should apply first");
assert.equal(safeResult.appliedChanges.length, 2, "two safe repairs should apply");

const staleSafe = executeSafeRepairs({
  cvVersion,
  orchestration,
  currentCvVersionId: cvVersion.id,
  currentContentHash: "stale-hash",
  trustedProfileEmail: "candidate@example.com"
});
assert.equal(staleSafe.status, "stale", "stale orchestrator output must not execute");

const nextCvVersion = safeResult.nextVersion;
const nextCv = nextCvVersion.tailoredCv;
const nextHash = contentHash(nextCv);
const proposalResults = orchestration.approvalRequired.map((item, index) => generateRepairProposal(nextCv, {
  blockerId: item.blockerId,
  rawBlocker: blockers[index + 2],
  title: item.reason,
  explanation: item.reason,
  target: item.target
}));
assert.equal(proposalResults.every((item) => item.supported), true, "approval-required items should produce proposals");
const proposals = proposalResults.map((item) => item.proposal);
let batch = createRepairProposalBatch({
  sourceCvVersionId: nextCvVersion.id,
  sourceContentHash: nextHash,
  proposals,
  evidenceByProposalId: Object.fromEntries(proposals.map((proposal) => [proposal.id, proposal.target.section === "workExperience" ? ["ev-bullet-1"] : []]))
});
batch = updateRepairProposalBatchStatus(batch, proposals[0].id, "accepted");
batch = updateRepairProposalBatchStatus(batch, proposals[1].id, "rejected");
const staleProposal = applyAcceptedRepairProposalBatch({
  cvVersion: nextCvVersion,
  currentCvVersionId: nextCvVersion.id,
  currentContentHash: "stale-proposal-hash",
  batch
});
assert.equal(staleProposal.status, "stale", "stale proposal must not execute");
const proposalApply = applyAcceptedRepairProposalBatch({
  cvVersion: nextCvVersion,
  currentCvVersionId: nextCvVersion.id,
  currentContentHash: nextHash,
  batch,
  now: "2026-07-13T01:10:00.000Z"
});
assert.equal(proposalApply.status, "success", "accepted proposal should apply");
assert.equal(proposalApply.appliedChanges.length, 1, "accepted one/rejected one should apply one proposal");

const humanClassification = orchestration.humanDecision[0];
const humanPrompt = createHumanDecisionPrompt({
  classification: humanClassification,
  currentSummary: proposalApply.nextVersion.tailoredCv.summary,
  evidenceIds: ["ev-positioning"]
});
const humanNoChoice = applyHumanDecision({
  cvVersion: proposalApply.nextVersion,
  currentCvVersionId: proposalApply.nextVersion.id,
  currentContentHash: contentHash(proposalApply.nextVersion.tailoredCv),
  prompt: humanPrompt
});
assert.equal(humanNoChoice.status, "requires-user-choice", "AI must not resolve human decision automatically");
const humanApplied = applyHumanDecision({
  cvVersion: proposalApply.nextVersion,
  currentCvVersionId: proposalApply.nextVersion.id,
  currentContentHash: contentHash(proposalApply.nextVersion.tailoredCv),
  prompt: humanPrompt,
  selectedOptionId: "keep-conservative",
  now: "2026-07-13T01:20:00.000Z"
});
assert.equal(humanApplied.status, "applied", "user-authorized human decision should apply");

const convergence = runBoundedRepairSession({
  initialCvVersion: cvVersion,
  initialContentHash: cvHash,
  initialOrchestration: orchestration,
  runRepairStep: ({ iteration, cvVersion: currentVersion, contentHash: currentHash, orchestration: currentOrchestration }) => {
    if (iteration === 1) {
      const step = executeSafeRepairs({
        cvVersion: currentVersion,
        orchestration: currentOrchestration,
        currentCvVersionId: currentVersion.id,
        currentContentHash: currentHash,
        trustedProfileEmail: "candidate@example.com",
        now: "2026-07-13T02:00:00.000Z"
      });
      return {
        status: step.status === "success" ? "changed" : "no-content-diff",
        message: step.message,
        nextCvVersion: step.nextVersion,
        nextContentHash: step.resultingContentHash,
        appliedChangeCount: step.appliedChanges.length,
        affectedReviewFamilies: ["summary", "contact"]
      };
    }
    return {
      status: "changed",
      message: "accepted proposal and human decision applied",
      nextCvVersion: humanApplied.nextVersion,
      nextContentHash: contentHash(humanApplied.nextVersion.tailoredCv),
      appliedChangeCount: 2,
      affectedReviewFamilies: ["summary", "workExperience"]
    };
  },
  refreshAfterRepair: ({ iteration, cvVersion, contentHash }) => ({
    cvVersion,
    contentHash,
    orchestration: iteration === 1
      ? { ...orchestration, cvVersionId: cvVersion.id, cvContentHash: contentHash, totalBlockers: 2, safeAuto: [], approvalRequired: [orchestration.approvalRequired[0]], humanDecision: [orchestration.humanDecision[0]], unsupported: [], recommendedNextRoute: "review-ai-proposals" }
      : { ...orchestration, cvVersionId: cvVersion.id, cvContentHash: contentHash, totalBlockers: 0, safeAuto: [], approvalRequired: [], humanDecision: [], unsupported: [], recommendedNextRoute: "no-available-repair" }
  })
});
assert.equal(convergence.stopReason, "export-ready", "bounded session should converge to export-ready when blockers reach zero");

const repeated = runBoundedRepairSession({
  initialCvVersion: cvVersion,
  initialContentHash: cvHash,
  initialOrchestration: orchestration,
  runRepairStep: ({ cvVersion: currentVersion }) => ({
    status: "changed",
    message: "changed but blockers repeated",
    nextCvVersion: { ...currentVersion, id: `${currentVersion.id}-repeat` },
    nextContentHash: `${cvHash}-repeat`,
    appliedChangeCount: 1,
    affectedReviewFamilies: ["summary"]
  }),
  refreshAfterRepair: ({ cvVersion, contentHash }) => ({ cvVersion, contentHash, orchestration })
});
assert.equal(repeated.stopReason, "repeated-blockers", "repeated blocker set must stop");

const maxLoop = runBoundedRepairSession({
  initialCvVersion: cvVersion,
  initialContentHash: cvHash,
  initialOrchestration: orchestration,
  maxIterations: 1,
  runRepairStep: ({ cvVersion: currentVersion }) => ({
    status: "changed",
    message: "changed",
    nextCvVersion: { ...currentVersion, id: `${currentVersion.id}-max` },
    nextContentHash: `${cvHash}-max`,
    appliedChangeCount: 1,
    affectedReviewFamilies: ["summary"]
  }),
  refreshAfterRepair: ({ cvVersion, contentHash }) => ({ cvVersion, contentHash, orchestration: { ...orchestration, safeAuto: [orchestration.safeAuto[0]], totalBlockers: 1 } })
});
assert.equal(maxLoop.stopReason, "max-loop-reached", "max iteration stop must be reported");

console.log(JSON.stringify({
  ok: true,
  checks: [
    "two safe-auto repairs",
    "two approval-required proposals",
    "one human decision",
    "one unsupported blocker visible",
    "stale orchestrator rejected",
    "stale proposal rejected",
    "safe repairs apply",
    "accepted proposal applies",
    "rejected proposal does not apply",
    "human decision requires user choice",
    "authorized human decision applies",
    "bounded session converges to export-ready",
    "repeated blocker stop",
    "max loop stop",
    "exactly one primary CTA",
    "no AI invocation"
  ]
}, null, 2));
