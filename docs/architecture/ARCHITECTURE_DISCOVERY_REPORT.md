# Architecture Discovery Report

## 1. Scope

This report designs an AI-powered CV Decision System from first principles.

The product goal is not resume generation. The product goal is:

> Given a Job Description and an Evidence Bank, generate the highest-quality truthful CV possible, maximizing interview probability, hiring-manager readability, ATS compatibility, business storytelling, technical credibility, evidence traceability, and long-term maintainability.

This report intentionally starts from a clean-slate architecture and does not optimize for the current implementation.

## 2. First-Principles Product Thesis

A world-class AI CV product should not be architected as a linear prompt chain.

It should be architected as a decision system:

1. understand the hiring target
2. understand the candidate’s provable evidence
3. decide the strongest truthful positioning
4. select and rank evidence
5. construct a CV strategy
6. draft a CV
7. verify every claim
8. optimize for recruiter, manager, and ATS audiences
9. repair only bounded defects
10. export only a version with known quality and known risk
11. learn from evaluations and outcomes

The central asset is not the CV document.

The central asset is a traceable evidence-to-claim graph that can produce many external artifacts: CV, LinkedIn, portfolio, cover letter, interview prep, career report, and personal brand narrative.

## 3. Major Subsystems

### 3.1 Evidence Bank

Primary responsibility:

Store candidate facts, claims, projects, achievements, metrics, skills, constraints, and provenance.

Responsibilities:

- normalize raw career material into atomic evidence
- preserve source provenance
- distinguish verified facts, weak evidence, inferred transferable evidence, and missing evidence
- maintain claim boundaries
- track metrics and their source quality
- support contradiction detection

Does not own:

- role positioning
- CV wording
- reviewer decisions
- export readiness

### 3.2 Job Intelligence Engine

Primary responsibility:

Convert a JD into a structured hiring target.

Responsibilities:

- identify hard requirements
- identify nice-to-have requirements
- infer hiring manager priorities
- infer recruiter screening filters
- extract ATS keywords
- identify seniority, domain, and business context
- detect hidden requirements
- classify disqualifying or high-risk gaps

Does not own:

- candidate positioning
- evidence selection
- CV generation

### 3.3 Evidence-to-Requirement Mapper

Primary responsibility:

Map candidate evidence to JD requirements.

Responsibilities:

- link evidence to requirements
- score support strength
- identify direct evidence
- identify transferable evidence
- identify missing evidence
- identify unsupported claims that must not be made
- produce a requirement coverage matrix

Does not own:

- narrative strategy
- final wording
- repair

### 3.4 Positioning Strategist

Primary responsibility:

Choose the strongest truthful role positioning.

Responsibilities:

- determine target positioning
- define fit tier for strategy, not for generation permission
- choose narrative angle
- decide transferable positioning when direct fit is weak
- define claim boundaries
- define capability gaps and interview risk
- define claims to avoid

Does not own:

- evidence extraction
- reviewer classification
- repair execution
- export decision

### 3.5 CV Strategy Compiler

Primary responsibility:

Compile a deterministic writing plan from job intelligence, evidence mapping, and positioning.

Responsibilities:

- define section structure
- select achievements
- order achievements
- order skills
- choose keyword placement
- define executive summary inputs
- define business impact emphasis
- define technical credibility emphasis
- define gap-handling rules
- specify evidence IDs required for each claim zone

Does not own:

- freeform writing
- post-generation review
- repair execution

### 3.6 Writer

Primary responsibility:

Generate the CV from the compiled strategy.

Responsibilities:

- convert approved evidence-backed claims into polished wording
- write for HR readability
- write for hiring-manager credibility
- include ATS-safe keywords truthfully
- preserve evidence IDs per claim
- produce structured visible CV content
- produce non-visible notes for gaps and interview risk

Does not own:

- selecting evidence
- changing positioning
- deciding whether gaps exist
- approving truthfulness
- repairing reviewer-identified defects

### 3.7 Claim Ledger

Primary responsibility:

Maintain a machine-readable ledger of every visible and implied CV claim.

Responsibilities:

- extract claims from generated CV
- map each claim to evidence IDs
- classify claim type: skill, achievement, metric, ownership, leadership, customer, architecture, sales, domain, seniority
- classify support level
- flag unsupported or ambiguous claims
- preserve traceability across repair versions

Does not own:

- writing style
- interview probability scoring
- export layout

### 3.8 Quality Evaluator

Primary responsibility:

Score CV product quality.

