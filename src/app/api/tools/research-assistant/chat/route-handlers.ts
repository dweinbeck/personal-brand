// ── Route Handlers for Research Assistant Chat ──────────────────
// Extracted from route.ts to keep files under 300 lines.
// Each handler receives validated + authenticated context and returns
// a ReadableStream<Uint8Array> for the SSE response.

import { finalizeResearchBilling } from "@/lib/research-assistant/billing";
import { getCreditCost, SSE_EVENTS } from "@/lib/research-assistant/config";
import {
  appendMessages,
  createConversation,
  loadConversation,
} from "@/lib/research-assistant/conversation-store";
import {
  createFollowUpStream,
  createParallelStream,
  createReconsiderStream,
  formatSSEEvent,
} from "@/lib/research-assistant/streaming-controller";
import type {
  BillingAction,
  MessageDoc,
  ResearchTier,
} from "@/lib/research-assistant/types";
import { logResearchUsage } from "@/lib/research-assistant/usage-logger";

// ── Shared types ────────────────────────────────────────────────

export type HandlerContext = {
  userId: string;
  email: string;
  prompt: string;
  tier: ResearchTier;
  action: BillingAction;
  conversationId?: string;
  usageId: string;
  startTime: number;
  logger: {
    info: (message: string, extra?: Record<string, unknown>) => void;
    warn: (message: string, extra?: Record<string, unknown>) => void;
    error: (message: string, extra?: Record<string, unknown>) => void;
  };
};

// ── Prepend conversation-id SSE event ───────────────────────────

function prependConversationId(
  conversationId: string,
  stream: ReadableStream<Uint8Array>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const idEvent = formatSSEEvent(SSE_EVENTS.CONVERSATION_ID, {
    id: conversationId,
  });
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();

  (async () => {
    await writer.write(encoder.encode(idEvent));
    const reader = stream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await writer.write(value);
      }
      await writer.close();
    } catch {
      try {
        await writer.close();
      } catch {
        // Writer may already be closed
      }
    }
  })();

  return readable;
}

// ── Shared billing finalization helper ──────────────────────────

function finalizeBillingAndLog(
  ctx: HandlerContext,
  status: "success" | "failed",
): void {
  const latencyMs = Date.now() - ctx.startTime;

  ctx.logger.info("Research streaming completed", {
    userId: ctx.userId,
    tier: ctx.tier,
    action: ctx.action,
    status,
    latencyMs,
  });

  logResearchUsage({
    userId: ctx.userId,
    tier: ctx.tier,
    action: ctx.action,
    promptLength: ctx.prompt.length,
    geminiLatencyMs: latencyMs,
    openaiLatencyMs: latencyMs,
    geminiTokens: null,
    openaiTokens: null,
    geminiStatus: status === "success" ? "success" : "error",
    openaiStatus: status === "success" ? "success" : "error",
    creditsCharged: getCreditCost(ctx.action, ctx.tier),
  });

  finalizeResearchBilling({
    usageId: ctx.usageId,
    status: status === "success" ? "SUCCESS" : "FAILED",
  }).catch((err) =>
    ctx.logger.error("Billing finalization failed", {
      userId: ctx.userId,
      usageId: ctx.usageId,
      errorMessage: err instanceof Error ? err.message : String(err),
    }),
  );
}

// ── handlePromptAction ──────────────────────────────────────────

export async function handlePromptAction(
  ctx: HandlerContext,
): Promise<ReadableStream<Uint8Array>> {
  const conversationId = await createConversation(
    ctx.userId,
    ctx.prompt,
    ctx.tier,
  );

  const stream = createParallelStream(ctx.tier, ctx.prompt, {
    onComplete: (status) => {
      finalizeBillingAndLog(ctx, status);
    },
  });

  return prependConversationId(conversationId, stream);
}

// ── handleFollowUpAction ────────────────────────────────────────

