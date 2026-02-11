import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase";

// -- Collection helpers -------------------------------------------------------

function requireDb() {
  if (!db) {
    throw new Error("Firestore not available.");
  }
  return db;
}

function historyCol() {
  return requireDb().collection("scrape_history");
}

// -- History operations -------------------------------------------------------

/**
 * Persist a new scrape history record when a job is successfully submitted.
 * Document ID is `${uid}_${jobId}` for idempotency (safe for retries).
 */
export async function addHistoryEntry({
  uid,
  jobId,
  siteUrl,
}: {
  uid: string;
  jobId: string;
  siteUrl: string;
}): Promise<void> {
  const docId = `${uid}_${jobId}`;
  const now = FieldValue.serverTimestamp();

  await historyCol().doc(docId).set({
    uid,
    jobId,
    siteUrl,
    status: "queued",
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * Update the status of an existing history record when a job reaches a
 * terminal state (succeeded, partial, failed).
 * Silently returns if the record does not exist (e.g. history write was lost).
 */
export async function updateHistoryStatus({
  uid,
  jobId,
  status,
}: {
  uid: string;
  jobId: string;
  status: string;
}): Promise<void> {
  const docId = `${uid}_${jobId}`;
  const ref = historyCol().doc(docId);

  const snap = await ref.get();
  if (!snap.exists) return;

  await ref.update({
    status,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Retrieve a user's scrape history sorted newest-first.
 * Firestore Timestamps are converted to ISO strings for JSON serialization.
 */
export async function getUserHistory(
  uid: string,
  limit = 20,
): Promise<
  {
    id: string;
    jobId: string;
    siteUrl: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }[]
> {
  const snap = await historyCol()
    .where("uid", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      jobId: data.jobId as string,
      siteUrl: data.siteUrl as string,
      status: data.status as string,
      createdAt: data.createdAt?.toDate?.()
        ? (data.createdAt.toDate() as Date).toISOString()
        : "",
      updatedAt: data.updatedAt?.toDate?.()
        ? (data.updatedAt.toDate() as Date).toISOString()
        : "",
    };
  });
}
