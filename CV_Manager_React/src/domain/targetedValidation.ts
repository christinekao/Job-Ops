import type { TailoredCv } from "../types";
import { contentHash } from "../utils/hash";
import { validateScreeningCvOutput } from "./screeningCvOutput";
import type {
  TargetedRegenerationCandidate,
  TargetedRegenerationRequest,
  TargetedValidationIssue,
  TargetedValidationResult
} from "./targetedRegeneration.types";

const ALL_ZONES = ["header.contact", "header.targetRole", "summary", "workExperience", "sidebar.skills", "sidebar.education", "sidebar.certifications", "export"];

function cloneCv(cv: TailoredCv): TailoredCv {
  return JSON.parse(JSON.stringify(cv)) as TailoredCv;
}

function compact(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  return JSON.stringify(value);
}

function canonicalWorkExperience(cv: TailoredCv) {
  return cv.workExperience.map((experience) => ({
    experienceId: experience.experienceId || undefined,
    company: experience.company.trim(),
    role: experience.role.trim(),
    period: experience.period.trim(),
    location: experience.location.trim(),
    subsections: experience.subsections.map((section) => ({
      title: section.title.trim(),
      bullets: section.bullets.map((bullet) => ({
        text: bullet.text.replace(/^[\s•\-–—]+/, "").replace(/\s+/g, " ").trim(),
        metric: bullet.metric?.trim() || undefined,
        metricType: bullet.metricType || "None",
        evidenceIds: bullet.evidenceIds || [],
        confidence: bullet.confidence || undefined
      }))
    }))
  }));
}

function zoneValue(cv: TailoredCv, zone: string): unknown {
  if (zone === "header.contact") return { name: cv.header.name, email: cv.header.email, location: cv.header.location };
  if (zone === "header.targetRole") return cv.header.targetRole;
  if (zone === "summary") return cv.summary;
  if (zone === "workExperience") return canonicalWorkExperience(cv);
  if (zone === "sidebar.skills") return cv.sidebar.skillGroups;
  if (zone === "sidebar.education") return cv.sidebar.education;
  if (zone === "sidebar.certifications") return cv.sidebar.certifications;
  if (zone === "export") return { keywordPlacementNotes: cv.keywordPlacementNotes, interviewNotes: cv.interviewNotes };
  return undefined;
}

function valuesEqual(left: unknown, right: unknown): boolean {
  return contentHash(left) === contentHash(right);
}

function valueAtPath(value: unknown, path: string): unknown {
  const tokens = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
  let current = value;
  for (const token of tokens) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[token];
  }
  return current;
}

function pathFromError(error: string): string | undefined {
  return error.match(/^([A-Za-z][A-Za-z0-9]*(?:\[\d+\]|\.[A-Za-z][A-Za-z0-9]*)*(?:\[\d+\])?)/)?.[1];
}

function ruleFromError(error: string): string {
  if (/EvidenceCard ID/.test(error)) return /unknown|must reference/.test(error) ? "evidencecard-namespace" : "evidence-traceability";
  if (/duplicates/.test(error)) return "duplicate-content";
  return "required-fields";
}

function baseZoneFromPath(path = ""): string {
  if (path.startsWith("header.email") || path.startsWith("header.name") || path.startsWith("header.location") || path.startsWith("header.phone") || path.startsWith("header.linkedIn") || path.startsWith("header.portfolio")) return "header.contact";
  if (path.startsWith("header.targetRole")) return "header.targetRole";
  if (path.startsWith("summary")) return "summary";
  if (path.startsWith("workExperience")) return "workExperience";
  if (path.startsWith("sidebar.skillGroups")) return "sidebar.skills";
  if (path.startsWith("sidebar.education")) return "sidebar.education";
  if (path.startsWith("sidebar.certifications")) return "sidebar.certifications";
  return "export";
}

