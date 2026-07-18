# TASK-012 - Finalize AGENTS.md

Status: DONE

## Objective

Promote `docs/governance/AGENTS.md.draft` into the long-term agent rule layer after conflicts and blockers are resolved.

## Problem

The repository has an existing root `AGENTS.md` that includes legacy guidance. The new governance package is not yet accepted as the project-level operating rule.

## Root Cause Addressed

Codex rule layer needs explicit ownership and promotion decision.

## Dependencies

- TASK-001 accepted.
- Critical unresolved questions closed or explicitly waived.
- User approval to replace or update root `AGENTS.md`.

## Execution Blockers

- Root rule placement remains undecided: replace/update root `AGENTS.md`, or keep governance under `docs/governance/`.
- Legacy guidance ownership remains undecided: keep `Christine_CV_Manager.html` / `cv_manager_server.py` guidance in root rules, or demote it to archive/migration guidance.

Resolved by ADR-004 and ADR-005. Root `AGENTS.md` is the single concise entry point; legacy CV Manager files are outside active governance.

## Files Allowed to Change

- root `AGENTS.md`
- root `CLAUDE.md` if project convention requires mirroring
- `docs/governance/AGENTS.md.draft`
- `docs/governance/UNRESOLVED_QUESTIONS.md`

## Files Prohibited from Changing

- Production code
- Runtime data
- Prompts
- Tests

## Acceptance Criteria

- [x] Root rule location is approved.
- [x] Legacy vs React guidance is clearly separated.
- [x] Long-term rules are concise.
- [x] One-off remediation details remain in tasks/roadmap, not `AGENTS.md`.

## Required Tests

- Documentation diff review.
- `git diff --check` if repository has git initialized; otherwise markdown path sanity.

## Regression Risks

Low technical risk, high workflow risk if rule hierarchy becomes confusing.

## Rollback Method

Restore previous `AGENTS.md` / `CLAUDE.md` content from before task diff.

## Definition of Done

Codex can use root rules without re-reading the whole governance package on every task, while still preserving governance docs as reference.

## Completion Report Format

```text
Task: TASK-012
Status:
Rule location:
Files changed:
Open questions closed:
```

## Completion Report

Task: TASK-012  
Status: COMPLETE  
Rule location: root `AGENTS.md` is the single AI entry point; detailed governance remains under `docs/governance/`  
Files changed: root `AGENTS.md`, compatibility pointer `CLAUDE.md`, `DECISIONS.md`, `UNRESOLVED_QUESTIONS.md`, `AGENTS.md.draft`, governance roadmap/state/report files  
Open questions closed: root rule placement and legacy guidance ownership via ADR-004/ADR-005  
Validation: documentation path/status checks passed; repository root has no Git metadata, so `git diff --check` is unavailable
