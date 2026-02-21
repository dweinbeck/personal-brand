import { unauthorizedResponse, verifyAdmin } from "@/lib/auth/admin";
import { getWorkspaces } from "@/services/tasks/workspace.service";

/**
 * GET /api/admin/builder-inbox/projects
 *
 * Returns workspaces with nested projects for the Builder Inbox
 * project picker. Uses the GSD_TASKS_USER_ID env var to scope
 * to the correct Tasks user.
 */
export async function GET(request: Request) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  const userId = process.env.GSD_TASKS_USER_ID;
  if (!userId) {
    return Response.json(
      { error: "GSD_TASKS_USER_ID not configured." },
      { status: 500 },
    );
  }

  const workspaces = await getWorkspaces(userId);

  return Response.json({ workspaces });
}
