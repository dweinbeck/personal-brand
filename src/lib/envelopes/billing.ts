import { format, startOfWeek } from "date-fns";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase";
import { debitForToolUse } from "@/lib/billing/firestore";
import type { EnvelopeAccessResult, EnvelopeBilling } from "@/lib/envelopes/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Week starts Sunday -- same convention as week-math.ts. */
const WEEK_OPTIONS = { weekStartsOn: 0 as const };

/** Matches the toolKey in billing_tool_pricing collection. */
const ENVELOPE_TOOL_KEY = "dave_ramsey";

// ---------------------------------------------------------------------------
// Collection helper
// ---------------------------------------------------------------------------

function envelopeBillingCol() {
  if (!db) {
    throw new Error("Firestore not available.");
  }
  return db.collection("envelope_billing");
}

// ---------------------------------------------------------------------------
// Main access check
// ---------------------------------------------------------------------------

/**
 * Determines whether a user has read-write or read-only access to envelopes
 * for the current week.
 *
 * Logic:
 * 1. Get-or-create the user's envelope billing doc.
 * 2. If this is the user's first-ever week (free trial) -> readwrite.
 * 3. If the current week is already paid -> readwrite.
 * 4. Attempt to charge via debitForToolUse().
 *    - Success -> record payment, return readwrite.
 *    - 402 (insufficient credits) -> return readonly.
 *    - Other errors -> re-throw.
 */
export async function checkEnvelopeAccess(
  uid: string,
  email: string,
): Promise<EnvelopeAccessResult> {
  const currentWeekStart = format(
    startOfWeek(new Date(), WEEK_OPTIONS),
    "yyyy-MM-dd",
  );

  // --- Step 1: Get-or-create billing doc inside a transaction ---
  const firestore = db;
  if (!firestore) {
    throw new Error("Firestore not available.");
  }

  const billingDoc = await firestore.runTransaction(async (txn) => {
    const docRef = envelopeBillingCol().doc(uid);
    const snap = await txn.get(docRef);

    if (snap.exists) {
      return snap.data() as EnvelopeBilling;
    }

    const newDoc: Omit<EnvelopeBilling, "createdAt" | "updatedAt"> & {
      createdAt: FirebaseFirestore.FieldValue;
      updatedAt: FirebaseFirestore.FieldValue;
    } = {
      uid,
      firstAccessWeekStart: currentWeekStart,
      paidWeeks: {},
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    txn.set(docRef, newDoc);

    return {
      uid,
      firstAccessWeekStart: currentWeekStart,
      paidWeeks: {},
    } as unknown as EnvelopeBilling;
  });

  // --- Step 2: Free week check ---
  if (billingDoc.firstAccessWeekStart === currentWeekStart) {
    return { mode: "readwrite", weekStart: currentWeekStart, reason: "free_week" };
  }

  // --- Step 3: Already paid check ---
  if (billingDoc.paidWeeks?.[currentWeekStart]) {
    return { mode: "readwrite", weekStart: currentWeekStart };
  }

  // --- Step 4: Attempt charge ---
  try {
    const result = await debitForToolUse({
      uid,
      email,
      toolKey: ENVELOPE_TOOL_KEY,
      idempotencyKey: `envelope_week_${currentWeekStart}`,
    });

    // Record the paid week
    const docRef = envelopeBillingCol().doc(uid);
    await docRef.update({
      [`paidWeeks.${currentWeekStart}`]: {
        usageId: result.usageId,
        creditsCharged: result.creditsCharged,
        chargedAt: FieldValue.serverTimestamp(),
      },
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { mode: "readwrite", weekStart: currentWeekStart };
  } catch (error: unknown) {
    // --- Step 5: 402 -> readonly ---
    if (
      error instanceof Error &&
      (error as Error & { statusCode?: number }).statusCode === 402
    ) {
      return { mode: "readonly", weekStart: currentWeekStart, reason: "unpaid" };
    }

    // --- Step 6: Other errors -> re-throw ---
    throw error;
  }
}
