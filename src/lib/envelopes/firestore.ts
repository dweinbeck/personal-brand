import { addWeeks, format, startOfWeek } from "date-fns";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase";
import type {
  AllocationValidationResult,
  AnalyticsPageData,
  Envelope,
  EnvelopeTransaction,
  EnvelopeTransfer,
  EnvelopeWithStatus,
  HomePageData,
  IncomeAllocation,
  IncomeAllocationInput,
  IncomeEntry,
  IncomeEntryInput,
  PivotRow,
  TransactionInput,
  TransactionUpdateInput,
  TransferInput,
  WeeklyIncomeEntry,
  WeeklySavingsEntry,
} from "./types";
import {
  formatWeekLabel,
  getRemainingDaysPercent,
  getStatusLabel,
  getWeekNumber,
  getWeekRange,
} from "./week-math";

const WEEK_OPTIONS = { weekStartsOn: 0 as const };

function requireDb() {
  if (!db) {
    throw new Error("Firestore not available.");
  }
  return db;
}

// ---------------------------------------------------------------------------
// Collection references (for writes)
// ---------------------------------------------------------------------------

/**
 * Returns the envelopes collection reference.
 * All queries MUST filter by userId server-side.
 * userId is ALWAYS derived from verifyUser(), never from client input.
 */
export function envelopesCol() {
  return requireDb().collection("envelopes");
}

/**
 * Returns the envelope_transactions collection reference.
 */
export function transactionsCol() {
  return requireDb().collection("envelope_transactions");
}

/**
 * Returns the overage_allocations collection reference.
 */
export function allocationsCol() {
  return requireDb().collection("envelope_allocations");
}

/**
 * Returns the envelope_profiles collection reference.
 */
export function envelopeProfilesCol() {
  return requireDb().collection("envelope_profiles");
}

/**
 * Returns the envelope_transfers collection reference.
 */
export function transfersCol() {
  return requireDb().collection("envelope_transfers");
}

/**
 * Returns the envelope_income_entries collection reference.
 */
export function incomeEntriesCol() {
  return requireDb().collection("envelope_income_entries");
}

/**
 * Returns the envelope_income_allocations collection reference.
 */
export function incomeAllocationsCol() {
  return requireDb().collection("envelope_income_allocations");
}

// ---------------------------------------------------------------------------
// Query helpers (for reads)
// ---------------------------------------------------------------------------

/**
 * Returns envelopes for a specific user, ordered by sortOrder.
 */
export function envelopesForUser(userId: string) {
  return envelopesCol()
    .where("userId", "==", userId)
    .orderBy("sortOrder", "asc");
}

/**
 * Returns transactions for a specific user within a date range.
 * weekStart and weekEnd are YYYY-MM-DD strings.
 */
export function transactionsForUserInWeek(
  userId: string,
  weekStart: string,
  weekEnd: string,
) {
  return transactionsCol()
    .where("userId", "==", userId)
    .where("date", ">=", weekStart)
    .where("date", "<=", weekEnd);
}

/**
 * Returns income entries for a specific user within a date range.
 */
function incomeEntriesForUserInWeek(
  userId: string,
  weekStart: string,
  weekEnd: string,
) {
  return incomeEntriesCol()
    .where("userId", "==", userId)
    .where("date", ">=", weekStart)
    .where("date", "<=", weekEnd);
}

// ---------------------------------------------------------------------------
// Pure computation helpers (testable without Firestore)
// ---------------------------------------------------------------------------

/** Minimal envelope shape needed by savings computation helpers. */
type SavingsEnvelope = {
  id: string;
  weeklyBudgetCents: number;
  rollover: boolean;
  createdAt: string;
};

/**
 * Computes remaining cents and status label for a single envelope.
 * Optionally accounts for overage allocations and transfers (received increases
 * balance, donated/sent decreases balance). Defaults to 0 for backward compat.
 */
export function computeEnvelopeStatus(
  weeklyBudgetCents: number,
  spentCents: number,
  today: Date,
  receivedAllocationsCents = 0,
  donatedAllocationsCents = 0,
  receivedTransfersCents = 0,
  sentTransfersCents = 0,
): { remainingCents: number; status: "On Track" | "Watch" | "Over" } {
  const remainingCents =
    weeklyBudgetCents -
    spentCents +
    receivedAllocationsCents -
    donatedAllocationsCents +
    receivedTransfersCents -
    sentTransfersCents;
  const remainingDaysPercent = getRemainingDaysPercent(today);
  const status = getStatusLabel(
    remainingCents,
    weeklyBudgetCents,
    remainingDaysPercent,
  );
  return { remainingCents, status };
}

/**
 * Validates a set of overage allocations against constraints:
 * - At least one allocation must be provided
 * - Each donor envelope must exist in donorBalances
 * - Each allocation must not exceed the donor's remaining balance
 * - Total allocated must exactly equal the overage amount
 *
 * Returns all violations (does not short-circuit on first error).
 */
export function validateAllocations(
  allocations: { donorEnvelopeId: string; amountCents: number }[],
  overageAmountCents: number,
  donorBalances: Map<string, number>,
): AllocationValidationResult {
  const errors: string[] = [];

  if (allocations.length === 0) {
    return { valid: false, errors: ["No allocations provided"] };
  }

  for (const alloc of allocations) {
    const balance = donorBalances.get(alloc.donorEnvelopeId);
    if (balance === undefined) {
      errors.push(`Donor envelope ${alloc.donorEnvelopeId} not found`);
    } else if (alloc.amountCents > balance) {
      errors.push(
        `Allocation for ${alloc.donorEnvelopeId} (${alloc.amountCents}) exceeds remaining balance (${balance})`,
      );
    }
  }

  const totalAllocated = allocations.reduce((sum, a) => sum + a.amountCents, 0);
  if (totalAllocated !== overageAmountCents) {
    errors.push(
      `Total allocated (${totalAllocated}) does not equal overage (${overageAmountCents})`,
    );
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true };
}

/**
 * Computes total savings for a single completed week across non-rollover envelopes.
 * Per-envelope savings are floored at 0 (overspending does not subtract).
 * Envelopes created after the week end are excluded.
 */
