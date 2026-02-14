import { describe, expect, it } from "vitest";
import {
  CREDIT_COSTS,
  getCreditCost,
  getModelDisplayNames,
  getTierConfig,
  SSE_EVENTS,
  TIER_CONFIGS,
} from "../config";

describe("research-assistant config", () => {
  // ── Tier config tests ────────────────────────────────────────

  describe("getTierConfig", () => {
    it("standard tier maps to correct model IDs", () => {
      const config = getTierConfig("standard");
      expect(config.models).toHaveLength(2);

      const googleModel = config.models.find((m) => m.provider === "google");
      expect(googleModel?.modelId).toBe("gemini-2.5-flash");

      const openaiModel = config.models.find((m) => m.provider === "openai");
      expect(openaiModel?.modelId).toBe("gpt-5.2-chat-latest");
    });

    it("expert tier maps to correct model IDs", () => {
      const config = getTierConfig("expert");
      expect(config.models).toHaveLength(2);

      const googleModel = config.models.find((m) => m.provider === "google");
      expect(googleModel?.modelId).toBe("gemini-3-pro-preview");

      const openaiModel = config.models.find((m) => m.provider === "openai");
      expect(openaiModel?.modelId).toBe("gpt-5.2");
    });

    it("standard tier creditCost is 10", () => {
      expect(getTierConfig("standard").creditCost).toBe(10);
    });

    it("expert tier creditCost is 20", () => {
      expect(getTierConfig("expert").creditCost).toBe(20);
    });

    it("each tier has exactly one google and one openai model", () => {
      for (const tier of ["standard", "expert"] as const) {
        const config = getTierConfig(tier);
        const providers = config.models.map((m) => m.provider).sort();
        expect(providers).toEqual(["google", "openai"]);
      }
    });
  });

  // ── Credit cost tests ────────────────────────────────────────

  describe("getCreditCost", () => {
    it("standard prompt costs 10 credits", () => {
      expect(getCreditCost("prompt", "standard")).toBe(10);
    });

    it("expert prompt costs 20 credits", () => {
      expect(getCreditCost("prompt", "expert")).toBe(20);
    });

    it("standard reconsider costs 5 credits", () => {
      expect(getCreditCost("reconsider", "standard")).toBe(5);
    });

    it("expert reconsider costs 10 credits", () => {
      expect(getCreditCost("reconsider", "expert")).toBe(10);
    });

    it("standard follow-up costs 5 credits", () => {
      expect(getCreditCost("follow-up", "standard")).toBe(5);
    });

    it("expert follow-up costs 10 credits", () => {
      expect(getCreditCost("follow-up", "expert")).toBe(10);
    });
  });

  // ── CREDIT_COSTS constant coverage ───────────────────────────

  describe("CREDIT_COSTS", () => {
    it("covers all three billing actions", () => {
      expect(Object.keys(CREDIT_COSTS).sort()).toEqual([
        "follow-up",
        "prompt",
        "reconsider",
      ]);
    });

    it("each action has standard and expert tiers", () => {
      for (const action of Object.values(CREDIT_COSTS)) {
        expect(Object.keys(action).sort()).toEqual(["expert", "standard"]);
      }
    });
  });

  // ── TIER_CONFIGS constant coverage ───────────────────────────

  describe("TIER_CONFIGS", () => {
    it("has standard and expert keys", () => {
      expect(Object.keys(TIER_CONFIGS).sort()).toEqual(["expert", "standard"]);
    });

    it("every model has a non-empty displayName", () => {
      for (const config of Object.values(TIER_CONFIGS)) {
        for (const model of config.models) {
          expect(model.displayName.length).toBeGreaterThan(0);
        }
      }
    });
  });

  // ── Display name tests ───────────────────────────────────────

  describe("getModelDisplayNames", () => {
    it("returns two distinct names for standard tier", () => {
      const [name1, name2] = getModelDisplayNames("standard");
      expect(name1).toBeTruthy();
      expect(name2).toBeTruthy();
      expect(name1).not.toBe(name2);
    });

    it("returns two distinct names for expert tier", () => {
      const [name1, name2] = getModelDisplayNames("expert");
      expect(name1).toBeTruthy();
      expect(name2).toBeTruthy();
      expect(name1).not.toBe(name2);
    });
  });

  // ── SSE event constants ──────────────────────────────────────

  describe("SSE_EVENTS", () => {
    it("has all required streaming event types", () => {
      expect(SSE_EVENTS.GEMINI).toBe("gemini");
      expect(SSE_EVENTS.OPENAI).toBe("openai");
      expect(SSE_EVENTS.COMPLETE).toBe("complete");
      expect(SSE_EVENTS.ERROR).toBe("error");
    });

    it("has done events for each model", () => {
      expect(SSE_EVENTS.GEMINI_DONE).toBe("gemini-done");
      expect(SSE_EVENTS.OPENAI_DONE).toBe("openai-done");
    });

    it("has error events for each model", () => {
      expect(SSE_EVENTS.GEMINI_ERROR).toBe("gemini-error");
      expect(SSE_EVENTS.OPENAI_ERROR).toBe("openai-error");
    });
  });
});
