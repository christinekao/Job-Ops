import { strict as assert } from "node:assert";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

async function bundle(entry, name) {
  const outfile = join(tmpdir(), `${name}-${Date.now()}.mjs`);
  await build({ entryPoints: [entry], bundle: true, format: "esm", platform: "node", outfile, logLevel: "silent" });
  return import(pathToFileURL(outfile).href);
}

const { createHumanDecisionPrompt, applyHumanDecision } = await bundle("src/domain/humanDecisionLayer.ts", "human-decision-layer");
const { contentHash } = await bundle("src/utils/hash.ts", "human-decision-hash");

const cv = {
  header: { name: "Candidate", targetRole: "Solution Specialist", email: "candidate@example.com", location: "Taipei" },
  sidebar: { languages: [], skillGroups: [], certifications: [], education: [] },
  summary: "Qualified candidate who owned enterprise AI adoption.",
  workExperience: [],
  keywordPlacementNotes: [],
  interviewNotes: [],
  reviewNotes: []
};
const cvHash = contentHash(cv);
const cvVersion = {
  id: "cv-v1",
  jdId: "job-1",
  name: "Target CV",
  summary: cv.summary,
  content: JSON.stringify(cv),
  tailoredCv: cv,
  status: "Ready for Review",
  updatedAt: "2026-07-13T00:00:00.000Z"
};

const prompt = createHumanDecisionPrompt({
  currentSummary: cv.summary,
  classification: {
    blockerId: "blocker-positioning",
    route: "human-decision",
    reason: "This changes career positioning and requires user judgement.",
    evidenceIds: ["ev-positioning"],
    cvVersionId: cvVersion.id,
    cvContentHash: cvHash,
    risk: "high",
    confidence: "low",
    allowedMutationZones: ["summary"],
    prohibitedMutationZones: ["workExperience"],
    requiresUserApproval: true,
    canUseExistingLocalRepair: false,
    canRequestAiProposal: false
  }
});

assert.match(prompt.question, /Which factual positioning/, "prompt must show exact human question");
assert.match(prompt.whyAiCannotDecide, /requires user judgement/, "prompt must explain why AI cannot decide");
assert.equal(prompt.options.length >= 2, true, "prompt must provide options");
assert.deepEqual(prompt.options[0].evidenceIds, ["ev-positioning"], "options must carry evidence IDs");
assert.match(prompt.options[0].downstreamImpact, /risk/i, "options must explain downstream impact");

const noChoice = applyHumanDecision({
  cvVersion,
  currentCvVersionId: cvVersion.id,
  currentContentHash: cvHash,
  prompt
});
assert.equal(noChoice.status, "requires-user-choice", "AI must not choose human decision automatically");

const stale = applyHumanDecision({
  cvVersion,
  currentCvVersionId: cvVersion.id,
  currentContentHash: "stale-hash",
  prompt,
  selectedOptionId: "keep-conservative"
});
assert.equal(stale.status, "stale", "stale human decision must be rejected");

const applied = applyHumanDecision({
  cvVersion,
  currentCvVersionId: cvVersion.id,
  currentContentHash: cvHash,
  prompt,
  selectedOptionId: "keep-conservative",
  now: "2026-07-13T01:00:00.000Z"
});
assert.equal(applied.status, "applied", "authorized human decision should apply deterministically");
assert.ok(applied.nextVersion, "authorized human decision must create a new CV version");
assert.equal(applied.nextVersion.tailoredCv.summary.includes("owned"), false, "authorized wording should be applied");
assert.deepEqual(applied.evidenceIds, ["ev-positioning"], "applied decision must retain evidence IDs");

console.log(JSON.stringify({
  ok: true,
  checks: [
    "exact question shown",
    "why AI cannot decide shown",
    "options shown",
    "evidence per option retained",
    "downstream impact shown",
    "AI does not choose",
    "stale decision rejected",
    "authorized decision applies",
    "new CV version created"
  ]
}, null, 2));
