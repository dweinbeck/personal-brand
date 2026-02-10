import { unauthorizedResponse, verifyUser } from "@/lib/auth/user";
import { checkEnvelopeAccess } from "@/lib/envelopes/billing";
import {
  deleteTransaction,
  updateTransaction,
} from "@/lib/envelopes/firestore";
import { transactionUpdateSchema } from "@/lib/envelopes/types";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ transactionId: string }> },
) {
  const auth = await verifyUser(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  const { transactionId } = await params;

  try {
    const access = await checkEnvelopeAccess(auth.uid, auth.email);
    if (access.mode === "readonly") {
      return Response.json(
        { error: "Insufficient credits. Purchase credits to continue editing." },
        { status: 402 },
      );
    }

    const body = await request.json();
    const parsed = transactionUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input.", details: parsed.error.issues },
        { status: 400 },
      );
    }

    await updateTransaction(auth.uid, transactionId, parsed.data);
    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown";

    if (message === "Transaction not found or access denied.") {
      return Response.json({ error: message }, { status: 404 });
    }

    console.error(
      "PUT /api/envelopes/transactions/[transactionId] error:",
      message,
    );
    return Response.json(
      { error: "Failed to update transaction." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ transactionId: string }> },
) {
  const auth = await verifyUser(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  const { transactionId } = await params;

  try {
    const access = await checkEnvelopeAccess(auth.uid, auth.email);
    if (access.mode === "readonly") {
      return Response.json(
        { error: "Insufficient credits. Purchase credits to continue editing." },
        { status: 402 },
      );
    }

    await deleteTransaction(auth.uid, transactionId);
    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown";

    if (message === "Transaction not found or access denied.") {
      return Response.json({ error: message }, { status: 404 });
    }

    console.error(
      "DELETE /api/envelopes/transactions/[transactionId] error:",
      message,
    );
    return Response.json(
      { error: "Failed to delete transaction." },
      { status: 500 },
    );
  }
}
