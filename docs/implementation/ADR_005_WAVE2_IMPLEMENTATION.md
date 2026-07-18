# ADR-005 Wave 2 Implementation

Status: COMPLETE  
Date: 2026-07-17  
AI: Codex  
Model: GPT-5.6 Sol  
Reasoning: High  
Scope: ADR-005 Reviewer Policy only. No Repair redesign, Export redesign, Writer redesign, ScreeningAnalysis redesign, Positioning Policy change, prompt redesign, runtime pipeline redesign, or persistence migration.

## Executive Summary

ADR-005 Wave 2 implements the Reviewer Policy as a structured review output layer while preserving existing reviewer behavior.

The Reviewer is now:

- an ADR-004 policy consumer;
- a structured issue producer;
- a source of repair intent and export recommendation input.

The Reviewer is not:

- a positioning authority;
- a Writer;
- a Repair engine;
- an Export engine.

Existing reviewer `checks`, `blockers`, `ready`, and export decision behavior remain intact for backward compatibility. The implementation adds structured review data alongside existing outputs instead of replacing the current review pipeline.

## Files Changed

Production:

- `CV_Manager_React/src/types.ts`
- `CV_Manager_React/src/domain/screeningReview.ts`
- `CV_Manager_React/package.json`

Validation:

- `CV_Manager_React/scripts/smoke-reviewer-policy.mjs`

Documentation:

- `docs/implementation/ADR_005_WAVE2_IMPLEMENTATION.md`

## Architectural Decisions

### 1. Additive structured result

Wave 2 adds `structuredResult` to `reviewerPass()` output and `structuredReviewResult` to `CvVersion.reviewSnapshot`.

Existing legacy fields remain:

- `ready`
- `blockers`
- `checks`
- `recommendation`
- `reviewSnapshot.gateIssueCount`
- `reviewSnapshot.reviewerIssueCount`
- `reviewSnapshot.summaryReviewResult`

This avoids a Reviewer/Repair/Export redesign and keeps legacy snapshots readable.

### 2. Reviewer remains downstream of ADR-004

Structured issues reference upstream authority:

- `positioningAuthority: "ScreeningAnalysis"`
- `positioningReportMode: "read-only-derived-view"`
- issue evidence paths such as:
  - `screeningAnalysis.jdEvidenceMapping|remainingGaps`
  - `positioningReport.truthfulCapabilityGaps`
  - `positioningReport.unsupportedClaimsPrevented`

Reviewer does not recompute Fit Tier, positioning, or capability gaps.

### 3. Export remains unchanged

Reviewer now emits `exportRecommendationInput`, but `screeningExportDecision.ts` is unchanged.

Export still decides:

- final readiness;
- blocker merging;
- warning handling;
- review freshness;
- export status.

### 4. Repair remains unchanged

Reviewer now emits `repairContract.issues`, but `repairOrchestrator.ts` is unchanged.

Repair still owns:

- routing;
- repair execution;
- safe/local/AI/human decision handling.

## Contracts Implemented

### Structured Review Result

Implemented types:

- `ReviewerStatus`
- `ReviewerTruthfulnessStatus`
- `ReviewerIssueCategory`
- `ReviewerSeverity`
- `ReviewerRepairability`
- `ReviewerIssue`
- `ReviewerStructuredResult`

Implemented fields:

- `status`
- `truthfulnessStatus`
- `reviewedCvVersionId`
- `reviewedCvContentHash`
- `reviewedAt`
- `positioningAuthority`
- `positioningReportMode`
- `issues`
- `summary`
- `repairContract`
- `exportRecommendationInput`

### Review Summary

Structured summary includes:

- `unsupportedClaimCount`
- `capabilityGapCount`
- `evidenceMissingCount`
- `repairableIssueCount`
- `exportBlockingIssueCount`

### Structured Issues

Each issue includes:

- stable issue id;
- category;
- severity;
- title;
- description;
- optional visible location;
- evidence paths;
- repairability;
- suggested repair intent;
- expected repair boundary;
- export signal.

## Issue Taxonomy Implementation

Implemented categories:

- `Unsupported Claim`
- `Evidence Missing`
- `Capability Gap`
- `External Wording`
- `Keyword Coverage`
- `Formatting`
- `Profile Completeness`
- `Policy Violation`

Current Wave 2 mappings:

