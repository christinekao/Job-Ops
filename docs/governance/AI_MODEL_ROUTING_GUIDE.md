# AI Model Routing Guide

Status: Product Foundation routing guidance. This does not change runtime `CODEX_MODEL` configuration or automation prompts.

## Routing Principle

Use the lowest-cost sufficient model and reasoning level. Model choice must be stated before implementation. Do not use `Default`. Escalate when the task crosses architecture boundaries, needs broad repository synthesis, has material safety/quality risk, or requires a new ADR.

| Surface | Model | Reasoning | Best for | Escalate when |
|---|---|---|---|---|
| ChatGPT | GPT-5 | 快思 | Simple planning, document writing, concise review | Multiple product/architecture tradeoffs appear |
| ChatGPT | GPT-5 | 中 | Architecture discussion, product decisions, policy tradeoffs | Repository-wide synthesis or multi-phase planning is needed |
| ChatGPT | GPT-5.6 Terra | 中 | Large planning, roadmap, research synthesis, product/platform evolution | Evidence is incomplete or decisions need human approval |
| Codex | GPT-5 | 快思 | Small bug fixes, narrow deterministic edits, focused tests | Scope spans multiple modules/contracts |
| Codex | GPT-5 | 中 | Architecture cleanup, component extraction, workflow implementation | A broad refactor, migration, or cross-wave plan is required |
| Codex | GPT-5.6 Terra | 中 | Repository-level planning, large refactor planning, product roadmap, platform evolution | ADR, privacy, persistence, or safety boundary is unresolved |

## Task-to-Model Examples

| Work | Suggested route | Notes |
|---|---|---|
| Markdown-only completion report | ChatGPT GPT-5 快思 or Codex GPT-5 快思 | Use repository evidence; no production changes |
| Atomic UI extraction | Codex GPT-5 中 | Preserve domain behavior and run focused regressions |
| Repair/execution workflow boundary | Codex GPT-5.6 Terra 中 | Needs lifecycle, safety, and regression reasoning |
| Product phase/epic roadmap | Codex or ChatGPT GPT-5.6 Terra 中 | Planning only unless an explicit task authorizes changes |
| Prompt quality change | Codex GPT-5.6 Terra 中 | Requires ownership, contracts, evaluation, and token-cost review |
| Persistence/platform migration | Codex GPT-5.6 Terra 中 | Requires ADR, migration/rollback, and system validation |
| User-facing product decision | ChatGPT GPT-5 中 | Keep alternatives and tradeoffs clear; request human decision if material |

## Non-Negotiable Controls

- Runtime automation is explicit; routing guidance never authorizes an AI call by itself.
- `promptBuilders.ts` remains runtime prompt owner; template data remains UX/reference content unless an approved task changes that architecture.
- A model must not be selected solely for speed when a task touches evidence integrity, claim safety, content identity, persistence, or export readiness.
- Any uncertain authority, missing acceptance criterion, or cross-boundary change stops for governance clarification.
