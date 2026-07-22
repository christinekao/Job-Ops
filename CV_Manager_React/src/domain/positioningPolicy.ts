import type {
  AppData,
  FitClassification,
  FitDimensions,
  JobApplication,
  PositioningOverallFit,
  PositioningReport,
  RequirementImportance,
  RequirementMatch,
  RequirementMatchStatus
} from "../types";
import { validateEvidenceCard } from "../data/evidence";

function unique(values: string[], limit = Number.MAX_SAFE_INTEGER) {
  const out: string[] = [];
  for (const value of values) {
    const normalized = String(value || "").trim();
    if (!normalized || out.includes(normalized)) continue;
    out.push(normalized);
    if (out.length >= limit) break;
  }
  return out;
}

type ApplyTier = NonNullable<NonNullable<JobApplication["screeningAnalysis"]>["positioning"]>["applyTier"];

function fitFromApplyTier(applyTier: ApplyTier | undefined): PositioningOverallFit {
  if (applyTier === "Avoid") return "Weak";
  if (applyTier === "Stretch") return "Risky";
  return "Good";
}

function treatmentFromFit(overallFit: PositioningOverallFit): PositioningReport["recommendedPositioning"]["targetRoleTreatment"] {
  if (overallFit === "Good") return "direct-fit";
  if (overallFit === "Risky") return "adjacent-fit";
  return "transferable-fit";
}

