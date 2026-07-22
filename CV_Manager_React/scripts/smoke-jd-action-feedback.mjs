import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const intake = await readFile("src/components/tabs/JDIntake.tsx", "utf8");
const primitives = await readFile("src/components/ui/primitives.tsx", "utf8");
const app = await readFile("src/App.tsx", "utf8");
const storage = await readFile("src/storage.ts", "utf8");

assert.match(intake, /Parsed JD applied successfully\./, "Apply must show distinct success feedback");
assert.match(intake, /Review the fields, then click Save JD to keep the changes\./, "Apply feedback must state that persistence is still required");
assert.match(intake, /Unsaved changes/, "Apply must visibly mark unsaved form state");
assert.match(primitives, /Applying…/, "Apply must expose an in-progress label");
assert.match(intake, /Saving…/, "Save must expose an in-progress label");
assert.match(intake, /JD saved successfully\./, "new Job persistence must show success");
assert.match(intake, /JD updated successfully\./, "existing Job persistence must show distinct success");
assert.match(intake, /role=\{.*"status".*\}\s+aria-live=\{.*"polite"/, "success feedback must be announced accessibly");
assert.match(intake, /role=\{.*"alert".*\}/, "failure feedback must use alert semantics");
assert.match(primitives, /applying\?: boolean/, "Parse Preview must accept Apply loading state");
assert.match(primitives, /disabled=\{!preview\.parsed \|\| applying\}/, "Apply must be duplicate-submit safe");
assert.match(app, /waitForPersistence/, "JD callbacks must wait for the existing persistence owner");
assert.match(storage, /Another tab or process saved newer data|revision conflict/i, "existing revision-conflict recovery semantics must remain");
assert.doesNotMatch(intake, /applyPreview[\s\S]{0,800}(startAutomation|buildScreening|saveJob\()/, "Apply feedback must not add persistence, Screening, or AI");

console.log(JSON.stringify({
  ok: true,
  checked: [
    "distinct Apply and Save/Update feedback",
    "persistence-confirmed success",
    "loading and duplicate-submit protection",
    "unsaved status and accessible outcomes",
    "revision conflict and no-AI boundaries"
  ]
}, null, 2));
