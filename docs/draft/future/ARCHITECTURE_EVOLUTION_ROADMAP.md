Status: DRAFT
Authority: REFERENCE
Can Authorize Production Implementation: NO
Does Not Override: docs/architecture/CURRENT_ARCHITECTURE.md
Reason for Draft Status: Future evolution roadmap has no implementation approval.
Required Decision Before Activation: Explicit approved ADR and task.

# Architecture Evolution Roadmap

## 1. Scope

This roadmap defines architectural milestones only.

It does not define implementation tasks, ADRs, governance work, prompts, tests, or feature tickets.

## 2. Roadmap Principle

The product should evolve from:

```text
workflow-driven CV generation
```

to:

```text
evidence-and-decision-graph driven career artifact generation
```

The highest-value architectural shift is to make final CV quality objectively measurable.

## 3. Milestone 1 — First-Class Claim Ledger

Objective:

Create a product architecture where every visible and implied CV claim is represented as a traceable object.

Architectural value:

- separates wording from truth verification
- makes unsupported claims measurable
- enables safer repair
- supports future LinkedIn, cover letter, portfolio, and interview prep outputs

Expected product impact:

- fewer hallucinations
- stronger defensibility in interviews
- clearer reviewer decisions
- higher user trust

Dependencies:

- structured Evidence Bank
- CV claim extraction strategy
- evidence support classification

Risk:

- implied claims are hard to detect reliably
- too much traceability could slow generation

Success criteria:

- every visible claim has evidence IDs or explicit unsupported status
- unsupported ownership, metric, seniority, and architecture claims are detectable
- repair preserves claim identity across versions

## 4. Milestone 2 — Product Quality Evaluator

Objective:

Introduce an independent evaluator that scores final CV quality.

Architectural value:

- makes product improvement measurable
- separates quality scoring from Writer, Reviewer, Repair, and Export
- enables regression gates based on CV quality

Expected product impact:

- future changes can be judged by interview probability
- fewer changes that only improve process but not output
- clearer product prioritization

Dependencies:

- Product Evaluation Framework
- Golden Dataset
- Claim Ledger
- final CV artifact identity

Risk:

- interview probability scoring may be subjective
- evaluator may overfit to benchmark cases

Success criteria:

- every final CV receives dimension scores
- regression comparison is possible
- unsupported claim increase blocks baseline promotion
- quality deltas are visible before and after system changes

## 5. Milestone 3 — Requirement Graph and Coverage Matrix

Objective:

Make JD requirements and evidence coverage first-class artifacts.

Architectural value:

- separates JD interpretation from candidate positioning
- makes missing evidence measurable
- gives Writer a stable factual plan
- gives Evaluator a measurable coverage baseline

Expected product impact:

- better evidence selection
- stronger role alignment
- clearer capability gap transparency
- fewer missed critical requirements

Dependencies:

- Job Intelligence Engine
- Evidence Bank
- support-level taxonomy

Risk:

- semantic mapping may require AI judgment
- excessive granularity may create noisy coverage reports

Success criteria:

- each hard requirement has coverage status
- direct, transferable, weak, and missing support are distinguishable
- critical missing evidence is visible before writing
- final CV evidence coverage can be scored objectively

## 6. Milestone 4 — Positioning Strategist as Separate Authority

Objective:

Separate role positioning from JD analysis, evidence mapping, and writing.

Architectural value:

- makes strongest truthful positioning explicit
- prevents Writer from inventing strategy
- allows multiple truthful strategies to be compared
- supports human decision only when strategy is ambiguous

Expected product impact:

- stronger weak-fit CVs
- fewer unsupported direct-fit claims
- clearer interview risk explanation
- better strategic consistency across CV sections

Dependencies:

- Coverage Matrix
- Capability Gap register
- claim boundary taxonomy

Risk:

- over-conservative positioning may reduce competitiveness
- over-strategic positioning may become opaque to users

Success criteria:

- every CV version cites one positioning decision
- Writer cannot override positioning
- capability gaps remain transparent
- positioning consistency can be scored

## 7. Milestone 5 — CV Strategy Compiler

Objective:

Create a deterministic writing plan before generation.

Architectural value:

- reduces prompt complexity
- prevents Writer from selecting evidence opportunistically
- makes achievement ordering and keyword placement inspectable
- creates reusable strategy for CV, LinkedIn, and cover letter outputs

Expected product impact:

- better first drafts
- less repair
- stronger recruiter readability
- stronger hiring-manager relevance

Dependencies:

- Positioning Decision
- Coverage Matrix
- Evidence ranking
- output channel templates

Risk:

- overly rigid plans may reduce writing quality
- plan quality must be high enough to trust

Success criteria:

- writing plan includes section structure, evidence IDs, achievement order, skill order, keywords, and forbidden claims
- Writer uses plan without recomputing strategy
- generated CV quality improves or remains stable across golden cases

