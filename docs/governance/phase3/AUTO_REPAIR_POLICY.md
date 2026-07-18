# Auto Repair Policy

Status: Design only.

## Automatically repairable

AI may repair once per content identity when the repair is narrow, reversible, and source-grounded:

- exact duplicate bullets or duplicate summary sentences
- grammar, punctuation, and formatting
- section and bullet ordering
- internal terminology translated into external wording
- traceable wording that preserves the same evidence IDs
- obvious action/outcome phrasing where no claim or metric changes
- deterministic contact/header formatting from structured profile data

Every repair must preserve already-passed areas, evidence IDs, employer/role facts, and unsupported-claim safeguards.

## Approval-required repairs

Pause at `Needs Approval` for career positioning, target title, technical ownership, business impact, experience meaning, evidence selection, claim suppression, or any wording whose support is ambiguous.

## Prohibited repairs

Never invent evidence, metrics, outcomes, tools, scope, dates, credentials, or employer facts. Never rewrite the whole CV for a local failure. Never perform an unbounded repair loop or silently overwrite a valid prior CV.

## Repair budget and rollback

One automatic pass per repair class and content identity. Record before/after content hash, changed paths, evidence IDs, and validation result. If validation fails, discard the patch and retain the last valid CV. A second failure routes to approval or a concrete blocker.

