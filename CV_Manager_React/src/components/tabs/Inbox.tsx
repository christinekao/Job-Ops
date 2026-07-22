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
import { MiniList, PositioningStrategyCard, FitReviewReport, FitRecommendationPanel, ParsedJDTable, GroupedSelectionBlock, SelectionBlock } from "../shared/JdComponents";
import { setupProgress, nextSetupAction, nextSetupDestination } from "../../data/setup";
import { selectionDiagnostics, buildGenerationContext, isCvStaleForJob, fitRecommendationsApplied, cvInputReadiness, latestCvForJob, cleanSelectionPatch } from "../../data/selection";
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


import { submitReadiness } from "../shared/SubmitReadinessComponents";
export function Inbox({
  data,
  selectedJobId,
  onSelect,
  onOpen,
  onNew,
  onStatus
}: {
  data: AppData;
  selectedJobId: string;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  onNew: () => void;
  onStatus: (id: string, status: ApplicationStatus) => void;
}) {
  const [query, setQuery] = useState("");
  const jobs = data.jobs.filter((job) =>
    `${job.company} ${job.role} ${job.location} ${job.status}`.toLowerCase().includes(query.toLowerCase())
  );
  const statusOrder: ApplicationStatus[] = [
    "Ready to Tailor",
    "CV Drafted",
    "Reviewed",
    "Evidence Needed",
    "Parsed",
    "New",
    "Applied",
    "Follow-up Needed",
    "Archived"
  ];
  const statusRank = (status: ApplicationStatus) => {
    const rank = statusOrder.indexOf(status);
    return rank === -1 ? statusOrder.length : rank;
  };
  const sortedJobs = [...jobs].sort((a, b) => statusRank(a.status) - statusRank(b.status));

  return (
    <PageHeader
      title="Opportunities"
      subtitle="Manage target jobs. Pick one opportunity, then open Screening Lab to analyze, generate CV, and review the gate."
      action={<button className="primary" onClick={onNew}><Plus size={16} /> Add Opportunity</button>}
    >
      <div className="toolbar-row">
        <label className="search-box">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search company, role, status" />
        </label>
      </div>
      {jobs.length === 0 ? (
        <EmptyState title="No JD yet. Add one opportunity first." action="Add New JD" onClick={onNew} />
      ) : (
        <div className="application-grid compact-opportunity-grid">
          {sortedJobs.map((job) => {
            const cvCount = data.cvVersions.filter((version) => version.jdId === job.id).length;
            const latestCv = latestCvForJob(data, job.id);
            const diagnostics = selectionDiagnostics(data, job);
            const readiness = submitReadiness(data, job, latestCv);
            return (
              <article key={job.id} className={job.id === selectedJobId ? "job-card selected compact-job-card" : "job-card compact-job-card"}>
                <div className="job-main">
                  <span className="company">{job.company || "Company unknown"}</span>
                  <strong>{job.role || "Untitled role"}</strong>
                  <small>{job.location || "Location unknown"}</small>
                  <div className="job-stats" aria-label="JD readiness">
                    <span className={`fit fit-${job.fit.toLowerCase()}`}>{job.fit} fit</span>
                    <span>{job.status}</span>
                    <span>{cvCount} CV</span>
                    <span>{diagnostics.selectedEvidence.length} evidence</span>
                    <span>{diagnostics.selectedStarStories.length} STAR</span>
                  </div>
                  <p><strong>Next:</strong> {readiness.nextAction || jobBlocker(job, cvCount)}</p>
                </div>
                <div className="job-meta">
                  <label>
                    <span>Status</span>
                    <select
                      aria-label={`${job.company || job.role || "JD"} status`}
                      value={job.status}
                      onChange={(event) => onStatus(job.id, event.target.value as ApplicationStatus)}
                    >
                      {statuses.map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </label>
                  <button className="secondary small" onClick={() => onSelect(job.id)}>Select</button>
                  <button className="primary small" onClick={() => onOpen(job.id)}>Open in Screening Lab</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </PageHeader>
  );
}
