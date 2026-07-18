# P3-CONFIG-001 — Isolate Config Smoke Test Environment

Status: DONE

## Objective

Make `smoke:config` deterministic and isolated from local `.env` values while preserving normal runtime `.env` loading and explicit process environment overrides.

## Confirmed Problem

`npm run test:system` failed before Phase 3 logic because `smoke:config` received a local `.env` `CODEX_MODEL` value instead of the fixture-controlled `CODEX_MODEL`.

## Scope

Only the config-resolution boundary:

- config loader
- `.env` loading precedence
- `serverConfig.cjs`
- config smoke test
- test process environment setup

## Allowed Files

- `CV_Manager_React/serverConfig.cjs`
- `CV_Manager_React/scripts/smoke-server-config.mjs`
- `docs/governance/tasks/P3-CONFIG-001.md`
- `docs/governance/tasks/P3-001.md`
- `docs/governance/MASTER_TASK_ROADMAP.md`
- `docs/governance/CURRENT_STATE.md`
- `docs/governance/COMPLETION_REPORT.md`
- `docs/governance/phase3/PHASE3_WAVE1_COMPLETION_REPORT.md`

## Forbidden Files

- Phase 3 repair plan
- workflow state
- CTA resolver
- review logic
- writer or JD prompts
- evidence data
- canonical runtime data
- persistence architecture

## Acceptance Criteria

- [x] Local `.env` does not affect `smoke:config`.
- [x] Test-provided model value resolves exactly.
- [x] Explicit runtime env override still works.
- [x] Missing config uses documented fallback.
- [x] Test restores prior `process.env`.
- [x] Unsupported `gpt-5-mini` remains rejected.
- [x] `npm run smoke:config` passes.
- [x] Focused automation/config tests pass.
- [x] `npm run build` passes.
- [x] `npm run test:system` passes.
- [x] P3-001 required validation passes.

## Required Tests

- `npm run smoke:config`
- `npm run smoke:automation`
- `npm run smoke:automation-service`
- `npm run smoke:phase3-wave1`
- `npm run smoke:repair-regression`
- `npm run smoke:workflow`
- `npm run smoke:reviewer`
- `npm run smoke:review-roles`
- `npm run smoke:export-readiness`
- `npm run smoke:writer-output`
- `npm run build`
- `npm run test:system`

## Rollback Strategy

Revert:

- `CV_Manager_React/serverConfig.cjs`
- `CV_Manager_React/scripts/smoke-server-config.mjs`

Then restore this task and P3-001 status to their prior blocked state.

## Definition of Done

All required tests pass and P3-001 can be marked `DONE`.

## Completion Report

- Confirmed root cause: `createServerConfig()` loaded `.env` during `smoke:config`, allowing local `.env` values to override fixture-controlled values.
- Runtime behavior preserved: normal startup still reads `.env`; explicit env values are preserved; model configuration remains externally configurable.
- Test isolation: `smoke:config` disables `.env` loading for the fixture, controls relevant env keys, restores modified process env keys, and verifies `gpt-5-mini` rejection.
- Validation: config, automation, P3-001 focused tests, build, and `npm run test:system` passed.
