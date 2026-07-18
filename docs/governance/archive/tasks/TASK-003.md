# TASK-003 - Trace Actual CV Quality Gap

Status: DONE

## Objective

Trace one actual generated CV from evidence selection through CV Brief, Writer input, Writer output, and local review.

## Problem

The project has actual CV versions, but the earliest confirmed point of quality loss has not been traced.

## Root Cause Addressed

Unknown whether poor CV quality comes from data, selection, brief, prompt, writer output, review, repair, or user expectations.

## Evidence

- `CV_Manager_React/data/app_data.json`
- `docs/governance/QUALITY_SPEC.md`
- `docs/governance/contracts/*`
- canonical reference from TASK-002, if any

## Dependencies

- TASK-001 accepted.
- TASK-002 completed or explicitly waived.

## Files Allowed to Change

- `docs/governance/CV_TRACEABILITY.md`
- `docs/governance/CV_GAP_ANALYSIS.md`
- `docs/governance/UNRESOLVED_QUESTIONS.md`
- `docs/governance/tasks/TASK-003.md`

## Files Prohibited from Changing

- `CV_Manager_React/data/**`
- Production code
- Prompts
- Tests
- CV artifacts

## Implementation Requirements

- Pick one generated `CvVersion` and one linked `JobApplication`.
- Trace `selectedEvidenceIds`, `cvBrief`, `generationContext`, `tailoredCv`, and `reviewSnapshot`.
- Use only confirmed evidence.
- Mark unsupported or missing fields as `Insufficient evidence`.

## Acceptance Criteria

- [x] Each major visible work bullet is traced to evidence or marked unsupported.
- [x] Each quality gap has an earliest confirmed stage.
- [x] No runtime data is changed.

## Required Tests

Documentation consistency only.

## Regression Risks

Low.

## Rollback Method

Delete or revert generated trace docs.

## Definition of Done

The next implementation task can target a confirmed failure point.

## Completion Report Format

```text
Task: TASK-003
Status:
CV analyzed:
Job analyzed:
Confirmed gaps:
Earliest failure stages:
Follow-up tasks:
```

## Completion Report

Task: TASK-003  
Status: COMPLETE  
CV analyzed: `cv-mr4q83lz-cidl0`  
Job analyzed: `jd-mpy6kou0-ctiw9`  
Confirmed gaps: current Brief cannot be proven as generation input; 5/14 bullets lack evidence IDs; 3 cited IDs fall outside generation context; 4 context evidence IDs are not cited  
Earliest failure stages: CV Brief / Writer input identity boundary; persisted Writer output/current CV  
Follow-up tasks: TASK-004 is dependency-eligible because the trace confirms Brief fixture/policy gaps; it remains subject to separate promotion after validation
