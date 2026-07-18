# P4-DIAG-FIX-001 - Summary Regeneration Review Closure Root-Cause Fix

Status: DONE

## Objective

Bind post-repair review freshness, blockers, Repair Orchestrator input, and UI closure to the new CV version/content hash so a genuinely re-failed Summary never appears as an unattempted regeneration loop.

## Selected Execution

- AI: Codex
- Model: GPT-5.6 Sol
- Reasoning: 高
- Reason: The confirmed failure crosses CV save identity, review freshness, blocker identity, attempt continuity, orchestration input, and rendered next action.
- Escalation trigger: Stop if implementation requires more than 12 production files or changes targeted prompts, scoped validation, review quality rules, export semantics, evidence selection, persistence architecture, canonical runtime data, or Phase 5.
- Routing note: `docs/governance/ai-routing/ROUTING_SUMMARY.md` remains absent. The explicit task-selected preferred model is the higher-priority routing decision.

## Dependencies

- P4-AR-009 through P4-AR-012: DONE
- P4-DIAG-001: DONE
- P4-VAL-001: DONE
- P4-PROMPT-001: DONE
- No unresolved architecture decision blocks this task.
- No other Task is READY.

## Forensic Trace

| # | Node | Module / Function | Input Identity | Output Identity | Reached | Fresh | Correct |
|---:|---|---|---|---|---|---|---|
| 1 | Initial CV | Canonical `cvVersions` | Microsoft JD | `cv-mrixgp5z-jf6ua-regen-vifwcv` / `h9nkhko` | Yes | Yes | Yes |
| 2 | Initial Summary | `tailoredCv.summary` | prior CV | SHA-256 `cce570bc...` | Yes | Yes | Yes |
| 3 | Initial review | `reviewSnapshot` | prior CV | `review-h8fgc4f` / 2026-07-15T15:54:53.049Z | Yes | Yes | Yes |
| 4 | Initial reviewed CV | `reviewSnapshot.contentHash` | prior review | `h9nkhko` | Yes | Yes | Yes |
| 5 | Initial Summary blocker | `reviewerPass` → Export Decision | prior evaluation | hiring-manager relevance / `Would interview: No` | Yes | Yes | Yes |
| 6 | Regeneration request | targeted command | prior CV/blocker/Brief/evidence | `targeted-regeneration-uu3yyf` | Yes | Yes | Yes |
| 7 | Raw response | automation result | Summary-only prompt | `object(summary)` | Yes | Yes | Yes |
| 8 | Normalized patch | strict targeted parser | raw response | Summary-only candidate | Yes | Yes | Yes |
| 9 | Scoped validation | P4-VAL-001 | candidate + prior CV | target 0; preserved 0; stale 0; new global 0 | Yes | Yes | Yes |
| 10 | CV save | `ScreeningLab::onSaveCv` → `App::saveCvVersion` | successful next version | canonical revision increment | Yes | Yes | Yes |
| 11 | New CV | targeted next version | prior CV + Summary patch | `...-regen-uu3yyf` / `h946vle` | Yes | Yes | Yes |
| 12 | New Summary | `tailoredCv.summary` | new CV | SHA-256 `e19b62a1...` | Yes | Yes | Yes |
| 13 | Review refresh | `createReviewSnapshot` + `evaluateScreeningReview` | new CV | deterministic local refresh | Yes | Yes | Yes |
| 14 | Review CV input | `evaluateScreeningReview` | new version/hash | `...-regen-uu3yyf` / `h946vle` | Yes | Yes | Yes |
| 15 | Review Summary input | hiring-manager review | new Summary | SHA-256 `e19b62a1...` | Yes | Yes | Yes |
| 16 | New review output | `createReviewSnapshot` | new evaluation | `review-hnratwu` / 2026-07-16T11:42:27.434Z | Yes | Yes | Yes |
| 17 | Checked-against identity | snapshot | new CV | hash `h946vle`; version ID not stored | Yes | Hash fresh | Incomplete |
| 18 | New Summary result | hiring-manager review | new Summary | `Would interview: No` / 5 rewrite items | Yes | Yes | Yes: genuine re-failure |
| 19 | Normalized blocker | Export Decision → UI card | new review result | label/index-derived ID and generic reason | Yes | Content fresh | No: not review/version bound |
| 20 | Orchestrator refresh | `orchestrateRepair` | new CV `h946vle` + new blockers | targeted Summary route | Yes | Yes | Yes |
| 21 | Remaining Issues input | `ExportDecisionPanel` | new decision/orchestration | fresh blocker strings, unversioned card IDs | Yes | Content fresh | Incomplete |
| 22 | Rendered state | review/repair panels | new blocker + filtered attempt | same unattempted `Regenerate Summary with AI` | Yes | Blocker fresh | No |

