import { unauthorizedResponse, verifyUser } from "@/lib/auth/user";
import { getBillingMe } from "@/lib/billing/firestore";

export async function GET(request: Request) {
  const auth = await verifyUser(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  try {
    const data = await getBillingMe({ uid: auth.uid, email: auth.email });
    return Response.json(data);
  } catch (error) {
    console.error("GET /api/billing/me error:", error);
    return Response.json(
      { error: "Failed to load billing info." },
      { status: 500 },
    );
  }
}
