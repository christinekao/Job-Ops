import { strict as assert } from "node:assert";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

async function bundle(entry, name) {
  const outfile = join(process.cwd(), "reports", ".smoke-bundles", `${name}-${Date.now()}.mjs`);
  await build({ entryPoints: [entry], bundle: true, format: "esm", platform: "node", outfile, logLevel: "silent" });
  return import(pathToFileURL(outfile).href);
}

const { parseTargetedRegenerationOutput } = await bundle("src/domain/targetedRegenerationContract.ts", "targeted-output-schema");

const cv = {
  jdAnalysis: { targetRole: "Customer Automation Specialist", coreRequirements: [], topKeywords: [], gaps: [] },
  header: { name: "Alex Chen", targetRole: "Customer Automation Specialist", email: "", location: "Taipei" },
  sidebar: { languages: [], skillGroups: [], certifications: [], education: [] },
  summary: "Customer operator seeking work.",
  workExperience: [{ experienceId: "role-current", company: "Acme", role: "Specialist", period: "2022-Present", location: "Taipei", subsections: [{ title: "Impact", bullets: [
    { text: "Mapped stakeholder requests into workflow delivery.", evidenceIds: ["evi-1"], confidence: "Grounded" },
    { text: "Built reporting for stakeholder decisions.", evidenceIds: ["evi-2"], confidence: "Grounded" }
  ] }] }],
  keywordPlacementNotes: [], interviewNotes: [], reviewNotes: []
};
const request = {
  id: "schema-summary", blockerIds: ["Summary needs clearer role fit"], cvVersionId: "cv-1", cvContentHash: "hash-1", targetZones: ["summary"],
  selectedEvidenceIds: ["evi-1", "evi-2"], effectiveCvBriefHash: "brief-1", preservedZones: ["header.contact", "header.targetRole", "workExperience", "sidebar.skills", "sidebar.education", "sidebar.certifications", "export"],
  prohibitedZones: ["header.contact", "header.targetRole", "workExperience", "sidebar.skills", "sidebar.education", "sidebar.certifications", "export"], reason: "Summary role fit"
};
const parse = (rawResult, extra = {}) => parseTargetedRegenerationOutput({ rawResult, request, currentCv: cv, validEvidenceIds: ["evi-1", "evi-2"], ...extra });

const validSummary = parse({ summary: "Customer Automation Specialist translating stakeholder needs into evidence-backed workflow outcomes." });
assert.equal(validSummary.ok, true);
assert.equal(validSummary.candidate.cv.summary.includes("evidence-backed"), true);
assert.deepEqual(validSummary.candidate.cv.workExperience, cv.workExperience);

for (const [label, raw, expectedPath] of [
  ["header", { summary: "Improved", header: { targetRole: "Invented" } }, "header.targetRole"],
  ["workExperience", { summary: "Improved", workExperience: [] }, "workExperience"],
  ["export", { summary: "Improved", export: {} }, "export"],
  ["full CV", { tailoredCv: cv }, "tailoredCv"],
  ["unknown", { summary: "Improved", surprise: true }, "surprise"]
]) {
  const result = parse(raw);
  assert.equal(result.ok, false, `${label} must be rejected`);
  assert.ok(result.failure.unauthorizedPaths.includes(expectedPath), `${label} must identify ${expectedPath}`);
}

const markdown = parse({ summary: "Improved" }, { rawOutput: "```json\n{\"summary\":\"Improved\"}\n```" });
assert.equal(markdown.ok, false);
assert.match(markdown.failure.errors.join(" "), /Markdown-wrapped/);

const workRequest = { ...request, id: "schema-work", blockerIds: ["Achievements need stronger support"], targetZones: ["workExperience.selectedBullets"], targetBulletIds: ["0-0-0"], reason: "Achievements need stronger support" };
const parseWork = (rawResult) => parseTargetedRegenerationOutput({ rawResult, request: workRequest, currentCv: cv, validEvidenceIds: ["evi-1", "evi-2"] });
const validWork = parseWork({ workExperiencePatches: [{ roleId: "role-current", bulletId: "0-0-0", text: "Translated stakeholder requests into evidence-backed workflow delivery outcomes.", evidenceIds: ["evi-1"] }] });
assert.equal(validWork.ok, true);
assert.equal(validWork.candidate.cv.workExperience[0].subsections[0].bullets[1].text, cv.workExperience[0].subsections[0].bullets[1].text);
assert.equal(parseWork({ workExperiencePatches: [{ roleId: "unknown", bulletId: "9-9-9", text: "Changed", evidenceIds: ["evi-1"] }] }).ok, false);
assert.equal(parseWork({ workExperiencePatches: [
  { roleId: "role-current", bulletId: "0-0-0", text: "Changed", evidenceIds: ["evi-1"] },
  { roleId: "role-current", bulletId: "0-0-0", text: "Changed again", evidenceIds: ["evi-1"] }
] }).ok, false);
assert.equal(parseWork({ workExperiencePatches: [{ roleId: "role-current", bulletId: "0-0-0", text: "Changed", evidenceIds: ["bad-id"] }] }).ok, false);

const wordingRequest = { ...workRequest, id: "schema-wording", blockerIds: ["Wording needs to be clearer for recruiters"], reason: "Recruiter wording cleanup" };
const validWording = parseTargetedRegenerationOutput({ rawResult: { wordingPatches: [{ targetId: "0-0-0", text: "Coordinated stakeholder workflow delivery with clear outcomes.", evidenceIds: ["evi-1"] }] }, request: wordingRequest, currentCv: cv, validEvidenceIds: ["evi-1", "evi-2"] });
assert.equal(validWording.ok, true);
assert.equal(cv.summary, "Customer operator seeking work.", "strict parsing must not mutate the current CV");

console.log(JSON.stringify({ ok: true, fixtures: 12, coverage: ["summary-only", "unknown keys", "full CV rejected", "markdown rejected", "exact work targets", "duplicate targets", "EvidenceCard IDs", "wording targets", "no mutation"] }, null, 2));
