# Unresolved Questions

Status: Governance v1 blockers and open decisions.

## Critical Before Final `AGENTS.md`

No open critical blocker remains for Governance v1.

## Contract Decisions

| Question | Current Evidence | Impact | Confidence |
|---|---|---|---|
| Should `SCREENING_CV_PROMPT_VERSION` be the only supported prompt version after v7? | `selection.ts` still supports earlier prompt versions | Affects stale CV invalidation and migration | Possible |
| Should local repair move into `src/domain/localReviewerFix.ts` exactly as architecture suggests? | `ARCHITECTURE.md` names this as next extraction | Affects allowed files for repair task | Highly likely |

## CV Quality Decisions

| Question | Why Needed | Confidence |
|---|---|---|
| Are all prior employers mandatory in every final CV? | Writer length and career narrative contract | Insufficient evidence |
| What is the acceptable minimum technical depth per target role family? | Reviewer quality gate | Insufficient evidence |
| What is the acceptable compression rule for less relevant experience? | Prevent over-tailoring and omission | Insufficient evidence |

## Closed Decisions

| Decision | Resolution | Evidence |
|---|---|---|
| Canonical CV reference | Closed. No canonical CV exists by design. Quality is evaluated per JD against `QUALITY_SPEC.md`, `PROJECT_RULES.md`, contracts, and evidence. | `DECISIONS.md` ADR-001; TASK-002 artifact matrix in `CURRENT_STATE.md` |
| Actual CV trace target | Closed for TASK-003 by selecting the most recently updated CV with linked Job, generation context, tailored output, and review snapshot: `cv-mr4q83lz-cidl0`. | `CV_TRACEABILITY.md` |
| Review Snapshot identity | Closed. Use dual identity: `snapshotId`, `updatedAt`, and `contentHash`; preserve legacy null hashes and generate lazily. | `DECISIONS.md` ADR-002 |
| TASK-009 App boundary | Closed. `CV_Manager_React/src/App.tsx::saveCvVersion()` is explicitly allowed for ADR-002 implementation. | `DECISIONS.md` ADR-002 scope amendment |
| Prompt ownership | Closed. `src/promptBuilders.ts` owns active runtime prompt construction; `data/prompt_templates.json` is editable UX metadata and reusable saved template content. | `DECISIONS.md` ADR-003 |
| Root agent entry | Closed. Root `AGENTS.md` is the single concise entry; details remain under `docs/governance/`. | `DECISIONS.md` ADR-004 |
| Legacy guidance ownership | Closed. Legacy CV Manager files are Legacy / Archive / Migration artifacts, not active governance. | `DECISIONS.md` ADR-005 |
