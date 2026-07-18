# Governance Baseline v1.0

## 1. Document Control

Baseline Name: Governance Baseline v1.0  
Baseline Status: ACTIVE  
Baseline Scope: Project governance after approval of Architecture Baseline v1.0, closure of ADR-004 and ADR-005, and approval of Release Governance v1.0.  
Baseline Purpose: Provide the governing constitution for future architecture, policy, implementation, acceptance, scope-closure, and release work.  
Date: 2026-07-17  
AI: Codex  
Model: GPT-5.6 Sol  
Reasoning: High  
Change type: Documentation and governance only.

This baseline consolidates the approved governance system. It does not replace the authoritative documents it references and does not authorize ADR-006 implementation.

## 2. Executive Summary

Governance Baseline v1.0 is the governing constitution for future CV Builder work.

It preserves:

- Architecture Baseline v1.0 as authoritative for architecture, authority ownership, dependency direction, contracts, and protected invariants.
- ADR-004 as the closed Truthful Positioning Policy.
- ADR-005 as the closed Reviewer Policy.
- Release Governance v1.0 as authoritative for RC eligibility and release approval.
- Current RC status as `NOT RC ELIGIBLE`.

It defines:

- governance hierarchy;
- non-negotiable governance rules;
- lifecycle stages for architecture and policy changes;
- change classes;
- ADR status model;
- implementation wave rules;
- simulation, acceptance, and scope-closure rules;
- freeze and amendment rules;
- decision authority boundaries;
- evidence hierarchy;
- future ADR entry gates.

Final governance decision:

`APPROVE GOVERNANCE BASELINE V1.0`

ADR-006 readiness result:

`ADR-006 GOVERNANCE READY`

This readiness result authorizes only future ADR-006 policy design entry after this baseline approval. It does not authorize implementation.

## 3. Baseline Identity and Status

Baseline Name:

`Governance Baseline v1.0`

Baseline Status:

`ACTIVE`

Baseline Scope:

Project governance after approval of Architecture Baseline v1.0, closure of ADR-004 and ADR-005, and approval of Release Governance v1.0.

Baseline Purpose:

Provide the governing constitution for future architecture, policy, implementation, acceptance, scope-closure, and release work.

Current state:

- Architecture Baseline: `APPROVED / ACTIVE`
- Governance Baseline: `ACTIVE`
- ADR-004: `CLOSED`
- ADR-005: `CLOSED`
- ADR-006: `NOT STARTED`
- Release Governance: `APPROVED / ACTIVE`
- Current RC eligibility: `NOT RC ELIGIBLE`

## 4. Governance Purpose and Scope

### Purpose

Governance Baseline v1.0 defines how the project controls change.

It answers:

- Which document layer is authoritative?
- Which changes require an ADR?
- Which changes require Architecture Baseline amendment?
- Which changes require fresh controlled acceptance?
- Which evidence is sufficient for implementation, acceptance, scope closure, and release readiness?
- How future ADRs enter the process?

### Scope

Included:

- Architecture governance interaction.
- ADR governance.
- Implementation wave governance.
- Policy simulation governance.
- Controlled acceptance governance.
- Scope closure governance.
- Release governance interaction.
- Freeze and amendment model.
- Evidence hierarchy.

Excluded:

- Production code changes.
- Product policy redesign.
- Architecture redesign.
- ADR-006 design or implementation.
- Repair implementation.
- Export implementation.
- Release build creation.

## 5. Governance Hierarchy

| Level | Layer | Documents / artifacts | Authority |
|---|---|---|---|
| 1 | Product and Project Intent | `CV_Manager_React/docs/SPEC.md`, product objectives, truthfulness principle | Defines user value and product promise. |
| 2 | Architecture Governance | `docs/architecture/ARCHITECTURE_BASELINE_V1.md` | Defines architecture, authority ownership, dependency direction, contracts, protected invariants. |
| 3 | Policy Governance | ADRs such as ADR-004 and ADR-005 | Defines policy goals, non-goals, ownership, and implementation boundaries. |
| 4 | Delivery Governance | implementation reports, validation, controlled acceptance, scope closure | Proves a scoped wave was implemented and accepted. |
| 5 | Release Governance | `docs/releases/RELEASE_GOVERNANCE_V1.md`, criteria, readiness, blocker register | Determines RC eligibility, RC freeze, and final release approval. |

Conflict precedence:

