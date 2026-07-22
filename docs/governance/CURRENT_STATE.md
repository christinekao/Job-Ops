# Current State

Status: Project Governance v1 current-state record.

## Phase 17 — Canonical Screening-to-Brief Contract Remediation

`P17-SCREENING-TO-BRIEF-CONTRACT-001` is DONE. `requirementMatrix` now owns
new deterministic Screening-to-Brief mapping, and legacy mapping-only analysis
is historical/read-only and cannot authorize Brief or Writer context. Brief
identity includes current analysis, requirement inventory, selection, evidence
safety, positioning, and JD inputs. No runtime-data migration, Git commit, or
push occurred; no task is READY.

## Phase 16 — Workflow Checklist Current-State Repair

`P16-WORKFLOW-CHECKLIST-STATE-001` is DONE. The Action Checklist now derives
current authorization from existing analysis, CV Brief, generated-CV, and
review-snapshot identities. Historical results remain readable but cannot mark
current workflow steps complete. LOW_FIT remains advisory when no hard block;
the user must explicitly apply truthful supported recommendations before Writer
generation. No task is READY.

## Phase 15 Remediation 2 — Screening Atomic Semantics

`P15R2-SCREENING-ATOMIC-SEMANTICS-001` is DONE. It preserved
P14/P15/P15R/P8 ownership while repairing formal constraints, pathway metadata,
atomic responsibility semantics, safe URL Prompt projection, and stale-result
authorization presentation.

## Phase 15 Remediation — Requirement Inventory Integrity

`P15R-REQUIREMENT-INVENTORY-INTEGRITY-001` is DONE. Existing owners now produce
reconstructed, atomic, deduplicated, source-backed requirements with stable
semantic IDs and complete lineage. Invalid source URLs warn without mutation;
new saves require plain listing URLs; safe Screening context has no hard
character truncation. P14/P15/P8 ownership is unchanged. No task is READY.

## Phase 15 — Canonical Screening Semantics and Context Remediation

`P15-SCREENING-SEMANTICS-001` is DONE. The runtime now has deterministic
stable-ID requirement inventory, exact-once matrix validation, separate JD
classification/candidate positioning, Education/Domain mapping, conservative
fragment normalization, P8-derived Fit/opportunity views, legacy staleness, and
one safe compact context projection. Microsoft Prompt size decreased 48.0%.
No follow-on task is READY.

## Phase 14 — Canonical Screening Schema Contract

`P14-SCREENING-SCHEMA-CONTRACT-001` is DONE.

- One runtime schema now owns Screening AI fields, inferred type, generated
  Prompt contract, strict Apply validation, descriptions, and schema hash.
- Screening run identity stores schema version/hash, Prompt version/hash, and
  input hash. Legacy or mismatched results remain readable but stale and cannot
  authorize Writer execution.
- Positioning Report, counts, persistence/UI metadata, and compatibility-only
  fields remain outside the AI schema and are derived/adapted by code.
- Drift guard, build, system constituents, server, Golden, Writer/Reviewer/
  Repair/Export, browser no-AI, and Product Acceptance regressions passed.
  No task is READY.

## Phase 13 — JD Apply and Save Feedback

`P13-JD-ACTION-FEEDBACK-001` is DONE.

- Parsed-JD Apply has distinct pending/success/failure feedback and an explicit
  unsaved indicator; Apply still does not persist or invoke AI.
- Save and Update success is shown only after the existing persistence owner
  confirms the server revision.
- Save failure and revision conflict preserve form edits, unsaved state, and
  existing recovery actions without false success.
- Duplicate submissions are blocked while Applying/Saving; success and error
  feedback use accessible live-status semantics.
- Focused, persistence/recovery, staleness, Golden, Writer/Reviewer/Repair/
  Export, build, system/server, JD Import, browser no-AI, and Product
  Acceptance regressions passed. No task is READY.

## Phase 12 — Canonical Raw JD Sanitization

`P12-JD-RAW-SANITIZE-001` is DONE.

- Microsoft canonical raw JD is deterministically rebuilt from extracted formal
  fields rather than the remote `jobDescription` payload.
- UI theme/configuration, hydration/application state, page identifiers,
  navigation/tracking configuration, and response JSON do not enter raw JD or
  the JD Parse Prompt.
- Unsafe Prompt input is blocked with explicit re-fetch/Manual Paste recovery;
  no automatic AI, Parse, Save, or Screening was introduced.
- Employer Insights, provenance, additional attributes, and remote/debug
  payload remain separate.
- Manual/URL equivalence, P7 staleness, P8 Golden ranking, generic extraction,
  persistence, system/server, and browser regressions passed. No task is READY.

## Phase 11 — JD Intake UX Remediation

`P11-JD-INTAKE-UX-001` is DONE.

- JD Intake uses the required seven semantic sections with aligned 3/2/1
  responsive short-field grids and paired textarea rows.
- Employer Insights is a full-width, collapsed-by-default informational
  disclosure with a compact two-column expanded view.
- Empty-state guidance is display-only; Date posted is readable when blurred
  while its canonical ISO value remains editable and unchanged.
- Role, Location, Overview, and Compensation retain complete values.
- P8/P9/P10 data, identity, hash, staleness, Screening, Golden, and no-AI
  contracts remain unchanged. No task is READY.

## Phase 10 — Cross-company JD Import Compatibility

`P10-JD-IMPORT-COMPAT-001` is DONE.

- Successful Fetch fills the original submitted Source URL immediately.
- Microsoft details and insights remain enhancements inside the shared
  SSRF-safe server pipeline.
- Previous-hire skills/roles are informational `employerInsights`, separate
  from formal Skills and qualifications and excluded from identity and Fit.
- JSON-LD, generic HTML, adapter fallback, unknown fields, and manual fallback
  remain supported. No task is READY.

## Phase 9 — Public JD URL Import

`P9-JD-IMPORT-001` is DONE.

- JD Intake now supports explicit public URL Fetch/Extract while fully preserving manual paste and the existing explicit Parse, Preview/Edit, and Save/Update flow.
- The existing server owns SSRF-safe fetch, DNS/IP and per-redirect validation, bounded responses/decompression, typed errors, JSON-LD extraction, Microsoft Careers handling, and generic HTML fallback.
- URL provenance is stored outside canonical JD content identity. Metadata-only changes do not stale; content changes retain the P7 downstream stale/Review/Export chain.
- P8 URL/manual GOLDEN-JD-003 equivalence and all four manual Golden scenarios pass with unchanged Fit/ranking.
- Focused, build, full system/server, browser no-AI, Product Acceptance, and documentation governance validation passed.
- Canonical runtime data was not modified. No task is READY.

## Phase 8 — Golden JD Match and CV Opportunity Validation

`P8-GOLDEN-001` is DONE.

