import { strict as assert } from "node:assert";
import { createNoAiInvocationGuard } from "./product-acceptance/noAiGuard.mjs";
import { runProductAcceptanceSuite } from "./product-acceptance/userJourneyRunner.mjs";

const guard = createNoAiInvocationGuard();

assert.throws(() => guard.guardedSpawn("codex exec --model gpt-5"), /AI invocation blocked/, "Codex CLI spawn must be blocked");
assert.throws(() => guard.guardedAutomationState("ai-running"), /AI invocation blocked/, "AI-running automation state must be blocked");
assert.throws(() => guard.guardedFetch("https://api.openai.com/v1/responses"), /AI invocation blocked/, "OpenAI API endpoint must be blocked");

const suite = runProductAcceptanceSuite();
assert.equal(suite.noAiInvocation, true, "product acceptance suite must complete with zero AI attempts");
assert.equal(suite.finalPass, true, "product acceptance suite must still pass without AI");

console.log(JSON.stringify({
  ok: true,
  checked: [
    "Codex CLI spawn blocked",
    "OpenAI endpoint blocked",
    "AI-running automation state blocked",
    "product acceptance suite made zero AI attempts"
  ]
}, null, 2));
