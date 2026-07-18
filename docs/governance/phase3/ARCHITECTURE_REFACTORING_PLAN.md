# Architecture Refactoring Plan — Review / Repair / Workflow / CTA / Export

Status: Wave 1 authorized by the current Architecture Cleanup Epic.

## Current boundary

`ScreeningLab` directly evaluates review/export state, derives repair inputs, resolves workflow/CTA state, and renders actions. `ExportPage` separately calculates `canExport` from `cvQualityChecks` and legacy fit-review state. These two UI-local paths can disagree.

## Target boundary

```text
Presentation: ScreeningLab, ExportPage
      ↓ render/dispatch only
Application: existing workflow coordinator in ScreeningLab
      ↓
Domain: ReviewEvaluation → ExportDecision → Workflow/CTA input
      ↓
Infrastructure: existing persistence and automation unchanged
```

- Review Evaluation evaluates current Job/CV/Evidence only.
- Export Decision determines export readiness only from a Review Evaluation and valid decision context.
- Workflow state and CTA consume the Export Decision; they do not recreate export policy.
- UI may render diagnostics such as `cvQualityChecks`, but cannot use them to independently enable/disable export.

## Wave 1 selection

**Selected boundary:** authoritative Review Evaluation and Export Decision.

This is higher-value and lower-risk than re-splitting all `ScreeningLab` panels because it removes the confirmed contradiction at the action boundary with three production files. P3-001 already extracted workflow-state and primary-CTA resolution; repeating that work would not reduce the remaining duplicate export policy.

## Exact migration steps

1. Add `src/domain/screeningExportDecision.ts`.
2. Move no quality rule: compose existing `screeningGate`, manager, reviewer, and `exportVerification` results into a typed Review Evaluation.
3. Derive one Export Decision using existing valid decision context: current Screening Analysis, or a non-Unknown legacy Fit Review.
4. Replace `ScreeningLab`'s local review/export composition with the domain evaluation/decision; pass only `decision.ready` to the existing CTA resolver.
5. Replace `ExportPage` button gating with the same decision. Keep `cvQualityChecks` as visible diagnostics only.
6. Add a focused smoke fixture proving both consumers receive identical ready/blocked results, completed state stays completed, real input changes remain reruns, timestamp-only changes do not, local-repair status is preserved, and warnings do not block export.

## Expected files

Production (3):

- `CV_Manager_React/src/domain/screeningExportDecision.ts` — new
- `CV_Manager_React/src/components/tabs/ScreeningLab.tsx`
- `CV_Manager_React/src/components/tabs/Export.tsx`

Tests/config (2):

- `CV_Manager_React/scripts/smoke-phase3-architecture-wave1.mjs` — new
- `CV_Manager_React/package.json`

Governance/task/report files are listed in the active task. No prompts, data, persistence, review-quality implementation, repair executor, or snapshot implementation changes are planned.

## Compatibility strategy

- Reuse existing review functions unchanged.
- Preserve `cvQualityChecks` output and all existing visual diagnostic cards.
- Treat `screeningAnalysis` as valid current decision context, consistent with `selection.ts`; retain legacy `fitReview` support.
- Preserve current content-hash and legacy snapshot behavior by calling existing review functions only.
- Preserve local-repair semantics; this wave does not mutate repair code.

## Rollback strategy

Revert the three production files and the focused smoke/package wiring. UI components return to their current independent calculations. No data migration or persistence rollback is needed.

## Risks and mitigation

| Risk | Mitigation |
|---|---|
| Existing UI-local rules hide an implicit requirement | Focused fixtures cover analysis-based and fit-review-based decision context plus blocked conditions |
| New domain coordinator accidentally changes review results | It composes existing functions without rewriting their checks; reviewer/export regressions run unchanged |
| Export CTA becomes unreachable | Add explicit ready fixture and CTA resolver assertion |
| Existing repair/snapshot safeguards regress | Run repair, reviewer/export, workflow, writer-output, build, and system regression tests |

## Validation strategy

Run the Wave 1 smoke plus workflow, CTA, repair, reviewer/export, writer-output, build, and system checks. The focused fixture validates the required CTA/state cases using the new domain decision—not UI-local booleans.

