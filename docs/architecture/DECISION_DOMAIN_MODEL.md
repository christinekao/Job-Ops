# Decision Domain Model

## 1. Purpose

This document groups product decisions into business domains.

Domains are not implementation modules. They are conceptual ownership areas for product decisions.

## 2. Domain Summary

| Domain | Primary product responsibility | Core question |
|---|---|---|
| Requirement Intelligence | Understand the target role. | What does this job really require? |
| Evidence Intelligence | Understand candidate proof. | What can the candidate truthfully claim? |
| Claim Intelligence | Control claim truth and risk. | Is each claim safe and supported? |
| Career Strategy Intelligence | Decide positioning and gaps. | What truthful story should be told? |
| Output Strategy Intelligence | Plan the artifact before writing. | What should the CV contain and emphasize? |
| Quality Intelligence | Measure final output quality. | Is this CV actually good? |
| Correction Intelligence | Decide how defects may be fixed. | What can be safely repaired? |
| Delivery Intelligence | Prepare final artifact. | Is the exported artifact safe to send? |
| Learning Intelligence | Improve product decisions over time. | Did the product improve? |
| Career Growth Intelligence | Support long-term user growth. | What should the candidate build next? |

## 3. Requirement Intelligence

Purpose:

Understand the hiring target.

Decisions owned:

- Hiring Target Interpretation
- Requirement Extraction
- Requirement Prioritization
- Requirement Criticality
- Hidden Hiring Signal Interpretation
- ATS Keyword Identification
- Role Seniority Calibration

Why these belong together:

They all derive from the job market side of the problem. They define the target before candidate evidence is judged.

Why they do not belong elsewhere:

- Evidence Intelligence should not decide what the job requires.
- Writer should not infer requirements during writing.
- Quality Intelligence should evaluate against requirements, not create them.

Missing in current architecture:

Current `ScreeningAnalysis` performs much of this but also includes positioning, evidence mapping, gaps, and writing guidance. The domain exists conceptually but is overloaded.

Future reuse:

Platform-wide. The same requirement understanding supports CV, LinkedIn optimization, cover letter targeting, interview preparation, and career advisor recommendations.

Priority:

Critical.

## 4. Evidence Intelligence

Purpose:

Understand candidate proof.

Decisions owned:

- Candidate Evidence Discovery
- Evidence Normalization
- Evidence Provenance
- Evidence Confidence
- Evidence Relevance Mapping
- Evidence Ranking
- Evidence Selection
- Requirement Coverage
- Missing Evidence Identification
- Transferable Evidence Classification

Why these belong together:

They define the relationship between candidate truth and job needs.

Why they do not belong elsewhere:

- Career Strategy should not decide evidence truth.
- Writer should not select evidence opportunistically.
- Reviewer should not be the first system to discover missing evidence.

Missing in current architecture:

Evidence cards and CV brief construction exist, but there is no sufficiently first-class Coverage Matrix or Evidence-to-Requirement decision artifact.

Future reuse:

Platform-wide. It powers every artifact and the future Career Memory.

Priority:

Critical.

## 5. Claim Intelligence

Purpose:

Ensure every claim is safe, supported, and traceable.

Decisions owned:

- Claim Boundary Definition
- Claim Validation
- Claim Risk Classification
- Unsupported Claim Detection
- Metric Validity
- Ownership Claim Safety
- Final Claim Ledger Validation
- Truthfulness Verification

Why these belong together:

They control the truth boundary between evidence and visible claims.

Why they do not belong elsewhere:

- Writer creates text and must not approve its own truthfulness.
- Reviewer may classify issues but should consume claim truth data.
- Repair may fix claims but must not redefine truth.

Missing in current architecture:

The largest gap is the absence of a first-class Claim Ledger. Evidence IDs exist, but the system does not yet model every visible and implied claim as a traceable object.

Future reuse:

Platform-wide. Claim Intelligence is required for resume, LinkedIn, portfolio, cover letter, interview prep, personal branding, and career advisor outputs.

Priority:

Critical.

## 6. Career Strategy Intelligence

Purpose:

Choose the strongest truthful career strategy for the target.

Decisions owned:

- Capability Gap Identification
- Capability Gap Severity
- Career Positioning
- Fit Strategy
- Career Narrative
- Claims to Avoid
- Gap Transparency Strategy

Why these belong together:

They decide what story should be told and what risk must remain visible.

Why they do not belong elsewhere:

- Requirement Intelligence defines the role but not the candidate strategy.
- Evidence Intelligence defines support but not positioning.
- Writer should execute positioning, not invent it.

Mixed in current architecture:

Positioning currently appears inside `ScreeningAnalysis` and Writer prompt context. This is directionally useful but too broad. Long-term, positioning should be an explicit decision artifact.

Future reuse:

Platform-wide. The same strategy can adapt into CV, LinkedIn, cover letter, interview prep, and personal branding.

Priority:

Critical.

## 7. Output Strategy Intelligence

Purpose:

Plan the external artifact before writing.

Decisions owned:

- Audience Strategy
- Executive Summary Strategy
- Achievement Selection
- Achievement Ordering
- Quantification Strategy
- Skill Selection
- Skill Ordering
- Technical Credibility Strategy
- Business Impact Strategy
- Keyword Strategy
- ATS Optimization Strategy
- Writing Strategy
- Content Omission Strategy

Why these belong together:

They transform strategy into an artifact-specific execution plan.

Why they do not belong elsewhere:

- Writer should not decide evidence selection, achievement ordering, or claim boundaries.
- Export should not decide content strategy.
- Quality Intelligence should score the result, not plan it.

Mixed in current architecture:

`buildCvBrief`, writer context, and prompts contain parts of this. The decision domain is present but not yet first-class.

Future reuse:

Reusable. Many decisions apply to LinkedIn, portfolio, cover letter, and interview prep, though ATS optimization is resume-specific.

Priority:

High.

## 8. Quality Intelligence

Purpose:

Measure whether the final output is good.

Decisions owned:

- HR Readability Evaluation
- Hiring Manager Readability Evaluation
- Evidence Coverage Evaluation
- Keyword Coverage Evaluation
- Capability Gap Transparency Evaluation
- Interview Probability Evaluation
- Interview Readiness
- Product Quality Score

Why these belong together:

They judge product quality after writing and repair.

Why they do not belong elsewhere:

- Writer should not grade itself.
- Export should not imply quality.
- Governance should not substitute for product quality.

Missing in current architecture:

Product evaluation docs exist, but Quality Intelligence is not yet a first-class runtime decision domain.

Future reuse:

Platform-wide, with artifact-specific rubrics.

Priority:

Critical.

## 9. Correction Intelligence

Purpose:

Decide how defects can be safely corrected.

Decisions owned:

- Repair Strategy
- Repair Authorization
- Human Input Requirement
- Re-evaluation Scope

Why these belong together:

They decide whether and how the system may change an existing artifact.

Why they do not belong elsewhere:

- Reviewer identifies defects but should not repair.
- Writer should not decide repair routes.
- Human input is required only where authority is missing.

Already strong in current architecture:

Recent Repair architecture is directionally correct: structured reviewer issues feed bounded repair routing, and non-repairable gaps are protected.

Future reuse:

Reusable across CV, LinkedIn, portfolio, cover letters, and career reports.

Priority:

Critical.

## 10. Delivery Intelligence

Purpose:

Prepare the final artifact for real-world use.

Decisions owned:

- Export Strategy
- Export Readiness

Why these belong together:

They determine whether the final artifact is render-safe, parse-safe, and content-identical to the reviewed version.

Why they do not belong elsewhere:

- Export should not judge content truthfulness.
- Quality Intelligence should not render artifacts.

