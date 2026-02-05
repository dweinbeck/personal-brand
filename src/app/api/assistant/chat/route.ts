export const dynamic = "force-dynamic";

import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
} from "ai";
import { headers } from "next/headers";
import { assistantModel, MODEL_CONFIG } from "@/lib/assistant/gemini";
import { buildSystemPrompt } from "@/lib/assistant/prompts";
import { checkAssistantRateLimit } from "@/lib/assistant/rate-limit";
import { logConversation } from "@/lib/assistant/logging";
import { runSafetyPipeline } from "@/lib/assistant/safety";
import { chatRequestSchema } from "@/lib/schemas/assistant";

async function getClientIp(): Promise<string> {
  const headersList = await headers();
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(request: Request) {
  // 1. Rate limit check
  const ip = await getClientIp();
  const rateLimit = checkAssistantRateLimit(ip);

  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        error:
          "Too many messages. Please wait a few minutes before trying again.",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil(rateLimit.resetMs / 1000)),
        },
      },
    );
  }

  // 2. Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON in request body." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: "Invalid request.",
        details: parsed.error.flatten().fieldErrors,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // 3. Convert UI messages to model messages
  const modelMessages = parsed.data.messages.map((msg) => ({
    role: msg.role as "user" | "assistant",
    content: (msg.parts ?? [])
      .filter((p) => p.type === "text" && p.text)
      .map((p) => p.text)
      .join(""),
  }));

  // 4. Safety pipeline — check the latest user message
  const lastUserMessage = modelMessages.findLast((m) => m.role === "user");
  if (lastUserMessage) {
    const safetyResult = runSafetyPipeline(lastUserMessage.content);
    if (!safetyResult.safe && safetyResult.refusalMessage) {
      // Fire-and-forget: log blocked conversation
      const conversationId = (parsed.data as Record<string, unknown>).id as string | undefined;
      if (conversationId) {
        logConversation(ip, conversationId, modelMessages, true);
      }
      // Return pre-approved refusal without calling Gemini
      const stream = createUIMessageStream({
        execute: ({ writer }) => {
          writer.write({
            type: "text-delta",
            delta: safetyResult.refusalMessage!,
            id: "safety-refusal",
          });
        },
      });
      return createUIMessageStreamResponse({ stream });
    }
    // Use sanitized input
    lastUserMessage.content = safetyResult.sanitizedInput;
  }

  // 5. Build system prompt with knowledge base
  const systemPrompt = buildSystemPrompt();

  // 6. Stream response from Gemini
  const conversationId = (parsed.data as Record<string, unknown>).id as string | undefined;
  const result = streamText({
    model: assistantModel,
    system: systemPrompt,
    messages: modelMessages,
    maxOutputTokens: MODEL_CONFIG.maxOutputTokens,
    temperature: MODEL_CONFIG.temperature,
    onFinish: () => {
      // Fire-and-forget: log conversation after response completes
      if (conversationId) {
        logConversation(ip, conversationId, modelMessages, false);
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
