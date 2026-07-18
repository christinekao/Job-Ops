# P4-ALIGN-001 - Summary Pipeline Alignment Report

Status: BLOCKED_AFTER_IMPLEMENTATION

## Forensic Alignment Audit

| Stage | Prompt / logic owner | Inputs before this task | Alignment break |
|---|---|---|---|
| Initial Summary generation | `CV_Manager_React/src/promptBuilders.ts::buildScreeningCvPrompt` | Screening Analysis, CV Brief, selected evidence, broad manager-review checklist | Did not consume explicit Summary criterion IDs, positioning mode, unsupported core requirements, or the same contract used by review. |
| Targeted Summary regeneration | `CV_Manager_React/src/promptBuilders.ts::buildTargetedRegenerationPrompt` | Current Summary, selected evidence, blocker IDs, allowed mutation zone | Did not receive failed Summary criterion IDs or criterion-level review results. |
| Hiring-manager relevance review | `CV_Manager_React/src/domain/screeningReview.ts::hiringManagerReview` | CV, job analysis, gate result | Compressed Summary role-fit into `wouldInterview`, risks, and rewrite items. |
| Summary repair guidance | `screeningReviewRepairPanels.tsx`, `reviewFreshness.ts`, `repairOrchestrator.ts` | Generic blocker text and post-repair reason strings | Could repeat `Summary still needs clearer role fit` even when the remaining concern was factual application-fit risk. |

Primary alignment break: generator, targeted regeneration, reviewer, and repair UI did not share a typed Summary Quality Contract.

## Authoritative Contract Owner

Owner: `CV_Manager_React/src/domain/summaryQualityContract.ts`

The owner now provides:

- `buildSummaryQualityContract`
- `evaluateSummaryQuality`
- shared criterion IDs
- positioning mode
- supported strengths
- unsupported core requirements
- prohibited claims
- wording constraints
- max Summary word limit

## Criteria Used

- `summary-role-identity`
- `summary-relevant-capability`
- `summary-business-value`
- `summary-evidence-grounding`
- `summary-customer-context`
- `summary-career-positioning`
- `summary-clarity`

## Positioning Mode Decision

The contract derives positioning mode from Screening Analysis support levels and selected evidence:

- `direct-fit` when no unsupported core requirements remain and support is strong enough
- `adjacent-fit` when support is partial but credible
- `transferable-fit` when the role relies on transferable evidence
- `not-recommended` when Screening Analysis says avoid

For the current Azure/Microsoft fixture, deterministic contract smoke reports:

- positioning mode: `not-recommended`
- unsupported core requirements: `7`

This means the system must not fabricate direct Azure Solution Specialist ownership.

## Blocker vs Fit-Risk Separation

Summary quality blockers now come from failed contract criteria with `fixability: "summary-rewrite"`.

Application-fit risk remains visible but does not automatically trigger another Summary regeneration when:

- the remaining issue is unsupported core experience
- the remaining issue needs evidence
- the Summary quality criteria have passed

## Behavior Before / After

Before:

- targeted Summary regeneration could apply successfully and still return a vague repeated role-fit blocker
- post-repair UI stored only string failed criteria
- generator and reviewer did not share criterion IDs

After:

- initial prompt includes `Summary Quality Contract`
- targeted Summary prompt includes `summaryQualityContract` and `failedSummaryCriterionIds`
- reviewer evaluates the same criterion IDs
- Review Snapshot persists `summaryQualityContract`, `summaryReviewResult`, and before/after Summary review results
- Repair Workflow renders criterion-level before/after rows
- fit-risk-only Summary results do not show another Summary regeneration CTA

## Files Changed

Production:

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
- `CV_Manager_React/e2e/targeted-regeneration-runtime.spec.ts`
- `CV_Manager_React/package.json`

Governance:

- `docs/governance/tasks/P4-ALIGN-001.md`
- `docs/governance/phase4/P4_ALIGN_001_SUMMARY_PIPELINE_ALIGNMENT_REPORT.md`
- `docs/governance/CURRENT_STATE.md`
- `docs/governance/MASTER_TASK_ROADMAP.md`
- `docs/governance/COMPLETION_REPORT.md`

## Automated Tests

Passed:

- `npm run smoke:summary-quality-contract`
- `npm run smoke:summary-generator-review-alignment`
- `npm run smoke:summary-repair-convergence`
- `npm run smoke:targeted-prompt-contract`
- `npm run smoke:targeted-output-schema`
- `npm run smoke:scoped-target-validation`
- `npm run smoke:targeted-patch-application`
- `npm run smoke:targeted-regeneration`
- `npm run smoke:targeted-regeneration-runtime`
- `npm run smoke:targeted-regeneration-feedback`
- `npm run smoke:repair-workflow-consolidation`
- `npm run smoke:repair-orchestrator`
- `npm run smoke:safe-repair-executor`
- `npm run smoke:batch-repair-proposals`
- `npm run smoke:repair-loop`
- `npm run smoke:phase4-guided-blockers`
- `npm run smoke:phase4-guided-editing`
- `npm run smoke:phase4-ai-explainability`
- `npm run smoke:phase4-decision-confidence`
- `npm run smoke:product-acceptance`
- `npm run smoke:workflow`
- `npm run smoke:reviewer`
- `npm run smoke:export-readiness`
- `npm run smoke:no-ai-invocation`
- `npm run build`
- `npm run e2e:product-acceptance` passed 13/13 after localhost escalation
- `npm run e2e:no-ai` passed 1/1 after localhost escalation

Partially passed:

- `npm run test:system` passed build, http, config, storage, workflow, reviewer, review-roles, automation, and automation-service, then failed only at `smoke:server` because sandbox blocked `127.0.0.1` listen with `EPERM`.

Not completed:

- `npm run e2e:targeted-regeneration-runtime` rerun after fixture update could not be completed because sandbox escalation was rejected by Codex usage limit.
- Real Azure Solution Specialist AI acceptance was not run because it requires explicit token-spending runtime and the current environment hit the same usage-limit escalation barrier.

## Real-AI Acceptance

Not completed.

Reason: escalation for localhost/browser rerun was rejected by Codex usage limit after implementation. The task DONE gate requires real Azure Solution Specialist acceptance, so this task cannot be marked DONE in this run.

## Remaining Genuine Job-Fit Gaps

The current Azure/Microsoft fixture is classified as `not-recommended` by the deterministic Summary Quality Contract because unsupported core requirements remain. The system must preserve these as fit risk or evidence/positioning limitations, not invent:

- quota-carrying sales experience
- presales ownership
- Azure architecture delivery
- cloud migration ownership
- enterprise deal closing
- formal solution-specialist title

## Safety Confirmation

- No runtime data was modified.
- No export semantics were changed.
- Scoped validation behavior was not relaxed.
- Unsupported-claim and traceability safeguards remain active.
- The change does not force Summary pass.
- Phase 5 was not started.

## Stop Reason

Blocked after implementation due to incomplete required browser/real-AI acceptance caused by environment usage-limit escalation failure. Do not promote another task until P4-ALIGN-001 acceptance is rerun and approved.
