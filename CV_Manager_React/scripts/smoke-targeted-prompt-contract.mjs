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

const { buildScreeningCvPrompt, buildTargetedRegenerationPrompt } = await bundle("src/promptBuilders.ts", "targeted-prompt-contract");
const snapshot = JSON.parse(await readFile("data/app_data.json", "utf8"));
const data = snapshot.data;
const job = data.jobs[0];
const cvVersion = data.cvVersions.filter((item) => item.jdId === job.id && item.tailoredCv).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0];
assert.ok(cvVersion?.tailoredCv, "fixture requires one tailored CV");
const currentCv = cvVersion.tailoredCv;
const selectedEvidenceIds = job.selectedEvidenceIds;
const baseRequest = {
  id: "prompt-contract-1", blockerIds: ["Summary needs clearer role fit"], cvVersionId: cvVersion.id, cvContentHash: "hash-1",
  targetZones: ["summary"], selectedEvidenceIds, effectiveCvBriefHash: "brief-1", preservedZones: ["header.contact", "header.targetRole", "workExperience", "sidebar.skills", "sidebar.education", "sidebar.certifications", "export"],
  prohibitedZones: ["header.contact", "header.targetRole", "workExperience", "sidebar.skills", "sidebar.education", "sidebar.certifications", "export"], reason: "Summary role fit"
};

const summaryPrompt = buildTargetedRegenerationPrompt(data, job.id, baseRequest, currentCv);
assert.match(summaryPrompt, /AUTHORIZED MUTATION ZONE:\s*summary/);
assert.match(summaryPrompt, /Return only:\s*\{"summary":"\.\.\."\}/);
assert.match(summaryPrompt, /Any additional key is invalid/);
assert.doesNotMatch(summaryPrompt, /"tailoredCv"\s*:/, "Summary schema must not contain full CV wrapper");
assert.doesNotMatch(summaryPrompt, /"workExperience"\s*:\s*\[/, "Summary input must not contain mutable work history");
assert.doesNotMatch(summaryPrompt, /"header"\s*:\s*\{/, "Summary input must not contain mutable header");

const oldFullPrompt = buildScreeningCvPrompt(data, job.id, { currentCv, gateFixes: baseRequest.blockerIds, failedChecks: [], contentAudit: [] });
assert.ok(summaryPrompt.length < oldFullPrompt.length * 0.6, `targeted Summary prompt must be materially smaller (${summaryPrompt.length} vs ${oldFullPrompt.length})`);

let targetBullet;
for (let roleIndex = 0; roleIndex < currentCv.workExperience.length && !targetBullet; roleIndex += 1) {
  for (let subsectionIndex = 0; subsectionIndex < currentCv.workExperience[roleIndex].subsections.length && !targetBullet; subsectionIndex += 1) {
    const bulletIndex = currentCv.workExperience[roleIndex].subsections[subsectionIndex].bullets.findIndex((item) => item.evidenceIds?.length);
    if (bulletIndex >= 0) targetBullet = { roleIndex, subsectionIndex, bulletIndex, id: `${roleIndex}-${subsectionIndex}-${bulletIndex}` };
  }
}
assert.ok(targetBullet, "fixture requires one evidence-backed bullet");
const workRequest = { ...baseRequest, id: "prompt-contract-work", blockerIds: ["Achievements need stronger support"], targetZones: ["workExperience.selectedBullets"], targetBulletIds: [targetBullet.id], reason: "Achievements need stronger support" };
const workPrompt = buildTargetedRegenerationPrompt(data, job.id, workRequest, currentCv);
assert.match(workPrompt, /TARGETED REGENERATION CONTRACT: SELECTED WORK BULLETS/);
assert.match(workPrompt, /"workExperiencePatches"/);
assert.match(workPrompt, new RegExp(targetBullet.id));
assert.doesNotMatch(workPrompt, /"summary"\s*:\s*"/, "Work prompt must not carry mutable Summary content");

const wordingRequest = { ...workRequest, id: "prompt-contract-wording", blockerIds: ["Wording needs to be clearer for recruiters"], reason: "Recruiter wording cleanup" };
const wordingPrompt = buildTargetedRegenerationPrompt(data, job.id, wordingRequest, currentCv);
assert.match(wordingPrompt, /TARGETED REGENERATION CONTRACT: RECRUITER WORDING CLEANUP/);
assert.match(wordingPrompt, /"wordingPatches"/);
assert.doesNotMatch(wordingPrompt, /"workExperiencePatches"/);

console.log(JSON.stringify({ ok: true, summaryPromptChars: summaryPrompt.length, previousFullPromptChars: oldFullPrompt.length, reductionPercent: Math.round((1 - summaryPrompt.length / oldFullPrompt.length) * 100), contracts: ["summary", "work-bullets", "wording"] }, null, 2));
