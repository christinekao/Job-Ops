# DOC-GOV-001 — Unified Documentation Governance

Status: DONE

## Objective

Establish one evidence-grounded documentation governance system for `docs/` without changing production code, runtime behavior, or production architecture.

## Scope

1. Complete the inventory of every file under `docs/`.
2. Assign one document type, lifecycle, authority level, and implementation-authorization decision to each document.
3. Detect and resolve documentation conflicts only where repository evidence supports a resolution.
4. Select and document one canonical production architecture.
5. Create `docs/INDEX.md`, `docs/DOCUMENT_REGISTRY.yaml`, `docs/DOCUMENT_RELATIONSHIPS.md`, `docs/CONFLICT_RESOLUTION_LOG.md`, and `docs/adr/ADR_INDEX.md`.
6. Create the required `docs/draft/` structure; move non-authoritative material there with required non-authoritative headers.
7. Move a document to `docs/archive/` only when it is conclusively historical, superseded, has a known replacement, and has no current task dependency.
8. Update valid internal references and validate registry coverage, IDs, links, lifecycle, authority, and production-code scope.

## Evidence Rules

- `AI_MODEL_ROUTING_GUIDE.md` remains the existing routing guidance; `WAVE_MASTER_PLAN.md` remains a planning map. Do not create a duplicate routing source of truth.
- Do not infer Approved ADR status, architecture authority, or supersession from filenames or implementation alone.
- When evidence is insufficient, preserve the production baseline and move the lower-authority document to `docs/draft/requires-review/`.
- Draft and archived documents must never authorize production implementation.

## Files Allowed to Change

- `docs/**`
- `AGENTS.md` only if a necessary index pointer is required after the documentation index is complete.
- `KNOWLEDGE.md` and `PROGRESS.md` only for the completed governance-record summary.

## Files Prohibited from Changing

- `CV_Manager_React/src/**`
- `CV_Manager_React/serverConfig.cjs`
- `CV_Manager_React/data/**`
- `CV_Manager_React/scripts/**`
- Any production runtime, test, prompt, or canonical data file.

## Acceptance Criteria

- [x] Exactly one `CURRENT_ARCHITECTURE` document has `Authority: PRIMARY`.
- [x] Every file under `docs/` has exactly one registry entry with a unique canonical ID.
- [x] Every detected conflict has an allowed final status and a log entry.
- [x] All unresolved authority/status/supersession conflicts are in `docs/draft/requires-review/`.
- [x] Active documents list their implementation authority precisely; draft/archive documents state `NO`.
- [x] `docs/INDEX.md` gives the mandatory production-change reading order and forbidden sources.
- [x] `docs/adr/ADR_INDEX.md` gives unique ADR IDs and evidence-grounded statuses.
- [x] Internal links to moved documents are valid.
- [x] No prohibited file changed.

## Required Validation

- Documentation inventory/registry coverage check.
- Unique canonical-ID and single-primary-architecture check.
- Draft/archive authorization check.
- Markdown link/path sanity check.
- Changed-file scope check.

## Definition of Done

Codex can open `docs/INDEX.md` and determine the production architecture, required governing documents, document authority, conflicts and outcomes, and which files may not independently authorize implementation.

## Completion Report

Status: DONE

- Canonical architecture: `docs/architecture/CURRENT_ARCHITECTURE.md` (`ARCH-CURRENT`).
- Registry coverage: 281 of 281 files after excluding `.DS_Store`.
- Validation: YAML parsed; one Primary architecture; zero duplicate IDs; zero draft-header/authorization failures; zero broken Markdown links.
- Scope confirmation: production code, runtime behavior, prompts, tests, and canonical runtime data were not modified.
