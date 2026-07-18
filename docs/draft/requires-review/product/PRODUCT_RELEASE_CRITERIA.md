Status: DRAFT
Authority: REFERENCE
Can Authorize Production Implementation: NO
Does Not Override: docs/architecture/CURRENT_ARCHITECTURE.md
Reason for Draft Status: No approval or activation evidence is recorded.
Required Decision Before Activation: Owner approval of release criteria.

# Product Release Criteria

## 1. Purpose

A release must never be approved only because tests pass.

A release is approved only when it proves that generated artifacts remain truthful, traceable, high-quality, and likely to improve interview outcomes.

## 2. Release Gate Inputs

Every release decision requires:

- validation run ID
- dataset version
- cases evaluated
- generated artifacts
- Requirement Model outputs
- Coverage Matrix outputs
- Claim Ledger outputs
- Product Quality Evaluation outputs
- regression comparison
- explanation completeness report

## 3. Minimum Quality Criteria

| Criterion | Release threshold |
|---|---:|
| Product Quality Score | >= 4.0 |
| Truth Safety Score | >= 4.5 |
| Interview Probability Score | >= 3.8 |
| Requirement Coverage | >= 4.0 |
| Evidence Strength | >= 4.0 |
| Truthfulness | >= 4.5 |
| Claim Traceability | >= 4.5 |
| Unsupported Claim Risk | >= 4.5 |
| Interview Readiness | >= 3.8 |

## 4. Maximum Claim Risk

Release is blocked if:

- any fabricated claim exists
- any high-risk unsupported claim exists
- any unsupported ownership claim exists
- any unsupported quota, sales, deal, customer-facing, leadership, architecture, seniority, or technical-depth claim exists
- any critical capability gap is hidden as strength

## 5. Minimum Coverage

Release requires:

- 100% of critical requirements have explicit coverage status
- no critical supported requirement omitted from final artifact
- all missing critical evidence is represented as missing
- transferable evidence is not represented as direct evidence

## 6. Minimum Traceability

Release requires:

- at least 95% of claim-bearing sentences trace to approved Claim IDs
- 100% of top-section claim-bearing sentences trace to approved Claim IDs
- every approved Claim has at least one ClaimSource
- every ClaimSource references an EvidenceRef
- untraced sentences are classified as non-claim or unsupported

## 7. Maximum Unsupported Claims

Release requires:

- maximum fabricated claims: 0
- maximum high-risk unsupported claims: 0
- maximum material unsupported claims: 0
- maximum low-risk ambiguous claims: allowed only if explained and non-blocking

Unsupported claim count must not increase against the previous accepted baseline.

## 8. Required Explanation Completeness

Every warning or failed metric must include:

- why it failed
- evidence supporting failure
- affected sections
- affected requirements
- affected claims
- business impact
- interview impact
- repair recommendation
- confidence

Release is blocked if explanation completeness is below 100% for blocking or failed metrics.

## 9. Regression Criteria

Release is blocked if:

- Product Quality Score drops by 0.2 or more
- Interview Probability Score drops by 0.2 or more
- Truth Safety Score drops below threshold
- unsupported claim count increases
- traceability decreases below threshold
- critical coverage decreases
- quality regression cannot be attributed to a runtime decision

## 10. Dataset Coverage Requirement

Release validation must include:

- Good Fit case
- Risky Fit case
- Weak Fit case
- at least one Hard or Adversarial case
- at least one traceability-sensitive case
- output-specific case when releasing a non-resume artifact type

## 11. Release Decisions

Allowed decisions:

| Decision | Meaning |
|---|---|
| RELEASE APPROVED | All thresholds pass; no blocking risk. |
| RELEASE APPROVED WITH OBSERVATIONS | Thresholds pass; non-blocking issues are explained. |
| RELEASE REJECTED | Any blocking threshold fails. |
| RELEASE BLOCKED — INSUFFICIENT VALIDATION | Required validation evidence is missing. |

## 12. Product Owner Dashboard Information

Product owners need these fields:

- release candidate ID
- dataset version
- cases evaluated
- Product Quality Score trend
- Truth Safety Score trend
- Interview Probability Score trend
- Requirement Coverage trend
- Claim Traceability trend
- Unsupported Claim Risk trend
- Repair Count trend
- Confidence trend
- regression list
- runtime decision attribution
- blocking failures
- release recommendation

No UI design is implied.

## 13. Runtime Metrics Required for Release

| Runtime | Required metrics |
|---|---|
| Requirement Runtime | requirement count, critical requirement count, keyword count, inferred signal confidence, requirement version |
| Coverage Runtime | coverage rate, critical coverage rate, missing critical evidence count, transferable evidence count, coverage version |
| Claim Runtime | approved claim count, unsupported claim count, high-risk claim count, traceability percentage, claim ledger version |
| Quality Runtime | all metric scores, explanations, blocking failures, confidence, evaluation version |
| Writer | required claim usage rate, unplanned sentence count, writer warnings, omitted required claims |
| Repair | repair attempts, repaired issue count, unresolved issue count, new unsupported claims, human input required |
| Export | export hash match, channel compatibility score, stale evaluation flag, export warning count |

## 14. Future Output Release Criteria

Truth, traceability, evidence strength, and explanation completeness are mandatory for every output.

Output-specific additions:

| Output | Additional release concern |
|---|---|
| Resume | ATS parse safety and recruiter scan quality. |
| LinkedIn | public profile discoverability and professional brand consistency. |
| Cover Letter | company relevance and motivation credibility. |
| Portfolio | proof artifact quality and project traceability. |
| Interview Preparation | answer defensibility and gap rehearsal quality. |
| Career Advisor | recommendation confidence and long-term evidence grounding. |

## 15. Release Principle

Passing tests proves the system runs.

Passing Product Release Criteria proves the system produces better career artifacts.

Only the second can approve a product release.
