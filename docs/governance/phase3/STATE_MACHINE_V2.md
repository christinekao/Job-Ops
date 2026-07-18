# State Machine V2

Status: Design only.

## User-visible states

```text
Waiting → Running → Auto Repairing → Ready → Export Ready → Completed
                  ↘ Needs Approval ↗
                  ↘ Blocked
```

`Waiting`: prerequisites or a new JD are present; primary CTA is `Generate CV`.

`Running`: analysis, Brief resolution, writer, or validation is executing. Primary CTA is `Stop`.

`Auto Repairing`: safe, bounded repairs are executing. Primary CTA is `Stop`.

`Needs Approval`: a proposed change affects positioning, claims, impact, meaning, or evidence selection. Primary CTA is `Review Changes`.

`Ready`: current CV passes required content/reviewer checks. Primary CTA is `Open Final Review`.

`Export Ready`: final review and export checks pass. Primary CTA is `Export CV`.

`Completed`: export is recorded for the unchanged content identity. Primary CTA is `View Export` or `Start a new JD`.

`Blocked`: a prerequisite, invalid output, missing evidence, or system failure prevents safe continuation. Primary CTA is the one action that resolves that blocker.

## Internal state mapping

Existing `queued`, `running`, `completed`, `failed`, `needs rerun`, `status unknown`, `applied`, and snapshot identities remain internal facts. The UI adapter maps them to the states above. `Needs rerun` is emitted only after a true dependency/content hash change; it is not a user-facing loop state.

## Transition rules

| From | Event | To | Guard |
|---|---|---|---|
| Waiting | Start workflow | Running | JD and evidence prerequisites valid |
| Running | Writer output valid | Auto Repairing | Required review checks have repairable failures |
| Running | Semantic proposal found | Needs Approval | Meaning/evidence/positioning changes detected |
| Running | All checks pass | Ready | Same content identity validated |
| Auto Repairing | Safe repairs pass | Ready | Repair budget and invariant checks pass |
| Auto Repairing | Semantic repair needed | Needs Approval | No automatic invention of evidence |
| Needs Approval | Approve | Running | Revalidate changed content once |
| Needs Approval | Reject | Ready or Blocked | Preserve prior valid CV; explain unresolved issue |
| Ready | Open final review | Export Ready | Reviewer and export checks pass |
| Ready | Blocker appears | Needs Approval or Blocked | True content/dependency change only |
| Export Ready | Export | Completed | Export succeeds |
| Any active | Stop | Waiting or Blocked | No partial result applied |

## Loop prevention

Each workflow run has a stable input hash, repair pass count, and content hash. A completed stage with identical inputs is reused. A repair class may execute once per content identity; a second failure moves to `Needs Approval` or `Blocked`, never to an automatic rerun.

