import type { TailoredCv } from "../types";
import type {
  TargetedOutputContractFailure,
  TargetedOutputParseResult,
  TargetedRegenerationRequest,
  WorkExperiencePatch,
  WordingCleanupPatch
} from "./targetedRegeneration.types";

type BulletTarget = {
  roleId: string;
  bulletId: string;
  text: string;
  evidenceIds: string[];
};

function cloneCv(cv: TailoredCv): TailoredCv {
  return JSON.parse(JSON.stringify(cv)) as TailoredCv;
}

function objectValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function responseShape(value: unknown): string {
  if (Array.isArray(value)) return `array(${value.length})`;
  const object = objectValue(value);
  return object ? `object(${Object.keys(object).sort().join(", ")})` : typeof value;
}

function sameStrings(left: string[], right: string[]): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function bulletAt(cv: TailoredCv, bulletId: string) {
  const indexes = bulletId.split("-").map(Number);
  if (indexes.length !== 3 || !indexes.every(Number.isInteger)) return null;
  const [roleIndex, subsectionIndex, bulletIndex] = indexes;
  const role = cv.workExperience[roleIndex];
  const bullet = role?.subsections[subsectionIndex]?.bullets[bulletIndex];
  if (!role || !bullet) return null;
  return {
    role,
    bullet,
    roleId: role.experienceId || String(roleIndex),
    bulletId
  };
}

export function targetedOutputKind(request: TargetedRegenerationRequest): "summary" | "work-bullets" | "wording" {
  if (request.targetZones.includes("summary")) return "summary";
  return /wording|recruiter|external|internal/i.test(request.reason) ? "wording" : "work-bullets";
}

export function authorizedBulletTargets(request: TargetedRegenerationRequest, cv: TailoredCv): BulletTarget[] {
  const ids = request.targetZones.includes("workExperience.currentRole")
    ? cv.workExperience[0]?.subsections.flatMap((section, subsectionIndex) => section.bullets.map((_bullet, bulletIndex) => `0-${subsectionIndex}-${bulletIndex}`)) || []
    : request.targetBulletIds || [];
  return ids.map((bulletId) => {
    const target = bulletAt(cv, bulletId);
    return target ? {
      roleId: target.roleId,
      bulletId,
      text: target.bullet.text,
      evidenceIds: [...(target.bullet.evidenceIds || [])]
    } : null;
  }).filter((item): item is BulletTarget => Boolean(item));
}

function leafPaths(value: unknown, prefix: string): string[] {
  const object = objectValue(value);
  if (!object || !Object.keys(object).length) return [prefix];
  return Object.entries(object).flatMap(([key, child]) => leafPaths(child, prefix ? `${prefix}.${key}` : key));
}

function displayUnauthorizedPath(key: string, value: unknown): string[] {
  if (key === "keywordPlacementNotes" || key === "interviewNotes" || key === "reviewNotes") return [`export.${key}`];
  if (key === "header") return leafPaths(value, "header");
  return [key];
}