export function buildPositioningReport(input: {
  job: Pick<JobApplication, "role" | "screeningAnalysis">;
  data?: AppData;
}): PositioningReport {
  const { job } = input;
  const analysis = job.screeningAnalysis;
  const positioning = analysis?.positioning;
  // ADR-004 Wave 1: this is a read-only projection of ScreeningAnalysis, not a second positioning engine.
  const overallFit = fitFromApplyTier(positioning?.applyTier);
  const supportedMappings = (analysis?.jdEvidenceMapping || [])
    .filter((item) => item.supportLevel === "Strong" || item.supportLevel === "Partial")
    .slice(0, 8);
  const weakMappings = (analysis?.jdEvidenceMapping || [])
    .filter((item) => item.supportLevel === "Weak" || item.supportLevel === "Unsupported")
    .slice(0, 8);
  const gaps = (analysis?.remainingGaps || []).slice(0, 8);
  const unsupportedClaims = unique([
    ...(positioning?.claimsToAvoid || []),
    ...(analysis?.riskyClaims || []),
    ...weakMappings.flatMap((item) => [item.requirement, item.safeCvAngle, item.gapOrRisk])
  ], 18);
  const headline = positioning?.headlineRecommendation || analysis?.primaryTargetTitle || job.role || "";
  const safestPositioning = positioning?.safestPositioning || headline;
  const summaryAngle = analysis?.summaryAngle || positioning?.toolApplicationAngle || safestPositioning;
  const targetRoleTreatment = positioning?.applyTier === "Avoid"
    ? "not-recommended"
    : treatmentFromFit(overallFit);
  const requirementMatchMatrix = buildRequirementMatchMatrix(job, input.data);
  const { fitClassification, fitDimensions } = buildFitDimensions(requirementMatchMatrix);
  const mediumFit = fitClassification === "VIABLE_MEDIUM_FIT" || fitClassification === "STRETCH_MEDIUM_FIT";
  const lowFit = fitClassification === "LOW_FIT" || fitClassification === "HARD_BLOCK";
  const direct = requirementMatchMatrix.filter((item) => item.matchStatus === "DIRECT_MATCH");
  const transferable = requirementMatchMatrix.filter((item) => item.matchStatus === "TRANSFERABLE_MATCH");
  const learnable = requirementMatchMatrix.filter((item) => item.matchStatus === "LEARNABLE_GAP");
  const coreGaps = requirementMatchMatrix.filter((item) => item.matchStatus === "CORE_CAPABILITY_GAP");
  const formalRisks = requirementMatchMatrix.filter((item) => item.matchStatus === "FORMAL_SCREENING_RISK");
  const safePositioning = positioning?.safestPositioning || headline;
  const semanticOpportunity = analysis?.opportunityAnalysis;

  return {
    fitClassification,
    fitDimensions,
    requirementMatchMatrix,
    ...(mediumFit ? {
      opportunityAnalysis: {
        whyCandidateCouldWin: unique([
          ...(semanticOpportunity?.whyCandidateCouldWin || []),
          ...(positioning?.whyThisFits || []),
          ...direct.map((item) => item.explanation),
          ...transferable.map((item) => item.explanation)
        ], 8),
        differentiatedStrengths: unique([
          ...(semanticOpportunity?.differentiatedStrengths || []),
          ...(positioning?.hiddenSkillsToSurface || []),
          ...direct.flatMap((item) => item.supportedAspects)
        ], 8),
        credibleTransferableStrengths: unique([...(semanticOpportunity?.credibleTransferableStrengths || []), ...transferable.map((item) => item.transferContext || item.explanation)], 8),
        learnableGaps: unique([...(semanticOpportunity?.learnableGaps || []), ...learnable.map((item) => item.requirementText)], 8),
        coreRisks: unique([...(semanticOpportunity?.coreRisks || []), ...coreGaps.map((item) => item.requirementText)], 8),
        recruiterScreeningRisk: formalRisks.map((item) => item.requirementText),
        cvPositioning: safePositioning,
        interviewPositioning: unique([
          ...transferable.map((item) => `Explain transfer without claiming direct experience: ${item.transferContext || item.requirementText}`),
          ...learnable.map((item) => `Disclose the current gap and preparation plan: ${item.requirementText}`)
        ], 8),
        applicationStrategy: fitClassification === "VIABLE_MEDIUM_FIT"
          ? "Apply with a truthful transfer CV and prioritize evidence-backed adjacent capability."
          : "Apply selectively with controlled time investment and explicit gap preparation.",
        recommendedPreparation: unique([
          ...(semanticOpportunity?.recommendedPreparation || []),
          ...learnable.map((item) => item.requirementText),
          ...formalRisks.map((item) => item.requirementText)
        ], 8)
      }
    } : {}),
    ...(lowFit ? {
      lowFitAnalysis: {
        credibleOverlaps: unique([
          ...(semanticOpportunity?.credibleOverlaps || []),
          ...direct.map((item) => item.requirementText),
          ...transferable.map((item) => item.requirementText),
          ...requirementMatchMatrix.filter((item) => item.matchStatus === "PARTIAL_MATCH").flatMap((item) => item.supportedAspects)
        ], 10),
        whyCoreFitIsLow: unique([...(semanticOpportunity?.whyCoreFitIsLow || []), ...coreGaps.map((item) => item.explanation || item.requirementText)], 10),
        coreUnbridgeableShortTermGaps: unique([...(semanticOpportunity?.coreUnbridgeableShortTermGaps || []), ...coreGaps.map((item) => item.requirementText)], 10),
        futureTransitionPath: unique([
          ...(semanticOpportunity?.futureTransitionPath || []),
          ...learnable.map((item) => item.requirementText),
          ...coreGaps.map((item) => `Build verified production evidence before targeting: ${item.requirementText}`)
        ], 10),
        betterAdjacentRoles: unique([...(semanticOpportunity?.betterAdjacentRoles || []), ...(job.screeningAnalysis?.backupTargetTitles || [])], 8),
        recommendedPreparation: unique([
          ...(semanticOpportunity?.recommendedPreparation || []),
          ...learnable.map((item) => item.requirementText),
          ...formalRisks.map((item) => item.requirementText)
        ], 10),
        manualOverrideAllowed: fitClassification !== "HARD_BLOCK"
      }
    } : {}),
    overallFit,
    transferableStrengths: [
      ...supportedMappings.map((item) => ({
        strength: item.safeCvAngle || item.requirement || item.marketExpectation,
        evidenceIds: item.matchingEvidenceIds,
        supportLevel: item.supportLevel === "Strong" ? "Strong" as const : "Partial" as const,
        cvTreatment: item.supportLevel === "Strong" && overallFit === "Good" ? "state-directly" as const : "position-as-transferable" as const
      })),
      ...(supportedMappings.length ? [] : (positioning?.whyThisFits || []).slice(0, 4).map((strength) => ({
        strength,
        evidenceIds: [],
        supportLevel: "Partial" as const,
        cvTreatment: overallFit === "Good" ? "state-directly" as const : "position-as-transferable" as const
      })))
    ],
    truthfulCapabilityGaps: [
      ...weakMappings.map((item) => ({
        requirement: item.requirement,
        reason: item.gapOrRisk || item.marketExpectation || "The current evidence does not support this as a solved strength.",
        riskLevel: item.supportLevel === "Unsupported" ? "High" as const : "Medium" as const,
        mitigation: item.safeCvAngle || "Keep this as a gap or transferable angle; do not claim direct ownership."
      })),
      ...gaps.map((gap) => ({
        requirement: gap.gap,
        reason: gap.mitigation || "Screening Analysis marks this as a remaining capability gap.",
        riskLevel: gap.riskLevel,
        mitigation: gap.mitigation || "Explain truthfully in the Positioning Report or interview prep."
      }))
    ],
    unsupportedClaimsPrevented: unsupportedClaims.map((claim) => ({
      claim,
      reason: "This claim is not sufficiently supported for visible CV positioning.",
      mustNotClaim: [claim]
    })),
    recommendedPositioning: {
      headline,
      summaryAngle,
      targetRoleTreatment,
      wordingGuidance: unique([
        safestPositioning,
        overallFit === "Weak" ? "Generate a truthful transferable-positioning CV; do not pretend direct fit." : "",
        overallFit === "Risky" ? "Use adjacent-fit wording and explain weak evidence as risk." : "",
        "Strengthen wording only when supported by selected evidence.",
        "Preserve unsupported requirements as gaps or risks, not visible strengths."
      ], 8)
    },
    remainingHiringRisks: [
      ...weakMappings.map((item) => {
        return {
          risk: item.requirement,
          impactOnInterviewProbability: item.supportLevel === "Unsupported"
            ? "Materially reduces interview probability unless new evidence is added or the target angle changes."
            : "May reduce interview probability unless the CV keeps wording conservative.",
          mitigation: item.gapOrRisk || item.safeCvAngle || "Keep positioning conservative."
        };
      }),
      ...(positioning?.interviewRiskQuestions || []).slice(0, 5).map((risk) => ({
        risk,
        impactOnInterviewProbability: "May reduce interview probability if the recruiter or hiring manager requires direct proof.",
        mitigation: "Prepare truthful interview evidence or choose a more adjacent target angle."
      }))
    ]
  };
}

