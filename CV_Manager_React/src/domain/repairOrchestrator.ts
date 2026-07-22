import { resolveBlockerEditTarget, type BlockerEditTarget } from "../components/cv/guidedEditing";
import type { TailoredCv } from "../types";
import type { ReviewerIssue } from "../types";
import type {
  RepairClassification,
  RepairClassificationIdentity,
  RepairOrchestrationInput,
  RepairOrchestrationSummary,
  RepairRoute
} from "./repairOrchestrator.types";

const ALL_MUTATION_ZONES = [
  "header.contact",
  "header.targetRole",
  "summary",
  "workExperience",
  "sidebar.skills",
  "sidebar.education",
  "sidebar.certifications",
  "export"
];

function blockerId(rawBlocker: string, index: number) {
  const suffix = rawBlocker.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 52);
  return `blocker-${index + 1}-${suffix || "unknown"}`;
}

function structuredIssueLabel(issue: ReviewerIssue) {
  return [
    issue.category,
    issue.title,
    issue.description,
    issue.suggestedRepairIntent || "",
    issue.evidence?.reason || ""
  ].filter(Boolean).join(": ");
}

function structuredIssueRoute(issue: ReviewerIssue): {
  route: RepairRoute;
  reason: string;
  unsupportedReason?: string;
} {
  if (issue.repairability === "not-repairable") {
    return {
      route: "unsupported",
      reason: "Reviewer marked this issue as not repairable by CV mutation.",
      unsupportedReason: issue.suggestedRepairIntent || "This issue must remain a risk, human decision, or upstream evidence/positioning action."
    };
  }
  if (issue.category === "Capability Gap") {
    return {
      route: "unsupported",
      reason: "Truthful capability gaps must not be rewritten as solved strengths.",
      unsupportedReason: "Add evidence or change positioning upstream; do not repair by stronger wording."
    };
  }
  if (issue.repairability === "human-input" || issue.category === "Profile Completeness") {
    return { route: "human-input", reason: issue.suggestedRepairIntent || "Trusted user/profile input is required." };
  }
  if (issue.repairability === "human-decision" || issue.category === "Evidence Missing") {
    return { route: "human-decision", reason: issue.suggestedRepairIntent || "A human must decide the correct evidence or claim boundary." };
  }
  if (issue.repairability === "auto-repairable" || issue.category === "Formatting") {
    return { route: "safe-auto", reason: issue.suggestedRepairIntent || "This structured issue is safe for deterministic bounded repair." };
  }
  if (issue.category === "Unsupported Claim" || issue.category === "Policy Violation") {
    return {
      route: "approval-required",
      reason: issue.suggestedRepairIntent || "Remove or downgrade unsupported wording within the Reviewer boundary."
    };
  }
  if (issue.category === "Keyword Coverage") {
    return {
      route: "approval-required",
      reason: issue.suggestedRepairIntent || "Add only evidence-supported keywords inside the allowed repair boundary."
    };
  }
  if (issue.category === "External Wording") {
    const boundary = issue.expectedRepairBoundary || [];
    if (boundary.includes("summary") && !boundary.includes("workExperience")) {
      return {
        route: "targeted-regeneration",
        reason: issue.suggestedRepairIntent || "Regenerate the summary within existing Analysis and evidence boundaries."
      };
    }
    return {
      route: "approval-required",
      reason: issue.suggestedRepairIntent || "Improve external wording while preserving evidence and meaning."
    };
  }
  return {
    route: "unsupported",
    reason: "No ADR-006 repair route is available for this structured issue.",
    unsupportedReason: "The structured issue must be handled manually or by a future policy."
  };
}

function zonesForStructuredIssue(issue: ReviewerIssue) {
  const allowedMutationZones = (issue.expectedRepairBoundary || []).filter((zone) => ALL_MUTATION_ZONES.includes(zone));
  return {
    allowedMutationZones,
    prohibitedMutationZones: ALL_MUTATION_ZONES.filter((item) => !allowedMutationZones.includes(item))
  };
}

function zoneForTarget(target: BlockerEditTarget | undefined) {
  if (!target) return "";
  if (target.section === "contact") return "header.contact";
  if (target.section === "summary") return "summary";
  if (target.section === "workExperience") return "workExperience";
  if (target.section === "skills") return "sidebar.skills";
  if (target.section === "education") return "sidebar.education";
  if (target.section === "certifications") return "sidebar.certifications";
  return "";
}

function zonesFor(target: BlockerEditTarget | undefined) {
  const zone = zoneForTarget(target);
  const allowedMutationZones = zone ? [zone] : [];
  return {
    allowedMutationZones,
    prohibitedMutationZones: ALL_MUTATION_ZONES.filter((item) => !allowedMutationZones.includes(item))
  };
}

