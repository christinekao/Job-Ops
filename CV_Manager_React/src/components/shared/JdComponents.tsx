import type { AppData, JobApplication } from "../../types";
import type { TabId } from "../../config/nav";

export function MiniList({ title, items }: { title: string; items?: string[] }) {
  const visible = (items || []).filter(Boolean).slice(0, 4);
  if (!visible.length) return null;
  return (
    <div className="mini-list">
      <span>{title}</span>
      <ul>
        {visible.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}
      </ul>
    </div>
  );
}

export function PositioningStrategyCard({ job }: { job: JobApplication }) {
  const review = job.fitReview;
  return (
    <section className="strategy-card">
      <div className="strategy-head">
        <span className={`fit fit-${job.fit.toLowerCase()}`}>{job.fit} fit</span>
        <strong>Why this CV can win</strong>
      </div>
      {review ? (
        <>
          <MiniList title="Employer signals" items={review.employerSignals} />
          <MiniList title="Strong matches" items={review.strongMatches} />
          <MiniList title="Gaps / risks" items={review.gaps} />
          {review.positioningAdvice && (
            <p className="strategy-note"><strong>Positioning:</strong> {review.positioningAdvice}</p>
          )}
          {review.targetCompensationStrategy && (
            <p className="strategy-note"><strong>Value strategy:</strong> {review.targetCompensationStrategy}</p>
          )}
        </>
      ) : (
        <p className="muted-note">Run Fit Review first. Define the CV strategy before selecting evidence or generating a tailored version.</p>
      )}
    </section>
  );
}

