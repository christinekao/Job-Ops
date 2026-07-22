import type { CvVersion, TailoredCv } from "../types";
import { contentHash } from "../utils/hash";
import { currentValueForTarget } from "./repairProposalGenerator";
import type { RepairProposal } from "./repairProposal.types";
import type {
  RepairProposalAppliedChange,
  RepairProposalBatch,
  RepairProposalBatchApplyInput,
  RepairProposalBatchApplyResult,
  RepairProposalBatchItem,
  RepairProposalBatchStatus
} from "./repairProposalBatch.types";

function cloneCv(cv: TailoredCv): TailoredCv {
  return JSON.parse(JSON.stringify(cv)) as TailoredCv;
}

function batchId(sourceCvVersionId: string, sourceContentHash: string, proposals: RepairProposal[]) {
  return `proposal-batch-${contentHash({
    sourceCvVersionId,
    sourceContentHash,
    proposalIds: proposals.map((proposal) => proposal.id).sort()
  }).slice(1, 10)}`;
}

export function createRepairProposalBatch(input: {
  sourceCvVersionId: string;
  sourceContentHash: string;
  proposals: RepairProposal[];
  evidenceByProposalId?: Record<string, string[]>;
}): RepairProposalBatch {
  return {
    id: batchId(input.sourceCvVersionId, input.sourceContentHash, input.proposals),
    sourceCvVersionId: input.sourceCvVersionId,
    sourceContentHash: input.sourceContentHash,
    items: input.proposals.map((proposal): RepairProposalBatchItem => ({
      proposal,
      status: proposal.status,
      sourceCvVersionId: input.sourceCvVersionId,
      sourceContentHash: input.sourceContentHash,
      evidenceIds: input.evidenceByProposalId?.[proposal.id] || []
    }))
  };
}

export function updateRepairProposalBatchStatus(
  batch: RepairProposalBatch,
  proposalId: string,
  status: RepairProposalBatchStatus
): RepairProposalBatch {
  return {
    ...batch,
    items: batch.items.map((item) => item.proposal.id === proposalId ? { ...item, status } : item)
  };
}

function zoneForProposal(proposal: RepairProposal) {
  if (proposal.target.section === "contact") return "header.contact";
  if (proposal.target.section === "summary") return "summary";
  if (proposal.target.section === "workExperience") return "workExperience";
  if (proposal.target.section === "skills") return "sidebar.skills";
  return proposal.target.section;
}

function bulletFor(cv: TailoredCv, bulletId: string | undefined) {
  if (!bulletId) return null;
  const [experienceIndex, subsectionIndex, bulletIndex] = bulletId.split("-").map((value) => Number(value));
  if (![experienceIndex, subsectionIndex, bulletIndex].every(Number.isFinite)) return null;
  return cv.workExperience[experienceIndex]?.subsections[subsectionIndex]?.bullets[bulletIndex] || null;
}

function applyProposal(cv: TailoredCv, item: RepairProposalBatchItem): RepairProposalAppliedChange | null {
  const proposal = item.proposal;
  if (proposal.target.section === "summary") {
    const priorValue = cv.summary || "";
    if (priorValue !== proposal.currentValue || priorValue === proposal.suggestedValue) return null;
    cv.summary = proposal.suggestedValue;
    return {
      proposalId: proposal.id,
      blockerId: proposal.blockerId,
      targetZone: "summary",
      priorValue,
      nextValue: proposal.suggestedValue,
      evidenceIds: item.evidenceIds
    };
  }

  if (proposal.target.section === "workExperience") {
    const bullet = bulletFor(cv, proposal.target.bulletId);
    if (!bullet || bullet.text !== proposal.currentValue || bullet.text === proposal.suggestedValue) return null;
    const priorValue = bullet.text;
    bullet.text = proposal.suggestedValue;
    return {
      proposalId: proposal.id,
      blockerId: proposal.blockerId,
      targetZone: "workExperience",
      priorValue,
      nextValue: proposal.suggestedValue,
      evidenceIds: [...(bullet.evidenceIds || item.evidenceIds)]
    };
  }

  if (proposal.target.section === "contact" && proposal.target.fieldId === "email") {
    const priorValue = cv.header.email || "";
    if (priorValue !== proposal.currentValue || priorValue === proposal.suggestedValue) return null;
    cv.header.email = proposal.suggestedValue;
    return {
      proposalId: proposal.id,
      blockerId: proposal.blockerId,
      targetZone: "header.contact",
      priorValue,
      nextValue: proposal.suggestedValue,
      evidenceIds: item.evidenceIds
    };
  }

  return null;
}