function bulletEvidenceIds(cv: TailoredCv | undefined, target: BlockerEditTarget | undefined) {
  if (!cv || target?.section !== "workExperience" || !target.bulletId) return [];
  const [experienceIndex, subsectionIndex, bulletIndex] = target.bulletId.split("-").map((value) => Number(value));
  if (![experienceIndex, subsectionIndex, bulletIndex].every(Number.isFinite)) return [];
  return cv.workExperience[experienceIndex]?.subsections[subsectionIndex]?.bullets[bulletIndex]?.evidenceIds || [];
}

function hasTrustedEmail(input: RepairOrchestrationInput) {
  return Boolean(input.trustedProfileEmail && /\S+@\S+\.\S+/.test(input.trustedProfileEmail));
}

function hasSelectedEvidence(input: RepairOrchestrationInput) {
  return Boolean(input.selectedEvidenceIds?.length);
}

function routeFor(rawBlocker: string, target: BlockerEditTarget | undefined, input: RepairOrchestrationInput): {
  route: RepairRoute;
  reason: string;
  unsupportedReason?: string;
} {
  const raw = rawBlocker.toLowerCase();

  if (/career positioning|role identity|choose.*role|strategic trade|personal preference/.test(raw)) {
    return { route: "human-decision", reason: "This changes career positioning or role identity and requires user judgement." };
  }

  if (/unsupported experience|deciding whether a claim is true|claim is true|evidence conflict|evidence mismatch|uncertain achievement|omitted achievement/.test(raw)) {
    return { route: "human-decision", reason: "This requires deciding what is true or which evidence should be used." };
  }

  if (/missing evidence|required evidence missing|no selected evidence|evidence traceability/.test(raw)) {
    return {
      route: "human-decision",
      reason: "Evidence must be selected, corrected, or the claim must be downgraded by a human."
    };
  }

  if (/duplicate|duplicated|repeated wording|repeated bullet/.test(raw)) {
    return { route: "safe-auto", reason: "Exact duplicate wording can be removed without changing meaning." };
  }

  if (/contact extraction|contact email|missing email/.test(raw)) {
    if (hasTrustedEmail(input)) {
      return { route: "safe-auto", reason: "A trusted profile email is available for the missing email field." };
    }
    return {
      route: "human-input",
      reason: "Missing contact data must be entered by the user because no trusted value is available."
    };
  }

  if (/summary.*role fit|role fit.*summary|summary needs clearer role fit|hiring manager relevance|manager relevance/.test(raw)) {
    if (target?.section === "summary" && hasSelectedEvidence(input)) {
      return { route: "targeted-regeneration", reason: "The summary can be regenerated from the effective CV Brief and selected evidence." };
    }
  }

  if (/achievements need stronger support|achievement.*stronger support|work achievements need stronger/i.test(raw) && !/first|second|third|bullet \d|work bullet/.test(raw)) {
    if (hasSelectedEvidence(input)) {
      return { route: "targeted-regeneration", reason: "Broad achievement support needs targeted current-role bullet regeneration from selected evidence." };
    }
  }

  if (/wording needs to be clearer for recruiters|clearer for recruiters|cleaner cv wording/i.test(raw) && !/first|second|third|work-log|exact|bullet \d|work bullet/.test(raw)) {
    if (hasSelectedEvidence(input)) {
      return { route: "targeted-regeneration", reason: "Broad recruiter wording should be regenerated for the affected visible section from selected evidence." };
    }
  }

  if (!target) {
    return {
      route: "unsupported",
      reason: "No reliable edit target is available.",
      unsupportedReason: "The blocker cannot be mapped to a safe CV field."
    };
  }

  if (/known internal terminology|explicit terminology mapping|deterministic formatting|normalization/.test(raw)) {
    return { route: "safe-auto", reason: "The blocker has an explicit deterministic replacement or normalization rule." };
  }

  if (/summary|weak claims|work bullet|first work bullet|external wording|internal wording|work-log|wording|business impact|action\/outcome|manager relevance|hiring manager relevance|readability|unsupported claims/.test(raw)) {
    return { route: "approval-required", reason: "This may preserve evidence but materially changes visible wording, so the user must review it first." };
  }

  if (/keyword|must-have|supported keyword/.test(raw)) {
    return { route: "approval-required", reason: "Keyword placement changes visible wording and should be reviewed before application." };
  }

  return {
    route: "unsupported",
    reason: "No authorized repair route is available from repository contracts.",
    unsupportedReason: "The orchestrator does not have enough evidence to classify this as safe or approval-ready."
  };
}

function routeFlags(route: RepairRoute) {
  return {
    requiresUserApproval: route === "approval-required" || route === "human-decision",
    canUseExistingLocalRepair: route === "safe-auto",
    canRequestAiProposal: route === "approval-required",
    canRunTargetedRegeneration: route === "targeted-regeneration",
    requiresHumanInput: route === "human-input"
  };
}

function riskFor(route: RepairRoute) {
  if (route === "safe-auto") return "low" as const;
  if (route === "approval-required") return "medium" as const;
  if (route === "targeted-regeneration") return "medium" as const;
  if (route === "human-input") return "medium" as const;
  return "high" as const;
}

