import assert from "node:assert/strict";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";

const bundledModule = join(tmpdir(), `positioning-policy-${Date.now()}.mjs`);

await build({
  entryPoints: ["src/promptBuilders.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: bundledModule,
  logLevel: "silent"
});

const { buildScreeningCvPrompt, buildScreeningCvWriterContext } = await import(pathToFileURL(bundledModule).href);

function baseJob(id, applyTier, supportLevel) {
  return {
    id,
    company: "Example",
    role: "Azure Solution Specialist",
    location: "Taipei",
    rawJD: "Azure solution sales, quota ownership, customer cloud adoption, enterprise deal ownership",
    status: "CV Drafted",
    fit: "Unknown",
    nextAction: "Generate CV",
    selectedSkillIds: ["skill-1"],
    selectedDomainKnowledgeIds: ["domain-1"],
    selectedEvidenceIds: ["evi-1"],
    selectedStoryIds: ["story-1"],
    updatedAt: "2026-07-17T00:00:00.000Z",
    screeningAnalysis: {
      primaryTargetTitle: "Azure Solution Specialist",
      summaryAngle: "Microsoft ecosystem enablement without unsupported quota claims",
      mustHaveKeywords: ["Azure", "customer adoption"],
      supportingKeywords: ["Power Platform", "Copilot"],
      missingKeywords: ["quota ownership"],
      riskyClaims: ["quota ownership", "enterprise deal ownership", "Azure architecture ownership"],
      positioning: {
        roleType: "Deployment Engineer / FDE stretch",
        aiMarketArchetype: "AI Deployment / FDE",
        applyTier,
        primaryHiringProblem: "Needs direct Azure solution sales ownership.",
        managerHireReason: "Hire someone who can grow cloud consumption.",
        toolApplicationAngle: "Translate business workflow needs into Microsoft ecosystem enablement.",
        positioningRationale: ["Evidence supports enablement but not quota ownership."],
        safestPositioning: "Position as Microsoft ecosystem enablement, not quota-carrying Azure sales.",
        headlineRecommendation: "Microsoft Ecosystem Enablement Specialist",
        whyThisFits: ["Power Platform governance", "Copilot adoption analytics"],
        hiddenSkillsToSurface: ["Power Platform governance", "Copilot adoption analytics"],
        evidenceToSuppress: [],
        claimsToAvoid: ["quota ownership", "Azure sales ownership", "enterprise deal ownership"],
        interviewRiskQuestions: ["What quota did you carry?"]
      },
      jdEvidenceMapping: [
        {
          requirement: "Microsoft ecosystem adoption",
          marketExpectation: "Enable customers and stakeholders",
          matchingEvidenceIds: ["evi-1"],
          matchingSkillIds: ["skill-1"],
          matchingStoryIds: ["story-1"],
          supportLevel: supportLevel === "Unsupported" ? "Partial" : supportLevel,
          safeCvAngle: "Supported Microsoft ecosystem enablement",
          gapOrRisk: ""
        },
        {
          requirement: "quota-carrying Azure sales",
          marketExpectation: "Own cloud consumption and enterprise deals",
          matchingEvidenceIds: [],
          matchingSkillIds: [],
          matchingStoryIds: [],
          supportLevel: supportLevel === "Strong" ? "Weak" : "Unsupported",
          safeCvAngle: "Do not claim quota ownership",
          gapOrRisk: "No evidence supports quota-carrying Azure sales."
        }
      ],
      remainingGaps: [
        {
          gap: "quota-carrying Azure sales",
          riskLevel: "High",
          mitigation: "Position as transferable Microsoft enablement only."
        }
      ]
    }
  };
}

function dataFor(job) {
  return {
    jobs: [job],
    rawSources: [],
    sourceOfTruth: { positioning: "", claimBoundaries: "Do not invent quota or sales ownership." },
    careerProfile: {
      identity: "Test Candidate",
      targetRoles: [],
      positioning: "Microsoft ecosystem operations",
      education: [],
      certifications: [],
      skillGroups: [],
      workExperiences: [{ id: "exp-1", company: "Example", role: "Business Analyst", period: "2022 - Present", location: "Taipei", scope: "", projects: [] }],
      claimBoundaries: "No direct quota or Azure sales ownership."
    },
    skillInferences: [{ id: "skill-1", skill: "Power Platform governance", cvWording: "Power Platform governance", confidence: "Grounded", strength: "Strong", usageContext: "governed" }],
    domainKnowledge: [{ id: "domain-1", domain: "Microsoft 365 adoption", businessProcess: "Copilot adoption", stakeholders: [], systemsOrData: [], riskOrCompliance: "", metricsOrKpis: [], proof: "", cvWording: "Copilot adoption analytics", confidence: "Grounded" }],
    evidenceCards: [{
      id: "evi-1",
      title: "Copilot adoption dashboard",
      confidence: "Grounded",
      evidenceTier: "Core",
      visibilityUse: "CV Visible",
      claimLevel: "Conservative Claim",
      cvSafeBullet: "Built adoption visibility for Microsoft 365 Copilot usage and licensing decisions.",
      allowedVisibleClaims: ["Copilot adoption analytics", "license visibility"],
      forbiddenVisibleClaims: ["quota ownership", "Azure sales ownership", "enterprise deal ownership"],
      tools: ["Power BI", "Microsoft 365 Copilot"]
    }],
    starStories: [{ id: "story-1", title: "Copilot adoption", tags: [], situation: "", task: "", action: "", result: "Improved adoption visibility.", evidenceIds: ["evi-1"], storyConfidence: "Strong" }]
  };
}

const goodJob = baseJob("good-fit", "Good", "Strong");
const riskyJob = baseJob("risky-fit", "Stretch", "Partial");
const weakJob = baseJob("weak-fit", "Avoid", "Unsupported");

for (const [job, expectedFit] of [[goodJob, "Good"], [riskyJob, "Risky"], [weakJob, "Weak"]]) {
  const data = dataFor(job);
  const context = buildScreeningCvWriterContext(data, job.id);
  assert.equal(context.positioningReport.overallFit, expectedFit, `${job.id} must map to ${expectedFit}`);
  const prompt = buildScreeningCvPrompt(data, job.id);
  assert.match(prompt, /Fit tier handling/, "Writer prompt must include fit-tier generation policy");
  assert.match(prompt, /Positioning Report:/, "Writer prompt must include Positioning Report context");
  assert.match(prompt, /positioningReport/, "Writer output schema must include positioningReport");
  assert.match(prompt, /still generate the CV/i, "Writer must not refuse weak-fit generation");
}

const weakContext = buildScreeningCvWriterContext(dataFor(weakJob), weakJob.id);
assert.equal(weakContext.positioningReport.recommendedPositioning.targetRoleTreatment, "not-recommended");
assert.ok(
  weakContext.positioningReport.unsupportedClaimsPrevented.some((item) => /quota|Azure sales|enterprise deal/i.test(item.claim)),
  "Weak/Avoid report must explicitly prevent unsupported Azure sales wording"
);
assert.ok(
  weakContext.positioningReport.truthfulCapabilityGaps.some((item) => /quota/i.test(item.requirement)),
  "Weak/Avoid report must explain truthful capability gaps"
);

console.log(JSON.stringify({
  ok: true,
  checked: [
    "Good Fit maps to direct truthful positioning",
    "Risky Fit maps to conservative adjacent positioning",
    "Weak/Avoid still generates writer prompt",
    "Positioning Report is included in writer context and schema",
    "unsupported Azure sales wording is prevented"
  ]
}, null, 2));
