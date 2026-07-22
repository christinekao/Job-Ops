export type ScreeningStepView = "evidence" | "analysis" | "translation" | "selection" | "cv" | "gate" | "reviewer";

export type ScreeningRunState = {
  status?: "idle" | "queued" | "running" | "completed" | "failed" | "cancelled";
  mode?: "generate" | "repair";
  applied?: boolean;
};

export type ScreeningWorkflowInput = {
  careerEvidenceReady: boolean;
  analysisReady: boolean;
  terminologyReady: boolean;
  briefReady: boolean;
  hasCv: boolean;
  cvRunActive: boolean;
  gateIssueCount: number;
  reviewerIssueCount: number;
  reviewerReady: boolean;
  reviewSnapshotValid?: boolean;
  cvVersionCount: number;
  run?: ScreeningRunState;
};

export type ScreeningWorkflowState = {
  recommendedView: ScreeningStepView;
  gateChecked: boolean;
  finalReviewChecked: boolean;
  remainingIssueCount: number;
  repairAllowed: boolean;
  repairLocked: boolean;
  repairLockReason: string;
};

export type PrimaryWorkflowCta = {
  state: "Waiting" | "Running" | "Auto Repairing" | "Needs Approval" | "Ready" | "Export Ready" | "Completed" | "Blocked";
  label: "Generate CV" | "Stop" | "Apply Safe Fix" | "Review AI Repair" | "Open Final Review" | "Export Final CV" | "View Export" | "Resolve blocker";
  reason: string;
  disabled: boolean;
};

export function deriveScreeningWorkflowState(input: ScreeningWorkflowInput): ScreeningWorkflowState {
  const remainingIssueCount = input.gateIssueCount + input.reviewerIssueCount;
  const completedRepair = input.run?.status === "completed" && input.run.applied === true && input.run.mode === "repair";
  const legacyRepeatRun = input.run?.status === "completed" && input.run.applied === true && input.cvVersionCount >= 2;
  const repairLocked = remainingIssueCount > 0 && (completedRepair || legacyRepeatRun);

  let recommendedView: ScreeningStepView = "reviewer";
  if (!input.careerEvidenceReady) recommendedView = "evidence";
  else if (!input.analysisReady) recommendedView = "analysis";
  else if (!input.terminologyReady) recommendedView = "translation";
  else if (!input.briefReady) recommendedView = "selection";
  else if (!input.hasCv || input.cvRunActive) recommendedView = "cv";

  return {
    recommendedView,
    gateChecked: input.hasCv,
    finalReviewChecked: input.hasCv && input.reviewSnapshotValid === true,
    remainingIssueCount,
    repairAllowed: input.hasCv && remainingIssueCount > 0 && !repairLocked && !input.cvRunActive,
    repairLocked,
    repairLockReason: repairLocked
      ? "One AI repair has already been applied. Keep the current CV and resolve only the remaining items manually."
      : ""
  };
}

export function shouldReplaceCurrentCvVersion(hasActiveCv: boolean, mode?: "generate" | "repair") {
  return hasActiveCv && mode === "repair";
}

export function resolvePrimaryWorkflowCta(input: ScreeningWorkflowInput & {
  hasSafeLocalRepair: boolean;
  hasAiRepair: boolean;
  exportReady: boolean;
  exportRecorded?: boolean;
}): PrimaryWorkflowCta {
  if (input.cvRunActive) return { state: "Running", label: "Stop", reason: "A CV workflow run is active.", disabled: false };
  if (input.exportRecorded) return { state: "Completed", label: "View Export", reason: "The current CV export is already recorded.", disabled: false };
  if (!input.careerEvidenceReady || !input.analysisReady || !input.terminologyReady || !input.briefReady) {
    return { state: "Waiting", label: "Generate CV", reason: "The workflow will start from the earliest missing prerequisite.", disabled: false };
  }
  if (!input.hasCv) return { state: "Waiting", label: "Generate CV", reason: "No screening CV exists for the current job.", disabled: false };
  const issueCount = input.gateIssueCount + input.reviewerIssueCount;
  if (input.exportReady && issueCount === 0) return { state: "Export Ready", label: "Export Final CV", reason: "Reviewer and export checks are clear.", disabled: false };
  if (input.reviewerReady && issueCount === 0) return { state: "Ready", label: "Open Final Review", reason: "Current CV passed content checks and is ready for final review.", disabled: false };
  if (issueCount > 0) {
    const repairAlreadyApplied = input.run?.mode === "repair" && input.run.status === "completed" && input.run.applied === true;
    if (input.hasSafeLocalRepair && !repairAlreadyApplied) return { state: "Auto Repairing", label: "Apply Safe Fix", reason: "A bounded no-token repair is available for failed zones.", disabled: false };
    if (input.hasAiRepair && !repairAlreadyApplied) return { state: "Needs Approval", label: "Review AI Repair", reason: "Remaining blockers require an explicit AI repair decision.", disabled: false };
    return { state: "Blocked", label: "Resolve blocker", reason: "Remaining blockers require manual review or explicit override.", disabled: false };
  }
  return { state: "Ready", label: "Open Final Review", reason: "Current CV is ready for final review.", disabled: false };
}
