import { clearKnowledgeCache } from "@/lib/assistant/knowledge";

export async function POST() {
  clearKnowledgeCache();
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
