# UX Information Architecture: Review → Repair → Export

Status: Design only. No implementation is authorized.

## Objective

The Review → Repair → Export surface answers five questions in a fixed order:

1. Where am I now?
2. What passed, warned, or blocks?
3. What will AI change?
4. What changed after repair?
5. Can I export now?

Each answer has exactly one owning area. No area contains another area's instructions or CTA.

## Current architecture problem

The current reviewer surface combines `ReviewerBlockerTriage`, `CheckStatusSummary`, `RepairActionPanel`, reviewer/export check lists, run-status banner, and several next-step buttons. The same failed check can therefore appear as a review result, repair suggestion, local-fix description, and export blocker. A local fix result may appear before or beside the plan that triggered it. This makes a user infer whether a repair has executed and whether export is still blocked.

## Target areas

| Area | Sole question | Contains | Must not contain |
|---|---|---|---|
| 1. Overall Status | What is the workflow state? | One status, current CV identity, short state reason | Repair instructions, review details, CTA alternatives |
| 2. Review Summary | What did each reviewer conclude? | PASS / WARNING / BLOCKING cards; reviewer, result, reason | Repair plan, repair CTA, export action |
| 3. AI Repair Plan | What will change if repaired? | Target zone, expected edit, reason, safety, impact; one CTA | Historical repair result, full review summary |
| 4. Repair Result | What actually changed? | Changed/unchanged areas, current content hash, remaining blockers | Proposed plan, duplicate CTA |
| 5. Export Decision | Can this CV be exported? | Contract blockers or `Export CV` | Repair plans or diagnostic duplicates |

## Information ordering

Overall Status is always first. Review Summary follows so the user can see evidence before any proposed action. AI Repair Plan appears only when action remains. Repair Result appears only after a repair was applied to the current content hash. Export Decision is last and remains the sole export authority.

## Status language

- `Ready for Export`: required checks pass for the current CV hash.
- `Needs Repair`: one or more blocking checks remain; no repair has yet been applied to this hash.
- `AI Repair Running`: a bounded repair is active.
- `Needs Approval`: AI has a semantic proposal requiring human confirmation.
- `Repair Complete — Review Required`: repair applied but validation still finds blockers.
- `Exported`: an export record exists for this unchanged content hash.

`Needs rerun`, `applied`, snapshot timestamps, queue state, and polling connection are diagnostics, not headline workflow labels.

