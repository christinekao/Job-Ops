# Product Phases

Status: Planning taxonomy. A phase is not implementation authorization.

## Phase 1 — Governance

| Item | Definition |
|---|---|
| Mission | Establish source-of-truth order, contracts, decisions, task governance, and quality boundaries. |
| Deliverables | Governance v1, contracts, ADRs, task roadmap, quality specification. |
| Success criteria | Atomic work can be scoped, validated, and stopped safely. |
| Completion criteria | Complete and archived. |
| Risks | Governance drift or documents claiming unsupported implementation. |
| Dependencies | None. |

## Phase 2 — Pipeline Integrity

| Item | Definition |
|---|---|
| Mission | Make CV inputs, outputs, review, and export boundaries evidence-safe and testable. |
| Deliverables | Effective Brief, evidence priority, output validation, traceability, duplicate/contact/review safeguards, Golden Evaluation framework. |
| Success criteria | Invalid claims/IDs/duplicates/contact gaps cannot silently pass normal apply/export paths. |
| Completion criteria | Complete through implemented Wave 1/2 safeguards. |
| Risks | Quality fixture coverage may not represent all live JDs. |
| Dependencies | Phase 1 governance and contracts. |

## Phase 3 — Architecture Cleanup

| Item | Definition |
|---|---|
| Mission | Separate workflow, export, presentation, and action lifecycle ownership without changing product rules. |
| Deliverables | Design documents, export decision boundary, presentation panels, final reviewer action pipeline. |
| Success criteria | One export decision, one CTA owner, explicit action receipts, fewer duplicated UI rules. |
| Completion criteria | Complete through Wave 3; further extraction requires a separate decision/task. |
| Risks | `ScreeningLab.tsx` remains a large coordinator. |
| Dependencies | Phase 2 safeguards. |

## Phase 4 — Product Experience

| Item | Definition |
|---|---|
| Mission | Turn validated workflow mechanics into a legible, convergent human experience. |
| Deliverables | User journey baseline, state adapter, CTA system, recovery UX, advanced fallback policy, telemetry schema. |
| Success criteria | Users identify state, passed work, blocker, AI scope, and next action without interpreting internals. |
| Completion criteria | Clicks/review iterations measured; completed states persist; linear happy path validated with representative users/JDs. |
| Expected risks | Hiding important safeguards, adding UI-only policy, measuring vanity metrics. |
| Dependencies | Phase 3 action/state boundaries; current contracts remain intact. |

## Phase 5 — CV Intelligence

| Item | Definition |
|---|---|
| Mission | Improve reliable CV quality selection, generation, evaluation, and diagnosis. |
| Deliverables | Representative evaluation corpus, calibrated scorecards, quality diagnostics, change comparisons, feedback loop design. |
| Success criteria | Quality changes are measured against the same JD/evidence conditions with no critical integrity regression. |
| Completion criteria | Golden Evaluation is repeatable, baseline-backed, and used for accepted quality changes. |
| Expected risks | Optimizing scores instead of credibility; leaking unsupported claims through proxy metrics. |
| Dependencies | Phase 4 telemetry/baselines; Phase 2 integrity safeguards. |

## Phase 6 — Autonomous AI

| Item | Definition |
|---|---|
| Mission | Let AI safely orchestrate and repair mechanical workflow work while people approve meaning. |
| Deliverables | Bounded orchestrator, repair budget, approval payload/diff, rollback, stop/recovery, autonomy telemetry. |
| Success criteria | Safe classes converge without loops; semantic changes are approved; token use and failures are explicit. |
| Completion criteria | End-to-end autonomous run meets safety, quality, and convergence targets on representative fixtures. |
| Expected risks | Hidden AI execution, repeated token spend, ambiguous approval, unsafe evidence changes. |
| Dependencies | Phase 4 state clarity and Phase 5 quality measurement. |

## Phase 7 — Platform

| Item | Definition |
|---|---|
| Mission | Establish a reliable, secure, observable product platform beyond the local workspace. |
| Deliverables | Platform ADRs, identity/workspace model, data portability, observability, backup/recovery, deployment and migration plan. |
| Success criteria | Multi-workspace operation is safe, recoverable, and does not weaken canonical data guarantees. |
| Completion criteria | Platform decisions, migration tests, privacy controls, and operational runbooks accepted. |
| Expected risks | Premature infrastructure, data loss, privacy exposure, costly migration. |
| Dependencies | Proven product value and explicit platform architecture decisions. |

## Phase 8 — Career Agent

| Item | Definition |
|---|---|
| Mission | Extend the trusted evidence-and-workflow foundation across the career lifecycle. |
| Deliverables | Job discovery, application tracking, interview preparation, learning loop, career analytics, agent permissions/consent model. |
| Success criteria | Recommendations remain traceable, user-controlled, and measurably useful across application outcomes. |
| Completion criteria | Consent, safety, evaluation, and value milestones are met for every agent capability. |
| Expected risks | Overreach, stale recommendations, privacy loss, opaque agent action. |
| Dependencies | Phases 4–7, especially platform/privacy and autonomous-action controls. |
