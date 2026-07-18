Status: DRAFT
Authority: REFERENCE
Can Authorize Production Implementation: NO
Does Not Override: docs/architecture/CURRENT_ARCHITECTURE.md
Reason for Draft Status: The source ADR status is Proposed; implementation evidence does not constitute approval.
Required Decision Before Activation: Owner approval, rejection, or formal supersession.

# ADR-004 - Truthful Positioning Policy

Status: Proposed

Date: 2026-07-17

AI: Codex

Model: GPT-5.6 Sol

Reasoning: High

Scope: Product decision policy and related contracts only. No architecture redesign, runtime pipeline change, reviewer scoring change, persistence change, or production implementation is authorized by this ADR.

Note: `docs/governance/DECISIONS.md` already contains a governance ADR-004 for Root AGENTS.md Governance Entry. This ADR uses the user-requested file name and path as a product-policy ADR. A later governance cleanup may renumber or index ADR families separately.

## Context

`docs/governance/architecture/ARCH_VERIFY_001_REPORT.md` concluded that the current architecture and pipeline are fundamentally correct. The Azure Solution Specialist case completed CV generation, reached Review/Export Gate, and was blocked because the available evidence did not support the strongest role positioning being claimed.

The current product interpretation lets Analysis classify a JD as `Avoid`, while Writer still attempts to maximize fit for the exact target role. In weak-fit cases, this can produce wording that looks like direct qualification for unsupported requirements. Reviewer and Repair then correctly reject the wording, but too late in the user journey.

The policy problem is not that weak-fit CV generation occurs. The policy problem is that the Writer must maximize interview probability without crossing evidence boundaries.

## Decision

The system must always generate the strongest truthful CV possible for the selected JD.

Generation is never blocked by fit classification. Export may still be blocked by reviewer quality rules.

Fit tier is a positioning strategy signal, not a generation permission gate.

## Truthfulness Principle

The system must not:

- fabricate experience
- exaggerate experience
- infer unsupported ownership
- rewrite weak or transferable evidence into a direct claim
- convert a capability gap into a solved strength

The system may:

- select the strongest supported evidence
- use external recruiter-friendly wording
- position adjacent or transferable capabilities
- state credible business value where evidence supports it
- explain remaining gaps plainly

The objective is:

```text
Maximize interview probability without exceeding available evidence.
```

## Positioning Strategy

Writer must treat Screening Analysis as the source of truth for JD requirements, evidence support, gaps, risky claims, and safest positioning.

When direct evidence exists, Writer should position directly.

When only partial evidence exists, Writer should position adjacent strengths and make the gap visible.

When direct evidence is missing, Writer should shift toward transferable capabilities instead of trying to sound qualified for unsupported requirements.

For the Azure Solution Specialist class of case, this means Writer may emphasize Microsoft ecosystem adoption, Copilot analytics, Power Platform governance, stakeholder coordination, and solution enablement only where supported. Writer must not invent quota ownership, Azure sales ownership, enterprise deal ownership, executive relationship ownership, formal solution-specialist title ownership, Azure architecture delivery, or cloud migration leadership.

## Fit Tier Behavior

| Fit tier | Generation behavior | Required explanation | Export behavior |
|---|---|---|---|
| Good Fit | Generate CV normally and maximize supported strengths. | Explain strongest supported match. | Export may proceed only if reviewer/export checks pass. |
| Risky Fit | Generate CV with truthful wording. | Generate a Risk Summary explaining missing or weak evidence and recommended positioning adjustments. | Export may be blocked by reviewer rules if risk affects readiness. |
| Weak Fit / Avoid | Generate CV; do not refuse generation. | Explicitly identify unsupported requirements, transferable strengths, recommended positioning, and remaining hiring risks. | Export may remain blocked if the CV cannot be made manager-ready without unsupported claims. |

`Avoid` does not mean "do not generate." It means "do not pretend direct fit." The strongest valid output is a truthful transferable-positioning CV plus a clear explanation of why interview probability is reduced.

## Structured Positioning Report

Add a structured Positioning Report as informational output. It does not prevent CV generation and does not replace Review/Export Gate.

Recommended schema:

```json
{
  "overallFit": "Good|Risky|Weak",
  "transferableStrengths": [
    {
      "strength": "",
      "evidenceIds": [],
      "supportLevel": "Strong|Partial|Weak",
      "cvTreatment": "state-directly|position-as-transferable|soften|interview-only"
    }
  ],
  "unsupportedRequirements": [
    {
      "requirement": "",
      "reason": "",
      "riskLevel": "High|Medium|Low",
      "mustNotClaim": []
    }
  ],
  "recommendedPositioning": {
    "headline": "",
    "summaryAngle": "",
    "targetRoleTreatment": "direct-fit|adjacent-fit|transferable-fit|not-recommended",
    "wordingGuidance": []
  },
  "remainingRisks": [
    {
      "risk": "",
      "impactOnInterviewProbability": "",
      "mitigation": ""
    }
  ]
}
```

The report should be visible to the user before or alongside CV generation so the user understands what is strong, what is weak, why risk remains, and which claims must not be made.

