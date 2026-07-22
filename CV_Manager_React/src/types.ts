export type ApplicationStatus =
  | "New"
  | "Parsed"
  | "Evidence Needed"
  | "Ready to Tailor"
  | "CV Drafted"
  | "Reviewed"
  | "Applied"
  | "Follow-up Needed"
  | "Archived";

export type FitLevel = "High" | "Medium" | "Low" | "Unknown";

export type SourceParsedSnapshot = {
  sourceId: string;
  sourceTitle: string;
  sourceKind: RawSource["kind"];
  sourceContentHash: string;
  parsedAt: string;
  summary: string;
  identityFacts: string[];
  workExperiences: {
    company: string;
    role: string;
    period: string;
    location: string;
    projects: {
      name: string;
      period: string;
      category: string;
      tools: string[];
      summary: string;
      metrics: string[];
      stakeholders: string[];
      systemsOrData: string[];
      risksOrCompliance: string[];
      evidenceSeeds: string[];
      starSeeds: string[];
    }[];
  }[];
  skills: string[];
  domainSignals: string[];
  education: string[];
  certifications: string[];
  claimBoundaries: string[];
};

export type RawSource = {
  id: string;
  kind: "Original CV" | "Project Notes" | "HTML" | "Markdown" | "Achievement Notes" | "Market JD Reference";
  title: string;
  content: string;
  parsedSnapshot?: SourceParsedSnapshot;
  updatedAt: string;
};

export type SourceOfTruth = {
  identity: string;
  targetRoles: string;
  positioning: string;
  workHistory: string;
  tools: string;
  metrics: string;
  claimBoundaries: string;
};

export type SkillGroup = {
  id: string;
  name: string;
  skills: string[];
};

export type EducationItem = {
  id: string;
  school: string;
  degree: string;
  period: string;
  notes: string;
};

export type CertificationItem = {
  id: string;
  name: string;
  issuer: string;
  year: string;
};

export type ProjectItem = {
  id: string;
  name: string;
  period: string;
  category: string;
  tools: string[];
  summary: string;
  metrics: string;
  sourceIds: string[];
};

export type WorkExperienceItem = {
  id: string;
  company: string;
  role: string;
  period: string;
  location: string;
  scope: string;
  projects: ProjectItem[];
};

export type CareerProfile = {
  identity: string;
  contact?: {
    name: string;
    email: string;
    location: string;
    phone?: string;
    linkedIn?: string;
    portfolio?: string;
  };
  targetRoles: string[];
  positioning: string;
  education: EducationItem[];
  certifications: CertificationItem[];
  skillGroups: SkillGroup[];
  workExperiences: WorkExperienceItem[];
  claimBoundaries: string;
};

export type SkillInference = {
  id: string;
  group: string;
  skill: string;
  strength: "Strong" | "Moderate" | "Mentioned";
  usageContext: "owned" | "built" | "integrated" | "governed" | "tested" | "maintained" | "used" | "mentioned";
  evidenceSummary: string;
  cvWording: string;
  experienceId?: string;
  projectId?: string;
  sourceIds: string[];
  confidence: "Grounded" | "Needs Review" | "Weak";
};

export type DomainKnowledge = {
  id: string;
  domain: string;
  businessProcess: string;
  stakeholders: string[];
  systemsOrData: string[];
  riskOrCompliance: string;
  metricsOrKpis: string[];
  proof: string;
  cvWording: string;
  experienceId?: string;
  projectId?: string;
  sourceIds: string[];
  confidence: "Grounded" | "Needs Review" | "Weak";
};

