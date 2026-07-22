import type {
  AppData,
  AutomationJob,
  CvVersion,
  JobApplication,
  ReviewerIssue,
  ReviewerSeverity,
  ReviewerStructuredResult,
  ScreeningAnalysis
} from "../types";
import { cvContentAudit, tailoredCvFromVersion, tailoredCvToSections } from "../components/cv/utils";
import { deriveScreeningWorkflowState } from "./screeningWorkflow";
import { contentHash } from "../utils/hash";
import { buildSummaryQualityContract, evaluateSummaryQuality } from "./summaryQualityContract";
import { canonicalParsedJD } from "../data/jobs";

export function reviewSnapshotContentHash(cv: CvVersion) {
  return contentHash({
    jdId: cv.jdId,
    summary: cv.summary,
    content: cv.content,
    sections: cv.sections,
    tailoredCv: cv.tailoredCv
  });
}

export function isReviewSnapshotValidForCv(cv: CvVersion | undefined) {
  const snapshot = cv?.reviewSnapshot;
  if (!cv || !snapshot) return false;
  if (!snapshot.contentHash) return true;
  return snapshot.contentHash === reviewSnapshotContentHash(cv);
}

export function reconcileReviewSnapshotIdentity(cv: CvVersion): CvVersion {
  const snapshot = cv.reviewSnapshot;
  if (!snapshot) return cv;
  const currentContentHash = reviewSnapshotContentHash(cv);
  if (snapshot.contentHash && snapshot.contentHash !== currentContentHash) {
    return { ...cv, reviewSnapshot: undefined };
  }
  if (
    snapshot.contentHash
    && snapshot.snapshotId
    && snapshot.reviewRunId
    && snapshot.updatedAt
    && snapshot.reviewedCvVersionId
    && snapshot.reviewedCvContentHash
    && snapshot.reviewedSummaryHash
    && snapshot.freshnessStatus === "fresh"
  ) return cv;
  const snapshotUpdatedAt = snapshot.updatedAt || snapshot.completedAt || snapshot.cvUpdatedAt || cv.updatedAt;
  return {
    ...cv,
    reviewSnapshot: {
      ...snapshot,
      snapshotId: snapshot.snapshotId || `review-${contentHash({ cvId: cv.id, snapshotUpdatedAt, currentContentHash })}`,
      reviewRunId: snapshot.reviewRunId || snapshot.snapshotId || `review-${contentHash({ cvId: cv.id, snapshotUpdatedAt, currentContentHash })}`,
      updatedAt: snapshotUpdatedAt,
      contentHash: currentContentHash,
      reviewedCvVersionId: snapshot.reviewedCvVersionId || cv.id,
      reviewedCvContentHash: snapshot.reviewedCvContentHash || currentContentHash,
      reviewedSummaryHash: snapshot.reviewedSummaryHash || contentHash(cv.tailoredCv?.summary || cv.sections?.summary || cv.summary || ""),
      freshnessStatus: "fresh"
    }
  };
}

export function isActiveAutomationRun(run: AutomationJob<unknown> | null | undefined) {
  return run?.status === "queued" || run?.status === "running";
}

export function isDisconnectedAutomationRun(
  run: JobApplication["screeningAnalysisRun"] | JobApplication["screeningCvRun"] | undefined,
  activeRun: AutomationJob<unknown> | null | undefined,
  starting = false
) {
  const runRecordActive = run?.status === "queued" || run?.status === "running";
  return Boolean(runRecordActive && !starting && !isActiveAutomationRun(activeRun));
}

export function shouldStopAiRepairLoop(
  run: JobApplication["screeningCvRun"] | undefined,
  blockerCount: number,
  cvVersionCount: number
) {
  return deriveScreeningWorkflowState({
    careerEvidenceReady: true,
    analysisReady: true,
    terminologyReady: true,
    briefReady: true,
    hasCv: true,
    cvRunActive: false,
    gateIssueCount: 0,
    reviewerIssueCount: blockerCount,
    reviewerReady: blockerCount === 0,
    cvVersionCount,
    run
  }).repairLocked;
}

const JD_MAPPING_RISK_TERMS = [
  "llm-as-judge",
  "hallucination detection",
  "benchmark design",
  "rubric design",
  "human review validation",
  "confidence intervals",
  "effect sizes",
  "statistical significance",
  "proper scoring rules",
  "construct validity",
  "irt",
  "reward modeling",
  "rlhf",
  "dpo",
  "pytorch",
  "jax",
  "tensorflow",
  "ml frameworks",
  "ai safety",
  "red teaming",
  "adversarial testing",
  "production mlops",
  "model training",
  "from scratch"
];

const KEYWORD_ALIASES: Record<string, string[]> = {
  "benchmark design": ["benchmark-style", "benchmark questions", "benchmark-based", "evaluation set"],
  "rubric design": ["rubric-style", "quality rules", "scoring rules", "review categories"],
  "prompt regression testing": ["prompt quality", "quality rule iteration", "scheduled scoring"],
  "statistics": ["experimental design", "a/b testing", "metric definition", "quality metrics"],
  "hallucination detection": ["hallucination-risk", "hallucination risk"],
  "evaluation pipeline": ["evaluation workflow", "scheduled scoring", "pipeline output"],
  "human review validation": ["human review", "review follow-up"]
};

