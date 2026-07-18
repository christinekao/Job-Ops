Canonical ID: ADR-PROD-006

# ADR-006 - Repair Policy

Status: APPROVED  
Date: 2026-07-17  
AI: Codex  
Model: GPT-5.6 Sol  
Reasoning: High  
Scope: Repair Policy only. Establish Repair as the sole authority for executing bounded, evidence-backed modifications to generated CV versions by consuming ADR-005 Structured Reviewer Contracts. No Reviewer redesign, Export redesign, ScreeningAnalysis redesign, Positioning Policy change, Writer redesign, architecture redesign, persistence migration, prompt redesign, or release approval is authorized by this ADR.

This ADR extends Architecture Baseline v1.0.

It must preserve all protected invariants unless an approved baseline amendment explicitly changes them.

## Executive Summary

ADR-006 defines the Repair Policy for CV Builder.

ADR-005 made Reviewer a structured issue producer. Reviewer now emits:

- structured issues;
- category;
- severity;
- evidence;
- repairability;
- suggested repair intent;
- expected repair boundary;
- export signal.

ADR-006 defines how Repair consumes that structured contract.

Repair becomes the sole authority for executing bounded CV modifications. Repair does not become a positioning engine, Reviewer, Writer, Export engine, or evidence selector.

Repair may modify generated CV content only when:

- the issue is repairable under ADR-005 structured contract;
- the mutation stays within allowed zones;
- the change is evidence-backed or mechanically safe;
- protected zones remain unchanged;
- the repaired CV is revalidated before canonical promotion.

## Context

Current governance state:

- Architecture Baseline v1.0 is approved and active.
- Governance Baseline v1.0 is approved and active.
- Release Governance v1.0 is approved and active.
- ADR-004 Positioning Policy is closed.
- ADR-005 Reviewer Policy is closed.
- Current RC status is `NOT RC ELIGIBLE`.

Release Criteria v1.0 identifies Repair as an active RC blocker:

- `RC-D001` Repair Policy is explicitly governed — `NOT STARTED`
- `RC-D002` Repair consumes structured review issues — `NOT STARTED`
- `RC-D003` Repair applies minimal bounded changes — `PARTIAL`
- `RC-D004` Repair must not invent evidence — `PARTIAL`
- `RC-D005` Repair must preserve unaffected CV content — `PARTIAL`
- `RC-D006` Repair output is revalidated before becoming canonical — `PARTIAL`

Existing implementation already contains legacy repair routing and bounded repair session behavior, but the approved architecture requires future Repair to consume ADR-005 structured contracts rather than hidden Reviewer reasoning or legacy prose blockers.

## Problem Statement

Without a Repair Policy, the product has an architectural contract gap:

```text
Reviewer
  -> Structured Review Result
  -> Repair Contract Input
  -> Repair
```

Reviewer emits structured repair intent, but Repair has not yet been governed as the consumer of that contract.

This creates release risk:

- Repair may continue depending on legacy blocker strings.
- Repair may route capability gaps as if they were repairable wording defects.
- Repair may modify broader CV zones than necessary.
- Repair may apply changes without a clear evidence or boundary model.
- Repair may become a hidden Writer or positioning authority if not constrained.

## Decision

Repair must consume ADR-005 `ReviewerStructuredResult.repairContract.issues` as its primary policy input.

Repair may use legacy blockers only as a backward-compatible fallback when structured repair issues are unavailable.

Repair owns:

- repair route selection;
- mutation execution;
- bounded change enforcement;
- preservation of unaffected CV zones;
- repair session stop reasons;
- post-repair validation and re-review request;
- canonical promotion only after validation passes.

Repair does not own:

- Fit Tier;
- positioning;
- capability-gap inference;
- Reviewer classification;
- Reviewer severity;
- evidence selection;
- Export decision;
- release approval.

## Goals

ADR-006 must:

1. Make Repair consume ADR-005 structured repair contracts.
2. Preserve `ScreeningAnalysis` as Fit Tier / positioning / capability-gap authority.
3. Preserve Reviewer as classifier and contract producer only.
4. Prevent Repair from recomputing Reviewer categories or severity.
5. Define repairable and non-repairable issue policy.
6. Define bounded mutation zones.
7. Define safe-auto, approval-required, targeted-regeneration, human-input, human-decision, and unsupported routes.
8. Define truthfulness guarantees.
9. Define validation and re-review before canonical promotion.
10. Define failure handling and stop reasons.
11. Preserve backward compatibility with legacy review snapshots and legacy blockers.
12. Integrate with release criteria `RC-D001` through `RC-D006`.

## Non-goals

ADR-006 does not:

- redesign Reviewer;
- change Reviewer issue taxonomy;
- change Reviewer severity rules;
- redesign Export;
- decide final export readiness;
- change ScreeningAnalysis;
- change PositioningReport;
- change Writer policy;
- change prompts unless a later implementation wave explicitly scopes a repair prompt;
- migrate persistence schema;
- create a release build;
- declare the product RC eligible.

## Governing Architecture Baseline

Architecture Baseline v1.0 rules preserved:

- ScreeningAnalysis remains the single positioning authority.
- PositioningReport remains a read-only derived view.
- Writer must not fabricate unsupported experience.
- Truthful capability gaps must not be treated as hallucinations.
- Reviewer must not recompute Fit Tier, Positioning, or Capability Gaps.
- Reviewer produces structured issues but does not repair.
- Reviewer provides export input but does not decide export.
- Future Repair must consume structured contracts rather than hidden Reviewer reasoning.
- Future Export must retain independent decision authority.

## Protected Invariants Affected

| Invariant | Impact | ADR-006 rule |
|---|---|---|
| INV-001 ScreeningAnalysis remains positioning authority | Preserved | Repair must not alter fit/positioning authority. |
| INV-002 PositioningReport remains read-only derived view | Preserved | Repair may read but not modify/recompute it. |
| INV-003 Writer must not fabricate unsupported experience | Preserved | Repair must not add unsupported claims. |
| INV-004 Capability gaps are not hallucinations | Preserved | Capability gaps route to human/evidence/positioning decision, not auto repair. |
| INV-008 Reviewer produces structured issues but does not repair | Preserved | Repair consumes Reviewer contract; Reviewer still does not execute. |
| INV-010 Legacy review snapshot compatibility | Preserved | Legacy fallback remains allowed. |
| INV-011 Future Repair consumes structured contracts | Implemented by policy | Structured repair issues become primary Repair input. |
| INV-012 Future Export retains independent authority | Preserved | Repair cannot decide export. |

## Authority and Ownership Impact

| Concern | Owner after ADR-006 | Notes |
|---|---|---|
| Fit Tier | ScreeningAnalysis | unchanged |
| Positioning | ScreeningAnalysis | unchanged |
| Capability Gaps | ScreeningAnalysis / PositioningReport as derived view | unchanged |
| Reviewer classification | Reviewer | unchanged |
| Issue severity | Reviewer | unchanged |
| Repair routing | Repair | structured contract consumer |
| Repair execution | Repair | sole mutation authority |
| Export decision | Export | unchanged |
| Canonical version promotion after repair | Repair workflow + persistence boundary | only after validation/re-review |

## Repair Input Contract

Primary input:

```text
ReviewerStructuredResult.repairContract.issues[]
```

Each issue must include:

- `id`
- `category`
- `severity`
- `description`
- `evidence`
- `repairability`
- `suggestedRepairIntent`
- `expectedRepairBoundary`
- `exportSignal`
- optional `visibleLocation`

Repair must also bind each repair decision to:

- `reviewedCvVersionId`
- `reviewedCvContentHash`
- current CV version id
- current CV content hash
- selected evidence IDs when required
- effective CV Brief hash when generation context is relevant

If structured repair contract is unavailable:

- Repair may use legacy blockers only as backward-compatible fallback.
- Fallback must be marked as lower confidence.
- Fallback must not bypass mutation-zone, evidence, or validation rules.

## Repair Route Policy

