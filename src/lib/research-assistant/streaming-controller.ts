// ── Research Assistant Streaming Controller ──────────────────────
// Merges two parallel model streams into a single multiplexed SSE
// response using TransformStream. Each model's chunks are tagged
// with provider-specific event names so the client can route them
// to the correct UI column.
//
// Key behaviors:
// - Both models stream simultaneously (parallel, not sequential)
// - Chunks interleave naturally based on arrival order
// - One model failing sends an error event for that model only
// - The `complete` event fires only after BOTH models finish
// - Writer is closed exactly once, after all processing

import type { ModelMessage } from "ai";
import {
  getModelDisplayNames,
  HEARTBEAT_INTERVAL_MS,
  RECONSIDER_PROMPT_TEMPLATE,
  SSE_EVENTS,
  STREAM_TIMEOUTS,
  SYSTEM_PROMPT,
} from "./config";
import {
  createTierStreams,
  createTierStreamsWithMessages,
  type ModelStreamResult,
} from "./model-client";
import { checkTokenBudget } from "./token-budget";
import type { MessageDoc, MessageRole, ResearchTier } from "./types";

// ── SSE formatting ──────────────────────────────────────────────

/**
 * Formats data as a Server-Sent Event string.
 * Follows the SSE spec: `event: <name>\ndata: <json>\n\n`
 */
export function formatSSEEvent(event: string, data: object): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// ── Single stream piper ─────────────────────────────────────────

/**
 * Pipes a single model's text stream into the shared SSE writer.
 * Wrapped entirely in try/catch so one model's failure never
 * propagates to the other (NFR-2.1).
 */
async function pipeModelStream(
  result: ModelStreamResult,
  providerEventName: string,
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
): Promise<void> {
  try {
    for await (const chunk of result.textStream) {
      await writer.write(
        encoder.encode(formatSSEEvent(providerEventName, { text: chunk })),
      );
    }

    // Stream finished successfully — send usage data
    const usage = await result.usage;
    await writer.write(
      encoder.encode(formatSSEEvent(`${providerEventName}-done`, { usage })),
    );
  } catch (error) {
    // Model error — write error event for this model only
    await writer.write(
      encoder.encode(
        formatSSEEvent(`${providerEventName}-error`, {
          message: error instanceof Error ? error.message : String(error),
        }),
      ),
    );
  }
}

// ── Parallel stream controller ──────────────────────────────────

/**
 * Creates a multiplexed SSE ReadableStream from two parallel model streams.
 *
 * CRITICAL: Returns the readable stream immediately. The actual streaming
 * happens asynchronously via fire-and-forget Promise.all. This prevents
 * Next.js from buffering the entire response before sending.
 *
 * @param onComplete - Optional callback invoked when both streams finish.
 *   Receives 'success' if at least one model succeeded, 'failed' if
 *   the entire stream errored out. Used for billing finalization.
 */
export function createParallelStream(
  tier: ResearchTier,
  prompt: string,
  options?: {
    abortSignal?: AbortSignal;
    onComplete?: (status: "success" | "failed") => void;
  },
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();

  // Combine user abort signal with per-tier timeout
  const timeoutSignal = AbortSignal.timeout(STREAM_TIMEOUTS[tier]);
  const combinedSignal = options?.abortSignal
    ? AbortSignal.any([options.abortSignal, timeoutSignal])
    : timeoutSignal;

  // Heartbeat — keeps SSE connection alive through proxies/load balancers
  const heartbeatInterval = setInterval(async () => {
    try {
      await writer.write(
        encoder.encode(
          formatSSEEvent(SSE_EVENTS.HEARTBEAT, { ts: Date.now() }),
        ),
      );
    } catch {
      clearInterval(heartbeatInterval);
    }
  }, HEARTBEAT_INTERVAL_MS);

  // Clean up heartbeat on abort
  combinedSignal.addEventListener(
    "abort",
    () => clearInterval(heartbeatInterval),
    { once: true },
  );

  // Fire and forget — createTierStreams is async (retry logic), so
  // the entire pipeline runs inside this async IIFE.
  (async () => {
    try {
      const { gemini: geminiResult, openai: openaiResult } =
        await createTierStreams(tier, prompt, combinedSignal);

      await Promise.all([
        pipeModelStream(geminiResult, SSE_EVENTS.GEMINI, writer, encoder),
        pipeModelStream(openaiResult, SSE_EVENTS.OPENAI, writer, encoder),
      ]);

      clearInterval(heartbeatInterval);
      await writer.write(
        encoder.encode(formatSSEEvent(SSE_EVENTS.COMPLETE, {})),
      );
      await writer.close();
      options?.onComplete?.("success");
    } catch (error) {
      clearInterval(heartbeatInterval);
      // Handles both createTierStreams failure (all retries exhausted)
      // and unexpected pipeModelStream errors (safety net)
      try {
        await writer.write(
          encoder.encode(
            formatSSEEvent(SSE_EVENTS.ERROR, { message: String(error) }),
          ),
        );
        await writer.close();
      } catch {
        // Writer may already be closed if abort was triggered
      }
      options?.onComplete?.("failed");
    }
  })();

  return readable;
}

