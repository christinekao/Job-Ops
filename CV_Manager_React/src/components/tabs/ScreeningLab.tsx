import { Briefcase, FileText, Search, Target } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { buildScreeningAnalysisPrompt, buildScreeningCvPrompt, buildTargetedRegenerationPrompt, SCREENING_ANALYSIS_PROMPT_VERSION, SCREENING_CV_PROMPT_VERSION } from "../../promptBuilders";
import { buildNormalizedRequirementInventory, computeJobContentHash, sourceUrlIntegrityIssue } from "../../data/jobs";
import { buildCvBrief, buildCvGenerationSelectionPatch, buildGenerationContext, cvBriefIdentityHash, cvInputReadiness, isCvStaleForJob, latestCvForJob, resolveEffectiveCvBrief } from "../../data/selection";
import { cancelAutomationJob, getAutomationJob, startAutomation, waitForAutomationJob } from "../../storage";
import type { AppData, AutomationJob, CvVersion, JobApplication, ParsePreview, ScreeningAnalysis, ScreeningAnalysisAIOutput, TailoredCv } from "../../types";
import type { TabId } from "../../config/nav";
import { uid } from "../../utils/ids";
import { contentHash, estimatePromptTokens } from "../../utils/hash";
import { sanitizeRecruiterFacingData } from "../../utils/normalize";
import { describeMissingAutomationResult } from "../../utils/automation";
import { deriveScreeningWorkflowState, resolvePrimaryWorkflowCta, shouldReplaceCurrentCvVersion, type ScreeningStepView } from "../../domain/screeningWorkflow";
import { deriveWorkflowChecklistState } from "../../domain/workflowChecklistState";
import { evidenceIntegrityReview, terminologyAndGapReview } from "../../domain/screeningReadiness";
import { useAutomationPolling } from "../../hooks/useAutomationPolling";
import { emptyPreview, tryParseJson } from "../../utils/json";
import { PageHeader, EmptyState, Field, Textarea, ManualAiPanel, ParsePreviewCard } from "../ui/primitives";
import { CvPreview } from "../cv/CvPreview";
import { buildCvPromptInput, composeCvContent, cvContentAudit, defaultCvVersionName, normalizeTailoredCv, tailoredCvFromVersion, tailoredCvToSections } from "../cv/utils";
import { AmbiguousSignalList, CheckStatusSummary, EvidenceMappingList, JdBreakdownPanel, MarketReferenceSignalList, MiniReasonList, MiniTagList, RepairActionPanel, TerminologyTable, compactUiMessage, reviewerFixHint } from "./screeningLabPanels";
import { AiActionTimestamp, AutomationStatusCard, ReviewerRunStatusBanner, StepCompletedAt, formatRunAt, renderRunState } from "./screeningRunStatus";
import { ExportDecisionPanel, RepairResultPanel, ReviewSummaryPanel } from "./screeningReviewRepairPanels";
import { generateRepairProposal } from "../../domain/repairProposalGenerator";
import { orchestrateRepair } from "../../domain/repairOrchestrator";
import { executeSafeRepairs } from "../../domain/safeRepairExecutor";
import { applyAcceptedRepairProposalBatch, createRepairProposalBatch } from "../../domain/repairProposalBatch";
import { createTargetedRegenerationRequest, executeTargetedRegeneration } from "../../domain/targetedRegeneration";
import { parseTargetedRegenerationOutput } from "../../domain/targetedRegenerationContract";
import type { TargetedOutputContractFailure, TargetedRegenerationRequest } from "../../domain/targetedRegeneration.types";
import {
  buildTargetedRegenerationValidationDiagnostic,
  formatValidationDiagnosticMessage,
  type ValidationDiagnosticReport
} from "../../domain/targetedRegenerationDiagnostics";
import {
  canDispatchTargetedRegeneration,
  createRegenerationAttemptIdentity,
  isAttemptForCurrentReview,
  type TargetedRegenerationAttempt,
  type TargetedRegenerationOutcome
} from "../../domain/targetedRegenerationFeedback";
import { recordSummaryRepairReview, resolveReviewFreshness } from "../../domain/reviewFreshness";
import type { RepairProposal } from "../../domain/repairProposal.types";
import type { RepairProposalBatchStatus } from "../../domain/repairProposalBatch.types";
import { writeGuidedEditContext, type GuidedEditContext } from "../cv/guidedEditing";

