import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createServerConfig } = require("../serverConfig.cjs");
const { buildCodexArgs, createAutomationService, extractJsonCandidate, stripCodeFence } = require("../automationService.cjs");

assert.equal(stripCodeFence("```json\n{\"ok\":true}\n```"), "{\"ok\":true}");
assert.equal(extractJsonCandidate("noise before {\"ok\":true} noise after"), "{\"ok\":true}");
assert.throws(() => extractJsonCandidate("not json"), /did not return parseable JSON/);

const automation = createAutomationService(createServerConfig({
  CODEX_BIN: "codex-test",
  CODEX_MODEL: "gpt-5.5-mini",
  CV_MANAGER_AUTOMATION_JOB_TTL_MS: "1000",
  CV_MANAGER_AUTOMATION_TIMEOUT_MS: "1000"
}));

assert.equal(automation.codexBin, "codex-test");
assert.equal(automation.codexModel, "gpt-5.5-mini");
const args = buildCodexArgs({ codexModel: automation.codexModel }, "/tmp/codex-output.json");
assert.equal(args.filter((value) => value === "--model").length, 1);
assert.equal(args.filter((value) => value === "gpt-5.5-mini").length, 1);
assert.equal(args.includes("gpt-5-mini"), false);
assert.equal(automation.hasActiveJob(), false);
const job = automation.createJob("screening-cv");
assert.equal(job.status, "queued");
assert.equal(automation.hasActiveJob(), true);
assert.equal(automation.getJob(job.id).kind, "screening-cv");
assert.equal(automation.getJob("missing"), undefined);

console.log(JSON.stringify({ ok: true, checked: ["json extraction", "job lifecycle", "model reporting"] }, null, 2));
