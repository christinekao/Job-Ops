export type ScreeningActionId =
  | "apply-safe-repair"
  | "apply-title-alignment"
  | "start-ai-repair"
  | "stop-ai-repair"
  | "generate-ai-proposals"
  | "apply-accepted-proposals"
  | "run-targeted-regeneration"
  | "open-guided-editor"
  | "open-manual-editor"
  | "open-export";

export type ScreeningActionCommand = {
  id: ScreeningActionId;
  cvContentHash?: string;
  payload?: unknown;
  requestId?: string;
  blockerIds?: string[];
  targetZones?: string[];
  cvVersionId?: string;
  effectiveCvBriefHash?: string;
  selectedEvidenceIds?: string[];
};

export type TargetedRegenerationCommand = ScreeningActionCommand & {
  id: "run-targeted-regeneration";
  requestId: string;
  blockerIds: string[];
  targetZones: string[];
  cvVersionId: string;
  cvContentHash: string;
  effectiveCvBriefHash: string;
  selectedEvidenceIds: string[];
};

export function isTargetedRegenerationCommand(command: ScreeningActionCommand): command is TargetedRegenerationCommand {
  const candidate = command as Partial<TargetedRegenerationCommand>;
  return command.id === "run-targeted-regeneration"
    && Boolean(candidate.requestId)
    && Boolean(candidate.cvVersionId)
    && Boolean(candidate.cvContentHash)
    && Boolean(candidate.effectiveCvBriefHash)
    && Array.isArray(candidate.blockerIds)
    && Array.isArray(candidate.targetZones)
    && Array.isArray(candidate.selectedEvidenceIds);
}

export type ScreeningRefreshDomain = "workflow" | "review" | "repair" | "export";

export type ScreeningActionExecution<T = unknown> = {
  status: "success" | "blocked" | "no-safe-fix" | "error";
  message: string;
  affectedZones: string[];
  currentCvHash?: string;
  refresh: ScreeningRefreshDomain[];
  remainingBlockers?: string[];
  value?: T;
};

export type ScreeningActionResult<T = unknown> = ScreeningActionExecution<T> & {
  actionId: ScreeningActionId;
  timestamp: string;
  ctaRefreshRequired: boolean;
};

export function screeningActionKey(command: ScreeningActionCommand) {
  return `${command.id}:${command.cvContentHash || "no-cv"}`;
}

export async function dispatchScreeningAction<T>(input: {
  command: ScreeningActionCommand;
  completedActionKeys: ReadonlySet<string>;
  execute: (command: ScreeningActionCommand) => Promise<ScreeningActionExecution<T>> | ScreeningActionExecution<T>;
}): Promise<ScreeningActionResult<T>> {
  const timestamp = new Date().toISOString();
  const actionKey = screeningActionKey(input.command);
  if (input.completedActionKeys.has(actionKey)) {
    return {
      actionId: input.command.id,
      timestamp,
      status: "blocked",
      message: "This action already completed for the current CV content. Review the refreshed result instead of running it again.",
      affectedZones: [],
      currentCvHash: input.command.cvContentHash,
      refresh: ["workflow", "review", "repair", "export"],
      ctaRefreshRequired: true
    };
  }
  try {
    const execution = await input.execute(input.command);
    return {
      ...execution,
      actionId: input.command.id,
      timestamp,
      currentCvHash: execution.currentCvHash || input.command.cvContentHash,
      ctaRefreshRequired: true
    };
  } catch (error) {
    return {
      actionId: input.command.id,
      timestamp,
      status: "error",
      message: error instanceof Error ? error.message : "The requested action could not be completed.",
      affectedZones: [],
      currentCvHash: input.command.cvContentHash,
      refresh: [],
      ctaRefreshRequired: true
    };
  }
}

export function resolveScreeningActionRefresh(result: ScreeningActionResult) {
  return {
    domains: result.refresh,
    refreshPrimaryCta: result.ctaRefreshRequired
  };
}
