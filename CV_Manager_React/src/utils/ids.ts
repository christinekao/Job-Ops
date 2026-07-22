import type { CvVersion } from "../types";

export function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function confirmRemoval(label: string) {
  return window.confirm(`Delete ${label}? This change will be saved automatically.`);
}

export function sortCvVersions(versions: CvVersion[]) {
  return [...versions].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}
