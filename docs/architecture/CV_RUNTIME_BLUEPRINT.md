# CV Runtime Blueprint

## 1. Purpose

This blueprint defines the minimum production-ready runtime architecture for the CV Decision System.

The system should not begin by writing a CV.

It should first produce four runtime decision artifacts:

1. Requirement Model
2. Coverage Matrix
3. Claim Ledger
4. Product Quality Evaluator result

These four domains are the minimum complete runtime needed to make CV generation truthful, explainable, measurable, and maintainable.

## 2. Architectural Discipline

This blueprint intentionally resists over-engineering.

It does not introduce separate runtime domains for positioning, narrative, repair, export, learning, career memory, or delivery. Those may exist later, but they are not essential to the minimum viable runtime.

The four domains are enough because they answer the core production questions:

| Question | Runtime domain |
|---|---|
| What does the job require? | Requirement Model |
| What evidence supports those requirements? | Coverage Matrix |
| What claims are approved for writing? | Claim Ledger |
| Is the final CV good enough? | Product Quality Evaluator |

## 3. Runtime Domain Summary

| Domain | Primary responsibility | Unique business capability | Why it cannot be merged |
|---|---|---|---|
| Requirement Model | Represent the hiring target. | Turns a JD into structured hiring requirements and priorities. | If merged with Coverage, candidate evidence can distort requirement interpretation. |
| Coverage Matrix | Represent evidence support against requirements. | Shows direct, transferable, weak, and missing coverage before writing. | If merged with Requirement Model, job truth and candidate support become mixed. |
| Claim Ledger | Represent approved and generated claims. | Makes every visible CV sentence traceable to approved evidence-backed claims. | If merged with Writer, Writer would approve its own truthfulness. |
| Product Quality Evaluator | Judge final CV quality. | Explains whether the CV is good, bad, risky, or regressed. | If merged with Reviewer/Writer, quality judgment becomes self-confirming. |

## 4. Domain Responsibilities

### 4.1 Requirement Model

Primary responsibility:

Represent the job as structured hiring requirements.

Business purpose:

Ensure the system optimizes for what the employer actually wants.

Boundaries:

- owns JD interpretation
- owns requirement grouping
- owns requirement priority
- owns hard requirement status
- owns ATS keyword candidates from the JD
- owns inferred hiring signals with confidence labels

Non-responsibilities:

- does not judge candidate fit
- does not select evidence
- does not approve claims
- does not write CV text
- does not evaluate final CV quality

Inputs:

- raw JD
- role title
- company context if available
- user-provided target role notes if available

Outputs:

- requirements
- requirement groups
- priority labels
- criticality labels
- JD keywords
- inferred hiring signals
- seniority expectation

Persistence requirements:

- persist per JD version
- store raw JD hash
- store extraction timestamp
- store source spans where possible
- store confidence for inferred signals

Versioning requirements:

- new version when raw JD changes
- new version when extraction policy changes
- downstream artifacts must reference Requirement Model version

Producers:

- JD ingestion and requirement extraction runtime

Consumers:

- Coverage Matrix
- Claim Ledger
- Product Quality Evaluator
- Writer via Writing Plan

### 4.2 Coverage Matrix

Primary responsibility:

Represent how candidate evidence supports each requirement.

Business purpose:

Show what is strong, weak, transferable, or missing before writing starts.

Boundaries:

- owns evidence-to-requirement links
- owns coverage status
- owns evidence ranking for each requirement
- owns missing evidence identification
- owns transferable evidence classification

Non-responsibilities:

- does not redefine requirements
- does not approve final claim wording
- does not write narrative
- does not decide final CV quality

Inputs:

- Requirement Model
- evidence bank
- evidence confidence metadata

Outputs:

- coverage rows
- evidence links
- coverage status: direct, transferable, weak, missing, not applicable
- selected evidence candidates
- missing evidence list
- capability gap candidates

Persistence requirements:

- persist per Requirement Model version and evidence version
- store evidence IDs
- store coverage rationale
- store support confidence

Versioning requirements:

- new version when Requirement Model changes
- new version when evidence bank changes
- new version when evidence confidence changes

Producers:

- evidence mapping runtime

Consumers:

- Claim Ledger
- Product Quality Evaluator
- Writer via Writing Plan
- Repair decisions when missing evidence is involved

### 4.3 Claim Ledger

Primary responsibility:

Represent every approved, generated, rejected, and retired claim.

Business purpose:

Make every CV sentence defensible and traceable.

Every generated CV sentence must be traceable to approved evidence through SentenceTrace, Claim IDs, ClaimSources, and EvidenceRefs, or it must be explicitly classified as non-claim or unsupported.

Boundaries:

- owns claim approval
- owns claim evidence links
- owns claim confidence
- owns claim risk
- owns generated sentence traceability
- owns claim retirement

Non-responsibilities:

- does not create the JD requirement model
- does not compute requirement coverage
- does not optimize writing style
- does not evaluate overall product quality

Inputs:

- Coverage Matrix
- evidence bank
- candidate facts
- generated CV text
- writing plan

Outputs:

- approved claims
- rejected claims
- generated claim instances
- sentence-to-claim mapping
- unsupported claim list
- claim confidence
- claim risk level

Persistence requirements:

- persist per CV version
- store content hash
- store claim IDs
- store evidence IDs
- store sentence IDs
- store approval status
- store retirement status

Versioning requirements:

- new ledger version for every generated or repaired CV version
- repair must preserve prior claim lineage
- export must reference the ledger version

Producers:

- claim planning runtime
- post-generation claim extraction runtime

Consumers:

- Writer via approved claims
- Product Quality Evaluator
- Repair
- Export
- Interview preparation

### 4.4 Product Quality Evaluator

Primary responsibility:

Evaluate whether the final CV is good enough and explain why.

Business purpose:

Measure output quality rather than process completion.

Boundaries:

- owns quality scoring
- owns metric-level explanations
- owns pass/fail thresholds
- owns regression comparison
- owns quality failure actions

Non-responsibilities:

- does not write CV text
- does not approve claims
- does not modify evidence
- does not perform repair
- does not render export files

Inputs:

- final CV
- Requirement Model
- Coverage Matrix
- Claim Ledger
- exported artifact metadata if available
- baseline scores if regression is being evaluated

Outputs:

- metric scores
- score explanations
- product quality decision
- blocking failures
- recommended repair focus
- regression result

Persistence requirements:

- persist per CV version and ledger version
- store score values
- store explanations
- store thresholds
- store pass/fail decision
- store baseline comparison when applicable

Versioning requirements:

- new evaluation when CV content changes
- new evaluation when Claim Ledger changes
- new evaluation when scoring rubric changes

Producers:

- quality evaluation runtime

Consumers:

- user-facing quality report
- Repair
- Export gating
- regression evaluation
- future product roadmap decisions

## 5. Minimal Runtime Data Model

The minimum complete model:

| Object | Purpose | Owner |
|---|---|---|
| JobSnapshot | Immutable JD input. | Requirement Model |
| RequirementGroup | Logical group of related requirements. | Requirement Model |
| Requirement | Atomic hiring requirement. | Requirement Model |
| HiringSignal | Inferred recruiter/manager signal. | Requirement Model |
| Keyword | JD-derived searchable term. | Requirement Model |
| EvidenceRef | Reference to candidate evidence. | Coverage Matrix |
| CoverageRow | Requirement-to-evidence support record. | Coverage Matrix |
| MissingEvidence | Required evidence not present. | Coverage Matrix |
| CapabilityGap | Hiring risk caused by missing or weak evidence. | Coverage Matrix |
| WritingPlan | Minimal execution plan for Writer. | Claim Ledger / derived from Coverage |
| Claim | Approved or generated claim. | Claim Ledger |
| ClaimSource | Evidence support for a claim. | Claim Ledger |
| SentenceTrace | Mapping from CV sentence to claim IDs. | Claim Ledger |
| QualityMetric | One scored quality dimension. | Product Quality Evaluator |
| EvaluationResult | Full quality decision for a CV version. | Product Quality Evaluator |
| RepairInstruction | Quality failure translated into allowed repair focus. | Product Quality Evaluator / Repair consumer |

## 6. Runtime Execution Summary

```text
JD enters
→ Requirement Model is created
→ Evidence is mapped to requirements
→ Coverage Matrix is created
→ Claim Ledger approves safe claims
→ Writing Plan is derived
→ Writer generates CV text
→ Claim Ledger validates generated sentences
→ Product Quality Evaluator scores final CV
→ Repair receives bounded instructions if needed
→ Export uses only accepted CV + ledger + evaluation result
```

## 7. Minimum Boundaries

Logical runtime boundaries:

| Boundary | Why it exists |
|---|---|
| Requirement Runtime | Keep job interpretation independent from candidate evidence. |
| Coverage Runtime | Keep evidence support independent from writing. |
| Claim Runtime | Keep truth approval independent from Writer. |
| Writing Runtime | Execute approved writing plan only. |
| Evaluation Runtime | Judge final product quality independently. |
| Repair Runtime | Apply bounded changes from quality/review failures. |
| Export Runtime | Render accepted version without changing content truth. |

Only the first four are required domains. Writing, Repair, and Export are execution boundaries, not additional decision domains in this minimum architecture.

## 8. Final Validation

1. Could another engineer implement the runtime solely from these documents?

YES. The documents define domains, data objects, ownership, flow, interactions, Writer contract, and evaluation metrics.

2. Does every runtime domain have exactly one primary responsibility?

YES. Requirement Model models the job. Coverage Matrix models support. Claim Ledger models claims. Product Quality Evaluator models quality.

3. Has Writer become an execution engine instead of a decision engine?

YES. Writer consumes a Writing Plan and approved claims; it may not decide positioning, evidence selection, claim safety, or quality.

4. Can every generated CV sentence be traced back to approved evidence?

YES. SentenceTrace links generated sentences to approved Claim IDs, and each Claim links to ClaimSource evidence.

5. Can Product Quality Evaluator explain why a CV is good or bad instead of only assigning a score?

YES. Every QualityMetric requires score, threshold, explanation, and failure action.