- The existing Screening Analysis and Positioning Report now own one evidence-grounded requirement matrix, multidimensional Fit, Medium opportunity analysis, Low transition guidance, and deterministic ranking.
- Golden dataset `1.0.0` fixes four manual-paste scenarios spanning Strong, Viable Medium, and Low boundaries.
- `GOLDEN-JD-003` ranks first, `GOLDEN-JD-001` second, `GOLDEN-JD-002` third, and `GOLDEN-JD-004` fourth.
- Deterministic Golden validation is part of `test:system`; recorded-AI validation remains an explicit command and invokes no AI.
- Focused regressions, production build, full system/server regression, and documentation validation passed.
- Canonical runtime data was not modified. No task is READY.

## Phase 7 — Generated-CV Input Integrity

`P7-INTEGRITY-001` is DONE after repairing a P0 stale-input Export authorization path.

- A completed/applied Writer run no longer bypasses current CV Brief and source-data identity checks.
- Same-ID mutation of selected Evidence content or CV-use policy makes the existing generated CV stale.
- Screening Lab and Export continue to use the single `cvStaleReasonForJob()` boundary; no parallel rule was introduced.
- Existing CV content remains readable, but Export is blocked until explicit user-triggered regeneration and review.
- Focused P7, P5/P6, Backbone, Brief, Writer, Review, Export, Workflow, Product Acceptance, build, and full system validation passed.
- Canonical runtime data, persistence recovery, prompts, and AI execution behavior were not changed.
- No task is READY.

## Phase 5 — Backbone Correctness and Architecture Alignment

`P5-BACKBONE-001` is DONE after repairing the audit-confirmed in-scope acceptance failures.

- Scope: existing Experience Backbone lineage, Evidence safety, Job/CV selection, stale identity, review/export freshness, and supported persistence reliability.
- Boundary: no parallel Backbone/Evidence system, no hidden AI, no canonical runtime-data rewrite, and no future-architecture implementation.
- Retained completed work: stable acceptance fixture routing; explicit load/retry and sync/retry recovery; selected Job/CV preference reconciliation; immutable Applied/Archived JD policy; aggregate CV status; and canonical new-Job initialization.
- Completed repair: Writer Evidence policy enforcement, atomic Evidence batch task-envelope validation, shared traceability/CV-usable coverage consumers, complete Project task identity, and current-input stale Review/Export blocking.
- Validation: build, focused P5/regression smokes, and `test:system` all passed; `smoke:server` passed when run outside the sandbox because sandbox localhost bind returns `EPERM`.
- `P6-PERSIST-001` is DONE. It preserves a separate browser recovery copy after a failed revisioned save without automatic merge/overwrite; P5 remains DONE.
- Validation: focused recovery/storage and cross-flow smokes, build, and `test:system` including server persistence passed.
- No implementation task is READY.

## Documentation Governance Cleanup

`DOC-GOV-001` is DONE under explicit user authorization.

- Completed: 281 docs files inventoried and registered after excluding `.DS_Store`; `ARCH-CURRENT` is the only Primary architecture; Index, ADR index, relationship map, conflict log, and draft controls are in place.
- Boundary preserved: production code, runtime behavior, prompts, tests, and canonical runtime data were not modified.
- Unresolved owner decisions remain in `docs/draft/requires-review/` for Proposed ADR-004/005 and release-governance authority.
- `DOC-GOV-002` is DONE. It preserves P5's initial sandbox localhost failure as historical context and records the later isolated server smoke and complete system test as the final PASS state. P5 and P6 remain DONE; no task is READY.

## Phase 4.5 Alignment - Summary Generation, Review, and Repair

P4-ALIGN-001 is BLOCKED_AFTER_IMPLEMENTATION.

- The implementation added one authoritative Summary Quality Contract and connected it to initial Summary generation, targeted Summary regeneration, hiring-manager review, Review Snapshot persistence, and Repair Workflow display.
- Generator and reviewer now share criterion IDs: `summary-role-identity`, `summary-relevant-capability`, `summary-business-value`, `summary-evidence-grounding`, `summary-customer-context`, `summary-career-positioning`, and `summary-clarity`.
- Targeted Summary regeneration now receives `failedSummaryCriterionIds` and the Summary Quality Contract.
- Fit-risk-only outcomes are separated from Summary rewrite blockers; unsupported Azure/Sales/Presales/Architecture gaps remain visible as fit risk instead of being fabricated.
- Focused smokes, broad non-browser regressions, Product Acceptance E2E, browser no-AI, and build passed.
- `npm run test:system` passed until `smoke:server`, then failed only because sandbox blocked localhost listen with `EPERM`.
- Required targeted runtime E2E rerun after fixture update and real Azure Solution Specialist AI acceptance were not completed because localhost/browser escalation was rejected by Codex usage limit.
- Completion evidence: `docs/governance/phase4/P4_ALIGN_001_SUMMARY_PIPELINE_ALIGNMENT_REPORT.md`.

No task is READY. Phase 5 was not started.

## Phase 4.5 Final - Repair Workflow Consolidation

P4-FINAL-001 is DONE.

- Review Snapshot is the sole persisted owner of review freshness and the latest Summary repair review result.
- React attempt state now owns only in-flight/no-diff dispatch safety; the duplicate post-repair closure model was removed.
- Screening Lab presents one durable Issue → Fix → Review → Next workflow with one primary CTA.
- Genuine re-failure and pass outcomes survive refresh, remount, and job navigation until a newer review replaces them.
- Repair Orchestrator routing and authoritative Export Decision semantics remain unchanged.
- Focused smokes, targeted E2E 11/11, Product Acceptance E2E 13/13, browser no-AI 1/1, build, and `npm run test:system` passed.
- Completion evidence: `docs/governance/phase4/P4_FINAL_001_REPAIR_WORKFLOW_CONSOLIDATION_REPORT.md`.

No task is READY. Phase 5 was not started.

## Phase 4.5 Diagnostic Fix - Summary Regeneration Review Closure

P4-DIAG-FIX-001 is DONE.

- The confirmed failure was not a missing review run: the new Summary was saved and reviewed, but blocker/card identity was not bound to the new review run and reviewed CV hash.
- Review freshness now records current/reviewed CV version, CV content hash, Summary hash, review run ID, review time, and freshness status, with legacy snapshot compatibility.
- Stale review results are hidden and cannot authorize Screening Lab or Export; users receive an explicit local `Recheck Updated CV` action.
- Review blockers now carry stable review-run/hash/family/zone/failure identity.
- A successful regeneration attempt remains associated with its successor CV/review, so genuine re-failure no longer appears as an unattempted loop.
- Genuine re-failure shows before/after Summary, the new reason and failed criteria, review/version/hash identity, `Edit Summary Manually` as primary, and optional token-spending retry as secondary.
- The real Microsoft run saved `cv-mrixgp5z-jf6ua-regen-vifwcv-regen-uu3yyf-regen-ya4cev`, then reviewed it as `review-h1cx3tgu` against content hash `h16ah7vz` and Summary hash `h1yurc4k`.
- Automated validation passed: focused smokes, targeted E2E 11/11, Product Acceptance E2E 13/13, no-AI E2E 1/1, build, and `npm run test:system`.
- Completion evidence: `docs/governance/phase4/P4_DIAG_FIX_001_SUMMARY_REVIEW_CLOSURE_REPORT.md`.

