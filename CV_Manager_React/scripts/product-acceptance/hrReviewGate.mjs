export function runHrReviewGate(input) {
  const { cv, evidenceCards = [], unresolvedBlockers = [] } = input;
  const blockers = [];
  const warnings = [];

  const header = cv?.header || {};
  addBlockerIf(!text(header.name), "hr-name", "Name is required.", "header.name");
  addBlockerIf(!validEmail(header.email), "hr-email", "Valid email is required.", "header.email");
  addBlockerIf(!text(header.location), "hr-location", "Location is required.", "header.location");
  addBlockerIf(!text(header.targetRole), "hr-target-role", "Target role must be visible.", "header.targetRole");

  const summary = cv?.summary || "";
  addBlockerIf(!text(summary) || summary.length < 90, "hr-summary-readable", "Summary must be readable and role-specific.", "summary");
  addBlockerIf(hasDuplicateSentences(summary), "hr-summary-duplicate", "Summary contains duplicate sentences.", "summary");
  addBlockerIf(!mentionsAny(summary, ["workflow automation", "customer enablement", "stakeholder"]), "hr-positioning", "Target role positioning is not clear.", "summary");

  const bullets = getBullets(cv);
  addBlockerIf(!bullets.length, "hr-recent-experience", "Recent experience must be visible.", "workExperience");
  addBlockerIf(bullets.length < 3, "hr-work-depth", "CV length/depth proxy is below current contract.", "workExperience");
  addBlockerIf(hasDuplicateBullets(bullets), "hr-duplicate-bullets", "Exact duplicate bullets are not allowed.", "workExperience");
  addBlockerIf(hasInternalTerms(cv), "hr-internal-terminology", "Internal-only terminology appears in primary content.", "workExperience");
  addBlockerIf(unresolvedBlockers.length > 0, "hr-unresolved-blocker", "Unresolved blocking issue remains.", "review");
  addBlockerIf(!hasRequiredSections(cv), "hr-required-sections", "Required CV sections are missing.", "cv");
  addBlockerIf(!atsReadable(cv), "hr-ats-readable", "CV structure is not ATS-readable.", "cv");

  const unsupported = unsupportedVisibleClaims(cv, evidenceCards);
  for (const claim of unsupported) {
    blockers.push({ id: "hr-unsupported-claim", message: `Unsupported visible claim: ${claim}`, target: "visibleContent" });
  }

  if (bullets.length < 4) {
    warnings.push({ id: "hr-depth-warning", message: "Additional role depth may improve recruiter scan." });
  }

  return {
    pass: blockers.length === 0,
    score: scoreFrom(blockers.length, warnings.length),
    blockers,
    warnings
  };

  function addBlockerIf(condition, id, message, target) {
    if (condition) blockers.push({ id, message, target });
  }
}

export function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || "");
}

export function getBullets(cv) {
  return (cv?.workExperience || []).flatMap((role) =>
    (role.subsections || []).flatMap((section) => section.bullets || [])
  );
}

export function unsupportedVisibleClaims(cv, evidenceCards) {
  const visible = [
    cv?.summary || "",
    ...getBullets(cv).map((bullet) => bullet.text || "")
  ].join(" ").toLowerCase();
  const forbidden = evidenceCards.flatMap((card) => card.forbiddenVisibleClaims || []);
  return forbidden.filter((claim) => {
    const normalized = claim.toLowerCase();
    if (visible.includes(normalized)) return true;
    if (/enterprise ai platform/.test(normalized) && /enterprise ai platform/.test(visible)) return true;
    if (/p&l ownership/.test(normalized) && /p&l ownership/.test(visible)) return true;
    return false;
  });
}

function text(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasDuplicateSentences(value) {
  const sentences = (value || "").split(/[.!?]+/).map((item) => item.trim().toLowerCase()).filter(Boolean);
  return new Set(sentences).size !== sentences.length;
}

function hasDuplicateBullets(bullets) {
  const texts = bullets.map((bullet) => (bullet.text || "").trim().toLowerCase()).filter(Boolean);
  return new Set(texts).size !== texts.length;
}

function hasInternalTerms(cv) {
  const visible = [
    cv?.summary || "",
    ...getBullets(cv).map((bullet) => bullet.text || "")
  ].join(" ").toLowerCase();
  return /\b(project codename|internal-only|source\/proof|raw evidence|do not share)\b/.test(visible);
}

function mentionsAny(value, terms) {
  const lower = (value || "").toLowerCase();
  return terms.some((term) => lower.includes(term));
}

function hasRequiredSections(cv) {
  return Boolean(cv?.header && cv?.summary && cv?.sidebar?.skillGroups?.length && cv?.workExperience?.length);
}

function atsReadable(cv) {
  const visibleText = [
    cv?.header?.name,
    cv?.header?.targetRole,
    cv?.header?.email,
    cv?.header?.location,
    cv?.summary,
    ...getBullets(cv).map((bullet) => bullet.text)
  ].filter(Boolean).join(" ");
  return visibleText.length >= 500;
}

function scoreFrom(blockerCount, warningCount) {
  return Math.max(0, 100 - blockerCount * 20 - warningCount * 5);
}
