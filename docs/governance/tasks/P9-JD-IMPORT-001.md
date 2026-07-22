# P9-JD-IMPORT-001 — Import Job Description from URL

Status: DONE

## Model Routing

- Selected AI: Codex
- Model: GPT-5.6 Terra
- Reasoning: High
- Reason: Server-side SSRF defense, bounded extraction, existing JD pipeline integration, canonical identity, and P8 Golden regression.
- Escalation trigger: Stop only for a conflict in approved architecture authority, canonical JD identity, or persistence ownership that repository evidence cannot resolve.

## Objective

Add an explicit public HTTP/HTTPS JD URL import entry to the existing JD Intake
without changing the manual paste flow. URL fetch/extraction must run safely on
the existing server and return source text to the existing parse, preview,
confirm, canonical Job creation, identity, Screening, and Golden paths.

## Existing Production Investigation

| Concern | Existing owner / behavior |
|---|---|
| Manual UI/state | `JDIntake.tsx`; local `rawJD`, parsed-field, paste-back, preview, and save state |
| Manual Parse trigger | `ManualAiPanel`; user copies `buildJDParsePrompt(rawJD)`, explicitly obtains/pastes JSON, then clicks Parse |
| Parse owner | `promptBuilders.ts::buildJDParsePrompt()`; no automatic AI or deterministic production JD parser |
| Parse validator/preview | `tryParseJson<ParsedJD>()` and `ParsePreviewCard`; invalid JSON remains preview error until corrected |
| Edit/confirm/create | Preview applies to editable fields; Save/Update is the explicit confirmation boundary |
| Cancel/failure | No Job exists before Save; leaving or clearing the new form discards local state |
| Job model | `JobApplication`, `ParsedJD`; raw source text is `rawJD` |
| Canonical initializer | `data/jobs.ts::initializeJob()` |
| Identity/staleness | `computeJobContentHash()`, selection/Brief identity, `cvStaleReasonForJob()`, review freshness, Export Decision |
| Server/network | `server.cjs`, `serverConfig.cjs`, `httpUtils.cjs`; no outbound fetch, URL/IP validator, redirect policy, or HTML extractor exists |
| Persistence | revisioned `storageService.cjs`; imports must not write persistence before Save |
| P8 Golden | dataset v1, production positioning/evidence/writer validators, deterministic runner, explicit recorded-AI validator |

### Confirmed Integration Gap

JD Intake accepts only raw manual text. The server has no safe outbound JD
fetch route, SSRF boundary, extraction owner, provenance response, or URL-to-raw
JD handoff. Adding URL metadata directly to the current parsed/hash input would
also risk provenance-only staleness.

## Scope

- Add one server-side safe fetch/extraction service and `/api/jd/import`.
- Allow only public HTTP/HTTPS destinations after DNS resolution and at every redirect.
- Bound time, redirect count, compressed/decompressed bytes, content types, and encodings.
- Extract JSON-LD JobPosting first, then Microsoft Careers HTML, then generic HTML.
- Add minimal provenance metadata outside canonical JD content identity.
- Add an explicit URL import control to `JDIntake`; fetching never invokes Parse or downstream AI.
- Return extracted source text to the existing raw input and keep existing preview/confirmation/initializer boundaries.
- Extend the P8 deterministic runner with one fixed URL-response equivalence fixture.

## Allowed Files

- `CV_Manager_React/jdImportService.cjs`
- `CV_Manager_React/server.cjs`
- `CV_Manager_React/serverConfig.cjs`
- `CV_Manager_React/src/types.ts`
- `CV_Manager_React/src/storage.ts`
- `CV_Manager_React/src/data/jobs.ts`
- `CV_Manager_React/src/components/tabs/JDIntake.tsx`
- `CV_Manager_React/scripts/smoke-jd-url-import.mjs`
- `CV_Manager_React/scripts/smoke-jd-intake-regression.mjs`
- `CV_Manager_React/scripts/golden/fixtures/**`
- `CV_Manager_React/scripts/smoke-golden-validation.mjs`
- `CV_Manager_React/scripts/smoke-server-persistence.mjs`
- `CV_Manager_React/package.json`
- `docs/governance/tasks/P9-JD-IMPORT-001.md`
- `docs/governance/URL_IMPORT_POLICY.md`
- `docs/governance/phase2/QUALITY_REGRESSION_CHECKLIST.md`
- `docs/architecture/CURRENT_ARCHITECTURE.md`
- `docs/governance/{CURRENT_STATE.md,MASTER_TASK_ROADMAP.md,COMPLETION_REPORT.md}`
- `docs/{DOCUMENT_REGISTRY.yaml,DOCUMENT_RELATIONSHIPS.md}`

