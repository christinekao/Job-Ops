# Writer Refactoring Plan

## 1. Purpose

This document defines how Writer should evolve from a decision-heavy prompt role into a pure execution engine.

It does not prescribe implementation tasks or code changes.

## 2. Core Principle

Writer should not decide what is true, what matters, what is safe, or whether the CV is good.

Writer should only express approved decisions in clear, persuasive, external-facing CV language.

## 3. Responsibilities to Remove from Writer

Writer should no longer own:

| Responsibility | New owner | Reason |
|---|---|---|
| Requirement understanding | Requirement Model | Writer should not reinterpret the JD. |
| Requirement prioritization | Requirement Model | Writer should not decide what the employer values most. |
| Evidence discovery | Coverage Matrix | Writer should not search for support while writing. |
| Evidence ranking | Coverage Matrix | Writer should not choose convenient evidence. |
| Evidence selection | Coverage Matrix / WritingPlan | Writer should not decide which facts are allowed. |
| Missing evidence identification | Coverage Matrix | Writer should not discover gaps after drafting. |
| Capability gap identification | Coverage Matrix | Writer should not hide or invent around gaps. |
| Claim approval | Claim Ledger | Writer must not approve its own claims. |
| Claim risk classification | Claim Ledger | Writer should not decide whether ownership or metric claims are safe. |
| Truthfulness verification | Claim Ledger / Product Quality Evaluator | Writer self-review is not sufficient. |
| Keyword strategy | Requirement Model + WritingPlan | Writer may place keywords but cannot choose unsupported keywords. |
| Achievement selection | WritingPlan | Writer may phrase achievements but cannot choose new ones. |
| Skill selection | WritingPlan | Writer may format skills but cannot invent skills. |
| Positioning decision | WritingPlan derived from Requirement + Coverage | Writer must execute positioning, not create it. |
| Quality scoring | Product Quality Evaluator | Writer should not grade final output. |
| Repair strategy | Product Quality Evaluator / Repair Runtime | Writer should not decide how to fix failures. |
| Export readiness | Export Runtime | Writer has no delivery authority. |

## 4. New Writer Contract

Writer is a pure execution engine.

### 4.1 Inputs Writer Receives

Writer receives:

- WritingPlan
- approved Claim IDs
- approved Claim text or claim intent
- ClaimSources only as context, not as permission to invent
- forbidden claim list
- required keywords that are evidence-supported
- required sections
- allowed tone
- output length target
- gap handling instructions
- output schema

### 4.2 Outputs Writer Generates

Writer outputs:

- Draft CV
- sentence IDs
- claim ID references per sentence where possible
- non-visible notes only if requested by WritingPlan
- unresolved writer warnings if it cannot execute the plan safely

### 4.3 Decisions Writer Is Forbidden to Make

Writer must not:

- invent evidence
- select new evidence
- change requirement priority
- change career positioning
- strengthen claim beyond approved boundary
- add unsupported metrics
- add unsupported ownership
- add unsupported leadership
- add unsupported architecture ownership
- add unsupported sales, quota, deal, or customer-facing responsibility
- hide capability gaps
- reclassify transferable evidence as direct evidence
- decide final quality
- decide repair route
- decide export readiness

## 5. Writer Input Shape

Conceptual input:

```text
WritingPlan
- target role
- positioning note
- audience priority
- required sections
- summary claim IDs
- achievement claim IDs
- skill claim IDs
- supported keyword IDs
- forbidden claim rules
- gap handling instructions
- tone
- length target
- output schema
```

Writer should not receive raw unbounded evidence as the main input.

Raw evidence can be provided only as read-only context and only when tied to approved Claim IDs.

## 6. Writer Output Shape

Conceptual output:

```text
DraftCV
- summary sentences
- experience bullets
- skills
- education/certifications if applicable
- sentence IDs
- claim ID references
- writerWarnings
```

Writer warnings are required when:

- approved claims are insufficient for a requested section
- required keyword cannot be placed naturally
- gap handling instruction conflicts with persuasive wording
- output length target cannot be met without padding

## 7. Writer Failure Conditions

Writer output fails if:

- any sentence lacks claim trace and is not classified as non-claim
- forbidden claim appears
- unsupported keyword appears as experience
- approved positioning is changed
- capability gap is hidden as strength
- evidence confidence is exaggerated
- visible CV contains internal system language

## 8. Temporary Responsibilities That May Stay in Writer

To minimize implementation risk, these may temporarily remain in Writer:

- external-facing wording quality
- sentence-level phrasing
- section transitions
- concise summary composition
- natural keyword placement from approved keywords
- tone consistency

These are execution responsibilities, not decision responsibilities.

## 9. Migration Strategy

### What can remain unchanged

- existing JD-first user flow
- current explicit AI action model
- current CV generation user action
- current review/repair/export sequence
- local persistence approach
- current Writer as text generator during transition

### What should move

