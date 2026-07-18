# Phase 2 CV Pipeline Audit

Status: Audit only. No production code, prompt, architecture, runtime data, governance rule, or Task status was modified.

## Audit Scope and Evidence

Evidence priority follows root `AGENTS.md`. The audit inspected:

- `CV_Manager_React/docs/SPEC.md`, `FLOW.md`, and `ARCHITECTURE.md`
- governance rules, quality spec, decisions, and all nine contracts
- `src/data/selection.ts`
- `src/promptBuilders.ts`
- `src/domain/screeningReadiness.ts`
- `src/domain/screeningCvOutput.ts`
- `src/domain/screeningReview.ts`
- `src/domain/localReviewerFix.ts`
- `src/components/tabs/ScreeningLab.tsx`
- `src/components/tabs/Export.tsx`
- canonical snapshot `CV_Manager_React/data/app_data.json` revision 24
- persisted CVs `cv-mr4q83lz-cidl0` and `cv-mreyos3q-hdzt5`
- historical/source artifacts under `CV/`, `CV_Manager_React/source_material/`, and `my work/`

Per ADR-001, no CV artifact is a canonical ideal. Historical CVs were inspected only as source/reference material, not as acceptance oracles.

## Executive Answer

The generated CV differs from `QUALITY_SPEC.md` because the pipeline has stronger natural-language instructions than enforceable contracts. Selection is count- and term-driven; effective Brief identity is inconsistent across UI, prompt, and generation context; Writer input is very large and loses evidence priority order; Writer output validation checks structure rather than quality or traceability; Reviewer checks sometimes evaluate JD gaps rather than visible CV claims; and local repair rewrites broad content without receiving failed-zone boundaries.

Quality begins to degrade at two distinguishable points:

1. **Earliest systemic risk:** Evidence Selection -> CV Brief -> Writer Input. Ordered recommendations are reduced, reordered, or represented inconsistently.
2. **Earliest confirmed visible defect:** Writer Output. Both inspected CVs contain five bullets without EvidenceCard traceability; the AI Evaluation CV also contains non-EvidenceCard IDs in `bullet.evidenceIds`.
3. **Confirmed additional degradation:** Local Repair. The Power Platform CV shows broad summary/current-role rewriting, repeated repair notes, and off-JD evidence promoted ahead of more relevant Power Platform evidence.

## Stage Analysis

### 1. JD Intake and Screening Analysis

| Field | Audit Result |
|---|---|
| Inputs | Raw/parsed JD, career profile, source of truth, all skills/domain/evidence/stories, optional Market JD references |
| Outputs | `ScreeningAnalysis`: positioning, manager intent, mappings, keywords, terminology, gaps, recommended IDs |
| Owner | `buildScreeningAnalysisPrompt` in `src/promptBuilders.ts`; apply path `applyScreeningAnalysisResult` in `ScreeningLab.tsx` |
| Contract | `contracts/JD_ANALYSIS.md` |
| Quality Responsibility | Convert the JD into supported screening strategy and explicit gaps |
| Information Lost | Full output is not runtime-validated against the complete `ScreeningAnalysis` contract |
| Information Added | Model-inferred manager intent, market archetype, keyword priorities, recommendation IDs |
| Information Rewritten | Raw JD is reframed into recruiter/manager abstractions |
| Failure Modes | Invalid or incomplete analysis fields can pass apply; inferred manager intent can become a downstream scoring target |
| Confidence | Confirmed |

### 2. Terms and Gaps

| Field | Audit Result |
|---|---|
| Inputs | Analysis terminology/gaps plus blocked terms on selected evidence |
| Outputs | Warnings, gap counts, unmapped terms, readiness checks |
| Owner | `terminologyAndGapReview` in `src/domain/screeningReadiness.ts` |
| Contract | `contracts/TERMS_AND_GAPS.md` |
| Quality Responsibility | Keep internal wording and unsupported gaps out of visible CV claims |
| Information Lost | No loss confirmed; this stage is evaluative |
| Information Added | Readiness labels and risk counts |
| Information Rewritten | None |
| Failure Modes | Unsupported/weak checks are informational; exact blocker policy is not contractually settled |
| Confidence | Confirmed |

