# Autonomous CV Workflow (Human-in-the-loop)

Status: Design only. No implementation is authorized by this document.

## Current UX diagnosis

The current workflow is sound at the contract level but exposes internal recovery mechanics to the user. Evidence in `CV_Manager_React/src/components/tabs/ScreeningLab.tsx` and `screeningRunStatus.tsx` includes separate actions for running analysis, applying analysis, applying recommendations/building the Brief, generating or patching the CV, local fixes, manual edit, review, and export. The advanced manual prompt fallback also exposes Copy → Paste → Parse → Apply. `Needs rerun` is derived from input identity, while disconnected queued/running records produce `Status unknown`; these are useful internal states but are not a user journey.

The repeated loop exists because analysis, Brief construction, CV writing, local repair, and review are separate boundaries. AI output can be applied before downstream checks, and failures are then presented as repair choices. This is correct for safety, but it makes the user operate the orchestration layer.

## Target journey

`Paste JD → Generate CV → AI Review → AI Repair → AI Validate → Final Review → Export`

The system owns orchestration and safe repair. The user sees one primary action at each point and approves only semantic changes.

## Autonomous run policy

1. A run is explicit: the user starts the workflow with `Generate CV`.
2. The system may chain analysis, Brief resolution, writer, local safe repair, and validation without additional clicks.
3. Each chained stage is idempotent against content hashes and does not rerun after a completed unchanged stage.
4. A failed stage records the exact failed contract area and stops at `Needs Approval` or `Blocked`; it never loops indefinitely.
5. The user can stop an active run. Cancellation applies no partial CV result.
6. All AI-produced changes are previewable before approval when they alter meaning.

## Safe convergence

The workflow converges when the current JD, effective Brief, selected evidence identity, and CV content identity are unchanged and all required checks pass. A later view change does not reopen a completed stage. A true content/dependency change creates one new run and explains why.

## Investigation matrix

| Current request/action | Why it exists | Safe automatic replacement | Human approval? |
|---|---|---|---|
| Run JD Analysis / Refresh JD Analysis | Creates or refreshes analysis after JD changes | Automatically run once from the workflow start; hash-gate later runs | No, unless positioning is materially changed |
| Apply Screening Analysis | Manual JSON paste-back boundary | Apply validated structured result internally | Only for changed positioning or high-risk gates |
| Apply recommendations + build brief | Makes selection explicit before writer | AI creates Brief and selected IDs atomically | Yes if evidence selection changes materially |
| Run one-pass CV generation | Starts writer | Replace with `Generate CV` workflow CTA | No |
| Patch failed checks only | Exposes repair mode | Auto-repair safe issue classes once | Yes for semantic claims |
| Fix remaining red items locally / Apply title fix | No-token UI repair | Auto-apply mechanical fixes; present semantic diff | Yes for title/positioning meaning |
| Review Again / Needs rerun | Exposes hash/state machinery | Auto-validate current content once after repair | No, unless content changed |
| Generate Again | Recovery from failed/changed inputs | Retry only when dependency hash changed or prior run failed; otherwise keep completed state | No |
| Apply / Save in Parse Preview | Manual fallback for GPT JSON | Keep as advanced fallback only; normal path validates and applies internally | Yes for fallback output if it changes meaning |
| Export anyway | Explicitly bypasses blockers | Keep as a risk override, never primary CTA | Yes |

## Product boundary

This design does not change persistence architecture, prompt ownership, evidence rules, or the no-canonical-CV decision. It proposes an orchestration layer over existing contracts and keeps a manual fallback for degraded operation.

