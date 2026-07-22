import { strict as assert } from "node:assert";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";

async function bundle(entry, name) {
  const outfile = join(process.cwd(), "reports", ".smoke-bundles", `${name}-${Date.now()}.mjs`);
  await build({ entryPoints: [entry], bundle: true, format: "esm", platform: "node", outfile, logLevel: "silent" });
  return import(pathToFileURL(outfile).href);
}

const { startAutomation, waitForAutomationJob } = await bundle("src/storage.ts", "targeted-regeneration-runtime-storage");
const { executeTargetedRegeneration, createTargetedRegenerationRequest } = await bundle("src/domain/targetedRegeneration.ts", "targeted-regeneration-runtime-domain");
const { orchestrateRepair } = await bundle("src/domain/repairOrchestrator.ts", "targeted-regeneration-runtime-orchestrator");
const { contentHash } = await bundle("src/utils/hash.ts", "targeted-regeneration-runtime-hash");

const calls = [];
let jobPolls = 0;
globalThis.fetch = async (url, options = {}) => {
  calls.push({ url: String(url), method: options.method || "GET", body: options.body });
  if (String(url) === "/api/automation/screening-cv") {
    return new Response(JSON.stringify({ id: "screening-cv-runtime-1", kind: "screening-cv", status: "queued", createdAt: "2026-07-15T00:00:00.000Z" }), { status: 202, headers: { "Content-Type": "application/json" } });
  }
  if (String(url) === "/api/automation/jobs/screening-cv-runtime-1") {
    jobPolls += 1;
    return new Response(JSON.stringify({
      id: "screening-cv-runtime-1",
      kind: "screening-cv",
      status: "completed",
      createdAt: "2026-07-15T00:00:00.000Z",
      result: { tailoredCv: { summary: "normalized" } }
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
  throw new Error(`Unexpected request ${url}`);
};

const runtimeContext = { requestId: "request-runtime-1", cvContentHash: "hash-runtime-1" };
const started = await startAutomation("screening-cv", "existing runtime prompt", runtimeContext);
const completed = await waitForAutomationJob(started.id, { intervalMs: 0, timeoutMs: 100 });
assert.equal(started.status, "queued");
assert.equal(completed.status, "completed");
assert.equal(calls.filter((item) => item.url === "/api/automation/screening-cv").length, 1, "production boundary must receive exactly one POST");
assert.equal(jobPolls, 1, "runtime job must be polled to one terminal result");
assert.equal(JSON.parse(calls[0].body).prompt, "existing runtime prompt");
assert.deepEqual(JSON.parse(calls[0].body).context, runtimeContext, "runtime request context must travel beside the prompt");

const cv = {
  jdAnalysis: { targetRole: "Customer Automation Specialist", coreRequirements: [], topKeywords: [], gaps: [] },
  header: { name: "Alex Chen", targetRole: "Customer Automation Specialist", email: "alex@example.com", location: "Taipei" },
  sidebar: { languages: [], skillGroups: [], certifications: [], education: [] },
  summary: "Customer operator seeking work.",
  workExperience: [{
    experienceId: "exp-current",
    company: "Acme",
    role: "Customer Operations Specialist",
    period: "2022-Present",
    location: "Taipei",
    subsections: [{ title: "Impact", bullets: [{ text: "Mapped stakeholder requests into workflow delivery.", evidenceIds: ["evi-workflow"], confidence: "Grounded" }] }]
  }, {
    experienceId: "exp-prior",
    company: "Prior Co",
    role: "Analyst",
    period: "2020-2022",
    location: "Taipei",
    subsections: [{ title: "Delivery", bullets: [{ text: "Built reporting for stakeholders.", evidenceIds: ["evi-reporting"], confidence: "Grounded" }] }]
  }],
  keywordPlacementNotes: [], interviewNotes: [], reviewNotes: []
};
const cvVersion = { id: "cv-runtime-1", jdId: "job-runtime-1", name: "Runtime CV", summary: cv.summary, content: JSON.stringify(cv), tailoredCv: cv, status: "Editing", updatedAt: "2026-07-15T00:00:00.000Z" };
const cvHash = contentHash(cv);
const orchestration = orchestrateRepair({ cvVersionId: cvVersion.id, cvContentHash: cvHash, blockers: ["Summary needs clearer role fit"], cv, selectedEvidenceIds: ["evi-workflow", "evi-reporting"], effectiveCvBriefHash: "brief-runtime-1" });
const request = createTargetedRegenerationRequest({ classifications: orchestration.targetedRegeneration, selectedEvidenceIds: ["evi-workflow", "evi-reporting"], effectiveCvBriefHash: "brief-runtime-1" });
const candidate = structuredClone(cv);
candidate.summary = "Customer Automation Specialist translating stakeholder needs into evidence-backed workflow delivery and customer enablement.";
const result = executeTargetedRegeneration({ cvVersion, request, currentCvVersionId: cvVersion.id, currentContentHash: cvHash, currentEffectiveCvBriefHash: "brief-runtime-1", candidate: { requestId: request.id, cv: candidate } });
assert.equal(result.status, "success");
assert.notEqual(result.priorCvHash, result.resultingCvHash);
assert.equal(result.nextVersion.tailoredCv.summary, candidate.summary);
assert.equal(result.nextVersion.tailoredCv.workExperience[1].role, cv.workExperience[1].role, "non-target role must remain unchanged");
assert.deepEqual(result.changedZones, ["summary"]);

const outOfZoneCandidate = structuredClone(candidate);
outOfZoneCandidate.workExperience[1].role = "Invented role that must not cross the mutation boundary";
const outOfZone = executeTargetedRegeneration({ cvVersion, request, currentCvVersionId: cvVersion.id, currentContentHash: cvHash, currentEffectiveCvBriefHash: "brief-runtime-1", candidate: { requestId: request.id, cv: outOfZoneCandidate } });
assert.equal(outOfZone.status, "blocked", "raw out-of-zone mutation must block the targeted patch");
assert.equal(outOfZone.validation.status, "blocked-preserved-zone");

const noDiff = executeTargetedRegeneration({ cvVersion, request, currentCvVersionId: cvVersion.id, currentContentHash: cvHash, currentEffectiveCvBriefHash: "brief-runtime-1", candidate: { requestId: request.id, cv } });
assert.equal(noDiff.status, "no-diff");
const wrongRequest = executeTargetedRegeneration({ cvVersion, request, currentCvVersionId: cvVersion.id, currentContentHash: cvHash, currentEffectiveCvBriefHash: "brief-runtime-1", candidate: { requestId: "wrong-request", cv: candidate } });
assert.equal(wrongRequest.status, "blocked");

const labSource = await readFile("src/components/tabs/ScreeningLab.tsx", "utf8");
const runtimeHandlerSource = labSource.slice(labSource.indexOf("async function executeTargetedRegenerationAction"), labSource.indexOf("async function dispatchReviewerAction"));
const normalizeIndex = runtimeHandlerSource.indexOf("parseTargetedRegenerationOutput({");
const validateIndex = runtimeHandlerSource.indexOf("executeTargetedRegeneration({");
const saveIndex = runtimeHandlerSource.indexOf("onSaveCv(result.nextVersion)");
assert.ok(normalizeIndex >= 0 && validateIndex > normalizeIndex && saveIndex > validateIndex, "runtime output must pass strict patch parsing, scoped validation, and save only after validation");
assert.match(labSource, /if \(!aiActionsEnabled\)/, "authoritative AI permission must gate runtime execution");
assert.match(labSource, /waitForAutomationJob<unknown>\(started\.id\)/, "production handler must wait for its runtime job");

console.log(JSON.stringify({ ok: true, coverage: ["existing automation POST", "terminal job polling", "strict patch parsing before scoped validation and save", "request identity", "allowed-zone mutation", "out-of-zone mutation blocked", "no-diff", "AI permission gate"] }, null, 2));
