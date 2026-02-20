import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase";

// -- Collection helpers -------------------------------------------------------

function requireDb() {
  if (!db) {
    throw new Error("Firestore not available.");
  }
  return db;
}

function capturesCol() {
  return requireDb().collection("gsd_captures");
}

// -- Types --------------------------------------------------------------------

export interface CaptureInput {
  id: string;
  type: "dictation" | "screenshot";
  transcript?: string;
  screenshotUrl?: string;
  context?: string;
}

// -- Capture operations -------------------------------------------------------

/**
 * Persist a new capture document with pending status.
 * Document ID is the caller-provided capture ID (UUID).
 */
export async function saveCapture(input: CaptureInput): Promise<void> {
  const now = FieldValue.serverTimestamp();

  await capturesCol()
    .doc(input.id)
    .set({
      ...input,
      status: "pending",
      routingResult: null,
      destination: null,
      destinationRef: null,
      error: null,
      createdAt: now,
      updatedAt: now,
    });
}

/**
 * Update the status of an existing capture document.
 * Used by the routing pipeline to record progress and results.
 */
export async function updateCaptureStatus(
  id: string,
  update: {
    status: "processing" | "routed" | "failed";
    routingResult?: Record<string, unknown>;
    destination?: string;
    destinationRef?: string;
    error?: string;
  },
): Promise<void> {
  await capturesCol()
    .doc(id)
    .update({
      ...update,
      updatedAt: FieldValue.serverTimestamp(),
    });
}

/**
 * Read a capture document by ID.
 * Returns the document data or null if not found.
 */
export async function getCapture(
  id: string,
): Promise<(CaptureInput & { status: string; context?: string }) | null> {
  const doc = await capturesCol().doc(id).get();
  if (!doc.exists) return null;
  return doc.data() as CaptureInput & { status: string; context?: string };
}

/**
 * List captures with optional status filter, ordered by creation time descending.
 * Used by Builder Inbox admin UI (Phase 4).
 */
export async function getAllCaptures(options?: {
  status?: string;
  limit?: number;
}): Promise<Array<Record<string, unknown>>> {
  const maxResults = options?.limit ?? 50;
  let query = capturesCol().orderBy("createdAt", "desc").limit(maxResults);

  if (options?.status) {
    query = capturesCol()
      .where("status", "==", options.status)
      .orderBy("createdAt", "desc")
      .limit(maxResults);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get counts of captures by status.
 * Used by Builder Inbox dashboard.
 */
export async function getCaptureCounts(): Promise<Record<string, number>> {
  const statuses = ["pending", "processing", "routed", "failed"];
  const counts: Record<string, number> = {};

  for (const status of statuses) {
    const snapshot = await capturesCol()
      .where("status", "==", status)
      .count()
      .get();
    counts[status] = snapshot.data().count;
  }

  return counts;
}
