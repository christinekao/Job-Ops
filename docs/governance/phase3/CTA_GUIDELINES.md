# CTA Guidelines

Status: Design only.

## One primary CTA

Every workflow screen exposes exactly one primary CTA. Secondary actions are visually subordinate and cannot compete with the next step.

| State | Primary CTA | Allowed secondary actions |
|---|---|---|
| Waiting | Generate CV | Edit JD, view evidence |
| Running / Auto Repairing | Stop | View progress |
| Needs Approval | Review Changes | Reject, view evidence |
| Ready | Open Final Review | Edit CV |
| Export Ready | Export CV | View final report |
| Completed | View Export | Start new JD |
| Blocked | Resolve blocker | View diagnostics |

Do not expose `Run Again`, `Review Again`, `Apply Again`, or `Generate Again` as primary CTAs. Use explanatory status text and only offer a retry when a failed or changed dependency justifies it.

## Copy rules

- Name the outcome, not the internal operation: `Generate CV`, not `Run Screening Analysis`.
- Explain why a stop/review is required in one sentence.
- Show token cost before an optional AI override.
- Do not display a successful step as needing rerun because of timestamps alone.
- Keep manual Copy/Paste/Parse/Apply under an `Advanced fallback` disclosure.

