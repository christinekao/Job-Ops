# Master Task Roadmap

Status: Governance v1 roadmap.

Status: Governance v1 historical tasks are COMPLETE. `DOC-GOV-001` is DONE.

## Documentation Governance Cleanup

| Task | Objective | Status | Dependency |
|---|---|---|---|
| `docs/governance/tasks/DOC-GOV-001.md` | Inventory, classify, resolve, and index all `docs/` governance without production changes | DONE | Explicit user authorization |

`DOC-GOV-001` was documentation-only. It did not authorize production code, runtime, prompt, test, or runtime-data changes. No follow-on task is READY.

## Task Order

| Order | Task File | Objective | Dependency | Risk | Validation |
|---:|---|---|---|---|---|
| 1 | `archive/tasks/TASK-001.md` | Validate governance package and promote/adjust file placement decision | none | Low, docs only | Markdown/scope/dependency checks |
| 2 | `archive/tasks/TASK-002.md` | Record the intentional absence of a canonical CV and classify available artifacts | TASK-001; ADR-001 accepted | Low, docs only | Artifact matrix completed |
| 3 | `archive/tasks/TASK-003.md` | Build CV quality trace from actual generated CV to evidence | TASK-002 | Low, docs only | Trace matrix completed |
| 4 | `archive/tasks/TASK-004.md` | Add contract fixtures for CV Brief | TASK-003 | Medium | Build + targeted fixture/smoke |
| 5 | `archive/tasks/TASK-005.md` | Add Writer input snapshot tests | TASK-004 | Medium | Build + prompt snapshot checks |
| 6 | `archive/tasks/TASK-006.md` | Add Writer output validation guard | TASK-005 | Medium | Build + reviewer/workflow smoke |
| 7 | `archive/tasks/TASK-007.md` | Extract local reviewer fix service | TASK-006 | High | Build + workflow/reviewer smoke |
| 8 | `archive/tasks/TASK-008.md` | Add repair green-area regression tests | TASK-007 | Medium | Repair fixture tests |
| 9 | `archive/tasks/TASK-009.md` | Review snapshot identity hardening decision and implementation | TASK-008 | Medium | Workflow smoke |
| 10 | `archive/tasks/TASK-010.md` | Clarify prompt template ownership | TASK-005 | Low/Medium | Docs + tests if behavior changes |
| 11 | `archive/tasks/TASK-011.md` | Export readiness fixture and text-layer validation | TASK-009 | Medium | Export/reviewer smoke |
| 12 | `archive/tasks/TASK-012.md` | Finalize project `AGENTS.md` from draft | TASK-001 through relevant implementation tasks | Low | User approval + docs check |

## Dependency Rules

- Do not merge tasks.
- Do not start `TASK-002` until `TASK-001` is accepted.
- Do not change runtime prompt behavior until prompt ownership and Writer input contracts are validated.
- Do not extract repair code until Writer output validation exists.
- Do not finalize `AGENTS.md` while critical unresolved questions remain.

## Out of Scope for This Roadmap

- Full product rewrite
- Replacing React/Vite/local Node stack
- Hidden autonomous AI loops
- Treating legacy HTML as active product surface
- Production data migrations without a dedicated task

## Phase 2 Status

- Wave 1 Context Integrity: completed under explicit user authorization.
- Atomic scope completed: P2-001 through P2-006.
- Completion evidence: `docs/governance/phase2/Wave1_Completion_Report.md`.

## Phase 2 Wave 2 Preparation

Status: DONE. P2-007 through P2-011 are DONE.

Preparation evidence: `docs/governance/phase2/Wave2_READY_PREPARATION_REPORT.md`.

| Task | Objective | Status | Dependency |
|---|---|---|---|
| `docs/governance/tasks/P2-007.md` | Validate EvidenceCard-only bullet ID namespace | DONE | P2-003 DONE |
| `docs/governance/tasks/P2-008.md` | Validate trace coverage and duplicate visible content before apply | DONE | P2-007 DONE |
| `docs/governance/tasks/P2-009.md` | Enforce approved contact completeness at apply/export boundary | DONE | P2-006 DONE; P2-008 DONE; readiness accepted |
| `docs/governance/tasks/P2-010.md` | Separate application-fit gaps from visible-CV integrity | DONE | P2-008 DONE; P2-009 safeguards accepted |
| `docs/governance/tasks/P2-011.md` | Require evidence before classifying Unknown keyword support as supported | DONE | P2-007 DONE; P2-010 DONE; missing priority matrix not material |

