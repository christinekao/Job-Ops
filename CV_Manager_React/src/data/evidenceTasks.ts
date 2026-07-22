import type { AppData, EvidenceCard } from "../types";
import { contentHash } from "../utils/hash";
import { validateEvidenceBatch, validateEvidenceCard } from "./evidence";

export const EVIDENCE_TASK_PROMPT_VERSION = "evidence-batch-v1";
export const EVIDENCE_TASK_MATCHING_RULES_VERSION = "evidence-batch-scope-v1";

export type EvidenceTask = {
  task: {
    taskId: string;
    inputHash: string;
    promptVersion: string;
    expectedExperienceId?: string;
    expectedProjectIds: string[];
  };
};

function targetProjects(data: AppData, projectIds: string[]) {
  const expected = new Set(projectIds);
  return data.careerProfile.workExperiences.flatMap((experience) => experience.projects
    .filter((project) => expected.has(project.id))
    .map((project) => ({ experience, project })));
}

export function buildEvidenceTaskInput(data: AppData, projectIds: string[]) {
  const expectedProjectIds = [...new Set(projectIds)].sort();
  const targets = targetProjects(data, expectedProjectIds);
  const experienceIds = [...new Set(targets.map(({ experience }) => experience.id))];
  return {
    promptVersion: EVIDENCE_TASK_PROMPT_VERSION,
    matchingRulesVersion: EVIDENCE_TASK_MATCHING_RULES_VERSION,
    expectedExperienceId: experienceIds.length === 1 ? experienceIds[0] : undefined,
    expectedProjectIds,
    projects: targets.map(({ experience, project }) => ({
      experience: { id: experience.id, company: experience.company, role: experience.role, period: experience.period, location: experience.location, scope: experience.scope },
      project
    })),
    sourceManifest: data.rawSources.map((source) => ({
      id: source.id,
      contentHash: contentHash(source.content),
      snapshotHash: source.parsedSnapshot?.sourceContentHash || null
    })).sort((left, right) => left.id.localeCompare(right.id)),
    sourceOfTruth: data.sourceOfTruth,
    skillInferences: data.skillInferences,
    existingEvidence: data.evidenceCards
  };
}

export function createEvidenceTask(data: AppData, projectIds: string[]): EvidenceTask {
  const input = buildEvidenceTaskInput(data, projectIds);
  const inputHash = contentHash(input);
  return {
    task: {
      taskId: `evidence-${contentHash({ projects: input.expectedProjectIds, experience: input.expectedExperienceId }).slice(0, 12)}`,
      inputHash,
      promptVersion: EVIDENCE_TASK_PROMPT_VERSION,
      ...(input.expectedExperienceId ? { expectedExperienceId: input.expectedExperienceId } : {}),
      expectedProjectIds: input.expectedProjectIds
    }
  };
}

export function validateEvidenceTaskEnvelope(data: AppData, expected: EvidenceTask, value: unknown) {
  const root = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const task = root.task && typeof root.task === "object" ? root.task as Record<string, unknown> : {};
  const cards = Array.isArray(root.evidenceCards) ? root.evidenceCards as EvidenceCard[] : [];
  const errors: string[] = [];
  const envelope = expected.task;
  if (task.taskId !== envelope.taskId) errors.push("task ID does not match the current Evidence batch");
  if (task.inputHash !== envelope.inputHash) errors.push("input hash does not match the current Evidence batch");
  if (task.promptVersion !== envelope.promptVersion) errors.push("prompt version does not match the current Evidence batch");
  if ((task.expectedExperienceId || undefined) !== (envelope.expectedExperienceId || undefined)) errors.push("expected Experience does not match the current Evidence batch");
  const returnedProjectIds = cards.map((card) => card.projectId || "");
  const expectedProjectIds = new Set(envelope.expectedProjectIds);
  if (returnedProjectIds.some((id) => !expectedProjectIds.has(id))) errors.push("response contains an out-of-scope Project");
  if (envelope.expectedProjectIds.some((id) => !returnedProjectIds.includes(id))) errors.push("response omits a required Project");
  for (const card of cards) {
    const lineage = validateEvidenceCard(data, card);
    if (!lineage.valid) errors.push(`${card.id}: ${lineage.reasons.join(", ")}`);
    if (envelope.expectedExperienceId && card.experienceId !== envelope.expectedExperienceId) errors.push(`${card.id}: Experience is outside the task scope`);
  }
  const batch = validateEvidenceBatch(data, cards);
  errors.push(...batch.errors);
  return { valid: errors.length === 0, errors: [...new Set(errors)], evidenceCards: cards };
}
