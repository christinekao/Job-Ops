import { effectiveEvidencePriorityIds, orderedItemsByIds } from "../data/selection";
import type { CareerProfile, CvBrief, EvidenceCard, TailoredCv } from "../types";
import { validateRepairPlanForExecution, type RepairExecutionResult, type RepairPlan } from "./screeningRepairPlan";

function externalize(value: string) {
  return value
    .replace(/\bFIN AI\b/gi, "customer-service AI chatbot")
    .replace(/\bFIN\b/g, "customer-service AI chatbot")
    .replace(/\bTOMO\b/g, "comparison chatbot platform")
    .replace(/\bTrender Buddy\b/gi, "internal employee AI assistant")
    .replace(/\bEureka API\b/gi, "knowledge-base API")
    .replace(/\bCorp\.IS-[A-Z-]+\b/g, "enterprise environment")
    .replace(/\b_tbl_[A-Za-z0-9_]+\b/g, "analytics table")
    .replace(/\bv\d+\.\d+\b/gi, "versioned")
    .replace(/\([^)]{55,}\)/g, "")
    .replace(/\b(latest PO amount|client secret expires|operation log versions?|prompt versions?|daily scheduled|utc\+?8|ticket|bug-fix versions?)\b[^.;]*/gi, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .trim();
}

const actionVerb = /built|created|developed|automated|supported|maintained|troubleshot|improved|reduced|enabled|centralized|documented|trained|coordinated|implemented|validated|translated|delivered/i;

function actionize(value: string) {
  const cleaned = externalize(value);
  if (!cleaned || actionVerb.test(cleaned)) return cleaned;
  const lowerFirst = cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
  if (/^(worked on|helped with|handled|did|made)\b/i.test(cleaned)) {
    return `Supported ${cleaned.replace(/^(worked on|helped with|handled|did|made)\s+/i, "")}`;
  }
  if (/^(conducted|performed|applied|used|analyzed|prepared)\b/i.test(cleaned)) return `Delivered ${lowerFirst}`;
  return `Supported ${lowerFirst}`;
}

function safeMetric(value: string | undefined) {
  if (!value) return "";
  const cleaned = externalize(value);
  if (/\b(version|ticket|operation log|client secret|utc|daily scheduled|prompt taxonomy|review case)\b/i.test(cleaned)) return "";
  return cleaned.length <= 120 ? cleaned : "";
}

function sanitizeBullet<T extends { text: string; metric?: string; metricType?: string }>(bullet: T) {
  const metric = safeMetric(bullet.metric);
  return { ...bullet, text: actionize(bullet.text), metric: metric || undefined, metricType: metric ? bullet.metricType : "Scope" as const };
}

type Bullet = TailoredCv["workExperience"][number]["subsections"][number]["bullets"][number];

