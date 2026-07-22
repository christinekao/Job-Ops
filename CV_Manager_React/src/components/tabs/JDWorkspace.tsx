import {
  Archive,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ClipboardCopy,
  Database,
  Download,
  FileDown,
  FileText,
  Home,
  Layers,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Target,
  Upload,
  Workflow
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
  buildBatchSourceSnapshotPrompt,
  buildCareerBackbonePrompt,
  buildProjectBackboneDeltaPrompt,
  buildDomainKnowledgePrompt,
  buildEvidencePrompt,
  buildFitReviewContext,
  buildFitReviewPrompt,
  buildJDParsePrompt,
  buildProfileDeltaPrompt,
  buildSkillInferencePrompt,
  buildSingleSourceSnapshotPrompt,
  buildSourceParsingPrompt,
  buildStarPrompt,
  buildTailoredCVPrompt,
  PROJECT_BACKBONE_PROMPT_VERSION
} from "../../promptBuilders";
import { defaultData } from "../../sampleData";
import { exportData, loadData, saveData, saveLocalData } from "../../storage";
import type {
  AppData,
  ApplicationStatus,
  BackboneMetadata,
  BackboneProjectTask,
  BackboneRunMode,
  BackboneUpdateSummary,
  CareerProfile,
  CertificationItem,
  CvVersion,
  DomainKnowledge,
  EducationItem,
  EvidenceCard,
  GenerationContext,
  HighCompensationSignal,
  JobApplication,
  ParsedJD,
  ParsePreview,
  ProjectItem,
  RawSource,
  RecruiterAnswer,
  SkillInference,
  SkillGroup,
  SourceParsedSnapshot,
  SourceOfTruth,
  StarStory,
  TailoredCv,
  WorkExperienceItem
} from "../../types";
import type { TabId } from "../../config/nav";
import { navSections, statuses } from "../../config/nav";
import { MiniList, FitReviewReport, FitRecommendationPanel, ParsedJDTable, GroupedSelectionBlock, SelectionBlock } from "../shared/JdComponents";
import { setupProgress, nextSetupAction, nextSetupDestination } from "../../data/setup";
import { selectionDiagnostics, buildCvGenerationSelectionPatch, buildGenerationContext, isCvStaleForJob, fitRecommendationsApplied, cvInputReadiness, latestCvForJob, cleanSelectionPatch } from "../../data/selection";
import { BackboneCoveragePanel } from "../shared/BackboneComponents";
import { WorkspaceInspector } from "../shared/WorkspaceInspector";
import {
  CvInputReadinessPanel,
  CvWorkflowStepper,
  versionQualityScore,
  CvVersionHistoryTable,
  SelectedContext
} from "../shared/CvStatusComponents";
import {
  groupByExperience,
  groupSelectionByLabel,
  normalizeMatchKey,
  migrateReplacement,
  ReplacementMigrationCard,
  EditableSkillCard,
  EditableDomainCard,
  EditableEvidenceCard,
  evidenceReadabilityIssues,
  EditableStarCard,
  GroupedEvidenceView,
  GroupedStoryView
} from "../shared/CardEditors";
import {
  type CvSections,
  cleanCvBullet,
  sectionTitleForCv,
  storyToCvBullets,
  emptyCvSections,
  sectionsFromContent,
  normalizeTailoredCv,
  tailoredCvToSections,
  sectionsToTailoredCv,
  tailoredCvFromVersion,
  buildCvPromptInput,
  defaultCvVersionName,
  jobBlocker,
  composeCvContent,
  cvContentAudit,
  cvQualityChecks,
  cvLayoutDiagnostics,
  qualityFixGuide,
  CvLayoutDiagnosticsPanel,
  parseSkillSection,
  parseLanguageSection,
  parseEducationSection
} from "../cv/utils";
import {
  PageHeader,
  EmptyState,
  Field,
  Textarea,
  Metric,
  FocusSection,
  WorkflowStepHeader,
  ParseAction,
  CopyButton,
  ParsePreviewCard,
  ManualAiPanel,
  PasteBackPanel
} from "../ui/primitives";
import { uid, confirmRemoval, sortCvVersions } from "../../utils/ids";
import { contentHash, estimatePromptTokens, PROJECT_TASK_TOKEN_LIMIT } from "../../utils/hash";
import { emptyPreview, tryParseJson } from "../../utils/json";
import {
  emptyCareerProfile,
  textValue,
  stringArray,
  joinLines,
  lines,
  normalizePeriodText,
  normalizeCareerProfile,
  normalizeSourceOfTruth,
  normalizeSkillInferences,
  normalizeDomainKnowledge,
  normalizeEvidenceCards,
  normalizeStarStories,
  normalizeHighCompensationSignals,
  normalizeBackboneMetadata,
  normalizeBackboneUpdateSummary,
  normalizeSourceParsedSnapshot,
  normalizeBatchSourceSnapshots,
  chunkSourcesForSnapshot,
  chunkItemsBySize,
  mergeCardsByIdentity,
  mergeProjectRecordsPreservingIds,
  profileToSourceOfTruth,
  normalizeCareerBackbone,
  careerBackboneCoverage,
  experienceLabel,
  projectLabel
} from "../../utils/normalize";
import { computeJobContentHash, jobSourceIdentityMismatch } from "../../data/jobs";
import {
  bootstrapProfileSourceManifest,
  reconcileJobsWithBackbone,
  buildBackboneProjectTasks
} from "../../data/backbone";
import { freshSourceHashes } from "../../data/sourceHashes";
import { CvPreview } from "../cv/CvPreview";
import { SourceIntake } from "./SourceIntake";
import { SourceTruth } from "./SourceTruth";
import { SkillMap } from "./SkillMap";
import { DomainKnowledgeMap } from "./DomainMap";
import { EvidenceBank } from "./EvidenceBank";
import { StarBank } from "./StarBank";
import { HighCompensationMap } from "./HighCompMap";


