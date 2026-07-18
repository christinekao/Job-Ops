# TASK-007 - Extract Local Reviewer Fix Service

Status: DONE

## Objective

Move local no-token repair heuristics out of `ScreeningLab.tsx` into a dedicated service/domain helper.

## Problem

`ScreeningLab.tsx` still owns local content repair logic, which increases coupling and regression risk.

## Root Cause Addressed

Repair implementation boundary is not separated from UI orchestration.

## Dependencies

- TASK-006 completed.

## Files Allowed to Change

- `CV_Manager_React/src/components/tabs/ScreeningLab.tsx`
- `CV_Manager_React/src/domain/localReviewerFix.ts` or `CV_Manager_React/src/services/cvRepair.ts`
- Focused smoke script if needed
- `docs/governance/contracts/REPAIR.md`

## Files Prohibited from Changing

- `promptBuilders.ts`
- `storageService.cjs`
- Runtime data
- unrelated tabs/components

## Acceptance Criteria

- [x] `ScreeningLab.tsx` delegates local fix logic.
- [x] Local fix output preserves supported evidence IDs.
- [x] Local fix uses only selected safe evidence and source metrics.
- [x] Existing build/workflow/reviewer behavior remains equivalent.

## Required Tests

- `npm run build`
- `npm run smoke:workflow`
- `npm run smoke:reviewer`

## Regression Risks

High: repair behavior touches final CV quality and review state.

## Rollback Method

Revert service extraction and restore prior inline behavior.

## Definition of Done

Local repair has a separate testable owner.

## Completion Report Format

```text
Task: TASK-007
Status:
Files changed:
Behavior before:
Behavior after:
Tests run:
```

## Completion Report

Task: TASK-007  
Status: COMPLETE  
Files changed: `src/domain/localReviewerFix.ts`, `ScreeningLab.tsx`, Repair contract, governance status/report files  
Behavior before: local content repair heuristics and orchestration were embedded in `ScreeningLab.tsx`  
Behavior after: pure repair construction is delegated to `buildLocalReviewerContentFix`; UI retains audit, persistence, review, and messaging  
Tests run: `npm run build`, `npm run smoke:workflow`, `npm run smoke:reviewer`
