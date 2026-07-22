import type { TailoredCv } from "../../types";

export type BlockerEditTarget = {
  blockerId: string;
  section: "contact" | "summary" | "workExperience" | "skills" | "education" | "certifications";
  fieldId?: string;
  roleId?: string;
  bulletId?: string;
  focusKey: string;
  highlightKey: string;
};

export type GuidedEditContext = {
  blockerId: string;
  title: string;
  explanation: string;
  expectedOutcome: string;
  affectedField: string;
  progressLabel: string;
  advancedDetail: string;
  target: BlockerEditTarget;
};

export const GUIDED_EDIT_STORAGE_KEY = "cv-manager-guided-edit-target";

export function writeGuidedEditContext(context: GuidedEditContext) {
  sessionStorage.setItem(GUIDED_EDIT_STORAGE_KEY, JSON.stringify(context));
  sessionStorage.setItem("cv-manager-cv-panel", "edit");
}

export function readGuidedEditContext(): GuidedEditContext | null {
  const raw = sessionStorage.getItem(GUIDED_EDIT_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as GuidedEditContext;
    if (!parsed?.target?.focusKey || !parsed?.target?.highlightKey) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearGuidedEditContext() {
  sessionStorage.removeItem(GUIDED_EDIT_STORAGE_KEY);
}

function targetForKey(input: {
  blockerId: string;
  section: BlockerEditTarget["section"];
  fieldId?: string;
  roleId?: string;
  bulletId?: string;
}) {
  const focusKey = [
    "guided",
    input.section,
    input.fieldId,
    input.roleId,
    input.bulletId
  ].filter(Boolean).join("-");
  return {
    ...input,
    focusKey,
    highlightKey: focusKey
  };
}

export function findFirstEditableBullet(cv: TailoredCv | undefined, mode: "weak" | "external" | "any") {
  if (!cv) return null;
  const externalPattern = /work-log|raw evidence|internal|ticket|jira|meeting|sync|follow up|test setting|admin/i;
  for (let experienceIndex = 0; experienceIndex < cv.workExperience.length; experienceIndex += 1) {
    const experience = cv.workExperience[experienceIndex];
    for (let subsectionIndex = 0; subsectionIndex < experience.subsections.length; subsectionIndex += 1) {
      const subsection = experience.subsections[subsectionIndex];
      for (let bulletIndex = 0; bulletIndex < subsection.bullets.length; bulletIndex += 1) {
        const bullet = subsection.bullets[bulletIndex];
        const weakMatch = bullet.confidence === "Needs Review" || bullet.confidence === "Weak" || !(bullet.evidenceIds || []).length;
        const externalMatch = externalPattern.test(bullet.text);
        if (mode === "weak" && !weakMatch) continue;
        if (mode === "external" && !externalMatch) continue;
        return {
          experienceIndex,
          subsectionIndex,
          bulletIndex,
          roleId: experience.experienceId || String(experienceIndex),
          bulletId: `${experienceIndex}-${subsectionIndex}-${bulletIndex}`,
          label: `${experience.role || "Work Experience"} bullet ${bulletIndex + 1}`
        };
      }
    }
  }
  return null;
}

export function resolveBlockerEditTarget(input: {
  blockerId: string;
  rawBlocker: string;
  cv?: TailoredCv;
}): { target: BlockerEditTarget; affectedField: string; expectedOutcome: string } | null {
  const normalized = input.rawBlocker.toLowerCase();

  if (/contact extraction|contact email|missing name|missing email|missing.*location/.test(normalized)) {
    const fieldId = /email/.test(normalized) ? "email" : /location/.test(normalized) ? "location" : "name";
    return {
      target: targetForKey({ blockerId: input.blockerId, section: "contact", fieldId }),
      affectedField: `Header ${fieldId}`,
      expectedOutcome: "Required contact details are present before export."
    };
  }

  if (/hiring manager relevance|manager-ready|manager relevance|summary/.test(normalized)) {
    return {
      target: targetForKey({ blockerId: input.blockerId, section: "summary", fieldId: "summary" }),
      affectedField: "Summary",
      expectedOutcome: "The summary clearly explains why this CV fits the selected role."
    };
  }

  if (/weak claims|supporting evidence|evidence traceability|unsupported/.test(normalized)) {
    const bullet = findFirstEditableBullet(input.cv, "weak") || findFirstEditableBullet(input.cv, "any");
    if (!bullet) return null;
    return {
      target: targetForKey({
        blockerId: input.blockerId,
        section: "workExperience",
        fieldId: "bullet",
        roleId: bullet.roleId,
        bulletId: bullet.bulletId
      }),
      affectedField: bullet.label,
      expectedOutcome: "The bullet is either supported by evidence or rewritten more conservatively."
    };
  }

  if (/external wording|internal terminology|wording|work-log|raw evidence/.test(normalized)) {
    const bullet = findFirstEditableBullet(input.cv, "external") || findFirstEditableBullet(input.cv, "any");
    if (!bullet) return null;
    return {
      target: targetForKey({
        blockerId: input.blockerId,
        section: "workExperience",
        fieldId: "bullet",
        roleId: bullet.roleId,
        bulletId: bullet.bulletId
      }),
      affectedField: bullet.label,
      expectedOutcome: "The field uses external recruiter-friendly wording."
    };
  }

  if (/keyword/.test(normalized)) {
    return {
      target: targetForKey({ blockerId: input.blockerId, section: "skills", fieldId: "skill-groups" }),
      affectedField: "Skills",
      expectedOutcome: "The supported keyword appears in a suitable visible CV section."
    };
  }

  if (/visible work depth/.test(normalized)) {
    const bullet = findFirstEditableBullet(input.cv, "any");
    if (!bullet) return null;
    return {
      target: targetForKey({
        blockerId: input.blockerId,
        section: "workExperience",
        fieldId: "bullet",
        roleId: bullet.roleId,
        bulletId: bullet.bulletId
      }),
      affectedField: bullet.label,
      expectedOutcome: "Work history has enough concrete, readable role depth."
    };
  }

  return null;
}