## Writer Responsibilities

Writer must:

- use Screening Analysis as constraints, not merely context
- preserve unsupported requirements as gaps or risks
- use evidence IDs and allowed claim boundaries to decide wording strength
- strengthen wording only when the evidence supports the stronger claim
- shift weak-fit output toward truthful transferable positioning
- include or reference the Positioning Report in generation context
- avoid unsupported requirements even when they are important JD keywords

Writer must not invent:

- quota ownership
- Azure sales ownership
- enterprise deal ownership
- customer-facing responsibilities
- leadership
- architecture ownership
- cloud migration ownership
- executive relationship ownership
- metrics, titles, tools, or scope not supported by evidence

## Reviewer Expectations

Reviewer should distinguish between two different failure classes:

1. Unsupported Claims
   - The CV states or implies a capability, ownership, metric, or role match that the evidence does not support.
   - These remain hard blockers and may be treated as hallucination/overclaim failures.

2. Truthful Capability Gaps
   - The CV truthfully says what the candidate can offer, but the available evidence still does not satisfy one or more JD requirements.
   - These should reduce readiness or keep export blocked when manager readiness is too low, but they should not be labeled as fabricated claims.

This does not change reviewer scoring in this ADR. It defines the product policy that a future implementation should express through structured blocker categories and UI language.

## Related Contract Updates Required

Future implementation should update these contracts:

- `docs/governance/contracts/JD_ANALYSIS.md`
  - Add Positioning Report output ownership.
  - Clarify that apply tier is a positioning strategy signal, not a generation gate.

- `docs/governance/contracts/WRITER_INPUT.md`
  - Require Writer input to include Positioning Report or equivalent fields.
  - Require Writer to obey unsupported requirement and `mustNotClaim` constraints.

- `docs/governance/contracts/WRITER_OUTPUT.md`
  - Clarify that weak-fit CV output is valid when truthful and evidence-grounded.
  - Require visible CV claims to stay within Positioning Report and evidence boundaries.

- `docs/governance/contracts/REVIEW.md`
  - Add policy distinction between Unsupported Claims and Truthful Capability Gaps.
  - Keep export blocking semantics separate from hallucination labeling.

- `docs/governance/contracts/EXPORT.md`
  - Clarify that export may be blocked by truthful capability gaps even when no unsupported claims remain.

- `docs/governance/QUALITY_SPEC.md`
  - Add the success rule: strongest truthful CV possible, without exceeding evidence.

- `CV_Manager_React/docs/SPEC.md`
  - Add product principle: generation is never blocked by fit classification; export remains quality-gated.

## Production Files That Would Require Changes

Do not modify these files under this ADR. They are listed for the future implementation plan only.

### Type and Data Shape

- `CV_Manager_React/src/types.ts`
  - Add `PositioningReport` and nested item types.
  - Add `overallFit: "Good" | "Risky" | "Weak"` or map existing `applyTier` into the new product vocabulary.
  - Add fields to `ScreeningAnalysis` for `positioningReport`.
  - Consider whether `SummaryQualityContract.positioningMode` should reference Positioning Report fields.

### Prompt and Context Builders

- `CV_Manager_React/src/promptBuilders.ts`
  - Update `buildScreeningAnalysisPrompt` schema to request Positioning Report.
  - Update `buildScreeningCvWriterContext` to pass Positioning Report into Writer context.
  - Update `buildScreeningCvPrompt` rules so Writer treats fit tier as positioning strategy, not direct-fit pressure.
  - Update targeted regeneration prompt rules where Summary wording depends on weak-fit positioning.

### CV Brief and Evidence Policy

- `CV_Manager_React/src/data/selection.ts`
  - Ensure `buildCvBrief` carries Positioning Report constraints into `targetPositioning`, `summaryAngle`, `claimsToAvoid`, and bullet plans.
  - Preserve current evidence priority; do not change selection algorithm unless a later task explicitly authorizes it.

### Summary Quality / Positioning Contract

- `CV_Manager_React/src/domain/summaryQualityContract.ts`
  - Align `direct-fit`, `adjacent-fit`, `transferable-fit`, and `not-recommended` with the new Good/Risky/Weak product policy.
  - Ensure unsupported core requirements remain fit risks or capability gaps instead of rewrite demands when the Summary is truthful.

### Review and Export Decision

- `CV_Manager_React/src/domain/screeningReview.ts`
  - Add or rename structured review categories so unsupported claims and truthful capability gaps are separate.
  - Do not change scoring thresholds unless a later task explicitly authorizes it.

- `CV_Manager_React/src/domain/screeningExportDecision.ts`
  - Ensure export blockers can present truthful capability gaps separately from hallucination/unsupported-claim blockers.
  - Preserve current export authority and readiness semantics.

### Repair and Regeneration

- `CV_Manager_React/src/domain/repairOrchestrator.ts`
  - Route truthful capability gaps away from repeated AI rewrite loops when the claim is already truthful.
  - Keep unsupported claim blockers eligible for targeted rewrite or manual correction.