function confidenceFor(route: RepairRoute, target: BlockerEditTarget | undefined) {
  if (route === "unsupported") return "not-available" as const;
  if (route === "safe-auto" && target) return "high" as const;
  if (route === "approval-required" && target) return "medium" as const;
  if (route === "targeted-regeneration") return "medium" as const;
  if (route === "human-input" && target) return "high" as const;
  return "low" as const;
}

export function classifyRepairBlocker(input: RepairOrchestrationInput, rawBlocker: string, index: number): RepairClassification {
  const id = blockerId(rawBlocker, index);
  const targetResult = resolveBlockerEditTarget({ blockerId: id, rawBlocker, cv: input.cv });
  const target = targetResult?.target;
  const route = routeFor(rawBlocker, target, input);
  let zones = zonesFor(target);
  if (route.route === "targeted-regeneration" && !zones.allowedMutationZones.length) {
    const raw = rawBlocker.toLowerCase();
    const allowedMutationZones = /summary|role fit|manager relevance/.test(raw) ? ["summary"] : ["workExperience"];
    zones = {
      allowedMutationZones,
      prohibitedMutationZones: ALL_MUTATION_ZONES.filter((item) => !allowedMutationZones.includes(item))
    };
  }
  const evidenceIds = bulletEvidenceIds(input.cv, target);
  const flags = routeFlags(route.route);

  return {
    blockerId: id,
    source: "legacy-blocker",
    route: route.route,
    reason: route.reason,
    rawBlocker,
    target,
    evidenceIds,
    cvVersionId: input.cvVersionId,
    cvContentHash: input.cvContentHash,
    risk: riskFor(route.route),
    confidence: confidenceFor(route.route, target),
    ...zones,
    ...flags,
    unsupportedReason: route.unsupportedReason
  };
}

export function classifyStructuredRepairIssue(input: RepairOrchestrationInput, issue: ReviewerIssue, index: number): RepairClassification {
  const rawBlocker = structuredIssueLabel(issue);
  const id = `structured-${issue.id || blockerId(rawBlocker, index)}`;
  const route = structuredIssueRoute(issue);
  const zones = zonesForStructuredIssue(issue);
  const flags = routeFlags(route.route);
  return {
    blockerId: id,
    reviewerIssueId: issue.id,
    source: "structured-reviewer-contract",
    route: route.route,
    reason: route.reason,
    rawBlocker,
    reviewerCategory: issue.category,
    reviewerSeverity: issue.severity,
    reviewerRepairability: issue.repairability,
    suggestedRepairIntent: issue.suggestedRepairIntent,
    target: undefined,
    evidenceIds: issue.evidence?.evidenceIds || [],
    cvVersionId: input.cvVersionId,
    cvContentHash: input.cvContentHash,
    risk: riskFor(route.route),
    confidence: route.route === "unsupported" ? "not-available" : "high",
    ...zones,
    ...flags,
    unsupportedReason: route.unsupportedReason
  };
}

function recommendedNextRoute(summary: Omit<RepairOrchestrationSummary, "recommendedNextRoute">): RepairOrchestrationSummary["recommendedNextRoute"] {
  if (summary.safeAuto.length) return "run-safe-repair";
  if (summary.approvalRequired.length) return "review-ai-proposals";
  if (summary.targetedRegeneration.length) return "run-targeted-regeneration";
  if (summary.humanInput.length) return "collect-human-input";
  if (summary.humanDecision.length) return "resolve-human-decision";
  return "no-available-repair";
}

export function orchestrateRepair(input: RepairOrchestrationInput): RepairOrchestrationSummary {
  const classifications = input.structuredIssues?.length
    ? input.structuredIssues.map((issue, index) => classifyStructuredRepairIssue(input, issue, index))
    : input.blockers.map((blocker, index) => classifyRepairBlocker(input, blocker, index));
  const summary = {
    cvVersionId: input.cvVersionId,
    cvContentHash: input.cvContentHash,
    totalBlockers: classifications.length,
    safeAuto: classifications.filter((item) => item.route === "safe-auto"),
    approvalRequired: classifications.filter((item) => item.route === "approval-required"),
    targetedRegeneration: classifications.filter((item) => item.route === "targeted-regeneration"),
    humanInput: classifications.filter((item) => item.route === "human-input"),
    humanDecision: classifications.filter((item) => item.route === "human-decision"),
    unsupported: classifications.filter((item) => item.route === "unsupported")
  };
  return {
    ...summary,
    recommendedNextRoute: recommendedNextRoute(summary)
  };
}

export function isRepairClassificationStale(classification: RepairClassificationIdentity, current: RepairClassificationIdentity) {
  return classification.cvVersionId !== current.cvVersionId || classification.cvContentHash !== current.cvContentHash;
}

export function isRepairOrchestrationSummaryStale(summary: RepairOrchestrationSummary, current: RepairClassificationIdentity) {
  return summary.cvVersionId !== current.cvVersionId || summary.cvContentHash !== current.cvContentHash;
}
