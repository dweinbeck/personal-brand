import {
  applicationDefault,
  type Credential,
  cert,
  getApp,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import type { ContactFormData } from "@/lib/schemas/contact";

// NOTE: This file uses process.env directly instead of serverEnv() because
// getCredential() runs at module scope (imported by other modules). Calling
// serverEnv() here would throw in test environments that don't set all env
// vars. The instrumentation.ts hook validates env at startup independently.

function getCredential(): Credential | undefined {
  if (process.env.K_SERVICE) {
    return applicationDefault();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    try {
      return cert({ projectId, clientEmail, privateKey });
    } catch (error) {
      console.error(
        "Firebase Admin SDK credential error — FIREBASE_PRIVATE_KEY is likely a placeholder. Download a real service account key from Firebase Console → Project Settings → Service Accounts.",
        error,
      );
      return undefined;
    }
  }

  console.warn(
    "Firebase credentials not found. On Cloud Run, ADC is used automatically. For local dev, set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.",
  );

  return undefined;
}

const credential = getCredential();

// Main app — no explicit projectId so on Cloud Run the SDK auto-detects the
// GCP hosting project from the metadata server. Firestore data lives there.
const app =
  getApps().length > 0
    ? getApps()[0]
    : credential
      ? initializeApp({ credential })
      : undefined;

// Auth app — uses the Firebase project ID for verifyIdToken. On Cloud Run the
// hosting GCP project may differ from the Firebase project that issues tokens.
const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;

function getAuthApp() {
  if (!credential) return app;
  if (!firebaseProjectId) return app;
  try {
    return getApp("auth");
  } catch {
    return initializeApp({ credential, projectId: firebaseProjectId }, "auth");
  }
}

const authApp = getAuthApp();

export const db = app ? getFirestore(app) : undefined;
export const auth = authApp ? getAuth(authApp) : undefined;

const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
export const storage =
  app && storageBucket ? getStorage(app).bucket(storageBucket) : undefined;

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
