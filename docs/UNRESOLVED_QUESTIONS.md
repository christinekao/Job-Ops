# Unresolved Questions

| ID | Question / missing evidence | Impacted judgment | Confidence |
|---|---|---|---|
| UQ-001 | Which document is authoritative when 7-step `FLOW.md` conflicts with the 6-step statement in `KNOWLEDGE.md`? | Stage count, UI contract, test naming, TASK-002 scope | Confirmed |
| UQ-002 | Which exact file/version is the “actual produced CV” for audit: a `CvVersion.id` in `data/app_data.json`, a root `CV/*.pdf`, or another export? | Output-quality baseline and reproducibility | Insufficient evidence |
| UQ-003 | Which exact file is the approved “ideal CV example”? Archived HTML and root PDFs exist, but none is named as canonical. | Content/layout comparison and acceptance criteria | Insufficient evidence |
| UQ-004 | Are `modes/*.md` active contracts, historical operator notes, or parallel workflows? | Agent/prompt ownership and stage mapping | Insufficient evidence |
| UQ-005 | Does “Agent” mean only the Codex CLI executor, or should prompt personas be registered as logical agents? No Agent registry/config was found. | Agent inventory and responsibility matrix | Insufficient evidence |
| UQ-006 | Are legacy builders (`buildJDParsePrompt`, `buildFitReviewPrompt`, `buildTailoredCVPrompt`) still supported production paths, given server routes only accept screening analysis/CV? | Dead-path classification and cleanup planning | Highly likely |
| UQ-007 | Who approves Stage Contracts and resolves requirement conflicts? | TASK-002 entry/exit gate | Insufficient evidence |
| UQ-008 | Is PDF rendering/text-layer output part of the required production acceptance gate, and what browser/export settings are canonical? | Required test design | Possible |
| UQ-009 | Should canonical workflow include Application Log after Export, as `modes/_shared.md` says, or stop at Export / Apply as `FLOW.md` says? | Terminal state and persistence contract | Confirmed |
| UQ-010 | Is `PROJECT_SPEC.md` normative alongside `docs/SPEC.md`, and how are conflicts prioritized? | Requirement traceability | Insufficient evidence |

No answer is inferred. TASK-002 stays blocked until the material questions have owners and explicit decisions.
