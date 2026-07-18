# Contract: Export

Owner:

- Readiness: `CV_Manager_React/src/domain/screeningReview.ts` `exportVerification`
- Type: `CV_Manager_React/src/types.ts` `ExportSnapshot`
- UI: `CV_Manager_React/src/components/tabs/Export.tsx`, `src/components/cv/CVStudio.tsx`

## Input

- Current `CvVersion`
- Selected `JobApplication`
- Local gate/review results
- Export target UI/action

## Output

`ExportSnapshot` fields:

- `id`
- `exportedAt`
- `fileName`
- `jobId`
- `versionName`
- `jdContentHash`
- `cvContentHash`
- `generationContext`
- `qualityScore`
- `applied`

Evidence: `src/types.ts`.

Confidence: Confirmed.

## Contract Rules

- Export should happen only after local review is acceptable or user explicitly overrides.
- Export readiness is not the same as manager relevance.
- Export must not silently mutate evidence, analysis, or CV content.

Evidence: `SPEC.md`, `FLOW.md`, `ARCHITECTURE.md`, `exportVerification`.

Confidence: Highly likely.

Type/readiness existence is confirmed. End-to-end export UI behavior was not executed in this phase.

## Known Gaps

- This phase did not execute browser/PDF export.
- `npm run smoke:export-readiness` now covers export-ready and failing contact/text-depth/work-depth/composed-content fixtures.
- Export readiness remains explicitly separate from hiring-manager relevance.
- Browser rendering and PDF visual-golden validation remain outside this fixture contract.
