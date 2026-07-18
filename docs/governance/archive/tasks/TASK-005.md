# TASK-005 - Add Writer Input Snapshot Tests

Status: DONE

## Objective

Create tests that snapshot the meaningful shape of `buildScreeningCvPrompt` without freezing incidental wording.

## Problem

Runtime Writer input contract lives in prompt text and can drift when prompt instructions are edited.

## Root Cause Addressed

Prompt contract lacks stable regression checks.

## Dependencies

- TASK-004 completed.

## Files Allowed to Change

- `CV_Manager_React/src/promptBuilders.ts`
- `CV_Manager_React/scripts/*prompt*.mjs`
- `CV_Manager_React/package.json` only if adding a script
- `docs/governance/contracts/WRITER_INPUT.md`
- `docs/governance/tasks/TASK-005.md`

## Files Prohibited from Changing

- `ScreeningLab.tsx`
- Runtime data
- Writer output apply logic

## Acceptance Criteria

- [x] Prompt includes selected JD, CV Brief, selected evidence, constraints, repair rules when fixContext exists.
- [x] Prompt includes JSON-only instruction.
- [x] Prompt includes no-hidden-overclaim constraints.
- [x] Tests avoid brittle full-prompt snapshots.

## Required Tests

- `npm run build`
- New focused prompt smoke test

## Regression Risks

Medium: overly brittle tests can block legitimate prompt improvement.

## Rollback Method

Revert added test/script and docs updates.

## Definition of Done

Writer input contract has stable regression coverage.

## Completion Report Format

```text
Task: TASK-005
Status:
Files changed:
Assertions added:
Tests run:
```

## Completion Report

Task: TASK-005  
Status: COMPLETE  
Files changed: `CV_Manager_React/scripts/smoke-writer-input.mjs`, `CV_Manager_React/package.json`, `docs/governance/contracts/WRITER_INPUT.md`, governance status/report files  
Assertions added: selected JD, Screening Analysis, CV Brief, selected evidence, JSON-only contract, unsupported-claim controls, targeted repair context, green-area preservation  
Tests run: `npm run smoke:writer-input`, `npm run build`
