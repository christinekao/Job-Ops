import type { AppData, CvBrief, CvVersion, EvidenceCard, JobApplication, GenerationContext } from "../types";
import { contentHash } from "../utils/hash";
import { sortCvVersions } from "../utils/ids";
import { buildNormalizedRequirementInventory, canonicalParsedJD, computeJobContentHash } from "./jobs";
import { buildPositioningReport } from "../domain/positioningPolicy";
import { isEvidenceCvUsable, validateEvidenceCard } from "./evidence";
import { backboneReadiness } from "./backbone";

const SUPPORTED_CV_PROMPT_VERSIONS = new Set([
  "tailored-cv-v7-credible-evidence",
  "screening-cv-v1",
  "screening-cv-v2-interview-resume",
  "screening-cv-v3-manager-hire",
  "screening-cv-v4-evidence-mapping-enforced",
  "screening-cv-v5-career-os-brief",
  "screening-cv-v6-compact-hireable-cv",
  "screening-cv-v7-one-pass-reviewer-ready"
]);

export const SCREENING_TO_BRIEF_CONTRACT_VERSION = "screening-to-brief-v1";

function currentRequirementMatrix(job: JobApplication) {
  return job.screeningAnalysis?.requirementMatrix || [];
}

function cvEligibleRequirementRows(job: JobApplication) {
  return currentRequirementMatrix(job).filter((row) =>
    ["DIRECT_MATCH", "TRANSFERABLE_MATCH", "PARTIAL_MATCH"].includes(row.matchStatus)
    && ["PRIORITIZE", "SUPPORTING", "CONSERVATIVE_POSITIONING"].includes(row.cvUsage)
  );
}

function supportLevelForMatrixStatus(status: "DIRECT_MATCH" | "TRANSFERABLE_MATCH" | "PARTIAL_MATCH" | "LEARNABLE_GAP" | "CORE_CAPABILITY_GAP" | "FORMAL_SCREENING_RISK") {
  return status === "DIRECT_MATCH" ? "Strong" as const : status === "TRANSFERABLE_MATCH" || status === "PARTIAL_MATCH" ? "Partial" as const : "Weak" as const;
}

export function orderedItemsByIds<T extends { id: string }>(items: T[], ids: string[]) {
  const byId = new Map(items.map((item) => [item.id, item]));
  return ids.map((id) => byId.get(id)).filter((item): item is T => Boolean(item));
}

function cvBriefPayload(brief: CvBrief) {
  const { generatedAt: _generatedAt, ...payload } = brief;
  return payload;
}

export function cvBriefIdentityHash(brief: CvBrief | null | undefined) {
  return brief ? contentHash(cvBriefPayload(brief)) : undefined;
}

export function isCvBriefUsable(brief: CvBrief | null | undefined) {
  return Boolean(
    brief
    && brief.contractIdentity?.contractVersion === SCREENING_TO_BRIEF_CONTRACT_VERSION
    && brief.top3SellingPoints.length
    && brief.mustShowEvidenceIds.length
    && brief.bulletPlan.length
  );
}

export function resolveEffectiveCvBrief(data: AppData, job: JobApplication): CvBrief | null {
  const generated = buildCvBrief(data, job);
  if (!generated) return null;
  if (
    isCvBriefUsable(job.cvBrief)
    && cvBriefIdentityHash(job.cvBrief) === cvBriefIdentityHash(generated)
  ) {
    return job.cvBrief || generated;
  }
  return {
    ...generated,
    generatedAt: job.cvBriefGeneratedAt
      || job.recommendationsAppliedAt
      || job.screeningAnalysisRun?.lastCompletedAt
      || generated.generatedAt
  };
}

export function effectiveEvidencePriorityIds(job: Pick<JobApplication, "selectedEvidenceIds">, brief?: CvBrief | null) {
  return uniqueLimited([
    ...(brief?.mustShowEvidenceIds || []),
    ...(job.selectedEvidenceIds || [])
  ], Number.MAX_SAFE_INTEGER);
}

export const CV_GENERATION_MINIMUMS = {
  skills: 8,
  domainSignals: 3,
  evidence: 12,
  starStories: 4,
  currentRoleEvidence: 8,
  priorRoleEvidence: 2
} as const;

