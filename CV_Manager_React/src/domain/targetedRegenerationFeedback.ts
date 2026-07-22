import { contentHash } from "../utils/hash";
import type { TargetedRegenerationRequest } from "./targetedRegeneration.types";

export type TargetedRegenerationStrategy = "summary" | "work-bullets" | "wording";

export type TargetedRegenerationOutcome =
  | "success"
  | "no-diff-terminal"
  | "blocked"
  | "error"
  | "stale";

export type RegenerationAttemptIdentity = {
  key: string;
  blockerIds: string[];
  strategy: TargetedRegenerationStrategy;
  targetZones: string[];
  cvContentHash: string;
  effectiveBriefHash: string;
  evidenceContextHash: string;
};

export type TargetedRegenerationAttempt = RegenerationAttemptIdentity & {
  outcome: TargetedRegenerationOutcome;
  attemptCount: number;
  lastAttemptedAt: string;
  finalStopReason: string;
  message: string;
};

export function targetedRegenerationStrategy(request: TargetedRegenerationRequest): TargetedRegenerationStrategy {
  if (request.targetZones.includes("summary")) return "summary";
  if (/wording|recruiter|external|internal/i.test(request.reason)) return "wording";
  return "work-bullets";
}

export function createRegenerationAttemptIdentity(request: TargetedRegenerationRequest): RegenerationAttemptIdentity {
  const strategy = targetedRegenerationStrategy(request);
  const evidenceContextHash = contentHash(request.selectedEvidenceIds);
  const identity = {
    blockerIds: [...request.blockerIds].sort(),
    strategy,
    targetZones: [...request.targetZones].sort(),
    failedSummaryCriterionIds: [...(request.failedSummaryCriterionIds || [])].sort(),
    cvContentHash: request.cvContentHash,
    effectiveBriefHash: request.effectiveCvBriefHash,
    evidenceContextHash
  };
  return {
    ...identity,
    key: contentHash(identity)
  };
}

export function isAttemptForRequest(attempt: TargetedRegenerationAttempt | null | undefined, request: TargetedRegenerationRequest | null | undefined) {
  if (!attempt || !request) return false;
  return attempt.key === createRegenerationAttemptIdentity(request).key;
}

export function isAttemptForCurrentReview(attempt: TargetedRegenerationAttempt | null | undefined, request: TargetedRegenerationRequest | null | undefined) {
  return isAttemptForRequest(attempt, request);
}

export function canDispatchTargetedRegeneration(input: {
  attempt?: TargetedRegenerationAttempt | null;
  request: TargetedRegenerationRequest;
  explicitRetry?: boolean;
}) {
  if (input.explicitRetry) return true;
  return !(isAttemptForRequest(input.attempt, input.request) && input.attempt?.outcome === "no-diff-terminal");
}
