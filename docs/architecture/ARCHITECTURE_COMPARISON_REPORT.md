# Architecture Comparison Report

## 1. Scope

This report compares the clean-slate architecture discovered in:

- `docs/architecture/ARCHITECTURE_DISCOVERY_REPORT.md`
- `docs/architecture/ARCHITECTURE_DECISION_MAP.md`

against the current CV Builder project.

The comparison is architectural, not a code review, ADR review, or governance review.

## 2. Existing Project Evidence Reviewed

Existing project evidence inspected:

- `CV_Manager_React/docs/ARCHITECTURE.md`
- `CV_Manager_React/docs/FLOW.md`
- `CV_Manager_React/src/domain/screeningWorkflow.ts`
- `CV_Manager_React/src/domain/screeningReview.ts`
- `CV_Manager_React/src/domain/repairOrchestrator.ts`
- `CV_Manager_React/src/promptBuilders.ts`
- `CV_Manager_React/src/data/selection.ts`
- `CV_Manager_React/src/components/tabs/ScreeningLab.tsx`
- `CV_Manager_React/src/types.ts`

## 3. Current Architecture Summary

The current project is a JD-first screening workflow:

```text
Career Evidence
→ JD Analysis
→ Terms + Gaps
→ CV Brief + Evidence
→ Generate Screening CV
→ Gate Review
→ Manager + ATS Check
→ Export / Apply
```

The current documented architecture emphasizes:

- JD-first workflow
- evidence before wording
- local review before AI repair
- one-pass generation with targeted repair
- explicit AI actions
- canonical local persistence
- stable state transitions

Current major runtime areas:

- React UI and `ScreeningLab.tsx` orchestration
- domain screening workflow and review logic
- prompt builders
- evidence/CV selection helpers
- repair orchestrator
- local persistence and automation bridge

## 4. Comparison Classification

Classification labels:

- `Already Correct`
- `Acceptable Trade-off`
- `Needs Refactoring`
- `Major Architectural Gap`
- `Architectural Anti-pattern`

## 5. Difference Matrix