export function computeSavingsForWeek(
  envelopes: SavingsEnvelope[],
  transactions: { envelopeId: string; amountCents: number }[],
  _weekStart: string,
  weekEnd: string,
): number {
  let totalSavings = 0;

  for (const env of envelopes) {
    // Skip rollover envelopes -- savings only apply to non-rollover
    if (env.rollover) continue;

    // Skip envelopes created after this week ended
    if (env.createdAt > weekEnd) continue;

    const spent = transactions
      .filter((t) => t.envelopeId === env.id)
      .reduce((sum, t) => sum + t.amountCents, 0);

    const unspent = Math.max(0, env.weeklyBudgetCents - spent);
    totalSavings += unspent;
  }

  return totalSavings;
}

/**
 * Computes cumulative savings across all completed weeks from earliestWeekStart
 * to currentWeekStart (exclusive -- current week is not counted).
 *
 * @param envelopes - All envelopes with id, weeklyBudgetCents, rollover, createdAt (YYYY-MM-DD)
 * @param transactions - All transactions with envelopeId, amountCents, date (YYYY-MM-DD)
 * @param earliestWeekStart - YYYY-MM-DD of the Sunday starting the earliest week
 * @param currentWeekStart - YYYY-MM-DD of the Sunday starting the current week
 */
export function computeCumulativeSavingsFromData(
  envelopes: SavingsEnvelope[],
  transactions: { envelopeId: string; amountCents: number; date: string }[],
  earliestWeekStart: string,
  currentWeekStart: string,
): number {
  if (envelopes.length === 0) return 0;

  let totalSavings = 0;
  let weekStart = earliestWeekStart;

  while (weekStart < currentWeekStart) {
    // Compute end of this week (Saturday) as YYYY-MM-DD
    const weekStartDate = new Date(`${weekStart}T00:00:00`);
    const nextWeekDate = addWeeks(weekStartDate, 1);
    const weekEnd = format(
      new Date(nextWeekDate.getTime() - 86_400_000),
      "yyyy-MM-dd",
    );

    // Filter transactions for this week
    const weekTransactions = transactions.filter(
      (t) => t.date >= weekStart && t.date <= weekEnd,
    );

    totalSavings += computeSavingsForWeek(
      envelopes,
      weekTransactions,
      weekStart,
      weekEnd,
    );

    // Move to next week
    weekStart = format(nextWeekDate, "yyyy-MM-dd");
  }

  return totalSavings;
}

/**
 * Returns per-week savings entries with running cumulative total for all
 * completed weeks from earliestWeekStart to currentWeekStart (exclusive).
 *
 * Delegates per-week savings computation to `computeSavingsForWeek`.
 * Results are ordered oldest-first (chronological, for chart rendering).
 */
export function computeWeeklySavingsBreakdown(
  envelopes: SavingsEnvelope[],
  transactions: { envelopeId: string; amountCents: number; date: string }[],
  earliestWeekStart: string,
  currentWeekStart: string,
): WeeklySavingsEntry[] {
  if (envelopes.length === 0) return [];

  const entries: WeeklySavingsEntry[] = [];
  let cumulativeCents = 0;
  let weekStart = earliestWeekStart;

  while (weekStart < currentWeekStart) {
    const weekStartDate = new Date(`${weekStart}T00:00:00`);
    const nextWeekDate = addWeeks(weekStartDate, 1);
    const weekEnd = format(
      new Date(nextWeekDate.getTime() - 86_400_000),
      "yyyy-MM-dd",
    );

    const weekTransactions = transactions.filter(
      (t) => t.date >= weekStart && t.date <= weekEnd,
    );

    const savingsCents = computeSavingsForWeek(
      envelopes,
      weekTransactions,
      weekStart,
      weekEnd,
    );

    cumulativeCents += savingsCents;

    const weekNumber = getWeekNumber(weekStartDate);
    entries.push({
      weekStart,
      weekLabel: `Wk ${weekNumber}`,
      savingsCents,
      cumulativeCents,
    });

    weekStart = format(nextWeekDate, "yyyy-MM-dd");
  }

  return entries;
}

/**
 * Computes accumulated rollover surplus for a single envelope across all
 * completed prior weeks. Only applies to rollover-enabled envelopes.
 *
 * For each completed week (from envelope creation to the week before current):
 *   surplus += max(0, weeklyBudgetCents - spentInThatWeek)
 *
 * This is computed on the fly -- no separate Firestore storage needed.
 * Returns 0 for non-rollover envelopes.
 */
export function computeRolloverSurplus(
  envelope: { weeklyBudgetCents: number; rollover: boolean; createdAt: string },
  transactions: { amountCents: number; date: string }[],
  currentWeekStart: string,
): number {
  if (!envelope.rollover) return 0;

  let surplus = 0;
  // Start from the week the envelope was created
  const envelopeCreatedWeekStart = format(
    startOfWeek(new Date(`${envelope.createdAt}T00:00:00`), WEEK_OPTIONS),
    "yyyy-MM-dd",
  );

  let weekStart = envelopeCreatedWeekStart;

  while (weekStart < currentWeekStart) {
    const weekStartDate = new Date(`${weekStart}T00:00:00`);
    const nextWeekDate = addWeeks(weekStartDate, 1);
    const weekEnd = format(
      new Date(nextWeekDate.getTime() - 86_400_000),
      "yyyy-MM-dd",
    );

    // Sum transactions for this envelope in this week
    const weekSpent = transactions
      .filter((t) => t.date >= weekStart && t.date <= weekEnd)
      .reduce((sum, t) => sum + t.amountCents, 0);

    // Surplus for this week (floored at 0 -- overspending doesn't create negative rollover)
    surplus += Math.max(0, envelope.weeklyBudgetCents - weekSpent);

    weekStart = format(nextWeekDate, "yyyy-MM-dd");
  }

  return surplus;
}

/**
 * Groups transactions by week (Sunday-Saturday) then by envelopeId.
 * Returns rows ordered newest-first (most recent week at top of table).
 * Weeks with zero transactions are omitted.
 *
 * @param transactions - All transactions with envelopeId, amountCents, date (YYYY-MM-DD)
 * @param earliestWeekStart - YYYY-MM-DD of the Sunday starting the earliest week
 * @param currentWeekEnd - YYYY-MM-DD of the Saturday ending the latest week
 */