function bulletIdFromPath(path = ""): string | undefined {
  const match = path.match(/workExperience\[(\d+)\]\.subsections\[(\d+)\]\.bullets\[(\d+)\]/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : undefined;
}

function stableIssueId(validatorId: string, ruleId: string, fieldPath = "", targetZone = ""): string {
  return `${validatorId}:${ruleId}:${fieldPath}:${targetZone}`;
}

function issueFromOutputError(error: string, cv: TailoredCv, category: TargetedValidationIssue["category"]): TargetedValidationIssue {
  const validatorId = "screening-cv-output";
  const ruleId = ruleFromError(error);
  const fieldPath = pathFromError(error);
  const targetZone = baseZoneFromPath(fieldPath);
  const unknownEvidence = error.match(/unknown EvidenceCard ID "([^"]+)"/)?.[1];
  return {
    id: stableIssueId(validatorId, ruleId, fieldPath, targetZone),
    validatorId,
    ruleId,
    category,
    message: error,
    fieldPath,
    targetZone,
    bulletId: bulletIdFromPath(fieldPath),
    evidenceIds: unknownEvidence ? [unknownEvidence] : undefined,
    missingEvidenceIds: /must contain at least one EvidenceCard ID/.test(error) ? ["at least one valid EvidenceCard ID"] : unknownEvidence ? [unknownEvidence] : undefined,
    candidateValue: fieldPath ? compact(valueAtPath(cv, fieldPath)) : undefined
  };
}

function targetBaseZones(request: TargetedRegenerationRequest): Set<string> {
  return new Set(request.targetZones.map((zone) => zone.startsWith("workExperience.") ? "workExperience" : zone));
}

function isTargetPath(request: TargetedRegenerationRequest, path = ""): boolean {
  if (request.targetZones.includes("summary") && path.startsWith("summary")) return true;
  if (request.targetZones.includes("sidebar.skills") && path.startsWith("sidebar.skillGroups")) return true;
  const bulletId = bulletIdFromPath(path);
  if (request.targetZones.includes("workExperience.selectedBullets")) return Boolean(bulletId && request.targetBulletIds?.includes(bulletId));
  if (request.targetZones.includes("workExperience.currentRole")) return /^workExperience\[0\]/.test(path);
  return false;
}

function allowedBulletFieldsEqual(current: TailoredCv["workExperience"][number]["subsections"][number]["bullets"][number], candidate: typeof current): boolean {
  return valuesEqual(current.evidenceIds || [], candidate.evidenceIds || []);
}

function getBullet(cv: TailoredCv, id: string) {
  const [roleIndex, sectionIndex, bulletIndex] = id.split("-").map(Number);
  return cv.workExperience[roleIndex]?.subsections[sectionIndex]?.bullets[bulletIndex];
}

