# Screening Prompt Schema and Context Contract

Status: ACTIVE CODE-GROUNDED REFERENCE  
Can authorize production implementation: No

## Owners

- Runtime schema, inferred output type, validator, schema hash, and compact
  serializer: `CV_Manager_React/src/domain/screeningAnalysisSchema.ts`
- Prompt and safe context projection:
  `CV_Manager_React/src/promptBuilders.ts`

## Contract

- The runtime validator is the source of the AI output shape.
- The Prompt contract is generated deterministically from that schema.
- Apply validates structure and requirement/ID semantics before persistence.
- Run identity binds schema version/hash, Prompt version/hash, and input hash.
- Context uses one bounded projection containing usable IDs, evidence safety
  boundaries, education, domain knowledge, STAR evidence, and claim boundaries.
- Requirement-bearing JD text appears once through the canonical atomic
  inventory; derived Risks/Fit Notes do not feed back.
- Safety strings and claim boundaries are complete. Compaction uses field/item
  selection and never hard character slicing or ellipsis.
- Context must not contain credentials, private endpoints, or unnecessary
  internal implementation detail.
- Schema or Prompt identity drift makes prior output stale.

## P15R2 Source URL Projection

- Raw source URL text is removed from normalized JD prompt metadata.
- The safe context contains only a valid plain job-listing URL, or an empty URL
  plus a bounded status such as `INVALID_MARKDOWN_URL`.
- URL status is provenance-only: it cannot create requirements, evidence,
  candidate claims, or Fit inputs.
- `primaryTargetTitle` is a truthful candidate positioning, not a copied JD
  title when the core responsibility matrix is predominantly unsupported.

## P15R Baseline

Microsoft fixture has 77 raw fragments, 20 reconstructed statements, and 28
canonical atomic requirements. Screening context is 55,594 characters and the
total Prompt is 118,286 characters—5.3% above the P15 baseline and still below
its +10% guard, with complete safety semantics.
