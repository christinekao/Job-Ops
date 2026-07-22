import type { ParsePreview } from "../types";

export const emptyPreview = <T,>(): ParsePreview<T> => ({ raw: "", parsed: null, error: "" });

export function extractJsonCandidate(value: string): string {
  const cleaned = value
    .replace(/^﻿/, "")
    .replace(/```(?:json|javascript|js)?/gi, "")
    .replace(/```/g, "")
    .trim();
  if (!cleaned) return cleaned;
  if ((cleaned.startsWith("{") && cleaned.endsWith("}")) || (cleaned.startsWith("[") && cleaned.endsWith("]"))) {
    return cleaned;
  }

  const start = cleaned.search(/[\[{]/);
  if (start < 0) return cleaned;

  const opener = cleaned[start];
  const closer = opener === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < cleaned.length; index += 1) {
    const char = cleaned[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === "\"") {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === opener) depth += 1;
    if (char === closer) depth -= 1;
    if (depth === 0) return cleaned.slice(start, index + 1);
  }

  return cleaned;
}

export function sanitizeJsonCandidate(value: string): string {
  return value
    .replace(/[""]/g, "\"")
    .replace(/['']/g, "'")
    .replace(/,\s*([}\]])/g, "$1")
    .trim();
}

function repairMissingClosingBrackets(candidate: string): { repaired: string; added: string } | null {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (const char of candidate) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\" && inString) {
      escaped = true;
      continue;
    }
    if (char === "\"") {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === "{" || char === "[") stack.push(char);
    if (char === "}" || char === "]") {
      const expected = char === "}" ? "{" : "[";
      if (stack.pop() !== expected) return null;
    }
  }

  if (inString || escaped || stack.length === 0) return null;
  const added = stack.reverse().map((opener) => opener === "{" ? "}" : "]").join("");
  return { repaired: `${candidate}${added}`, added };
}

function escapeLiteralControlCharsInStrings(candidate: string): string {
  let output = "";
  let inString = false;
  let escaped = false;

  for (const char of candidate) {
    if (escaped) {
      output += char;
      escaped = false;
      continue;
    }
    if (char === "\\" && inString) {
      output += char;
      escaped = true;
      continue;
    }
    if (char === "\"") {
      inString = !inString;
      output += char;
      continue;
    }
    if (inString) {
      if (char === "\n") {
        output += "\\n";
        continue;
      }
      if (char === "\r") {
        output += "\\r";
        continue;
      }
      if (char === "\t") {
        output += "\\t";
        continue;
      }
    }
    output += char;
  }

  return output;
}

function parseWithRepairs<T>(candidate: string): { parsed: T; warning?: string } {
  try {
    return { parsed: JSON.parse(candidate) as T };
  } catch (originalError) {
    const escaped = escapeLiteralControlCharsInStrings(candidate);
    if (escaped !== candidate) {
      try {
        return {
          parsed: JSON.parse(escaped) as T,
          warning: "GPT 回覆的 JSON 字串內含未跳脫換行/Tab，系統已轉成合法 JSON escape。Apply 前請確認 Parse Preview 內容完整。"
        };
      } catch {
        // Continue with bracket repair attempts below.
      }
    }

    const repair = repairMissingClosingBrackets(candidate);
    if (repair) {
      try {
        return {
          parsed: JSON.parse(repair.repaired) as T,
          warning: `GPT 回覆尾端缺少 ${repair.added.length} 個括號，系統已安全補上 ${repair.added}。Apply 前請確認 Parse Preview 內容完整。`
        };
      } catch {
        const escapedRepair = escapeLiteralControlCharsInStrings(repair.repaired);
        if (escapedRepair !== repair.repaired) {
          try {
            return {
              parsed: JSON.parse(escapedRepair) as T,
              warning: `GPT 回覆尾端缺少 ${repair.added.length} 個括號，且字串內含未跳脫換行/Tab；系統已安全修復。Apply 前請確認 Parse Preview 內容完整。`
            };
          } catch {
            // Fall through to original error.
          }
        }
      }
    }

    throw originalError;
  }
}

function jsonFailureDetail(candidate: string): string {
  const compact = candidate.replace(/\s+/g, " ").trim();
  const head = compact.slice(0, 120);
  const tail = compact.length > 120 ? compact.slice(-120) : "";
  return tail
    ? ` Parser 已讀到 JSON 片段開頭：「${head}」；結尾：「${tail}」。`
    : ` Parser 已讀到 JSON 片段：「${head}」。`;
}

export function tryParseJson<T>(value: string): ParsePreview<T> {
  if (!value.trim()) return { raw: value, parsed: null, error: "貼回內容是空的。請把 GPT 回覆貼到下方 Paste GPT JSON Back 欄位，再按 Parse JSON。" };
  if (/STRICT MACHINE OUTPUT CONTRACT|Job description:|Required JSON shape:|Return only raw JSON|Parse this job description/i.test(value)) {
    return {
      raw: value,
      parsed: null,
      error: "你貼回來的是給 GPT 的 prompt，不是 GPT 輸出的 JSON。請把 prompt 貼到 GPT，等它回傳以 { 開頭、以 } 結尾的 JSON 後，再只貼那段 JSON 回來。"
    };
  }
  const candidate = sanitizeJsonCandidate(extractJsonCandidate(value));
  const startsLikeJson = candidate.startsWith("{") || candidate.startsWith("[");
  const endsLikeJson = candidate.endsWith("}") || candidate.endsWith("]");
  if (!startsLikeJson) {
    return {
      raw: value,
      parsed: null,
      error: "沒有抓到完整 JSON。請確認貼回內容包含從第一個 { 到最後一個 } 的完整回覆，不要只貼中間片段或截圖文字。"
    };
  }
  if (!endsLikeJson) {
    const repair = repairMissingClosingBrackets(candidate);
    if (repair) {
      try {
        const result = parseWithRepairs<T>(repair.repaired);
        return { raw: value, parsed: result.parsed, error: "", warning: result.warning || `GPT 回覆尾端缺少 ${repair.added.length} 個括號，系統已安全補上 ${repair.added}。Apply 前請確認 Parse Preview 內容完整。` };
      } catch {
        // Fall through to the explicit incomplete-JSON message below.
      }
    }
    return {
      raw: value,
      parsed: null,
      error: "沒有抓到完整 JSON。請確認貼回內容包含從第一個 { 到最後一個 } 的完整回覆，不要只貼中間片段或截圖文字。"
    };
  }
  try {
    const result = parseWithRepairs<T>(candidate);
    return { raw: value, parsed: result.parsed, error: "", warning: result.warning };
  } catch (error) {
    return {
      raw: value,
      parsed: null,
      error: `${error instanceof Error ? error.message : "JSON parse failed"}。常見原因：GPT 回覆被截斷、少了最後的 }、有註解/說明文字混在 JSON 裡、或字串內有未跳脫的換行。${jsonFailureDetail(candidate)}`
    };
  }
}