No task is READY. Phase 5 was not started.

## Phase 4.5 Prompt Wave 1 - Targeted Regeneration Output Contract

P4-PROMPT-001 is DONE.

- Targeted regeneration no longer reuses the broad full-CV Writer prompt or full-CV normalizer.
- Summary, selected work-bullet, and recruiter-wording operations now use separate minimal-input, patch-only prompts and strict output contracts.
- Unknown keys, wrappers, markdown/prose, unauthorized paths, duplicate targets, unknown IDs, and invalid EvidenceCard IDs fail explicitly without CV mutation.
- The Summary prompt measured 29,596 characters versus the previous 120,676-character full Writer request, a 75% reduction.
- The single real Microsoft run returned exactly `object(summary)`, applied the Summary, created a new version/content hash, and preserved Header, Work Experience, Sidebar, and export-related content byte-for-byte by hash.
- Existing missing-email, duplicate-bullet, and missing-evidence blockers remain visible and export-blocking; validation rules were not weakened.
- All focused/regression smokes, targeted E2E 9/9, Product Acceptance E2E 13/13, no-AI E2E 1/1, build, and `npm run test:system` passed.
- Completion evidence: `docs/governance/phase4/P4_PROMPT_001_TARGETED_OUTPUT_CONTRACT_REPORT.md`.

No task is READY. Phase 5 was not started.

## Phase 4.5 Validation Wave 1 - Scoped Validation for Targeted Regeneration

P4-VAL-001 is DONE.

- Targeted regeneration now extracts and validates an authorized patch instead of treating the model response as a complete replacement CV.
- Apply-gate outcomes are separated into target failures, preserved-zone failures, stale/contract failures, pre-existing global issues, and new global issues.
- Unchanged missing email, unrelated duplicate bullets, and other pre-existing global blockers no longer reject a valid Summary or selected-bullet patch; they remain authoritative for export.
- New target/global failures, stale context, invalid contracts, and any raw prohibited-zone mutation still block application.
- Successful patches continue through the existing CV save/version/content-hash, affected review, Repair Orchestrator, CTA, and Export Decision boundaries.
- Deterministic and real-component browser fixtures passed. The real Microsoft run was correctly blocked for attempted `header.targetRole`, `workExperience`, and `export` mutations—not for the existing missing email—and left canonical data unchanged.
- All focused/regression smokes, targeted E2E 9/9, Product Acceptance E2E 13/13, no-AI E2E 1/1, build, and `npm run test:system` passed.
- Completion evidence: `docs/governance/phase4/P4_VAL_001_SCOPED_VALIDATION_REPORT.md`.

No task is READY. Phase 5 was not started.

## Phase 4.5 Diagnostics Wave 1 - Targeted Regeneration Validation Diagnostics

P4-DIAG-001 is DONE.

- Targeted regeneration validation now emits a structured 18-stage pass/fail/skipped trace without changing validation behavior.
- Plain-language blocked results identify exact fields/sentences/zones and confirm that the current CV was not changed.
- Advanced Details shows request/CV identity, normalized target candidate, validator/rule IDs, actual/expected values, EvidenceCard context, missing evidence, changed/preserved/ignored zones, stop reason, and supported recovery.
- The real Microsoft Summary run proved the primary failure was `screening-cv-output / required-fields / header.email`; additional failures were missing bullet evidence, duplicate bullet content, and affected export prerequisites.
- The raw candidate also changed prohibited `workExperience`; the scoped boundary did not apply it.
- Focused/regression smokes, targeted E2E 7/7, Product Acceptance E2E 13/13, no-AI E2E 1/1, build, and `npm run test:system` passed.
- Completion evidence: `docs/governance/phase4/P4_DIAG_001_VALIDATION_DIAGNOSTICS_REPORT.md`.

No Phase 5 task is READY.

## Phase 4.5 Wave 12 - Targeted Regeneration Feedback and No-Diff Terminal State

P4-AR-012 is DONE.

- Targeted regeneration now gives immediate feedback beside the clicked blocker, disables duplicate actions, and visibly distinguishes running from validating.
- A stable attempt identity covers blocker, strategy, target zones, CV content hash, effective Brief hash, and evidence context; timestamps do not affect identity.
- Same-context no-diff is terminal: the blocker remains, a guided manual action becomes primary, and explicit Retry is secondary with a token warning and attempt count.
- CV, Brief, evidence-context, or blocker changes clear the terminal identity; timestamp-only changes do not.
- The live Microsoft Screening Lab visibly ran one real AI request and ended with an explicit blocked validation result without CV mutation. Real-component mocked E2E covered the deterministic no-diff and context-change branches.
- All focused/regression smokes, targeted E2E 5/5, Product Acceptance E2E 13/13, no-AI E2E 1/1, build, and `npm run test:system` passed.
- Completion evidence: `docs/governance/phase4/P4_AR_012_REGENERATION_FEEDBACK_NO_DIFF_REPORT.md`.

No Phase 5 task is READY.

## Phase 4.5 Wave 11 - Targeted Regeneration Runtime Execution

P4-AR-011 is DONE.

- Replaced cosmetic targeted-regeneration timers with the actual explicit Codex automation lifecycle.
- Summary, work-bullet, and wording actions now dispatch one typed command through the existing automation endpoint only after the user enables AI actions and clicks.
- Request identity covers blockers, target zones, CV version/content hash, effective brief hash, and selected evidence IDs.
- Runtime output is normalized, validated, constrained to approved zones, reviewed, and checked for export readiness before save.
- Duplicate clicks, stale context, invalid output, no-diff, blocked execution, and runtime errors are explicit and never silently save.
- Real-page acceptance on Microsoft / Azure Solution Specialist observed actual running state and an explicit safe no-diff terminal result without CV mutation.
- All focused/regression smokes, 5-case targeted runtime E2E, 13-case Product Acceptance E2E, browser no-AI, build, and `npm run test:system` passed.
- Completion evidence: `docs/governance/phase4/P4_AR_011_TARGETED_REGENERATION_RUNTIME_REPORT.md`.

No Phase 5 task is READY.

## Phase 4.5 Wave 10 - Targeted Regeneration UI and Action Wiring

P4-AR-010 is DONE.

- Fixed the confirmed route-loss gap between Repair Orchestrator targeted-regeneration output and user-facing Remaining Issues cards.
- Added a user-facing repair action model for safe repair, AI proposal, targeted regeneration, human input, human decision, and unsupported routes.
- Remaining Issues cards now show `Regenerate Summary with AI`, `Regenerate Work Bullets with AI`, or `Generate Cleaner CV Wording` when the Orchestrator route is targeted regeneration.
- Missing email without trusted data shows `Enter Email`.
- Duplicate contact/email raw blockers still consolidate into one user-facing card.
- Targeted regeneration no longer requires a direct DOM field target before showing an AI regeneration action.
- Running and validating states are visible before the existing `run-targeted-regeneration` command dispatch.
- No-diff targeted regeneration results show explicit retry/manual options.
- The one-primary-CTA rule is preserved: Repair Orchestration remains the only primary CTA; card actions are secondary.
- No hidden AI call, review-rule change, export-decision change, runtime prompt change, runtime data change, persistence redesign, or Phase 5 task was introduced.
- Validation passed: focused targeted-regeneration UI/action smokes, P4-AR regressions, Phase 4 smokes, Product Acceptance smoke, browser Product Acceptance E2E, browser no-AI guard, workflow, reviewer, export-readiness, build, and `npm run test:system`.