function applyAuthorizedPatch(current: TailoredCv, candidate: TargetedRegenerationCandidate, request: TargetedRegenerationRequest): { patchedCv?: TailoredCv; issue?: TargetedValidationIssue } {
  if (candidate.requestId !== request.id) {
    return { issue: { id: stableIssueId("targeted-regeneration-contract", "request-id"), validatorId: "targeted-regeneration-contract", ruleId: "request-id", category: "stale-contract", message: "Targeted regeneration response request ID does not match the active request." } };
  }
  const next = cloneCv(current);
  if (request.targetZones.includes("summary")) next.summary = candidate.cv.summary;
  if (request.targetZones.includes("sidebar.skills")) next.sidebar.skillGroups = cloneCv(candidate.cv).sidebar.skillGroups;

  if (request.targetZones.includes("workExperience.currentRole")) {
    const currentRole = current.workExperience[0];
    const candidateRole = candidate.cv.workExperience[0];
    if (!currentRole || !candidateRole || currentRole.subsections.length !== candidateRole.subsections.length) {
      return { issue: { id: stableIssueId("targeted-regeneration-boundary", "target-structure", "workExperience[0]", "workExperience"), validatorId: "targeted-regeneration-boundary", ruleId: "target-structure", category: "target", message: "The regenerated current role does not preserve its required structure.", fieldPath: "workExperience[0]", targetZone: "workExperience" } };
    }
    for (let sectionIndex = 0; sectionIndex < currentRole.subsections.length; sectionIndex += 1) {
      const currentSection = currentRole.subsections[sectionIndex];
      const candidateSection = candidateRole.subsections[sectionIndex];
      if (!candidateSection || currentSection.bullets.length !== candidateSection.bullets.length) {
        return { issue: { id: stableIssueId("targeted-regeneration-boundary", "target-structure", `workExperience[0].subsections[${sectionIndex}]`, "workExperience"), validatorId: "targeted-regeneration-boundary", ruleId: "target-structure", category: "target", message: "Targeted regeneration attempted to add or remove current-role bullets.", fieldPath: `workExperience[0].subsections[${sectionIndex}]`, targetZone: "workExperience" } };
      }
      for (let bulletIndex = 0; bulletIndex < currentSection.bullets.length; bulletIndex += 1) {
        const currentBullet = currentSection.bullets[bulletIndex];
        const candidateBullet = candidateSection.bullets[bulletIndex];
        if (!allowedBulletFieldsEqual(currentBullet, candidateBullet)) {
          const path = `workExperience[0].subsections[${sectionIndex}].bullets[${bulletIndex}].evidenceIds`;
          return { issue: { id: stableIssueId("targeted-regeneration-boundary", "evidence-reference-mutation", path, "workExperience"), validatorId: "targeted-regeneration-boundary", ruleId: "evidence-reference-mutation", category: "target", message: `Targeted regeneration attempted to change EvidenceCard traceability at ${path}.`, fieldPath: path, targetZone: "workExperience", bulletId: `0-${sectionIndex}-${bulletIndex}` } };
        }
        next.workExperience[0].subsections[sectionIndex].bullets[bulletIndex] = { ...currentBullet, text: candidateBullet.text, metric: candidateBullet.metric, metricType: candidateBullet.metricType, confidence: candidateBullet.confidence };
      }
    }
  }

  if (request.targetZones.includes("workExperience.selectedBullets")) {
    for (const bulletId of request.targetBulletIds || []) {
      const currentBullet = getBullet(current, bulletId);
      const candidateBullet = getBullet(candidate.cv, bulletId);
      const nextBullet = getBullet(next, bulletId);
      if (!currentBullet || !candidateBullet || !nextBullet) {
        return { issue: { id: stableIssueId("targeted-regeneration-boundary", "target-structure", `workExperience.${bulletId}`, "workExperience"), validatorId: "targeted-regeneration-boundary", ruleId: "target-structure", category: "target", message: `Targeted regeneration could not match bullet ${bulletId}.`, bulletId, targetZone: "workExperience" } };
      }
      if (!allowedBulletFieldsEqual(currentBullet, candidateBullet)) {
        return { issue: { id: stableIssueId("targeted-regeneration-boundary", "evidence-reference-mutation", `workExperience.${bulletId}.evidenceIds`, "workExperience"), validatorId: "targeted-regeneration-boundary", ruleId: "evidence-reference-mutation", category: "target", message: `Targeted regeneration attempted to change EvidenceCard traceability for bullet ${bulletId}.`, bulletId, targetZone: "workExperience" } };
      }
      Object.assign(nextBullet, { ...currentBullet, text: candidateBullet.text, metric: candidateBullet.metric, metricType: candidateBullet.metricType, confidence: candidateBullet.confidence });
    }
  }
  return { patchedCv: next };
}

