# Module Graph

Status: source-grounded module inventory.

## Active App Modules

| Module | Responsibility | Key Symbols | Evidence | Confidence |
|---|---|---|---|---|
| `CV_Manager_React/src/App.tsx` | App shell, lazy-loaded tabs, top-level data state, selected JD/CV preferences | `App`, `readLocalPreference`, `writeLocalPreference` | Lazy imports and storage keys in file | Confirmed |
| `CV_Manager_React/src/storage.ts` | Browser persistence client, localStorage fallback, `/api/data`, automation endpoints | `loadData`, `saveData`, `startAutomation`, `getAutomationJob`, `exportData` | File constants `DATA_ENDPOINT`, `AUTOMATION_ENDPOINT` | Confirmed |
| `CV_Manager_React/server.cjs` | Thin local HTTP routing layer | Routes `/api/data`, `/api/automation/*`, `/api/health` | Imports `storageService`, `automationService`, `httpUtils` | Confirmed |
| `CV_Manager_React/storageService.cjs` | Canonical data load/write, validation, revision conflict, split mirrors | `createStorageService`, `readAppData`, `writeAppData`, `validateAppData`, `splitFiles` | Code writes `data/app_data.json` and mirrors | Confirmed |
| `CV_Manager_React/automationService.cjs` | Codex CLI job lifecycle, JSON extraction, output guard | `createAutomationService`, `extractJsonCandidate`, `stripCodeFence`, `queueJob` | Spawns Codex CLI read-only sandbox, captures JSON | Confirmed |
| `CV_Manager_React/serverConfig.cjs` | Runtime config from env | `createServerConfig`, `loadEnvFiles`, `numberSetting` | Used by `server.cjs` | Confirmed |
| `CV_Manager_React/httpUtils.cjs` | API HTTP guard helpers | `sendJson`, `readBody`, `requestAllowed`, `requireJson` | Used by `server.cjs` | Confirmed |

## Screening Workflow Modules

| Module | Responsibility | Key Symbols | Evidence | Confidence |
|---|---|---|---|---|
| `src/components/tabs/ScreeningLab.tsx` | Main Screening Lab UI orchestration | `ScreeningLab`, `applyScreeningAnalysisResult`, `applyScreeningCvResult`, `applyTitleAlignmentFix`, `applyContactHeaderFix`, `applyLocalReviewerContentFix` | Imports all major workflow, prompt, review, and automation functions | Confirmed |
| `src/domain/screeningWorkflow.ts` | Step recommendation, review checked state, repair lock policy | `deriveScreeningWorkflowState`, `shouldReplaceCurrentCvVersion` | Domain state derives recommended view and repair lock | Confirmed |
| `src/domain/screeningReadiness.ts` | Evidence and Terms/Gaps readiness | `evidenceIntegrityReview`, `terminologyAndGapReview` | Used by `ScreeningLab.tsx` | Confirmed |
| `src/domain/screeningReview.ts` | Gate, manager review, reviewer/export checks, repair classification, review snapshot | `screeningGate`, `hiringManagerReview`, `reviewerPass`, `exportVerification`, `createReviewSnapshot`, `classifyRepairActions` | Used by `ScreeningLab.tsx` and smoke tests | Confirmed |
| `src/domain/screeningReviewRoles.ts` | Reviewer role ownership and labels | `SCREENING_REVIEW_ROLES`, `roleForCheck`, `roleFixLabel` | Dedicated smoke test exists | Confirmed |
| `src/data/selection.ts` | Selection diagnostics, CV brief, generation context, stale CV logic, readiness | `buildCvBrief`, `buildGenerationContext`, `cvInputReadiness`, `cvStaleReasonForJob`, `buildCvGenerationSelectionPatch` | Imported by `ScreeningLab.tsx`; types in `types.ts` | Confirmed |
| `src/promptBuilders.ts` | Real prompt contracts and runtime prompt construction | `buildScreeningAnalysisPrompt`, `buildScreeningCvPrompt`, `SCREENING_CV_PROMPT_VERSION`, `buildJDParsePrompt`, `buildFitReviewPrompt` | Long JSON schemas and prompt rules in code | Confirmed |
| `src/hooks/useAutomationPolling.ts` | Frontend polling with in-flight guard | `useAutomationPolling` | Called by `ScreeningLab.tsx` | Confirmed |

## Data Type Modules

| Module | Responsibility | Key Types | Confidence |
|---|---|---|---|
| `src/types.ts` | Shared application model | `AppData`, `JobApplication`, `ScreeningAnalysis`, `CvBrief`, `GenerationContext`, `TailoredCv`, `CvVersion`, `AutomationJob` | Confirmed |
| `src/sampleData.ts` | Browser/default sample data | `defaultData` | Confirmed |
| `src/utils/hash.ts` | Stable content hash | `contentHash` | Confirmed |
| `src/utils/normalize.ts` | Recruiter-facing normalization | `sanitizeRecruiterFacingData` | Confirmed |

## Test / Smoke Coverage

| Script | Scope | Evidence | Confidence |
|---|---|---|---|
| `npm run build` | TypeScript + Vite build | `package.json` | Confirmed |
| `npm run smoke:http` | HTTP utils | `scripts/smoke-http-utils.mjs` | Confirmed |
| `npm run smoke:config` | server config | `scripts/smoke-server-config.mjs` | Confirmed |
| `npm run smoke:storage` | storage service | `scripts/smoke-storage-service.mjs` | Confirmed |
| `npm run smoke:workflow` | screening workflow state and prompt smoke | `scripts/smoke-screening-workflow-state.mjs` | Confirmed |
| `npm run smoke:reviewer` | reviewer/export gate | `scripts/smoke-reviewer-export-gate.mjs` | Confirmed |
| `npm run smoke:review-roles` | reviewer role routing | `scripts/smoke-screening-review-roles.mjs` | Confirmed |
| `npm run smoke:automation` | automation output guards | `scripts/smoke-automation-output-guards.mjs` | Confirmed |
| `npm run smoke:automation-service` | automation service lifecycle | `scripts/smoke-automation-service.mjs` | Confirmed |
| `npm run smoke:server` | server persistence integration | `scripts/smoke-server-persistence.mjs` | Confirmed |
| `npm run test:system` | Combined system test command | `package.json` | Confirmed |

## Module Coupling Findings

| Finding | Evidence | Expected Behavior | Actual Behavior | Root Cause | Confidence |
|---|---|---|---|---|---|
| Screening Lab has broad dependency fan-in | `ScreeningLab.tsx` imports prompt builders, selection, readiness, review, workflow, storage automation, polling, panels, shared UI | Orchestration can import many services, but domain mutation and repair logic should stay outside UI when reusable | UI component still owns several apply/fix functions and local repair heuristics | Missing extraction of local repair/action services | Confirmed |
| Review and repair classification are partly separated | `screeningReview.ts` has `classifyRepairActions`; `screeningReviewRoles.ts` maps ownership; `ScreeningLab.tsx` chooses and applies local fixes | Review should evaluate; repair should route and patch with explicit boundaries | Classification is in domain, but patch implementation remains in UI component | Incomplete repair-service extraction | Confirmed |

