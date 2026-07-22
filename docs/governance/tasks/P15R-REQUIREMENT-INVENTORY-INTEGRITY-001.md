# P15R-REQUIREMENT-INVENTORY-INTEGRITY-001 — Requirement Inventory Integrity Remediation

Status: DONE

## Model Routing

- Selected AI: Codex
- Model: GPT-5.6 Terra
- Reasoning: High
- Reason: JD boundary reconstruction, atomic requirement identity, semantic
  deduplication, source lineage, Prompt safety, staleness, and P8 Golden safety
  cross multiple existing owners.
- Escalation trigger: Stop only if repository evidence requires a new ADR or
  exposes an irreconcilable authority conflict between formal owners.

## Objective

Preserve P14 schema ownership, P15 `requirementMatrix`, and P8 Fit ownership
while ensuring only reconstructed, atomic, deduplicated, source-backed
requirements receive stable IDs and enter the safe Screening Prompt.

## Dependencies

- `docs/INDEX.md`
- `docs/architecture/CURRENT_ARCHITECTURE.md`
- Relevant Approved ADRs and active product rules
- P8 Golden policy and deterministic Fit owner
- P9–P12 JD Import/raw-sanitization evidence and policies
- P14 schema-driven Screening contract
- P15 Screening semantics task and completion evidence

## Allowed Files

- Existing JD adapters, canonical JD normalization/inventory/identity owner,
  Screening schema/validator, safe context projection, Prompt identity,
  source-URL validation, P8 derived-view integration, and directly related UI
- Focused/system/E2E fixtures and package scripts
- P15R task, current state, roadmap, completion/checklist, contracts, Registry,
  and relationship records

## Forbidden

- P14/P15 redesign, second parser/inventory/Screening/Fit engine, RAG, hidden AI
- Fit-weight or company/fixture special-casing
- Silent legacy URL/data migration, canonical runtime-data rewrite
- Architecture redesign, Proposed ADR approval, Git commit, or push

## Acceptance Criteria

- [x] Fail-first proves fragment rows, duplicate semantics, mixed-status
  compounds, derived-field feedback, invalid URL, and hard truncation.
- [x] Source boundaries are preserved or deterministically reconstructed with
  trace and false-merge protection.
- [x] Raw fragments never receive requirement IDs.
- [x] Compound expectations decompose atomically without splitting language or
  cloud alternatives.
- [x] Canonical rows retain complete parent/source lineage.
- [x] Semantic duplicates consolidate deterministically without merging
  capability/formal or shallow/deep expectations.
- [x] Only approved source-backed fields enter inventory; derived fields do not
  feed back.
- [x] IDs are deterministic, punctuation/order stable, and semantics-sensitive.
- [x] Exact-once validation targets canonical atomic requirements.
- [x] Source URL accepts only plain job-listing HTTP(S) URLs; legacy invalid
  values warn without silent mutation.
- [x] Safe context contains complete sentences and safety rules without hard
  character truncation.
- [x] Policy/schema/Prompt identity changes stale old Screening output and block
  Writer/Export without automatic AI.
- [x] Microsoft remains naturally LOW_FIT and Golden ranking remains unchanged.
- [x] Focused/system/server/E2E/governance validation passes.
- [x] Governance closes P15R as DONE and effective READY count returns to zero.

## Completion Evidence

- Fail-first failed because no source reconstruction owner existed.
- Microsoft: 77 raw fragments → 20 reconstructed statements → 28 atomic
  requirements; 0 fragment rows, duplicate IDs, unknown/missing IDs, or orphan
  rows; source-lineage coverage 100%.
- Categories: 7 core responsibilities, 6 required capabilities, 12 preferred
  capabilities, 3 formal requirements, 0 supplemental signals.
- Screening context: 55,594 characters. Total Prompt: 118,286 characters
  (about 59,143 tokens by the existing conservative estimate), 5.3% over the
  P15 baseline and within the +10% integrity guard.
- Build, focused P7–P15/Golden/Writer/Reviewer/Repair/Export tests, system
  constituents, approved server rerun, Product Acceptance 13/13, JD Import 1/1,
  and no-AI 1/1 passed.
- No canonical runtime-data rewrite, hidden AI, RAG, architecture redesign,
  Proposed ADR approval, Git commit, or push occurred.

## Rollback

Revert the bounded normalization, inventory/schema projection, URL/context/UI,
tests, and P15R documentation. Identity changes ensure incompatible outputs
remain stale; no destructive data migration is required.
