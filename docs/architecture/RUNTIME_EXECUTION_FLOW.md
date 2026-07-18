# Runtime Execution Flow

## 1. Purpose

This document defines the execution sequence for the minimum runtime architecture.

The sequence is decision-first:

```text
Requirements
→ Coverage
→ Claims
→ Writing
→ Evaluation
→ Repair
→ Export
```

## 2. Step-by-Step Flow

### Step 1 — JD Enters

Input:

- raw JD
- role title if available
- company context if available

Output:

- JobSnapshot

Decision produced:

- none yet; this is input capture

Failure conditions:

- JD is empty
- JD is too ambiguous to identify a role
- JD source is corrupt

Recovery strategy:

- ask user for a valid JD
- allow user to provide role title or context

### Step 2 — Requirement Extraction

Input:

- JobSnapshot

Output:

- RequirementGroups
- Requirements
- HiringSignals
- Keywords
- seniority expectation

Decision produced:

- Requirement Model

Failure conditions:

- requirements are not atomic
- hard requirements are unclear
- inferred signals are not labeled as inferred

Recovery strategy:

- rerun requirement extraction
- ask user for target clarification only if JD is genuinely ambiguous

### Step 3 — Evidence Mapping

Input:

- Requirement Model
- candidate evidence bank

Output:

- EvidenceRefs
- preliminary CoverageRows

Decision produced:

- evidence-to-requirement support links

Failure conditions:

- no evidence exists
- evidence cannot be linked to any requirement
- evidence confidence is missing

Recovery strategy:

- ask user to add evidence
- permit weak generic CV only if user explicitly accepts limited evidence
- never invent missing evidence

### Step 4 — Coverage Computation

Input:

- Requirements
- EvidenceRefs
- support links

Output:

- CoverageRows
- MissingEvidence
- CapabilityGaps

Decision produced:

- Coverage Matrix

Failure conditions:

- critical requirements have unknown status
- missing evidence is not represented
- transferable evidence is mislabeled as direct

Recovery strategy:

- mark coverage as missing or weak
- route to human evidence input if evidence may exist
- continue only with truthful gap handling

### Step 5 — Positioning Decision

Input:

- Requirement Model
- Coverage Matrix
- CapabilityGaps
- transferable evidence

Output:

- positioning notes inside WritingPlan
- safe target angle
- fit strategy
- gap handling direction

Decision produced:

- strongest truthful positioning

Failure conditions:

- multiple truthful strategies conflict
- direct-fit positioning is unsupported
- weak-fit risk is hidden

Recovery strategy:

- request human preference if multiple truthful strategies exist
- downgrade to transferable positioning
- keep capability gaps visible

Runtime note:

Positioning is not a separate runtime domain in the minimum architecture. It is a derived decision produced from Requirement Model and Coverage Matrix and recorded in WritingPlan.

### Step 6 — Claim Approval

Input:

- Coverage Matrix
- evidence confidence
- capability gaps
- positioning notes

Output:

- approved Claims
- rejected Claims
- Claims to avoid
- ClaimSources

Decision produced:

- Claim Ledger pre-writing approval

Failure conditions:

- claim lacks evidence
- claim overstates support
- claim implies unsupported ownership, leadership, quota, deal, customer-facing responsibility, architecture ownership, seniority, or technical depth

Recovery strategy:

- reject claim
- weaken claim to evidence-supported wording
- request human evidence input
- omit unsafe claim from visible CV

### Step 7 — Writing Plan Generation

Input:

- Requirement Model
- Coverage Matrix
- approved Claims
- rejected Claims
- Keywords
- gap handling direction

Output:

- WritingPlan

Decision produced:

- execution plan for Writer

Failure conditions:

- plan contains unapproved claims
- plan omits critical supported evidence
- plan has no gap handling for critical gaps

Recovery strategy:

- regenerate WritingPlan from approved claims
- block Writer until plan is complete

### Step 8 — Writer

Input:

- WritingPlan
- approved Claims
- allowed tone and length
- output schema

Output:

- Draft CV

Decision produced:

- none. Writer executes the plan.

Failure conditions:

- Writer introduces unapproved claim
- Writer changes positioning
- Writer omits required approved claim
- Writer creates unsupported metric or ownership implication

Recovery strategy:

- run Claim Ledger validation
- reject unsupported sentences
- repair only affected zones

### Step 9 — Claim Ledger Validation

Input:

- Draft CV
- approved Claims
- ClaimSources