export function buildLocalReviewerContentFix(input: {
  currentCv: TailoredCv;
  careerProfile: CareerProfile;
  evidenceCards: EvidenceCard[];
  selectedEvidenceIds: string[];
  brief: CvBrief | null;
  repairPlan: RepairPlan | null;
  isBulletSafe: (bullet: Bullet) => boolean;
}): ({ ok: true; tailoredCv: TailoredCv; rebuiltBulletCount: number } & RepairExecutionResult) | ({ ok: false; error: string } & RepairExecutionResult) {
  const planError = validateRepairPlanForExecution(input.repairPlan);
  const preservedZones = input.repairPlan?.items.flatMap((item) => item.preservedZones) || [];
  if (planError) {
    return { ok: false, error: planError, status: "blocked", message: planError, changedZones: [], preservedZones, remainingBlockers: input.repairPlan?.remainingBlockers || [] };
  }
  const canRepairWorkExperience = input.repairPlan?.items.some((item) => item.targetZones.includes("workExperience"));
  if (!canRepairWorkExperience) {
    const message = "No safe local content fix exists for these failed checks. Use the manual or AI repair action shown.";
    return { ok: false, error: message, status: "no-safe-fix", message, changedZones: [], preservedZones, remainingBlockers: input.repairPlan?.remainingBlockers || [] };
  }
  const priorityIds = effectiveEvidencePriorityIds({ selectedEvidenceIds: input.selectedEvidenceIds }, input.brief);
  const candidates = orderedItemsByIds(input.evidenceCards, priorityIds)
    .filter((item) => item.confidence === "Grounded"
      && item.visibilityUse !== "Interview Only" && item.visibilityUse !== "Prompt Context Only" && item.visibilityUse !== "Do Not Use"
      && item.claimLevel !== "Interview Only" && item.claimLevel !== "Do Not Claim")
    .filter((item) => item.cvSafeBullet || item.cvBullet || item.actionTaken || item.externalFriendlyDescription)
    .slice(0, 12);
  if (!candidates.length) {
    const message = "No safe selected evidence is available for a local content fix. Open CV Studio and edit manually.";
    return { ok: false, error: message, status: "no-safe-fix", message, changedZones: [], preservedZones, remainingBlockers: input.repairPlan?.remainingBlockers || [] };
  }

  const evidenceBullets = candidates.map((item) => {
    const metric = safeMetric(item.quantifiedEvidence || item.metrics);
    return {
      text: actionize(item.cvSafeBullet || item.cvBullet || item.actionTaken || item.externalFriendlyDescription || item.title),
      evidenceIds: [item.id], confidence: "Grounded" as const,
      metric: metric || undefined, metricType: metric ? "Impact" as const : "Scope" as const
    };
  }).filter((bullet) => bullet.text)
    .filter((bullet, index, list) => list.findIndex((item) => item.text.slice(0, 60) === bullet.text.slice(0, 60)) === index);
  if (!evidenceBullets.length) {
    const message = "No safe project-backed bullets could be generated locally. Open CV Studio for manual wording edits.";
    return { ok: false, error: message, status: "no-safe-fix", message, changedZones: [], preservedZones, remainingBlockers: input.repairPlan?.remainingBlockers || [] };
  }

  const workExperience: TailoredCv["workExperience"] = input.currentCv.workExperience.length ? [...input.currentCv.workExperience] : [{
    company: input.careerProfile.workExperiences[0]?.company || "", role: input.careerProfile.workExperiences[0]?.role || "",
    period: input.careerProfile.workExperiences[0]?.period || "", location: input.careerProfile.workExperiences[0]?.location || "", subsections: []
  }];
  const firstRole = { ...workExperience[0] };
  const existingBullets = firstRole.subsections.flatMap((section) => section.bullets).map(sanitizeBullet)
    .filter((bullet) => bullet.text && input.isBulletSafe(bullet));
  const mergedBullets = [...evidenceBullets, ...existingBullets]
    .filter((bullet, index, list) => list.findIndex((item) => item.text.slice(0, 60) === bullet.text.slice(0, 60)) === index).slice(0, 9);
  firstRole.subsections = [
    { title: "Power Platform, Workflow Automation, and Production Support", bullets: mergedBullets.slice(0, 5) },
    { title: "Reporting, Adoption, and Stakeholder Enablement", bullets: mergedBullets.slice(5, 9) }
  ].filter((section) => section.bullets.length);
  workExperience[0] = firstRole;
  for (let index = 1; index < workExperience.length; index += 1) {
    const role = workExperience[index];
    workExperience[index] = { ...role, subsections: role.subsections.map((section) => ({
      ...section, title: externalize(section.title), bullets: section.bullets.map(sanitizeBullet).filter((bullet) => bullet.text)
    })).filter((section) => section.bullets.length) };
  }
  return { ok: true, status: "success", message: `Local repair changed workExperience only and rebuilt ${mergedBullets.length} bullet(s).`, changedZones: ["workExperience"], preservedZones, remainingBlockers: [], rebuiltBulletCount: mergedBullets.length, tailoredCv: {
    ...input.currentCv, summary: input.currentCv.summary, workExperience,
    reviewNotes: [...(input.currentCv.reviewNotes || []), `Local no-token reviewer fix rebuilt ${mergedBullets.length} current-role bullet(s) and cleaned all visible work bullets for action/outcome and external wording.`]
  } };
}
