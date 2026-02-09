import { z } from "zod/v4";

// ── Ledger entry types ─────────────────────────────────────────

export const ledgerEntryTypes = [
  "signup_grant",
  "purchase",
  "debit",
  "refund",
  "admin_adjustment",
] as const;

export type LedgerEntryType = (typeof ledgerEntryTypes)[number];

// ── Tool usage statuses ────────────────────────────────────────

export const usageStatuses = [
  "started",
  "succeeded",
  "failed",
  "refunded",
] as const;

export type UsageStatus = (typeof usageStatuses)[number];

// ── Credit packs (MVP: only 500 credits / $5) ─────────────────

export const creditPackSchema = z.object({
  pack: z.literal("500"),
});

export type CreditPackRequest = z.infer<typeof creditPackSchema>;

export const CREDIT_PACKS = {
  "500": { credits: 500, usdCents: 500, label: "500 credits ($5)" },
} as const;

// ── Firestore document shapes ──────────────────────────────────

export type BillingUser = {
  uid: string;
  email: string;
  balanceCredits: number;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  stripeCustomerId?: string;
  lifetimePurchasedCredits: number;
  lifetimeSpentCredits: number;
  lifetimeCostToUsCents: number;
};

export type LedgerEntry = {
  type: LedgerEntryType;
  deltaCredits: number;
  reason: string;
  toolKey?: string;
  usageId?: string;
  purchaseSessionId?: string;
  stripeEventId?: string;
  createdAt: FirebaseFirestore.Timestamp;
};

export type ToolPricing = {
  toolKey: string;
  label: string;
  active: boolean;
  creditsPerUse: number;
  costToUsCentsEstimate: number;
  updatedAt: FirebaseFirestore.Timestamp;
};

export type ToolUsage = {
  uid: string;
  toolKey: string;
  creditsCharged: number;
  costToUsCentsEstimate: number;
  status: UsageStatus;
  externalJobId?: string;
  idempotencyKey?: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
};

export type Purchase = {
  uid: string;
  email: string;
  usdCents: number;
  creditsGranted: number;
  status: "paid";
  stripeEventId: string;
  createdAt: FirebaseFirestore.Timestamp;
};

// ── API response shapes ────────────────────────────────────────

export type BillingMeResponse = {
  balanceCredits: number;
  pricing: Array<{
    toolKey: string;
    label: string;
    creditsPerUse: number;
    active: boolean;
  }>;
};

export type DebitResult = {
  usageId: string;
  creditsCharged: number;
  balanceAfter: number;
};

// ── Admin adjust schema ────────────────────────────────────────

export const adminAdjustSchema = z.object({
  deltaCredits: z.number().int(),
  reason: z.string().min(1),
});

export type AdminAdjustRequest = z.infer<typeof adminAdjustSchema>;

export const refundReasonSchema = z.object({
  reason: z.string().min(1),
});

// ── Admin pricing update schema ────────────────────────────────

export const pricingUpdateSchema = z.object({
  toolKey: z.string().min(1),
  creditsPerUse: z.number().int().min(0),
  costToUsCentsEstimate: z.number().int().min(0),
  active: z.boolean(),
});