No Phase 5 task is READY.

## Phase 4.5 Wave 9 - Repair Escalation and Targeted Regeneration

P4-AR-009 is DONE.

- Added explicit Repair Orchestrator escalation routes for targeted regeneration and human input.
- Summary role-fit blockers now route to targeted summary regeneration.
- Broad weak-achievement and recruiter-wording blockers now route to targeted section regeneration.
- Exact weak bullet and exact external wording blockers remain approval-required proposal routes.
- Missing email without a trusted value routes to human input; trusted missing email remains safe-auto.
- Duplicate contact/email blockers consolidate into one user-facing blocker card while raw diagnostics remain in Advanced Details.
- Targeted regeneration validates CV version ID, CV content hash, effective CV brief hash, and selected evidence IDs before saving.
- Successful regeneration creates a new CV version/hash through the existing `ScreeningLab.tsx` save boundary.
- Stale or invalid regeneration preserves the current CV.
- No hidden AI call, automatic AI execution, review-rule change, export-decision change, runtime prompt change, runtime data change, persistence redesign, or Phase 5 task was introduced.
- Validation passed: focused targeted-regeneration and escalation smokes, proposal/safe-repair/batch/loop/human-decision regressions, Phase 4 smokes, Product Acceptance smoke, browser Product Acceptance E2E, browser no-AI guard, workflow, reviewer, export-readiness, build, and `npm run test:system`.

No Phase 5 task is READY.

## Phase 4.5 Wave 7 - Repair Proposal UI Integration

P4-AR-007 is DONE.

- `Review N AI Suggestions` now opens actual deterministic proposal cards instead of a single blocker/manual card.
- Proposal cards show current content, AI suggestion, reason, expected impact, evidence safety, stale state, and accept/reject controls.
- Accepted/rejected/undecided/stale proposal counts are visible.
- `Apply N Accepted Changes` enables only when accepted non-stale proposals exist.
- Applying accepted proposals uses the existing `ScreeningLab.tsx` CV save boundary, creates one new CV version/content hash, and requests workflow/review/repair/export refresh.
- Rejected proposals do not mutate CV content.
- Disabled/no-apply states now show explicit reasons and do not imply that AI failed before any apply action.
- Deterministic Product Acceptance fixture now validates proposal batch review and partial application without invoking real AI.
- Validation passed: focused proposal UI smoke, P4-AR regressions, Phase 4 smokes, Product Acceptance smoke, browser Product Acceptance E2E, browser no-AI guard, workflow, reviewer, export-readiness, build, and `npm run test:system`.

No Phase 5 task is READY.

## Phase 4.5 Wave 8 - AI Suggestion Generation State

P4-AR-008 is DONE.

- Added an explicit proposal-generation lifecycle: idle, ready, running, success, empty, error, and stale.
- `Generate N AI Suggestions` now appears when proposal candidates exist but no suggestions have been generated yet.
- `No valid AI suggestions were produced for the current CV.` appears only after a generation attempt completes with zero valid suggestions.
- Running state shows `Generating suggestions…` and disables duplicate clicks.
- Successful generation shows `Review N AI Suggestions`; proposal cards open after Review.
- Empty/error states show `Retry AI Suggestions`.
- Stale generated suggestions show `Generate New AI Suggestions`.
- Candidate count and generated suggestion count are displayed separately.
- Stale detection uses content hash, so timestamp-only changes do not stale generated suggestions.
- No CV mutation, proposal application, hidden AI call, review-rule change, export-decision change, runtime prompt change, runtime data change, persistence redesign, or Phase 5 task was introduced.
- Validation passed: focused proposal generation state smoke, proposal UI integration smoke, P4-AR regressions, Phase 4 smokes, Product Acceptance smoke, browser Product Acceptance E2E, browser no-AI guard, workflow, reviewer, export-readiness, build, and `npm run test:system`.

No Phase 5 task is READY.

## Phase 4.5 Wave 6 - AI Resume Copilot Target Completion

P4-AR-006 is DONE.

- Added Human Decision Layer for questions AI must not answer automatically.
- Human-decision prompts include exact question, why AI cannot decide, options, evidence IDs, and downstream impact.
- User-authorized deterministic human decisions can create a new CV version; missing user choice and stale content are rejected.
- The Repair Orchestration primary CTA now says `Fix X Items with AI` for safe-auto routes and can execute safe repairs through the existing `ScreeningLab.tsx` CV save boundary.
- Product Acceptance fixture now validates a visible safe-auto `Fix with AI` path without invoking real AI.
- Final target report: `docs/governance/phase4/AI_RESUME_COPILOT_TARGET_COMPLETION_REPORT.md`.
- Validation passed: focused P4-AR smokes, browser Product Acceptance, browser no-AI guard, build, and `npm run test:system`.

No Phase 5 task is READY.

## Phase 4.5 Wave 5 - AI Resume Copilot Bounded Repair Session

P4-AR-005 is DONE.

- Added a bounded repair session coordinator for explicit user-started repair sessions.
- Default max loop count is 3.
- Stop reasons include export-ready, only-human-or-unsupported, no-content-diff, repeated-blockers, max-loop-reached, budget-reached, and unsafe-stop.
- The coordinator records affected review families for scoped review refresh and never calls hidden AI.
- Deterministic validation covers convergence to export-ready, partial convergence ending in human decision, no-content-diff, repeated blocker set, and max-loop reached.
- No review-rule changes, export-decision changes, runtime prompt changes, runtime data changes, persistence redesign, or human-decision application was introduced.
- Validation passed: `npm run smoke:repair-loop`, `npm run smoke:safe-repair-executor`, `npm run smoke:batch-repair-proposals`, and `npm run build`.

P4-AR-006 is DONE.

## Phase 4.5 Wave 4 - AI Resume Copilot Batch Proposal Application

P4-AR-004 is DONE.

- Added batch proposal review/application domain layer for accepted approval-required proposals.
- Batch state supports accepted, rejected, and manual-edit statuses.
- Application requires matching CV version ID and content hash and rejects stale proposal batches.
- Accepted proposals apply in a single new CV version where safe; rejected proposals do not mutate CV content.
- Summary, work-bullet, and deterministic email proposal targets are supported by the batch layer.
- Evidence IDs are preserved for applied work-bullet proposals; stale review snapshots are cleared only after content change.
- No AI invocation, safe repair behavior change, review-loop behavior, human-decision application, export-decision change, runtime prompt change, runtime data change, or persistence redesign was introduced.
- Validation passed: `npm run smoke:batch-repair-proposals`, `npm run smoke:repair-proposal`, and `npm run build`.