import { classifyRepairActions, createReviewSnapshot, isActiveAutomationRun, isBlockingRepairItem, isDisconnectedAutomationRun, isReviewSnapshotValidForCv, reconcileReviewSnapshotIdentity } from "../../domain/screeningReview";
import { validateScreeningCvOutput } from "../../domain/screeningCvOutput";
import { buildPositioningReport } from "../../domain/positioningPolicy";
import {
  SCREENING_AI_SCHEMA_VERSION,
  createScreeningAnalysisStoredResult,
  parseScreeningAnalysisAIOutput,
  screeningAiSchemaHash,
  screeningAnalysisIdentityMatches,
  validateScreeningAnalysisAIOutput,
  validateScreeningAnalysisSemantics
} from "../../domain/screeningAnalysisSchema";
import { buildLocalReviewerContentFix } from "../../domain/localReviewerFix";
import { createRepairPlan, localRepairPlan } from "../../domain/screeningRepairPlan";
import { evaluateScreeningReview, resolveScreeningExportDecision } from "../../domain/screeningExportDecision";
import {
  dispatchScreeningAction,
  isTargetedRegenerationCommand,
  resolveScreeningActionRefresh,
  screeningActionKey,
  type ScreeningActionExecution,
  type ScreeningActionCommand,
  type ScreeningActionId,
  type ScreeningActionResult,
  type TargetedRegenerationCommand
} from "../../application/screeningActionPipeline";
export function ScreeningLab({
  data,
  job,
  cv,
  onGo,
  onCreateJob,
  onUpdateJob,
  onSaveCv
}: {
  data: AppData;
  job?: JobApplication;
  cv?: CvVersion;
  onGo: (tab: TabId) => void;
  onCreateJob: (job: JobApplication) => void;
  onUpdateJob: (patch: Partial<JobApplication>) => void;
  onSaveCv: (version: CvVersion) => void;
}) {
  const [draftCompany, setDraftCompany] = useState("");
  const [draftRole, setDraftRole] = useState("");
  const [draftLocation, setDraftLocation] = useState("");
  const [draftRawJd, setDraftRawJd] = useState("");
  const [analysisPasteBack, setAnalysisPasteBack] = useState("");
  const [analysisPreview, setAnalysisPreview] = useState<ParsePreview<ScreeningAnalysisAIOutput>>(emptyPreview);
  const [cvPasteBack, setCvPasteBack] = useState("");
  const [cvPreview, setCvPreview] = useState<ParsePreview<unknown>>(emptyPreview);
  const [message, setMessage] = useState("");
  const [analysisRun, setAnalysisRun] = useState<AutomationJob<ScreeningAnalysisAIOutput> | null>(null);
  const [cvRun, setCvRun] = useState<AutomationJob<unknown> | null>(null);
  const appliedAutomationIdsRef = useRef(new Set<string>());
  const [analysisStarting, setAnalysisStarting] = useState(false);
  const [cvStarting, setCvStarting] = useState(false);
  const [localFixSummary, setLocalFixSummary] = useState("");
  const [reviewerActionPending, setReviewerActionPending] = useState(false);
  const reviewerActionPendingRef = useRef(false);
  const [reviewerActionResult, setReviewerActionResult] = useState<ScreeningActionResult | null>(null);
  const [targetedRegenerationLifecycle, setTargetedRegenerationLifecycle] = useState<"idle" | "running" | "validating">("idle");
  const [targetedRegenerationStartedAt, setTargetedRegenerationStartedAt] = useState<number | null>(null);
  const [targetedRegenerationAttempt, setTargetedRegenerationAttempt] = useState<TargetedRegenerationAttempt | null>(null);
  const [targetedRegenerationResultDismissed, setTargetedRegenerationResultDismissed] = useState(false);
  const targetedRegenerationAttemptRef = useRef<TargetedRegenerationAttempt | null>(null);
  const completedReviewerActionKeysRef = useRef(new Set<string>());
  const [clockTick, setClockTick] = useState(0);
  const analysisRunActive = analysisStarting || isActiveAutomationRun(analysisRun);
  const cvRunActive = cvStarting || isActiveAutomationRun(cvRun);
  const [activeStepView, setActiveStepView] = useState<ScreeningStepView>("analysis");
  const [aiActionsEnabled, setAiActionsEnabled] = useState(false);
  const [reviewRefreshStatus, setReviewRefreshStatus] = useState<"idle" | "running" | "failed">("idle");
  const [reviewRefreshError, setReviewRefreshError] = useState("");

  const latestCv = job ? latestCvForJob(data, job.id) : undefined;
  const activeCv = cv || latestCv;
  const reviewFreshness = resolveReviewFreshness(
    activeCv,
    reviewRefreshStatus === "running" ? "running" : reviewRefreshStatus === "failed" ? "failed" : undefined
  );
  const activeCvRef = useRef<CvVersion | undefined>(activeCv);
  activeCvRef.current = activeCv;
  const activeCvInputStale = job && activeCv?.tailoredCv ? isCvStaleForJob(activeCv, job, data) : false;
  const generationReadiness = job ? cvInputReadiness(data, job) : null;
  const cvBrief = job ? resolveEffectiveCvBrief(data, job) : null;
  const effectiveCvBriefHash = contentHash(cvBrief || {});
  const cvBriefReady = Boolean(cvBrief?.top3SellingPoints.length && cvBrief.mustShowEvidenceIds.length >= 4);
  const evidenceReview = evidenceIntegrityReview(data);
  const terminologyReview = job ? terminologyAndGapReview(job, data) : null;
  const careerEvidenceReady = data.evidenceCards.length >= 8 && data.skillInferences.length >= 8 && data.starStories.length >= 3;
  const cvVersionCount = job ? data.cvVersions.filter((item) => item.jdId === job.id).length : 0;
  const shouldAvoidMoreGeneration = cvVersionCount >= 2;
  const reviewEvaluation = job ? evaluateScreeningReview({ data, job, cv: activeCv }) : null;
  const gate = reviewEvaluation?.gate || null;
  const managerReview = reviewEvaluation?.managerReview || null;
  const reviewerReview = reviewEvaluation?.reviewerReview || null;
  const exportCheck = reviewEvaluation?.exportCheck || null;
  const failedSummaryCriterionIds = (managerReview?.summaryReview.criteria || [])
    .filter((criterion) => criterion.status === "fail" && criterion.fixability === "summary-rewrite")
    .map((criterion) => criterion.criterionId);
  const exportDecision = job && reviewEvaluation
    ? resolveScreeningExportDecision({ data, job, cv: activeCv, evaluation: reviewEvaluation, requireFreshReview: true })
    : null;
  const exportDecisionHashRef = useRef<string | undefined>(exportDecision?.contentHash);
  exportDecisionHashRef.current = exportDecision?.contentHash;
  const effectiveCvBriefHashRef = useRef(effectiveCvBriefHash);
  effectiveCvBriefHashRef.current = effectiveCvBriefHash;
  const repairOrchestration = exportDecision && activeCv && reviewFreshness.status === "fresh"
    ? orchestrateRepair({
      cvVersionId: activeCv.id,
      cvContentHash: exportDecision.contentHash || contentHash(activeCv.tailoredCv || activeCv),
      blockers: exportDecision.blockers,
      structuredIssues: activeCv.reviewSnapshot?.structuredReviewResult?.repairContract?.issues,
      cv: activeCv.tailoredCv,
      trustedProfileEmail: data.careerProfile.contact?.email,
      selectedEvidenceIds: job?.selectedEvidenceIds,
      effectiveCvBriefHash
    })
    : undefined;
  const currentTargetedRegenerationRequest = repairOrchestration?.targetedRegeneration.length && job
    ? createTargetedRegenerationRequest({
      classifications: repairOrchestration.targetedRegeneration,
      selectedEvidenceIds: job.selectedEvidenceIds || [],
      effectiveCvBriefHash,
      failedSummaryCriterionIds
    })
    : null;
  const currentTargetedRegenerationAttempt = isAttemptForCurrentReview(targetedRegenerationAttempt, currentTargetedRegenerationRequest)
    ? targetedRegenerationAttempt
    : null;
  const targetedRegenerationElapsedSeconds = targetedRegenerationStartedAt === null
    ? 0
    : Math.max(0, Math.floor((Date.now() - targetedRegenerationStartedAt) / 1000));
  const activeCvContentAudit = activeCv?.tailoredCv ? cvContentAudit(activeCv.tailoredCv) : [];
  const gateBlockingFixes = gate?.fixNext.filter(isBlockingRepairItem) || [];
  const gateManualFixes = gate?.fixNext.filter((item) => !isBlockingRepairItem(item)) || [];
  const gateHasBlockingFixes = gateBlockingFixes.length > 0;
  const cvRepairItems = Array.from(new Set([
    ...gateBlockingFixes,
    ...(managerReview?.rewriteRequired || []),
    ...(reviewerReview?.blockers || []),
    ...(exportCheck?.blockers || [])
  ]));
  const manualRepairItems = gateManualFixes;
  const repairActions = classifyRepairActions(cvRepairItems);
  const manualRepairActions = classifyRepairActions(manualRepairItems);
  const primaryRepairAction = repairActions[0];
  const reviewerBlockerCount = exportDecision?.blockers.length || 0;
  const repairPlan = createRepairPlan({
    cv: activeCv,
    gateFixes: gateBlockingFixes,
    reviewerChecks: reviewerReview?.checks || [],
    exportChecks: exportCheck?.checks || []
  });
  const safeLocalRepairPlan = localRepairPlan(repairPlan);
  const safeContentRepairPlan = safeLocalRepairPlan?.items.some((item) => item.targetZones.includes("workExperience"))
    ? safeLocalRepairPlan
    : null;
  const reviewSnapshotValid = isReviewSnapshotValidForCv(activeCv);
  const workflowInput = {
    careerEvidenceReady,
    analysisReady: Boolean(job?.screeningAnalysis),
    terminologyReady: Boolean(terminologyReview?.ready),
    briefReady: Boolean(generationReadiness?.ready && cvBriefReady),
    hasCv: Boolean(activeCv?.tailoredCv),
    cvRunActive,
    gateIssueCount: gateBlockingFixes.length,
    reviewerIssueCount: reviewerBlockerCount,
    reviewerReady: Boolean(exportDecision?.ready),
    reviewSnapshotValid,
    cvVersionCount,
    run: job?.screeningCvRun
  };
  const workflowState = deriveScreeningWorkflowState(workflowInput);
  const primaryWorkflowCta = resolvePrimaryWorkflowCta({
    ...workflowInput,
    hasSafeLocalRepair: Boolean(safeContentRepairPlan),
    hasAiRepair: repairActions.some((action) => action.tokenCost === "ai-patch"),
    exportReady: Boolean(exportDecision?.ready)
  });
  const primaryRepairUsesAi = !safeContentRepairPlan && primaryRepairAction?.tokenCost === "ai-patch";
  const aiRepairLoopStopped = workflowState.repairLocked;
  const failedReviewerExportChecks = [
    ...(reviewerReview?.checks || []),
    ...(exportCheck?.checks || [])
  ].filter((check) => !check.ok).map((check) => ({
    label: check.label,
    value: check.value,
    fix: reviewerFixHint(check.label)
  }));
  const reviewerExportChecks = [
    ...(reviewerReview?.checks || []),
    ...(exportCheck?.checks || [])
  ];
  const reviewSummaryGroups = [
    {
      title: "PASS",
      tone: "pass" as const,
      checks: reviewerExportChecks
        .filter((check) => check.ok && !/application fit risk/i.test(check.label))
        .map((check) => ({ label: check.label.replace(/^Reviewer:\s*/i, ""), value: check.value }))
    },
    {
      title: "WARNING",
      tone: "warning" as const,
      checks: reviewerExportChecks
        .filter((check) => check.ok && /application fit risk/i.test(check.label))
        .map((check) => ({ label: check.label.replace(/^Reviewer:\s*/i, ""), value: check.value }))
    },
    {
      title: "BLOCKING",
      tone: "blocking" as const,
      checks: reviewerExportChecks
        .filter((check) => !check.ok)
        .map((check) => ({ label: check.label.replace(/^Reviewer:\s*/i, ""), value: check.value }))
    }
  ];
  const repairPlanItems = (safeContentRepairPlan?.items || repairPlan?.items || []).map((item) => ({
    label: item.label.replace(/^Reviewer:\s*/i, ""),
    targetZones: item.targetZones,
    reason: item.reason || "Repair only this failed check.",
    safety: item.approvalRequired ? "Approval required" : item.repairMode === "local-safe" ? "Safe local repair" : "AI repair",
    impact: item.targetZones.includes("workExperience")
      ? "Work bullets only; passed zones stay unchanged."
      : item.targetZones.includes("header.contact")
        ? "Header contact only."
        : item.targetZones.includes("header.targetRole")
          ? "Header target title only."
          : "Limited to the listed target zone."
  }));
  const latestLocalFixNote = localFixSummary || activeCv?.tailoredCv?.reviewNotes?.filter((note) => /Local no-token reviewer fix/i.test(note)).slice(-1)[0] || "";
  const repairResultDisplay = reviewerActionResult ? {
    summary: reviewerActionResult.message,
    actionId: reviewerActionResult.actionId,
    status: reviewerActionResult.status,
    timestamp: reviewerActionResult.timestamp,
    changedSections: reviewerActionResult.affectedZones,
    unchangedSections: Array.from(new Set(safeContentRepairPlan?.items.flatMap((item) => item.preservedZones) || [])),
    contentHash: reviewerActionResult.currentCvHash,
    remainingBlockers: reviewerActionResult.remainingBlockers || exportDecision?.blockers || [],
    diagnosticReport: (() => {
      const value = reviewerActionResult.value as { diagnosticReport?: ValidationDiagnosticReport } | undefined;
      return value?.diagnosticReport;
    })()
  } : latestLocalFixNote ? {
    summary: latestLocalFixNote,
    changedSections: Array.from(new Set(safeContentRepairPlan?.items.flatMap((item) => item.targetZones) || ["workExperience"])),
    unchangedSections: Array.from(new Set(safeContentRepairPlan?.items.flatMap((item) => item.preservedZones) || [])),
    contentHash: exportDecision?.contentHash,
    remainingBlockers: exportDecision?.blockers || []
  } : undefined;
  const gatePrimaryAction = gate?.supportedMissingKeywords.length
    ? "Patch keyword gaps with Codex"
    : gateBlockingFixes.some((item) => /blocked internal terms|forbidden visible claims|weak\/unsupported/i.test(item))
      ? "Patch risky wording with Codex"
      : "Patch current CV with Codex";
  const aiLockedTitle = "Locked to prevent token use. Enable AI actions first.";
  const aiTokenTitle = "Uses AI tokens.";
  const cvAiActionUnavailable = !job?.screeningAnalysis
    || !terminologyReview?.ready
    || !generationReadiness?.ready
    || !cvBriefReady
    || Boolean(activeCv?.tailoredCv && !activeCvInputStale && !workflowState.repairAllowed);
  const cvFixContext = activeCv?.tailoredCv || cvRepairItems.length || activeCvContentAudit.length || failedReviewerExportChecks.length
    ? {
      currentCv: activeCv?.tailoredCv,
      gateFixes: cvRepairItems,
      failedChecks: failedReviewerExportChecks,
      contentAudit: activeCvContentAudit.map(({ location, excerpt, reasons }) => ({ location, excerpt, reasons }))
    }
    : undefined;
  const latestAnalysisResult = analysisRun?.result || job?.screeningAnalysis;
  const latestCvResult = cvRun?.result || activeCv?.tailoredCv;
  const normalizedLatestCvResult = latestCvResult ? normalizeTailoredCv(latestCvResult) : null;
  const analysisInputHash = job ? contentHash({
    jdContentHash: job.jdContentHash || computeJobContentHash(job),
    rawJD: job.rawJD,
    parsed: job.parsed,
    skillCount: data.skillInferences.length,
    domainCount: data.domainKnowledge.length,
    evidenceCount: data.evidenceCards.length,
    storyCount: data.starStories.length
  }) : "";
  const screeningCvInputHash = job ? contentHash({
    jobId: job.id,
    screeningAnalysis: job.screeningAnalysis,
    selectedEvidenceIds: job.selectedEvidenceIds,
    selectedStoryIds: job.selectedStoryIds,
    cvBrief,
    cvPromptInput: buildCvPromptInput(data, job)
  }) : "";
  const currentAnalysisPromptHash = job ? contentHash(buildScreeningAnalysisPrompt(data, job.id)) : "";
  const sourceUrlWarning = sourceUrlIntegrityIssue(job?.parsed?.sourceUrl);
  const canonicalRequirementInventory = buildNormalizedRequirementInventory(job?.parsed);
  const derivedPositioningReport = job?.screeningAnalysis ? buildPositioningReport({ job, data }) : null;
  const screeningContractIdentity = {
    schemaVersion: SCREENING_AI_SCHEMA_VERSION,
    schemaHash: screeningAiSchemaHash,
    promptVersion: SCREENING_ANALYSIS_PROMPT_VERSION,
    promptHash: currentAnalysisPromptHash
  };
  const analysisNeedsRerun = Boolean(job?.screeningAnalysis && !screeningAnalysisIdentityMatches(
    job.screeningAnalysisRun,
    analysisInputHash,
    currentAnalysisPromptHash
  ));
  const cvNeedsRerun = Boolean(activeCv?.tailoredCv && activeCvInputStale);
  const currentAnalysis = Boolean(job?.screeningAnalysis && !analysisNeedsRerun);
  const currentAnalysisHash = job?.screeningAnalysis ? contentHash(job.screeningAnalysis) : "";
  const cvBriefBoundToCurrentAnalysis = Boolean(
    job?.cvBrief
    && job.cvBriefAnalysisHash === currentAnalysisHash
    && cvBriefIdentityHash(job.cvBrief) === cvBriefIdentityHash(cvBrief)
  );
  const briefCurrent = Boolean(currentAnalysis && terminologyReview?.ready && generationReadiness?.ready && cvBriefReady && cvBriefBoundToCurrentAnalysis);
  const fitDimensions = derivedPositioningReport?.fitDimensions;
  const hardBlock = Boolean(derivedPositioningReport?.fitClassification === "HARD_BLOCK" || (fitDimensions && !fitDimensions.manualOverrideAllowed));
  const currentCv = Boolean(activeCv?.tailoredCv && briefCurrent && !cvNeedsRerun);
  const cvDraftReady = currentCv;
  const gateReviewCurrent = Boolean(currentCv && reviewFreshness.status === "fresh" && reviewSnapshotValid);
  const historicalGateReview = Boolean(
    (activeCv?.reviewSnapshot && !gateReviewCurrent)
    || data.cvVersions.some((item) => item.jdId === job?.id && item.id !== activeCv?.id && item.reviewSnapshot)
  );
  const managerAtsCurrent = Boolean(gateReviewCurrent && activeCv?.reviewSnapshot?.structuredReviewResult);
  const checklistState = deriveWorkflowChecklistState({
    careerEvidenceReady: careerEvidenceReady && evidenceReview.completeEnough,
    analysisCurrent: currentAnalysis,
    positioningCurrent: Boolean(currentAnalysis && terminologyReview?.ready),
    briefCurrent,
    analysisRunning: analysisRunActive,
    hardBlock,
    manualOverrideAllowed: fitDimensions?.manualOverrideAllowed ?? false,
    fitTier: derivedPositioningReport?.fitClassification,
    generationRecommendation: fitDimensions?.generationRecommendation,
    cvRunActive,
    currentCv,
    hasHistoricalCv: Boolean(data.cvVersions.some((item) => item.jdId === job?.id && item.id !== activeCv?.id)),
    gateReview: { current: gateReviewCurrent, historical: historicalGateReview, status: !currentCv ? "missing" : reviewFreshness.status },
    managerAts: { current: managerAtsCurrent, status: !gateReviewCurrent ? (reviewFreshness.status === "stale" ? "stale" : "missing") : managerAtsCurrent ? "fresh" : "missing" }
  });
  const cvRunRecordActive = job?.screeningCvRun?.status === "queued" || job?.screeningCvRun?.status === "running";
  const cvRunDisconnected = isDisconnectedAutomationRun(job?.screeningCvRun, cvRun, cvStarting);
  const scrollToWorkflow = () => {
    window.setTimeout(() => {
      document.getElementById("screening-workflow-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };
  const applyRecommendedSelections = () => {
    if (!job?.screeningAnalysis) {
      setMessage("Run JD Analysis first. There are no JD-based recommendations to apply yet.");
      setActiveStepView("analysis");
      return;
    }
    if (hardBlock) {
      setMessage("CV generation is blocked by the current hard block. Resolve the stated legal or practical restriction before continuing.");
      return;
    }
    const selectionPatch = buildCvGenerationSelectionPatch(data, job);
    const nextJob = { ...job, ...selectionPatch };
    const nextCvBrief = buildCvBrief(data, nextJob);
    const nextReadiness = cvInputReadiness(data, { ...nextJob, cvBrief: nextCvBrief || undefined });
    const missingChecks = nextReadiness.checks.filter((check) => !check.ok).map((check) => check.label);
    onUpdateJob({
      ...selectionPatch,
      cvBrief: nextCvBrief || undefined,
      cvBriefGeneratedAt: nextCvBrief?.generatedAt,
      cvBriefAnalysisHash: currentAnalysisHash,
      status: nextReadiness.ready ? "Ready to Tailor" : "Evidence Needed",
      nextAction: nextReadiness.ready
        ? "Generate Screening CV from the Career OS CV Brief."
        : `Add enough selected material before generating CV: ${missingChecks.join(", ")}.`,
      updatedAt: new Date().toISOString()
    });
    if (nextReadiness.ready) {
      setMessage("Recommended selections applied and converted into a Career OS CV Brief. Generate the CV from this brief next.");
      setActiveStepView("cv");
    } else {
      setMessage(`Recommendations were supplemented, but still not enough source material to generate CV. Fix: ${missingChecks.join(", ")}.`);
      setActiveStepView("selection");
    }
  };
  const reviewRecommendedSelections = () => {
    sessionStorage.setItem("cv-manager-jd-subview", "recommendations");
    onGo("workspace");
  };
  const openStepView = (view: ScreeningStepView) => {
    setActiveStepView(view);
    scrollToWorkflow();
  };
  const checklistTimestamp = (id: string) => {
    if (id === "evidence") return job?.updatedAt;
    if (id === "analysis" || id === "positioning") return job?.screeningAnalysisRun?.lastCompletedAt;
    if (id === "brief") return job?.cvBriefGeneratedAt || job?.recommendationsAppliedAt;
    if (id === "cv") return job?.screeningCvRun?.lastCompletedAt;
    return reviewFreshness.reviewedAt;
  };
  useEffect(() => {
    if (!analysisRunActive && !cvRunActive && targetedRegenerationLifecycle === "idle") return;
    const timer = window.setInterval(() => setClockTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [analysisRunActive, cvRunActive, targetedRegenerationLifecycle]);

  useEffect(() => {
    setAnalysisPasteBack("");
    setAnalysisPreview(emptyPreview<ScreeningAnalysisAIOutput>());
    setCvPasteBack("");
    setCvPreview(emptyPreview<unknown>());
    setMessage("");
    setLocalFixSummary("");
    setTargetedRegenerationLifecycle("idle");
    setTargetedRegenerationStartedAt(null);
    setTargetedRegenerationAttempt(null);
    setTargetedRegenerationResultDismissed(false);
    targetedRegenerationAttemptRef.current = null;
    setActiveStepView("analysis");
  }, [job?.id]);

  useEffect(() => {
    if (!job?.screeningCvRun?.jobId || !cvRunRecordActive || cvRun) return;
    let cancelled = false;
    getAutomationJob(job.screeningCvRun.jobId)
      .then((latest) => {
        if (!cancelled) setCvRun(latest);
      })
      .catch(() => {
        if (cancelled) return;
        onUpdateJob({
          screeningCvRun: {
            status: "failed",
            mode: job.screeningCvRun?.mode,
            jobId: job.screeningCvRun?.jobId,
            lastRunAt: job.screeningCvRun?.lastRunAt || new Date().toISOString(),
            lastError: "Previous Codex run could not be recovered from the local automation server. No CV data was applied.",
            inputHash: job.screeningCvRun?.inputHash || screeningCvInputHash,
            estimatedInputTokens: job.screeningCvRun?.estimatedInputTokens,
            applied: false
          },
          updatedAt: new Date().toISOString()
        });
      });
    return () => {
      cancelled = true;
    };
  }, [cvRun, cvRunRecordActive, job?.id, job?.screeningCvRun?.jobId]);

  useEffect(() => {
    setActiveStepView(workflowState.recommendedView);
  }, [job?.id, workflowState.recommendedView]);

  useEffect(() => {
    if (!job || !activeCv?.tailoredCv || cvRunActive) return;
    if (activeCv.reviewSnapshot && (
      !activeCv.reviewSnapshot.contentHash
      || !activeCv.reviewSnapshot.reviewRunId
      || !activeCv.reviewSnapshot.reviewedCvVersionId
      || !activeCv.reviewSnapshot.reviewedCvContentHash
      || !activeCv.reviewSnapshot.reviewedSummaryHash
    )) {
      onSaveCv(reconcileReviewSnapshotIdentity(activeCv));
    }
  }, [activeCv?.id, activeCv?.updatedAt, cvRunActive, job?.id, reviewSnapshotValid]);

  function recheckUpdatedCv() {
    if (!job || !activeCv?.tailoredCv || reviewRefreshStatus === "running") return;
    setReviewRefreshStatus("running");
    setReviewRefreshError("");
    try {
      onSaveCv({
        ...activeCv,
        reviewSnapshot: createReviewSnapshot(job, activeCv, data.evidenceCards)
      });
      setReviewRefreshStatus("idle");
    } catch (error) {
      setReviewRefreshStatus("failed");
      setReviewRefreshError(error instanceof Error && error.message ? error.message : "The updated CV review could not be refreshed.");
    }
  }

  function createScreeningJob() {
    if (!draftRawJd.trim()) return;
    const nextJob: JobApplication = {
      id: uid("job"),
      company: draftCompany.trim(),
      role: draftRole.trim(),
      location: draftLocation.trim(),
      rawJD: draftRawJd.trim(),
      parsed: undefined,
      jdContentHash: "",
      status: "New",
      fit: "Unknown",
      nextAction: "Run Screening Analysis.",
      selectedSkillIds: [],
      selectedDomainKnowledgeIds: [],
      selectedEvidenceIds: [],
      selectedStoryIds: [],
      updatedAt: new Date().toISOString()
    };
    nextJob.jdContentHash = computeJobContentHash(nextJob);
    onCreateJob(nextJob);
    setDraftCompany("");
    setDraftRole("");
    setDraftLocation("");
    setDraftRawJd("");
  }

  function applyScreeningAnalysisResult(result: ScreeningAnalysisAIOutput) {
    if (!job) return;
    const validated = validateScreeningAnalysisAIOutput(result);
    if (!validated.success) {
      setMessage(`Screening Analysis was not applied. ${validated.issues[0]?.path || "Output"} does not match the current contract.`);
      return;
    }
    const currentInventory = buildNormalizedRequirementInventory(job.parsed);
    const semanticIssues = validateScreeningAnalysisSemantics(result, {
      requirementIds: new Set(currentInventory.map((item) => item.requirementId)),
      requirements: new Map(currentInventory.map((item) => [item.requirementId, item])),
      evidenceIds: new Set(data.evidenceCards.map((item) => item.id)),
      skillIds: new Set(data.skillInferences.map((item) => item.id)),
      storyIds: new Set(data.starStories.map((item) => item.id)),
      educationIds: new Set(data.careerProfile.education.map((item) => item.id)),
      domainKnowledgeIds: new Set(data.domainKnowledge.map((item) => item.id))
    });
    if (semanticIssues.length) {
      setMessage(`Screening Analysis was not applied. ${semanticIssues[0].path}: ${semanticIssues[0].guidance}`);
      return;
    }
    const storedResult: ScreeningAnalysis = createScreeningAnalysisStoredResult(validated.data);
    const basePatch = {
      screeningAnalysis: storedResult,
      updatedAt: new Date().toISOString()
    };
    onUpdateJob({
      ...basePatch,
      screeningAnalysisRun: {
        status: "completed",
        lastRunAt: job.screeningAnalysisRun?.lastRunAt || new Date().toISOString(),
        lastCompletedAt: new Date().toISOString(),
        lastError: "",
        inputHash: analysisInputHash,
        ...screeningContractIdentity,
          applied: true
      },
      status: "Evidence Needed",
      nextAction: "Review Positioning + Gaps, then explicitly apply recommendations to create the current CV Brief.",
      updatedAt: new Date().toISOString()
    });
    setAnalysisPasteBack("");
    setAnalysisPreview(emptyPreview<ScreeningAnalysisAIOutput>());
  }

  function applyScreeningAnalysis() {
    if (!analysisPreview.parsed) return;
    applyScreeningAnalysisResult(analysisPreview.parsed);
    setMessage("Screening Analysis applied. Review Positioning + Gaps, then explicitly apply recommendations to create the CV Brief.");
  }

  function applyScreeningCvResult(parsed: unknown) {
    if (!job) return;
    const nextTailoredCv = normalizeTailoredCv(parsed);
    if (!nextTailoredCv) {
      const root = parsed && typeof parsed === "object"
        ? Object.keys(parsed as Record<string, unknown>).slice(0, 10)
        : [];
      setCvPreview({
        ...cvPreview,
        error: `Parse succeeded, but this is not Tailored CV JSON. Expected header, summary, sidebar, and workExperience. Top-level keys seen: ${root.join(", ") || "(none)"}.`
      });
      return;
    }
    const outputValidation = validateScreeningCvOutput(nextTailoredCv);
    if (!outputValidation.valid) {
      setCvPreview({
        ...cvPreview,
        error: `Tailored CV JSON is incomplete and was not applied: ${outputValidation.errors.join("; ")}.`
      });
      return;
    }
    const sections = tailoredCvToSections(nextTailoredCv);
    const context = {
      ...buildGenerationContext(data, job, cvBrief),
      writerContextHash: screeningCvInputHash,
      promptVersion: SCREENING_CV_PROMPT_VERSION
    };
    const runMode = job.screeningCvRun?.mode || (activeCv?.tailoredCv ? "repair" : "generate");
    const replaceCurrentVersion = shouldReplaceCurrentCvVersion(Boolean(activeCv), runMode);
    const nextVersion: CvVersion = {
      ...(replaceCurrentVersion && activeCv ? activeCv : {}),
      id: replaceCurrentVersion && activeCv ? activeCv.id : uid("cv"),
      jdId: job.id,
      name: defaultCvVersionName(job.screeningAnalysis?.primaryTargetTitle || nextTailoredCv.header.targetRole || job.role),
      summary: nextTailoredCv.summary || sections.summary,
      content: composeCvContent(sections),
      sections,
      tailoredCv: nextTailoredCv,
      generationContext: context,
      status: "Draft",
      updatedAt: new Date().toISOString()
    };
    onSaveCv(nextVersion);
    onUpdateJob({
      screeningCvRun: {
        status: "completed",
        mode: runMode,
        jobId: job.screeningCvRun?.jobId,
        lastRunAt: job.screeningCvRun?.lastRunAt || new Date().toISOString(),
        lastCompletedAt: new Date().toISOString(),
        lastError: "",
        inputHash: screeningCvInputHash,
        estimatedInputTokens: job.screeningCvRun?.estimatedInputTokens,
        applied: true
      },
      status: "CV Drafted",
      nextAction: "Review the consolidated Manager + ATS report, then export or make targeted manual edits.",
      updatedAt: new Date().toISOString()
    });
    setCvPasteBack("");
    setCvPreview(emptyPreview<unknown>());
    setActiveStepView("reviewer");
    return true;
  }

  function applyScreeningCv() {
    if (!cvPreview.parsed) return;
    const ok = applyScreeningCvResult(cvPreview.parsed);
    if (!ok) return;
    setMessage("Screening CV saved as a new version.");
  }

  function executeTitleAlignmentFix(): ScreeningActionExecution {
    const targetTitle = job?.screeningAnalysis?.primaryTargetTitle?.trim();
    const currentTailoredCv = tailoredCvFromVersion(activeCv);
    if (!job || !activeCv || !currentTailoredCv || !targetTitle) {
      return {
        status: "blocked",
        message: "No target title is available to apply.",
        affectedZones: [],
        currentCvHash: exportDecision?.contentHash,
        refresh: ["workflow", "review", "repair", "export"]
      };
    }
    const nextTailoredCv = {
      ...currentTailoredCv,
      header: {
        ...currentTailoredCv.header,
        targetRole: targetTitle
      }
    };
    const sections = tailoredCvToSections(nextTailoredCv);
    const nextVersion: CvVersion = {
      ...activeCv,
      summary: nextTailoredCv.summary || sections.summary,
      content: composeCvContent(sections),
      sections,
      tailoredCv: nextTailoredCv,
      status: "Draft",
      updatedAt: new Date().toISOString()
    };
    nextVersion.reviewSnapshot = createReviewSnapshot(job, nextVersion, data.evidenceCards);
    onSaveCv(nextVersion);
    onUpdateJob({
      status: "CV Drafted",
      nextAction: "Review Reviewer + ATS Check, then export or refine.",
      updatedAt: new Date().toISOString()
    });
    return {
      status: "success",
      message: `Applied title fix without AI: ${targetTitle}`,
      affectedZones: ["header.targetRole"],
      currentCvHash: nextVersion.reviewSnapshot?.contentHash ?? undefined,
      refresh: ["workflow", "review", "repair", "export"]
    };
  }

  function applyTitleAlignmentFix() {
    const result = executeTitleAlignmentFix();
    setMessage(result.message);
    if (result.status === "success") setActiveStepView("reviewer");
  }

  function applyContactHeaderFix() {
    const currentTailoredCv = tailoredCvFromVersion(activeCv);
    if (!job || !activeCv || !currentTailoredCv) {
      setMessage("No current CV is available to fix.");
      return;
    }
    const nextTailoredCv = {
      ...currentTailoredCv,
      header: {
        ...currentTailoredCv.header,
        name: currentTailoredCv.header.name || "Li Ting Kao (Christine Kao)",
        email: currentTailoredCv.header.email || "christinekao8@gmail.com",
        location: currentTailoredCv.header.location || "Taipei City, Taiwan"
      }
    };
    const sections = tailoredCvToSections(nextTailoredCv);
    const nextVersion: CvVersion = {
      ...activeCv,
      summary: nextTailoredCv.summary || sections.summary,
      content: composeCvContent(sections),
      sections,
      tailoredCv: nextTailoredCv,
      status: "Draft",
      updatedAt: new Date().toISOString()
    };
    nextVersion.reviewSnapshot = createReviewSnapshot(job, nextVersion, data.evidenceCards);
    onSaveCv(nextVersion);
    onUpdateJob({
      status: "CV Drafted",
      nextAction: "Review Reviewer + ATS Check, then export or refine.",
      updatedAt: new Date().toISOString()
    });
    setMessage("Applied contact header fix without AI.");
    setActiveStepView("reviewer");
  }

  function executeSafeLocalReviewerFix(): ScreeningActionExecution {
    const currentTailoredCv = tailoredCvFromVersion(activeCv);
    if (!job || !activeCv || !currentTailoredCv) {
      return {
        status: "blocked",
        message: "No current CV is available to fix.",
        affectedZones: [],
        currentCvHash: exportDecision?.contentHash,
        refresh: ["workflow", "review", "repair", "export"]
      };
    }
    const fixResult = buildLocalReviewerContentFix({
      currentCv: currentTailoredCv,
      careerProfile: data.careerProfile,
      evidenceCards: data.evidenceCards,
      selectedEvidenceIds: job.selectedEvidenceIds || [],
      brief: cvBrief,
      repairPlan: safeContentRepairPlan,
      isBulletSafe: (bullet) => !cvContentAudit({
        ...currentTailoredCv,
        workExperience: [{
          ...currentTailoredCv.workExperience[0],
          subsections: [{ title: "audit", bullets: [bullet] }]
        }]
      }).length
    });
    if (!fixResult.ok) {
      return {
        status: fixResult.status,
        message: `${fixResult.status}: ${fixResult.error}`,
        affectedZones: [],
        currentCvHash: repairPlan?.cvContentHash || exportDecision?.contentHash,
        refresh: ["workflow", "review", "repair", "export"],
        remainingBlockers: fixResult.remainingBlockers
      };
    }
    const nextTailoredCv = fixResult.tailoredCv;
    const sections = tailoredCvToSections(nextTailoredCv);
    const nextVersion: CvVersion = {
      ...activeCv,
      summary: nextTailoredCv.summary || sections.summary,
      content: composeCvContent(sections),
      sections,
      tailoredCv: nextTailoredCv,
      status: "Draft",
      updatedAt: new Date().toISOString()
    };
    nextVersion.reviewSnapshot = createReviewSnapshot(job, nextVersion, data.evidenceCards);
    const nextReviewEvaluation = evaluateScreeningReview({ data, job, cv: nextVersion });
    const nextExportDecision = resolveScreeningExportDecision({ data, job, cv: nextVersion, evaluation: nextReviewEvaluation });
    const nextReviewerReview = nextReviewEvaluation.reviewerReview;
    const nextExportCheck = nextReviewEvaluation.exportCheck;
    const remainingBlockers = nextExportDecision.blockers.length;
    const remainingLabels = [
      ...(nextReviewerReview?.checks || []),
      ...(nextExportCheck?.checks || [])
    ].filter((check) => !check.ok).map((check) => check.label.replace(/^Reviewer:\s*/i, ""));
    const changedZones = fixResult.changedZones.join(", ");
    const summary = remainingBlockers
      ? `No AI used. Changed ${changedZones}; rebuilt ${fixResult.rebuiltBulletCount} current-role bullet(s). Still red: ${remainingLabels.slice(0, 3).join(", ")}.`
      : `No AI used. Changed ${changedZones}; rebuilt ${fixResult.rebuiltBulletCount} current-role bullet(s), and reviewer/export checks now pass.`;
    onSaveCv(nextVersion);
    onUpdateJob({
      status: "CV Drafted",
      nextAction: remainingBlockers
        ? "Local content fix applied; review the remaining red items."
        : "Local content fix applied; reviewer/export checks passed.",
      updatedAt: new Date().toISOString()
    });
    return {
      status: "success",
      message: summary,
      affectedZones: fixResult.changedZones,
      currentCvHash: nextVersion.reviewSnapshot?.contentHash ?? undefined,
      refresh: ["workflow", "review", "repair", "export"],
      remainingBlockers: nextExportDecision.blockers
    };
  }

  async function executeRecommendedAiRepair(): Promise<ScreeningActionExecution<AutomationJob<unknown>>> {
    if (!primaryRepairAction) {
      return { status: "blocked", message: "No recommended repair action is available.", affectedZones: [], currentCvHash: exportDecision?.contentHash, refresh: ["workflow", "repair"] };
    }
    if (aiRepairLoopStopped && primaryRepairAction.tokenCost === "ai-patch") {
      return { status: "blocked", message: "AI repair already completed and blockers still remain. Open CV Studio, export with risk, or pause this JD; another AI patch is not recommended.", affectedZones: [], currentCvHash: exportDecision?.contentHash, refresh: ["workflow", "repair"] };
    }
    if (!job || !aiActionsEnabled || !job.screeningAnalysis || !generationReadiness?.ready || !cvBriefReady) {
      return { status: "blocked", message: !aiActionsEnabled ? "AI actions are locked. Enable AI actions first if you intentionally want to spend tokens." : "AI repair prerequisites are not ready.", affectedZones: [], currentCvHash: exportDecision?.contentHash, refresh: ["workflow", "repair"] };
    }
    const lastRunAt = new Date().toISOString();
    const prompt = buildScreeningCvPrompt(data, job.id, cvFixContext);
    const estimatedInputTokens = estimatePromptTokens(prompt);
    onUpdateJob({
      screeningCvRun: { status: "queued", mode: "repair", lastRunAt, lastError: "", inputHash: screeningCvInputHash, estimatedInputTokens, applied: false },
      updatedAt: new Date().toISOString()
    });
    try {
      const started = await startAutomation("screening-cv", prompt);
      onUpdateJob({
        screeningCvRun: { status: started.status, mode: "repair", jobId: started.id, lastRunAt, lastError: "", inputHash: screeningCvInputHash, estimatedInputTokens, applied: false },
        updatedAt: new Date().toISOString()
      });
      return { status: "success", message: "AI repair started. The final report will refresh when the run completes.", affectedZones: repairPlan?.items.flatMap((item) => item.targetZones) || [], currentCvHash: exportDecision?.contentHash, refresh: ["workflow"], value: started };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start Codex CLI automation.";
      onUpdateJob({
        screeningCvRun: { status: "failed", mode: "repair", lastRunAt, lastError: message, inputHash: screeningCvInputHash, estimatedInputTokens, applied: false },
        updatedAt: new Date().toISOString()
      });
      return { status: "error", message: `Codex CLI Screening CV failed to start: ${message}`, affectedZones: [], currentCvHash: exportDecision?.contentHash, refresh: ["workflow", "repair"] };
    }
  }

  async function executeStopReviewerAiRepair(): Promise<ScreeningActionExecution<AutomationJob<unknown>>> {
    const jobId = cvRun?.id || job?.screeningCvRun?.jobId;
    if (!jobId) {
      return { status: "blocked", message: "No active Screening CV automation job id is available to stop.", affectedZones: [], currentCvHash: exportDecision?.contentHash, refresh: ["workflow"] };
    }
    try {
      const cancelled = await cancelAutomationJob(jobId);
      onUpdateJob({
        screeningCvRun: {
          status: "cancelled",
          mode: job?.screeningCvRun?.mode,
          jobId,
          lastRunAt: job?.screeningCvRun?.lastRunAt || new Date().toISOString(),
          lastError: cancelled.error || "Codex automation was cancelled by the user. No CV data was applied.",
          inputHash: job?.screeningCvRun?.inputHash || screeningCvInputHash,
          estimatedInputTokens: job?.screeningCvRun?.estimatedInputTokens,
          applied: false
        },
        updatedAt: new Date().toISOString()
      });
      return { status: "success", message: "Screening CV automation stopped. No CV data was applied.", affectedZones: [], currentCvHash: exportDecision?.contentHash, refresh: ["workflow"], value: cancelled };
    } catch (error) {
      return { status: "error", message: error instanceof Error ? error.message : "Unable to stop Codex CLI automation.", affectedZones: [], currentCvHash: exportDecision?.contentHash, refresh: ["workflow"] };
    }
  }

  function executeOrchestratedSafeRepairs(): ScreeningActionExecution {
    if (!activeCv || !activeCv.tailoredCv || !repairOrchestration || !exportDecision?.contentHash) {
      return { status: "blocked", message: "Safe AI repair is not available for the current CV.", affectedZones: [], currentCvHash: exportDecision?.contentHash, refresh: ["workflow", "repair"] };
    }
    const result = executeSafeRepairs({
      cvVersion: activeCv,
      orchestration: repairOrchestration,
      currentCvVersionId: activeCv.id,
      currentContentHash: exportDecision.contentHash,
      trustedProfileEmail: data.careerProfile.contact?.email
    });
    if (result.status !== "success" || !result.nextVersion) {
      return {
        status: result.status === "no-content-diff" ? "no-safe-fix" : "blocked",
        message: result.message,
        affectedZones: result.changedZones,
        currentCvHash: result.resultingContentHash,
        refresh: ["workflow", "review", "repair", "export"],
        remainingBlockers: exportDecision.blockers,
        value: result
      };
    }
    onSaveCv(result.nextVersion);
    return {
      status: "success",
      message: result.message,
      affectedZones: result.changedZones,
      currentCvHash: result.resultingContentHash,
      refresh: ["workflow", "review", "repair", "export"],
      remainingBlockers: [],
      value: result
    };
  }

  function executeAcceptedProposalBatch(payload: unknown): ScreeningActionExecution {
    if (!activeCv || !activeCv.tailoredCv || !exportDecision?.contentHash) {
      return { status: "blocked", message: "AI changes could not be applied. Your current CV was not modified.", affectedZones: [], currentCvHash: exportDecision?.contentHash, refresh: ["repair"] };
    }
    const proposalPayload = payload as { proposals?: RepairProposal[]; statuses?: Record<string, RepairProposalBatchStatus> };
    const proposals = proposalPayload?.proposals || [];
    if (!proposals.length) {
      return { status: "blocked", message: "No valid AI suggestions were produced for the current CV.", affectedZones: [], currentCvHash: exportDecision.contentHash, refresh: ["repair"] };
    }
    const evidenceByProposalId = Object.fromEntries(proposals.map((proposal) => {
      const match = repairOrchestration?.approvalRequired.find((item) => item.blockerId === proposal.blockerId);
      return [proposal.id, match?.evidenceIds || []];
    }));
    const batch = createRepairProposalBatch({
      sourceCvVersionId: activeCv.id,
      sourceContentHash: exportDecision.contentHash,
      proposals,
      evidenceByProposalId
    });
    const result = applyAcceptedRepairProposalBatch({
      cvVersion: activeCv,
      currentCvVersionId: activeCv.id,
      currentContentHash: exportDecision.contentHash,
      batch,
      statuses: proposalPayload.statuses
    });
    if (result.status !== "success" || !result.nextVersion) {
      const message = result.status === "stale"
        ? "The CV changed after these suggestions were created. Generate new suggestions."
        : result.status === "no-content-diff"
          ? "The approved suggestions produced no content change."
          : result.status === "no-accepted-proposals"
            ? "No AI changes have been applied yet. Review and approve suggestions first."
            : "AI changes could not be applied. Your current CV was not modified.";
      return {
        status: result.status === "no-content-diff" ? "no-safe-fix" : "blocked",
        message,
        affectedZones: result.appliedChanges.map((item) => item.targetZone),
        currentCvHash: result.resultingContentHash,
        refresh: ["workflow", "review", "repair", "export"],
        remainingBlockers: exportDecision.blockers,
        value: result
      };
    }
    onSaveCv(result.nextVersion);
    return {
      status: "success",
      message: `AI applied ${result.appliedChanges.length} approved change${result.appliedChanges.length === 1 ? "" : "s"} and created a new CV version.`,
      affectedZones: result.appliedChanges.map((item) => item.targetZone),
      currentCvHash: result.resultingContentHash,
      refresh: ["workflow", "review", "repair", "export"],
      remainingBlockers: [],
      value: result
    };
  }

  async function executeTargetedRegenerationAction(
    command: ScreeningActionCommand,
    options: { explicitRetry?: boolean } = {}
  ): Promise<ScreeningActionExecution> {
    if (!activeCv || !activeCv.tailoredCv || !repairOrchestration || !exportDecision?.contentHash || !job) {
      return { status: "blocked", message: "Targeted regeneration is not available for the current CV.", affectedZones: [], currentCvHash: exportDecision?.contentHash, refresh: ["repair"] };
    }
    if (!aiActionsEnabled) {
      return { status: "blocked", message: "AI actions are locked. Enable AI actions first if you intentionally want to spend tokens.", affectedZones: [], currentCvHash: exportDecision.contentHash, refresh: ["repair"] };
    }
    if (!repairOrchestration.targetedRegeneration.length) {
      return { status: "blocked", message: "No targeted-regeneration classifications are available.", affectedZones: [], currentCvHash: exportDecision.contentHash, refresh: ["repair"] };
    }
    if (!isTargetedRegenerationCommand(command)) {
      return { status: "blocked", message: "Targeted regeneration command identity is incomplete. Your current CV was not modified.", affectedZones: [], currentCvHash: exportDecision.contentHash, refresh: ["repair"] };
    }
    const request = command.payload as TargetedRegenerationRequest | undefined;
    const commandIdentityMismatch = !request
      || request.id !== command.requestId
      || request.cvVersionId !== command.cvVersionId
      || request.cvContentHash !== command.cvContentHash
      || request.effectiveCvBriefHash !== command.effectiveCvBriefHash
      || JSON.stringify(request.blockerIds) !== JSON.stringify(command.blockerIds)
      || JSON.stringify(request.targetZones) !== JSON.stringify(command.targetZones)
      || JSON.stringify(request.selectedEvidenceIds) !== JSON.stringify(command.selectedEvidenceIds);
    if (commandIdentityMismatch || !request) {
      return { status: "blocked", message: "Targeted regeneration request identity could not be verified. Your current CV was not modified.", affectedZones: [], currentCvHash: exportDecision.contentHash, refresh: ["repair"] };
    }
    if (!canDispatchTargetedRegeneration({
      attempt: targetedRegenerationAttemptRef.current,
      request,
      explicitRetry: options.explicitRetry
    })) {
      return {
        status: "no-safe-fix",
        message: "AI regeneration already completed for this unchanged CV and evidence context. Choose another repair path or use the explicit Retry action.",
        affectedZones: [],
        currentCvHash: command.cvContentHash,
        refresh: ["repair"],
        remainingBlockers: exportDecision.blockers,
        value: targetedRegenerationAttemptRef.current
      };
    }
    const attemptIdentity = createRegenerationAttemptIdentity(request);
    const previousAttempt = targetedRegenerationAttemptRef.current?.key === attemptIdentity.key
      ? targetedRegenerationAttemptRef.current
      : null;
    const attemptCount = (previousAttempt?.attemptCount || 0) + 1;
    const attemptedAt = new Date().toISOString();
    const unsupportedTerms = (job.screeningAnalysis?.jdEvidenceMapping || [])
      .filter((item) => item.supportLevel === "Unsupported")
      .map((item) => item.requirement)
      .filter(Boolean);
    const buildDiagnostic = (input: {
      candidate: TailoredCv | null;
      rawResponse?: unknown;
      targetedResult?: ReturnType<typeof executeTargetedRegeneration>;
      reviewChecks?: { label: string; ok: boolean; value: string }[];
      runtimeError?: string;
      currentCvVersionId?: string;
      currentCvContentHash?: string;
      currentEffectiveCvBriefHash?: string;
      currentSelectedEvidenceIds?: string[];
      outputContractFailure?: TargetedOutputContractFailure;
    }) => buildTargetedRegenerationValidationDiagnostic({
      request,
      currentCv: activeCv.tailoredCv!,
      candidate: input.candidate,
      rawResponse: input.rawResponse,
      currentCvVersionId: input.currentCvVersionId ?? activeCvRef.current?.id ?? "",
      currentCvContentHash: input.currentCvContentHash ?? exportDecisionHashRef.current ?? "",
      currentEffectiveCvBriefHash: input.currentEffectiveCvBriefHash ?? effectiveCvBriefHashRef.current,
      currentSelectedEvidenceIds: input.currentSelectedEvidenceIds ?? job.selectedEvidenceIds,
      validEvidenceIds: data.evidenceCards.map((item) => item.id),
      unsupportedTerms,
      targetedResult: input.targetedResult,
      reviewChecks: input.reviewChecks,
      runtimeError: input.runtimeError,
      outputContractFailure: input.outputContractFailure
    });
    const logDiagnostic = (report: ValidationDiagnosticReport) => {
      if (globalThis.location?.hostname !== "127.0.0.1" && globalThis.location?.hostname !== "localhost") return;
      console.info("targeted-regeneration-validation", {
        requestId: report.requestId,
        blockerIds: report.blockerIds,
        targetZones: report.targetZones,
        checks: report.checks.map((check) => ({ validatorId: check.validatorId, ruleId: check.ruleId, status: check.status })),
        stopReason: report.stopReason,
        cvHashPrefix: report.cvContentHash.slice(0, 12),
        changedZoneCount: report.changedZones.length
      });
    };
    const finishAttempt = (
      execution: ScreeningActionExecution,
      outcome: TargetedRegenerationOutcome,
      finalStopReason: string
    ) => {
      const attempt: TargetedRegenerationAttempt = {
        ...attemptIdentity,
        outcome,
        attemptCount,
        lastAttemptedAt: attemptedAt,
        finalStopReason,
        message: execution.message
      };
      targetedRegenerationAttemptRef.current = attempt;
      setTargetedRegenerationAttempt(attempt);
      return execution;
    };
    setTargetedRegenerationStartedAt(Date.now());
    setTargetedRegenerationResultDismissed(false);
    setTargetedRegenerationLifecycle("running");
    try {
      const prompt = buildTargetedRegenerationPrompt(data, job.id, request, activeCv.tailoredCv);
      const runtimeContext = {
        requestId: command.requestId,
        blockerIds: command.blockerIds,
        targetZones: command.targetZones,
        cvVersionId: command.cvVersionId,
        cvContentHash: command.cvContentHash,
        effectiveCvBriefHash: command.effectiveCvBriefHash,
        selectedEvidenceIds: command.selectedEvidenceIds,
        failedSummaryCriterionIds: request.failedSummaryCriterionIds || []
      };
      const started = await startAutomation("screening-cv", prompt, runtimeContext);
      const completed = await waitForAutomationJob<unknown>(started.id);
      if (completed.status !== "completed" || !completed.result) {
        const reason = completed.error || (completed.status === "cancelled" ? "Targeted regeneration was cancelled." : "The automation returned no CV result.");
        throw new Error(reason);
      }
      setTargetedRegenerationLifecycle("validating");
      await new Promise<void>((resolve) => globalThis.setTimeout(resolve, 200));
      const completedContext = completed.context as Partial<TargetedRegenerationCommand> | undefined;
      const staleRuntimeContext = !completedContext
        || completedContext.requestId !== command.requestId
        || completedContext.cvVersionId !== command.cvVersionId
        || completedContext.cvContentHash !== command.cvContentHash
        || completedContext.effectiveCvBriefHash !== command.effectiveCvBriefHash
        || JSON.stringify(completedContext.blockerIds) !== JSON.stringify(command.blockerIds)
        || JSON.stringify(completedContext.targetZones) !== JSON.stringify(command.targetZones)
        || JSON.stringify(completedContext.selectedEvidenceIds) !== JSON.stringify(command.selectedEvidenceIds);
      if (staleRuntimeContext) {
        const diagnosticReport = buildDiagnostic({
          candidate: null,
          rawResponse: completed.result,
          currentCvVersionId: completedContext?.cvVersionId || "",
          currentCvContentHash: completedContext?.cvContentHash || "",
          currentEffectiveCvBriefHash: completedContext?.effectiveCvBriefHash || "",
          currentSelectedEvidenceIds: completedContext?.selectedEvidenceIds || []
        });
        logDiagnostic(diagnosticReport);
        return finishAttempt({ status: "blocked", message: formatValidationDiagnosticMessage(diagnosticReport), affectedZones: [], currentCvHash: command.cvContentHash, refresh: ["workflow", "review", "repair", "export"], remainingBlockers: exportDecision.blockers, value: { diagnosticReport } }, "stale", "runtime-context-changed");
      }
      const parsedOutput = parseTargetedRegenerationOutput({
        rawResult: completed.result,
        rawOutput: completed.rawOutput,
        request,
        currentCv: activeCv.tailoredCv,
        validEvidenceIds: data.evidenceCards.map((item) => item.id)
      });
      if (!parsedOutput.ok) {
        const diagnosticReport = buildDiagnostic({ candidate: null, rawResponse: completed.result, outputContractFailure: parsedOutput.failure });
        logDiagnostic(diagnosticReport);
        return finishAttempt({ status: "error", message: formatValidationDiagnosticMessage(diagnosticReport), affectedZones: [], currentCvHash: command.cvContentHash, refresh: ["repair"], remainingBlockers: exportDecision.blockers, value: { diagnosticReport } }, "error", "invalid-output");
      }
      const normalized = parsedOutput.candidate.cv;
      const currentCv = activeCvRef.current;
      const currentHash = exportDecisionHashRef.current;
      const result = executeTargetedRegeneration({
        cvVersion: currentCv || activeCv,
        request,
        currentCvVersionId: currentCv?.id || "",
        currentContentHash: currentHash || "",
        currentEffectiveCvBriefHash: effectiveCvBriefHashRef.current,
        currentSelectedEvidenceIds: job.selectedEvidenceIds,
        validEvidenceIds: data.evidenceCards.map((item) => item.id),
        unsupportedTerms,
        candidate: parsedOutput.candidate
      });
      if (result.status !== "success" || !result.nextVersion) {
        const message = result.status === "no-diff"
          ? "AI regeneration completed, but no safe content change was available."
          : result.status === "stale"
            ? "The CV changed before regeneration completed. Run regeneration again."
            : `${result.message} Your current CV was not modified.`;
        const execution: ScreeningActionExecution = {
          status: result.status === "no-diff" ? "no-safe-fix" : "blocked",
          message,
          affectedZones: result.changedZones,
          currentCvHash: result.resultingCvHash || result.priorCvHash,
          refresh: ["workflow", "review", "repair", "export"],
          remainingBlockers: exportDecision.blockers,
          value: (() => {
            const diagnosticReport = buildDiagnostic({ candidate: normalized, rawResponse: completed.result, targetedResult: result });
            logDiagnostic(diagnosticReport);
            return { result, diagnosticReport };
          })()
        };
        return finishAttempt(
          execution,
          result.status === "no-diff" ? "no-diff-terminal" : result.status === "stale" ? "stale" : "blocked",
          result.status === "no-diff" ? "no-safe-content-difference" : result.status
        );
      }
      const nextTailoredCv = result.nextVersion.tailoredCv;
      if (!nextTailoredCv) {
        throw new Error("Targeted regeneration completed without a tailored CV.");
      }
      const nextSections = tailoredCvToSections(nextTailoredCv);
      result.nextVersion.sections = nextSections;
      result.nextVersion.summary = nextTailoredCv.summary;
      result.nextVersion.content = composeCvContent(nextSections);
      const persistedNextVersion = sanitizeRecruiterFacingData({ ...data, cvVersions: [result.nextVersion] }).cvVersions[0];
      Object.assign(result.nextVersion, persistedNextVersion);
      result.nextVersion.reviewSnapshot = createReviewSnapshot(job, result.nextVersion, data.evidenceCards);
      const nextEvaluation = evaluateScreeningReview({ data, job, cv: result.nextVersion });
      const diagnosticReport = buildDiagnostic({
        candidate: normalized,
        rawResponse: completed.result,
        targetedResult: result,
        reviewChecks: [...(nextEvaluation.reviewerReview?.checks || []), ...(nextEvaluation.exportCheck?.checks || [])]
      });
      logDiagnostic(diagnosticReport);
      const nextExportDecision = resolveScreeningExportDecision({ data, job, cv: result.nextVersion, evaluation: nextEvaluation, requireFreshReview: true });
      const unsafeBlocker = nextExportDecision.blockers.find((blocker) => /unsupported|forbidden visible claim|claim experience/i.test(blocker));
      if (unsafeBlocker) {
        return finishAttempt({ status: "blocked", message: `AI created a new targeted CV section, but it was not applied. Blocked because: ${unsafeBlocker}. Your current CV was not changed.`, affectedZones: result.changedZones, currentCvHash: result.priorCvHash, refresh: ["review", "repair", "export"], remainingBlockers: nextExportDecision.blockers, value: { result, diagnosticReport } }, "blocked", "unsafe-wording-remains");
      }
      const summaryBlocker = result.changedZones.includes("summary")
        ? nextExportDecision.blockers.find((blocker) => /hiring manager relevance|manager relevance|summary.*role fit/i.test(blocker))
        : undefined;
      const managerReviewReason = nextEvaluation.managerReview?.risks?.[0]
        || nextEvaluation.managerReview?.rewriteRequired?.[0]
        || summaryBlocker;
      if (result.changedZones.includes("summary")) {
        result.nextVersion.reviewSnapshot = recordSummaryRepairReview({
          previousCv: activeCv,
          nextCv: result.nextVersion,
          summaryBlocker,
          reviewerReason: managerReviewReason,
          failedCriteria: (nextEvaluation.managerReview?.summaryReview.criteria || [])
            .filter((criterion) => criterion.status !== "pass")
            .map((criterion) => `${criterion.criterionId}: ${criterion.reason}`)
        });
      }
      onSaveCv(result.nextVersion);
      const changedLabel = result.changedZones.includes("summary") ? "the Summary" : result.changedZones.includes("workExperience") ? "the authorized Work Experience wording" : "the authorized CV wording";
      const remainingCopy = nextExportDecision.blockers.length
        ? ` Remaining global blockers: ${nextExportDecision.blockers.join("; ")}`
        : " No global blockers remain.";
      return finishAttempt({
        status: "success",
        message: `AI generated a valid ${changedLabel.replace(/^the /, "")} and it was applied.${remainingCopy}`,
        affectedZones: result.changedZones,
        currentCvHash: result.nextVersion.reviewSnapshot?.contentHash || result.resultingCvHash,
        refresh: ["workflow", "review", "repair", "export"],
        remainingBlockers: nextExportDecision.blockers,
        value: { result, diagnosticReport }
      }, "success", "content-updated");
    } catch (error) {
      const reason = error instanceof Error && error.message ? error.message : "The automation request failed.";
      const diagnosticReport = buildDiagnostic({ candidate: null, runtimeError: reason });
      logDiagnostic(diagnosticReport);
      return finishAttempt({
        status: "error",
        message: `${formatValidationDiagnosticMessage(diagnosticReport)} ${reason}`,
        affectedZones: [],
        currentCvHash: command.cvContentHash,
        refresh: ["workflow", "review", "repair", "export"],
        remainingBlockers: exportDecision.blockers,
        value: { diagnosticReport }
      }, "error", "runtime-error");
    } finally {
      setTargetedRegenerationLifecycle("idle");
    }
  }

  async function dispatchReviewerAction(actionId: ScreeningActionId, payload?: unknown) {
    if (reviewerActionPendingRef.current) return;
    reviewerActionPendingRef.current = true;
    const explicitTargetedRetry = actionId === "run-targeted-regeneration"
      && Boolean((payload as { explicitRetry?: boolean } | undefined)?.explicitRetry);
    if (actionId !== "run-targeted-regeneration") {
      setTargetedRegenerationAttempt(null);
      targetedRegenerationAttemptRef.current = null;
      setTargetedRegenerationResultDismissed(false);
    }
    let command: ScreeningActionCommand = { id: actionId, cvContentHash: exportDecision?.contentHash || repairPlan?.cvContentHash, payload };
    if (actionId === "run-targeted-regeneration" && activeCv && exportDecision?.contentHash && repairOrchestration?.targetedRegeneration.length && job) {
      const request = createTargetedRegenerationRequest({
        classifications: repairOrchestration.targetedRegeneration,
        selectedEvidenceIds: job.selectedEvidenceIds || [],
        effectiveCvBriefHash,
        failedSummaryCriterionIds
      });
      command = {
        id: "run-targeted-regeneration",
        requestId: request.id,
        blockerIds: request.blockerIds,
        targetZones: request.targetZones,
        cvVersionId: request.cvVersionId,
        cvContentHash: request.cvContentHash,
        effectiveCvBriefHash: request.effectiveCvBriefHash,
        selectedEvidenceIds: request.selectedEvidenceIds,
        payload: request
      } satisfies TargetedRegenerationCommand;
    }
    setReviewerActionPending(true);
    const completedActionKeys = actionId === "apply-safe-repair" || actionId === "apply-title-alignment"
      ? completedReviewerActionKeysRef.current
      : new Set<string>();
    const result = await dispatchScreeningAction({
      command,
      completedActionKeys,
      execute: async () => {
        if (actionId === "apply-safe-repair" && repairOrchestration?.recommendedNextRoute === "run-safe-repair") return executeOrchestratedSafeRepairs();
        if (actionId === "apply-safe-repair") return executeSafeLocalReviewerFix();
        if (actionId === "apply-title-alignment") return executeTitleAlignmentFix();
        if (actionId === "start-ai-repair") return executeRecommendedAiRepair();
        if (actionId === "stop-ai-repair") return executeStopReviewerAiRepair();
        if (actionId === "generate-ai-proposals") {
          return { status: "success", message: "AI suggestions are ready for review.", affectedZones: [], currentCvHash: exportDecision?.contentHash, refresh: ["repair"] };
        }
        if (actionId === "apply-accepted-proposals") return executeAcceptedProposalBatch(command.payload);
        if (actionId === "run-targeted-regeneration") return executeTargetedRegenerationAction(command, { explicitRetry: explicitTargetedRetry });
        if (actionId === "open-export") {
          return {
            status: "success",
            message: exportDecision?.ready ? "Export is ready for the current CV." : "Opening Export with the current blocking checks visible.",
            affectedZones: [],
            currentCvHash: exportDecision?.contentHash,
            refresh: ["export"],
            remainingBlockers: exportDecision?.blockers || []
          };
        }
        if (actionId === "open-guided-editor") {
          const context = command.payload as GuidedEditContext | undefined;
          if (!context?.target?.focusKey) {
            return { status: "blocked", message: "This blocker does not have a reliable field target yet.", affectedZones: [], currentCvHash: exportDecision?.contentHash, refresh: ["repair"] };
          }
          writeGuidedEditContext(context);
          return {
            status: "success",
            message: `Opening ${context.affectedField} for this blocker.`,
            affectedZones: [context.target.section],
            currentCvHash: exportDecision?.contentHash,
            refresh: ["workflow", "review", "repair", "export"],
            remainingBlockers: exportDecision?.blockers || [],
            value: context
          };
        }
        return { status: "success", message: "Opening manual CV editing for the remaining blocker.", affectedZones: [], currentCvHash: exportDecision?.contentHash, refresh: ["workflow", "repair"] };
      }
    });
    const refresh = resolveScreeningActionRefresh(result);
    if (result.status === "success" && (actionId === "apply-safe-repair" || actionId === "apply-title-alignment")) {
      completedReviewerActionKeysRef.current.add(screeningActionKey(command));
    }
    if (result.value && (actionId === "start-ai-repair" || actionId === "stop-ai-repair")) setCvRun(result.value as AutomationJob<unknown>);
    if (refresh.refreshPrimaryCta) setReviewerActionResult(result);
    setMessage(result.message);
    if (actionId === "apply-safe-repair" && result.status === "success") setLocalFixSummary(result.message);
    if (refresh.domains.includes("review")) setActiveStepView("reviewer");
    if (result.status === "success" && actionId === "open-export") onGo("export");
    if (result.status === "success" && actionId === "open-manual-editor") onGo("cv-builder");
    if (result.status === "success" && actionId === "open-guided-editor") onGo("cv-builder");
    setReviewerActionPending(false);
    reviewerActionPendingRef.current = false;
  }

  function clearDisconnectedCvRun() {
    if (!job?.screeningCvRun || !cvRunRecordActive) return;
    const message = job.screeningCvRun.jobId
      ? "Previous Codex run could not be recovered from the local automation server. No CV data was applied."
      : "Previous Codex run has no recoverable automation job id. No CV data was applied.";
    onUpdateJob({
      screeningCvRun: {
        status: "failed",
        mode: job.screeningCvRun.mode,
        jobId: job.screeningCvRun.jobId,
        lastRunAt: job.screeningCvRun.lastRunAt || new Date().toISOString(),
        lastError: message,
        inputHash: job.screeningCvRun.inputHash || screeningCvInputHash,
        estimatedInputTokens: job.screeningCvRun.estimatedInputTokens,
        applied: false
      },
      updatedAt: new Date().toISOString()
    });
    setCvRun(null);
    setMessage(message);
  }

  async function cancelCvRun() {
    const jobId = cvRun?.id || job?.screeningCvRun?.jobId;
    if (!jobId) {
      setMessage("No active Screening CV automation job id is available to stop.");
      return;
    }
    try {
      const cancelled = await cancelAutomationJob(jobId);
      setCvRun(cancelled);
      onUpdateJob({
        screeningCvRun: {
          status: "cancelled",
          mode: job?.screeningCvRun?.mode,
          jobId,
          lastRunAt: job?.screeningCvRun?.lastRunAt || new Date().toISOString(),
          lastError: cancelled.error || "Codex automation was cancelled by the user. No CV data was applied.",
          inputHash: job?.screeningCvRun?.inputHash || screeningCvInputHash,
          estimatedInputTokens: job?.screeningCvRun?.estimatedInputTokens,
          applied: false
        },
        updatedAt: new Date().toISOString()
      });
      setMessage("Screening CV automation stopped. No CV data was applied.");
    } catch (error) {
      setMessage(`Unable to stop Screening CV automation: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async function runAnalysisWithCodex() {
    if (!job) return;
    if (!aiActionsEnabled) {
      setMessage("AI actions are locked. Enable AI actions first if you intentionally want to spend tokens.");
      return;
    }
    if (!careerEvidenceReady) {
      setMessage("Build Career Evidence first. JD Analysis needs enough reusable evidence to recommend credible selections.");
      setActiveStepView("evidence");
      return;
    }
    setMessage("");
    setAnalysisStarting(true);
    const lastRunAt = new Date().toISOString();
    onUpdateJob({
      screeningAnalysisRun: {
        status: "queued",
        lastRunAt,
        lastError: "",
        inputHash: analysisInputHash,
        ...screeningContractIdentity,
          applied: false
      },
      updatedAt: new Date().toISOString()
    });
    try {
      setAnalysisRun(await startAutomation<ScreeningAnalysisAIOutput>("screening-analysis", buildScreeningAnalysisPrompt(data, job.id)));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start Codex CLI automation.";
      onUpdateJob({
        screeningAnalysisRun: {
          status: "failed",
          lastRunAt,
          lastError: message,
          inputHash: analysisInputHash,
        ...screeningContractIdentity,
          applied: false
        },
        updatedAt: new Date().toISOString()
      });
      setMessage(`Codex CLI Screening Analysis failed to start: ${message}`);
    } finally {
      setAnalysisStarting(false);
    }
  }

  async function runCvWithCodex() {
    if (!job) return;
    if (activeCv?.tailoredCv && !cvNeedsRerun && !workflowState.repairAllowed) {
      setMessage(workflowState.repairLockReason || "The current CV has already completed its AI pass. Review the final report or edit only the remaining items manually.");
      setActiveStepView("reviewer");
      return;
    }
    if (!aiActionsEnabled) {
      setMessage("AI actions are locked. Enable AI actions first if you intentionally want to spend tokens.");
      return;
    }
    if (!job.screeningAnalysis) {
      setMessage("Run Screening Analysis first. CV generation needs JD-specific recommendations.");
      setActiveStepView("analysis");
      return;
    }
    if (analysisNeedsRerun) {
      setMessage("Screening Analysis uses an older input, schema, or Prompt contract. Run Screening Analysis again before Writer generation.");
      setActiveStepView("analysis");
      return;
    }
    if (hardBlock) {
      setMessage("CV generation is blocked by the current hard block. Resolve the stated legal or practical restriction before continuing.");
      setActiveStepView("selection");
      return;
    }
    if (!generationReadiness?.ready) {
      setMessage("CV generation is blocked until JD-based evidence selections are ready. Open recommended selections first.");
      setActiveStepView("selection");
      return;
    }
    if (!briefCurrent) {
      setMessage("CV generation is blocked until the Career OS CV Brief has enough JD-specific selling points and visible evidence.");
      setActiveStepView("selection");
      return;
    }
    setMessage(shouldAvoidMoreGeneration
      ? `Token reminder: this JD already has ${cvVersionCount} CV versions. This run will update the current draft only; use CV Studio for small wording fixes.`
      : "");
    setCvStarting(true);
    const lastRunAt = new Date().toISOString();
    const cvRunMode = activeCv?.tailoredCv ? "repair" : "generate";
    const prompt = buildScreeningCvPrompt(data, job.id, cvFixContext);
    const estimatedInputTokens = estimatePromptTokens(prompt);
    onUpdateJob({
      screeningCvRun: {
        status: "queued",
        mode: cvRunMode,
        lastRunAt,
        lastError: "",
        inputHash: screeningCvInputHash,
        estimatedInputTokens,
        applied: false
      },
      updatedAt: new Date().toISOString()
    });
    try {
      const started = await startAutomation("screening-cv", prompt);
      setCvRun(started);
      onUpdateJob({
        screeningCvRun: {
          status: started.status,
          mode: cvRunMode,
          jobId: started.id,
          lastRunAt,
          lastError: "",
          inputHash: screeningCvInputHash,
          estimatedInputTokens,
          applied: false
        },
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start Codex CLI automation.";
      onUpdateJob({
        screeningCvRun: {
          status: "failed",
          mode: cvRunMode,
          lastRunAt,
          lastError: message,
          inputHash: screeningCvInputHash,
          estimatedInputTokens,
          applied: false
        },
        updatedAt: new Date().toISOString()
      });
      setMessage(`Codex CLI Screening CV failed to start: ${message}`);
    } finally {
      setCvStarting(false);
    }
  }

  const handleAnalysisPollingError = useCallback((message: string) => {
    if (!analysisRun) return;
    setAnalysisRun({ ...analysisRun, status: "failed", error: message });
    onUpdateJob({
      screeningAnalysisRun: {
        status: "failed",
        lastRunAt: job?.screeningAnalysisRun?.lastRunAt || new Date().toISOString(),
        lastError: message,
        inputHash: analysisInputHash,
        ...screeningContractIdentity,
          applied: false
      },
      updatedAt: new Date().toISOString()
    });
    setMessage(`Codex CLI Screening Analysis failed: ${message}`);
  }, [analysisInputHash, analysisRun, job?.screeningAnalysisRun?.lastRunAt, onUpdateJob]);

  const handleAnalysisLatest = useCallback((latest: AutomationJob<ScreeningAnalysisAIOutput>) => {
    if (latest.status === "running" && job?.screeningAnalysisRun?.status !== "running") {
      onUpdateJob({
        screeningAnalysisRun: {
          status: "running",
          lastRunAt: job?.screeningAnalysisRun?.lastRunAt || new Date().toISOString(),
          lastError: "",
          inputHash: analysisInputHash,
        ...screeningContractIdentity,
          applied: false
        },
        updatedAt: new Date().toISOString()
      });
    }
    if (latest.status === "completed" && latest.result) {
      if (!appliedAutomationIdsRef.current.has(latest.id)) {
        appliedAutomationIdsRef.current.add(latest.id);
        applyScreeningAnalysisResult(latest.result);
        setMessage("Codex CLI completed Screening Analysis and auto-applied the recommendations.");
      }
    }
    if (latest.status === "completed" && !latest.result) {
      const message = describeMissingAutomationResult("Codex CLI Screening Analysis", latest);
      setAnalysisRun({ ...latest, status: "failed", error: message });
      onUpdateJob({
        screeningAnalysisRun: {
          status: "failed",
          lastRunAt: job?.screeningAnalysisRun?.lastRunAt || new Date().toISOString(),
          lastError: message,
          inputHash: analysisInputHash,
        ...screeningContractIdentity,
          applied: false
        },
        updatedAt: new Date().toISOString()
      });
      setMessage(message);
    }
    if (latest.status === "failed") {
      onUpdateJob({
        screeningAnalysisRun: {
          status: "failed",
          lastRunAt: job?.screeningAnalysisRun?.lastRunAt || new Date().toISOString(),
          lastError: latest.error || "Unknown error",
          inputHash: analysisInputHash,
        ...screeningContractIdentity,
          applied: false
        },
        updatedAt: new Date().toISOString()
      });
      setMessage(`Codex CLI Screening Analysis failed: ${latest.error || "Unknown error"}`);
    }
  }, [analysisInputHash, applyScreeningAnalysisResult, job?.screeningAnalysisRun?.lastRunAt, job?.screeningAnalysisRun?.status, onUpdateJob]);

  useAutomationPolling({
    run: analysisRun,
    setRun: setAnalysisRun,
    onLatest: handleAnalysisLatest,
    onConnectionError: handleAnalysisPollingError
  });

  const handleCvPollingError = useCallback((message: string) => {
    if (!cvRun) return;
    setCvRun({ ...cvRun, status: "failed", error: message });
    onUpdateJob({
      screeningCvRun: {
        status: "failed",
        mode: job?.screeningCvRun?.mode,
        jobId: cvRun.id,
        lastRunAt: job?.screeningCvRun?.lastRunAt || new Date().toISOString(),
        lastError: message,
        inputHash: screeningCvInputHash,
        estimatedInputTokens: job?.screeningCvRun?.estimatedInputTokens,
        applied: false
      },
      updatedAt: new Date().toISOString()
    });
    setMessage(`Codex CLI Screening CV failed: ${message}`);
  }, [cvRun, job?.screeningCvRun?.estimatedInputTokens, job?.screeningCvRun?.lastRunAt, job?.screeningCvRun?.mode, onUpdateJob, screeningCvInputHash]);

  const handleCvLatest = useCallback((latest: AutomationJob<unknown>) => {
    if (latest.status === "running" && job?.screeningCvRun?.status !== "running") {
      onUpdateJob({
        screeningCvRun: {
          status: "running",
          mode: job?.screeningCvRun?.mode,
          jobId: latest.id,
          lastRunAt: job?.screeningCvRun?.lastRunAt || new Date().toISOString(),
          lastError: "",
          inputHash: screeningCvInputHash,
          estimatedInputTokens: job?.screeningCvRun?.estimatedInputTokens,
          applied: false
        },
        updatedAt: new Date().toISOString()
      });
    }
    if (latest.status === "completed" && latest.result) {
      if (!appliedAutomationIdsRef.current.has(latest.id)) {
        appliedAutomationIdsRef.current.add(latest.id);
        const ok = applyScreeningCvResult(latest.result);
        if (ok) setMessage(job?.screeningCvRun?.mode === "repair"
          ? "Codex CLI applied one targeted repair to the current CV. Remaining checks are shown in the final report."
          : "Codex CLI generated and saved the Screening CV. Local Gate, Manager, and ATS checks are complete.");
      }
    }
    if (latest.status === "completed" && !latest.result) {
      const message = describeMissingAutomationResult("Codex CLI Screening CV", latest);
      setCvRun({ ...latest, status: "failed", error: message });
      onUpdateJob({
        screeningCvRun: {
          status: "failed",
          mode: job?.screeningCvRun?.mode,
          jobId: latest.id,
          lastRunAt: job?.screeningCvRun?.lastRunAt || new Date().toISOString(),
          lastError: message,
          inputHash: screeningCvInputHash,
          estimatedInputTokens: job?.screeningCvRun?.estimatedInputTokens,
          applied: false
        },
        updatedAt: new Date().toISOString()
      });
      setMessage(message);
    }
    if (latest.status === "failed") {
      onUpdateJob({
        screeningCvRun: {
          status: "failed",
          mode: job?.screeningCvRun?.mode,
          jobId: latest.id,
          lastRunAt: job?.screeningCvRun?.lastRunAt || new Date().toISOString(),
          lastError: latest.error || "Unknown error",
          inputHash: screeningCvInputHash,
          estimatedInputTokens: job?.screeningCvRun?.estimatedInputTokens,
          applied: false
        },
        updatedAt: new Date().toISOString()
      });
      setMessage(`Codex CLI Screening CV failed: ${latest.error || "Unknown error"}`);
    }
    if (latest.status === "cancelled") {
      onUpdateJob({
        screeningCvRun: {
          status: "cancelled",
          mode: job?.screeningCvRun?.mode,
          jobId: latest.id,
          lastRunAt: job?.screeningCvRun?.lastRunAt || new Date().toISOString(),
          lastError: latest.error || "Codex automation was cancelled by the user. No CV data was applied.",
          inputHash: screeningCvInputHash,
          estimatedInputTokens: job?.screeningCvRun?.estimatedInputTokens,
          applied: false
        },
        updatedAt: new Date().toISOString()
      });
      setMessage("Screening CV automation stopped. No CV data was applied.");
    }
  }, [applyScreeningCvResult, job?.screeningCvRun?.estimatedInputTokens, job?.screeningCvRun?.lastRunAt, job?.screeningCvRun?.mode, job?.screeningCvRun?.status, onUpdateJob, screeningCvInputHash]);

  useEffect(() => {
    if (!cvRun || (cvRun.status !== "completed" && cvRun.status !== "failed")) return;
    handleCvLatest(cvRun);
  }, [cvRun, handleCvLatest]);

  useAutomationPolling({
    run: cvRun,
    setRun: setCvRun,
    onLatest: handleCvLatest,
    onConnectionError: handleCvPollingError
  });

  if (!job) {
    return (
      <PageHeader title="Screening Lab" subtitle="Paste one JD, analyze what screening wants, then generate a stronger screening CV.">
        <section className="home-hero panel">
          <div>
            <span className="eyebrow">Primary workflow</span>
            <h2>Start from one target JD</h2>
            <p>Create a temporary screening workspace first. You can refine evidence later.</p>
          </div>
        </section>
        <section className="panel screening-intake">
          <div className="panel-head">
            <h3>Quick JD Intake</h3>
            <button className="secondary small" onClick={() => onGo("jd-intake")}>Open full JD Intake</button>
          </div>
          <div className="home-grid">
            <div className="home-actions">
              <Field label="Company (optional)" value={draftCompany} onChange={setDraftCompany} />
              <Field label="Role (optional)" value={draftRole} onChange={setDraftRole} />
              <Field label="Location (optional)" value={draftLocation} onChange={setDraftLocation} />
            </div>
            <div>
              <Textarea label="Paste raw JD" value={draftRawJd} onChange={setDraftRawJd} rows={14} />
              <div className="panel-actions">
                <button className="primary" disabled={!draftRawJd.trim()} onClick={createScreeningJob}>Create screening workspace</button>
              </div>
            </div>
          </div>
        </section>
      </PageHeader>
    );
  }

  return (
    <PageHeader
      title="Screening Lab"
      subtitle="Make one JD easier to pass HR and ATS screening before you spend time polishing the rest."
      action={<button className="secondary" onClick={() => onGo("jd-intake")}>Edit JD</button>}
    >
      <section className="panel home-opportunities compact-opportunity-switcher priority-opportunity-switcher">
        <div className="target-jd-strip">
          <div>
            <span className="eyebrow">Current target JD</span>
            <strong>{job.role || "Untitled role"} · {job.company || "Company unknown"}</strong>
            <p>Screening Lab works on one selected JD. To choose another job, go back to Opportunities.</p>
          </div>
          <button className="secondary small" onClick={() => onGo("inbox")}>Change JD in Opportunities</button>
        </div>
      </section>

      <section className="panel screening-command-card">
        <div className="screening-command-main">
          <div>
            <span className="eyebrow">Current JD being worked on</span>
            <h2>{job.role || "Untitled role"}</h2>
            <p>{job.company || "Company unknown"} · {job.location || "Location not set"} · {job.status}</p>
          </div>
          <div className="screening-metrics">
            <span><strong>{job.selectedEvidenceIds.length}</strong> Evidence</span>
            <span><strong>{job.selectedStoryIds.length}</strong> STAR</span>
            <span><strong>{cvVersionCount}</strong> CV version</span>
            <span className={gateHasBlockingFixes ? "warn" : "ok"}>
              {gate ? (gateHasBlockingFixes ? `${gateBlockingFixes.length} blocking fix(es)` : gateManualFixes.length ? `Gate ready · ${gateManualFixes.length} manual fix` : "Gate ready") : "Gate pending"}
            </span>
            <span className={managerReview?.rewriteRequired.length ? "warn" : managerReview ? "ok" : ""}>
              {managerReview ? `${managerReview.wouldInterview} interview` : "Manager review pending"}
            </span>
          </div>
        </div>
        <details className="fit-explainer">
          <summary>
            <span>Why {job.fit} fit?</span>
            <small>Show reasons, strong matches, and blockers</small>
          </summary>
          {job.fitReview ? (
            <div className="fit-explainer-grid">
              <MiniReasonList title="Strong match reasons" items={job.fitReview.strongMatches} />
              <MiniReasonList title="Screening blockers / risks" items={job.fitReview.gaps} danger />
              <MiniReasonList title="What employer is really screening for" items={job.fitReview.employerSignals} />
              {job.fitReview.positioningAdvice ? (
                <div className="fit-explainer-note">
                  <span>Positioning</span>
                  <p>{job.fitReview.positioningAdvice}</p>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="section-note">Run Fit Review to explain the fit score.</p>
          )}
        </details>
      </section>

      {message && <div className="save-status">{compactUiMessage(message)}</div>}

      {cvRunDisconnected ? (
        <section className="panel disconnected-run-panel">
          <div>
            <span className="eyebrow">Disconnected Codex run</span>
            <strong>Previous CV patch is not attached to an active browser job.</strong>
            <p>
              {job.screeningCvRun?.jobId
                ? "This page will try to recover the saved automation job. If it cannot be recovered, clear the stale run before starting another action."
                : "This run was recorded before job recovery was available, so the app cannot reconnect to it. No CV data has been applied."}
            </p>
          </div>
          <button className="secondary" onClick={clearDisconnectedCvRun}>Clear stale run</button>
        </section>
      ) : null}

      <section className="panel ai-action-lock-panel">
        <div>
          <span className="eyebrow">Token protection</span>
          <h3>AI actions are locked by default</h3>
          <p className="section-note">
            Review, edit, manual paste-back, CV Studio, local fixes, and export checks are safe. Only actions labeled "Uses AI tokens" need this switch.
          </p>
        </div>
        <label className="ai-action-lock-toggle">
          <input
            type="checkbox"
            checked={aiActionsEnabled}
            onChange={(event) => setAiActionsEnabled(event.target.checked)}
          />
          <span>{aiActionsEnabled ? "AI actions enabled" : "Enable AI actions"}</span>
        </label>
      </section>

      <section className="panel screening-mode-strip">
        <div className="panel-head">
          <h3><Briefcase size={16} /> Action checklist</h3>
          <p className="section-note">Current identity decides completion. Historical results are shown separately and never unlock this workflow.</p>
        </div>
        <div className="screening-mode-grid">
          {checklistState.steps.map((step, index) => (
            <button
              key={step.id}
              type="button"
              aria-current={checklistState.currentStepId === step.id ? "step" : undefined}
              aria-label={`${step.title}: ${step.status}. ${step.detail}`}
              className={[
                "screening-mode-card",
                `state-${step.status.toLowerCase()}`,
                checklistState.currentStepId === step.id ? "current-action" : "",
                activeStepView === step.view ? "active" : ""
              ].filter(Boolean).join(" ")}
              onClick={() => openStepView(step.view)}
            >
              <span>{index + 1}</span>
              <strong>{step.title}</strong>
              <p>{step.detail}</p>
              {step.historicalDetail ? <small className="step-historical">{step.historicalDetail}</small> : null}
              <StepCompletedAt value={step.status === "DONE" ? checklistTimestamp(step.id) : undefined} label={step.status === "DONE" ? "Current binding" : undefined} />
            </button>
          ))}
        </div>
      </section>

      <section className="screening-lab-grid single-column" id="screening-workflow-panel">
        <div className="screening-lab-main">
          {activeStepView === "evidence" ? (
          <section className="panel screening-step">
            <div className="workflow-step-head">
              <span>1</span>
              <div>
                <h3>Career Evidence foundation</h3>
                <p>Reusable evidence must exist before this system can map a JD to a credible CV.</p>
              </div>
            </div>
            <div className="screening-run-grid">
              <article>
                <span>Skills</span>
                <strong>{data.skillInferences.length}</strong>
              </article>
              <article>
                <span>Domain / process signals</span>
                <strong>{data.domainKnowledge.length}</strong>
              </article>
              <article>
                <span>Evidence cards</span>
                <strong>{data.evidenceCards.length}</strong>
              </article>
              <article>
                <span>STAR stories</span>
                <strong>{data.starStories.length}</strong>
              </article>
            </div>
            <div className="evidence-integrity-grid">
              {evidenceReview.checks.map((check) => (
                <div className={check.ok ? "screening-gate-pass" : "screening-gate-fail"} key={check.label}>
                  <strong>{check.label}</strong>
                  <span>{check.value}</span>
                </div>
              ))}
            </div>
            <div className="screening-gate-next">
              <div>
                <span className="eyebrow">What to do now</span>
                <strong>{careerEvidenceReady && evidenceReview.completeEnough ? "Evidence bank is usable." : "Build or refresh Career Evidence first."}</strong>
                <p>{careerEvidenceReady && evidenceReview.completeEnough ? "You can continue to JD Analysis." : "The CV should not be generated from a thin evidence bank. Add external wording, claim controls, and grounded evidence before generating a final CV."}</p>
              </div>
              <div className="screening-gate-actions">
                <button className="primary" onClick={() => onGo("career-source")}>Open Career Evidence</button>
                {careerEvidenceReady ? <button className="secondary" onClick={() => openStepView("analysis")}>Continue to JD Analysis</button> : null}
              </div>
            </div>
          </section>
          ) : null}

          {activeStepView === "analysis" ? (
          <section className="panel screening-step">
            <div className="workflow-step-head">
              <span>2</span>
              <div>
                <h3>JD Analysis</h3>
                <p>Read this JD, infer market pattern, then recommend the strongest evidence picks. This step should happen before CV generation.</p>
              </div>
            </div>
            <div className="panel-actions">
              <button
                className={aiActionsEnabled ? "primary" : "primary locked"}
                onClick={() => { void runAnalysisWithCodex(); }}
                disabled={!careerEvidenceReady || analysisRunActive}
                title={aiActionsEnabled ? aiTokenTitle : aiLockedTitle}
              >
                {analysisRunActive ? "Running Screening Analysis..." : aiActionsEnabled ? "Run with Codex CLI" : "Enable AI to run JD Analysis"}
              </button>
              <AiActionTimestamp run={job.screeningAnalysisRun} />
              <small>{renderRunState(job.screeningAnalysisRun, analysisNeedsRerun, analysisRun, analysisStarting)}</small>
            </div>
            <AutomationStatusCard
              label="Screening Analysis"
              run={job.screeningAnalysisRun}
              activeRun={analysisRun}
              starting={analysisStarting}
              needsRerun={analysisNeedsRerun}
              clockTick={clockTick}
            />
            {sourceUrlWarning ? <p className="fit-warning">{sourceUrlWarning}</p> : null}
            {latestAnalysisResult ? (
              <section className="screening-run-result">
                <div className="screening-run-result-head">
                  <strong>Latest applied result</strong>
                  <span>{job.screeningAnalysisRun?.applied ? "Applied to this JD" : "Loaded from current JD state"}</span>
                </div>
                <div className="screening-run-grid">
                  <article>
                    <span>Primary title</span>
                    <strong>{latestAnalysisResult.primaryTargetTitle || "Not set"}</strong>
                  </article>
                  <article>
                    <span>Hard gates</span>
                    <strong>{latestAnalysisResult.requirementMatrix?.filter((row) => row.hardBlock).length || 0}</strong>
                  </article>
                  <article>
                    <span>Recommended evidence</span>
                    <strong>{latestAnalysisResult.requirementMatrix
                      ? new Set(latestAnalysisResult.requirementMatrix.flatMap((row) => row.matchingEvidenceIds)).size
                      : job.screeningAnalysis?.recommendedEvidenceIds?.length || 0}</strong>
                  </article>
                  <article>
                    <span>{analysisNeedsRerun ? "Historical market role family" : "Market role family"}</span>
                    <strong>{latestAnalysisResult.jobClassification?.marketRoleFamily || "Legacy result"}</strong>
                  </article>
                  <article>
                    <span>Missing keywords</span>
                    <strong>{latestAnalysisResult.missingKeywords.length}</strong>
                  </article>
                </div>
                <p>{latestAnalysisResult.summaryAngle}</p>
                <div className="screening-run-meta">
                  <span>Last run: {formatRunAt(job.screeningAnalysisRun?.lastRunAt)}</span>
                  <span>Historical run status: {job.screeningAnalysisRun?.status || "idle"}</span>
                  <span>{analysisNeedsRerun ? "Current contract authorization: stale — rerun required" : "Current contract authorization: current"}</span>
                </div>
                <details className="screening-json-preview">
                  <summary>View analysis JSON</summary>
                  <pre>{JSON.stringify(latestAnalysisResult, null, 2)}</pre>
                </details>
              </section>
            ) : null}
            <details className="advanced-backbone-fallback">
              <summary>Advanced fallback: manual prompt copy / paste-back</summary>
              <p>Use this only if local Codex CLI is unavailable or returns bad JSON. Normal path is the button above.</p>
              <p className="screening-contract-identity">
                Screening contract version: {SCREENING_AI_SCHEMA_VERSION} · Schema hash: {screeningAiSchemaHash.slice(0, 10)}
              </p>
                <ManualAiPanel
                prompt={buildScreeningAnalysisPrompt(data, job.id)}
                inputLabel="Input Data: JD + safe screening context"
                inputValue={job.parsed ? JSON.stringify(job.parsed, null, 2) : job.rawJD}
                readOnlyInput
                pasteLabel="Paste GPT Screening Analysis JSON Back"
                pasteValue={analysisPasteBack}
                onPasteChange={setAnalysisPasteBack}
                onParse={() => setAnalysisPreview(parseScreeningAnalysisAIOutput(analysisPasteBack))}
              />
              <ParsePreviewCard preview={analysisPreview} onApply={applyScreeningAnalysis} applyLabel="Apply Screening Analysis" />
            </details>
          </section>
          ) : null}

          {activeStepView === "translation" ? (
          <section className="panel screening-step">
            <div className="workflow-step-head">
              <span>3</span>
              <div>
                <h3>Internal Terms + Remaining Gaps</h3>
                <p>Translate company-only wording before it enters the CV, and keep unsupported JD requirements out of visible claims.</p>
              </div>
            </div>
            {job.screeningAnalysis && terminologyReview ? (
              <>
                <div className="screening-gate-list">
                  {terminologyReview.checks.map((check) => (
                    <div className={check.ok ? "screening-gate-pass" : "screening-gate-fail"} key={check.label}>
                      <strong>{check.label}</strong>
                      <span>{check.value}</span>
                    </div>
                  ))}
                </div>
                {terminologyReview.unmappedBlockedTerms.length || terminologyReview.highRiskGaps.length ? (
                  <div className="screening-gate-next">
                    <div>
                      <span className="eyebrow">Warning, not blocked</span>
                      <strong>Use safe wording in the CV; do not keep company-only terms visible.</strong>
                      <p>
                        {analysisRunActive
                          ? "JD Analysis is still running. This step is not complete yet; wait until the run status changes to completed or failed."
                          : "You can continue to the CV Brief now. The CV prompt will use the terminology table and gap list as guardrails; the Gate will catch any internal terms that still appear in the final CV."}
                      </p>
                    </div>
                    <div className="screening-gate-actions">
                      <button className="primary" onClick={() => openStepView("selection")} disabled={analysisRunActive}>
                        Continue to CV Brief
                      </button>
                      <button
                        className={aiActionsEnabled ? "secondary" : "secondary locked"}
                        onClick={() => { void runAnalysisWithCodex(); }}
                        disabled={analysisRunActive}
                        title={aiActionsEnabled ? "Uses AI tokens." : "Locked to prevent token use. Enable AI actions first."}
                      >
                        {analysisRunActive ? "Analysis still running..." : aiActionsEnabled ? "Refresh JD Analysis" : "Enable AI to refresh JD Analysis"}
                      </button>
                      <AiActionTimestamp run={job.screeningAnalysisRun} />
                      <button className="secondary" onClick={() => onGo("career-source")}>Open Career Evidence</button>
                    </div>
                  </div>
                ) : (
                  <div className="screening-gate-next">
                    <div>
                      <span className="eyebrow">What to do now</span>
                      <strong>Terminology and gaps are ready for CV planning.</strong>
                      <p>Unsupported requirements stay as risks. Supported requirements move into the CV Brief and visible bullets.</p>
                    </div>
                    <button className="primary" onClick={() => openStepView("selection")}>Continue to CV Brief</button>
                  </div>
                )}
                <TerminologyTable items={job.screeningAnalysis.internalTerminology || []} selectedBlockedTerms={terminologyReview.selectedBlockedTerms} />
                <EvidenceMappingList items={job.screeningAnalysis.requirementMatrix || []} sourceInventory={canonicalRequirementInventory} />
              </>
            ) : (
              <div className="screening-gate-next">
                <div>
                  <span className="eyebrow">Blocked</span>
                  <strong>Run JD Analysis first.</strong>
                  <p>The terminology table and gap list come from the JD-to-evidence analysis.</p>
                </div>
                <button className="primary" onClick={() => openStepView("analysis")}>Go to JD Analysis</button>
              </div>
            )}
          </section>
          ) : null}

          {activeStepView === "selection" ? (
          <section className="panel screening-step">
            <div className="workflow-step-head">
              <span>4</span>
              <div>
                <h3>CV Brief + JD-based Evidence Selection</h3>
                <p>Use JD Analysis to choose evidence, then lock the hiring story before generating the CV.</p>
              </div>
            </div>
            {job.screeningAnalysis ? (
              <>
                {checklistState.lowFitContinuationAllowed && !briefCurrent ? (
                  <section className="positioning-decision-card low-fit-continuation" aria-label="Low fit continuation decision">
                    <span className="eyebrow">LOW FIT · advisory, not a generation prohibition</span>
                    <strong>A truthful CV can still be generated from supported transferable evidence.</strong>
                    <p>Hard gates: 0 · Continue only with conservative positioning; unsupported platform-engineering claims remain excluded.</p>
                    <MiniTagList title="Supported evidence clusters" items={derivedPositioningReport?.lowFitAnalysis?.credibleOverlaps || []} />
                    <MiniTagList title="Claims excluded" items={job.screeningAnalysis.positioning?.claimsToAvoid || []} danger />
                    <div className="screening-gate-actions">
                      <button className="primary" onClick={applyRecommendedSelections}>Apply recommendations and create CV Brief</button>
                      <button className="secondary" onClick={reviewRecommendedSelections}>Review evidence selection</button>
                    </div>
                  </section>
                ) : null}
                <div className="screening-run-grid">
                  <article>
                    <span>Recommended skills</span>
                    <strong>{job.screeningAnalysis.recommendedSkillIds?.length || 0}</strong>
                  </article>
                  <article>
                    <span>Recommended domain/process</span>
                    <strong>{job.screeningAnalysis.recommendedDomainKnowledgeIds?.length || 0}</strong>
                  </article>
                  <article>
                    <span>Recommended evidence</span>
                    <strong>{job.screeningAnalysis.recommendedEvidenceIds?.length || 0}</strong>
                  </article>
                  <article>
                    <span>Recommended STAR</span>
                    <strong>{job.screeningAnalysis.recommendedStoryIds?.length || 0}</strong>
                  </article>
                </div>
                <div className="screening-gate-next">
                  <div>
                    <span className="eyebrow">What to do now</span>
                    <strong>{briefCurrent ? "CV Brief is ready for generation." : checklistState.lowFitContinuationAllowed ? "Apply truthful LOW_FIT recommendations here." : "Apply the JD recommendations here."}</strong>
                    <p>{briefCurrent ? "The next CV will be generated from the current CV Brief, not from a raw evidence dump." : checklistState.lowFitContinuationAllowed ? "This is an explicit user decision. It selects only supported evidence and keeps unsupported engineering claims excluded." : "This applies JD recommendations, supplements missing career evidence, and builds the CV Brief. Manual review is only for clearly wrong picks."}</p>
                  </div>
                  <div className="screening-gate-actions">
                    {briefCurrent ? (
                      <button className="primary" onClick={() => openStepView("cv")}>Generate CV from Brief</button>
                    ) : (
                      <button className="primary" onClick={applyRecommendedSelections}>Apply recommendations + build brief</button>
                    )}
                    <button className="secondary" onClick={reviewRecommendedSelections}>Manually review selections</button>
                  </div>
                </div>
                {cvBrief ? (
                  <section className="screening-run-result">
                    <div className="screening-run-result-head">
                      <strong>Career OS CV Brief</strong>
                      <span>{cvBrief.mustShowEvidenceIds.length} must-show evidence · {cvBrief.top3SellingPoints.length} selling point(s)</span>
                    </div>
                    <div className="screening-run-grid">
                      <article>
                        <span>Target positioning</span>
                        <strong>{cvBrief.cvHeadline}</strong>
                      </article>
                      <article>
                        <span>Manager problem</span>
                        <strong>{cvBrief.managerHiringProblem}</strong>
                      </article>
                    </div>
                    <MiniReasonList
                      title="Top selling points the CV must prove"
                      items={cvBrief.top3SellingPoints.map((item) => `${item.title}: ${item.managerValue}`)}
                    />
                    <MiniTagList title="Skills to foreground" items={cvBrief.skillsToForeground} />
                    <MiniTagList title="Claims / distractions to suppress" items={cvBrief.claimsToAvoid} danger />
                  </section>
                ) : null}
                <div className="screening-gate-list">
                  {generationReadiness?.checks.map((check) => (
                    <div className={check.ok ? "screening-gate-pass" : "screening-gate-fail"} key={check.label}>
                      <strong>{check.label}</strong>
                      <span>{check.ok ? check.value : `${check.value} · ${check.action}`}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="screening-gate-next">
                <div>
                  <span className="eyebrow">Blocked</span>
                  <strong>Run JD Analysis first.</strong>
                  <p>Evidence selection must be based on this JD's screening pattern, not manual guessing.</p>
                </div>
                <button className="primary" onClick={() => openStepView("analysis")}>Go to JD Analysis</button>
              </div>
            )}
          </section>
          ) : null}

          {activeStepView === "cv" ? (
          <section className="panel screening-step">
            <div className="workflow-step-head">
              <span>5</span>
              <div>
                <h3>Generate Screening CV</h3>
                <p>First run should generate a complete reviewer-ready CV. Repair runs should change only failed checks.</p>
              </div>
            </div>
            {!generationReadiness?.ready || !cvBriefReady ? (
              <div className="screening-gate-next">
                <div>
                  <span className="eyebrow">Blocked</span>
                  <strong>CV Brief is not ready.</strong>
                  <p>Generating now will produce a thin or generic CV. Apply JD recommendations and build the brief first.</p>
                </div>
                <button className="primary" onClick={() => openStepView("selection")}>Review CV Brief + evidence</button>
              </div>
            ) : null}
            <div className="panel-actions">
              <button
                className={aiActionsEnabled ? "primary" : "primary locked"}
                onClick={() => { void runCvWithCodex(); }}
                disabled={cvAiActionUnavailable || cvRunActive}
                title={activeCv?.tailoredCv && !cvNeedsRerun && !workflowState.repairAllowed
                  ? "AI pass already completed. Use the final report or manual edit."
                  : aiActionsEnabled ? aiTokenTitle : aiLockedTitle}
              >
                {cvRunActive
                  ? "Patching Screening CV..."
                  : !aiActionsEnabled
                    ? activeCvContentAudit.length || gateHasBlockingFixes || failedReviewerExportChecks.length
                      ? "Enable AI to patch failed checks"
                      : "Enable AI to generate CV"
                  : activeCv?.tailoredCv && !cvNeedsRerun && !workflowState.repairAllowed
                    ? "AI pass complete"
                    : activeCvContentAudit.length || gateHasBlockingFixes || failedReviewerExportChecks.length
                      ? "Patch failed checks only"
                      : "Run one-pass CV generation"}
              </button>
              {cvRunActive ? (
                <button className="danger" onClick={() => { void cancelCvRun(); }}>
                  Stop Screening CV
                </button>
              ) : null}
              <AiActionTimestamp run={job.screeningCvRun} />
              <small>{renderRunState(job.screeningCvRun, cvNeedsRerun, cvRun, cvStarting)}</small>
            </div>
            <AutomationStatusCard
              label="Screening CV"
              run={job.screeningCvRun}
              activeRun={cvRun}
              starting={cvStarting}
              needsRerun={cvNeedsRerun}
              clockTick={clockTick}
            />
            {normalizedLatestCvResult ? (
              <section className="screening-run-result">
                <div className="screening-run-result-head">
                  <strong>Latest CV result</strong>
                  <span>{job.screeningCvRun?.applied ? "Saved as a CV version" : "Loaded from current CV state"}</span>
                </div>
                <div className="screening-run-grid">
                  <article>
                    <span>Visible title</span>
                    <strong>{normalizedLatestCvResult.header.targetRole || "Not set"}</strong>
                  </article>
                  <article>
                    <span>Work history blocks</span>
                    <strong>{normalizedLatestCvResult.workExperience.length || 0}</strong>
                  </article>
                  <article>
                    <span>Review notes</span>
                    <strong>{normalizedLatestCvResult.reviewNotes.length || 0}</strong>
                  </article>
                </div>
                <p>{normalizedLatestCvResult.summary || "No summary generated yet."}</p>
                <div className="screening-run-meta">
                  <span>Last run: {formatRunAt(job.screeningCvRun?.lastRunAt)}</span>
                  <span>Status: {job.screeningCvRun?.status || "idle"}</span>
                  <span>{cvNeedsRerun ? "Needs rerun" : "Current input matches last run"}</span>
                </div>
                <details className="screening-json-preview">
                  <summary>View CV JSON</summary>
                  <pre>{JSON.stringify(normalizedLatestCvResult, null, 2)}</pre>
                </details>
              </section>
            ) : null}
            <details className="advanced-backbone-fallback">
              <summary>Advanced fallback: manual prompt copy / paste-back</summary>
              <p>Use this only if the automated Codex run fails. The app will still accept the same JSON schema as before.</p>
              {analysisNeedsRerun ? (
                <p className="fit-warning">Run Screening Analysis with the current schema and Prompt contract before copying a Writer prompt.</p>
              ) : (
              <ManualAiPanel
                prompt={buildScreeningCvPrompt(data, job.id, cvFixContext)}
                inputLabel="Input Data: screening analysis + selected evidence"
                inputValue={JSON.stringify({
                  screeningAnalysis: job.screeningAnalysis || null,
                  careerOsCvBrief: cvBrief,
                  selectedEvidenceIds: job.selectedEvidenceIds,
                  selectedStoryIds: job.selectedStoryIds,
                  cvPromptInput: buildCvPromptInput(data, job)
                }, null, 2)}
                readOnlyInput
                pasteLabel="Paste GPT Screening CV JSON Back"
                pasteValue={cvPasteBack}
                onPasteChange={setCvPasteBack}
                onParse={() => setCvPreview(tryParseJson<unknown>(cvPasteBack))}
              />
              )}
              <ParsePreviewCard preview={cvPreview} onApply={applyScreeningCv} applyLabel="Apply Screening CV" />
            </details>
          </section>
          ) : null}

          {activeStepView === "analysis" ? (
          <section className="panel screening-summary">
            <div className="panel-head">
              <h3><Search size={16} /> Screening Analysis</h3>
            </div>
            {job.screeningAnalysis ? (
              <div className="screening-summary-body">
                <div>
                  <span className="eyebrow">Primary title</span>
                  <strong>{job.screeningAnalysis.primaryTargetTitle || "Not set"}</strong>
                </div>
                {job.screeningAnalysis.jdBreakdown ? (
                  <JdBreakdownPanel breakdown={job.screeningAnalysis.jdBreakdown} />
                ) : null}
                {job.screeningAnalysis.jobClassification ? (
                  <div className="screening-run-grid">
                    <article><span>Employment role type</span><strong>{job.parsed?.roleType || "Unknown"}</strong></article>
                    <article><span>Market role family</span><strong>{job.screeningAnalysis.jobClassification.marketRoleFamily}</strong></article>
                    <article><span>AI market archetype</span><strong>{job.screeningAnalysis.jobClassification.aiMarketArchetype}</strong></article>
                  </div>
                ) : <p className="fit-warning">Legacy Screening classification. Run Screening again for canonical role family and requirement coverage.</p>}
                {derivedPositioningReport?.fitDimensions ? (
                  <div className="screening-run-grid">
                    <article><span>Overall fit tier</span><strong>{derivedPositioningReport.fitClassification}</strong></article>
                    <article><span>Current capability fit</span><strong>{derivedPositioningReport.fitDimensions.currentCapabilityFit}</strong></article>
                    <article><span>Direct evidence fit</span><strong>{derivedPositioningReport.fitDimensions.directEvidenceFit}</strong></article>
                    <article><span>Transferability</span><strong>{derivedPositioningReport.fitDimensions.transferability}</strong></article>
                    <article><span>Screening risk</span><strong>{derivedPositioningReport.fitDimensions.screeningRisk}</strong></article>
                    <article><span>Application viability</span><strong>{derivedPositioningReport.fitDimensions.applicationViability}</strong></article>
                    <article><span>Application priority</span><strong>{derivedPositioningReport.fitDimensions.applicationPriority}</strong></article>
                    <article><span>Generation recommendation</span><strong>{derivedPositioningReport.fitDimensions.generationRecommendation}</strong></article>
                    <article><span>Manual override</span><strong>{derivedPositioningReport.fitDimensions.manualOverrideAllowed ? "Available" : "Unavailable"}</strong></article>
                  </div>
                ) : null}
                {job.screeningAnalysis.positioning ? (
                  <div className="positioning-decision-card">
                    <div>
                      <span className="eyebrow">Positioning decision</span>
                      <strong>{job.screeningAnalysis.candidatePositioning?.headlineRecommendation || job.screeningAnalysis.positioning.headlineRecommendation}</strong>
                      <p>{job.screeningAnalysis.positioning.safestPositioning}</p>
                      {job.screeningAnalysis.positioning.primaryHiringProblem ? (
                        <p><b>Hiring problem:</b> {job.screeningAnalysis.positioning.primaryHiringProblem}</p>
                      ) : null}
                      {job.screeningAnalysis.positioning.managerHireReason ? (
                        <p><b>Why a manager might hire:</b> {job.screeningAnalysis.positioning.managerHireReason}</p>
                      ) : null}
                      {job.screeningAnalysis.positioning.toolApplicationAngle ? (
                        <p><b>Tool application angle:</b> {job.screeningAnalysis.positioning.toolApplicationAngle}</p>
                      ) : null}
                    </div>
                    <div className="screening-tags"><span>Candidate positioning</span></div>
                    <MiniTagList title="Hidden skills to surface" items={job.screeningAnalysis.positioning.hiddenSkillsToSurface || []} />
                    <MiniTagList title="Positioning rationale" items={job.screeningAnalysis.positioning.positioningRationale || []} />
                    <MiniTagList title="Claims to avoid" items={job.screeningAnalysis.positioning.claimsToAvoid || []} danger />
                    <MiniTagList title="Evidence to suppress" items={job.screeningAnalysis.positioning.evidenceToSuppress || []} danger />
                  </div>
                ) : null}
                {derivedPositioningReport?.opportunityAnalysis ? (
                  <div className="positioning-decision-card">
                    <span className="eyebrow">Medium-fit opportunity analysis</span>
                    <MiniTagList title="Why this candidate could win" items={derivedPositioningReport.opportunityAnalysis.whyCandidateCouldWin} />
                    <MiniTagList title="Differentiated strengths" items={derivedPositioningReport.opportunityAnalysis.differentiatedStrengths} />
                    <MiniTagList title="Credible transferable strengths" items={derivedPositioningReport.opportunityAnalysis.credibleTransferableStrengths} />
                    <MiniTagList title="Learnable gaps" items={derivedPositioningReport.opportunityAnalysis.learnableGaps} />
                    <MiniTagList title="Core risks" items={derivedPositioningReport.opportunityAnalysis.coreRisks} danger />
                    <MiniTagList title="Recommended preparation" items={derivedPositioningReport.opportunityAnalysis.recommendedPreparation} />
                  </div>
                ) : null}
                {derivedPositioningReport?.lowFitAnalysis ? (
                  <div className="positioning-decision-card">
                    <span className="eyebrow">Low-fit transition analysis</span>
                    <MiniTagList title="Credible overlaps" items={derivedPositioningReport.lowFitAnalysis.credibleOverlaps} />
                    <MiniTagList title="Why core fit is low" items={derivedPositioningReport.lowFitAnalysis.whyCoreFitIsLow} danger />
                    <MiniTagList title="Short-term unbridgeable gaps" items={derivedPositioningReport.lowFitAnalysis.coreUnbridgeableShortTermGaps} danger />
                    <MiniTagList title="Future transition path" items={derivedPositioningReport.lowFitAnalysis.futureTransitionPath} />
                    <MiniTagList title="Better adjacent roles" items={derivedPositioningReport.lowFitAnalysis.betterAdjacentRoles} />
                    <MiniTagList title="Recommended preparation" items={derivedPositioningReport.lowFitAnalysis.recommendedPreparation} />
                  </div>
                ) : null}
                <MarketReferenceSignalList items={job.screeningAnalysis.marketReferenceSignals || []} />
                <EvidenceMappingList items={job.screeningAnalysis.requirementMatrix || []} sourceInventory={canonicalRequirementInventory} />
                <TerminologyTable items={job.screeningAnalysis.internalTerminology || []} selectedBlockedTerms={terminologyReview?.selectedBlockedTerms || []} compact />
                <AmbiguousSignalList items={job.screeningAnalysis.ambiguousSignals || []} />
                <MiniTagList title="Likely interview themes" items={job.screeningAnalysis.likelyInterviewQuestionThemes || []} />
                <MiniTagList title="Must-have keywords" items={job.screeningAnalysis.mustHaveKeywords} />
                <MiniTagList title="Missing keywords" items={job.screeningAnalysis.missingKeywords} danger />
                <MiniTagList title="Risky claims" items={job.screeningAnalysis.riskyClaims} danger />
                <p>{job.screeningAnalysis.summaryAngle}</p>
              </div>
            ) : (
              <p className="section-note">Run Screening Analysis first.</p>
            )}
          </section>
          ) : null}

          {activeStepView === "gate" ? (
          <section className="panel screening-summary" id="screening-gate-panel">
            <div className="panel-head">
              <div>
                <h3><Target size={16} /> Gate + Hiring Manager Review</h3>
                <p className="section-note">
                  First check visible screening issues, then check whether a hiring manager would keep reading.
                </p>
              </div>
            </div>
            {gateReviewCurrent && gate ? (
              <div className="screening-summary-body">
                <div className={gateHasBlockingFixes ? "screening-gate-status warn" : "screening-gate-status ok"}>
                  <strong>{gateHasBlockingFixes ? "Gate reviewed · fixes needed" : gateManualFixes.length ? "Gate reviewed · ready with manual title fix" : "Gate reviewed · ready"}</strong>
                  <span>
                    {gateHasBlockingFixes
                      ? `${gateBlockingFixes.length} blocking issue(s) to fix before export.`
                      : gateManualFixes.length
                        ? `${gateManualFixes.length} non-blocking title item can be edited manually; continue reviewer/export checks.`
                      : "All visible screening checks passed."}
                  </span>
                </div>
                {gateHasBlockingFixes ? (
                  <div className="screening-gate-next">
                    <div>
                      <span className="eyebrow">What to do now</span>
                      <strong>
                        {aiRepairLoopStopped
                          ? "AI repair already completed. Review the consolidated report; do not rerun it."
                          : primaryRepairAction
                          ? primaryRepairAction.title
                          : activeCvContentAudit.length
                          ? "Rewrite work-log bullets into real CV bullets."
                          : shouldAvoidMoreGeneration
                            ? "Patch the current CV only; do not regenerate from scratch."
                            : "Fix the generated CV, then run the gate again."}
                      </strong>
                      <p>
                        {aiRepairLoopStopped
                          ? "This Gate result is already included in Step 7. Keep passed items unchanged and use manual editing only for the specific red items that remain."
                          : primaryRepairAction
                          ? primaryRepairAction.detail
                          : activeCvContentAudit.length
                          ? "The current draft reads like project records. Remove long parentheses, scores, versions, test dates, and internal run details; keep only manager-facing actions, scope, and business value."
                          : shouldAvoidMoreGeneration
                          ? `You already have ${cvVersionCount} CV versions for this JD. Codex should patch the current CV against the red gate items, not restart from a broad prompt. Use CV Studio only for tiny wording fixes.`
                          : "Fast path: regenerate Screening CV with the latest prompt. Manual path: open CV Studio and add the missing wording/evidence into visible bullets."}
                      </p>
                    </div>
                    <div className="screening-gate-actions">
	                      {aiRepairLoopStopped ? (
	                        <button className="primary" onClick={() => openStepView("reviewer")}>Review final report</button>
	                      ) : (
	                        <>
	                          <button className={primaryRepairAction?.tokenCost === "ai-patch" ? "secondary" : "primary"} onClick={() => onGo("cv-builder")}>Open CV Studio</button>
	                          {primaryRepairAction?.tokenCost === "ai-patch" ? (
	                        <>
	                          <button
	                            className={aiActionsEnabled ? (shouldAvoidMoreGeneration ? "secondary" : "primary") : "secondary locked"}
	                            onClick={() => { openStepView("cv"); void runCvWithCodex(); }}
	                            disabled={cvRunActive}
	                            title={aiActionsEnabled ? aiTokenTitle : aiLockedTitle}
	                          >
	                            {cvRunActive ? "Patching with Codex..." : aiActionsEnabled ? shouldAvoidMoreGeneration ? gatePrimaryAction : "Fix with Codex" : "Enable AI to patch current CV"}
	                          </button>
	                          <AiActionTimestamp run={job.screeningCvRun} />
	                        </>
	                          ) : null}
	                        </>
	                      )}
                    </div>
                  </div>
                ) : (
                  <div className="screening-gate-next">
                    <div>
                      <span className="eyebrow">Next</span>
                      <strong>Review manager readiness below.</strong>
                      <p>Basic screening checks passed. Now check whether the CV is strong enough for a manager to want an interview.</p>
                    </div>
                  </div>
                )}
                <div className="screening-gate-list">
                  {gate.checks.map((check) => (
                    <div className={check.ok ? "screening-gate-pass" : "screening-gate-fail"} key={check.label}>
                      <strong>{check.label}</strong>
                      <span>{check.value}</span>
                    </div>
                  ))}
                </div>
                <CheckStatusSummary checks={gate.checks} />
                <RepairActionPanel actions={repairActions} aiLocked={aiRepairLoopStopped} />
                {!gateHasBlockingFixes && manualRepairActions.length ? (
                  <div>
                    <span className="eyebrow">Manual non-blocking fix</span>
                    <RepairActionPanel actions={manualRepairActions} />
                    <div className="screening-gate-next compact">
                      <div>
                        <span className="eyebrow">Quick local fix</span>
                        <strong>Apply the recommended target title without AI.</strong>
                        <p>This only updates the current CV header target role. It does not patch or regenerate the CV.</p>
                      </div>
                      <button className="primary" onClick={applyTitleAlignmentFix}>
                        Apply title fix
                      </button>
                    </div>
                    <div className="screening-fix-list">
                      {gateManualFixes.map((item) => <p key={item}>{item}</p>)}
                    </div>
                  </div>
                ) : null}
                {gateHasBlockingFixes ? (
                  <div>
                    <span className="eyebrow">Fix next</span>
                    <div className="screening-fix-list">
                      {gateBlockingFixes.map((item) => <p key={item}>{item}</p>)}
                    </div>
                  </div>
                ) : null}
                {gate.keywordPlacements.length ? (
                  <div>
                    <span className="eyebrow">Keyword coverage map</span>
                    <div className="screening-keyword-list">
                      {gate.keywordPlacements.map((item) => (
                        <div
                          className={item.covered || item.supportLevel === "Weak" || item.supportLevel === "Unsupported"
                            ? "screening-keyword covered"
                            : "screening-keyword missing"}
                          key={item.keyword}
                        >
                          <strong>{item.keyword}</strong>
                          <span>
                            {item.covered
                              ? item.placements.join(" · ")
                              : item.supportLevel === "Weak" || item.supportLevel === "Unsupported"
                                ? `Not forced · ${item.supportLevel} support`
                                : "Missing from visible CV"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="screening-gate-next">
                <div>
                  <span className="eyebrow">{currentCv ? "Ready" : "Locked"}</span>
                  <strong>{currentCv ? "Run Gate Review for the current Screening CV." : "Generate a current Screening CV first."}</strong>
                  <p>{historicalGateReview ? "A historical review is retained but cannot authorize this CV." : "Gate Review is bound to the current CV identity only."}</p>
                </div>
                {currentCv ? <button className="primary" onClick={recheckUpdatedCv} disabled={reviewRefreshStatus === "running"}>Run Gate Review</button> : <button className="primary" onClick={() => openStepView("cv")}>Generate CV</button>}
              </div>
            )}
          </section>
          ) : null}

          {activeStepView === "gate" ? (
          <section className="panel screening-summary" id="hiring-manager-review-panel">
            <div className="panel-head">
              <div>
                <h3><Briefcase size={16} /> Hiring Manager Review</h3>
                <p className="section-note">
                  This local review asks whether the current CV would make a manager want to interview, not just whether keywords exist.
                </p>
              </div>
            </div>
            {managerAtsCurrent && managerReview ? (
              <div className="screening-summary-body">
                <div className={managerReview.rewriteRequired.length ? "screening-gate-status warn" : "screening-gate-status ok"}>
                  <strong>Would interview: {managerReview.wouldInterview}</strong>
                  <span>Confidence: {managerReview.interviewConfidence}</span>
                </div>
                <div className="screening-gate-list">
                  {managerReview.checks.map((check) => (
                    <div className={check.ok ? "screening-gate-pass" : "screening-gate-fail"} key={check.label}>
                      <strong>{check.label}</strong>
                      <span>{check.value}</span>
                    </div>
                  ))}
                </div>
                <CheckStatusSummary checks={managerReview.checks} />
                <MiniReasonList title="Reasons a manager would keep reading" items={managerReview.positives} />
                <MiniReasonList title="Reasons a manager may reject or hesitate" items={managerReview.risks} danger />
                <MiniReasonList title="Rewrite required before applying" items={managerReview.rewriteRequired} danger />
              </div>
            ) : (
              <p className="section-note">Generate a Screening CV before reviewing manager readiness.</p>
            )}
          </section>
          ) : null}

          {activeStepView === "reviewer" ? (
          <section className="panel screening-summary" id="reviewer-export-check-panel">
            <div className="panel-head">
              <div>
                <h3><FileText size={16} /> Reviewer + ATS/PDF Verification</h3>
                <p className="section-note">
                  Final report, not a normal second generation step. A new CV should already aim to pass this check; only use repair when blockers remain.
                </p>
              </div>
            </div>
            {reviewerReview && exportCheck ? (
              <div className="screening-summary-body">
                <ReviewerRunStatusBanner
                  run={job.screeningCvRun}
                  blockerCount={reviewerReview.blockers.length + exportCheck.blockers.length}
                  cvNeedsRerun={cvNeedsRerun}
                  cvRun={cvRun}
                  cvStarting={cvStarting}
                />
                <div className={reviewerReview.ready && exportCheck.ready ? "screening-gate-status ok" : "screening-gate-status warn"}>
                  <strong>{reviewerReview.ready && exportCheck.ready ? "Reviewer and export checks passed" : "Reviewer/export blockers remain"}</strong>
                  <span>{reviewerReview.blockers.length + exportCheck.blockers.length} blocker(s)</span>
                </div>
                <details className="advanced-diagnostics">
                  <summary>Advanced Details</summary>
                  <ReviewSummaryPanel groups={reviewSummaryGroups} />
                </details>
                <RepairResultPanel result={repairResultDisplay} />
                <ExportDecisionPanel
                  decision={{
                    ready: Boolean(exportDecision?.ready),
                    blockers: exportDecision?.blockers || [...reviewerReview.blockers, ...exportCheck.blockers],
                    warnings: exportDecision?.warnings || [],
                    contentHash: exportDecision?.contentHash
                  }}
                  onExport={() => { void dispatchReviewerAction("open-export"); }}
                  cv={activeCv?.tailoredCv}
                  repairOrchestration={repairOrchestration}
                  proposalResolver={(input) => {
                    const result = generateRepairProposal(activeCv?.tailoredCv, input);
                    return result.supported ? result.proposal : null;
                  }}
                  onJumpToFix={(context) => { void dispatchReviewerAction("open-guided-editor", context); }}
                  onRunSafeRepairs={() => { void dispatchReviewerAction("apply-safe-repair"); }}
                  onRunTargetedRegeneration={() => { void dispatchReviewerAction("run-targeted-regeneration"); }}
                  targetedRegenerationLifecycle={targetedRegenerationLifecycle}
                  targetedRegenerationDisabledReason={!aiActionsEnabled ? "AI actions are locked. Enable AI actions first if you intentionally want to spend tokens." : undefined}
                  targetedRegenerationAttempt={currentTargetedRegenerationAttempt}
                  repairReview={activeCv?.reviewSnapshot?.repairTargetZone ? {
                    targetZone: activeCv.reviewSnapshot.repairTargetZone,
                    outcome: activeCv.reviewSnapshot.repairOutcome || "still-failed",
                    previousValue: activeCv.reviewSnapshot.repairPreviousValue || "",
                    updatedValue: activeCv.reviewSnapshot.repairUpdatedValue || activeCv.tailoredCv?.summary || "",
                    reviewerReason: activeCv.reviewSnapshot.repairReviewerReason || "The updated Summary was checked against the current role.",
                    failedCriteria: activeCv.reviewSnapshot.repairFailedCriteria || [],
                    previousSummaryReview: activeCv.reviewSnapshot.repairPreviousSummaryReview,
                    updatedSummaryReview: activeCv.reviewSnapshot.repairUpdatedSummaryReview || activeCv.reviewSnapshot.summaryReviewResult,
                    reviewRunId: activeCv.reviewSnapshot.reviewRunId || activeCv.reviewSnapshot.snapshotId || "",
                    reviewedAt: activeCv.reviewSnapshot.updatedAt || activeCv.reviewSnapshot.completedAt,
                    reviewedCvVersionId: activeCv.reviewSnapshot.reviewedCvVersionId || activeCv.id,
                    reviewedCvContentHash: activeCv.reviewSnapshot.reviewedCvContentHash || activeCv.reviewSnapshot.contentHash || "",
                    reviewedSummaryHash: activeCv.reviewSnapshot.reviewedSummaryHash || "",
                    blockerId: activeCv.reviewSnapshot.repairBlockerId,
                    blockerReviewRunId: activeCv.reviewSnapshot.repairBlockerReviewRunId,
                    blockerReviewedCvHash: activeCv.reviewSnapshot.repairBlockerReviewedCvHash
                  } : undefined}
                  targetedRegenerationResultDismissed={targetedRegenerationResultDismissed}
                  targetedRegenerationElapsedSeconds={targetedRegenerationElapsedSeconds}
                  reviewFreshness={reviewFreshness}
                  reviewRefreshStatus={reviewRefreshStatus}
                  reviewRefreshError={reviewRefreshError}
                  onRecheckReview={recheckUpdatedCv}
                  onRetryTargetedRegeneration={() => { void dispatchReviewerAction("run-targeted-regeneration", { explicitRetry: true }); }}
                  onDismissTargetedRegenerationResult={() => setTargetedRegenerationResultDismissed(true)}
                  onCollectHumanInput={(context) => { void dispatchReviewerAction("open-guided-editor", context); }}
                  onResolveHumanDecision={() => { void dispatchReviewerAction("open-guided-editor"); }}
                  onGenerateAiProposals={() => { void dispatchReviewerAction("generate-ai-proposals"); }}
                  onApplyAcceptedProposals={(input) => { void dispatchReviewerAction("apply-accepted-proposals", input); }}
                />
              </div>
            ) : (
              <div className="screening-gate-next">
                <div>
                  <span className="eyebrow">Blocked</span>
                  <strong>Generate and pass the CV gate first.</strong>
                  <p>Reviewer and ATS/PDF verification run only after a Screening CV exists.</p>
                </div>
                <button className="primary" onClick={() => openStepView(activeCv?.tailoredCv ? "gate" : "cv")}>
                  {activeCv?.tailoredCv ? "Open Gate" : "Generate CV"}
                </button>
              </div>
            )}
          </section>
          ) : null}
        </div>
      </section>

      {activeCv?.tailoredCv ? (
        <section className="panel">
          <div className="panel-head">
            <h3><FileText size={16} /> Current Screening CV</h3>
            <button className="secondary small" onClick={() => onGo("cv-builder")}>Open CV Studio</button>
          </div>
          <CvPreview sections={tailoredCvToSections(activeCv.tailoredCv as TailoredCv)} profile={data.careerProfile} job={job} />
        </section>
      ) : (
        <EmptyState title="No Screening CV yet" action="Complete Career Evidence, JD Analysis, and Evidence Selection before generating a CV" />
      )}
    </PageHeader>
  );
}
