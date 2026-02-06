import { clearKnowledgeCache } from "@/lib/assistant/knowledge";
import { verifyAdmin, unauthorizedResponse } from "@/lib/auth/admin";

export async function POST(request: Request) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth);
  }

  clearKnowledgeCache();
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