export function buildPivotRows(
  transactions: { envelopeId: string; amountCents: number; date: string }[],
  earliestWeekStart: string,
  currentWeekEnd: string,
): PivotRow[] {
  if (transactions.length === 0) return [];

  const rows: PivotRow[] = [];
  let weekStart = earliestWeekStart;

  while (weekStart <= currentWeekEnd) {
    const weekStartDate = new Date(`${weekStart}T00:00:00`);
    const nextWeekDate = addWeeks(weekStartDate, 1);
    const weekEnd = format(
      new Date(nextWeekDate.getTime() - 86_400_000),
      "yyyy-MM-dd",
    );

    const weekTransactions = transactions.filter(
      (t) => t.date >= weekStart && t.date <= weekEnd,
    );

    if (weekTransactions.length > 0) {
      const cells: Record<string, number> = {};
      for (const t of weekTransactions) {
        cells[t.envelopeId] = (cells[t.envelopeId] ?? 0) + t.amountCents;
      }

      const totalCents = Object.values(cells).reduce((sum, v) => sum + v, 0);

      const weekNumber = getWeekNumber(weekStartDate);
      rows.push({
        weekStart,
        weekLabel: `Wk ${weekNumber}`,
        cells,
        totalCents,
      });
    }

    weekStart = format(nextWeekDate, "yyyy-MM-dd");
  }

  return rows.reverse();
}

// ---------------------------------------------------------------------------
// CRUD operations (depend on Firestore)
// ---------------------------------------------------------------------------

/**
 * Creates a new envelope for the given user.
 * Assigns sortOrder as maxExisting + 1.
 */
