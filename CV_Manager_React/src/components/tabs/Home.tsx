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


import { SubmitReadinessPanel } from "../shared/SubmitReadinessComponents";
export function HomePage({ data, onGo, onSelectJob }: { data: AppData; onGo: (tab: TabId) => void; onSelectJob: (jobId: string) => void }) {
  const activeJobs = data.jobs.filter((job) => job.status !== "Archived");
  const priorityJobs = [...activeJobs]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);
  const nextAction = nextSetupAction(data);
  const nextDestination = nextSetupDestination(data);

  return (
    <PageHeader title="Strategy Center" subtitle="A high-level view of your interview strategy: strongest opportunities, screening blockers, and reusable evidence readiness.">
      <section className="home-hero panel">
        <div>
          <span className="eyebrow">Interview-first strategy</span>
          <h2>{activeJobs.length ? `${activeJobs.length} active opportunities in pipeline` : "Start by adding one target JD"}</h2>
          <p>Strategic move: {nextAction}</p>
        </div>
        <button className="primary" onClick={() => onGo(nextDestination.tab)}>{nextDestination.label}</button>
      </section>
      <section className="home-stats">
        <article><span>Active opportunities</span><strong>{activeJobs.length}</strong></article>
        <article><span>Evidence cards</span><strong>{data.evidenceCards.length}</strong></article>
        <article><span>STAR stories</span><strong>{data.starStories.length}</strong></article>
        <article><span>CV versions</span><strong>{data.cvVersions.length}</strong></article>
      </section>
      <div className="home-grid">
        <section className="panel home-opportunities">
          <div className="panel-head"><h3>Opportunity priority snapshot</h3><button className="secondary small" onClick={() => onGo("inbox")}>Manage all</button></div>
          {priorityJobs.length ? priorityJobs.map((job) => (
            <button className="home-job-row" key={job.id} onClick={() => onSelectJob(job.id)}>
              <span><strong>{job.role}</strong><small>{job.company || "Company unknown"} · {job.location || "Location not set"}</small></span>
              <span><em>{job.fit} fit</em><small>{job.status}</small></span>
            </button>
          )) : <p className="section-note">No opportunity yet. Add a JD to begin.</p>}
        </section>
        <section className="panel home-actions">
          <h3>Strategy shortcuts</h3>
          <button onClick={() => onGo("inbox")}><Briefcase size={17} /><span><strong>Choose an opportunity</strong><small>Pick the JD to work on next</small></span></button>
          <button onClick={() => onGo("screening-lab")}><Target size={17} /><span><strong>Continue Screening Lab</strong><small>Analyze requirements, generate CV, and review gate</small></span></button>
          <button onClick={() => onGo("career-source")}><Database size={17} /><span><strong>Strengthen Career Evidence</strong><small>Improve reusable skills, evidence, and STAR support</small></span></button>
          <button onClick={() => onGo("cv-builder")}><FileText size={17} /><span><strong>Open CV Studio</strong><small>Edit, audit, and export generated CVs</small></span></button>
        </section>
      </div>
    </PageHeader>
  );
}
