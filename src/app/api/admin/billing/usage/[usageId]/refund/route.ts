import { unauthorizedResponse, verifyAdmin } from "@/lib/auth/admin";
import { refundUsage } from "@/lib/billing/firestore";
import { refundReasonSchema } from "@/lib/billing/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ usageId: string }> },
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  const { usageId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = refundReasonSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "reason (string) is required." },
      { status: 400 },
    );
  }

  try {
    await refundUsage({ usageId, reason: parsed.data.reason });
    return Response.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to refund.";
    return Response.json({ error: message }, { status: 400 });
  }
}
