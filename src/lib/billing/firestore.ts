import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase";
import type {
  BillingMeResponse,
  BillingUser,
  DebitResult,
  LedgerEntry,
  Purchase,
  ToolPricing,
  ToolUsage,
} from "./types";

// ── Collection helpers ─────────────────────────────────────────

function requireDb() {
  if (!db) {
    throw new Error("Firestore not available.");
  }
  return db;
}

function billingUsersCol() {
  return requireDb().collection("billing_users");
}

function ledgerCol(uid: string) {
  return billingUsersCol().doc(uid).collection("ledger");
}

function toolPricingCol() {
  return requireDb().collection("billing_tool_pricing");
}

function toolUsageCol() {
  return requireDb().collection("billing_tool_usage");
}

function purchasesCol() {
  return requireDb().collection("billing_purchases");
}

function stripeEventsCol() {
  return requireDb().collection("billing_stripe_events");
}

function idempotencyCol() {
  return requireDb().collection("billing_idempotency");
}

// ── Signup grant + ensure user ─────────────────────────────────

const SIGNUP_GRANT_CREDITS = 100;

export async function ensureBillingUser({
  uid,
  email,
}: {
  uid: string;
  email: string;
}): Promise<BillingUser> {
  const firestore = requireDb();
  const userRef = billingUsersCol().doc(uid);

  return firestore.runTransaction(async (txn) => {
    const snap = await txn.get(userRef);

    if (snap.exists) {
      return snap.data() as BillingUser;
    }

    const now = FieldValue.serverTimestamp();
    const newUser = {
      uid,
      email,
      balanceCredits: SIGNUP_GRANT_CREDITS,
      createdAt: now,
      updatedAt: now,
      lifetimePurchasedCredits: 0,
      lifetimeSpentCredits: 0,
      lifetimeCostToUsCents: 0,
    };

    txn.set(userRef, newUser);

    txn.set(ledgerCol(uid).doc(), {
      type: "signup_grant",
      deltaCredits: SIGNUP_GRANT_CREDITS,
      reason: "Welcome bonus — 100 free credits.",
      createdAt: now,
    });

    return { ...newUser, createdAt: now, updatedAt: now } as BillingUser;
  });
}

// ── Balance + pricing reads ────────────────────────────────────

export async function getBalance(uid: string): Promise<number> {
  const snap = await billingUsersCol().doc(uid).get();
  if (!snap.exists) return 0;
  return (snap.data() as BillingUser).balanceCredits;
}

export async function getActivePricing(): Promise<ToolPricing[]> {
  const snap = await toolPricingCol().where("active", "==", true).get();
  return snap.docs.map((d) => d.data() as ToolPricing);
}

export async function getAllPricing(): Promise<ToolPricing[]> {
  const snap = await toolPricingCol().get();
  return snap.docs.map((d) => d.data() as ToolPricing);
}

export async function getBillingMe({
  uid,
  email,
}: {
  uid: string;
  email: string;
}): Promise<BillingMeResponse> {
  const user = await ensureBillingUser({ uid, email });
  const pricing = await getActivePricing();

  return {
    balanceCredits: user.balanceCredits,
    pricing: pricing.map((p) => ({
      toolKey: p.toolKey,
      label: p.label,
      creditsPerUse: p.creditsPerUse,
      active: p.active,
    })),
  };
}

// ── Debit for tool use ─────────────────────────────────────────

