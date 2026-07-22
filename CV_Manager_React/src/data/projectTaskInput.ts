import type { AppData } from "../types";
import { contentHash } from "../utils/hash";

export const PROJECT_BACKBONE_TASK_PROMPT_VERSION = "project-backbone-delta-v1";
/** Bump whenever source-to-project matching or normalization changes. */
export const PROJECT_BACKBONE_MATCHING_RULES_VERSION = "project-source-match-v1";

function normalizeForProjectMatch(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\u3400-\u9fff]+/g, " ").trim();
}

function sourceContextsForProject(data: AppData, project: AppData["careerProfile"]["workExperiences"][number]["projects"][number]) {
  const projectTokens = normalizeForProjectMatch(project.name).split(" ").filter((token) => token.length > 2);
  return data.rawSources.flatMap((source) => {
    const snapshot = source.parsedSnapshot;
    const freshSnapshot = snapshot && snapshot.sourceContentHash === contentHash(source.content) ? snapshot : null;
    if (!freshSnapshot) return [];
    const directlyLinked = project.sourceIds.includes(source.id);
    const matches = freshSnapshot.workExperiences.flatMap((sourceExperience) => sourceExperience.projects.map((sourceProject) => {
      const searchable = normalizeForProjectMatch(`${sourceProject.name} ${sourceProject.category} ${sourceProject.summary} ${sourceProject.tools.join(" ")}`);
      const sharedTools = sourceProject.tools.filter((tool) => project.tools.some((projectTool) => normalizeForProjectMatch(projectTool) === normalizeForProjectMatch(tool))).length;
      const score = projectTokens.filter((token) => searchable.includes(token)).length * 3 + sharedTools;
      return { sourceExperience, sourceProject, score };
    }))
      .filter((candidate) => candidate.score > 0)
      .sort((left, right) => right.score - left.score || left.sourceProject.name.localeCompare(right.sourceProject.name))
      .slice(0, 2);
    if (!directlyLinked && matches.length === 0) return [];
    return [{
      sourceId: source.id,
      sourceTitle: source.title,
      sourceContentHash: contentHash(source.content),
      linkedDirectly: directlyLinked,
      parsedSnapshot: {
        sourceContentHash: freshSnapshot.sourceContentHash,
        summary: freshSnapshot.summary.slice(0, 1200),
        claimBoundaries: freshSnapshot.claimBoundaries.slice(0, 12)
      },
      projectMatches: matches.map(({ sourceExperience, sourceProject, score }) => ({
        score,
        company: sourceExperience.company,
        role: sourceExperience.role,
        period: sourceExperience.period,
        project: {
          ...sourceProject,
          tools: sourceProject.tools.slice(0, 20),
          metrics: sourceProject.metrics.slice(0, 15),
          stakeholders: sourceProject.stakeholders.slice(0, 12),
          systemsOrData: sourceProject.systemsOrData.slice(0, 15),
          risksOrCompliance: sourceProject.risksOrCompliance.slice(0, 10),
          evidenceSeeds: sourceProject.evidenceSeeds.slice(0, 12),
          starSeeds: sourceProject.starSeeds.slice(0, 8)
        }
      }))
    }];
  }).sort((left, right) => Number(right.linkedDirectly) - Number(left.linkedDirectly) || left.sourceId.localeCompare(right.sourceId)).slice(0, 2);
}

export type ProjectBackboneTaskInput = {
  promptVersion: string;
  matchingRulesVersion: string;
  normalizationVersion: string;
  experience: Record<string, unknown>;
  project: Record<string, unknown>;
  sourceManifest: Array<Record<string, unknown>>;
  sourceContexts: Array<Record<string, unknown>>;
  existing: Record<string, unknown>;
};

/** The single immutable input that is both hashed and rendered into the prompt. */
export function buildProjectTaskInput(data: AppData, experienceId: string, projectId: string): ProjectBackboneTaskInput | null {
  const experience = data.careerProfile.workExperiences.find((item) => item.id === experienceId);
  const project = experience?.projects.find((item) => item.id === projectId);
  if (!experience || !project) return null;
  return {
    promptVersion: PROJECT_BACKBONE_TASK_PROMPT_VERSION,
    matchingRulesVersion: PROJECT_BACKBONE_MATCHING_RULES_VERSION,
    normalizationVersion: "project-input-v1",
    experience: { id: experience.id, company: experience.company, role: experience.role, period: experience.period, location: experience.location, scope: experience.scope },
    project,
    // All sources participate in indirect matching; their identity must invalidate this task.
    sourceManifest: data.rawSources.map((source) => ({
      id: source.id,
      title: source.title,
      kind: source.kind,
      contentHash: contentHash(source.content),
      parsedSnapshotHash: source.parsedSnapshot?.sourceContentHash || null
    })).sort((left, right) => String(left.id).localeCompare(String(right.id))),
    sourceContexts: sourceContextsForProject(data, project),
    existing: {
      skillInferences: data.skillInferences.filter((item) => item.projectId === projectId),
      domainKnowledge: data.domainKnowledge.filter((item) => item.projectId === projectId),
      evidenceCards: data.evidenceCards.filter((item) => item.projectId === projectId),
      starStories: data.starStories.filter((item) => item.projectId === projectId)
    }
  };
}

export function hashProjectBackboneTaskInput(input: ProjectBackboneTaskInput | null) {
  return contentHash(input || {});
}

export function projectTaskInputHash(data: AppData, experienceId: string, projectId: string) {
  return hashProjectBackboneTaskInput(buildProjectTaskInput(data, experienceId, projectId));
}
