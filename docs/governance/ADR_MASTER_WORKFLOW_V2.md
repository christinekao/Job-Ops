# ADR Master Workflow v2

## 1. Document Control

- Document: `docs/governance/ADR_MASTER_WORKFLOW_V2.md`
- Status: Approved for future ADR executions
- Scope: ADR lifecycle governance workflow
- Supersedes: ADR Master Workflow v1 for new ADR executions only
- Does not rewrite: completed ADR artifacts, Architecture Baseline v1.0, Governance Baseline v1.0, release governance, or release criteria

## 2. Purpose

ADR Master Workflow v2 defines the required lifecycle for future ADR work in the CV Builder project.

It adds a mandatory Compliance Verification stage after Controlled Acceptance and before Scope Closure.

Compliance Verification does not replace Policy Design, Policy Simulation, Implementation, Controlled Acceptance, or Scope Closure. It is an additional governance gate that verifies the accepted implementation remains consistent with approved architecture, governance, contracts, scope, and protected invariants.

## 3. Input Contract

Every ADR execution must provide all of the following before work starts:

- `ADR_ID`
- `ADR_TITLE`
- `ADR_SCOPE`

Placeholder values are invalid. If any required value is missing or unresolved, Preflight must stop with:

`PREFLIGHT BLOCKED`

## 4. Mandatory Preflight

Preflight is mandatory but is not counted as one of the six ADR stages.

Before Stage 1, the agent must read and treat these documents as authoritative:

- `SPEC.md`
- `FLOW.md`
- `ARCHITECTURE.md`
- `docs/architecture/ARCHITECTURE_BASELINE_V1.md`
- `docs/governance/GOVERNANCE_BASELINE_V1.md`
- `docs/releases/RELEASE_GOVERNANCE_V1.md`
- `docs/releases/RELEASE_CRITERIA_V1.md`
- `docs/releases/CURRENT_RELEASE_READINESS.md`
- `docs/releases/CURRENT_BLOCKER_REGISTER.md`
- any completed ADRs required by the target ADR

Preflight must verify:

- required input values are concrete
- target ADR scope is bounded
- governing documents exist
- completed prerequisite ADRs are available
- forbidden files and protected baselines are identified
- release readiness is not inferred from ADR completion

Preflight output must be exactly one:

- `PREFLIGHT PASS`
- `PREFLIGHT BLOCKED`

If Preflight is blocked, stop.

## 5. Stage 1 — Policy Design

Create or update only the ADR policy document required by the target ADR.

Validate:

- architecture consistency
- governance consistency
- authority ownership
- contract boundaries
- protected invariants
- dependency rules
- compatibility
- release impact
- upstream ADR consistency
- out-of-scope exclusions

Stage 1 gate output must be exactly one:

- `APPROVE POLICY DESIGN`
- `REVISE POLICY DESIGN`

If policy design is not approved, stop.

## 6. Stage 2 — Policy Simulation

Run representative policy simulations before implementation.

Simulation must cover:

- expected success cases
- edge cases
- failure cases
- authority boundaries
- contract behavior
- compatibility
- truthfulness
- release-impact assumptions

Stage 2 gate output must be exactly one:

- `PROCEED TO IMPLEMENTATION`
- `REVISE POLICY`

If simulation does not proceed to implementation, stop.

## 7. Stage 3 — Implementation

Implement only the approved ADR scope.

Forbidden:

- unrelated refactoring
- architecture redesign
- hidden behavior changes
- production changes outside the approved scope
- modifying protected baselines unless explicitly required by the approved ADR

Implementation must run the validation required by the ADR and relevant project contracts, including build, lint, tests, or documented equivalents when a script does not exist.

Stage 3 gate output must be exactly one:

- `IMPLEMENTATION COMPLETE`
- `IMPLEMENTATION BLOCKED`

If implementation is blocked, stop and do not continue to acceptance.

## 8. Stage 4 — Controlled Acceptance

Controlled Acceptance validates product behavior using fresh runtime artifacts.

It must not rely on cached evidence unless the ADR explicitly authorizes fixture reuse and explains why reuse is valid.

Acceptance must validate:

- runtime behavior
- generated outputs
- regression impact
- contract behavior
- truthfulness
- user-facing outcome
- known edge cases

Stage 4 gate output must be exactly one:

- `ACCEPT <ADR_ID>`
- `REJECT <ADR_ID>`
- `ACCEPTANCE BLOCKED`

If acceptance is rejected or blocked, stop.

## 9. Stage 5 — Compliance Verification

Compliance Verification is mandatory after Controlled Acceptance and before Scope Closure.

It verifies that the accepted ADR remains compliant with governing sources. It does not rerun acceptance unless evidence is insufficient.

Compliance dimensions:

1. Architecture Baseline compliance
2. Governance Baseline compliance
3. Governing ADR compliance
4. Upstream ADR invariant compliance
5. Authority ownership compliance
6. Contract compliance
7. Dependency-direction compliance
8. Protected-invariant compliance
9. Truthfulness compliance
10. Scope-control compliance
11. Implementation-to-policy traceability
12. Test and validation compliance
13. Controlled Acceptance evidence compliance
14. Backward-compatibility compliance
15. Persistence compliance
16. Security/privacy boundary compliance
17. Observability compliance
18. Release Governance impact
19. Remaining blocker ownership
20. Documentation consistency

Each compliance dimension must use exactly one status:

- `PASS`
- `PASS WITH OBSERVATIONS`
- `FAIL`
- `NOT APPLICABLE`
- `NOT VERIFIED`

Compliance findings must include:

- finding id
- dimension
- status
- requirement
- governing source
- evidence
- affected files or artifacts
- impact
- blocker level: `P0`, `P1`, `P2`, `P3`, or `NONE`
- owner
- required action
- scope relationship: `INSIDE ADR SCOPE`, `OUTSIDE ADR SCOPE`, `RELEASE-LEVEL`, or `GOVERNANCE-LEVEL`

Stage 5 gate output must be exactly one:

- `COMPLIANCE VERIFIED`
- `COMPLIANCE VERIFIED WITH OBSERVATIONS`
- `COMPLIANCE FAILED`

If compliance fails, stop and do not proceed to Scope Closure.

## 10. Stage 6 — Scope Closure

Scope Closure determines whether the ADR completed its approved scope.

It must separate:

- in-scope completed work
- out-of-scope work not attempted
- remaining release blockers
- future ADR candidates
- known observations that do not invalidate closure

Scope Closure must not declare release readiness. Release readiness remains governed by release governance and release criteria.

Stage 6 gate output must be exactly one:

- `CLOSE <ADR_ID>`
- `KEEP <ADR_ID> OPEN`

## 11. Stop Rules

Immediately stop when:

- Preflight is blocked
- Policy Design is not approved
- Policy Simulation requires revision
- Implementation is blocked
- build or required validation fails
- Controlled Acceptance is rejected or blocked
- Compliance Verification fails
- Scope Closure keeps the ADR open

Never continue into the next stage after a failed gate.

## 12. Resume and Recovery Rules

If an ADR is interrupted:

- resume from the last completed gate
- re-read governing documents if they may have changed
- do not repeat completed stages unless evidence is stale or insufficient
- do not promote stale acceptance evidence to compliance
- record any changed assumptions before continuing

If evidence is insufficient at Compliance Verification:

- mark affected dimensions `NOT VERIFIED`
- identify the missing evidence
- do not close the ADR until sufficient evidence exists or the gap is explicitly accepted as an observation by governance

## 13. Change Control

Modify only files inside the approved ADR scope.

Do not modify these unless explicitly required by the approved ADR:

- Architecture Baseline
- Governance Baseline
- Release Governance
- Release Criteria
- closed ADRs
- completed acceptance artifacts
- production runtime
- prompts
- persistence

## 14. Final Report Contract

The final report for an ADR run must summarize:

- stages executed
- gates passed
- files created
- files modified
- tests executed
- acceptance result
- compliance result
- scope closure result
- remaining blockers
- release readiness impact
- recommended next ADR

## 15. Validation

Q1. Does v2 preserve Governance Baseline v1.0?

YES. It adds an ADR execution gate without changing the approved baseline.

Q2. Does v2 preserve Architecture Baseline v1.0?

YES. It explicitly prevents architecture redesign unless separately approved.

Q3. Does v2 add Compliance Verification after Controlled Acceptance and before Scope Closure?

YES.

Q4. Does v2 prevent Compliance Verification from replacing Controlled Acceptance?

YES. Acceptance remains a separate required stage.

Q5. Does v2 prevent Scope Closure after compliance failure?

YES. A failed compliance gate is a hard stop.

Q6. Does v2 define resumable execution?

YES. Resume and recovery rules require continuation from the last completed gate.

Q7. Does v2 preserve hard-stop gates?

YES.

Q8. Does v2 prevent ADR workflow from declaring release readiness?

YES. Release readiness remains under release governance and release criteria.

Q9. Does v2 avoid starting ADR-007?

YES. This workflow document does not authorize or begin any future ADR.

Q10. Does v2 avoid production changes?

YES. This is a governance workflow document only.

## 16. Reference Index

- `SPEC.md`
- `FLOW.md`
- `ARCHITECTURE.md`
- `docs/architecture/ARCHITECTURE_BASELINE_V1.md`
- `docs/governance/GOVERNANCE_BASELINE_V1.md`
- `docs/releases/RELEASE_GOVERNANCE_V1.md`
- `docs/releases/RELEASE_CRITERIA_V1.md`
- `docs/releases/CURRENT_RELEASE_READINESS.md`
- `docs/releases/CURRENT_BLOCKER_REGISTER.md`

## 17. Workflow Decision

`APPROVE ADR MASTER WORKFLOW V2`
