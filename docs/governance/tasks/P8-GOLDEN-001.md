# P8-GOLDEN-001 — Golden JD Match and CV Opportunity Validation

Status: DONE

## Model Routing

- Selected AI: Codex
- Model: GPT-5.6 Terra
- Reasoning: High
- Reason: Cross-cutting production Fit semantics, Evidence safety, Writer/Reviewer/Repair/Export validation, and versioned Golden regression infrastructure.
- Escalation trigger: Stop only if current approved authority forbids the required additive semantics or a new persistence/architecture owner is required.

## Objective

Extend the existing Screening Analysis and Positioning Report path with evidence-grounded requirement classification, multidimensional Fit, Medium Fit opportunity analysis, Low Fit transition guidance, and deterministic Golden validation without creating a parallel matching or CV pipeline.

## Existing-System Investigation

| Area | Existing production owner / reusable asset |
|---|---|
| Raw/manual JD | `JobApplication.rawJD`; `JDIntake.tsx` and `JDWorkspace.tsx` |
| Parsed JD and initializer | `ParsedJD`; `initializeJob()` and `computeJobContentHash()` in `data/jobs.ts` |
| JD Analysis | `ScreeningAnalysis`; `buildScreeningAnalysisPrompt()`; application in `ScreeningLab.tsx` |
| Requirement mapping | `ScreeningAnalysis.jdBreakdown` and `jdEvidenceMapping` |
| Backbone / Evidence | `data/backbone.ts`, `data/evidence.ts`, `data/evidenceTasks.ts` |
| Selection / Brief | `data/selection.ts`; `buildCvBrief()` and `resolveEffectiveCvBrief()` |
| Writer | `promptBuilders.ts`; `TailoredCv`; `validateScreeningCvOutput()` |
| Fit / positioning | `ScreeningAnalysis.positioning`; `domain/positioningPolicy.ts::buildPositioningReport()` |
| Review identity / Reviewer | `reviewFreshness.ts`, `screeningReview.ts`, ADR-GOV-002 |
| Repair | Approved ADR-PROD-006 and existing bounded Repair domain |
| Export | `screeningExportDecision.ts`; stale CV/Review blockers |
| Existing Golden framework | `docs/governance/phase2/{GOLDEN_EVALUATION,QUALITY_SCORECARD,QUALITY_METRICS,QUALITY_REGRESSION_CHECKLIST}.md` |
| Existing deterministic acceptance | `scripts/product-acceptance/`, current smoke commands, fixed recorded fixtures |

### Confirmed Current Gap

`buildPositioningReport()` maps `applyTier` directly to only `Good/Risky/Weak`. `jdEvidenceMapping` has only `Strong/Partial/Weak/Unsupported`. Production output cannot represent:

- Direct versus transferable versus partial match
- Learnable versus core capability gap versus formal screening risk
- requirement importance
- multidimensional Fit and application viability
- Medium Fit opportunity analysis
- Low Fit transition analysis
- deterministic relative ranking

This prevents the current runtime from distinguishing valuable adjacent opportunities from keyword-heavy low-fit roles without relying on free-form text.

## Governing Documents

1. `docs/INDEX.md`
2. `docs/architecture/CURRENT_ARCHITECTURE.md`
3. Approved ADRs in `docs/adr/ADR_INDEX.md`
4. `docs/governance/PROJECT_RULES.md`
5. Permanent Phase 2 Golden Evaluation, Quality Scorecard, Metrics, and Regression Checklist
6. Current explicit P8 user requirements

Draft Golden/Scorecard v2 documents are reference-only and do not authorize implementation.

## Scope

- Add minimal types and deterministic projections to the existing Screening Analysis / Positioning Report model.
- Extend the existing Screening prompt/output schema to request the same structured fields.
- Add versioned fixed JD/Evidence/recorded-output fixtures.
- Add one deterministic runner using production owners and validators.
- Keep AI evaluation explicit; validate recorded output without invoking AI.
- Integrate deterministic Golden validation into the required system suite.

## Allowed Files

- `CV_Manager_React/src/types.ts`
- `CV_Manager_React/src/domain/positioningPolicy.ts`
- `CV_Manager_React/src/promptBuilders.ts`
- `CV_Manager_React/scripts/golden/**`
- `CV_Manager_React/scripts/smoke-golden-validation.mjs`
- `CV_Manager_React/scripts/validate-golden-ai-fixture.mjs`
- `CV_Manager_React/package.json`
- `docs/governance/tasks/P8-GOLDEN-001.md`
- `docs/governance/phase2/{GOLDEN_EVALUATION.md,QUALITY_SCORECARD.md,QUALITY_METRICS.md,QUALITY_REGRESSION_CHECKLIST.md}`
- `docs/governance/{CURRENT_STATE.md,MASTER_TASK_ROADMAP.md,COMPLETION_REPORT.md}`
- `docs/{DOCUMENT_REGISTRY.yaml,DOCUMENT_RELATIONSHIPS.md,architecture/CURRENT_ARCHITECTURE.md}` only where implemented behavior requires it.

## Forbidden Files

- `CV_Manager_React/data/**`
- Runtime persistence and P6 recovery
- Existing canonical user/job/CV data
- P5, P6, DOC-GOV-002, and P7 task records
- Legacy product surfaces
- Git and `.push-staging/`

