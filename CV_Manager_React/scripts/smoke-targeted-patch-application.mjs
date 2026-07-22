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

const { executeTargetedRegeneration } = await bundle("src/domain/targetedRegeneration.ts", "targeted-patch-application");
const { buildTargetedRegenerationValidationDiagnostic } = await bundle("src/domain/targetedRegenerationDiagnostics.ts", "targeted-patch-diagnostic");
const { contentHash } = await bundle("src/utils/hash.ts", "targeted-patch-hash");

const cv = {
  jdAnalysis: { targetRole: "Azure Solution Specialist", coreRequirements: [], topKeywords: [], gaps: [] },
  header: { name: "Alex Chen", targetRole: "Azure Solution Specialist", email: "", location: "Taipei" },
  sidebar: { languages: [], skillGroups: [], certifications: [], education: [] },
  summary: "Customer operator seeking work.",
  workExperience: [{ experienceId: "role-1", company: "Acme", role: "Specialist", period: "2022-Present", location: "Taipei", subsections: [{ title: "Impact", bullets: [{ text: "Supported customer adoption with documented outcomes.", evidenceIds: ["evi-1"], confidence: "Grounded" }] }] }],
  keywordPlacementNotes: [], interviewNotes: [], reviewNotes: []
};
const cvHash = contentHash(cv);
const request = { id: "patch-request-1", blockerIds: ["Summary needs clearer role fit"], cvVersionId: "cv-1", cvContentHash: cvHash, targetZones: ["summary"], selectedEvidenceIds: ["evi-1"], effectiveCvBriefHash: "brief-1", preservedZones: ["header.contact", "header.targetRole", "workExperience", "sidebar.skills", "sidebar.education", "sidebar.certifications", "export"], prohibitedZones: ["header.contact", "header.targetRole", "workExperience", "sidebar.skills", "sidebar.education", "sidebar.certifications", "export"], reason: "role fit" };
const version = { id: "cv-1", jdId: "job-1", name: "Target CV", summary: cv.summary, content: JSON.stringify(cv), tailoredCv: cv, status: "Ready for Review", updatedAt: "2026-07-16T00:00:00.000Z" };
const candidate = structuredClone(cv);
candidate.summary = "Azure Solution Specialist translating customer enablement evidence into practical cloud-adoption outcomes.";

const result = executeTargetedRegeneration({ cvVersion: version, request, currentCvVersionId: "cv-1", currentContentHash: cvHash, currentEffectiveCvBriefHash: "brief-1", currentSelectedEvidenceIds: ["evi-1"], validEvidenceIds: ["evi-1"], candidate: { requestId: request.id, cv: candidate }, now: "2026-07-16T00:01:00.000Z" });
assert.equal(result.status, "success");
assert.equal(result.validation.status, "pass");
assert.ok(result.validation.preExistingGlobalIssues.some((issue) => issue.fieldPath === "header.email"));
assert.ok(result.nextVersion.id.includes("-regen-"), "valid patch must create a new version");
assert.notEqual(result.resultingCvHash, result.priorCvHash, "valid patch must create a new content hash");
assert.equal(result.nextVersion.tailoredCv.summary, candidate.summary);
assert.deepEqual(result.nextVersion.tailoredCv.header, cv.header, "non-target contact must be preserved");
assert.deepEqual(result.nextVersion.tailoredCv.workExperience, cv.workExperience, "non-target work history must be preserved");
assert.deepEqual(result.affectedReviewFamilies, ["hiring-manager", "reviewer"]);

const diagnostic = buildTargetedRegenerationValidationDiagnostic({ request, currentCv: cv, candidate, rawResponse: { tailoredCv: candidate }, currentCvVersionId: "cv-1", currentCvContentHash: cvHash, currentEffectiveCvBriefHash: "brief-1", currentSelectedEvidenceIds: ["evi-1"], validEvidenceIds: ["evi-1"], targetedResult: result });
assert.equal(diagnostic.stopReason, "passed");
assert.equal(diagnostic.targetFailures.length, 0);
assert.ok(diagnostic.preExistingGlobalIssues.some((issue) => issue.fieldPath === "header.email"));
assert.equal(diagnostic.blockingFailures.length, 0, "pre-existing email must not appear as apply failure");

const prohibitedCandidate = structuredClone(candidate);
prohibitedCandidate.workExperience[0].role = "Invented role";
const blocked = executeTargetedRegeneration({ cvVersion: version, request, currentCvVersionId: "cv-1", currentContentHash: cvHash, currentEffectiveCvBriefHash: "brief-1", currentSelectedEvidenceIds: ["evi-1"], validEvidenceIds: ["evi-1"], candidate: { requestId: request.id, cv: prohibitedCandidate } });
assert.equal(blocked.status, "blocked");
assert.equal(blocked.validation.status, "blocked-preserved-zone");
assert.equal(blocked.nextVersion, undefined);

console.log(JSON.stringify({ ok: true, versionCreated: result.nextVersion.id, resultingCvHash: result.resultingCvHash, remainingGlobalIssues: result.validation.preExistingGlobalIssues.length, preservedMutationBlocked: true }, null, 2));