## 8. Milestone 6 — Prompt Simplification and Role Isolation

Objective:

Reduce broad prompts into narrow role-specific AI calls.

Architectural value:

- removes duplicate reasoning
- makes failures easier to locate
- lowers hallucination risk
- improves maintainability

Expected product impact:

- more consistent writing
- fewer unsupported claims
- easier regression analysis
- lower repair load

Dependencies:

- Claim Ledger
- Positioning Decision
- Writing Plan
- Reviewer and Evaluator boundaries

Risk:

- too many small AI calls can increase latency
- narrow prompts require strong structured inputs

Success criteria:

- Writer prompt no longer owns review, repair, or positioning decisions
- Reviewer prompt does not rewrite
- Repair prompt only mutates authorized zones
- repeated reasoning is reduced

## 9. Milestone 7 — Export as Artifact Renderer

Objective:

Separate export rendering from content quality judgment.

Architectural value:

- prevents export readiness from being confused with CV quality
- makes final artifact identity verifiable
- supports multiple output formats safely

Expected product impact:

- better ATS safety
- fewer stale exports
- clearer user decision when exporting with known risk

Dependencies:

- accepted CV version
- review hash
- export parser/checker
- quality evaluation result

Risk:

- export validation may not reflect real ATS behavior perfectly

Success criteria:

- exported artifact matches accepted CV content hash
- ATS parse safety is scored
- export warnings are separate from content quality warnings

## 10. Milestone 8 — Golden Dataset Regression System

Objective:

Use benchmark JDs and expected evidence to judge every product-impacting change.

Architectural value:

- makes product quality measurable over time
- prevents regressions masked by passing workflow checks
- enables baseline promotion discipline

Expected product impact:

- higher CV quality over time
- fewer regressions in weak-fit cases
- more objective product decisions

Dependencies:

- Product Quality Evaluator
- Golden Dataset
- final artifact storage
- baseline comparison model

Risk:

- benchmark set may be too small or biased
- scores may be gamed if not periodically refreshed

Success criteria:

- every pipeline change can answer whether CV quality improved
- unsupported claim increases block promotion
- interview probability deltas are tracked
- Good/Risky/Weak cases are all represented

## 11. Milestone 9 — Outcome Feedback Loop

Objective:

Connect real-world application outcomes back into product evaluation.

Architectural value:

- calibrates interview probability scoring
- identifies which CV qualities actually matter
- supports long-term career advisor intelligence

Expected product impact:

- better prioritization of CV improvements
- more realistic recommendations
- improved personalization

Dependencies:

- user outcome capture
- privacy-safe storage
- evaluation history
- application tracking

Risk:

- outcome data may be sparse
- many external factors affect interview results
- privacy expectations must be clear

Success criteria:

- interview, rejection, callback, and user-edit outcomes can be recorded
- evaluation model can compare predicted and actual outcomes
- product recommendations improve over time

## 12. Milestone 10 — Career Artifact Platform

Objective:

Generalize the architecture beyond CV generation.

Architectural value:

- one evidence and decision graph supports many career artifacts
- avoids rebuilding separate prompt chains for each output
- enables continuous career memory and AI career advising

Expected product impact:

- consistent personal branding
- faster generation of LinkedIn, portfolio, cover letters, interview prep, and career reports
- stronger long-term user value

Dependencies:

- Evidence Bank
- Claim Ledger
- Positioning Strategist
- channel-specific renderers
- product evaluation per artifact type

Risk:

- artifact types have different success criteria
- personal brand strategy may conflict with JD-specific optimization

Success criteria:

- CV, LinkedIn, cover letter, and interview prep can share evidence and positioning
- each artifact has its own evaluator
- claims remain traceable across channels

## 13. One-Month Priority

If only one month is available, prioritize:

```text
Claim Ledger + Product Quality Evaluator
```

Objective:

Make final CV quality measurable and truth-verifiable.

Architectural value:

- creates the missing product feedback loop
- makes every future architecture decision more objective
- directly improves truthfulness and interview probability measurement

Expected product impact:

- immediate reduction in unsupported claims
- clearer weak-fit handling
- measurable CV quality deltas
- stronger confidence in whether changes improve the product

Dependencies:

- existing final CV versions
- evidence IDs
- reviewer outputs
- product evaluation framework

Risk:

- claim extraction may be incomplete at first
- evaluator scores need calibration

Success criteria:

- final CV can be scored across product dimensions
- unsupported claims are counted and severity-ranked
- missing critical evidence is counted
- interview probability score is tracked
- before/after regression decisions become possible

## 14. Roadmap Conclusion

The architecture should not evolve by adding more review loops or broader prompts.

It should evolve by making the product’s core truth model explicit:

```text
Evidence
→ Requirement Coverage
→ Positioning
→ Writing Plan
→ Claims
→ Quality Score
→ Export
→ Outcome Feedback
```

That is the architecture most likely to produce better CVs over time.