| Area | Clean-slate architecture | Current architecture | Classification | Impact |
|---|---|---|---|---|
| Product objective | Optimize final CV quality and interview probability. | Documented objective matches this direction. | Already Correct | Strong product intent exists. |
| JD-first workflow | JD is the hiring target input. | Current flow is explicitly JD-first. | Already Correct | Correct top-level orientation. |
| Evidence-first principle | Evidence Bank is central truth source. | Current architecture emphasizes evidence before wording. | Already Correct | Correct principle. |
| Evidence graph | Atomic evidence with provenance and claim boundaries. | Evidence cards exist, but architecture is not clearly a graph-first claim system. | Major Architectural Gap | Limits traceability and systematic truth verification. |
| Requirement graph | JD becomes structured hiring target. | Screening Analysis exists and includes requirements, keywords, gaps, positioning. | Acceptable Trade-off | Useful, though broad and prompt-shaped. |
| Evidence-to-requirement mapper | Dedicated support matrix owner. | Mapping exists inside screening analysis / selection flow. | Needs Refactoring | Mapping should be first-class and independently evaluable. |
| Positioning Strategist | Owns target positioning, fit strategy, gaps, claims to avoid. | ScreeningAnalysis owns much of this. | Acceptable Trade-off | Conceptually close, but may be too bundled with analysis. |
| CV Strategy Compiler | Deterministic writing plan separate from Writer. | `buildCvBrief` and writer context partially serve this role. | Needs Refactoring | Needs stronger artifact boundary and scoring traceability. |
| Writer | Writes from strategy only. | Writer prompts include many policy, reviewer, and repair-like instructions. | Architectural Anti-pattern | Writer is overloaded and may duplicate analysis/review reasoning. |
| Claim Ledger | Every visible claim mapped to evidence. | Evidence IDs exist in CV data, but no independent claim ledger is apparent. | Major Architectural Gap | Hard to objectively verify truthfulness and implied claims. |
| Quality Evaluator | Independent product quality scorer. | Product evaluation docs now exist, but runtime evaluator is not architecture-level component. | Major Architectural Gap | Product quality cannot yet be measured as a first-class runtime output. |
| Reviewer | Structured defect classifier only. | Current ADR-005 direction aligns with structured reviewer contracts. | Already Correct | Good separation after recent changes. |
| Repair Engine | Bounded mutation consumer of reviewer issues. | `repairOrchestrator` consumes structured issues and preserves reviewer fields. | Already Correct | Correct authority boundary. |
| Export Engine | Render accepted version and validate artifact identity. | Export is present in review/export panel flow, but content quality and export readiness appear coupled in UI. | Needs Refactoring | Export should be artifact renderer, not quality proxy. |
| Human Decision Console | Explicit human input only where authority is missing. | Current flow has explicit AI and manual paths. | Acceptable Trade-off | Directionally correct; needs clearer product-level decision console. |
| Evaluation System | Golden dataset and regression baselines drive product change. | Product evaluation docs exist, but not implemented as architecture. | Major Architectural Gap | Changes are not yet objectively judged by CV improvement. |
| UI orchestration | UI triggers decisions but does not own domain heuristics. | `ScreeningLab.tsx` remains large and owns orchestration plus messaging/fix logic. | Architectural Anti-pattern | Mixed responsibilities make quality behavior hard to reason about. |
| Prompt architecture | Prompts consume structured artifacts and perform narrow tasks. | `promptBuilders.ts` contains broad prompts with analysis, writing, policy, checklist, and repair instructions. | Architectural Anti-pattern | Repeated AI reasoning and hidden responsibility mixing. |
| Versioning | Every artifact content-addressed and promotion-bound. | Review snapshots and hashes exist for CV review freshness. | Acceptable Trade-off | Good foundation, but not extended to full decision graph. |
| Feedback loops | Evaluation and real outcomes improve baselines. | No clear outcome feedback architecture found. | Major Architectural Gap | System cannot learn whether CVs actually improve interviews. |

## 6. Five Biggest Architectural Mistakes Ranked by Impact

### 1. No first-class Claim Ledger

Classification:

`Major Architectural Gap`

Impact:

The system cannot reliably prove that every visible and implied CV claim is supported by evidence. This weakens truthfulness, repair safety, reviewer consistency, and final CV defensibility.

### 2. No first-class Product Quality Evaluator

Classification:

`Major Architectural Gap`

Impact:

The system can pass workflow gates without proving that the final CV is better. This is the largest gap relative to the product goal.

### 3. Writer prompt owns too many decisions

Classification:

`Architectural Anti-pattern`

Impact:

The Writer is asked to generate, self-review, obey positioning, handle gaps, avoid unsupported claims, optimize ATS, and sometimes behave like a repair pass. This increases duplicated reasoning and makes failures harder to isolate.

### 4. `ScreeningLab.tsx` is an orchestration bottleneck

Classification:

`Architectural Anti-pattern`

Impact:

UI orchestration, product actions, repair display, review display, and workflow routing are too close together. This makes product behavior harder to test and evolve.

### 5. Evidence-to-requirement mapping is not independent enough

Classification:

`Needs Refactoring`

Impact:

Evidence coverage, missing evidence, transferable evidence, and capability gaps should be first-class measurable artifacts. If they remain embedded in broader analysis/writer context, downstream quality cannot be objectively measured.

## 7. Already Correct Areas

The current project is correct in several important directions:

- JD-first workflow
- evidence-before-wording principle
- explicit AI actions
- local review before repair
- bounded Repair authority
- structured Reviewer contract direction
- review snapshot/hash freshness concept
- weak-fit generation policy after ADR-004

These are good product instincts.

They are not enough to reach world-class architecture because they still do not create a complete evidence-to-claim-to-quality system.

## 8. Acceptable Trade-offs

### ScreeningAnalysis as a broad early decision artifact

This is acceptable for a single-user local product, but long term it should split into:

- Requirement Graph
- Evidence Coverage Matrix
- Positioning Decision
- Gap Register