const IMPORTANCE_WEIGHT: Record<RequirementImportance, number> = {
  CORE_RESPONSIBILITY: 5,
  REQUIRED_CAPABILITY: 4,
  PREFERRED_CAPABILITY: 2,
  FORMAL_REQUIREMENT: 1,
  SUPPLEMENTAL_SIGNAL: 0.5
};

const STATUS_SCORE: Record<RequirementMatchStatus, number> = {
  DIRECT_MATCH: 1,
  TRANSFERABLE_MATCH: 0.75,
  PARTIAL_MATCH: 0.5,
  LEARNABLE_GAP: 0.25,
  CORE_CAPABILITY_GAP: 0,
  FORMAL_SCREENING_RISK: 0
};

function normalizedRequirement(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9+#.]+/g, " ").replace(/\s+/g, " ");
}

function requirementId(value: string, index: number) {
  const slug = normalizedRequirement(value).replace(/\s+/g, "-").slice(0, 56);
  return `requirement-${index + 1}-${slug || "item"}`;
}

function inferredImportance(requirement: string): RequirementImportance {
  if (/\b(years?|degree|certif|license|visa|work authorization|on-?site|location|language)\b/i.test(requirement)) return "FORMAL_REQUIREMENT";
  return "REQUIRED_CAPABILITY";
}

