# ADR-004 Wave 1 Acceptance Run

Run ID: `ADR_004_W1_ACCEPTANCE_RUN_001`  
Generated at: `2026-07-17T00:00:00.000Z`  
Scope: acceptance execution only. No production code, prompt, reviewer, repair, export, or persistence changes were made.

## Executive Summary

Wave 1 achieved the core positioning-policy behavior, but the acceptance run does not fully pass.

All three fresh CVs were generated and persisted with complete pipeline artifacts. Writer behavior followed `ScreeningAnalysis` positioning, and no visible unsupported claims were detected in any generated CV.

The Azure Weak Fit case improved materially: the generated CV no longer presents the candidate as a direct Azure Solution Specialist, does not invent Azure sales ownership, quota ownership, or deal ownership, and uses transferable Microsoft ecosystem enablement positioning.

However, the run still produced export/review blockers outside unsupported-claim fabrication:

- Case A Good Fit: reviewer flagged external wording issues and export blocked on missing trusted contact email.
- Case B Risky Fit: reviewer flagged supported keyword gaps, weak mappings, external wording issues, and missing trusted contact email.
- Case C Weak Fit: reviewer/export still blocked on real fit weakness plus missing trusted contact email.

Because the success criteria require remaining review/export failures to be caused by genuine capability gaps rather than other quality or data blockers, this run returns:

Final verdict: `REVISE WAVE 1`

## Artifact Locations

Base artifact directory:

`docs/acceptance/artifacts/ADR_004_W1_ACCEPTANCE_RUN_001_20260717T000000Z/`

Manifest:

`docs/acceptance/artifacts/ADR_004_W1_ACCEPTANCE_RUN_001_20260717T000000Z/run_manifest.json`

Each case contains:

1. `01_jd.json`
2. `02_analysis.json`
3. `03_evidence_selection.json`
4. `04_cv_brief.json`
5. `05_writer_context.json`
6. `06_generated_cv.json`
7. `06_generated_cv.md`
8. `07_review_snapshot.json`
9. `08_repair_result.json`
10. `09_export_decision.json`
11. `10_product_validation.json`

## Case A — Good Fit

- Job: `jd-mpy6kou0-ctiw9`
- Source role: `Power Platform Developer`
- Generated target role: `Power Platform Developer`
- Overall Fit: `Good`
- Apply Tier: `Good`
- Generated CV: `docs/acceptance/artifacts/ADR_004_W1_ACCEPTANCE_RUN_001_20260717T000000Z/case-a-good-fit/06_generated_cv.md`

### Product Validation

1. Does Writer follow Analysis positioning? `YES`
2. Unsupported claims present? `NO`
   - Count: `0`
3. Truthful capability gaps clearly communicated? `YES`
4. Positioning Report matches generated CV? `YES`
5. Defensible during a real interview? `YES`
   - Visible claims are tied to selected grounded evidence and unsupported direct-fit claims are omitted or softened.

### Review / Repair / Export

- Reviewer Ready: `NO`
- Gate issue count: `1`
- Export Ready: `NO`
- Export status: `blocked`
- Repair route: `review-ai-proposals`

Export blockers:

- `Reviewer: external wording: 3 work-log bullet(s)`
- `Contact extraction: Missing name, email, or location`
- `Contact email: Missing email`

Interpretation:

The positioning policy worked. The failure is not unsupported role inflation. The remaining blockers are wording polish and missing trusted profile contact data.

## Case B — Risky Fit

- Job: `jd-mq3ozq5b-mhtmy`
- Source role: `AI Evaluation Scientist`
- Generated target role: `AI Evaluation Operations Specialist`
- Overall Fit: `Risky`
- Apply Tier: `Stretch`
- Generated CV: `docs/acceptance/artifacts/ADR_004_W1_ACCEPTANCE_RUN_001_20260717T000000Z/case-b-risky-fit/06_generated_cv.md`

### Product Validation

1. Does Writer follow Analysis positioning? `YES`
2. Unsupported claims present? `NO`
   - Count: `0`
3. Truthful capability gaps clearly communicated? `YES`
4. Positioning Report matches generated CV? `YES`
5. Defensible during a real interview? `YES`
   - The CV is defensible as AI evaluation operations, not as unsupported ML research / framework-heavy scientist ownership.

### Review / Repair / Export

- Reviewer Ready: `NO`
- Gate issue count: `2`
- Export Ready: `NO`
- Export status: `blocked`
- Repair route: `review-ai-proposals`

Export blockers:

- `Reviewer: HR scan: 6 covered keyword(s), 6 supported keyword gap(s)`
- `Reviewer: weak claims controlled: 4 weak mapping(s)`
- `Reviewer: external wording: 2 work-log bullet(s)`
- `Contact extraction: Missing name, email, or location`
- `Contact email: Missing email`
- `ATS keyword support: 6 covered; 6 supported gap(s)`

Interpretation:

The Risky positioning policy worked: direct unsupported scientist claims were avoided. The remaining blockers are keyword coverage, weak mapping risk, wording polish, and missing trusted profile contact data.

## Case C — Weak Fit / Azure Solution Specialist

- Job: `jd-mriv6lu5-9t2l0`
- Source role: `Azure Solution Specialist`
- Generated target role: `Microsoft Ecosystem Solution Enablement Specialist`
- Overall Fit: `Weak`
- Apply Tier: `Avoid`
- Generated CV: `docs/acceptance/artifacts/ADR_004_W1_ACCEPTANCE_RUN_001_20260717T000000Z/case-c-weak-fit-azure/06_generated_cv.md`

### Product Validation

