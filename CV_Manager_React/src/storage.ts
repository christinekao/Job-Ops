import type { AppData, AutomationJob, JdImportProvenance, ParsedJD } from "./types";
import { defaultData } from "./sampleData";
import { sanitizeRecruiterFacingData } from "./utils/normalize";

const STORAGE_KEY = "christine-cv-manager-react-v2";
const UNSYNCED_STORAGE_KEY = "christine-cv-manager-react-v2-unsynced-recovery";
const DATA_ENDPOINT = "/api/data";
const AUTOMATION_ENDPOINT = "/api/automation";
const JD_IMPORT_ENDPOINT = "/api/jd/import";
let serverRevision: number | null = null;

type DataSnapshot = {
  revision: number;
  data: Partial<AppData>;
};

export type UnsyncedRecoverySnapshot = {
  savedAt: string;
  reason: "revision-conflict" | "server-unavailable" | "server-save-failed" | "unknown-revision";
  data: AppData;
};

function mergeData(raw: Partial<AppData>): AppData {
  return sanitizeRecruiterFacingData({
    ...defaultData,
    ...raw,
    sourceOfTruth: { ...defaultData.sourceOfTruth, ...raw.sourceOfTruth },
    careerProfile: { ...defaultData.careerProfile, ...raw.careerProfile },
    skillInferences: raw.skillInferences || defaultData.skillInferences,
    domainKnowledge: raw.domainKnowledge || defaultData.domainKnowledge,
    evidenceCards: raw.evidenceCards || defaultData.evidenceCards,
    starStories: raw.starStories || defaultData.starStories,
    highCompensationSignals: raw.highCompensationSignals || defaultData.highCompensationSignals,
    backboneMetadata: { ...defaultData.backboneMetadata, ...raw.backboneMetadata },
    backboneUpdateSummary: { ...defaultData.backboneUpdateSummary, ...raw.backboneUpdateSummary },
    backboneTasks: raw.backboneTasks || defaultData.backboneTasks,
    recruiterAnswers: raw.recruiterAnswers || defaultData.recruiterAnswers,
    jobs: raw.jobs || defaultData.jobs,
    promptTemplates: raw.promptTemplates || defaultData.promptTemplates,
    cvVersions: raw.cvVersions || defaultData.cvVersions
  });
}

function loadLocalData(): AppData {
  if (typeof localStorage === "undefined") return defaultData;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultData;
  try {
    return mergeData(JSON.parse(raw) as Partial<AppData>);
  } catch {
    throw new Error("Browser backup data is unreadable. Restore a valid backup instead of replacing it automatically.");
  }
}

export async function loadData(): Promise<AppData> {
  let response: Response;
  try {
    response = await fetch(DATA_ENDPOINT, { cache: "no-store" });
  } catch {
    serverRevision = null;
    return loadLocalData();
  }
  if (!response.ok) {
    serverRevision = null;
    return loadLocalData();
  }
  let snapshot: DataSnapshot;
  try {
    snapshot = await response.json() as DataSnapshot;
  } catch {
    throw new Error("Server returned unreadable project data. No local replacement was made.");
  }
  if (!Number.isInteger(snapshot.revision) || !snapshot.data || typeof snapshot.data !== "object") {
    throw new Error("Server returned an invalid project snapshot. No local replacement was made.");
  }
  serverRevision = snapshot.revision;
  const data = mergeData(snapshot.data);
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Server data is the source of truth. Browser cache quota issues must not discard a valid server snapshot.
    }
  }
  return data;
}

export function saveLocalData(data: AppData): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    // The API data store remains the source of truth. A browser cache limit must not crash the workspace.
    return false;
  }
}

function preserveUnsyncedData(data: AppData, reason: UnsyncedRecoverySnapshot["reason"]): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    const recovery: UnsyncedRecoverySnapshot = { savedAt: new Date().toISOString(), reason, data };
    localStorage.setItem(UNSYNCED_STORAGE_KEY, JSON.stringify(recovery));
    return true;
  } catch {
    return false;
  }
}

/** Recovery data is intentionally separate from the normal cache a server load refreshes. */
export function getUnsyncedRecoverySnapshot(): UnsyncedRecoverySnapshot | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(UNSYNCED_STORAGE_KEY);
  if (!raw) return null;
  try {
    const candidate = JSON.parse(raw) as Partial<UnsyncedRecoverySnapshot>;
    if (!candidate.data || typeof candidate.data !== "object" || !candidate.savedAt || !candidate.reason) return null;
    return { savedAt: candidate.savedAt, reason: candidate.reason, data: mergeData(candidate.data) };
  } catch {
    return null;
  }
}

export function discardUnsyncedRecoverySnapshot(): void {
  if (typeof localStorage !== "undefined") localStorage.removeItem(UNSYNCED_STORAGE_KEY);
}

