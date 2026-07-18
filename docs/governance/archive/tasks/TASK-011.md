# TASK-011 - Add Export Readiness Fixture

Status: DONE

## Objective

Add a focused export-readiness fixture and validation for final CV export path.

## Problem

Export readiness is documented and locally reviewed, but browser/PDF export was not executed or fixture-tested in this phase.

## Root Cause Addressed

Export quality can drift independently from reviewer quality.

## Dependencies

- TASK-009 completed.

## Files Allowed to Change

- `CV_Manager_React/src/domain/screeningReview.ts`
- export-related smoke script
- `CV_Manager_React/package.json` only if adding a script
- `docs/governance/contracts/EXPORT.md`

## Files Prohibited from Changing

- Runtime data
- Prompt builders
- Local server persistence

## Acceptance Criteria

- [x] Export-ready fixture passes.
- [x] Missing contact/section/text-depth fixture fails.
- [x] Export readiness remains distinct from manager relevance.

## Required Tests

- `npm run build`
- `npm run smoke:reviewer`
- New export fixture command

## Regression Risks

Medium.

## Rollback Method

Revert fixture/test and export-check edits.

## Definition of Done

Export readiness has repeatable validation.

## Completion Report Format

```text
Task: TASK-011
Status:
Fixtures:
Tests run:
Files changed:
```

## Completion Report

Task: TASK-011  
Status: COMPLETE  
Fixtures: export-ready CV; missing contact; short text/composed content; insufficient role/bullet depth; manager-relevance separation  
Tests run: `npm run smoke:export-readiness`, `npm run smoke:reviewer`, all prior focused regression commands, `npm run build`, `npm run test:system`  
Files changed: `scripts/smoke-export-readiness.mjs`, `package.json`, `contracts/EXPORT.md`, governance status/report files  
Production export behavior changed: No
