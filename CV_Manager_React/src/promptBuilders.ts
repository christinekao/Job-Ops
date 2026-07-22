import {
  effectiveEvidencePriorityIds,
  evidenceSelectionQualityDiagnostics,
  orderedItemsByIds,
  resolveEffectiveCvBrief,
  selectionDiagnostics
} from "./data/selection";
import type { AppData, BackboneRunMode, JobApplication, RawSource, TailoredCv } from "./types";
import { authorizedBulletTargets, targetedOutputKind } from "./domain/targetedRegenerationContract";
import type { TargetedRegenerationRequest } from "./domain/targetedRegeneration.types";
import { buildSummaryQualityContract } from "./domain/summaryQualityContract";
import { buildPositioningReport } from "./domain/positioningPolicy";
import type { ProjectBackboneTaskInput } from "./data/projectTaskInput";
import { PROJECT_BACKBONE_TASK_PROMPT_VERSION } from "./data/projectTaskInput";
import { partitionEvidenceForWriter } from "./data/evidence";
import type { EvidenceTask } from "./data/evidenceTasks";
import { aiMarketArchetypeHint, buildNormalizedRequirementInventory, canonicalParsedJD, marketRoleFamilyHint, normalizeParsedJDRequirements, REQUIREMENT_INVENTORY_POLICY_VERSION, sourceUrlPromptProjection } from "./data/jobs";
import {
  SCREENING_AI_SCHEMA_VERSION,
  screeningAiSchemaHash,
  screeningAnalysisPromptSchemaContract
} from "./domain/screeningAnalysisSchema";

function selectedJob(data: AppData, jdId: string): JobApplication | undefined {
  return data.jobs.find((job) => job.id === jdId);
}

const FIT_REVIEW_STOP_WORDS = new Set([
  "about", "after", "also", "and", "are", "build", "company", "experience", "for", "from", "have", "into",
  "job", "more", "must", "our", "role", "should", "that", "the", "their", "they", "this", "using", "with", "will",
  "years", "you", "your"
]);