export async function saveData(data: AppData): Promise<void> {
  saveLocalData(data);
  if (serverRevision === null) {
    const recovered = preserveUnsyncedData(data, "unknown-revision");
    throw new Error(`Server data revision is unknown. Reload before syncing to avoid overwriting newer data.${recovered ? " Your browser recovery copy was preserved." : " Browser storage could not preserve a recovery copy; download a backup before reloading."}`);
  }
  let response: Response;
  try {
    response = await fetch(DATA_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revision: serverRevision, data })
    });
  } catch {
    const recovered = preserveUnsyncedData(data, "server-unavailable");
    throw new Error(`Server could not be reached.${recovered ? " Your browser recovery copy was preserved." : " Browser storage could not preserve a recovery copy; download a backup before reloading."}`);
  }
  if (!response.ok) {
    if (response.status === 409) {
      const recovered = preserveUnsyncedData(data, "revision-conflict");
      throw new Error(`Another tab or process saved newer data. Reload before making more changes;${recovered ? " your browser recovery copy was preserved." : " browser storage could not preserve a recovery copy, so download a backup before reloading."}`);
    }
    const recovered = preserveUnsyncedData(data, "server-save-failed");
    throw new Error(`Save failed: ${response.status}.${recovered ? " Your browser recovery copy was preserved." : " Browser storage could not preserve a recovery copy; download a backup before reloading."}`);
  }
  const result = await response.json() as { revision?: number };
  if (!Number.isInteger(result.revision)) {
    const recovered = preserveUnsyncedData(data, "server-save-failed");
    throw new Error(`Save succeeded but returned no revision.${recovered ? " Your browser recovery copy was preserved." : " Browser storage could not preserve a recovery copy; download a backup before reloading."}`);
  }
  serverRevision = result.revision as number;
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const body = await response.json() as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export type JdImportResult = {
  rawJD: string;
  provenance: JdImportProvenance;
  extracted: Partial<ParsedJD>;
  metrics: {
    durationMs: number;
    responseBytes: number;
    warningCount: number;
  };
};

export class JdImportClientError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "JdImportClientError";
    this.code = code;
  }
}

export async function importJobDescription(url: string): Promise<JdImportResult> {
  let response: Response;
  try {
    response = await fetch(JD_IMPORT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });
  } catch {
    throw new JdImportClientError("FETCH_FAILED", "The import service is unavailable. Keep the URL and use manual paste, or retry.");
  }
  if (!response.ok) {
    let code = "FETCH_FAILED";
    let message = `The job posting could not be imported (${response.status}).`;
    try {
      const body = await response.json() as { code?: string; error?: string };
      if (body.code) code = body.code;
      if (body.error) message = body.error;
    } catch {
      // Preserve the bounded generic error.
    }
    throw new JdImportClientError(code, message);
  }
  return response.json() as Promise<JdImportResult>;
}

export async function startAutomation<T = unknown>(
  kind: "screening-analysis" | "screening-cv",
  prompt: string,
  context?: unknown
): Promise<AutomationJob<T>> {
  const response = await fetch(`${AUTOMATION_ENDPOINT}/${kind}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, ...(context === undefined ? {} : { context }) })
  });
  return readJsonResponse<AutomationJob<T>>(response);
}

export async function getAutomationJob<T = unknown>(jobId: string): Promise<AutomationJob<T>> {
  const response = await fetch(`${AUTOMATION_ENDPOINT}/jobs/${jobId}`, { cache: "no-store" });
  return readJsonResponse<AutomationJob<T>>(response);
}

export async function waitForAutomationJob<T = unknown>(
  jobId: string,
  options: {
    intervalMs?: number;
    timeoutMs?: number;
    onUpdate?: (job: AutomationJob<T>) => void;
  } = {}
): Promise<AutomationJob<T>> {
  const intervalMs = options.intervalMs ?? 750;
  const timeoutMs = options.timeoutMs ?? 5 * 60 * 1000;
  const startedAt = Date.now();
  while (Date.now() - startedAt <= timeoutMs) {
    const latest = await getAutomationJob<T>(jobId);
    options.onUpdate?.(latest);
    if (latest.status !== "queued" && latest.status !== "running") return latest;
    await new Promise<void>((resolve) => globalThis.setTimeout(resolve, intervalMs));
  }
  throw new Error("Targeted regeneration timed out. Your current CV was not modified.");
}

export async function cancelAutomationJob<T = unknown>(jobId: string): Promise<AutomationJob<T>> {
  const response = await fetch(`${AUTOMATION_ENDPOINT}/jobs/${jobId}/cancel`, { method: "POST" });
  return readJsonResponse<AutomationJob<T>>(response);
}

export function exportData(data: AppData, filename = "christine-cv-manager-react-backup.json"): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
