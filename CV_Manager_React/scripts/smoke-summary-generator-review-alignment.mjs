import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

async function bundle(entry, name) {
  const outfile = join(process.cwd(), "reports", ".smoke-bundles", `${name}-${Date.now()}.mjs`);
  await build({ entryPoints: [entry], bundle: true, format: "esm", platform: "node", outfile, logLevel: "silent" });
  return import(pathToFileURL(outfile).href);
}

const prompts = await bundle("src/promptBuilders.ts", "summary-generator-review-alignment-prompts");
const review = await bundle("src/domain/screeningReview.ts", "summary-generator-review-alignment-review");
const { buildSummaryQualityContract } = await bundle("src/domain/summaryQualityContract.ts", "summary-generator-review-alignment-contract");

const snapshot = JSON.parse(await readFile("data/app_data.json", "utf8"));
const data = snapshot.data;
const job = data.jobs.find((item) =>
  /Microsoft|Azure/i.test(`${item.company} ${item.role} ${item.rawJD || ""}`)
  && data.cvVersions.some((version) => version.jdId === item.id && version.tailoredCv)
) || data.jobs.find((item) => data.cvVersions.some((version) => version.jdId === item.id && version.tailoredCv)) || data.jobs[0];
const cvVersion = data.cvVersions.filter((item) => item.jdId === job.id && item.tailoredCv).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0];
assert.ok(cvVersion?.tailoredCv, "fixture requires one tailored CV");

const contract = buildSummaryQualityContract({ data, job });
const initialPrompt = prompts.buildScreeningCvPrompt(data, job.id);
assert.match(initialPrompt, /Summary Quality Contract:/, "initial generator must consume the Summary Quality Contract");
assert.match(initialPrompt, new RegExp(contract.requiredCriteria[0].id), "initial generator prompt must contain contract criterion IDs");
assert.match(initialPrompt, new RegExp(contract.positioningMode), "initial generator prompt must contain the positioning mode");

const weakSummaryVersion = {
  ...cvVersion,
  summary: "Looking for a role.",
  tailoredCv: { ...cvVersion.tailoredCv, summary: "Looking for a role." }
};
const gate = review.screeningGate(job, weakSummaryVersion, data.evidenceCards);
const manager = review.hiringManagerReview(job, weakSummaryVersion, gate, data.evidenceCards);
assert.deepEqual(
  manager.summaryReview.criteria.map((item) => item.criterionId),
  contract.requiredCriteria.map((item) => item.id),
  "reviewer must evaluate the same criterion IDs as the generator contract"
);
assert.equal(manager.summaryReview.positioningMode, contract.positioningMode, "generator and reviewer must share positioning mode");

const failedSummaryCriterionIds = manager.summaryReview.criteria
  .filter((item) => item.status === "fail" && item.fixability === "summary-rewrite")
  .map((item) => item.criterionId);
assert.ok(failedSummaryCriterionIds.length > 0, "weak Summary fixture must produce failed Summary criterion IDs");

const targetedPrompt = prompts.buildTargetedRegenerationPrompt(data, job.id, {
  id: "summary-alignment-request",
  blockerIds: ["Summary needs clearer role fit"],
  cvVersionId: cvVersion.id,
  cvContentHash: "hash-alignment",
  targetZones: ["summary"],
  selectedEvidenceIds: job.selectedEvidenceIds || [],
  effectiveCvBriefHash: "brief-alignment",
  failedSummaryCriterionIds,
  preservedZones: ["header.contact", "header.targetRole", "workExperience", "sidebar.skills", "sidebar.education", "sidebar.certifications", "export"],
  prohibitedZones: ["header.contact", "header.targetRole", "workExperience", "sidebar.skills", "sidebar.education", "sidebar.certifications", "export"],
  reason: "Summary role fit"
}, weakSummaryVersion.tailoredCv);
assert.match(targetedPrompt, /failedSummaryCriterionIds/, "targeted Summary regeneration must receive failed criterion IDs");
for (const criterionId of failedSummaryCriterionIds) {
  assert.match(targetedPrompt, new RegExp(criterionId), `targeted prompt must include failed criterion ${criterionId}`);
}
assert.match(targetedPrompt, /unsupportedCoreRequirements/, "targeted prompt must preserve unsupported core requirements as gaps");

console.log(JSON.stringify({
  ok: true,
  positioningMode: contract.positioningMode,
  failedSummaryCriterionIds,
  promptHasContract: true
}, null, 2));