No Wave 2 task is currently READY. Wave 2 implementation tasks P2-007 through P2-011 are DONE.

## Phase 3 Wave 1 Status

Status: DONE. No Phase 3 task is READY.

| Task | Objective | Status | Dependency |
|---|---|---|---|
| `docs/governance/tasks/P3-CONFIG-001.md` | Isolate config smoke tests from local `.env` while preserving runtime env overrides | DONE | P3-001 system-test blocker |
| `docs/governance/tasks/P3-001.md` | Implement bounded repair planning, explicit local repair results, affected-zone preservation, and centralized primary CTA | DONE | Phase 3 design docs accepted; Phase 2 Wave 2 DONE; P3-CONFIG-001 DONE |

P3-CONFIG-001 and P3-001 are complete. `npm run test:system` passes after sandbox-approved localhost server execution for `smoke:server`. Do not start Phase 3 Wave 2 without explicit authorization.

## Architecture Cleanup Wave 1

Status: DONE. No Architecture Cleanup Wave 2 task is READY.

| Task | Objective | Status | Dependency |
|---|---|---|---|
| `docs/governance/tasks/P3-ARCH-001.md` | Centralize Review Evaluation and Export Decision so UI components cannot independently define export readiness | DONE | P3-001 DONE; Architecture Dependency Audit complete |

P3-ARCH-001 completed with focused regressions, build, and `npm run test:system`. It does not authorize the next architecture wave.

## Architecture Cleanup Wave 2

Status: DONE. No Architecture Cleanup Wave 3 task is READY.

| Task | Objective | Status | Dependency |
|---|---|---|---|
| `docs/governance/tasks/P3-ARCH-002.md` | Extract Review / Repair / CTA / Export presentation panels from `ScreeningLab.tsx` without changing domain behavior | DONE | P3-ARCH-001 DONE; Architecture Refactoring Wave 1 complete |

P3-ARCH-002 completed with focused presentation smoke coverage, focused regressions, build, and `npm run test:system`. It does not authorize the next architecture wave.

## Architecture Cleanup Wave 3

Status: DONE. No Architecture Cleanup Wave 4 task is READY.

| Task | Objective | Status | Dependency |
|---|---|---|---|
| `docs/governance/tasks/P3-ARCH-003.md` | Create an explicit final Reviewer / Repair / Export action pipeline with one result and scoped refresh lifecycle | DONE | P3-ARCH-001 DONE; P3-ARCH-002 DONE; Wave 3 design accepted |

P3-ARCH-003 completed with focused action-pipeline smoke coverage, Wave 1/2 regressions, build, and `npm run test:system`. It does not authorize Wave 4.

## Phase 4 Wave 1 - Product Experience

Status: DONE. No Phase 4 Wave 2 task is READY.

| Task | Objective | Status | Dependency |
|---|---|---|---|
| `docs/governance/tasks/P4-UX-001.md` | Replace raw final review/export blocker lists with guided blocker cards, progress, effort, and fix navigation without changing domain rules | DONE | Phase 3 Architecture Cleanup Wave 3 DONE; explicit Phase 4 Wave 1 authorization |

P4-UX-001 completed with focused UX smoke coverage, Phase 3 presentation/action regressions, workflow, repair, reviewer, review-role, export-readiness, build, and `npm run test:system`. It does not authorize P4-UX-002.

## Phase 4 Wave 2 - Product Experience

Status: DONE. No Phase 4 Wave 3 task is READY.

| Task | Objective | Status | Dependency |
|---|---|---|---|
| `docs/governance/tasks/P4-UX-002.md` | Make blocker `Jump to Fix` open CV Studio at a structured edit target with scroll, focus, temporary highlight, and guided context | DONE | P4-UX-001 DONE; Phase 3 action pipeline DONE; explicit Phase 4 Wave 2 authorization |

P4-UX-002 completed with focused guided-editing tests, Phase 4 blocker tests, Phase 3 action-pipeline tests, workflow, reviewer/export tests, build, and `npm run test:system`.

## Phase 4 Wave 3 - Product Experience

Status: DONE.

