import { unauthorizedResponse, verifyUser } from "@/lib/auth/user";
import { checkEnvelopeAccess } from "@/lib/envelopes/billing";
import { getAnalyticsData } from "@/lib/envelopes/firestore";

export async function GET(request: Request) {
  const auth = await verifyUser(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  try {
    const [access, data] = await Promise.all([
      checkEnvelopeAccess(auth.uid, auth.email),
      getAnalyticsData(auth.uid),
    ]);
    return Response.json({
      ...data,
      billing: {
        mode: access.mode,
        reason: "reason" in access ? access.reason : undefined,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/envelopes/analytics error:",
      error instanceof Error ? error.message : "Unknown",
    );
    return Response.json(
      { error: "Failed to load analytics." },
      { status: 500 },
    );
  }
}
