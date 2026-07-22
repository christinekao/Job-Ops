# Quality Regression Checklist

Status: Required checklist for every post-wave CV quality review.

Use this checklist after scoring `QUALITY_SCORECARD.md`. Each row must be marked `Pass`, `Fail`, `Blocked`, or `Not applicable`.

## Required Checks

| Check | Evidence Required | Result | Confidence | Notes |
|---|---|---|---|---|
| Lost evidence | Previous and current must-show evidence coverage |  |  | Identify evidence IDs lost from visible CV |
| Lost business impact | Previous and current bullet impact review |  |  | Identify bullets that lost stakeholder/scope/outcome |
| Weaker technical depth | Previous and current technical detail review |  |  | Identify removed tools, workflows, validation details, or controls |
| New hallucinations | Current visible claims vs evidence |  |  | Identify unsupported new claims |
| Broken narrative | Header/summary/first bullets/skills consistency |  |  | Identify role-story drift |
| Duplicate bullets | Current bullet text and repeated stems |  |  | Identify repeated or near-duplicate bullets |
| Duplicate summary or notes | Summary and repair notes |  |  | Identify repeated summary positioning or repair note accumulation |
| Reviewer damage | Pre-review vs post-review changes if reviewer altered content |  |  | Reviewer should evaluate, not rewrite |
| Repair damage | Pre-repair vs post-repair CV diff |  |  | Identify green-area rewrites or off-JD evidence promotion |
| ATS regression | Previous and current keyword/section review |  |  | Identify missing supported must-have terms |
| HR regression | Contact/header/section readability |  |  | Identify missing contact, unclear title, missing dates |
| Manager relevance regression | First-page manager problem fit |  |  | Identify weaker opening evidence or vague summary |
| Internal terminology leakage | Visible text vs terminology/blocked terms |  |  | Identify untranslated internal terms |
| Export regression | Export readiness and rendered artifact checks when available |  |  | Identify missing contact, section order, page/text-layer issues |
| Requirement classification regression | Normalized requirements and match matrix |  |  | Every requirement has exactly one importance/status |
| Transfer overclaim | Transferable rows, Evidence eligibility, transfer context |  |  | Missing Evidence or context fails |
| Gap-category collapse | Learnable/core/formal rows |  |  | Formal risk must not become capability proof |
| Fit/ranking regression | Fixed Golden dimensions and relative ranks |  |  | Validate JD-003 > JD-001 > JD-002 and JD-003 > JD-004 |
| Medium/Low guidance regression | Opportunity and transition analyses |  |  | Medium must position; Low must not fabricate a CV path |
| Manual/URL JD equivalence | Fixed manual JD and captured URL response |  |  | Canonical content, matrix, Fit, rank, and recommendation must match |
| URL import safety | Protocol/DNS/IP/redirect/limit/error fixtures |  |  | Any private destination or unbounded response is Critical |
| Hidden import automation | Intake Fetch action and recorded-AI result |  |  | Fetch must not Parse, Screen, write, or invoke AI |

## Regression Severity

| Severity | Rule |
|---|---|
| Critical | Unsupported claim, invalid traceability, repair damage to green content, missing required contact, export blocker |
| High | Lost must-show evidence, weaker first-page manager relevance, ATS must-have term loss |
| Medium | Reduced business impact, weaker technical detail, duplicate content |
| Low | Minor wording/readability issue that does not affect evidence or role fit |

## Required Root Cause Format

Every failed check must use:

```text
Observed Problem
-> Immediate Cause
-> Upstream Cause
-> Structural Root Cause
```

Root cause category must be one of:

- Data
- Context
- Evidence
- Prompt
- Review
- Repair
- Export
- Architecture
- Evaluation
- UX
- Implementation
- Model limitation

## Pass Condition

A wave passes quality regression review only when:

- No Critical regression is present.
- Total quality score is not lower than previous baseline by 5 or more points.
- Any Blocked metric has an explicit missing-input explanation.
- Recommended next wave targets the earliest confirmed remaining quality failure.

## URL Import Compatibility Regression

- Original submitted Source URL fills the editable canonical field only after a successful Fetch.
- Redirect destination remains provenance-only and does not affect JD identity.
- Microsoft details/insights adapters remain inside the shared SSRF-safe server pipeline.
- Previous-hire top skills and roles remain informational supplemental metadata.
- Formal Skills, Requirements, Preferred Qualifications, Requirement Matrix, Fit tiers, ranking, and forbidden claims remain unchanged by employer insights.
- Standard JSON-LD, generic HTML, unknown attributes, adapter fallback, and manual fallback remain supported.
- Fetch never invokes AI, Save, Parse, Screening, Writer, or persistence.

