export const generatedCvFixturePath = "scripts/product-acceptance/fixtures/generated/export-ready-cv.json";

export const candidateProfile = {
  name: "Alex Chen",
  targetRole: "Customer Automation Specialist",
  email: "alex.chen@example.com",
  location: "Taipei, Taiwan"
};

export const contactInformation = {
  name: candidateProfile.name,
  email: candidateProfile.email,
  location: candidateProfile.location
};

export const jobDescription = {
  id: "jd-pa-001",
  company: "Northstar Cloud",
  role: "Customer Automation Specialist",
  coreCapabilityAreas: [
    "workflow automation",
    "stakeholder discovery",
    "customer enablement",
    "business impact reporting"
  ],
  requiredKeywords: ["workflow automation", "stakeholder discovery", "customer enablement"]
};

export const jdAnalysisResult = {
  targetRole: jobDescription.role,
  coreRequirements: jobDescription.coreCapabilityAreas,
  topKeywords: [
    { keyword: "workflow automation", priority: "Must-have", placement: "Work Experience" },
    { keyword: "stakeholder discovery", priority: "Must-have", placement: "Summary" },
    { keyword: "customer enablement", priority: "Important", placement: "Skills" }
  ],
  gaps: ["No direct enterprise ownership claim should be made without evidence."]
};

export const evidenceCards = [
  {
    id: "ev-workflow-automation",
    title: "Workflow automation intake",
    category: "Customer operations",
    candidateRole: "Process automation coordinator",
    externalFriendlyDescription: "Built a structured intake and follow-up workflow for customer-facing teams.",
    actionTaken: "Mapped stakeholder requests, configured workflow steps, and documented handoff rules.",
    quantifiedEvidence: "Reduced manual follow-up by 35%",
    evidenceStrength: "Strong",
    relatedJdKeywords: ["workflow automation", "stakeholder discovery"],
    canBeUsedInCv: "Yes",
    tools: ["Power Automate", "Excel"],
    proof: "Project notes and before/after ticket counts",
    cvBullet: "Mapped stakeholder requests and configured workflow steps that reduced manual follow-up by 35%.",
    allowedVisibleClaims: ["workflow automation", "stakeholder discovery", "manual follow-up reduction"],
    forbiddenVisibleClaims: ["owned enterprise AI platform"],
    metrics: "35% manual follow-up reduction",
    sourceIds: ["src-workflow"],
    confidence: "Grounded"
  },
  {
    id: "ev-enablement",
    title: "Customer enablement playbook",
    category: "Enablement",
    candidateRole: "Customer enablement coordinator",
    externalFriendlyDescription: "Created customer-facing enablement notes and adoption checklists.",
    actionTaken: "Translated internal process notes into customer-ready adoption guidance.",
    quantifiedEvidence: "Supported 12 customer sessions",
    evidenceStrength: "Strong",
    relatedJdKeywords: ["customer enablement", "business impact reporting"],
    canBeUsedInCv: "Yes",
    tools: ["PowerPoint", "CRM"],
    proof: "Enablement deck and session tracker",
    cvBullet: "Translated process notes into customer-ready adoption guidance used across 12 customer sessions.",
    allowedVisibleClaims: ["customer enablement", "adoption guidance", "customer sessions"],
    forbiddenVisibleClaims: ["enterprise revenue owner"],
    metrics: "12 sessions",
    sourceIds: ["src-enablement"],
    confidence: "Grounded"
  },
  {
    id: "ev-reporting",
    title: "Business impact reporting",
    category: "Reporting",
    candidateRole: "Operations analyst",
    externalFriendlyDescription: "Built reporting views that helped managers track adoption and follow-up.",
    actionTaken: "Consolidated adoption data and created weekly manager-ready reporting.",
    quantifiedEvidence: "Improved weekly visibility for 4 stakeholder groups",
    evidenceStrength: "Medium",
    relatedJdKeywords: ["business impact reporting"],
    canBeUsedInCv: "Yes",
    tools: ["Excel", "Power BI"],
    proof: "Weekly report archive",
    cvBullet: "Consolidated adoption data into weekly reporting that improved visibility for 4 stakeholder groups.",
    allowedVisibleClaims: ["business impact reporting", "stakeholder visibility"],
    forbiddenVisibleClaims: ["direct P&L ownership"],
    metrics: "4 stakeholder groups",
    sourceIds: ["src-reporting"],
    confidence: "Grounded"
  }
];

