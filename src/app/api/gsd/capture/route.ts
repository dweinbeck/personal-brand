import { apiKeyUnauthorizedResponse, verifyApiKey } from "@/lib/auth/api-key";
import { saveCapture } from "@/lib/gsd/capture";
import { processCapture } from "@/lib/gsd/router";
import { dictationCaptureSchema } from "@/lib/gsd/schemas";

export async function POST(request: Request) {
  // 1. Auth check
  const auth = verifyApiKey(request);
  if (!auth.authorized) return apiKeyUnauthorizedResponse(auth);

  // 2. Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  // 3. Validate with Zod
  const parsed = dictationCaptureSchema.safeParse(body);
  if (!parsed.success) {
    // Short error message for Shortcuts display (<200 chars)
    const firstIssue = parsed.error.issues[0];
    const message = firstIssue?.message ?? "Invalid request.";
    return Response.json({ error: message }, { status: 400 });
  }

  // 4. Generate capture ID and persist
  const captureId = crypto.randomUUID();
  try {
    await saveCapture({
      id: captureId,
      type: "dictation",
      transcript: parsed.data.transcript,
      context: parsed.data.context,
    });
  } catch (err) {
    console.error("Failed to save capture:", err);
    return Response.json({ error: "Failed to save capture." }, { status: 500 });
  }

  // 5. Fire-and-forget async processing (LLM classification + routing)
  processCapture(captureId).catch(console.error);

  // 6. Respond immediately with 202 Accepted
  return Response.json({ status: "queued", id: captureId }, { status: 202 });
}
