# TASK-009 - Harden Review Snapshot Identity

Status: DONE

## Objective

Decide and implement whether review snapshots should bind to a CV content hash instead of only `updatedAt`.

## Problem

Current review validity checks `reviewSnapshot.cvUpdatedAt === activeCv.updatedAt`; this is confirmed current behavior but may not be the strongest identity boundary.

## Root Cause Addressed

Potentially weak review snapshot identity.

## Dependencies

- TASK-008 completed.
- ADR-002 accepted and recorded in `DECISIONS.md` and `UNRESOLVED_QUESTIONS.md`.

## Execution Blocker

Resolved: the owner explicitly authorized `CV_Manager_React/src/App.tsx` so `saveCvVersion()` can implement ADR-002 without changing persistence architecture.

## Files Allowed to Change

- `CV_Manager_React/src/App.tsx`
- `CV_Manager_React/src/domain/screeningReview.ts`
- `CV_Manager_React/src/components/tabs/ScreeningLab.tsx`
- `CV_Manager_React/src/types.ts`
- relevant smoke tests
- `docs/governance/contracts/REVIEW.md`

## Files Prohibited from Changing

- Runtime data migration unless separately approved
- Prompt builders
- Storage service

## Acceptance Criteria

- [x] Review snapshot binds to unambiguous current CV identity.
- [x] Existing CVs fail or migrate safely.
- [x] Step 6/7 evaluate the same content-bound snapshot.
- [x] Unchanged CV content with a new timestamp keeps its review valid.
- [x] Changed CV content invalidates a hash-bound stale review.
- [x] Legacy snapshots without `contentHash` remain valid and are enriched lazily.
- [x] No full data migration or unrelated App orchestration change is introduced.

## Required Tests

- `npm run build`
- `npm run smoke:workflow`
- `npm run smoke:reviewer`

## Regression Risks

Medium: old CV review snapshots may become invalid.

## Rollback Method

Revert snapshot identity changes.

## Definition of Done

Review state cannot appear valid for the wrong CV content.

## Completion Report Format

```text
Task: TASK-009
Status:
Decision:
Files changed:
Tests run:
Migration impact:
```

## Completion Report

Task: TASK-009  
Status: COMPLETE  
Decision: ADR-002 dual identity implemented with `snapshotId`, `updatedAt`, and `contentHash`  
Files changed: `src/App.tsx`, `src/domain/screeningReview.ts`, `src/components/tabs/ScreeningLab.tsx`, `src/types.ts`, reviewer smoke test, Review contract, governance status/report files  
Tests run: `npm run smoke:reviewer`, `npm run smoke:workflow`, `npm run build`, `npm run test:system`  
Migration impact: no full migration; legacy null hashes remain valid and are populated lazily on the next safe ScreeningLab read or App write