import { SubmitReadinessPanel } from "../shared/SubmitReadinessComponents";
type FitReviewJson = {
  fitLevel: string;
  employerSignals?: string[];
  strongMatches?: string[];
  gaps?: string[];
  fitReasons?: string[];
  fitBlockers?: string[];
  fitUpgradePath?: string[];
  recommendedSkillIds?: string[];
  recommendedDomainKnowledgeIds?: string[];
  recommendedEvidenceIds?: string[];
  recommendedStoryIds?: string[];
  recommendedEvidenceTitles?: string[];
  recommendedStoryTitles?: string[];
  positioningAdvice?: string;
  targetCompensationStrategy?: string;
  nextAction: string;
};

function JdManualAutomationQueue({
  data,
  job,
  latestCv,
  onUpdateJob,
  onSaveCv,
  onGo
}: {
  data: AppData;
  job: JobApplication;
  latestCv?: CvVersion;
  onUpdateJob: (patch: Partial<JobApplication>) => void;
  onSaveCv?: (version: CvVersion) => void;
  onGo?: (tab: TabId) => void;
}) {
  const recommendationApplied = fitRecommendationsApplied(data, job);
  const currentCvReady = Boolean(latestCv?.tailoredCv && !isCvStaleForJob(latestCv, job, data));
  const jdMismatch = jobSourceIdentityMismatch(job);
  const steps = [
    {
      id: "jd" as const,
      label: "JD Parse",
      done: Boolean(job.parsed && job.company && job.role),
      detail: "1 prompt: structure this JD."
    },
    {
      id: "fit" as const,
      label: "Fit Review + selections",
      done: recommendationApplied,
      detail: "1 prompt: score fit and apply recommended evidence."
    },
    {
      id: "cv" as const,
      label: "Tailored CV",
      done: currentCvReady,
      detail: "1 prompt: generate and save CV version."
    }
  ];
  type QueueStepId = typeof steps[number]["id"];
  const firstOpenStep = steps.find((step) => !step.done)?.id || "cv";
  const [activeStep, setActiveStep] = useState<QueueStepId>(firstOpenStep);
  const [pasteBackByStep, setPasteBackByStep] = useState<Record<QueueStepId, string>>({ jd: "", fit: "", cv: "" });
  const [previewByStep, setPreviewByStep] = useState<{
    jd: ParsePreview<ParsedJD>;
    fit: ParsePreview<FitReviewJson>;
    cv: ParsePreview<unknown>;
  }>({
    jd: emptyPreview<ParsedJD>(),
    fit: emptyPreview<FitReviewJson>(),
    cv: emptyPreview<unknown>()
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    setActiveStep(firstOpenStep);
    setMessage("");
    setPasteBackByStep({ jd: "", fit: "", cv: "" });
    setPreviewByStep({
      jd: emptyPreview<ParsedJD>(),
      fit: emptyPreview<FitReviewJson>(),
      cv: emptyPreview<unknown>()
    });
  }, [job.id]);

  const pasteBack = pasteBackByStep[activeStep];
  const preview = previewByStep[activeStep];
  const fitReviewContext = buildFitReviewContext(data, job.id);

  function setPasteBack(value: string) {
    setPasteBackByStep((current) => ({ ...current, [activeStep]: value }));
  }

  function parseActiveStep() {
    setPreviewByStep((current) => ({
      ...current,
      [activeStep]: tryParseJson(pasteBack)
    }));
  }

  function clearStep(step: QueueStepId) {
    setPasteBackByStep((current) => ({ ...current, [step]: "" }));
    setPreviewByStep((current) => ({ ...current, [step]: emptyPreview() }));
  }

  function applyParsedJd() {
    const parsed = previewByStep.jd.parsed;
    if (!parsed) return;
    const nextJob: JobApplication = {
      ...job,
      company: parsed.company || job.company,
      role: parsed.role || job.role,
      location: parsed.location || job.location,
      parsed,
      fit: job.fit || "Unknown",
      status: "Parsed",
      nextAction: "Run Fit Review, then apply recommended evidence.",
      updatedAt: new Date().toISOString()
    };
    onUpdateJob({
      company: nextJob.company,
      role: nextJob.role,
      location: nextJob.location,
      parsed,
      jdContentHash: computeJobContentHash(nextJob),
      status: "Parsed",
      nextAction: nextJob.nextAction,
      updatedAt: nextJob.updatedAt
    });
    clearStep("jd");
    setMessage("JD Parse applied. Next: Fit Review + selections.");
    setActiveStep("fit");
  }

  function applyFitReview() {
    const parsed = previewByStep.fit.parsed;
    if (!parsed || jdMismatch) return;
    const validSkillIds = new Set(data.skillInferences.map((item) => item.id));
    const validDomainIds = new Set(data.domainKnowledge.map((item) => item.id));
    const validEvidenceIds = new Set(data.evidenceCards.map((item) => item.id));
    const validStoryIds = new Set(data.starStories.map((item) => item.id));
    const recommendedSkillIds = (parsed.recommendedSkillIds || []).filter((id) => validSkillIds.has(id)).slice(0, 15);
    const recommendedDomainKnowledgeIds = (parsed.recommendedDomainKnowledgeIds || []).filter((id) => validDomainIds.has(id)).slice(0, 8);
    const recommendedEvidenceIds = (parsed.recommendedEvidenceIds || []).filter((id) => validEvidenceIds.has(id)).slice(0, 15);
    const recommendedStoryIds = (parsed.recommendedStoryIds || []).filter((id) => validStoryIds.has(id)).slice(0, 6);
    onUpdateJob({
      fit: (parsed.fitLevel as JobApplication["fit"]) || job.fit,
      fitReview: {
        employerSignals: parsed.employerSignals || [],
        strongMatches: parsed.strongMatches || [],
        gaps: parsed.gaps || [],
        fitReasons: parsed.fitReasons || [],
        fitBlockers: parsed.fitBlockers || [],
        fitUpgradePath: parsed.fitUpgradePath || [],
        recommendedSkillIds: parsed.recommendedSkillIds || [],
        recommendedDomainKnowledgeIds: parsed.recommendedDomainKnowledgeIds || [],
        recommendedEvidenceIds: parsed.recommendedEvidenceIds || [],
        recommendedStoryIds: parsed.recommendedStoryIds || [],
        positioningAdvice: parsed.positioningAdvice || "",
        targetCompensationStrategy: parsed.targetCompensationStrategy || "",
        recommendedNextAction: parsed.nextAction || ""
      },
      selectedSkillIds: recommendedSkillIds,
      selectedDomainKnowledgeIds: recommendedDomainKnowledgeIds,
      selectedEvidenceIds: recommendedEvidenceIds,
      selectedStoryIds: recommendedStoryIds,
      recommendationsAppliedAt: new Date().toISOString(),
      status: recommendedEvidenceIds.length ? "Ready to Tailor" : "Evidence Needed",
      nextAction: recommendedEvidenceIds.length ? "Generate tailored CV for this selected evidence set." : "Review Fit Review recommendations and add evidence.",
      updatedAt: new Date().toISOString()
    });
    clearStep("fit");
    setMessage("Fit Review applied and recommended evidence selected. Next: Tailored CV.");
    setActiveStep("cv");
  }

  function applyTailoredCv() {
    const parsed = previewByStep.cv.parsed;
    if (!parsed || !onSaveCv) return;
    const nextTailoredCv = normalizeTailoredCv(parsed);
    if (!nextTailoredCv) {
      setPreviewByStep((current) => ({
        ...current,
        cv: {
          ...current.cv,
          error: "Parse succeeded, but this is not Tailored CV JSON. Expected tailoredCv/header/summary/workExperience structure."
        }
      }));
      return;
    }
    const sections = tailoredCvToSections(nextTailoredCv);
    const versionName = defaultCvVersionName(nextTailoredCv.header.targetRole || job.role);
    onSaveCv({
      id: uid("cv"),
      jdId: job.id,
      name: versionName,
      summary: nextTailoredCv.summary || sections.summary,
      content: composeCvContent(sections),
      sections,
      tailoredCv: nextTailoredCv,
      generationContext: buildGenerationContext(data, job),
      status: "Draft",
      updatedAt: new Date().toISOString()
    });
    onUpdateJob({
      status: "CV Drafted",
      nextAction: "Review the generated CV, run quality checks, then export.",
      updatedAt: new Date().toISOString()
    });
    clearStep("cv");
    setMessage("Tailored CV saved as a new version. Next: review/export in CV Studio.");
  }

  const stepConfig: Record<QueueStepId, {
    prompt: string;
    inputLabel: string;
    inputValue: string;
    pasteLabel: string;
    applyLabel: string;
    apply: () => void;
    locked?: string;
  }> = {
    jd: {
      prompt: buildJDParsePrompt(job.rawJD),
      inputLabel: "Input Data: raw JD",
      inputValue: job.rawJD || "Paste or edit raw JD in JD Intake first.",
      pasteLabel: "Paste GPT JD Parse JSON Back",
      applyLabel: "Apply JD Parse and continue",
      apply: applyParsedJd,
      locked: job.rawJD.trim() ? "" : "Raw JD is empty. Edit JD first."
    },
    fit: {
      prompt: buildFitReviewPrompt(data, job.id),
      inputLabel: "Input Data: JD + shortlisted Career Evidence",
      inputValue: JSON.stringify(fitReviewContext, null, 2),
      pasteLabel: "Paste GPT Fit Review JSON Back",
      applyLabel: "Apply Fit Review + selections",
      apply: applyFitReview,
      locked: jdMismatch ? "JD source mismatch. Replace raw JD before running Fit Review." : ""
    },
    cv: {
      prompt: buildTailoredCVPrompt(data, job.id),
      inputLabel: "Input Data: JD + selected evidence + selected STAR",
      inputValue: JSON.stringify(buildCvPromptInput(data, job), null, 2),
      pasteLabel: "Paste GPT Tailored CV JSON Back",
      applyLabel: onSaveCv ? "Apply + save CV version" : "Open CV Studio to paste CV JSON",
      apply: onSaveCv ? applyTailoredCv : () => onGo?.("cv-builder"),
      locked: recommendationApplied ? "" : "Apply Fit Review recommendations or select evidence before generating CV."
    }
  };
  const current = stepConfig[activeStep];
  const currentStepNumber = steps.findIndex((step) => step.id === activeStep) + 1;

  return (
    <section className="panel manual-automation-queue">
      <div className="queue-head">
        <div>
          <span className="eyebrow">ChatGPT paste-back automation queue</span>
          <h3>One JD workflow · 3 required prompts</h3>
          <p>No API cost. Copy one prompt at a time, paste the GPT JSON back here, then Apply. The app tracks the next step.</p>
        </div>
        <span className="queue-count">Step {currentStepNumber}/3</span>
      </div>
      <div className="queue-steps" role="tablist" aria-label="JD paste-back steps">
        {steps.map((step, index) => (
          <button
            key={step.id}
            className={`${activeStep === step.id ? "active" : ""} ${step.done ? "done" : ""}`}
            onClick={() => setActiveStep(step.id)}
            type="button"
          >
            <span>{step.done ? "✓" : index + 1}</span>
            <strong>{step.label}</strong>
            <small>{step.detail}</small>
          </button>
        ))}
      </div>
      {message && <div className="save-status">{message}</div>}
      {current.locked ? (
        <section className="fit-warning">
          <strong>Step locked</strong>
          <p>{current.locked}</p>
          {activeStep === "jd" && onGo && <button className="secondary small" onClick={() => onGo("jd-intake")}>Edit JD</button>}
          {activeStep === "cv" && <button className="secondary small" onClick={() => setActiveStep("fit")}>Go to Fit Review step</button>}
        </section>
      ) : (
        <>
          <ManualAiPanel
            prompt={current.prompt}
            inputLabel={current.inputLabel}
            inputValue={current.inputValue}
            readOnlyInput
            pasteLabel={current.pasteLabel}
            pasteValue={pasteBack}
            onPasteChange={setPasteBack}
            onParse={parseActiveStep}
          />
          <ParsePreviewCard preview={preview} onApply={current.apply} applyLabel={current.applyLabel} />
        </>
      )}
    </section>
  );
}

