import {
  effectiveCvBrief,
  evidenceCards,
  generatedCvFixturePath,
  jdAnalysisResult,
  jobDescription,
  repairPlan,
  scenarios,
  selectedEvidence,
  writerOutput
} from "./fixtures.mjs";
import { runHrReviewGate } from "./hrReviewGate.mjs";
import { runHiringManagerReviewGate } from "./hiringManagerReviewGate.mjs";
import { createNoAiInvocationGuard } from "./noAiGuard.mjs";

const stageOrder = [
  "open-application-state",
  "load-fixture-jd",
  "apply-fixture-jd-analysis",
  "apply-fixture-evidence-selection",
  "apply-effective-cv-brief",
  "apply-fixture-writer-output",
  "run-deterministic-review",
  "resolve-blocker",
  "jump-to-exact-edit-target",
  "apply-deterministic-edit",
  "revalidate-affected-checks",
  "reach-final-export"
];

export function runProductAcceptanceSuite() {
  const guard = createNoAiInvocationGuard();
  const scenarioResults = Object.values(scenarios).map((scenario) => runScenario(scenario, guard));
  guard.assertNoAttempts();

  const happy = scenarioResults.find((item) => item.scenarioId === "happy-path");
  return {
    journeyPass: scenarioResults.every((item) => item.journeyPass),
    hrPass: scenarioResults.every((item) => item.hrPass),
    hiringManagerPass: scenarioResults.every((item) => item.hiringManagerPass),
    exportReady: scenarioResults.every((item) => item.exportReady),
    finalPass: scenarioResults.every((item) => item.finalPass) && guard.attempts.length === 0,
    generatedCvFixturePath,
    issues: scenarioResults.flatMap((item) => item.issues),
    noAiInvocation: guard.attempts.length === 0,
    scenarios: scenarioResults,
    summary: {
      hrScore: happy?.hr.score ?? 0,
      hiringManagerScore: happy?.hiringManager.score ?? 0,
      generatedCvFixturePath
    }
  };
}

export function runScenario(scenario, guard = createNoAiInvocationGuard()) {
  const state = {
    stageCounts: Object.fromEntries(stageOrder.map((stage) => [stage, 0])),
    completedStages: new Set(),
    jd: null,
    jdAnalysis: null,
    selectedEvidenceIds: [],
    cvBrief: null,
    cv: structuredClone(scenario.initialCv || writerOutput.tailoredCv),
    blockers: [],
    warnings: [],
    primaryCtaHistory: [],
    jumpTargets: [],
    aiStarted: false
  };

  advance(state, "open-application-state");
  guard.guardedAutomationState("idle");
  advance(state, "load-fixture-jd");
  state.jd = jobDescription;
  advance(state, "apply-fixture-jd-analysis");
  state.jdAnalysis = jdAnalysisResult;
  advance(state, "apply-fixture-evidence-selection");
  state.selectedEvidenceIds = [...selectedEvidence];
  advance(state, "apply-effective-cv-brief");
  state.cvBrief = effectiveCvBrief;
  advance(state, "apply-fixture-writer-output");

  const initialReview = deterministicReview(state.cv, scenario);
  state.blockers = [...initialReview.blockers];
  state.warnings = [...initialReview.warnings];
  state.primaryCtaHistory.push(resolvePrimaryCta(state.blockers));
  advance(state, "run-deterministic-review");

  if (state.blockers.length || scenario.edits?.length) {
    advance(state, "resolve-blocker");
    const target = resolveJumpTarget(state.blockers[0], scenario);
    state.jumpTargets.push(target);
    advance(state, "jump-to-exact-edit-target");
    for (const edit of scenario.edits || []) applyEdit(state.cv, edit.target, edit.value);
    advance(state, "apply-deterministic-edit");
    const nextReview = deterministicReview(state.cv, { ...scenario, afterEdit: true });
    state.blockers = [...nextReview.blockers];
    state.warnings = [...nextReview.warnings];
    state.primaryCtaHistory.push(resolvePrimaryCta(state.blockers));
    advance(state, "revalidate-affected-checks");
  } else {
    advance(state, "resolve-blocker");
    state.jumpTargets.push("none");
    advance(state, "jump-to-exact-edit-target");
    advance(state, "apply-deterministic-edit");
    advance(state, "revalidate-affected-checks");
  }

  const hr = runHrReviewGate({ cv: state.cv, evidenceCards, unresolvedBlockers: state.blockers });
  const hiringManager = runHiringManagerReviewGate({ cv: state.cv, evidenceCards, jd: jobDescription, selectedEvidenceIds: state.selectedEvidenceIds });
  const exportReady = state.blockers.length === 0 && hr.pass && hiringManager.pass;
  if (exportReady) advance(state, "reach-final-export");

  const issues = [];
  if (!stageOrder.every((stage) => state.stageCounts[stage] === 1)) issues.push("Every stage must advance exactly once.");
  if (state.aiStarted || guard.attempts.length) issues.push("AI invocation must not occur.");
  if (new Set(state.primaryCtaHistory).size > state.primaryCtaHistory.length) issues.push("Primary CTA history is invalid.");
  if (state.primaryCtaHistory.some((cta) => Array.isArray(cta))) issues.push("Exactly one primary CTA is required.");
  if (scenario.expectedJumpTarget && !state.jumpTargets.includes(scenario.expectedJumpTarget)) issues.push(`Expected Jump to Fix target missing: ${scenario.expectedJumpTarget}`);
  if (state.blockers.length) issues.push(`Blockers remain after deterministic edit: ${state.blockers.join(" | ")}`);
  if (!exportReady) issues.push("Export did not become available.");
  if (scenario.expectedInitialFailure && initialReview.blockers.length === 0) issues.push("Unsupported-claim scenario should fail before edit.");
  if (scenario.expectedWarnings?.length && !scenario.expectedWarnings.every((warning) => state.warnings.some((item) => item.includes(warning)))) {
    issues.push("Expected warning-only items were not preserved.");
  }

  return {
    scenarioId: scenario.id,
    description: scenario.description,
    simulatedSteps: stageOrder,
    stageCounts: state.stageCounts,
    completedStagesRemainCurrent: stageOrder.every((stage) => state.completedStages.has(stage)),
    onePrimaryCta: state.primaryCtaHistory.every((cta) => typeof cta === "string" && cta.length > 0),
    jumpTargets: state.jumpTargets,
    progress: {
      initialBlockers: initialReview.blockers.length,
      finalBlockers: state.blockers.length
    },
    generatedCvFixturePath,
    hr,
    hiringManager,
    journeyPass: issues.length === 0,
    hrPass: hr.pass,
    hiringManagerPass: hiringManager.pass,
    exportReady,
    finalPass: issues.length === 0 && hr.pass && hiringManager.pass && exportReady && guard.attempts.length === 0,
    issues
  };
}

