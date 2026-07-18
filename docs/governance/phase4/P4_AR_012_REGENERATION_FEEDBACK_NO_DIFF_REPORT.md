# P4-AR-012 Targeted Regeneration Feedback and No-Diff Report

Status: DONE

## Confirmed Root Causes

- Running state existed, but only the upper `Your Next Step` area rendered it; users clicking a lower blocker card could not see feedback without scrolling.
- `ScreeningLab.tsx` reset the targeted lifecycle to idle in `finally` and retained only a generic action result, so no targeted terminal identity survived blocker/CTA refresh.
- The CTA was re-derived from the unchanged Repair Orchestrator route without considering the previous no-diff outcome.
- Existing Retry/Edit copy was static presentation with no retry handler, attempt count, same-context guard, or token warning.

## Lifecycle Before and After

Before: ready -> running elsewhere -> idle/generic result -> unchanged blocker -> same regeneration CTA.

After: ready -> visible running beside the click -> visible validating -> success, no-diff-terminal, blocked, error, or stale. The clicked action is disabled immediately, shows its target/stage/elapsed time, and terminal feedback remains available until dismissal, another repair action, or a material context change.

## Repeated-Token Guard

`targetedRegenerationFeedback.ts` derives a stable attempt identity from blocker IDs, strategy, target zones, CV content hash, effective Brief hash, and evidence-context hash. Timestamp-only changes are excluded. A same-context no-diff rejects ordinary dispatch; only the explicit secondary Retry can dispatch again, and every Retry increments the attempt count.

## No-Diff Next Action

- Summary: `Edit Summary Manually`
- Wording: `Edit Wording Manually`
- Work bullets: `Edit Work Bullets Manually`

The blocker remains unresolved and is labelled as attempted with no safe improvement. `Retry AI Regeneration` remains secondary and warns that the same CV/evidence context will consume AI tokens again. `Review Changes` is not shown when no content changed.

## Files Changed

Production (3):

- `CV_Manager_React/src/components/tabs/ScreeningLab.tsx`
- `CV_Manager_React/src/components/tabs/screeningReviewRepairPanels.tsx`
- `CV_Manager_React/src/domain/targetedRegenerationFeedback.ts`

Tests/config:

- `CV_Manager_React/scripts/smoke-targeted-regeneration-feedback.mjs`
- `CV_Manager_React/scripts/smoke-targeted-regeneration-no-diff.mjs`
- `CV_Manager_React/e2e/targeted-regeneration-runtime.spec.ts`
- `CV_Manager_React/package.json`

Governance:

- `docs/governance/tasks/P4-AR-012.md`
- `docs/governance/phase4/P4_AR_012_REGENERATION_FEEDBACK_NO_DIFF_REPORT.md`
- `docs/governance/CURRENT_STATE.md`
- `docs/governance/MASTER_TASK_ROADMAP.md`
- `docs/governance/COMPLETION_REPORT.md`

## Automated Validation

Passed:

- `npm run smoke:targeted-regeneration-feedback`
- `npm run smoke:targeted-regeneration-no-diff`
- targeted regeneration runtime/click/action/UI/repair-escalation smokes
- proposal generation/UI, safe repair, batch proposal, repair loop, human decision, Orchestrator, proposal, and Copilot smokes
- Phase 4 guided blockers/editing, explainability, and decision-confidence smokes
- Product Acceptance, workflow, reviewer, export-readiness, and no-AI smokes
- targeted real-App component E2E: 5/5
- Product Acceptance E2E: 13/13
- browser no-AI E2E: 1/1
- `npm run build`
- `npm run test:system`

The targeted browser no-diff scenario also proved that a material Summary edit clears the terminal attempt identity and makes regeneration available again.

## Manual Real-Page Acceptance

On the real Microsoft / Azure Solution Specialist Screening Lab at `http://127.0.0.1:7790/`:

- One explicit `Regenerate Summary with AI` click immediately changed both visible action labels to `Regenerating Summary…`.
- The clicked blocker displayed a nearby status panel, target `summary`, protected sections, elapsed time, and disabled duplicate actions.
- The runtime completed visibly with a blocked validation result and preserved the current CV. The result identified missing `header.email` and an evidence-ID validation failure; no silent save occurred.
- This live response did not produce no-diff. The conditional no-diff terminal path was verified against the real `ScreeningLab` component with mocked runtime output, not a presentation-only fixture.
- Browser artifacts were emitted for the live blocker view and persistent completion result. The live Screening Lab tab was left open.

## Remaining Limitation

Actual AI output is nondeterministic. The single required live run returned `blocked`, not `no-diff`; repeatedly spending tokens solely to force a no-diff response was intentionally avoided. Deterministic real-component E2E remains the authoritative no-diff regression.

## Scope Confirmation

No review rule, blocker classification/routing, export semantic, prompt, evidence-selection rule, persistence architecture, or runtime data changed. No additional task is READY. Phase 5 was not started.
