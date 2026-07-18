# P4-VAL-001 Scoped Validation Report

Status: DONE

## Confirmed Previous Validation-Scope Bug

Targeted Summary regeneration normalized the model response as a full `ScreeningCvOutput` and ran whole-CV required-field validation before extracting the authorized Summary mutation. An unchanged missing `header.email` therefore rejected the local Summary proposal. Unrelated duplicate and traceability failures could do the same.

## Validator Responsibility Matrix

| Validator | Previous Scope | Scoped Apply Gate | Blocking During Targeted Apply | Retained Global Issue |
|---|---|---|---|---|
| Response contract and request identity | Whole response | Contract/stale | Yes | No |
| Required fields | Whole candidate | Required fields in the target plus candidate-caused new failures | Target/new only | Yes |
| Evidence namespace and traceability | Whole candidate | Changed target bullets/content | Target/new only | Yes |
| Unsupported visible claims | Whole candidate/review | New claims in changed target content | Yes | Pre-existing unrelated claims remain |
| Duplicate content | Whole candidate | New duplicates involving the changed target | Target/new only | Yes |
| Preserved-zone integrity | Allowed fields were extracted while raw extra changes could be ignored | Compare raw response and patched CV against protected zones | Yes | No |
| Freshness | Request/CV/Brief/evidence identity | Contract/stale | Yes | No |
| Review and export | Whole resulting CV | Post-apply global release gate | No for local apply; yes for export | Yes |

## Scoped Validation Design

The implementation classifies outcomes into five explicit collections:

1. Target failures: invalid or unsafe content inside the authorized target.
2. Preserved-zone failures: any raw mutation outside the target or protected-zone corruption.
3. Stale/contract failures: stale CV, Brief, or evidence identity and invalid response contracts.
4. Pre-existing global issues: stable issues already present outside the target.
5. New global issues: failures introduced by the candidate patch.

`mayApplyTargetPatch` is true only when categories 1, 2, 3, and 5 are empty. Category 4 remains visible and authoritative for export but is not an Apply Gate failure.

## Pre-Existing Versus New Issue Comparison

Issue identity uses validator ID, rule ID, field path, target zone, role ID, and bullet ID where available. Message text alone is not used. The current CV and patched CV are evaluated with the existing validators; unchanged issue identities become `preExistingGlobalIssues`, while candidate-caused identities become `newGlobalIssues` and block application.

## Patch Application Behavior

1. Normalize the runtime response.
2. Detect and reject raw prohibited-zone mutations.
3. Extract only the authorized Summary or selected-bullet patch.
4. Apply it to the current authoritative CV while preserving every non-target zone.
5. Run scoped validation against current and patched CVs.
6. On pass, use the existing save boundary to create the new version/content hash and refresh affected review, Repair Orchestrator, CTA, and Export Decision state.
7. Keep unrelated global blockers visible; export remains blocked until the authoritative export gate passes.

## Files Changed

Production (6):

- `CV_Manager_React/src/domain/targetedValidation.ts`
- `CV_Manager_React/src/domain/targetedRegeneration.types.ts`
- `CV_Manager_React/src/domain/targetedRegeneration.ts`
- `CV_Manager_React/src/domain/targetedRegenerationDiagnostics.ts`
- `CV_Manager_React/src/components/tabs/ScreeningLab.tsx`
- `CV_Manager_React/src/components/tabs/screeningReviewRepairPanels.tsx`

Tests/config:

- `CV_Manager_React/scripts/smoke-scoped-target-validation.mjs`
- `CV_Manager_React/scripts/smoke-targeted-patch-application.mjs`
- `CV_Manager_React/scripts/smoke-targeted-regeneration-runtime.mjs`
- `CV_Manager_React/e2e/targeted-regeneration-runtime.spec.ts`
- `CV_Manager_React/package.json`

Governance:

- `docs/governance/tasks/P4-VAL-001.md`
- `docs/governance/phase4/P4_VAL_001_SCOPED_VALIDATION_REPORT.md`
- `docs/governance/CURRENT_STATE.md`
- `docs/governance/MASTER_TASK_ROADMAP.md`
- `docs/governance/COMPLETION_REPORT.md`

Canonical runtime data was not modified.

## Automated Validation

- `npm run smoke:scoped-target-validation` - PASS; ten deterministic scoped-validation fixtures.
- `npm run smoke:targeted-patch-application` - PASS; patch preservation, version/hash creation, and remaining blocker behavior.
- Regeneration diagnostics and validation-trace smokes - PASS.
- Targeted regeneration UI/runtime and all P4-AR smokes - PASS.
- Phase 4 guided-blocker/editing/explainability/confidence smokes - PASS.
- Product Acceptance, workflow, reviewer, and export-readiness smokes - PASS.
- Targeted regeneration browser E2E - PASS (9/9), including missing-email apply, prohibited-zone block, and final-blocker export scenarios.
- Product Acceptance browser E2E - PASS (13/13).
- Browser no-AI guard - PASS (1/1).
- `npm run build` - PASS.
- `npm run test:system` - PASS.

No hidden AI call occurs in deterministic tests, and existing P4-DIAG/P4-AR behavior remains intact.

## Manual Real-Page Result

Scenario: Microsoft CV, target `summary`, existing missing email and other global issues.

- Request ID: `targeted-regeneration-uu3yyf`.
- CV version: `cv-mrixgp5z-jf6ua-regen-vifwcv`; displayed hash prefix `h9nkhko`.
- The real runtime returned a new Summary and also changed prohibited `header.targetRole`, `workExperience`, and `export` zones.
- Scoped result: target failures 0; preserved-zone failures 3; stale/contract failures 0; pre-existing global issues 3; new global issues 0.
- Existing `header.email`, duplicate bullet, and missing bullet evidence were listed as remaining pre-existing global issues—not as the reason the Summary patch failed.
- The true primary failure was the prohibited-zone mutation. The UI showed the exact affected zones and recommended retrying with tighter constraints.
- The current CV was not changed. Canonical data remained at revision 87, with four CV versions total and the Microsoft latest version unchanged.

This satisfies the critical real-page rule: Summary regeneration is no longer rejected solely because email was already missing. The external candidate itself was not safe to apply because it violated preserved-zone integrity. Deterministic real-component browser acceptance separately proves that a valid Summary-only candidate applies, creates a new version/hash, clears the Summary blocker, retains missing email, and keeps export blocked.

## Remaining Limitations

- The current full-shaped model response can still attempt out-of-scope changes. The strict boundary correctly rejects those responses; changing the response contract or prompt requires separate authorization.
- Affected review refresh continues through the existing application boundary; no incremental reviewer semantics were redesigned.

## Safeguard Confirmation

- No validation rule was weakened, suppressed, or downgraded.
- Core review quality rules and export-decision semantics were not changed.
- Unsupported-claim, evidence traceability, freshness, and preserved-zone checks remain blocking where authoritative.
- AI prompts, evidence selection, routing, persistence architecture, canonical runtime data, and unrelated workflow stages were not modified.
- No next task was created or promoted. Phase 5 was not started.
