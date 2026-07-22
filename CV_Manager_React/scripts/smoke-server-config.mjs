import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { DEFAULT_CODEX_MODEL, codexModelSetting, createServerConfig, numberSetting } = require("../serverConfig.cjs");

const originalEnv = { ...process.env };

try {
  process.env.CODEX_MODEL = "developer-local-model-that-must-not-leak";
  process.env.CV_MANAGER_API_PORT = "19991";
  process.env.CV_MANAGER_CONFIG_SMOKE_SENTINEL = "restore-me";

  const fixtureEnv = {
    CV_MANAGER_API_PORT: "18881",
    CV_MANAGER_UI_PORT: "18880",
    CV_MANAGER_DATA_DIR: "/tmp/cv-manager-config-test",
    CODEX_BIN: "codex-test",
    CODEX_MODEL: "gpt-5.4",
    CV_MANAGER_MAX_DATA_BODY_BYTES: "12345",
    CV_MANAGER_MAX_AUTOMATION_BODY_BYTES: "23456",
    CV_MANAGER_MAX_AUTOMATION_OUTPUT_BYTES: "34567",
    CV_MANAGER_MAX_JD_IMPORT_BODY_BYTES: "4567",
    CV_MANAGER_MAX_JD_IMPORT_RESPONSE_BYTES: "456789",
    CV_MANAGER_MAX_JD_IMPORT_COMPRESSED_BYTES: "45678",
    CV_MANAGER_JD_IMPORT_TIMEOUT_MS: "6789",
    CV_MANAGER_MAX_JD_IMPORT_REDIRECTS: "3",
    CV_MANAGER_MAX_BACKUPS: "9",
    CV_MANAGER_AUTOMATION_JOB_TTL_MS: "45678",
    CV_MANAGER_AUTOMATION_TIMEOUT_MS: "56789"
  };

  const config = createServerConfig({ ...fixtureEnv }, { loadEnvFiles: false });

  assert.equal(config.apiPort, 18881);
  assert.equal(config.uiPort, 18880);
  assert.equal(config.codexBin, "codex-test");
  assert.equal(config.codexModel, "gpt-5.4");
  assert.equal(config.limits.dataBodyBytes, 12345);
  assert.equal(config.limits.automationBodyBytes, 23456);
  assert.equal(config.limits.automationOutputBytes, 34567);
  assert.equal(config.limits.jdImportBodyBytes, 4567);
  assert.equal(config.limits.jdImportResponseBytes, 456789);
  assert.equal(config.limits.jdImportCompressedBytes, 45678);
  assert.equal(config.limits.jdImportTimeoutMs, 6789);
  assert.equal(config.limits.jdImportRedirects, 3);
  assert.equal(config.limits.backups, 9);
  assert.equal(config.limits.automationJobTtlMs, 45678);
  assert.equal(config.limits.automationTimeoutMs, 56789);
  assert.ok(config.allowedOrigins.has("http://127.0.0.1:18880"));
  assert.ok(config.allowedOrigins.has("http://localhost:18881"));

  assert.equal(codexModelSetting("gpt-5-mini"), DEFAULT_CODEX_MODEL);
  assert.equal(codexModelSetting(""), DEFAULT_CODEX_MODEL);
  assert.equal(codexModelSetting("gpt-5.6-sol"), "gpt-5.6-sol");

  const runtimeOverrideConfig = createServerConfig({
    CODEX_MODEL: "gpt-5.6-sol",
    CV_MANAGER_API_PORT: "17771",
    CV_MANAGER_UI_PORT: "17770"
  });
  assert.equal(runtimeOverrideConfig.codexModel, "gpt-5.6-sol");
  assert.equal(runtimeOverrideConfig.apiPort, 17771);

  const fallbackConfig = createServerConfig({}, { loadEnvFiles: false });
  assert.equal(fallbackConfig.codexModel, DEFAULT_CODEX_MODEL);
  assert.equal(fallbackConfig.limits.jdImportCompressedBytes, 1024 * 1024, "default compressed limit must accommodate current bounded Microsoft Careers HTML");

  assert.throws(() => numberSetting("BAD_NUMBER", 1, { BAD_NUMBER: "nope" }), /BAD_NUMBER/);
} finally {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
}

assert.equal(process.env.CODEX_MODEL, originalEnv.CODEX_MODEL);
assert.equal(process.env.CV_MANAGER_API_PORT, originalEnv.CV_MANAGER_API_PORT);
assert.equal(process.env.CV_MANAGER_CONFIG_SMOKE_SENTINEL, originalEnv.CV_MANAGER_CONFIG_SMOKE_SENTINEL);

console.log(JSON.stringify({ ok: true, checked: [
  "config smoke ignores developer local environment",
  "test-provided model resolves exactly",
  "runtime env override remains externally configurable",
  "missing config uses documented fallback",
  "process environment restored",
  "unsupported gpt-5-mini remains rejected",
  "allowed origins",
  "numeric validation"
] }, null, 2));