| Task | Objective | Status | Dependency |
|---|---|---|---|
| `docs/governance/tasks/P4-UX-003.md` | Improve Review / Repair / Export explainability so users understand what AI changed, did not change, why, and what to do next | DONE | P4-UX-001 DONE; P4-UX-002 DONE; explicit Phase 4 Wave 3 authorization |

P4-UX-003 completed with focused AI explainability tests, Phase 4 Wave 1/2 regressions, Phase 3 action-pipeline tests, workflow, reviewer/export tests, build, and `npm run test:system`.

## Phase 4 Wave 4 - Product Experience

Status: DONE. No Phase 5 task is READY.

| Task | Objective | Status | Dependency |
|---|---|---|---|
| `docs/governance/tasks/P4-UX-004.md` | Present decision confidence and export readiness so users can distinguish blockers, warnings, manual review, and one recommendation without changing export rules | DONE | P4-UX-001 DONE; P4-UX-002 DONE; P4-UX-003 DONE; explicit Phase 4 Wave 4 authorization |

P4-UX-004 completed with focused decision-confidence tests, Phase 4 Wave 1/2/3 regressions, Phase 3 action-pipeline tests, workflow, reviewer/export tests, build, and `npm run test:system`. It does not authorize Phase 5.

## Product QA - Deterministic Acceptance Test

Status: DONE. No Phase 5 task is READY.

| Task | Objective | Status | Dependency |
|---|---|---|---|
| `docs/governance/tasks/P4-QA-001.md` | Add deterministic product acceptance suite with simulated user journey, HR gate, Hiring Manager gate, final release gate, and no-AI safeguards | DONE | Phase 4 Wave 1-4 DONE; explicit Product Acceptance Test authorization |

P4-QA-001 completed with product acceptance, HR gate, Hiring Manager gate, no-AI, Phase 4 regressions, workflow, reviewer/export tests, build, and `npm run test:system`. It does not authorize Phase 5.

## Product QA - Browser E2E Product Acceptance

Status: DONE. No Phase 5 task is READY.

| Task | Objective | Status | Dependency |
|---|---|---|---|
| `docs/governance/tasks/P4-QA-002.md` | Add browser-based deterministic Product Acceptance E2E coverage for the real UI journey with fixed fixtures and zero real AI invocation | DONE | P4-QA-001 DONE; Phase 4 Wave 1-4 DONE; explicit Browser E2E Product Acceptance authorization |

P4-QA-002 completed with browser Product Acceptance E2E, headed browser Product Acceptance E2E, browser no-AI E2E, deterministic Product QA gates, Phase 4 smokes, workflow, reviewer/export tests, build, and `npm run test:system`. It does not authorize Phase 5.

## Phase 4 UX Simplification - First-Time User IA

Status: DONE. No Phase 5 task is READY.

| Task | Objective | Status | Dependency |
|---|---|---|---|
| `docs/governance/tasks/P4-UX-005.md` | Simplify the Screening Lab reviewer/repair/export information architecture for first-time users without changing domain behavior | DONE | P4-UX-001 through P4-UX-004 DONE; P4-QA-002 DONE; explicit Phase 4 UX Simplification authorization |

P4-UX-005 completed with Phase 4 focused smokes, browser Product Acceptance E2E, browser no-AI guard, workflow, reviewer/export tests, build, and `npm run test:system`. It does not authorize Phase 5.

## Phase 4.5 Wave 1 - Autonomous Repair Engine

Status: DONE. No Phase 4.5 Wave 2 task is READY.

| Task | Objective | Status | Dependency |
|---|---|---|---|
| `docs/governance/tasks/P4-AR-001.md` | Add an isolated AI repair proposal layer so supported blockers preview deterministic repair suggestions before any manual edit or future application step | DONE | P4-UX-005 DONE; P4-QA-002 DONE; explicit Phase 4.5 Wave 1 authorization |

P4-AR-001 completed with repair proposal smoke coverage, Phase 4 focused regressions, browser Product Acceptance E2E, browser no-AI guard, workflow, reviewer/export tests, build, and `npm run test:system`. It does not authorize proposal application or Phase 4.5 Wave 2.

## Phase 4.5 Wave 2 - AI Resume Copilot

Status: DONE. Phase 4.5 target-driven continuation authorized.

