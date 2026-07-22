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



export function HighCompensationMap({ signals, onChange }: { signals: HighCompensationSignal[]; onChange: (signals: HighCompensationSignal[]) => void }) {
  const updateSignal = (id: string, patch: Partial<HighCompensationSignal>) => {
    onChange(signals.map((signal) => signal.id === id ? { ...signal, ...patch } : signal));
  };
  return (
    <PageHeader
      title="High Compensation Signals"
      subtitle="這是 Evidence Bank 上方的決策層：用於履歷排序、seniority 定位、面試與談薪，不會刪除低價值但有來源的 evidence。"
    >
      {signals.length ? (
        <div className="compensation-signal-grid">
          {signals.map((signal) => (
            <article className={`panel compensation-signal ${signal.strength.toLowerCase()}`} key={signal.id}>
              <div className="panel-head">
                <div>
                  <span className="eyebrow">{signal.signalType}</span>
                  <h3>{signal.strength} leverage</h3>
                </div>
                <button className="danger-lite" onClick={() => confirmRemoval(`compensation signal "${signal.signalType}"`) && onChange(signals.filter((item) => item.id !== signal.id))}>Delete</button>
              </div>
              <p>{signal.whyItMattersToRecruiters}</p>
              <div className="tag-row">{signal.bestTargetRoles.map((role) => <em key={role}>{role}</em>)}</div>
              <dl className="compensation-positioning">
                <div><dt>CV</dt><dd>{signal.cvPositioning}</dd></div>
                <div><dt>Interview</dt><dd>{signal.interviewPositioning}</dd></div>
                <div><dt>Negotiation</dt><dd>{signal.salaryNegotiationUse}</dd></div>
              </dl>
              <details className="editable-details">
                <summary>Edit this signal</summary>
                <div className="editable-card-grid">
                  <Field label="Signal type" value={signal.signalType} onChange={(value) => updateSignal(signal.id, { signalType: value as HighCompensationSignal["signalType"] })} />
                  <Field label="Strength" value={signal.strength} onChange={(value) => updateSignal(signal.id, { strength: value as HighCompensationSignal["strength"] })} />
                  <Textarea label="Why recruiters care" value={signal.whyItMattersToRecruiters} rows={3} onChange={(whyItMattersToRecruiters) => updateSignal(signal.id, { whyItMattersToRecruiters })} />
                  <Textarea label="Best target roles" value={signal.bestTargetRoles.join(", ")} rows={2} onChange={(value) => updateSignal(signal.id, { bestTargetRoles: stringArray(value) })} />
                  <Textarea label="CV positioning" value={signal.cvPositioning} rows={3} onChange={(cvPositioning) => updateSignal(signal.id, { cvPositioning })} />
                  <Textarea label="Interview positioning" value={signal.interviewPositioning} rows={3} onChange={(interviewPositioning) => updateSignal(signal.id, { interviewPositioning })} />
                  <Textarea label="Salary negotiation use" value={signal.salaryNegotiationUse} rows={3} onChange={(salaryNegotiationUse) => updateSignal(signal.id, { salaryNegotiationUse })} />
                </div>
              </details>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No compensation signals yet" action="Run Generate → 6. Compensation after Evidence and Skills are complete" />
      )}
    </PageHeader>
  );
}
