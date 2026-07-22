import type {
  AppData,
  BackboneMetadata,
  BackboneUpdateSummary,
  CareerProfile,
  CertificationItem,
  DomainKnowledge,
  EducationItem,
  EvidenceCard,
  HighCompensationSignal,
  ProjectItem,
  RawSource,
  SkillGroup,
  SkillInference,
  SourceOfTruth,
  SourceParsedSnapshot,
  StarStory,
  WorkExperienceItem
} from "../types";
import { contentHash } from "./hash";

export const emptyCareerProfile: CareerProfile = {
  identity: "",
  targetRoles: [],
  positioning: "",
  education: [],
  certifications: [],
  skillGroups: [],
  workExperiences: [],
  claimBoundaries: ""
};

export function textValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join("\n");
  if (value && typeof value === "object") return JSON.stringify(value);
  return String(value ?? "");
}

export function recruiterSafeText(value: string): string {
  return value
    .replace(/\bTOMO\s+(?:versus|vs\.?|and)\s+(?:Intercom\s+)?FIN\s*AI\b/gi, "cross-platform customer-service AI chatbot")
    .replace(/\bD365[- ]to[- ](?:Intercom\s+)?FIN\s*AI\s+KB\b/gi, "D365-to-chatbot knowledge-base")
    .replace(/\b(?:Intercom\s*(?:\/\s*)?)?FIN\s*AI\s+workspace administration\b/gi, "enterprise customer-service AI chatbot workspace administration")
    .replace(/\bIntercom\s+(?:\/\s*)?FIN\s*AI(?:\s+Platform)?\b/gi, "enterprise customer-service AI platform")
    .replace(/\bFIN\s*AI\s+(?:external\s+)?customer-service chatbot\b/gi, "external customer-service AI chatbot")
    .replace(/\bFIN\s*AI\s+chatbot\b/gi, "customer-service AI chatbot")
    .replace(/\bFIN\s*AI\s+identifiers?\b/gi, "chatbot platform identifiers")
    .replace(/\bFIN\s*AI\s+KB\b/gi, "chatbot knowledge base")
    .replace(/\bFIN\s*AI\b/gi, "customer-service AI chatbot")
    .replace(/\bIntercom\s+enterprise customer-service AI chatbot\b/gi, "enterprise customer-service AI chatbot")
    .replace(/customer-service AI chatbot\s+chatbot/gi, "customer-service AI chatbot")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function sanitizeRecruiterValue<T>(value: T): T {
  if (typeof value === "string") return recruiterSafeText(value) as T;
  if (Array.isArray(value)) return value.map((item) => sanitizeRecruiterValue(item)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, sanitizeRecruiterValue(item)])
    ) as T;
  }
  return value;
}

export function sanitizeRecruiterFacingData(data: AppData): AppData {
  return {
    ...data,
    sourceOfTruth: sanitizeRecruiterValue(data.sourceOfTruth),
    careerProfile: sanitizeRecruiterValue(data.careerProfile),
    skillInferences: sanitizeRecruiterValue(data.skillInferences),
    domainKnowledge: sanitizeRecruiterValue(data.domainKnowledge),
    evidenceCards: sanitizeRecruiterValue(data.evidenceCards),
    starStories: sanitizeRecruiterValue(data.starStories),
    highCompensationSignals: sanitizeRecruiterValue(data.highCompensationSignals),
    backboneTasks: sanitizeRecruiterValue(data.backboneTasks),
    recruiterAnswers: sanitizeRecruiterValue(data.recruiterAnswers),
    jobs: sanitizeRecruiterValue(data.jobs),
    cvVersions: sanitizeRecruiterValue(data.cvVersions)
  };
}

export function normalizePeriodText(value: unknown): string {
  let period = textValue(value)
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  period = period.replace(/\s*-\s*(?:20\d{2}\s*\/\s*)?(Now|Current|Present)\b/i, " - Present");
  period = period.replace(/\s*\/\s*20\d{2}\b/g, "");
  period = period.replace(/\bNow\b/gi, "Present");
  period = period.replace(/\s*-\s*/g, " - ");
  return period;
}

