# P5-BACKBONE-001 — Backbone Lineage, Job State, and CV Invalidation Repair

Status: DONE

## Reopened After Post-Implementation Audit

- Reopened: 2026-07-18.
- Reason: the prior DONE claim was not accepted. Audit evidence confirmed that Writer-visible Evidence bypassed the canonical policy, Evidence batch apply lacked a verifiable task envelope, coverage was not shared by both required UI workspaces, and Project task identity omitted material identity inputs.
- Failed acceptance criteria: canonical Evidence use at every Writer input boundary; atomic Evidence batch identity/scope validation; shared traceability/CV-usable coverage; complete Project task identity; scoped readiness/freshness evidence; and focused regression coverage.
- Correction files: `CV_Manager_React/src/data/evidence.ts`, `src/data/projectTaskInput.ts`, `src/data/backbone.ts`, `src/data/selection.ts`, `src/promptBuilders.ts`, `src/components/tabs/{CareerSource,EvidenceBank}.tsx`, review/export freshness owners if required by evidence, and focused smoke scripts/package registration.
- Required regressions: Writer policy partitioning, Evidence envelope rejection/atomicity, coverage matrix and both UI consumers, material/non-material Project identity, selected-input readiness, stale review/export, Job/CV status, and existing Writer/reviewer/export/workflow checks.
- Initial validation attempt: `smoke:server` was `BLOCKED_BY_ENVIRONMENT` because the execution sandbox could not bind to localhost (`EPERM`). This is historical execution context, not the final validation state.
- Final validation: the server smoke was subsequently executed using an isolated local test-server approach and passed. The complete `npm run test:system`, including server persistence validation, also passed.
- The prior completion report is historical and non-authoritative until this reopened task passes every corrected acceptance criterion.

## Model Routing

- Selected AI: Codex
- Model: GPT-5.6 Terra
- Reasoning: High
- Reason: Cross-boundary production correctness work covering canonical persistence, evidence lineage, CV identity, review freshness, and bounded repair/export boundaries.
- Escalation trigger: Any required architecture, ADR, or lifecycle policy not supported by current authority stops unsafe mutation and becomes an owner decision.

## Objective

Repair the existing Experience Backbone flow so upstream mutations are validated, reconciled, invalidate affected downstream artifacts, and require explicit regeneration before review, repair, or export can treat a CV as current.

## Scope

1. Establish baseline results and focused reproductions before behavior changes.
2. Correct hook routing, load-error/retry handling, Job/CV selection reconciliation, and CV-to-Job status preservation.
3. Add a canonical Evidence validation path, safe lineage/coverage rules, task-envelope validation, canonical task input identity, and task-state preservation.
4. Add scoped Backbone readiness and upstream stale/invalidation behavior.
5. Centralize affected Backbone mutations through existing-domain-compatible commands/services; no parallel Backbone or Evidence source of truth.
6. Consolidate Job creation and strengthen supported persistence failure/retry behavior.
7. Refactor `App.tsx` only after correctness tests protect behavior.
8. Update only implementation-grounded governance records and completion evidence.

## Allowed Files

- `CV_Manager_React/src/**`
- `CV_Manager_React/server*.cjs`, `CV_Manager_React/storage*.cjs`, and existing persistence helpers only when evidence requires it
- `CV_Manager_React/scripts/**`, `CV_Manager_React/package.json`, and existing tests/smokes
- `docs/governance/tasks/P5-BACKBONE-001.md`
- `docs/governance/{CURRENT_STATE.md,MASTER_TASK_ROADMAP.md,COMPLETION_REPORT.md}`
- `docs/{INDEX.md,DOCUMENT_REGISTRY.yaml,DOCUMENT_RELATIONSHIPS.md,CONFLICT_RESOLUTION_LOG.md,architecture/CURRENT_ARCHITECTURE.md}` only for accepted implemented behavior

## Forbidden Files

- `CV_Manager_React/data/app_data.json`
- `CV_Manager_React/data/prompt_templates.json`
- Legacy HTML/Python surfaces
- Any document under `docs/draft/` or `docs/archive/` as an implementation authority

## Required Invariants

- Canonical persistence remains `data/app_data.json`; split JSON files remain mirrors.
- AI actions remain explicit and user-triggered; no hidden regeneration or token spend.
- Evidence visible to Writer remains lineage-valid and CV-usable.
- Review, repair, and export remain bound to current CV identity; Export does not rewrite content.
- Applied/Archived lifecycle states are not silently contradicted by mutable-JD or older-CV saves.
- Existing legacy records remain readable through safe migration/compatibility logic.

## Internal Phases and Acceptance

- [x] Baseline build, system, focused smoke results, and confirmed reproduction tests recorded.
- [x] Hook routing and load failure/retry state are implemented with recoverable UI states.
- [x] Job/CV selection reconciliation and non-regressive lifecycle status are covered by focused smoke.
- [x] Evidence validation, coverage, task identity, task state, and scoped readiness are centralized and tested.
- [x] Upstream mutation reconciles Backbone task identity and existing CV/review/export freshness remains content-identity-bound without AI execution.
- [x] Job creation and persistence failure/retry use one validated path where supported by the existing revision API.
- [x] `App.tsx` uses stable fixture routing and a bounded Backbone mutation boundary after correctness coverage.
- [x] Required focused, regression, build, system, and relevant smoke checks passed; the initial sandbox-only server attempt remained documented as historical context.
- [x] Documentation/status/registry updates reflect only implemented behavior.

## Completion Evidence

- Reopened repair PASS: `smoke:p5-evidence-contract` proves canonical Writer partitioning, traceability/CV-usable coverage distinction, atomic Evidence task-envelope rejection, and Project input/hash/prompt identity.
- Regression PASS: `smoke:backbone-integrity`, `smoke:job-cv-status`, `smoke:cv-brief`, `smoke:writer-input`, `smoke:writer-output`, `smoke:export-readiness`, `smoke:review-freshness`, `smoke:reviewer-policy`, `smoke:product-acceptance`, `smoke:repair-regression`, and `smoke:repair-policy`.
- `npm run build`: PASS. `npm run test:system`: PASS when the required localhost persistence smoke was run outside the sandbox; all system constituents passed, including `smoke:server`.
- Final build validation: PASS.
- Final focused regression validation: PASS.
- Final server persistence validation: PASS.
- Final system validation: PASS.
- Environment blocker at completion: NONE.
- Repository limitation: the source workspace has no `.git`; `.push-staging/` is a separate docs-only repository at `be81a92`. Source branch/commit, working-tree status, and source rollback/diff traceability cannot be claimed from repository evidence.
- Canonical runtime data was not read, written, or migrated by this task. AI was not invoked by a mutation or validation path.

## Rollback

Revert this task's code and documentation changes as one commit. Canonical runtime data is never rewritten by the task, so rollback must not require data restoration.

## Definition of Done

The existing Backbone is the sole validated source for lineage-sensitive mutations; selected Job/CV state remains coherent; affected CVs become explicitly stale; and stale review/export state cannot be treated as current.