function result(input: RepairProposalBatchApplyInput, status: RepairProposalBatchApplyResult["status"], message: string): RepairProposalBatchApplyResult {
  return {
    status,
    message,
    batchId: input.batch.id,
    sourceCvVersionId: input.batch.sourceCvVersionId,
    priorContentHash: input.currentContentHash,
    resultingContentHash: input.currentContentHash,
    appliedChanges: [],
    rejectedProposalIds: input.batch.items.map((item) => item.proposal.id)
  };
}

function itemStatus(input: RepairProposalBatchApplyInput, item: RepairProposalBatchItem) {
  return input.statuses?.[item.proposal.id] || item.status;
}

export function applyAcceptedRepairProposalBatch(input: RepairProposalBatchApplyInput): RepairProposalBatchApplyResult {
  const tailoredCv = input.cvVersion.tailoredCv;
  if (!tailoredCv) return result(input, "blocked", "No tailored CV is available for proposal application.");
  if (
    input.cvVersion.id !== input.currentCvVersionId
    || input.batch.sourceCvVersionId !== input.currentCvVersionId
    || input.batch.sourceContentHash !== input.currentContentHash
  ) {
    return result(input, "stale", "Proposal batch was rejected because the CV version or content hash is stale.");
  }

  const acceptedItems = input.batch.items.filter((item) => itemStatus(input, item) === "accepted");
  if (!acceptedItems.length) return result(input, "no-accepted-proposals", "No accepted proposals are available to apply.");

  const staleItem = acceptedItems.find((item) => item.sourceCvVersionId !== input.currentCvVersionId || item.sourceContentHash !== input.currentContentHash);
  if (staleItem) return result(input, "stale", `Proposal ${staleItem.proposal.id} is stale.`);

  for (const item of acceptedItems) {
    const currentValue = currentValueForTarget(tailoredCv, {
      blockerId: item.proposal.blockerId,
      rawBlocker: item.proposal.reason,
      title: item.proposal.affectedSection,
      explanation: item.proposal.reason,
      target: item.proposal.target
    });
    if (currentValue !== item.proposal.currentValue) {
      return result(input, "stale", `Proposal ${item.proposal.id} no longer matches the current CV content.`);
    }
  }

  const nextCv = cloneCv(tailoredCv);
  const appliedChanges: RepairProposalAppliedChange[] = [];
  const rejectedProposalIds: string[] = [];

  for (const item of input.batch.items) {
    if (itemStatus(input, item) !== "accepted") {
      rejectedProposalIds.push(item.proposal.id);
      continue;
    }
    const change = applyProposal(nextCv, item);
    if (change) appliedChanges.push(change);
    else rejectedProposalIds.push(item.proposal.id);
  }

  const priorContentHash = contentHash(tailoredCv);
  const resultingContentHash = contentHash(nextCv);
  if (!appliedChanges.length || priorContentHash === resultingContentHash) {
    return {
      status: "no-content-diff",
      message: "Accepted proposal batch produced no CV content change.",
      batchId: input.batch.id,
      sourceCvVersionId: input.batch.sourceCvVersionId,
      priorContentHash,
      resultingContentHash,
      appliedChanges: [],
      rejectedProposalIds
    };
  }

  const now = input.now || new Date().toISOString();
  const nextVersion: CvVersion = {
    ...input.cvVersion,
    id: `${input.cvVersion.id}-proposal-${contentHash({ batchId: input.batch.id, resultingContentHash }).slice(1, 8)}`,
    name: `${input.cvVersion.name} - proposal batch`,
    tailoredCv: nextCv,
    content: JSON.stringify(nextCv, null, 2),
    summary: nextCv.summary || input.cvVersion.summary,
    status: "Editing",
    reviewSnapshot: undefined,
    updatedAt: now
  };

  return {
    status: "success",
    message: `Applied ${appliedChanges.length} accepted proposal${appliedChanges.length === 1 ? "" : "s"}.`,
    batchId: input.batch.id,
    sourceCvVersionId: input.batch.sourceCvVersionId,
    priorContentHash,
    resultingContentHash,
    appliedChanges: appliedChanges.map((change) => ({ ...change, targetZone: zoneForProposal(input.batch.items.find((item) => item.proposal.id === change.proposalId)?.proposal || acceptedItems[0].proposal) })),
    rejectedProposalIds,
    nextVersion
  };
}
