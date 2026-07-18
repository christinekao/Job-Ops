Status: DRAFT
Authority: REFERENCE
Can Authorize Production Implementation: NO
Does Not Override: docs/architecture/CURRENT_ARCHITECTURE.md
Reason for Draft Status: Duplicate older roadmap; governance roadmap is the active task tracker.
Required Decision Before Activation: Explicit owner decision to reactivate a separate roadmap.

# Master Task Roadmap

## Governance

- Audit date: 2026-07-11
- Production surface: `CV_Manager_React/`（依 `KNOWLEDGE.md`「CV Manager 唯一正式入口」及 `CV_Manager_React/docs/ARCHITECTURE.md` Top-Level Runtime）。
- Execution policy: 一次只能執行一份 Task；前一份 Task 完成且驗證通過前，不得開始下一份。
- Scope policy: 新發現不得擴張進行中 Task，必須另建 Task。
- Confidence vocabulary: `Confirmed`、`Highly likely`、`Possible`、`Insufficient evidence`。

## Roadmap

| Order | Task | Status | Outcome | Entry gate |
|---|---|---|---|---|
| 1 | `TASK-001` | DONE | 還原 runtime flow、Stage Contracts、Agent/Prompt、state mutation 與規格落差 | Completion Report 已驗證；不自動開始後續 Task |
| 2 | `TASK-002` | BLOCKED | 釐清並核准 canonical workflow／contract | TASK-001 Completion Report 驗證完成；unresolved decisions 有 owner |
| 3 | `TASK-003` | BLOCKED | 依核准 contract 規劃實作與 regression suite | TASK-002 驗收完成；變更範圍獲明確授權 |

## Current audit baseline

- `Confirmed`：主流程意圖為 Career Evidence → JD Analysis → Terms + Gaps → CV Brief + Evidence → Screening CV → Gate → Manager/ATS → Export；依 `CV_Manager_React/docs/FLOW.md` Main Workflow。
- `Confirmed`：`src/App.tsx` 是 UI composition、選定 JD/CV context 與 app-level mutation/persistence orchestration 入口；依 `App()`、`updateJob()`、`saveCvVersion()`。
- `Confirmed`：workflow 判定集中於 `src/domain/screeningWorkflow.ts::deriveScreeningWorkflowState()`；review 在 `screeningReview.ts`；readiness 在 `screeningReadiness.ts`；brief 在 `src/data/selection.ts::buildCvBrief()`。
- `Confirmed`：canonical persistence 是 `data/app_data.json`，由 `storageService.cjs` revisioned write；browser `localStorage` 是 fallback/cache，依 `src/storage.ts` 與 `docs/ARCHITECTURE.md` Data Ownership。
- `Confirmed`：Codex automation 只有 `screening-analysis`、`screening-cv` server routes；依 `server.cjs` POST route 與 `automationService.cjs::queueJob()`。
- `Insufficient evidence`：沒有檔案被 canonical 文件命名為「理想 CV 範例」。`_archive/reference-cv-html/` 與 `CV/*.pdf` 僅能確認是 reference/source material，不能確認哪一份是 acceptance oracle。

## Stage contract register

