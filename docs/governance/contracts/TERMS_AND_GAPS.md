# Contract: Terms and Gaps

Owner:

- `CV_Manager_React/src/domain/screeningReadiness.ts` `terminologyAndGapReview`
- Data source: `ScreeningAnalysis.internalTerminology`, `ScreeningAnalysis.remainingGaps`, selected evidence blocked terms

## Input

| Field | Source | Required | Confidence |
|---|---|---:|---|
| selected job | `JobApplication` | yes | Confirmed |
| app data | `AppData` | yes | Confirmed |
| internal terminology | `job.screeningAnalysis.internalTerminology` | conditional | Confirmed |
| remaining gaps | `job.screeningAnalysis.remainingGaps` | conditional | Confirmed |
| selected evidence blocked terms | `EvidenceCard.blockedVisibleTerms` | conditional | Confirmed |

## Output

- `ready`
- `selectedBlockedTerms`
- `unmappedBlockedTerms`
- `highRiskGaps`
- `mediumRiskGaps`
- `mappingCounts`
- displayable checks

## Contract Rules

- Selected evidence blocked terms must be surfaced before CV generation.
- High-risk gaps must remain visible; they cannot be converted into unsupported CV strengths.
- Terms/Gaps may warn or block based on risk, but the exact blocker policy needs implementation-task validation.

Confidence: Possible.

Current output shape is confirmed. Final blocking policy still needs implementation-task validation.
