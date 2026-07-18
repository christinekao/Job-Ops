# TASK-002 - Confirm Canonical CV Reference

Status: DONE

## Objective

Identify which CV artifact, if any, is the canonical ideal/reference CV for quality comparison.

## Problem

The repository contains multiple CV PDFs and source materials, but no reviewed evidence declares one as the ideal CV.

## Root Cause Addressed

CV quality cannot be tested against a stable target until the reference artifact is explicit.

## Evidence

- `CV/`
- `CV_Manager_React/source_material/`
- `my work/`
- `docs/governance/DATA_FLOW.md`
- `docs/governance/QUALITY_SPEC.md`

## Dependencies

- TASK-001 accepted.

Dependency verification: TASK-001 is accepted. ADR-001 records the explicit decision that the project intentionally has no canonical CV.

## Files Allowed to Change

- `docs/governance/UNRESOLVED_QUESTIONS.md`
- `docs/governance/QUALITY_SPEC.md`
- `docs/governance/CURRENT_STATE.md`
- `docs/governance/tasks/TASK-002.md`

## Files Prohibited from Changing

- Production code
- Runtime data
- CV artifacts
- Prompts
- Tests

## Implementation Requirements

- Create an artifact matrix.
- Mark canonical/reference/current-output status for each artifact.
- Do not infer ideal status from filename alone.

## Acceptance Criteria

- [x] Canonical ideal/reference status is explicit: no canonical CV exists by design.
- [x] The former blocker is closed by ADR-001 and recorded in governance documents.
- [x] No CV artifact is modified.

## Required Tests

Documentation review only.

## Regression Risks

Low.

## Rollback Method

Revert documentation changes made by this task.

## Definition of Done

Future CV gap analysis can cite the chosen reference or clearly proceed without one.

## Completion Report Format

```text
Task: TASK-002
Status:
Reference decision:
Files changed:
Unresolved blockers:
```

## Completion Report

Task: TASK-002  
Status: COMPLETE  
Reference decision: ADR-001 establishes that the project intentionally has no canonical CV. Per-JD quality is governed by `QUALITY_SPEC.md`, `PROJECT_RULES.md`, contracts, and evidence.  
Files changed: `docs/governance/QUALITY_SPEC.md`, `docs/governance/CURRENT_STATE.md`, `docs/governance/UNRESOLVED_QUESTIONS.md`, `docs/governance/tasks/TASK-002.md`  
Unresolved blockers: None for canonical CV selection. TASK-003 remains BLOCKED until separately reviewed and promoted.
