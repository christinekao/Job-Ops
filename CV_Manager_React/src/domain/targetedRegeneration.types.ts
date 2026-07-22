import type { CvVersion, TailoredCv } from "../types";

export type TargetedRegenerationZone =
  | "summary"
  | "workExperience.currentRole"
  | "workExperience.selectedBullets"
  | "sidebar.skills";

export type TargetedRegenerationRequest = {
  id: string;
  blockerIds: string[];
  cvVersionId: string;
  cvContentHash: string;
  targetZones: TargetedRegenerationZone[];
  targetRoleIds?: string[];
  targetBulletIds?: string[];
  selectedEvidenceIds: string[];
  effectiveCvBriefHash: string;
  failedSummaryCriterionIds?: string[];
  preservedZones: string[];
  prohibitedZones: string[];
  reason: string;
};

export type TargetedRegenerationResult = {
  status: "success" | "no-diff" | "blocked" | "error" | "stale";
  requestId: string;
  priorCvHash: string;
  resultingCvHash?: string;
  changedZones: string[];
  preservedZones: string[];
  remainingBlockers: string[];
  affectedReviewFamilies: string[];
  message: string;
  nextVersion?: CvVersion;
  validation?: TargetedValidationResult;
};

export type TargetedRegenerationCandidate = {
  requestId: string;
  cv: TailoredCv;
};

export type SummaryRegenerationOutput = {
  summary: string;
};

export type WorkExperiencePatch = {
  roleId: string;
  bulletId: string;
  text: string;
  evidenceIds: string[];
};

export type WorkBulletRegenerationOutput = {
  workExperiencePatches: WorkExperiencePatch[];
};

export type WordingCleanupPatch = {
  targetId: string;
  text: string;
  evidenceIds: string[];
};

export type WordingCleanupOutput = {
  wordingPatches: WordingCleanupPatch[];
};

export type TargetedRegenerationPatchOutput =
  | SummaryRegenerationOutput
  | WorkBulletRegenerationOutput
  | WordingCleanupOutput;

export type TargetedOutputContractFailure = {
  responseShape: string;
  errors: string[];
  unauthorizedPaths: string[];
};

export type TargetedOutputParseResult =
  | {
    ok: true;
    outputKind: "summary" | "work-bullets" | "wording";
    patch: TargetedRegenerationPatchOutput;
    candidate: TargetedRegenerationCandidate;
  }
  | {
    ok: false;
    outputKind: "summary" | "work-bullets" | "wording";
    failure: TargetedOutputContractFailure;
  };

export type TargetedValidationIssueCategory =
  | "target"
  | "preserved-zone"
  | "stale-contract"
  | "pre-existing-global"
  | "new-global";

export type TargetedValidationIssue = {
  id: string;
  validatorId: string;
  ruleId: string;
  category: TargetedValidationIssueCategory;
  message: string;
  fieldPath?: string;
  targetZone?: string;
  roleId?: string;
  bulletId?: string;
  evidenceIds?: string[];
  missingEvidenceIds?: string[];
  currentValue?: string;
  candidateValue?: string;
};

export type TargetedValidationResult = {
  status: "pass" | "blocked-target" | "blocked-preserved-zone" | "blocked-stale" | "blocked-invalid-response";
  targetFailures: TargetedValidationIssue[];
  preservedZoneFailures: TargetedValidationIssue[];
  staleContractFailures: TargetedValidationIssue[];
  preExistingGlobalIssues: TargetedValidationIssue[];
  newGlobalIssues: TargetedValidationIssue[];
  changedZones: string[];
  preservedZones: string[];
  mayApplyTargetPatch: boolean;
  patchedCv?: TailoredCv;
};
