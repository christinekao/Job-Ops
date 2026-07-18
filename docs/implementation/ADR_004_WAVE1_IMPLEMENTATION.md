# ADR-004-W1 - Truthful Positioning Policy Implementation

Status: COMPLETE

Date: 2026-07-17

AI: Codex

Model: GPT-5.6 Sol

Reasoning: High

Scope: Wave 1 only. Positioning Policy, Writer behavior, and Positioning Report. No Reviewer, Repair, Export, persistence migration, or runtime pipeline redesign.

## Summary

Wave 1 implements the Truthful Positioning Policy at the Analysis-to-Writer boundary.

The Writer now receives a structured Positioning Report and explicit instructions that fit tier must never block CV generation. Fit tier only changes positioning strategy:

- Good Fit: direct supported positioning.
- Risky Fit: conservative adjacent positioning.
- Weak / Avoid: still generate, but use truthful transferable positioning.

The Positioning Report is a read-only derived view of `ScreeningAnalysis`. It does not recompute fit tier, positioning, or capability gaps, and it is not a new source of truth.

## Files Modified

Production:

- `CV_Manager_React/src/types.ts`
- `CV_Manager_React/src/domain/positioningPolicy.ts`
- `CV_Manager_React/src/promptBuilders.ts`
- `CV_Manager_React/src/data/selection.ts`
- `CV_Manager_React/src/components/cv/utils.ts`

Tests / validation:

- `CV_Manager_React/scripts/smoke-positioning-policy.mjs`
- `CV_Manager_React/scripts/smoke-summary-quality-contract.mjs`
- `CV_Manager_React/scripts/smoke-summary-generator-review-alignment.mjs`
- `CV_Manager_React/package.json`

Documentation:

- `docs/implementation/ADR_004_WAVE1_IMPLEMENTATION.md`

## Architecture Impact

No pipeline architecture change.

The existing flow remains:

```text
JD Analysis -> Evidence Selection -> CV Brief -> Writer Context -> Writer Prompt -> CV Output -> Review/Repair/Export
```

Wave 1 adds one read-only projection:

```text
ScreeningAnalysis -> PositioningReport derived view -> Writer Context / Writer Prompt
```

`ScreeningAnalysis` remains the positioning authority. Positioning Report is only a structured presentation of existing Analysis fields:

- `positioning.applyTier`
- `positioning.safestPositioning`
- `positioning.headlineRecommendation`
- `positioning.claimsToAvoid`
- `jdEvidenceMapping`
- `remainingGaps`
- `riskyClaims`
- `summaryAngle`

## Runtime Impact

Implemented:

- Added optional `PositioningReport` type.
- Added optional `screeningAnalysis.positioningReport`.
- Added optional `tailoredCv.positioningReport`.
- Added `buildPositioningReport()` as a deterministic read-only projection of Screening Analysis.
- Added Positioning Report to Writer context.
- Updated Screening Analysis prompt schema to request Positioning Report.
- Updated Writer prompt policy so Good/Risky/Weak affects wording strategy, not generation permission.
- Updated Writer output schema to include informational `positioningReport`.
- Updated CV Brief construction to consume the derived report for claims-to-avoid and truthful positioning wording.
- Updated CV normalizer to preserve optional `positioningReport` from Writer output.

Not implemented:

- Reviewer scoring changes.
- Repair routing changes.
- Export decision changes.
- Persistence migration.
- Runtime data rewrite.
- Hidden AI or automatic generation.

## Backward Compatibility

Backward compatible.

- Existing saved `ScreeningAnalysis` records without `positioningReport` still work.
- Existing saved CVs without `tailoredCv.positioningReport` still normalize and render.
- Existing `ReviewSnapshot` records are unchanged.
- Existing generation context remains valid.
- No canonical runtime data migration was performed.

Fallback behavior:

- If `screeningAnalysis.positioningReport` exists, it is reused.
- If absent, `buildPositioningReport()` derives a read-only report from existing `ScreeningAnalysis` fields.
- The fallback does not read EvidenceCard data or recompute fit independently.

## Known Limitations

- Positioning Report is not yet surfaced as a dedicated UI panel.
- Reviewer still uses current scoring and current blocker categories.
- Repair still uses current routing behavior.
- Export decision remains unchanged.
- Observability root cause from `ARCH_VERIFY_001_REPORT.md` remains unsolved.
- Real AI Azure Solution Specialist acceptance was not run in this Wave 1 validation.

## Regression Results

Passed:

- `npm run smoke:positioning-policy`
- `npm run smoke:writer-input`
- `npm run smoke:cv-brief`
- `npm run smoke:writer-output`
- `npm run smoke:summary-quality-contract`
- `npm run smoke:summary-generator-review-alignment`
- `npm run build`

Notes:

- `smoke:summary-quality-contract` and `smoke:summary-generator-review-alignment` had fixture selection updated to choose a Microsoft/Azure job that actually has a `tailoredCv`. This does not change production behavior.
- Browser E2E and real AI execution were not run because Wave 1 validation did not require localhost/browser or token-spending runtime.

## Case Validation

### Case A - Good Fit

Result: pass.

Good Fit maps to `overallFit: Good`. Writer prompt still generates normally and may use direct positioning only when supported by Analysis/evidence constraints.

### Case B - Risky Fit

Result: pass.

Risky Fit maps to `overallFit: Risky`. Writer prompt still generates, but uses conservative adjacent wording and includes risk context through Positioning Report.

### Case C - Weak Fit / Azure Solution Specialist

Result: pass.

Weak / Avoid maps to `overallFit: Weak`. Writer prompt still generates and explicitly prohibits unsupported Azure sales, quota, enterprise deal, architecture, ownership, leadership, metric, tool, title, or scope claims.

Expected behavior remains:

- CV generation succeeds.
- Review may still fail.
- Export may still be blocked.
- Unsupported Azure sales wording should not be introduced by Writer policy.

## Success Criteria Check

| Criterion | Result |
|---|---|
| Weak Fit still generates a CV | Pass |
| No unsupported wording is introduced by policy | Pass |
| Writer follows Analysis positioning | Pass |
| Positioning Report is generated | Pass |
| Existing architecture remains unchanged | Pass |
| Reviewer unchanged | Pass |
| Repair unchanged | Pass |
| Export unchanged | Pass |

## Stop Point

Wave 1 is complete.

Do not begin Wave 2 without explicit authorization.