export async function debitForToolUse({
  uid,
  email,
  toolKey,
  idempotencyKey,
}: {
  uid: string;
  email: string;
  toolKey: string;
  idempotencyKey: string;
}): Promise<DebitResult> {
  const firestore = requireDb();
  const idemKey = `${uid}_${idempotencyKey}`;
  const idemRef = idempotencyCol().doc(idemKey);
  const userRef = billingUsersCol().doc(uid);
  const pricingRef = toolPricingCol().doc(toolKey);

  return firestore.runTransaction(async (txn) => {
    // 1. Idempotency check
    const idemSnap = await txn.get(idemRef);
    if (idemSnap.exists) {
      const cached = idemSnap.data() as {
        usageId: string;
        creditsCharged: number;
        balanceAfter: number;
      };
      return {
        usageId: cached.usageId,
        creditsCharged: cached.creditsCharged,
        balanceAfter: cached.balanceAfter,
      };
    }

    // 2. Ensure billing user exists
    const userSnap = await txn.get(userRef);
    const now = FieldValue.serverTimestamp();

    if (!userSnap.exists) {
      txn.set(userRef, {
        uid,
        email,
        balanceCredits: SIGNUP_GRANT_CREDITS,
        createdAt: now,
        updatedAt: now,
        lifetimePurchasedCredits: 0,
        lifetimeSpentCredits: 0,
        lifetimeCostToUsCents: 0,
      });
      txn.set(ledgerCol(uid).doc(), {
        type: "signup_grant",
        deltaCredits: SIGNUP_GRANT_CREDITS,
        reason: "Welcome bonus — 100 free credits.",
        createdAt: now,
      });
    }

    const balance = userSnap.exists
      ? (userSnap.data() as BillingUser).balanceCredits
      : SIGNUP_GRANT_CREDITS;

    // 3. Check pricing
    const pricingSnap = await txn.get(pricingRef);
    if (!pricingSnap.exists) {
      throw new Error(`Unknown tool: ${toolKey}`);
    }
    const pricing = pricingSnap.data() as ToolPricing;
    if (!pricing.active) {
      throw new Error(`Tool "${toolKey}" is not active.`);
    }

    // 4. Balance check
    if (balance < pricing.creditsPerUse) {
      const err = new Error("Insufficient credits.");
      (err as Error & { statusCode: number }).statusCode = 402;
      throw err;
    }

    // 5. Debit
    const balanceAfter = balance - pricing.creditsPerUse;
    const usageRef = toolUsageCol().doc();
    const usageId = usageRef.id;

    txn.update(userRef, {
      balanceCredits: balanceAfter,
      lifetimeSpentCredits: FieldValue.increment(pricing.creditsPerUse),
      lifetimeCostToUsCents: FieldValue.increment(
        pricing.costToUsCentsEstimate,
      ),
      updatedAt: now,
    });

    txn.set(ledgerCol(uid).doc(), {
      type: "debit",
      deltaCredits: -pricing.creditsPerUse,
      reason: `Tool use: ${pricing.label}`,
      toolKey,
      usageId,
      createdAt: now,
    });

    txn.set(usageRef, {
      uid,
      toolKey,
      creditsCharged: pricing.creditsPerUse,
      costToUsCentsEstimate: pricing.costToUsCentsEstimate,
      status: "started",
      idempotencyKey,
      createdAt: now,
      updatedAt: now,
    });

    txn.set(idemRef, {
      toolKey,
      usageId,
      creditsCharged: pricing.creditsPerUse,
      balanceAfter,
      status: "started",
      createdAt: now,
    });

    return { usageId, creditsCharged: pricing.creditsPerUse, balanceAfter };
  });
}

// ── Usage status updates ───────────────────────────────────────

