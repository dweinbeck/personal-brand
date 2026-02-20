import { unauthorizedResponse, verifyAdmin } from "@/lib/auth/admin";
import { getCapture } from "@/lib/gsd/capture";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  const { id } = await params;
  const capture = await getCapture(id);

  if (!capture) {
    return Response.json({ error: "Capture not found." }, { status: 404 });
  }

  return Response.json({ capture });
}
