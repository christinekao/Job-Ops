# P4-AR-008 Proposal Generation State and CTA Fix Report

Status: DONE

Date: 2026-07-15

## Objective

Fix the Screening Lab AI suggestion-generation lifecycle so proposal candidates, generation attempts, generated suggestions, empty results, errors, and stale suggestions no longer collapse into one ambiguous UI state.

## Confirmed Root Cause

The UI mixed proposal candidates and generated proposal objects. When approval-required candidates existed but proposal generation had not yet started, the UI could still show `No valid AI suggestions were produced for the current CV.` and disable or mislabel the CTA. That message is only valid after a completed generation attempt returns zero valid proposals.

## Previous State Ambiguity

Before this task, these states were not distinct enough:

- candidates exist but generation has not started
- generation is running
- generated suggestions exist
- generation returned empty
- generation failed
- generated suggestions are stale

The primary CTA also used generated proposal availability too early, which made the UI appear to force manual editing before AI suggestions had been generated.

## Lifecycle Introduced

`ProposalGenerationStatus` now supports:

- `idle`: no proposal candidates exist
- `ready`: candidates exist; generation has not started
- `running`: generation is in progress
- `success`: one or more valid generated suggestions exist
- `empty`: generation completed with zero valid suggestions
- `error`: generation failed with a user-safe reason
- `stale`: generated suggestions no longer match current CV content hash

Status is not inferred from generated proposal count alone. Candidate count and generated suggestion count are separate.

## CTA Behavior by State

| State | Primary CTA | Enabled |
|---|---|---|
| `ready` | `Generate N AI Suggestions` | yes |
| `running` | `Generating suggestions…` | no |
| `success` | `Review N AI Suggestions` | yes |
| `empty` | `Retry AI Suggestions` | yes |
| `error` | `Retry AI Suggestions` | yes unless a precise blocker exists |
| `stale` | `Generate New AI Suggestions` | yes |
| `idle` | no proposal-generation CTA | n/a |

## Implementation Summary

- Added explicit lifecycle helpers in `screeningReviewRepairPanels.tsx`.
- Updated Repair Orchestration CTA labels/notes via supplied lifecycle copy.
- Added ready/running/success/empty/error/stale visible UI messages.
- Ensured the empty-result message appears only after generation is attempted and returns no valid suggestions.
- Added a separate Review step after successful generation.
- Added separate candidate count and generated suggestion count in the proposal batch view.
- Stale state uses generated proposal source content hash vs current content hash.
- Timestamp-only changes do not create stale state because stale detection uses content hash only.
- Expanded deterministic browser fixtures for empty and stale proposal-generation scenarios.

## Files Changed

- `CV_Manager_React/src/components/tabs/RepairOrchestrationPanel.tsx`
- `CV_Manager_React/src/components/tabs/screeningReviewRepairPanels.tsx`
- `CV_Manager_React/src/components/test/ProductAcceptanceFixtureApp.tsx`
- `CV_Manager_React/scripts/smoke-proposal-generation-state.mjs`
- `CV_Manager_React/scripts/smoke-proposal-ui-integration.mjs`
- `CV_Manager_React/e2e/product-acceptance.spec.ts`
- `CV_Manager_React/package.json`
- `docs/governance/tasks/P4-AR-008.md`
- `docs/governance/phase4/P4_AR_008_PROPOSAL_GENERATION_STATE_REPORT.md`
- `docs/governance/CURRENT_STATE.md`
- `docs/governance/MASTER_TASK_ROADMAP.md`
- `docs/governance/COMPLETION_REPORT.md`

Production files changed: 3.

## Real-AI Mode Behavior

The Generate CTA is not disabled merely because generated proposal objects do not exist yet. It is enabled when proposal candidates exist, a generation handler is available, no generation is running, and the current orchestration context is not already stale.

No real AI/model endpoint is called by deterministic tests. Generation still dispatches an explicit action and never mutates the CV or applies proposals automatically.

## Browser Behavior

Browser Product Acceptance now covers:

- ready: three proposal candidates, no generated proposals, enabled `Generate 3 AI Suggestions`, no empty-result message
- running: click Generate, loading/progress state appears, duplicate click prevented by disabled CTA
- success: valid deterministic proposals generated, enabled `Review 3 AI Suggestions`, cards open after Review
- empty: zero valid proposals, empty message appears, `Retry AI Suggestions` enabled
- stale: proposals generated, CV content hash changes, CTA becomes `Generate New AI Suggestions`

## Validation

Passed:

- `npm run smoke:proposal-generation-state`
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

## Remaining Limitations

- This task does not implement a new production AI response contract or new repair capability.
- Existing proposal normalization remains bounded to the current proposal contract and deterministic fixtures.
- Full external model response hardening should remain a separate task if future production AI response evidence shows a contract mismatch.

## Stop Confirmation

Stopped after P4-AR-008. No new READY task was created. Phase 5 was not started.
