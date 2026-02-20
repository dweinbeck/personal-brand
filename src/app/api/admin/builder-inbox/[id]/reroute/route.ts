import { z } from "zod";
import { unauthorizedResponse, verifyAdmin } from "@/lib/auth/admin";
import { updateCaptureStatus } from "@/lib/gsd/capture";

const rerouteSchema = z.object({
  destination: z.enum(["github_issue", "task", "inbox"]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = rerouteSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  await updateCaptureStatus(id, {
    status: "routed",
    destination: parsed.data.destination,
    destinationRef: `manual:${parsed.data.destination}`,
  });

  return Response.json({
    status: "rerouted",
    id,
    destination: parsed.data.destination,
  });
}
