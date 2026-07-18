# TASK-004 - Add CV Brief Contract Fixtures

Status: DONE

## Objective

Add focused fixtures/tests for `buildCvBrief` and CV Brief minimum expectations.

## Problem

`buildCvBrief` is a high-impact boundary, but a dedicated contract fixture was not confirmed in this phase.

## Root Cause Addressed

Implicit CV Brief contract can cause Writer input drift.

## Dependencies

- TASK-003 completed with confirmed brief-related gaps, or explicitly marked no brief gap.

## Files Allowed to Change

- `CV_Manager_React/src/data/selection.ts`
- `CV_Manager_React/scripts/*brief*.mjs` or a new focused smoke script
- `CV_Manager_React/package.json` only if adding a script
- `docs/governance/contracts/CV_BRIEF.md`
- `docs/governance/tasks/TASK-004.md`

## Files Prohibited from Changing

- `CV_Manager_React/src/promptBuilders.ts`
- `CV_Manager_React/src/components/tabs/ScreeningLab.tsx`
- Runtime data

## Acceptance Criteria

- [x] Valid input creates required `CvBrief` fields.
- [x] Missing analysis returns/nulls safely.
- [x] Empty must-show evidence is covered by an explicit test and documented policy.
- [x] Existing smoke/build checks pass.

## Required Tests

- `npm run build`
- New focused fixture/smoke command

## Regression Risks

Medium: changes can affect Writer input and CV generation readiness.

## Rollback Method

Revert files changed by this task only.

## Definition of Done

CV Brief has a reproducible fixture baseline.

## Completion Report Format

```text
Task: TASK-004
Status:
Files changed:
Tests run:
Contract behavior:
```

## Completion Report

Task: TASK-004  
Status: COMPLETE  
Files changed: `CV_Manager_React/scripts/smoke-cv-brief.mjs`, `CV_Manager_React/package.json`, `docs/governance/contracts/CV_BRIEF.md`, governance status/report files  
Tests run: `npm run smoke:cv-brief`, `npm run build`  
Contract behavior: missing analysis returns `null`; valid input returns all required fields; only grounded CV-visible evidence becomes must-show; risky/forbidden claims carry forward; empty must-show remains explicit for downstream blocking
