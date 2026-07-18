# Epic Roadmap

Status: Product planning backlog. No epic is executable without separately approved tasks.

| Epic | Goal | Priority | Dependencies | Estimated waves |
|---|---|---:|---|---:|
| PX-01 Workflow Clarity | Make the CV journey linear, state-led, and one-CTA | P0 | Phase 3 boundaries | 2–4 |
| PX-02 Recovery and Trust | Make run status, cancellation, retry, and advanced fallback understandable | P0 | PX-01, action receipts | 1–3 |
| PX-03 Product Measurement | Establish click/run/repair/convergence telemetry and baseline reporting | P1 | PX-01 metric definitions | 1–2 |
| CQ-01 Evaluation Corpus | Define representative JD/evidence/CV fixtures and Golden Evaluation operations | P0 | Phase 2 quality framework | 2–3 |
| CQ-02 Quality Diagnostics | Explain JD coverage, evidence coverage, fit risk, and review deltas without changing quality policy | P1 | CQ-01 | 2–4 |
| CQ-03 Generation Quality Loop | Use measured evaluations to improve bounded generation/repair decisions | P1 | CQ-01, CQ-02 | 3–5 |
| AA-01 Safe Orchestrator | Chain explicit workflow stages with idempotency, stop behavior, and no hidden token spend | P0 | PX-01, PX-02, CQ-01 | 3–5 |
| AA-02 Approval and Diff | Provide semantic change proposals with evidence links and rollback | P0 | AA-01, Human/AI boundary | 2–4 |
| AA-03 Autonomous Repair | Execute one safe repair pass per content identity and validate convergence | P1 | AA-01, AA-02, CQ-01 | 3–5 |
| PL-01 Product Data Foundation | Decide workspace/identity/data portability model | P0 | Validated local product value; ADRs | 2–4 |
| PL-02 Reliability and Observability | Add operational telemetry, backups, recovery, and release gates | P1 | PL-01 | 2–4 |
| PL-03 Collaboration and Integrations | Support sharing/integrations only with explicit consent and permissions | P2 | PL-01, privacy design | 3–6 |
| CA-01 Application Operating System | Integrate job discovery, pipeline tracking, and material generation around one decision context | P1 | PX-01, PL-01 | 3–6 |
| CA-02 Interview and Learning Loop | Turn grounded evidence and application outcomes into interview preparation and learning | P2 | CQ-01, CA-01 | 3–6 |
| CA-03 Career Analytics | Give users longitudinal insights with clear limits and source traceability | P3 | CA-01, PL-02 | 3–5 |

## Prioritization Rule

P0 epics remove trust, safety, or workflow-convergence risk. P1 epics improve measured product value. P2/P3 epics expand capability only after the preceding foundation is accepted. Estimates are planning ranges, not delivery commitments.