function preservedZoneFailures(current: TailoredCv, rawCandidate: TailoredCv, request: TargetedRegenerationRequest): TargetedValidationIssue[] {
  const targets = targetBaseZones(request);
  const failures: TargetedValidationIssue[] = [];
  for (const zone of ALL_ZONES) {
    if (targets.has(zone)) continue;
    if (!valuesEqual(zoneValue(current, zone), zoneValue(rawCandidate, zone))) {
      failures.push({ id: stableIssueId("targeted-regeneration-boundary", "preserved-zone-integrity", "", zone), validatorId: "targeted-regeneration-boundary", ruleId: "preserved-zone-integrity", category: "preserved-zone", message: `The AI response changed prohibited zone ${zone}.`, targetZone: zone, currentValue: compact(zoneValue(current, zone)), candidateValue: compact(zoneValue(rawCandidate, zone)) });
    }
  }
  if (targets.has("workExperience")) {
    const masked = cloneCv(rawCandidate);
    if (request.targetZones.includes("workExperience.selectedBullets")) {
      for (const bulletId of request.targetBulletIds || []) {
        const currentBullet = getBullet(current, bulletId);
        const maskedBullet = getBullet(masked, bulletId);
        if (currentBullet && maskedBullet) Object.assign(maskedBullet, currentBullet);
      }
    } else if (request.targetZones.includes("workExperience.currentRole") && masked.workExperience[0] && current.workExperience[0]) {
      masked.workExperience[0] = cloneCv({ ...current, workExperience: [masked.workExperience[0]] }).workExperience[0];
      for (let sectionIndex = 0; sectionIndex < current.workExperience[0].subsections.length; sectionIndex += 1) {
        for (let bulletIndex = 0; bulletIndex < current.workExperience[0].subsections[sectionIndex].bullets.length; bulletIndex += 1) {
          const currentBullet = current.workExperience[0].subsections[sectionIndex].bullets[bulletIndex];
          const rawBullet = rawCandidate.workExperience[0]?.subsections[sectionIndex]?.bullets[bulletIndex];
          const maskedBullet = masked.workExperience[0]?.subsections[sectionIndex]?.bullets[bulletIndex];
          if (rawBullet && maskedBullet) Object.assign(maskedBullet, currentBullet, { text: rawBullet.text, metric: rawBullet.metric, metricType: rawBullet.metricType, confidence: rawBullet.confidence });
        }
      }
    }
    if (!valuesEqual(canonicalWorkExperience(current), canonicalWorkExperience(masked))) {
      failures.push({ id: stableIssueId("targeted-regeneration-boundary", "preserved-zone-integrity", "workExperience.preserved", "workExperience"), validatorId: "targeted-regeneration-boundary", ruleId: "preserved-zone-integrity", category: "preserved-zone", message: "The AI response changed work-experience content outside the authorized target.", fieldPath: "workExperience.preserved", targetZone: "workExperience" });
    }
  }
  return failures;
}

function unsupportedTargetFailures(current: TailoredCv, patched: TailoredCv, request: TargetedRegenerationRequest, unsupportedTerms: string[]): TargetedValidationIssue[] {
  const failures: TargetedValidationIssue[] = [];
  const targetValues: Array<{ path: string; current: string; candidate: string }> = [];
  if (request.targetZones.includes("summary")) targetValues.push({ path: "summary", current: current.summary, candidate: patched.summary });
  for (const bulletId of request.targetBulletIds || []) {
    targetValues.push({ path: `workExperience.${bulletId}.text`, current: getBullet(current, bulletId)?.text || "", candidate: getBullet(patched, bulletId)?.text || "" });
  }
  for (const item of targetValues) {
    for (const term of unsupportedTerms) {
      if (!item.current.toLowerCase().includes(term.toLowerCase()) && item.candidate.toLowerCase().includes(term.toLowerCase())) {
        failures.push({ id: stableIssueId("screening-reviewer", "unsupported-visible-claims", item.path, baseZoneFromPath(item.path)), validatorId: "screening-reviewer", ruleId: "unsupported-visible-claims", category: "target", message: `${item.path} introduced unsupported wording: ${term}.`, fieldPath: item.path, targetZone: baseZoneFromPath(item.path), currentValue: item.current, candidateValue: item.candidate, missingEvidenceIds: ["supporting EvidenceCard"] });
      }
    }
  }
  return failures;
}

