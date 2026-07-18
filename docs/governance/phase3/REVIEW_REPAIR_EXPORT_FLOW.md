# Review / Repair / Export Flow

Status: Design only.

## Linear flow

```text
Current CV hash
  → normalize reviews
  → Overall Status + Review Summary
  → [no blockers] Export Decision
  → [safe blockers] AI Repair Plan → repair → Repair Result → validate once → Export Decision
  → [semantic blockers] AI Repair Plan → human approval → repair → Repair Result → validate once → Export Decision
```

## Review outcomes

| Outcome | Meaning | Next flow |
|---|---|---|
| PASS | The reviewer found no issue in its contract area | Remains visible; no action is created |
| WARNING | Quality concern that does not block export under its contract | Remains visible in Review Summary and Export Decision context; no repair required |
| BLOCKING | Contract prevents export | Creates one repair-plan item or an explicit non-repairable blocker |

## Repair flow

1. Create one repair proposal per current CV hash from blocking checks only.
2. Classify every proposed edit as Safe or Approval Required.
3. Render one plan CTA: `Apply Safe Repair` when all edits are safe; otherwise `Review AI Repair`.
4. After execution, persist a repair receipt: before hash, after hash, changed zones, unchanged zones, validation result.
5. Validate once against the new hash. If blockers remain, show Repair Result and the next valid state; do not re-render the old plan or auto-run again.

## Export flow

Export Decision has only two modes:

- Blocked: list only checks that contracts define as blocking, grouped by reviewer. Primary CTA remains the repair/approval CTA selected upstream.
- Allowed: retain visible warnings, show `Export CV` as the one primary CTA.

`Export anyway` is an explicit risk override outside the normal flow. It must never appear alongside `Export CV`, repair, or manual-edit primary actions.

## Recovery behavior

If a connection is lost during an automation run, the workflow state is `Needs attention`, with `Check status` as its only primary CTA. It must check server state before offering a token-spending retry. No partial repair result is applied.

