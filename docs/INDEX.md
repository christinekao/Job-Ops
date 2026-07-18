# Required Documentation Entry Point

Codex must read this file before any architecture review, implementation task, bug fix, refactor, contract change, Writer change, Reviewer change, Repair change, Export change, or product-quality change.

Do not independently select requirements from files under `docs/draft/` or `docs/archive/`.

When documents conflict, follow the authority and conflict-resolution rules in this index.

## Official Reading Order

1. `docs/INDEX.md`
2. `docs/architecture/CURRENT_ARCHITECTURE.md`
3. Relevant Approved ADRs
4. Relevant Active Runtime Contracts
5. Relevant Active Product Policies
6. Relevant Acceptance Criteria
7. Current Production Code

## Documentation Precedence

1. `CURRENT_ARCHITECTURE.md`
2. Active architecture amendments
3. Approved ADRs
4. Active runtime contracts and schemas
5. Active product policies
6. Acceptance evidence
7. Current production implementation
8. Active implementation plans
9. Draft documents
10. Archived historical documents

Higher authority overrides lower authority. A Proposed ADR, draft, future architecture, implementation plan, or acceptance evidence cannot redefine production architecture. Code/document mismatches must be reported; Codex must not combine conflicting versions.

## Current Production Architecture

[`CURRENT_ARCHITECTURE.md`](architecture/CURRENT_ARCHITECTURE.md) is the only production architecture authority. The canonical flow is JD and evidence → analysis/brief → explicit generation → current CV → local review → bounded repair or export.

## Change Routing

| Change type | Mandatory documents |
|---|---|
| Architecture change | Index, Current Architecture, approved ADRs, relevant contracts |
| Bug fix | Index, Current Architecture, relevant contracts, acceptance tests |
| Writer change | Index, Current Architecture, Writer policy, evidence/review contracts |
| Reviewer change | Index, Current Architecture, Reviewer ADR, review contract |
| Repair change | Index, Current Architecture, Repair ADR, review/repair contracts |
| Export change | Index, Current Architecture, export contract, review/repair outputs |
| Product quality change | Index, active product policies, scorecard, golden dataset |
| Refactor | Index, Current Architecture, approved ADRs, contracts, acceptance tests |
| Future architecture exploration | Index, Current Architecture, draft future documents; no implementation |

## Active Authoritative Documents

| Document | Role | Implementation authority |
|---|---|---|
| `architecture/CURRENT_ARCHITECTURE.md` | Primary production architecture | Yes, within its stated scope |
| `governance/DECISIONS.md` | Accepted architecture decisions | Yes, only for explicitly Accepted decisions |
| `adr/ADR-006_REPAIR_POLICY.md` | Approved repair-policy amendment (`ADR-PROD-006`) | Yes, only within its stated policy scope |
| `governance/PROJECT_RULES.md` | Active product policy | Yes, only where consistent with higher authority |

`governance/AI_MODEL_ROUTING_GUIDE.md` is active operational routing guidance, not a production-architecture authority. `governance/CONTRACT_INDEX.md` indexes reference contracts; it does not make draft contracts active.

## Draft and Historical Documents

- `draft/future/`: future architecture and design concepts; never implementation authority.
- `draft/analysis/`: discovery, comparison, and audit material; never implementation authority.
- `draft/implementation-plans/`: unapproved plans; never implementation authority.
- `draft/product-concepts/`: non-runtime product concepts; never implementation authority.
- `draft/superseded-candidates/`: replaced candidates retained for traceability.
- `draft/requires-review/`: unresolved authority, status, ownership, or supersession.
- `archive/`: completed historical records only; never implementation authority.

## Forbidden Implementation Sources

Codex must not independently implement from drafts, archives, Proposed ADRs, discovery/comparison reports, brainstorming notes, current-state audits, task notes, future architecture, or unapproved implementation plans.

## Supporting Governance Records

- [Document registry](DOCUMENT_REGISTRY.yaml)
- [Document relationships](DOCUMENT_RELATIONSHIPS.md)
- [Conflict resolution log](CONFLICT_RESOLUTION_LOG.md)
- [ADR index](adr/ADR_INDEX.md)
