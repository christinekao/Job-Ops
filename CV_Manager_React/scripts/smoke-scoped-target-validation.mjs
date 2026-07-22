import { strict as assert } from "node:assert";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

async function bundle(entry, name) {
  const outfile = join(tmpdir(), `${name}-${Date.now()}.mjs`);
  await build({ entryPoints: [entry], bundle: true, format: "esm", platform: "node", outfile, logLevel: "silent" });
  return import(pathToFileURL(outfile).href);
}

const { validateTargetedRegenerationCandidate } = await bundle("src/domain/targetedValidation.ts", "scoped-target-validation");
const { contentHash } = await bundle("src/utils/hash.ts", "scoped-target-validation-hash");

function cvFixture() {
  return {
    jdAnalysis: { targetRole: "Azure Solution Specialist", coreRequirements: [], topKeywords: [], gaps: [] },
    header: { name: "Alex Chen", targetRole: "Azure Solution Specialist", email: "", location: "Taipei" },
    sidebar: { languages: [], skillGroups: [], certifications: [], education: [] },
    summary: "Customer enablement specialist supporting cloud adoption.",
    workExperience: [
      { experienceId: "role-1", company: "Acme", role: "Specialist", period: "2022-Present", location: "Taipei", subsections: [{ title: "Impact", bullets: [
        { text: "Supported customer adoption with documented outcomes.", evidenceIds: ["evi-1"], confidence: "Grounded" },
        { text: "Coordinated stakeholder delivery with clear handoffs.", evidenceIds: ["evi-2"], confidence: "Grounded" }
      ] }] },
      { experienceId: "role-2", company: "Prior", role: "Analyst", period: "2020-2022", location: "Taipei", subsections: [{ title: "Delivery", bullets: [
        { text: "Built reporting that improved operational visibility.", evidenceIds: ["evi-3"], confidence: "Grounded" }
      ] }] }
    ],
    keywordPlacementNotes: [], interviewNotes: [], reviewNotes: []
  };
}

function requestFor(cv, targetZones = ["summary"], targetBulletIds = []) {
  return {
    id: "scoped-request-1", blockerIds: ["Summary needs clearer role fit"], cvVersionId: "cv-1", cvContentHash: contentHash(cv),
    targetZones, targetBulletIds, selectedEvidenceIds: ["evi-1", "evi-2", "evi-3"], effectiveCvBriefHash: "brief-1",
    preservedZones: ["header.contact", "header.targetRole", "workExperience", "sidebar.skills", "sidebar.education", "sidebar.certifications", "export"],
    prohibitedZones: ["header.contact", "header.targetRole", "workExperience", "sidebar.skills", "sidebar.education", "sidebar.certifications", "export"], reason: "targeted repair"
  };
}

function validate(currentCv, candidateCv, request = requestFor(currentCv), extra = {}) {
  return validateTargetedRegenerationCandidate({
    request, currentCv, candidate: { requestId: request.id, cv: candidateCv }, currentCvVersionId: "cv-1",
    currentCvContentHash: contentHash(currentCv), currentEffectiveCvBriefHash: "brief-1", currentSelectedEvidenceIds: request.selectedEvidenceIds,
    validEvidenceIds: ["evi-1", "evi-2", "evi-3"], unsupportedTerms: [], ...extra
  });
}

const missingEmailCv = cvFixture();
const validSummary = structuredClone(missingEmailCv);
validSummary.summary = "Azure Solution Specialist translating customer enablement evidence into practical cloud-adoption outcomes.";
const missingEmail = validate(missingEmailCv, validSummary);
assert.equal(missingEmail.status, "pass", "pre-existing missing email must not reject Summary patch");
assert.equal(missingEmail.mayApplyTargetPatch, true);
assert.ok(missingEmail.preExistingGlobalIssues.some((issue) => issue.fieldPath === "header.email"), "missing email must remain a global issue");
assert.equal(missingEmail.targetFailures.length, 0);
assert.equal(missingEmail.patchedCv.header.email, "");

