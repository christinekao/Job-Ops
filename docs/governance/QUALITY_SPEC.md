# Quality Spec

Status: Governance v1 CV quality contract draft.

This file centralizes quality rules already spread across `SPEC.md`, `FLOW.md`, `ARCHITECTURE.md`, `promptBuilders.ts`, `screeningReview.ts`, and current user instructions.

Per `DECISIONS.md` ADR-001, this project intentionally has no canonical CV. Quality is evaluated for each JD against this specification, `PROJECT_RULES.md`, the contracts, and source-grounded evidence. Historical or generated CV documents are not acceptance oracles.

## CV Output Goal

Produce one JD-specific, evidence-backed, screening-ready CV that:

- passes recruiter scan
- remains credible to a hiring manager
- preserves the candidate's real career arc
- avoids unsupported claims and internal terminology
- is export-ready

Evidence: `SPEC.md` and `buildScreeningCvPrompt`.

Confidence: Confirmed.

## Quality Dimensions

| Dimension | Requirement | Evidence Source | Confidence |
|---|---|---|---|
| JD positioning | Target role/title must align with selected JD and Screening Analysis | `SPEC.md`, `buildScreeningCvPrompt`, `screeningGate` | Confirmed |
| Evidence coverage | Major visible work bullets should cite supported evidence IDs where possible | `SPEC.md`, `TailoredCv` bullet shape, `buildScreeningCvPrompt` | Confirmed |
| Unsupported claims | Unsupported JD requirements must not appear as solved strengths | `buildScreeningAnalysisPrompt`, `buildScreeningCvPrompt` | Confirmed |
| Internal terminology | Internal names must be translated or removed from visible CV text | `buildScreeningAnalysisPrompt`, `buildScreeningCvPrompt`, `terminologyAndGapReview` | Confirmed |
| Business impact | Bullets should show action + capability + stakeholder/scope + business reason | `buildScreeningCvPrompt` | Confirmed |
| Technical depth | Technical claims must stay within evidence boundaries and avoid overclaiming backend/ML/MLOps ownership | `buildScreeningAnalysisPrompt`, `buildScreeningCvPrompt` | Confirmed |
| Action/outcome density | At least 65% of work bullets should contain action/outcome signal | `buildScreeningCvPrompt` | Confirmed |
| Representative project coverage | Strongest selected grounded projects should appear as external-friendly bullets | `buildScreeningCvPrompt` | Confirmed |
| HR readability | Summary, target role, supported keywords, skills, and readable sections must be visible | `SPEC.md`, `buildScreeningCvPrompt`, `exportVerification` | Confirmed |
| Hiring manager relevance | Summary and first bullets should answer manager job-to-be-done and pain points | `buildScreeningCvPrompt`, `hiringManagerReview` | Confirmed |
| Length | Target 1.5-2 page CV | `buildScreeningCvPrompt` | Confirmed |
| Career narrative | Include enough role history for credibility; current role gets most depth | `buildScreeningCvPrompt`; user current explicit requirement | Highly likely |
| Export readiness | Name, email, location, target role, section order, text layer proxy checks | `exportVerification`, `buildScreeningCvPrompt` | Confirmed |

## Human Decisions Still Needed

| Question | Why It Matters | Confidence |
|---|---|---|
| Should all prior roles always appear, or can some be compressed/omitted per JD? | Affects Writer contract and reviewer checks | Insufficient evidence |
| Is 1.5-2 pages always required, or can ATS one-page variants exist? | Affects export and length checks | Insufficient evidence |
| Which industries/role families are priority targets? | Affects positioning and evidence suppression | Possible from repo, not canonical here |

## Review Rule

Every review or repair task must report whether it moves the CV closer to or further from this quality spec.
