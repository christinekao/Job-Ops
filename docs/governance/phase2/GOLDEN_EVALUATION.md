# Golden Evaluation System

Status: Permanent Phase 2 CV quality evaluation framework.

Scope: This framework evaluates CV output quality after future implementation waves. It does not authorize production-code changes, prompt changes, governance-rule changes, architecture redesign, or task execution.

## Purpose

Answer one question after every future implementation wave:

```text
Did the latest implementation produce a better CV?
```

Engineering checks still verify build, workflow, and regression integrity. Golden Evaluation verifies whether the generated CV is closer to the repository quality goal: a JD-specific, evidence-backed CV that passes HR review and gives a hiring manager a credible reason to interview.

## Evidence Basis

Use this evidence priority:

1. Current explicit user instruction
2. `docs/governance/QUALITY_SPEC.md`
3. `docs/governance/phase2/CV_PIPELINE_AUDIT.md`
4. `docs/governance/phase2/QUALITY_GAP_ANALYSIS.md`
5. `docs/governance/phase2/ROOT_CAUSE_ANALYSIS.md`
6. Phase 2 implementation planning outputs
7. Current generated CV examples and source-grounded evidence

No historical or generated CV is a canonical ideal. Per ADR-001, quality is evaluated per JD against quality rules, contracts, and evidence.

## Required Evaluation Inputs

Each evaluation run must identify:

| Input | Required | Source |
|---|---:|---|
| Selected JD | Yes | Current job record |
| Screening Analysis | Yes | Current job analysis |
| Effective CV Brief | Yes | Effective Brief used by Writer |
| Evidence priority list | Yes | Effective Brief and selection |
| Writer input snapshot/hash | Yes | Generation context when available |
| Writer output CV | Yes | Current generated CV |
| Review output | Yes | Gate, manager, ATS, reviewer results |
| Repair output | If repair ran | CV before and after repair |
| Export readiness result | Yes | Export verification |
| Previous baseline score | If available | Prior `WAVE_REVIEW_TEMPLATE.md` instance or scorecard |

If a required input is unavailable, mark the affected metric as `Blocked` and explain the missing evidence. Do not infer unavailable data.

## Standard Procedure

After every future implementation wave:

1. Generate or select the evaluation CV for the same JD used by the wave validation.
2. Capture the JD, effective Brief, evidence priority list, Writer input identity, Writer output, review result, repair result if any, and export readiness.
3. Score the CV with `QUALITY_SCORECARD.md`.
4. Run the checks in `QUALITY_REGRESSION_CHECKLIST.md`.
5. Compare the current score against the previous baseline.
6. Complete `WAVE_REVIEW_TEMPLATE.md`.
7. Classify the wave result as `Improved`, `Unchanged`, `Regressed`, or `Blocked`.

## Baseline Comparison Rules

| Result | Rule |
|---|---|
| Improved | Total score increases by at least 5 points and no Critical metric regresses below passing threshold |
| Unchanged | Total score changes by -4 to +4 points and no Critical metric newly fails |
| Regressed | Total score decreases by at least 5 points, or any Critical metric newly falls below passing threshold |
| Blocked | Required inputs are missing for one or more Critical metrics |

Critical metrics:

- Evidence Traceability
- Unsupported Claims
- JD Alignment
- Repair Damage
- Export Readiness

## Evaluation Categories

The permanent categories are defined in `QUALITY_METRICS.md` and scored in `QUALITY_SCORECARD.md`:

1. JD Alignment
2. Evidence Coverage
3. Evidence Traceability
4. Business Impact
5. Technical Depth
6. Narrative Consistency
7. Career Positioning
8. ATS Readiness
9. Hiring Manager Readability
10. HR Readability
11. Internal Terminology Leakage
12. Duplicate Content
13. Unsupported Claims
14. Repair Damage
15. Export Readiness

## Regression Detection

Golden Evaluation must detect:

- lost evidence
- lost business impact
- weaker technical depth
- new hallucinations
- broken narrative
- duplicate bullets
- reviewer damage
- repair damage
- ATS regression
- export regression

Use `QUALITY_REGRESSION_CHECKLIST.md` for the required evidence rows.

## Confidence Labels

Use only:

- Confirmed
- Highly likely
- Possible
- Insufficient evidence

Do not mark a quality failure as Confirmed unless the CV text, evidence source, review result, or export result directly supports the finding.

## Maintenance

Maintenance cost should remain low:

- Update weights only when `QUALITY_SPEC.md` changes.
- Add examples only when new persisted CV defects are confirmed.
- Keep the scorecard stable across waves so deltas remain comparable.
- Do not turn this framework into implementation tasks; new implementation work belongs in the Phase 2 roadmap.
