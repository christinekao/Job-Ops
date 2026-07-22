import type { AppData, ApplicationStatus, CvVersion, JobApplication, ParsedJD } from "../types";
import { contentHash } from "../utils/hash";
import { uid } from "../utils/ids";

export const REQUIREMENT_INVENTORY_POLICY_VERSION = "p15r2-atomic-formal-semantics-v1";

export type NormalizedRequirementSource =
  | "responsibilities" | "requirements" | "preferredQualifications"
  | "workSite" | "location" | "travel";

export type RequirementAtomicDimension =
  | "RESPONSIBILITY" | "CAPABILITY" | "DEGREE_ATTAINMENT" | "DEGREE_FIELD"
  | "EXPERIENCE_YEARS" | "CODING_DEPTH" | "EXPERIMENTATION_PLATFORM"
  | "AB_TESTING" | "STATISTICAL_ANALYSIS" | "FORMAL_CONSTRAINT";

export type RequirementSourceReference = {
  sourceSection: NormalizedRequirementSource;
  sourceIndex: number;
  sourceIndices: number[];
  sourceText: string;
  rawFragments: string[];
};

export type ReconstructedSourceStatement = {
  parentSourceRequirementId: string;
  sourceSection: NormalizedRequirementSource;
  sourceIndex: number;
  sourceIndices: number[];
  rawFragments: string[];
  reconstructedText: string;
  reconstructionReasons: string[];
  sourceImportanceHint: NormalizedRequirement["sourceImportanceHint"];
};

export type NormalizedRequirement = {
  requirementId: string;
  canonicalKey: string;
  sourceSection: NormalizedRequirementSource;
  sourceIndex: number;
  originalText: string;
  normalizedText: string;
  atomicDimension: RequirementAtomicDimension;
  expectedAspects: string[];
  pathwayGroupId?: string;
  pathwayMetadata?: {
    parentSourceRequirementId: string;
    alternativePathways: string[][];
    pathwayConditions: string[];
  };
  parentSourceRequirementIds: string[];
  parentSourceText: string[];
  sourceReferences: RequirementSourceReference[];
  sourceImportanceHint: "CORE_RESPONSIBILITY" | "REQUIRED_CAPABILITY" | "PREFERRED_CAPABILITY" | "FORMAL_REQUIREMENT" | "SUPPLEMENTAL_SIGNAL";
};

