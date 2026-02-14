// ── Research Assistant Configuration ─────────────────────────────
// Tier-to-model mapping, credit costs, and SSE event constants.
// All model IDs are verified API identifiers — not marketing names.
// No AI SDK imports here; the ModelClient (Plan 02) uses these IDs
// to construct provider instances.

import type {
  BillingAction,
  ResearchTier,
  TierConfig,
} from "./types";

// ── Tier configurations ─────────────────────────────────────────

export const TIER_CONFIGS: Record<ResearchTier, TierConfig> = {
  standard: {
    tier: "standard",
    models: [
      {
        provider: "google",
        modelId: "gemini-2.5-flash",
        displayName: "Gemini 2.5 Flash",
      },
      {
        provider: "openai",
        modelId: "gpt-5.2-chat-latest",
        displayName: "GPT-5.2 Instant",
      },
    ],
    creditCost: 10,
  },
  expert: {
    tier: "expert",
    models: [
      {
        provider: "google",
        modelId: "gemini-3-pro-preview",
        displayName: "Gemini 3 Pro",
      },
      {
        provider: "openai",
        modelId: "gpt-5.2",
        displayName: "GPT-5.2 Thinking",
      },
    ],
    creditCost: 20,
  },
};

// ── Credit costs per action and tier ────────────────────────────

export const CREDIT_COSTS: Record<
  BillingAction,
  Record<ResearchTier, number>
> = {
  prompt: { standard: 10, expert: 20 },
  reconsider: { standard: 5, expert: 10 },
  "follow-up": { standard: 5, expert: 10 },
};

// ── SSE event name constants ────────────────────────────────────
// Used by both server and client to avoid magic strings.

export const SSE_EVENTS = {
  GEMINI: "gemini",
  OPENAI: "openai",
  GEMINI_DONE: "gemini-done",
  OPENAI_DONE: "openai-done",
  GEMINI_ERROR: "gemini-error",
  OPENAI_ERROR: "openai-error",
  COMPLETE: "complete",
  ERROR: "error",
} as const;

// ── Helper functions ────────────────────────────────────────────

/** Returns the full tier configuration for a given tier. */
export function getTierConfig(tier: ResearchTier): TierConfig {
  return TIER_CONFIGS[tier];
}

/** Returns the credit cost for a specific action and tier combination. */
export function getCreditCost(
  action: BillingAction,
  tier: ResearchTier,
): number {
  return CREDIT_COSTS[action][tier];
}

/** Returns the display names of both models for a tier (for UI labels). */
export function getModelDisplayNames(
  tier: ResearchTier,
): [string, string] {
  const config = TIER_CONFIGS[tier];
  return [config.models[0].displayName, config.models[1].displayName];
}
