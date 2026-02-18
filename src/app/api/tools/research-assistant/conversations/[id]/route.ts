import type { Timestamp } from "firebase-admin/firestore";
import { unauthorizedResponse, verifyUser } from "@/lib/auth/user";
import { loadConversation } from "@/lib/research-assistant/conversation-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyUser(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  const { id } = await params;

  try {
    const { conversation, messages } = await loadConversation(id);

    // Ownership check — only the conversation owner can access it
    if (conversation.userId !== auth.uid) {
      return Response.json(
        { error: "You do not have access to this conversation." },
        { status: 403 },
      );
    }

    // Serialize Firestore Timestamps to ISO strings for client consumption
    const serializedConversation = {
      id: conversation.id,
      title: conversation.title,
      tier: conversation.tier,
      messageCount: conversation.messageCount,
      totalCreditsSpent: conversation.totalCreditsSpent,
      status: conversation.status,
      createdAt: (conversation.createdAt as Timestamp)?.toDate?.()
        ? (conversation.createdAt as Timestamp).toDate().toISOString()
        : new Date().toISOString(),
      updatedAt: (conversation.updatedAt as Timestamp)?.toDate?.()
        ? (conversation.updatedAt as Timestamp).toDate().toISOString()
        : new Date().toISOString(),
    };

    const serializedMessages = messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      turnNumber: msg.turnNumber,
      action: msg.action,
      usage: msg.usage,
      creditsCharged: msg.creditsCharged,
      createdAt: (msg.createdAt as Timestamp)?.toDate?.()
        ? (msg.createdAt as Timestamp).toDate().toISOString()
        : new Date().toISOString(),
    }));

    return Response.json({
      conversation: serializedConversation,
      messages: serializedMessages,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load conversation.";

    if (message.includes("not found")) {
      return Response.json(
        { error: "Conversation not found." },
        { status: 404 },
      );
    }

    console.error("loadConversation failed:", message);
    return Response.json(
      { error: "Failed to load conversation. Please try again." },
      { status: 500 },
    );
  }
}
