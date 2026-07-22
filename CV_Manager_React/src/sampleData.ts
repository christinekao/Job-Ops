import type { AppData } from "./types";

const now = new Date().toISOString();

export const defaultData: AppData = {
  rawSources: [
    {
      id: "source-original-cv",
      kind: "Original CV",
      title: "Original CV",
      content:
        "Paste Christine's original CV here. Keep this as raw source, not final tailored content.",
      updatedAt: now
    },
    {
      id: "source-project-notes",
      kind: "Project Notes",
      title: "Raw project notes",
      content:
        "Paste project HTML, Markdown, achievements, dashboard notes, and metrics here.",
      updatedAt: now
    }
  ],
  sourceOfTruth: {
    identity: "",
    targetRoles: "",
    positioning: "",
    workHistory: "",
    tools: "",
    metrics: "",
    claimBoundaries: ""
  },
  careerProfile: {
    identity: "",
    contact: {
      name: "",
      email: "",
      location: ""
    },
    targetRoles: [],
    positioning: "",
    education: [],
    certifications: [],
    skillGroups: [],
    workExperiences: [],
    claimBoundaries: ""
  },
  skillInferences: [],
  domainKnowledge: [],
  evidenceCards: [],
  starStories: [],
  highCompensationSignals: [],
  backboneMetadata: {
    runMode: "",
    partialOutput: false,
    nextRecommendedRunMode: "",
    outputScope: "",
    warnings: [],
    profileSourceHashes: {},
    profileSyncedAt: ""
  },
  backboneUpdateSummary: {
    mode: "",
    addedItems: [],
    modifiedItems: [],
    unchangedItems: [],
    possibleDuplicates: [],
    conflicts: [],
    needsReview: [],
    idChanges: []
  },
  backboneTasks: [],
  recruiterAnswers: [],
  jobs: [],
  promptTemplates: [
    {
      id: "tpl-source",
      name: "Source Parsing",
      purpose: "Turn raw CV and project material into Source of Truth.",
      template: "Use source material only. Return grounded JSON."
    },
    {
      id: "tpl-jd",
      name: "JD Parse",
      purpose: "Turn raw JD into structured JD fields.",
      template: "Parse job description. Return valid JSON only."
    },
    {
      id: "tpl-cv",
      name: "Tailored CV",
      purpose: "Generate JD-specific CV draft from selected evidence.",
      template: "Use selected evidence only. Return valid JSON."
    }
  ],
  cvVersions: []
};
