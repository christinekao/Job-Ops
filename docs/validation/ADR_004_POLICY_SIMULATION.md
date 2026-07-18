# ADR-004-SIM-001 - Positioning Policy Validation

Status: COMPLETE

Date: 2026-07-17

AI: Codex

Model: GPT-5.6 Sol

Reasoning: High

Scope: Simulation only. No production code, prompt, runtime, UI, persistence, reviewer scoring, or ADR-004 implementation change was made.

Inputs:

- `docs/adr/ADR-004_POSITIONING_POLICY.md`
- `docs/governance/architecture/ARCH_VERIFY_001_REPORT.md`
- Current runtime contracts and architecture documents

## 1. Executive Summary

ADR-004 should improve the observed product behavior, but it does not solve every issue found by architecture verification.

The policy directly targets the confirmed product failure in the Azure Solution Specialist case: Analysis correctly identified `Avoid`, but Writer still produced wording that could read like direct Azure sales qualification. Review/Export then blocked the CV after generation.

ADR-004 changes the intended interpretation of fit classification:

- fit tier becomes a positioning strategy signal;
- generation remains allowed for all tiers;
- weak fit is written as transferable fit, not direct fit;
- unsupported requirements become visible gaps, not claims;
- Reviewer distinguishes unsupported claims from truthful capability gaps.

Simulation result:

| Question | Result |
|---|---|
| Does ADR-004 reduce unsupported wording? | YES |
| Does ADR-004 reduce unnecessary repair loops? | YES |
| Does ADR-004 improve reviewer consistency? | YES |
| Does ADR-004 preserve truthfulness? | YES |
| Does ADR-004 increase interview probability without increasing fabrication risk? | YES, with constraints |

Important boundary: ADR-004 does not solve the ARCH-VERIFY root cause of incomplete end-to-end observability. It improves the decision policy that feeds Writer/Review/Repair, while `ADD OBSERVABILITY` remains valid for trace/debug durability.

Final decision is stated once in section 9.

## 2. Simulation Results

### Case A - Good Fit

Assumption: candidate evidence strongly supports the JD. There are direct EvidenceCard links for core requirements, no material high-risk gaps, and Analysis support levels are mostly `Strong`.

| Stage | Simulated ADR-004 behavior |
|---|---|
| 1. Analysis result | Analysis identifies direct support between JD requirements and evidence. Positioning Report classifies `overallFit: Good`, with supported strengths and few or no unsupported requirements. |
| 2. Fit Tier | Good Fit. Existing `Strong` / `Good` apply-tier language maps cleanly to `Good`. |
| 3. Positioning Strategy | Direct positioning. Target title and headline can closely match the JD because evidence supports it. |
| 4. Writer behavior | Writer maximizes strengths and uses direct claims only where supported by selected evidence and allowed visible claims. |
| 5. Generated CV characteristics | Strong JD-specific summary, high keyword relevance, evidence-backed bullets, direct but not inflated role alignment. |
| 6. Reviewer behavior | Reviewer sees supported claims as supported. Capability gaps are minor or absent. Unsupported-claim checks remain active. |
| 7. Repair behavior | Minimal or no repair. Any repair is likely formatting, wording, contact, density, or minor evidence coverage rather than positioning. |
| 8. Export decision | Likely export-ready if structural/export checks pass. |
| 9. User experience | User sees why the role is strong and can proceed with confidence. The Positioning Report is useful but not noisy. |

Validation judgment: ADR-004 does not weaken good-fit behavior. It preserves current strengths and adds a clearer explanation layer.

### Case B - Risky Fit

Assumption: candidate has partial evidence. Some JD requirements are supported directly; some are adjacent or weak; some important requirements are missing.

