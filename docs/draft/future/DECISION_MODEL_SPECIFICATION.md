Status: DRAFT
Authority: REFERENCE
Can Authorize Production Implementation: NO
Does Not Override: docs/architecture/CURRENT_ARCHITECTURE.md
Reason for Draft Status: Proposed specification is not accepted production architecture.
Required Decision Before Activation: Explicit approved ADR.

# Decision Model Specification

## 1. Purpose

This specification defines the conceptual operating system for future AI components in the CV Decision System.

The product does not start with writing.

The product starts with decisions:

- what the hiring manager wants
- what evidence exists
- what evidence should be used
- what story should be told
- what claims are safe
- what should be emphasized
- how success should be measured

Only after these decisions are complete should text generation occur.

## 2. Decision Contract

Every product decision must expose:

- Decision Name
- Purpose
- Business Goal
- Inputs
- Outputs
- Preconditions
- Success Criteria
- Failure Conditions
- Dependencies
- Downstream Consumers
- Ownership Mode
- Lifecycle
- Reusability
- Priority

No downstream stage may silently override an upstream decision. If a downstream stage detects a conflict, it must produce a new issue or request a new upstream decision.

## 3. Decision Specification Table

| Decision | Purpose | Business Goal | Inputs | Outputs | Preconditions | Success Criteria | Failure Conditions | Dependencies | Downstream Consumers | Ownership | Lifecycle | Reusability | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Hiring Target Interpretation | Understand the role’s real hiring problem. | Optimize for the actual buyer of talent. | Raw JD, company context if available. | Hiring target model. | JD exists. | Role, audience, seniority, and hiring problem are clear. | Generic or contradictory interpretation. | None. | Requirement decisions, positioning, narrative. | Hybrid: AI interprets, rules validate schema. | Happens first; changes only if JD changes; downstream cannot override. | Platform-wide. | Critical. |
| Requirement Extraction | Convert JD into discrete requirements. | Prevent missing screening filters. | Hiring target model, raw JD. | Requirement list. | Hiring target exists. | Requirements are atomic and traceable to JD. | Requirements merged, omitted, or invented. | D01. | Prioritization, coverage, keywords. | Hybrid. | Early; changes if JD interpretation changes; immutable per JD version. | Platform-wide. | Critical. |
| Requirement Prioritization | Rank requirements by hiring impact. | Focus CV on what matters most. | Requirements, role type. | Priority-ranked requirements. | Requirements extracted. | Critical requirements are separated from secondary ones. | Optional items treated as blockers or blockers treated as optional. | D02. | Evidence ranking, selection, CV strategy. | Hybrid. | Early; may change if role interpretation changes; downstream cannot override. | Platform-wide. | Critical. |
| Requirement Criticality | Identify hard filters and disqualifiers. | Avoid wasting space or hiding blockers. | Requirements, JD language. | Criticality labels. | Requirements prioritized. | Hard requirements are explicit. | Disqualifying gaps missed. | D03. | Gap severity, interview probability. | Hybrid. | Early; immutable for JD version unless JD is reinterpreted. | Platform-wide. | Critical. |
| Hidden Hiring Signal Interpretation | Decode implicit needs. | Improve manager relevance beyond keyword matching. | JD, role family, market pattern. | Hidden signals. | JD interpreted. | Signals are plausible and labeled as inferred. | Inferred signals become false requirements. | D01-D04. | Narrative, achievement selection. | AI-driven with confidence labels. | Early; may be revised by human or outcome feedback. | Platform-wide. | High. |
| ATS Keyword Identification | Identify searchable terms. | Improve screening and ATS match. | JD, requirements, role vocabulary. | Keyword set with support requirement. | Requirements exist. | Critical supported keywords are captured. | Keyword stuffing or unsupported keywords. | D02-D04. | Keyword strategy, ATS evaluation. | Hybrid. | Early; can change if JD changes; downstream cannot add unsupported keywords. | Reusable. | High. |
| Role Seniority Calibration | Determine implied seniority. | Prevent under- or over-positioning. | JD, responsibilities, scope terms. | Seniority model. | Hiring target exists. | Seniority expectation is clear. | Candidate is framed too junior or too senior. | D01-D04. | Positioning, claim risk, summary strategy. | Hybrid. | Early; may change with JD interpretation. | Platform-wide. | High. |
| Candidate Evidence Discovery | Identify available career evidence. | Use the strongest truthful material. | Evidence bank, raw career sources. | Candidate evidence pool. | Evidence sources exist. | Relevant evidence is discoverable. | Useful evidence missed. | None. | Normalization, mapping, selection. | Hybrid. | Before mapping; changes when evidence changes. | Platform-wide. | Critical. |
| Evidence Normalization | Convert raw material into atomic evidence. | Make evidence reusable and inspectable. | Raw evidence. | Structured evidence items. | Evidence discovered. | Evidence is atomic, specific, and source-linked. | Blended facts, missing provenance, unsupported summaries. | D08. | Confidence, mapping, claim validation. | Hybrid. | Before mapping; changes only with source updates or correction. | Platform-wide. | Critical. |
| Evidence Provenance | Preserve source and lineage. | Make claims defensible. | Evidence items, sources. | Provenance records. | Evidence normalized. | Every evidence item has lineage. | Source missing or unverifiable. | D09. | Confidence, claim validation. | Rule-based. | Created with evidence; immutable except correction. | Platform-wide. | Critical. |
| Evidence Confidence | Rate support strength. | Avoid overstating weak evidence. | Evidence, provenance, source quality. | Confidence labels. | Provenance exists. | Support level is clear. | Weak evidence treated as strong. | D09-D10. | Ranking, selection, claim boundaries. | Hybrid. | Before selection; may change if evidence improves. | Platform-wide. | Critical. |
| Evidence Relevance Mapping | Map evidence to requirements. | Ground CV in role-specific evidence. | Requirements, evidence, confidence. | Evidence-requirement links. | Requirements and evidence exist. | Links have support strength and rationale. | Irrelevant evidence selected or relevant evidence missed. | D02-D11. | Ranking, coverage, selection. | Hybrid. | Before positioning and writing; changes if JD/evidence changes. | Platform-wide. | Critical. |
| Evidence Ranking | Rank evidence by role value. | Put strongest material first. | Relevance links, priority, confidence. | Ranked evidence list. | Mapping exists. | Highest-impact supported evidence is top-ranked. | Strong evidence buried. | D03-D12. | Selection, achievements, narrative. | Hybrid. | Before selection; may change if positioning changes. | Platform-wide. | Critical. |
| Evidence Selection | Choose evidence to use. | Maximize role fit within evidence limits. | Ranked evidence, constraints, output type. | Selected evidence set. | Ranking exists. | Selected evidence covers critical requirements and supports story. | Missing critical evidence or overuse of weak evidence. | D13. | Writing strategy, claim ledger, evaluation. | Hybrid. | Before writing; can change only through explicit new selection. | Reusable. | Critical. |
| Requirement Coverage | Measure coverage against JD. | Know what is strong and weak before writing. | Requirements, selected evidence. | Coverage matrix. | Selection exists. | Coverage status is explicit: direct, transferable, weak, missing. | Gaps hidden or coverage inflated. | D12-D14. | Gaps, positioning, evaluation. | Hybrid. | Before positioning; immutable for JD/evidence version. | Platform-wide. | Critical. |
| Missing Evidence Identification | Identify absent proof. | Prevent fake claims. | Coverage matrix, criticality. | Missing evidence list. | Coverage exists. | Missing items are explicit and scoped. | Missing evidence becomes implied strength. | D15. | Capability gaps, human input. | Hybrid. | Before positioning; can change only when evidence changes. | Platform-wide. | Critical. |
| Transferable Evidence Classification | Identify indirect but useful support. | Keep weak-fit CVs competitive truthfully. | Evidence links, missing evidence, role needs. | Transferable evidence labels. | Coverage exists. | Transferable strengths are honest and useful. | Transferable evidence framed as direct experience. | D12-D16. | Positioning, narrative, gap transparency. | Hybrid. | Before positioning; may change with role strategy. | Platform-wide. | High. |
| Claim Boundary Definition | Define what claims are safe. | Prevent exaggeration. | Evidence, confidence, missing evidence. | Allowed and forbidden claim boundaries. | Evidence confidence exists. | Claim strength matches proof. | Ownership, seniority, metric, or domain overclaim. | D10-D17. | Writer, claim validation, reviewer. | Hybrid. | Before writing; downstream cannot override. | Platform-wide. | Critical. |
| Claim Validation | Validate generated claims. | Ensure CV is defensible. | Draft claims, evidence, boundaries. | Claim support status. | Draft or planned claims exist. | Every claim has support level. | Unsupported claim passes. | D18 plus generated content. | Truthfulness, reviewer, repair. | Hybrid. | After writing and after repair; changes with content. | Platform-wide. | Critical. |
| Claim Risk Classification | Classify claim severity risk. | Focus review and repair on dangerous claims. | Claim validation, role criticality. | Claim risk labels. | Claim validation exists. | High-risk claims are flagged. | Dangerous ownership or metric claim treated as minor. | D19. | Reviewer, repair, export risk. | Hybrid. | After validation; updated after repair. | Platform-wide. | Critical. |
| Unsupported Claim Detection | Identify unsupported visible or implied claims. | Preserve truthfulness. | Claim ledger, evidence boundaries. | Unsupported claim list. | Claim validation exists. | Unsupported claims are counted and located. | Fabrication remains in final CV. | D19-D20. | Reviewer, repair, quality score. | Hybrid. | After writing/repair; cannot be overridden downstream. | Platform-wide. | Critical. |
| Metric Validity | Decide whether numbers can be used. | Avoid fake or misleading impact. | Metrics, source quality, claim context. | Metric approval status. | Evidence confidence exists. | Metrics are meaningful and attributable. | Diagnostic numbers presented as business impact. | D10-D18. | Achievement strategy, claim validation. | Hybrid. | Before and after writing; immutable per evidence version. | Platform-wide. | Critical. |
| Ownership Claim Safety | Decide whether ownership language is allowed. | Avoid false leadership/sales/architecture claims. | Evidence, role claims, boundaries. | Ownership safety status. | Claim boundaries exist. | Ownership language matches proof. | Invented quota, deal, customer, leadership, or architecture ownership. | D18-D22. | Writer, reviewer, repair. | Hybrid. | Before writing and after claim extraction; downstream cannot override. | Platform-wide. | Critical. |
| Capability Gap Identification | Identify real capability gaps. | Make risks visible without fabrication. | Missing evidence, critical requirements. | Capability gap list. | Coverage and missing evidence exist. | Gaps are truthful and specific. | Gaps hidden or treated as hallucinations. | D15-D17. | Positioning, gap transparency, interview prep. | Hybrid. | Before positioning; can change only with evidence/JD. | Platform-wide. | Critical. |
| Capability Gap Severity | Rank gaps by hiring risk. | Prioritize risk handling. | Gap list, requirement criticality. | Gap severity. | Gaps identified. | Critical gaps are visible. | Severe gaps minimized. | D24, D04. | Positioning, interview probability. | Hybrid. | Before positioning; may update with market/outcome evidence. | Platform-wide. | Critical. |
| Career Positioning | Choose strongest truthful target angle. | Maximize interview probability without overclaiming. | Coverage, gaps, transferable evidence, seniority. | Positioning decision. | Evidence and gaps known. | Positioning is competitive and defensible. | Writer invents direct fit or positioning is too weak. | D15-D25. | Narrative, summary, writing, evaluation. | AI-driven within evidence constraints. | Before writing; immutable for CV version unless explicitly revised. | Platform-wide. | Critical. |
| Fit Strategy | Label strategic fit. | Guide tone and risk handling. | Coverage, gap severity, positioning. | Good/Risky/Weak strategy. | Positioning exists. | Fit guides wording but never blocks generation. | Fit blocks generation or hides risk. | D26. | Writing strategy, gap transparency. | Hybrid. | Before writing; downstream cannot change. | Platform-wide. | High. |
| Career Narrative | Decide the story arc. | Make the candidate memorable and coherent. | Positioning, evidence ranking, career history. | Narrative plan. | Positioning exists. | Story is coherent and evidence-backed. | Generic story or unsupported transformation. | D13, D26-D27. | Summary, achievement ordering, cover letters. | AI-driven. | Before writing; may vary by artifact. | Platform-wide. | High. |
| Claims to Avoid | Define forbidden wording. | Prevent unsafe persuasion. | Gaps, boundaries, claim risk. | Forbidden claim list. | Claim boundaries and gaps exist. | Writer has explicit no-claim list. | Forbidden claim appears. | D18-D25. | Writer, reviewer, repair. | Hybrid. | Before writing; immutable unless evidence changes. | Platform-wide. | Critical. |
| Gap Transparency Strategy | Decide how to surface gaps. | Keep user informed and CV truthful. | Gap severity, fit strategy, positioning. | Gap handling plan. | Gaps and positioning exist. | Gaps are clear without sabotaging CV. | Gaps hidden or overemphasized. | D24-D29. | Writing, user report, interview prep. | Hybrid. | Before writing; downstream cannot hide critical gaps. | Platform-wide. | Critical. |
| Audience Strategy | Balance HR, manager, ATS, and interview needs. | Optimize for full hiring funnel. | Role type, JD, positioning. | Audience priority plan. | Positioning exists. | CV satisfies recruiter, manager, and ATS constraints. | Optimized for one audience while failing another. | D01-D30. | Summary, structure, quality evaluation. | Hybrid. | Before writing; can vary by artifact. | Reusable. | High. |
| Executive Summary Strategy | Decide top-of-CV message. | Earn continued reading quickly. | Positioning, top evidence, gaps, audience strategy. | Summary plan. | Audience strategy exists. | Summary is specific, truthful, and compelling. | Generic or inflated summary. | D26-D31. | Writer, evaluator. | Hybrid. | Before writing; may be repaired but not strategically overridden. | Reusable. | High. |
| Achievement Selection | Choose visible achievements. | Prove fit with strongest evidence. | Selected evidence, narrative, requirements. | Achievement set. | Evidence selected. | Critical proof appears. | Strong evidence omitted or weak evidence overused. | D13-D32. | Writer, evaluator. | Hybrid. | Before writing; changes require explicit strategy update. | Reusable. | Critical. |
| Achievement Ordering | Order achievements for impact. | Put strongest proof where readers notice it. | Achievement set, audience strategy. | Ordered achievements. | Achievements selected. | Top bullets match hiring priorities. | Top bullets are generic or low-value. | D33. | Writer, HR/HM readability. | Hybrid. | Before writing; can be optimized per artifact. | Reusable. | High. |
| Quantification Strategy | Decide which numbers to use. | Show scale without fake impact. | Metrics, metric validity, achievements. | Quantification plan. | Metric validity exists. | Numbers are attributable and useful. | Invented or misleading metrics. | D22, D33. | Writer, claim validation. | Hybrid. | Before writing; immutable per evidence version. | Reusable. | High. |
| Skill Selection | Choose skills to show. | Improve match and credibility. | Evidence, JD keywords, requirements. | Selected skills. | Evidence and keywords exist. | Skills are relevant and supported. | Unsupported skills or missing critical supported skills. | D06, D14-D18. | Writer, ATS, technical evaluation. | Hybrid. | Before writing; changes with role/evidence. | Reusable. | High. |
| Skill Ordering | Order skills by role value. | Improve scan quality. | Selected skills, role priorities. | Ordered skills. | Skills selected. | Critical skills are visible first. | Important skills buried. | D36. | Writer, ATS, recruiter scan. | Hybrid. | Before writing; artifact-specific. | Reusable. | High. |
| Technical Credibility Strategy | Decide technical depth and boundaries. | Make technical claims believable. | JD, skills, evidence, seniority. | Technical emphasis plan. | Skill and claim boundaries exist. | Technical depth matches proof. | Overstated engineering depth. | D07, D18, D36-D37. | Writer, HM evaluation. | Hybrid. | Before writing; downstream cannot inflate. | Reusable. | High. |
| Business Impact Strategy | Decide business outcomes to emphasize. | Show value, not just tasks. | Evidence, metrics, role priorities. | Business impact plan. | Evidence and metrics validated. | Outcomes are clear and grounded. | Task list without impact or fake impact. | D22, D33-D35. | Writer, HM evaluation. | Hybrid. | Before writing. | Reusable. | High. |
| Keyword Strategy | Decide supported keyword placement. | Improve ATS/recruiter matching. | Keywords, selected evidence, claim boundaries. | Keyword placement plan. | Keywords and boundaries exist. | Keywords appear naturally and truthfully. | Keyword stuffing or unsupported keywords. | D06, D18, D36. | Writer, ATS evaluation. | Hybrid. | Before writing; artifact-specific. | Reusable. | High. |
| ATS Optimization Strategy | Define parse-safe structure. | Prevent formatting loss in screening. | Audience strategy, format constraints, keywords. | ATS plan. | Output channel known. | Structure is parseable and searchable. | Layout harms parsing. | D31, D40. | Writer, export. | Rule-based with semantic input. | Before writing/export; resume-specific. | Resume-only. | High. |
| Writing Strategy | Compile writing plan. | Let Writer execute, not decide. | Positioning, evidence, achievements, skills, keywords, gaps. | Writing plan. | All pre-writing decisions complete. | Plan is complete and bounded. | Writer must rediscover strategy. | D01-D41. | Writer, evaluator. | Hybrid. | Immediately before writing; immutable for generated version. | Reusable. | High. |
| Content Omission Strategy | Decide what to omit. | Preserve focus and avoid risk. | Evidence, relevance, gaps, audience. | Omission list. | Evidence ranked. | Low-value or risky details excluded. | CV bloated or risky details included. | D13-D42. | Writer. | Hybrid. | Before writing; artifact-specific. | Reusable. | Medium. |
| Final Claim Ledger Validation | Validate all visible/implied claims. | Prove final CV truthfulness. | Generated CV, claim boundaries, evidence. | Claim ledger status. | CV exists. | All claims have support status. | Claims untraceable. | D18-D23, D42. | Truthfulness, reviewer, repair, export. | Hybrid. | After generation/repair; must match content hash. | Platform-wide. | Critical. |
| Truthfulness Verification | Decide whether CV stays within evidence. | Block fabrication. | Claim ledger, unsupported claims. | Truthfulness result. | Claim ledger valid. | No material unsupported claims. | Fabrication or contradiction. | D44. | Reviewer, repair, export, quality score. | Hybrid. | After generation/repair; downstream cannot override. | Platform-wide. | Critical. |
| HR Readability Evaluation | Score recruiter scan quality. | Improve first-pass screening. | CV, JD, audience strategy. | HR readability score. | CV exists. | Recruiter relevance is clear quickly. | Generic, dense, or unclear CV. | D31-D42. | Quality score, repair. | AI-driven with rubric. | After writing/repair. | Reusable. | High. |
| Hiring Manager Readability Evaluation | Score manager credibility. | Improve interview conversion. | CV, evidence, claim ledger. | HM readability score. | CV and claim ledger exist. | Scope, skills, outcomes are credible. | Manager cannot assess capability. | D33-D45. | Quality score, repair. | AI-driven with rubric. | After writing/repair. | Reusable. | High. |
| Evidence Coverage Evaluation | Score whether expected evidence survived. | Avoid losing strong proof. | Coverage matrix, CV, claim ledger. | Coverage score. | CV and coverage matrix exist. | Critical evidence appears. | Critical evidence omitted. | D15, D33, D44. | Quality score, regression. | Hybrid. | After writing/repair. | Platform-wide. | Critical. |
| Keyword Coverage Evaluation | Score keyword use. | Preserve ATS and recruiter match. | Keyword strategy, CV. | Keyword coverage score. | CV exists. | Supported keywords appear. | Critical supported keywords missing or unsupported terms added. | D40-D41. | Quality score, regression. | Hybrid. | After writing/export. | Reusable. | High. |
| Capability Gap Transparency Evaluation | Score gap visibility. | Keep risks honest. | Gap strategy, CV notes/report. | Gap transparency score. | Gap strategy exists. | Critical gaps are clear and not fabricated away. | Gaps hidden or exaggerated. | D24-D30. | Quality score, interview prep. | Hybrid. | After writing/repair. | Platform-wide. | Critical. |
| Interview Probability Evaluation | Estimate likelihood of interview. | Optimize the final product outcome. | All quality scores, JD, CV, gaps. | Interview probability score. | Quality scores exist. | Score reflects recruiter, manager, ATS, and truthfulness. | Inflated score despite gaps or unsupported claims. | D44-D50. | Regression, baseline, roadmap. | AI-driven with calibrated rubric. | After quality evaluation; can update with outcomes. | Platform-wide. | Critical. |
| Interview Readiness | Decide what candidate must prepare to defend. | Align CV with interview follow-up. | CV claims, gaps, narrative. | Interview readiness report. | CV and claim ledger exist. | Candidate can defend every major claim. | CV creates interview traps. | D44-D51. | Interview prep, career advisor. | Hybrid. | After final CV; updates with user prep. | Platform-wide. | High. |
| Repair Strategy | Decide how to address defects. | Improve CV without broad rewrite. | Reviewer issues, claim ledger, quality scores. | Repair plan. | Issues exist. | Repair plan is bounded and evidence-backed. | Repair changes strategy or fabricates evidence. | D44-D52. | Repair execution. | Rule-based with AI options. | After review; cannot override upstream truth decisions. | Reusable. | Critical. |
| Repair Authorization | Decide if mutation is allowed. | Prevent unsafe fixes. | Issue type, evidence, allowed zones. | Authorization status. | Repair strategy exists. | Only safe zones are mutable. | Non-repairable gap mutated. | D53. | Repair execution. | Rule-based. | Before repair; immutable for issue. | Platform-wide. | Critical. |
| Human Input Requirement | Decide whether user input is required. | Handle missing authority safely. | Issues, missing evidence, ambiguity. | Human request. | Issue exists. | User is asked only when needed. | System guesses missing truth. | D16, D24, D53-D54. | Human console, evidence update. | Rule-based. | Before repair or positioning revision. | Platform-wide. | Critical. |
| Re-evaluation Scope | Decide what to recheck. | Avoid stale approvals. | Repair diff, affected claims. | Recheck plan. | Repair applied/proposed. | Affected claims and scores are revalidated. | Stale review trusted. | D53-D55. | Reviewer, evaluator. | Rule-based. | After repair. | Platform-wide. | High. |
| Export Strategy | Decide output format and rendering rules. | Deliver usable artifact. | Accepted CV, audience, ATS rules. | Export plan. | CV accepted or risk accepted. | Format supports use case. | Format damages readability or parseability. | D41, D45-D51. | Export readiness. | Rule-based. | After quality decision. | Reusable. | Medium. |
| Export Readiness | Decide whether artifact can be sent. | Prevent stale or unsafe export. | Export artifact, reviewed CV hash, quality status. | Export decision. | Export generated. | Artifact matches accepted content and parse rules. | Stale, mismatched, or unsafe artifact. | D57. | User delivery, regression artifact. | Rule-based. | After export; cannot override truthfulness. | Resume-only. | High. |
| Product Quality Score | Aggregate product quality. | Measure whether CV is actually good. | Dimension scores, hard fails. | Product quality result. | Evaluations exist. | Score reflects true product value. | Passing process but bad CV. | D44-D58. | Regression, baseline. | Hybrid. | After evaluation; immutable for artifact version. | Platform-wide. | Critical. |
| Regression Decision | Decide if change improved product. | Prevent quality regressions. | Baseline score, new score, artifacts. | Regression decision. | Baseline exists. | Quality deltas are clear. | Unsupported claims increase unnoticed. | D59. | Baseline promotion, release decisions. | Rule-based. | After product evaluation. | Platform-wide. | Critical. |
| Baseline Promotion | Decide if new result becomes benchmark. | Improve product over time. | Regression decision, artifacts, human review if needed. | Baseline update. | Regression passes. | Better or stable truthful output promoted. | Worse output becomes baseline. | D60. | Future regression. | Rule-based with human review option. | After regression; explicit only. | Platform-wide. | High. |
| Outcome Feedback Interpretation | Interpret real-world results. | Calibrate interview probability. | Application outcomes, recruiter feedback, user edits. | Outcome insights. | Outcomes exist. | Feedback improves future scoring. | Spurious causality. | D51, D59-D61. | Evaluation, career advisor. | Hybrid. | Post-application; never silently rewrites evidence. | Platform-wide. | Medium. |
| Future Career Gap | Identify long-term gaps. | Help user improve career trajectory. | Repeated gaps, target roles, outcomes. | Career development gap list. | Career memory exists. | Gaps are actionable and evidence-based. | Product confuses current CV gap with permanent weakness. | D24-D25, D62. | Career advisor, learning plan. | AI-driven with evidence constraints. | After multiple cases/outcomes. | Platform-wide. | Medium. |
| Career Memory Update | Decide what to add to long-term memory. | Build reusable career intelligence. | New evidence, user corrections, outcomes. | Memory update proposal. | New durable fact exists. | Memory preserves truth and provenance. | Temporary CV wording becomes permanent fact. | D08-D11, D62-D63. | Future evidence and advisor decisions. | Hybrid with human review. | Continuous; user-correctable. | Platform-wide. | Medium. |

