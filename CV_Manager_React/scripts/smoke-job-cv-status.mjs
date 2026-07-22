import assert from "node:assert/strict";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";

const moduleFile = join(tmpdir(), `job-cv-status-${Date.now()}.mjs`);
await build({ entryPoints: ["src/data/jobs.ts"], bundle: true, format: "esm", platform: "node", outfile: moduleFile, logLevel: "silent" });
const { deriveJobCvPipelineStatus } = await import(pathToFileURL(moduleFile).href);
const baseJob = { id: "job-1", company: "Example", role: "Role", location: "", rawJD: "JD", status: "Reviewed", fit: "High", nextAction: "", selectedEvidenceIds: [], selectedStoryIds: [], updatedAt: "2026-07-18T00:00:00.000Z" };
const version = (id, status) => ({ id, jdId: "job-1", status });
assert.equal(deriveJobCvPipelineStatus(baseJob, [version("ready", "Ready to Export"), version("old", "Editing")]), "Reviewed");
assert.equal(deriveJobCvPipelineStatus({ ...baseJob, status: "Applied" }, [version("old", "Editing")]), "Applied");
assert.equal(deriveJobCvPipelineStatus({ ...baseJob, status: "Archived" }, [version("old", "Editing")]), "Archived");
assert.equal(deriveJobCvPipelineStatus({ ...baseJob, status: "CV Drafted" }, [version("repair", "Ready for Review")]), "CV Drafted");
console.log(JSON.stringify({ ok: true, checked: ["ready plus editing", "applied", "archived", "repair version"] }, null, 2));