export function selectionDiagnostics(data: AppData, job: JobApplication) {
  const selectedSkillIds = job.selectedSkillIds || [];
  const selectedDomainKnowledgeIds = job.selectedDomainKnowledgeIds || [];
  const selectedEvidenceIds = job.selectedEvidenceIds || [];
  const selectedStoryIds = job.selectedStoryIds || [];
  const skillIds = new Set(data.skillInferences.map((item) => item.id));
  const domainIds = new Set(data.domainKnowledge.map((item) => item.id));
  const evidenceIds = new Set(data.evidenceCards.map((item) => item.id));
  const storyIds = new Set(data.starStories.map((item) => item.id));
  const selectedSkills = orderedItemsByIds(data.skillInferences, selectedSkillIds);
  const selectedDomainKnowledge = orderedItemsByIds(data.domainKnowledge, selectedDomainKnowledgeIds);
  const selectedEvidence = orderedItemsByIds(data.evidenceCards, selectedEvidenceIds);
  const selectedStarStories = orderedItemsByIds(data.starStories, selectedStoryIds);
  return {
    selectedSkillIds,
    selectedDomainKnowledgeIds,
    selectedEvidenceIds,
    selectedStoryIds,
    selectedSkills,
    selectedDomainKnowledge,
    selectedEvidence,
    selectedStarStories,
    invalidSkillIds: selectedSkillIds.filter((id) => !skillIds.has(id)),
    invalidDomainKnowledgeIds: selectedDomainKnowledgeIds.filter((id) => !domainIds.has(id)),
    invalidEvidenceIds: selectedEvidenceIds.filter((id) => !evidenceIds.has(id)),
    invalidStoryIds: selectedStoryIds.filter((id) => !storyIds.has(id))
  };
}

export function buildGenerationContext(data: AppData, job: JobApplication, effectiveBrief = resolveEffectiveCvBrief(data, job)): GenerationContext {
  const diagnostics = selectionDiagnostics(data, job);
  const jdContentHash = job.jdContentHash || computeJobContentHash(job);
  const evidencePriorityIds = effectiveEvidencePriorityIds(job, effectiveBrief);
  return {
    jdContentHash,
    sourceDataHash: contentHash({
      sourceOfTruth: data.sourceOfTruth,
      careerProfile: data.careerProfile,
      selectedSkills: diagnostics.selectedSkills,
      selectedDomainKnowledge: diagnostics.selectedDomainKnowledge,
      selectedEvidence: diagnostics.selectedEvidence,
      selectedStarStories: diagnostics.selectedStarStories,
      cvBrief: effectiveBrief ? cvBriefPayload(effectiveBrief) : null
    }),
    fitReviewHash: job.fitReview ? contentHash(job.fitReview) : undefined,
    screeningAnalysisHash: job.screeningAnalysis ? contentHash(job.screeningAnalysis) : undefined,
    cvBriefHash: cvBriefIdentityHash(effectiveBrief),
    promptVersion: "tailored-cv-v7-credible-evidence",
    generatedAt: new Date().toISOString(),
    selectedSkillIds: diagnostics.selectedSkillIds,
    selectedDomainKnowledgeIds: diagnostics.selectedDomainKnowledgeIds,
    selectedEvidenceIds: diagnostics.selectedEvidenceIds,
    selectedStoryIds: diagnostics.selectedStoryIds,
    evidencePriorityIds,
    invalidSelectionIds: {
      skillIds: diagnostics.invalidSkillIds,
      domainKnowledgeIds: diagnostics.invalidDomainKnowledgeIds,
      evidenceIds: diagnostics.invalidEvidenceIds,
      storyIds: diagnostics.invalidStoryIds
    }
  };
}

function legacyGenerationSourceDataHash(data: AppData, job: JobApplication) {
  const diagnostics = selectionDiagnostics(data, job);
  return contentHash({
    sourceOfTruth: data.sourceOfTruth,
    careerProfile: data.careerProfile,
    selectedSkills: diagnostics.selectedSkills,
    selectedDomainKnowledge: diagnostics.selectedDomainKnowledge,
    selectedEvidence: diagnostics.selectedEvidence,
    selectedStarStories: diagnostics.selectedStarStories,
    cvBrief: job.cvBrief
  });
}