export type EvidenceCard = {
  id: string;
  title: string;
  category: string;
  internalName?: string;
  datePeriod?: string;
  candidateRole?: string;
  externalFriendlyDescription?: string;
  audience?: string;
  businessFunction?: string;
  problemContext?: string;
  actionTaken?: string;
  stakeholders?: string[];
  quantifiedEvidence?: string;
  evidenceStrength?: "Strong" | "Medium" | "Weak";
  relatedJdKeywords?: string[];
  canBeUsedInCv?: "Yes" | "No";
  canBeUsedInInterview?: "Yes" | "No";
  confidentialityRisk?: string;
  cvAngle?: string;
  notes?: string;
  sectionTitle?: string;
  tools: string[];
  proof: string;
  cvBullet?: string;
  cvSafeBullet?: string;
  interviewTalkingPoint?: string;
  riskIfUsedWrongly?: string;
  claimLevel?: "Direct Claim" | "Conservative Claim" | "Interview Only" | "Do Not Claim";
  allowedVisibleClaims?: string[];
  forbiddenVisibleClaims?: string[];
  visibilityUse?: "CV Visible" | "Interview Only" | "Prompt Context Only" | "Do Not Use";
  bestRoleTypes?: string[];
  avoidRoleTypes?: string[];
  blockedVisibleTerms?: string[];
  metrics: string;
  sourceIds: string[];
  experienceId?: string;
  projectId?: string;
  confidence: "Grounded" | "Needs Review" | "Weak";
  evidenceTier?: "Core" | "Supporting" | "Archive";
};

export type StarStory = {
  id: string;
  title: string;
  tags: string[];
  sectionTitle?: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  cvBullets?: string[];
  evidenceIds: string[];
  experienceId?: string;
  projectId?: string;
  storyConfidence?: "Strong" | "Usable" | "Needs Review";
};

export type BackboneRunMode =
  | "source_of_truth_only"
  | "skills_only"
  | "domain_only"
  | "evidence_only"
  | "star_only"
  | "high_compensation_only"
  | "update_merge"
  | "full_inventory";

export type BackboneMetadata = {
  runMode: BackboneRunMode | "";
  partialOutput: boolean;
  nextRecommendedRunMode: BackboneRunMode | "";
  outputScope: string;
  warnings: string[];
  profileSourceHashes?: Record<string, string>;
  profileSyncedAt?: string;
};

export type BackboneUpdateSummary = {
  mode: "new_build" | "update_merge" | "";
  addedItems: string[];
  modifiedItems: string[];
  unchangedItems: string[];
  possibleDuplicates: string[];
  conflicts: string[];
  needsReview: string[];
  idChanges: string[];
};

export type BackboneProjectTask = {
  id: string;
  experienceId: string;
  projectId: string;
  label: string;
  inputHash: string;
  promptVersion: string;
  status: "Pending" | "Applied" | "Needs Review";
  estimatedInputTokens: number;
  appliedAt?: string;
  counts?: { skills: number; domain: number; evidence: number; star: number };
  reviewItems?: string[];
};

export type HighCompensationSignal = {
  id: string;
  signalType: "Enterprise Scope" | "Production Ownership" | "AI/Data Architecture" | "Governance/Risk" | "Executive Decision Support" | "Automation Impact" | "Cross-Region Influence" | "Platform Ownership" | "Cost/License Impact" | "Security/Permission Boundary";
  strength: "High" | "Medium" | "Low";
  whyItMattersToRecruiters: string;
  bestTargetRoles: string[];
  supportingEvidenceIds: string[];
  supportingProjectIds: string[];
  supportingSkillIds: string[];
  cvPositioning: string;
  interviewPositioning: string;
  salaryNegotiationUse: string;
  confidence: "Grounded" | "Needs Review" | "Weak";
};

export type JDAdditionalAttribute = {
  label: string;
  value: string | string[];
  sourcePath?: string;
};

export type EmployerInsights = {
  topSkills: string[];
  previouslyWorkedAs: string[];
};

export type ParsedJD = {
  company: string;
  role: string;
  location: string;
  jobNumber?: string;
  datePosted?: string;
  employmentType?: string;
  seniority?: string;
  overview?: string;
  workSite?: string;
  travel?: string;
  profession?: string;
  discipline?: string;
  roleType?: string;
  responsibilities?: string[];
  requirements: string[];
  preferredQualifications?: string[];
  skills?: string[];
  keywords: string[];
  compensation?: string;
  applicationWindow?: string;
  additionalAttributes?: JDAdditionalAttribute[];
  employerInsights?: EmployerInsights;
  employerSignal: string;
  risks: string[];
  fitNotes?: string;
  sourceUrl?: string;
};

