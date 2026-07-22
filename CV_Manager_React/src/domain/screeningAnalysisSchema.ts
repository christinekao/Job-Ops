function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value as Record<string, unknown>).sort()
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

type StringSchema = { type: "string"; description: string; enum?: readonly string[] };
type NumberSchema = { type: "number"; description: string };
type BooleanSchema = { type: "boolean"; description: string };
type ArraySchema = { type: "array"; description: string; items: SchemaNode };
type ObjectSchema = {
  type: "object";
  description: string;
  properties: Record<string, SchemaNode>;
  required: readonly string[];
  additionalProperties: false;
};
export type SchemaNode = StringSchema | NumberSchema | BooleanSchema | ArraySchema | ObjectSchema;

type InferSchema<S> =
  S extends { type: "string"; enum: readonly (infer E)[] } ? E :
  S extends { type: "string" } ? string :
  S extends { type: "number" } ? number :
  S extends { type: "boolean" } ? boolean :
  S extends { type: "array"; items: infer I } ? InferSchema<I>[] :
  S extends { type: "object"; properties: infer P extends Record<string, SchemaNode>; required: readonly (infer R)[] }
    ? { [K in keyof P as K extends R ? K : never]-?: InferSchema<P[K]> }
      & { [K in keyof P as K extends R ? never : K]?: InferSchema<P[K]> }
    : never;

const string = (description: string): StringSchema => ({ type: "string", description });
const enumString = <T extends readonly string[]>(description: string, values: T) =>
  ({ type: "string", description, enum: values } as const);
const boolean = (description: string): BooleanSchema => ({ type: "boolean", description });
const number = (description: string): NumberSchema => ({ type: "number", description });
const array = <T extends SchemaNode>(description: string, items: T) =>
  ({ type: "array", description, items } as const);
const object = <P extends Record<string, SchemaNode>, R extends readonly (keyof P & string)[]>(
  description: string,
  properties: P,
  required: R
) => ({ type: "object", description, properties, required, additionalProperties: false } as const);
const strings = (description: string) => array(description, string("One exact, source-grounded value."));

const risk = enumString("Risk severity.", ["High", "Medium", "Low"] as const);
const confidence = enumString("Evidence-grounded confidence.", ["High", "Medium", "Low"] as const);

export const SCREENING_AI_SCHEMA_VERSION = "2.1.0";

