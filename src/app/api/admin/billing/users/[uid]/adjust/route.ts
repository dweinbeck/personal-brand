import { unauthorizedResponse, verifyAdmin } from "@/lib/auth/admin";
import { adminAdjustCredits } from "@/lib/billing/firestore";
import { adminAdjustSchema } from "@/lib/billing/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  const { uid } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = adminAdjustSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "deltaCredits (integer) and reason (string) are required." },
      { status: 400 },
    );
  }

  try {
    const result = await adminAdjustCredits({
      uid,
      deltaCredits: parsed.data.deltaCredits,
      reason: parsed.data.reason,
      adminEmail: auth.email,
    });
    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to adjust credits.";
    return Response.json({ error: message }, { status: 400 });
  }
}
