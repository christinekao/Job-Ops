import type { ScreeningStepView } from "./screeningWorkflow";

export type WorkflowChecklistStatus = "DONE" | "NEEDS_ACTION" | "READY" | "IN_PROGRESS" | "LOCKED" | "STALE" | "NOT_STARTED" | "ERROR";
export type WorkflowChecklistStepId = "evidence" | "analysis" | "positioning" | "brief" | "cv" | "gate" | "manager";

export type WorkflowChecklistStep = {
  id: WorkflowChecklistStepId;
  view: ScreeningStepView;
  title: string;
  status: WorkflowChecklistStatus;
  detail: string;
  historicalDetail?: string;
};

export type WorkflowChecklistInput = {
  careerEvidenceReady: boolean;
  analysisCurrent: boolean;
  positioningCurrent: boolean;
  briefCurrent: boolean;
  analysisRunning: boolean;
  hardBlock: boolean;
  manualOverrideAllowed: boolean;
  fitTier?: string;
  generationRecommendation?: string;
  cvRunActive: boolean;
  currentCv: boolean;
  hasHistoricalCv: boolean;
  gateReview: { current: boolean; historical: boolean; status: "fresh" | "stale" | "missing" | "running" | "failed" };
  managerAts: { current: boolean; status: "fresh" | "stale" | "missing" | "running" | "failed" };
};

export type WorkflowChecklistState = {
  steps: WorkflowChecklistStep[];
  currentStepId: WorkflowChecklistStepId;
  lowFitContinuationAllowed: boolean;
};

function step(id: WorkflowChecklistStepId, view: ScreeningStepView, title: string, status: WorkflowChecklistStatus, detail: string, historicalDetail?: string): WorkflowChecklistStep {
  return { id, view, title, status, detail, historicalDetail };
}

/**
 * Presentation-only selector. It accepts existing identity/freshness facts and
 * never stores a second workflow state or changes Fit/review policy.
 */
export function deriveWorkflowChecklistState(input: WorkflowChecklistInput): WorkflowChecklistState {
  const lowFitContinuationAllowed = input.fitTier === "LOW_FIT" && !input.hardBlock && input.manualOverrideAllowed;
  const evidence = input.careerEvidenceReady
    ? step("evidence", "evidence", "Career Evidence", "DONE", "Done · evidence bank usable")
    : step("evidence", "evidence", "Career Evidence", "NEEDS_ACTION", "Needs action · strengthen evidence bank");
  const analysis = !input.careerEvidenceReady
    ? step("analysis", "analysis", "JD Analysis", "LOCKED", "Locked · waiting for usable Career Evidence")
    : input.analysisRunning
      ? step("analysis", "analysis", "JD Analysis", "IN_PROGRESS", "In progress · analyzing the current JD")
      : input.analysisCurrent
        ? step("analysis", "analysis", "JD Analysis", "DONE", `Done · ${input.fitTier || "fit evaluated"}`)
        : step("analysis", "analysis", "JD Analysis", "NEEDS_ACTION", "Needs action · run analysis for the current JD");
  const positioning = !input.analysisCurrent
    ? step("positioning", "translation", "Positioning + Gaps", "LOCKED", "Locked · waiting for current JD Analysis")
    : input.positioningCurrent
      ? step("positioning", "translation", "Positioning + Gaps", "DONE", "Done · positioning and gaps reviewed")
      : step("positioning", "translation", "Positioning + Gaps", "NEEDS_ACTION", "Needs action · review current positioning and gaps");
  const brief = !input.positioningCurrent
    ? step("brief", "selection", "CV Brief + Evidence", "LOCKED", "Locked · waiting for Positioning + Gaps")
    : input.hardBlock || !input.manualOverrideAllowed
      ? step("brief", "selection", "CV Brief + Evidence", "LOCKED", "Locked · a current hard block prevents CV generation")
      : input.briefCurrent
        ? step("brief", "selection", "CV Brief + Evidence", "DONE", "Done · current CV Brief and evidence selection ready")
        : step("brief", "selection", "CV Brief + Evidence", "NEEDS_ACTION", lowFitContinuationAllowed
          ? "Needs action · apply truthful LOW_FIT recommendations"
          : "Needs action · apply recommendations and create CV Brief");
  const cv = !input.briefCurrent
    ? step("cv", "cv", "Screening CV", "LOCKED", "Locked · waiting for current CV Brief")
    : input.cvRunActive
      ? step("cv", "cv", "Screening CV", "IN_PROGRESS", "In progress · generating from the current CV Brief")
      : input.currentCv
        ? step("cv", "cv", "Screening CV", "DONE", "Done · current Screening CV generated")
        : step("cv", "cv", "Screening CV", "READY", "Ready · explicitly generate from current CV Brief");
  const gateHistorical = input.gateReview.historical ? "Historical review exists but does not authorize this CV." : undefined;
  const gate = !input.currentCv
    ? step("gate", "gate", "Gate Review", "LOCKED", "Locked · waiting for current Screening CV", gateHistorical)
    : input.gateReview.status === "running"
      ? step("gate", "gate", "Gate Review", "IN_PROGRESS", "In progress · checking the current Screening CV", gateHistorical)
      : input.gateReview.status === "failed"
        ? step("gate", "gate", "Gate Review", "ERROR", "Error · current Gate Review did not complete", gateHistorical)
        : input.gateReview.current
          ? step("gate", "gate", "Gate Review", "DONE", "Done · bound to current Screening CV")
          : input.gateReview.status === "stale"
            ? step("gate", "gate", "Gate Review", "STALE", "Stale · review belongs to another CV identity", gateHistorical)
            : step("gate", "gate", "Gate Review", "READY", "Ready · review the current Screening CV", gateHistorical);
  const manager = !input.currentCv
    ? step("manager", "reviewer", "Manager + ATS Check", "LOCKED", "Locked · waiting for current Screening CV")
    : !input.gateReview.current
      ? step("manager", "reviewer", "Manager + ATS Check", "LOCKED", "Locked · waiting for Gate Review on the current CV")
      : input.managerAts.status === "running"
        ? step("manager", "reviewer", "Manager + ATS Check", "IN_PROGRESS", "In progress · checking current Gate Review results")
        : input.managerAts.status === "failed"
          ? step("manager", "reviewer", "Manager + ATS Check", "ERROR", "Error · Manager + ATS Check did not complete")
          : input.managerAts.current
            ? step("manager", "reviewer", "Manager + ATS Check", "DONE", "Done · bound to current CV and Gate Review")
            : input.managerAts.status === "stale"
              ? step("manager", "reviewer", "Manager + ATS Check", "STALE", "Stale · result belongs to another CV or Gate Review")
              : step("manager", "reviewer", "Manager + ATS Check", "READY", "Ready · evaluate current Gate Review results");
  const steps = [evidence, analysis, positioning, brief, cv, gate, manager];
  const current = steps.find((item) => item.status === "NEEDS_ACTION") || steps.find((item) => item.status === "READY") || steps.find((item) => item.status === "IN_PROGRESS") || steps[steps.length - 1];
  return { steps, currentStepId: current.id, lowFitContinuationAllowed };
}
