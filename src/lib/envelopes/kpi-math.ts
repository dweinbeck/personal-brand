/**
 * Normalizes a monetary amount to weekly cents based on the input frequency.
 * Monthly uses 52/12 weeks/month (= 4.3333...). Result is rounded to nearest integer.
 */
export function normalizeToWeeklyCents(
  amountCents: number,
  frequency: "weekly" | "biweekly" | "monthly",
): number {
  switch (frequency) {
    case "weekly":
      return amountCents;
    case "biweekly":
      return Math.round(amountCents / 2);
    case "monthly":
      return Math.round(amountCents / (52 / 12));
    default:
      return amountCents;
  }
}

/**
 * Computes disposable income as income minus bills.
 * Can be negative if bills exceed income.
 */
export function computeDisposableIncomeCents(
  incomeCents: number,
  billsCents: number,
): number {
  return incomeCents - billsCents;
}
