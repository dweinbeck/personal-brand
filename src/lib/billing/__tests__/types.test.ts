import { describe, expect, it } from "vitest";
import {
  adminAdjustSchema,
  CREDIT_PACKS,
  creditPackSchema,
  pricingUpdateSchema,
  refundReasonSchema,
} from "../types";

describe("creditPackSchema", () => {
  it("accepts valid pack '500'", () => {
    const result = creditPackSchema.safeParse({ pack: "500" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid pack value", () => {
    const result = creditPackSchema.safeParse({ pack: "100" });
    expect(result.success).toBe(false);
  });

  it("rejects numeric pack value", () => {
    const result = creditPackSchema.safeParse({ pack: 500 });
    expect(result.success).toBe(false);
  });

  it("rejects empty object", () => {
    const result = creditPackSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("CREDIT_PACKS", () => {
  it("has correct values for the 500 pack", () => {
    expect(CREDIT_PACKS["500"]).toEqual({
      credits: 500,
      usdCents: 500,
      label: "500 credits ($5)",
    });
  });

  it("1 credit = 1 cent", () => {
    expect(CREDIT_PACKS["500"].credits).toBe(CREDIT_PACKS["500"].usdCents);
  });
});

describe("adminAdjustSchema", () => {
  it("accepts valid adjustment", () => {
    const result = adminAdjustSchema.safeParse({
      deltaCredits: 100,
      reason: "Test grant",
    });
    expect(result.success).toBe(true);
  });

  it("accepts negative delta", () => {
    const result = adminAdjustSchema.safeParse({
      deltaCredits: -50,
      reason: "Correction",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing reason", () => {
    const result = adminAdjustSchema.safeParse({ deltaCredits: 100 });
    expect(result.success).toBe(false);
  });

  it("rejects empty reason", () => {
    const result = adminAdjustSchema.safeParse({
      deltaCredits: 100,
      reason: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer delta", () => {
    const result = adminAdjustSchema.safeParse({
      deltaCredits: 10.5,
      reason: "Test",
    });
    expect(result.success).toBe(false);
  });
});

describe("refundReasonSchema", () => {
  it("accepts valid reason", () => {
    const result = refundReasonSchema.safeParse({ reason: "Job failed" });
    expect(result.success).toBe(true);
  });

  it("rejects empty reason", () => {
    const result = refundReasonSchema.safeParse({ reason: "" });
    expect(result.success).toBe(false);
  });
});

describe("pricingUpdateSchema", () => {
  it("accepts valid pricing update", () => {
    const result = pricingUpdateSchema.safeParse({
      toolKey: "brand_scraper",
      creditsPerUse: 50,
      costToUsCentsEstimate: 30,
      active: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative credits", () => {
    const result = pricingUpdateSchema.safeParse({
      toolKey: "brand_scraper",
      creditsPerUse: -1,
      costToUsCentsEstimate: 30,
      active: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing toolKey", () => {
    const result = pricingUpdateSchema.safeParse({
      creditsPerUse: 50,
      costToUsCentsEstimate: 30,
      active: true,
    });
    expect(result.success).toBe(false);
  });
});
