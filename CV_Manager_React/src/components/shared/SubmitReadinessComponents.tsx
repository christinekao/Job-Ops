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
import { MiniList, PositioningStrategyCard, FitReviewReport, FitRecommendationPanel, ParsedJDTable, GroupedSelectionBlock, SelectionBlock } from "./JdComponents";
import { setupProgress, nextSetupAction, nextSetupDestination } from "../../data/setup";
import { selectionDiagnostics, buildGenerationContext, isCvStaleForJob, cvStaleReasonForJob, cvStaleActionForReason, fitRecommendationsApplied, cvInputReadiness, latestCvForJob, cleanSelectionPatch } from "../../data/selection";
import { BackboneCoveragePanel } from "./BackboneComponents";
import { WorkspaceInspector } from "./WorkspaceInspector";
import {
  CvInputReadinessPanel,
  CvWorkflowStepper,
  versionQualityScore,
  CvVersionHistoryTable,
  SelectedContext
} from "./CvStatusComponents";
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
} from "./CardEditors";
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
import { SourceIntake } from "../tabs/SourceIntake";
import { SourceTruth } from "../tabs/SourceTruth";
import { SkillMap } from "../tabs/SkillMap";
import { DomainKnowledgeMap } from "../tabs/DomainMap";
import { EvidenceBank } from "../tabs/EvidenceBank";
import { StarBank } from "../tabs/StarBank";
import { HighCompensationMap } from "../tabs/HighCompMap";



export type SubmitReadinessSeverity = "blocker" | "warning";

export type SubmitReadinessIssue = {
  label: string;
  value: string;
  ok: boolean;
  severity: SubmitReadinessSeverity;
  action: string;
  tab?: TabId;
};


export function submitReadiness(data: AppData, job: JobApplication, cv?: CvVersion) {
  const diagnostics = selectionDiagnostics(data, job);
  const tailoredCv = tailoredCvFromVersion(cv);
  const qualityChecks = tailoredCv ? cvQualityChecks(tailoredCv, job, data) : [];
  const qualityFailures = qualityChecks.filter((item) => !item.ok);
  const cvStaleReason = cvStaleReasonForJob(cv, job, data);
  const cvContextStale = isCvStaleForJob(cv, job, data);
  const cvStaleAction = cvStaleActionForReason(cvStaleReason);
  const readiness = cvInputReadiness(data, job);
  const validSelectionSummary = `${diagnostics.selectedSkills.length} skills / ${diagnostics.selectedDomainKnowledge.length} domain / ${diagnostics.selectedEvidence.length} evidence / ${diagnostics.selectedStarStories.length} STAR`;
  const invalidSelectionCount = readiness.invalidSelectionCount;
  const applicationLog = job.applicationLog || {};
  const hasApplicationLog = Boolean(
    applicationLog.appliedAt || applicationLog.platform || applicationLog.contact || applicationLog.followUpDate || applicationLog.notes
  );
  const locationRiskText = [
    ...(job.parsed?.risks || []),
    ...(job.fitReview?.gaps || []),
    job.location
  ].join(" ");
  const hasLocationRisk = /relocat|hybrid|onsite|on-site|location|brno|taipei|remote/i.test(locationRiskText)
    && /brno|relocat|hybrid|onsite|on-site/i.test(locationRiskText);
  const locationAcknowledged = /relocat|hybrid|onsite|on-site|location|brno|taipei|remote/i.test(applicationLog.notes || "");
  const issues: SubmitReadinessIssue[] = [
    {
      label: "Fit Review",
      value: job.fitReview ? `${job.fit} fit` : "Missing",
      ok: Boolean(job.fitReview) && job.fit !== "Unknown",
      severity: "blocker",
      action: "Run Fit Review before choosing evidence or exporting.",
      tab: "jd-tailoring"
    },
    {
      label: "Valid selections",
      value: invalidSelectionCount ? `${invalidSelectionCount} stale IDs` : validSelectionSummary,
      ok: invalidSelectionCount === 0 && readiness.ready,
      severity: "blocker",
      action: "Apply recommendations, then add enough skill/evidence/STAR selections for this JD.",
      tab: "workspace"
    },
    {
      label: "CV version",
      value: cv ? cv.name : "No saved CV",
      ok: Boolean(cv && tailoredCv && !cvContextStale),
      severity: "blocker",
      action: cvContextStale ? cvStaleAction : "Generate and save a structured CV version.",
      tab: "cv-builder"
    },
    {
      label: "CV quality gate",
      value: tailoredCv
        ? qualityFailures.length
          ? `${qualityChecks.length - qualityFailures.length}/${qualityChecks.length} checks passed · Fix: ${qualityFailures[0].label}`
          : `${qualityChecks.length}/${qualityChecks.length} checks passed`
        : "Not checked",
      ok: Boolean(tailoredCv && qualityChecks.length && qualityFailures.length === 0),
      severity: "blocker",
      action: cvContextStale ? cvStaleAction : qualityFailures[0]?.action || "Review the CV quality checks before export.",
      tab: cvContextStale || !tailoredCv ? "cv-builder" : "cv-editor-export"
    },
    {
      label: "PDF export",
      value: cv?.exportedAt ? new Date(cv.exportedAt).toLocaleDateString() : "Not exported",
      ok: Boolean(cv?.exportedAt),
      severity: "warning",
      action: "Print / Save the final CV PDF after quality checks pass.",
      tab: "export"
    },
    {
      label: "Application log",
      value: hasApplicationLog ? "Started" : "Missing",
      ok: hasApplicationLog,
      severity: "warning",
      action: "Record platform, apply date, contact, follow-up, and salary strategy.",
      tab: "export"
    },
    {
      label: "Location risk",
      value: hasLocationRisk ? (locationAcknowledged ? "Acknowledged" : "Needs decision") : "No major flag",
      ok: !hasLocationRisk || locationAcknowledged,
      severity: "warning",
      action: "Add relocation / remote / hybrid decision notes before submitting.",
      tab: "export"
    }
  ];
  const blockers = issues.filter((issue) => issue.severity === "blocker" && !issue.ok);
  const warnings = issues.filter((issue) => issue.severity === "warning" && !issue.ok);
  const firstIssue = blockers[0] || warnings[0];
  return {
    issues,
    blockers,
    warnings,
    canProceed: blockers.length === 0,
    fullyReady: blockers.length === 0 && warnings.length === 0,
    label: blockers.length ? "Action required" : warnings.length ? "Ready with follow-ups" : "Ready to submit",
    nextAction: firstIssue?.action || "Final check PDF and submit.",
    nextTab: firstIssue?.tab,
    nextIssue: firstIssue?.label
  };
}


