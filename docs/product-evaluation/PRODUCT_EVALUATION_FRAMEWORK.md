# Product Evaluation Framework

## 1. Purpose

This framework measures whether the CV Builder produces a better final CV.

The primary product question is:

> Does each system change produce a better CV that increases interview probability?

This framework evaluates output quality, not governance completeness and not process correctness.

## 2. Evaluation Scope

The framework evaluates the complete pipeline output:

```text
JD
→ Evidence Selection
→ Writer
→ Reviewer
→ Repair
→ Export
→ Final CV
```

The unit under evaluation is a final CV generated for one benchmark JD and one candidate evidence set.

Intermediate artifacts may be inspected only to explain the score. The score is assigned to the final product output.

## 3. Scoring Model

Each dimension is scored from 0 to 5.

| Score | Meaning |
|---:|---|
| 5 | Excellent; recruiter-ready with no material weakness in this dimension. |
| 4 | Strong; minor weakness that should not reduce interview probability materially. |
| 3 | Acceptable; usable but clearly improvable. |
| 2 | Weak; likely reduces interview probability. |
| 1 | Poor; serious quality problem. |
| 0 | Failing; unusable or actively misleading. |

Each dimension has:

- objective criteria
- scoring rules
- pass/fail threshold
- regression threshold

## 4. Weighted Product Score

The overall Product Quality Score is a weighted average.

| Dimension | Weight |
|---|---:|
| Truthfulness | 12% |
| Unsupported Claims | 10% |
| Evidence Coverage | 9% |
| Missing Critical Evidence | 8% |
| Positioning Consistency | 8% |
| Interview Probability | 8% |
| HR Readability | 6% |
| Hiring Manager Readability | 6% |
| ATS Compatibility | 6% |
| Keyword Coverage | 5% |
| Capability Gap Transparency | 5% |
| Quantified Achievement Quality | 4% |
| Executive Summary Quality | 4% |
| Technical Skill Presentation | 4% |
| Business Impact Clarity | 5% |

Default pass threshold:

- Product Quality Score must be `>= 4.0 / 5.0`
- Truthfulness must be `>= 4.5`
- Unsupported Claims must be `>= 4.5`
- Interview Probability must be `>= 3.8`

Hard fail:

- Any fabricated claim
- Any unsupported ownership claim for quota, sales ownership, architecture ownership, leadership, customer-facing responsibility, or enterprise deal ownership
- Any final CV that contradicts known candidate evidence
- Any export-ready CV with a critical unsupported claim

## 5. Evaluation Dimensions

### 5.1 HR Readability

Objective:

Measure whether a recruiter can quickly understand the candidate’s relevance.

Criteria:

- clear role fit within first 10 seconds
- concise summary
- readable section structure
- no dense or confusing wording
- role-relevant terms appear naturally

Scoring:

| Score | Rule |
|---:|---|
| 5 | Clear, concise, immediately role-relevant. |
| 4 | Strong readability with minor wording issues. |
| 3 | Understandable but not optimized for quick screening. |
| 2 | Hard to scan or relevance is unclear. |
| 1 | Confusing, generic, or overly dense. |
| 0 | Recruiter cannot determine fit. |

Pass threshold: `>= 4.0`

Regression threshold:

- fail if score drops by `>= 0.3`
- fail if summary readability drops below `4.0`

### 5.2 Hiring Manager Readability

Objective:

Measure whether a hiring manager can understand skills, scope, outcomes, and relevance.

Criteria:

- role-relevant achievements are easy to assess
- work scope is clear
- skill claims are connected to evidence
- impact is concrete
- seniority is not exaggerated

Scoring:

| Score | Rule |
|---:|---|
| 5 | Strong evidence, clear scope, clear impact, easy to evaluate. |
| 4 | Mostly clear with minor gaps. |
| 3 | Understandable but lacks depth or structure. |
| 2 | Skills and outcomes are hard to assess. |
| 1 | Claims are vague or disconnected. |
| 0 | Hiring manager cannot evaluate capability. |

Pass threshold: `>= 4.0`

Regression threshold:

- fail if score drops by `>= 0.3`
- fail if evidence-to-claim clarity drops below `3.5`

### 5.3 ATS Compatibility

Objective:

Measure whether the CV is likely to be parsed and matched by applicant tracking systems.

Criteria:

- standard headings
- simple formatting
- no tables or layout that damages parsing
- JD keywords included truthfully
- skills are searchable
- dates, titles, and employers are clear

Scoring:

| Score | Rule |
|---:|---|
| 5 | ATS-safe structure and strong truthful keyword alignment. |
| 4 | ATS-safe with minor keyword or formatting gaps. |
| 3 | Parseable but not optimized. |
| 2 | Formatting or keyword gaps reduce match quality. |
| 1 | Likely parsing problems. |
| 0 | Not ATS-compatible. |

Pass threshold: `>= 4.0`

Regression threshold:

- fail if score drops by `>= 0.2`
- fail if any formatting change makes the exported CV less parseable

### 5.4 Evidence Coverage

Objective:

Measure how much of the strongest available candidate evidence appears in the CV.

Criteria:

- high-value evidence is included
- included evidence matches JD priorities
- evidence is not buried
- repeated evidence is minimized
- transferable evidence is used when direct evidence is missing

Scoring:

| Score | Rule |
|---:|---|
| 5 | All critical and most high-value evidence is used well. |
| 4 | Most important evidence is included. |
| 3 | Some useful evidence is missing or weakly placed. |
| 2 | Major relevant evidence is omitted. |
| 1 | Evidence selection is poor. |
| 0 | CV is not grounded in available evidence. |

Pass threshold: `>= 4.0`

Regression threshold:

- fail if score drops by `>= 0.3`
- fail if any expected critical evidence disappears without a documented reason

### 5.5 Keyword Coverage

Objective:

Measure whether important JD keywords are included when supported by evidence.

Criteria:

- critical JD keywords are covered truthfully
- synonyms are acceptable when recruiter-readable
- unsupported keywords are not forced
- missing keywords are explained when evidence is absent

Scoring:

| Score | Rule |
|---:|---|
| 5 | Strong truthful coverage of critical keywords. |
| 4 | Good coverage with minor omissions. |
| 3 | Adequate but misses some searchable terms. |
| 2 | Major supported keywords missing. |
| 1 | Poor keyword alignment. |
| 0 | Keyword stuffing or unsupported keyword claims. |

Pass threshold: `>= 4.0`

Regression threshold:

- fail if critical supported keyword coverage drops by `>= 10 percentage points`
- fail if unsupported keyword insertion increases

### 5.6 Positioning Consistency

Objective:

Measure whether the CV follows the expected positioning for the role.

Criteria:

- summary, bullets, skills, and report align
- fit tier influences wording appropriately
- transferable positioning is used when direct fit is weak
- no section overstates the candidate

Scoring:

| Score | Rule |
|---:|---|
| 5 | Fully consistent and strategically coherent. |
| 4 | Mostly consistent with minor wording drift. |
| 3 | Acceptable but uneven. |
| 2 | Positioning conflicts across sections. |
| 1 | Misleading or unstable positioning. |
| 0 | Positioning contradicts analysis or evidence. |

Pass threshold: `>= 4.0`

Regression threshold:

- fail if score drops by `>= 0.3`
- fail if any section contradicts expected positioning

### 5.7 Truthfulness

Objective:

Measure whether every CV claim is supported by available evidence.

Criteria:

- no fabricated experience
- no exaggerated ownership
- no unsupported seniority
- no unsupported technical or business scope
- transferable experience is labeled honestly

Scoring:

| Score | Rule |
|---:|---|
| 5 | Fully evidence-backed. |
| 4 | Minor ambiguity, no material unsupported claim. |
| 3 | Some vague wording needs tightening. |
| 2 | Material claim is weakly supported. |
| 1 | Serious unsupported claim. |
| 0 | Fabrication or contradiction. |

Pass threshold: `>= 4.5`

Regression threshold:

- fail on any new unsupported claim
- fail if score drops by any amount below `4.5`

### 5.8 Missing Critical Evidence

Objective:

Measure whether the CV fails to include evidence that is both available and critical to the JD.

Criteria:

- expected evidence from the golden case is present
- critical role requirements are addressed where evidence exists
- missing evidence is not masked by generic wording

Scoring:

| Score | Rule |
|---:|---|
| 5 | No critical available evidence is missing. |
| 4 | One minor omission. |
| 3 | One moderate omission. |
| 2 | Multiple important omissions. |
| 1 | Critical evidence missing. |
| 0 | CV omits most relevant evidence. |

Pass threshold: `>= 4.0`

Regression threshold:

- fail if any expected critical evidence is removed
- fail if score drops by `>= 0.3`

### 5.9 Unsupported Claims

Objective:

Measure whether the CV contains claims not supported by evidence.

Criteria:

- unsupported claim count
- unsupported claim severity
- whether claim affects role fit
- whether claim is likely to mislead recruiter or interviewer

Scoring:

| Score | Rule |
|---:|---|
| 5 | Zero unsupported claims. |
| 4 | Minor wording ambiguity, no factual overclaim. |
| 3 | One low-severity unsupported implication. |
| 2 | One material unsupported claim. |
| 1 | Multiple material unsupported claims. |
| 0 | Fabrication or repeated unsupported ownership claims. |

Pass threshold: `>= 4.5`

Regression threshold:

- fail if unsupported claim count increases
- fail on any new high-severity unsupported claim

### 5.10 Capability Gap Transparency

Objective:

Measure whether real capability gaps are visible to the user without weakening truthful CV competitiveness.

Criteria:

- gaps are stated in Positioning Report or evaluation output
- gaps are not fabricated away
- CV wording avoids false claims while using transferable strengths
- user can understand interview risk

Scoring:

| Score | Rule |
|---:|---|
| 5 | Gaps are clear, truthful, and strategically handled. |
| 4 | Gaps are mostly clear. |
| 3 | Gaps are partially visible. |
| 2 | Gaps are vague or hidden. |
| 1 | Gaps are misleadingly minimized. |
| 0 | Gaps are converted into false strengths. |