const terminalPunctuation = /[.!?。！？]$/;
const explicitContinuation = /^(?:and(?:\/or)?|or|including|such as|as well as|plus|with|to|for|of|in|on|at|by|from|take responsibility|product managers?|privacy|security|site reliability|customer|government|tooling improvements?|create design|ensure performance|resolve complex|conduct incident|improve troubleshooting|leading code reviews?|A\/B testing|statistical analysis|C(?:\+\+|#)?|Java(?:Script)?|Python|Azure|AWS|GCP|logging|metrics|distributed tracing|telemetry|reliability|scalability|resiliency|fault tolerance|deployment|monitoring|performance|testability|stability|maintainable|well-tested|secure|performant|cost-effectiveness|end-to-end tested)\b/i;
const fragmentOnly = /^(?:reliable|scalable|secure|performant|maintainable|well-tested|stability|performance|testability|resiliency|scalability|telemetry|monitoring|deployment|customer|security|privacy|C|C\+\+|C#|Java|JavaScript|Python|Azure|AWS|GCP)$/i;

function normalizeSemanticText(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function punctuationInsensitive(value: string) {
  return normalizeSemanticText(value)
    .toLowerCase()
    .replace(/\b(a|an|the)\b/g, " ")
    .replace(/[^a-z0-9+#/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isFormalConstraintText(value: string) {
  return /(?:security screening|background check|work authorization|visa|citizenship|legal certification|mandatory certification)/i.test(value);
}

function sourceImportance(section: NormalizedRequirementSource, text = ""): NormalizedRequirement["sourceImportanceHint"] {
  if (isFormalConstraintText(text)) return "FORMAL_REQUIREMENT";
  if (section === "requirements") return "REQUIRED_CAPABILITY";
  if (section === "responsibilities") return "CORE_RESPONSIBILITY";
  if (section === "preferredQualifications") return "PREFERRED_CAPABILITY";
  return "FORMAL_REQUIREMENT";
}

function importanceRank(value: NormalizedRequirement["sourceImportanceHint"]) {
  return {
    REQUIRED_CAPABILITY: 5,
    FORMAL_REQUIREMENT: 4,
    CORE_RESPONSIBILITY: 3,
    PREFERRED_CAPABILITY: 2,
    SUPPLEMENTAL_SIGNAL: 1
  }[value];
}

function shouldJoinFragment(previous: string, current: string) {
  if (!previous || terminalPunctuation.test(previous)) return "";
  if (explicitContinuation.test(current)) return "controlled-continuation";
  if (fragmentOnly.test(current)) return "fragment-only-token";
  if (/^[a-z]/.test(current) && previous.split(/\s+/).length >= 4) return "lowercase-incomplete-clause";
  if (/[,;:]$/.test(previous)) return "open-punctuation";
  return "";
}

function parentStatementId(section: NormalizedRequirementSource, text: string) {
  return `src-${section.slice(0, 4)}-${contentHash(punctuationInsensitive(text)).slice(1)}`;
}

export function buildReconstructedSourceStatements(parsed?: ParsedJD): ReconstructedSourceStatement[] {
  if (!parsed) return [];
  const groups: Array<[NormalizedRequirementSource, string[]]> = [
    ["responsibilities", parsed.responsibilities || []],
    ["requirements", parsed.requirements || []],
    ["preferredQualifications", parsed.preferredQualifications || []],
    ["workSite", parsed.workSite ? [parsed.workSite] : []],
    ["location", parsed.location ? [parsed.location] : []],
    ["travel", parsed.travel ? [parsed.travel] : []]
  ];
  const statements: ReconstructedSourceStatement[] = [];
  for (const [sourceSection, values] of groups) {
    let current: ReconstructedSourceStatement | undefined;
    values.forEach((raw, sourceIndex) => {
      const fragment = normalizeSemanticText(String(raw || "").replace(/^[-·•]\s*/, ""));
      if (!fragment) return;
      const reason = current ? shouldJoinFragment(current.reconstructedText, fragment) : "";
      if (current && reason) {
        current.rawFragments.push(fragment);
        current.sourceIndices.push(sourceIndex);
        current.reconstructionReasons.push(reason);
        current.reconstructedText = normalizeSemanticText(`${current.reconstructedText}, ${fragment}`)
          .replace(/,\s+(and(?:\/or)?|or)\s+/i, ", $1 ");
        current.parentSourceRequirementId = parentStatementId(sourceSection, current.reconstructedText);
        return;
      }
      current = {
        parentSourceRequirementId: parentStatementId(sourceSection, fragment),
        sourceSection,
        sourceIndex,
        sourceIndices: [sourceIndex],
        rawFragments: [fragment],
        reconstructedText: fragment,
        reconstructionReasons: [],
        sourceImportanceHint: sourceImportance(sourceSection, fragment)
      };
      statements.push(current);
    });
  }
  return statements;
}

export function reassembleRequirementFragments(values: string[] | undefined): string[] {
  return buildReconstructedSourceStatements({
    company: "", role: "", location: "", responsibilities: values,
    requirements: [], keywords: [], employerSignal: "", risks: []
  })
    .map((item) => item.reconstructedText);
}

export function normalizeParsedJDRequirements(parsed?: ParsedJD): ParsedJD | undefined {
  if (!parsed) return undefined;
  const statements = buildReconstructedSourceStatements(parsed);
  const section = (name: NormalizedRequirementSource) => statements
    .filter((item) => item.sourceSection === name)
    .map((item) => item.reconstructedText);
  return {
    ...parsed,
    responsibilities: section("responsibilities"),
    requirements: section("requirements"),
    preferredQualifications: section("preferredQualifications")
  };
}

type AtomicCandidate = {
  text: string;
  dimension: RequirementAtomicDimension;
  expectedAspects: string[];
  pathwayGroupId?: string;
  pathwayMetadata?: NormalizedRequirement["pathwayMetadata"];
};

function atomicCandidates(statement: ReconstructedSourceStatement): AtomicCandidate[] {
  const text = statement.reconstructedText;
  const lower = text.toLowerCase();
  if (/bachelor'?s degree in computer science.*4\+\s*years.*coding/i.test(text)) {
    return [
      { text: "Possesses a bachelor's degree or equivalent experience", dimension: "DEGREE_ATTAINMENT", expectedAspects: ["Bachelor's degree", "Equivalent experience pathway"] },
      { text: "Degree is in Computer Science or a related technical field", dimension: "DEGREE_FIELD", expectedAspects: ["Computer Science", "Related technical field"] },
      { text: "Has at least four years of technical engineering experience", dimension: "EXPERIENCE_YEARS", expectedAspects: ["4+ years", "Technical engineering experience"] },
      { text: "Has production coding depth in one or more listed programming languages", dimension: "CODING_DEPTH", expectedAspects: ["C", "C++", "C#", "Java", "JavaScript", "Python"] }
    ];
  }
  if (/degree in computer science.*(?:6\+|8\+)\s*years.*(?:coding|experience)/i.test(text)) {
    const pathwayGroupId = `path-${contentHash(punctuationInsensitive(text)).slice(1)}`;
    const pathwayMetadata = {
      parentSourceRequirementId: statement.parentSourceRequirementId,
      alternativePathways: [
        ["Master's degree", "Computer Science or related field", "6+ years technical engineering experience", "listed-language coding depth"],
        ["Bachelor's degree", "8+ years technical engineering experience", "listed-language coding depth"],
        ["Equivalent experience"]
      ],
      pathwayConditions: ["Satisfy one stated alternative pathway; parent pathway is metadata, not a matrix row."]
    };
    return [
      { text: "Has an advanced degree or equivalent-experience pathway", dimension: "DEGREE_ATTAINMENT", expectedAspects: ["Master's degree", "Bachelor's degree", "Equivalent experience"], pathwayGroupId, pathwayMetadata },
      { text: "Advanced degree field is Computer Science or a related technical field", dimension: "DEGREE_FIELD", expectedAspects: ["Computer Science", "Related technical field"], pathwayGroupId, pathwayMetadata },
      { text: "Has senior-level technical engineering experience under a stated pathway", dimension: "EXPERIENCE_YEARS", expectedAspects: ["6+ years with Master's", "8+ years with Bachelor's", "Equivalent experience"], pathwayGroupId, pathwayMetadata },
      { text: "Has senior production coding depth in one or more listed programming languages", dimension: "CODING_DEPTH", expectedAspects: ["C", "C++", "C#", "Java", "JavaScript", "Python"], pathwayGroupId, pathwayMetadata }
    ];
  }
  if (/familiarity with experimentation platforms.*a\/b testing.*statistical analysis/i.test(text)) {
    return [
      { text: "Familiarity with experimentation platforms", dimension: "EXPERIMENTATION_PLATFORM", expectedAspects: ["Experimentation platforms"] },
      { text: "Familiarity with A/B testing methodologies", dimension: "AB_TESTING", expectedAspects: ["A/B testing methodologies"] },
      { text: "Can perform statistical analysis of product metrics", dimension: "STATISTICAL_ANALYSIS", expectedAspects: ["Statistical analysis", "Product metrics"] }
    ];
  }
  if (/independently leverage ai tools.*take responsibility for ai-generated assets.*coach team members/i.test(text)) {
    return [
      { text: "Uses AI tools across the software development lifecycle", dimension: "RESPONSIBILITY", expectedAspects: ["AI tools", "Software development lifecycle"] },
      { text: "Takes responsibility for AI-generated production assets", dimension: "RESPONSIBILITY", expectedAspects: ["AI-generated assets", "Production responsibility"] },
      { text: "Coaches team members on responsible AI-assisted development", dimension: "RESPONSIBILITY", expectedAspects: ["Coaching", "Responsible AI-assisted development"] }
    ];
  }
  if (/own and drive product component architecture.*create design specifications.*disaster recovery/i.test(text)) {
    return [
      { text: "Owns product component architecture and design", dimension: "RESPONSIBILITY", expectedAspects: ["Architecture", "Component design"] },
      { text: "Creates technical design specifications", dimension: "RESPONSIBILITY", expectedAspects: ["Design specifications"] },
      { text: "Designs for performance, scalability, resiliency, and disaster recovery", dimension: "RESPONSIBILITY", expectedAspects: ["Performance", "Scalability", "Resiliency", "Disaster recovery"] }
    ];
  }
  if (/rotational on-call support.*live-site.*incident postmortems.*telemetry.*monitoring/i.test(text)) {
    return [
      { text: "Participates in rotational on-call support", dimension: "RESPONSIBILITY", expectedAspects: ["Rotational on-call"] },
      { text: "Resolves complex live-site incidents", dimension: "RESPONSIBILITY", expectedAspects: ["Live-site incidents"] },
      { text: "Conducts incident postmortems", dimension: "RESPONSIBILITY", expectedAspects: ["Incident postmortems"] },
      { text: "Improves troubleshooting guidance, telemetry, and monitoring", dimension: "RESPONSIBILITY", expectedAspects: ["Troubleshooting guidance", "Telemetry", "Monitoring"] }
    ];
  }
  if (/collaborate with partner teams.*determine requirements.*end-to-end tested features/i.test(text)) {
    return [
      { text: "Collaborates with product, privacy, security, SRE, and partner teams", dimension: "RESPONSIBILITY", expectedAspects: ["Product", "Privacy", "Security", "SRE", "Partner teams"] },
      { text: "Determines technical and product requirements", dimension: "RESPONSIBILITY", expectedAspects: ["Technical requirements", "Product requirements"] },
      { text: "Delivers scalable, reliable, end-to-end-tested features", dimension: "RESPONSIBILITY", expectedAspects: ["Scalability", "Reliability", "End-to-end testing"] }
    ];
  }
  if (/engineering excellence through automation.*security best practices.*deployment infrastructure/i.test(text)) {
    return [
      { text: "Drives automation and tooling improvements", dimension: "RESPONSIBILITY", expectedAspects: ["Automation", "Tooling improvements"] },
      { text: "Applies security best practices", dimension: "RESPONSIBILITY", expectedAspects: ["Security best practices"] },
      { text: "Contributes to deployment infrastructure", dimension: "RESPONSIBILITY", expectedAspects: ["Deployment infrastructure"] }
    ];
  }
  if (/produce extensible.*performant code.*use metrics to improve code quality/i.test(text)) {
    return [
      { text: "Produces maintainable, well-tested, secure, performant production code", dimension: "RESPONSIBILITY", expectedAspects: ["Maintainability", "Testing", "Security", "Performance"] },
      { text: "Uses metrics to improve quality, stability, performance, testability, and cost", dimension: "RESPONSIBILITY", expectedAspects: ["Quality", "Stability", "Performance", "Testability", "Cost"] }
    ];
  }
  const formal = ["workSite", "location", "travel"].includes(statement.sourceSection) || isFormalConstraintText(text);
  const expectedAspects = /scalability.*reliability.*fault tolerance.*cost optimization/i.test(lower)
    ? ["Scalability", "Reliability", "Fault tolerance", "Cost optimization"]
    : [];
  return [{
    text,
    dimension: formal ? "FORMAL_CONSTRAINT" : statement.sourceSection === "responsibilities" ? "RESPONSIBILITY" : "CAPABILITY",
    expectedAspects
  }];
}

function canonicalRequirementKey(candidate: AtomicCandidate, importance: NormalizedRequirement["sourceImportanceHint"]) {
  const text = punctuationInsensitive(candidate.text)
    .replace(/^experience (?:with|in) /, "")
    .replace(/^familiarity with /, "")
    .replace(/\bbackground checks\b/g, "background check")
    .replace(/\bthree days per week working in an office\b/g, "3 days week in office")
    .replace(/\brotational on call responsibility\b/g, "rotational on call support");
  const distinction = importance === "FORMAL_REQUIREMENT" ? "formal" : "capability";
  const semanticDimension = candidate.dimension === "RESPONSIBILITY" || candidate.dimension === "CAPABILITY"
    ? "EXPECTATION"
    : candidate.dimension;
  return `${distinction}:${semanticDimension}:${text}`;
}

function requirementId(canonicalKey: string, dimension: RequirementAtomicDimension) {
  return `req-${dimension.toLowerCase().replace(/_/g, "-").slice(0, 12)}-${contentHash(canonicalKey).slice(1)}`;
}

export function buildNormalizedRequirementInventory(parsed?: ParsedJD): NormalizedRequirement[] {
  const consolidated = new Map<string, NormalizedRequirement>();
  for (const statement of buildReconstructedSourceStatements(parsed)) {
    for (const candidate of atomicCandidates(statement)) {
      const candidateImportance = candidate.dimension === "FORMAL_CONSTRAINT" || isFormalConstraintText(candidate.text)
        ? "FORMAL_REQUIREMENT" as const
        : statement.sourceImportanceHint;
      const canonicalKey = canonicalRequirementKey(candidate, candidateImportance);
      const reference: RequirementSourceReference = {
        sourceSection: statement.sourceSection,
        sourceIndex: statement.sourceIndex,
        sourceIndices: statement.sourceIndices,
        sourceText: statement.reconstructedText,
        rawFragments: statement.rawFragments
      };
      const existing = consolidated.get(canonicalKey);
      if (existing) {
        existing.sourceReferences.push(reference);
        existing.parentSourceRequirementIds.push(statement.parentSourceRequirementId);
        existing.parentSourceText.push(statement.reconstructedText);
        if (importanceRank(candidateImportance) > importanceRank(existing.sourceImportanceHint)) {
          existing.sourceImportanceHint = candidateImportance;
          existing.sourceSection = statement.sourceSection;
          existing.sourceIndex = statement.sourceIndex;
        }
        continue;
      }
      const normalizedText = normalizeSemanticText(candidate.text);
      consolidated.set(canonicalKey, {
        requirementId: requirementId(canonicalKey, candidate.dimension),
        canonicalKey,
        sourceSection: statement.sourceSection,
        sourceIndex: statement.sourceIndex,
        originalText: normalizedText,
        normalizedText,
        atomicDimension: candidate.dimension,
        expectedAspects: candidate.expectedAspects,
        pathwayGroupId: candidate.pathwayGroupId,
        pathwayMetadata: candidate.pathwayMetadata,
        parentSourceRequirementIds: [statement.parentSourceRequirementId],
        parentSourceText: [statement.reconstructedText],
        sourceReferences: [reference],
        sourceImportanceHint: candidateImportance
      });
    }
  }
  return [...consolidated.values()].sort((a, b) =>
    b.sourceImportanceHint.localeCompare(a.sourceImportanceHint)
    || a.canonicalKey.localeCompare(b.canonicalKey)
  );
}

export function sourceUrlIntegrityIssue(value: string | undefined) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^\[[^\]]+\]\([^)]+\)$/.test(text)) return "Source URL is stored as Markdown. Re-fetch the original job URL before relying on provenance.";
  try {
    const url = new URL(text);
    if (!/^https?:$/.test(url.protocol)) return "Source URL must use HTTP or HTTPS.";
    const path = `${url.pathname}${url.search}`.toLowerCase();
    const nonListing = /(?:corporate-pay|salary|benefits|privacy|terms|home|search)(?:[/?#]|$)/.test(path)
      && !/[?&](?:pid|jobid|job_id|gh_jid|positionid)=\d+/i.test(url.search);
    if (nonListing) return "Source URL is not a specific job listing URL. Re-fetch from the actual job listing URL.";
  } catch {
    return "Source URL is not a valid plain URL.";
  }
  return "";
}

export type SourceUrlPromptProjection = {
  sourceUrl: string;
  sourceUrlStatus: "VALID_JOB_LISTING" | "NOT_PROVIDED" | "INVALID_MARKDOWN_URL" | "NON_JOB_LISTING_URL" | "INVALID_URL";
};

/** Provenance-only projection: raw/invalid URL text never enters an AI prompt. */
export function sourceUrlPromptProjection(value: string | undefined): SourceUrlPromptProjection {
  const text = String(value || "").trim();
  if (!text) return { sourceUrl: "", sourceUrlStatus: "NOT_PROVIDED" };
  if (/^\[[^\]]+\]\([^)]+\)$/.test(text)) return { sourceUrl: "", sourceUrlStatus: "INVALID_MARKDOWN_URL" };
  const issue = sourceUrlIntegrityIssue(text);
  if (!issue) return { sourceUrl: text, sourceUrlStatus: "VALID_JOB_LISTING" };
  return {
    sourceUrl: "",
    sourceUrlStatus: /specific job listing/i.test(issue) ? "NON_JOB_LISTING_URL" : "INVALID_URL"
  };
}

export function marketRoleFamilyHint(parsed?: ParsedJD) {
  const text = [
    parsed?.role, parsed?.overview,
    ...(parsed?.responsibilities || []),
    ...(parsed?.requirements || [])
  ].join(" ").toLowerCase();
  if (/power platform|power apps|power automate/.test(text)) return "POWER_PLATFORM";
  if (/data engineer|data pipeline|data platform|etl\b|data warehouse/.test(text)) return "DATA_ENGINEERING";
  if (/trainer|training program|learning facilitator|instructional/.test(text)) return "TRAINING_ENABLEMENT";
  if (/platform|distributed system|site reliability|live.site|on-call/.test(text)) return "PLATFORM_ENGINEERING";
  if (/product manager|product management|product strategy/.test(text)) return "PRODUCT_MANAGEMENT";
  if (/customer success|customer adoption|implementation consultant/.test(text)) return "CUSTOMER_SUCCESS";
  if (/software engineer|software development|coding in languages/.test(text)) return "SOFTWARE_ENGINEERING";
  if (/business intelligence|power bi|analytics/.test(text)) return "BUSINESS_INTELLIGENCE";
  if (/operations|operational/.test(text)) return "OPERATIONS";
  return "OTHER";
}

export function aiMarketArchetypeHint(parsed?: ParsedJD) {
  const text = [
    parsed?.role, parsed?.overview,
    ...(parsed?.responsibilities || []),
    ...(parsed?.requirements || [])
  ].join(" ").toLowerCase();
  if (/machine learning engineer|model training|ml infrastructure|mlops/.test(text)) return "ML_ENGINEERING";
  if (/ai platform engineer|llm platform|model serving/.test(text)) return "AI_PLATFORM_ENGINEERING";
  if (/applied ai engineer|generative ai engineer|llm engineer/.test(text)) return "APPLIED_AI_ENGINEERING";
  if (/ai product manager/.test(text)) return "AI_PRODUCT_MANAGEMENT";
  if (/ai operations|model evaluation|ai quality/.test(text)) return "AI_OPERATIONS";
  return "NOT_APPLICABLE";
}

export function initializeJob(input: Partial<JobApplication>): JobApplication {
  const job: JobApplication = {
    id: input.id || uid("job"),
    company: input.company?.trim() || "Company unknown",
    role: input.role?.trim() || "Untitled role",
    location: input.location?.trim() || "",
    rawJD: input.rawJD?.trim() || "",
    parsed: input.parsed,
    jdProvenance: input.jdProvenance,
    status: input.status || (input.parsed ? "Parsed" : "New"),
    fit: "Unknown",
    nextAction: input.nextAction || (input.parsed ? "Run Screening Analysis before selecting evidence." : "Parse JD with GPT paste-back."),
    selectedSkillIds: [],
    selectedDomainKnowledgeIds: [],
    selectedEvidenceIds: [],
    selectedStoryIds: [],
    updatedAt: input.updatedAt || new Date().toISOString()
  };
  return { ...job, jdContentHash: computeJobContentHash(job) };
}

export function deriveJobCvPipelineStatus(job: JobApplication, cvVersions: CvVersion[]): ApplicationStatus {
  if (job.status === "Applied" || job.status === "Archived") return job.status;
  const versions = cvVersions.filter((version) => version.jdId === job.id);
  if (!versions.length) return job.status;
  if (versions.some((version) => version.status === "Exported" || version.status === "Ready to Export")) return "Reviewed";
  if (job.status === "Reviewed") return "Reviewed";
  return "CV Drafted";
}

export function computeJobContentHash(job: Pick<JobApplication, "company" | "role" | "location" | "rawJD" | "parsed">) {
  const parsed = canonicalParsedJD(job.parsed);
  return contentHash({
    company: job.company,
    role: job.role,
    location: job.location,
    rawJD: job.rawJD,
    parsed: parsed ? {
      company: parsed.company,
      role: parsed.role,
      location: parsed.location,
      employmentType: parsed.employmentType,
      datePosted: parsed.datePosted,
      jobNumber: parsed.jobNumber,
      overview: parsed.overview,
      workSite: parsed.workSite,
      travel: parsed.travel,
      profession: parsed.profession,
      discipline: parsed.discipline,
      roleType: parsed.roleType,
      responsibilities: parsed.responsibilities,
      requirements: parsed.requirements,
      preferredQualifications: parsed.preferredQualifications,
      skills: parsed.skills,
      keywords: parsed.keywords,
      compensation: parsed.compensation,
      applicationWindow: parsed.applicationWindow,
      employerSignal: parsed.employerSignal,
      risks: parsed.risks,
      fitNotes: parsed.fitNotes
    } : undefined
  });
}

export function canonicalParsedJD(parsed?: ParsedJD): Omit<ParsedJD, "additionalAttributes" | "employerInsights" | "sourceUrl"> | undefined {
  const normalized = normalizeParsedJDRequirements(parsed);
  if (!normalized) return undefined;
  const {
    additionalAttributes: _additionalAttributes,
    employerInsights: _employerInsights,
    sourceUrl: _sourceUrl,
    ...canonical
  } = normalized;
  return canonical;
}

export function jobSourceIdentityMismatch(job: Pick<JobApplication, "company" | "role" | "rawJD" | "parsed">) {
  const raw = job.rawJD.trim().toLowerCase();
  if (raw.length < 80 || !job.parsed) return false;
  const tokens = (value: string) => value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4 && !["company", "corporation", "limited"].includes(token));
  const roleMatches = tokens(job.parsed.role || job.role).filter((token) => raw.includes(token)).length;
  const companyMatches = tokens(job.parsed.company || job.company).filter((token) => raw.includes(token)).length;
  return roleMatches === 0 && companyMatches === 0;
}

export function reconcileJobsWithScreeningWorkflow(data: AppData): AppData {
  let changed = false;
  const jobs = data.jobs.map((job) => {
    const run = job.screeningCvRun;
    if (job.status !== "CV Drafted" || run?.status !== "completed" || !run.applied) return job;
    const nextAction = "Review the consolidated Manager + ATS report, then export or make targeted manual edits.";
    if (job.nextAction === nextAction) return job;
    changed = true;
    return { ...job, nextAction };
  });
  return changed ? { ...data, jobs } : data;
}
