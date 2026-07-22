import type { AppData, JobApplication } from "../types";
import { isEvidenceCvUsable } from "../data/evidence";

export function evidenceIntegrityReview(data: AppData) {
  const evidence = data.evidenceCards;
  const cvVisible = evidence.filter((item) => isEvidenceCvUsable(data, item));
  const grounded = evidence.filter((item) => item.confidence === "Grounded");
  const externallyWorded = evidence.filter((item) => item.cvSafeBullet || item.cvBullet);
  const withRiskControls = evidence.filter((item) =>
    item.riskIfUsedWrongly || item.blockedVisibleTerms?.length || item.forbiddenVisibleClaims?.length || item.claimLevel
  );
  const completeEnough = evidence.length >= 8
    && cvVisible.length >= 5
    && grounded.length >= Math.min(6, evidence.length)
    && externallyWorded.length >= Math.min(5, evidence.length);
  return {
    completeEnough,
    checks: [
      { label: "Reusable evidence cards", ok: evidence.length >= 8, value: `${evidence.length} saved` },
      { label: "CV-visible evidence", ok: cvVisible.length >= 5, value: `${cvVisible.length} can be visible` },
      { label: "Grounded confidence", ok: grounded.length >= Math.min(6, evidence.length), value: `${grounded.length}/${evidence.length} grounded` },
      { label: "External CV wording", ok: externallyWorded.length >= Math.min(5, evidence.length), value: `${externallyWorded.length} have cvBullet/cvSafeBullet` },
      { label: "Risk controls", ok: withRiskControls.length >= Math.min(4, evidence.length), value: `${withRiskControls.length} have claim/risk controls` }
    ]
  };
}

export function terminologyAndGapReview(job: JobApplication, data: AppData) {
  const analysisTerms = job.screeningAnalysis?.internalTerminology || [];
  const selectedBlockedTerms = Array.from(new Set(
    job.selectedEvidenceIds.flatMap((id) =>
      data.evidenceCards.find((item) => item.id === id)?.blockedVisibleTerms || []
    )
  )).filter(Boolean);
  const translatedTerms = new Set(analysisTerms.map((item) => item.originalTerm.toLowerCase()));
  const unmappedBlockedTerms = selectedBlockedTerms.filter((term) => !translatedTerms.has(term.toLowerCase()));
  const highRiskGaps = (job.screeningAnalysis?.remainingGaps || []).filter((item) => item.riskLevel === "High");
  const mediumRiskGaps = (job.screeningAnalysis?.remainingGaps || []).filter((item) => item.riskLevel === "Medium");
  const mapping = job.screeningAnalysis?.jdEvidenceMapping || [];
  const mappingCounts = mapping.reduce<Record<string, number>>((counts, item) => {
    counts[item.supportLevel] = (counts[item.supportLevel] || 0) + 1;
    return counts;
  }, {});
  return {
    ready: Boolean(job.screeningAnalysis),
    selectedBlockedTerms,
    unmappedBlockedTerms,
    highRiskGaps,
    mediumRiskGaps,
    mappingCounts,
    checks: [
      { label: "Terminology table", ok: analysisTerms.length > 0 || selectedBlockedTerms.length === 0, value: analysisTerms.length ? `${analysisTerms.length} translated term(s)` : "No selected blocked terms detected" },
      { label: "Selected evidence terms to avoid", ok: true, value: unmappedBlockedTerms.length ? `${unmappedBlockedTerms.length} terms must stay out of the CV` : "All selected blocked terms are mapped or absent" },
      { label: "Unsupported JD requirements", ok: true, value: `${mappingCounts.Unsupported || 0} will not be forced into the CV` },
      { label: "Weak JD requirements", ok: true, value: `${mappingCounts.Weak || 0} weak; use only if supported` },
      { label: "High-risk gaps", ok: highRiskGaps.length === 0, value: highRiskGaps.length ? `${highRiskGaps.length} warning(s) for CV prompt` : "0 high-risk gap(s)" }
    ]
  };
}