| Stage | Simulated ADR-004 behavior |
|---|---|
| 1. Analysis result | Analysis separates supported strengths, partial matches, unsupported requirements, and risky claims. Positioning Report classifies `overallFit: Risky`. |
| 2. Fit Tier | Risky Fit. It does not block generation. |
| 3. Positioning Strategy | Adjacent positioning. The CV emphasizes proven adjacent strengths and names missing evidence in the Risk Summary. |
| 4. Writer behavior | Writer generates the CV but avoids making partial evidence sound direct. It uses wording such as "supported", "coordinated", "enabled", or "translated" only where those claims are evidenced. |
| 5. Generated CV characteristics | CV is useful and JD-specific, but it avoids pretending full ownership. Risk Summary explains missing evidence and recommended positioning adjustments. |
| 6. Reviewer behavior | Reviewer separates two cases: unsupported direct claims remain blockers; truthful gaps reduce readiness without being labeled hallucinations. |
| 7. Repair behavior | Repair targets actual unsupported wording. It should not repeatedly regenerate truthful gaps that cannot be solved without new evidence. |
| 8. Export decision | Export may pass if the role is adjacent enough and the CV is truthful. It may remain blocked if manager readiness is too low. |
| 9. User experience | User understands what is strong, what is weak, and what can be repaired versus what requires new evidence or a different role angle. |

Validation judgment: ADR-004 materially improves risky-fit behavior because it gives Writer and Reviewer a shared distinction between "overclaim" and "truthful gap."

### Case C - Weak Fit: Azure Solution Specialist

Known current state from architecture verification:

- Job: Microsoft / Azure Solution Specialist
- Job ID: `jd-mriv6lu5-9t2l0`
- `screeningAnalysis.positioning.applyTier`: `Avoid`
- `job.fit`: `Unknown`
- CV generation completed
- Review failed with 2 Gate issues and 5 reviewer/export issues
- Export blocked
- Original Summary contained unsupported Azure commercial wording
- Evidence does not support quota ownership, Azure consumption growth ownership, enterprise deal closure, executive selling, partner co-selling, Azure architecture delivery, or cloud migration leadership

| Stage | Simulated ADR-004 behavior |
|---|---|
| 1. Analysis result | Analysis still classifies the role as weak/avoid. It emits a Positioning Report with `overallFit: Weak`, transferable Microsoft ecosystem strengths, unsupported Azure sales requirements, and remaining hiring risks. |
| 2. Fit Tier | Weak Fit / Avoid. Generation is still allowed. |
| 3. Positioning Strategy | Transferable positioning. The CV does not claim Azure Solution Specialist qualification; it positions the candidate as a Microsoft ecosystem / Copilot / Power Platform / automation enablement profile with explicit sales-role gaps. |
| 4. Writer behavior | Writer generates a CV but must not invent quota ownership, Azure sales ownership, enterprise deal ownership, executive relationship ownership, Azure architecture delivery, or cloud migration leadership. Unsupported JD requirements become gaps or risks, not strengths. |
| 5. Generated CV characteristics | Summary should be conservative and externally readable. Work bullets remain evidence-backed. Risk Summary explains that the candidate can support Microsoft solution enablement but lacks direct enterprise Azure sales evidence. |
| 6. Reviewer behavior | Reviewer should not flag a truthful transferable Summary as hallucinated merely because the JD remains a weak fit. It should still block any direct unsupported Azure sales claim. Capability gaps remain readiness/export risks. |
| 7. Repair behavior | Repair should not loop on "make this sound more like Azure Solution Specialist" when no evidence supports it. It should either remove unsupported wording, preserve truthful transferable wording, or route to human decision/evidence-needed. |
| 8. Export decision | Export likely remains blocked if manager readiness is too low, but the blocker reason changes from unsupported wording/overclaim to truthful capability gap and weak hiring fit. |
| 9. User experience | User receives a usable truthful CV draft plus a clear explanation: strong Microsoft ecosystem evidence exists, but interview probability is reduced because direct Azure quota/sales/deal evidence is missing. |

Validation judgment: ADR-004 improves the Azure case. It does not guarantee export readiness, and that is correct. The expected better outcome is not "export succeeds"; it is "generation remains truthful, repair does not chase impossible unsupported positioning, and the user understands the remaining hiring risk."

## 3. Before vs After

