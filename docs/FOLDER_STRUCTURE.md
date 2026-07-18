# CV Builder Folder Structure

Last updated: 2026-07-06

## Current official entrypoints

| Path | Purpose |
| --- | --- |
| `CV_Manager_React/` | Current React CV/job-search OS app. Use this for active product work. |
| `CAREER_OS/` | Human-readable Career Operating System knowledge base: positioning, background, evidence, master CV, target roles, JD analysis, interview stories, tracker, feedback loop. |
| `CV_Manager_React/server.cjs` | React app local JSON API + Codex CLI automation server. |
| `Christine_CV_Manager.html` | Legacy single-file CV Manager. Keep as reference / fallback. |
| `cv_manager_server.py` | Legacy single-file manager local JSON + AI proxy server. |
| `resume_templates.html` | Standalone resume template playground. |
| `data/` | Legacy single-file manager persisted data. |
| `cv_manager_data.json` | Legacy snapshot / migration fallback. Do not delete casually. |

## Source material

| Path | Purpose |
| --- | --- |
| `CV/` | Original PDF CV files. |
| `my work/` | User-provided raw career source documents. Keep stable because prompts and rebuild notes may reference exact paths. |
| `CV_Manager_React/source_material/` | Source text bundles used by the React app rebuild/import scripts. |

## React app structure

| Path | Purpose |
| --- | --- |
| `CV_Manager_React/src/` | React source code. |
| `CV_Manager_React/src/components/tabs/` | Main workspace tabs. |
| `CV_Manager_React/src/components/shared/` | Shared cards, status panels, editors, and context UI. |
| `CV_Manager_React/src/components/cv/` | CV preview, editor, export, and layout diagnostics. |
| `CV_Manager_React/src/data/` | Pure data reconciliation / hash / selection logic. |
| `CV_Manager_React/src/config/` | Navigation and configuration. |
| `CV_Manager_React/data/` | Active React app JSON data. |
| `CV_Manager_React/scripts/` | Maintenance / rebuild scripts. |
| `CV_Manager_React/modes/` | Career-ops style mode prompts. |
| `CV_Manager_React/templates/` | Config templates. |
| `CV_Manager_React/docs/` | React app architecture/spec docs. |

## Archive

| Path | Purpose |
| --- | --- |
| `_archive/cv-manager-prototypes/` | Old single-file CV Manager prototypes and backups. Not active entrypoints. |
| `_archive/reference-cv-html/` | Old CV HTML reference files. |
| `_archive/generated-junk/` | Non-source generated cache or accidental empty files moved out of root. |

## Generated / ignored folders

| Path | Purpose |
| --- | --- |
| `CV_Manager_React/node_modules/` | Installed dependencies. Ignored by git. |
| `CV_Manager_React/dist/` | Vite build output. Ignored by git. |
| `CV_Manager_React/reports/` | Generated reports. Ignored except `.gitkeep`. |
| `CV_Manager_React/output/` | Generated output files. Ignored except `.gitkeep`. |
| `CV_Manager_React/logs/` | Local logs. Ignored except `.gitkeep`. |
| `exports/` | Legacy export output. Ignored by git. |

## Rule

New active work should go into `CV_Manager_React/`. Old prototypes should go into `_archive/`, not the root folder.
