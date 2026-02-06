import { rollbackToVersion } from "@/lib/assistant/prompt-versions";
import { verifyAdmin, unauthorizedResponse } from "@/lib/auth/admin";
import { z } from "zod";

const rollbackSchema = z.object({
  action: z.literal("rollback"),
  versionId: z.string(),
});

export async function POST(request: Request) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth);
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = rollbackSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await rollbackToVersion(parsed.data.versionId);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to rollback." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
