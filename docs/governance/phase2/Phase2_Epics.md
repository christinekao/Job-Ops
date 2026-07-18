# Phase 2 Recommended Epics

Status: Audit-derived implementation backlog only. No Epic or Task is READY or authorized.

## Epic 1 — Effective Brief and Generation Identity

**Objective**

Ensure UI readiness, Writer input, input hashing, apply logic, and persisted generation context use one identifiable effective CV Brief.

**Expected Impact**

Removes the earliest confirmed trace break and prevents stale/thin persisted Briefs from silently controlling generation.

**Dependencies**

- ADR review for effective Brief ownership
- Existing CV Brief and Writer Input fixtures

**Suggested Atomic Tasks**

1. Document effective Brief resolution truth table.
2. Add failing fixture for truthy persisted Brief with empty selling points/plan.
3. Bind one resolved Brief hash to prompt/input/application context.
4. Add legacy behavior report without migrating runtime data.

**Estimated Risk:** Medium  
**Estimated Implementation Size:** Medium

## Epic 2 — Evidence Priority and Writer Context Quality

**Objective**

Preserve recommendation order and provide a concise, role-relevant Writer evidence projection.

**Expected Impact**

Reduces irrelevant first-page evidence, prompt redundancy, and variability caused by global array order.

**Dependencies**

- Epic 1 Brief identity
- Approved ordering semantics in Evidence Selection contract

**Suggested Atomic Tasks**

1. Add selected-ID order preservation fixtures.
2. Add requirement/business-impact/technical-depth coverage diagnostics.
3. Define minimal CV-safe Writer evidence projection.
4. Measure prompt context size before/after without changing output behavior in the measurement Task.
5. Add role-family selection fixtures for the two current JDs.

**Estimated Risk:** Medium  
**Estimated Implementation Size:** Large

## Epic 3 — Writer Output Integrity and Contact Ownership

**Objective**

Prevent structurally valid but quality-invalid CVs from being applied.

**Expected Impact**

Stops missing contact, empty evidence traces, mixed ID namespaces, duplicated summaries, and under-specified role blocks earlier.

**Dependencies**

- Structured, user-approved contact owner decision
- Epic 2 evidence namespace/order rules

**Suggested Atomic Tasks**

1. Decide and document structured contact ownership.
2. Add EvidenceCard-only ID namespace validator.
3. Add bullet traceability and duplicate-text validation.
4. Add QUALITY_SPEC-aligned output validation fixture.
5. Add compatibility reporting for existing CVs without mutating them.

**Estimated Risk:** Medium  
**Estimated Implementation Size:** Medium

## Epic 4 — Reviewer Semantics Alignment

**Objective**

Separate visible CV integrity from application-fit gaps and replace cosmetic proxies with evidence-linked checks.

**Expected Impact**

Prevents honest CVs from remaining permanently red and reduces keyword/action-verb gaming.

**Dependencies**

- Epic 3 output integrity
- Clear distinction among fit risk, CV integrity, manager relevance, and export readiness

**Suggested Atomic Tasks**

1. Add fixture where unsupported JD gap is honestly omitted from CV.
2. Split visible overclaim check from analysis-gap report.
3. Stop treating Unknown keyword support as supported without evidence.
4. Replace action-verb proxy with action + evidence + business-value assertion.
5. Add mapped manager-intent coverage fixture.

**Estimated Risk:** High  
**Estimated Implementation Size:** Large

## Epic 5 — Narrow Repair Patch Contract

**Objective**

Make every repair operate on explicit failed fields/zones and preserve all unrelated content.

**Expected Impact**

Eliminates broad current-role rebuilding, hard-coded role-family sections, irrelevant evidence promotion, summary duplication, and repeated notes.

**Dependencies**

- Epic 2 ordered evidence
- Epic 3 output integrity
- Epic 4 affected-check semantics

**Suggested Atomic Tasks**

1. Define field-level Repair Patch schema and affected-check list.
2. Add failing fixture proving current broad local repair mutation.
3. Remove role-family-specific hard-coded structure from generic repair behavior.
4. Add summary/note idempotence fixture.
5. Re-evaluate only affected check families after patch.

**Estimated Risk:** High  
**Estimated Implementation Size:** Large

## Epic 6 — Export and Rendered Quality Verification

**Objective**

Extend local readiness proxies into actual browser/PDF validation without changing CV quality sources of truth.

**Expected Impact**

Verifies real 1.5-2-page behavior, text layer, clipping, section order, and visual export readiness.

**Dependencies**

- Epic 3 valid output
- Epic 4 reviewer semantics
- Approved page-length variant policy from `QUALITY_SPEC.md`

**Suggested Atomic Tasks**

1. Decide page-length variant policy by role/application type.
2. Capture deterministic export fixture.
3. Add PDF text-layer and page-count verification.
4. Add browser print-layout/clipping checks.
5. Keep manager relevance as a separate result from render readiness.

**Estimated Risk:** High  
**Estimated Implementation Size:** Large

## Epic 7 — Pipeline Traceability and Quality Calibration

**Objective**

Make information loss and mutation visible at each transition and calibrate quality per role family without a canonical CV.

**Expected Impact**

Allows future quality regressions to be assigned to the earliest stage instead of triggering broad prompt rewrites.

**Dependencies**

- Epics 1-5 identity and patch contracts
- ADR-001 remains in force

**Suggested Atomic Tasks**

1. Persist/reconstruct selected -> Brief -> Writer -> bullet trace metadata.
2. Add before/after repair provenance report.
3. Define Power Platform and AI Evaluation role-family calibration rubrics from QUALITY_SPEC dimensions.
4. Add regression fixtures for current two JDs using evidence/requirements, not CV text snapshots.
5. Add wave-level quality report for evidence coverage, manager relevance, and unsupported claims.

**Estimated Risk:** Medium  
**Estimated Implementation Size:** Large

## Recommended Epic Order

```text
Epic 1 -> Epic 2 -> Epic 3 -> Epic 4 -> Epic 5
                       |                   |
                       +-------> Epic 6 <--+
                                   |
                                   -> Epic 7
```

No Epic should be promoted until its decisions, allowed files, acceptance criteria, focused tests, regression risks, and rollback method are split into separate atomic Task files.
