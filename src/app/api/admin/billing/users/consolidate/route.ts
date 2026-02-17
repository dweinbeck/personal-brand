import { z } from "zod/v4";
import { unauthorizedResponse, verifyAdmin } from "@/lib/auth/admin";
import { consolidateBillingUsers } from "@/lib/billing/firestore";

const consolidateSchema = z.object({
  keepUid: z.string().min(1),
  mergeUid: z.string().min(1),
});

export async function POST(request: Request) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  try {
    const body = await request.json();
    const parsed = consolidateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input.", details: parsed.error.issues },
        { status: 400 },
      );
    }

    if (parsed.data.keepUid === parsed.data.mergeUid) {
      return Response.json(
        { error: "Cannot consolidate a user with itself." },
        { status: 400 },
      );
    }

    const result = await consolidateBillingUsers(
      parsed.data.keepUid,
      parsed.data.mergeUid,
    );
    return Response.json(result);
  } catch (error) {
    console.error("POST /api/admin/billing/users/consolidate error:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Consolidation failed.",
      },
      { status: 500 },
    );
  }
}
