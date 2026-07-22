import { strict as assert } from "node:assert";
import { access } from "node:fs/promises";
import { runProductAcceptanceSuite } from "./product-acceptance/userJourneyRunner.mjs";

const result = runProductAcceptanceSuite();

assert.equal(result.finalPass, true, "product acceptance final gate must pass");
assert.equal(result.journeyPass, true, "simulated user journey must pass");
assert.equal(result.hrPass, true, "HR gate must pass");
assert.equal(result.hiringManagerPass, true, "Hiring Manager gate must pass");
assert.equal(result.exportReady, true, "export must become ready");
assert.equal(result.noAiInvocation, true, "no AI invocation may occur");
assert.equal(result.issues.length, 0, "no acceptance issues should remain");
assert.equal(result.scenarios.length, 5, "all required scenarios must run");

for (const scenario of result.scenarios) {
  assert.equal(scenario.finalPass, true, `${scenario.scenarioId} must pass final gate`);
  assert.equal(scenario.onePrimaryCta, true, `${scenario.scenarioId} must have exactly one primary CTA per state`);
  assert.equal(scenario.progress.finalBlockers, 0, `${scenario.scenarioId} blockers must clear`);
  for (const count of Object.values(scenario.stageCounts)) {
    assert.equal(count, 1, `${scenario.scenarioId} stages must advance exactly once`);
  }
}

await access(result.generatedCvFixturePath);

console.log(JSON.stringify({
  ok: true,
  finalPass: result.finalPass,
  generatedCvFixturePath: result.generatedCvFixturePath,
  scenarios: result.scenarios.map((scenario) => ({
    id: scenario.scenarioId,
    hrScore: scenario.hr.score,
    hiringManagerScore: scenario.hiringManager.score,
    exportReady: scenario.exportReady
  }))
}, null, 2));
