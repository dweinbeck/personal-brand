import { db } from "@/lib/firebase";

export type AnalyticsData = {
  totalConversations: number;
  totalMessages: number;
  safetyBlockedCount: number;
  feedbackUp: number;
  feedbackDown: number;
  recentConversations: ConversationSummary[];
  topQuestions: QuestionCount[];
};

type ConversationSummary = {
  id: string;
  messageCount: number;
  safetyBlocked: boolean;
  createdAt: string;
  firstMessage: string;
};

type QuestionCount = {
  question: string;
  count: number;
};

export async function getAnalytics(
  days: number,
): Promise<AnalyticsData | null> {
  if (!db) return null;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString();

  try {
    // Fetch conversations
    const convSnap = await db
      .collection("assistant_conversations")
      .where("createdAt", ">=", cutoffStr)
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const conversations = convSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as (ConversationSummary & {
      messages: { role: string; content: string }[];
      messageCount: number;
    })[];

    // Fetch feedback
    const feedbackSnap = await db
      .collection("assistant_feedback")
      .where("createdAt", ">=", cutoffStr)
      .get();

    let feedbackUp = 0;
    let feedbackDown = 0;
    for (const doc of feedbackSnap.docs) {
      const data = doc.data();
      if (data.rating === "up") feedbackUp++;
      else feedbackDown++;
    }

    // Aggregate stats
    const totalConversations = conversations.length;
    const totalMessages = conversations.reduce(
      (sum, c) => sum + (c.messageCount ?? 0),
      0,
    );
    const safetyBlockedCount = conversations.filter(
      (c) => c.safetyBlocked,
    ).length;

    // Extract first user messages for top questions
    const questionCounts = new Map<string, number>();
    for (const conv of conversations) {
      const firstUserMsg = conv.messages?.find(
        (m: { role: string }) => m.role === "user",
      );
      if (firstUserMsg) {
        const q = firstUserMsg.content.slice(0, 100);
        questionCounts.set(q, (questionCounts.get(q) ?? 0) + 1);
      }
    }

    const topQuestions = Array.from(questionCounts.entries())
      .map(([question, count]) => ({ question, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const recentConversations = conversations.slice(0, 50).map((c) => ({
      id: c.id,
      messageCount: c.messageCount ?? 0,
      safetyBlocked: c.safetyBlocked ?? false,
      createdAt: c.createdAt ?? "",
      firstMessage:
        c.messages?.find((m: { role: string }) => m.role === "user")
          ?.content?.slice(0, 100) ?? "",
    }));

    return {
      totalConversations,
      totalMessages,
      safetyBlockedCount,
      feedbackUp,
      feedbackDown,
      recentConversations,
      topQuestions,
    };
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return null;
  }
}