const duplicateOutsideCv = cvFixture();
duplicateOutsideCv.workExperience[1].subsections[0].bullets[0].text = duplicateOutsideCv.workExperience[0].subsections[0].bullets[1].text;
const summaryOverDuplicate = structuredClone(duplicateOutsideCv);
summaryOverDuplicate.summary = validSummary.summary;
const duplicateOutside = validate(duplicateOutsideCv, summaryOverDuplicate);
assert.equal(duplicateOutside.status, "pass", "pre-existing duplicate outside target must not reject Summary patch");
assert.ok(duplicateOutside.preExistingGlobalIssues.some((issue) => issue.ruleId === "duplicate-content"));

const unsupported = structuredClone(missingEmailCv);
unsupported.summary = "Owned the Azure platform and enterprise cloud strategy.";
const unsupportedResult = validate(missingEmailCv, unsupported, requestFor(missingEmailCv), { unsupportedTerms: ["Azure platform"] });
assert.equal(unsupportedResult.status, "blocked-target");
assert.ok(unsupportedResult.targetFailures.some((issue) => issue.ruleId === "unsupported-visible-claims"));

const prohibited = structuredClone(validSummary);
prohibited.workExperience[0].role = "Invented role";
const prohibitedResult = validate(missingEmailCv, prohibited);
assert.equal(prohibitedResult.status, "blocked-preserved-zone");
assert.ok(prohibitedResult.preservedZoneFailures.some((issue) => issue.targetZone === "workExperience"));

const bulletCv = cvFixture();
const bulletRequest = requestFor(bulletCv, ["workExperience.selectedBullets"], ["0-0-0"]);
const validBullet = structuredClone(bulletCv);
validBullet.workExperience[0].subsections[0].bullets[0].text = "Supported customer adoption and documented measurable delivery outcomes for stakeholder review.";
const bulletResult = validate(bulletCv, validBullet, bulletRequest);
assert.equal(bulletResult.status, "pass", "unrelated missing email must not reject selected-bullet patch");
assert.ok(bulletResult.preExistingGlobalIssues.some((issue) => issue.fieldPath === "header.email"));

const invalidEvidence = structuredClone(validBullet);
invalidEvidence.workExperience[0].subsections[0].bullets[0].evidenceIds = ["bad-id"];
const invalidEvidenceResult = validate(bulletCv, invalidEvidence, bulletRequest);
assert.equal(invalidEvidenceResult.status, "blocked-target");
assert.ok(invalidEvidenceResult.targetFailures.some((issue) => /EvidenceCard traceability/.test(issue.message)));

const targetDuplicate = structuredClone(missingEmailCv);
targetDuplicate.summary = "Repeated role fit. Repeated role fit.";
const targetDuplicateResult = validate(missingEmailCv, targetDuplicate);
assert.equal(targetDuplicateResult.status, "blocked-target");
assert.ok(targetDuplicateResult.targetFailures.some((issue) => issue.ruleId === "duplicate-content"));

const staleResult = validate(missingEmailCv, validSummary, requestFor(missingEmailCv), { currentCvContentHash: "stale-hash" });
assert.equal(staleResult.status, "blocked-stale");
assert.ok(staleResult.staleContractFailures.some((issue) => issue.ruleId === "cv-content-hash"));

const newGlobalCv = cvFixture();
newGlobalCv.header.email = "alex@example.com";
const firstBulletRequest = requestFor(newGlobalCv, ["workExperience.selectedBullets"], ["0-0-0"]);
const newGlobalCandidate = structuredClone(newGlobalCv);
newGlobalCandidate.workExperience[0].subsections[0].bullets[0].text = newGlobalCandidate.workExperience[0].subsections[0].bullets[1].text;
const newGlobal = validate(newGlobalCv, newGlobalCandidate, firstBulletRequest);
assert.equal(newGlobal.mayApplyTargetPatch, false, "candidate-introduced global failure must block");
assert.ok(newGlobal.newGlobalIssues.some((issue) => issue.ruleId === "duplicate-content"));

assert.equal(missingEmailCv.summary, "Customer enablement specialist supporting cloud adoption.", "validation must not mutate current CV");
console.log(JSON.stringify({ ok: true, fixtures: 10, categories: ["target", "preserved-zone", "stale-contract", "pre-existing-global", "new-global"] }, null, 2));