export const screeningAnalysisAIOutputSchema = object(
  "Canonical AI-decided Screening Analysis. Derived views and execution metadata are excluded.",
  {
    primaryTargetTitle: string("Best truthful target title for this JD."),
    backupTargetTitles: strings("Alternative truthful target titles."),
    jdBreakdown: object("Structured target-JD interpretation.", {
      roleSummary: string("Plain-language explanation of the role."),
      coreResponsibilities: strings("Main work performed by the role."),
      requiredSkills: object("Required skill categories.", {
        technical: strings("Technical skills."),
        business: strings("Business skills."),
        communication: strings("Communication skills."),
        domainKnowledge: strings("Domain knowledge."),
        toolsPlatforms: strings("Tools and platforms."),
        processMethodology: strings("Processes and methodologies.")
      }, ["technical", "business", "communication", "domainKnowledge", "toolsPlatforms", "processMethodology"]),
      senioritySignals: strings("Ownership, ambiguity, stakeholder, delivery, and depth signals."),
      hiddenHiringPriorities: strings("Clearly implied hiring priorities."),
      atsKeywords: object("JD-grounded ATS terms.", {
        exact: strings("Exact JD terms."),
        related: strings("Supported related terms."),
        tools: strings("Tool terms."),
        jobTitles: strings("Title terms."),
        skills: strings("Skill terms."),
        domain: strings("Domain terms."),
        responsibilities: strings("Responsibility terms."),
        methodology: strings("Methodology terms.")
      }, ["exact", "related", "tools", "jobTitles", "skills", "domain", "responsibilities", "methodology"])
    }, ["roleSummary", "coreResponsibilities", "requiredSkills", "senioritySignals", "hiddenHiringPriorities", "atsKeywords"]),
    jobClassification: object("Market classification of the JD, independent of candidate positioning.", {
      marketRoleFamily: enumString("JD market role family.", ["SOFTWARE_ENGINEERING", "PLATFORM_ENGINEERING", "DATA_ENGINEERING", "BI_ANALYTICS", "SOLUTION_ENGINEERING", "TECHNICAL_CONSULTING", "TECHNICAL_TRAINING", "PRODUCT_OPERATIONS", "AI_PRODUCT_OPERATIONS", "BUSINESS_AUTOMATION", "POWER_PLATFORM", "HRIS_ENTERPRISE_APPLICATIONS", "SECURITY_GOVERNANCE", "RESEARCH_SCIENTIFIC", "OTHER"] as const),
      aiMarketArchetype: enumString("JD AI archetype.", ["AI_AUTOMATION", "POWER_PLATFORM_AI_AUTOMATION", "AI_DEPLOYMENT_FDE", "AI_EVALUATION_OPS", "GENAI_APPLICATION", "PURE_AI_ML", "NOT_APPLICABLE"] as const),
      classificationRationale: string("JD-grounded classification rationale.")
    }, ["marketRoleFamily", "aiMarketArchetype", "classificationRationale"]),
    candidatePositioning: object("Safest candidate positioning for this JD; never a JD role-family classification.", {
      primaryHiringProblem: string("Primary manager problem to solve."),
      managerHireReason: string("Evidence-grounded reason to hire."),
      toolApplicationAngle: string("Truthful tool-application angle."),
      positioningRationale: strings("Reasons supporting the positioning."),
      safestPositioning: string("Safest evidence-grounded positioning."),
      headlineRecommendation: string("Recommended truthful headline."),
      whyThisFits: strings("Evidence-grounded fit reasons."),
      hiddenSkillsToSurface: strings("Supported skills worth surfacing."),
      evidenceToSuppress: strings("Evidence details unsafe for visible use."),
      claimsToAvoid: strings("Claims not supported by evidence."),
      interviewRiskQuestions: strings("Likely risk questions.")
    }, ["safestPositioning", "headlineRecommendation", "whyThisFits", "hiddenSkillsToSurface", "evidenceToSuppress", "claimsToAvoid", "interviewRiskQuestions"]),
    managerIntent: object("Inferred hiring-manager intent grounded in the JD.", {
      actualJobToBeDone: string("Actual job to be done."),
      hiringManagerPainPoints: strings("Manager pain points."),
      successSignals: strings("Success signals."),
      dealBreakers: strings("Deal breakers."),
      overqualificationRisks: strings("Overqualification risks.")
    }, ["actualJobToBeDone", "hiringManagerPainPoints", "successSignals", "dealBreakers", "overqualificationRisks"]),
    marketReferenceSignals: array("Signals from supplied Market JD References only.", object("One cited market signal.", {
      sourceIds: strings("Exact supplied Market JD Reference source IDs."),
      observedRolePattern: string("Observed role pattern."),
      observedRequiredCapabilities: strings("Observed required capabilities."),
      observedScreeningKeywords: strings("Observed screening keywords."),
      observedDealBreakers: strings("Observed deal breakers."),
      relevanceToThisJd: string("Relevance to the target JD.")
    }, ["sourceIds", "observedRolePattern", "observedRequiredCapabilities", "observedScreeningKeywords", "observedDealBreakers", "relevanceToThisJd"])),
    requirementMatrix: array("Every supplied normalized requirement classified exactly once.", object("One canonical requirement classification.", {
      requirementId: string("Exact supplied stable requirement ID; never invent one."),
      requirement: string("Requirement text."),
      normalizedRequirement: string("Exact supplied normalized requirement text."),
      sourceSection: enumString("Primary supplied source section.", ["responsibilities", "requirements", "preferredQualifications", "workSite", "location", "travel"] as const),
      atomicDimension: enumString("Exact supplied independently classifiable expectation dimension.", ["RESPONSIBILITY", "CAPABILITY", "DEGREE_ATTAINMENT", "DEGREE_FIELD", "EXPERIENCE_YEARS", "CODING_DEPTH", "EXPERIMENTATION_PLATFORM", "AB_TESTING", "STATISTICAL_ANALYSIS", "FORMAL_CONSTRAINT"] as const),
      expectedAspects: strings("Exact supplied aspects that remain one requirement, such as language or platform alternatives."),
      marketExpectation: string("What the requirement expects."),
      matchingEvidenceIds: strings("Use only exact Evidence IDs supplied in context."),
      matchingSkillIds: strings("Use only exact Skill IDs supplied in context."),
      matchingStoryIds: strings("Use only exact Story IDs supplied in context."),
      matchingEducationIds: strings("Use only exact Education IDs supplied in context."),
      matchingDomainKnowledgeIds: strings("Use only exact Domain Knowledge IDs supplied in context."),
      importance: enumString("Requirement importance.", ["CORE_RESPONSIBILITY", "REQUIRED_CAPABILITY", "PREFERRED_CAPABILITY", "FORMAL_REQUIREMENT", "SUPPLEMENTAL_SIGNAL"] as const),
      matchStatus: enumString("Classify exactly once. CORE_CAPABILITY_GAP cannot be cancelled by keyword overlap.", ["DIRECT_MATCH", "TRANSFERABLE_MATCH", "PARTIAL_MATCH", "LEARNABLE_GAP", "CORE_CAPABILITY_GAP", "FORMAL_SCREENING_RISK"] as const),
      supportedAspects: strings("Supported aspects."),
      unsupportedAspects: strings("Unsupported aspects."),
      transferContext: string("Source-to-target context difference for transferable evidence."),
      explanation: string("Evidence-grounded classification explanation."),
      confidence,
      cvUsage: enumString("Permitted CV usage.", ["PRIORITIZE", "SUPPORTING", "CONSERVATIVE_POSITIONING", "DO_NOT_CLAIM", "FORBIDDEN"] as const),
      interviewUsage: enumString("Permitted interview usage.", ["LEAD_STORY", "SUPPORTING_STORY", "EXPLAIN_TRANSFER", "DISCLOSE_GAP", "DO_NOT_USE"] as const),
      hardBlock: boolean("True only for an unavoidable legal or practical restriction."),
      hardBlockReason: string("Required reason when hardBlock is true; otherwise empty.")
    }, ["requirementId", "requirement", "normalizedRequirement", "sourceSection", "atomicDimension", "expectedAspects", "marketExpectation", "matchingEvidenceIds", "matchingSkillIds", "matchingStoryIds", "matchingEducationIds", "matchingDomainKnowledgeIds", "importance", "matchStatus", "supportedAspects", "unsupportedAspects", "transferContext", "explanation", "confidence", "cvUsage", "interviewUsage", "hardBlock", "hardBlockReason"])),
    opportunityAnalysis: object("Matrix-consistent opportunity and transition analysis.", {
      whyCandidateCouldWin: strings("Evidence-grounded reasons the candidate could win."),
      differentiatedStrengths: strings("Differentiated supported strengths."),
      credibleTransferableStrengths: strings("Credible transferable strengths with context boundaries."),
      learnableGaps: strings("Only genuinely learnable short-term gaps."),
      coreRisks: strings("Core capability and formal risks."),
      credibleOverlaps: strings("Real evidence-backed overlaps."),
      whyCoreFitIsLow: strings("Why core Fit is low when applicable."),
      coreUnbridgeableShortTermGaps: strings("Core gaps that cannot be bridged quickly."),
      betterAdjacentRoles: strings("Evidence-related adjacent roles, not direct-fit claims."),
      futureTransitionPath: strings("Evidence-building transition path."),
      cvPositioning: string("Safe CV positioning."),
      interviewPositioning: strings("Truthful interview positioning."),
      recommendedPreparation: strings("Recommended preparation.")
    }, ["whyCandidateCouldWin", "differentiatedStrengths", "credibleTransferableStrengths", "learnableGaps", "coreRisks", "credibleOverlaps", "whyCoreFitIsLow", "coreUnbridgeableShortTermGaps", "betterAdjacentRoles", "futureTransitionPath", "cvPositioning", "interviewPositioning", "recommendedPreparation"]),
    internalTerminology: array("Internal terms needing recruiter-safe treatment.", object("One terminology decision.", {
      originalTerm: string("Original term."),
      externalFriendlyWording: string("Recruiter-readable wording."),
      audience: string("External audience."),
      businessFunction: string("Business function."),
      usageDecision: enumString("Required treatment.", ["Keep with explanation", "Replace", "Remove"] as const),
      reason: string("Reason for the treatment.")
    }, ["originalTerm", "externalFriendlyWording", "audience", "businessFunction", "usageDecision", "reason"])),
    qualityTargets: array("Quality criteria for this JD.", object("One quality target.", {
      criterion: string("Criterion."),
      score: number("Current 0-5 score."),
      weakness: string("Weakness."),
      improvement: string("Improvement.")
    }, ["criterion", "score", "weakness", "improvement"])),
    ambiguousSignals: array("Ambiguous JD signals decoded for CV use.", object("One ambiguous signal.", {
      jdPhrase: string("JD phrase."),
      likelyScreeningMeaning: string("Likely screening meaning."),
      howToShowItInCv: string("Safe CV treatment.")
    }, ["jdPhrase", "likelyScreeningMeaning", "howToShowItInCv"])),
    likelyInterviewQuestionThemes: strings("Likely interview themes."),
    mustHaveKeywords: strings("Supported must-have JD keywords."),
    supportingKeywords: strings("Supported secondary keywords."),
    missingKeywords: strings("Important JD keywords not supported by visible evidence."),
    riskyClaims: strings("Claims that available evidence does not safely support."),
    mustHaveSignals: strings("Signals the CV must show."),
    summaryAngle: string("Evidence-grounded summary direction."),
    recommendedNextAction: string("Recommended next user-controlled action.")
  },
  ["primaryTargetTitle", "jdBreakdown", "jobClassification", "candidatePositioning", "managerIntent", "marketReferenceSignals", "requirementMatrix", "opportunityAnalysis", "internalTerminology", "mustHaveKeywords", "missingKeywords", "riskyClaims", "summaryAngle"]
);

