# CV Gap Analysis

Status: TASK-003 findings for `cv-mr4q83lz-cidl0` and `jd-mpy6kou0-ctiw9`.

## Quality Findings

| Finding | Earliest confirmed stage | Evidence | Severity | Confidence |
|---|---|---|---|---|
| The current Brief cannot be proven to be the Brief used for this CV | CV Brief / Writer input boundary | CV generation: `2026-07-03T09:24:05.831Z`; current Brief generation: `2026-07-11T11:22:16.544Z`; generation context has no Brief identity/hash | High | Confirmed |
| Five prior-role bullets have no evidence IDs | Writer output/current CV | 5 of 14 persisted work bullets have empty `evidenceIds` | High | Confirmed |
| Three current visible bullets cite evidence outside recorded generation context | Writer output or later CV mutation | IDs exist globally and on the Job, but are absent from `generationContext.selectedEvidenceIds` | High | Confirmed |
| Four context-selected evidence cards are not cited by current visible bullets | Writer output/current CV | Context-to-output comparison | Medium | Confirmed |
| Review correctly reports the CV is not ready, but persisted snapshot contains only issue counts | Review/reporting boundary | `ready=false`, 2 gate issues, 3 reviewer issues; no persisted issue detail in snapshot | Medium | Confirmed |

## Earliest Failure Assessment

The earliest confirmed trace break is the CV Brief / Writer input boundary: persisted timestamps prove the current Brief post-dates the recorded CV generation, so the exact Writer plan used cannot be reconstructed from current state.

The first confirmed visible-quality defects are in the persisted Writer output/current CV: 5 bullets lack evidence IDs, and 3 cited evidence IDs are outside the recorded generation context. Because the CV was updated after generation, repository evidence cannot distinguish initial Writer output defects from later local/manual repair. That distinction remains `Insufficient evidence`.

## Contract Impact

- `CV_BRIEF.md`: needs a reproducible fixture baseline and an explicit policy for empty `bulletPlan`.
- `WRITER_INPUT.md`: future tests should bind the prompt to an identifiable Brief snapshot/hash.
- `WRITER_OUTPUT.md`: future validation should reject or flag visible work bullets without evidence trace where evidence is required.
- `REVIEW.md`: issue counts correctly block readiness, but detailed persisted diagnostics may need a future bounded task if required.

These findings move future work closer to `QUALITY_SPEC.md` by identifying the earliest evidenced boundary rather than treating a CV document as a canonical oracle.

