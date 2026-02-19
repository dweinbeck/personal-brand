import "server-only";

import { auth } from "@/lib/firebase";
import { checkTasksAccess } from "@/lib/billing/tasks";

export type BillingStatus = {
  mode: "readwrite" | "readonly";
  reason?: "free_week" | "unpaid";
  weekStart: string;
};

/**
 * Checks billing access for Tasks by calling the personal-brand billing
 * module directly (no HTTP call). Takes an idToken, decodes it to get
 * uid/email, then calls checkTasksAccess().
 *
 * Replaces the todoist version that made HTTP calls to BILLING_API_URL.
 */
export async function checkBillingAccess(
  idToken: string,
): Promise<BillingStatus> {
  if (!auth) {
    console.warn("Firebase Auth not available -- defaulting to readwrite");
    return { mode: "readwrite", weekStart: "" };
  }

  try {
    const decoded = await auth.verifyIdToken(idToken);
    const uid = decoded.uid;
    const email = decoded.email ?? "";

    const access = await checkTasksAccess(uid, email);
    return {
      mode: access.mode,
      reason: "reason" in access ? access.reason : undefined,
      weekStart: access.weekStart,
    };
  } catch (e) {
    console.error("Billing check error:", e);
    return { mode: "readwrite", weekStart: "" };
  }
}

/**
 * Guards a server action based on billing status.
 * Returns an error object if the user is in readonly mode, null otherwise.
 * Identical to the todoist version.
 */
export function billingGuard(
  billing: BillingStatus,
): { error: string; code: number } | null {
  if (billing.mode === "readonly") {
    return {
      error: "Insufficient credits. Purchase credits to continue.",
      code: 402,
    };
  }
  return null;
}
