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
import { selectionDiagnostics, buildGenerationContext, isCvStaleForJob, fitRecommendationsApplied, latestCvForJob, cleanSelectionPatch } from "../../data/selection";
import { BackboneCoveragePanel } from "../shared/BackboneComponents";
import { WorkspaceInspector } from "../shared/WorkspaceInspector";
import {
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


import { CVEditorExportPage } from "../cv/CVStudio";
export function CVBuilderWorkspace({
  data,
  job,
  cv,
  cvVersions,
  onGo,
  onSelectCv,
  onSave,
  onUpdateJob
}: {
  data: AppData;
  job?: JobApplication;
  cv?: CvVersion;
  cvVersions: CvVersion[];
  onGo: (tab: TabId) => void;
  onSelectCv: (cvId: string) => void;
  onSave: (version: CvVersion) => void;
  onUpdateJob: (patch: Partial<JobApplication>) => void;
}) {
  const cvNeedsGeneration = !job || !cv?.tailoredCv || isCvStaleForJob(cv, job, data);
  const [activeCvView, setActiveCvView] = useState<"versions" | "edit">(() => cvNeedsGeneration ? "versions" : "edit");
  useEffect(() => {
    setActiveCvView(cvNeedsGeneration ? "versions" : "edit");
  }, [job?.id, cv?.id, cvNeedsGeneration]);
  const cvViews: {
    id: typeof activeCvView;
    label: string;
    count?: number;
    title: string;
    detail: string;
    content: React.ReactNode;
  }[] = job ? [
    {
      id: "versions",
      label: "Versions",
      count: cvVersions.length,
      title: "Review saved CV versions",
      detail: "同一份 JD 可以保留多版 CV。先選定要編輯或匯出的版本，再進 Edit / Export。",
      content: (
        <>
          <section className="panel cv-version-switcher">
            <div>
              <span>Selected JD</span>
              <strong>{job.role} · {job.company}</strong>
              <p>{cvVersions.length ? `${cvVersions.length} saved CV version(s) for this JD` : "No saved CV version yet"}</p>
            </div>
            <div className="field">
              <label htmlFor="cv-builder-version">CV version to edit / export</label>
              <select
                id="cv-builder-version"
                value={cv?.id || ""}
                onChange={(event) => onSelectCv(event.target.value)}
                disabled={!cvVersions.length}
              >
                {cvVersions.length ? (
                  cvVersions.map((version) => (
                    <option key={version.id} value={version.id}>
                      {version.name} · {new Date(version.updatedAt).toLocaleString()}
                    </option>
                  ))
                ) : (
                  <option value="">Generate and save a CV version first</option>
                )}
              </select>
            </div>
          </section>
          {!cvVersions.length || cvNeedsGeneration ? (
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h3>Generate CV in Screening Lab first</h3>
                  <p>CV Studio is now only for reviewing, editing, and exporting saved CV versions. JD analysis and evidence selection happen in Screening Lab.</p>
                </div>
                <button className="primary" onClick={() => onGo("screening-lab")}>Open Screening Lab</button>
              </div>
            </section>
          ) : null}
          <CvVersionHistoryTable data={data} job={job} versions={cvVersions} selectedCvId={cv?.id} onSelectCv={onSelectCv} />
        </>
      )
    },
    {
      id: "edit",
      label: "Edit / Export",
      count: cv ? 1 : 0,
      title: "Edit and export final CV",
      detail: "只顯示目前 selected version 的 block editor 與正式兩頁 preview。這裡是最後交付區。",
      content: <CVEditorExportPage data={data} job={job} cv={cv} onSave={onSave} onUpdateJob={onUpdateJob} />
    }
  ] : [];
  const selectedCvView = cvViews.find((view) => view.id === activeCvView) || cvViews[0];

  return (
    <PageHeader title="CV Studio" subtitle="只編輯與匯出已由 Screening Lab 產生的 CV。不要在這裡重新跑 JD 或選 evidence。">
      {job ? (
        <>
          <section className="panel cv-studio-tabs">
            <div className="backbone-tabs">
              {cvViews.map((view) => (
                <button
                  key={view.id}
                  className={view.id === activeCvView ? "active" : ""}
                  onClick={() => setActiveCvView(view.id)}
                >
                  <span>{view.label}</span>
                  {typeof view.count === "number" && <small>{view.count}</small>}
                </button>
              ))}
            </div>
          </section>
          <FocusSection step={selectedCvView?.label || "CV"} title={selectedCvView?.title || "CV Studio"} detail={selectedCvView?.detail || "Select a CV workflow step."}>
            {selectedCvView?.content}
          </FocusSection>
        </>
      ) : (
        <EmptyState title="No selected JD yet" action="Create or select a JD before building a CV" />
      )}
    </PageHeader>
  );
}
