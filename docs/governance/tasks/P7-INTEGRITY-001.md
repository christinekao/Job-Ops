# P7-INTEGRITY-001 — Invalidate Generated CV After Selected Evidence Mutation

Status: DONE

## Model Routing

- Selected AI: Codex
- Model: GPT-5.6 Terra
- Reasoning: High
- Reason: P0 evidence-safety and stale export defect crossing generation identity, Review freshness, and Export authorization.
- Escalation trigger: Stop if the correction requires a new architecture decision, changes canonical persistence ownership, or weakens legacy compatibility without current authority.

## Confirmed Defect

`cvStaleReasonForJob()` treats a completed/applied Writer run with matching selection IDs as current before comparing the generated CV's source-data identity with current selected Evidence. Editing a selected Evidence record under the same ID—including changing it from CV-usable to `canBeUsedInCv: No` or `Do Not Claim`—therefore leaves the generated CV and its existing Review eligible to reach Export as though inputs were unchanged.

## Deterministic Reproduction

1. Create a Job, selected CV-usable Evidence, a generated CV with matching `generationContext`, a completed/applied Writer run, and a fresh Review snapshot.
2. Confirm the CV is current and the Export decision is ready.
3. Change the selected Evidence under the same ID so canonical CV-use policy rejects it.
4. Re-evaluate freshness and Export without regenerating the CV.
5. Before the repair, `cvStaleReasonForJob()` returns `null` and Export remains ready.

## Root Cause

`src/data/selection.ts::completedAppliedRunMatchesWriterContext()` returns `true` using only Writer-run input identity, JD identity, and selected ID arrays. Its early return occurs before current `sourceDataHash` and CV Brief identity comparisons, so same-ID content or policy mutations are invisible.

## Governing Documents

1. `docs/INDEX.md`
2. `docs/architecture/CURRENT_ARCHITECTURE.md`
3. `docs/adr/ADR_INDEX.md` (`ADR-GOV-002`)
4. `docs/governance/DECISIONS.md` (`ADR-002`, `ADR-006`, `ADR-007`)
5. `docs/adr/ADR-006_REPAIR_POLICY.md`
6. `docs/governance/PROJECT_RULES.md`
7. `docs/governance/tasks/P5-BACKBONE-001.md`
8. `docs/governance/tasks/P6-PERSIST-001.md`

## Scope

- Add a focused end-to-end domain regression covering selected Evidence policy/content mutation after a completed Writer run.
- Remove the stale-detection bypass while preserving supported generation-context compatibility.
- Verify both direct consumers of `cvStaleReasonForJob()`: Screening Lab and Export Decision.
- Run Evidence, Backbone, Writer, Review, Export, workflow, product-acceptance, build, and system regressions.

## Allowed Files

- `CV_Manager_React/src/data/selection.ts`
- `CV_Manager_React/scripts/smoke-p7-evidence-mutation-staleness.mjs`
- `CV_Manager_React/package.json`
- `docs/governance/tasks/P7-INTEGRITY-001.md`
- `docs/governance/{CURRENT_STATE.md,MASTER_TASK_ROADMAP.md,COMPLETION_REPORT.md}`
- `docs/{DOCUMENT_REGISTRY.yaml,DOCUMENT_RELATIONSHIPS.md,architecture/CURRENT_ARCHITECTURE.md}` only where implemented behavior changes the documented invariant.

## Forbidden Files

- `CV_Manager_React/data/**`
- Persistence implementation and recovery behavior
- Writer prompt construction or output schema
- Reviewer, Repair, or Export policy
- P5, P6, and DOC-GOV-002 task records
- Legacy product surfaces
- Git and `.push-staging/`

## Non-Goals

- No new Evidence, Backbone, Writer, Reviewer, Repair, Export, or persistence system.
- No automatic AI call or regeneration.
- No Evidence deletion redesign or broad reviewer refactor.
- No canonical data migration.

## Implementation Phases

1. Record baseline build/system and relevant focused smoke results.
2. Add a regression that reaches `cvStaleReasonForJob()` and `resolveScreeningExportDecision()` and fails on the confirmed bypass.
3. Correct the generation-input identity comparison at the existing stale-detection boundary.
4. Run focused and downstream validation.
5. Update governance evidence and close only after every criterion passes.

## Failing Regression Evidence

