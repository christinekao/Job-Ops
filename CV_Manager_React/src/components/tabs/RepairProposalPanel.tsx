import type { RepairProposal, RepairProposalStatus } from "../../domain/repairProposal.types";

export type RepairProposalDisplay = RepairProposal;
export type RepairProposalDisplayStatus = RepairProposalStatus;

export function RepairProposalPanel({
  proposal,
  status,
  onAccept,
  onReject,
  onEditManually,
  stale
}: {
  proposal: RepairProposal;
  status: RepairProposalStatus;
  onAccept: () => void;
  onReject: () => void;
  onEditManually: () => void;
  stale?: boolean;
}) {
  return (
    <section className="repair-proposal-panel" aria-label="AI repair proposal">
      <div className="repair-proposal-head">
        <span className="eyebrow">AI Repair Proposal</span>
        <strong>{proposal.affectedSection}</strong>
        <span className={`proposal-status ${status}`}>Status: {status}</span>
      </div>
      <div className="repair-proposal-grid">
        <article>
          <span className="eyebrow">Current</span>
          <p>{proposal.currentValue || "No current value available."}</p>
        </article>
        <article>
          <span className="eyebrow">AI Suggestion</span>
          <p>{proposal.suggestedValue}</p>
        </article>
        <article>
          <span className="eyebrow">Why</span>
          <p>{proposal.reason}</p>
        </article>
        <article>
          <span className="eyebrow">Expected impact</span>
          <p>{proposal.estimatedImpact}</p>
        </article>
        <article>
          <span className="eyebrow">Evidence Safety</span>
          <p>{proposal.target.section === "workExperience" ? "Evidence IDs and existing claim boundaries are preserved." : "No new facts or unsupported evidence are added."}</p>
        </article>
      </div>
      <dl className="repair-proposal-meta">
        <div>
          <dt>Risk</dt>
          <dd>{proposal.risk}</dd>
        </div>
        <div>
          <dt>Confidence</dt>
          <dd>{proposal.confidence}</dd>
        </div>
        <div>
          <dt>Stale</dt>
          <dd>{stale ? "Yes" : "No"}</dd>
        </div>
      </dl>
      <div className="repair-proposal-actions">
        <button className="primary" type="button" onClick={onAccept} disabled={stale || status === "accepted"}>Accept</button>
        <button className="secondary" type="button" onClick={onReject} disabled={status === "rejected"}>Reject</button>
        <button className="secondary" type="button" onClick={onEditManually}>Edit manually</button>
      </div>
      <p className="section-note">Accept marks this suggestion for batch apply. The CV changes only when you click Apply Accepted Changes.</p>
    </section>
  );
}
