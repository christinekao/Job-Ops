type RecommendedRepairRoute =
  | "run-safe-repair"
  | "review-ai-proposals"
  | "run-targeted-regeneration"
  | "collect-human-input"
  | "resolve-human-decision"
  | "no-available-repair";

type RepairRouteDisplay = {
  blockerId: string;
  route: "safe-auto" | "approval-required" | "targeted-regeneration" | "human-input" | "human-decision" | "unsupported";
  allowedMutationZones?: string[];
};

type RepairOrchestrationDisplay = {
  cvVersionId: string;
  cvContentHash: string;
  totalBlockers: number;
  safeAuto: RepairRouteDisplay[];
  approvalRequired: RepairRouteDisplay[];
  targetedRegeneration: RepairRouteDisplay[];
  humanInput: RepairRouteDisplay[];
  humanDecision: RepairRouteDisplay[];
  unsupported: RepairRouteDisplay[];
  recommendedNextRoute: RecommendedRepairRoute;
};

function nextActionCopy(route: RecommendedRepairRoute, summary: RepairOrchestrationDisplay) {
  if (route === "run-safe-repair") {
    return {
      label: `Fix ${summary.safeAuto.length} Item${summary.safeAuto.length === 1 ? "" : "s"} with AI`,
      note: "Applies only deterministic safe repairs supported by current evidence and CV hash."
    };
  }
  if (route === "review-ai-proposals") {
    return {
      label: `Review ${summary.approvalRequired.length} AI Suggestion${summary.approvalRequired.length === 1 ? "" : "s"}`,
      note: "Review proposal details before any future apply step."
    };
  }
  if (route === "run-targeted-regeneration") {
    const zones = new Set(summary.targetedRegeneration.flatMap((item) => item.allowedMutationZones || []));
    const label = zones.has("summary")
      ? "Regenerate Summary with AI"
      : zones.has("workExperience")
        ? "Regenerate Work Bullets with AI"
        : "Generate Cleaner CV Wording";
    return {
      label,
      note: "Regenerates only the affected section from selected evidence after explicit user action."
    };
  }
  if (route === "collect-human-input") {
    return {
      label: "Enter Email",
      note: "Required factual contact data must be entered by the user."
    };
  }
  if (route === "resolve-human-decision") {
    return {
      label: `Resolve ${summary.humanDecision.length} Manual Decision${summary.humanDecision.length === 1 ? "" : "s"}`,
      note: "These items require judgement about meaning, evidence, or positioning."
    };
  }
  return {
    label: "No Safe Repair Available",
    note: "No authorized repair path is available for the current blockers."
  };
}

export function RepairOrchestrationPanel({
  summary,
  onNextAction,
  nextActionDisabled,
  disabledReason,
  nextActionLabel,
  nextActionNote
}: {
  summary: RepairOrchestrationDisplay;
  onNextAction?: () => void;
  nextActionDisabled?: boolean;
  disabledReason?: string;
  nextActionLabel?: string;
  nextActionNote?: string;
}) {
  const normalizedSummary = {
    ...summary,
    targetedRegeneration: summary.targetedRegeneration || [],
    humanInput: summary.humanInput || [],
    humanDecision: summary.humanDecision || [],
    unsupported: summary.unsupported || []
  };
  const next = nextActionCopy(normalizedSummary.recommendedNextRoute, normalizedSummary);
  const label = nextActionLabel || next.label;
  const note = nextActionNote || next.note;
  return (
    <section className="repair-orchestration-panel" aria-label="Repair orchestration">
      <span className="eyebrow">Repair Orchestration</span>
      <strong>{summary.totalBlockers} issue{summary.totalBlockers === 1 ? "" : "s"} found</strong>
      <dl className="repair-route-counts">
        <div>
          <dt>AI can fix this safely</dt>
          <dd>{normalizedSummary.safeAuto.length}</dd>
        </div>
        <div>
          <dt>AI can suggest a change</dt>
          <dd>{normalizedSummary.approvalRequired.length}</dd>
        </div>
        <div>
          <dt>AI can regenerate a section</dt>
          <dd>{normalizedSummary.targetedRegeneration.length}</dd>
        </div>
        <div>
          <dt>User input needed</dt>
          <dd>{normalizedSummary.humanInput.length}</dd>
        </div>
        <div>
          <dt>Your decision is needed</dt>
          <dd>{normalizedSummary.humanDecision.length}</dd>
        </div>
        <div>
          <dt>No safe repair is available</dt>
          <dd>{normalizedSummary.unsupported.length}</dd>
        </div>
      </dl>
      <div className="repair-orchestration-next">
        <span>Next</span>
        <button className="primary" data-testid="repair-orchestrator-cta" type="button" onClick={onNextAction} disabled={nextActionDisabled}>
          {label}
        </button>
        {nextActionDisabled && disabledReason ? <p className="section-note" data-testid="repair-orchestrator-disabled-reason">{disabledReason}</p> : null}
        <p>{note}</p>
      </div>
      <details>
        <summary>Advanced Details</summary>
        <ul>
          <li>CV version: {summary.cvVersionId}</li>
          <li>CV hash: {summary.cvContentHash}</li>
          <li>Recommended route: {summary.recommendedNextRoute}</li>
          {normalizedSummary.safeAuto.map((item) => <li key={item.blockerId}>{item.blockerId}: {item.route}</li>)}
          {normalizedSummary.approvalRequired.map((item) => <li key={item.blockerId}>{item.blockerId}: {item.route}</li>)}
          {normalizedSummary.targetedRegeneration.map((item) => <li key={item.blockerId}>{item.blockerId}: {item.route}</li>)}
          {normalizedSummary.humanInput.map((item) => <li key={item.blockerId}>{item.blockerId}: {item.route}</li>)}
          {normalizedSummary.humanDecision.map((item) => <li key={item.blockerId}>{item.blockerId}: {item.route}</li>)}
          {normalizedSummary.unsupported.map((item) => <li key={item.blockerId}>{item.blockerId}: {item.route}</li>)}
        </ul>
      </details>
    </section>
  );
}
