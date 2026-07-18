# P4-ALIGN-001 - Summary Generation, Review, and Repair Alignment

Status: BLOCKED_AFTER_IMPLEMENTATION

## Objective

Create one authoritative Summary Quality Contract and make initial Summary generation, targeted Summary regeneration, hiring-manager relevance review, and Summary repair guidance consume the same criteria.

## Selected Execution

- AI: Codex
- Model: GPT-5 fallback
- Reasoning: 高
- Reason: The task crosses runtime prompts, reviewer criteria, repair guidance, and post-repair review persistence; it requires contract alignment without weakening standards.
- Escalation trigger: Stop if implementation requires more than 12 production files, weakens review/export/validation rules, changes persistence architecture, mutates runtime data, or starts Phase 5.
- Routing note: `docs/governance/ai-routing/ROUTING_SUMMARY.md` is absent. The explicit task-selected preferred/fallback model is used.

## Dependencies

- P4-AR-001 through P4-AR-012: DONE
- P4-DIAG-001: DONE
- P4-VAL-001: DONE
- P4-PROMPT-001: DONE
- P4-DIAG-FIX-001: DONE
- P4-FINAL-001: DONE
- No unresolved ADR blocks this alignment task.

## Forensic Alignment Audit

| Stage | Current owner | Current alignment issue |
|---|---|---|
| Initial Summary generation | `CV_Manager_React/src/promptBuilders.ts::buildScreeningCvPrompt` | The prompt describes broad manager-review goals, but does not consume typed criterion IDs or a positioning-mode contract. |
| Targeted Summary regeneration | `CV_Manager_React/src/promptBuilders.ts::buildTargetedRegenerationPrompt` | The prompt receives blocker strings and selected evidence, but not the latest structured failed criteria or unsupported core requirements. |
| Hiring-manager relevance review | `CV_Manager_React/src/domain/screeningReview.ts::hiringManagerReview` | Review compresses role-fit failure into `wouldInterview` and rewrite items instead of criterion-level Summary quality results. |
| Summary repair guidance | `CV_Manager_React/src/domain/repairOrchestrator.ts` and `screeningReviewRepairPanels.tsx` | Repair routes the generic Summary role-fit blocker to regeneration and the UI repeats generic "Summary still needs clearer role fit" when the remaining problem may be factual fit risk. |

Primary alignment break: the reviewer and generators do not share an explicit criterion contract. The reviewer can fail on role capability or fit-risk signals that the Summary generator only sees as broad guidance, so targeted regeneration can produce alternative wording without resolving the exact failed criterion.

## Allowed Files

Production (maximum 12):

- `CV_Manager_React/src/types.ts`
- `CV_Manager_React/src/domain/summaryQualityContract.ts`
- `CV_Manager_React/src/domain/screeningReview.ts`
- `CV_Manager_React/src/domain/reviewFreshness.ts`
- `CV_Manager_React/src/domain/screeningExportDecision.ts`
- `CV_Manager_React/src/domain/targetedRegeneration.ts`
- `CV_Manager_React/src/domain/targetedRegeneration.types.ts`
- `CV_Manager_React/src/domain/targetedRegenerationFeedback.ts`
- `CV_Manager_React/src/promptBuilders.ts`
- `CV_Manager_React/src/components/tabs/ScreeningLab.tsx`
- `CV_Manager_React/src/components/tabs/screeningReviewRepairPanels.tsx`

Tests/config:

- `CV_Manager_React/scripts/smoke-summary-quality-contract.mjs`
- `CV_Manager_React/scripts/smoke-summary-generator-review-alignment.mjs`
- `CV_Manager_React/scripts/smoke-summary-repair-convergence.mjs`
- `CV_Manager_React/scripts/smoke-targeted-prompt-contract.mjs`
- `CV_Manager_React/scripts/smoke-hiring-manager-review-gate.mjs`
- `CV_Manager_React/scripts/smoke-repair-workflow-consolidation.mjs`
- `CV_Manager_React/e2e/targeted-regeneration-runtime.spec.ts`
- `CV_Manager_React/package.json`