export function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(textValue).map((item) => item.trim()).filter(Boolean);
  return textValue(value)
    .split(/\n|,|;|、/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function joinLines(value: string[]) {
  return value.join("\n");
}

export function lines(value: string) {
  return value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
}

function withId(value: unknown, prefix: string, index: number): string {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const existing = textValue(record.id).trim();
  return existing || `${prefix}-${index + 1}`;
}

export function normalizeEducation(value: unknown): EducationItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return {
      id: withId(item, "edu", index),
      school: textValue(record.school || record.institution || record.university),
      degree: textValue(record.degree || record.program),
      period: textValue(record.period || record.years || record.date),
      notes: textValue(record.notes || record.description || record.detail)
    };
  });
}

export function normalizeCertifications(value: unknown): CertificationItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return {
      id: withId(item, "cert", index),
      name: textValue(record.name || record.title),
      issuer: textValue(record.issuer || record.organization),
      year: textValue(record.year || record.date || record.period)
    };
  });
}

export function normalizeSkillGroups(value: unknown): SkillGroup[] {
  if (Array.isArray(value)) {
    return value.map((item, index) => {
      const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
      if (typeof item === "string") {
        return { id: `skill-${index + 1}`, name: "Skills", skills: stringArray(item) };
      }
      return {
        id: withId(item, "skill", index),
        name: textValue(record.name || record.category || record.group || "Skills"),
        skills: stringArray(record.skills || record.items || record.tools || [])
      };
    }).filter((group) => group.name || group.skills.length);
  }
  const skills = stringArray(value);
  return skills.length ? [{ id: "skill-1", name: "Skills", skills }] : [];
}

export function normalizeProjects(value: unknown): ProjectItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return {
      id: withId(item, "proj", index),
      name: textValue(record.name || record.title || record.project),
      period: normalizePeriodText(record.period || record.years || record.date),
      category: textValue(record.category || record.type),
      tools: stringArray(record.tools || record.skills || record.techStack),
      summary: textValue(record.summary || record.description || record.proof),
      metrics: textValue(record.metrics || record.impact),
      sourceIds: stringArray(record.sourceIds || record.sources)
    };
  });
}

export function normalizeExperiences(value: unknown): WorkExperienceItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return {
      id: withId(item, "exp", index),
      company: textValue(record.company || record.organization || record.employer),
      role: textValue(record.role || record.title || record.position),
      period: normalizePeriodText(record.period || record.years || record.date),
      location: textValue(record.location),
      scope: textValue(record.scope || record.summary || record.description),
      projects: normalizeProjects(record.projects || record.achievements || record.items)
    };
  });
}

export function normalizeCareerProfile(value: unknown): CareerProfile {
  const root = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const record = (root.careerProfile && typeof root.careerProfile === "object" ? root.careerProfile : root) as Record<string, unknown>;
  return sanitizeRecruiterValue({
    identity: textValue(record.identity || record.profile || record.summary),
    targetRoles: stringArray(record.targetRoles || record.target_roles || record.roles),
    positioning: textValue(record.positioning || record.position || record.careerPositioning),
    education: normalizeEducation(record.education),
    certifications: normalizeCertifications(record.certifications || record.certificates),
    skillGroups: normalizeSkillGroups(record.skillGroups || record.skill_groups || record.skills || record.tools),
    workExperiences: normalizeExperiences(record.workExperiences || record.work_experiences || record.experience || record.workHistory),
    claimBoundaries: textValue(record.claimBoundaries || record.claim_boundaries || record.needsReview || record.reviewNotes)
  });
}

export function normalizeSourceOfTruth(value: Partial<SourceOfTruth> | Record<string, unknown>): SourceOfTruth {
  const record = value as Record<string, unknown>;
  const text = (...keys: string[]) => String(keys.map((key) => record[key]).find((item) => item !== undefined && item !== null) ?? "");
  return sanitizeRecruiterValue({
    identity: text("identity", "profile", "summary"),
    targetRoles: text("targetRoles", "target_roles", "roles"),
    positioning: text("positioning", "position", "careerPositioning"),
    workHistory: text("workHistory", "work_history", "experience", "workExperience"),
    tools: text("tools", "skills", "techStack"),
    metrics: text("metrics", "impactMetrics", "impact"),
    claimBoundaries: text("claimBoundaries", "claim_boundaries", "needsReview", "reviewNotes")
  });
}

