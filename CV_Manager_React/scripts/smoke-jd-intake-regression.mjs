import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";

const source = await readFile("src/components/tabs/JDIntake.tsx", "utf8");
const fetchFunction = source.match(/async function fetchFromUrl\(\) \{([\s\S]*?)\n  \}\n\n  async function saveJob/)?.[1] || "";
assert.match(source, /<ManualAiPanel[\s\S]*prompt=\{prompt\}[\s\S]*inputValue=\{rawJD\}/, "manual raw-JD input must remain");
assert.match(source, /onParse=\{\(\) => setPreview\(tryParseJson<ParsedJD>\(pasteBack\)\)\}/, "manual explicit Parse must remain");
assert.match(source, /<ParsePreviewCard preview=\{preview\} onApply=\{applyPreview\}/, "existing preview/apply boundary must remain");
assert.match(source, /onClick=\{\(\) => void saveJob\(\)\}/, "existing explicit Save/Update confirmation must remain");
assert.match(source, /await importJobDescription\(importUrl\)[\s\S]*setRawJD\(result\.rawJD\)/, "URL text must enter the existing raw-JD state");
assert.match(fetchFunction, /setSourceUrl\(result\.provenance\.sourceUrl \|\| importUrl\)/, "successful Fetch must fill Source URL from the original submitted URL");
for (const [field, setter] of [
  ["company", "setCompany"],
  ["role", "setRole"],
  ["location", "setLocation"],
  ["jobNumber", "setJobNumber"],
  ["datePosted", "setDatePosted"],
  ["employmentType", "setEmploymentType"],
  ["overview", "setOverview"],
  ["workSite", "setWorkSite"],
  ["travel", "setTravel"],
  ["profession", "setProfession"],
  ["discipline", "setDiscipline"],
  ["roleType", "setRoleType"],
  ["responsibilities", "setResponsibilities"],
  ["requirements", "setRequirements"],
  ["preferredQualifications", "setPreferredQualifications"],
  ["skills", "setSkills"],
  ["compensation", "setCompensation"],
  ["applicationWindow", "setApplicationWindow"]
]) {
  assert.match(source, new RegExp(`fill\\([^\\n]+result\\.extracted\\.${field}[^\\n]+${setter}`), `${field} must map into ${setter}`);
}
assert.match(source, /if \(!current\.trim\(\) \|\| current\.trim\(\) === value\) setter\(value\);[\s\S]*else conflicts\.push\(label\)/, "imports must not silently overwrite conflicting manual values");
assert.match(source, /<Field label="Job number"/, "missing structured scalar columns must be visible");
assert.match(source, /<Textarea label="Skills"/, "a dedicated Skills column must be visible");
assert.match(source, /<Textarea label="Compensation"/, "a dedicated Compensation column must be visible");
assert.match(source, /catch \(error\) \{[\s\S]*setImportStatus\("error"\)[\s\S]*manual JD text were preserved/, "failure must preserve manual input and offer fallback");
assert.doesNotMatch(fetchFunction, /startAutomation|buildScreening|saveJob\(/, "Fetch must not trigger AI, Screening, or Job creation");

const output = join(tmpdir(), `p9-jobs-${Date.now()}.mjs`);
await build({ entryPoints: ["src/data/jobs.ts"], bundle: true, format: "esm", platform: "node", outfile: output, logLevel: "silent" });
const { computeJobContentHash, initializeJob } = await import(pathToFileURL(output).href);
const canonical = {
  company: "Microsoft",
  role: "Solution Engineer",
  location: "Taipei",
  rawJD: "A sufficiently complete fixed job description for canonical identity validation.",
  parsed: {
    company: "Microsoft",
    role: "Solution Engineer",
    location: "Taipei",
    requirements: ["Power Platform"],
    keywords: ["Copilot"],
    employerSignal: "",
    risks: []
  }
};
const manualHash = computeJobContentHash(canonical);
const urlJob = initializeJob({
  ...canonical,
  jdProvenance: {
    sourceType: "url",
    sourceUrl: "https://careers.microsoft.com/jobs/1",
    sourceDomain: "careers.microsoft.com",
    fetchedAt: "2026-07-19T00:00:00.000Z",
    extractionMethod: "json-ld-job-posting",
    fetchWarnings: []
  }
});
assert.equal(urlJob.jdContentHash, manualHash, "URL provenance must not affect canonical identity");
assert.equal(urlJob.jdProvenance?.sourceType, "url", "canonical initializer must preserve provenance");
const metadataOnly = initializeJob({
  ...canonical,
  jdProvenance: {
    ...urlJob.jdProvenance,
    sourceUrl: "https://careers.microsoft.com/jobs/1?tracking=changed",
    fetchedAt: "2026-07-20T00:00:00.000Z",
    extractionMethod: "microsoft-careers-html"
  }
});
assert.equal(metadataOnly.jdContentHash, urlJob.jdContentHash, "metadata-only changes must not stale downstream identity");
const withAdditionalAttribute = initializeJob({
  ...canonical,
  parsed: {
    ...canonical.parsed,
    additionalAttributes: [{ label: "SEO category", value: "Architecture", sourcePath: "JobPosting.category" }]
  }
});
assert.equal(withAdditionalAttribute.jdContentHash, urlJob.jdContentHash, "unknown additional attributes must not affect canonical identity");
const withEmployerInsights = initializeJob({
  ...canonical,
  parsed: {
    ...canonical.parsed,
    employerInsights: {
      topSkills: ["Architecture", "Automation", "Amazon Web Services (AWS)"],
      previouslyWorkedAs: ["Senior Partner Manager"]
    }
  }
});
assert.equal(withEmployerInsights.jdContentHash, urlJob.jdContentHash, "informational previous-hire insights must not affect canonical identity");
assert.match(await readFile("src/data/jobs.ts", "utf8"), /employerInsights: _employerInsights/, "Writer and selection contexts must receive canonical parsed JD without employer insights");
assert.notEqual(initializeJob({
  ...canonical,
  parsed: { ...canonical.parsed, skills: ["Distributed systems"] }
}).jdContentHash, manualHash, "approved structured JD content must affect canonical identity");
assert.notEqual(initializeJob({ ...canonical, rawJD: `${canonical.rawJD} Material content changed.` }).jdContentHash, manualHash, "JD content changes must change canonical identity");

console.log(JSON.stringify({
  ok: true,
  checked: [
    "manual paste, explicit Parse, preview/apply, and Save boundaries preserved",
    "URL extraction returns only to existing raw-JD state",
    "failure/manual fallback has no AI or Job creation trigger",
    "canonical initializer preserves provenance but excludes it from content identity",
    "content change changes identity; metadata-only change does not"
  ]
}, null, 2));