1. Approved Architecture Baseline v1.0.
2. Accepted ADR decisions.
3. Approved Release Governance v1.0.
4. Closed scope review conclusions.
5. Controlled acceptance evidence.
6. Current production behavior.
7. Older general project documentation.

Older documents may describe useful intent, but they do not override approved baselines, accepted ADRs, or release governance.

## 6. Governance Constitution

### GOV-001 — Single authority rule

Rule: No component may introduce a second authority for a concern already assigned to a single authoritative owner.  
Rationale: Prevents contradictory decisions.  
Governing source: Architecture Baseline v1.0.  
Affected layers: Architecture, ADR, implementation, release.  
Enforcement mechanism: Architecture review and ADR impact section.  
Violation consequence: Change blocked; if implemented, rollback or baseline amendment required.  
Amendment path: Architecture Baseline amendment.

### GOV-002 — Protected invariant rule

Rule: No ADR may violate a protected architecture invariant without first proposing and approving an Architecture Baseline amendment.  
Rationale: Prevents silent architecture drift.  
Governing source: Architecture Baseline v1.0.  
Affected layers: Architecture, ADR.  
Enforcement mechanism: ADR protected-invariant section.  
Violation consequence: ADR remains blocked.  
Amendment path: Architecture Baseline amendment.

### GOV-003 — Decision before implementation rule

Rule: No implementation may begin before its policy or architecture decision is approved when the change affects authority, contracts, dependency direction, persistence meaning, Repair policy, Export policy, or release behavior.  
Rationale: Prevents implementation from becoming policy by accident.  
Governing source: ADR lifecycle and Release Governance v1.0.  
Affected layers: ADR, implementation, release.  
Enforcement mechanism: Implementation wave gate.  
Violation consequence: Implementation invalid until governance decision exists.  
Amendment path: Governance Baseline amendment only for process changes.

### GOV-004 — Design/implementation separation rule

Rule: Policy design and implementation must remain separate tasks.  
Rationale: Keeps decisions reviewable before code changes.  
Governing source: ADR-004/005 process and Release Governance.  
Affected layers: ADR, implementation.  
Enforcement mechanism: ADR status model.  
Violation consequence: Wave blocked or split.  
Amendment path: Governance Baseline amendment.

### GOV-005 — Simulation-before-implementation rule

Rule: Policy simulation must occur before production implementation unless an explicitly approved exception exists.  
Rationale: Tests policy coherence without runtime risk.  
Governing source: ADR-004/005 lifecycle.  
Affected layers: ADR, validation.  
Enforcement mechanism: Required simulation artifact.  
Violation consequence: Implementation cannot start.  
Amendment path: Explicit exception in ADR approval.

### GOV-006 — Fresh acceptance artifact rule

Rule: Implementation acceptance must use fresh post-change artifacts.  
Rationale: Historical artifacts cannot prove current behavior.  
Governing source: Controlled acceptance governance.  
Affected layers: Acceptance, release.  
Enforcement mechanism: Run manifest and artifact index.  
Violation consequence: Acceptance blocked.  
Amendment path: Governance Baseline amendment.

### GOV-007 — Smoke/build insufficiency rule

Rule: Smoke tests and build success are necessary but insufficient for product acceptance.  
Rationale: Technical success does not prove product behavior.  
Governing source: ADR acceptance precedent and Release Governance.  
Affected layers: validation, acceptance, release.  
Enforcement mechanism: Acceptance report must include product artifacts.  
Violation consequence: Scope cannot close on smokes alone.  
Amendment path: Governance Baseline amendment.

### GOV-008 — Scope closure boundary rule

Rule: Scope closure evaluates the approved scope of a wave, not overall product readiness.  
Rationale: A wave may complete while release blockers remain.  
Governing source: ADR-004/005 scope closure.  
Affected layers: delivery, release.  
Enforcement mechanism: Closure review ownership transfer.  
Violation consequence: Closure report must be revised.  
Amendment path: Governance Baseline amendment.

### GOV-009 — Release readiness separation rule

Rule: Release readiness remains separate from ADR closure and architecture approval.  
Rationale: Architecture correctness does not imply RC eligibility.  
Governing source: Release Governance v1.0.  
Affected layers: release.  
Enforcement mechanism: Release criteria matrix.  
Violation consequence: Release decision invalid.  
Amendment path: Release Governance amendment.

### GOV-010 — Closed ADR non-reopening rule

