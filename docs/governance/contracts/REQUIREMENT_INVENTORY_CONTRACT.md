# Requirement Inventory Contract

Status: ACTIVE CODE-GROUNDED REFERENCE  
Can authorize production implementation: No

## Owner

`CV_Manager_React/src/data/jobs.ts`

## Canonical Flow

Raw source fragments → reconstructed source statements → atomic decomposition
→ semantic deduplication → stable requirement IDs.

## Rules

- Raw fragments never receive requirement IDs.
- Only Responsibilities, Requirements, Preferred Qualifications, Work Site,
  Location, and Travel enter the inventory.
- Risks, Fit Notes, Employer Signal, compensation, application window,
  additional attributes, employer insights, and prior AI output never feed back.
- One row represents one independently classifiable expectation.
- Language/platform alternatives and architecture quality attributes remain
  `expectedAspects`, not separate requirements.
- Each row retains reconstructed parent identity, original indices, original
  fragments, complete source text, and all consolidated source references.
- Required sources take precedence over formal, responsibility, and preferred
  sources when duplicate semantics consolidate.
- Formal constraints never merge with capability expectations.
- IDs use canonical atomic semantics, not array position or punctuation.
- Policy version `p15r2-atomic-formal-semantics-v1` participates in Screening Prompt
  identity; incompatible prior results are stale.

## P15R2 Atomic Semantics

- Security screening, background checks, work authorization, and equivalent
  eligibility statements are `FORMAL_REQUIREMENT` / `FORMAL_CONSTRAINT`, even
  when extracted from the general Requirements field.
- An advanced qualification's alternative-pathway parent is code-owned metadata;
  it is never a matrix row. Degree attainment, degree field, years, and coding
  depth remain independently classifiable rows linked by `pathwayGroupId`.
- A compound responsibility is split only where the independently classifiable
  work expectations have stable deterministic meaning. Attribute lists remain
  `expectedAspects`, not separate rows.
