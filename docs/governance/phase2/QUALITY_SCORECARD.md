# Quality Scorecard

Status: Permanent scoring rubric for Phase 2 Golden Evaluation.

Total score: 100 points.

## Scoring Rules

- Score each metric from 0 to its maximum weight.
- Use direct repository evidence only.
- If evidence is missing, mark the metric `Blocked` and assign 0 until evaluated.
- A wave cannot be classified as `Improved` when any Critical metric newly fails.
- Do not compensate for unsupported claims with strong wording or formatting.

## Weighted Metrics

| Metric | Weight | Passing Threshold | Failure Threshold | Critical |
|---|---:|---:|---:|---|
| JD Alignment | 8 | 6 | 4 | Yes |
| Evidence Coverage | 8 | 6 | 4 | No |
| Evidence Traceability | 10 | 8 | 5 | Yes |
| Business Impact | 8 | 6 | 4 | No |
| Technical Depth | 8 | 6 | 4 | No |
| Narrative Consistency | 6 | 4 | 3 | No |
| Career Positioning | 6 | 4 | 3 | No |
| ATS Readiness | 6 | 4 | 3 | No |
| Hiring Manager Readability | 8 | 6 | 4 | No |
| HR Readability | 6 | 4 | 3 | No |
| Internal Terminology Leakage | 5 | 4 | 2 | No |
| Duplicate Content | 4 | 3 | 2 | No |
| Unsupported Claims | 8 | 7 | 4 | Yes |
| Repair Damage | 5 | 4 | 2 | Yes |
| Export Readiness | 4 | 3 | 2 | Yes |

## P8 Match and Opportunity Safety Gates

These are required gates around the stable 100-point CV score; they do not add
or reweight points.

| Gate | Passing rule |
|---|---|
| Requirement coverage | Every normalized JD requirement has one importance and one match status |
| Evidence safety | Direct/transferable support uses CV-eligible Evidence; transfer context is explicit |
| Gap separation | Learnable, core-capability, and formal-screening gaps remain distinct |
| Fit decision | Current capability, direct Evidence, transferability, ramp-up, screening risk, viability, priority, generation recommendation, and relative rank are present |
| Opportunity positioning | Medium Fit has win/lose/ramp/CV/interview analysis; Low Fit has credible overlap and transition guidance |
| Claim safety | Forbidden, unsupported, invalid-lineage, and CV-ineligible claims fail |

## Metric Definitions

### JD Alignment

Definition: The target role, summary, first-page evidence, skills, and work bullets align with the selected JD and Screening Analysis.

Measurement: Compare visible CV content against JD requirements, supported mappings, and effective Brief.

Example: A Power Platform JD should prioritize Power Platform delivery, governance, workflow automation, and stakeholder operations before unrelated AI chatbot evidence.

### Evidence Coverage

Definition: Must-show evidence and strongest selected grounded projects appear in visible CV sections.

Measurement: Count must-show evidence IDs represented in summary, skills, current-role bullets, prior-role bullets, or projects.

Example: If 10 must-show IDs exist and only 5 are visible, coverage is incomplete.

### Evidence Traceability

Definition: Major visible claims and bullets trace to valid EvidenceCard IDs or clearly source-backed records allowed by contract.

Measurement: Inspect `TailoredCv.workExperience[].subsections[].bullets[].evidenceIds` and reject mixed or invalid ID namespaces when the contract requires EvidenceCard IDs.

Example: The AI Evaluation CV had non-EvidenceCard IDs in bullet evidence arrays; this is a traceability failure.

### Business Impact

Definition: Bullets explain action, capability, stakeholder/scope, and business reason or outcome.

Measurement: Score the share of bullets with concrete scope, decision value, operational impact, metric, risk reduction, or stakeholder result.

Example: "Defined live A/B testing attribution and quality reporting logic so platform outcomes could be compared without mixing traffic sources" contains business impact.

### Technical Depth

Definition: Technical claims are specific, role-relevant, and within evidence boundaries.

Measurement: Check whether tools, systems, workflows, data logic, governance controls, validation methods, or platform details support the target role without overclaiming.

Example: Python validation of existing pipelines is acceptable; unsupported ML framework ownership is not.

### Narrative Consistency

Definition: The CV tells one coherent career story from target role through current role and prior roles.

Measurement: Check title, summary, first current-role subsection, skills, and prior-role compression for alignment.

Example: A CV targeting AI quality operations should not abruptly shift first-page focus to unrelated BI delivery.

### Career Positioning

Definition: The candidate is positioned credibly for the JD without hiding the real career arc or inventing unsupported identity.

Measurement: Compare target title, summary, role names, and role history against source-grounded profile and JD.

Example: Conservative repositioning away from a JD title can be acceptable when evidence does not support the exact title.

### ATS Readiness

Definition: Required keywords and section structure are present without keyword stuffing or unsupported terms.

Measurement: Compare top JD keywords, skills groups, target title, section headings, and text extractability.

Example: Missing must-have keywords with supported evidence is an ATS regression.

### Hiring Manager Readability

Definition: The first screen explains why the candidate can solve the manager's problem.

Measurement: Inspect summary plus first three current-role bullets for role-relevant problem, method, scope, and result.

Example: First bullets should answer "why interview this candidate for this JD".

### HR Readability

Definition: The CV is quickly scannable for recruiter needs: name, target role, location/contact, summary, skills, role history, and dates.

Measurement: Verify required visible sections and readable ordering.

Example: Missing email blocks full score even when the rest of the CV is strong.

### Internal Terminology Leakage

Definition: Internal-only names and jargon are translated, removed, or explained externally.

Measurement: Scan visible CV text for internal product/workflow names listed in analysis terminology and blocked terms.

Example: Internal tool names without external meaning reduce the score.

### Duplicate Content

Definition: Summary, bullets, repair notes, or sections do not repeat the same content unnecessarily.

Measurement: Compare summary sentences, bullet stems, repeated repair notes, and repeated claims.

Example: Repeated repair notes or duplicated summary positioning fail this metric.

### Unsupported Claims

Definition: The CV does not present unsupported JD requirements as solved strengths.

Measurement: Compare visible claims against supported evidence and unsupported/weak mappings.

Example: Claiming advanced MLOps ownership without evidence is a critical failure.

### Repair Damage

Definition: Review or repair does not degrade previously good content, reorder evidence away from JD priority, duplicate text, or rewrite green areas.

Measurement: Diff pre-repair and post-repair CVs against failed zones and quality metrics.

Example: Broad local repair that promotes off-JD evidence above direct JD evidence is repair damage.

### Export Readiness

Definition: The final CV is ready for submission after local export checks and, when available, rendered artifact verification.

Measurement: Verify contact, section order, text content, target role, length proxy, and rendered/PDF checks when available.

Example: A CV with no email or unverified rendered text layer cannot receive full score.
