# P10-JD-IMPORT-COMPAT-001 — Cross-company JD Import and Employer Insights

Status: DONE

## Model Routing

- Selected AI: Codex
- Model: GPT-5.6 Terra
- Reasoning: High
- Reason: This defect spans extractor routing, fixed production schema, supplemental-signal safety, persistence, identity, Golden ranking, and cross-company fallbacks.
- Escalation trigger: Stop only for a conflict between Current Architecture, an Approved ADR, or an active production owner that repository evidence cannot resolve.

## Objective

Repair successful URL imports so the submitted URL fills the existing
`sourceUrl` field, and preserve Microsoft Careers previous-hire insights as
informational supplemental content without weakening the shared cross-company
URL import pipeline.

## Confirmed Owners

- Network and extractor routing: `CV_Manager_React/jdImportService.cjs`
- HTTP route/config: `CV_Manager_React/server.cjs`, `serverConfig.cjs`
- Fixed JD schema: `CV_Manager_React/src/types.ts`
- Editable URL handoff and explicit confirmation: `JDIntake.tsx`
- Identity: `src/data/jobs.ts::computeJobContentHash`
- Persistence: revisioned storage owner and browser recovery path
- Screening/Fit: existing Requirement Matrix and `positioningPolicy.ts`
- Writer-visible context: `promptBuilders.ts` and `data/selection.ts`

## Policy Decision

`employerInsights` is informational-only persisted supplemental metadata in
this task. It is excluded from Screening, Fit/ranking, Evidence selection,
Writer context, and canonical JD identity. It therefore cannot stale downstream
artifacts or change a Fit tier.

## Scope

- Preserve one safe server-side pipeline: Microsoft adapter enhancement,
  standard JSON-LD, generic HTML, then manual fallback.
- Fill `sourceUrl` from the original successful user submission without waiting for GPT Parse.
- Add fixed optional `EmployerInsights` with `topSkills` and `previouslyWorkedAs`.
- Extract, deduplicate, preserve order/casing, persist, and display Microsoft previous-hire insights separately from formal Skills and Qualifications.
- Report extraction coverage as FULL, PARTIAL, or MANUAL_FALLBACK_REQUIRED.
- Preserve unknown fields in `additionalAttributes`; never create dynamic production properties.
- Add fail-first fixtures/regressions and complete cross-company, identity, persistence, Golden, no-AI, system, and browser validation.

## Allowed Files

- `CV_Manager_React/jdImportService.cjs`
- `CV_Manager_React/server.cjs`
- `CV_Manager_React/serverConfig.cjs`
- `CV_Manager_React/src/types.ts`
- `CV_Manager_React/src/storage.ts`
- `CV_Manager_React/src/data/jobs.ts`
- `CV_Manager_React/src/data/selection.ts`
- `CV_Manager_React/src/promptBuilders.ts`
- `CV_Manager_React/src/domain/screeningReview.ts`
- `CV_Manager_React/src/components/tabs/JDIntake.tsx`
- `CV_Manager_React/scripts/**jd*`
- `CV_Manager_React/scripts/smoke-server-persistence.mjs`
- `CV_Manager_React/scripts/smoke-golden-validation.mjs`
- `CV_Manager_React/e2e/**jd*`
- `CV_Manager_React/package.json`
- P10 governance and directly related URL import/architecture/registry records

## Forbidden

- Runtime data under `CV_Manager_React/data/**`
- Reopening P5, P6, DOC-GOV-002, P7, P8, or P9
- Dynamic production columns, company-specific Job models, or parallel Screening flows
- Client-side Microsoft API calls, cookies, authentication, hidden AI, automatic Save/Parse/Screening/Writer, Git, or push

## Acceptance Criteria

- [x] Fail-first reproduces blank Source URL and missing previous-hire insights.
- [x] Successful Fetch fills original `sourceUrl`; failure preserves existing content.
- [x] Microsoft top skills and previous roles are separate, deduplicated supplemental metadata.
- [x] Formal Skills, Requirements, and Preferred Qualifications remain unchanged by employer insights.
- [x] Non-Microsoft JSON-LD, generic HTML, unknown-field handling, adapter failure fallback, and manual fallback pass.
- [x] Employer insights do not enter identity, Screening/Fit/ranking, Evidence selection, or Writer context.
- [x] Persistence/recovery/legacy/revision behavior passes.
- [x] Golden matrices, Fit tiers, ordering, recommendations, and forbidden claims remain unchanged with no AI.
- [x] Build, system, server, no-AI E2E, Product Acceptance E2E, and documentation checks pass.
- [x] Task/documentation close as DONE and READY count returns to zero.

## Rollback

Remove the optional insights extraction/display while retaining the shared URL
pipeline and Source URL fix. Legacy and newly saved Jobs remain readable because
all new fields are optional.

## Completion Evidence

- Fail-first proved successful Fetch did not call `setSourceUrl` and Microsoft
  output omitted `employerInsights`.
- The UI now fills the original URL immediately. Redirect destination is
  optional provenance `finalUrl`.
- Microsoft `position_details` and public anonymous `position_insights` use the
  same server-side URL/DNS/IP/timeout/size boundary.
- Insights are informational-only, persisted separately, and excluded from
  formal Skills/Qualifications, identity, Screening/Fit/ranking, Evidence
  selection, and Writer.
- Live verification returned FULL coverage with ten top skills and ten previous
  roles while formal Skills remained empty.
- PASS: focused URL/intake, persistence/recovery, P7, P8 Golden, no-AI, Writer,
  Reviewer, Repair, Export, Product Acceptance, build, full system/server, JD
  compatibility E2E 1/1, browser no-AI 1/1, and Product Acceptance E2E 13/13.
