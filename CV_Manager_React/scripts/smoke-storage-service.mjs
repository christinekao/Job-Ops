import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createServerConfig } = require("../serverConfig.cjs");
const { createStorageService } = require("../storageService.cjs");

const dataDir = mkdtempSync(join(tmpdir(), "cv-manager-storage-test-"));

try {
  const config = createServerConfig({
    CV_MANAGER_DATA_DIR: dataDir,
    CV_MANAGER_MAX_BACKUPS: "3"
  });
  const storage = createStorageService(config);
  const initial = storage.readAppData();
  assert.equal(initial.revision, 0);
  assert.ok(Array.isArray(initial.data.jobs));

  const first = storage.writeAppData(initial.data, 0);
  assert.equal(first.revision, 1);
  const canonical = JSON.parse(readFileSync(join(dataDir, "app_data.json"), "utf8"));
  assert.equal(canonical.revision, 1);

  assert.throws(() => storage.writeAppData(initial.data, 0), /Revision conflict/);
  assert.throws(() => storage.validateAppData({ ...initial.data, jobs: {} }), /jobs must be an array/);

  console.log(JSON.stringify({ ok: true, checked: ["initial snapshot", "canonical write", "revision conflict", "schema validation"] }, null, 2));
} finally {
  rmSync(dataDir, { recursive: true, force: true });
}
