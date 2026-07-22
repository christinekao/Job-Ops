export function createNoAiInvocationGuard() {
  const attempts = [];
  const originalFetch = globalThis.fetch;

  function record(kind, detail) {
    attempts.push({ kind, detail });
    throw new Error(`AI invocation blocked during deterministic product acceptance test: ${kind} ${detail}`);
  }

  function assertNoAttempts() {
    if (attempts.length) {
      throw new Error(`AI invocation attempts detected: ${attempts.map((item) => `${item.kind}:${item.detail}`).join(", ")}`);
    }
  }

  function guardedSpawn(command) {
    const text = String(command || "");
    if (/\bcodex\b|openai|gpt-|model/i.test(text)) record("process", text);
    return { blocked: false, command: text };
  }

  function guardedFetch(url) {
    const text = String(url || "");
    if (/api\.openai\.com|openai\.azure\.com|\/v1\/chat|\/v1\/responses|\/automation\/run|\/api\/automation/i.test(text)) {
      record("network", text);
    }
    return Promise.resolve({ ok: true, status: 204 });
  }

  function guardedAutomationState(nextState) {
    if (/running|queued|ai-running|codex-running/i.test(String(nextState || ""))) record("automation-state", nextState);
    return { blocked: false, state: nextState };
  }

  function installFetchGuard() {
    globalThis.fetch = guardedFetch;
    return () => {
      globalThis.fetch = originalFetch;
    };
  }

  return {
    attempts,
    guardedSpawn,
    guardedFetch,
    guardedAutomationState,
    installFetchGuard,
    assertNoAttempts
  };
}
