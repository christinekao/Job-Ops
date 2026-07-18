# Phase 2 Root Cause Analysis

Status: Audit findings only.

## RC-01 — Effective CV Brief Is Not a Single Bound Object

```text
Observed Problem
Power Platform persisted Brief has 10 must-show IDs but empty top3SellingPoints and bulletPlan.

-> Immediate Cause
ScreeningLab uses a regenerated Brief when persisted selling points are empty,
but buildScreeningCvPrompt prefers any truthy job.cvBrief.

-> Upstream Cause
UI readiness, Writer input, and generation context do not resolve the same effective Brief.

-> Structural Root Cause
The CV Brief contract defines shape but not one canonical resolution/binding rule at every consumer.
```

- Classification: Contract, Implementation
- Evidence: `ScreeningLab.tsx` lines 67-69 and `buildScreeningCvPrompt`; persisted Power Brief
- Confidence: Confirmed

## RC-02 — Evidence Priority Is Lost Between Selection and Consumption

```text
Observed Problem
Power repair promotes chatbot, GPT evaluation, Copilot operations, and adoption evidence
before production-flow and direct Power Platform evidence.

-> Immediate Cause
Writer and local repair filter the global evidence array by selected IDs.

-> Upstream Cause
Ordered selected IDs are treated as membership only, not priority.

-> Structural Root Cause
Evidence Selection contract has no explicit ordering semantics for downstream consumers.
```

- Classification: Contract, Process, Implementation
- Evidence: `buildCvGenerationSelectionPatch`, `buildScreeningCvPrompt`, `buildLocalReviewerContentFix`; current Power CV
- Confidence: Confirmed

## RC-03 — Selection Optimizes Quantity and Lexical Match, Not Quality Coverage

```text
Observed Problem
Selected evidence can be numerous and valid while the first-page story remains off-JD.

-> Immediate Cause
Readiness checks counts; ranking scores JSON term occurrence, generic action words, and digits.

-> Upstream Cause
No selection invariant requires requirement coverage, business-impact strength,
technical-depth strength, or narrative diversity.

-> Structural Root Cause
Evidence Selection contract defines validity/minimums but not a quality allocation model.
```

- Classification: Data, Process, Contract, Evaluation
- Evidence: `scoreForJob`, `buildCvGenerationSelectionPatch`, `cvInputReadiness`
- Confidence: Confirmed

## RC-04 — Writer Context Is Large and Redundant Without Salience Boundaries

```text
Observed Problem
Writer output is inconsistent despite detailed quality instructions.

-> Immediate Cause
Prompt embeds full Screening Analysis, Brief, career profile,
selected skills/domain/evidence/stories, plus repeated quality rules.

-> Upstream Cause
Evidence is not projected into a concise Writer-specific schema.

-> Structural Root Cause
Writer Input contract specifies included sources but not field budgets,
priority order, deduplication, or maximum context size.
```

- Classification: Prompt, Contract, Model limitation
- Evidence: `buildScreeningCvPrompt`; current embedded JSON totals about 159k/190k chars before prompt instructions
- Confidence: Confirmed
- Causal impact on model attention: Possible

## RC-05 — Writer Output Contract Is Structurally Valid but Quality-Weak

```text
Observed Problem
Applied CVs contain missing evidence IDs, mixed ID namespaces, and missing contact.

-> Immediate Cause
validateScreeningCvOutput checks structural presence only.

-> Upstream Cause
TailoredCv makes bullet evidenceIds optional and does not type the ID namespace.

-> Structural Root Cause
Writer Output contract does not enforce the QUALITY_SPEC dimensions required before apply.
```

- Classification: Contract, Implementation
- Evidence: `screeningCvOutput.ts`, `types.ts`, both persisted CVs
- Confidence: Confirmed

## RC-06 — Contact Data Has No Writer Input Owner

```text
Observed Problem
AI Evaluation CV has an empty email although historical source material contains it.

-> Immediate Cause
Writer receives careerProfile, not raw source artifacts; careerProfile has no structured contact.

-> Upstream Cause
Contact fields are not represented in the active profile/evidence Writer contract.

-> Structural Root Cause
No canonical structured contact owner exists across source -> profile -> Writer -> export.
```

- Classification: Data, Contract
- Evidence: `buildScreeningCvPrompt`, canonical snapshot career profile, source material, AI Evaluation CV
- Confidence: Confirmed

## RC-07 — Reviewer Evaluates JD Gaps as CV Failures

```text
Observed Problem
A truthful CV can remain red because the JD has unsupported mappings or high-risk gaps.

-> Immediate Cause
reviewerPass requires zero unsupported mappings and zero high-risk gaps,
regardless of whether they appear as visible claims.

-> Upstream Cause
Analysis-quality state and visible-CV claim state are combined in one reviewer check.

-> Structural Root Cause
Evaluation contract does not separate application-fit risk from CV-integrity failure.
```

- Classification: Evaluation, Contract, Implementation
- Evidence: `reviewerPass` unsupported claims and weak claims checks
- Confidence: Confirmed

## RC-08 — Reviewer Proxies Reward Cosmetic Compliance

```text
Observed Problem
Review pressure can favor keyword insertion and action verbs without proving relevance or impact.

-> Immediate Cause
Unknown keyword support is treated as supported; action/outcome is regex-based;
manager relevance uses word overlap.

-> Upstream Cause
Heuristics operate on surface text rather than evidence-linked requirement assertions.

-> Structural Root Cause
Evaluation criteria are not consistently bound to requirement ID + evidence ID + visible claim.
```

- Classification: Evaluation, Implementation
- Evidence: `keywordSupportLevel`, `screeningGate`, `hiringManagerReview`, `reviewerPass`
- Confidence: Confirmed

## RC-09 — Local Repair Has No Failed-Zone Contract

```text
Observed Problem
Power CV summary/current role were broadly rebuilt and prior-role bullets sanitized;
repeated repair notes accumulated.

-> Immediate Cause
buildLocalReviewerContentFix receives no failed checks or content zones.

-> Upstream Cause
Repair classification produces categories/free text, but local fix consumes only CV/evidence/Brief.

-> Structural Root Cause
Repair contract says narrow repair but has no executable patch target/path contract.
```

- Classification: Process, Contract, Implementation
- Evidence: `classifyRepairActions`, `buildLocalReviewerContentFix`, current Power CV
- Confidence: Confirmed

## RC-10 — Local Repair Encodes One Role Family

```text
Observed Problem
Local repair can impose Power Platform subsection titles regardless of target JD.

-> Immediate Cause
Two subsection titles are hard-coded in localReviewerFix.ts.

-> Upstream Cause
Repair does not derive structure from failed section, Brief bullet plan, or target role.

-> Structural Root Cause
Role-specific editorial strategy is embedded in a generic repair implementation.
```

- Classification: Implementation, Contract
- Evidence: `localReviewerFix.ts` lines 85-88
- Confidence: Confirmed

## RC-11 — Export Readiness Is a Proxy, Not Render Verification

```text
Observed Problem
Local export checks cannot prove the CV is actually 1.5-2 pages or visually ATS/PDF ready.

-> Immediate Cause
Checks use characters, composed-content length, role count, bullet count, and section order.

-> Upstream Cause
No browser/PDF rendering or text-layer artifact is part of the current check.

-> Structural Root Cause
EXPORT contract covers local readiness but not rendered-output validation.
```

- Classification: Evaluation, Contract
- Evidence: `exportVerification`, `contracts/EXPORT.md`
- Confidence: Confirmed
- Current rendered PDF defect evidence: Insufficient evidence