Pass threshold: `>= 4.0`

Regression threshold:

- fail if a known critical gap is hidden
- fail if score drops by `>= 0.3`

### 5.11 Quantified Achievement Quality

Objective:

Measure whether achievements use useful numbers where evidence supports them.

Criteria:

- numbers are evidence-backed
- metrics clarify scale or impact
- numbers are not invented
- quantified bullets remain readable

Scoring:

| Score | Rule |
|---:|---|
| 5 | Strong, evidence-backed quantified achievements. |
| 4 | Good quantified achievements with minor gaps. |
| 3 | Some useful quantification. |
| 2 | Limited or weak quantification. |
| 1 | Mostly unquantified despite available metrics. |
| 0 | Invented or misleading numbers. |

Pass threshold: `>= 3.5`

Regression threshold:

- fail if evidence-backed quantified achievements are removed
- fail on any invented metric

### 5.12 Executive Summary Quality

Objective:

Measure whether the top summary sells the candidate truthfully and clearly.

Criteria:

- role alignment is clear
- strongest evidence appears early
- wording is concise
- summary does not overclaim
- summary creates a reason to keep reading

Scoring:

| Score | Rule |
|---:|---|
| 5 | Compelling, concise, truthful, and role-specific. |
| 4 | Strong with minor improvement possible. |
| 3 | Adequate but generic. |
| 2 | Weak or unclear. |
| 1 | Mispositioned or bloated. |
| 0 | Misleading or unusable. |

Pass threshold: `>= 4.0`

Regression threshold:

- fail if score drops by `>= 0.3`
- fail if summary introduces unsupported claim

### 5.13 Technical Skill Presentation

Objective:

Measure whether technical skills are presented clearly, truthfully, and in role-relevant order.

Criteria:

- skill list matches evidence
- critical supported skills are visible
- no unsupported tool/platform claims
- skills are grouped logically
- seniority implied by skills is accurate

Scoring:

| Score | Rule |
|---:|---|
| 5 | Clear, complete, truthful, role-relevant. |
| 4 | Strong with minor omissions. |
| 3 | Acceptable but not optimized. |
| 2 | Important skills missing or poorly organized. |
| 1 | Misleading or generic. |
| 0 | Unsupported technical claims. |

Pass threshold: `>= 4.0`

Regression threshold:

- fail if critical supported skills are removed
- fail if unsupported technical skills are added

### 5.14 Business Impact Clarity

Objective:

Measure whether the CV explains business value, not only tasks.

Criteria:

- bullets show outcomes
- achievements connect to business goals
- impact is credible and evidence-backed
- scope and audience are clear

Scoring:

| Score | Rule |
|---:|---|
| 5 | Business impact is clear and persuasive. |
| 4 | Good impact clarity with minor gaps. |
| 3 | Some impact but task-heavy. |
| 2 | Mostly duties without outcomes. |
| 1 | Vague activity list. |
| 0 | No business impact. |

Pass threshold: `>= 3.8`

Regression threshold:

- fail if score drops by `>= 0.3`
- fail if top bullets become task-only

### 5.15 Interview Probability

Objective:

Estimate whether the final CV increases the chance of receiving an interview for the benchmark JD.

Criteria:

- recruiter screening strength
- hiring manager relevance
- evidence-backed fit
- gap handling
- competitive positioning
- ATS match
- absence of disqualifying unsupported claims

Scoring:

| Score | Rule |
|---:|---|
| 5 | Very likely to improve interview probability for this evidence set. |
| 4 | Strong improvement in interview probability. |
| 3 | Some improvement, but notable weaknesses remain. |
| 2 | Limited interview probability improvement. |
| 1 | Unlikely to help. |
| 0 | Likely harms interview probability. |

Pass threshold: `>= 3.8`

Regression threshold:

- fail if score drops by `>= 0.2`
- fail if any change improves keyword match by sacrificing truthfulness

## 6. Evaluation Outputs

Every evaluation run must produce:

- case id
- pipeline version or commit identifier when available
- generated CV artifact path
- exported CV artifact path when available
- score per dimension
- weighted Product Quality Score
- pass/fail decision
- unsupported claim count and list
- missing critical evidence count and list
- capability gap list
- regression comparison against baseline
- final recommendation: `PASS`, `PASS WITH OBSERVATIONS`, or `FAIL`

## 7. Product Quality Decision Rules

Use these decisions:

| Decision | Rule |
|---|---|
| `PASS` | Overall score and all critical thresholds pass; no material regression. |
| `PASS WITH OBSERVATIONS` | Overall pass, but minor non-blocking quality issue exists. |
| `FAIL` | Any hard fail, critical threshold failure, or regression threshold breach. |

## 8. Product Principle

A change is successful only if it improves or preserves final CV quality.

Passing architecture, governance, implementation, or smoke validation is not sufficient.

The final judgment must be based on generated CV quality and interview probability.
