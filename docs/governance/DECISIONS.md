# Architecture Decisions

## ADR-001 - Canonical CV Reference

Status: Accepted

### Decision

This project intentionally has no canonical CV.

The system must generate the best possible CV for each individual JD rather than reproduce a fixed reference CV.

CV quality sources of truth are:

- `docs/draft/requires-review/QUALITY_SPEC.md`
- `PROJECT_RULES.md`
- draft contracts under `docs/draft/requires-review/contracts/`
- source-grounded evidence

No single CV document is a quality source of truth.

### Consequences

- Historical, generated, and reference CV artifacts may be used as evidence or comparison material, but never as a canonical acceptance oracle.
- TASK-002 may document the artifact matrix and the intentional absence of a canonical CV.
- Future quality and regression work must trace requirements to the quality spec, project rules, contracts, and evidence.

## ADR-002 - Review Snapshot Identity

Status: Accepted

### Decision

Review Snapshot uses dual identity with these fields:

- `snapshotId`
- `updatedAt`
- `contentHash`

`updatedAt` is used for ordering, history, and UI display.

`contentHash` is used for deduplication, change detection, regression comparison, and cache keys.

### Migration

- Legacy snapshots may have `contentHash == null`.
- Generate missing `contentHash` lazily on first read or first write.
- Never invalidate an old snapshot solely because it lacks `contentHash`.

### Consequences

- New snapshots must carry both timestamp and content identity.
- Compatibility logic must preserve legacy snapshots while allowing lazy identity enrichment.
- TASK-009 may implement the dual-identity contract and migration-safe behavior.
- Scope amendment: TASK-009 may modify `CV_Manager_React/src/App.tsx::saveCvVersion()` because it owns review-snapshot invalidation. Existing prohibited boundaries remain unchanged.

## ADR-003 - Prompt Ownership and prompt_templates.json

Status: Accepted

### Decision

`CV_Manager_React/data/prompt_templates.json` is:

- editable UX metadata
- reusable reference/seed content
- user-facing saved template data

It is not the authoritative source for production runtime automation prompts.

Production runtime prompt construction belongs to the active prompt builder implementation in `CV_Manager_React/src/promptBuilders.ts`.

Governance contracts and `QUALITY_SPEC.md` constrain runtime prompts, but do not replace the runtime prompt builder implementation. `PROJECT_RULES.md` remains the source of non-negotiable project rules. `modes/*.md` is documented operating/mode guidance whose runtime authority must be explicitly proven.

### Runtime Effect Rule

Editing `data/prompt_templates.json` must not silently alter production screening-analysis or screening-CV automation prompts unless an explicitly approved implementation Task introduces that behavior.

If implementation later uses `prompt_templates.json` as a runtime prompt source, record a document/implementation conflict and create a separate BLOCKED Task. Do not silently approve that behavior or expand TASK-010.

### Ownership Summary

| Artifact | Ownership |
|---|---|
| `src/promptBuilders.ts` | Active runtime prompt construction |
| `data/prompt_templates.json` | Editable UX metadata and reusable saved templates |
| `modes/*.md` | Documented operating/mode guidance; runtime authority must be explicitly proven |
| Contracts | Required input/output and behavioral boundaries |
| `QUALITY_SPEC.md` | CV quality requirements |
| `PROJECT_RULES.md` | Non-negotiable project rules |

## ADR-004 - Root AGENTS.md Governance Entry

Status: Accepted

### Decision

Root `AGENTS.md` is the single entry point for AI agents. Its responsibilities are limited to:

- reading order
- source of truth
- governance entry
- implementation workflow
- validation and completion rules

Detailed governance remains under `docs/governance/`. Root rules reference those documents instead of duplicating them.

## ADR-005 - Legacy Files Outside Governance

Status: Accepted

### Decision

Legacy files, including `Christine_CV_Manager.html` and `cv_manager_server.py`, are classified as Legacy / Archive / Migration artifacts.

They are not active governance rules or current product workflow entry points. They may be read or changed only when an explicit migration/historical task names them.

## ADR-006 - Effective CV Brief and Evidence Priority

Status: Accepted by explicit Phase 2 Wave 1 authorization

### Decision

All generation consumers use `resolveEffectiveCvBrief` as the single CV Brief resolution rule.

- A persisted Brief is reused only when it is usable and its content identity matches the Brief derived from current Analysis + Selection.
- Missing, incomplete, or stale persisted Briefs resolve to a deterministic current Brief without mutating runtime data.
- `generatedAt` is metadata and is excluded from `cvBriefIdentityHash`.
- Legacy persisted Brief/source hashes remain accepted by stale-state compatibility checks.

Evidence priority is:

1. effective Brief `mustShowEvidenceIds`
2. remaining `JobApplication.selectedEvidenceIds` in stored order

Writer and local repair inputs must preserve this order. Global data-array order is not evidence priority.

### Consequences

- UI readiness, Writer input, input hashing, and GenerationContext resolve the same Brief content.
- New GenerationContext records may include `evidencePriorityIds` and `writerContextHash`.
- No runtime-data migration is required.

## ADR-007 - Structured Contact Ownership

Status: Accepted by explicit Phase 2 Wave 1 authorization

### Decision

`CareerProfile.contact` is the optional structured owner for Writer contact input.

- Fields: name, email, location, with optional phone, LinkedIn, and portfolio.
- Writer receives this object only when present; it must not infer contact from raw source text.
- Existing profiles without `contact` remain valid.
- No hard-coded contact migration or canonical-data rewrite is performed in Wave 1.

### Consequences

- Contact completeness enforcement remains a Wave 2 responsibility.
- Wave 1 establishes ownership and prompt-context transport only.