P4-AR-005 is DONE. P4-AR-006 is DONE.

## Phase 4.5 Wave 3 - AI Resume Copilot Safe Repair Executor

P4-AR-003 is DONE.

- Added deterministic Safe Repair Executor for current, non-stale `safe-auto` Repair Orchestrator classifications.
- Executor requires exact CV version ID and content hash match before applying repairs.
- Supported safe repairs in this wave: duplicate summary sentence removal, duplicate work-bullet sentence removal, and trusted missing email fill.
- Executor mutates only allowed zones, preserves prohibited zones, clears stale review snapshots on content change, creates a new CV version, records applied repair IDs, blocker IDs, prior/resulting hashes, changed zones, preserved zones, and evidence IDs.
- Explicit rejection states are returned for stale orchestration output, duplicate execution on the same CV hash/plan, blocked unsafe conditions, and no-content-diff.
- No AI invocation, proposal application, review loop, human-decision handling, export-decision change, runtime prompt change, runtime data change, or persistence redesign was introduced.
- Validation passed: `npm run smoke:safe-repair-executor`, `npm run smoke:repair-orchestrator`, and `npm run build`.

P4-AR-004 is DONE. P4-AR-005 is DONE. P4-AR-006 is DONE.

## 2026-07-13 Screening Automation Model Fix

- Root `.env` and `.env.example` no longer select unsupported `gpt-5-mini`; the configured fallback is `gpt-5.5-mini`.
- `serverConfig.cjs` preserves valid `CODEX_MODEL` overrides while normalizing missing or legacy `gpt-5-mini` values to the explicit fallback.
- Automation failure summaries now prefer the final non-warning stderr lines, so personality/plugin warnings do not hide the fatal exit reason.
- Focused config/automation tests, build, and `npm run test:system` pass. Canonical runtime data was not modified.

## Phase 4.5 Wave 1 - Autonomous Repair Proposal Engine

P4-AR-001 is DONE.

- Supported repairable blockers now open `Preview AI Repair` before manual editing.
- Proposal preview shows current content, suggested content, reason, affected section, risk, confidence, and expected impact.
- `Accept` and `Reject` record proposal state only; they do not modify CV content.
- `Edit manually` preserves the existing guided editing target and action-pipeline path.
- Supported proposal types are summary wording, work bullet wording, external wording, weak wording, duplicate wording, and deterministic missing email.
- Unsupported judgement-heavy blockers do not produce unsafe proposals.
- Review rules, repair executor, workflow, export decision, runtime prompts, AI routing, evidence rules, runtime data, persistence, and proposal application were not modified.
- Validation passed: repair proposal smoke, Phase 4 focused smokes, browser Product Acceptance E2E, browser no-AI guard, workflow, reviewer, export-readiness, build, and `npm run test:system` after approved localhost reruns.

No Phase 4.5 Wave 2 task is READY.

## Phase 4.5 Wave 2 - Repair Orchestrator

P4-AR-002 is DONE.

- Added one authoritative Repair Orchestrator for blocker classification.
- Every blocker resolves to exactly one route: safe automatic repair candidate, approval-required AI proposal, human-only decision, or unsupported/no safe repair.
- Orchestration output includes CV version ID, CV content hash, evidence IDs, risk, confidence, allowed mutation zones, prohibited mutation zones, approval flags, capability flags, and unsupported reason where relevant.
- The Review / Repair / Export UI now shows route counts in plain language and one orchestrator-derived next action.
- Raw route codes remain in Advanced Details, not primary UI.
- Approval-required routes preserve existing P4-AR-001 proposal preview behavior.
- Safe-auto application is not implemented; safe-auto CTA is a disabled placeholder.
- Changed CV content hash makes classifications stale; timestamp-only changes do not.
- Review rules, repair executor behavior, repair planner rules, workflow, export decision rules, Writer, JD analysis, runtime prompts, AI routing, evidence selection, runtime data, canonical CV data, persistence, proposal application, and Phase 5 plans were not modified.
- Validation passed: repair orchestrator smoke, product acceptance smokes, Phase 4 smokes, browser Product Acceptance E2E, browser no-AI guard, workflow, reviewer, export-readiness, build, and `npm run test:system` after approved localhost reruns.

No Phase 4.5 Wave 3 task is READY.

## Phase 4 Wave 1 - Guided Blocker Resolution

P4-UX-001 is DONE.

- Final review/export blockers now render as guided product-experience cards instead of a raw blocker list.
- Blocked export copy now leads with `Still Needs Attention`, remaining item count, estimated effort, and progress.
- Each blocker card shows a human-readable title, plain-language explanation, location, target section, difficulty, estimated effort, and `Jump to Fix`.
- Raw reviewer/export terminology remains available in `Advanced Details`, not as the primary blocker language.
- `Jump to Fix` uses the existing `open-manual-editor` action pipeline command.
- Review rules, repair planner, repair executor, workflow, export decision, prompts, runtime data, and persistence were not modified.
- Validation passed: focused Phase 4 UX smoke, Phase 3 presentation/action regressions, workflow, repair, reviewer, review-role, export-readiness, build, and `npm run test:system` after approved localhost rerun.

No Phase 4 Wave 2 task is READY.

## Phase 4 Wave 2 - Guided Editing

P4-UX-002 is DONE.

- `Jump to Fix` now dispatches `open-guided-editor` through the existing action pipeline.
- Guided blocker context is preserved through `BlockerEditTarget` and `GuidedEditContext`.
- CV Studio opens edit mode, scrolls the target into view, focuses the field when possible, and applies a temporary highlight.
- Supported targets include contact/email, summary, work-experience bullets, skills, and visible work-depth fallbacks.
- Unsupported export-only blockers do not show `Jump to Fix`; they show an explicit manual or AI-assisted review fallback.
- Saving guided edits uses the existing CV save boundary and does not trigger AI, generation, reviewer-rule changes, repair-rule changes, export-rule changes, runtime-data migration, or persistence changes.
- Validation passed: focused guided-editing and guided-blocker smokes, Phase 3 action-pipeline smoke, workflow, reviewer, review-role, export-readiness, build, and `npm run test:system` after approved localhost rerun.

## Phase 4 Wave 3 - AI Explainability

P4-UX-003 is DONE.

- Repair results now explain what AI changed, what AI did not change, why, and the next recommended step.
- Review summaries now use plain-language user-facing explanations as the primary UI instead of reviewer terminology.
- Raw reviewer diagnostics remain available under `Advanced Details`.
- The wave added focused AI explainability smoke coverage and preserved Phase 4 Wave 1/2 behavior.
- Review rules, repair planner, repair executor, action pipeline, workflow, export decision, writer, JD analysis, runtime prompts, runtime data, and persistence were not modified.
- Validation passed: Phase 4 guided blocker smoke, Phase 4 guided editing smoke, Phase 4 AI explainability smoke, Phase 3 action-pipeline smoke, workflow, reviewer, review-role, export-readiness, build, and `npm run test:system` after approved localhost execution.

