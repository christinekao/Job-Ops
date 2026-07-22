import type { TailoredCv } from "../types";
import { contentHash } from "../utils/hash";
import type {
  HumanDecisionApplyInput,
  HumanDecisionApplyResult,
  HumanDecisionOption,
  HumanDecisionPrompt,
  HumanDecisionPromptInput
} from "./humanDecisionLayer.types";

function cloneCv(cv: TailoredCv): TailoredCv {
  return JSON.parse(JSON.stringify(cv)) as TailoredCv;
}

function decisionId(blockerId: string) {
  return `human-decision-${blockerId}`;
}

export function createHumanDecisionPrompt(input: HumanDecisionPromptInput): HumanDecisionPrompt {
  const classification = input.classification;
  const evidenceIds = input.evidenceIds || classification.evidenceIds || [];
  const options: HumanDecisionOption[] = [
    {
      id: "keep-conservative",
      label: "Use conservative wording",
      description: "Keep the CV factual and avoid a stronger positioning claim.",
      evidenceIds,
      downstreamImpact: "Lower risk of unsupported claims; may be less assertive.",
      authorizedChange: input.currentSummary
        ? {
          targetZone: "summary",
          nextValue: input.currentSummary
            .replace(/\bqualified\b/gi, "experienced")
            .replace(/\bowned\b/gi, "supported")
        }
        : undefined
    },
    {
      id: "edit-manually",
      label: "Edit manually",
      description: "Open the CV editor and write the wording yourself.",
      evidenceIds,
      downstreamImpact: "Keeps control with you; AI will not apply a change."
    }
  ];

  return {
    id: decisionId(classification.blockerId),
    blockerId: classification.blockerId,
    question: "Which factual positioning should this CV use?",
    whyAiCannotDecide: classification.reason || "This changes meaning, positioning, or factual claim strength, so AI cannot choose for you.",
    targetZone: classification.allowedMutationZones[0] || classification.target?.section || "manual",
    options
  };
}

function blocked(input: HumanDecisionApplyInput, status: HumanDecisionApplyResult["status"], message: string): HumanDecisionApplyResult {
  return {
    status,
    message,
    decisionId: input.prompt.id,
    selectedOptionId: input.selectedOptionId,
    priorContentHash: input.currentContentHash,
    resultingContentHash: input.currentContentHash,
    changedZones: [],
    evidenceIds: []
  };
}

export function applyHumanDecision(input: HumanDecisionApplyInput): HumanDecisionApplyResult {
  const tailoredCv = input.cvVersion.tailoredCv;
  if (!tailoredCv) return blocked(input, "blocked", "No tailored CV is available for this decision.");
  if (input.cvVersion.id !== input.currentCvVersionId) {
    return blocked(input, "stale", "Human decision was rejected because the CV version is stale.");
  }
  const priorContentHash = contentHash(tailoredCv);
  if (priorContentHash !== input.currentContentHash) {
    return blocked(input, "stale", "Human decision was rejected because the CV content hash is stale.");
  }
  if (!input.selectedOptionId) {
    return blocked(input, "requires-user-choice", "AI cannot choose this decision. Select an option first.");
  }
  const option = input.prompt.options.find((item) => item.id === input.selectedOptionId);
  if (!option) return blocked(input, "blocked", "Selected decision option is not available.");
  if (!option.authorizedChange) {
    return blocked(input, "requires-user-choice", "This option requires manual editing and does not authorize an automatic CV change.");
  }

  const nextCv = cloneCv(tailoredCv);
  if (option.authorizedChange.targetZone === "summary") {
    nextCv.summary = option.authorizedChange.nextValue;
  } else {
    return blocked(input, "blocked", "This human decision target is not supported by deterministic application.");
  }

  const resultingContentHash = contentHash(nextCv);
  if (resultingContentHash === priorContentHash) {
    return {
      status: "no-content-diff",
      message: "Selected decision produced no CV content change.",
      decisionId: input.prompt.id,
      selectedOptionId: option.id,
      priorContentHash,
      resultingContentHash,
      changedZones: [],
      evidenceIds: option.evidenceIds
    };
  }

  const now = input.now || new Date().toISOString();
  return {
    status: "applied",
    message: "Applied the user-authorized decision.",
    decisionId: input.prompt.id,
    selectedOptionId: option.id,
    priorContentHash,
    resultingContentHash,
    changedZones: [option.authorizedChange.targetZone],
    evidenceIds: option.evidenceIds,
    nextVersion: {
      ...input.cvVersion,
      id: `${input.cvVersion.id}-decision-${contentHash({ id: input.prompt.id, option: option.id, resultingContentHash }).slice(1, 8)}`,
      name: `${input.cvVersion.name} - user decision`,
      tailoredCv: nextCv,
      content: JSON.stringify(nextCv, null, 2),
      summary: nextCv.summary || input.cvVersion.summary,
      status: "Editing",
      reviewSnapshot: undefined,
      updatedAt: now
    }
  };
}
