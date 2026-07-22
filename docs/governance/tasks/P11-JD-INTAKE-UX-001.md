# P11-JD-INTAKE-UX-001 — JD Intake Field Workflow and Layout Remediation

Status: DONE

## Model Routing

- Selected AI: Codex
- Model: GPT-5.6 Terra
- Reasoning: Medium
- Reason: Bounded responsive UI remediation with regression protection for existing URL/manual intake, identity, persistence, and Golden behavior.
- Escalation trigger: Stop only if repository evidence shows the requested layout requires changing an approved production data or identity contract.

## Objective

Group and align the existing JD Intake fields, clarify empty field states,
format Date posted for display without changing its stored value, and make
Employer Insights a full-width collapsed disclosure.

## Scope

- Reuse existing `Field`, `Textarea`, panel, and responsive CSS patterns.
- Add Core Job Information, Work Details, Job Description, Qualifications,
  Compensation and Application, Imported Source Insights, and AI Analysis
  presentation sections.
- Use 3/2/1 responsive columns for short fields and paired rows for textareas.
- Add non-persisted placeholders/helper text.
- Preserve complete editable values and all P8/P9/P10 owners/contracts.

## Allowed Files

- `CV_Manager_React/src/components/tabs/JDIntake.tsx`
- `CV_Manager_React/src/components/ui/primitives.tsx`
- `CV_Manager_React/src/styles.css`
- JD Intake layout/regression/E2E tests and package script
- P11 and directly related governance completion/roadmap/registry records

## Forbidden

- Data model, storage, hash, staleness, Screening/Fit, Writer, extractor, runtime data, Git, or push changes
- Automatic Save, Parse, Screening, Writer, or AI
- Reopening P8, P9, or P10

## Acceptance Criteria

- [x] Fail-first proves missing semantic sections, empty-state guidance, readable date presentation, and full-width collapsed Insights.
- [x] Desktop/tablet/mobile short-field grids are 3/2/1 columns.
- [x] Paired textareas align initially without content clipping.
- [x] Employer Insights is full-width, collapsed by default, and two-column when expanded.
- [x] Placeholders/helper text never enter state, persistence, identity, or prompts.
- [x] Role, Location, Overview, and Compensation retain complete values.
- [x] Manual Paste, URL Import, persistence, staleness, Golden, no-AI, system, and Product Acceptance regressions pass.
- [x] Documentation closes P11 as DONE and READY count returns to zero.

## Completion Evidence

- Fail-first `smoke:jd-intake-layout` failed on the missing required section
  order before the production layout changed, then passed after remediation.
- `smoke:jd-intake-layout`, `smoke:jd-intake-regression`,
  `smoke:jd-url-import`, `e2e:jd-import-compat`, and build passed.
- Persistence/recovery, staleness, Golden, Writer, Reviewer, Repair, Export,
  product acceptance, no-AI, and full system regressions passed.
- Browser no-AI passed 1/1 and Product Acceptance E2E passed 13/13.
- No production data, extraction, identity, hash, staleness, Screening, Golden,
  Writer, or automatic action contract changed.

## Rollback

Restore the previous single presentation grid. No data migration is required
because this task does not alter the production model or stored values.
