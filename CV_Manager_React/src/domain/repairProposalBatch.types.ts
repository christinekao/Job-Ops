import type { CvVersion } from "../types";
import type { RepairProposal, RepairProposalStatus } from "./repairProposal.types";

export type RepairProposalBatchStatus = RepairProposalStatus | "manual-edit";

export type RepairProposalBatchItem = {
  proposal: RepairProposal;
  status: RepairProposalBatchStatus;
  sourceCvVersionId: string;
  sourceContentHash: string;
  evidenceIds: string[];
};

export type RepairProposalBatch = {
  id: string;
  sourceCvVersionId: string;
  sourceContentHash: string;
  items: RepairProposalBatchItem[];
};

export type RepairProposalBatchApplyStatus =
  | "success"
  | "stale"
  | "no-accepted-proposals"
  | "no-content-diff"
  | "blocked";

export type RepairProposalAppliedChange = {
  proposalId: string;
  blockerId: string;
  targetZone: string;
  priorValue: string;
  nextValue: string;
  evidenceIds: string[];
};

export type RepairProposalBatchApplyResult = {
  status: RepairProposalBatchApplyStatus;
  message: string;
  batchId: string;
  sourceCvVersionId: string;
  priorContentHash: string;
  resultingContentHash: string;
  appliedChanges: RepairProposalAppliedChange[];
  rejectedProposalIds: string[];
  nextVersion?: CvVersion;
};

export type RepairProposalBatchApplyInput = {
  cvVersion: CvVersion;
  currentCvVersionId: string;
  currentContentHash: string;
  batch: RepairProposalBatch;
  statuses?: Record<string, RepairProposalBatchStatus>;
  now?: string;
};
