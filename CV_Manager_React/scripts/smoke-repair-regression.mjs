import assert from "node:assert/strict";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";

const bundledModule = join(tmpdir(), `repair-regression-${Date.now()}.mjs`);

await build({ entryPoints: ["src/domain/localReviewerFix.ts"], bundle: true, format: "esm", platform: "node", outfile: bundledModule, logLevel: "silent" });
const { buildLocalReviewerContentFix } = await import(pathToFileURL(bundledModule).href);

const header = { name: "Test Candidate", targetRole: "Workflow Specialist", email: "test@example.com", location: "Taipei" };
const sidebar = { languages: [], skillGroups: [{ title: "Core", highlightedSkills: ["Workflow automation"], otherSkills: [] }], certifications: [], education: [] };
const currentCv = {
  header,
  sidebar,
  summary: "Workflow specialist.",
  workExperience: [{
    company: "Example Company", role: "Workflow Specialist", period: "2022 - Present", location: "Taipei",
    subsections: [{ title: "Internal log", bullets: [{ text: "FIN AI v1.2 ticket log", evidenceIds: ["ev-old"], confidence: "Grounded", metricType: "None" }] }]
  }],
  reviewNotes: [], keywordPlacementNotes: [], interviewNotes: []
};

const repairPlan = {
  cvId: "cv-repair-regression",
  cvContentHash: "hash-repair-regression",
  failedCheckIds: ["reviewer-external-wording"],
  remainingBlockers: ["Reviewer: external wording: 1 work-log bullet(s)"],
  safeLocalItems: [],
  items: [{
    checkId: "reviewer-external-wording",
    label: "Reviewer: external wording",
    reviewerOwner: "wording",
    severity: "blocking",
    targetZones: ["workExperience"],
    preservedZones: ["header.targetRole", "header.contact", "summary", "sidebar", "export"],
    repairMode: "local-safe",
    approvalRequired: false,
    reason: "1 work-log bullet(s)"
  }]
};
repairPlan.safeLocalItems = repairPlan.items;

const result = buildLocalReviewerContentFix({
  currentCv,
  careerProfile: { workExperiences: [] },
  evidenceCards: [{
    id: "ev-safe", title: "Workflow delivery", confidence: "Grounded", visibilityUse: "CV Visible", claimLevel: "Supported",
    cvSafeBullet: "Built a workflow that improved stakeholder visibility"
  }],
  selectedEvidenceIds: ["ev-safe"],
  brief: null,
  repairPlan,
  isBulletSafe: (bullet) => !/FIN AI|ticket log/i.test(bullet.text)
});

assert.equal(result.ok, true);
assert.equal(result.status, "success");
assert.deepEqual(result.changedZones, ["workExperience"], "repair must report exact changed zone");
assert.deepEqual(result.tailoredCv.header, header, "passed header must remain unchanged");
assert.deepEqual(result.tailoredCv.sidebar, sidebar, "passed sidebar must remain unchanged");
assert.equal(result.tailoredCv.summary, currentCv.summary, "passed summary must remain unchanged");
const bullets = result.tailoredCv.workExperience.flatMap((role) => role.subsections.flatMap((section) => section.bullets));
assert.ok(bullets.some((bullet) => bullet.text.includes("improved stakeholder visibility")), "failed content area must be rebuilt");
assert.ok(bullets.every((bullet) => !/FIN AI|ticket log|v1\.2/i.test(bullet.text)), "unsafe internal wording must be removed");
const outputEvidenceIds = [...new Set(bullets.flatMap((bullet) => bullet.evidenceIds))];
assert.ok(outputEvidenceIds.includes("ev-safe"), "new repaired bullet must retain its selected evidence ID");
assert.ok(outputEvidenceIds.includes("ev-old"), "preserved existing bullet must retain its original evidence ID");
assert.ok(outputEvidenceIds.every((id) => ["ev-safe", "ev-old"].includes(id)), "repair must not invent evidence IDs");
assert.ok(bullets.every((bullet) => !bullet.metric), "repair must not invent a metric");
assert.ok(bullets.every((bullet) => !/model training|owned ML/i.test(bullet.text)), "repair must not invent unsupported claims");

console.log(JSON.stringify({ ok: true, checked: [
  "failed area changes", "passed header/sidebar unchanged", "evidence IDs stable", "no invented metric", "no unsupported claim"
] }, null, 2));