export type JdImportProvenance = {
  sourceType: "manual" | "url";
  sourceUrl?: string;
  finalUrl?: string;
  sourceDomain?: string;
  fetchedAt?: string;
  extractionMethod?: string;
  fetchWarnings?: string[];
  redirectCount?: number;
  extractionCoverage?: "FULL" | "PARTIAL" | "MANUAL_FALLBACK_REQUIRED";
};

export type ScreeningAnalysisAIOutput = import("./domain/screeningAnalysisSchema").ScreeningAnalysisAIOutput;
type ScreeningAIPositioning = ScreeningAnalysisAIOutput["candidatePositioning"];
type ScreeningAIMapping = ScreeningAnalysisAIOutput["requirementMatrix"][number];

export type ScreeningAnalysis = Omit<Partial<ScreeningAnalysisAIOutput>, "jdBreakdown" | "positioning" | "jdEvidenceMapping"> &
  Pick<ScreeningAnalysisAIOutput, "primaryTargetTitle" | "mustHaveKeywords" | "missingKeywords" | "riskyClaims" | "summaryAngle"> & {
    jdBreakdown?: ScreeningAnalysisAIOutput["jdBreakdown"] & {
      mustHaveRequirements?: string[];
      strongAdvantageRequirements?: string[];
      niceToHaveRequirements?: string[];
    };
    positioning?: ScreeningAIPositioning & {
      roleType: "Other";
      aiMarketArchetype?: string;
      applyTier: "Strong" | "Good" | "Stretch" | "Avoid";
    };
    jdEvidenceMapping?: (ScreeningAIMapping & {
      safeCvAngle: string;
      gapOrRisk: string;
      supportLevel: "Strong" | "Partial" | "Weak" | "Unsupported";
    })[];
    remainingGaps?: { gap: string; riskLevel: "High" | "Medium" | "Low"; mitigation: string }[];
    recommendedSkillIds?: string[];
    recommendedDomainKnowledgeIds?: string[];
    recommendedEvidenceIds?: string[];
    recommendedStoryIds?: string[];
    positioningReport?: PositioningReport;
  };

export type PositioningOverallFit = "Good" | "Risky" | "Weak";

export type PositioningTreatment =
  | "state-directly"
  | "position-as-transferable"
  | "soften"
  | "interview-only"
  | "omit";

export type FitClassification =
  | "STRONG_FIT"
  | "VIABLE_MEDIUM_FIT"
  | "STRETCH_MEDIUM_FIT"
  | "LOW_FIT"
  | "HARD_BLOCK";

export type RequirementImportance =
  | "CORE_RESPONSIBILITY"
  | "REQUIRED_CAPABILITY"
  | "PREFERRED_CAPABILITY"
  | "FORMAL_REQUIREMENT"
  | "SUPPLEMENTAL_SIGNAL";

export type RequirementMatchStatus =
  | "DIRECT_MATCH"
  | "TRANSFERABLE_MATCH"
  | "PARTIAL_MATCH"
  | "LEARNABLE_GAP"
  | "CORE_CAPABILITY_GAP"
  | "FORMAL_SCREENING_RISK";

export type RequirementCvUsage =
  | "PRIORITIZE"
  | "SUPPORTING"
  | "CONSERVATIVE_POSITIONING"
  | "DO_NOT_CLAIM"
  | "FORBIDDEN";

export type RequirementInterviewUsage =
  | "LEAD_STORY"
  | "SUPPORTING_STORY"
  | "EXPLAIN_TRANSFER"
  | "DISCLOSE_GAP"
  | "DO_NOT_USE";

