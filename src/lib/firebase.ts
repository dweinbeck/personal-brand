import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { ContactFormData } from "@/lib/schemas/contact";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.warn(
    "Firebase environment variables are missing. Firestore writes will fail.",
  );
}

const app =
  getApps().length > 0
    ? getApps()[0]
    : projectId && clientEmail && privateKey
      ? initializeApp({
          credential: cert({ projectId, clientEmail, privateKey }),
        })
      : undefined;

export const db = app ? getFirestore(app) : undefined;

export async function saveContactSubmission(
  data: ContactFormData,
): Promise<void> {
  if (!db) {
    throw new Error(
      "Firebase is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.",
    );
  }

  await db.collection("contact_submissions").add({
    ...data,
    createdAt: new Date().toISOString(),
  });
}
