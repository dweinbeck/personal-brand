import { logFeedback } from "@/lib/assistant/logging";
import { z } from "zod";

const feedbackSchema = z.object({
  conversationId: z.string(),
  messageId: z.string(),
  rating: z.enum(["up", "down"]),
  reason: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Invalid feedback data." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  await logFeedback(
    parsed.data.conversationId,
    parsed.data.messageId,
    parsed.data.rating,
    parsed.data.reason,
  );

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
