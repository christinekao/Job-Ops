import type { TailoredCv } from "../types";
import { contentHash } from "../utils/hash";
import { validateScreeningCvOutput } from "./screeningCvOutput";
import type { TargetedOutputContractFailure, TargetedRegenerationRequest, TargetedRegenerationResult, TargetedValidationIssue } from "./targetedRegeneration.types";

export type ValidationDiagnosticSeverity = "blocking" | "warning" | "info";
export type ValidationDiagnosticStatus = "pass" | "fail" | "skipped";
export type ValidationRecoveryRoute =
  | "retry-with-constraints"
  | "ai-proposal"
  | "manual-edit"
  | "review-evidence"
  | "human-decision"
  | "unsupported";

export type ValidationDiagnosticItem = {
  id: string;
  validatorId: string;
  ruleId: string;
  severity: ValidationDiagnosticSeverity;
  status: ValidationDiagnosticStatus;
  message: string;
  targetZone?: string;
  fieldPath?: string;
  sentenceIndex?: number;
  bulletId?: string;
  roleId?: string;
  currentValue?: string;
  candidateValue?: string;
  evidenceIds?: string[];
  missingEvidenceIds?: string[];
  unsupportedTerms?: string[];
  actualValue?: string | number | boolean;
  expectedValue?: string | number | boolean;
  recoveryRoute?: ValidationRecoveryRoute;
};

export type ValidationDiagnosticReport = {
  requestId: string;
  blockerIds: string[];
  cvVersionId: string;
  cvContentHash: string;
  targetZones: string[];
  rawResponseCaptured: boolean;
  rawResponseShape: string;
  normalizedCandidateCaptured: boolean;
  normalizedCandidate: Record<string, unknown>;
  candidateChanged: boolean;
  changedZones: string[];
  ignoredCandidateZones: string[];
  preservedZones: string[];
  checks: ValidationDiagnosticItem[];
  targetFailures: ValidationDiagnosticItem[];
  preservedZoneFailures: ValidationDiagnosticItem[];
  staleContractFailures: ValidationDiagnosticItem[];
  preExistingGlobalIssues: ValidationDiagnosticItem[];
  newGlobalIssues: ValidationDiagnosticItem[];
  blockingFailures: ValidationDiagnosticItem[];
  warnings: ValidationDiagnosticItem[];
  primaryFailureId?: string;
  stopReason: "passed" | "validation-blocked" | "no-diff" | "stale" | "invalid-response" | "runtime-error";
  recommendedRecovery: ValidationRecoveryRoute | "no-safe-recovery" | "none";
};

type ReviewCheck = { label: string; ok: boolean; value: string };

type DiagnosticInput = {
  request: TargetedRegenerationRequest;
  currentCv: TailoredCv;
  candidate: TailoredCv | null;
  rawResponse?: unknown;
  currentCvVersionId: string;
  currentCvContentHash: string;
  currentEffectiveCvBriefHash: string;
  currentSelectedEvidenceIds: string[];
  validEvidenceIds: string[];
  unsupportedTerms?: string[];
  targetedResult?: TargetedRegenerationResult;
  reviewChecks?: ReviewCheck[];
  runtimeError?: string;
  outputContractFailure?: TargetedOutputContractFailure;
};

const ZONES = ["header.contact", "header.targetRole", "summary", "workExperience", "sidebar.skills", "sidebar.education", "sidebar.certifications", "export"] as const;

function compact(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  return JSON.stringify(value);
}

function zoneValue(cv: TailoredCv, zone: string): unknown {
  if (zone === "header.contact") return { name: cv.header.name, email: cv.header.email, location: cv.header.location };
  if (zone === "header.targetRole") return cv.header.targetRole;
  if (zone === "summary") return cv.summary;
  if (zone === "workExperience") return cv.workExperience;
  if (zone === "sidebar.skills") return cv.sidebar.skillGroups;
  if (zone === "sidebar.education") return cv.sidebar.education;
  if (zone === "sidebar.certifications") return cv.sidebar.certifications;
  if (zone === "export") return { keywordPlacementNotes: cv.keywordPlacementNotes, interviewNotes: cv.interviewNotes };
  return undefined;
}

function targetBaseZones(request: TargetedRegenerationRequest): Set<string> {
  return new Set(request.targetZones.map((zone) => zone.startsWith("workExperience.") ? "workExperience" : zone));
}