## Forbidden Files

- `CV_Manager_React/data/**`
- P5, P6, DOC-GOV-002, P7, and P8 task status/content
- Screening/Fit/Writer/Reviewer/Repair/Export owners except existing regression use
- Legacy product surfaces
- Git and `.push-staging/`

## Non-Goals

- Authentication, cookies, OAuth, browser automation, JavaScript execution, PDF extraction, batch import, monitoring, crawling, auto-Screening, auto-Writer, or auto-application.
- A URL-specific parser, Job model, initializer, Screening, Fit, or Golden framework.

## Acceptance Criteria

- [x] Existing manual paste/explicit Parse/preview/edit/confirm behavior is unchanged.
- [x] Fail-first proves the production server lacks the safe URL import contract.
- [x] Fetch runs server-side and rejects unsafe protocol, credentials, host, resolved IP, and redirect destinations.
- [x] Timeout, redirects, response bytes, decompression, content type, and encoding are bounded.
- [x] JSON-LD object/array/graph/multiple-script extraction works; invalid JSON falls back safely.
- [x] Microsoft Careers fixture and generic HTML fallback preserve JD sections and remove page noise.
- [x] Fetch failure preserves URL/manual text, creates no Job, writes no canonical data, and exposes a typed safe error.
- [x] Extracted text enters the existing Parse/Preview/Confirm/initializer path without hidden AI.
- [x] Provenance metadata is stored separately and excluded from canonical JD identity.
- [x] Content changes retain P7 staleness/Review/Export behavior; metadata-only changes do not stale.
- [x] P8 manual scenarios, requirement matrices, Fit, rank, recommendations, and forbidden claims remain unchanged.
- [x] Fixed URL fixture equals its manual Golden scenario after canonical normalization.
- [x] Recorded-AI validation reports `ai_invoked: false`.
- [x] Focused, build, product, persistence, server, and full system tests pass.
- [x] Registry/links/IDs/conflict markers pass and no task remains READY.

## Migration and Recovery

- Provenance is optional for legacy records; no persisted-data migration or rewrite.
- Import results stay local to JD Intake until explicit Save/Update.
- Failure never replaces existing raw JD text and always offers manual paste.
- Rollback removes the URL entry/route/service while leaving manual JD records valid.

## Final Report

Report existing manual owners, fail-first evidence/root cause, URL/server/security/
extraction/parser/identity implementation, Golden equivalence, every changed
file, exact tests, limitations, and final READY count.

## Completion Evidence

### Fail-First

`npm run smoke:jd-url-import` initially failed with:

```text
Error: Cannot find module '../jdImportService.cjs'
```

This proved the production server had no URL safety validator, outbound fetch
owner, extraction contract, or route. The implementation added those missing
owners instead of weakening an existing validator.

### Implemented Flow

```text
Public URL
-> POST /api/jd/import
-> URL + DNS/IP + per-redirect public-network validation
-> bounded server fetch/decompression/content-type validation
-> JSON-LD JobPosting, Microsoft Careers HTML, or generic HTML extraction
-> existing rawJD state
-> existing explicit Parse -> Preview/Edit -> Save/Update
-> existing initializeJob() and downstream identity/staleness
```

Manual paste continues through the same original `ManualAiPanel`,
`buildJDParsePrompt()`, paste-back parse, `ParsePreviewCard`, editable fields,
and Save/Update boundary. Fetch does not call AI or write persistence.

### Security and Errors

- Public HTTP/HTTPS only; credentials, local/internal hosts, and non-public
  IPv4/IPv6—including mapped IPv6 and metadata/link-local ranges—are rejected.
