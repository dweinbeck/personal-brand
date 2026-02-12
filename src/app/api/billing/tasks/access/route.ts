import { unauthorizedResponse, verifyUser } from "@/lib/auth/user";
import { checkTasksAccess } from "@/lib/billing/tasks";

export async function GET(request: Request) {
  const auth = await verifyUser(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  try {
    const access = await checkTasksAccess(auth.uid, auth.email);
    return Response.json({
      mode: access.mode,
      reason: "reason" in access ? access.reason : undefined,
      weekStart: access.weekStart,
    });
  } catch (error) {
    console.error(
      "GET /api/billing/tasks/access error:",
      error instanceof Error ? error.message : "Unknown",
    );
    return Response.json(
      { error: "Failed to check tasks access." },
      { status: 500 },
    );
  }
}
