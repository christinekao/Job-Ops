# Review / Repair / Export Implementation Roadmap

Status: Design-only roadmap. No task is promoted or authorized.

| Rank | Implementation task | UX impact | Risk | Complexity | Expected click reduction | Expected confusion reduction |
|---:|---|---|---|---|---:|---|
| 1 | Introduce a single workflow-state resolver and primary-CTA selector | Very high | High | High | 4–8 | Very high |
| 2 | Normalize review results into PASS/WARNING/BLOCKING with contract severity | Very high | High | Medium | 2–4 | Very high |
| 3 | Split triage UI into Review Summary, Repair Plan, and Repair Result components | Very high | Medium | High | 4–6 | Very high |
| 4 | Add repair proposal/receipt model keyed by before/after content hashes | High | High | High | 2–4 | High |
| 5 | Implement bounded safe-repair execution with post-repair validation | Very high | High | High | 3–6 | High |
| 6 | Centralize export readiness and isolate explicit risk override | High | High | Medium | 1–3 | High |
| 7 | Remove duplicated reviewer/export check and blocker rendering | High | Medium | Medium | 2–4 | High |
| 8 | Move raw run/snapshot states to diagnostics and add `Check status` recovery | Medium | Medium | Medium | 1–2 | Medium |
| 9 | Add end-to-end fixtures for pass, warning, safe repair, approval, and export-blocked states | High | High | Medium | Indirect | High |
| 10 | Instrument state transitions, retries, clicks, and token use | Medium | Medium | Medium | Indirect | Medium |

## Sequencing constraints

Tasks 1 and 2 define shared state/semantics and precede component splitting. Task 4 precedes task 5. Task 6 must consume the same normalized severity as task 2. No implementation task may change evidence ownership, prompt ownership, persistence architecture, or auto-approve semantic CV changes.

