import { Fragment, useMemo, useState } from "react";
import type { SummaryReviewResult, TailoredCv } from "../../types";
import { RepairProposalPanel, type RepairProposalDisplay, type RepairProposalDisplayStatus } from "./RepairProposalPanel";
import { RepairOrchestrationPanel } from "./RepairOrchestrationPanel";
import { findFirstEditableBullet, resolveBlockerEditTarget, type BlockerEditTarget, type GuidedEditContext } from "../cv/guidedEditing";

type DisplayCheck = {
  label: string;
  value: string;
};

type ReviewSummaryGroup = {
  title: string;
  tone: "pass" | "warning" | "blocking";
  checks: DisplayCheck[];
};

type RepairPlanDisplayItem = {
  label: string;
  targetZones: string[];
  reason: string;
  safety: string;
  impact: string;
};

type RepairResultDisplay = {
  summary: string;
  actionId?: string;
  status?: "success" | "blocked" | "no-safe-fix" | "error" | "idle";
  timestamp?: string;
  changedSections: string[];
  unchangedSections: string[];
  contentHash?: string;
  remainingBlockers: string[];
  diagnosticReport?: ValidationDiagnosticReportDisplay;
};

type ValidationDiagnosticItemDisplay = {
  id: string;
  validatorId: string;
  ruleId: string;
  severity: "blocking" | "warning" | "info";
  status: "pass" | "fail" | "skipped";
  message: string;
  targetZone?: string;
  fieldPath?: string;
  sentenceIndex?: number;
  bulletId?: string;
  roleId?: string;
  currentValue?: string;
  candidateValue?: string;
  evidenceIds?: string[];
  missingEvidenceIds?: string[];
  unsupportedTerms?: string[];
  actualValue?: string | number | boolean;
  expectedValue?: string | number | boolean;
  recoveryRoute?: string;
};

type ValidationDiagnosticReportDisplay = {
  requestId: string;
  blockerIds: string[];
  cvVersionId: string;
  cvContentHash: string;
  targetZones: string[];
  rawResponseCaptured: boolean;
  rawResponseShape: string;
  normalizedCandidateCaptured: boolean;
  normalizedCandidate: Record<string, unknown>;
  candidateChanged: boolean;
  changedZones: string[];
  ignoredCandidateZones: string[];
  preservedZones: string[];
  checks: ValidationDiagnosticItemDisplay[];
  targetFailures: ValidationDiagnosticItemDisplay[];
  preservedZoneFailures: ValidationDiagnosticItemDisplay[];
  staleContractFailures: ValidationDiagnosticItemDisplay[];
  preExistingGlobalIssues: ValidationDiagnosticItemDisplay[];
  newGlobalIssues: ValidationDiagnosticItemDisplay[];
  blockingFailures: ValidationDiagnosticItemDisplay[];
  warnings: ValidationDiagnosticItemDisplay[];
  primaryFailureId?: string;
  stopReason: string;
  recommendedRecovery: string;
};

type AIExplanationDisplay = {
  title: string;
  changedItems: string[];
  unchangedItems: string[];
  reason: string;
  nextRecommendation: string;
  advancedDetails?: string[];
};

type PrimaryCtaDisplay = {
  label: string;
  reason: string;
  disabled?: boolean;
  className?: string;
  title?: string;
};

type ExportDecisionDisplay = {
  ready: boolean;
  blockers: string[];
  warnings: string[];
  contentHash?: string;
};

type ConfidenceLevel = "High" | "Medium" | "Low" | "Not Available";

type TargetedRegenerationAttemptDisplay = {
  outcome: "success" | "no-diff-terminal" | "blocked" | "error" | "stale";
  strategy: "summary" | "work-bullets" | "wording";
  targetZones: string[];
  attemptCount: number;
  finalStopReason: string;
};

type ReviewFreshnessDisplay = {
  currentCvVersionId: string;
  currentCvContentHash: string;
  currentSummaryHash: string;
  reviewedCvVersionId: string;
  reviewedCvContentHash: string;
  reviewedSummaryHash: string;
  reviewRunId: string;
  reviewedAt: string;
  status: "fresh" | "stale" | "running" | "failed";
};

type RepairReviewDisplay = {
  targetZone: "summary";
  outcome: "passed" | "still-failed";
  previousValue: string;
  updatedValue: string;
  reviewRunId: string;
  reviewedAt: string;
  reviewedCvVersionId: string;
  reviewedCvContentHash: string;
  reviewedSummaryHash: string;
  blockerId?: string;
  blockerReviewRunId?: string;
  blockerReviewedCvHash?: string;
  reviewerReason: string;
  failedCriteria: string[];
  previousSummaryReview?: SummaryReviewResult;
  updatedSummaryReview?: SummaryReviewResult;
};

type DecisionSummaryDisplay = {
  readinessLabel: string;
  confidence: ConfidenceLevel;
  recommendation: string;
  explanation: string;
  blockingIssues: string[];
  warnings: string[];
  manualReviewItems: string[];
};

type BlockerDifficulty = "Easy" | "Medium" | "Hard";

type BlockerCardDisplay = {
  id: string;
  rawBlocker: string;
  sourceIndex: number;
  title: string;
  explanation: string;
  location: string;
  targetSection: string;
  difficulty: BlockerDifficulty;
  estimatedSeconds: number;
  advancedDetail: string;
  expectedOutcome: string;
  affectedField: string;
  target: BlockerEditTarget | null;
  actionLabel: string;
  repairAction?: UserRepairAction;
};

type RepairProposalResolverInput = {
  blockerId: string;
  rawBlocker: string;
  title: string;
  explanation: string;
  target: BlockerEditTarget | null;
};

type RepairProposalResolver = (input: RepairProposalResolverInput) => RepairProposalDisplay | null;

type AcceptedProposalApplyInput = {
  proposals: RepairProposalDisplay[];
  statuses: Record<string, RepairProposalDisplayStatus>;
};

type UserRepairAction =
  | {
      kind: "safe-repair";
      label: string;
      command: "apply-safe-repair";
    }
  | {
      kind: "ai-proposal";
      label: string;
      command: "generate-ai-proposals" | "review-ai-proposals";
    }
  | {
      kind: "targeted-regeneration";
      label: string;
      command: "run-targeted-regeneration";
      targetZones: string[];
    }
  | {
      kind: "human-input";
      label: string;
      editTarget: BlockerEditTarget;
    }
  | {
      kind: "human-decision";
      label: string;
    }
  | {
      kind: "manual-edit";
      label: string;
      editTarget: BlockerEditTarget;
    }
  | {
      kind: "unsupported";
      message: string;
    };

export type ProposalGenerationStatus =
  | "idle"
  | "ready"
  | "running"
  | "success"
  | "empty"
  | "error"
  | "stale";

type ProposalGenerationBaseStatus = "idle" | "running" | "success" | "empty" | "error";

export function resolveProposalGenerationStatus({
  candidateCount,
  generatedProposalCount,
  baseStatus,
  sourceContentHash,
  currentContentHash
}: {
  candidateCount: number;
  generatedProposalCount: number;
  baseStatus: ProposalGenerationBaseStatus;
  sourceContentHash?: string;
  currentContentHash?: string;
}): ProposalGenerationStatus {
  if (generatedProposalCount > 0 && sourceContentHash && currentContentHash && sourceContentHash !== currentContentHash) return "stale";
  if (baseStatus === "running") return "running";
  if (baseStatus === "success" && generatedProposalCount > 0) return "success";
  if (baseStatus === "empty") return "empty";
  if (baseStatus === "error") return "error";
  if (candidateCount > 0) return "ready";
  return "idle";
}

export function proposalGenerationCta(status: ProposalGenerationStatus, candidateCount: number, generatedProposalCount: number) {
  if (status === "ready") {
    return {
      label: `Generate ${candidateCount} AI Suggestion${candidateCount === 1 ? "" : "s"}`,
      note: `${candidateCount} item${candidateCount === 1 ? " is" : "s are"} ready for AI suggestions.`,
      disabled: false
    };
  }
  if (status === "running") {
    return {
      label: "Generating suggestions…",
      note: "AI suggestion generation is running. No CV changes have been applied.",
      disabled: true
    };
  }
  if (status === "success") {
    return {
      label: `Review ${generatedProposalCount} AI Suggestion${generatedProposalCount === 1 ? "" : "s"}`,
      note: `${generatedProposalCount} suggestion${generatedProposalCount === 1 ? "" : "s"} generated. Review them before applying anything.`,
      disabled: false
    };
  }
  if (status === "empty") {
    return {
      label: "Retry AI Suggestions",
      note: "No valid AI suggestions were produced.",
      disabled: false
    };
  }
  if (status === "error") {
    return {
      label: "Retry AI Suggestions",
      note: "AI suggestions could not be generated.",
      disabled: false
    };
  }
  if (status === "stale") {
    return {
      label: "Generate New AI Suggestions",
      note: "The CV changed after these suggestions were created. Generate new suggestions.",
      disabled: false
    };
  }
  return {
    label: "",
    note: "",
    disabled: true
  };
}

type RepairOrchestrationDisplay = {
  cvVersionId: string;
  cvContentHash: string;
  totalBlockers: number;
  safeAuto: { blockerId: string; route: "safe-auto" | "approval-required" | "targeted-regeneration" | "human-input" | "human-decision" | "unsupported"; allowedMutationZones?: string[] }[];
  approvalRequired: { blockerId: string; route: "safe-auto" | "approval-required" | "targeted-regeneration" | "human-input" | "human-decision" | "unsupported"; evidenceIds?: string[]; allowedMutationZones?: string[] }[];
  targetedRegeneration: { blockerId: string; route: "safe-auto" | "approval-required" | "targeted-regeneration" | "human-input" | "human-decision" | "unsupported"; allowedMutationZones?: string[] }[];
  humanInput: { blockerId: string; route: "safe-auto" | "approval-required" | "targeted-regeneration" | "human-input" | "human-decision" | "unsupported"; target?: BlockerEditTarget; allowedMutationZones?: string[] }[];
  humanDecision: { blockerId: string; route: "safe-auto" | "approval-required" | "targeted-regeneration" | "human-input" | "human-decision" | "unsupported"; allowedMutationZones?: string[] }[];
  unsupported: { blockerId: string; route: "safe-auto" | "approval-required" | "targeted-regeneration" | "human-input" | "human-decision" | "unsupported"; allowedMutationZones?: string[] }[];
  recommendedNextRoute: "run-safe-repair" | "review-ai-proposals" | "run-targeted-regeneration" | "collect-human-input" | "resolve-human-decision" | "no-available-repair";
};

