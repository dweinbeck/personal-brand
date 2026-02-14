import { z } from "zod/v4";
import { unauthorizedResponse, verifyUser } from "@/lib/auth/user";
import {
  debitForResearchAction,
  finalizeResearchBilling,
} from "@/lib/research-assistant/billing";
import { createParallelStream } from "@/lib/research-assistant/streaming-controller";
import type { ResearchTier } from "@/lib/research-assistant/types";

// ── Runtime config ──────────────────────────────────────────────
// Node.js runtime required for firebase-admin (no Edge Runtime).
// force-dynamic prevents Next.js from caching/statically optimizing.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Request validation ──────────────────────────────────────────

const chatRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(10000),
  tier: z.enum(["standard", "expert"]),
});

// ── POST handler ────────────────────────────────────────────────

export async function POST(request: Request) {
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

  const { prompt, tier } = parsed.data;

  // 3. Credit deduction (two-phase: PENDING now, finalize after stream)
  const idempotencyKey = crypto.randomUUID();
  let usageId: string;

  try {
    const debit = await debitForResearchAction({
      userId: auth.uid,
      email: auth.email,
      action: "prompt",
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

    console.error("Billing debit failed:", error);
    return Response.json(
      { error: "Billing error. Please try again." },
      { status: 500 },
    );
  }

  // 4. Create parallel SSE stream with billing finalization callback
  const readable = createParallelStream(tier as ResearchTier, prompt, {
    onComplete: (status) => {
      finalizeResearchBilling({
        usageId,
        status: status === "success" ? "SUCCESS" : "FAILED",
      }).catch((err) => console.error("Billing finalization failed:", err));
    },
  });

  // 5. Return SSE response immediately (non-blocking)
  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