export function evidenceSelectionQualityDiagnostics(data: AppData, job: JobApplication) {
  const diagnostics = selectionDiagnostics(data, job);
  const selectedIds = new Set(diagnostics.selectedEvidenceIds);
  const primaryExperienceId = data.careerProfile.workExperiences?.[0]?.id;
  const topRequirementMappings = cvEligibleRequirementRows(job)
    .slice(0, 3)
    .map((item) => {
      const selectedMatchingEvidenceIds = item.matchingEvidenceIds.filter((id) => selectedIds.has(id));
      return {
        requirement: item.requirement,
        supportLevel: supportLevelForMatrixStatus(item.matchStatus),
        selectedMatchingEvidenceIds,
        covered: selectedMatchingEvidenceIds.length > 0
      };
    });
  const evidenceWithBusinessImpact = diagnostics.selectedEvidence.filter((item) =>
    Boolean(item.quantifiedEvidence?.trim() || item.metrics?.trim())
  ).map((item) => item.id);
  const evidenceWithTechnicalDepth = diagnostics.selectedEvidence.filter((item) =>
    Boolean(item.tools?.length)
  ).map((item) => item.id);
  const currentRoleEvidenceIds = diagnostics.selectedEvidence
    .filter((item) => item.experienceId === primaryExperienceId)
    .map((item) => item.id);
  const priorRoleEvidenceIds = diagnostics.selectedEvidence
    .filter((item) => item.experienceId && item.experienceId !== primaryExperienceId)
    .map((item) => item.id);
  return {
    topRequirementMappings,
    topRequirementCoverageCount: topRequirementMappings.filter((item) => item.covered).length,
    evidenceWithBusinessImpact,
    evidenceWithTechnicalDepth,
    currentRoleEvidenceIds,
    priorRoleEvidenceIds
  };
}

function supportScore(level: "Strong" | "Partial" | "Weak" | "Unsupported") {
  return level === "Strong" ? 3 : level === "Partial" ? 2 : level === "Weak" ? 1 : 0;
}

function uniqueLimited(values: string[], limit: number) {
  const out: string[] = [];
  for (const value of values) {
    if (!value || out.includes(value)) continue;
    out.push(value);
    if (out.length >= limit) break;
  }
  return out;
}

function itemText(item: unknown) {
  return JSON.stringify(item).toLowerCase();
}

function evidenceMatchesTerms(item: unknown, terms: string[]) {
  const text = itemText(item);
  return terms.some((term) => text.includes(term.toLowerCase()));
}

function evidenceBriefTitle(item: EvidenceCard) {
  return item.sectionTitle || item.category || item.title || "Relevant project evidence";
}

function evidenceManagerValue(item: EvidenceCard) {
  return item.cvAngle
    || item.externalFriendlyDescription
    || item.cvSafeBullet
    || item.cvBullet
    || item.actionTaken
    || item.proof
    || "Evidence-backed experience relevant to the target role.";
}

function fallbackSellingPointsFromEvidence(evidence: EvidenceCard[], limit = 3) {
  const grouped = new Map<string, EvidenceCard[]>();
  for (const item of evidence) {
    const key = evidenceBriefTitle(item);
    grouped.set(key, [...(grouped.get(key) || []), item]);
  }
  return [...grouped.entries()].slice(0, limit).map(([title, items]) => ({
    title,
    managerValue: evidenceManagerValue(items[0]),
    evidenceIds: items.slice(0, 4).map((item) => item.id),
    skillIds: [],
    storyIds: [],
    supportLevel: "Partial" as const
  }));
}