| Stage | Current | ADR-004 |
|---|---|---|
| Analysis | Produces `applyTier`, gaps, risky claims, and safest positioning, but fit interpretation can be treated inconsistently downstream. | Produces or feeds a structured Positioning Report that states fit, transferable strengths, unsupported requirements, recommended positioning, and remaining risks. |
| Fit Tier | `Avoid` can coexist with Writer attempting to maximize exact-role fit. | Fit tier is explicitly a positioning strategy signal, not a generation permission gate and not direct-fit pressure. |
| CV Brief | Carries target positioning, evidence, claims to avoid, and Summary angle. | Carries the same evidence/brief structure, but aligned to Positioning Report constraints so weak fit becomes transferable positioning. |
| Writer Input | Uses Analysis/Brief/selected evidence, but unsupported requirements may still compete with "maximize fit." | Writer receives explicit unsupported requirements and `mustNotClaim` constraints as first-class policy input. |
| Writer Output | May produce unsupported direct-fit wording, then rely on Review/Repair to reject it. | Should produce the strongest truthful CV, with direct claims only when supported and gaps preserved as gaps. |
| Review | Detects unsupported claims and capability weakness, but language can collapse both into red blockers. | Distinguishes Unsupported Claims from Truthful Capability Gaps. Dangerous claims remain blockers. Truthful gaps reduce readiness without being mislabeled hallucinations. |
| Repair | May repeatedly target role-fit wording even when missing evidence makes the requested improvement impossible. | Repairs unsupported wording; avoids rewrite loops for truthful gaps; routes evidence-needed/human-positioning decisions explicitly. |
| Export | Blocks when review/export rules fail; Azure remains blocked. | Still blocks when quality/readiness fails, but the reason is clearer: unsupported claim versus truthful capability gap. |
| User Experience | User sees a generated CV fail review and may interpret it as a broken pipeline or repair failure. | User sees the strongest truthful CV plus clear explanation of strong evidence, weak evidence, remaining risk, and why export may still be blocked. |

## 4. Benefits

1. Reduces unsupported wording.

ADR-004 places the truth boundary before Writer output. The current system catches unsupported wording downstream; ADR-004 instructs Writer not to generate that wording in the first place.

2. Preserves generation for weak-fit roles.

The policy avoids a bad product outcome where weak-fit roles receive no CV. It allows a useful transferable-positioning CV while keeping claims truthful.

3. Reduces pointless repair.

If the only remaining issue is missing evidence, repair should stop trying to rewrite the CV into direct fit. This matches the Azure case, where repeated Summary regeneration could not create quota/Azure sales evidence.

4. Improves user comprehension.

The Positioning Report gives the user a stable explanation of:

- what is strong
- what is transferable
- what is unsupported
- why interview probability is lower
- what must not be claimed

5. Keeps export quality-gated.

ADR-004 does not force export readiness. It allows truthful CV generation while preserving reviewer/export blocking authority.

## 5. Validation Questions

### Q1. Does ADR-004 reduce unsupported wording?

YES.

Reason: it moves unsupported requirement handling into the positioning policy before Writer output. In the Azure case, the Writer would be explicitly prohibited from turning missing Azure sales evidence into direct Azure Solution Specialist claims.

Limit: this depends on implementation making Positioning Report and `mustNotClaim` constraints first-class Writer inputs, not merely documentation.

### Q2. Does ADR-004 reduce unnecessary repair loops?

YES.

Reason: it separates impossible capability gaps from repairable unsupported wording. If a Summary is truthful but the candidate still lacks Azure sales evidence, targeted regeneration should not keep trying to "fix" the gap by stronger wording.

Limit: repair routing must consume structured blocker categories. If it continues parsing prose blockers only, loop reduction will be incomplete.

### Q3. Does ADR-004 improve reviewer consistency?

YES.

Reason: Reviewer gets a policy distinction between unsupported claims and truthful capability gaps. The same weak-fit CV can be export-blocked for readiness without being mislabeled as fabricated.

Limit: ADR-004 explicitly does not change reviewer scoring. Consistency improves only after Review contract/types/UI adopt structured categories.

### Q4. Does ADR-004 preserve truthfulness?

YES.

Reason: the policy explicitly forbids fabrication, exaggeration, unsupported ownership, unsupported leadership, unsupported architecture ownership, and stronger claims not backed by evidence.

Limit: truthfulness is preserved only if Writer output validation and Review continue to block direct unsupported claims. ADR-004 must not be implemented as "weaker reviewer rules."

