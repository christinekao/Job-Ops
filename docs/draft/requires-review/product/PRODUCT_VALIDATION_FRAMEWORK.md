Status: DRAFT
Authority: REFERENCE
Can Authorize Production Implementation: NO
Does Not Override: docs/architecture/CURRENT_ARCHITECTURE.md
Reason for Draft Status: No approval or activation evidence is recorded.
Required Decision Before Activation: Owner approval of validation framework.

# Product Validation Framework

## 1. Purpose

This framework determines whether the product generates a better, truthful, interview-winning career artifact.

The product goal is:

```text
Maximize interview probability while remaining completely truthful.
```

This framework validates business value. It does not validate governance completeness, architecture elegance, prompt quality, or test coverage by themselves.

## 2. Scope

This framework applies to:

- Resume
- LinkedIn
- Cover Letter
- Portfolio
- Interview Preparation
- future career advisor outputs

The initial artifact is Resume/CV, but the validation model is artifact-neutral.

## 3. Success Definition

### 3.1 Business Success

Business Success means the product increases the likelihood that a candidate receives relevant interview opportunities.

Measures:

- Interview Probability score improves or remains above release threshold.
- Critical role requirements are covered when evidence exists.
- Unsupported claim risk remains below blocking threshold.
- Real-world outcomes improve over time: callbacks, interviews, recruiter responses, user-reported application success.

Business Success is the highest-level success measure.

### 3.2 User Success

User Success means the user receives a stronger, truthful artifact and understands its risks.

Measures:

- user can see what is strong
- user can see what is weak
- user can defend every visible claim
- user understands capability gaps
- user knows what to improve before interview

User Success fails if the artifact is persuasive but creates interview risk the user cannot defend.

### 3.3 System Success

System Success means the runtime produces traceable, reproducible validation evidence.

Measures:

- Requirement Model exists
- Coverage Matrix exists
- Claim Ledger exists
- Product Quality Evaluation exists
- every visible claim is traceable or marked unsupported
- each score includes explanation and evidence

System Success supports Business Success but does not replace it.

### 3.4 Model Success

Model Success means AI reasoning improves product quality within evidence boundaries.

Measures:

- AI improves narrative, readability, and interview probability
- AI does not increase unsupported claims
- AI does not hide capability gaps
- AI outputs remain explainable through runtime artifacts

Model Success fails if fluent writing weakens truthfulness or traceability.

### 3.5 Runtime Success

Runtime Success means the four runtime domains expose the metrics needed for validation.

Measures:

- Requirement Runtime exposes requirement priority and criticality
- Coverage Runtime exposes support status and missing evidence
- Claim Runtime exposes claim support, risk, and sentence trace
- Quality Runtime exposes metric scores, explanations, thresholds, and recommendations

Runtime Success is necessary for objective validation.

### 3.6 Relationship Between Success Types

```text
Runtime Success
→ System Success
→ Model Success
→ User Success
→ Business Success
```

If Runtime Success fails, the product cannot prove Business Success.

If Business Success fails, lower-level success is insufficient.

## 4. Minimum Complete Quality Model

The minimum complete quality dimensions are:

| Dimension | Why it is required |
|---|---|
| Requirement Coverage | Ensures the artifact addresses the actual job. |
| Evidence Strength | Ensures important claims are backed by strong enough evidence. |
| Truthfulness | Ensures the product never fabricates or exaggerates. |
| Claim Traceability | Ensures every claim can be audited. |
| Unsupported Claim Risk | Ensures dangerous claims are blocked. |
| Positioning Consistency | Ensures the artifact follows approved strategy. |
| Business Readability | Ensures business value is clear. |
| Technical Readability | Ensures technical credibility is clear and accurate. |
| Narrative Quality | Ensures the artifact tells a coherent story. |
| ATS / Channel Compatibility | Ensures the artifact works in its delivery channel. |
| Keyword Quality | Ensures supported keywords are present without stuffing. |
| Interview Readiness | Ensures the candidate can defend the artifact. |
| Completeness | Ensures critical sections and required proof are not missing. |
| Gap Transparency | Ensures truthful gaps are visible to the user. |
| Confidence | Ensures score reliability is explicit. |
| Interview Probability | Aggregates expected hiring-funnel impact. |

This is the minimum model because removing any dimension creates a blind spot:

- remove coverage: the artifact may miss the job
- remove evidence strength: weak proof may be overused
- remove truthfulness: the artifact can become unsafe
- remove traceability: the product cannot explain itself
- remove readability: the artifact may be correct but ineffective
- remove interview readiness: the artifact may create interview traps
- remove confidence: product owners cannot know how reliable the score is

