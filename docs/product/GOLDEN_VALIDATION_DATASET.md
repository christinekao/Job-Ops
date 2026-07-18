# Golden Validation Dataset

## 1. Purpose

The Golden Validation Dataset is the permanent benchmark set used to determine whether the product is improving.

It must answer:

```text
Given the same JD and Evidence Bank, did the new system produce a better, truthful, more interview-worthy artifact?
```

## 2. Case Structure

Each case must include:

- JD
- Evidence Bank
- Expected Positioning
- Expected Claims
- Expected Coverage
- Expected Missing Evidence
- Expected Narrative
- Expected Quality
- Expected Failure Modes

Recommended case folder:

```text
golden-validation-dataset/
  <case-id>/
    case.json
    jd.md
    evidence-bank.md
    expected-positioning.md
    expected-claims.json
    expected-coverage.json
    expected-missing-evidence.md
    expected-narrative.md
    expected-quality.json
    expected-failure-modes.md
    baseline-results/
```

This document defines the dataset. It does not create benchmark cases.

## 3. Required Case Metadata

`case.json` should include:

```json
{
  "caseId": "case-azure-solution-specialist-weak-fit",
  "caseName": "Azure Solution Specialist — Weak Fit",
  "outputType": "resume",
  "industry": "cloud technology",
  "roleFamily": "sales / solution specialist",
  "seniority": "mid-senior",
  "difficulty": "hard",
  "fitType": "weak",
  "status": "active",
  "datasetVersionAdded": "1.0.0",
  "lastReviewedAt": "YYYY-MM-DD"
}
```

## 4. Expected Positioning

Defines the truthful strategy expected for the case.

Required fields:

- overall fit
- primary positioning
- transferable strengths
- claims to emphasize
- claims to avoid
- gap transparency requirement
- expected interview risk

## 5. Expected Claims

Defines claim-level expectations.

Required fields:

- approved claims
- rejected claims
- claims requiring human input
- claim type
- evidence IDs
- support type
- confidence
- allowed visible locations

Purpose:

This lets validation determine whether Writer produced text from approved decisions rather than inventing strategy.

## 6. Expected Coverage

Defines requirement coverage expectations.

Required fields:

- requirement ID
- requirement priority
- expected coverage status: direct, transferable, weak, missing, not applicable
- expected evidence IDs
- expected support strength
- expected handling

## 7. Expected Missing Evidence

Defines evidence that should remain missing unless the user supplies new proof.

Required fields:

- missing requirement
- severity
- forbidden claim
- expected gap handling
- whether human input may resolve it

## 8. Expected Narrative

Defines what the artifact should communicate.

Required fields:

- summary strategy
- top achievement pattern
- business story
- technical story
- gap handling
- tone
- forbidden narrative patterns

## 9. Expected Quality

Defines target score ranges and blocking rules.

Example:

```json
{
  "minimumProductQualityScore": 4.0,
  "minimumTruthSafetyScore": 4.5,
  "minimumInterviewProbabilityScore": 3.8,
  "minimumTraceability": 0.95,
  "maximumUnsupportedClaims": 0,
  "requiredMetricMinimums": {
    "Requirement Coverage": 4.0,
    "Evidence Strength": 4.0,
    "Truthfulness": 4.5,
    "Claim Traceability": 4.5,
    "Unsupported Claim Risk": 4.5,
    "Interview Readiness": 3.8
  }
}
```

## 10. Expected Failure Modes

Each case must define likely failure modes.

Examples:

- unsupported direct-fit positioning
- invented ownership
- missing critical supported evidence
- keyword stuffing
- weak summary
- hidden capability gap
- poor traceability
- ATS/channel incompatibility
- narrative too generic
- interview trap

The evaluator should check these explicitly.

## 11. Case Difficulty Levels

| Difficulty | Definition |
|---|---|
| Easy | Strong direct evidence for most critical requirements. |
| Medium | Partial direct evidence and some transferable evidence. |
| Hard | Weak/risky fit with major gaps but usable transferable strengths. |
| Adversarial | High temptation to fabricate, keyword stuff, or over-position. |

Every release validation set must include at least one Hard or Adversarial case.

## 12. Industry Coverage

Dataset should gradually cover:

- cloud technology
- AI / data / analytics
- software engineering
- product operations
- sales / customer-facing roles
- business operations
- nonprofit / education if relevant
- startup and enterprise contexts

## 13. Role Coverage

Dataset should include:

- strong-fit technical role
- risky-fit hybrid role
- weak-fit sales or solution role
- operations role
- AI evaluation / product quality role
- manager or leadership role
- ATS-heavy corporate role
- narrative-heavy startup role

## 14. Adding Cases

A case may be added when:

- it represents a new product risk
- expected claims and coverage can be defined
- failure modes are known
- baseline output can be recorded
- case does not duplicate an existing benchmark

New cases must be reviewed for:

- evidence sufficiency
- scoring clarity
- realistic JD quality
- expected failure modes

## 15. Retiring Cases

A case may be retired when:

- JD is no longer realistic
- evidence fixture is obsolete
- expected outcomes are ambiguous
- case duplicates better coverage from newer cases
- role family is no longer relevant

Retired cases should remain archived for historical comparison.

## 16. Regression Policy

Every product-impacting change must run against the selected validation set.

Minimum regression set:

- one Good Fit case
- one Risky Fit case
- one Weak Fit case
- one traceability-sensitive case
- one ATS/channel-sensitive case when output is resume

Regression fails if:

- unsupported claim count increases
- high-risk unsupported claim appears
- traceability drops below threshold
- Product Quality Score drops by 0.2 or more
- Interview Probability Score drops by 0.2 or more
- critical supported requirement disappears
- capability gap is hidden as strength

## 17. Baseline Policy

Baseline promotion requires:

- no blocking failures
- no unsupported claim increase
- equal or better Truth Safety Score
- equal or better traceability
- equal or better Product Quality Score or justified tradeoff
- explanation completeness pass

Baseline updates must record:

- old baseline ID
- new baseline ID
- score deltas
- runtime decision attribution
- accepted tradeoffs

## 18. Permanent Dataset Rule

The Golden Validation Dataset is a product validation asset.

It is not a governance artifact.

Its purpose is to make product quality measurable over time.
