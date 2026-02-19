import "server-only";

import { cookies } from "next/headers";
import { auth } from "@/lib/firebase";

/**
 * Verifies a Firebase ID token and returns the user's UID.
 * Uses the shared Firebase Admin SDK instance from @/lib/firebase.
 * Compatible with the todoist verifyUser() signature that all Tasks
 * server actions depend on.
 */
export async function verifyUser(idToken: string): Promise<string | null> {
  if (!auth) {
    return null;
  }

  try {
    const decoded = await auth.verifyIdToken(idToken);
    return decoded.uid;
  } catch {
    return null;
  }
}

export async function getUserIdFromCookie(): Promise<string | null> {
  const token = (await cookies()).get("__session")?.value;

  if (!token) {
    return null;
  }

  return verifyUser(token);
}
