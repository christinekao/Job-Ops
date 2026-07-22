import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";

const dataDir = mkdtempSync(join(tmpdir(), "cv-manager-server-test-"));
const port = 18000 + (process.pid % 10000);
const base = `http://127.0.0.1:${port}`;
const expectedCodexModel = process.env.CODEX_MODEL || "gpt-5.5-mini";
let childStdout = "";
let childStderr = "";
const child = spawn(process.execPath, ["server.cjs"], {
  cwd: process.cwd(),
  env: { ...process.env, CV_MANAGER_API_PORT: String(port), CV_MANAGER_DATA_DIR: dataDir, CODEX_MODEL: expectedCodexModel },
  stdio: ["ignore", "pipe", "pipe"]
});
child.stdout.on("data", (chunk) => {
  childStdout += String(chunk);
});
child.stderr.on("data", (chunk) => {
  childStderr += String(chunk);
});

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${base}/api/health`);
      if (response.ok) return;
    } catch {
      // Server may still be starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Test server did not start\nstdout:\n${childStdout.slice(-2000)}\nstderr:\n${childStderr.slice(-2000)}`);
}

try {
  await waitForServer();
  const health = await (await fetch(`${base}/api/automation/health`)).json();
  assert.equal(health.codexModel, expectedCodexModel);

  const initialResponse = await fetch(`${base}/api/data`);
  const initial = await initialResponse.json();
  assert.equal(initial.revision, 0);
  assert.ok(Array.isArray(initial.data.jobs));
  initial.data.jobs.push({
    id: "structured-jd-roundtrip",
    company: "Microsoft",
    role: "Principal Engineer",
    location: "Redmond",
    rawJD: "A complete readable job description retained alongside structured fields for persistence validation.",
    parsed: {
      company: "Microsoft",
      role: "Principal Engineer",
      location: "Redmond",
      jobNumber: "200041631",
      overview: "Build a trustworthy experimentation platform.",
      responsibilities: ["Own reliable distributed services."],
      requirements: ["Production coding experience."],
      preferredQualifications: ["A/B testing."],
      skills: ["C#", "Python"],
      keywords: [],
      employerSignal: "",
      risks: [],
      additionalAttributes: [{ label: "SEO category", value: "Architecture", sourcePath: "JobPosting.category" }],
      employerInsights: {
        topSkills: ["Architecture", "Automation"],
        previouslyWorkedAs: ["Senior Partner Manager"]
      }
    },
    status: "Parsed",
    fit: "Unknown",
    nextAction: "Review",
    selectedEvidenceIds: [],
    selectedStoryIds: [],
    updatedAt: "2026-07-19T00:00:00.000Z"
  });

  const firstSave = await fetch(`${base}/api/data`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: base.replace(String(port), "7790") },
    body: JSON.stringify({ revision: 0, data: initial.data })
  });
  assert.equal(firstSave.status, 200);
  assert.equal((await firstSave.json()).revision, 1);
  const reloaded = await (await fetch(`${base}/api/data`)).json();
  const structuredReload = reloaded.data.jobs.find((job) => job.id === "structured-jd-roundtrip");
  assert.deepEqual(structuredReload.parsed.skills, ["C#", "Python"]);
  assert.equal(structuredReload.parsed.jobNumber, "200041631");
  assert.equal(structuredReload.parsed.additionalAttributes[0].label, "SEO category");
  assert.deepEqual(structuredReload.parsed.employerInsights.topSkills, ["Architecture", "Automation"]);

  const staleSave = await fetch(`${base}/api/data`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ revision: 0, data: initial.data })
  });
  assert.equal(staleSave.status, 409);

  const forbidden = await fetch(`${base}/api/data`, { headers: { Origin: "https://example.com" } });
  assert.equal(forbidden.status, 403);

  const invalidImport = await fetch(`${base}/api/jd/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: "" })
  });
  assert.equal(invalidImport.status, 400);
  assert.deepEqual(await invalidImport.json(), { code: "INVALID_URL", error: "Enter a public job posting URL." });
  const blockedImport = await fetch(`${base}/api/jd/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: "http://127.0.0.1/private" })
  });
  assert.equal(blockedImport.status, 400);
  assert.equal((await blockedImport.json()).code, "BLOCKED_NETWORK");

  const canonical = JSON.parse(readFileSync(join(dataDir, "app_data.json"), "utf8"));
  assert.equal(canonical.revision, 1);
  assert.ok(canonical.data);
  console.log(JSON.stringify({ ok: true, checked: ["codex model", "canonical snapshot", "revision conflict", "origin rejection", "typed JD import validation", "blocked JD import network"] }, null, 2));
} finally {
  if (child.exitCode === null) {
    child.kill("SIGTERM");
    await once(child, "close");
  }
  rmSync(dataDir, { recursive: true, force: true });
}
