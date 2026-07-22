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

const { buildSummaryQualityContract, evaluateSummaryQuality } = await bundle("src/domain/summaryQualityContract.ts", "summary-quality-contract");
const { contentHash } = await bundle("src/utils/hash.ts", "summary-quality-hash");

const snapshot = JSON.parse(await readFile("data/app_data.json", "utf8"));
const data = snapshot.data;
const job = data.jobs.find((item) =>
  /Microsoft|Azure/i.test(`${item.company} ${item.role} ${item.rawJD || ""}`)
  && data.cvVersions.some((version) => version.jdId === item.id && version.tailoredCv)
) || data.jobs.find((item) => data.cvVersions.some((version) => version.jdId === item.id && version.tailoredCv)) || data.jobs[0];
assert.ok(job, "fixture requires one job");

const contract = buildSummaryQualityContract({ data, job });
assert.equal(contract.requiredCriteria.length, 7, "contract must expose the shared Summary criteria");
assert.ok(contract.requiredCriteria.some((criterion) => criterion.id === "summary-role-identity"));
assert.ok(contract.requiredCriteria.some((criterion) => criterion.id === "summary-relevant-capability"));
assert.ok(["direct-fit", "adjacent-fit", "transferable-fit", "not-recommended"].includes(contract.positioningMode));
assert.ok(Array.isArray(contract.supportedStrengths), "contract must include supported strengths");
assert.ok(Array.isArray(contract.unsupportedCoreRequirements), "contract must include unsupported core requirements");
assert.ok(contract.maxLengthWords <= 65, "contract must enforce the Summary word limit");

const cv = data.cvVersions.find((item) => item.jdId === job.id && item.tailoredCv)?.tailoredCv;
assert.ok(cv, "fixture requires one tailored CV");
const review = evaluateSummaryQuality({
  contract,
  cv,
  reviewedCvHash: contentHash(cv),
  reviewRunId: "summary-quality-smoke"
});
assert.deepEqual(review.criteria.map((item) => item.criterionId), contract.requiredCriteria.map((item) => item.id), "review must evaluate the same criterion IDs as the contract");
assert.equal(review.positioningMode, contract.positioningMode, "review and contract must share positioning mode");
assert.equal(review.reviewedCvHash, contentHash(cv), "review must bind to current CV hash");

console.log(JSON.stringify({
  ok: true,
  positioningMode: contract.positioningMode,
  criteria: contract.requiredCriteria.map((item) => item.id),
  unsupportedCoreRequirements: contract.unsupportedCoreRequirements.length
}, null, 2));