- requirement interpretation out of Writer prompt
- evidence selection out of Writer prompt
- gap identification out of Writer prompt
- claim safety rules out of Writer prompt
- quality scoring out of Writer prompt
- repair strategy out of Writer prompt

### What should be extracted

- Requirement Model artifact
- Coverage Matrix artifact
- Claim Ledger artifact
- Product Quality Evaluator result

### What should disappear

- Writer self-authorizing unsupported claims
- broad prompt instructions asking Writer to act as analyst, reviewer, and repair engine
- repeated AI rediscovery of requirements and gaps
- hidden quality checklist inside Writer as the only quality gate

### What should stay inside Writer temporarily

- polished phrasing
- sentence construction
- section wording
- style adaptation
- concise business storytelling

### What should become independent runtime domains

Only:

1. Requirement Model
2. Coverage Matrix
3. Claim Ledger
4. Product Quality Evaluator

## 10. Product Quality Evaluator Design

Metrics:

| Metric | Purpose | Inputs | Score | Threshold | Failure action |
|---|---|---|---|---|---|
| Requirement Coverage | Verify the CV addresses important requirements. | Requirement Model, Coverage Matrix, CV. | 0-5 | >= 4.0 | Add supported evidence or disclose gap. |
| Unsupported Claims | Detect unapproved or unsupported claims. | Claim Ledger, SentenceTrace. | 0-5 | >= 4.5 | Remove, weaken, or request evidence. |
| Evidence Strength | Assess quality of evidence behind visible claims. | ClaimSources, CoverageRows. | 0-5 | >= 4.0 | Replace weak evidence or reduce claim strength. |
| Truthfulness | Verify all visible claims remain within evidence. | Claim Ledger, unsupported claim list. | 0-5 | >= 4.5 | Block export until fixed. |
| Keyword Coverage | Check supported JD keyword visibility. | Keywords, WritingPlan, CV. | 0-5 | >= 4.0 | Add supported keyword naturally. |
| Positioning Consistency | Check whether CV follows approved positioning. | WritingPlan, CV, Claim Ledger. | 0-5 | >= 4.0 | Repair affected sections. |
| Narrative Consistency | Check whether summary, bullets, and skills tell one coherent story. | WritingPlan, CV. | 0-5 | >= 4.0 | Repair structure or wording. |
| Business Readability | Check business impact clarity. | CV, ClaimSources, requirements. | 0-5 | >= 3.8 | Improve outcome wording using approved claims. |
| Technical Readability | Check technical credibility and clarity. | CV, skills, technical requirements, Claim Ledger. | 0-5 | >= 4.0 | Clarify or weaken technical wording. |
| Interview Readiness | Check whether candidate can defend the CV. | Claim Ledger, CapabilityGaps, CV. | 0-5 | >= 3.8 | Add interview notes or remove risky claims. |

Each metric must include:

- score
- explanation
- evidence references
- failed sentences or missing requirements
- recommended repair focus

## 11. Implementation Order

This is architectural sequencing only.

### Stage 1 — Requirement Model

Objective:

Make JD interpretation explicit and versioned.

Product value:

The system stops asking Writer to infer the job.

Risk:

Low. It can be introduced as an artifact before changing generation.

Success criteria:

Requirement Model is produced for each JD and referenced by downstream artifacts.

### Stage 2 — Coverage Matrix

Objective:

Make evidence support and missing evidence explicit.

Product value:

The system knows what is strong, weak, transferable, or missing before writing.

Risk:

Medium. Evidence mapping quality must be good enough to trust.

Success criteria:

Critical requirements have coverage status before generation.

### Stage 3 — Claim Ledger

Objective:

Make approved claims and generated sentence traceability first-class.

Product value:

The system can prove whether each CV sentence is supported.

Risk:

High. Claim extraction and implied claims are difficult.

Success criteria:

Every generated sentence maps to approved claims or is marked non-claim/unsupported.

### Stage 4 — Writer Contract Simplification

Objective:

Turn Writer into an execution engine.

Product value:

Fewer unsupported claims and less duplicated AI reasoning.

Risk:

Medium. Writing quality may temporarily drop if WritingPlan is incomplete.

Success criteria:

Writer no longer decides requirements, evidence selection, positioning, claim safety, or quality.

### Stage 5 — Product Quality Evaluator

Objective:

Score and explain final CV quality.

Product value:

The system can explain whether the CV is good, bad, risky, or regressed.

Risk:

Medium. Scoring must be calibrated.

Success criteria:

Every final CV has metric scores, explanations, thresholds, and failure actions.

### Stage 6 — Repair and Export Integration

Objective:

Use EvaluationResult and Claim Ledger to guide repair and export.

Product value:

Repair becomes bounded by claim truth, and export cannot ship unsafe content.

Risk:

Medium. Existing repair/export flows must remain stable during transition.

Success criteria:

Repair instructions reference affected claims/sentences, and export references matching CV, Claim Ledger, and EvaluationResult versions.

## 12. Final Writer Rule

Writer is successful when it produces persuasive wording from approved decisions.

Writer fails when it makes new decisions.
