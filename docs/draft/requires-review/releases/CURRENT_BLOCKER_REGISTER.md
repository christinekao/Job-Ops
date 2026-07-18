Status: DRAFT
Authority: REFERENCE
Can Authorize Production Implementation: NO
Does Not Override: docs/architecture/CURRENT_ARCHITECTURE.md
Reason for Draft Status: Current release ownership and freshness are not evidenced by an approved governance decision.
Required Decision Before Activation: Owner approval of release governance ownership.

# Current Blocker Register

## 1. Blocker Summary

Current RC status:

`NOT RC ELIGIBLE`

There are no currently proven P0 release-prohibited defects in the accepted ADR-004 / ADR-005 evidence. The project does have multiple P1 Release Candidate blockers and P2 risks.

Architecture Baseline v1.0 remains valid.

ADR-004 and ADR-005 remain closed.

## 2. P0 Blockers

Current P0 blockers:

None proven by current evidence.

P0 conditions remain non-waivable. If any of the following are discovered, release is prohibited:

- unsupported visible claims;
- fabricated experience;
- sensitive data leakage;
- corrupted canonical persistence;
- wrong-version export;
- protected invariant violation.

## 3. P1 Blockers

### BLK-P1-001 — Product-wide claim traceability incomplete

Related criterion: `RC-B005`

Description:

Accepted cases show unsupported claims `0`, but a release-level claim traceability audit across the intended RC scope has not been completed.

Evidence:

- ADR-004/005 acceptance proves Good, Risky, and Azure Weak Fit cases.
- No frozen RC release-wide claim traceability evidence exists.

Product impact:

The product cannot claim release-grade truthfulness coverage beyond accepted cases.

Scope owner:

`E. Product Workflow Reliability`

Required resolution:

Run release-scope claim traceability validation against frozen RC artifacts.

Required acceptance evidence:

Fresh RC acceptance report showing no unsupported visible claims across required fixtures.

Architecture / ADR impact:

Architecture and closed ADRs remain valid.

### BLK-P1-002 — Repair Policy incomplete

Related criteria: `RC-D001` through `RC-D006`, `RC-I006`

Description:

Reviewer emits structured repair contract input, but Repair Policy has not yet been governed to consume structured review issues as the primary policy path.

Evidence:

- Architecture Baseline marks Repair Policy as future ADR.
- ADR-005 implementation states structured issues are not yet consumed by Repair.

Product impact:

Release cannot claim governed repair safety across structured Reviewer outputs.

Scope owner:

`A. ADR-006 Repair Policy`

Required resolution:

Complete Repair Policy governance and acceptance, or explicitly remove Repair execution from the RC scope.

Required acceptance evidence:

ADR-006 design, simulation, implementation, controlled acceptance, and scope closure, or approved scope reduction.

Architecture / ADR impact:

Architecture and ADR-004/005 remain valid.

### BLK-P1-003 — Export Policy incomplete

Related criteria: `RC-E001`, `RC-E003`, `RC-E004`, `RC-E005`, `RC-E006`, `RC-I007`

Description:

Reviewer emits structured export input, but Export Policy has not yet been governed to consume it or define final release-grade export behavior.

Evidence:

- Architecture Baseline marks Export Policy as future ADR.
- ADR-005 implementation states Export logic remains unchanged.

Product impact:

Release cannot claim export safety or final export approval semantics.

Scope owner:

`B. ADR-007 Export Policy`

Required resolution:

Complete Export Policy governance and acceptance, or explicitly remove export approval from the RC scope.

Required acceptance evidence:

ADR-007 design, simulation, implementation, controlled acceptance, and scope closure, or approved scope reduction.

Architecture / ADR impact:

Architecture and ADR-004/005 remain valid.

### BLK-P1-004 — Keyword quality threshold undefined

Related criterion: `RC-F005`

Description:

Good Fit and Risky Fit release keyword quality threshold has not been defined.

Evidence:

- ADR-005 acceptance shows Risky Fit has an evidence-supported Keyword Coverage issue.
- No governed numeric or qualitative release threshold exists.

Product impact:

Release cannot claim ATS/keyword readiness for Good/Risky cases.

Scope owner:

`C. Keyword / ATS Strategy`

Required resolution:

Define release keyword/ATS threshold and validate Good/Risky fixtures.

Required acceptance evidence:

Keyword/ATS strategy document or ADR plus fresh acceptance evidence.

Architecture / ADR impact:

Architecture and closed ADRs remain valid.

### BLK-P1-005 — Required profile/contact completeness unresolved

Related criteria: `RC-G001`, `RC-G002`, `RC-G004`

Description:

Trusted contact email and required profile field completion are not currently proven.

Evidence:

- ADR-005 acceptance found `Profile Completeness` / `High` in all three cases.
- Export readiness was false in accepted cases.

Product impact:

Generated CVs may remain export-blocked even when truthful.

Scope owner:

`D. Profile Completeness`

Required resolution:

Define required profile fields, collect trusted data, and validate complete profile behavior.

Required acceptance evidence:

