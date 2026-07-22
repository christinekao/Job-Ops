import type { CvVersion } from "../types";
import type { RepairClassification } from "./repairOrchestrator.types";

export type HumanDecisionOption = {
  id: string;
  label: string;
  description: string;
  evidenceIds: string[];
  downstreamImpact: string;
  authorizedChange?: {
    targetZone: "summary" | "workExperience";
    nextValue: string;
  };
};

export type HumanDecisionPrompt = {
  id: string;
  blockerId: string;
  question: string;
  whyAiCannotDecide: string;
  targetZone: string;
  options: HumanDecisionOption[];
};

export type HumanDecisionApplyResult = {
  status: "applied" | "requires-user-choice" | "stale" | "blocked" | "no-content-diff";
  message: string;
  decisionId: string;
  selectedOptionId?: string;
  priorContentHash: string;
  resultingContentHash: string;
  changedZones: string[];
  evidenceIds: string[];
  nextVersion?: CvVersion;
};

export type HumanDecisionApplyInput = {
  cvVersion: CvVersion;
  currentCvVersionId: string;
  currentContentHash: string;
  prompt: HumanDecisionPrompt;
  selectedOptionId?: string;
  now?: string;
};

export type HumanDecisionPromptInput = {
  classification: RepairClassification;
  currentSummary?: string;
  evidenceIds?: string[];
};
