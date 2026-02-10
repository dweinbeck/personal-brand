import { unauthorizedResponse, verifyUser } from "@/lib/auth/user";
import { getAnalyticsData } from "@/lib/envelopes/firestore";

export async function GET(request: Request) {
  const auth = await verifyUser(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  try {
    const data = await getAnalyticsData(auth.uid);
    return Response.json(data);
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
