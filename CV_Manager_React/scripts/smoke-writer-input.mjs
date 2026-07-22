import assert from "node:assert/strict";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";

const bundledModule = join(tmpdir(), `writer-input-${Date.now()}.mjs`);

await build({
  entryPoints: ["src/promptBuilders.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: bundledModule,
  logLevel: "silent"
});

const { buildScreeningCvPrompt } = await import(pathToFileURL(bundledModule).href);

const job = {
  id: "job-writer-input",
  company: "Example Company",
  role: "Workflow Quality Specialist",
  location: "Taipei",
  rawJD: "UNIQUE_JD_REQUIREMENT workflow quality and stakeholder delivery",
  status: "Evidence Ready",
  fit: "High",
  nextAction: "Generate CV",
  selectedSkillIds: ["skill-1"],
  selectedDomainKnowledgeIds: ["domain-1"],
  selectedEvidenceIds: ["ev-writer-1"],
  selectedStoryIds: ["story-1"],
  updatedAt: "2026-07-12T00:00:00.000Z",
  screeningAnalysis: {
    primaryTargetTitle: "Workflow Quality Specialist",
    summaryAngle: "UNIQUE_ANALYSIS_CONSTRAINT",
    mustHaveKeywords: ["workflow quality"],
    missingKeywords: ["unsupported platform ownership"],
    riskyClaims: ["Do not claim model training"],
    requirementMatrix: [{
      requirementId: "req-workflow-quality",
      requirement: "Workflow quality",
      normalizedRequirement: "Workflow quality",
      sourceSection: "requirements",
      atomicDimension: "CAPABILITY",
      expectedAspects: [],
      marketExpectation: "Reliable workflow delivery",
      matchingEvidenceIds: ["ev-writer-1"],
      matchingSkillIds: ["skill-1"],
      matchingStoryIds: ["story-1"],
      matchingEducationIds: [],
      matchingDomainKnowledgeIds: [],
      importance: "REQUIRED_CAPABILITY",
      matchStatus: "DIRECT_MATCH",
      supportedAspects: ["UNIQUE_EFFECTIVE_BRIEF"],
      unsupportedAspects: [],
      transferContext: "",
      explanation: "UNIQUE_ANALYSIS_CONSTRAINT",
      confidence: "High",
      cvUsage: "PRIORITIZE",
      interviewUsage: "LEAD_STORY",
      hardBlock: false,
      hardBlockReason: ""
    }]
  }
};

const data = {
  jobs: [job],
  careerProfile: {
    name: "Test Candidate", positioning: "Workflow operations",
    workExperiences: [{ id: "exp-1", company: "Example Company", role: "Workflow Quality Specialist", period: "2024", location: "Taipei", scope: "", projects: [{ id: "project-1", name: "Workflow quality", sourceIds: ["source-1"], tools: [], metrics: [], stakeholders: [], systemsOrData: [], risksOrCompliance: [], evidenceSeeds: [], starSeeds: [] }] }]
  },
  sourceOfTruth: {},
  skillInferences: [{ id: "skill-1", skill: "Workflow automation", confidence: "Grounded", strength: "Applied" }],
  domainKnowledge: [{ id: "domain-1", topic: "Quality operations", confidence: "Grounded" }],
  evidenceCards: [{
    id: "ev-writer-1",
    title: "UNIQUE_SELECTED_EVIDENCE",
    confidence: "Grounded",
    evidenceTier: "Core",
    visibilityUse: "CV Visible",
    claimLevel: "Direct Claim",
    canBeUsedInCv: "Yes",
    sourceIds: ["source-1"],
    experienceId: "exp-1",
    projectId: "project-1"
  }],
  starStories: [{ id: "story-1", title: "Quality workflow", storyConfidence: "Grounded" }],
  rawSources: [{ id: "source-1", title: "Evidence source", kind: "Resume", content: "Validated workflow quality evidence" }]
};

const prompt = buildScreeningCvPrompt(data, job.id);
assert.match(prompt, /UNIQUE_JD_REQUIREMENT/, "prompt must include the selected JD");
assert.match(prompt, /UNIQUE_ANALYSIS_CONSTRAINT/, "prompt must include Screening Analysis constraints");
assert.match(prompt, /UNIQUE_EFFECTIVE_BRIEF/, "prompt must include the effective CV Brief");
assert.doesNotMatch(prompt, /STALE_BRIEF_MUST_NOT_REACH_WRITER/, "prompt must not include a stale incomplete persisted Brief");
assert.match(prompt, /UNIQUE_SELECTED_EVIDENCE/, "prompt must include selected evidence");
assert.match(prompt, /Return valid JSON only|Return raw JSON only/, "prompt must require JSON-only output");
assert.match(prompt, /Do not force missing keywords/, "prompt must reject unsupported keyword forcing");
assert.match(prompt, /zero unsupported visible promises/, "prompt must prohibit visible overclaiming");

const repairPrompt = buildScreeningCvPrompt(data, job.id, {
  currentCv: { summary: "UNIQUE_CURRENT_CV" },
  gateFixes: ["UNIQUE_GATE_FIX"],
  failedChecks: ["UNIQUE_FAILED_CHECK"],
  contentAudit: ["UNIQUE_CONTENT_AUDIT"]
});

for (const marker of ["UNIQUE_CURRENT_CV", "UNIQUE_GATE_FIX", "UNIQUE_FAILED_CHECK", "UNIQUE_CONTENT_AUDIT"]) {
  assert.match(repairPrompt, new RegExp(marker), `repair prompt must include ${marker}`);
}
assert.match(repairPrompt, /targeted repair pass/, "repair prompt must require a targeted repair");
assert.match(repairPrompt, /Change only the sections/, "repair prompt must preserve green areas");
assert.match(repairPrompt, /Preserve passed checks/, "repair prompt must preserve passed checks");

console.log(JSON.stringify({
  ok: true,
  checked: [
    "selected JD",
    "Screening Analysis",
    "CV Brief",
    "selected evidence",
    "JSON-only contract",
    "unsupported-claim constraints",
    "targeted repair context",
    "green-area preservation"
  ]
}, null, 2));
