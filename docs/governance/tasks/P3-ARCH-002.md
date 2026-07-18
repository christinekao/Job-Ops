# P3-ARCH-002 - Presentation Boundary Extraction

Status: DONE

## Objective

Reduce presentation coupling in `ScreeningLab.tsx` by extracting Review / Repair / CTA / Export display responsibilities into props-driven presentation components.

## Dependencies

- P3-ARCH-001: DONE
- Architecture Cleanup Wave 1 completion report: complete
- Phase 3 Review / Repair / Export information architecture: complete
- No unresolved ADR required

## Allowed Files

- `CV_Manager_React/src/components/tabs/ScreeningLab.tsx`
- `CV_Manager_React/src/components/tabs/screeningLabPanels.tsx`
- `CV_Manager_React/src/components/tabs/screeningReviewRepairPanels.tsx`
- `CV_Manager_React/scripts/smoke-phase3-architecture-wave2.mjs`
- `CV_Manager_React/package.json`
- `docs/governance/tasks/P3-ARCH-002.md`
- `docs/governance/phase3/ARCHITECTURE_REFACTORING_WAVE2_COMPLETION_REPORT.md`
- `docs/governance/CURRENT_STATE.md`
- `docs/governance/MASTER_TASK_ROADMAP.md`
- `docs/governance/COMPLETION_REPORT.md`

## Forbidden Files

- Runtime prompts and `src/promptBuilders.ts`
- Runtime data under `CV_Manager_React/data/`
- Persistence/API architecture
- `src/domain/screeningWorkflow.ts`
- `src/domain/screeningReview.ts`
- `src/domain/screeningRepairPlan.ts`
- `src/domain/screeningExportDecision.ts`
- `src/domain/localReviewerFix.ts`
- Writer, JD analysis, snapshot identity, or CV quality rules
- Any unrelated production component

## Acceptance Criteria

- [x] `ReviewSummaryPanel` renders review status from supplied props only.
- [x] `RepairPlanPanel` renders supplied repair plan items only and does not execute repair.
- [x] `RepairResultPanel` renders supplied repair result only and does not execute repair.
- [x] `PrimaryCTA` renders the supplied next action and does not derive workflow state.
- [x] `ExportDecisionPanel` renders the supplied export decision and does not compute readiness.
- [x] New presentation components do not import domain logic.
- [x] `ScreeningLab.tsx` remains the orchestrator/composer for domain outputs and dispatch callbacks.
- [x] Workflow, review, repair, export, prompt, persistence, and runtime data behavior remain unchanged.
- [x] Focused and required regression tests pass.

## Required Tests

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

Maximum 8 production files. This task must stop before implementation if the extraction requires more than 8 production files.

## Rollback

Revert only this task's Allowed production and test files. No runtime-data rollback exists or is needed.

## Completion

DONE. See `docs/governance/phase3/ARCHITECTURE_REFACTORING_WAVE2_COMPLETION_REPORT.md`.
