import type { Timestamp } from "firebase-admin/firestore";
import { z } from "zod/v4";

// ---------------------------------------------------------------------------
// Input schemas (what the client sends -- validated by Zod)
// IMPORTANT: userId is NEVER in these schemas. It is always derived server-side
// from verifyUser().
// ---------------------------------------------------------------------------

/** Envelope creation payload. */
export const envelopeSchema = z.object({
  title: z.string().min(1).max(100),
  weeklyBudgetCents: z.number().int().min(1), // positive integer cents
});
export type EnvelopeInput = z.infer<typeof envelopeSchema>;

/** Envelope partial update payload (all fields optional). */
export const envelopeUpdateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  weeklyBudgetCents: z.number().int().min(1).optional(),
  rollover: z.boolean().optional(),
});
export type EnvelopeUpdateInput = z.infer<typeof envelopeUpdateSchema>;

/** Reorder payload -- ordered array of envelope IDs. */
export const reorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});
export type ReorderInput = z.infer<typeof reorderSchema>;

/** Transaction creation payload. */
export const transactionSchema = z.object({
  envelopeId: z.string().min(1),
  amountCents: z.number().int().min(1), // positive integer cents
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  merchant: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
});
export type TransactionInput = z.infer<typeof transactionSchema>;

/** Transaction partial update payload (all fields optional). */
export const transactionUpdateSchema = z.object({
  envelopeId: z.string().min(1).optional(),
  amountCents: z.number().int().min(1).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .optional(),
  merchant: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
});
export type TransactionUpdateInput = z.infer<typeof transactionUpdateSchema>;

/** Single donor allocation within an overage reallocation. */
export const donorAllocationSchema = z.object({
  donorEnvelopeId: z.string().min(1),
  amountCents: z.number().int().min(1), // positive integer cents
});

/** Overage allocation input: source transaction + where to pull funds from. */
export const overageAllocationSchema = z.object({
  sourceTransactionId: z.string().min(1),
  allocations: z.array(donorAllocationSchema).min(1),
});
export type OverageAllocationInput = z.infer<typeof overageAllocationSchema>;

/** Transfer input: move funds from one envelope to another within a week. */
export const transferSchema = z.object({
  fromEnvelopeId: z.string().min(1),
  toEnvelopeId: z.string().min(1),
  amountCents: z.number().int().min(1),
  note: z.string().max(200).optional(),
});
export type TransferInput = z.infer<typeof transferSchema>;

/** Income entry creation payload (supplemental income for a specific week). */
export const incomeEntrySchema = z.object({
  amountCents: z.number().int().min(1),
  description: z.string().min(1).max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
});
export type IncomeEntryInput = z.infer<typeof incomeEntrySchema>;

/** Result of validating an allocation request. */
export type AllocationValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] };

// ---------------------------------------------------------------------------
// Firestore document shapes (what is stored)
// ---------------------------------------------------------------------------

