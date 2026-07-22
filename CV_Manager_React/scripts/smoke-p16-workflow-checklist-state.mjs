import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const appRoot = fileURLToPath(new URL("../", import.meta.url));
const vite = await createServer({ root: appRoot, logLevel: "silent", server: { middlewareMode: true }, appType: "custom" });

try {
  const checklist = await vite.ssrLoadModule("/src/domain/workflowChecklistState.ts");
  const stateFor = (overrides = {}) => checklist.deriveWorkflowChecklistState({
    careerEvidenceReady: true,
    analysisCurrent: true,
    positioningCurrent: true,
    briefCurrent: false,
    analysisRunning: false,
    hardBlock: false,
    manualOverrideAllowed: true,
    cvRunActive: false,
    currentCv: false,
    hasHistoricalCv: false,
    gateReview: { current: false, historical: true, status: "missing" },
    managerAts: { current: false, status: "missing" },
    ...overrides
  });

  const noCv = stateFor();
  assert.equal(noCv.steps[4].status, "LOCKED");
  assert.equal(noCv.steps[5].status, "LOCKED");
  assert.equal(noCv.steps[6].status, "LOCKED");
  assert.match(noCv.steps[5].detail, /current Screening CV/i);
  assert.match(noCv.steps[6].detail, /current Screening CV/i);

  const lowFit = stateFor({ fitTier: "LOW_FIT", generationRecommendation: "DO_NOT_PRIORITIZE_GENERATION" });
  assert.equal(lowFit.steps[3].status, "NEEDS_ACTION");
  assert.equal(lowFit.currentStepId, "brief");
  assert.equal(lowFit.lowFitContinuationAllowed, true);

  const briefApplied = stateFor({ briefCurrent: true, fitTier: "LOW_FIT", generationRecommendation: "DO_NOT_PRIORITIZE_GENERATION" });
  assert.equal(briefApplied.steps[3].status, "DONE");
  assert.equal(briefApplied.steps[4].status, "READY");

  const currentCv = stateFor({ briefCurrent: true, currentCv: true, gateReview: { current: false, historical: false, status: "missing" } });
  assert.equal(currentCv.steps[4].status, "DONE");
  assert.equal(currentCv.steps[5].status, "READY");
  assert.equal(currentCv.steps[6].status, "LOCKED");

  const staleGate = stateFor({ briefCurrent: true, currentCv: true, gateReview: { current: false, historical: true, status: "stale" } });
  assert.equal(staleGate.steps[5].status, "STALE");
  assert.equal(staleGate.steps[6].status, "LOCKED");

  const currentGate = stateFor({ briefCurrent: true, currentCv: true, gateReview: { current: true, historical: true, status: "fresh" } });
  assert.equal(currentGate.steps[5].status, "DONE");
  assert.equal(currentGate.steps[6].status, "READY");

  const currentManager = stateFor({ briefCurrent: true, currentCv: true, gateReview: { current: true, historical: false, status: "fresh" }, managerAts: { current: true, status: "fresh" } });
  assert.equal(currentManager.steps[6].status, "DONE");

  const hardBlock = stateFor({ hardBlock: true, manualOverrideAllowed: false, fitTier: "HARD_BLOCK" });
  assert.equal(hardBlock.steps[3].status, "LOCKED");
  assert.equal(hardBlock.lowFitContinuationAllowed, false);

  const evidenceMutation = stateFor({ briefCurrent: false, currentCv: false, hasHistoricalCv: true, gateReview: { current: false, historical: true, status: "stale" } });
  assert.equal(evidenceMutation.steps[4].status, "LOCKED", "brief/evidence mutation must stale downstream CV authorization");
  assert.equal(evidenceMutation.steps[5].status, "LOCKED");

  const labSource = fs.readFileSync(new URL("../src/components/tabs/ScreeningLab.tsx", import.meta.url), "utf8");
  const styles = fs.readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.match(labSource, /aria-current=/, "current checklist action must be exposed semantically");
  assert.match(labSource, /LOW FIT · advisory, not a generation prohibition/, "LOW_FIT continuation copy must be explicit");
  assert.match(labSource, /Run Gate Review/, "Gate Review must require current-CV action");
  assert.match(styles, /grid-template-columns: repeat\(7, minmax\(0, 1fr\)\)/, "desktop checklist must avoid a blank second row");
  assert.match(styles, /@media \(max-width: 560px\)/, "checklist must have a mobile layout");

  console.log(JSON.stringify({ ok: true, ai_invoked: false, cases: 12 }, null, 2));
} finally {
  await vite.close();
}