function inferredStatus(
  mapping: NonNullable<NonNullable<JobApplication["screeningAnalysis"]>["jdEvidenceMapping"]>[number],
  hasEligibleEvidence: boolean
): RequirementMatchStatus {
  if (mapping.matchStatus) return mapping.matchStatus;
  if (inferredImportance(mapping.requirement) === "FORMAL_REQUIREMENT") return "FORMAL_SCREENING_RISK";
  if (mapping.supportLevel === "Strong" && hasEligibleEvidence) return "DIRECT_MATCH";
  if (mapping.supportLevel === "Partial" && hasEligibleEvidence && mapping.transferContext) return "TRANSFERABLE_MATCH";
  if (mapping.supportLevel === "Partial") return "PARTIAL_MATCH";
  if (mapping.supportLevel === "Weak") return "LEARNABLE_GAP";
  return "CORE_CAPABILITY_GAP";
}

function defaultUses(status: RequirementMatchStatus) {
  if (status === "DIRECT_MATCH") return { cvUsage: "PRIORITIZE" as const, interviewUsage: "LEAD_STORY" as const };
  if (status === "TRANSFERABLE_MATCH") return { cvUsage: "CONSERVATIVE_POSITIONING" as const, interviewUsage: "EXPLAIN_TRANSFER" as const };
  if (status === "PARTIAL_MATCH") return { cvUsage: "SUPPORTING" as const, interviewUsage: "SUPPORTING_STORY" as const };
  if (status === "LEARNABLE_GAP" || status === "FORMAL_SCREENING_RISK") return { cvUsage: "DO_NOT_CLAIM" as const, interviewUsage: "DISCLOSE_GAP" as const };
  return { cvUsage: "FORBIDDEN" as const, interviewUsage: "DO_NOT_USE" as const };
}

function buildRequirementMatchMatrix(
  job: Pick<JobApplication, "role" | "screeningAnalysis">,
  data?: AppData
): RequirementMatch[] {
  const mappings = job.screeningAnalysis?.jdEvidenceMapping || [];
  return mappings.map((mapping, index) => {
    const eligibleEvidence = data
      ? mapping.matchingEvidenceIds.filter((id) => {
        const card = data.evidenceCards.find((item) => item.id === id);
        return Boolean(card && validateEvidenceCard(data, card).cvUsable);
      })
      : mapping.matchingEvidenceIds;
    let matchStatus = inferredStatus(mapping, eligibleEvidence.length > 0);
    if ((matchStatus === "DIRECT_MATCH" || matchStatus === "TRANSFERABLE_MATCH") && !eligibleEvidence.length) {
      matchStatus = mapping.supportLevel === "Unsupported" ? "CORE_CAPABILITY_GAP" : "PARTIAL_MATCH";
    }
    if (matchStatus === "TRANSFERABLE_MATCH" && !mapping.transferContext?.trim()) matchStatus = "PARTIAL_MATCH";
    const uses = defaultUses(matchStatus);
    const supportedAspects = unique(mapping.supportedAspects?.length
      ? mapping.supportedAspects
      : eligibleEvidence.length ? [mapping.safeCvAngle || mapping.marketExpectation] : []);
    const unsupportedAspects = unique(mapping.unsupportedAspects?.length
      ? mapping.unsupportedAspects
      : mapping.gapOrRisk ? [mapping.gapOrRisk] : []);
    return {
      requirementId: mapping.requirementId || requirementId(mapping.requirement, index),
      requirementText: mapping.requirement,
      normalizedRequirement: normalizedRequirement(mapping.requirement),
      importance: mapping.importance || inferredImportance(mapping.requirement),
      matchStatus,
      evidenceIds: eligibleEvidence,
      sourceIds: data
        ? unique(eligibleEvidence.flatMap((id) => data.evidenceCards.find((item) => item.id === id)?.sourceIds || []))
        : [],
      supportedAspects,
      unsupportedAspects,
      transferContext: matchStatus === "TRANSFERABLE_MATCH" ? mapping.transferContext || "" : "",
      explanation: mapping.explanation || mapping.safeCvAngle || mapping.gapOrRisk || mapping.marketExpectation,
      confidence: mapping.confidence || (eligibleEvidence.length ? "High" : mapping.supportLevel === "Unsupported" ? "High" : "Medium"),
      cvUsage: mapping.cvUsage || uses.cvUsage,
      interviewUsage: mapping.interviewUsage || uses.interviewUsage,
      hardBlock: Boolean(mapping.hardBlock)
    };
  });
}

