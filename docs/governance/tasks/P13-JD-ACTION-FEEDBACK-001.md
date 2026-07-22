# P13-JD-ACTION-FEEDBACK-001 — JD Apply and Save Feedback

Status: DONE

## Model Routing

- Selected AI: Codex
- Model: GPT-5.6 Terra
- Reasoning: Medium
- Reason: Bounded UI feedback remediation across existing Apply, Save/Update,
  persistence confirmation, recovery, accessibility, and no-AI regression.
- Escalation trigger: Stop if success/failure cannot be determined without
  changing persistence architecture, revision semantics, or canonical data
  contracts.

## Objective

Make existing Parsed-JD Apply and JD Save/Update outcomes explicit, accessible,
and resistant to duplicate submission while preserving the current parse,
persistence, recovery, identity, staleness, Golden, and AI boundaries.

## Dependencies

- `docs/architecture/CURRENT_ARCHITECTURE.md`
- `docs/governance/PROJECT_RULES.md`
- `docs/governance/tasks/P12-JD-RAW-SANITIZE-001.md`
- Existing persistence/revision/recovery owners

## Allowed Files

- Existing JD Intake, Parse Preview, feedback, and persistence callback owners
- Focused Apply/Save feedback fixtures and E2E tests
- Package scripts required for focused regression
- P13 and directly related governance completion/index records

## Forbidden

- New save flow, notification framework, data model, hash, staleness, Golden,
  recovery snapshot, revision semantics, AI trigger, Git, or push
- Automatic Save, Screening, navigation, or AI
- Reopening P8 through P12

## Acceptance Criteria

- [x] Fail-first proves Apply and Save/Update lack distinct success feedback,
  loading state, and duplicate-submit protection.
- [x] Valid Apply updates the form, shows unsaved status, and states that Save
  is still required without persistence or AI.
- [x] Invalid Apply preserves the form and never shows success.
- [x] Save and Update show distinct success only after persistence confirmation.
- [x] Save failure preserves form/unsaved state and never shows success.
- [x] Revision conflicts retain the existing recovery contract and distinct
  conflict messaging.
- [x] Applying/Saving disable repeat actions and restore controls afterward.
- [x] Success uses accessible status semantics and failure uses alert semantics.
- [x] Manual/URL Intake, Parse, persistence/recovery, P7, P8 Golden,
  Writer/Reviewer/Repair/Export, build, system/server, no-AI, and Product
  Acceptance regressions pass.
- [x] Documentation closes P13 as DONE and READY count returns to zero.

## Completion Evidence

- Root cause: Apply and Save/Update invoked separate owners without a shared
  presentation result tied to persistence completion; Save also navigated away
  before the intake could display the outcome.
- Apply now has its own pending, success, failure, and unsaved presentation.
  It never persists, parses, screens, navigates, or invokes AI.
- Save/Update success waits for the existing `saveData` owner to confirm the
  server revision. Failure retains the form and unsaved state; revision
  conflicts retain the existing recovery actions.
- Repeat Apply and Save/Update actions are disabled while pending. Status uses
  `role="status"` with polite live updates; errors use `role="alert"`.
- Focused feedback, intake, layout, persistence/recovery, P7 staleness, P8
  Golden, Writer/Reviewer/Repair/Export, URL import, no-AI, build, system/server,
  JD Import E2E 1/1, browser no-AI 1/1, and Product Acceptance E2E 13/13 passed.
- No data model, canonical hash, staleness, Golden, recovery snapshot, revision
  semantics, AI trigger, or canonical runtime data changed.

## Rollback

Remove the action-feedback state and callback-result presentation while keeping
the existing Apply and Save/Update handlers unchanged. No data migration is
required.
