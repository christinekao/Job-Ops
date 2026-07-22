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



export function SourceIntake({ sources, onChange }: { sources: RawSource[]; onChange: (sources: RawSource[]) => void }) {
  function updateSource(id: string, patch: Partial<RawSource>) {
    onChange(sources.map((source) => {
      if (source.id !== id) return source;
      const clearsSnapshot = ("content" in patch && patch.content !== source.content)
        || ("kind" in patch && patch.kind !== source.kind);
      return {
        ...source,
        ...patch,
        ...(clearsSnapshot ? { parsedSnapshot: undefined } : {}),
        updatedAt: new Date().toISOString()
      };
    }));
  }

  function addSource() {
    onChange([
      { id: uid("source"), kind: "Project Notes", title: "New raw source", content: "", updatedAt: new Date().toISOString() },
      ...sources
    ]);
  }

  function removeSource(id: string) {
    const source = sources.find((item) => item.id === id);
    if (!confirmRemoval(source?.title ? `source "${source.title}"` : "this source")) return;
    onChange(sources.filter((source) => source.id !== id));
  }

  return (
    <PageHeader
      title="Source Intake"
      subtitle="完整保留 original CV、HTML、Markdown、project notes，不直接拿 messy data 生成 CV。"
      action={<button className="primary" onClick={addSource}><Plus size={16} /> Add Source</button>}
    >
      <div className="source-list">
        {sources.length === 0 && (
          <section className="empty-panel">
            <strong>No raw source saved yet.</strong>
            <span>Use Add Source to paste an original CV, HTML CV, Markdown notes, or project evidence.</span>
          </section>
        )}
        {sources.map((source) => (
          <SourceCard
            key={source.id}
            source={source}
            onUpdate={(patch) => updateSource(source.id, patch)}
            onRemove={() => removeSource(source.id)}
          />
        ))}
      </div>
    </PageHeader>
  );
}

export function SourceCard({
  source,
  onUpdate,
  onRemove
}: {
  source: RawSource;
  onUpdate: (patch: Partial<RawSource>) => void;
  onRemove: () => void;
}) {
  const [pasteBack, setPasteBack] = useState("");
  const [preview, setPreview] = useState<ParsePreview<SourceParsedSnapshot>>(emptyPreview);
  const prompt = buildSingleSourceSnapshotPrompt(source);
  const sourceHash = contentHash(source.content);
  const parsed = source.parsedSnapshot;
  const snapshotStale = Boolean(parsed && parsed.sourceContentHash !== sourceHash);

  function parseSnapshot() {
    const parsedJson = tryParseJson<unknown>(pasteBack);
    if (!parsedJson.parsed || parsedJson.error) {
      setPreview({ raw: parsedJson.raw, parsed: null, error: parsedJson.error });
      return;
    }
    setPreview({
      raw: parsedJson.raw,
      parsed: normalizeSourceParsedSnapshot(parsedJson.parsed, source),
      error: ""
    });
  }

  function applySnapshot() {
    if (!preview.parsed) return;
    onUpdate({ parsedSnapshot: preview.parsed });
    setPasteBack("");
    setPreview(emptyPreview);
  }

  return (
    <section className="panel source-card">
      <div className="source-card-head">
        <div>
          <strong>{source.title || "Untitled source"}</strong>
          <span className={snapshotStale ? "source-status stale" : parsed ? "source-status parsed" : "source-status"}>
            {snapshotStale ? "Snapshot stale after edits" : parsed ? `Parsed snapshot · ${parsed.workExperiences.length} experiences` : "Raw only"}
          </span>
        </div>
        <button className="danger-lite" onClick={onRemove}>Remove</button>
      </div>
      <div className="source-card-fields">
        <Field label="Title" value={source.title} onChange={(title) => onUpdate({ title })} />
        <div className="field">
          <label>Kind</label>
          <select value={source.kind} onChange={(event) => onUpdate({ kind: event.target.value as RawSource["kind"] })}>
            <option>Original CV</option>
            <option>Project Notes</option>
            <option>HTML</option>
            <option>Markdown</option>
            <option>Achievement Notes</option>
            <option>Market JD Reference</option>
          </select>
        </div>
      </div>
      <Textarea label="Raw content" value={source.content} onChange={(content) => onUpdate({ content })} rows={8} />
      <details className="source-parse-panel">
        <summary>Advanced: repair this source snapshot only</summary>
        <p className="muted-small">
          正常流程請到 Generate 使用自動分批 Batch Source Snapshot。只有這一張 source 失敗、過期，或你只想修單張內容時才用這裡。
        </p>
        <ManualAiPanel
          prompt={prompt}
          inputLabel="Prepare Input Data：this raw source only"
          inputValue={JSON.stringify({ id: source.id, title: source.title, kind: source.kind, content: source.content }, null, 2)}
          readOnlyInput
          pasteLabel="Paste GPT Source Snapshot JSON Back"
          pasteValue={pasteBack}
          onPasteChange={setPasteBack}
          onParse={parseSnapshot}
        />
        <ParsePreviewCard preview={preview} onApply={applySnapshot} applyLabel="Apply source snapshot" />
      </details>
    </section>
  );
}