export function normalizeSkillInferences(value: unknown): SkillInference[] {
  const root = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const items = Array.isArray(root.skillInferences) ? root.skillInferences : Array.isArray(value) ? value : [];
  return sanitizeRecruiterValue(items.map((item, index) => {
    const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return {
      id: textValue(record.id) || `skill-inf-${index + 1}`,
      group: textValue(record.group || record.category || "Skills"),
      skill: textValue(record.skill || record.name),
      strength: (textValue(record.strength) as SkillInference["strength"]) || "Mentioned",
      usageContext: (textValue(record.usageContext || record.context) as SkillInference["usageContext"]) || "mentioned",
      evidenceSummary: textValue(record.evidenceSummary || record.summary || record.evidence),
      cvWording: textValue(record.cvWording || record.wording),
      experienceId: textValue(record.experienceId) || undefined,
      projectId: textValue(record.projectId) || undefined,
      sourceIds: stringArray(record.sourceIds || record.sources),
      confidence: (textValue(record.confidence) as SkillInference["confidence"]) || "Needs Review"
    };
  }).filter((item) => item.skill));
}

export function normalizeDomainKnowledge(value: unknown): DomainKnowledge[] {
  const root = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const items = Array.isArray(root.domainKnowledge) ? root.domainKnowledge : Array.isArray(value) ? value : [];
  return sanitizeRecruiterValue(items.map((item, index) => {
    const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return {
      id: textValue(record.id) || `domain-${index + 1}`,
      domain: textValue(record.domain || record.name || record.category) || "Domain Knowledge",
      businessProcess: textValue(record.businessProcess || record.process || record.workflow),
      stakeholders: stringArray(record.stakeholders || record.users || record.audience),
      systemsOrData: stringArray(record.systemsOrData || record.systems || record.data || record.platforms),
      riskOrCompliance: textValue(record.riskOrCompliance || record.risk || record.compliance),
      metricsOrKpis: stringArray(record.metricsOrKpis || record.metrics || record.kpis),
      proof: textValue(record.proof || record.evidence || record.summary),
      cvWording: textValue(record.cvWording || record.wording || record.resumeWording),
      experienceId: textValue(record.experienceId) || undefined,
      projectId: textValue(record.projectId) || undefined,
      sourceIds: stringArray(record.sourceIds || record.sources),
      confidence: (textValue(record.confidence) as DomainKnowledge["confidence"]) || "Needs Review"
    };
  }).filter((item) => item.domain || item.businessProcess || item.proof));
}

