import assert from "node:assert/strict";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFileSync } from "node:fs";

const bundledModule = join(tmpdir(), `screening-review-checks-${Date.now()}.mjs`);

await build({
  entryPoints: ["src/domain/screeningReview.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: bundledModule,
  logLevel: "silent"
});

const { screeningGate, reviewerPass, exportVerification, createReviewSnapshot, isReviewSnapshotValidForCv, reconcileReviewSnapshotIdentity } = await import(pathToFileURL(bundledModule).href);

const bullets = [
  "Built a workflow automation intake process for business stakeholders, reducing manual follow-up and improving operational visibility.",
  "Validated reporting outputs across dashboard and source data, improving confidence in weekly management review.",
  "Coordinated requirements with HR, legal, and technical stakeholders to translate ambiguous process rules into system logic.",
  "Supported production issue triage by documenting root causes, expected behavior, and user-facing resolution steps.",
  "Automated stakeholder notifications from dashboard results so responsible teams could act on exceptions faster.",
  "Maintained Power Platform workflow logic across form intake, approval routing, and status communication.",
  "Delivered user enablement notes and handoff documentation to support adoption after workflow changes.",
  "Improved cross-functional reporting clarity by connecting operational data, action owners, and business context."
];

const fakeTailoredCv = {
  header: {
    name: "Christine Kao",
    targetRole: "Business Automation Specialist",
    email: "christine@example.com",
    location: "Taipei, Taiwan"
  },
  sidebar: {
    languages: [{ name: "English", level: "Professional", note: "" }],
    skillGroups: [
      {
        title: "Business Automation",
        highlightedSkills: ["Power Automate", "Power Apps", "SharePoint", "Power BI"],
        otherSkills: ["Workflow automation", "Stakeholder coordination", "Production support"]
      }
    ],
    certifications: ["Microsoft Power Platform Fundamentals"],
    education: [{ school: "Example University", degree: "MSc", period: "2010 - 2012" }]
  },
  summary: "Business automation and workflow specialist with experience translating operational requirements into Power Platform workflows, reporting processes, and stakeholder-ready documentation. Focused on improving manual processes, validating data flows, and supporting production-ready internal business systems.",
  workExperience: [
    {
      experienceId: "exp-current",
      company: "Example Enterprise",
      role: "Business Process Engineer",
      period: "2022 - Present",
      location: "Taipei",
      subsections: [
        {
          title: "Workflow Automation and Production Support",
          bullets: bullets.slice(0, 6).map((text, index) => ({
            text,
            metric: "",
            metricType: "Impact",
            evidenceIds: [`ev-${index + 1}`],
            confidence: "Grounded"
          }))
        }
      ]
    },
    {
      experienceId: "exp-prior",
      company: "Prior Analytics Company",
      role: "Data Analyst",
      period: "2020 - 2022",
      location: "Taipei",
      subsections: [
        {
          title: "Reporting and Stakeholder Enablement",
          bullets: bullets.slice(6).map((text, index) => ({
            text,
            metric: "",
            metricType: "Impact",
            evidenceIds: [`ev-${index + 7}`],
            confidence: "Grounded"
          }))
        }
      ]
    }
  ],
  keywordPlacementNotes: [],
  interviewNotes: [],
  reviewNotes: []
};

const fakeJob = {
  id: "job-fake",
  company: "Mock Company",
  role: "Business Automation Specialist",
  location: "Remote",
  rawJD: "Power Platform workflow automation, stakeholder management, reporting, production support.",
  status: "CV Drafted",
  fit: "High",
  nextAction: "Run reviewer check",
  selectedEvidenceIds: bullets.map((_, index) => `ev-${index + 1}`),
  selectedStoryIds: [],
  updatedAt: new Date().toISOString(),
  screeningAnalysis: {
    primaryTargetTitle: "Business Automation Specialist",
    mustHaveKeywords: ["Power Automate", "Power Apps", "workflow automation", "stakeholder coordination"],
    missingKeywords: [],
    riskyClaims: [],
    summaryAngle: "Business automation and workflow support",
    jdEvidenceMapping: [
      {
        requirement: "Power Platform workflow automation",
        marketExpectation: "Can automate internal business processes",
        matchingEvidenceIds: ["ev-1", "ev-6"],
        matchingSkillIds: [],
        matchingStoryIds: [],
        supportLevel: "Strong",
        safeCvAngle: "Power Platform workflow automation",
        gapOrRisk: ""
      }
    ],
    remainingGaps: []
  }
};

const fakeCv = {
  id: "cv-fake",
  jdId: fakeJob.id,
  name: "Mock CV",
  summary: fakeTailoredCv.summary,
  content: [
    fakeTailoredCv.header.name,
    fakeTailoredCv.header.targetRole,
    fakeTailoredCv.summary,
    ...bullets
  ].join("\n"),
  tailoredCv: fakeTailoredCv,
  status: "Draft",
  updatedAt: new Date().toISOString()
};

const fakeEvidenceCards = bullets.map((text, index) => ({
  id: `ev-${index + 1}`,
  title: `Evidence ${index + 1}`,
  cvSafeBullet: text,
  tools: [],
  proof: text,
  metrics: "",
  sourceIds: [],
  confidence: "Grounded"
}));

const serviceNowEvidence = {
  id: "ev-servicenow",
  title: "ServiceNow intake workflow evidence",
  cvSafeBullet: "Configured ServiceNow intake workflow routing for internal requests.",
  tools: ["ServiceNow"],
  proof: "ServiceNow workflow routing evidence",
  metrics: "",
  relatedJdKeywords: ["ServiceNow"],
  sourceIds: [],
  confidence: "Grounded"
};

const fakeGatePass = {
  coveredKeywords: ["Power Automate", "Power Apps", "workflow automation", "stakeholder coordination"],
  missingKeywords: [],
  supportedMissingKeywords: [],
  unsupportedMissingKeywords: [],
  keywordPlacements: [],
  unresolvedRiskyClaims: [],
  evidenceCoverageCount: 8,
  fixNext: [],
  checks: []
};

const fakeManagerPass = {
  wouldInterview: "Yes",
  interviewConfidence: "High",
  positives: ["Clear title alignment", "Shows Power Platform workflow automation", "Enough work bullets"],
  risks: [],
  rewriteRequired: [],
  checks: []
};

const reviewerOk = reviewerPass(fakeJob, fakeCv, fakeGatePass, fakeManagerPass, fakeEvidenceCards);
const exportOk = exportVerification(fakeJob, fakeCv, fakeGatePass);
const reviewSnapshot = createReviewSnapshot(fakeJob, fakeCv, fakeEvidenceCards);

const honestGapJob = {
  ...fakeJob,
  screeningAnalysis: {
    ...fakeJob.screeningAnalysis,
    jdEvidenceMapping: [
      ...fakeJob.screeningAnalysis.jdEvidenceMapping,
      {
        requirement: "Kubernetes production ownership",
        marketExpectation: "Can own Kubernetes runtime operations",
        matchingEvidenceIds: [],
        matchingSkillIds: [],
        matchingStoryIds: [],
        supportLevel: "Unsupported",
        safeCvAngle: "Kubernetes production ownership",
        gapOrRisk: "No Kubernetes production ownership evidence"
      }
    ],
    remainingGaps: [
      {
        gap: "Kubernetes production ownership",
        riskLevel: "High",
        mitigation: "Keep this as an interview risk instead of a visible CV claim."
      }
    ]
  }
};

const honestGapReview = reviewerPass(honestGapJob, fakeCv, fakeGatePass, fakeManagerPass, fakeEvidenceCards);

const visibleUnsupportedCv = {
  ...fakeCv,
  tailoredCv: {
    ...fakeTailoredCv,
    workExperience: [
      {
        ...fakeTailoredCv.workExperience[0],
        subsections: [
          {
            ...fakeTailoredCv.workExperience[0].subsections[0],
            bullets: [
              ...fakeTailoredCv.workExperience[0].subsections[0].bullets,
              {
                text: "Owned Kubernetes production ownership for runtime operations across business-critical services.",
                metric: "",
                metricType: "Impact",
                evidenceIds: ["ev-1"],
                confidence: "Weak"
              }
            ]
          }
        ]
      },
      fakeTailoredCv.workExperience[1]
    ]
  }
};

const visibleUnsupportedReview = reviewerPass(honestGapJob, visibleUnsupportedCv, fakeGatePass, fakeManagerPass, fakeEvidenceCards);

const unknownKeywordJob = {
  ...fakeJob,
  selectedEvidenceIds: fakeJob.selectedEvidenceIds,
  screeningAnalysis: {
    ...fakeJob.screeningAnalysis,
    mustHaveKeywords: [...fakeJob.screeningAnalysis.mustHaveKeywords, "ServiceNow"]
  }
};

const unknownWithoutEvidenceGate = screeningGate(unknownKeywordJob, fakeCv, fakeEvidenceCards);
const unknownWithEvidenceGate = screeningGate(
  { ...unknownKeywordJob, selectedEvidenceIds: [...fakeJob.selectedEvidenceIds, serviceNowEvidence.id] },
  fakeCv,
  [...fakeEvidenceCards, serviceNowEvidence]
);

const weakWithEvidenceGate = screeningGate(
  {
    ...unknownKeywordJob,
    selectedEvidenceIds: [...fakeJob.selectedEvidenceIds, serviceNowEvidence.id],
    screeningAnalysis: {
      ...unknownKeywordJob.screeningAnalysis,
      jdEvidenceMapping: [
        ...unknownKeywordJob.screeningAnalysis.jdEvidenceMapping,
        {
          requirement: "ServiceNow workflow",
          marketExpectation: "Can own ServiceNow workflow delivery",
          matchingEvidenceIds: [serviceNowEvidence.id],
          matchingSkillIds: [],
          matchingStoryIds: [],
          supportLevel: "Weak",
          safeCvAngle: "ServiceNow workflow",
          gapOrRisk: "Only light ServiceNow evidence exists"
        }
      ]
    }
  },
  fakeCv,
  [...fakeEvidenceCards, serviceNowEvidence]
);

const badCv = {
  ...fakeCv,
  content: "Too short",
  tailoredCv: {
    ...fakeTailoredCv,
    header: { ...fakeTailoredCv.header, email: "", location: "" },
    workExperience: [
      {
        ...fakeTailoredCv.workExperience[0],
        subsections: [
          {
            title: "Internal Evidence Notes",
            bullets: [
              {
                text: "Worked on evidence card and source file review note.",
                metric: "",
                metricType: "Internal Activity",
                evidenceIds: [],
                confidence: "Weak"
              }
            ]
          }
        ]
      }
    ]
  }
};

const reviewerBad = reviewerPass(fakeJob, badCv, fakeGatePass, fakeManagerPass, fakeEvidenceCards);
const exportBad = exportVerification(fakeJob, badCv, fakeGatePass);

const result = {
  passFixture: {
    reviewerReady: reviewerOk?.ready,
    exportReady: exportOk?.ready,
    reviewerBlockers: reviewerOk?.blockers || [],
    exportBlockers: exportOk?.blockers || []
  },
  failFixture: {
    reviewerReady: reviewerBad?.ready,
    exportReady: exportBad?.ready,
    reviewerBlockers: reviewerBad?.blockers || [],
    exportBlockers: exportBad?.blockers || []
  },
  honestFitGapFixture: {
    reviewerReady: honestGapReview?.ready,
    checks: honestGapReview?.checks || [],
    blockers: honestGapReview?.blockers || []
  },
  visibleUnsupportedClaimFixture: {
    reviewerReady: visibleUnsupportedReview?.ready,
    blockers: visibleUnsupportedReview?.blockers || []
  },
  keywordSupportFixture: {
    unknownWithoutEvidence: unknownWithoutEvidenceGate,
    unknownWithEvidence: unknownWithEvidenceGate,
    weakWithEvidence: weakWithEvidenceGate
  }
};

assert.equal(reviewerOk?.ready, true, `pass fixture must pass reviewer checks: ${(reviewerOk?.blockers || []).join("; ")}`);
assert.equal(exportOk?.ready, true, `pass fixture must pass export checks: ${(exportOk?.blockers || []).join("; ")}`);
assert.equal(reviewSnapshot.cvUpdatedAt, fakeCv.updatedAt, "review snapshot must identify the exact CV revision it checked");
assert.ok(reviewSnapshot.snapshotId, "new review snapshot must have snapshotId");
assert.ok(reviewSnapshot.updatedAt, "new review snapshot must have updatedAt");
assert.ok(reviewSnapshot.contentHash, "new review snapshot must have contentHash");
assert.equal(reviewSnapshot.ready, true, "passing CV must produce a ready review snapshot");

const reviewedCv = { ...fakeCv, reviewSnapshot };
const timestampOnlyChange = { ...reviewedCv, updatedAt: "2026-07-13T00:00:00.000Z" };
assert.equal(isReviewSnapshotValidForCv(timestampOnlyChange), true, "unchanged CV content with a new timestamp must keep review valid");
assert.ok(reconcileReviewSnapshotIdentity(timestampOnlyChange).reviewSnapshot, "timestamp-only change must not clear review");

const changedContent = { ...timestampOnlyChange, summary: `${timestampOnlyChange.summary} changed` };
assert.equal(isReviewSnapshotValidForCv(changedContent), false, "changed CV content must invalidate hash-bound review");
assert.equal(reconcileReviewSnapshotIdentity(changedContent).reviewSnapshot, undefined, "stale hash-bound review must be cleared on safe write");

const legacySnapshot = { ...reviewSnapshot };
delete legacySnapshot.snapshotId;
delete legacySnapshot.updatedAt;
delete legacySnapshot.contentHash;
const legacyCv = { ...fakeCv, updatedAt: "2026-07-14T00:00:00.000Z", reviewSnapshot: legacySnapshot };
assert.equal(isReviewSnapshotValidForCv(legacyCv), true, "legacy snapshot without contentHash must remain usable");
const enrichedLegacyCv = reconcileReviewSnapshotIdentity(legacyCv);
assert.ok(enrichedLegacyCv.reviewSnapshot?.contentHash, "missing legacy contentHash must be populated lazily");
assert.ok(enrichedLegacyCv.reviewSnapshot?.snapshotId, "missing legacy snapshotId must be populated lazily");
assert.equal(enrichedLegacyCv.id, legacyCv.id, "unrelated CV identity must remain unchanged");
assert.equal(enrichedLegacyCv.jdId, legacyCv.jdId, "unrelated job identity must remain unchanged");
assert.equal(enrichedLegacyCv.status, legacyCv.status, "unrelated CV status must remain unchanged");
assert.equal(reviewerBad?.ready, false, "fail fixture must be blocked by reviewer checks");
assert.equal(exportBad?.ready, false, "fail fixture must be blocked by export checks");
assert.equal(honestGapReview?.ready, true, `honestly omitted unsupported JD gap must not fail visible-CV integrity: ${(honestGapReview?.blockers || []).join("; ")}`);
assert.ok(
  honestGapReview?.checks.some((check) => check.label === "Reviewer: application fit risk" && check.value.includes("1 unsupported mapping")),
  "honest unsupported JD gap must remain visible as application-fit risk"
);
assert.equal(visibleUnsupportedReview?.ready, false, "visible unsupported JD claim must still fail reviewer integrity");
assert.ok(
  (visibleUnsupportedReview?.blockers || []).some((blocker) => blocker.startsWith("Reviewer: unsupported claims")),
  "visible unsupported JD claim must fail the unsupported-claims check"
);
assert.ok(
  unknownWithoutEvidenceGate.unsupportedMissingKeywords.includes("ServiceNow"),
  "Unknown missing keyword without selected evidence must not be treated as supported"
);
assert.equal(
  unknownWithoutEvidenceGate.supportedMissingKeywords.includes("ServiceNow"),
  false,
  "Unknown missing keyword without selected evidence must stay out of supported missing keywords"
);
assert.ok(
  unknownWithEvidenceGate.supportedMissingKeywords.includes("ServiceNow"),
  "Unknown missing keyword with selected evidence can remain supported"
);
assert.ok(
  weakWithEvidenceGate.unsupportedMissingKeywords.includes("ServiceNow"),
  "Weak missing keyword must not become supported through keyword evidence alone"
);
assert.equal(
  weakWithEvidenceGate.supportedMissingKeywords.includes("ServiceNow"),
  false,
  "Weak missing keyword must stay out of supported missing keywords"
);

writeFileSync(join(tmpdir(), "screening-reviewer-smoke-result.json"), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
