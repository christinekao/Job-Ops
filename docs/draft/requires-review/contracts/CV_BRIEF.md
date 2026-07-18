Status: DRAFT
Authority: REFERENCE
Can Authorize Production Implementation: NO
Does Not Override: docs/architecture/CURRENT_ARCHITECTURE.md
Reason for Draft Status: Contract index identifies this as draft/reference material.
Required Decision Before Activation: Explicit contract approval.

# Contract: CV Brief

Owner:

- `CV_Manager_React/src/data/selection.ts` `buildCvBrief`
- Type: `CV_Manager_React/src/types.ts` `CvBrief`

## Preconditions

- `job.screeningAnalysis` exists.
- Selected evidence IDs are valid enough to produce visible evidence.

## Output Fields

- `targetPositioning`
- `managerHiringProblem`
- `top3SellingPoints`
- `mustShowEvidenceIds`
- `supportingEvidenceIds`
- `skillsToForeground`
- `skillsToSuppress`
- `claimsToAvoid`
- `cvHeadline`
- `summaryAngle`
- `firstSectionTheme`
- `bulletPlan`
- `generatedAt`

## Contract Rules

- Brief must be built before Screening CV generation.
- `mustShowEvidenceIds` must reference visible, supported evidence.
- `claimsToAvoid` must carry forward risky claims from Screening Analysis and evidence-level forbidden claims.
- Brief must not invent evidence.
- Every consumer must resolve the Brief through `resolveEffectiveCvBrief`.
- A persisted Brief is reusable only when `isCvBriefUsable` passes and its content identity matches the current derived Brief.
- `generatedAt` is excluded from content identity.
- UI readiness, Writer input, input hashes, and GenerationContext must use the same effective Brief content.

Evidence: `buildCvBrief` implementation and `CvBrief` type.

Confidence: Confirmed.

## Known Gaps

- `npm run smoke:cv-brief` now covers required fields, missing analysis, visible-evidence filtering, claim suppression, and empty must-show evidence.
- Current policy: when analysis exists but no valid visible evidence is selected, `buildCvBrief` returns an inspectable Brief with empty `mustShowEvidenceIds`; downstream readiness/Writer input must warn or block rather than invent evidence.
- Brief identity binding to Writer input remains a separate Writer-input contract concern.
- Phase 2 Wave 1 implemented effective Brief identity binding and legacy-hash compatibility without runtime-data migration.