export const selectedEvidence = evidenceCards.map((card) => card.id);

export const effectiveCvBrief = {
  targetRole: jobDescription.role,
  positioning: "Business-to-technology translator for customer workflow automation and enablement.",
  mustShowEvidenceIds: ["ev-workflow-automation", "ev-enablement", "ev-reporting"],
  claimsToAvoid: ["owned enterprise AI platform", "direct P&L ownership"]
};

export function createTailoredCv(overrides = {}) {
  const cv = {
    jdAnalysis: jdAnalysisResult,
    header: {
      name: candidateProfile.name,
      targetRole: candidateProfile.targetRole,
      email: candidateProfile.email,
      location: candidateProfile.location
    },
    sidebar: {
      languages: [{ name: "English", level: "Professional", note: "Customer-facing documentation" }],
      skillGroups: [
        { title: "Customer Automation", highlightedSkills: ["workflow automation", "stakeholder discovery", "customer enablement"], otherSkills: ["Power Automate", "CRM", "Power BI"] }
      ],
      certifications: ["Microsoft Power Platform Fundamentals"],
      education: [{ school: "National Taiwan University", degree: "BA Business Administration", period: "2016-2020" }]
    },
    summary: "Customer Automation Specialist focused on workflow automation, stakeholder discovery, and customer enablement. Translates operational needs into practical workflow improvements backed by adoption reporting and evidence-based delivery.",
    workExperience: [
      {
        experienceId: "exp-current",
        company: "Acme Cloud Services",
        role: "Customer Operations Specialist",
        period: "2022-Present",
        location: "Taipei, Taiwan",
        subsections: [
          {
            title: "Workflow automation and enablement",
            bullets: [
              {
                text: "Mapped stakeholder requests and configured workflow steps that reduced manual follow-up by 35%.",
                metric: "35%",
                metricType: "Impact",
                evidenceIds: ["ev-workflow-automation"],
                confidence: "Grounded"
              },
              {
                text: "Translated process notes into customer-ready adoption guidance used across 12 customer sessions.",
                metric: "12 sessions",
                metricType: "Scope",
                evidenceIds: ["ev-enablement"],
                confidence: "Grounded"
              },
              {
                text: "Consolidated adoption data into weekly reporting that improved visibility for 4 stakeholder groups.",
                metric: "4 groups",
                metricType: "Scope",
                evidenceIds: ["ev-reporting"],
                confidence: "Grounded"
              }
            ]
          }
        ]
      }
    ],
    keywordPlacementNotes: ["workflow automation in work experience", "stakeholder discovery in summary", "customer enablement in skills"],
    interviewNotes: [
      { topic: "Automation intake", details: "Discuss mapping requests and reducing manual follow-up.", evidenceIds: ["ev-workflow-automation"] }
    ],
    reviewNotes: ["All visible claims are backed by selected EvidenceCard IDs."]
  };
  return mergeDeep(cv, overrides);
}

export const writerOutput = {
  tailoredCv: createTailoredCv(),
  reviewNotes: ["Writer output fixture is deterministic and evidence-backed."]
};

export const reviewerResult = {
  blockers: ["Reviewer: weak claims controlled: 1 weak mapping(s)"],
  warnings: []
};

export const repairPlan = {
  mode: "local-safe",
  target: "workExperience[0].subsections[0].bullets[0]",
  expectedEdit: "Add action, result, and valid EvidenceCard traceability."
};

export const repairedCv = createTailoredCv();

export const exportReadyCv = createTailoredCv();

