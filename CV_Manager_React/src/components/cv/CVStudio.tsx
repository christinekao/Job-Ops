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
import { SourceIntake } from "../tabs/SourceIntake";
import { SourceTruth } from "../tabs/SourceTruth";
import { SkillMap } from "../tabs/SkillMap";
import { DomainKnowledgeMap } from "../tabs/DomainMap";
import { EvidenceBank } from "../tabs/EvidenceBank";
import { StarBank } from "../tabs/StarBank";
import { HighCompensationMap } from "../tabs/HighCompMap";
import { clearGuidedEditContext, readGuidedEditContext, type GuidedEditContext } from "./guidedEditing";


import { SubmitReadinessPanel } from "../shared/SubmitReadinessComponents";
export function CVStudio({
  data,
  job,
  onSave,
  showEditor = true
}: {
  data: AppData;
  job: JobApplication;
  onSave: (version: CvVersion) => void;
  showEditor?: boolean;
}) {
  const [pasteBack, setPasteBack] = useState("");
  const versions = sortCvVersions(data.cvVersions.filter((version) => version.jdId === job.id));
  const [selectedVersionId, setSelectedVersionId] = useState(showEditor ? versions[0]?.id || "" : "");
  const [preview, setPreview] = useState<ParsePreview<unknown>>(emptyPreview);
  const prompt = buildTailoredCVPrompt(data, job.id);
  const selectedVersion = versions.find((version) => version.id === selectedVersionId);
  const baseTailoredCv = selectedVersion?.tailoredCv;
  const baseSections = selectedVersion?.tailoredCv ? tailoredCvToSections(selectedVersion.tailoredCv) : selectedVersion?.sections;
  const [name, setName] = useState(selectedVersion?.name || defaultCvVersionName(job.role));
  const [summary, setSummary] = useState(selectedVersion?.summary || baseSections?.summary || "");
  const [sections, setSections] = useState<CvVersion["sections"]>(baseSections);
  const [tailoredCv, setTailoredCv] = useState<TailoredCv | undefined>(baseTailoredCv);
  const [versionMessage, setVersionMessage] = useState("");

  useEffect(() => {
    const version = versions.find((item) => item.id === selectedVersionId);
    const nextTailoredCv = version?.tailoredCv;
    const nextSections = version?.tailoredCv ? tailoredCvToSections(version.tailoredCv) : version?.sections;
    setName(version?.name || defaultCvVersionName(job.role));
    setSummary(version?.summary || nextSections?.summary || "");
    setSections(nextSections);
    setTailoredCv(nextTailoredCv);
  }, [selectedVersionId, selectedVersion?.updatedAt, job.id]);

  function applyPreview() {
    if (!preview.parsed) return;
    const nextTailoredCv = normalizeTailoredCv(preview.parsed);
    if (!nextTailoredCv) {
      setVersionMessage("Parse 成功，但不是 Tailored CV JSON。請確認回傳包含 tailoredCv.summary / tailoredCv.workExperience。");
      return;
    }
    const nextSections = tailoredCvToSections(nextTailoredCv);
    const nextName = defaultCvVersionName(nextTailoredCv.header.targetRole || job.role);
    const nextSummary = nextTailoredCv.summary || nextSections.summary || summary;
    const versionId = showEditor && selectedVersionId ? selectedVersionId : uid("cv");
    setTailoredCv(nextTailoredCv);
    setName(nextName);
    setSummary(nextSummary);
    setSections(nextSections);
    onSave({
      id: versionId,
      jdId: job.id,
      name: nextName,
      summary: nextSummary,
      content: composeCvContent(nextSections),
      sections: nextSections,
      tailoredCv: nextTailoredCv,
      generationContext: buildGenerationContext(data, job),
      status: "Draft",
      updatedAt: new Date().toISOString()
    });
    setSelectedVersionId(versionId);
    setPreview(emptyPreview);
    setPasteBack("");
    setVersionMessage("Tailored CV JSON 已套用並自動儲存。下方 Edit / Export 已更新為這一版。");
  }

  function updateSection(key: keyof NonNullable<CvVersion["sections"]>, value: string) {
    setSections((current) => ({ ...(current || emptyCvSections()), [key]: value }));
  }

  function updateTailoredCv(next: TailoredCv) {
    setTailoredCv(next);
    const nextSections = tailoredCvToSections(next);
    setSections(nextSections);
    setSummary(next.summary);
  }

  function saveVersion() {
    const finalSections = tailoredCv ? tailoredCvToSections(tailoredCv) : sections;
    if (!finalSections) {
      setVersionMessage("還沒有 recruiter-ready CV。請先 Copy Prompt，貼回 Tailored CV JSON，再 Apply。");
      return;
    }
    const finalTailoredCv = tailoredCv || sectionsToTailoredCv(finalSections, selectedVersion?.tailoredCv);
    const versionId = selectedVersionId || uid("cv");
    onSave({
      id: versionId,
      jdId: job.id,
      name: name || defaultCvVersionName(job.role),
      summary,
      content: composeCvContent(finalSections),
      sections: finalSections,
      tailoredCv: finalTailoredCv,
      generationContext: selectedVersion?.generationContext || buildGenerationContext(data, job),
      status: selectedVersion?.status || "Draft",
      updatedAt: new Date().toISOString()
    });
    setSelectedVersionId(versionId);
    setTailoredCv(finalTailoredCv);
    setVersionMessage(`Saved: ${name || defaultCvVersionName(job.role)}`);
  }

  return (
    <PageHeader title="CV Version Studio" subtitle="先用 recruiter prompt 產生 Tailored CV JSON，Apply 後才進正式 CV。下方 sections 可手動編輯、存版本、export。">
      <section className="panel version-bar">
        <label className="field">
          <span>Saved versions for this JD</span>
          <select value={selectedVersionId} onChange={(event) => setSelectedVersionId(event.target.value)}>
            <option value="">New editable draft</option>
            {versions.map((version) => (
              <option value={version.id} key={version.id}>{version.name} · {new Date(version.updatedAt).toLocaleString()}</option>
            ))}
          </select>
        </label>
        <button className="primary align-end" onClick={saveVersion}>Save Version</button>
      </section>
      {versionMessage && <div className="save-status">{versionMessage}</div>}
      <ManualAiPanel
        prompt={prompt}
        inputLabel="Prepare Input Data：JD + selected evidence + selected STAR"
        inputValue={JSON.stringify(buildCvPromptInput(data, job), null, 2)}
        readOnlyInput
        pasteLabel="Paste GPT Tailored CV JSON Back"
        pasteValue={pasteBack}
        onPasteChange={setPasteBack}
        onParse={() => setPreview(tryParseJson(pasteBack))}
      />
      <ParsePreviewCard preview={preview} onApply={applyPreview} applyLabel="Apply + Save CV version" />
      {!showEditor && tailoredCv && (
        <section className="save-status">
          Parsed CV is saved. Review the generated structure when needed, then edit/export below.
        </section>
      )}
      {showEditor && (
        !sections ? (
          <EmptyState title="No recruiter CV JSON applied yet" action="Copy prompt, paste GPT JSON, then Apply" />
        ) : tailoredCv ? (
          <>
            <CVBlockEditor
              name={name}
              cv={tailoredCv}
              onNameChange={setName}
              onChange={updateTailoredCv}
            />
            <CvPreview sections={tailoredCvToSections(tailoredCv)} profile={data.careerProfile} job={job} />
          </>
        ) : (
          <>
            <section className="panel cv-editor">
              <Field label="Version name" value={name} onChange={setName} />
              <Textarea
                label="CV summary"
                value={summary}
                onChange={(next) => {
                  setSummary(next);
                  updateSection("summary", next);
                }}
                rows={4}
              />
              {(Object.entries(sections) as [keyof NonNullable<CvVersion["sections"]>, string][])
                .filter(([key]) => key !== "summary" && key !== "projects")
                .map(([key, value]) => (
                  <Textarea key={key} label={key} value={value} onChange={(next) => updateSection(key, next)} rows={key === "workExperience" ? 10 : 5} />
                ))}
            </section>
            <CvPreview sections={sections} profile={data.careerProfile} job={job} />
          </>
        )
      )}
    </PageHeader>
  );
}