const SUPPORT_RANK: Record<"Strong" | "Partial" | "Weak" | "Unsupported", number> = {
  Strong: 3,
  Partial: 2,
  Weak: 1,
  Unsupported: 0
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsVisibleTerm(text: string, term: string) {
  const normalized = term.trim().toLowerCase();
  if (!normalized) return false;
  if (/^[a-z0-9+#.-]{1,3}$/.test(normalized)) {
    return new RegExp(`\\b${escapeRegExp(normalized)}\\b`, "i").test(text);
  }
  if (normalized.includes(" ")) {
    return text.includes(normalized);
  }
  return new RegExp(`\\b${escapeRegExp(normalized)}\\b`, "i").test(text);
}

function keywordCovered(text: string, keyword: string) {
  const normalized = keyword.toLowerCase();
  return [normalized, ...(KEYWORD_ALIASES[normalized] || [])].some((term) => containsVisibleTerm(text, term));
}

function keywordHasSelectedEvidence(
  keyword: string,
  job: JobApplication,
  evidenceCards: AppData["evidenceCards"]
) {
  const normalized = keyword.toLowerCase();
  const terms = [normalized, ...(KEYWORD_ALIASES[normalized] || [])];
  return job.selectedEvidenceIds.some((id) => {
    const evidence = evidenceCards.find((item) => item.id === id);
    if (!evidence) return false;
    const evidenceText = [
      evidence.title,
      evidence.externalFriendlyDescription,
      evidence.problemContext,
      evidence.actionTaken,
      evidence.quantifiedEvidence,
      evidence.cvAngle,
      evidence.cvBullet,
      evidence.cvSafeBullet,
      evidence.proof,
      evidence.metrics,
      ...(evidence.relatedJdKeywords || []),
      ...(evidence.tools || []),
      ...(evidence.allowedVisibleClaims || [])
    ].filter(Boolean).join(" ").toLowerCase();
    return terms.some((term) => containsVisibleTerm(evidenceText, term));
  });
}

function visibleUnsupportedMappingClaims(
  visibleText: string,
  mappings: NonNullable<ScreeningAnalysis["jdEvidenceMapping"]>
) {
  return mappings.flatMap((item) =>
    [item.requirement, item.safeCvAngle, item.gapOrRisk]
      .filter((term) => term.trim().length >= 4 && containsVisibleTerm(visibleText, term))
      .map((term) => term.trim())
  );
}

function visibleHighRiskGapClaims(
  visibleText: string,
  gaps: NonNullable<ScreeningAnalysis["remainingGaps"]>
) {
  return gaps.flatMap((item) =>
    [item.gap, item.mitigation]
      .filter((term) => term.trim().length >= 4 && containsVisibleTerm(visibleText, term))
      .map((term) => term.trim())
  );
}

function keywordSupportLevel(analysis: ScreeningAnalysis | undefined, keyword: string) {
  const normalized = keyword.toLowerCase();
  const terms = [normalized, ...(KEYWORD_ALIASES[normalized] || [])];
  return (analysis?.jdEvidenceMapping || []).reduce<"Strong" | "Partial" | "Weak" | "Unsupported" | "Unknown">((best, item) => {
    const mappingText = [item.requirement, item.marketExpectation, item.safeCvAngle, item.gapOrRisk].join(" ").toLowerCase();
    if (!terms.some((term) => mappingText.includes(term))) return best;
    if (best === "Unknown") return item.supportLevel;
    return SUPPORT_RANK[item.supportLevel] > SUPPORT_RANK[best] ? item.supportLevel : best;
  }, "Unknown");
}

export function screeningGate(job: JobApplication, cv: CvVersion | undefined, evidenceCards: AppData["evidenceCards"] = []) {
  const analysis = job.screeningAnalysis;
  const tailoredCv = tailoredCvFromVersion(cv);
  const sections = tailoredCv ? tailoredCvToSections(tailoredCv) : undefined;
  const content = (cv?.content || "").toLowerCase();
  const mustHave = analysis?.mustHaveKeywords || [];
  const keywordPlacements = mustHave.map((keyword) => {
    const placements = [
      keywordCovered(sections?.summary.toLowerCase() || "", keyword) ? "Summary" : "",
      keywordCovered(sections?.skills.toLowerCase() || "", keyword) ? "Skills" : "",
      keywordCovered(sections?.workExperience.toLowerCase() || "", keyword) ? "Work Experience" : ""
    ].filter(Boolean);
    return {
      keyword,
      placements,
      covered: placements.length > 0,
      supportLevel: keywordSupportLevel(analysis, keyword),
      evidenceBacked: keywordHasSelectedEvidence(keyword, job, evidenceCards)
    };
  });
  const coveredKeywords = keywordPlacements.filter((item) => item.covered).map((item) => item.keyword);
  const missingKeywords = keywordPlacements.filter((item) => !item.covered).map((item) => item.keyword);
  const supportedMissingKeywords = keywordPlacements
    .filter((item) =>
      !item.covered
      && (
        item.supportLevel === "Strong"
        || item.supportLevel === "Partial"
        || (item.supportLevel === "Unknown" && item.evidenceBacked)
      )
    )
    .map((item) => item.keyword);
  const unsupportedMissingKeywords = keywordPlacements
    .filter((item) =>
      !item.covered
      && (
        item.supportLevel === "Weak"
        || item.supportLevel === "Unsupported"
        || (item.supportLevel === "Unknown" && !item.evidenceBacked)
      )
    )
    .map((item) => item.keyword);
  const targetTitle = (analysis?.primaryTargetTitle || "").toLowerCase();
  const titleAligned = !targetTitle
    || content.includes(targetTitle)
    || (cv?.tailoredCv?.header.targetRole || "").toLowerCase().includes(targetTitle);
  const bulletEvidenceIds = new Set(
    tailoredCv?.workExperience.flatMap((experience) =>
      experience.subsections.flatMap((section) =>
        section.bullets.flatMap((bullet) => bullet.evidenceIds || [])
      )
    ) || []
  );
  const evidencePriorityIds = cv?.generationContext?.evidencePriorityIds?.length
    ? cv.generationContext.evidencePriorityIds
    : job.selectedEvidenceIds;
  const evidenceCoverageCount = evidencePriorityIds.filter((id) => bulletEvidenceIds.has(id)).length;
  const evidenceCoverage = evidenceCoverageCount >= Math.min(3, Math.max(1, evidencePriorityIds.length));
  const visibleCvText = [
    tailoredCv?.header.targetRole || "",
    tailoredCv?.summary || "",
    ...(tailoredCv?.workExperience.flatMap((experience) => [
      experience.role,
      ...experience.subsections.flatMap((section) => section.bullets.map((bullet) => bullet.text))
    ]) || [])
  ].join(" ").toLowerCase();
  const unresolvedRiskyClaims = (analysis?.riskyClaims || []).filter((claim) => {
    const simplified = claim.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").trim();
    return simplified.length >= 4 && visibleCvText.includes(simplified);
  });
  const selectedBlockedTerms = Array.from(new Set(
    job.selectedEvidenceIds.flatMap((id) =>
      evidenceCards.find((item) => item.id === id)?.blockedVisibleTerms || []
    )
  )).filter(Boolean);
  const visibleBlockedTerms = selectedBlockedTerms.filter((term) =>
    containsVisibleTerm(visibleCvText, term)
  );
  const selectedForbiddenClaims = Array.from(new Set(
    job.selectedEvidenceIds.flatMap((id) =>
      evidenceCards.find((item) => item.id === id)?.forbiddenVisibleClaims || []
    )
  )).filter(Boolean);
  const visibleForbiddenClaims = selectedForbiddenClaims.filter((term) =>
    containsVisibleTerm(visibleCvText, term)
  );
  const analysisInternalTerms = (analysis?.internalTerminology || [])
    .filter((item) => item.usageDecision === "Replace" || item.usageDecision === "Remove")
    .map((item) => item.originalTerm)
    .filter(Boolean);
  const visibleAnalysisInternalTerms = analysisInternalTerms.filter((term) =>
    containsVisibleTerm(visibleCvText, term)
  );
  const weakOrUnsupportedMappingText = (analysis?.jdEvidenceMapping || [])
    .filter((item) => item.supportLevel === "Weak" || item.supportLevel === "Unsupported")
    .flatMap((item) => [item.requirement, item.marketExpectation, item.gapOrRisk])
    .join(" ")
    .toLowerCase();
  const visibleWeakMappingTerms = JD_MAPPING_RISK_TERMS.filter((term) =>
    weakOrUnsupportedMappingText.includes(term) && containsVisibleTerm(visibleCvText, term)
  );
  const visibleMissingKeywords = (analysis?.missingKeywords || []).filter((term) =>
    term.length >= 4 && containsVisibleTerm(visibleCvText, term)
  );
  const mappingClaimViolations = Array.from(new Set([...visibleWeakMappingTerms, ...visibleMissingKeywords]));
  const overclaimRisk = unresolvedRiskyClaims.length === 0
    && visibleBlockedTerms.length === 0
    && visibleForbiddenClaims.length === 0
    && visibleAnalysisInternalTerms.length === 0
    && mappingClaimViolations.length === 0;
  const atsReadable = Boolean(cv?.tailoredCv?.summary && cv?.tailoredCv?.workExperience?.length);
  const businessOutcomePattern = /reduce|improv|increase|save|faster|lower|enable|support|protect|prevent|centraliz|visibility|reliability|accuracy|efficien|adoption|decision|risk|compliance|quality|scale|production|stakeholder/i;
  const visibleBullets = tailoredCv?.workExperience.flatMap((experience) =>
    experience.subsections.flatMap((section) => section.bullets.map((bullet) => bullet.text))
  ) || [];
  const positioningText = [
    analysis?.positioning?.roleType,
    analysis?.positioning?.aiMarketArchetype,
    analysis?.positioning?.primaryHiringProblem,
    analysis?.positioning?.managerHireReason,
    analysis?.positioning?.toolApplicationAngle,
    analysis?.primaryTargetTitle,
    job.role,
  ].filter(Boolean).join(" ");
  const aiEvaluationRole = /ai product ops|evaluation|llm|ai evaluation/i.test(positioningText);
  const powerPlatformRole = !aiEvaluationRole && /power platform|m365|sharepoint|power automate|power apps|business automation/i.test(`${positioningText} ${JSON.stringify(job.parsed ? canonicalParsedJD(job.parsed) : job.rawJD)}`);
  const firstSubsectionTitle = tailoredCv?.workExperience[0]?.subsections[0]?.title || "";
  const aiEvalFirst = /llm evaluation|ai evaluation|chatbot quality|benchmark/i.test(firstSubsectionTitle);
  const currentRoleBulletCount = tailoredCv?.workExperience[0]?.subsections.reduce((total, section) => total + section.bullets.length, 0) || 0;
  const currentRoleSubsectionCount = tailoredCv?.workExperience[0]?.subsections.length || 0;
  const sidebarSkills = tailoredCv?.sidebar.skillGroups.flatMap((group) => [...group.highlightedSkills, ...group.otherSkills]) || [];
  const distractingSidebarSkills = powerPlatformRole
    ? sidebarSkills.filter((skill) => /python|fastapi|azure ai studio|llm evaluation|a\/b testing|utm attribution|cookie-based routing/i.test(skill))
    : [];
  const positioningMismatch = !aiEvaluationRole && aiEvalFirst;
  const overBroadCurrentRole = currentRoleBulletCount > 10 || currentRoleSubsectionCount > 3;
  const achievementLikeBullets = visibleBullets.filter((bullet) => businessOutcomePattern.test(bullet)).length;
  const taskOnlyFailures = visibleBullets.length > 0 && achievementLikeBullets / Math.max(visibleBullets.length, 1) < 0.35;
  const contentAudit = tailoredCv ? cvContentAudit(tailoredCv) : [];
  const fixNext = [
    !titleAligned ? `Change the visible target title to match "${analysis?.primaryTargetTitle || "the screening target"}".` : "",
    supportedMissingKeywords.length ? `Place these evidence-supported missing keywords into summary, skills, or bullets: ${supportedMissingKeywords.slice(0, 5).join(", ")}.` : "",
    visibleBlockedTerms.length ? `Remove blocked internal terms from visible CV text: ${visibleBlockedTerms.slice(0, 8).join(", ")}.` : "",
    visibleAnalysisInternalTerms.length ? `Replace internal terminology still visible in the CV: ${visibleAnalysisInternalTerms.slice(0, 8).join(", ")}.` : "",
    visibleForbiddenClaims.length ? `Remove forbidden visible claims from selected evidence: ${visibleForbiddenClaims.slice(0, 8).join(", ")}.` : "",
    mappingClaimViolations.length ? `Remove or downgrade weak/unsupported JD-mapping claims from visible CV: ${mappingClaimViolations.slice(0, 8).join(", ")}.` : "",
    positioningMismatch ? `Rewrite the first work subsection. "${firstSubsectionTitle}" is too AI-evaluation heavy for this JD positioning.` : "",
    distractingSidebarSkills.length ? `Remove distracting sidebar skills for this JD: ${distractingSidebarSkills.slice(0, 6).join(", ")}.` : "",
    overBroadCurrentRole ? `Reduce current-role content to 2-3 subsections and 8-10 bullets total, focused on this JD's top manager problems.` : "",
    !evidenceCoverage ? "Tie more selected evidence directly into visible work bullets so the CV is not just keyword-deep." : "",
    unresolvedRiskyClaims.length ? `Remove or soften risky unsupported language: ${unresolvedRiskyClaims.slice(0, 3).join(", ")}.` : "",
    contentAudit.length ? `Rewrite ${contentAudit.length} work-log bullet(s) into external resume bullets. Remove long proof parentheses, score dumps, version numbers, and internal dates.` : "",
    taskOnlyFailures ? "Rewrite more bullets into action + scope + business outcome language instead of task logs." : ""
  ].filter(Boolean);
  return {
    coveredKeywords,
    missingKeywords,
    supportedMissingKeywords,
    unsupportedMissingKeywords,
    keywordPlacements,
    unresolvedRiskyClaims,
    evidenceCoverageCount,
    evidencePriorityIds,
    fixNext,
    checks: [
      { label: "Title alignment", ok: titleAligned, value: analysis?.primaryTargetTitle || "Not set" },
      {
        label: "Must-have keywords",
        ok: supportedMissingKeywords.length === 0 && mustHave.length > 0,
        value: [
          `${coveredKeywords.length}/${mustHave.length} covered`,
          supportedMissingKeywords.length ? `add: ${supportedMissingKeywords.slice(0, 4).join(", ")}` : "",
          unsupportedMissingKeywords.length ? `${unsupportedMissingKeywords.length} unsupported keyword(s) intentionally not forced` : ""
        ].filter(Boolean).join(" · ")
      },
      { label: "Evidence coverage", ok: evidenceCoverage, value: `${evidenceCoverageCount}/${evidencePriorityIds.length} priority evidence IDs show up in visible bullets` },
      { label: "ATS readability", ok: atsReadable, value: atsReadable ? "Summary + work sections present" : "CV draft incomplete" },
      { label: "JD positioning", ok: !positioningMismatch && !distractingSidebarSkills.length, value: positioningMismatch ? `First subsection is "${firstSubsectionTitle}"` : distractingSidebarSkills.length ? `${distractingSidebarSkills.length} distracting sidebar skill(s)` : "CV emphasis matches JD positioning" },
      { label: "Manager scan", ok: !overBroadCurrentRole, value: `${currentRoleSubsectionCount} subsection(s), ${currentRoleBulletCount} current-role bullet(s)` },
      { label: "Resume readability", ok: contentAudit.length === 0, value: contentAudit.length ? `${contentAudit.length} work-log bullet(s) need rewrite` : "No work-log bullets detected" },
      { label: "Internal terminology cleanup", ok: visibleAnalysisInternalTerms.length === 0 && visibleBlockedTerms.length === 0, value: visibleAnalysisInternalTerms.length || visibleBlockedTerms.length ? `${visibleAnalysisInternalTerms.length + visibleBlockedTerms.length} internal term(s) visible` : "Internal terms translated or absent" },
      { label: "Evidence mapping claims", ok: mappingClaimViolations.length === 0, value: mappingClaimViolations.length ? `${mappingClaimViolations.length} weak/unsupported term(s) visible` : "Visible claims match evidence support" },
      { label: "Overclaim risk", ok: overclaimRisk, value: overclaimRisk ? "No flagged risky claims remain visible" : `${unresolvedRiskyClaims.length} flagged phrase(s), ${visibleBlockedTerms.length} blocked term(s), ${visibleForbiddenClaims.length} forbidden claim(s) still appear` }
    ]
  };
}

export type ScreeningGateResult = ReturnType<typeof screeningGate>;

export function hiringManagerReview(
  job: JobApplication,
  cv: CvVersion | undefined,
  gate: ScreeningGateResult | null,
  evidenceCards: AppData["evidenceCards"] = []
) {
  const tailoredCv = tailoredCvFromVersion(cv);
  if (!tailoredCv || !cv) return null;
  const analysis = job.screeningAnalysis;
  const summaryQualityContract = buildSummaryQualityContract({
    data: { jobs: [job], evidenceCards } as AppData,
    job
  });
  const summaryReview = evaluateSummaryQuality({
    contract: summaryQualityContract,
    cv: tailoredCv,
    reviewedCvHash: cv ? reviewSnapshotContentHash(cv) : "",
    reviewRunId: cv?.reviewSnapshot?.reviewRunId || cv?.reviewSnapshot?.snapshotId || `review-${contentHash({ jdId: job.id, summary: tailoredCv.summary })}`
  });
  const cvText = [
    tailoredCv.header.targetRole,
    tailoredCv.summary,
    ...tailoredCv.sidebar.skillGroups.flatMap((group) => [...group.highlightedSkills, ...group.otherSkills]),
    ...tailoredCv.workExperience.flatMap((experience) => [
      experience.role,
      experience.company,
      ...experience.subsections.flatMap((section) => [
        section.title,
        ...section.bullets.map((bullet) => `${bullet.text} ${bullet.metric || ""}`)
      ])
    ])
  ].join(" ");
  const lower = cvText.toLowerCase();
  const bullets = tailoredCv.workExperience.flatMap((experience) =>
    experience.subsections.flatMap((section) => section.bullets.map((bullet) => `${bullet.text} ${bullet.metric || ""}`.trim()))
  );
  const firstBullets = tailoredCv.workExperience[0]?.subsections.flatMap((section) => section.bullets.map((bullet) => bullet.text)) || [];
  const firstSubsectionTitle = tailoredCv.workExperience[0]?.subsections[0]?.title || "";
  const currentRoleBulletCount = tailoredCv.workExperience[0]?.subsections.reduce((total, section) => total + section.bullets.length, 0) || 0;
  const currentRoleSubsectionCount = tailoredCv.workExperience[0]?.subsections.length || 0;
  const positioningText = [
    analysis?.positioning?.roleType,
    analysis?.positioning?.aiMarketArchetype,
    analysis?.positioning?.primaryHiringProblem,
    analysis?.positioning?.managerHireReason,
    analysis?.positioning?.toolApplicationAngle,
    analysis?.primaryTargetTitle,
    job.role,
  ].filter(Boolean).join(" ");
  const aiEvaluationRole = /ai product ops|evaluation|llm|ai evaluation/i.test(positioningText);
  const aiEvalFirst = /llm evaluation|ai evaluation|chatbot quality|benchmark/i.test(firstSubsectionTitle);
  const internalLanguageHits = [
    "source lists",
    "original cv states",
    "evidence card",
    "selected evidence",
    "source file citation",
    "grounded in uploaded",
    "official rollout",
    "review note",
    "claim boundary"
  ].filter((phrase) => lower.includes(phrase));
  const managerIntent = analysis?.managerIntent;
  const managerPainHits = (managerIntent?.hiringManagerPainPoints || []).filter((pain) => {
    const meaningfulWords = pain.toLowerCase().match(/[a-z][a-z0-9+#-]{4,}/g) || [];
    return meaningfulWords.some((word) => lower.includes(word));
  });
  const successSignalHits = (managerIntent?.successSignals || []).filter((signal) => {
    const meaningfulWords = signal.toLowerCase().match(/[a-z][a-z0-9+#-]{4,}/g) || [];
    return meaningfulWords.some((word) => lower.includes(word));
  });
  const supportRole = /power platform|m365|sharepoint|support|developer|workflow|automation/i.test(`${job.role} ${analysis?.primaryTargetTitle || ""} ${JSON.stringify(job.parsed ? canonicalParsedJD(job.parsed) : job.rawJD)}`);
  const supportKeywords = ["power automate", "power apps", "sharepoint", "m365", "troubleshoot", "support", "workflow", "documentation", "user"];
  const supportHits = supportKeywords.filter((keyword) => lower.includes(keyword));
  const aiOverweight = supportRole && firstBullets.join(" ").toLowerCase().match(/\b(ai|llm|chatbot|gpt|model)\b/g)?.length && supportHits.length < 4;
  const actionOutcomePattern = /built|created|developed|automated|supported|maintained|troubleshot|improved|reduced|enabled|centralized|documented|trained|coordinated|implemented/i;
  const usableBullets = bullets.filter((bullet) => actionOutcomePattern.test(bullet)).length;
  const contentAudit = cvContentAudit(tailoredCv);
  const gateBlockingFixes = gate?.fixNext.filter(isBlockingRepairItem) || [];
  const gateManualFixes = gate?.fixNext.filter((item) => !isBlockingRepairItem(item)) || [];
  const gateBlocked = gateBlockingFixes.length > 0;
  const unsupportedMappings = (analysis?.jdEvidenceMapping || []).filter((item) => item.supportLevel === "Unsupported");
  const weakMappings = (analysis?.jdEvidenceMapping || []).filter((item) => item.supportLevel === "Weak");
  const applyTier = analysis?.positioning?.applyTier;
  const risks = [
    gateBlocked ? `Screening Gate still has ${gateBlockingFixes.length} blocking issue(s), so this CV is not manager-ready.` : "",
    applyTier === "Avoid" ? "Screening Analysis marks this JD as Avoid; do not submit without changing target strategy." : "",
    applyTier === "Stretch" && unsupportedMappings.length ? `This is a stretch application with ${unsupportedMappings.length} unsupported JD requirement(s).` : "",
    weakMappings.length ? `${weakMappings.length} JD requirement(s) are only weakly supported; avoid making them headline claims.` : "",
    summaryReview.fitRiskOnly ? "Summary quality is acceptable, but remaining direct-fit concerns are application-fit risk." : "",
    internalLanguageHits.length ? `Visible CV still contains internal proof/review language: ${internalLanguageHits.slice(0, 4).join(", ")}.` : "",
    aiOverweight ? "The first-page story over-weights AI/chatbot work for a Power Platform / M365 support-style role." : "",
    !aiEvaluationRole && aiEvalFirst ? `The first work subsection is "${firstSubsectionTitle}", which makes the CV look like an AI evaluation CV instead of the JD's actual role.` : "",
    currentRoleBulletCount > 10 || currentRoleSubsectionCount > 3 ? "The current role is too broad for a manager scan; it reads like a work archive instead of a targeted application." : "",
    supportRole && supportHits.length < 4 ? `Not enough visible Power Platform / M365 support signals. Current hits: ${supportHits.join(", ") || "none"}.` : "",
    contentAudit.length ? `${contentAudit.length} bullet(s) still read like internal project logs or test notes.` : "",
    bullets.length && usableBullets / Math.max(bullets.length, 1) < 0.55 ? "Too many bullets describe activity without clear manager-facing action or outcome." : "",
    managerIntent && managerPainHits.length < Math.min(2, managerIntent.hiringManagerPainPoints.length) && summaryReview.summaryRewriteNeeded ? "The CV does not visibly answer enough hiring-manager pain points from the JD." : ""
  ].filter(Boolean);
  const positives = [
    tailoredCv.header.targetRole ? `Visible target title is "${tailoredCv.header.targetRole}".` : "",
    supportRole && supportHits.length >= 4 ? `Power Platform / M365 signals are visible: ${supportHits.slice(0, 6).join(", ")}.` : "",
    managerPainHits.length ? `Addresses manager pain points: ${managerPainHits.slice(0, 3).join("; ")}.` : "",
    successSignalHits.length ? `Shows success signals: ${successSignalHits.slice(0, 3).join("; ")}.` : "",
    bullets.length >= 8 ? `${bullets.length} work bullets give enough screening substance.` : ""
  ].filter(Boolean);
  const rewriteRequired = [
    gateBlocked ? "Fix blocking Screening Gate issues before treating Manager Review as complete." : "",
    applyTier === "Avoid" ? "Do not export this CV for the current JD unless the target role strategy changes." : "",
    unsupportedMappings.length ? "Remove unsupported JD requirements from visible claims; keep them as gaps, not resume promises." : "",
    weakMappings.length ? "Rewrite weakly supported requirements as conservative operational support, not expert ownership." : "",
    internalLanguageHits.length ? "Remove raw source/proof wording from visible CV fields." : "",
    aiOverweight ? "Move AI/chatbot details behind the Power Platform / M365 automation and support narrative." : "",
    !aiEvaluationRole && aiEvalFirst ? "Change the first subsection to match the JD's actual manager problem, such as workflow automation, deployment enablement, technical operations, or Power Platform production support." : "",
    currentRoleBulletCount > 10 || currentRoleSubsectionCount > 3 ? "Cut the current role to 2-3 targeted subsections and 8-10 bullets maximum." : "",
    supportRole && supportHits.length < 4 ? "Add supported Power Apps, Power Automate, SharePoint, M365, troubleshooting, documentation, and user-support wording where grounded." : "",
    contentAudit.length ? "Rewrite flagged bullets into external business language." : "",
    summaryReview.criteria
      .filter((item) => item.status === "fail" && item.fixability === "summary-rewrite")
      .map((item) => summaryQualityContract.requiredCriteria.find((criterion) => criterion.id === item.criterionId)?.label || item.criterionId)
      .length
      ? `Rewrite Summary criteria: ${summaryReview.criteria
        .filter((item) => item.status === "fail" && item.fixability === "summary-rewrite")
        .map((item) => summaryQualityContract.requiredCriteria.find((criterion) => criterion.id === item.criterionId)?.label || item.criterionId)
        .join(", ")}.`
      : "",
    managerIntent && managerPainHits.length < Math.min(2, managerIntent.hiringManagerPainPoints.length) && summaryReview.summaryRewriteNeeded ? "Rewrite summary and first work bullets around the manager's real pain points." : ""
  ].filter(Boolean);
  const wouldInterview = gateBlocked || applyTier === "Avoid"
    ? "No"
    : risks.length === 0
      ? "Yes"
      : risks.length <= 2 && positives.length >= 3 && unsupportedMappings.length === 0
        ? "Maybe"
        : "No";
  const interviewConfidence = gateBlocked || applyTier === "Avoid"
    ? "Low"
    : wouldInterview === "Yes"
      ? "High"
      : wouldInterview === "Maybe"
        ? "Medium"
        : "Low";
  return {
    wouldInterview,
    interviewConfidence,
    positives,
    risks,
    rewriteRequired,
    checks: [
      { label: "Gate readiness", ok: !gateBlocked, value: gateBlocked ? `${gateBlockingFixes.length} blocking Screening Gate issue(s) remain` : gateManualFixes.length ? `Gate passed with ${gateManualFixes.length} manual title fix` : "Gate passed" },
      { label: "Evidence support", ok: unsupportedMappings.length === 0 && weakMappings.length <= 2, value: `${unsupportedMappings.length} unsupported, ${weakMappings.length} weak mapping(s)` },
      { label: "Manager intent", ok: !managerIntent || managerPainHits.length >= Math.min(2, managerIntent.hiringManagerPainPoints.length), value: managerIntent?.actualJobToBeDone || "Run Screening Analysis again to populate manager intent." },
      { label: "Summary quality contract", ok: !summaryReview.summaryRewriteNeeded, value: summaryReview.summaryRewriteNeeded ? summaryReview.criteria.filter((item) => item.status === "fail" && item.fixability === "summary-rewrite").map((item) => item.criterionId).join(", ") : summaryReview.fitRiskOnly ? "Summary quality passed; remaining concern is fit risk" : "Summary criteria passed" },
      { label: "Role emphasis", ok: !supportRole || supportHits.length >= 4, value: supportRole ? `${supportHits.length}/${supportKeywords.length} Power Platform / M365 signals visible` : "Not a Power Platform/M365-first JD" },
      { label: "30-second scan", ok: !(currentRoleBulletCount > 10 || currentRoleSubsectionCount > 3) && !(!aiEvaluationRole && aiEvalFirst), value: `${currentRoleSubsectionCount} subsection(s), ${currentRoleBulletCount} current-role bullet(s); first subsection: ${firstSubsectionTitle || "none"}` },
      { label: "External language", ok: !internalLanguageHits.length && !contentAudit.length, value: internalLanguageHits.length || contentAudit.length ? "Internal wording remains" : "Reads externally" },
      { label: "Interview substance", ok: positives.length >= 3 && bullets.length >= 8, value: `${positives.length} positive signal(s), ${bullets.length} work bullet(s)` }
    ],
    summaryQualityContract,
    summaryReview
  };
}

export type LocalCheck = { label: string; ok: boolean; value: string };

export type RepairActionKind = "title" | "keyword" | "wording" | "structure" | "export" | "evidence";

export type RepairAction = {
  kind: RepairActionKind;
  title: string;
  detail: string;
  preferManual: boolean;
  tokenCost: "none" | "manual-no-token" | "ai-patch";
  items: string[];
};

const REPAIR_ACTION_COPY: Record<RepairActionKind, Omit<RepairAction, "items">> = {
  title: {
    kind: "title",
    title: "Title only fix",
    detail: "Only the visible target title needs adjustment. Prefer editing the title in CV Studio instead of patching the whole CV.",
    preferManual: true,
    tokenCost: "none"
  },
  keyword: {
    kind: "keyword",
    title: "Keyword placement fix",
    detail: "Add only the supported missing keywords to summary, skills, or relevant bullets. Do not rewrite sections that already passed.",
    preferManual: false,
    tokenCost: "ai-patch"
  },
  wording: {
    kind: "wording",
    title: "Wording cleanup fix",
    detail: "Remove internal terms, risky claims, or work-log wording while preserving already-good bullets.",
    preferManual: false,
    tokenCost: "ai-patch"
  },
  structure: {
    kind: "structure",
    title: "Structure / content focus fix",
    detail: "Tighten section order, first subsection, bullet count, or manager-facing story. Patch only the affected section.",
    preferManual: false,
    tokenCost: "ai-patch"
  },
  evidence: {
    kind: "evidence",
    title: "Evidence traceability fix",
    detail: "Connect visible bullets to selected evidence or downgrade claims that are weakly supported.",
    preferManual: false,
    tokenCost: "ai-patch"
  },
  export: {
    kind: "export",
    title: "ATS / export readiness fix",
    detail: "Fix contact, text length, section order, or PDF/ATS readability issues before export.",
    preferManual: true,
    tokenCost: "manual-no-token"
  }
};

export function repairKindForItem(item: string): RepairActionKind {
  if (/title alignment|visible target title|target title/i.test(item)) return "title";
  if (/keyword|must-have|ats exact|supported keyword/i.test(item)) return "keyword";
  if (/internal|blocked|forbidden|risky|work-log|external wording|raw evidence|source\/proof|claim|wording|readability/i.test(item)) return "wording";
  if (/evidence|traceability|weak|unsupported|mapping|selected evidence/i.test(item)) return "evidence";
  if (/ats|pdf|export|contact|text layer|section order|visible work depth|readable/i.test(item)) return "export";
  if (/subsection|bullet|manager|role emphasis|30-second|structure|current role|first work|summary/i.test(item)) return "structure";
  return "structure";
}

export function isBlockingRepairItem(item: string) {
  return repairKindForItem(item) !== "title";
}

export function classifyRepairActions(items: string[]): RepairAction[] {
  const grouped = new Map<RepairActionKind, string[]>();
  for (const item of items.filter(Boolean)) {
    const kind = repairKindForItem(item);
    grouped.set(kind, [...(grouped.get(kind) || []), item]);
  }
  const order: RepairActionKind[] = ["title", "keyword", "wording", "evidence", "structure", "export"];
  return order
    .filter((kind) => grouped.has(kind))
    .map((kind) => ({
      ...REPAIR_ACTION_COPY[kind],
      items: grouped.get(kind) || []
    }));
}

export function tokenCostLabel(action: RepairAction) {
  if (action.tokenCost === "none") return "No token - local fix";
  if (action.tokenCost === "manual-no-token") return "Manual edit - no token";
  return "Uses AI tokens";
}

function reviewerIssueId(category: ReviewerIssue["category"], title: string, index: number) {
  const slug = `${category}-${title}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 58);
  return `review-${index + 1}-${slug || "issue"}`;
}

function severityRank(severity: ReviewerSeverity) {
  if (severity === "Critical") return 5;
  if (severity === "High") return 4;
  if (severity === "Medium") return 3;
  if (severity === "Low") return 2;
  return 1;
}

function buildStructuredReviewerResult(input: {
  job: JobApplication;
  cv: CvVersion;
  visibleUnsupportedClaims: string[];
  supportedMissingKeywords: string[];
  weakMappings: NonNullable<ScreeningAnalysis["jdEvidenceMapping"]>;
  highRiskGaps: NonNullable<ScreeningAnalysis["remainingGaps"]>;
  bulletEvidenceCount: number;
  bulletCount: number;
  managerSummaryRewriteNeeded: boolean;
  actionOrientedBullets: number;
  contentAuditCount: number;
  externalLanguageOk: boolean;
}): ReviewerStructuredResult {
  const { job, cv } = input;
  const tailoredCv = tailoredCvFromVersion(cv);
  const positioningReport = job.screeningAnalysis?.positioningReport || tailoredCv?.positioningReport;
  const issues: ReviewerIssue[] = [];
  const addIssue = (issue: Omit<ReviewerIssue, "id">) => {
    issues.push({ ...issue, id: reviewerIssueId(issue.category, issue.title, issues.length) });
  };

  input.visibleUnsupportedClaims.forEach((claim) => addIssue({
    category: "Unsupported Claim",
    severity: "Critical",
    title: "Unsupported visible claim",
    description: `Visible CV text claims or implies unsupported requirement: ${claim}.`,
    visibleLocation: { section: "workExperience", quote: claim },
    evidence: {
      evidenceIds: [],
      screeningAnalysisPath: "screeningAnalysis.jdEvidenceMapping|remainingGaps",
      positioningReportPath: "positioningReport.unsupportedClaimsPrevented",
      reason: "Visible wording exceeds ScreeningAnalysis / Positioning Report support boundaries."
    },
    repairability: "targeted-repair",
    suggestedRepairIntent: "Remove or downgrade the unsupported visible claim without adding new unsupported wording.",
    expectedRepairBoundary: ["summary", "workExperience", "sidebar.skills"],
    exportSignal: "block"
  }));

  if (input.bulletEvidenceCount < Math.min(6, Math.max(3, input.bulletCount))) {
    addIssue({
      category: "Evidence Missing",
      severity: "High",
      title: "Visible bullet evidence traceability is incomplete",
      description: `${input.bulletEvidenceCount}/${input.bulletCount} visible bullet(s) cite valid evidence card IDs.`,
      evidence: {
        evidenceIds: [],
        cvBriefPath: "cv.generationContext.evidencePriorityIds",
        reason: "Reviewer can validate truthfulness only when visible claims retain evidence traceability."
      },
      repairability: "targeted-repair",
      suggestedRepairIntent: "Attach valid selected evidence IDs to supported bullets or remove/downgrade unsupported bullets.",
      expectedRepairBoundary: ["workExperience"],
      exportSignal: "block"
    });
  }

  if (input.supportedMissingKeywords.length) {
    addIssue({
      category: "Keyword Coverage",
      severity: "Medium",
      title: "Evidence-supported keywords are under-placed",
      description: `Supported keyword gap(s): ${input.supportedMissingKeywords.slice(0, 8).join(", ")}.`,
      evidence: {
        evidenceIds: [],
        screeningAnalysisPath: "screeningAnalysis.mustHaveKeywords",
        cvBriefPath: "cvBrief.skillsToForeground|bulletPlan",
        reason: "These keywords are evidence-supported and may be placed without exceeding ADR-004 boundaries."
      },
      repairability: "targeted-repair",
      suggestedRepairIntent: "Add only evidence-supported keywords to summary, skills, or relevant bullets.",
      expectedRepairBoundary: ["summary", "sidebar.skills", "workExperience"],
      exportSignal: "warn"
    });
  }

  const reportGapEvidenceIds = new Set((positioningReport?.truthfulCapabilityGaps || [])
    .flatMap((gap) => (positioningReport?.transferableStrengths || [])
      .filter((strength) => strength.strength.includes(gap.requirement))
      .flatMap((strength) => strength.evidenceIds)));
  const capabilityGapCount = (positioningReport?.truthfulCapabilityGaps?.length || 0)
    || input.weakMappings.length + input.highRiskGaps.length;
  if (capabilityGapCount) {
    addIssue({
      category: "Capability Gap",
      severity: input.highRiskGaps.length ? "Medium" : "Informational",
      title: "Truthful capability gap",
      description: `${capabilityGapCount} capability gap(s) are tracked as fit/readiness risk, not unsupported visible claims.`,
      evidence: {
        evidenceIds: [...reportGapEvidenceIds],
        screeningAnalysisPath: "screeningAnalysis.jdEvidenceMapping|remainingGaps",
        positioningReportPath: "positioningReport.truthfulCapabilityGaps",
        reason: "Capability gaps come from upstream Analysis / Positioning Report and are not recomputed by Reviewer."
      },
      repairability: "not-repairable",
      suggestedRepairIntent: "Do not rewrite as a solved strength. Add new evidence or change target positioning upstream if needed.",
      expectedRepairBoundary: [],
      exportSignal: "warn"
    });
  }

  if (input.managerSummaryRewriteNeeded) {
    addIssue({
      category: "External Wording",
      severity: "Medium",
      title: "Summary or manager-scan wording needs improvement",
      description: "Summary review indicates wording should better express supported role relevance.",
      visibleLocation: { section: "summary" },
      evidence: {
        evidenceIds: [],
        screeningAnalysisPath: "screeningAnalysis.managerIntent|summaryAngle",
        positioningReportPath: "positioningReport.recommendedPositioning",
        reason: "This is wording quality against upstream positioning, not a new positioning decision."
      },
      repairability: "targeted-repair",
      suggestedRepairIntent: "Improve summary wording within existing Analysis and Positioning Report boundaries.",
      expectedRepairBoundary: ["summary"],
      exportSignal: "warn"
    });
  }

  if (input.bulletCount > 0 && input.actionOrientedBullets / Math.max(input.bulletCount, 1) < 0.65) {
    addIssue({
      category: "External Wording",
      severity: "Medium",
      title: "Action/outcome bullet strength is low",
      description: `${input.actionOrientedBullets}/${input.bulletCount} visible bullet(s) are action-oriented.`,
      visibleLocation: { section: "workExperience" },
      evidence: {
        evidenceIds: [],
        reason: "Bullets can be made more recruiter-readable without changing claim strength."
      },
      repairability: "targeted-repair",
      suggestedRepairIntent: "Rewrite bullets into action + scope + business outcome while preserving evidence IDs.",
      expectedRepairBoundary: ["workExperience"],
      exportSignal: "warn"
    });
  }

  if (input.contentAuditCount || !input.externalLanguageOk) {
    addIssue({
      category: "External Wording",
      severity: "Medium",
      title: "Internal or work-log wording remains",
      description: input.contentAuditCount ? `${input.contentAuditCount} work-log bullet(s) detected.` : "Internal proof/review language remains visible.",
      visibleLocation: { section: "workExperience" },
      evidence: {
        evidenceIds: [],
        reason: "Visible wording should be external recruiter language."
      },
      repairability: "targeted-repair",
      suggestedRepairIntent: "Translate internal/work-log wording into external resume language without changing meaning.",
      expectedRepairBoundary: ["summary", "workExperience"],
      exportSignal: "warn"
    });
  }

  const header = tailoredCv?.header;
  const missingProfileFields = [
    header?.name?.trim() ? "" : "name",
    /@/.test(header?.email || "") ? "" : "email",
    header?.location?.trim() ? "" : "location"
  ].filter(Boolean);
  if (missingProfileFields.length) {
    addIssue({
      category: "Profile Completeness",
      severity: "High",
      title: "Trusted profile contact data is incomplete",
      description: `Missing trusted profile field(s): ${missingProfileFields.join(", ")}.`,
      visibleLocation: { section: "header" },
      evidence: {
        evidenceIds: [],
        reason: "Profile/contact data must come from trusted user/profile input and must not be invented by Reviewer or Writer."
      },
      repairability: "human-input",
      suggestedRepairIntent: "Collect trusted contact data from the user or profile source.",
      expectedRepairBoundary: ["header.contact"],
      exportSignal: "block"
    });
  }

  const unsupportedClaimCount = issues.filter((issue) => issue.category === "Unsupported Claim").length;
  const policyViolationCount = issues.filter((issue) => issue.category === "Policy Violation").length;
  const evidenceMissingCount = issues.filter((issue) => issue.category === "Evidence Missing").length;
  const repairableIssueCount = issues.filter((issue) => issue.repairability !== "not-repairable").length;
  const exportBlockingIssues = issues.filter((issue) => issue.exportSignal === "block");
  const exportWarnings = issues.filter((issue) => issue.exportSignal === "warn");
  const truthfulnessStatus = policyViolationCount
    ? "policy-violation"
    : unsupportedClaimCount
      ? "unsupported-claims"
      : !tailoredCv
        ? "unreviewable"
        : "truthful";
  const failsTruthfulness = issues.some((issue) =>
    (issue.category === "Unsupported Claim" || issue.category === "Evidence Missing" || issue.category === "Policy Violation")
    && severityRank(issue.severity) >= severityRank("High")
  );
  const status = failsTruthfulness
    ? "FAIL"
    : issues.some((issue) => issue.category !== "Profile Completeness")
      ? "WARNING"
      : "PASS";
  const reviewedCvContentHash = reviewSnapshotContentHash(cv);

  return {
    status,
    truthfulnessStatus,
    reviewedCvVersionId: cv.id,
    reviewedCvContentHash,
    reviewedAt: new Date().toISOString(),
    positioningAuthority: "ScreeningAnalysis",
    positioningReportMode: "read-only-derived-view",
    issues,
    summary: {
      unsupportedClaimCount,
      capabilityGapCount: issues.filter((issue) => issue.category === "Capability Gap").length,
      evidenceMissingCount,
      repairableIssueCount,
      exportBlockingIssueCount: exportBlockingIssues.length
    },
    repairContract: {
      issues: issues.filter((issue) => issue.repairability !== "not-repairable")
    },
    exportRecommendationInput: {
      reviewStatus: status,
      exportBlockingIssues: exportBlockingIssues.map((issue) => ({
        issueId: issue.id,
        category: issue.category,
        severity: issue.severity,
        reason: issue.description
      })),
      exportWarnings: exportWarnings.map((issue) => ({
        issueId: issue.id,
        category: issue.category,
        severity: issue.severity,
        reason: issue.description
      })),
      truthfulness: {
        unsupportedClaimCount,
        policyViolationCount,
        capabilityGapCount: issues.filter((issue) => issue.category === "Capability Gap").length
      },
      documentReadiness: {
        formattingIssueCount: issues.filter((issue) => issue.category === "Formatting").length,
        profileCompletenessIssueCount: issues.filter((issue) => issue.category === "Profile Completeness").length,
        externalWordingIssueCount: issues.filter((issue) => issue.category === "External Wording").length
      }
    }
  };
}

export function reviewerPass(
  job: JobApplication,
  cv: CvVersion | undefined,
  gate: ScreeningGateResult | null,
  managerReview: ReturnType<typeof hiringManagerReview>,
  evidenceCards: AppData["evidenceCards"] = []
) {
  const tailoredCv = tailoredCvFromVersion(cv);
  if (!tailoredCv || !cv) return null;
  const analysis = job.screeningAnalysis;
  const bullets = tailoredCv.workExperience.flatMap((experience) =>
    experience.subsections.flatMap((section) => section.bullets)
  );
  const validEvidenceIds = new Set(evidenceCards.map((item) => item.id));
  const bulletEvidenceCount = bullets.filter((bullet) => (bullet.evidenceIds || []).some((id) => validEvidenceIds.has(id))).length;
  const visibleText = [
    tailoredCv.header.targetRole,
    tailoredCv.summary,
    ...tailoredCv.sidebar.skillGroups.flatMap((group) => [...group.highlightedSkills, ...group.otherSkills]),
    ...tailoredCv.workExperience.flatMap((experience) =>
      experience.subsections.flatMap((section) => [section.title, ...section.bullets.map((bullet) => bullet.text)])
    )
  ].join(" ");
  const unsupportedMappings = (analysis?.jdEvidenceMapping || []).filter((item) => item.supportLevel === "Unsupported");
  const weakMappings = (analysis?.jdEvidenceMapping || []).filter((item) => item.supportLevel === "Weak");
  const highRiskGaps = (analysis?.remainingGaps || []).filter((item) => item.riskLevel === "High");
  const visibleUnsupportedClaims = Array.from(new Set([
    ...visibleUnsupportedMappingClaims(visibleText.toLowerCase(), unsupportedMappings),
    ...visibleHighRiskGapClaims(visibleText.toLowerCase(), highRiskGaps)
  ]));
  const actionOutcomePattern = /built|created|developed|automated|supported|maintained|troubleshot|improved|reduced|enabled|centralized|documented|trained|coordinated|implemented|validated|translated|delivered/i;
  const actionOrientedBullets = bullets.filter((bullet) => actionOutcomePattern.test(`${bullet.text} ${bullet.metric || ""}`)).length;
  const contentAudit = cvContentAudit(tailoredCv);
  const managerSummaryReview = managerReview?.summaryReview;
  const managerSummaryRewriteNeeded = managerSummaryReview
    ? managerSummaryReview.summaryRewriteNeeded
    : Boolean(managerReview && (managerReview.wouldInterview === "No" || managerReview.rewriteRequired.length > 0));
  const checks: LocalCheck[] = [
    { label: "Reviewer: HR scan", ok: Boolean(tailoredCv.header.targetRole && tailoredCv.summary && gate && gate.supportedMissingKeywords.length === 0), value: gate ? `${gate.coveredKeywords.length} covered keyword(s), ${gate.supportedMissingKeywords.length} supported keyword gap(s)` : "Gate not available" },
    { label: "Reviewer: hiring manager relevance", ok: Boolean(managerReview && !managerSummaryRewriteNeeded), value: managerReview ? managerSummaryReview ? managerSummaryReview.summaryRewriteNeeded ? `Summary criteria failed: ${managerSummaryReview.criteria.filter((item) => item.status === "fail" && item.fixability === "summary-rewrite").map((item) => item.criterionId).join(", ")}` : managerSummaryReview.fitRiskOnly ? "Summary quality passed; remaining concern is application-fit risk" : "Summary quality criteria passed" : `Would interview: ${managerReview.wouldInterview} · ${managerReview.rewriteRequired.length} rewrite item(s)` : "Manager review not available" },
    { label: "Reviewer: evidence traceability", ok: bulletEvidenceCount >= Math.min(6, Math.max(3, bullets.length)), value: `${bulletEvidenceCount}/${bullets.length} visible bullet(s) cite valid evidence card IDs` },
    { label: "Reviewer: unsupported claims", ok: visibleUnsupportedClaims.length === 0, value: visibleUnsupportedClaims.length ? `${visibleUnsupportedClaims.length} unsupported visible claim(s)` : "No unsupported JD gaps claimed visibly" },
    { label: "Reviewer: application fit risk", ok: true, value: `${unsupportedMappings.length} unsupported mapping(s), ${highRiskGaps.length} high-risk gap(s) tracked as fit risk` },
    { label: "Reviewer: weak claims controlled", ok: weakMappings.length <= 2, value: `${weakMappings.length} weak mapping(s)` },
    { label: "Reviewer: action/outcome bullets", ok: bullets.length > 0 && actionOrientedBullets / Math.max(bullets.length, 1) >= 0.65, value: `${actionOrientedBullets}/${bullets.length} action-oriented bullet(s)` },
    { label: "Reviewer: external wording", ok: contentAudit.length === 0 && !/evidence card|source file|grounded in uploaded|review note|claim boundary/i.test(visibleText), value: contentAudit.length ? `${contentAudit.length} work-log bullet(s)` : "No raw evidence language detected" }
  ];
  const blockers = checks.filter((check) => !check.ok).map((check) => `${check.label}: ${check.value}`);
  const structuredResult = buildStructuredReviewerResult({
    job,
    cv,
    visibleUnsupportedClaims,
    supportedMissingKeywords: gate?.supportedMissingKeywords || [],
    weakMappings,
    highRiskGaps,
    bulletEvidenceCount,
    bulletCount: bullets.length,
    managerSummaryRewriteNeeded,
    actionOrientedBullets,
    contentAuditCount: contentAudit.length,
    externalLanguageOk: contentAudit.length === 0 && !/evidence card|source file|grounded in uploaded|review note|claim boundary/i.test(visibleText)
  });
  return {
    ready: blockers.length === 0,
    blockers,
    checks,
    structuredResult,
    recommendation: blockers.length
      ? "Patch the current CV before export. Do not create another broad draft unless the positioning is wrong."
      : "Reviewer pass is clean. Continue to ATS/PDF verification before export."
  };
}

export function exportVerification(job: JobApplication, cv: CvVersion | undefined, gate: ScreeningGateResult | null) {
  const tailoredCv = tailoredCvFromVersion(cv);
  if (!tailoredCv) return null;
  const sections = tailoredCvToSections(tailoredCv);
  const extractedText = [
    sections.header,
    sections.summary,
    sections.skills,
    sections.workExperience,
    sections.education,
    sections.certifications,
    sections.languages
  ].join("\n");
  const workBullets = tailoredCv.workExperience.flatMap((experience) =>
    experience.subsections.flatMap((section) => section.bullets.map((bullet) => bullet.text))
  );
  const hasContactName = Boolean(tailoredCv.header.name.trim());
  const hasContactEmail = /@/.test(tailoredCv.header.email.trim());
  const hasContactLocation = Boolean(tailoredCv.header.location.trim());
  const hasContact = hasContactName && hasContactEmail && hasContactLocation;
  const hasReadableOrder = extractedText.indexOf(tailoredCv.summary) > -1 && extractedText.indexOf(tailoredCv.summary) < extractedText.indexOf(tailoredCv.workExperience[0]?.company || "");
  const noHtmlLeak = !/<[a-z][\s\S]*>/i.test(extractedText);
  const textLayerReadable = extractedText.replace(/\s+/g, " ").trim().length >= 1200 && noHtmlLeak && !extractedText.includes("�");
  const checks: LocalCheck[] = [
    { label: "ATS text layer", ok: textLayerReadable, value: `${extractedText.length.toLocaleString()} extracted character(s)` },
    { label: "Contact extraction", ok: hasContact, value: hasContact ? `${tailoredCv.header.name} · ${tailoredCv.header.email} · ${tailoredCv.header.location}` : "Missing name, email, or location" },
    { label: "Contact email", ok: hasContactEmail, value: hasContactEmail ? tailoredCv.header.email : "Missing email" },
    { label: "Section order", ok: hasReadableOrder, value: hasReadableOrder ? "Header, summary, skills, and work history are in readable order" : "Check text extraction order before export" },
    { label: "ATS keyword support", ok: Boolean(gate && gate.supportedMissingKeywords.length === 0), value: gate ? `${gate.coveredKeywords.length} covered; ${gate.supportedMissingKeywords.length} supported gap(s)` : "Run Screening Gate first" },
    { label: "Visible work depth", ok: tailoredCv.workExperience.length >= 2 && workBullets.length >= 8, value: `${tailoredCv.workExperience.length} role block(s), ${workBullets.length} work bullet(s)` },
    { label: "PDF export readiness", ok: Boolean(cv?.content && cv.content.length > 1000), value: cv?.content && cv.content.length > 1000 ? "CV version has composed export content" : "Composed CV content is missing or too short" }
  ];
  const blockers = checks.filter((check) => !check.ok).map((check) => `${check.label}: ${check.value}`);
  return {
    ready: blockers.length === 0,
    blockers,
    checks,
    recommendation: blockers.length
      ? "Fix text extraction or missing content before exporting. ATS verification is not clean yet."
      : "Export gate is clean. This CV is ready for PDF/export workflow."
  };
}

export function createReviewSnapshot(job: JobApplication, cv: CvVersion, evidenceCards: AppData["evidenceCards"]): NonNullable<CvVersion["reviewSnapshot"]> {
  const gate = screeningGate(job, cv, evidenceCards);
  const manager = hiringManagerReview(job, cv, gate, evidenceCards);
  const reviewer = reviewerPass(job, cv, gate, manager, evidenceCards);
  const exportCheck = exportVerification(job, cv, gate);
  const gateIssueCount = gate.fixNext.filter(isBlockingRepairItem).length;
  const reviewerIssueCount = (reviewer?.blockers.length || 0) + (exportCheck?.blockers.length || 0);
  const completedAt = new Date().toISOString();
  const currentContentHash = reviewSnapshotContentHash(cv);
  const snapshotId = `review-${contentHash({ cvId: cv.id, completedAt, currentContentHash })}`;
  return {
    snapshotId,
    reviewRunId: snapshotId,
    updatedAt: completedAt,
    contentHash: currentContentHash,
    reviewedCvVersionId: cv.id,
    reviewedCvContentHash: currentContentHash,
    reviewedSummaryHash: contentHash(cv.tailoredCv?.summary || cv.sections?.summary || cv.summary || ""),
    freshnessStatus: "fresh",
    cvUpdatedAt: cv.updatedAt,
    completedAt,
    gateIssueCount,
    reviewerIssueCount,
    ready: Boolean(reviewer?.ready && exportCheck?.ready && gateIssueCount === 0),
    summaryQualityContract: manager?.summaryQualityContract,
    summaryReviewResult: manager?.summaryReview,
    structuredReviewResult: reviewer?.structuredResult
  };
}
