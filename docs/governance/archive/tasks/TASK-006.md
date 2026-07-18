# TASK-006 - Add Writer Output Validation Guard

Status: DONE

## Objective

Validate parsed Screening CV output before applying it as a `CvVersion`.

## Problem

Automation guards ensure JSON extraction, but a semantically malformed CV JSON could still be risky if apply logic is too permissive.

## Root Cause Addressed

Writer output contract is not confirmed as runtime-validated.

## Dependencies

- TASK-005 completed.

## Files Allowed to Change

- `CV_Manager_React/src/components/tabs/ScreeningLab.tsx`
- Optional new helper under `CV_Manager_React/src/domain/` or `src/data/`
- Focused smoke script under `CV_Manager_React/scripts/`
- `CV_Manager_React/package.json` only if adding a script
- `docs/governance/contracts/WRITER_OUTPUT.md`

## Files Prohibited from Changing

- `CV_Manager_React/data/**`
- `storageService.cjs`
- `automationService.cjs`

## Acceptance Criteria

- [x] Missing required `TailoredCv` fields fail safely.
- [x] Valid output still applies.
- [x] Failed output returns before replacing the last valid CV.
- [x] Review snapshot is created only after valid output passes the guard.

## Required Tests

- `npm run build`
- `npm run smoke:workflow`
- `npm run smoke:reviewer`
- New output validation smoke test

## Regression Risks

Medium: stricter validation may reject older valid outputs.

## Rollback Method

Revert validation helper/tests and apply-path edits.

## Definition of Done

Malformed writer output cannot silently become current CV.

## Completion Report Format

```text
Task: TASK-006
Status:
Validation added:
Files changed:
Tests run:
Compatibility issues:
```

## Completion Report

Task: TASK-006  
Status: COMPLETE  
Validation added: `validateScreeningCvOutput` before `CvVersion` creation/save/review snapshot  
Files changed: `src/domain/screeningCvOutput.ts`, `ScreeningLab.tsx`, `scripts/smoke-writer-output.mjs`, `package.json`, Writer Output contract, governance status/report files  
Tests run: `npm run smoke:writer-output`, `npm run smoke:workflow`, `npm run smoke:reviewer`, `npm run build`  
Compatibility issues: None observed in build or existing workflow/reviewer fixtures