function buildFitDimensions(matrix: RequirementMatch[]): {
  fitClassification: FitClassification;
  fitDimensions: FitDimensions;
} {
  const capabilityRows = matrix.filter((item) => item.importance !== "FORMAL_REQUIREMENT" && item.importance !== "SUPPLEMENTAL_SIGNAL");
  const denominator = capabilityRows.reduce((sum, item) => sum + IMPORTANCE_WEIGHT[item.importance], 0) || 1;
  const score = capabilityRows.reduce((sum, item) => sum + IMPORTANCE_WEIGHT[item.importance] * STATUS_SCORE[item.matchStatus], 0) / denominator;
  const directWeight = capabilityRows.filter((item) => item.matchStatus === "DIRECT_MATCH").reduce((sum, item) => sum + IMPORTANCE_WEIGHT[item.importance], 0) / denominator;
  const transferableWeight = capabilityRows.filter((item) => item.matchStatus === "TRANSFERABLE_MATCH").reduce((sum, item) => sum + IMPORTANCE_WEIGHT[item.importance], 0) / denominator;
  const learnableWeight = capabilityRows.filter((item) => item.matchStatus === "LEARNABLE_GAP").reduce((sum, item) => sum + IMPORTANCE_WEIGHT[item.importance], 0) / denominator;
  const coreGapWeight = capabilityRows.filter((item) => item.matchStatus === "CORE_CAPABILITY_GAP").reduce((sum, item) => sum + IMPORTANCE_WEIGHT[item.importance], 0) / denominator;
  const formalRows = matrix.filter((item) => item.matchStatus === "FORMAL_SCREENING_RISK");
  const hardBlock = matrix.some((item) => item.hardBlock);
  const fitClassification: FitClassification = hardBlock
    ? "HARD_BLOCK"
    : score >= 0.72 && directWeight >= 0.5 && coreGapWeight < 0.15
      ? "STRONG_FIT"
      : score >= 0.5 && coreGapWeight < 0.3
        ? "VIABLE_MEDIUM_FIT"
        : score >= 0.32 && (directWeight + transferableWeight) >= 0.25
          ? "STRETCH_MEDIUM_FIT"
          : "LOW_FIT";
  const viability = Math.max(0, Math.min(100, Math.round(score * 100 - coreGapWeight * 10 - (hardBlock ? 100 : 0))));
  const applicationPriority = fitClassification === "STRONG_FIT" ? "VERY_HIGH"
    : fitClassification === "VIABLE_MEDIUM_FIT" ? "MEDIUM"
      : fitClassification === "STRETCH_MEDIUM_FIT" ? "LOW"
        : fitClassification === "HARD_BLOCK" ? "NONE" : "LOW";
  const generationRecommendation = fitClassification === "STRONG_FIT" ? "GENERATE_PRIORITY_CV"
    : fitClassification === "VIABLE_MEDIUM_FIT" ? "GENERATE_TRANSFER_CV"
      : fitClassification === "STRETCH_MEDIUM_FIT" ? "GENERATE_ONLY_WITH_WARNING"
        : "DO_NOT_PRIORITIZE_GENERATION";
  return {
    fitClassification,
    fitDimensions: {
      currentCapabilityFit: Math.round((score - learnableWeight * 0.25) * 100),
      directEvidenceFit: Math.round(directWeight * 100),
      transferability: Math.round(transferableWeight * 100),
      rampUpFeasibility: Math.round(Math.max(0, 1 - coreGapWeight) * 100),
      screeningRisk: Math.min(100, formalRows.length * 20 + (hardBlock ? 100 : 0)),
      applicationViability: viability,
      applicationPriority,
      generationRecommendation,
      manualOverrideAllowed: !hardBlock,
      relativeRank: viability
    }
  };
}