export function JDWorkspace({
  data,
  job,
  onUpdateJob,
  onSaveCv,
  onEditIntake,
  onGo
}: {
  data: AppData;
  job: JobApplication;
  onUpdateJob: (patch: Partial<JobApplication>) => void;
  onSaveCv?: (version: CvVersion) => void;
  onEditIntake?: () => void;
  onGo?: (tab: TabId) => void;
}) {
  const [activeJdView, setActiveJdView] = useState<"fit" | "recommendations" | "skills" | "domain" | "evidence" | "star">(() => {
    const requested = sessionStorage.getItem("cv-manager-jd-subview");
    sessionStorage.removeItem("cv-manager-jd-subview");
    return requested === "recommendations" ? "recommendations" : "fit";
  });
  const [pasteBack, setPasteBack] = useState("");
  const [preview, setPreview] = useState<ParsePreview<{
    fitLevel: string;
    employerSignals?: string[];
    strongMatches?: string[];
    gaps?: string[];
    fitReasons?: string[];
    fitBlockers?: string[];
    fitUpgradePath?: string[];
    recommendedSkillIds?: string[];
    recommendedDomainKnowledgeIds?: string[];
    recommendedEvidenceIds?: string[];
    recommendedStoryIds?: string[];
    recommendedEvidenceTitles?: string[];
    recommendedStoryTitles?: string[];
    positioningAdvice?: string;
    targetCompensationStrategy?: string;
    nextAction: string;
  }>>(emptyPreview);
  const evidenceGroups = groupByExperience(data.evidenceCards, data.careerProfile);
  const storyGroups = groupByExperience(data.starStories, data.careerProfile);
  const skillGroups = groupSelectionByLabel(data.skillInferences, (item) => item.group || "Skills");
  const domainGroups = groupSelectionByLabel(data.domainKnowledge, (item) => item.domain || "Domain Knowledge");
  const hasCvVersion = data.cvVersions.some((version) => version.jdId === job.id);
  const selectionNextAction = (evidenceCount: number, storyCount: number) => {
    if (hasCvVersion) return "Review existing CV, or update CV draft after changing evidence.";
    if (!evidenceCount) return "Select relevant evidence for this JD.";
    if (!storyCount) return "Select STAR stories for this JD.";
    return "Open CV Studio and build tailored CV prompt.";
  };
  const selectionStatus = (evidenceCount: number): JobApplication["status"] => {
    if (hasCvVersion) {
      const postDraftStatuses: JobApplication["status"][] = ["CV Drafted", "Reviewed", "Applied", "Follow-up Needed", "Archived"];
      return postDraftStatuses.includes(job.status) ? job.status : "CV Drafted";
    }
    return evidenceCount ? "Ready to Tailor" : "Evidence Needed";
  };

  function toggleEvidence(id: string) {
    const selected = job.selectedEvidenceIds.includes(id)
      ? job.selectedEvidenceIds.filter((item) => item !== id)
      : [...job.selectedEvidenceIds, id];
    onUpdateJob({
      selectedEvidenceIds: selected,
      status: selectionStatus(selected.length),
      nextAction: selectionNextAction(selected.length, job.selectedStoryIds.length)
    });
  }

  function toggleSkill(id: string) {
    const current = job.selectedSkillIds || [];
    const selected = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    onUpdateJob({ selectedSkillIds: selected });
  }

  function toggleDomain(id: string) {
    const current = job.selectedDomainKnowledgeIds || [];
    const selected = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    onUpdateJob({ selectedDomainKnowledgeIds: selected });
  }

  function toggleStory(id: string) {
    const selected = job.selectedStoryIds.includes(id)
      ? job.selectedStoryIds.filter((item) => item !== id)
      : [...job.selectedStoryIds, id];
    onUpdateJob({
      selectedStoryIds: selected,
      nextAction: selectionNextAction(job.selectedEvidenceIds.length, selected.length)
    });
  }

  function setEvidenceGroup(ids: string[], checked: boolean) {
    const selected = checked
      ? Array.from(new Set([...job.selectedEvidenceIds, ...ids]))
      : job.selectedEvidenceIds.filter((id) => !ids.includes(id));
    onUpdateJob({
      selectedEvidenceIds: selected,
      status: selectionStatus(selected.length),
      nextAction: selectionNextAction(selected.length, job.selectedStoryIds.length)
    });
  }

  function setSkillGroup(ids: string[], checked: boolean) {
    const current = job.selectedSkillIds || [];
    const selected = checked
      ? Array.from(new Set([...current, ...ids]))
      : current.filter((id) => !ids.includes(id));
    onUpdateJob({ selectedSkillIds: selected });
  }

  function setDomainGroup(ids: string[], checked: boolean) {
    const current = job.selectedDomainKnowledgeIds || [];
    const selected = checked
      ? Array.from(new Set([...current, ...ids]))
      : current.filter((id) => !ids.includes(id));
    onUpdateJob({ selectedDomainKnowledgeIds: selected });
  }

  function setStoryGroup(ids: string[], checked: boolean) {
    const selected = checked
      ? Array.from(new Set([...job.selectedStoryIds, ...ids]))
      : job.selectedStoryIds.filter((id) => !ids.includes(id));
    onUpdateJob({
      selectedStoryIds: selected,
      nextAction: selectionNextAction(job.selectedEvidenceIds.length, selected.length)
    });
  }

  function applyFit() {
    if (!preview.parsed || jobSourceIdentityMismatch(job)) return;
    const fitReview = {
      employerSignals: preview.parsed.employerSignals || [],
      strongMatches: preview.parsed.strongMatches || [],
      gaps: preview.parsed.gaps || [],
      fitReasons: preview.parsed.fitReasons || [],
      fitBlockers: preview.parsed.fitBlockers || [],
      fitUpgradePath: preview.parsed.fitUpgradePath || [],
      recommendedSkillIds: preview.parsed.recommendedSkillIds || [],
      recommendedDomainKnowledgeIds: preview.parsed.recommendedDomainKnowledgeIds || [],
      recommendedEvidenceIds: preview.parsed.recommendedEvidenceIds || [],
      recommendedStoryIds: preview.parsed.recommendedStoryIds || [],
      positioningAdvice: preview.parsed.positioningAdvice || "",
      targetCompensationStrategy: preview.parsed.targetCompensationStrategy || "",
      recommendedNextAction: preview.parsed.nextAction || ""
    };
    const nextJob = {
      ...job,
      fit: (preview.parsed.fitLevel as JobApplication["fit"]) || job.fit,
      fitReview
    };
    const selectionPatch = buildCvGenerationSelectionPatch(data, nextJob);
    const readiness = cvInputReadiness(data, { ...nextJob, ...selectionPatch });
    const missingChecks = readiness.checks.filter((check) => !check.ok).map((check) => check.label);
    onUpdateJob({
      fit: nextJob.fit,
      fitReview,
      ...selectionPatch,
      status: readiness.ready ? "Ready to Tailor" : "Evidence Needed",
      nextAction: readiness.ready
        ? "Generate Screening CV from the JD-based recommended and supplemented evidence set."
        : `Add enough selected material before generating CV: ${missingChecks.join(", ")}.`
    });
    setPreview(emptyPreview);
    setPasteBack("");
    setActiveJdView("recommendations");
  }

  function applyFitRecommendations() {
    const recommendationSource = job.screeningAnalysis || job.fitReview;
    if (!recommendationSource) return;
    const selectionPatch = buildCvGenerationSelectionPatch(data, job);
    const readiness = cvInputReadiness(data, { ...job, ...selectionPatch });
    const missingChecks = readiness.checks.filter((check) => !check.ok).map((check) => check.label);
    onUpdateJob({
      ...selectionPatch,
      status: readiness.ready ? "Ready to Tailor" : "Evidence Needed",
      nextAction: readiness.ready
        ? "Generate Screening CV from the JD-based recommended and supplemented evidence set."
        : `Add enough selected material before generating CV: ${missingChecks.join(", ")}.`
    });
  }

  const recommendationApplied = fitRecommendationsApplied(data, job);
  const jdSourceMismatch = jobSourceIdentityMismatch(job);

  const diagnostics = selectionDiagnostics(data, job);
  const selectedSummary = {
    skills: diagnostics.selectedSkills.length,
    domain: diagnostics.selectedDomainKnowledge.length,
    evidence: diagnostics.selectedEvidence.length,
    star: diagnostics.selectedStarStories.length
  };
  const latestCv = latestCvForJob(data, job.id);
  const fitReviewContext = buildFitReviewContext(data, job.id);
  const fitReviewContextCounts = {
    skills: fitReviewContext.skillInferences.length,
    domain: fitReviewContext.domainKnowledge.length,
    evidence: fitReviewContext.evidenceCards.length,
    star: fitReviewContext.starStories.length
  };
  const jdViews: {
    id: typeof activeJdView;
    label: string;
    count?: number;
    title: string;
    detail: string;
    content: React.ReactNode;
  }[] = [
    {
      id: "fit",
      label: "Job Intelligence",
      title: "Run Fit Review",
      detail: "先定義這份 JD 的勝率、風險與定位策略，再決定要選哪些 evidence。",
      content: (
        <>
          {jdSourceMismatch ? (
            <section className="fit-warning source-mismatch">
              <strong>JD source mismatch</strong>
              <p>The saved raw JD belongs to a different role or company. Fit Review is locked so mixed job data cannot produce another CV.</p>
              {onEditIntake && <button className="primary small" onClick={onEditIntake}>Replace raw JD</button>}
            </section>
          ) : (
            <>
              <div className="save-status">
                Shortlisted locally for this JD: {fitReviewContextCounts.skills} skills · {fitReviewContextCounts.domain} domain · {fitReviewContextCounts.evidence} evidence · {fitReviewContextCounts.star} STAR. The full Career Backbone remains unchanged.
              </div>
              <ManualAiPanel
                prompt={buildFitReviewPrompt(data, job.id)}
                inputLabel="Prepare Input Data：JD + locally shortlisted career evidence"
                inputValue={JSON.stringify(fitReviewContext, null, 2)}
                readOnlyInput
                pasteLabel="Paste GPT Fit Review JSON Back"
                pasteValue={pasteBack}
                onPasteChange={setPasteBack}
                onParse={() => setPreview(tryParseJson(pasteBack))}
              />
              <ParsePreviewCard preview={preview} onApply={applyFit} />
            </>
          )}
          <FitReviewReport job={job} />
          <details className="parsed-jd-disclosure">
            <summary>View parsed JD details</summary>
            <ParsedJDTable job={job} />
          </details>
        </>
      )
    },
    {
      id: "recommendations",
      label: "Evidence Mapping",
      count: selectedSummary.skills + selectedSummary.domain + selectedSummary.evidence + selectedSummary.star,
      title: "Recommended selections",
      detail: "Fit Review 產出的推薦會先在這裡套用，之後再進各 selection tab 微調。",
      content: (
        <FitRecommendationPanel
          data={data}
          job={job}
          applied={recommendationApplied}
          onApply={applyFitRecommendations}
          onClear={() => onUpdateJob({
            selectedSkillIds: [],
            selectedDomainKnowledgeIds: [],
            selectedEvidenceIds: [],
            selectedStoryIds: [],
            recommendationsAppliedAt: "",
            status: hasCvVersion ? job.status : "Evidence Needed",
            nextAction: "Apply Fit Review recommendations or select a focused evidence set for this JD."
          })}
          onGo={onGo}
        />
      )
    },
    {
      id: "skills",
      label: "Skills",
      count: selectedSummary.skills,
      title: "Select Skills for this JD",
      detail: "選出這份 JD 要在 CV summary、sidebar skill tags、experience bullets 裡自然呈現的技能。",
      content: (
        <GroupedSelectionBlock
          title="Select Skills for this JD"
          groups={skillGroups.map((group) => ({
            ...group,
            items: group.items.map((item) => ({
              id: item.id,
              title: item.skill,
              proof: [item.strength, item.usageContext, item.evidenceSummary].filter(Boolean).join(" · ")
            }))
          }))}
          selectedIds={job.selectedSkillIds || []}
          onToggle={toggleSkill}
          onSetGroup={setSkillGroup}
        />
      )
    },
    {
      id: "domain",
      label: "Domain",
      count: selectedSummary.domain,
      title: "Select Domain / Process / KPI Signals",
      detail: "選出能讓 HR 或主管理解你不是只會工具，而是懂業務流程、stakeholder、KPI 的訊號。",
      content: (
        <GroupedSelectionBlock
          title="Select Domain / Process / KPI Signals"
          groups={domainGroups.map((group) => ({
            ...group,
            items: group.items.map((item) => ({
              id: item.id,
              title: item.businessProcess || item.domain,
              proof: [item.stakeholders.join(", "), item.systemsOrData.join(", "), item.metricsOrKpis.join(", "), item.proof].filter(Boolean).join(" · ")
            }))
          }))}
          selectedIds={job.selectedDomainKnowledgeIds || []}
          onToggle={toggleDomain}
          onSetGroup={setDomainGroup}
        />
      )
    },
    {
      id: "evidence",
      label: "Evidence",
      count: selectedSummary.evidence,
      title: "Select Evidence for this JD",
      detail: "選出正式 CV bullet 可以使用的 project facts、metrics、systems、outcomes。",
      content: (
        <GroupedSelectionBlock
          title="Select Evidence for this JD"
          groups={evidenceGroups.map((group) => ({
            ...group,
            items: group.items.map((item) => ({
              id: item.id,
              title: item.title,
              proof: [projectLabel(data.careerProfile, item.projectId), item.proof].filter(Boolean).join(" · ")
            }))
          }))}
          selectedIds={job.selectedEvidenceIds}
          onToggle={toggleEvidence}
          onSetGroup={setEvidenceGroup}
        />
      )
    },
    {
      id: "star",
      label: "STAR",
      count: selectedSummary.star,
      title: "Select STAR Stories",
      detail: "選出能支撐 CV impact 和面試故事的 STAR。CV 會融入內容，不會直接出現 STAR 標題。",
      content: (
        <GroupedSelectionBlock
          title="Select STAR Stories"
          groups={storyGroups.map((group) => ({
            ...group,
            items: group.items.map((story) => ({
              id: story.id,
              title: story.title,
              proof: [projectLabel(data.careerProfile, story.projectId), story.result].filter(Boolean).join(" · ")
            }))
          }))}
          selectedIds={job.selectedStoryIds}
          onToggle={toggleStory}
          onSetGroup={setStoryGroup}
        />
      )
    }
  ];
  const selectedJdView = jdViews.find((view) => view.id === activeJdView) || jdViews[0];
  const latestCvIsCurrent = Boolean(latestCv?.tailoredCv && !isCvStaleForJob(latestCv, job, data));
  const latestCvExported = Boolean(latestCvIsCurrent && latestCv?.exportedAt);
  const applicationLogged = Boolean(job.applicationLog?.appliedAt || job.applicationLog?.platform || job.applicationLog?.notes);
  const workflowSteps = [
    { label: "Analyze JD", done: Boolean(job.fitReview) && job.fit !== "Unknown" },
    { label: "Select evidence", done: recommendationApplied },
    { label: "Generate CV", done: latestCvIsCurrent },
    { label: "Review & export", done: latestCvExported },
    { label: "Log application", done: applicationLogged }
  ];
  const workflowAction = !workflowSteps[0].done
    ? { label: "Run Fit Review", run: () => setActiveJdView("fit") }
    : !workflowSteps[1].done
      ? { label: "Review selections", run: () => setActiveJdView("recommendations") }
      : !workflowSteps[2].done
        ? { label: "Generate current CV", run: () => onGo?.("cv-builder") }
        : !workflowSteps[3].done
          ? { label: "Review / Export CV", run: () => onGo?.("cv-builder") }
          : !workflowSteps[4].done
            ? { label: "Log application", run: () => onGo?.("export") }
            : { label: "Application complete", run: () => onGo?.("export") };

  return (
    <PageHeader
      title={job.role}
      subtitle={`${job.company || "Company unknown"} · ${job.location || "Location not set"} — analyze the JD, map evidence, and prepare the tailored CV in one workspace.`}
      action={(
        <div className="toolbar-actions">{onEditIntake && <button className="secondary" onClick={onEditIntake}>Edit JD</button>}</div>
      )}
    >
      <section className="application-journey panel" aria-label="Application workflow">
        <div>
          <span className="eyebrow">Current application</span>
          <strong>One path from JD to submitted CV</strong>
        </div>
        <ol>
          {workflowSteps.map((step, index) => (
            <li className={step.done ? "done" : index === workflowSteps.findIndex((item) => !item.done) ? "current" : ""} key={step.label}>
              <span>{step.done ? "✓" : index + 1}</span>
              <small>{step.label}</small>
            </li>
          ))}
        </ol>
        <button className="primary" onClick={workflowAction.run}>{workflowAction.label}</button>
      </section>
      <section className="workspace-grid single-column">
        <div>
          <section className="panel legacy-workspace-note">
            <div className="panel-head">
              <div>
                <span className="eyebrow">Legacy workspace</span>
                <h3>Use Screening Lab for the current workflow</h3>
                <p>This older JD workspace is kept only for manual fallback. Do not rerun JD parse or CV creation here unless Screening Lab is unavailable.</p>
              </div>
              <button className="primary" onClick={() => onGo?.("screening-lab")}>Open Screening Lab</button>
            </div>
            <details className="advanced-backbone-fallback">
              <summary>Show legacy manual paste-back queue</summary>
              <JdManualAutomationQueue
                data={data}
                job={job}
                latestCv={latestCv}
                onUpdateJob={onUpdateJob}
                onSaveCv={onSaveCv}
                onGo={onGo}
              />
            </details>
          </section>
          <SubmitReadinessPanel data={data} job={job} cv={latestCv} onGo={onGo} onUpdateJob={onUpdateJob} />
          <section className="panel jd-workbench">
            <div className="backbone-tabs jd-tabs">
              {jdViews.map((view) => (
                <button
                  key={view.id}
                  className={view.id === activeJdView ? "active" : ""}
                  onClick={() => setActiveJdView(view.id)}
                >
                  <span>{view.label}</span>
                  {typeof view.count === "number" && <small>{view.count}</small>}
                </button>
              ))}
            </div>
            <div className="jd-view-head">
              <div>
                <h3>{selectedJdView.title}</h3>
                <p>{selectedJdView.detail}</p>
              </div>
              <span>{selectionNextAction(job.selectedEvidenceIds.length, job.selectedStoryIds.length)}</span>
            </div>
          </section>
          {selectedJdView.content}
        </div>
      </section>
    </PageHeader>
  );
}