export function validateTargetedRegenerationCandidate(input: {
  request: TargetedRegenerationRequest;
  currentCv: TailoredCv;
  candidate: TargetedRegenerationCandidate;
  currentCvVersionId: string;
  currentCvContentHash: string;
  currentEffectiveCvBriefHash: string;
  currentSelectedEvidenceIds: string[];
  validEvidenceIds: string[];
  unsupportedTerms?: string[];
}): TargetedValidationResult {
  const staleContractFailures: TargetedValidationIssue[] = [];
  const addStale = (ruleId: string, message: string) => staleContractFailures.push({ id: stableIssueId("targeted-regeneration-freshness", ruleId), validatorId: "targeted-regeneration-freshness", ruleId, category: "stale-contract", message });
  if (input.request.cvVersionId !== input.currentCvVersionId) addStale("cv-version", "The CV version changed before targeted validation.");
  if (input.request.cvContentHash !== input.currentCvContentHash) addStale("cv-content-hash", "The CV content hash changed before targeted validation.");
  if (input.request.effectiveCvBriefHash !== input.currentEffectiveCvBriefHash) addStale("brief-hash", "The effective CV Brief changed before targeted validation.");
  if (!valuesEqual(input.request.selectedEvidenceIds, input.currentSelectedEvidenceIds)) addStale("evidence-context", "The selected Evidence context changed before targeted validation.");

  const extraction = applyAuthorizedPatch(input.currentCv, input.candidate, input.request);
  if (extraction.issue) staleContractFailures.push(extraction.issue);
  const rawPreservedFailures = preservedZoneFailures(input.currentCv, input.candidate.cv, input.request);
  const patchedCv = extraction.patchedCv;
  if (!patchedCv) {
    return { status: staleContractFailures.some((issue) => issue.ruleId === "request-id") ? "blocked-invalid-response" : "blocked-target", targetFailures: extraction.issue?.category === "target" ? [extraction.issue] : [], preservedZoneFailures: rawPreservedFailures, staleContractFailures, preExistingGlobalIssues: [], newGlobalIssues: [], changedZones: [], preservedZones: input.request.preservedZones, mayApplyTargetPatch: false };
  }

  const currentOutput = validateScreeningCvOutput(input.currentCv, { validEvidenceIds: input.validEvidenceIds });
  const patchedOutput = validateScreeningCvOutput(patchedCv, { validEvidenceIds: input.validEvidenceIds });
  const currentIssues = currentOutput.errors.map((error) => issueFromOutputError(error, input.currentCv, "pre-existing-global"));
  const currentKeys = new Set(currentIssues.map((issue) => issue.id));
  const afterIssues = patchedOutput.errors.map((error) => issueFromOutputError(error, patchedCv, "new-global"));
  const targetFailures: TargetedValidationIssue[] = afterIssues.filter((issue) => isTargetPath(input.request, issue.fieldPath)).map((issue) => ({ ...issue, category: "target" as const }));
  targetFailures.push(...unsupportedTargetFailures(input.currentCv, patchedCv, input.request, input.unsupportedTerms || []));
  const newGlobalIssues = afterIssues.filter((issue) => !currentKeys.has(issue.id) && !isTargetPath(input.request, issue.fieldPath));
  const preExistingGlobalIssues = currentIssues.filter((issue) => !isTargetPath(input.request, issue.fieldPath));
  const targetZones = targetBaseZones(input.request);
  const changedZones = Array.from(targetZones).filter((zone) => !valuesEqual(zoneValue(input.currentCv, zone), zoneValue(patchedCv, zone)));
  if (!changedZones.length) {
    targetFailures.push({ id: stableIssueId("targeted-regeneration-diff", "meaningful-content-diff"), validatorId: "targeted-regeneration-diff", ruleId: "meaningful-content-diff", category: "target", message: "The candidate did not change the authorized target zone." });
  }

  const mayApplyTargetPatch = !staleContractFailures.length && !rawPreservedFailures.length && !targetFailures.length && !newGlobalIssues.length;
  const status: TargetedValidationResult["status"] = staleContractFailures.length
    ? "blocked-stale"
    : rawPreservedFailures.length
      ? "blocked-preserved-zone"
      : targetFailures.length || newGlobalIssues.length
        ? "blocked-target"
        : "pass";
  return {
    status,
    targetFailures,
    preservedZoneFailures: rawPreservedFailures,
    staleContractFailures,
    preExistingGlobalIssues,
    newGlobalIssues,
    changedZones,
    preservedZones: input.request.preservedZones,
    mayApplyTargetPatch,
    patchedCv: mayApplyTargetPatch ? patchedCv : undefined
  };
}
