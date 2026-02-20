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