| Task | Objective | Status | Dependency |
|---|---|---|---|
| `docs/governance/tasks/P4-AR-002.md` | Add an authoritative Repair Orchestrator that classifies every blocker into one repair route without applying repairs or invoking AI | DONE | P4-AR-001 DONE; P4-QA-001 DONE; P4-QA-002 DONE; P4-UX-005 DONE; explicit P4-AR-002 authorization |

P4-AR-002 completed with repair orchestrator smoke coverage, product acceptance smokes, Phase 4 focused regressions, browser Product Acceptance E2E, browser no-AI guard, workflow, reviewer/export tests, build, and `npm run test:system`. It does not authorize safe-auto application, proposal application, any follow-up task, or Phase 5.

## Phase 4.5 Wave 3 - AI Resume Copilot Target Implementation

Status: DONE. No Phase 5 task is READY.

| Task | Objective | Status | Dependency |
|---|---|---|---|
| `docs/governance/tasks/P4-AR-003.md` | Add deterministic Safe Repair Executor for current, non-stale `safe-auto` classifications | DONE | P4-AR-002 DONE; target-driven AI Resume Copilot authorization |
| `docs/governance/tasks/P4-AR-004.md` | Add batch proposal review/application for accepted approval-required proposals | DONE | P4-AR-003 DONE |
| `docs/governance/tasks/P4-AR-005.md` | Add bounded repair session coordinator | DONE | P4-AR-004 DONE |
| `docs/governance/tasks/P4-AR-006.md` | Add human decision layer and unified target acceptance | DONE | P4-AR-005 DONE |

P4-AR-003 completed with focused safe repair executor coverage, repair orchestrator regression, and build. It does not authorize proposal application, bounded repair sessions, human decision application, export-decision changes, or Phase 5.

P4-AR-004 completed with focused batch proposal coverage, P4-AR-001 proposal regression, and build. It does not authorize bounded repair sessions, human decision application, export-decision changes, or Phase 5.

P4-AR-005 completed with focused bounded repair loop coverage, safe repair executor regression, batch proposal regression, and build. It does not authorize human decision application, export-decision changes, or Phase 5.

P4-AR-006 completed the authorized AI Resume Copilot target implementation with human-decision coverage, unified safe-auto CTA execution, deterministic copilot target smoke, browser Product Acceptance, browser no-AI guard, build, and `npm run test:system`. It does not authorize Phase 5.

## Phase 4.5 Wave 7 - Repair Proposal UI Integration

Status: DONE. No Phase 5 task is READY.

| Task | Objective | Status | Dependency |
|---|---|---|---|
| `docs/governance/tasks/P4-AR-007.md` | Connect approval-required AI proposal UI to existing proposal cards and accepted-proposal batch application without hidden AI or export-rule changes | DONE | P4-AR-001 through P4-AR-006 DONE; explicit P4-AR-007 authorization |

P4-AR-007 completed with focused proposal UI integration coverage, P4-AR regressions, Phase 4 smokes, Product Acceptance smoke, browser Product Acceptance E2E, browser no-AI guard, workflow/reviewer/export regressions, build, and `npm run test:system`. It does not authorize Phase 5.

## Phase 4.5 Wave 8 - AI Suggestion Generation State

Status: DONE. No Phase 5 task is READY.

| Task | Objective | Status | Dependency |
|---|---|---|---|
| `docs/governance/tasks/P4-AR-008.md` | Separate AI suggestion candidates, generation lifecycle, generated proposals, empty/error states, and stale proposals in Screening Lab CTA behavior | DONE | P4-AR-001 through P4-AR-007 DONE; explicit P4-AR-008 authorization |

P4-AR-008 completed with focused proposal-generation lifecycle coverage, proposal UI integration regression, P4-AR regressions, Phase 4 smokes, Product Acceptance smoke, browser Product Acceptance E2E, browser no-AI guard, workflow/reviewer/export regressions, build, and `npm run test:system`. It does not authorize Phase 5.

## Phase 4.5 Wave 9 - Repair Escalation and Targeted Regeneration

Status: DONE. No Phase 5 task is READY.

| Task | Objective | Status | Dependency |
|---|---|---|---|
| `docs/governance/tasks/P4-AR-009.md` | Add explicit repair escalation for targeted section regeneration and human input without hidden AI, automatic loops, or export-rule changes | DONE | P4-AR-001 through P4-AR-008 DONE; explicit P4-AR-009 authorization |

