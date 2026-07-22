import type { LocalCheck } from "./screeningReview";

export type ScreeningReviewRoleId =
  | "gate"
  | "hiring-manager"
  | "ats"
  | "evidence"
  | "wording"
  | "export"
  | "repair-router";

export type ScreeningReviewRole = {
  id: ScreeningReviewRoleId;
  label: string;
  owns: string;
  doesNotOwn: string;
  fixMode: "local" | "manual" | "ai-optional" | "decision";
};

export const SCREENING_REVIEW_ROLES: Record<ScreeningReviewRoleId, ScreeningReviewRole> = {
  gate: {
    id: "gate",
    label: "Screening Gate",
    owns: "Visible title, supported must-have keywords, evidence coverage, and obvious internal terminology.",
    doesNotOwn: "Final hiring judgment or PDF/export readiness.",
    fixMode: "local"
  },
  "hiring-manager": {
    id: "hiring-manager",
    label: "Hiring Manager Review",
    owns: "Whether the first-page story is interview-worthy for the target JD.",
    doesNotOwn: "ATS keyword counting, contact extraction, or formatting-only export checks.",
    fixMode: "local"
  },
  ats: {
    id: "ats",
    label: "ATS / HR Scan",
    owns: "Supported JD keywords, readable section order, and plain text extraction.",
    doesNotOwn: "Unsupported keyword stuffing or claims beyond evidence.",
    fixMode: "local"
  },
  evidence: {
    id: "evidence",
    label: "Evidence Traceability",
    owns: "Every visible claim should be tied to valid Evidence Bank card IDs.",
    doesNotOwn: "Skills, domain, or STAR IDs pretending to be evidence.",
    fixMode: "local"
  },
  wording: {
    id: "wording",
    label: "External Wording Review",
    owns: "Removing work-log details, internal names, source/proof language, and unsupported phrasing.",
    doesNotOwn: "Adding new unsupported achievements.",
    fixMode: "local"
  },
  export: {
    id: "export",
    label: "Export Readiness",
    owns: "Header/contact extraction, PDF text layer, and export-safe structure.",
    doesNotOwn: "Rewriting the career story unless export text is missing.",
    fixMode: "manual"
  },
  "repair-router": {
    id: "repair-router",
    label: "Repair Router",
    owns: "Deciding the smallest repair path after all reviewers report their own findings.",
    doesNotOwn: "Creating new claims or rerunning AI by default.",
    fixMode: "decision"
  }
};

export function roleForCheck(check: Pick<LocalCheck, "label">): ScreeningReviewRole {
  const label = check.label;
  if (/hiring manager|manager relevance|manager intent/i.test(label)) return SCREENING_REVIEW_ROLES["hiring-manager"];
  if (/ATS|HR scan|keyword|text layer|section order/i.test(label)) return SCREENING_REVIEW_ROLES.ats;
  if (/evidence traceability|unsupported claims|weak claims/i.test(label)) return SCREENING_REVIEW_ROLES.evidence;
  if (/external wording|work-log|internal terminology|raw evidence/i.test(label)) return SCREENING_REVIEW_ROLES.wording;
  if (/contact|PDF|export|visible work depth/i.test(label)) return SCREENING_REVIEW_ROLES.export;
  return SCREENING_REVIEW_ROLES["repair-router"];
}

export function roleFixLabel(role: ScreeningReviewRole) {
  if (role.fixMode === "local") return "Local fix available";
  if (role.fixMode === "manual") return "Manual/export fix";
  if (role.fixMode === "ai-optional") return "AI optional";
  return "Routing decision";
}
