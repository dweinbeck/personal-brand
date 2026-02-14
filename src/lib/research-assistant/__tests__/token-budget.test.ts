import type { ModelMessage } from "ai";
import { describe, expect, it } from "vitest";
import { checkTokenBudget, TOKEN_BUDGETS } from "../token-budget";

// ── Tests ────────────────────────────────────────────────────

describe("token-budget", () => {
  // ── TOKEN_BUDGETS constants ──────────────────────────────────

  describe("TOKEN_BUDGETS constants", () => {
    it("standard tier: maxContextTokens = 180_000", () => {
      expect(TOKEN_BUDGETS.standard.maxContextTokens).toBe(180_000);
    });

    it("standard tier: maxOutputTokens = 50_000", () => {
      expect(TOKEN_BUDGETS.standard.maxOutputTokens).toBe(50_000);
    });

    it("expert tier: maxContextTokens = 360_000", () => {
      expect(TOKEN_BUDGETS.expert.maxContextTokens).toBe(360_000);
    });

    it("expert tier: maxOutputTokens = 100_000", () => {
      expect(TOKEN_BUDGETS.expert.maxOutputTokens).toBe(100_000);
    });
  });

  // ── checkTokenBudget ─────────────────────────────────────────

  describe("checkTokenBudget", () => {
    const shortMessages: ModelMessage[] = [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there" },
    ];

    it("returns withinBudget: true for short messages", () => {
      const result = checkTokenBudget(shortMessages, "standard");
      expect(result.withinBudget).toBe(true);
    });

    it("returns withinBudget: false for messages exceeding budget", () => {
      // Standard budget = 180K tokens ≈ 720K chars. Use 800K chars to exceed.
      const longMessages: ModelMessage[] = [
        { role: "user", content: "x".repeat(800_000) },
      ];
      const result = checkTokenBudget(longMessages, "standard");
      expect(result.withinBudget).toBe(false);
    });

    it("returns correct totalTokens count (~charLength/4)", () => {
      // "Hello" (5) + "Hi there" (8) = 13 chars → ceil(13/4) = 4 tokens
      const result = checkTokenBudget(shortMessages, "standard");
      expect(result.totalTokens).toBe(Math.ceil(13 / 4));
    });

    it("returns correct remainingTokens calculation", () => {
      const result = checkTokenBudget(shortMessages, "standard");
      expect(result.remainingTokens).toBe(
        TOKEN_BUDGETS.standard.maxContextTokens - result.totalTokens,
      );
    });

    it("works with standard tier budget", () => {
      const result = checkTokenBudget(shortMessages, "standard");
      expect(result.maxTokens).toBe(180_000);
      expect(result.withinBudget).toBe(true);
    });

    it("works with expert tier budget", () => {
      const result = checkTokenBudget(shortMessages, "expert");
      expect(result.maxTokens).toBe(360_000);
      expect(result.withinBudget).toBe(true);
    });

    it("handles empty messages array (withinBudget: true, totalTokens: 0)", () => {
      const result = checkTokenBudget([], "standard");
      expect(result.withinBudget).toBe(true);
      expect(result.totalTokens).toBe(0);
      expect(result.remainingTokens).toBe(180_000);
    });

    it("handles messages with array content parts (not just string content)", () => {
      // ModelMessage with array content (e.g., multi-part user message)
      const arrayContentMessages: ModelMessage[] = [
        {
          role: "user",
          content: [
            { type: "text", text: "Hello world" },
            { type: "text", text: " from parts" },
          ],
        } as ModelMessage,
      ];
      const result = checkTokenBudget(arrayContentMessages, "standard");
      // "Hello world" (11) + " from parts" (11) = 22 chars → ceil(22/4) = 6 tokens
      expect(result.totalTokens).toBe(Math.ceil(22 / 4));
      expect(result.withinBudget).toBe(true);
    });

    it("remainingTokens is clamped to 0 when over budget", () => {
      const longMessages: ModelMessage[] = [
        { role: "user", content: "x".repeat(800_000) },
      ];
      const result = checkTokenBudget(longMessages, "standard");
      expect(result.remainingTokens).toBe(0);
    });

    it("expert tier allows messages that exceed standard budget", () => {
      // 250K tokens ≈ 1M chars — over standard (180K) but under expert (360K)
      const mediumMessages: ModelMessage[] = [
        { role: "user", content: "x".repeat(1_000_000) },
      ];
      const standardResult = checkTokenBudget(mediumMessages, "standard");
      const expertResult = checkTokenBudget(mediumMessages, "expert");
      expect(standardResult.withinBudget).toBe(false);
      expect(expertResult.withinBudget).toBe(true);
    });
  });
});
