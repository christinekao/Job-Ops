import { Download } from "lucide-react";
import { Component, Suspense, lazy, useEffect, useRef, useState, type ReactNode } from "react";
import { defaultData } from "./sampleData";
import { discardUnsyncedRecoverySnapshot, exportData, getUnsyncedRecoverySnapshot, loadData, saveData, saveLocalData, type UnsyncedRecoverySnapshot } from "./storage";
import type { AppData, CvVersion, JobApplication } from "./types";
import type { TabId } from "./config/nav";
import { navSections } from "./config/nav";
import { WorkspaceInspector } from "./components/shared/WorkspaceInspector";
import { SelectedContext } from "./components/shared/CvStatusComponents";
import { sortCvVersions } from "./utils/ids";
import { computeJobContentHash, deriveJobCvPipelineStatus, initializeJob, reconcileJobsWithScreeningWorkflow } from "./data/jobs";
import { applyBackboneMutation, bootstrapProfileSourceManifest, reconcileJobsWithBackbone } from "./data/backbone";
import { reconcileReviewSnapshotIdentity } from "./domain/screeningReview";

const PromptCenter = lazy(() => import("./components/tabs/PromptCenter").then((module) => ({ default: module.PromptCenter })));
const Analytics = lazy(() => import("./components/tabs/Analytics").then((module) => ({ default: module.Analytics })));
const FlowMap = lazy(() => import("./components/tabs/FlowMap").then((module) => ({ default: module.FlowMap })));
const CareerSourceBuilder = lazy(() => import("./components/tabs/CareerSource").then((module) => ({ default: module.CareerSourceBuilder })));
const JDTailoringWorkspace = lazy(() => import("./components/tabs/JDTailoring").then((module) => ({ default: module.JDTailoringWorkspace })));
const CVBuilderWorkspace = lazy(() => import("./components/tabs/CVBuilder").then((module) => ({ default: module.CVBuilderWorkspace })));
const Inbox = lazy(() => import("./components/tabs/Inbox").then((module) => ({ default: module.Inbox })));
const JDIntake = lazy(() => import("./components/tabs/JDIntake").then((module) => ({ default: module.JDIntake })));
const JDWorkspace = lazy(() => import("./components/tabs/JDWorkspace").then((module) => ({ default: module.JDWorkspace })));
const CVStudio = lazy(() => import("./components/cv/CVStudio").then((module) => ({ default: module.CVStudio })));
const CVEditorExportPage = lazy(() => import("./components/cv/CVStudio").then((module) => ({ default: module.CVEditorExportPage })));
const ExportPage = lazy(() => import("./components/tabs/Export").then((module) => ({ default: module.ExportPage })));
const RecruiterBank = lazy(() => import("./components/tabs/RecruiterBank").then((module) => ({ default: module.RecruiterBank })));
const SourceIntake = lazy(() => import("./components/tabs/SourceIntake").then((module) => ({ default: module.SourceIntake })));
const SourceTruth = lazy(() => import("./components/tabs/SourceTruth").then((module) => ({ default: module.SourceTruth })));
const SkillMap = lazy(() => import("./components/tabs/SkillMap").then((module) => ({ default: module.SkillMap })));
const EvidenceBank = lazy(() => import("./components/tabs/EvidenceBank").then((module) => ({ default: module.EvidenceBank })));
const StarBank = lazy(() => import("./components/tabs/StarBank").then((module) => ({ default: module.StarBank })));
const ScreeningLab = lazy(() => import("./components/tabs/ScreeningLab").then((module) => ({ default: module.ScreeningLab })));
const ProductAcceptanceFixtureApp = lazy(() => import("./components/test/ProductAcceptanceFixtureApp").then((module) => ({ default: module.ProductAcceptanceFixtureApp })));

const SELECTED_JOB_STORAGE_KEY = "christine-cv-manager-selected-job";
const SELECTED_CV_STORAGE_KEY = "christine-cv-manager-selected-cvs";

function readLocalPreference(key: string) {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function writeLocalPreference(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Preferences are optional. Server-backed app data must remain usable without browser storage.
  }
}

