# CV Builder Evidence-Driven System

Purpose: make CV generation evidence-driven instead of prompt-driven. The system must prevent generic, unsupported, or internally worded CVs by forcing a structured workflow before final CV output.

## Core Workflow

```text
JD Intake
-> JD Analysis
-> Evidence Bank Selection
-> Internal Term Translation
-> JD-to-Evidence Match
-> Candidate Positioning
-> CV Draft Generation
-> Quality Gate
-> Final Targeted CV
-> Version / Interview Prep
```

The app should not treat "Generate CV" as the first action. A CV can be generated only after the target JD, evidence, terminology, match table, and positioning are clear enough to defend in screening and interview.

## Evidence Bank Standard

Every important project or experience should eventually be represented in this structure:

```text
Evidence ID:
Project / Experience Name:
Internal Name:
Date / Period:
Candidate Role:
External-Friendly Description:
Audience:
Business Function:
Problem / Context:
Action I Took:
Tools / Systems Used:
Stakeholders:
Result / Impact:
Quantified Evidence:
Evidence Strength: Strong / Medium / Weak
Related JD Keywords:
Can Be Used In CV: Yes / No
Can Be Used In Interview: Yes / No
Confidentiality Risk:
CV Angle:
Notes:
```

Existing React data maps this into `EvidenceCard` fields:

- `title`: external-facing evidence name
- `proof`: source-grounded internal traceability
- `cvBullet` / `cvSafeBullet`: recruiter-facing wording
- `riskIfUsedWrongly`: how this evidence can be overstated
- `claimLevel`: how strongly it can be used in visible CV text
- `allowedVisibleClaims`: safe phrases supported by evidence
- `forbiddenVisibleClaims`: tempting but unsupported claims
- `visibilityUse`: CV Visible / Interview Only / Prompt Context Only / Do Not Use
- `blockedVisibleTerms`: internal terms that must not appear in final CV
- `confidence`: Grounded / Needs Review / Weak
- `evidenceTier`: Core / Supporting / Archive

## JD Analysis Output

Screening Analysis must produce:

- plain-language role summary
- must-have requirements
- strong advantage requirements
- nice-to-have requirements
- core responsibilities
- required skills split by technical, business, communication, domain, tools, and process
- seniority signals
- hidden hiring priorities
- ATS keywords
- JD-to-evidence mapping
- internal terminology translation
- remaining gaps
- candidate positioning

Unsupported JD requirements must stay as gaps. They must not become CV claims.

## Internal Terminology Rule

Before CV generation, the system must scan selected evidence for:

- internal project names
- internal system names
- internal workflow names
- internal team abbreviations
- internal product names
- ticket or case IDs
- internal document names
- internal process labels

For every internal term, the app should store:

```text
Original Internal Term
External-Friendly CV Wording
Audience
Business Function
Usage Decision: Keep with explanation / Replace / Remove
Reason
```

Visible CV text should use the external-friendly wording. Internal terms may stay only in proof, notes, or interview context when they help traceability.

## CV Generation Rules

The CV generator must obey the Screening Analysis:

- strong JD mappings can become visible CV proof
- partial mappings can be conservative transferable wording
- weak mappings cannot be headline claims
- unsupported mappings cannot appear in header, summary, skills, or work bullets
- missing keywords are not inserted unless the underlying evidence supports them
- internal terms marked Replace or Remove must not appear in visible CV text
- remaining high or medium gaps must be recorded in review notes or avoided entirely

The final CV should be targeted to one JD and should preserve all major career history, with detail weighted by JD relevance.

## Quality Gate

Generated CVs must be checked for:

- title alignment
- must-have keyword coverage
- evidence coverage
- ATS readability
- JD positioning
- hiring manager scan quality
- external resume readability
- internal terminology cleanup
- weak / unsupported JD-mapping claims
- overclaim risk

The current React Screening Lab implements this as:

```text
Career Evidence
-> JD Analysis
-> Terms + Gaps
-> CV Brief + Evidence
-> Screening CV
-> Gate + Manager Review
-> Reviewer + ATS/PDF Verification
```

CV export should happen only after the gate is clean enough to defend in HR screening and hiring-manager interview.

## Reviewer and Export Verification

Inspired by the drafter-reviewer and PDF/ATS verification pattern in `MadsLorentzen/ai-job-search`, React Screening Lab now separates:

1. Screening Gate
   - visible title alignment,
   - must-have keyword coverage,
   - selected evidence visibility,
   - internal terminology cleanup,
   - overclaim risk.

2. Hiring Manager Review
   - whether the manager would interview,
   - whether the first-page story matches the JD,
   - whether weak or unsupported requirements are controlled,
   - whether bullets answer the manager's pain points.

3. Reviewer Pass
   - HR scan,
   - manager relevance,
   - evidence traceability,
   - unsupported / weak claim control,
   - action-outcome bullet quality,
   - external wording.

4. ATS / PDF Verification
   - text-layer readability surrogate,
   - contact extraction,
   - section order,
   - keyword support,
   - visible work depth,
   - composed export content.

Current implementation is a local structured check, not a real PDF renderer. Future work should add browser/PDF rendering and text extraction verification before final export.

## External Reference: ai-job-search Patterns to Adopt

Reference: `MadsLorentzen/ai-job-search`.

Useful workflow patterns:

1. Profile setup before applications
   - Their `/setup` flow builds profile files from documents, a single CV import, or interview mode.
   - CV Builder equivalent: keep `CAREER_OS/` and React Career Evidence as the source of truth before any JD-specific CV generation.

2. Fit evaluation before drafting
   - Their `/apply` flow evaluates fit before drafting and asks whether to continue.
   - CV Builder equivalent: Screening Lab must complete JD Analysis and evidence mapping before CV generation.

3. Drafter-reviewer loop
   - Their `/apply` flow drafts, then uses a reviewer pass to critique missed keywords, company angles, action framing, and tone before revision.
   - CV Builder equivalent: after Screening CV generation, run the local Reviewer + ATS/PDF Verification step that checks HR screening, hiring-manager relevance, JD-specific missed keywords, action orientation, unsupported claims, external clarity, and export text readiness.

4. Mandatory verification
   - Their workflow compiles and inspects PDF output, then checks ATS text extraction.
   - CV Builder equivalent: after export, verify rendered PDF layout, text extraction/read order, contact information, dates, and evidence-supported keyword coverage.

5. Outcome calibration
   - Their `/outcome` flow records application result and uses resolved applications to recalibrate profile and fit logic.
   - CV Builder equivalent: application outcomes should update fit patterns, evidence strength, target role matrix, and future CV positioning.

6. Rank / upskill as later modules
   - Their `/rank` and `/upskill` flows batch-score jobs and produce gap-learning plans.
   - CV Builder equivalent: keep these as later Career OS modules after the evidence-driven CV workflow is stable.

Do not copy the full implementation directly:

- The reference project is Claude Code plus LaTeX oriented.
- This project is React/local JSON plus HTML/PDF oriented.
- Adopt the process gates, not the folder structure or technology stack.