export type RequirementMatch = {
  requirementId: string;
  requirementText: string;
  normalizedRequirement: string;
  importance: RequirementImportance;
  matchStatus: RequirementMatchStatus;
  evidenceIds: string[];
  sourceIds: string[];
  supportedAspects: string[];
  unsupportedAspects: string[];
  transferContext: string;
  explanation: string;
  confidence: "High" | "Medium" | "Low";
  cvUsage: RequirementCvUsage;
  interviewUsage: RequirementInterviewUsage;
  hardBlock: boolean;
};

export type FitDimensions = {
  currentCapabilityFit: number;
  directEvidenceFit: number;
  transferability: number;
  rampUpFeasibility: number;
  screeningRisk: number;
  applicationViability: number;
  applicationPriority: "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW" | "NONE";
  generationRecommendation: "GENERATE_PRIORITY_CV" | "GENERATE_TRANSFER_CV" | "GENERATE_ONLY_WITH_WARNING" | "DO_NOT_PRIORITIZE_GENERATION";
  manualOverrideAllowed: boolean;
  relativeRank: number;
};

export type MediumFitOpportunityAnalysis = {
  whyCandidateCouldWin: string[];
  differentiatedStrengths: string[];
  credibleTransferableStrengths: string[];
  learnableGaps: string[];
  coreRisks: string[];
  recruiterScreeningRisk: string[];
  cvPositioning: string;
  interviewPositioning: string[];
  applicationStrategy: string;
  recommendedPreparation: string[];
};

export type LowFitAnalysis = {
  credibleOverlaps: string[];
  whyCoreFitIsLow: string[];
  coreUnbridgeableShortTermGaps: string[];
  futureTransitionPath: string[];
  betterAdjacentRoles: string[];
  recommendedPreparation: string[];
  manualOverrideAllowed: boolean;
};

export type PositioningReport = {
  fitClassification?: FitClassification;
  fitDimensions?: FitDimensions;
  requirementMatchMatrix?: RequirementMatch[];
  opportunityAnalysis?: MediumFitOpportunityAnalysis;
  lowFitAnalysis?: LowFitAnalysis;
  overallFit: PositioningOverallFit;
  transferableStrengths: {
    strength: string;
    evidenceIds: string[];
    supportLevel: "Strong" | "Partial" | "Weak";
    cvTreatment: PositioningTreatment;
  }[];
  truthfulCapabilityGaps: {
    requirement: string;
    reason: string;
    riskLevel: "High" | "Medium" | "Low";
    mitigation: string;
  }[];
  unsupportedClaimsPrevented: {
    claim: string;
    reason: string;
    mustNotClaim: string[];
  }[];
  recommendedPositioning: {
    headline: string;
    summaryAngle: string;
    targetRoleTreatment: "direct-fit" | "adjacent-fit" | "transferable-fit" | "not-recommended";
    wordingGuidance: string[];
  };
  remainingHiringRisks: {
    risk: string;
    impactOnInterviewProbability: string;
    mitigation: string;
  }[];
};

export type CvBriefSellingPoint = {
  title: string;
  managerValue: string;
  evidenceIds: string[];
  skillIds: string[];
  storyIds: string[];
  supportLevel: "Strong" | "Partial" | "Weak";
};

export type CvBriefBulletPlan = {
  sectionTitle: string;
  requirement: string;
  evidenceIds: string[];
  angle: string;
  avoid: string[];
};

export type CvBrief = {
  targetPositioning: string;
  managerHiringProblem: string;
  top3SellingPoints: CvBriefSellingPoint[];
  mustShowEvidenceIds: string[];
  supportingEvidenceIds: string[];
  skillsToForeground: string[];
  skillsToSuppress: string[];
  claimsToAvoid: string[];
  cvHeadline: string;
  summaryAngle: string;
  firstSectionTheme: string;
  bulletPlan: CvBriefBulletPlan[];
  generatedAt: string;
};

export type AutomationRunSummary = {
  status: "idle" | "queued" | "running" | "completed" | "failed" | "cancelled";
  mode?: "generate" | "repair";
  jobId?: string;
  lastRunAt?: string;
  lastCompletedAt?: string;
  lastError?: string;
  inputHash?: string;
  schemaVersion?: string;
  schemaHash?: string;
  promptVersion?: string;
  promptHash?: string;
  estimatedInputTokens?: number;
  applied?: boolean;
};

