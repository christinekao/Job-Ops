# Product Principles

Status: Highest-level product and UX guidance. Planning only.

These principles constrain future product decisions. They complement, and never replace, contracts, quality rules, accepted ADRs, and source-grounded evidence.

| Principle | Product rule | Observable implication |
|---|---|---|
| One Primary CTA | Each active workflow state has one obvious next action | No competing progression buttons |
| One Question Per Screen Area | A UI area answers one user question only | Review, repair, result, and export remain distinct |
| Guide, Don't Search | The product explains the next step and why | Users do not infer action from internal status labels |
| State Before Action | Show current state and blocker reason before proposing action | No repair CTA without its triggering condition |
| Progress Always Visible | A user can see what completed, runs now, and remains | Completed unchanged stages stay complete |
| Explain Every Blocker | A block names owner, contract area, and next resolution path | No generic failed/unknown message without context |
| AI Explains Before Acting | AI states scope, evidence, expected effect, and approval status | Semantic changes have a reviewable proposal |
| No Hidden AI Execution | Token-spending work is deliberate and visible | User-started run, cost/context shown where relevant |
| No Silent Failure | Every command returns success, blocked, no-safe-fix, or error | UI renders an explicit action receipt or failure reason |
| One Source of Truth | Domain decisions are made once and rendered by consumers | UI does not recreate workflow, CTA, or export policy |
| Evidence Before Eloquence | Credibility is more important than persuasive wording | Never invent evidence, metrics, ownership, or outcomes |
| Preserve Valid Work | A repair changes only permitted failed zones | Passed areas and valid prior content identities remain stable |
| Human Owns Meaning | People approve positioning, claims, business impact, and evidence selection | Automation handles mechanical, grounded work only |
| Progressive Disclosure | Diagnostics and fallback paths exist without becoming the normal workflow | Manual JSON and internal run metadata stay secondary |
| Recover Before Retry | Connection recovery checks status before spending more tokens | Unknown run state never defaults to rerun |
| Measure Before Optimizing | Product claims use baselines and repeatable metrics | Targets are labeled; estimates are not reported as results |
| Reversible by Design | High-impact changes have receipts, hashes, and rollback behavior | Failed repair retains last valid CV |
| Privacy and User Control | Career material is sensitive and user-controlled | Platform/agent expansion requires consent, data boundaries, and export/delete decisions |

## Conflict Resolution

When principles conflict, follow this order: user safety and truthfulness; accepted contracts/ADRs; explicit user instruction; then convenience or speed. Record unresolved conflicts rather than silently resolving them.

## Product Decision Check

Before approving a future feature, answer:

1. Which user question does it answer?
2. What is the single primary CTA?
3. What state and blocker explanation precede it?
4. What evidence, approval, and rollback rules constrain it?
5. Which measurable outcome improves without weakening truthfulness or user control?
