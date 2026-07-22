import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import importer from "../jdImportService.cjs";

const appRoot = fileURLToPath(new URL("../", import.meta.url));
const vite = await createServer({ root: appRoot, logLevel: "silent", server: { middlewareMode: true }, appType: "custom" });
try {
  const jobs = await vite.ssrLoadModule("/src/data/jobs.ts");
  const prompts = await vite.ssrLoadModule("/src/promptBuilders.ts");
  const schema = await vite.ssrLoadModule("/src/domain/screeningAnalysisSchema.ts");
  const root = JSON.parse(fs.readFileSync(new URL("../data/app_data.json", import.meta.url), "utf8"));
  const data = root.data || root;
  const microsoft = data.jobs.find((job) => job.parsed?.jobNumber === "200041631");
  assert.ok(microsoft);

  assert.equal(typeof jobs.buildReconstructedSourceStatements, "function", "source reconstruction owner must exist");
  const statements = jobs.buildReconstructedSourceStatements(microsoft.parsed);
  const inventory = jobs.buildNormalizedRequirementInventory(microsoft.parsed);
  const statementText = statements.map((item) => item.reconstructedText);
  assert.ok(statementText.some((text) => /Collaborate with partner teams, product managers.*deliver scalable, reliable, end-to-end tested features\./i.test(text)));
  assert.ok(statementText.some((text) => /Drive engineering excellence through automation, tooling improvements, security best practices, and deployment infrastructure\./i.test(text)));
  assert.ok(statementText.some((text) => /Experience mentoring engineers, leading code reviews, and improving engineering practices\./i.test(text)));
  assert.ok(statementText.some((text) => /Familiarity with experimentation platforms, A\/B testing methodologies, and statistical analysis of product metrics\./i.test(text)));

  const forbiddenFragments = /^(?:reliable|and cloud infrastructure|Ability to meet Microsoft)$/i;
  assert.equal(inventory.filter((item) => forbiddenFragments.test(item.normalizedText)).length, 0);
  for (const item of inventory) {
    assert.ok(item.sourceReferences?.length, `${item.requirementId} must have source lineage`);
    assert.ok(item.parentSourceRequirementIds?.length, `${item.requirementId} must have parent identity`);
  }
  assert.equal(inventory.some((item) => item.sourceSection === "other"), false);
  assert.equal(inventory.some((item) => microsoft.parsed.risks.includes(item.originalText)), false);
  assert.equal(new Set(inventory.map((item) => item.canonicalKey)).size, inventory.length);

  const degreeRows = inventory.filter((item) => item.parentSourceText?.some((text) => /Bachelor's Degree in Computer Science.*4\+ years/i.test(text)));
  for (const dimension of ["DEGREE_ATTAINMENT", "DEGREE_FIELD", "EXPERIENCE_YEARS", "CODING_DEPTH"]) {
    assert.ok(degreeRows.some((item) => item.atomicDimension === dimension), `${dimension} must be atomic`);
  }
  assert.equal(inventory.filter((item) => /^(?:C|C\+\+|C#|Java|JavaScript|Python)$/i.test(item.normalizedText)).length, 0);
  assert.equal(inventory.filter((item) => /^(?:Azure|AWS|GCP)$/i.test(item.normalizedText)).length, 0);

  const dedupFixture = {
    responsibilities: ["Own production service reliability."],
    requirements: ["Own production service reliability"],
    risks: ["Own production service reliability"],
    fitNotes: "Own production service reliability",
    employerSignal: "Own production service reliability"
  };
  const dedupInventory = jobs.buildNormalizedRequirementInventory(dedupFixture);
  assert.equal(dedupInventory.length, 1);
  assert.equal(dedupInventory[0].sourceReferences.length, 2);
  assert.equal(dedupInventory[0].sourceImportanceHint, "REQUIRED_CAPABILITY");
  const depthFixture = jobs.buildNormalizedRequirementInventory({
    responsibilities: ["Monitor automation flows."],
    requirements: ["Own large-scale distributed service reliability."]
  });
  assert.equal(depthFixture.length, 2, "shallow and deep expectations must not merge");
  assert.deepEqual(
    jobs.reassembleRequirementFragments(["Lead customer discovery.", "Deliver solution workshops."]),
    ["Lead customer discovery.", "Deliver solution workshops."]
  );

  const punctuationFixture = { requirements: ["Own production service reliability."] };
  const reorderedFixture = { responsibilities: ["Lead cross-functional delivery."], requirements: ["Own production service reliability"] };
  const baseId = jobs.buildNormalizedRequirementInventory(punctuationFixture)[0].requirementId;
  assert.equal(baseId, jobs.buildNormalizedRequirementInventory({ requirements: ["Own production service reliability"] })[0].requirementId);
  const reorderedId = jobs.buildNormalizedRequirementInventory(reorderedFixture).find((item) => /service reliability/i.test(item.normalizedText)).requirementId;
  assert.equal(baseId, reorderedId);
  assert.notEqual(baseId, jobs.buildNormalizedRequirementInventory({ requirements: ["Own production database reliability"] })[0].requirementId);
  assert.deepEqual(inventory, jobs.buildNormalizedRequirementInventory(microsoft.parsed));

  assert.match(jobs.sourceUrlIntegrityIssue(microsoft.parsed.sourceUrl), /Markdown/i);
  assert.match(jobs.sourceUrlIntegrityIssue("https://careers.microsoft.com/us/en/us-corporate-pay"), /job listing/i);
  assert.equal(jobs.sourceUrlIntegrityIssue("https://apply.careers.microsoft.com/careers?pid=200041631"), "");
  assert.throws(() => importer.validateImportUrl(microsoft.parsed.sourceUrl), /plain job listing URL/i);
  assert.throws(() => importer.validateImportUrl("https://careers.microsoft.com/us/en/us-corporate-pay"), /specific job listing/i);
  assert.equal(importer.validateImportUrl("https://apply.careers.microsoft.com/careers?pid=200041631").toString(), "https://apply.careers.microsoft.com/careers?pid=200041631");

  const projection = prompts.buildScreeningContextProjection(data, microsoft.id);
  const projectionText = JSON.stringify(projection);
  assert.doesNotMatch(projectionText, /\.\.\./);
  assert.ok(Array.isArray(projection.claimBoundaries.profile));
  assert.ok(Array.isArray(projection.claimBoundaries.source));
  assert.equal(projectionText.includes(data.careerProfile.claimBoundaries.trim()), true);
  assert.equal(projectionText.includes(data.sourceOfTruth.claimBoundaries.trim()), true);

  const contractRow = schema.screeningAnalysisPromptJsonSchema.properties.requirementMatrix.items.properties;
  assert.ok(contractRow.atomicDimension);
  assert.ok(contractRow.expectedAspects);

  const prompt = prompts.buildScreeningAnalysisPrompt(data, microsoft.id);
  assert.match(prompt, /JD \+ safe screening context/);
  assert.doesNotMatch(prompt, /JD \+ highest-signal evidence context/);
  assert.ok(prompt.length <= 118286 * 1.10, `Prompt ${prompt.length} exceeds P15R baseline +10%`);

  console.log(JSON.stringify({
    ok: true,
    rawFragments: statements.reduce((sum, item) => sum + item.rawFragments.length, 0),
    reconstructedStatements: statements.length,
    canonicalAtomicRequirements: inventory.length,
    duplicateGroupsConsolidated: inventory.reduce((sum, item) => sum + Math.max(0, item.sourceReferences.length - 1), 0),
    fragmentRowsRemaining: inventory.filter((item) => forbiddenFragments.test(item.normalizedText)).length,
    duplicateCanonicalRequirements: inventory.length - new Set(inventory.map((item) => item.canonicalKey)).size,
    sourceLineageCoveragePercent: Math.round(inventory.filter((item) => item.sourceReferences.length).length / inventory.length * 100),
    screeningContextCharacters: projectionText.length,
    totalPromptCharacters: prompt.length,
    approximateTokens: Math.ceil(prompt.length / 2)
  }, null, 2));
} finally {
  await vite.close();
}
