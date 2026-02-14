import { z } from "zod/v4";
import { unauthorizedResponse, verifyUser } from "@/lib/auth/user";
import {
  debitForResearchAction,
  finalizeResearchBilling,
} from "@/lib/research-assistant/billing";
import { createRequestLogger } from "@/lib/research-assistant/logger";
import type {
  BillingAction,
  ResearchTier,
} from "@/lib/research-assistant/types";
import {
  handleFollowUpAction,
  handlePromptAction,
  handleReconsiderAction,
} from "./route-handlers";

// ── Runtime config ──────────────────────────────────────────────
// Node.js runtime required for firebase-admin (no Edge Runtime).
// force-dynamic prevents Next.js from caching/statically optimizing.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Request validation ──────────────────────────────────────────

const chatRequestSchema = z
  .object({
    prompt: z.string().max(10000),
    tier: z.enum(["standard", "expert"]),
    action: z.enum(["prompt", "follow-up", "reconsider"]).default("prompt"),
    conversationId: z.string().optional(),
  })
  .refine((data) => data.action === "prompt" || data.conversationId, {
    message: "conversationId required for follow-up and reconsider actions",
  })
  .refine((data) => data.action === "reconsider" || data.prompt.length > 0, {
    message: "Prompt is required",
  });

// ── SSE response headers ────────────────────────────────────────

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
} as const;

// ── POST handler ────────────────────────────────────────────────

export async function POST(request: Request) {
  const logger = createRequestLogger(request);

  // 1. Auth verification
  const auth = await verifyUser(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  // 2. Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request.", details: z.flattenError(parsed.error) },
      { status: 400 },
    );
  }

  const { prompt, tier, action, conversationId } = parsed.data;
  const startTime = Date.now();

  // Log prompt submission (no PII: no email, no prompt content)
  logger.info("Research prompt submitted", {
    userId: auth.uid,
    tier,
    action,
    promptLength: prompt.length,
    ...(conversationId ? { conversationId } : {}),
  });

  // 3. Credit deduction (two-phase: PENDING now, finalize after stream)
  const billingAction = action as BillingAction;
  const idempotencyKey = crypto.randomUUID();
  let usageId: string;

  try {
    const debit = await debitForResearchAction({
      userId: auth.uid,
      email: auth.email,
      action: billingAction,
      tier: tier as ResearchTier,
      idempotencyKey,
    });
    usageId = debit.usageId;
  } catch (error) {
    const statusCode =
      error instanceof Error && "statusCode" in error
        ? (error as Error & { statusCode: number }).statusCode
        : 500;

    if (statusCode === 402) {
      return Response.json(
        { error: "Insufficient credits", code: "INSUFFICIENT_CREDITS" },
        { status: 402 },
      );
    }

    logger.error("Billing debit failed", {
      userId: auth.uid,
      tier,
      action,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return Response.json(
      { error: "Billing error. Please try again." },
      { status: 500 },
    );
  }

  // 4. Build handler context
  const ctx = {
    userId: auth.uid,
    email: auth.email,
    prompt,
    tier: tier as ResearchTier,
    action: billingAction,
    conversationId,
    usageId,
    startTime,
    logger,
  };

  // 5. Dispatch to action-specific handler
  try {
    let result: ReadableStream<Uint8Array> | Response;

    switch (action) {
      case "prompt":
        result = await handlePromptAction(ctx);
        break;
      case "follow-up":
        result = await handleFollowUpAction({
          ...ctx,
          conversationId: conversationId as string,
        });
        break;
      case "reconsider":
        result = await handleReconsiderAction({
          ...ctx,
          conversationId: conversationId as string,
        });
        break;
    }

    // If a handler returned a Response (e.g., 403/400), pass it through
    if (result instanceof Response) {
      // Refund credits since the action could not be performed
      finalizeResearchBilling({
        usageId,
        status: "FAILED",
      }).catch((err) =>
        logger.error("Billing refund failed after handler error", {
          userId: auth.uid,
          usageId,
          errorMessage: err instanceof Error ? err.message : String(err),
        }),
      );
      return result;
    }

    // 6. Return SSE response immediately (non-blocking)
    return new Response(result, { headers: SSE_HEADERS });
  } catch (error) {
    logger.error("Handler execution failed", {
      userId: auth.uid,
      action,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    // Refund credits on unexpected handler failure
    finalizeResearchBilling({
      usageId,
      status: "FAILED",
    }).catch((err) =>
      logger.error("Billing refund failed after handler crash", {
        userId: auth.uid,
        usageId,
        errorMessage: err instanceof Error ? err.message : String(err),
      }),
    );

    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}
