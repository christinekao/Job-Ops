# P15-SCREENING-SEMANTICS-001 — Canonical Screening Semantics and Context Remediation

Status: DONE

## Model Routing

- Selected AI: Codex
- Model: GPT-5.6 Terra
- Reasoning: High
- Reason: Canonical AI semantics, requirement identity/coverage, JD
  normalization, context safety, Fit derivation, legacy compatibility, and
  Golden downstream safety cross multiple production owners.
- Escalation trigger: Stop only if repository evidence requires a new ADR,
  approval of a Proposed ADR, or exposes a genuine authority conflict.

## Objective

Preserve the P14 schema-driven pipeline while making `requirementMatrix` the
single AI-classified requirement source, separating JD classification from
candidate positioning, supporting Education/Domain mapping, repairing JD
fragmentation, deriving Fit/views through existing P8 owners, and reducing the
safe Prompt context by at least 25%.

## Dependencies

- `docs/INDEX.md`
- `docs/architecture/CURRENT_ARCHITECTURE.md`
- Approved ADRs and active product rules
- P8 Golden evaluation and Fit owner
- `docs/governance/tasks/P14-SCREENING-SCHEMA-CONTRACT-001.md`
- Existing JD import, normalization, Screening, persistence, Writer, and
  staleness owners

## Allowed Files

- Existing Screening schema, Prompt policy/context projection, semantic
  validator, requirement normalization/inventory, JD extraction/normalization,
  P8 Fit/Positioning derived views, legacy adapter, and Screening UI owners
- Focused fixtures, smoke/E2E tests, package scripts, and P15 governance records

## Forbidden

- Second Screening, Fit, Requirement, Prompt, or notification system
- Hand-written Prompt schema, weakened strict validation, AI-derived Fit/counts/
  Positioning Report/persistence metadata, or hidden AI
- Architecture redesign, Proposed ADR approval, canonical runtime-data rewrite,
  Git commit, or push

## Acceptance Criteria

- [x] Fail-first covers role family, Education mapping, requirement duplication,
  fragmentation, opportunity gaps, Prompt/schema mismatch, unknown-value
  conflict, context size/duplication, and source URL integrity.
- [x] P14 schema-driven Prompt/type/validator/hash/staleness pipeline remains
  intact.
- [x] Production code builds a deterministic, stable-ID normalized requirement
  inventory before AI execution.
- [x] `requirementMatrix` covers every supplied ID exactly once; missing,
  duplicate, unknown, or repeated classifications fail Apply.
- [x] JD employment role type, market role family, AI archetype, and candidate
  positioning are separate.
- [x] Education and Domain Knowledge IDs are available and strictly validated.
- [x] Fragment normalization preserves true bullet boundaries and repairs known
  Microsoft/language/cloud/continuation fragmentation.
- [x] Duplicate AI requirement lists and legacy Fit/support fields are absent
  from the new AI schema and Prompt.
- [x] P8 remains the only deterministic Fit/ranking/recommendation owner;
  Positioning Report and counts remain derived.
- [x] Strong/Medium/Low opportunity analysis is matrix-consistent; LOW_FIT
  includes overlaps, adjacent roles, transition path, and preparation.
- [x] One deterministic safe Screening context projection retains all usable IDs
  and safety boundaries while excluding unnecessary internal details.
- [x] Microsoft fixture Prompt size decreases at least 25% without truncating JD,
  requirements, IDs, or safety constraints.
- [x] Source URL remains a plain submitted job URL and redirect target remains
  provenance-only.
- [x] Legacy results are read-only stale and cannot authorize Writer/Export.
- [x] Golden tiers/ranking remain unchanged and all focused/system/server/E2E/
  governance validation passes.
- [x] Documentation closes P15 as DONE and READY count returns to zero.

## Completion Evidence

- Microsoft fixture: 41 stable requirements, exact-once semantic coverage.
- Estimated Prompt size: 215,938 → 112,318 characters (48.0% reduction).
- Build, focused regressions, P8 Golden, system suite, approved localhost server
  rerun, Product Acceptance 13/13, JD Import E2E 1/1, and no-AI E2E 1/1 passed.
- Canonical runtime data was not rewritten. No hidden AI action ran.

## Rollback

Revert the P15 schema semantics, requirement inventory/projection, normalization,
derived-view, and compatibility wiring. P14 identity ensures incompatible
results remain stale; no destructive data migration is required.
