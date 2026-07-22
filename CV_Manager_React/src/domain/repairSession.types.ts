import type { CvVersion } from "../types";
import type { RepairOrchestrationSummary } from "./repairOrchestrator.types";

export type RepairSessionStopReason =
  | "export-ready"
  | "only-human-or-unsupported"
  | "no-content-diff"
  | "repeated-blockers"
  | "max-loop-reached"
  | "budget-reached"
  | "unsafe-stop";

export type RepairSessionReviewFamily =
  | "contact"
  | "summary"
  | "workExperience"
  | "evidence"
  | "export";

export type RepairSessionStepInput = {
  iteration: number;
  cvVersion: CvVersion;
  contentHash: string;
  orchestration: RepairOrchestrationSummary;
};

export type RepairSessionStepResult = {
  status: "changed" | "no-content-diff" | "unsafe-stop" | "budget-reached";
  message: string;
  nextCvVersion?: CvVersion;
  nextContentHash: string;
  appliedChangeCount: number;
  affectedReviewFamilies: RepairSessionReviewFamily[];
};

export type RepairSessionRefreshResult = {
  cvVersion: CvVersion;
  contentHash: string;
  orchestration: RepairOrchestrationSummary;
};

export type RepairSessionIterationRecord = {
  iteration: number;
  priorBlockerCount: number;
  nextBlockerCount: number;
  appliedChangeCount: number;
  affectedReviewFamilies: RepairSessionReviewFamily[];
  message: string;
};

export type RepairSessionResult = {
  status: "completed" | "stopped";
  stopReason: RepairSessionStopReason;
  iterationsRun: number;
  finalCvVersion: CvVersion;
  finalContentHash: string;
  finalOrchestration: RepairOrchestrationSummary;
  records: RepairSessionIterationRecord[];
  scopedReviewFamilies: RepairSessionReviewFamily[];
};

export type RepairSessionInput = {
  initialCvVersion: CvVersion;
  initialContentHash: string;
  initialOrchestration: RepairOrchestrationSummary;
  maxIterations?: number;
  maxAppliedChanges?: number;
  runRepairStep: (input: RepairSessionStepInput) => RepairSessionStepResult;
  refreshAfterRepair: (input: {
    iteration: number;
    cvVersion: CvVersion;
    contentHash: string;
    affectedReviewFamilies: RepairSessionReviewFamily[];
  }) => RepairSessionRefreshResult;
};
