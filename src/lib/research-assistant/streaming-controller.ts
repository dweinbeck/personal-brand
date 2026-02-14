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

import { SSE_EVENTS } from "./config";
import { createTierStreams, type ModelStreamResult } from "./model-client";
import type { ResearchTier } from "./types";

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
      encoder.encode(
        formatSSEEvent(`${providerEventName}-done`, { usage }),
      ),
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

  // Start both model streams in parallel
  const { gemini: geminiResult, openai: openaiResult } = createTierStreams(
    tier,
    prompt,
    options?.abortSignal,
  );

  // Fire and forget — stream processing is async
  Promise.all([
    pipeModelStream(geminiResult, SSE_EVENTS.GEMINI, writer, encoder),
    pipeModelStream(openaiResult, SSE_EVENTS.OPENAI, writer, encoder),
  ])
    .then(async () => {
      await writer.write(
        encoder.encode(formatSSEEvent(SSE_EVENTS.COMPLETE, {})),
      );
      await writer.close();
      options?.onComplete?.("success");
    })
    .catch(async (error) => {
      // Safety net — should not happen due to per-stream try/catch
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
    });

  return readable;
}
