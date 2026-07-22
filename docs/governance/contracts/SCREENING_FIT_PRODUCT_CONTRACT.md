# Screening and Fit Product Contract

Status: ACTIVE CODE-GROUNDED REFERENCE  
Can authorize production implementation: No

## Owners

- AI classification and requirement semantics:
  `CV_Manager_React/src/domain/screeningAnalysisSchema.ts`
- Deterministic requirement inventory:
  `CV_Manager_React/src/data/jobs.ts`
- Fit, ranking, recommendation, and Positioning Report:
  `CV_Manager_React/src/domain/positioningPolicy.ts`

## Contract

- `requirementMatrix` is the one canonical AI-classified requirement set.
- Every code-supplied `requirementId` appears exactly once. Unknown, missing, or
  duplicate IDs fail Apply.
- Employment role type, market role family, AI market archetype, and candidate
  positioning are separate concepts.
- AI does not decide Fit, application priority, generation recommendation,
  counts, or persistence metadata.
- P8 production code derives all Fit views from the canonical matrix.
- Legacy analysis remains readable but stale and cannot authorize Writer or
  Export.

## Formal Screening Boundary

- `FORMAL_REQUIREMENT` / `FORMAL_CONSTRAINT` rows must be classified
  `FORMAL_SCREENING_RISK` with `DO_NOT_CLAIM` unless a specifically supported
  lawful/practical hard block exists.
- Formal screening risks do not become `CORE_CAPABILITY_GAP` and do not affect
  capability Fit as though they were missing skills.

## P16 Workflow Continuation and Current-State Boundary

- P8 remains the only owner of Fit, priority, generation recommendation, and
  `manualOverrideAllowed`. `LOW_FIT` plus no hard block is advisory: a user may
  explicitly apply supported recommendations and create a truthful CV Brief.
- `DO_NOT_PRIORITIZE_GENERATION` never independently locks Writer; hard block
  is the only Fit-derived progression prohibition.
- `src/domain/workflowChecklistState.ts` is the presentation-only derived
  checklist selector. It consumes existing analysis, CV Brief, generation, CV,
  and review identity/freshness facts; it stores no second workflow state.
- Checklist Steps 5–7 require current artifact bindings. Historical analysis,
  CVs, and review snapshots may be readable but cannot authorize the current
  CV, Gate Review, Manager/ATS result, Writer, or Export.
- A CV Brief records the Screening Analysis hash explicitly acknowledged when
  recommendations are applied. Analysis/brief/evidence mutation makes later CV
  and review authorization stale through existing generation and review hashes.

## Safety

Education, Domain Knowledge, Evidence, Skill, and STAR IDs must exist in the
current canonical data. Transfer claims require evidence and explicit transfer
context. Core gaps cannot be converted into strengths by keywords.

## P17 Screening-to-Brief Boundary

- `src/data/selection.ts` is the deterministic Brief owner. New Briefs consume
  `requirementMatrix` directly; legacy `jdEvidenceMapping`, `supportLevel`, and
  recommendation lists are historical display compatibility only and cannot
  authorize a Brief or Writer context.
- Only DIRECT, TRANSFERABLE, and PARTIAL rows with permitted `cvUsage` may
  produce visible Brief evidence. Transfer and partial rows retain their source
  context and unsupported aspects. Learnable/core/formal rows remain a boundary,
  never a visible capability claim.
- Brief identity includes the existing content-hash inputs for current JD,
  Screening analysis, requirement inventory, selection, evidence safety, and
  candidate positioning. Any change makes the prior Brief non-current; users
  must explicitly apply recommendations again.
- Writer context receives the canonical matrix and Brief safety boundaries; it
  cannot re-derive Fit or elevate `DO_NOT_CLAIM`, `FORBIDDEN`, Interview Only,
  Prompt Context Only, or Do Not Use evidence into a visible claim.