Rule: A failed release criterion must not reopen a closed ADR unless evidence identifies a defect inside that ADR's accepted scope.  
Rationale: Prevents downstream gaps from destabilizing closed governance.  
Governing source: Release Governance v1.0 and ADR closures.  
Affected layers: ADR, release.  
Enforcement mechanism: Blocker owner assignment.  
Violation consequence: Reclassification required.  
Amendment path: Scope closure amendment only with evidence.

### GOV-011 — Structured Repair contract rule

Rule: Future Repair must consume structured Reviewer contracts and must not depend on hidden Reviewer reasoning.  
Rationale: Keeps Repair auditable and decoupled.  
Governing source: Architecture Baseline v1.0 and ADR-005.  
Affected layers: Repair, Reviewer, ADR-006.  
Enforcement mechanism: ADR-006 entry gate and acceptance.  
Violation consequence: ADR-006 blocked.  
Amendment path: Architecture Baseline amendment if changing the contract direction.

### GOV-012 — Export independent authority rule

Rule: Future Export must retain independent decision authority.  
Rationale: Reviewer input must not become hidden export decision logic.  
Governing source: Architecture Baseline v1.0 and ADR-005.  
Affected layers: Export, Reviewer, release.  
Enforcement mechanism: Export Policy ADR and release criteria.  
Violation consequence: Export change blocked.  
Amendment path: Architecture Baseline amendment.

### GOV-013 — Current-vs-future documentation rule

Rule: Documentation must not describe proposed future behavior as current production behavior.  
Rationale: Prevents false readiness claims.  
Governing source: Architecture Baseline and Release Governance.  
Affected layers: documentation, ADR, release.  
Enforcement mechanism: documentation consistency review.  
Violation consequence: document must be corrected or marked stale.  
Amendment path: documentation clarification if non-normative; baseline amendment if normative.

### GOV-014 — Mandatory release owner rule

Rule: Every non-PASS mandatory release criterion must have an explicit owner and evidence requirement.  
Rationale: Prevents unowned blockers.  
Governing source: Release Criteria v1.0.  
Affected layers: release.  
Enforcement mechanism: blocker register.  
Violation consequence: release readiness review blocked.  
Amendment path: Release Governance amendment.

### GOV-015 — Non-waivable safety rule

Rule: Unsupported claims, fabricated experience, protected invariant violations, sensitive-data exposure, corrupted canonical persistence, and wrong-version export cannot be waived.  
Rationale: These failures invalidate trust or safety.  
Governing source: Release Governance v1.0.  
Affected layers: release, architecture, truthfulness, persistence.  
Enforcement mechanism: waiver policy and P0 blocker model.  
Violation consequence: release prohibited.  
Amendment path: major Governance Baseline and Release Governance amendment required.

## 7. Governance Lifecycle

```text
Problem Identification
        ↓
Evidence Collection
        ↓
Architecture or Policy Design
        ↓
Simulation
        ↓
Implementation
        ↓
Technical Validation
        ↓
Controlled Product Acceptance
        ↓
Scope Closure
        ↓
Baseline or Release Readiness Update
```

| Stage | Purpose | Entry criteria | Required inputs | Permitted changes | Forbidden changes | Required outputs | Exit criteria | Decision options | Failure route |
|---|---|---|---|---|---|---|---|---|---|
| Problem Identification | Define the problem without solving it. | Evidence of issue or blocker. | User request, blocker, artifact, defect. | Problem statement. | Production changes. | Problem record. | Problem is scoped. | Continue / reject / need evidence. | Evidence collection. |
| Evidence Collection | Prove the problem boundary. | Scoped problem. | Docs, artifacts, implementation inspection. | Read-only inspection. | Runtime mutation unless authorized. | Evidence summary. | Evidence sufficient or blocked. | Continue / blocked. | Ask for missing evidence. |
| Architecture or Policy Design | Decide intended governance/policy. | Evidence sufficient. | Baseline, ADRs, current docs. | ADR/design docs. | Production implementation. | Design/ADR. | Approved or revised. | approve / revise / reject. | Revise design. |
| Simulation | Test policy coherence before implementation. | Approved design draft. | Representative cases. | Simulation report only. | Production code/prompt changes. | Simulation report. | One decision reached. | proceed / revise. | Policy revision. |
| Implementation | Implement approved scope only. | Approved policy and simulation. | ADR, allowed files, contracts. | Scoped production changes. | Adjacent scope creep. | Implementation report. | Validation ready. | complete / blocked. | New task/blocker. |
| Technical Validation | Verify implementation mechanics. | Implementation complete. | Tests, build, focused smokes. | Test execution. | Scope expansion. | Validation results. | Required checks pass or fail. | pass / fail. | Fix within scope or block. |
| Controlled Product Acceptance | Prove product behavior with fresh artifacts. | Technical validation passed. | Fresh run plan and fixtures. | Acceptance artifacts/reports. | Production changes. | Acceptance report. | Verdict issued. | accept / revise / blocked. | Revise implementation or policy. |
| Scope Closure | Decide whether approved scope is complete. | Acceptance verdict. | ADR, implementation, acceptance artifacts. | Closure report. | New implementation. | Closure decision and ownership transfer. | Close or keep open. | close / keep open. | Return to scoped work. |
| Baseline or Release Readiness Update | Update governing state. | Closed scope or blocker change. | Closure and release criteria. | Governance/readiness docs. | Silent normative changes. | Baseline/readiness status. | Status current. | update / blocked. | Governance review. |