Governance/report:

- `docs/governance/tasks/P4-ALIGN-001.md`
- `docs/governance/phase4/P4_ALIGN_001_SUMMARY_PIPELINE_ALIGNMENT_REPORT.md`
- `docs/governance/CURRENT_STATE.md`
- `docs/governance/MASTER_TASK_ROADMAP.md`
- `docs/governance/COMPLETION_REPORT.md`

## Forbidden Files

- Scoped patch validation behavior
- Export semantics
- Persistence architecture
- Canonical runtime data
- EvidenceCard source data
- Unrelated work-bullet review rules
- Unrelated UI layout
- Previous task history
- Phase 5 plans or tasks

## Acceptance Criteria

1. One typed Summary Quality Contract is created and owned by a single domain module.
2. Initial Summary generation consumes the contract, including positioning mode, criteria, prohibited claims, and word limit.
3. Targeted Summary regeneration consumes the contract and failed criterion IDs.
4. Hiring-manager review evaluates the same criterion IDs.
5. Generator and reviewer use the same positioning mode.
6. Unsupported core requirements cannot be invented.
7. Adjacent or transferable fit is not reviewed as a failed false direct-fit claim.
8. Genuine missing core requirements remain application-fit risk, not Summary-writing blockers.
9. Fixable Summary-quality issues remain blockers.
10. Fit-risk-only outcome does not trigger another Summary regeneration.
11. Criterion-level before/after repair results are persisted and displayed.
12. Passed criteria are preserved during repair.
13. Evidence-needed criteria stop the AI rewrite loop.
14. Review output is tied to current CV hash.
15. No review, export, validation, or evidence rule is weakened.
16. No unsupported claim is introduced.

## Required Validation

- `npm run smoke:summary-quality-contract`
- `npm run smoke:summary-generator-review-alignment`
- `npm run smoke:summary-repair-convergence`
- Targeted regeneration regressions
- Scoped validation regressions
- P4-AR regressions
- P4-FINAL regressions
- Phase 4 UX regressions
- Product Acceptance and browser no-AI guard where feasible
- `npm run build`
- `npm run test:system`

## Completion Rule

Mark DONE only when the real Azure Solution Specialist scenario no longer ends with a vague repeated Summary blocker. The final state must show either passed Summary quality, precise remaining criterion failures, or an explicit evidence/positioning limitation that stops another automatic Summary rewrite.

## Implementation Evidence

- Added the authoritative Summary Quality Contract owner in `CV_Manager_React/src/domain/summaryQualityContract.ts`.
- Initial Screening CV prompt now includes the Summary Quality Contract.
- Targeted Summary regeneration now carries `failedSummaryCriterionIds` and includes the same contract in the prompt.
- Hiring-manager review now evaluates the same Summary criterion IDs and separates fit-risk-only results from Summary rewrite blockers.
- Review Snapshot now stores `summaryQualityContract`, `summaryReviewResult`, and before/after Summary review results.
- Repair Workflow now renders criterion-level before/after Summary review rows and no longer repeats the vague post-repair `Summary still needs clearer role fit` message when a structured result exists.
- Focused deterministic smokes and broad non-browser regressions passed.
- `npm run build` passed.
- `npm run test:system` passed all checks until `smoke:server`, then failed only because sandbox blocked localhost listen with `EPERM`.
- Browser Product Acceptance and browser no-AI passed after localhost escalation.
- Targeted runtime E2E fixture was updated for the new criterion contract, but the required rerun could not complete because escalation was rejected by Codex usage limit.
- Real Azure Solution Specialist AI acceptance was not run for the same environment/usage-limit reason.

## Blocker

The task cannot be marked DONE because the DONE gate requires real Azure Solution Specialist acceptance and a post-update targeted runtime E2E rerun. Both require localhost/browser or real-AI execution that was blocked by the current Codex usage-limit escalation failure.
