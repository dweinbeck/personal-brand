import { format, startOfWeek } from "date-fns";
import { FieldValue } from "firebase-admin/firestore";
import { debitForToolUse } from "@/lib/billing/firestore";
import { db } from "@/lib/firebase";

// ---------------------------------------------------------------------------
// Types (inline — mirrors EnvelopeBilling / EnvelopeAccessResult)
// ---------------------------------------------------------------------------

/** Tracks per-user tasks billing state in Firestore: tasks_billing/{uid}. */
export type TasksBilling = {
  uid: string;
  firstAccessWeekStart: string; // YYYY-MM-DD (Sunday of first-ever access)
  paidWeeks: Record<
    string,
    {
      usageId: string;
      creditsCharged: number;
      chargedAt: FirebaseFirestore.Timestamp;
    }
  >;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
};

/** Result of billing access check for tasks routes. */
export type TasksAccessResult =
  | { mode: "readwrite"; weekStart: string; reason?: "free_week" }
  | { mode: "readonly"; weekStart: string; reason: "unpaid" };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Week starts Sunday — same convention as envelopes. */
const WEEK_OPTIONS = { weekStartsOn: 0 as const };

/** Matches the toolKey in billing_tool_pricing collection. */
const TASKS_TOOL_KEY = "tasks_app";

// ---------------------------------------------------------------------------
// Collection helper
// ---------------------------------------------------------------------------

function tasksBillingCol() {
  if (!db) {
    throw new Error("Firestore not available.");
  }
  return db.collection("tasks_billing");
}

// ---------------------------------------------------------------------------
// Main access check
// ---------------------------------------------------------------------------

/**
 * Determines whether a user has read-write or read-only access to tasks
 * for the current week.
 *
 * Logic:
 * 1. Get-or-create the user's tasks billing doc.
 * 2. If this is the user's first-ever week (free trial) -> readwrite.
 * 3. If the current week is already paid -> readwrite.
 * 4. Attempt to charge via debitForToolUse().
 *    - Success -> record payment, return readwrite.
 *    - 402 (insufficient credits) -> return readonly.
 *    - Other errors -> re-throw.
 */
export async function checkTasksAccess(
  uid: string,
  email: string,
): Promise<TasksAccessResult> {
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
    const docRef = tasksBillingCol().doc(uid);
    const snap = await txn.get(docRef);

    if (snap.exists) {
      return snap.data() as TasksBilling;
    }

    const newDoc: Omit<TasksBilling, "createdAt" | "updatedAt"> & {
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
    } as unknown as TasksBilling;
  });

  // --- Step 2: Free week check ---
  if (billingDoc.firstAccessWeekStart === currentWeekStart) {
    return {
      mode: "readwrite",
      weekStart: currentWeekStart,
      reason: "free_week",
    };
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
      toolKey: TASKS_TOOL_KEY,
      idempotencyKey: `tasks_week_${currentWeekStart}`,
    });

    // Record the paid week
    const docRef = tasksBillingCol().doc(uid);
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
      return {
        mode: "readonly",
        weekStart: currentWeekStart,
        reason: "unpaid",
      };
    }

    // --- Step 6: Tool config error -> readonly (degrade gracefully) ---
    if (error instanceof Error) {
      const msg = error.message;
      if (msg.startsWith("Unknown tool:") || msg.includes("is not active")) {
        console.warn(
          `Tasks billing: tool config error, falling back to readonly — ${msg}`,
        );
        return {
          mode: "readonly",
          weekStart: currentWeekStart,
          reason: "unpaid",
        };
      }
    }

    // --- Step 7: Other errors -> re-throw ---
    throw error;
  }
}
