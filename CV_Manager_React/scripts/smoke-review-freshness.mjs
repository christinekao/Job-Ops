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

const { resolveReviewFreshness } = await bundle("src/domain/reviewFreshness.ts", "review-freshness");
const { reviewSnapshotContentHash } = await bundle("src/domain/screeningReview.ts", "review-freshness-hash");
const { resolveScreeningExportDecision } = await bundle("src/domain/screeningExportDecision.ts", "review-freshness-export");

const tailoredCv = {
  header: { name: "Alex Chen", targetRole: "Automation Specialist", email: "alex@example.com", location: "Taipei" },
  sidebar: { languages: [], skillGroups: [], certifications: [], education: [] },
  summary: "Evidence-backed automation specialist.",
  workExperience: [], keywordPlacementNotes: [], interviewNotes: [], reviewNotes: []
};
const cv = { id: "cv-fresh-1", jdId: "job-1", name: "CV", summary: tailoredCv.summary, content: JSON.stringify(tailoredCv), tailoredCv, status: "Ready for Review", updatedAt: "2026-07-16T00:00:00.000Z" };
const cvHash = reviewSnapshotContentHash(cv);
const reviewed = {
  ...cv,
  reviewSnapshot: {
    snapshotId: "review-run-a",
    reviewRunId: "review-run-a",
    updatedAt: "2026-07-16T00:01:00.000Z",
    contentHash: cvHash,
    reviewedCvVersionId: cv.id,
    reviewedCvContentHash: cvHash,
    reviewedSummaryHash: resolveReviewFreshness({ ...cv, reviewSnapshot: { snapshotId: "legacy", contentHash: cvHash, cvUpdatedAt: cv.updatedAt, completedAt: cv.updatedAt, gateIssueCount: 0, reviewerIssueCount: 0, ready: true } }).currentSummaryHash,
    freshnessStatus: "fresh",
    cvUpdatedAt: cv.updatedAt,
    completedAt: "2026-07-16T00:01:00.000Z",
    gateIssueCount: 0,
    reviewerIssueCount: 0,
    ready: true
  }
};

assert.equal(resolveReviewFreshness(reviewed).status, "fresh");
assert.equal(resolveReviewFreshness({ ...reviewed, updatedAt: "2026-07-16T00:05:00.000Z" }).status, "fresh", "timestamp-only changes must not stale review");
const changedSummary = { ...reviewed, summary: "Changed", content: "Changed", tailoredCv: { ...tailoredCv, summary: "Changed" } };
assert.equal(resolveReviewFreshness(changedSummary).status, "stale", "content change must stale the old review");
assert.equal(resolveReviewFreshness({ ...cv, reviewSnapshot: undefined }).status, "stale", "missing review must be stale");
const legacy = { ...cv, reviewSnapshot: { snapshotId: "legacy", updatedAt: cv.updatedAt, contentHash: null, cvUpdatedAt: cv.updatedAt, completedAt: cv.updatedAt, gateIssueCount: 0, reviewerIssueCount: 0, ready: true } };
assert.equal(resolveReviewFreshness(legacy).status, "fresh", "legacy null hash remains valid and is lazily bound to current content");

const job = { id: "job-1", screeningAnalysis: {}, fit: "Unknown" };
const evaluation = { gate: null, managerReview: null, reviewerReview: { ready: true, blockers: [], checks: [] }, exportCheck: { ready: true, blockers: [], checks: [] } };
const staleDecision = resolveScreeningExportDecision({ job, cv: changedSummary, evaluation, requireFreshReview: true });
assert.equal(staleDecision.ready, false);
assert.match(staleDecision.blockers.join(" "), /Review is out of date/);
const freshDecision = resolveScreeningExportDecision({ job, cv: reviewed, evaluation, requireFreshReview: true });
assert.equal(freshDecision.ready, true);

console.log(JSON.stringify({ ok: true, checked: ["version/hash freshness", "timestamp-only stable", "content change stale", "legacy compatible", "stale export blocked"] }, null, 2));
