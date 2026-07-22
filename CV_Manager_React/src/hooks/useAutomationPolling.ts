import { useEffect, useRef } from "react";
import { getAutomationJob } from "../storage";
import type { AutomationJob } from "../types";

type UseAutomationPollingOptions<T> = {
  run: AutomationJob<T> | null;
  setRun: (run: AutomationJob<T>) => void;
  onLatest: (run: AutomationJob<T>) => void;
  onConnectionError: (message: string) => void;
  intervalMs?: number;
};

export function useAutomationPolling<T>({
  run,
  setRun,
  onLatest,
  onConnectionError,
  intervalMs = 1500
}: UseAutomationPollingOptions<T>) {
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!run || (run.status !== "queued" && run.status !== "running")) return;
    const timer = window.setInterval(async () => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        const latest = await getAutomationJob<T>(run.id);
        setRun(latest);
        onLatest(latest);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Lost connection to Codex CLI automation.";
        onConnectionError(message);
      } finally {
        inFlightRef.current = false;
      }
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs, onConnectionError, onLatest, run, setRun]);
}