Responsibilities:

- score HR readability
- score hiring-manager readability
- score ATS compatibility
- score evidence coverage
- score keyword coverage
- score positioning consistency
- score truthfulness
- score missing critical evidence
- score unsupported claims
- score capability gap transparency
- score quantified achievement quality
- score executive summary quality
- score technical skill presentation
- score business impact clarity
- score interview probability

Does not own:

- repair execution
- evidence mutation
- positioning mutation

### 3.9 Reviewer

Primary responsibility:

Classify defects and risks in the generated CV.

Responsibilities:

- consume the Claim Ledger and Quality Evaluator output
- produce structured issues
- classify severity
- classify repairability
- distinguish unsupported claims from truthful capability gaps
- provide repair intent

Does not own:

- rewriting the CV
- deciding target positioning
- selecting evidence
- export decision

### 3.10 Repair Engine

Primary responsibility:

Execute bounded evidence-backed modifications.

Responsibilities:

- consume structured reviewer issues
- determine repair route
- apply deterministic fixes where safe
- request human input when required
- request AI rewrite only inside authorized zones
- preserve claim ledger traceability
- re-evaluate affected claims after mutation
- promote repaired version only when checks pass

Does not own:

- reviewer classification
- evidence selection
- positioning strategy
- export policy

### 3.11 Export Engine

Primary responsibility:

Produce ATS-safe and human-readable final documents from an accepted CV version.

Responsibilities:

- render formats
- preserve content identity
- validate parse safety
- record export metadata
- separate export warnings from quality warnings

Does not own:

- content quality scoring
- repair
- CV wording

### 3.12 Human Decision Console

Primary responsibility:

Ask for human judgment only where the system lacks authority.

Responsibilities:

- collect missing evidence
- ask positioning preference only when evidence supports multiple truthful strategies
- request approval for visible wording changes
- explain capability gaps
- explain interview risk
- expose evidence traceability

Does not own:

- hidden AI decisions
- silent generation
- automatic override of truthfulness rules

### 3.13 Evaluation and Learning System

Primary responsibility:

Measure whether product changes improve final CV quality.

Responsibilities:

- run golden dataset evaluations
- compare regression metrics
- track interview probability score
- record user feedback
- record real application outcomes when available
- update evaluation baselines
- detect quality drift

Does not own:

- production generation policy
- governance approval
- rewriting the CV

## 4. Information Flow

```text
Raw Evidence
→ Evidence Bank
→ Evidence Graph

Raw JD
→ Job Intelligence Engine
→ Requirement Graph

Evidence Graph + Requirement Graph
→ Evidence-to-Requirement Mapper
→ Coverage Matrix

Coverage Matrix + Requirement Graph
→ Positioning Strategist
→ Positioning Decision

Positioning Decision + Coverage Matrix
→ CV Strategy Compiler
→ Writing Plan

Writing Plan + Evidence Graph
→ Writer
→ Draft CV + Claim References

Draft CV + Claim References + Evidence Graph
→ Claim Ledger
→ Verified Claim Graph

Draft CV + Claim Ledger + Requirement Graph
→ Quality Evaluator + Reviewer
→ Scores + Structured Issues

Structured Issues
→ Repair Engine
→ Repaired CV Version

Accepted CV Version
→ Export Engine
→ Final CV

Final CV + Scores + Outcomes
→ Evaluation and Learning System
→ Product Regression Baselines
```

## 5. Decision Flow

The system should not ask “can we generate a CV?”

It should ask:

1. What is the hiring target?
2. What evidence is available?
3. What is the strongest truthful positioning?
4. What evidence must be visible?
5. What claims are forbidden?
6. What gaps must remain transparent?
7. What CV structure best serves this role?
8. What wording maximizes interview probability without exceeding evidence?
9. Which claims survive verification?
10. Which defects are repairable?
11. Which defects require human input?
12. Which version is exportable?
13. Did the final CV improve against the baseline?

## 6. Data Flow

Core data objects:

- Evidence Item
- Evidence Source
- JD Requirement
- Requirement Coverage
- Positioning Decision
- CV Strategy Plan
- CV Version
- Claim Ledger
- Review Issue
- Repair Plan
- Export Artifact
- Evaluation Result
- Regression Baseline

The most important invariant:

Every visible claim in the final CV should be traceable to evidence or explicitly classified as unsupported and blocked.

## 7. Control Flow

Recommended control model:

```text
Human selects JD and evidence scope
→ System builds job intelligence
→ System maps evidence
→ System proposes positioning
→ Human confirms only if strategic ambiguity exists
→ System compiles CV strategy
→ Writer drafts CV
→ Claim Ledger verifies claims
→ Quality Evaluator scores output
→ Reviewer emits structured issues
→ Repair Engine fixes bounded defects
→ Evaluator re-scores
→ Human reviews risk report
→ Export Engine renders final CV
→ Evaluation System compares against baseline
```

Control should be event-driven and versioned, not UI-step-driven.

## 8. AI Reasoning Boundaries

AI should be used for:

- interpreting ambiguous JD language
- identifying hidden hiring signals
- judging recruiter and manager readability
- crafting narrative strategy
- writing polished CV wording
- estimating interview probability
- explaining capability gaps

AI should not be the sole authority for:

- whether a claim has evidence
- whether a metric exists
- whether a repair is allowed
- whether a version identity changed
- whether export content matches reviewed content
- whether unsupported claims are acceptable

Deterministic systems should own:

- hashes
- version identity
- evidence ID linkage
- claim ledger consistency
- required field presence
- banned unsupported ownership patterns
- export content equivalence
- regression threshold calculation

## 9. Human Interaction Boundaries

Human input is required when:

- evidence is missing but may exist outside the system
- a claim boundary is ambiguous
- multiple truthful positioning strategies exist
- visible wording changes materially affect professional identity
- export is requested with known risk

Human input is not required when:

- deterministic formatting repair is safe
- unsupported claim must be removed
- a claim contradicts evidence
- a known capability gap must remain transparent

## 10. Persistence

Persistence should store:

- raw evidence sources
- normalized evidence items
- evidence provenance
- JD snapshots
- requirement graphs
- coverage matrices
- positioning decisions
- writing plans
- CV versions
- claim ledgers
- review results
- repair plans
- export artifacts
- evaluation results
- regression baselines

Persistence should not store:

- transient UI step status as source of truth
- duplicated derived conclusions without lineage
- prompt output that cannot be linked to input hashes

## 11. Versioning

Every major artifact should be content-addressed:

- Evidence Bank version
- JD version
- Requirement Graph version
- Coverage Matrix version
- Positioning Decision version
- Writing Plan version
- CV version
- Claim Ledger version
- Review version
- Repair version
- Export version
- Evaluation version

Version promotion rule:

A CV version becomes the current accepted version only when its claim ledger, review result, and evaluation result match the current content hash.

## 12. Evaluation

The product should be evaluated by final CV quality.

Required evaluation dimensions:

- HR Readability
- Hiring Manager Readability
- ATS Compatibility
- Evidence Coverage
- Keyword Coverage
- Positioning Consistency
- Truthfulness
- Missing Critical Evidence
- Unsupported Claims
- Capability Gap Transparency
- Quantified Achievement Quality
- Executive Summary Quality
- Technical Skill Presentation
- Business Impact Clarity
- Interview Probability

The evaluation layer should be independent from Writer, Reviewer, and Repair.

## 13. Feedback Loops

Feedback loops:

1. evaluation score to product regression
2. reviewer issues to repair
3. user corrections to Evidence Bank
4. interview outcomes to evaluation baselines
5. recruiter feedback to JD interpretation and positioning
6. hiring manager feedback to narrative strategy

Feedback must not directly mutate candidate evidence without provenance.

## 14. Product Perspectives

### 14.1 Software Architect

What makes a CV better:

- stable data lineage
- no mixed responsibilities
- reproducible output
- version-safe repair
- measurable quality deltas

System decisions:

- artifact identity
- ownership boundaries
- deterministic validation
- persistence model

Deterministic:

- versioning, hashes, evidence links, export equivalence, threshold checks

AI-driven:

- narrative wording, role interpretation, interview probability estimation

### 14.2 AI Architect

What makes a CV better:

- AI reasoning is bounded by evidence
- prompts consume structured decisions instead of rediscovering them
- outputs are validated against a claim ledger

System decisions:

- where AI can infer
- where AI must cite evidence
- when AI output requires verification

Deterministic:

- evidence support checks, claim extraction schema validation

AI-driven:

- ambiguous JD interpretation, storytelling, wording quality judgment

### 14.3 Hiring Manager

What makes a CV better:

- clear capability
- credible scope
- concrete outcomes
- signal-to-noise ratio
- no inflated claims that collapse in interview

System decisions:

- which achievements prove role ability
- what technical depth to show
- what business impact matters