| Runtime condition | Structured category |
|---|---|
| Visible unsupported mapping/high-risk gap claim | `Unsupported Claim` |
| Insufficient valid evidence IDs on visible bullets | `Evidence Missing` |
| Positioning Report / Analysis capability gap | `Capability Gap` |
| Supported missing keywords | `Keyword Coverage` |
| Summary rewrite need, weak action/outcome bullets, work-log/internal wording | `External Wording` |
| Missing trusted name/email/location | `Profile Completeness` |

`Formatting` and `Policy Violation` are included in the type contract for ADR-005 completeness. No current reviewer check maps directly to them in this minimal implementation.

## Severity Implementation

Implemented severities:

- `Critical`
- `High`
- `Medium`
- `Low`
- `Informational`

Current severity mappings:

| Category | Current severity |
|---|---|
| Unsupported Claim | `Critical` |
| Evidence Missing | `High` |
| Capability Gap | `Medium` or `Informational` |
| Keyword Coverage | `Medium` |
| External Wording | `Medium` |
| Profile Completeness | `High` |

Severity does not by itself change legacy reviewer/export readiness. It is carried as structured metadata for later Repair/Export policy work.

## Repair Contract Implementation

Reviewer emits repair intent only.

Implemented fields:

- `repairability`
- `suggestedRepairIntent`
- `expectedRepairBoundary`
- `repairContract.issues`

Examples:

- Unsupported Claim:
  - repairability: `targeted-repair`
  - intent: remove or downgrade unsupported visible claim
  - boundary: summary / workExperience / skills

- Capability Gap:
  - repairability: `not-repairable`
  - intent: do not rewrite as solved strength; add evidence or change target upstream
  - boundary: none

- Profile Completeness:
  - repairability: `human-input`
  - intent: collect trusted contact data
  - boundary: `header.contact`

Reviewer does not repair, rewrite, or execute mutations.

## Export Contract Implementation

Reviewer emits export recommendation input only.

Implemented fields:

- `exportRecommendationInput.reviewStatus`
- `exportRecommendationInput.exportBlockingIssues`
- `exportRecommendationInput.exportWarnings`
- `exportRecommendationInput.truthfulness`
- `exportRecommendationInput.documentReadiness`

Export logic remains unchanged. This satisfies Wave 2 without implementing Export redesign.

## Backward Compatibility

Backward compatible.

- Existing review snapshots without `structuredReviewResult` remain readable.
- Existing reviewer checks/blockers still exist.
- Existing export decision logic still reads existing `reviewerReview.blockers` and `checks`.
- Existing Repair still receives existing blocker strings.
- No persistence migration was performed.

New snapshots may include `structuredReviewResult`; old snapshots do not require it.

## Known Limitations

- Structured issues are not yet consumed by Repair.
- Structured export signals are not yet consumed by Export.
- UI does not yet surface structured issue taxonomy.
- Existing legacy `ready/blockers` behavior remains unchanged, so current export blocking may still look like pre-ADR-005 until later waves consume structured results.
- `Formatting` and `Policy Violation` are defined in the contract but not broadly populated by current checks.
- Reviewer still produces legacy prose blockers for compatibility.

## Validation Executed

Passed:

- `npm run smoke:reviewer-policy`
- `npm run smoke:reviewer`
- `npm run smoke:writer-input`
- `npm run smoke:writer-output`
- `npm run smoke:summary-generator-review-alignment`
- `npm run build`

## Success Criteria Check

| Criterion | Result | Evidence |
|---|---|---|
| Reviewer consumes ADR-004 | Pass | Structured result declares `positioningAuthority: "ScreeningAnalysis"` and `positioningReportMode: "read-only-derived-view"`. |
| Reviewer produces structured issues | Pass | `ReviewerStructuredResult.issues` added and smoke-tested. |
| Reviewer never becomes positioning engine | Pass | No Fit Tier / positioning recomputation added. Issues cite upstream Analysis / Positioning Report. |
| Reviewer never repairs | Pass | Reviewer emits repair intent only; Repair code unchanged. |
| Reviewer never exports | Pass | Reviewer emits export recommendation input only; Export code unchanged. |
| Architecture remains consistent with ADR-004 | Pass | Additive output layer only; pipeline unchanged. |

## Stop Point

ADR-005 Wave 2 implementation is complete.

Do not begin:

- Repair redesign
- Export redesign
- Writer redesign
- ScreeningAnalysis redesign
- Positioning Policy redesign
- Wave 3

without explicit authorization.
