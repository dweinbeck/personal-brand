import { unauthorizedResponse, verifyUser } from "@/lib/auth/user";
import {
  createTransaction,
  listTransactionsForWeek,
} from "@/lib/envelopes/firestore";
import { transactionSchema } from "@/lib/envelopes/types";

export async function GET(request: Request) {
  const auth = await verifyUser(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  try {
    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get("weekStart");
    const weekEnd = searchParams.get("weekEnd");

    if (!weekStart || !weekEnd) {
      return Response.json(
        { error: "weekStart and weekEnd query params are required." },
        { status: 400 },
      );
    }

    const data = await listTransactionsForWeek(auth.uid, weekStart, weekEnd);
    return Response.json(data);
  } catch (error) {
    console.error(
      "GET /api/envelopes/transactions error:",
      error instanceof Error ? error.message : "Unknown",
    );
    return Response.json(
      { error: "Failed to load transactions." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await verifyUser(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  try {
    const body = await request.json();
    const parsed = transactionSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input.", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const transaction = await createTransaction(auth.uid, parsed.data);
    return Response.json(transaction, { status: 201 });
  } catch (error) {
    console.error(
      "POST /api/envelopes/transactions error:",
      error instanceof Error ? error.message : "Unknown",
    );
    return Response.json(
      { error: "Failed to create transaction." },
      { status: 500 },
    );
  }
}