- Command: `npm run smoke:p7-evidence-mutation-staleness`
- Before repair: FAIL.
- Expected: `source-selection-changed`.
- Actual: `null`.
- Failed assertion: `same-ID Evidence content or CV-use policy mutation must invalidate the generated CV`.
- The unchanged completed/applied Writer input assertion passed before reaching the failure.

## Acceptance Criteria

- [x] The focused regression fails before production repair for the expected stale-input/export-ready mismatch.
- [x] A same-ID selected Evidence content or CV-use policy mutation makes the existing CV stale.
- [x] A stale CV blocks Export even when the old Review snapshot remains content-fresh for the unchanged CV text.
- [x] An unchanged completed/applied Writer result remains current.
- [x] Selected-ID deletion and existing legacy compatibility remain covered by current regressions.
- [x] No AI runs automatically.
- [x] P5 Evidence safety and P6 recovery behavior remain intact.
- [x] Focused, cross-flow, build, and full system validation pass.
- [x] Canonical runtime data is not modified.
- [x] Documentation validation passes and no task remains READY.

## Finding Matrix

| Finding ID | Severity | Category | Reproduction | Root cause | User impact | Data risk | Existing test | Governing document | Minimum repair | Blocking |
|---|---|---|---|---|---|---|---|---|---|---|
| `P7-F-001` | P0 | Evidence / Review / Export | Generate and review a CV, then change selected Evidence under the same ID from CV-usable to `Do Not Claim` | Completed/applied Writer-run shortcut returned before current Brief/source identity comparison | Stale CV and old Review could remain eligible for Export | unsafe claim | No before P7 | `docs/architecture/CURRENT_ARCHITECTURE.md` | Remove the early bypass and always compare current generation identities | Yes |

No additional P0, P1, P2, or P3 issue reached confirmed deterministic-defect status in this review.

## Completion Evidence

- Baseline: zero READY tasks; `npm run build` PASS; `npm run test:system` PASS in a localhost-capable environment. The sandbox-only first attempt failed solely at server bind with `EPERM`.
- Before repair: `npm run smoke:p7-evidence-mutation-staleness` FAIL; expected a stale reason, actual `null`.
- After repair: the same command PASS; unchanged input remains current, same-ID unsafe Evidence mutation invalidates the CV, and stale input blocks Export.
- Cross-flow PASS: P5 Evidence contract, Backbone integrity, CV Brief, Writer input/output, Review freshness, Reviewer, Export readiness, Workflow, P6 persistence recovery, and Product Acceptance.
- Final PASS: `npm run build` and `npm run test:system`, including server persistence.
- Documentation PASS: 285 docs files / 285 Registry entries, zero missing or stale entries, zero duplicate file entries or canonical IDs, 207 Markdown files with zero broken links, and zero READY tasks.
- Direct callers: Screening Lab and Export Decision both already consume `cvStaleReasonForJob()` through the existing Export Decision boundary; no caller-specific duplicate logic was added.
- Migration: none. Existing data remains readable; no canonical runtime data was modified.
- Deferred confirmed findings: none.

## Migration Impact and Data Compatibility

- No persisted schema or canonical-data migration.
- Existing generation contexts remain readable.
- Older or changed inputs become conservatively stale and require explicit user-triggered regeneration; no existing CV content is deleted.

## Failure and Recovery Behavior

- Stale input produces the existing `cv-brief-changed` or `source-selection-changed` blocker according to the first changed canonical identity, with existing regeneration guidance.
- The current CV remains readable and editable.
- No automatic repair, merge, overwrite, or AI execution occurs.

## Required Tests

- `npm run smoke:p7-evidence-mutation-staleness`
- `npm run smoke:p5-evidence-contract`
- `npm run smoke:backbone-integrity`
- `npm run smoke:cv-brief`
- `npm run smoke:writer-input`
- `npm run smoke:writer-output`
- `npm run smoke:review-freshness`
- `npm run smoke:reviewer`
- `npm run smoke:export-readiness`
- `npm run smoke:workflow`
- `npm run smoke:p6-persistence-recovery`
- `npm run smoke:product-acceptance`
- `npm run build`
- `npm run test:system`

## Documentation Requirements

- Record failing-before and passing-after evidence in this task.
- Update Current State, Master Task Roadmap, Completion Report, Registry, and Relationship Map where directly affected.
- Validate Registry coverage, duplicate IDs, Markdown links, task states, and READY count.

## Final Report Requirements

Report the finding matrix, selected P0 repair, reproduction, every changed production/test/doc file, exact validation results, deferred findings, task states, and explicit safety/persistence confirmations.
