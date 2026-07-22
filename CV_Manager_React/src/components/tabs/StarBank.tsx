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



export function StarBank({ data, onChange }: { data: AppData; onChange: (stories: StarStory[]) => void }) {
  const [pasteBack, setPasteBack] = useState("");
  const [preview, setPreview] = useState<ParsePreview<{ starStories: StarStory[] }>>(emptyPreview);
  const [batchIndex, setBatchIndex] = useState(0);
  const [repairOpen, setRepairOpen] = useState(true);
  const [repairMessage, setRepairMessage] = useState("");
  const groups = groupByExperience(data.starStories, data.careerProfile);
  const coveredExperienceIds = new Set(data.starStories.map((story) => story.experienceId).filter(Boolean));
  const missingStoryExperiences = data.careerProfile.workExperiences.filter((experience) =>
    data.evidenceCards.some((card) => card.experienceId === experience.id)
    && !coveredExperienceIds.has(experience.id)
  );
  const coverageSortedEvidence = [...data.evidenceCards].sort((a, b) => {
    const aCovered = coveredExperienceIds.has(a.experienceId) ? 1 : 0;
    const bCovered = coveredExperienceIds.has(b.experienceId) ? 1 : 0;
    return aCovered - bCovered;
  });
  const batches = chunkItemsBySize(coverageSortedEvidence, 18000, (items) => JSON.stringify(items));
  const activeBatchIndex = Math.min(batchIndex, Math.max(batches.length - 1, 0));
  const activeEvidence = batches[activeBatchIndex] || [];
  const batchTotal = Math.max(batches.length, 1);
  const batchLabel = `Batch ${activeBatchIndex + 1} of ${batchTotal}`;
  const prompt = buildStarPrompt(data, activeEvidence);

  function updateStory(id: string, patch: Partial<StarStory>) {
    onChange(data.starStories.map((story) => story.id === id ? { ...story, ...patch } : story));
  }

  function deleteStory(id: string) {
    const story = data.starStories.find((item) => item.id === id);
    if (!confirmRemoval(story?.title ? `STAR story "${story.title}"` : "this STAR story")) return;
    onChange(data.starStories.filter((story) => story.id !== id));
  }

  function apply() {
    if (!preview.parsed?.starStories) return;
    onChange(mergeCardsByIdentity(
      data.starStories,
      preview.parsed.starStories,
      (story) => normalizeMatchKey(story.title, story.situation, story.action, story.result, story.experienceId, story.projectId)
    ));
    const hasNextBatch = activeBatchIndex < batches.length - 1;
    setRepairMessage(hasNextBatch
      ? `Batch ${activeBatchIndex + 1} applied. Continue with Batch ${activeBatchIndex + 2} of ${batchTotal} below.`
      : `Batch ${activeBatchIndex + 1} applied. STAR batch workflow is complete.`);
    if (hasNextBatch) setBatchIndex(activeBatchIndex + 1);
    setRepairOpen(true);
    setPreview(emptyPreview);
    setPasteBack("");
    window.requestAnimationFrame(() => document.getElementById("star-current-batch")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function changeBatch(nextIndex: number) {
    if (pasteBack.trim() && !window.confirm("Switch batch and discard the STAR JSON currently pasted here?")) return;
    setBatchIndex(nextIndex);
    setPasteBack("");
    setPreview(emptyPreview);
  }

  return (
    <PageHeader title="STAR Story Bank" subtitle="從 evidence 產 reusable stories，面試、cover letter、CV 都能重用。">
      {missingStoryExperiences.length > 0 && (
        <div className="save-status error">
          STAR coverage gap: {missingStoryExperiences.map((experience) => experience.company || experience.role).join(", ")}. Open Repair to generate these missing work-history stories first.
        </div>
      )}
      {repairMessage && <div className="save-status">{repairMessage}</div>}
      <details
        className="repair-disclosure"
        open={repairOpen}
        onToggle={(event) => setRepairOpen(event.currentTarget.open)}
      >
        <summary><Sparkles size={17} /> Repair / add STAR stories in batches</summary>
        <div className="repair-disclosure-body">
      <section className="panel evidence-batch-workflow" id="star-current-batch">
        <header className="evidence-batch-header">
          <div>
            <span className="eyebrow">Current STAR task</span>
            <h3>{batchLabel}</h3>
            <p>Copy、Paste、Parse 全部屬於同一批。Apply 後會自動前往下一批。</p>
          </div>
          <span className="evidence-batch-badge">{activeEvidence.length} evidence cards</span>
        </header>

        <div className="evidence-batch-projects" aria-label={`${batchLabel} evidence list`}>
          {activeEvidence.map((card) => <span key={card.id}>{card.title}</span>)}
        </div>

        <section className="evidence-batch-step">
          <span className="evidence-step-number">1</span>
          <div>
            <strong>Copy prompt for {batchLabel}</strong>
            <p>Prompt 只包含上方 evidence cards。</p>
          </div>
          <CopyButton text={prompt} label={`Copy ${batchLabel} Prompt`} />
        </section>

        <section className="evidence-batch-step paste-step">
          <span className="evidence-step-number">2</span>
          <div className="evidence-batch-paste">
            <div className="evidence-batch-paste-head">
              <div>
                <strong>Paste GPT result for {batchLabel}</strong>
                <p>只接受 <code>{`{ "starStories": [...] }`}</code></p>
              </div>
              <ParseAction value={pasteBack} onParse={() => {
          const parsed = tryParseJson<unknown>(pasteBack);
          setPreview(parsed.parsed && !parsed.error
            ? { raw: parsed.raw, parsed: { starStories: normalizeStarStories(parsed.parsed) }, error: "" }
            : { raw: parsed.raw, parsed: null, error: parsed.error });
              }} />
            </div>
            <textarea
              aria-label={`Paste GPT STAR JSON for ${batchLabel}`}
              placeholder={`Paste only the GPT JSON returned from “Copy ${batchLabel} Prompt” here…`}
              value={pasteBack}
              onChange={(event) => setPasteBack(event.target.value)}
              rows={12}
            />
          </div>
        </section>

        <ParsePreviewCard preview={preview} onApply={apply} applyLabel={`Apply ${batchLabel} and continue`} />

        <details className="evidence-batch-switcher">
          <summary>Need to switch batches manually?</summary>
          <div>
            <button className="secondary small" disabled={activeBatchIndex === 0} onClick={() => changeBatch(Math.max(activeBatchIndex - 1, 0))}>Previous batch</button>
            <button className="secondary small" disabled={activeBatchIndex >= batches.length - 1} onClick={() => changeBatch(Math.min(activeBatchIndex + 1, batches.length - 1))}>Next batch</button>
          </div>
        </details>
      </section>
        </div>
      </details>
      <GroupedStoryView
        groups={groups}
        profile={data.careerProfile}
        onUpdate={updateStory}
        onDelete={deleteStory}
      />
    </PageHeader>
  );
}
