# CTA Decision Tree

Status: Design only.

## Primary CTA algorithm

```text
No current CV?                         → Generate CV
Automation active?                     → Stop
Connection state unknown?              → Check status
Semantic repair proposal pending?      → Review AI Repair
Safe repair proposal pending?          → Apply Safe Repair
Repair receipt awaiting validation?     → Validate Repair
Blocking export contract check remains? → Resolve blocker
Export checks pass?                    → Export CV
Export recorded for current hash?       → View Export
Otherwise                              → Open Final Review
```

The first matching condition wins. Exactly one button uses the primary treatment.

## Secondary action limits

Secondary actions may be informational only: `View details`, `View evidence`, `Open diagnostics`, or `Edit manually`. They cannot be a competing workflow progression action. Risk override is isolated behind a confirmation flow and cannot appear beside a normal primary CTA.

## CTA completion rules

- After a safe repair succeeds, remove `Apply Safe Repair`; show Repair Result and transition to validation/export state.
- After approval is given, remove `Review AI Repair`; show running state.
- After export succeeds, remove `Export CV`; show `View Export`.
- A true dependency/content hash change invalidates a completion CTA only with an explicit reason.

