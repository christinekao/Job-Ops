import type { AppData, CvVersion, JobApplication } from "../types";
import {
  exportVerification,
  hiringManagerReview,
  reviewSnapshotContentHash,
  reviewerPass,
  screeningGate
} from "./screeningReview";
import { resolveReviewFreshness, type ReviewFreshness } from "./reviewFreshness";
import { cvStaleActionForReason, cvStaleReasonForJob } from "../data/selection";

export type ScreeningReviewEvaluation = {
  gate: ReturnType<typeof screeningGate>;
  managerReview: ReturnType<typeof hiringManagerReview>;
  reviewerReview: ReturnType<typeof reviewerPass>;
  exportCheck: ReturnType<typeof exportVerification>;
};

export type ScreeningExportDecision = {
  status: "missing-cv" | "decision-context-required" | "blocked" | "ready";
  ready: boolean;
  decisionContextReady: boolean;
  contentHash?: string;
  blockers: string[];
  warnings: string[];
  reviewFreshness?: ReviewFreshness;
};

export function evaluateScreeningReview(input: {
  data: AppData;
  job: JobApplication;
  cv: CvVersion | undefined;
}): ScreeningReviewEvaluation {
  const gate = screeningGate(input.job, input.cv, input.data.evidenceCards);
  const managerReview = hiringManagerReview(input.job, input.cv, gate, input.data.evidenceCards);
  const reviewerReview = reviewerPass(input.job, input.cv, gate, managerReview, input.data.evidenceCards);
  const exportCheck = exportVerification(input.job, input.cv, gate);
  return { gate, managerReview, reviewerReview, exportCheck };
}

export function resolveScreeningExportDecision(input: {
  data?: AppData;
  job: JobApplication;
  cv: CvVersion | undefined;
  evaluation: ScreeningReviewEvaluation;
  requireFreshReview?: boolean;
}): ScreeningExportDecision {
  const decisionContextReady = Boolean(input.job.screeningAnalysis)
    || (Boolean(input.job.fitReview) && input.job.fit !== "Unknown");
  const cv = input.cv;
  const warnings = (input.evaluation.reviewerReview?.checks || [])
    .filter((check) => check.ok && /application fit risk/i.test(check.label))
    .map((check) => `${check.label}: ${check.value}`);
  const reviewFreshness = resolveReviewFreshness(cv);
  const staleReason = input.data ? cvStaleReasonForJob(cv, input.job, input.data) : null;
  if (cv?.tailoredCv && staleReason) {
    return {
      status: "blocked",
      ready: false,
      decisionContextReady,
      contentHash: reviewFreshness.currentCvContentHash,
      blockers: [`Current CV inputs are stale (${staleReason}). ${cvStaleActionForReason(staleReason)}`],
      warnings,
      reviewFreshness
    };
  }
  if (cv?.tailoredCv && input.requireFreshReview && reviewFreshness.status !== "fresh") {
    return {
      status: "blocked",
      ready: false,
      decisionContextReady,
      contentHash: reviewFreshness.currentCvContentHash,
      blockers: ["Review is out of date for the current CV. Recheck Updated CV before export."],
      warnings,
      reviewFreshness
    };
  }
  const blockers = [
    ...(decisionContextReady ? [] : ["Job decision context: run Screening Analysis or complete a valid Fit Review"]),
    ...(input.evaluation.reviewerReview?.blockers || []),
    ...(input.evaluation.exportCheck?.blockers || [])
  ];
  if (!cv?.tailoredCv) {
    return { status: "missing-cv", ready: false, decisionContextReady, blockers: ["No Screening CV exists for this job"], warnings, reviewFreshness };
  }
  if (!decisionContextReady) {
    return {
      status: "decision-context-required",
      ready: false,
      decisionContextReady,
      contentHash: reviewSnapshotContentHash(cv),
      blockers,
      warnings,
      reviewFreshness
    };
  }
  if (blockers.length) {
    return {
      status: "blocked",
      ready: false,
      decisionContextReady,
      contentHash: reviewSnapshotContentHash(cv),
      blockers,
      warnings,
      reviewFreshness
    };
  }
  return {
    status: "ready",
    ready: true,
    decisionContextReady,
    contentHash: reviewSnapshotContentHash(cv),
    blockers: [],
    warnings,
    reviewFreshness
  };
}
