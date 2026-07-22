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
import { evidenceCoverageForProject, validateEvidenceCard } from "../../data/evidence";
import { buildProjectTaskInput } from "../../data/projectTaskInput";
import { freshSourceHashes } from "../../data/sourceHashes";
import { CvPreview } from "../cv/CvPreview";
import { SourceIntake } from "./SourceIntake";
import { SourceTruth } from "./SourceTruth";
import { SkillMap } from "./SkillMap";
import { DomainKnowledgeMap } from "./DomainMap";
import { EvidenceBank } from "./EvidenceBank";
import { StarBank } from "./StarBank";
import { HighCompensationMap } from "./HighCompMap";



export function CareerSourceBuilder({
  data,
  onRawSourcesChange,
  onTruthChange,
  onSkillsChange,
  onDomainChange,
  onEvidenceChange,
  onStoriesChange,
  onTasksChange
}: {
  data: AppData;
  onRawSourcesChange: (rawSources: RawSource[]) => void;
  onTruthChange: (patch: Partial<AppData>) => void;
  onSkillsChange: (skills: SkillInference[]) => void;
  onDomainChange: (domainKnowledge: DomainKnowledge[]) => void;
  onEvidenceChange: (cards: EvidenceCard[]) => void;
  onStoriesChange: (stories: StarStory[]) => void;
  onTasksChange: (tasks: BackboneProjectTask[]) => void;
}) {
  const [activeBackboneView, setActiveBackboneView] = useState<
    "intake" | "generate" | "truth" | "skills" | "domain" | "evidence" | "star" | "compensation"
  >("evidence");
  const [batchSourcePaste, setBatchSourcePaste] = useState("");
  const [batchSourcePreview, setBatchSourcePreview] = useState<ParsePreview<{ sourceSnapshots: SourceParsedSnapshot[] }>>(emptyPreview);
  const [sourceBatchIndex, setSourceBatchIndex] = useState(0);
  const [profileDeltaPaste, setProfileDeltaPaste] = useState("");
  const [profileDeltaPreview, setProfileDeltaPreview] = useState<ParsePreview<Partial<AppData>>>(emptyPreview);
  const [backbonePaste, setBackbonePaste] = useState("");
  const [backbonePreview, setBackbonePreview] = useState<ParsePreview<unknown>>(emptyPreview);
  const [backboneMessage, setBackboneMessage] = useState("");
  const [backboneRunMode, setBackboneRunMode] = useState<BackboneRunMode>("source_of_truth_only");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [projectTaskPaste, setProjectTaskPaste] = useState("");
  const [projectTaskPreview, setProjectTaskPreview] = useState<ParsePreview<Record<string, unknown>>>(emptyPreview);
  const backbonePrompt = buildCareerBackbonePrompt(data, backboneRunMode);
  const backboneCoverage = backbonePreview.parsed ? careerBackboneCoverage(backbonePreview.parsed) : null;
  const parsedSourceCount = data.rawSources.filter((source) => source.parsedSnapshot).length;
  const staleSourceCount = data.rawSources.filter((source) => source.parsedSnapshot && source.parsedSnapshot.sourceContentHash !== contentHash(source.content)).length;
  const sourcesNeedingSnapshot = data.rawSources.filter((source) => !source.parsedSnapshot || source.parsedSnapshot.sourceContentHash !== contentHash(source.content));
  const sourceSnapshotBatches = chunkSourcesForSnapshot(sourcesNeedingSnapshot);
  const activeSourceBatchIndex = Math.min(sourceBatchIndex, Math.max(sourceSnapshotBatches.length - 1, 0));
  const activeSourceBatch = sourceSnapshotBatches[activeSourceBatchIndex] || [];
  const activeSourceBatchChars = activeSourceBatch.reduce((sum, source) => sum + source.content.length, 0);
  const batchSourcePrompt = buildBatchSourceSnapshotPrompt(activeSourceBatch);
  const sourceSnapshotRows = data.rawSources.map((source) => {
    const fresh = Boolean(source.parsedSnapshot && source.parsedSnapshot.sourceContentHash === contentHash(source.content));
    return {
      id: source.id,
      title: source.title,
      kind: source.kind,
      status: fresh ? "Parsed" : source.parsedSnapshot ? "Stale" : "Raw only",
      detail: fresh
        ? source.parsedSnapshot?.summary || "Fresh compact snapshot is ready."
        : source.parsedSnapshot
          ? "Raw content changed after this snapshot. Re-parse before syncing changed projects."
          : "Needs a compact source snapshot before syncing changed projects."
    };
  });
  const sourceSnapshotInput = data.rawSources.map((source) => ({
    id: source.id,
    title: source.title,
    kind: source.kind,
    parsedSnapshot: source.parsedSnapshot && source.parsedSnapshot.sourceContentHash === contentHash(source.content)
      ? source.parsedSnapshot
      : null,
    status: source.parsedSnapshot
      ? source.parsedSnapshot.sourceContentHash === contentHash(source.content)
        ? "parsed"
        : "stale"
      : "raw-only"
  }));
  const profileSourceHashes = data.backboneMetadata.profileSourceHashes || {};
  const profileChangedSources = data.rawSources.filter((source) =>
    source.parsedSnapshot?.sourceContentHash === contentHash(source.content)
    && profileSourceHashes[source.id] !== contentHash(source.content)
  );
  const profileDeltaPrompt = buildProfileDeltaPrompt(data, profileChangedSources);
  const pendingTasks = data.backboneTasks.filter((task) => task.status === "Pending");
  const activeProjectTask = data.backboneTasks.find((task) => task.id === selectedTaskId)
    || pendingTasks[0]
    || data.backboneTasks.find((task) => task.status === "Needs Review");
  const activeProjectPrompt = activeProjectTask
    ? buildProjectBackboneDeltaPrompt(buildProjectTaskInput(data, activeProjectTask.experienceId, activeProjectTask.projectId), activeProjectTask.inputHash)
    : "";
  const appliedProjectTaskCount = data.backboneTasks.filter((task) => task.status === "Applied").length;

  function prepareProjectTasks() {
    const tasks = buildBackboneProjectTasks(data, false);
    onTasksChange(tasks);
    const next = tasks.find((task) => task.status === "Pending") || tasks.find((task) => task.status === "Needs Review");
    setSelectedTaskId(next?.id || "");
    setProjectTaskPaste("");
    setProjectTaskPreview(emptyPreview);
    setBackboneMessage(`已檢查 ${tasks.length} 個 projects；只有新增或變更的 projects 需要重跑。`);
  }

  function startStagedRebuild() {
    onTasksChange([]);
    setSelectedTaskId("");
    setProjectTaskPaste("");
    setProjectTaskPreview(emptyPreview);
    setBackboneRunMode("source_of_truth_only");
    setBackbonePaste("");
    setBackbonePreview(emptyPreview);
    setBackboneMessage("已切換到 6-stage full rebuild。現有 Career Evidence 會保留，完成每一階段後再進到下一階段。");
  }

  function parseProjectTask() {
    if (!activeProjectTask) return;
    const parsedJson = tryParseJson<unknown>(projectTaskPaste);
    if (!parsedJson.parsed || parsedJson.error || typeof parsedJson.parsed !== "object") {
      setProjectTaskPreview({ raw: parsedJson.raw, parsed: null, error: parsedJson.error || "Project delta must be a JSON object." });
      return;
    }
    const root = parsedJson.parsed as Record<string, unknown>;
    const task = root.task && typeof root.task === "object" ? root.task as Record<string, unknown> : {};
    const identityMatches = task.experienceId === activeProjectTask.experienceId
      && task.projectId === activeProjectTask.projectId
      && task.inputHash === activeProjectTask.inputHash
      && task.promptVersion === activeProjectTask.promptVersion;
    if (!identityMatches) {
      setProjectTaskPreview({
        raw: parsedJson.raw,
        parsed: null,
        error: "This JSON belongs to another or stale project task. Copy the currently displayed task prompt and paste its result here."
      });
      return;
    }
    const arrays = ["skillInferences", "domainKnowledge", "evidenceCards", "starStories"];
    const invalidArray = arrays.find((key) => !Array.isArray(root[key]));
    if (invalidArray) {
      setProjectTaskPreview({ raw: parsedJson.raw, parsed: null, error: `${invalidArray} must be an array, even when empty.` });
      return;
    }
    setProjectTaskPreview({ raw: parsedJson.raw, parsed: root, error: "" });
  }

  function applyProjectTask() {
    if (!activeProjectTask || !projectTaskPreview.parsed) return;
    const root = projectTaskPreview.parsed;
    const skillInferences = normalizeSkillInferences(root.skillInferences);
    const domainKnowledge = normalizeDomainKnowledge(root.domainKnowledge);
    const evidenceCards = normalizeEvidenceCards(root.evidenceCards);
    const starStories = normalizeStarStories(root.starStories);
    const wrongProject = [...skillInferences, ...domainKnowledge, ...evidenceCards, ...starStories]
      .some((item) => item.projectId !== activeProjectTask.projectId || item.experienceId !== activeProjectTask.experienceId);
    if (wrongProject) {
      setProjectTaskPreview((current) => ({ ...current, error: "Returned records contain another experienceId/projectId. Nothing was applied." }));
      return;
    }
    const existingSkills = data.skillInferences.filter((item) => item.projectId === activeProjectTask.projectId);
    const existingDomain = data.domainKnowledge.filter((item) => item.projectId === activeProjectTask.projectId);
    const existingEvidence = data.evidenceCards.filter((item) => item.projectId === activeProjectTask.projectId);
    const existingStories = data.starStories.filter((item) => item.projectId === activeProjectTask.projectId);
    const mergedSkills = mergeProjectRecordsPreservingIds(existingSkills, skillInferences, (item) => normalizeMatchKey(item.group, item.skill));
    const mergedDomain = mergeProjectRecordsPreservingIds(existingDomain, domainKnowledge, (item) => normalizeMatchKey(item.domain, item.businessProcess));
    const mergedEvidence = mergeProjectRecordsPreservingIds(existingEvidence, evidenceCards, (item) => normalizeMatchKey(item.title, item.proof));
    const remappedStories = starStories.map((story) => ({
      ...story,
      evidenceIds: story.evidenceIds.map((id) => mergedEvidence.idMap.get(id) || id)
    }));
    const mergedStories = mergeProjectRecordsPreservingIds(existingStories, remappedStories, (item) => normalizeMatchKey(item.title, item.situation, item.action));
    const reviewItems = Array.isArray(root.reviewItems) ? root.reviewItems.map(String).filter(Boolean) : [];
    [
      ["skill", mergedSkills.retainedIds.length],
      ["domain", mergedDomain.retainedIds.length],
      ["evidence", mergedEvidence.retainedIds.length],
      ["STAR", mergedStories.retainedIds.length]
    ].forEach(([label, count]) => {
      if (Number(count) > 0) reviewItems.push(`${count} existing ${label} record(s) were omitted by GPT and retained for manual review.`);
    });
    const allowedSourceIds = new Set(data.rawSources.map((source) => source.id));
    const groundedWithoutSource = [...skillInferences, ...domainKnowledge, ...evidenceCards]
      .filter((item) => item.confidence === "Grounded")
      .filter((item) => item.sourceIds.length === 0 || item.sourceIds.some((sourceId) => !allowedSourceIds.has(sourceId)));
    if (groundedWithoutSource.length) reviewItems.push(`${groundedWithoutSource.length} Grounded record(s) need valid sourceIds.`);
    const invalidEvidence = evidenceCards.filter((item) => !validateEvidenceCard(data, item).valid);
    if (invalidEvidence.length) reviewItems.push(`${invalidEvidence.length} Evidence card(s) need valid experience/project/source lineage before CV use.`);
    if (mergedSkills.items.length < 4) reviewItems.push(`Only ${mergedSkills.items.length} skill record(s); review whether technical, analytical, delivery, and governance capabilities were all captured.`);
    if (mergedDomain.items.length < 1) reviewItems.push("No domain record was produced; confirm process, stakeholder, KPI, or risk context.");
    if (mergedEvidence.items.length < 2) reviewItems.push(`Only ${mergedEvidence.items.length} evidence card(s); a substantial project should normally preserve 2-6 distinct hiring signals.`);
    onSkillsChange([...data.skillInferences.filter((item) => item.projectId !== activeProjectTask.projectId), ...mergedSkills.items]);
    onDomainChange([...data.domainKnowledge.filter((item) => item.projectId !== activeProjectTask.projectId), ...mergedDomain.items]);
    onEvidenceChange([...data.evidenceCards.filter((item) => item.projectId !== activeProjectTask.projectId), ...mergedEvidence.items]);
    onStoriesChange([...data.starStories.filter((item) => item.projectId !== activeProjectTask.projectId), ...mergedStories.items]);
    const nextTasks = data.backboneTasks.map((task) => task.id === activeProjectTask.id ? {
      ...task,
      status: reviewItems.length ? "Needs Review" as const : "Applied" as const,
      appliedAt: new Date().toISOString(),
      counts: {
        skills: mergedSkills.items.length,
        domain: mergedDomain.items.length,
        evidence: mergedEvidence.items.length,
        star: mergedStories.items.length
      },
      reviewItems
    } : task);
    onTasksChange(nextTasks);
    const next = nextTasks.find((task) => task.status === "Pending");
    setSelectedTaskId(next?.id || activeProjectTask.id);
    setProjectTaskPaste("");
    setProjectTaskPreview(emptyPreview);
    setBackboneMessage(`${activeProjectTask.label} 已安全合併：${mergedSkills.items.length} skills / ${mergedDomain.items.length} domain / ${mergedEvidence.items.length} evidence / ${mergedStories.items.length} STAR。${next ? ` 下一個：${next.label}` : " Project queue 已完成。"}`);
  }

  function parseBatchSourceSnapshots() {
    const parsedJson = tryParseJson<unknown>(batchSourcePaste);
    if (!parsedJson.parsed || parsedJson.error) {
      setBatchSourcePreview({ raw: parsedJson.raw, parsed: null, error: parsedJson.error });
      return;
    }
    const root = parsedJson.parsed && typeof parsedJson.parsed === "object"
      ? parsedJson.parsed as Record<string, unknown>
      : {};
    if (root.artifact || root.careerProfile || root.sourceOfTruth || root.skillInferences || root.evidenceCards || root.starStories) {
      setBatchSourcePreview({
        raw: parsedJson.raw,
        parsed: null,
        error: "這不是 B 的 sourceSnapshots[] 回覆。看起來 GPT 直接產了 Career Backbone / artifact。請重新複製 Batch source snapshot prompt，回覆必須是 { \"sourceSnapshots\": [...] }。"
      });
      return;
    }
    const sourceSnapshots = normalizeBatchSourceSnapshots(parsedJson.parsed, data.rawSources);
    setBatchSourcePreview({
      raw: parsedJson.raw,
      parsed: sourceSnapshots.length ? { sourceSnapshots } : null,
      error: sourceSnapshots.length ? "" : "找不到可套用的 sourceSnapshots。請確認 JSON 內有 sourceId，且 sourceId 與左側 raw source 相同。"
    });
  }

  function applyBatchSourceSnapshots() {
    if (!batchSourcePreview.parsed) return;
    const snapshotsBySourceId = new Map(batchSourcePreview.parsed.sourceSnapshots.map((snapshot) => [snapshot.sourceId, snapshot]));
    const now = new Date().toISOString();
    onRawSourcesChange(data.rawSources.map((source) => {
      const snapshot = snapshotsBySourceId.get(source.id);
      return snapshot ? { ...source, parsedSnapshot: snapshot, updatedAt: now } : source;
    }));
    setBackboneMessage(`已套用 ${snapshotsBySourceId.size} 個 source snapshot。下一步：Refresh changed projects，只同步新增或變更的 project。`);
    setSourceBatchIndex(0);
    setBatchSourcePaste("");
    setBatchSourcePreview(emptyPreview);
  }

  function parseProfileDelta() {
    const parsedJson = tryParseJson<unknown>(profileDeltaPaste);
    if (!parsedJson.parsed || parsedJson.error) {
      setProfileDeltaPreview({ raw: parsedJson.raw, parsed: null, error: parsedJson.error });
      return;
    }
    const normalized = normalizeCareerBackbone(parsedJson.parsed);
    if (!normalized?.careerProfile) {
      setProfileDeltaPreview({ raw: parsedJson.raw, parsed: null, error: "Profile delta must contain careerProfile and sourceOfTruth only." });
      return;
    }
    const returnedExperienceIds = new Set(normalized.careerProfile.workExperiences.map((experience) => experience.id));
    const returnedProjectIds = new Set(normalized.careerProfile.workExperiences.flatMap((experience) => experience.projects.map((project) => project.id)));
    const missingExperienceIds = data.careerProfile.workExperiences.map((experience) => experience.id).filter((id) => !returnedExperienceIds.has(id));
    const missingProjectIds = data.careerProfile.workExperiences.flatMap((experience) => experience.projects.map((project) => project.id)).filter((id) => !returnedProjectIds.has(id));
    if (missingExperienceIds.length || missingProjectIds.length) {
      setProfileDeltaPreview({
        raw: parsedJson.raw,
        parsed: null,
        error: `Profile delta attempted to remove ${missingExperienceIds.length} experience(s) and ${missingProjectIds.length} project(s). Nothing was applied.`
      });
      return;
    }
    setProfileDeltaPreview({ raw: parsedJson.raw, parsed: normalized, error: "" });
  }

  function applyProfileDelta() {
    if (!profileDeltaPreview.parsed?.careerProfile) return;
    const appliedHashes = Object.fromEntries(profileChangedSources.map((source) => [source.id, contentHash(source.content)]));
    onTruthChange({
      careerProfile: profileDeltaPreview.parsed.careerProfile,
      sourceOfTruth: profileDeltaPreview.parsed.sourceOfTruth || data.sourceOfTruth,
      backboneMetadata: {
        ...data.backboneMetadata,
        profileSourceHashes: { ...profileSourceHashes, ...appliedHashes },
        profileSyncedAt: new Date().toISOString()
      }
    });
    setProfileDeltaPaste("");
    setProfileDeltaPreview(emptyPreview);
    setBackboneMessage(`Profile structure synced from ${profileChangedSources.length} changed source(s). Next: Refresh changed projects.`);
  }

  function applyBackbone() {
    if (!backbonePreview.parsed) return;
    const normalized = normalizeCareerBackbone(backbonePreview.parsed);
    if (!normalized) {
      setBackboneMessage("Parse 成功，但不是 Career Backbone JSON。請確認回傳包含 careerProfile / evidenceCards / skillInferences / starStories。");
      return;
    }
    const appliedRunMode = normalized.backboneMetadata?.runMode || backboneRunMode;
    const mergeMode = appliedRunMode === "update_merge";
    const nextBackboneMetadata = normalized.backboneMetadata || normalized.careerProfile
      ? {
          ...data.backboneMetadata,
          ...(normalized.backboneMetadata || {}),
          ...(normalized.careerProfile ? {
            profileSourceHashes: freshSourceHashes(data),
            profileSyncedAt: new Date().toISOString()
          } : {})
        }
      : undefined;
    if (normalized.sourceOfTruth || normalized.careerProfile || normalized.backboneMetadata || normalized.backboneUpdateSummary || normalized.highCompensationSignals) {
      onTruthChange({
        ...(normalized.sourceOfTruth ? { sourceOfTruth: normalized.sourceOfTruth } : {}),
        ...(normalized.careerProfile ? { careerProfile: normalized.careerProfile } : {}),
        ...(nextBackboneMetadata ? { backboneMetadata: nextBackboneMetadata } : {}),
        ...(normalized.backboneUpdateSummary ? { backboneUpdateSummary: normalized.backboneUpdateSummary } : {}),
        ...(normalized.highCompensationSignals ? {
          highCompensationSignals: mergeMode
            ? mergeCardsByIdentity(data.highCompensationSignals, normalized.highCompensationSignals, (item) => normalizeMatchKey(item.signalType, item.cvPositioning))
            : normalized.highCompensationSignals
        } : {})
      });
    }
    if (normalized.skillInferences) onSkillsChange(mergeMode
      ? mergeCardsByIdentity(data.skillInferences, normalized.skillInferences, (item) => normalizeMatchKey(item.skill, item.experienceId, item.projectId))
      : normalized.skillInferences);
    if (normalized.domainKnowledge) onDomainChange(mergeMode
      ? mergeCardsByIdentity(data.domainKnowledge, normalized.domainKnowledge, (item) => normalizeMatchKey(item.domain, item.businessProcess, item.experienceId, item.projectId))
      : normalized.domainKnowledge);
    const evidenceAfterApply = normalized.evidenceCards
      ? (mergeMode || appliedRunMode === "evidence_only"
          ? mergeCardsByIdentity(data.evidenceCards, normalized.evidenceCards, (item) => normalizeMatchKey(item.title, item.proof, item.experienceId, item.projectId))
          : normalized.evidenceCards)
      : data.evidenceCards;
    if (normalized.evidenceCards) onEvidenceChange(evidenceAfterApply);
    if (normalized.starStories) onStoriesChange(mergeMode
      ? mergeCardsByIdentity(data.starStories, normalized.starStories, (item) => normalizeMatchKey(item.title, item.situation, item.action, item.result, item.experienceId, item.projectId))
      : normalized.starStories);
    const coverageData = { ...data, evidenceCards: evidenceAfterApply };
    const uncoveredProjectCount = data.careerProfile.workExperiences.reduce(
      (count, experience) => count + experience.projects.filter((project) =>
        !evidenceCoverageForProject(coverageData, experience.id, project.id).traceabilityCovered
      ).length,
      0
    );
    const requestedNextMode = normalized.backboneMetadata?.nextRecommendedRunMode;
    const nextMode = appliedRunMode === "evidence_only" && uncoveredProjectCount > 0 ? "evidence_only" : requestedNextMode;
    const coverageMessage = appliedRunMode === "evidence_only" && uncoveredProjectCount > 0
      ? ` 還有 ${uncoveredProjectCount} 個 project 未覆蓋；請再次執行 Evidence，只會補缺口並 merge。`
      : "";
    setBackboneMessage(`${appliedRunMode} 已套用${normalized.backboneMetadata?.partialOutput ? "（partial output）" : ""}.${coverageMessage}${nextMode && nextMode !== appliedRunMode ? ` 下一步：${nextMode}` : ""}`);
    if (nextMode) setBackboneRunMode(nextMode);
    setBackbonePreview(emptyPreview);
    setBackbonePaste("");
  }

  const backboneRunModes: { id: BackboneRunMode; label: string; detail: string; complete: boolean }[] = [
    { id: "source_of_truth_only", label: "1. Profile", detail: "Experience + project ID foundation", complete: data.careerProfile.workExperiences.length > 0 },
    { id: "skills_only", label: "2. Skills", detail: "Complete technical capability inventory", complete: data.skillInferences.length > 0 },
    { id: "domain_only", label: "3. Domain", detail: "Process, stakeholder, risk, KPI", complete: data.domainKnowledge.length > 0 },
    { id: "evidence_only", label: "4. Evidence", detail: "Core, Supporting, Archive evidence", complete: data.careerProfile.workExperiences.flatMap((experience) => experience.projects).every((project) => {
      const experience = data.careerProfile.workExperiences.find((item) => item.projects.some((candidate) => candidate.id === project.id));
      return Boolean(experience && evidenceCoverageForProject(data, experience.id, project.id).traceabilityCovered);
    }) },
    { id: "star_only", label: "5. STAR", detail: "Interview-ready stories with quality gate", complete: data.starStories.length > 0 },
    { id: "high_compensation_only", label: "6. Compensation", detail: "Seniority and negotiation leverage", complete: data.highCompensationSignals.length > 0 },
    { id: "update_merge", label: "Update / Merge", detail: "Merge new sources, preserve IDs", complete: data.backboneUpdateSummary.mode === "update_merge" }
  ];
  const selectedRunMode = backboneRunModes.find((mode) => mode.id === backboneRunMode);

  const backboneViews: {
    id: typeof activeBackboneView;
    label: string;
    count?: number;
    title: string;
    detail: string;
    content: React.ReactNode;
  }[] = [
    {
      id: "intake",
      label: "Intake",
      count: data.rawSources.length,
      title: "Raw career source",
      detail: "保存原始 CV、project HTML、notes。這裡是 raw data，不直接拿來產 CV。",
      content: <SourceIntake sources={data.rawSources} onChange={onRawSourcesChange} />
    },
    {
      id: "generate",
      label: "Sync",
      title: "Sync Career Evidence",
      detail: "只同步新增或變更的 projects；已完成的 Profile、Skills、Domain、Evidence、STAR 保留不動。",
      content: (
        <>
          {backboneMessage && <div className="save-status">{backboneMessage}</div>}
          <section className="panel sync-mode-strip">
            <div className="panel-head">
              <h3><Workflow size={16} /> Career Evidence sync mode</h3>
            </div>
            <div className="sync-mode-grid">
              <article className="sync-mode-card active">
                <span>Default</span>
                <strong>New or changed content only</strong>
                <p>Use this for normal maintenance. The queue only rebuilds sources and projects whose input changed or whose output is still missing.</p>
              </article>
              <article className="sync-mode-card">
                <span>Manual</span>
                <strong>Full rebuild for major changes</strong>
                <p>Use the 6-stage rebuild only when prompt strategy or structure changes across the whole database. It stays manual on purpose.</p>
              </article>
            </div>
          </section>
          <WorkflowStepHeader
            step="01"
            title="Review source snapshot status"
            detail="先確認每份 raw source 是否已有最新 snapshot；原始資料不會直接拿去產 CV。"
          />
          <section className={parsedSourceCount === data.rawSources.length && data.rawSources.length > 0 ? "chunk-status ready source-snapshot-status" : "chunk-status source-snapshot-status"}>
            <div className="section-heading-row">
              <div>
                <h3>A. Source snapshot status</h3>
                <strong>{parsedSourceCount}/{data.rawSources.length} sources parsed</strong>
                <p>
                  {sourcesNeedingSnapshot.length
                    ? `${sourcesNeedingSnapshot.length} source(s) still need compact snapshots${staleSourceCount ? `, including ${staleSourceCount} stale snapshot(s)` : ""}. Finish this first, then sync changed projects.`
                    : "All raw sources are parsed. Do not paste source snapshots again. Next step: Refresh changed projects below."}
                </p>
              </div>
              <span className="pill">{sourcesNeedingSnapshot.length ? `${sourcesNeedingSnapshot.length} need parse` : "Ready for Backbone"}</span>
            </div>
            <div className="source-snapshot-list">
              {sourceSnapshotRows.map((source) => (
                <article className={source.status === "Parsed" ? "parsed" : source.status === "Stale" ? "stale" : "raw"} key={source.id}>
                  <div>
                    <strong>{source.title}</strong>
                    <span>{source.kind} · {source.status}</span>
                  </div>
                  <p>{source.detail}</p>
                </article>
              ))}
            </div>
          </section>
          <WorkflowStepHeader
            step="02"
            title={sourcesNeedingSnapshot.length ? "Normalize remaining sources" : "Source snapshots complete"}
            detail={sourcesNeedingSnapshot.length
              ? "系統已依長度分批。完成目前 batch、Apply，再處理下一批。"
              : "所有來源已整理完成，不需要重貼 snapshot；直接 Refresh changed projects。"}
          />
          {sourcesNeedingSnapshot.length > 0 && (
            <section className="panel batch-source-panel">
              <div className="section-heading-row">
                <div>
                  <h3>B. Batch source snapshot only</h3>
                  <p>系統已依長度自動分批。每次只複製目前 batch，貼回後 Apply，下一批會重新計算。</p>
                </div>
                <span className="pill">Batch {activeSourceBatchIndex + 1}/{sourceSnapshotBatches.length}</span>
              </div>
              <div className="batch-stepper">
                <div>
                  <strong>{activeSourceBatch.length} source(s) in this batch</strong>
                  <span>{activeSourceBatchChars.toLocaleString()} raw characters · {sourcesNeedingSnapshot.length} source(s) still need snapshots</span>
                </div>
                <div>
                  <button className="secondary small" disabled={activeSourceBatchIndex === 0} onClick={() => setSourceBatchIndex(Math.max(activeSourceBatchIndex - 1, 0))}>Previous batch</button>
                  <button className="secondary small" disabled={activeSourceBatchIndex >= sourceSnapshotBatches.length - 1} onClick={() => setSourceBatchIndex(Math.min(activeSourceBatchIndex + 1, sourceSnapshotBatches.length - 1))}>Next batch</button>
                </div>
              </div>
              <ManualAiPanel
                prompt={batchSourcePrompt}
                inputLabel={`Prepare Input Data：batch ${activeSourceBatchIndex + 1}/${sourceSnapshotBatches.length}`}
                inputValue={JSON.stringify(activeSourceBatch.map((source) => ({
                  id: source.id,
                  title: source.title,
                  kind: source.kind,
                  content: source.content
                })), null, 2)}
                readOnlyInput
                pasteLabel="Paste GPT sourceSnapshots[] JSON Back only"
                pasteValue={batchSourcePaste}
                onPasteChange={setBatchSourcePaste}
                onParse={parseBatchSourceSnapshots}
              />
              <ParsePreviewCard preview={batchSourcePreview} onApply={applyBatchSourceSnapshots} applyLabel="Apply source snapshots" />
            </section>
          )}
          {sourcesNeedingSnapshot.length === 0 ? (
            <>
              {profileChangedSources.length > 0 ? (
                <>
                  <WorkflowStepHeader
                    step="03"
                    title="Merge new work into Profile"
                    detail="Source snapshot 有新增或修改內容。先更新 experience/project ID foundation，系統才知道要建立哪些 project sync tasks。"
                  />
                  <section className="panel batch-source-panel">
                    <div className="section-heading-row">
                      <div>
                        <h3>{profileChangedSources.length} changed source(s) need Profile sync</h3>
                        <p>這是新 source 的一次性結構合併；既有 experienceId/projectId 不會被刪除或重編。</p>
                      </div>
                      <span className="pill">Profile delta required</span>
                    </div>
                    <ManualAiPanel
                      prompt={profileDeltaPrompt}
                      inputLabel="Changed parsed source snapshots"
                      inputValue={JSON.stringify(profileChangedSources.map((source) => ({
                        id: source.id,
                        title: source.title,
                        parsedSnapshot: source.parsedSnapshot
                      })), null, 2)}
                      readOnlyInput
                      pasteLabel="Paste merged careerProfile + sourceOfTruth JSON"
                      pasteValue={profileDeltaPaste}
                      onPasteChange={setProfileDeltaPaste}
                      onParse={parseProfileDelta}
                    />
                    <ParsePreviewCard preview={profileDeltaPreview} onApply={applyProfileDelta} applyLabel="Apply Profile delta" />
                  </section>
                </>
              ) : (
                <>
              <WorkflowStepHeader
                step="04"
                title="Sync changed projects"
                detail="預設只處理新增或變更的 project，同時更新 Skills、Domain、Evidence、STAR；已套用項目會持久保存。"
              />
              <section className="panel project-task-compiler">
                <div className="section-heading-row">
                  <div>
                    <span className="eyebrow">Default mode: incremental sync</span>
                    <h3>{data.backboneTasks.length ? `${appliedProjectTaskCount}/${data.backboneTasks.length} projects synced` : "No sync queue prepared"}</h3>
                    <p>Refresh 只會把新增、缺漏、或輸入已變更的 project 放進 queue；不會預設重跑整個 Career Evidence Database。</p>
                  </div>
                  <div className="task-compiler-actions">
                    <button className="primary" onClick={prepareProjectTasks}>Refresh new / changed projects</button>
                  </div>
                </div>
                {data.backboneTasks.length > 0 && (
                  <>
                    <div className="task-progress" aria-label="Project compiler progress">
                      <span style={{ width: `${Math.round((appliedProjectTaskCount / data.backboneTasks.length) * 100)}%` }} />
                    </div>
                    <div className="task-status-strip">
                      <strong>{pendingTasks.length ? `${pendingTasks.length} pending` : "No pending tasks"}</strong>
                      <span>{data.backboneTasks.filter((task) => task.status === "Needs Review").length} need review</span>
                      <span>Limit {PROJECT_TASK_TOKEN_LIMIT.toLocaleString()} estimated tokens / task</span>
                    </div>
                    <details className="task-queue-list">
                      <summary>Review project queue</summary>
                      <div>
                        {data.backboneTasks.map((task) => (
                          <button
                            type="button"
                            key={task.id}
                            className={task.id === activeProjectTask?.id ? "active" : ""}
                            onClick={() => {
                              setSelectedTaskId(task.id);
                              setProjectTaskPaste("");
                              setProjectTaskPreview(emptyPreview);
                            }}
                          >
                            <span>{task.status}</span>
                            <strong>{task.label}</strong>
                            <small>~{task.estimatedInputTokens.toLocaleString()} tokens</small>
                          </button>
                        ))}
                      </div>
                    </details>
                  </>
                )}
                {activeProjectTask && (
                  <section className={activeProjectTask.estimatedInputTokens > PROJECT_TASK_TOKEN_LIMIT ? "active-project-task oversized" : "active-project-task"}>
                    <div className="active-task-heading">
                      <div>
                        <span>Next project task</span>
                        <h3>{activeProjectTask.label}</h3>
                      </div>
                      <div className="task-metrics">
                        <strong>~{activeProjectTask.estimatedInputTokens.toLocaleString()} tokens</strong>
                        <span>{activeProjectTask.status}</span>
                      </div>
                    </div>
                    {activeProjectTask.estimatedInputTokens > PROJECT_TASK_TOKEN_LIMIT ? (
                      <div className="save-status error">
                        This task exceeds the prompt safety limit. Do not run it yet; split this project's source material, then prepare the queue again.
                      </div>
                    ) : (
                      <>
                        <ManualAiPanel
                          prompt={activeProjectPrompt}
                          inputLabel="Project context included in prompt"
                          inputValue={JSON.stringify({
                            experienceId: activeProjectTask.experienceId,
                            projectId: activeProjectTask.projectId,
                            inputHash: activeProjectTask.inputHash,
                            promptVersion: activeProjectTask.promptVersion
                          }, null, 2)}
                          readOnlyInput
                          pasteLabel="Paste this project's Skills + Domain + Evidence + STAR JSON"
                          pasteValue={projectTaskPaste}
                          onPasteChange={setProjectTaskPaste}
                          onParse={parseProjectTask}
                        />
                        <ParsePreviewCard preview={projectTaskPreview} onApply={applyProjectTask} applyLabel="Replace this project in Backbone" />
                      </>
                    )}
                  </section>
                )}
                {data.backboneTasks.length > 0 && !activeProjectTask && (
                  <div className="save-status">Career Evidence is up to date. Add or edit source material only when your experience changes; new JDs do not require another sync.</div>
                )}
              </section>
                </>
              )}
              <details className="advanced-backbone-fallback">
                <summary>Manual full rebuild — 6 stages</summary>
                <p>只有在 prompt strategy 大改、資料結構大改、或你明確要整庫重整時才用這個 staged rebuild。日常新增內容不要走這條。</p>
                <button className="secondary" onClick={startStagedRebuild}>Open 6-stage manual rebuild</button>
              <WorkflowStepHeader
                step="A"
                title="Staged full rebuild"
                detail="依序完成 Profile → Skills → Domain → Evidence → STAR → Compensation，共 6 次 prompt。這是手動重操作，不是預設同步模式。"
              />
              <section className="run-mode-picker" aria-label="Career Backbone run modes">
                {backboneRunModes.map((mode) => (
                  <button
                    type="button"
                    key={mode.id}
                    className={mode.id === backboneRunMode ? "active" : ""}
                    onClick={() => {
                      setBackboneRunMode(mode.id);
                      setBackbonePreview(emptyPreview);
                      setBackbonePaste("");
                    }}
                  >
                    <span>{mode.complete ? "Existing data" : "No data yet"}</span>
                    <strong>{mode.label}</strong>
                    <small>{mode.detail}</small>
                  </button>
                ))}
              </section>
              <div className="save-status">
                Current run: <strong>{selectedRunMode?.label}</strong> · {selectedRunMode?.detail}. Apply this JSON before moving to the next mode.
              </div>
              {data.backboneUpdateSummary.mode && (
                <section className="backbone-update-summary" aria-label="Last Career Backbone update summary">
                  <div>
                    <span>Last applied run</span>
                    <strong>{data.backboneMetadata.runMode || data.backboneUpdateSummary.mode}</strong>
                  </div>
                  <div className="backbone-update-stats">
                    <span><strong>{data.backboneUpdateSummary.addedItems.length}</strong> added</span>
                    <span><strong>{data.backboneUpdateSummary.modifiedItems.length}</strong> modified</span>
                    <span><strong>{data.backboneUpdateSummary.possibleDuplicates.length}</strong> possible duplicates</span>
                    <span><strong>{data.backboneUpdateSummary.conflicts.length}</strong> conflicts</span>
                    <span><strong>{data.backboneUpdateSummary.needsReview.length}</strong> needs review</span>
                  </div>
                  {(data.backboneUpdateSummary.conflicts.length > 0 || data.backboneUpdateSummary.possibleDuplicates.length > 0) && (
                    <details>
                      <summary>Review merge warnings</summary>
                      {[...data.backboneUpdateSummary.conflicts, ...data.backboneUpdateSummary.possibleDuplicates].map((item, index) => (
                        <p key={`${item}-${index}`}>{item}</p>
                      ))}
                    </details>
                  )}
                </section>
              )}
              <ManualAiPanel
                prompt={backbonePrompt}
                inputLabel={`Prepare Input Data：${backboneRunMode}`}
                inputValue={JSON.stringify(sourceSnapshotInput, null, 2)}
                readOnlyInput
                pasteLabel={`Paste GPT ${backboneRunMode} JSON Back`}
                pasteValue={backbonePaste}
                onPasteChange={setBackbonePaste}
                onParse={() => setBackbonePreview(tryParseJson(backbonePaste))}
              />
              <ParsePreviewCard preview={backbonePreview} onApply={applyBackbone} applyLabel={`Apply ${selectedRunMode?.label || backboneRunMode}`} />
              </details>
            </>
          ) : (
            <section className="empty-panel">
              <strong>Career Backbone is locked until source snapshots are ready.</strong>
              <span>Finish the batch source snapshot step above first. This prevents GPT from mixing raw long text with merged career inventory output.</span>
            </section>
          )}
          {backboneCoverage && backboneRunMode === "full_inventory" && <BackboneCoveragePanel coverage={backboneCoverage} />}
        </>
      )
    },
    {
      id: "truth",
      label: "Source of Truth",
      count: data.careerProfile.workExperiences.length,
      title: "Source of Truth",
      detail: "檢查穩定 career facts。這區現在是 backbone 的 review / 局部修正，不是第一輪必跑。",
      content: <SourceTruth data={data} onChange={onTruthChange} />
    },
    {
      id: "skills",
      label: "Skill Map",
      count: data.skillInferences.length,
      title: "Technical capability map",
      detail: "檢查從 project 推導出的技術能力與強度。",
      content: <SkillMap data={data} onChange={onSkillsChange} />
    },
    {
      id: "domain",
      label: "Domain Map",
      count: data.domainKnowledge.length,
      title: "Domain knowledge map",
      detail: "檢查從 project 推導出的業務場景、流程、stakeholders、風險與 KPI。",
      content: <DomainKnowledgeMap data={data} onChange={onDomainChange} />
    },
    {
      id: "evidence",
      label: "Evidence Bank",
      count: data.evidenceCards.length,
      title: "Evidence Bank",
      detail: "檢查可用於 CV bullets 的 evidence。JD Workspace 會從這裡挑選。",
      content: <EvidenceBank data={data} onChange={onEvidenceChange} />
    },
    {
      id: "star",
      label: "STAR Story Bank",
      count: data.starStories.length,
      title: "STAR Story Bank",
      detail: "檢查可用於面試與 CV 強化的 STAR stories。後續可依 JD 選用。",
      content: <StarBank data={data} onChange={onStoriesChange} />
    },
    {
      id: "compensation",
      label: "Compensation Signals",
      count: data.highCompensationSignals.length,
      title: "High Compensation Signals",
      detail: "獨立整理能支撐 seniority、高薪定位與談薪的 enterprise scope、production ownership、impact、risk 與 architecture 訊號。",
      content: (
        <HighCompensationMap
          signals={data.highCompensationSignals}
          onChange={(highCompensationSignals) => onTruthChange({ highCompensationSignals })}
        />
      )
    }
  ];
  const selectedBackboneView = backboneViews.find((view) => view.id === activeBackboneView) || backboneViews[0];
  const evidenceViewOrder: Array<typeof activeBackboneView> = ["evidence", "star", "truth", "skills", "domain", "compensation"];
  const evidenceViews = evidenceViewOrder
    .map((id) => backboneViews.find((view) => view.id === id))
    .filter(Boolean) as typeof backboneViews;
  const backboneProjects = data.careerProfile.workExperiences.flatMap((experience) => experience.projects);
  const backboneProjectIds = new Set(backboneProjects.map((project) => project.id));
  const coveredProjectCount = data.careerProfile.workExperiences.reduce((count, experience) => count + experience.projects.filter((project) =>
    evidenceCoverageForProject(data, experience.id, project.id).traceabilityCovered
  ).length, 0);
  const cvUsableProjectCount = data.careerProfile.workExperiences.reduce((count, experience) => count + experience.projects.filter((project) =>
    evidenceCoverageForProject(data, experience.id, project.id).cvUsableCovered
  ).length, 0);
  const orphanRecordCount = [...data.skillInferences, ...data.domainKnowledge, ...data.evidenceCards, ...data.starStories]
    .filter((item) => item.projectId && !backboneProjectIds.has(item.projectId)).length;
  const pendingSyncCount = data.backboneTasks.filter((task) => task.status !== "Applied").length;

  function openBackboneMaintenance(view: "intake" | "generate") {
    if (view === "generate" && sourcesNeedingSnapshot.length === 0 && data.careerProfile.workExperiences.length > 0) {
      prepareProjectTasks();
    }
    setActiveBackboneView(view);
    window.requestAnimationFrame(() => {
      document.getElementById("backbone-maintenance-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <PageHeader title="Career Evidence" subtitle="原始資料保留完整細節；這裡只整理可供履歷、JD matching 與面試重用的外部可讀證據。">
      <section className="panel backbone-workbench">
        <div className="career-evidence-toolbar">
          <div>
            <span className="eyebrow">Career Backbone</span>
            <strong>Reusable Career Evidence Database</strong>
            <p>一次建立、持續增量同步；每份 JD 只讀取並選用，不重新生成 Backbone。</p>
            <div className="backbone-health-strip" aria-label="Career Evidence health">
              <span><b>{coveredProjectCount}/{backboneProjects.length}</b> projects covered</span>
              <span><b>{cvUsableProjectCount}/{backboneProjects.length}</b> CV-usable projects</span>
              <span><b>{data.evidenceCards.length}</b> evidence</span>
              <span><b>{data.starStories.length}</b> STAR</span>
              <span className={pendingSyncCount ? "attention" : ""}><b>{pendingSyncCount}</b> need sync/review</span>
              {orphanRecordCount > 0 && <span className="attention"><b>{orphanRecordCount}</b> orphan records</span>}
            </div>
          </div>
          <div className="toolbar-actions">
            <button className="secondary" onClick={() => openBackboneMaintenance("intake")}>Manage Sources</button>
            <button className="primary" onClick={() => openBackboneMaintenance("generate")}>
              {activeBackboneView === "generate" ? "Sync Workspace Open" : "Sync Career Evidence"}
            </button>
          </div>
        </div>
        <div className="backbone-tabs">
          {evidenceViews.map((view) => (
            <button
              key={view.id}
              className={view.id === activeBackboneView ? "active" : ""}
              onClick={() => setActiveBackboneView(view.id)}
            >
              <span>{view.label}</span>
              {typeof view.count === "number" && <small>{view.count}</small>}
            </button>
          ))}
        </div>
      </section>
      {activeBackboneView === "intake" || activeBackboneView === "generate" ? (
        <div id="backbone-maintenance-workspace">
          <FocusSection title={selectedBackboneView.title} detail={selectedBackboneView.detail}>
            {selectedBackboneView.content}
          </FocusSection>
        </div>
      ) : selectedBackboneView.content}
    </PageHeader>
  );
}