## 8. Change Classification

| Class | Meaning | Examples | Approving authority | Required evidence | Required documents | Fresh acceptance mandatory? | Active RC invalidated? |
|---|---|---|---|---|---|---|---|
| CLASS 0 — Documentation Clarification | Non-normative documentation correction. | wording correction, reference update, non-normative diagram correction | document owner: `UNASSIGNED — REQUIRES GOVERNANCE DECISION` | proof no meaning changes | updated doc / note | No | No, unless evidence meaning changes |
| CLASS 1 — Local Implementation Change | Isolated change that does not alter authority, contracts, dependency direction, persistence semantics, policy, or release criteria. | isolated bug fix, internal refactor, test improvement | implementation owner: `UNASSIGNED — REQUIRES GOVERNANCE DECISION` | focused tests, scope statement | task/report | Usually no; yes if product behavior affected | Maybe; assess RC invalidation |
| CLASS 2 — Policy Change | Change to product policy or decision rules. | Reviewer severity, Repair boundaries, Export blockers, keyword policy, profile completeness policy | ADR authority: `UNASSIGNED — REQUIRES GOVERNANCE DECISION` | ADR lifecycle evidence | ADR, simulation, implementation, acceptance, closure | Yes | Yes if RC exists |
| CLASS 3 — Architecture Change | Change to ownership, authority, contracts, dependencies, persistence authority, or architecture layers. | new authority, dependency reversal, contract replacement | architecture authority: `UNASSIGNED — REQUIRES GOVERNANCE DECISION` | architecture review and ADR | baseline amendment, ADR | Yes | Yes |
| CLASS 4 — Release-Critical Change | Change affecting release evidence or safety. | prompt behavior, model config, persistence behavior, export version selection, privacy/security boundary | release authority: `UNASSIGNED — REQUIRES GOVERNANCE DECISION` | release impact review | release criteria update, evidence pack | Yes | Yes unless explicitly non-impacting |

## 9. ADR Governance

Every future ADR must include:

- ADR ID and title;
- status;
- context;
- problem statement;
- governing Architecture Baseline version;
- protected invariants affected;
- decision;
- goals;
- non-goals;
- authority and ownership impact;
- contract impact;
- dependency impact;
- persistence impact;
- compatibility impact;
- release-criteria impact;
- alternatives considered;
- risks;
- migration strategy;
- implementation waves;
- validation strategy;
- acceptance criteria;
- rollback or reversal strategy.

Every future ADR must explicitly state:

```text
This ADR extends Architecture Baseline v1.0.

It must preserve all protected invariants unless an approved baseline amendment explicitly changes them.
```

An ADR that changes authority, contract meaning, dependency direction, persistence meaning, Repair policy, Export policy, or release behavior must complete the full lifecycle before implementation.

## 10. ADR Status Model

