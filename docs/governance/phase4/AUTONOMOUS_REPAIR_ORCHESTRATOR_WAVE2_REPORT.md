# Autonomous Repair Orchestrator Wave 2 Report

Task: `docs/governance/tasks/P4-AR-002.md`

Status: DONE

Date: 2026-07-13

## Summary

Implemented an authoritative Repair Orchestrator that classifies every current blocker into exactly one repair route.

This wave classifies only. It does not apply repairs, mutate CV content, call AI, rerun review, or change export readiness.

## Classification Rules

Routes:

- `safe-auto`
- `approval-required`
- `human-decision`
- `unsupported`

Recommended next route order:

1. `run-safe-repair` when safe automatic candidates exist
2. `review-ai-proposals` when approval-required suggestions exist
3. `resolve-human-decision` when human decisions exist
4. `no-available-repair` when only unsupported blockers remain

Each classification includes:

- blocker ID
- route
- reason
- optional edit target
- evidence IDs
- CV version ID
- CV content hash
- risk
- confidence
- allowed mutation zones
- prohibited mutation zones
- approval and capability flags
- unsupported reason when relevant

## Safe-Auto Cases

- Exact duplicate wording.
- Trusted missing email when a deterministic profile email exists.
- Explicit deterministic terminology or formatting normalization.

Safe-auto remains classification-only in this wave. The UI displays the safe repair route, but the action is disabled because application is not implemented.

## Approval-Required Cases

- Summary rewrite.
- Work-bullet rewrite.
- Wording improvements.
- Business-impact reframing.
- External/internal resume wording.
- Keyword placement changes.
- Unsupported visible wording when the likely repair is a wording change rather than an evidence or truth decision.

Approval-required routes can open the existing P4-AR-001 proposal preview. Accept/reject remains proposal state only and does not mutate CV content.

## Human-Decision Cases

- Career positioning.
- Choosing between role identities.
- Unsupported experience.
- Evidence conflicts or evidence mismatch.
- Deciding whether a claim is true.
- Choosing omitted or uncertain achievements.

## Unsupported Cases

- No reliable edit target.
- No trusted value for a missing field.
- Required evidence is missing and cannot be inferred.
- Repository contracts do not authorize a repair path.

## UI Before / After

Before:

- Supported blockers opened `Preview AI Repair` directly when proposal generation was available.
- The UI did not show an authoritative classification of all blockers.

After:

- The Review / Repair / Export screen shows `Repair Orchestration`.
- Route counts use plain language:
  - AI can fix this safely
  - AI can suggest a change
  - Your decision is needed
  - No safe repair is available
- The primary next action is derived from the orchestrator output.
- Raw route codes remain in Advanced Details only.
- Existing proposal preview behavior is preserved for approval-required items.

## Stale-State Behavior

Classifications are tied to:

- CV version ID
- CV content hash

Changed content hash makes a classification stale.

Timestamp-only changes do not make a classification stale when version ID and content hash remain unchanged.

## Proof of No CV Mutation

Browser acceptance verifies:

- accepting a proposal records proposal state only
- CV content remains unchanged after preview/accept/reject
- CV content hash changes only after explicit manual edit and save

The orchestrator source is also checked for absence of repair execution and mutation symbols.

## Proof of No AI Invocation

Validation includes:

- `npm run smoke:no-ai-invocation`
- `npm run e2e:no-ai`

No Codex CLI, OpenAI/model endpoint, automation endpoint, or AI-running state is entered by deterministic tests.

## Files Changed

- `CV_Manager_React/src/domain/repairOrchestrator.types.ts`
- `CV_Manager_React/src/domain/repairOrchestrator.ts`
- `CV_Manager_React/src/components/tabs/RepairOrchestrationPanel.tsx`
- `CV_Manager_React/src/components/tabs/screeningReviewRepairPanels.tsx`
- `CV_Manager_React/src/components/tabs/ScreeningLab.tsx`
- `CV_Manager_React/src/components/test/ProductAcceptanceFixtureApp.tsx`
- `CV_Manager_React/src/styles.css`
- `CV_Manager_React/scripts/smoke-repair-orchestrator.mjs`
- `CV_Manager_React/e2e/product-acceptance.spec.ts`
- `CV_Manager_React/package.json`
- `docs/governance/tasks/P4-AR-002.md`
- `docs/governance/phase4/AUTONOMOUS_REPAIR_ORCHESTRATOR_WAVE2_REPORT.md`
- `docs/governance/CURRENT_STATE.md`
- `docs/governance/MASTER_TASK_ROADMAP.md`
- `docs/governance/COMPLETION_REPORT.md`

## Tests Run

Passed:

- `npm run smoke:repair-orchestrator`
- `npm run smoke:product-acceptance`
- `npm run smoke:hr-review-gate`
- `npm run smoke:hiring-manager-review-gate`
- `npm run smoke:no-ai-invocation`
- `npm run smoke:phase4-guided-blockers`
- `npm run smoke:phase4-guided-editing`
- `npm run smoke:phase4-ai-explainability`
- `npm run smoke:phase4-decision-confidence`
- `npm run smoke:repair-proposal`
- `npm run e2e:product-acceptance`
- `npm run e2e:no-ai`
- `npm run smoke:workflow`
- `npm run smoke:reviewer`
- `npm run smoke:export-readiness`
- `npm run build`
- `npm run test:system`

Sandbox note:

- Initial sandboxed browser/system runs failed only on localhost listen restrictions.
- Approved reruns passed.

## Known Limitations

- Safe-auto application is not implemented.
- Proposal application is not implemented.
- Orchestrator classification is deterministic and conservative.
- Route classification depends on current blocker wording and existing guided edit target resolution.
- Missing trusted contact data remains unsupported.
- Human-decision classification is intentionally broad for evidence, truth, and positioning questions.

## Recommended Future Scope If Authorized

If authorized later, a separate guarded application task should implement safe-auto candidates only:

- execute only classifications still fresh by CV version ID and content hash
- apply only allowed mutation zones
- produce an explicit receipt
- preserve rollback information
- rerun only the minimum deterministic affected check
- never call AI automatically

No follow-up task was created, promoted, or started in this wave.