- `CV_Manager_React/src/domain/targetedRegeneration.ts`
  - Ensure targeted Summary regeneration cannot attempt to "solve" unsupported requirements by stronger wording.

- `CV_Manager_React/src/domain/targetedRegenerationContract.ts`
  - Add constraints for Positioning Report-aware patch output if targeted regeneration consumes it.

### UI Surfaces

- `CV_Manager_React/src/components/tabs/ScreeningLab.tsx`
  - Show Positioning Report in the Screening Lab flow.
  - Make fit tier language clear: weak fit still generates, but positioning must stay transferable and truthful.
  - Show unsupported requirements, recommended positioning, and remaining hiring risks before/after generation.

- `CV_Manager_React/src/components/tabs/screeningLabPanels.tsx`
  - Add reusable Positioning Report display panel if kept separate from `ScreeningLab.tsx`.

- `CV_Manager_React/src/components/tabs/screeningReviewRepairPanels.tsx`
  - Display truthful capability gaps differently from unsupported claim repair blockers.

- `CV_Manager_React/src/components/cv/CVStudio.tsx`
  - If export readiness messaging appears there, reflect the distinction between unsupported claims and truthful capability gaps.

- `CV_Manager_React/src/components/tabs/Export.tsx`
  - If export blockers appear there, label capability gaps as fit/readiness risk rather than fabrication.

### Test and Validation Files

- `CV_Manager_React/scripts/smoke-summary-quality-contract.mjs`
- `CV_Manager_React/scripts/smoke-summary-generator-review-alignment.mjs`
- `CV_Manager_React/scripts/smoke-reviewer.mjs`
- `CV_Manager_React/scripts/smoke-export-readiness.mjs`
- `CV_Manager_React/scripts/smoke-writer-input.mjs`
- `CV_Manager_React/scripts/smoke-writer-output.mjs`
- `CV_Manager_React/scripts/smoke-targeted-regeneration*.mjs`
- `CV_Manager_React/e2e/product-acceptance.spec.ts`
- `CV_Manager_React/e2e/targeted-regeneration-runtime.spec.ts`
- `CV_Manager_React/src/components/test/ProductAcceptanceFixtureApp.tsx`
- `CV_Manager_React/package.json` if new smoke commands are added.

## Implementation Plan

1. Contract update task
   - Update JD Analysis, Writer Input, Writer Output, Review, Export, Quality Spec, and React Spec with this policy.
   - Add explicit examples for Good, Risky, and Weak/Avoid behavior.
   - Acceptance: contract docs state that fit classification never blocks generation and that export remains quality-gated.

2. Type/schema task
   - Add `PositioningReport` types and wire them into `ScreeningAnalysis`.
   - Add compatibility behavior for older analyses that do not have `positioningReport`.
   - Acceptance: TypeScript build passes and legacy data reads without migration.

3. Analysis prompt task
   - Update Analysis prompt schema to return Positioning Report.
   - Require unsupported requirements and `mustNotClaim` lists.
   - Acceptance: analysis smoke validates Good/Risky/Weak examples and rejects fabricated support.

4. Writer context/prompt task
   - Pass Positioning Report to Writer.
   - Update Writer rules so Weak/Avoid means transferable truthful positioning, not refusal and not direct-fit exaggeration.
   - Acceptance: Azure Solution Specialist fixture generates truthful transferable wording without quota/Azure-sales/deal-ownership claims.

5. Brief alignment task
   - Ensure CV Brief uses Positioning Report in headline, Summary angle, claims to avoid, skills to foreground/suppress, and bullet plans.
   - Acceptance: Brief for weak-fit case contains transferable strengths and unsupported requirements separately.

6. Reviewer language task
   - Add structured category separation for Unsupported Claims versus Truthful Capability Gaps.
   - Do not change reviewer scoring thresholds in this task unless separately approved.
   - Acceptance: same weak-fit CV can be blocked for capability gap without being labeled hallucinated when wording is truthful.

7. UI explanation task
   - Add Positioning Report display in Screening Lab and export/review surfaces where relevant.
   - Acceptance: user can see what is strong, what is weak, recommended positioning, and why interview probability is reduced.

8. Validation task
   - Add/update focused smokes and Product Acceptance fixtures.
   - Include Azure Solution Specialist as the regression case.
   - Required validation: writer-input, writer-output, summary-quality-contract, summary-generator-review-alignment, reviewer, export-readiness, targeted-regeneration, Product Acceptance E2E, no-AI guard, build, and system test where environment allows.

## Non-Goals

- No architecture redesign.
- No runtime pipeline change.
- No hidden AI action.
- No persistence redesign.
- No reviewer scoring change in this ADR.
- No data migration in this ADR.
- No production code change in this ADR.

## Success Criteria

- Weak-fit candidates still receive the strongest truthful CV possible.
- The system never fabricates missing evidence.
- The user can distinguish supported strengths from unsupported requirements.
- Reviewer can block export for truthful capability gaps without mislabeling them as hallucinations.
- Recruiters are not misled by direct-fit claims that the candidate's evidence cannot support.
