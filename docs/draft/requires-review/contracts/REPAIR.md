Status: DRAFT
Authority: REFERENCE
Can Authorize Production Implementation: NO
Does Not Override: docs/architecture/CURRENT_ARCHITECTURE.md
Reason for Draft Status: Contract index identifies repair extraction/approval as incomplete.
Required Decision Before Activation: Explicit contract approval.

# Contract: Repair

Owner:

- Classification: `CV_Manager_React/src/domain/screeningReview.ts`
- UI/action orchestration: `CV_Manager_React/src/components/tabs/ScreeningLab.tsx`
- Proposed extraction target: `src/domain/localReviewerFix.ts` or `src/services/cvRepair.ts`

## Current Repair Types

Current `RepairActionKind`:

- `title`
- `keyword`
- `wording`
- `structure`
- `export`
- `evidence`

Evidence: `src/domain/screeningReview.ts`.

Confidence: Confirmed.

## Contract Rules

- Repair must be narrow.
- Repair must preserve supported evidence IDs.
- Repair must not invent metrics, tools, ownership, or new claims.
- Repair must not trigger hidden AI.
- AI repair is allowed only as explicit action and should not repeat in a loop.
- Local no-token fixes may rewrite visible wording, translate internal terms, strengthen action/outcome structure, or apply header/contact fixes.

Evidence: `SPEC.md`, `FLOW.md`, `ARCHITECTURE.md`, `buildScreeningCvPrompt`, `ScreeningLab.tsx`.

Confidence: Confirmed.

## Known Gaps

- `buildLocalReviewerContentFix` and its wording/metric sanitizers now live in `src/domain/localReviewerFix.ts`.
- `ScreeningLab.tsx` retains orchestration only: current-state checks, audit callback, persistence, review snapshot, follow-up checks, and UI messaging.
- `npm run smoke:repair-regression` verifies failed-area rebuilding, passed header/sidebar preservation, stable selected evidence IDs, and no invented metrics or unsupported claims.
