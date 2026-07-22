import assert from "node:assert/strict";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFile } from "node:fs/promises";

const bundledModule = join(tmpdir(), `phase3-architecture-wave3-${Date.now()}.mjs`);
await build({
  entryPoints: ["src/application/screeningActionPipeline.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: bundledModule,
  logLevel: "silent"
});

const {
  dispatchScreeningAction,
  resolveScreeningActionRefresh,
  screeningActionKey
} = await import(pathToFileURL(bundledModule).href);

const command = { id: "apply-safe-repair", cvContentHash: "cv-hash-a" };
let executionCount = 0;
const result = await dispatchScreeningAction({
  command,
  completedActionKeys: new Set(),
  execute: () => {
    executionCount += 1;
    return {
      status: "success",
      message: "Safe repair completed.",
      affectedZones: ["workExperience"],
      currentCvHash: "cv-hash-b",
      refresh: ["workflow", "review", "repair", "export"]
    };
  }
});
assert.equal(executionCount, 1, "one button command must execute exactly once");
assert.equal(result.status, "success", "successful execution must be explicit");
assert.equal(result.actionId, "apply-safe-repair", "result must retain action identity");
assert.ok(result.timestamp, "result must contain a timestamp");
assert.equal(result.currentCvHash, "cv-hash-b", "result must contain the current CV hash");
assert.deepEqual(result.affectedZones, ["workExperience"], "result must include affected zones");

const refresh = resolveScreeningActionRefresh(result);
assert.deepEqual(refresh.domains, ["workflow", "review", "repair", "export"], "state refresh must include only the action's affected domains");
assert.equal(refresh.refreshPrimaryCta, true, "CTA refresh must be requested after the state refresh result");

const duplicate = await dispatchScreeningAction({
  command,
  completedActionKeys: new Set([screeningActionKey(command)]),
  execute: () => {
    throw new Error("duplicate executor must not run");
  }
});
assert.equal(duplicate.status, "blocked", "a completed repair for the same CV hash must not execute twice");
assert.match(duplicate.message, /already completed/i, "duplicate result must explain why it was blocked");

const noSafeFix = await dispatchScreeningAction({
  command: { id: "apply-safe-repair", cvContentHash: "cv-hash-c" },
  completedActionKeys: new Set(),
  execute: () => ({
    status: "no-safe-fix",
    message: "No permitted repair zone exists.",
    affectedZones: [],
    currentCvHash: "cv-hash-c",
    refresh: ["review", "repair"]
  })
});
assert.equal(noSafeFix.status, "no-safe-fix", "no-safe-fix must remain an explicit action outcome");
assert.match(noSafeFix.message, /No permitted repair zone/i, "no-safe-fix must expose its reason");

const failure = await dispatchScreeningAction({
  command: { id: "start-ai-repair", cvContentHash: "cv-hash-c" },
  completedActionKeys: new Set(),
  execute: () => { throw new Error("automation unavailable"); }
});
assert.equal(failure.status, "error", "executor errors must never be silent");
assert.match(failure.message, /automation unavailable/i, "executor error reason must remain visible");

const pipelineSource = await readFile("src/application/screeningActionPipeline.ts", "utf8");
assert.doesNotMatch(pipelineSource, /from\s+["']react["']/, "action pipeline must not import UI runtime");
assert.doesNotMatch(pipelineSource, /set[A-Z][A-Za-z]+\(/, "action pipeline must not update UI state directly");

const screeningLabSource = await readFile("src/components/tabs/ScreeningLab.tsx", "utf8");
assert.match(screeningLabSource, /dispatchScreeningAction/, "Reviewer controls must dispatch through the action pipeline");
assert.match(screeningLabSource, /resolveScreeningActionRefresh/, "Reviewer controls must request state refresh before CTA render");
assert.match(screeningLabSource, /reviewerActionResult/, "Reviewer UI must render the latest explicit action result");
assert.equal((screeningLabSource.match(/dispatchReviewerAction\("apply-safe-repair"\)/g) || []).length, 1, "only one safe-repair dispatch control may remain in the reviewer surface");
assert.doesNotMatch(screeningLabSource, /onClick=\{applyLocalReviewerContentFix\}/, "old direct local-fix UI handler must be removed from the reviewer surface");

console.log(JSON.stringify({
  ok: true,
  coverage: [
    "one command dispatch executes once",
    "action result has id timestamp zones hash and refresh requirements",
    "state refresh precedes CTA refresh",
    "duplicate repair is blocked",
    "no-safe-fix and executor error expose reasons",
    "pipeline does not update UI directly",
    "reviewer UI dispatches one safe-repair command and renders explicit result"
  ]
}, null, 2));
