import { format } from "date-fns";
import { unauthorizedResponse, verifyUser } from "@/lib/auth/user";
import { checkEnvelopeAccess } from "@/lib/envelopes/billing";
import {
  createIncomeAllocation,
  listIncomeAllocations,
} from "@/lib/envelopes/firestore";
import { incomeAllocationSchema } from "@/lib/envelopes/types";
import { getWeekRange } from "@/lib/envelopes/week-math";

export async function POST(request: Request) {
  const auth = await verifyUser(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  try {
    const access = await checkEnvelopeAccess(auth.uid, auth.email);
    if (access.mode === "readonly") {
      return Response.json(
        {
          error: "Insufficient credits. Purchase credits to continue editing.",
        },
        { status: 402 },
      );
    }

    const body = await request.json();
    const parsed = incomeAllocationSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input.", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { start } = getWeekRange(new Date());
    const weekStartStr = format(start, "yyyy-MM-dd");

    await createIncomeAllocation(auth.uid, parsed.data, weekStartStr);

    return Response.json({ success: true }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    if (
      message.includes("exceeds unallocated income") ||
      message.includes("not found or access denied")
    ) {
      return Response.json({ error: message }, { status: 400 });
    }

    console.error("POST /api/envelopes/income-allocations error:", message);
    return Response.json(
      { error: "Failed to create income allocation." },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const auth = await verifyUser(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  try {
    const url = new URL(request.url);
    const weekStart = url.searchParams.get("weekStart");
    const weekEnd = url.searchParams.get("weekEnd");

    if (!weekStart || !weekEnd) {
      return Response.json(
        { error: "weekStart and weekEnd query params are required." },
        { status: 400 },
      );
    }

    const access = await checkEnvelopeAccess(auth.uid, auth.email);

    const allocations = await listIncomeAllocations(
      auth.uid,
      weekStart,
      weekEnd,
    );

    return Response.json({
      allocations,
      billing: { mode: access.mode, reason: access.reason },
    });
  } catch (error) {
    console.error(
      "GET /api/envelopes/income-allocations error:",
      error instanceof Error ? error.message : "Unknown",
    );
    return Response.json(
      { error: "Failed to fetch income allocations." },
      { status: 500 },
    );
  }
}