- DNS is validated and a validated public address is pinned for the request.
- Every redirect is revalidated; loops and excess redirects fail.
- Connection/response timeout, compressed/decompressed bytes, supported
  encodings, text content types, and response status are bounded.
- Requests send no cookies/authorization and execute no remote JavaScript.
- Errors use the required typed categories without internal network/stack detail.

### Golden and Identity

- Captured URL fixture: `GOLDEN-JD-003`, response hash `h1lh6i2a`.
- URL and manual source text, normalized content, content hash `h1uvd2my`,
  Requirement Matrix, `STRONG_FIT`, rank score 85, relative rank 1, and
  `GENERATE_PRIORITY_CV` are identical.
- All four manual P8 scenarios retain their original classification/ranking and
  forbidden-claim checks.
- `jdProvenance` is retained by `initializeJob()` but excluded from
  `computeJobContentHash()`. Metadata-only changes remain identity-stable;
  canonical content changes continue to stale downstream artifacts.
- Recorded-AI validation: `ai_invoked: false`.

### Validation

- PASS: fail-first before repair; focused URL security/extraction and intake regressions after repair
- PASS: P5, P6, P7, P8 Golden, Backbone, Brief, Writer, Reviewer, Repair, Export, persistence, Product Acceptance, build
- PASS: `npm run test:system`, including server route/persistence smoke
- PASS: browser no-AI 1/1 and Product Acceptance 13/13
- PASS: Registry inventory, duplicate IDs, Markdown links, conflict markers, and READY count

### Limitations

- Client-rendered pages without usable server HTML require manual paste.
- Authenticated pages, cookies/sessions, browser automation, PDF/attachments,
  batch import, and background monitoring are unsupported.
- Structured extraction may omit fields absent from the public page; the user
  reviews/edits them through the existing flow.

Final state: P9 is DONE; no task is READY; canonical runtime data was not modified.

### Post-Closure Production Verification

The first live Microsoft Careers import exposed two bounded integration defects:

1. Modern Node requested the custom DNS lookup result with `all: true`, while
   the pinned-address callback returned the legacy scalar shape.
2. The live Microsoft Careers HTML response was 698,124 bytes, above the
   original 512 KiB compressed-response limit.

The pinned lookup now supports both Node callback shapes, and the compressed
limit is 1 MiB while the decompressed limit remains 2 MiB. The exact user URL
then imported successfully through JSON-LD with role
`Principal/Senior Software Engineer, Experimentation Platform - CoreAI`,
Microsoft as company, zero redirects, and no AI invocation.

Live content comparison then proved that Microsoft’s initial JSON-LD omitted
Overview, job metadata, compensation, and section structure. Browser/source
inspection identified the page’s anonymous same-origin `position_details` API.
The Microsoft adapter now safely fetches that endpoint through the same
DNS/IP/timeout/size boundary and returns:

- title, locations, job number, posting date, work-site/travel/profession/role metadata
- complete Overview, Responsibilities, Required/Other/Preferred Qualifications
- compensation and application-period text
- any explicit Skills fields; when none is published, all skills stated inside
  Qualifications remain in the full raw JD and a review warning explains that
  no separate Skills field existed

The live result used `microsoft-careers-position-details`, returned job number
`200041631`, preserved C/C++/C#/Java/JavaScript/Python, distributed systems,
cloud, observability, experimentation, and A/B-testing requirements, and
excluded generic equal-opportunity boilerplate.

### Post-Closure Structured-Field Remediation

The initial follow-up field approach was corrected before release: external
source keys cannot dynamically expand the production schema. `ParsedJD` uses
one fixed approved field set and retains `requirements` and
`preferredQualifications` as the sole qualification owners.

Structured imports fill only empty matching fields. Empty values are ignored;
different non-empty manual values are preserved and reported. Unknown
scalar/list fields enter `additionalAttributes`, a preview-only container
excluded from canonical hash, Screening/ranking, Evidence selection, and Writer
context. Save/Update remains explicit and manual Paste/Parse remains unchanged.

The hash owner now allowlists canonical parsed fields. Approved JD-content
changes stale downstream identity; provenance, source URL, and additional
attributes do not. Legacy records without new optional fields remain valid,
and persistence round-trip coverage includes the new fields and metadata.
