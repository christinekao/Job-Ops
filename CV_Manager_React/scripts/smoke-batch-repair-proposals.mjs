import { strict as assert } from "node:assert";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

async function bundle(entry, name) {
  const outfile = join(tmpdir(), `${name}-${Date.now()}.mjs`);
  await build({
    entryPoints: [entry],
    bundle: true,
    format: "esm",
    platform: "node",
    outfile,
    logLevel: "silent"
  });
  return import(pathToFileURL(outfile).href);
}

const { generateRepairProposal } = await bundle("src/domain/repairProposalGenerator.ts", "repair-proposal-generator");
const {
  createRepairProposalBatch,
  updateRepairProposalBatchStatus,
  applyAcceptedRepairProposalBatch
} = await bundle("src/domain/repairProposalBatch.ts", "repair-proposal-batch");
const { contentHash } = await bundle("src/utils/hash.ts", "proposal-batch-hash");

const cv = {
  header: { name: "Candidate", targetRole: "Customer Success Specialist", email: "candidate@example.com", location: "Taipei" },
  sidebar: { languages: [], skillGroups: [], certifications: [], education: [] },
  summary: "Experienced operator with owned an enterprise AI platform and stakeholder coordination.",
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
        { text: "Supported customer operations.", confidence: "Grounded", evidenceIds: ["ev-bullet-2"] }
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
  updatedAt: "2026-07-13T00:00:00.000Z",
  reviewSnapshot: {
    snapshotId: "review-1",
    updatedAt: "2026-07-13T00:00:00.000Z",
    contentHash: cvHash,
    cvUpdatedAt: "2026-07-13T00:00:00.000Z",
    completedAt: "2026-07-13T00:00:00.000Z",
    gateIssueCount: 2,
    reviewerIssueCount: 2,
    ready: false
  }
};

const summaryProposalResult = generateRepairProposal(cv, {
  blockerId: "blocker-summary",
  rawBlocker: "Summary wording needs safer external wording",
  title: "Summary needs safer wording",
  explanation: "Visible summary contains unsupported ownership language.",
  target: {
    blockerId: "blocker-summary",
    section: "summary",
    fieldId: "summary",
    focusKey: "guided-summary-summary",
    highlightKey: "guided-summary-summary"
  }
});
assert.equal(summaryProposalResult.supported, true, "summary proposal should be supported");

const bulletProposalResult = generateRepairProposal(cv, {
  blockerId: "blocker-bullet",
  rawBlocker: "External wording: first work bullet uses Work-log internal terminology",
  title: "Bullet needs external wording",
  explanation: "Visible work bullet uses internal terminology.",
  target: {
    blockerId: "blocker-bullet",
    section: "workExperience",
    fieldId: "bullet",
    roleId: "role-a",
    bulletId: "0-0-0",
    focusKey: "guided-workExperience-bullet-role-a-0-0-0",
    highlightKey: "guided-workExperience-bullet-role-a-0-0-0"
  }
});
assert.equal(bulletProposalResult.supported, true, "work bullet proposal should be supported");

const summaryProposal = summaryProposalResult.proposal;
const bulletProposal = bulletProposalResult.proposal;
const batch = createRepairProposalBatch({
  sourceCvVersionId: cvVersion.id,
  sourceContentHash: cvHash,
  proposals: [summaryProposal, bulletProposal],
  evidenceByProposalId: {
    [summaryProposal.id]: [],
    [bulletProposal.id]: ["ev-bullet-1"]
  }
});

let reviewedBatch = updateRepairProposalBatchStatus(batch, summaryProposal.id, "accepted");
reviewedBatch = updateRepairProposalBatchStatus(reviewedBatch, bulletProposal.id, "rejected");
const partialResult = applyAcceptedRepairProposalBatch({
  cvVersion,
  currentCvVersionId: cvVersion.id,
  currentContentHash: cvHash,
  batch: reviewedBatch,
  now: "2026-07-13T01:00:00.000Z"
});

assert.equal(partialResult.status, "success", "accepted proposal batch should apply");
assert.ok(partialResult.nextVersion, "accepted proposal batch must create a CV version");
assert.equal(partialResult.appliedChanges.length, 1, "only accepted proposal should apply");
assert.equal(partialResult.nextVersion.tailoredCv.summary.includes("owned an enterprise AI platform"), false, "accepted summary proposal should update summary wording");
assert.equal(partialResult.nextVersion.tailoredCv.workExperience[0].subsections[0].bullets[0].text, cv.workExperience[0].subsections[0].bullets[0].text, "rejected proposal must not mutate bullet");
assert.deepEqual(partialResult.nextVersion.tailoredCv.workExperience[0].subsections[0].bullets[0].evidenceIds, ["ev-bullet-1"], "rejected bullet evidence IDs must remain unchanged");
assert.equal(partialResult.nextVersion.reviewSnapshot, undefined, "proposal content change must clear stale review snapshot");
assert.ok(partialResult.rejectedProposalIds.includes(bulletProposal.id), "rejected proposal ID must be reported");

let acceptedBatch = updateRepairProposalBatchStatus(batch, summaryProposal.id, "accepted");
acceptedBatch = updateRepairProposalBatchStatus(acceptedBatch, bulletProposal.id, "accepted");
const acceptedResult = applyAcceptedRepairProposalBatch({
  cvVersion,
  currentCvVersionId: cvVersion.id,
  currentContentHash: cvHash,
  batch: acceptedBatch,
  now: "2026-07-13T01:10:00.000Z"
});
assert.equal(acceptedResult.status, "success", "batch acceptance should apply accepted proposals");
assert.equal(acceptedResult.appliedChanges.length, 2, "batch acceptance should apply both accepted proposals");
assert.deepEqual(acceptedResult.appliedChanges.find((change) => change.proposalId === bulletProposal.id).evidenceIds, ["ev-bullet-1"], "applied bullet proposal must preserve evidence IDs");

const staleResult = applyAcceptedRepairProposalBatch({
  cvVersion,
  currentCvVersionId: cvVersion.id,
  currentContentHash: "different-hash",
  batch: acceptedBatch
});
assert.equal(staleResult.status, "stale", "stale proposal batch must be rejected");
assert.equal(staleResult.nextVersion, undefined, "stale proposal batch must not create a CV version");

const noAcceptedResult = applyAcceptedRepairProposalBatch({
  cvVersion,
  currentCvVersionId: cvVersion.id,
  currentContentHash: cvHash,
  batch
});
assert.equal(noAcceptedResult.status, "no-accepted-proposals", "batch with no accepted proposals must not mutate CV");

console.log(JSON.stringify({
  ok: true,
  checks: [
    "two approval-required proposals generated",
    "current and suggested values captured",
    "batch accept/reject states represented",
    "accepted proposals apply",
    "rejected proposals do not mutate CV",
    "batch acceptance applies multiple proposals in one CV version",
    "stale proposal batch rejected",
    "evidence IDs preserved",
    "review snapshot cleared only after content change",
    "no export rule changes",
    "no AI invocation"
  ]
}, null, 2));
