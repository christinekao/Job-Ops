import type { AppData } from "../types";
import { contentHash } from "../utils/hash";

export function freshSourceHashes(data: AppData) {
  return Object.fromEntries(data.rawSources
    .filter((source) => source.parsedSnapshot?.sourceContentHash === contentHash(source.content))
    .map((source) => [source.id, contentHash(source.content)]));
}