type RepairRouteItemDisplay = RepairOrchestrationDisplay[
  "safeAuto" | "approvalRequired" | "targetedRegeneration" | "humanInput" | "humanDecision" | "unsupported"
][number];

function renderFallback(message: string) {
  return <p className="section-note">{message}</p>;
}

function formatEffort(seconds: number) {
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

function previewActionLabelForTarget(target: BlockerEditTarget | null, fallback = "Review Manual Decision") {
  if (!target) return fallback;
  return "Preview AI Repair";
}

function blockerStatusLabel(index: number, completedCount: number) {
  if (index < completedCount) return "Completed";
  if (index === completedCount) return "Next";
  return "Pending";
}

function readableCheckLabel(label: string) {
  if (/hiring manager relevance/i.test(label)) return "Role fit";
  if (/weak claims/i.test(label)) return "Evidence strength";
  if (/external wording/i.test(label)) return "Recruiter wording";
  if (/contact extraction/i.test(label)) return "Contact info";
  if (/pdf export readiness/i.test(label)) return "Export readiness";
  if (/text layer/i.test(label)) return "Readable export text";
  if (/visible work depth/i.test(label)) return "Work history depth";
  if (/section order/i.test(label)) return "Section order";
  if (/unsupported/i.test(label)) return "Unsupported wording";
  if (/keyword/i.test(label)) return "Keyword support";
  return label;
}

function readableCheckExplanation(label: string, value: string) {
  const text = `${label}: ${value}`;
  if (/hiring manager relevance/i.test(text)) return "Your summary does not yet explain why you are a strong fit for this role.";
  if (/weak claims/i.test(text)) return "Some achievements need stronger evidence before they should appear on your CV.";
  if (/external wording/i.test(text)) return "Some sentences still use internal company terminology.";
  if (/contact extraction|contact email/i.test(text)) return "Required contact information is missing or incomplete.";
  if (/evidence traceability/i.test(text)) return "Some visible bullets are missing evidence links.";
  if (/unsupported claims/i.test(text)) return "Some wording may claim experience that the selected evidence does not support.";
  if (/action\/outcome bullets/i.test(text)) return "Some work bullets need clearer action and outcome.";
  if (/text layer/i.test(text)) return "The export text is too short or not readable enough for ATS checks.";
  if (/visible work depth/i.test(text)) return "The work history needs enough concrete role detail before export.";
  if (/pdf export readiness/i.test(text)) return "The CV content is not ready for a reliable PDF/export action yet.";
  return value;
}

function readableDecisionItem(item: string) {
  const text = item.toLowerCase();
  if (/application fit risk|fit risk|unsupported mapping|high-risk gap/.test(text)) {
    return "A fit-risk item should be reviewed before sending, but it does not block export.";
  }
  if (/hiring manager relevance|manager relevance/.test(text)) {
    return "Your summary may need stronger role-fit positioning.";
  }
  if (/weak claims/.test(text)) {
    return "Some achievements may benefit from stronger support.";
  }
  if (/external wording/.test(text)) {
    return "Some wording may still read like internal notes.";
  }
  if (/contact extraction|contact email|missing email/.test(text)) {
    return "Required contact information is missing or incomplete.";
  }
  if (/text layer|pdf export|export readiness/.test(text)) {
    return "The CV needs enough readable export content.";
  }
  if (/visible work depth/.test(text)) {
    return "The work history needs enough concrete role detail.";
  }
  if (/decision context/.test(text)) {
    return "The job needs analysis context before export can be trusted.";
  }
  if (/no screening cv/.test(text)) {
    return "Generate a Screening CV before export.";
  }
  return item;
}

function isManualReviewItem(item: string) {
  return /application fit risk|fit risk|manual review|career position|positioning|unsupported mapping|high-risk gap/i.test(item);
}

function summaryRepairIssueLabel(repairReview: RepairReviewDisplay | undefined) {
  if (!repairReview) return "";
  const review = repairReview.updatedSummaryReview;
  if (repairReview.outcome === "passed" || review?.overallStatus === "pass") {
    return review?.fitRiskOnly
      ? "Summary quality passed; remaining concern is role-fit risk"
      : "Summary role-fit criteria resolved";
  }
  const firstFailed = review?.criteria.find((criterion) => criterion.status === "fail" && criterion.fixability === "summary-rewrite")
    || review?.criteria.find((criterion) => criterion.status !== "pass");
  if (firstFailed) return `Summary still needs work: ${firstFailed.reason}`;
  return "Summary still needs criterion-level review";
}

function summaryReviewRows(previous: SummaryReviewResult | undefined, updated: SummaryReviewResult | undefined) {
  const ids = Array.from(new Set([
    ...(previous?.criteria || []).map((item) => item.criterionId),
    ...(updated?.criteria || []).map((item) => item.criterionId)
  ]));
  return ids.map((id) => {
    const before = previous?.criteria.find((item) => item.criterionId === id);
    const after = updated?.criteria.find((item) => item.criterionId === id);
    return {
      id,
      before: before?.status || "not-applicable",
      after: after?.status || "not-applicable",
      reason: after?.reason || before?.reason || ""
    };
  });
}

function summarizeDecision(decision: ExportDecisionDisplay): DecisionSummaryDisplay {
  const manualReviewItems = decision.warnings.filter(isManualReviewItem);
  const warnings = decision.warnings.filter((item) => !isManualReviewItem(item));
  const hasDecisionData = Boolean(decision.contentHash || decision.blockers.length || decision.warnings.length || decision.ready);
  const confidence: ConfidenceLevel = !hasDecisionData
    ? "Not Available"
    : decision.blockers.length
      ? "Low"
      : manualReviewItems.length || warnings.length
        ? "Medium"
        : "High";
  const recommendation = decision.blockers.length
    ? "Resolve Blocking Issues"
    : manualReviewItems.length
      ? "Manual Review Recommended"
      : warnings.length
        ? "Review Optional Improvements"
        : decision.ready
          ? "Ready to Export"
          : "Manual Review Recommended";
  const explanation = decision.ready
    ? "Export is available because no blocking issues remain."
    : `Still needs attention. Export is blocked because ${decision.blockers.length || "one or more"} blocking issue${decision.blockers.length === 1 ? "" : "s"} remain${decision.blockers.length === 1 ? "s" : ""}.`;
  return {
    readinessLabel: decision.ready ? "Ready to Export" : "Not Ready Yet",
    confidence,
    recommendation,
    explanation,
    blockingIssues: decision.blockers,
    warnings,
    manualReviewItems
  };
}

function explainRepairResult(result: RepairResultDisplay): AIExplanationDisplay {
  if (result.status === "idle") {
    return {
      title: "No AI changes have been applied yet",
      changedItems: ["No CV content changed"],
      unchangedItems: ["Current CV content"],
      reason: "Review and approve suggestions first.",
      nextRecommendation: "Review AI Suggestions",
      advancedDetails: [result.summary].filter(Boolean)
    };
  }
  const noDiff = result.status === "no-safe-fix" && result.actionId === "run-targeted-regeneration";
  const changedItems = result.changedSections.length ? result.changedSections : [noDiff ? "None - current CV remains unchanged" : "No CV content changed"];
  const unchangedItems = result.unchangedSections.length
    ? result.unchangedSections
    : result.status === "blocked" || result.status === "no-safe-fix" || result.status === "error"
      ? ["Existing CV content"]
      : ["Career positioning", "Evidence selection"];
  const diagnosticReason = result.diagnosticReport?.blockingFailures.map((item) => item.message).join(" ");
  const reason = result.status === "success"
    ? "AI or local repair changed only the permitted target zones and preserved unrelated CV content."
    : result.status === "no-safe-fix"
      ? noDiff
        ? "The generated alternative did not create a safe, validated content improvement, so the current CV was preserved."
        : "No reliable safe edit was available for this blocker."
      : result.status === "blocked"
        ? diagnosticReason || "The requested operation was blocked to avoid repeating work or changing content without a safe target."
        : "The operation did not complete successfully.";
  const nextRecommendation = result.status === "success"
    ? result.remainingBlockers.length
      ? "Review Changes"
      : "Ready to Export"
    : noDiff
      ? "Choose another repair path"
      : result.diagnosticReport?.recommendedRecovery === "review-evidence"
        ? "Review Supporting Evidence"
        : result.diagnosticReport?.recommendedRecovery === "manual-edit"
          ? "Edit the exact field manually"
          : result.diagnosticReport?.recommendedRecovery === "retry-with-constraints"
            ? "Retry with tighter constraints"
            : "Continue Editing";
  return {
    title: result.status === "success"
      ? "AI updated"
      : noDiff
        ? "AI regeneration completed, but no safe content change was available."
        : "AI did not update the CV",
    changedItems,
    unchangedItems,
    reason,
    nextRecommendation,
    advancedDetails: [
      result.summary,
      result.actionId ? `Action: ${result.actionId}` : "",
      result.status ? `Status: ${result.status}` : "",
      result.timestamp ? `Timestamp: ${result.timestamp}` : "",
      result.contentHash ? `CV hash: ${result.contentHash}` : "",
      result.remainingBlockers.length ? `Remaining blockers: ${result.remainingBlockers.join(" | ")}` : ""
    ].filter(Boolean)
  };
}

export function AIExplanationCard({
  explanation
}: {
  explanation: AIExplanationDisplay;
}) {
  return (
    <section className="ai-explanation-card" aria-label="AI explanation">
      <div className="ai-explanation-section">
        <span className="eyebrow">What changed</span>
        <strong>{explanation.title}</strong>
        <ul>
          {explanation.changedItems.map((item) => <li key={`changed-${item}`}>{item}</li>)}
        </ul>
      </div>
      <div className="ai-explanation-section muted">
        <span className="eyebrow">What did not change</span>
        <ul>
          {explanation.unchangedItems.map((item) => <li key={`unchanged-${item}`}>{item}</li>)}
        </ul>
      </div>
      <div className="ai-explanation-section">
        <span className="eyebrow">Why</span>
        <p>{explanation.reason}</p>
      </div>
      <div className="ai-explanation-next">
        <span className="eyebrow">Next step</span>
        <strong>{explanation.nextRecommendation}</strong>
      </div>
      {explanation.advancedDetails?.length ? (
        <details className="ai-explanation-advanced">
          <summary>Advanced Details</summary>
          <ul>
            {explanation.advancedDetails.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

function blockerCardFor(rawBlocker: string, index: number, cv?: TailoredCv): BlockerCardDisplay {
  const [rawLabel = rawBlocker, ...detailParts] = rawBlocker.split(":");
  const detail = detailParts.join(":").trim();
  const normalized = rawBlocker.toLowerCase();
  const fallbackDetail = detail || rawBlocker;
  const baseId = `${index}-${rawLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "blocker"}`;

  function withTarget(card: Omit<BlockerCardDisplay, "rawBlocker" | "sourceIndex" | "target" | "expectedOutcome" | "affectedField" | "actionLabel" | "repairAction">): BlockerCardDisplay {
    const resolved = resolveBlockerEditTarget({ blockerId: card.id, rawBlocker, cv });
    const fallbackBullet = !resolved && card.targetSection === "Work Experience"
      ? findFirstEditableBullet(cv, /wording|recruiter|external|internal/i.test(rawBlocker) ? "external" : "weak") || findFirstEditableBullet(cv, "any")
      : null;
    const fallbackTarget: BlockerEditTarget | null = fallbackBullet ? {
      blockerId: card.id,
      section: "workExperience",
      fieldId: "bullet",
      roleId: fallbackBullet.roleId,
      bulletId: fallbackBullet.bulletId,
      focusKey: ["guided", "workExperience", "bullet", fallbackBullet.roleId, fallbackBullet.bulletId].join("-"),
      highlightKey: ["guided", "workExperience", "bullet", fallbackBullet.roleId, fallbackBullet.bulletId].join("-")
    } : null;
    const target = resolved?.target || fallbackTarget;
    return {
      ...card,
      rawBlocker,
      sourceIndex: index,
      target,
      affectedField: resolved?.affectedField || fallbackBullet?.label || card.targetSection,
      expectedOutcome: resolved?.expectedOutcome || (fallbackBullet ? "The work bullet is rewritten with clearer evidence-backed wording." : "Manual or AI-assisted review identifies the correct edit before changing the CV."),
      actionLabel: previewActionLabelForTarget(target)
    };
  }

  if (/contact extraction|missing name|missing email|missing.*location/.test(normalized)) {
    return withTarget({
      id: `${index}-contact`,
      title: /email/.test(normalized) ? "Missing email" : "Missing contact information",
      explanation: "The CV header needs the required contact details before export.",
      location: "Header",
      targetSection: "Header",
      difficulty: "Easy",
      estimatedSeconds: 30,
      advancedDetail: rawBlocker
    });
  }
  if (/hiring manager relevance|manager-ready|manager relevance|summary needs clearer role fit|summary.*role fit/.test(normalized)) {
    return withTarget({
      id: `${index}-manager-fit`,
      title: "Summary needs clearer role fit",
      explanation: "Your summary does not clearly explain why you fit this role yet.",
      location: "Summary and first work bullets",
      targetSection: "Summary",
      difficulty: "Medium",
      estimatedSeconds: 120,
      advancedDetail: rawBlocker
    });
  }
  if (/unsupported claims|unsupported visible claim|unsupported wording/.test(normalized)) {
    return withTarget({
      id: `${index}-unsupported-wording`,
      title: "Unsupported wording needs review",
      explanation: "Some wording may claim experience that the selected evidence does not support.",
      location: "Summary or work history",
      targetSection: "Visible CV wording",
      difficulty: "Medium",
      estimatedSeconds: 120,
      advancedDetail: rawBlocker
    });
  }
  if (/weak claims|supporting evidence|stronger support|evidence|unsupported/.test(normalized)) {
    return withTarget({
      id: `${index}-evidence`,
      title: "Achievements need stronger support",
      explanation: "Some work achievements need clearer evidence or weaker wording.",
      location: "Work history",
      targetSection: "Work Experience",
      difficulty: "Medium",
      estimatedSeconds: 180,
      advancedDetail: rawBlocker
    });
  }
  if (/external wording|internal terminology|wording|recruiter/.test(normalized)) {
    return withTarget({
      id: `${index}-wording`,
      title: "Wording needs to be clearer for recruiters",
      explanation: "Some phrases still read like internal notes instead of CV language.",
      location: "Summary or work history",
      targetSection: "Visible CV wording",
      difficulty: "Medium",
      estimatedSeconds: 120,
      advancedDetail: rawBlocker
    });
  }
  if (/keyword/.test(normalized)) {
    return withTarget({
      id: `${index}-keyword`,
      title: "Important role keywords need support",
      explanation: "A required role theme is missing or not clearly backed by selected evidence.",
      location: "Summary, skills, or work bullets",
      targetSection: "Role keywords",
      difficulty: "Medium",
      estimatedSeconds: 120,
      advancedDetail: rawBlocker
    });
  }
  if (/section order/.test(normalized)) {
    return withTarget({
      id: `${index}-section-order`,
      title: "Section order needs review",
      explanation: "The exported CV should read in the expected order from header to work history.",
      location: "Full CV",
      targetSection: "Layout",
      difficulty: "Easy",
      estimatedSeconds: 60,
      advancedDetail: rawBlocker
    });
  }
  if (/text layer|pdf|export|readable|content.*short|visible work depth/.test(normalized)) {
    return withTarget({
      id: `${index}-export`,
      title: "Export content is not ready yet",
      explanation: "The CV needs enough readable content before it can be exported safely.",
      location: /visible work depth/.test(normalized) ? "Work history" : "Export preview",
      targetSection: /visible work depth/.test(normalized) ? "Work Experience" : "Export",
      difficulty: /visible work depth/.test(normalized) ? "Medium" : "Easy",
      estimatedSeconds: /visible work depth/.test(normalized) ? 180 : 60,
      advancedDetail: rawBlocker
    });
  }

  return withTarget({
    id: baseId,
    title: readableCheckLabel(rawLabel.trim()) || "CV item needs attention",
    explanation: fallbackDetail,
    location: "CV Studio",
    targetSection: "Current CV",
    difficulty: "Medium",
    estimatedSeconds: 120,
    advancedDetail: rawBlocker
  });
}

function blockerTaskKey(card: BlockerCardDisplay) {
  if (card.target) {
    return [card.target.section, card.target.fieldId, card.target.roleId, card.target.bulletId].filter(Boolean).join(":");
  }
  return card.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function dedupeBlockerCards(cards: BlockerCardDisplay[]) {
  const seen = new Set<string>();
  return cards.filter((card) => {
    const key = blockerTaskKey(card);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function orchestratorBlockerId(rawBlocker: string, index: number) {
  const suffix = rawBlocker.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 52);
  return `blocker-${index + 1}-${suffix || "unknown"}`;
}

function routeItemForCard(card: BlockerCardDisplay, repairOrchestration: RepairOrchestrationDisplay | undefined): RepairRouteItemDisplay | null {
  if (!repairOrchestration) return null;
  const expectedId = orchestratorBlockerId(card.rawBlocker, card.sourceIndex);
  const routeGroups = [
    repairOrchestration.safeAuto,
    repairOrchestration.approvalRequired,
    repairOrchestration.targetedRegeneration,
    repairOrchestration.humanInput,
    repairOrchestration.humanDecision,
    repairOrchestration.unsupported
  ];
  return routeGroups.flat().filter(Boolean).find((item) => item.blockerId === expectedId || item.blockerId.startsWith(`blocker-${card.sourceIndex + 1}-`)) || null;
}

function targetedRegenerationLabel(card: BlockerCardDisplay, zones: string[]) {
  const title = `${card.title} ${card.advancedDetail}`.toLowerCase();
  if (zones.includes("summary") || /summary|role fit|manager relevance/.test(title)) return "Regenerate Summary with AI";
  if (/wording|recruiter|external|internal/.test(title)) return "Generate Cleaner CV Wording";
  if (zones.some((zone) => zone.includes("workExperience")) || /achievement|work|bullet/.test(title)) return "Regenerate Work Bullets with AI";
  return "Generate Cleaner CV Wording";
}

function repairActionForCard(input: {
  card: BlockerCardDisplay;
  routeItem: RepairRouteItemDisplay | null;
  proposal: RepairProposalDisplay | null;
}): UserRepairAction | undefined {
  const { card, routeItem, proposal } = input;
  if (!routeItem) {
    if (proposal) return { kind: "ai-proposal", label: card.actionLabel, command: "generate-ai-proposals" };
    return undefined;
  }
  if (routeItem.route === "safe-auto") return { kind: "safe-repair", label: "Fix with AI", command: "apply-safe-repair" };
  if (routeItem.route === "approval-required") return { kind: "ai-proposal", label: proposal ? card.actionLabel : "Generate AI Suggestion", command: "generate-ai-proposals" };
  if (routeItem.route === "targeted-regeneration") {
    const zones = routeItem.allowedMutationZones || [];
    return {
      kind: "targeted-regeneration",
      label: targetedRegenerationLabel(card, zones),
      command: "run-targeted-regeneration",
      targetZones: zones
    };
  }
  if (routeItem.route === "human-input" && card.target) return { kind: "human-input", label: /email/i.test(card.title) ? "Enter Email" : "Enter Required Info", editTarget: card.target };
  if (routeItem.route === "human-decision") return { kind: "human-decision", label: "Review Manual Decision" };
  if (routeItem.route === "unsupported") return { kind: "unsupported", message: "No safe repair is available for this item yet." };
  return undefined;
}

export function RepairProgress({
  completedCount,
  remainingCount,
  estimatedSeconds,
  currentItem
}: {
  completedCount: number;
  remainingCount: number;
  estimatedSeconds: number;
  currentItem?: string;
}) {
  const total = completedCount + remainingCount;
  return (
    <div className="repair-progress" aria-label="Repair progress">
      <div>
        <strong>{remainingCount ? "Repair Progress" : "Repair Complete"}</strong>
        <span>{remainingCount} remaining item{remainingCount === 1 ? "" : "s"}</span>
      </div>
      <div>
        {currentItem ? <span>Current: {currentItem}</span> : null}
        <span>Estimated: {remainingCount ? formatEffort(estimatedSeconds) : "0 seconds"}</span>
        <span>Progress: {completedCount} / {total || 0}</span>
      </div>
    </div>
  );
}

export function BlockerCard({
  blocker,
  progressLabel,
  status = "Pending",
  order,
  primary = false,
  onJumpToFix,
  onRepairAction,
  disabled
}: {
  blocker: BlockerCardDisplay;
  progressLabel: string;
  status?: "Next" | "Pending" | "Needs Manual Review" | "Completed" | "AI attempted - no safe improvement" | "Summary updated - review still failed";
  order?: number;
  primary?: boolean;
  onJumpToFix?: (context: GuidedEditContext) => void;
  onRepairAction?: (action: UserRepairAction, context: GuidedEditContext | null) => void;
  disabled?: boolean;
}) {
  const context: GuidedEditContext | null = blocker.target ? {
    blockerId: blocker.id,
    title: blocker.title,
    explanation: blocker.explanation,
    expectedOutcome: blocker.expectedOutcome,
    affectedField: blocker.affectedField,
    progressLabel,
    advancedDetail: blocker.advancedDetail,
    target: blocker.target
  } : null;
  const action = blocker.repairAction;
  return (
    <article className={`blocker-card ${status.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="blocker-card-head">
        <strong>{order ? `${order}. ${blocker.title}` : blocker.title}</strong>
        <span>{status}</span>
      </div>
      <p>{blocker.explanation}</p>
      <dl>
        <div>
          <dt>Location</dt>
          <dd>{blocker.location}</dd>
        </div>
        <div>
          <dt>Target section</dt>
          <dd>{blocker.targetSection}</dd>
        </div>
        <div>
          <dt>Effort</dt>
          <dd>{formatEffort(blocker.estimatedSeconds)}</dd>
        </div>
        <div>
          <dt>Difficulty</dt>
          <dd>{blocker.difficulty}</dd>
        </div>
      </dl>
      {action && action.kind !== "unsupported" ? (
        <div className="blocker-card-actions">
          <button
            className={primary ? "primary" : "secondary"}
            type="button"
            data-testid={primary ? "primary-cta" : undefined}
            onClick={() => onRepairAction?.(action, context)}
            disabled={disabled}
          >
            {action.label}
          </button>
          {context && (action.kind === "targeted-regeneration" || action.kind === "human-input") ? (
            <button className="tertiary" type="button" onClick={() => onJumpToFix?.(context)} disabled={disabled}>
              {action.kind === "targeted-regeneration" && blocker.targetSection === "Summary"
                ? "Edit Summary Manually"
                : action.kind === "targeted-regeneration" && blocker.targetSection === "Work Experience"
                  ? "Edit Work Experience Manually"
                  : "Edit Manually"}
            </button>
          ) : null}
        </div>
      ) : context ? (
        <button className={primary ? "primary" : "secondary"} type="button" data-testid={primary ? "primary-cta" : undefined} onClick={() => onJumpToFix?.(context)} disabled={disabled}>
          {blocker.actionLabel}
        </button>
      ) : action?.kind === "unsupported" ? (
        <div className="blocker-card-fallback">
          <strong>{action.message}</strong>
          <p>This item is preserved for manual review because no authorized repair path exists.</p>
        </div>
      ) : (
        <div className="blocker-card-fallback">
          <strong>Manual or AI-assisted review required</strong>
          <p>This item does not have a reliable field target yet. Open the CV editor or repair plan before changing content.</p>
        </div>
      )}
      <details>
        <summary>Advanced Details</summary>
        <p>{blocker.advancedDetail}</p>
      </details>
    </article>
  );
}

export function BlockerChecklist({
  blockers,
  completedCount = 0,
  cv,
  showPrimaryNextStep = false,
  onJumpToFix
}: {
  blockers: string[];
  completedCount?: number;
  cv?: TailoredCv;
  showPrimaryNextStep?: boolean;
  onJumpToFix?: (context: GuidedEditContext) => void;
}) {
  const cards = blockers.map((item, index) => blockerCardFor(item, index, cv));
  const estimatedSeconds = cards.reduce((total, item) => total + item.estimatedSeconds, 0);
  const currentCard = cards[0];
  return (
    <section className="blocker-checklist" aria-label="Guided blocker checklist">
      <RepairProgress
        completedCount={completedCount}
        remainingCount={cards.length}
        estimatedSeconds={estimatedSeconds}
        currentItem={currentCard?.title}
      />
      {showPrimaryNextStep && currentCard ? (
        <section className="next-step-card" aria-label="Your Next Step">
          <span className="eyebrow">Your Next Step</span>
          <strong>{currentCard.title}</strong>
          <p><span>Why: </span>{currentCard.explanation}</p>
          <p><span>Estimated: </span>{formatEffort(currentCard.estimatedSeconds)}</p>
          {currentCard.target ? (
            <button
              className="primary"
              data-testid="primary-cta"
              type="button"
              onClick={() => onJumpToFix?.({
                blockerId: currentCard.id,
                title: currentCard.title,
                explanation: currentCard.explanation,
                expectedOutcome: currentCard.expectedOutcome,
                affectedField: currentCard.affectedField,
                progressLabel: `${completedCount + 1} of ${completedCount + cards.length}`,
                advancedDetail: currentCard.advancedDetail,
                target: currentCard.target as BlockerEditTarget
              })}
            >
              {currentCard.actionLabel}
            </button>
          ) : (
            <div className="blocker-card-fallback">
              <strong>Manual review required</strong>
              <p>This issue does not have a safe field target. Review the manual decision before editing.</p>
            </div>
          )}
        </section>
      ) : null}
      {cards.length ? (
        <div className="remaining-issues-list" aria-label="Remaining Issues">
          <span className="eyebrow">Remaining Issues</span>
          {cards.map((card, index) => (
            <BlockerCard
              key={card.id}
              blocker={card}
              progressLabel={`${completedCount + cards.findIndex((item) => item.id === card.id) + 1} of ${completedCount + cards.length}`}
              status={blockerStatusLabel(index + completedCount, completedCount)}
              order={index + 1}
              primary={false}
              onJumpToFix={onJumpToFix}
            />
          ))}
        </div>
      ) : (
        <p className="section-note">No blockers remain.</p>
      )}
    </section>
  );
}

export function ReviewSummaryPanel({
  title = "Review Summary",
  groups
}: {
  title?: string;
  groups: ReviewSummaryGroup[];
}) {
  const visibleGroups = groups.filter((group) => group.checks.length);
  if (!visibleGroups.length) return renderFallback("No review checks available yet.");
  return (
    <section className="review-summary-panel">
      <span className="eyebrow">{title}</span>
      <div className="check-status-summary">
        {visibleGroups.map((group) => (
          <div key={group.title}>
            <span className="eyebrow">{group.title}</span>
            <ul>
              {group.checks.map((check) => (
                <li key={`${group.title}-${check.label}`}>
                  <strong>{readableCheckLabel(check.label)}</strong>
                  <span>{readableCheckExplanation(check.label, check.value)}</span>
                  <details>
                    <summary>Advanced Details</summary>
                    <p>{check.label}: {check.value}</p>
                  </details>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export function RepairPlanPanel({
  title = "AI Repair Plan",
  items
}: {
  title?: string;
  items: RepairPlanDisplayItem[];
}) {
  if (!items.length) return null;
  return (
    <section className="repair-action-panel">
      <div className="repair-action-head">
        <span className="eyebrow">{title}</span>
        <strong>Repair only the listed failed zones.</strong>
      </div>
      <div className="repair-action-grid">
        {items.map((item) => (
          <article key={`${item.label}-${item.targetZones.join("-")}`}>
            <div>
              <strong>{item.label}</strong>
              <span>{item.safety}</span>
            </div>
            <p>{item.reason}</p>
            <ul>
              <li>Target zone: {item.targetZones.join(", ") || "Not available"}</li>
              <li>Expected impact: {item.impact}</li>
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

export function RepairResultPanel({
  result
}: {
  result?: RepairResultDisplay;
}) {
  if (!result) return null;
  const explanation = explainRepairResult(result);
  return (
    <section className="reviewer-local-fix-result" role="status" aria-live="polite">
      <AIExplanationCard explanation={explanation} />
      {result.diagnosticReport ? <ValidationDiagnosticPanel report={result.diagnosticReport} /> : null}
      {result.actionId === "run-targeted-regeneration" && result.status === "no-safe-fix" ? (
        <div className="repair-proposal-actions" data-testid="targeted-regeneration-no-diff">
          <p className="section-note">AI could not produce a safe improvement for this section. The blocker remains unresolved. Choose Edit Manually beside the blocker; Retry is available there as an explicit token-using action.</p>
        </div>
      ) : null}
    </section>
  );
}

function recoveryLabel(route: string) {
  if (route === "review-evidence") return "Review Supporting Evidence";
  if (route === "manual-edit") return "Edit the exact field manually";
  if (route === "retry-with-constraints") return "Retry with tighter constraints";
  if (route === "ai-proposal") return "Review a smaller AI proposal";
  if (route === "human-decision") return "Make the positioning decision";
  if (route === "unsupported" || route === "no-safe-recovery") return "No safe automated recovery";
  return "Continue with the refreshed workflow";
}

function ValidationDiagnosticPanel({ report }: { report: ValidationDiagnosticReportDisplay }) {
  const target = report.targetZones.includes("summary") ? "Summary" : "targeted CV section";
  const applied = report.stopReason === "passed" && !report.blockingFailures.length;
  const applyFailures = [...report.staleContractFailures, ...report.preservedZoneFailures, ...report.targetFailures, ...report.newGlobalIssues];
  return (
    <section className={`repair-proposal-panel${applied ? "" : " warning"}`} aria-label="Validation diagnostics" data-testid="validation-diagnostic-panel">
      <span className="eyebrow">Validation Result</span>
      <strong>{applied ? `AI generated a valid ${target} and it was applied.` : `AI created a new ${target}, but it was not applied.`}</strong>
      {!applied && applyFailures.length ? (
        <>
          <p>Blocked because:</p>
          <ul data-testid="validation-diagnostic-reasons">
            {applyFailures.map((item) => <li key={item.id}>{item.message}</li>)}
          </ul>
        </>
      ) : report.stopReason === "no-diff" ? <p>The candidate did not create a meaningful, safe content difference.</p> : null}
      {applied ? (
        report.preExistingGlobalIssues.length ? (
          <>
            <p>Remaining global blockers:</p>
            <ul data-testid="validation-remaining-global-issues">
              {report.preExistingGlobalIssues.map((item) => <li key={item.id}>{item.message.replace(/^Remaining global issue:\s*/, "")}</li>)}
            </ul>
          </>
        ) : <p>No remaining global validation issues were detected by the scoped apply gate.</p>
      ) : <p><strong>Your current CV was not changed.</strong></p>}
      {!applied ? <p className="section-note">Supported next action: {recoveryLabel(report.recommendedRecovery)}</p> : null}
      <details data-testid="validation-diagnostic-advanced">
        <summary>Advanced Details</summary>
        <dl className="repair-route-counts">
          <div><dt>Request ID</dt><dd>{report.requestId}</dd></div>
          <div><dt>CV version</dt><dd>{report.cvVersionId}</dd></div>
          <div><dt>CV hash</dt><dd>{report.cvContentHash}</dd></div>
          <div><dt>Target zones</dt><dd>{report.targetZones.join(", ") || "none"}</dd></div>
          <div><dt>Raw response captured</dt><dd>{report.rawResponseCaptured ? `yes · ${report.rawResponseShape}` : "no"}</dd></div>
          <div><dt>Normalized candidate</dt><dd>{report.normalizedCandidateCaptured ? "yes" : "no"}</dd></div>
          <div><dt>Candidate changed</dt><dd>{report.candidateChanged ? "yes" : "no"}</dd></div>
          <div><dt>Changed zones</dt><dd>{report.changedZones.join(", ") || "none"}</dd></div>
          <div><dt>Ignored candidate zones</dt><dd>{report.ignoredCandidateZones.join(", ") || "none"}</dd></div>
          <div><dt>Preserved zones</dt><dd>{report.preservedZones.join(", ") || "none"}</dd></div>
          <div><dt>Stop reason</dt><dd>{report.stopReason}</dd></div>
          <div><dt>Primary failure</dt><dd>{report.primaryFailureId || "none"}</dd></div>
          <div><dt>Target failures</dt><dd>{report.targetFailures.length}</dd></div>
          <div><dt>Preserved-zone failures</dt><dd>{report.preservedZoneFailures.length}</dd></div>
          <div><dt>Stale/contract failures</dt><dd>{report.staleContractFailures.length}</dd></div>
          <div><dt>Pre-existing global issues</dt><dd>{report.preExistingGlobalIssues.length}</dd></div>
          <div><dt>New global issues</dt><dd>{report.newGlobalIssues.length}</dd></div>
        </dl>
        <div className="diagnostic-candidate" data-testid="validation-normalized-candidate">
          <strong>Normalized target candidate</strong>
          <pre>{JSON.stringify(report.normalizedCandidate, null, 2)}</pre>
        </div>
        <ol className="validation-sequence" data-testid="validation-diagnostic-sequence">
          {report.checks.map((check) => (
            <li key={check.id} data-status={check.status}>
              <strong>{check.status.toUpperCase()} · {check.validatorId} · {check.ruleId}</strong>
              <p>{check.message}</p>
              {check.fieldPath ? <p>Field: {check.fieldPath}</p> : null}
              {check.targetZone ? <p>Zone: {check.targetZone}</p> : null}
              {check.candidateValue !== undefined ? <p>Candidate: {check.candidateValue || "(empty)"}</p> : null}
              {check.currentValue !== undefined ? <p>Current: {check.currentValue || "(empty)"}</p> : null}
              {check.actualValue !== undefined ? <p>Actual: {String(check.actualValue)}</p> : null}
              {check.expectedValue !== undefined ? <p>Expected: {String(check.expectedValue)}</p> : null}
              {check.evidenceIds?.length ? <p>Evidence IDs: {check.evidenceIds.join(", ")}</p> : null}
              {check.missingEvidenceIds?.length ? <p>Missing evidence: {check.missingEvidenceIds.join(", ")}</p> : null}
              {check.unsupportedTerms?.length ? <p>Unsupported terms: {check.unsupportedTerms.join(", ")}</p> : null}
              {check.recoveryRoute ? <p>Recovery: {check.recoveryRoute}</p> : null}
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}

export function PrimaryCTA({
  action,
  onClick
}: {
  action: PrimaryCtaDisplay;
  onClick: () => void;
}) {
  return (
    <div className="reviewer-one-click">
      <div>
        <strong>{action.label}</strong>
        <p>{action.reason}</p>
      </div>
      <button
        className={action.className || "primary"}
        onClick={onClick}
        disabled={action.disabled}
        title={action.title || ""}
      >
        {action.label}
      </button>
    </div>
  );
}

export function ConfidenceBadge({
  level
}: {
  level: ConfidenceLevel;
}) {
  const className = `confidence-badge ${level.toLowerCase().replace(/\s+/g, "-")}`;
  return <span className={className}>Confidence: {level}</span>;
}

export function RecommendationCard({
  recommendation,
  explanation
}: {
  recommendation: string;
  explanation: string;
}) {
  return (
    <section className="recommendation-card" aria-label="Recommendation">
      <span className="eyebrow">Recommendation</span>
      <strong>{recommendation}</strong>
      <p>{explanation}</p>
    </section>
  );
}

export function DecisionSummaryCard({
  summary
}: {
  summary: DecisionSummaryDisplay;
}) {
  return (
    <section className="decision-summary-card" aria-label="Decision summary">
      <div>
        <span className="eyebrow">CV Readiness</span>
        <strong>{summary.readinessLabel}</strong>
      </div>
      <ConfidenceBadge level={summary.confidence} />
      <dl>
        <div>
          <dt>Blocking Issues</dt>
          <dd>{summary.blockingIssues.length}</dd>
        </div>
        <div>
          <dt>Warnings</dt>
          <dd>{summary.warnings.length}</dd>
        </div>
        <div>
          <dt>Manual Review</dt>
          <dd>{summary.manualReviewItems.length}</dd>
        </div>
      </dl>
    </section>
  );
}

export function WarningSummary({
  warnings,
  manualReviewItems
}: {
  warnings: string[];
  manualReviewItems: string[];
}) {
  if (!warnings.length && !manualReviewItems.length) return null;
  return (
    <section className="warning-summary" aria-label="Warnings and manual review">
      {warnings.length ? (
        <div className="warning-summary-group optional">
          <span className="eyebrow">Warnings</span>
          <ul>
            {warnings.map((item) => <li key={`warning-${item}`}>{readableDecisionItem(item)}</li>)}
          </ul>
          <details>
            <summary>Advanced Details</summary>
            <ul>{warnings.map((item) => <li key={`warning-raw-${item}`}>{item}</li>)}</ul>
          </details>
        </div>
      ) : null}
      {manualReviewItems.length ? (
        <div className="warning-summary-group manual">
          <span className="eyebrow">Manual Review</span>
          <ul>
            {manualReviewItems.map((item) => <li key={`manual-${item}`}>{readableDecisionItem(item)}</li>)}
          </ul>
          <details>
            <summary>Advanced Details</summary>
            <ul>{manualReviewItems.map((item) => <li key={`manual-raw-${item}`}>{item}</li>)}</ul>
          </details>
        </div>
      ) : null}
    </section>
  );
}

export function CVReadinessCard({
  summary
}: {
  summary: DecisionSummaryDisplay;
}) {
  return (
    <section className="cv-readiness-card" aria-label="CV readiness">
      <DecisionSummaryCard summary={summary} />
      <RecommendationCard recommendation={summary.recommendation} explanation={summary.explanation} />
      <WarningSummary warnings={summary.warnings} manualReviewItems={summary.manualReviewItems} />
    </section>
  );
}

export function ExportDecisionPanel({
  decision,
  onExport,
  cv,
  proposalResolver,
  repairOrchestration,
  onJumpToFix,
  onRunSafeRepairs,
  onRunTargetedRegeneration,
  onResolveHumanDecision,
  onCollectHumanInput,
  onGenerateAiProposals,
  onApplyAcceptedProposals,
  proposalGenerationDisabledReason,
  targetedRegenerationLifecycle = "idle",
  targetedRegenerationDisabledReason,
  targetedRegenerationAttempt,
  repairReview,
  targetedRegenerationResultDismissed = false,
  targetedRegenerationElapsedSeconds = 0,
  onRetryTargetedRegeneration,
  onDismissTargetedRegenerationResult,
  reviewFreshness,
  reviewRefreshStatus = "idle",
  reviewRefreshError,
  onRecheckReview
}: {
  decision: ExportDecisionDisplay;
  onExport: () => void;
  cv?: TailoredCv;
  proposalResolver?: RepairProposalResolver;
  repairOrchestration?: RepairOrchestrationDisplay;
  onJumpToFix?: (context: GuidedEditContext) => void;
  onRunSafeRepairs?: () => void;
  onRunTargetedRegeneration?: () => void;
  onResolveHumanDecision?: () => void;
  onCollectHumanInput?: (context: GuidedEditContext) => void;
  onGenerateAiProposals?: () => void;
  onApplyAcceptedProposals?: (input: AcceptedProposalApplyInput) => void;
  proposalGenerationDisabledReason?: string;
  targetedRegenerationLifecycle?: "idle" | "running" | "validating";
  targetedRegenerationDisabledReason?: string;
  targetedRegenerationAttempt?: TargetedRegenerationAttemptDisplay | null;
  repairReview?: RepairReviewDisplay;
  targetedRegenerationResultDismissed?: boolean;
  targetedRegenerationElapsedSeconds?: number;
  onRetryTargetedRegeneration?: () => void;
  onDismissTargetedRegenerationResult?: () => void;
  reviewFreshness?: ReviewFreshnessDisplay;
  reviewRefreshStatus?: "idle" | "running" | "failed";
  reviewRefreshError?: string;
  onRecheckReview?: () => void;
}) {
  const summary = summarizeDecision(decision);
  const blockers = decision.blockers || [];
  const rawBlockerCards = blockers.map((item, index) => blockerCardFor(item, index, cv));
  const blockerCards = dedupeBlockerCards(rawBlockerCards);
  const estimatedSeconds = blockerCards.reduce((total, item) => total + item.estimatedSeconds, 0);
  const currentCard = blockerCards[0];
  const proposals = useMemo(() => blockerCards.map((card, index) => {
    if (!proposalResolver) return null;
    return proposalResolver({
      blockerId: card.id,
      rawBlocker: card.advancedDetail || card.rawBlocker || blockers[index] || "",
      title: card.title,
      explanation: card.explanation,
      target: card.target
    });
  }), [blockerCards, blockers, proposalResolver]);
  const [proposalGenerationState, setProposalGenerationState] = useState<ProposalGenerationBaseStatus>("idle");
  const [proposalGenerationError, setProposalGenerationError] = useState("");
  const [proposalGenerationSourceHash, setProposalGenerationSourceHash] = useState("");
  const [proposalReviewOpen, setProposalReviewOpen] = useState(false);
  const [visibleProposals, setVisibleProposals] = useState<RepairProposalDisplay[]>([]);
  const [proposalStatuses, setProposalStatuses] = useState<Record<string, RepairProposalDisplayStatus>>({});
  const proposalCandidates = proposals.filter((proposal): proposal is RepairProposalDisplay => Boolean(proposal));
  const proposalCandidateCount = repairOrchestration?.approvalRequired.length || proposalCandidates.length;
  const proposalGenerationStatus = resolveProposalGenerationStatus({
    candidateCount: proposalCandidateCount,
    generatedProposalCount: visibleProposals.length,
    baseStatus: proposalGenerationState,
    sourceContentHash: proposalGenerationSourceHash,
    currentContentHash: decision.contentHash
  });
  const proposalGenerationCopy = proposalGenerationCta(proposalGenerationStatus, proposalCandidateCount, visibleProposals.length);
  const proposalSourceStale = proposalGenerationStatus === "stale";
  const orchestrationSourceMismatch = Boolean(!visibleProposals.length && repairOrchestration && decision.contentHash && repairOrchestration.cvContentHash !== decision.contentHash);
  if (reviewFreshness && reviewFreshness.status !== "fresh") {
    const failed = reviewFreshness.status === "failed" || reviewRefreshStatus === "failed";
    const running = reviewFreshness.status === "running" || reviewRefreshStatus === "running";
    return (
      <section className="ux-simplified-review" aria-label="Review repair export experience">
        <section className={failed ? "repair-proposal-panel error" : "repair-proposal-panel warning"} aria-label="Review freshness" data-testid="review-freshness-state">
          <span className="eyebrow">Review Status</span>
          <strong>{failed ? "Updated CV review failed" : running ? "Rechecking updated CV…" : "Review is out of date for the current CV."}</strong>
          <p>{failed
            ? reviewRefreshError || "The previous blocker list is no longer current. Recheck the updated CV before continuing."
            : running
              ? "The current CV is being checked against its new version and content hash."
              : "Previous blockers are hidden until the current CV version and content hash have been reviewed."}</p>
          <button className="primary" type="button" data-testid="recheck-updated-cv" onClick={onRecheckReview} disabled={running || !onRecheckReview}>
            {running ? "Rechecking Updated CV…" : "Recheck Updated CV"}
          </button>
          <details className="advanced-diagnostics">
            <summary>Advanced Details</summary>
            <dl className="repair-route-counts">
              <div><dt>Current CV version</dt><dd>{reviewFreshness.currentCvVersionId || "unavailable"}</dd></div>
              <div><dt>Current CV hash</dt><dd>{reviewFreshness.currentCvContentHash || "unavailable"}</dd></div>
              <div><dt>Current Summary hash</dt><dd>{reviewFreshness.currentSummaryHash || "unavailable"}</dd></div>
              <div><dt>Last review run</dt><dd>{reviewFreshness.reviewRunId || "none"}</dd></div>
              <div><dt>Reviewed CV version</dt><dd>{reviewFreshness.reviewedCvVersionId || "none"}</dd></div>
              <div><dt>Reviewed CV hash</dt><dd>{reviewFreshness.reviewedCvContentHash || "none"}</dd></div>
              <div><dt>Reviewed Summary hash</dt><dd>{reviewFreshness.reviewedSummaryHash || "none"}</dd></div>
              <div><dt>Freshness</dt><dd>{reviewFreshness.status}</dd></div>
            </dl>
          </details>
        </section>
      </section>
    );
  }
  function proposalStatus(proposal: RepairProposalDisplay) {
    return proposalStatuses[proposal.id] || proposal.status;
  }
  function validProposal(proposal: RepairProposalDisplay | null) {
    return Boolean(
      proposal?.id
      && proposal.blockerId
      && proposal.target
      && proposal.currentValue !== undefined
      && proposal.suggestedValue
      && proposal.reason
      && proposal.estimatedImpact
      && proposal.risk
      && proposal.confidence
    );
  }
  function generateVisibleProposals() {
    if (proposalGenerationStatus === "running") return;
    onGenerateAiProposals?.();
    setProposalGenerationState("running");
    setProposalGenerationError("");
    setProposalGenerationSourceHash(decision.contentHash || "");
    setProposalReviewOpen(false);
    window.setTimeout(() => {
      try {
        const valid = proposalCandidates.filter(validProposal);
        if (!valid.length) {
          setVisibleProposals([]);
          setProposalGenerationState("empty");
          setProposalGenerationError("");
          return;
        }
        setVisibleProposals(valid);
        setProposalStatuses({});
        setProposalGenerationState("success");
      } catch (error) {
        setVisibleProposals([]);
        setProposalGenerationState("error");
        setProposalGenerationError(error instanceof Error && error.message ? error.message : "AI suggestions could not be generated.");
      }
    }, 1000);
  }
  function setProposalStatus(proposal: RepairProposalDisplay, status: RepairProposalDisplayStatus) {
    setProposalStatuses((current) => ({ ...current, [proposal.id]: status }));
  }
  function editManually(proposal: RepairProposalDisplay) {
    const matchingCard = blockerCards.find((card) => card.id === proposal.blockerId);
    if (!matchingCard?.target) return;
    onJumpToFix?.({
      blockerId: matchingCard.id,
      title: matchingCard.title,
      explanation: matchingCard.explanation,
      expectedOutcome: matchingCard.expectedOutcome,
      affectedField: matchingCard.affectedField,
      progressLabel: `1 of ${blockerCards.length}`,
      advancedDetail: matchingCard.advancedDetail,
      target: matchingCard.target
    });
  }
  const acceptedCount = visibleProposals.filter((proposal) => proposalStatus(proposal) === "accepted").length;
  const rejectedCount = visibleProposals.filter((proposal) => proposalStatus(proposal) === "rejected").length;
  const undecidedCount = visibleProposals.filter((proposal) => proposalStatus(proposal) === "draft").length;
  const staleCount = proposalSourceStale ? visibleProposals.length : 0;
  const proposalDisabledReason = proposalGenerationDisabledReason
    || (orchestrationSourceMismatch ? "The CV changed after these suggestions were classified. Refresh review before generating suggestions." : "")
    || (!onGenerateAiProposals && ["ready", "empty", "error", "stale"].includes(proposalGenerationStatus) ? "No proposal-generation action handler is available." : "")
    || (proposalGenerationStatus === "running" ? "AI suggestions are already being generated." : "");
  const targetedNoDiffTerminal = targetedRegenerationAttempt?.outcome === "no-diff-terminal";
  const targetedReviewRefailed = repairReview?.outcome === "still-failed";
  const targetedNoDiffActionState = targetedNoDiffTerminal && targetedRegenerationLifecycle === "idle";
  const manualAlternativeLabel = targetedRegenerationAttempt?.strategy === "summary" || repairReview?.targetZone === "summary"
    ? "Edit Summary Manually"
    : targetedRegenerationAttempt?.strategy === "wording"
      ? "Edit Wording Manually"
      : "Edit Work Bullets Manually";
  const orchestratorCanOpenProposal = repairOrchestration?.recommendedNextRoute === "review-ai-proposals"
    && !proposalDisabledReason
    && proposalGenerationStatus !== "idle";
  const orchestratorCanRunSafeRepair = repairOrchestration?.recommendedNextRoute === "run-safe-repair" && Boolean(onRunSafeRepairs);
  const orchestratorCanRunTargetedRegeneration = repairOrchestration?.recommendedNextRoute === "run-targeted-regeneration" && Boolean(onRunTargetedRegeneration) && !targetedRegenerationDisabledReason && !targetedNoDiffActionState && !targetedReviewRefailed;
  const orchestratorCanCollectHumanInput = repairOrchestration?.recommendedNextRoute === "collect-human-input" && Boolean(currentCard?.target) && Boolean(onCollectHumanInput || onJumpToFix);
  const orchestratorCanResolveHumanDecision = repairOrchestration?.recommendedNextRoute === "resolve-human-decision" && Boolean(onResolveHumanDecision);
  const orchestratorCanOpenManualAlternative = (targetedNoDiffActionState || targetedReviewRefailed) && Boolean(currentCard?.target) && Boolean(onJumpToFix);
  const hasOrchestration = Boolean(repairOrchestration);
  const acceptedApplyDisabledReason = proposalSourceStale
    ? "The CV changed after these suggestions were created. Generate new suggestions."
    : acceptedCount <= 0
      ? "Accept at least one non-stale suggestion before applying changes."
      : !onApplyAcceptedProposals
        ? "No proposal apply handler is available."
        : "";
  const routedCurrentRepairAction = currentCard
    ? repairActionForCard({
      card: currentCard,
      routeItem: routeItemForCard(currentCard, repairOrchestration),
      proposal: proposals[0]
    })
    : undefined;
  const currentRepairAction = (targetedNoDiffActionState || targetedReviewRefailed) && routedCurrentRepairAction?.kind === "targeted-regeneration" && currentCard?.target
    ? { kind: "manual-edit" as const, label: manualAlternativeLabel, editTarget: currentCard.target }
    : routedCurrentRepairAction;
  const targetedRegenerationBusy = targetedRegenerationLifecycle !== "idle";
  const targetedRegenerationCopy = (() => {
    if (!routedCurrentRepairAction || routedCurrentRepairAction.kind !== "targeted-regeneration") return { label: "", note: "" };
    if (targetedRegenerationLifecycle === "running") {
      if (/Summary/i.test(routedCurrentRepairAction.label)) return { label: "Regenerating Summary…", note: "Targeted regeneration is running from selected evidence." };
      if (/Work Bullets/i.test(routedCurrentRepairAction.label)) return { label: "Regenerating Work Bullets…", note: "Targeted regeneration is rewriting only authorized work bullets." };
      return { label: "Improving CV Wording…", note: "Targeted regeneration is improving only authorized wording zones." };
    }
    if (targetedRegenerationLifecycle === "validating") return { label: "Validating regenerated content…", note: "Checking changed and preserved zones before refreshing export readiness." };
    return { label: routedCurrentRepairAction.label, note: "Regenerates only the affected section from selected evidence after explicit user action." };
  })();
  const activeTargetZones = targetedRegenerationAttempt?.targetZones
    || (routedCurrentRepairAction?.kind === "targeted-regeneration" ? routedCurrentRepairAction.targetZones : []);
  const targetZoneLabel = activeTargetZones.length ? activeTargetZones.join(", ") : currentCard?.affectedField || "Selected CV section";
  const summaryReviewComparisonRows = summaryReviewRows(repairReview?.previousSummaryReview, repairReview?.updatedSummaryReview);
  function runTargetedRegenerationFromUi() {
    if (!onRunTargetedRegeneration || targetedRegenerationBusy || targetedRegenerationDisabledReason) return;
    onRunTargetedRegeneration();
  }
  function runUserRepairAction(action: UserRepairAction, context: GuidedEditContext | null) {
    if (action.kind === "safe-repair") return onRunSafeRepairs?.();
    if (action.kind === "targeted-regeneration") return runTargetedRegenerationFromUi();
    if (action.kind === "human-input" && context) return (onCollectHumanInput || onJumpToFix)?.(context);
    if (action.kind === "ai-proposal") {
      if (proposalGenerationStatus === "success") {
        setProposalReviewOpen(true);
        return;
      }
      return generateVisibleProposals();
    }
    if (action.kind === "human-decision") return onResolveHumanDecision?.();
    if (action.kind === "manual-edit" && context) return onJumpToFix?.(context);
  }
  function runOrchestrationNextAction() {
    if ((targetedNoDiffActionState || targetedReviewRefailed) && currentCard?.target) {
      return onJumpToFix?.({
        blockerId: currentCard.id,
        title: currentCard.title,
        explanation: currentCard.explanation,
        expectedOutcome: currentCard.expectedOutcome,
        affectedField: currentCard.affectedField,
        progressLabel: `1 of ${blockerCards.length}`,
        advancedDetail: currentCard.advancedDetail,
        target: currentCard.target
      });
    }
    if (orchestratorCanRunSafeRepair) return onRunSafeRepairs?.();
    if (orchestratorCanRunTargetedRegeneration) return runTargetedRegenerationFromUi();
    if (orchestratorCanCollectHumanInput && currentCard?.target) {
      const context = {
        blockerId: currentCard.id,
        title: currentCard.title,
        explanation: currentCard.explanation,
        expectedOutcome: currentCard.expectedOutcome,
        affectedField: currentCard.affectedField,
        progressLabel: `1 of ${blockerCards.length}`,
        advancedDetail: currentCard.advancedDetail,
        target: currentCard.target
      };
      return (onCollectHumanInput || onJumpToFix)?.(context);
    }
    if (orchestratorCanOpenProposal) {
      if (proposalGenerationStatus === "success") {
        setProposalReviewOpen(true);
        return;
      }
      return generateVisibleProposals();
    }
    if (orchestratorCanResolveHumanDecision) return onResolveHumanDecision?.();
  }
  function applyAccepted() {
    if (acceptedApplyDisabledReason) return;
    onApplyAcceptedProposals?.({ proposals: visibleProposals, statuses: proposalStatuses });
  }
  return (
    <section className="ux-simplified-review" aria-label="Review repair export experience">
      <section className={decision.ready ? "overall-status-card ready" : "overall-status-card needs-attention"} aria-label="Overall Status">
        <span className="eyebrow">Overall Status</span>
        <strong>{decision.ready ? "Ready to Export" : blockers.length ? "Needs Attention" : "Manual Review Needed"}</strong>
        <p>{decision.ready
          ? "Export is available because no blocking issues remain."
          : `${blockers.length || "Some"} blocking item${blockers.length === 1 ? "" : "s"} must be resolved before export.`}</p>
        <dl>
          <div>
            <dt>Blockers</dt>
            <dd>{blockers.length}</dd>
          </div>
          <div>
            <dt>Warnings</dt>
            <dd>{summary.warnings.length}</dd>
          </div>
          <div>
            <dt>Manual review</dt>
            <dd>{summary.manualReviewItems.length}</dd>
          </div>
        </dl>
      </section>

      {!decision.ready && repairOrchestration ? (
        <details className="advanced-diagnostics">
          <summary>Advanced Details</summary>
          <dl className="repair-route-counts">
            <div><dt>Recommended route</dt><dd>{repairOrchestration.recommendedNextRoute}</dd></div>
            <div><dt>Safe automatic candidates</dt><dd>{repairOrchestration.safeAuto?.length || 0}</dd></div>
            <div><dt>AI proposal candidates</dt><dd>{repairOrchestration.approvalRequired?.length || 0}</dd></div>
            <div><dt>Targeted regeneration candidates</dt><dd>{repairOrchestration.targetedRegeneration?.length || 0}</dd></div>
            <div><dt>Human input candidates</dt><dd>{repairOrchestration.humanInput?.length || 0}</dd></div>
          </dl>
        </details>
      ) : null}

      {(currentCard || repairReview) ? (
        <section className="next-step-card" aria-label="Repair Workflow" data-testid="repair-workflow">
          <span className="eyebrow">Repair Workflow</span>
          <div className="repair-route-counts">
            <div data-testid="repair-workflow-issue">
              <dt>Issue</dt>
              <dd>{repairReview
                ? summaryRepairIssueLabel(repairReview)
                : currentCard?.title}</dd>
            </div>
            <div data-testid="repair-workflow-fix">
              <dt>Fix</dt>
              <dd>{targetedRegenerationLifecycle === "running"
                ? targetZoneLabel === "summary" ? "AI is updating the Summary…"
                  : /work/i.test(targetZoneLabel) ? "AI is updating the Work Experience…" : "AI is updating the selected wording…"
                : repairReview ? "Summary updated" : targetedNoDiffActionState ? "No safe change found" : "Not started"}</dd>
            </div>
            <div data-testid="repair-workflow-review">
              <dt>Review</dt>
              <dd>{targetedRegenerationLifecycle === "validating"
                ? "Reviewing the updated Summary…"
                : repairReview?.outcome === "passed" ? "Passed"
                  : repairReview?.outcome === "still-failed" ? `Needs attention: ${summaryRepairIssueLabel(repairReview)}`
                    : targetedRegenerationLifecycle === "running" ? "Waiting for the update" : "Runs after the fix"}</dd>
            </div>
            <div data-testid="repair-workflow-next">
              <dt>Next</dt>
              <dd>{decision.ready ? "Export CV" : repairReview?.outcome === "passed" && currentCard
                ? currentCard.title
                : targetedReviewRefailed ? manualAlternativeLabel
                  : currentCard?.title || "Review complete"}</dd>
            </div>
          </div>
          {!repairReview && currentCard ? <p><span>Why: </span>{currentCard.explanation}</p> : null}
          {repairReview?.previousValue && repairReview.updatedValue ? (
            <div className="repair-proposal-comparison">
              <div><span className="eyebrow">Before</span><p>{repairReview.previousValue}</p></div>
              <div><span className="eyebrow">Updated</span><p>{repairReview.updatedValue}</p></div>
            </div>
          ) : null}
          {repairReview && (repairReview.failedCriteria.length || summaryReviewComparisonRows.length) ? (
            <details className="advanced-diagnostics">
              <summary>Advanced Details</summary>
              {summaryReviewComparisonRows.length ? (
                <ul>{summaryReviewComparisonRows.map((row) => (
                  <li key={row.id}>{row.id}: {row.before} -&gt; {row.after}{row.reason ? ` · ${row.reason}` : ""}</li>
                ))}</ul>
              ) : (
                <ul>{repairReview.failedCriteria.map((criterion) => <li key={criterion}>{criterion}</li>)}</ul>
              )}
              <dl className="repair-route-counts">
                <div><dt>Review run ID</dt><dd>{repairReview.reviewRunId}</dd></div>
                <div><dt>Reviewed at</dt><dd>{repairReview.reviewedAt}</dd></div>
                <div><dt>Reviewed CV version</dt><dd>{repairReview.reviewedCvVersionId}</dd></div>
                <div><dt>Reviewed CV hash</dt><dd>{repairReview.reviewedCvContentHash}</dd></div>
                <div><dt>Reviewed Summary hash</dt><dd>{repairReview.reviewedSummaryHash}</dd></div>
                {repairReview.updatedSummaryReview ? <div><dt>Positioning mode</dt><dd>{repairReview.updatedSummaryReview.positioningMode}</dd></div> : null}
                <div><dt>Current blocker ID</dt><dd>{repairReview.blockerId || "none"}</dd></div>
              </dl>
            </details>
          ) : null}
          {targetedRegenerationLifecycle !== "idle" ? (
            <details className="advanced-diagnostics">
              <summary>Advanced Details</summary>
              <dl className="repair-route-counts">
                <div><dt>Elapsed</dt><dd>{targetedRegenerationElapsedSeconds}s</dd></div>
                <div><dt>Target zone</dt><dd>{targetZoneLabel}</dd></div>
                <div><dt>Current step</dt><dd>{targetedRegenerationLifecycle === "running" ? "Generating content" : "Validating content"}</dd></div>
              </dl>
              <p>{targetedRegenerationLifecycle === "running"
                ? "Protected: Contact, Skills, and unrelated work history."
                : "Checking evidence traceability, unsupported claims, allowed mutation zones, duplicate wording, and required fields."}</p>
            </details>
          ) : null}
          {targetedNoDiffActionState && targetedRegenerationAttempt ? (
            <details className="advanced-diagnostics" data-testid="targeted-regeneration-terminal">
              <summary>Advanced Details</summary>
              <p>AI could not produce a safe improvement for this {targetedRegenerationAttempt.strategy === "summary" ? "Summary" : "section"}.</p>
              <p>Attempt: {targetedRegenerationAttempt.attemptCount}</p>
              <p>Stop reason: {targetedRegenerationAttempt.finalStopReason}</p>
              <button className="tertiary" type="button" data-testid="targeted-regeneration-retry" onClick={onRetryTargetedRegeneration} disabled={targetedRegenerationBusy || !onRetryTargetedRegeneration}>Retry AI Regeneration</button>
              <p>Retry uses AI tokens again with the same CV and evidence context.</p>
            </details>
          ) : null}
          {!decision.ready && currentCard ? (
            <p><span>Estimated: </span>{formatEffort(currentCard.estimatedSeconds)}</p>
          ) : null}
          {!decision.ready && currentCard ? (
            <>
          {currentRepairAction && currentRepairAction.kind !== "unsupported" && hasOrchestration ? (
            <>
              <button
                className="primary"
                data-testid="repair-orchestrator-cta"
                type="button"
                disabled={targetedRegenerationBusy
                  || (currentRepairAction.kind === "ai-proposal" && proposalGenerationStatus === "running")
                  || Boolean(currentRepairAction.kind === "targeted-regeneration" && targetedRegenerationDisabledReason)}
                onClick={() => runUserRepairAction(currentRepairAction, currentCard.target ? {
                  blockerId: currentCard.id,
                  title: currentCard.title,
                  explanation: currentCard.explanation,
                  expectedOutcome: currentCard.expectedOutcome,
                  affectedField: currentCard.affectedField,
                  progressLabel: `1 of ${blockerCards.length}`,
                  advancedDetail: currentCard.advancedDetail,
                  target: currentCard.target
                } : null)}
              >
                {currentRepairAction.kind === "targeted-regeneration" && targetedRegenerationBusy
                  ? targetedRegenerationCopy.label
                  : currentRepairAction.kind === "ai-proposal" ? proposalGenerationCopy.label
                    : currentRepairAction.kind === "safe-repair"
                      ? `Fix ${repairOrchestration?.safeAuto.length || 0} Item${repairOrchestration?.safeAuto.length === 1 ? "" : "s"} with AI`
                      : currentRepairAction.label}
              </button>
              {currentRepairAction.kind === "targeted-regeneration" && targetedRegenerationDisabledReason ? (
                <p className="section-note" role="status" data-testid="targeted-regeneration-disabled-reason">{targetedRegenerationDisabledReason}</p>
              ) : null}
            </>
          ) : currentCard.target && proposalCandidates[0] && proposalGenerationStatus === "ready" && !hasOrchestration ? (
            <button
              className="primary"
              data-testid="primary-cta"
              type="button"
              onClick={generateVisibleProposals}
            >
              {currentCard.actionLabel}
            </button>
          ) : currentCard.target && proposalCandidates[0] ? null : !hasOrchestration ? (
            <div className="blocker-card-fallback" data-testid="manual-fallback">
              <strong>Manual review required</strong>
              <p>This issue does not have a safe field target. Review the manual decision before editing.</p>
              <button className="primary" data-testid="primary-cta" type="button" disabled>
                Review Manual Decision
              </button>
            </div>
          ) : repairOrchestration?.recommendedNextRoute === "review-ai-proposals" ? (
            <div className="blocker-card-fallback">
              <button className="primary" data-testid="repair-orchestrator-cta" type="button" disabled={Boolean(proposalDisabledReason)} onClick={generateVisibleProposals}>
                {proposalGenerationCopy.label}
              </button>
              {proposalDisabledReason ? <p className="section-note">{proposalDisabledReason}</p> : null}
            </div>
          ) : repairOrchestration?.recommendedNextRoute === "no-available-repair" ? (
            <button className="primary" data-testid="repair-orchestrator-cta" type="button" disabled>No Safe Repair Available</button>
          ) : null}
            </>
          ) : null}
          {proposalGenerationStatus === "ready" ? (
            <section className="repair-proposal-panel" aria-label="AI proposal generation ready" data-testid="proposal-generation-ready">
              <span className="eyebrow">AI Suggestions</span>
              <strong>{proposalCandidateCount} item{proposalCandidateCount === 1 ? " is" : "s are"} ready for AI suggestions.</strong>
              <p>Generate suggestions to review proposed changes. No CV changes will be applied during generation.</p>
            </section>
          ) : null}
          {proposalGenerationStatus === "running" ? (
            <section className="repair-proposal-panel" aria-label="AI proposal generation">
              <span className="eyebrow">Generating AI Suggestions</span>
              <strong>AI suggestions are running</strong>
              <p>Proposal generation started explicitly. No CV changes have been applied yet.</p>
            </section>
          ) : null}
          {proposalGenerationStatus === "empty" ? (
            <section className="repair-proposal-panel warning" aria-label="AI proposal generation empty" data-testid="proposal-generation-empty">
              <span className="eyebrow">AI Suggestions</span>
              <strong>No valid AI suggestions were produced.</strong>
              <p>No valid AI suggestions were produced for the current CV.</p>
            </section>
          ) : null}
          {proposalGenerationStatus === "error" ? (
            <section className="repair-proposal-panel error" aria-label="AI proposal generation error">
              <span className="eyebrow">AI Suggestions</span>
              <strong>Proposal generation error</strong>
              <p>{proposalGenerationError || "AI suggestions could not be generated."}</p>
            </section>
          ) : null}
          {proposalGenerationStatus === "stale" ? (
            <section className="repair-proposal-panel warning" aria-label="AI proposal generation stale" data-testid="proposal-generation-stale">
              <span className="eyebrow">AI Suggestions</span>
              <strong>The CV changed after these suggestions were created.</strong>
              <p>Generate new suggestions.</p>
            </section>
          ) : null}
          {proposalGenerationStatus === "success" && !proposalReviewOpen ? (
            <section className="repair-proposal-panel" aria-label="AI suggestions generated" data-testid="proposal-generation-success">
              <span className="eyebrow">AI Suggestions</span>
              <strong>{visibleProposals.length} suggestion{visibleProposals.length === 1 ? "" : "s"} generated.</strong>
              <p>Review suggestions before accepting or applying changes.</p>
            </section>
          ) : null}
          {proposalGenerationStatus === "success" && proposalReviewOpen && visibleProposals.length ? (
            <section className="repair-proposal-batch" aria-label="AI repair proposals">
              <div className="repair-proposal-head">
                <span className="eyebrow">AI Suggestions</span>
                <strong>{visibleProposals.length} proposal{visibleProposals.length === 1 ? "" : "s"} ready</strong>
              </div>
              <dl className="repair-route-counts">
                <div><dt>Proposal candidates</dt><dd>{proposalCandidateCount}</dd></div>
                <div><dt>Generated suggestions</dt><dd>{visibleProposals.length}</dd></div>
                <div><dt>Accepted</dt><dd>{acceptedCount}</dd></div>
                <div><dt>Rejected</dt><dd>{rejectedCount}</dd></div>
                <div><dt>Undecided</dt><dd>{undecidedCount}</dd></div>
                <div><dt>Stale</dt><dd>{staleCount}</dd></div>
              </dl>
              {visibleProposals.map((proposal) => (
                <RepairProposalPanel
                  key={proposal.id}
                  proposal={proposal}
                  status={proposalStatus(proposal)}
                  stale={proposalSourceStale}
                  onAccept={() => setProposalStatus(proposal, "accepted")}
                  onReject={() => setProposalStatus(proposal, "rejected")}
                  onEditManually={() => editManually(proposal)}
                />
              ))}
              <div className="repair-proposal-actions">
                <button className="primary" data-testid="apply-accepted-proposals" type="button" onClick={applyAccepted} disabled={Boolean(acceptedApplyDisabledReason)}>
                  Apply {acceptedCount} Accepted Change{acceptedCount === 1 ? "" : "s"}
                </button>
              </div>
              {acceptedApplyDisabledReason ? <p className="section-note" data-testid="proposal-apply-disabled-reason">{acceptedApplyDisabledReason}</p> : null}
            </section>
          ) : null}
        </section>
      ) : null}

      {!decision.ready ? (
        <>
          <RepairProgress
            completedCount={0}
            remainingCount={blockerCards.length}
            estimatedSeconds={estimatedSeconds}
            currentItem={currentCard?.title}
          />
          {blockerCards.length ? (
            <section className="remaining-issues-list" aria-label="Remaining Issues">
              <span className="eyebrow">Remaining Issues</span>
              {blockerCards.map((card, index) => {
                const proposal = proposals[index];
                const routeItem = routeItemForCard(card, repairOrchestration);
                const repairAction = repairActionForCard({ card, routeItem, proposal });
                const terminalForCard = index === 0 && targetedNoDiffActionState && repairAction?.kind === "targeted-regeneration";
                const reFailedForCard = index === 0 && targetedReviewRefailed && repairAction?.kind === "targeted-regeneration";
                const effectiveRepairAction = targetedRegenerationBusy && repairAction?.kind === "targeted-regeneration"
                  ? { ...repairAction, label: targetedRegenerationCopy.label }
                  : (terminalForCard || reFailedForCard) && card.target
                    ? { kind: "manual-edit" as const, label: manualAlternativeLabel, editTarget: card.target }
                    : repairAction;
                const actionLabel = effectiveRepairAction && effectiveRepairAction.kind !== "unsupported" ? effectiveRepairAction.label : card.actionLabel;
                const displayCard = effectiveRepairAction || proposal
                  ? { ...card, repairAction: effectiveRepairAction, actionLabel }
                  : { ...card, target: null, actionLabel: "Review Manual Decision" };
                return (
                <Fragment key={card.id}>
                  <BlockerCard
                    blocker={displayCard}
                    order={index + 1}
                    progressLabel={`${index + 1} of ${blockerCards.length}`}
                    status={terminalForCard ? "AI attempted - no safe improvement" : reFailedForCard ? "Summary updated - review still failed" : index === 0 ? "Next" : effectiveRepairAction || proposal ? "Pending" : "Needs Manual Review"}
                    disabled={targetedRegenerationBusy}
                    onJumpToFix={(context) => {
                      if (effectiveRepairAction) return onJumpToFix?.(context);
                      if (proposal && !hasOrchestration && proposalGenerationStatus === "ready") generateVisibleProposals();
                      else onJumpToFix?.(context);
                    }}
                    onRepairAction={runUserRepairAction}
                  />
                </Fragment>
                );
              })}
            </section>
          ) : (
            <p className="section-note">No blockers remain.</p>
          )}
        </>
      ) : null}

      <section className={decision.ready ? "export-status-card ready" : "export-status-card locked"} aria-label="Export Status">
        <span className="eyebrow">Readiness and Export</span>
        <strong>{decision.ready ? "Ready to Export" : "Export locked"}</strong>
        <p>{decision.ready ? "No blocking issues remain." : `${blockers.length || "One or more"} blocking item${blockers.length === 1 ? " remains" : "s remain"}. Complete the guided fixes above to unlock export.`}</p>
        <WarningSummary warnings={summary.warnings} manualReviewItems={summary.manualReviewItems} />
      </section>

      {decision.ready ? (
        <button className="primary" data-testid="primary-cta" onClick={onExport}>Export CV</button>
      ) : null}

      <details className="advanced-diagnostics">
        <summary>Advanced Details</summary>
        <div className="advanced-diagnostics-grid">
          <div>
            <strong>Decision</strong>
            <ul>
              <li>Recommendation: {summary.recommendation}</li>
              <li>Readiness: {summary.readinessLabel}</li>
              <li>Confidence: {summary.confidence}</li>
              {decision.contentHash ? <li>CV hash: {decision.contentHash}</li> : null}
            </ul>
          </div>
          <div>
            <strong>Raw blockers</strong>
            {blockers.length ? <ul>{blockers.map((item) => <li key={`raw-blocker-${item}`}>{item}</li>)}</ul> : <p>No raw blockers.</p>}
          </div>
          <div>
            <strong>Raw warnings</strong>
            {decision.warnings.length ? <ul>{decision.warnings.map((item) => <li key={`raw-warning-${item}`}>{item}</li>)}</ul> : <p>No raw warnings.</p>}
          </div>
        </div>
      </details>
    </section>
  );
}