export function buildCvBrief(data: AppData, job: JobApplication): CvBrief | null {
  const analysis = job.screeningAnalysis;
  if (!analysis || !analysis.requirementMatrix?.length) return null;
  const diagnostics = selectionDiagnostics(data, job);
  const positioningReport = buildPositioningReport({ job, data });
  const validVisibleEvidenceIds = new Set(
    diagnostics.selectedEvidence
      .filter((item) =>
        isEvidenceCvUsable(data, item)
      )
      .map((item) => item.id)
  );
  const mapping = cvEligibleRequirementRows(job)
    .map((item, index) => ({
      ...item,
      index,
      supportLevel: supportLevelForMatrixStatus(item.matchStatus),
      safeCvAngle: item.matchStatus === "TRANSFERABLE_MATCH"
        ? item.transferContext
        : item.supportedAspects.join(", ") || item.marketExpectation,
      visibleEvidenceIds: item.matchingEvidenceIds.filter((id) => validVisibleEvidenceIds.has(id)),
      selectedSkillIds: item.matchingSkillIds.filter((id) => diagnostics.selectedSkillIds.includes(id)),
      selectedStoryIds: item.matchingStoryIds.filter((id) => diagnostics.selectedStoryIds.includes(id))
    }))
    .filter((item) => item.visibleEvidenceIds.length || item.selectedSkillIds.length || item.selectedStoryIds.length)
    .sort((a, b) => supportScore(b.supportLevel) - supportScore(a.supportLevel) || b.visibleEvidenceIds.length - a.visibleEvidenceIds.length || a.index - b.index);
  const topMappings = mapping.slice(0, 3);
  const terms = selectionTerms(job);
  const mustShowEvidenceIds = uniqueLimited([
    ...topMappings.flatMap((item) => item.visibleEvidenceIds)
  ], 10);
  const supportingEvidenceIds = uniqueLimited([
    ...diagnostics.selectedEvidenceIds.filter((id) => validVisibleEvidenceIds.has(id) && !mustShowEvidenceIds.includes(id))
  ], 8);
  const evidenceById = new Map(diagnostics.selectedEvidence.map((item) => [item.id, item]));
  const fallbackSellingPoints = fallbackSellingPointsFromEvidence(
    mustShowEvidenceIds
      .map((id) => evidenceById.get(id))
      .filter((item): item is EvidenceCard => Boolean(item))
  );
  const skillNameById = new Map(data.skillInferences.map((item) => [item.id, item.cvWording || item.skill]));
  const selectedSkillNames = diagnostics.selectedSkills
    .filter((item) => item.confidence === "Grounded" && item.strength !== "Mentioned" && item.usageContext !== "mentioned")
    .map((item) => item.cvWording || item.skill);
  const skillsToForeground = uniqueLimited([
    ...topMappings.flatMap((item) => item.selectedSkillIds.map((id) => skillNameById.get(id) || id)),
    ...(analysis.candidatePositioning?.hiddenSkillsToSurface || []),
    ...selectedSkillNames
  ], 12);
  const skillsToSuppress = uniqueLimited([
    ...(analysis.candidatePositioning?.evidenceToSuppress || []),
    ...diagnostics.selectedSkills
      .filter((item) => item.confidence !== "Grounded" || item.strength === "Mentioned" || item.usageContext === "mentioned")
      .map((item) => item.cvWording || item.skill)
  ], 10);
  const claimsToAvoid = uniqueLimited([
    ...positioningReport.unsupportedClaimsPrevented.flatMap((item) => item.mustNotClaim),
    ...(analysis.candidatePositioning?.claimsToAvoid || []),
    ...(analysis.riskyClaims || []),
    ...diagnostics.selectedEvidence.flatMap((item) => item.forbiddenVisibleClaims || []),
    "from-scratch Python application engineering",
    "production ML model training",
    "reward modeling / RLHF / DPO ownership"
  ], 18);
  const targetPositioning = analysis.candidatePositioning?.safestPositioning
    || positioningReport.recommendedPositioning.wordingGuidance[0]
    || analysis.candidatePositioning?.headlineRecommendation
    || analysis.primaryTargetTitle
    || job.role;
  const managerHiringProblem = analysis.managerIntent?.actualJobToBeDone
    || analysis.positioning?.primaryHiringProblem
    || analysis.positioning?.managerHireReason
    || analysis.summaryAngle;
  const cvHeadline = positioningReport.recommendedPositioning.headline || analysis.candidatePositioning?.headlineRecommendation || analysis.primaryTargetTitle || job.role;
  const cvVisibleEvidence = diagnostics.selectedEvidence.filter((item) => validVisibleEvidenceIds.has(item.id));
  const contractIdentity = {
    contractVersion: SCREENING_TO_BRIEF_CONTRACT_VERSION,
    jdContentHash: job.jdContentHash || computeJobContentHash(job),
    screeningAnalysisHash: contentHash(analysis),
    requirementInventoryHash: contentHash(buildNormalizedRequirementInventory(job.parsed)),
    evidenceSelectionHash: contentHash({ skillIds: diagnostics.selectedSkillIds, domainIds: diagnostics.selectedDomainKnowledgeIds, evidenceIds: diagnostics.selectedEvidenceIds, storyIds: diagnostics.selectedStoryIds }),
    evidenceSafetyHash: contentHash(cvVisibleEvidence.map((item) => ({ id: item.id, content: item, usable: isEvidenceCvUsable(data, item) }))),
    candidatePositioningHash: contentHash(analysis.candidatePositioning || {}),
    screeningSchemaVersion: job.screeningAnalysisRun?.schemaVersion,
    screeningSchemaHash: job.screeningAnalysisRun?.schemaHash
  };
  return {
    targetPositioning,
    managerHiringProblem,
    top3SellingPoints: topMappings.length ? topMappings.map((item) => ({
      title: item.requirement,
      managerValue: item.safeCvAngle || item.marketExpectation,
      evidenceIds: item.visibleEvidenceIds,
      skillIds: item.selectedSkillIds,
      storyIds: item.selectedStoryIds,
      supportLevel: item.supportLevel
    })) : fallbackSellingPoints,
    mustShowEvidenceIds,
    supportingEvidenceIds,
    skillsToForeground,
    skillsToSuppress,
    claimsToAvoid,
    cvHeadline,
    summaryAngle: positioningReport.recommendedPositioning.summaryAngle || analysis.summaryAngle,
    firstSectionTheme: topMappings[0]?.safeCvAngle || topMappings[0]?.requirement || fallbackSellingPoints[0]?.managerValue || managerHiringProblem,
    bulletPlan: topMappings.length ? topMappings.map((item) => ({
      sectionTitle: item.safeCvAngle || item.requirement,
      requirement: item.requirement,
      evidenceIds: item.visibleEvidenceIds,
      angle: item.safeCvAngle || item.marketExpectation,
      avoid: claimsToAvoid,
      matchStatus: item.matchStatus,
      cvUsage: item.cvUsage,
      supportedAspects: item.supportedAspects,
      unsupportedAspects: item.unsupportedAspects,
      transferContext: item.transferContext
    })) : fallbackSellingPoints.map((item) => ({
      sectionTitle: item.title,
      requirement: item.title,
      evidenceIds: item.evidenceIds,
      angle: item.managerValue,
      avoid: claimsToAvoid
    })),
    contractIdentity,
    generatedAt: new Date().toISOString()
  };
}