## Phase 4 Wave 4 - Decision Confidence and Export Readiness

P4-UX-004 is DONE.

- Final export decision presentation now includes CV readiness, confidence level, blocking issue count, warning count, manual review count, and exactly one recommendation.
- Ready export state explains that export is available because no blocking issues remain.
- Blocked export state explains how many blocking issues remain.
- Warnings and manual review items are visually separated from blockers and do not change export readiness.
- Confidence is categorical only: `High`, `Medium`, `Low`, or `Not Available`, derived from existing supplied export decision data.
- Reviewer terminology remains available under `Advanced Details`, not as primary UI.
- Review rules, repair planner, repair executor, workflow, action pipeline, export decision, writer, JD analysis, runtime prompts, runtime data, persistence, and architecture were not modified.
- Validation passed: Phase 4 decision-confidence smoke, Phase 4 Wave 1/2/3 smokes, Phase 3 action-pipeline smoke, workflow, reviewer, review-role, export-readiness, build, and `npm run test:system` after approved localhost execution.

No Phase 5 task is READY.

## Product QA - Deterministic Acceptance Test

P4-QA-001 is DONE.

- Added deterministic Product Acceptance Test coverage for happy path, missing contact, weak bullet, unsupported claim, and warning-only scenarios.
- Added deterministic HR Review Gate with rule-based pass/score/blocker/warning output.
- Added deterministic Hiring Manager Review Gate with evidence-based pass/score/blocker/warning output.
- Added no-AI safeguards proving Codex CLI, OpenAI/model endpoints, and AI-running automation state are blocked during product acceptance.
- Added generated/export-ready CV fixture at `CV_Manager_React/scripts/product-acceptance/fixtures/generated/export-ready-cv.json`.
- Runtime prompts, model selection, real automation behavior, evidence source data, canonical runtime CV data, persistence architecture, and production review rules were not modified.
- Validation passed: product acceptance, HR gate, Hiring Manager gate, no-AI smoke, Phase 4 Wave 1-4 smokes, workflow, reviewer, export-readiness, build, and `npm run test:system` after approved localhost execution.

No Phase 5 task is READY.

## Product QA - Browser E2E Product Acceptance

P4-QA-002 is DONE.

- Added Playwright browser Product Acceptance E2E coverage using an explicit test-only fixture mode: `?e2e=product-acceptance`.
- Browser scenarios A-F pass: happy path, missing contact, weak bullet, unsupported claim, warning-only, and no-safe-local-fix fallback.
- Browser final CV JSON is serialized from the UI and validated by deterministic HR and Hiring Manager gates.
- Browser no-AI guard blocks model/API/automation requests and verifies the fixture never enters AI-running, queued, or Codex-running state.
- Playwright failure artifacts are configured: screenshots, traces, videos, plus console/network failure capture.
- Runtime prompts, model selection, real AI behavior, review rules, repair rules, evidence data, canonical runtime CV data, persistence architecture, and Phase 5 plans were not modified.
- Validation passed: browser Product Acceptance E2E, headed browser Product Acceptance E2E, browser no-AI E2E, deterministic Product QA gates, Phase 4 smokes, workflow, reviewer, export-readiness, build, and `npm run test:system` after approved localhost rerun.

No Phase 5 task is READY.

## Phase 4 UX Simplification - First-Time User IA

P4-UX-005 is DONE.

- Reviewer / Repair / Export presentation now follows a simpler first-time-user hierarchy: Overall Status, Your Next Step, Repair Progress, Remaining Issues, Readiness and Export, and Advanced Details.
- The active reviewer/export screen no longer shows separate visible Repair Plan and competing Primary CTA stacks.
- First unresolved blocker is surfaced as `Your Next Step`.
- Generic `Jump to Fix` was replaced by target-specific copy where possible in P4-UX-005; P4-AR-001 now supersedes supported repairable blockers with `Preview AI Repair`.
- Unknown targets show an explicit manual-review fallback with disabled `Review Manual Decision`.
- Internal reviewer diagnostics remain available under `Advanced Details`.
- Runtime prompts, review rules, repair rules, export decision rules, runtime data, persistence, and AI invocation behavior were not modified.
- Validation passed: Phase 4 focused smokes, browser Product Acceptance E2E, browser no-AI guard, workflow, reviewer, export-readiness, build, and `npm run test:system` after approved localhost rerun.

No Phase 5 task is READY.

## Confirmed Project Goal

The active React app aims to produce one JD-specific, evidence-backed, screening-ready CV, with local review and optional explicit AI/Codex automation.

Evidence:

- `CV_Manager_React/docs/SPEC.md` Product Purpose and Core Product Promise.
- `CV_Manager_React/docs/FLOW.md` Main Workflow.
- `CV_Manager_React/docs/ARCHITECTURE.md` System Objective and architectural principles.

Confidence: Confirmed.

## Actual Current Process

| Stage | Actual Owner | Input | Output | Confidence |
|---|---|---|---|---|
| Career Evidence readiness | `evidenceIntegrityReview` | `AppData.evidenceCards` | readiness checks | Confirmed |
| JD Analysis | `buildScreeningAnalysisPrompt`, automation/manual apply in `ScreeningLab.tsx` | selected `JobApplication`, `AppData` | `job.screeningAnalysis`, run summary | Confirmed |
| Terms + Gaps | `terminologyAndGapReview` | `job.screeningAnalysis`, selected evidence | readiness/checks | Confirmed |
| CV Brief | `buildCvBrief` | analysis + selected evidence | `CvBrief` | Confirmed |
| Writer Input | `buildScreeningCvPrompt` | `AppData`, selected job, optional `fixContext` | JSON-only prompt | Confirmed |
| Writer Output Apply | `applyScreeningCvResult` in `ScreeningLab.tsx` | parsed output | `CvVersion` | Confirmed |
| Gate / Manager / Reviewer / Export | `screeningReview.ts` functions | job, CV, evidence | local review results and snapshot | Confirmed |
| Repair | `classifyRepairActions` plus local fix functions in `ScreeningLab.tsx` | failed checks / active CV | patch to current CV | Confirmed |
| Persistence | `src/storage.ts`, `server.cjs`, `storageService.cjs` | `AppData` and revision | canonical snapshot + mirrors | Confirmed |
| Automation | `automationService.cjs`, `useAutomationPolling.ts`, `ScreeningLab.tsx` | prompt | completed/failed job and result apply | Confirmed |

## Confirmed Data State

- `CV_Manager_React/data/app_data.json` revision: `24`
- Saved at: `2026-07-11T12:56:50.810Z`
- Data counts: 7 raw sources, 42 skill inferences, 36 domain knowledge records, 69 evidence cards, 42 STAR stories, 17 high-compensation signals, 2 jobs, 3 prompt templates, 59 CV versions.

Confidence: Confirmed.

## Confirmed Current CV Artifacts

