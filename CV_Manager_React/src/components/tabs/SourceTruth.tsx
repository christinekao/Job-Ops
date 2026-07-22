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



export function SourceTruth({ data, onChange }: { data: AppData; onChange: (patch: Partial<AppData>) => void }) {
  const [pasteBack, setPasteBack] = useState("");
  const [preview, setPreview] = useState<ParsePreview<{ careerProfile: CareerProfile; sourceOfTruth: SourceOfTruth }>>(emptyPreview);
  const [activeSourceTab, setActiveSourceTab] = useState<"profile" | "fields">("profile");
  const prompt = buildSourceParsingPrompt(data);
  const truth = data.sourceOfTruth;
  const profile = data.careerProfile || emptyCareerProfile;

  function update(key: keyof SourceOfTruth, value: string) {
    onChange({ sourceOfTruth: { ...truth, [key]: value } });
  }

  function parseSourceTruth() {
    const parsed = tryParseJson<Record<string, unknown>>(pasteBack);
    if (!parsed.parsed || parsed.error) {
      setPreview({ raw: parsed.raw, parsed: null, error: parsed.error });
      return;
    }
    const careerProfile = normalizeCareerProfile(parsed.parsed);
    const sourceRecord = parsed.parsed.sourceOfTruth && typeof parsed.parsed.sourceOfTruth === "object"
      ? parsed.parsed.sourceOfTruth as Record<string, unknown>
      : profileToSourceOfTruth(careerProfile);
    setPreview({
      raw: parsed.raw,
      parsed: { careerProfile, sourceOfTruth: normalizeSourceOfTruth(sourceRecord) },
      error: ""
    });
  }

  function applyPreview() {
    if (!preview.parsed) return;
    onChange({
      careerProfile: preview.parsed.careerProfile,
      sourceOfTruth: { ...truth, ...preview.parsed.sourceOfTruth }
    });
  }

  return (
    <PageHeader title="Source of Truth" subtitle="穩定 career facts 先整理好，後面 JD tailoring 才不會 hallucinate。">
      <div className="tab-strip">
        <button className={activeSourceTab === "profile" ? "active" : ""} onClick={() => setActiveSourceTab("profile")}>Structured Profile</button>
        <button className={activeSourceTab === "fields" ? "active" : ""} onClick={() => setActiveSourceTab("fields")}>Legacy Text Fields</button>
      </div>
      {activeSourceTab === "profile" && <CareerProfileView profile={profile} />}
      {activeSourceTab === "fields" && (
        <section className="panel truth-grid">
          {Object.entries(truth).map(([key, value]) => (
            <Textarea
              key={key}
              label={key}
              value={value}
              onChange={(next) => update(key as keyof SourceOfTruth, next)}
              rows={4}
            />
          ))}
        </section>
      )}
      <details className="repair-disclosure">
        <summary><Sparkles size={17} /> Repair / regenerate Source of Truth</summary>
        <div className="repair-disclosure-body">
          <ManualAiPanel
            prompt={prompt}
            inputLabel="Prepare Input Data：Saved raw sources"
            inputValue={data.rawSources.map((source) => `${source.title}\n${source.content}`).join("\n\n")}
            readOnlyInput
            pasteLabel="Paste GPT Source JSON Back"
            pasteValue={pasteBack}
            onPasteChange={setPasteBack}
            onParse={parseSourceTruth}
          />
          <ParsePreviewCard preview={preview} onApply={applyPreview} />
        </div>
      </details>
    </PageHeader>
  );
}

export function CareerProfileView({ profile }: { profile: CareerProfile }) {
  const hasProfile = profile.workExperiences.length || profile.education.length || profile.skillGroups.length;
  return (
    <section className="panel profile-panel">
      <div className="panel-head">
        <h3>Structured Career Profile</h3>
        <span className="section-note">{hasProfile ? "Experience / education / skills are separated for downstream JD matching." : "No structured profile yet."}</span>
      </div>
      {!hasProfile ? (
        <p>Paste GPT Source JSON Back and Apply / Save to build the hierarchy.</p>
      ) : (
        <div className="profile-grid">
          <article className="profile-section">
            <h4>Identity</h4>
            <p>{profile.identity || "Not set"}</p>
            <p>{profile.positioning}</p>
            <div className="tag-row">{profile.targetRoles.map((role) => <em key={role}>{role}</em>)}</div>
          </article>
          <article className="profile-section">
            <h4>Skills</h4>
            {profile.skillGroups.map((group) => (
              <div key={group.id} className="compact-block">
                <strong>{group.name}</strong>
                <div className="tag-row">{group.skills.map((skill) => <em key={skill}>{skill}</em>)}</div>
              </div>
            ))}
          </article>
          <article className="profile-section span-2">
            <h4>Work Experience</h4>
            {profile.workExperiences.map((experience) => (
              <div key={experience.id} className="experience-block">
                <header>
                  <strong>{experience.role || "Role missing"}</strong>
                  <span>{experience.company} · {experience.period}</span>
                </header>
                <p>{experience.scope}</p>
                {experience.projects.map((project) => (
                  <div className="project-row" key={project.id}>
                    <strong>{project.name || "Project"}</strong>
                    <span>{project.category}</span>
                    <p>{project.summary}</p>
                    {project.metrics && <small>{project.metrics}</small>}
                  </div>
                ))}
              </div>
            ))}
          </article>
          <article className="profile-section">
            <h4>Education</h4>
            {profile.education.map((item) => (
              <div className="compact-block" key={item.id}>
                <strong>{item.degree}</strong>
                <span>{item.school} · {item.period}</span>
                <p>{item.notes}</p>
              </div>
            ))}
          </article>
          <article className="profile-section">
            <h4>Certifications</h4>
            {profile.certifications.map((item) => (
              <div className="compact-block" key={item.id}>
                <strong>{item.name}</strong>
                <span>{item.issuer} · {item.year}</span>
              </div>
            ))}
          </article>
        </div>
      )}
    </section>
  );
}
