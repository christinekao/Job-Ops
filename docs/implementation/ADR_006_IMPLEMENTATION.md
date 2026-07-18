# ADR-006 Repair Policy Implementation

Status: COMPLETE  
Date: 2026-07-17  
AI: Codex  
Model: GPT-5.6 Sol  
Reasoning: High  
Scope: ADR-006 Repair Policy only. No Reviewer redesign, Export redesign, Writer redesign, ScreeningAnalysis redesign, Positioning Policy change, prompt redesign, architecture redesign, persistence migration, or release approval.

## Executive Summary

ADR-006 implements the first Repair Policy production change:

- Repair now consumes ADR-005 structured Reviewer repair contracts as the primary input.
- Legacy blocker-string routing remains available as a backward-compatible fallback.
- Structured repair classifications preserve Reviewer issue id, category, severity, repairability, repair intent, CV version, and CV content hash.
- Capability Gaps are explicitly non-repairable by CV mutation.
- Profile Completeness routes to human input.
- External Wording and Keyword Coverage preserve Reviewer expected repair boundaries.

## Files Changed

Production:

- `CV_Manager_React/src/domain/repairOrchestrator.types.ts`
- `CV_Manager_React/src/domain/repairOrchestrator.ts`
- `CV_Manager_React/src/components/tabs/ScreeningLab.tsx`
- `CV_Manager_React/package.json`

Validation:

- `CV_Manager_React/scripts/smoke-repair-policy.mjs`

Documentation:

- `docs/adr/ADR-006_REPAIR_POLICY.md`
- `docs/validation/ADR_006_POLICY_SIMULATION.md`
- `docs/implementation/ADR_006_IMPLEMENTATION.md`

## Architectural Decisions

### 1. Structured repair contract as primary input

`RepairOrchestrationInput` now accepts:

- `structuredIssues?: ReviewerIssue[]`

When structured issues exist, `orchestrateRepair()` classifies them instead of legacy blocker strings.

### 2. Legacy fallback retained

If structured issues are absent or empty, legacy blocker-string routing remains unchanged.

This preserves existing review snapshots and older flows.

### 3. Reviewer classification is preserved, not recomputed

Structured repair classifications retain:

- `reviewerIssueId`
- `reviewerCategory`
- `reviewerSeverity`
- `reviewerRepairability`
- `suggestedRepairIntent`

Repair uses these fields to route execution. It does not recompute Reviewer category or severity.

### 4. Capability Gap cannot be repaired as wording

Structured `Capability Gap` issues route to `unsupported`.

This prevents Repair from rewriting truthful gaps into unsupported direct-fit strengths.

### 5. Screen flow passes structured contract

`ScreeningLab.tsx` now passes:

```ts
activeCv.reviewSnapshot?.structuredReviewResult?.repairContract?.issues
```

to Repair orchestration.

## Contracts Implemented

### Input contract

- `ReviewerStructuredResult.repairContract.issues[]`

### Classification output additions

- `source`
- `rawBlocker`
- `reviewerIssueId`
- `reviewerCategory`
- `reviewerSeverity`
- `reviewerRepairability`
- `suggestedRepairIntent`

### Route mapping

| Structured Reviewer issue | Repair route |
|---|---|
| `Capability Gap` / `not-repairable` | `unsupported` |
| `Profile Completeness` / `human-input` | `human-input` |
| `Evidence Missing` / `human-decision` | `human-decision` |
| `Formatting` / `auto-repairable` | `safe-auto` |
| `Unsupported Claim` | `approval-required` |
| `Policy Violation` | `approval-required` |
| `Keyword Coverage` | `approval-required` |
| `External Wording` | `approval-required` or `targeted-regeneration` for summary-only boundary |

## Boundaries Preserved

Repair does not:

- recompute Fit Tier;
- recompute positioning;
- recompute capability gaps;
- recompute Reviewer issue category;
- recompute Reviewer severity;
- select evidence;
- decide export;
- mutate persistence directly;
- alter Reviewer or Export behavior.

## Backward Compatibility

Backward compatible.

- Legacy blockers still route when no structured issues exist.
- Existing Review Snapshots remain readable.
- Existing Repair UI can consume the same `RepairOrchestrationSummary`.
- No persistence migration was introduced.

## Validation Executed

Passed:

- `npm run smoke:repair-policy`
- `npm run smoke:repair-orchestrator`
- `npm run smoke:reviewer-policy`
- `npm run smoke:repair-loop`
- `npm run smoke:safe-repair-executor`
- `npm run smoke:review-freshness`
- `npm run build`

Lint:

- No dedicated lint script is defined in `CV_Manager_React/package.json`.

## Known Limitations

- Repair execution still uses existing execution paths; this implementation primarily establishes structured contract consumption in orchestration.
- Export Policy remains unchanged and still requires ADR-007.
- Profile Completeness still requires trusted user/profile input.
- UI may still expose some legacy wording, but route classification now prefers structured contracts when present.

## Success Criteria Check

| Criterion | Result | Evidence |
|---|---|---|
| Repair consumes ADR-005 structured contract | Pass | `structuredIssues` primary input and `smoke:repair-policy`. |
| Repair does not recompute Reviewer classification | Pass | Reviewer category/severity/repairability are preserved. |
| Capability Gap is not repaired as wording | Pass | Structured Capability Gap routes to `unsupported`. |
| Legacy compatibility preserved | Pass | Legacy fallback smoke remains passing. |
| Reviewer unchanged | Pass | `smoke:reviewer-policy` passed. |
| Export unchanged | Pass | No Export files changed. |
| Build passes | Pass | `npm run build` passed. |

## Stop Point

ADR-006 implementation is complete for the approved scope.

Proceed to controlled acceptance before scope closure.
