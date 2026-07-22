import assert from "node:assert/strict";
import fs from "node:fs";

const promptSource = fs.readFileSync(new URL("../src/promptBuilders.ts", import.meta.url), "utf8");
const labSource = fs.readFileSync(new URL("../src/components/tabs/ScreeningLab.tsx", import.meta.url), "utf8");
const typeSource = fs.readFileSync(new URL("../src/types.ts", import.meta.url), "utf8");

assert.match(promptSource, /screeningAnalysisPromptSchemaContract/, "Prompt must consume the generated runtime schema contract");
assert.doesNotMatch(promptSource, /Schema:\s*\{\s*["']?primaryTargetTitle/, "Prompt must not contain a hand-written Screening schema");
assert.match(labSource, /parseScreeningAnalysisAIOutput/, "Paste-back Apply must use the canonical runtime validator");
assert.match(typeSource, /ScreeningAnalysisAIOutput/, "Screening AI output type must come from the schema owner");

const schema = await import("../src/domain/screeningAnalysisSchema.ts");
const base = schema.screeningAnalysisAIOutputSchema;
const contract = schema.screeningAnalysisPromptJsonSchema;
assert.deepEqual(contract, schema.normalizePromptSchema(base), "generated Prompt schema must equal normalized runtime schema");
assert.equal(contract.additionalProperties, false);
assert.ok(!Object.hasOwn(contract.properties, "positioningReport"), "derived Positioning Report must stay outside AI schema");
for (const forbidden of ["schemaVersion", "schemaHash", "promptVersion", "promptHash", "inputHash", "savedAt", "completedAt"]) {
  assert.ok(!Object.hasOwn(contract.properties, forbidden), `${forbidden} must stay outside AI schema`);
}

const fixture = schema.createScreeningSchemaDriftFixture();
assert.ok(Object.hasOwn(fixture.added.contract.properties, "testOnlyField"));
assert.ok(!Object.hasOwn(fixture.removed.contract.properties, "testOnlyField"));
assert.notEqual(fixture.base.hash, fixture.added.hash);
assert.notEqual(fixture.added.hash, fixture.enumChanged.hash);
assert.notDeepEqual(fixture.added.contract.required, fixture.requiredChanged.contract.required);
assert.equal(fixture.enumChanged.contract.properties.testOnlyField.enum[1], "C");
assert.equal(fixture.enumChanged.validate({ testOnlyField: "B" }).success, false);
assert.equal(fixture.enumChanged.validate({ testOnlyField: "C" }).success, true);
assert.equal(schema.screeningAnalysisIdentityMatches({ inputHash: "i", schemaHash: schema.screeningAiSchemaHash, promptHash: "p" }, "i", "p"), true);
assert.equal(schema.screeningAnalysisIdentityMatches({ inputHash: "i" }, "i", "p"), false, "legacy result without schema identity must be stale");
assert.equal(schema.screeningAnalysisIdentityMatches({ inputHash: "i", schemaHash: schema.screeningAiSchemaHash, promptHash: "old" }, "i", "p"), false, "policy/Prompt identity changes must stale old results");
assert.equal(schema.screeningAiSchemaHash, schema.screeningAiSchemaHash, "UI-only state cannot alter schema hash");

const make = (node) => {
  if (node.type === "string") return node.enum ? node.enum[0] : "";
  if (node.type === "number") return 0;
  if (node.type === "boolean") return false;
  if (node.type === "array") return [];
  return Object.fromEntries(node.required.map((key) => [key, make(node.properties[key])]));
};
const validMinimal = make(schema.screeningAnalysisAIOutputSchema);
validMinimal.primaryTargetTitle = "Role";
assert.equal(schema.validateScreeningAnalysisAIOutput(validMinimal).success, true);
assert.equal(schema.validateScreeningAnalysisAIOutput({ ...validMinimal, positioningReport: {} }).success, false, "derived fields must be rejected");
assert.equal(schema.validateScreeningAnalysisAIOutput({ ...validMinimal, primaryTargetTitle: 4 }).success, false);
const stored = schema.createScreeningAnalysisStoredResult(validMinimal);
assert.equal(stored.positioning.applyTier, "Good");
assert.equal(Object.hasOwn(stored, "positioningReport"), false, "derived Positioning Report must be produced separately");
assert.equal(schema.adaptLegacyScreeningAnalysisForRead(stored, undefined).legacy, true);

console.log("Screening schema contract regression passed.");