ADR-001 establishes that this project intentionally has no canonical CV. Quality is evaluated per JD using `QUALITY_SPEC.md`, `PROJECT_RULES.md`, contracts, and source-grounded evidence.

| Artifact group | Observed role | Current output | Canonical quality reference | Confidence |
|---|---|---:|---:|---|
| `CV_Manager_React/data/app_data.json` | Canonical runtime snapshot containing generated `CvVersion` records | Yes | No | Confirmed |
| `CV_Manager_React/data/cv_versions.json` | Split mirror of generated CV versions | Yes, mirror only | No | Confirmed |
| `CV/*.pdf` | Historical/general/role-specific CV documents | No runtime status established | No | Confirmed |
| `CV_Manager_React/source_material/*` | Raw and normalized CV/work-history source material | No | No | Confirmed |
| `my work/*.md` and subfolders | Work-history/supporting material | No | No | Confirmed |

Individual filenames do not establish ideal status. Historical and generated artifacts may support traceability or comparison, but no CV document is an acceptance oracle.

## Confirmed High-Risk Components

| Component | Risk | Evidence | Confidence |
|---|---|---|---|
| `ScreeningLab.tsx` | Orchestration, automation apply, local fixes, panel composition, and some messaging are concentrated in one file | `ARCHITECTURE.md` and imports/functions in file | Confirmed |
| `promptBuilders.ts` | Runtime prompt schemas and quality rules are embedded in code rather than external contracts | Prompt functions contain JSON schemas and CV quality rules | Confirmed |
| `buildCvBrief` boundary | Brief decides must-show evidence IDs and claims to avoid; downstream Writer depends on this | `src/data/selection.ts` | Confirmed |
| `reviewSnapshot` binding | Snapshot validity depends on `cvUpdatedAt === activeCv.updatedAt`; edge risk should be tested separately | `ScreeningLab.tsx` | Possible |
| Repair boundary | Classification exists in domain, but local patch logic remains in UI | `screeningReview.ts`, `ScreeningLab.tsx`, `ARCHITECTURE.md` | Confirmed |

## TASK-003 Trace Baseline

The persisted pair `cv-mr4q83lz-cidl0` / `jd-mpy6kou0-ctiw9` is the first bounded quality trace. Identity and selected IDs are valid, but the current CV Brief post-dates the CV generation record. The current output has 14 work bullets: 9 cite globally valid evidence and 5 have no evidence IDs; 3 cited IDs are outside the recorded generation context. See `CV_TRACEABILITY.md` and `CV_GAP_ANALYSIS.md`.

TASK-004 added `npm run smoke:cv-brief` as the reproducible CV Brief fixture baseline. It covers required fields, missing analysis, visible grounded evidence filtering, claim suppression, and the explicit empty must-show policy.

TASK-005 added `npm run smoke:writer-input`, protecting the meaningful Screening CV prompt contract without freezing full prompt wording.

TASK-006 added `validateScreeningCvOutput` before Screening CV apply. Incomplete normalized output cannot replace the current CV or receive a review snapshot.

TASK-007 extracted local no-token content repair into `src/domain/localReviewerFix.ts`; `ScreeningLab.tsx` now retains orchestration, persistence, review, and UI messaging.

TASK-008 added `npm run smoke:repair-regression`, covering failed-area repair, green header/sidebar preservation, stable evidence IDs, and no invented metrics or claims.

ADR-002 selects dual Review Snapshot identity: timestamp identity remains for ordering/history/UI, while `contentHash` supports deduplication, change detection, regression comparison, and cache keys. Legacy null hashes must be preserved and enriched lazily.

TASK-009 implemented ADR-002. New review snapshots contain `snapshotId`, `updatedAt`, and CV `contentHash`; timestamp-only CV updates keep reviews valid, content changes invalidate hash-bound reviews, and legacy snapshots remain valid and gain missing identity lazily on a safe read/write path. No full data migration was performed.

ADR-003 assigns active production prompt construction to `src/promptBuilders.ts`. `data/prompt_templates.json` is editable UX metadata, reusable reference/seed content, and user-facing saved template data; it does not control production screening automation prompts. Current ScreeningLab wiring is consistent with this model.

TASK-011 added `npm run smoke:export-readiness`, covering an export-ready fixture plus contact, text-layer/composed-content, visible work-depth, and manager-relevance separation failures. All focused regressions and `npm run test:system` passed.

TASK-012 completed under ADR-004/ADR-005. Root `AGENTS.md` is now the single concise AI entry point and references detailed governance under `docs/governance/`; `CLAUDE.md` is a compatibility pointer only. Legacy CV Manager files are classified as Legacy / Archive / Migration and are absent from active governance rules. Governance v1 tasks are archived.

## Phase 2 Wave 1 - Context Integrity

Phase 2 Wave 1 implemented ADR-006/ADR-007:

- `resolveEffectiveCvBrief` is the single Brief resolution rule for UI readiness, Writer input, hashing, apply, and GenerationContext.
- Brief identity excludes `generatedAt`; legacy Brief/source hashes remain compatible.
- Selected records preserve selected-ID order.
- Effective evidence priority is must-show evidence followed by remaining selected evidence.
- Writer receives a bounded context projection plus selection-quality diagnostics.
- Current two-JD projected context ratios are 45.2% and 44.9% of the legacy JSON payload.
- `CareerProfile.contact` is the optional structured contact owner; existing data remains valid and no migration ran.
- `npm run smoke:wave1-context` protects these behaviors.

## Phase 2 Wave 2 - Prepared Implementation Tasks

Phase 2 Wave 2 is partially implemented.

- `docs/governance/tasks/P2-007.md` is DONE.
- `docs/governance/tasks/P2-008.md` is DONE.
- `docs/governance/tasks/P2-009.md` is DONE.
- `docs/governance/tasks/P2-010.md` is DONE.
- `docs/governance/tasks/P2-011.md` is DONE.
- Preparation evidence: `docs/governance/phase2/Wave2_READY_PREPARATION_REPORT.md`.
- P2-007 added EvidenceCard-only bullet evidence ID namespace validation in `CV_Manager_React/src/domain/screeningCvOutput.ts` and focused fixture coverage in `CV_Manager_React/scripts/smoke-writer-output.mjs`.
- P2-008 added trace coverage validation for visible work bullets and exact duplicate detection for summary sentences and work bullet text in `CV_Manager_React/src/domain/screeningCvOutput.ts`.
- P2-009 added apply-boundary contact email validation in `CV_Manager_React/src/domain/screeningCvOutput.ts` and explicit `Contact email` export readiness reporting in `CV_Manager_React/src/domain/screeningReview.ts`.
- P2-010 separated honest omitted JD fit gaps from visible-CV integrity failures in `CV_Manager_React/src/domain/screeningReview.ts` while preserving visible unsupported-claim failure.
- P2-011 changed Unknown missing keyword support in `CV_Manager_React/src/domain/screeningReview.ts` so Unknown keywords require selected EvidenceCard support before entering `supportedMissingKeywords`.

No runtime prompt, runtime data, Golden Evaluation, or later Wave 2 implementation task was executed during P2-011.

