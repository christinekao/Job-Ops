import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const dataset = JSON.parse(await readFile("scripts/golden/fixtures/golden-jd-dataset-v1.json", "utf8"));
const schemaSource = await readFile("src/domain/screeningAnalysisSchema.ts", "utf8");
const requiredMappingFields = [
  "requirementId",
  "importance",
  "matchStatus",
  "supportedAspects",
  "unsupportedAspects",
  "explanation",
  "confidence",
  "cvUsage",
  "interviewUsage"
];

for (const field of requiredMappingFields) {
  assert.match(schemaSource, new RegExp(`\\b${field}\\b`), `Runtime Screening schema must request ${field}`);
}
for (const scenario of dataset.scenarios) {
  assert.ok(scenario.analysis?.jdEvidenceMapping?.length, `${scenario.scenario_id} recorded Screening output must include requirement mappings`);
  for (const mapping of scenario.analysis.jdEvidenceMapping) {
    for (const field of requiredMappingFields) {
      assert.notEqual(mapping[field], undefined, `${scenario.scenario_id}/${mapping.requirementId || "unknown"} recorded output is missing ${field}`);
    }
    if (mapping.matchStatus === "TRANSFERABLE_MATCH") {
      assert.ok(mapping.transferContext, `${scenario.scenario_id}/${mapping.requirementId} transferable match requires transferContext`);
    }
  }
}

console.log(JSON.stringify({
  ok: true,
  mode: "explicit-recorded-ai-fixture-validation",
  ai_invoked: false,
  dataset_version: dataset.dataset_version,
  scenarios: dataset.scenarios.map((scenario) => scenario.scenario_id),
  checked: ["production prompt schema", "recorded Screening output schema", "no exact prose comparison", "no network or AI invocation"]
}, null, 2));
