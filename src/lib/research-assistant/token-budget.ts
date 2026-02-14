// ── Token Budget Enforcement ─────────────────────────────────────
// Pre-flight token counting to prevent context overflow errors.
// Uses character-based approximation (~4 chars per token) which is
// ~95% accurate and sufficient with the 10% safety margin built
// into the budget constants.

import type { ModelMessage } from "ai";
import type { ResearchTier } from "./types";

// ── Budget constants ───────────────────────────────────────────

export const TOKEN_BUDGETS = {
  standard: {
    maxContextTokens: 180_000, // Gemini 2.5 Flash (200K) with 10% margin
    maxOutputTokens: 50_000,
  },
  expert: {
    maxContextTokens: 360_000, // GPT-5.2 (400K) with 10% margin
    maxOutputTokens: 100_000,
  },
} as const;

// ── Types ──────────────────────────────────────────────────────

export type TokenBudgetResult = {
  withinBudget: boolean;
  totalTokens: number;
  maxTokens: number;
  remainingTokens: number;
};

// ── Token counting ─────────────────────────────────────────────

/** Approximate token count from character count (~4 chars per token). */
function estimateTokens(charCount: number): number {
  return Math.ceil(charCount / 4);
}

/**
 * Checks whether a messages array is within the token budget for a tier.
 * Concatenates all message content and estimates total tokens.
 */
export function checkTokenBudget(
  messages: ModelMessage[],
  tier: ResearchTier,
): TokenBudgetResult {
  const budget = TOKEN_BUDGETS[tier];

  let totalChars = 0;
  for (const msg of messages) {
    if ("content" in msg && typeof msg.content === "string") {
      totalChars += msg.content.length;
    } else if ("content" in msg && Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if ("text" in part && typeof part.text === "string") {
          totalChars += part.text.length;
        }
      }
    }
  }

  const totalTokens = estimateTokens(totalChars);
  const maxTokens = budget.maxContextTokens;

  return {
    withinBudget: totalTokens < maxTokens,
    totalTokens,
    maxTokens,
    remainingTokens: Math.max(0, maxTokens - totalTokens),
  };
}
