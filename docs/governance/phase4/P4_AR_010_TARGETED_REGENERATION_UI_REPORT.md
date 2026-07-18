# P4-AR-010 Targeted Regeneration UI and Action Wiring Report

Status: DONE

## Summary

P4-AR-010 fixes the integration gap where P4-AR-009 targeted-regeneration classifications reached the Repair Orchestration summary but were lost before user-facing blocker cards.

The implementation connects existing route output to the blocker-card action model, lifecycle display, action pipeline dispatch, and deterministic browser fixture coverage. It does not redesign targeted regeneration or add a new route.

## Confirmed Data-Flow Break

The route was lost in `CV_Manager_React/src/components/tabs/screeningReviewRepairPanels.tsx`.

Before this task, Remaining Issues cards were derived from:

- direct `BlockerEditTarget`
- proposal availability
- fallback manual state

They did not consume the `targetedRegeneration` or `humanInput` arrays from `repairOrchestration`.

Result: valid targeted-regeneration routes could still render `Manual or AI-assisted review required`.

## Exact Location

- Function/component: `ExportDecisionPanel`
- Broken boundary: Remaining Issues card `displayCard` derivation
- Root cause: card action selection used `if no BlockerEditTarget/proposal -> manual fallback` before checking the authoritative Repair Orchestrator route.

## UI / Action Wiring Before

- `RepairOrchestrationPanel` could show `Regenerate Summary with AI`.
- Individual blocker cards could still show manual fallback.
- Broad section regeneration was treated as missing a direct field target.
- Targeted regeneration lifecycle had no separate running/validating presentation.
- Proposal empty-state language could be visually adjacent to non-proposal repairs.

## UI / Action Wiring After

- Added a user-facing `UserRepairAction` model with:
  - safe repair
  - AI proposal
  - targeted regeneration
  - human input
  - human decision
  - unsupported
- Card CTA derivation follows route priority:
  1. safe repair
  2. AI proposal
  3. targeted regeneration
  4. human input
  5. human decision
  6. unsupported
- Targeted regeneration no longer requires a direct DOM field target.
- `Regenerate Summary with AI`, `Regenerate Work Bullets with AI`, and `Generate Cleaner CV Wording` render on relevant cards.
- `Enter Email` renders for missing email without trusted data.
- Duplicate contact/email diagnostics still consolidate into one user-facing card.
- The existing one-primary-CTA rule is preserved: Repair Orchestration remains the only primary CTA; card actions are secondary actions.

## Lifecycle Behavior

- Ready:
  - `Regenerate Summary with AI`
  - `Regenerate Work Bullets with AI`
  - `Generate Cleaner CV Wording`
- Running:
  - `Regenerating Summary…`
  - `Regenerating Work Bullets…`
  - `Improving CV Wording…`
- Validating:
  - `Validating regenerated content…`
- Success:
  - refreshed blockers
  - refreshed Repair Orchestration
  - refreshed export readiness
  - Export CTA appears when blockers clear
- No-diff:
  - `AI could not produce a safe improvement for this section.`
  - `Retry`
  - `Edit Manually`

## Files Changed

Production/test wiring:

- `CV_Manager_React/src/components/tabs/screeningReviewRepairPanels.tsx`
- `CV_Manager_React/src/components/test/ProductAcceptanceFixtureApp.tsx`
- `CV_Manager_React/e2e/product-acceptance.spec.ts`
- `CV_Manager_React/scripts/smoke-targeted-regeneration-ui.mjs`
- `CV_Manager_React/scripts/smoke-targeted-regeneration-action.mjs`
- `CV_Manager_React/package.json`

Governance:

- `docs/governance/tasks/P4-AR-010.md`
- `docs/governance/phase4/P4_AR_010_TARGETED_REGENERATION_UI_REPORT.md`
- `docs/governance/CURRENT_STATE.md`
- `docs/governance/MASTER_TASK_ROADMAP.md`
- `docs/governance/COMPLETION_REPORT.md`

## Browser Evidence

`npm run e2e:product-acceptance` passed 13 scenarios, including:

- Summary role-fit blocker renders and executes `Regenerate Summary with AI`.
- Broad achievement blocker renders and executes `Regenerate Work Bullets with AI`.
- Broad recruiter-wording blocker renders and executes `Generate Cleaner CV Wording`.
- Duplicate contact/email blockers render one `Enter Email` card and clear after guided email input.
- No real AI invocation occurs in browser acceptance.

## Tests Run

Passed:

- `npm run smoke:targeted-regeneration-ui`
- `npm run smoke:targeted-regeneration-action`
- `npm run smoke:targeted-regeneration`
- `npm run smoke:repair-escalation`
- `npm run smoke:proposal-generation-state`
- `npm run smoke:proposal-ui-integration`
- `npm run smoke:safe-repair-executor`
- `npm run smoke:batch-repair-proposals`
- `npm run smoke:repair-loop`
- `npm run smoke:human-decision-layer`
- `npm run smoke:repair-orchestrator`
- `npm run smoke:repair-proposal`
- `npm run smoke:phase4-guided-blockers`
- `npm run smoke:phase4-guided-editing`
- `npm run smoke:phase4-ai-explainability`
- `npm run smoke:phase4-decision-confidence`
- `npm run smoke:product-acceptance`
- `npm run smoke:workflow`
- `npm run smoke:reviewer`
- `npm run smoke:export-readiness`
- `npm run build`
- `npm run e2e:product-acceptance`
- `npm run e2e:no-ai`
- `npm run test:system`

## Remaining Unsupported Routes

- Unsupported / no-safe-repair blockers remain explicit fallback items.
- Human-decision blockers remain user decision tasks.
- Evidence-selection conflicts remain human-decision or unsupported, not targeted regeneration.

## Stop Condition

Stopped after P4-AR-010 completion.

No Phase 5 task was created, promoted, or started.
