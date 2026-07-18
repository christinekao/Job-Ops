# TASK-002

## Title

Approve Canonical Workflow and Stage Contracts

## Status

BLOCKED

## Objective

Convert the verified TASK-001 reconstruction and owner decisions into an approved canonical workflow/contract specification.

## Problem

Seven-step, six-step and legacy mode flows coexist without an explicit authority/compatibility decision.

## Root cause addressed

Contract ambiguity confirmed by `docs/FLOW.md`, `docs/ARCHITECTURE.md`, `KNOWLEDGE.md` and `modes/_shared.md`.

## Evidence

TASK-001 Completion Report, `docs/CURRENT_STATE.draft.md`, and resolved entries from `docs/UNRESOLVED_QUESTIONS.md`.

## Dependencies

TASK-001 must be complete and verified. UQ-001, UQ-003, UQ-004, UQ-007, UQ-009 and UQ-010 require explicit owner decisions.

## Files allowed to change

Documentation files explicitly approved after TASK-001; exact list must be fixed before status can become READY.

## Files prohibited from changing

All production code, Prompt/Agent files, data, tests and CV artifacts.

## Implementation requirements

Document decisions only; preserve dissent/unknowns; provide requirement-to-contract traceability. Do not implement code.

## Acceptance criteria

One canonical stage model, stage inputs/outputs/gates/invalidations/owners, terminal state, artifact oracle and authority order are explicitly approved.

## Required tests

Markdown link/consistency check, `git diff --check`, and manual traceability review against TASK-001 evidence.

## Regression risks

Overwriting observed behavior with aspirational best practice; silently deprecating a live path; selecting an unapproved CV oracle.

## Rollback method

Revert only TASK-002 documentation changes using the task diff.

## Definition of done

All acceptance criteria are approved and recorded; TASK-003 may then be evaluated for READY status in a separate action.

## Completion report format

```text
TASK-002 Completion Report
Status:
Approved contracts:
Resolved questions:
Remaining blockers:
Files changed:
Validation:
Next task status:
```
