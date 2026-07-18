Status: DRAFT
Authority: REFERENCE
Can Authorize Production Implementation: NO
Does Not Override: docs/architecture/CURRENT_ARCHITECTURE.md
Reason for Draft Status: This draft conflicts with the maintained governance current-state record and has no accepted promotion evidence.
Required Decision Before Activation: Owner approval of its scope, freshness, and relationship to `docs/governance/CURRENT_STATE.md`.

# Current State (Draft)

> Audit-only reconstruction. This is descriptive, not an approved future-state contract.

## Runtime boundary

`Confirmed` — React/Vite browser app (`src/main.tsx` → `src/App.tsx`) communicates with the local Node server (`server.cjs`). The server delegates persistence to `storageService.cjs` and explicit Codex jobs to `automationService.cjs`. `docs/ARCHITECTURE.md` calls React the only active product surface and `data/app_data.json` the canonical snapshot.

## Observed runtime flow

1. `App()` calls `loadData()` (`src/storage.ts`), then `bootstrapProfileSourceManifest()`, `reconcileJobsWithBackbone()`, and `reconcileJobsWithScreeningWorkflow()`.
2. The selected JD/CV is derived in `App.tsx`; only selection preferences are stored under `christine-cv-manager-selected-job` and `christine-cv-manager-selected-cvs`.
3. `ScreeningLab` builds readiness/brief/review state from domain functions and accepts manual paste-back or explicit Codex execution.
4. Analysis automation uses `buildScreeningAnalysisPrompt()` → `startAutomation("screening-analysis")`; CV generation/repair uses `buildScreeningCvPrompt()` → `startAutomation("screening-cv")`.
5. `server.cjs` validates request boundaries and queues the prompt; `automationService.cjs` runs Codex CLI and parses JSON.
6. `ScreeningLab` applies analysis to the job or saves CV output through `onSaveCv`; `App.tsx::saveCvVersion()` updates the current job and invalidates stale review snapshots.
7. Every app-data change is cached locally and debounced 650 ms to `saveData()`; the server enforces revision writes and writes canonical/mirror JSON.

## Contract mismatches / ambiguities

- `Confirmed` — `docs/FLOW.md` and `docs/ARCHITECTURE.md` define seven screening steps before export, while `KNOWLEDGE.md` says the React Screening Lab “固定為 6 步” and merges Gate + Manager Review. This historical/current terminology conflict needs an explicit canonical decision.
- `Confirmed` — `modes/_shared.md` describes a different high-level chain (Career Evidence Database → JD Parse → Fit Review → Evidence Selection → Tailored CV → Quality Audit → Export → Application Log). The relationship to the Screening Lab contracts is undocumented.
- `Confirmed` — `docs/ARCHITECTURE.md` labels inline repair heuristics in `ScreeningLab.tsx` as current risky responsibility and a future extraction target; this is architecture commentary, not authorization to refactor.
- `Insufficient evidence` — no canonical “ideal CV example” is named. The audit cannot compare layout/content against an unspecified oracle.

## Actual CV evidence inspected

- Persisted produced CVs exist in `CV_Manager_React/data/app_data.json` and mirror `data/cv_versions.json`; `CvVersion` is rendered by `CvPreview.tsx` / `CVStudio.tsx` and checked by `screeningReview.ts`.
- Source CV PDFs exist under root `CV/`; extracted source representations exist under `CV_Manager_React/source_material/`.
- `_archive/reference-cv-html/CV_Engineer 0514.html` and `CV_BI_Engineer.html` are explicitly under an archive/reference folder.
- `Insufficient evidence` — the user has not identified which persisted version is the “actual produced CV” to audit, nor which PDF/HTML is the ideal comparator. Therefore no quality verdict against an ideal is asserted.

## Current test coverage

- Unit/smoke assertions: domain workflow, reviewer/export, review role routing, output guards, HTTP, config, storage and automation services.
- Integration smoke: isolated Node server persistence/revision/origin behavior.
- Build: TypeScript + Vite.
- Not found: browser E2E, accessibility test, visual regression, PDF render/text-layer golden, prompt output fixture regression. Confidence: `Confirmed` for filenames/scripts currently present; requirement status: `Insufficient evidence`.

## Folder structure summary

- `CV_Manager_React/src/`: UI, domain, data, hooks, prompt builders, storage client and types.
- `CV_Manager_React/data/`: canonical snapshot plus split mirrors, prompt templates and evidence datasets.
- `CV_Manager_React/scripts/`: smoke tests, dev runner and migrations/rebuild utilities.
- `CV_Manager_React/modes/`: documented prompt/automation mode contracts.
- `CV_Manager_React/docs/`: product spec, flow and architecture.
- `CV_Manager_React/source_material/`: normalized/raw CV and work-history inputs.
- `CV_Manager_React/{output,reports,logs}/`: currently placeholder directories (`.gitkeep`).
- Root `CV/`, `CAREER_OS/`, `docs/`, `_archive/`, `my work/`: source/reference/knowledge/archive areas; they are not proven runtime modules.