type WorkspaceErrorState = {
  error: Error | null;
  resetKey: string;
};

class WorkspaceErrorBoundary extends Component<
  { children: ReactNode; onRecover: () => void; resetKey: string },
  WorkspaceErrorState
> {
  state: WorkspaceErrorState = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  static getDerivedStateFromProps(
    props: { resetKey: string },
    state: WorkspaceErrorState
  ) {
    if (props.resetKey !== state.resetKey) {
      return { error: null, resetKey: props.resetKey };
    }
    return null;
  }

  render() {
    if (this.state.error) {
      return (
        <section className="panel workspace-error-panel" role="alert">
          <span className="eyebrow">Workspace crashed</span>
          <h2>This page failed to render.</h2>
          <p>{this.state.error.message || "Unknown render error."}</p>
          <button className="primary" onClick={this.props.onRecover}>Back to Opportunities</button>
        </section>
      );
    }
    return this.props.children;
  }
}

function CareerOsApp() {
  const [data, setData] = useState<AppData>(defaultData);
  const [activeTab, setActiveTab] = useState<TabId>("inbox");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [selectedCvIdByJob, setSelectedCvIdByJob] = useState<Record<string, string>>({});
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [saveError, setSaveError] = useState("");
  const [unsyncedRecovery, setUnsyncedRecovery] = useState<UnsyncedRecoverySnapshot | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const pendingSaveRef = useRef<AppData | null>(null);
  const saveInProgressRef = useRef(false);
  const persistenceWaitersRef = useRef<Array<{
    matches: (snapshot: AppData) => boolean;
    resolve: () => void;
    reject: (error: Error) => void;
  }>>([]);

  function waitForPersistence(matches: (snapshot: AppData) => boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      persistenceWaitersRef.current.push({ matches, resolve, reject });
    });
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const loaded = await loadData();
        if (!active) return;
      const recovery = getUnsyncedRecoverySnapshot();
      const reconciled = reconcileJobsWithScreeningWorkflow(
        bootstrapProfileSourceManifest(reconcileJobsWithBackbone(loaded))
      );
      const storedJobId = readLocalPreference(SELECTED_JOB_STORAGE_KEY);
      const nextJobId = reconciled.jobs.some((job) => job.id === storedJobId)
        ? storedJobId
        : reconciled.jobs[0]?.id || "";
      let storedCvSelections: Record<string, string> = {};
      try {
        storedCvSelections = JSON.parse(readLocalPreference(SELECTED_CV_STORAGE_KEY) || "{}") as Record<string, string>;
      } catch {
        storedCvSelections = {};
      }
      const cvIdsByJob = new Map(reconciled.jobs.map((job) => [job.id, new Set(reconciled.cvVersions.filter((version) => version.jdId === job.id).map((version) => version.id))]));
      setData(reconciled);
      setSelectedJobId(nextJobId);
      setSelectedCvIdByJob(Object.fromEntries(
        Object.entries(storedCvSelections).filter(([jobId, cvId]) => cvIdsByJob.get(jobId)?.has(cvId))
      ));
      setLoadError("");
      setUnsyncedRecovery(recovery);
      setDataLoaded(true);
      } catch (error) {
        if (!active) return;
        setLoadError(error instanceof Error ? error.message : "Project data could not be loaded.");
        setDataLoaded(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [loadAttempt]);

  useEffect(() => {
    if (!dataLoaded) return;
    saveLocalData(data);
    setSaveState("saving");
    pendingSaveRef.current = data;
    const flushLatest = async (): Promise<void> => {
      if (saveInProgressRef.current) return;
      saveInProgressRef.current = true;
      try {
        while (pendingSaveRef.current) {
          const snapshot = pendingSaveRef.current;
          pendingSaveRef.current = null;
          try {
            await saveData(snapshot);
          } catch (error) {
            const failure = error instanceof Error ? error : new Error("Save failed");
            const waiters = persistenceWaitersRef.current;
            persistenceWaitersRef.current = [];
            waiters.forEach((waiter) => waiter.reject(failure));
            setUnsyncedRecovery(getUnsyncedRecoverySnapshot());
            setSaveError(failure.message);
            setSaveState("error");
            pendingSaveRef.current = null;
            return;
          }
          const completed = persistenceWaitersRef.current.filter((waiter) => waiter.matches(snapshot));
          persistenceWaitersRef.current = persistenceWaitersRef.current.filter((waiter) => !waiter.matches(snapshot));
          completed.forEach((waiter) => waiter.resolve());
        }
        setSaveError("");
        setSaveState("saved");
      } finally {
        saveInProgressRef.current = false;
        if (pendingSaveRef.current) {
          setSaveState("saving");
          window.setTimeout(() => void flushLatest(), 0);
        }
      }
    };
    const timer = window.setTimeout(() => void flushLatest(), 650);
    return () => window.clearTimeout(timer);
  }, [data, dataLoaded]);

  useEffect(() => {
    if (!dataLoaded || !selectedJobId) return;
    writeLocalPreference(SELECTED_JOB_STORAGE_KEY, selectedJobId);
  }, [dataLoaded, selectedJobId]);

  useEffect(() => {
    if (!dataLoaded) return;
    writeLocalPreference(SELECTED_CV_STORAGE_KEY, JSON.stringify(selectedCvIdByJob));
  }, [dataLoaded, selectedCvIdByJob]);

  useEffect(() => {
    if (!dataLoaded) return;
    const job = data.jobs.find((item) => item.id === selectedJobId);
    if (!job && selectedJobId !== (data.jobs[0]?.id || "")) setSelectedJobId(data.jobs[0]?.id || "");
    setSelectedCvIdByJob((current) => Object.fromEntries(
      Object.entries(current).filter(([jobId, cvId]) => data.cvVersions.some((version) => version.jdId === jobId && version.id === cvId))
    ));
  }, [data, dataLoaded, selectedJobId]);

  useEffect(() => {
    if (activeTab === "setup") setActiveTab("inbox");
  }, [activeTab]);

  const selectedJob = data.jobs.find((job) => job.id === selectedJobId) || data.jobs[0];
  const selectedJobCvVersions = selectedJob
    ? sortCvVersions(data.cvVersions.filter((cv) => cv.jdId === selectedJob.id))
    : [];
  const selectedCv = selectedJob
    ? selectedJobCvVersions.find((cv) => cv.id === selectedCvIdByJob[selectedJob.id]) || selectedJobCvVersions[0]
    : undefined;

  function patchData(next: Partial<AppData>) {
    setData((current) => applyBackboneMutation(current, next));
  }

  function goToTab(tab: TabId) {
    setIsCreatingJob(false);
    setActiveTab(tab);
  }

  function updateJob(jobId: string, patch: Partial<JobApplication>) {
    setData((current) => {
      const existingJob = current.jobs.find((job) => job.id === jobId);
      if (!existingJob) return current;
      const candidate = { ...existingJob, ...patch };
      const nextJdContentHash = computeJobContentHash(candidate);
      const previousJdContentHash = existingJob.jdContentHash || computeJobContentHash(existingJob);
      const jdWasMateriallyChanged = previousJdContentHash !== nextJdContentHash;
      const protectedStatus = existingJob.status === "Applied" || existingJob.status === "Archived";
      if (jdWasMateriallyChanged && protectedStatus) {
        setSaveError("Applied or archived applications keep their original JD snapshot. Create a new opportunity to tailor a changed JD.");
        return current;
      }
      const updatedAt = new Date().toISOString();
      const updatedJob: JobApplication = jdWasMateriallyChanged
        ? {
            ...candidate,
            jdContentHash: nextJdContentHash,
            fit: "Unknown",
            fitReview: undefined,
            recommendationsAppliedAt: undefined,
            selectedSkillIds: [],
            selectedDomainKnowledgeIds: [],
            selectedEvidenceIds: [],
            selectedStoryIds: [],
            status: "Evidence Needed",
            nextAction: "JD content changed. Run Screening Analysis again before selecting evidence or generating a CV.",
            updatedAt
          }
        : { ...candidate, jdContentHash: nextJdContentHash, updatedAt };
      return {
        ...current,
        jobs: current.jobs.map((job) => job.id === jobId ? updatedJob : job),
        cvVersions: jdWasMateriallyChanged
          ? current.cvVersions.map((version) =>
              version.jdId === jobId && version.status !== "Exported"
                ? { ...version, status: "Editing", updatedAt }
                : version
            )
          : current.cvVersions
      };
    });
  }

  function createJob(input: JobApplication) {
    const job = initializeJob(input);
    setData((current) => {
      const duplicate = current.jobs.some((item) => item.id === job.id || (
        item.company === job.company && item.role === job.role && item.jdContentHash === job.jdContentHash
      ));
      if (duplicate) {
        setSaveError("This opportunity already exists. Open the existing Job instead of creating a duplicate.");
        return current;
      }
      return reconcileJobsWithBackbone({ ...current, jobs: [job, ...current.jobs] });
    });
    setSelectedJobId(job.id);
  }

  function saveCvVersion(version: CvVersion) {
    const safeVersion = reconcileReviewSnapshotIdentity(version);
    setData((current) => ({
      ...current,
      cvVersions: current.cvVersions.some((item) => item.id === safeVersion.id)
        ? current.cvVersions.map((item) => item.id === safeVersion.id ? safeVersion : item)
        : [safeVersion, ...current.cvVersions],
      jobs: current.jobs.map((job) => {
        if (job.id !== version.jdId) return job;
        const nextVersions = current.cvVersions.some((item) => item.id === safeVersion.id)
          ? current.cvVersions.map((item) => item.id === safeVersion.id ? safeVersion : item)
          : [safeVersion, ...current.cvVersions];
        const status = deriveJobCvPipelineStatus(job, nextVersions);
        const nextAction = status === "Reviewed"
          ? "Export final CV or record application details."
          : status === "Applied" || status === "Archived"
            ? job.nextAction
            : "Review CV and export.";
        return { ...job, status, nextAction, updatedAt: new Date().toISOString() };
      })
    }));
    setSelectedCvIdByJob((current) => ({ ...current, [version.jdId]: version.id }));
  }

  const cvFocusTabs: TabId[] = ["cv-builder", "cv-editor-export", "export"];

  const activeNavItem = navSections.flatMap((section) => section.items).find((item) => item.id === activeTab);
  const saveStatusText = !dataLoaded
    ? "Loading project data..."
    : saveState === "saving"
      ? "Saving changes..."
      : saveState === "saved"
        ? ""
        : saveState === "error"
          ? `Saved in this browser. Server sync failed: ${saveError}`
          : "";
  const shouldShowSaveStatus = !dataLoaded || saveState === "saving" || saveState === "error";
  const showGlobalContext = !["inbox", "career-source", "source-intake", "truth", "skill-map", "evidence", "star", "recruiter-bank"].includes(activeTab);

  if (loadError) {
    return <main className="workspace" id="main-content"><section className="panel workspace-error-panel" role="alert"><span className="eyebrow">Project data needs attention</span><h2>Workspace was not loaded.</h2><p>{loadError}</p><button className="primary" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>Retry load</button></section></main>;
  }

  return (
    <div className={cvFocusTabs.includes(activeTab) ? "app-shell v2-shell cv-focus-shell" : "app-shell v2-shell"}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <aside className="sidebar">
        <div className="brand career-os-brand">
          <span className="brand-mark">C/OS</span>
          <div>
            <span>Career OS</span>
            <strong>Interview First</strong>
          </div>
        </div>
        <nav className="nav-list v2-nav-list">
          {navSections.map((section) => (
            <div className="nav-section" key={section.label}>
              <div className="nav-section-title">
                <span>{section.label}</span>
                <small>{section.detail}</small>
              </div>
              {section.items.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    className={activeTab === tab.id ? "nav-item active" : "nav-item"}
                    onClick={() => goToTab(tab.id)}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">
          <p>Local data workspace. Codex automation only runs when you click it.</p>
          <button className="ghost export-btn" onClick={() => exportData(data)}>
            <Download size={16} /> Backup app data
          </button>
        </div>
      </aside>

      <main className="workspace" id="main-content" tabIndex={-1}>
        <div className="career-topbar">
          <div>
            <span className="eyebrow">CURRENT WORKSPACE</span>
            <h1>{activeNavItem?.label || "Workspace"}</h1>
          </div>
          <div
            className={shouldShowSaveStatus ? (saveState === "error" ? "save-status error" : "save-status") : "save-status idle"}
            role="status"
            aria-live="polite"
          >
            {saveStatusText}{saveState === "error" && <button className="ghost" onClick={() => { setSaveError(""); setData((current) => ({ ...current })); }}>Retry sync</button>}
            {unsyncedRecovery && <span className="save-recovery-actions">
              Unsynced recovery copy from {new Date(unsyncedRecovery.savedAt).toLocaleString()}.
              <button className="ghost" onClick={() => exportData(unsyncedRecovery.data, "christine-cv-manager-react-unsynced-recovery.json")}>Download recovery copy</button>
              <button className="ghost" onClick={() => { discardUnsyncedRecoverySnapshot(); setUnsyncedRecovery(null); }}>Discard recovery copy</button>
            </span>}
          </div>
        </div>
        <WorkspaceErrorBoundary
          resetKey={`${activeTab}:${selectedJob?.id || ""}:${selectedCv?.id || ""}`}
          onRecover={() => goToTab("inbox")}
        >
        {showGlobalContext && <SelectedContext data={data} job={selectedJob} />}
        <Suspense fallback={<section className="panel" role="status">Loading workspace...</section>}>
        {activeTab === "screening-lab" && (
          <ScreeningLab
            data={data}
            job={selectedJob}
            cv={selectedCv}
            onGo={goToTab}
            onCreateJob={(job) => {
              createJob(job);
            }}
            onUpdateJob={(patch) => selectedJob && updateJob(selectedJob.id, patch)}
            onSaveCv={saveCvVersion}
          />
        )}
        {activeTab === "career-source" && (
          <CareerSourceBuilder
            data={data}
            onRawSourcesChange={(rawSources) => patchData({ rawSources })}
            onTruthChange={(patch) => patchData(patch)}
            onSkillsChange={(skillInferences) => patchData({ skillInferences })}
            onDomainChange={(domainKnowledge) => patchData({ domainKnowledge })}
            onEvidenceChange={(evidenceCards) => patchData({ evidenceCards })}
            onStoriesChange={(starStories) => patchData({ starStories })}
            onTasksChange={(backboneTasks) => patchData({ backboneTasks })}
          />
        )}
        {activeTab === "inbox" && (
          <Inbox
            data={data}
            selectedJobId={selectedJob?.id || ""}
            onSelect={(id) => setSelectedJobId(id)}
            onOpen={(id) => {
              setSelectedJobId(id);
              goToTab("screening-lab");
            }}
            onNew={() => {
              setIsCreatingJob(true);
              setActiveTab("jd-intake");
            }}
            onStatus={(id, status) => updateJob(id, { status })}
          />
        )}
        {activeTab === "jd-tailoring" && (
          <JDTailoringWorkspace
            data={data}
            selectedJob={selectedJob}
            onUpdateJob={(patch) => selectedJob && updateJob(selectedJob.id, patch)}
            onSaveCv={saveCvVersion}
            onGo={goToTab}
          />
        )}
        {activeTab === "jd-intake" && (
          <JDIntake
            job={isCreatingJob ? undefined : selectedJob}
            onSave={async (job) => {
              const initialized = initializeJob(job);
              if (data.jobs.some((item) => item.id === initialized.id || (
                item.company === initialized.company
                && item.role === initialized.role
                && item.jdContentHash === initialized.jdContentHash
              ))) {
                throw new Error("This opportunity already exists. Open the existing Job instead of creating a duplicate.");
              }
              const persisted = waitForPersistence((snapshot) =>
                snapshot.jobs.some((item) => item.id === initialized.id && item.jdContentHash === initialized.jdContentHash)
              );
              createJob(job);
              await persisted;
              setIsCreatingJob(false);
            }}
            onUpdate={isCreatingJob ? undefined : async (patch) => {
              if (!selectedJob) throw new Error("The selected Job is unavailable. Reload the workspace and try again.");
              const candidate = { ...selectedJob, ...patch };
              const expectedHash = computeJobContentHash(candidate);
              const currentHash = selectedJob.jdContentHash || computeJobContentHash(selectedJob);
              if (expectedHash !== currentHash && (selectedJob.status === "Applied" || selectedJob.status === "Archived")) {
                throw new Error("Applied or archived applications keep their original JD snapshot. Create a new opportunity to tailor a changed JD.");
              }
              const persisted = waitForPersistence((snapshot) =>
                snapshot.jobs.some((item) => item.id === selectedJob.id && item.jdContentHash === expectedHash)
              );
              updateJob(selectedJob.id, patch);
              await persisted;
            }}
          />
        )}
        {activeTab === "source-intake" && (
          <SourceIntake
            sources={data.rawSources}
            onChange={(rawSources) => patchData({ rawSources })}
          />
        )}
        {activeTab === "truth" && (
          <SourceTruth
            data={data}
            onChange={(patch) => patchData(patch)}
          />
        )}
        {activeTab === "skill-map" && (
          <SkillMap
            data={data}
            onChange={(skillInferences) => patchData({ skillInferences })}
          />
        )}
        {activeTab === "evidence" && (
          <EvidenceBank
            data={data}
            onChange={(evidenceCards) => patchData({ evidenceCards })}
          />
        )}
        {activeTab === "star" && (
          <StarBank data={data} onChange={(starStories) => patchData({ starStories })} />
        )}
        {activeTab === "workspace" && selectedJob && (
          <JDWorkspace
            data={data}
            job={selectedJob}
            onUpdateJob={(patch) => updateJob(selectedJob.id, patch)}
            onSaveCv={saveCvVersion}
            onGo={goToTab}
          />
        )}
        {activeTab === "prompts" && <PromptCenter data={data} selectedJobId={selectedJob?.id || ""} />}
        {activeTab === "recruiter-bank" && (
          <RecruiterBank
            answers={data.recruiterAnswers}
            onChange={(recruiterAnswers) => patchData({ recruiterAnswers })}
          />
        )}
        {activeTab === "cv-builder" && (
          <CVBuilderWorkspace
            data={data}
            job={selectedJob}
            cv={selectedCv}
            cvVersions={selectedJobCvVersions}
            onGo={goToTab}
            onSelectCv={(cvId) =>
              selectedJob && setSelectedCvIdByJob((current) => ({ ...current, [selectedJob.id]: cvId }))
            }
            onSave={saveCvVersion}
            onUpdateJob={(patch) => selectedJob && updateJob(selectedJob.id, patch)}
          />
        )}
        {activeTab === "cv-studio" && selectedJob && (
          <CVStudio
            data={data}
            job={selectedJob}
            onSave={saveCvVersion}
          />
        )}
        {activeTab === "cv-editor-export" && (
          <CVEditorExportPage
            data={data}
            job={selectedJob}
            cv={selectedCv}
            onSave={saveCvVersion}
            onUpdateJob={(patch) => selectedJob && updateJob(selectedJob.id, patch)}
          />
        )}
        {activeTab === "export" && <ExportPage data={data} job={selectedJob} cv={selectedCv} onGo={goToTab} />}
        {activeTab === "analytics" && <Analytics data={data} />}
        {activeTab === "flow-map" && <FlowMap />}
        </Suspense>
        {showGlobalContext && (
          <details className="workspace-inspector-drawer">
            <summary>Show readiness checks</summary>
            <WorkspaceInspector
              activeTab={activeTab}
              data={data}
              job={selectedJob}
              cv={selectedCv}
            onGo={goToTab}
              onBackup={() => exportData(data)}
            />
          </details>
        )}
        </WorkspaceErrorBoundary>
      </main>
    </div>
  );
}



function App() {
  const fixtureMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("e2e") === "product-acceptance";
  return fixtureMode
    ? <Suspense fallback={<div>Loading deterministic product acceptance fixture...</div>}><ProductAcceptanceFixtureApp /></Suspense>
    : <CareerOsApp />;
}

export default App;
