# Phase 2 Quality Gap Analysis

Status: Evidence-based comparison against `docs/governance/QUALITY_SPEC.md`. No canonical CV is assumed.

## Persisted Examples

| JD / CV | Confirmed state | Quality result |
|---|---|---|
| Power Platform Developer / `cv-mr4q83lz-cidl0` | 4 roles, 14 bullets, 9 evidence-linked, review `ready=false`, 2 gate issues, 3 reviewer issues | Summary is duplicated; 5 prior-role bullets lack IDs; local repair elevated AI/chatbot/Copilot evidence ahead of more relevant Power Platform evidence; 3 duplicate repair notes remain |
| AI Evaluation Scientist / `cv-mreyos3q-hdzt5` | 4 roles, 15 bullets, 10 with non-empty ID arrays, review `ready=false`, 0 gate issues, 5 reviewer issues | Email missing; 5 bullets have no IDs; 11 distinct IDs in bullet evidence arrays are skill/story/domain IDs rather than EvidenceCard IDs; target is conservatively repositioned away from the JD title |

## Transition Gap Matrix

| Transition | Missing Evidence | Business Impact | Technical Depth | Terminology | ATS | Manager Relevance | Narrative | Unsupported Claims | Redundancy | Confidence |
|---|---|---|---|---|---|---|---|---|---|---|
| JD -> Analysis | No confirmed loss | Manager intent is model-inferred | JD technical requirements are captured | Translation table requested | Keywords extracted | Manager problem inferred | Per-JD positioning created | Gaps explicitly recorded | Large overlapping output fields | Confirmed |
| Analysis -> Selection | Mapping coverage is not an explicit selection invariant | Outcome-rich evidence not required | Depth is approximated by lexical ranking | No terminology score in ranking | Frequent JD terms influence rank | Current-role evidence receives preference | Prior-role minimum is count-based | Weak/unsupported recommendations can be filtered, but generic fallback evidence is added | 18-item cap can include overlapping evidence | Confirmed |
| Selection -> Brief | Only top three mappings become the plan | `managerValue` may be copied from analysis language | Technical detail depends on chosen cards | Claims/blocked terms carried partially | Skills and positioning carried | Manager problem retained | Supporting evidence is secondary | Claims-to-avoid retained | Power persisted Brief has empty selling points/plan despite 10 must-show IDs | Confirmed |
| Brief -> Writer Input | Effective UI Brief can differ from prompt Brief | Full evidence JSON competes with concise manager plan | Large uncompressed objects dilute hierarchy | Fixed term blacklist plus analysis table | Large keyword/rule set | Multiple overlapping manager instructions | Evidence order becomes global array order | Constraints included but hard to prioritize | 159k-190k chars of JSON before instruction overhead; model-attention impact remains unproven | Confirmed |
| Writer Input -> Output | Evidence IDs optional; mixed ID namespaces accepted | No required impact field/quality threshold | No minimum technical specificity check | Prompt only; validator does not enforce | Output can omit contact and still apply | Prompt asks for manager relevance; validator does not | Model may compress or reposition role | Structural validator does not detect semantic overclaim | Prior-role generic bullets repeated across CVs | Confirmed |
| Output -> Reviewer | Reviewer counts any bullet with at least one valid evidence ID | Action verbs proxy for outcome | No direct technical-depth rubric | Fixed regex/audit coverage | Keyword matching is text based | Pain-point word overlap is a proxy | First-section/role-count heuristics only | Analysis gaps fail CV even when not claimed | No repetition/summary duplication check | Confirmed |
| Reviewer -> Repair | Free-text findings lose exact field/zone identity | Local repair adds action verbs but may not add real outcome | Evidence-card wording replaces authored technical structure | Fixed replacement dictionary, not analysis translation table | Keyword repairs may be suggested for Unknown support | Broad rewrite can reorder off-JD evidence first | Current role is forced into two generic Power Platform titles | Safe candidate filters exist, but relevance ordering is absent | Repeated review notes and summary concatenation | Confirmed |
| Repair -> Export | Five prior-role bullets remain untraced | Character count can pass without strong impact | No PDF-level depth assessment | Only visible text heuristics | Text length/keyword/contact proxies | Export is separated from manager review | Two roles/eight bullets is a structural floor | No new semantic validation | No duplicate-content check | Confirmed |

