import type { AutomationJob } from "../types";

const CREDIT_LIMIT_PATTERNS = [
  /has_credits["']?\s*:\s*false/i,
  /balance["']?\s*:\s*["']?0["']?/i,
  /account usage limit/i,
  /usage limit/i,
  /rate limit/i,
  /insufficient credits/i,
  /out of credits/i,
  /quota exceeded/i,
  /last_agent_message["']?\s*:\s*null/i
];

function compactAutomationText(raw: string) {
  return raw.replace(/\s+/g, " ").trim();
}

export function describeMissingAutomationResult(label: string, job: AutomationJob<unknown>) {
  const combined = compactAutomationText(`${job.rawOutput || ""}\n${job.error || ""}`);
  const creditBlocked = CREDIT_LIMIT_PATTERNS.some((pattern) => pattern.test(combined));
  if (creditBlocked) {
    return `${label} completed without usable JSON because Codex CLI appears to have no available credits or hit a usage limit. No CV data was applied.`;
  }
  if (!combined) {
    return `${label} completed but returned no parsed JSON result. No CV data was applied; rerun after checking Codex CLI login/credits.`;
  }
  return `${label} completed but returned output that was not usable JSON. No CV data was applied. Output preview: ${combined.slice(0, 240)}`;
}
