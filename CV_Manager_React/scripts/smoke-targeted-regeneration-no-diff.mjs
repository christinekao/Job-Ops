import { strict as assert } from "node:assert";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

async function bundle(entry, name) {
  const outfile = join(process.cwd(), "reports", ".smoke-bundles", `${name}-${Date.now()}.mjs`);
  await build({ entryPoints: [entry], bundle: true, format: "esm", platform: "node", outfile, logLevel: "silent" });
  return import(pathToFileURL(outfile).href);
}

const { createRegenerationAttemptIdentity, canDispatchTargetedRegeneration, isAttemptForRequest } = await bundle("src/domain/targetedRegenerationFeedback.ts", "targeted-no-diff-guard");

const request = {
  id: "targeted-regeneration-feedback",
  blockerIds: ["blocker-summary-role-fit"],
  cvVersionId: "cv-feedback-1",
  cvContentHash: "cv-hash-1",
  targetZones: ["summary"],
  selectedEvidenceIds: ["ev-1", "ev-2"],
  effectiveCvBriefHash: "brief-hash-1",
  preservedZones: ["header.contact", "sidebar.skills", "workExperience"],
  prohibitedZones: ["header.contact", "sidebar.skills", "workExperience"],
  reason: "Summary needs clearer role fit"
};
const identity = createRegenerationAttemptIdentity(request);
const attempt = { ...identity, outcome: "no-diff-terminal", attemptCount: 1, lastAttemptedAt: "2026-07-16T00:00:00.000Z", finalStopReason: "no-safe-content-difference", message: "No safe content change." };

assert.equal(createRegenerationAttemptIdentity({ ...request }).key, identity.key, "same unchanged context must produce the same attempt key");
assert.equal(isAttemptForRequest(attempt, { ...request }), true);
assert.equal(canDispatchTargetedRegeneration({ attempt, request }), false, "same-context no-diff must reject accidental execution");
assert.equal(canDispatchTargetedRegeneration({ attempt, request, explicitRetry: true }), true, "explicit retry must be allowed");
assert.notEqual(createRegenerationAttemptIdentity({ ...request, cvContentHash: "cv-hash-2" }).key, identity.key, "CV hash change must clear terminal identity");
assert.notEqual(createRegenerationAttemptIdentity({ ...request, effectiveCvBriefHash: "brief-hash-2" }).key, identity.key, "Brief hash change must clear terminal identity");
assert.notEqual(createRegenerationAttemptIdentity({ ...request, selectedEvidenceIds: ["ev-1", "ev-3"] }).key, identity.key, "evidence context change must clear terminal identity");
assert.notEqual(createRegenerationAttemptIdentity({ ...request, blockerIds: ["blocker-summary-role-fit-v2"] }).key, identity.key, "material blocker change must clear terminal identity");
assert.equal(createRegenerationAttemptIdentity({ ...request, updatedAt: "2027-01-01T00:00:00.000Z" }).key, identity.key, "timestamp-only metadata must not clear terminal identity");

console.log(JSON.stringify({ ok: true, coverage: ["stable attempt key", "explicit retry", "CV context change", "Brief context change", "evidence context change", "blocker change", "timestamp ignored"] }, null, 2));
