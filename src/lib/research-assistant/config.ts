// ── Research Assistant Configuration ─────────────────────────────
// Tier-to-model mapping, credit costs, and SSE event constants.
// All model IDs are verified API identifiers — not marketing names.
// No AI SDK imports here; the ModelClient (Plan 02) uses these IDs
// to construct provider instances.

import type { BillingAction, ResearchTier, TierConfig } from "./types";

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

// ── Streaming resilience constants ──────────────────────────────
// Per-tier timeout for AbortSignal.timeout() and heartbeat interval.

export const STREAM_TIMEOUTS: Record<ResearchTier, number> = {
  standard: 60_000,
  expert: 120_000,
};

export const HEARTBEAT_INTERVAL_MS = 15_000;

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
  HEARTBEAT: "heartbeat",
  // Phase 3: Reconsider events
  GEMINI_RECONSIDER: "gemini-reconsider",
  OPENAI_RECONSIDER: "openai-reconsider",
  GEMINI_RECONSIDER_DONE: "gemini-reconsider-done",
  OPENAI_RECONSIDER_DONE: "openai-reconsider-done",
  GEMINI_RECONSIDER_ERROR: "gemini-reconsider-error",
  OPENAI_RECONSIDER_ERROR: "openai-reconsider-error",
  // Phase 3: Conversation ID event
  CONVERSATION_ID: "conversation-id",
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
export function getModelDisplayNames(tier: ResearchTier): [string, string] {
  const config = TIER_CONFIGS[tier];
  return [config.models[0].displayName, config.models[1].displayName];
}

// ── Phase 3: Reconsider prompt template ─────────────────────────

export const SYSTEM_PROMPT =
  "You are a research assistant. Provide thorough, evidence-based answers with clear reasoning. When citing information, note the source or basis for your claims.";

export const RECONSIDER_PROMPT_TEMPLATE = (
  peerModelName: string,
  peerResponse: string,
): string =>
  [
    `Another AI model (${peerModelName}) was given the same prompt and responded differently:`,
    "",
    "---",
    peerResponse,
    "---",
    "",
    "Please reconsider your response in light of this alternative perspective:",
    "1. What key points of agreement do you see?",
    "2. Where do you disagree, and why?",
    "3. Has this alternative perspective revealed anything you missed or got wrong?",
    "4. Provide your revised response, incorporating any valuable insights from the other model.",
  ].join("\n");
