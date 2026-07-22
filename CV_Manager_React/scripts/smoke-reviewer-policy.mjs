import assert from "node:assert/strict";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";

const bundledModule = join(tmpdir(), `reviewer-policy-${Date.now()}.mjs`);

await build({
  entryPoints: ["src/domain/screeningReview.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: bundledModule,
  logLevel: "silent"
});

const { screeningGate, hiringManagerReview, reviewerPass, createReviewSnapshot } = await import(pathToFileURL(bundledModule).href);

const evidenceCards = Array.from({ length: 8 }, (_, index) => ({
  id: `ev-${index + 1}`,
  title: `Evidence ${index + 1}`,
  category: "Workflow automation",
  tools: ["Power Automate", "SharePoint"],
  proof: "Grounded test evidence",
  metrics: "",
  confidence: "Grounded",
  evidenceTier: "Core",
  visibilityUse: "CV Visible",
  claimLevel: "Direct Claim"
}));

const baseCv = {
  id: "cv-reviewer-policy",
  jdId: "job-reviewer-policy",
  name: "Reviewer policy smoke CV",
  summary: "Business automation specialist with Power Automate, SharePoint, and stakeholder workflow delivery experience.",
  content: "Business automation specialist with Power Automate, SharePoint, and stakeholder workflow delivery experience. ".repeat(30),
  status: "Ready for Review",
  updatedAt: "2026-07-17T00:00:00.000Z",
  tailoredCv: {
    header: {
      name: "Christine Kao",
      targetRole: "Business Automation Specialist",
      email: "christine@example.com",
      location: "Taipei"
    },
    sidebar: {
      languages: [],
      skillGroups: [{ title: "Automation", highlightedSkills: ["Power Automate", "SharePoint"], otherSkills: ["Workflow automation", "Stakeholder coordination"] }],
      certifications: [],
      education: []
    },
    summary: "Business automation specialist with Power Automate, SharePoint, and stakeholder workflow delivery experience.",
    workExperience: [
      {
        company: "Example",
        role: "Business Process Engineer",
        period: "2022 - Present",
        location: "Taipei",
        subsections: [
          {
            title: "Workflow Automation",
            bullets: evidenceCards.map((card, index) => ({
              text: `Built workflow automation control ${index + 1} to improve stakeholder visibility and operational follow-up.`,
              evidenceIds: [card.id],
              confidence: "Grounded",
              metricType: "Impact"
            }))
          }
        ]
      }
    ],
    reviewNotes: [],
    keywordPlacementNotes: [],
    interviewNotes: []
  }
};

function baseJob(overrides = {}) {
  return {
    id: "job-reviewer-policy",
    company: "Example",
    role: "Business Automation Specialist",
    location: "Taipei",
    rawJD: "Power Automate SharePoint workflow automation stakeholder coordination",
    status: "CV Drafted",
    fit: "High",
    nextAction: "Review",
    selectedEvidenceIds: evidenceCards.map((card) => card.id),
    selectedStoryIds: [],
    updatedAt: "2026-07-17T00:00:00.000Z",
    screeningAnalysis: {
      primaryTargetTitle: "Business Automation Specialist",
      mustHaveKeywords: ["Power Automate", "SharePoint", "workflow automation"],
      missingKeywords: [],
      riskyClaims: [],
      summaryAngle: "Grounded workflow automation",
      positioning: {
        roleType: "Business Automation / AI Ops",
        applyTier: "Good",
        safestPositioning: "Business automation specialist",
        headlineRecommendation: "Business Automation Specialist",
        whyThisFits: ["Power Automate evidence"],
        hiddenSkillsToSurface: [],
        evidenceToSuppress: [],
        claimsToAvoid: ["quota ownership"],
        interviewRiskQuestions: []
      },
      positioningReport: {
        overallFit: "Good",
        transferableStrengths: [],
        truthfulCapabilityGaps: [],
        unsupportedClaimsPrevented: [{ claim: "quota ownership", reason: "Unsupported", mustNotClaim: ["quota ownership"] }],
        recommendedPositioning: {
          headline: "Business Automation Specialist",
          summaryAngle: "Grounded workflow automation",
          targetRoleTreatment: "direct-fit",
          wordingGuidance: ["Strengthen wording only when supported by selected evidence."]
        },
        remainingHiringRisks: []
      },
      jdEvidenceMapping: [
        {
          requirement: "workflow automation",
          marketExpectation: "Build business workflows",
          matchingEvidenceIds: ["ev-1"],
          matchingSkillIds: [],
          matchingStoryIds: [],
          supportLevel: "Strong",
          safeCvAngle: "Supported workflow automation",
          gapOrRisk: ""
        }
      ],
      remainingGaps: [],
      recommendedEvidenceIds: evidenceCards.map((card) => card.id),
      recommendedSkillIds: [],
      recommendedDomainKnowledgeIds: [],
      recommendedStoryIds: []
    },
    ...overrides
  };
}

function review(job, cv = baseCv) {
  const gate = screeningGate(job, cv, evidenceCards);
  const manager = hiringManagerReview(job, cv, gate, evidenceCards);
  return reviewerPass(job, cv, gate, manager, evidenceCards);
}

const passReview = review(baseJob());
assert.equal(passReview?.structuredResult.positioningAuthority, "ScreeningAnalysis");
assert.equal(passReview?.structuredResult.positioningReportMode, "read-only-derived-view");
assert.equal(passReview?.structuredResult.summary.unsupportedClaimCount, 0);
assert.equal(passReview?.structuredResult.truthfulnessStatus, "truthful");

const gapJob = baseJob({
  screeningAnalysis: {
    ...baseJob().screeningAnalysis,
    positioning: {
      ...baseJob().screeningAnalysis.positioning,
      applyTier: "Avoid",
      safestPositioning: "Transferable business automation support"
    },
    positioningReport: {
      ...baseJob().screeningAnalysis.positioningReport,
      overallFit: "Weak",
      truthfulCapabilityGaps: [{
        requirement: "quota ownership",
        reason: "No evidence supports quota ownership.",
        riskLevel: "High",
        mitigation: "Do not claim quota ownership."
      }],
      recommendedPositioning: {
        headline: "Transferable Business Automation Support",
        summaryAngle: "Transferable workflow enablement",
        targetRoleTreatment: "not-recommended",
        wordingGuidance: ["Do not pretend direct fit."]
      }
    },
    jdEvidenceMapping: [
      ...baseJob().screeningAnalysis.jdEvidenceMapping,
      {
        requirement: "quota ownership",
        marketExpectation: "Own sales quota",
        matchingEvidenceIds: [],
        matchingSkillIds: [],
        matchingStoryIds: [],
        supportLevel: "Unsupported",
        safeCvAngle: "Do not claim quota ownership",
        gapOrRisk: "No quota evidence."
      }
    ],
    remainingGaps: [{ gap: "quota ownership", riskLevel: "High", mitigation: "Do not claim quota ownership." }]
  }
});
const gapReview = review(gapJob);
assert.equal(gapReview?.structuredResult.summary.unsupportedClaimCount, 0, "truthful gaps must not become unsupported claims");
assert.ok(gapReview?.structuredResult.issues.some((issue) => issue.category === "Capability Gap" && issue.repairability === "not-repairable"));
assert.equal(gapReview?.structuredResult.truthfulnessStatus, "truthful");

const unsupportedCv = {
  ...baseCv,
  tailoredCv: {
    ...baseCv.tailoredCv,
    summary: `${baseCv.tailoredCv.summary} Owned quota ownership for enterprise sales.`
  }
};
const unsupportedReview = review(gapJob, unsupportedCv);
assert.equal(unsupportedReview?.structuredResult.summary.unsupportedClaimCount, 1);
assert.equal(unsupportedReview?.structuredResult.truthfulnessStatus, "unsupported-claims");
assert.ok(unsupportedReview?.structuredResult.issues.some((issue) => issue.category === "Unsupported Claim" && issue.exportSignal === "block"));

const snapshot = createReviewSnapshot(baseJob(), baseCv, evidenceCards);
assert.ok(snapshot.structuredReviewResult, "review snapshot must preserve structured review result when available");
assert.equal(snapshot.structuredReviewResult.positioningAuthority, "ScreeningAnalysis");

console.log("smoke:reviewer-policy passed");
