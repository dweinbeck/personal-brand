// ── Conversation Store ──────────────────────────────────────────
// Firestore CRUD for research_conversations collection.
// Uses transactions for all multi-document writes to ensure atomicity.
// Follows the same db import pattern as billing/firestore.ts.

import type { Timestamp } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase";
import type {
  ConversationDoc,
  ConversationSummary,
  MessageDoc,
  ResearchTier,
} from "./types";

const COLLECTION = "research_conversations";
const MESSAGES_SUBCOLLECTION = "messages";

/**
 * Creates a new conversation with the first user message.
 * Uses a transaction for atomic conversation doc + message creation.
 * Returns the auto-generated conversation document ID.
 */
export async function createConversation(
  userId: string,
  prompt: string,
  tier: ResearchTier,
): Promise<string> {
  if (!db) throw new Error("Firestore not available");

  const convRef = db.collection(COLLECTION).doc();
  const messageRef = convRef.collection(MESSAGES_SUBCOLLECTION).doc();

  await db.runTransaction(async (tx) => {
    tx.set(convRef, {
      userId,
      tier,
      title: prompt.slice(0, 100),
      messageCount: 1,
      totalCreditsSpent: 0,
      status: "active",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    tx.set(messageRef, {
      role: "user",
      content: prompt,
      turnNumber: 0,
      action: "prompt",
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return convRef.id;
}

/**
 * Loads a conversation document and all its messages ordered by turnNumber.
 * Throws if the conversation does not exist.
 */
export async function loadConversation(conversationId: string): Promise<{
  conversation: ConversationDoc & { id: string };
  messages: (MessageDoc & { id: string })[];
}> {
  if (!db) throw new Error("Firestore not available");

  const convRef = db.collection(COLLECTION).doc(conversationId);
  const convSnap = await convRef.get();

  if (!convSnap.exists) {
    throw new Error(`Conversation ${conversationId} not found`);
  }

  const messagesSnap = await convRef
    .collection(MESSAGES_SUBCOLLECTION)
    .orderBy("turnNumber", "asc")
    .get();

  const messages = messagesSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as MessageDoc),
  }));

  return {
    conversation: {
      id: convSnap.id,
      ...(convSnap.data() as ConversationDoc),
    },
    messages,
  };
}

/**
 * Appends messages to an existing conversation.
 * Uses a transaction to atomically add messages and update conversation metadata.
 */
export async function appendMessages(
  conversationId: string,
  messages: Omit<MessageDoc, "createdAt">[],
  creditsCharged: number,
): Promise<void> {
  if (!db) throw new Error("Firestore not available");

  const convRef = db.collection(COLLECTION).doc(conversationId);

  await db.runTransaction(async (tx) => {
    for (const msg of messages) {
      const msgRef = convRef.collection(MESSAGES_SUBCOLLECTION).doc();
      tx.set(msgRef, {
        ...msg,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    tx.update(convRef, {
      messageCount: FieldValue.increment(messages.length),
      totalCreditsSpent: FieldValue.increment(creditsCharged),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

/**
 * Lists conversations for a user, ordered by most recently updated.
 * Returns serialized summaries (Timestamp → ISO string) for client consumption.
 */
export async function listConversations(
  userId: string,
  limit = 20,
): Promise<ConversationSummary[]> {
  if (!db) throw new Error("Firestore not available");

  const snap = await db
    .collection(COLLECTION)
    .where("userId", "==", userId)
    .where("status", "==", "active")
    .orderBy("updatedAt", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((doc) => {
    const data = doc.data() as ConversationDoc;
    return {
      id: doc.id,
      title: data.title,
      tier: data.tier,
      messageCount: data.messageCount,
      totalCreditsSpent: data.totalCreditsSpent,
      updatedAt: (data.updatedAt as Timestamp)?.toDate?.()
        ? (data.updatedAt as Timestamp).toDate().toISOString()
        : new Date().toISOString(),
    };
  });
}
