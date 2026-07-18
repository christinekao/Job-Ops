# P4-DIAG-001 Validation Diagnostics Report

Status: DONE

## Real Failure Traced

Scenario: Microsoft / Azure Solution Specialist -> `Summary needs clearer role fit` -> `Regenerate Summary with AI`.

Observed Outcome
-> AI runtime completed and returned `object(tailoredCv)`.

First Failing Validator
-> `screening-cv-output` (`validateScreeningCvOutput`).

Failed Rule
-> `required-fields`.

Exact Candidate Content
-> The normalized Summary was a meaningful new Summary positioning the candidate as a business-to-technology translator for Azure Solution Specialist opportunities. The candidate still had an empty `header.email`. The raw full-CV response also changed `workExperience`, although Summary was the only authorized target.

Evidence Context
-> CV version/hash, effective CV Brief hash, and all 18 selected EvidenceCard IDs were fresh. `workExperience[2].subsections[0].bullets[0].evidenceIds` remained empty.

Why Rejected
-> Primary: `header.email is required`.
-> Additional: one visible bullet had no EvidenceCard ID; one work bullet duplicated another; affected export prerequisites therefore failed.

Supported Recovery Route
-> `manual-edit` for the exact missing email field; `review-evidence` for the exact bullet; `retry-with-constraints` for the raw prohibited-zone change. Diagnostics recommend but execute none of these routes.

## Validation Sequence

The report emits all existing/applicable boundaries in deterministic order:

1. Response contract
2. Target-zone boundary
3. CV version/hash freshness
4. Effective CV Brief freshness
5. Selected Evidence freshness
6. Required fields
7. EvidenceCard namespace
8. Evidence traceability
9. Unsupported visible claims
10. New skill/ownership/metric structured availability
11. Duplicate Summary/bullets
12. Meaningful target-zone diff
13. Preserved-zone integrity
14. Contact preservation
15. Existing Summary role-fit result where available
16. Existing work-bullet checks where available
17. Affected export prerequisites
18. Scoped candidate application boundary

Every stage records `pass`, `fail`, or `skipped`. All failures remain visible; `06-required-fields` is the deterministic primary failure for the real run.

## Diagnostic Contract

`targetedRegenerationDiagnostics.ts` records:

- request, blocker, CV version/hash, target zones
- raw response capture state and redacted response shape
- normalized target candidate
- candidate diff, changed zones, ignored raw zones, preserved zones
- validator/rule/severity/status/message
- exact field, sentence, bullet, current/candidate value
- evidence IDs, missing evidence, unsupported terms
- actual/expected values
- stop reason and supported recovery classification

It calls the existing `validateScreeningCvOutput()` and interprets its existing errors. It does not alter validation decisions or mutate either CV.

## UI Before and After

Before: a blocked run exposed a generic `validation blocked` message with up to three raw strings.

After: the primary result says the candidate was generated but not applied, lists exact plain-language reasons, confirms the current CV was not changed, and shows one supported recovery category. Collapsed Advanced Details contains the full ordered trace and identifiers.

## Observability

Local-development structured logging emits request ID, blocker IDs, target zones, validator/rule/status triplets, stop reason, CV hash prefix, and changed-zone count. It does not log API keys, environment data, full contact content, or credentials.

## Files Changed

Production (3):

- `CV_Manager_React/src/domain/targetedRegenerationDiagnostics.ts`
- `CV_Manager_React/src/components/tabs/ScreeningLab.tsx`
- `CV_Manager_React/src/components/tabs/screeningReviewRepairPanels.tsx`

Tests/config:

- `CV_Manager_React/scripts/smoke-regeneration-validation-diagnostics.mjs`
- `CV_Manager_React/scripts/smoke-regeneration-validation-trace.mjs`
- `CV_Manager_React/e2e/targeted-regeneration-runtime.spec.ts`
- `CV_Manager_React/package.json`

Governance:

- `docs/governance/tasks/P4-DIAG-001.md`
- `docs/governance/phase4/P4_DIAG_001_VALIDATION_DIAGNOSTICS_REPORT.md`
- `docs/governance/CURRENT_STATE.md`
- `docs/governance/MASTER_TASK_ROADMAP.md`
- `docs/governance/COMPLETION_REPORT.md`

## Tests Run

Passed:

- `npm run smoke:regeneration-validation-diagnostics`
- `npm run smoke:regeneration-validation-trace`
- P4-AR-009 through P4-AR-012 targeted regeneration smokes
- all proposal, safe-repair, batch, repair-loop, human-decision, Orchestrator, and Copilot regressions
- Phase 4 guided blockers/editing, explainability, and decision-confidence smokes
- Product Acceptance, no-AI, workflow, reviewer, and export-readiness smokes
- targeted real-ScreeningLab E2E: 7/7
- Product Acceptance E2E: 13/13
- browser no-AI E2E: 1/1
- `npm run build`
- `npm run test:system`

Deterministic fixtures cover unsupported claim, missing traceability, prohibited target-zone mutation, no meaningful diff, duplicate content, stale CV, stale Brief, stale Evidence, role-fit non-improvement, multiple failures, and valid candidate.

## Manual Real-Page Result

- One explicit real AI Summary regeneration was run; no Retry was used.
- Running/validating feedback remained visible.
- Result showed the exact missing email, exact evidence-ID field, duplicate bullet field, and prohibited raw `workExperience` change.
- Advanced Details showed the normalized Summary, validator/rule IDs, actual/expected values, all selected Evidence IDs, missing evidence, changed/preserved/ignored zones, primary failure, and stop reason.
- The current CV remained unchanged. Browser artifacts were emitted and the diagnostic page was left open.

## Problem Classification

Primary: evidence/current-CV baseline plus full-candidate validation ordering. The AI produced a meaningful Summary, but the full normalized CV still contained pre-existing missing email/evidence data and a duplicate bullet, so the authoritative output validator stopped before scoped Summary application.

Secondary: prompt/constraint adherence. The raw candidate changed `workExperience` during Summary-only regeneration; the existing scoped boundary prevented application.

Not primary: validator threshold, stale context, or normalization. Freshness passed, normalization succeeded, and no threshold was relaxed.

## Recommended Next Task

Evaluate baseline-versus-candidate attribution and a targeted partial-response contract so unrelated pre-existing invalid fields can be distinguished from newly introduced candidate failures. This recommendation is not created, promoted, or implemented here because it would require a separate architecture/validation decision.

## Stop Confirmation

No validation behavior, prompt, route, export decision, evidence selection, persistence architecture, or runtime data changed. No next task is READY. Phase 5 was not started.
