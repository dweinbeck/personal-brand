import { unauthorizedResponse, verifyUser } from "@/lib/auth/user";
import { checkEnvelopeAccess } from "@/lib/envelopes/billing";
import { deleteEnvelope, updateEnvelope } from "@/lib/envelopes/firestore";
import { envelopeUpdateSchema } from "@/lib/envelopes/types";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ envelopeId: string }> },
) {
  const auth = await verifyUser(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  const { envelopeId } = await params;

  try {
    const access = await checkEnvelopeAccess(auth.uid, auth.email);
    if (access.mode === "readonly") {
      return Response.json(
        { error: "Insufficient credits. Purchase credits to continue editing." },
        { status: 402 },
      );
    }

    const body = await request.json();
    const parsed = envelopeUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input.", details: parsed.error.issues },
        { status: 400 },
      );
    }

    await updateEnvelope(auth.uid, envelopeId, parsed.data);
    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown";

    if (message === "Envelope not found or access denied.") {
      return Response.json({ error: message }, { status: 404 });
    }

    console.error("PUT /api/envelopes/[envelopeId] error:", message);
    return Response.json(
      { error: "Failed to update envelope." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ envelopeId: string }> },
) {
  const auth = await verifyUser(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  const { envelopeId } = await params;

  try {
    const access = await checkEnvelopeAccess(auth.uid, auth.email);
    if (access.mode === "readonly") {
      return Response.json(
        { error: "Insufficient credits. Purchase credits to continue editing." },
        { status: 402 },
      );
    }

    await deleteEnvelope(auth.uid, envelopeId);
    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown";

    if (message === "Envelope not found or access denied.") {
      return Response.json({ error: message }, { status: 404 });
    }

    console.error("DELETE /api/envelopes/[envelopeId] error:", message);
    return Response.json(
      { error: "Failed to delete envelope." },
      { status: 500 },
    );
  }
}
