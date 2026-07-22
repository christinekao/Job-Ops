# Public JD URL Import Policy

Status: ACTIVE  
Document Type: PRODUCT_SECURITY_POLICY  
Authority: PRODUCT_POLICY  
Can Authorize Production Implementation: YES, only within Current Architecture

## Product Boundary

JD Intake supports two inputs into one canonical flow:

```text
Manual paste ───────────────┐
                            ├─> existing explicit Parse -> Preview/Edit -> Save/Update
Public URL -> safe server extraction ┘
```

Fetch/Extract is deterministic and never invokes AI, Screening, Evidence
selection, CV Brief, Writer, Reviewer, Repair, Export, or persistence. A Job is
created or updated only at the existing explicit Save/Update boundary.

Structured results may fill only the fixed canonical `ParsedJD` fields approved
by the product. External sites cannot dynamically create production columns.
Unknown scalar/list source fields are retained only as `additionalAttributes`
for preview and are excluded from identity, Screening, ranking, Evidence
selection, and Writer context. Empty values never clear manual content;
conflicting values preserve the manual value and are reported for review.

## Network Security

- Only public `http:` and `https:` URLs without embedded credentials are allowed.
- Submitted values must be plain URLs, never Markdown links. Known compensation,
  salary, or benefits pages are rejected as non-listing URLs.
- Local/internal hostnames and non-public IPv4/IPv6 ranges are rejected.
- DNS answers are validated before connection and the validated public address is pinned for that request.
- Every redirect repeats URL, DNS, and resolved-address validation.
- Redirect count, timeout, compressed bytes, decompressed bytes, content type, and encoding are bounded.
- Requests send no user cookies, authorization headers, login session, or form data and execute no remote JavaScript.
- Accepted response types are `text/html`, `application/xhtml+xml`, and `text/plain`; PDF/binary content is unsupported.

## Extraction Order

1. Schema.org JSON-LD `JobPosting`
2. Microsoft Careers anonymous same-origin position-details adapter, then server-rendered HTML fallback
3. Generic server-rendered HTML text extraction
4. Manual-paste fallback

Navigation, scripts, styles, headers, footers, forms, and obvious page chrome
are excluded by the bounded HTML fallback. Missing structured fields remain
missing and produce warnings; the importer must not invent them.

Remote response bodies and extractor/debug payload are server-internal and must
not be returned as canonical raw JD. Structured adapters build readable raw JD
from formal job fields. Generic HTML fallback prefers readable job containers
and fails closed when the extracted result is serialized application state,
theme/configuration data, navigation/localization/analytics configuration, or
component settings. It must not use arbitrary fixed-length truncation to hide
contamination.

Explicit source Skills arrays are deduplicated without changing reasonable
source casing. SEO, recommendation, taxonomy, and previous-hire keywords are
not promoted into Skills.

For Microsoft Careers, the adapter preserves complete job metadata, Overview,
Responsibilities, Required/Other/Preferred Qualifications, compensation, and
explicit Skills. If Microsoft publishes skills only inside Qualifications,
those statements remain intact and the importer reports that no independent
Skills field was supplied.

Microsoft's anonymous `position_insights` enhancement may additionally retain
previous-hire top skills and roles in fixed `employerInsights`. These are
informational supplemental employer signals—not formal skills, requirements,
preferred qualifications, candidate history, or Fit evidence. They are
excluded from identity, Screening/ranking, Evidence selection, and Writer.
Failure to retrieve this enhancement preserves core details and reports PARTIAL
coverage.

Other employers continue through standard JSON-LD JobPosting, generic HTML, and
manual fallback. A known-domain adapter cannot intercept another domain or
replace the shared pipeline.

## Identity and Provenance

`JobApplication.jdProvenance` stores source type, URL/domain, fetch time,
extraction method, warnings, and redirect count. It is optional and is excluded
from `computeJobContentHash()`.

`sourceUrl` preserves the original submitted URL. Optional provenance
`finalUrl` records the validated redirect destination. Neither affects content
identity.

Legacy Markdown or known non-listing `sourceUrl` values are not silently
rewritten or cleared. JD Intake and Screening show a recovery warning and
require the user to enter or re-fetch the actual listing URL before a new save.

Changes to canonical raw or parsed JD content continue through the existing P7
staleness chain. Provenance-only changes do not stale Screening, Brief, CV,
Review, or Export identity.

The JD Parse Prompt accepts only non-empty, bounded, recognizable canonical raw
JD. Empty, oversized, serialized, or application-state-contaminated input is
blocked before Copy Prompt with re-fetch and Manual Paste recovery. Validation
does not invoke AI and does not clear or rewrite user-entered text.

The hash owner uses an explicit canonical-field allowlist. Source URL,
provenance, extraction warnings, and `additionalAttributes` are excluded.

## Screening Prompt Provenance Projection

Screening receives a source URL only when it is a valid plain HTTP(S) job
listing. Markdown, malformed, and non-listing URLs are projected as an empty
URL plus a bounded provenance status. This status is not JD content and cannot
affect requirement identity, evidence mapping, Fit, or CV claims.

## Failure and Privacy

Typed public errors distinguish validation, network, redirect, limit, content,
and extraction failures without exposing internal IPs, stack traces,
credentials, filesystem paths, or DNS details. Failure preserves the entered
URL and existing manual JD text, creates no Job, and writes no canonical data.

Operational logs contain only event, domain, result category, extraction method,
warning count, duration, and response size. Full URLs, query parameters, JD
content, cookies, credentials, and authorization headers are not logged.

## Unsupported

Authenticated/client-only sites, browser automation, cookies, OAuth, PDF,
attachments, batch imports, crawling, monitoring, automatic Screening/Writer,
and automatic applications remain out of scope. Manual paste is the required
fallback.