export function normalizeEvidenceCards(value: unknown): EvidenceCard[] {
  const root = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const items = Array.isArray(root.evidenceCards) ? root.evidenceCards : Array.isArray(value) ? value : [];
  return sanitizeRecruiterValue(items.map((item, index) => {
    const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return {
      id: textValue(record.id) || `evi-${index + 1}`,
      title: textValue(record.title || record.name) || "Untitled evidence",
      category: textValue(record.category || record.type),
      internalName: textValue(record.internalName) || undefined,
      datePeriod: textValue(record.datePeriod) || undefined,
      candidateRole: textValue(record.candidateRole) || undefined,
      externalFriendlyDescription: textValue(record.externalFriendlyDescription) || undefined,
      audience: textValue(record.audience) || undefined,
      businessFunction: textValue(record.businessFunction) || undefined,
      problemContext: textValue(record.problemContext) || undefined,
      actionTaken: textValue(record.actionTaken) || undefined,
      stakeholders: stringArray(record.stakeholders),
      quantifiedEvidence: textValue(record.quantifiedEvidence) || undefined,
      evidenceStrength: (textValue(record.evidenceStrength) as EvidenceCard["evidenceStrength"]) || undefined,
      relatedJdKeywords: stringArray(record.relatedJdKeywords),
      canBeUsedInCv: (textValue(record.canBeUsedInCv) as EvidenceCard["canBeUsedInCv"]) || undefined,
      canBeUsedInInterview: (textValue(record.canBeUsedInInterview) as EvidenceCard["canBeUsedInInterview"]) || undefined,
      confidentialityRisk: textValue(record.confidentialityRisk) || undefined,
      cvAngle: textValue(record.cvAngle) || undefined,
      notes: textValue(record.notes) || undefined,
      sectionTitle: textValue(record.sectionTitle || record.section) || undefined,
      tools: stringArray(record.tools || record.skills),
      proof: textValue(record.proof || record.summary || record.evidence),
      cvBullet: textValue(record.cvBullet || record.bullet) || undefined,
      cvSafeBullet: textValue(record.cvSafeBullet) || undefined,
      interviewTalkingPoint: textValue(record.interviewTalkingPoint) || undefined,
      riskIfUsedWrongly: textValue(record.riskIfUsedWrongly) || undefined,
      claimLevel: (textValue(record.claimLevel) as EvidenceCard["claimLevel"]) || undefined,
      allowedVisibleClaims: stringArray(record.allowedVisibleClaims),
      forbiddenVisibleClaims: stringArray(record.forbiddenVisibleClaims),
      visibilityUse: (textValue(record.visibilityUse) as EvidenceCard["visibilityUse"]) || undefined,
      bestRoleTypes: stringArray(record.bestRoleTypes),
      avoidRoleTypes: stringArray(record.avoidRoleTypes),
      blockedVisibleTerms: stringArray(record.blockedVisibleTerms),
      metrics: textValue(record.metrics || record.impact),
      sourceIds: stringArray(record.sourceIds || record.sources),
      experienceId: textValue(record.experienceId) || undefined,
      projectId: textValue(record.projectId) || undefined,
      confidence: (textValue(record.confidence) as EvidenceCard["confidence"]) || "Needs Review",
      evidenceTier: (textValue(record.evidenceTier) as EvidenceCard["evidenceTier"]) || "Supporting"
    };
  }).filter((item) => item.title || item.proof));
}

export function normalizeStarStories(value: unknown): StarStory[] {
  const root = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const items = Array.isArray(root.starStories) ? root.starStories : Array.isArray(value) ? value : [];
  return sanitizeRecruiterValue(items.map((item, index) => {
    const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return {
      id: textValue(record.id) || `star-${index + 1}`,
      title: textValue(record.title || record.name) || "Untitled STAR story",
      tags: stringArray(record.tags || record.skills),
      sectionTitle: textValue(record.sectionTitle || record.section) || undefined,
      situation: textValue(record.situation),
      task: textValue(record.task),
      action: textValue(record.action),
      result: textValue(record.result),
      cvBullets: stringArray(record.cvBullets || record.bullets),
      evidenceIds: stringArray(record.evidenceIds || record.evidence),
      experienceId: textValue(record.experienceId) || undefined,
      projectId: textValue(record.projectId) || undefined,
      storyConfidence: (textValue(record.storyConfidence) as StarStory["storyConfidence"]) || "Usable"
    };
  }).filter((item) => item.title || item.action || item.result));
}

export function normalizeHighCompensationSignals(value: unknown): HighCompensationSignal[] {
  const root = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const items = Array.isArray(root.highCompensationSignals) ? root.highCompensationSignals : Array.isArray(value) ? value : [];
  return items.map((item, index) => {
    const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return {
      id: textValue(record.id) || `comp-${index + 1}`,
      signalType: (textValue(record.signalType) as HighCompensationSignal["signalType"]) || "Enterprise Scope",
      strength: (textValue(record.strength) as HighCompensationSignal["strength"]) || "Medium",
      whyItMattersToRecruiters: textValue(record.whyItMattersToRecruiters),
      bestTargetRoles: stringArray(record.bestTargetRoles),
      supportingEvidenceIds: stringArray(record.supportingEvidenceIds),
      supportingProjectIds: stringArray(record.supportingProjectIds),
      supportingSkillIds: stringArray(record.supportingSkillIds),
      cvPositioning: textValue(record.cvPositioning),
      interviewPositioning: textValue(record.interviewPositioning),
      salaryNegotiationUse: textValue(record.salaryNegotiationUse),
      confidence: (textValue(record.confidence) as HighCompensationSignal["confidence"]) || "Needs Review"
    };
  }).filter((item) => item.whyItMattersToRecruiters || item.cvPositioning || item.supportingEvidenceIds.length);
}