export async function createEnvelope(
  userId: string,
  input: { title: string; weeklyBudgetCents: number },
): Promise<Envelope> {
  const existing = await envelopesForUser(userId).get();

  // Prevent duplicate envelope titles for the same user
  const titleLower = input.title.trim().toLowerCase();
  const duplicate = existing.docs.find(
    (doc) => (doc.data().title as string).trim().toLowerCase() === titleLower,
  );
  if (duplicate) {
    throw new Error(
      `An envelope named "${input.title}" already exists. Please choose a different name.`,
    );
  }

  let maxSort = -1;
  for (const doc of existing.docs) {
    const data = doc.data();
    if (typeof data.sortOrder === "number" && data.sortOrder > maxSort) {
      maxSort = data.sortOrder;
    }
  }

  const docRef = envelopesCol().doc();
  const envelope = {
    userId,
    title: input.title,
    weeklyBudgetCents: input.weeklyBudgetCents,
    sortOrder: maxSort + 1,
    rollover: false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await docRef.set(envelope);

  // Return the created envelope with its ID (timestamps will be server-set)
  const snap = await docRef.get();
  return { id: docRef.id, ...snap.data() } as Envelope;
}

/**
 * Updates an existing envelope. Verifies ownership before modifying.
 * Only updates provided fields.
 */
export async function updateEnvelope(
  userId: string,
  envelopeId: string,
  input: Partial<{
    title: string;
    weeklyBudgetCents: number;
    rollover: boolean;
  }>,
): Promise<void> {
  const docRef = envelopesCol().doc(envelopeId);
  const snap = await docRef.get();

  if (!snap.exists || snap.data()?.userId !== userId) {
    throw new Error("Envelope not found or access denied.");
  }

  await docRef.update({
    ...input,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Deletes an envelope and all related transactions and allocations atomically.
 * Verifies ownership before deleting. Splits into multiple batches if > 450 ops.
 */
export async function deleteEnvelope(
  userId: string,
  envelopeId: string,
): Promise<void> {
  const docRef = envelopesCol().doc(envelopeId);
  const snap = await docRef.get();

  if (!snap.exists || snap.data()?.userId !== userId) {
    throw new Error("Envelope not found or access denied.");
  }

  // Find all related transactions
  const txSnap = await transactionsCol()
    .where("userId", "==", userId)
    .where("envelopeId", "==", envelopeId)
    .get();

  const transactionIds = txSnap.docs.map((d) => d.id);

  // Find all related allocations (by donorEnvelopeId)
  const allocByDonor = await allocationsCol()
    .where("donorEnvelopeId", "==", envelopeId)
    .get();

  // Find allocations by sourceTransactionId (for any of the envelope's transactions)
  const allocByTx: FirebaseFirestore.QueryDocumentSnapshot[] = [];
  if (transactionIds.length > 0) {
    // Firestore 'in' queries support up to 30 values; chunk if needed
    for (let i = 0; i < transactionIds.length; i += 30) {
      const chunk = transactionIds.slice(i, i + 30);
      const snap = await allocationsCol()
        .where("sourceTransactionId", "in", chunk)
        .get();
      allocByTx.push(...snap.docs);
    }
  }

  // Deduplicate allocation refs from both queries
  const seenPaths = new Set<string>();
  const uniqueAllocRefs: FirebaseFirestore.DocumentReference[] = [];
  for (const doc of [...allocByDonor.docs, ...allocByTx]) {
    if (!seenPaths.has(doc.ref.path)) {
      seenPaths.add(doc.ref.path);
      uniqueAllocRefs.push(doc.ref);
    }
  }

  const deleteRefs = [
    docRef,
    ...txSnap.docs.map((d) => d.ref),
    ...uniqueAllocRefs,
  ];

  // Batch delete (max 500 ops per batch, use 450 for safety)
  const BATCH_LIMIT = 450;
  for (let i = 0; i < deleteRefs.length; i += BATCH_LIMIT) {
    const batch = requireDb().batch();
    const chunk = deleteRefs.slice(i, i + BATCH_LIMIT);
    for (const ref of chunk) {
      batch.delete(ref);
    }
    await batch.commit();
  }
}

/**
 * Reorders envelopes by assigning sequential sortOrder values.
 * orderedIds[0] gets sortOrder 0, orderedIds[1] gets sortOrder 1, etc.
 */
export async function reorderEnvelopes(
  _userId: string,
  orderedIds: string[],
): Promise<void> {
  const batch = requireDb().batch();

  for (let i = 0; i < orderedIds.length; i++) {
    const ref = envelopesCol().doc(orderedIds[i]);
    batch.update(ref, {
      sortOrder: i,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
}

// ---------------------------------------------------------------------------
// Transaction CRUD operations
// ---------------------------------------------------------------------------

/**
 * Creates a new transaction for the given user.
 * Verifies the target envelope exists and belongs to the user.
 */
export async function createTransaction(
  userId: string,
  input: TransactionInput,
): Promise<EnvelopeTransaction> {
  // Verify the envelope exists and belongs to the user
  const envRef = envelopesCol().doc(input.envelopeId);
  const envSnap = await envRef.get();
  if (!envSnap.exists || envSnap.data()?.userId !== userId) {
    throw new Error("Envelope not found or access denied.");
  }

  const docRef = transactionsCol().doc();
  const data = {
    userId,
    envelopeId: input.envelopeId,
    amountCents: input.amountCents,
    date: input.date,
    ...(input.merchant ? { merchant: input.merchant } : {}),
    ...(input.description ? { description: input.description } : {}),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await docRef.set(data);
  const snap = await docRef.get();
  return { id: docRef.id, ...snap.data() } as EnvelopeTransaction;
}

/**
 * Updates an existing transaction. Verifies ownership before modifying.
 * If changing envelopeId, verifies the new envelope also belongs to the user.
 */
export async function updateTransaction(
  userId: string,
  transactionId: string,
  input: TransactionUpdateInput,
): Promise<void> {
  const docRef = transactionsCol().doc(transactionId);
  const snap = await docRef.get();
  if (!snap.exists || snap.data()?.userId !== userId) {
    throw new Error("Transaction not found or access denied.");
  }

  // If changing envelope, verify the new envelope belongs to the user
  if (input.envelopeId) {
    const envRef = envelopesCol().doc(input.envelopeId);
    const envSnap = await envRef.get();
    if (!envSnap.exists || envSnap.data()?.userId !== userId) {
      throw new Error("Envelope not found or access denied.");
    }
  }

  const updateData: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (input.envelopeId !== undefined) updateData.envelopeId = input.envelopeId;
  if (input.amountCents !== undefined)
    updateData.amountCents = input.amountCents;
  if (input.date !== undefined) updateData.date = input.date;
  if (input.merchant !== undefined) updateData.merchant = input.merchant;
  if (input.description !== undefined)
    updateData.description = input.description;

  await docRef.update(updateData);
}

/**
 * Creates overage allocation documents atomically via batched write.
 * Each allocation links a donor envelope to a source transaction.
 */
export async function createAllocations(
  userId: string,
  sourceTransactionId: string,
  allocations: { donorEnvelopeId: string; amountCents: number }[],
): Promise<void> {
  const batch = requireDb().batch();

  for (const alloc of allocations) {
    const docRef = allocationsCol().doc();
    batch.set(docRef, {
      userId,
      sourceTransactionId,
      donorEnvelopeId: alloc.donorEnvelopeId,
      amountCents: alloc.amountCents,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
}

// ---------------------------------------------------------------------------
// Transfer CRUD operations
// ---------------------------------------------------------------------------

/**
 * Creates a fund transfer between two envelopes within a week.
 * Validates that both envelopes belong to the user, are different,
 * and that the source envelope has sufficient remaining balance.
 *
 * Uses runTransaction for the write + ownership check; remaining
 * computation happens before the transaction (Firestore transactions
 * cannot query collections).
 */
export async function createTransfer(
  userId: string,
  input: TransferInput,
  weekStart: string,
): Promise<EnvelopeTransfer> {
  const { fromEnvelopeId, toEnvelopeId, amountCents, note } = input;

  // Reject self-transfers before any Firestore calls
  if (fromEnvelopeId === toEnvelopeId) {
    throw new Error("Cannot transfer funds to the same envelope.");
  }

  // Compute source envelope remaining outside the transaction
  const { start, end } = getWeekRange(new Date(`${weekStart}T00:00:00`));
  const weekStartStr = format(start, "yyyy-MM-dd");
  const weekEndStr = format(end, "yyyy-MM-dd");

  const [txSnap, allocSnap, existingTransferSnap] = await Promise.all([
    transactionsForUserInWeek(userId, weekStartStr, weekEndStr).get(),
    allocationsCol().where("userId", "==", userId).get(),
    transfersCol()
      .where("userId", "==", userId)
      .where("weekStart", "==", weekStartStr)
      .get(),
  ]);

  // Compute spent for source envelope
  let spentCents = 0;
  const txEnvelopeMap = new Map<string, string>();
  for (const doc of txSnap.docs) {
    const data = doc.data();
    if (data.envelopeId === fromEnvelopeId) {
      spentCents += data.amountCents as number;
    }
    txEnvelopeMap.set(doc.id, data.envelopeId as string);
  }

  // Compute allocation adjustments for source envelope
  let receivedAllocationsCents = 0;
  let donatedAllocationsCents = 0;
  const txIds = new Set(txEnvelopeMap.keys());
  for (const doc of allocSnap.docs) {
    const data = doc.data();
    const sourceTxId = data.sourceTransactionId as string;
    if (!txIds.has(sourceTxId)) continue;

    if (data.donorEnvelopeId === fromEnvelopeId) {
      donatedAllocationsCents += data.amountCents as number;
    }
    const recipientId = txEnvelopeMap.get(sourceTxId);
    if (recipientId === fromEnvelopeId) {
      receivedAllocationsCents += data.amountCents as number;
    }
  }

  // Compute transfer adjustments for source envelope
  let sentTransfersCents = 0;
  let receivedTransfersCents = 0;
  for (const doc of existingTransferSnap.docs) {
    const data = doc.data();
    if (data.fromEnvelopeId === fromEnvelopeId) {
      sentTransfersCents += data.amountCents as number;
    }
    if (data.toEnvelopeId === fromEnvelopeId) {
      receivedTransfersCents += data.amountCents as number;
    }
  }

  // Read source envelope budget to compute remaining
  const fromEnvDoc = await envelopesCol().doc(fromEnvelopeId).get();
  if (!fromEnvDoc.exists || fromEnvDoc.data()?.userId !== userId) {
    throw new Error("Source envelope not found or access denied.");
  }
  const weeklyBudgetCents = fromEnvDoc.data()?.weeklyBudgetCents as number;

  const sourceRemaining =
    weeklyBudgetCents -
    spentCents +
    receivedAllocationsCents -
    donatedAllocationsCents +
    receivedTransfersCents -
    sentTransfersCents;

  if (amountCents > sourceRemaining) {
    throw new Error(
      `Transfer amount (${amountCents}) exceeds source envelope remaining (${sourceRemaining}).`,
    );
  }

  // Use transaction for ownership check + write
  const docRef = transfersCol().doc();
  await requireDb().runTransaction(async (transaction) => {
    const fromSnap = await transaction.get(envelopesCol().doc(fromEnvelopeId));
    const toSnap = await transaction.get(envelopesCol().doc(toEnvelopeId));

    if (!fromSnap.exists || fromSnap.data()?.userId !== userId) {
      throw new Error("Source envelope not found or access denied.");
    }
    if (!toSnap.exists || toSnap.data()?.userId !== userId) {
      throw new Error("Destination envelope not found or access denied.");
    }

    transaction.set(docRef, {
      userId,
      fromEnvelopeId,
      toEnvelopeId,
      amountCents,
      weekStart: weekStartStr,
      ...(note ? { note } : {}),
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  const snap = await docRef.get();
  return { id: docRef.id, ...snap.data() } as EnvelopeTransfer;
}

/**
 * Lists transfers for a user within a given week range, ordered by createdAt descending.
 *
 * NOTE: orderBy is done in JS rather than Firestore to avoid requiring a 3-field
 * composite index (userId + weekStart range + createdAt). The existing 2-field
 * index (userId ASC, weekStart ASC) handles the where clauses; JS sorts the
 * (typically small) result set by createdAt descending.
 */
export async function listTransfersForWeek(
  userId: string,
  weekStart: string,
  weekEnd: string,
): Promise<EnvelopeTransfer[]> {
  const snap = await transfersCol()
    .where("userId", "==", userId)
    .where("weekStart", ">=", weekStart)
    .where("weekStart", "<=", weekEnd)
    .get();

  const transfers = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as EnvelopeTransfer[];

  // Sort by createdAt descending (newest first) in JS
  transfers.sort((a, b) => {
    const aTime = a.createdAt?.toDate?.() ?? new Date(0);
    const bTime = b.createdAt?.toDate?.() ?? new Date(0);
    return bTime.getTime() - aTime.getTime();
  });

  return transfers;
}

// ---------------------------------------------------------------------------
// Income entry CRUD operations
// ---------------------------------------------------------------------------

/**
 * Creates a new income entry for the given user.
 * Computes weekStart from the entry date.
 */
export async function createIncomeEntry(
  userId: string,
  input: IncomeEntryInput,
): Promise<{ id: string }> {
  const entryDate = new Date(`${input.date}T00:00:00`);
  const weekStartDate = startOfWeek(entryDate, WEEK_OPTIONS);
  const weekStartStr = format(weekStartDate, "yyyy-MM-dd");

  const docRef = incomeEntriesCol().doc();
  await docRef.set({
    userId,
    amountCents: input.amountCents,
    description: input.description,
    date: input.date,
    weekStart: weekStartStr,
    createdAt: FieldValue.serverTimestamp(),
  });

  return { id: docRef.id };
}

/**
 * Lists income entries for a user within a given date range, ordered by date descending.
 */
export async function listIncomeEntriesForWeek(
  userId: string,
  weekStart: string,
  weekEnd: string,
): Promise<IncomeEntry[]> {
  const snap = await incomeEntriesForUserInWeek(userId, weekStart, weekEnd)
    .orderBy("date", "desc")
    .get();

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as IncomeEntry[];
}

/**
 * Deletes an income entry. Verifies ownership before deleting.
 */
export async function deleteIncomeEntry(
  userId: string,
  entryId: string,
): Promise<void> {
  const docRef = incomeEntriesCol().doc(entryId);
  const snap = await docRef.get();

  if (!snap.exists) {
    throw new Error("Income entry not found.");
  }
  if (snap.data()?.userId !== userId) {
    throw new Error("Income entry access denied.");
  }

  await docRef.delete();
}

// ---------------------------------------------------------------------------
// Income allocation CRUD operations
// ---------------------------------------------------------------------------

/**
 * Creates an income allocation — assigns extra income to a specific envelope.
 * Validates that:
 *  - The envelope belongs to the user (transaction check)
 *  - amountCents does not exceed unallocated income for the week
 */
export async function createIncomeAllocation(
  userId: string,
  input: IncomeAllocationInput,
  weekStart: string,
): Promise<IncomeAllocation> {
  const { start, end } = getWeekRange(new Date(`${weekStart}T00:00:00`));
  const weekStartStr = format(start, "yyyy-MM-dd");
  const weekEndStr = format(end, "yyyy-MM-dd");

  // Parallel fetch: income entries + existing allocations for the week
  const [incomeCents, existingAllocSnap] = await Promise.all([
    getWeeklyIncomeTotal(userId, weekStartStr, weekEndStr),
    incomeAllocationsCol()
      .where("userId", "==", userId)
      .where("weekStart", "==", weekStartStr)
      .get(),
  ]);

  const alreadyAllocated = existingAllocSnap.docs.reduce(
    (sum, doc) => sum + (doc.data().amountCents as number),
    0,
  );

  const unallocated = incomeCents - alreadyAllocated;
  if (input.amountCents > unallocated) {
    throw new Error(
      `Allocation amount (${input.amountCents}) exceeds unallocated income (${unallocated}).`,
    );
  }

  // Verify envelope ownership inside a transaction
  const docRef = incomeAllocationsCol().doc();
  await requireDb().runTransaction(async (transaction) => {
    const envSnap = await transaction.get(envelopesCol().doc(input.envelopeId));
    if (!envSnap.exists || envSnap.data()?.userId !== userId) {
      throw new Error("Envelope not found or access denied.");
    }

    transaction.set(docRef, {
      userId,
      envelopeId: input.envelopeId,
      amountCents: input.amountCents,
      weekStart: weekStartStr,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  const snap = await docRef.get();
  return { id: docRef.id, ...snap.data() } as IncomeAllocation;
}

/**
 * Lists income allocations for a user within a given week range, ordered by createdAt desc.
 */
export async function listIncomeAllocations(
  userId: string,
  weekStart: string,
  weekEnd: string,
): Promise<IncomeAllocation[]> {
  const snap = await incomeAllocationsCol()
    .where("userId", "==", userId)
    .where("weekStart", ">=", weekStart)
    .where("weekStart", "<=", weekEnd)
    .orderBy("createdAt", "desc")
    .get();

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as IncomeAllocation[];
}

/**
 * Returns total income cents for a user within a week range.
 */
export async function getWeeklyIncomeTotal(
  userId: string,
  weekStart: string,
  weekEnd: string,
): Promise<number> {
  const snap = await incomeEntriesForUserInWeek(
    userId,
    weekStart,
    weekEnd,
  ).get();

  return snap.docs.reduce(
    (sum, doc) => sum + (doc.data().amountCents as number),
    0,
  );
}

/**
 * Finds all overage allocations linked to a source transaction.
 * Returns the allocation document references for batch operations.
 */
export async function deleteAllocationsForTransaction(
  transactionId: string,
): Promise<FirebaseFirestore.DocumentReference[]> {
  const allocSnap = await allocationsCol()
    .where("sourceTransactionId", "==", transactionId)
    .get();
  return allocSnap.docs.map((d) => d.ref);
}

/**
 * Deletes a transaction. Verifies ownership before deleting.
 * Cascade-deletes any linked overage allocations atomically.
 */
export async function deleteTransaction(
  userId: string,
  transactionId: string,
): Promise<void> {
  const docRef = transactionsCol().doc(transactionId);
  const snap = await docRef.get();
  if (!snap.exists || snap.data()?.userId !== userId) {
    throw new Error("Transaction not found or access denied.");
  }

  // Cascade-delete linked overage allocations
  const allocRefs = await deleteAllocationsForTransaction(transactionId);

  if (allocRefs.length === 0) {
    await docRef.delete();
  } else {
    const batch = requireDb().batch();
    batch.delete(docRef);
    for (const ref of allocRefs) {
      batch.delete(ref);
    }
    await batch.commit();
  }
}

/**
 * Lists transactions for a user within a given week range, ordered by date descending.
 */
export async function listTransactionsForWeek(
  userId: string,
  weekStart: string,
  weekEnd: string,
): Promise<{ transactions: EnvelopeTransaction[] }> {
  const snap = await transactionsForUserInWeek(userId, weekStart, weekEnd)
    .orderBy("date", "desc")
    .get();

  const transactions = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as EnvelopeTransaction[];

  return { transactions };
}

/**
 * Returns enriched envelope list with spent/remaining/status for current week,
 * along with the week label and cumulative savings.
 */
export async function listEnvelopesWithRemaining(
  userId: string,
): Promise<Omit<HomePageData, "billing">> {
  const today = new Date();
  const { start, end } = getWeekRange(today);
  const weekStartStr = format(start, "yyyy-MM-dd");
  const weekEndStr = format(end, "yyyy-MM-dd");

  // Parallel fetch: envelopes, transactions, transfers, income, and income allocations for current week
  const [envSnap, txSnap, transferSnap, weeklyIncomeCents, incomeAllocSnap] =
    await Promise.all([
      envelopesForUser(userId).get(),
      transactionsForUserInWeek(userId, weekStartStr, weekEndStr).get(),
      transfersCol()
        .where("userId", "==", userId)
        .where("weekStart", "==", weekStartStr)
        .get(),
      getWeeklyIncomeTotal(userId, weekStartStr, weekEndStr),
      incomeAllocationsCol()
        .where("userId", "==", userId)
        .where("weekStart", "==", weekStartStr)
        .get(),
    ]);

  // Build transaction sums by envelopeId and map transaction IDs to envelope IDs
  const spentByEnvelope = new Map<string, number>();
  const txEnvelopeMap = new Map<string, string>(); // txId -> envelopeId
  for (const doc of txSnap.docs) {
    const data = doc.data();
    const envId = data.envelopeId as string;
    spentByEnvelope.set(
      envId,
      (spentByEnvelope.get(envId) ?? 0) + (data.amountCents as number),
    );
    txEnvelopeMap.set(doc.id, envId);
  }

  // Query allocations linked to current-week transactions
  const receivedByEnvelope = new Map<string, number>();
  const donatedByEnvelope = new Map<string, number>();

  const txIds = Array.from(txEnvelopeMap.keys());
  if (txIds.length > 0) {
    const envelopeIds = envSnap.docs.map((d) => d.id);

    // Fetch allocations where current-week transactions are the source
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

        // Donor envelope gives funds
        donatedByEnvelope.set(
          donorId,
          (donatedByEnvelope.get(donorId) ?? 0) + amount,
        );
        // Recipient envelope (the one with the overage) receives funds
        if (recipientId) {
          receivedByEnvelope.set(
            recipientId,
            (receivedByEnvelope.get(recipientId) ?? 0) + amount,
          );
        }
      }
    }

    // Fetch allocations where user's envelopes are donors, then filter to current-week transactions
    const txIdSet = new Set(txIds);
    for (let i = 0; i < envelopeIds.length; i += 30) {
      const chunk = envelopeIds.slice(i, i + 30);
      const allocSnap = await allocationsCol()
        .where("donorEnvelopeId", "in", chunk)
        .get();
      for (const allocDoc of allocSnap.docs) {
        const allocData = allocDoc.data();
        const sourceTxId = allocData.sourceTransactionId as string;
        // Only count allocations linked to current-week transactions
        if (!txIdSet.has(sourceTxId)) continue;
        const donorId = allocData.donorEnvelopeId as string;
        const amount = allocData.amountCents as number;
        const recipientId = txEnvelopeMap.get(sourceTxId);

        // Skip if already counted from the first query
        if (donatedByEnvelope.has(donorId)) continue;

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

  // Build transfer maps by envelope
  const receivedTransfersByEnvelope = new Map<string, number>();
  const sentTransfersByEnvelope = new Map<string, number>();
  for (const doc of transferSnap.docs) {
    const data = doc.data();
    const fromId = data.fromEnvelopeId as string;
    const toId = data.toEnvelopeId as string;
    const amount = data.amountCents as number;
    sentTransfersByEnvelope.set(
      fromId,
      (sentTransfersByEnvelope.get(fromId) ?? 0) + amount,
    );
    receivedTransfersByEnvelope.set(
      toId,
      (receivedTransfersByEnvelope.get(toId) ?? 0) + amount,
    );
  }

  // Add income allocations to receivedTransfersByEnvelope (they increase remaining just like received transfers)
  let allocatedIncomeCents = 0;
  for (const doc of incomeAllocSnap.docs) {
    const data = doc.data();
    const envId = data.envelopeId as string;
    const amount = data.amountCents as number;
    allocatedIncomeCents += amount;
    receivedTransfersByEnvelope.set(
      envId,
      (receivedTransfersByEnvelope.get(envId) ?? 0) + amount,
    );
  }

  // Fetch all historical transactions if any envelopes have rollover enabled
  const hasRolloverEnvelopes = envSnap.docs.some(
    (d) => d.data().rollover === true,
  );
  let allTxDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
  if (hasRolloverEnvelopes) {
    const allTxSnap = await transactionsCol()
      .where("userId", "==", userId)
      .get();
    allTxDocs = allTxSnap.docs;
  }

  // Enrich envelopes with computed fields
  const envelopes: EnvelopeWithStatus[] = envSnap.docs.map((doc) => {
    const data = doc.data() as Omit<Envelope, "id">;
    const spentCents = spentByEnvelope.get(doc.id) ?? 0;
    const received = receivedByEnvelope.get(doc.id) ?? 0;
    const donated = donatedByEnvelope.get(doc.id) ?? 0;
    const receivedTransfers = receivedTransfersByEnvelope.get(doc.id) ?? 0;
    const sentTransfers = sentTransfersByEnvelope.get(doc.id) ?? 0;

    // Compute rollover surplus for rollover-enabled envelopes
    const createdAtDate = data.createdAt?.toDate?.() ?? new Date();
    const envelopeCreatedAt = format(createdAtDate, "yyyy-MM-dd");
    const rolloverSurplusCents = data.rollover
      ? computeRolloverSurplus(
          {
            weeklyBudgetCents: data.weeklyBudgetCents,
            rollover: true,
            createdAt: envelopeCreatedAt,
          },
          allTxDocs
            .filter((t) => t.data().envelopeId === doc.id)
            .map((t) => ({
              amountCents: t.data().amountCents as number,
              date: t.data().date as string,
            })),
          weekStartStr,
        )
      : 0;

    const { remainingCents, status } = computeEnvelopeStatus(
      data.weeklyBudgetCents + rolloverSurplusCents, // effective budget includes rollover
      spentCents,
      today,
      received,
      donated,
      receivedTransfers,
      sentTransfers,
    );

    return {
      id: doc.id,
      ...data,
      spentCents,
      remainingCents,
      status,
      rolloverSurplusCents,
    } as EnvelopeWithStatus;
  });

  const cumulativeSavingsCents = await computeCumulativeSavings(userId);

  return {
    envelopes,
    weekLabel: formatWeekLabel(today),
    cumulativeSavingsCents,
    weeklyIncomeCents,
    allocatedIncomeCents,
  };
}

/**
 * Computes total cumulative savings from all completed past weeks.
 * Only non-rollover envelopes contribute to savings.
 * Per-envelope savings are floored at 0 per week.
 */
export async function computeCumulativeSavings(
  userId: string,
): Promise<number> {
  const envSnap = await envelopesForUser(userId).get();

  if (envSnap.empty) return 0;

  // Find earliest createdAt across all envelopes
  let earliestDate: Date | null = null;
  const envelopeData: SavingsEnvelope[] = [];

  for (const doc of envSnap.docs) {
    const data = doc.data();
    const createdAt = data.createdAt?.toDate?.() ?? new Date();
    if (!earliestDate || createdAt < earliestDate) {
      earliestDate = createdAt;
    }
    envelopeData.push({
      id: doc.id,
      weeklyBudgetCents: data.weeklyBudgetCents as number,
      rollover: data.rollover as boolean,
      createdAt: format(createdAt, "yyyy-MM-dd"),
    });
  }

  const earliest = earliestDate as Date;
  const earliestWeekStart = startOfWeek(earliest, WEEK_OPTIONS);
  const currentWeekStart = startOfWeek(new Date(), WEEK_OPTIONS);

  const earliestStr = format(earliestWeekStart, "yyyy-MM-dd");
  const currentStr = format(currentWeekStart, "yyyy-MM-dd");

  if (earliestStr >= currentStr) return 0;

  // Fetch all transactions in the range
  const txSnap = await transactionsCol()
    .where("userId", "==", userId)
    .where("date", ">=", earliestStr)
    .where("date", "<", currentStr)
    .get();

  const transactions = txSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      envelopeId: data.envelopeId as string,
      amountCents: data.amountCents as number,
      date: data.date as string,
    };
  });

  return computeCumulativeSavingsFromData(
    envelopeData,
    transactions,
    earliestStr,
    currentStr,
  );
}

/**
 * Computes all analytics data for a user in a single batch.
 * Uses parallel Firestore queries for efficiency (no N+1).
 *
 * NOTE: Summary on-track count uses raw spending (no overage allocations).
 * This is a simplification for the analytics overview. The home page shows
 * allocation-adjusted status.
 */
export async function getAnalyticsData(
  userId: string,
): Promise<Omit<AnalyticsPageData, "billing">> {
  const today = new Date();
  const { start, end } = getWeekRange(today);
  const weekStartStr = format(start, "yyyy-MM-dd");
  const weekEndStr = format(end, "yyyy-MM-dd");

  // 1. Parallel fetch: envelopes + current-week transactions + ALL transactions + ALL income entries + current-week allocations
  const [envSnap, currentTxSnap, allTxSnap, allIncomeSnap, currentAllocSnap] =
    await Promise.all([
      envelopesForUser(userId).get(),
      transactionsForUserInWeek(userId, weekStartStr, weekEndStr).get(),
      transactionsCol().where("userId", "==", userId).get(),
      incomeEntriesCol().where("userId", "==", userId).get(),
      incomeAllocationsCol()
        .where("userId", "==", userId)
        .where("weekStart", "==", weekStartStr)
        .get(),
    ]);

  // 2. Parse envelope data
  const envelopeHeaders = envSnap.docs.map((doc) => ({
    id: doc.id,
    title: doc.data().title as string,
  }));

  const envelopeData = envSnap.docs.map((doc) => {
    const data = doc.data();
    const createdAt = data.createdAt?.toDate?.() ?? new Date();
    return {
      id: doc.id,
      weeklyBudgetCents: data.weeklyBudgetCents as number,
      rollover: data.rollover as boolean,
      createdAt: format(createdAt, "yyyy-MM-dd"),
    };
  });

  // 3. Compute SUMMARY from current-week transactions
  const spentByEnvelope = new Map<string, number>();
  for (const doc of currentTxSnap.docs) {
    const data = doc.data();
    const envId = data.envelopeId as string;
    spentByEnvelope.set(
      envId,
      (spentByEnvelope.get(envId) ?? 0) + (data.amountCents as number),
    );
  }

  let totalSpentCents = 0;
  let totalBudgetCents = 0;
  let onTrackCount = 0;

  for (const env of envelopeData) {
    const spent = spentByEnvelope.get(env.id) ?? 0;
    totalSpentCents += spent;
    totalBudgetCents += env.weeklyBudgetCents;
    const { status } = computeEnvelopeStatus(
      env.weeklyBudgetCents,
      spent,
      today,
    );
    if (status === "On Track") onTrackCount++;
  }

  // Sum allocated income for current week
  const analyticsAllocatedIncome = currentAllocSnap.docs.reduce(
    (sum, doc) => sum + (doc.data().amountCents as number),
    0,
  );

  const summary = {
    totalSpentCents,
    totalBudgetCents: totalBudgetCents + analyticsAllocatedIncome,
    totalRemainingCents:
      totalBudgetCents + analyticsAllocatedIncome - totalSpentCents,
    onTrackCount,
    totalEnvelopeCount: envelopeData.length,
  };

  // 4. Parse ALL transactions for pivot table and savings
  const allTransactions = allTxSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      envelopeId: data.envelopeId as string,
      amountCents: data.amountCents as number,
      date: data.date as string,
    };
  });

  // 5. Compute PIVOT TABLE
  let earliestDate = weekStartStr;
  for (const env of envelopeData) {
    if (env.createdAt < earliestDate) earliestDate = env.createdAt;
  }
  for (const tx of allTransactions) {
    if (tx.date < earliestDate) earliestDate = tx.date;
  }
  const earliestWeekStart = format(
    startOfWeek(new Date(`${earliestDate}T00:00:00`), WEEK_OPTIONS),
    "yyyy-MM-dd",
  );

  const pivotRows = buildPivotRows(
    allTransactions,
    earliestWeekStart,
    weekEndStr,
  );

  // 6. Compute SAVINGS BREAKDOWN
  const savingsByWeek = computeWeeklySavingsBreakdown(
    envelopeData,
    allTransactions,
    earliestWeekStart,
    weekStartStr,
  );

  // 7. Compute SPENDING BY ENVELOPE (budget utilization bar chart)
  const spendingByEnvelope = envelopeData.map((env) => {
    const spentCents = spentByEnvelope.get(env.id) ?? 0;
    const budgetCents = env.weeklyBudgetCents;
    const percentUsed =
      budgetCents > 0 ? Math.round((spentCents / budgetCents) * 100) : 0;
    const header = envelopeHeaders.find((h) => h.id === env.id);
    return {
      envelopeId: env.id,
      title: header?.title ?? env.id,
      spentCents,
      budgetCents,
      percentUsed,
    };
  });
  // Sort descending by percentUsed (most utilized first)
  spendingByEnvelope.sort((a, b) => b.percentUsed - a.percentUsed);

  // 8. Compute WEEKLY TOTALS (spending trend line chart)
  const totalBudgetCentsAllEnvelopes = envelopeData.reduce(
    (sum, env) => sum + env.weeklyBudgetCents,
    0,
  );
  const weeklyTotals: {
    weekStart: string;
    weekLabel: string;
    totalSpentCents: number;
    totalBudgetCents: number;
  }[] = [];
  let iterWeek = earliestWeekStart;
  // Include current week (unlike savings which only counts completed weeks)
  const nextWeekAfterCurrent = format(
    addWeeks(new Date(`${weekStartStr}T00:00:00`), 1),
    "yyyy-MM-dd",
  );
  while (iterWeek < nextWeekAfterCurrent) {
    const iterWeekDate = new Date(`${iterWeek}T00:00:00`);
    const nextWeekDate = addWeeks(iterWeekDate, 1);
    const iterWeekEnd = format(
      new Date(nextWeekDate.getTime() - 86_400_000),
      "yyyy-MM-dd",
    );

    const weekTxs = allTransactions.filter(
      (t) => t.date >= iterWeek && t.date <= iterWeekEnd,
    );
    const totalSpent = weekTxs.reduce((sum, t) => sum + t.amountCents, 0);

    const weekNumber = getWeekNumber(iterWeekDate);
    weeklyTotals.push({
      weekStart: iterWeek,
      weekLabel: `Wk ${weekNumber}`,
      totalSpentCents: totalSpent,
      totalBudgetCents: totalBudgetCentsAllEnvelopes,
    });

    iterWeek = format(nextWeekDate, "yyyy-MM-dd");
  }

  // 9. Parse ALL income entries and compute WEEKLY INCOME
  const allIncomeEntries = allIncomeSnap.docs.map((doc) => ({
    amountCents: doc.data().amountCents as number,
    date: doc.data().date as string,
  }));

  const weeklyIncome: WeeklyIncomeEntry[] = [];
  let incomeIterWeek = earliestWeekStart;
  while (incomeIterWeek < nextWeekAfterCurrent) {
    const iterWeekDate = new Date(`${incomeIterWeek}T00:00:00`);
    const nextWeekDate = addWeeks(iterWeekDate, 1);
    const iterWeekEnd = format(
      new Date(nextWeekDate.getTime() - 86_400_000),
      "yyyy-MM-dd",
    );

    const weekIncomeEntries = allIncomeEntries.filter(
      (e) => e.date >= incomeIterWeek && e.date <= iterWeekEnd,
    );
    const totalIncome = weekIncomeEntries.reduce(
      (sum, e) => sum + e.amountCents,
      0,
    );

    const weekNumber = getWeekNumber(iterWeekDate);
    weeklyIncome.push({
      weekStart: incomeIterWeek,
      weekLabel: `Wk ${weekNumber}`,
      totalIncomeCents: totalIncome,
    });

    incomeIterWeek = format(nextWeekDate, "yyyy-MM-dd");
  }

  return {
    summary,
    envelopes: envelopeHeaders,
    pivotRows,
    savingsByWeek,
    spendingByEnvelope,
    weeklyTotals,
    weeklyIncome,
  };
}
