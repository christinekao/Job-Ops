import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { build } from "esbuild";

const require = createRequire(import.meta.url);
const { extractJobDescription, extractMicrosoftPositionDetail } = require("../jdImportService.cjs");
const fixture = JSON.parse(await readFile("scripts/fixtures/microsoft-position-details-contaminated.json", "utf8"));
const extracted = extractMicrosoftPositionDetail(fixture);

const output = join(tmpdir(), `p12-prompts-${Date.now()}.mjs`);
await build({
  entryPoints: ["src/promptBuilders.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: output,
  logLevel: "silent"
});
const { buildJDParsePrompt, validateJDParseInput } = await import(pathToFileURL(output).href);
const prompt = buildJDParsePrompt(extracted.sourceText);
const manualCanonicalRawJD = extracted.sourceText;
assert.equal(extracted.sourceText, manualCanonicalRawJD, "Manual and URL flows must converge on the same canonical raw JD text");

for (const marker of [
  "themeOptions",
  "customTheme",
  "buttonPrimaryColor",
  "checkboxCheckedColor",
  "f47ac10b-58cc-4372-a567-0e02b2c3d479"
]) {
  assert.doesNotMatch(extracted.sourceText, new RegExp(marker, "i"), `${marker} must not enter canonical raw JD`);
  assert.doesNotMatch(prompt, new RegExp(marker, "i"), `${marker} must not enter JD Parse Prompt`);
}

for (const expected of [
  "Principal/Senior Software Engineer, Experimentation Platform - CoreAI",
  "Build a trustworthy experimentation platform for AI product learning at very high scale.",
  "Own reliable distributed services.",
  "Build production observability and incident response.",
  "Production coding experience in C#, Java, JavaScript, or Python.",
  "Experience operating large-scale cloud systems.",
  "Experimentation platforms and A/B testing.",
  "The typical base pay range for this role is USD $117,200 - $229,200 per year.",
  "This position will be open for a minimum of 5 days"
]) {
  assert.match(extracted.sourceText, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `canonical raw JD must retain: ${expected}`);
  assert.match(prompt, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Prompt must retain: ${expected}`);
}

assert.equal(extracted.sourceText.includes("Architecture"), false, "employer top skills must not enter canonical raw JD");
assert.equal(extracted.sourceText.includes("Technical Program Manager"), false, "previous-hire roles must not enter canonical raw JD");
assert.deepEqual(extracted.canonical.employerInsights, {
  topSkills: ["Architecture", "Automation"],
  previouslyWorkedAs: ["Technical Program Manager", "Principal Engineer"]
});
assert.equal(typeof validateJDParseInput, "function", "production must expose deterministic JD Parse input validation");
assert.equal(validateJDParseInput(extracted.sourceText).ok, true);
assert.equal(buildJDParsePrompt("").length, 0, "empty raw JD must not produce a copyable Prompt");
assert.equal(buildJDParsePrompt('{"themeOptions":{"customTheme":{"buttonColor":"#fff"}}}').length, 0, "serialized application state must not produce a copyable Prompt");
assert.equal(buildJDParsePrompt("Feature flags are part of this software engineering role. Build reliable systems, testing, observability, deployment, and incident-response practices for production services.").length > 0, true, "one legitimate configuration term must not be over-blocked");
assert.equal(buildJDParsePrompt(`Role\nEngineer\n\nResponsibilities\n${"Build reliable production systems with observability and testing.\n".repeat(2500)}`).length, 0, "unreasonably large Prompt input must be blocked without truncating it");

const sectionOrder = [
  "Company", "Role", "Job number", "Date posted", "Location", "Work site", "Travel",
  "Profession", "Discipline", "Role type", "Employment type", "Overview",
  "Responsibilities", "Required Qualifications", "Other Requirements",
  "Preferred Qualifications", "Skills", "Compensation", "Application window"
];
let previousIndex = -1;
for (const section of sectionOrder) {
  const index = extracted.sourceText.indexOf(`${section}\n`);
  assert.ok(index > previousIndex, `${section} must follow the stable Microsoft canonical section order`);
  previousIndex = index;
}

const secondFixture = structuredClone(fixture);
secondFixture.data.jobDescription = secondFixture.data.jobDescription
  .replaceAll("themeOptions", "themeOptionsChanged")
  .replaceAll("#0067b8", "#ff00ff");
assert.equal(
  extractMicrosoftPositionDetail(secondFixture).sourceText,
  extracted.sourceText,
  "application-state changes must not change canonical raw JD identity input"
);
const formalChangeFixture = structuredClone(fixture);
formalChangeFixture.data.jobDescription = formalChangeFixture.data.jobDescription
  .replace("Own reliable distributed services.", "Own materially changed distributed services.");
assert.notEqual(
  extractMicrosoftPositionDetail(formalChangeFixture).sourceText,
  extracted.sourceText,
  "formal job-content changes must change canonical raw JD identity input"
);

const generic = extractJobDescription(
  `<div>themeOptions customTheme analyticsConfig</div><main><h1>Platform Engineer</h1><h2>Responsibilities</h2><p>Build reliable distributed services, observability, deployment automation, and incident response.</p><h2>Qualifications</h2><p>Production cloud engineering experience with secure systems and testing is required.</p></main>`,
  { contentType: "text/html", sourceUrl: "https://jobs.example.com/platform-engineer" }
);
assert.equal(generic.extractionMethod, "generic-html");
assert.doesNotMatch(generic.sourceText, /themeOptions|customTheme|analyticsConfig/i, "generic extraction must prefer readable job containers over surrounding application state");
assert.throws(
  () => extractJobDescription(
    `<main><div>themeOptions customTheme buttonPrimaryColor checkboxCheckedColor</div><p>This serialized application configuration is intentionally long enough to reach extraction.</p></main>`,
    { contentType: "text/html", sourceUrl: "https://jobs.example.com/unsafe" }
  ),
  (error) => error?.code === "EXTRACTION_FAILED",
  "unsafe generic application-state content must fail closed instead of entering raw JD"
);

console.log(JSON.stringify({
  ok: true,
  checked: [
    "Microsoft canonical raw JD excludes application-state contamination",
    "formal job sections remain complete and ordered",
    "Employer Insights remains isolated",
    "JD Parse Prompt accepts only safe canonical raw JD"
  ]
}, null, 2));