Fresh acceptance evidence showing required contact fields present and validated.

Architecture / ADR impact:

Architecture and closed ADRs remain valid.

### BLK-P1-006 — Product-wide happy path not proven

Related criterion: `RC-I001`

Description:

Controlled ADR acceptance proves policy behavior, not a full release happy path from new opportunity to final release-eligible state.

Evidence:

- Accepted cases exist for ADR-004/005.
- No frozen-version RC happy-path acceptance exists.

Product impact:

Cannot create RC without proving the intended release workflow.

Scope owner:

`E. Product Workflow Reliability`

Required resolution:

Run product-wide happy-path acceptance after required policy blockers are resolved.

Required acceptance evidence:

Fresh RC eligibility report covering JD intake, analysis, CV Brief, Writer, Reviewer, Repair if in scope, Export if in scope, and failure handling.

Architecture / ADR impact:

Architecture and closed ADRs remain valid.

### BLK-P1-007 — Fresh RC-specific artifacts missing

Related criteria: `RC-J007`, `RC-J008`

Description:

Fresh acceptance artifacts exist for ADR-005, but not for a frozen RC version.

Evidence:

- ADR-005 run ID exists.
- No release candidate version identifier exists.

Product impact:

Cannot prove a specific immutable RC is ready.

Scope owner:

`E. Product Workflow Reliability`

Required resolution:

Freeze version, generate fresh RC acceptance artifacts, and link artifacts to immutable version/run metadata.

Required acceptance evidence:

RC run manifest with version identifier and environment metadata.

Architecture / ADR impact:

Architecture and closed ADRs remain valid.

### BLK-P1-008 — Security/privacy review not started

Related criteria: `RC-K001` through `RC-K005`

Description:

No current release security/privacy review evidence exists.

Evidence:

- No security/privacy review report found in required current release evidence.

Product impact:

Release cannot prove candidate data, secrets, artifacts, logs, and exports are safe.

Scope owner:

`F. Security / Privacy Review`

Required resolution:

Run security/privacy review for prompts, logs, artifacts, secrets, exported documents, and error handling.

Required acceptance evidence:

Security/privacy review report with findings, remediation, and pass/fail status.

Architecture / ADR impact:

Architecture and closed ADRs remain valid.

## 4. P2 Risks

### RISK-P2-001 — Reviewer output not fully surfaced in product UX

Related criterion: `RC-C006`

Scope owner:

`G. Observability`

Required resolution:

Surface structured issue categories and user-facing explanations where release scope requires them.

### RISK-P2-002 — External wording quality remains imperfect

Related criteria: `RC-F002`, `RC-F003`, `RC-I008`

Scope owner:

`C. Keyword / ATS Strategy`

Required resolution:

Validate external wording quality and define acceptable release threshold.

### RISK-P2-003 — Observability coverage incomplete

Related criteria: `RC-L001`, `RC-L002`, `RC-L006`

Scope owner:

`G. Observability`

Required resolution:

Document stage-level diagnostics and ensure critical failures can be diagnosed without hidden model reasoning.

### RISK-P2-004 — Release notes not yet created

Related criterion: `RC-M005`

Scope owner:

`H. Documentation / Operations`

Required resolution:

Create release notes after RC freeze.

## 5. P3 Improvements

### IMP-P3-001 — Acceptance environment git metadata unavailable

Related criterion: `RC-L005`

Scope owner:

`G. Observability`

Required resolution:

Improve environment metadata capture for future acceptance runs.

Architecture / ADR impact:

No architecture defect.

## 6. Ownership Transfer

| Owner | Assigned blockers / risks |
|---|---|
| A. ADR-006 Repair Policy | BLK-P1-002, related repair workflow criteria |
| B. ADR-007 Export Policy | BLK-P1-003, export/version criteria |
| C. Keyword / ATS Strategy | BLK-P1-004, RISK-P2-002 |
| D. Profile Completeness | BLK-P1-005 |
| E. Product Workflow Reliability | BLK-P1-001, BLK-P1-006, BLK-P1-007 |
| F. Security / Privacy Review | BLK-P1-008 |
| G. Observability | RISK-P2-001, RISK-P2-003, IMP-P3-001 |
| H. Documentation / Operations | RISK-P2-004 |
| I. Governance Decision Required | Human release authority assignment |

## 7. Closure Evidence Required

To close this blocker register for RC eligibility:

- All P1 blockers must become `PASS` or receive approved waiver where allowed.
- P0 must remain absent.
- Security/privacy review must complete.
- Frozen RC version and fresh RC artifacts must exist.
- Release criteria matrix must be updated.
- Human release decision authority must be assigned or explicitly governed.

## 8. Architecture and ADR Impact Statement

Current blockers do not invalidate:

- Architecture Baseline v1.0;
- ADR-004 Positioning Policy closure;
- ADR-005 Reviewer Policy closure.

The blockers are downstream release-readiness gaps. They should not reopen ADR-004 or ADR-005 unless future evidence proves a genuine defect inside those accepted scopes.