1. Does Writer follow Analysis positioning? `YES`
2. Unsupported claims present? `NO`
   - Count: `0`
3. Truthful capability gaps clearly communicated? `YES`
4. Positioning Report matches generated CV? `YES`
5. Defensible during a real interview? `NO`
   - The CV is defensible for transferable Microsoft ecosystem enablement.
   - It is not defensible as direct Azure Solution Specialist sales ownership because `ScreeningAnalysis` records material capability gaps.

### Weak Fit Checks

- No fabricated Azure sales ownership: `PASS`
- No invented quota ownership: `PASS`
- No invented deal ownership: `PASS`
- Transferable experience emphasized: `PASS`
- Positioning Report explains remaining capability gaps: `PASS`
- Review/export failure due to unsupported wording inflation: `NO`
- Review/export failure due to genuine fit/capability gaps: `YES`, plus missing trusted contact email.

### Review / Repair / Export

- Reviewer Ready: `NO`
- Gate issue count: `1`
- Export Ready: `NO`
- Export status: `blocked`
- Repair route: `review-ai-proposals`

Export blockers:

- `Reviewer: weak claims controlled: 4 weak mapping(s)`
- `Reviewer: action/outcome bullets: 5/8 action-oriented bullet(s)`
- `Contact extraction: Missing name, email, or location`
- `Contact email: Missing email`

Interpretation:

This is the primary acceptance target. Wave 1 succeeds on truthful positioning and prevents the prior Azure sales overclaim failure mode. The export remains blocked because the candidate still has real capability gaps for the Azure Solution Specialist role, and because trusted contact data is missing from the profile.

## Before vs Current Observations

| Stage | Before ADR-004 Wave 1 | Current Acceptance Run |
|---|---|---|
| Analysis | Could classify Azure as `Avoid`, but downstream Writer still maximized direct fit. | Analysis remains authority; Positioning Report is derived from `ScreeningAnalysis`. |
| Evidence Selection | Evidence could still be pushed toward unsupported direct role claims. | Selection is carried into CV Brief and Writer Context with claims-to-avoid visible. |
| CV Brief | Did not consistently force transferable positioning for Weak/Avoid. | Brief includes Positioning Report-derived claims-to-avoid and conservative target positioning. |
| Writer | Tried to maximize fit for the exact JD role. | Generates strongest truthful CV within evidence boundaries. |
| Generated CV | Azure case risked unsupported Azure sales / quota / deal language. | Azure case uses transferable Microsoft ecosystem enablement and avoids those claims. |
| Reviewer | Blocked unsupported wording after the fact. | Still blocks quality/export issues, but unsupported visible claims were reduced to zero in this run. |
| Repair | Could loop against wording caused by Writer over-positioning. | Repair still needed, but blockers are quality/contact/fit-gap related, not fabricated Azure sales wording. |
| Export | Blocked due unsupported positioning in prior Azure case. | Still blocked, but current Azure block is fit/quality/contact related, not wording inflation. |

## Acceptance Evidence

### New CVs Generated

- Case A: `docs/acceptance/artifacts/ADR_004_W1_ACCEPTANCE_RUN_001_20260717T000000Z/case-a-good-fit/06_generated_cv.md`
- Case B: `docs/acceptance/artifacts/ADR_004_W1_ACCEPTANCE_RUN_001_20260717T000000Z/case-b-risky-fit/06_generated_cv.md`
- Case C: `docs/acceptance/artifacts/ADR_004_W1_ACCEPTANCE_RUN_001_20260717T000000Z/case-c-weak-fit-azure/06_generated_cv.md`

### Unsupported Claims

All three cases reported:

- Unsupported claim count: `0`

### Positioning Report Reflection

All three cases reported:

- Positioning Report matches generated CV: `YES`

### Azure-Specific Evidence

Azure generated target role:

`Microsoft Ecosystem Solution Enablement Specialist`

This confirms the Writer did not force the unsupported source JD title as the visible CV positioning.

Azure visible CV positioning emphasizes:

- Microsoft 365 Copilot adoption analytics
- Power Platform governance
- SharePoint-backed process support
- stakeholder-ready operating visibility
- technical handoff
- production support

Azure visible CV does not claim:

- Azure sales ownership
- quota ownership
- deal ownership
- Azure architecture ownership
- executive sales ownership

## Remaining Issues

1. Missing trusted contact data

   `careerProfile.contact` currently has empty `name`, `email`, and `location` values. The generated CV can ground name/location from profile/source text, but no trusted email was found in `rawSources`. Export correctly blocks missing email.

2. Good Fit still has wording polish blockers

   Case A should be closest to a clean pass, but reviewer still flagged `3 work-log bullet(s)`. That means Writer output quality is not fully acceptance-ready even when positioning is correct.

3. Risky Fit still has supported keyword gaps

   Case B avoided unsupported claims, but did not cover all evidence-supported keywords expected by the review gate.

4. Weak Fit Azure still has real fit risk

   This is expected. The important result is that the remaining issue is truthful capability gap / fit risk, not fabricated Azure sales positioning.

## Final Recommendation

`REVISE WAVE 1`

Reason:

Wave 1 successfully fixes the central truthfulness problem for the Azure Weak Fit case, but the full acceptance run does not satisfy all success criteria. Fresh artifacts show no unsupported claims, but review/export failures remain for non-gap quality blockers and missing trusted contact data. Before Wave 1 can be accepted, the product should either:

- improve Writer output enough for Good/Risky cases to pass review when evidence supports the role, or
- explicitly classify contact-data absence and reviewer wording polish as non-ADR acceptance blockers with separate ownership.

Do not proceed to Wave 2 based on this run alone.