// ── Phase 3: Message conversion helpers ─────────────────────────

/**
 * Converts stored MessageDoc[] to AI SDK ModelMessage[] for a specific model.
 * Filters to only include user messages + the target model's assistant responses.
 */
function buildConversationMessages(
  messages: MessageDoc[],
  targetModel: "gemini" | "openai",
): ModelMessage[] {
  const targetRoles: MessageRole[] = [
    targetModel,
    `${targetModel}-reconsider` as MessageRole,
  ];

  return messages
    .filter((m) => m.role === "user" || targetRoles.includes(m.role))
    .map((m) => ({
      role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
      content: m.content,
    }));
}

/**
 * Builds the message array for a reconsider request.
 * Structure: original prompt → own response → peer context prompt.
 */
function buildReconsiderMessages(
  originalPrompt: string,
  thisModelResponse: string,
  peerModelResponse: string,
  peerModelName: string,
): ModelMessage[] {
  return [
    { role: "user" as const, content: originalPrompt },
    { role: "assistant" as const, content: thisModelResponse },
    {
      role: "user" as const,
      content: RECONSIDER_PROMPT_TEMPLATE(peerModelName, peerModelResponse),
    },
  ];
}

// ── Phase 3: Follow-up stream ───────────────────────────────────

/**
 * Creates a multiplexed SSE stream for follow-up questions.
 * Builds per-model conversation history and appends the new follow-up prompt.
 * Uses standard SSE event names since follow-up responses display in the same panels.
 */
export function createFollowUpStream(options: {
  tier: ResearchTier;
  messages: MessageDoc[];
  followUpPrompt: string;
  abortSignal?: AbortSignal;
  onComplete?: (results: { geminiText: string; openaiText: string }) => void;
}): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();

  const geminiMessages = buildConversationMessages(options.messages, "gemini");
  geminiMessages.push({ role: "user", content: options.followUpPrompt });

  const openaiMessages = buildConversationMessages(options.messages, "openai");
  openaiMessages.push({ role: "user", content: options.followUpPrompt });

  // Pre-flight token budget check
  const gemBudget = checkTokenBudget(geminiMessages, options.tier);
  const oaBudget = checkTokenBudget(openaiMessages, options.tier);

  if (!gemBudget.withinBudget || !oaBudget.withinBudget) {
    (async () => {
      await writer.write(
        encoder.encode(
          formatSSEEvent(SSE_EVENTS.ERROR, {
            message:
              "Conversation is too long — token budget exceeded. Start a new conversation.",
          }),
        ),
      );
      await writer.close();
    })();
    return readable;
  }

  const timeoutSignal = AbortSignal.timeout(STREAM_TIMEOUTS[options.tier]);
  const combinedSignal = options.abortSignal
    ? AbortSignal.any([options.abortSignal, timeoutSignal])
    : timeoutSignal;

  const heartbeatInterval = setInterval(async () => {
    try {
      await writer.write(
        encoder.encode(
          formatSSEEvent(SSE_EVENTS.HEARTBEAT, { ts: Date.now() }),
        ),
      );
    } catch {
      clearInterval(heartbeatInterval);
    }
  }, HEARTBEAT_INTERVAL_MS);

  combinedSignal.addEventListener(
    "abort",
    () => clearInterval(heartbeatInterval),
    { once: true },
  );

  (async () => {
    try {
      const { gemini: geminiResult, openai: openaiResult } =
        await createTierStreamsWithMessages(options.tier, {
          system: SYSTEM_PROMPT,
          geminiMessages,
          openaiMessages,
          abortSignal: combinedSignal,
        });

      let geminiText = "";
      let openaiText = "";

      await Promise.all([
        pipeModelStreamCollecting(
          geminiResult,
          SSE_EVENTS.GEMINI,
          writer,
          encoder,
          (t) => {
            geminiText += t;
          },
        ),
        pipeModelStreamCollecting(
          openaiResult,
          SSE_EVENTS.OPENAI,
          writer,
          encoder,
          (t) => {
            openaiText += t;
          },
        ),
      ]);

      clearInterval(heartbeatInterval);
      await writer.write(
        encoder.encode(formatSSEEvent(SSE_EVENTS.COMPLETE, {})),
      );
      await writer.close();
      options.onComplete?.({ geminiText, openaiText });
    } catch (error) {
      clearInterval(heartbeatInterval);
      try {
        await writer.write(
          encoder.encode(
            formatSSEEvent(SSE_EVENTS.ERROR, { message: String(error) }),
          ),
        );
        await writer.close();
      } catch {
        // Writer may already be closed
      }
    }
  })();

  return readable;
}

