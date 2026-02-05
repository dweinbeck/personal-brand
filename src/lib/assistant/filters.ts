import { readFileSync } from "node:fs";
import { join } from "node:path";

type SafetyRules = {
  blockedPatterns: string[];
  sensitiveTopics: string[];
};

let cachedRules: SafetyRules | null = null;

function loadRules(): SafetyRules {
  if (cachedRules) return cachedRules;
  const raw = readFileSync(
    join(process.cwd(), "src/data/safety-rules.json"),
    "utf-8",
  );
  cachedRules = JSON.parse(raw);
  return cachedRules!;
}

export function sanitizeInput(text: string): string {
  // Remove zero-width characters and other invisible unicode
  let clean = text.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, "");

  // Normalize whitespace
  clean = clean.replace(/\s+/g, " ").trim();

  // Strip HTML/XML tags
  clean = clean.replace(/<[^>]*>/g, "");

  // Remove common encoding tricks
  clean = clean.replace(/&#\d+;/g, "");
  clean = clean.replace(/\\u[\dA-Fa-f]{4}/g, "");

  return clean;
}

export type FilterResult = {
  blocked: boolean;
  reason: "injection" | "sensitive" | null;
  topic: string | null;
};

export function detectBlockedContent(text: string): FilterResult {
  const rules = loadRules();
  const lower = text.toLowerCase();

  // Check for prompt injection patterns
  for (const pattern of rules.blockedPatterns) {
    if (new RegExp(pattern, "i").test(lower)) {
      return { blocked: true, reason: "injection", topic: null };
    }
  }

  // Check for sensitive topics
  for (const pattern of rules.sensitiveTopics) {
    if (new RegExp(pattern, "i").test(lower)) {
      return {
        blocked: true,
        reason: "sensitive",
        topic: pattern.split("|")[0].replace(/[()]/g, ""),
      };
    }
  }

  return { blocked: false, reason: null, topic: null };
}
