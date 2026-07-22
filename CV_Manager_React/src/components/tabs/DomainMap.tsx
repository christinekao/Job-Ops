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



export function DomainKnowledgeMap({ data, onChange }: { data: AppData; onChange: (domainKnowledge: DomainKnowledge[]) => void }) {
  const [pasteBack, setPasteBack] = useState("");
  const [preview, setPreview] = useState<ParsePreview<{ domainKnowledge: DomainKnowledge[] }>>(emptyPreview);
  const grouped = data.domainKnowledge.reduce<Record<string, DomainKnowledge[]>>((acc, item) => {
    acc[item.domain] = [...(acc[item.domain] || []), item];
    return acc;
  }, {});

  function parseDomainKnowledge() {
    const parsed = tryParseJson<unknown>(pasteBack);
    if (!parsed.parsed || parsed.error) {
      setPreview({ raw: parsed.raw, parsed: null, error: parsed.error });
      return;
    }
    setPreview({
      raw: parsed.raw,
      parsed: { domainKnowledge: normalizeDomainKnowledge(parsed.parsed) },
      error: ""
    });
  }

  function applyPreview() {
    if (!preview.parsed?.domainKnowledge) return;
    onChange(preview.parsed.domainKnowledge);
  }

  function updateDomainItem(id: string, patch: Partial<DomainKnowledge>) {
    onChange(data.domainKnowledge.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  function deleteDomainItem(id: string) {
    const item = data.domainKnowledge.find((entry) => entry.id === id);
    if (!confirmRemoval(item?.businessProcess ? `domain card "${item.businessProcess}"` : "this domain card")) return;
    onChange(data.domainKnowledge.filter((item) => item.id !== id));
  }

  function domainSummary(items: DomainKnowledge[]) {
    const processes = [...new Set(items.map((item) => item.businessProcess).filter(Boolean))].slice(0, 3);
    const stakeholders = [...new Set(items.flatMap((item) => item.stakeholders).filter(Boolean))].slice(0, 5);
    const systems = [...new Set(items.flatMap((item) => item.systemsOrData).filter(Boolean))].slice(0, 5);
    const metrics = [...new Set(items.flatMap((item) => item.metricsOrKpis).filter(Boolean))].slice(0, 4);
    const firstProof = items.map((item) => item.proof).find(Boolean);
    return [
      processes.length ? `Covers ${processes.join(", ")}.` : "",
      stakeholders.length ? `Stakeholders: ${stakeholders.join(", ")}.` : "",
      systems.length ? `Systems/data: ${systems.join(", ")}.` : "",
      metrics.length ? `KPI language: ${metrics.join(", ")}.` : "",
      !processes.length && firstProof ? firstProof : ""
    ].filter(Boolean).join(" ");
  }

  function shortText(value: string, max = 150) {
    const cleaned = value.replace(/\s+/g, " ").trim();
    return cleaned.length > max ? `${cleaned.slice(0, max - 1).trim()}...` : cleaned;
  }

  function compactFacts(item: DomainKnowledge) {
    return [
      ...item.stakeholders.slice(0, 3).map((value) => `Stakeholder: ${value}`),
      ...item.systemsOrData.slice(0, 3).map((value) => `System: ${value}`),
      ...item.metricsOrKpis.slice(0, 3).map((value) => `KPI: ${value}`)
    ];
  }

  return (
    <PageHeader title="Domain Knowledge Map" subtitle="從 project 推導業務場景、流程、stakeholders、系統資料、風險與 KPI，讓 JD tailoring 有產業/職能語言。">
      <details className="repair-disclosure">
        <summary><Sparkles size={17} /> Repair / regenerate Domain Map</summary>
        <div className="repair-disclosure-body">
          <PasteBackPanel
            title="Repair Domain Knowledge Map"
            detail="只有 Domain / Process / Stakeholder / KPI 資料缺漏時才使用。"
            prompt={buildDomainKnowledgePrompt(data)}
            pasteLabel="Paste GPT Domain Knowledge JSON Back"
            pasteValue={pasteBack}
            onPasteChange={setPasteBack}
            onParse={parseDomainKnowledge}
          />
          <ParsePreviewCard preview={preview} onApply={applyPreview} />
        </div>
      </details>
      <section className="panel domain-map-panel">
        <div className="panel-head">
          <h3>Inferred Domain Knowledge</h3>
          <span className="section-note">{data.domainKnowledge.length ? `${data.domainKnowledge.length} domain items` : "No domain knowledge yet."}</span>
        </div>
        {data.domainKnowledge.length === 0 ? (
          <p>Build this from Career Backbone. It should capture what business contexts you understand, not just which tools you used.</p>
        ) : (
          <div className="domain-map-grid">
            {Object.entries(grouped).map(([domain, items]) => (
              <article className="domain-map-group" key={domain}>
                <h4>{domain}</h4>
                <p className="domain-summary">{domainSummary(items)}</p>
                {items.map((item) => (
                  <EditableDomainCard
                    key={item.id}
                    item={item}
                    profile={data.careerProfile}
                    summaryFacts={compactFacts(item)}
                    shortText={shortText}
                    onUpdate={(patch) => updateDomainItem(item.id, patch)}
                    onDelete={() => deleteDomainItem(item.id)}
                  />
                ))}
              </article>
            ))}
          </div>
        )}
      </section>
    </PageHeader>
  );
}
