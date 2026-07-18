# P4-AR-007 Proposal UI Integration and Disabled CTA Fix Report

Status: DONE

Date: 2026-07-15

## Objective

Connect the existing deterministic repair proposal and batch-application capabilities to the real Screening Lab UI without adding new repair capabilities, hidden AI calls, export-rule changes, or Phase 5 work.

## Confirmed Root Cause

`Review N AI Suggestions` had proposal candidates, but the UI boundary only opened a single `proposals[0]` preview and did not connect accepted proposals to the P4-AR-004 batch application domain. The existing proposal layer and batch application layer were implemented, but not integrated through the Screening Lab action boundary.

## Implementation Summary

- Added explicit proposal-generation and accepted-proposal-application action IDs.
- Changed the proposal CTA path to open a batch proposal review surface instead of one blocker/manual card.
- Rendered actual proposal cards with current content, AI suggestion, reason, expected impact, evidence safety, stale state, and accept/reject controls.
- Added accepted/rejected/undecided/stale counts and disabled reasons.
- Added `Apply N Accepted Changes`, enabled only for accepted non-stale proposals.
- Wired accepted proposal application through the existing `ScreeningLab.tsx` CV save boundary.
- Successful apply creates one new CV version and content hash, then requests workflow/review/repair/export refresh.
- Rejected proposals do not mutate CV content.
- No-apply state now says no AI changes were applied yet, instead of implying an AI update failed.
- Added deterministic Product Acceptance fixture coverage for proposal batch review and partial application.

## Files Changed

- `CV_Manager_React/src/application/screeningActionPipeline.ts`
- `CV_Manager_React/src/components/tabs/RepairProposalPanel.tsx`
- `CV_Manager_React/src/components/tabs/RepairOrchestrationPanel.tsx`
- `CV_Manager_React/src/components/tabs/screeningReviewRepairPanels.tsx`
- `CV_Manager_React/src/components/tabs/ScreeningLab.tsx`
- `CV_Manager_React/src/components/test/ProductAcceptanceFixtureApp.tsx`
- `CV_Manager_React/scripts/smoke-proposal-ui-integration.mjs`
- `CV_Manager_React/scripts/smoke-repair-orchestrator.mjs`
- `CV_Manager_React/scripts/smoke-repair-proposal.mjs`
- `CV_Manager_React/e2e/product-acceptance.spec.ts`
- `CV_Manager_React/package.json`
- `docs/governance/tasks/P4-AR-007.md`
- `docs/governance/phase4/P4_AR_007_PROPOSAL_UI_INTEGRATION_REPORT.md`
- `docs/governance/CURRENT_STATE.md`
- `docs/governance/MASTER_TASK_ROADMAP.md`
- `docs/governance/COMPLETION_REPORT.md`

## Acceptance Criteria Result

| Criterion | Result |
|---|---|
| `Review N AI Suggestions` enabled for valid candidates | PASS |
| Disabled proposal CTA shows exact reason | PASS |
| Proposal CTA dispatches explicit proposal-generation action | PASS |
| Proposal running state appears | PASS |
| Proposal results normalize to existing contract | PASS |
| Invalid proposals show error and do not mutate CV | PASS |
| Proposal cards show current, suggestion, why, impact, safety, and decisions | PASS |
| Accept/reject updates counts | PASS |
| Apply enables only for accepted non-stale proposals | PASS |
| Applying accepted proposals creates new CV version/hash | PASS |
| Rejected proposals do not mutate CV | PASS |
| Review refresh requested after apply | PASS |
| Blocker count refreshes after apply | PASS |
| Export CTA appears when blockers clear | PASS |
| No-apply state avoids false `AI did not update the CV` message | PASS |
| Stale proposals cannot be applied | PASS |
| No-diff apply returns explicit result | PASS |
| No hidden AI call | PASS |
| Fixture mode remains deterministic | PASS |
| Existing P4-AR and Phase 4 tests pass | PASS |

## Validation

Passed:

- `npm run smoke:proposal-ui-integration`
- `npm run smoke:safe-repair-executor`
- `npm run smoke:batch-repair-proposals`
- `npm run smoke:repair-loop`
- `npm run smoke:human-decision-layer`
- `npm run smoke:ai-repair-copilot`
- `npm run smoke:repair-orchestrator`
- `npm run smoke:repair-proposal`
- `npm run smoke:phase4-guided-blockers`
- `npm run smoke:phase4-guided-editing`
- `npm run smoke:phase4-ai-explainability`
- `npm run smoke:phase4-decision-confidence`
- `npm run smoke:product-acceptance`
- `npm run e2e:product-acceptance`
- `npm run e2e:no-ai`
- `npm run smoke:workflow`
- `npm run smoke:reviewer`
- `npm run smoke:export-readiness`
- `npm run build`
- `npm run test:system`

Notes:

- Browser and system tests required approved localhost execution where the sandbox blocked `127.0.0.1` binding.
- No AI/model endpoint was invoked by deterministic tests.

## Not Implemented

- No new repair capability.
- No runtime prompt change.
- No review-rule change.
- No export-decision change.
- No persistence redesign.
- No runtime data change.
- No Phase 5 task.

## Remaining Risk

The proposal UI now connects existing proposal and batch-apply layers, but future UX simplification should keep the action boundary explicit so proposal generation, approval, and application remain separate user-visible steps.

## Stop Confirmation

Stopped after P4-AR-007. No Phase 5 work was started.
