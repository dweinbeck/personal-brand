import { unauthorizedResponse, verifyAdmin } from "@/lib/auth/admin";
import {
  getBillingUser,
  getUserLedger,
  getUserPurchases,
  getUserUsage,
} from "@/lib/billing/firestore";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  const { uid } = await params;

  try {
    const [user, ledger, usage, purchases] = await Promise.all([
      getBillingUser(uid),
      getUserLedger(uid),
      getUserUsage(uid),
      getUserPurchases(uid),
    ]);

    if (!user) {
      return Response.json(
        { error: "Billing user not found." },
        { status: 404 },
      );
    }

    return Response.json({ user, ledger, usage, purchases });
  } catch (error) {
    console.error(`GET /api/admin/billing/users/${uid} error:`, error);
    return Response.json(
      { error: "Failed to load user details." },
      { status: 500 },
    );
  }
}