export function CVBlockEditor({
  name,
  cv,
  onNameChange,
  onChange,
  guidedFocusKey,
  guidedHighlightKey
}: {
  name: string;
  cv: TailoredCv;
  onNameChange: (value: string) => void;
  onChange: (value: TailoredCv) => void;
  guidedFocusKey?: string;
  guidedHighlightKey?: string;
}) {
  const guidedClass = (key: string) => guidedHighlightKey === key ? "guided-edit-target active" : "guided-edit-target";
  const updateHeader = (key: keyof TailoredCv["header"], value: string) => {
    onChange({ ...cv, header: { ...cv.header, [key]: value } });
  };
  const updateSidebar = (patch: Partial<TailoredCv["sidebar"]>) => {
    onChange({ ...cv, sidebar: { ...cv.sidebar, ...patch } });
  };
  const updateExperience = (index: number, patch: Partial<TailoredCv["workExperience"][number]>) => {
    onChange({
      ...cv,
      workExperience: cv.workExperience.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item)
    });
  };
  const updateSubsection = (experienceIndex: number, subsectionIndex: number, patch: Partial<TailoredCv["workExperience"][number]["subsections"][number]>) => {
    onChange({
      ...cv,
      workExperience: cv.workExperience.map((experience, itemIndex) => {
        if (itemIndex !== experienceIndex) return experience;
        return {
          ...experience,
          subsections: experience.subsections.map((section, sectionIndex) =>
            sectionIndex === subsectionIndex ? { ...section, ...patch } : section
          )
        };
      })
    });
  };
  const updateBullet = (experienceIndex: number, subsectionIndex: number, bulletIndex: number, text: string) => {
    onChange({
      ...cv,
      workExperience: cv.workExperience.map((experience, itemIndex) => {
        if (itemIndex !== experienceIndex) return experience;
        return {
          ...experience,
          subsections: experience.subsections.map((section, sectionIndex) => {
            if (sectionIndex !== subsectionIndex) return section;
            return {
              ...section,
              bullets: section.bullets.map((bullet, itemBulletIndex) =>
                itemBulletIndex === bulletIndex ? { ...bullet, text } : bullet
              )
            };
          })
        };
      })
    });
  };
  const removeBullet = (experienceIndex: number, subsectionIndex: number, bulletIndex: number) => {
    onChange({
      ...cv,
      workExperience: cv.workExperience.map((experience, itemIndex) => {
        if (itemIndex !== experienceIndex) return experience;
        return {
          ...experience,
          subsections: experience.subsections.map((section, sectionIndex) => {
            if (sectionIndex !== subsectionIndex) return section;
            return { ...section, bullets: section.bullets.filter((_, itemBulletIndex) => itemBulletIndex !== bulletIndex) };
          })
        };
      })
    });
  };
  const addBullet = (experienceIndex: number, subsectionIndex: number) => {
    onChange({
      ...cv,
      workExperience: cv.workExperience.map((experience, itemIndex) => {
        if (itemIndex !== experienceIndex) return experience;
        return {
          ...experience,
          subsections: experience.subsections.map((section, sectionIndex) => {
            if (sectionIndex !== subsectionIndex) return section;
            return { ...section, bullets: [...section.bullets, { text: "", confidence: "Grounded" }] };
          })
        };
      })
    });
  };
  const moveBullet = (experienceIndex: number, subsectionIndex: number, bulletIndex: number, direction: -1 | 1) => {
    onChange({
      ...cv,
      workExperience: cv.workExperience.map((experience, itemIndex) => {
        if (itemIndex !== experienceIndex) return experience;
        return {
          ...experience,
          subsections: experience.subsections.map((section, sectionIndex) => {
            if (sectionIndex !== subsectionIndex) return section;
            const nextIndex = bulletIndex + direction;
            if (nextIndex < 0 || nextIndex >= section.bullets.length) return section;
            const nextBullets = [...section.bullets];
            [nextBullets[bulletIndex], nextBullets[nextIndex]] = [nextBullets[nextIndex], nextBullets[bulletIndex]];
            return { ...section, bullets: nextBullets };
          })
        };
      })
    });
  };
  const addSubsection = (experienceIndex: number) => {
    onChange({
      ...cv,
      workExperience: cv.workExperience.map((experience, itemIndex) =>
        itemIndex === experienceIndex
          ? { ...experience, subsections: [...experience.subsections, { title: "New section", bullets: [{ text: "", confidence: "Grounded" }] }] }
          : experience
      )
    });
  };
  const removeSubsection = (experienceIndex: number, subsectionIndex: number) => {
    onChange({
      ...cv,
      workExperience: cv.workExperience.map((experience, itemIndex) =>
        itemIndex === experienceIndex
          ? { ...experience, subsections: experience.subsections.filter((_, sectionIndex) => sectionIndex !== subsectionIndex) }
          : experience
      )
    });
  };
  const moveSubsection = (experienceIndex: number, subsectionIndex: number, direction: -1 | 1) => {
    onChange({
      ...cv,
      workExperience: cv.workExperience.map((experience, itemIndex) => {
        if (itemIndex !== experienceIndex) return experience;
        const nextIndex = subsectionIndex + direction;
        if (nextIndex < 0 || nextIndex >= experience.subsections.length) return experience;
        const nextSubsections = [...experience.subsections];
        [nextSubsections[subsectionIndex], nextSubsections[nextIndex]] = [nextSubsections[nextIndex], nextSubsections[subsectionIndex]];
        return { ...experience, subsections: nextSubsections };
      })
    });
  };
  const skillGroupsText = cv.sidebar.skillGroups
    .map((group) => `${group.title}: ${[...group.highlightedSkills, ...group.otherSkills].join(", ")}`)
    .join("\n");
  const languagesText = cv.sidebar.languages.map((item) => [item.name, item.level, item.note].filter(Boolean).join(" | ")).join("\n");
  const educationText = cv.sidebar.education.map((item) => `${item.degree} | ${item.school} | ${item.period}`).join("\n");

  return (
    <section className="panel cv-block-editor">
      <div className="block-editor-top">
        <Field label="Version name" value={name} onChange={onNameChange} />
        <div className={guidedClass("guided-summary-summary")} data-guided-key="guided-summary-summary">
          <Textarea label="Summary" value={cv.summary} onChange={(summary) => onChange({ ...cv, summary })} rows={4} />
        </div>
      </div>
      <section className="cv-edit-block">
        <div className="block-title">Header</div>
        <div className="inline-fields">
          <div className={guidedClass("guided-contact-name")} data-guided-key="guided-contact-name">
            <Field label="Name" value={cv.header.name} onChange={(value) => updateHeader("name", value)} />
          </div>
          <Field label="Target role" value={cv.header.targetRole} onChange={(value) => updateHeader("targetRole", value)} />
          <div className={guidedClass("guided-contact-email")} data-guided-key="guided-contact-email">
            <Field label="Email" value={cv.header.email} onChange={(value) => updateHeader("email", value)} />
          </div>
          <div className={guidedClass("guided-contact-location")} data-guided-key="guided-contact-location">
            <Field label="Location" value={cv.header.location} onChange={(value) => updateHeader("location", value)} />
          </div>
        </div>
      </section>
      <section className="cv-edit-block">
        <div className="block-title">Sidebar</div>
        <div className={guidedClass("guided-skills-skill-groups")} data-guided-key="guided-skills-skill-groups">
          <Textarea
            label="Skill groups"
            value={skillGroupsText}
            onChange={(value) => updateSidebar({ skillGroups: parseSkillSection(value).map((group) => ({
              title: group.name,
              highlightedSkills: group.skills.slice(0, 3),
              otherSkills: group.skills.slice(3)
            })) })}
            rows={5}
          />
        </div>
        <div className="inline-fields">
          <Textarea label="Languages" value={languagesText} onChange={(value) => updateSidebar({ languages: parseLanguageSection(value) })} rows={3} />
          <div className={guidedClass("guided-education-education")} data-guided-key="guided-education-education">
            <Textarea label="Education" value={educationText} onChange={(value) => updateSidebar({ education: parseEducationSection(value).map((item) => ({ school: item.school, degree: item.degree, period: item.period })) })} rows={3} />
          </div>
        </div>
      </section>
      <section className="cv-edit-block">
        <div className="block-title">Work Experience</div>
        {cv.workExperience.map((experience, experienceIndex) => (
          <article className="experience-edit-block" key={`${experience.company}-${experienceIndex}`}>
            <div className="block-row-head">
              <div>
                <strong>{experience.role || "Untitled role"}</strong>
                <span>{experience.company || "Company"} · {experience.period || "Period"}</span>
              </div>
              <button className="secondary small" type="button" onClick={() => addSubsection(experienceIndex)}>Add section</button>
            </div>
            <div className="inline-fields">
              <Field label="Role" value={experience.role} onChange={(value) => updateExperience(experienceIndex, { role: value })} />
              <Field label="Company" value={experience.company} onChange={(value) => updateExperience(experienceIndex, { company: value })} />
              <Field label="Period" value={experience.period} onChange={(value) => updateExperience(experienceIndex, { period: value })} />
              <Field label="Location" value={experience.location} onChange={(value) => updateExperience(experienceIndex, { location: value })} />
            </div>
            {experience.subsections.map((section, subsectionIndex) => (
              <details className="subsection-edit-block" key={`${section.title}-${subsectionIndex}`} open>
                <summary className="block-row-head">
                  <div>
                    <strong>{section.title || "Untitled section"}</strong>
                    <span>{section.bullets.length} bullets</span>
                  </div>
                  <div className="block-actions">
                    <button className="ghost small" type="button" onClick={(event) => {
                      event.preventDefault();
                      moveSubsection(experienceIndex, subsectionIndex, -1);
                    }}>Up</button>
                    <button className="ghost small" type="button" onClick={(event) => {
                      event.preventDefault();
                      moveSubsection(experienceIndex, subsectionIndex, 1);
                    }}>Down</button>
                    <button className="danger-lite small" type="button" onClick={(event) => {
                      event.preventDefault();
                      if (!confirmRemoval(`CV subsection "${section.title}"`)) return;
                      removeSubsection(experienceIndex, subsectionIndex);
                    }}>Remove</button>
                  </div>
                </summary>
                <Field label="Subsection title" value={section.title} onChange={(value) => updateSubsection(experienceIndex, subsectionIndex, { title: value })} />
                <div className="bullet-editor-list">
                  {section.bullets.map((bullet, bulletIndex) => (
                    <div
                      className={`bullet-edit-row ${guidedClass(`guided-workExperience-bullet-${experience.experienceId || String(experienceIndex)}-${experienceIndex}-${subsectionIndex}-${bulletIndex}`)}`}
                      data-guided-key={`guided-workExperience-bullet-${experience.experienceId || String(experienceIndex)}-${experienceIndex}-${subsectionIndex}-${bulletIndex}`}
                      key={`${bullet.text}-${bulletIndex}`}
                    >
                      <textarea
                        data-guided-focus={guidedFocusKey === `guided-workExperience-bullet-${experience.experienceId || String(experienceIndex)}-${experienceIndex}-${subsectionIndex}-${bulletIndex}` ? "true" : undefined}
                        value={bullet.text}
                        rows={2}
                        onChange={(event) => updateBullet(experienceIndex, subsectionIndex, bulletIndex, event.target.value)}
                      />
                      <div className="bullet-actions">
                        <button className="ghost small" type="button" onClick={() => moveBullet(experienceIndex, subsectionIndex, bulletIndex, -1)}>Up</button>
                        <button className="ghost small" type="button" onClick={() => moveBullet(experienceIndex, subsectionIndex, bulletIndex, 1)}>Down</button>
                        <button className="danger-lite small" type="button" onClick={() => removeBullet(experienceIndex, subsectionIndex, bulletIndex)}>Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="secondary add-bullet" type="button" onClick={() => addBullet(experienceIndex, subsectionIndex)}>Add bullet</button>
              </details>
            ))}
          </article>
        ))}
      </section>
    </section>
  );
}

export function CVEditorExportPage({
  data,
  job,
  cv,
  onSave,
  onUpdateJob
}: {
  data: AppData;
  job?: JobApplication;
  cv?: CvVersion;
  onSave: (version: CvVersion) => void;
  onUpdateJob?: (patch: Partial<JobApplication>) => void;
}) {
  const initialTailoredCv = tailoredCvFromVersion(cv);
  const [name, setName] = useState(cv?.name || (job ? defaultCvVersionName(job.role) : ""));
  const [cvStatus, setCvStatus] = useState<CvVersion["status"]>(cv?.status || "Draft");
  const [editableCv, setEditableCv] = useState<TailoredCv | undefined>(initialTailoredCv);
  const [activePanel, setActivePanel] = useState<"edit" | "preview" | "quality">(() =>
    sessionStorage.getItem("cv-manager-cv-panel") === "quality" ? "quality" : "edit"
  );
  const [message, setMessage] = useState("");
  const [guidedEditContext, setGuidedEditContext] = useState<GuidedEditContext | null>(() => readGuidedEditContext());
  const [highlightKey, setHighlightKey] = useState("");
  const [guidedEditError, setGuidedEditError] = useState("");
  const [pendingExport, setPendingExport] = useState<{ exportedAt: string; fileName: string } | null>(null);

  useEffect(() => {
    const nextTailoredCv = tailoredCvFromVersion(cv);
    setName(cv?.name || (job ? defaultCvVersionName(job.role) : ""));
    setCvStatus(cv?.status || "Draft");
    setEditableCv(nextTailoredCv);
    const requestedPanel = sessionStorage.getItem("cv-manager-cv-panel");
    sessionStorage.removeItem("cv-manager-cv-panel");
    setActivePanel(requestedPanel === "quality" ? "quality" : "edit");
    setGuidedEditContext(readGuidedEditContext());
    setHighlightKey("");
    setGuidedEditError("");
    setMessage("");
    setPendingExport(null);
  }, [cv?.id, cv?.updatedAt, job?.id]);

  useEffect(() => {
    if (!guidedEditContext || activePanel !== "edit") return;
    const focusKey = guidedEditContext.target.focusKey;
    const target = document.querySelector<HTMLElement>(`[data-guided-key="${focusKey}"]`);
    if (!target) {
      setGuidedEditError(`Target field is not visible yet: ${guidedEditContext.affectedField}`);
      return;
    }
    setGuidedEditError("");
    setHighlightKey(guidedEditContext.target.highlightKey);
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    const focusable = target.matches("input, textarea, select, button")
      ? target
      : target.querySelector<HTMLElement>("input, textarea, select, button");
    window.setTimeout(() => focusable?.focus(), 80);
    const clearTimer = window.setTimeout(() => setHighlightKey(""), 4200);
    const clearOnInput = () => setHighlightKey("");
    target.addEventListener("input", clearOnInput, { once: true });
    target.addEventListener("focusin", clearOnInput, { once: true });
    return () => {
      window.clearTimeout(clearTimer);
      target.removeEventListener("input", clearOnInput);
      target.removeEventListener("focusin", clearOnInput);
    };
  }, [guidedEditContext, activePanel, editableCv]);

  function saveEditableCv() {
    if (!job || !cv || !editableCv) {
      setMessage("目前沒有可儲存的 CV version。請先在 CV Version Studio 產生並 Save Version。");
      return;
    }
    const sections = tailoredCvToSections(editableCv);
    onSave({
      ...cv,
      name: name || defaultCvVersionName(job.role),
      summary: editableCv.summary,
      content: composeCvContent(sections),
      sections,
      tailoredCv: editableCv,
      status: cvStatus,
      updatedAt: new Date().toISOString()
    });
    if (guidedEditContext) {
      setMessage(`Saved and validated affected ${guidedEditContext.target.section} checks for: ${guidedEditContext.title}`);
    } else {
      setMessage(`Saved: ${name || defaultCvVersionName(job.role)}`);
    }
  }

  function startCvPrint() {
    const cleanupPrintMode = () => document.body.classList.remove("cv-printing");
    document.body.classList.add("cv-printing");
    window.addEventListener("afterprint", cleanupPrintMode, { once: true });
    window.setTimeout(() => window.print(), 50);
    window.setTimeout(cleanupPrintMode, 15000);
  }

  function printCvPdf() {
    if (!job || !cv || !editableCv) return;
    const now = new Date().toISOString();
    const fileName = `${name || cv.name}.pdf`;
    setPendingExport({ exportedAt: now, fileName });
    setMessage("Print dialog opened. After saving the PDF, confirm below to record the export history.");
    startCvPrint();
  }

  function confirmExportRecorded() {
    if (!job || !cv || !editableCv || !pendingExport) return;
    const sections = tailoredCvToSections(editableCv);
    const cvContentHash = contentHash({ tailoredCv: editableCv, sections });
    const qualityScore = `${qualityChecks.filter((item) => item.ok).length}/${qualityChecks.length}`;
    const snapshot = {
      id: uid("export"),
      exportedAt: pendingExport.exportedAt,
      fileName: pendingExport.fileName,
      jobId: job.id,
      versionName: name || cv.name,
      jdContentHash: job.jdContentHash || computeJobContentHash(job),
      cvContentHash,
      generationContext: cv.generationContext,
      qualityScore,
      applied: Boolean(job.applicationLog?.appliedAt)
    };
    onSave({
      ...cv,
      name: name || defaultCvVersionName(job.role),
      summary: editableCv.summary,
      content: composeCvContent(sections),
      sections,
      tailoredCv: editableCv,
      status: "Exported",
      exportedAt: pendingExport.exportedAt,
      exportHistory: [
        ...(cv.exportHistory || []),
        {
          exportedAt: pendingExport.exportedAt,
          fileName: pendingExport.fileName,
          jobId: job.id,
          versionName: name || cv.name,
          jdContentHash: snapshot.jdContentHash,
          cvContentHash,
          qualityScore,
          applied: snapshot.applied
        }
      ],
      exportSnapshots: [...(cv.exportSnapshots || []), snapshot],
      updatedAt: new Date().toISOString()
    });
    setCvStatus("Exported");
    setMessage(`Final PDF action recorded: ${pendingExport.fileName}. After applying, complete the application log below.`);
    setPendingExport(null);
  }

  const sections = editableCv ? tailoredCvToSections(editableCv) : null;
  const qualityChecks = editableCv && job ? cvQualityChecks(editableCv, job, data) : [];
  const qualityFailures = qualityChecks.filter((item) => !item.ok);
  const contentAudit = editableCv ? cvContentAudit(editableCv) : [];
  const layoutChecks = editableCv && sections ? cvLayoutDiagnostics(editableCv, sections) : [];
  const qualityReady = qualityChecks.length > 0 && qualityChecks.every((item) => item.ok);
  const needsFitReview = !job?.fitReview || job.fit === "Unknown";
  const cvIsStale = isCvStaleForJob(cv, job, data);
  const canExportFinal = qualityReady && !needsFitReview && !cvIsStale;
  const applicationLog = job?.applicationLog || {};

  return (
    <PageHeader title="CV Editor / Export" subtitle="打開 saved CV version 後直接編輯 block，右側即時看兩頁正式 CV preview，最後從同一頁 export。">
      {!job || !cv || !editableCv || !sections ? (
        <EmptyState title="No editable CV version for this JD" action="Go to CV Version Studio, paste Tailored CV JSON, then Save Version" />
      ) : (
        <>
          <section className="panel editor-export-toolbar">
            <div>
              <span>Current CV version</span>
              <strong>{name || cv.name}</strong>
              <p>{job.role} · {job.company}</p>
            </div>
            <div className="toolbar-actions">
              <label className="status-select">
                <span>Status</span>
                <select value={cvStatus} onChange={(event) => setCvStatus(event.target.value as CvVersion["status"])}>
                  <option>Draft</option>
                  <option>Editing</option>
                  <option>Ready for Review</option>
                  <option>Ready to Export</option>
                  <option>Exported</option>
                </select>
              </label>
              <button className="secondary" onClick={saveEditableCv}>Save edits</button>
            </div>
          </section>
          {message && <div className="save-status">{message}</div>}
          {guidedEditContext && (
            <section className="guided-edit-panel" aria-label="Guided edit context">
              <div>
                <span className="eyebrow">{guidedEditContext.progressLabel}</span>
                <strong>{guidedEditContext.title}</strong>
                <p>{guidedEditContext.explanation}</p>
              </div>
              <dl>
                <div>
                  <dt>Affected field</dt>
                  <dd>{guidedEditContext.affectedField}</dd>
                </div>
                <div>
                  <dt>Expected outcome</dt>
                  <dd>{guidedEditContext.expectedOutcome}</dd>
                </div>
              </dl>
              <div className="guided-edit-actions">
                <button className="primary small" type="button" onClick={saveEditableCv}>Save and Validate</button>
                <button className="secondary small" type="button" onClick={() => {
                  clearGuidedEditContext();
                  setGuidedEditContext(null);
                  setHighlightKey("");
                  setGuidedEditError("");
                }}>Return to Blockers</button>
              </div>
              {guidedEditError ? <p className="guided-edit-error">{guidedEditError}</p> : null}
            </section>
          )}
          {needsFitReview && (
            <section className="fit-warning">
              <strong>Fit Review missing</strong>
              <p>This CV can still be edited, but do not treat it as final until the JD strategy is reviewed. Run Fit Review in JD Tailoring Workspace first.</p>
            </section>
          )}
          {cvIsStale && (
            <section className="fit-warning">
              <strong>JD changed after this CV was generated</strong>
              <p>This version was generated from an older JD snapshot. Re-run CV generation or consciously save a new version before exporting.</p>
            </section>
          )}
          <section className="panel cv-workbench-tabs" aria-label="CV workbench mode">
            <button className={activePanel === "edit" ? "active" : ""} onClick={() => setActivePanel("edit")}>Edit Blocks</button>
            <button className={activePanel === "preview" ? "active" : ""} onClick={() => setActivePanel("preview")}>Preview CV</button>
            <button className={activePanel === "quality" ? "active" : ""} onClick={() => setActivePanel("quality")}>Final Export</button>
          </section>
          {activePanel === "edit" && (
            <section className="editor-export-layout live-edit">
              <div className="editor-pane">
                <CVBlockEditor
                  name={name}
                  cv={editableCv}
                  onNameChange={setName}
                  onChange={setEditableCv}
                  guidedFocusKey={guidedEditContext?.target.focusKey}
                  guidedHighlightKey={highlightKey}
                />
              </div>
              <aside className="live-preview-pane" aria-label="Live formal CV preview">
                <div className="live-preview-head">
                  <div>
                    <strong>Live formal preview</strong>
                    <p>Use this to catch page gaps, cramped bullets, and sidebar density while editing.</p>
                  </div>
                  <button className="secondary small" type="button" onClick={() => setActivePanel("preview")}>Open large preview</button>
                </div>
                <CvLayoutDiagnosticsPanel checks={layoutChecks} compact />
                <div className="live-preview-scroll">
                  <CvPreview sections={sections} profile={data.careerProfile} job={job} />
                </div>
              </aside>
            </section>
          )}
          {activePanel === "preview" && (
            <section className="editor-export-preview preview-only">
              <div className="preview-head">
                <div>
                  <span className="preview-title">Live CV Preview</span>
                  <p>Review layout at fixed page width. Use horizontal scroll on narrow screens.</p>
                </div>
                <div className="preview-actions">
                  <button className="secondary small" onClick={() => setActivePanel("edit")}>Back to Edit</button>
                  <button className="primary small" onClick={() => setActivePanel("quality")}>Final Export</button>
                </div>
              </div>
              <CvPreview sections={sections} profile={data.careerProfile} job={job} />
            </section>
          )}
          {activePanel === "quality" && (
            <section className="panel quality-panel">
              <div className="panel-head">
                <h3>Final Export Checklist</h3>
                <div className="quality-actions">
                  <span>{qualityChecks.filter((item) => item.ok).length}/{qualityChecks.length} ready</span>
                  {qualityReady && cvStatus !== "Ready to Export" && cvStatus !== "Exported" && (
                    <button className="secondary small" onClick={() => setCvStatus("Ready to Export")}>Mark Ready to Export</button>
                  )}
                </div>
              </div>
              <section className="quality-explainer">
                <div>
                  <strong>{qualityFailures.length ? `${qualityFailures.length} checks need action` : "All CV checks passed"}</strong>
                  <p>This is an export checklist, not a score. Fix the red checks one at a time, save your edits, then return here. You do not need to rebuild Career Backbone unless the underlying evidence is wrong.</p>
                </div>
                {qualityFailures.length > 0 && <button className="secondary small" onClick={() => setActivePanel("edit")}>Open Edit Blocks</button>}
              </section>
              {contentAudit.length > 0 && (
                <section className="content-audit-panel">
                  <div className="panel-head">
                    <div>
                      <h3>Content audit</h3>
                      <p>Fix these bullets before export. The audit separates business impact from test settings, internal activity counts, and company-only terminology.</p>
                    </div>
                    <button className="secondary small" onClick={() => setActivePanel("edit")}>Edit flagged bullets</button>
                  </div>
                  <div className="content-audit-list">
                    {contentAudit.slice(0, 8).map((item) => (
                      <article key={item.id}>
                        <strong>{item.location}</strong>
                        <p>{item.excerpt}</p>
                        <em>{item.reasons.join(" ")}</em>
                      </article>
                    ))}
                  </div>
                </section>
              )}
              <div className="quality-grid">
                {qualityChecks.map((item) => (
                  <article key={item.label} className={item.ok ? "quality-item ok" : "quality-item warn"}>
                    <strong>{item.label}</strong>
                    <p>{item.message}</p>
                    {!item.ok && <em>{item.action}</em>}
                    {!item.ok && (() => {
                      const guide = qualityFixGuide(item.label);
                      return (
                        <details className="quality-fix-guide">
                          <summary>How to fix</summary>
                          <ol>{guide.steps.map((step) => <li key={step}>{step}</li>)}</ol>
                          {guide.example && <p><strong>Example</strong>{guide.example}</p>}
                        </details>
                      );
                    })()}
                  </article>
                ))}
              </div>
              <CvLayoutDiagnosticsPanel checks={layoutChecks} />
              {!!cv.exportHistory?.length && (
                <div className="export-history-table">
                  <strong>Export history</strong>
                  {cv.exportHistory.slice(-4).reverse().map((item) => (
                    <div key={`${item.exportedAt}-${item.fileName}`}>
                      <span>{new Date(item.exportedAt).toLocaleString()}</span>
                      <span>{item.fileName}</span>
                      <span>{item.qualityScore || "No score"}</span>
                      <span>{item.cvContentHash || "No snapshot hash"}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="export-action-panel">
                <div>
                  <strong>{needsFitReview ? "Fit Review required before final PDF" : cvIsStale ? "Regenerate after JD changes" : qualityReady ? "Final PDF is ready" : "Fix CV checks before export"}</strong>
                  <p>{needsFitReview ? "Run Fit Review first so this CV has a validated positioning strategy. Formal export is locked until then." : cvIsStale ? "The JD snapshot changed after this CV was generated. Rebuild or save a fresh version before export." : qualityReady ? "Save edits, then use the final PDF button. After applying, fill the application log so follow-up is trackable." : "Fix warnings above before marking this CV ready."}</p>
                </div>
                <button className="primary" onClick={printCvPdf} disabled={!canExportFinal}>
                  <FileDown size={16} /> Final action: Print / Save PDF
                </button>
              </div>
              {pendingExport && (
                <div className="export-confirm-panel">
                  <div>
                    <strong>Did you save the PDF?</strong>
                    <p>Only confirm after the print dialog saved <code>{pendingExport.fileName}</code>. Cancel if you closed the dialog or need to reprint.</p>
                  </div>
                  <div className="export-confirm-actions">
                    <button className="primary small" onClick={confirmExportRecorded}>Confirm export saved</button>
                    <button className="secondary small" onClick={() => {
                      setPendingExport(null);
                      setMessage("Export was not recorded. Use Final action again when ready.");
                    }}>Cancel record</button>
                  </div>
                </div>
              )}
              {!!cv.exportHistory?.length && (
                <p className="export-history">Last export: {new Date(cv.exportHistory[cv.exportHistory.length - 1].exportedAt).toLocaleString()} · {cv.exportHistory[cv.exportHistory.length - 1].fileName}</p>
              )}
              {job && onUpdateJob && (
                <ApplicationLogPanel
                  job={job}
                  onChange={(applicationLog) => onUpdateJob({ applicationLog })}
                  applicationLog={applicationLog}
                />
              )}
            </section>
          )}
          <div className="cv-print-target" aria-hidden="true">
            <CvPreview sections={sections} profile={data.careerProfile} job={job} />
          </div>
        </>
      )}
    </PageHeader>
  );
}

export function ApplicationLogPanel({
  job,
  applicationLog,
  onChange
}: {
  job: JobApplication;
  applicationLog: NonNullable<JobApplication["applicationLog"]>;
  onChange: (log: NonNullable<JobApplication["applicationLog"]>) => void;
}) {
  const update = (patch: Partial<NonNullable<JobApplication["applicationLog"]>>) => onChange({ ...applicationLog, ...patch });
  return (
    <section className="application-log-panel">
      <div>
        <strong>After applying: record application log</strong>
        <p>{job.role} · {job.company} · save where and when this CV was submitted.</p>
      </div>
      <div className="application-log-grid">
        <Field label="Apply date" value={applicationLog.appliedAt || ""} onChange={(value) => update({ appliedAt: value })} />
        <Field label="Platform" value={applicationLog.platform || ""} onChange={(value) => update({ platform: value })} />
        <Field label="Contact / recruiter" value={applicationLog.contact || ""} onChange={(value) => update({ contact: value })} />
        <Field label="Follow-up date" value={applicationLog.followUpDate || ""} onChange={(value) => update({ followUpDate: value })} />
        <Textarea label="Notes" value={applicationLog.notes || ""} onChange={(value) => update({ notes: value })} rows={3} />
        <Textarea label="Salary / seniority strategy" value={applicationLog.salaryStrategy || job.fitReview?.targetCompensationStrategy || ""} onChange={(value) => update({ salaryStrategy: value })} rows={3} />
      </div>
    </section>
  );
}
