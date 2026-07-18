# Contract Index

Status: Governance v1 contract index.

Contracts in this folder describe intended stable boundaries. They are source-grounded drafts until implementation tasks validate and, where needed, enforce them.

| Contract | Current Owner | Runtime Type / Symbol | Status | Confidence |
|---|---|---|---|---|
| `contracts/JD_ANALYSIS.md` | `src/promptBuilders.ts`, `src/types.ts` | `buildScreeningAnalysisPrompt`, `ScreeningAnalysis` | Draft from current code | Confirmed |
| `contracts/TERMS_AND_GAPS.md` | `src/domain/screeningReadiness.ts`, `src/types.ts` | `terminologyAndGapReview`, `ScreeningAnalysis.internalTerminology`, `remainingGaps` | Draft from current code | Confirmed |
| `contracts/EVIDENCE_SELECTION.md` | `src/data/selection.ts`, `src/types.ts` | selected IDs, `selectionDiagnostics`, `evidenceSelectionQualityDiagnostics` | Wave 1 enforced | Confirmed |
| `contracts/CV_BRIEF.md` | `src/data/selection.ts`, `src/types.ts` | `buildCvBrief`, `resolveEffectiveCvBrief`, `cvBriefIdentityHash` | Wave 1 enforced | Confirmed |
| `contracts/WRITER_INPUT.md` | `src/promptBuilders.ts`, `src/data/selection.ts` | `buildScreeningCvPrompt`, `buildScreeningCvWriterContext`, `GenerationContext`, optional `fixContext` | Wave 1 enforced | Confirmed |
| `contracts/WRITER_OUTPUT.md` | `src/types.ts`, `ScreeningLab.tsx` | `TailoredCv`, `CvVersion`, `applyScreeningCvResult` | Draft from current code | Confirmed |
| `contracts/REVIEW.md` | `src/domain/screeningReview.ts` | `screeningGate`, `hiringManagerReview`, `reviewerPass`, `exportVerification`, `createReviewSnapshot` | Draft from current code | Confirmed |
| `contracts/REPAIR.md` | `src/domain/screeningReview.ts`, `ScreeningLab.tsx` | `RepairAction`, `classifyRepairActions`, local fix functions | Draft; extraction required | Confirmed |
| `contracts/EXPORT.md` | `src/types.ts`, `src/domain/screeningReview.ts`, `components/tabs/Export.tsx` | `ExportSnapshot`, `exportVerification` | Draft; export runtime not executed in this phase | Highly likely |

## Contract Rule

Changing a contract requires:

- a task that names the contract
- affected owner files
- downstream consumers
- required tests
- migration/rollback plan
- update to this index
