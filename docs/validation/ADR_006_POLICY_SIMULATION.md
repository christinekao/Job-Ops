# ADR-006 Policy Simulation

Status: COMPLETE  
Simulation date: 2026-07-17  
AI: Codex  
Model: GPT-5.6 Sol  
Reasoning: High  
Scope: Policy validation only. No production code, prompts, runtime, Repair implementation, Reviewer, Export, Writer, ScreeningAnalysis, Positioning Policy, persistence, or architecture changes were made.

Final decision:

`PROCEED TO IMPLEMENTATION`

## Executive Summary

ADR-006 is coherent with Architecture Baseline v1.0, Governance Baseline v1.0, ADR-004, ADR-005, and Release Governance v1.0.

The simulation confirms:

- Repair can consume ADR-005 structured repair contracts without becoming Reviewer.
- Repair can execute bounded changes without becoming Writer or Positioning authority.
- Capability Gaps remain non-repairable by wording.
- Profile Completeness routes to human input unless trusted profile data exists.
- External Wording and Keyword Coverage can be repaired only inside bounded zones.
- Unsupported Claims can be removed or downgraded, but never strengthened.
- Repair does not recompute Fit Tier, Positioning, Capability Gaps, Reviewer category, or severity.
- Repair does not decide Export.

## Inputs Used

Reference documents:

- `docs/architecture/ARCHITECTURE_BASELINE_V1.md`
- `docs/governance/GOVERNANCE_BASELINE_V1.md`
- `docs/releases/RELEASE_GOVERNANCE_V1.md`
- `docs/releases/RELEASE_CRITERIA_V1.md`
- `docs/releases/CURRENT_RELEASE_READINESS.md`
- `docs/releases/CURRENT_BLOCKER_REGISTER.md`
- `docs/adr/ADR-004_POSITIONING_POLICY.md`
- `docs/adr/ADR-005_REVIEWER_POLICY.md`
- `docs/adr/ADR-006_REPAIR_POLICY.md`
- `docs/acceptance/ADR_005_WAVE2_ACCEPTANCE_RUN.md`

Existing implementation inspected:

- `CV_Manager_React/src/domain/repairOrchestrator.ts`
- `CV_Manager_React/src/domain/repairOrchestrator.types.ts`
- `CV_Manager_React/src/domain/repairSession.ts`
- `CV_Manager_React/src/domain/safeRepairExecutor.types.ts`

## Simulation Method

This is policy reasoning only.

No runtime execution was performed.

Each case validates:

- authority boundaries;
- contract input;
- repairability;
- mutation boundaries;
- truthfulness;
- validation/re-review;
- compatibility;
- release impact.

## Case A — Good Fit

Scenario:

- Fit: Good.
- Reviewer structured issues:
  - `External Wording` / `targeted-repair`
  - `Profile Completeness` / `human-input`
  - no Unsupported Claim.

Expected Repair behavior:

- External Wording routes to approval-required or targeted repair.
- Mutation boundary is summary/workExperience only.
- Profile Completeness routes to human-input unless trusted contact data exists.
- Repair does not alter positioning, Fit Tier, or capability gaps.
- Repaired CV must be re-reviewed before promotion.

Simulation result:

`PASS`

Reason:

ADR-006 gives Repair enough authority to improve recruiter-readable wording while preventing profile-data invention and preserving upstream authority.

## Case B — Risky Fit

Scenario:

- Fit: Risky / Stretch.
- Reviewer structured issues:
  - `Keyword Coverage` / `targeted-repair`
  - `Capability Gap` / `not-repairable`
  - `External Wording` / `targeted-repair`
  - `Profile Completeness` / `human-input`

Expected Repair behavior:

- Keyword Coverage may repair only evidence-supported keywords.
- Capability Gap is not repairable by CV wording.
- External Wording may improve readability without changing claim strength.
- Profile Completeness requires human/trusted input.
- Repair must not convert adjacent-fit wording into direct-fit claim.

Simulation result:

`PASS`

Reason:

ADR-006 separates repairable wording/keyword issues from truthful capability gaps and keeps Risky Fit truthfulness intact.

## Case C — Azure Weak Fit

Scenario:

- Fit: Weak / Avoid.
- Reviewer structured issues:
  - `Capability Gap` / `not-repairable`
  - `External Wording` / `targeted-repair`
  - `Profile Completeness` / `human-input`

