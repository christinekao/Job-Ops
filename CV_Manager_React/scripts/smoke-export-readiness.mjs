import assert from "node:assert/strict";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";

const bundledModule = join(tmpdir(), `export-readiness-${Date.now()}.mjs`);
await build({ entryPoints: ["src/domain/screeningReview.ts"], bundle: true, format: "esm", platform: "node", outfile: bundledModule, logLevel: "silent" });
const { screeningGate, hiringManagerReview, exportVerification } = await import(pathToFileURL(bundledModule).href);

const longBullet = (index) => `Built and maintained workflow ${index} with documented stakeholder requirements, reliable operational controls, clear user guidance, measurable decision support, and repeatable handoff practices across regional teams.`;
const bullets = Array.from({ length: 8 }, (_, index) => ({ text: longBullet(index + 1), evidenceIds: [`ev-${index + 1}`], confidence: "Grounded", metricType: "Scope" }));
const tailoredCv = {
  header: { name: "Test Candidate", targetRole: "Workflow Specialist", email: "test@example.com", location: "Taipei, Taiwan" },
  sidebar: { languages: [{ name: "English", level: "Professional", note: "" }], skillGroups: [{ title: "Core Skills", highlightedSkills: ["Workflow automation", "Documentation", "Stakeholder delivery"], otherSkills: [] }], certifications: [], education: [{ school: "Example University", degree: "MSc", period: "2010 - 2012" }] },
  summary: "Workflow specialist delivering reliable automation, operational controls, stakeholder enablement, documentation, and decision-ready reporting across enterprise teams.",
  workExperience: [
    { company: "Example Company", role: "Workflow Specialist", period: "2022 - Present", location: "Taipei", subsections: [{ title: "Workflow Delivery", bullets: bullets.slice(0, 5) }] },
    { company: "Earlier Company", role: "Analyst", period: "2020 - 2022", location: "Taipei", subsections: [{ title: "Analytics and Enablement", bullets: bullets.slice(5) }] }
  ],
  reviewNotes: [], keywordPlacementNotes: [], interviewNotes: []
};
const job = {
  id: "job-export", company: "Target Company", role: "Workflow Specialist", location: "Taipei", rawJD: "Workflow specialist",
  status: "CV Drafted", fit: "High", nextAction: "Review", selectedEvidenceIds: bullets.map((_, index) => `ev-${index + 1}`), selectedStoryIds: [], updatedAt: "2026-07-12T00:00:00.000Z",
  screeningAnalysis: { primaryTargetTitle: "Workflow Specialist", mustHaveKeywords: [], missingKeywords: [], riskyClaims: [], summaryAngle: "Workflow delivery" }
};
const content = [tailoredCv.header.name, tailoredCv.summary, ...bullets.map((bullet) => bullet.text)].join("\n");
const cv = { id: "cv-export", jdId: job.id, name: "Export Fixture", summary: tailoredCv.summary, content, tailoredCv, status: "Draft", updatedAt: "2026-07-12T00:00:00.000Z" };

const gate = screeningGate(job, cv, []);
const exportReady = exportVerification(job, cv, gate);
assert.equal(exportReady?.ready, true, `export-ready fixture must pass: ${(exportReady?.blockers || []).join("; ")}`);
const managerJob = { ...job, screeningAnalysis: { ...job.screeningAnalysis, positioning: { applyTier: "Avoid" } } };
const manager = hiringManagerReview(managerJob, cv, gate);
assert.equal(manager?.wouldInterview, "No", "fixture deliberately keeps manager relevance separate from export mechanics");

const invalidTailoredCv = {
  ...tailoredCv,
  header: { ...tailoredCv.header, email: "" },
  summary: "Short summary.",
  workExperience: [{
    ...tailoredCv.workExperience[0],
    subsections: [{ title: "Short", bullets: [{ ...bullets[0], text: "Built one workflow." }] }]
  }]
};
const invalidCv = { ...cv, content: "short", tailoredCv: invalidTailoredCv };
const invalidExport = exportVerification(job, invalidCv, screeningGate(job, invalidCv, []));
assert.equal(invalidExport?.ready, false);
for (const label of ["ATS text layer", "Contact extraction", "Contact email", "Visible work depth", "PDF export readiness"]) {
  assert.ok(invalidExport?.checks.some((check) => check.label === label && !check.ok), `${label} must fail in invalid fixture`);
}

console.log(JSON.stringify({ ok: true, checked: [
  "export-ready fixture", "missing contact", "missing email", "missing role depth", "short text layer/content", "manager relevance remains distinct"
] }, null, 2));
