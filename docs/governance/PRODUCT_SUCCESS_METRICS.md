# Product Success Metrics

Status: Product metric definitions. Targets are not current measured results.

## Measurement Rules

- Record baseline, target, sample, date range, and source for every reported metric.
- Separate deterministic fixture measurements from live-user/product telemetry.
- Never treat a lower click/run count as success if evidence integrity, user approval, or export safety regresses.
- Measure per JD/content identity where applicable; timestamp-only/view changes must not count as reruns.

| Metric | Definition | Source / measurement | Baseline | Target direction | Guardrail |
|---|---|---|---|---|---|
| Time to First CV | Elapsed time from explicit Generate CV to first validated CV result | Workflow event timestamps | To establish | Lower | No skipped validation |
| Clicks to Export | User progression clicks from JD-ready to normal export decision | UX event log / test walkthrough | Design estimate 20–40 current, 3–5 target; unmeasured | Lower | Excludes explicit approvals and optional diagnostics |
| Average AI Runs per JD | Token-spending automation starts per JD content identity | Automation records | To establish | Lower | Must not increase manual error/blockers |
| Average Repair Runs | Repair automation starts per CV content identity | Action/repair receipts | To establish | Lower | Safe repair remains bounded and evidence-safe |
| Review Iterations | Distinct validation cycles before allowed export | Review/export action receipts | To establish | Lower | No hidden blocker bypass |
| Workflow Convergence | Share of started workflows reaching Ready/Export Ready without repeated same-hash action | Workflow/action receipts | To establish | Higher | Same-hash repeat is counted as a failure signal |
| Golden Evaluation Score | Weighted score under Phase 2 quality metrics | Scorecard per representative fixture | To establish | Higher | Critical metrics cannot regress |
| JD Coverage | Supported selected JD requirements visibly addressed where appropriate | Gate/Brief/quality diagnostics | To establish | Higher | Unsupported requirements must not be forced |
| Evidence Coverage | Must-show/selected evidence represented in visible CV | Evidence priority + output traceability | To establish | Higher | Valid EvidenceCard namespace required |
| Evidence Traceability | Visible bullets with valid evidence support | Writer-output/reviewer fixtures | Existing deterministic safeguard | Maintain/improve | Critical: invalid/missing traceability blocks acceptance |
| Hiring Manager Score | Manager-readability/relevance assessment from defined rubric | Golden Evaluation / manager review | To establish | Higher | Does not replace claim integrity |
| HR Readability | Recruiter scan of contact, structure, target, skills, and sections | Export/reviewer checks + rubric | To establish | Higher | Contact/export failures remain blocking |
| ATS Prediction | Clearly labeled proxy of ATS-visible coverage and extractability | Gate/export diagnostics | To establish | Higher | Never presented as a real ATS score without external validation |
| User Satisfaction | User-reported confidence, clarity, and perceived control | Lightweight survey/interview | To establish | Higher | Segment by successful/blocked workflow outcome |
| Action Clarity | Share of users who can state current status, blocker, and next action | Usability task | To establish | Higher | Must include failure/recovery cases |
| Token Cost per Export-Ready CV | Estimated/actual AI token use until current hash reaches export-ready state | Automation/run records | To establish | Lower | Quality and approval guardrails must pass |

## Reporting Cadence

1. Planning/design waves: define or validate metrics only.
2. Implementation waves: report deterministic regression and any available instrumentation.
3. Product-experience waves: establish baseline before making target claims.
4. Quality waves: use Golden Evaluation comparison rules.
5. Autonomous/platform waves: add safety, recovery, and consent metrics before scaling.
