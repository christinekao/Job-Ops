import assert from "node:assert/strict";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";

const bundledModule = join(tmpdir(), `screening-review-state-${Date.now()}.mjs`);

await build({
  entryPoints: ["src/domain/screeningReview.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: bundledModule,
  logLevel: "silent"
});

const {
  screeningGate,
  exportVerification,
  hiringManagerReview,
  isBlockingRepairItem,
  isDisconnectedAutomationRun,
  shouldStopAiRepairLoop
} = await import(pathToFileURL(bundledModule).href);

const workflowModule = join(tmpdir(), `screening-workflow-domain-${Date.now()}.mjs`);

await build({
  entryPoints: ["src/domain/screeningWorkflow.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: workflowModule,
  logLevel: "silent"
});

const {
  deriveScreeningWorkflowState,
  shouldReplaceCurrentCvVersion
} = await import(pathToFileURL(workflowModule).href);

const jobsModule = join(tmpdir(), `screening-workflow-jobs-${Date.now()}.mjs`);

await build({
  entryPoints: ["src/data/jobs.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: jobsModule,
  logLevel: "silent"
});

const { reconcileJobsWithScreeningWorkflow } = await import(pathToFileURL(jobsModule).href);

const promptModule = join(tmpdir(), `screening-prompt-builder-${Date.now()}.mjs`);

await build({
  entryPoints: ["src/promptBuilders.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: promptModule,
  logLevel: "silent"
});

const {
  SCREENING_CV_PROMPT_VERSION,
  buildScreeningCvPrompt
} = await import(pathToFileURL(promptModule).href);

const evidenceIds = Array.from({ length: 8 }, (_, index) => `ev-${index + 1}`);
const bullets = [
  "Built chatbot quality review workflows for business stakeholders, improving operational visibility and response consistency.",
  "Validated GPT scoring outputs against human review notes, helping the team identify quality risks before production use.",
  "Coordinated ambiguous requirements with product, operations, and technical stakeholders to define practical review criteria.",
  "Improved review documentation so non-technical stakeholders could understand model behavior, exception patterns, and next actions.",
  "Supported production issue triage by documenting root causes, expected behavior, and user-facing resolution steps.",
  "Automated stakeholder notifications from evaluation findings so responsible teams could act on exceptions faster.",
  "Maintained reporting logic across quality review, issue tracking, and stakeholder communication workflows.",
  "Delivered handoff documentation to support adoption after workflow changes."
];

const fakeTailoredCv = {
  header: {
    name: "Christine Kao",
    targetRole: "AI Evaluation Scientist",
    email: "christine@example.com",
    location: "Taipei, Taiwan"
  },
  sidebar: {
    languages: [{ name: "English", level: "Professional", note: "" }],
    skillGroups: [
      {
        title: "AI Quality Operations",
        highlightedSkills: ["Chatbot evaluation", "GPT scoring workflow", "Human-review QA", "Stakeholder coordination"],
        otherSkills: ["Issue triage", "Documentation", "Workflow automation"]
      }
    ],
    certifications: [],
    education: [{ school: "Example University", degree: "MSc", period: "2010 - 2012" }]
  },
  summary: "AI quality operations candidate with chatbot evaluation, GPT scoring workflow, human-review QA, and stakeholder workflow experience.",
  workExperience: [
    {
      experienceId: "exp-current",
      company: "Example Enterprise",
      role: "Business Process Engineer",
      period: "2022 - Present",
      location: "Taipei",
      subsections: [
        {
          title: "Chatbot Quality Operations",
          bullets: bullets.map((text, index) => ({
            text,
            metric: "",
            metricType: "Impact",
            evidenceIds: [evidenceIds[index]],
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
  id: "job-workflow-smoke",
  company: "JAPAN AI",
  role: "AI Evaluation Scientist",
  location: "Remote",
  rawJD: "AI evaluation operations specialist, chatbot evaluation, GPT scoring workflow, human-review QA.",
  status: "CV Drafted",
  fit: "Medium",
  nextAction: "Review",
  selectedEvidenceIds: evidenceIds,
  selectedStoryIds: [],
  updatedAt: new Date().toISOString(),
  screeningAnalysis: {
    primaryTargetTitle: "AI Evaluation Operations Specialist",
    mustHaveKeywords: ["chatbot evaluation", "GPT scoring workflow", "human-review QA", "stakeholder coordination"],
    missingKeywords: [],
    riskyClaims: [],
    summaryAngle: "AI quality operations",
    positioning: {
      roleType: "AI quality operations",
      aiMarketArchetype: "AI evaluation operations",
      primaryHiringProblem: "Improve AI response quality through repeatable evaluation workflows",
      managerHireReason: "Can connect evaluation workflows, stakeholders, and production readiness",
      toolApplicationAngle: "Use operational workflows to support AI quality",
      applyTier: "Target"
    },
    jdEvidenceMapping: [
      {
        requirement: "Chatbot evaluation and GPT scoring workflow",
        marketExpectation: "Can support quality review and evaluation operations",
        matchingEvidenceIds: evidenceIds.slice(0, 4),
        matchingSkillIds: [],
        matchingStoryIds: [],
        supportLevel: "Strong",
        safeCvAngle: "AI quality operations and evaluation workflow support",
        gapOrRisk: ""
      }
    ],
    remainingGaps: []
  }
};

const fakeCv = {
  id: "cv-workflow-smoke",
  jdId: fakeJob.id,
  name: "Workflow Smoke CV",
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

const fakeEvidenceCards = evidenceIds.map((id, index) => ({
  id,
  title: `Evidence ${index + 1}`,
  cvSafeBullet: bullets[index],
  visibilityUse: "CV Visible",
  confidence: "Grounded",
  blockedVisibleTerms: [],
  forbiddenVisibleClaims: []
}));

const gate = screeningGate(fakeJob, fakeCv, fakeEvidenceCards);
const blockingGateFixes = gate.fixNext.filter(isBlockingRepairItem);
const manualGateFixes = gate.fixNext.filter((item) => !isBlockingRepairItem(item));
const manager = hiringManagerReview(fakeJob, fakeCv, gate);
const step6Done = Boolean(gate);
const step7NeedsAction = Boolean(manager.rewriteRequired.length || manager.wouldInterview === "No");
const fixedCv = {
  ...fakeCv,
  tailoredCv: {
    ...fakeCv.tailoredCv,
    header: {
      ...fakeCv.tailoredCv.header,
      targetRole: fakeJob.screeningAnalysis.primaryTargetTitle
    }
  }
};
const fixedGate = screeningGate(fakeJob, fixedCv, fakeEvidenceCards);
const missingContactCv = {
  ...fakeCv,
  id: "cv-missing-contact",
  tailoredCv: {
    ...fakeTailoredCv,
    header: {
      targetRole: fakeTailoredCv.header.targetRole
    }
  }
};
const missingContactExport = exportVerification(fakeJob, missingContactCv, gate);
const contactFixedCv = {
  ...missingContactCv,
  tailoredCv: {
    ...missingContactCv.tailoredCv,
    header: {
      ...missingContactCv.tailoredCv.header,
      name: "Li Ting Kao (Christine Kao)",
      email: "christinekao8@gmail.com",
      location: "Taipei City, Taiwan"
    }
  }
};

assert.equal(contactFixedCv.id, missingContactCv.id, "Local header fixes must amend the current CV instead of creating a duplicate version");
const contactFixedExport = exportVerification(fakeJob, contactFixedCv, gate);

assert.equal(gate.fixNext.length, 1, "fixture should create exactly one gate fix");
assert.match(gate.fixNext[0], /visible target title/i);
assert.equal(blockingGateFixes.length, 0, "title-only fix must not be a blocking gate fix");
assert.equal(manualGateFixes.length, 1, "title-only fix should be manual");
assert.equal(fixedGate.fixNext.length, 0, "applying recommended target title should clear title alignment fix");
assert.equal(
  missingContactExport.checks.some((check) => /contact extraction/i.test(check.label) && !check.ok),
  true,
  "missing contact details should be reported as an export blocker instead of crashing"
);
assert.equal(
  contactFixedExport.checks.some((check) => /contact extraction/i.test(check.label) && check.ok),
  true,
  "local contact header fix should clear contact extraction blocker"
);
assert.notEqual(manager.wouldInterview, "No", "title-only gate fix must not force manager review to No");
assert.equal(
  manager.rewriteRequired.some((item) => /Screening Gate/i.test(item)),
  false,
  "title-only gate fix must not create a manager rewrite blocker"
);
assert.equal(step6Done, true, "Step 6 should stay done when Gate has no blocking fixes");
assert.equal(typeof step7NeedsAction, "boolean", "Step 7 owns manager/reviewer action state");

assert.equal(
  isDisconnectedAutomationRun({ status: "running", lastRunAt: new Date().toISOString(), applied: false }, null),
  true,
  "running record with no active job should be disconnected"
);
assert.equal(
  isDisconnectedAutomationRun(
    { status: "running", lastRunAt: new Date().toISOString(), applied: false },
    { id: "auto-1", kind: "screening-cv", status: "running", createdAt: new Date().toISOString() }
  ),
  false,
  "running record with active automation job should not be disconnected"
);
assert.equal(
  isDisconnectedAutomationRun({ status: "completed", lastRunAt: new Date().toISOString(), applied: true }, null),
  false,
  "completed run should not be disconnected"
);
assert.equal(
  shouldStopAiRepairLoop({ status: "completed", mode: "repair", applied: true }, 5, 1),
  true,
  "completed AI repair with remaining blockers should stop the repeat-AI loop"
);
assert.equal(
  shouldStopAiRepairLoop({ status: "completed", mode: "generate", applied: true }, 5, 1),
  false,
  "first generation with blockers may still offer one targeted repair"
);
assert.equal(
  shouldStopAiRepairLoop({ status: "completed", mode: "generate", applied: true }, 5, 2),
  true,
  "older records with multiple CV versions should also stop repeat generation"
);

const firstPassWorkflow = deriveScreeningWorkflowState({
  careerEvidenceReady: true,
  analysisReady: true,
  terminologyReady: true,
  briefReady: true,
  hasCv: true,
  cvRunActive: false,
  gateIssueCount: 1,
  reviewerIssueCount: 5,
  reviewerReady: false,
  reviewSnapshotValid: true,
  cvVersionCount: 1,
  run: { status: "completed", mode: "generate", applied: true }
});
assert.equal(firstPassWorkflow.recommendedView, "reviewer", "a completed CV must continue to the consolidated report even when Gate has issues");
assert.equal(firstPassWorkflow.gateChecked, true, "Gate is a completed local check, not a step that needs rerunning");
assert.equal(firstPassWorkflow.finalReviewChecked, true, "final review must be tied to a valid CV review snapshot");
assert.equal(firstPassWorkflow.repairAllowed, true, "the first generation may offer one targeted repair");

const repairedWorkflow = deriveScreeningWorkflowState({
  ...firstPassWorkflow,
  careerEvidenceReady: true,
  analysisReady: true,
  terminologyReady: true,
  briefReady: true,
  hasCv: true,
  cvRunActive: false,
  gateIssueCount: 1,
  reviewerIssueCount: 5,
  reviewerReady: false,
  cvVersionCount: 1,
  run: { status: "completed", mode: "repair", applied: true }
});
assert.equal(repairedWorkflow.recommendedView, "reviewer", "a completed repair must not send the user back to Gate");
assert.equal(repairedWorkflow.repairLocked, true, "a completed repair must lock repeat AI repair");
assert.equal(repairedWorkflow.repairAllowed, false, "repeat token-spending repair must be unavailable");
assert.equal(shouldReplaceCurrentCvVersion(true, "repair"), true, "repair must update the current CV version");
assert.equal(shouldReplaceCurrentCvVersion(true, "generate"), false, "initial generation may create a new CV version");

const reconciledData = reconcileJobsWithScreeningWorkflow({
  jobs: [{
    ...fakeJob,
    status: "CV Drafted",
    nextAction: "Review Screening Gate, then export or refine.",
    screeningCvRun: { status: "completed", mode: "repair", applied: true }
  }]
});
assert.match(reconciledData.jobs[0].nextAction, /consolidated Manager \+ ATS report/i, "completed CV records must migrate away from the obsolete Gate rerun instruction");

const promptData = {
  sourceOfTruth: {},
  careerProfile: {},
  jobs: [fakeJob],
  cvVersions: [],
  skillInferences: [],
  domainKnowledge: [],
  evidenceCards: fakeEvidenceCards,
  starStories: []
};
const screeningPrompt = buildScreeningCvPrompt(promptData, fakeJob.id);
assert.equal(SCREENING_CV_PROMPT_VERSION, "screening-cv-v7-one-pass-reviewer-ready");
assert.match(screeningPrompt, /First-pass objective/i);
assert.match(screeningPrompt, /Manager Review/i);
assert.match(screeningPrompt, /Action\/outcome density/i);
assert.match(screeningPrompt, /ATS\/export readiness/i);

console.log(JSON.stringify({
  ok: true,
  checked: [
    "title-only gate fix is non-blocking",
    "manager review is not forced to No by title-only fix",
    "stale running automation state is detectable",
    "completed repair with blockers stops repeat AI recommendation",
    "completed CV continues to final report without returning to Gate",
    "final review is tied to the current CV snapshot",
    "repair updates the current CV version instead of duplicating it",
    "legacy next-action text migrates to the consolidated report",
    "screening CV prompt includes one-pass reviewer-ready gates",
    "local contact header fix clears contact extraction without AI"
  ],
  gateFixes: gate.fixNext,
  blockingGateFixes,
  manualGateFixes,
  fixedGateFixes: fixedGate.fixNext,
  step6Done,
  step7NeedsAction,
  managerWouldInterview: manager.wouldInterview
}, null, 2));
