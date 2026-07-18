# Architecture Dependency Audit — Review / Repair / Workflow / CTA / Export

Status: Complete. Source-grounded audit; no production code was modified during this stage.

## Concise dependency diagram

```text
AppData + Job + CV
        │
        ├─ ScreeningLab ──► screeningGate / manager / reviewer / exportVerification
        │       │                    │
        │       ├─► repair plan + local repair
        │       └─► workflow state + primary CTA
        │
        └─ ExportPage ──► cvQualityChecks + fitReview ──► export button

Target Wave 1:
AppData + Job + CV → ReviewEvaluation → ExportDecision → {ScreeningLab, ExportPage}
```

## Findings

| Finding | Evidence | Current Responsibility | Correct Owner | Risk | Confidence |
|---|---|---|---|---|---|
| `ScreeningLab.tsx` is a god file | 2,008 lines; owns automation, writer apply, snapshots, review evaluation, repair execution, workflow state, CTA wiring, and rendering | UI orchestration plus domain decisions | Application coordinator with domain services; presentation only in UI | High | Confirmed |
| Review and export evaluation are constructed in a UI component | `ScreeningLab.tsx` directly calls `screeningGate`, `hiringManagerReview`, `reviewerPass`, `exportVerification` | UI evaluates domain readiness | Domain review coordinator | High | Confirmed |
| Export readiness has two independent UI definitions | `ScreeningLab.tsx` uses `reviewerReview.ready && exportCheck.ready`; `Export.tsx` uses `cvQualityChecks` plus legacy `fitReview` | Two UI components decide whether export is reachable | Domain Export Decision | High | Confirmed |
| The two export rules can contradict the current screening workflow | Active path creates `screeningAnalysis`; `Export.tsx` requires `fitReview`, while `selection.ts` treats screening analysis as a valid decision context | Export UI can block after Screening Lab says ready | Domain Export Decision using existing valid decision-context rule | High | Confirmed |
| CTA resolution is centralized but its export input is UI-derived | `resolvePrimaryWorkflowCta` exists in `screeningWorkflow.ts`, but `ScreeningLab.tsx` supplies a locally composed boolean | UI still defines CTA prerequisite semantics indirectly | Domain CTA receives domain Export Decision | Medium | Confirmed |
| Review, repair plan, repair result, and CTA are mixed in presentation | `ReviewerBlockerTriage` renders failed/passed checks, repair scope, local result, and four action callbacks; `CheckStatusSummary` renders results and next step | Presentation components create action semantics | Separate Review Summary, Repair Plan/Result, CTA components | High | Confirmed |
| Local repair mutation and review-snapshot refresh remain coupled in `ScreeningLab` | `applyLocalReviewerContentFix`, `applyContactHeaderFix`, and title fix mutate CV then call `createReviewSnapshot` | UI owns mutation and review refresh | Repair coordinator + persistence/application boundary | Medium | Confirmed |
| Existing safe-repair domain boundary is partially established | `screeningRepairPlan.ts` types targets/owners; `localReviewerFix.ts` returns explicit status and only mutates permitted work zones | Domain plan/executor | Retain and expand later; not Wave 1 scope | Medium | Confirmed |
| Snapshot identity is domain-owned but read/write boundaries are split | `screeningReview.ts` owns hashes/reconciliation; `ScreeningLab.tsx` lazily reconciles; `App.tsx::saveCvVersion` persists versions | Domain identity plus UI/application coordination | Preserve current ADR-002 boundary | Medium | Confirmed |
| `cvQualityChecks` is reused as a UI diagnostic and an export gate | Called by CV Studio/status/submission/Export surfaces; `Export.tsx` alone makes it the export button authority | Presentation diagnostic doubles as policy | Keep as diagnostic; remove it as ExportPage action authority | Medium | Confirmed |
| No circular module import was confirmed | Current imports run UI → domain; `screeningReview.ts` imports workflow helper for loop lock but no reverse import from workflow to review | Potential conceptual bidirectionality | Keep dependencies one-directional in new boundary | Low | Confirmed |
| Snapshot timestamp-only compatibility is protected | `screeningReview.ts` and reviewer smoke cover content-hash validity and legacy enrichment | Domain identity | Preserve unchanged | High | Confirmed |

## Root cause

The strongest current coupling is not missing review logic; it is duplicated composition. The same job/CV is evaluated by one set of review functions in `ScreeningLab` and by a different UI-local gate in `ExportPage`. The resulting export action is therefore not governed by one contract boundary.

## Explicit non-findings

- No source evidence proves a runtime import cycle.
- No hidden AI invocation was found in review/repair/export evaluation.
- No evidence justifies changing Phase 2 quality checks, content-hash semantics, or repair-zone safeguards in this wave.