| Status | Meaning | Permitted activities | Transition requirements | Required evidence | Transition authority |
|---|---|---|---|---|---|
| DRAFT | Initial proposal, not approved. | write problem/design draft | sufficient entry evidence | draft ADR | `UNASSIGNED — REQUIRES GOVERNANCE DECISION` |
| PROPOSED | Ready for governance review. | review, revise | complete ADR sections | proposal evidence | `UNASSIGNED — REQUIRES GOVERNANCE DECISION` |
| APPROVED | Decision approved, not yet implementing. | simulation planning | approval decision | approved ADR | `UNASSIGNED — REQUIRES GOVERNANCE DECISION` |
| IMPLEMENTING | Approved implementation wave active. | scoped implementation | simulation decision or approved exception | implementation plan | `UNASSIGNED — REQUIRES GOVERNANCE DECISION` |
| IMPLEMENTED | Implementation complete, awaiting acceptance. | validation, acceptance preparation | implementation report | validation results | `UNASSIGNED — REQUIRES GOVERNANCE DECISION` |
| ACCEPTED | Controlled acceptance passed. | closure review | fresh artifacts and acceptance verdict | acceptance report | `UNASSIGNED — REQUIRES GOVERNANCE DECISION` |
| CLOSED | Approved scope complete. | release readiness update | scope closure decision | closure report | `UNASSIGNED — REQUIRES GOVERNANCE DECISION` |
| SUPERSEDED | Replaced by later ADR/baseline. | reference only | superseding decision | superseding ADR | `UNASSIGNED — REQUIRES GOVERNANCE DECISION` |
| REJECTED | Not accepted for implementation. | archive/reference | rejection reason | review record | `UNASSIGNED — REQUIRES GOVERNANCE DECISION` |
| BLOCKED | Cannot proceed. | collect missing evidence | blocker resolution | blocker record | `UNASSIGNED — REQUIRES GOVERNANCE DECISION` |

Runtime components are not ADR authorities.

## 11. Implementation Wave Governance

Every implementation wave must specify:

- owned policy area;
- exact permitted files or components;
- forbidden adjacent areas;
- backward-compatibility expectations;
- tests required;
- report output;
- acceptance plan;
- stop conditions.

A wave must not silently absorb:

- Reviewer work;
- Repair work;
- Export work;
- Profile work;
- Keyword work;
- persistence migration;

unless those areas are explicitly part of the approved scope.

Implementation reports must state:

- files changed;
- architecture impact;
- runtime impact;
- contract impact;
- backward compatibility;
- validation executed;
- known limitations.

## 12. Policy Simulation Governance

Purpose:

Policy simulation validates whether a policy is coherent before implementation.

Minimum standard:

- use representative Good Fit, Risky Fit, and Weak Fit cases where applicable;
- test authority boundaries;
- test issue classification;
- test downstream contracts;
- identify ambiguities before implementation;
- produce exactly one decision:
  - `PROCEED TO IMPLEMENTATION`
  - `REVISE POLICY`

Simulation must not be treated as runtime proof.

## 13. Controlled Acceptance Governance

Controlled acceptance requires:

- fresh post-implementation artifacts;
- unique run identifier;
- actual timestamp;
- source fixture identification;
- environment limitation record;
- commands executed;
- case-by-case evidence;
- regression results;
- artifact manifest;
- scope-specific verdict.

Allowed verdicts:

- `ACCEPT <ADR/WAVE>`
- `REVISE <ADR/WAVE>`
- `ACCEPTANCE BLOCKED`

Acceptance must not use:

- historical cached outputs as new evidence;
- manually written expected output as actual runtime evidence;
- smoke results as replacement for product artifacts;
- unsupported claims about unavailable runtime behavior.

## 14. Scope Closure Governance

Scope closure must answer:

1. Did the wave complete its approved responsibilities?
2. Are remaining issues inside or outside the wave scope?
3. Should the wave remain open?
4. Which future owner receives each remaining issue?
5. Does overall product readiness remain incomplete?

Allowed decisions:

- `CLOSE <ADR/WAVE>`
- `KEEP <ADR/WAVE> OPEN`

A wave may close even when the product remains not release-ready.

A wave must remain open only for unfinished work that belongs to its approved scope.

## 15. Architecture Baseline Governance

Architecture Baseline v1.0 is authoritative for:

- component ownership;
- authority rules;
- dependency direction;
- contracts;
- protected invariants;
- current production architecture.

It is not:

- a task backlog;
- a future redesign proposal;
- a replacement for detailed ADRs;
- a release-readiness declaration.

Architecture Baseline v1.0 must be amended before changes to:

- authority ownership;
- protected invariants;
- contract meaning;
- dependency direction or reversal;
- canonical persistence ownership;
- new architecture layer;
- intentional compatibility break.

## 16. Release Governance Interaction

Release Governance consumes:

