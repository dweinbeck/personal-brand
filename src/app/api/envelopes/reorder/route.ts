import { unauthorizedResponse, verifyUser } from "@/lib/auth/user";
import { checkEnvelopeAccess } from "@/lib/envelopes/billing";
import { reorderEnvelopes } from "@/lib/envelopes/firestore";
import { reorderSchema } from "@/lib/envelopes/types";

export async function PUT(request: Request) {
  const auth = await verifyUser(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  try {
    const access = await checkEnvelopeAccess(auth.uid, auth.email);
    if (access.mode === "readonly") {
      return Response.json(
        { error: "Insufficient credits. Purchase credits to continue editing." },
        { status: 402 },
      );
    }

    const body = await request.json();
    const parsed = reorderSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input.", details: parsed.error.issues },
        { status: 400 },
      );
    }

    await reorderEnvelopes(auth.uid, parsed.data.orderedIds);
    return Response.json({ success: true });
  } catch (error) {
    console.error(
      "PUT /api/envelopes/reorder error:",
      error instanceof Error ? error.message : "Unknown",
    );
    return Response.json(
      { error: "Failed to reorder envelopes." },
      { status: 500 },
    );
  }
}