### 3. Evidence Selection

| Field | Audit Result |
|---|---|
| Inputs | Analysis/fit recommendations, selected IDs, all evidence, stories, skills, domain records |
| Outputs | Up to 12 skills, 6 domain records, 18 evidence cards, and 6 stories |
| Owner | `buildCvGenerationSelectionPatch`, `selectionDiagnostics`, `cvInputReadiness` in `src/data/selection.ts` |
| Contract | `contracts/EVIDENCE_SELECTION.md` |
| Quality Responsibility | Preserve valid, grounded, JD-relevant evidence and enough career breadth |
| Information Lost | Evidence beyond the selected caps never reaches Writer; requirement coverage and priority order are not explicit output fields |
| Information Added | Lexical ranking score and count-based readiness |
| Information Rewritten | Recommendations are merged with ranked current-role, prior-role, and prior selections |
| Failure Modes | `scoreForJob` rewards term occurrence, generic action words, and digits; readiness checks quantity, not business impact/technical depth; selected ID order is later discarded by array filtering |
| Confidence | Confirmed |

### 4. CV Brief

| Field | Audit Result |
|---|---|
| Inputs | Screening Analysis plus selected evidence/skills/stories |
| Outputs | Positioning, manager problem, top three mappings, up to 10 must-show IDs, 8 supporting IDs, skills, claims, bullet plan |
| Owner | `buildCvBrief` in `src/data/selection.ts` |
| Contract | `contracts/CV_BRIEF.md` |
| Quality Responsibility | Make the Writer's evidence and narrative plan explicit |
| Information Lost | Only the top three supported mappings become selling points/bullet plan; additional mappings are not represented in the plan |
| Information Added | Fallback selling points and fixed default claims to avoid |
| Information Rewritten | Mapping language becomes section themes and manager-value statements |
| Failure Modes | Persisted empty `top3SellingPoints`/`bulletPlan` can coexist with usable must-show evidence; UI regenerates an effective Brief but prompt builder still prefers truthy `job.cvBrief` |
| Confidence | Confirmed |

### 5. Writer Input

| Field | Audit Result |
|---|---|
| Inputs | Screening Analysis, `job.cvBrief` or generated Brief, JD, full career profile, selected skills/domain/evidence/stories, optional repair context |
| Outputs | One JSON-only natural-language prompt |
| Owner | `buildScreeningCvPrompt` in `src/promptBuilders.ts` |
| Contract | `contracts/WRITER_INPUT.md` |
| Quality Responsibility | Preserve evidence constraints while producing recruiter- and manager-ready instructions |
| Information Lost | Raw source/contact material is not included; no structured email exists in career profile/evidence; selected ID priority is lost because records are filtered in global data-array order |
| Information Added | Large rule set, fixed positioning examples, hard-coded forbidden terms, output schema |
| Information Rewritten | Evidence objects and Brief are embedded as large JSON blocks within prose instructions |
| Failure Modes | UI uses regenerated Brief when persisted selling points are empty, while prompt builder uses truthy persisted Brief; current payload JSON is about 159k chars for Power Platform and 190k for AI Evaluation before prompt instructions; salience dilution is possible |
| Confidence | Confirmed |

### 6. Writer Output and Apply

| Field | Audit Result |
|---|---|
| Inputs | Model JSON output |
| Outputs | Normalized `TailoredCv`, `CvVersion`, composed sections/content, generation context, review snapshot |
| Owner | `normalizeTailoredCv`, `validateScreeningCvOutput`, `applyScreeningCvResult` |
| Contract | `contracts/WRITER_OUTPUT.md` |
| Quality Responsibility | Reject malformed or unsafe visible CV content before persistence |
| Information Lost | Exact prompt/Brief snapshot is not stored; legacy generations lack `cvBriefHash` |
| Information Added | Composed content and snapshot metadata |
| Information Rewritten | Normalization and section composition |
| Failure Modes | Validator requires only header name/title, summary, skillGroups array, one role, company/role, and one bullet per role; it does not enforce contact, EvidenceCard-only IDs, evidence coverage, business impact, technical depth, length, or supported claims |
| Confidence | Confirmed |

