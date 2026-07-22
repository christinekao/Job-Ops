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
  validateJDParseInput,
  buildProfileDeltaPrompt,
  buildSkillInferencePrompt,
  buildSingleSourceSnapshotPrompt,
  buildSourceParsingPrompt,
  buildStarPrompt,
  buildTailoredCVPrompt,
  PROJECT_BACKBONE_PROMPT_VERSION
} from "../../promptBuilders";
import { defaultData } from "../../sampleData";
import { exportData, importJobDescription, loadData, saveData, saveLocalData } from "../../storage";
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
  EmployerInsights,
  GenerationContext,
  HighCompensationSignal,
  JobApplication,
  JDAdditionalAttribute,
  JdImportProvenance,
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
import { computeJobContentHash, jobSourceIdentityMismatch, sourceUrlIntegrityIssue } from "../../data/jobs";
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



function formatReadableDate(value: string) {
  if (!value.trim()) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(parsed);
}

export function JDIntake({
  job,
  onSave,
  onUpdate
}: {
  job?: JobApplication;
  onSave: (job: JobApplication) => Promise<void>;
  onUpdate?: (patch: Partial<JobApplication>) => Promise<void>;
}) {
  const [rawJD, setRawJD] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [jobNumber, setJobNumber] = useState("");
  const [datePosted, setDatePosted] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [seniority, setSeniority] = useState("");
  const [overview, setOverview] = useState("");
  const [workSite, setWorkSite] = useState("");
  const [travel, setTravel] = useState("");
  const [profession, setProfession] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [roleType, setRoleType] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [requirements, setRequirements] = useState("");
  const [preferredQualifications, setPreferredQualifications] = useState("");
  const [skills, setSkills] = useState("");
  const [keywords, setKeywords] = useState("");
  const [compensation, setCompensation] = useState("");
  const [applicationWindow, setApplicationWindow] = useState("");
  const [additionalAttributes, setAdditionalAttributes] = useState<JDAdditionalAttribute[]>([]);
  const [employerInsights, setEmployerInsights] = useState<EmployerInsights | undefined>();
  const [employerSignal, setEmployerSignal] = useState("");
  const [risks, setRisks] = useState("");
  const [fitNotes, setFitNotes] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [importProvenance, setImportProvenance] = useState<JdImportProvenance | undefined>();
  const [importStatus, setImportStatus] = useState<"idle" | "fetching" | "ready" | "error">("idle");
  const [importMessage, setImportMessage] = useState("");
  const [pasteBack, setPasteBack] = useState("");
  const [preview, setPreview] = useState<ParsePreview<ParsedJD>>(emptyPreview);
  const [applyFeedback, setApplyFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const applyingRef = useRef(false);
  const savingRef = useRef(false);
  const feedbackOwnerIdRef = useRef("");
  const promptInputValidation = validateJDParseInput(rawJD);
  const prompt = buildJDParsePrompt(rawJD);

  useEffect(() => {
    if (!job) {
      setRawJD("");
      setCompany("");
      setRole("");
      setLocation("");
      setJobNumber("");
      setDatePosted("");
      setEmploymentType("");
      setSeniority("");
      setOverview("");
      setWorkSite("");
      setTravel("");
      setProfession("");
      setDiscipline("");
      setRoleType("");
      setResponsibilities("");
      setRequirements("");
      setPreferredQualifications("");
      setSkills("");
      setKeywords("");
      setCompensation("");
      setApplicationWindow("");
      setAdditionalAttributes([]);
      setEmployerInsights(undefined);
      setEmployerSignal("");
      setRisks("");
      setFitNotes("");
      setSourceUrl("");
      setImportUrl("");
      setImportProvenance(undefined);
      setImportStatus("idle");
      setImportMessage("");
      setPasteBack("");
      setPreview(emptyPreview<ParsedJD>());
      setApplyFeedback(null);
      setSaveFeedback(null);
      setHasUnsavedChanges(false);
      feedbackOwnerIdRef.current = "";
      return;
    }
    if (feedbackOwnerIdRef.current && feedbackOwnerIdRef.current !== job.id) {
      setApplyFeedback(null);
      setSaveFeedback(null);
      setHasUnsavedChanges(false);
      feedbackOwnerIdRef.current = "";
    }
    const parsed = job.parsed;
    setRawJD(job.rawJD || "");
    setCompany(parsed?.company || job.company || "");
    setRole(parsed?.role || job.role || "");
    setLocation(parsed?.location || job.location || "");
    setJobNumber(parsed?.jobNumber || "");
    setDatePosted(parsed?.datePosted || "");
    setEmploymentType(parsed?.employmentType || "");
    setSeniority(parsed?.seniority || "");
    setOverview(parsed?.overview || "");
    setWorkSite(parsed?.workSite || "");
    setTravel(parsed?.travel || "");
    setProfession(parsed?.profession || "");
    setDiscipline(parsed?.discipline || "");
    setRoleType(parsed?.roleType || "");
    setResponsibilities(joinLines(parsed?.responsibilities || []));
    setRequirements(joinLines(parsed?.requirements || []));
    setPreferredQualifications(joinLines(parsed?.preferredQualifications || []));
    setSkills(joinLines(parsed?.skills || []));
    setKeywords(joinLines(parsed?.keywords || []));
    setCompensation(parsed?.compensation || "");
    setApplicationWindow(parsed?.applicationWindow || "");
    setAdditionalAttributes(parsed?.additionalAttributes || []);
    setEmployerInsights(parsed?.employerInsights);
    setEmployerSignal(parsed?.employerSignal || "");
    setRisks(joinLines(parsed?.risks || []));
    setFitNotes(parsed?.fitNotes || "");
    setSourceUrl(parsed?.sourceUrl || "");
    setImportUrl(job.jdProvenance?.sourceUrl || "");
    setImportProvenance(job.jdProvenance);
    setImportStatus(job.jdProvenance?.sourceType === "url" ? "ready" : "idle");
    setImportMessage("");
    setPasteBack("");
    setPreview(emptyPreview<ParsedJD>());
  }, [job?.id]);

  async function applyPreview() {
    if (!preview.parsed || applyingRef.current) return;
    applyingRef.current = true;
    setIsApplying(true);
    setApplyFeedback(null);
    try {
      await new Promise<void>((resolve) => window.setTimeout(resolve, 120));
      setCompany(preview.parsed.company);
      setRole(preview.parsed.role);
      setLocation(preview.parsed.location);
      setJobNumber(preview.parsed.jobNumber || "");
      setDatePosted(preview.parsed.datePosted || "");
      setEmploymentType(preview.parsed.employmentType || "");
      setSeniority(preview.parsed.seniority || "");
      setOverview(preview.parsed.overview || "");
      setWorkSite(preview.parsed.workSite || "");
      setTravel(preview.parsed.travel || "");
      setProfession(preview.parsed.profession || "");
      setDiscipline(preview.parsed.discipline || "");
      setRoleType(preview.parsed.roleType || "");
      setResponsibilities(joinLines(preview.parsed.responsibilities || []));
      setRequirements(joinLines(preview.parsed.requirements || []));
      setPreferredQualifications(joinLines(preview.parsed.preferredQualifications || []));
      setSkills(joinLines(preview.parsed.skills || []));
      setKeywords(joinLines(preview.parsed.keywords || []));
      setCompensation(preview.parsed.compensation || "");
      setApplicationWindow(preview.parsed.applicationWindow || "");
      setAdditionalAttributes(preview.parsed.additionalAttributes || []);
      setEmployerInsights(preview.parsed.employerInsights);
      setEmployerSignal(preview.parsed.employerSignal || "");
      setRisks(joinLines(preview.parsed.risks || []));
      setFitNotes(preview.parsed.fitNotes || "");
      setSourceUrl(preview.parsed.sourceUrl || "");
      setHasUnsavedChanges(true);
      setSaveFeedback(null);
      setApplyFeedback({
        kind: "success",
        message: "Parsed JD applied successfully. Review the fields, then click Save JD to keep the changes."
      });
    } catch {
      setApplyFeedback({
        kind: "error",
        message: "Unable to apply parsed JD. The JSON is invalid or does not match the required structure."
      });
    } finally {
      applyingRef.current = false;
      setIsApplying(false);
    }
  }

  async function fetchFromUrl() {
    setImportStatus("fetching");
    setImportMessage("");
    try {
      const result = await importJobDescription(importUrl);
      setRawJD(result.rawJD);
      setSourceUrl(result.provenance.sourceUrl || importUrl);
      const conflicts: string[] = [];
      const fill = (label: string, current: string, incoming: string | undefined, setter: (value: string) => void) => {
        const value = incoming?.trim();
        if (!value) return;
        if (!current.trim() || current.trim() === value) setter(value);
        else conflicts.push(label);
      };
      fill("Company", company, result.extracted.company, setCompany);
      fill("Role", role, result.extracted.role, setRole);
      fill("Location", location, result.extracted.location, setLocation);
      fill("Job number", jobNumber, result.extracted.jobNumber, setJobNumber);
      fill("Date posted", datePosted, result.extracted.datePosted, setDatePosted);
      fill("Employment type", employmentType, result.extracted.employmentType, setEmploymentType);
      fill("Seniority", seniority, result.extracted.seniority, setSeniority);
      fill("Overview", overview, result.extracted.overview, setOverview);
      fill("Work site", workSite, result.extracted.workSite, setWorkSite);
      fill("Travel", travel, result.extracted.travel, setTravel);
      fill("Profession", profession, result.extracted.profession, setProfession);
      fill("Discipline", discipline, result.extracted.discipline, setDiscipline);
      fill("Role type", roleType, result.extracted.roleType, setRoleType);
      fill("Responsibilities", responsibilities, result.extracted.responsibilities?.join("\n"), setResponsibilities);
      fill("Requirements", requirements, result.extracted.requirements?.join("\n"), setRequirements);
      fill("Preferred qualifications", preferredQualifications, result.extracted.preferredQualifications?.join("\n"), setPreferredQualifications);
      fill("Skills", skills, result.extracted.skills?.join("\n"), setSkills);
      fill("Keywords", keywords, result.extracted.keywords?.join("\n"), setKeywords);
      fill("Compensation", compensation, result.extracted.compensation, setCompensation);
      fill("Application window", applicationWindow, result.extracted.applicationWindow, setApplicationWindow);
      if (result.extracted.additionalAttributes?.length) {
        setAdditionalAttributes(result.extracted.additionalAttributes);
      }
      if (result.extracted.employerInsights) {
        setEmployerInsights(result.extracted.employerInsights);
      }
      setImportProvenance(result.provenance);
      setImportStatus("ready");
      setImportMessage(
        `Fetched ${result.provenance.sourceDomain || "public job page"} using ${result.provenance.extractionMethod || "safe extraction"}. Structured values filled empty matching fields. ${conflicts.length ? `Kept your existing content for: ${conflicts.join(", ")}. ` : ""}Review, then Save; manual Parse remains available.`
      );
      setPasteBack("");
      setPreview(emptyPreview<ParsedJD>());
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : "FETCH_FAILED";
      const message = error instanceof Error ? error.message : "The job posting could not be imported.";
      setImportStatus("error");
      setImportMessage(`${code}: ${message} Your URL and existing manual JD text were preserved. You can retry or continue with manual paste.`);
    }
  }

  async function saveJob() {
    if (savingRef.current) return;
    const sourceUrlIssue = sourceUrlIntegrityIssue(sourceUrl);
    if (sourceUrlIssue) {
      setSaveFeedback({ kind: "error", message: `Unable to save JD. ${sourceUrlIssue} Your JD content was preserved.` });
      setHasUnsavedChanges(true);
      return;
    }
    const parsed: ParsedJD = {
      company: company || preview.parsed?.company || "",
      role: role || preview.parsed?.role || "",
      location: location || preview.parsed?.location || "",
      jobNumber: jobNumber || undefined,
      datePosted: datePosted || undefined,
      employmentType,
      seniority,
      overview: overview || undefined,
      workSite: workSite || undefined,
      travel: travel || undefined,
      profession: profession || undefined,
      discipline: discipline || undefined,
      roleType: roleType || undefined,
      responsibilities: lines(responsibilities),
      requirements: lines(requirements),
      preferredQualifications: lines(preferredQualifications),
      skills: lines(skills).length ? lines(skills) : undefined,
      keywords: lines(keywords),
      compensation: compensation || undefined,
      applicationWindow: applicationWindow || undefined,
      additionalAttributes: additionalAttributes.length ? additionalAttributes : undefined,
      employerInsights,
      employerSignal,
      risks: lines(risks),
      fitNotes,
      sourceUrl
    };
    const hasParsed = Object.values(parsed).some((value) => Array.isArray(value) ? value.length : Boolean(value));
    if (hasParsed && jobSourceIdentityMismatch({ company: parsed.company, role: parsed.role, rawJD, parsed })) {
      setSaveFeedback({ kind: "error", message: "Unable to save JD. The raw JD does not mention the parsed role or company. Your changes are still available." });
      setHasUnsavedChanges(true);
      return;
    }
    setSaveFeedback(null);
    const nextPatch: Partial<JobApplication> = {
      company: parsed.company || "Company unknown",
      role: parsed.role || "Untitled role",
      location: parsed.location,
      rawJD,
      parsed: hasParsed ? parsed : undefined,
      jdProvenance: importProvenance,
      jdContentHash: computeJobContentHash({
        company: parsed.company || "Company unknown",
        role: parsed.role || "Untitled role",
        location: parsed.location,
        rawJD,
        parsed: hasParsed ? parsed : undefined
      }),
      status: hasParsed ? "Parsed" : "New",
      nextAction: hasParsed ? "Open JD Workspace and match evidence." : "Parse JD with GPT paste-back."
    };

    const newJobId = uid("jd");
    const nextJob: JobApplication = {
      id: newJobId,
      company: nextPatch.company || "Company unknown",
      role: nextPatch.role || "Untitled role",
      location: nextPatch.location || "",
      rawJD: nextPatch.rawJD || "",
      jdContentHash: nextPatch.jdContentHash,
      parsed: nextPatch.parsed,
      status: nextPatch.status || "New",
      fit: "Unknown",
      nextAction: nextPatch.nextAction || "Parse JD with GPT paste-back.",
      selectedSkillIds: [],
      selectedDomainKnowledgeIds: [],
      selectedEvidenceIds: [],
      selectedStoryIds: [],
      jdProvenance: importProvenance,
      updatedAt: new Date().toISOString()
    };
    savingRef.current = true;
    setIsSaving(true);
    try {
      if (job && onUpdate) {
        await onUpdate({
          ...nextPatch,
          fit: "Unknown",
          fitReview: undefined,
          recommendationsAppliedAt: "",
          selectedSkillIds: [],
          selectedDomainKnowledgeIds: [],
          selectedEvidenceIds: [],
          selectedStoryIds: [],
          status: hasParsed ? "Parsed" : "New",
          nextAction: hasParsed
            ? "JD changed. Run Fit Review again before selecting evidence or exporting CV."
            : "Parse JD with GPT paste-back."
        });
        feedbackOwnerIdRef.current = job.id;
        setSaveFeedback({ kind: "success", message: "JD updated successfully." });
      } else {
        await onSave(nextJob);
        feedbackOwnerIdRef.current = newJobId;
        setSaveFeedback({ kind: "success", message: "JD saved successfully." });
      }
      setHasUnsavedChanges(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save JD.";
      const revisionConflict = /newer data|another tab|revision conflict/i.test(message);
      setSaveFeedback({
        kind: "error",
        message: revisionConflict
          ? "This job was updated elsewhere. Your changes were not overwritten. Review the latest version or use the existing recovery options."
          : `Unable to save JD. Your changes are still available.${message ? ` ${message}` : ""}`
      });
      setHasUnsavedChanges(true);
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }

  return (
    <PageHeader title="JD Intake" subtitle={job ? "Edit selected JD. Existing parsed values are loaded here." : "Raw JD → Copy Prompt → GPT paste-back → Parse Preview → Apply / Save。"}>
      <section className="panel">
        <h3>Import a public job URL</h3>
        <p>Fetches and extracts public text on the local server. It never runs AI, Parse, Screening, or creates a Job.</p>
        <div className="two-col">
          <Field label="Public job URL" value={importUrl} onChange={setImportUrl} />
          <button className="primary align-end" disabled={importStatus === "fetching"} onClick={() => void fetchFromUrl()}>
            {importStatus === "fetching" ? "Fetching…" : "Fetch / Extract"}
          </button>
        </div>
        {importMessage && (
          <div className={importStatus === "error" ? "fit-warning" : "success-note"}>
            <strong>{importStatus === "error" ? "Import failed" : "Import ready"}</strong>
            <p>{importMessage}</p>
            {importProvenance?.fetchWarnings?.map((warning) => <p key={warning}>Review: {warning}</p>)}
          </div>
        )}
      </section>
      <ManualAiPanel
        prompt={prompt}
        inputLabel="Prepare Input Data：Full raw JD"
        inputValue={rawJD}
        onInputChange={setRawJD}
        pasteLabel="Paste GPT JD JSON Back"
        pasteValue={pasteBack}
        onPasteChange={setPasteBack}
        onParse={() => setPreview(tryParseJson<ParsedJD>(pasteBack))}
        promptBlockedReason={promptInputValidation.ok ? undefined : promptInputValidation.reason}
      />
      <ParsePreviewCard preview={preview} onApply={applyPreview} applyLabel="Apply to form" applying={isApplying} />
      {applyFeedback && (
        <section
          className={applyFeedback.kind === "success" ? "success-note jd-action-feedback" : "fit-warning jd-action-feedback"}
          role={applyFeedback.kind === "success" ? "status" : "alert"}
          aria-live={applyFeedback.kind === "success" ? "polite" : undefined}
        >
          <strong>{applyFeedback.kind === "success" ? "Parsed JD applied" : "Apply failed"}</strong>
          <p>{applyFeedback.message}</p>
        </section>
      )}
      <div className="jd-intake-form">
        <section className="panel jd-intake-section">
          <h3>Core Job Information</h3>
          <div className="jd-intake-short-grid">
            <Field label="Company" value={company} onChange={setCompany} />
            <Field label="Role" value={role} onChange={setRole} />
            <Field label="Location" value={location} onChange={setLocation} />
            <Field label="Job number" value={jobNumber} onChange={setJobNumber} />
            <Field label="Date posted" value={datePosted} displayValue={formatReadableDate(datePosted)} onChange={setDatePosted} />
            <Field label="Employment type" value={employmentType} onChange={setEmploymentType} />
            <Field label="Seniority" value={seniority} onChange={setSeniority} placeholder="Not provided by source." helperText={!seniority ? "Not provided by source." : undefined} />
          </div>
        </section>

        <section className="panel jd-intake-section">
          <h3>Work Details</h3>
          <div className="jd-intake-short-grid">
            <Field label="Work site" value={workSite} onChange={setWorkSite} />
            <Field label="Travel" value={travel} onChange={setTravel} />
            <Field label="Profession" value={profession} onChange={setProfession} />
            <Field label="Discipline" value={discipline} onChange={setDiscipline} />
            <Field label="Role type" value={roleType} onChange={setRoleType} />
            <Field
              label="Source URL"
              value={sourceUrl}
              onChange={setSourceUrl}
              helperText={sourceUrlIntegrityIssue(sourceUrl) || undefined}
            />
          </div>
        </section>

        <section className="panel jd-intake-section">
          <h3>Job Description</h3>
          <div className="jd-intake-text-grid">
            <Textarea label="Overview" value={overview} onChange={setOverview} rows={7} />
            <Textarea label="Responsibilities" value={responsibilities} onChange={setResponsibilities} rows={7} />
          </div>
        </section>

        <section className="panel jd-intake-section">
          <h3>Qualifications</h3>
          <div className="jd-intake-text-grid">
            <Textarea label="Requirements" value={requirements} onChange={setRequirements} rows={7} />
            <Textarea label="Preferred qualifications" value={preferredQualifications} onChange={setPreferredQualifications} rows={7} />
            <Textarea label="Skills" value={skills} onChange={setSkills} rows={6} placeholder="Not provided by source — run JD Parse to derive skills." helperText={!skills ? "Not provided by source — run JD Parse to derive skills." : undefined} />
            <Textarea label="Keywords" value={keywords} onChange={setKeywords} rows={6} placeholder="Run JD Parse to derive keywords." helperText={!keywords ? "Run JD Parse to derive keywords." : undefined} />
          </div>
        </section>

        <section className="panel jd-intake-section">
          <h3>Compensation and Application</h3>
          <div className="jd-intake-text-grid">
            <Textarea label="Compensation" value={compensation} onChange={setCompensation} rows={7} />
            <Textarea label="Application window" value={applicationWindow} onChange={setApplicationWindow} rows={7} />
          </div>
        </section>

        <section className="panel jd-intake-section jd-imported-insights">
          <h3>Imported Source Insights</h3>
          {employerInsights && (employerInsights.topSkills.length > 0 || employerInsights.previouslyWorkedAs.length > 0) ? (
            <details className="jd-insights-disclosure">
              <summary>
                <span>Insights from previous hires</span>
                <span>{employerInsights.topSkills.length} top skills · {employerInsights.previouslyWorkedAs.length} previous roles</span>
                <span className="jd-insights-toggle">Show details</span>
              </summary>
              <p>Supplemental employer insight only — not a formal skill or qualification.</p>
              <div className="jd-insights-grid">
                <div>
                  <strong>Top skills</strong>
                  <div className="jd-insight-chips">
                    {employerInsights.topSkills.map((skill) => <span key={skill}>{skill}</span>)}
                  </div>
                </div>
                <div>
                  <strong>Previously worked as</strong>
                  <ol>{employerInsights.previouslyWorkedAs.map((roleName) => <li key={roleName}>{roleName}</li>)}</ol>
                </div>
              </div>
            </details>
          ) : (
            <p>No supplemental employer insights were provided by the source.</p>
          )}
          {additionalAttributes.length > 0 && (
            <details className="jd-additional-attributes">
              <summary>Additional imported attributes ({additionalAttributes.length})</summary>
              <p>Preview only. These values do not enter Screening, Writer, or JD identity unless you manually copy them into a canonical field.</p>
              {additionalAttributes.map((attribute) => (
                <div key={`${attribute.sourcePath || ""}:${attribute.label}`}>
                  <strong>{attribute.label}</strong>
                  <p>{Array.isArray(attribute.value) ? attribute.value.join(", ") : attribute.value}</p>
                </div>
              ))}
            </details>
          )}
        </section>

        <section className="panel jd-intake-section">
          <h3>AI Analysis</h3>
          <div className="jd-intake-text-grid">
            <Textarea label="Employer signal" value={employerSignal} onChange={setEmployerSignal} rows={6} placeholder="Generated after JD Parse / Screening." helperText={!employerSignal ? "Generated after JD Parse / Screening." : undefined} />
            <Textarea label="Risks / gaps" value={risks} onChange={setRisks} rows={6} placeholder="Generated after candidate-to-JD Screening." helperText={!risks ? "Generated after candidate-to-JD Screening." : undefined} />
            <div className="jd-intake-full-width">
              <Textarea label="Fit notes" value={fitNotes} onChange={setFitNotes} rows={6} placeholder="Generated after Screening and Positioning." helperText={!fitNotes ? "Generated after Screening and Positioning." : undefined} />
            </div>
          </div>
        </section>

        <div className="jd-intake-actions">
          {hasUnsavedChanges && <span className="jd-unsaved-indicator" role="status">Unsaved changes</span>}
          <button className="primary" disabled={isSaving} onClick={() => void saveJob()}>
            {isSaving ? "Saving…" : job ? "Update JD" : "Save JD"}
          </button>
        </div>
        {saveFeedback && (
          <section
            className={saveFeedback.kind === "success" ? "success-note jd-action-feedback" : "fit-warning jd-action-feedback"}
            role={saveFeedback.kind === "success" ? "status" : "alert"}
            aria-live={saveFeedback.kind === "success" ? "polite" : undefined}
          >
            <strong>{saveFeedback.kind === "success" ? "JD saved" : "Save failed"}</strong>
            <p>{saveFeedback.message}</p>
          </section>
        )}
      </div>
    </PageHeader>
  );
}
