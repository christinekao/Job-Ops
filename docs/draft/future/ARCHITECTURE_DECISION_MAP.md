Status: DRAFT
Authority: REFERENCE
Can Authorize Production Implementation: NO
Does Not Override: docs/architecture/CURRENT_ARCHITECTURE.md
Reason for Draft Status: Defines a target decision-centric architecture not approved for production.
Required Decision Before Activation: Explicit approved ADR and implementation task.

# Architecture Decision Map

## 1. Purpose

This document maps the important product decisions an AI-powered CV Decision System must make.

The architecture should be organized around these decisions, not around prompts or UI steps.

## 2. Decision Ownership Principles

1. Decisions that depend on evidence truth should be deterministic or evidence-graph driven.
2. Decisions that depend on human perception may be AI-assisted.
3. Decisions that change professional identity should be human-reviewable.
4. Decisions that affect visible claims must preserve traceability.
5. Decisions that affect export must be tied to a reviewed content version.

## 3. Decision Map

| Decision | Purpose | Inputs | Outputs | Owner | Mode | Same component as |
|---|---|---|---|---|---|---|
| JD Interpretation | Understand what the role is really hiring for. | Raw JD | Requirement Graph | Job Intelligence Engine | AI-driven with schema validation | Hidden Hiring Signals |
| Hard Requirement Detection | Identify screening filters. | Raw JD, market context | Hard requirements | Job Intelligence Engine | AI-assisted, deterministic validation | JD Interpretation |
| Nice-to-Have Detection | Separate optional strengths from blockers. | Raw JD | Nice-to-have requirements | Job Intelligence Engine | AI-assisted | JD Interpretation |
| ATS Keyword Extraction | Identify searchable terms. | Raw JD | Keyword set with priority | Job Intelligence Engine | Hybrid | Keyword Strategy |
| Hidden Hiring Signal Detection | Decode vague hiring language. | JD, role family | Implied needs | Job Intelligence Engine | AI-driven | JD Interpretation |
| Evidence Normalization | Convert raw career material into atomic facts. | Raw sources | Evidence items | Evidence Bank | AI-assisted with provenance | Evidence Provenance |
| Evidence Provenance | Preserve source and support strength. | Raw sources, evidence items | Provenance records | Evidence Bank | Deterministic | Evidence Normalization |
| Evidence Credibility | Rate reliability of evidence. | Evidence items, source quality | Support level | Evidence Bank | Hybrid | Evidence Provenance |
| Evidence Priority | Choose which evidence matters most. | Evidence items, Requirement Graph | Prioritized evidence | Evidence-to-Requirement Mapper | Hybrid | Evidence Ranking |
| Evidence Ranking | Rank evidence by role impact. | Coverage matrix, support level | Ranked evidence list | Evidence-to-Requirement Mapper | Hybrid | Evidence Priority |
| Evidence Coverage | Measure requirement coverage. | Requirements, evidence | Coverage matrix | Evidence-to-Requirement Mapper | Deterministic plus AI semantic matching | Missing Evidence |
| Missing Evidence | Identify unsupported JD requirements. | Requirement Graph, Evidence Bank | Missing evidence list | Evidence-to-Requirement Mapper | Deterministic where explicit, AI-assisted where semantic | Capability Gap |
| Capability Gap | Determine truthful capability gaps. | Missing evidence, requirement criticality | Gap list with severity | Positioning Strategist | Hybrid | Target Positioning |
| Target Positioning | Choose strongest truthful positioning. | Coverage matrix, gaps, role target | Positioning Decision | Positioning Strategist | AI-driven within evidence constraints | Narrative Strategy |
| Fit Tier | Inform strategy, not generation permission. | Coverage, gaps, role criticality | Good/Risky/Weak strategy label | Positioning Strategist | Hybrid | Target Positioning |
| Claims to Avoid | Prevent unsupported or risky claims. | Evidence gaps, risk taxonomy | Forbidden claim list | Positioning Strategist | Deterministic plus AI risk detection | Capability Gap |
| Narrative Strategy | Define how the candidate should be framed. | Positioning Decision, evidence priority | Narrative angle | Positioning Strategist | AI-driven | Career Story |
| Career Story | Create coherent cross-role story. | Evidence Bank, positioning | Career story themes | Positioning Strategist | AI-driven | Narrative Strategy |
| CV Structure | Choose section layout and sequence. | Role family, ATS rules, strategy | Section plan | CV Strategy Compiler | Deterministic with templates | Export Strategy |
| Executive Summary Strategy | Decide what the top summary must communicate. | Positioning, top evidence, gaps | Summary brief | CV Strategy Compiler | Hybrid | Narrative Strategy |
| Technical Focus | Decide technical depth and ordering. | JD technical requirements, evidence | Technical emphasis | CV Strategy Compiler | Hybrid | Skill Ordering |
| Business Focus | Decide business outcomes to emphasize. | JD business priorities, evidence | Business impact emphasis | CV Strategy Compiler | Hybrid | Achievement Selection |
| Keyword Strategy | Place supported keywords naturally. | Keyword set, evidence support | Keyword placement plan | CV Strategy Compiler | Deterministic plus AI wording | ATS Optimization |
| ATS Optimization | Ensure parseable, searchable output. | Format rules, keywords, CV structure | ATS-safe plan | CV Strategy Compiler / Export Engine | Mostly deterministic | Export Strategy |
| Achievement Selection | Choose achievements for visible CV. | Ranked evidence, strategy | Selected achievements | CV Strategy Compiler | Hybrid | Achievement Ordering |
| Achievement Ordering | Put strongest role evidence first. | Selected achievements, role priorities | Ordered bullets | CV Strategy Compiler | Hybrid | Achievement Selection |
| Quantification Strategy | Use metrics where supported. | Evidence metrics, source quality | Quantification plan | CV Strategy Compiler | Deterministic support, AI wording | Achievement Selection |
| Skill Ordering | Order skills by JD relevance and evidence. | Skills, JD keywords, evidence | Ordered skill groups | CV Strategy Compiler | Hybrid | Technical Focus |
| Gap Handling | Decide visible and non-visible gap treatment. | Capability gaps, positioning | Gap handling policy | CV Strategy Compiler | Deterministic policy plus AI explanation | Capability Gap |
| Wording Generation | Write polished CV text. | Writing plan, evidence | Draft CV | Writer | AI-driven | None |
| Claim Extraction | Extract every visible and implied claim. | Draft CV | Claim Ledger | Claim Ledger | Hybrid, verified deterministically | Claim Support Verification |
| Claim Support Verification | Check every claim against evidence. | Claim Ledger, Evidence Bank | Support status | Claim Ledger | Deterministic plus AI semantic support | Unsupported Claims |
| Trustworthiness | Decide if CV is defensible. | Claim support, gaps, review | Trust status | Quality Evaluator | Hybrid | Unsupported Claims |
| HR Readability | Evaluate recruiter scan quality. | Final CV, JD | HR score | Quality Evaluator | AI-assisted with rubric | Interview Probability |
| Hiring Manager Readability | Evaluate manager credibility. | Final CV, claim ledger, JD | Manager score | Quality Evaluator | AI-assisted with rubric | Interview Probability |
| Business Impact Clarity | Evaluate outcome clarity. | Final CV, evidence | Business impact score | Quality Evaluator | AI-assisted | Hiring Manager Readability |
| Technical Credibility | Evaluate technical believability. | Final CV, evidence, JD | Technical score | Quality Evaluator | AI-assisted with deterministic unsupported checks | Hiring Manager Readability |
| Unsupported Claims | Identify unsupported or inflated claims. | Claim Ledger | Unsupported claim issues | Reviewer | Deterministic first, AI-assisted implied-claim detection | Truthfulness |
| Truthfulness | Determine whether CV stays within evidence. | Claim Ledger, unsupported issues | Truthfulness status | Reviewer / Quality Evaluator | Hybrid | Unsupported Claims |
| Reviewer Classification | Classify defects and risks. | Scores, Claim Ledger, CV | Structured issues | Reviewer | Hybrid | Repairability |
| Repairability | Decide if issue can be fixed by CV mutation. | Structured issue, evidence, policy | Repairability class | Reviewer | Deterministic policy plus AI context | Reviewer Classification |
| Repair Strategy | Decide exact repair route. | Structured issues | Repair plan | Repair Engine | Deterministic | None |
| Safe Local Repair | Apply deterministic bounded fixes. | Repair plan, CV version | Patched CV | Repair Engine | Deterministic | Repair Strategy |
| AI Targeted Repair | Rewrite bounded zones only. | Repair plan, evidence, CV zone | Proposed patch | Repair Engine | AI-driven within strict boundary | Repair Strategy |
| Human Input Request | Ask user for missing evidence or approval. | Non-repairable issue | Human decision request | Human Decision Console | Deterministic trigger, human-driven answer | None |
| Re-review Scope | Decide what must be rechecked after repair. | Patch diff, affected claims | Re-review plan | Reviewer / Quality Evaluator | Deterministic | Repair Strategy |
| Export Strategy | Choose format and export readiness. | Accepted CV version, ATS rules | Export plan | Export Engine | Deterministic | ATS Optimization |
| Export Readiness | Decide whether final artifact is safe to export. | Reviewed CV hash, export artifact | Export decision | Export Engine | Deterministic | Export Strategy |
| Interview Optimization | Estimate and improve interview probability. | Quality scores, JD, CV | Interview probability score | Quality Evaluator | AI-assisted, calibrated by outcomes | HR/HM Readability |
| Regression Evaluation | Determine if product changed for better or worse. | Baseline scores, new scores | Regression decision | Evaluation System | Deterministic thresholds plus evaluator scores | Baseline Promotion |
| Baseline Promotion | Decide if new output becomes benchmark. | Regression decision, artifacts | Baseline update | Evaluation System | Deterministic | Regression Evaluation |

