import { strict as assert } from "node:assert";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

async function bundle(entry, name) {
  const outfile = join(process.cwd(), "reports", ".smoke-bundles", `${name}-${Date.now()}.mjs`);
  await build({ entryPoints: [entry], bundle: true, format: "esm", platform: "node", outfile, logLevel: "silent" });
  return import(pathToFileURL(outfile).href);
}

const { buildTargetedRegenerationValidationDiagnostic, formatValidationDiagnosticMessage } = await bundle("src/domain/targetedRegenerationDiagnostics.ts", "regeneration-validation-diagnostics");
const { contentHash } = await bundle("src/utils/hash.ts", "regeneration-validation-diagnostics-hash");

const currentCv = {
  jdAnalysis: { targetRole: "Azure Solution Specialist", coreRequirements: [], topKeywords: [], gaps: [] },
  header: { name: "Alex Chen", targetRole: "Azure Solution Specialist", email: "alex@example.com", location: "Taipei" },
  sidebar: { languages: [], skillGroups: [], certifications: [], education: [] },
  summary: "Customer enablement specialist supporting cloud adoption. Evidence-led delivery partner.",
  workExperience: [{ experienceId: "role-1", company: "Acme", role: "Specialist", period: "2022-Present", location: "Taipei", subsections: [{ title: "Impact", bullets: [{ text: "Supported customer adoption with documented delivery outcomes.", evidenceIds: ["evi-1"], confidence: "Grounded" }] }] }],
  keywordPlacementNotes: [], interviewNotes: [], reviewNotes: []
};
const cvHash = contentHash(currentCv);
const request = {
  id: "targeted-diagnostic-1",
  blockerIds: ["Summary needs clearer role fit"],
  cvVersionId: "cv-diagnostic-1",
  cvContentHash: cvHash,
  targetZones: ["summary"],
  selectedEvidenceIds: ["evi-1"],
  effectiveCvBriefHash: "brief-1",
  preservedZones: ["header.contact", "header.targetRole", "workExperience", "sidebar.skills", "sidebar.education", "sidebar.certifications", "export"],
  prohibitedZones: ["header.contact", "header.targetRole", "workExperience", "sidebar.skills", "sidebar.education", "sidebar.certifications", "export"],
  reason: "Summary needs clearer role fit"
};
const baseInput = {
  request,
  currentCv,
  rawResponse: { tailoredCv: currentCv },
  currentCvVersionId: request.cvVersionId,
  currentCvContentHash: cvHash,
  currentEffectiveCvBriefHash: request.effectiveCvBriefHash,
  currentSelectedEvidenceIds: request.selectedEvidenceIds,
  validEvidenceIds: ["evi-1"],
  unsupportedTerms: []
};

const validCandidate = structuredClone(currentCv);
validCandidate.summary = "Azure Solution Specialist translating selected customer enablement evidence into clear cloud-adoption delivery outcomes.";

const unsupportedCandidate = structuredClone(validCandidate);
unsupportedCandidate.summary = "Owned the Azure platform and enterprise cloud strategy.";
const unsupported = buildTargetedRegenerationValidationDiagnostic({ ...baseInput, candidate: unsupportedCandidate, unsupportedTerms: ["Azure platform"] });
const unsupportedFailure = unsupported.blockingFailures.find((item) => item.ruleId === "unsupported-visible-claims");
assert.ok(unsupportedFailure, "unsupported claim must be blocking in diagnostics");
assert.equal(unsupportedFailure.sentenceIndex, 0);
assert.match(unsupportedFailure.candidateValue, /Owned the Azure platform/);
assert.equal(unsupportedFailure.recoveryRoute, "review-evidence");

const missingTraceCandidate = structuredClone(validCandidate);
missingTraceCandidate.workExperience[0].subsections[0].bullets[0].evidenceIds = [];
const missingTrace = buildTargetedRegenerationValidationDiagnostic({ ...baseInput, candidate: missingTraceCandidate });
const traceFailure = missingTrace.blockingFailures.find((item) => item.ruleId === "evidence-traceability");
assert.equal(traceFailure.fieldPath, "workExperience[0].subsections[0].bullets[0].evidenceIds");
assert.equal(traceFailure.bulletId, "0-0-0");
assert.deepEqual(traceFailure.missingEvidenceIds, ["at least one valid EvidenceCard ID"]);

const prohibitedCandidate = structuredClone(validCandidate);
prohibitedCandidate.header.email = "changed@example.com";
prohibitedCandidate.workExperience[0].role = "Invented role";
const prohibited = buildTargetedRegenerationValidationDiagnostic({ ...baseInput, candidate: prohibitedCandidate });
assert.deepEqual(prohibited.ignoredCandidateZones.sort(), ["header.contact", "workExperience"]);
assert.ok(prohibited.warnings.some((item) => item.ruleId === "target-zone" && /header.contact/.test(item.message)));
assert.ok(prohibited.warnings.some((item) => item.ruleId === "contact-preservation"));

