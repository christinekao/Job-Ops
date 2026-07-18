# Phase 2 Improvement Backlog

Status: Recommendations only. No item is authorized for implementation by this document.

## Priority 1 — Immediate Stabilization

Minimum changes intended to stop additional quality drift.

| ID | Recommendation | Evidence / Root Cause | Validation Target | Risk |
|---|---|---|---|---|
| IS-01 | Define one effective CV Brief resolution rule used by UI readiness, prompt builder, input hash, and generation context | RC-01 | Same Brief hash/object observed at every consumer | Medium |
| IS-02 | Preserve selected evidence/story order when building Writer and repair inputs | RC-02 | First N objects match selected ID priority exactly | Low |
| IS-03 | Block local repair from running without explicit failed fields/zones | RC-09 | Unaffected summary/sections/bullets remain byte-equivalent | Medium |
| IS-04 | Prevent generic local repair from using hard-coded Power Platform section titles | RC-10 | Non-Power JD fixture retains its role-specific section strategy | Low |
| IS-05 | Deduplicate summary components and repair notes | Current Power CV | Repeated repair produces no duplicate summary phrase or note | Low |
| IS-06 | Separate visible unsupported-claim failures from honest JD gaps | RC-07 | A CV that omits unsupported gaps can pass integrity while application-fit risk remains visible | Medium |
| IS-07 | Reject non-EvidenceCard IDs in bullet evidence traceability and report empty required traces | RC-05 | AI CV-style mixed namespaces fail with exact bullet locations | Medium |

## Priority 2 — Quality Improvement

Targeted improvements to make output closer to `QUALITY_SPEC.md`.

| ID | Recommendation | Evidence / Root Cause | Validation Target | Risk |
|---|---|---|---|---|
| QI-01 | Add requirement-coverage allocation to evidence selection: manager problem, technical depth, business impact, career arc | RC-03 | Selection report proves coverage, not just counts | Medium |
| QI-02 | Create a concise Writer evidence projection containing only CV-safe wording, proof boundary, metric, experience, and priority | RC-04 | Prompt context shrinks while required quality checks still pass | Medium |
| QI-03 | Add structured contact to the Writer input contract from a user-approved profile field | RC-06 | Header contact is source-grounded and no hard-coded fallback is needed | Medium |
| QI-04 | Extend Writer output validation to required contact, role coverage, evidence namespace, trace ratio, duplicate text, and claim boundary | RC-05 | Invalid persisted examples fail for the correct reasons | Medium |
| QI-05 | Replace action-verb-only scoring with evidence-backed business-impact checks | RC-08 | `Supported ...` without outcome no longer satisfies impact by itself | Medium |
| QI-06 | Evaluate manager relevance against mapped requirement/evidence/claim triples rather than loose word overlap | RC-08 | Superficial keyword insertion does not improve manager score | High |
| QI-07 | Add a transition trace report showing selected -> must-show -> prompt -> visible bullet -> review -> repair provenance | Current trace limitations | Every visible bullet can identify its upstream source and mutation stage | Medium |

## Priority 3 — Structural Improvement

Long-term improvements that preserve the existing architecture direction.

| ID | Recommendation | Evidence / Root Cause | Validation Target | Risk |
|---|---|---|---|---|
| SI-01 | Version the effective Brief and Writer input snapshot as a reproducible immutable generation artifact | RC-01/04 | Any CV can reconstruct the exact generation plan/input identity | High |
| SI-02 | Define typed ID namespaces for EvidenceCard, Skill, Story, and Domain references | RC-05 | Type/runtime validation prevents cross-namespace IDs | Medium |
| SI-03 | Define a field-level Repair Patch contract with operation, target path, before hash, after value, evidence IDs, and affected checks | RC-09 | Repair can be audited and re-evaluated only for affected checks | High |
| SI-04 | Split application-fit risk, CV-integrity review, manager relevance, and export readiness into independently passable results | RC-07/08/11 | Honest gap does not block CV integrity; each dimension has distinct owner | High |
| SI-05 | Add rendered PDF/browser verification to Export Epic | RC-11 | Actual page count, text layer, visual clipping, and section order are verified | High |
| SI-06 | Establish role-family calibration fixtures without introducing a canonical CV | QUALITY_SPEC open decisions / ADR-001 | Same evidence can be evaluated consistently for Power Platform, AI Ops, and adjacent targets | Medium |

## Recommended Ordering

```text
IS-01 -> IS-02 -> IS-07 -> IS-06
                 |
                 -> IS-03 -> IS-04 -> IS-05

QI-01 -> QI-02 -> QI-04 -> QI-05/QI-06
QI-03 -----------^

SI-01 and SI-02 before SI-03
SI-04 before SI-05/SI-06 calibration rollout
```

## Explicitly Out of Scope

- Replacing React/Vite/Node architecture
- Rewriting all prompts before contract fixes
- Selecting a canonical CV
- Autonomous repair loops
- Runtime data migration without a dedicated approved Task
- Broad UI redesign
