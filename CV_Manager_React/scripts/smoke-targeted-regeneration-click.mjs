import { strict as assert } from "node:assert";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { readFile } from "node:fs/promises";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build } from "esbuild";

async function bundle(entry, name, external = []) {
  const outfile = join(process.cwd(), "reports", ".smoke-bundles", `${name}-${Date.now()}.mjs`);
  await build({ entryPoints: [entry], bundle: true, format: "esm", platform: "node", external, outfile, logLevel: "silent" });
  return import(pathToFileURL(outfile).href);
}

const { ExportDecisionPanel } = await bundle("src/components/tabs/screeningReviewRepairPanels.tsx", "targeted-regeneration-click-panel", ["react", "react-dom", "react-dom/server"]);
const { dispatchScreeningAction, isTargetedRegenerationCommand } = await bundle("src/application/screeningActionPipeline.ts", "targeted-regeneration-click-pipeline");
const { orchestrateRepair } = await bundle("src/domain/repairOrchestrator.ts", "targeted-regeneration-click-orchestrator");
const { contentHash } = await bundle("src/utils/hash.ts", "targeted-regeneration-click-hash");

const cv = {
  header: { name: "Alex Chen", targetRole: "Customer Automation Specialist", email: "alex@example.com", location: "Taipei" },
  sidebar: { languages: [], skillGroups: [], certifications: [], education: [] },
  summary: "Customer operator seeking work.",
  workExperience: [{ experienceId: "exp-current", company: "Acme", role: "Specialist", period: "2022-Present", location: "Taipei", subsections: [{ title: "Impact", bullets: [{ text: "Mapped stakeholder requests into workflow delivery.", evidenceIds: ["evi-workflow"], confidence: "Grounded" }] }] }],
  keywordPlacementNotes: [], interviewNotes: [], reviewNotes: []
};
const cvHash = contentHash(cv);
const summary = orchestrateRepair({ cvVersionId: "cv-click-1", cvContentHash: cvHash, blockers: ["Summary needs clearer role fit"], cv, selectedEvidenceIds: ["evi-workflow"], effectiveCvBriefHash: "brief-click-1" });

function panel(extra = {}) {
  return renderToStaticMarkup(React.createElement(ExportDecisionPanel, {
    decision: { ready: false, blockers: ["Summary needs clearer role fit"], warnings: [], contentHash: cvHash },
    cv,
    repairOrchestration: summary,
    onExport: () => {},
    onRunTargetedRegeneration: () => {},
    ...extra
  }));
}

const readyHtml = panel();
assert.match(readyHtml, /Regenerate Summary with AI/, "summary action must be rendered with a production callback");
assert.match(readyHtml, /data-testid="repair-orchestrator-cta"/, "visible action must have one real button target");
const disabledHtml = panel({ targetedRegenerationDisabledReason: "AI actions are locked. Enable AI actions first if you intentionally want to spend tokens." });
assert.match(disabledHtml, /targeted-regeneration-disabled-reason/, "disabled AI state must explain why execution is unavailable");
assert.match(disabledHtml, /disabled=""/, "disabled AI state must prevent execution");
assert.match(panel({ targetedRegenerationLifecycle: "running" }), /Regenerating Summary/, "running lifecycle must be visible");
assert.match(panel({ targetedRegenerationLifecycle: "validating" }), /Validating regenerated content/, "validating lifecycle must be visible");

const command = {
  id: "run-targeted-regeneration",
  requestId: "request-click-1",
  blockerIds: ["Summary needs clearer role fit"],
  targetZones: ["summary"],
  cvVersionId: "cv-click-1",
  cvContentHash: cvHash,
  effectiveCvBriefHash: "brief-click-1",
  selectedEvidenceIds: ["evi-workflow"]
};
assert.equal(isTargetedRegenerationCommand(command), true);
let executions = 0;
const result = await dispatchScreeningAction({ command, completedActionKeys: new Set(), execute: async () => { executions += 1; return { status: "success", message: "done", affectedZones: ["summary"], refresh: ["workflow", "review", "repair", "export"] }; } });
assert.equal(result.status, "success");
assert.equal(executions, 1, "one click command must execute exactly once");

const labSource = await readFile("src/components/tabs/ScreeningLab.tsx", "utf8");
const panelSource = await readFile("src/components/tabs/screeningReviewRepairPanels.tsx", "utf8");
assert.match(labSource, /reviewerActionPendingRef\.current/, "duplicate clicks must be guarded synchronously");
assert.match(labSource, /requestId: request\.id[\s\S]*blockerIds: request\.blockerIds[\s\S]*targetZones: request\.targetZones[\s\S]*cvVersionId: request\.cvVersionId/, "production command must carry the targeted identity contract");
assert.equal((panelSource.match(/onRunTargetedRegeneration\(\)/g) || []).length, 1, "presentation must emit exactly one targeted-regeneration callback");

console.log(JSON.stringify({ ok: true, coverage: ["enabled CTA", "disabled reason", "running", "validating", "typed command", "exactly one execution", "duplicate-click guard"] }, null, 2));