export type JobApplication = {
  id: string;
  company: string;
  role: string;
  location: string;
  rawJD: string;
  jdContentHash?: string;
  parsed?: ParsedJD;
  jdProvenance?: JdImportProvenance;
  status: ApplicationStatus;
  fit: FitLevel;
  nextAction: string;
  screeningAnalysis?: ScreeningAnalysis;
  screeningAnalysisRun?: AutomationRunSummary;
  screeningCvRun?: AutomationRunSummary;
  fitReview?: {
    employerSignals: string[];
    strongMatches: string[];
    gaps: string[];
    fitReasons?: string[];
    fitBlockers?: string[];
    fitUpgradePath?: string[];
    recommendedSkillIds?: string[];
    recommendedDomainKnowledgeIds?: string[];
    recommendedEvidenceIds?: string[];
    recommendedStoryIds?: string[];
    positioningAdvice: string;
    targetCompensationStrategy?: string;
    recommendedNextAction?: string;
  };
  cvBrief?: CvBrief;
  cvBriefGeneratedAt?: string;
  /** Current Screening Analysis identity explicitly acknowledged by CV Brief apply. */
  cvBriefAnalysisHash?: string;
  recommendationsAppliedAt?: string;
  applicationLog?: {
    appliedAt?: string;
    platform?: string;
    contact?: string;
    followUpDate?: string;
    notes?: string;
    salaryStrategy?: string;
  };
  selectedSkillIds?: string[];
  selectedDomainKnowledgeIds?: string[];
  selectedEvidenceIds: string[];
  selectedStoryIds: string[];
  updatedAt: string;
};

export type PromptTemplate = {
  id: string;
  name: string;
  purpose: string;
  template: string;
};

export type GenerationContext = {
  jdContentHash: string;
  sourceDataHash: string;
  fitReviewHash?: string;
  screeningAnalysisHash?: string;
  cvBriefHash?: string;
  writerContextHash?: string;
  evidencePriorityIds?: string[];
  promptVersion: string;
  generatedAt: string;
  selectedSkillIds: string[];
  selectedDomainKnowledgeIds: string[];
  selectedEvidenceIds: string[];
  selectedStoryIds: string[];
  invalidSelectionIds?: {
    skillIds: string[];
    domainKnowledgeIds: string[];
    evidenceIds: string[];
    storyIds: string[];
  };
};

export type ExportSnapshot = {
  id: string;
  exportedAt: string;
  fileName: string;
  jobId: string;
  versionName: string;
  jdContentHash?: string;
  cvContentHash: string;
  generationContext?: GenerationContext;
  qualityScore?: string;
  applied?: boolean;
};

export type TailoredCv = {
  jdAnalysis?: {
    targetRole: string;
    coreRequirements: string[];
    topKeywords: { keyword: string; priority: "Must-have" | "Important" | "Nice-to-have"; placement: "Summary" | "Skills" | "Work Experience" }[];
    gaps: string[];
  };
  header: {
    name: string;
    targetRole: string;
    email: string;
    location: string;
  };
  sidebar: {
    languages: { name: string; level: string; note: string }[];
    skillGroups: { title: string; highlightedSkills: string[]; otherSkills: string[] }[];
    certifications: string[];
    education: { school: string; degree: string; period: string }[];
  };
  summary: string;
  workExperience: {
    experienceId?: string;
    company: string;
    role: string;
    period: string;
    location: string;
    subsections: {
      title: string;
      bullets: {
        text: string;
        metric?: string;
        metricType?: "Impact" | "Scope" | "Diagnostic" | "Internal Activity" | "None";
        evidenceIds?: string[];
        confidence?: "Grounded" | "Needs Review" | "Weak";
      }[];
    }[];
  }[];
  keywordPlacementNotes?: string[];
  positioningReport?: PositioningReport;
  interviewNotes?: {
    topic: string;
    details: string;
    evidenceIds: string[];
  }[];
  reviewNotes: string[];
};