## 4. Decisions That Must Not Be Mixed

### Positioning and Writing

Positioning decides what should be said.

Writing decides how to say it.

If Writer owns positioning, it will optimize for fluent persuasion and may overrun evidence boundaries.

### Reviewing and Repairing

Reviewer identifies and classifies issues.

Repair changes the CV.

If Reviewer repairs, issue classification and mutation become untraceable.

### Evidence Mapping and Narrative Strategy

Evidence mapping determines what is supported.

Narrative strategy determines how supported evidence should be framed.

If these are mixed, weak evidence may be promoted because it fits a desired story.

### Export and Quality Evaluation

Export determines whether a reviewed version renders correctly.

Quality Evaluation determines whether the CV is good.

If these are mixed, export readiness can be mistaken for interview readiness.

### Product Evaluation and Governance

Product Evaluation measures CV quality.

Governance controls decision process and scope.

If these are mixed, process completion can be mistaken for product improvement.

## 5. Deterministic vs AI-Driven Summary

Deterministic decisions:

- artifact identity
- content hash validity
- evidence ID presence
- required section presence
- supported keyword presence
- unsupported banned ownership patterns
- repair route authorization
- export content equivalence
- regression threshold calculation

AI-driven decisions:

- hidden hiring signal interpretation
- narrative strategy
- recruiter readability assessment
- hiring-manager credibility assessment
- executive summary quality
- business storytelling quality
- interview probability estimate