### 7. Gate, Manager, and Reviewer

| Field | Audit Result |
|---|---|
| Inputs | Job analysis, current CV, evidence cards |
| Outputs | Gate fixes, manager decision/rewrite list, reviewer blockers, snapshot counts |
| Owner | `screeningGate`, `hiringManagerReview`, `reviewerPass`, `createReviewSnapshot` |
| Contract | `contracts/REVIEW.md` |
| Quality Responsibility | Detect visible screening, manager, evidence, wording, and export failures without rewriting |
| Information Lost | Persisted snapshot stores counts/readiness, not detailed issue evidence |
| Information Added | Heuristic keyword, action-verb, manager-intent, and risk classifications |
| Information Rewritten | Findings become free-text repair items, then regex-classified repair categories |
| Failure Modes | Unknown keyword support is treated as supported; unsupported/weak mappings and high-risk gaps fail Reviewer even when omitted from visible CV; action verbs proxy for outcomes; manager relevance uses word overlap; mixed invalid IDs are not rejected if a bullet has one valid EvidenceCard ID |
| Confidence | Confirmed |

### 8. Repair

| Field | Audit Result |
|---|---|
| Inputs | Current CV, selected evidence, Brief, broad safety callback; AI path also receives failed checks/content audit |
| Outputs | Replaced current CV content and new review snapshot |
| Owner | `classifyRepairActions`, `buildLocalReviewerContentFix`, `ScreeningLab.tsx` orchestration |
| Contract | `contracts/REPAIR.md` |
| Quality Responsibility | Change only failed areas while preserving good content and evidence |
| Information Lost | Local repair does not receive failed checks or affected zones; original subsection intent/order is discarded for current role |
| Information Added | Hard-coded subsection titles, action prefixes, generated summary concatenation, cumulative review note |
| Information Rewritten | Entire current-role subsection structure; all current-role bullets; all prior-role bullet wording/metrics; summary |
| Failure Modes | First 12 candidates follow global evidence array order; fixed Power Platform subsection titles apply regardless of JD; summary has no deduplication; repeated repairs append duplicate notes; broad rewrite violates narrow-repair intent |
| Confidence | Confirmed |

### 9. Export

| Field | Audit Result |
|---|---|
| Inputs | Current CV, job, gate result, composed content |
| Outputs | Export readiness checks and export UI eligibility |
| Owner | `exportVerification`; `ExportPage`; CV Studio export flow |
| Contract | `contracts/EXPORT.md` |
| Quality Responsibility | Ensure contact, ordering, text extraction, work depth, keyword support, and composed content |
| Information Lost | No content loss confirmed |
| Information Added | Character-count and structure readiness status |
| Information Rewritten | None |
| Failure Modes | Character counts are proxies; no browser/PDF rendering, page count, actual text layer, visual hierarchy, or 1.5-2-page verification is performed by current local check |
| Confidence | Confirmed |

## Direct Answers to Primary Questions

1. **Why different from QUALITY_SPEC?** Most quality rules are prompt prose or heuristics, not enforceable transition contracts.
2. **Where does degradation begin?** Systemic risk begins at Evidence Selection/Brief/Writer Input; confirmed visible defects begin at Writer Output; local repair adds confirmed degradation.
3. **What is lost?** Unselected evidence, evidence priority order, exact effective Brief identity, source contact details, detailed persisted review findings, and failed-zone identity for local repair.
4. **What is rewritten unnecessarily?** Local repair rewrites summary, all current-role structure/bullets, and all prior-role bullet wording rather than only failed zones.
5. **What never reaches Writer?** Raw source/contact artifacts and evidence outside selection caps; selected evidence priority order is not preserved.
6. **Which review rules push away?** Failing on analysis-level unsupported/weak gaps, treating Unknown keyword support as supported, and rewarding action verbs/keyword overlap can promote stuffing or cosmetic rewriting.
7. **Which repair steps degrade?** Global-order candidate selection, hard-coded section titles, broad current-role rebuilding, prior-role sanitation, summary concatenation, and repeat-note accumulation.