- architecture status;
- ADR status;
- acceptance evidence;
- blocker status;
- security/privacy evidence;
- workflow evidence;
- RC-specific artifacts.

Rules:

- Architecture approved does not mean RC eligible.
- ADR closed does not mean RC eligible.
- Controlled acceptance passed for one wave does not mean product release-ready.
- Release blockers transfer to future owners unless they prove a defect inside a closed ADR's accepted scope.

## 17. Freeze Model

### Architecture Baseline Frozen

Meaning:

The baseline is authoritative and may change only through an approved amendment process.

### Governance Baseline Frozen

Meaning:

The governance lifecycle and decision rules are authoritative.

### Release Candidate Frozen

Meaning:

A specific production version, prompt set, model configuration, contract set, and persistence behavior are fixed for final acceptance.

Frozen does not mean permanently immutable. It means changes require the defined amendment or invalidation process.

## 18. Amendment Process

Governance Baseline v1.0 may be amended only through:

1. Amendment proposal.
2. Reason and evidence.
3. Affected governance rules.
4. Architecture impact review.
5. Release-governance impact review.
6. Compatibility analysis.
7. Approval decision.
8. New baseline version.
9. Migration or transition notes.

Do not edit v1.0 silently after approval for normative changes.

Version increments:

- Minor version, such as v1.1: clarification or additional governance detail that preserves existing authority, lifecycle, and release model.
- Major version, such as v2.0: change to authority, lifecycle, freeze model, waiver model, or evidence requirements.

## 19. Decision Authority Model

| Decision | Authority |
|---|---|
| Architecture Baseline approval | `UNASSIGNED — REQUIRES GOVERNANCE DECISION` |
| Governance Baseline approval | `UNASSIGNED — REQUIRES GOVERNANCE DECISION` |
| ADR approval | `UNASSIGNED — REQUIRES GOVERNANCE DECISION` |
| Simulation verdict | `UNASSIGNED — REQUIRES GOVERNANCE DECISION` |
| Implementation completion | `UNASSIGNED — REQUIRES GOVERNANCE DECISION` |
| Controlled acceptance verdict | `UNASSIGNED — REQUIRES GOVERNANCE DECISION` |
| Scope closure | `UNASSIGNED — REQUIRES GOVERNANCE DECISION` |
| RC eligibility | `UNASSIGNED — REQUIRES GOVERNANCE DECISION` |
| Final release approval | `UNASSIGNED — REQUIRES GOVERNANCE DECISION` |
| Emergency release invalidation | `UNASSIGNED — REQUIRES GOVERNANCE DECISION` |

Runtime components must not be assigned governance authority.

Specifically:

- Reviewer is not an ADR authority.
- Repair is not a scope-closure authority.
- Export is not a product-release authority.

## 20. Evidence Hierarchy

Highest to lowest:

1. Fresh controlled acceptance artifact.
2. Current production implementation.
3. Passing targeted regression test.
4. Accepted implementation report.
5. Approved ADR.
6. Policy simulation.
7. Architecture or governance summary.
8. Historical artifact.
9. Assumption.

A higher-level policy document defines intended rules.

Runtime artifacts prove actual behavior.

Neither should be substituted for the other.

## 21. Governance Document Register

