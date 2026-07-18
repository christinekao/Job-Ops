# P4-PROMPT-001 - Targeted Regeneration Prompt and Output Contract Hardening

Status: DONE

## Objective

Replace the broad full-CV Writer contract used by targeted regeneration with target-specific, minimal-input prompts and strict patch-only response parsing for Summary, selected work bullets, and recruiter wording cleanup.

## Selected Execution

- AI: Codex
- Model: GPT-5.6 Sol
- Reasoning: 中
- Reason: The confirmed failure crosses runtime prompt ownership, response schema, normalization, and real-AI acceptance while preserving the existing scoped validator.
- Escalation trigger: Stop if implementation requires more than 10 production files or changes P4-VAL-001 semantics, review/export/routing/evidence-selection/persistence/runtime-data boundaries, unrelated Writer behavior, or Phase 5.
- Routing note: `docs/governance/ai-routing/ROUTING_SUMMARY.md` is referenced by `AGENTS.md` but absent. The explicit user-selected preferred model is therefore the active higher-priority routing decision for this task.

## Dependencies

- P4-AR-009 through P4-AR-012: DONE
- P4-DIAG-001: DONE
- P4-VAL-001: DONE
- ADR-003 confirms `CV_Manager_React/src/promptBuilders.ts` owns active runtime prompt construction.
- No unresolved architecture decision blocks this task.
- No other Task is READY.

## Confirmed Current Contract Trace

`ScreeningLab.tsx::executeTargetedRegenerationAction`
→ constructs full `targetedFixContext.currentCv`
→ calls `buildScreeningCvPrompt`
→ prompt requests the complete Writer `tailoredCv` schema
→ `startAutomation("screening-cv", ...)`
→ automation parses any recoverable JSON object
→ `normalizeTailoredCv` accepts full CV/wrapper aliases
→ `executeTargetedRegeneration`
→ P4-VAL-001 scoped validation and patch apply
→ existing save/version/review/export boundary.

## Confirmed Root Cause

| Boundary | Evidence | Root Cause |
|---|---|---|
| Prompt owner | `src/promptBuilders.ts::buildScreeningCvPrompt` | Targeted flow reused the full Writer prompt instead of a target-specific builder. |
| Input | `ScreeningLab.tsx::targetedFixContext.currentCv` | The complete mutable CV plus broad Writer context was sent to the model. |
| Output schema | `buildScreeningCvPrompt` required shape | Schema explicitly included header, target role, sidebar, all work experience, export notes, and full CV wrappers. |
| Parser | `components/cv/utils.ts::normalizeTailoredCv` | Normalizer accepts full CV objects and wrapper aliases; it has no patch-only key ownership. |
| Apply boundary | P4-VAL-001 scoped validator | Correctly rejected the real response after it changed prohibited zones; validator is not the defect. |

## Allowed Files

Production files (planned 6; maximum 10):

- `CV_Manager_React/src/promptBuilders.ts`
- `CV_Manager_React/src/domain/targetedRegeneration.types.ts`
- `CV_Manager_React/src/domain/targetedRegenerationContract.ts`
- `CV_Manager_React/src/domain/targetedRegeneration.ts`
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

## Forbidden Files

- P4-VAL-001 scoped-validation semantics
- Core review quality rules and export semantics
- Repair Orchestrator routing
- Evidence-selection rules
- Persistence architecture and canonical runtime data
- General Writer prompt behavior outside targeted regeneration
- P4-AR, P4-DIAG, and P4-VAL history
- Phase 5 files

## Acceptance Criteria

1. Summary, work-bullet, and wording operations use separate patch-only output contracts.
2. The Summary runtime prompt authorizes only `{ "summary": "..." }` and excludes the mutable full CV.
3. Work-bullet output names every exact authorized role/bullet target and preserves valid EvidenceCard IDs.
4. Wording cleanup output names exact authorized target fields; unrelated fields cannot parse.
5. Strict parsing rejects wrappers, unknown keys, full-CV objects, markdown/prose, duplicate targets, unknown IDs, and invalid evidence IDs with exact diagnostics.
6. Strictly parsed patches are converted to the existing P4-VAL-001 candidate boundary without changing scoped-validation semantics.
7. Invalid output never mutates or saves the CV and records an explicit `invalid-output` stop reason; retry remains explicit.
8. Valid patch save/version/hash/review/export behavior remains unchanged.
9. Prompt input is measurably smaller than the previous full Writer targeted request.
10. The real AI Summary response contains Summary only; fixture-only success is insufficient.

## Required Validation

- `npm run smoke:targeted-prompt-contract`
- `npm run smoke:targeted-output-schema`
- P4-VAL, targeted runtime/UI/feedback, all P4-AR, Phase 4 UX, Product Acceptance, workflow, reviewer, and export-readiness regressions
- Browser Product Acceptance E2E and browser no-AI guard
- `npm run build`
- `npm run test:system`
- One explicit real-AI Summary regeneration in Screening Lab

## Completion Rule

Mark DONE only when the real AI runtime returns the Summary-only patch shape, no out-of-zone path is present, scoped validation either applies it or gives a Summary-specific quality failure, all required regressions pass, and canonical runtime data is changed only through a successful authorized save. Do not create or promote another task.

## Completion Evidence

- Separate target-specific runtime prompts now own Summary, selected work-bullet, and wording regeneration.
- Strict parsing accepts only the authorized patch schema and rejects wrappers, unknown keys, prose/markdown, unauthorized paths, invalid target IDs, and invalid EvidenceCard IDs.
- Focused prompt measurement reduced the Summary request from 120,676 to 29,596 characters (75% smaller).
- All focused, P4-VAL/P4-DIAG/P4-AR, Phase 4 UX, Product Acceptance, browser, build, and system regressions passed.
- The single real-AI Microsoft run returned `object(summary)` with no ignored or out-of-zone fields and applied successfully.
- Canonical revision changed from 88 to 89 through the authorized save boundary; Microsoft CV versions changed from 2 to 3.
- Header, Work Experience, Sidebar, and export-related hashes remained unchanged; only Summary and the overall CV hash changed.
- Completion report: `docs/governance/phase4/P4_PROMPT_001_TARGETED_OUTPUT_CONTRACT_REPORT.md`.
- No task was created or promoted. Phase 5 was not started.
