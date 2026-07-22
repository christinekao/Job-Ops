import { buildProjectBackboneDeltaPrompt, PROJECT_BACKBONE_PROMPT_VERSION } from "../promptBuilders";
import type { AppData, BackboneProjectTask, JobApplication } from "../types";
import { contentHash, estimatePromptTokens, PROJECT_TASK_TOKEN_LIMIT } from "../utils/hash";
import { freshSourceHashes } from "./sourceHashes";
import { computeJobContentHash } from "./jobs";
import { evidenceCoverageForProject, validateEvidenceCard } from "./evidence";
import { buildProjectTaskInput, hashProjectBackboneTaskInput, projectTaskInputHash as canonicalProjectTaskInputHash } from "./projectTaskInput";

export function projectTaskInputHash(data: AppData, experienceId: string, projectId: string) {
  return canonicalProjectTaskInputHash(data, experienceId, projectId);
}

export function bootstrapProfileSourceManifest(data: AppData): AppData {
  const existing = data.backboneMetadata.profileSourceHashes || {};
  const hasEstablishedBackbone = data.careerProfile.workExperiences.some((experience) => experience.projects.length)
    && data.evidenceCards.length > 0;
  if (Object.keys(existing).length || !hasEstablishedBackbone) return data;
  return {
    ...data,
    backboneMetadata: {
      ...data.backboneMetadata,
      profileSourceHashes: freshSourceHashes(data),
      profileSyncedAt: new Date().toISOString()
    }
  };
}

export function backboneReadiness(data: AppData, job?: Pick<JobApplication, "selectedEvidenceIds">) {
  const selectedIds = new Set(job?.selectedEvidenceIds || []);
  const selectedEvidence = job ? data.evidenceCards.filter((item) => selectedIds.has(item.id)) : data.evidenceCards;
  const selectedProjectIds = new Set(selectedEvidence.map((item) => item.projectId).filter((id): id is string => Boolean(id)));
  const selectedTasks = data.backboneTasks.filter((task) => selectedProjectIds.has(task.projectId));
  const staleSourceCount = selectedEvidence.flatMap((item) => item.sourceIds).filter((id, index, values) => {
    if (values.indexOf(id) !== index) return false;
    const source = data.rawSources.find((item) => item.id === id);
    return Boolean(source?.parsedSnapshot && source.parsedSnapshot.sourceContentHash !== contentHash(source.content));
  }).length;
  const invalidEvidence = selectedEvidence.filter((item) => !validateEvidenceCard(data, item).valid);
  const cvUsableEvidence = selectedEvidence.filter((item) => validateEvidenceCard(data, item).cvUsable);
  const pendingTaskCount = selectedTasks.filter((task) => task.status === "Pending").length;
  const needsReviewTaskCount = selectedTasks.filter((task) => task.status === "Needs Review").length;
  const orphanRecordCount = [...data.skillInferences, ...data.domainKnowledge, ...data.evidenceCards].filter((item) => {
    if (!item.projectId) return false;
    return !data.careerProfile.workExperiences.some((experience) => experience.projects.some((project) => project.id === item.projectId));
  }).length;
  const blockingReasons = [
    invalidEvidence.length ? `${invalidEvidence.length} selected Evidence record(s) have invalid lineage.` : "",
    selectedEvidence.length !== selectedIds.size ? "A selected Evidence record no longer exists." : "",
    selectedEvidence.length !== cvUsableEvidence.length ? "Selected Evidence is not CV-usable." : "",
    pendingTaskCount ? `${pendingTaskCount} selected Project task(s) are pending.` : "",
    needsReviewTaskCount ? `${needsReviewTaskCount} selected Project task(s) need review.` : "",
    staleSourceCount ? `${staleSourceCount} selected source snapshot(s) are stale.` : ""
  ].filter(Boolean);
  return {
    ready: blockingReasons.length === 0,
    staleSourceCount,
    pendingTaskCount,
    needsReviewTaskCount,
    orphanRecordCount,
    danglingLineageCount: invalidEvidence.length,
    traceabilityCoverage: selectedEvidence.length ? selectedEvidence.filter((item) => validateEvidenceCard(data, item).valid).length / selectedEvidence.length : 0,
    cvUsableCoverage: selectedEvidence.length ? cvUsableEvidence.length / selectedEvidence.length : 0,
    blockingReasons,
    warnings: orphanRecordCount ? [`${orphanRecordCount} unselected Backbone record(s) are orphaned.`] : []
  };
}