export type CvStaleReason =
  | "missing-generation-context"
  | "legacy-prompt-version"
  | "jd-changed"
  | "fit-review-changed"
  | "screening-analysis-changed"
  | "cv-brief-changed"
  | "source-selection-changed";

export function cvStaleReasonForJob(cv: CvVersion | undefined, job: JobApplication | undefined, data?: AppData): CvStaleReason | null {
  if (!cv || !job) return null;
  if (!cv.generationContext) return "missing-generation-context";
  if (!SUPPORTED_CV_PROMPT_VERSIONS.has(cv.generationContext.promptVersion)) return "legacy-prompt-version";
  if (cv.generationContext.jdContentHash !== (job.jdContentHash || computeJobContentHash(job))) return "jd-changed";
  if (!data) return null;
  const currentContext = buildGenerationContext(data, job);
  if (cv.generationContext.fitReviewHash !== currentContext.fitReviewHash) return "fit-review-changed";
  if (cv.generationContext.screeningAnalysisHash !== currentContext.screeningAnalysisHash) return "screening-analysis-changed";
  const legacyBriefHash = job.cvBrief ? contentHash(job.cvBrief) : undefined;
  const briefHashMatches = cv.generationContext.cvBriefHash === currentContext.cvBriefHash
    || cv.generationContext.cvBriefHash === legacyBriefHash;
  if (!briefHashMatches) return "cv-brief-changed";
  const sourceHashMatches = cv.generationContext.sourceDataHash === currentContext.sourceDataHash
    || cv.generationContext.sourceDataHash === legacyGenerationSourceDataHash(data, job);
  if (!sourceHashMatches) return "source-selection-changed";
  return null;
}

export function cvStaleActionForReason(reason: CvStaleReason | null) {
  switch (reason) {
    case "missing-generation-context":
    case "legacy-prompt-version":
    case "cv-brief-changed":
      return "CV was created before the current Career OS CV Brief flow. Open Screening Lab to patch the CV from the latest brief.";
    case "jd-changed":
      return "JD changed. Re-run JD Analysis, then patch the CV from the updated brief.";
    case "fit-review-changed":
      return "Fit Review changed. Open Screening Lab to rebuild the CV Brief before patching the CV.";
    case "screening-analysis-changed":
      return "JD Analysis changed. Apply recommendations, rebuild the CV Brief, then patch the CV.";
    case "source-selection-changed":
      return "Selected evidence changed. Open Screening Lab to patch the current CV from the CV Brief.";
    default:
      return "";
  }
}

export function isCvStaleForJob(cv: CvVersion | undefined, job: JobApplication | undefined, data?: AppData) {
  return cvStaleReasonForJob(cv, job, data) !== null;
}

