# Project Rules

Status: Governance v1 rules, source-grounded.

## Source of Truth Priority

For production changes, begin with `docs/INDEX.md`. Its authority order controls this document whenever the two differ.

Use this priority order for all future work:

1. `docs/architecture/CURRENT_ARCHITECTURE.md`
2. Relevant approved ADRs
3. Relevant active runtime contracts
4. This active product policy
5. Acceptance evidence
6. Current production implementation

If sources conflict, follow `docs/CONFLICT_RESOLUTION_LOG.md`; unresolved cases go to `docs/draft/requires-review/`. Do not silently resolve them.

## Non-Negotiable Product Rules

| Rule | Source | Verification Target |
|---|---|---|
| Evidence first: major visible CV claims must be supported | `SPEC.md` Rule 1 | Evidence IDs, `TailoredCv` bullets, reviewer checks |
| One JD, one decision context | `SPEC.md` Rule 2 | `CvVersion.jdId`, `GenerationContext.jdContentHash` |
| AI is optional and explicit | `SPEC.md` Rule 3, `ARCHITECTURE.md` | No hidden automation; explicit button/API action only |
| First pass should aim to pass | `SPEC.md` Rule 4, `buildScreeningCvPrompt` | Writer contract and reviewer smoke tests |
| Repairs must be narrow | `SPEC.md` Rule 5 | Repair tests preserve passed areas |
| Red must be actionable | `SPEC.md` Rule 6 | Failed checks must include role/action/content area |
| Canonical persistence | `ARCHITECTURE.md` | `data/app_data.json` revisioned writes |
| Split JSON files are mirrors | `ARCHITECTURE.md`, `storageService.cjs` | Do not treat mirrors as independent truth |

## Allowed Work Pattern

- Work from one active task file.
- Execute one task at a time.
- Do not start the next task until the current task passes acceptance criteria.
- Do not expand task scope when a new issue is found; create a new task.
- Keep production code, prompts, runtime data, and tests untouched during audit/governance tasks unless the task explicitly allows them.
- Use current repo patterns and existing test commands.

## Prohibited Operations

- Hidden AI/token-spending actions.
- Broad refactors without a task.
- Prompt rewrites before tracing data/contract/root cause.
- Treating historical CV PDFs as canonical ideal CV without explicit evidence.
- Modifying generated runtime data during audits.
- Editing legacy surfaces when the active task targets React, unless migration evidence requires it.
- Combining unrelated fixes in one task.

## Verification Baseline

Use the smallest verification that matches the task:

- Markdown-only governance edits: `find docs/governance -type f`, dependency consistency check, markdown link/path sanity, and changed-file scope check.
- Contract or domain edits: relevant smoke scripts plus `npm run build`.
- Persistence/API edits: `npm run smoke:storage`, `npm run smoke:server`, and relevant HTTP/config smoke tests.
- Full workflow risk: `npm run test:system`.