## Non-Goals

- No URL import implementation.
- No network retrieval during Golden tests.
- No hidden or automatic AI execution.
- No new independent Fit, Evidence, Writer, Reviewer, Repair, Export, or persistence pipeline.
- No role-title or scenario-ID hardcoding in production evaluation.

## Implementation Phases

1. Baseline current build/system and prove the missing production output with fail-first regression.
2. Add requirement status/importance/use types and multidimensional Fit to existing Positioning Report.
3. Add deterministic opportunity/transition projections and ranking inputs.
4. Extend existing Screening prompt schema without changing prompt ownership.
5. Add four versioned fixed Golden scenarios and recorded output fixtures.
6. Validate production Fit projection, Evidence lineage/CV eligibility, Writer/Reviewer/Repair/Export invariants, forbidden claims, ranking, and URL-import normalization contract.
7. Add explicit recorded-AI validation command and integrate deterministic runner into `test:system`.
8. Run all focused/full validation and update governance.

## Acceptance Criteria

- [x] Fail-first regression proves existing Positioning Report lacks required structured Fit semantics.
- [x] Four fixed scenarios cover Strong, Viable Medium, and Low boundaries.
- [x] Each requirement has exactly one classification and importance.
- [x] Direct/transferable matches require eligible Evidence; transferable matches explain context.
- [x] Partial matches list supported and unsupported aspects.
- [x] Learnable, core, and formal gaps remain distinct.
- [x] Fit output includes all required dimensions and generation recommendation.
- [x] Medium scenarios include opportunity analysis; Low scenarios include transition guidance.
- [x] Ranking is derived from requirement/evidence/gap dimensions, never title or scenario ID.
- [x] Forbidden claims, invalid lineage, CV-ineligible Evidence, unsupported claims, and stale export remain blocking.
- [x] Writer/Reviewer/Repair/Export Golden checks use existing production validators/owners.
- [x] Deterministic tests make no AI or network call.
- [x] Recorded AI output validation is explicit and never part of build/app load/system background execution.
- [x] URL-import normalization contract is reserved with fixed metadata-insensitive identity validation.
- [x] Focused, build, system, and server validation pass.
- [x] Documentation and Registry validation pass; no task remains READY.

## Migration, Compatibility, and Recovery

- Additive optional fields preserve legacy Screening Analysis and Positioning Report records.
- Deterministic projection fills safe defaults for older records; it never turns absent Evidence into direct support.
- No persisted-data migration or automatic rewrite.
- Golden failure reports identify scenario, stage, requirement, expected/actual, evidence, blocker, delta, and probable owner.

## Final Report Requirements

Report production owners, reused schemas/validators, confirmed defect and failing evidence, production repair, four scenario results, every changed file, exact tests, limitations, and final task/READY state.

## Completion Evidence

### Fail-First Proof

The initial deterministic regression failed before the production repair:

```text
production Positioning Report must expose one structured match row per JD requirement
```

Root cause: the existing `buildPositioningReport()` projected only the legacy
`applyTier` and could not represent requirement importance, match class,
eligible Evidence support, multidimensional Fit, opportunity analysis, or rank.

### Production Repair

- Extended the existing `ScreeningAnalysis.jdEvidenceMapping` and
  `PositioningReport`; no parallel owner was introduced.
- Reused canonical `validateEvidenceCard()` before Evidence may authorize
  direct or transferable CV use.
- Reused production Writer output validation, Review/Repair safety semantics,
  content hashing, Brief construction, and system suite.
- Added deterministic Golden dataset/runner and an explicit recorded-AI fixture
  validator. Neither invokes AI or network retrieval.

### Fixed Scenario Results

| Scenario | Classification | Viability / rank score | Priority | Recommendation | Relative rank |
|---|---|---:|---|---|---:|
| GOLDEN-JD-003 | STRONG_FIT | 85 | VERY_HIGH | GENERATE_PRIORITY_CV | 1 |
| GOLDEN-JD-001 | VIABLE_MEDIUM_FIT | 60 | MEDIUM | GENERATE_TRANSFER_CV | 2 |
| GOLDEN-JD-002 | LOW_FIT | 3 | LOW | DO_NOT_PRIORITIZE_GENERATION | 3 |
| GOLDEN-JD-004 | LOW_FIT | 0 | LOW | DO_NOT_PRIORITIZE_GENERATION | 4 |

### Validation

- PASS: `npm run smoke:golden-validation`
- PASS: `npm run test:golden:ai` (`ai_invoked: false`)
- PASS: P5/P6/P7, Backbone, Brief, Writer, Review, Repair, Export, Product
  Acceptance, positioning-policy, and persistence focused regressions
- PASS: `npm run build`
- PASS: `npm run test:system`, including deterministic Golden and server smoke
- PASS: documentation inventory, Registry, relationship, link, ID, task-status,
  and conflict-marker validation

### Limitations

- URL import is not implemented; only its metadata-insensitive identity contract
  is reserved and tested.
- AI quality is represented by fixed recorded output. Any future live AI run
  must remain explicit, separately authorized, and versioned.
- Legacy persisted analyses receive conservative projections; missing Evidence
  can never be promoted to direct support.

Final state: P8 is DONE; no task is READY; canonical runtime data was not
modified.