| Reviewer repairability | Repair route | Meaning |
|---|---|---|
| `auto-repairable` | safe-auto | Deterministic safe mutation may be applied without AI if evidence and zone constraints pass. |
| `targeted-repair` | approval-required or targeted-regeneration | Visible wording/content change requires bounded proposal or explicit targeted regeneration. |
| `human-input` | human-input | Requires trusted user/profile data; Repair must not invent it. |
| `human-decision` | human-decision | Requires user decision on truth, evidence, or career strategy. |
| `not-repairable` | unsupported / risk-only | No CV mutation. Present as risk or route to upstream evidence/positioning decision. |

## Category-specific Repair Policy

| Category | Default repair policy |
|---|---|
| Unsupported Claim | Repairable only by removing, downgrading, or replacing with evidence-supported wording inside allowed zones. Never strengthen. |
| Evidence Missing | Human-decision or targeted evidence attachment/removal. Do not fabricate evidence IDs. |
| Capability Gap | Not repairable as wording. Do not convert into solved strength. User may add evidence or change target positioning upstream. |
| External Wording | Targeted repair allowed if meaning and evidence boundaries are preserved. |
| Keyword Coverage | Repair allowed only for evidence-supported keywords. Unsupported keywords remain omitted. |
| Formatting | Safe-auto allowed if structural and non-semantic. |
| Profile Completeness | Human-input only unless trusted profile data already exists. |
| Policy Violation | Block mutation unless the safe fix is removal/downgrade within approved boundary. |

## Minimal Bounded Change Rules

Repair must:

- mutate only `expectedRepairBoundary` or explicitly authorized derived zones;
- preserve all prohibited mutation zones;
- preserve evidence IDs unless the repair is specifically evidence traceability;
- preserve unaffected CV content byte-for-byte where possible;
- produce a before/after diff for every changed zone;
- reject no-diff output as terminal or non-progress;
- reject stale CV/version/hash context;
- reject attempts to change Fit Tier, PositioningReport, ScreeningAnalysis, Reviewer classification, export status, or unrelated CV sections.

## Truthfulness Guarantees

Repair must not:

- fabricate experience;
- invent metrics;
- invent ownership;
- invent leadership;
- invent quota or sales responsibility;
- invent Azure architecture or migration ownership;
- convert truthful capability gaps into solved strengths;
- add unsupported JD keywords;
- infer evidence not present in selected evidence or trusted profile data.

Repair may:

- remove unsupported claims;
- soften unsupported wording;
- translate internal/work-log wording into external recruiter wording;
- add evidence-supported keywords;
- attach valid evidence IDs;
- insert trusted profile data supplied by user/profile source;
- restructure wording without changing meaning.

## Validation and Re-review

Every applied repair must pass:

1. context freshness check;
2. mutation-zone validation;
3. truthfulness validation;
4. preserved-zone validation;
5. schema/output validation;
6. content-diff validation;
7. re-review of affected Reviewer families or full review where scoped review is insufficient.

Canonical promotion is allowed only after validation succeeds.

If validation fails, the current canonical CV must remain unchanged.

## Canonical Version Promotion

Repair may promote a new current CV version only when:

- input CV identity is fresh;
- repair route is authorized;
- changes are bounded;
- unsupported claims are not introduced;
- preserved zones remain valid;
- re-review is recorded or requested;
- review snapshot freshness is updated or invalidated according to current review-freshness rules.

Repair must not silently fork duplicate CV versions unless the approved persistence/versioning flow requires a new version.

## Failure Handling

Repair must stop when:

- stale context;
- no repairable issues;
- human input required;
- human decision required;
- unsupported route;
- no content diff;
- repeated blocker set;
- max loop reached;
- budget reached;
- unsafe output;
- validation failure;
- protected invariant risk.

Failure output must explain:

- stop reason;
- affected issue IDs;
- changed zones, if any;
- preserved zones;
- user action required;
- whether the canonical CV changed.

## Compatibility

Backward compatibility requirements:

- Existing CV versions remain readable.
- Existing review snapshots remain readable.
- Existing legacy blockers may be used as fallback when structured contract is absent.
- New structured repair metadata must be additive unless a future migration ADR explicitly changes persistence.
- Existing export decision behavior remains unchanged.

## Release Criteria Impact

ADR-006 targets:

- `RC-D001` Repair Policy is explicitly governed.
- `RC-D002` Repair consumes structured review issues.
- `RC-D003` Repair applies minimal bounded changes.
- `RC-D004` Repair must not invent evidence.
- `RC-D005` Repair must preserve unaffected CV content.
- `RC-D006` Repair output is revalidated before becoming canonical.
- `RC-I006` Repair, when invoked, updates the intended version only.

ADR-006 does not by itself make the project RC eligible. Export, Profile Completeness, Security/Privacy, Keyword/ATS threshold, and RC-specific acceptance may remain blockers.

## Implementation Waves

Wave 1 — Repair Contract Consumption

- Add structured repair contract adapter.
- Prefer `ReviewerStructuredResult.repairContract.issues`.
- Keep legacy blockers as fallback.
- No UI redesign.
- No Export changes.

Wave 2 — Bounded Repair Execution Validation

- Enforce mutation-zone and stale-context validation for structured repairs.
- Preserve unaffected zones.
- Emit structured repair result.
- Re-review affected families.

Wave 3 — Controlled Acceptance and Release Criteria Closure

- Run Good, Risky, and Azure Weak Fit repair acceptance.
- Prove non-repairable capability gaps are not mutated.
- Prove unsupported claims are removed/downgraded, not strengthened.

This ADR Master Workflow may implement the approved scope in one or more waves only if each implementation step remains inside Repair Policy scope.

## Validation Strategy

Technical validation must include:

- build;
- lint if available;
- relevant repair smokes;
- reviewer smoke to confirm ADR-005 contract compatibility;
- review freshness smoke;
- targeted tests for structured repair route mapping;
- tests for stale context and preserved zones.

## Controlled Acceptance Criteria

Acceptance must use fresh artifacts and include:

- Good Fit case with repairable wording/profile issue;
- Risky Fit case with keyword/external wording issue;
- Azure Weak Fit case with capability gaps and no fabricated Azure ownership;
- at least one non-repairable Capability Gap issue;
- at least one Profile Completeness human-input issue;
- at least one External Wording targeted repair issue;
- evidence that canonical CV is unchanged on failed/unsafe repair;
- evidence that repaired CV is re-reviewed before promotion.

Allowed verdicts:

- `ACCEPT ADR-006`
- `REVISE ADR-006`
- `ACCEPTANCE BLOCKED`

## Rollback or Reversal Strategy

If implementation introduces unsafe Repair behavior:

- disable structured repair execution path;
- fall back to legacy blocker display without mutation;
- preserve existing CV versions and snapshots;
- do not modify Reviewer or Export to compensate;
- document rollback in implementation report.

## Alternatives Considered

### Alternative 1 — Keep legacy prose blocker repair routing

Rejected.

Reason: It violates Governance Baseline GOV-011 by relying on hidden or prose Reviewer reasoning instead of structured contracts.

### Alternative 2 — Let Reviewer execute repairs

Rejected.

Reason: Violates ADR-005 and Architecture Baseline invariant that Reviewer does not repair.

### Alternative 3 — Let Writer regenerate the whole CV for every repair

Rejected.

Reason: Violates minimal bounded change and increases risk of changing already-passed content.

## Risks

- Structured issue contract may not cover every legacy blocker yet.
- UI may still display some legacy blocker flows during migration.
- Targeted regeneration may require prompt scoping in a later implementation detail.
- Profile completeness may remain blocked without trusted user input.
- Export may remain blocked until ADR-007.

## Policy Design Validation

| Check | Result | Evidence |
|---|---|---|
| Architecture consistency | PASS | Preserves Architecture Baseline v1.0 authority and invariants. |
| Governance consistency | PASS | Follows Governance Baseline lifecycle and GOV-011. |
| Authority ownership | PASS | Repair owns execution only; does not own Fit Tier, positioning, capability gaps, Reviewer classification, or Export. |
| Contracts | PASS | Consumes ADR-005 `repairContract.issues`. |
| Protected invariants | PASS | No invariant requires amendment. |
| Dependency rules | PASS | Reviewer -> Repair contract direction preserved. |
| Compatibility | PASS | Legacy fallback remains additive. |
| Release impact | PASS | Targets Repair Safety criteria but does not claim RC eligibility. |

Gate:

`APPROVE POLICY DESIGN`
