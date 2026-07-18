# Screen Layout V2

Status: Design only.

## Desktop layout

```text
┌───────────────────────────────────────────────────────────────┐
│ 1. Overall Status                                               │
│    Needs Repair · CV hash abc123 · 2 export blockers            │
├───────────────────────────────────────────────────────────────┤
│ 2. Review Summary                                                │
│    PASS (3)       WARNING (1)       BLOCKING (2)                │
│    Reviewer cards: reviewer · result · reason                   │
├───────────────────────────────────────────────────────────────┤
│ 3. AI Repair Plan                                                │
│    Target zone · expected edit · reason · Safe/Approval · impact│
│                                      [Apply Safe Repair]         │
├───────────────────────────────────────────────────────────────┤
│ 4. Repair Result — hidden until a repair applies                 │
│    Changed · unchanged · new hash · remaining blockers           │
├───────────────────────────────────────────────────────────────┤
│ 5. Export Decision                                               │
│    Exact export blockers OR warnings + [Export CV]               │
└───────────────────────────────────────────────────────────────┘
```

## Visibility rules

| Area | When visible |
|---|---|
| Overall Status | Always when a CV exists |
| Review Summary | After review inputs are valid |
| AI Repair Plan | Only if unresolved blocking checks have an actionable repair path |
| Repair Result | Only after an applied repair receipt exists for the active CV lineage |
| Export Decision | Always after review; it renders blocked or allowed state |

## Mobile behavior

Keep the same order in one column. PASS/WARNING/BLOCKING become collapsible groups, but the BLOCKING group stays expanded. The primary CTA is sticky only after the user has seen its associated area; it must never float independently of its reason.

## Content limits

- Overall Status: one headline and one sentence.
- Review card: reviewer, result, one concise reason; details in disclosure.
- Repair-plan item: one target zone and one expected outcome; evidence/diff in disclosure.
- Repair Result: no more than changed/unchanged/hash/blockers summary before details.
- Export Decision: exact blockers only; warnings remain visible but are not restated as blockers.

