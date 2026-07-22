import type { BlockerEditTarget } from "../components/cv/guidedEditing";

export type RepairProposalRisk = "low" | "medium" | "unsupported";

export type RepairProposalConfidence = "high" | "medium" | "low";

export type RepairProposalStatus = "draft" | "accepted" | "rejected" | "manual-edit";

export type RepairProposal = {
  id: string;
  blockerId: string;
  target: BlockerEditTarget;
  currentValue: string;
  suggestedValue: string;
  reason: string;
  risk: RepairProposalRisk;
  confidence: RepairProposalConfidence;
  estimatedImpact: string;
  affectedSection: string;
  status: RepairProposalStatus;
};

export type RepairProposalInput = {
  blockerId: string;
  rawBlocker: string;
  title: string;
  explanation: string;
  target: BlockerEditTarget | null;
  currentValue?: string;
  deterministicEmail?: string;
};

export type RepairProposalResult =
  | { supported: true; proposal: RepairProposal }
  | { supported: false; reason: string };