## QUALITY_SPEC Dimension Findings

| Dimension | Expected | Actual Evidence | Gap | Earliest Confirmed Stage | Confidence |
|---|---|---|---|---|---|
| JD positioning | One defensible target per JD | AI CV uses conservative adjacent title; Power CV target is correct but first evidence set is AI-heavy after repair | Positioning can be correct in header while narrative ordering is wrong | Repair for Power; Writer output for AI title divergence | Confirmed |
| Evidence coverage | Major visible claims trace to supported evidence | Both CVs have 5 bullets without IDs; AI CV mixes 11 non-EvidenceCard IDs | Traceability contract is not enforced | Writer Output | Confirmed |
| Unsupported claims | No unsupported visible promises | Prompt constrains them, but Reviewer fails based on analysis gaps rather than visible claims | Evaluation cannot distinguish honest gap from visible overclaim | Reviewer | Confirmed |
| Internal terminology | Internal names translated/removed | Current visible samples are mostly externalized; local repair uses a fixed replacement list | Fixed local replacement coverage is incomplete by construction; occurrence in current unseen outputs was not proven | Repair | Possible |
| Business impact | Action + capability + stakeholder/scope + business reason | Many bullets show action/scope; five prior-role bullets have no trace and several are generic | Action-verb checks do not ensure impact or decision relevance | Writer Output / Reviewer | Confirmed |
| Technical depth | Supported, role-relevant technical specificity | Power repair promotes chatbot/Copilot items before direct production-flow/governance evidence; AI CV includes mixed ID namespaces | Technical detail exists but selection/order is not reliably role-relevant | Writer Input / Repair | Confirmed |
| Action/outcome density | At least 65% | Reviewer checks action verbs; repair prepends `Supported`/`Delivered` | Metric can be gamed without stronger outcome | Reviewer / Repair | Confirmed |
| Representative project coverage | Strongest grounded projects visible | Global evidence-array order controls Writer/local-repair record order | Selection priority is not preserved | Selection -> Writer Input | Confirmed |
| HR readability | Contact, target, summary, skills, readable sections | AI CV has empty email; output validator accepts it | Contact source/validation gap | Writer Input / Output validation | Confirmed |
| Hiring manager relevance | First content answers manager problem | Power repaired first bullets emphasize chatbot/GPT/Copilot before Power Platform delivery evidence | Repair can move narrative away from JD | Repair | Confirmed |
| Length | 1.5-2 pages | Export checks characters, content length, roles, bullets | Actual page length is not verified | Export | Confirmed |
| Career narrative | Enough history, current role deepest | Both examples contain four roles; five prior-role bullets lack evidence IDs | Narrative breadth exists but traceability/quality of older roles is weak | Writer Output | Confirmed |
| Export readiness | Real ATS/PDF readable output | Local checks use composed text and character thresholds; browser/PDF not executed | Local readiness is not actual PDF verification; quality of current rendered PDFs remains unknown | Export | Confirmed |

## Information That Never Reaches Writer

- Raw source files and historical CV text, including the email visible in `source_material/original_cv_general_raw.txt`, are not part of `buildScreeningCvPrompt`.
- Career profile contains no structured email field; selected evidence contains no email. The AI Evaluation output therefore has an empty email and still passes Writer-output structural validation.
- Evidence outside the 18 selected evidence IDs and six selected stories is excluded by design.
- The ranking/priority semantics of selected IDs are not preserved because prompt inputs use `data.*.filter(...)` in global array order.

## Ideal/Reference Comparison Boundary

Historical PDFs and extracted CV text exist, but ADR-001 states that no CV is canonical. They can confirm career facts and contact/source content; they cannot define required wording, layout, or quality. All quality judgments in this audit therefore trace to `QUALITY_SPEC.md`, SPEC/FLOW, contracts, code, and persisted outputs.