function strictRoot(input: {
  rawResult: unknown;
  rawOutput?: string;
  allowedTopKeys: string[];
}): { root?: Record<string, unknown>; failure?: TargetedOutputContractFailure } {
  const errors: string[] = [];
  if (input.rawOutput !== undefined) {
    const raw = input.rawOutput.trim();
    if (/^```/i.test(raw)) errors.push("Markdown-wrapped JSON is not valid for targeted regeneration.");
    else {
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (!objectValue(parsed)) errors.push("The targeted response must be one JSON object.");
      } catch {
        errors.push("The targeted response contains prose or non-JSON text outside the JSON object.");
      }
    }
  }
  const root = objectValue(input.rawResult);
  if (!root) errors.push("The targeted response must be one JSON object.");
  const unauthorizedPaths = root
    ? Object.entries(root).filter(([key]) => !input.allowedTopKeys.includes(key)).flatMap(([key, value]) => displayUnauthorizedPath(key, value))
    : [];
  if (unauthorizedPaths.length) {
    errors.push(`The AI response attempted to modify unauthorized path(s): ${unauthorizedPaths.join(", ")}.`);
  }
  if (errors.length || !root) return { failure: { responseShape: responseShape(input.rawResult), errors, unauthorizedPaths } };
  return { root };
}

function failure(rawResult: unknown, errors: string[], unauthorizedPaths: string[] = []): TargetedOutputContractFailure {
  return { responseShape: responseShape(rawResult), errors, unauthorizedPaths };
}

function exactNestedKeys(value: Record<string, unknown>, allowed: string[], path: string): string[] {
  return Object.keys(value).filter((key) => !allowed.includes(key)).map((key) => `${path}.${key}`);
}

function parseWorkPatches(input: {
  rawResult: unknown;
  root: Record<string, unknown>;
  key: "workExperiencePatches" | "wordingPatches";
  request: TargetedRegenerationRequest;
  currentCv: TailoredCv;
  validEvidenceIds: string[];
}): { patches?: Array<WorkExperiencePatch | WordingCleanupPatch>; failure?: TargetedOutputContractFailure } {
  const values = input.root[input.key];
  if (!Array.isArray(values) || !values.length) return { failure: failure(input.rawResult, [`${input.key} must be a non-empty array.`]) };
  const authorized = authorizedBulletTargets(input.request, input.currentCv);
  const authorizedById = new Map(authorized.map((item) => [item.bulletId, item]));
  const validEvidenceIds = new Set(input.validEvidenceIds);
  const seen = new Set<string>();
  const errors: string[] = [];
  const unauthorizedPaths: string[] = [];
  const patches: Array<WorkExperiencePatch | WordingCleanupPatch> = [];
  values.forEach((value, index) => {
    const patch = objectValue(value);
    const path = `${input.key}[${index}]`;
    if (!patch) {
      errors.push(`${path} must be an object.`);
      return;
    }
    const allowedKeys = input.key === "workExperiencePatches" ? ["roleId", "bulletId", "text", "evidenceIds"] : ["targetId", "text", "evidenceIds"];
    unauthorizedPaths.push(...exactNestedKeys(patch, allowedKeys, path));
    const targetId = String(input.key === "workExperiencePatches" ? patch.bulletId || "" : patch.targetId || "").trim();
    const roleId = String(patch.roleId || "").trim();
    const text = typeof patch.text === "string" ? patch.text.trim() : "";
    const evidenceIds = Array.isArray(patch.evidenceIds) && patch.evidenceIds.every((id) => typeof id === "string") ? patch.evidenceIds as string[] : null;
    const target = authorizedById.get(targetId);
    if (!target) errors.push(`${path} references unknown or unauthorized target ID "${targetId}".`);
    if (seen.has(targetId)) errors.push(`${path} duplicates target ID "${targetId}".`);
    seen.add(targetId);
    if (input.key === "workExperiencePatches" && target && roleId !== target.roleId) errors.push(`${path}.roleId must be "${target.roleId}".`);
    if (!text) errors.push(`${path}.text must be a non-empty string.`);
    if (!evidenceIds) errors.push(`${path}.evidenceIds must be a string array.`);
    else {
      const unknownIds = evidenceIds.filter((id) => !validEvidenceIds.has(id));
      if (unknownIds.length) errors.push(`${path}.evidenceIds contains unknown EvidenceCard ID(s): ${unknownIds.join(", ")}.`);
      if (target && !sameStrings(evidenceIds, target.evidenceIds)) errors.push(`${path}.evidenceIds must preserve the current target EvidenceCard IDs.`);
    }
    if (target && text && evidenceIds) {
      patches.push(input.key === "workExperiencePatches"
        ? { roleId: target.roleId, bulletId: targetId, text, evidenceIds }
        : { targetId, text, evidenceIds });
    }
  });
  const expectedIds = authorized.map((item) => item.bulletId).sort();
  const actualIds = [...seen].filter(Boolean).sort();
  if (!sameStrings(actualIds, expectedIds)) errors.push(`Response target IDs must exactly match: ${expectedIds.join(", ")}.`);
  if (unauthorizedPaths.length) errors.push(`The AI response attempted to modify unauthorized path(s): ${unauthorizedPaths.join(", ")}.`);
  return errors.length ? { failure: failure(input.rawResult, errors, unauthorizedPaths) } : { patches };
}

export function parseTargetedRegenerationOutput(input: {
  rawResult: unknown;
  rawOutput?: string;
  request: TargetedRegenerationRequest;
  currentCv: TailoredCv;
  validEvidenceIds: string[];
}): TargetedOutputParseResult {
  const outputKind = targetedOutputKind(input.request);
  const allowedTopKey = outputKind === "summary" ? "summary" : outputKind === "wording" ? "wordingPatches" : "workExperiencePatches";
  const parsedRoot = strictRoot({ rawResult: input.rawResult, rawOutput: input.rawOutput, allowedTopKeys: [allowedTopKey] });
  if (parsedRoot.failure || !parsedRoot.root) return { ok: false, outputKind, failure: parsedRoot.failure || failure(input.rawResult, ["Invalid targeted response."]) };
  const nextCv = cloneCv(input.currentCv);
  if (outputKind === "summary") {
    const summary = typeof parsedRoot.root.summary === "string" ? parsedRoot.root.summary.trim() : "";
    if (!summary) return { ok: false, outputKind, failure: failure(input.rawResult, ["summary must be a non-empty string."]) };
    nextCv.summary = summary;
    return { ok: true, outputKind, patch: { summary }, candidate: { requestId: input.request.id, cv: nextCv } };
  }
  const key = outputKind === "wording" ? "wordingPatches" : "workExperiencePatches";
  const parsedPatches = parseWorkPatches({ ...input, root: parsedRoot.root, key });
  if (parsedPatches.failure || !parsedPatches.patches) return { ok: false, outputKind, failure: parsedPatches.failure || failure(input.rawResult, ["Invalid targeted patches."]) };
  for (const patch of parsedPatches.patches) {
    const bulletId = "bulletId" in patch ? patch.bulletId : patch.targetId;
    const target = bulletAt(nextCv, bulletId);
    if (target) target.bullet.text = patch.text;
  }
  return outputKind === "wording"
    ? { ok: true, outputKind, patch: { wordingPatches: parsedPatches.patches as WordingCleanupPatch[] }, candidate: { requestId: input.request.id, cv: nextCv } }
    : { ok: true, outputKind, patch: { workExperiencePatches: parsedPatches.patches as WorkExperiencePatch[] }, candidate: { requestId: input.request.id, cv: nextCv } };
}
