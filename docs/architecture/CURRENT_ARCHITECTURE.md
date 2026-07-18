Status: ACTIVE
Document Type: CURRENT_ARCHITECTURE
Authority: PRIMARY
Can Authorize Production Implementation: YES
Canonical ID: ARCH-CURRENT

# Current Production Architecture

## Governed Scope

This is the sole canonical architecture for the active product in `CV_Manager_React/`. It governs production changes to the JD-first, evidence-grounded CV workflow. It does not redesign the runtime or authorize future architecture.

## Canonical Runtime Flow

```text
Career evidence + selected Job Description
-> Screening Analysis and terminology/gap controls
-> evidence selection and effective CV Brief
-> explicit Writer generation or manual fallback
-> current CV version
-> local Gate, Reviewer, ATS/export verification
-> bounded repair or export decision
```

## Ownership and Boundaries

| Owner | Produces | Must not own |
|---|---|---|
| Screening Analysis | JD requirements, fit/positioning inputs, terminology and gap signals | CV wording, repair execution, export decision |
| Evidence selection / CV Brief | selected evidence, readiness, Writer strategy/context | unsupported claim creation, final review or export decision |
| Writer | evidence-grounded CV composition for the selected JD | Fit-tier invention, review classification, repair policy, export approval |
| Gate and Reviewer | local validation, blocker classification, review snapshot | hidden AI execution or unrestricted content mutation |
| Repair Orchestrator | bounded repair route and result handling | changing evidence truth, owning review policy, silent AI execution |
| Export Decision | readiness decision for the reviewed CV version | rewriting CV content or inventing evidence |
| Persistence | revisioned canonical snapshot `data/app_data.json`; split JSON mirrors | domain policy or UI workflow ownership |

## Inputs, Outputs, and Invariants

- A meaningful CV action is scoped to one selected JD and current CV version.
- Major visible claims must remain evidence-grounded; unsupported gaps remain gaps.
- AI use is explicit and user-controlled. No hidden token-spending action is authorized.
- Review, repair, and export operate on current content identity; stale results cannot authorize a save or export.
- Repairs are bounded to allowed failed zones and preserve protected zones.
- `data/app_data.json` is canonical persistence; split JSON files are mirrors.

## Approved Extensions and Runtime Contracts

- Accepted decisions recorded in `docs/governance/DECISIONS.md` and the independently approved `ADR-PROD-006` may amend this architecture only within their documented scope.
- The current `docs/draft/requires-review/contracts/` set remains draft/reference material. No contract in that set independently authorizes implementation until an explicit approval record exists.

## Explicit Non-Authority

- `docs/draft/`, `docs/archive/`, proposals, plans, discovery reports, comparison reports, audits, task files, and acceptance evidence cannot override this document or independently authorize production implementation.
- Product workflow descriptions explain user flow; they do not reassign runtime ownership.

## Evidence Basis

- `CV_Manager_React/docs/SPEC.md`
- `CV_Manager_React/docs/FLOW.md`
- `CV_Manager_React/docs/ARCHITECTURE.md`
- `docs/governance/DECISIONS.md`
- current completion and acceptance evidence under `docs/governance/phase4/` and `docs/acceptance/`

## Superseded Architecture Documents

The prior baseline, architecture maps, comparison/discovery reports, execution-flow variants, and future blueprints are non-authoritative. Their retained material is in `docs/draft/` and is catalogued in `docs/DOCUMENT_REGISTRY.yaml`.
