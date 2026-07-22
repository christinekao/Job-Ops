import type { AppData, EvidenceCard } from "../types";

export type EvidenceValidation = {
  valid: boolean;
  cvUsable: boolean;
  reasons: string[];
};

export type EvidenceWriterPartition = {
  visible: EvidenceCard[];
  referenceOnly: EvidenceCard[];
  excluded: EvidenceCard[];
};

/**
 * The only policy gate for Evidence that crosses into CV generation. Keeping it
 * here prevents the evidence bank, CV brief, and command layer from drifting.
 */
export function validateEvidenceCard(data: AppData, evidence: EvidenceCard): EvidenceValidation {
  const reasons: string[] = [];
  const sourceIds = evidence.sourceIds || [];
  const experience = evidence.experienceId
    ? (data.careerProfile?.workExperiences || []).find((item) => item.id === evidence.experienceId)
    : undefined;
  const project = experience && evidence.projectId
    ? experience.projects.find((item) => item.id === evidence.projectId)
    : undefined;
  const knownSourceIds = new Set((data.rawSources || []).map((source) => source.id));

  if (!experience || !project) reasons.push("missing experience/project lineage");
  if (!sourceIds.length) reasons.push("missing source linkage");
  if (sourceIds.some((id) => !knownSourceIds.has(id))) reasons.push("unknown source linkage");
  if (project && sourceIds.some((id) => !project.sourceIds.includes(id))) reasons.push("source is not linked to the project");

  const valid = reasons.length === 0;
  const cvUsable = valid
    && evidence.confidence === "Grounded"
    && evidence.evidenceTier !== "Archive"
    && evidence.visibilityUse === "CV Visible"
    && evidence.canBeUsedInCv === "Yes"
    && evidence.claimLevel !== "Interview Only"
    && evidence.claimLevel !== "Do Not Claim";
  return { valid, cvUsable, reasons };
}

export function isEvidenceCvUsable(data: AppData, evidence: EvidenceCard) {
  return validateEvidenceCard(data, evidence).cvUsable;
}

/** Conservative legacy policy: absent safety metadata never becomes CV-visible. */
export function partitionEvidenceForWriter(data: AppData, cards: EvidenceCard[]): EvidenceWriterPartition {
  return cards.reduce<EvidenceWriterPartition>((result, card) => {
    const lineage = validateEvidenceCard(data, card);
    if (!lineage.valid || card.canBeUsedInCv === "No" || card.claimLevel === "Do Not Claim" || card.visibilityUse === "Do Not Use") {
      result.excluded.push(card);
    } else if (lineage.cvUsable) {
      result.visible.push(card);
    } else {
      // Interview-only, Prompt Context Only, archive, weak, and legacy records may inform context but not visible claims.
      result.referenceOnly.push(card);
    }
    return result;
  }, { visible: [], referenceOnly: [], excluded: [] });
}

export function evidenceCoverageForProject(data: AppData, experienceId: string, projectId: string) {
  const cards = data.evidenceCards.filter((item) => item.experienceId === experienceId && item.projectId === projectId);
  const validations = cards.map((item) => ({ item, validation: validateEvidenceCard(data, item) }));
  return {
    total: cards.length,
    traceable: validations.filter(({ validation }) => validation.valid).length,
    cvUsable: validations.filter(({ validation }) => validation.cvUsable).length,
    needsReview: validations.filter(({ validation }) => !validation.valid || !validation.cvUsable).length,
    traceabilityCovered: validations.some(({ validation }) => validation.valid),
    cvUsableCovered: validations.some(({ validation }) => validation.cvUsable),
    groundedEvidenceCount: validations.filter(({ item, validation }) => item.confidence === "Grounded" && validation.valid).length,
    needsReviewEvidenceCount: validations.filter(({ validation }) => !validation.cvUsable).length,
    excludedEvidenceCount: validations.filter(({ item, validation }) => !validation.cvUsable && (item.evidenceTier === "Archive" || item.canBeUsedInCv === "No" || !validation.valid)).length
  };
}

export function validateEvidenceBatch(data: AppData, cards: EvidenceCard[]) {
  const seen = new Set<string>();
  const errors: string[] = [];
  cards.forEach((card) => {
    if (seen.has(card.id)) errors.push(`duplicate evidence id: ${card.id}`);
    seen.add(card.id);
    const result = validateEvidenceCard(data, card);
    const assertsGrounding = card.confidence === "Grounded" || card.visibilityUse === "CV Visible" || card.canBeUsedInCv === "Yes";
    if (assertsGrounding && !result.valid) errors.push(`${card.id}: ${result.reasons.join(", ")}`);
    if (card.visibilityUse === "CV Visible" && !result.cvUsable) errors.push(`${card.id}: CV-visible evidence must satisfy the canonical CV-use policy`);
  });
  return { valid: errors.length === 0, errors };
}
