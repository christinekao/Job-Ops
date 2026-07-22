import type { TailoredCv } from "../types";

export type ScreeningCvOutputValidation = {
  valid: boolean;
  errors: string[];
};

export type ScreeningCvOutputValidationContext = {
  validEvidenceIds?: readonly string[];
};

function normalizeVisibleText(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function splitSummarySentences(summary: string): string[] {
  return summary
    .split(/(?<=[.!?])\s+/)
    .map(normalizeVisibleText)
    .filter(Boolean);
}

export function validateScreeningCvOutput(
  cv: TailoredCv,
  context: ScreeningCvOutputValidationContext = {}
): ScreeningCvOutputValidation {
  const errors: string[] = [];
  const validEvidenceIds = context.validEvidenceIds ? new Set(context.validEvidenceIds) : null;
  const seenSummarySentences = new Map<string, number>();
  const seenBulletTexts = new Map<string, string>();
  if (!cv.header.name.trim()) errors.push("header.name is required");
  if (!cv.header.targetRole.trim()) errors.push("header.targetRole is required");
  if (!/@/.test(cv.header.email.trim())) errors.push("header.email is required");
  if (!cv.summary.trim()) {
    errors.push("summary is required");
  } else {
    splitSummarySentences(cv.summary).forEach((sentence, sentenceIndex) => {
      const firstIndex = seenSummarySentences.get(sentence);
      if (firstIndex !== undefined) {
        errors.push(`summary sentence ${sentenceIndex} duplicates summary sentence ${firstIndex}`);
        return;
      }
      seenSummarySentences.set(sentence, sentenceIndex);
    });
  }
  if (!Array.isArray(cv.sidebar.skillGroups)) errors.push("sidebar.skillGroups must be an array");
  if (!Array.isArray(cv.workExperience) || cv.workExperience.length === 0) {
    errors.push("workExperience must contain at least one role");
  } else {
    cv.workExperience.forEach((experience, experienceIndex) => {
      if (!experience.company.trim()) errors.push(`workExperience[${experienceIndex}].company is required`);
      if (!experience.role.trim()) errors.push(`workExperience[${experienceIndex}].role is required`);
      const bulletCount = experience.subsections.reduce((count, section) => count + section.bullets.length, 0);
      if (bulletCount === 0) errors.push(`workExperience[${experienceIndex}] must contain at least one bullet`);
      experience.subsections.forEach((section, sectionIndex) => {
        section.bullets.forEach((bullet, bulletIndex) => {
          const bulletPath = `workExperience[${experienceIndex}].subsections[${sectionIndex}].bullets[${bulletIndex}]`;
          const normalizedBulletText = normalizeVisibleText(bullet.text);
          if (normalizedBulletText) {
            const firstPath = seenBulletTexts.get(normalizedBulletText);
            if (firstPath) {
              errors.push(`${bulletPath}.text duplicates ${firstPath}.text`);
            } else {
              seenBulletTexts.set(normalizedBulletText, bulletPath);
            }
          }
          if (!Array.isArray(bullet.evidenceIds) || bullet.evidenceIds.length === 0) {
            errors.push(`${bulletPath}.evidenceIds must contain at least one EvidenceCard ID`);
            return;
          }
          bullet.evidenceIds.forEach((evidenceId, evidenceIndex) => {
            const path =
              `${bulletPath}.evidenceIds[${evidenceIndex}]`;
            if (!evidenceId.startsWith("evi-")) {
              errors.push(`${path} must reference an EvidenceCard ID`);
              return;
            }
            if (validEvidenceIds && !validEvidenceIds.has(evidenceId)) {
              errors.push(`${path} references unknown EvidenceCard ID "${evidenceId}"`);
            }
          });
        });
      });
    });
  }
  return { valid: errors.length === 0, errors };
}