export function fitRecommendationsApplied(data: AppData, job: JobApplication) {
  const recommendationSource = job.screeningAnalysis || job.fitReview;
  if (!recommendationSource) return false;
  const validSkillIds = new Set(data.skillInferences.map((item) => item.id));
  const validDomainIds = new Set(data.domainKnowledge.map((item) => item.id));
  const validEvidenceIds = new Set(data.evidenceCards.map((item) => item.id));
  const validStoryIds = new Set(data.starStories.map((item) => item.id));
  const eligibleRows = cvEligibleRequirementRows(job);
  const expectedSkills = [...new Set(eligibleRows.flatMap((row) => row.matchingSkillIds))].filter((id) => validSkillIds.has(id)).slice(0, 15);
  const expectedDomains = [...new Set(eligibleRows.flatMap((row) => row.matchingDomainKnowledgeIds))].filter((id) => validDomainIds.has(id)).slice(0, 8);
  const expectedEvidence = [...new Set(eligibleRows.flatMap((row) => row.matchingEvidenceIds))].filter((id) => validEvidenceIds.has(id)).slice(0, 15);
  const expectedStories = [...new Set(eligibleRows.flatMap((row) => row.matchingStoryIds))].filter((id) => validStoryIds.has(id)).slice(0, 6);
  const selectedContains = (selected: string[], expected: string[]) => expected.every((id) => selected.includes(id));
  const recommendationsPresent = expectedEvidence.length > 0
    && selectedContains(job.selectedSkillIds || [], expectedSkills)
    && selectedContains(job.selectedDomainKnowledgeIds || [], expectedDomains)
    && selectedContains(job.selectedEvidenceIds || [], expectedEvidence)
    && selectedContains(job.selectedStoryIds || [], expectedStories);
  const diagnostics = selectionDiagnostics(data, job);
  const usableSelection = diagnostics.invalidSkillIds.length === 0
    && diagnostics.invalidDomainKnowledgeIds.length === 0
    && diagnostics.invalidEvidenceIds.length === 0
    && diagnostics.invalidStoryIds.length === 0
    && diagnostics.selectedSkills.length >= CV_GENERATION_MINIMUMS.skills
    && diagnostics.selectedDomainKnowledge.length >= CV_GENERATION_MINIMUMS.domainSignals
    && diagnostics.selectedEvidence.length >= CV_GENERATION_MINIMUMS.evidence
    && diagnostics.selectedStarStories.length >= CV_GENERATION_MINIMUMS.starStories;
  return usableSelection && (Boolean(job.recommendationsAppliedAt) || recommendationsPresent);
}

