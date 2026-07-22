import { build } from "esbuild";
import assert from "node:assert/strict";

await build({
  entryPoints: ["src/domain/screeningReviewRoles.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: ".tmp-screening-review-roles.mjs"
});

const { roleForCheck, roleFixLabel } = await import("../.tmp-screening-review-roles.mjs");

const cases = [
  ["Reviewer: hiring manager relevance", "hiring-manager", "Local fix available"],
  ["Reviewer: HR scan", "ats", "Local fix available"],
  ["Reviewer: evidence traceability", "evidence", "Local fix available"],
  ["Reviewer: external wording", "wording", "Local fix available"],
  ["Contact extraction", "export", "Manual/export fix"]
];

for (const [label, expectedRole, expectedFixLabel] of cases) {
  const role = roleForCheck({ label });
  assert.equal(role.id, expectedRole, `${label} should route to ${expectedRole}`);
  assert.equal(roleFixLabel(role), expectedFixLabel, `${label} should show ${expectedFixLabel}`);
}

console.log(JSON.stringify({
  ok: true,
  checked: cases.map(([label, role]) => `${label} -> ${role}`)
}, null, 2));
