# P6-PERSIST-001 — Preserve Unsynced Application Data After Persistence Conflicts

Status: DONE

## Model Routing

- Selected AI: Codex
- Model: GPT-5.6 Terra
- Reasoning: High
- Reason: This task crosses browser persistence, server revisions, recovery UX, and user-data loss prevention.
- Escalation trigger: A request to auto-merge, auto-overwrite, or redefine canonical server ownership requires an owner decision; this task must not implement it.

## Objective

Prevent browser-only changes from being silently discarded when a revision conflict, offline save, or failed server save is followed by a reload.

## Confirmed Defect

`src/storage.ts::saveData()` writes the active snapshot only to the normal browser cache before sending it to the server. On a `409` or unavailable/failed server save, `App.tsx` tells the user to reload. A later successful `loadData()` fetches the server snapshot and overwrites that normal cache, leaving no durable recovery copy of the rejected browser changes.

## Reproduction

1. Load server revision `r` in browser A.
2. Another browser/process writes revision `r + 1`.
3. Make a change in A; its automatic POST with revision `r` returns `409` (or the server is unavailable).
4. Follow the current recovery instruction and reload.
5. `loadData()` replaces the browser cache with server revision `r + 1`; A's unsynced change is no longer recoverable from the UI.

## Governing Documents

1. `docs/INDEX.md`
2. `docs/architecture/CURRENT_ARCHITECTURE.md`
3. `docs/adr/ADR_INDEX.md` (`ADR-GOV-002`)
4. `docs/governance/DECISIONS.md` (ADR-002)
5. `docs/governance/PROJECT_RULES.md`
6. `docs/governance/tasks/P5-BACKBONE-001.md` (completed persistence baseline)

## Allowed Files

- `CV_Manager_React/src/storage.ts`
- `CV_Manager_React/src/App.tsx`
- `CV_Manager_React/scripts/smoke-p6-persistence-recovery.mjs`
- `CV_Manager_React/package.json`
- `docs/governance/tasks/P6-PERSIST-001.md`
- `docs/governance/{CURRENT_STATE.md,MASTER_TASK_ROADMAP.md,COMPLETION_REPORT.md}`
- `docs/{INDEX.md,DOCUMENT_REGISTRY.yaml,DOCUMENT_RELATIONSHIPS.md,architecture/CURRENT_ARCHITECTURE.md}` only when implementation formalizes an accepted invariant.

## Forbidden Files

- `CV_Manager_React/data/app_data.json`
- `CV_Manager_React/data/prompt_templates.json`
- Legacy HTML/Python surfaces
- Server canonical-write semantics and storage schema
- Any file under `docs/draft/` or `docs/archive/` as implementation authority

## Implementation Phases

1. Add a failing deterministic recovery test covering revision conflict, failed save, reload, recovery retrieval, download, and explicit discard.
2. Add a separate browser recovery record that is never overwritten by a successful server load.
3. Preserve a recovery record for conflict, unknown revision, network failure, and failed save; preserve server revision semantics and forbid automatic merge/overwrite.
4. Surface the recovery record in the app with explicit download and discard choices only.
5. Run focused persistence/UI/source tests, build, and full system validation.

## Acceptance Criteria

- [x] A stale revision conflict preserves an independently recoverable browser snapshot before returning an error.
- [x] A failed/offline save preserves an independently recoverable browser snapshot.
- [x] Loading a valid server snapshot never deletes or overwrites that recovery snapshot.
- [x] The user can download the recovery snapshot and explicitly discard it; no automatic merge, retry, or overwrite occurs.
- [x] Canonical server revision conflict behavior remains unchanged.
- [x] Recovery data cannot silently replace canonical server data.
- [x] Existing local-cache fallback remains readable and corrupted-data behavior remains safe.
- [x] Focused tests, build, and `npm run test:system` pass.
- [x] Canonical runtime data is not changed for testing.

## Migration and Rollback

- Migration: recovery records are optional browser-local records; no canonical data migration occurs.
- Rollback: remove the new browser recovery key and UI. Existing server snapshots and normal local cache remain unchanged.

## Explicit Non-Goals

- No automatic three-way merge.
- No last-write-wins retry.
- No cross-tab synchronization protocol.
- No server or canonical-data schema change.
- No AI invocation or prompt change.

## Completion Report Requirements

Record the before-fix failing test, final focused/system validation, recovery behavior, retained server conflict behavior, and confirmation that P5 remains DONE.

## Completion Evidence

- Before fix: `npm run smoke:p6-persistence-recovery` failed because a reload after `409` changed the only browser copy from `browser-job` to `server-job`.
- Fix: `src/storage.ts` stores an optional, separate unsynced recovery snapshot for conflict, unavailable server, failed save, and unknown revision. It is never read as canonical data or auto-applied. `App.tsx` exposes download and explicit discard only.
- Direct persistence callers: `App.tsx` is the runtime caller of load/save; backup callers retain the default filename while recovery download uses a distinct filename.
- Final PASS: `smoke:p6-persistence-recovery`, `smoke:storage`, Backbone/Evidence/Writer/Review/Repair/Export/Product Acceptance regressions, `npm run build`, and `npm run test:system` (including `smoke:server`).
- Canonical runtime data was not modified. P5 remains DONE.
