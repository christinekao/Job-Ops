import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";

const types = await readFile(new URL("../src/types.ts", import.meta.url), "utf8");
const freshness = await readFile(new URL("../src/domain/reviewFreshness.ts", import.meta.url), "utf8");
const feedback = await readFile(new URL("../src/domain/targetedRegenerationFeedback.ts", import.meta.url), "utf8");
const lab = await readFile(new URL("../src/components/tabs/ScreeningLab.tsx", import.meta.url), "utf8");
const panels = await readFile(new URL("../src/components/tabs/screeningReviewRepairPanels.tsx", import.meta.url), "utf8");

assert.match(types, /repairOutcome\?: "passed" \| "still-failed"/);
assert.match(freshness, /recordSummaryRepairReview/);
assert.doesNotMatch(freshness, /PostRepairReviewClosure/);
assert.doesNotMatch(feedback, /reviewClosure/);
assert.match(lab, /repairReview=\{activeCv\?\.reviewSnapshot\?\.repairTargetZone/);
assert.match(panels, /aria-label="Repair Workflow"/);
assert.match(panels, /data-testid="repair-workflow-issue"/);
assert.match(panels, /data-testid="repair-workflow-fix"/);
assert.match(panels, /data-testid="repair-workflow-review"/);
assert.match(panels, /data-testid="repair-workflow-next"/);
assert.doesNotMatch(panels, /Updated Summary Review/);
assert.doesNotMatch(panels, /Post-repair review result/);
assert.doesNotMatch(panels, /<RepairOrchestrationPanel[\s\S]*data-testid="repair-orchestrator-cta"/, "orchestration detail must not render a competing CTA");

console.log(JSON.stringify({ ok: true, checked: ["review snapshot ownership", "closure state removed", "single workflow", "single next action"] }, null, 2));
