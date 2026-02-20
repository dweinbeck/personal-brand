import { unauthorizedResponse, verifyAdmin } from "@/lib/auth/admin";
import { updateCaptureStatus } from "@/lib/gsd/capture";
import { processCapture } from "@/lib/gsd/router";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  const { id } = await params;

  // Reset to pending and re-process
  await updateCaptureStatus(id, { status: "processing" });
  processCapture(id).catch(console.error);

  return Response.json({ status: "retrying", id });
}
