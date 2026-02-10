import { unauthorizedResponse, verifyUser } from "@/lib/auth/user";
import {
  createEnvelope,
  listEnvelopesWithRemaining,
} from "@/lib/envelopes/firestore";
import { envelopeSchema } from "@/lib/envelopes/types";

export async function GET(request: Request) {
  const auth = await verifyUser(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  try {
    const data = await listEnvelopesWithRemaining(auth.uid);
    return Response.json(data);
  } catch (error) {
    console.error(
      "GET /api/envelopes error:",
      error instanceof Error ? error.message : "Unknown",
    );
    return Response.json(
      { error: "Failed to load envelopes." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await verifyUser(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  try {
    const body = await request.json();
    const parsed = envelopeSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input.", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const envelope = await createEnvelope(auth.uid, parsed.data);
    return Response.json(envelope, { status: 201 });
  } catch (error) {
    console.error(
      "POST /api/envelopes error:",
      error instanceof Error ? error.message : "Unknown",
    );
    return Response.json(
      { error: "Failed to create envelope." },
      { status: 500 },
    );
  }
}
