import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { defaultData } from "../src/sampleData.ts";
import { buildBatchSourceSnapshotPrompt, buildCareerBackbonePrompt } from "../src/promptBuilders.ts";
import { contentHash } from "../src/utils/hash.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");

const splitFiles = {
  rawSources: "raw_sources.json",
  sourceOfTruth: "source_of_truth.json",
  careerProfile: "career_profile.json",
  skillInferences: "skill_inferences.json",
  domainKnowledge: "domain_knowledge.json",
  evidenceCards: "evidence_cards.json",
  starStories: "star_stories.json",
  highCompensationSignals: "high_compensation_signals.json",
  backboneMetadata: "backbone_metadata.json",
  backboneUpdateSummary: "backbone_update_summary.json",
  backboneTasks: "backbone_tasks.json",
  recruiterAnswers: "recruiter_answers.json",
  jobs: "jobs.json",
  promptTemplates: "prompt_templates.json",
  cvVersions: "cv_versions.json"
};

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tempPath, filePath);
}

function loadAppData() {
  const data = { ...defaultData };
  for (const [key, fileName] of Object.entries(splitFiles)) {
    data[key] = readJson(path.join(DATA_DIR, fileName), defaultData[key]);
  }
  return data;
}

function saveAppData(data) {
  for (const [key, fileName] of Object.entries(splitFiles)) {
    writeJson(path.join(DATA_DIR, fileName), data[key] ?? defaultData[key]);
  }
}

function textValue(value) {
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join("\n");
  if (value && typeof value === "object") return JSON.stringify(value);
  return String(value ?? "");
}

