Status: DRAFT
Authority: REFERENCE
Can Authorize Production Implementation: NO
Does Not Override: docs/architecture/CURRENT_ARCHITECTURE.md
Reason for Draft Status: No approval or activation evidence is recorded.
Required Decision Before Activation: Owner approval of scorecard authority.

# Quality Scorecard v2

## 1. Purpose

Quality Scorecard v2 defines the runtime scorecard used to judge whether a generated career artifact is truthful, high-quality, and likely to increase interview probability.

Scores are not enough. Every score must include explanation and evidence.

## 2. Scoring Scale

Each metric is scored from 0 to 5.

| Score | Meaning |
|---:|---|
| 5 | Excellent; no material weakness. |
| 4 | Strong; minor weakness only. |
| 3 | Usable but meaningfully improvable. |
| 2 | Weak; likely reduces hiring outcome. |
| 1 | Serious quality issue. |
| 0 | Failing, unsafe, or misleading. |

Metric status:

- `PASS`
- `WARNING`
- `FAIL`
- `BLOCKED`

## 3. Scorecard Dimensions

| Dimension | Purpose | Measurement | Weight | Failure Threshold | Blocking Threshold | Explanation Requirement | Improvement Recommendation |
|---|---|---|---:|---:|---:|---|---|
| Requirement Coverage | Check whether the artifact addresses important role requirements. | Critical/high requirements visibly addressed with direct or transferable evidence. | 12% | < 4.0 | < 3.0 or critical supported requirement omitted | list missing/weak requirements and evidence status | add supported evidence, reorder content, or disclose gap |
| Evidence Strength | Check whether visible claims rely on strong enough evidence. | ClaimSources support level and evidence confidence. | 10% | < 4.0 | < 3.0 for any top-section claim | cite weak claims and source confidence | weaken claim or replace with stronger evidence |
| Truthfulness | Check whether artifact stays within evidence. | unsupported/fabricated/contradictory claim review. | 12% | < 4.5 | any fabrication or material contradiction | identify exact claim and contradiction | remove, weaken, or request evidence |
| Claim Traceability | Check whether claims can be audited. | percentage of claim-bearing sentences mapped to approved Claims and EvidenceRefs. | 10% | < 4.5 | traceability < 95% for claim-bearing sentences | list untraced sentences | map to claims or mark unsupported/non-claim |
| Unsupported Claim Risk | Check severity and count of unsupported claims. | unsupported claim count, risk level, affected section. | 10% | any new unsupported claim | high-risk unsupported claim | list each unsupported claim and risk type | remove or rewrite within approved claim boundary |
| Positioning Consistency | Check whether output follows approved positioning. | alignment between WritingPlan, summary, bullets, skills, and gaps. | 7% | < 4.0 | positioning contradicts approved strategy | identify conflicting sections | revise affected sections only |
| Business Readability | Check whether business value is clear. | outcome clarity, business impact, scope clarity. | 6% | < 3.8 | top third has no business value signal | cite vague/task-only sections | rewrite using approved impact claims |
| Technical Readability | Check whether technical credibility is clear. | supported skills, technical depth, seniority accuracy. | 6% | < 4.0 | unsupported technical depth claim | identify unsupported or unclear technical claims | clarify, reorder, or weaken technical wording |
| Narrative Quality | Check whether artifact tells a coherent story. | summary-to-bullets-to-skills coherence. | 5% | < 4.0 | narrative conflicts with positioning | identify story breakpoints | align summary and top evidence |
| ATS / Channel Compatibility | Check whether artifact works in target channel. | parse-safe structure, headings, keyword visibility, format constraints. | 5% | < 4.0 | parse failure or stale export | show parse/channel issue | adjust formatting or export format |
| Keyword Quality | Check supported keyword use without stuffing. | critical supported keywords present, unsupported keywords absent. | 5% | < 4.0 | unsupported keyword presented as experience | list missing/suspicious keywords | add only evidence-supported keywords |
| Interview Readiness | Check whether candidate can defend artifact. | claim defensibility, gap awareness, likely interview risk. | 6% | < 3.8 | top claim not defensible | identify interview trap | remove risky claim or add prep note |
| Completeness | Check whether required artifact sections and proof are present. | required sections, expected claims, expected evidence. | 3% | < 4.0 | missing required section or critical proof | list missing sections/proof | add section or supported content |
| Gap Transparency | Check whether truthful gaps are visible to user. | capability gaps represented in notes/report, not fabricated away. | 3% | < 4.0 | critical gap hidden as strength | identify hidden gap | disclose risk or reposition |
| Confidence | Check reliability of evaluation. | input completeness, traceability, evaluator certainty, evidence quality. | 3% | < 3.5 | cannot validate truthfulness or coverage | state uncertainty source | collect evidence or rerun validation |

Total weight: 100%.

## 4. Composite Scores

### 4.1 Product Quality Score

Weighted average of all dimensions.

Minimum release threshold:

- `>= 4.0`

### 4.2 Truth Safety Score

Composite of:

- Truthfulness
- Claim Traceability
- Unsupported Claim Risk
- Evidence Strength

Minimum release threshold:

- `>= 4.5`

Blocking:

- any fabricated claim
- any high-risk unsupported claim
- claim traceability below 95%

### 4.3 Interview Probability Score

Composite of:

- Requirement Coverage
- Evidence Strength
- Positioning Consistency
- Business Readability
- Technical Readability
- Narrative Quality
- Interview Readiness
- ATS / Channel Compatibility

Minimum release threshold:

- `>= 3.8`

## 5. Failure Explanation Contract

Every failed or warning metric must include:

- metric name
- score
- threshold
- status
- why it failed
- evidence supporting the failure
- affected sections
- affected claims
- affected requirements
- business impact
- interview impact
- recommended improvement
- whether repair is possible
- whether human input is required

## 6. Blocking Rules

The artifact is blocked if:

- any fabricated claim exists
- any high-risk unsupported claim exists
- unsupported claim count increases against baseline
- Truthfulness score is below 4.5
- Claim Traceability score is below 4.5
- claim-bearing sentence traceability is below 95%
- critical supported requirement is omitted
- critical capability gap is hidden as strength
- evaluation confidence is too low to judge truthfulness

## 7. Regression Rules

A new version regresses if:

- Product Quality Score drops by 0.2 or more
- Truth Safety Score drops by any amount below release threshold
- Interview Probability Score drops by 0.2 or more
- unsupported claim count increases
- traceability decreases by more than 2 percentage points
- critical coverage decreases
- any blocking rule is triggered

## 8. Improvement Rules

A new version improves if:

- no blocking rule is triggered
- Product Quality Score improves by at least 0.1, or
- Interview Probability Score improves by at least 0.1, or
- unsupported claim risk decreases while quality remains stable, or
- traceability improves while quality remains stable

## 9. Output-Specific Adjustments

| Output | Required adjustments |
|---|---|
| Resume | ATS / Channel Compatibility applies to ATS parse safety. |
| LinkedIn | ATS becomes profile/channel discoverability. |
| Cover Letter | Requirement Coverage emphasizes motivation and company fit. |
| Portfolio | Evidence Strength emphasizes project proof and artifact credibility. |
| Interview Preparation | Interview Readiness weight increases; ATS weight becomes not applicable. |
| Career Advisor | Future gap quality and recommendation confidence are added. |

The core truth and traceability dimensions remain mandatory for every output.
