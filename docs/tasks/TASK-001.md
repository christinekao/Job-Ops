# TASK-001

## Title

Restore Actual Project Flow and Stage Contracts

## Status

DONE

## Objective

Produce a verified, evidence-linked reconstruction of runtime flow, module ownership, Agents/Prompts, Stage Contracts, state mutations, document-to-code differences, actual CV artifacts and ideal-example availability.

## Problem

The repository contains multiple workflow descriptions and legacy/current surfaces. Their relationships and authority are not fully explicit.

## Root cause addressed

Missing single evidence-backed inventory and traceability matrix; this task does not claim or fix a code root cause.

## Evidence

- `CV_Manager_React/docs/{SPEC,FLOW,ARCHITECTURE}.md`
- `CV_Manager_React/src/App.tsx`, `src/components/tabs/ScreeningLab.tsx`
- `src/domain/*`, `src/data/*`, `src/storage.ts`, `server.cjs`, `storageService.cjs`, `automationService.cjs`
- `src/promptBuilders.ts`, `data/prompt_templates.json`, `modes/*.md`
- `package.json`, `scripts/smoke-*.mjs`
- `data/app_data.json`, `data/cv_versions.json`, root `CV/`, `source_material/`, `_archive/reference-cv-html/`

## Dependencies

None for audit start. Decisions in `docs/UNRESOLVED_QUESTIONS.md` are dependencies for later tasks, not permission to infer answers here.

## Files allowed to change

- `docs/MASTER_TASK_ROADMAP.md`
- `docs/CURRENT_STATE.draft.md`
- `docs/UNRESOLVED_QUESTIONS.md`
- `docs/tasks/TASK-001.md`
- `docs/tasks/TASK-002.md`
- `docs/tasks/TASK-003.md`

## Files prohibited from changing

All other files, especially `CV_Manager_React/src/**`, server files, Prompt/Agent/mode files, tests, data, CV artifacts, specs and configuration.

## Implementation requirements

- Read-only inspect the project and complete the six allowed documents.
- Every material conclusion must cite a file plus symbol/component/flow node where applicable.
- Use only the four approved confidence labels.
- Distinguish observed runtime, documented intent, historical/reference artifacts and missing evidence.
- Do not run TASK-002/003 or expand scope when a new issue is found.

## Acceptance criteria

- Module index, runtime flow, Agent/Prompt inventory, mutation map and spec/code comparison are present.
- All seven documented screening stages have inputs, outputs and owner evidence.
- Actual and ideal CV evidence is either identified or explicitly marked insufficient.
- TASK-001 alone is READY; TASK-002/003 are BLOCKED.
- Only the six allowed Markdown files changed.

## Required tests

- `git diff --check`
- Targeted status/file check confirming only allowed docs changed by this task.
- Content check for all required Task headings and allowed confidence vocabulary.
- No production build/test is required because no production code is changed; existing tests are inventoried, not rerun as behavioral proof.

## Regression risks

- Documentation may accidentally present intent as implementation.
- Archived/legacy artifacts may be mistaken for canonical behavior.
- Sensitive or large CV/data content may be copied unnecessarily.

## Rollback method

Remove only the six newly created Markdown files, after confirming they were created by this task and contain no prior user work.

## Definition of done

All acceptance checks pass, unresolved evidence is recorded, a Completion Report is issued, and work stops before TASK-002.

## Completion report format

```text
TASK-001 Completion Report
Status: COMPLETE | INCOMPLETE
Files created:
Evidence reviewed:
Confirmed findings:
Unresolved / insufficient evidence:
Validation:
Production code changed: No
Next task status: TASK-002 remains BLOCKED
```

## Completion Report

TASK-001 Completion Report  
Status: COMPLETE  
Files created: `docs/MASTER_TASK_ROADMAP.md`, `docs/CURRENT_STATE.draft.md`, `docs/UNRESOLVED_QUESTIONS.md`, `docs/tasks/TASK-001.md`, `docs/tasks/TASK-002.md`, `docs/tasks/TASK-003.md`  
Evidence reviewed: `CV_Manager_React/docs/{SPEC,FLOW,ARCHITECTURE}.md`; React runtime owners in `src/`, Node persistence/automation owners, prompt/mode files, smoke-test inventory, persisted CV artifacts and reference/source folders  
Confirmed findings: Active surface is the React app; canonical persistence is revisioned `data/app_data.json`; seven documented screening stages and their owners are reconstructed; explicit Codex automation supports screening analysis and screening CV; produced CV artifacts exist  
Unresolved / insufficient evidence: canonical stage authority, exact actual-CV audit target, canonical ideal CV, mode status, Agent definition, legacy builder support, contract approver, PDF acceptance settings, terminal Application Log behavior, and `PROJECT_SPEC.md` authority  
Validation: Required headings and confidence vocabulary checked; referenced task paths checked; allowed-file scope checked. `git diff --check` and Git changed-file verification were unavailable because this directory is not a Git repository  
Production code changed: No  
Next task status: TASK-002 remains BLOCKED