export function reconcileJobsWithBackbone(data: AppData): AppData {
  const skillIds = new Set(data.skillInferences.map((item) => item.id));
  const domainIds = new Set(data.domainKnowledge.map((item) => item.id));
  const evidenceIds = new Set(data.evidenceCards.map((item) => item.id));
  const storyIds = new Set(data.starStories.map((item) => item.id));
  let changed = false;
  const jobs = data.jobs.map((job) => {
    const jdContentHash = computeJobContentHash(job);
    const jdContentChanged = Boolean(job.jdContentHash && job.jdContentHash !== jdContentHash);
    const selectedSkillIds = (job.selectedSkillIds || []).filter((id) => skillIds.has(id));
    const selectedDomainKnowledgeIds = (job.selectedDomainKnowledgeIds || []).filter((id) => domainIds.has(id));
    const selectedEvidenceIds = (job.selectedEvidenceIds || []).filter((id) => evidenceIds.has(id));
    const selectedStoryIds = (job.selectedStoryIds || []).filter((id) => storyIds.has(id));
    const staleCount = (job.selectedSkillIds || []).length - selectedSkillIds.length
      + (job.selectedDomainKnowledgeIds || []).length - selectedDomainKnowledgeIds.length
      + (job.selectedEvidenceIds || []).length - selectedEvidenceIds.length
      + (job.selectedStoryIds || []).length - selectedStoryIds.length;
    const recommendedSkillIds = (job.fitReview?.recommendedSkillIds || []).filter((id) => skillIds.has(id));
    const recommendedDomainKnowledgeIds = (job.fitReview?.recommendedDomainKnowledgeIds || []).filter((id) => domainIds.has(id));
    const recommendedEvidenceIds = (job.fitReview?.recommendedEvidenceIds || []).filter((id) => evidenceIds.has(id));
    const recommendedStoryIds = (job.fitReview?.recommendedStoryIds || []).filter((id) => storyIds.has(id));
    const staleRecommendationCount = (job.fitReview?.recommendedSkillIds || []).length - recommendedSkillIds.length
      + (job.fitReview?.recommendedDomainKnowledgeIds || []).length - recommendedDomainKnowledgeIds.length
      + (job.fitReview?.recommendedEvidenceIds || []).length - recommendedEvidenceIds.length
      + (job.fitReview?.recommendedStoryIds || []).length - recommendedStoryIds.length;
    if (!staleCount && !staleRecommendationCount && job.jdContentHash === jdContentHash) return job;
    changed = true;
    const protectedStatus = job.status === "Applied" || job.status === "Archived";
    if (jdContentChanged) {
      return {
        ...job,
        jdContentHash,
        selectedSkillIds: [],
        selectedDomainKnowledgeIds: [],
        selectedEvidenceIds: [],
        selectedStoryIds: [],
        fitReview: undefined,
        recommendationsAppliedAt: undefined,
        status: protectedStatus ? job.status : "Evidence Needed" as const,
        nextAction: protectedStatus
          ? job.nextAction
          : "JD content changed. Run Screening Analysis again before selecting evidence or generating a CV.",
        updatedAt: new Date().toISOString()
      };
    }
    return {
      ...job,
      jdContentHash,
      selectedSkillIds,
      selectedDomainKnowledgeIds,
      selectedEvidenceIds,
      selectedStoryIds,
      fitReview: job.fitReview ? {
        ...job.fitReview,
        recommendedSkillIds,
        recommendedDomainKnowledgeIds,
        recommendedEvidenceIds,
        recommendedStoryIds
      } : undefined,
      recommendationsAppliedAt: undefined,
      status: protectedStatus ? job.status : "Evidence Needed" as const,
      nextAction: protectedStatus
        ? job.nextAction
        : "Career Evidence changed. Re-run Screening Analysis to refresh evidence recommendations.",
      updatedAt: new Date().toISOString()
    };
  });
  return changed ? { ...data, jobs } : data;
}

