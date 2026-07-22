import type { CvVersion, TailoredCv } from "../types";
import { contentHash } from "../utils/hash";
import type { RepairClassification } from "./repairOrchestrator.types";
import type {
  SafeRepairAppliedChange,
  SafeRepairExecutionResult,
  SafeRepairExecutorInput
} from "./safeRepairExecutor.types";

const SAFE_EXECUTOR_VERSION = "p4-ar-003";

function cloneCv(cv: TailoredCv): TailoredCv {
  return JSON.parse(JSON.stringify(cv)) as TailoredCv;
}

function repairId(classification: RepairClassification) {
  return `safe-repair-${classification.blockerId}`;
}

function executionPlanKey(input: SafeRepairExecutorInput) {
  const blockerIds = input.orchestration.safeAuto.map((item) => item.blockerId).sort();
  return contentHash({
    executor: SAFE_EXECUTOR_VERSION,
    cvVersionId: input.orchestration.cvVersionId,
    cvContentHash: input.orchestration.cvContentHash,
    blockerIds
  });
}

function compactSentences(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function dedupeSentences(text: string) {
  const seen = new Set<string>();
  const sentences = text.split(/(?<=[.!?。！？])\s+/).map(compactSentences).filter(Boolean);
  const kept = sentences.filter((sentence) => {
    const key = sentence.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return kept.join(" ");
}

function bulletFor(cv: TailoredCv, bulletId: string | undefined) {
  if (!bulletId) return null;
  const [experienceIndex, subsectionIndex, bulletIndex] = bulletId.split("-").map((value) => Number(value));
  if (![experienceIndex, subsectionIndex, bulletIndex].every(Number.isFinite)) return null;
  return cv.workExperience[experienceIndex]?.subsections[subsectionIndex]?.bullets[bulletIndex] || null;
}

function getZoneValue(cv: TailoredCv, zone: string) {
  if (zone === "header.contact") return JSON.stringify({ email: cv.header.email, location: cv.header.location, name: cv.header.name });
  if (zone === "header.targetRole") return cv.header.targetRole;
  if (zone === "summary") return cv.summary;
  if (zone === "workExperience") return JSON.stringify(cv.workExperience);
  if (zone === "sidebar.skills") return JSON.stringify(cv.sidebar.skillGroups);
  if (zone === "sidebar.education") return JSON.stringify(cv.sidebar.education);
  if (zone === "sidebar.certifications") return JSON.stringify(cv.sidebar.certifications);
  if (zone === "export") return JSON.stringify({ keywordPlacementNotes: cv.keywordPlacementNotes, interviewNotes: cv.interviewNotes });
  return "";
}

function valuesForZones(cv: TailoredCv, zones: string[]) {
  return Object.fromEntries(zones.map((zone) => [zone, getZoneValue(cv, zone)]));
}

function unchangedZones(before: TailoredCv, after: TailoredCv, zones: string[]) {
  return zones.filter((zone) => getZoneValue(before, zone) === getZoneValue(after, zone));
}

function applyDuplicateSummary(cv: TailoredCv, classification: RepairClassification): SafeRepairAppliedChange | null {
  const priorValue = cv.summary || "";
  const nextValue = dedupeSentences(priorValue);
  if (!nextValue || nextValue === priorValue) return null;
  cv.summary = nextValue;
  return {
    repairId: repairId(classification),
    blockerId: classification.blockerId,
    targetZone: "summary",
    priorValue,
    nextValue,
    evidenceIds: classification.evidenceIds
  };
}

function applyMissingEmail(cv: TailoredCv, classification: RepairClassification, trustedProfileEmail: string | undefined): SafeRepairAppliedChange | null {
  if (!trustedProfileEmail || !/\S+@\S+\.\S+/.test(trustedProfileEmail)) return null;
  const priorValue = cv.header.email || "";
  if (priorValue === trustedProfileEmail) return null;
  cv.header.email = trustedProfileEmail;
  return {
    repairId: repairId(classification),
    blockerId: classification.blockerId,
    targetZone: "header.contact",
    priorValue,
    nextValue: trustedProfileEmail,
    evidenceIds: classification.evidenceIds
  };
}

function applyDuplicateBullet(cv: TailoredCv, classification: RepairClassification): SafeRepairAppliedChange | null {
  const bullet = bulletFor(cv, classification.target?.bulletId);
  if (!bullet) return null;
  const priorValue = bullet.text;
  const nextValue = dedupeSentences(priorValue);
  if (!nextValue || nextValue === priorValue) return null;
  bullet.text = nextValue;
  return {
    repairId: repairId(classification),
    blockerId: classification.blockerId,
    targetZone: "workExperience",
    priorValue,
    nextValue,
    evidenceIds: [...(bullet.evidenceIds || classification.evidenceIds)]
  };
}

function applySafeClassification(cv: TailoredCv, classification: RepairClassification, trustedProfileEmail?: string) {
  const reason = classification.reason.toLowerCase();
  const target = classification.target;

  if (target?.section === "summary" && /duplicate|repeated/.test(reason)) {
    return applyDuplicateSummary(cv, classification);
  }

  if (target?.section === "contact" && target.fieldId === "email") {
    return applyMissingEmail(cv, classification, trustedProfileEmail);
  }

  if (target?.section === "workExperience" && /duplicate|repeated/.test(reason)) {
    return applyDuplicateBullet(cv, classification);
  }

  return null;
}

function blockedResult(input: SafeRepairExecutorInput, status: SafeRepairExecutionResult["status"], message: string, planKey: string): SafeRepairExecutionResult {
  return {
    status,
    message,
    planKey,
    cvVersionId: input.cvVersion.id,
    priorContentHash: input.currentContentHash,
    resultingContentHash: input.currentContentHash,
    appliedChanges: [],
    changedZones: [],
    preservedZones: [],
    rejectedClassifications: input.orchestration.safeAuto
  };
}

export function executeSafeRepairs(input: SafeRepairExecutorInput): SafeRepairExecutionResult {
  const planKey = executionPlanKey(input);
  const tailoredCv = input.cvVersion.tailoredCv;
  if (!tailoredCv) return blockedResult(input, "blocked", "No tailored CV is available for safe repair execution.", planKey);

  if (
    input.orchestration.cvVersionId !== input.currentCvVersionId
    || input.orchestration.cvContentHash !== input.currentContentHash
    || input.cvVersion.id !== input.currentCvVersionId
  ) {
    return blockedResult(input, "stale", "Safe repair was rejected because the orchestrator output is stale.", planKey);
  }

  if (input.executedPlanKeys?.has(planKey)) {
    return blockedResult(input, "duplicate", "Safe repair was rejected because this repair plan already executed for this CV hash.", planKey);
  }

  const safeAuto = input.orchestration.safeAuto;
  if (!safeAuto.length) return blockedResult(input, "no-content-diff", "No safe-auto classifications are available.", planKey);

  const beforeCv = cloneCv(tailoredCv);
  const nextCv = cloneCv(tailoredCv);
  const appliedChanges: SafeRepairAppliedChange[] = [];
  const rejectedClassifications: RepairClassification[] = [];

  for (const classification of safeAuto) {
    if (classification.route !== "safe-auto" || classification.requiresUserApproval) {
      rejectedClassifications.push(classification);
      continue;
    }
    const beforeProhibited = valuesForZones(nextCv, classification.prohibitedMutationZones);
    const change = applySafeClassification(nextCv, classification, input.trustedProfileEmail);
    const prohibitedChanged = classification.prohibitedMutationZones.some((zone) => beforeProhibited[zone] !== getZoneValue(nextCv, zone));
    if (prohibitedChanged) {
      return blockedResult(input, "blocked", `Safe repair attempted to mutate a prohibited zone for ${classification.blockerId}.`, planKey);
    }
    if (change) appliedChanges.push(change);
    else rejectedClassifications.push(classification);
  }

  const priorContentHash = contentHash(beforeCv);
  const resultingContentHash = contentHash(nextCv);
  if (priorContentHash === resultingContentHash || !appliedChanges.length) {
    return {
      status: "no-content-diff",
      message: "Safe repair produced no CV content change.",
      planKey,
      cvVersionId: input.cvVersion.id,
      priorContentHash,
      resultingContentHash,
      appliedChanges: [],
      changedZones: [],
      preservedZones: Array.from(new Set(safeAuto.flatMap((item) => item.prohibitedMutationZones))),
      rejectedClassifications: safeAuto
    };
  }

  const now = input.now || new Date().toISOString();
  const changedZones = Array.from(new Set(appliedChanges.map((item) => item.targetZone)));
  const preservedZones = unchangedZones(beforeCv, nextCv, Array.from(new Set(safeAuto.flatMap((item) => item.prohibitedMutationZones))));
  const nextVersion: CvVersion = {
    ...input.cvVersion,
    id: `${input.cvVersion.id}-safe-${planKey.slice(1, 8)}`,
    name: `${input.cvVersion.name} - safe repair`,
    tailoredCv: nextCv,
    content: JSON.stringify(nextCv, null, 2),
    summary: nextCv.summary || input.cvVersion.summary,
    status: "Editing",
    reviewSnapshot: undefined,
    updatedAt: now
  };

  return {
    status: "success",
    message: `Applied ${appliedChanges.length} safe repair${appliedChanges.length === 1 ? "" : "s"}.`,
    planKey,
    cvVersionId: nextVersion.id,
    priorContentHash,
    resultingContentHash,
    appliedChanges,
    changedZones,
    preservedZones,
    rejectedClassifications,
    nextVersion
  };
}

export function safeRepairExecutionPlanKey(input: SafeRepairExecutorInput) {
  return executionPlanKey(input);
}
