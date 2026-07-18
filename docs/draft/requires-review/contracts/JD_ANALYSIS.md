Status: DRAFT
Authority: REFERENCE
Can Authorize Production Implementation: NO
Does Not Override: docs/architecture/CURRENT_ARCHITECTURE.md
Reason for Draft Status: Contract index identifies this as draft/reference material.
Required Decision Before Activation: Explicit contract approval.

# Contract: JD Analysis

Owner:

- Runtime prompt: `CV_Manager_React/src/promptBuilders.ts` `buildScreeningAnalysisPrompt`
- Runtime type: `CV_Manager_React/src/types.ts` `ScreeningAnalysis`
- Apply path: `CV_Manager_React/src/components/tabs/ScreeningLab.tsx` `applyScreeningAnalysisResult`

## Input

| Field | Source | Required | Confidence |
|---|---|---:|---|
| selected job | `JobApplication` | yes | Confirmed |
| parsed/raw JD | `job.parsed` or `job.rawJD` | yes | Confirmed |
| career profile | `AppData.careerProfile` | yes | Confirmed |
| source of truth | `AppData.sourceOfTruth` | yes | Confirmed |
| skills/domain/evidence/stories | `AppData.skillInferences`, `domainKnowledge`, `evidenceCards`, `starStories` | yes | Confirmed |
| Market JD references | `rawSources.kind === "Market JD Reference"` | optional | Confirmed |

## Output

Expected `ScreeningAnalysis` fields include:

- `primaryTargetTitle`
- `jdBreakdown`
- `positioning`
- `managerIntent`
- `marketReferenceSignals`
- `jdEvidenceMapping`
- `internalTerminology`
- `remainingGaps`
- `qualityTargets`
- `mustHaveKeywords`
- `supportingKeywords`
- `missingKeywords`
- `riskyClaims`
- recommended skill/domain/evidence/story IDs

## Contract Rules

- Return raw valid JSON only.
- Do not invent IDs.
- Do not infer market references unless sources are included.
- Mark unsupported requirements as gaps; do not hide them.
- Internal terminology must translate project/system/process terms into external-friendly wording.

Evidence: `buildScreeningAnalysisPrompt` schema and rules.

Confidence: Confirmed.

## Known Gaps

- Runtime validation against the full `ScreeningAnalysis` contract was not confirmed.
- Human approval is still needed for how much inferred manager intent is acceptable.
