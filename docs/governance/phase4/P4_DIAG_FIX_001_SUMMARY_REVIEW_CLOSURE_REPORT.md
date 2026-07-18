# P4-DIAG-FIX-001 - Summary Regeneration Review Closure Report

Status: DONE

## Outcome

The post-repair review black box is closed. A Summary-only regeneration now reaches one of three explicit terminal outcomes:

1. The new Summary passes and its blocker disappears.
2. The new Summary genuinely fails again and the UI shows the new review evidence plus an alternate primary action.
3. The review is stale or failed, so old blockers are hidden and `Recheck Updated CV` is required before they can drive workflow or export.

The confirmed real outcome was case 2. The Summary changed, saved, and received a new review. It did not pass role-fit review, and the UI correctly retained that attempt instead of presenting the same unattempted AI action.

## Confirmed Root Cause

Primary classification: `blocker-identity-not-versioned`.

The original runtime path correctly saved the new CV and ran the reviewer on the new Summary. The first incorrect closure node was downstream identity:

- blocker/card IDs were derived from labels and list position rather than review run and reviewed content hash;
- targeted-regeneration attempt identity was tied to the pre-repair CV hash;
- after save, the successor CV produced a different request key, so the successful attempt disappeared from current UI state;
- the fresh blocker was then displayed with generic wording and the same regeneration CTA as if no attempt had occurred.

Secondary contributors were the absence of explicit reviewed CV version and Summary hash on review snapshots, old Writer timestamps in the review step, and no genuine re-failure presentation.

## 22-Node Trace Result

| Range | Result |
|---|---|
| 1-12 | Initial CV/review/blocker, targeted request, model response, normalization, scoped validation, save, new CV, and new Summary were all reached with correct fresh identity. |
| 13-18 | Review refresh ran locally on the new CV and new Summary; a new review was produced and genuinely returned a role-fit failure. |
| 19 | First incorrect node: normalized blocker identity was not bound to the new review run/hash. |
| 20 | Repair Orchestrator correctly classified the fresh Summary blocker as targeted regeneration. |
| 21 | Remaining Issues received fresh blocker strings but unversioned display identity. |
| 22 | The successful attempt was filtered out after the hash change, producing the false unattempted loop. |

Full node-level evidence remains in `docs/governance/tasks/P4-DIAG-FIX-001.md`.

## Implementation

### Review freshness

Added explicit freshness identity:

- current CV version and content hash;
- current Summary hash;
- reviewed CV version and content hash;
- reviewed Summary hash;
- review run ID and completion time;
- `fresh`, `stale`, `running`, or `failed` status.

Legacy snapshots remain valid through lazy identity reconciliation; no migration was required.

### Versioned blockers

Review blocker identity now includes:

- review run ID;
- reviewed CV content hash;
- reviewer family;
- target zone;
- normalized failure identity.

The same text from different review runs is therefore not treated as the same unresolved attempt.

### Post-repair closure

Summary regeneration stores a closure record containing:

- before and after Summary;
- old and new review identity;
- reviewed CV version/hash and Summary hash;
- current versioned blocker when still failing;
- reviewer reason and failed criteria.

Successful attempt context remains associated with the successor CV/review even though the CV hash changed.

### UI and export behavior

- Genuine re-failure states that AI changed the Summary but it still failed review.
- `Edit Summary Manually` becomes the primary action.
- `Generate Another Summary` is secondary and explicitly token-spending.
- Stale review results hide old blockers and show `Recheck Updated CV`.
- Screening Lab and the authoritative Export page require a fresh review before export can be authorized.
- Manager + ATS timestamps now use current review completion time.

## Files Changed

Production files: 8 of maximum 12.

- `CV_Manager_React/src/types.ts`
- `CV_Manager_React/src/domain/reviewFreshness.ts`
- `CV_Manager_React/src/domain/screeningReview.ts`
- `CV_Manager_React/src/domain/screeningExportDecision.ts`
- `CV_Manager_React/src/domain/targetedRegenerationFeedback.ts`
- `CV_Manager_React/src/components/tabs/ScreeningLab.tsx`
- `CV_Manager_React/src/components/tabs/screeningReviewRepairPanels.tsx`
- `CV_Manager_React/src/components/tabs/Export.tsx`

