import type { CvVersion } from "../types";
import type { RepairClassification, RepairOrchestrationSummary } from "./repairOrchestrator.types";

export type SafeRepairExecutionStatus =
  | "success"
  | "stale"
  | "duplicate"
  | "no-content-diff"
  | "blocked";

export type SafeRepairAppliedChange = {
  repairId: string;
  blockerId: string;
  targetZone: string;
  priorValue: string;
  nextValue: string;
  evidenceIds: string[];
};

export type SafeRepairExecutionResult = {
  status: SafeRepairExecutionStatus;
  message: string;
  planKey: string;
  cvVersionId: string;
  priorContentHash: string;
  resultingContentHash: string;
  appliedChanges: SafeRepairAppliedChange[];
  changedZones: string[];
  preservedZones: string[];
  rejectedClassifications: RepairClassification[];
  nextVersion?: CvVersion;
};

export type SafeRepairExecutorInput = {
  cvVersion: CvVersion;
  orchestration: RepairOrchestrationSummary;
  currentCvVersionId: string;
  currentContentHash: string;
  trustedProfileEmail?: string;
  executedPlanKeys?: ReadonlySet<string>;
  now?: string;
};
