# P3-ARCH-003 - Action Pipeline Boundary

Status: DONE

## Objective

Create one explicit action lifecycle for the final Reviewer / Repair / Export area of `ScreeningLab`: UI event → command → execution → explicit result → scoped state refresh → CTA refresh → render.

This task is deliberately limited to the final reviewer action surface: safe local repair, recommended AI repair start/stop, and export navigation. Earlier JD intake, analysis, selection, and first-CV generation controls are not part of this boundary.

## Dependencies

- P3-ARCH-001: DONE
- P3-ARCH-002: DONE
- `ARCHITECTURE_REFACTORING_WAVE1_COMPLETION_REPORT.md`: complete
- `ARCHITECTURE_REFACTORING_WAVE2_COMPLETION_REPORT.md`: complete
- Phase 3 action lifecycle and CTA design documents: complete
- No unresolved ADR required

## Allowed Files

- `CV_Manager_React/src/application/screeningActionPipeline.ts`
- `CV_Manager_React/src/components/tabs/ScreeningLab.tsx`
- `CV_Manager_React/src/components/tabs/screeningReviewRepairPanels.tsx`
- `CV_Manager_React/scripts/smoke-phase3-architecture-wave3.mjs`
- `CV_Manager_React/package.json`
- `docs/governance/tasks/P3-ARCH-003.md`
- `docs/governance/phase3/ARCHITECTURE_REFACTORING_WAVE3_COMPLETION_REPORT.md`
- `docs/governance/CURRENT_STATE.md`
- `docs/governance/MASTER_TASK_ROADMAP.md`
- `docs/governance/COMPLETION_REPORT.md`

## Forbidden Files

- Runtime prompts and `src/promptBuilders.ts`
- Runtime data under `CV_Manager_React/data/`
- Persistence/API architecture and `src/storage.ts`
- `src/domain/screeningWorkflow.ts`
- `src/domain/screeningReview.ts`
- `src/domain/screeningRepairPlan.ts`
- `src/domain/screeningExportDecision.ts`
- `src/domain/localReviewerFix.ts`
- Writer, JD analysis, snapshot identity, export decision, or CV quality rules
- Any unrelated production component

## Acceptance Criteria

- [x] A Reviewer / Repair / Export UI event dispatches exactly one typed command.
- [x] The action executor runs once and returns an explicit `success`, `blocked`, `no-safe-fix`, or `error` result without directly updating UI state.
- [x] Every result contains an action ID, timestamp, affected zones, current CV hash when a CV is available, and scoped refresh requirements.
- [x] State refresh identifies only the affected workflow, review, repair, and export domains; it does not rerun automation or unrelated stages.
- [x] CTA refresh is requested after state refresh and continues to use the existing authoritative CTA resolver.
- [x] A completed safe repair cannot be dispatched again for the same CV content identity in the active reviewer session.
- [x] Reviewer UI renders the latest explicit action result, including failure/no-safe-fix explanation where applicable.
- [x] Duplicate Apply Safe Fix controls are removed from the final reviewer surface.
- [x] Successful repair updates the displayed next action; failed and no-safe-fix outcomes expose their reason.
- [x] Existing review, repair, workflow, export, content-hash, legacy snapshot, prompt, persistence, and Phase 2 behavior remains unchanged.
- [x] Focused and required regression tests pass.

## Required Tests

- `npm run smoke:phase3-architecture-wave3`
- `npm run smoke:phase3-architecture-wave2`
- `npm run smoke:phase3-architecture-wave1`
- `npm run smoke:phase3-wave1`
- `npm run smoke:workflow`
- `npm run smoke:repair-regression`
- `npm run smoke:reviewer`
- `npm run smoke:review-roles`
- `npm run smoke:export-readiness`
- `npm run build`
- `npm run test:system`

## Production File Limit

Maximum 8 production files. Planned production files: 3. Stop before implementation if more than 8 are required.

## Rollback

Revert only the task's Allowed production and test files. No runtime-data migration or persistence rollback is required.

## Completion

DONE. See `docs/governance/phase3/ARCHITECTURE_REFACTORING_WAVE3_COMPLETION_REPORT.md`.
