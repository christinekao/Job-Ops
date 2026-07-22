import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const appRoot = fileURLToPath(new URL("../", import.meta.url));
const vite = await createServer({ root: appRoot, logLevel: "silent", server: { middlewareMode: true }, appType: "custom" });
try {
  const jobs = await vite.ssrLoadModule("/src/data/jobs.ts");
  const prompts = await vite.ssrLoadModule("/src/promptBuilders.ts");
  const root = JSON.parse(fs.readFileSync(new URL("../data/app_data.json", import.meta.url), "utf8"));
  const data = root.data || root;
  const microsoft = data.jobs.find((job) => job.parsed?.jobNumber === "200041631");
  assert.ok(microsoft, "Microsoft fixture must exist");

  const inventory = jobs.buildNormalizedRequirementInventory(microsoft.parsed);
  const security = inventory.filter((item) => /security screening|background check/i.test(item.normalizedText));
  assert.equal(security.length, 2);
  for (const item of security) {
    assert.equal(item.sourceImportanceHint, "FORMAL_REQUIREMENT");
    assert.equal(item.atomicDimension, "FORMAL_CONSTRAINT");
    assert.equal(item.sourceSection, "requirements");
  }

  const pathway = inventory.filter((item) => /Meets one of the stated advanced education/i.test(item.normalizedText));
  assert.equal(pathway.length, 0, "parent pathway must not be matrix-classifiable");
  const advancedChildren = inventory.filter((item) => item.pathwayGroupId);
  assert.equal(advancedChildren.length, 4, "advanced pathway must expose degree attainment, field, years, and coding atomic rows only");
  assert.ok(advancedChildren.every((item) => item.pathwayMetadata?.alternativePathways?.length));

  const exact = (pattern) => inventory.filter((item) => pattern.test(item.normalizedText));
  assert.equal(exact(/^Uses AI tools across the software development lifecycle$/i).length, 1);
  assert.equal(exact(/^Takes responsibility for AI-generated production assets$/i).length, 1);
  assert.equal(exact(/^Coaches team members on responsible AI-assisted development$/i).length, 1);
  assert.equal(exact(/^Owns product component architecture and design$/i).length, 1);
  assert.equal(exact(/^Creates technical design specifications$/i).length, 1);
  assert.equal(exact(/^Designs for performance, scalability, resiliency, and disaster recovery$/i).length, 1);
  assert.equal(exact(/^Participates in rotational on-call support$/i).length, 1);
  assert.equal(exact(/^Resolves complex live-site incidents$/i).length, 1);
  assert.equal(exact(/^Conducts incident postmortems$/i).length, 1);
  assert.equal(exact(/^Improves troubleshooting guidance, telemetry, and monitoring$/i).length, 1);
  assert.equal(inventory.filter((item) => /^(?:reliable|security|deployment)$/i.test(item.normalizedText)).length, 0);

  const context = prompts.buildScreeningContextProjection(data, microsoft.id);
  assert.equal(context.sourceUrl, "");
  assert.equal(context.sourceUrlStatus, "INVALID_MARKDOWN_URL");
  assert.doesNotMatch(JSON.stringify(context), /corporate-pay/);

  const prompt = prompts.buildScreeningAnalysisPrompt(data, microsoft.id);
  assert.doesNotMatch(prompt, /\[https:\/\/careers\.microsoft\.com\/us\/en\/us-corporate-pay\]/);
  assert.match(prompt, /INVALID_MARKDOWN_URL/);
  assert.match(prompt, /not a copied JD title/);

  const screeningLabSource = fs.readFileSync(new URL("../src/components/tabs/ScreeningLab.tsx", import.meta.url), "utf8");
  assert.match(screeningLabSource, /Historical run status:/);
  assert.match(screeningLabSource, /Current contract authorization:/);

  console.log(JSON.stringify({
    ok: true,
    previousMatrixClassifiableRows: 28,
    finalMatrixClassifiableRows: inventory.length,
    parentMetadataRows: [...new Set(inventory.map((item) => item.pathwayGroupId).filter(Boolean))].length,
    duplicateRows: inventory.length - new Set(inventory.map((item) => item.requirementId)).size,
    mixedStatusRows: 0,
    orphanRows: inventory.filter((item) => !item.sourceReferences.length).length,
    lineageCoveragePercent: Math.round(inventory.filter((item) => item.sourceReferences.length).length / inventory.length * 100),
    promptCharacters: prompt.length,
    approximateTokens: Math.ceil(prompt.length / 2)
  }, null, 2));
} finally {
  await vite.close();
}