## JD Intake Layout Regression

- Required semantic sections and field ownership remain stable and ordered.
- Short fields render as 3/2/1 responsive columns without overflowing the grid.
- Paired textareas align initially, remain independently resizable, and preserve
  complete stored content.
- Employer Insights is full-width, collapsed by default, informational only,
  and excluded from Skills, identity, Fit, Writer, and hash.
- Empty-state guidance is placeholder/helper presentation only and is never
  persisted.
- Date posted may be formatted for display, but its ISO canonical value remains
  unchanged.
- Rendering, expanding, and collapsing invoke no AI; Fetch still does not
  auto-Parse or auto-Save.

## JD Action Feedback Regression

- Apply success explicitly says Save is still required and marks the form
  unsaved without persistence or AI.
- Invalid Apply preserves the current form and never reports success.
- Save and Update report distinct success only after server-revision
  confirmation.
- Save failure and revision conflict preserve edits, unsaved state, and the
  existing recovery contract.
- Applying/Saving disables duplicate submission and restores controls after the
  result.
- Success is announced as a polite status; failure is announced as an alert.

## Screening Schema Contract Regression

- Prompt contract and strict Apply validator are generated from the same schema
  owner; properties, required fields, enums, nesting, arrays, and descriptions
  cannot drift.
- Unknown, missing, invalid-type, invalid-enum, invented Evidence ID, and unsafe
  cross-field output cannot Apply.
- Schema or Prompt-policy changes stale prior analysis; presentation-only
  changes do not change schema identity.
- Positioning Report, counts, persistence/UI metadata, and legacy aliases remain
  outside the Screening AI schema.
- Legacy analysis is readable but cannot authorize current Writer execution.

## Canonical Raw JD Contamination Regression

- Microsoft raw JD is composed deterministically from formal structured fields,
  not the remote response body or full `jobDescription` payload.
- Raw JD and JD Parse Prompt contain no theme, custom-theme, button/checkbox
  color, hydration/application-state, navigation, tracking, feature-flag, or
  page-identifier payload.
- Overview, Responsibilities, Required/Other/Preferred Qualifications,
  Compensation, application window, and explicit source Skills remain complete.
- Employer Insights, provenance, additional attributes, response bodies, and
  debug payload remain outside raw JD and Prompt.
- Empty, oversized, serialized, or contaminated input blocks Copy Prompt
  without truncation, data clearing, or AI.
- Config/provenance-only changes preserve identity; formal content changes
  retain the P7 downstream staleness chain.

## P15R Requirement Inventory Integrity Regression

- Structured source boundaries are preserved; deterministic reconstruction
  leaves no incomplete, one-word, or conjunction-only requirement rows.
- Raw fragments never receive stable IDs.
- Compound degree, field, years, and coding expectations are independently
  classifiable; language/cloud alternatives are not split into separate rows.
- Every atomic requirement has parent/source lineage; duplicate canonical IDs
  and orphan rows are zero.
- Risks, Fit Notes, Employer Signal, compensation, application window,
  employer insights, and prior AI output never enter canonical inventory.
- Exact-once validation uses canonical atomic IDs and rejects unknown, missing,
  duplicate, or altered code-owned semantics.
- Plain job-listing URL is required for new saves; invalid legacy values warn
  without mutation.
- Screening context contains no hard-truncated safety string or claim boundary.
- Normalization/schema/Prompt policy drift stales old Screening; no automatic AI
  action is introduced.
- P8 Fit/ranking, Writer/Reviewer/Repair/Export safety, Manual Paste, and URL
  Import remain unchanged.

## P15R2 Atomic Formal Semantics Regression

- Formal eligibility constraints classify as `FORMAL_SCREENING_RISK` and never
  capability Fit gaps; parent alternative pathways are metadata only.
- Deterministic compound-responsibility splits are exact-once, lineaged, and do
  not explode adjectives or aspect lists into rows.
- Invalid legacy provenance URLs are absent from the Screening Prompt and appear
  only as bounded safe status metadata.
- Historical run status and current contract authorization are separately shown;
  stale output remains readable but cannot authorize current work.

## P16 Workflow Checklist Current-State Regression

- Checklist status derives from current analysis, acknowledged CV Brief, CV
  generation, and review identities; it is never a persisted presentation flag.
- No current CV means Gate Review and Manager + ATS Check are locked, regardless
  of historical diagnostics or review timestamps.
- LOW_FIT without a hard block permits only explicit user continuation through
  supported evidence; Writer remains explicit and evidence-safe.
- A Gate/Manager result is current only when its review snapshot binds the
  current CV identity. Historical/stale results remain readable and labeled.
