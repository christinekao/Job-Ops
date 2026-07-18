# Runtime Domain Model

## 1. Purpose

This document defines the four minimum runtime domains and their conceptual objects.

It is technology-independent and implementation-independent.

## 2. Domain Rule

Every runtime domain has exactly one primary responsibility.

No domain may both create persuasive wording and approve the truthfulness of that wording.

## 3. Requirement Model Domain

Primary responsibility:

Represent the hiring target.

### 3.1 JobSnapshot

Purpose:

Capture the immutable JD input.

Required fields:

- jobSnapshotId
- rawJdText
- rawJdHash
- roleTitle
- companyName or companyType
- source
- capturedAt

Relationships:

- has many RequirementGroups
- has many Requirements
- has many Keywords

Ownership:

- Requirement Model

Lifecycle:

- created when JD enters
- immutable after creation
- superseded by new snapshot when JD changes

### 3.2 RequirementGroup

Purpose:

Group related hiring requirements.

Required fields:

- requirementGroupId
- jobSnapshotId
- name
- description
- priority
- rationale

Relationships:

- belongs to JobSnapshot
- contains Requirements

Ownership:

- Requirement Model

Lifecycle:

- created during requirement extraction
- versioned with Requirement Model

### 3.3 Requirement

Purpose:

Represent one atomic hiring requirement.

Required fields:

- requirementId
- requirementGroupId
- text
- requirementType: hard, preferred, contextual, inferred
- priority: critical, high, medium, low
- criticality: blocker, differentiator, nice-to-have
- sourceSpan or sourceRationale
- confidence

Relationships:

- belongs to RequirementGroup
- referenced by CoverageRows
- referenced by QualityMetrics

Ownership:

- Requirement Model

Lifecycle:

- created during extraction
- immutable per Requirement Model version

### 3.4 HiringSignal

Purpose:

Represent inferred recruiter or hiring-manager intent.

Required fields:

- hiringSignalId
- jobSnapshotId
- signal
- audience: recruiter, hiring-manager, ATS, interviewer
- confidence
- rationale

Relationships:

- may reference Requirements
- consumed by Coverage Matrix and WritingPlan

Ownership:

- Requirement Model

Lifecycle:

- created during interpretation
- revised only when Requirement Model is regenerated

### 3.5 Keyword

Purpose:

Represent a JD-derived searchable term.

Required fields:

- keywordId
- jobSnapshotId
- term
- priority
- requirementIds
- mustBeEvidenceSupported

Relationships:

- belongs to JobSnapshot
- references Requirements
- consumed by Coverage Matrix and Product Quality Evaluator

Ownership:

- Requirement Model

Lifecycle:

- created during JD interpretation
- immutable per Requirement Model version

## 4. Coverage Matrix Domain

Primary responsibility:

Represent evidence support against requirements.

### 4.1 EvidenceRef

Purpose:

Reference candidate evidence without owning the evidence bank.

Required fields:

- evidenceRefId
- sourceEvidenceId
- evidenceSummary
- evidenceType
- confidence
- provenanceStatus

Relationships:

- linked to CoverageRows
- linked to ClaimSources

Ownership:

- Coverage Matrix owns the reference, not the original evidence.

Lifecycle:

- created when mapping evidence to requirements
- refreshed when evidence changes

### 4.2 CoverageRow

Purpose:

Represent support level for one requirement.

Required fields:

- coverageRowId
- requirementId
- evidenceRefIds
- coverageStatus: direct, transferable, weak, missing, not-applicable
- supportStrength: strong, moderate, weak, none
- rationale
- risks

Relationships:

- belongs to Requirement
- references EvidenceRefs
- may produce MissingEvidence
- may produce CapabilityGap
- consumed by Claim Ledger

Ownership:

- Coverage Matrix

Lifecycle:

- created after evidence mapping
- versioned with Requirement Model and evidence version

### 4.3 MissingEvidence

Purpose:

Record important evidence absent from the candidate evidence bank.

Required fields:

- missingEvidenceId
- requirementId
- description
- severity
- expectedHandling
- forbiddenClaim

Relationships:

- derived from CoverageRows
- consumed by Claim Ledger and Product Quality Evaluator

Ownership:

- Coverage Matrix

Lifecycle:

- created when coverage is missing or weak
- resolved only when new evidence is added

### 4.4 CapabilityGap

Purpose:

Represent a truthful hiring risk.

Required fields:

- capabilityGapId
- requirementId
- missingEvidenceIds
- gapDescription
- severity
- interviewRisk
- safePositioning

Relationships:

- derived from MissingEvidence and CoverageRows
- consumed by Claim Ledger, WritingPlan, and Product Quality Evaluator

Ownership:

- Coverage Matrix

Lifecycle:

- created before writing
- immutable for Requirement Model and evidence version

## 5. Claim Ledger Domain

Primary responsibility:

Represent approved, generated, rejected, and retired claims.

### 5.1 Claim

Purpose:

Represent one statement the system may or may not use.

