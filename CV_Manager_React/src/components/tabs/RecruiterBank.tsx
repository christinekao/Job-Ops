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



export function RecruiterBank({ answers, onChange }: { answers: RecruiterAnswer[]; onChange: (answers: RecruiterAnswer[]) => void }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const visibleAnswers = answers.filter((item) => {
    if (!normalizedQuery) return true;
    return [item.category, item.question, item.answer, item.answerZh, item.tags.join(" ")]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });

  const updateAnswer = (id: string, patch: Partial<RecruiterAnswer>) => {
    onChange(answers.map((item) => item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item));
  };

  const addAnswer = () => {
    const next: RecruiterAnswer = {
      id: `answer-${Date.now()}`,
      category: "Interview",
      question: "",
      answer: "",
      answerZh: "",
      tags: [],
      updatedAt: new Date().toISOString()
    };
    onChange([next, ...answers]);
  };

  return (
    <PageHeader title="Recruiter Answer Bank" subtitle="保存可重用的面試回答、求職動機與 recruiter 對話素材。搜尋後可直接取用，不必每次重寫。">
      <section className="panel answer-bank-toolbar">
        <div className="answer-bank-search">
          <Search size={18} />
          <input
            aria-label="Search recruiter answers"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search question, answer, category, or tag"
          />
        </div>
        <div className="answer-bank-summary">
          <strong>{visibleAnswers.length}</strong>
          <span>{normalizedQuery ? `of ${answers.length} answers` : "saved answers"}</span>
        </div>
        <button className="primary" onClick={addAnswer}><Plus size={18} /> Add answer</button>
      </section>

      {visibleAnswers.length ? (
        <section className="answer-bank-grid">
          {visibleAnswers.map((item) => (
            <article className="panel answer-card" key={item.id}>
              <div className="answer-card-head">
                <input
                  className="answer-category"
                  aria-label="Answer category"
                  value={item.category}
                  onChange={(event) => updateAnswer(item.id, { category: event.target.value })}
                  placeholder="Category"
                />
                <button className="danger compact" onClick={() => confirmRemoval(`answer "${item.question}"`) && onChange(answers.filter((answer) => answer.id !== item.id))}>Delete</button>
              </div>
              <label>
                Question
                <textarea
                  value={item.question}
                  onChange={(event) => updateAnswer(item.id, { question: event.target.value })}
                  placeholder="e.g. Why are you interested in this role?"
                  rows={2}
                />
              </label>
              <label>
                English answer
                <textarea
                  value={item.answer}
                  onChange={(event) => updateAnswer(item.id, { answer: event.target.value })}
                  placeholder="Concise, evidence-backed answer"
                  rows={5}
                />
              </label>
              <label>
                中文備註 / 回答
                <textarea
                  value={item.answerZh}
                  onChange={(event) => updateAnswer(item.id, { answerZh: event.target.value })}
                  placeholder="可留中文版本、提醒或補充脈絡"
                  rows={3}
                />
              </label>
              <label>
                Tags
                <input
                  value={item.tags.join(", ")}
                  onChange={(event) => updateAnswer(item.id, { tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })}
                  placeholder="leadership, motivation, AI"
                />
              </label>
              <small>Updated {new Date(item.updatedAt).toLocaleString()}</small>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState
          title={answers.length ? "No matching answers" : "No recruiter answers yet"}
          action={answers.length ? "Clear the search or use a different keyword" : "Add your first reusable answer"}
        />
      )}
    </PageHeader>
  );
}
