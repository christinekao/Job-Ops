# P4-FINAL-001 - Repair Workflow Consolidation

Status: DONE

## Objective

Consolidate the existing Phase 4 Review, blocker, repair-route, targeted-regeneration result, and Export presentation into one durable user workflow: Issue → Fix → Review → Next.

## Selected Execution

- AI: Codex
- Model: GPT-5.6 Sol
- Reasoning: 高
- Reason: The work crosses existing Review Snapshot identity, targeted-regeneration feedback, Repair Orchestrator presentation, and browser continuity; it must remove duplicate ownership without changing domain rules.
- Escalation trigger: Stop if implementation requires more than 12 production files or changes prompts, review/validation rules, export semantics, persistence architecture, runtime data, or Phase 5.
- Routing note: `docs/governance/ai-routing/ROUTING_SUMMARY.md` is absent. The explicit task-selected preferred model is used.

## Dependencies

- P4-AR-001 through P4-AR-012: DONE
- P4-DIAG-001: DONE
- P4-VAL-001: DONE
- P4-PROMPT-001: DONE
- P4-DIAG-FIX-001: DONE
- No unresolved ADR blocks this consolidation.
- Before execution, P4-FINAL-001 was the only READY task.

## Confirmed Duplicate Ownership

- Review result/freshness is authoritative in `CvVersion.reviewSnapshot`, but the visible post-repair result is stored only in React state as `targetedRegenerationAttempt.reviewClosure`.
- `ScreeningLab` and `ExportDecisionPanel` separately infer whether a successful repair re-failed.
- `RepairOrchestrationPanel`, `Your Next Step`, `Updated Summary Review`, and `Remaining Issues` repeat the current issue/action/result.
- A refresh, component remount, job navigation, or return to Screening Lab discards the React-only post-repair result.

## Allowed Files

Production (maximum 12):

- `CV_Manager_React/src/types.ts`
- `CV_Manager_React/src/domain/reviewFreshness.ts`
- `CV_Manager_React/src/domain/targetedRegenerationFeedback.ts`
- `CV_Manager_React/src/components/tabs/ScreeningLab.tsx`
- `CV_Manager_React/src/components/tabs/screeningReviewRepairPanels.tsx`

Tests/config:

- `CV_Manager_React/scripts/smoke-post-repair-review-closure.mjs`
- `CV_Manager_React/scripts/smoke-blocker-version-binding.mjs`
- `CV_Manager_React/scripts/smoke-targeted-regeneration-feedback.mjs`
- `CV_Manager_React/scripts/smoke-repair-orchestrator.mjs`
- `CV_Manager_React/scripts/smoke-phase4-guided-blockers.mjs`
- `CV_Manager_React/scripts/smoke-phase4-guided-editing.mjs`
- `CV_Manager_React/scripts/smoke-phase4-decision-confidence.mjs`
- `CV_Manager_React/scripts/smoke-targeted-regeneration-click.mjs`
- `CV_Manager_React/scripts/smoke-repair-workflow-consolidation.mjs`
- `CV_Manager_React/e2e/targeted-regeneration-runtime.spec.ts`
- `CV_Manager_React/e2e/product-acceptance.spec.ts`
- `CV_Manager_React/package.json`

Governance/report:

- `docs/governance/tasks/P4-FINAL-001.md`
- `docs/governance/phase4/P4_FINAL_001_REPAIR_WORKFLOW_CONSOLIDATION_REPORT.md`
- `docs/governance/CURRENT_STATE.md`
- `docs/governance/MASTER_TASK_ROADMAP.md`
- `docs/governance/COMPLETION_REPORT.md`

## Forbidden Files

- Runtime prompts and prompt contracts
- Review and validation rules or thresholds
- Repair Orchestrator routing rules
- Export decision semantics
- Persistence architecture and runtime data
- Previous task history and Phase 5

## Acceptance Criteria

1. Review Snapshot remains the sole persisted owner of the current review result and freshness.
2. The latest targeted Summary repair result survives refresh, remount, and navigation until another review replaces it.
3. React-only attempt state is limited to in-flight/no-diff dispatch safety and no longer owns successful business outcome.
4. Primary UI shows one coherent Issue → Fix → Review → Next sequence.
5. Running, validating, passed, and genuinely re-failed outcomes are explicit and never look untouched.
6. Re-failure displays the updated Summary, current review reason, and one obvious next action.
7. Pass removes the resolved blocker, updates progress, and shows the next blocker or Export.
8. Internal attempt, lifecycle, closure, validator, version, and hash terminology appears only under Advanced Details.
9. Repair Orchestrator remains the only owner of resolution route; UI only renders and dispatches it.
10. Export readiness continues to come only from the authoritative Export Decision.
11. Prompts, review rules, validation rules, export semantics, persistence architecture, and Phase 5 remain unchanged.
12. Real Microsoft Azure Solution Specialist acceptance proves Case A or Case B with a durable understandable result.

## Required Validation

- All Phase 4 and targeted-regeneration regressions
- Browser targeted-regeneration and Product Acceptance
- Browser no-AI guard
- Workflow, reviewer, and export-readiness tests
- `npm run build`
- `npm run test:system`
- Real Microsoft Azure Solution Specialist acceptance without an automatic retry

## Completion Rule

Mark DONE only when a first-time user can identify the current issue, activity, result, and next action after repair, including after refresh/remount/navigation. Do not create or promote another task.

## Completion Evidence

- The Review Snapshot now persists the latest Summary repair outcome; React attempt state is limited to dispatch safety and no-diff retry control.
- Screening Lab renders one Issue → Fix → Review → Next workflow and one primary repair CTA.
- Genuine re-failure survives refresh, remount, and job navigation; pass advances to the next blocker or authoritative Export Decision.
- Focused consolidation/freshness/binding/feedback smokes passed.
- Targeted-regeneration E2E passed 11/11, Product Acceptance E2E passed 13/13, and browser no-AI guard passed 1/1.
- `npm run build` and sandbox-approved `npm run test:system` passed.
- Completion report: `docs/governance/phase4/P4_FINAL_001_REPAIR_WORKFLOW_CONSOLIDATION_REPORT.md`.
- No task was created or promoted. Phase 5 was not started.
