# TASK-008 - Add Repair Green-Area Regression Tests

Status: DONE

## Objective

Add regression tests proving repair changes only intended failed areas.

## Problem

Repair must be narrow, but green-area preservation tests were not confirmed in this phase.

## Root Cause Addressed

Repair safety lacks explicit regression coverage.

## Dependencies

- TASK-007 completed.

## Files Allowed to Change

- Repair service test/smoke script
- `CV_Manager_React/package.json` only if adding a script
- `docs/governance/contracts/REPAIR.md`

## Files Prohibited from Changing

- Prompt builders
- Runtime data
- Persistence layer

## Acceptance Criteria

- [x] Failed area changes.
- [x] Passed header/sidebar remain unchanged.
- [x] Existing and newly selected evidence IDs remain stable; no ID is invented.
- [x] No unsupported metric/claim is introduced.

## Required Tests

- New focused repair regression test
- `npm run smoke:workflow`
- `npm run smoke:reviewer`

## Regression Risks

Medium.

## Rollback Method

Revert test and related helper changes.

## Definition of Done

Repair safety is testable before future prompt or repair changes.

## Completion Report Format

```text
Task: TASK-008
Status:
Fixture:
Assertions:
Tests run:
```

## Completion Report

Task: TASK-008  
Status: COMPLETE  
Fixture: local reviewer repair with unsafe current-role wording, selected grounded evidence, and preserved green header/sidebar  
Assertions: failed area changes; green header/sidebar unchanged; evidence IDs stable; no invented metrics; no unsupported claims  
Tests run: `npm run smoke:repair-regression`, `npm run smoke:workflow`, `npm run smoke:reviewer`
