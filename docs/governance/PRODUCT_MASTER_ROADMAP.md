# Product Master Roadmap

Status: Product Foundation baseline. Planning only; this document authorizes no implementation.

## Vision

Evolve the active React CV Manager from a JD-specific, evidence-backed CV workflow into an AI Career Operating System: a trusted workspace that helps a person discover opportunities, understand role requirements, choose truthful evidence, generate and validate application materials, prepare for interviews, and learn from outcomes.

The product is not a generic CV generator. Its durable advantage is the combination of per-JD decision context, source-grounded evidence, bounded AI action, explainable review, and human approval for meaning-changing decisions.

## Current Product Stage

| Stage | Status | Evidence |
|---|---|---|
| Phase 1 — Governance | Complete | Governance v1, decisions, contracts, archived tasks |
| Phase 2 — Pipeline Integrity | Complete | Effective Brief, evidence/output/contact/reviewer safeguards, Golden Evaluation framework |
| Phase 3 — Architecture Cleanup | Complete through Wave 3 | Authoritative export decision, presentation extraction, final reviewer action pipeline |
| Phase 4 onward | Planned | This Product Foundation |

## Roadmap Shape

```text
Foundation complete
  → Phase 4 Product Experience
  → Phase 5 CV Intelligence
  → Phase 6 Autonomous AI
  → Phase 7 Platform
  → Phase 8 Career Agent
```

Each phase must preserve the existing evidence-first, explicit-AI, one-JD decision-context, content-hash identity, and canonical-persistence rules. A later phase is not automatically executable when an earlier phase closes.

## Milestones and Exit Criteria

| Milestone | Outcome | Exit criteria |
|---|---|---|
| M1 Product Experience | A user can understand current state and one next action without operating internal workflow machinery | Linear workflow, one primary CTA, explicit blockers, completed states remain complete, click/re-run baseline measured |
| M2 CV Intelligence | Generated CV quality is measurable and improves against representative JD fixtures | Golden Evaluation baseline, quality delta rules, evidence/claim integrity preserved, reviewer and export readiness measurable |
| M3 Autonomous AI | AI safely completes mechanical repair/validation while people approve meaning | Repair budget, rollback, approval payload, no hidden AI execution, convergence telemetry |
| M4 Platform | Reliable multi-workspace product foundation | Authentication/authorization decision, workspace/data model decision, observability, backup/recovery, migration plan |
| M5 Career Agent | Cross-application career assistance with durable user control | Explicit agent scope, consent, source traceability, learning loop, outcome review, safety evaluation |

## Timeline Assumptions

- Planning uses waves, not calendar commitments. A wave closes only after its acceptance criteria and regression requirements pass.
- Phase 4 should establish measurable UX baselines before automation work claims click or token reduction.
- Phase 5 needs representative, versioned evaluation fixtures before any quality optimization claim.
- Phase 6 depends on Phase 4 state clarity and Phase 5 measurement; autonomous actions are unsafe without both.
- Phase 7 requires an explicit product/privacy/persistence decision; local canonical data is not silently converted into a hosted platform.
- Phase 8 is contingent on validated user value from earlier phases, not merely technical availability.

## Dependency Rules

1. No feature may bypass EvidenceCard validation, visible-bullet traceability, unsupported-claim blocking, contact checks, or export decision ownership.
2. No AI automation may become hidden or unbounded. Token-spending starts remain explicit.
3. No phase may redefine persistence, prompt ownership, or snapshot identity without a dedicated ADR and migration/rollback plan.
4. Product metrics must distinguish measured values, targets, and design estimates.
5. Every future implementation wave requires a scoped task, Allowed/Forbidden Files, tests, and stop conditions.

## Product Risks

| Risk | Mitigation direction |
|---|---|
| Users remain exposed to workflow internals | Phase 4 state/CTA simplification and usability measurement |
| Better automation creates unsupported claims | Phase 5 evidence/quality gates before Phase 6 autonomy |
| Repeated AI runs waste tokens | Hash reuse, repair budget, status recovery, telemetry |
| Product expansion weakens trust | Approval boundaries, source traceability, no hidden execution |
| Platform work destabilizes local product | Separate platform ADRs, migration plan, rollback, compatibility fixtures |

## Completion Rule

This roadmap is complete as a planning baseline when all linked product foundation documents exist. It does not create a READY task or authorize Phase 4 implementation.
