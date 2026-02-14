// ── Research Assistant Billing Helpers ───────────────────────────
// Wraps the existing billing system's debitForToolUse / markUsageSucceeded /
// refundUsage with research-assistant-specific logic (tiered, per-action).
//
// The composite tool key pattern (research_assistant_{action}_{tier}) maps
// each action + tier combination to a separate billing_tool_pricing entry
// so the existing infrastructure handles credit lookup and debit atomically.

import {
  debitForToolUse,
  markUsageSucceeded,
  refundUsage,
} from "@/lib/billing/firestore";
import type { BillingAction, ResearchTier } from "./types";

// ── Tool key construction ───────────────────────────────────────

/**
 * Builds the composite tool key used in billing_tool_pricing.
 * Example: "research_assistant_prompt_standard"
 */
export function getResearchToolKey(
  action: BillingAction,
  tier: ResearchTier,
): string {
  const actionSegment = action === "follow-up" ? "follow_up" : action;
  return `research_assistant_${actionSegment}_${tier}`;
}

// ── Debit for research action ───────────────────────────────────

/**
 * Debits the correct credit amount for a research assistant action.
 *
 * Uses the existing two-phase billing pattern:
 *   1. debitForToolUse() creates a PENDING usage record and debits credits.
 *   2. The caller should later call finalizeResearchBilling() to mark
 *      the usage as SUCCESS or FAILED (with automatic refund on FAILED).
 *
 * @returns The usageId needed for finalization.
 * @throws Error with statusCode 402 if insufficient credits.
 * @throws Error if the tool key is not found or inactive.
 */
export async function debitForResearchAction({
  userId,
  email,
  action,
  tier,
  idempotencyKey,
}: {
  userId: string;
  email: string;
  action: BillingAction;
  tier: ResearchTier;
  idempotencyKey: string;
}): Promise<{ usageId: string; creditsCharged: number; balanceAfter: number }> {
  const toolKey = getResearchToolKey(action, tier);

  return debitForToolUse({
    uid: userId,
    email,
    toolKey,
    idempotencyKey,
  });
}

// ── Finalize research billing ───────────────────────────────────

/**
 * Marks a research assistant billing transaction as completed.
 *
 * - SUCCESS: usage record updated to "succeeded", credits stay debited.
 * - FAILED: usage record refunded, credits returned to user balance.
 *
 * Safe to call multiple times — refundUsage is idempotent.
 */
export async function finalizeResearchBilling({
  usageId,
  status,
}: {
  usageId: string;
  status: "SUCCESS" | "FAILED";
}): Promise<void> {
  if (status === "SUCCESS") {
    await markUsageSucceeded({ usageId });
  } else {
    await refundUsage({
      usageId,
      reason: "Research assistant streaming failed — credits refunded.",
    });
  }
}
