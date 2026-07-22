# Quality Metrics

Status: Permanent metric definitions for Golden Evaluation.

These metrics are quality measures, not engineering test commands. They may be evaluated manually, by deterministic scripts, or by future approved evaluators, but the definitions must remain stable across waves.

## Metric Table

| Metric | Definition | Measurement | Weight | Passing | Failure | Example |
|---|---|---|---:|---:|---:|---|
| JD Alignment | CV content matches the selected JD and effective Brief | Target role, summary, first current-role bullets, skills, and must-have keywords align with supported JD mappings | 8 | 6 | 4 | Power Platform JD prioritizes Power Platform evidence before chatbot evidence |
| Evidence Coverage | Must-show and strongest selected evidence is visible | Percent of must-show evidence IDs represented in visible CV | 8 | 6 | 4 | 8/10 must-show IDs visible is acceptable; 5/10 is weak |
| Evidence Traceability | Claims trace to valid evidence | Bullet evidence IDs are valid and no invalid namespace is used where EvidenceCard IDs are required | 10 | 8 | 5 | Mixed skill/story/domain IDs in bullet evidence arrays fail |
| Business Impact | Bullets show why the work mattered | Share of bullets with stakeholder/scope/outcome/risk/decision impact | 8 | 6 | 4 | A/B attribution bullet explains comparable platform outcomes |
| Technical Depth | Technical detail is specific and supported | Tools, workflows, controls, validation methods, and system details are present without overclaiming | 8 | 6 | 4 | Python validation is framed as validation, not ML ownership |
| Narrative Consistency | Sections tell one coherent role story | Header, summary, skills, current role, and prior roles support the same positioning | 6 | 4 | 3 | Targeting AI quality while first bullets discuss unrelated BI is inconsistent |
| Career Positioning | Target identity is credible and source-grounded | Title and summary neither underfit nor overclaim source evidence | 6 | 4 | 3 | Adjacent role title is acceptable when exact JD title is unsupported |
| ATS Readiness | ATS-facing terms and structure are present | Required keywords, section names, target role, and skills are visible and extractable | 6 | 4 | 3 | Supported must-have keywords appear in summary/skills/work bullets |
| Hiring Manager Readability | First-page story gives interview reason | Summary and first bullets answer manager problem with evidence | 8 | 6 | 4 | First bullets connect workflow controls to manager pain points |
| HR Readability | Recruiter can scan essentials quickly | Name, email, location, target, summary, skills, dates, and sections are visible | 6 | 4 | 3 | Empty email prevents full score |
| Internal Terminology Leakage | Internal names are externalized | Visible text is checked against terminology/blocked terms | 5 | 4 | 2 | Company-only workflow names are translated or removed |
| Duplicate Content | Content is not repeated unnecessarily | Summary, bullets, repair notes, and section themes are deduplicated | 4 | 3 | 2 | Duplicate summary sentences or repeated repair notes fail |
| Unsupported Claims | No unsupported requirements are claimed | Visible claims are compared to evidence and unsupported/weak mappings | 8 | 7 | 4 | Unsupported ML framework ownership is a critical failure |
| Repair Damage | Repair does not harm previously good content | Pre/post-repair diff is limited to failed zones and improves target metrics | 5 | 4 | 2 | Repair must not rewrite green sections or promote off-JD evidence |
| Export Readiness | Final artifact is submit-ready | Local export checks plus rendered/PDF checks when available | 4 | 3 | 2 | Missing contact or broken text layer fails |

## Measurement Levels

| Level | Meaning |
|---|---|
| Full | Metric is measurable from current artifacts and source evidence |
| Partial | Some required artifacts are missing; score only confirmed evidence |
| Blocked | Required artifacts are absent; mark score 0 and explain |

## P8 Match and Opportunity Measures

| Measure | Required output |
|---|---|
| Requirement coverage | Count and percentage classified exactly once |
| Direct Evidence fit | Importance-weighted direct matches with eligible Evidence |
| Transferability | Importance-weighted transferable matches with explicit transfer context |
| Gap profile | Separate counts/weights for learnable, core-capability, and formal-screening gaps |
| Application viability | Classification, priority, generation recommendation, manual-override state, and deterministic rank |
| Medium opportunity | Why the candidate could win/lose, time-to-credibility, CV positioning, interview proof, and gap mitigation |
| Low transition | Credible overlap, why core fit is low, no-generation reason, and future transition path |

## Current Known Baseline Risks

These are not permanent scores; they are known baseline risks from Phase 2 evidence:

| Risk | Evidence | Confidence |
|---|---|---|
| Missing traceability | Persisted CVs contain five bullets without evidence IDs | Confirmed |
| Invalid evidence namespaces | AI Evaluation CV contains non-EvidenceCard IDs in bullet evidence arrays | Confirmed |
| Missing contact | AI Evaluation CV has empty email | Confirmed |
| Repair damage | Power Platform CV has broad local repair rewriting and duplicate notes | Confirmed |
| Export proxy gap | Export readiness checks do not prove rendered 1.5-2 page PDF quality | Confirmed |

## Metric Stability Rule

Do not change weights or thresholds during a wave review. If the quality spec changes, update this file before the next wave begins and start a new baseline.
