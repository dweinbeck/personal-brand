import { unauthorizedResponse, verifyUser } from "@/lib/auth/user";
import {
  deleteHistoryEntry,
  getUserHistory,
} from "@/lib/brand-scraper/history";

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

export async function DELETE(request: Request) {
  const auth = await verifyUser(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  try {
    const body = (await request.json()) as { jobId?: unknown };
    const { jobId } = body;

    if (typeof jobId !== "string" || jobId.trim() === "") {
      return Response.json(
        { error: "jobId is required and must be a non-empty string." },
        { status: 400 },
      );
    }

    await deleteHistoryEntry({ uid: auth.uid, jobId });
    return Response.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete entry.";
    const status = message === "History entry not found." ? 404 : 500;
    return Response.json({ error: message }, { status });
  }
}
