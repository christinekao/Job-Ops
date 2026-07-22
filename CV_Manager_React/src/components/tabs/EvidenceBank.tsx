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
import { evidenceCoverageForProject, validateEvidenceBatch } from "../../data/evidence";
import { createEvidenceTask, validateEvidenceTaskEnvelope } from "../../data/evidenceTasks";
import { freshSourceHashes } from "../../data/sourceHashes";
import { CvPreview } from "../cv/CvPreview";



export function EvidenceBank({ data, onChange }: { data: AppData; onChange: (cards: EvidenceCard[]) => void }) {
  const [pasteBack, setPasteBack] = useState("");
  const [preview, setPreview] = useState<ParsePreview<{ evidenceCards: EvidenceCard[] }>>(emptyPreview);
  const [batchIndex, setBatchIndex] = useState(0);
  const [repairRun, setRepairRun] = useState<{ completed: number; total: number } | null>(null);
  const [repairMessage, setRepairMessage] = useState("");
  const [repairOpen, setRepairOpen] = useState(true);
  const groups = groupByExperience(data.evidenceCards, data.careerProfile);
  const projectCoverage = data.careerProfile.workExperiences.flatMap((experience) => experience.projects.map((project) => ({
    experience,
    project,
    coverage: evidenceCoverageForProject(data, experience.id, project.id)
  })));
  const coveredProjectIds = new Set(projectCoverage
    .filter(({ coverage }) => coverage.traceabilityCovered)
    .map(({ project }) => project.id));
  const cvUsableProjectIds = new Set(projectCoverage
    .filter(({ coverage }) => coverage.cvUsableCovered)
    .map(({ project }) => project.id));
  const missingEvidenceProjects = data.careerProfile.workExperiences.flatMap((experience) =>
    experience.projects
      .filter((project) => !coveredProjectIds.has(project.id))
      .map((project) => ({ company: experience.company, project }))
  );
  const profileSlices = data.careerProfile.workExperiences.flatMap((experience) => {
    const projects = missingEvidenceProjects.length
      ? experience.projects.filter((project) => !coveredProjectIds.has(project.id))
      : experience.projects;
    return projects.length
      ? projects.map((project) => ({ ...experience, projects: [project] }))
      : [];
  });
  const batches = chunkItemsBySize(profileSlices, 6000, (items) => JSON.stringify(items));
  const activeBatchIndex = Math.min(batchIndex, Math.max(batches.length - 1, 0));
  const activeExperiences = batches[activeBatchIndex] || [];
  const batchTotal = repairRun?.total || Math.max(batches.length, 1);
  const displayedBatchNumber = repairRun ? Math.min(repairRun.completed + 1, batchTotal) : activeBatchIndex + 1;
  const batchLabel = `Batch ${displayedBatchNumber} of ${batchTotal}`;
  const activeProjectNames = activeExperiences.flatMap((experience) =>
    experience.projects.map((project) => `${experience.company} — ${project.name}`)
  );
  const activeProfile = { ...data.careerProfile, workExperiences: activeExperiences };
  const activeProjectIds = activeExperiences.flatMap((experience) => experience.projects.map((project) => project.id));
  const evidenceTask = createEvidenceTask(data, activeProjectIds);
  const prompt = buildEvidencePrompt(data, activeProfile, missingEvidenceProjects.length > 0, evidenceTask);

  function updateEvidence(id: string, patch: Partial<EvidenceCard>) {
    const nextCards = data.evidenceCards.map((card) => card.id === id ? { ...card, ...patch } : card);
    const changedCard = nextCards.find((card) => card.id === id);
    const validation = validateEvidenceBatch(data, changedCard ? [changedCard] : []);
    if (!validation.valid) {
      setRepairMessage(`Evidence update was not saved: ${validation.errors.join("; ")}`);
      return;
    }
    onChange(nextCards);
  }

  function deleteEvidence(id: string) {
    const card = data.evidenceCards.find((item) => item.id === id);
    if (!confirmRemoval(card?.title ? `evidence "${card.title}"` : "this evidence card")) return;
    onChange(data.evidenceCards.filter((card) => card.id !== id));
  }

  function createBaselineEvidenceForGaps() {
    const baselineCards: EvidenceCard[] = data.careerProfile.workExperiences.flatMap((experience) =>
      experience.projects
        .filter((project) => !coveredProjectIds.has(project.id))
        .map((project) => ({
          id: `evidence-baseline-${project.id}`,
          title: project.name,
          category: project.category || "Additional Project Experience",
          sectionTitle: project.category || "Additional Project Experience",
          tools: project.tools,
          proof: project.summary || `${project.name} was recorded under ${experience.company}.`,
          cvBullet: project.summary || `Contributed to ${project.name} at ${experience.company}.`,
          metrics: project.metrics,
          sourceIds: project.sourceIds,
          experienceId: experience.id,
          projectId: project.id,
          confidence: "Needs Review" as const,
          evidenceTier: "Supporting" as const,
          canBeUsedInCv: "No" as const,
          visibilityUse: "Interview Only" as const,
          claimLevel: "Interview Only" as const
        }))
    );
    onChange(mergeCardsByIdentity(
      data.evidenceCards,
      baselineCards,
      (card) => normalizeMatchKey(card.title, card.proof, card.experienceId, card.projectId)
    ));
    setRepairMessage(`Created ${baselineCards.length} baseline Evidence card(s) for owner review. They are not CV-usable until source linkage and claim policy are confirmed.`);
  }

  function apply() {
    if (!preview.parsed?.evidenceCards) return;
    const previouslyMissingIds = new Set(missingEvidenceProjects.map(({ project }) => project.id));
    const newlyCoveredIds = new Set(
      preview.parsed.evidenceCards
        .map((card) => card.projectId)
        .filter((projectId): projectId is string => typeof projectId === "string" && previouslyMissingIds.has(projectId))
    );
    const remainingCount = Math.max(missingEvidenceProjects.length - newlyCoveredIds.size, 0);
    onChange(mergeCardsByIdentity(
      data.evidenceCards,
      preview.parsed.evidenceCards,
      (card) => normalizeMatchKey(card.title, card.proof, card.experienceId, card.projectId)
    ));
    const completed = Math.min((repairRun?.completed || activeBatchIndex) + 1, repairRun?.total || batches.length);
    const total = repairRun?.total || batches.length;
    setRepairRun({ completed, total });
    setRepairOpen(true);
    setRepairMessage(remainingCount
      ? `Batch ${completed} applied. ${remainingCount} project(s) remain. Continue with Batch ${Math.min(completed + 1, total)} of ${total} below.`
      : `Batch ${completed} applied. Evidence coverage is complete.`);
    setBatchIndex(0);
    setPreview(emptyPreview);
    setPasteBack("");
    window.requestAnimationFrame(() => document.getElementById("evidence-current-batch")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function changeBatch(nextIndex: number) {
    if (pasteBack.trim() && !window.confirm("Switch batch and discard the JSON currently pasted here?")) return;
    setBatchIndex(nextIndex);
    setPasteBack("");
    setPreview(emptyPreview);
  }

  return (
    <PageHeader title="Evidence Bank" subtitle="每張卡只保留一個外部可理解的 hiring signal；原始細節仍留在 source archive。">
      {missingEvidenceProjects.length > 0 && (
        <div className="save-status error coverage-gap-status">
          <span>Traceability coverage gap: {missingEvidenceProjects.length} project(s) remain. CV-usable coverage currently covers {cvUsableProjectIds.size} project(s).</span>
          <button type="button" className="secondary small" onClick={createBaselineEvidenceForGaps}>Create review baseline cards for all gaps</button>
        </div>
      )}
      {repairMessage && <div className="save-status">{repairMessage}</div>}
      <details
        className="repair-disclosure"
        open={repairOpen}
        onToggle={(event) => setRepairOpen(event.currentTarget.open)}
      >
        <summary><Sparkles size={17} /> Repair / add Evidence in batches</summary>
        <div className="repair-disclosure-body">
      <section className="panel evidence-batch-workflow" id="evidence-current-batch">
        <header className="evidence-batch-header">
          <div>
            <span className="eyebrow">Current repair task</span>
            <h3>{batchLabel}</h3>
            <p>以下 Copy、Paste、Parse 全部只屬於同一批。Apply 完成後，系統才會準備下一批。</p>
          </div>
          <span className="evidence-batch-badge">{activeExperiences.length} projects</span>
        </header>

        <div className="evidence-batch-projects" aria-label={`${batchLabel} project list`}>
          {activeProjectNames.map((name) => <span key={name}>{name}</span>)}
        </div>

        <section className="evidence-batch-step">
          <span className="evidence-step-number">1</span>
          <div>
            <strong>Copy prompt for {batchLabel}</strong>
            <p>Prompt 已包含上方列出的 projects。不要切換 batch 後再貼舊回覆。</p>
          </div>
          <CopyButton text={prompt} label={`Copy ${batchLabel} Prompt`} />
        </section>

        <section className="evidence-batch-step paste-step">
          <span className="evidence-step-number">2</span>
          <div className="evidence-batch-paste">
            <div className="evidence-batch-paste-head">
              <div>
                <strong>Paste GPT result for {batchLabel}</strong>
                <p>只接受 <code>{`{ "task": {...}, "evidenceCards": [...] }`}</code></p>
              </div>
              <ParseAction value={pasteBack} onParse={() => {
          const parsed = tryParseJson<unknown>(pasteBack);
          if (!parsed.parsed || parsed.error) {
            setPreview({ raw: parsed.raw, parsed: null, error: parsed.error });
            return;
          }
          const root = parsed.parsed as Record<string, unknown>;
          const evidenceCards = normalizeEvidenceCards(root);
          const envelopeValidation = validateEvidenceTaskEnvelope(data, evidenceTask, { task: root.task, evidenceCards });
          if (!envelopeValidation.valid) {
            setPreview({ raw: parsed.raw, parsed: null, error: `Evidence task validation failed: ${envelopeValidation.errors.join("; ")}` });
            return;
          }
          setPreview({ raw: parsed.raw, parsed: { evidenceCards }, error: "" });
              }} />
            </div>
            <textarea
              aria-label={`Paste GPT Evidence JSON for ${batchLabel}`}
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
      <GroupedEvidenceView
        groups={groups}
        profile={data.careerProfile}
        onUpdate={updateEvidence}
        onDelete={deleteEvidence}
      />
    </PageHeader>
  );
}