export async function handleFollowUpAction(
  ctx: HandlerContext & { conversationId: string },
): Promise<ReadableStream<Uint8Array> | Response> {
  const { conversation, messages } = await loadConversation(ctx.conversationId);

  if (conversation.userId !== ctx.userId) {
    return Response.json(
      { error: "You do not own this conversation." },
      { status: 403 },
    );
  }

  // Determine the next turn number from the loaded messages
  const maxTurn = messages.reduce((max, m) => Math.max(max, m.turnNumber), 0);
  const nextTurn = maxTurn + 1;

  // Append the user follow-up message to the conversation
  await appendMessages(
    ctx.conversationId,
    [
      {
        role: "user",
        content: ctx.prompt,
        turnNumber: nextTurn,
        action: "follow-up",
      },
    ],
    0, // credits tracked on finalization
  );

  const stream = createFollowUpStream({
    tier: ctx.tier,
    messages: [
      ...messages,
      {
        role: "user",
        content: ctx.prompt,
        turnNumber: nextTurn,
        action: "follow-up",
      } as MessageDoc,
    ],
    followUpPrompt: ctx.prompt,
    onComplete: ({ geminiText, openaiText }) => {
      appendMessages(
        ctx.conversationId,
        [
          {
            role: "gemini",
            content: geminiText,
            turnNumber: nextTurn,
            action: "follow-up",
          },
          {
            role: "openai",
            content: openaiText,
            turnNumber: nextTurn,
            action: "follow-up",
          },
        ],
        getCreditCost("follow-up", ctx.tier),
      ).catch((err) =>
        ctx.logger.error("Failed to append follow-up responses", {
          conversationId: ctx.conversationId,
          errorMessage: err instanceof Error ? err.message : String(err),
        }),
      );

      finalizeBillingAndLog(ctx, "success");
    },
  });

  return prependConversationId(ctx.conversationId, stream);
}

// ── handleReconsiderAction ──────────────────────────────────────

export async function handleReconsiderAction(
  ctx: HandlerContext & { conversationId: string },
): Promise<ReadableStream<Uint8Array> | Response> {
  const { conversation, messages } = await loadConversation(ctx.conversationId);

  if (conversation.userId !== ctx.userId) {
    return Response.json(
      { error: "You do not own this conversation." },
      { status: 403 },
    );
  }

  // Extract original prompt (first user message)
  const firstUserMessage = messages.find((m) => m.role === "user");
  if (!firstUserMessage) {
    return Response.json(
      { error: "No original prompt found in conversation." },
      { status: 400 },
    );
  }

  // Extract the last gemini and openai responses
  const lastGemini = [...messages].reverse().find((m) => m.role === "gemini");
  const lastOpenai = [...messages].reverse().find((m) => m.role === "openai");

  if (!lastGemini || !lastOpenai) {
    return Response.json(
      { error: "Both model responses required for reconsider." },
      { status: 400 },
    );
  }

  const maxTurn = messages.reduce((max, m) => Math.max(max, m.turnNumber), 0);
  const nextTurn = maxTurn + 1;

  const stream = createReconsiderStream({
    tier: ctx.tier,
    originalPrompt: firstUserMessage.content,
    geminiResponse: lastGemini.content,
    openaiResponse: lastOpenai.content,
    onComplete: ({ geminiText, openaiText }) => {
      appendMessages(
        ctx.conversationId,
        [
          {
            role: "gemini-reconsider",
            content: geminiText,
            turnNumber: nextTurn,
            action: "reconsider",
          },
          {
            role: "openai-reconsider",
            content: openaiText,
            turnNumber: nextTurn,
            action: "reconsider",
          },
        ],
        getCreditCost("reconsider", ctx.tier),
      ).catch((err) =>
        ctx.logger.error("Failed to append reconsider responses", {
          conversationId: ctx.conversationId,
          errorMessage: err instanceof Error ? err.message : String(err),
        }),
      );

      finalizeBillingAndLog(ctx, "success");
    },
  });

  return prependConversationId(ctx.conversationId, stream);
}
