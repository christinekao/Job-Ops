# P4-DIAG-001 - Targeted Regeneration Validation Diagnostics

Status: DONE

## Objective

Expose the existing targeted-regeneration validation sequence as a structured, non-mutating diagnostic report with concise user copy and complete collapsed Advanced Details. Do not change any validation decision, rule, prompt, repair route, export rule, or CV content.

## Selected Execution

- AI: Codex
- Model: GPT-5
- Reasoning: 中
- Reason: GPT-5.6 Sol is not available in the current session; GPT-5 is the authorized fallback and is sufficient for this bounded diagnostics/instrumentation task.
- Escalation trigger: Stop if diagnostics require changing validator outcomes, runtime prompts, repair routing, persistence/runtime data, more than 10 production files, or a new ADR.

## Dependencies

- P4-AR-009: DONE
- P4-AR-010: DONE
- P4-AR-011: DONE
- P4-AR-012: DONE
- No unresolved architecture decision is required.
- P4-DIAG-001 is the only READY task.

## Confirmed Real Failure Trace

Observed outcome -> real Microsoft / Azure Solution Specialist Summary regeneration returned a normalized candidate, then ended `validation blocked`; the CV was preserved.

First failing validator -> `validateScreeningCvOutput()`.

Failed rule -> required-field validation: `header.email is required`.

Additional failure -> EvidenceCard traceability: `workExperience[2].subsections[0].bullets[0].evidenceIds must contain at least one EvidenceCard ID`.

Current diagnostic loss -> `ScreeningLab.tsx` converts `ScreeningCvOutputValidation.errors: string[]` directly into one message. Validator identity, rule identity, candidate field value, evidence context, ordered pass/fail/skipped stages, and supported recovery are not retained.

Supported recovery -> `manual-edit` for missing email and `review-evidence` for the missing bullet evidence ID. This task reports those routes but does not execute them.

## Allowed Files

Production files (planned 3; maximum 10):

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

## Forbidden Files

- P4-AR task files and completion reports
- Validator rule/threshold implementations
- Runtime prompt builders or prompt metadata
- Repair Orchestrator classification/routing
- Export decision semantics
- Evidence-selection rules
- CV save/persistence architecture
- Canonical runtime data
- Phase 5 plans

## Acceptance Criteria

1. Every required validation stage emits an ordered pass/fail/skipped diagnostic where applicable.
2. All failures are retained and the first authoritative blocking failure is deterministic.
3. Diagnostics identify exact fields/sentences/zones, actual/expected values, and evidence IDs where available.
4. Response shape, normalized target candidate, ignored/rejected zones, content diff, and preserved zones are recorded without credentials/environment data.
5. No-diff, stale CV, stale Brief, stale Evidence, invalid response, runtime error, and validation-blocked remain distinguishable.
6. User copy is plain language and states that the CV was not changed.
7. Advanced Details exposes request/CV identity, ordered checks, rule IDs, evidence context, candidate values, and stop reason while collapsed by default.
8. Recovery is classified but never executed automatically.
9. Diagnostics never mutate the CV and do not change existing validation outcomes.
10. No hidden AI invocation, prompt change, route change, runtime-data mutation, additional READY task, or Phase 5 work is introduced.

## Required Validation

- `npm run smoke:regeneration-validation-diagnostics`
- `npm run smoke:regeneration-validation-trace`
- P4-AR-009 through P4-AR-012 and all P4-AR regressions
- Phase 4 UX and Product Acceptance smokes
- targeted real-component browser diagnostics
- Product Acceptance E2E and browser no-AI guard
- workflow, reviewer, and export-readiness tests
- `npm run build`
- `npm run test:system`
- one manual real-page Summary regeneration with exact diagnostic detail

## Completion Rule

Mark DONE only when the real Screening Lab blocked result shows at least one exact reason beyond `validation blocked`, Advanced Details identifies validator/rule/target/evidence context, the CV remains unchanged, and every required regression passes. Otherwise mark `BLOCKED_AFTER_IMPLEMENTATION` with the exact insufficient validator interface.

## Completion Evidence

- Real Microsoft / Azure Solution Specialist Summary regeneration produced a normalized Summary candidate, then ended `validation-blocked` without saving a CV.
- Primary failure: `screening-cv-output` / `required-fields` / `header.email`.
- Additional failures: missing EvidenceCard traceability at `workExperience[2].subsections[0].bullets[0].evidenceIds`, a duplicate bullet, and affected export prerequisites. The raw candidate also changed prohibited `workExperience`; that zone remained unauthorized and was not applied.
- Advanced Details displayed request/CV identity, raw response shape, normalized Summary, all 18 ordered validation stages, pass/fail/skipped state, actual/expected values, evidence context, changed/preserved/ignored zones, stop reason, and recovery routes.
- Structured logs contain only request/blocker/zone/check identities, stop reason, CV hash prefix, and changed-zone count; no contact content, credentials, or environment values are logged.
- Focused diagnostics/trace smokes, all P4-AR and Phase 4 regressions, targeted E2E 7/7, Product Acceptance E2E 13/13, no-AI E2E 1/1, build, and `npm run test:system` passed.
- Three production files changed. No validator, prompt, routing, export, persistence, runtime-data, or CV-content rule changed. No next task was promoted and Phase 5 was not started.
