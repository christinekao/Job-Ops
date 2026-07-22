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



export function SkillMap({ data, onChange }: { data: AppData; onChange: (skills: SkillInference[]) => void }) {
  const [pasteBack, setPasteBack] = useState("");
  const [preview, setPreview] = useState<ParsePreview<{ skillInferences: SkillInference[] }>>(emptyPreview);

  function parseSkillMap() {
    const parsed = tryParseJson<unknown>(pasteBack);
    if (!parsed.parsed || parsed.error) {
      setPreview({ raw: parsed.raw, parsed: null, error: parsed.error });
      return;
    }
    setPreview({
      raw: parsed.raw,
      parsed: { skillInferences: normalizeSkillInferences(parsed.parsed) },
      error: ""
    });
  }

  function applyPreview() {
    if (!preview.parsed?.skillInferences) return;
    onChange(preview.parsed.skillInferences);
  }

  function updateSkill(id: string, patch: Partial<SkillInference>) {
    onChange(data.skillInferences.map((skill) => skill.id === id ? { ...skill, ...patch } : skill));
  }

  function deleteSkill(id: string) {
    const skill = data.skillInferences.find((item) => item.id === id);
    if (!confirmRemoval(skill?.skill ? `skill "${skill.skill}"` : "this skill")) return;
    onChange(data.skillInferences.filter((skill) => skill.id !== id));
  }

  return (
    <PageHeader title="Skill Map" subtitle="從 project 歸納技術能力：不只列工具，也標出強度、使用情境、來源與可放進 CV 的說法。">
      <details className="repair-disclosure">
        <summary><Sparkles size={17} /> Repair / regenerate Skill Map</summary>
        <div className="repair-disclosure-body">
          <PasteBackPanel
            title="Repair Technical Capability Map"
            detail="只有 Skill Map 缺漏或需要重建時才使用。"
            prompt={buildSkillInferencePrompt(data)}
            pasteLabel="Paste GPT Skill Map JSON Back"
            pasteValue={pasteBack}
            onPasteChange={setPasteBack}
            onParse={parseSkillMap}
          />
          <ParsePreviewCard preview={preview} onApply={applyPreview} />
        </div>
      </details>
      <section className="panel skill-map-panel">
        <div className="panel-head">
          <h3>Inferred Technical Capability Map</h3>
          <span className="section-note">{data.skillInferences.length ? `${data.skillInferences.length} skills` : "No skill map yet."}</span>
        </div>
        {data.skillInferences.length === 0 ? (
          <p>Build this after Source of Truth. Evidence Bank and CV prompts can then reuse stronger, grounded skills.</p>
        ) : (
          <div className="skill-map-grid">
            {data.skillInferences.map((skill) => (
              <EditableSkillCard
                key={skill.id}
                skill={skill}
                onUpdate={(patch) => updateSkill(skill.id, patch)}
                onDelete={() => deleteSkill(skill.id)}
              />
            ))}
          </div>
        )}
      </section>
    </PageHeader>
  );
}
