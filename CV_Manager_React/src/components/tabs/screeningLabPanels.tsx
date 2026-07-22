import type { JobApplication, ScreeningAnalysis } from "../../types";
import type { ScreeningAnalysisAIOutput } from "../../domain/screeningAnalysisSchema";
import type { NormalizedRequirement } from "../../data/jobs";
import { repairKindForItem, tokenCostLabel, type LocalCheck, type RepairAction } from "../../domain/screeningReview";
import { roleFixLabel, roleForCheck } from "../../domain/screeningReviewRoles";

function renderListItem(item: unknown) {
  if (typeof item === "string") return item;
  if (typeof item === "number" || typeof item === "boolean") return String(item);
  if (item && typeof item === "object") {
    const record = item as Record<string, unknown>;
    const primary = record.reason || record.label || record.title || record.name || record.requirement || record.keyword || record.evidenceId;
    const secondary = record.evidenceId && record.reason ? `Evidence: ${record.evidenceId}` : "";
    return [primary, secondary].filter(Boolean).join(" · ") || JSON.stringify(record);
  }
  return "";
}

export function compactUiMessage(value: string) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  const looksLikePrompt = /STRICT MACHINE OUTPUT CONTRACT|Core contract:|CV writing rules:|Required shape:|Before writing|Manager-readiness rule|Prompt Context Only/i.test(cleaned);
  if (looksLikePrompt) {
    return "Codex returned prompt text instead of a usable status/result. Rerun this step or open details.";
  }
  return cleaned.length > 240 ? `${cleaned.slice(0, 240)}…` : cleaned;
}

function isManualCheck(check: LocalCheck) {
  return repairKindForItem(check.label) === "title";
}

export function reviewerFixHint(label: string) {
  if (/hiring manager/i.test(label)) return "CV positioning or first-page bullets are not convincing enough for interview. Strengthen the most relevant project-backed bullets.";
  if (/unsupported claims/i.test(label)) return "Remove or soften claims that the evidence bank cannot strongly support. Do not turn gaps into fake strengths.";
  if (/weak claims/i.test(label)) return "Use conservative wording for partially supported JD requirements, or move them lower.";
  if (/action\/outcome/i.test(label)) return "Rewrite task-style bullets into action + scope + business value. Keep only supported outcomes.";
  if (/evidence traceability/i.test(label)) return "Attach valid Evidence Bank card IDs to visible bullets. Skill, domain, or STAR IDs do not count as evidence cards.";
  if (/external wording/i.test(label)) return "Translate internal names and work-log wording into external recruiter language.";
  if (/ATS|keyword/i.test(label)) return "Add only supported JD keywords into summary, skills, or relevant bullets.";
  if (/contact extraction/i.test(label)) return "Click Apply header fix to fill the supported name, plain email, and location without AI.";
  if (/text layer/i.test(label)) return "Check that header, summary, skills, and work bullets are present as text, not hidden or malformed JSON.";
  if (/section order/i.test(label)) return "Keep readable order: header, summary, skills/sidebar, then work history.";
  if (/work depth/i.test(label)) return "Add or restore representative project-backed bullets from selected evidence; do not add filler.";
  if (/PDF|export/i.test(label)) return "Fix required CV content first, then use Export / Apply. Export anyway only if you accept the risk.";
  return "Review this failed check and make the smallest evidence-backed edit.";
}

function failedCheckActionItems(failed: LocalCheck[]) {
  const labels = failed.map((check) => check.label).join(" ");
  const actions = [
    /hiring manager|action\/outcome|work depth/i.test(labels)
      ? "Strengthen first-page work bullets with representative project-backed actions and business value."
      : "",
    /unsupported|weak/i.test(labels)
      ? "Remove, soften, or move lower any claim that is unsupported or only weakly supported by the evidence bank."
      : "",
    /evidence traceability/i.test(labels)
      ? "Attach valid Evidence Bank card IDs to visible bullets; do not use skill, domain, or STAR IDs as evidence links."
      : "",
    /contact extraction/i.test(labels)
      ? "Fix the CV header: name, plain email, and location must be visible."
      : "",
    /ATS|PDF|text layer|section order/i.test(labels)
      ? "Keep export structure readable: header, summary, skills/sidebar, then work history."
      : ""
  ].filter(Boolean);
  return actions.length ? actions : ["Open CV Studio and fix only the failed checks listed below."];
}