Hybrid decisions:

- evidence-to-requirement mapping
- capability gap classification
- positioning strategy
- keyword strategy
- achievement ranking
- claim extraction
- implied claim detection

## 6. Component Grouping

The final architecture should group decisions as:

| Component | Primary responsibility | Decisions owned |
|---|---|---|
| Evidence Bank | Candidate truth source | Evidence normalization, provenance, credibility |
| Job Intelligence Engine | Hiring target model | JD interpretation, hard requirements, ATS keywords, hidden signals |
| Evidence-to-Requirement Mapper | Support matrix | Evidence priority, ranking, coverage, missing evidence |
| Positioning Strategist | Strongest truthful role strategy | Target positioning, fit tier, capability gaps, claims to avoid, narrative strategy |
| CV Strategy Compiler | Deterministic writing plan | Structure, achievements, skills, keywords, gap handling |
| Writer | External-facing CV drafting | Wording generation |
| Claim Ledger | Claim traceability | Claim extraction, claim support verification |
| Quality Evaluator | Product quality measurement | Readability, ATS, business impact, interview probability |
| Reviewer | Defect classification | Structured issues, severity, repairability |
| Repair Engine | Bounded mutation | Repair strategy, local repair, AI targeted repair |
| Export Engine | Final artifact production | Export strategy, export readiness |
| Human Decision Console | Human judgment boundary | Missing evidence, strategic ambiguity, approval |
| Evaluation System | Regression and learning | Regression evaluation, baseline promotion |

## 7. Architectural Rule

No component should both create a claim and approve its truthfulness.

This is the most important separation of duty in the product.