export function SubmitReadinessPanel({
  data,
  job,
  cv,
  compact = false,
  onGo,
  onUpdateJob
}: {
  data: AppData;
  job: JobApplication;
  cv?: CvVersion;
  compact?: boolean;
  onGo?: (tab: TabId) => void;
  onUpdateJob?: (patch: Partial<JobApplication>) => void;
}) {
  const [cleanupNotice, setCleanupNotice] = useState("");
  const readiness = submitReadiness(data, job, cv);
  const visibleIssues = compact
    ? readiness.issues.filter((issue) => !issue.ok).slice(0, 2)
    : readiness.issues.filter((issue) => !issue.ok);
  const passedIssues = readiness.issues.filter((issue) => issue.ok);
  const currentIssue = readiness.blockers[0] || readiness.warnings[0];
  const laterIssues = readiness.issues.filter((issue) => !issue.ok && issue !== currentIssue);
  const invalidSelectionCount = cvInputReadiness(data, job).invalidSelectionCount;
  const compactNote = readiness.blockers.length
    ? `${readiness.blockers.length} blocker(s)`
    : readiness.warnings.length
      ? `${readiness.warnings.length} warning(s)`
      : "Ready for final PDF check";
  const nextButtonLabel = readiness.nextIssue === "Fit Review"
    ? "Run Fit Review"
    : readiness.nextIssue === "Valid selections"
      ? "Review selections"
      : readiness.nextIssue === "CV version"
        ? "Generate fresh CV"
        : readiness.nextIssue === "CV quality gate"
          ? "Open Content Audit"
          : readiness.nextIssue === "PDF export"
            ? "Export PDF"
            : readiness.nextIssue === "Application log"
              ? "Add application log"
              : "Continue";
  return (
    <section className={compact ? "submit-readiness compact" : "panel submit-readiness"}>
      <div className="submit-readiness-head">
        <div>
          <span className={readiness.fullyReady ? "readiness-pill ok" : "readiness-pill warn"}>{readiness.label}</span>
          {!compact && <h3>Submit readiness</h3>}
          <p>{compact ? compactNote : currentIssue ? "Complete the single next action below. Later steps stay hidden until needed." : "All required checks are complete."}</p>
        </div>
        {!compact && onUpdateJob && invalidSelectionCount > 0 ? (
          <button
            className="secondary small"
            onClick={() => {
              onUpdateJob(cleanSelectionPatch(data, job));
              setCleanupNotice(`${invalidSelectionCount} stale selection${invalidSelectionCount === 1 ? "" : "s"} removed. Review the remaining picks, then apply recommendations or continue to CV Builder.`);
            }}
          >
            Clean stale selections
          </button>
        ) : onGo && readiness.nextTab && (
          <button className={readiness.canProceed ? "secondary small" : "primary small"} onClick={() => {
            if (readiness.nextIssue === "Valid selections") sessionStorage.setItem("cv-manager-jd-subview", "recommendations");
            if (readiness.nextIssue === "CV quality gate") sessionStorage.setItem("cv-manager-cv-panel", "quality");
            onGo(readiness.nextTab!);
          }}>
            {nextButtonLabel}
          </button>
        )}
      </div>
      {compact ? (
        <div className="submit-readiness-grid">
          {visibleIssues.map((issue) => (
            <article className={issue.ok ? "ready" : issue.severity} key={issue.label}>
              <strong>{issue.label}</strong>
              <span>{issue.value}</span>
            </article>
          ))}
        </div>
      ) : currentIssue ? (
        <section className="readiness-now">
          <span>DO THIS NOW</span>
          <div>
            <strong>{nextButtonLabel}</strong>
            <p>{currentIssue.action}</p>
            <small>{currentIssue.label}: {currentIssue.value}</small>
          </div>
        </section>
      ) : null}
      {!compact && laterIssues.length > 0 && (
        <details className="readiness-later">
          <summary>Later steps ({laterIssues.length})</summary>
          <div>
            {laterIssues.map((issue) => (
              <article key={issue.label}>
                <strong>{issue.label}</strong>
                <span>{issue.action}</span>
              </article>
            ))}
          </div>
        </details>
      )}
      {!compact && passedIssues.length > 0 && (
        <details className="readiness-passed">
          <summary>{passedIssues.length} completed checks</summary>
          <p>{passedIssues.map((issue) => issue.label).join(" · ")}</p>
        </details>
      )}
      {!compact && cleanupNotice && <p className="cleanup-notice">{cleanupNotice}</p>}
    </section>
  );
}