Output:

- SentenceTrace
- generated claim instances
- unsupported claim list
- claim confidence updates

Decision produced:

- final claim support status

Failure conditions:

- generated sentence cannot map to approved claim
- sentence has partial support only
- sentence contradicts evidence

Recovery strategy:

- mark sentence unsupported
- create repair instruction
- remove or weaken sentence

### Step 10 — Product Quality Evaluation

Input:

- Draft or repaired CV
- Requirement Model
- Coverage Matrix
- Claim Ledger
- SentenceTrace

Output:

- QualityMetrics
- EvaluationResult
- RepairInstructions if needed

Decision produced:

- product quality decision

Failure conditions:

- unsupported claims remain
- truthfulness below threshold
- critical evidence missing
- coverage too weak
- interview readiness too low
- readability below threshold

Recovery strategy:

- route to repair if bounded and evidence-backed
- route to human input if evidence is missing
- mark as fail if unsafe

### Step 11 — Repair

Input:

- RepairInstructions
- affected Claims
- affected SentenceTrace
- current CV

Output:

- repaired CV version

Decision produced:

- no new product strategy decision; repair executes bounded correction

Failure conditions:

- repair needs evidence not present
- repair would alter approved positioning
- repair would mutate non-repairable capability gap

Recovery strategy:

- request human input
- leave gap visible
- stop repair loop
- keep last valid CV version

### Step 12 — Re-evaluation

Input:

- repaired CV
- prior Claim Ledger
- RepairInstructions

Output:

- new SentenceTrace
- new EvaluationResult

Decision produced:

- repaired quality decision

Failure conditions:

- same blocking failures remain
- repair created new unsupported claims

Recovery strategy:

- stop automatic repair
- report remaining blockers
- ask for human decision or evidence

### Step 13 — Export

Input:

- accepted CV version
- matching Claim Ledger version
- passing or accepted-risk EvaluationResult

Output:

- export artifact
- export metadata

Decision produced:

- export readiness

Failure conditions:

- exported content does not match accepted CV
- ATS parse risk is unacceptable
- evaluation result is stale
- unsupported claim remains

Recovery strategy:

- block export
- regenerate export from accepted version
- require explicit known-risk override only for non-truthfulness issues

## 3. Flow Invariants

1. Requirement Model must exist before Coverage Matrix.
2. Coverage Matrix must exist before Claim Ledger approval.
3. Claim Ledger approval must exist before Writer.
4. Writer may not create new decisions.
5. Every generated sentence must map to Claim IDs or be classified as non-claim.
6. Unsupported generated claims must not be exported.
7. Product Quality Evaluator must explain failures, not only score them.
8. Repair cannot change Requirement Model, Coverage Matrix, or upstream claim boundaries.
9. Export cannot override truthfulness failure.

## 4. Domain Interaction Rules

| Domain | Owns | Consumes | Publishes | Downstream must never modify |
|---|---|---|---|---|
| Requirement Model | Requirements, groups, keywords, hiring signals | raw JD | Requirement Model version | requirement text, priority, criticality |
| Coverage Matrix | coverage status, evidence links, missing evidence, capability gaps | Requirement Model, evidence | Coverage Matrix version | coverage status, missing evidence, gap severity |
| Claim Ledger | claim approval, claim sources, sentence trace | Coverage Matrix, CV text | Claim Ledger version | claim approval, evidence links, sentence trace for content hash |
| Product Quality Evaluator | scores, explanations, quality decision, repair focus | CV, Requirement Model, Coverage Matrix, Claim Ledger | EvaluationResult | score evidence, blocking failures, thresholds for rubric version |

## 5. Failure Recovery Principles

- Missing JD: ask user.
- Missing evidence: ask user or proceed with explicit gap.
- Unsupported claim: remove or weaken; never ask Writer to justify it.
- Capability gap: disclose; do not repair into strength.
- Readability issue: repair bounded wording.
- ATS issue: repair format or keyword placement only if supported.
- Stale evaluation: re-evaluate.
- Export mismatch: block export.

## 6. Minimal Production Flow

The minimum production-ready flow is:

```text
JobSnapshot
→ Requirement Model
→ Coverage Matrix
→ Claim Ledger approved claims
→ WritingPlan
→ Draft CV
→ SentenceTrace
→ EvaluationResult
→ Repair if needed
→ Accepted CV
→ Export
```

Anything beyond this is optional until the product proves this flow improves CV quality.