export type ScreeningAnalysisAIOutput = InferSchema<typeof screeningAnalysisAIOutputSchema>;

export function normalizePromptSchema<T extends SchemaNode>(schema: T): T {
  return JSON.parse(stableStringify(schema)) as T;
}

export const screeningAnalysisPromptJsonSchema = normalizePromptSchema(screeningAnalysisAIOutputSchema);
export function compactPromptSchemaSerializer(schema: SchemaNode): string {
  const compact = (node: SchemaNode): Record<string, unknown> => {
    if (node.type === "object") return {
      type: "object",
      additionalProperties: false,
      ...(node.description ? { description: node.description } : {}),
      required: [...node.required],
      properties: Object.fromEntries(Object.entries(node.properties).map(([key, value]) => [key, compact(value)]))
    };
    if (node.type === "array") return {
      type: "array",
      ...(node.description ? { description: node.description } : {}),
      items: compact(node.items)
    };
    return {
      type: node.type,
      ...(node.description && node.description !== "One exact, source-grounded value." ? { description: node.description } : {}),
      ...("enum" in node && node.enum ? { enum: [...node.enum] } : {})
    };
  };
  return stableStringify(compact(schema));
}
export const screeningAnalysisPromptSchemaContract = compactPromptSchemaSerializer(screeningAnalysisAIOutputSchema);
export const screeningAiSchemaHash = contentHash(screeningAnalysisPromptJsonSchema);

