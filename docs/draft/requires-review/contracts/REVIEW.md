Status: DRAFT
Authority: REFERENCE
Can Authorize Production Implementation: NO
Does Not Override: docs/architecture/CURRENT_ARCHITECTURE.md
Reason for Draft Status: Contract index identifies this as draft/reference material.
Required Decision Before Activation: Explicit contract approval.

# Contract: Review

Owner:

- `CV_Manager_React/src/domain/screeningReview.ts`
- Role mapping: `CV_Manager_React/src/domain/screeningReviewRoles.ts`

## Review Functions

| Function | Responsibility | Confidence |
|---|---|---|
| `screeningGate` | early local CV gate | Confirmed |
| `hiringManagerReview` | manager interview relevance | Confirmed |
| `reviewerPass` | local reviewer/ATS/evidence/wording checks | Confirmed |
| `exportVerification` | export readiness checks | Confirmed |
| `createReviewSnapshot` | bind review result to timestamp and CV content identity | Confirmed |
| `roleForCheck` | map failed check labels to reviewer role | Confirmed |

## Contract Rules

- Step 6 and Step 7 must evaluate the same CV snapshot.
- A failed Step 7 must not reset Step 6 to "Never run".
- Review evaluates; it should not directly rewrite CV content.
- Failed checks must map to owner/action labels.
- Review snapshot is valid only for matching CV content. `updatedAt` remains ordering/history/UI metadata.
- Legacy snapshots without `contentHash` remain valid and are enriched lazily on the next safe read/write path.

Evidence: `FLOW.md`, `ARCHITECTURE.md`, `screeningReview.ts`, `screeningWorkflow.ts`, `ScreeningLab.tsx`.

Confidence: Confirmed.

## Identity Contract

- `snapshotId`: stable snapshot identity.
- `updatedAt`: ordering, history, and UI.
- `contentHash`: deduplication, stale-review detection, regression comparison, and cache identity.
- No full runtime-data migration is required.