function stringArray(value) {
  if (Array.isArray(value)) return value.map(textValue).map((item) => item.trim()).filter(Boolean);
  return textValue(value)
    .split(/\n|,|;|、/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function recruiterSafeText(value) {
  return String(value || "")
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

function sanitizeValue(value) {
  if (typeof value === "string") return recruiterSafeText(value);
  if (Array.isArray(value)) return value.map((item) => sanitizeValue(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeValue(item)]));
  }
  return value;
}

function sanitizeAppData(data) {
  return {
    ...data,
    sourceOfTruth: sanitizeValue(data.sourceOfTruth),
    careerProfile: sanitizeValue(data.careerProfile),
    skillInferences: sanitizeValue(data.skillInferences),
    domainKnowledge: sanitizeValue(data.domainKnowledge),
    evidenceCards: sanitizeValue(data.evidenceCards),
    starStories: sanitizeValue(data.starStories),
    highCompensationSignals: sanitizeValue(data.highCompensationSignals),
    jobs: sanitizeValue(data.jobs),
    cvVersions: sanitizeValue(data.cvVersions)
  };
}

function normalizeSourceParsedSnapshot(value, source) {
  const record = value && typeof value === "object" ? value : {};
  const experiences = Array.isArray(record.workExperiences) ? record.workExperiences : [];
  return {
    sourceId: textValue(record.sourceId) || source.id,
    sourceTitle: textValue(record.sourceTitle) || source.title,
    sourceKind: textValue(record.sourceKind) || source.kind,
    sourceContentHash: contentHash(source.content),
    parsedAt: new Date().toISOString(),
    summary: recruiterSafeText(textValue(record.summary)),
    identityFacts: stringArray(record.identityFacts).map(recruiterSafeText),
    workExperiences: experiences.map((experience) => {
      const exp = experience && typeof experience === "object" ? experience : {};
      const projects = Array.isArray(exp.projects) ? exp.projects : [];
      return {
        company: recruiterSafeText(textValue(exp.company)),
        role: recruiterSafeText(textValue(exp.role)),
        period: textValue(exp.period),
        location: recruiterSafeText(textValue(exp.location)),
        projects: projects.map((project) => {
          const proj = project && typeof project === "object" ? project : {};
          return {
            name: recruiterSafeText(textValue(proj.name)),
            period: textValue(proj.period),
            category: recruiterSafeText(textValue(proj.category)),
            tools: stringArray(proj.tools).map(recruiterSafeText),
            summary: recruiterSafeText(textValue(proj.summary)),
            metrics: stringArray(proj.metrics).map(recruiterSafeText),
            stakeholders: stringArray(proj.stakeholders).map(recruiterSafeText),
            systemsOrData: stringArray(proj.systemsOrData || proj.systems || proj.data).map(recruiterSafeText),
            risksOrCompliance: stringArray(proj.risksOrCompliance || proj.risks || proj.compliance).map(recruiterSafeText),
            evidenceSeeds: stringArray(proj.evidenceSeeds || proj.evidence).map(recruiterSafeText),
            starSeeds: stringArray(proj.starSeeds || proj.stories).map(recruiterSafeText)
          };
        })
      };
    }),
    skills: stringArray(record.skills).map(recruiterSafeText),
    domainSignals: stringArray(record.domainSignals || record.domains).map(recruiterSafeText),
    education: stringArray(record.education).map(recruiterSafeText),
    certifications: stringArray(record.certifications).map(recruiterSafeText),
    claimBoundaries: stringArray(record.claimBoundaries || record.needsReview).map(recruiterSafeText)
  };
}

function normalizeBatchSourceSnapshots(value, sources) {
  const root = value && typeof value === "object" ? value : {};
  const items = Array.isArray(root.sourceSnapshots)
    ? root.sourceSnapshots
    : Array.isArray(value)
      ? value
      : [];
  return items.flatMap((item) => {
    const record = item && typeof item === "object" ? item : {};
    const sourceId = textValue(record.sourceId || record.id);
    const sourceTitle = textValue(record.sourceTitle || record.title);
    const source = sources.find((candidate) => candidate.id === sourceId)
      || sources.find((candidate) => candidate.title === sourceTitle);
    return source ? [normalizeSourceParsedSnapshot(record, source)] : [];
  });
}

function chunkSourcesForSnapshot(sources, maxChars = 22000) {
  const batches = [];
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

function usage() {
  console.error("Usage:");
  console.error("  node scripts/rebuild-career-evidence.mjs snapshot-prompt <batchIndex> <outputFile>");
  console.error("  node scripts/rebuild-career-evidence.mjs apply-snapshots <batchIndex> <jsonFile>");
  console.error("  node scripts/rebuild-career-evidence.mjs stage-prompt <runMode> <outputFile>");
  console.error("  node scripts/rebuild-career-evidence.mjs apply-stage <runMode> <jsonFile>");
  console.error("  node scripts/rebuild-career-evidence.mjs status");
  process.exit(1);
}

function writePrompt(outputFile, prompt) {
  fs.writeFileSync(outputFile, prompt);
  console.log(outputFile);
}

function readPayload(jsonFile) {
  return JSON.parse(fs.readFileSync(jsonFile, "utf8"));
}

const [, , command, arg1, arg2] = process.argv;
if (!command) usage();

if (command === "status") {
  const data = loadAppData();
  const snapshotCoverage = data.rawSources.filter((source) => source.parsedSnapshot?.sourceContentHash === contentHash(source.content)).length;
  const projectCount = (data.careerProfile.workExperiences || []).reduce((sum, experience) => sum + (experience.projects || []).length, 0);
  console.log(JSON.stringify({
    rawSources: data.rawSources.length,
    sourceSnapshotsFresh: snapshotCoverage,
    experiences: data.careerProfile.workExperiences?.length || 0,
    projects: projectCount,
    skills: data.skillInferences.length,
    domain: data.domainKnowledge.length,
    evidence: data.evidenceCards.length,
    star: data.starStories.length,
    compensation: data.highCompensationSignals.length,
    nextRecommendedRunMode: data.backboneMetadata.nextRecommendedRunMode || ""
  }, null, 2));
  process.exit(0);
}

if (command === "snapshot-prompt") {
  const batchIndex = Number(arg1);
  const outputFile = arg2;
  if (!Number.isInteger(batchIndex) || !outputFile) usage();
  const data = loadAppData();
  const batches = chunkSourcesForSnapshot(data.rawSources, 22000);
  const batch = batches[batchIndex - 1];
  if (!batch) throw new Error(`Snapshot batch ${batchIndex} not found. Total batches: ${batches.length}`);
  writePrompt(outputFile, buildBatchSourceSnapshotPrompt(batch));
  process.exit(0);
}

if (command === "apply-snapshots") {
  const batchIndex = Number(arg1);
  const jsonFile = arg2;
  if (!Number.isInteger(batchIndex) || !jsonFile) usage();
  const data = loadAppData();
  const batches = chunkSourcesForSnapshot(data.rawSources, 22000);
  const batch = batches[batchIndex - 1];
  if (!batch) throw new Error(`Snapshot batch ${batchIndex} not found. Total batches: ${batches.length}`);
  const payload = readPayload(jsonFile);
  const snapshots = normalizeBatchSourceSnapshots(payload, batch);
  const snapshotMap = new Map(snapshots.map((snapshot) => [snapshot.sourceId, snapshot]));
  const nextData = {
    ...data,
    rawSources: data.rawSources.map((source) => ({
      ...source,
      parsedSnapshot: snapshotMap.get(source.id) || source.parsedSnapshot
    }))
  };
  saveAppData(nextData);
  console.log(JSON.stringify({
    appliedSnapshots: snapshots.map((item) => item.sourceId),
    totalFreshSnapshots: nextData.rawSources.filter((source) => source.parsedSnapshot?.sourceContentHash === contentHash(source.content)).length
  }, null, 2));
  process.exit(0);
}

if (command === "stage-prompt") {
  const runMode = arg1;
  const outputFile = arg2;
  if (!runMode || !outputFile) usage();
  const data = loadAppData();
  const promptData = { ...data };
  if (runMode === "evidence_only") promptData.evidenceCards = [];
  if (runMode === "star_only") promptData.starStories = [];
  if (runMode === "high_compensation_only") promptData.highCompensationSignals = [];
  writePrompt(outputFile, buildCareerBackbonePrompt(promptData, runMode));
  process.exit(0);
}

if (command === "apply-stage") {
  const runMode = arg1;
  const jsonFile = arg2;
  if (!runMode || !jsonFile) usage();
  const data = loadAppData();
  const payload = sanitizeValue(readPayload(jsonFile));
  const nextData = { ...data };
  if (payload.careerProfile) nextData.careerProfile = payload.careerProfile;
  if (payload.sourceOfTruth) nextData.sourceOfTruth = payload.sourceOfTruth;
  if (payload.skillInferences) nextData.skillInferences = payload.skillInferences;
  if (payload.domainKnowledge) nextData.domainKnowledge = payload.domainKnowledge;
  if (payload.evidenceCards) nextData.evidenceCards = payload.evidenceCards;
  if (payload.starStories) nextData.starStories = payload.starStories;
  if (payload.highCompensationSignals) nextData.highCompensationSignals = payload.highCompensationSignals;
  if (payload.metadata) {
    nextData.backboneMetadata = {
      ...nextData.backboneMetadata,
      ...payload.metadata,
      runMode,
      profileSourceHashes: Object.fromEntries(nextData.rawSources.map((source) => [source.id, contentHash(source.content)])),
      profileSyncedAt: new Date().toISOString()
    };
  }
  if (payload.updateSummary) nextData.backboneUpdateSummary = payload.updateSummary;
  nextData.backboneTasks = [];
  saveAppData(sanitizeAppData(nextData));
  const projectCount = (nextData.careerProfile.workExperiences || []).reduce((sum, experience) => sum + (experience.projects || []).length, 0);
  console.log(JSON.stringify({
    runMode,
    experiences: nextData.careerProfile.workExperiences?.length || 0,
    projects: projectCount,
    skills: nextData.skillInferences.length,
    domain: nextData.domainKnowledge.length,
    evidence: nextData.evidenceCards.length,
    star: nextData.starStories.length,
    compensation: nextData.highCompensationSignals.length
  }, null, 2));
  process.exit(0);
}

usage();
