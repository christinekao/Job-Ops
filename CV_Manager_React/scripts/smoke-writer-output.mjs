import assert from "node:assert/strict";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";

const bundledModule = join(tmpdir(), `writer-output-${Date.now()}.mjs`);

await build({
  entryPoints: ["src/domain/screeningCvOutput.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: bundledModule,
  logLevel: "silent"
});

const { validateScreeningCvOutput } = await import(pathToFileURL(bundledModule).href);

const validCv = {
  header: { name: "Test Candidate", targetRole: "Workflow Specialist", email: "test@example.com", location: "Taipei" },
  sidebar: { languages: [], skillGroups: [], certifications: [], education: [] },
  summary: "Evidence-backed workflow specialist.",
  workExperience: [{
    company: "Example Company",
    role: "Workflow Specialist",
    period: "2022 - Present",
    location: "Taipei",
    subsections: [{
      title: "Workflow Delivery",
      bullets: [{ text: "Built an evidence-backed workflow.", evidenceIds: ["evi-1"], confidence: "Grounded", metricType: "None" }]
    }]
  }],
  reviewNotes: [],
  keywordPlacementNotes: [],
  interviewNotes: []
};

assert.deepEqual(validateScreeningCvOutput(validCv), { valid: true, errors: [] });
assert.deepEqual(validateScreeningCvOutput(validCv, { validEvidenceIds: ["evi-1"] }), { valid: true, errors: [] });

const missingHeader = validateScreeningCvOutput({
  ...validCv,
  header: { ...validCv.header, name: "", targetRole: "" }
});
assert.equal(missingHeader.valid, false);
assert.ok(missingHeader.errors.includes("header.name is required"));
assert.ok(missingHeader.errors.includes("header.targetRole is required"));

const missingEmail = validateScreeningCvOutput({
  ...validCv,
  header: { ...validCv.header, email: "" }
});
assert.equal(missingEmail.valid, false);
assert.ok(missingEmail.errors.includes("header.email is required"));

const missingWork = validateScreeningCvOutput({ ...validCv, workExperience: [] });
assert.equal(missingWork.valid, false);
assert.ok(missingWork.errors.includes("workExperience must contain at least one role"));

const emptyRole = validateScreeningCvOutput({
  ...validCv,
  workExperience: [{ company: "", role: "", period: "", location: "", subsections: [] }]
});
assert.equal(emptyRole.valid, false);
assert.equal(emptyRole.errors.length, 3);

const mixedEvidenceNamespace = validateScreeningCvOutput({
  ...validCv,
  workExperience: [{
    ...validCv.workExperience[0],
    subsections: [{
      ...validCv.workExperience[0].subsections[0],
      bullets: [{
        ...validCv.workExperience[0].subsections[0].bullets[0],
        evidenceIds: ["evi-1", "skill-1", "star-1", "domain-1"]
      }]
    }]
  }]
}, { validEvidenceIds: ["evi-1"] });
assert.equal(mixedEvidenceNamespace.valid, false);
assert.deepEqual(mixedEvidenceNamespace.errors, [
  "workExperience[0].subsections[0].bullets[0].evidenceIds[1] must reference an EvidenceCard ID",
  "workExperience[0].subsections[0].bullets[0].evidenceIds[2] must reference an EvidenceCard ID",
  "workExperience[0].subsections[0].bullets[0].evidenceIds[3] must reference an EvidenceCard ID"
]);

const unknownEvidenceId = validateScreeningCvOutput({
  ...validCv,
  workExperience: [{
    ...validCv.workExperience[0],
    subsections: [{
      ...validCv.workExperience[0].subsections[0],
      bullets: [{
        ...validCv.workExperience[0].subsections[0].bullets[0],
        evidenceIds: ["evi-missing"]
      }]
    }]
  }]
}, { validEvidenceIds: ["evi-1"] });
assert.equal(unknownEvidenceId.valid, false);
assert.deepEqual(unknownEvidenceId.errors, [
  'workExperience[0].subsections[0].bullets[0].evidenceIds[0] references unknown EvidenceCard ID "evi-missing"'
]);

const untracedBullet = validateScreeningCvOutput({
  ...validCv,
  workExperience: [{
    ...validCv.workExperience[0],
    subsections: [{
      ...validCv.workExperience[0].subsections[0],
      bullets: [{
        ...validCv.workExperience[0].subsections[0].bullets[0],
        evidenceIds: []
      }]
    }]
  }]
});
assert.equal(untracedBullet.valid, false);
assert.ok(untracedBullet.errors.includes(
  "workExperience[0].subsections[0].bullets[0].evidenceIds must contain at least one EvidenceCard ID"
));

const duplicateSummary = validateScreeningCvOutput({
  ...validCv,
  summary: "Built evidence-backed workflow controls. Built evidence-backed workflow controls."
});
assert.equal(duplicateSummary.valid, false);
assert.ok(duplicateSummary.errors.includes("summary sentence 1 duplicates summary sentence 0"));

const duplicateBullet = validateScreeningCvOutput({
  ...validCv,
  workExperience: [{
    ...validCv.workExperience[0],
    subsections: [{
      ...validCv.workExperience[0].subsections[0],
      bullets: [
        { text: "Built an evidence-backed workflow.", evidenceIds: ["evi-1"], confidence: "Grounded", metricType: "None" },
        { text: "Built an evidence-backed workflow.", evidenceIds: ["evi-1"], confidence: "Grounded", metricType: "None" }
      ]
    }]
  }]
});
assert.equal(duplicateBullet.valid, false);
assert.ok(duplicateBullet.errors.includes(
  "workExperience[0].subsections[0].bullets[1].text duplicates workExperience[0].subsections[0].bullets[0].text"
));

console.log(JSON.stringify({
  ok: true,
  checked: [
    "valid TailoredCv accepted",
    "valid EvidenceCard IDs accepted",
    "mixed evidence ID namespaces rejected at exact paths",
    "unknown EvidenceCard IDs rejected at exact paths when validation context is provided",
    "untraced visible work bullets rejected",
    "duplicate summary sentences rejected",
    "duplicate bullet text rejected",
    "required header rejected safely",
    "missing contact email rejected safely",
    "missing work history rejected safely",
    "empty role and bullets rejected safely",
    "apply guard runs before CvVersion save and review snapshot creation"
  ]
}, null, 2));
