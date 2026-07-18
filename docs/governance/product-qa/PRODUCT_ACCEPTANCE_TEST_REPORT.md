# Product Acceptance Test Report

Status: COMPLETE

Date: 2026-07-13

Task: `docs/governance/tasks/P4-QA-001.md`

## Summary

Implemented a deterministic Product Acceptance Test system for CV Builder.

No real AI invocation is used. The suite uses fixed fixtures and local deterministic rules only.

## Fixtures Used

Location:

- `CV_Manager_React/scripts/product-acceptance/fixtures.mjs`
- `CV_Manager_React/scripts/product-acceptance/fixtures/generated/export-ready-cv.json`

Fixture categories:

- candidate profile
- contact information
- evidence cards
- job description
- JD analysis result
- selected evidence
- effective CV brief
- writer output
- reviewer result
- repair plan
- repaired CV
- export-ready CV

Scenarios:

| Scenario | Purpose | Result |
|---|---|---|
| Happy path | all required data present; one safe blocker resolved; final CV exportable | PASS |
| Missing contact | email missing; Jump to Fix targets contact email; edit resolves blocker | PASS |
| Weak bullet | weak bullet targets the correct work bullet; deterministic edit resolves it | PASS |
| Unsupported claim | unsupported visible claim blocks gates until removed | PASS |
| Warning-only | warning remains but export stays allowed | PASS |

## Simulated User Steps

Each scenario advances these deterministic stages exactly once:

1. Open application state
2. Load fixture JD
3. Apply fixture JD analysis
4. Apply fixture evidence selection
5. Apply effective CV brief
6. Apply fixture writer output
7. Run deterministic review
8. Resolve blocker
9. Jump to exact edit target
10. Apply deterministic edit
11. Revalidate affected checks
12. Reach Final Export

## Generated CV Output Path

`CV_Manager_React/scripts/product-acceptance/fixtures/generated/export-ready-cv.json`

## HR Review Gate

Module:

- `CV_Manager_React/scripts/product-acceptance/hrReviewGate.mjs`

Deterministic checks include:

- name exists
- valid email exists
- location/contact section complete
- target role positioning clear
- summary readable and not duplicated
- recent experience visible
- no internal-only terminology
- no exact duplicate bullets
- required sections exist
- CV length/depth proxy passes
- no unsupported visible claims
- ATS-readable structure
- no unresolved blocking issue

Representative passing score:

- HR score: 95
- HR blockers: 0

## Hiring Manager Review Gate

Module:

- `CV_Manager_React/scripts/product-acceptance/hiringManagerReviewGate.mjs`

Deterministic checks include:

- selected evidence matches JD core capability areas
- visible work bullets cite valid selected EvidenceCard IDs
- technical depth represented
- business impact represented
- bullets contain concrete action and result
- important evidence is not omitted
- CV does not overfit the JD
- unsupported claims rejected
- summary positioning aligns with evidence
- duplicate or generic content rejected
- manager-relevant role depth meets contract

Representative passing score:

- Hiring Manager score: 100
- Hiring Manager blockers: 0

## Export Readiness

All five scenarios reached export-ready final state after deterministic review/edit/revalidation.

Warning-only scenario preserved warning state while keeping export allowed.

## No-AI Verification

Module:

- `CV_Manager_React/scripts/product-acceptance/noAiGuard.mjs`

Smoke:

- `npm run smoke:no-ai-invocation`

Verified protections:

- Codex CLI spawn is blocked.
- OpenAI/model endpoint fetch is blocked.
- AI-running automation state is blocked.
- Product acceptance suite completes with zero AI attempts.

## Failed Scenarios

No final scenario remains failed.

Negative conditions are intentionally tested:

- missing email fails HR gate before edit
- unsupported visible claim fails HR and Hiring Manager gates before removal
- weak/generic bullet fails Hiring Manager gate before repair
- wrong evidence ID namespace fails Hiring Manager traceability

## Remaining Limitations

- This is a deterministic smoke/release-gate harness, not an end-to-end browser test.
- It does not invoke real writer, reviewer, automation, export, or persistence code.
- Gate scores are rule-based proxies, not model judgment.
- Fixture coverage is intentionally narrow and should be expanded when new product journeys are added.

## Release Gate Recommendation

This can become a release gate for deterministic product readiness.

Recommended release-gate commands:

- `npm run smoke:product-acceptance`
- `npm run smoke:hr-review-gate`
- `npm run smoke:hiring-manager-review-gate`
- `npm run smoke:no-ai-invocation`
- existing Phase 4 and system regressions

## Tests Executed

From `CV_Manager_React/`:

- `npm run smoke:product-acceptance` - PASS
- `npm run smoke:hr-review-gate` - PASS
- `npm run smoke:hiring-manager-review-gate` - PASS
- `npm run smoke:no-ai-invocation` - PASS
- `npm run smoke:phase4-guided-blockers` - PASS
- `npm run smoke:phase4-guided-editing` - PASS
- `npm run smoke:phase4-ai-explainability` - PASS
- `npm run smoke:phase4-decision-confidence` - PASS
- `npm run smoke:workflow` - PASS
- `npm run smoke:reviewer` - PASS
- `npm run smoke:export-readiness` - PASS
- `npm run build` - PASS
- `npm run test:system` - PASS after approved localhost execution

The first sandboxed `npm run test:system` run failed only at `smoke:server` with `listen EPERM 127.0.0.1`. The approved rerun passed.