function valueAtPath(cv: TailoredCv, path: string): unknown {
  const tokens = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
  let value: unknown = cv;
  for (const token of tokens) {
    if (value === null || value === undefined || typeof value !== "object") return undefined;
    value = (value as Record<string, unknown>)[token];
  }
  return value;
}

function shapeOf(value: unknown): string {
  if (Array.isArray(value)) return `array(${value.length})`;
  if (value && typeof value === "object") return `object(${Object.keys(value as Record<string, unknown>).sort().join(", ")})`;
  return typeof value;
}

function candidateSnapshot(candidate: TailoredCv | null, request: TargetedRegenerationRequest): Record<string, unknown> {
  if (!candidate) return {};
  const snapshot: Record<string, unknown> = {};
  for (const zone of request.targetZones) {
    if (zone === "summary") snapshot.summary = candidate.summary;
    if (zone.startsWith("workExperience")) snapshot.workExperience = candidate.workExperience.slice(0, 1);
    if (zone === "sidebar.skills") snapshot.skills = candidate.sidebar.skillGroups;
  }
  return snapshot;
}

function splitSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).map((item) => item.trim()).filter(Boolean);
}

function errorPath(error: string): string | undefined {
  const match = error.match(/^([\w.\[\]0-9]+)(?:\s|$)/);
  return match?.[1];
}

