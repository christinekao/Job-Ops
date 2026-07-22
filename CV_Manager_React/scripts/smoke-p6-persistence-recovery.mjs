import assert from "node:assert/strict";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFile } from "node:fs/promises";

const modulePath = join(tmpdir(), `p6-persistence-${Date.now()}.mjs`);
await build({ entryPoints: ["src/storage.ts"], bundle: true, format: "esm", platform: "node", outfile: modulePath, logLevel: "silent" });

class MemoryStorage {
  values = new Map();
  getItem(key) { return this.values.get(key) || null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

const normalCacheKey = "christine-cv-manager-react-v2";
const browserStorage = new MemoryStorage();
Object.defineProperty(globalThis, "localStorage", { value: browserStorage, configurable: true });

const storage = await import(pathToFileURL(modulePath).href);
const serverData = { jobs: [{ id: "server-job", company: "Server", role: "Saved", location: "", rawJD: "", status: "New", fit: "Unknown", nextAction: "", selectedSkillIds: [], selectedDomainKnowledgeIds: [], selectedEvidenceIds: [], selectedStoryIds: [], updatedAt: "2026-07-19" }] };
const browserChange = { ...serverData, jobs: [...serverData.jobs, { ...serverData.jobs[0], id: "browser-job", company: "Browser-only" }] };
let getRevision = 4;
globalThis.fetch = async (_url, init = {}) => {
  if ((init.method || "GET") === "POST") return new Response(JSON.stringify({ error: "Revision conflict", currentRevision: 5 }), { status: 409, headers: { "Content-Type": "application/json" } });
  return new Response(JSON.stringify({ revision: getRevision, data: serverData }), { status: 200, headers: { "Content-Type": "application/json" } });
};

await storage.loadData();
await assert.rejects(storage.saveData(browserChange), /newer data|conflict/i, "stale revision must reject the server write");
assert.equal(JSON.parse(browserStorage.getItem(normalCacheKey)).jobs.at(-1).id, "browser-job", "browser change is cached before reload");

getRevision = 5;
await storage.loadData();
assert.equal(
  JSON.parse(browserStorage.getItem(normalCacheKey)).jobs.at(-1).id,
  "server-job",
  "normal cache may safely refresh from the canonical server snapshot"
);
assert.equal(
  storage.getUnsyncedRecoverySnapshot()?.data.jobs.at(-1).id,
  "browser-job",
  "a server reload must not erase the separate browser recovery copy after a rejected save"
);
assert.equal(storage.getUnsyncedRecoverySnapshot()?.reason, "revision-conflict");
storage.discardUnsyncedRecoverySnapshot();
assert.equal(storage.getUnsyncedRecoverySnapshot(), null, "recovery copy must require explicit discard");

globalThis.fetch = async () => { throw new Error("offline"); };
await assert.rejects(storage.saveData(browserChange), /could not be reached/i, "offline save must reject without server overwrite");
assert.equal(storage.getUnsyncedRecoverySnapshot()?.reason, "server-unavailable", "offline save must preserve a recovery copy");

const appSource = await readFile("src/App.tsx", "utf8");
assert.match(appSource, /Download recovery copy/, "recovery data must be explicitly downloadable in the app");
assert.match(appSource, /Discard recovery copy/, "recovery data must require explicit discard");

console.log(JSON.stringify({ ok: true, checked: ["revision conflict recovery across reload", "explicit recovery download/discard", "offline recovery preservation"] }, null, 2));
