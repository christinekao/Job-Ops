# Contract Index

Status: Governance v1 contract index.

Contracts are source-grounded drafts/reference material until an explicit approval record promotes them. They are stored under `docs/draft/requires-review/contracts/` and cannot independently authorize production implementation.

The following implemented, code-grounded references describe current runtime
ownership but also cannot independently authorize implementation:

| Contract | Current Owner | Status |
|---|---|---|
| `contracts/SCREENING_FIT_PRODUCT_CONTRACT.md` | Screening schema, requirement inventory, P8 positioning policy | Active code-grounded reference |
| `contracts/SCREENING_PROMPT_CONTEXT_CONTRACT.md` | Screening schema/validator and Prompt builder | Active code-grounded reference |
| `contracts/JD_NORMALIZATION_CONTRACT.md` | JD import service and canonical JD helpers | Active code-grounded reference |
| `contracts/REQUIREMENT_INVENTORY_CONTRACT.md` | Canonical reconstruction, atomic inventory, lineage, dedup, and ID owner | Active code-grounded reference |

| Contract | Current Owner | Runtime Type / Symbol | Status | Confidence |
|---|---|---|---|---|
| `../../draft/requires-review/contracts/JD_ANALYSIS.md` | `src/promptBuilders.ts`, `src/types.ts` | `buildScreeningAnalysisPrompt`, `ScreeningAnalysis` | Draft/reference | Confirmed |
| `../../draft/requires-review/contracts/TERMS_AND_GAPS.md` | `src/domain/screeningReadiness.ts`, `src/types.ts` | `terminologyAndGapReview`, `ScreeningAnalysis.internalTerminology`, `remainingGaps` | Draft/reference | Confirmed |
| `../../draft/requires-review/contracts/EVIDENCE_SELECTION.md` | `src/data/selection.ts`, `src/types.ts` | selected IDs, `selectionDiagnostics`, `evidenceSelectionQualityDiagnostics` | Draft/reference | Confirmed |
| `../../draft/requires-review/contracts/CV_BRIEF.md` | `src/data/selection.ts`, `src/types.ts` | `buildCvBrief`, `resolveEffectiveCvBrief`, `cvBriefIdentityHash` | Draft/reference | Confirmed |
| `../../draft/requires-review/contracts/WRITER_INPUT.md` | `src/promptBuilders.ts`, `src/data/selection.ts` | `buildScreeningCvPrompt`, `buildScreeningCvWriterContext`, `GenerationContext`, optional `fixContext` | Draft/reference | Confirmed |
| `../../draft/requires-review/contracts/WRITER_OUTPUT.md` | `src/types.ts`, `ScreeningLab.tsx` | `TailoredCv`, `CvVersion`, `applyScreeningCvResult` | Draft/reference | Confirmed |
| `../../draft/requires-review/contracts/REVIEW.md` | `src/domain/screeningReview.ts` | `screeningGate`, `hiringManagerReview`, `reviewerPass`, `exportVerification`, `createReviewSnapshot` | Draft/reference | Confirmed |
| `../../draft/requires-review/contracts/REPAIR.md` | `src/domain/screeningReview.ts`, `ScreeningLab.tsx` | `RepairAction`, `classifyRepairActions`, local fix functions | Draft/reference | Confirmed |
| `../../draft/requires-review/contracts/EXPORT.md` | `src/types.ts`, `src/domain/screeningReview.ts`, `components/tabs/Export.tsx` | `ExportSnapshot`, `exportVerification` | Draft/reference | Highly likely |

## Contract Rule

Changing a contract requires:

- a task that names the contract
- affected owner files
- downstream consumers
- required tests
- migration/rollback plan
- update to this index