const noDiffResult = { status: "no-diff", requestId: request.id, priorCvHash: cvHash, resultingCvHash: cvHash, changedZones: [], preservedZones: request.preservedZones, remainingBlockers: request.blockerIds, affectedReviewFamilies: [], message: "No content change." };
const noDiff = buildTargetedRegenerationValidationDiagnostic({ ...baseInput, candidate: structuredClone(currentCv), targetedResult: noDiffResult });
assert.equal(noDiff.stopReason, "no-diff");
assert.equal(noDiff.candidateChanged, false);
assert.equal(noDiff.blockingFailures.length, 0);
assert.doesNotMatch(formatValidationDiagnosticMessage(noDiff), /validation blocked/i);

const duplicateCandidate = structuredClone(validCandidate);
duplicateCandidate.summary = "Duplicate sentence. Duplicate sentence.";
const duplicate = buildTargetedRegenerationValidationDiagnostic({ ...baseInput, candidate: duplicateCandidate });
const duplicateFailure = duplicate.blockingFailures.find((item) => item.ruleId === "duplicate-content");
assert.equal(duplicateFailure.sentenceIndex, 1);
assert.match(duplicateFailure.message, /duplicates/i);

const staleCv = buildTargetedRegenerationValidationDiagnostic({ ...baseInput, candidate: validCandidate, currentCvContentHash: "stale-cv-hash" });
assert.equal(staleCv.stopReason, "stale");
assert.equal(staleCv.primaryFailureId.includes("cv-freshness"), true);
const staleBrief = buildTargetedRegenerationValidationDiagnostic({ ...baseInput, candidate: validCandidate, currentEffectiveCvBriefHash: "stale-brief-hash" });
assert.ok(staleBrief.blockingFailures.some((item) => item.ruleId === "brief-freshness"));
const staleEvidence = buildTargetedRegenerationValidationDiagnostic({ ...baseInput, candidate: validCandidate, currentSelectedEvidenceIds: ["evi-2"] });
assert.ok(staleEvidence.blockingFailures.some((item) => item.ruleId === "evidence-context-freshness" && item.recoveryRoute === "review-evidence"));

const roleFit = buildTargetedRegenerationValidationDiagnostic({ ...baseInput, candidate: validCandidate, reviewChecks: [{ label: "Reviewer: hiring manager relevance", ok: false, value: "Would interview: No · 1 rewrite item(s)" }] });
const roleFitFailure = roleFit.blockingFailures.find((item) => item.ruleId === "summary-role-fit");
assert.equal(roleFitFailure.actualValue, "Would interview: No · 1 rewrite item(s)");
assert.equal(roleFitFailure.expectedValue, "existing hiring-manager relevance check passes");

const multipleCandidate = structuredClone(validCandidate);
multipleCandidate.header.email = "";
multipleCandidate.summary = "Duplicate sentence. Duplicate sentence.";
multipleCandidate.workExperience[0].subsections[0].bullets[0].evidenceIds = [];
const multiple = buildTargetedRegenerationValidationDiagnostic({ ...baseInput, candidate: multipleCandidate });
assert.ok(multiple.blockingFailures.length >= 3);
assert.match(multiple.primaryFailureId, /required-fields/);
assert.ok(multiple.blockingFailures.some((item) => item.ruleId === "evidence-traceability"));
assert.ok(multiple.blockingFailures.some((item) => item.ruleId === "duplicate-content"));

const valid = buildTargetedRegenerationValidationDiagnostic({ ...baseInput, candidate: validCandidate });
assert.equal(valid.stopReason, "passed");
assert.equal(valid.blockingFailures.length, 0);
assert.equal(valid.candidateChanged, true);
assert.equal(valid.checks.every((item) => ["pass", "fail", "skipped"].includes(item.status)), true);
assert.equal(valid.checks.some((item) => item.ruleId === "affected-export-prerequisites"), true);
assert.match(formatValidationDiagnosticMessage(multiple), /AI created a new Summary, but it was not applied/);
assert.match(formatValidationDiagnosticMessage(multiple), /Your current CV was not changed/);

assert.deepEqual(currentCv.header, { name: "Alex Chen", targetRole: "Azure Solution Specialist", email: "alex@example.com", location: "Taipei" }, "diagnostics must never mutate current CV");
console.log(JSON.stringify({ ok: true, fixtures: ["unsupported claim", "missing traceability", "prohibited zone", "no diff", "duplicate", "stale CV", "stale Brief", "stale Evidence", "role fit", "multiple failures", "valid candidate"], checkCount: valid.checks.length }, null, 2));