Expected Repair behavior:

- Capability Gap must not be repaired as solved Azure sales ownership, quota ownership, deal ownership, cloud migration leadership, or architecture ownership.
- External Wording may improve action/outcome phrasing only within existing evidence support.
- Repair must preserve transferable positioning.
- Export may remain blocked.

Simulation result:

`PASS`

Reason:

ADR-006 prevents Repair from becoming a hidden direct-fit Writer for Azure Weak Fit.

## Edge Case D — Unsupported Claim

Scenario:

- Reviewer emits `Unsupported Claim` / `Critical` / `targeted-repair`.

Expected Repair behavior:

- Remove, downgrade, or replace with supported wording only.
- No strengthening.
- No new evidence.
- No new Fit Tier or positioning decision.
- Re-review required.

Simulation result:

`PASS`

## Edge Case E — Evidence Missing

Scenario:

- Reviewer emits `Evidence Missing` / `High`.

Expected Repair behavior:

- Human decision or evidence attachment/removal.
- Repair cannot fabricate evidence IDs.
- If no valid selected evidence exists, stop and ask for user/evidence action.

Simulation result:

`PASS`

## Edge Case F — Stale CV Context

Scenario:

- Repair input CV hash does not match current CV hash.

Expected Repair behavior:

- Stop as stale.
- Do not mutate canonical CV.
- Request re-review or refresh.

Simulation result:

`PASS`

## Edge Case G — No-diff Repair

Scenario:

- Repair proposal produces no content difference.

Expected Repair behavior:

- Stop as no-content-diff.
- Do not claim success.
- Keep current CV unchanged.

Simulation result:

`PASS`

## Edge Case H — Export Blocking Issue

Scenario:

- Reviewer issue has export signal `block`.

Expected Repair behavior:

- Repair may address the underlying repairable issue if authorized.
- Repair does not decide export readiness.
- Export re-evaluates later under Export authority.

Simulation result:

`PASS`

## Authority Validation

| Concern | Simulation result |
|---|---|
| Repair does not recompute Fit Tier | PASS |
| Repair does not recompute Positioning | PASS |
| Repair does not recompute Capability Gaps | PASS |
| Repair does not override Reviewer category/severity | PASS |
| Repair does not select new evidence silently | PASS |
| Repair does not decide Export | PASS |
| Repair consumes structured Reviewer contract | PASS |

## Contract Validation

| Contract | Result |
|---|---|
| Structured Review Result consumed | PASS |
| `repairContract.issues` primary input | PASS |
| Legacy blocker fallback allowed only for compatibility | PASS |
| Mutation zones bounded | PASS |
| Re-review required | PASS |
| Canonical promotion guarded | PASS |

## Compatibility Validation

| Compatibility area | Result |
|---|---|
| Existing CV versions readable | PASS |
| Existing review snapshots readable | PASS |
| Legacy blockers fallback remains possible | PASS |
| No persistence migration required by policy | PASS |
| Export behavior unchanged | PASS |

## Release Impact

If implemented and accepted, ADR-006 can move these criteria toward PASS:

- `RC-D001`
- `RC-D002`
- `RC-D003`
- `RC-D004`
- `RC-D005`
- `RC-D006`
- `RC-I006`

ADR-006 does not close:

- Export Policy criteria.
- Profile Completeness criteria.
- Security/privacy criteria.
- Keyword/ATS release threshold.
- RC-specific acceptance/version freeze.

## Risks and Ambiguities

| Risk | Disposition |
|---|---|
| Structured issue data may lack exact visible location for some legacy cases. | Acceptable if fallback is lower-confidence and bounded. |
| Targeted regeneration may need prompt-specific constraints. | Implementation must keep any prompt work scoped to Repair only. |
| UI may still show legacy repair flow. | Acceptable for Wave 1 if structured contract is consumed internally. |
| Capability gaps may be tempting to "repair" through stronger wording. | Explicitly forbidden. |

## Final Decision

`PROCEED TO IMPLEMENTATION`

Rationale:

- Policy is internally consistent.
- Architecture invariants are preserved.
- Contract boundaries are clear.
- Edge cases have deterministic outcomes.
- No unresolved ambiguity blocks implementation.