/** Envelope Firestore document. */
export type Envelope = {
  id: string;
  userId: string;
  title: string;
  weeklyBudgetCents: number;
  sortOrder: number;
  rollover: boolean; // true = carry surplus, false = reset each week
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

/** Transaction Firestore document. */
export type EnvelopeTransaction = {
  id: string;
  userId: string;
  envelopeId: string;
  amountCents: number;
  date: string; // YYYY-MM-DD (user-entered, no timezone issues)
  merchant?: string;
  description?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

/** Overage allocation (used in Phase 4 for reallocation tracking). */
export type OverageAllocation = {
  id: string;
  userId: string;
  sourceTransactionId: string; // the transaction that caused the overage
  donorEnvelopeId: string; // the envelope donating funds
  amountCents: number; // how much was reallocated
  createdAt: Timestamp;
};

/** Envelope transfer document (funds moved between envelopes within a week). */
export type EnvelopeTransfer = {
  id: string;
  userId: string;
  fromEnvelopeId: string;
  toEnvelopeId: string;
  amountCents: number;
  weekStart: string; // YYYY-MM-DD -- scoped to the current week
  note?: string;
  createdAt: Timestamp;
};

/** Income entry Firestore document (supplemental income for a specific week). */
export type IncomeEntry = {
  id: string;
  userId: string;
  amountCents: number;
  description: string;
  date: string; // YYYY-MM-DD
  weekStart: string; // YYYY-MM-DD (Sunday of the week this income belongs to)
  createdAt: Timestamp;
};

// ---------------------------------------------------------------------------
// Computed / display types (used by UI and API responses)
// ---------------------------------------------------------------------------

/** Envelope enriched with computed fields for display. */
export type EnvelopeWithStatus = Envelope & {
  spentCents: number;
  remainingCents: number;
  status: "On Track" | "Watch" | "Over";
  rolloverSurplusCents: number; // accumulated surplus from prior completed weeks (0 for non-rollover)
};

/** Response shape for GET /api/envelopes (home page data). */
export type HomePageData = {
  envelopes: EnvelopeWithStatus[];
  weekLabel: string;
  cumulativeSavingsCents: number;
  weeklyIncomeCents: number; // total extra income for current week
  billing: BillingStatus;
};

/** Response shape for GET /api/envelopes/transactions?weekStart=...&weekEnd=... */
export type TransactionsPageData = {
  transactions: EnvelopeTransaction[];
  billing: BillingStatus;
};

// ---------------------------------------------------------------------------
// Analytics types (used by GET /api/envelopes/analytics)
// ---------------------------------------------------------------------------

/** Single row in the weekly savings breakdown (for savings chart). */
export type WeeklySavingsEntry = {
  weekStart: string; // "2026-01-05" (YYYY-MM-DD)
  weekLabel: string; // "Wk 2"
  savingsCents: number; // savings for this single week
  cumulativeCents: number; // running total through this week
};

/** Single row in the weekly pivot table. */
export type PivotRow = {
  weekStart: string; // "2026-01-05" (YYYY-MM-DD)
  weekLabel: string; // "Wk 2"
  cells: Record<string, number>; // envelopeId -> sum of transaction amountCents
  totalCents: number; // sum across all envelopes for this week
};

/** Per-envelope spending breakdown for budget utilization bar chart. */
export type SpendingByEnvelopeEntry = {
  envelopeId: string;
  title: string;
  spentCents: number;
  budgetCents: number;
  percentUsed: number; // 0-100+, can exceed 100 for over-budget
};

/** Weekly totals for spending trend line chart. */
export type WeeklyTotalEntry = {
  weekStart: string;
  weekLabel: string;
  totalSpentCents: number;
  totalBudgetCents: number;
};

/** Weekly income entry for analytics charts. */
export type WeeklyIncomeEntry = {
  weekStart: string;
  weekLabel: string;
  totalIncomeCents: number;
};

/** Response shape for GET /api/envelopes/analytics. */
export type AnalyticsPageData = {
  summary: {
    totalSpentCents: number;
    totalBudgetCents: number;
    totalRemainingCents: number;
    onTrackCount: number;
    totalEnvelopeCount: number;
  };
  envelopes: { id: string; title: string }[]; // column headers for pivot table
  pivotRows: PivotRow[]; // rows, newest week first
  savingsByWeek: WeeklySavingsEntry[]; // oldest first (for chart x-axis)
  spendingByEnvelope: SpendingByEnvelopeEntry[]; // per-envelope budget utilization
  weeklyTotals: WeeklyTotalEntry[]; // weekly spending totals for trend chart
  weeklyIncome: WeeklyIncomeEntry[]; // weekly income totals for income vs spending chart
  billing: BillingStatus;
};

// ---------------------------------------------------------------------------
// KPI Profile types (Phase 1: Public Landing + KPI Wizard)
// ---------------------------------------------------------------------------

/** KPI profile input validation — validated by Zod at API boundary. */
export const envelopeProfileSchema = z.object({
  averageWeeklyIncomeCents: z.number().int().min(0),
  averageWeeklyBillsCents: z.number().int().min(0),
  targetWeeklySavingsCents: z.number().int().min(0),
});
export type EnvelopeProfileInput = z.infer<typeof envelopeProfileSchema>;

/** KPI profile Firestore document shape. */
export type EnvelopeProfile = {
  uid: string;
  averageWeeklyIncomeCents: number;
  averageWeeklyBillsCents: number;
  targetWeeklySavingsCents: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

// ---------------------------------------------------------------------------
// Billing types (Phase 6)
// ---------------------------------------------------------------------------

/** Tracks per-user envelope billing state in Firestore: envelope_billing/{uid}. */
export type EnvelopeBilling = {
  uid: string;
  firstAccessWeekStart: string; // YYYY-MM-DD (Sunday of first-ever access)
  paidWeeks: Record<
    string,
    {
      usageId: string;
      creditsCharged: number;
      chargedAt: Timestamp;
    }
  >;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

/** Result of billing access check for envelope routes. */
export type EnvelopeAccessResult =
  | { mode: "readwrite"; weekStart: string; reason?: "free_week" }
  | { mode: "readonly"; weekStart: string; reason: "unpaid" };

/** Billing status included in envelope API GET responses. */
export type BillingStatus = {
  mode: "readwrite" | "readonly";
  reason?: "free_week" | "unpaid";
};