export function FitReviewReport({ job }: { job: JobApplication }) {
  const review = job.fitReview;
  if (!review) {
    return (
      <section className="panel fit-report empty-fit-report">
        <div className="fit-report-head">
          <span className={`fit fit-${job.fit.toLowerCase()}`}>{job.fit} fit</span>
          <div>
            <h3>Fit Review Report</h3>
            <p>Paste and apply the Fit Review JSON to create a strategy report for this JD.</p>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="panel fit-report">
      <div className="fit-report-head">
        <span className={`fit fit-${job.fit.toLowerCase()}`}>{job.fit} fit</span>
        <div>
          <h3>Fit Review Report</h3>
          <p>{review.recommendedNextAction || job.nextAction || "Review evidence and build the tailored CV."}</p>
        </div>
      </div>
      <div className="fit-report-grid">
        <MiniList title="Top hiring signals" items={review.employerSignals?.slice(0, 5)} />
        <MiniList title="Strongest matches" items={review.strongMatches?.slice(0, 3)} />
        <MiniList title="Top risks" items={review.gaps?.slice(0, 3)} />
      </div>
      <div className="fit-report-strategy">
        <div>
          <span>Positioning strategy</span>
          <p>{review.positioningAdvice || "No positioning advice yet."}</p>
        </div>
        <div>
          <span>Value / seniority strategy</span>
          <p>{review.targetCompensationStrategy || "No seniority strategy yet."}</p>
        </div>
      </div>
    </section>
  );
}

export function FitRecommendationPanel({
  data,
  job,
  applied,
  onApply,
  onClear,
  onGo
}: {
  data: AppData;
  job: JobApplication;
  applied: boolean;
  onApply: () => void;
  onClear: () => void;
  onGo?: (tab: TabId) => void;
}) {
  const recommendationSource = job.screeningAnalysis || job.fitReview;
  if (!recommendationSource) return null;
  const skills = data.skillInferences.filter((item) => recommendationSource.recommendedSkillIds?.includes(item.id));
  const domains = data.domainKnowledge.filter((item) => recommendationSource.recommendedDomainKnowledgeIds?.includes(item.id));
  const evidence = data.evidenceCards.filter((item) => recommendationSource.recommendedEvidenceIds?.includes(item.id));
  const stories = data.starStories.filter((item) => recommendationSource.recommendedStoryIds?.includes(item.id));
  const total = skills.length + domains.length + evidence.length + stories.length;
  const cappedRecommendationTotal = Math.min(skills.length, 15) + Math.min(domains.length, 8) + Math.min(evidence.length, 15) + Math.min(stories.length, 6);
  const currentSelectionTotal = (job.selectedSkillIds || []).length
    + (job.selectedDomainKnowledgeIds || []).length
    + job.selectedEvidenceIds.length
    + job.selectedStoryIds.length;
  const selectedSummary = [
    `${(job.selectedSkillIds || []).length} skills`,
    `${(job.selectedDomainKnowledgeIds || []).length} domain/process signals`,
    `${job.selectedEvidenceIds.length} evidence`,
    `${job.selectedStoryIds.length} STAR`
  ].join(" · ");
  if (!total) return (
    <section className="panel fit-recommendations">
      <div className="panel-head">
        <h3>Recommended Selections</h3>
        <span className="section-note">No ID-based recommendations yet.</span>
      </div>
      <p>Run Fit Review again with the latest prompt to get recommended skill, domain, evidence, and STAR IDs.</p>
    </section>
  );
  return (
    <section className="panel fit-recommendations">
      <div className="panel-head">
        <div>
          <h3>Recommended Selections</h3>
          <p>{job.screeningAnalysis ? "Screening Analysis recommended these picks for this JD. Apply them, then generate the Screening CV." : "Use these as the default picks for this JD, then adjust manually below."}</p>
        </div>
        <div className="panel-actions">
          {currentSelectionTotal > 0 && <button className="secondary" onClick={onClear}>Clear current selections</button>}
          {applied ? <span className="pill">Recommendations applied</span> : (
            <button className="primary" onClick={onApply}>
              {currentSelectionTotal > cappedRecommendationTotal ? `Replace with ${cappedRecommendationTotal} recommendations` : "Apply recommended selections"}
            </button>
          )}
        </div>
      </div>
      {currentSelectionTotal > 44 && (
        <div className="save-status error">
          {currentSelectionTotal} items are currently selected. That is too broad for one targeted CV. Apply recommendations to replace them with a focused shortlist.
        </div>
      )}
      <div className="recommendation-grid">
        <MiniList title={`Skills (${skills.length})`} items={skills.map((item) => item.skill)} />
        <MiniList title={`Domain / process / KPI (${domains.length})`} items={domains.map((item) => item.businessProcess || item.domain)} />
        <MiniList title={`Evidence (${evidence.length})`} items={evidence.map((item) => item.title)} />
        <MiniList title={`STAR (${stories.length})`} items={stories.map((item) => item.title)} />
      </div>
      <div className="next-step-panel">
        <strong>{applied ? "Selections applied" : "Next step after applying"}</strong>
        <p>{applied ? "Recommended picks are now attached to this JD. Review weak picks if needed, then generate the tailored CV version." : "Apply the recommended picks, then move to CV Builder to generate the tailored CV for this JD."}</p>
        <span>Current selections: {selectedSummary}</span>
        <div className="next-step-actions">
          <button className="primary small" type="button" onClick={() => onGo?.("cv-builder")}>
            Generate CV version
          </button>
          <button className="secondary small" type="button" onClick={() => onGo?.("cv-editor-export")}>
            Edit / Export saved CV
          </button>
        </div>
      </div>
    </section>
  );
}

export function ParsedJDTable({ job }: { job: JobApplication }) {
  const parsed = job.parsed;
  if (!parsed) {
    return <p>{job.rawJD || "No parsed JD yet."}</p>;
  }
  const rows = [
    ["Company", parsed.company],
    ["Role", parsed.role],
    ["Location", parsed.location],
    ["Type", parsed.employmentType],
    ["Seniority", parsed.seniority],
    ["Responsibilities", parsed.responsibilities?.join("\n")],
    ["Requirements", parsed.requirements.join("\n")],
    ["Preferred", parsed.preferredQualifications?.join("\n")],
    ["Keywords", parsed.keywords.join(", ")],
    ["Employer signal", parsed.employerSignal],
    ["Risks", parsed.risks.join("\n")],
    ["Fit notes", parsed.fitNotes],
    ["Source URL", parsed.sourceUrl]
  ].filter(([, value]) => value);
  return (
    <table className="jd-table">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <th>{label}</th>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function GroupedSelectionBlock({
  title,
  groups,
  selectedIds,
  onToggle,
  onSetGroup
}: {
  title: string;
  groups: { id: string; label: string; items: { id: string; title: string; proof?: string }[] }[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onSetGroup: (ids: string[], checked: boolean) => void;
}) {
  const allIds = groups.flatMap((group) => group.items.map((item) => item.id));
  const allChecked = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));
  return (
    <section className="panel selection-block">
      <div className="panel-head">
        <h3>{title}</h3>
        <div className="select-actions">
          <button className="secondary" onClick={() => onSetGroup(allIds, !allChecked)}>
            {allChecked ? "Clear all" : "Select all"}
          </button>
        </div>
      </div>
      {groups.length === 0 && <p>No items available yet.</p>}
      {groups.map((group) => {
        const ids = group.items.map((item) => item.id);
        const groupChecked = ids.length > 0 && ids.every((id) => selectedIds.includes(id));
        return (
          <div className="selection-group" key={group.id}>
            <div className="selection-group-head">
              <strong>{group.label}</strong>
              <button className="secondary" onClick={() => onSetGroup(ids, !groupChecked)}>
                {groupChecked ? "Clear group" : "Select group"}
              </button>
            </div>
            {group.items.map((item) => (
              <label key={item.id} className="select-row">
                <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => onToggle(item.id)} />
                <span><strong>{item.title}</strong><small>{item.proof}</small></span>
              </label>
            ))}
          </div>
        );
      })}
    </section>
  );
}

export function SelectionBlock({
  title,
  items,
  selectedIds,
  onToggle
}: {
  title: string;
  items: { id: string; title: string; proof?: string }[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <section className="panel selection-block">
      <h3>{title}</h3>
      {items.map((item) => (
        <label key={item.id} className="select-row">
          <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => onToggle(item.id)} />
          <span><strong>{item.title}</strong><small>{item.proof}</small></span>
        </label>
      ))}
    </section>
  );
}