## Root Cause

Primary: `blocker-identity-not-versioned`.

The new review genuinely failed, but blocker/card identity did not include review run ID or reviewed CV hash. In parallel, `isAttemptForRequest` required the pre-repair attempt key to equal the new request key; the successful save changed the CV hash, so the UI discarded the attempt context. The fresh blocker was therefore rendered with a generic reason and the same regeneration CTA as though no repair had occurred.

Secondary contributors:

- `reviewSnapshot` stores content hash but not explicit reviewed CV version or Summary hash.
- Step 7 displays the old full-CV automation timestamp instead of the current review snapshot time.
- Genuine re-failure has no before/after/review metadata presentation or alternate primary action.

## Allowed Files

Production (planned 8; maximum 12):

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

## Forbidden Files

- Targeted regeneration prompts and output contracts
- P4-VAL-001 scoped-validation behavior
- Review quality rules and thresholds
- Evidence selection and Repair Orchestrator route rules
- Persistence architecture and canonical runtime data fixtures
- Unrelated UI layout
- Previous task history and Phase 5

## Acceptance Criteria

1. Review freshness is explicitly bound to current/reviewed CV version and content hash plus review run/time.
2. New snapshots record reviewed CV version/hash and reviewed Summary hash while preserving legacy snapshot compatibility.
3. Stale reviews cannot remain authoritative in Screening Lab or Export.
4. Post-repair review evaluates the saved next CV and records its exact version/hash/Summary hash.
5. Blocker identity includes review run, reviewed hash, review family, target zone, and normalized failure identity.
6. A successful Summary attempt remains associated with the successor CV/review instead of disappearing after the hash changes.
7. Genuine re-failure shows before/after Summary, new reason, review ID/time, reviewed version/hash, failed criteria, and an alternate primary action.
8. If Summary passes, the blocker disappears and normal progress advances.
9. If review is stale/failed, old blockers are not shown as current and `Recheck Updated CV` is offered without hidden AI.
10. The Manager + ATS step shows the current review completion time, not the old Writer run time.
11. Prompt, scoped validation, review rules, export checks, and routing rules are unchanged.
12. Real-page acceptance proves the latest reviewed hash equals the current CV hash and the UI no longer looks unattempted.

## Required Validation

- `npm run smoke:post-repair-review-closure`
- `npm run smoke:review-freshness`
- `npm run smoke:blocker-version-binding`
- P4-PROMPT, P4-VAL, targeted-regeneration, all P4-AR, Phase 4 UX, Product Acceptance, workflow, reviewer, and export-readiness regressions
- Browser targeted regeneration, Product Acceptance E2E, and browser no-AI guard
- `npm run build`
- `npm run test:system`
- One explicit real-page Microsoft Summary regeneration after implementation

## Completion Rule

Mark DONE only when automated and real-page evidence prove the new review is bound to the current version/hash and the Summary blocker either disappears or remains with new review metadata and an alternate next action. Otherwise mark `BLOCKED_AFTER_IMPLEMENTATION` and report the first incorrect node. Do not create or promote another task.

## Completion Evidence

- Primary root cause fixed: `blocker-identity-not-versioned`.
- Production files changed: 8 of the allowed maximum 12.
- Focused closure, freshness, and blocker-binding smokes: PASS.
- Targeted regeneration browser E2E: PASS (11/11), including pass, genuine re-failure, and stale-review branches.
- Product Acceptance browser E2E: PASS (13/13).
- Browser no-AI guard: PASS (1/1).
- Phase 4 UX, P4-AR, P4-DIAG, P4-VAL, P4-PROMPT, workflow, reviewer, and export regressions: PASS.
- `npm run build`: PASS.
- `npm run test:system`: PASS.
- Real Microsoft Summary regeneration ran exactly once. The Summary changed, a new CV version was saved, and a new review ran against that exact version/hash.
- The real new Summary genuinely failed role-fit review. The UI retained the attempt, showed before/after and exact new review identity, changed the primary action to `Edit Summary Manually`, and kept `Generate Another Summary` secondary.
- No next task was created or promoted. Phase 5 was not started.
- Detailed report: `docs/governance/phase4/P4_DIAG_FIX_001_SUMMARY_REVIEW_CLOSURE_REPORT.md`.