// ── Phase 3: Reconsider stream ──────────────────────────────────

/**
 * Creates a multiplexed SSE stream for the Reconsider flow.
 * Each model sees the other's response and provides a revised answer.
 * Uses reconsider-specific SSE event names for client-side routing.
 */
export function createReconsiderStream(options: {
  tier: ResearchTier;
  originalPrompt: string;
  geminiResponse: string;
  openaiResponse: string;
  abortSignal?: AbortSignal;
  onComplete?: (results: { geminiText: string; openaiText: string }) => void;
}): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();

  const [geminiName, openaiName] = getModelDisplayNames(options.tier);

  // Gemini sees OpenAI's response as peer context
  const geminiMessages = buildReconsiderMessages(
    options.originalPrompt,
    options.geminiResponse,
    options.openaiResponse,
    openaiName,
  );

  // OpenAI sees Gemini's response as peer context
  const openaiMessages = buildReconsiderMessages(
    options.originalPrompt,
    options.openaiResponse,
    options.geminiResponse,
    geminiName,
  );

  // Pre-flight token budget check on both message arrays
  const gemBudget = checkTokenBudget(geminiMessages, options.tier);
  const oaBudget = checkTokenBudget(openaiMessages, options.tier);

  if (!gemBudget.withinBudget || !oaBudget.withinBudget) {
    (async () => {
      await writer.write(
        encoder.encode(
          formatSSEEvent(SSE_EVENTS.ERROR, {
            message:
              "Responses are too long for reconsider — token budget exceeded.",
          }),
        ),
      );
      await writer.close();
    })();
    return readable;
  }

  const timeoutSignal = AbortSignal.timeout(STREAM_TIMEOUTS[options.tier]);
  const combinedSignal = options.abortSignal
    ? AbortSignal.any([options.abortSignal, timeoutSignal])
    : timeoutSignal;

  const heartbeatInterval = setInterval(async () => {
    try {
      await writer.write(
        encoder.encode(
          formatSSEEvent(SSE_EVENTS.HEARTBEAT, { ts: Date.now() }),
        ),
      );
    } catch {
      clearInterval(heartbeatInterval);
    }
  }, HEARTBEAT_INTERVAL_MS);

  combinedSignal.addEventListener(
    "abort",
    () => clearInterval(heartbeatInterval),
    { once: true },
  );

  (async () => {
    try {
      const { gemini: geminiResult, openai: openaiResult } =
        await createTierStreamsWithMessages(options.tier, {
          system: SYSTEM_PROMPT,
          geminiMessages,
          openaiMessages,
          abortSignal: combinedSignal,
        });

      let geminiText = "";
      let openaiText = "";

      await Promise.all([
        pipeModelStreamCollecting(
          geminiResult,
          SSE_EVENTS.GEMINI_RECONSIDER,
          writer,
          encoder,
          (t) => {
            geminiText += t;
          },
        ),
        pipeModelStreamCollecting(
          openaiResult,
          SSE_EVENTS.OPENAI_RECONSIDER,
          writer,
          encoder,
          (t) => {
            openaiText += t;
          },
        ),
      ]);

      clearInterval(heartbeatInterval);
      await writer.write(
        encoder.encode(formatSSEEvent(SSE_EVENTS.COMPLETE, {})),
      );
      await writer.close();
      options.onComplete?.({ geminiText, openaiText });
    } catch (error) {
      clearInterval(heartbeatInterval);
      try {
        await writer.write(
          encoder.encode(
            formatSSEEvent(SSE_EVENTS.ERROR, { message: String(error) }),
          ),
        );
        await writer.close();
      } catch {
        // Writer may already be closed
      }
    }
  })();

  return readable;
}

// ── Text-collecting pipeModelStream variant ─────────────────────

/**
 * Like pipeModelStream but also collects text via onChunk callback.
 * Used by follow-up and reconsider to capture model output for persistence.
 */
async function pipeModelStreamCollecting(
  result: ModelStreamResult,
  providerEventName: string,
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
  onChunk: (text: string) => void,
): Promise<void> {
  try {
    for await (const chunk of result.textStream) {
      onChunk(chunk);
      await writer.write(
        encoder.encode(formatSSEEvent(providerEventName, { text: chunk })),
      );
    }

    const usage = await result.usage;
    await writer.write(
      encoder.encode(formatSSEEvent(`${providerEventName}-done`, { usage })),
    );
  } catch (error) {
    await writer.write(
      encoder.encode(
        formatSSEEvent(`${providerEventName}-error`, {
          message: error instanceof Error ? error.message : String(error),
        }),
      ),
    );
  }
}