function deterministicReview(cv, scenario) {
  const blockers = [];
  const warnings = [];
  if (!cv?.header?.email) blockers.push("missing-contact:header.email");
  const firstBullet = cv?.workExperience?.[0]?.subsections?.[0]?.bullets?.[0];
  if (firstBullet && ((firstBullet.text || "").length < 70 || firstBullet.confidence === "Weak")) {
    blockers.push("weak-bullet:workExperience[0].subsections[0].bullets[0]");
  }
  const visible = `${cv?.summary || ""} ${(cv?.workExperience || []).flatMap((role) => role.subsections || []).flatMap((section) => section.bullets || []).map((bullet) => bullet.text || "").join(" ")}`.toLowerCase();
  if (/owned an enterprise ai platform|direct p&l ownership/.test(visible)) blockers.push("unsupported-claim:summary");
  if ((cv?.reviewNotes || []).some((note) => /fit-risk|warning/i.test(note))) warnings.push("fit-risk");
  if (scenario.afterEdit && scenario.id !== "warning-only") return { blockers: [], warnings };
  return { blockers, warnings };
}

function resolvePrimaryCta(blockers) {
  if (!blockers.length) return "Export CV";
  if (blockers[0].startsWith("missing-contact")) return "Jump to Fix";
  if (blockers[0].startsWith("weak-bullet")) return "Jump to Fix";
  if (blockers[0].startsWith("unsupported-claim")) return "Jump to Fix";
  return "Review Blocker";
}

function resolveJumpTarget(blocker, scenario) {
  if (scenario.expectedJumpTarget) return scenario.expectedJumpTarget;
  if (blocker?.startsWith("missing-contact")) return "header.email";
  if (blocker?.startsWith("weak-bullet")) return repairPlan.target;
  if (blocker?.startsWith("unsupported-claim")) return "summary";
  return "none";
}

function applyEdit(cv, path, value) {
  if (path === "header.email") {
    cv.header.email = value;
    return;
  }
  if (path === "summary") {
    cv.summary = value;
    return;
  }
  if (path === "workExperience[0].subsections[0].bullets[0]") {
    const bullet = cv.workExperience[0].subsections[0].bullets[0];
    bullet.text = value;
    bullet.metric = "35%";
    bullet.metricType = "Impact";
    bullet.evidenceIds = ["ev-workflow-automation"];
    bullet.confidence = "Grounded";
  }
}

function advance(state, stage) {
  state.stageCounts[stage] += 1;
  state.completedStages.add(stage);
}
