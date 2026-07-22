import type { CvVersion } from "../types";
import { contentHash } from "../utils/hash";
import { reviewSnapshotContentHash } from "./screeningReview";

export type ReviewFreshnessStatus = "fresh" | "stale" | "running" | "failed";

export type ReviewFreshness = {
  currentCvVersionId: string;
  currentCvContentHash: string;
  currentSummaryHash: string;
  reviewedCvVersionId: string;
  reviewedCvContentHash: string;
  reviewedSummaryHash: string;
  reviewRunId: string;
  reviewedAt: string;
  status: ReviewFreshnessStatus;
};

export type ReviewBoundBlocker = {
  id: string;
  rawBlocker: string;
  reviewerFamily: string;
  targetZone: string;
  failureIdentity: string;
  sourceReviewRunId: string;
  sourceReviewedCvHash: string;
};

function summaryHash(cv: CvVersion | undefined) {
  return contentHash(cv?.tailoredCv?.summary || cv?.sections?.summary || cv?.summary || "");
}

export function resolveReviewFreshness(
  cv: CvVersion | undefined,
  statusOverride?: Exclude<ReviewFreshnessStatus, "fresh" | "stale">
): ReviewFreshness {
  const currentCvVersionId = cv?.id || "";
  const currentCvContentHash = cv ? reviewSnapshotContentHash(cv) : "";
  const currentSummaryHash = summaryHash(cv);
  const snapshot = cv?.reviewSnapshot;
  const reviewedCvVersionId = snapshot?.reviewedCvVersionId || (snapshot ? currentCvVersionId : "");
  const reviewedCvContentHash = snapshot?.reviewedCvContentHash || snapshot?.contentHash || (snapshot ? currentCvContentHash : "");
  const reviewedSummaryHash = snapshot?.reviewedSummaryHash || (snapshot ? currentSummaryHash : "");
  const reviewRunId = snapshot?.reviewRunId || snapshot?.snapshotId || "";
  const reviewedAt = snapshot?.updatedAt || snapshot?.completedAt || "";
  const identityMatches = Boolean(
    snapshot
    && reviewedCvVersionId === currentCvVersionId
    && reviewedCvContentHash === currentCvContentHash
    && reviewedSummaryHash === currentSummaryHash
  );
  const status = statusOverride || (snapshot?.freshnessStatus === "failed" ? "failed" : identityMatches ? "fresh" : "stale");
  return {
    currentCvVersionId,
    currentCvContentHash,
    currentSummaryHash,
    reviewedCvVersionId,
    reviewedCvContentHash,
    reviewedSummaryHash,
    reviewRunId,
    reviewedAt,
    status
  };
}

function blockerFamily(rawBlocker: string) {
  if (/hiring manager relevance|manager relevance|role fit/i.test(rawBlocker)) return "hiring-manager";
  if (/contact|email|ats|pdf|export/i.test(rawBlocker)) return "export";
  if (/evidence|unsupported claim|weak claim/i.test(rawBlocker)) return "evidence";
  if (/wording|terminology/i.test(rawBlocker)) return "wording";
  return "reviewer";
}

function blockerZone(rawBlocker: string) {
  if (/summary|role fit|manager relevance/i.test(rawBlocker)) return "summary";
  if (/contact|email/i.test(rawBlocker)) return "header.contact";
  if (/work|bullet|achievement|evidence|wording/i.test(rawBlocker)) return "workExperience";
  return "review";
}

function normalizedFailureIdentity(rawBlocker: string) {
  return rawBlocker
    .toLowerCase()
    .replace(/\b\d+\b/g, "#")
    .replace(/[^a-z0-9#.]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96);
}

export function bindReviewBlocker(
  rawBlocker: string,
  freshness: ReviewFreshness,
  overrides: { reviewerFamily?: string; targetZone?: string } = {}
): ReviewBoundBlocker {
  const reviewerFamily = overrides.reviewerFamily || blockerFamily(rawBlocker);
  const targetZone = overrides.targetZone || blockerZone(rawBlocker);
  const failureIdentity = normalizedFailureIdentity(rawBlocker);
  return {
    id: `review-blocker-${contentHash({
      reviewRunId: freshness.reviewRunId,
      reviewedCvContentHash: freshness.reviewedCvContentHash,
      reviewerFamily,
      targetZone,
      failureIdentity
    }).slice(1)}`,
    rawBlocker,
    reviewerFamily,
    targetZone,
    failureIdentity,
    sourceReviewRunId: freshness.reviewRunId,
    sourceReviewedCvHash: freshness.reviewedCvContentHash
  };
}

export function recordSummaryRepairReview(input: {
  previousCv: CvVersion;
  nextCv: CvVersion;
  summaryBlocker?: string;
  reviewerReason?: string;
  failedCriteria?: string[];
}): NonNullable<CvVersion["reviewSnapshot"]> {
  if (!input.nextCv.reviewSnapshot) throw new Error("A current review snapshot is required before recording a repair result.");
  const next = resolveReviewFreshness(input.nextCv);
  const blocker = input.summaryBlocker
    ? bindReviewBlocker(input.summaryBlocker, next, { reviewerFamily: "hiring-manager", targetZone: "summary" })
    : undefined;
  return {
    ...input.nextCv.reviewSnapshot,
    repairTargetZone: "summary",
    repairOutcome: blocker ? "still-failed" : "passed",
    repairPreviousValue: input.previousCv.tailoredCv?.summary || input.previousCv.summary,
    repairUpdatedValue: input.nextCv.tailoredCv?.summary || input.nextCv.summary,
    repairReviewerReason: input.reviewerReason || input.summaryBlocker || "The updated Summary passed the current role-fit review.",
    repairFailedCriteria: input.failedCriteria || [],
    repairPreviousSummaryReview: input.previousCv.reviewSnapshot?.summaryReviewResult,
    repairUpdatedSummaryReview: input.nextCv.reviewSnapshot.summaryReviewResult,
    repairBlockerId: blocker?.id,
    repairBlockerReviewRunId: blocker?.sourceReviewRunId,
    repairBlockerReviewedCvHash: blocker?.sourceReviewedCvHash
  };
}
