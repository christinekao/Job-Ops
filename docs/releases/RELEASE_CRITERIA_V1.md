# Release Criteria v1.0

## 1. Criterion Schema

Every release criterion uses this schema:

| Field | Meaning |
|---|---|
| Criterion ID | Stable release criterion identifier. |
| Name | Short criterion name. |
| Category | One of the approved top-level release criteria categories. |
| Description | What must be true. |
| Rationale | Why it matters. |
| Mandatory or Advisory | Whether this blocks RC/release eligibility. |
| Status | `PASS`, `FAIL`, `PARTIAL`, `NOT STARTED`, `BLOCKED`, or `NOT APPLICABLE`. |
| Evidence Required | Proof required to mark `PASS`. |
| Current Evidence | Evidence currently available. |
| Responsible Owner | Future owner for incomplete work. |
| Blocking Behavior | P0, P1, P2, P3, or non-blocking. |
| Waiver Allowed? | Yes/No. |
| Waiver Authority | Required approver if waiver is allowed. |
| Revalidation Trigger | Event requiring re-check. |

Allowed categories:

- A. Architecture and Governance
- B. Truthfulness and Claim Safety
- C. Reviewer Quality
- D. Repair Safety
- E. Export Safety
- F. Keyword and ATS Quality
- G. Candidate Profile Completeness
- H. Persistence and Compatibility
- I. Product Workflow
- J. Regression and Acceptance
- K. Security and Privacy
- L. Reliability and Observability
- M. Documentation and Operations

## 2. Full Release Criteria Catalog

The complete criteria catalog is represented in the matrix in section 8. That matrix is authoritative for current status, ownership, blocker level, waiver rule, and revalidation trigger.

## 3. Required Evidence

Mandatory criteria require evidence from one or more of:

- approved Architecture Baseline;
- accepted ADR decision;
- closed scope review;
- controlled acceptance run;
- fresh RC acceptance artifacts;
- current implementation inspection;
- regression command result;
- production build result;
- security/privacy review;
- release decision record;
- immutable version identifier.

Design intent alone is not sufficient for `PASS`.

## 4. Blocking Behavior

| Level | Meaning |
|---|---|
| P0 | Release prohibited; waiver not allowed. |
| P1 | Release Candidate blocker unless resolved or explicitly waived where allowed. |
| P2 | Release risk; may remain only with owner, risk statement, and release note disclosure. |
| P3 | Non-blocking improvement. |

## 5. Waiver Rules

Waiver is never allowed for:

- unsupported claims;
- fabricated experience;
- sensitive data leakage;
- corrupted canonical persistence;
- wrong-version export;
- broken protected invariants.

No waiver is granted by this document.

## 6. Ownership

Incomplete criteria must map to exactly one future owner:

- A. ADR-006 Repair Policy
- B. ADR-007 Export Policy
- C. Keyword / ATS Strategy
- D. Profile Completeness
- E. Product Workflow Reliability
- F. Security / Privacy Review
- G. Observability
- H. Documentation / Operations
- I. Governance Decision Required

## 7. Revalidation Triggers

Revalidate affected criteria when any of these occur:

- production code change;
- prompt behavior change;
- model configuration change;
- contract schema change;
- persistence behavior change;
- new acceptance run;
- new security/privacy review;
- new release candidate version;
- protected invariant change;
- newly discovered unsupported claim or wrong-version export.

## 8. Complete Criteria Matrix

