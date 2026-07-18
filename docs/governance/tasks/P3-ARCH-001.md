# P3-ARCH-001 — Authoritative Review Evaluation and Export Decision

Status: DONE

## Objective

Remove duplicate UI-owned export readiness without changing review quality rules, repair behavior, prompts, persistence, or runtime data.

## Dependencies

- P3-001: DONE
- Phase 3 Review/Repair/Export architecture design: complete
- `ARCHITECTURE_DEPENDENCY_AUDIT.md`: confirmed evidence
- No unresolved ADR required

## Allowed Files

- `CV_Manager_React/src/domain/screeningExportDecision.ts`
- `CV_Manager_React/src/components/tabs/ScreeningLab.tsx`
- `CV_Manager_React/src/components/tabs/Export.tsx`
- `CV_Manager_React/scripts/smoke-phase3-architecture-wave1.mjs`
- `CV_Manager_React/package.json`
- `docs/governance/tasks/P3-ARCH-001.md`
- `docs/governance/phase3/ARCHITECTURE_DEPENDENCY_AUDIT.md`
- `docs/governance/phase3/ARCHITECTURE_REFACTORING_PLAN.md`
- `docs/governance/phase3/ARCHITECTURE_REFACTORING_WAVE1_COMPLETION_REPORT.md`
- `docs/governance/CURRENT_STATE.md`
- `docs/governance/MASTER_TASK_ROADMAP.md`
- `docs/governance/COMPLETION_REPORT.md`

## Forbidden Files

- Runtime prompts and `src/promptBuilders.ts`
- Runtime data under `CV_Manager_React/data/`
- Persistence/API architecture
- `src/domain/screeningReview.ts`
- `src/domain/screeningRepairPlan.ts`
- `src/domain/localReviewerFix.ts`
- `src/domain/screeningWorkflow.ts`
- Phase 2 task/governance artifacts
- Any unrelated production component

## Acceptance Criteria

- [x] One domain Review Evaluation composes existing review functions without changing their rules.
- [x] One domain Export Decision is the only readiness source used by both `ScreeningLab` and `ExportPage`.
- [x] UI diagnostics may remain visible but do not independently enable export.
- [x] Screening Analysis remains a valid current decision context; legacy valid Fit Review remains supported.
- [x] Completed steps remain completed; genuine input change still yields rerun; timestamp/view-only changes do not.
- [x] Local repair status and target-zone safeguards remain unchanged.
- [x] Warnings alone do not block export; final export CTA is reachable when required checks pass.
- [x] No duplicate primary CTA or hidden AI invocation is introduced.
- [x] Focused and required regression tests pass.

## Required Tests

- `npm run smoke:phase3-architecture-wave1`
- `npm run smoke:phase3-wave1`
- `npm run smoke:workflow`
- `npm run smoke:repair-regression`
- `npm run smoke:reviewer`
- `npm run smoke:review-roles`
- `npm run smoke:export-readiness`
- `npm run smoke:writer-output`
- `npm run build`
- `npm run test:system`

## Rollback

Revert only this task's Allowed production and test files. No runtime-data rollback exists or is needed.

## Completion

All acceptance criteria passed. See `docs/governance/phase3/ARCHITECTURE_REFACTORING_WAVE1_COMPLETION_REPORT.md`.
