// ── Research Usage Logger ────────────────────────────────────────
// Writes usage log documents to the research_usage_logs Firestore
// collection for analytics and the Phase 4 admin dashboard.
//
// This module NEVER throws. Usage logging failures must not affect
// the user request. All errors are caught and logged to stderr.

import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase";
import type { BillingAction, ResearchTier } from "./types";

// ── Types ───────────────────────────────────────────────────────

export interface UsageLogEntry {
  userId: string;
  tier: ResearchTier;
  action: BillingAction;
  promptLength: number;
  geminiLatencyMs: number | null;
  openaiLatencyMs: number | null;
  geminiTokens: { prompt: number; completion: number } | null;
  openaiTokens: { prompt: number; completion: number } | null;
  geminiStatus: "success" | "error";
  openaiStatus: "success" | "error";
  creditsCharged: number;
}

// ── Logging function ────────────────────────────────────────────

/**
 * Writes a usage log entry to the research_usage_logs Firestore collection.
 *
 * Gracefully degrades if Firestore is unavailable (db is undefined when
 * Firebase credentials are missing). Never throws -- all errors are caught
 * and logged to stderr as a fallback.
 */
export async function logResearchUsage(entry: UsageLogEntry): Promise<void> {
  try {
    if (!db) return; // Graceful degradation: no Firestore available

    await db.collection("research_usage_logs").add({
      ...entry,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    // Log failure but don't throw -- usage logging should never break the request
    console.error("Failed to write usage log:", error);
  }
}
