import { unauthorizedResponse, verifyUser } from "@/lib/auth/user";
import { getUserHistory } from "@/lib/brand-scraper/history";

export async function GET(request: Request) {
  const auth = await verifyUser(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  try {
    const entries = await getUserHistory(auth.uid);
    return Response.json({ entries });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load history.";
    return Response.json({ error: message }, { status: 500 });
  }
}