function selectionTerms(job: JobApplication) {
  const text = JSON.stringify({
    rawJD: job.rawJD,
    parsed: canonicalParsedJD(job.parsed),
    screeningAnalysis: job.screeningAnalysis,
    fitReview: job.fitReview
  }).toLowerCase();
  const stopWords = new Set(["about", "after", "also", "and", "are", "company", "experience", "for", "from", "have", "into", "job", "more", "role", "that", "the", "this", "using", "with", "will", "you", "your"]);
  const counts = new Map<string, number>();
  for (const term of text.match(/[a-z][a-z0-9+#.-]{2,}/g) || []) {
    if (stopWords.has(term)) continue;
    counts.set(term, (counts.get(term) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, 90)
    .map(([term]) => term);
}

function scoreForJob(item: unknown, terms: string[]) {
  const text = JSON.stringify(item).toLowerCase();
  return terms.reduce((total, term) => total + (text.includes(term) ? (term.length > 8 ? 3 : 1) : 0), 0)
    + (/grounded|strong|core|direct claim|built|owned|led|implemented|automated|integrated/.test(text) ? 5 : 0)
    + (/\d[%+]?/.test(text) ? 2 : 0);
}

function rankedIds<T extends { id: string }>(items: T[], terms: string[]) {
  return items
    .map((item, index) => ({ id: item.id, index, score: scoreForJob(item, terms) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((item) => item.id);
}

function mergeLimited(base: string[], additions: string[], limit: number) {
  const merged: string[] = [];
  for (const id of [...base, ...additions]) {
    if (!id || merged.includes(id)) continue;
    merged.push(id);
    if (merged.length >= limit) break;
  }
  return merged;
}

export function buildCvGenerationSelectionPatch(data: AppData, job: JobApplication): Partial<JobApplication> {
  const terms = selectionTerms(job);
  const primaryExperienceId = data.careerProfile.workExperiences[0]?.id;
  const validSkillIds = new Set(data.skillInferences.map((item) => item.id));
  const validDomainIds = new Set(data.domainKnowledge.map((item) => item.id));
  const validEvidenceIds = new Set(data.evidenceCards.map((item) => item.id));
  const validStoryIds = new Set(data.starStories.map((story) => story.id));
  const eligibleRows = cvEligibleRequirementRows(job);
  const recommendationSkillIds = [...new Set(eligibleRows.flatMap((row) => row.matchingSkillIds))].filter((id) => validSkillIds.has(id));
  const recommendationDomainIds = [...new Set(eligibleRows.flatMap((row) => row.matchingDomainKnowledgeIds))].filter((id) => validDomainIds.has(id));
  const recommendationEvidenceIds = [...new Set(eligibleRows.flatMap((row) => row.matchingEvidenceIds))].filter((id) => validEvidenceIds.has(id));
  const recommendationStoryIds = [...new Set(eligibleRows.flatMap((row) => row.matchingStoryIds))].filter((id) => validStoryIds.has(id));

  const skills = data.skillInferences.filter((item) => item.confidence === "Grounded" && item.strength !== "Mentioned" && item.usageContext !== "mentioned");
  const domains = data.domainKnowledge.filter((item) => item.confidence !== "Weak");
  const evidence = data.evidenceCards.filter((item) =>
    item.confidence === "Grounded"
    && item.evidenceTier !== "Archive"
    && item.visibilityUse !== "Interview Only"
    && item.visibilityUse !== "Prompt Context Only"
    && item.visibilityUse !== "Do Not Use"
    && item.claimLevel !== "Interview Only"
    && item.claimLevel !== "Do Not Claim"
  );
  const currentEvidence = evidence.filter((item) => item.experienceId === primaryExperienceId);
  const priorEvidence = evidence.filter((item) => item.experienceId && item.experienceId !== primaryExperienceId);
  const stories = data.starStories.filter((story) => story.storyConfidence !== "Needs Review");

  let selectedEvidenceIds = mergeLimited(
    recommendationEvidenceIds,
    [...rankedIds(currentEvidence, terms), ...rankedIds(priorEvidence, terms), ...(job.selectedEvidenceIds || [])],
    18
  );
  selectedEvidenceIds = mergeLimited(selectedEvidenceIds, rankedIds(evidence, terms), 18);

  const selectedEvidenceSet = new Set(selectedEvidenceIds);
  const storyIdsTiedToEvidence = stories
    .filter((story) => story.evidenceIds.some((id) => selectedEvidenceSet.has(id)))
    .map((story) => story.id);

  return {
    selectedSkillIds: mergeLimited(recommendationSkillIds, [...(job.selectedSkillIds || []), ...rankedIds(skills, terms)], 12),
    selectedDomainKnowledgeIds: mergeLimited(recommendationDomainIds, [...(job.selectedDomainKnowledgeIds || []), ...rankedIds(domains, terms)], 6),
    selectedEvidenceIds,
    selectedStoryIds: mergeLimited(recommendationStoryIds, [...(job.selectedStoryIds || []), ...storyIdsTiedToEvidence, ...rankedIds(stories, terms)], 6),
    recommendationsAppliedAt: new Date().toISOString()
  };
}

export function cvInputReadiness(data: AppData, job: JobApplication) {
  const diagnostics = selectionDiagnostics(data, job);
  const selectedSkills = diagnostics.selectedSkills.length;
  const selectedDomains = diagnostics.selectedDomainKnowledge.length;
  const selectedCvUsableEvidence = diagnostics.selectedEvidence.filter((item) => isEvidenceCvUsable(data, item));
  const selectedEvidence = selectedCvUsableEvidence.length;
  const selectedStories = diagnostics.selectedStarStories.length;
  const hasFitReview = (Boolean(job.fitReview) && job.fit !== "Unknown") || Boolean(job.screeningAnalysis);
  const backbone = backboneReadiness(data, job);
  const primaryExperienceIds = new Set(
    data.careerProfile.workExperiences.slice(0, 1).map((experience) => experience.id)
  );
  const primaryEvidence = selectedCvUsableEvidence.filter((item) => {
    const experienceId = item.experienceId || "";
    return experienceId && primaryExperienceIds.has(experienceId);
  }).length;
  const priorRoleEvidence = selectedCvUsableEvidence.filter((item) => {
    const experienceId = item.experienceId || "";
    return experienceId && !primaryExperienceIds.has(experienceId);
  }).length;
  const invalidSelectionCount = diagnostics.invalidSkillIds.length
    + diagnostics.invalidDomainKnowledgeIds.length
    + diagnostics.invalidEvidenceIds.length
    + diagnostics.invalidStoryIds.length;
  const careerArcHasRoleMix = primaryEvidence >= CV_GENERATION_MINIMUMS.currentRoleEvidence
    && priorRoleEvidence >= CV_GENERATION_MINIMUMS.priorRoleEvidence;
  const careerArcHasCompensatingDepth = primaryEvidence >= CV_GENERATION_MINIMUMS.currentRoleEvidence
    && selectedEvidence >= Math.max(CV_GENERATION_MINIMUMS.evidence + 4, 16)
    && selectedSkills >= CV_GENERATION_MINIMUMS.skills
    && selectedStories >= CV_GENERATION_MINIMUMS.starStories;
  const checks = [
    {
      label: "Fit Review",
      value: hasFitReview ? (job.fit !== "Unknown" ? job.fit : "JD analyzed") : "Missing",
      ok: hasFitReview,
      action: "Run JD Analysis first so the CV has a clear positioning strategy."
    },
    {
      label: "Skill signals",
      value: `${selectedSkills} selected`,
      ok: selectedSkills >= CV_GENERATION_MINIMUMS.skills,
      action: `Select ${CV_GENERATION_MINIMUMS.skills}+ skills so the sidebar and ATS keywords are not thin.`
    },
    {
      label: "Domain context",
      value: `${selectedDomains} selected`,
      ok: selectedDomains >= CV_GENERATION_MINIMUMS.domainSignals,
      action: `Select ${CV_GENERATION_MINIMUMS.domainSignals}+ domain/process/stakeholder/KPI signals for business-aware wording.`
    },
    {
      label: "Evidence depth",
      value: `${selectedEvidence} CV-usable selected`,
      ok: selectedEvidence >= CV_GENERATION_MINIMUMS.evidence,
      action: `Select ${CV_GENERATION_MINIMUMS.evidence}+ evidence cards before generating a substantive two-page CV.`
    },
    {
      label: "Evidence lineage and CV policy",
      value: diagnostics.selectedEvidence.some((item) => !validateEvidenceCard(data, item).cvUsable)
        ? "Needs review"
        : "All selected evidence is traceable and CV-usable",
      ok: diagnostics.selectedEvidence.every((item) => validateEvidenceCard(data, item).cvUsable),
      action: "Use evidence with valid experience, project, source linkage, and explicit CV permission."
    },
    {
      label: "Selected Backbone readiness",
      value: backbone.ready ? "Ready" : backbone.blockingReasons.join(" "),
      ok: backbone.ready,
      action: "Resolve only the selected project tasks and source lineage before generating a new CV."
    },
    {
      label: "STAR material",
      value: `${selectedStories} selected`,
      ok: selectedStories >= CV_GENERATION_MINIMUMS.starStories,
      action: `Select ${CV_GENERATION_MINIMUMS.starStories}+ STAR stories so strong outcomes are integrated into bullets.`
    },
    {
      label: "Career arc",
      value: `${primaryEvidence} current / ${priorRoleEvidence} prior`,
      ok: careerArcHasRoleMix || careerArcHasCompensatingDepth,
      action: `Prefer ${CV_GENERATION_MINIMUMS.currentRoleEvidence}+ current-role evidence and ${CV_GENERATION_MINIMUMS.priorRoleEvidence}+ prior-role evidence. If prior evidence is limited, compensate with 16+ total evidence plus enough skills and STAR stories.`
    },
    {
      label: "Valid selected source links",
      value: invalidSelectionCount ? `${invalidSelectionCount} stale IDs` : "All valid",
      ok: invalidSelectionCount === 0,
      action: "Re-apply recommendations or clear stale selections before generating/exporting."
    }
  ];
  return {
    checks,
    ready: checks.every((check) => check.ok),
    selectedSkills,
    selectedDomains,
    selectedEvidence,
    selectedStories,
    invalidSelectionCount,
    diagnostics
  };
}

export function latestCvForJob(data: AppData, jobId: string) {
  return sortCvVersions(data.cvVersions.filter((version) => version.jdId === jobId))[0];
}

export function cleanSelectionPatch(data: AppData, job: JobApplication): Partial<JobApplication> {
  const skillIds = new Set(data.skillInferences.map((item) => item.id));
  const domainIds = new Set(data.domainKnowledge.map((item) => item.id));
  const evidenceIds = new Set(data.evidenceCards.map((item) => item.id));
  const storyIds = new Set(data.starStories.map((story) => story.id));
  return {
    selectedSkillIds: (job.selectedSkillIds || []).filter((id) => skillIds.has(id)),
    selectedDomainKnowledgeIds: (job.selectedDomainKnowledgeIds || []).filter((id) => domainIds.has(id)),
    selectedEvidenceIds: (job.selectedEvidenceIds || []).filter((id) => evidenceIds.has(id)),
    selectedStoryIds: (job.selectedStoryIds || []).filter((id) => storyIds.has(id)),
    nextAction: "Review cleaned selections, then apply recommendations or add more evidence."
  };
}