P2-011 readiness note: `docs/governance/phase2/IMPLEMENTATION_PRIORITY_MATRIX.md` is referenced by Wave 2 tasks but is not present in the repository. No exact replacement file was found. This is not a P2-011 blocker because the Unknown keyword support issue is directly evidenced by `docs/governance/phase2/ROOT_CAUSE_ANALYSIS.md`, `docs/governance/phase2/CV_PIPELINE_AUDIT.md`, `docs/governance/phase2/Phase2_Epics.md`, and `CV_Manager_React/src/domain/screeningReview.ts`.

## Phase 3 Wave 1 - Bounded Repair and CTA

Phase 3 Wave 1 is complete.

- `docs/governance/tasks/P3-CONFIG-001.md` is `DONE`.
- `docs/governance/tasks/P3-001.md` is `DONE`.
- `CV_Manager_React/serverConfig.cjs` now preserves explicit env values when loading `.env`, so local `.env` no longer overrides smoke fixtures or explicit runtime env.
- `CV_Manager_React/scripts/smoke-server-config.mjs` now disables `.env` loading for the config fixture, controls relevant env values, restores modified `process.env` keys, and verifies missing/unsupported model fallback.
- `CV_Manager_React/src/domain/screeningRepairPlan.ts` now defines typed repair planning with CV content identity, failed check IDs, owners, severity, target zones, preserved zones, repair mode, and approval boundary.
- `CV_Manager_React/src/domain/localReviewerFix.ts` now requires a repair plan and returns explicit `success`, `blocked`, or `no-safe-fix` status with changed zones, preserved zones, and remaining blockers.
- Safe local content repair is limited to `workExperience` and preserves header, sidebar, and summary zones.
- `CV_Manager_React/src/domain/screeningWorkflow.ts` now exposes centralized primary CTA resolution.
- `CV_Manager_React/src/components/tabs/ScreeningLab.tsx` uses the bounded repair plan for safe local repair availability and centralized next-step copy.
- `CV_Manager_React/scripts/smoke-phase3-wave1.mjs` protects Phase 3 Wave 1 behavior.
- Focused tests, build, and `npm run test:system` passed.

No runtime prompts, runtime data, persistence architecture, Phase 2 task files, Golden Evaluation artifacts, or Phase 3 Wave 2 work were modified during P3-001/P3-CONFIG-001.

## Architecture Cleanup Wave 1 - Authoritative Export Decision

P3-ARCH-001 is DONE.

- `src/domain/screeningExportDecision.ts` now provides a domain Review Evaluation composed from the existing gate, manager, reviewer, and export checks, plus one Export Decision.
- `ScreeningLab.tsx` and `Export.tsx` consume the same decision; neither UI component independently defines whether export is enabled.
- Current Screening Analysis is accepted as an export decision context, consistent with the active screening workflow; valid legacy Fit Review remains supported.
- `cvQualityChecks` remains visible UI diagnostics but no longer controls the Export page action boundary.
- Timestamp-only changes preserve export content identity; changed CV content produces a new identity. Existing ADR-002 snapshot behavior remains unchanged.
- `npm run smoke:phase3-architecture-wave1`, all required focused regressions, build, and `npm run test:system` passed.

No runtime prompts, runtime data, persistence architecture, Phase 2 safeguards, repair executor behavior, or further architecture wave work was modified.

## Architecture Cleanup Wave 2 - Presentation Boundary Extraction

P3-ARCH-002 is DONE.

- `ScreeningLab.tsx` now composes Step 7 review/repair/export presentation through extracted props-driven panels.
- `src/components/tabs/screeningReviewRepairPanels.tsx` owns `ReviewSummaryPanel`, `RepairPlanPanel`, `RepairResultPanel`, `PrimaryCTA`, and `ExportDecisionPanel`.
- The new presentation panels render supplied props and emit callbacks only; they do not import domain logic or compute workflow/export readiness.
- Existing workflow state, primary CTA resolution, export decision, review logic, repair planning/execution, snapshot identity, prompts, persistence, and runtime data were unchanged.
- Production changes stayed within 2 files, under the 8-file Wave 2 limit.
- `npm run smoke:phase3-architecture-wave2`, all required focused regressions, build, and `npm run test:system` passed.

No Architecture Cleanup Wave 3 task is READY.

## Architecture Cleanup Wave 3 - Action Pipeline Boundary

P3-ARCH-003 is DONE.

- `src/application/screeningActionPipeline.ts` now owns typed final-reviewer commands, explicit results, same-content safe-repair duplicate protection, and scoped refresh instructions.
- Final Reviewer / Repair / Export controls in `ScreeningLab.tsx` dispatch safe local repair, title alignment, AI repair start/stop, manual-editor navigation, and export navigation through that pipeline.
- Action results contain an action ID, timestamp, affected zones, current CV hash when available, outcome, remaining blockers, and refresh requirements; `RepairResultPanel` renders the latest receipt.
- Safe repair/title actions refresh workflow, review, repair, and export; AI start/stop refresh workflow only; export navigation refreshes export only. The existing CTA resolver remains authoritative and unchanged.
- The duplicate final-reviewer safe-fix control was removed. No review rule, repair executor logic, workflow rule, export decision, snapshot contract, prompt, runtime data, or persistence architecture changed.
- Production changes stayed within 3 files, under the Wave 3 limit of 8. Focused regressions, build, and `npm run test:system` passed after the required approved localhost rerun.

No Architecture Cleanup Wave 4 task is READY.

## Document and Implementation Consistency

| Topic | Documented Intent | Implementation Evidence | Status | Confidence |
|---|---|---|---|---|
| React is active product surface | `ARCHITECTURE.md`, `KNOWLEDGE.md` | `CV_Manager_React/` contains active scripts, server, data, src | Consistent | Confirmed |
| Canonical persistence | `data/app_data.json` source of truth | `storageService.cjs` reads/writes canonical snapshot and mirrors | Consistent | Confirmed |
| Explicit AI automation | No hidden AI runs | `server.cjs` requires explicit POST with prompt; `automationService.cjs` runs Codex CLI | Consistent | Confirmed |
| Local review before repair/export | Gate/reviewer/export checks local | `screeningReview.ts` and smoke tests | Consistent | Confirmed |
| Repair extraction incomplete | Docs say local content repair remains in UI | `ScreeningLab.tsx` contains local fix functions | Consistent debt | Confirmed |
| Quality contract centralization | Desired by current task | No standalone `QUALITY_SPEC.md` before this phase | Gap | Confirmed |

## Critical Unresolved Conflicts

No confirmed critical SPEC/FLOW/ARCHITECTURE contradiction was found in this phase.

However, evidence is insufficient to finalize root `AGENTS.md` replacement because:

- Existing root `AGENTS.md` governs legacy and React surfaces together.
- New governance targets `CV_Manager_React/` and docs but has not been approved as the long-term project-level operating rule.
- Several repair and contract tasks remain unexecuted.

Therefore this phase creates `AGENTS.md.draft` only.