Tests/config:

- `CV_Manager_React/scripts/smoke-post-repair-review-closure.mjs`
- `CV_Manager_React/scripts/smoke-review-freshness.mjs`
- `CV_Manager_React/scripts/smoke-blocker-version-binding.mjs`
- `CV_Manager_React/e2e/targeted-regeneration-runtime.spec.ts`
- `CV_Manager_React/package.json`

Governance:

- `docs/governance/tasks/P4-DIAG-FIX-001.md`
- `docs/governance/phase4/P4_DIAG_FIX_001_SUMMARY_REVIEW_CLOSURE_REPORT.md`
- `docs/governance/CURRENT_STATE.md`
- `docs/governance/MASTER_TASK_ROADMAP.md`
- `docs/governance/COMPLETION_REPORT.md`

## Automated Validation

Passed:

- `npm run smoke:post-repair-review-closure`
- `npm run smoke:review-freshness`
- `npm run smoke:blocker-version-binding`
- P4-PROMPT prompt/output contracts
- P4-VAL scoped validation and patch application
- P4-DIAG diagnostics and ordered trace
- targeted-regeneration runtime/UI/action/click/feedback/no-diff smokes
- all P4-AR repair proposal/orchestrator/executor/batch/loop/human-decision/copilot regressions
- all Phase 4 guided blocker/editing/explainability/decision-confidence smokes
- Product Acceptance, HR gate, Hiring Manager gate, no-AI, workflow, reviewer, review-role, and export-readiness smokes
- targeted regeneration browser E2E: 11/11
- Product Acceptance browser E2E: 13/13
- browser no-AI guard: 1/1
- `npm run build`
- `npm run test:system`

One implementation-introduced regression was found during validation: the presentation panel imported a domain type. It was replaced with a presentation-only view model, and the existing architecture guard passed again.

## Real-Page Acceptance

Scenario: Microsoft / Azure Solution Specialist / `Summary needs clearer role fit`.

- AI actions were explicitly enabled.
- `Regenerate Summary with AI` was clicked exactly once.
- No automatic retry occurred.
- Before Summary began `Microsoft ecosystem professional focused on enterprise AI adoption...`.
- After Summary began `Microsoft ecosystem professional supporting enterprise AI adoption...`.
- A new CV version was saved: `cv-mrixgp5z-jf6ua-regen-vifwcv-regen-uu3yyf-regen-ya4cev`.
- A new review ran: `review-h1cx3tgu` at `2026-07-16T12:43:26.853Z`.
- Reviewed CV hash: `h16ah7vz`.
- Reviewed Summary hash: `h1yurc4k`.
- Snapshot freshness: `fresh`.
- The updated Summary genuinely remained blocked by the current role-fit review.
- UI showed before/after, new reason, failed criteria, review ID/time/version/hash, and versioned blocker identity.
- Primary next action changed to `Edit Summary Manually`.
- `Generate Another Summary` remained an optional secondary token-spending action.
- The current CV was not presented as unattempted.

Canonical persistence revision after the explicitly authorized real-page acceptance was 98.

## Safety Confirmation

Unchanged:

- targeted regeneration prompts and output contracts;
- P4-VAL scoped-validation behavior;
- review quality rules and thresholds;
- unsupported-claim and evidence traceability safeguards;
- evidence selection;
- Repair Orchestrator route rules;
- export decision semantics;
- persistence architecture;
- unrelated UI and Phase 5.

## Remaining Limitations

- Review refresh is deterministic and local; there is no separate remote reviewer request to fail in the current architecture. The stale/failed contract and UI exist, but the real acceptance exercised genuine re-failure rather than a remote refresh error.
- The real Summary still failed because existing global gate/evidence/external-language issues remain. Those rules were intentionally not changed.

## Final Status

P4-DIAG-FIX-001 is DONE. No task was created or promoted. Phase 5 was not started.