## 4. Lifecycle Rules

### 4.1 Immutability

These decisions should be immutable for a given input version:

- Hiring Target Interpretation
- Requirement Extraction
- Requirement Criticality
- Evidence Provenance
- Evidence Confidence
- Claim Boundary Definition
- Missing Evidence Identification
- Capability Gap Identification
- Claims to Avoid
- Writing Strategy
- Final Claim Ledger Validation
- Product Quality Score

They may be regenerated only when their input version changes.

### 4.2 Human-Changeable Decisions

Human review may change:

- evidence corrections
- evidence scope
- strategic positioning preference when multiple truthful options exist
- missing evidence supplied by user
- baseline promotion in ambiguous cases
- career memory updates

Human review may not approve fabrication as truth.

### 4.3 Downstream Override Rule

Downstream stages cannot override upstream decisions.

Allowed downstream actions:

- flag conflict
- request upstream recomputation
- request human input
- omit unsafe wording
- repair authorized zones

Forbidden downstream actions:

- Writer changing positioning
- Writer inventing evidence
- Reviewer rewriting CV
- Repair reclassifying capability gaps as strengths
- Export overriding truthfulness failure

## 5. Implementation Readiness Guidance

Future first-class architectural components should emerge in this order:

1. Requirement Intelligence
2. Evidence Intelligence
3. Claim Intelligence
4. Career Strategy Intelligence
5. Output Strategy Intelligence
6. Quality Intelligence
7. Correction Intelligence
8. Delivery Intelligence
9. Learning Intelligence
10. Career Growth Intelligence

This is an architectural evolution sequence, not a task list.