Required fields:

- claimId
- claimText
- claimType: skill, achievement, metric, ownership, leadership, technical, business-impact, domain, seniority
- approvalStatus: approved, rejected, needs-human-input, generated-pending-validation, retired
- confidence
- riskLevel
- allowedUse: summary, bullet, skills, notes, interview-prep, not-visible
- forbiddenStrengthening

Relationships:

- has ClaimSources
- may reference Requirements
- may be used by SentenceTrace

Ownership:

- Claim Ledger

Lifecycle:

- proposed from Coverage Matrix before writing
- approved before Writer can use it
- validated after writing
- retired when evidence changes or claim becomes unsafe

### 5.2 ClaimSource

Purpose:

Connect a claim to supporting evidence.

Required fields:

- claimSourceId
- claimId
- evidenceRefId
- supportType: direct, transferable, contextual, weak
- supportRationale
- sourceConfidence

Relationships:

- belongs to Claim
- references EvidenceRef

Ownership:

- Claim Ledger

Lifecycle:

- created during claim approval
- immutable unless evidence version changes

### 5.3 SentenceTrace

Purpose:

Trace every generated CV sentence to approved claims.

Required fields:

- sentenceTraceId
- cvVersionId
- sentenceId
- sentenceText
- claimIds
- traceStatus: fully-supported, partially-supported, unsupported, non-claim
- unsupportedReason

Relationships:

- belongs to CV version
- references Claims
- consumed by Product Quality Evaluator and Repair

Ownership:

- Claim Ledger

Lifecycle:

- created after Writer output
- regenerated after repair
- immutable for a content hash

### 5.4 WritingPlan

Purpose:

Define what the Writer may execute.

Required fields:

- writingPlanId
- requirementModelVersion
- coverageMatrixVersion
- approvedClaimIds
- forbiddenClaimIds or forbiddenClaimRules
- summaryClaimIds
- achievementClaimIds
- skillClaimIds
- keywordIds
- gapHandlingInstructions
- tone
- outputLength

Relationships:

- derived from Requirement Model, Coverage Matrix, and Claim Ledger
- consumed by Writer
- referenced by Product Quality Evaluator

Ownership:

- Claim Ledger owns claim authorization.
- WritingPlan is a derived execution artifact.

Lifecycle:

- created after claims are approved
- immutable for Writer execution
- regenerated when upstream versions change

## 6. Product Quality Evaluator Domain

Primary responsibility:

Evaluate final CV quality and explain failures.

### 6.1 QualityMetric

Purpose:

Represent one evaluation dimension.

Required fields:

- metricId
- name
- score
- threshold
- status: pass, warning, fail
- explanation
- evidence
- failureAction

Relationships:

- belongs to EvaluationResult
- may reference Requirements, CoverageRows, Claims, or SentenceTrace

Ownership:

- Product Quality Evaluator

Lifecycle:

- generated after CV and Claim Ledger validation
- regenerated when CV, ledger, or rubric changes

### 6.2 EvaluationResult

Purpose:

Represent full quality judgment for a CV version.

Required fields:

- evaluationResultId
- cvVersionId
- requirementModelVersion
- coverageMatrixVersion
- claimLedgerVersion
- overallScore
- decision: pass, pass-with-observations, fail
- blockingFailures
- metricIds
- recommendedRepairFocus
- evaluatedAt

Relationships:

- aggregates QualityMetrics
- consumed by Repair, Export, regression, and user-facing reports

Ownership:

- Product Quality Evaluator

Lifecycle:

- created after evaluation
- immutable for a CV content hash and rubric version

### 6.3 RepairInstruction

Purpose:

Translate quality failures into bounded repair focus.

Required fields:

- repairInstructionId
- evaluationResultId
- affectedMetricIds
- affectedClaimIds
- affectedSentenceIds
- repairType: remove-unsupported-claim, improve-readability, add-supported-keyword, clarify-gap, improve-business-impact, human-input-required
- allowedZones
- forbiddenChanges
- rationale

Relationships:

- derived from EvaluationResult
- consumed by Repair Runtime

Ownership:

- Product Quality Evaluator publishes repair focus.
- Repair Runtime decides execution mechanics.

Lifecycle:

- created when evaluation fails or warns
- superseded after repair and re-evaluation

## 7. Object Relationship Summary

```text
JobSnapshot
→ RequirementGroup
→ Requirement
→ CoverageRow
→ MissingEvidence / CapabilityGap
→ Claim
→ ClaimSource
→ WritingPlan
→ Generated CV
→ SentenceTrace
→ QualityMetric
→ EvaluationResult
→ RepairInstruction
```

## 8. Minimum Completeness Rule

The runtime is incomplete if:

- Requirements exist without coverage.
- Coverage exists without approved claims.
- Claims exist without evidence sources.
- Generated sentences exist without SentenceTrace.
- Quality scores exist without explanations.
- Export happens without matching CV, Claim Ledger, and EvaluationResult versions.