export const scenarios = {
  happyPath: {
    id: "happy-path",
    description: "All required data present, one safe weak-bullet blocker resolved, final CV becomes exportable.",
    initialCv: createTailoredCv({
      workExperience: [{
        experienceId: "exp-current",
        company: "Acme Cloud Services",
        role: "Customer Operations Specialist",
        period: "2022-Present",
        location: "Taipei, Taiwan",
        subsections: [{
          title: "Workflow automation and enablement",
          bullets: [
            { text: "Helped with workflow automation.", evidenceIds: ["ev-workflow-automation"], confidence: "Weak" },
            { text: "Translated process notes into customer-ready adoption guidance used across 12 customer sessions.", metric: "12 sessions", metricType: "Scope", evidenceIds: ["ev-enablement"], confidence: "Grounded" },
            { text: "Consolidated adoption data into weekly reporting that improved visibility for 4 stakeholder groups.", metric: "4 groups", metricType: "Scope", evidenceIds: ["ev-reporting"], confidence: "Grounded" }
          ]
        }]
      }]
    }),
    edits: [
      { target: "workExperience[0].subsections[0].bullets[0]", value: "Mapped stakeholder requests and configured workflow steps that reduced manual follow-up by 35%." }
    ],
    expectedFinalPass: true
  },
  missingContact: {
    id: "missing-contact",
    description: "Email missing, Jump to Fix targets contact email, edit resolves blocker, export becomes available.",
    initialCv: createTailoredCv({ header: { email: "" } }),
    edits: [{ target: "header.email", value: candidateProfile.email }],
    expectedJumpTarget: "header.email",
    expectedFinalPass: true
  },
  weakBullet: {
    id: "weak-bullet",
    description: "One work bullet lacks sufficient detail; guided editing targets the correct bullet and deterministic edit resolves it.",
    initialCv: createTailoredCv({
      workExperience: [{
        experienceId: "exp-current",
        company: "Acme Cloud Services",
        role: "Customer Operations Specialist",
        period: "2022-Present",
        location: "Taipei, Taiwan",
        subsections: [{
          title: "Workflow automation and enablement",
          bullets: [
            { text: "Helped automation.", evidenceIds: ["ev-workflow-automation"], confidence: "Weak" },
            { text: "Translated process notes into customer-ready adoption guidance used across 12 customer sessions.", metric: "12 sessions", metricType: "Scope", evidenceIds: ["ev-enablement"], confidence: "Grounded" },
            { text: "Consolidated adoption data into weekly reporting that improved visibility for 4 stakeholder groups.", metric: "4 groups", metricType: "Scope", evidenceIds: ["ev-reporting"], confidence: "Grounded" }
          ]
        }]
      }]
    }),
    edits: [{ target: "workExperience[0].subsections[0].bullets[0]", value: "Mapped stakeholder requests and configured workflow steps that reduced manual follow-up by 35%." }],
    expectedJumpTarget: "workExperience[0].subsections[0].bullets[0]",
    expectedFinalPass: true
  },
  unsupportedClaim: {
    id: "unsupported-claim",
    description: "Unsupported visible claim blocks HR and Hiring Manager gates until removed.",
    initialCv: createTailoredCv({
      summary: "Customer Automation Specialist who owned an enterprise AI platform and workflow automation adoption."
    }),
    edits: [{ target: "summary", value: "Customer Automation Specialist focused on workflow automation, stakeholder discovery, and customer enablement. Translates operational needs into practical workflow improvements backed by adoption reporting and evidence-based delivery." }],
    expectedFinalPass: true,
    expectedInitialFailure: true
  },
  warningOnly: {
    id: "warning-only",
    description: "No blocking issue, warnings remain, export is still allowed.",
    initialCv: createTailoredCv({
      reviewNotes: ["Warning: fit-risk item should be manually reviewed before sending."]
    }),
    edits: [],
    expectedWarnings: ["fit-risk"],
    expectedFinalPass: true
  }
};

function mergeDeep(base, override) {
  if (!override || typeof override !== "object") return structuredClone(base);
  const output = Array.isArray(base) ? [...base] : { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (Array.isArray(value)) {
      output[key] = value.map((item) => typeof item === "object" && item !== null ? structuredClone(item) : item);
    } else if (value && typeof value === "object" && base?.[key] && typeof base[key] === "object" && !Array.isArray(base[key])) {
      output[key] = mergeDeep(base[key], value);
    } else {
      output[key] = value;
    }
  }
  return output;
}
