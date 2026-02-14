import { unauthorizedResponse, verifyUser } from "@/lib/auth/user";
import { listConversations } from "@/lib/research-assistant/conversation-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await verifyUser(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  const conversations = await listConversations(auth.uid, 20);
  return Response.json({ conversations });
}
