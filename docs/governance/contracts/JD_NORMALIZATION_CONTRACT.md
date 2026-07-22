# JD Normalization Contract

Status: ACTIVE CODE-GROUNDED REFERENCE  
Can authorize production implementation: No

## Owners

- URL extraction normalization: `CV_Manager_React/jdImportService.cjs`
- Canonical parsed-JD normalization, requirement IDs, content identity, and
  source-URL integrity checks: `CV_Manager_React/src/data/jobs.ts`

## Contract

- Preserve true bullet boundaries.
- Preserve structured API/JSON-LD/list-item boundaries before deterministic
  fallback reconstruction.
- Reassemble only adjacent incomplete clauses and controlled continuations;
  never merge across a section, terminal punctuation, or independent imperative.
- Retain raw fragments, original indices, reconstruction reason, section, and
  complete reconstructed source statement for debugging and lineage.
- Atomic decomposition and stable IDs occur only after reconstruction.
- Canonical JD normalization participates in content/input identity, so older
  Screening output becomes stale without destructive data migration.
- `sourceUrl` remains the plain submitted HTTP(S) job URL. Redirect destination
  remains provenance metadata only.
- Invalid legacy Markdown or malformed URLs are warned about, never guessed or
  silently rewritten.
