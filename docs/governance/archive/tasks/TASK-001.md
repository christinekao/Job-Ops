# TASK-001 - Validate Governance Package

Status: DONE

## Objective

Validate the governance package created in `docs/governance/` and decide whether it should remain as audit/governance docs or be promoted into project-level root rules later.

## Problem

The project now has a governance package, but it has not yet been reviewed or accepted as the long-term project operating layer.

## Root Cause Addressed

Codex previously lacked a single source-grounded task/rules package for this React CV workflow.

## Evidence

- `docs/governance/SYSTEM_MAP.md`
- `docs/governance/CURRENT_STATE.md`
- `docs/governance/PROJECT_RULES.md`
- `docs/governance/MASTER_TASK_ROADMAP.md`
- Existing root `AGENTS.md`
- `CV_Manager_React/docs/SPEC.md`
- `CV_Manager_React/docs/FLOW.md`
- `CV_Manager_React/docs/ARCHITECTURE.md`

## Dependencies

None.

## Files Allowed to Change

- `docs/governance/**`

## Files Prohibited from Changing

- `CV_Manager_React/src/**`
- `CV_Manager_React/data/**`
- `CV_Manager_React/scripts/**`
- `CV_Manager_React/server.cjs`
- `CV_Manager_React/storageService.cjs`
- `CV_Manager_React/automationService.cjs`
- `CV_Manager_React/src/promptBuilders.ts`
- root `AGENTS.md`
- root `CLAUDE.md`
- runtime CV artifacts under `CV/`, `my work/`, `exports/`

## Implementation Requirements

- Check that every governance file exists.
- Check that every task has a valid dependency status.
- Check exactly one task is `READY`.
- Check later tasks are `BLOCKED`.
- Check all confidence labels use only `Confirmed`, `Highly likely`, `Possible`, or `Insufficient evidence`.
- Do not modify production code, prompts, runtime data, or tests.

## Acceptance Criteria

- [ ] Required governance files exist.
- [ ] Contract files exist for all items in `CONTRACT_INDEX.md`.
- [ ] Task dependencies are consistent.
- [ ] Exactly one task is `READY`.
- [ ] All changed files are under `docs/governance/`.
- [ ] `AGENTS.md.draft` remains draft unless unresolved questions are closed.

## Required Tests

- `find docs/governance -type f | sort`
- Search task statuses and dependencies.
- Markdown path sanity check for referenced governance files.

## Regression Risks

Low. Documentation-only.

## Rollback Method

Delete `docs/governance/`.

## Definition of Done

The governance package is accepted for use as the next Codex task source, or explicit corrections are recorded before any implementation task starts.

## Completion Report Format

```text
Task: TASK-001
Status:

Files reviewed:
- ...

Validation performed:
- ...

Issues found:
- ...

Decision:
- accepted / corrections required

Next READY task:
- ...
```