export type SummaryQualityContract = {
  targetRole: string;
  positioningMode: "direct-fit" | "adjacent-fit" | "transferable-fit" | "not-recommended";
  requiredCriteria: SummaryQualityCriterion[];
  supportedStrengths: SummarySupportItem[];
  unsupportedCoreRequirements: SummaryGapItem[];
  prohibitedClaims: string[];
  wordingConstraints: string[];
  maxLengthWords: number;
};

export type SummaryQualityCriterion = {
  id: string;
  label: string;
  description: string;
  category:
    | "role-identity"
    | "relevant-capability"
    | "business-value"
    | "evidence-grounding"
    | "customer-context"
    | "career-positioning"
    | "clarity";
  importance: "required" | "important" | "optional";
  supportStatus: "supported" | "partial" | "unsupported";
  supportingEvidenceIds: string[];
  allowedTreatment: "state-directly" | "position-as-transferable" | "soften" | "omit";
};

export type SummarySupportItem = {
  evidenceId: string;
  label: string;
  keywords: string[];
  evidenceStrength: string;
};

export type SummaryGapItem = {
  id: string;
  requirement: string;
  reason: string;
};

export type SummaryReviewCriterionResult = {
  criterionId: string;
  status: "pass" | "partial" | "fail" | "not-applicable";
  reason: string;
  evidenceIds: string[];
  fixability: "summary-rewrite" | "evidence-needed" | "human-positioning-decision" | "fit-risk-only";
};

export type SummaryReviewResult = {
  reviewRunId: string;
  reviewedCvHash: string;
  positioningMode: SummaryQualityContract["positioningMode"];
  overallStatus: "pass" | "needs-improvement" | "cannot-resolve-with-current-evidence";
  criteria: SummaryReviewCriterionResult[];
  unsupportedCoreRequirements: string[];
  summaryRewriteNeeded: boolean;
  fitRiskOnly: boolean;
};

export type ReviewerStatus = "PASS" | "WARNING" | "FAIL";

export type ReviewerTruthfulnessStatus = "truthful" | "unsupported-claims" | "policy-violation" | "unreviewable";

export type ReviewerIssueCategory =
  | "Unsupported Claim"
  | "Evidence Missing"
  | "Capability Gap"
  | "External Wording"
  | "Keyword Coverage"
  | "Formatting"
  | "Profile Completeness"
  | "Policy Violation";

export type ReviewerSeverity =
  | "Critical"
  | "High"
  | "Medium"
  | "Low"
  | "Informational";

export type ReviewerRepairability =
  | "auto-repairable"
  | "targeted-repair"
  | "human-input"
  | "human-decision"
  | "not-repairable";

export type ReviewerIssue = {
  id: string;
  category: ReviewerIssueCategory;
  severity: ReviewerSeverity;
  title: string;
  description: string;
  visibleLocation?: {
    section: "header" | "summary" | "skills" | "workExperience" | "education" | "certifications" | "languages";
    itemId?: string;
    quote?: string;
  };
  evidence: {
    evidenceIds: string[];
    screeningAnalysisPath?: string;
    positioningReportPath?: string;
    cvBriefPath?: string;
    reason: string;
  };
  repairability: ReviewerRepairability;
  suggestedRepairIntent?: string;
  expectedRepairBoundary?: string[];
  exportSignal: "block" | "warn" | "allow";
};

