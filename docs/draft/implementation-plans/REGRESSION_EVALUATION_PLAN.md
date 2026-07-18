Status: DRAFT
Authority: REFERENCE
Can Authorize Production Implementation: NO
Does Not Override: docs/architecture/CURRENT_ARCHITECTURE.md
Reason for Draft Status: Unapproved evaluation implementation plan.
Required Decision Before Activation: Explicit task approval.

# Regression Evaluation Plan

## 1. Purpose

This plan defines how every pipeline change is evaluated against product quality.

The required regression question is:

> Did this change produce a better final CV, without increasing fabrication risk?

## 2. Trigger

Run product regression evaluation for any change that can affect:

- evidence selection
- CV brief construction
- writer behavior
- reviewer behavior
- repair behavior
- export behavior
- final CV structure
- scoring thresholds
- positioning or truthfulness policy
- prompt construction
- runtime pipeline behavior

Documentation-only changes do not require product regression unless they change evaluation criteria.

## 3. Required Inputs

Each regression run needs:

- Golden Dataset version
- selected case ids
- previous baseline outputs
- new pipeline outputs
- generated CV artifacts
- review snapshots
- repair outputs if repair ran
- export output if available
- evaluation scores

## 4. Required Pipeline Run

For each selected case, run:

```text
JD
→ Evidence Selection
→ Writer
→ Reviewer
→ Repair
→ Export
→ Final CV
→ Product Evaluation
→ Regression Comparison
```

Use fresh generated outputs. Do not reuse cached CVs as new results.

## 5. Required Regression Questions

Every run must answer:

| Question | Required answer |
|---|---|
| Did ATS score improve? | YES / NO / UNCHANGED |
| Did HR score improve? | YES / NO / UNCHANGED |
| Did evidence coverage improve? | YES / NO / UNCHANGED |
| Did unsupported claims increase? | YES / NO |
| Did interview probability increase? | YES / NO / UNCHANGED |
| Did any quality metric regress? | YES / NO |

## 6. Regression Comparison Metrics

Compare new output against the current accepted baseline.

| Metric | Improvement | Regression |
|---|---|---|
| Product Quality Score | increase `>= 0.1` | decrease `>= 0.2` |
| ATS Compatibility | increase `>= 0.1` | decrease `>= 0.2` |
| HR Readability | increase `>= 0.1` | decrease `>= 0.3` |
| Hiring Manager Readability | increase `>= 0.1` | decrease `>= 0.3` |
| Evidence Coverage | increase `>= 0.1` | decrease `>= 0.3` |
| Keyword Coverage | increase `>= 0.1` | decrease `>= 0.3` or critical supported keyword loss |
| Positioning Consistency | increase `>= 0.1` | decrease `>= 0.3` |
| Truthfulness | no unsupported claims | any new unsupported claim or score below `4.5` |
| Unsupported Claims | count decreases | count increases or severity increases |
| Capability Gap Transparency | clearer gap handling | hidden or minimized critical gap |
| Interview Probability | increase `>= 0.1` | decrease `>= 0.2` |

## 7. Blocking Regression Rules

A change fails regression if any of the following occur:

- unsupported claim count increases
- unsupported claim severity increases
- any fabricated claim appears
- truthfulness score falls below `4.5`
- unsupported claims score falls below `4.5`
- final CV omits expected critical evidence
- ATS compatibility drops below `4.0`
- HR readability drops below `4.0`
- interview probability drops by `>= 0.2`
- Product Quality Score drops by `>= 0.2`
- Weak Fit case fabricates missing direct experience

## 8. Non-Blocking Observations

Use `PASS WITH OBSERVATIONS` when:

- Product Quality Score improves or remains stable
- critical thresholds pass
- no unsupported claims increase
- minor dimension regression is below threshold
- remaining weakness reflects true candidate evidence gaps

## 9. Case Selection Strategy

Minimum regression set:

| Change type | Required cases |
|---|---|
| Writer change | Good Fit, Risky Fit, Azure Weak Fit |
| Reviewer change | Good Fit, Risky Fit, Azure Weak Fit |
| Repair change | Risky Fit, Azure Weak Fit, capability-gap guard case |
| Export change | all active golden cases |
| Evidence selection change | all active golden cases |
| Positioning/truthfulness change | Risky Fit, Azure Weak Fit, any known weak-fit case |
| Formatting/layout change | all active golden cases plus ATS parse check |

## 10. Evaluation Report Format

Each regression run must produce a report with:

```text
Regression Run
- run id:
- date:
- pipeline version:
- dataset version:
- cases evaluated:
- baseline artifact:
- new artifact:

Summary
- overall decision:
- Product Quality Score delta:
- Interview Probability delta:
- unsupported claims delta:
- blocking regressions:

Per Case
- case id:
- previous scores:
- new scores:
- score deltas:
- unsupported claims:
- missing critical evidence:
- capability gaps:
- final decision:

Required Questions
- Did ATS score improve?
- Did HR score improve?
- Did evidence coverage improve?
- Did unsupported claims increase?
- Did interview probability increase?
- Did any quality metric regress?

Recommendation
- accept change
- reject change
- revise change
```

## 11. Decision Rules

| Decision | Rule |
|---|---|
| `ACCEPT CHANGE` | No blocking regression; Product Quality Score improves or remains stable; critical dimensions pass. |
| `ACCEPT WITH OBSERVATIONS` | No blocking regression; small non-critical weakness remains. |
| `REJECT CHANGE` | Any blocking regression or hard fail. |
| `REVISE CHANGE` | Product impact is unclear or evidence is insufficient. |

## 12. Baseline Promotion

A new output may become the accepted baseline only when:

- it passes all blocking rules
- Product Quality Score improves or remains stable
- Interview Probability improves or remains stable
- unsupported claims do not increase
- all critical expected evidence remains covered
- reviewer and repair artifacts do not show unresolved dangerous claims

Baseline promotion must record:

- previous baseline id
- new baseline id
- reason for promotion
- cases affected
- score deltas
- known tradeoffs

## 13. Handling Weak-Fit Cases

Weak Fit does not mean failure.

A Weak Fit CV can pass if:

- it is truthful
- it avoids unsupported claims
- it uses transferable strengths well
- capability gaps are transparent
- the final CV improves interview probability compared with a generic CV

A Weak Fit CV fails if:

- it fabricates direct fit
- it hides critical gaps
- it implies ownership not present in evidence
- it becomes too weak to be useful despite available transferable evidence

## 14. Automation Roadmap

Initial implementation can be manual or semi-automated.

Recommended automation phases:

1. Generate fresh artifacts for each golden case.
2. Extract final CV text and structured evaluation inputs.
3. Score each dimension using deterministic checks where possible.
4. Use reviewer-assisted scoring for subjective dimensions.
5. Compare against baseline score JSON.
6. Produce a regression report.
7. Block baseline promotion on hard failures.

Deterministic checks should cover:

- unsupported banned ownership terms
- missing critical keywords
- expected evidence presence
- formatting/ATS parse safety
- quantified metric preservation
- capability gap visibility

Human or LLM-assisted checks may cover:

- HR readability
- hiring manager readability
- executive summary quality
- business impact clarity
- interview probability

## 15. Final Product Rule

A pipeline change is not successful because it completed implementation.

It is successful only when product regression evaluation shows that the final CV is better, equally truthful, and more likely to earn an interview.
