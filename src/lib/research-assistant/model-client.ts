// ── Research Assistant Model Client ──────────────────────────────
// Wraps AI SDK v6 providers (OpenAI, Google) into a unified streaming
// interface. Uses config from ./config.ts for model IDs and tier mapping.
// API keys are read from environment variables automatically by the
// AI SDK providers — never referenced in code.

import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { streamText } from "ai";

import { TIER_CONFIGS } from "./config";
import type { ModelConfig, ResearchTier } from "./types";

// ── Type for streamText result ──────────────────────────────────

/** The return type of `streamText()` without tools or structured output. */
export type ModelStreamResult = ReturnType<typeof streamText>;

// ── Provider factory ────────────────────────────────────────────

/**
 * Creates an AI SDK LanguageModel from a ModelConfig.
 * The AI SDK providers read API keys from environment variables:
 *   - @ai-sdk/openai reads OPENAI_API_KEY
 *   - @ai-sdk/google reads GOOGLE_GENERATIVE_AI_API_KEY
 */
export function createProvider(config: ModelConfig): LanguageModel {
  switch (config.provider) {
    case "openai":
      return openai(config.modelId);
    case "google":
      return google(config.modelId);
    default:
      throw new Error(
        `Unknown model provider: ${config.provider satisfies never}`,
      );
  }
}

// ── Stream factory ──────────────────────────────────────────────

/**
 * Creates a streaming text result for a single model.
 * The returned object has `.textStream` (async iterable) and `.usage` (promise).
 *
 * NOTE: `streamText()` is NOT awaited — it returns immediately.
 * The actual streaming happens asynchronously when the caller consumes textStream.
 */
export function createModelStream(
  config: ModelConfig,
  prompt: string,
  abortSignal?: AbortSignal,
): ModelStreamResult {
  const model = createProvider(config);
  return streamText({ model, prompt, abortSignal });
}

// ── Retry logic for 429 rate limits ──────────────────────────────

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

function is429Error(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes("429") || error.message.includes("rate limit")
    );
  }
  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wraps createModelStream with retry logic for 429 rate limit errors.
 * Retries up to MAX_RETRIES times with exponential backoff + jitter.
 * Only retries errors thrown BEFORE streaming starts (i.e., from streamText()
 * itself). Mid-stream errors are handled by pipeModelStream's try/catch.
 */
export async function createModelStreamWithRetry(
  config: ModelConfig,
  prompt: string,
  abortSignal?: AbortSignal,
): Promise<ModelStreamResult> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return createModelStream(config, prompt, abortSignal);
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES && is429Error(error)) {
        const jitter = Math.random() * 500;
        await delay(BASE_DELAY_MS * 2 ** attempt + jitter);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

// ── Tier stream factory ─────────────────────────────────────────

export type TierStreams = {
  gemini: ModelStreamResult;
  openai: ModelStreamResult;
};

/**
 * Creates parallel streaming results for both models in a tier.
 * Returns named streams (gemini/openai) so the streaming controller
 * can tag SSE events with the correct provider name.
 *
 * Uses createModelStreamWithRetry to handle 429 rate limit errors
 * with exponential backoff before any tokens are streamed.
 */
export async function createTierStreams(
  tier: ResearchTier,
  prompt: string,
  abortSignal?: AbortSignal,
): Promise<TierStreams> {
  const config = TIER_CONFIGS[tier];

  // Identify which model is Google (gemini) and which is OpenAI
  const googleModel = config.models.find(
    (m): m is ModelConfig & { provider: "google" } => m.provider === "google",
  );
  const openaiModel = config.models.find(
    (m): m is ModelConfig & { provider: "openai" } => m.provider === "openai",
  );

  if (!googleModel || !openaiModel) {
    throw new Error(
      `Tier "${tier}" must have exactly one Google and one OpenAI model.`,
    );
  }

  // Both retry calls run in parallel — if one gets 429'd,
  // it retries independently without blocking the other.
  const [gemini, openaiStream] = await Promise.all([
    createModelStreamWithRetry(googleModel, prompt, abortSignal),
    createModelStreamWithRetry(openaiModel, prompt, abortSignal),
  ]);

  return { gemini, openai: openaiStream };
}