export type ReviewerStructuredResult = {
  status: ReviewerStatus;
  truthfulnessStatus: ReviewerTruthfulnessStatus;
  reviewedCvVersionId: string;
  reviewedCvContentHash: string;
  reviewedAt: string;
  positioningAuthority: "ScreeningAnalysis";
  positioningReportMode: "read-only-derived-view";
  issues: ReviewerIssue[];
  summary: {
    unsupportedClaimCount: number;
    capabilityGapCount: number;
    evidenceMissingCount: number;
    repairableIssueCount: number;
    exportBlockingIssueCount: number;
  };
  repairContract: {
    issues: ReviewerIssue[];
  };
  exportRecommendationInput: {
    reviewStatus: ReviewerStatus;
    exportBlockingIssues: {
      issueId: string;
      category: ReviewerIssueCategory;
      severity: ReviewerSeverity;
      reason: string;
    }[];
    exportWarnings: {
      issueId: string;
      category: ReviewerIssueCategory;
      severity: ReviewerSeverity;
      reason: string;
    }[];
    truthfulness: {
      unsupportedClaimCount: number;
      policyViolationCount: number;
      capabilityGapCount: number;
    };
    documentReadiness: {
      formattingIssueCount: number;
      profileCompletenessIssueCount: number;
      externalWordingIssueCount: number;
    };
  };
};

export type CvVersion = {
  id: string;
  jdId: string;
  name: string;
  summary: string;
  content: string;
  sections?: {
    header: string;
    summary: string;
    skills: string;
    workExperience: string;
    projects: string;
    education: string;
    certifications: string;
    languages: string;
  };
  tailoredCv?: TailoredCv;
  generationContext?: GenerationContext;
  status: "Draft" | "Editing" | "Ready for Review" | "Ready to Export" | "Exported";
  exportedAt?: string;
  exportHistory?: {
    exportedAt: string;
    fileName: string;
    jobId: string;
    versionName: string;
    jdContentHash?: string;
    cvContentHash?: string;
    qualityScore?: string;
    applied?: boolean;
  }[];
  exportSnapshots?: ExportSnapshot[];
  reviewSnapshot?: {
    snapshotId?: string;
    reviewRunId?: string;
    updatedAt?: string;
    contentHash?: string | null;
    reviewedCvVersionId?: string;
    reviewedCvContentHash?: string | null;
    reviewedSummaryHash?: string;
    freshnessStatus?: "fresh" | "stale" | "running" | "failed";
    cvUpdatedAt: string;
    completedAt: string;
    gateIssueCount: number;
    reviewerIssueCount: number;
    ready: boolean;
    repairTargetZone?: "summary";
    repairOutcome?: "passed" | "still-failed";
    repairPreviousValue?: string;
    repairUpdatedValue?: string;
    repairReviewerReason?: string;
    repairFailedCriteria?: string[];
    summaryQualityContract?: SummaryQualityContract;
    summaryReviewResult?: SummaryReviewResult;
    structuredReviewResult?: ReviewerStructuredResult;
    repairPreviousSummaryReview?: SummaryReviewResult;
    repairUpdatedSummaryReview?: SummaryReviewResult;
    repairBlockerId?: string;
    repairBlockerReviewRunId?: string;
    repairBlockerReviewedCvHash?: string;
  };
  updatedAt: string;
};

export type ParsePreview<T> = {
  raw: string;
  parsed: T | null;
  error: string;
  warning?: string;
};

export type RecruiterAnswer = {
  id: string;
  category: string;
  question: string;
  answer: string;
  answerZh: string;
  tags: string[];
  updatedAt: string;
};

export type AutomationJobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export type AutomationJob<T = unknown> = {
  id: string;
  kind: "screening-analysis" | "screening-cv";
  status: AutomationJobStatus;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
  rawOutput?: string;
  result?: T;
  context?: unknown;
};

export type AppData = {
  rawSources: RawSource[];
  sourceOfTruth: SourceOfTruth;
  careerProfile: CareerProfile;
  skillInferences: SkillInference[];
  domainKnowledge: DomainKnowledge[];
  evidenceCards: EvidenceCard[];
  starStories: StarStory[];
  highCompensationSignals: HighCompensationSignal[];
  backboneMetadata: BackboneMetadata;
  backboneUpdateSummary: BackboneUpdateSummary;
  backboneTasks: BackboneProjectTask[];
  recruiterAnswers: RecruiterAnswer[];
  jobs: JobApplication[];
  promptTemplates: PromptTemplate[];
  cvVersions: CvVersion[];
};
