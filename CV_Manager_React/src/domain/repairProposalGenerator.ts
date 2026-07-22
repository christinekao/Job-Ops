import type { TailoredCv } from "../types";
import type { RepairProposal, RepairProposalInput, RepairProposalResult } from "./repairProposal.types";

function proposalId(blockerId: string, rawBlocker: string) {
  const suffix = rawBlocker.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "proposal";
  return `proposal-${blockerId}-${suffix}`;
}

function bulletValue(cv: TailoredCv | undefined, bulletId: string | undefined) {
  if (!cv || !bulletId) return "";
  const [experienceIndex, subsectionIndex, bulletIndex] = bulletId.split("-").map((value) => Number(value));
  if (![experienceIndex, subsectionIndex, bulletIndex].every(Number.isFinite)) return "";
  return cv.workExperience[experienceIndex]?.subsections[subsectionIndex]?.bullets[bulletIndex]?.text || "";
}

function sectionName(section: string) {
  if (section === "workExperience") return "Work Experience";
  if (section === "contact") return "Header";
  if (section === "summary") return "Summary";
  if (section === "skills") return "Skills";
  return section;
}

function compactSentence(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function removeDuplicateSentences(text: string) {
  const seen = new Set<string>();
  const sentences = text.split(/(?<=[.!?])\s+/).map(compactSentence).filter(Boolean);
  const deduped = sentences.filter((sentence) => {
    const key = sentence.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return deduped.join(" ");
}

function proposeSummary(currentValue: string, rawBlocker: string) {
  const withoutUnsupported = currentValue
    .replace(/\bowned an enterprise AI platform\b/gi, "supported workflow automation adoption")
    .replace(/\bowned enterprise AI platform\b/gi, "supported workflow automation adoption");
  const deduped = removeDuplicateSentences(withoutUnsupported);
  const suggested = compactSentence(deduped || currentValue);
  if (suggested && suggested !== currentValue) return suggested;
  if (/duplicate/i.test(rawBlocker)) return removeDuplicateSentences(currentValue);
  return compactSentence(currentValue);
}

function proposeBullet(currentValue: string, rawBlocker: string) {
  let suggested = currentValue
    .replace(/\bWork-log:\s*/gi, "")
    .replace(/\binternal sync\b/gi, "stakeholder coordination")
    .replace(/\btickets\b/gi, "delivery requests")
    .replace(/\btracked\b/gi, "coordinated");
  suggested = compactSentence(suggested);
  if (/weak claims|weak wording|supporting evidence/i.test(rawBlocker) && suggested.length < 70) {
    suggested = `${suggested.replace(/[.。]$/, "")} with clearer action, scope, and outcome based on selected evidence.`;
  }
  return suggested;
}

function isUnsupported(rawBlocker: string) {
  return /career positioning|evidence mismatch|missing achievement|unsupported experience/i.test(rawBlocker);
}

export function currentValueForTarget(cv: TailoredCv | undefined, input: RepairProposalInput) {
  if (input.currentValue !== undefined) return input.currentValue;
  const target = input.target;
  if (!target) return "";
  if (target.section === "summary") return cv?.summary || "";
  if (target.section === "workExperience") return bulletValue(cv, target.bulletId);
  if (target.section === "contact" && target.fieldId === "email") return cv?.header.email || "";
  if (target.section === "skills") return (cv?.sidebar.skillGroups || []).flatMap((group) => [...group.highlightedSkills, ...group.otherSkills]).join(", ");
  return "";
}

export function generateRepairProposal(cv: TailoredCv | undefined, input: RepairProposalInput): RepairProposalResult {
  if (!input.target) return { supported: false, reason: "No deterministic edit target is available." };
  if (isUnsupported(input.rawBlocker)) return { supported: false, reason: "This blocker requires human judgement and is not supported in Wave 1." };

  const raw = input.rawBlocker.toLowerCase();
  const currentValue = currentValueForTarget(cv, input);
  let suggestedValue = "";
  let reason = "";
  let estimatedImpact = "";
  let confidence: RepairProposal["confidence"] = "medium";

  if (input.target.section === "summary" && /summary|wording|duplicate/.test(raw)) {
    suggestedValue = proposeSummary(currentValue, input.rawBlocker);
    reason = "Improve summary wording while preserving the existing positioning boundary.";
    estimatedImpact = "Makes the first recruiter scan clearer without applying the change automatically.";
  } else if (input.target.section === "workExperience" && /weak|external wording|internal terminology|work-log|duplicate|wording/.test(raw)) {
    suggestedValue = proposeBullet(currentValue, input.rawBlocker);
    reason = /external|internal|work-log/.test(raw)
      ? "Translate internal wording into recruiter-facing language."
      : "Strengthen the bullet wording without adding unverified evidence.";
    estimatedImpact = "Clarifies one work-history bullet for review before any apply step.";
  } else if (input.target.section === "contact" && input.target.fieldId === "email" && input.deterministicEmail) {
    suggestedValue = input.deterministicEmail;
    reason = "A deterministic email value is available for the missing contact field.";
    estimatedImpact = "Completes the email field after future approval.";
    confidence = "high";
  } else if (/duplicate/.test(raw)) {
    suggestedValue = removeDuplicateSentences(currentValue);
    reason = "Remove repeated wording while keeping the original meaning.";
    estimatedImpact = "Reduces duplicate visible content after future approval.";
  } else {
    return { supported: false, reason: "This blocker is not supported by the Wave 1 proposal generator." };
  }

  if (!suggestedValue || suggestedValue === currentValue) {
    return { supported: false, reason: "No safe deterministic suggestion could be produced." };
  }

  const proposal: RepairProposal = {
    id: proposalId(input.blockerId, input.rawBlocker),
    blockerId: input.blockerId,
    target: input.target,
    currentValue,
    suggestedValue,
    reason,
    risk: input.target.section === "contact" ? "low" : "medium",
    confidence,
    estimatedImpact,
    affectedSection: sectionName(input.target.section),
    status: "draft"
  };

  return { supported: true, proposal };
}