Needs refactoring in current architecture:

Export appears close to review panels and operational readiness. Long-term it should be a content-identity and delivery-quality domain.

Future reuse:

Resume-specific at first, reusable later for LinkedIn/portfolio/cover-letter publishing formats.

Priority:

High.

## 11. Learning Intelligence

Purpose:

Determine whether the product is improving.

Decisions owned:

- Regression Decision
- Baseline Promotion
- Outcome Feedback Interpretation

Why these belong together:

They compare new outputs with baselines and real outcomes.

Why they do not belong elsewhere:

- Quality Intelligence scores an artifact.
- Learning Intelligence compares outputs over time.
- Governance should not decide product improvement without quality evidence.

Missing in current architecture:

Golden dataset and regression docs exist, but not a first-class decision domain.

Future reuse:

Platform-wide.

Priority:

Critical for product evolution.

## 12. Career Growth Intelligence

Purpose:

Support the user beyond one application.

Decisions owned:

- Future Career Gap
- Career Memory Update

Why these belong together:

They convert repeated product observations into long-term career guidance.

Why they do not belong elsewhere:

- Current CV positioning should not permanently label a candidate.
- Career Memory must preserve provenance and user approval.

Missing in current architecture:

The current system has career evidence but not a full career-growth decision loop.

Future reuse:

Platform-wide and central to Career Advisor.

Priority:

Medium now, high long term.

## 13. Architecture Alignment Summary

### Missing decision owners

- Claim Ledger owner
- Product Quality Score owner
- Regression Decision owner
- Requirement Coverage Matrix owner
- Career Memory owner
- Outcome Feedback owner

### Missing domains

- Claim Intelligence
- Quality Intelligence as runtime product evaluator
- Learning Intelligence
- Career Growth Intelligence

### Mixed responsibilities

- `ScreeningAnalysis` appears to mix requirement interpretation, evidence mapping, positioning, gaps, and writing guidance.
- Writer prompts contain strategy, quality checklist, truthfulness policy, and repair-like behavior.
- UI orchestration carries product decision semantics.
- Export readiness and review status are close enough that content quality can be confused with delivery readiness.

### Overloaded components

- Writer prompt
- `ScreeningLab.tsx`
- broad screening analysis artifact
- review/export panel orchestration

### Hidden decisions embedded inside prompts

- requirement prioritization
- hidden hiring signal interpretation
- positioning strategy
- claim boundary rules
- achievement selection
- keyword strategy
- self-review checklist
- repair behavior
- gap handling

### Missing product capabilities

- full Claim Ledger
- explicit Coverage Matrix
- independent Product Quality Evaluator
- regression baseline promotion
- outcome feedback loop
- artifact-neutral Career Memory

## 14. Architectural Evolution Order

Recommended order for domains to become first-class components:

1. Evidence Intelligence
2. Requirement Intelligence
3. Claim Intelligence
4. Quality Intelligence
5. Career Strategy Intelligence
6. Output Strategy Intelligence
7. Correction Intelligence
8. Delivery Intelligence
9. Learning Intelligence
10. Career Growth Intelligence

Reason:

Truth and quality measurement must come before more writing sophistication. Better writing without Claim Intelligence and Quality Intelligence increases the risk of persuasive but unsafe CVs.

## 15. Domain Rule

The platform should be decision-domain driven.

Future engines should be derivable from these domains:

- Requirement Engine from Requirement Intelligence
- Evidence Engine from Evidence Intelligence
- Claim Ledger from Claim Intelligence
- Positioning Engine from Career Strategy Intelligence
- Narrative Planner from Career Strategy and Output Strategy Intelligence
- Quality Evaluator from Quality Intelligence
- Repair Engine from Correction Intelligence
- Export Engine from Delivery Intelligence
- Interview Optimizer from Quality and Career Strategy Intelligence
- Career Memory from Career Growth and Learning Intelligence
