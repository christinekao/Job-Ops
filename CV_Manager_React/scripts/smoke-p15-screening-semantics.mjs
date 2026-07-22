import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import importer from "../jdImportService.cjs";

const appRoot = fileURLToPath(new URL("../", import.meta.url));
const vite = await createServer({ root: appRoot, logLevel: "silent", server: { middlewareMode: true }, appType: "custom" });
try {
  const schema = await vite.ssrLoadModule("/src/domain/screeningAnalysisSchema.ts");
  const jobs = await vite.ssrLoadModule("/src/data/jobs.ts");
  const prompts = await vite.ssrLoadModule("/src/promptBuilders.ts");
  const positioning = await vite.ssrLoadModule("/src/domain/positioningPolicy.ts");
  const root = JSON.parse(fs.readFileSync(new URL("../data/app_data.json", import.meta.url), "utf8"));
  const data = root.data || root;
  const microsoft = data.jobs.find((job) => job.parsed?.jobNumber === "200041631");
  assert.ok(microsoft, "Microsoft 200041631 fixture must exist");

  const inventory = jobs.buildNormalizedRequirementInventory(microsoft.parsed);
  assert.ok(inventory.length > 20);
  assert.equal(new Set(inventory.map((item) => item.requirementId)).size, inventory.length);
  assert.deepEqual(inventory, jobs.buildNormalizedRequirementInventory(microsoft.parsed));
  assert.ok(inventory.some((item) => item.atomicDimension === "CODING_DEPTH" && item.expectedAspects.includes("C++")));
  assert.ok(inventory.some((item) => /Azure, AWS, or GCP/i.test(item.normalizedText)));
  assert.ok(inventory.some((item) => /logging, metrics, and distributed tracing/i.test(item.normalizedText)));
  assert.ok(inventory.some((item) => /maintainable, well-tested, secure, performant production code/i.test(item.normalizedText)));

  assert.deepEqual(
    importer.reassembleSemanticItems(["C", "C++", "C#", "Java", "JavaScript", "or Python."]),
    ["C, C++, C#, Java, JavaScript, or Python."]
  );
  assert.deepEqual(importer.reassembleSemanticItems(["Own service architecture.", "Mentor engineers."]), ["Own service architecture.", "Mentor engineers."]);

  const contract = schema.screeningAnalysisPromptJsonSchema;
  for (const field of ["jobClassification", "candidatePositioning", "requirementMatrix", "opportunityAnalysis"]) {
    assert.ok(Object.hasOwn(contract.properties, field), `${field} must be canonical`);
  }
  for (const legacy of ["positioning", "jdEvidenceMapping", "remainingGaps", "hardRequirements", "coreScreeningThresholds"]) {
    assert.ok(!Object.hasOwn(contract.properties, legacy), `${legacy} must not be in new AI schema`);
  }
  assert.ok(!Object.hasOwn(contract.properties.jdBreakdown.properties, "mustHaveRequirements"));
  assert.ok(contract.properties.requirementMatrix.items.properties.matchingEducationIds);
  assert.ok(contract.properties.requirementMatrix.items.properties.matchingDomainKnowledgeIds);

  const make = (node) => {
    if (node.type === "string") return node.enum ? node.enum[0] : "";
    if (node.type === "number") return 0;
    if (node.type === "boolean") return false;
    if (node.type === "array") return [];
    return Object.fromEntries(node.required.map((key) => [key, make(node.properties[key])]));
  };
  const output = make(schema.screeningAnalysisAIOutputSchema);
  output.primaryTargetTitle = "Platform Engineer";
  output.jobClassification = { marketRoleFamily: "PLATFORM_ENGINEERING", aiMarketArchetype: "NOT_APPLICABLE", classificationRationale: "Distributed experimentation platform." };
  output.requirementMatrix = inventory.map((item) => ({
    ...make(schema.screeningAnalysisAIOutputSchema.properties.requirementMatrix.items),
    requirementId: item.requirementId,
    requirement: item.originalText,
    normalizedRequirement: item.normalizedText,
    sourceSection: item.sourceSection,
    atomicDimension: item.atomicDimension,
    expectedAspects: item.expectedAspects,
    importance: item.sourceImportanceHint,
    matchStatus: "CORE_CAPABILITY_GAP",
    cvUsage: "DO_NOT_CLAIM",
    explanation: "No direct production evidence."
  }));
  const degreeRow = output.requirementMatrix.find((row) => /degree/i.test(row.normalizedRequirement));
  assert.ok(degreeRow);
  degreeRow.matchStatus = "PARTIAL_MATCH";
  degreeRow.matchingEducationIds = ["edu-cgu-ms-biomedical-2011"];
  degreeRow.supportedAspects = ["Master degree"];
  degreeRow.unsupportedAspects = ["Computer Science field"];
  const evidenceId = data.evidenceCards[0].id;
  for (const row of output.requirementMatrix) {
    if (/collaborate with partner teams|ai-assisted development workflows/i.test(row.normalizedRequirement)) {
      row.matchStatus = "DIRECT_MATCH";
      row.matchingEvidenceIds = [evidenceId];
      row.cvUsage = "PRIORITIZE";
      row.interviewUsage = "LEAD_STORY";
      row.explanation = "Direct cross-functional or responsible AI workflow evidence.";
    }
    if (["EXPERIMENTATION_PLATFORM", "AB_TESTING", "STATISTICAL_ANALYSIS"].includes(row.atomicDimension)) {
      row.matchStatus = "TRANSFERABLE_MATCH";
      row.matchingEvidenceIds = [evidenceId];
      row.transferContext = "Operational analytics evidence transfers to experimentation concepts but is not direct platform ownership.";
      row.cvUsage = "CONSERVATIVE_POSITIONING";
      row.interviewUsage = "EXPLAIN_TRANSFER";
      row.explanation = row.transferContext;
    }
    if (row.importance === "FORMAL_REQUIREMENT" || /security screening|background check/i.test(row.normalizedRequirement)) {
      row.matchStatus = "FORMAL_SCREENING_RISK";
      row.cvUsage = "DO_NOT_CLAIM";
      row.interviewUsage = "DISCLOSE_GAP";
      row.explanation = "Formal eligibility or logistics must be confirmed.";
    }
  }
  const validationContext = {
    requirementIds: new Set(inventory.map((item) => item.requirementId)),
    requirements: new Map(inventory.map((item) => [item.requirementId, item])),
    evidenceIds: new Set(data.evidenceCards.map((item) => item.id)),
    skillIds: new Set(data.skillInferences.map((item) => item.id)),
    storyIds: new Set(data.starStories.map((item) => item.id)),
    educationIds: new Set(data.careerProfile.education.map((item) => item.id)),
    domainKnowledgeIds: new Set(data.domainKnowledge.map((item) => item.id))
  };
  assert.equal(schema.validateScreeningAnalysisAIOutput(output).success, true);
  assert.deepEqual(schema.validateScreeningAnalysisSemantics(output, validationContext), []);
  assert.ok(schema.validateScreeningAnalysisSemantics({ ...output, requirementMatrix: output.requirementMatrix.slice(1) }, validationContext).some((issue) => issue.received === "missing"));
  assert.ok(schema.validateScreeningAnalysisSemantics({ ...output, requirementMatrix: [...output.requirementMatrix, output.requirementMatrix[0]] }, validationContext).some((issue) => issue.received === "duplicate"));
  const badEducation = structuredClone(output);
  badEducation.requirementMatrix[0].matchingEducationIds = ["edu-invented"];
  assert.ok(schema.validateScreeningAnalysisSemantics(badEducation, validationContext).some((issue) => issue.path.includes("matchingEducationIds")));

  const prompt = prompts.buildScreeningAnalysisPrompt(data, microsoft.id);
  const legacyPayload = JSON.stringify(prompts.buildFitReviewContext(data, microsoft.id), null, 2)
    + JSON.stringify(schema.screeningAnalysisPromptJsonSchema, null, 2);
  const compactPayload = JSON.stringify(prompts.buildScreeningContextProjection(data, microsoft.id), null, 2)
    + schema.screeningAnalysisPromptSchemaContract;
  const estimatedBefore = prompt.length + legacyPayload.length - compactPayload.length;
  const reduction = (estimatedBefore - prompt.length) / estimatedBefore;
  assert.ok(reduction >= 0.25, `Prompt reduction must be >=25%, actual ${(reduction * 100).toFixed(1)}%`);
  for (const id of ["edu-cgu-ms-biomedical-2011", "edu-fju-bs-life-sciences-2009", "edu-tibame-ai-big-data-2020"]) assert.match(prompt, new RegExp(id));
  assert.doesNotMatch(prompt, /mark it Stretch[/]Avoid|Mark pure AI.*Stretch[/]Avoid/);
  assert.doesNotMatch(prompt, /If a value is unknown, use "" or \\[\\]/);
  assert.doesNotMatch(prompt, new RegExp("https?://[^\\\\s\\\"]*(?:endpoint|workspace|environment)[^\\\\s\\\"]*", "i"));
  assert.match(prompt, /Normalized Requirement Inventory:/);
  assert.equal(microsoft.parsed.roleType, "Individual Contributor");
  assert.match(jobs.sourceUrlIntegrityIssue(microsoft.parsed.sourceUrl), /Markdown/);
  assert.equal(jobs.sourceUrlIntegrityIssue("https://apply.careers.microsoft.com/careers?pid=200041631"), "");
  assert.equal(jobs.marketRoleFamilyHint(microsoft.parsed), "PLATFORM_ENGINEERING");
  assert.equal(jobs.aiMarketArchetypeHint(microsoft.parsed), "NOT_APPLICABLE");
  assert.equal(jobs.marketRoleFamilyHint({ role: "Senior Power Platform Developer", responsibilities: ["Build Power Apps and Power Automate workflows."] }), "POWER_PLATFORM");
  assert.equal(jobs.marketRoleFamilyHint({ role: "Data Engineer", responsibilities: ["Own ETL data pipelines and a cloud data warehouse."] }), "DATA_ENGINEERING");
  assert.equal(jobs.marketRoleFamilyHint({ role: "Technical Trainer", responsibilities: ["Facilitate training programs and learning workshops."] }), "TRAINING_ENABLEMENT");

  output.opportunityAnalysis.credibleOverlaps = ["Cross-functional operations"];
  output.opportunityAnalysis.whyCoreFitIsLow = ["No production distributed-systems ownership evidence."];
  output.opportunityAnalysis.coreUnbridgeableShortTermGaps = ["Large-scale service architecture ownership"];
  output.opportunityAnalysis.futureTransitionPath = ["Build production service evidence in an adjacent platform role."];
  output.opportunityAnalysis.betterAdjacentRoles = ["Power Platform Solutions Specialist"];
  output.opportunityAnalysis.recommendedPreparation = ["Create a production observability case study."];
  const stored = schema.createScreeningAnalysisStoredResult(output);
  const report = positioning.buildPositioningReport({ job: { role: microsoft.role, screeningAnalysis: stored }, data });
  assert.equal(report.fitClassification, "LOW_FIT");
  assert.equal(report.fitDimensions.generationRecommendation, "DO_NOT_PRIORITIZE_GENERATION");
  assert.equal(report.fitDimensions.manualOverrideAllowed, true);
  assert.ok(report.fitDimensions.directEvidenceFit > 0);
  assert.ok(report.fitDimensions.transferability > 0);
  assert.ok(report.fitDimensions.screeningRisk >= 60);
  assert.ok(report.lowFitAnalysis?.betterAdjacentRoles.includes("Power Platform Solutions Specialist"));
  assert.ok(report.lowFitAnalysis?.futureTransitionPath.length);

  console.log(JSON.stringify({
    ok: true,
    microsoftPromptCharactersBefore: estimatedBefore,
    microsoftPromptCharactersAfter: prompt.length,
    approximateTokensBefore: Math.ceil(estimatedBefore / 2),
    approximateTokensAfter: Math.ceil(prompt.length / 2),
    reductionPercent: Number((reduction * 100).toFixed(1)),
    requirementCount: inventory.length,
    schemaContractCharacters: schema.screeningAnalysisPromptSchemaContract.length
  }, null, 2));
} finally {
  await vite.close();
}
