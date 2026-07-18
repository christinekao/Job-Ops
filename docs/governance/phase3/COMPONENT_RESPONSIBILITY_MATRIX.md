# Component Responsibility Matrix

Status: Design only.

## Responsibility boundaries

| Component role | Inputs | Allowed responsibility | Forbidden responsibility |
|---|---|---|---|
| Workflow State Resolver | run identity, CV hash, validation results, approval state | Resolve one user-visible workflow state and primary CTA key | Render reviewer details; generate repair prose; invoke export |
| OverallStatus | resolved workflow state | Render current state and concise reason | Render fix instructions or any repair CTA |
| ReviewSummary | normalized reviewer/export checks | Group cards as PASS, WARNING, BLOCKING; show reviewer/result/reason | Explain how to repair; trigger repair/export |
| RepairPlanner | blocking checks, repair classification, CV/evidence context | Produce repair targets, expected edits, safety/approval class, impact | Apply repair; render review summary; decide export readiness |
| RepairPlan | repair proposal | Render plan and exactly one primary repair/approval CTA | Render prior repair result or export CTA |
| RepairExecutor | approved/safe repair plan | Execute bounded repair, preserve invariants, record before/after identities | Reclassify reviewer findings; decide final export |
| RepairResult | executed repair receipt + validation | Render changed, unchanged, content hash, remaining blockers | Re-show proposed plan; retry automatically |
| ExportDecision | export contract checks and current CV hash | Render exact blockers or exactly one `Export CV` CTA | Offer repair alternatives or modify CV |
| Diagnostics Drawer | raw run/snapshot metadata | Show optional technical detail | Become the normal user workflow |

## Existing component migration intent

| Existing concern | Current evidence | Target owner |
|---|---|---|
| `ReviewerBlockerTriage` mixes red meaning, repair scope, result, and actions | `screeningLabPanels.tsx` | Split into ReviewSummary, RepairPlan, RepairResult |
| `CheckStatusSummary` mixes pass/fail reporting and next-step CTA | `screeningLabPanels.tsx` | ReviewSummary only; CTA selected by Workflow State Resolver |
| `RepairActionPanel` includes a repair checklist next to review data | `screeningLabPanels.tsx` | RepairPlan only |
| Reviewer/export panels both render check lists, blockers, and repair controls | `ScreeningLab.tsx` | ReviewSummary + ExportDecision without duplication |
| Export page re-computes quality and routes back to editor | `Export.tsx` | ExportDecision consumes one normalized export-readiness result |

## Contract rule

No component may call a function from another responsibility category directly. The orchestration container may compose outputs, but it must not duplicate their content or create an extra primary CTA.