export function screeningAnalysisIdentityMatches(
  run: { inputHash?: string; schemaHash?: string; promptHash?: string } | undefined,
  currentInputHash: string,
  currentPromptHash: string
) {
  return Boolean(
    run
    && run.inputHash === currentInputHash
    && run.schemaHash === screeningAiSchemaHash
    && run.promptHash === currentPromptHash
  );
}

export type SchemaValidationIssue = { path: string; expected: string; received: string; guidance: string };
export type SchemaValidationResult<T> =
  | { success: true; data: T; issues: [] }
  | { success: false; issues: SchemaValidationIssue[] };

function validateNode(schema: SchemaNode, value: unknown, path: string, issues: SchemaValidationIssue[]) {
  const received = value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
  const fail = (expected: string) => issues.push({
    path: path || "$",
    expected,
    received,
    guidance: `Correct ${path || "the root value"} and parse again. No data was applied.`
  });
  if (schema.type === "string") {
    if (typeof value !== "string") fail(schema.enum ? `one of: ${schema.enum.join(", ")}` : "string");
    else if (schema.enum && !schema.enum.includes(value)) fail(`one of: ${schema.enum.join(", ")}`);
    return;
  }
  if (schema.type === "number") {
    if (typeof value !== "number" || !Number.isFinite(value)) fail("finite number");
    return;
  }
  if (schema.type === "boolean") {
    if (typeof value !== "boolean") fail("boolean");
    return;
  }
  if (schema.type === "array") {
    if (!Array.isArray(value)) return fail("array");
    value.forEach((item, index) => validateNode(schema.items, item, `${path}[${index}]`, issues));
    return;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return fail("object");
  const record = value as Record<string, unknown>;
  for (const key of schema.required) {
    if (!Object.prototype.hasOwnProperty.call(record, key)) issues.push({
      path: path ? `${path}.${key}` : key,
      expected: "required field",
      received: "missing",
      guidance: `Add ${path ? `${path}.` : ""}${key} using the current Prompt contract, then parse again.`
    });
  }
  for (const key of Object.keys(record)) {
    if (!Object.prototype.hasOwnProperty.call(schema.properties, key)) issues.push({
      path: path ? `${path}.${key}` : key,
      expected: "known schema field",
      received: "unknown field",
      guidance: `Remove ${path ? `${path}.` : ""}${key}; legacy or unknown fields cannot be applied.`
    });
    else validateNode(schema.properties[key], record[key], path ? `${path}.${key}` : key, issues);
  }
}

export function validateScreeningAnalysisAIOutput(value: unknown): SchemaValidationResult<ScreeningAnalysisAIOutput> {
  const issues: SchemaValidationIssue[] = [];
  validateNode(screeningAnalysisAIOutputSchema, value, "", issues);
  return issues.length ? { success: false, issues } : { success: true, data: value as ScreeningAnalysisAIOutput, issues: [] };
}

export function parseScreeningAnalysisAIOutput(value: string): {
  raw: string;
  parsed: ScreeningAnalysisAIOutput | null;
  error: string;
  warning?: string;
} {
  const raw = value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  let candidate: unknown;
  try {
    candidate = JSON.parse(raw);
  } catch (error) {
    return { raw, parsed: null, error: error instanceof Error ? `Invalid JSON: ${error.message}` : "Invalid JSON." };
  }
  const validated = validateScreeningAnalysisAIOutput(candidate);
  if (!validated.success) {
    return {
      raw,
      parsed: null,
      error: validated.issues
        .slice(0, 8)
        .map((issue) => `${issue.path}: expected ${issue.expected}; received ${issue.received}. ${issue.guidance}`)
        .join("\n")
    };
  }
  return { raw, parsed: validated.data, error: "" };
}

export function validateScreeningAnalysisSemantics(
  value: ScreeningAnalysisAIOutput,
  context: {
    requirementIds: ReadonlySet<string>;
    requirements?: ReadonlyMap<string, {
      normalizedText: string;
      sourceSection: string;
      atomicDimension: string;
      expectedAspects: readonly string[];
      sourceImportanceHint?: string;
    }>;
    evidenceIds: ReadonlySet<string>;
    skillIds: ReadonlySet<string>;
    storyIds: ReadonlySet<string>;
    educationIds: ReadonlySet<string>;
    domainKnowledgeIds: ReadonlySet<string>;
  }
): SchemaValidationIssue[] {
  const issues: SchemaValidationIssue[] = [];
  const seen = new Set<string>();
  value.requirementMatrix.forEach((row, index) => {
    const path = `requirementMatrix[${index}]`;
    if (!context.requirementIds.has(row.requirementId)) {
      issues.push({ path: `${path}.requirementId`, expected: "exact supplied requirement ID", received: row.requirementId, guidance: "Use only an ID from the Normalized Requirement Inventory." });
    } else if (seen.has(row.requirementId)) {
      issues.push({ path: `${path}.requirementId`, expected: "one classification per requirement ID", received: "duplicate", guidance: "Remove the duplicate row; do not merge or silently discard classifications." });
    }
    seen.add(row.requirementId);
    const supplied = context.requirements?.get(row.requirementId);
    if (supplied) {
      if (row.normalizedRequirement !== supplied.normalizedText) {
        issues.push({ path: `${path}.normalizedRequirement`, expected: "exact supplied atomic requirement text", received: row.normalizedRequirement, guidance: "Copy normalizedText exactly from the canonical inventory." });
      }
      if (row.sourceSection !== supplied.sourceSection || row.atomicDimension !== supplied.atomicDimension) {
        issues.push({ path, expected: "exact supplied sourceSection and atomicDimension", received: `${row.sourceSection}/${row.atomicDimension}`, guidance: "Copy code-owned requirement semantics exactly; do not reclassify source lineage." });
      }
      if (JSON.stringify(row.expectedAspects) !== JSON.stringify(supplied.expectedAspects)) {
        issues.push({ path: `${path}.expectedAspects`, expected: "exact supplied aspects", received: JSON.stringify(row.expectedAspects), guidance: "Copy expectedAspects exactly; alternatives must remain within one atomic requirement." });
      }
      if (supplied.sourceImportanceHint === "FORMAL_REQUIREMENT" || supplied.atomicDimension === "FORMAL_CONSTRAINT") {
        if (row.importance !== "FORMAL_REQUIREMENT" || row.matchStatus !== "FORMAL_SCREENING_RISK" || row.cvUsage !== "DO_NOT_CLAIM") {
          issues.push({ path, expected: "FORMAL_REQUIREMENT / FORMAL_SCREENING_RISK / DO_NOT_CLAIM", received: `${row.importance}/${row.matchStatus}/${row.cvUsage}`, guidance: "Formal constraints are screening risks, not capability Fit gaps or CV claims." });
        }
      }
    }
    const requiresEvidence = row.matchStatus === "DIRECT_MATCH" || row.matchStatus === "TRANSFERABLE_MATCH";
    const supportCount = row.matchingEvidenceIds.length + row.matchingSkillIds.length + row.matchingStoryIds.length
      + row.matchingEducationIds.length + row.matchingDomainKnowledgeIds.length;
    if (requiresEvidence && supportCount === 0) {
      issues.push({ path, expected: "at least one exact supplied supporting ID", received: "all supporting ID arrays empty", guidance: "Use an exact supplied ID or classify the requirement as a truthful gap." });
    }
    const checkIds = (ids: string[], allowed: ReadonlySet<string>, field: string) => ids.forEach((id) => {
      if (!allowed.has(id)) issues.push({ path: `${path}.${field}`, expected: `exact supplied ${field} ID`, received: id, guidance: "Remove the invented/unknown ID and use only IDs from the supplied context." });
    });
    checkIds(row.matchingEvidenceIds, context.evidenceIds, "matchingEvidenceIds");
    checkIds(row.matchingSkillIds, context.skillIds, "matchingSkillIds");
    checkIds(row.matchingStoryIds, context.storyIds, "matchingStoryIds");
    checkIds(row.matchingEducationIds, context.educationIds, "matchingEducationIds");
    checkIds(row.matchingDomainKnowledgeIds, context.domainKnowledgeIds, "matchingDomainKnowledgeIds");
    if (row.matchStatus === "TRANSFERABLE_MATCH" && !row.transferContext.trim()) {
      issues.push({ path: `${path}.transferContext`, expected: "non-empty source-to-target context", received: "empty string", guidance: "Explain the context difference without claiming direct target experience." });
    }
    if (row.matchStatus === "PARTIAL_MATCH" && (!row.supportedAspects.length || !row.unsupportedAspects.length)) {
      issues.push({ path, expected: "both supportedAspects and unsupportedAspects", received: "incomplete partial match", guidance: "State both sides of the partial match." });
    }
    if (row.matchStatus === "CORE_CAPABILITY_GAP" && row.cvUsage === "PRIORITIZE") {
      issues.push({ path: `${path}.cvUsage`, expected: "non-prioritized truthful gap treatment", received: "PRIORITIZE", guidance: "Do not prioritize a core capability gap as a current claim." });
    }
    if (row.hardBlock && !row.hardBlockReason.trim()) {
      issues.push({ path: `${path}.hardBlockReason`, expected: "unavoidable legal/practical reason", received: "empty string", guidance: "Explain the unavoidable restriction or set hardBlock to false." });
    }
  });
  for (const id of context.requirementIds) {
    if (!seen.has(id)) issues.push({ path: "requirementMatrix", expected: `classification for ${id}`, received: "missing", guidance: "Classify every supplied requirement exactly once." });
  }
  const coreGaps = new Set(value.requirementMatrix.filter((row) => row.matchStatus === "CORE_CAPABILITY_GAP").map((row) => row.normalizedRequirement.toLowerCase()));
  value.opportunityAnalysis.learnableGaps.forEach((gap) => {
    if (coreGaps.has(gap.toLowerCase())) issues.push({ path: "opportunityAnalysis.learnableGaps", expected: "no core capability gaps", received: gap, guidance: "Move core gaps to coreRisks and the transition path." });
  });
  return issues;
}

export function createScreeningAnalysisStoredResult(value: ScreeningAnalysisAIOutput) {
  const supportLevelFor = (status: ScreeningAnalysisAIOutput["requirementMatrix"][number]["matchStatus"]) =>
    status === "DIRECT_MATCH" ? "Strong" as const
      : status === "TRANSFERABLE_MATCH" || status === "PARTIAL_MATCH" ? "Partial" as const
        : status === "LEARNABLE_GAP" ? "Weak" as const : "Unsupported" as const;
  const applyTier = value.requirementMatrix.some((row) => row.hardBlock || row.matchStatus === "CORE_CAPABILITY_GAP")
    ? "Avoid" as const
    : value.requirementMatrix.some((row) => row.matchStatus === "PARTIAL_MATCH" || row.matchStatus === "LEARNABLE_GAP" || row.matchStatus === "FORMAL_SCREENING_RISK")
      ? "Stretch" as const
      : "Good" as const;
  return {
    ...value,
    positioning: {
      ...value.candidatePositioning,
      roleType: "Other" as const,
      aiMarketArchetype: value.jobClassification.aiMarketArchetype,
      applyTier
    },
    jdEvidenceMapping: value.requirementMatrix.map((row) => ({
      ...row,
      safeCvAngle: row.cvUsage,
      gapOrRisk: row.unsupportedAspects.join("; "),
      supportLevel: supportLevelFor(row.matchStatus)
    })),
    remainingGaps: value.requirementMatrix
      .filter((row) => ["PARTIAL_MATCH", "LEARNABLE_GAP", "CORE_CAPABILITY_GAP", "FORMAL_SCREENING_RISK"].includes(row.matchStatus))
      .map((row) => ({ gap: row.normalizedRequirement, riskLevel: row.matchStatus === "CORE_CAPABILITY_GAP" ? "High" as const : "Medium" as const, mitigation: row.explanation })),
    recommendedSkillIds: [...new Set(value.requirementMatrix.flatMap((row) => row.matchingSkillIds))],
    recommendedDomainKnowledgeIds: [...new Set(value.requirementMatrix.flatMap((row) => row.matchingDomainKnowledgeIds))],
    recommendedEvidenceIds: [...new Set(value.requirementMatrix.flatMap((row) => row.matchingEvidenceIds))],
    recommendedStoryIds: [...new Set(value.requirementMatrix.flatMap((row) => row.matchingStoryIds))]
  };
}

export function adaptLegacyScreeningAnalysisForRead<T>(
  value: T,
  run: { schemaHash?: string } | undefined
) {
  return { value, legacy: Boolean(value && run?.schemaHash !== screeningAiSchemaHash) };
}

export function createScreeningSchemaDriftFixture() {
  const fixture = (field: SchemaNode | null, required: boolean) => {
    const properties: Record<string, SchemaNode> = field ? { testOnlyField: field } : {};
    const schema = object("Isolated drift fixture.", properties, required && field ? ["testOnlyField"] : []);
    return {
      contract: normalizePromptSchema(schema),
      hash: contentHash(normalizePromptSchema(schema)),
      validate(value: unknown) {
        const issues: SchemaValidationIssue[] = [];
        validateNode(schema, value, "", issues);
        return { success: issues.length === 0, issues };
      }
    };
  };
  return {
    base: fixture(null, false),
    added: fixture(enumString("Test-only enum.", ["A", "B"] as const), true),
    removed: fixture(null, false),
    enumChanged: fixture(enumString("Test-only enum.", ["A", "C"] as const), true),
    requiredChanged: fixture(enumString("Test-only enum.", ["A", "B"] as const), false)
  };
}
