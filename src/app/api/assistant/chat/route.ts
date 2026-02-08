export const dynamic = "force-dynamic";

import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { askFastApi, FastApiError } from "@/lib/assistant/fastapi-client";
import { chatRequestSchema } from "@/lib/schemas/assistant";

export async function POST(request: Request) {
  // 1. Parse and validate request body (same schema as before)
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

  // 2. Extract the last user message text from UIMessage parts
  const lastUserMsg = parsed.data.messages.findLast((m) => m.role === "user");
  const question =
    lastUserMsg?.parts
      ?.filter((p) => p.type === "text" && p.text)
      .map((p) => p.text)
      .join("") ?? "";

  if (!question) {
    return new Response(JSON.stringify({ error: "No question provided." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. Call FastAPI via the typed client
  try {
    const data = await askFastApi(question);

    // 4. Build response text with citations appended as markdown
    let text = data.answer;
    if (data.citations.length > 0) {
      text += "\n\n---\n**Sources:**\n";
      for (const cite of data.citations) {
        text += `- ${cite.source}\n`;
      }
    }

    // 5. Return as UIMessageStream (same protocol useChat expects)
    const stream = createUIMessageStream({
      execute: ({ writer }) => {
        writer.write({
          type: "text-delta",
          delta: text,
          id: "fastapi-response",
        });
      },
    });
    return createUIMessageStreamResponse({ stream });
  } catch (err) {
    // 6. Map FastApiError to user-friendly responses
    if (err instanceof FastApiError) {
      let userMessage: string;
      if (err.isTimeout) {
        userMessage =
          "The assistant is taking too long to respond. Please try again.";
      } else if (err.status === 429) {
        userMessage = "Too many messages. Please wait a moment.";
      } else if (err.status === 503) {
        userMessage =
          "The assistant is currently unavailable. Please try again later.";
      } else {
        userMessage = "Something went wrong. Please try again.";
      }

      return new Response(JSON.stringify({ error: userMessage }), {
        status: err.status >= 500 ? 502 : err.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Unexpected error
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