| Stage | Inputs | Output/state | Gate owner | Evidence | Confidence |
|---|---|---|---|---|---|
| Career Evidence | profile、evidence cards、skills、STAR | evidence readiness | `screeningReadiness.ts::evidenceIntegrityReview()` | `FLOW.md` Step 1 | Confirmed |
| JD Analysis | selected JD/raw JD | `job.screeningAnalysis`, `job.screeningAnalysisRun` | `ScreeningLab.tsx::applyScreeningAnalysisResult()` | `FLOW.md` Step 2; `promptBuilders.ts::buildScreeningAnalysisPrompt()` | Confirmed |
| Terms + Gaps | screening analysis | terminology/gap review | `screeningReadiness.ts::terminologyAndGapReview()` | `FLOW.md` Step 3 | Confirmed |
| CV Brief + Evidence | JD、analysis、selected evidence | `CvBrief` / generation readiness | `selection.ts::buildCvBrief()` | `FLOW.md` Step 4 | Confirmed |
| Screening CV | brief、evidence、JD | current `CvVersion`, `job.screeningCvRun` | `ScreeningLab.tsx::applyScreeningCvResult()` → `App.tsx::saveCvVersion()` | `FLOW.md` Step 5 | Confirmed |
| Gate | current JD + current CV | local gate checks | `screeningReview.ts::screeningGate()` | `FLOW.md` Step 6 | Confirmed |
| Manager + ATS | same current CV snapshot | reviewer/export checks + review snapshot | `hiringManagerReview()`, `reviewerPass()`, `exportVerification()`, `createReviewSnapshot()` | `FLOW.md` Step 7 | Confirmed |
| Export / Apply | current reviewed CV | browser export / application action | `components/tabs/Export.tsx`, `components/cv/CVStudio.tsx` | `FLOW.md`; `App.tsx` routes | Highly likely |

## Module and state-mutation index

- CV mutation: `ScreeningLab.tsx::applyScreeningCvResult()`、`applyTitleAlignmentFix()`、`applyContactHeaderFix()`、`applyLocalReviewerContentFix()`；all pass versions to `App.tsx::saveCvVersion()`. `CVStudio.tsx` and `CVBuilder.tsx` also receive save callbacks from `App.tsx`.
- Review mutation: `screeningReview.ts::createReviewSnapshot()` creates the snapshot; `App.tsx::saveCvVersion()` clears it when `reviewSnapshot.cvUpdatedAt !== version.updatedAt`.
- Job mutation: `App.tsx::updateJob()` invalidates analysis/selections when JD content hash changes; Screening Lab applies analysis/run state through its update callback.
- Persistence mutation: `App.tsx` save effect → `src/storage.ts::saveLocalData()` and `saveData()` → `server.cjs /api/data` → `storageService.cjs` canonical + mirror writes.
- Automation state: `src/storage.ts::startAutomation()` / `getAutomationJob()` → `server.cjs` → `automationService.cjs`; `useAutomationPolling.ts` polls; Screening Lab apply-once handlers apply results.

## Agent and Prompt inventory

No independently configured runtime Agent was found. Role prose inside prompts is not treated as a separate Agent.

- Runtime automation executor: Codex CLI child process in `automationService.cjs::runCodexPrompt()` (`Confirmed`).
- Screening prompt builders: `buildScreeningAnalysisPrompt()` and `buildScreeningCvPrompt()`; these are the only prompt types accepted by current server routes (`Confirmed`).
- Other builders in `src/promptBuilders.ts`: source parse (single/batch), profile delta, career backbone, project backbone delta, evidence, domain knowledge, skill inference, STAR, JD parse, fit review, tailored CV (`Confirmed` as code; runtime reachability varies and requires TASK-001 trace completion).
- Saved prompt data: `data/prompt_templates.json`; loaded/persisted through `AppData.promptTemplates` (`Confirmed`).
- Mode contracts: `modes/_shared.md`, `career-evidence.md`, `jd-pipeline.md`, `batch-review.md`, `quality-export.md` (`Confirmed` documents; consistency with the screening workflow is not yet established).

## Test baseline

`package.json::test:system` runs build plus smoke tests for HTTP guards, config, storage, workflow, reviewer/export, review roles, automation guards/service, and server persistence. No browser E2E, visual/PDF golden, or explicit prompt snapshot test was found (`Confirmed` for repository scan; absence is limited to current tree).

## Missing evidence that blocks later tasks

See the companion draft `UNRESOLVED_QUESTIONS.md`. Most material blockers are: canonical stage count/name, designated ideal CV oracle, definition of “actual produced CV”, runtime status of legacy prompt modes, and acceptance authority for Stage Contracts.
