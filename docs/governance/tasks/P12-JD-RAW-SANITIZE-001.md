# P12-JD-RAW-SANITIZE-001 — Canonical Raw JD Sanitization

Status: DONE

## Model Routing

- Selected AI: Codex
- Model: GPT-5.6 Terra
- Reasoning: High
- Reason: Cross-boundary production defect involving URL extraction, canonical
  raw JD, prompt input, token safety, content identity, and Golden equivalence.
- Escalation trigger: Stop if repository evidence cannot establish the
  canonical raw-JD owner, approved identity boundary, or safe compatibility
  behavior without changing architecture.

## Objective

Remove remote application-state contamination at the production raw-JD owner.
Microsoft and generic URL imports must provide clean, complete, deterministic
canonical job content to the existing explicit JD Parse flow without changing
manual paste, employer-insight, provenance, identity, or no-AI contracts.

## Dependencies

- `docs/architecture/CURRENT_ARCHITECTURE.md`
- `docs/governance/URL_IMPORT_POLICY.md`
- `docs/governance/tasks/P9-JD-IMPORT-001.md`
- `docs/governance/tasks/P10-JD-IMPORT-COMPAT-001.md`
- `docs/governance/tasks/P11-JD-INTAKE-UX-001.md`

## Allowed Files

- Existing URL-import extractor/server owners
- Existing raw-JD and prompt-input owners
- Existing JD Intake validation/presentation boundary when required
- P12 fixtures, focused tests, regression commands, and package scripts
- P12 and directly related governance completion/index records

## Forbidden

- New parallel canonical JD model or dynamic production columns
- Reopening P8, P9, P10, or P11
- Automatic Save, Parse, Screening, Writer, or AI
- Silent destructive migration of existing saved raw JD
- Broad architecture redesign, runtime-data mutation, Git, or push

## Required Work

1. Trace response body, extractor/debug payload, canonical raw JD, provenance,
   employer insights, prompt input, persistence, and content-hash owners.
2. Add a fixed Microsoft contaminated-response fail-first fixture.
3. Build canonical Microsoft raw JD deterministically from structured fields.
4. Preserve structured-first and readable-DOM fallback boundaries for generic
   sites without broad destructive regex sanitization.
5. Ensure `buildJDParsePrompt()` reads only validated canonical raw JD.
6. Add deterministic prompt size/noise guards without truncating formal content.
7. Preserve manual/URL canonical equivalence, identity, staleness, and Golden
   outcomes.
8. Run focused and full regressions and close governance records.

## Acceptance Criteria

- [x] Root cause and pre-fix construction flow are evidenced.
- [x] Fail-first proves Microsoft UI/config state contaminates raw JD and Prompt.
- [x] Microsoft raw JD is rebuilt in the required stable section order.
- [x] Canonical raw JD and Prompt exclude application-state/config/debug payload.
- [x] Overview, Responsibilities, Qualifications, Compensation, and application
  window remain complete.
- [x] Employer Insights and provenance remain isolated and informational only.
- [x] Empty, contaminated, or unreasonably noisy Prompt input is blocked without
  AI or destructive data changes.
- [x] Manual/URL equivalence, content identity, and P7 staleness pass.
- [x] Generic JSON-LD, generic HTML, Microsoft details/insights, and manual
  fallback remain supported.
- [x] URL Import, JD Intake, persistence, Golden, Writer, Reviewer, Repair,
  Export, server, no-AI, Product Acceptance, build, and system regressions pass.
- [x] Documentation closes P12 as DONE and READY count returns to zero.

## Completion Evidence

### Root Cause and Repair

The Microsoft details adapter correctly parsed structured content but built
`sourceText` by appending the entire `data.jobDescription`. Microsoft page
configuration preceding `Overview` therefore entered React `rawJD` and
`buildJDParsePrompt()`. The adapter now builds raw JD only from its extracted
formal fields in a stable order; remote HTML/JSON never becomes canonical raw
text merely because it was fetched.

Generic extraction continues to prefer Schema.org `JobPosting`; fallback HTML
now prefers readable `main`/`article` content and fails closed when the result
is application-state data. It does not use a destructive cleanup migration or
truncate formal content.

### Prompt and Identity

`validateJDParseInput()` blocks empty, oversized, serialized-state, and known
application-configuration input. JD Intake disables Copy Prompt and presents a
manual-paste/re-fetch recovery message; it never invokes AI. Employer Insights,
provenance, additional attributes, response bodies, and debug payload remain
outside raw JD and Prompt.

`computeJobContentHash()` still uses canonical raw/parsed content. Two fixtures
with different theme/config values produce identical raw JD; a formal
Responsibility change produces different canonical content. Existing
provenance-only stability and P7 staleness tests pass.

### Validation

- Fail-first: `smoke:jd-raw-sanitization` failed because `themeOptions` remained
  in production raw JD.
- PASS: P12 contamination/completeness/order/noise/equivalence fixtures.
- PASS: Microsoft details/insights, JSON-LD, generic HTML, Manual Intake,
  persistence, P7 staleness, P8 Golden, Writer, Reviewer, Repair, Export,
  no-AI, Product Acceptance, build, full system, and server tests.
- PASS: JD Import browser E2E 1/1, browser no-AI 1/1, Product Acceptance 13/13.
- Golden remains JD-003 Strong rank 1, JD-001 Viable Medium, JD-002/JD-004 Low,
  with no network or AI invocation.

## Rollback

Restore the previous extractor/raw-JD composition and prompt validation files.
No persistence migration is included, so rollback requires no data rewrite.
