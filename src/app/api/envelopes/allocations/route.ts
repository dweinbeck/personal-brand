import { format } from "date-fns";
import { unauthorizedResponse, verifyUser } from "@/lib/auth/user";
import {
  allocationsCol,
  createAllocations,
  envelopesForUser,
  transactionsCol,
  transactionsForUserInWeek,
  validateAllocations,
} from "@/lib/envelopes/firestore";
import { overageAllocationSchema } from "@/lib/envelopes/types";
import { getWeekRange } from "@/lib/envelopes/week-math";

export async function POST(request: Request) {
  const auth = await verifyUser(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  try {
    const body = await request.json();
    const parsed = overageAllocationSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input.", details: parsed.error.issues },
        { status: 400 },
      );
    }

    // Verify source transaction exists and belongs to user
    const txDoc = await transactionsCol()
      .doc(parsed.data.sourceTransactionId)
      .get();
    if (!txDoc.exists || txDoc.data()?.userId !== auth.uid) {
      return Response.json(
        { error: "Source transaction not found or access denied." },
        { status: 400 },
      );
    }

    const sourceEnvelopeId = txDoc.data()?.envelopeId as string;

    // Get current-week date range
    const { start, end } = getWeekRange(new Date());
    const weekStartStr = format(start, "yyyy-MM-dd");
    const weekEndStr = format(end, "yyyy-MM-dd");

    // Fetch envelopes and current-week transactions for the user
    const [envSnap, weekTxSnap] = await Promise.all([
      envelopesForUser(auth.uid).get(),
      transactionsForUserInWeek(auth.uid, weekStartStr, weekEndStr).get(),
    ]);

    // Build spent-by-envelope map and transaction-to-envelope map
    const spentByEnvelope = new Map<string, number>();
    const txEnvelopeMap = new Map<string, string>();
    for (const doc of weekTxSnap.docs) {
      const data = doc.data();
      const envId = data.envelopeId as string;
      spentByEnvelope.set(
        envId,
        (spentByEnvelope.get(envId) ?? 0) + (data.amountCents as number),
      );
      txEnvelopeMap.set(doc.id, envId);
    }

    // Fetch existing allocations for current-week transactions to compute accurate balances
    const receivedByEnvelope = new Map<string, number>();
    const donatedByEnvelope = new Map<string, number>();

    const txIds = Array.from(txEnvelopeMap.keys());
    if (txIds.length > 0) {
      for (let i = 0; i < txIds.length; i += 30) {
        const chunk = txIds.slice(i, i + 30);
        const allocSnap = await allocationsCol()
          .where("sourceTransactionId", "in", chunk)
          .get();
        for (const allocDoc of allocSnap.docs) {
          const allocData = allocDoc.data();
          const donorId = allocData.donorEnvelopeId as string;
          const amount = allocData.amountCents as number;
          const recipientId = txEnvelopeMap.get(
            allocData.sourceTransactionId as string,
          );

          donatedByEnvelope.set(
            donorId,
            (donatedByEnvelope.get(donorId) ?? 0) + amount,
          );
          if (recipientId) {
            receivedByEnvelope.set(
              recipientId,
              (receivedByEnvelope.get(recipientId) ?? 0) + amount,
            );
          }
        }
      }
    }

    // Build donor balances map (effective remaining for each envelope)
    const donorBalances = new Map<string, number>();
    for (const doc of envSnap.docs) {
      const data = doc.data();
      const budget = data.weeklyBudgetCents as number;
      const spent = spentByEnvelope.get(doc.id) ?? 0;
      const received = receivedByEnvelope.get(doc.id) ?? 0;
      const donated = donatedByEnvelope.get(doc.id) ?? 0;
      donorBalances.set(doc.id, budget - spent + received - donated);
    }

    // Compute the overage amount (how much the source envelope is over budget)
    const sourceRemaining = donorBalances.get(sourceEnvelopeId) ?? 0;
    const overageAmount = Math.abs(sourceRemaining);

    // Validate allocations against constraints
    const result = validateAllocations(
      parsed.data.allocations,
      overageAmount,
      donorBalances,
    );

    if (!result.valid) {
      return Response.json(
        { error: "Allocation validation failed.", details: result.errors },
        { status: 400 },
      );
    }

    await createAllocations(
      auth.uid,
      parsed.data.sourceTransactionId,
      parsed.data.allocations,
    );

    return Response.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error(
      "POST /api/envelopes/allocations error:",
      error instanceof Error ? error.message : "Unknown",
    );
    return Response.json(
      { error: "Failed to create allocations." },
      { status: 500 },
    );
  }
}
