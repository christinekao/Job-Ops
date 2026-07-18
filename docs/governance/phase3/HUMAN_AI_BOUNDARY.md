# Human / AI Boundary

Status: Design only.

## Action classification

| Action | Owner | Classification | Approval rule |
|---|---|---|---|
| Parse JD and identify requirements | AI | Automatic | Stop for high-risk ambiguity |
| Build CV Brief and shortlist evidence | AI | Suggest + approval when changed | Human approves material evidence selection |
| Generate CV from grounded context | AI | Automatic | Output must pass schema and evidence validation |
| Remove duplicate bullets/summary | AI | Automatic | Preserve one grounded instance |
| Reorder sections/bullets | AI | Automatic | No meaning change |
| Grammar, formatting, external wording | AI | Automatic | Must preserve claim and evidence identity |
| Traceable wording repair | AI | Automatic | Only when source evidence supports wording |
| Unsupported or unsafe wording | AI | Suggest + approval | Show before/after and evidence links |
| Career positioning/title change | AI proposes; human owns decision | Approval Required | Never silently apply |
| Technical claim or business impact change | AI proposes; human owns decision | Approval Required | Evidence and diff required |
| Evidence selection/deletion | Human | Approval Required / Never Automatic for deletion | Explicit confirmation |
| Export | Human | Approval Required | User chooses export and any risk override |

## Never automatic

The system must not invent evidence, metrics, employers, technologies, ownership scope, business outcomes, or career narrative. It must not delete evidence or silently change positioning. It must not export a known-blocked CV without an explicit user override.

## Approval payload

Every approval request contains: changed field/section, before and after text, affected evidence IDs, failed check that triggered it, confidence/risk, and the single decision CTA. Rejecting preserves the last valid content identity.