/**
 * Single synchronous mutation boundary for Backbone-owned collections. It only
 * recalculates identity/readiness; it never dispatches an AI task.
 */
export function applyBackboneMutation(data: AppData, patch: Partial<AppData>) {
  const candidate = { ...data, ...patch };
  const backboneTasks = buildBackboneProjectTasks(candidate, false);
  return reconcileJobsWithBackbone({ ...candidate, backboneTasks });
}

export function buildBackboneProjectTasks(data: AppData, force = false): BackboneProjectTask[] {
  const existingByProject = new Map(data.backboneTasks.map((task) => [task.projectId, task]));
  return data.careerProfile.workExperiences.flatMap((experience) => experience.projects.map((project) => {
    const taskInput = buildProjectTaskInput(data, experience.id, project.id);
    const inputHash = hashProjectBackboneTaskInput(taskInput);
    const existing = existingByProject.get(project.id);
    const prompt = buildProjectBackboneDeltaPrompt(taskInput, inputHash);
    const estimatedInputTokens = estimatePromptTokens(prompt);
    const projectSkills = data.skillInferences.filter((item) => item.projectId === project.id);
    const projectDomain = data.domainKnowledge.filter((item) => item.projectId === project.id);
    const projectEvidence = data.evidenceCards.filter((item) => item.projectId === project.id);
    const projectStories = data.starStories.filter((item) => item.projectId === project.id);
    const knownSourceIds = new Set(data.rawSources.map((source) => source.id));
    const existingInventoryIsLinked = [...projectSkills, ...projectDomain]
      .filter((item) => item.confidence === "Grounded")
      .every((item) => item.sourceIds.length > 0 && item.sourceIds.every((sourceId) => knownSourceIds.has(sourceId)))
      && projectEvidence.every((item) => validateEvidenceCard(data, item).valid);
    const coverage = evidenceCoverageForProject(data, experience.id, project.id);
    const canAdoptExistingInventory = projectSkills.length > 0 && coverage.traceable > 0 && existingInventoryIsLinked;
    const sourceUnchanged = !existing || existing.inputHash === inputHash;
    const unchanged = !force && sourceUnchanged && (
      existing?.status === "Applied"
      || existing?.status === "Needs Review"
      || (!existing?.appliedAt && canAdoptExistingInventory)
    );
    const oversized = estimatedInputTokens > PROJECT_TASK_TOKEN_LIMIT;
    return {
      id: existing?.id || `task-${project.id}`,
      experienceId: experience.id,
      projectId: project.id,
      label: `${experience.company} · ${project.name}`,
      inputHash,
      promptVersion: PROJECT_BACKBONE_PROMPT_VERSION,
      status: existing?.status === "Needs Review" && !force && sourceUnchanged
        ? "Needs Review"
        : unchanged ? "Applied" : oversized ? "Needs Review" : "Pending",
      estimatedInputTokens,
      ...(unchanged ? {
        appliedAt: existing?.appliedAt || new Date().toISOString(),
        counts: existing?.counts || {
          skills: projectSkills.length,
          domain: projectDomain.length,
          evidence: projectEvidence.length,
          star: projectStories.length
        },
        reviewItems: existing?.reviewItems
      } : oversized ? {
        reviewItems: [`Prompt estimate ${estimatedInputTokens.toLocaleString()} tokens exceeds the ${PROJECT_TASK_TOKEN_LIMIT.toLocaleString()} token safety limit. Split this project source before running it.`]
      } : {})
    } satisfies BackboneProjectTask;
  }));
}
