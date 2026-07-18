# UI State Simplification

Status: Design only.

## Simplification model

The UI should present one workflow card with a progress step, current state, one primary CTA, and a concise reason. Internal run records remain available in an expandable diagnostics view.

| Current visible concept | Simplified presentation |
|---|---|
| Multiple step panels and rerun labels | One linear workflow timeline |
| `queued/running` plus polling detail | `Running` with progress and `Stop` |
| `Status unknown` | `Needs attention: connection lost` with `Check status` |
| `Needs rerun` | `Inputs changed: Review changes` only when hash differs |
| Local Fix / Apply title fix / Apply header fix | `Review Changes` or automatic safe repair |
| Reviewer/export triage with competing actions | One `Review Changes`, then one `Export CV` |
| Manual GPT JSON panels | Advanced fallback, hidden by default |
| Separate generated/applied/snapshot labels | One `Ready` state plus diagnostics |

## Persistence and recovery

The adapter reads canonical `app_data.json`, run status, and dual snapshot identity. It must preserve completed state across reloads, enrich legacy snapshot hashes lazily, and avoid treating a missing browser connection as permission to rerun. Recovery offers `Check status` before any token-spending action.

## Accessibility and clarity

The primary CTA must be keyboard reachable, have a stable label, and expose disabled/blocked reason text. Progress, approval, and failure states use both text and semantic status—not color alone.

