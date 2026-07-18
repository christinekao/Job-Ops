Status: DRAFT
Authority: REFERENCE
Can Authorize Production Implementation: NO
Does Not Override: docs/architecture/CURRENT_ARCHITECTURE.md
Reason for Draft Status: Contract index identifies this as draft/reference material.
Required Decision Before Activation: Explicit contract approval.

# Contract: Writer Output

Owner:

- Type: `CV_Manager_React/src/types.ts` `TailoredCv`
- Apply path: `CV_Manager_React/src/components/tabs/ScreeningLab.tsx` `applyScreeningCvResult`
- Persisted wrapper: `CvVersion`

## Accepted Shape

Runtime prompt allows either:

- `{ "tailoredCv": { ... } }`
- or direct CV object with keys like `header`, `sidebar`, `summary`, `workExperience`

Expected normalized data:

- `TailoredCv.header`
- `TailoredCv.sidebar`
- `TailoredCv.summary`
- `TailoredCv.workExperience[]`
- `TailoredCv.reviewNotes[]`
- optional `TailoredCv.jdAnalysis`
- optional `TailoredCv.keywordPlacementNotes`
- optional `TailoredCv.interviewNotes`

## Persisted Result

Stored as `CvVersion` with:

- `id`
- `jdId`
- `name`
- `summary`
- `content`
- `sections`
- `tailoredCv`
- `generationContext`
- `status`
- `reviewSnapshot`
- `updatedAt`

Evidence: `types.ts`, `ScreeningLab.tsx` references.

Confidence: Confirmed.

## Output Rules

- Work bullets should include `evidenceIds` when supported.
- Unsupported claims must not appear as visible promises.
- Visible text must avoid internal names and raw evidence metadata.
- Output should include enough section structure for export checks.

## Known Gaps

- `validateScreeningCvOutput` now validates normalized output before `CvVersion` creation, save, or review snapshot creation.
- Required apply boundary: candidate name, target role, summary, at least one work role, company, role title, and at least one bullet per role.
- `npm run smoke:writer-output` covers valid output and malformed-but-JSON missing-field cases.
