import type {
  AppData,
  JobApplication,
  SummaryQualityContract,
  SummaryQualityCriterion,
  SummaryReviewCriterionResult,
  SummaryReviewResult,
  TailoredCv
} from "../types";
import { isEvidenceCvUsable } from "../data/evidence";

const ROLE_WORDS = new Set(["specialist", "manager", "engineer", "developer", "consultant", "analyst", "lead", "senior"]);

function words(value: string | undefined) {
  return (value || "").toLowerCase().match(/[a-z][a-z0-9+#-]{3,}/g) || [];
}

function meaningfulWords(value: string | undefined) {
  return words(value).filter((word) => !ROLE_WORDS.has(word));
}

function hasAny(text: string, values: string[]) {
  return values.some((value) => {
    const term = value.trim().toLowerCase();
    return term.length >= 4 && text.includes(term);
  });
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function summarizeEvidence(data: AppData | undefined, job: JobApplication) {
  const selected = new Set(job.selectedEvidenceIds || []);
  return (data?.evidenceCards || [])
    .filter((item) => Boolean(data) && selected.has(item.id) && isEvidenceCvUsable(data!, item))
    .map((item) => ({
      evidenceId: item.id,
      label: item.cvAngle || item.cvSafeBullet || item.cvBullet || item.title,
      keywords: unique([
        ...(item.relatedJdKeywords || []),
        ...(item.allowedVisibleClaims || []),
        item.businessFunction || "",
        item.candidateRole || "",
        item.cvAngle || "",
        item.cvSafeBullet || "",
        item.cvBullet || ""
      ]),
      evidenceStrength: item.evidenceStrength || item.confidence || "Unknown"
    }));
}

function positioningMode(job: JobApplication, unsupportedCount: number, supportedCount: number): SummaryQualityContract["positioningMode"] {
  if (job.screeningAnalysis?.positioning?.applyTier === "Avoid") return "not-recommended";
  if (unsupportedCount === 0 && supportedCount >= 3) return "direct-fit";
  if (unsupportedCount <= 2 && supportedCount >= 2) return "adjacent-fit";
  return "transferable-fit";
}

export function buildSummaryQualityContract(input: {
  data?: AppData;
  job: JobApplication;
}): SummaryQualityContract {
  const { data, job } = input;
  const analysis = job.screeningAnalysis;
  const evidence = summarizeEvidence(data, job);
  const mappings = analysis?.jdEvidenceMapping || [];
  const supportedMappings = mappings.filter((item) => item.supportLevel === "Strong" || item.supportLevel === "Partial");
  const unsupportedMappings = mappings.filter((item) => item.supportLevel === "Unsupported" || item.supportLevel === "Weak");
  const supportedEvidenceIds = evidence.map((item) => item.evidenceId);
  const unsupportedCoreRequirements = unsupportedMappings.map((item) => ({
    id: `gap-${item.requirement.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "requirement"}`,
    requirement: item.requirement,
    reason: item.gapOrRisk || item.marketExpectation || "No selected evidence proves this as a solved strength."
  }));
  const prohibitedClaims = unique([
    ...(analysis?.riskyClaims || []),
    ...(analysis?.remainingGaps || []).filter((gap) => gap.riskLevel === "High").map((gap) => gap.gap),
    ...unsupportedMappings.flatMap((item) => [item.requirement, item.safeCvAngle, item.gapOrRisk]),
    ...(data?.evidenceCards || [])
      .filter((item) => (job.selectedEvidenceIds || []).includes(item.id))
      .flatMap((item) => item.forbiddenVisibleClaims || [])
  ]);
  const mode = positioningMode(job, unsupportedMappings.length, supportedMappings.length || evidence.length);
  const criteria: SummaryQualityCriterion[] = [
    {
      id: "summary-role-identity",
      label: "Role identity",
      description: "States a credible role identity for this JD without pretending unsupported direct-fit experience.",
      category: "role-identity",
      importance: "required",
      supportStatus: mode === "direct-fit" ? "supported" : mode === "not-recommended" ? "unsupported" : "partial",
      supportingEvidenceIds: supportedEvidenceIds,
      allowedTreatment: mode === "direct-fit" ? "state-directly" : mode === "not-recommended" ? "omit" : "position-as-transferable"
    },
    {
      id: "summary-relevant-capability",
      label: "Relevant capability",
      description: "Surfaces the strongest supported capabilities that overlap with the JD.",
      category: "relevant-capability",
      importance: "required",
      supportStatus: evidence.length ? "supported" : "unsupported",
      supportingEvidenceIds: supportedEvidenceIds,
      allowedTreatment: evidence.length ? "state-directly" : "omit"
    },
    {
      id: "summary-business-value",
      label: "Business value",
      description: "Explains the business or stakeholder value of the candidate's supported work.",
      category: "business-value",
      importance: "important",
      supportStatus: evidence.length ? "supported" : "partial",
      supportingEvidenceIds: supportedEvidenceIds,
      allowedTreatment: "state-directly"
    },
    {
      id: "summary-evidence-grounding",
      label: "Evidence grounding",
      description: "Avoids unsupported ownership, metrics, seniority, sales, architecture, or cloud-delivery claims.",
      category: "evidence-grounding",
      importance: "required",
      supportStatus: prohibitedClaims.length ? "partial" : "supported",
      supportingEvidenceIds: supportedEvidenceIds,
      allowedTreatment: prohibitedClaims.length ? "soften" : "state-directly"
    },
    {
      id: "summary-customer-context",
      label: "Customer context",
      description: "Connects the Summary to customer, stakeholder, adoption, enablement, or operating context when supported.",
      category: "customer-context",
      importance: "important",
      supportStatus: evidence.some((item) => /customer|stakeholder|enable|adoption|support|user/i.test(item.keywords.join(" "))) ? "supported" : "partial",
      supportingEvidenceIds: supportedEvidenceIds,
      allowedTreatment: "state-directly"
    },
    {
      id: "summary-career-positioning",
      label: "Career positioning",
      description: "Separates supported transferable fit from unsupported core requirements.",
      category: "career-positioning",
      importance: "required",
      supportStatus: unsupportedCoreRequirements.length ? "partial" : "supported",
      supportingEvidenceIds: supportedEvidenceIds,
      allowedTreatment: unsupportedCoreRequirements.length ? "position-as-transferable" : "state-directly"
    },
    {
      id: "summary-clarity",
      label: "Clarity",
      description: "Uses concise external recruiter language without generic filler or tool stuffing.",
      category: "clarity",
      importance: "required",
      supportStatus: "supported",
      supportingEvidenceIds: [],
      allowedTreatment: "state-directly"
    }
  ];
  return {
    targetRole: analysis?.primaryTargetTitle || job.role,
    positioningMode: mode,
    requiredCriteria: criteria,
    supportedStrengths: evidence.map((item) => ({
      evidenceId: item.evidenceId,
      label: item.label,
      keywords: item.keywords.slice(0, 8),
      evidenceStrength: item.evidenceStrength
    })),
    unsupportedCoreRequirements,
    prohibitedClaims,
    wordingConstraints: [
      "Use external recruiter language.",
      "Do not claim unsupported direct Azure sales, presales, architecture, quota, migration, or deal ownership.",
      "If the role is adjacent or transferable, position the candidate as adjacent or transferable instead of direct-fit.",
      "Keep genuine fit gaps out of visible strengths."
    ],
    maxLengthWords: 65
  };
}

function resultFor(criterion: SummaryQualityCriterion, status: SummaryReviewCriterionResult["status"], reason: string, evidenceIds: string[], fixability: SummaryReviewCriterionResult["fixability"]): SummaryReviewCriterionResult {
  return { criterionId: criterion.id, status, reason, evidenceIds, fixability };
}

export function evaluateSummaryQuality(input: {
  contract: SummaryQualityContract;
  cv: TailoredCv;
  reviewedCvHash: string;
  reviewRunId: string;
}): SummaryReviewResult {
  const { contract, cv, reviewedCvHash, reviewRunId } = input;
  const summary = cv.summary || "";
  const lower = summary.toLowerCase();
  const summaryWords = words(summary);
  const sentenceCount = summary.split(/[.!?]+/).map((item) => item.trim()).filter(Boolean).length;
  const supportedTerms = unique(contract.supportedStrengths.flatMap((item) => item.keywords).flatMap(meaningfulWords));
  const supportedHits = supportedTerms.filter((term) => lower.includes(term)).slice(0, 10);
  const prohibitedHits = contract.prohibitedClaims.filter((claim) => hasAny(lower, [claim]));
  const directCoreTerms = /quota|deal closing|presales ownership|azure architecture|cloud migration ownership|solution architect/i;
  const businessValuePattern = /enable|support|improve|reduce|adoption|governance|automation|visibility|decision|customer|stakeholder|operational|business/i;
  const customerContextPattern = /customer|stakeholder|user|enablement|adoption|support|partner|manager|operations/i;
  const criteria = contract.requiredCriteria.map((criterion) => {
    if (criterion.id === "summary-role-identity") {
      if (contract.positioningMode === "not-recommended") {
        return resultFor(criterion, "partial", "This JD is not recommended with current evidence; Summary rewriting cannot prove missing fit.", [], "fit-risk-only");
      }
      if (contract.positioningMode !== "direct-fit" && directCoreTerms.test(summary)) {
        return resultFor(criterion, "fail", "The Summary implies direct specialist ownership that is not supported by the selected evidence.", [], "summary-rewrite");
      }
      return resultFor(criterion, lower.includes((contract.targetRole || "").toLowerCase().split(" ")[0] || "") || supportedHits.length ? "pass" : "fail", "The Summary must state a credible role identity for this JD.", criterion.supportingEvidenceIds, "summary-rewrite");
    }
    if (criterion.id === "summary-relevant-capability") {
      if (!contract.supportedStrengths.length) return resultFor(criterion, "fail", "No selected evidence is available to support relevant Summary capability.", [], "evidence-needed");
      if (supportedHits.length >= 2) return resultFor(criterion, "pass", `Supported capability terms are visible: ${supportedHits.slice(0, 4).join(", ")}.`, criterion.supportingEvidenceIds, "summary-rewrite");
      if (supportedHits.length === 1) return resultFor(criterion, "partial", `Only one supported capability is visible: ${supportedHits[0]}.`, criterion.supportingEvidenceIds, "summary-rewrite");
      return resultFor(criterion, "fail", "The Summary does not surface the strongest selected evidence-backed capabilities.", criterion.supportingEvidenceIds, "summary-rewrite");
    }
    if (criterion.id === "summary-business-value") {
      return resultFor(criterion, businessValuePattern.test(summary) ? "pass" : "fail", businessValuePattern.test(summary) ? "Business/stakeholder value is visible." : "The Summary needs a clearer business or stakeholder value statement.", criterion.supportingEvidenceIds, "summary-rewrite");
    }
    if (criterion.id === "summary-evidence-grounding") {
      return resultFor(criterion, prohibitedHits.length ? "fail" : "pass", prohibitedHits.length ? `Unsupported or prohibited claim appears: ${prohibitedHits.slice(0, 3).join(", ")}.` : "No prohibited Summary claim detected.", criterion.supportingEvidenceIds, prohibitedHits.length ? "summary-rewrite" : "summary-rewrite");
    }
    if (criterion.id === "summary-customer-context") {
      return resultFor(criterion, customerContextPattern.test(summary) ? "pass" : "partial", customerContextPattern.test(summary) ? "Customer, stakeholder, or operating context is visible." : "Customer-facing or stakeholder context is still weak.", criterion.supportingEvidenceIds, "summary-rewrite");
    }
    if (criterion.id === "summary-career-positioning") {
      if (contract.unsupportedCoreRequirements.length) {
        return resultFor(criterion, "partial", `Remaining unsupported core requirement(s): ${contract.unsupportedCoreRequirements.map((item) => item.requirement).slice(0, 3).join("; ")}.`, criterion.supportingEvidenceIds, "fit-risk-only");
      }
      return resultFor(criterion, "pass", "No unsupported core requirement needs to be reframed as fit risk.", criterion.supportingEvidenceIds, "summary-rewrite");
    }
    if (criterion.id === "summary-clarity") {
      const ok = summaryWords.length <= contract.maxLengthWords && sentenceCount <= 2 && !/responsible for various|hard worker|passionate|looking for a role/i.test(summary);
      return resultFor(criterion, ok ? "pass" : "fail", ok ? "Summary length and wording are concise." : `Summary should be no more than ${contract.maxLengthWords} words, two sentences max, and externally clear.`, [], "summary-rewrite");
    }
    return resultFor(criterion, "not-applicable", "Criterion was not applicable.", [], "summary-rewrite");
  });
  const blockingFailures = criteria.filter((item) => item.status === "fail" && item.fixability === "summary-rewrite");
  const unresolvedEvidence = criteria.filter((item) => item.status !== "pass" && (item.fixability === "evidence-needed" || item.fixability === "human-positioning-decision"));
  const fitRiskItems = criteria.filter((item) => item.status !== "pass" && item.fixability === "fit-risk-only");
  const summaryRewriteNeeded = blockingFailures.length > 0;
  const fitRiskOnly = !summaryRewriteNeeded && fitRiskItems.length > 0;
  return {
    reviewRunId,
    reviewedCvHash,
    positioningMode: contract.positioningMode,
    overallStatus: summaryRewriteNeeded ? "needs-improvement" : unresolvedEvidence.length ? "cannot-resolve-with-current-evidence" : "pass",
    criteria,
    unsupportedCoreRequirements: contract.unsupportedCoreRequirements.map((item) => item.requirement),
    summaryRewriteNeeded,
    fitRiskOnly
  };
}
