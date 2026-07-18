# Phase 3 Design Completion Report

## Scope

Produced a redesign only for the Autonomous CV Workflow (Human-in-the-loop). No production code, prompts, runtime data, or persistence architecture was modified.

## Deliverables

- `AUTONOMOUS_WORKFLOW.md`
- `STATE_MACHINE_V2.md`
- `HUMAN_AI_BOUNDARY.md`
- `CTA_GUIDELINES.md`
- `AUTO_REPAIR_POLICY.md`
- `UI_STATE_SIMPLIFICATION.md`

## Current UX problems

The existing UI exposes orchestration mechanics (`Run`, `Apply`, local fixes, rerun labels, manual JSON fallback) across `ScreeningLab.tsx`, `screeningRunStatus.tsx`, and CV Studio. Hash-based invalidation and disconnected-job recovery are technically necessary but create repeated user decisions. Safe repair exists, but the user still chooses the repair path.

## New workflow and state machine

The proposed flow is `Paste JD → Generate CV → AI Review → AI Repair → AI Validate → Final Review → Export`. User-visible states are `Waiting`, `Running`, `Needs Approval`, `Auto Repairing`, `Ready`, `Export Ready`, `Completed`, and `Blocked`. Internal statuses remain implementation details.

## Estimated impact

| Metric | Current | Target | Basis |
|---|---:|---:|---|
| User clicks | 20–40 | 3–5 | Remove intermediate orchestration CTAs and manual repair loop |
| AI repair loops | Multiple | 0 unbounded | One bounded pass per repair class/content identity |
| Human repair decisions | Many | 0 for safe classes; 1 per semantic proposal | Human only owns meaning/evidence/positioning |
| Token usage | High repeated prompts | 30–60% lower | Hash reuse, local safe repair, no default reruns; estimate pending benchmark |
| State confusion | High | Low | One primary CTA and internal-state adapter |

Token reduction is a design estimate, not a measured claim. It must be benchmarked against representative JDs before implementation acceptance.

## Top 10 implementation tasks

| Rank | Task | Difficulty | Risk | UX improvement | Token reduction |
|---:|---|---|---|---|---|
| 1 | Add workflow orchestrator and bounded stage transitions | High | High | Very high | High |
| 2 | Add content/dependency hash stage reuse | Medium | High | High | High |
| 3 | Build safe auto-repair service with rollback/budget | High | High | Very high | Medium |
| 4 | Add semantic diff and approval payload | High | Medium | Very high | Medium |
| 5 | Replace visible CTAs with one-CTA state adapter | Medium | Medium | Very high | Low |
| 6 | Auto-validate after generation/repair and preserve completed stages | Medium | High | High | Medium |
| 7 | Add cancellation and partial-result protection across all stages | Medium | High | High | Prevents waste |
| 8 | Move manual JSON path behind advanced fallback and improve recovery | Medium | Medium | Medium | Low |
| 9 | Add workflow telemetry for clicks, reruns, tokens, and convergence | Medium | Medium | Medium | Enables measurement |
| 10 | Add end-to-end regression fixtures for safe/approval/prohibited repairs | Medium | High | High | Indirect |

## Acceptance boundary

This report does not authorize Phase 3 implementation or change any existing governance status. Before implementation, create atomic Tasks with Allowed/Forbidden Files, contracts, migration/rollback rules, and focused tests for each ranked item.

