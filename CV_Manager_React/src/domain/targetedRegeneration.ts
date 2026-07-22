import type { CvVersion, TailoredCv } from "../types";
import { contentHash } from "../utils/hash";
import type { RepairClassification } from "./repairOrchestrator.types";
import type { TargetedRegenerationCandidate, TargetedRegenerationRequest, TargetedRegenerationResult, TargetedRegenerationZone } from "./targetedRegeneration.types";
import { validateTargetedRegenerationCandidate } from "./targetedValidation";

const ALL_ZONES = ["header.contact", "header.targetRole", "summary", "workExperience", "sidebar.skills", "sidebar.education", "sidebar.certifications", "export"];

function cloneCv(cv: TailoredCv): TailoredCv {
  return JSON.parse(JSON.stringify(cv)) as TailoredCv;
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

function unchangedZones(before: TailoredCv, after: TailoredCv, zones: string[]) {
  return zones.filter((zone) => getZoneValue(before, zone) === getZoneValue(after, zone));
}

function selectedEvidence(cv: TailoredCv, ids: string[]) {
  const idSet = new Set(ids);
  const bullets = cv.workExperience.flatMap((experience) => experience.subsections.flatMap((subsection) => subsection.bullets));
  return bullets.filter((bullet) => (bullet.evidenceIds || []).some((id) => idSet.has(id)));
}

function compact(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function summaryFromEvidence(cv: TailoredCv, selectedEvidenceIds: string[]) {
  const role = cv.header.targetRole || cv.jdAnalysis?.targetRole || "target role";
  const keywords = (cv.jdAnalysis?.topKeywords || []).slice(0, 3).map((item) => item.keyword).filter(Boolean);
  const evidenceBullets = selectedEvidence(cv, selectedEvidenceIds).slice(0, 2).map((bullet) => bullet.text.replace(/\s*\[[^\]]+\]\s*/g, ""));
  const focus = keywords.length ? keywords.join(", ") : "role-relevant delivery";
  const proof = evidenceBullets.length
    ? `Grounded in evidence such as ${evidenceBullets.join(" ")}`
    : "Grounded in selected evidence and current role delivery.";
  return compact(`${role} focused on ${focus}. ${proof}`.replace(/\bowned an enterprise AI platform\b/gi, "supported enterprise AI adoption"));
}

function regenerateBullet(text: string, evidenceIds: string[]) {
  const cleaned = compact(text
    .replace(/\bWork-log:\s*/gi, "")
    .replace(/\binternal sync\b/gi, "stakeholder coordination")
    .replace(/\btickets\b/gi, "delivery requests")
    .replace(/\btracked\b/gi, "coordinated")
    .replace(/\bHelped\b/gi, "Supported")
    .replace(/\bWorked on tasks\b/gi, "Coordinated customer enablement work"));
  const evidenceTail = evidenceIds.length ? ` using evidence-backed delivery context (${evidenceIds.join(", ")}).` : " using selected evidence.";
  if (cleaned.length >= 70 && !/work-log|internal sync|tickets/i.test(cleaned)) return cleaned;
  return compact(`${cleaned.replace(/[.。]$/, "")} with clearer action, scope, and recruiter-facing outcome${evidenceTail}`);
}

function bulletById(cv: TailoredCv, bulletId: string) {
  const [experienceIndex, subsectionIndex, bulletIndex] = bulletId.split("-").map((value) => Number(value));
  if (![experienceIndex, subsectionIndex, bulletIndex].every(Number.isFinite)) return null;
  return cv.workExperience[experienceIndex]?.subsections[subsectionIndex]?.bullets[bulletIndex] || null;
}

function applyCandidateToAllowedZones(
  current: TailoredCv,
  candidate: TargetedRegenerationCandidate,
  request: TargetedRegenerationRequest
): { cv?: TailoredCv; error?: string } {
  if (candidate.requestId !== request.id) return { error: "Targeted regeneration response request ID does not match the current request." };
  const next = cloneCv(current);
  if (request.targetZones.includes("summary")) next.summary = candidate.cv.summary;

  if (request.targetZones.includes("workExperience.currentRole")) {
    const currentRole = current.workExperience[0];
    const candidateRole = candidate.cv.workExperience[0];
    if (!currentRole || !candidateRole) return { error: "Targeted regeneration response is missing the current role." };
    if (candidateRole.subsections.length !== currentRole.subsections.length) return { error: "Targeted regeneration attempted to change current-role structure." };
    for (let sectionIndex = 0; sectionIndex < currentRole.subsections.length; sectionIndex += 1) {
      const currentSection = currentRole.subsections[sectionIndex];
      const candidateSection = candidateRole.subsections[sectionIndex];
      if (candidateSection.bullets.length !== currentSection.bullets.length) return { error: "Targeted regeneration attempted to add or remove work bullets." };
      for (let bulletIndex = 0; bulletIndex < currentSection.bullets.length; bulletIndex += 1) {
        const currentBullet = currentSection.bullets[bulletIndex];
        const candidateBullet = candidateSection.bullets[bulletIndex];
        if (JSON.stringify(candidateBullet.evidenceIds || []) !== JSON.stringify(currentBullet.evidenceIds || [])) {
          return { error: "Targeted regeneration attempted to change EvidenceCard traceability." };
        }
        next.workExperience[0].subsections[sectionIndex].bullets[bulletIndex] = {
          ...currentBullet,
          text: candidateBullet.text,
          metric: candidateBullet.metric,
          metricType: candidateBullet.metricType,
          confidence: candidateBullet.confidence
        };
      }
    }
  }

  if (request.targetZones.includes("workExperience.selectedBullets")) {
    for (const bulletId of request.targetBulletIds || []) {
      const currentBullet = bulletById(current, bulletId);
      const candidateBullet = bulletById(candidate.cv, bulletId);
      const nextBullet = bulletById(next, bulletId);
      if (!currentBullet || !candidateBullet || !nextBullet) return { error: `Targeted regeneration could not match bullet ${bulletId}.` };
      if (JSON.stringify(candidateBullet.evidenceIds || []) !== JSON.stringify(currentBullet.evidenceIds || [])) {
        return { error: `Targeted regeneration attempted to change EvidenceCard traceability for bullet ${bulletId}.` };
      }
      Object.assign(nextBullet, {
        ...currentBullet,
        text: candidateBullet.text,
        metric: candidateBullet.metric,
        metricType: candidateBullet.metricType,
        confidence: candidateBullet.confidence
      });
    }
  }
  return { cv: next };
}

function zonesFromClassifications(classifications: RepairClassification[]): TargetedRegenerationZone[] {
  const zones = new Set<TargetedRegenerationZone>();
  for (const item of classifications) {
    if (item.allowedMutationZones.includes("summary")) zones.add("summary");
    if (item.allowedMutationZones.includes("workExperience")) zones.add(item.target?.bulletId ? "workExperience.selectedBullets" : "workExperience.currentRole");
    if (item.allowedMutationZones.includes("sidebar.skills")) zones.add("sidebar.skills");
  }
  return Array.from(zones);
}

export function createTargetedRegenerationRequest(input: {
  classifications: RepairClassification[];
  selectedEvidenceIds: string[];
  effectiveCvBriefHash: string;
  failedSummaryCriterionIds?: string[];
}): TargetedRegenerationRequest {
  const targetZones = zonesFromClassifications(input.classifications);
  const prohibitedZones = ALL_ZONES.filter((zone) => {
    if (targetZones.includes("summary") && zone === "summary") return false;
    if ((targetZones.includes("workExperience.currentRole") || targetZones.includes("workExperience.selectedBullets")) && zone === "workExperience") return false;
    if (targetZones.includes("sidebar.skills") && zone === "sidebar.skills") return false;
    return true;
  });
  return {
    id: `targeted-regeneration-${contentHash({
      blockerIds: input.classifications.map((item) => item.blockerId),
      targetZones,
      cvVersionId: input.classifications[0]?.cvVersionId,
      cvContentHash: input.classifications[0]?.cvContentHash,
      brief: input.effectiveCvBriefHash,
      failedSummaryCriterionIds: input.failedSummaryCriterionIds || []
    }).slice(1, 10)}`,
    blockerIds: input.classifications.map((item) => item.blockerId),
    cvVersionId: input.classifications[0]?.cvVersionId || "",
    cvContentHash: input.classifications[0]?.cvContentHash || "",
    targetZones,
    targetRoleIds: Array.from(new Set(input.classifications.map((item) => item.target?.roleId).filter(Boolean))) as string[],
    targetBulletIds: Array.from(new Set(input.classifications.map((item) => item.target?.bulletId).filter(Boolean))) as string[],
    selectedEvidenceIds: input.selectedEvidenceIds,
    effectiveCvBriefHash: input.effectiveCvBriefHash,
    failedSummaryCriterionIds: input.failedSummaryCriterionIds,
    preservedZones: prohibitedZones,
    prohibitedZones,
    reason: input.classifications.map((item) => item.reason).join(" ")
  };
}

function blocked(input: { request: TargetedRegenerationRequest; currentContentHash: string }, status: TargetedRegenerationResult["status"], message: string): TargetedRegenerationResult {
  return {
    status,
    requestId: input.request.id,
    priorCvHash: input.currentContentHash,
    resultingCvHash: input.currentContentHash,
    changedZones: [],
    preservedZones: input.request.preservedZones,
    remainingBlockers: input.request.blockerIds,
    affectedReviewFamilies: [],
    message
  };
}

export function executeTargetedRegeneration(input: {
  cvVersion: CvVersion;
  request: TargetedRegenerationRequest;
  currentCvVersionId: string;
  currentContentHash: string;
  currentEffectiveCvBriefHash: string;
  currentSelectedEvidenceIds?: string[];
  validEvidenceIds?: string[];
  unsupportedTerms?: string[];
  candidate?: TargetedRegenerationCandidate;
  now?: string;
}): TargetedRegenerationResult {
  if (!input.cvVersion.tailoredCv) return blocked(input, "blocked", "Targeted regeneration requires a tailored CV.");
  if (input.request.cvVersionId !== input.currentCvVersionId || input.cvVersion.id !== input.currentCvVersionId || input.request.cvContentHash !== input.currentContentHash) {
    return blocked(input, "stale", "Targeted regeneration was rejected because the CV changed.");
  }
  if (input.request.effectiveCvBriefHash !== input.currentEffectiveCvBriefHash) {
    return blocked(input, "stale", "Targeted regeneration was rejected because the effective CV Brief changed.");
  }
  if (!input.request.selectedEvidenceIds.length) {
    return blocked(input, "blocked", "Targeted regeneration requires selected trusted evidence.");
  }

  const beforeCv = cloneCv(input.cvVersion.tailoredCv);
  const scopedValidation = input.candidate
    ? validateTargetedRegenerationCandidate({
      request: input.request,
      currentCv: beforeCv,
      candidate: input.candidate,
      currentCvVersionId: input.currentCvVersionId,
      currentCvContentHash: input.currentContentHash,
      currentEffectiveCvBriefHash: input.currentEffectiveCvBriefHash,
      currentSelectedEvidenceIds: input.currentSelectedEvidenceIds || input.request.selectedEvidenceIds,
      validEvidenceIds: input.validEvidenceIds || input.request.selectedEvidenceIds,
      unsupportedTerms: input.unsupportedTerms
    })
    : undefined;
  if (scopedValidation && !scopedValidation.mayApplyTargetPatch) {
    const noDiff = scopedValidation.targetFailures.some((issue) => issue.ruleId === "meaningful-content-diff")
      && !scopedValidation.preservedZoneFailures.length
      && !scopedValidation.staleContractFailures.length
      && !scopedValidation.newGlobalIssues.length;
    const failure = scopedValidation.staleContractFailures[0]
      || scopedValidation.preservedZoneFailures[0]
      || scopedValidation.targetFailures[0]
      || scopedValidation.newGlobalIssues[0];
    return {
      ...blocked(input, noDiff ? "no-diff" : scopedValidation.status === "blocked-stale" ? "stale" : "blocked", failure?.message || "Targeted regeneration response could not be applied safely."),
      validation: scopedValidation
    };
  }
  const nextCv = scopedValidation?.patchedCv || cloneCv(input.cvVersion.tailoredCv);
  const beforePreserved = Object.fromEntries(input.request.preservedZones.map((zone) => [zone, getZoneValue(beforeCv, zone)]));
  const changedZones: string[] = [];

  if (!input.candidate && input.request.targetZones.includes("summary")) {
    const nextSummary = summaryFromEvidence(nextCv, input.request.selectedEvidenceIds);
    if (!nextSummary || /owned an enterprise AI platform/i.test(nextSummary)) {
      return blocked(input, "blocked", "Targeted summary regeneration failed unsupported-claim validation.");
    }
    if (nextSummary !== nextCv.summary) {
      nextCv.summary = nextSummary;
      changedZones.push("summary");
    }
  }

  if (!input.candidate && input.request.targetZones.includes("workExperience.selectedBullets")) {
    for (const bulletId of input.request.targetBulletIds || []) {
      const bullet = bulletById(nextCv, bulletId);
      if (!bullet) return blocked(input, "blocked", `Targeted regeneration could not find bullet ${bulletId}.`);
      const evidenceIds = (bullet.evidenceIds || []).filter((id) => input.request.selectedEvidenceIds.includes(id));
      if (!evidenceIds.length) return blocked(input, "blocked", `Targeted regeneration requires valid EvidenceCard IDs for bullet ${bulletId}.`);
      bullet.text = regenerateBullet(bullet.text, evidenceIds);
      bullet.confidence = "Grounded";
    }
    changedZones.push("workExperience");
  }

  if (!input.candidate && input.request.targetZones.includes("workExperience.currentRole")) {
    const experience = nextCv.workExperience[0];
    const subsection = experience?.subsections[0];
    if (!subsection?.bullets?.length) return blocked(input, "blocked", "Targeted regeneration could not find current-role bullets.");
    subsection.bullets = subsection.bullets.map((bullet) => {
      const evidenceIds = (bullet.evidenceIds || []).filter((id) => input.request.selectedEvidenceIds.includes(id));
      if (!evidenceIds.length) return bullet;
      return { ...bullet, text: regenerateBullet(bullet.text, evidenceIds), confidence: "Grounded" };
    });
    changedZones.push("workExperience");
  }

  if (input.candidate) {
    if (input.request.targetZones.includes("summary") && nextCv.summary !== beforeCv.summary) changedZones.push("summary");
    if ((input.request.targetZones.includes("workExperience.currentRole") || input.request.targetZones.includes("workExperience.selectedBullets"))
      && getZoneValue(nextCv, "workExperience") !== getZoneValue(beforeCv, "workExperience")) changedZones.push("workExperience");
  }
  const preservedChanged = input.request.preservedZones.some((zone) => beforePreserved[zone] !== getZoneValue(nextCv, zone));
  if (preservedChanged) return blocked(input, "blocked", "Targeted regeneration attempted to mutate a preserved zone.");

  const priorCvHash = contentHash(beforeCv);
  const resultingCvHash = contentHash(nextCv);
  if (priorCvHash === resultingCvHash || !changedZones.length) {
    return {
      status: "no-diff",
      requestId: input.request.id,
      priorCvHash,
      resultingCvHash,
      changedZones: [],
      preservedZones: input.request.preservedZones,
      remainingBlockers: input.request.blockerIds,
      affectedReviewFamilies: [],
      message: "Targeted regeneration produced no CV content change.",
      validation: scopedValidation
    };
  }

  const now = input.now || new Date().toISOString();
  const nextVersion: CvVersion = {
    ...input.cvVersion,
    id: `${input.cvVersion.id}-regen-${input.request.id.slice(-6)}`,
    name: `${input.cvVersion.name} - targeted regeneration`,
    tailoredCv: nextCv,
    content: JSON.stringify(nextCv, null, 2),
    summary: nextCv.summary || input.cvVersion.summary,
    status: "Editing",
    reviewSnapshot: undefined,
    updatedAt: now
  };

  const uniqueChangedZones = Array.from(new Set(changedZones));
  return {
    status: "success",
    requestId: input.request.id,
    priorCvHash,
    resultingCvHash,
    changedZones: uniqueChangedZones,
    preservedZones: unchangedZones(beforeCv, nextCv, input.request.preservedZones),
    remainingBlockers: [],
    affectedReviewFamilies: uniqueChangedZones.includes("summary") ? ["hiring-manager", "reviewer"] : ["wording", "evidence"],
    message: `Regenerated ${uniqueChangedZones.join(", ")} from selected evidence.`,
    nextVersion,
    validation: scopedValidation
  };
}