function localFixScope(label: string) {
  if (/hiring manager/i.test(label)) return "Local fix rewrites the summary and first current-role bullets to show stronger project-backed value.";
  if (/action\/outcome/i.test(label)) return "Local fix rewrites visible work bullets into action + scope + business value wording.";
  if (/external wording/i.test(label)) return "Local fix removes internal/work-log wording from visible work bullets.";
  if (/evidence traceability/i.test(label)) return "Local fix can only preserve valid evidence IDs already attached to selected evidence.";
  if (/contact extraction/i.test(label)) return "Use Apply header fix; this is a header-only no-token fix.";
  return "Local fix makes the smallest no-token edit available for this failed check.";
}

export function ReviewerBlockerTriage({
  reviewerChecks,
  exportChecks,
  aiRepairLoopStopped,
  localFixSummary,
  onApplyLocalFix,
  onManualEdit,
  onExportAnyway,
  onDoNotApplyYet
}: {
  reviewerChecks: LocalCheck[];
  exportChecks: LocalCheck[];
  aiRepairLoopStopped: boolean;
  localFixSummary?: string;
  onApplyLocalFix?: () => void;
  onManualEdit?: () => void;
  onExportAnyway?: () => void;
  onDoNotApplyYet?: () => void;
}) {
  const checks = [...reviewerChecks, ...exportChecks];
  const failed = checks.filter((check) => !check.ok);
  const passed = checks.filter((check) => check.ok);
  if (!failed.length) return null;
  return (
    <div className="reviewer-triage">
      <div className="reviewer-triage-head">
        <div>
          <span className="eyebrow">What the red means</span>
          <strong>{failed.length} content/export check(s) still need review.</strong>
          <p>
            {aiRepairLoopStopped
              ? "AI repair has already run once. Use the local no-token fix for the failed checks below, or edit those same items in CV Studio."
              : "Fix the failed checks only. The green items are already OK and should stay unchanged."}
          </p>
        </div>
        {onApplyLocalFix || onManualEdit || onExportAnyway || onDoNotApplyYet ? (
          <div className="reviewer-secondary-actions">
            {onApplyLocalFix ? <button className="primary" onClick={onApplyLocalFix}>Fix remaining red items locally</button> : null}
            {onManualEdit ? <button className="primary" onClick={onManualEdit}>Open CV Studio</button> : null}
            {onExportAnyway ? <button className="secondary" onClick={onExportAnyway}>Export anyway</button> : null}
            {onDoNotApplyYet ? <button className="secondary" onClick={onDoNotApplyYet}>Do not apply yet</button> : null}
          </div>
        ) : null}
      </div>
      {localFixSummary ? (
        <div className="reviewer-local-fix-result" role="status" aria-live="polite">
          <strong>Last local fix result</strong>
          <span>{localFixSummary}</span>
        </div>
      ) : null}
      <div className="reviewer-triage-grid">
        <div className="reviewer-triage-fail">
          <span className="eyebrow">Needs manual fix</span>
          <ul>
            {failed.map((check) => (
              <li key={check.label}>
                <strong>{roleForCheck(check).label}: {check.label.replace(/^Reviewer:\s*/i, "")}</strong>
                <span>{check.value}</span>
                <span>{roleFixLabel(roleForCheck(check))}</span>
                <span className="reviewer-local-action">{localFixScope(check.label)}</span>
                <p>{reviewerFixHint(check.label)}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="reviewer-triage-pass">
          <span className="eyebrow">Already OK</span>
          <ul>
            {passed.slice(0, 5).map((check) => (
              <li key={check.label}>
                <strong>{check.label.replace(/^Reviewer:\s*/i, "")}</strong>
                <span>{check.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function CheckStatusSummary({
  checks,
  onNextStep,
  nextStepButton,
  nextStepDisabled = false,
  nextStepHint,
  nextStepRun,
  actionHandledAbove = false
}: {
  checks: LocalCheck[];
  onNextStep?: () => void;
  nextStepButton?: string;
  nextStepDisabled?: boolean;
  nextStepHint?: string;
  nextStepRun?: JobApplication["screeningAnalysisRun"] | JobApplication["screeningCvRun"];
  actionHandledAbove?: boolean;
}) {
  const passed = checks.filter((check) => check.ok);
  const manual = checks.filter((check) => !check.ok && isManualCheck(check));
  const failed = checks.filter((check) => !check.ok && !isManualCheck(check));
  if (!checks.length) return null;
  return (
    <div className="check-status-summary">
      <div>
        <span className="eyebrow">OK - keep as is</span>
        {passed.length ? (
          <ul>
            {passed.map((check) => (
              <li key={check.label}>
                <strong>{check.label}</strong>
                <span>{check.value}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No checks passed yet.</p>
        )}
      </div>
      {manual.length ? (
        <div>
          <span className="eyebrow">Manual edit</span>
          <ul>
            {manual.map((check) => (
              <li key={check.label}>
                <strong>{check.label}</strong>
                <span>{check.value}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div>
        <span className="eyebrow">{actionHandledAbove ? "Failed checks covered by the action above" : "Needs fix - no AI by default"}</span>
        {failed.length ? (
          <>
            {!actionHandledAbove ? (
              <div className="check-next-step">
                <div>
                  <strong>Next step: fix only the failed items below.</strong>
                  <p>Keep the OK items unchanged. Do not rerun AI by default.</p>
                  {nextStepHint ? <p>{nextStepHint}</p> : null}
                  {nextStepRun ? (
                    <small className="ai-action-timestamp">
                      Last completed: {nextStepRun.lastCompletedAt ? new Date(nextStepRun.lastCompletedAt).toLocaleString() : "Never completed"}
                      {nextStepRun.estimatedInputTokens ? ` · est. ${nextStepRun.estimatedInputTokens.toLocaleString()} input tokens` : ""}
                    </small>
                  ) : null}
                </div>
                {onNextStep && nextStepButton ? (
                  <button className="primary" onClick={onNextStep} disabled={nextStepDisabled}>{nextStepButton}</button>
                ) : null}
              </div>
            ) : null}
            <ul className="check-action-items">
              {failedCheckActionItems(failed).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <ul>
              {failed.map((check) => (
                <li key={check.label}>
                  <strong>{check.label}</strong>
                  <span>{check.value}</span>
                  <p>{reviewerFixHint(check.label)}</p>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>No remaining patch items.</p>
        )}
      </div>
    </div>
  );
}

export function RepairActionPanel({ actions, aiLocked = false }: { actions: RepairAction[]; aiLocked?: boolean }) {
  if (!actions.length) return null;
  return (
    <div className="repair-action-panel">
      <div className="repair-action-head">
        <span className="eyebrow">Repair action levels</span>
        <strong>{aiLocked
          ? "AI repair is complete. Use these categories only as a manual editing checklist."
          : "Patch only the failed category below. Keep passed checks unchanged."}</strong>
      </div>
      <div className="repair-action-grid">
        {actions.map((action) => (
          <article className={action.preferManual ? "manual" : ""} key={action.kind}>
            <div>
              <strong>{action.title}</strong>
              <span>{aiLocked && action.tokenCost === "ai-patch" ? "Manual review only - no more AI runs" : tokenCostLabel(action)}</span>
            </div>
            <p>{action.detail}</p>
            <ul>
              {action.items.slice(0, 4).map((item, index) => (
                <li key={`${action.kind}-${index}`}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}

export function MiniTagList({ title, items, danger }: { title: string; items: unknown[]; danger?: boolean }) {
  const visible = items.map(renderListItem).filter(Boolean).slice(0, 8);
  if (!visible.length) return null;
  return (
    <div>
      <span className="eyebrow">{title}</span>
      <div className={danger ? "screening-tags danger" : "screening-tags"}>
        {visible.map((item) => <span key={`${title}-${item}`}>{item}</span>)}
      </div>
    </div>
  );
}

export function MiniReasonList({ title, items, danger }: { title: string; items?: unknown[]; danger?: boolean }) {
  const visible = (items || []).map(renderListItem).filter(Boolean).slice(0, 4);
  if (!visible.length) return null;
  return (
    <div className={danger ? "fit-reason-list danger" : "fit-reason-list"}>
      <span>{title}</span>
      <ul>
        {visible.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}
      </ul>
    </div>
  );
}

export function JdBreakdownPanel({
  breakdown
}: {
  breakdown: NonNullable<ScreeningAnalysis["jdBreakdown"]>;
}) {
  return (
    <div className="jd-breakdown-panel">
      <div>
        <span className="eyebrow">Role summary</span>
        <p>{breakdown.roleSummary}</p>
      </div>
      <div className="jd-breakdown-grid">
        <MiniTagList title="Must-have requirements" items={breakdown.mustHaveRequirements || []} />
        <MiniTagList title="Strong advantages" items={breakdown.strongAdvantageRequirements || []} />
        <MiniTagList title="Core responsibilities" items={breakdown.coreResponsibilities || []} />
        <MiniTagList title="Hidden hiring priorities" items={breakdown.hiddenHiringPriorities || []} />
      </div>
      <div className="jd-breakdown-grid">
        <MiniTagList title="Technical skills" items={breakdown.requiredSkills?.technical || []} />
        <MiniTagList title="Business skills" items={breakdown.requiredSkills?.business || []} />
        <MiniTagList title="Communication" items={breakdown.requiredSkills?.communication || []} />
        <MiniTagList title="Tools / platforms" items={breakdown.requiredSkills?.toolsPlatforms || []} />
      </div>
      <MiniTagList title="ATS exact keywords" items={breakdown.atsKeywords?.exact || []} />
    </div>
  );
}

export function TerminologyTable({
  items,
  selectedBlockedTerms,
  compact
}: {
  items: NonNullable<ScreeningAnalysis["internalTerminology"]>;
  selectedBlockedTerms: string[];
  compact?: boolean;
}) {
  const visible = items.filter((item) => item.originalTerm || item.externalFriendlyWording).slice(0, compact ? 4 : 12);
  if (!visible.length && !selectedBlockedTerms.length) return null;
  return (
    <div>
      <span className="eyebrow">Internal terminology translation</span>
      {selectedBlockedTerms.length ? (
        <div className="screening-tags danger">
          {selectedBlockedTerms.slice(0, 8).map((term) => <span key={`blocked-${term}`}>{term}</span>)}
        </div>
      ) : null}
      {visible.length ? (
        <div className="terminology-table">
          {visible.map((item, index) => (
            <article key={`${item.originalTerm}-${index}`}>
              <strong>{item.originalTerm}</strong>
              <p>{item.externalFriendlyWording}</p>
              <span>{item.usageDecision} · {item.businessFunction || item.audience || item.reason}</span>
            </article>
          ))}
        </div>
      ) : (
        <p className="section-note">No internal terminology translations saved yet.</p>
      )}
    </div>
  );
}

export function GapRiskList({
  items,
  compact
}: {
  items: NonNullable<ScreeningAnalysis["remainingGaps"]>;
  compact?: boolean;
}) {
  const visible = items.filter((item) => item.gap || item.mitigation).slice(0, compact ? 4 : 10);
  if (!visible.length) return null;
  return (
    <div>
      <span className="eyebrow">Remaining gaps</span>
      <div className="gap-risk-list">
        {visible.map((item, index) => (
          <article className={item.riskLevel === "High" ? "danger" : ""} key={`${item.gap}-${index}`}>
            <strong>{item.gap}</strong>
            <p>{item.mitigation}</p>
            <span>{item.riskLevel} risk</span>
          </article>
        ))}
      </div>
    </div>
  );
}

export function MarketReferenceSignalList({
  items
}: {
  items: NonNullable<ScreeningAnalysis["marketReferenceSignals"]>;
}) {
  const visible = items
    .filter((item) => item.sourceIds?.length && (item.observedRolePattern || item.relevanceToThisJd))
    .slice(0, 4);
  if (!visible.length) return null;
  return (
    <div>
      <span className="eyebrow">Saved market JD reference signals</span>
      <div className="screening-signal-list">
        {visible.map((item, index) => (
          <article key={`${item.observedRolePattern}-${index}`}>
            <strong>{item.observedRolePattern || "Saved JD reference"}</strong>
            <p>{item.relevanceToThisJd}</p>
            <span>Sources: {item.sourceIds.join(", ")} · {(item.observedRequiredCapabilities || []).slice(0, 4).join(" · ")}</span>
          </article>
        ))}
      </div>
    </div>
  );
}

export function EvidenceMappingList({
  items,
  sourceInventory = []
}: {
  items: ScreeningAnalysisAIOutput["requirementMatrix"];
  sourceInventory?: NormalizedRequirement[];
}) {
  const visible = items
    .filter((item) => item.requirement || item.normalizedRequirement)
    .slice(0, 12);
  if (!visible.length) return null;
  return (
    <div>
      <span className="eyebrow">Canonical requirement matrix</span>
      <div className="screening-signal-list">
        {visible.map((item) => {
          const source = sourceInventory.find((candidate) => candidate.requirementId === item.requirementId);
          const supportingIds = [
            ...(item.matchingEvidenceIds || []),
            ...(item.matchingSkillIds || []),
            ...(item.matchingStoryIds || []),
            ...(item.matchingEducationIds || []),
            ...(item.matchingDomainKnowledgeIds || [])
          ];
          return (
          <article key={item.requirementId} className={item.matchStatus === "CORE_CAPABILITY_GAP" || item.matchStatus === "FORMAL_SCREENING_RISK" ? "danger" : ""}>
            <strong>{item.requirement || "Requirement"}</strong>
            <p>{item.explanation}</p>
            <span>{item.importance} · {item.matchStatus} · IDs: {supportingIds.slice(0, 8).join(", ") || "none"}</span>
            {source?.sourceReferences.length ? (
              <details>
                <summary>{source.sourceReferences.length} source reference{source.sourceReferences.length === 1 ? "" : "s"}</summary>
                {source.sourceReferences.map((reference, index) => (
                  <p key={`${reference.sourceSection}-${reference.sourceIndex}-${index}`}>
                    {reference.sourceSection} [{reference.sourceIndices.join(", ")}]: {reference.sourceText}
                  </p>
                ))}
              </details>
            ) : null}
          </article>
          );
        })}
      </div>
    </div>
  );
}

export function AmbiguousSignalList({
  items
}: {
  items: NonNullable<ScreeningAnalysis["ambiguousSignals"]>;
}) {
  const visible = items
    .filter((item) => item.jdPhrase || item.likelyScreeningMeaning || item.howToShowItInCv)
    .slice(0, 5);
  if (!visible.length) return null;
  return (
    <div>
      <span className="eyebrow">Vague JD wording decoded</span>
      <div className="screening-signal-list">
        {visible.map((item, index) => (
          <article key={`${item.jdPhrase}-${index}`}>
            <strong>{item.jdPhrase || "Vague requirement"}</strong>
            <p>{item.likelyScreeningMeaning}</p>
            <span>{item.howToShowItInCv}</span>
          </article>
        ))}
      </div>
    </div>
  );
}
