# Architecture Refactoring Wave 1 Completion Report

Status: DONE

## Confirmed coupling and root cause

`ScreeningLab` and `ExportPage` each defined export readiness from different UI-local inputs. The active Screening workflow recognizes `screeningAnalysis` as its decision context, while the Export page previously required a legacy `fitReview`. This was a confirmed action-boundary contradiction.

## Target boundary

`evaluateScreeningReview` composes the existing gate, manager, reviewer, and export evaluations. `resolveScreeningExportDecision` owns only final readiness and explicit blockers. Both UI consumers receive this shared result; existing `resolvePrimaryWorkflowCta` consumes the decision's `ready` value.

## Exact Wave 1 scope

Three production files changed:

- Added `CV_Manager_React/src/domain/screeningExportDecision.ts`.
- Updated `CV_Manager_React/src/components/tabs/ScreeningLab.tsx`.
- Updated `CV_Manager_React/src/components/tabs/Export.tsx`.

No behavior rule was rewritten. The only intended user-visible correction is that export reachability now uses the same domain decision in both locations. `cvQualityChecks` remains rendered as diagnostics.

## Dependency reduction achieved

Before: two UI consumers independently composed readiness, and local-repair re-evaluation called the raw review functions directly.

After: both UI consumers and local-repair re-evaluation use one domain Review Evaluation / Export Decision boundary. The UI no longer owns the export-enable rule.

## Validation

| Command | Result |
|---|---|
| `npm run smoke:phase3-architecture-wave1` | PASS |
| `npm run smoke:phase3-wave1` | PASS |
| `npm run smoke:workflow` | PASS |
| `npm run smoke:repair-regression` | PASS |
| `npm run smoke:reviewer` | PASS |
| `npm run smoke:review-roles` | PASS |
| `npm run smoke:export-readiness` | PASS |
| `npm run smoke:writer-output` | PASS |
| `npm run build` | PASS |
| `npm run test:system` | PASS after approved localhost rerun |

## Safeguards preserved

- EvidenceCard namespace and visible-bullet traceability validation.
- Wrong/unknown ID rejection and duplicate summary/bullet rejection.
- Contact validation, unsupported visible claims blocking, and non-blocking application-fit risk.
- Content-hash review identity and legacy snapshot compatibility.
- Local repair target-zone enforcement, explicit no-safe-fix status, no hidden AI invocation, and no automatic repair loop.

## Remaining risks and recommended Wave 2 boundary

`ScreeningLab.tsx` remains a large application/presentation coordinator. The next justified boundary is splitting review rendering, repair-plan rendering, repair-result rendering, and CTA dispatch into separate presentation components that consume already-derived domain state. That work was not started.

