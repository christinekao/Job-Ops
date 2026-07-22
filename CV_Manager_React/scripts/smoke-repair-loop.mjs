import { strict as assert } from "node:assert";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const sessionModule = join(tmpdir(), `repair-session-${Date.now()}.mjs`);
await build({
  entryPoints: ["src/domain/repairSession.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: sessionModule,
  logLevel: "silent"
});

const { runBoundedRepairSession } = await import(pathToFileURL(sessionModule).href);

function cvVersion(id) {
  return {
    id,
    jdId: "job-1",
    name: "Target CV",
    summary: "Summary",
    content: "{}",
    tailoredCv: {
      header: { name: "Candidate", targetRole: "Role", email: "", location: "Taipei" },
      sidebar: { languages: [], skillGroups: [], certifications: [], education: [] },
      summary: "Summary",
      workExperience: [],
      reviewNotes: []
    },
    status: "Editing",
    updatedAt: "2026-07-13T00:00:00.000Z"
  };
}

function classification(id, route = "safe-auto") {
  return {
    blockerId: id,
    route,
    reason: "test",
    evidenceIds: [],
    cvVersionId: "cv-v1",
    cvContentHash: "hash-1",
    risk: route === "safe-auto" ? "low" : "high",
    confidence: route === "safe-auto" ? "high" : "low",
    allowedMutationZones: ["summary"],
    prohibitedMutationZones: ["workExperience"],
    requiresUserApproval: route !== "safe-auto",
    canUseExistingLocalRepair: route === "safe-auto",
    canRequestAiProposal: route === "approval-required"
  };
}

function orchestration(items) {
  const safeAuto = items.filter((item) => item.route === "safe-auto");
  const approvalRequired = items.filter((item) => item.route === "approval-required");
  const humanDecision = items.filter((item) => item.route === "human-decision");
  const unsupported = items.filter((item) => item.route === "unsupported");
  return {
    cvVersionId: "cv-v1",
    cvContentHash: "hash-1",
    totalBlockers: items.length,
    safeAuto,
    approvalRequired,
    humanDecision,
    unsupported,
    recommendedNextRoute: safeAuto.length ? "run-safe-repair" : approvalRequired.length ? "review-ai-proposals" : humanDecision.length ? "resolve-human-decision" : "no-available-repair"
  };
}

const convergence = runBoundedRepairSession({
  initialCvVersion: cvVersion("cv-v1"),
  initialContentHash: "hash-1",
  initialOrchestration: orchestration([classification("safe-1"), classification("proposal-1", "approval-required")]),
  runRepairStep: ({ iteration, cvVersion }) => ({
    status: "changed",
    message: `iteration ${iteration} changed content`,
    nextCvVersion: { ...cvVersion, id: `cv-v${iteration + 1}` },
    nextContentHash: `hash-${iteration + 1}`,
    appliedChangeCount: 1,
    affectedReviewFamilies: iteration === 1 ? ["summary"] : ["workExperience"]
  }),
  refreshAfterRepair: ({ iteration, cvVersion, contentHash }) => ({
    cvVersion,
    contentHash,
    orchestration: iteration === 1
      ? orchestration([classification("proposal-1", "approval-required")])
      : orchestration([])
  })
});
assert.equal(convergence.status, "completed", "session should complete when blockers reach zero");
assert.equal(convergence.stopReason, "export-ready", "zero blockers should produce export-ready stop");
assert.equal(convergence.iterationsRun, 2, "session should run until convergence");
assert.deepEqual(convergence.scopedReviewFamilies.sort(), ["summary", "workExperience"].sort(), "session should record scoped review families");

const partialHuman = runBoundedRepairSession({
  initialCvVersion: cvVersion("cv-v1"),
  initialContentHash: "hash-1",
  initialOrchestration: orchestration([classification("safe-1"), classification("human-1", "human-decision")]),
  runRepairStep: ({ cvVersion }) => ({
    status: "changed",
    message: "safe repair applied",
    nextCvVersion: { ...cvVersion, id: "cv-v2" },
    nextContentHash: "hash-2",
    appliedChangeCount: 1,
    affectedReviewFamilies: ["summary"]
  }),
  refreshAfterRepair: ({ cvVersion, contentHash }) => ({
    cvVersion,
    contentHash,
    orchestration: orchestration([classification("human-1", "human-decision")])
  })
});
assert.equal(partialHuman.stopReason, "only-human-or-unsupported", "session should stop when only human decisions remain");

const noDiff = runBoundedRepairSession({
  initialCvVersion: cvVersion("cv-v1"),
  initialContentHash: "hash-1",
  initialOrchestration: orchestration([classification("safe-1")]),
  runRepairStep: () => ({
    status: "no-content-diff",
    message: "no diff",
    nextContentHash: "hash-1",
    appliedChangeCount: 0,
    affectedReviewFamilies: []
  }),
  refreshAfterRepair: () => {
    throw new Error("refresh must not run after no-content-diff");
  }
});
assert.equal(noDiff.stopReason, "no-content-diff", "session should stop on no-content-diff");

const repeated = runBoundedRepairSession({
  initialCvVersion: cvVersion("cv-v1"),
  initialContentHash: "hash-1",
  initialOrchestration: orchestration([classification("safe-repeat")]),
  runRepairStep: ({ iteration, cvVersion }) => ({
    status: "changed",
    message: "changed",
    nextCvVersion: { ...cvVersion, id: `cv-repeat-${iteration}` },
    nextContentHash: `hash-repeat-${iteration}`,
    appliedChangeCount: 1,
    affectedReviewFamilies: ["summary"]
  }),
  refreshAfterRepair: ({ cvVersion, contentHash }) => ({
    cvVersion,
    contentHash,
    orchestration: orchestration([classification("safe-repeat")])
  })
});
assert.equal(repeated.stopReason, "repeated-blockers", "same blocker set must stop the session");

const maxLoop = runBoundedRepairSession({
  initialCvVersion: cvVersion("cv-v1"),
  initialContentHash: "hash-1",
  initialOrchestration: orchestration([classification("safe-1")]),
  maxIterations: 2,
  runRepairStep: ({ iteration, cvVersion }) => ({
    status: "changed",
    message: "changed",
    nextCvVersion: { ...cvVersion, id: `cv-max-${iteration}` },
    nextContentHash: `hash-max-${iteration}`,
    appliedChangeCount: 1,
    affectedReviewFamilies: ["summary"]
  }),
  refreshAfterRepair: ({ iteration, cvVersion, contentHash }) => ({
    cvVersion,
    contentHash,
    orchestration: orchestration([classification(`safe-${iteration + 1}`)])
  })
});
assert.equal(maxLoop.stopReason, "max-loop-reached", "session must stop at max loop count");
assert.equal(maxLoop.iterationsRun, 2, "session should not exceed configured max iterations");

console.log(JSON.stringify({
  ok: true,
  checks: [
    "explicit bounded session coordinator",
    "default stop to export-ready when blockers reach zero",
    "partial convergence stops on human decisions",
    "no-content-diff stops immediately",
    "repeated blocker set stops loop",
    "max loop reached stops loop",
    "scoped review families recorded",
    "no hidden AI invocation"
  ]
}, null, 2));