export function normalizeBackboneMetadata(value: unknown): BackboneMetadata {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    runMode: (textValue(record.runMode) as BackboneMetadata["runMode"]) || "",
    partialOutput: Boolean(record.partialOutput),
    nextRecommendedRunMode: (textValue(record.nextRecommendedRunMode) as BackboneMetadata["nextRecommendedRunMode"]) || "",
    outputScope: textValue(record.outputScope),
    warnings: stringArray(record.warnings),
    profileSourceHashes: record.profileSourceHashes && typeof record.profileSourceHashes === "object"
      ? Object.fromEntries(Object.entries(record.profileSourceHashes as Record<string, unknown>).map(([key, hash]) => [key, textValue(hash)]).filter(([, hash]) => hash))
      : {},
    profileSyncedAt: textValue(record.profileSyncedAt)
  };
}

export function normalizeBackboneUpdateSummary(value: unknown): BackboneUpdateSummary {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    mode: (textValue(record.mode) as BackboneUpdateSummary["mode"]) || "",
    addedItems: stringArray(record.addedItems),
    modifiedItems: stringArray(record.modifiedItems),
    unchangedItems: stringArray(record.unchangedItems),
    possibleDuplicates: stringArray(record.possibleDuplicates),
    conflicts: stringArray(record.conflicts),
    needsReview: stringArray(record.needsReview),
    idChanges: stringArray(record.idChanges)
  };
}

export function normalizeSourceParsedSnapshot(value: unknown, source: RawSource): SourceParsedSnapshot {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const experiences = Array.isArray(record.workExperiences) ? record.workExperiences : [];
  return {
    sourceId: textValue(record.sourceId) || source.id,
    sourceTitle: textValue(record.sourceTitle) || source.title,
    sourceKind: (textValue(record.sourceKind) as RawSource["kind"]) || source.kind,
    sourceContentHash: contentHash(source.content),
    parsedAt: new Date().toISOString(),
    summary: textValue(record.summary),
    identityFacts: stringArray(record.identityFacts),
    workExperiences: experiences.map((experience) => {
      const exp = experience && typeof experience === "object" ? experience as Record<string, unknown> : {};
      const projects = Array.isArray(exp.projects) ? exp.projects : [];
      return {
        company: textValue(exp.company),
        role: textValue(exp.role),
        period: textValue(exp.period),
        location: textValue(exp.location),
        projects: projects.map((project) => {
          const proj = project && typeof project === "object" ? project as Record<string, unknown> : {};
          return {
            name: textValue(proj.name),
            period: textValue(proj.period),
            category: textValue(proj.category),
            tools: stringArray(proj.tools),
            summary: textValue(proj.summary),
            metrics: stringArray(proj.metrics),
            stakeholders: stringArray(proj.stakeholders),
            systemsOrData: stringArray(proj.systemsOrData || proj.systems || proj.data),
            risksOrCompliance: stringArray(proj.risksOrCompliance || proj.risks || proj.compliance),
            evidenceSeeds: stringArray(proj.evidenceSeeds || proj.evidence),
            starSeeds: stringArray(proj.starSeeds || proj.stories)
          };
        })
      };
    }),
    skills: stringArray(record.skills),
    domainSignals: stringArray(record.domainSignals || record.domains),
    education: stringArray(record.education),
    certifications: stringArray(record.certifications),
    claimBoundaries: stringArray(record.claimBoundaries || record.needsReview)
  };
}

