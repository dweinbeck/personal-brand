import { unauthorizedResponse, verifyUser } from "@/lib/auth/user";
import { listConversations } from "@/lib/research-assistant/conversation-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await verifyUser(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  try {
    const conversations = await listConversations(auth.uid, 20);
    return Response.json({ conversations });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load conversations.";
    const isIndexError =
      message.includes("requires an index") ||
      message.includes("FAILED_PRECONDITION");
    const status = isIndexError ? 503 : 500;
    const userMessage = isIndexError
      ? "Conversation history is temporarily unavailable. The database index is being created."
      : "Failed to load conversations. Please try again.";
    console.error("listConversations failed:", message);
    return Response.json({ error: userMessage }, { status });
  }
}
