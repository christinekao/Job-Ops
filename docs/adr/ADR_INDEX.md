# ADR Index

## Status Rules

Only `APPROVED` ADRs may amend the current architecture. `PROPOSED`, `REJECTED`, `SUPERSEDED`, and `DEPRECATED` ADRs cannot authorize production implementation.

| Canonical ID | Source | Status | Authority | Notes |
|---|---|---|---|---|
| ADR-GOV-001 | `governance/DECISIONS.md` §ADR-001 | APPROVED | SECONDARY | Intentional absence of a canonical CV |
| ADR-GOV-002 | `governance/DECISIONS.md` §ADR-002 | APPROVED | SECONDARY | Review snapshot identity |
| ADR-GOV-003 | `governance/DECISIONS.md` §ADR-003 | APPROVED | SECONDARY | Runtime prompt ownership |
| ADR-GOV-004 | `governance/DECISIONS.md` §ADR-004 | APPROVED | SECONDARY | Root AGENTS governance entry |
| ADR-GOV-005 | `governance/DECISIONS.md` §ADR-005 | APPROVED | SECONDARY | Legacy files outside governance |
| ADR-GOV-006 | `governance/DECISIONS.md` §ADR-006 | APPROVED | SECONDARY | Effective CV Brief and evidence priority |
| ADR-GOV-007 | `governance/DECISIONS.md` §ADR-007 | APPROVED | SECONDARY | Structured contact ownership |
| ADR-PROD-004 | `draft/requires-review/adr/ADR-004_POSITIONING_POLICY.md` | PROPOSED | NONE | Detailed policy remains unresolved despite completion artifacts; cannot authorize |
| ADR-PROD-005 | `draft/requires-review/adr/ADR-005_REVIEWER_POLICY.md` | PROPOSED | NONE | Detailed policy remains unresolved despite completion artifacts; cannot authorize |
| ADR-PROD-006 | `adr/ADR-006_REPAIR_POLICY.md` | APPROVED | SECONDARY | Approved policy; scope is limited to its stated repair rules |

## Identifier Correction

The old numeric labels `ADR-004`, `ADR-005`, and `ADR-006` were reused by unrelated governance decisions and production-policy files. The canonical IDs above disambiguate them. The legacy filenames are retained for traceability and do not imply equivalence.

## Required Owner Decisions

`ADR-PROD-004` and `ADR-PROD-005` have `Proposed` source status while related implementation/acceptance records claim completion. Only an owner may approve, reject, or formally supersede them.
