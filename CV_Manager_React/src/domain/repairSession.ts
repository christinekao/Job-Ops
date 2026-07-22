import type {
  RepairSessionInput,
  RepairSessionResult,
  RepairSessionReviewFamily,
  RepairSessionStopReason
} from "./repairSession.types";
import type { RepairOrchestrationSummary } from "./repairOrchestrator.types";

const DEFAULT_MAX_ITERATIONS = 3;

function blockerKey(orchestration: RepairOrchestrationSummary) {
  return [
    ...orchestration.safeAuto,
    ...orchestration.approvalRequired,
    ...orchestration.humanDecision,
    ...orchestration.unsupported
  ].map((item) => `${item.route}:${item.blockerId}`).sort().join("|");
}

function totalRepairable(orchestration: RepairOrchestrationSummary) {
  return orchestration.safeAuto.length + orchestration.approvalRequired.length;
}

function uniqueFamilies(families: RepairSessionReviewFamily[]) {
  return Array.from(new Set(families));
}

function stop(input: {
  reason: RepairSessionStopReason;
  cvVersion: RepairSessionInput["initialCvVersion"];
  contentHash: string;
  orchestration: RepairOrchestrationSummary;
  records: RepairSessionResult["records"];
  scopedReviewFamilies: RepairSessionReviewFamily[];
}): RepairSessionResult {
  return {
    status: input.reason === "export-ready" ? "completed" : "stopped",
    stopReason: input.reason,
    iterationsRun: input.records.length,
    finalCvVersion: input.cvVersion,
    finalContentHash: input.contentHash,
    finalOrchestration: input.orchestration,
    records: input.records,
    scopedReviewFamilies: uniqueFamilies(input.scopedReviewFamilies)
  };
}

export function runBoundedRepairSession(input: RepairSessionInput): RepairSessionResult {
  const maxIterations = input.maxIterations ?? DEFAULT_MAX_ITERATIONS;
  const maxAppliedChanges = input.maxAppliedChanges ?? Number.POSITIVE_INFINITY;
  const seenBlockerSets = new Set<string>();
  const records: RepairSessionResult["records"] = [];
  const scopedReviewFamilies: RepairSessionReviewFamily[] = [];

  let cvVersion = input.initialCvVersion;
  let contentHash = input.initialContentHash;
  let orchestration = input.initialOrchestration;
  let totalAppliedChanges = 0;

  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    if (orchestration.totalBlockers === 0) {
      return stop({ reason: "export-ready", cvVersion, contentHash, orchestration, records, scopedReviewFamilies });
    }

    if (totalRepairable(orchestration) === 0) {
      return stop({ reason: "only-human-or-unsupported", cvVersion, contentHash, orchestration, records, scopedReviewFamilies });
    }

    const key = blockerKey(orchestration);
    if (seenBlockerSets.has(key)) {
      return stop({ reason: "repeated-blockers", cvVersion, contentHash, orchestration, records, scopedReviewFamilies });
    }
    seenBlockerSets.add(key);

    if (totalAppliedChanges >= maxAppliedChanges) {
      return stop({ reason: "budget-reached", cvVersion, contentHash, orchestration, records, scopedReviewFamilies });
    }

    const step = input.runRepairStep({ iteration, cvVersion, contentHash, orchestration });
    if (step.status === "unsafe-stop") {
      return stop({ reason: "unsafe-stop", cvVersion, contentHash, orchestration, records, scopedReviewFamilies });
    }
    if (step.status === "budget-reached") {
      return stop({ reason: "budget-reached", cvVersion, contentHash, orchestration, records, scopedReviewFamilies });
    }
    if (step.status === "no-content-diff" || step.nextContentHash === contentHash || !step.nextCvVersion) {
      return stop({ reason: "no-content-diff", cvVersion, contentHash, orchestration, records, scopedReviewFamilies });
    }

    const refreshed = input.refreshAfterRepair({
      iteration,
      cvVersion: step.nextCvVersion,
      contentHash: step.nextContentHash,
      affectedReviewFamilies: step.affectedReviewFamilies
    });
    scopedReviewFamilies.push(...step.affectedReviewFamilies);
    totalAppliedChanges += step.appliedChangeCount;
    records.push({
      iteration,
      priorBlockerCount: orchestration.totalBlockers,
      nextBlockerCount: refreshed.orchestration.totalBlockers,
      appliedChangeCount: step.appliedChangeCount,
      affectedReviewFamilies: uniqueFamilies(step.affectedReviewFamilies),
      message: step.message
    });
    cvVersion = refreshed.cvVersion;
    contentHash = refreshed.contentHash;
    orchestration = refreshed.orchestration;
  }

  if (orchestration.totalBlockers === 0) {
    return stop({ reason: "export-ready", cvVersion, contentHash, orchestration, records, scopedReviewFamilies });
  }

  return stop({ reason: "max-loop-reached", cvVersion, contentHash, orchestration, records, scopedReviewFamilies });
}
