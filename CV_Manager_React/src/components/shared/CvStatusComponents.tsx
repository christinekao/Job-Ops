import type { AppData, CvVersion, JobApplication } from "../../types";
import type { TabId } from "../../config/nav";
import { cvInputReadiness, isCvStaleForJob } from "../../data/selection";
import { setupProgress, nextSetupAction } from "../../data/setup";
import { cvQualityChecks } from "../cv/utils";
import { tailoredCvFromVersion } from "../cv/utils";

export function CvInputReadinessPanel({
  data,
  job,
  onGo
}: {
  data: AppData;
  job: JobApplication;
  onGo: (tab: TabId) => void;
}) {
  const readiness = cvInputReadiness(data, job);
  const hasDomainInventory = data.domainKnowledge.length > 0;
  const nextAction = !readiness.checks[0].ok
    ? "Run Fit Review"
    : !hasDomainInventory
      ? "Build Domain Map"
      : readiness.ready
        ? "Generate CV JSON"
        : "Improve selections";
  const targetTab: TabId = !readiness.checks[0].ok
    ? "jd-tailoring"
    : !hasDomainInventory
      ? "career-source"
      : "workspace";
  const handleNextAction = () => {
    if (!readiness.ready && hasDomainInventory && readiness.checks[0].ok) {
      sessionStorage.setItem("cv-manager-jd-subview", "recommendations");
    }
    onGo(targetTab);
  };
  return (
    <section className={readiness.ready ? "panel cv-readiness ready" : "panel cv-readiness warn"}>
      <div className="panel-head">
        <div>
          <h3>{readiness.ready ? "Ready to generate CV" : "JD-based evidence selection required"}</h3>
          <p>
            {readiness.ready
              ? "目前選材已足夠產出正式兩頁 CV。下一步才是 Generate Tailored CV JSON。"
              : "先根據這份 JD 套用推薦選材與 evidence / STAR；選材不足時不要先產 CV。"}
          </p>
        </div>
        <button className={readiness.ready ? "secondary" : "primary"} onClick={handleNextAction}>
          {nextAction}
        </button>
      </div>
      <div className="readiness-grid">
        {readiness.checks.map((check) => (
          <article key={check.label} className={check.ok ? "quality-item ok" : "quality-item warn"}>
            <strong>{check.label}</strong>
            <p>{check.value}</p>
            {!check.ok && <em>{check.action}</em>}
          </article>
        ))}
      </div>
      {!readiness.ready && (
        <p className="readiness-note">
          {hasDomainInventory
            ? "如果現在就產 CV，內容容易變薄、第二頁空、或只像 evidence 摘要。先補選 domain/process/stakeholder/KPI/skill/evidence/STAR，再產生會比較像正式投遞版本。"
            : "目前 Career Backbone 沒有 Domain Knowledge。先回 Builder 重新產生或修復 Domain Map，後面才有 domain/process/stakeholder/KPI 可勾選。"}
        </p>
      )}
    </section>
  );
}

export function CvWorkflowStepper({ job, cv, cvVersions }: { job: JobApplication; cv?: CvVersion; cvVersions: CvVersion[] }) {
  const steps = [
    { label: "Generate CV JSON", done: cvVersions.length > 0, detail: cvVersions.length ? `${cvVersions.length} version(s)` : "No version yet" },
    { label: "Review parsed structure", done: !!cv?.tailoredCv || !!cv?.sections, detail: cv?.tailoredCv ? "Structured Tailored CV" : "Needs saved version" },
    { label: "Edit final CV", done: !!cv && cv.status !== "Draft", detail: cv?.status || "Draft" },
    { label: "Export / apply log", done: !!cv?.exportedAt || job.status === "Applied", detail: cv?.exportedAt ? new Date(cv.exportedAt).toLocaleDateString() : job.status }
  ];
  return (
    <section className="panel cv-flow-stepper">
      {steps.map((step, index) => (
        <article className={step.done ? "done" : ""} key={step.label}>
          <span>{index + 1}</span>
          <strong>{step.label}</strong>
          <p>{step.detail}</p>
        </article>
      ))}
    </section>
  );
}

export function versionQualityScore(version: CvVersion, job: JobApplication, data: AppData) {
  const cv = tailoredCvFromVersion(version);
  if (!cv) return "No structure";
  const checks = cvQualityChecks(cv, job, data);
  return `${checks.filter((item) => item.ok).length}/${checks.length}`;
}

export function CvVersionHistoryTable({
  data,
  job,
  versions,
  selectedCvId,
  onSelectCv
}: {
  data: AppData;
  job: JobApplication;
  versions: CvVersion[];
  selectedCvId?: string;
  onSelectCv: (cvId: string) => void;
}) {
  if (!versions.length) return null;
  return (
    <section className="panel cv-version-history">
      <div className="panel-head">
        <h3>CV Version History</h3>
        <span>{versions.length} saved</span>
      </div>
      <div className="version-history-table">
        <div className="version-history-row head">
          <span>Version</span>
          <span>Status</span>
          <span>Updated</span>
          <span>Exported</span>
          <span>Quality</span>
          <span>Action</span>
        </div>
        {versions.map((version) => (
          <div className={version.id === selectedCvId ? "version-history-row selected" : "version-history-row"} key={version.id}>
            <strong>{version.name}</strong>
            <span>{isCvStaleForJob(version, job, data) ? "Stale - regenerate" : version.status}</span>
            <span>{new Date(version.updatedAt).toLocaleDateString()}</span>
            <span>{version.exportedAt ? new Date(version.exportedAt).toLocaleDateString() : "-"}</span>
            <span>{versionQualityScore(version, job, data)}</span>
            <button className="secondary small" onClick={() => onSelectCv(version.id)}>
              {version.id === selectedCvId ? "Selected" : "Open"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SelectedContext({ data, job }: { data: AppData; job?: JobApplication }) {
  const progress = setupProgress(data);
  if (!job) {
    return (
      <section className="context-bar empty-context">
        <div>
          <span>Working context</span>
          <strong>Career Data Setup</strong>
        </div>
        <div>
          <span>Source</span>
          <strong>{progress.hasRawSource ? "Raw source saved" : "Raw source needed"}</strong>
        </div>
        <div>
          <span>Domain</span>
          <strong>{progress.hasDomain ? `${data.domainKnowledge.length} items` : "Not built"}</strong>
        </div>
        <div>
          <span>Next action</span>
          <strong>{nextSetupAction(data)}</strong>
        </div>
      </section>
    );
  }

  return (
    <section className="context-bar">
      <div>
        <span>Selected JD</span>
        <strong>
          {job.role} · {job.company || "Company unknown"}
        </strong>
      </div>
      <div>
        <span>Status</span>
        <strong>{job.status}</strong>
      </div>
      <div>
        <span>Fit</span>
        <strong>{job.fit}</strong>
      </div>
      <div>
        <span>Next action</span>
        <strong>{job.nextAction}</strong>
      </div>
    </section>
  );
}
