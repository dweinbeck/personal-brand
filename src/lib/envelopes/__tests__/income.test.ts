import { describe, expect, it } from "vitest";
import { computeDisposableIncomeCents } from "../kpi-math";
import { incomeEntrySchema } from "../types";

describe("incomeEntrySchema", () => {
  it("accepts valid input", () => {
    const result = incomeEntrySchema.safeParse({
      amountCents: 3000,
      description: "Sold old speaker",
      date: "2026-02-17",
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero amount", () => {
    const result = incomeEntrySchema.safeParse({
      amountCents: 0,
      description: "Free item",
      date: "2026-02-17",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative amount", () => {
    const result = incomeEntrySchema.safeParse({
      amountCents: -100,
      description: "Negative",
      date: "2026-02-17",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty description", () => {
    const result = incomeEntrySchema.safeParse({
      amountCents: 1000,
      description: "",
      date: "2026-02-17",
    });
    expect(result.success).toBe(false);
  });

  it("rejects description over 200 chars", () => {
    const result = incomeEntrySchema.safeParse({
      amountCents: 1000,
      description: "a".repeat(201),
      date: "2026-02-17",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid date format", () => {
    const result = incomeEntrySchema.safeParse({
      amountCents: 1000,
      description: "Valid desc",
      date: "02-17-2026",
    });
    expect(result.success).toBe(false);
  });

  it("accepts exactly 200 char description", () => {
    const result = incomeEntrySchema.safeParse({
      amountCents: 1000,
      description: "a".repeat(200),
      date: "2026-02-17",
    });
    expect(result.success).toBe(true);
  });

  it("rejects float amountCents", () => {
    const result = incomeEntrySchema.safeParse({
      amountCents: 10.5,
      description: "Float cents",
      date: "2026-02-17",
    });
    expect(result.success).toBe(false);
  });
});

describe("computeDisposableIncomeCents", () => {
  it("computes income minus bills", () => {
    expect(computeDisposableIncomeCents(200000, 120000)).toBe(80000);
  });

  it("returns negative when bills exceed income", () => {
    expect(computeDisposableIncomeCents(100000, 150000)).toBe(-50000);
  });

  it("returns zero when equal", () => {
    expect(computeDisposableIncomeCents(100000, 100000)).toBe(0);
  });
});
