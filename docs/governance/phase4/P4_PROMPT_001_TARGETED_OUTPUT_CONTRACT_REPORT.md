# P4-PROMPT-001 - Targeted Regeneration Output Contract Report

Status: DONE

## Root Cause

The targeted-regeneration UI sent the complete mutable CV through `buildScreeningCvPrompt`, whose Writer contract explicitly requested header, sidebar, work experience, export notes, and wrapper objects. `normalizeTailoredCv` then accepted those full-CV shapes. P4-VAL-001 correctly rejected the resulting out-of-zone mutations, but the request/output boundary invited them.

## Old and New Runtime Shape

| Boundary | Before | After |
|---|---|---|
| Summary input | Full CV plus broad Writer context | Current Summary, relevant JD priorities, effective Brief subset, and selected evidence subset |
| Summary output | Complete `tailoredCv`/wrapper accepted | Exactly `{ "summary": "..." }` |
| Work-bullet output | Complete CV accepted | Exactly `workExperiencePatches[]` for authorized role/bullet IDs |
| Wording output | Complete CV accepted | Exactly `wordingPatches[]` for authorized target IDs |
| Parsing | Recoverable JSON plus broad CV normalization | Strict patch-only schema and target/evidence validation |
| Failure | Often discovered at preserved-zone validation | Rejected before candidate apply with exact unauthorized path |

The existing broad Writer prompt remains unchanged for full CV generation.

## Prompt and Output Contract

- Added `buildTargetedRegenerationPrompt` with separate Summary, work-bullet, and recruiter-wording instructions.
- Every prompt states authorized and immutable zones, exact JSON shape, forbidden keys, and evidence/claim constraints.
- Added a target-specific contract parser that rejects:
  - full-CV wrappers and unknown top-level/nested keys;
  - markdown, prose, comments, or non-JSON output;
  - duplicate, missing, or unauthorized role/bullet/wording targets;
  - unknown or invalid EvidenceCard IDs;
  - any out-of-zone field.
- Valid patches are converted into the existing internal candidate CV only after contract parsing. P4-VAL-001 remains the authoritative scoped apply gate.
- Invalid output records `invalid-output`, exposes the exact contract failure, and never saves or mutates the current CV.

## Input Reduction

The deterministic Microsoft Summary fixture measured:

- Previous full Writer request: 120,676 characters
- New Summary-only request: 29,596 characters
- Reduction: 91,080 characters, or 75%

This is a character-based deterministic comparison, not a provider billing-token measurement.

## Files Changed

Production (5):

- `CV_Manager_React/src/promptBuilders.ts`
- `CV_Manager_React/src/domain/targetedRegeneration.types.ts`
- `CV_Manager_React/src/domain/targetedRegenerationContract.ts`
- `CV_Manager_React/src/domain/targetedRegenerationDiagnostics.ts`
- `CV_Manager_React/src/components/tabs/ScreeningLab.tsx`

Tests/config:

- `CV_Manager_React/scripts/smoke-targeted-prompt-contract.mjs`
- `CV_Manager_React/scripts/smoke-targeted-output-schema.mjs`
- `CV_Manager_React/scripts/smoke-targeted-regeneration-runtime.mjs`
- `CV_Manager_React/e2e/targeted-regeneration-runtime.spec.ts`
- `CV_Manager_React/package.json`

Governance:

- `docs/governance/tasks/P4-PROMPT-001.md`
- `docs/governance/phase4/P4_PROMPT_001_TARGETED_OUTPUT_CONTRACT_REPORT.md`
- `docs/governance/CURRENT_STATE.md`
- `docs/governance/MASTER_TASK_ROADMAP.md`
- `docs/governance/COMPLETION_REPORT.md`

No production prompt template metadata, evidence data, canonical runtime fixture, persistence architecture, review rule, export rule, or Phase 5 file was directly edited.

## Automated Validation

Focused contract tests:

- `npm run smoke:targeted-prompt-contract` - PASS
- `npm run smoke:targeted-output-schema` - PASS (12 deterministic fixtures)
- `npm run smoke:targeted-regeneration-runtime` - PASS

Targeted/scoped/diagnostic regressions:

- Scoped validation and targeted patch application - PASS
- Targeted regeneration runtime, UI, action, click, feedback, and no-diff suites - PASS
- Regeneration validation diagnostics and trace suites - PASS
- All P4-AR proposal/orchestrator/executor/loop/escalation regressions - PASS

Product regressions:

- Phase 4 guided UX and Product Acceptance smokes - PASS
- Workflow, reviewer, review-role, and export-readiness suites - PASS
- Targeted regeneration browser E2E - PASS (9/9)
- Product Acceptance browser E2E - PASS (13/13)
- Browser no-AI guard - PASS (1/1)
- `npm run build` - PASS
- `npm run test:system` - PASS (exit code 0)

## Single Real-AI Acceptance

Scenario: Microsoft / Azure Solution Specialist / `Summary needs clearer role fit`.

The model was invoked exactly once through the real Screening Lab action.

Observed output and validation:

- Raw response captured: yes
- Raw response shape: `object(summary)`
- Normalized candidate: `{ "summary": "Microsoft ecosystem professional focused on enterprise AI adoption, Power Platform governance, analytics, and operational enablement. Built M365 Copilot adoption and licensing visibility, supported trial-to-production conversion decisions, delivered Power BI and workflow solutions, and coordinated technical requirements, vendor alignment, production troubleshooting, and stakeholder handoffs across enterprise technology initiatives." }`
- Changed zones: `summary`
- Ignored candidate zones: none
- Target failures: 0
- Preserved-zone failures: 0
- Stale/contract failures: 0
- New global issues: 0
- Stop reason: `passed`
- Result: Summary applied successfully

Canonical before/after:

| Evidence | Before | After |
|---|---:|---:|
| Data revision | 88 | 89 |
| Microsoft CV versions | 2 | 3 |
| CV version ID | `cv-mrixgp5z-jf6ua-regen-vifwcv` | `cv-mrixgp5z-jf6ua-regen-vifwcv-regen-uu3yyf` |
| Content hash | `h9nkhko` | `h946vle` |

Unchanged zone hashes:

- Header: `88778f831d6b28dbb9ad1a59fc6190331de1ca81514ddbe1a81dec9bc53c4f1e`
- Work Experience: `aa62af83636168879a8b4bdd91e3191f9acb060d9ad636978d083af2c8245a81`
- Sidebar: `5da4b4fe71ffea9f9c5a0c1cb734ac39ca38ab39b06bbb79aed3e1d6d085aca4`
- Export-related content: `a294253bd692c9c942d70f2aaef6e3272ddcd4e3f4ce3e81b6a4ff6e90c6a3f3`

Pre-existing global issues remained visible after apply:

- Missing email
- Duplicate work bullet
- Missing EvidenceCard ID on an unrelated work bullet

These remain authoritative blockers for export and were not blamed on, suppressed by, or used to reject the valid Summary patch.

## Safeguards and Limitations

- Scoped validation, unsupported-claim checks, EvidenceCard namespace/traceability, duplicate checks, preserved-zone integrity, review rules, and export semantics were not weakened.
- The strict parser intentionally rejects recoverable prose or broad wrapper output; an explicit user retry is required after an invalid response.
- Prompt reduction is fixture-measured by characters. Provider-side token accounting can differ.
- `docs/governance/ai-routing/ROUTING_SUMMARY.md` remains absent although `AGENTS.md` references it. The explicit task routing decision was used; this governance gap was not expanded into scope.

## Completion

- P4-PROMPT-001 is DONE.
- No task was created or promoted.
- Phase 5 was not started.
