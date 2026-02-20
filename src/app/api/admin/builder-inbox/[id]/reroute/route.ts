import { z } from "zod";
import { unauthorizedResponse, verifyAdmin } from "@/lib/auth/admin";
import { getCapture, updateCaptureStatus } from "@/lib/gsd/capture";
import { alertCaptureFailed, alertCaptureRouted } from "@/lib/gsd/discord";
import type { RoutingCategory, RoutingOutput } from "@/lib/gsd/schemas";

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

  const { destination } = parsed.data;

  // Load the full capture document
  const capture = await getCapture(id);
  if (!capture) {
    return Response.json({ error: "Capture not found." }, { status: 404 });
  }

  // Build a RoutingOutput for the destination handler.
  // If the capture was previously classified by the LLM, reuse that result
  // with the admin's chosen destination override. Otherwise, construct a
  // minimal RoutingOutput from the raw capture data.
  const existingRouting = (capture as unknown as Record<string, unknown>)
    .routingResult as Record<string, unknown> | null | undefined;

  let routingOutput: RoutingOutput;
  if (existingRouting) {
    routingOutput = {
      ...(existingRouting as unknown as RoutingOutput),
      category: destination as RoutingCategory,
    };
  } else {
    routingOutput = {
      category: destination as RoutingCategory,
      title:
        capture.transcript?.slice(0, 100) ??
        capture.context?.slice(0, 100) ??
        "Manual reroute",
      summary:
        capture.transcript ??
        capture.context ??
        "Manually rerouted from Builder Inbox",
      priority: "medium",
      confidence: 1.0,
    };
  }

  try {
    let destinationRef: string;

    switch (destination) {
      case "github_issue": {
        const { routeToGitHub } = await import("@/lib/gsd/destinations/github");
        destinationRef = await routeToGitHub(routingOutput);
        break;
      }
      case "task": {
        const { routeToTask } = await import("@/lib/gsd/destinations/tasks");
        destinationRef = await routeToTask(routingOutput);
        break;
      }
      default:
        // "inbox" — no external handler needed
        destinationRef = "inbox";
    }

    await updateCaptureStatus(id, {
      status: "routed",
      destination,
      destinationRef,
    });

    // Discord alert (fire-and-forget)
    alertCaptureRouted({
      type: capture.type,
      destination,
      title: routingOutput.title,
      confidence: routingOutput.confidence,
    });

    return Response.json({
      status: "rerouted",
      id,
      destination,
      destinationRef,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    await updateCaptureStatus(id, {
      status: "failed",
      error: errorMessage,
    });

    // Discord alert for failure (fire-and-forget)
    alertCaptureFailed({
      type: capture.type ?? "unknown",
      error: errorMessage,
      captureId: id,
    });

    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