P4-AR-009 completed with focused targeted-regeneration and repair-escalation coverage, proposal/safe-repair/batch/loop/human-decision regressions, Phase 4 smokes, Product Acceptance smoke, browser Product Acceptance E2E, browser no-AI guard, workflow/reviewer/export regressions, build, and `npm run test:system`. It does not authorize Phase 5.

## Phase 4.5 Wave 10 - Targeted Regeneration UI and Action Wiring

Status: DONE. No Phase 5 task is READY.

| Task | Objective | Status | Dependency |
|---|---|---|---|
| `docs/governance/tasks/P4-AR-010.md` | Connect targeted-regeneration and human-input Orchestrator routes to user-facing blocker cards, lifecycle UI, and action dispatch without changing route semantics | DONE | P4-AR-001 through P4-AR-009 DONE; explicit P4-AR-010 authorization |

P4-AR-010 completed with focused targeted-regeneration UI/action smokes, P4-AR regressions, Phase 4 smokes, Product Acceptance smoke, browser Product Acceptance E2E, browser no-AI guard, workflow/reviewer/export regressions, build, and `npm run test:system`. It does not authorize Phase 5.

## Phase 4.5 Wave 11 - Targeted Regeneration Runtime Execution

Status: DONE. No Phase 5 task is READY.

| Task | Objective | Status | Dependency |
|---|---|---|---|
| `docs/governance/tasks/P4-AR-011.md` | Connect visible targeted regeneration to the existing explicit automation runtime with typed identity, permission, lifecycle, validation, safe save, and terminal feedback | DONE | P4-AR-001 through P4-AR-010 DONE; explicit P4-AR-011 authorization |

P4-AR-011 completed with focused runtime/click/action coverage, all P4-AR and Phase 4 regressions, 5-case real-App targeted browser E2E, 13-case Product Acceptance E2E, browser no-AI guard, build, system tests, and manual real-page acceptance. It does not authorize Phase 5.

## Phase 4.5 Wave 12 - Targeted Regeneration Feedback and No-Diff Terminal State

Status: DONE. No Phase 5 task is READY.

| Task | Objective | Status | Dependency |
|---|---|---|---|
| `docs/governance/tasks/P4-AR-012.md` | Make targeted regeneration visibly responsive and prevent same-context no-diff token loops with a persistent terminal identity and alternate next action | DONE | P4-AR-001 through P4-AR-011 DONE; explicit P4-AR-012 authorization |

P4-AR-012 completed with focused feedback/no-diff coverage, all P4-AR and Phase 4 regressions, 5-case real-App targeted browser E2E, 13-case Product Acceptance E2E, browser no-AI guard, build, system tests, and manual real-page acceptance. It does not authorize Phase 5.

## Phase 4.5 Diagnostics Wave 1 - Targeted Regeneration Validation Diagnostics

Status: DONE. No Phase 5 task is READY.

| Task | Objective | Status | Dependency |
|---|---|---|---|
| `docs/governance/tasks/P4-DIAG-001.md` | Expose targeted-regeneration validation as an ordered structured diagnostic trace with exact user-facing reasons and no validation behavior change | DONE | P4-AR-009 through P4-AR-012 DONE; explicit P4-DIAG-001 authorization |

P4-DIAG-001 completed with deterministic diagnostics fixtures, all P4-AR/Phase 4 regressions, 7-case real-ScreeningLab targeted E2E, 13-case Product Acceptance E2E, browser no-AI guard, build, system tests, and one real AI diagnostic acceptance run. It does not authorize a follow-up task or Phase 5.

## Phase 4.5 Validation Wave 1 - Scoped Validation for Targeted Regeneration

Status: DONE. No task is READY. No Phase 5 task is READY.

| Task | Objective | Status | Dependency |
|---|---|---|---|
| `docs/governance/tasks/P4-VAL-001.md` | Replace the full-CV targeted-regeneration apply gate with patch-based scoped validation while retaining unrelated blockers for export | DONE | P4-AR-009 through P4-AR-012 and P4-DIAG-001 DONE; explicit P4-VAL-001 authorization |

P4-VAL-001 completed with separate apply-gate validation categories, pre-existing/new issue comparison, authorized patch extraction, strict preserved-zone enforcement, focused deterministic fixtures, 9-case real-ScreeningLab targeted E2E, 13-case Product Acceptance E2E, browser no-AI guard, build, system tests, and one real AI acceptance run. The real response was blocked for prohibited-zone mutation rather than the pre-existing missing email, and canonical runtime data remained unchanged. It does not authorize another task or Phase 5.

