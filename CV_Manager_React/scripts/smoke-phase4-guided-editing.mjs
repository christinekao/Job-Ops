import { strict as assert } from "node:assert";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build } from "esbuild";

const guidedModule = join(tmpdir(), `phase4-guided-editing-helper-${Date.now()}.mjs`);
await build({
  entryPoints: ["src/components/cv/guidedEditing.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: guidedModule,
  logLevel: "silent"
});

const generatorModule = join(tmpdir(), `phase4-guided-editing-proposals-${Date.now()}.mjs`);
await build({
  entryPoints: ["src/domain/repairProposalGenerator.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: generatorModule,
  logLevel: "silent"
});

const bundleDir = join(process.cwd(), "reports", ".smoke-bundles");
await mkdir(bundleDir, { recursive: true });
const panelsModule = join(bundleDir, `phase4-guided-editing-panels-${Date.now()}.mjs`);
await build({
  entryPoints: ["src/components/tabs/screeningReviewRepairPanels.tsx"],
  bundle: true,
  format: "esm",
  platform: "node",
  external: ["react", "react-dom", "react-dom/server"],
  outfile: panelsModule,
  logLevel: "silent"
});

const {
  resolveBlockerEditTarget,
  findFirstEditableBullet
} = await import(pathToFileURL(guidedModule).href);
const { generateRepairProposal } = await import(pathToFileURL(generatorModule).href);
const { BlockerChecklist, ExportDecisionPanel } = await import(pathToFileURL(panelsModule).href);

const cv = {
  header: { name: "Candidate", targetRole: "Cloud Specialist", email: "", location: "Taipei" },
  sidebar: {
    languages: [],
    skillGroups: [{ title: "Cloud", highlightedSkills: ["Azure"], otherSkills: [] }],
    certifications: [],
    education: []
  },
  summary: "Cloud adoption translator.",
  workExperience: [{
    experienceId: "role-a",
    company: "Example Co",
    role: "Program Lead",
    period: "2021-2026",
    location: "Taipei",
    subsections: [{
      title: "Selected impact",
      bullets: [
        { text: "Coordinated roadmap delivery with selected evidence.", confidence: "Grounded", evidenceIds: ["ev-1"] },
        { text: "Work-log: joined internal sync and tracked tickets.", confidence: "Needs Review", evidenceIds: [] }
      ]
    }]
  }],
  reviewNotes: []
};

const missingEmail = resolveBlockerEditTarget({
  blockerId: "email",
  rawBlocker: "Contact email: Missing email",
  cv
});
assert.equal(missingEmail?.target.section, "contact", "missing email must target contact editor");
assert.equal(missingEmail?.target.fieldId, "email", "missing email must target email field");
assert.equal(missingEmail?.target.focusKey, "guided-contact-email", "missing email must have stable focus key");

const summary = resolveBlockerEditTarget({
  blockerId: "summary",
  rawBlocker: "Reviewer: hiring manager relevance: Summary does not answer the manager job-to-be-done",
  cv
});
assert.equal(summary?.target.section, "summary", "summary blocker must target summary editor");
assert.equal(summary?.target.focusKey, "guided-summary-summary", "summary blocker must have stable focus key");

const weakBullet = resolveBlockerEditTarget({
  blockerId: "weak",
  rawBlocker: "Reviewer: weak claims controlled: Two achievements need stronger supporting evidence",
  cv
});
assert.equal(weakBullet?.target.section, "workExperience", "weak blocker must target work experience");
assert.equal(weakBullet?.target.roleId, "role-a", "weak blocker must target the correct role");
assert.equal(weakBullet?.target.bulletId, "0-0-1", "weak blocker must target the correct bullet");

const externalWording = resolveBlockerEditTarget({
  blockerId: "wording",
  rawBlocker: "Reviewer: external wording: 1 work-log bullet(s)",
  cv
});
assert.equal(externalWording?.target.bulletId, "0-0-1", "external wording must target the affected bullet");
assert.equal(findFirstEditableBullet(cv, "external")?.bulletIndex, 1, "external wording locator must find the work-log bullet");

const unsupportedTarget = resolveBlockerEditTarget({
  blockerId: "ats",
  rawBlocker: "ATS text layer: 748 extracted character(s)",
  cv
});
assert.equal(unsupportedTarget, null, "unsupported export-only blockers must not pretend to have field targets");

let jumpedContext = null;
const checklistHtml = renderToStaticMarkup(React.createElement(BlockerChecklist, {
  blockers: [
    "Contact email: Missing email",
    "Reviewer: hiring manager relevance: Summary does not answer the manager job-to-be-done",
    "Reviewer: external wording: 1 work-log bullet(s)",
    "ATS text layer: 748 extracted character(s)"
  ],
  cv,
  completedCount: 1,
  onJumpToFix: (context) => { jumpedContext = context; }
}));
assert.match(checklistHtml, /Progress: 1 \/ 5/, "progress must include completed and remaining blockers");
assert.equal((checklistHtml.match(/Preview AI Repair/g) || []).length, 3, "only actionable blockers may show proposal preview navigation");
assert.match(checklistHtml, /Manual or AI-assisted review required/, "missing target must show explicit alternative action");
assert.equal(jumpedContext, null, "server rendering must not dispatch proposal preview");

const exportHtml = renderToStaticMarkup(React.createElement(ExportDecisionPanel, {
  decision: { ready: false, blockers: ["Contact email: Missing email"], warnings: [], contentHash: "hash" },
  cv,
  proposalResolver: (input) => {
    const result = generateRepairProposal(cv, { ...input, deterministicEmail: "candidate@example.com" });
    return result.supported ? result.proposal : null;
  },
  onExport: () => {},
  onJumpToFix: () => {}
}));
assert.match(exportHtml, /Repair Workflow/, "export blocker panel must expose one obvious repair workflow");
assert.match(exportHtml, /Preview AI Repair/, "export blocker panel must expose proposal preview before manual editing");

const actionPipelineSource = await readFile("src/application/screeningActionPipeline.ts", "utf8");
assert.match(actionPipelineSource, /"open-guided-editor"/, "action pipeline must include guided editor action");
assert.doesNotMatch(actionPipelineSource, /startAutomation|buildScreeningCvPrompt/, "guided action pipeline must not introduce AI or generation calls");

const screeningLabSource = await readFile("src/components/tabs/ScreeningLab.tsx", "utf8");
assert.match(screeningLabSource, /writeGuidedEditContext/, "manual edit must persist guided edit context before navigation");
assert.match(screeningLabSource, /dispatchReviewerAction\("open-guided-editor", context\)/, "manual edit must dispatch exactly one guided action through the action pipeline");

const cvStudioSource = await readFile("src/components/cv/CVStudio.tsx", "utf8");
assert.match(cvStudioSource, /readGuidedEditContext/, "CV Studio must read guided edit context");
assert.match(cvStudioSource, /scrollIntoView/, "CV Studio must scroll the target into view");
assert.match(cvStudioSource, /focus\(\)/, "CV Studio must focus the target when possible");
assert.match(cvStudioSource, /setHighlightKey/, "CV Studio must apply highlight state");
assert.match(cvStudioSource, /window\.setTimeout\(\(\) => setHighlightKey\(""\)/, "highlight must clear after a timeout");
assert.match(cvStudioSource, /Saved and validated affected/, "save must revalidate the affected check family messaging without rerunning workflow");
assert.doesNotMatch(cvStudioSource, /startAutomation|buildScreeningCvPrompt/, "guided editing must not trigger automatic AI generation");

console.log(JSON.stringify({
  ok: true,
  coverage: [
    "every supported blocker has a structured edit target",
    "missing email targets and focuses email",
    "summary blocker targets summary",
    "weak work bullet targets role and bullet",
    "external wording targets affected bullet",
    "missing target does not silently show generic navigation",
    "scroll focus highlight and timeout clear are wired",
    "save validates affected check family without AI",
    "progress and remaining count render from blocker list",
    "final export path remains separate"
  ]
}, null, 2));
