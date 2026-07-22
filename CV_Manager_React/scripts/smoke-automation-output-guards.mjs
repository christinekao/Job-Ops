import assert from "node:assert/strict";
import { describeCodexOutputFailure } from "../automationOutputGuards.cjs";

const creditMessage = describeCodexOutputFailure({
  raw: '{"token_count":{"has_credits":false,"balance":"0"},"last_agent_message":null}'
});
assert.match(creditMessage, /no available credits|usage limit/i);
assert.match(creditMessage, /No CV data was applied/i);

const emptyMessage = describeCodexOutputFailure({ raw: "" });
assert.match(emptyMessage, /without any output/i);
assert.match(emptyMessage, /No CV data was applied/i);

const malformedMessage = describeCodexOutputFailure({ raw: "I cannot complete this request." });
assert.match(malformedMessage, /did not return parseable JSON/i);
assert.match(malformedMessage, /Output preview/i);

const exitMessage = describeCodexOutputFailure({ raw: "", stderr: "codex exited unexpectedly", exitCode: 1 });
assert.match(exitMessage, /exited with code 1/i);

const fatalAfterWarnings = describeCodexOutputFailure({
  stderr: [
    "WARN model personality metadata unavailable",
    "WARN plugin icon path ignored",
    "ERROR authentication failed: login required"
  ].join("\n"),
  exitCode: 1
});
assert.match(fatalAfterWarnings, /authentication failed: login required/i);
assert.doesNotMatch(fatalAfterWarnings, /plugin icon path ignored/i);

console.log(JSON.stringify({
  ok: true,
  checked: ["no credits", "empty output", "malformed output", "non-zero exit", "fatal stderr after warnings"],
  appliedData: false
}, null, 2));