| Layer | Document | Status | Authority | May Be Modified By |
|---|---|---|---|---|
| Product Intent | `CV_Manager_React/docs/SPEC.md` | Current general product doc, partially older than baselines | Product intent | Documentation governance / `UNASSIGNED — REQUIRES GOVERNANCE DECISION` |
| Product Flow | `CV_Manager_React/docs/FLOW.md` | Current general flow doc, partially older than baselines | Product flow guidance | Documentation governance / `UNASSIGNED — REQUIRES GOVERNANCE DECISION` |
| Architecture Overview | `CV_Manager_React/docs/ARCHITECTURE.md` | Current general architecture doc, partially older than baseline | Implementation-facing architecture guidance | Documentation governance / `UNASSIGNED — REQUIRES GOVERNANCE DECISION` |
| Architecture Baseline | `docs/architecture/ARCHITECTURE_BASELINE_V1.md` | APPROVED / ACTIVE | Architecture authority | Baseline amendment only |
| Policy | `docs/adr/ADR-004_POSITIONING_POLICY.md` | CLOSED policy area | Truthful Positioning Policy | New ADR or amendment process |
| Policy | `docs/adr/ADR-005_REVIEWER_POLICY.md` | CLOSED policy area | Reviewer Policy | New ADR or amendment process |
| Delivery | `docs/implementation/ADR_004_WAVE1_IMPLEMENTATION.md` | Accepted implementation report | ADR-004 implementation evidence | Do not modify; supersede with new report if needed |
| Delivery | `docs/implementation/ADR_005_WAVE2_IMPLEMENTATION.md` | Accepted implementation report | ADR-005 implementation evidence | Do not modify; supersede with new report if needed |
| Acceptance | `docs/acceptance/ADR_004_WAVE1_ACCEPTANCE_RUN.md` | Accepted controlled acceptance | ADR-004 product evidence | Do not modify; supersede with new run |
| Acceptance | `docs/acceptance/ADR_005_WAVE2_ACCEPTANCE_RUN.md` | Accepted controlled acceptance | ADR-005 product evidence | Do not modify; supersede with new run |
| Closure | `docs/governance/ADR_004_WAVE1_SCOPE_CLOSURE_REVIEW.md` | CLOSED | ADR-004 closure authority | Do not modify; supersede with new governance review if needed |
| Closure | `docs/governance/ADR_005_WAVE2_SCOPE_CLOSURE_REVIEW.md` | CLOSED | ADR-005 closure authority | Do not modify; supersede with new governance review if needed |
| Release | `docs/releases/RELEASE_GOVERNANCE_V1.md` | APPROVED / ACTIVE | Release governance | Release governance amendment |
| Release | `docs/releases/RELEASE_CRITERIA_V1.md` | ACTIVE | Release criteria | Release governance update |
| Release | `docs/releases/CURRENT_RELEASE_READINESS.md` | CURRENT SNAPSHOT | Current readiness | Release readiness update |
| Release | `docs/releases/CURRENT_BLOCKER_REGISTER.md` | CURRENT SNAPSHOT | Current release blockers | Blocker register update |
| Governance | `docs/governance/GOVERNANCE_BASELINE_V1.md` | ACTIVE | Governance constitution | Governance Baseline amendment |
| Future ADR | ADR-006 | NOT STARTED | None yet | Future ADR lifecycle only |

## 22. Current Governance Status

| Area | Status |
|---|---|
| Architecture Baseline | APPROVED / ACTIVE |
| Governance Baseline | ACTIVE |
| ADR-004 | CLOSED |
| ADR-005 | CLOSED |
| ADR-006 | NOT STARTED |
| Release Governance | APPROVED / ACTIVE |
| Current RC eligibility | NOT RC ELIGIBLE |

Current blocker owners:

- Repair Policy.
- Export Policy.
- Profile Completeness.
- Keyword / ATS Strategy.
- Security / Privacy.
- RC-specific acceptance.
- Observability and workflow reliability where applicable.

## 23. Future ADR Entry Gate

Before ADR-006 or any future ADR starts, the proposed ADR must identify:

- problem evidence;
- current blocker or release criterion;
- Architecture Baseline section affected;
- protected invariants affected;
- authority impact;
- contract impact;
- dependency impact;
- persistence impact;
- release-governance impact;
- explicit non-goals;
- proposed simulation plan;
- proposed acceptance plan.

If these are incomplete, the ADR remains `DRAFT`.

## 24. ADR-006 Governance Readiness

This section does not design ADR-006.

It only assesses whether governance prerequisites for starting ADR-006 policy design are available.

| Question | Answer | Evidence |
|---|---|---|
| Is Architecture Baseline v1.0 approved? | YES | Architecture Baseline final decision approved. |
| Is Governance Baseline v1.0 ready for approval? | YES | This document satisfies required governance sections and validation answers. |
| Is Release Governance v1.0 approved? | YES | Release Governance v1.0 approved and active. |
| Is Repair Policy identified as an active release blocker? | YES | Current blocker register lists Repair Policy incomplete as P1. |
| Is the Reviewer structured repair contract available? | YES | ADR-005 emits `repairContract.issues`. |
| Are protected invariants for Repair already defined? | YES | Baseline invariants require Reviewer not to repair and future Repair to consume structured contracts. |
| Is the future Repair authority boundary clear? | YES | Repair owns execution; Reviewer emits input only. |
| Is the Repair acceptance lifecycle defined? | YES | Governance lifecycle and controlled acceptance rules are defined. |

Readiness status:

`ADR-006 GOVERNANCE READY`

This does not authorize implementation. It only indicates ADR-006 policy design may begin after Governance Baseline approval.