function fitReviewTerms(job?: JobApplication): string[] {
  const raw = JSON.stringify(job?.parsed ? canonicalParsedJD(job.parsed) : job?.rawJD || "").toLowerCase();
  const counts = new Map<string, number>();
  for (const term of raw.match(/[a-z][a-z0-9+#.-]{2,}/g) || []) {
    if (FIT_REVIEW_STOP_WORDS.has(term)) continue;
    counts.set(term, (counts.get(term) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, 80)
    .map(([term]) => term);
}

function rankedForFitReview<T>(items: T[], terms: string[], limit: number): T[] {
  return items
    .map((item, index) => {
      const text = JSON.stringify(item).toLowerCase();
      const score = terms.reduce((total, term) => total + (text.includes(term) ? (term.length > 8 ? 3 : 1) : 0), 0)
        + (/grounded|strong|built|owned|led/.test(text) ? 2 : 0)
        + (/\d[%+]?/.test(text) ? 1 : 0);
      return { item, index, score };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(({ item }) => item);
}

function fitText(value: string | undefined, max = 500): string {
  const text = (value || "").trim();
  return text.length > max ? `${text.slice(0, max).trim()}...` : text;
}

function completeScreeningText(value: string | undefined): string {
  return (value || "").replace(/\s+/g, " ").trim();
}

export function buildFitReviewContext(data: AppData, jdId: string) {
  const job = selectedJob(data, jdId);
  const terms = fitReviewTerms(job);
  const careerProfile = {
    identity: data.careerProfile.identity,
    targetRoles: data.careerProfile.targetRoles,
    positioning: data.careerProfile.positioning,
    education: data.careerProfile.education,
    certifications: data.careerProfile.certifications,
    skillGroups: data.careerProfile.skillGroups,
    workExperiences: data.careerProfile.workExperiences.map((experience) => ({
      id: experience.id,
      company: experience.company,
      role: experience.role,
      period: experience.period,
      location: experience.location,
      scope: experience.scope,
      projects: experience.projects.map((project) => ({
        id: project.id,
        name: project.name,
        category: project.category
      }))
    })),
    claimBoundaries: data.careerProfile.claimBoundaries
  };
  return {
    jd: job?.parsed || job?.rawJD || {},
    careerProfile,
    sourceOfTruth: {
      positioning: fitText(data.sourceOfTruth.positioning, 700),
      claimBoundaries: fitText(data.sourceOfTruth.claimBoundaries, 700)
    },
    skillInferences: rankedForFitReview(data.skillInferences, terms, 18).map((item) => ({
      id: item.id,
      group: item.group,
      skill: item.skill,
      strength: item.strength,
      evidenceSummary: fitText(item.evidenceSummary, 350),
      experienceId: item.experienceId,
      projectId: item.projectId,
      confidence: item.confidence
    })),
    domainKnowledge: rankedForFitReview(data.domainKnowledge, terms, 12).map((item) => ({
      id: item.id,
      domain: item.domain,
      businessProcess: item.businessProcess,
      stakeholders: item.stakeholders.slice(0, 8),
      systemsOrData: item.systemsOrData.slice(0, 8),
      metricsOrKpis: item.metricsOrKpis.slice(0, 8),
      riskOrCompliance: fitText(item.riskOrCompliance, 300),
      proof: fitText(item.proof, 350),
      cvWording: fitText(item.cvWording, 300),
      experienceId: item.experienceId,
      projectId: item.projectId,
      confidence: item.confidence
    })),
    evidenceCards: rankedForFitReview(data.evidenceCards, terms, 20).map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      internalName: item.internalName || "",
      datePeriod: item.datePeriod || "",
      candidateRole: item.candidateRole || "",
      externalFriendlyDescription: fitText(item.externalFriendlyDescription, 400),
      audience: item.audience || "",
      businessFunction: item.businessFunction || "",
      problemContext: fitText(item.problemContext, 350),
      actionTaken: fitText(item.actionTaken, 350),
      stakeholders: (item.stakeholders || []).slice(0, 8),
      quantifiedEvidence: fitText(item.quantifiedEvidence, 250),
      evidenceStrength: item.evidenceStrength || "",
      relatedJdKeywords: (item.relatedJdKeywords || []).slice(0, 12),
      canBeUsedInCv: item.canBeUsedInCv || "",
      canBeUsedInInterview: item.canBeUsedInInterview || "",
      confidentialityRisk: fitText(item.confidentialityRisk, 250),
      cvAngle: fitText(item.cvAngle, 250),
      proof: fitText(item.proof, 350),
      metrics: fitText(item.metrics, 250),
      cvBullet: fitText(item.cvBullet, 400),
      cvSafeBullet: fitText(item.cvSafeBullet, 400),
      interviewTalkingPoint: fitText(item.interviewTalkingPoint, 300),
      riskIfUsedWrongly: fitText(item.riskIfUsedWrongly, 250),
      claimLevel: item.claimLevel || "",
      allowedVisibleClaims: item.allowedVisibleClaims || [],
      forbiddenVisibleClaims: item.forbiddenVisibleClaims || [],
      visibilityUse: item.visibilityUse || "CV Visible",
      bestRoleTypes: item.bestRoleTypes || [],
      avoidRoleTypes: item.avoidRoleTypes || [],
      blockedVisibleTerms: item.blockedVisibleTerms || [],
      tools: item.tools.slice(0, 10),
      experienceId: item.experienceId,
      projectId: item.projectId,
      confidence: item.confidence
    })),
    starStories: rankedForFitReview(data.starStories, terms, 8).map((item) => ({
      id: item.id,
      title: item.title,
      tags: item.tags.slice(0, 10),
      result: fitText(item.result, 400),
      cvBullets: (item.cvBullets || []).slice(0, 3).map((bullet) => fitText(bullet, 350)),
      evidenceIds: item.evidenceIds.slice(0, 8),
      experienceId: item.experienceId,
      projectId: item.projectId
    }))
  };
}

export function buildScreeningContextProjection(data: AppData, jdId: string) {
  const job = selectedJob(data, jdId);
  const terms = fitReviewTerms(job);
  return {
    ...sourceUrlPromptProjection(job?.parsed?.sourceUrl),
    employmentRoleType: job?.parsed?.roleType || "Unknown",
    classificationHints: {
      marketRoleFamily: marketRoleFamilyHint(job?.parsed),
      aiMarketArchetype: aiMarketArchetypeHint(job?.parsed),
      instruction: "Deterministic hints only. Confirm against the complete JD; do not derive candidate Fit from them."
    },
    education: data.careerProfile.education.map((item) => ({
      id: item.id, school: item.school, degree: item.degree, period: item.period,
      notes: completeScreeningText(item.notes)
    })),
    skills: rankedForFitReview(data.skillInferences, terms, 18).map((item) => ({
      id: item.id, skill: item.skill, group: item.group, strength: item.strength,
      evidenceSummary: completeScreeningText(item.evidenceSummary),
      experienceId: item.experienceId, projectId: item.projectId, confidence: item.confidence
    })),
    evidence: rankedForFitReview(data.evidenceCards, terms, 20).map((item) => ({
      id: item.id,
      title: item.title,
      externalFriendlyDescription: completeScreeningText(item.externalFriendlyDescription),
      evidenceStrength: item.evidenceStrength || "",
      relatedJdKeywords: (item.relatedJdKeywords || []).slice(0, 12),
      visibilityUse: item.visibilityUse || "CV Visible",
      allowedVisibleClaims: item.allowedVisibleClaims || [],
      forbiddenVisibleClaims: item.forbiddenVisibleClaims || [],
      blockedVisibleTerms: item.blockedVisibleTerms || [],
      tools: item.tools.slice(0, 10),
      experienceId: item.experienceId,
      projectId: item.projectId,
      confidence: item.confidence,
      safeMetrics: item.quantifiedEvidence && !item.confidentialityRisk ? completeScreeningText(item.quantifiedEvidence) : ""
    })),
    domainKnowledge: rankedForFitReview(data.domainKnowledge, terms, 12).map((item) => ({
      id: item.id, domain: item.domain, businessProcess: item.businessProcess,
      proofSummary: completeScreeningText(item.proof), cvWording: completeScreeningText(item.cvWording),
      systemsSummary: (item.systemsOrData || []).slice(0, 6),
      riskSummary: completeScreeningText(item.riskOrCompliance),
      experienceId: item.experienceId, projectId: item.projectId, confidence: item.confidence
    })),
    starStories: rankedForFitReview(data.starStories, terms, 8).map((item) => ({
      id: item.id, title: item.title, tags: item.tags.slice(0, 10),
      result: completeScreeningText(item.result),
      safeCvBullets: (item.cvBullets || []).slice(0, 3).map((bullet) => completeScreeningText(bullet)),
      evidenceIds: item.evidenceIds.slice(0, 8),
      experienceId: item.experienceId, projectId: item.projectId
    })),
    claimBoundaries: {
      profile: [completeScreeningText(data.careerProfile.claimBoundaries)].filter(Boolean),
      source: [completeScreeningText(data.sourceOfTruth.claimBoundaries)].filter(Boolean)
    }
  };
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value ?? null);
}

function contentHash(value: unknown) {
  const input = stableStringify(value);
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `h${(hash >>> 0).toString(36)}`;
}

const jsonOnlyContract = `STRICT MACHINE OUTPUT CONTRACT:
- Your entire response must be directly parseable by JSON.parse().
- Return raw JSON only.
- The first character of your response must be { and the last character must be }.
- Do not include markdown.
- Do not wrap the JSON in \`\`\`json or any code fence.
- Do not add explanations, headings, comments, notes, or follow-up questions.
- Do not add any preface such as "I will", "I can", "Here is", "Below is", or "我會".
- If you need to explain a warning, put it inside the JSON fields. Never write prose outside JSON.
- Use double quotes for all JSON keys and string values.
- Represent uncertainty with schema-valid values only: string "", array [], boolean false unless directly supported, and an explicit UNKNOWN or NOT_APPLICABLE enum where available.
- Never use "" or [] for boolean, number, or enum fields.`;

export function buildSourceParsingPrompt(data: AppData): string {
  const sources = data.rawSources
    .map((source) => `## ${source.title} (${source.kind})\n${source.content}`)
    .join("\n\n");

  return `${jsonOnlyContract}

You are a senior recruiter and career evidence analyst.
Organize the raw career material into a clean Source of Truth.

Rules:
- Use only facts supported by the raw material.
- Do not invent metrics, tools, titles, dates, or languages.
- Separate stable facts from claims that need review.
- Return ONLY valid JSON that follows the output contract above.

JSON schema:
{
  "careerProfile": {
    "identity": "",
    "targetRoles": [],
    "positioning": "",
    "education": [
      { "id": "edu-short-stable-id", "school": "", "degree": "", "period": "", "notes": "" }
    ],
    "certifications": [
      { "id": "cert-short-stable-id", "name": "", "issuer": "", "year": "" }
    ],
    "skillGroups": [
      { "id": "skill-short-stable-id", "name": "Power Platform / BI / Data / AI / Domain", "skills": [] }
    ],
    "workExperiences": [
      {
        "id": "exp-short-stable-id",
        "company": "",
        "role": "",
        "period": "",
        "location": "",
        "scope": "",
        "projects": [
          {
            "id": "proj-short-stable-id",
            "name": "",
            "period": "",
            "category": "",
            "tools": [],
            "summary": "",
            "metrics": "",
            "sourceIds": []
          }
        ]
      }
    ],
    "claimBoundaries": ""
  },
  "sourceOfTruth": {
    "identity": "",
    "targetRoles": "",
    "positioning": "",
    "workHistory": "",
    "tools": "",
    "metrics": "",
    "claimBoundaries": ""
  }
}

Raw material:
${sources || "(No source material saved yet.)"}

Remember: return raw JSON only. No markdown, no code fence, no prose.`;
}

export function buildSingleSourceSnapshotPrompt(source: RawSource): string {
  return `${jsonOnlyContract}

You are a senior recruiter and career evidence analyst.
Parse ONE raw career source into a compact source-level snapshot.

Goal:
- Do not build the full career backbone yet.
- Extract only source-grounded facts from this one source.
- Keep this compact enough to merge later with other parsed source snapshots.
- Preserve useful details that may become skills, evidence, domain knowledge, or STAR stories later.

Rules:
- Use only facts supported by this source.
- Do not invent metrics, tools, titles, dates, or languages.
- If a useful claim is incomplete, put it in claimBoundaries.
- Return ONLY valid JSON that follows the output contract above.

JSON schema:
{
  "sourceId": "${source.id}",
  "sourceTitle": "${source.title}",
  "sourceKind": "${source.kind}",
  "summary": "",
  "identityFacts": [],
  "workExperiences": [
    {
      "company": "",
      "role": "",
      "period": "",
      "location": "",
      "projects": [
        {
          "name": "",
          "period": "",
          "category": "",
          "tools": [],
          "summary": "",
          "metrics": [],
          "stakeholders": [],
          "systemsOrData": [],
          "risksOrCompliance": [],
          "evidenceSeeds": [],
          "starSeeds": []
        }
      ]
    }
  ],
  "skills": [],
  "domainSignals": [],
  "education": [],
  "certifications": [],
  "claimBoundaries": []
}

Raw source:
Title: ${source.title}
Kind: ${source.kind}
Source ID: ${source.id}

${source.content || "(Empty source.)"}

Remember: return raw JSON only. No markdown, no code fence, no prose.`;
}

export function buildBatchSourceSnapshotPrompt(sources: RawSource[]): string {
  const sourceInput = sources
    .map((source) => `## ${source.title} (${source.kind})
Source ID: ${source.id}

${source.content || "(Empty source.)"}`)
    .join("\n\n---\n\n");

  return `${jsonOnlyContract}

TASK: SOURCE SNAPSHOT ONLY.
You are a senior recruiter and career evidence analyst.
Parse MULTIPLE raw career sources into compact source-level snapshots.

Goal:
- Return one source snapshot per input source.
- Do not merge sources together.
- Do not build the full career backbone yet.
- Extract source-grounded facts that can later become skills, evidence, domain knowledge, or STAR stories.
- Keep each snapshot compact but information-rich.

Rules:
- The top-level JSON object MUST contain exactly one useful payload key: "sourceSnapshots".
- Do not return status, artifact, path, format, schema, counts, sourceIds, or claimBoundaries as top-level wrapper fields.
- Do not create or reference files, artifacts, downloads, paths, sandbox paths, or external citations.
- Do not use Python, code execution, tools, or file generation. This is a text-only JSON transformation task.
- Do not output careerProfile, sourceOfTruth, skillInferences, domainKnowledge, evidenceCards, starStories, or any career_backbone_inventory object.
- Use only facts supported by each individual source.
- Do not invent metrics, tools, titles, dates, or languages.
- If a useful claim is incomplete, put it in claimBoundaries.
- Every output item must keep the exact sourceId from the input.
- Return ONLY valid JSON that follows the output contract above.

JSON schema:
{
  "sourceSnapshots": [
    {
      "sourceId": "exact-source-id-from-input",
      "sourceTitle": "",
      "sourceKind": "",
      "summary": "",
      "identityFacts": [],
      "workExperiences": [
        {
          "company": "",
          "role": "",
          "period": "",
          "location": "",
          "projects": [
            {
              "name": "",
              "period": "",
              "category": "",
              "tools": [],
              "summary": "",
              "metrics": [],
              "stakeholders": [],
              "systemsOrData": [],
              "risksOrCompliance": [],
              "evidenceSeeds": [],
              "starSeeds": []
            }
          ]
        }
      ],
      "skills": [],
      "domainSignals": [],
      "education": [],
      "certifications": [],
      "claimBoundaries": []
    }
  ]
}

Raw sources:
${sourceInput || "(No sources need parsing.)"}

Final check before responding:
- First character must be {.
- Last character must be }.
- Top-level JSON must be { "sourceSnapshots": [...] }.
- If your response contains "artifact", "career_backbone", "skillInferences", or "evidenceCards", it is the wrong task.

Remember: return raw JSON only. No markdown, no code fence, no prose.`;
}

function backboneRunModeInstruction(runMode: BackboneRunMode): string {
  const instructions: Record<BackboneRunMode, string> = {
    source_of_truth_only: "Return metadata, careerProfile, sourceOfTruth, and updateSummary only. Establish stable experienceId, projectId, and sourceIds for every later run.",
    skills_only: "Return metadata, skillInferences, and updateSummary only. Use the existing careerProfile IDs exactly.",
    domain_only: "Return metadata, domainKnowledge, and updateSummary only. Cover business processes, stakeholders, systems/data, risks/compliance, and KPIs.",
    evidence_only: "Return metadata, evidenceCards, and updateSummary only. Build a comprehensive evidence inventory and assign evidenceTier to every card. When an existing evidence registry is provided, return only new or materially improved cards, prioritizing every projectId that has no existing card before adding depth to covered projects. Keep nextRecommendedRunMode as evidence_only until every careerProfile projectId has at least one evidence card.",
    star_only: "Return metadata, starStories, and updateSummary only. Apply the STAR Quality Gate and assign storyConfidence to every story.",
    high_compensation_only: "Return metadata, highCompensationSignals, and updateSummary only. Rank seniority and negotiation leverage without deleting or modifying Evidence Bank items.",
    update_merge: "Return metadata, every section changed by new source material, and updateSummary. Preserve existing IDs and omit unchanged full arrays when possible.",
    full_inventory: "Return the full schema only when the complete valid JSON will fit. If not, set partialOutput true and recommend source_of_truth_only."
  };
  return instructions[runMode];
}

function nextBackboneRunMode(runMode: BackboneRunMode): BackboneRunMode | "" {
  const next: Record<BackboneRunMode, BackboneRunMode | ""> = {
    source_of_truth_only: "skills_only",
    skills_only: "domain_only",
    domain_only: "evidence_only",
    evidence_only: "star_only",
    star_only: "high_compensation_only",
    high_compensation_only: "",
    update_merge: "",
    full_inventory: "source_of_truth_only"
  };
  return next[runMode];
}

export function buildProfileDeltaPrompt(data: AppData, changedSources: RawSource[]): string {
  const snapshots = changedSources
    .filter((source) => source.parsedSnapshot)
    .map((source) => ({
      sourceId: source.id,
      sourceTitle: source.title,
      parsedSnapshot: source.parsedSnapshot
    }));
  return `${jsonOnlyContract}

TASK: MERGE CAREER PROFILE STRUCTURE ONLY

You are maintaining a reusable career evidence database. Merge the changed source snapshots into the existing careerProfile and sourceOfTruth.

Rules:
- Return exactly { "careerProfile": {...}, "sourceOfTruth": {...} }.
- Preserve every existing experienceId and projectId when the same work already exists.
- Add a new experience/project only when the changed snapshot contains genuinely new work.
- Do not create portfolio-summary projects when the underlying projects already exist.
- Do not delete existing experiences or projects merely because they are absent from this delta.
- Merge sourceIds onto matching projects without removing existing sourceIds.
- Keep original titles, dates, employers, education, certifications, and claim boundaries truthful.
- Generalize company-only wording in summaries, but keep raw facts and IDs intact.
- Do not return skills, domainKnowledge, evidenceCards, starStories, metadata, explanations, or markdown.

Existing careerProfile:
${JSON.stringify(data.careerProfile, null, 2)}

Existing sourceOfTruth:
${JSON.stringify(data.sourceOfTruth, null, 2)}

Changed source snapshots:
${JSON.stringify(snapshots, null, 2)}

Return the merged careerProfile and sourceOfTruth now.`;
}

export function buildCareerBackbonePrompt(data: AppData, runMode: BackboneRunMode = "source_of_truth_only"): string {
  const parsedSources = data.rawSources.filter((source) => source.parsedSnapshot && source.parsedSnapshot.sourceContentHash === contentHash(source.content));
  const unparsedSources = data.rawSources.filter((source) => !source.parsedSnapshot || source.parsedSnapshot.sourceContentHash !== contentHash(source.content));
  const sourceInput = parsedSources.length
    ? parsedSources
      .map((source) => `## ${source.title} (${source.kind})\nSource ID: ${source.id}\nParsed snapshot:\n${JSON.stringify(source.parsedSnapshot, null, 2)}`)
      .join("\n\n")
    : data.rawSources
      .map((source) => `## ${source.title} (${source.kind})\nSource ID: ${source.id}\n${source.content}`)
      .join("\n\n");

  const evidenceRegistry = data.evidenceCards.map((card) => ({
    id: card.id,
    title: card.title,
    experienceId: card.experienceId,
    projectId: card.projectId,
    evidenceTier: card.evidenceTier,
    proof: card.proof,
    metrics: card.metrics,
    cvBullet: card.cvBullet,
    sourceIds: card.sourceIds
  }));
  const existingBackbone = runMode === "source_of_truth_only"
    ? { careerProfile: data.careerProfile, sourceOfTruth: data.sourceOfTruth }
    : runMode === "skills_only"
      ? { careerProfile: data.careerProfile, skillInferences: data.skillInferences }
      : runMode === "domain_only"
        ? { careerProfile: data.careerProfile, skillInferences: data.skillInferences, domainKnowledge: data.domainKnowledge, evidenceCards: evidenceRegistry }
        : runMode === "evidence_only"
          ? { careerProfile: data.careerProfile, skillInferences: data.skillInferences, evidenceCards: evidenceRegistry }
          : runMode === "star_only"
            ? { careerProfile: data.careerProfile, evidenceCards: evidenceRegistry, starStories: data.starStories }
            : runMode === "high_compensation_only"
              ? { careerProfile: data.careerProfile, skillInferences: data.skillInferences, domainKnowledge: data.domainKnowledge, evidenceCards: evidenceRegistry, highCompensationSignals: data.highCompensationSignals }
              : {
                  careerProfile: data.careerProfile,
                  sourceOfTruth: data.sourceOfTruth,
                  skillInferences: data.skillInferences,
                  domainKnowledge: data.domainKnowledge,
                  evidenceCards: data.evidenceCards,
                  starStories: data.starStories,
                  highCompensationSignals: data.highCompensationSignals
                };
  const coveredEvidenceProjectIds = new Set(data.evidenceCards.map((card) => card.projectId).filter(Boolean));
  const evidenceCoverageComplete = data.careerProfile.workExperiences
    .flatMap((experience) => experience.projects)
    .every((project) => coveredEvidenceProjectIds.has(project.id));
  const expectedNextRunMode = runMode === "evidence_only" && !evidenceCoverageComplete
    ? "evidence_only"
    : nextBackboneRunMode(runMode);

  return `${jsonOnlyContract}

Prompt identity: 01_MASTER_CAREER_INVENTORY_PROMPT
Prompt version: career-backbone-v2-credible-evidence

Run configuration:
{
  "runMode": "${runMode}",
  "inputType": "${runMode === "update_merge" ? "existing_backbone_plus_new_sources" : "new_build"}",
  "outputPriority": "valid_json_first",
  "preserveExistingIds": true
}

Execution Mode:
- Allowed runMode values: source_of_truth_only, skills_only, domain_only, evidence_only, star_only, high_compensation_only, update_merge, full_inventory.
- Current runMode is "${runMode}".
- Set metadata.runMode to "${runMode}" and metadata.nextRecommendedRunMode to "${expectedNextRunMode}".
- ${backboneRunModeInstruction(runMode)}
- Return only the sections required by this runMode. Do not return empty arrays for sections owned by another runMode.
- If expected output is too large, prioritize valid JSON, set metadata.partialOutput to true, and set metadata.nextRecommendedRunMode.

You are a senior recruiter, career evidence analyst, ATS strategist, and resume writing editor.
Build or update one consistent career backbone from parsed source snapshots.

Goal:
- Build a comprehensive, reusable career evidence database. This is an inventory workflow, not final resume selection.
- Do not optimize for a single JD yet. Preserve distinct hiring signals that can support different JD versions.
- Create the shared hierarchy first: work experience -> projects -> skills -> evidence -> STAR stories.
- Also infer domainKnowledge from each project: business domain, workflow/process knowledge, stakeholders, systems/data, risks, KPIs, and reusable CV wording.
- Keep all IDs stable and reused across the whole JSON.
- Source of Truth, Skill Map, Evidence Bank, and STAR Story Bank must all point to the same experienceId/projectId/sourceIds.
- Domain Knowledge Map must also point to the same experienceId/projectId/sourceIds.
- Build a comprehensive, reusable career evidence database for many future JD tailoring runs. Do not tailor or filter this first inventory for one target role.
- Treat raw snapshots as the verbatim archive. Preserve all grounded career signals in the backbone, while giving each item an externally understandable title and CV wording.
- The first output must be substantially richer than a final CV. Later JD workflows will select from it; this step must not pre-filter useful material.
- Preserve enough grounded breadth to compete for future roles. Credibility classification must organize evidence, not make the inventory artificially small.

Rules:
- Use only facts supported by the raw material.
- Do not invent metrics, tools, dates, titles, or languages.
- If a claim is useful but not fully supported, mark confidence as "Needs Review".
- Do not create exaggerated CV marketing copy. Create grounded, externally understandable source data.
- Consolidate only true duplicates that describe the same action, scope, stakeholder, metric, and outcome. Do not merge distinct work merely because it uses the same tool.
- Preserve grounded implementation details in proof/source linkage. A dashboard's pages, a workflow's screens, or configuration fields do not each require a separate card, but they must not be discarded when they demonstrate complexity, ownership, scale, or technical depth.
- Generalize internal system, team, tracker, wiki, queue, and project code names into plain business language unless the name is a recognized external product or is essential evidence.
- Keep useful internal specifics inside proof or source linkage only. Titles, summaries, cvBullet, cvWording, and STAR titles must make sense to an external recruiter with no company context.
- Prefer wording such as "enterprise AI assistant", "knowledge-base synchronization workflow", or "regional recruiting analytics dashboard" over unexplained internal names.
- Express implementation details through business scope, ownership, technical approach, metric, risk, or outcome. Preserve other grounded details in proof/source context instead of deleting them.
- Do not produce only the most obvious skills; infer distinct technical capabilities from each project.
- Do not produce only a "top skills" or "top evidence" list.
- Do not merge different stakeholder groups, business workflows, system/data contexts, risk areas, or KPIs into one broad domain item.
- Preserve weaker but useful facts as "Needs Review" instead of dropping them.
- Preserve breadth: separate platform build, workflow automation, data/BI, API integration, governance, testing/UAT, stakeholder/process work, documentation/training, and support/operations when supported.
- Preserve domain breadth: customer support operations, HR / employee lifecycle, learning operations, privacy / governance, AI chatbot operations, BI adoption, workflow approval processes, regional reporting, vendor/platform administration, and security/permission boundaries when supported.
- This is an inventory step, not a ranking step. Do not remove evidence because it seems less relevant, older, less impressive, or unrelated to the candidate's current target role.
- Keep separate cards whenever they represent different actions, technical approaches, stakeholders, business processes, metrics, risks, outcomes, or interview examples.
- Create separate STAR stories only for distinct business problems with a meaningful action and result.
- Do not merge projects merely because they use the same tool or artifact type. Separate dashboards, automations, or integrations when they serve different stakeholders, business decisions, KPIs, risks, or outcomes.
- Dashboard coverage must preserve distinct hiring stories when supported: recruiting analytics, onboarding/learning analytics, payroll validation, AI quality reporting, adoption/licensing analytics, retail performance, and scientific visualization are different business problems.
- Return ONLY valid JSON that follows the output contract above.
- If parsed snapshots are available, use them as the primary input and do not ask for raw source again.
- If some sources are not parsed yet, ignore them unless their raw content is explicitly included below.

Coverage requirements for first-pass inventory (minimum guidance, not maximum limits):
- For every grounded project, create enough evidenceCards to preserve every distinct hiring signal; usually at least 2-6 for a substantial project and 1 for a smaller project.
- For every project with supported situation, action, and result, create 1-3 STAR stories. Omit STAR only when the source genuinely lacks an action or outcome.
- For every grounded project, create enough skillInferences to cover all demonstrated capabilities; usually at least 3-8 for a substantial project.
- For every grounded project, create enough domainKnowledge items to preserve its business process, stakeholders, systems/data, risks/compliance, and KPIs; usually at least 1-4.
- A rich full career may legitimately produce 40-100+ skillInferences, 20-60+ domainKnowledge items, 60-150+ evidenceCards, and 20-60+ STAR stories. Do not stop at these numbers if grounded distinct material remains.
- Maintain work-history coverage: every work experience with at least one strong result-bearing evidence item should receive at least 1 STAR story.
- Do not let the newest employer dominate the STAR bank. Unless older roles have no usable action/result evidence, no single work experience should represent more than about 70% of all STAR stories.
- Include non-chatbot stories when supported, such as BI/data delivery, API integration, HR/process automation, governance, migration, stakeholder coordination, training, scientific/life-science work, and operational improvement.
- Use "Needs Review" only for strategically useful claims that can realistically be verified later. Do not inflate the bank with weak fragments.

Evidence Tier Rules:
- Core: strong recruiter-facing evidence with candidate ownership plus a defensible outcome, meaningful responsibility scope, business value, technical complexity, risk reduction, decision value, production accountability, or cross-functional influence. Core must be suitable for a visible CV after tailoring.
- Supporting: grounded technical method, process contribution, or delivery detail that strengthens a Core claim but is not strong enough to stand alone as a headline CV bullet.
- Archive: internal activity detail, configuration/version history, test setting, score dump, inventory/page/field count, company-only terminology, minor support task, or traceability detail that should remain available for interviews but normally stay out of a CV.
- Do not delete grounded details because they are not headline material. Preserve them as Supporting or Archive.
- A substantial project may have several Supporting cards around one or more Core hiring signals. Keep those supporting methods, stakeholders, tools, and delivery details so later CV generation can synthesize a convincing achievement without inventing content.
- A number alone does not make evidence Core. Benchmark percentages, sample sizes, version numbers, dates, ticket/change counts, component counts, reviewer counts, record checks, and dashboard page counts are Archive or Supporting unless they prove attributable business impact or meaningful ownership scope.
- Write Core and Supporting titles/cvBullet in language an external recruiter understands. Keep company-only project names and raw technical details in proof/source linkage.
- For each evidenceCard, separate raw proof from application wording:
  - proof = source-grounded internal traceability.
  - cvBullet = candidate-facing resume bullet draft.
  - cvSafeBullet = safer external wording for use in generated CVs.
  - interviewTalkingPoint = how the candidate can explain the evidence in an interview.
  - riskIfUsedWrongly = what would sound inflated, too internal, or unsupported if copied directly.
  - claimLevel = how strongly this evidence can be used in visible CV text.
  - allowedVisibleClaims = exact safe visible phrases this evidence supports.
  - forbiddenVisibleClaims = tempting but unsupported phrases that must not appear in the CV.

Skill Credibility Rules:
- Strong: repeated or end-to-end demonstrated ownership with direct project evidence, such as designed, built, integrated, governed, productionized, or led.
- Moderate: practical hands-on use in a real project, such as tested, maintained, configured, analyzed, or implemented with clear context.
- Mentioned: read, reviewed, assisted, observed, trained on, or referenced without enough evidence of independent practical delivery.
- Mark confidence Grounded only when sourceIds and evidenceSummary directly support the claimed usageContext. Otherwise use Needs Review or Weak.
- Do not upgrade a skill because it is marketable, appears in a target JD, or is adjacent to a tool the candidate used.
- cvWording must match demonstrated depth. Never write expert, advanced, architected, led, or owned when evidence supports only used, tested, maintained, reviewed, or mentioned.

STAR Quality Gate:
- Create a STAR story only when all four parts are supported: clear Situation, candidate-owned Task, specific Action, and meaningful Result.
- Do not create STAR stories from simple participation, documentation-only work, or minor support unless there is a meaningful result.
- Assign storyConfidence: Strong, Usable, or Needs Review. Use Needs Review when the story is useful but its result is weak or incomplete.
- Strong STAR requires a defensible business result, risk reduction, decision value, adoption/operational outcome, or meaningful responsibility scope. Test settings and internal activity counts are not results.
- Usable STAR may have a qualitative but grounded result. Needs Review STAR must not be recommended as a visible CV achievement until verified.

High Compensation Signal Rules:
- Do not create a compensation signal from every evidence card. This is a decision layer above the complete Evidence Bank.
- Prioritize enterprise/cross-region scope, production ownership, measurable impact, manual-work replacement, governance/risk reduction, executive decision support, architecture complexity, cost/license/ROI impact, and security/permission boundaries.
- Mark low leverage as Low instead of deleting grounded evidence. Use only real supporting IDs and do not exaggerate.

Update / Merge Mode:
- When existing backbone JSON is provided, preserve all existing IDs unless an item is clearly duplicated, incorrect, or obsolete.
- Expand an existing item when new source material adds detail to the same project; create a new item only for a distinct action, stakeholder, system/data context, KPI, risk, or outcome.
- Never silently overwrite conflicting metrics, dates, tools, titles, or scope. Preserve the conflict in claimBoundaries and updateSummary.conflicts.
- Report added, modified, unchanged, possible duplicate, conflict, review, and ID-change information in updateSummary.

JSON schema:
{
  "metadata": {
    "runMode": "",
    "partialOutput": false,
    "nextRecommendedRunMode": "",
    "outputScope": "",
    "warnings": []
  },
  "careerProfile": {
    "identity": "",
    "targetRoles": [],
    "positioning": "",
    "education": [
      { "id": "edu-short-stable-id", "school": "", "degree": "", "period": "", "notes": "" }
    ],
    "certifications": [
      { "id": "cert-short-stable-id", "name": "", "issuer": "", "year": "" }
    ],
    "skillGroups": [
      { "id": "skill-group-short-stable-id", "name": "Power Platform / BI / Data / AI / Domain", "skills": [] }
    ],
    "workExperiences": [
      {
        "id": "exp-short-stable-id",
        "company": "",
        "role": "",
        "period": "",
        "location": "",
        "scope": "",
        "projects": [
          {
            "id": "proj-short-stable-id",
            "name": "",
            "period": "",
            "category": "",
            "tools": [],
            "summary": "",
            "metrics": "",
            "sourceIds": []
          }
        ]
      }
    ],
    "claimBoundaries": ""
  },
  "sourceOfTruth": {
    "identity": "",
    "targetRoles": "",
    "positioning": "",
    "workHistory": "",
    "tools": "",
    "metrics": "",
    "claimBoundaries": ""
  },
  "skillInferences": [
    {
      "id": "skill-short-stable-id",
      "group": "Power Platform / BI & Analytics / AI & Automation / API Integration / Governance / Domain",
      "skill": "",
      "strength": "Strong|Moderate|Mentioned",
      "usageContext": "owned|built|integrated|governed|tested|maintained|used|mentioned",
      "evidenceSummary": "",
      "cvWording": "",
      "experienceId": "",
      "projectId": "",
      "sourceIds": [],
      "confidence": "Grounded|Needs Review|Weak"
    }
  ],
  "domainKnowledge": [
    {
      "id": "domain-short-stable-id",
      "domain": "Customer Support Operations / HR Operations / Learning Operations / Governance / BI Adoption / AI Operations / Security & Access / Business Process Automation",
      "businessProcess": "",
      "stakeholders": [],
      "systemsOrData": [],
      "riskOrCompliance": "",
      "metricsOrKpis": [],
      "proof": "",
      "cvWording": "",
      "experienceId": "",
      "projectId": "",
      "sourceIds": [],
      "confidence": "Grounded|Needs Review|Weak"
    }
  ],
  "evidenceCards": [
    {
      "id": "evi-short-stable-id",
      "title": "",
      "category": "",
      "sectionTitle": "",
      "experienceId": "",
      "projectId": "",
      "tools": [],
      "proof": "",
      "cvBullet": "",
      "cvSafeBullet": "",
      "interviewTalkingPoint": "",
      "riskIfUsedWrongly": "",
      "claimLevel": "Direct Claim|Conservative Claim|Interview Only|Do Not Claim",
      "allowedVisibleClaims": [],
      "forbiddenVisibleClaims": [],
      "metrics": "",
      "evidenceTier": "Core | Supporting | Archive",
      "sourceIds": [],
      "confidence": "Grounded|Needs Review|Weak"
    }
  ],
  "starStories": [
    {
      "id": "star-short-stable-id",
      "title": "",
      "tags": [],
      "sectionTitle": "",
      "experienceId": "",
      "projectId": "",
      "situation": "",
      "task": "",
      "action": "",
      "result": "",
      "storyConfidence": "Strong | Usable | Needs Review",
      "cvBullets": [],
      "evidenceIds": []
    }
  ],
  "highCompensationSignals": [
    {
      "id": "comp-short-stable-id",
      "signalType": "Enterprise Scope | Production Ownership | AI/Data Architecture | Governance/Risk | Executive Decision Support | Automation Impact | Cross-Region Influence | Platform Ownership | Cost/License Impact | Security/Permission Boundary",
      "strength": "High | Medium | Low",
      "whyItMattersToRecruiters": "",
      "bestTargetRoles": [],
      "supportingEvidenceIds": [],
      "supportingProjectIds": [],
      "supportingSkillIds": [],
      "cvPositioning": "",
      "interviewPositioning": "",
      "salaryNegotiationUse": "",
      "confidence": "Grounded | Needs Review | Weak"
    }
  ],
  "updateSummary": {
    "mode": "new_build | update_merge",
    "addedItems": [],
    "modifiedItems": [],
    "unchangedItems": [],
    "possibleDuplicates": [],
    "conflicts": [],
    "needsReview": [],
    "idChanges": []
  }
}

Source input:
${sourceInput || "(No source material saved yet.)"}

Existing Career Backbone (dependency context and ID registry; do not echo unrelated sections):
${JSON.stringify(existingBackbone, null, 2)}

Unparsed source IDs not included in detail:
${unparsedSources.map((source) => `${source.id}: ${source.title}`).join("\n") || "(none)"}

Remember: return raw JSON only. No markdown, no code fence, no prose.`;
}

export const PROJECT_BACKBONE_PROMPT_VERSION = PROJECT_BACKBONE_TASK_PROMPT_VERSION;

export function buildProjectBackboneDeltaPrompt(taskInput: ProjectBackboneTaskInput | null, inputHash: string): string {
  if (!taskInput) return "";
  const experienceId = String(taskInput.experience.id || "");
  const projectId = String(taskInput.project.id || "");
  return `${jsonOnlyContract}

TASK: Compile one rich, evidence-grounded project delta for a reusable career database.
Act as a senior executive recruiter and career-evidence architect. Preserve real breadth so later JD tailoring can choose from a deep inventory. Do not prematurely filter useful capabilities. Do not promote implementation trivia, internal names, test settings, dates, sample sizes, version numbers, or dashboard page counts into achievements.

MARKET LANGUAGE POLICY:
- Translate internal terminology into recruiter-readable capability language.
- Treat FIN AI as an internal chatbot name. Never place it in skill names, domain/business-process labels, evidence titles, STAR titles, cvWording, cvBullet, positioning, or final CV content. Rewrite it as the supported business function, such as enterprise customer-service AI chatbot operations, chatbot evaluation, knowledge-base automation, or production support. Preserve the original name only in raw proof/source linkage when traceability requires it.
- Use current market terms such as evaluation pipelines, agent evaluation, reproducible testing, production quality gates, regression detection, failure-mode analysis, scalable feedback loops, governance controls, cross-functional delivery, and decision support only when the supplied source proves that capability.
- Never add a JD keyword, tool, ownership level, metric, or research claim merely because it is marketable.
- Treat a number as impact only when it proves business outcome, risk reduction, decision value, adoption, quality, efficiency, revenue/cost, or meaningful operating scope. Otherwise retain it only in proof or reviewItems.

RICHNESS TARGET FOR A SUBSTANTIAL PROJECT:
- 4-8 distinct skillInferences across demonstrated technical, analytical, delivery, and governance capabilities.
- 1-4 domainKnowledge records covering process, stakeholders, systems/data, KPI, or risk context.
- 2-6 evidenceCards representing distinct hiring signals, not UI pages, fields, sub-flows, or internal artifacts.
- 1-3 starStories only when situation, task, action, and result are supported. Never manufacture a story to meet a count.
- Put unresolved claims in reviewItems. Rich does not mean repetitive.

CLASSIFICATION:
- Skill Strong = repeatedly owned/built/integrated/governed with direct proof; Moderate = demonstrated in a bounded context; Mentioned = exposure only.
- Evidence Core = differentiated outcome/ownership; Supporting = credible technical/process depth; Archive = true but too internal, weak, or task-level for visible CV use.
- Grounded requires direct projectId and sourceIds linkage.
- STAR Strong requires a supported result; Usable may have a qualitative result; Needs Review if any element is incomplete.
- Reuse an existing ID for materially identical records; otherwise create stable skill-, domain-, evidence-, or star- IDs.

OUTPUT SCHEMA:
{
  "task":{"experienceId":${JSON.stringify(experienceId)},"projectId":${JSON.stringify(projectId)},"inputHash":${JSON.stringify(inputHash)},"promptVersion":${JSON.stringify(PROJECT_BACKBONE_PROMPT_VERSION)}},
  "skillInferences":[{"id":"","group":"","skill":"","strength":"Strong|Moderate|Mentioned","usageContext":"owned|built|integrated|governed|tested|maintained|used|mentioned","evidenceSummary":"","cvWording":"","experienceId":${JSON.stringify(experienceId)},"projectId":${JSON.stringify(projectId)},"sourceIds":[],"confidence":"Grounded|Needs Review|Weak"}],
  "domainKnowledge":[{"id":"","domain":"","businessProcess":"","stakeholders":[],"systemsOrData":[],"riskOrCompliance":"","metricsOrKpis":[],"proof":"","cvWording":"","experienceId":${JSON.stringify(experienceId)},"projectId":${JSON.stringify(projectId)},"sourceIds":[],"confidence":"Grounded|Needs Review|Weak"}],
  "evidenceCards":[{"id":"","title":"","category":"","sectionTitle":"","tools":[],"proof":"","cvBullet":"","metrics":"","sourceIds":[],"experienceId":${JSON.stringify(experienceId)},"projectId":${JSON.stringify(projectId)},"confidence":"Grounded|Needs Review|Weak","evidenceTier":"Core|Supporting|Archive"}],
  "starStories":[{"id":"","title":"","tags":[],"sectionTitle":"","situation":"","task":"","action":"","result":"","cvBullets":[],"evidenceIds":[],"experienceId":${JSON.stringify(experienceId)},"projectId":${JSON.stringify(projectId)},"storyConfidence":"Strong|Usable|Needs Review"}],
  "reviewItems":[]
}

VALIDATION:
- Every record must use experienceId ${experienceId} and projectId ${projectId}.
- Every Grounded record must cite at least one supplied sourceId.
- Return empty arrays when a record type is genuinely unsupported and explain the gap in reviewItems.
- This response replaces only this project's classifications. Do not return careerProfile, sourceOfTruth, metadata, updateSummary, or another project.

PROJECT TASK INPUT:
${JSON.stringify(taskInput)}`;
}

export function buildEvidencePrompt(data: AppData, careerProfile = data.careerProfile, coverageOnly = false, evidenceTask?: EvidenceTask): string {
  return `${jsonOnlyContract}

You are a senior CV strategist.
Convert this hierarchical career profile into reusable evidence cards.

Rules:
- Use only grounded facts.
- Each evidence card must connect tools, scope, proof, and metrics.
- Use the Skill Inference map to attach the right technical capability context.
- Keep evidence tied to the correct work experience or project.
- Add a CV-ready sectionTitle that matches formal CV subsections, e.g. "Enterprise Data Analytics & Power BI Architecture", "Power Platform Development, Governance & Automation", "AI Agent Strategy & Workflow Orchestration".
- Add cvBullet as one clean resume bullet without a leading dash or bullet symbol.
- Add cvSafeBullet as the safer external version to use in actual CV generation. It must avoid internal proof notes, unexplained internal names, and overclaims.
- Add interviewTalkingPoint as a concise explanation the candidate can defend live.
- Add riskIfUsedWrongly to warn what not to claim or paste into the CV.
- Add claimLevel to control how safely the evidence can appear in a CV.
- Add allowedVisibleClaims as short phrases that are safe to place in visible CV text.
- Add forbiddenVisibleClaims for tempting but unsupported/overstated phrases, internal names, score dumps, or claims that should never appear in visible CV text.
- Return ONLY valid JSON that follows the output contract below.
- When an Evidence task envelope is supplied, echo its task object unchanged. It is an identity check, not a claim source.
- If this input is a partial batch, return evidenceCards for this batch only. Do not mention missing projects from other batches.
- Maintain project coverage before depth: create at least one useful evidence card for every meaningful project in this batch before creating additional cards for the same project.
- Do not let the newest employer dominate the Evidence Bank when earlier roles contain distinct technical, stakeholder, industry, training, research, or delivery signals.
- Keep different dashboard, integration, automation, governance, training, and operations outcomes separate when they demonstrate different hiring capabilities.
- Avoid recreating an existing card with slightly different wording. Add a new card only for a distinct scope, action, metric, stakeholder, risk, or outcome.
- Assign evidenceTier to every card: Core for headline recruiter value, Supporting for useful project depth, Archive for grounded traceability or niche tailoring.
- Never delete grounded details solely because they are Supporting or Archive.
${coverageOnly ? `
Coverage repair mode:
- Return exactly one evidence card for each project in the Career profile below.
- Do not add second or third cards for any project in this response.
- Keep proof and cvBullet concise and externally understandable.
- Return no more than ${careerProfile.workExperiences.reduce((count, experience) => count + experience.projects.length, 0)} evidenceCards.
- This response is merged into the existing bank. Do not repeat cards from Existing evidence inventory.
` : ""}

Schema for each card:
{
  "title": "",
  "category": "",
  "sectionTitle": "",
  "experienceId": "",
  "projectId": "",
  "tools": [],
  "proof": "",
  "cvBullet": "",
  "cvSafeBullet": "",
  "interviewTalkingPoint": "",
  "riskIfUsedWrongly": "",
  "claimLevel": "Direct Claim | Conservative Claim | Interview Only | Do Not Claim",
  "allowedVisibleClaims": [],
  "forbiddenVisibleClaims": [],
  "metrics": "",
  "evidenceTier": "Core | Supporting | Archive",
  "sourceIds": [],
  "confidence": "Grounded"
}

Career profile:
${JSON.stringify(careerProfile, null, 2)}

Skill inference map:
${JSON.stringify(data.skillInferences, null, 2)}

Legacy source summary:
${JSON.stringify(data.sourceOfTruth, null, 2)}

Existing evidence inventory (use this to fill coverage gaps and avoid duplicates):
${JSON.stringify(data.evidenceCards.map((card) => ({ id: card.id, title: card.title, experienceId: card.experienceId, projectId: card.projectId })), null, 2)}

Evidence task envelope (echo unchanged when present):
${JSON.stringify(evidenceTask?.task || null, null, 2)}

Required output:
${evidenceTask ? '{"task": {"taskId":"","inputHash":"","promptVersion":"","expectedExperienceId":"","expectedProjectIds":[]}, "evidenceCards":[...]}' : '{"evidenceCards":[...]}'}

Remember: return raw JSON only. No markdown, no code fence, no prose.`;
}

export function buildDomainKnowledgePrompt(data: AppData): string {
  return `${jsonOnlyContract}

You are a senior domain recruiter and business process analyst.
Infer the candidate's domain knowledge from the structured career profile, project history, skill map, and evidence.

Goal:
- Create a reusable Domain Knowledge Map for JD tailoring.
- Focus on business context, users, workflow/process understanding, operating model, risk, compliance, KPI, and domain vocabulary.
- Do not list generic technical tools unless they explain domain context.

Rules:
- Use only grounded project/work evidence.
- Do not invent industries, compliance ownership, KPIs, stakeholders, or business processes.
- Distinguish domain knowledge from technical capability.
- Every item must point to experienceId/projectId/sourceIds when available.
- Write cvWording as natural resume language that can be merged into Summary or Work Experience.
- Return ONLY valid JSON that follows the output contract above: {"domainKnowledge":[...]}.

Schema for each item:
{
  "id": "domain-short-stable-id",
  "domain": "Customer Support Operations / HR Operations / Learning Operations / Governance / BI Adoption / AI Operations / Security & Access / Business Process Automation",
  "businessProcess": "",
  "stakeholders": [],
  "systemsOrData": [],
  "riskOrCompliance": "",
  "metricsOrKpis": [],
  "proof": "",
  "cvWording": "",
  "experienceId": "",
  "projectId": "",
  "sourceIds": [],
  "confidence": "Grounded|Needs Review|Weak"
}

Career profile:
${JSON.stringify(data.careerProfile, null, 2)}

Skill inference map:
${JSON.stringify(data.skillInferences, null, 2)}

Evidence:
${JSON.stringify(data.evidenceCards, null, 2)}

Remember: return raw JSON only. No markdown, no code fence, no prose.`;
}

export function buildSkillInferencePrompt(data: AppData): string {
  return `${jsonOnlyContract}

You are a senior technical recruiter and skills taxonomy analyst.
Infer the candidate's technical capabilities from the structured career profile and project history.

Rules:
- Use only grounded project/work evidence.
- Do not inflate a tool mention into a core skill.
- Distinguish capability level:
  - Strong: owned, built, led, governed, or repeatedly delivered with this skill.
  - Moderate: used or integrated in a meaningful project.
  - Mentioned: appears in source but depth is unclear.
- Capture usage context: owned, built, integrated, governed, tested, maintained, used, mentioned.
- Every inferred skill must point to experienceId/projectId/sourceIds when available.
- Write cvWording as a natural phrase that can be used in Skills or Work Experience.
- Return ONLY valid JSON that follows the output contract above: {"skillInferences":[...]}.

Schema for each skill:
{
  "id": "skill-short-stable-id",
  "group": "Power Platform / BI & Analytics / AI & Automation / API Integration / Governance / Domain",
  "skill": "",
  "strength": "Strong|Moderate|Mentioned",
  "usageContext": "owned|built|integrated|governed|tested|maintained|used|mentioned",
  "evidenceSummary": "",
  "cvWording": "",
  "experienceId": "",
  "projectId": "",
  "sourceIds": [],
  "confidence": "Grounded|Needs Review|Weak"
}

Career profile:
${JSON.stringify(data.careerProfile, null, 2)}

Legacy source summary:
${JSON.stringify(data.sourceOfTruth, null, 2)}

Remember: return raw JSON only. No markdown, no code fence, no prose.`;
}

export function buildStarPrompt(data: AppData, evidenceCards = data.evidenceCards): string {
  return `${jsonOnlyContract}

You are a senior interview coach.
Create reusable STAR stories from these evidence cards.

Rules:
- Use only evidence below.
- No fake metrics.
- Keep the full STAR story for interview use.
- Add cvBullets with 1-2 clean resume bullets extracted from Action + Result. Do not include leading dash or bullet symbols.
- Add sectionTitle so the CV builder knows which formal CV subsection should receive the bullet.
- Prioritize evidence from work experiences that currently have no STAR coverage.
- Preserve career breadth. Do not create only chatbot or AI stories when the evidence includes BI/data, workflow automation, HR/process, governance, migration, stakeholder, training, scientific, or operations outcomes.
- For each experienceId represented in this batch with a meaningful Action and Result, create at least one story before creating multiple stories for the same project.
- A STAR story may combine multiple evidence cards only when they describe the same business problem, stakeholder group, KPI, and outcome.
- Keep distinct dashboard stories separate when their users or decisions differ. For example, recruiting pipeline analytics, onboarding completion, payroll validation, AI answer-quality reporting, Copilot adoption, and retail sales dashboards must not be collapsed into one generic "dashboard delivery" story.
- Prefer one specific, interview-ready problem and outcome over broad wording such as "delivered full-lifecycle dashboards".
- Apply the STAR Quality Gate: require a clear business Situation, candidate-owned Task, specific Action, and meaningful Result.
- Assign storyConfidence as Strong, Usable, or Needs Review. Use Needs Review when the Result is weak or incomplete.
- Return ONLY valid JSON that follows the output contract above: {"starStories":[...]}.
- If this input is a partial evidence batch, return STAR stories for this batch only. Do not mention evidence from other batches.

Schema for each story:
{
  "title": "",
  "tags": [],
  "sectionTitle": "",
  "experienceId": "",
  "projectId": "",
  "situation": "",
  "task": "",
  "action": "",
  "result": "",
  "storyConfidence": "Strong | Usable | Needs Review",
  "cvBullets": [],
  "evidenceIds": []
}

Evidence:
${JSON.stringify(evidenceCards, null, 2)}

Existing STAR stories (avoid exact duplicates; replace over-broad coverage with more specific candidates when evidence supports it):
${JSON.stringify(data.starStories.map((story) => ({ id: story.id, title: story.title, experienceId: story.experienceId, projectId: story.projectId, evidenceIds: story.evidenceIds })), null, 2)}

Remember: return raw JSON only. No markdown, no code fence, no prose.`;
}

export type JDParseInputValidation = {
  ok: boolean;
  reason: string;
};

const JD_PARSE_MAX_INPUT_CHARS = 120_000;
const JD_APPLICATION_STATE_HARD_MARKERS = [
  "themeOptions",
  "customTheme",
  "__NEXT_DATA__",
  "__INITIAL_STATE__",
  "buttonPrimaryColor",
  "checkboxCheckedColor"
];
const JD_APPLICATION_STATE_SOFT_MARKERS = [
  "navigationConfig",
  "localizationBundle",
  "analyticsConfig",
  "featureFlags"
];

export function validateJDParseInput(rawJD: string): JDParseInputValidation {
  const value = String(rawJD || "").trim();
  if (!value) return { ok: false, reason: "Full raw JD is empty. Fetch again or paste the job description manually." };
  if (value.length > JD_PARSE_MAX_INPUT_CHARS) {
    return { ok: false, reason: "Full raw JD is too large to copy safely. Fetch again or paste the readable job description manually." };
  }
  const marker = JD_APPLICATION_STATE_HARD_MARKERS.find((candidate) => value.toLowerCase().includes(candidate.toLowerCase()));
  if (marker) {
    return { ok: false, reason: `Full raw JD contains website application-state data (${marker}). Fetch again or use Manual Paste.` };
  }
  const softMarkers = JD_APPLICATION_STATE_SOFT_MARKERS.filter((candidate) => value.toLowerCase().includes(candidate.toLowerCase()));
  if (softMarkers.length >= 2) {
    return { ok: false, reason: `Full raw JD contains website configuration data (${softMarkers.join(", ")}). Fetch again or use Manual Paste.` };
  }
  if (/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\s*\|\s*Microsoft Careers/i.test(value)) {
    return { ok: false, reason: "Full raw JD contains a Microsoft Careers page identifier. Fetch again or use Manual Paste." };
  }
  const first = value[0];
  const jsonPunctuation = (value.match(/[{}[\]":,]/g) || []).length / value.length;
  const quotedKeys = (value.match(/"[^"\n]{1,80}"\s*:/g) || []).length;
  if ((first === "{" || first === "[") && jsonPunctuation > 0.08 && quotedKeys >= 3) {
    return { ok: false, reason: "Full raw JD appears to be serialized website state, not readable job content." };
  }
  const words = value.match(/[A-Za-z][A-Za-z0-9+#.-]{2,}/g) || [];
  if (value.length < 80 || words.length < 12) {
    return { ok: false, reason: "Full raw JD does not contain enough recognizable job content." };
  }
  return { ok: true, reason: "" };
}

export function buildJDParsePrompt(rawJD: string): string {
  if (!validateJDParseInput(rawJD).ok) return "";
  return `You are a senior recruiter. Extract the job description into this exact JSON object.

Output rules:
- Return only raw JSON. No markdown, no headings, no explanations.
- Your first character must be { and your last character must be }.
- Do not repeat these instructions.
- Use only facts from the job description.
- Use "" or [] when unknown.

Required JSON shape:
{
  "company": "",
  "role": "",
  "location": "",
  "jobNumber": "",
  "datePosted": "",
  "employmentType": "",
  "seniority": "",
  "overview": "",
  "workSite": "",
  "travel": "",
  "profession": "",
  "discipline": "",
  "roleType": "",
  "responsibilities": [],
  "requirements": [],
  "preferredQualifications": [],
  "skills": [],
  "keywords": [],
  "compensation": "",
  "applicationWindow": "",
  "employerSignal": "",
  "risks": [],
  "fitNotes": "",
  "sourceUrl": ""
}

Job description:
<<<JD
${rawJD.trim()}
JD>>>`;
}

export function buildFitReviewPrompt(data: AppData, jdId: string): string {
  const job = selectedJob(data, jdId);
  const context = buildFitReviewContext(data, jdId);
  return `${jsonOnlyContract}

You are a senior recruiter and career coach.
Compare the selected JD against the candidate Source of Truth, Evidence Bank, and STAR Story Bank.

Rules:
- Be direct and evidence-led.
- Identify what the employer is really looking for.
- Separate strong matches, weak matches, unsupported claims, and recommended positioning.
- Explain the fit level. If the candidate has strong skill match but logistics, location, security-admin, language, or niche-tool blockers, keep the score honest and list those blockers explicitly.
- Do not hide a strong match behind a single Medium label. Use fitReasons for why the candidate can win, fitBlockers for what could block screening, and fitUpgradePath for what would move the fit up.
- Use Domain Knowledge to identify business-context fit, not just tool match.
- Recommend exact item IDs to select for this JD:
  - skillInferences.id for technical capabilities.
  - domainKnowledge.id for domain/process/stakeholder/KPI signals.
  - evidenceCards.id for proof.
  - starStories.id for narrative examples.
- Recommend a focused shortlist, never the full bank: 8-15 skills, 3-8 domain signals, 8-15 evidence cards, and 3-6 STAR stories when available.
- Every recommended ID must exist in the candidate context below. Do not invent IDs.
- Define how to position the candidate for senior / high-compensation consideration through scope, ownership, business impact, risk reduction, and credibility.
- Translate relevant domain knowledge into hiring signals, risks, and positioning strategy.
- Do not mention salary in CV language; translate compensation strength into value strategy.
- Return ONLY valid JSON that follows the output contract above.
- Do not write a progress sentence before the JSON. The response must start immediately with {.
- Keep the complete response under 4,500 characters. Use concise phrases: employerSignals/strongMatches/gaps max 6 items each; each item max 140 characters; positioningAdvice and targetCompensationStrategy max 600 characters each; nextAction max 240 characters.
- Before answering, verify every opened { or [ has its matching closing bracket. Never stop mid-JSON.

Schema:
{
  "fitLevel": "High|Medium|Low",
  "employerSignals": [],
  "strongMatches": [],
  "gaps": [],
  "fitReasons": [],
  "fitBlockers": [],
  "fitUpgradePath": [],
  "recommendedSkillIds": [],
  "recommendedDomainKnowledgeIds": [],
  "recommendedEvidenceIds": [],
  "recommendedStoryIds": [],
  "recommendedEvidenceTitles": [],
  "recommendedStoryTitles": [],
  "positioningAdvice": "",
  "targetCompensationStrategy": "",
  "nextAction": ""
}

JD:
${JSON.stringify(job?.parsed || job?.rawJD || {}, null, 2)}

Career profile:
${JSON.stringify(context.careerProfile, null, 2)}

Legacy source summary:
${JSON.stringify(context.sourceOfTruth, null, 2)}

Skill inference map:
${JSON.stringify(context.skillInferences, null, 2)}

Evidence:
${JSON.stringify(context.evidenceCards, null, 2)}

Domain knowledge:
${JSON.stringify(context.domainKnowledge, null, 2)}

STAR stories:
${JSON.stringify(context.starStories, null, 2)}

FINAL OUTPUT CHECK BEFORE YOU ANSWER:
- If your response starts with anything other than {, it is invalid.
- If your response contains prose outside the JSON object, it is invalid.
- Return the JSON object now.`;
}

export function buildScreeningAnalysisPrompt(data: AppData, jdId: string): string {
  const job = selectedJob(data, jdId);
  const context = buildScreeningContextProjection(data, jdId);
  const normalizedJd = normalizeParsedJDRequirements(job?.parsed);
  const requirementInventory = buildNormalizedRequirementInventory(normalizedJd);
  const normalizedJdContext = normalizedJd && {
    ...normalizedJd,
    sourceUrl: undefined,
    responsibilities: undefined,
    requirements: undefined,
    preferredQualifications: undefined,
    risks: undefined,
    fitNotes: undefined,
    employerSignal: undefined,
    employerInsights: undefined,
    additionalAttributes: undefined
  };
  const promptRequirementInventory = requirementInventory.map((item) => ({
    requirementId: item.requirementId,
    normalizedText: item.normalizedText,
    sourceSection: item.sourceSection,
    sourceImportanceHint: item.sourceImportanceHint,
    atomicDimension: item.atomicDimension,
    expectedAspects: item.expectedAspects,
    pathwayGroupId: item.pathwayGroupId,
    parentSourceRequirementIds: item.parentSourceRequirementIds,
    sourceReferences: item.sourceReferences.map((reference) => ({
      sourceSection: reference.sourceSection,
      sourceIndex: reference.sourceIndex,
      sourceIndices: reference.sourceIndices,
      sourceText: reference.sourceText
    }))
  }));
  const marketReferenceSources = data.rawSources
    .filter((source) => source.kind === "Market JD Reference")
    .map((source) => ({
      sourceId: source.id,
      title: source.title,
      content: fitText(source.content, 3500)
    }));
  const candidatePositioningBoundaries = {
    strongestPositioning: [
      "Business automation and AI operations",
      "Power Platform / M365 workflow automation",
      "AI-assisted technical operations",
      "AI product operations and chatbot quality evaluation",
      "Deployment enablement / customer workflow adoption for stretch roles"
    ],
    hiddenSkillsToSurfaceWhenRelevant: [
      "Can inspect and debug existing Python pipeline logic, but should not claim from-scratch Python application engineering",
      "Can review, correct, and validate existing SQL logic",
      "Uses AI coding tools for supervised code inspection, bug fixing, refactoring support, and validation planning",
      "Can build practical SaaS/low-code workflows with Power Automate, Power Apps, SharePoint, Power BI, and n8n-style orchestration concepts",
      "Can translate frontline business process issues into automation requirements, acceptance criteria, dashboards, and operational handoff"
    ],
    claimsToAvoidUnlessDirectlySupported: [
      "Full-stack engineer",
      "Backend engineer",
      "Machine learning engineer",
      "Model training or reward modeling",
      "Production ML infrastructure owner",
      "From-scratch Python application developer",
      "Kubernetes/Terraform/MLflow/Airflow ownership"
    ]
  };
  return `${jsonOnlyContract}

You are a recruiter, ATS screener, and resume strategist.
Your job is to optimize this candidate for first-pass CV screening.

Objective:
- Maximize interview conversion.
- Identify what must be visible in the CV within a short recruiter scan.
- Decode what the hiring manager actually needs this person to do after joining.
- Compare this JD's stated requirements against the candidate's actual evidence and any explicitly saved Market JD Reference sources.
- Classify this specific JD into a market positioning before selecting evidence. This is per-JD, not the candidate's permanent identity.
- Recommend only source-grounded evidence that improves screening strength.
- Build the decision record the CV generator must obey: JD breakdown, JD-to-evidence mapping, internal terminology translation, candidate positioning, and remaining gaps.
- Apply truthful positioning from the strongest supported requirement mappings. Production code derives Fit and generation recommendation.

Rules:
- Return ONLY valid JSON.
- Focus on title alignment, ATS keyword coverage, true screening thresholds, must-have signals, missing keywords, overclaim risk, and the strongest 3-5 evidence clusters.
- Work in this order:
  1. Read the target JD.
  2. If Market JD Reference sources are provided, extract observed capabilities and keywords from those saved sources only. If none are provided, skip market reference analysis entirely.
  3. Extract only the requirements, keywords, capabilities, and deal breakers stated or clearly implied by this JD.
  4. Map each important JD requirement to the candidate's actual skill/evidence/story IDs.
  5. Translate internal project/system/workflow names into external recruiter language.
  6. Only then choose the safest positioning and recommended CV angle.
- Classify the JD market role family independently from the candidate's positioning. A non-AI role must use NOT_APPLICABLE for the AI archetype.
- Do not output a Fit tier. Production code derives Fit, application priority, and generation recommendation from the canonical matrix.
- Treat the candidate's strongest transferable pattern as tool application: understanding messy business workflows, structuring logic, using SaaS/low-code/AI tools, validating outputs, debugging existing Python/SQL/pipelines when supported, and translating results for stakeholders.
- Surface hidden skills when relevant: reading/debugging existing Python pipelines, SQL query correction, AI coding tool assisted code review, SaaS/low-code workflow automation, n8n-style orchestration concepts, Power Automate/Power Apps/SharePoint/Power BI, technical handoff, and validation checklists.
- Do not overstate hidden skills. Python/SQL should be framed as review/debug/maintenance unless the evidence supports from-scratch application development.
- Classify every supplied requirement ID exactly once. Do not invent, omit, or duplicate requirement IDs.
- Add managerIntent: infer the real job-to-be-done, manager pain points, success signals, deal breakers, and overqualification risks from the JD wording.
- Add jdBreakdown:
  - roleSummary must explain in plain language what this role is really about.
  - coreResponsibilities must list the main work the hired person will do.
  - requiredSkills must separate technical, business, communication, domain knowledge, tools/platforms, and process/methodology.
  - senioritySignals must identify ownership, ambiguity, stakeholder, delivery, or technical-depth signals.
  - hiddenHiringPriorities must infer what HR/hiring manager likely cares about.
  - atsKeywords must separate exact, related, tools, jobTitles, skills, domain, responsibilities, and methodology keywords.
- Do not infer or fabricate market JDs. Use only the Market JD Reference sources included in this prompt. Every market reference signal must cite sourceIds. If no Market JD Reference sources are provided, return marketReferenceSignals as [].
- Market JD Reference sources are context only; they cannot override the target JD and they cannot justify unsupported claims.
- Populate requirementMatrix with every supplied normalized requirement exactly once and map it to real existing IDs or a truthful gap.
- Copy each supplied normalizedText, sourceSection, atomicDimension, and expectedAspects exactly; source lineage remains code-owned and must not be invented.
- For every mapping, classify importance as CORE_RESPONSIBILITY, REQUIRED_CAPABILITY, PREFERRED_CAPABILITY, FORMAL_REQUIREMENT, or SUPPLEMENTAL_SIGNAL.
- For every mapping, classify matchStatus as DIRECT_MATCH, TRANSFERABLE_MATCH, PARTIAL_MATCH, LEARNABLE_GAP, CORE_CAPABILITY_GAP, or FORMAL_SCREENING_RISK.
- DIRECT_MATCH and TRANSFERABLE_MATCH require real EvidenceCard IDs. TRANSFERABLE_MATCH must explain the source-to-target context difference and must not claim the target context already happened.
- PARTIAL_MATCH must list supportedAspects and unsupportedAspects. LEARNABLE_GAP and FORMAL_SCREENING_RISK must not be written as current capability. CORE_CAPABILITY_GAP cannot be cancelled by supporting keywords.
- Treat years, title, degree, certification, work-site, location, language, visa, and work-authorization requirements as FORMAL_SCREENING_RISK unless they are also genuinely core daily capabilities. Years alone must not decide capability Fit.
- A supplied FORMAL_REQUIREMENT or FORMAL_CONSTRAINT must be classified FORMAL_SCREENING_RISK and DO_NOT_CLAIM. It is not a capability Fit gap. A hard block needs a specific unavoidable legal or practical reason.
- sourceUrl and sourceUrlStatus are provenance warnings only. Never infer missing JD content from them; they must not affect requirement identity, evidence mapping, Fit, or CV claims.
- Mark hardBlock true only for a genuinely unavoidable legal or practical restriction, never merely for years or preferred qualifications.
- If a requirement has no evidence, do not hide it. Mark it as a gap and prevent the CV from overclaiming.
- The final CV angle should be based on the strongest supported mapping, not on the most attractive market label.
- primaryTargetTitle is the candidate's honest target title for this JD, not a copied JD title. When most core software/platform responsibilities are gaps or only transferable, do not label the candidate Principal/Senior Software Engineer; use the strongest supported adjacent positioning instead.
- Decode vague JD language into what the recruiter is probably screening for, especially phrases like communication skills, stakeholder management, ownership, problem solving, fast-paced, or cross-functional work.
- Identify likely interview question themes for this role level so the candidate knows what evidence must survive screening and interview follow-up.
- Recommend exact existing IDs only. Do not invent IDs.
- When recommending evidence, prefer evidence whose visibilityUse is "CV Visible" for CV generation.
- Use "Interview Only" evidence only to support interview prep, hidden skill surfacing, or strategy; do not recommend it as primary visible CV material unless there is no safer alternative.
- Treat "Prompt Context Only" as reasoning context and "Do Not Use" as suppressed.
- Include evidenceToSuppress when an evidence card has useful proof but risky visible details, blockedVisibleTerms, or avoidRoleTypes for this JD.
- Add internalTerminology:
  - Scan evidence, STAR stories, skills, domain items, selected source wording, and JD-mapping notes for internal project names, internal system names, workflow names, team abbreviations, product names, ticket names, document names, process labels, and company-specific acronyms.
  - If a term is an internal project/system/workflow/process, write externalFriendlyWording as a business-process description external HR can understand.
  - usageDecision must be "Replace" unless the original term is a recognized external product or helps traceability after explanation.
  - Do not include common public products such as Power BI, Power Automate, SharePoint, Python, SQL, or OpenAI as internal terms.
- LOW_FIT still requires credible overlaps, better adjacent roles, a future transition path, and recommended preparation.
- HARD_BLOCK requires an unavoidable legal or practical restriction and a non-empty reason.
- A keyword is "missing" only if it matters to the JD and is not clearly supported by visible evidence yet.
- A claim is "risky" when the JD implies depth the candidate may not fully support, such as frontier ML research, model training, or formal MLOps ownership without direct evidence.
- Keep the output concise and recruiter-oriented.

Canonical Screening AI output JSON contract (generated from the runtime validator):
${screeningAnalysisPromptSchemaContract}

Normalized JD metadata (requirement-bearing text is supplied once in the canonical inventory below):
${JSON.stringify(normalizedJdContext || job?.rawJD || {}, null, 2)}

Normalized Requirement Inventory:
${JSON.stringify(promptRequirementInventory, null, 2)}

Candidate positioning boundaries:
${JSON.stringify(candidatePositioningBoundaries, null, 2)}

Market JD Reference sources:
${JSON.stringify(marketReferenceSources, null, 2)}

JD + safe screening context:
${JSON.stringify(context, null, 2)}

Return raw JSON only.`;
}

export const SCREENING_ANALYSIS_PROMPT_VERSION = "screening-analysis-schema-driven-v2-p15r2";
export const screeningAnalysisPromptIdentity = contentHash({
  promptVersion: SCREENING_ANALYSIS_PROMPT_VERSION,
  schemaVersion: SCREENING_AI_SCHEMA_VERSION,
  schemaHash: screeningAiSchemaHash,
  requirementInventoryPolicy: REQUIREMENT_INVENTORY_POLICY_VERSION,
  policy: "evidence-safety-fit-policy-v1"
});

export const SCREENING_CV_PROMPT_VERSION = "screening-cv-v7-one-pass-reviewer-ready";

function writerCareerProfile(data: AppData) {
  const profile = data.careerProfile;
  return {
    identity: profile.identity,
    contact: profile.contact || null,
    targetRoles: profile.targetRoles || [],
    positioning: profile.positioning,
    education: profile.education || [],
    certifications: profile.certifications || [],
    skillGroups: profile.skillGroups || [],
    workExperiences: (profile.workExperiences || []).map((experience) => ({
      id: experience.id,
      company: experience.company,
      role: experience.role,
      period: experience.period,
      location: experience.location,
      scope: experience.scope
    })),
    claimBoundaries: profile.claimBoundaries
  };
}

function writerAnalysis(
  analysis: JobApplication["screeningAnalysis"],
  evidencePriorityIds: string[],
  selectedSkillIds: string[],
  selectedStoryIds: string[]
) {
  if (!analysis) return undefined;
  const priorityIds = new Set(evidencePriorityIds);
  const skillIds = new Set(selectedSkillIds);
  const storyIds = new Set(selectedStoryIds);
  const relevantMappings = (analysis.requirementMatrix || [])
    .filter((item) =>
      item.matchStatus === "LEARNABLE_GAP"
      || item.matchStatus === "CORE_CAPABILITY_GAP"
      || item.matchStatus === "FORMAL_SCREENING_RISK"
      || item.matchingEvidenceIds.some((id) => priorityIds.has(id))
      || item.matchingSkillIds.some((id) => skillIds.has(id))
      || item.matchingStoryIds.some((id) => storyIds.has(id))
    )
    .slice(0, 16)
    .map((item) => ({
      requirement: item.requirement,
      marketExpectation: item.marketExpectation,
      matchingEvidenceIds: item.matchingEvidenceIds.filter((id) => priorityIds.has(id)),
      matchingSkillIds: item.matchingSkillIds,
      matchingStoryIds: item.matchingStoryIds,
      matchingEducationIds: item.matchingEducationIds,
      matchingDomainKnowledgeIds: item.matchingDomainKnowledgeIds,
      importance: item.importance,
      matchStatus: item.matchStatus,
      cvUsage: item.cvUsage,
      interviewUsage: item.interviewUsage,
      supportedAspects: item.supportedAspects,
      unsupportedAspects: item.unsupportedAspects,
      transferContext: item.transferContext,
      explanation: item.explanation,
      hardBlock: item.hardBlock
    }));
  return {
    primaryTargetTitle: analysis.primaryTargetTitle,
    candidatePositioning: analysis.candidatePositioning ? {
      safestPositioning: analysis.candidatePositioning.safestPositioning,
      headlineRecommendation: analysis.candidatePositioning.headlineRecommendation,
      hiddenSkillsToSurface: analysis.candidatePositioning.hiddenSkillsToSurface,
      evidenceToSuppress: analysis.candidatePositioning.evidenceToSuppress,
      claimsToAvoid: analysis.candidatePositioning.claimsToAvoid
    } : undefined,
    managerIntent: analysis.managerIntent ? {
      actualJobToBeDone: analysis.managerIntent.actualJobToBeDone,
      hiringManagerPainPoints: analysis.managerIntent.hiringManagerPainPoints,
      successSignals: analysis.managerIntent.successSignals,
      dealBreakers: analysis.managerIntent.dealBreakers
    } : undefined,
    requirementMatrix: relevantMappings,
    internalTerminology: analysis.internalTerminology || [],
    remainingGaps: analysis.remainingGaps || [],
    mustHaveKeywords: analysis.mustHaveKeywords,
    supportingKeywords: analysis.supportingKeywords || [],
    missingKeywords: analysis.missingKeywords,
    riskyClaims: analysis.riskyClaims,
    summaryAngle: analysis.summaryAngle,
    positioningReport: analysis.positioningReport
  };
}

function writerEvidence(item: AppData["evidenceCards"][number]) {
  return {
    id: item.id,
    title: item.title,
    sectionTitle: item.sectionTitle,
    experienceId: item.experienceId,
    projectId: item.projectId,
    cvWording: item.cvSafeBullet || item.cvBullet || item.externalFriendlyDescription || item.actionTaken || item.cvAngle,
    stakeholders: item.stakeholders,
    metric: item.quantifiedEvidence || item.metrics,
    tools: item.tools,
    allowedVisibleClaims: item.allowedVisibleClaims,
    forbiddenVisibleClaims: item.forbiddenVisibleClaims,
    blockedVisibleTerms: item.blockedVisibleTerms,
    claimLevel: item.claimLevel,
    visibilityUse: item.visibilityUse,
    confidence: item.confidence,
    evidenceTier: item.evidenceTier
  };
}

/** Reference-only records retain provenance without becoming a second claim inventory. */
function writerReferenceEvidence(item: AppData["evidenceCards"][number]) {
  return {
    id: item.id,
    title: item.title,
    experienceId: item.experienceId,
    projectId: item.projectId,
    claimLevel: item.claimLevel || "Interview Only",
    restriction: "REFERENCE ONLY — never use this record as a visible CV claim.",
    interviewContext: item.interviewTalkingPoint || item.riskIfUsedWrongly || item.proof || ""
  };
}

export function buildScreeningCvWriterContext(data: AppData, jdId: string) {
  const job = selectedJob(data, jdId);
  if (!job) return null;
  const diagnostics = selectionDiagnostics(data, job);
  const cvBrief = resolveEffectiveCvBrief(data, job);
  if (!cvBrief?.contractIdentity) return null;
  const evidencePriorityIds = effectiveEvidencePriorityIds(job, cvBrief);
  const selectedEvidence = orderedItemsByIds(data.evidenceCards, evidencePriorityIds);
  const evidencePartition = partitionEvidenceForWriter(data, selectedEvidence);
  const summaryQualityContract = buildSummaryQualityContract({ data, job });
  const positioningReport = buildPositioningReport({ job, data });
  return {
    jd: job.parsed ? canonicalParsedJD(job.parsed) : job.rawJD || {},
    analysis: writerAnalysis(
      job.screeningAnalysis,
      evidencePriorityIds,
      diagnostics.selectedSkillIds,
      diagnostics.selectedStoryIds
    ),
    cvBrief,
    positioningReport,
    summaryQualityContract,
    evidencePriorityIds,
    selectionQuality: evidenceSelectionQualityDiagnostics(data, job),
    candidateContact: data.careerProfile.contact || null,
    careerProfile: writerCareerProfile(data),
    selectedSkills: diagnostics.selectedSkills.map((item) => ({
      id: item.id,
      skill: item.skill,
      cvWording: item.cvWording,
      strength: item.strength,
      usageContext: item.usageContext,
      evidenceSummary: item.evidenceSummary,
      experienceId: item.experienceId,
      projectId: item.projectId,
      confidence: item.confidence
    })),
    selectedDomainKnowledge: diagnostics.selectedDomainKnowledge.map((item) => ({
      id: item.id,
      domain: item.domain,
      businessProcess: item.businessProcess,
      stakeholders: item.stakeholders,
      systemsOrData: item.systemsOrData,
      riskOrCompliance: item.riskOrCompliance,
      metricsOrKpis: item.metricsOrKpis,
      cvWording: item.cvWording,
      experienceId: item.experienceId,
      projectId: item.projectId,
      confidence: item.confidence
    })),
    cvVisibleEvidence: evidencePartition.visible.map(writerEvidence),
    referenceOnlyEvidence: evidencePartition.referenceOnly.map(writerReferenceEvidence),
    selectedStories: diagnostics.selectedStarStories.map((story) => ({
      id: story.id,
      title: story.title,
      sectionTitle: story.sectionTitle,
      action: story.action,
      result: story.result,
      cvBullets: story.cvBullets,
      evidenceIds: story.evidenceIds,
      experienceId: story.experienceId,
      projectId: story.projectId,
      storyConfidence: story.storyConfidence
    }))
  };
}

export function buildTargetedRegenerationPrompt(
  data: AppData,
  jdId: string,
  request: TargetedRegenerationRequest,
  currentCv: TailoredCv
): string {
  const context = buildScreeningCvWriterContext(data, jdId);
  const outputKind = targetedOutputKind(request);
  const evidenceIdSet = new Set(request.selectedEvidenceIds);
  const selectedEvidence = (context?.cvVisibleEvidence || [])
    .filter((item) => evidenceIdSet.has(item.id))
    .map((item) => ({
      id: item.id,
      cvWording: item.cvWording,
      stakeholders: item.stakeholders,
      metric: item.metric,
      allowedVisibleClaims: item.allowedVisibleClaims,
      forbiddenVisibleClaims: item.forbiddenVisibleClaims,
      blockedVisibleTerms: item.blockedVisibleTerms,
      confidence: item.confidence
    }));
  const sharedContext = {
    targetRole: context?.analysis?.primaryTargetTitle || currentCv.header.targetRole,
    jdPriorities: {
      summaryAngle: context?.analysis?.summaryAngle,
      mustHaveKeywords: context?.analysis?.mustHaveKeywords,
      supportingKeywords: context?.analysis?.supportingKeywords,
      managerJobToBeDone: context?.analysis?.managerIntent?.actualJobToBeDone,
      managerPainPoints: context?.analysis?.managerIntent?.hiringManagerPainPoints,
      remainingGaps: context?.analysis?.remainingGaps,
      riskyClaims: context?.analysis?.riskyClaims,
      positioningReport: context?.positioningReport
    },
    cvBrief: context?.cvBrief ? {
      headline: context.cvBrief.cvHeadline,
      summaryAngle: context.cvBrief.summaryAngle,
      topSellingPoints: context.cvBrief.top3SellingPoints,
      foregroundSkills: context.cvBrief.skillsToForeground,
      claimsToAvoid: context.cvBrief.claimsToAvoid,
      mustShowEvidenceIds: context.cvBrief.mustShowEvidenceIds
    } : null,
    positioningReport: context?.positioningReport || null,
    summaryQualityContract: context?.summaryQualityContract || null,
    failedSummaryCriterionIds: request.failedSummaryCriterionIds || [],
    selectedEvidence
  };
  const immutableRules = `
You are editing one authorized CV zone only.
Every other CV zone is immutable.
Do not reproduce the full CV.
Do not return, modify, or suggest any unauthorized CV field inside the patch.
Do not invent facts, evidence, metrics, ownership, skills, or experience.
Preserve evidence traceability and use only the supplied EvidenceCard IDs.
Return valid JSON matching the exact schema. Any additional key is invalid.`;

  if (outputKind === "summary") {
    return `${jsonOnlyContract}

TARGETED REGENERATION CONTRACT: SUMMARY

AUTHORIZED MUTATION ZONE:
summary

IMMUTABLE ZONES:
header
contact
targetRole
workExperience
skills
education
certifications
export
metadata
${immutableRules}

Return only:
{"summary":"..."}

Summary rules:
- Write 45-65 words in at most two sentences.
- Use Summary Quality Contract exactly: target only failedSummaryCriterionIds when provided, preserve passed criteria, and keep the same positioningMode.
- Explain credible role fit using only supported evidence and supportedStrengths.
- Treat unsupportedCoreRequirements as fit risk or gaps; do not try to solve them by inventing claims.
- Do not add evidence IDs to visible prose.
- Do not claim unsupported Azure, sales, cloud, engineering, ownership, or metric experience.

Current Summary:
${JSON.stringify(currentCv.summary)}

Minimal authorized context:
${JSON.stringify(sharedContext, null, 2)}`;
  }

  const targets = authorizedBulletTargets(request, currentCv);
  const targetContext = targets.map((target) => ({
    roleId: target.roleId,
    bulletId: target.bulletId,
    currentText: target.text,
    evidenceIds: target.evidenceIds
  }));
  if (outputKind === "wording") {
    return `${jsonOnlyContract}

TARGETED REGENERATION CONTRACT: RECRUITER WORDING CLEANUP

AUTHORIZED MUTATION ZONE:
Only the exact targetId values listed below.

IMMUTABLE ZONES:
summary
header
contact
targetRole
all unlisted roles and bullets
skills
education
certifications
export
metadata
${immutableRules}

Return only:
{"wordingPatches":[{"targetId":"exact bulletId","text":"...","evidenceIds":["existing-id"]}]}

Wording rules:
- Return exactly one patch for every listed target and no others.
- Preserve each target's EvidenceCard IDs exactly and in the same order.
- Change wording only; preserve factual meaning, ownership, scope, and metrics.
- Remove internal/work-log terminology without adding new claims.

Authorized targets:
${JSON.stringify(targetContext, null, 2)}

Minimal authorized context:
${JSON.stringify(sharedContext, null, 2)}`;
  }

  return `${jsonOnlyContract}

TARGETED REGENERATION CONTRACT: SELECTED WORK BULLETS

AUTHORIZED MUTATION ZONE:
Only the exact roleId/bulletId pairs listed below.

IMMUTABLE ZONES:
summary
header
contact
targetRole
all unlisted roles and bullets
skills
education
certifications
export
metadata
${immutableRules}

Return only:
{"workExperiencePatches":[{"roleId":"exact roleId","bulletId":"exact bulletId","text":"...","evidenceIds":["existing-id"]}]}

Work-bullet rules:
- Return exactly one patch for every listed target and no others.
- Preserve each target's EvidenceCard IDs exactly and in the same order.
- Improve action, scope, stakeholder relevance, and evidence-safe outcome language.
- Do not introduce new metrics, tools, ownership, skills, or experience.

Authorized targets:
${JSON.stringify(targetContext, null, 2)}

Minimal authorized context:
${JSON.stringify(sharedContext, null, 2)}`;
}

export function buildScreeningCvPrompt(data: AppData, jdId: string, fixContext?: {
  currentCv?: TailoredCv;
  gateFixes?: string[];
  failedChecks?: { label: string; value: string; fix: string }[];
  contentAudit?: { location: string; excerpt: string; reasons: string[] }[];
}): string {
  const context = buildScreeningCvWriterContext(data, jdId);
  const analysis = context?.analysis;
  const cvBrief = context?.cvBrief;
  const candidatePositioningBoundaries = {
    safeTechnicalWording: [
      "reviewed and modified existing Python automation logic",
      "debugged SQL query logic and validated reporting outputs",
      "used AI coding tools to inspect, revise, and validate automation scripts",
      "built low-code/SaaS workflow automation using Power Platform and connector-based tools",
      "translated business process issues into workflow logic, acceptance criteria, and operational dashboards"
    ],
    unsafeOverclaims: [
      "built Python applications from scratch",
      "owned backend or full-stack engineering",
      "owned ML model training, reward modeling, or production MLOps",
      "designed production cloud infrastructure from scratch"
    ]
  };

  return `${jsonOnlyContract}

You are a recruiter-focused resume writer.
Write a screening-first CV JSON for this one target JD.

Core contract:
- Use only selected, source-grounded evidence. Do not invent tools, metrics, titles, systems, certifications, or ownership.
- Write a targeted 1.5-2 page CV that can pass HR screening and still sound credible to a hiring manager.
- Use the Career OS CV Brief as the plan: headline, top selling points, first section theme, foreground skills, suppressed skills, and claims to avoid.
- Use the canonical requirementMatrix as constraints. Never infer Fit, reclassify a requirement, or turn a gap, formal risk, DO_NOT_CLAIM, or FORBIDDEN row into a visible claim.
- Use Positioning Report as the read-only presentation of Screening Analysis positioning policy: overallFit, transferableStrengths, truthfulCapabilityGaps, unsupportedClaimsPrevented, recommendedPositioning, and remainingHiringRisks. If it appears to conflict with Screening Analysis, Screening Analysis wins.
- DIRECT_MATCH evidence may be visible. TRANSFERABLE_MATCH and PARTIAL_MATCH must preserve their source/target boundary and unsupported aspects. LEARNABLE_GAP, CORE_CAPABILITY_GAP, and FORMAL_SCREENING_RISK must not appear as satisfied claims.
- Translate company-only terms into external business language. Never show blockedVisibleTerms or internal project names in visible CV text.
- Do not force missing keywords. Add only keywords supported by selected evidence.
- If fixContext.currentCv is provided, patch only the failed checks listed in fixContext. Do not regenerate from scratch unless the structure is fundamentally wrong. Preserve passed sections and already-good bullets.
- First-pass objective: the initial CV must already aim to pass the local Gate Review, Manager Review, Reviewer Check, ATS keyword support, and export-readiness checks in one response. Do not rely on a second AI patch to clean up predictable issues.

One-pass quality gates to satisfy before returning JSON:
- Gate Review: visible target title must match Screening Analysis primaryTargetTitle when available; all evidence-supported must-have keywords should appear naturally in Summary, Skills, or Work Experience; unsupported keywords must not be forced.
- Hiring Manager Review: the summary and first 6 bullets must answer the manager's actual job-to-be-done, pain points, and success signals from Screening Analysis. If the manager would likely say "No", rewrite before returning.
- Summary Quality Contract: the Summary must satisfy the criterion IDs in the supplied contract. Use the contract positioningMode, supportedStrengths, unsupportedCoreRequirements, prohibitedClaims, wordingConstraints, and maxLengthWords.
- Evidence safety: do not make visible claims for Unsupported JD requirements. Weak mappings may appear only as conservative support, not headline ownership or expert-level capability.
- Gap handling: high-risk gaps from Screening Analysis must not be hidden as fake strengths. Either omit them from visible claims or handle them conservatively in reviewNotes.
- Fit tier handling: Good/Risky/Weak must never block CV generation. Good may use direct supported positioning. Risky must use conservative adjacent wording and include risk context. Weak/Avoid must generate a truthful transferable-positioning CV and must not pretend direct fit.
- Positioning Report: include a structured positioningReport in the Tailored CV JSON. It is informational only, derived from Screening Analysis, and must explain Overall Fit, Transferable Strengths, Truthful Capability Gaps, Unsupported Claims Prevented, Recommended Positioning, and Remaining Hiring Risks.
- Action/outcome density: at least 65% of work bullets must contain an action/outcome signal such as built, automated, improved, reduced, enabled, validated, coordinated, documented, maintained, or delivered plus a business reason.
- Evidence traceability: every visible work bullet should include evidenceIds when supported; target at least 6 evidence-linked bullets and avoid uncited broad claims.
- Representative project coverage: when selected grounded evidence spans multiple relevant projects, visible bullets must surface the strongest project-backed hiring signals instead of only broad capability categories. The current role should show concrete external-friendly project/function context such as chatbot platform evaluation, AI assistant quality workflow, customer-service chatbot operations, AI governance workflow, reporting/validation pipeline, or automation delivery when supported.
- External wording: no raw evidence language, no "evidence card", no source/proof/review-note wording, no internal system labels, no work-log diary wording.
- ATS/export readiness: include candidate name, plain email, location, concise target role, readable summary, skills, at least two role blocks when career history supports it, and enough composed content for export.

Positioning rules:
- Start from this JD, not a fixed candidate label.
- If the JD is workflow automation / AI tool application, lead with business process structuring, SaaS or low-code automation, AI tool adoption, reporting, stakeholder coordination, and operational enablement.
- If the JD is Power Platform / M365, lead with Power Automate, Power Apps, SharePoint, M365 support, troubleshooting, documentation, user enablement, and Power BI. AI evaluation should be supporting context only.
- If the JD is AI-assisted technical operations, lead with inspecting/debugging existing Python or SQL logic, AI coding tool assisted review, pipeline maintenance support, validation checklists, and technical handoff. Do not claim from-scratch software engineering.
- If the JD is AI product/evaluation operations, lead with chatbot quality operations, GPT scoring, benchmark/rubric workflow, human review, dashboarding, production issue triage, and governance.
- If the JD is pure ML/backend/full-stack/MLOps, keep claims conservative and put gaps in reviewNotes.
- If Positioning Report overallFit is Weak or recommendedPositioning.targetRoleTreatment is not-recommended, still generate the CV. Reposition toward transferable capabilities and explicitly prevent unsupported direct-fit claims in positioningReport/reviewNotes.
- Never invent quota ownership, sales responsibility, enterprise deal ownership, customer-facing responsibility, architecture ownership, leadership, metrics, tools, titles, or scope.

CV writing rules:
- Summary: 3-5 lines, 45-65 words, 2 sentences max, no generic filler, no tool stuffing.
- Sidebar: only JD-relevant supported skills; remove impressive-but-distracting skills.
- Current role: 2-3 themed subsections, 8-10 total bullets maximum unless the JD explicitly needs broad coverage.
- Other roles: keep enough work history for credibility, but allocate less space to less relevant experience.
- Each bullet must show manager-facing value: action + capability + stakeholder/scope + business reason.
- Avoid work-log bullets, evidence dumps, long parentheses, raw score dumps, version numbers, internal dates, prompt versions, test windows, ticket IDs, or internal diary details.
- Do not use internal names such as TOMO, FIN, Trender Buddy, GenAI Hub, Sunshine Project, AppsIQ, TrendIQ, Consumer Companion, Eureka API, or internal table/version names in visible CV text.
- Convert internal names to external wording such as customer-service chatbot platform, AI assistant quality workflow, benchmark-based chatbot quality comparison, support operations automation, or Power BI quality reporting.
- Before returning JSON, run a silent pass/fail check: JD alignment, evidence accuracy, HR readability, hiring-manager relevance, ATS keywords, external clarity, depth, credibility, top 30% strength. Patch failed sections only.
- Also run this local reviewer checklist silently before returning:
  1. HR scan: targetRole, summary, and supported keywords visible.
  2. Hiring manager relevance: wouldInterview should be Yes or Maybe, not No.
  3. Evidence traceability: enough visible bullets cite evidenceIds.
  4. Representative project depth: strongest selected grounded projects appear as external-friendly work bullets, not hidden behind generic themes.
  5. Unsupported claims: zero unsupported visible promises and no high-risk gap presented as solved.
  6. Weak claims controlled: weak mappings are limited and conservatively framed.
  7. Action/outcome bullets: at least 65% of bullets are action/outcome oriented.
  8. External wording: no raw internal proof language.
  9. Export readiness: contact, section order, visible work depth, and composed content are complete.
- If any checklist item fails, revise the CV JSON before returning it. Use reviewNotes only for residual gaps that cannot be honestly fixed from evidence.
- If this is a repair pass, make the smallest evidence-grounded changes needed for failed checks only. Do not rewrite the whole CV, do not change passed checks, and do not swap the positioning unless a failed check explicitly requires it.
- Return valid JSON only.
- Return a single top-level object using either:
  - {"tailoredCv": { ... }}
  - or the CV object itself with keys header, sidebar, summary, workExperience
- Do not wrap the answer in any other key such as "result", "output", or "data".

Required shape:
{
  "tailoredCv": {
    "jdAnalysis": {
      "targetRole": "",
      "coreRequirements": [],
      "roleSummary": "",
      "managerJobToBeDone": "",
      "mustHaveRequirements": [],
      "strongAdvantageRequirements": [],
      "remainingGaps": [],
      "managerPainPointsAddressed": [],
      "internalTerminologyResolved": [
        { "originalTerm": "", "externalFriendlyWording": "" }
      ],
      "topKeywords": [
        { "keyword": "", "priority": "Must-have|Important|Nice-to-have", "placement": "Summary|Skills|Work Experience" }
      ],
      "gaps": []
    },
    "header": {
      "name": "",
      "targetRole": "",
      "email": "",
      "location": ""
    },
    "sidebar": {
      "languages": [{ "name": "", "level": "", "note": "" }],
      "skillGroups": [{ "title": "", "highlightedSkills": [], "otherSkills": [] }],
      "certifications": [],
      "education": [{ "school": "", "degree": "", "period": "" }]
    },
    "summary": "",
    "workExperience": [
      {
        "experienceId": "",
        "company": "",
        "role": "",
        "period": "",
        "location": "",
        "subsections": [
          {
            "title": "",
            "bullets": [
              {
                "text": "",
                "metric": "",
                "metricType": "Impact|Scope|Diagnostic|Internal Activity|None",
                "evidenceIds": [],
                "confidence": "Grounded|Needs Review|Weak"
              }
            ]
          }
        ]
      }
    ],
    "keywordPlacementNotes": [],
    "positioningReport": {
      "overallFit": "Good|Risky|Weak",
      "transferableStrengths": [
        {
          "strength": "",
          "evidenceIds": [],
          "supportLevel": "Strong|Partial|Weak",
          "cvTreatment": "state-directly|position-as-transferable|soften|interview-only|omit"
        }
      ],
      "truthfulCapabilityGaps": [
        {
          "requirement": "",
          "reason": "",
          "riskLevel": "High|Medium|Low",
          "mitigation": ""
        }
      ],
      "unsupportedClaimsPrevented": [
        {
          "claim": "",
          "reason": "",
          "mustNotClaim": []
        }
      ],
      "recommendedPositioning": {
        "headline": "",
        "summaryAngle": "",
        "targetRoleTreatment": "direct-fit|adjacent-fit|transferable-fit|not-recommended",
        "wordingGuidance": []
      },
      "remainingHiringRisks": [
        {
          "risk": "",
          "impactOnInterviewProbability": "",
          "mitigation": ""
        }
      ]
    },
    "interviewNotes": [{ "topic": "", "details": "", "evidenceIds": [] }],
    "reviewNotes": []
  }
}

Screening Analysis:
${JSON.stringify(analysis || {}, null, 2)}

Career OS CV Brief:
${JSON.stringify(cvBrief || {}, null, 2)}

Summary Quality Contract:
${JSON.stringify(context?.summaryQualityContract || {}, null, 2)}

Positioning Report:
${JSON.stringify(context?.positioningReport || {}, null, 2)}

JD:
${JSON.stringify(context?.jd || {}, null, 2)}

Career profile:
${JSON.stringify(context?.careerProfile || {}, null, 2)}

Candidate contact (authoritative only when populated):
${JSON.stringify(context?.candidateContact || {}, null, 2)}

Candidate positioning boundaries:
${JSON.stringify(candidatePositioningBoundaries, null, 2)}

Selected skills:
${JSON.stringify(context?.selectedSkills || [], null, 2)}

Selected domain knowledge:
${JSON.stringify(context?.selectedDomainKnowledge || [], null, 2)}

Evidence priority and coverage diagnostics:
${JSON.stringify({
    evidencePriorityIds: context?.evidencePriorityIds || [],
    selectionQuality: context?.selectionQuality || {}
  }, null, 2)}

Selected evidence allowed in visible CV:
${JSON.stringify(context?.cvVisibleEvidence || [], null, 2)}

Reference-only evidence, not allowed in visible CV:
${JSON.stringify(context?.referenceOnlyEvidence || [], null, 2)}

Selected STAR stories:
${JSON.stringify(context?.selectedStories || [], null, 2)}

${fixContext ? `
Current CV draft to improve:
${JSON.stringify(fixContext.currentCv || {}, null, 2)}

Gate fixes that MUST be resolved:
${JSON.stringify(fixContext.gateFixes || [], null, 2)}

Failed local reviewer/export checks that MUST be fixed:
${JSON.stringify(fixContext.failedChecks || [], null, 2)}

Content audit items that MUST be rewritten:
${JSON.stringify(fixContext.contentAudit || [], null, 2)}

Revision instructions:
- Treat this as a targeted repair pass, not a fresh evidence dump.
- Change only the sections, bullets, header fields, or sidebar items needed to resolve the failed checks above.
- Preserve passed checks, already-good bullets, evidence-linked project coverage, and useful positioning.
- Preserve the useful positioning from the current draft, but rewrite any flagged bullet into external recruiter language.
- If a current bullet contains internal product names, benchmark score dumps, long parenthetical proof, version/date logs, or work-record details, remove those details from visible text.
- Put internal proof details only in reviewNotes/interviewNotes.
- The revised CV must pass the Gate fixes and failed local reviewer/export checks above.
` : ""}

Return the Tailored CV JSON now.`;
}

export function buildTailoredCVPrompt(data: AppData, jdId: string): string {
  const job = selectedJob(data, jdId);
  const selectedEvidence = data.evidenceCards.filter((item) =>
    job?.selectedEvidenceIds.includes(item.id)
  );
  const evidencePartition = partitionEvidenceForWriter(data, selectedEvidence);
  const evidence = evidencePartition.visible;
  const referenceOnlyEvidence = evidencePartition.referenceOnly;
  const selectedStories = data.starStories.filter((story) =>
    job?.selectedStoryIds.includes(story.id)
  );
  const stories = selectedStories.filter((story) => story.storyConfidence !== "Needs Review");
  const referenceOnlyStories = selectedStories.filter((story) => !stories.includes(story));
  const selectedSkills = data.skillInferences.filter((item) =>
    (job?.selectedSkillIds || []).includes(item.id)
  ).filter((item) => item.confidence === "Grounded"
    && item.strength !== "Mentioned"
    && item.usageContext !== "mentioned");
  const selectedDomainKnowledge = data.domainKnowledge.filter((item) =>
    (job?.selectedDomainKnowledgeIds || []).includes(item.id)
  ).filter((item) => item.confidence === "Grounded");

  return `${jsonOnlyContract}

You are a senior recruiting director who has reviewed 100,000+ resumes, and an ATS-aware executive CV writer.
Create a recruiter-ready tailored CV JSON for this JD using only selected grounded evidence and STAR-derived CV bullets.

Recruiting objective:
- Maximize interview conversion while remaining fully defensible in recruiter screening and hiring-manager interviews.
- Do not undersell grounded ownership, technical depth, transferable capability, enterprise scope, cross-functional influence, or production responsibility.
- Be selective, not sparse: remove weak evidence, then synthesize the strongest remaining evidence into a complete senior-level career narrative.

Operating sequence:
1. Analyze the JD first: identify core requirements, top ATS keywords, and gaps.
2. Build a CV section plan before writing bullets: header, sidebar, summary, current role subsections, prior roles, education, certifications, languages.
3. Rewrite the Summary so the opening sentence immediately states the candidate's core value for this target role.
4. Rewrite Work Experience into outcome-oriented bullets using strong action verbs. Treat raw project numbers as supporting notes, not automatic resume metrics.
5. Naturally integrate ATS keywords into Summary, Skills, and relevant Work Experience bullets.
6. Use relevant Domain Knowledge to make the CV sound business-aware, not just tool-heavy.
7. Run a strict resume audit: remove vague, inflated, unsupported, or AI-sounding phrasing.

Hard rules:
- English CV content.
- Use ONLY the provided career profile, selected evidence, and selected STAR stories.
- No unsupported claims, no invented metrics, no invented tools, no invented titles.
- Use only Grounded Core/Supporting evidence for visible CV bullets. Archive, Needs Review, and Weak evidence are reference-only and must not be used to fill the CV.
- Use Core evidence for headline achievements. Combine relevant Grounded Supporting evidence from the same project to explain technical approach, stakeholder context, delivery complexity, or business process depth.
- Supporting evidence may strengthen a bullet but must not be presented as a larger outcome than the source supports.
- Use only Grounded Strong/Moderate skills with demonstrated usage such as owned, built, integrated, governed, tested, maintained, or used. A JD keyword or Mentioned skill is not proof of proficiency.
- A STAR story marked Needs Review is interview preparation only and must not become a visible CV achievement.
- If a useful metric is missing, use a grounded qualitative outcome and add a reviewNote asking for the missing metric.
- Do not paste raw evidence text. Rewrite into polished CV language.
- Remove internal words like "Source", "proof", "raw material", "claim boundary", "evidence card", "STAR", "review note".
- header.email must be a plain email address only. Do not use markdown, mailto links, brackets, parentheses, or HTML.
- header.location must be visible when supported by the career profile or source material.
- Use a clean external-facing current role title. Do not combine multiple slash-separated internal titles; preserve title truth through role scope, bullets, and reviewNotes instead.
- Work experience period values must use a clean format such as "Jul 2022 - Present" or "Oct 2021 - Jul 2022".
- Every bullet must include evidenceIds from the selected evidence or selected STAR stories when possible. Do not invent evidenceIds.
- In bullet.evidenceIds, prefer selected Evidence Bank card IDs. Do not put skill IDs, domain IDs, or STAR story IDs into evidenceIds unless they are explicitly part of selectedStoryIds and the bullet also has at least one selected evidence card ID when available.
- If a bullet cannot be tied to evidenceIds, keep it conservative and set confidence to "Needs Review".
- STAR stories must be integrated into achievement bullets only; never output Situation/Task/Action/Result labels.
- Work experience must be organized by company, role, and specific formal subsections.
- Every bullet must be clean text without a leading dash or bullet symbol.
- Visible CV bullets may contain only externally meaningful Impact or Scope metrics. Diagnostic and Internal Activity numbers must go to interviewNotes, never into bullet.text or bullet.metric.
- Product comparison scores, A/B results, sample ratios, case counts, version numbers, release dates, ticket/change counts, configuration counts, reviewer counts, page/field counts, table names, and internal project codes are not resume achievements.
- Translate internal product/project names into an externally understandable capability or business process. Keep a product name only when it is a recognized market product or materially clarifies the platform used.
- Return ONLY valid JSON that follows the output contract above.
- Produce a complete one- or two-page CV draft according to the strength of eligible evidence. Never add weak content merely to fill a page.
- When enough eligible evidence exists, target 10-14 differentiated work bullets that cover the JD's strongest hiring signals, the current role, and relevant prior career depth.
- When selected evidence covers several relevant projects, target 4-7 distinct project-backed hiring signals in the current role before compressing. Do not make the CV look thin by collapsing different projects into one generic "AI quality operations" or "workflow automation" theme.
- Ensure every must-have JD theme with real candidate evidence is represented at least once across Summary, Skills, or Work Experience.
- Prioritize 3-5 memorable hiring signals instead of giving every project equal weight. The first page must make the interview case within a recruiter scan.
- The final CV must look like a formal document a candidate can submit to a recruiter, hiring manager, or ATS system.
- Do not create a thin one-role summary. Include the full relevant career arc from the career profile when it supports the target role.
- Do not create a "Selected Evidence" or "Review Notes" CV section. Review notes belong only in reviewNotes, never in visible CV content.
- If eligible evidence is limited, produce a shorter credible CV and state the coverage gap in reviewNotes. Do not promote reference-only evidence into visible content.
- Do not confuse a missing numeric metric with weak evidence. A grounded qualitative outcome, production responsibility, decision value, risk reduction, or enterprise scope can still be a strong achievement.
- Do not treat selected evidence as the final wording. Selected evidence is source material; transform it into recruiter-facing achievements.
- Do not drop education, languages, certifications, or prior roles when they exist in the career profile.
- Do not leave page 2 nearly empty. If the current role does not fill both pages, add relevant prior role bullets, education, certifications, and compact skills.

Writing rules:
- Summary: concise, engaging, recruiter-facing, 35-55 words.
- Position the candidate for senior / high-compensation opportunities by emphasizing ownership, enterprise scope, measurable business impact, risk reduction, stakeholder influence, and production reliability.
- Use current market-facing language when grounded by evidence. Relevant AI evaluation hiring language includes: evaluation signals, reproducible evaluation pipelines, agent evaluation harnesses, real-world workflows, production quality gates, scalable feedback loops, grading accuracy, evaluation coverage, regression detection, failure modes, and cross-functional research/product/engineering partnership.
- Do not insert these terms as buzzwords. Use each term only when the selected evidence demonstrates the underlying work.
- Prefer senior ownership language such as owned, designed, built, established, productionized, scaled, governed, translated, and validated when factually supported. Avoid passive project-log language such as helped with, involved in, worked on, or responsible for.
- Position the candidate within the strongest evidence-supported market archetype, such as Applied Evals, AI Quality Systems, AI Platform Operations, Responsible AI/Governance, or Automation Engineering. Do not imply frontier-model research, reward-model training, or research-scientist depth without direct evidence.
- Describe operational AI evaluation work as converting real-world quality gaps into defensible signals, repeatable review methods, production controls, or actionable improvement loops when supported.
- Make the CV clear to HR, recruiters, and hiring managers: every section should answer why this candidate is worth interviewing and can create business value quickly.
- Do not directly mention salary expectations; express compensation strength through scope, outcomes, and credibility.
- Work bullets: use Action Verb + Scope/Task + Business Outcome. Add a metric only when it proves impact or meaningful responsibility scope.
- Each bullet should be 18-32 words when possible, max 38 words.
- Target 8-10 strong work bullets for the primary current role when the selected evidence supports it; do not exceed 10 unless the JD explicitly requires a deeper technical appendix.
- Target 12-16 total work bullets across two pages: 7-9 primary-role bullets and 2-3 bullets for each relevant prior role. Quality and prioritization matter more than filling space.
- The first 6 work bullets must be the strongest recruiter-facing proof points for this JD, not chronological task notes.
- Prioritize bullets that show business impact: reduced manual work, governed access, production reliability, risk control, KPI visibility, stakeholder adoption, UAT closure, and decision support.
- Translate internal implementation labels into external business value.
- Classify every number before using it:
  1. Impact metric: improvement, reduction, adoption, time/cost saved, error/risk reduction, quality lift, throughput, or business result. Prefer these.
  2. Scope metric: users, regions, markets, stakeholders, systems, workflows, or governed portfolio size. Use sparingly when it proves seniority or responsibility.
  3. Diagnostic/test data: benchmark scores, A/B variant percentages, sample ratios, review sample sizes, model comparisons, test parameters, or validation cases. These are methodology, not achievements; normally omit exact values.
  4. Internal activity data: release dates, version numbers, ticket/change counts, reviewer access counts, record checks, page counts, field counts, or internal project codes. Omit unless it clearly proves externally meaningful scale or outcome.
- Never append a parenthetical dump of multiple numbers. Use at most one concise metric clause per bullet.
- Do not put semicolon-separated numbers or two or more numeric facts in one bullet.
- Do not use a project milestone, test setting, inventory count, implementation component count, or operating activity count as the bullet's result.
- A metric is Impact only when it demonstrates a changed business outcome attributable to the candidate. A metric is Scope only when it demonstrates meaningful responsibility breadth. Everything else is interview evidence.
- Apply the "so what" test: if a number does not show business impact, ownership scope, risk reduction, or decision value, remove the number and state the grounded qualitative outcome.
- For evaluation work, describe the evaluation framework, cross-market methodology, quality decision enabled, and production relevance. Do not list every model score or sample setting in the CV; preserve those for interview notes.
- The bullet.metric field may contain only an Impact metric or a concise Scope metric. Leave it empty for diagnostic/test data and internal activity counts.
- Make Power Platform depth explicit where supported: Power Apps, Power Automate, Dataverse, SharePoint, Power BI, APIs, UAT, production support, access control, and governance.
- Compress low-relevance research, lab, or platform-comparison details unless they directly support automation, analytics, process ownership, or stakeholder delivery.
- Use 3-4 formal subsections for the primary current role when evidence supports distinct themes.
- Each subsection should have 2-4 bullets only; merge duplicates and cut low-signal details.
- Include 2-4 bullets for each relevant prior role when source material exists, rewritten to support the target JD instead of copied raw.
- Prior roles should not be empty placeholders. If details are sparse, use concise but specific bullets from grounded source facts.
- Include prior roles, education, certifications, languages, and focused skill groups when present in the career profile.
- Keep sidebar.skillGroups focused: 4 groups maximum, 6-8 skills per group maximum, only high-signal ATS / positioning skills.
- Do not list too many tools inside bullets; move only the strongest tools into sidebar.skillGroups and omit low-priority tools.
- Use domainKnowledge to add business context to bullets when it strengthens JD fit.
- Avoid generic adjectives such as passionate, proactive, dynamic, excellent, responsible for.
- Tone should be natural, credible, and human, not dramatic or over-polished.
- ATS keyword usage must be natural; no keyword stuffing.

Visible CV structure requirements:
- header: candidate name, target role, email, location.
- sidebar: Languages, Core Skills, Education, Certifications when available.
- main page 1: Summary + current/most relevant role with enough selected impact to feel substantive.
- main page 2: remaining current-role subsections + prior roles. Keep the second page useful; do not leave it visually empty.
- Work Experience is the only main CV section needed unless the JSON schema later supports more sections. Integrate STAR/story/domain material into the role subsections.
- Use section titles that describe business value, such as "Power Platform Development, Governance & Automation", "Analytics, Reporting & UAT", "Production Support & Stakeholder Enablement".
- Do not put audit comments, caveats, relocation concerns, or internal review notes into visible CV sections. Put those only in reviewNotes.

Schema:
{
  "tailoredCv": {
    "jdAnalysis": {
      "targetRole": "",
      "coreRequirements": [],
      "topKeywords": [
        { "keyword": "", "priority": "Must-have|Important|Nice-to-have", "placement": "Summary|Skills|Work Experience" }
      ],
      "gaps": []
    },
    "header": {
      "name": "",
      "targetRole": "",
      "email": "",
      "location": ""
    },
    "sidebar": {
      "languages": [{ "name": "", "level": "", "note": "" }],
      "skillGroups": [{ "title": "", "highlightedSkills": [], "otherSkills": [] }],
      "certifications": [],
      "education": [{ "school": "", "degree": "", "period": "" }]
    },
    "summary": "",
    "workExperience": [
      {
        "experienceId": "",
        "company": "",
        "role": "",
        "period": "",
        "location": "",
        "subsections": [
          {
            "title": "",
            "bullets": [
              { "text": "", "metric": "", "metricType": "Impact|Scope|None", "evidenceIds": [], "confidence": "Grounded" }
            ]
          }
        ]
      }
    ],
    "keywordPlacementNotes": [],
    "interviewNotes": [
      { "topic": "", "details": "Diagnostic/test data, internal numbers, or methodology useful for interview discussion but excluded from the visible CV.", "evidenceIds": [] }
    ],
    "reviewNotes": []
  }
}

JD:
${JSON.stringify(job?.parsed || job?.rawJD || {}, null, 2)}

Career profile:
${JSON.stringify(data.careerProfile, null, 2)}

Selected evidence:
${JSON.stringify(evidence, null, 2)}

Reference-only evidence (do not use in visible CV; use only to explain review gaps):
${JSON.stringify(referenceOnlyEvidence, null, 2)}

Selected skill signals:
${JSON.stringify(selectedSkills, null, 2)}

Selected domain knowledge:
${JSON.stringify(selectedDomainKnowledge, null, 2)}

Selection audit:
${JSON.stringify({
  selectedSkillCount: selectedSkills.length,
  selectedDomainKnowledgeCount: selectedDomainKnowledge.length,
  skillPolicy: selectedSkills.length ? "Use only selected skill signals." : "No skill signals were selected. Do not infer broad skills from the full career database; ask for selections or keep skills conservative.",
  domainPolicy: selectedDomainKnowledge.length ? "Use only selected domain knowledge." : "No domain knowledge was selected. Do not infer broad domain claims from the full career database; keep domain wording conservative."
}, null, 2)}

Selected STAR stories:
${JSON.stringify(stories, null, 2)}

Reference-only STAR stories (do not use in visible CV):
${JSON.stringify(referenceOnlyStories, null, 2)}

Remember: return raw JSON only. No markdown, no code fence, no prose.`;
}
