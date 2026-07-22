# P17-SCREENING-TO-BRIEF-CONTRACT-001 — Canonical Screening-to-Brief Contract Remediation

Status: DONE

## Model Routing

- Selected AI: Codex
- Model: GPT-5.6 Terra
- Reasoning: High
- Reason: This bounded remediation crosses Screening canonical identity, CV Brief
  construction, Writer claim safety, staleness authorization, LOW_FIT workflow
  continuation, and P16 derived checklist state.
- Escalation trigger: Stop only if formal authority conflicts, a new ADR is
  required, or a second effective READY task is found.

## Objective

Make `requirementMatrix` the sole canonical Screening-to-Brief requirement
mapping for new production work. The existing deterministic CV Brief and Writer
context path must consume current canonical analysis, preserve evidence safety
and claim boundaries, reject legacy authorization, and stale correctly without
adding a parallel Screening, Fit, Brief, or workflow system.

## Dependencies

- `docs/INDEX.md`
- `docs/architecture/CURRENT_ARCHITECTURE.md`
- Approved ADRs in `docs/adr/ADR_INDEX.md`
- `docs/governance/PROJECT_RULES.md`
- `docs/governance/CONTRACT_INDEX.md`
- P8 Golden, P14, P15, P15R, P15R2, and P16 completion records
- Existing Screening, selection/Brief, Writer, review/export, and identity
  owners named by the active contract index

## Allowed Files

- Existing Screening analysis/schema/identity and requirement-matrix owners
  under `CV_Manager_React/src/`
- Existing CV Brief/evidence-selection/Writer-context/staleness owners,
  including `src/data/selection.ts`, `src/types.ts`, `src/promptBuilders.ts`,
  `src/domain/`, and the directly related `ScreeningLab` presentation owner
- Existing focused P7/P8/P14/P15/P15R/P15R2/P16, selection, Brief, Writer,
  review, repair, export, no-AI, and browser regression fixtures/scripts
- `CV_Manager_React/package.json` only when a focused P17 smoke needs a script
- This task and directly related active contract, state, roadmap, registry,
  relationship, completion, and acceptance records

## Forbidden

- A second Screening, Fit, requirement mapping, evidence-selection, CV Brief,
  or workflow-state owner
- Fit weights/ranking changes, fixture special-casing, RAG, hidden AI, or any
  automatic Screening, Brief creation, CV generation, Parse, or Save
- Runtime data rewrites, silent legacy migration, persistence/recovery redesign,
  Proposed ADR approval, broad `App.tsx` refactor, Git history changes, commit,
  or push

## Acceptance Criteria

- [x] Fail-first proves at least one real legacy/canonical production-path defect.
- [x] New CV Brief construction consumes current `requirementMatrix` only and
  does not require `jdEvidenceMapping` or `supportLevel`.
- [x] Direct, transferable, partial, learnable, core-gap, and formal-risk rows
  preserve their canonical claim and positioning boundaries.
- [x] Evidence ID existence, identity, visibility, `cvUsage`, blocked terms,
  forbidden claims, and visible-claim boundaries are enforced before Writer use.
- [x] Legacy analysis remains historical/read-only and cannot authorize a
  current CV Brief or Writer context.
- [x] Brief identity becomes stale when current matrix, candidate positioning,
  evidence safety/content, JD, or applicable contract identity changes; no
  automatic regeneration occurs.
- [x] LOW_FIT without a hard block can continue only through explicit user
  action and produces an evidence-grounded adjacent-positioning Brief.
- [x] P16 Step 5 is Ready only for a current, authorized CV Brief.
- [x] Deterministic P17 coverage includes requirement-matrix-only input, core
  gap exclusion, visibility/`cvUsage`, transferable/partial/formal semantics,
  LOW_FIT continuation, staleness, legacy blocking, P16 state, and no-AI.
- [x] Required focused, build, system/server, browser, and existing downstream
  regressions pass; P8 Golden ranking remains unchanged.
- [x] Active contracts and governance records describe the completed owner;
  P17 is DONE and effective READY task count returns to zero.

## Rollback

Revert only the bounded owner integration and tests. Existing persisted legacy
results remain readable but do not gain authorization; no runtime-data migration
or destructive rewrite is permitted.

## Completion Evidence

- Fail-first: a `CORE_CAPABILITY_GAP` with `FORBIDDEN` usage was reintroduced
  into `mustShowEvidenceIds` by legacy `recommendedEvidenceIds`.
- `buildCvBrief`, recommendation selection, and Writer context now consume the
  canonical matrix; a mapping-only legacy result cannot authorize a current
  Brief or Writer context.
- `smoke:p17-screening-to-brief-contract` covers 12 deterministic safety,
  staleness, legacy, LOW_FIT/P16, and no-AI cases. P7 staleness, P8 Golden,
  P16, build, system, JD Import compatibility, and browser no-AI regressions
  passed. No runtime data was rewritten and no AI action was invoked.