Deterministic:

- presence of required evidence, claim support level

AI-driven:

- perceived strength, seniority fit, narrative coherence

### 14.4 Technical Recruiter

What makes a CV better:

- role match visible quickly
- keywords present
- titles and skills easy to scan
- no confusing internal wording

System decisions:

- summary angle
- keyword placement
- section order
- title alignment

Deterministic:

- keyword presence, ATS formatting, required sections

AI-driven:

- recruiter readability, screening appeal

### 14.5 Senior Engineering Manager

What makes a CV better:

- authentic technical credibility
- clear problem-solving ownership
- realistic seniority
- meaningful outcomes

System decisions:

- technical focus
- achievement ordering
- depth versus breadth tradeoff
- leadership claim boundaries

Deterministic:

- unsupported architecture or leadership claims

AI-driven:

- credibility judgment, interview risk estimation

### 14.6 ATS Vendor

What makes a CV better:

- parseable structure
- standard sections
- consistent dates and titles
- role-relevant keywords
- low formatting complexity

System decisions:

- export structure
- section labels
- keyword coverage

Deterministic:

- parse safety, headings, keyword extraction

AI-driven:

- synonym mapping when exact keywords are absent but evidence is related

### 14.7 Career Coach

What makes a CV better:

- strongest truthful story
- confidence without exaggeration
- gaps clearly understood
- interview preparation alignment

System decisions:

- career narrative
- transferable strengths
- gap explanation
- interview prep priorities

Deterministic:

- claims that must not be made

AI-driven:

- coaching explanation, narrative framing

### 14.8 Product Manager

What makes a CV better:

- measurable interview probability improvement
- repeatable quality
- lower user effort
- fewer hallucinations
- scalable artifact generation

System decisions:

- success metrics
- regression baselines
- user approval points
- product roadmap prioritization

Deterministic:

- metric deltas, pass/fail gates

AI-driven:

- qualitative quality judgments, user-facing explanations

## 15. Long-Term Product Vision

The clean-slate architecture scales naturally if the Evidence Bank, Requirement Graph, Positioning Decision, Claim Ledger, and Evaluation System are artifact-neutral.

Future outputs:

- Resume
- LinkedIn
- Portfolio
- Cover Letter
- Interview Preparation
- Career Report
- Personal Branding
- Continuous Career Memory
- AI Career Advisor

The architecture should not be “CV-first.”

It should be “career evidence and decision graph first,” with CV as one output channel.

## 16. Critical Review

Weaknesses:

- Claim Ledger quality is hard and may require hybrid deterministic and AI extraction.
- Interview probability is partly subjective and needs calibration against real outcomes.
- Evidence normalization requires strong UX; users may not provide enough raw material.
- The system can become over-engineered if every decision becomes a separate service too early.
- Human approval points can slow the workflow if not carefully designed.

Trade-offs:

- Strong traceability increases complexity.
- Deterministic gates reduce hallucination risk but may reject good nuanced wording.
- AI-driven narrative improves quality but requires verification.
- A rich Evidence Bank improves future outputs but creates onboarding cost.

Assumptions:

- Candidate evidence can be structured with enough fidelity.
- Recruiter and manager readability can be scored consistently.
- Golden datasets can approximate interview probability.
- Users value truthfulness over aggressive but risky positioning.

Potential failure points:

- claim extraction misses implied claims
- writer produces unsupported implication without explicit false statement
- evaluator rewards ATS keywords over credibility
- repair changes wording but stale claim ledger remains trusted
- human accepts risky export without understanding implications

What would break first:

The Claim Ledger and Evidence-to-Requirement Mapper. If they are weak, every downstream system either fabricates, hides gaps, or optimizes the wrong story.

Future research required:

- calibrated interview probability scoring
- reliable implied-claim detection
- ATS parse simulation fidelity
- benchmark CV quality dataset design
- outcome feedback integration

## 17. Final Answer

If starting again today, would I build the same architecture as the current project?

NO.

I would build a decision-graph architecture centered on evidence, requirements, claim traceability, and product evaluation, with CV generation as one renderer of that decision graph.

If I had only one month to improve this product, the greatest architectural change would be:

Build the Claim Ledger and Product Evaluation layer.

Reason:

This directly attacks the highest-value product failure: the system cannot objectively know whether the final CV is better, truthful, and more interview-worthy. A Claim Ledger plus evaluation scorecard would make Writer, Reviewer, Repair, and Export accountable to final CV quality instead of process completion.