export async function markUsageSucceeded({
  usageId,
  externalJobId,
}: {
  usageId: string;
  externalJobId?: string;
}): Promise<void> {
  const ref = toolUsageCol().doc(usageId);
  const update: Record<string, unknown> = {
    status: "succeeded",
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (externalJobId) {
    update.externalJobId = externalJobId;
  }
  await ref.update(update);
}

export async function refundUsage({
  usageId,
  reason,
}: {
  usageId: string;
  reason: string;
}): Promise<void> {
  const firestore = requireDb();
  const usageRef = toolUsageCol().doc(usageId);

  await firestore.runTransaction(async (txn) => {
    const usageSnap = await txn.get(usageRef);
    if (!usageSnap.exists) {
      throw new Error(`Usage ${usageId} not found.`);
    }

    const usage = usageSnap.data() as ToolUsage;
    if (usage.status === "refunded") {
      return; // Already refunded — idempotent
    }
    if (
      usage.status !== "started" &&
      usage.status !== "failed" &&
      usage.status !== "succeeded"
    ) {
      throw new Error(`Cannot refund usage in status "${usage.status}".`);
    }

    const userRef = billingUsersCol().doc(usage.uid);
    const now = FieldValue.serverTimestamp();

    txn.update(usageRef, { status: "refunded", updatedAt: now });

    txn.update(userRef, {
      balanceCredits: FieldValue.increment(usage.creditsCharged),
      lifetimeSpentCredits: FieldValue.increment(-usage.creditsCharged),
      lifetimeCostToUsCents: FieldValue.increment(-usage.costToUsCentsEstimate),
      updatedAt: now,
    });

    txn.set(ledgerCol(usage.uid).doc(), {
      type: "refund",
      deltaCredits: usage.creditsCharged,
      reason,
      toolKey: usage.toolKey,
      usageId,
      createdAt: now,
    });
  });
}

// ── Stripe purchase application ────────────────────────────────

export async function applyPurchaseFromStripe({
  uid,
  email,
  stripeSessionId,
  stripeEventId,
  usdCents,
  credits,
}: {
  uid: string;
  email: string;
  stripeSessionId: string;
  stripeEventId: string;
  usdCents: number;
  credits: number;
}): Promise<void> {
  const firestore = requireDb();
  const eventRef = stripeEventsCol().doc(stripeEventId);
  const purchaseRef = purchasesCol().doc(stripeSessionId);
  const userRef = billingUsersCol().doc(uid);

  await firestore.runTransaction(async (txn) => {
    // Idempotency: skip if event already processed
    const eventSnap = await txn.get(eventRef);
    if (eventSnap.exists) return;

    const purchaseSnap = await txn.get(purchaseRef);
    if (purchaseSnap.exists) return;

    // Ensure user exists
    const userSnap = await txn.get(userRef);
    const now = FieldValue.serverTimestamp();

    if (!userSnap.exists) {
      txn.set(userRef, {
        uid,
        email,
        balanceCredits: SIGNUP_GRANT_CREDITS + credits,
        createdAt: now,
        updatedAt: now,
        lifetimePurchasedCredits: credits,
        lifetimeSpentCredits: 0,
        lifetimeCostToUsCents: 0,
      });
      txn.set(ledgerCol(uid).doc(), {
        type: "signup_grant",
        deltaCredits: SIGNUP_GRANT_CREDITS,
        reason: "Welcome bonus — 100 free credits.",
        createdAt: now,
      });
    } else {
      txn.update(userRef, {
        balanceCredits: FieldValue.increment(credits),
        lifetimePurchasedCredits: FieldValue.increment(credits),
        updatedAt: now,
      });
    }

    txn.set(ledgerCol(uid).doc(), {
      type: "purchase",
      deltaCredits: credits,
      reason: `Purchased ${credits} credits for $${(usdCents / 100).toFixed(2)}.`,
      purchaseSessionId: stripeSessionId,
      stripeEventId,
      createdAt: now,
    });

    txn.set(purchaseRef, {
      uid,
      email,
      usdCents,
      creditsGranted: credits,
      status: "paid",
      stripeEventId,
      createdAt: now,
    });

    txn.set(eventRef, {
      stripeSessionId,
      createdAt: now,
    });
  });
}

// ── Admin operations ───────────────────────────────────────────

export async function adminAdjustCredits({
  uid,
  deltaCredits,
  reason,
  adminEmail,
}: {
  uid: string;
  deltaCredits: number;
  reason: string;
  adminEmail: string;
}): Promise<{ balanceAfter: number }> {
  const firestore = requireDb();
  const userRef = billingUsersCol().doc(uid);

  return firestore.runTransaction(async (txn) => {
    const snap = await txn.get(userRef);
    if (!snap.exists) {
      throw new Error(`Billing user ${uid} not found.`);
    }

    const user = snap.data() as BillingUser;
    const balanceAfter = user.balanceCredits + deltaCredits;

    if (balanceAfter < 0) {
      throw new Error(
        `Adjustment would result in negative balance (${balanceAfter}).`,
      );
    }

    const now = FieldValue.serverTimestamp();

    txn.update(userRef, {
      balanceCredits: balanceAfter,
      updatedAt: now,
    });

    txn.set(ledgerCol(uid).doc(), {
      type: "admin_adjustment",
      deltaCredits,
      reason: `[${adminEmail}] ${reason}`,
      createdAt: now,
    });

    return { balanceAfter };
  });
}

// ── Query helpers ──────────────────────────────────────────────

export async function getUserLedger(
  uid: string,
  limit = 20,
): Promise<(LedgerEntry & { id: string })[]> {
  const snap = await ledgerCol(uid)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as LedgerEntry) }));
}

export async function getUserUsage(
  uid: string,
  limit = 20,
): Promise<(ToolUsage & { id: string })[]> {
  const snap = await toolUsageCol()
    .where("uid", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as ToolUsage) }));
}

export async function getUserPurchases(
  uid: string,
  limit = 20,
): Promise<(Purchase & { id: string })[]> {
  const snap = await purchasesCol()
    .where("uid", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Purchase) }));
}

export async function listBillingUsers(): Promise<
  (BillingUser & { id: string })[]
> {
  const snap = await billingUsersCol().get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as BillingUser) }));
}

export async function getBillingUser(uid: string): Promise<BillingUser | null> {
  const snap = await billingUsersCol().doc(uid).get();
  if (!snap.exists) return null;
  return snap.data() as BillingUser;
}

export async function updateToolPricing(data: {
  toolKey: string;
  creditsPerUse: number;
  costToUsCentsEstimate: number;
  active: boolean;
}): Promise<void> {
  const ref = toolPricingCol().doc(data.toolKey);
  await ref.set(
    {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

export async function findUsageByExternalJobId({
  uid,
  externalJobId,
}: {
  uid: string;
  externalJobId: string;
}): Promise<(ToolUsage & { id: string }) | null> {
  const snap = await toolUsageCol()
    .where("uid", "==", uid)
    .where("externalJobId", "==", externalJobId)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...(doc.data() as ToolUsage) };
}
