import { strict as assert } from "node:assert";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

async function bundle(entry, name) {
  const outfile = join(tmpdir(), `${name}-${Date.now()}.mjs`);
  await build({ entryPoints: [entry], bundle: true, format: "esm", platform: "node", outfile, logLevel: "silent" });
  return import(pathToFileURL(outfile).href);
}

const { bindReviewBlocker } = await bundle("src/domain/reviewFreshness.ts", "blocker-binding");
const { createRegenerationAttemptIdentity, isAttemptForCurrentReview, isAttemptForRequest } = await bundle("src/domain/targetedRegenerationFeedback.ts", "attempt-binding");

const freshnessA = { currentCvVersionId: "cv-a", currentCvContentHash: "hash-a", currentSummaryHash: "summary-a", reviewedCvVersionId: "cv-a", reviewedCvContentHash: "hash-a", reviewedSummaryHash: "summary-a", reviewRunId: "review-a", reviewedAt: "2026-07-16T00:00:00.000Z", status: "fresh" };
const freshnessB = { ...freshnessA, currentCvVersionId: "cv-b", reviewedCvVersionId: "cv-b", currentCvContentHash: "hash-b", reviewedCvContentHash: "hash-b", currentSummaryHash: "summary-b", reviewedSummaryHash: "summary-b", reviewRunId: "review-b" };
const rawBlocker = "Reviewer: hiring manager relevance: Would interview: No · 5 rewrite item(s)";
const blockerA = bindReviewBlocker(rawBlocker, freshnessA);
const blockerARepeat = bindReviewBlocker(rawBlocker, freshnessA);
const blockerB = bindReviewBlocker(rawBlocker, freshnessB);
assert.equal(blockerA.id, blockerARepeat.id, "same review identity must produce stable blocker ID");
assert.notEqual(blockerA.id, blockerB.id, "new review/hash must produce a new blocker ID");
assert.equal(blockerB.sourceReviewRunId, "review-b");
assert.equal(blockerB.sourceReviewedCvHash, "hash-b");

const requestA = { id: "request-a", blockerIds: ["blocker-a"], cvVersionId: "cv-a", cvContentHash: "hash-a", targetZones: ["summary"], selectedEvidenceIds: ["evi-1"], effectiveCvBriefHash: "brief", preservedZones: [], prohibitedZones: [], reason: "summary role fit" };
const requestB = { ...requestA, id: "request-b", blockerIds: ["blocker-b"], cvVersionId: "cv-b", cvContentHash: "hash-b" };
const attempt = {
  ...createRegenerationAttemptIdentity(requestA),
  outcome: "success",
  attemptCount: 1,
  lastAttemptedAt: "2026-07-16T00:01:00.000Z",
  finalStopReason: "content-updated",
  message: "Summary updated"
};
assert.equal(isAttemptForRequest(attempt, requestB), false, "successor request key must differ after CV hash changes");
assert.equal(isAttemptForCurrentReview(attempt, requestB), false, "React attempt state must not own the successor review result");

console.log(JSON.stringify({ ok: true, blockerA: blockerA.id, blockerB: blockerB.id, successorAttemptBound: false, owner: "reviewSnapshot" }, null, 2));
