Status: DRAFT
Authority: REFERENCE
Can Authorize Production Implementation: NO
Does Not Override: docs/architecture/CURRENT_ARCHITECTURE.md
Reason for Draft Status: No approval or activation evidence is recorded.
Required Decision Before Activation: Owner approval of dataset specification.

# Golden Dataset Specification

## 1. Purpose

The Golden Dataset is a reusable benchmark set for measuring CV Builder output quality over time.

It exists to answer:

> Given the same JD and candidate evidence, did the new pipeline produce a better final CV?

The dataset must be stable, versioned, and expandable.

## 2. Dataset Unit

Each golden case represents one JD and one candidate evidence set.

Each case must include:

- Job Description
- candidate evidence fixture
- expected positioning
- expected evidence
- expected missing evidence
- expected capability gaps
- expected CV characteristics
- expected evaluation score

## 3. Case File Structure

Recommended path:

```text
docs/product-evaluation/golden-dataset/
  <case-id>/
    case.json
    jd.md
    evidence.md
    expected.md
    baseline-score.json
    notes.md
```

This specification defines the format only. It does not create the dataset cases.

## 4. Required Case Metadata

Each `case.json` should include:

```json
{
  "caseId": "case-c-azure-solution-specialist-weak-fit",
  "caseName": "Azure Solution Specialist — Weak Fit",
  "fitCategory": "Weak",
  "roleFamily": "Cloud Sales / Solution Specialist",
  "seniority": "Mid-Senior",
  "difficulty": "High",
  "candidateProfileId": "candidate-default",
  "jobDescriptionPath": "jd.md",
  "evidencePath": "evidence.md",
  "expectedPath": "expected.md",
  "baselineScorePath": "baseline-score.json",
  "status": "active",
  "addedDate": "YYYY-MM-DD",
  "lastReviewedDate": "YYYY-MM-DD"
}
```

## 5. Job Description Requirements

`jd.md` must include:

- role title
- company or anonymized company type
- responsibilities
- required qualifications
- preferred qualifications
- technical keywords
- business keywords
- implied seniority
- critical hiring signals
- disqualifying gaps when identifiable

The JD should be preserved exactly as used in evaluation.

## 6. Candidate Evidence Requirements

`evidence.md` must include only evidence available to the system.

Evidence should be grouped by:

- work history
- projects
- achievements
- metrics
- technical skills
- business skills
- customer-facing evidence
- leadership evidence
- sales or quota evidence
- architecture ownership evidence
- education or certifications

Evidence must distinguish:

- explicit evidence
- inferred but reasonable transferable evidence
- absent evidence

Absent evidence must not be converted into expected claims.

## 7. Expected Positioning

`expected.md` must define:

```text
Expected Positioning
- Overall fit: Good / Risky / Weak
- Primary positioning strategy:
- Transferable strengths:
- Claims that may be emphasized:
- Claims that must not be made:
```

The expected positioning is the benchmark authority for evaluating consistency.

## 8. Expected Evidence

Each case must list evidence expected to appear in the final CV.

Example format:

```text
Expected Evidence
1. Evidence ID: EV-001
   Description:
   Expected CV location: Summary / Experience / Skills / Other
   Criticality: Critical / High / Medium / Low
   Supported keywords:
```

Critical evidence omitted from the final CV is a regression unless a documented product reason exists.

## 9. Expected Missing Evidence

Each case must list important JD requirements that are not supported by candidate evidence.

Example format:

```text
Expected Missing Evidence
1. Requirement:
   Evidence status: Missing
   Expected handling:
   Must not claim:
```

Missing evidence should be used to evaluate truthfulness, capability gap transparency, and unsupported claims.

## 10. Expected Capability Gaps

Each case must identify truthful capability gaps.

Example format:

```text
Expected Capability Gaps
1. Gap:
   Severity: Critical / High / Medium / Low
   Interview risk:
   Expected CV handling:
   Expected report handling:
```

Capability gaps should reduce interview probability when material, but they must not be treated as hallucinations if the CV handles them truthfully.

## 11. Expected CV Characteristics

Each case must define what a strong CV should look like.

Required fields:

```text
Expected CV Characteristics
- Summary style:
- Top bullet characteristics:
- Skill section expectations:
- Keywords that should appear:
- Keywords that must not appear unless evidence exists:
- Quantification expectations:
- Business impact expectations:
- Tone:
- Maximum acceptable unsupported claims:
- Maximum acceptable missing critical evidence:
```

## 12. Expected Evaluation Score

`baseline-score.json` should define expected minimum scores.

Example:

```json
{
  "minimumScores": {
    "hrReadability": 4.0,
    "hiringManagerReadability": 4.0,
    "atsCompatibility": 4.0,
    "evidenceCoverage": 4.0,
    "keywordCoverage": 4.0,
    "positioningConsistency": 4.0,
    "truthfulness": 4.5,
    "missingCriticalEvidence": 4.0,
    "unsupportedClaims": 4.5,
    "capabilityGapTransparency": 4.0,
    "quantifiedAchievementQuality": 3.5,
    "executiveSummaryQuality": 4.0,
    "technicalSkillPresentation": 4.0,
    "businessImpactClarity": 3.8,
    "interviewProbability": 3.8
  },
  "minimumProductQualityScore": 4.0,
  "expectedDecision": "PASS"
}
```

## 13. Required Initial Golden Cases

The first dataset should include at least:

| Case | Fit type | Purpose |
|---|---|---|
| Case A — Good Fit | Good | Ensure strong-fit candidates remain strong and do not lose competitiveness. |
| Case B — Risky Fit | Risky | Ensure partial evidence is positioned conservatively but still competitively. |
| Case C — Azure Solution Specialist | Weak | Ensure weak fit still gets the strongest truthful CV without Azure sales, quota, or deal ownership fabrication. |

## 14. Azure Solution Specialist Weak-Fit Requirements

The Azure Solution Specialist case must explicitly check:

- no fabricated Azure sales ownership
- no invented quota ownership
- no invented deal ownership
- no invented enterprise customer ownership
- no invented architecture ownership
- transferable experience is emphasized
- remaining capability gaps are transparent
- final CV is defensible in a real interview

Expected result:

- Truthfulness: pass
- Unsupported Claims: pass
- Capability Gap Transparency: pass
- Interview Probability: may be lower than Good Fit, but should improve versus an unoptimized generic CV

## 15. Adding New Benchmark Cases

New cases may be added when they cover a distinct product risk, such as:

- very strong direct fit
- weak fit with transferable strengths
- highly technical role
- sales role
- leadership role
- role with missing metrics
- role with high ATS keyword pressure
- role where truthful gaps are severe

Each new case must define expected evidence and expected gaps before being used in regression.

## 16. Golden Dataset Versioning

The dataset should use semantic versions:

- patch: fixes typos or clarifies expected criteria without changing scoring meaning
- minor: adds new cases
- major: changes scoring expectations or removes active cases

Every regression report must record:

- dataset version
- case ids evaluated
- baseline version compared
- generated artifact ids

## 17. Dataset Governance Rule

The Golden Dataset is not a governance artifact.

It is product evaluation infrastructure.

Its purpose is to preserve benchmark quality pressure so future development is judged by final CV quality.