### Q5. Does ADR-004 increase interview probability without increasing fabrication risk?

YES, with constraints.

Reason: for Good Fit and Risky Fit, it lets the system maximize supported evidence more cleanly. For Weak Fit, it improves the user's chance only within truthful boundaries by creating a credible transferable-positioning CV instead of a misleading direct-fit CV.

Constraint: for roles like Azure Solution Specialist, interview probability may remain low. ADR-004 improves quality and clarity; it does not manufacture fit.

## 6. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Users misunderstand Weak Fit as "still recommended." | User may apply to roles with low probability. | Label Weak Fit plainly: generation allowed does not mean role is recommended. |
| Too many warnings. | User may ignore the Positioning Report. | Keep the main report short; move detailed unsupported requirements to expandable details. |
| Reviewer rules get weakened accidentally. | Dangerous unsupported claims could pass. | Keep Unsupported Claims as hard blockers. Do not change scoring thresholds under ADR-004 implementation unless separately approved. |
| Export policy becomes inconsistent. | A truthful weak-fit CV may look "clean" but still not manager-ready. | Export blockers must state whether the issue is unsupported claim, capability gap, or document/export readiness. |
| Writer becomes too conservative. | Good/Risky fits may lose persuasive strength. | Require Writer to maximize supported strengths, not merely avoid risk. |
| Positioning Report becomes another competing authority. | SSOT confusion could increase. | Make Analysis the owner and Writer/Brief/Review consumers. Avoid independent fit recomputation. |
| Observability remains unsolved. | Debugging exact historical outcomes remains difficult. | Keep ARCH-VERIFY recommendation `ADD OBSERVABILITY` as a separate follow-up. |

## 7. Open Questions

1. Should `overallFit` replace or coexist with current `applyTier` values `Strong | Good | Stretch | Avoid`?

Recommendation: coexist initially with a deterministic mapping for compatibility.

2. Should Positioning Report be persisted inside `ScreeningAnalysis`, `CvVersion.generationContext`, or both?

Recommendation: own it in `ScreeningAnalysis`; copy a snapshot identity or compact snapshot into generation context only if traceability requires it.

3. What exact UI language should distinguish "not recommended" from "still generated"?

Recommendation: use plain language: "Weak fit: CV generated with transferable positioning. Export may remain blocked because core evidence is missing."

4. Should truthful capability gaps block export?

Recommendation: yes when they materially reduce manager readiness, but they must not be labeled hallucinations.

5. Should ADR-004 implementation be combined with observability?

Recommendation: no. Implement policy first with focused validation. Observability remains a separate architecture follow-up.

## 8. Implementation Readiness

Readiness: **Ready for a scoped implementation task, not a broad refactor.**

Required implementation boundaries:

- update contracts first;
- add typed Positioning Report;
- pass Positioning Report into Writer/Brief/Review paths;
- preserve current pipeline stages;
- preserve export authority;
- preserve reviewer hard blockers for unsupported claims;
- add Azure Solution Specialist as a regression fixture;
- do not weaken validation to force export success.

Required validation:

- Good Fit fixture: supported direct positioning passes without fabricated claims.
- Risky Fit fixture: partial evidence generates Risk Summary and truthful adjacent positioning.
- Azure Weak Fit fixture: CV generation succeeds, unsupported Azure sales claims are absent, capability gaps remain visible, and export may remain blocked with correct reason.
- Repair fixture: truthful capability gap does not trigger repeated targeted rewrites.
- Reviewer fixture: unsupported claim and truthful capability gap produce different categories.
- Existing no-AI, writer-input, writer-output, summary-quality, reviewer, export-readiness, targeted-regeneration, product acceptance, and build checks remain passing.

## 9. Final Recommendation

**Proceed to Implementation**

Reason:

ADR-004 addresses the observed product-policy failure without requiring architecture redesign or pipeline changes. It should reduce unsupported wording, reduce repair loops, improve reviewer language consistency, and preserve truthfulness.

Implementation must remain narrow. It should not weaken reviewer/export gates and should not claim to solve the separate ARCH-VERIFY root cause of incomplete observability.