function bulletIdFromPath(path?: string): string | undefined {
  const match = path?.match(/workExperience\[(\d+)\]\.subsections\[(\d+)\]\.bullets\[(\d+)\]/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : undefined;
}

function recoveryForRule(ruleId: string): ValidationRecoveryRoute {
  if (/evidence|traceability|unsupported/.test(ruleId)) return "review-evidence";
  if (/target-zone|preserved-zone|ownership-metric/.test(ruleId)) return "retry-with-constraints";
  if (/role-fit/.test(ruleId)) return "ai-proposal";
  return "manual-edit";
}

function recommendedRecovery(primary?: ValidationDiagnosticItem): ValidationDiagnosticReport["recommendedRecovery"] {
  if (!primary) return "none";
  return primary.recoveryRoute || "no-safe-recovery";
}

export function formatValidationDiagnosticMessage(report: ValidationDiagnosticReport): string {
  if (report.stopReason === "invalid-response") {
    const contractFailure = report.blockingFailures.find((item) => item.validatorId === "targeted-output-contract");
    return `${contractFailure?.message || "AI returned a response that did not match the authorized patch contract."} Your current CV was not changed.`;
  }
  if (report.stopReason === "runtime-error") return "AI regeneration did not complete. Your current CV was not changed.";
  if (report.stopReason === "stale") return "The CV, CV Brief, or selected evidence changed before validation completed. Your current CV was not changed.";
  if (report.stopReason === "no-diff") return "AI regeneration completed, but no safe content change was available.";
  const target = report.targetZones.includes("summary") ? "Summary" : "targeted CV section";
  const reasons = [...report.staleContractFailures, ...report.preservedZoneFailures, ...report.targetFailures, ...report.newGlobalIssues]
    .slice(0, 3).map((item) => item.message).join(" ") || report.blockingFailures.slice(0, 3).map((item) => item.message).join(" ");
  return `AI created a new ${target}, but it was not applied.${reasons ? ` Blocked because: ${reasons}` : ""} Your current CV was not changed.`;
}

export function buildTargetedRegenerationValidationDiagnostic(input: DiagnosticInput): ValidationDiagnosticReport {
  const checks: ValidationDiagnosticItem[] = [];
  let sequence = 0;
  const add = (item: Omit<ValidationDiagnosticItem, "id">) => {
    sequence += 1;
    const diagnostic = { id: `${String(sequence).padStart(2, "0")}-${item.ruleId}`, ...item };
    checks.push(diagnostic);
    return diagnostic;
  };
  const candidate = input.candidate;
  const targetZones = targetBaseZones(input.request);
  const changedZones = candidate
    ? ZONES.filter((zone) => contentHash(zoneValue(input.currentCv, zone)) !== contentHash(zoneValue(candidate, zone)))
    : [];
  const ignoredCandidateZones = changedZones.filter((zone) => !targetZones.has(zone));
  const output = candidate ? validateScreeningCvOutput(candidate, { validEvidenceIds: input.validEvidenceIds }) : { valid: false, errors: [] };

  const outputContractDiagnostic = add({
    validatorId: input.outputContractFailure ? "targeted-output-contract" : "runtime-response-normalizer",
    ruleId: input.outputContractFailure ? "patch-only-schema" : "response-contract",
    severity: "blocking",
    status: candidate && !input.outputContractFailure ? "pass" : "fail",
    message: input.outputContractFailure
      ? input.outputContractFailure.errors.join(" ")
      : candidate
        ? "The AI response matched the target-specific patch contract."
        : "The AI response could not be normalized into the target-specific patch contract.",
    targetZone: input.outputContractFailure?.unauthorizedPaths.join(", ") || undefined,
    actualValue: input.outputContractFailure?.responseShape || (candidate ? "normalized" : shapeOf(input.rawResponse)),
    expectedValue: input.request.targetZones.includes("summary") ? "{summary}" : "exact authorized patch array",
    recoveryRoute: candidate ? undefined : "retry-with-constraints"
  });

  add({
    validatorId: "targeted-regeneration-boundary",
    ruleId: "target-zone",
    severity: ignoredCandidateZones.length ? "warning" : "info",
    status: candidate ? (ignoredCandidateZones.length ? "fail" : "pass") : "skipped",
    message: !candidate
      ? "Target-zone validation was skipped because no normalized candidate exists."
      : ignoredCandidateZones.length
        ? `The AI response also changed prohibited zone(s): ${ignoredCandidateZones.join(", ")}. Those values are not authorized for application.`
        : "The AI response changed only requested target zones.",
    targetZone: ignoredCandidateZones.join(", ") || input.request.targetZones.join(", "),
    actualValue: ignoredCandidateZones.length,
    expectedValue: 0,
    recoveryRoute: ignoredCandidateZones.length ? "retry-with-constraints" : undefined
  });

  const cvFresh = input.request.cvVersionId === input.currentCvVersionId && input.request.cvContentHash === input.currentCvContentHash;
  add({ validatorId: "targeted-regeneration-freshness", ruleId: "cv-freshness", severity: "blocking", status: cvFresh ? "pass" : "fail", message: cvFresh ? "CV version and content hash are current." : "The CV version or content hash changed before validation completed.", actualValue: `${input.currentCvVersionId}:${input.currentCvContentHash}`, expectedValue: `${input.request.cvVersionId}:${input.request.cvContentHash}`, recoveryRoute: cvFresh ? undefined : "retry-with-constraints" });

  const briefFresh = input.request.effectiveCvBriefHash === input.currentEffectiveCvBriefHash;
  add({ validatorId: "targeted-regeneration-freshness", ruleId: "brief-freshness", severity: "blocking", status: briefFresh ? "pass" : "fail", message: briefFresh ? "The effective CV Brief is current." : "The effective CV Brief changed before validation completed.", actualValue: input.currentEffectiveCvBriefHash, expectedValue: input.request.effectiveCvBriefHash, recoveryRoute: briefFresh ? undefined : "retry-with-constraints" });

  const expectedEvidence = [...input.request.selectedEvidenceIds].sort();
  const actualEvidence = [...input.currentSelectedEvidenceIds].sort();
  const evidenceFresh = JSON.stringify(expectedEvidence) === JSON.stringify(actualEvidence);
  add({ validatorId: "targeted-regeneration-freshness", ruleId: "evidence-context-freshness", severity: "blocking", status: evidenceFresh ? "pass" : "fail", message: evidenceFresh ? "The selected Evidence context is current." : "The selected Evidence context changed before validation completed.", evidenceIds: actualEvidence, missingEvidenceIds: expectedEvidence.filter((id) => !actualEvidence.includes(id)), actualValue: actualEvidence.join(", "), expectedValue: expectedEvidence.join(", "), recoveryRoute: evidenceFresh ? undefined : "review-evidence" });

  const requiredErrors = output.errors.filter((error) => /is required|must contain at least one role|must contain at least one bullet|skillGroups must be an array/.test(error));
  if (!candidate) {
    add({ validatorId: "screening-cv-output", ruleId: "required-fields", severity: "blocking", status: "skipped", message: "Required-field validation was skipped because no normalized candidate exists." });
  } else if (!requiredErrors.length) {
    add({ validatorId: "screening-cv-output", ruleId: "required-fields", severity: "info", status: "pass", message: "All required CV fields are present." });
  } else {
    for (const error of requiredErrors) {
      const fieldPath = errorPath(error);
      add({ validatorId: "screening-cv-output", ruleId: "required-fields", severity: "blocking", status: "fail", message: `${fieldPath || "A required CV field"} is missing in the candidate.`, fieldPath, currentValue: compact(fieldPath ? valueAtPath(input.currentCv, fieldPath) : ""), candidateValue: compact(fieldPath ? valueAtPath(candidate, fieldPath) : ""), actualValue: compact(fieldPath ? valueAtPath(candidate, fieldPath) : ""), expectedValue: "non-empty required value", recoveryRoute: "manual-edit" });
    }
  }

  const namespaceErrors = output.errors.filter((error) => /must reference an EvidenceCard ID|references unknown EvidenceCard ID/.test(error));
  if (!candidate) add({ validatorId: "screening-cv-output", ruleId: "evidencecard-namespace", severity: "blocking", status: "skipped", message: "EvidenceCard namespace validation was skipped because no normalized candidate exists." });
  else if (!namespaceErrors.length) add({ validatorId: "screening-cv-output", ruleId: "evidencecard-namespace", severity: "info", status: "pass", message: "Every candidate evidence reference uses a known EvidenceCard ID." });
  else namespaceErrors.forEach((error) => {
    const fieldPath = errorPath(error);
    const unknown = error.match(/"([^"]+)"/)?.[1];
    add({ validatorId: "screening-cv-output", ruleId: "evidencecard-namespace", severity: "blocking", status: "fail", message: `${fieldPath || "An evidence reference"} does not use a valid EvidenceCard ID${unknown ? `: ${unknown}` : ""}.`, fieldPath, bulletId: bulletIdFromPath(fieldPath), evidenceIds: unknown ? [unknown] : [], missingEvidenceIds: unknown ? [unknown] : [], candidateValue: compact(fieldPath ? valueAtPath(candidate, fieldPath) : ""), recoveryRoute: "review-evidence" });
  });

  const traceErrors = output.errors.filter((error) => /evidenceIds must contain at least one EvidenceCard ID/.test(error));
  if (!candidate) add({ validatorId: "screening-cv-output", ruleId: "evidence-traceability", severity: "blocking", status: "skipped", message: "Evidence traceability was skipped because no normalized candidate exists." });
  else if (!traceErrors.length) add({ validatorId: "screening-cv-output", ruleId: "evidence-traceability", severity: "info", status: "pass", message: "Every visible work bullet retains at least one EvidenceCard ID." });
  else traceErrors.forEach((error) => {
    const fieldPath = errorPath(error);
    add({ validatorId: "screening-cv-output", ruleId: "evidence-traceability", severity: "blocking", status: "fail", message: `${fieldPath || "A work bullet"} has no supporting EvidenceCard ID.`, fieldPath, bulletId: bulletIdFromPath(fieldPath), currentValue: compact(fieldPath ? valueAtPath(input.currentCv, fieldPath) : ""), candidateValue: compact(fieldPath ? valueAtPath(candidate, fieldPath) : ""), evidenceIds: [], missingEvidenceIds: ["at least one valid EvidenceCard ID"], actualValue: 0, expectedValue: 1, recoveryRoute: "review-evidence" });
  });

  const visibleCandidateSentences = candidate ? [candidate.summary, ...candidate.workExperience.flatMap((role) => role.subsections.flatMap((section) => section.bullets.map((bullet) => bullet.text)))].flatMap(splitSentences) : [];
  const unsupportedFindings = (input.unsupportedTerms || []).flatMap((term) => visibleCandidateSentences.map((sentence, sentenceIndex) => ({ term, sentence, sentenceIndex })).filter((item) => item.sentence.toLowerCase().includes(item.term.toLowerCase())));
  if (!candidate || !input.unsupportedTerms?.length) add({ validatorId: "screening-reviewer", ruleId: "unsupported-visible-claims", severity: "blocking", status: "skipped", message: "Unsupported-claim detail was not applicable or no structured unsupported terms were available." });
  else if (!unsupportedFindings.length) add({ validatorId: "screening-reviewer", ruleId: "unsupported-visible-claims", severity: "info", status: "pass", message: "No existing unsupported JD-mapping term appears in the candidate." });
  else unsupportedFindings.forEach((finding) => add({ validatorId: "screening-reviewer", ruleId: "unsupported-visible-claims", severity: "blocking", status: "fail", message: `Candidate sentence ${finding.sentenceIndex + 1} contains unsupported wording: “${finding.sentence}”`, targetZone: "visible CV", sentenceIndex: finding.sentenceIndex, candidateValue: finding.sentence, unsupportedTerms: [finding.term], missingEvidenceIds: input.request.selectedEvidenceIds.length ? [] : ["supporting EvidenceCard"], recoveryRoute: "review-evidence" }));

  add({ validatorId: "screening-reviewer", ruleId: "new-skill-ownership-metric", severity: "info", status: "skipped", message: "No separate structured ownership/metric validator output exists; existing unsupported-claim and evidence checks remain authoritative." });

  const duplicateErrors = output.errors.filter((error) => /duplicates/.test(error));
  if (!candidate) add({ validatorId: "screening-cv-output", ruleId: "duplicate-content", severity: "blocking", status: "skipped", message: "Duplicate-content validation was skipped because no normalized candidate exists." });
  else if (!duplicateErrors.length) add({ validatorId: "screening-cv-output", ruleId: "duplicate-content", severity: "info", status: "pass", message: "The candidate contains no duplicate Summary sentence or work bullet." });
  else duplicateErrors.forEach((error) => {
    const fieldPath = errorPath(error);
    const sentenceIndex = error.match(/^summary sentence (\d+)/)?.[1];
    add({ validatorId: "screening-cv-output", ruleId: "duplicate-content", severity: "blocking", status: "fail", message: error.replace(/^summary sentence (\d+)/, "Candidate Summary sentence $1"), fieldPath, sentenceIndex: sentenceIndex === undefined ? undefined : Number(sentenceIndex), candidateValue: fieldPath ? compact(valueAtPath(candidate, fieldPath)) : candidate.summary, recoveryRoute: "ai-proposal" });
  });

  const targetChanged = changedZones.some((zone) => targetZones.has(zone));
  add({ validatorId: "targeted-regeneration-diff", ruleId: "meaningful-content-diff", severity: "info", status: candidate ? (targetChanged ? "pass" : "fail") : "skipped", message: !candidate ? "Content-diff validation was skipped because no normalized candidate exists." : targetChanged ? `The candidate meaningfully changed: ${changedZones.filter((zone) => targetZones.has(zone)).join(", ")}.` : "The candidate did not change the requested target zone.", actualValue: targetChanged, expectedValue: true, recoveryRoute: candidate && !targetChanged ? "manual-edit" : undefined });

  add({ validatorId: "targeted-regeneration-boundary", ruleId: "preserved-zone-integrity", severity: ignoredCandidateZones.length ? "warning" : "info", status: candidate ? (ignoredCandidateZones.length ? "fail" : "pass") : "skipped", message: !candidate ? "Preserved-zone integrity was skipped because no normalized candidate exists." : ignoredCandidateZones.length ? `The raw candidate changed preserved zone(s), which the scoped application boundary must ignore: ${ignoredCandidateZones.join(", ")}.` : "All preserved zones are unchanged in the candidate.", targetZone: ignoredCandidateZones.join(", "), actualValue: ignoredCandidateZones.length, expectedValue: 0, recoveryRoute: ignoredCandidateZones.length ? "retry-with-constraints" : undefined });

  const contactChanged = candidate ? contentHash(zoneValue(input.currentCv, "header.contact")) !== contentHash(zoneValue(candidate, "header.contact")) : false;
  add({ validatorId: "targeted-regeneration-boundary", ruleId: "contact-preservation", severity: contactChanged ? "warning" : "info", status: candidate ? (contactChanged && !targetZones.has("header.contact") ? "fail" : "pass") : "skipped", message: !candidate ? "Contact preservation was skipped because no normalized candidate exists." : contactChanged && !targetZones.has("header.contact") ? "The raw candidate changed contact data during a non-contact repair; that change is not authorized for application." : "Contact content is preserved.", targetZone: "header.contact", currentValue: compact(zoneValue(input.currentCv, "header.contact")), candidateValue: compact(candidate ? zoneValue(candidate, "header.contact") : ""), recoveryRoute: contactChanged ? "retry-with-constraints" : undefined });

  const roleFitCheck = input.reviewChecks?.find((check) => /hiring manager relevance/i.test(check.label));
  add({ validatorId: "screening-reviewer", ruleId: "summary-role-fit", severity: "blocking", status: !candidate || !input.request.targetZones.includes("summary") || !roleFitCheck ? "skipped" : roleFitCheck.ok ? "pass" : "fail", message: !roleFitCheck ? "Structured role-fit result was not available at this validation node." : roleFitCheck.ok ? `Summary role-fit passed: ${roleFitCheck.value}` : `The regenerated Summary did not pass the existing role-fit check: ${roleFitCheck.value}`, targetZone: "summary", actualValue: roleFitCheck?.value, expectedValue: "existing hiring-manager relevance check passes", recoveryRoute: roleFitCheck && !roleFitCheck.ok ? "ai-proposal" : undefined });

  const workChecks = input.reviewChecks?.filter((check) => /action\/outcome|evidence traceability/i.test(check.label)) || [];
  const workFailed = workChecks.filter((check) => !check.ok);
  add({ validatorId: "screening-reviewer", ruleId: "work-bullet-quality", severity: "blocking", status: !candidate || !input.request.targetZones.some((zone) => zone.startsWith("workExperience")) || !workChecks.length ? "skipped" : workFailed.length ? "fail" : "pass", message: !workChecks.length ? "Structured work-bullet review results were not available at this validation node." : workFailed.length ? `Existing work-bullet checks still fail: ${workFailed.map((check) => check.value).join("; ")}` : "Existing work-bullet depth/action/result checks pass.", targetZone: "workExperience", actualValue: workFailed.length, expectedValue: 0, recoveryRoute: workFailed.length ? "ai-proposal" : undefined });

  const exportAffectedErrors = output.errors.filter((error) => /header\.(name|email)|workExperience|summary is required/.test(error));
  add({ validatorId: "screening-export-prerequisites", ruleId: "affected-export-prerequisites", severity: "blocking", status: !candidate ? "skipped" : exportAffectedErrors.length ? "fail" : "pass", message: !candidate ? "Export prerequisite diagnostics were skipped because no normalized candidate exists." : exportAffectedErrors.length ? `The candidate still fails export prerequisites: ${exportAffectedErrors.join("; ")}` : "Required export prerequisites affected by this candidate remain present.", actualValue: exportAffectedErrors.length, expectedValue: 0, recoveryRoute: exportAffectedErrors.some((error) => /evidenceIds/.test(error)) ? "review-evidence" : exportAffectedErrors.length ? "manual-edit" : undefined });

  if (input.targetedResult?.status === "blocked") {
    add({ validatorId: "targeted-regeneration-boundary", ruleId: "scoped-candidate-application", severity: "blocking", status: "fail", message: input.targetedResult.message, targetZone: input.request.targetZones.join(", "), recoveryRoute: /EvidenceCard|evidence/i.test(input.targetedResult.message) ? "review-evidence" : "retry-with-constraints" });
  } else {
    add({ validatorId: "targeted-regeneration-boundary", ruleId: "scoped-candidate-application", severity: "info", status: candidate ? "pass" : "skipped", message: candidate ? "The candidate can be scoped through the existing targeted-regeneration application boundary." : "Scoped candidate application was skipped because no normalized candidate exists." });
  }

  const scopedValidation = input.targetedResult?.validation;
  const diagnosticFromScopedIssue = (issue: TargetedValidationIssue): ValidationDiagnosticItem => ({
    id: `scoped-${issue.id}`,
    validatorId: issue.validatorId,
    ruleId: issue.ruleId,
    severity: issue.category === "pre-existing-global" ? "warning" : "blocking",
    status: "fail",
    message: issue.category === "pre-existing-global" ? `Remaining global issue: ${issue.message}` : issue.message,
    targetZone: issue.targetZone,
    fieldPath: issue.fieldPath,
    roleId: issue.roleId,
    bulletId: issue.bulletId,
    evidenceIds: issue.evidenceIds,
    missingEvidenceIds: issue.missingEvidenceIds,
    currentValue: issue.currentValue,
    candidateValue: issue.candidateValue,
    recoveryRoute: recoveryForRule(issue.ruleId)
  });
  const targetFailures = [
    ...(input.outputContractFailure ? [outputContractDiagnostic] : []),
    ...(scopedValidation?.targetFailures || []).map(diagnosticFromScopedIssue)
  ];
  const preservedZoneFailures = (scopedValidation?.preservedZoneFailures || []).map(diagnosticFromScopedIssue);
  const staleContractFailures = (scopedValidation?.staleContractFailures || []).map(diagnosticFromScopedIssue);
  const preExistingGlobalIssues = (scopedValidation?.preExistingGlobalIssues || []).map(diagnosticFromScopedIssue);
  const newGlobalIssues = (scopedValidation?.newGlobalIssues || []).map(diagnosticFromScopedIssue);
  if (scopedValidation) {
    const blockingScopedKeys = new Set([...targetFailures, ...preservedZoneFailures, ...staleContractFailures, ...newGlobalIssues].map((item) => `${item.ruleId}:${item.fieldPath || ""}`));
    const preExistingKeys = new Set(preExistingGlobalIssues.map((item) => `${item.ruleId}:${item.fieldPath || ""}`));
    for (const check of checks) {
      if (check.status !== "fail") continue;
      const key = `${check.ruleId}:${check.fieldPath || ""}`;
      if (blockingScopedKeys.has(key)) check.severity = "blocking";
      else if (preExistingKeys.has(key) || ["affected-export-prerequisites", "summary-role-fit", "work-bullet-quality"].includes(check.ruleId)) check.severity = "warning";
      else if (["required-fields", "evidencecard-namespace", "evidence-traceability", "unsupported-visible-claims", "duplicate-content"].includes(check.ruleId)) check.severity = "warning";
      if (check.ruleId === "target-zone" || check.ruleId === "preserved-zone-integrity" || check.ruleId === "contact-preservation") {
        check.severity = preservedZoneFailures.length ? "blocking" : check.severity;
      }
    }
    const existingScopedKeys = new Set(checks.map((item) => `${item.ruleId}:${item.fieldPath || ""}:${item.targetZone || ""}`));
    for (const item of [...staleContractFailures, ...preservedZoneFailures, ...targetFailures, ...newGlobalIssues, ...preExistingGlobalIssues]) {
      const key = `${item.ruleId}:${item.fieldPath || ""}:${item.targetZone || ""}`;
      if (!existingScopedKeys.has(key)) checks.push(item);
    }
  }
  const blockingFailures = checks.filter((check) => check.status === "fail" && check.severity === "blocking");
  const warnings = checks.filter((check) => check.status === "fail" && check.severity === "warning");
  const freshnessFailed = checks.some((check) => check.status === "fail" && /freshness/.test(check.ruleId));
  const stopReason: ValidationDiagnosticReport["stopReason"] = input.runtimeError
    ? "runtime-error"
    : scopedValidation?.status === "blocked-stale" || freshnessFailed || input.targetedResult?.status === "stale"
        ? "stale"
      : !candidate
        ? "invalid-response"
        : input.targetedResult?.status === "no-diff"
          ? "no-diff"
          : scopedValidation?.mayApplyTargetPatch === false || blockingFailures.length || input.targetedResult?.status === "blocked"
            ? "validation-blocked"
            : "passed";
  const primary = blockingFailures[0];
  return {
    requestId: input.request.id,
    blockerIds: input.request.blockerIds,
    cvVersionId: input.request.cvVersionId,
    cvContentHash: input.request.cvContentHash,
    targetZones: input.request.targetZones,
    rawResponseCaptured: input.rawResponse !== undefined,
    rawResponseShape: shapeOf(input.rawResponse),
    normalizedCandidateCaptured: Boolean(candidate),
    normalizedCandidate: candidateSnapshot(candidate, input.request),
    candidateChanged: targetChanged,
    changedZones,
    ignoredCandidateZones,
    preservedZones: input.request.preservedZones,
    checks,
    targetFailures,
    preservedZoneFailures,
    staleContractFailures,
    preExistingGlobalIssues,
    newGlobalIssues,
    blockingFailures,
    warnings,
    primaryFailureId: primary?.id,
    stopReason,
    recommendedRecovery: stopReason === "no-diff" ? "manual-edit" : recommendedRecovery(primary)
  };
}
