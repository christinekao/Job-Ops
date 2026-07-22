import type { AppData, CvVersion, JobApplication } from "../../types";
import type { TabId } from "../../config/nav";
import { navSections } from "../../config/nav";
import { setupProgress } from "../../data/setup";
import { selectionDiagnostics } from "../../data/selection";

export function WorkspaceInspector({
  activeTab,
  data,
  job,
  cv,
  onGo,
  onBackup
}: {
  activeTab: TabId;
  data: AppData;
  job?: JobApplication;
  cv?: CvVersion;
  onGo: (tab: TabId) => void;
  onBackup: () => void;
}) {
  const progress = setupProgress(data);
  const fitLevel = job?.fit || "Unknown";
  const diagnostics = job ? selectionDiagnostics(data, job) : undefined;
  const selectedEvidence = diagnostics?.selectedEvidence.length || 0;
  const selectedStories = diagnostics?.selectedStarStories.length || 0;
  const selectedSkills = diagnostics?.selectedSkills.length || 0;
  const selectedDomains = diagnostics?.selectedDomainKnowledge.length || 0;
  const staleSelections = diagnostics
    ? diagnostics.invalidSkillIds.length
      + diagnostics.invalidDomainKnowledgeIds.length
      + diagnostics.invalidEvidenceIds.length
      + diagnostics.invalidStoryIds.length
    : 0;
  const sectionTab: TabId = ["jd-tailoring", "jd-intake", "workspace"].includes(activeTab)
    ? "inbox"
    : ["cv-studio", "cv-editor-export", "export"].includes(activeTab)
      ? "cv-builder"
      : ["source-intake", "truth", "skill-map", "evidence", "star"].includes(activeTab)
        ? "career-source"
        : activeTab;
  const activeSection = navSections.find((section) => section.items.some((item) => item.id === sectionTab));
  const missingFit = job && fitLevel === "Unknown";

  const healthItems = [
    ["Raw sources", data.rawSources.length],
    ["Source facts", data.careerProfile.workExperiences.length || Number(progress.hasTruth)],
    ["Skills", data.skillInferences.length],
    ["Domain", data.domainKnowledge.length],
    ["Evidence", data.evidenceCards.length],
    ["STAR", data.starStories.length],
    ["Jobs", data.jobs.length],
    ["CV versions", data.cvVersions.length]
  ];

  return (
    <div className="inspector-stack">
      <section className="inspector-card">
        <span className="rail-eyebrow">Current workspace</span>
        <h2>{activeSection?.label || "Workspace"}</h2>
        <p>{activeSection?.detail || "Choose a task from the left navigation."}</p>
      </section>

      <section className="inspector-card">
        <span className="rail-eyebrow">Selected JD</span>
        <h3>{job?.parsed?.role || job?.role || "No JD selected"}</h3>
        <dl className="rail-facts">
          <div>
            <dt>Company</dt>
            <dd>{job?.parsed?.company || job?.company || "Add or select a job"}</dd>
          </div>
          <div>
            <dt>Fit</dt>
            <dd className={missingFit ? "rail-warning" : ""}>{fitLevel}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{job?.status || "No job"}</dd>
          </div>
        </dl>
        {missingFit && (
          <button className="rail-action warning" onClick={() => onGo("jd-tailoring")}>
            Run Fit Review first
          </button>
        )}
      </section>

      <section className="inspector-card">
        <span className="rail-eyebrow">Selection depth</span>
        <div className="selection-meter">
          <strong>{selectedSkills + selectedDomains + selectedEvidence + selectedStories}</strong>
          <span>valid items selected for this JD</span>
        </div>
        <dl className="rail-facts compact">
          <div>
            <dt>Skills</dt>
            <dd>{selectedSkills}</dd>
          </div>
          <div>
            <dt>Domain</dt>
            <dd>{selectedDomains}</dd>
          </div>
          <div>
            <dt>Evidence</dt>
            <dd>{selectedEvidence}</dd>
          </div>
          <div>
            <dt>STAR</dt>
            <dd>{selectedStories}</dd>
          </div>
        </dl>
        {staleSelections > 0 && <p className="rail-warning">{staleSelections} stale selections need cleanup after Career Evidence sync.</p>}
        <button className="rail-action" onClick={() => onGo("workspace")}>
          {staleSelections ? "Clean / review selections" : "Review selected evidence"}
        </button>
      </section>

      <section className="inspector-card">
        <span className="rail-eyebrow">CV output</span>
        <h3>{cv?.name || "No active CV version"}</h3>
        <p>{cv?.status || "Generate a structured CV JSON before export."}</p>
        <button className="rail-action" onClick={() => onGo("cv-builder")}>
          Open CV Studio
        </button>
      </section>

      <section className="inspector-card">
        <span className="rail-eyebrow">Backbone inventory</span>
        <div className="inventory-list">
          {healthItems.map(([label, count]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
        <button className="rail-action ghost" onClick={onBackup}>
          Export local backup
        </button>
      </section>
    </div>
  );
}
