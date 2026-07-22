import { strict as assert } from "node:assert";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const orchestratorModule = join(tmpdir(), `repair-policy-${Date.now()}.mjs`);
await build({
  entryPoints: ["src/domain/repairOrchestrator.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: orchestratorModule,
  logLevel: "silent"
});

const {
  orchestrateRepair,
  classifyStructuredRepairIssue
} = await import(pathToFileURL(orchestratorModule).href);

const baseInput = {
  cvVersionId: "cv-adr006",
  cvContentHash: "hash-adr006",
  blockers: [
    "Legacy blocker that should not be used when structured issues exist"
  ],
  selectedEvidenceIds: ["ev-1", "ev-2"],
  effectiveCvBriefHash: "brief-adr006"
};

const issues = [
  {
    id: "issue-capability-gap",
    category: "Capability Gap",
    severity: "Medium",
    title: "Truthful capability gap",
    description: "Azure quota ownership is not supported.",
    evidence: {
      evidenceIds: [],
      screeningAnalysisPath: "screeningAnalysis.remainingGaps",
      positioningReportPath: "positioningReport.truthfulCapabilityGaps",
      reason: "Capability gaps come from upstream Analysis / Positioning Report."
    },
    repairability: "not-repairable",
    suggestedRepairIntent: "Do not rewrite as a solved strength.",
    expectedRepairBoundary: [],
    exportSignal: "warn"
  },
  {
    id: "issue-external-wording",
    category: "External Wording",
    severity: "Medium",
    title: "Action/outcome bullet strength is low",
    description: "Bullets can be made clearer.",
    evidence: {
      evidenceIds: ["ev-1"],
      reason: "Wording can improve without changing claim strength."
    },
    repairability: "targeted-repair",
    suggestedRepairIntent: "Rewrite bullets into action + scope + business outcome while preserving evidence IDs.",
    expectedRepairBoundary: ["workExperience"],
    exportSignal: "warn"
  },
  {
    id: "issue-profile",
    category: "Profile Completeness",
    severity: "High",
    title: "Trusted profile contact data is incomplete",
    description: "Missing trusted email.",
    visibleLocation: { section: "header" },
    evidence: {
      evidenceIds: [],
      reason: "Profile/contact data must come from trusted user/profile input."
    },
    repairability: "human-input",
    suggestedRepairIntent: "Collect trusted contact data from the user or profile source.",
    expectedRepairBoundary: ["header.contact"],
    exportSignal: "block"
  },
  {
    id: "issue-keywords",
    category: "Keyword Coverage",
    severity: "Medium",
    title: "Evidence-supported keywords are under-placed",
    description: "Supported keyword gap.",
    evidence: {
      evidenceIds: ["ev-2"],
      cvBriefPath: "cvBrief.skillsToForeground",
      reason: "These keywords are evidence-supported."
    },
    repairability: "targeted-repair",
    suggestedRepairIntent: "Add only evidence-supported keywords.",
    expectedRepairBoundary: ["summary", "sidebar.skills"],
    exportSignal: "warn"
  }
];

const summary = orchestrateRepair({
  ...baseInput,
  structuredIssues: issues
});

assert.equal(summary.totalBlockers, 4, "structured issues must be the primary repair input");
assert.equal(summary.unsupported.length, 1, "Capability Gap must not be repairable");
assert.equal(summary.unsupported[0].reviewerIssueId, "issue-capability-gap", "Capability Gap classification must preserve reviewer issue id");
assert.equal(summary.unsupported[0].source, "structured-reviewer-contract", "structured issues must be marked as structured source");
assert.match(summary.unsupported[0].unsupportedReason || "", /solved strength/i, "Capability Gap must explain why CV mutation is blocked");

assert.equal(summary.approvalRequired.length, 2, "External Wording and Keyword Coverage should require bounded approval");
assert.deepEqual(summary.approvalRequired.find((item) => item.reviewerIssueId === "issue-external-wording")?.allowedMutationZones, ["workExperience"], "External Wording must preserve Reviewer mutation boundary");
assert.deepEqual(summary.approvalRequired.find((item) => item.reviewerIssueId === "issue-keywords")?.allowedMutationZones, ["summary", "sidebar.skills"], "Keyword Coverage must preserve Reviewer mutation boundary");
assert.equal(summary.humanInput.length, 1, "Profile Completeness must route to human input");
assert.equal(summary.humanInput[0].allowedMutationZones[0], "header.contact", "Profile Completeness must stay in contact boundary");

for (const item of [...summary.approvalRequired, ...summary.humanInput, ...summary.unsupported]) {
  assert.equal(item.cvVersionId, "cv-adr006", "classification must bind CV version");
  assert.equal(item.cvContentHash, "hash-adr006", "classification must bind CV content hash");
  assert.ok(item.rawBlocker, "classification must keep a user-readable source label");
  assert.ok(item.reviewerCategory, "structured classification must preserve Reviewer category");
  assert.ok(item.reviewerSeverity, "structured classification must preserve Reviewer severity");
  assert.ok(item.reviewerRepairability, "structured classification must preserve Reviewer repairability");
}

const capability = classifyStructuredRepairIssue(baseInput, issues[0], 0);
assert.equal(capability.route, "unsupported", "Capability Gap must never be auto-repaired");
assert.equal(capability.canUseExistingLocalRepair, false, "Capability Gap must not use safe local repair");
assert.equal(capability.canRequestAiProposal, false, "Capability Gap must not request AI wording proposal");
assert.equal(capability.canRunTargetedRegeneration, false, "Capability Gap must not run targeted regeneration");

const legacy = orchestrateRepair({
  ...baseInput,
  structuredIssues: [],
  blockers: ["Contact extraction: Missing email"],
  trustedProfileEmail: "candidate@example.com"
});
assert.equal(legacy.safeAuto.length, 1, "legacy blocker fallback must remain available when structured issues are absent");
assert.equal(legacy.safeAuto[0].source, "legacy-blocker", "legacy fallback must be marked as legacy source");

console.log(JSON.stringify({
  ok: true,
  coverage: [
    "structured repair contract is primary input",
    "legacy blocker fallback remains available",
    "Capability Gap is not repairable by CV mutation",
    "Profile Completeness requires human input",
    "External Wording and Keyword Coverage preserve expected repair boundaries",
    "Reviewer category, severity, repairability, issue id, CV version, and content hash are retained",
    "Repair does not recompute Reviewer classification"
  ]
}, null, 2));