### Local-first persistence

This is acceptable for the current product stage. Long term, artifact versioning should become more explicit and graph-oriented.

### Explicit AI/manual fallback

This is acceptable and product-safe. Long term, the user experience should expose decisions rather than raw prompt fallback as the primary escape hatch.

## 9. Needs Refactoring

### CV Brief should become a Strategy Compiler artifact

Current `buildCvBrief` is directionally correct, but the architecture should treat the writing plan as a first-class artifact with:

- selected evidence
- claim boundaries
- section plan
- achievement ordering
- skill ordering
- keyword placement
- gap handling

### Export should be separated from quality judgment

Export should answer:

- is this artifact rendered correctly?
- does it match the reviewed CV version?
- is it ATS-parseable?

It should not become the final judge of content quality.

### Requirement mapping should be independently scored

Evidence coverage should not be only embedded in analysis or reviewer output. It should be a measurable artifact used by Writer, Reviewer, and Evaluator.

## 10. Major Architectural Gaps

### Claim Ledger

Missing first-class artifact:

```text
CV claim
→ claim type
→ evidence IDs
→ support level
→ implied ownership/seniority/scope
→ risk status
```

Without this, truthfulness remains partially prompt-dependent.

### Product Quality Evaluator

The product needs a system that scores final CV quality across:

- HR readability
- hiring manager readability
- ATS compatibility
- evidence coverage
- truthfulness
- interview probability

Without this, there is no objective way to know whether a change improved the product.

### Regression Baseline System

The product needs golden cases and baseline promotion rules. Otherwise each change is judged by process completion or subjective impression.

### Outcome Feedback Loop

The product needs a place to learn from:

- recruiter responses
- interview invitations
- rejection patterns
- user edits
- interview feedback

Without this, interview probability estimates cannot calibrate.

## 11. Architectural Anti-patterns

### Prompt as architecture

Current prompts contain too many product decisions. A prompt should execute a narrow role against structured inputs. It should not be the place where architecture, policy, quality review, and repair behavior all converge.

### UI as orchestration brain

`ScreeningLab.tsx` remains too central. Even when domain helpers exist, the UI still appears to coordinate too many product-level actions and messages.

### Review loops as quality substitute

Repeated reviewing and repairing can create a false sense of improvement. The product needs a final quality score and regression comparison, not just fewer blockers.

### Export readiness as final readiness

Export readiness is necessary but not sufficient. A CV can be exportable and still weak.

## 12. Simplification Recommendations

### Remove duplicate self-review instructions from Writer prompts

Writer should receive:

- positioning decision
- writing plan
- evidence constraints
- output schema

Reviewer and Evaluator should own quality judgment after generation.

### Replace broad repair prompts with issue-specific mutation plans

Repair should consume:

- issue id
- allowed zone
- current text
- evidence IDs
- forbidden claims
- target improvement

Not the entire CV strategy unless needed.

### Move UI-owned repair and review messaging into product decision services

The UI should render:

- current decision
- issue list
- user options
- artifact status

It should not determine product semantics.

### Create one shared quality model

Avoid separate scoring fragments across reviewer, export, acceptance, and product docs.

The final CV quality model should be reusable by:

- Reviewer
- Product Evaluation
- Regression
- User-facing quality report

### Use decision artifacts instead of repeated transformations

Generate once:

- Requirement Graph
- Coverage Matrix
- Positioning Decision
- Writing Plan
- Claim Ledger

Then reuse these instead of asking later prompts to rediscover them.

## 13. Final Comparison Answer

If starting again today, would I build the same architecture?

NO.

The current system has several correct principles, but it is still workflow-and-prompt centered. The clean-slate architecture should be evidence-graph, claim-ledger, and product-evaluation centered.

The highest-impact one-month architectural improvement:

Build a first-class Claim Ledger plus Product Quality Evaluator.

Why:

It would immediately convert the product from “generate and review a CV” into “prove this final CV is truthful, stronger, and more likely to win an interview.”
