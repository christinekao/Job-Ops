# Conflict Resolution Log

Production behavior changed: NO.

| Conflict ID | Files | Conflict | Authority decision | Resolution | Resulting paths | Owner approval |
|---|---|---|---|---|---|---|
| DOC-C-001 | `architecture/ARCHITECTURE_BASELINE_V1.md`; `CV_Manager_React/docs/ARCHITECTURE.md` | Two documents presented current architecture; baseline excludes later repair behavior | New `ARCH-CURRENT` is primary, grounded in the active product docs and accepted decisions | RESOLVED_BY_SUPERSESSION | Baseline → `draft/superseded-candidates/` | No |
| DOC-C-002 | `architecture/CV_RUNTIME_BLUEPRINT.md`; architecture maps/models | Future/clean-slate models were presented beside current runtime descriptions | Current Architecture excludes unapproved future design | MOVED_TO_DRAFT | future and analysis folders | No |
| DOC-C-003 | `architecture/RUNTIME_EXECUTION_FLOW.md`; `CV_Manager_React/docs/FLOW.md` | Competing flow representations and step granularity | Active product flow informs ARCH-CURRENT; old flow is reference only | RESOLVED_BY_SUPERSESSION | execution flow → draft candidate | No |
| DOC-C-004 | decision-model documents; baseline | Future owners (Strategist/Evaluator/Claim Ledger) conflict with current owner boundaries | Current owners are those stated in ARCH-CURRENT | MOVED_TO_DRAFT | analysis/future folders | No |
| DOC-C-005 | comparison report; reviewer policy material | Product Quality Evaluator overlaps Reviewer as a proposed future role | No current approved evaluator authority exists | MOVED_TO_DRAFT | comparison → draft analysis | No |
| DOC-C-006 | `adr/ADR-004_*`; `adr/ADR-005_*`; acceptance/implementation records | Proposed ADR source status conflicts with records describing completed work | Proposed source status remains controlling until owner decision | REQUIRES_OWNER_DECISION | ADRs remain non-authoritative; evidence remains reference-only | Yes |
| DOC-C-007 | `governance/DECISIONS.md`; `adr/ADR-004..006` | Reused ADR numbers identify different decisions | Canonical prefixed IDs in ADR Index disambiguate without rewriting history | RESOLVED_BY_PRECEDENCE | `adr/ADR_INDEX.md` | No |
| DOC-C-008 | `governance/CONTRACT_INDEX.md`; `governance/contracts/*` | Contract index labels contracts draft while task references can make them appear mandatory | Draft contract status controls; no contract independently authorizes implementation | MOVED_TO_DRAFT | contracts → `draft/requires-review/contracts/` | Yes |
| DOC-C-009 | `governance/PROJECT_RULES.md`; older source-priority language | Older order omitted the required Index/Current Architecture authority chain | User-approved precedence in INDEX controls | RESOLVED_BY_PRECEDENCE | updated Project Rules | No |
| DOC-C-010 | `releases/*`; current architecture and ADR references | Release documents self-declared active while relying on superseded/unapproved authority | No approved active release-governance authority was evidenced | REQUIRES_OWNER_DECISION | releases → `draft/requires-review/releases/` | Yes |

## Evidence Used

The active React product documentation, explicit status labels, accepted decisions in `governance/DECISIONS.md`, task/completion records, and acceptance artifacts were used. No ADR was approved by inference from code or filename.
