# Wave Master Plan

Status: Planning map. Every listed wave requires its own approved task set before execution.

| Phase | Wave | Goal | Expected output | Required docs | Dependencies | Suggested model | Reasoning | Stop conditions |
|---|---|---|---|---|---|---|---|---|
| 1 | G1 Governance baseline | Define rules/contracts/decisions | Governance v1 | Rules, contracts, ADRs | None | Codex GPT-5.6 Terra | 中 | Source conflict or missing decision |
| 2 | PI1 Context integrity | Stabilize Brief/evidence/context boundaries | Deterministic integrity fixtures | Contracts, completion report | Phase 1 | Codex GPT-5.6 Terra | 中 | Contract or legacy compatibility conflict |
| 2 | PI2 Output/review integrity | Guard output, traceability, duplicate/contact/reviewer behavior | Apply/export safeguards | Quality metrics, Golden Evaluation | PI1 | Codex GPT-5 | 中 | Quality regression or insufficient evidence |
| 3 | AC1 Domain authority | Centralize export/workflow decision ownership | Shared domain decision | Dependency audit/refactor plan | Phase 2 | Codex GPT-5 | 中 | ADR required or behavior drift |
| 3 | AC2 Presentation boundary | Move Step 7 rendering into props-driven panels | Review/repair/export panels | UX IA/matrix | AC1 | Codex GPT-5 | 中 | More than scoped production files |
| 3 | AC3 Action pipeline | Give final reviewer actions explicit lifecycle and refresh receipt | Action pipeline | Wave 3 report | AC1–AC2 | Codex GPT-5.6 Terra | 中 | Test regression or scope exceeds limit |
| 4 | PX1 Experience baseline | Measure current clicks, runs, token estimates, review iterations, and confusion points | Baseline dashboard/specification | Product metrics, research plan | Phase 3 | ChatGPT GPT-5.6 Terra | 中 | Metrics lack definitions/data source |
| 4 | PX2 State-led workflow | Implement validated user-visible state adapter and one-CTA flow | Product experience task set | State/CTA specs, acceptance tests | PX1 | Codex GPT-5 | 中 | UI would redefine domain policy |
| 4 | PX3 Recovery/fallback | Simplify status recovery and quarantine advanced fallback | Recovery UX and tests | Recovery policy, telemetry schema | PX2 | Codex GPT-5 | 中 | Token-spending retry becomes implicit |
| 5 | CQ1 Evaluation corpus | Select representative fixtures and baselines | Versioned evaluation corpus | Golden Evaluation operations | PX1, Phase 2 | ChatGPT GPT-5.6 Terra | 中 | Fixture evidence is insufficient |
| 5 | CQ2 Diagnostics | Add explainable quality deltas and score reporting | Quality diagnostics plan/tasks | Scorecard, regression checklist | CQ1 | Codex GPT-5 | 中 | Metric proxy weakens truthfulness |
| 5 | CQ3 Calibration | Improve bounded generation/repair based on measured deltas | Calibrated improvement tasks | Before/after evaluation report | CQ1–CQ2 | Codex GPT-5.6 Terra | 中 | Critical quality metric regresses |
| 6 | AA1 Orchestrator | Design and build explicit bounded stage orchestration | Orchestrator task set | Approval/rollback contracts | PX2, CQ1 | Codex GPT-5.6 Terra | 中 | Hidden AI or unbounded loop risk |
| 6 | AA2 Safe repair automation | Automate permitted repairs and validation | Repair receipt/rollback behavior | Auto-repair policy, tests | AA1 | Codex GPT-5.6 Terra | 中 | Evidence/meaning change is ambiguous |
| 6 | AA3 Semantic approval | Present diff/evidence/decision for human-owned changes | Approval experience | Human/AI boundary | AA1–AA2 | Codex GPT-5 | 中 | Approval payload incomplete |
| 7 | PL1 Platform ADRs | Decide identity, tenancy, privacy, data portability | Accepted architecture decisions | Security/privacy/migration docs | Proven Phase 4–6 value | ChatGPT GPT-5.6 Terra | 中 | Product/persistence authority unresolved |
| 7 | PL2 Platform foundation | Implement approved platform boundary | Platform MVP | Runbooks, migration tests | PL1 | Codex GPT-5.6 Terra | 中 | Migration/recovery validation fails |
| 8 | CA1 Career workflow | Design job/application/interview operating system | Career Agent product spec | Consent/evaluation docs | Phase 7 | ChatGPT GPT-5.6 Terra | 中 | User control or traceability unproven |
| 8 | CA2 Agent capabilities | Implement one bounded agent capability at a time | Atomic agent tasks | Capability-specific safety tests | CA1 | Codex GPT-5.6 Terra | 中 | Agent scope expands without approval |

## Universal Stop Conditions

- An ADR, privacy decision, contract owner, or migration plan is missing.
- A proposed wave changes runtime prompts, canonical data, persistence, or quality rules without explicit authorization.
- Metrics cannot be measured from named sources.
- Acceptance tests show a critical integrity, safety, or quality regression.
- The implementation scope exceeds its approved file/task limit.
