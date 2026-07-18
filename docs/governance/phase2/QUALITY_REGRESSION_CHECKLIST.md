# Quality Regression Checklist

Status: Required checklist for every post-wave CV quality review.

Use this checklist after scoring `QUALITY_SCORECARD.md`. Each row must be marked `Pass`, `Fail`, `Blocked`, or `Not applicable`.

## Required Checks

| Check | Evidence Required | Result | Confidence | Notes |
|---|---|---|---|---|
| Lost evidence | Previous and current must-show evidence coverage |  |  | Identify evidence IDs lost from visible CV |
| Lost business impact | Previous and current bullet impact review |  |  | Identify bullets that lost stakeholder/scope/outcome |
| Weaker technical depth | Previous and current technical detail review |  |  | Identify removed tools, workflows, validation details, or controls |
| New hallucinations | Current visible claims vs evidence |  |  | Identify unsupported new claims |
| Broken narrative | Header/summary/first bullets/skills consistency |  |  | Identify role-story drift |
| Duplicate bullets | Current bullet text and repeated stems |  |  | Identify repeated or near-duplicate bullets |
| Duplicate summary or notes | Summary and repair notes |  |  | Identify repeated summary positioning or repair note accumulation |
| Reviewer damage | Pre-review vs post-review changes if reviewer altered content |  |  | Reviewer should evaluate, not rewrite |
| Repair damage | Pre-repair vs post-repair CV diff |  |  | Identify green-area rewrites or off-JD evidence promotion |
| ATS regression | Previous and current keyword/section review |  |  | Identify missing supported must-have terms |
| HR regression | Contact/header/section readability |  |  | Identify missing contact, unclear title, missing dates |
| Manager relevance regression | First-page manager problem fit |  |  | Identify weaker opening evidence or vague summary |
| Internal terminology leakage | Visible text vs terminology/blocked terms |  |  | Identify untranslated internal terms |
| Export regression | Export readiness and rendered artifact checks when available |  |  | Identify missing contact, section order, page/text-layer issues |

## Regression Severity

| Severity | Rule |
|---|---|
| Critical | Unsupported claim, invalid traceability, repair damage to green content, missing required contact, export blocker |
| High | Lost must-show evidence, weaker first-page manager relevance, ATS must-have term loss |
| Medium | Reduced business impact, weaker technical detail, duplicate content |
| Low | Minor wording/readability issue that does not affect evidence or role fit |

## Required Root Cause Format

Every failed check must use:

```text
Observed Problem
-> Immediate Cause
-> Upstream Cause
-> Structural Root Cause
```

Root cause category must be one of:

- Data
- Context
- Evidence
- Prompt
- Review
- Repair
- Export
- Architecture
- Evaluation
- UX
- Implementation
- Model limitation

## Pass Condition

A wave passes quality regression review only when:

- No Critical regression is present.
- Total quality score is not lower than previous baseline by 5 or more points.
- Any Blocked metric has an explicit missing-input explanation.
- Recommended next wave targets the earliest confirmed remaining quality failure.
