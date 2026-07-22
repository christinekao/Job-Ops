import type { BlockerEditTarget } from "../components/cv/guidedEditing";
import type { ReviewerIssue } from "../types";

export type RepairRoute = "safe-auto" | "approval-required" | "targeted-regeneration" | "human-input" | "human-decision" | "unsupported";

export type RepairOrchestratorRisk = "low" | "medium" | "high";

export type RepairOrchestratorConfidence = "high" | "medium" | "low" | "not-available";

export type RecommendedRepairRoute =
  | "run-safe-repair"
  | "review-ai-proposals"
  | "run-targeted-regeneration"
  | "collect-human-input"
  | "resolve-human-decision"
  | "no-available-repair";

export type RepairClassification = {
  blockerId: string;
  reviewerIssueId?: string;
  source: "structured-reviewer-contract" | "legacy-blocker";
  route: RepairRoute;
  reason: string;
  rawBlocker: string;
  reviewerCategory?: ReviewerIssue["category"];
  reviewerSeverity?: ReviewerIssue["severity"];
  reviewerRepairability?: ReviewerIssue["repairability"];
  suggestedRepairIntent?: string;
  target?: BlockerEditTarget;
  evidenceIds: string[];
  cvVersionId: string;
  cvContentHash: string;
  risk: RepairOrchestratorRisk;
  confidence: RepairOrchestratorConfidence;
  allowedMutationZones: string[];
  prohibitedMutationZones: string[];
  requiresUserApproval: boolean;
  canUseExistingLocalRepair: boolean;
  canRequestAiProposal: boolean;
  canRunTargetedRegeneration: boolean;
  requiresHumanInput: boolean;
  unsupportedReason?: string;
};

export type RepairOrchestrationSummary = {
  cvVersionId: string;
  cvContentHash: string;
  totalBlockers: number;
  safeAuto: RepairClassification[];
  approvalRequired: RepairClassification[];
  targetedRegeneration: RepairClassification[];
  humanInput: RepairClassification[];
  humanDecision: RepairClassification[];
  unsupported: RepairClassification[];
  recommendedNextRoute: RecommendedRepairRoute;
};

export type RepairOrchestrationInput = {
  cvVersionId: string;
  cvContentHash: string;
  blockers: string[];
  structuredIssues?: ReviewerIssue[];
  cv?: import("../types").TailoredCv;
  trustedProfileEmail?: string;
  selectedEvidenceIds?: string[];
  effectiveCvBriefHash?: string;
};

export type RepairClassificationIdentity = {
  cvVersionId: string;
  cvContentHash: string;
};