## 25. Documentation Consistency Findings

| Document | Statement | Conflict | Current authoritative rule | Impact | Recommended future action |
|---|---|---|---|---|---|
| `CV_Manager_React/docs/ARCHITECTURE.md` | Current primary data flow does not include ADR-004 PositioningReport or ADR-005 Structured Review Result as first-class baseline objects. | Older doc is less specific than approved baseline. | Architecture Baseline v1.0 is authoritative. | Low; could confuse future readers. | Update general architecture doc later to reference baseline. |
| `CV_Manager_React/docs/FLOW.md` | Export flow mentions known-risk export override. | Export Policy is not yet governed by Release Governance; current baseline does not approve final export policy redesign. | Release Governance and Architecture Baseline control Export readiness. | Medium for release work. | Reconcile in future Export Policy governance. |
| `CV_Manager_React/docs/SPEC.md` | Reviewer/ATS/PDF check families are listed without ADR-005 structured taxonomy. | Spec predates Reviewer Policy implementation details. | ADR-005 and Architecture Baseline are authoritative. | Low to medium. | Update spec after structured issue UI/product docs are aligned. |
| Older Phase 3/4 governance docs | Repair/export behavior may reflect pre-ADR-004/005 state. | Older docs can describe historical implementation, not current governing baseline. | Closed ADRs, Architecture Baseline, and Release Governance take precedence. | Medium if used as current source. | Treat as historical unless revalidated. |

No inconsistency blocks Governance Baseline approval.

## 26. Governance Approval Recommendation

Validation answers:

| Question | Answer |
|---|---|
| Q1. Does the baseline preserve Architecture Baseline v1.0 as authoritative? | YES |
| Q2. Does it preserve Release Governance v1.0 as authoritative for release readiness? | YES |
| Q3. Does it separate architecture approval, ADR closure, product acceptance, RC eligibility, and release approval? | YES |
| Q4. Does it define one mandatory lifecycle for future policy changes? | YES |
| Q5. Does it prevent future ADRs from introducing duplicate authorities without an architecture amendment? | YES |
| Q6. Does it require fresh artifacts for controlled acceptance? | YES |
| Q7. Does it prevent smoke/build results from being treated as complete product acceptance? | YES |
| Q8. Does it prevent unrelated release blockers from reopening closed ADRs? | YES |
| Q9. Does it define baseline amendment and versioning rules? | YES |
| Q10. Does it avoid designing or implementing ADR-006? | YES |
| Q11. Does it accurately retain current RC status as NOT RC ELIGIBLE? | YES |
| Q12. Does it describe current approved governance rather than proposing a new product architecture? | YES |

Final decision:

`APPROVE GOVERNANCE BASELINE V1.0`

ADR-006 governance-readiness result:

`ADR-006 GOVERNANCE READY`

## 27. Reference Index

Core project documents:

- `CV_Manager_React/docs/SPEC.md`
- `CV_Manager_React/docs/FLOW.md`
- `CV_Manager_React/docs/ARCHITECTURE.md`

Architecture baseline:

- `docs/architecture/ARCHITECTURE_BASELINE_V1.md`

Accepted ADRs:

- `docs/adr/ADR-004_POSITIONING_POLICY.md`
- `docs/adr/ADR-005_REVIEWER_POLICY.md`

Validation:

- `docs/validation/ADR_004_POLICY_SIMULATION.md`
- `docs/validation/ADR_005_POLICY_SIMULATION.md`

Implementation:

- `docs/implementation/ADR_004_WAVE1_IMPLEMENTATION.md`
- `docs/implementation/ADR_005_WAVE2_IMPLEMENTATION.md`

Acceptance:

- `docs/acceptance/ADR_004_WAVE1_ACCEPTANCE_RUN.md`
- `docs/acceptance/ADR_005_WAVE2_ACCEPTANCE_RUN.md`

Scope closure:

- `docs/governance/ADR_004_WAVE1_SCOPE_CLOSURE_REVIEW.md`
- `docs/governance/ADR_005_WAVE2_SCOPE_CLOSURE_REVIEW.md`

Release governance:

- `docs/releases/RELEASE_GOVERNANCE_V1.md`
- `docs/releases/RELEASE_CRITERIA_V1.md`
- `docs/releases/CURRENT_RELEASE_READINESS.md`
- `docs/releases/CURRENT_BLOCKER_REGISTER.md`
