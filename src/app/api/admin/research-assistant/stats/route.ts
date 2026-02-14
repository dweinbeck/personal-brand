import { unauthorizedResponse, verifyAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/firebase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  if (!db) {
    return Response.json({ error: "Firestore unavailable." }, { status: 503 });
  }

  try {
    const snapshot = await db
      .collection("research_usage_logs")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const logs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? null,
    }));

    const stats = {
      totalRequests: logs.length,
      byTier: { standard: 0, expert: 0 },
      byAction: { prompt: 0, "follow-up": 0, reconsider: 0 },
      totalCreditsSpent: 0,
    };

    for (const log of logs) {
      const tier = (log as Record<string, unknown>).tier as string;
      const action = (log as Record<string, unknown>).action as string;
      const credits = (log as Record<string, unknown>).creditsCharged as number;

      if (tier === "standard") stats.byTier.standard++;
      else if (tier === "expert") stats.byTier.expert++;

      if (action === "prompt") stats.byAction.prompt++;
      else if (action === "follow-up") stats.byAction["follow-up"]++;
      else if (action === "reconsider") stats.byAction.reconsider++;

      stats.totalCreditsSpent += credits ?? 0;
    }

    return Response.json({ stats, recentLogs: logs.slice(0, 20) });
  } catch (error) {
    console.error("GET /api/admin/research-assistant/stats error:", error);
    return Response.json(
      { error: "Failed to load usage stats." },
      { status: 500 },
    );
  }
}
