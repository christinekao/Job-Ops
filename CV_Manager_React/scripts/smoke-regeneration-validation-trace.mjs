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

const { buildTargetedRegenerationValidationDiagnostic } = await bundle("src/domain/targetedRegenerationDiagnostics.ts", "regeneration-validation-trace");
const { contentHash } = await bundle("src/utils/hash.ts", "regeneration-validation-trace-hash");
const cv = {
  jdAnalysis: { targetRole: "Azure Solution Specialist", coreRequirements: [], topKeywords: [], gaps: [] },
  header: { name: "Alex Chen", targetRole: "Azure Solution Specialist", email: "", location: "Taipei" },
  sidebar: { languages: [], skillGroups: [], certifications: [], education: [] },
  summary: "Customer enablement specialist.",
  workExperience: [{ experienceId: "role-1", company: "Acme", role: "Specialist", period: "2022-Present", location: "Taipei", subsections: [{ title: "Impact", bullets: [{ text: "Supported customer enablement.", evidenceIds: [], confidence: "Grounded" }] }] }],
  keywordPlacementNotes: [], interviewNotes: [], reviewNotes: []
};
const hash = contentHash(cv);
const request = { id: "real-failure-shape", blockerIds: ["Summary needs clearer role fit"], cvVersionId: "cv-1", cvContentHash: hash, targetZones: ["summary"], selectedEvidenceIds: ["evi-1"], effectiveCvBriefHash: "brief-1", preservedZones: ["header.contact", "workExperience"], prohibitedZones: ["header.contact", "workExperience"], reason: "Summary needs clearer role fit" };
const candidate = structuredClone(cv);
candidate.summary = "Azure Solution Specialist supporting evidence-led customer cloud adoption.";
const report = buildTargetedRegenerationValidationDiagnostic({ request, currentCv: cv, candidate, rawResponse: { tailoredCv: candidate }, currentCvVersionId: "cv-1", currentCvContentHash: hash, currentEffectiveCvBriefHash: "brief-1", currentSelectedEvidenceIds: ["evi-1"], validEvidenceIds: ["evi-1"], unsupportedTerms: [] });

const requiredStages = ["response-contract", "target-zone", "cv-freshness", "brief-freshness", "evidence-context-freshness", "required-fields", "evidencecard-namespace", "evidence-traceability", "unsupported-visible-claims", "new-skill-ownership-metric", "duplicate-content", "meaningful-content-diff", "preserved-zone-integrity", "contact-preservation", "summary-role-fit", "work-bullet-quality", "affected-export-prerequisites", "scoped-candidate-application"];
for (const stage of requiredStages) assert.ok(report.checks.some((item) => item.ruleId === stage), `missing diagnostic stage: ${stage}`);
assert.match(report.primaryFailureId, /required-fields/, "real failure must stop first at required-field validation");
assert.ok(report.blockingFailures.some((item) => item.fieldPath === "header.email" && item.validatorId === "screening-cv-output"));
assert.ok(report.blockingFailures.some((item) => item.ruleId === "evidence-traceability" && item.fieldPath.includes("evidenceIds")));
assert.equal(report.rawResponseCaptured, true);
assert.equal(report.normalizedCandidateCaptured, true);
assert.equal(report.stopReason, "validation-blocked");

const labSource = await readFile("src/components/tabs/ScreeningLab.tsx", "utf8");
const panelSource = await readFile("src/components/tabs/screeningReviewRepairPanels.tsx", "utf8");
assert.match(labSource, /buildTargetedRegenerationValidationDiagnostic/);
assert.match(labSource, /targeted-regeneration-validation/);
assert.match(labSource, /value: \{ diagnosticReport \}/);
assert.match(panelSource, /data-testid="validation-diagnostic-panel"/);
assert.match(panelSource, /data-testid="validation-diagnostic-advanced"/);
assert.match(panelSource, /Your current CV was not changed/);
assert.match(panelSource, /validatorId/);
assert.match(panelSource, /ruleId/);
assert.doesNotMatch(labSource, /startAutomation\([^)]*diagnostic/i, "diagnostics must not invoke AI");

console.log(JSON.stringify({ ok: true, firstFailure: report.primaryFailureId, fullSequence: report.checks.map((item) => `${item.status}:${item.validatorId}:${item.ruleId}`) }, null, 2));
