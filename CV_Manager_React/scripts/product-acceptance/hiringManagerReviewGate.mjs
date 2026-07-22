import { getBullets, unsupportedVisibleClaims } from "./hrReviewGate.mjs";

export function runHiringManagerReviewGate(input) {
  const { cv, evidenceCards = [], jd, selectedEvidenceIds = [] } = input;
  const blockers = [];
  const warnings = [];
  const selectedEvidence = evidenceCards.filter((card) => selectedEvidenceIds.includes(card.id));
  const bullets = getBullets(cv);

  const jdAreas = jd?.coreCapabilityAreas || [];
  const coveredAreas = new Set(selectedEvidence.flatMap((card) => card.relatedJdKeywords || []));
  const missingAreas = jdAreas.filter((area) => !coveredAreas.has(area));
  for (const area of missingAreas) {
    blockers.push({ id: "hm-core-capability-missing", message: `Selected evidence does not cover JD capability: ${area}`, target: "evidenceSelection" });
  }

  for (const bullet of bullets) {
    const ids = bullet.evidenceIds || [];
    if (!ids.length || ids.some((id) => !selectedEvidenceIds.includes(id))) {
      blockers.push({ id: "hm-bullet-traceability", message: "Every visible work bullet must cite selected EvidenceCard IDs.", target: "workExperience" });
      break;
    }
  }

  addBlockerIf(!hasTechnicalDepth(cv), "hm-technical-depth", "Technical depth is not represented.", "skills");
  addBlockerIf(!hasBusinessImpact(cv), "hm-business-impact", "Business impact is not represented.", "workExperience");
  addBlockerIf(!bullets.every(hasActionAndResult), "hm-action-result", "Bullets must contain concrete action and result.", "workExperience");
  addBlockerIf(importantExperienceOmitted(selectedEvidence, bullets), "hm-important-experience", "Important selected evidence is omitted from visible bullets.", "workExperience");
  addBlockerIf(overfitRisk(cv), "hm-overfit", "CV appears to overfit the JD at the expense of career truth.", "summary");
  addBlockerIf(genericContent(cv), "hm-generic-content", "Duplicate or generic content is rejected.", "workExperience");
  addBlockerIf(roleDepthTooLow(cv), "hm-role-depth", "Manager-relevant role depth is below current quality contract.", "workExperience");
  addBlockerIf(!summaryAlignsWithEvidence(cv, selectedEvidence), "hm-summary-evidence", "Summary positioning must align with supported evidence.", "summary");

  const unsupported = unsupportedVisibleClaims(cv, evidenceCards);
  for (const claim of unsupported) {
    blockers.push({ id: "hm-unsupported-claim", message: `Unsupported visible claim rejected: ${claim}`, target: "visibleContent" });
  }

  if ((cv?.reviewNotes || []).some((note) => /fit-risk|manual review/i.test(note))) {
    warnings.push({ id: "hm-fit-risk-warning", message: "Fit-risk item should be manually reviewed before sending." });
  }

  return {
    pass: blockers.length === 0,
    score: Math.max(0, 100 - blockers.length * 18 - warnings.length * 5),
    blockers,
    warnings
  };

  function addBlockerIf(condition, id, message, target) {
    if (condition) blockers.push({ id, message, target });
  }
}

function hasTechnicalDepth(cv) {
  const skills = (cv?.sidebar?.skillGroups || []).flatMap((group) => [
    ...(group.highlightedSkills || []),
    ...(group.otherSkills || [])
  ]).join(" ").toLowerCase();
  const bullets = getBullets(cv).map((bullet) => bullet.text || "").join(" ").toLowerCase();
  return /workflow automation|power automate|crm|power bi|reporting/.test(`${skills} ${bullets}`);
}

function hasBusinessImpact(cv) {
  const visible = getBullets(cv).map((bullet) => `${bullet.text || ""} ${bullet.metric || ""}`).join(" ").toLowerCase();
  return /\d+|reduced|improved|increased|supported|visibility|adoption/.test(visible);
}

function hasActionAndResult(bullet) {
  const text = (bullet.text || "").toLowerCase();
  const hasAction = /\b(mapped|configured|translated|consolidated|built|created|reduced|improved|supported)\b/.test(text);
  const hasResult = /\b(reduced|improved|used across|visibility|sessions|groups|adoption|follow-up|35%|12|4)\b/.test(text);
  return hasAction && hasResult && text.length >= 70;
}

function importantExperienceOmitted(selectedEvidence, bullets) {
  const visibleIds = new Set(bullets.flatMap((bullet) => bullet.evidenceIds || []));
  return selectedEvidence.some((card) => card.evidenceStrength === "Strong" && !visibleIds.has(card.id));
}

function overfitRisk(cv) {
  const visible = [
    cv?.summary || "",
    ...getBullets(cv).map((bullet) => bullet.text || "")
  ].join(" ").toLowerCase();
  return /perfect match|guaranteed fit|all requirements|expert in every/.test(visible);
}

function genericContent(cv) {
  const bullets = getBullets(cv).map((bullet) => (bullet.text || "").trim().toLowerCase()).filter(Boolean);
  const duplicates = new Set(bullets).size !== bullets.length;
  const generic = bullets.some((text) => /responsible for various tasks|helped with things|worked on projects/.test(text));
  return duplicates || generic;
}

function roleDepthTooLow(cv) {
  return getBullets(cv).length < 3;
}

function summaryAlignsWithEvidence(cv, selectedEvidence) {
  const summary = (cv?.summary || "").toLowerCase();
  const supportedTerms = new Set(selectedEvidence.flatMap((card) => card.relatedJdKeywords || []).map((term) => term.toLowerCase()));
  return ["workflow automation", "stakeholder discovery", "customer enablement"].some((term) => summary.includes(term) && supportedTerms.has(term));
}