export function normalizeBatchSourceSnapshots(value: unknown, sources: RawSource[]): SourceParsedSnapshot[] {
  const root = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const items = Array.isArray(root.sourceSnapshots)
    ? root.sourceSnapshots
    : Array.isArray(root.sources)
      ? root.sources
      : Array.isArray(value)
        ? value
        : [];

  return items.flatMap((item) => {
    const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const sourceId = textValue(record.sourceId || record.id);
    const sourceTitle = textValue(record.sourceTitle || record.title);
    const source = sources.find((candidate) => candidate.id === sourceId)
      || sources.find((candidate) => candidate.title === sourceTitle);
    return source ? [normalizeSourceParsedSnapshot(record, source)] : [];
  });
}

export function chunkSourcesForSnapshot(sources: RawSource[], maxChars = 22000) {
  const batches: RawSource[][] = [];
  sources.forEach((source) => {
    const sourceSize = source.content.length + source.title.length + source.kind.length + 400;
    const currentBatch = batches[batches.length - 1];
    const currentSize = currentBatch?.reduce(
      (sum, item) => sum + item.content.length + item.title.length + item.kind.length + 400,
      0
    ) || 0;
    if (!currentBatch || (currentBatch.length > 0 && currentSize + sourceSize > maxChars)) {
      batches.push([source]);
    } else {
      currentBatch.push(source);
    }
  });
  return batches;
}

export function chunkItemsBySize<T>(items: T[], maxChars: number, serialize: (items: T[]) => string) {
  const batches: T[][] = [];
  items.forEach((item) => {
    const currentBatch = batches[batches.length - 1];
    const itemSize = serialize([item]).length;
    const currentSize = currentBatch ? serialize(currentBatch).length : 0;
    if (!currentBatch || (currentBatch.length > 0 && currentSize + itemSize > maxChars)) {
      batches.push([item]);
    } else {
      currentBatch.push(item);
    }
  });
  return batches;
}

export function mergeCardsByIdentity<T extends { id: string }>(
  current: T[],
  incoming: T[],
  keyFor: (item: T) => string
) {
  const currentById = new Map(current.map((item) => [item.id, item]));
  const currentByKey = new Map(current.map((item) => [keyFor(item), item]));
  const mergedById = new Map(current.map((item) => [item.id, item]));
  incoming.forEach((item) => {
    const existing = currentById.get(item.id) || currentByKey.get(keyFor(item));
    mergedById.set(existing?.id || item.id, { ...item, id: existing?.id || item.id });
  });
  return Array.from(mergedById.values());
}

export function mergeProjectRecordsPreservingIds<T extends { id: string }>(
  existing: T[],
  incoming: T[],
  keyFor: (item: T) => string
) {
  const existingById = new Map(existing.map((item) => [item.id, item]));
  const existingByKey = new Map(existing.map((item) => [keyFor(item), item]));
  const merged = new Map(existing.map((item) => [item.id, item]));
  const incomingResolvedIds = new Set<string>();
  const idMap = new Map<string, string>();
  incoming.forEach((item) => {
    const matched = existingById.get(item.id) || existingByKey.get(keyFor(item));
    const resolvedId = matched?.id || item.id;
    idMap.set(item.id, resolvedId);
    incomingResolvedIds.add(resolvedId);
    merged.set(resolvedId, { ...item, id: resolvedId });
  });
  return {
    items: [...merged.values()],
    idMap,
    retainedIds: existing.map((item) => item.id).filter((id) => !incomingResolvedIds.has(id))
  };
}

export function profileToSourceOfTruth(profile: CareerProfile): SourceOfTruth {
  return {
    identity: profile.identity,
    targetRoles: profile.targetRoles.join(", "),
    positioning: profile.positioning,
    workHistory: profile.workExperiences
      .map((experience) => {
        const projects = experience.projects.map((project) => `  - ${project.name}: ${project.summary} ${project.metrics}`.trim()).join("\n");
        return `${experience.role} / ${experience.company} (${experience.period})\n${experience.scope}${projects ? `\n${projects}` : ""}`;
      })
      .join("\n\n"),
    tools: profile.skillGroups.map((group) => `${group.name}: ${group.skills.join(", ")}`).join("\n"),
    metrics: profile.workExperiences
      .flatMap((experience) => experience.projects.map((project) => project.metrics))
      .filter(Boolean)
      .join("\n"),
    claimBoundaries: profile.claimBoundaries
  };
}