## Phase 4.5 Prompt Wave 1 - Targeted Regeneration Output Contract

Status: DONE. No task is READY. No Phase 5 task is READY.

| Task | Objective | Status | Dependency |
|---|---|---|---|
| `docs/governance/tasks/P4-PROMPT-001.md` | Replace broad full-CV targeted prompts and normalization with minimal target-specific prompts and strict patch-only response contracts | DONE | P4-AR-009 through P4-AR-012, P4-DIAG-001, and P4-VAL-001 DONE; ADR-003; explicit P4-PROMPT-001 authorization |

P4-PROMPT-001 completed with separate Summary/work-bullet/wording prompts, strict target-only parsing, exact invalid-output diagnostics, 75% smaller measured Summary input, all required regressions, and one successful real-AI Summary-only run. The authorized save created a new Microsoft CV version/content hash while preserving every non-Summary zone. It does not authorize another task or Phase 5.

## Phase 4.5 Diagnostic Fix - Summary Review Closure

Status: DONE. No Phase 5 task is READY.

| Task | Objective | Status | Dependency |
|---|---|---|---|
| `docs/governance/tasks/P4-DIAG-FIX-001.md` | Bind post-repair review freshness, blockers, attempt continuity, and next-action UX to the new CV version/content hash | DONE | P4-AR-009 through P4-AR-012, P4-DIAG-001, P4-VAL-001, and P4-PROMPT-001 DONE; explicit P4-DIAG-FIX-001 authorization |

P4-DIAG-FIX-001 completed with a 22-node forensic trace, versioned review/blocker identity, stale-review gating, genuine re-failure closure UI, focused deterministic smokes, targeted E2E 11/11, Product Acceptance E2E 13/13, browser no-AI guard, build, system tests, and one real Microsoft Summary regeneration. The real Summary changed and was reviewed against the exact new version/hash; it genuinely re-failed and now shows new review evidence plus an alternate primary action instead of appearing unattempted. It does not authorize another task or Phase 5.

## Phase 4.5 Final - Repair Workflow Consolidation

Status: DONE. No task is READY. No Phase 5 task is READY.

| Task | Objective | Status | Dependency |
|---|---|---|---|
| `docs/governance/tasks/P4-FINAL-001.md` | Consolidate Review, issue, fix, verification result, and next action into one durable user workflow | DONE | P4-AR-001 through P4-AR-012, P4-DIAG-001, P4-VAL-001, P4-PROMPT-001, and P4-DIAG-FIX-001 DONE; explicit P4-FINAL-001 authorization |

P4-FINAL-001 completed with Review Snapshot ownership of the durable Summary repair result, one Issue → Fix → Review → Next workflow, one primary repair CTA, refresh/remount/navigation continuity, focused regressions, targeted E2E 11/11, Product Acceptance E2E 13/13, browser no-AI guard, build, and system tests. It does not authorize another task or Phase 5.

## Phase 4.5 Alignment - Summary Generation, Review, and Repair

Status: BLOCKED_AFTER_IMPLEMENTATION. No task is READY. No Phase 5 task is READY.

| Task | Objective | Status | Dependency |
|---|---|---|---|
| `docs/governance/tasks/P4-ALIGN-001.md` | Align initial Summary generation, targeted Summary regeneration, hiring-manager review, and Summary repair guidance around one authoritative Summary Quality Contract | BLOCKED_AFTER_IMPLEMENTATION | P4-AR-001 through P4-AR-012, P4-DIAG-001, P4-VAL-001, P4-PROMPT-001, P4-DIAG-FIX-001, and P4-FINAL-001 DONE; explicit P4-ALIGN-001 authorization |

P4-ALIGN-001 implementation completed the contract integration, prompt/reviewer alignment, Review Snapshot persistence, and criterion-level Repair Workflow display. Focused smokes, broad non-browser regressions, Product Acceptance E2E, browser no-AI, and build passed. `npm run test:system` reached only a sandbox localhost `EPERM` at `smoke:server`. Required targeted runtime E2E rerun after fixture update and real Azure Solution Specialist AI acceptance remain blocked by Codex usage-limit escalation failure. Do not mark DONE or promote another task until acceptance is rerun.