## 5. Explanation Model

The evaluator must never output only scores.

Every failed or warning metric must include:

- why it failed
- evidence supporting the failure
- affected sections
- affected requirements
- affected claims
- business impact
- interview impact
- repair recommendation
- whether human input is required
- confidence level

Failure explanation format:

```text
Metric:
Status:
Score:
Threshold:
Why it failed:
Evidence:
Affected sections:
Affected requirements:
Affected claims:
Business impact:
Interview impact:
Repair recommendation:
Human input required:
Confidence:
```

## 6. Real-World Validation Process

Each validation run must use real or realistic Job Descriptions.

For every run define:

- JD
- Evidence Bank
- Expected Positioning
- Expected Claims
- Expected Coverage
- Expected Missing Evidence
- Expected Narrative
- Expected Quality
- Expected Failure Modes

Validation sequence:

```text
JD
→ Evidence Bank
→ Requirement Model
→ Coverage Matrix
→ Claim Ledger
→ Writer output
→ Product Quality Evaluation
→ Repair if required
→ Final artifact
→ Regression comparison
```

The result must answer:

- Is this artifact better than the previous accepted version?
- Why is it better or worse?
- Which runtime decision caused the change?
- Is it safe to release or export?

## 7. Runtime Decision Attribution

Every quality improvement or regression must be attributed to at least one runtime decision source:

| Runtime source | Example quality impact |
|---|---|
| Requirement Model | missed hard requirement, wrong priority, better role interpretation |
| Coverage Matrix | better evidence mapping, missing evidence surfaced, transferable evidence correctly used |
| Claim Ledger | unsupported claim blocked, sentence trace improved, risky metric removed |
| Writer | clearer wording, stronger summary, better narrative execution |
| Repair | fixed affected section without changing approved strategy |
| Export | improved ATS/channel compatibility |
| Quality Evaluator | detected regression or explained gap |

If attribution is impossible, the validation result must be marked insufficient.

## 8. Real-World Outcome Feedback

When available, real outcomes should be recorded:

- submitted date
- artifact version
- role
- company type
- callback
- recruiter response
- interview invitation
- rejection
- user-reported feedback
- user edits after generation

Outcome feedback must not automatically rewrite evidence or scoring rules. It informs future calibration.

## 9. Future Output Reuse

The same validation model applies across outputs:

| Output | Shared dimensions | Output-specific dimensions |
|---|---|---|
| Resume | coverage, evidence, truthfulness, traceability, readability, interview readiness | ATS compatibility, resume completeness |
| LinkedIn | coverage, evidence, truthfulness, positioning, narrative | profile discoverability, public credibility |
| Cover Letter | coverage, evidence, truthfulness, narrative | motivation relevance, company alignment |
| Portfolio | evidence, traceability, business/technical readability | project proof quality, artifact credibility |
| Interview Prep | claims, gaps, readiness, confidence | answer defensibility, risk rehearsal |
| Career Advisor | evidence, gaps, outcomes, confidence | long-term gap prioritization |

## 10. Implementation Readiness Metrics

Runtime metrics required:

| Runtime | Metrics required |
|---|---|
| Requirement Runtime | requirement count, hard requirement count, priority distribution, keyword list, inferred signal confidence |
| Coverage Runtime | coverage rate, direct coverage rate, transferable coverage rate, missing critical evidence count, evidence strength distribution |
| Claim Runtime | approved claim count, unsupported claim count, high-risk claim count, sentence trace coverage, claim confidence distribution |
| Quality Runtime | metric scores, thresholds, explanations, blocking failures, confidence, recommendations |
| Writer | required claim usage rate, unplanned sentence count, omitted required claim count, writer warning count |
| Repair | repair count, repaired metric IDs, new unsupported claims, unresolved failures, human-input-required count |
| Export | artifact hash match, parse compatibility, stale evaluation status, export warnings |

## 11. Final Validation Answers

1. Can we objectively determine whether a CV is better than yesterday's version?

YES. Compare Product Quality Score, dimension scores, unsupported claim risk, traceability, coverage, and interview probability against the previous accepted baseline.

2. Can we explain why it is better?

YES. Every score requires explanation, evidence, affected sections, business impact, interview impact, and recommendation.

3. Can we identify exactly which runtime decision caused quality improvements or regressions?

YES. Validation requires attribution to Requirement Model, Coverage Matrix, Claim Ledger, Writer, Repair, Export, or Quality Evaluator. If attribution is impossible, the result is insufficient.

4. Can product owners approve or reject a release using only this framework?

YES. Release criteria define minimum quality, maximum claim risk, coverage, traceability, unsupported claim, and explanation completeness thresholds.
