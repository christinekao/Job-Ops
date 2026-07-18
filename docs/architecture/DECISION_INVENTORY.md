# Decision Inventory

## 1. Purpose

This document inventories the product decisions required to create a world-class, truthful, interview-optimized CV.

The inventory is implementation-independent. It does not define modules, prompts, tasks, or UI.

## 2. Decision Categories

Priority levels:

- `Critical`: required for truthful, defensible CV generation
- `High`: required for strong interview probability
- `Medium`: improves quality, consistency, or scalability
- `Low`: useful optimization or future refinement

Ownership modes:

- `Rule-based`: deterministic rules should own the decision
- `AI-driven`: AI judgment is the primary value
- `Hybrid`: deterministic boundaries plus AI judgment
- `Human Review`: human authority is required

Reuse classes:

- `Platform-wide`: reusable across resume, LinkedIn, portfolio, cover letter, interview prep, career advisor, personal branding, and career memory
- `Reusable`: reusable across multiple artifact types but may require adaptation
- `Resume-only`: mostly specific to CV/resume output
- `Future Extension`: not required for initial CV product, but should be anticipated

## 3. Complete Decision Inventory

| ID | Decision | Domain | Priority | Ownership | Reuse |
|---|---|---|---|---|---|
| D01 | Requirement Understanding / Hiring Target Interpretation | Requirement Intelligence | Critical | Hybrid | Platform-wide |
| D02 | Requirement Extraction | Requirement Intelligence | Critical | Hybrid | Platform-wide |
| D03 | Requirement Prioritization | Requirement Intelligence | Critical | Hybrid | Platform-wide |
| D04 | Requirement Criticality | Requirement Intelligence | Critical | Hybrid | Platform-wide |
| D05 | Hidden Hiring Signal Interpretation | Requirement Intelligence | High | AI-driven | Platform-wide |
| D06 | ATS Keyword Identification | Requirement Intelligence | High | Hybrid | Reusable |
| D07 | Role Seniority Calibration | Requirement Intelligence | High | Hybrid | Platform-wide |
| D08 | Candidate Evidence Discovery | Evidence Intelligence | Critical | Hybrid | Platform-wide |
| D09 | Evidence Normalization | Evidence Intelligence | Critical | Hybrid | Platform-wide |
| D10 | Evidence Provenance | Evidence Intelligence | Critical | Rule-based | Platform-wide |
| D11 | Evidence Confidence | Evidence Intelligence | Critical | Hybrid | Platform-wide |
| D12 | Evidence Relevance Mapping | Evidence Intelligence | Critical | Hybrid | Platform-wide |
| D13 | Evidence Ranking | Evidence Intelligence | Critical | Hybrid | Platform-wide |
| D14 | Evidence Selection | Evidence Intelligence | Critical | Hybrid | Reusable |
| D15 | Requirement Coverage | Evidence Intelligence | Critical | Hybrid | Platform-wide |
| D16 | Missing Evidence Identification | Evidence Intelligence | Critical | Hybrid | Platform-wide |
| D17 | Transferable Evidence Classification | Evidence Intelligence | High | Hybrid | Platform-wide |
| D18 | Claim Boundary Definition | Claim Intelligence | Critical | Hybrid | Platform-wide |
| D19 | Claim Validation | Claim Intelligence | Critical | Hybrid | Platform-wide |
| D20 | Claim Risk Classification | Claim Intelligence | Critical | Hybrid | Platform-wide |
| D21 | Unsupported Claim Detection | Claim Intelligence | Critical | Hybrid | Platform-wide |
| D22 | Metric Validity | Claim Intelligence | Critical | Hybrid | Platform-wide |
| D23 | Ownership Claim Safety | Claim Intelligence | Critical | Hybrid | Platform-wide |
| D24 | Capability Gap Identification | Career Strategy Intelligence | Critical | Hybrid | Platform-wide |
| D25 | Capability Gap Severity | Career Strategy Intelligence | Critical | Hybrid | Platform-wide |
| D26 | Career Positioning | Career Strategy Intelligence | Critical | AI-driven with evidence constraints | Platform-wide |
| D27 | Fit Strategy | Career Strategy Intelligence | High | Hybrid | Platform-wide |
| D28 | Career Narrative | Career Strategy Intelligence | High | AI-driven | Platform-wide |
| D29 | Claims to Avoid | Career Strategy Intelligence | Critical | Hybrid | Platform-wide |
| D30 | Gap Transparency Strategy | Career Strategy Intelligence | Critical | Hybrid | Platform-wide |
| D31 | Audience Strategy | Output Strategy Intelligence | High | Hybrid | Reusable |
| D32 | Executive Summary Strategy | Output Strategy Intelligence | High | Hybrid | Reusable |
| D33 | Achievement Selection | Output Strategy Intelligence | Critical | Hybrid | Reusable |
| D34 | Achievement Ordering | Output Strategy Intelligence | High | Hybrid | Reusable |
| D35 | Quantification Strategy | Output Strategy Intelligence | High | Hybrid | Reusable |
| D36 | Skill Selection | Output Strategy Intelligence | High | Hybrid | Reusable |
| D37 | Skill Ordering | Output Strategy Intelligence | High | Hybrid | Reusable |
| D38 | Technical Credibility Strategy | Output Strategy Intelligence | High | Hybrid | Reusable |
| D39 | Business Impact Strategy | Output Strategy Intelligence | High | Hybrid | Reusable |
| D40 | Keyword Strategy | Output Strategy Intelligence | High | Hybrid | Resume-only / Reusable |
| D41 | ATS Optimization Strategy | Output Strategy Intelligence | High | Rule-based with semantic input | Resume-only |
| D42 | Writing Strategy | Output Strategy Intelligence | High | Hybrid | Reusable |
| D43 | Content Omission Strategy | Output Strategy Intelligence | Medium | Hybrid | Reusable |
| D44 | Final Claim Ledger Validation | Quality Intelligence | Critical | Hybrid | Platform-wide |
| D45 | Truthfulness Verification | Quality Intelligence | Critical | Hybrid | Platform-wide |
| D46 | HR Readability Evaluation | Quality Intelligence | High | AI-driven with rubric | Resume-only / Reusable |
| D47 | Hiring Manager Readability Evaluation | Quality Intelligence | High | AI-driven with rubric | Reusable |
| D48 | Evidence Coverage Evaluation | Quality Intelligence | Critical | Hybrid | Platform-wide |
| D49 | Keyword Coverage Evaluation | Quality Intelligence | High | Hybrid | Resume-only / Reusable |
| D50 | Capability Gap Transparency Evaluation | Quality Intelligence | Critical | Hybrid | Platform-wide |
| D51 | Interview Probability Evaluation | Quality Intelligence | Critical | AI-driven with calibrated rubric | Platform-wide |
| D52 | Interview Readiness | Quality Intelligence | High | Hybrid | Platform-wide |
| D53 | Repair Strategy | Correction Intelligence | Critical | Rule-based with AI-assisted options | Reusable |
| D54 | Repair Authorization | Correction Intelligence | Critical | Rule-based | Platform-wide |
| D55 | Human Input Requirement | Correction Intelligence | Critical | Rule-based | Platform-wide |
| D56 | Re-evaluation Scope | Correction Intelligence | High | Rule-based | Platform-wide |
| D57 | Export Strategy | Delivery Intelligence | Medium | Rule-based | Resume-only / Reusable |
| D58 | Export Readiness | Delivery Intelligence | High | Rule-based | Resume-only |
| D59 | Product Quality Score | Learning Intelligence | Critical | Hybrid | Platform-wide |
| D60 | Regression Decision | Learning Intelligence | Critical | Rule-based | Platform-wide |
| D61 | Baseline Promotion | Learning Intelligence | High | Rule-based with human review option | Platform-wide |
| D62 | Outcome Feedback Interpretation | Learning Intelligence | Medium | Hybrid | Platform-wide |
| D63 | Future Career Gap | Career Growth Intelligence | Medium | AI-driven with evidence constraints | Platform-wide |
| D64 | Career Memory Update | Career Growth Intelligence | Medium | Hybrid with human review | Platform-wide |

## 4. Exhaustiveness Check

The inventory covers decisions before writing, during writing, after writing, after repair, after export, and after real-world feedback.

Decision families covered:

- understanding the job
- understanding candidate truth
- matching evidence to requirements
- selecting truthful positioning
- planning content
- validating claims
- evaluating final product quality
- repairing bounded defects
- exporting safely
- learning from regression and outcomes
- extending into long-term career memory

## 5. Most Important Product Rule

Writing may not begin until these critical pre-writing decisions exist:

- Hiring Target Interpretation
- Requirement Extraction
- Requirement Prioritization
- Evidence Discovery
- Evidence Confidence
- Evidence Relevance Mapping
- Evidence Selection
- Requirement Coverage
- Missing Evidence Identification
- Claim Boundary Definition
- Capability Gap Identification
- Career Positioning
- Claims to Avoid
- Achievement Selection
- Keyword Strategy
- Writing Strategy

If these decisions are missing, Writer is forced to invent strategy. That is an architectural failure.