| ID | Criterion | Category | Mandatory | Status | Evidence | Owner | Blocker Level |
|---|---|---|---|---|---|---|---|
| RC-A001 | Architecture Baseline v1.0 is approved. | A. Architecture and Governance | Yes | PASS | `ARCHITECTURE_BASELINE_V1.md` final decision approves baseline. | H. Documentation / Operations | Non-blocking |
| RC-A002 | All implemented policy areas have accepted ADRs. | A. Architecture and Governance | Yes | PASS | ADR-004 and ADR-005 accepted and closed. | H. Documentation / Operations | Non-blocking |
| RC-A003 | All implemented ADR waves completed design, simulation, implementation, controlled acceptance, and scope closure. | A. Architecture and Governance | Yes | PASS | ADR-004 and ADR-005 docs include required lifecycle artifacts. | H. Documentation / Operations | Non-blocking |
| RC-A004 | No protected architecture invariant is currently violated. | A. Architecture and Governance | Yes | PASS | Baseline validation answers all `YES`. | H. Documentation / Operations | P0 if violated |
| RC-A005 | No duplicate authority exists for Fit Tier, Positioning, Capability Gap, Reviewer classification, Repair execution, or Export decision. | A. Architecture and Governance | Yes | PASS | Baseline ownership matrix and ADR-005 closure. | H. Documentation / Operations | P0 if violated |
| RC-B001 | Generated CVs must not contain unsupported visible claims. | B. Truthfulness and Claim Safety | Yes | PASS | ADR-004/005 accepted cases show Unsupported Claim count `0`. | H. Documentation / Operations | P0 |
| RC-B002 | Weak Fit generation must not fabricate missing ownership or experience. | B. Truthfulness and Claim Safety | Yes | PASS | Azure Weak Fit acceptance shows no fabricated Azure sales, quota, or deal ownership. | H. Documentation / Operations | P0 |
| RC-B003 | Truthful capability gaps must remain distinguishable from hallucinations. | B. Truthfulness and Claim Safety | Yes | PASS | ADR-005 acceptance separates Capability Gap from Unsupported Claim. | H. Documentation / Operations | P0 |
| RC-B004 | Writer must follow upstream positioning authority. | B. Truthfulness and Claim Safety | Yes | PASS | ADR-004 acceptance confirms Writer follows Analysis positioning in accepted cases. | H. Documentation / Operations | P0 |
| RC-B005 | All user-visible claims must be traceable to accepted evidence or permitted transformation rules. | B. Truthfulness and Claim Safety | Yes | PARTIAL | Evidence-backed accepted cases exist; product-wide claim-trace release audit not complete. | E. Product Workflow Reliability | P1 |
| RC-C001 | Reviewer remains downstream consumer of ADR-004. | C. Reviewer Quality | Yes | PASS | ADR-005 closure and structured result fields. | H. Documentation / Operations | P0 if violated |
| RC-C002 | Reviewer produces structured review results. | C. Reviewer Quality | Yes | PASS | `06-structured-review-result.json` for all ADR-005 acceptance cases. | H. Documentation / Operations | P1 |
| RC-C003 | Unsupported Claims and Capability Gaps are materially separated. | C. Reviewer Quality | Yes | PASS | ADR-005 acceptance matrix. | H. Documentation / Operations | P0 |
| RC-C004 | Severity assignments are consistent with ADR-005. | C. Reviewer Quality | Yes | PASS | ADR-005 implementation and acceptance artifacts show severity model. | H. Documentation / Operations | P1 |
| RC-C005 | Reviewer does not repair, rewrite, or make export decisions. | C. Reviewer Quality | Yes | PASS | ADR-005 closure confirms boundaries. | H. Documentation / Operations | P0 if violated |
| RC-C006 | Reviewer output is understandable without hidden reasoning. | C. Reviewer Quality | Yes | PARTIAL | Structured issues include category, severity, evidence, and intent; UI surfacing remains limited. | G. Observability | P2 |
| RC-D001 | Repair Policy is explicitly governed. | D. Repair Safety | Yes | NOT STARTED | Baseline marks future Repair ADR; no ADR-006 completed. | A. ADR-006 Repair Policy | P1 |
| RC-D002 | Repair consumes structured review issues. | D. Repair Safety | Yes | NOT STARTED | ADR-005 emits contract; Repair does not yet consume as primary policy. | A. ADR-006 Repair Policy | P1 |
| RC-D003 | Repair applies minimal bounded changes. | D. Repair Safety | Yes | PARTIAL | Earlier repair governance exists, but post-ADR-005 structured-contract consumption not validated. | A. ADR-006 Repair Policy | P1 |
| RC-D004 | Repair must not invent evidence. | D. Repair Safety | Yes | PARTIAL | Existing product principle exists; release-level Repair policy evidence incomplete. | A. ADR-006 Repair Policy | P1 |
| RC-D005 | Repair must preserve unaffected CV content. | D. Repair Safety | Yes | PARTIAL | Earlier targeted repair evidence exists; not validated against ADR-005 structured issues. | A. ADR-006 Repair Policy | P1 |
| RC-D006 | Repair output is revalidated before becoming canonical. | D. Repair Safety | Yes | PARTIAL | Existing review freshness behavior exists; release-level structured repair acceptance incomplete. | A. ADR-006 Repair Policy | P1 |
| RC-E001 | Export Policy is explicitly governed. | E. Export Safety | Yes | NOT STARTED | Baseline marks Export Policy as future ADR. | B. ADR-007 Export Policy | P1 |
| RC-E002 | Export retains independent decision authority. | E. Export Safety | Yes | PASS | Baseline and ADR-005 closure confirm Export remains independent. | H. Documentation / Operations | P0 if violated |
| RC-E003 | Export blocking conditions are deterministic. | E. Export Safety | Yes | PARTIAL | Current export logic exists; future Export Policy not governed. | B. ADR-007 Export Policy | P1 |
| RC-E004 | Warnings and blockers are distinguishable. | E. Export Safety | Yes | PARTIAL | ADR-005 emits structured export input; current Export policy not redesigned. | B. ADR-007 Export Policy | P1 |
| RC-E005 | Export does not depend on hidden Reviewer reasoning. | E. Export Safety | Yes | PARTIAL | Structured input exists; future Export consumption not implemented. | B. ADR-007 Export Policy | P1 |
| RC-E006 | Exported CV matches the reviewed canonical version. | E. Export Safety | Yes | PARTIAL | Review freshness exists; no fresh RC export-version acceptance evidence. | B. ADR-007 Export Policy | P1 |
| RC-F001 | Keyword insertion must be evidence-backed. | F. Keyword and ATS Quality | Yes | PASS | ADR-004/005 prohibit unsupported keyword inflation. | H. Documentation / Operations | P0 if violated |
| RC-F002 | Required JD terminology must be externally understandable. | F. Keyword and ATS Quality | Yes | PARTIAL | External wording warnings remain in acceptance cases. | C. Keyword / ATS Strategy | P2 |
| RC-F003 | Internal company terminology must be translated into market-recognizable wording. | F. Keyword and ATS Quality | Yes | PARTIAL | Acceptance found work-log/internal wording warnings. | C. Keyword / ATS Strategy | P2 |
| RC-F004 | Keyword gaps must not be repaired by unsupported claims. | F. Keyword and ATS Quality | Yes | PASS | Truthfulness policy and Reviewer taxonomy separate keyword gaps from unsupported claims. | H. Documentation / Operations | P0 if violated |
| RC-F005 | Good Fit and Risky Fit meet explicitly defined minimum keyword quality threshold. | F. Keyword and ATS Quality | Yes | BLOCKED | No governed numeric or qualitative release threshold exists. | C. Keyword / ATS Strategy | P1 |
| RC-G001 | Trusted contact email is present. | G. Candidate Profile Completeness | Yes | FAIL | ADR-005 acceptance shows missing email/profile completeness blocker in all cases. | D. Profile Completeness | P1 |
| RC-G002 | Required contact information is validated. | G. Candidate Profile Completeness | Yes | PARTIAL | Reviewer detects missing contact fields; validated complete profile evidence missing. | D. Profile Completeness | P1 |
| RC-G003 | Missing optional profile data does not corrupt generation. | G. Candidate Profile Completeness | Yes | PASS | CV generation and review artifacts exist despite missing email. | H. Documentation / Operations | P2 |
| RC-G004 | Required profile blockers are clearly distinguished from optional enhancements. | G. Candidate Profile Completeness | Yes | PARTIAL | Profile Completeness category exists; final product policy/UX not fully governed. | D. Profile Completeness | P1 |
| RC-G005 | Export does not proceed with invalid required contact fields. | G. Candidate Profile Completeness | Yes | PASS | Current acceptance exportReady false where email missing. | H. Documentation / Operations | P0 if violated |
| RC-H001 | Legacy review snapshots remain readable or have approved migration. | H. Persistence and Compatibility | Yes | PASS | ADR-005 closure and artifacts show legacy snapshots generated. | H. Documentation / Operations | P1 |
| RC-H002 | Optional PositioningReport remains backward compatible. | H. Persistence and Compatibility | Yes | PASS | Baseline and `positioningPolicy.ts` fallback behavior. | H. Documentation / Operations | P1 |
| RC-H003 | StructuredReviewResult remains backward compatible. | H. Persistence and Compatibility | Yes | PASS | Additive field; old snapshots remain readable per ADR-005 implementation. | H. Documentation / Operations | P1 |
| RC-H004 | Canonical persistence does not store invalid partial results as accepted outputs. | H. Persistence and Compatibility | Yes | PARTIAL | Existing governance states canonical persistence; release-level invalid-output audit incomplete. | E. Product Workflow Reliability | P1 |
| RC-H005 | Persistence schema changes require explicit migration governance. | H. Persistence and Compatibility | Yes | PASS | Baseline protected invariant and change governance. | H. Documentation / Operations | P0 if violated |
| RC-I001 | A new opportunity can complete intended happy path. | I. Product Workflow | Yes | BLOCKED | No fresh RC-level full happy-path acceptance exists. | E. Product Workflow Reliability | P1 |
| RC-I002 | JD Analysis produces valid structured result. | I. Product Workflow | Yes | PASS | ADR acceptance cases include screening analysis artifacts. | H. Documentation / Operations | P1 |
| RC-I003 | CV Brief produces valid structured output. | I. Product Workflow | Yes | PASS | ADR acceptance cases include CV brief/generation context artifacts. | H. Documentation / Operations | P1 |
| RC-I004 | Writer produces valid CV JSON rather than unstructured prose. | I. Product Workflow | Yes | PASS | ADR acceptance cases include generated CV JSON artifacts. | H. Documentation / Operations | P1 |
| RC-I005 | Reviewer receives the correct generated CV version. | I. Product Workflow | Yes | PASS | Review snapshots include reviewed CV identity/hash. | H. Documentation / Operations | P1 |
| RC-I006 | Repair, when invoked, updates intended version only. | I. Product Workflow | Yes | PARTIAL | Earlier repair behavior exists; no current ADR-005 structured repair acceptance. | A. ADR-006 Repair Policy | P1 |
| RC-I007 | Export uses the reviewed and accepted version. | I. Product Workflow | Yes | PARTIAL | Review freshness exists; final export policy/version acceptance incomplete. | B. ADR-007 Export Policy | P1 |
| RC-I008 | Failure states are visible and actionable. | I. Product Workflow | Yes | PARTIAL | Structured issues improve observability; UI/release-level workflow validation incomplete. | E. Product Workflow Reliability | P2 |
| RC-J001 | Good Fit controlled acceptance passes. | J. Regression and Acceptance | Yes | PASS | ADR-004/005 acceptance includes Good Fit. | H. Documentation / Operations | P1 |
| RC-J002 | Risky Fit controlled acceptance passes. | J. Regression and Acceptance | Yes | PASS | ADR-004/005 acceptance includes Risky Fit. | H. Documentation / Operations | P1 |
| RC-J003 | Weak Fit controlled acceptance passes. | J. Regression and Acceptance | Yes | PASS | ADR-004/005 acceptance includes Azure Weak Fit. | H. Documentation / Operations | P1 |
| RC-J004 | Azure Weak Fit remains permanent truthfulness regression case. | J. Regression and Acceptance | Yes | PASS | Baseline and acceptance identify Azure Weak Fit as permanent evidence. | H. Documentation / Operations | P0 if regresses |
| RC-J005 | Relevant smoke tests pass. | J. Regression and Acceptance | Yes | PASS | ADR-005 acceptance manifest lists relevant smokes PASS. | H. Documentation / Operations | P1 |
| RC-J006 | Production build passes. | J. Regression and Acceptance | Yes | PASS | ADR-005 acceptance manifest lists `npm run build` PASS. | H. Documentation / Operations | P1 |
| RC-J007 | Fresh acceptance artifacts are generated from release candidate version. | J. Regression and Acceptance | Yes | NOT STARTED | No RC version freeze exists. | E. Product Workflow Reliability | P1 |
| RC-J008 | Acceptance artifacts are linked to specific version or immutable run identifier. | J. Regression and Acceptance | Yes | PARTIAL | Run IDs exist; no frozen RC version identifier exists. | G. Observability | P1 |
| RC-K001 | Sensitive candidate data is not exposed in prompts/logs beyond approved boundaries. | K. Security and Privacy | Yes | NOT STARTED | No current security/privacy review evidence. | F. Security / Privacy Review | P1 |
| RC-K002 | Secrets and API credentials are not persisted in artifacts. | K. Security and Privacy | Yes | NOT STARTED | No current artifact secret scan evidence. | F. Security / Privacy Review | P0 |
| RC-K003 | Generated acceptance fixtures do not expose unnecessary personal information. | K. Security and Privacy | Yes | NOT STARTED | No current privacy minimization review evidence. | F. Security / Privacy Review | P1 |
| RC-K004 | Exported documents contain only intended user-facing data. | K. Security and Privacy | Yes | NOT STARTED | No current release export privacy review evidence. | F. Security / Privacy Review | P0 |
| RC-K005 | Error logs do not leak sensitive candidate or employer information. | K. Security and Privacy | Yes | NOT STARTED | No current log privacy review evidence. | F. Security / Privacy Review | P1 |
| RC-L001 | Critical pipeline stages expose success/failure state. | L. Reliability and Observability | Yes | PARTIAL | Existing run/review status exists; full release observability audit incomplete. | G. Observability | P2 |
| RC-L002 | AI request, response, parse, validation, persistence, and UI refresh stages can be distinguished. | L. Reliability and Observability | Yes | PARTIAL | Prior diagnostics exist; release-level evidence incomplete. | G. Observability | P2 |
| RC-L003 | Stale/cached artifacts cannot be mistaken for fresh outputs. | L. Reliability and Observability | Yes | PASS | Acceptance used fresh run IDs; review freshness exists. | H. Documentation / Operations | P1 |
| RC-L004 | Review freshness can be verified. | L. Reliability and Observability | Yes | PASS | `smoke:review-freshness` PASS and snapshot hash fields exist. | H. Documentation / Operations | P1 |
| RC-L005 | Acceptance environment limitations are documented. | L. Reliability and Observability | Yes | PASS | Git metadata limitation documented in acceptance and baseline. | H. Documentation / Operations | P3 |
| RC-L006 | Critical failures can be diagnosed without hidden model reasoning. | L. Reliability and Observability | Yes | PARTIAL | Structured issues and diagnostics exist; full release diagnostic coverage incomplete. | G. Observability | P2 |
| RC-M001 | Architecture baseline is current. | M. Documentation and Operations | Yes | PASS | Architecture Baseline v1.0 active. | H. Documentation / Operations | P1 |
| RC-M002 | Active ADRs and closed ADRs are clearly identified. | M. Documentation and Operations | Yes | PASS | ADR-004/005 closure docs exist; future ADRs not started. | H. Documentation / Operations | P1 |
| RC-M003 | Release criteria status is current. | M. Documentation and Operations | Yes | PASS | This document and readiness report establish status. | H. Documentation / Operations | P1 |
| RC-M004 | Known limitations are documented. | M. Documentation and Operations | Yes | PASS | Baseline and blocker register list limitations. | H. Documentation / Operations | P2 |
| RC-M005 | Release notes can identify included policies, unresolved limitations, migration impact, and compatibility guarantees. | M. Documentation and Operations | Yes | PARTIAL | Inputs exist; release notes not yet created for a frozen RC. | H. Documentation / Operations | P2 |
| RC-M006 | Rollback or release invalidation process is defined before final release. | M. Documentation and Operations | Yes | PASS | Release Governance v1.0 defines invalidation rules. | H. Documentation / Operations | P1 |

## 9. Current Matrix Summary

Current mandatory criteria status:

- PASS: Architecture baseline, ADR-004/005 policy closure, core truthfulness, Reviewer structured output, compatibility, selected acceptance/regression evidence.
- PARTIAL / FAIL / NOT STARTED / BLOCKED: Repair, Export, Keyword threshold, Profile Completeness, product-wide happy path, RC freeze evidence, security/privacy, and full observability.

Current RC status:

`NOT RC ELIGIBLE`
