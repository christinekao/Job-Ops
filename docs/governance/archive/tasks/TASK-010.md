# TASK-010 - Clarify Prompt Template Ownership

Status: DONE

## Objective

Decide whether `data/prompt_templates.json` is editable UX metadata, legacy seed data, or a contract-controlled prompt source.

## Problem

Prompt metadata and runtime prompt builders are separate, which can confuse future Codex work.

## Root Cause Addressed

Prompt ownership ambiguity.

## Dependencies

- TASK-005 completed.

## Execution Blocker

Resolved by ADR-003: `data/prompt_templates.json` is editable UX metadata and reusable saved template data, while active runtime prompt construction belongs to `src/promptBuilders.ts`.

## Files Allowed to Change

- `docs/governance/PROMPT_FLOW.md`
- `docs/governance/contracts/WRITER_INPUT.md`
- `docs/governance/UNRESOLVED_QUESTIONS.md`
- Optional docs only under `CV_Manager_React/docs/`

## Files Prohibited from Changing

- `src/promptBuilders.ts`
- `data/prompt_templates.json`
- Runtime code

## Acceptance Criteria

- [x] Prompt source ownership is documented.
- [x] Future tasks know that changing `prompt_templates.json` does not affect production screening automation without a separate approved Task.
- [x] No runtime behavior changes.

## Required Tests

Documentation review only.

## Regression Risks

Low.

## Rollback Method

Revert docs changed by this task.

## Definition of Done

Prompt ownership is no longer ambiguous in governance docs.

## Completion Report Format

```text
Task: TASK-010
Status:
Decision:
Files changed:
```

## Completion Report

Task: TASK-010  
Status: COMPLETE  
Decision: ADR-003 assigns active runtime prompt construction to `src/promptBuilders.ts`; `data/prompt_templates.json` is editable UX metadata and reusable saved template content  
Files changed: `DECISIONS.md`, `PROMPT_FLOW.md`, `contracts/WRITER_INPUT.md`, `UNRESOLVED_QUESTIONS.md`, `CURRENT_STATE.md`, `TASK-010.md`, and project-management status/report files  
Validation: documentation ownership, path, runtime-effect rule, and unique READY status checks passed; no current document/implementation conflict found  
Production/runtime changes: None
