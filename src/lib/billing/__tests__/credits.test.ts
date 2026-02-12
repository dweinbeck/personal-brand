import { describe, expect, it } from "vitest";
import { TOOL_PRICING_SEED } from "../tools";
import { CREDIT_PACKS } from "../types";

describe("Credit pack economics", () => {
  it("all packs have credits equal to usdCents (1 credit = 1 cent)", () => {
    for (const [, pack] of Object.entries(CREDIT_PACKS)) {
      expect(pack.credits).toBe(pack.usdCents);
    }
  });

  it("all packs have positive values", () => {
    for (const [, pack] of Object.entries(CREDIT_PACKS)) {
      expect(pack.credits).toBeGreaterThan(0);
      expect(pack.usdCents).toBeGreaterThan(0);
      expect(pack.label.length).toBeGreaterThan(0);
    }
  });
});

describe("Tool pricing seed", () => {
  it("has unique tool keys", () => {
    const keys = TOOL_PRICING_SEED.map((t) => t.toolKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("active tools are marked active", () => {
    const activeKeys = ["brand_scraper", "dave_ramsey", "tasks_app"];
    for (const key of activeKeys) {
      const tool = TOOL_PRICING_SEED.find((t) => t.toolKey === key);
      expect(tool).toBeDefined();
      expect(tool?.active).toBe(true);
    }
  });

  it("placeholder tools are inactive", () => {
    const activeKeys = new Set(["brand_scraper", "dave_ramsey", "tasks_app"]);
    const placeholders = TOOL_PRICING_SEED.filter(
      (t) => !activeKeys.has(t.toolKey),
    );
    for (const tool of placeholders) {
      expect(tool.active).toBe(false);
    }
  });

  it("all tools have positive creditsPerUse", () => {
    for (const tool of TOOL_PRICING_SEED) {
      expect(tool.creditsPerUse).toBeGreaterThan(0);
    }
  });

  it("all tools have non-negative costToUsCentsEstimate", () => {
    for (const tool of TOOL_PRICING_SEED) {
      expect(tool.costToUsCentsEstimate).toBeGreaterThanOrEqual(0);
    }
  });

  it("brand_scraper revenue exceeds estimated cost (positive margin)", () => {
    const scraper = TOOL_PRICING_SEED.find(
      (t) => t.toolKey === "brand_scraper",
    );
    expect(scraper).toBeDefined();
    if (scraper) {
      expect(scraper.creditsPerUse).toBeGreaterThan(
        scraper.costToUsCentsEstimate,
      );
    }
  });
});

describe("Idempotency key format", () => {
  it("crypto.randomUUID produces valid format", () => {
    const uuid = crypto.randomUUID();
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("composite key format uid_key is valid", () => {
    const uid = "abc123";
    const key = crypto.randomUUID();
    const composite = `${uid}_${key}`;
    expect(composite).toContain("_");
    expect(composite.split("_")[0]).toBe(uid);
  });
});
