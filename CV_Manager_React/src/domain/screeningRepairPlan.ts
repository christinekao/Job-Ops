import { reviewSnapshotContentHash } from "./screeningReview";
import { roleForCheck, type ScreeningReviewRoleId } from "./screeningReviewRoles";
import { repairKindForItem, type LocalCheck, type RepairActionKind } from "./screeningReview";
import type { CvVersion } from "../types";

export type RepairSeverity = "blocking" | "warning";
export type RepairMode = "local-safe" | "ai-repair" | "manual" | "no-safe-fix";
export type RepairTargetZone =
  | "header.targetRole"
  | "header.contact"
  | "summary"
  | "workExperience"
  | "sidebar"
  | "export";

export type RepairPlanItem = {
  checkId: string;
  label: string;
  reviewerOwner: ScreeningReviewRoleId;
  severity: RepairSeverity;
  targetZones: RepairTargetZone[];
  preservedZones: RepairTargetZone[];
  repairMode: RepairMode;
  approvalRequired: boolean;
  reason: string;
};

export type RepairPlan = {
  cvId: string;
  cvContentHash: string;
  failedCheckIds: string[];
  items: RepairPlanItem[];
  safeLocalItems: RepairPlanItem[];
  remainingBlockers: string[];
};

export type RepairExecutionResult =
  | {
    status: "success";
    message: string;
    changedZones: RepairTargetZone[];
    preservedZones: RepairTargetZone[];
    remainingBlockers: string[];
  }
  | {
    status: "blocked";
    message: string;
    changedZones: [];
    preservedZones: RepairTargetZone[];
    remainingBlockers: string[];
  }
  | {
    status: "no-safe-fix";
    message: string;
    changedZones: [];
    preservedZones: RepairTargetZone[];
    remainingBlockers: string[];
  };

const ALL_ZONES: RepairTargetZone[] = ["header.targetRole", "header.contact", "summary", "workExperience", "sidebar", "export"];

function checkId(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unknown-check";
}

function zonesForKind(kind: RepairActionKind, label: string): RepairTargetZone[] {
  if (kind === "title") return ["header.targetRole"];
  if (/contact|email/i.test(label)) return ["header.contact"];
  if (kind === "export") return ["export"];
  if (kind === "keyword") return ["summary", "workExperience", "sidebar"];
  if (kind === "wording" || kind === "evidence" || kind === "structure") return ["workExperience"];
  return [];
}

function modeForKind(kind: RepairActionKind, label: string): RepairMode {
  if (kind === "title" || /contact|email/i.test(label)) return "local-safe";
  if (kind === "wording" || kind === "structure" || kind === "evidence") return "local-safe";
  if (kind === "keyword") return "ai-repair";
  if (kind === "export") return "manual";
  return "no-safe-fix";
}

function approvalRequiredFor(kind: RepairActionKind) {
  return kind === "keyword" || kind === "evidence";
}

function planItemFromLabel(label: string, value = "", severity: RepairSeverity = "blocking"): RepairPlanItem {
  const kind = repairKindForItem(`${label}: ${value}`);
  const targetZones = zonesForKind(kind, label);
  return {
    checkId: checkId(label),
    label,
    reviewerOwner: roleForCheck({ label }).id,
    severity,
    targetZones,
    preservedZones: ALL_ZONES.filter((zone) => !targetZones.includes(zone)),
    repairMode: targetZones.length ? modeForKind(kind, label) : "no-safe-fix",
    approvalRequired: approvalRequiredFor(kind),
    reason: value
  };
}

export function createRepairPlan(input: {
  cv: CvVersion | undefined;
  gateFixes: string[];
  reviewerChecks: LocalCheck[];
  exportChecks: LocalCheck[];
}): RepairPlan | null {
  if (!input.cv) return null;
  const gateItems = input.gateFixes.map((item) => planItemFromLabel(item, item));
  const failedChecks = [...input.reviewerChecks, ...input.exportChecks]
    .filter((check) => !check.ok)
    .map((check) => planItemFromLabel(check.label, check.value));
  const items = [...gateItems, ...failedChecks];
  return {
    cvId: input.cv.id,
    cvContentHash: reviewSnapshotContentHash(input.cv),
    failedCheckIds: items.map((item) => item.checkId),
    items,
    safeLocalItems: items.filter((item) => item.repairMode === "local-safe" && item.targetZones.length > 0 && !item.approvalRequired),
    remainingBlockers: items.filter((item) => item.severity === "blocking").map((item) => `${item.label}: ${item.reason}`)
  };
}

export function localRepairPlan(plan: RepairPlan | null): RepairPlan | null {
  if (!plan || !plan.safeLocalItems.length) return null;
  return {
    ...plan,
    items: plan.safeLocalItems,
    failedCheckIds: plan.safeLocalItems.map((item) => item.checkId),
    remainingBlockers: plan.safeLocalItems.map((item) => `${item.label}: ${item.reason}`)
  };
}

export function validateRepairPlanForExecution(plan: RepairPlan | null) {
  if (!plan) return "No repair plan exists for the current CV.";
  if (!plan.items.length) return "No failed checks are available for repair.";
  if (plan.items.some((item) => !item.targetZones.length)) return "Repair rejected because at least one failed check has no target zone.";
  return "";
}
