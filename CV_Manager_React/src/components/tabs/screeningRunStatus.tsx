import type { AutomationJob, JobApplication } from "../../types";
import { isActiveAutomationRun, isDisconnectedAutomationRun } from "../../domain/screeningReview";

type RunRecord = JobApplication["screeningAnalysisRun"] | JobApplication["screeningCvRun"];

export function formatRunAt(value: string | undefined) {
  if (!value) return "Never run";
  return new Date(value).toLocaleString();
}

export function StepCompletedAt({ value, label = "Last completed" }: { value?: string; label?: string }) {
  return <small className="step-completed-at">{label}: {formatRunAt(value)}</small>;
}

export function AiActionTimestamp({
  run,
  label = "Last completed"
}: {
  run: RunRecord | undefined;
  label?: string;
}) {
  const tokenNote = run?.estimatedInputTokens ? ` · est. ${run.estimatedInputTokens.toLocaleString()} input tokens` : "";
  return (
    <small className="ai-action-timestamp">
      {label}: {run?.lastCompletedAt ? formatRunAt(run.lastCompletedAt) : "Never completed"}{tokenNote}
    </small>
  );
}

export function formatElapsed(value: string | undefined) {
  if (!value) return "0s";
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  return minutes ? `${minutes}m ${seconds.toString().padStart(2, "0")}s` : `${seconds}s`;
}

export function renderRunState(
  run: RunRecord,
  needsRerun: boolean,
  activeRun: AutomationJob<unknown> | null,
  starting = false
) {
  if (!run) return "Never run";
  const tokenNote = run.estimatedInputTokens ? ` · est. ${run.estimatedInputTokens.toLocaleString()} input tokens` : "";
  if (starting) return `Starting Codex CLI · Last run ${formatRunAt(run.lastRunAt)}`;
  if ((run.status === "queued" || run.status === "running") && isActiveAutomationRun(activeRun)) {
    return `${run.status === "queued" ? "Queued" : "Running"} · elapsed ${formatElapsed(run.lastRunAt || activeRun?.startedAt || activeRun?.createdAt)} · Last run ${formatRunAt(run.lastRunAt)}${tokenNote}`;
  }
  if ((run.status === "queued" || run.status === "running") && !isActiveAutomationRun(activeRun)) {
    return `Status unknown · elapsed ${formatElapsed(run.lastRunAt)} · Last run ${formatRunAt(run.lastRunAt)} · Check or re-run only if needed`;
  }
  if (needsRerun) return `Needs rerun · Last run ${formatRunAt(run.lastRunAt)}`;
  if (run.status === "failed") return `Failed · Last run ${formatRunAt(run.lastRunAt)}${tokenNote}${run.lastError ? ` · ${run.lastError}` : ""}`;
  return `${run.status} · Last run ${formatRunAt(run.lastRunAt)}${tokenNote}`;
}

export function AutomationStatusCard({
  label,
  run,
  activeRun,
  starting,
  needsRerun,
  clockTick
}: {
  label: string;
  run: RunRecord;
  activeRun: AutomationJob<unknown> | null;
  starting: boolean;
  needsRerun: boolean;
  clockTick: number;
}) {
  if (!run) return null;
  void clockTick;
  const runRecordActive = run.status === "queued" || run.status === "running";
  const activelyPolling = starting || (runRecordActive && isActiveAutomationRun(activeRun));
  const interrupted = isDisconnectedAutomationRun(run, activeRun, starting);
  const failed = run.status === "failed";
  const completed = run.status === "completed" && !needsRerun;
  const showProgress = runRecordActive;
  const className = [
    "automation-status-card",
    activelyPolling ? "active" : "",
    interrupted ? "unknown" : "",
    failed ? "failed" : "",
    completed ? "done" : ""
  ].filter(Boolean).join(" ");
  const title = activelyPolling
    ? `${label} is running`
    : interrupted
      ? `${label} status unknown`
      : failed
        ? `${label} failed`
        : completed
          ? `${label} completed`
          : needsRerun
            ? `${label} needs rerun`
            : `${label} status`;
  const detail = activelyPolling
    ? "Codex CLI is still working. This can take several minutes for large prompts; the progress bar means the browser is still polling."
    : interrupted
      ? "This run was recorded as queued/running, but this browser no longer has an active job connection. It may still be running in another server session; check again before rerunning."
      : failed
        ? run.lastError || "Codex CLI returned an error."
        : completed
          ? "Output was applied and saved to this workspace."
          : needsRerun
            ? "Inputs changed after the last run."
            : renderRunState(run, needsRerun, activeRun, starting);
  return (
    <div className={className} role="status" aria-live="polite">
      <strong>{title}</strong>
      <span>{detail}</span>
      {showProgress ? (
        <>
          <div className={`automation-progress${interrupted ? " unknown" : ""}`} aria-label={`${label} ${interrupted ? "status unknown" : "running"}`}>
            <span />
          </div>
          <div className="automation-progress-meta">
            <span>Elapsed {formatElapsed(run.lastRunAt || activeRun?.startedAt || activeRun?.createdAt)}</span>
            <span>{activelyPolling ? "Polling every 1.5s" : "No active browser connection"}</span>
            {run.estimatedInputTokens ? <span>{run.estimatedInputTokens.toLocaleString()} estimated input tokens</span> : null}
          </div>
        </>
      ) : null}
      <small>{renderRunState(run, needsRerun, activeRun, starting)}</small>
    </div>
  );
}

export function ReviewerRunStatusBanner({
  run,
  blockerCount,
  cvNeedsRerun,
  cvRun,
  cvStarting
}: {
  run: JobApplication["screeningCvRun"] | undefined;
  blockerCount: number;
  cvNeedsRerun: boolean;
  cvRun: AutomationJob<unknown> | null;
  cvStarting: boolean;
}) {
  if (!run) {
    return (
      <div className="reviewer-run-banner idle">
        <strong>No CV patch run recorded</strong>
        <span>Run or paste a Screening CV before using the final reviewer/export check.</span>
      </div>
    );
  }
  if (run.status === "completed") {
    return (
      <div className={blockerCount ? "reviewer-run-banner warn" : "reviewer-run-banner done"}>
        <strong>Last CV run completed and saved</strong>
        <span>
          Completed {formatRunAt(run.lastCompletedAt || run.lastRunAt)} · {run.applied ? "CV data was applied" : "No CV data was applied"} · {blockerCount ? `${blockerCount} reviewer/export blocker(s) remain` : "Reviewer/export checks passed"}
        </span>
      </div>
    );
  }
  if (run.status === "queued" || run.status === "running") {
    return (
      <div className="reviewer-run-banner running">
        <strong>CV patch is still running</strong>
        <span>{renderRunState(run, cvNeedsRerun, cvRun, cvStarting)}</span>
      </div>
    );
  }
  if (run.status === "failed") {
    return (
      <div className="reviewer-run-banner failed">
        <strong>Last CV run failed or was cleared</strong>
        <span>{run.lastError || "No CV data was applied."}</span>
      </div>
    );
  }
  return (
    <div className="reviewer-run-banner idle">
      <strong>CV run status: {run.status}</strong>
      <span>{renderRunState(run, cvNeedsRerun, cvRun, cvStarting)}</span>
    </div>
  );
}
