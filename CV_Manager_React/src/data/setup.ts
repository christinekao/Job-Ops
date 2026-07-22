import type { AppData } from "../types";
import type { TabId } from "../config/nav";

export function setupProgress(data: AppData) {
  const hasStructuredBackbone = data.careerProfile.workExperiences.length > 0
    || data.skillInferences.length > 0
    || data.domainKnowledge.length > 0
    || data.evidenceCards.length > 0
    || data.starStories.length > 0;
  const hasRawSource = hasStructuredBackbone
    || data.rawSources.some((source) => source.content.trim() && !source.content.startsWith("Paste "));
  const hasTruth = Object.values(data.sourceOfTruth).some((value) => value.trim()) || data.careerProfile.workExperiences.length > 0;
  const hasSkills = data.skillInferences.length > 0;
  const hasDomain = data.domainKnowledge.length > 0;
  const hasEvidence = data.evidenceCards.length > 0;
  const hasStar = data.starStories.length > 0;
  const hasJob = data.jobs.length > 0;
  const hasCv = data.cvVersions.length > 0;
  return { hasRawSource, hasTruth, hasSkills, hasDomain, hasEvidence, hasStar, hasJob, hasCv };
}

export function nextSetupAction(data: AppData) {
  const progress = setupProgress(data);
  if (!progress.hasJob) return "Add one target opportunity before running Screening Lab";
  if (!progress.hasCv) return "Run Screening Analysis and build a Screening CV";
  if (!progress.hasEvidence) return "Strengthen reusable evidence behind your best CVs";
  return "Review screening results and export the strongest CV";
}

export function nextSetupDestination(data: AppData): { tab: TabId; label: string } {
  const progress = setupProgress(data);
  if (!progress.hasJob) return { tab: "jd-intake", label: "Add Opportunity" };
  if (!progress.hasCv) return { tab: "screening-lab", label: "Build Screening CV" };
  if (!progress.hasEvidence || !progress.hasStar) return { tab: "career-source", label: "Strengthen Career Evidence" };
  return { tab: "screening-lab", label: "Open Screening Lab" };
}
