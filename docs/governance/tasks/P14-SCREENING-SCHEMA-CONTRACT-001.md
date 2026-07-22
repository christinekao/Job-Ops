# P14-SCREENING-SCHEMA-CONTRACT-001 — Canonical Schema-Driven Prompt Contract

Status: DONE

## Model Routing

- Selected AI: Codex
- Model: GPT-5.6 Terra
- Reasoning: High
- Reason: Screening schema ownership, Prompt identity, validation, staleness,
  legacy compatibility, and stored execution metadata cross multiple safety and
  persistence boundaries.
- Escalation trigger: Stop if completion requires a production architecture
  redesign, approval of a Proposed ADR, or migration that cannot preserve
  existing canonical data and recovery semantics.

## Objective

Establish one runtime Screening AI-output schema owner that deterministically
generates the Prompt contract, TypeScript output type, Apply validation,
schema/prompt identity, and staleness evidence without putting derived,
persistence, UI, or legacy-only fields into the AI contract.

## Dependencies

- `docs/INDEX.md`
- `docs/architecture/CURRENT_ARCHITECTURE.md`
- `docs/adr/ADR_INDEX.md`
- `docs/governance/PROJECT_RULES.md`
- `docs/governance/CONTRACT_INDEX.md`
- `docs/governance/tasks/P13-JD-ACTION-FEEDBACK-001.md`
- Existing Screening, persistence/recovery, Golden, Writer, and no-AI owners

## Allowed Files

- Existing Screening types, Prompt builder, validation, identity/staleness,
  compatibility, Apply/Preview, and persistence-metadata owners
- Focused schema/Prompt/staleness fixtures and regression scripts
- Package scripts required for the drift guard and system regression
- P14 and directly related governance completion/index records

## Forbidden

- Production architecture redesign or Proposed ADR approval
- New AI action, automatic Parse/Apply/Save/Screening, or hidden token spending
- Canonical runtime-data rewrite, revision/recovery redesign, or unrelated UI
- AI ownership of Positioning Report, derived counts, persistence metadata,
  UI state, or compatibility-only legacy fields
- Git commit or push

## Acceptance Criteria

- [x] Fail-first proves the current hand-written Prompt schema can drift from
  runtime validation and staleness identity.
- [x] One runtime schema owns AI fields, required/optional status, enums,
  nested/array structure, descriptions, and field-level safety constraints.
- [x] `ScreeningAnalysisAIOutput` is inferred/generated from that schema.
- [x] Prompt JSON contract is deterministically serialized from the same schema
  and contains no copied field/enum/required list.
- [x] Apply uses the same strict schema, reports safe path-aware errors, and
  rejects missing, unknown, invalid-type, and invalid-enum fields.
- [x] Schema version/hash and Prompt version/hash are stored with input identity;
  schema or policy changes stale old results while UI-only changes do not.
- [x] Legacy results remain readable through an explicit adapter, are stale
  under a different schema identity, and cannot authorize current Writer use.
- [x] Derived fields, Positioning Report, counts, persistence/UI metadata, and
  legacy aliases do not enter the AI output schema or new Prompt.
- [x] Copy Prompt and Apply validator use the same execution-time contract;
  version and short schema hash are visible without requiring user action.
- [x] Automated schema drift guard is included in `test:system`.
- [x] Focused Screening, persistence/recovery, staleness, Golden,
  Writer/Reviewer/Repair/Export, build, system/server, no-AI, and Product
  Acceptance regressions pass.
- [x] Documentation closes P14 as DONE and READY count returns to zero.

## Completion Evidence

- Root cause: `buildScreeningAnalysisPrompt()` contained a hand-maintained JSON
  example while Apply used generic parsing and the stored run identity tracked
  only input content.
- `screeningAnalysisAIOutputSchema` now owns structure, required fields, enums,
  descriptions, strict unknown-field rejection, TypeScript inference, Prompt
  serialization, validation, and schema hash.
- Apply performs JSON parsing, strict path-aware validation, semantic Evidence
  ID/cross-field validation, Preview, explicit Apply, and existing explicit
  Save. Legacy `applyTier`/`supportLevel` are deterministic stored adapters, not
  new AI fields.
- Run records store schema version/hash, human-readable Prompt version, exact
  execution Prompt hash, and input hash. Missing or mismatched identity makes a
  result stale and blocks automated/manual Writer execution.
- Positioning Report and displayed counts remain deterministic derived views.
  They are absent from the Screening AI schema and cannot be pasted back.
- Drift guard, build, system constituents, persistence/server, P7 staleness,
  P8 Golden, Writer/Reviewer/Repair/Export, no-AI E2E 1/1, and Product
  Acceptance E2E 13/13 passed.
- No canonical runtime data, persistence revision/recovery semantics, hidden AI
  action, production architecture, or Proposed ADR status changed.

## Rollback

Revert the schema-owner integration and restore the prior Screening Prompt,
parser, and run metadata code. Existing stored results remain readable; no
canonical data migration or destructive rewrite is required.
