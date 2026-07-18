Status: DRAFT
Authority: REFERENCE
Can Authorize Production Implementation: NO
Does Not Override: docs/architecture/CURRENT_ARCHITECTURE.md
Reason for Draft Status: Contract index does not record an independent approval.
Required Decision Before Activation: Explicit contract approval.

# Contract: Evidence Selection

Owner:

- `CV_Manager_React/src/data/selection.ts`
- Key symbols: `selectionDiagnostics`, `buildCvGenerationSelectionPatch`, `cvInputReadiness`, `cleanSelectionPatch`

## Input

- `AppData.skillInferences`
- `AppData.domainKnowledge`
- `AppData.evidenceCards`
- `AppData.starStories`
- selected `JobApplication`
- `job.screeningAnalysis` or `job.fitReview`

## Output

Selected IDs stored on `JobApplication`:

- `selectedSkillIds`
- `selectedDomainKnowledgeIds`
- `selectedEvidenceIds`
- `selectedStoryIds`
- `recommendationsAppliedAt`

Diagnostics:

- invalid selected IDs
- selected object lists
- readiness counts

## Minimums

Current code defines `CV_GENERATION_MINIMUMS`:

- skills: 8
- domainSignals: 3
- evidence: 12
- starStories: 4
- currentRoleEvidence: 8
- priorRoleEvidence: 2

Confidence: Confirmed.

## Contract Rules

- Selected IDs must exist in current app data.
- CV-visible evidence must not be `Archive`, `Interview Only`, `Prompt Context Only`, `Do Not Use`, or `Do Not Claim`.
- Evidence selection should prefer grounded, JD-relevant, current-role evidence but preserve career arc with prior-role evidence when available.
- Selected skill/domain/evidence/story records must preserve their stored selected-ID order.
- Effective Writer/repair evidence priority is effective Brief must-show IDs followed by remaining selected evidence IDs.
- Global app-data array order must not replace selection priority.
- `evidenceSelectionQualityDiagnostics` reports top-requirement coverage, evidence with metrics, evidence with tools, and current/prior role allocation without changing runtime data.

## Known Gaps

- Tests for preserving selected ID validity after Backbone ID replacement were not re-run in this phase.
- `npm run smoke:wave1-context` covers selected order and quality-allocation diagnostics for the Wave 1 contract.