export function normalizeCareerBackbone(value: unknown): Partial<import("../types").AppData> | null {
  const root = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const careerProfile = root.careerProfile ? normalizeCareerProfile(root.careerProfile) : undefined;
  const sourceOfTruth = root.sourceOfTruth
    ? normalizeSourceOfTruth(root.sourceOfTruth)
    : careerProfile
      ? profileToSourceOfTruth(careerProfile)
      : undefined;
  const skillInferences = root.skillInferences ? normalizeSkillInferences(root.skillInferences) : undefined;
  const domainKnowledge = root.domainKnowledge ? normalizeDomainKnowledge(root.domainKnowledge) : undefined;
  const evidenceCards = root.evidenceCards ? normalizeEvidenceCards(root.evidenceCards) : undefined;
  const starStories = root.starStories ? normalizeStarStories(root.starStories) : undefined;
  const highCompensationSignals = root.highCompensationSignals ? normalizeHighCompensationSignals(root.highCompensationSignals) : undefined;
  const backboneMetadata = root.metadata ? normalizeBackboneMetadata(root.metadata) : undefined;
  const backboneUpdateSummary = root.updateSummary ? normalizeBackboneUpdateSummary(root.updateSummary) : undefined;
  const hasData = Boolean(
    careerProfile?.workExperiences.length
    || sourceOfTruth
    || evidenceCards?.length
    || skillInferences?.length
    || domainKnowledge?.length
    || starStories?.length
    || highCompensationSignals?.length
  );
  if (!hasData) return null;
  return {
    ...(careerProfile ? { careerProfile } : {}),
    ...(sourceOfTruth ? { sourceOfTruth } : {}),
    ...(skillInferences ? { skillInferences } : {}),
    ...(domainKnowledge ? { domainKnowledge } : {}),
    ...(evidenceCards ? { evidenceCards } : {}),
    ...(starStories ? { starStories } : {}),
    ...(highCompensationSignals ? { highCompensationSignals } : {}),
    ...(backboneMetadata ? { backboneMetadata } : {}),
    ...(backboneUpdateSummary ? { backboneUpdateSummary } : {})
  };
}

export function careerBackboneCoverage(value: unknown) {
  const normalized = normalizeCareerBackbone(value);
  if (!normalized) return null;
  const projectCount = normalized.careerProfile?.workExperiences.reduce((count, experience) => count + experience.projects.length, 0) || 0;
  const evidenceCount = normalized.evidenceCards?.length || 0;
  const skillCount = normalized.skillInferences?.length || 0;
  const domainCount = normalized.domainKnowledge?.length || 0;
  const storyCount = normalized.starStories?.length || 0;
  const expectedEvidence = Math.max(35, projectCount * 4);
  const expectedSkills = Math.max(40, projectCount * 4);
  const expectedDomains = Math.max(20, projectCount * 2);
  const expectedStories = Math.max(15, projectCount * 2);
  return {
    projectCount,
    evidenceCount,
    skillCount,
    domainCount,
    storyCount,
    expectedEvidence,
    expectedSkills,
    expectedDomains,
    expectedStories,
    enoughEvidence: evidenceCount >= expectedEvidence,
    enoughSkills: skillCount >= expectedSkills,
    enoughDomains: domainCount >= expectedDomains,
    enoughStories: storyCount >= expectedStories
  };
}

export function experienceLabel(profile: CareerProfile, experienceId?: string) {
  const experience = profile.workExperiences.find((item) => item.id === experienceId);
  if (!experience) return "Unassigned";
  return [experience.role, experience.company].filter(Boolean).join(" / ") || experience.id;
}

export function projectLabel(profile: CareerProfile, projectId?: string) {
  for (const experience of profile.workExperiences) {
    const project = experience.projects.find((item) => item.id === projectId);
    if (project) return project.name || project.id;
  }
  return "";
}
