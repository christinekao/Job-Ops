import { readFileSync, writeFileSync } from "node:fs";

const files = [
  "source_of_truth.json",
  "career_profile.json",
  "skill_inferences.json",
  "domain_knowledge.json",
  "evidence_cards.json",
  "star_stories.json",
  "high_compensation_signals.json",
  "backbone_tasks.json",
  "recruiter_answers.json",
  "jobs.json",
  "cv_versions.json"
];

function recruiterSafeText(value) {
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

function migrate(value) {
  if (typeof value === "string") return recruiterSafeText(value);
  if (Array.isArray(value)) return value.map(migrate);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, migrate(item)]));
  }
  return value;
}

for (const file of files) {
  const url = new URL(`../data/${file}`, import.meta.url);
  const current = JSON.parse(readFileSync(url, "utf8"));
  writeFileSync(url, `${JSON.stringify(migrate(current), null, 2)}\n`);
}

console.log(`Migrated ${files.length} recruiter-facing data files. raw_sources.json was intentionally preserved.`);
