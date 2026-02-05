import { createHash } from "node:crypto";
import { db } from "@/lib/firebase";

type ConversationLog = {
  hashedIp: string;
  conversationId: string;
  messages: { role: string; content: string }[];
  messageCount: number;
  safetyBlocked: boolean;
  createdAt: string;
  updatedAt: string;
};

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

export async function logConversation(
  ip: string,
  conversationId: string,
  messages: { role: string; content: string }[],
  safetyBlocked: boolean,
): Promise<void> {
  if (!db) return;

  try {
    const hashedIp = hashIp(ip);
    const log: ConversationLog = {
      hashedIp,
      conversationId,
      messages,
      messageCount: messages.length,
      safetyBlocked,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db
      .collection("assistant_conversations")
      .doc(conversationId)
      .set(log, { merge: true });
  } catch (error) {
    console.error("Failed to log conversation:", error);
  }
}

export async function logFeedback(
  conversationId: string,
  messageId: string,
  rating: "up" | "down",
  reason?: string,
): Promise<void> {
  if (!db) return;

  try {
    await db.collection("assistant_feedback").add({
      conversationId,
      messageId,
      rating,
      reason: reason ?? null,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to log feedback:", error);
  }
}
