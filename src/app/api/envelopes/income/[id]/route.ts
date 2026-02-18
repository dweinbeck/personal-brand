import { unauthorizedResponse, verifyUser } from "@/lib/auth/user";
import { checkEnvelopeAccess } from "@/lib/envelopes/billing";
import { deleteIncomeEntry } from "@/lib/envelopes/firestore";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyUser(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  const { id } = await params;

  try {
    const access = await checkEnvelopeAccess(auth.uid, auth.email);
    if (access.mode === "readonly") {
      return Response.json(
        {
          error: "Insufficient credits. Purchase credits to continue editing.",
        },
        { status: 402 },
      );
    }

    await deleteIncomeEntry(auth.uid, id);
    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown";

    if (message === "Income entry not found.") {
      return Response.json({ error: message }, { status: 404 });
    }
    if (message === "Income entry access denied.") {
      return Response.json({ error: message }, { status: 403 });
    }

    console.error("DELETE /api/envelopes/income/[id] error:", message);
    return Response.json(
      { error: "Failed to delete income entry." },
      { status: 500 },
    );
  }
}
